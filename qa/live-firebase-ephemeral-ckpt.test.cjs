'use strict';
// P0 Firebase *remote provider* test. This intentionally uses an isolated,
// freshly generated synthetic room and opaque random test frames only.
// Never use a customer license, room ID, PIN, Y.Doc, product, price, or stock.
// The test owns ONLY the room after a verified empty preflight and always tries
// to DELETE and verify it in finally. No Firebase credentials are requested.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const cp = require('node:child_process');

const DB = 'https://friendly-123-ab7b3-default-rtdb.firebaseio.com';
const SRC = process.env.F123_SOURCE_ROOT;
const SHA = process.env.F123_EXPECTED_SHA;
assert.ok(SRC && /^[0-9a-f]{40}$/.test(SHA||''), 'pin the exact published source');
assert.equal(cp.execFileSync('git',['-C',SRC,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),SHA);
const SCRIPT = fs.readFileSync(path.join(SRC,'docs/firebase-relay.js'),'utf8');
assert.match(SCRIPT,/var MAX_TIE_ITEMS = 256/); // guard cannot silently vanish
assert.match(SCRIPT,/var CKPT_CIPHER_BYTES = 768 \* 1024/);

function socketAdapter(room) {
 const base='/f123/'+room+'-y/';
 let get=0, writes=0;
 const allowedFetch=async (url, opts={}) => {
   const parsed = new URL(url);
   assert.equal(parsed.origin,DB,'must never talk to any other domain');
   assert.ok(parsed.pathname.startsWith(base),
     'must never touch a customer room or another synthetic root');
   const method=String(opts.method||'GET').toUpperCase();
   assert.ok(['GET','POST'].includes(method),'adapter must not delete or patch rooms');
   if (method==='POST') {
     assert.equal(parsed.searchParams.get('x-http-method-override'),'PUT');
     assert.ok(/^\/f123\/f123[a-f0-9]{36}-y\/(?:o\/[^/]+|k\/[1-9]\d*)\.json$/.test(parsed.pathname),
       'adapter writes only ephemeral synthetic OP or CKPT records');
     writes++;
   } else get++;
   return fetch(url,opts);
 };
 const w={};
 const ctx={window:w,TextEncoder,TextDecoder,Blob,DOMException,
   fetch:allowedFetch,setTimeout,clearTimeout,URL,Date,Promise,
   btoa:x=>Buffer.from(x,'binary').toString('base64'),
   atob:x=>Buffer.from(x,'base64').toString('binary')};
 vm.runInNewContext(SCRIPT,ctx,{filename:'firebase-relay-v694.js',timeout:5000});
 const relay=w.F123FirebaseRelay.create({db:DB,fetch:allowedFetch,EventSource:null});
 return {relay,stats:()=>({gets:get,writes})};
}
function opened(socket,timeout=25000) {
 return new Promise((resolve,reject)=>{
  if(socket.readyState===1)return resolve();
  const timer=setTimeout(()=>{off();reject(Error('adapter open timeout'))},timeout);
  const ready=()=>{off();resolve()};
  const closed=()=>{off();reject(Error('adapter closed before open'))};
  function off(){clearTimeout(timer);socket.removeEventListener('open',ready);socket.removeEventListener('close',closed)}
  socket.addEventListener('open',ready);socket.addEventListener('close',closed);
 });
}
function awaitMessage(socket,predicate,ms=25000){
 let timer, message, closed;
 const promise=new Promise((resolve,reject)=>{
  message=e=>{
   const data=typeof e.data==='string' ? JSON.parse(e.data) :
     e.data&&e.data.byteLength!=null?{bytes:Buffer.from(new Uint8Array(e.data))}:null;
   if(data&&predicate(data)){off();resolve(data)}
  };
  closed=()=>{off();reject(Error('adapter socket closed'))};
  timer=setTimeout(()=>{off();reject(Error('adapter response timeout'))},ms);
  socket.addEventListener('message',message);socket.addEventListener('close',closed);
 });
 function off(){clearTimeout(timer);socket.removeEventListener('message',message);socket.removeEventListener('close',closed)}
 return promise;
}
async function sendAndWait(socket,body,predicate){
 const pending=awaitMessage(socket,predicate);
 socket.send(JSON.stringify(body));
 return pending;
}
test('REAL FIREBASE: fresh disposable QA room ACK -> HEAD -> fresh B CKPT & final HEAD, then securely DELETE own room',
 {timeout:155000,skip:process.env.F123_FIREBASE_EPHEMERAL!=='1'?'disabled unless explicit synthetic-only opt-in':false},
 async()=>{
  const room='f123'+crypto.randomBytes(18).toString('hex');
  assert.match(room,/^f123[a-f0-9]{36}$/);
  const root=DB+'/f123/'+room+'-y.json';
  let owned=false,a=null,b=null,cleanupError=null,thrown=null;
  const start=Date.now();
  let result=null;
  try{
   const empty=await fetch(root+'?shallow=true',{signal:AbortSignal.timeout(20000)});
   assert.equal(empty.status,200,'read-only preflight must succeed');
   assert.equal(await empty.json(),null,'must never overwrite an existing room');
   owned=true;
   const adapter=socketAdapter(room);
   const locator='wss://friendly123-sync-relay.jfcarpio.workers.dev/sala/'+room+'-y';
   a=adapter.relay.connect(locator);
   await opened(a);
   const op=crypto.randomBytes(64), ckpt=crypto.randomBytes(90);
   const opId='synthetic-'+crypto.randomBytes(8).toString('hex');
   const opAck=await sendAndWait(a,
     {k:'op',ack:1,id:opId,c:op.toString('base64'),lam:Date.now()},
     e=>e.k==='persist-result'&&e.kind==='op'&&e.id===opId);
   assert.equal(opAck.ok,true,'real Firebase must ACK a stored synthetic OP');
   const before=await sendAndWait(a,{k:'head',v:2},e=>e.k==='head-result');
   assert.equal(before.rev,0,'new room has no CKPT');
   assert.ok(Number.isSafeInteger(before.seq)&&before.seq>0,'real server timestamp, not local clock');
   const ckptId='ck-'+crypto.randomBytes(8).toString('hex');
   const ack=await sendAndWait(a,
     {k:'ckpt',ack:1,id:ckptId,v:2,rev:0,seq:before.seq,
      lam:Date.now(),c:ckpt.toString('base64')},
     e=>e.k==='persist-result'&&e.kind==='ckpt'&&e.id===ckptId);
   assert.equal(ack.ok,true,'real Firebase must ACK a durable CKPT');
   assert.equal(ack.conflict,false,'isolated empty room must not have CKPT conflict');
   const after=await sendAndWait(a,{k:'head',v:2},e=>e.k==='head-result');
   assert.equal(after.rev,1,'HEAD must read back committed CKPT revision');
   assert.equal(after.seq,before.seq,'no operation should be lost or invented');

   a.close();
   a=null;
   b=adapter.relay.connect(locator);
   await opened(b);
   const frame=awaitMessage(b,e=>e.bytes!=null);
   const page=awaitMessage(b,e=>e.k==='pull-page');
   const freshStart=Date.now();
   b.send(JSON.stringify({k:'pull',v:2,rev:-1,seq:0,limit:12}));
   const [frameReply,firstPage]=await Promise.all([frame,page]);
   assert.ok(frameReply.bytes.equals(ckpt),'fresh receiver gets exact committed opaque CKPT bytes');
   assert.equal(firstPage.rev,1);
   assert.equal(firstPage.more,false,'no pre-checkpoint OP replay after remote snapshot');
   assert.equal(firstPage.n,0);
   const last=await sendAndWait(b,{k:'head',v:2},e=>e.k==='head-result');
   assert.equal(last.rev,1);
   assert.equal(last.seq,before.seq);
   result={remoteAck:true,checkpointReadbackRev:1,firstPageFrames:1,
     priorOpsReplayed:0,finalHeadMatches:true,firstColdJoinMs:Date.now()-freshStart,
     calls:adapter.stats()};
  }catch(e){thrown=e}
  finally{
   try{if(a)a.close();if(b)b.close()}catch(_){}
   if(owned){
    try{
     const deletion=await fetch(root,{method:'DELETE',signal:AbortSignal.timeout(20000)});
     if(!deletion.ok)throw Error('synthetic room DELETE rejected HTTP '+deletion.status);
     const proof=await fetch(root+'?shallow=true',{signal:AbortSignal.timeout(20000)});
     if(!proof.ok||await proof.json()!==null)throw Error('synthetic room cleanup readback failed');
    }catch(e){cleanupError=e}
   }
  }
  if(cleanupError)throw new Error('QA synthetic room cleanup NOT confirmed: '+cleanupError.message);
  if(thrown)throw thrown;
  assert.ok(result?.remoteAck&&result?.finalHeadMatches);
  console.log('REAL_FIREBASE_SYNTHETIC_EPHEMERAL_ONLY',JSON.stringify({
   ...result,deletedAndVerified:true,runMs:Date.now()-start}));
 });
