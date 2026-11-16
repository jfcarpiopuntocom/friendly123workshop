'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser } = require('./helpers/browser.cjs');

async function fixture() {
  const w = browser();
  w.OCAuth = { rolActual: () => 'dueno' };
  w.localStorage.setItem('f123_owned', JSON.stringify({instanceId: 'synthetic-day-close'}));
  const items = [];
  for (let n = 0; n < 3; n++) {
    const p = await w.request('/api/productos', 'POST', {nombre: 'QA lote '+n, barcode: 'QA-LOTE-'+n, stockInicial: 5, precio: 12, costo: 4});
    items.push({productoId:p.id, cantidad:n+1});
  }
  return {w,items};
}
async function rejectAndVerify(w, route, body) {
  const before = await w.request('/api/respaldo/exportar');
  const ops = [];
  w.OCSyncEmit = (...args) => ops.push(args);
  w.OCEstadoIDB = {soportado:true, guardarConRevision:async()=>false, ultimoError:()=>null};
  const response = await w.fetch(route,{method:'POST',body:JSON.stringify(body)});
  assert.equal(response.status,503);
  const after = await w.request('/api/respaldo/exportar');
  for (const key of ['ventas','productos','movimientos','selloUltimo']) assert.deepEqual(after[key],before[key],key);
  assert.deepEqual(ops,[]);
  return response;
}

test('undo of cancellation only emits after durability; rejection permits exact retry', async()=>{
  const {w,items} = await fixture();
  const id = items[0].productoId;
  const sale = await w.request('/api/productos/'+id+'/venta','POST',{cantidad:1});
  await w.request('/api/ventas/'+sale.ventaId+'/cancelar','POST',{});
  const route = '/api/ventas/'+sale.ventaId+'/deshacer-cancelacion';
  await rejectAndVerify(w,route,{});
  w.OCEstadoIDB = {soportado:false};
  const retry = await w.request(route,'POST',{});
  assert.equal(retry.ventaId,'v-rest-'+sale.ventaId);
  const state = await w.request('/api/respaldo/exportar');
  assert.equal(state.ventas.filter(v=>v.restauracionDe===sale.ventaId).length,1);
  assert.equal(state.productos.find(p=>p.id===id).stockActual,4);
  const duplicate = await w.fetch(route,{method:'POST',body:'{}'});
  assert.equal(duplicate.status,409);
});

test('day close confirms the eligible batch in one commit and keeps per-item validation', async()=>{
  const {w,items} = await fixture();
  items.push({productoId:'invalid-product',cantidad:1});
  let writes = 0;
  await rejectAndVerify(w,'/api/ventas/cierre',{items});
  w.OCEstadoIDB = {soportado:true, guardarConRevision:async()=>{writes++;return true;}};
  const retry = await w.request('/api/ventas/cierre','POST',{items});
  assert.equal(writes,1);
  assert.equal(retry.aplicadas,6);
  assert.equal(retry.errores.length,1);
  const state = await w.request('/api/respaldo/exportar');
  for (const {productoId,cantidad} of items.slice(0,3)) {
    assert.equal(state.productos.find(p=>p.id===productoId).stockActual,5-cantidad);
    assert.equal(state.ventas.filter(v=>v.productoId===productoId).length,1);
  }
});

test('a lost reply after a confirmed close replays its receipt after reopening without a second stock or money effect', async()=>{
  const {w,items} = await fixture();
  items.push({productoId:'invalid-product',cantidad:1});
  const path = '/api/ventas/cierre';
  const intent={items,opId:'sale-synthetic-lost-close-reply'};
  await w.request(path,'POST',intent); // commit, browser loses the response
  const original=await w.request('/api/respaldo/exportar');
  const reopened=browser(w.localStorage);
  reopened.OCAuth={rolActual:()=> 'dueno'};
  const sent=[];
  reopened.OCSyncEmit=(...args)=>sent.push(args);
  const retry=await reopened.request(path,'POST',intent);
  const after=await reopened.request('/api/respaldo/exportar');
  for (const key of ['ventas','productos','movimientos','selloUltimo']) assert.deepEqual(after[key],original[key],key);
  assert.equal(retry.opId,intent.opId);
  assert.equal(retry.aplicadas,6);
  assert.equal(retry.errores.length,1);
  assert.deepEqual(sent,[]);
  const conflict=await reopened.fetch(path,{method:'POST',body:JSON.stringify({...intent,items:[{...items[0],cantidad:2}]})});
  assert.equal(conflict.status,409);
});
