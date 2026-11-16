"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const file = fs.readFileSync(path.join(__dirname, "..", "docs", "diagnostico-export.js"), "utf8");
function harness({ role = "dueno", apiStatus = 200, commercial = null } = {}) {
  const values = {
    f123_sync_log: JSON.stringify([{ opId: "op-1", tipo: "venta", lamport: 10, deviceId: "device-personal",
      fecha: "2026-11-14T12:00:00Z", payload: { cliente: "SECRET_CLIENT", licencia: "F123-SECRET" } }]),
    f123_sync_cola: JSON.stringify([{ opId: "op-1", tipo: "venta", deviceId: "device-personal",
      payload: { pin: "SECRETPIN" } }]),
    f123_version_vista: "v0.7.80"
  };
  const d = commercial || {
    formato: 1, revision: 55, persistenciaConfirmadaLocal: true,
    productos: [{ id: "product-1", stockActual: 4, stockBase: 5,
      stockPN: { "device-personal": { add: 0, sub: 1 } }, stockEpochId: "epoch-1", stockDeficit: 0 }],
    ventas: [{ id: "sale-1", opId: "op-1", fecha: "2026-11-14T12:00:00Z",
      cantidad: 1, precioUnit: 18, clienteNombre: "SECRET_CLIENT" }],
    payouts: [{ id: "pay-1", opId: "pay-op", amount: 4.5 }],
    gastos: [], transferencias: [], ajustesComision: [], movimientos: [],
    usuarios: [{ id: "staff-1", rol: "empleado", activo: true, pin: "SECRETPIN" }],
    fotos: [{ id: "producto:product-1", clase: "producto", fotoHash: "photo-secret-hash" }],
    conteos: { clientes: 3 }
  };
  const calls = [];
  const root = {
    OCAuth: { rolActual: () => role },
    crypto: webcrypto, TextEncoder, navigator: { userAgent: "Chromium fixture" },
    localStorage: { getItem: k => values[k] || null },
    document: { querySelector: () => null },
    fetch: async (url, opts) => { calls.push({ url, opts }); return { ok: apiStatus === 200,
      status: apiStatus, json: async () => d }; },
    OCYjs: {
      _diag: () => ({ estado: "conectado", n: { productos: 1 }, ws: { catalogo: 1 }, ops: 1, fotos: 1,
        recuperacionLocalPendiente: false, roomId: "F123-SECRET" }),
      canal: { recuperando: false, pendientesRelay: 1, diagnosticoOutboxLectura: () => ({
        total: 1, truncado: false, sinGuardar: 0, confirmados: 3,
        sobres: [{ id: "raw-envelope", clase: "operacion", enVuelo: true }]
      }) },
      opsMap: new Map([["op-1", { opId: "op-1", payload: { pin: "SECRETPIN" } }]])
    },
    OCSyncControl: { estado: () => "conectado", presencia: () => 2, durabilidadPendiente: () => true,
      deviceIdActual: () => "device-personal" },
    AMG: { Hechos: { todos: async () => [{ id: "device-personal-1", tipo: "venta", datos: { opId: "op-1", pin: "SECRETPIN" },
      hash: "strong-hash" }], verificarCadena: async () => null } }
  };
  root.window = root;
  vm.runInNewContext(file, { window: root, TextEncoder, Uint8Array, Blob, Date, Promise, Set, Map }, { filename: "diagnostico-export.js" });
  return { root, calls };
}
test("owner export is read-only, granular and does not leak secrets", async () => {
  const { root, calls } = harness();
  const result = await root.F123DiagnosticoExport.construir();
  const s = JSON.stringify(result);
  assert.equal(result.esquema, "friendly-123-reconciliacion-v1");
  assert.equal(result.comercial.inventario.filas[0].stock, 4);
  const id = result.comercial.ventas.filas[0].opId;
  assert.match(id, /^[a-f0-9]{24}$/);
  assert.equal(result.transporte.legado.cola.idsPendientes[0], id);
  assert.equal(result.transporte.hechos.filas[0].opId, id);
  assert.equal(result.transporte.opsYjs.opIds[0], id);
  assert.equal(result.transporte.canales.catalogo.sobres[0].opId, null);
  assert.equal(result.transporte.acuseRemotoPorOpId.disponible, false);
  assert.equal(result.pruebas.veredicto, "NO-GO");
  for (const secret of ["SECRET_CLIENT", "SECRETPIN", "F123-SECRET", "device-personal", "raw-envelope", "photo-secret-hash", "staff-1"]) {
    assert.equal(s.includes(secret), false, "secret leaked: " + secret);
  }
  assert.deepEqual(calls.map(c => [c.url, c.opts.method]),
    [["/api/diagnostico/reconciliacion", "GET"]]);
});
test("owner authorization fails closed before reading business data", async () => {
  const { root, calls } = harness({ role: "empleado" });
  await assert.rejects(root.F123DiagnosticoExport.construir(), /Solo el dueño/);
  assert.equal(calls.length, 0);
});
test("a backend rejection must not generate partial or successful reports", async () => {
  const { root } = harness({ apiStatus: 403 });
  await assert.rejects(root.F123DiagnosticoExport.construir(), /rechazó/);
});
test("unavailable crypto must not export unredacted identifiers", async () => {
  const { root } = harness();
  root.crypto = null;
  await assert.rejects(root.F123DiagnosticoExport.construir(), /SHA-256/);
});

test("malformed dates and arbitrary values in ID fields cannot leak into the file", async () => {
  const { root } = harness({ commercial: {
    formato: 1, ventas: [{id: "unsafe-raw-sale", opId: "unsafe-contact-identifier", fecha: "2026-11-14 SECRET_DATE"}]
  } });
  root.localStorage.getItem = () => "private-version-value";
  const report = await root.F123DiagnosticoExport.construir();
  const exported = JSON.stringify(report);
  for (const raw of ["unsafe-raw-sale", "unsafe-contact-identifier", "SECRET_DATE", "private-version-value"])
    assert.ok(!exported.includes(raw), raw);
  assert.equal(report.comercial.ventas.filas[0].fecha,null);
});
test("a new owner session cannot download the previous session's read", async () => {
  const { root } = harness();
  root.OC_AUTH_SESSION_EPOCH = 1;
  root.navigator.storage = { estimate: async () => { root.OC_AUTH_SESSION_EPOCH = 2; return {}; } };
  await assert.rejects(root.F123DiagnosticoExport.construir(), /sesión cambió/);
});

test("the live backend route stays owner-only and leaves all business state intact", async () => {
  const app = require("./helpers/browser.cjs").browser();
  let role = "dueno";
  app.OCAuth = {rolActual: () => role};
  const product = await app.request("/api/productos","POST",{
    nombre:"PRIVATE PRODUCT NAME",barcode:"DIAG-SYNTHETIC",stockInicial:6,precio:15
  });
  await app.request("/api/productos/"+product.id+"/venta","POST",{cantidad:2,opId:"diag-synthetic-receipt"});
  const before = await app.request("/api/respaldo/exportar");
  const projection = await app.request("/api/diagnostico/reconciliacion");
  role="empleado";
  assert.equal((await app.fetch("/api/diagnostico/reconciliacion")).status,403);
  role="dueno";
  assert.deepEqual(await app.request("/api/respaldo/exportar"),before);
  assert.ok(!JSON.stringify(projection).includes("PRIVATE PRODUCT NAME"));
  assert.ok(projection.ventas.some(v=>v.opId==="diag-synthetic-receipt"));
});

test("three private cuts are comparable with the same pseudonym and explicit absence", async () => {
  const { comparar } = require("../scripts/compare-reconciliacion.cjs");
  const fixtures = Array.from({length:3},() => harness());
  fixtures[2].root.OCYjs.opsMap.clear();
  const reports = await Promise.all(fixtures.map(({root})=>root.F123DiagnosticoExport.construir()));
  const result = comparar(reports);
  assert.equal(result.operaciones.faltaRecibirOAplicar[0].total,0);
  assert.equal(result.operaciones.faltaRecibirOAplicar[2].opIds[0],reports[0].comercial.ventas.filas[0].opId);
  assert.equal(result.veredicto,"NO-GO");
});

test("a large notebook reports truncation explicitly without an unbounded digest queue", async () => {
  const { root } = harness({ commercial:{
    formato:1,
    productos:Array.from({length:20000},(_,i)=>({id:"product-"+i,stockActual:i%10})),
    movimientos:Array.from({length:10000},(_,i)=>({id:"mov-"+i,opId:"operation-"+i,tipo:"venta"}))
  }});
  root.OCYjs.opsMap = new Map(Array.from({length:30001},(_,i)=>["qa-"+i,{opId:"qa-"+i}]));
  const report = await root.F123DiagnosticoExport.construir();
  assert.equal(report.comercial.inventario.total,20000);
  assert.equal(report.comercial.dinero.movimientos.filas.length,10000);
  assert.equal(report.transporte.opsYjs.total,30001);
  assert.equal(report.transporte.opsYjs.opIds.length,30000);
  assert.equal(report.transporte.opsYjs.truncado,true);
});
