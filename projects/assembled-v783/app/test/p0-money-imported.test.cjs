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

test('new candidate sale uses the loaded imported component without a QA flag',async()=>{
  const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};
  const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic default',tipo:'propio'});
  const p=await w.request('/api/productos','POST',{nombre:'Synthetic default',barcode:'MONEY-DEFAULT',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
  vm.runInContext(fs.readFileSync(file,'utf8'),w);
  await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1,opId:'synthetic-money-default'});
  const v=(await w.request('/api/respaldo/exportar')).ventas.find(v=>v.productoId===p.id);
  assert.equal(v.split.montoComisionSocio,0.02);assert.equal(v.split.montoNetoDueno,0.08);
  assert.equal(v.opId,'synthetic-money-default');
});

test('new assistant allocation rounds once with imported decimals and gives the seller the exact remainder',async()=>{
  const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};
  const seller=await w.request('/api/promotoras','POST',{nombre:'Synthetic seller',comisionBase:100});
  const helper=await w.request('/api/promotoras','POST',{nombre:'Synthetic helper',comisionBase:0});
  const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic split',tipo:'socio',comisionSocio:100,promotoraId:seller.id,usarComisionPropia:true});
  const p=await w.request('/api/productos','POST',{nombre:'Synthetic split',barcode:'MONEY-ASSISTANT',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id});
  vm.runInContext(fs.readFileSync(file,'utf8'),w);w.localStorage.setItem('f123_dinero_qa','1');
  await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1,asistenteId:helper.id,asistentePct:15});
  const v=(await w.request('/api/respaldo/exportar')).ventas.find(v=>v.productoId===p.id);
  assert.equal(v.split.montoComisionSocio,0.1);assert.equal(v.split.reparto[1].monto,0.02);assert.equal(v.split.reparto[0].monto,0.08);
  w.localStorage.setItem('f123_dinero_qa','0');
  const edited=await w.request('/api/ventas/'+v.id,'PATCH',{cantidad:3});
  assert.equal(edited.venta.split.montoComisionSocio,0.3);assert.equal(edited.venta.split.reparto[1].monto,0.05);assert.equal(edited.venta.split.reparto[0].monto,0.25);
});

test('explicit legacy rollback retains old rounding without altering an already sealed imported split',async()=>{
  const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};
  const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic rollback',tipo:'propio'});
  const p=await w.request('/api/productos','POST',{nombre:'Synthetic rollback',barcode:'MONEY-ROLLBACK',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
  vm.runInContext(fs.readFileSync(file,'utf8'),w);w.localStorage.setItem('f123_dinero_qa','1');
  await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1});
  const old=(await w.request('/api/respaldo/exportar')).ventas.find(v=>v.productoId===p.id),sealed=JSON.stringify(old);
  w.localStorage.setItem('f123_dinero_qa','0');await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1});
  const sales=(await w.request('/api/respaldo/exportar')).ventas.filter(v=>v.productoId===p.id);
  assert.equal(sales[1].split.montoComisionSocio,0.01);assert.equal(JSON.stringify(sales[0]),sealed);
});

test('correcting a new imported receipt keeps its rounding rule after the new-sale rollback is enabled',async()=>{
  const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};
  vm.runInContext(fs.readFileSync(file,'utf8'),w);
  const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic correction',tipo:'propio'});
  const p=await w.request('/api/productos','POST',{nombre:'Synthetic correction',barcode:'MONEY-CORRECTION',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
  const sale=await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1});
  w.localStorage.setItem('f123_dinero_qa','0');
  const corrected=await w.request('/api/ventas/'+sale.ventaId+'/comision','PATCH',{comisionPct:15,motivo:'Synthetic same agreed percentage',quien:'Synthetic owner'});
  assert.equal(corrected.venta.split.montoComisionSocio,0.02);assert.equal(corrected.venta.split.montoNetoDueno,0.08);
});

test('editing a sealed imported receipt with no calculator cannot mutate sale or stock',async()=>{
  const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};
  vm.runInContext(fs.readFileSync(file,'utf8'),w);
  const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic unavailable',tipo:'propio'});
  const p=await w.request('/api/productos','POST',{nombre:'Synthetic unavailable',barcode:'MONEY-UNAVAILABLE',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
  const sale=await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1}),before=await w.request('/api/respaldo/exportar');
  vm.runInContext('window.F123MoneyImported=undefined',w);
  assert.equal(vm.runInContext('typeof window.F123MoneyImported',w),'undefined');
  await assert.rejects(w.request('/api/ventas/'+sale.ventaId,'PATCH',{cantidad:2}),/503/);
  const after=await w.request('/api/respaldo/exportar');
  assert.equal(JSON.stringify(after.ventas),JSON.stringify(before.ventas));
  assert.equal(after.productos.find(x=>x.id===p.id).stockActual,before.productos.find(x=>x.id===p.id).stockActual);
});

test('legacy receipt corrections keep the old rule after the imported component is available',async()=>{
  const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};w.localStorage.setItem('f123_dinero_qa','0');
  const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic legacy',tipo:'propio'});
  const p=await w.request('/api/productos','POST',{nombre:'Synthetic legacy',barcode:'MONEY-LEGACY-EDIT',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
  const sale=await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1});
  vm.runInContext(fs.readFileSync(file,'utf8'),w);w.localStorage.removeItem('f123_dinero_qa');
  const corrected=await w.request('/api/ventas/'+sale.ventaId+'/comision','PATCH',{comisionPct:15,motivo:'Synthetic unchanged legacy rule',quien:'Synthetic owner'});
  assert.equal(corrected.venta.split.montoComisionSocio,0.01);assert.equal(corrected.venta.split.montoNetoDueno,0.09);
});

test('missing or failed component still commits one new legacy sale with the same opId',async()=>{
 for(const component of [undefined,{percentage(){throw Error('synthetic component unavailable');}}]){
  const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};w.F123MoneyImported=component;
  const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic fallback',tipo:'propio'});
  const p=await w.request('/api/productos','POST',{nombre:'Synthetic fallback',barcode:'MONEY-MISSING',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
  const opId='synthetic-fallback-once';await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1,opId});await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1,opId});
  const backup=await w.request('/api/respaldo/exportar'),sales=backup.ventas.filter(v=>v.productoId===p.id);
  assert.equal(sales.length,1);assert.equal(sales[0].opId,opId);assert.equal(sales[0].split.montoComisionSocio,0.01);assert.equal(backup.productos.find(x=>x.id===p.id).stockActual,3);
 }
});

test('multi-unit currency base is normalized before multiplying its commission percentage',async()=>{
 const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};vm.runInContext(fs.readFileSync(file,'utf8'),w);
 const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic multiunit',tipo:'propio'});
 const p=await w.request('/api/productos','POST',{nombre:'Synthetic multiunit',barcode:'MONEY-MULTIUNIT',precio:0.29,costo:0,stockInicial:8,ubicacionId:rack.id,pctAsociado:50});
 await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:3});
 const v=(await w.request('/api/respaldo/exportar')).ventas.find(v=>v.productoId===p.id);
 assert.equal(v.split.montoBruto,0.87);assert.equal(v.split.montoComisionSocio,0.44);assert.equal(v.split.montoNetoDueno,0.43);
});

test('archiving an assistant cannot leave an obsolete allocation after commission correction',async()=>{
 const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};vm.runInContext(fs.readFileSync(file,'utf8'),w);
 const seller=await w.request('/api/promotoras','POST',{nombre:'Synthetic seller',comisionBase:100});
 const helper=await w.request('/api/promotoras','POST',{nombre:'Synthetic archived helper',comisionBase:0});
 const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic archived allocation',tipo:'socio',comisionSocio:100,promotoraId:seller.id,usarComisionPropia:true});
 const p=await w.request('/api/productos','POST',{nombre:'Synthetic archived allocation',barcode:'MONEY-ARCHIVED',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id});
 const sale=await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1,asistenteId:helper.id,asistentePct:15});
 await w.request('/api/promotoras/'+helper.id,'DELETE');
 const result=await w.request('/api/ventas/'+sale.ventaId+'/comision','PATCH',{comisionPct:50,motivo:'Synthetic correction',quien:'Synthetic owner'});
 assert.equal(result.venta.split.montoComisionSocio,0.05);assert.equal(result.venta.split.reparto,undefined);
});

test('assistant calculation failure selects the legacy rule for the entire new sale exactly once',async()=>{
 const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};vm.runInContext(fs.readFileSync(file,'utf8'),w);
 const engine=w.F123MoneyImported;let calls=0;w.F123MoneyImported={percentage(...args){if(++calls===2)throw Error('synthetic assistant component failure');return engine.percentage(...args);}};
 const helper=await w.request('/api/promotoras','POST',{nombre:'Synthetic fallback helper',comisionBase:0});
 const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic atomic fallback',tipo:'propio'});
 const p=await w.request('/api/productos','POST',{nombre:'Synthetic atomic fallback',barcode:'MONEY-ATOMIC-FALLBACK',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
 await w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:1,asistenteId:helper.id,asistentePct:50,opId:'synthetic-assistant-fallback'});
 const backup=await w.request('/api/respaldo/exportar'),v=backup.ventas.find(v=>v.productoId===p.id);
 assert.equal(v.split.montoComisionSocio,0.01);assert.equal(v.split.montoNetoDueno,0.09);assert.equal(v.split.reparto[1].monto,0.01);assert.equal(v.split.reparto[0].monto,0);
 assert.equal(v.split.moneyEngine,undefined);assert.equal(v.opId,'synthetic-assistant-fallback');assert.equal(backup.productos.find(x=>x.id===p.id).stockActual,3);
});

test('day close creates new imported receipts with the same currency rule and keeps retry idempotent',async()=>{
 const w=require('./helpers/browser.cjs').browser();w.OCAuth={rolActual:()=> 'dueno'};w.localStorage.setItem('f123_owned',JSON.stringify({instanceId:'synthetic-money-close'}));vm.runInContext(fs.readFileSync(file,'utf8'),w);
 const rack=await w.request('/api/ubicaciones','POST',{nombre:'Synthetic day close',tipo:'propio'});
 const p=await w.request('/api/productos','POST',{nombre:'Synthetic day close',barcode:'MONEY-DAY-CLOSE',precio:0.29,costo:0,stockInicial:8,ubicacionId:rack.id,pctAsociado:50});
 const body={opId:'synthetic-money-close-once',items:[{productoId:p.id,cantidad:3}]};
 await w.request('/api/ventas/cierre','POST',body);await w.request('/api/ventas/cierre','POST',body);
 const backup=await w.request('/api/respaldo/exportar'),sales=backup.ventas.filter(v=>v.productoId===p.id);
 assert.equal(sales.length,1);assert.equal(sales[0].split.montoComisionSocio,0.44);assert.equal(sales[0].split.montoNetoDueno,0.43);assert.equal(backup.productos.find(x=>x.id===p.id).stockActual,5);
});
