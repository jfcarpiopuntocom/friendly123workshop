'use strict';
// MEJORA 1 — GET /api/integridad gana diagnostico unificado, aditivo:
//   - `inventario`: resultado de await huellaInventario() (existencias, movimientos,
//     conflictos, sinEpoca, productos...).
//   - `fotosHuerfanas`: conteo de productos y racks con fotoHash no vacio cuyo
//     contenido NO esta en OCFotos.tieneHash().
// Sin quitar NINGUN campo existente (el panel anti-fraude de avanzado-extra.js
// lee ok/total/sellados/colaOk/totalCompartido...). Solo lectura.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser } = require('./helpers/browser.cjs');
const { webcrypto } = require('node:crypto');

async function importar(productos, ubicaciones) {
  const w = browser();
  // webcrypto para que huellaInventario emita existencias/movimientos reales.
  Object.assign(w, { crypto: webcrypto, TextEncoder, TextDecoder });
  const fx = await w.request('/api/respaldo/exportar');
  fx.productos = productos.map((p) => Object.assign({
    id: 'p', nombre: 'Producto', precio: 10, costo: 5, stockActual: 0,
  }, p));
  fx.ubicaciones = ubicaciones || [];
  fx.ventas = []; fx.movimientos = [];
  await w.request('/api/respaldo/importar', 'POST', fx);
  return w;
}

test('GET /api/integridad expone inventario y fotosHuerfanas sin quitar campos existentes', async () => {
  const w = await importar([
    { id: 'p-conf', nombre: 'Con conflicto', stockActual: 5,
      stockEvidencias: { '10': { base: 10, pn: { a: { add: 1, sub: 0 } }, ts: 1 } },
      stockEpochId: 'ep-1', fotoHash: 'h-orphan' },
    { id: 'p-ok', nombre: 'Con foto presente', stockActual: 3,
      stockEvidencias: {}, stockEpochId: 'ep-1', fotoHash: 'h-ok' },
    { id: 'p-nofoto', nombre: 'Sin foto', stockActual: 4,
      stockEvidencias: {}, stockEpochId: 'ep-1' },
  ], [{ id: 'r-orphan', nombre: 'Rack huerfana', tipo: 'propia', fotoHash: 'h-rack-orphan' }]);
  // p-ok tiene su hash presente; p-orphan y r-orphan no.
  w.OCFotos = { tieneHash: async (h) => h === 'h-ok' };

  const res = await w.request('/api/integridad');

  // Campos existentes intactos (no-regresion del panel anti-fraude).
  assert.equal(typeof res.ok, 'boolean');
  assert.equal(typeof res.total, 'number');
  assert.equal(typeof res.sellados, 'number');
  assert.equal(typeof res.historico, 'number');
  assert.equal(typeof res.colaOk, 'boolean');
  assert.equal(typeof res.totalCompartido, 'number');

  // inventario: resultado de huellaInventario().
  assert.ok(res.inventario, 'inventario presente en /api/integridad');
  assert.equal(typeof res.inventario.productos, 'number');
  assert.equal(res.inventario.productos, 3);
  assert.equal(typeof res.inventario.conflictos, 'number');
  assert.equal(res.inventario.conflictos, 1, 'solo p-conf tiene stockEvidencias');
  assert.equal(typeof res.inventario.existencias, 'string');
  assert.equal(typeof res.inventario.movimientos, 'string');

  // fotosHuerfanas: p-orphan + r-orphan (p-ok presente, p-nofoto sin hash).
  assert.equal(res.fotosHuerfanas, 2);
});

test('GET /api/integridad con OCFotos ausente reporta fotosHuerfanas 0 sin romper', async () => {
  const w = await importar([
    { id: 'p-orphan', nombre: 'Huerfana', stockActual: 1, stockEvidencias: {}, stockEpochId: 'ep-1', fotoHash: 'h-orphan' },
  ]);
  // Sin OCFotos no se puede comprobar la huerfanez: 0 (conservador), no excepcion.
  const res = await w.request('/api/integridad');
  assert.equal(res.fotosHuerfanas, 0);
  assert.ok(res.inventario, 'inventario sigue presente');
});
