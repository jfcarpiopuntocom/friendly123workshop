'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../app/docs/sync-outbox.js'),'utf8');
const key='f123_sync_pending';
function setup(){
  const local=new Map(), rows=new Map(); let abort=false, removeFails=false;
  const db={transaction(_store,mode){const tx={};tx.objectStore=()=>({
    put(row){assert.equal(mode,'readwrite');queueMicrotask(()=>{if(abort){tx.error=new Error('abort');tx.onabort?.();} else {rows.set(row.id,structuredClone(row));tx.oncomplete?.();}});},
    get(id){assert.equal(mode,'readonly');const req={};queueMicrotask(()=>{req.result=rows.get(id);req.onsuccess?.();});return req;}
  });return tx;}};
  const localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>{if(removeFails)throw Error('synthetic denied');local.delete(k);}};
  const context={window:{},localStorage,indexedDB:{open(){const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;}},Date:{now:()=>12345},Promise,console:{warn(){}}};
  vm.runInNewContext(src,context);return {api:context.window.OCOutbox,local,rows,setAbort:v=>abort=v,setRemoveFailure:v=>removeFails=v};
}
test('opposite histories can leave identical IDB and localStorage bytes',async()=>{
  const newerLocal=setup();
  assert.equal(await newerLocal.api.guardar('A'),true);
  newerLocal.setAbort(true);
  assert.equal(await newerLocal.api.guardar('B'),true);
  const newerIdb=setup();
  newerIdb.setAbort(true);
  assert.equal(await newerIdb.api.guardar('B'),true);
  newerIdb.setAbort(false);newerIdb.setRemoveFailure(true);
  assert.equal(await newerIdb.api.guardar('A'),true);
  assert.deepEqual([...newerLocal.local],[...newerIdb.local]);
  assert.deepEqual([...newerLocal.rows],[...newerIdb.rows]);
  assert.equal(newerLocal.local.get(key),'B');
  assert.equal(newerLocal.rows.get(key).blob,'A');
  assert.equal(await newerLocal.api.leer(),'A');
  assert.equal(await newerIdb.api.leer(),'A');
});
