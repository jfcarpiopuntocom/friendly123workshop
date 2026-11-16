'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(`payment duplicate check and durable write share one real IndexedDB transaction (${name})`,{timeout:30000},async()=>{
  const server=http.createServer((_,res)=>res.end('<!doctype html><title>Synthetic ledger</title>'));
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
   browser=await engine.launch({headless:true});
   const context=await browser.newContext({serviceWorkers:'block'});
   let waiting=[];
   await context.exposeBinding('syntheticHashGate',()=>new Promise(resolve=>{
    waiting.push(resolve);if(waiting.length===2)waiting.splice(0).forEach(r=>r());
   }));
   const base='http://127.0.0.1:'+server.address().port;
   await context.route(u=>u.origin!==base,r=>r.abort());
   const pages=await Promise.all([context.newPage(),context.newPage()]);
   for(const [i,p] of pages.entries()){
    await p.goto(base);
    await p.evaluate(id=>{
     localStorage.setItem('f123_hechos_migrado_v1','1');
     // Emulate an old author still running while activation supplies a new author.
     const get=Storage.prototype.getItem;
     Storage.prototype.getItem=function(k){return k==='f123_owned'?JSON.stringify({instanceId:id}):get.call(this,k)};
     const digest=crypto.subtle.digest.bind(crypto.subtle);let first=true;
     crypto.subtle.digest=async(...args)=>{if(first){first=false;await syntheticHashGate();}return digest(...args)};
     window.OCAuth={rolActual:()=> 'dueno'};
    },'synthetic-author-'+i);
    for(const file of ['hechos.js','cartera.js','vendor/money-imported.min.js'])
     await p.addScriptTag({content:fs.readFileSync(path.join(__dirname,'../docs',file),'utf8')});
   }
   const pay=p=>p.evaluate(()=>AMG.Cartera.registrarMovimiento('client_1','abono',1.005,'Cash',{
    opId:'customer-payment:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
   }));
   const receipts=await Promise.all(pages.map(pay));
   assert.equal(receipts[0].id,receipts[1].id);
   const state=await pages[0].evaluate(async()=>({facts:await AMG.Hechos.todos(),balance:await AMG.Cartera.saldoDeCliente('client_1')}));
   assert.equal(state.facts.length,1);assert.equal(state.facts[0].datos.monto,1.01);
   assert.equal(state.balance.saldo,1.01);
   await pages[0].reload();
   for(const file of ['hechos.js','cartera.js','vendor/money-imported.min.js'])
    await pages[0].addScriptTag({content:fs.readFileSync(path.join(__dirname,'../docs',file),'utf8')});
   assert.equal((await pay(pages[0])).id,receipts[0].id);
   assert.equal(await pages[0].evaluate(()=>AMG.Hechos.contar()),1);
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
 });
}
