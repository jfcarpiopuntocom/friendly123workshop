'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../app/docs/sync-outbox.js'),'utf8');
const key='f123_sync_pending';

test('a successful local fallback remains readable after IndexedDB recovers and module reloads',async()=>{
  const local=new Map(), durable=new Map();
  let abort=false;
  const db={transaction(store,mode){
    assert.equal(store,'cola');
    const tx={};
    tx.objectStore=()=>({
      put(row){assert.equal(mode,'readwrite');queueMicrotask(()=>{
        if(abort){tx.error=new Error('synthetic abort');tx.onabort?.();}
        else {durable.set(row.id,structuredClone(row));tx.oncomplete?.();}
      });},
      get(id){assert.equal(mode,'readonly');const req={};queueMicrotask(()=>{req.result=durable.get(id);req.onsuccess?.();});return req;}
    });
    return tx;
  }};
  const localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)};
  const indexedDB={open(){const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;}};
  function load(){const ctx={window:{},indexedDB,localStorage,console:{warn(){}},Promise,Date};vm.runInNewContext(source,ctx);return ctx.window.OCOutbox;}
  let api=load();
  assert.equal(await api.guardar('synthetic-A'),true);
  abort=true;
  assert.equal(await api.guardar('synthetic-B'),true);
  assert.equal(durable.get(key).blob,'synthetic-A');
  assert.equal(local.get(key),'synthetic-B');
  abort=false;
  api=load();
  assert.equal(await api.leer(),'synthetic-B','the successful newer fallback must survive restart even when the older IDB copy is readable');
});
