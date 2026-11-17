// Exact test/harness extraction from friendly-123 DRAFT v698 @496a82b8; independent-writer assertion unchanged. NO NETWORK.
// P0 persisted Sync3 causal recovery regression: actual current repo source, no external network.
'use strict';
// End-to-end seam: actual current sync-yjs + actual Firebase REST
// adapter + production Yjs bundle, with a STRICT IN-MEMORY REST fixture.
// No network, no production Firebase URL, no PIN, no real business data.
const test=require('node:test').test,assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const sourceRoot=process.env.F123_SOURCE_ROOT || path.resolve(__dirname,'..');
const SHA=process.env.F123_EXPECTED_SHA || null;
assert.ok(sourceRoot,'Test source checkout is mandatory');
if (SHA) assert.equal(execFileSync('git',['-C',sourceRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),SHA,
 'optional exact-SHA source pin must match');
const yjs=fs.readFileSync(path.join(sourceRoot,'docs/sync-yjs.js'),'utf8');
const firebase=fs.readFileSync(path.join(sourceRoot,'docs/firebase-relay.js'),'utf8');
const vendor=fs.readFileSync(path.join(sourceRoot,'docs/vendor/yjs-bundle.min.js'),'utf8');
const x=yjs.indexOf('  function _frame('),y=yjs.indexOf('  // Carga perezosa',x);
assert.ok(x>=0&&y>x,'must execute actual production Yjs transport');
const transport=yjs.slice(x,y);
const room='a'.repeat(40),server='https://synthetic.invalid';
async function until(condition,label){
 for(let i=0;i<500;i++){if(condition())return;await new Promise(r=>setTimeout(r,2));}
 assert.ok(condition(),label);
}
function rest(){
 const ckpts=new Map(),ops=new Map(),calls=[]; let clock=1000;
 const answer=(v,status=200)=>new Response(JSON.stringify(v),{status});
 async function fetch(url,opts={}){
  const u=new URL(url);assert.equal(u.origin,server,'NO REAL NETWORK');
  const m=/^\/f123\/([a-f0-9]{40}-y)\/(k|o)(?:\/([^/]+))?\.json$/.exec(u.pathname);
  assert.ok(m,'invalid synthetic Firebase path');
  const [_,locator,type,key]=m;
  assert.equal(locator,room+'-y');
  const written=opts.method==='POST'&&u.searchParams.get('x-http-method-override')==='PUT';
  calls.push({type,key:key||null,method:written?'PUT':'GET'});
  const map=type==='k'?ckpts:ops;
  if(written){
   assert.ok(key,'writes require explicit synthetic key');
   assert.equal(map.has(key),false,'no overwriting an existing checkpoint revision or op');
   const value=JSON.parse(opts.body);
   if(type==='o'&&typeof value.s==='object')value.s=++clock; // monotonic synthetic server timestamp
   map.set(key,value);
   return answer(value);
  }
  assert.equal(opts.method,'GET');
  if(key)return answer(map.get(key)||null);
  if(type==='k'&&u.searchParams.get('shallow')==='true')
   return answer(Object.fromEntries([...map.keys()].map(k=>[k,true])));
  let records=[...map.entries()];
  if(type==='o'){
    records.sort((a,b)=>a[1].s-b[1].s||a[0].localeCompare(b[0]));
    const queryNumber=(name)=>{
      const raw=u.searchParams.get(name);
      if(raw===null)return null;
      const parsed=JSON.parse(raw);
      assert.ok(Number.isSafeInteger(parsed),'only integer synthetic timestamp filters');
      return parsed;
    };
    const start=queryNumber('startAt'),end=queryNumber('endAt'),equal=queryNumber('equalTo');
    if(start!==null)records=records.filter(([,r])=>r.s>=start);
    if(end!==null)records=records.filter(([,r])=>r.s<=end);
    if(equal!==null)records=records.filter(([,r])=>r.s===equal);
    const limitFirst=Number(u.searchParams.get('limitToFirst')||0);
    const limitLast=Number(u.searchParams.get('limitToLast')||0);
    if(limitFirst>0)records=records.slice(0,limitFirst);
    if(limitLast>0)records=records.slice(-limitLast);
  }
  return answer(Object.fromEntries(records));
 }
 return {ckpts,ops,calls,fetch};
}
function device(api,seed){
 const timers=[],storage=new Map();
 const db={objectStoreNames:{contains:key=>key==='updates'},
  transaction(){const tx={};queueMicrotask(()=>tx.oncomplete?.());return tx;}};
 const persist={whenSynced:Promise.resolve(),db,
   get:async key=>structuredClone(storage.get(key)),
   set:async(key,value)=>{storage.set(key,structuredClone(value));}};
 const ctx={ API:{clave:'synthetic-only',roomId:room,_store:{aplicar(){}},
      rollout:{outboxV2:false,gzipWrite:false}},
    RELAY_URL:'wss://friendly123-sync-relay.jfcarpio.workers.dev/sala/',
    crypto:require('node:crypto').webcrypto,
    window:{dispatchEvent(){}},navigator:{},
    document:{hidden:false,visibilityState:'visible',addEventListener(){},
      getElementById(){return null},body:{appendChild(){}}},
    CustomEvent:class{constructor(type){this.type=type}},
    WebSocket:class{constructor(){throw Error('network socket forbidden')}},
    Response,URL,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Date,
    JSON,Math,Promise,DOMException,console,
    setTimeout(fn,ms){timers.push({fn,ms,cancelled:false});return timers.length;},
    clearTimeout(id){if(timers[id-1])timers[id-1].cancelled=true;},
    setInterval(){return 1;},clearInterval(){},
    btoa:s=>Buffer.from(s,'binary').toString('base64'),
    atob:s=>Buffer.from(s,'base64').toString('binary'),
    fetch(){throw Error('global fetch forbidden');},
    log(){},
    cifrarBin:async(_,buffer)=>buffer.slice().buffer,
    descifrarBin:async(_,buffer)=>new Uint8Array(buffer)
 };
 vm.createContext(ctx);
 vm.runInContext(firebase,ctx);
 ctx.window.F123Relay=ctx.window.F123FirebaseRelay.create({
   db:server,fetch:api.fetch,EventSource:null});
 // Production relay-selector.js exposes this exact source-specific relayLayer
 // on the returned hub; direct Firebase adapters otherwise lack that property.
 const connectFirebase=ctx.window.F123Relay.connect;
 ctx.window.F123Relay.connect=function(url) {
   const socket=connectFirebase(url);
   socket.relayLayer='f123_relay_cupo_fb_v1';
   return socket;
 };
 vm.runInContext(transport+'\nthis.make=crearCanal;',ctx);
 vm.runInContext(vendor,ctx);
 const Y=ctx.Y,doc=new Y.Doc();
 if(seed)seed(doc);
 const channel=ctx.make(Y,doc,'-y','catalogo',true,null,persist);
 // Mirror the actual production app's Y.Doc update bridge; remote ('red') must never echo.
 doc.on('update',(update,origin)=>{if(origin!=='red'&&origin!==persist)channel.enviarUpdate(update);});
 channel.conectar();
 return {Y,doc,channel,timers,storage};
}
test('P0 RED: rescue of early causal parent cannot skip 95 independent pre-CKPT writes from another writer', {timeout:65000},async()=>{
  const backend=rest();
  const A=device(backend,d=>d.getMap('identity').set('baseline',33));
  await until(()=>A.channel.recuperando===false,'A establishes complete initial state');
  await until(()=>A.timers.some(t=>!t.cancelled&&(t.ms===250||t.ms===2500)),'initial checkpoint timer');
  A.timers.filter(t=>!t.cancelled&&(t.ms===250||t.ms===2500)).at(-1).fn();
  await until(()=>backend.ckpts.has('1'),'original rev1 CKPT exists');
  await until(()=>!!A.storage.get('f123_relay_outbox_v1-y')?.checkpoint,'original CKPT durable ACK');
  A.channel.pausar();

  // Deliberately use DIFFERENT Y.Doc client IDs for the missing causal pair
  // and the old independent history. A same-writer tail can hide this defect
  // because its pending Yjs dependencies only clear at the last page.
  const parentWriter=device(backend);
  await until(()=>parentWriter.channel.recuperando===false,'parent writer joins rev1');
  parentWriter.doc.getMap('causalChain').set('parent','PARENT-OLDER-THAN-CUT');
  await until(()=>backend.ops.size===1,'early parent op persisted');
  const parentTimestamp=[...backend.ops.values()].at(-1).s;

  const independentWriter=device(backend);
  await until(()=>independentWriter.channel.recuperando===false,'independent writer joins rev1 + parent');
  assert.notEqual(independentWriter.doc.clientID,parentWriter.doc.clientID,
    'two independent Yjs writer client IDs are essential for this scenario');
  const n=95, history=independentWriter.doc.getMap('independentHistory');
  for(let i=0;i<n;i++){
    history.set('separate-writer-'+i,i);
    await until(()=>backend.ops.size===i+2,'independent writer durable op '+i);
  }
  const cutTimestamp=[...backend.ops.values()].at(-1).s;
  assert.ok(cutTimestamp>parentTimestamp,'bad cutoff is later than both historical writers');
  independentWriter.channel.pausar();

  // Child is only causally dependent on the EARLY parent of the same client,
  // not on the 95 unrelated operations from the independent writer.
  parentWriter.doc.getMap('causalChain').set('child','CHILD-NEWER-THAN-CUT');
  await until(()=>backend.ops.size===n+2,'child after malformed cutoff persisted');
  parentWriter.channel.pausar();

  // This bad snapshot falsely claims it covers the early parent and unrelated
  // writer ops, but contains only legitimate old rev1 baseline ciphertext.
  backend.ckpts.set('2',{...structuredClone(backend.ckpts.get('1')),s:cutTimestamp});
  assert.equal(backend.ops.size,97,'never delete or rewrite the 97 encrypted historical operations');

  const preGet=backend.calls.filter(c=>c.type==='o'&&c.method==='GET').length;
  const C=device(backend);
  let fakeBackoffMs=0,backoffResumptions=0;
  for(let i=0;i<1800&&C.channel.recuperando!==false;i++){
    const timer=C.timers.find(t=>!t.cancelled&&!t.fired&&
      (t.ms===8000||t.ms===30000||t.ms===60000||t.ms===120000||t.ms===240000||t.ms===300000));
    if(timer){
      timer.fired=true;timer.cancelled=true;fakeBackoffMs+=timer.ms;
      backoffResumptions++;timer.fn();
    }
    await new Promise(resolve=>setTimeout(resolve,2));
  }
  const observed=C.doc.getMap('independentHistory'),missing=C.doc.store.pendingStructs?.missing?.size||0;
  const pages=backend.calls.filter(c=>c.type==='o'&&c.method==='GET').length-preGet;
  console.log('CROSS_WRITER_PRECUT',JSON.stringify({
    storedOps:backend.ops.size,independentWriterOps:n,
    independentOpsRecovered:observed.size,missingParents:missing,
    pagesRead:pages,backoffResumptions,fakeBackoffMs,
    recoveryComplete:C.channel.recuperando===false
  }));
  assert.equal(backend.ckpts.size,2,'no unsafe checkpoint may be written');
  assert.equal(C.doc.getMap('causalChain').get('parent'),'PARENT-OLDER-THAN-CUT',
    'the missing parent must be recovered from old ops');
  assert.equal(C.doc.getMap('causalChain').get('child'),'CHILD-NEWER-THAN-CUT');
  assert.equal(missing,0,'early child parent is indeed repaired');
  assert.equal(observed.size,n,
    'clearing one missing parent cannot certify remaining independent pre-cut history');
  for(let i=0;i<n;i++)assert.equal(observed.get('separate-writer-'+i),i,
    'historical writes must not be silently omitted');
  assert.equal(C.channel.recuperando,false,'full historical reconciliation must finish');
  assert.equal(C.storage.get('f123_yjs_pull_cursor_v2-y')?.rev,2,
    'durable ACK revision never rolls back');
  C.channel.pausar();
});
