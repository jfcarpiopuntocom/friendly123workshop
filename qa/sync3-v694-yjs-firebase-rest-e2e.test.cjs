'use strict';
// End-to-end seam: actual published v694 sync-yjs + actual v694 Firebase REST
// adapter + production Yjs bundle, with a STRICT IN-MEMORY REST fixture.
// No network, no production Firebase URL, no PIN, no real business data.
const test=require('node:test').test,assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const sourceRoot=process.env.F123_SOURCE_ROOT;
const SHA='dbc361a01bc0b97b90ccfe9bd86379c20639cc29';
assert.ok(sourceRoot,'Pinned source checkout is mandatory');
assert.equal(execFileSync('git',['-C',sourceRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),SHA);
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
 const ckpts=new Map(),ops=new Map(),calls=[];
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
   if(type==='o'&&typeof value.s==='object')value.s=1; // fake server timestamp
   map.set(key,value);
   return answer(value);
  }
  assert.equal(opts.method,'GET');
  if(key)return answer(map.get(key)||null);
  if(type==='k'&&u.searchParams.get('shallow')==='true')
   return answer(Object.fromEntries([...map.keys()].map(k=>[k,true])));
  return answer(Object.fromEntries(map));
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
 vm.runInContext(transport+'\nthis.make=crearCanal;',ctx);
 vm.runInContext(vendor,ctx);
 const Y=ctx.Y,doc=new Y.Doc();
 if(seed)seed(doc);
 const channel=ctx.make(Y,doc,'-y','catalogo',true,null,persist);
 channel.conectar();
 return {Y,doc,channel,timers,storage};
}
test('v694 Yjs → Firebase REST adapter → stored ckpt ACK → B full cold join without P2P', {timeout:30000},async()=>{
 const backend=rest();
 const A=device(backend,doc=>{
  doc.getMap('products').set('synthetic-15',15);
  doc.getMap('products').set('synthetic-3',3);
 });
 await until(()=>A.channel.recuperando===false,'A completes remote empty pull and final HEAD');
 assert.equal(A.doc.store.pendingStructs,null);
 assert.equal(A.doc.store.pendingDs,null);
 await until(()=>A.timers.some(t=>!t.cancelled&&(t.ms===250||t.ms===2500)),'A checkpoint timer');
 const selected=A.timers.filter(t=>!t.cancelled&&(t.ms===250||t.ms===2500)).at(-1);
 selected.fn();
 await until(()=>backend.ckpts.has('1'),'actual Firebase adapter persisted checkpoint under revision 1');
 await until(()=>!!A.storage.get('f123_relay_outbox_v1-y')?.checkpoint,
    'A confirmed CKPT through real adapter persistence ACK');
 assert.equal(A.storage.get('f123_relay_outbox_v1-y').pending.filter(x=>x.k==='ckpt').length,0,
   'confirmed checkpoint retired from outbox');
 A.channel.pausar(); // close A before B connects
 const B=device(backend);
 await until(()=>B.channel.recuperando===false,'B cold-join ends after final verified HEAD');
 assert.equal(B.doc.getMap('products').get('synthetic-15'),15);
 assert.equal(B.doc.getMap('products').get('synthetic-3'),3);
 assert.equal(B.doc.store.pendingStructs,null);
 assert.equal(B.doc.store.pendingDs,null);
 assert.equal(B.storage.get('f123_yjs_pull_cursor_v2-y')?.rev,1);
 assert.equal(backend.ckpts.size,1,'one persisted checkpoint; no duplicate/rewrite');
 assert.ok(backend.calls.some(c=>c.method==='PUT'&&c.type==='k'));
 assert.ok(backend.calls.some(c=>c.method==='GET'&&c.type==='k'&&c.key==='1'));
 B.channel.pausar();
});


test('v694 checkpoint compacts a ~250 KB synthetic catalog; fresh B hydrates with one checkpoint', {timeout:45000},async()=>{
 const cryptoHash=require('node:crypto').createHash;
 const syntheticData=new Map();
 for(let i=0;i<220;i++){
  let payload='';
  for(let j=0;j<18;j++){
   payload+=cryptoHash('sha256').update('SYNTHETIC-ONLY-'+i+'-'+j).digest('hex');
  }
  syntheticData.set('fake-product-'+String(i).padStart(4,'0'),payload);
 }
 const backend=rest();
 const A=device(backend,doc=>{
  const catalog=doc.getMap('largeCatalog');
  for(const [key,value] of syntheticData)catalog.set(key,value);
 });
 const snapshotBytes=A.Y.encodeStateAsUpdate(A.doc).byteLength;
 assert.ok(snapshotBytes>220*1024,'must test catalog comparable to reported large histories');
 assert.ok(snapshotBytes<750*1024,'synthetic fixture must fit the existing checkpoint cap');
 await until(()=>A.channel.recuperando===false,'large A completes pull and final HEAD');
 assert.equal(A.doc.store.pendingStructs,null);
 assert.equal(A.doc.store.pendingDs,null);
 await until(()=>A.timers.some(t=>!t.cancelled&&(t.ms===250||t.ms===2500)),
   'large A schedules checkpoint after hydration');
 const timer=A.timers.filter(t=>!t.cancelled&&(t.ms===250||t.ms===2500)).at(-1);
 timer.fn();
 await until(()=>backend.ckpts.has('1'),'large catalog checkpoint persisted by real Firebase adapter');
 await until(()=>!!A.storage.get('f123_relay_outbox_v1-y')?.checkpoint,
   'large checkpoint receives matching remote ACK');
 assert.equal(A.storage.get('f123_relay_outbox_v1-y').pending.filter(x=>x.k==='ckpt').length,0);
 const checkpoint=backend.ckpts.get('1');
 assert.ok(Buffer.from(checkpoint.c,'base64').byteLength<=768*1024,
   'full snapshot obeys the existing 768 KiB encrypted checkpoint ceiling');
 A.channel.pausar();
 const readsBeforeB=backend.calls.filter(c=>c.method==='GET'&&c.type==='o').length;
 const B=device(backend);
 await until(()=>B.channel.recuperando===false,'fresh B finishes large checkpoint recovery');
 const got=B.doc.getMap('largeCatalog');
 assert.equal(got.size,syntheticData.size,'all 220 synthetic records present');
 for(const [key,value] of syntheticData)assert.equal(got.get(key),value,
   'large checkpoint must preserve every byte without dropped records');
 assert.equal(B.doc.store.pendingStructs,null);
 assert.equal(B.doc.store.pendingDs,null);
 assert.equal(B.storage.get('f123_yjs_pull_cursor_v2-y')?.rev,1);
 assert.equal(backend.ckpts.size,1);
 const pullReads=backend.calls.filter(c=>c.method==='GET'&&c.type==='o').length;
 console.log('SYNTHETIC_250K_READ_COUNTS', JSON.stringify({beforeB:readsBeforeB,afterTotal:pullReads,newB:pullReads-readsBeforeB}));
 assert.equal(pullReads-readsBeforeB,3,'B should need HEAD, checkpoint pull and final HEAD only');
 B.channel.pausar();
});
