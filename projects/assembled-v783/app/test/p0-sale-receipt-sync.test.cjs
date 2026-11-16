'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser } = require('./helpers/browser.cjs');

function device() {
  const w = browser();
  w.OCAuth = { rolActual: () => 'dueno' };
  w.localStorage.setItem('f123_owned', JSON.stringify({instanceId:'qa-recibo-sync'}));
  return w;
}

function transmit(from, to, omitReceipt = false) {
  const catalog = JSON.parse(JSON.stringify(from.OCSync.catalogoPropio()));
  if (omitReceipt) catalog.ventas.forEach(v => { delete v.opId; delete v.reciboCierre; });
  to.OCSync.aplicarCatalogo(catalog, null);
}

test('a synced sale keeps the same opId on a fresh device or after a legacy packet', async () => {
  const a = device(), b = device(), c = device();
  const p = await a.request('/api/productos', 'POST', {nombre:'QA recibo', barcode:'QA-RECIBO', stockInicial:5, precio:12});
  const route = '/api/productos/' + p.id + '/venta';
  const body = {cantidad:2, opId:'sale-QA-receipt-across-devices'};
  const first = await a.request(route, 'POST', body);
  transmit(a, b);
  transmit(a, c, true);
  transmit(a, c);
  for (const receiver of [b,c]) {
    const retry = await receiver.request(route, 'POST', body);
    assert.equal(retry.ventaId, first.ventaId);
    assert.equal(retry.duplicate, true);
    const saved = await receiver.request('/api/respaldo/exportar');
    assert.equal(saved.ventas.filter(v => v.productoId === p.id && v.opId === body.opId).length, 1);
    assert.equal(saved.productos.find(row => row.id === p.id).stockActual, 3);
  }
});

test('day close retransmits its original receipt across devices', async () => {
  const a = device(), b = device();
  const p = await a.request('/api/productos', 'POST', {nombre:'QA cierre', barcode:'QA-CIERRE-A', stockInicial:5, precio:9});
  const route = '/api/ventas/cierre';
  const body = {opId:'sale-QA-day-close-across-devices', items:[{productoId:p.id,cantidad:2}]};
  const first = await a.request(route, 'POST', body);
  transmit(a, b, true);
  transmit(a, b);
  assert.deepEqual(await b.request(route, 'POST', body), first);
  const saved = await b.request('/api/respaldo/exportar');
  assert.equal(saved.ventas.filter(v => v.productoId === p.id).length, 1);
  assert.equal(saved.productos.find(row => row.id === p.id).stockActual, 3);
});


test('restoring a cancellation keeps the replay receipt on the original sale', async () => {
  const a = device(), b = device();
  const p = await a.request('/api/productos', 'POST', {nombre:'QA restauracion', barcode:'QA-RESTAURAR', stockInicial:5, precio:3});
  const route = '/api/productos/' + p.id + '/venta';
  const body = {cantidad:1, opId:'sale-QA-retained-after-restore'};
  const first = await a.request(route, 'POST', body);
  await a.request('/api/ventas/' + first.ventaId + '/cancelar', 'POST', {});
  await a.request('/api/ventas/' + first.ventaId + '/deshacer-cancelacion', 'POST', {});
  transmit(a, b);
  const cancelReceipt = (await b.request('/api/respaldo/exportar')).ventas.find(v => v.id === first.ventaId);
  assert.equal(cancelReceipt.anulada, true);
  assert.equal(cancelReceipt.opId, body.opId);
  const restored = (await b.request('/api/respaldo/exportar')).ventas.find(v => v.restauracionDe === first.ventaId);
  assert.equal(restored.opId, undefined);
  assert.equal((await b.request(route, 'POST', body)).ventaId, first.ventaId);
});



test('a receipt rejects modified payment data on the original and synced device', async () => {
  const { webcrypto } = require('node:crypto');
  const a = device(), b = device();
  for (const w of [a,b]) Object.assign(w, {crypto:webcrypto, TextEncoder});
  const p = await a.request('/api/productos', 'POST', {nombre:'QA precio', barcode:'QA-FIRMA-PRECIO', stockInicial:5, precio:6});
  const route = '/api/productos/' + p.id + '/venta';
  const opId = 'sale-QA-receipt-changed-price';
  const first = await a.request(route,'POST',{opId,cantidad:2,info:{formaPago:'efectivo',precioOverride:6}});
  transmit(a, b);
  for (const w of [a,b]) {
    const retry = await w.request(route,'POST',{info:{precioOverride:6,formaPago:'efectivo'},cantidad:'2',opId});
    assert.equal(retry.ventaId, first.ventaId);
    const changed = await w.fetch(route,{method:'POST',body:JSON.stringify({opId,cantidad:2,info:{formaPago:'efectivo',precioOverride:9}})});
    assert.equal(changed.status, 409);
    assert.equal((await changed.json()).code, 'SALE_OPID_CONFLICT');
    const saved = await w.request('/api/respaldo/exportar');
    assert.equal(saved.ventas.find(v => v.id === first.ventaId).precioUnit, 6);
    assert.equal(saved.productos.find(row => row.id === p.id).stockActual, 3);
  }
});



test('hashing an intent preserves the current role guard and allows login refresh with the same role', async () => {
  for (const realChange of [false,true]) {
    const w = device();
    let finishHash;
    const hashing = new Promise(resolve => {
      Object.assign(w, {TextEncoder, crypto:{randomUUID: w.crypto.randomUUID, subtle:{
        digest() { return new Promise(finish => { finishHash = finish; resolve(); }); }
      }}});
    });
    const p = await w.request('/api/productos', 'POST', {nombre:'QA rol', barcode:'QA-ROL-RECIBO', stockInicial:5, precio:4});
    const venta = w.fetch('/api/productos/'+p.id+'/venta',{method:'POST',body:JSON.stringify({opId:'sale-QA-fence-during-hash',cantidad:1})});
    await hashing;
    w.OC_AUTH_SESSION_EPOCH = (w.OC_AUTH_SESSION_EPOCH || 0) + 1;
    if (realChange) w.OCAuth.rolActual = () => null;
    finishHash(new ArrayBuffer(32));
    assert.equal((await venta).status, realChange ? 403 : 200);
    w.OCAuth.rolActual = () => 'dueno';
    const stock = await w.request('/api/productos');
    assert.equal(stock.find(row => row.id === p.id).stockActual, realChange ? 5 : 4);
  }
});
