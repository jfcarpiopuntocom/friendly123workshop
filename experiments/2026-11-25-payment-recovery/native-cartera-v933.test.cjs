'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const root=__dirname+'/';
const sources=['hechos-combined-v933.experimental.js','cartera-combined-v933.experimental.js'].map(p=>fs.readFileSync(root+p,'utf8'));
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>isolated synthetic ledger</title>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{for(const engine of [chromium,webkit]){
  const browser=await engine.launch();
  try{
   const page=await browser.newPage();const url='http://127.0.0.1:'+server.address().port;
   await page.route('**/*',r=>r.request().url().startsWith(url+'/')?r.continue():r.abort());
   await page.goto(url);await page.evaluate(()=>{localStorage.setItem('f123_hechos_migrado_v1','1');localStorage.setItem('f123_owned',JSON.stringify({instanceId:'synthetic-device'}));});
   for(const content of sources)await page.addScriptTag({content});
   const result=await page.evaluate(async()=>{
    const H=AMG.Hechos,C=AMG.Cartera, ids={};
    const add=async(t,d)=>{const h=await H.registrar('cartera_'+t,d);if(!h)throw Error('synthetic append failed');return h};
    const charge=(c,n,op,ventaId)=>add('cargo',{clienteId:c,monto:n,opId:op,motivo:'fixture',...(ventaId?{ventaId}:{})});
    const pay=(c,op,nested=false)=>{const d={clienteId:c,monto:10,opId:op,motivo:'fixture'};return add('abono',nested?{payload:d}:d)};
    await charge('A02',35,'c02');await pay('A02','p02');await pay('A02','p02');
    await charge('A04',35,'c04');await pay('A04','p04a');await pay('A04','p04b',true);
    await charge('A05',108,'c05a','old');await charge('A05',108,'c05b','new');const p=await pay('A05','p05');
    const sales=[{id:'old',clienteId:'A05',precioUnit:108,cantidad:1,anulada:true,info:{formaPago:'fiado',fiadoAtomico:true}},{id:'new',clienteId:'A05',precioUnit:108,cantidad:1,restauracionDe:'old',info:{formaPago:'fiado',fiadoAtomico:true}}];
    const before=await H.todos();
    const base=['A02','A04','A05'].map(c=>C.calcularSaldo(before,c,sales).saldo);
    const r1=await C.aplicarAbono('A05',p.id,[{cargoKey:'venta:new',monto:10}],sales,'apply-05');
    const r2=await C.aplicarAbono('A05',p.id,[{cargoKey:'venta:old',monto:10}],sales,'apply-05');
    let abortCount=0,abortNext=true;const original=IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add=function(...args){const req=original.apply(this,args);if(abortNext&&this.name==='hechos'){abortNext=false;const tx=this.transaction;req.addEventListener('success',()=>{abortCount++;tx.abort()});}return req;};
    let rejected=false;
    try{await C.registrarMovimiento('abort','abono',10,'fixture',{opId:'retry-original'});}catch(e){rejected=true;}
    finally{IDBObjectStore.prototype.add=original;}
    const retry=await C.registrarMovimiento('abort','abono',10,'fixture',{opId:'retry-original'});
    const replay=await C.registrarMovimiento('abort','abono',10,'fixture',{opId:'retry-original'});
    const all=await H.todos(),after=C.calcularSaldo(all,'A05',sales);
    return {base,applied:after.movimientos.find(m=>m.tipo==='cargo').aplicado,sameAllocation:r1.id===r2.id,storedKey:r1.datos.partes[0].cargoKey,abortCount,rejected,samePayment:retry.id===replay.id,receipts:all.filter(h=>h.datos.opId==='retry-original').length,count:all.length,sales};
   });
   assert.deepEqual(result.base,[-25,-15,-98]);assert.equal(result.applied,10);assert.equal(result.sameAllocation,true);assert.equal(result.storedKey,'venta:new');assert.equal(result.abortCount,1);assert.equal(result.rejected,true);assert.equal(result.samePayment,true);assert.equal(result.receipts,1);
   await page.reload();for(const content of sources)await page.addScriptTag({content});
   const after=await page.evaluate(async sales=>{const all=await AMG.Hechos.todos();const a=AMG.Cartera.calcularSaldo(all,'A05',sales);return {count:all.length,saldo:a.saldo,aplicado:a.movimientos.find(m=>m.tipo==='cargo').aplicado,abort:AMG.Cartera.calcularSaldo(all,'abort',sales).saldo};},result.sales);
   assert.deepEqual(after,{count:result.count,saldo:-98,aplicado:10,abort:10});
   console.log(engine.name(),JSON.stringify({result,after}));
  }finally{await browser.close()}
 }}finally{await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
