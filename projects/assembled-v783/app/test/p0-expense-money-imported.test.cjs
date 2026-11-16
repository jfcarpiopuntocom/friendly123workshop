'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {browser}=require('./helpers/browser.cjs');
const imported=fs.readFileSync(path.join(__dirname,'../docs/vendor/money-imported.min.js'),'utf8');
function create(importMoney=true,rollback=false){
  const w=browser();
  w.OCAuth={rolActual:()=> 'dueno'};
  if(importMoney) vm.runInContext(imported,w);
  else {
    // The wider financial suite intentionally preloads the imported bundle
    // through F123_QA_IMPORTED_MONEY=1. For the absent-adapter test, remove
    // it *inside* the VM, not only on the host/fixture setup.
    vm.runInContext('window.F123MoneyImported = undefined',w);
    assert.equal(vm.runInContext('typeof window.F123MoneyImported',w),'undefined');
  }
  if(rollback)w.localStorage.setItem('f123_dinero_qa','0');
  return w;
}
test('new expense rounds decimal half-up using loaded imported money; durable export matches',async()=>{
 const w=create();
 const result=await w.request('/api/gastos','POST',{concepto:'Synthetic expense half cent',monto:1.005,metodoPago:'cash'});
 assert.equal(result.monto,1.01,'Dinero half-up: 1.005 USD becomes 101 cents (legacy JS toFixed returns 1.00)');
 const all=await w.request('/api/respaldo/exportar');
 assert.equal(all.gastos.find(g=>g.id===result.id).monto,1.01);
});
test('editing an expense uses the same imported money scale, without changing identity',async()=>{
 const w=create();
 const first=await w.request('/api/gastos','POST',{concepto:'Synthetic editable expense',monto:1});
 const edited=await w.request('/api/gastos/'+first.id,'PATCH',{monto:2.675});
 assert.equal(edited.id,first.id);
 assert.equal(edited.monto,2.68,'half-up cents on PATCH; 2.675 must not produce 2.67');
 const all=await w.request('/api/respaldo/exportar');
 assert.equal(all.gastos.filter(g=>g.id===first.id).length,1);
 assert.equal(all.gastos.find(g=>g.id===first.id).monto,2.68);
});
test('explicit rollback flag 0 keeps legacy expense rounding for new expense and edit',async()=>{
 const w=create(true,true);
 const first=await w.request('/api/gastos','POST',{concepto:'Synthetic legacy override',monto:1.005});
 assert.equal(first.monto,1);
 const edited=await w.request('/api/gastos/'+first.id,'PATCH',{monto:2.675});
 assert.equal(edited.monto,2.67);
});
test('missing imported component retains local-first legacy new expense and edit',async()=>{
 const w=create(false);
 const first=await w.request('/api/gastos','POST',{concepto:'Synthetic missing adapter',monto:1.005});
 assert.equal(first.monto,1);
 const edited=await w.request('/api/gastos/'+first.id,'PATCH',{monto:2.675});
 assert.equal(edited.monto,2.67);
});
test('existing expense is not rewritten when loading Dinero for subsequent writes',async()=>{
 const w=create(false);
 const original=await w.request('/api/gastos','POST',{concepto:'Synthetic historical expense',monto:1.005});
 assert.equal(original.monto,1);
 vm.runInContext(imported,w);
 const current=await w.request('/api/gastos','POST',{concepto:'Synthetic new imported expense',monto:1.005});
 const all=await w.request('/api/respaldo/exportar');
 assert.equal(current.monto,1.01);
 assert.equal(all.gastos.find(g=>g.id===original.id).monto,1);
});

test('throwing imported adapter uses one coherent legacy fallback for create and edit',async()=>{
 const w=create(false);
 w.F123MoneyImported={percentage(){throw Error('synthetic adapter unavailable')}};
 const expense=await w.request('/api/gastos','POST',{concepto:'Synthetic adapter failure',monto:1.005});
 assert.equal(expense.monto,1);
 const edited=await w.request('/api/gastos/'+expense.id,'PATCH',{monto:2.675});
 assert.equal(edited.monto,2.67);
 const snapshot=await w.request('/api/respaldo/exportar');
 assert.equal(snapshot.gastos.filter(x=>x.id===expense.id).length,1,'no duplicate durable expense');
});
test('invalid negative or non-finite expense amount is rejected before durable mutation',async()=>{
 const w=create();
 for(const amount of [-1,0,Infinity,NaN]){
  await assert.rejects(w.request('/api/gastos','POST',{concepto:'Synthetic rejected expense',monto:amount}),/400/);
 }
 const snapshot=await w.request('/api/respaldo/exportar');
 assert.equal(snapshot.gastos.filter(x=>x.concepto==='Synthetic rejected expense').length,0);
});
