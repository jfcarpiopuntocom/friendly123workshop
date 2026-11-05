'use strict';
// Frente 2 de visibilidad de stock: GET /api/stock/conflictos.
// Un producto esta en conflicto cuando stockEvidencias no esta vacio; sin epoca
// (stockEpochId vacio o faltante) es senal de conciliacion pendiente. El endpoint
// solo devuelve los productos con enConflicto o sinEpoca, nunca la lista completa.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser } = require('./helpers/browser.cjs');

async function importar(productos) {
  const w = browser();
  const fx = await w.request('/api/respaldo/exportar');
  fx.productos = productos.map((p) => Object.assign({
    id: 'p', nombre: 'Producto', precio: 10, costo: 5, stockActual: 0,
  }, p));
  fx.ventas = []; fx.movimientos = [];
  await w.request('/api/respaldo/importar', 'POST', fx);
  return w;
}

test('GET /api/stock/conflictos devuelve solo productos en conflicto o sin epoca', async () => {
  const w = await importar([
    { id: 'p-conf', nombre: 'Con conflicto', stockActual: 5,
      stockEvidencias: { '10': { pn: { a: { add: 1, sub: 0 } } } }, stockEpochId: 'ep-1' },
    { id: 'p-sinep', nombre: 'Sin epoca', stockActual: 3,
      stockEvidencias: {}, stockEpochId: '' },
    { id: 'p-normal', nombre: 'Normal', stockActual: 4,
      stockEvidencias: {}, stockEpochId: 'ep-3' },
  ]);
  const res = await w.request('/api/stock/conflictos');
  assert.equal(res.total, 2, 'solo conflicto y sin epoca, no la lista completa');
  const porId = Object.fromEntries(res.productos.map((p) => [p.id, p]));

  const conf = porId['p-conf'];
  assert.ok(conf, 'el producto con stockEvidencias aparece');
  assert.equal(conf.enConflicto, true, 'enConflicto:true para stockEvidencias no vacio');
  assert.equal(conf.sinEpoca, false, 'con epoca no es sinEpoca');
  assert.equal(conf.nombre, 'Con conflicto');
  assert.equal(conf.stockActual, 5);
  assert.equal(conf.stockEpochId, 'ep-1');

  const sinE = porId['p-sinep'];
  assert.ok(sinE, 'el producto sin epoca aparece');
  assert.equal(sinE.sinEpoca, true, 'sinEpoca:true para stockEpochId vacio');
  assert.equal(sinE.enConflicto, false, 'sin evidencias no es conflicto');

  assert.ok(!porId['p-normal'], 'un producto normal NO aparece');
});

test('GET /api/stock/conflictos devuelve total 0 cuando no hay conflictos ni sin epoca', async () => {
  const w = await importar([
    { id: 'p-ok', nombre: 'Sano', stockActual: 4,
      stockEvidencias: {}, stockEpochId: 'ep-ok' },
  ]);
  const res = await w.request('/api/stock/conflictos');
  assert.equal(res.total, 0);
  assert.deepEqual(res.productos, []);
});
