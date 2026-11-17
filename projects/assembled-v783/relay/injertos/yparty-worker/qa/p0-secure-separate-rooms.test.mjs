// P0 real Workerd + central issuer protocol QA. Synthetic Owner and store ONLY.
// Tests an ACTUAL 2-room YServer protocol, never production/cust data.
import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {build} from 'esbuild';import {Miniflare} from 'miniflare';
import WebSocket from 'ws';import * as Y from 'yjs';import YProvider from 'y-partyserver/provider';
import authorityWorker,{RegistroLicencias} from '../../../../app/cloudflare-worker/worker.js';
import {pinAuthority} from '../../../../app/cloudflare-worker/pin-authority.mjs';
import {salaDeLicencia} from '../src/sala.js';

const license='F123-SYNTHETIC-TEAM',instance='synthetic-room-client',key='synthetic-service-bridge-test-key-32-bytes',persist=fs.mkdtempSync(path.join(os.tmpdir(),'f123-two-room-'));
let db,env,mf,url,room,bundle,registry,allowChannels=true,photoFlag=true;
function storage(){
 let records=new Map(),tail=Promise.resolve();
 return {get:async k=>structuredClone(records.get(k)),
 transaction:async fn=>{let release;const previous=tail;tail=new Promise(r=>release=r);await previous;
 const snapshot=new Map([...records].map(([k,v])=>[k,structuredClone(v)]));
 try{const result=await fn({get:async k=>structuredClone(snapshot.get(k)),put:async(k,v)=>snapshot.set(k,structuredClone(v)),
 delete:async k=>snapshot.delete(k),list:async({prefix,limit})=>new Map([...snapshot].filter(([k])=>k.startsWith(prefix)).slice(0,limit))});records=snapshot;return result;}
 finally{release();}}};
}
async function relay(){
 const mfBindings={SALA_PILOTO:room,WS_AUTHORITY_QA:'1',WS_SEPARATE_ROOMS_QA:allowChannels?'1':'0',WS_PHOTO_BLOBS_QA:photoFlag?'1':'0',WS_TYPED_COMMANDS_QA:'1',WS_PHOTO_ORIGIN_QA:'https://synthetic-photo.test',WS_SERVICE_KEY:key};
 mf=new Miniflare({modules:true,script:bundle,compatibilityDate:'2026-06-01',compatibilityFlags:['nodejs_compat'],
 durableObjects:{Tienda:{className:'Tienda',useSQLite:true}},durableObjectsPersist:path.join(persist,'do'),
 kvNamespaces:['LICENCIAS'],bindings:mfBindings,
 serviceBindings:{WS_AUTHORITY:async request=>authorityWorker.fetch(new Request(request.url,request),env)}});
 await(await mf.getKVNamespace('LICENCIAS')).put('inst:'+instance,JSON.stringify({licenseCode:license,instanceId:instance}));
 url=await mf.ready;
}
async function api(endpoint,body){
 return authorityWorker.fetch(new Request('https://authority.invalid'+endpoint,{method:'POST',
 headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env);
}
async function issue(channel,scopes){
 const result=await api('/ws/ticket',{credentials:{kind:'owner',licenseCode:license,instanceId:instance,pin:'123'},
  room:room+'-'+channel,scopes,ttlMs:30000});
 const body=await result.json();
 assert.equal(result.status,200,JSON.stringify(body));
 return body.token;
}
async function waitFor(predicate,label){
 const start=Date.now();
 while(!predicate()){
  if(Date.now()-start>6500)throw Error('timeout waiting for '+label);
  await new Promise(r=>setTimeout(r,25));
 }
}
async function connect(channel,scopes){
 const doc=new Y.Doc(),token=await issue(channel,scopes);
 const provider=new YProvider(url.host,room+'-'+channel,doc,{party:'tienda',
  params:{licencia:license,instancia:instance,cap:token},WebSocketPolyfill:WebSocket,disableBc:true});
 try{await waitFor(()=>provider.synced,channel+' sync');return{doc,provider,token,
  close(){provider.destroy();doc.destroy();}};}
 catch(error){provider.destroy();doc.destroy();throw error;}
}
async function attempt(channel,token){
 const target=new URL('/parties/tienda/'+room+'-'+channel,url);target.protocol='ws:';
 target.search=new URLSearchParams({licencia:license,instancia:instance,...(token?{cap:token}:{})});
 return new Promise(resolve=>{
  const ws=new WebSocket(target);let outcome='unknown',binary=0,done=false;
  const finish=result=>{if(done)return;done=true;clearTimeout(timer);ws.terminate();resolve({status:result,binary});};
  const timer=setTimeout(()=>finish(outcome==='connected'?'open':'timeout'),900);
  ws.on('open',()=>{outcome='connected';});
  ws.on('message',(_data,isBinary)=>{if(isBinary)binary++;});
  ws.on('unexpected-response',(_req,res)=>finish(res.statusCode));
  ws.on('close',code=>finish(code));ws.on('error',()=>{});
 });
}
before(async()=>{
 room=await salaDeLicencia(license);
 db=storage();await db.transaction(tx=>tx.put('inst:'+instance,{licenseCode:license,instanceId:instance}));
 env={PIN_PEPPER:'synthetic-owner-secret-more-than-32bytes',TEAM_PIN_PEPPER:'synthetic-team-secret-separate-32bytes',
 TEAM_AUTHORITY_QA:'1',TEAM_AUTHORITY_LICENSE:license,WS_AUTHORITY_QA:'1',
 WS_SIGNING_KEY:'synthetic-ws-signing-secret-more-than-32bytes',WS_SERVICE_KEY:key};
 const owner=pinAuthority(db,env.PIN_PEPPER);await owner.masterSet(license,'123',0,[instance]);await owner.masterActivate(license,'123',0,[instance]);
 registry=new RegistroLicencias({storage:db},env);
 env.REGISTROS={idFromName:()=>({}),get:()=>({fetch:(input,opts)=>registry.fetch(new Request(input,opts))})};
 const buildOutput=await build({entryPoints:[path.join(import.meta.dirname,'../src/index.js')],
  bundle:true,format:'esm',platform:'neutral',mainFields:['module','main'],
  conditions:['workerd','worker','browser'],external:['cloudflare:*'],write:false});
 bundle=buildOutput.outputFiles[0].text;await relay();
});
after(async()=>{await mf?.dispose();fs.rmSync(persist,{recursive:true,force:true});});

test('P0 actual Worker admits two separate centrally signed cat and ops rooms with no untrusted identifier-only access',{timeout:22000},async()=>{
 const cat=await connect('cat',['cat:read','cat:write']);
 const ops=await connect('ops',['ops:read','ops:sale']);
 try{
  cat.doc.getMap('products').set('synthetic-sku',{name:'Cat-only'});
  const catReceiver=await connect('cat',['cat:read']);
  const opsReceiver=await connect('ops',['ops:read']);
  try{
   await waitFor(()=>catReceiver.doc.getMap('products').has('synthetic-sku'),'cat receipt');
   assert.equal(ops.doc.getMap('products').size,0,'ops room must not receive cat Yjs structs');
   assert.equal(opsReceiver.doc.getMap('products').size,0,'second ops must not see cat fields');
   assert.equal((await attempt('cat',cat.token)).binary,0,'used one-time cat token denied before any Yjs');
   assert.notEqual((await attempt('ops',null)).status,'open','bare license and instance cannot open ops');
  }finally{catReceiver.close();opsReceiver.close();}
 }finally{cat.close();ops.close();}
});

test('P0 actual ops channel forbids Owner raw Yjs economic editing even with ops:sale scope',{timeout:22000},async()=>{
 const writer=await connect('ops',['ops:read','ops:sale']);
 try{
  writer.doc.getMap('eventos').set('forged-synthetic-sale',{amountCents:99999});
  const reader=await connect('ops',['ops:read']);
  try{
   await new Promise(resolve=>setTimeout(resolve,350));
   assert.equal(reader.doc.getMap('eventos').has('forged-synthetic-sale'),false,
    'ops:sale only authorizes typed server command, never CRDT raw edit');
  }finally{reader.close();}
 }finally{writer.close();}
});

test('P0 independent cat snapshot persists across full Workerd restart; ops remains isolated',{timeout:25000},async()=>{
 const cat=await connect('cat',['cat:read','cat:write']);
 cat.doc.getMap('products').set('cold-catalog-product',{priceCents:321});
 const receiver=await connect('cat',['cat:read']);
 await waitFor(()=>receiver.doc.getMap('products').has('cold-catalog-product'),'before restart');
 cat.close();receiver.close();
 await mf.dispose();await relay();
 const cold=await connect('cat',['cat:read']),coldOps=await connect('ops',['ops:read']);
 try{
  assert.equal(cold.doc.getMap('products').get('cold-catalog-product').priceCents,321);
  assert.equal(coldOps.doc.getMap('products').size,0);
 }finally{cold.close();coldOps.close();}
});

test('P0 backwards-compatible priv admission remains owner-only and separate-room flag OFF denies cat/ops',{timeout:25000},async()=>{
 const priv=await connect('priv',['priv:read','priv:write']);
 priv.close();
 await mf.dispose();allowChannels=false;await relay();
 try{
  for(const channel of ['cat','ops']){
   const token=await issue(channel,[channel+':read']);
   const result=await attempt(channel,token);
   assert.notEqual(result.status,'open','no insecure fallback for '+channel);
   assert.equal(result.binary,0);
  }
 }finally{await mf.dispose();allowChannels=true;await relay();}
});


async function photoHttp(method,sha,token,body) {
 const target=new URL('/parties/tienda/'+room+'-fotos?sha='+sha,url);
 const headers={'x-f123-license':license,'x-f123-instance':instance};
 if(token)headers.authorization='Bearer '+token;
 if(method==='PUT')headers['content-type']='image/png';
 return fetch(target,{method,headers,...(body?{body}:{}),redirect:'manual'});
}
async function syntheticSha(bytes) {
 const hash=await crypto.subtle.digest('SHA-256',bytes);
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
test('P0 real Workerd photo SHA blob (>2MiB) remains byte-identical after full cold restart and is never a Yjs room',{timeout:35000},async()=>{
 const bytes=new Uint8Array(2*1024*1024+517);for(let i=0;i<bytes.length;i++)bytes[i]=i%251;
 const sha=await syntheticSha(bytes);
 const writer=await issue('fotos',['fotos:write']);
 const put=await photoHttp('PUT',sha,writer,bytes);
 assert.equal(put.status,201,'signed one-use fotos:write must persist immutable SHA bytes');
 const receipt=await put.json();
 assert.deepEqual({sha:receipt.sha,bytes:receipt.bytes,tipo:receipt.tipo},{sha,bytes:bytes.length,tipo:'image/png'});
 assert.equal((await photoHttp('PUT',sha,writer,bytes)).status,403,'replayed one-use ticket denied');
 assert.notEqual((await attempt('fotos',await issue('fotos',['fotos:read']))).status,'open','photo endpoint must not become a raw Yjs WebSocket room');
 const reader=await issue('fotos',['fotos:read']),get=await photoHttp('GET',sha,reader);
 assert.equal(get.status,200);
 assert.equal(get.headers.get('content-type'),'image/png');
 assert.deepEqual(new Uint8Array(await get.arrayBuffer()),bytes);
 await mf.dispose();await relay();
 const cold=await photoHttp('GET',sha,await issue('fotos',['fotos:read']));
 assert.equal(cold.status,200,'read after Durable Object full restart');
 assert.deepEqual(new Uint8Array(await cold.arrayBuffer()),bytes);
});
test('P0 photo upload is fail-closed on missing/replayed/wrong role ticket, wrong hash, or disabled flag',{timeout:20000},async()=>{
 const bytes=new Uint8Array([137,80,78,71,1,2,3,4,5]);
 const sha=await syntheticSha(bytes),wrong='f'.repeat(64);
 assert.equal((await photoHttp('PUT',sha,null,bytes)).status,403,'bare license+instance cannot upload');
 const wrongScope=await issue('fotos',['fotos:read']);
 assert.equal((await photoHttp('PUT',sha,wrongScope,bytes)).status,403,'read ticket cannot write');
 const hashTicket=await issue('fotos',['fotos:write']);
 assert.equal((await photoHttp('PUT',wrong,hashTicket,bytes)).status,422,'SHA mismatch must never write');
 const absent=await photoHttp('GET',wrong,await issue('fotos',['fotos:read']));
 assert.equal(absent.status,404,'uncommitted blob not readable');
 await mf.dispose();photoFlag=false;await relay();
 try{
  assert.equal((await photoHttp('PUT',sha,await issue('fotos',['fotos:write']),bytes)).status,404,'disabled QA never exposes HTTP blob endpoint');
  assert.equal((await photoHttp('GET',sha,await issue('fotos',['fotos:read']))).status,404,'disabled QA never leaks existing bytes');
 }finally{await mf.dispose();photoFlag=true;await relay();}
});

test('P0 real Workerd photo CORS: exact HTTPS origin only, browser preflight and cross-origin GET authorized',{timeout:16000},async()=>{
 const target=new URL('/parties/tienda/'+room+'-fotos?sha='+'b'.repeat(64),url);
 const preflight=(origin)=>fetch(target,{method:'OPTIONS',headers:{
  origin,'access-control-request-method':'PUT',
  'access-control-request-headers':'authorization,x-f123-license,x-f123-instance,content-type'
 }});
 const allowed=await preflight('https://synthetic-photo.test');
 assert.equal(allowed.status,204,'browser Authorization preflight must be routable');
 assert.equal(allowed.headers.get('access-control-allow-origin'),'https://synthetic-photo.test');
 assert.match(allowed.headers.get('access-control-allow-methods')||'',/PUT/);
 const wrong=await preflight('https://other-origin.example');
 assert.equal(wrong.status,403,'no wildcard or reflection for other origins');
 assert.equal(wrong.headers.get('access-control-allow-origin'),null);
 const bytes=new Uint8Array([137,80,78,71,65,66]),sha=await syntheticSha(bytes),destination=new URL(target);
 destination.searchParams.set('sha',sha);
 const token=await issue('fotos',['fotos:write']);
 const uploaded=await fetch(destination,{method:'PUT',headers:{
  authorization:'Bearer '+token,'x-f123-license':license,'x-f123-instance':instance,
  'content-type':'image/png',origin:'https://synthetic-photo.test'
 },body:bytes});
 assert.equal(uploaded.status,201);
 assert.equal(uploaded.headers.get('access-control-allow-origin'),'https://synthetic-photo.test');
 const token2=await issue('fotos',['fotos:read']);
 const recovered=await fetch(destination,{method:'GET',headers:{
  authorization:'Bearer '+token2,'x-f123-license':license,'x-f123-instance':instance,
  origin:'https://synthetic-photo.test'
 }});
 assert.equal(recovered.status,200);
 assert.equal(recovered.headers.get('access-control-allow-origin'),'https://synthetic-photo.test');
 assert.deepEqual(new Uint8Array(await recovered.arrayBuffer()),bytes);
 const denied=await fetch(destination,{method:'GET',headers:{origin:'https://other-origin.example'}});
 assert.equal(denied.status,403);
 assert.equal(denied.headers.get('access-control-allow-origin'),null);
});


test('P0 Team cannot read private catalog Y.Doc until a sanitized public projection is independently served',{timeout:45000},async()=>{
 const {teamAuthority}=await import('../../../../app/cloudflare-worker/team-authority.mjs');
 // Real issuer may authorize an employee to see a future public projection,
 // but this -cat room includes OWNER-private roots and must deny Team before Yjs.
 env.WS_QA_ROLE_GRANTS=JSON.stringify({empleado:['cat:read'],admin:['cat:read','cat:write']});
 const owner=pinAuthority(db,env.PIN_PEPPER);
 const team=teamAuthority({storage:db,ownerAuthority:owner,secret:env.TEAM_PIN_PEPPER});
 const identity={licenseCode:license,instanceId:instance,subject:'synthetic-employee-a'};
 const created=await team.update({...identity,role:'empleado',active:true,pin:'222',ownerPin:'123',
  expectedRevision:0,opId:'synthetic-team-register-a'});
 assert.equal(created.ok,true,JSON.stringify(created));
 const ticket=async(channel,scopes,credentials={kind:'team',...identity,pin:'222'})=>{
  const response=await api('/ws/ticket',{credentials,room:room+'-'+channel,scopes,ttlMs:30000});
  return {status:response.status,data:await response.json()};
 };
 const writer=await connect('cat',['cat:read','cat:write']);
 try{
  writer.doc.getMap('products').set('team-readable-catalog',{priceCents:850});
  writer.doc.getMap('_meta').set('pinsRol',{owner:'SYNTHETIC_PRIVATE_ROLE_MARKER'});
  writer.doc.getMap('clientes').set('private-synthetic-customer',{email:'nobody@example.invalid'});
  writer.doc.getMap('hechos_financieros').set('private-synthetic-cash',{amountCents:72900});
  // Owner access MUST remain functional after denying Team.
  const anotherOwner=await connect('cat',['cat:read']);
  try{
   await waitFor(()=>anotherOwner.doc.getMap('products').has('team-readable-catalog'),'Owner catalog');
   await waitFor(()=>anotherOwner.doc.getMap('_meta').has('pinsRol'),'Owner private metadata');
   assert.equal(anotherOwner.doc.getMap('clientes').has('private-synthetic-customer'),true);
   assert.equal(anotherOwner.doc.getMap('hechos_financieros').has('private-synthetic-cash'),true);
  }finally{anotherOwner.close();}
  const issued=await ticket('cat',['cat:read']);
  assert.equal(issued.status,200,'central issuer can authorize a future sanitized Team read view');
  const initial=await attempt('cat',issued.data.token);
  assert.equal(initial.binary,0,'Team must receive ZERO Yjs bytes from owner-private catalog');
  assert.notEqual(initial.status,'open','Team private catalog admission must fail closed');
  assert.equal((await attempt('cat',issued.data.token)).binary,0,'reused Team token must also expose zero bytes');
  assert.notEqual((await ticket('ops',['ops:read'])).status,200,'Team cannot access raw economic room');
  const standby=await ticket('cat',['cat:read']);
  assert.equal(standby.status,200);
  const revoked=await team.update({...identity,role:'empleado',active:false,ownerPin:'123',
    expectedRevision:created.revision,opId:'synthetic-team-revoke-a'});
  assert.equal(revoked.ok,true,JSON.stringify(revoked));
  const after=await attempt('cat',standby.data.token);
  assert.equal(after.binary,0,'revoked and previously issued Team ticket receives zero Yjs bytes');
  assert.notEqual(after.status,'open');
  assert.notEqual((await ticket('cat',['cat:read'])).status,200,'issuer refuses revoked Team');
  const adminSubject='synthetic-team-admin-z';
  const adminSetup=await team.update({licenseCode:license,instanceId:instance,subject:adminSubject,
    role:'admin',active:true,pin:'333',ownerPin:'123',
    expectedRevision:revoked.revision,opId:'synthetic-team-admin-join'});
  assert.equal(adminSetup.ok,true,JSON.stringify(adminSetup));
  const adminCredentials={kind:'team',licenseCode:license,instanceId:instance,subject:adminSubject,pin:'333'};
  const adminRead=await ticket('cat',['cat:read'],adminCredentials);
  assert.equal(adminRead.status,200);
  assert.equal((await attempt('cat',adminRead.data.token)).binary,0,'admin read cannot access private Owner Y.Doc');
  const adminWrite=await ticket('cat',['cat:read','cat:write'],adminCredentials);
  assert.equal(adminWrite.status,200);
  const raw=await attempt('cat',adminWrite.data.token);
  assert.equal(raw.binary,0,'Team admin raw write must never receive initial private Yjs state');
  assert.notEqual(raw.status,'open');
 }finally{
  writer.close();
  delete env.WS_QA_ROLE_GRANTS;
 }
});

test('P0 real Worker typed sale HTTP: central fresh Owner ticket, 202 inbox only, conflict/replay/cross-room denied',{timeout:24000},async()=>{
 // Synthetic test isolation only: previous 8 tests issued nearly all 32/min
 // HMAC tickets. This does NOT change production rate limiting or cap checks.
 await db.transaction(tx=>tx.delete('ws-issue-rate-v1:'+license+':'+instance));
 const command={opId:'synthetic-op-http-001',kind:'sale.record',license,
   productId:'synthetic-sku',quantity:1,amountCents:2500};
 const target=new URL('/parties/tienda/'+room+'-ops',url);
 const send=async(token,cmd=command)=>{
   const response=await fetch(target,{method:'POST',headers:{
     'content-type':'application/json','authorization':'Bearer '+token,
     'x-f123-license':license,'x-f123-instance':instance
   },body:JSON.stringify(cmd)});
   let body;try{body=await response.json();}catch(_){body={};}
   return {status:response.status,body};
 };
 const firstToken=await issue('ops',['ops:sale']);
 const first=await send(firstToken);
 assert.equal(first.status,202,'not an economic commit; no browser may mark sale paid yet');
 assert.equal(first.body.receipt?.stage,'stored-for-application');
 assert.equal(first.body.ok,true);
 const reused=await send(firstToken);
 assert.equal(reused.status,403,'no bearer bypass');
 const readOnly=await send(await issue('ops',['ops:read']));
 assert.equal(readOnly.status,403,'ops:read cannot post a sale');
 const crossed=await send(await issue('cat',['cat:read']));
 assert.equal(crossed.status,403,'cat cap cannot mutate ops');
 const fresh=await send(await issue('ops',['ops:sale']));
 assert.equal(fresh.status,202);
 assert.equal(fresh.body.duplicate,true);
 assert.deepEqual(fresh.body.receipt,first.body.receipt,'idempotent inbox receipt');
 const changed=await send(await issue('ops',['ops:sale']),{...command,amountCents:1});
 assert.equal(changed.status,409,'same opId, different money is prohibited');
 const other=await send(await issue('ops',['ops:sale']),{...command,opId:'synthetic-op-http-002'});
 assert.equal(other.status,202);
 assert.equal(other.body.receipt.stage,'stored-for-application');
 assert.equal('saleCommitted' in other.body.receipt,false);
});
