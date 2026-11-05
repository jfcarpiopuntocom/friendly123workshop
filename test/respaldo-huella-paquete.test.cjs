'use strict';
// MEJORA 2 — huellaDePaquete(obj): SHA-256 del JSON.stringify con claves ordenadas
// recursivamente (canonico). Queda expuesto en window.OCSync para que la UI selle
// el paquete de respaldo de DESCARGA/WhatsApp en la mejora 3/4, SIN tocar
// /api/respaldo/exportar ni su estructura de retorno. Aqui se valida que el helper
// es deterministico ante reordenamientos de claves y que coincide con el SHA-256
// canonico calculado en Node.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser } = require('./helpers/browser.cjs');
const { webcrypto } = require('node:crypto');
const { createHash } = require('node:crypto');

function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    Object.keys(v).sort().forEach((k) => { o[k] = canon(v[k]); });
    return o;
  }
  return v;
}
const sha = (obj) => createHash('sha256').update(JSON.stringify(canon(obj))).digest('hex');

function conWebcrypto() {
  const w = browser();
  Object.assign(w, { crypto: webcrypto, TextEncoder, TextDecoder });
  return w;
}

test('huellaDePaquete existe y devuelve el SHA-256 canonico (orden de claves estable)', async () => {
  const w = conWebcrypto();
  assert.equal(typeof w.OCSync.huellaDePaquete, 'function', 'huellaDePaquete expuesto en OCSync');

  const a = { schemaVersion: 2, fecha: '2026-11-05', datos: { productos: [{ id: 'p1', nombre: 'A', stock: 3 }], ubicaciones: [] }, fotosPerchas: { x: 1 } };
  const b = { fotosPerchas: { x: 1 }, datos: { ubicaciones: [], productos: [{ stock: 3, id: 'p1', nombre: 'A' }] }, fecha: '2026-11-05', schemaVersion: 2 };

  const [ha, hb] = [await w.OCSync.huellaDePaquete(a), await w.OCSync.huellaDePaquete(b)];
  assert.equal(ha, hb, 'mismo contenido en distinto orden de claves => misma huella');
  assert.equal(ha, sha(a), 'coincide con SHA-256 canonico calculado en Node');
  assert.match(ha, /^[0-9a-f]{64}$/, 'huella es hex de 64 caracteres (SHA-256)');
});

test('huellaDePaquete cambia si cambia el contenido', async () => {
  const w = conWebcrypto();
  const h1 = await w.OCSync.huellaDePaquete({ a: 1, b: 2 });
  const h2 = await w.OCSync.huellaDePaquete({ a: 1, b: 3 });
  assert.notEqual(h1, h2, 'contenido distinto => huella distinta');
});

test('huellaDePaquete devuelve null sin SubtleCrypto (no finge un sello)', async () => {
  const w = browser(); // sin crypto.subtle ni TextEncoder
  assert.equal(await w.OCSync.huellaDePaquete({ a: 1 }), null);
});
