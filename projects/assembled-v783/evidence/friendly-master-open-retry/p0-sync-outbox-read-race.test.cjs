'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../docs/sync-outbox.js'),'utf8');
const tick=()=>new Promise(r=>setImmediate(r));
test('fallback written during pending IDB read wins over stale result',async()=>{
 let readRequest;const local=new Map();
 const db={transaction(_store,mode){const tx={};tx.objectStore=()=>({get(){readRequest={};return readRequest;},put(){queueMicrotask(()=>{tx.error=Error('aborted');tx.onerror?.();});}});return tx;}};
 const context={window:{},indexedDB:{open(){const req={result:db};queueMicrotask(()=>req.onsuccess());return req;}},localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},console:{warn(){}},Date,Promise};
 vm.runInNewContext(code,context);const api=context.window.OCOutbox;
 const pending=api.leer();await tick();assert.ok(readRequest);
 assert.equal(await api.guardar('B'),true);readRequest.result={id:'f123_sync_pending',blob:'A'};readRequest.onsuccess();
 assert.equal(await pending,'B');
});

test('an older IDB write completing after a fallback must not delete the newer fallback',async()=>{
 let firstTx;let writes=0;const local=new Map();
 const db={transaction(){const tx={};tx.objectStore=()=>({put(){if(++writes===1){firstTx=tx;} else queueMicrotask(()=>{tx.error=Error('aborted');tx.onerror?.();});}});return tx;}};
 const context={window:{},indexedDB:{open(){const req={result:db};queueMicrotask(()=>req.onsuccess());return req;}},localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},console:{warn(){}},Date,Promise};
 vm.runInNewContext(code,context);const api=context.window.OCOutbox;
 const older=api.guardar('A');await tick();assert.ok(firstTx);
 assert.equal(await api.guardar('B'),true);firstTx.oncomplete();assert.equal(await older,true);
 assert.equal(local.get('f123_sync_pending'),'B');assert.equal(await api.leer(),'B');
});
