'use strict';
// Synthetic offline investigation only: Yjs work, not application E2E.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const Y_FILE=process.env.F123_YJS_BUNDLE || path.join(__dirname,'../app/docs/vendor/yjs-bundle.min.js');
const crypto=require('node:crypto');
const c={console,crypto:crypto.webcrypto,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Map,Set,Promise,setTimeout,clearTimeout};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync(Y_FILE,'utf8'),c);const Y=c.Y;
const src=new Y.Doc({gc:false}),updates=[];src.on('update',u=>updates.push(u));const map=src.getMap('synthetic');
for(let i=0;i<5000;i++)map.set('item-'+i,i);
const expected=Buffer.from(Y.encodeStateAsUpdate(src));
function run(name,list,batch){
  const d=new Y.Doc({gc:false}),milestones=[],t=performance.now();
  for(let i=0;i<list.length;i+=batch){
    const entries=list.slice(i,i+batch);
    Y.applyUpdate(d,batch===1?entries[0]:Y.mergeUpdates(entries));
    if(batch===1&&(i+1)%1000===0)milestones.push(Math.round(performance.now()-t));
  }
  const ms=Math.round(performance.now()-t);
  assert.equal(d.getMap('synthetic').size,5000);assert.equal(!!d.store.pendingStructs,false);
  assert.deepEqual(Buffer.from(Y.encodeStateAsUpdate(d)),expected);
  return {scenario:name,duration_ms:ms,milestones_1000:milestones,entries:d.getMap('synthetic').size};
}
const backwards=[...updates].reverse();
console.log(JSON.stringify({node:process.version,bundle_sha256:crypto.createHash('sha256').update(fs.readFileSync(Y_FILE)).digest('hex'),frames:updates.length,samples:[run('causal_order',updates,1),run('reverse_causal_order',backwards,1),run('reverse_merged_batches_192',backwards,192)]}));
