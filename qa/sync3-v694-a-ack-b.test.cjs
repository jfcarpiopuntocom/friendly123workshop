'use strict';
// Synthetic ONLY: exercises real v694 Yjs transport against an in-process fake relay.
// No live socket, no PIN, no client/license data, no mutations to production.
// Candidate source is checkout-pinned by .github/workflows/sync3-v694-ab-synthetic.yml.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=process.env.F123_SOURCE_ROOT;
const expected='dbc361a01bc0b97b90ccfe9bd86379c20639cc29';
assert.ok(root,'F123_SOURCE_ROOT is mandatory: no implicit unpinned source');
const actual=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
assert.equal(actual,expected,'never test a different/updated production SHA');
const src=fs.readFileSync(path.join(root,'docs/sync-yjs.js'),'utf8');
const vendor=fs.readFileSync(path.join(root,'docs/vendor/yjs-bundle.min.js'),'utf8');
const begin=src.indexOf('  function _frame('),end=src.indexOf('  // Carga perezosa',begin);
assert.ok(begin>=0&&end>begin,'same production transport block as yjs-unresolved-checkpoint tests');
const transport=src.slice(begin,end);
const pause=()=>new Promise(r=>setImmediate(r));
const jsonSent=d=>d.socket.sent.filter(x=>typeof x==='string'&&x.startsWith('{')).map(x=>{try{return JSON.parse(x)}catch{return null}}).filter(Boolean);
async function until(what,label){
  for(let i=0;i<500;i++){if(what())return;await new Promise(r=>setTimeout(r,2));}
  assert.ok(what(),label+' (test did not reach required observation)');
}
function device(seed){
 const timers=[],sockets=[],stored=new Map(),events=[];
 class Socket{
  constructor(){this.readyState=1;this.sent=[];this.bufferedAmount=0;sockets.push(this)}
  send(x){this.sent.push(x);}
  close(){this.readyState=3;this.onclose?.();}
 }
 const db={objectStoreNames:{contains:key=>key==='updates'},transaction(){
  const tx={};queueMicrotask(()=>tx.oncomplete?.());return tx;
 }};
 const persist={whenSynced:Promise.resolve(),db,
  get:async key=>structuredClone(stored.get(key)),
  set:async(key,value)=>{stored.set(key,structuredClone(value));}
 };
 const ctx={
  API:{clave:'synthetic-local-only',roomId:'synthetic-local-only',_store:{aplicar(){}},rollout:{outboxV2:false,gzipWrite:false}},
  RELAY_URL:'fixture:',crypto:require('node:crypto').webcrypto,
  window:{dispatchEvent(x){events.push(x.type);},F123Relay:{ckptFrameBytes:786432,connect:()=>new Socket()}},
  navigator:{},document:{hidden:false,visibilityState:'visible',addEventListener(){},getElementById(){return null},body:{appendChild(){}}},
  CustomEvent:class{constructor(type){this.type=type}},
  WebSocket:class{constructor(){throw Error('Raw network forbidden')}},
  log(){},Date,Math,JSON,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder,Response,setInterval,clearInterval,
  setTimeout(fn,ms){timers.push({fn,ms,cancelled:false});return timers.length},
  clearTimeout(id){if(timers[id-1])timers[id-1].cancelled=true},
  btoa:s=>Buffer.from(s,'binary').toString('base64'),
  cifrarBin:async(_,buffer)=>buffer.slice().buffer,
  descifrarBin:async(_,buffer)=>new Uint8Array(buffer)
 };
 vm.createContext(ctx);
 vm.runInContext(transport+'\nthis.make=crearCanal;',ctx);
 vm.runInContext(vendor,ctx);
 const Y=ctx.Y,doc=new Y.Doc();
 if(seed)seed(doc);
 const channel=ctx.make(Y,doc,'-y','catalogo',true,null,persist);
 channel.conectar();
 assert.equal(sockets.length,1);
 const socket=sockets[0];socket.onopen();
 return {ctx,Y,doc,channel,socket,timers,stored,events};
}
async function emptyPull(d){
 await until(()=>jsonSent(d).some(x=>x.k==='head'),'HEAD request');
 d.socket.onmessage({data:JSON.stringify({k:'head-result',unsupported:true})});
 await until(()=>jsonSent(d).some(x=>x.k==='pull'),'pull requested');
 d.socket.onmessage({data:JSON.stringify({k:'pull-page',rev:0,seq:0,n:0,more:false})});
 await until(()=>d.stored.get('f123_yjs_pull_cursor_v2-y')?.rev===0,'durable pull cursor after verified page');
 await until(()=>d.channel.recuperando===false,'initial catalog hydration');
}
function checkpointTimer(d){
 const candidates=d.timers.filter(t=>!t.cancelled&&(t.ms===250||t.ms===2500));
 assert.ok(candidates.length,'a real post-pull or initial checkpoint timer exists');
 return candidates.at(-1);
}
test('A hydrated -> checkpoint queued -> relay persist ACK -> new B consumes full causal state', {timeout:30000}, async()=>{
 const a=device(doc=>{
  const records=doc.getMap('records');
  records.set('synthetic-item-01',15);
  records.set('synthetic-item-02',3);
 });
 await emptyPull(a);
 assert.equal(a.doc.store.pendingStructs,null);
 assert.equal(a.doc.store.pendingDs,null);
 const timer=checkpointTimer(a);
 timer.fn();await until(()=>jsonSent(a).some(m=>m.k==='ckpt'),'checkpoint written to transport after hydration');
 const ck=jsonSent(a).find(m=>m.k==='ckpt');
 assert.equal(ck.rev,0);
 assert.equal(ck.seq,0);
 const local=a.stored.get('f123_relay_outbox_v1-y');
 assert.ok(local.pending.some(x=>x.id===ck.id),'checkpoint must first exist in local durable outbox');
 assert.notEqual(local.checkpoint,ck.state,'send alone is NOT remote persistence proof');
 // The test relay explicitly accepts this ciphertext and acknowledges it.
 const relay={rev:1,seq:0,checkpoint:structuredClone(ck)};
 a.socket.onmessage({data:JSON.stringify({k:'persist-result',kind:'ckpt',id:ck.id,ok:true})});
 await until(()=>a.stored.get('f123_relay_outbox_v1-y')?.checkpoint===ck.state,
  'only a matching persist-result commits checkpoint fingerprint');
 assert.equal(a.stored.get('f123_relay_outbox_v1-y').pending.some(x=>x.id===ck.id),false);
 a.channel.pausar(); // A closed before B cold-joins: never relies on direct peer.
 const b=device();
 await until(()=>jsonSent(b).some(x=>x.k==='head'),'new device HEAD');
 b.socket.onmessage({data:JSON.stringify({k:'head-result',rev:relay.rev,seq:relay.seq})});
 await until(()=>jsonSent(b).some(x=>x.k==='pull'),'new device requests checkpoint');
 const packed=Uint8Array.from(Buffer.from(relay.checkpoint.c,'base64'));
 b.socket.onmessage({data:packed.buffer,relaySource:'pull'});
 b.socket.onmessage({data:JSON.stringify({k:'pull-page',rev:relay.rev,seq:relay.seq,n:0,more:false})});
 await until(()=>b.doc.getMap('records').get('synthetic-item-01')===15,'B applied first fact');
 await until(()=>b.channel.recuperando===false,'B causal recovery complete');
 assert.equal(b.doc.getMap('records').get('synthetic-item-02'),3);
 assert.equal(b.doc.store.pendingStructs,null,'no unresolved parent on B');
 assert.equal(b.doc.store.pendingDs,null,'no unresolved delete on B');
 assert.equal(jsonSent(b).filter(x=>x.k==='pull').length,1,
  'B requires only one checkpoint-first page in bounded synthetic history');
 assert.equal(b.stored.get('f123_yjs_pull_cursor_v2-y')?.rev,relay.rev,
  'B durable applied revision must match remote relay HEAD');
 b.channel.pausar();
});
test('Unacknowledged checkpoint is not proof of remote recovery', {timeout:30000}, async()=>{
 const a=device(doc=>doc.getMap('records').set('synthetic-unacked',7));
 await emptyPull(a);
 checkpointTimer(a).fn();
 await until(()=>jsonSent(a).some(x=>x.k==='ckpt'),'checkpoint sent');
 const ck=jsonSent(a).find(x=>x.k==='ckpt');
 assert.equal(a.stored.get('f123_relay_outbox_v1-y')?.checkpoint||'', '',
  'pending checkpoint without persist-result cannot be declared remotely durable');
 assert.ok(a.stored.get('f123_relay_outbox_v1-y')?.pending.some(x=>x.id===ck.id),
  'pending entry remains available for retry');
 a.channel.pausar();
});
