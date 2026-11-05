'use strict';
// MEJORA 3 — GET /api/fotos/huerfanas: lista de productos y perchas (no borrados,
// no demo-ocultos) con fotoHash no vacio cuyo contenido NO esta en OCFotos
// (puntero huerfano). Solo lectura: no muta estado, no escribe en OCFotos.
// Si OCFotos no existe, total 0 (conservador: no se puede comprobar, no se inventa).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser } = require('./helpers/browser.cjs');
const { webcrypto } = require('node:crypto');

async function importar(productos, ubicaciones) {
  const w = browser();
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

test('GET /api/fotos/huerfanas lista solo productos y perchas con fotoHash huerfano', async () => {
  const w = await importar([
    { id: 'p-presente', nombre: 'Foto presente', stockActual: 1, stockEvidencias: {}, stockEpochId: 'ep', fotoHash: 'h-presente' },
    { id: 'p-huerfana', nombre: 'Foto huerfana', stockActual: 2, stockEvidencias: {}, stockEpochId: 'ep', fotoHash: 'h-huerfana' },
    { id: 'p-sinfoto', nombre: 'Sin foto', stockActual: 3, stockEvidencias: {}, stockEpochId: 'ep' },
  ], [
    { id: 'r-presente', nombre: 'Rack presente', tipo: 'propia', fotoHash: 'h-presente' },
    { id: 'r-huerfana', nombre: 'Rack huerfana', tipo: 'propia', fotoHash: 'h-huerfana-rack' },
    { id: 'r-sinfoto', nombre: 'Rack sin foto', tipo: 'propia' },
  ]);
  // Solo h-presente tiene su contenido en OCFotos; el resto es huerfano.
  w.OCFotos = { tieneHash: async (h) => h === 'h-presente' };

  const res = await w.request('/api/fotos/huerfanas');
  assert.equal(res.total, 2, 'solo las dos huerfanas (una de producto, una de percha)');
  const porNombre = Object.fromEntries(res.fotos.map((f) => [f.nombre, f]));

  const prod = porNombre['Foto huerfana'];
  assert.ok(prod, 'el producto huerfano aparece');
  assert.equal(prod.tipo, 'producto');
  assert.equal(prod.id, 'p-huerfana');
  assert.equal(prod.fotoHash, 'h-huerfana');

  const percha = porNombre['Rack huerfana'];
  assert.ok(percha, 'la percha huerfana aparece');
  assert.equal(percha.tipo, 'percha');
  assert.equal(percha.id, 'r-huerfana');
  assert.equal(percha.fotoHash, 'h-huerfana-rack');

  assert.ok(!porNombre['Foto presente'], 'el producto con foto presente NO aparece');
  assert.ok(!porNombre['Rack presente'], 'la percha con foto presente NO aparece');
  assert.ok(!porNombre['Sin foto'], 'producto sin fotoHash no aparece');
  assert.ok(!porNombre['Rack sin foto'], 'percha sin fotoHash no aparece');
});

test('GET /api/fotos/huerfanas devuelve total 0 cuando no hay huerfanas', async () => {
  const w = await importar([
    { id: 'p-ok', nombre: 'Todo presente', stockActual: 1, stockEvidencias: {}, stockEpochId: 'ep', fotoHash: 'h-ok' },
  ], []);
  w.OCFotos = { tieneHash: async () => true };
  const res = await w.request('/api/fotos/huerfanas');
  assert.equal(res.total, 0);
  assert.deepEqual(res.fotos, []);
});

test('GET /api/fotos/huerfanas sin OCFotos reporta total 0 sin romper', async () => {
  const w = await importar([
    { id: 'p-orphan', nombre: 'Huerfana', stockActual: 1, stockEvidencias: {}, stockEpochId: 'ep', fotoHash: 'h-orphan' },
  ]);
  // Sin OCFotos no se puede comprobar la huerfanez: 0 (conservador), no excepcion.
  const res = await w.request('/api/fotos/huerfanas');
  assert.equal(res.total, 0);
  assert.deepEqual(res.fotos, []);
});
