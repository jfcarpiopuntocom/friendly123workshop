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
let db,env,mf,url,room,bundle,registry,allowChannels=true;
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
 const mfBindings={SALA_PILOTO:room,WS_AUTHORITY_QA:'1',WS_SEPARATE_ROOMS_QA:allowChannels?'1':'0',WS_SERVICE_KEY:key};
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
