'use strict';
// Comparative test using actual file paths supplied via environment.
// BASELINE_SOURCE: exact friendly-123@94a4e047 docs/sync-outbox.js.
// CANDIDATE_SOURCE: proposed retry source. No network, synthetic data.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const key='f123_sync_pending';
async function exercise(file) {
  let calls=0;
  const local=new Map(),rows=new Map([[key,{id:key,blob:'A'}]]);
  const db={transaction(_store,mode){const tx={};tx.objectStore=()=>({
    put(row){assert.equal(mode,'readwrite');queueMicrotask(()=>{rows.set(row.id,structuredClone(row));tx.oncomplete?.();});},
    get(id){assert.equal(mode,'readonly');const req={};queueMicrotask(()=>{req.result=rows.get(id);req.onsuccess?.();});return req;}
  });return tx;}};
  const window={};const context={window,Date,Promise,console:{warn(){}},
    localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},
    indexedDB:{open(){const n=++calls,req=n===1?{error:Error('synthetic transient open failure')}:{result:db};queueMicrotask(()=>n===1?req.onerror?.():req.onsuccess?.());return req;}}};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),context,{filename:file});
  assert.equal(await window.OCOutbox.guardar('B'),true,'new fallback B acknowledged');
  assert.equal(local.get(key),'B');
  const restored=await window.OCOutbox.leer();
  assert.equal(await window.OCOutbox.guardar(restored+'+C'),true);
  return {restored,local:local.get(key)??null,idb:rows.get(key).blob};
}
const baseline=process.env.BASELINE_SOURCE,candidate=process.env.CANDIDATE_SOURCE;
assert.ok(baseline&&candidate,'provide BASELINE_SOURCE and CANDIDATE_SOURCE');
test('exact master remains on the newer local fallback in same session',async()=>{
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(baseline)).digest('hex'),'928457788fa4200067beccf0aff15e2e6588e09cf92a839292024f57c7d84166');
  assert.deepEqual(await exercise(baseline),{restored:'B',local:'B+C',idb:'A'});
});
test('retry must preserve B when older IDB data becomes available again',async()=>{
  const got=await exercise(candidate);
  assert.equal(got.restored,'B','recover newer acknowledged fallback, not stale IDB A');
  assert.ok(got.local==='B+C'||got.idb==='B+C','later durable snapshot must still contain B');
});
