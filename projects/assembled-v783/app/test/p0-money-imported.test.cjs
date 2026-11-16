'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const file=path.join(__dirname,'../docs/vendor/money-imported.min.js');
function adapter(){
  const window={};
  if(fs.existsSync(file))vm.runInNewContext(fs.readFileSync(file,'utf8'),{window});
  assert.equal(typeof window.F123MoneyImported?.percentage,'function','imported money adapter is available');
  return window.F123MoneyImported;
}
test('decimal half-cent rounds explicitly up and conserves the whole sale',()=>{
  const money=adapter();
  const result=money.percentage(1.005,100);
  assert.equal(result.commissionCents,101);
  assert.equal(result.baseCents,101);
});
test('fractional percentage uses decimal scaling instead of binary percentage arithmetic',()=>{
  const result=adapter().percentage(10,33.33);
  assert.equal(result.commissionCents,333);
  assert.equal(result.baseCents,1000);
});
test('large scaled multiplication preserves the exact cent before rounding',()=>{
  assert.equal(adapter().percentage(6767433458.62,87.94224436).commissionCents,595143286908);
});
test('invalid or unsafe amounts cannot become a plausible zero',()=>{
  const money=adapter();
  for(const value of [NaN,Infinity,-1,'10',Number.MAX_SAFE_INTEGER])assert.throws(()=>money.percentage(value,50));
  for(const pct of [-1,101,NaN])assert.throws(()=>money.percentage(10,pct));
});
test('new QA sale uses imported decimal rounding and preserves the previously stored split',async()=>{
  const {browser}=require('./helpers/browser.cjs');
  const w=browser();
  w.OCAuth={rolActual:()=> 'dueno'};
  const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic',tipo:'propio'});
  const p=await w.request('/api/productos','POST',{nombre:'Synthetic',barcode:'MONEY-IMPORTED',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
  await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1});
  const old=(await w.request('/api/respaldo/exportar')).ventas.find(v=>v.productoId===p.id);
  const snapshot=JSON.stringify(old);
  vm.runInContext(fs.readFileSync(file,'utf8'),w);
  w.localStorage.setItem('f123_dinero_qa','1');
  await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1});
  const sales=(await w.request('/api/respaldo/exportar')).ventas.filter(v=>v.productoId===p.id);
  assert.equal(sales[1].split.montoComisionSocio,0.02);
  assert.equal(sales[1].split.montoNetoDueno,0.08);
  assert.equal(JSON.stringify(sales[0]),snapshot,'previous sale unchanged');
});
