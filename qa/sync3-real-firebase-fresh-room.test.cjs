'use strict';
// Strictly isolated REAL Firebase QA test: fresh random room, encrypted synthetic
// Yjs-only data, explicit GET/POST budgets, no customer license, PIN or deletions.
const test=require('node:test').test;
const assert=require('node:assert/strict');
const {webcrypto,randomBytes}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

const expected=process.env.F123_EXPECTED_SHA;
const root=process.env.F123_SOURCE_ROOT;
assert.ok(root&&/^[a-f0-9]{40}$/.test(expected||''),'immutable candidate SHA required');
assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),expected);
const yjs=fs.readFileSync(path.join(root,'docs/sync-yjs.js'),'utf8');
const adapter=fs.readFileSync(path.join(root,'docs/firebase-relay.js'),'utf8');
const vendor=fs.readFileSync(path.join(root,'docs/vendor/yjs-bundle.min.js'),'utf8');
const beginning=yjs.indexOf('  function _frame('),ending=yjs.indexOf('  // Carga perezosa',beginning);
assert.ok(beginning>=0&&ending>beginning,'real sync engine extraction boundary');
const transport=yjs.slice(beginning,ending);

// This 40-hex room is freshly generated for EACH test invocation and never
// logged. It cannot be derived from any customer's licence or notebook.
const room=randomBytes(20).toString('hex');
const origin='https://friendly-123-ab7b3-default-rtdb.firebaseio.com';
const prefix='/f123/'+room+'-y/';
const MAX_DOWN=4*1024*1024,MAX_UP=384*1024,MAX_WRITES=8;
const metrics={readBytes:0,uploadBytes:0,writes:0,requests:0,opWrites:0,ckptWrites:0};
const events=[];
const dbFetch=async (url,opts={})=>{
  const u=new URL(url);
  const method=(opts.method||'GET').toUpperCase();
  if(u.origin!==origin||!u.pathname.startsWith(prefix)||
      !/^\/f123\/[a-f0-9]{40}-y\/(?:k|o)(?:\/[^/]+)?\.json$/.test(u.pathname)||
      !['GET','POST'].includes(method)||
      (method==='POST'&&u.searchParams.get('x-http-method-override')!=='PUT'))
    throw Error('QA network boundary violation (fail closed)');
  const body=opts.body||'';
  if(method==='POST'){
    const bytes=Buffer.byteLength(String(body));
    if(++metrics.writes>MAX_WRITES||(metrics.uploadBytes+=bytes)>MAX_UP)
      throw Error('QA write budget exhausted (fail closed)');
    if(u.pathname.includes('/o/'))metrics.opWrites++;
    if(u.pathname.includes('/k/'))metrics.ckptWrites++;
  }
  if(++metrics.requests>100)throw Error('QA request budget exhausted');
  const response=await fetch(url,{...opts,signal:AbortSignal.timeout(12000)});
  // Meter all actual response bytes without exposing ciphertext or URL.
  const copy=await response.clone().arrayBuffer();
  if((metrics.readBytes+=copy.byteLength)>MAX_DOWN)
    throw Error('QA read budget exhausted (fail closed)');
  if(!response.ok)throw Error('Firebase REST unavailable or permission denied');
  return response;
};
const shallow=async kind=>{
  const r=await dbFetch(origin+prefix+kind+'.json?shallow=true',{method:'GET'});
  return Object.keys(await r.json()||{});
};
const timerWait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check,what,limit=25000){
  const start=Date.now();
  while(Date.now()-start<limit){
    if(check())return;
    await timerWait(40);
  }
  assert.ok(check(),what);
}
function device(aesKey,seed){
  const timers=[],storage=new Map();
  const db={objectStoreNames:{contains:k=>k==='updates'},
    transaction(){const tx={};queueMicrotask(()=>tx.oncomplete?.());return tx;}};
  const persist={whenSynced:Promise.resolve(),db,
    get:async key=>structuredClone(storage.get(key)),
    set:async(key,value)=>storage.set(key,structuredClone(value))};
  const encrypt=async(_,frame)=>{
    const iv=webcrypto.getRandomValues(new Uint8Array(12));
    const c=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},aesKey,frame);
    const out=new Uint8Array(12+c.byteLength);
    out.set(iv);out.set(new Uint8Array(c),12);
    return out.buffer;
  };
  const decrypt=async(_,frame)=>{
    const bytes=new Uint8Array(frame),iv=bytes.subarray(0,12);
    const c=await webcrypto.subtle.decrypt({name:'AES-GCM',iv},aesKey,bytes.subarray(12));
    return new Uint8Array(c);
  };
  const ctx={API:{clave:'ephemeral-aes-gcm-only',roomId:room,
    _store:{aplicar(){}},rollout:{outboxV2:false,gzipWrite:false}},
    RELAY_URL:'wss://friendly123-sync-relay.jfcarpio.workers.dev/sala/',
    crypto:webcrypto,window:{dispatchEvent(){}},navigator:{},
    document:{hidden:false,visibilityState:'visible',addEventListener(){},
      getElementById(){return null;},body:{appendChild(){}}},
    CustomEvent:class{constructor(type){this.type=type}},
    WebSocket:class{constructor(){throw Error('no other transport in this test');}},
    Response,URL,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Date,JSON,Math,
    Promise,DOMException,console:{log(){},error(){}},
    setTimeout(fn,ms){timers.push({fn,ms,cancelled:false});return timers.length;},
    clearTimeout(id){if(timers[id-1])timers[id-1].cancelled=true;},
    setInterval(){return 1;},clearInterval(){},
    btoa:v=>Buffer.from(v,'binary').toString('base64'),
    atob:v=>Buffer.from(v,'base64').toString('binary'),
    fetch(){throw Error('fetch must use bounded Firebase adapter');},
    log(){},cifrarBin:encrypt,descifrarBin:decrypt};
  vm.createContext(ctx);
  vm.runInContext(adapter,ctx);
  ctx.window.F123Relay=ctx.window.F123FirebaseRelay.create({
    db:origin,fetch:dbFetch,EventSource:null
  });
  const nativeConnect=ctx.window.F123Relay.connect;
  ctx.window.F123Relay.connect=function(url){
    const socket=nativeConnect(url);
    socket.relayLayer='f123_relay_cupo_fb_v1';
    socket.addEventListener('close',ev=>events.push({event:'closed',code:ev.code}));
    return socket;
  };
  vm.runInContext(transport+'\nthis.make=crearCanal;',ctx);
  vm.runInContext(vendor,ctx);
  const Y=ctx.Y,doc=new Y.Doc();
  if(seed)seed(doc);
  const channel=ctx.make(Y,doc,'-y','catalogo',true,null,persist);
  doc.on('update',(update,src)=>{
    if(src!=='red'&&src!==persist)channel.enviarUpdate(update);
  });
  channel.conectar();
  return {doc,channel,timers,storage};
}
const hydrated=d=>d.channel.recuperando===false&&
  !d.doc.store.pendingStructs&&!d.doc.store.pendingDs;
async function checkpoint(d,rev){
  await until(()=>d.timers.some(t=>!t.cancelled&&(t.ms===250||t.ms===2500)),
    'complete doc schedules one checkpoint');
  d.timers.filter(t=>!t.cancelled&&(t.ms===250||t.ms===2500)).at(-1).fn();
  await until(()=>d.storage.get('f123_relay_outbox_v1-y')?.checkpoint&&
    d.storage.get('f123_relay_outbox_v1-y').pending.filter(v=>v.k==='ckpt').length===0,
    'full checkpoint must have matching persistence ACK');
  await until(()=>metrics.ckptWrites>=rev,'new checkpoint physically written');
  assert.ok((await shallow('k')).includes(String(rev)),
    'Firebase exposes the expected checkpoint revision after ACK');
}

test('fresh REAL Firebase synthetic A→checkpoint ACK→B→operation ACK→C→new checkpoint ACK→D', {timeout:120000},async()=>{
  assert.deepEqual(await shallow('k'),[],'random room must start without checkpoints');
  assert.deepEqual(await shallow('o'),[],'random room must start without operations');
  const aesKey=await webcrypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  const A=device(aesKey,doc=>{
    doc.getMap('identity').set('synthetic-count',33);
    doc.getMap('identity').set('synthetic-other',3);
  });
  await until(()=>hydrated(A),'A initial remote HEAD and hydration');
  await checkpoint(A,1);
  A.channel.pausar();

  const B=device(aesKey);
  await until(()=>hydrated(B),'B cold-joins real checkpoint v1');
  assert.equal(B.doc.getMap('identity').get('synthetic-count'),33);
  B.doc.getMap('identity').set('synthetic-count',15);
  await until(()=>metrics.opWrites>=1,'B submits encrypted newest movement');
  await until(()=>B.storage.get('f123_relay_outbox_v1-y')?.pending.filter(v=>v.k==='op').length===0,
    'B waits until operation ACK and retirement');
  assert.equal((await shallow('o')).length,1,'one post-checkpoint durable synthetic change');
  B.channel.pausar();

  const C=device(aesKey);
  await until(()=>hydrated(C),'C cold-joins v1 and newest op');
  assert.equal(C.doc.getMap('identity').get('synthetic-count'),15);
  assert.equal(C.doc.getMap('identity').get('synthetic-other'),3);
  assert.equal(C.doc.store.pendingStructs,null);
  assert.equal(C.doc.store.pendingDs,null);
  assert.equal(C.storage.get('f123_yjs_pull_cursor_v2-y')?.rev,1);
  await checkpoint(C,2);
  C.channel.pausar();

  const readsBeforeD=metrics.requests;
  const D=device(aesKey);
  const started=Date.now();
  await until(()=>hydrated(D),'D completes cold join from revision 2');
  const durationMs=Date.now()-started;
  assert.equal(D.doc.getMap('identity').get('synthetic-count'),15);
  assert.equal(D.doc.getMap('identity').get('synthetic-other'),3);
  assert.equal(D.doc.store.pendingStructs,null);
  assert.equal(D.doc.store.pendingDs,null);
  assert.equal(D.storage.get('f123_yjs_pull_cursor_v2-y')?.rev,2);
  assert.equal((await shallow('k')).length,2);
  assert.equal((await shallow('o')).length,1);
  assert.ok(durationMs<10000,'fresh real Firebase join must finish <10 seconds');
  assert.ok(metrics.readBytes<MAX_DOWN&&metrics.uploadBytes<MAX_UP);
  console.log('REAL_FIREBASE_ISOLATED_CKPT',JSON.stringify({
    acknowledgedCheckpointRevisions:2,acknowledgedOps:1,
    latestSyntheticCount:15,missingParents:0,
    freshReaderMs:durationMs,freshReaderRequests:metrics.requests-readsBeforeD,
    totalReadKiB:Math.ceil(metrics.readBytes/1024),
    totalUploadKiB:Math.ceil(metrics.uploadBytes/1024),
    noClientLicenseOrPin:true
  }));
  D.channel.pausar();
});
