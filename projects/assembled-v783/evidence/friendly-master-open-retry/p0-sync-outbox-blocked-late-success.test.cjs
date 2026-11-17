'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../docs/sync-outbox.js'),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('blocked IDB open that succeeds late closes its orphan; a retry remains usable',async()=>{
 const requests=[],local=new Map(),durable=new Map();let orphanClosed=0,activeClosed=0;
 function db(which){return {close(){if(which==='orphan')orphanClosed++;else activeClosed++;},transaction(){const tx={};tx.objectStore=()=>({put(row){queueMicrotask(()=>{durable.set(row.id,row.blob);tx.oncomplete?.();});}});return tx;}};}
 const indexedDB={open(){const req={};requests.push(req);return req;}};
 const localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)};
 const context={window:{},indexedDB,localStorage,console:{warn(){}},Promise,Date};vm.runInNewContext(source,context);
 const first=context.window.OCOutbox.guardar('A');await tick();requests[0].onblocked();assert.equal(await first,true);
 const second=context.window.OCOutbox.guardar('B');await tick();assert.equal(requests.length,2);
 requests[0].result=db('orphan');requests[0].onsuccess();
 requests[1].result=db('active');requests[1].onsuccess();assert.equal(await second,true);
 assert.equal(orphanClosed,1,'late successful blocked connection must be closed');
 assert.equal(activeClosed,0,'active retry connection must remain open');
 assert.equal(durable.get('f123_sync_pending'),'B');
});
