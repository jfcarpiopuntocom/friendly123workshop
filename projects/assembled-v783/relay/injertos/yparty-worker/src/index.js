// PILOTO friendly-123: servidor de sincronizacion Yjs sobre y-partyserver.
// Una sala (Durable Object) por licencia: /parties/tienda/<salaDeLicencia(licencia)>.
// Sin cifrado de punta a punta (decision de JFC, 14 nov 2026).
import { routePartykitRequest } from "partyserver";
import { YServer } from "y-partyserver";
import * as Y from "yjs";
import { salaDeLicencia } from "./sala.js";
import {secureMode,ticketRequest,askAuthority,askAuthorityBatch,unexpired} from "./ws-authority-client.js";
import {photoShaStore,boundedPhotoBody} from "./photo-sha-storage.mjs";

export { salaDeLicencia };

const BLOQUE_BYTES = 512 * 1024;
const COMPACTAR_CAMBIOS = 128;
const COMPACTAR_BYTES = 1024 * 1024;

export class Tienda extends YServer {
  // La sala duerme sin clientes activos; el estado vive en el almacenamiento del DO.
  static options = { hibernate: true };
  ultimaPrueba = new WeakMap();
  falloPersistencia = false;
  comprobacionEnCurso = null;

  secureReady = false;
  pendingAdmissions = new Map();
  outboundQueue = Promise.resolve();
  outboundViews = new WeakMap();
  outboundViewSet = new WeakSet();

  salidaSegura(connection) {
    if (!secureMode(this.env) || this.outboundViewSet.has(connection)) return connection;
    if (this.outboundViews.has(connection)) return this.outboundViews.get(connection);
    const view = new Proxy(connection, {
      get: (target,key) => {
        if (key === 'send') return message => {
          // YServer broadcasts from lifecycle/awareness too. Guard the actual send,
          // not only inbound edits. Preserve per-room output order across async checks.
          const payload = typeof message === 'string' ? message : new Uint8Array(message).slice();
          const next = this.outboundQueue.then(async () => {
            if (connection.readyState !== 1) return;
            const access = connection.state?.accesoFirmado;
            const current = unexpired(access) ? await askAuthority(this.env,'check',access) : null;
            if (!current || !unexpired(current)) { connection.setState(p=>({...p,accesoFirmado:null})); connection.close(1008,'Acceso no autorizado'); return; }
            if (connection.readyState !== 1) return;
            connection.setState(p=>({...p,accesoFirmado:current}));
            connection.send(payload);
          });
          this.outboundQueue = next.catch(() => { if (connection.readyState === 1) connection.close(1008,'Salida no autorizada'); });
          this.ctx.waitUntil(this.outboundQueue);
        };
        const value = Reflect.get(target,key,target);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
    this.outboundViews.set(connection,view); this.outboundViewSet.add(view);
    return view;
  }

  *getConnections(tag) {
    for (const connection of super.getConnections(tag)) {
      if (!secureMode(this.env) || (this.secureReady && unexpired(connection.state?.accesoFirmado))) yield this.salidaSegura(connection);
    }
  }

  isReadOnly(connection) {
    if (!secureMode(this.env)) return false;
    const scopes=connection.state?.accesoFirmado?.principal?.scopes;
    // The commercial ops room is exclusively server-authored. An ops:sale
    // claim permits a future TYPED request, never an arbitrary Yjs update.
    if (this.name.endsWith('-ops')) return true;
    if (this.name.endsWith('-cat')) return !scopes?.includes('cat:write');
    return !scopes?.includes('priv:write');
  }

  async onConnect(conexion, contexto) {
    if (secureMode(this.env)) {
      // A different peer can trigger a recipient sweep while this admission awaits
      // authority. Pending is not revoked, and it must remain unreadable until verified.
      const pending = Promise.resolve().then(async () => {
        const access = await askAuthority(this.env,'check',ticketRequest(contexto.request,this.name));
        if (!access || conexion.readyState !== 1) { conexion.close(1008,'Acceso no autorizado'); return; }
        conexion.setState(previous => ({...previous,accesoFirmado:access}));
        super.onConnect(this.salidaSegura(conexion),contexto);
      });
      this.pendingAdmissions.set(conexion.id,pending);
      try { await pending; }
      finally { if (this.pendingAdmissions.get(conexion.id) === pending) this.pendingAdmissions.delete(conexion.id); }
      return;
    }
    conexion.setState(previo => ({ ...previo, accesoPiloto: identidad(contexto.request) }));
    super.onConnect(conexion, contexto);
  }

  async onMessage(conexion, mensaje) {
    if (secureMode(this.env)) {
      const admission = this.pendingAdmissions.get(conexion.id);
      if (admission) await admission;
      if (this.falloPersistencia || !unexpired(conexion.state?.accesoFirmado)) { conexion.close(1008,'Acceso no autorizado'); return; }
      await this.comprobarConexiones();
      if (!this.falloPersistencia && conexion.readyState === 1 && unexpired(conexion.state?.accesoFirmado)) super.onMessage(this.salidaSegura(conexion),mensaje);
      return;
    }
    if (this.falloPersistencia || !conexion.state?.accesoPiloto || conexion.readyState !== 1) {
      if (conexion.readyState === 1) conexion.close(1008, "Acceso de la sala no válido");
      return;
    }
    // Revisar también los receptores antes de que YServer difunda un cambio.
    this.comprobacionEnCurso ??= this.comprobarConexiones().finally(() => { this.comprobacionEnCurso = null; });
    await this.comprobacionEnCurso;
    if (!this.falloPersistencia && conexion.state?.accesoPiloto && conexion.readyState === 1) {
      super.onMessage(conexion, mensaje);
    }
  }

  async comprobarConexiones() {
    if (secureMode(this.env)) {
      const connections=Array.from(super.getConnections()).filter(c=>c.readyState===1&&!this.pendingAdmissions.has(c.id));
      const live=connections.filter(c=>unexpired(c.state?.accesoFirmado));
      const grants=live.length ? await askAuthorityBatch(this.env,live.map(c=>c.state.accesoFirmado)) : [];
      const byConnection=new Map(live.map((c,i)=>[c,grants?.[i]||null]));
      for(const connection of connections){
        if(connection.readyState!==1)continue;
        const current=byConnection.get(connection);
        if(current){connection.setState(p=>({...p,accesoFirmado:current}));continue;}
        connection.setState(p=>({...p,accesoFirmado:null}));
        connection.close(1008,'Acceso no autorizado');
      }
      return;
    }
    await Promise.all(Array.from(this.getConnections(), async conexion => {
      if (conexion.readyState !== 1) return;
      const acceso = conexion.state?.accesoPiloto;
      if (acceso && await verificarLicencia(this.env, acceso.licencia, acceso.instancia)) return;
      if (conexion.readyState !== 1) return;
      conexion.setState(previo => ({ ...previo, accesoPiloto: null }));
      conexion.close(1008, "Acceso de la sala no válido");
    }));
  }

  async onClose(connection, code, reason, wasClean) {
    // YServer removes awareness on close and can broadcast from that lifecycle hook.
    if (secureMode(this.env)) await this.comprobarConexiones();
    return super.onClose(connection,code,reason,wasClean);
  }

  // The photo room is HTTP-only. Only SHA/bytes/MIME references may later
  // appear in Yjs; raw blobs stay in this same YParty Durable Object's SQL.
  async onRequest(req) {
    if (!secureMode(this.env) || this.env.WS_PHOTO_BLOBS_QA !== '1' ||
        this.name !== this.env.SALA_PILOTO + '-fotos') {
      return new Response('Not found',{status:404});
    }
    const origin=req.headers.get('origin');
    const allowedOrigin=this.env.WS_PHOTO_ORIGIN_QA;
    // The browser uses Authorization, so only an explicitly configured
    // HTTPS origin may see the CORS response. Never reflect arbitrary origins.
    if(origin && (origin!==allowedOrigin || !/^https:\/\/[^/]+$/.test(allowedOrigin||''))) {
      return new Response('Acceso no autorizado',{status:403});
    }
    const cors=origin?{'access-control-allow-origin':allowedOrigin,'vary':'Origin'}:{};
    const reply=(body,status,headers={})=>new Response(body,{status,headers:{...cors,...headers}});
    if (req.method !== 'GET' && req.method !== 'PUT') {
      return reply('Method not allowed',405);
    }
    const auth=req.headers.get('authorization')||'';
    const access={
      token:auth.startsWith('Bearer ')?auth.slice(7):'',
      licenseCode:String(req.headers.get('x-f123-license')||'').trim().toUpperCase(),
      instanceId:req.headers.get('x-f123-instance')||'',
      room:this.name,requiredScope:req.method==='PUT'?'fotos:write':'fotos:read'
    };
    // Consume a new central Owner capability BEFORE reading any photo bytes.
    // Bare license+instance never grant access, and WS_SERVICE_KEY stays inside
    // the Worker's private Service Binding, never in browser headers/response.
    const signed=await askAuthority(this.env,'consume',access);
    if(!signed)return reply('Acceso no autorizado',403,{'cache-control':'no-store'});
    try {
      const sha=new URL(req.url).searchParams.get('sha');
      const photos=photoShaStore(this.ctx.storage);
      if(req.method==='GET'){
        const item=await photos.get(sha);
        if(!item)return reply('Not found',404);
        return reply(item.bytes,200,{
          'content-type':item.tipo,'content-length':String(item.bytes.length),
          'cache-control':'no-store','x-content-type-options':'nosniff'
        });
      }
      const bytes=await boundedPhotoBody(req);
      const result=await photos.put({sha,tipo:req.headers.get('content-type'),bytes});
      return reply(JSON.stringify({sha:result.sha,bytes:result.bytes,tipo:result.tipo}),
        result.created?201:200,{'content-type':'application/json','cache-control':'no-store'});
    }catch(error){
      return reply('Photo unavailable',Number.isInteger(error?.status)?error.status:503,{'cache-control':'no-store'});
    }
  }

  async onCustomMessage(conexion, mensaje) {
    if (mensaje !== "estado-durable" || this.falloPersistencia) return;
    const ahora = Date.now();
    if (ahora - (this.ultimaPrueba.get(conexion) || 0) < 8000) return;
    this.ultimaPrueba.set(conexion, ahora);
    if (this.document.store.pendingStructs || this.document.store.pendingDs) return;
    try {
      const estado = Y.encodeStateAsUpdate(this.document);
      await this.ctx.storage.sync();
      const bytes = await crypto.subtle.digest("SHA-256", estado);
      if (this.falloPersistencia) return;
      const huella = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
      if (secureMode(this.env)) {
        await this.comprobarConexiones();
        if (conexion.readyState !== 1 || !unexpired(conexion.state?.accesoFirmado)) return;
      }
      this.sendCustomMessage(this.salidaSegura(conexion), "estado-durable:" + huella);
    } catch (_) { /* Sin confirmación, la caja conserva el respaldo. */ }
  }

  async onStart() {
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS documento (id INTEGER PRIMARY KEY, contenido BLOB)"
    );
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS documento_bloques (n INTEGER PRIMARY KEY, contenido BLOB NOT NULL)"
    );
    // Diario: cada cambio que llega se anota YA, antes de responder (una caja no puede perder una venta si el
    // Durable Object se reinicia dentro de la espera de 2 s de onSave). onSave compacta y vacia el diario.
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS diario (n INTEGER PRIMARY KEY AUTOINCREMENT, cambio BLOB)"
    );
    // Los bloques de una misma actualización se escriben y retiran juntos.
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS diario_bloques (n INTEGER NOT NULL, parte INTEGER NOT NULL, contenido BLOB NOT NULL, PRIMARY KEY (n, parte))"
    );
    // Hibernated attachments must be checked BEFORE YServer's onStart sync broadcasts.
    if (secureMode(this.env)) await this.comprobarConexiones();
    this.secureReady = true;
    await super.onStart(); // llama a onLoad; el oyente va despues para no re-anotar lo cargado
    this.document.on("update", (cambio) => {
      if (this.falloPersistencia) return;
      try {
        const sql = this.ctx.storage.sql;
        if (cambio.byteLength <= BLOQUE_BYTES) {
          sql.exec("INSERT INTO diario (cambio) VALUES (?)", cambio);
        } else {
          this.ctx.storage.transactionSync(() => {
            const { n } = sql.exec("INSERT INTO diario (cambio) VALUES (X'') RETURNING n").one();
            for (let offset = 0; offset < cambio.byteLength; offset += BLOQUE_BYTES) {
              sql.exec("INSERT INTO diario_bloques (n, parte, contenido) VALUES (?, ?, ?)",
                n, offset / BLOQUE_BYTES, cambio.subarray(offset, offset + BLOQUE_BYTES));
            }
          });
        }
      } catch (_) {
        // Yjs ya cambió en memoria. Reiniciar la sala para reconstruirla desde el diario durable.
        this.falloPersistencia = true;
        this.ctx.abort("No se pudo persistir una actualización de la sala");
        return;
      }
      this.diarioCambios++;
      this.diarioBytes += cambio.byteLength;
    });
  }

  // y-partyserver lo llama una vez al despertar la sala.
  async onLoad() {
    const sql = this.ctx.storage.sql;
    const { bytes } = sql.exec("SELECT COALESCE(SUM(length(contenido)), 0) AS bytes FROM documento_bloques").one();
    if (bytes) {
      const estado = new Uint8Array(bytes);
      let offset = 0;
      for (const { contenido } of sql.exec("SELECT contenido FROM documento_bloques ORDER BY n")) {
        estado.set(new Uint8Array(contenido), offset);
        offset += contenido.byteLength;
      }
      Y.applyUpdate(this.document, estado);
    } else {
      // Las salas del primer piloto guardaban una sola fila.
      const anterior = sql.exec("SELECT contenido FROM documento WHERE id = 1").toArray()[0];
      if (anterior?.contenido) Y.applyUpdate(this.document, new Uint8Array(anterior.contenido));
    }
    this.diarioCambios = 0;
    this.diarioBytes = 0;
    for (const fila of sql.exec("SELECT n, cambio FROM diario ORDER BY n").toArray()) {
      let cambio = fila.cambio;
      if (cambio.byteLength === 0) {
        const { bytes } = sql.exec("SELECT COALESCE(SUM(length(contenido)), 0) AS bytes FROM diario_bloques WHERE n = ?", fila.n).one();
        if (!bytes) throw new Error("Faltan bloques del diario");
        cambio = new Uint8Array(bytes);
        let offset = 0;
        for (const { contenido } of sql.exec("SELECT contenido FROM diario_bloques WHERE n = ? ORDER BY parte", fila.n)) {
          cambio.set(new Uint8Array(contenido), offset);
          offset += contenido.byteLength;
        }
      }
      Y.applyUpdate(this.document, new Uint8Array(cambio));
      this.diarioCambios++;
      this.diarioBytes += cambio.byteLength;
    }
  }

  // y-partyserver lo llama 2 s despues del ultimo cambio (10 s como maximo si no paran).
  // No se llama al vaciarse la sala: por eso existe el diario (ver onStart), que guarda cada cambio al llegar.
  async onSave() {
    // El diario ya es durable. Evitar reescribir todo el historial por una venta aislada.
    if (this.falloPersistencia || (this.diarioCambios < COMPACTAR_CAMBIOS && this.diarioBytes < COMPACTAR_BYTES)) return;
    const estado = Y.encodeStateAsUpdate(this.document);
    const sql = this.ctx.storage.sql;
    const count = Math.ceil(estado.byteLength / BLOQUE_BYTES);
    // Cambiar el resumen y retirar el diario en la misma transaccion.
    this.ctx.storage.transactionSync(() => {
      for (let n = 0; n < count; n++) {
        sql.exec("INSERT OR REPLACE INTO documento_bloques (n, contenido) VALUES (?, ?)",
          n, estado.subarray(n * BLOQUE_BYTES, (n + 1) * BLOQUE_BYTES));
      }
      sql.exec("DELETE FROM documento_bloques WHERE n >= ?", count);
      sql.exec("DELETE FROM documento");
      sql.exec("DELETE FROM diario_bloques");
      sql.exec("DELETE FROM diario");
    });
    this.diarioCambios = 0;
    this.diarioBytes = 0;
  }
}

// ===== GUARDIA DE LICENCIA (solo lectura) =====
// Reusa los registros del Worker friendly123-licencias (cloudflare-worker/worker.js):
// KV LICENCIAS, clave `inst:<instancia>` -> { instanceId, licenseCode, estado, ... }.
// SOLO LECTURA: este Worker NUNCA debe llamar a env.LICENCIAS.put/delete. Esa KV es la
// fuente de verdad de las licencias de clientes y la escribe unicamente friendly123-licencias.
// NUNCA registrar en logs la licencia ni la instancia.
const LICENCIA_RE = /^F123-[0-9A-Z*~$=-]{8,34}$/;
const INSTANCIA_RE = /^[A-Za-z0-9_-]{6,128}$/;

// Devuelve true solo si el aparato existe, pertenece a esa licencia y no esta cortado.
// Mismos criterios que worker.js:
//  - baja: DELETE /licencias/:id mueve el registro a `borrado:<id>`, asi que `inst:` ya no existe;
//  - corte: estado "bloqueada" (unico estado punitivo; cualquier otro valor da servicio).
export async function verificarLicencia(env, licencia, instancia) {
  let reg = null;
  try { reg = await env.LICENCIAS.get("inst:" + instancia, "json"); } catch (_) { reg = null; }
  return !!reg
    && reg.instanceId === instancia
    && String(reg.licenseCode || "").trim().toUpperCase() === licencia
    && String(reg.estado || "").toLowerCase() !== "bloqueada";
}

function identidad(req) {
  // shortcut: la licencia viaja en la URL porque el navegador no deja poner cabeceras
  // en un WebSocket; cambiar a un token corto de un solo uso antes de produccion.
  const params = new URL(req.url).searchParams;
  return {
    licencia: String(params.get("licencia") || "").trim().toUpperCase(),
    instancia: String(params.get("instancia") || "")
  };
}

async function guardia(req, lobby, env) {
  if (secureMode(env)) {
    const separate=env.WS_SEPARATE_ROOMS_QA==='1';
    const admitted=lobby.name.endsWith('-priv') ||
      (separate && (lobby.name.endsWith('-cat') || lobby.name.endsWith('-ops')));
    if (!admitted || !env.WS_AUTHORITY?.fetch || !new URL(req.url).searchParams.get('cap')) return new Response('Acceso no autorizado',{status:403});
    // The public router consumes the one-use ticket BEFORE it upgrades the socket.
    // onConnect checks the consumed grant again before YServer can emit any frame.
    const access = await askAuthority(env,'consume',ticketRequest(req,lobby.name));
    if (!access) return new Response('Acceso no autorizado',{status:403});
    return;
  }
  const { licencia, instancia } = identidad(req);
  if (!LICENCIA_RE.test(licencia) || !INSTANCIA_RE.test(instancia)) {
    return new Response("Falta licencia o instancia", { status: 401 });
  }
  // Una licencia solo entra a su propia sala.
  const sala = await salaDeLicencia(licencia);
  if (![sala, sala + "-cat", sala + "-ops"].includes(lobby.name)) {
    return new Response("Sala ajena", { status: 403 });
  }
  if (!(await verificarLicencia(env, licencia, instancia))) {
    return new Response("Licencia no valida", { status: 401 });
  }
}
// ===== FIN GUARDIA =====

export default {
  async fetch(req, env) {
    // A disabled/missing security configuration must never reopen identifier-only access.
    // The archived b93 prototype is preserved separately; this candidate requires real admission.
    if (env.WS_AUTHORITY_QA !== '1') return new Response('Autoridad no configurada',{status:503});
    // Limit the public endpoint before KV or a Durable Object sees the request.
    const path = new URL(req.url).pathname;
    if (!/^[a-f0-9]{32}$/.test(env.SALA_PILOTO || "")) return new Response("Not found", { status: 404 });
    const photoEndpoint=env.WS_PHOTO_BLOBS_QA==='1' &&
      req.headers.get('Upgrade')?.toLowerCase() !== 'websocket' &&
      path==='/parties/tienda/'+env.SALA_PILOTO+'-fotos';
    if(photoEndpoint && req.method==='OPTIONS'){
      const origin=req.headers.get('origin'),expected=env.WS_PHOTO_ORIGIN_QA;
      const method=req.headers.get('access-control-request-method');
      const requested=(req.headers.get('access-control-request-headers')||'')
        .split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
      const allowedHeaders=new Set(['authorization','x-f123-license','x-f123-instance','content-type']);
      if(!origin || origin!==expected || !/^https:\/\/[^/]+$/.test(expected||'') ||
         !['GET','PUT'].includes(method) || !requested.length ||
         requested.some(x=>!allowedHeaders.has(x)))return new Response('Acceso no autorizado',{status:403});
      return new Response(null,{status:204,headers:{
        'access-control-allow-origin':expected,
        'access-control-allow-methods':'GET, PUT, OPTIONS',
        'access-control-allow-headers':'Authorization, X-F123-License, X-F123-Instance, Content-Type',
        'access-control-max-age':'60','vary':'Origin'
      }});
    }
    const photoHttp=photoEndpoint && (req.method==='GET'||req.method==='PUT');
    // No raw Yjs WebSocket room for photo bytes, and no generic anonymous HTTP.
    const allowedWs=(secureMode(env) ? (env.WS_SEPARATE_ROOMS_QA==='1' ? ["-priv","-cat","-ops"] : ["-priv"]) : ["","-cat","-ops"])
      .some(suffix=>path==='/parties/tienda/'+env.SALA_PILOTO+suffix);
    if (!photoHttp && !allowedWs) return new Response("Not found", { status: 404 });
    if (photoHttp) return (await routePartykitRequest(req,env)) || new Response("Not found",{status:404});
    if (req.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket required", { status: 426 });
    }
    if (env.LIMITE_PILOTO && !(await env.LIMITE_PILOTO.limit({ key: env.SALA_PILOTO })).success) {
      return new Response("Too many connections", { status: 429, headers: { "Retry-After": "60" } });
    }
    return (
      (await routePartykitRequest(req, env, {
        onBeforeConnect: (r, lobby) => guardia(r, lobby, env)
      })) || new Response("Not found", { status: 404 })
    );
  }
};
