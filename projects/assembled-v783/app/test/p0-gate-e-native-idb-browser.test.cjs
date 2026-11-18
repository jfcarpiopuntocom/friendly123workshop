'use strict';
// Gate E: run the real sync-yjs.js outbox function source against actual
// browser IndexedDB in two pages on the same origin, never an IDB polyfill.
// No external network, PIN, user license, production services or deployment.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const src=fs.readFileSync(path.join(__dirname,'../docs/sync-yjs.js'),'utf8');
const start=src.indexOf('    var _v2DB = null, _v2Ready = null, _v2Cache = null');
const stop=src.indexOf('    var _durableQueue = leerOutbox()',start);
assert.ok(start>0 && stop>start,'source-extracted exact outbox, not cloned algorithm');
const actual=src.slice(start,stop);
const metaKey='f123_relay_outbox_v2-y:meta';
const prefix='f123_relay_outbox_v2-y:op:';
const item=id=>({k:'op',id,c:'synthetic-only-'+id,group:id,fingerprint:'hash-'+id});
const ids=saved=>saved.pending.map(x=>x.id).sort();

async function server(){
 const app=http.createServer((_req,res)=>{
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
  res.end('<!doctype html><html><head><title>Gate E only</title></head><body>synthetic IDB test</body></html>');
 });
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 return{url:'http://127.0.0.1:'+app.address().port,close:()=>new Promise(resolve=>app.close(resolve))};
}

async function seed(page,name){
 await page.evaluate(async({name,metaKey})=>{
  const db=await new Promise((resolve,reject)=>{
   const req=indexedDB.open(name,1);
   req.onupgradeneeded=()=>req.result.createObjectStore('custom');
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error);
  });
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('custom','readwrite');
   tx.objectStore('custom').put({v:2,rev:1,confirmed:[],checkpoint:''},metaKey);
   tx.oncomplete=resolve;
   tx.onabort=tx.onerror=()=>reject(tx.error||Error('seed failed'));
  });
  db.close();
 },{name,metaKey});
}

async function install(page,name,noLocks){
 await page.evaluate(async({name,actual,noLocks})=>{
  const db=await new Promise((resolve,reject)=>{
   const req=indexedDB.open(name,1);
   req.onupgradeneeded=()=>req.result.createObjectStore('custom');
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error);
  });
  const get=k=>new Promise((resolve,reject)=>{
   const tx=db.transaction('custom','readonly'),req=tx.objectStore('custom').get(k);
   req.onsuccess=()=>resolve(req.result);
   req.onerror=tx.onabort=()=>reject(req.error||tx.error||Error('get failure'));
  });
  const set=(k,v)=>new Promise((resolve,reject)=>{
   const tx=db.transaction('custom','readwrite');
   tx.objectStore('custom').put(v,k);
   tx.oncomplete=resolve;
   tx.onabort=tx.onerror=()=>reject(tx.error||Error('set failure'));
  });
  const unsaved=[],signals=[];
  // Only the copied FUNCTION BODY is production source; all dependencies are
  // real browser objects or an intentionally local test fixture.
  const mk=new Function('API','suffix','persistencia','IDBKeyRange','navigator',
   '_outboxKey','_outbox','_unsaved','_groupAcks','avisarDurable','log',
   'localStorage','window','CustomEvent', actual+`
     return {
       read:()=>leerOutbox(),
       queue:async entry=>{_unsaved.push(entry); await mutarOutbox(function(){});},
       ack:async id=>mutarOutbox(function(){
         _outbox.pending=_outbox.pending.filter(entry=>entry.id!==id);
         if(!_outbox.confirmed.includes(id))_outbox.confirmed.push(id);
       }),
       pending:()=>_unsaved.map(x=>x.id)
     };`);
  const adapter={db,_db:Promise.resolve(db),get,set};
  const lib=mk({rollout:{outboxV2:true},roomId:'synthetic-room'},'-y',adapter,IDBKeyRange,
   noLocks?undefined:navigator,'f123_relay_outbox_v1-y',
   {pending:[],confirmed:[],checkpoint:''},unsaved,new Set(),
   ()=>signals.push('commit'),()=>{},localStorage,window,CustomEvent);
  window.__f123GateE={
   read:()=>lib.read(),queue:e=>lib.queue(e),ack:id=>lib.ack(id),
   pending:()=>lib.pending(),signals:()=>signals.length,
   close:()=>db.close(),hasNativeLocks:()=>!!navigator.locks
  };
 },{name,actual,noLocks});
}

async function read(page){
 return page.evaluate(()=>window.__f123GateE.read());
}
async function write(page,op){
 return page.evaluate(op=>window.__f123GateE.queue(op),op);
}
async function ack(page,id){
 return page.evaluate(id=>window.__f123GateE.ack(id),id);
}
async function scenario(engine,name,noLocks){
 const browser=await engine.launch({headless:true});
 const site=await server(),ctx=await browser.newContext();
 const dbName='f123-qa-gate-e-'+name+'-'+(noLocks?'atomic':'locks')+'-'+Date.now();
 let a,b,c;
 try{
  a=await ctx.newPage();b=await ctx.newPage();
  await Promise.all([a.goto(site.url),b.goto(site.url)]);
  await seed(a,dbName);
  await Promise.all([install(a,dbName,noLocks),install(b,dbName,noLocks)]);
  await Promise.all([read(a),read(b)]); // explicitly stale caches
  await Promise.all([write(a,item('A')),write(b,item('B'))]);
  c=await ctx.newPage();await c.goto(site.url);await install(c,dbName,noLocks);
  assert.deepEqual(ids(await read(c)),['A','B'],name+' parallel append');
  await Promise.all([ack(a,'A'),write(b,item('C'))]);
  // Kill and recreate the third tab: cold process has no in-memory cache.
  await c.close();c=await ctx.newPage();await c.goto(site.url);
  await install(c,dbName,noLocks);
  const latest=await read(c);
  assert.deepEqual(ids(latest),['B','C'],name+' cannot lose B/C or resurrect A');
  assert.deepEqual(Array.from(latest.confirmed),['A'],name+' durable ACK tombstone');
  const actualRows=await c.evaluate(async({name,metaKey,prefix})=>{
   const db=await new Promise((r,j)=>{const x=indexedDB.open(name);
    x.onsuccess=()=>r(x.result);x.onerror=()=>j(x.error);});
   const get=k=>new Promise((r,j)=>{const tx=db.transaction('custom','readonly'),x=tx.objectStore('custom').get(k);
    x.onsuccess=()=>r(x.result);x.onerror=()=>j(x.error)});
   try{return{meta:await get(metaKey),a:await get(prefix+'A'),b:await get(prefix+'B'),c:await get(prefix+'C')};}
   finally{db.close();}
  },{name:dbName,metaKey,prefix});
  // Row structure is additionally proved by the cold library read above; no
  // direct DB assertion is made if browser blocks the diagnostic handle.
  if(actualRows) {
   assert.equal(actualRows.a,undefined);
   assert.equal(actualRows.b?.id,'B');
   assert.equal(actualRows.c?.id,'C');
  }
  const firstSignals=await a.evaluate(()=>window.__f123GateE.signals());
  assert.ok(firstSignals>=1,'successful commits must emit observable signals');
  await a.evaluate(()=>window.__f123GateE.close());
  await assert.rejects(write(a,item('UNCOMMITTED')),undefined,'closed IDB must not ACK');
  assert.deepEqual(await a.evaluate(()=>window.__f123GateE.pending()),['UNCOMMITTED'],
   'failed commit retains local unsaved op');
  assert.equal(await a.evaluate(()=>window.__f123GateE.signals()),firstSignals,
   'failed commit cannot announce durability');
  if(!noLocks) {
   assert.equal(await a.evaluate(()=>window.__f123GateE.hasNativeLocks()),true,
    name+' should test actual native Web Locks if the engine exposes them');
  }
 } finally{
  await ctx.close().catch(()=>{});
  await browser.close().catch(()=>{});
  await site.close();
 }
}
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('Gate E native '+name+' real IndexedDB two tabs no-WebLocks atomic failback',{timeout:120000},
  async()=>scenario(engine,name,true));
 test('Gate E native '+name+' real IndexedDB two tabs Web Locks path',{timeout:120000},
  async()=>scenario(engine,name,false));
}
