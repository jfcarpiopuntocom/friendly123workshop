import AuthorizedYProvider from './authorized-yprovider.mjs';
import {createOwnerTicketParams} from './ws-owner-ticket-params.mjs';

const host = 'friendly123-yparty-qa-20261114.jfcarpio.workers.dev';
const relayLayer = 'f123_yparty_v1';
const plazoReconectar = 30000;

window.F123YPartyPilot = function (sala, licencia) {
  return {
    canal(doc, tipo, idb, aplicar, usarRelayHabitual) {
      let plazo = null;
      let revision = 0;
      const canal = {
        proveedor: null,
        recuperando: true,
        get recuperacionLocal() { return !idb ? 'sin-almacenamiento' : idb.synced ? 'listo' : 'cargando'; },
        get ws() { return canal.proveedor?.ws; },
        accesoListo() {
          return !canal.recuperando && !doc.store.pendingStructs && !doc.store.pendingDs;
        },
        enviarUpdate() {}, // El proveedor escucha el mismo documento Yjs.
        certificar() {
          const proveedor = canal.proveedor;
          if (!proveedor) return Promise.resolve(null);
          return new Promise(resolve => {
            let leer, pendiente, enviado = false, calculando = false, terminado = false;
            const timer = setTimeout(() => terminar(null), 8000);
            function terminar(prueba) {
              if (terminado) return;
              terminado = true;
              clearTimeout(timer);
              clearTimeout(pendiente);
              doc.off('update', programar);
              proveedor.off('synced', programar);
              if (leer) proveedor.off('custom-message', leer);
              resolve(prueba);
            }
            function listo() {
              return !terminado && !enviado && !calculando && canal.proveedor === proveedor &&
                proveedor.synced && canal.accesoListo();
            }
            function programar() {
              if (!listo()) return;
              clearTimeout(pendiente);
              pendiente = setTimeout(solicitar, 300);
            }
            async function solicitar() {
              if (!listo()) return;
              calculando = true;
              const socket = proveedor.ws;
              const corte = revision;
              const vigente = () => canal.proveedor === proveedor && proveedor.ws === socket &&
                proveedor.synced && revision === corte && canal.accesoListo();
              try {
                const estado = window.Y.encodeStateAsUpdate(doc);
                const bytes = await crypto.subtle.digest('SHA-256', estado);
                if (terminado || !vigente()) return;
                const huella = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
                leer = mensaje => terminar(mensaje === 'estado-durable:' + huella ? vigente : null);
                proveedor.on('custom-message', leer);
                enviado = true;
                proveedor.sendMessage('estado-durable');
              } catch (_) { terminar(null); }
              finally { calculando = false; programar(); }
            }
            doc.on('update', programar);
            proveedor.on('synced', programar);
            programar();
          });
        },
        pausar() {
          cancelarPlazo();
          const proveedor = canal.proveedor;
          if (!proveedor) return;
          canal.proveedor = null;
          proveedor.destroy();
          proveedor.awareness.destroy();
        },
        conectar() {
          if (document.hidden || canal.proveedor || doc.isDestroyed) return;
          let instancia;
          try {
            const owned = JSON.parse(localStorage.getItem('f123_owned') || 'null');
            if (String(owned?.licenseCode || '').trim().toUpperCase() === licencia) instancia = owned.instanceId;
          } catch (_) {}
          if (!/^[A-Za-z0-9_-]{6,128}$/.test(instancia || '')) {
            usarRelayHabitual(); return;
          }
          // The private owner path deliberately handles only the channels for
          // which server-side one-use tickets exist. Never pipe photo bytes to
          // an unauthorized/private Yjs room; keep the encrypted old relay.
          if (tipo !== 'cat' && tipo !== 'ops') {
            usarRelayHabitual(); return;
          }
          const getCredentials = () => {
            let owned;
            try { owned = JSON.parse(localStorage.getItem('f123_owned') || 'null'); } catch (_) {}
            if (String(owned?.licenseCode || '').trim().toUpperCase() !== licencia ||
                owned?.instanceId !== instancia ||
                window.OCAuth?.rolActual?.() !== 'dueno') throw new Error('owner-session-unavailable');
            // Only read the transient PIN that already opened the session.
            // No PIN is put in localStorage, module globals, logs or WebSocket URL.
            const pin = window.OCSecure?.leerPinQueAbre?.()?.owner;
            if (typeof pin !== 'string' || !/^\d{3}$/.test(pin) ||
                pin === '456' || pin === '789') throw new Error('owner-session-unavailable');
            return {kind:'owner',licenseCode:licencia,instanceId:instancia,pin};
          };
          let params;
          try {
            getCredentials();
            params = createOwnerTicketParams({
              licenseCode:licencia,instanceId:instancia,room:sala+'-'+tipo,getCredentials
            });
          } catch (_) { usarRelayHabitual(); return; }
          const proveedor = new AuthorizedYProvider(host, sala + '-' + tipo, doc, {
            party:'tienda',params,disableBc:true,connect:false,
            maxBackoffTime:plazoReconectar
          });
          canal.proveedor = proveedor;
          esperarConexion(proveedor);
          proveedor.on('status', ({ status }) => {
            if (status === 'connecting' && proveedor.ws) proveedor.ws.relayLayer = relayLayer;
          });
          proveedor.on('synced', listo => {
            if (listo) {
              cancelarPlazo();
              completar();
            } else esperarConexion(proveedor);
          });
          // connect() refreshes params asynchronously. A tab hidden during that
          // turn must still disconnect the provider before it can send data.
          proveedor.connect().then(() => {
            if (document.hidden || canal.proveedor !== proveedor || doc.isDestroyed) proveedor.disconnect();
          }).catch(() => {
            if (canal.proveedor !== proveedor) return;
            // Auth failed before the WS could certify any durable state.
            // Keep the local Y.Doc and replayable outbox; the old encrypted
            // relay is the only allowed failback, never bare identifiers.
            canal.proveedor = null;
            cancelarPlazo();
            try { proveedor.destroy(); } catch (_) {}
            usarRelayHabitual();
          });
        }
      };
      function cancelarPlazo() {
        clearTimeout(plazo);
        plazo = null;
      }
      function esperarConexion(proveedor) {
        if (plazo !== null || canal.proveedor !== proveedor) return;
        plazo = setTimeout(() => {
          plazo = null;
          if (canal.proveedor === proveedor && !proveedor.synced && !document.hidden && !doc.isDestroyed) usarRelayHabitual();
        }, plazoReconectar);
      }
      function completar() {
        if (!canal.proveedor?.synced || !idb?.synced || doc.store.pendingStructs || doc.store.pendingDs) return;
        if (!canal.recuperando) return;
        canal.recuperando = false;
        aplicar();
      }
      doc.on('update', () => { revision++; completar(); });
      if (idb) idb.once('synced', completar);
      doc.once('destroy', canal.pausar);
      canal.reanudar = canal.conectar;
      return canal;
    }
  };
};
