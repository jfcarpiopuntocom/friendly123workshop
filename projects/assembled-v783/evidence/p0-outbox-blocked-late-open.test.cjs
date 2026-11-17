'use strict';
// RED: execute actual assembled outbox module; synthetic storage, no network.
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../app/docs/sync-outbox.js'),'utf8');
test('late success after blocked closes orphan while keeping retry connection',async()=>{
  const requests=[],local=new Map();let orphanClosed=0,retryClosed=0;
  const window={};const context={window,indexedDB:{open(){const req={};requests.push(req);return req;}},
    localStorage:{getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},
    console:{warn(){}},Date,Promise};
  vm.runInNewContext(code,context,{filename:'sync-outbox.js'});
  const first=window.OCOutbox.guardar('synthetic-A');
  const concurrent=window.OCOutbox.guardar('synthetic-B');
  assert.equal(requests.length,1,'simultaneous initial callers share open request');
  requests[0].onblocked();
  assert.deepEqual(await Promise.all([first,concurrent]),[true,true]);
  const retry=window.OCOutbox.guardar('synthetic-C');
  assert.equal(requests.length,2,'later attempt reopens after blocked');
  requests[0].result={close(){orphanClosed++;},transaction(){throw new Error('orphan should not be used');}};
  requests[0].onsuccess();
  requests[1].result={close(){retryClosed++;},transaction(){const tx={};tx.objectStore=()=>({put(){queueMicrotask(()=>tx.oncomplete());}});return tx;}};
  requests[1].onsuccess();
  assert.equal(await retry,true);
  assert.equal(retryClosed,0,'the active retry connection stays usable');
  assert.equal(orphanClosed,1,'a request that succeeded after blocked must close its orphan connection');
});
