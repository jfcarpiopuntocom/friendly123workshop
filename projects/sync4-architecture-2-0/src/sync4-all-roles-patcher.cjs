'use strict';
/**
 * Sync4 C16 ("TODOS PASAN A LO BUENO"):
 * Surgical patcher enabling Architecture 2.0 / Sync4 for ALL commercial roles
 * (`dueno`, `admin`, `empleado`) in `src/yparty-piloto.js` and `docs/sync-yjs.js`.
 *
 * Root causes verified in v0.8.90:
 *   1. `src/yparty-piloto.js::crearCoordinadorCorte20()` unconditionally calls
 *      `ownerCredentials(instanceId)` and `abrirEscritorDeltaCatalogoCertificado()`,
 *      throwing `owner-session-unavailable` for `admin` and `empleado`.
 *   2. `src/yparty-piloto.js::leerCatalogoPublicoCertificado()` hardcodes
 *      `rolActual() !== 'dueno'`, blocking `admin` and `empleado` from reading -cat.
 *   3. `src/yparty-piloto.js::solicitarTicketComercialEquipo(scope)` omits `'cat:read'`.
 *   4. `docs/sync-yjs.js::_intentarActivarCorte20SiElegible()` blocks `empleado`
 *      (`rolQa !== "dueno" && rolQa !== "admin"`) and omits `permitirDespachoEquipo: true`,
 *      causing `cambiarRolComercial20()` to immediately disarm `modoCorte20Activo` for
 *      `admin` and `empleado`.
 *
 * Security invariants preserved:
 *   - `dueno` retains single-writer `-cat` (`cat:write`) + full `-ops` + `-fotos` write.
 *   - `admin` / `empleado` open READ-ONLY `-cat` (`cat:read`, never `cat:write`) +
 *     role-scoped typed commercial `-ops` + read-only `-fotos` (`fotos:read`).
 *   - Non-commercial / demo roles stay denied.
 */

const YPARTY_COORDINATOR_TARGET = `      try { ownerCredentials(instanceId); } catch (_) { throw unavailable(); }
      if (!privateDoc || typeof expectedFrozenHead !== 'string' ||
          !/^[A-Za-z0-9_.:-]{3,128}$/.test(expectedFrozenHead) ||
          (createProvider !== undefined && typeof createProvider !== 'function')) throw unavailable();
      const store = await this.crearAlmacenDurableOpsTipadas({indexedDB});
      if (typeof store.loadCommittedOpIds !== 'function' ||
          typeof store.markCommitted !== 'function') throw unavailable();
      const reconciler = this.crearDespachadorComercialTipado({
        store, fetch: send, timeoutMs
      });
      let coordinator;
      try {
        coordinator = createVerifiedCrossDeviceFailbackCoordinator({
          store,
          reconciler,
          isVisible: () => !document.hidden,
          onModeChange,
          openCatalogSession: ({onWriterConflict}) =>
            this.abrirEscritorDeltaCatalogoCertificado(privateDoc, expectedFrozenHead, {
              createProvider,
              fetch: send,
              timeoutMs,
              onWriterConflict
            })
        });`;

const YPARTY_COORDINATOR_REPLACEMENT = `      const activeRole = window.OCAuth?.rolActual?.();
      try { commercialCredentials(instanceId); } catch (_) { throw unavailable(); }
      if (!privateDoc || typeof expectedFrozenHead !== 'string' ||
          !/^[A-Za-z0-9_.:-]{3,128}$/.test(expectedFrozenHead) ||
          (createProvider !== undefined && typeof createProvider !== 'function')) throw unavailable();
      const store = await this.crearAlmacenDurableOpsTipadas({indexedDB});
      if (typeof store.loadCommittedOpIds !== 'function' ||
          typeof store.markCommitted !== 'function') throw unavailable();
      const reconciler = this.crearDespachadorComercialTipado({
        store, fetch: send, timeoutMs
      });
      let coordinator;
      try {
        coordinator = createVerifiedCrossDeviceFailbackCoordinator({
          store,
          reconciler,
          isVisible: () => !document.hidden,
          onModeChange,
          openCatalogSession: ({onWriterConflict}) =>
            activeRole === 'dueno'
              ? this.abrirEscritorDeltaCatalogoCertificado(privateDoc, expectedFrozenHead, {
                  createProvider,
                  fetch: send,
                  timeoutMs,
                  onWriterConflict
                })
              : this.leerCatalogoPublicoCertificado(privateDoc, expectedFrozenHead, createProvider, {
                  fetch: send,
                  timeoutMs
                })
        });`;

const YPARTY_TICKET_SCOPE_TARGET = `      const targetRoom = scope === 'fotos:read'
        ? sala + '-fotos'
        : ['ops:sale', 'ops:adjust', 'ops:payment'].includes(scope)
          ? sala + '-ops'
          : null;`;

const YPARTY_TICKET_SCOPE_REPLACEMENT = `      const targetRoom = scope === 'fotos:read'
        ? sala + '-fotos'
        : scope === 'cat:read'
          ? sala + '-cat'
          : ['ops:sale', 'ops:adjust', 'ops:payment'].includes(scope)
            ? sala + '-ops'
            : null;`;

const YPARTY_READONLY_TARGET = `    async leerCatalogoPublicoCertificado(privateDoc, expectedFrozenHead, createProvider) {
      let owned;
      try { owned=JSON.parse(localStorage.getItem('f123_owned')||'null'); } catch (_) {}
      const instanceId=owned?.instanceId;
      const getCredentials=()=>{
        let current;
        try { current=JSON.parse(localStorage.getItem('f123_owned')||'null'); } catch (_) {}
        if(String(current?.licenseCode||'').trim().toUpperCase()!==licencia||
           current?.instanceId!==instanceId||
           window.OCAuth?.rolActual?.()!=='dueno')throw new Error('owner-session-unavailable');
        const pin=window.OCSecure?.leerPinQueAbre?.()?.owner;
        if(typeof pin!=='string'||!/^[0-9]{3}$/.test(pin)||
           pin==='456'||pin==='789')throw new Error('owner-session-unavailable');
        return{kind:'owner',licenseCode:licencia,instanceId,pin};
      };
      if(String(owned?.licenseCode||'').trim().toUpperCase()!==licencia||
         !/^[A-Za-z0-9_-]{6,128}$/.test(instanceId||'')||
         !/^[a-f0-9]{32}$/.test(sala||'')||
         document.hidden)throw new Error('certified read-only catalog unavailable');
      return openCertifiedReadOnlyPublicCatalog({
        privateDoc,Y:window.Y,room:sala+'-cat',licenseCode:licencia,
        instanceId,expectedFrozenHead,getCredentials,createProvider
      });
    },`;

const YPARTY_READONLY_REPLACEMENT = `    async leerCatalogoPublicoCertificado(privateDoc, expectedFrozenHead, createProvider, {
      fetch: send = globalThis.fetch?.bind(globalThis),
      timeoutMs = 6000
    } = {}) {
      const instanceId = readOwnedInstance();
      if(!instanceId || document.hidden) throw new Error('certified read-only catalog unavailable');
      const getCredentials = () => commercialCredentials(instanceId);
      try { getCredentials(); } catch (_) { throw new Error('certified read-only catalog unavailable'); }
      return openCertifiedReadOnlyPublicCatalog({
        privateDoc,Y:window.Y,room:sala+'-cat',licenseCode:licencia,
        instanceId,expectedFrozenHead,getCredentials,createProvider,
        fetch:send,timeoutMs
      });
    },`;

const SYNC_YJS_ELIGIBLE_TARGET = `        if (demoQa || (rolQa !== "dueno" && rolQa !== "admin")) return;`;
const SYNC_YJS_ELIGIBLE_REPLACEMENT = `        if (demoQa || (rolQa !== "dueno" && rolQa !== "admin" && rolQa !== "empleado")) return;`;

const SYNC_YJS_ACTIVATE_TARGET = `          return API.activarCorte20Runtime({ cortarComercio: true });`;
const SYNC_YJS_ACTIVATE_REPLACEMENT = `          return API.activarCorte20Runtime({ cortarComercio: true, rol: rolQa, permitirDespachoEquipo: rolQa === "admin" || rolQa === "empleado" });`;

const YPARTY_TEAM_CREDS_TARGET = `    const team = window.OCSecure?.leerPinQueAbre?.()?.team;`;
const YPARTY_TEAM_CREDS_REPLACEMENT = `    const team = window.OCSecure?.leerPinQueAbre?.()?.team ||
      (window.__f123CentralTeamPrincipal && window.__f123CentralTeamPrincipal.role === role
        ? window.__f123CentralTeamPrincipal : null);`;

function patchYPartyPiloto(source) {
  let out = source;
  let changed = false;
  if (!out.includes('window.__f123CentralTeamPrincipal')) {
    if (!out.includes(YPARTY_TEAM_CREDS_TARGET)) throw new Error('Target teamCredentials line not found in src/yparty-piloto.js');
    out = out.replace(YPARTY_TEAM_CREDS_TARGET, YPARTY_TEAM_CREDS_REPLACEMENT);
    changed = true;
  }
  if (!out.includes('activeRole === \'dueno\'')) {
    if (!out.includes(YPARTY_COORDINATOR_TARGET)) throw new Error('Target crearCoordinadorCorte20 block not found in src/yparty-piloto.js');
    out = out.replace(YPARTY_COORDINATOR_TARGET, YPARTY_COORDINATOR_REPLACEMENT);
    changed = true;
  }
  if (!out.includes("scope === 'cat:read'")) {
    if (!out.includes(YPARTY_TICKET_SCOPE_TARGET)) throw new Error('Target solicitarTicketComercialEquipo block not found in src/yparty-piloto.js');
    out = out.replace(YPARTY_TICKET_SCOPE_TARGET, YPARTY_TICKET_SCOPE_REPLACEMENT);
    changed = true;
  }
  if (!out.includes('const getCredentials = () => commercialCredentials(instanceId);')) {
    if (!out.includes(YPARTY_READONLY_TARGET)) throw new Error('Target leerCatalogoPublicoCertificado block not found in src/yparty-piloto.js');
    out = out.replace(YPARTY_READONLY_TARGET, YPARTY_READONLY_REPLACEMENT);
    changed = true;
  }
  return { changed, source: out };
}

function patchSyncYjs(source) {
  let out = source;
  let changed = false;
  if (!out.includes('rolQa !== "empleado"')) {
    if (!out.includes(SYNC_YJS_ELIGIBLE_TARGET)) throw new Error('Target _intentarActivarCorte20SiElegible role guard not found in docs/sync-yjs.js');
    out = out.replace(SYNC_YJS_ELIGIBLE_TARGET, SYNC_YJS_ELIGIBLE_REPLACEMENT);
    changed = true;
  }
  if (!out.includes('permitirDespachoEquipo: rolQa === "admin" || rolQa === "empleado"')) {
    if (!out.includes(SYNC_YJS_ACTIVATE_TARGET)) throw new Error('Target activarCorte20Runtime call not found in docs/sync-yjs.js');
    out = out.replace(SYNC_YJS_ACTIVATE_TARGET, SYNC_YJS_ACTIVATE_REPLACEMENT);
    changed = true;
  }
  return { changed, source: out };
}

module.exports = { patchYPartyPiloto, patchSyncYjs };
