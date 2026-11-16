// PILOTO friendly-123: servidor de sincronizacion Yjs sobre y-partyserver.
// Una sala (Durable Object) por licencia: /parties/tienda/<salaDeLicencia(licencia)>.
// Sin cifrado de punta a punta (decision de JFC, 14 nov 2026).
import { routePartykitRequest } from "partyserver";
import { YServer } from "y-partyserver";
import * as Y from "yjs";
import { salaDeLicencia } from "./sala.js";
import {secureMode,ticketRequest,askAuthority,unexpired} from "./ws-authority-client.js";

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

  *getConnections(tag) {
    for (const connection of super.getConnections(tag)) {
      if (!secureMode(this.env) || (this.secureReady && unexpired(connection.state?.accesoFirmado))) yield connection;
    }
  }

  isReadOnly(connection) {
    return secureMode(this.env) && !connection.state?.accesoFirmado?.principal?.scopes.includes('priv:write');
  }

  async onConnect(conexion, contexto) {
    if (secureMode(this.env)) {
      const access = await askAuthority(this.env,'consume',ticketRequest(contexto.request,this.name));
      if (!access || conexion.readyState !== 1) { conexion.close(1008,'Acceso no autorizado'); return; }
      conexion.setState(previous => ({...previous,accesoFirmado:access}));
      super.onConnect(conexion,contexto);
      return;
    }
    conexion.setState(previo => ({ ...previo, accesoPiloto: identidad(contexto.request) }));
    super.onConnect(conexion, contexto);
  }

  async onMessage(conexion, mensaje) {
    if (secureMode(this.env)) {
      if (this.falloPersistencia || !unexpired(conexion.state?.accesoFirmado)) { conexion.close(1008,'Acceso no autorizado'); return; }
      await this.comprobarConexiones();
      if (!this.falloPersistencia && conexion.readyState === 1 && unexpired(conexion.state?.accesoFirmado)) super.onMessage(conexion,mensaje);
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
      await Promise.all(Array.from(super.getConnections(),async connection => {
        if (connection.readyState !== 1) return;
        const access=connection.state?.accesoFirmado;
        const current=unexpired(access) ? await askAuthority(this.env,'check',access) : null;
        if (current && connection.readyState === 1) { connection.setState(p=>({...p,accesoFirmado:current})); return; }
        connection.setState(p=>({...p,accesoFirmado:null}));
        connection.close(1008,'Acceso no autorizado');
      }));
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
      this.sendCustomMessage(conexion, "estado-durable:" + huella);
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
    if (!lobby.name.endsWith('-priv') || !env.WS_AUTHORITY?.fetch || !new URL(req.url).searchParams.get('cap')) return new Response('Acceso no autorizado',{status:403});
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
    // Limit the public endpoint before KV or a Durable Object sees the request.
    const path = new URL(req.url).pathname;
    if (!/^[a-f0-9]{32}$/.test(env.SALA_PILOTO || "") ||
        !(secureMode(env) ? ["-priv"] : ["", "-cat", "-ops"]).some(suffix => path === "/parties/tienda/" + env.SALA_PILOTO + suffix)) {
      return new Response("Not found", { status: 404 });
    }
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
