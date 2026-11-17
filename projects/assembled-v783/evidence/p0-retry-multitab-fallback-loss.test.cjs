'use strict';
// BASELINE_SOURCE points at exact friendly-123 master source; CANDIDATE_SOURCE
// points at proposed source. Two isolated contexts, shared synthetic stores.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const key='f123_sync_pending';
async function run(file){
  const calls=[0,0],local=new Map(),rows=new Map([[key,{id:key,blob:'A'}]]);
  const db={transaction(_store,mode){const tx={};tx.objectStore=()=>({
    put(row){assert.equal(mode,'readwrite');queueMicrotask(()=>{rows.set(row.id,structuredClone(row));tx.oncomplete?.();});},
    get(id){assert.equal(mode,'readonly');const req={};queueMicrotask(()=>{req.result=rows.get(id);req.onsuccess?.();});return req;}
  });return tx;}};
  function tab(i){const window={};const context={window,Date,Promise,console:{warn(){}},
    localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},
    indexedDB:{open(){const n=++calls[i],req=n===1?{error:Error('synthetic temporary failure')}:{result:db};queueMicrotask(()=>n===1?req.onerror?.():req.onsuccess?.());return req;}}};
    vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});return window.OCOutbox;}
  const tab1=tab(0),tab2=tab(1);
  assert.equal(await tab2.leer(),null,'tab 2 initially cannot open IDB');
  assert.equal(await tab1.guardar('B'),true,'tab 1 acknowledges newer fallback B');
  const restored=await tab2.leer();
  assert.equal(await tab2.guardar(restored+'+C'),true);
  return {restored,local:local.get(key)??null,idb:rows.get(key).blob};
}
const baseline=process.env.BASELINE_SOURCE,candidate=process.env.CANDIDATE_SOURCE;
assert.ok(baseline&&candidate,'set BASELINE_SOURCE and CANDIDATE_SOURCE');
test('exact master preserves the shared fallback in this session',async()=>{
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(baseline)).digest('hex'),'928457788fa4200067beccf0aff15e2e6588e09cf92a839292024f57c7d84166');
  assert.deepEqual(await run(baseline),{restored:'B',local:'B+C',idb:'A'});
});
test('retry must not lose a different tab’s acknowledged newer fallback',async()=>{
  const got=await run(candidate);
  assert.equal(got.restored,'B','shared newer fallback must not be hidden by stale IDB');
  assert.ok(got.local==='B+C'||got.idb==='B+C','later durable state must retain B');
});
