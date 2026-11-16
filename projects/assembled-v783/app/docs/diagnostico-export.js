/* friendly-123: per-instance reconciliation evidence, explicit owner-only and read-only.
   No PIN/license/room, names, client details, raw photos, ciphertext or data payloads
   enter the downloadable report. A missing ACK is never inferred from a send. */
(function (root) {
  "use strict";
  const VERSION = 1;
  const MAX_ROWS = 30000;
  function owner() {
    return !!(root.OCAuth && typeof root.OCAuth.rolActual === "function" && root.OCAuth.rolActual() === "dueno");
  }
  function ls(key) { try { return root.localStorage.getItem(key); } catch (_) { return null; } }
  function arrayKey(key) {
    try { const a = JSON.parse(ls(key) || "[]"); return Array.isArray(a) ? a : []; } catch (_) { return []; }
  }
  function opId(x) {
    const v = String(x == null ? "" : x);
    return /^[A-Za-z0-9_.:\-]{1,160}$/.test(v) && !/F123-/i.test(v) ? v : null;
  }
  function tipo(x) {
    const v = String(x == null ? "" : x);
    return /^[a-zA-Z0-9_-]{1,48}$/.test(v) && !/F123-/i.test(v) ? v : "otro";
  }
  function num(x) { const n = Number(x); return x != null && Number.isFinite(n) ? n : null; }
  function fecha(x) {
    return typeof x === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(x) ? x : null;
  }
  function exigirSesion(epoch) {
    if (!owner() || root.OC_AUTH_SESSION_EPOCH !== epoch)
      throw new Error("La sesión cambió durante la lectura; exportación cancelada.");
  }
  async function mapearEnBloques(rows, fn) {
    const out = [];
    for (let i = 0; i < rows.length; i += 256)
      out.push(...await Promise.all(rows.slice(i, i + 256).map(fn)));
    return out;
  }
  async function digest(s) {
    if (!root.crypto || !root.crypto.subtle || typeof root.TextEncoder !== "function")
      throw new Error("SHA-256 no disponible: no se exportan identificadores sin anonimizar.");
    const buffer = await root.crypto.subtle.digest("SHA-256", new root.TextEncoder().encode(String(s == null ? "" : s)));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function idSeguro(x) {
    const id = opId(x);
    return id ? (await digest("op:" + id)).slice(0, 24) : null;
  }
  async function fingerprint(rows) {
    const mapped = await mapearEnBloques(rows.slice(0, MAX_ROWS), async x => {
      const fields = x.fields;
      if ("opId" in fields) fields.opId = await idSeguro(fields.opId);
      if (fields.puntero) fields.puntero = (await digest(fields.puntero)).slice(0, 24);
      return { clave: (await digest(x.id || "")).slice(0, 24), ...fields };
    });
    mapped.sort((a, b) => a.clave.localeCompare(b.clave));
    return { total: rows.length, truncado: rows.length > MAX_ROWS, huella: await digest(JSON.stringify(mapped)), filas: mapped };
  }
  function projInventory(x) {
    return { id: x.id, fields: { stock: num(x.stockActual), base: x.stockBase == null ? null : num(x.stockBase),
      deficit: num(x.stockDeficit || 0), epoca: x.stockEpochId ? "presente" : "ausente",
      pnHuella: x.stockPN || {}, conflicto: !!x.stockReconciliacionPendiente,
      borrado: !!x.borrado } };
  }
  function projSales(x) {
    return { id: x.id, fields: { opId: opId(x.opId), unidades: num(x.cantidad),
      precioUnitario: num(x.precioUnit), fecha: fecha(x.fecha),
      anulada: !!x.anulada, devuelta: !!x.devuelta, liquidada: !!x.liquidada } };
  }
  function projMoney(x) {
    return { id: x.id, fields: { opId: opId(x.opId), tipo: tipo(x.tipo || x.type || x.status),
      monto: num(x.monto == null ? (x.amount == null ? x.importe : x.amount) : x.monto),
      amountCents: num(x.amountCents), montoComisionSocio: num(x.montoComisionSocio),
      cantidad: num(x.cantidad), anulado: !!x.anulada, liquidada: !!x.liquidada,
      pagado: x.status === "paid" } };
  }
  function projAccess(x) {
    return { id: x.id, fields: { rol: ["dueno", "admin", "empleado", "contador", "artista"].includes(x.rol) ? x.rol : "otro",
      activo: x.activo !== false, borrado: !!x.borrado } };
  }
  async function withHashedPn(entries) {
    // StockPN actor identifiers can identify a device: export digest only.
    return mapearEnBloques(entries.slice(0, MAX_ROWS), async row => {
      const pn = row.fields.pnHuella || {}, keys = Object.keys(pn).sort();
      row.fields.pn = await Promise.all(keys.map(async k => ({
        actor: (await digest(k)).slice(0, 24), add: num(pn[k] && pn[k].add), sub: num(pn[k] && pn[k].sub)
      })));
      delete row.fields.pnHuella;
      return row;
    });
  }
  async function businessReport(epoch) {
    const res = await root.fetch("/api/diagnostico/reconciliacion", { method: "GET", cache: "no-store" });
    if (!res.ok) throw new Error("El backend rechazó el diagnóstico (" + res.status + ").");
    const d = await res.json();
    exigirSesion(epoch);
    if (!d || d.formato !== 1) throw new Error("El backend no ofrece el formato de diagnóstico requerido.");
    const products = (d.productos || []).map(projInventory);
    await withHashedPn(products);
    const inventories = await fingerprint(products);
    const sales = await fingerprint((d.ventas || []).map(projSales));
    const dinero = {};
    for (const c of ["payouts", "gastos", "transferencias", "ajustesComision", "movimientos"]) {
      dinero[c] = await fingerprint((d[c] || []).map(projMoney));
    }
    const acceso = await fingerprint((d.usuarios || []).map(projAccess));
    const fotos = await fingerprint((d.fotos || []).map(x => ({
      id: x.id, fields: { clase: tipo(x.clase), tienePuntero: !!x.fotoHash,
        puntero: x.fotoHash ? x.fotoHash : null }
    })));
    // Index of ACTUAL locally stored photo blobs, not just catalog pointers.
    // Read only: hashesGuardados() never opens image bytes or rewrites IndexedDB.
    let fotosLocales = { disponible: false, razon: "OCFotos no disponible" };
    try {
      const f = root.OCFotos;
      if (f && typeof f.hashesGuardados === "function") {
        const raw = await f.hashesGuardados();
        const keys = Array.isArray(raw) ? raw : [];
        const set = new Set(keys.map(String));
        const pointers = (d.fotos || []).filter(x => x && x.fotoHash);
        const absent = pointers.filter(x => !set.has(String(x.fotoHash)));
        fotosLocales = {
          disponible: true, blobs: keys.length, punteros: pointers.length,
          punterosSinBytes: absent.length,
          faltaEn: await Promise.all(absent.slice(0, MAX_ROWS).map(async x => ({
            clave: (await digest(x.id)).slice(0, 24),
            foto: (await digest(x.fotoHash)).slice(0, 24)
          }))),
          truncado: absent.length > MAX_ROWS,
          hashesBlobs: await Promise.all(keys.slice(0, MAX_ROWS).map(async h => (await digest(h)).slice(0, 24)))
        };
      }
    } catch (_) { fotosLocales = { disponible: false, razon: "No se pudo verificar IndexedDB" }; }
    return { revision: num(d.revision), persistenciaConfirmadaLocal: d.persistenciaConfirmadaLocal === true, inventario: inventories, ventas: sales,
      dinero, fotos, fotosLocales, acceso, conteos: d.conteos || {} };
  }
  async function transportReport() {
    const legacyLog = arrayKey("f123_sync_log");
    const legacyQueue = arrayKey("f123_sync_cola");
    const queued = new Set(legacyQueue.map(x => opId(x && x.opId)).filter(Boolean));
    const safeOp = async (x, estado) => ({
      opId: await idSeguro(x && x.opId), tipo: tipo(x && x.tipo),
      lamport: num(x && x.lamport), fecha: fecha(x && x.fecha),
      dispositivo: x && x.deviceId ? (await digest(x.deviceId)).slice(0, 24) : null,
      estado
    });
    const logs = await Promise.all(legacyLog.slice(0, MAX_ROWS).map(x => safeOp(x, queued.has(opId(x && x.opId)) ? "pendiente-cola-legacy" : "sin-ACK-individual-verificable")));
    const vistos = new Set(legacyLog.map(x => opId(x && x.opId)));
    const missing = legacyQueue.filter(x => !vistos.has(opId(x && x.opId)));
    const extra = await Promise.all(missing.slice(0, MAX_ROWS).map(x => safeOp(x, "pendiente-cola-legacy")));
    const y = root.OCYjs;
    const channels = {};
    if (y) {
      for (const [name, c] of [["catalogo", y.canal], ["operaciones", y.opsCanal], ["fotos", y.fotosCanal]]) {
        if (!c) { channels[name] = { disponible: false }; continue; }
        const r = typeof c.diagnosticoOutboxLectura === "function" ? c.diagnosticoOutboxLectura() : null;
        const envelopes = r && Array.isArray(r.sobres) ? r.sobres : [];
        channels[name] = {
          disponible: !!r, recuperando: !!c.recuperando, recuperacionLocal: tipo(c.recuperacionLocal),
          socket: c.ws ? num(c.ws.readyState) : null, pendientesRelay: num(c.pendientesRelay),
          huerfanosHeredados: num(c.huerfanosHeredados),
          totalSobres: r ? r.total : null, sinGuardar: r ? r.sinGuardar : null,
          confirmados: r ? r.confirmados : null, truncado: r ? r.truncado : null,
          sobres: await Promise.all(envelopes.map(async e => ({
            sobre: (await digest(e.id)).slice(0, 24), clase: tipo(e.clase),
            huerfano: !!e.huerfano, enVuelo: !!e.enVuelo,
            grupo: e.grupo ? (await digest(e.grupo)).slice(0, 24) : null,
            // Envelope ID is NOT an opId; no false join between these ledgers.
            opId: null
          })))
        };
      }
    }
    let yjsOps = { disponible: false };
    if (y && y.opsMap && typeof y.opsMap.forEach === "function") {
      const ids = [];
      let total = 0;
      y.opsMap.forEach((v, k) => { total++; if (ids.length < MAX_ROWS) ids.push(opId(v && v.opId || k)); });
      yjsOps = { disponible: true, total, truncado: total > MAX_ROWS, opIds: (await mapearEnBloques(ids.filter(Boolean), idSeguro)).sort() };
    }
    let hechos = { disponible: false };
    try {
      const h = root.AMG && root.AMG.Hechos;
      if (h && typeof h.todos === "function") {
        const records = await h.todos();
        const list = Array.isArray(records) ? records : [];
        const safeEvents = await Promise.all(list.slice(0, MAX_ROWS).map(async x => ({
          // A fact ID is typically deviceId-sequence. Hash it; never export deviceId in clear.
          id: x && x.id ? (await digest(x.id)).slice(0, 24) : null,
          opId: await idSeguro(x && x.datos && x.datos.opId),
          tipo: tipo(x && x.tipo), hash: x && typeof x.hash === "string" ? (await digest(x.hash)).slice(0, 24) : null
        })));
        hechos = { disponible: true, total: list.length, truncado: list.length > MAX_ROWS,
          filas: safeEvents, cadenaLocal: typeof h.verificarCadena === "function" ?
          (await h.verificarCadena()) === null ? { ok: true } : { ok: false, detalle: "verificar localmente" } : null };
      }
    } catch (_) { hechos = { disponible: false, error: "no-legible" }; }
    return {
      sync: root.OCSyncControl ? {
        estado: tipo(root.OCSyncControl.estado && root.OCSyncControl.estado()),
        presencia: num(root.OCSyncControl.presencia && root.OCSyncControl.presencia()),
        pendienteDurable: !!(root.OCSyncControl.durabilidadPendiente && root.OCSyncControl.durabilidadPendiente())
      } : { disponible: false },
      yjs: y && typeof y._diag === "function" ? (() => {
        const d = y._diag();
        return { estado: tipo(d.estado), n: d.n, ws: d.ws, ops: d.ops,
          fotos: d.fotos, recuperacionLocalPendiente: !!d.recuperacionLocalPendiente };
      })() : { disponible: false },
      canales: channels, opsYjs: yjsOps, hechos,
      legado: { log: { total: legacyLog.length, truncado: legacyLog.length > MAX_ROWS,
        filas: logs.concat(extra) }, cola: { total: legacyQueue.length,
        truncado: legacyQueue.length > MAX_ROWS,
        idsPendientes: (await mapearEnBloques(legacyQueue.slice(0, MAX_ROWS), x => idSeguro(x && x.opId))).filter(Boolean) },
        colaDesbordada: num(ls("f123_sync_cola_desbordada")) },
      // Acknowledgements here identify transport envelopes, never a business receipt.
      acuseRemotoPorOpId: { disponible: false, motivo: "No inferir ACK de un send ni de la desaparición de la cola legacy." }
    };
  }
  async function construir() {
    if (!owner()) throw new Error("Solo el dueño autorizado puede exportar este informe.");
    const epoch = root.OC_AUTH_SESSION_EPOCH;
    if (!root.crypto?.subtle || typeof root.TextEncoder !== "function")
      throw new Error("SHA-256 no disponible: informe cancelado.");
    const a = await businessReport(epoch);
    exigirSesion(epoch);
    const b = await transportReport();
    exigirSesion(epoch);
    const d = root.OCSyncControl && root.OCSyncControl.deviceIdActual && root.OCSyncControl.deviceIdActual();
    const version = [ls("f123_version_vista"), root.document.querySelector('meta[name="app-version"]')?.content]
      .find(x => typeof x === "string" && /^v\d+\.\d+\.\d+$/.test(x)) || null;
    const informe = {
      esquema: "friendly-123-reconciliacion-v1", versionEsquema: VERSION,
      generadoEn: new Date().toISOString(), version, sha: null,
      shaVerificado: false,
      nombreAparato: (() => {
        // Owner-chosen device nickname, never the client's name or a room/license.
        try {
          const name = root.OCMicelio && typeof root.OCMicelio.miApodo === "function" ?
            String(root.OCMicelio.miApodo() || "").trim().slice(0, 80) : "";
          return name && !/F123-|\b\d{3,6}\b/i.test(name) ? name : null;
        } catch (_) { return null; }
      })(),
      ultimaActividadLocal: (() => {
        const fechas = arrayKey("f123_sync_log").map(x => Date.parse(x && x.fecha || "")).filter(Number.isFinite);
        return fechas.length ? new Date(Math.max(...fechas)).toISOString() : null;
      })(),
      navegador: String(root.navigator.userAgent || "").slice(0, 180),
      dispositivo: d ? (await digest(d)).slice(0, 24) : null,
      contexto: "Instancia local; no implica convergencia, validación cruzada ni ACK remoto",
      almacenamiento: await (async () => {
        try {
          const s = root.navigator.storage;
          if (!s || typeof s.estimate !== "function") return { disponible: false };
          const e = await s.estimate();
          return { disponible: true, usoBytes: num(e.usage), cuotaBytes: num(e.quota) };
        } catch (_) { return { disponible: false }; }
      })(),
      comercial: a, transporte: b,
      pruebas: { capturasFisicas: false, respaldosVerificados: false, canonicidad: "sin-determinar",
        convergencia: "no-verificada", veredicto: "NO-GO" },
      advertencias: [
        "Las huellas de datos del backend reflejan este aparato al momento de leerlos.",
        "Los sobres cifrados del relay NO tienen relación 1:1 garantizada con opId.",
        "Un mismo hash local NO certifica ACK de otros dispositivos.",
        "El informe no incluye imágenes, payloads, PIN, licencias, datos personales ni cifrados.",
        "Los hashes de foto guardados prueban presencia local en el inventario de IDB, no recepción durable remota ni legibilidad de sus bytes.",
        "El SHA exacto de la build no tiene un testigo fiable y se muestra null. El apodo explícito del aparato aparece si existe y no parece un secreto."
      ]
    };
    exigirSesion(epoch);
    return informe;
  }
  async function descargar() {
    const epoch = root.OC_AUTH_SESSION_EPOCH;
    const reporte = await construir();
    exigirSesion(epoch);
    const data = JSON.stringify(reporte, null, 2);
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    const url = root.URL.createObjectURL(blob);
    try {
      const a = root.document.createElement("a");
      a.href = url; a.download = "friendly123-reconciliacion-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
      root.document.body.appendChild(a); a.click(); a.remove();
    } finally { root.URL.revokeObjectURL(url); }
    return reporte;
  }
  root.F123DiagnosticoExport = { construir, descargar };
})(typeof window !== "undefined" ? window : this);
