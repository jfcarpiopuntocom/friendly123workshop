'use strict';
// MEJORA 5 — Registro auditable de rechazos de stock en stockEvidencias.
// Cuando un cambio de stock remoto es RECHAZADO/ignorado (stockTs futuro o cero
// legado sospechoso), se deja una entrada aditiva en mio.stockEvidencias SIN
// tocar stockActual/stockBase/stockPN/stockTs. El shape (base:null,pn:{}) no
// fabrica una base en _pruebasStockUnir; huellaInventario solo suma el conteo de
// conflictos (un rechazo ES conciliacion pendiente).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser } = require('./helpers/browser.cjs');

async function legacyLocal(w, id, stock, stockTs) {
  const fx = await w.request('/api/respaldo/exportar');
  const p = fx.productos.find((x) => Number(x.stockActual) >= 10);
  p.id = id; p.nombre = 'Rechazo ' + id;
  p.stockActual = stock; p.stockTs = stockTs;
  delete p.stockBase; delete p.stockPN; delete p.stockDeficit; delete p.stockEvidencias; delete p.stockEpochId;
  fx.productos = [p]; fx.ventas = []; fx.movimientos = [];
  await w.request('/api/respaldo/importar', 'POST', fx);
  return w;
}

test('stockTs futuro ignorado deja evidencia de rechazo sin cambiar el stock', async () => {
  const relayNow = 1800000000000;
  const w = browser();
  w.OCLatencia = { ahoraRelay: () => relayNow };
  await legacyLocal(w, 'p-futuro', 5, relayNow - 1000);

  const remoto = w.catalog();
  const rp = remoto.productos.find((x) => x.id === 'p-futuro');
  rp.stockActual = 7;
  rp.stockTs = relayNow + 24 * 60 * 60 * 1000; // futuro imposible
  rp.stockBase = null; rp.stockPN = null;

  w.OCSync.aplicarCatalogo(remoto, null);
  const p = (await w.request('/api/respaldo/exportar')).productos.find((x) => x.id === 'p-futuro');

  assert.equal(p.stockActual, 5, 'el stock local NO cambia');
  assert.equal(p.stockTs, relayNow - 1000, 'el stockTs local NO cambia');
  assert.ok(p.stockEvidencias && typeof p.stockEvidencias === 'object', 'stockEvidencias presente');
  const claves = Object.keys(p.stockEvidencias);
  assert.equal(claves.length, 1, 'una sola entrada de rechazo (determinista, no acumula)');
  const ev = p.stockEvidencias[claves[0]];
  assert.equal(ev.tipo, 'ts-futuro');
  assert.equal(ev.base, null, 'base:null no fabrica una base en _pruebasStockUnir');
});

test('cero legado sospechoso deja evidencia de rechazo sin cambiar el stock', async () => {
  const relayNow = 1800000000000;
  const w = browser();
  w.OCLatencia = { ahoraRelay: () => relayNow };
  await legacyLocal(w, 'p-cero', 5, 1000);

  const remoto = w.catalog();
  const rp = remoto.productos.find((x) => x.id === 'p-cero');
  rp.stockActual = 0;
  rp.stockTs = 2000; // mas nuevo, no futuro: cero legado que borraria un real 5
  rp.stockBase = null; rp.stockPN = null;

  w.OCSync.aplicarCatalogo(remoto, null);
  const p = (await w.request('/api/respaldo/exportar')).productos.find((x) => x.id === 'p-cero');

  assert.equal(p.stockActual, 5, 'el cero legado NO borra el stock real');
  assert.equal(p.stockTs, 1000, 'el stockTs local NO cambia');
  const claves = Object.keys(p.stockEvidencias || {});
  assert.equal(claves.length, 1, 'una sola entrada de rechazo');
  assert.equal(p.stockEvidencias[claves[0]].tipo, 'cero-legado');
  assert.equal(p.stockEvidencias[claves[0]].base, null);
});
