'use strict';
// Integration contract for the EXACT production Firebase REST relay adapter, without
// touching Firebase/Supabase, production licenses, or encrypted customer data.
// PINNED v694 by the GitHub Actions checkout. Synthetic REST server is in memory.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=process.env.F123_SOURCE_ROOT;
const expected='dbc361a01bc0b97b90ccfe9bd86379c20639cc29';
assert.ok(root,'F123_SOURCE_ROOT required: no implicit source');
assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),expected);
const source=fs.readFileSync(path.join(root,'docs/firebase-relay.js'),'utf8');
const fakeURL='wss://friendly123-sync-relay.jfcarpio.workers.dev/sala/'+ 'a'.repeat(40)+'-y';
const base='https://synthetic.invalid';
const checkpointCipher=Buffer.from([0,1,2,3,4,5,6,7]).toString('base64');

const sleep=()=>new Promise(r=>setImmediate(r));
async function until(predicate,label) {
 for(let i=0;i<150;i++){if(predicate())return;await new Promise(r=>setTimeout(r,2));}
 assert.ok(predicate(),label);
}
function rest({rejectCheckpoint=false}={}) {
 const k=new Map(),o=new Map(),requests=[];
 function ok(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});}
 async function fetchSynthetic(url,options={}) {
  const u=new URL(url);assert.equal(u.origin,base,'STRICT NO EXTERNAL NETWORK');
  const m=/^\/f123\/([a-f0-9]{40}-y)\/(k|o)(?:\/([^/]+))?\.json$/.exec(u.pathname);
  assert.ok(m,'only synthetic catalog paths are permitted');
  const kind=m[2],entry=m[3],isWrite=options.method==='POST'&&u.searchParams.get('x-http-method-override')==='PUT';
  const method=isWrite?'PUT':options.method||'GET';
  requests.push({method,kind,entry:entry||null});
  if(isWrite) {
   if(kind==='k'&&entry) {
    if(rejectCheckpoint)return ok({error:'synthetic refused'},503);
    assert.ok(!k.has(entry),'checkpoint revision must not be overwritten');
    k.set(entry,JSON.parse(options.body));
    return ok(k.get(entry));
   }
   if(kind==='o'&&entry) {
    o.set(entry,JSON.parse(options.body));return ok(o.get(entry));
   }
   assert.fail('unsupported synthetic write');
  }
  assert.equal(method,'GET','only GET and explicit method-override PUT are supported');
  if(kind==='k') {
   if(entry)return ok(k.get(entry)||null);
   if(u.searchParams.get('shallow')==='true')return ok(Object.fromEntries([...k.keys()].map(key=>[key,true])));
   return ok(Object.fromEntries(k));
  }
  if(kind==='o') {
   if(entry)return ok(o.get(entry)||null);
   return ok(Object.fromEntries(o));
  }
  assert.fail('unexpected synthetic path');
 }
 return {k,o,requests,fetchSynthetic};
}
function adapter(store) {
 const scope={window:{},URL,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,
   Promise,Date,Math,Number,String,Object,Response,DOMException,
   btoa:binary=>Buffer.from(binary,'binary').toString('base64'),
   atob:b64=>Buffer.from(b64,'base64').toString('binary'),
   fetch(){throw Error('default/global fetch forbidden in test');}};
 vm.createContext(scope);vm.runInContext(source,scope);
 return scope.window.F123FirebaseRelay.create({
  db:base,fetch:store.fetchSynthetic,EventSource:null
 });
}
async function connect(relay) {
 const sock=relay.connect(fakeURL);
 const text=[],frames=[];
 sock.addEventListener('message',ev=>{
  if(typeof ev.data==='string')text.push(JSON.parse(ev.data));
  else if(ev.data instanceof ArrayBuffer||Object.prototype.toString.call(ev.data)==='[object ArrayBuffer]')
    frames.push(Buffer.from(ev.data));
 });
 await until(()=>sock.readyState===1,'synthetic adapter opens with REST GET');
 return {sock,text,frames};
}
async function message(con,name,payload) {
 con.sock.send(JSON.stringify(payload));
 await until(()=>con.text.some(m=>m.k===name),'received '+name);
 return con.text.filter(m=>m.k===name).at(-1);
}
test('real Firebase adapter A ACK -> persisted revision -> B HEAD/one-page replay + second HEAD',async()=>{
 const store=rest(),A=await connect(adapter(store));
 const ack=await message(A,'persist-result',{
  k:'ckpt',v:2,ack:1,id:'synthetic-ckpt-001',
  rev:0,seq:0,lam:1,c:checkpointCipher
 });
 assert.deepEqual({kind:ack.kind,ok:ack.ok,conflict:ack.conflict},
  {kind:'ckpt',ok:true,conflict:false});
 assert.equal(store.k.size,1,'persist-result should follow actual REST checkpoint storage');
 assert.ok(store.k.has('1'),'first checkpoint revision is visible');
 const directHead=await adapter(store).leerHead(fakeURL);
 assert.deepEqual({rev:directHead.rev,seq:directHead.seq},{rev:1,seq:0},
  'read-only head reflects remote persisted checkpoint');
 A.sock.close();
 const B=await connect(adapter(store));
 const h=await message(B,'head-result',{k:'head',v:2});
 assert.equal(h.rev,1);
 assert.equal(h.seq,0);
 B.sock.send(JSON.stringify({k:'pull',v:2,rev:-1,seq:0,limit:64}));
 await until(()=>B.frames.length>0,'new device receives encrypted checkpoint frame');
 await until(()=>B.text.some(m=>m.k==='pull-page'),'new device sees pull cursor and final page');
 assert.deepEqual(B.frames[0],Buffer.from(checkpointCipher,'base64'));
 const pg=B.text.filter(m=>m.k==='pull-page').at(-1);
 assert.deepEqual({rev:pg.rev,seq:pg.seq,n:pg.n,more:pg.more},
  {rev:1,seq:0,n:0,more:false});
 const h2=await message(B,'head-result',{k:'head',v:2});
 assert.equal(h2.rev,1,'final HEAD remains consistent with replayed checkpoint');
 assert.equal(h2.seq,0);
 assert.equal(store.k.size,1);
 assert.ok(store.requests.every(x=>x.method==='GET'||x.method==='PUT'));
 assert.ok(store.requests.some(x=>x.kind==='k'&&x.method==='PUT'));
 B.sock.close();
});
test('real Firebase adapter rejects ckpt REST 503 without false persist ACK or fake HEAD advance',async()=>{
 const store=rest({rejectCheckpoint:true});
 const A=await connect(adapter(store));
 const ack=await message(A,'persist-result',{
  k:'ckpt',v:2,ack:1,id:'synthetic-ckpt-refused',rev:0,seq:0,
  lam:1,c:checkpointCipher
 });
 assert.equal(ack.ok,false);
 assert.equal(ack.conflict,false);
 assert.equal(store.k.size,0,'refused checkpoint must not appear remotely');
 const head=await adapter(store).leerHead(fakeURL);
 assert.deepEqual({rev:head.rev,seq:head.seq},{rev:0,seq:0});
 A.sock.close();
});
