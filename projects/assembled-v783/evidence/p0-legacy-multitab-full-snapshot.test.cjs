'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),cp=require('node:child_process');
const root=process.env.FRIENDLY_REPO;assert.ok(root,'set FRIENDLY_REPO to friendly-123 checkout');
const old=(file)=>cp.execFileSync('git',['show','94a4e047cdb0b2b14cbab004de599d7e43fef79b:'+file],{cwd:root,encoding:'utf8'});
const advanced=old('docs/avanzado-extra.js'),outbox=old('docs/sync-outbox.js');
const from=advanced.indexOf('  const OCSync = (function () {'),to=advanced.indexOf('\n\n  function init() {',from);
assert.ok(from>=0&&to>from);
const closure=advanced.slice(from,to)+'\nwindow.__sync=OCSync;';
test('two sequential tab writes preserve both operation snapshots',async()=>{
 const kv=new Map(),rows=new Map();
 const storage={getItem:k=>kv.get(k)??null,setItem:(k,v)=>kv.set(k,String(v)),removeItem:k=>kv.delete(k)};
 const db={transaction(_store,mode){const tx={};tx.objectStore=()=>({
  put(row){assert.equal(mode,'readwrite');queueMicrotask(()=>{rows.set(row.id,structuredClone(row));tx.oncomplete?.();});},
  get(k){assert.equal(mode,'readonly');const req={};queueMicrotask(()=>{req.result=rows.get(k);req.onsuccess?.();});return req;}
 });return tx;}};
 const idb={open(){const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req;}};
 function tab(){const window={fetch:async()=>({ok:true}),addEventListener(){},dispatchEvent(){},
  OCSecure:{activarSync:async()=>true,syncActiva:()=>true,cifrarSync:async x=>x,descifrarSync:async x=>x}};
  const c={window,localStorage:storage,indexedDB:idb,API:'/api',setInterval:()=>1,clearInterval(){},console:{warn(){}},CustomEvent:function(){},Date,Math,JSON,Promise,Set};
  vm.runInNewContext(outbox,c);vm.runInNewContext(closure,c);return window;}
 const a=tab(),b=tab();
 await a.__sync.activar('synthetic');await b.__sync.activar('synthetic');
 await a.fetch('/api/sale-a',{method:'POST'});await b.fetch('/api/sale-b',{method:'POST'});
 const result=JSON.parse(rows.get('f123_sync_pending').blob);
 assert.deepEqual(result.map(x=>x.url).sort(),['/api/sale-a','/api/sale-b']);
});
