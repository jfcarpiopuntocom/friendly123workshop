// Exact b93 relay plus real authority modules; local Workerd only, no production traffic.
import {before,after,test} from 'node:test';import assert from 'node:assert/strict';
import {AsyncLocalStorage} from 'node:async_hooks';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {build} from 'esbuild';import {Miniflare} from 'miniflare';import WebSocket from 'ws';import * as Y from 'yjs';import YProvider from 'y-partyserver/provider';
import authorityWorker,{RegistroLicencias} from '../../../../app/cloudflare-worker/worker.js';
import {pinAuthority} from '../../../../app/cloudflare-worker/pin-authority.mjs';
import {salaDeLicencia} from '../src/sala.js';
const license='F123-SYNTHETIC-TEAM',instance='synthetic-instance',secret='synthetic-private-sync-service-more-than-32bytes';
let mf,url,room,registry,env,db,bundle,available=true,holdCheckToken=null,holdEntered=null,releaseCheck=null,heldOnce=false;
const authorityTrace=new AsyncLocalStorage(),grants=new Map(),wireFrames=new Map(),revokedAt=new Map();let traceSeq=0;
function claimsOf(token){return JSON.parse(Buffer.from(token.split('.')[0],'base64url'));}
class AuditedSocket extends WebSocket{
 constructor(address,...rest){super(address,...rest);const token=new URL(address).searchParams.get('cap');let claims;try{claims=claimsOf(token);}catch(_){return;}
  this.on('message',(data,binary)=>{const frames=wireFrames.get(claims.jti)||[],decision=grants.get(claims.jti)?.[frames.length+1];
   frames.push({binary,kind:binary?new Uint8Array(data)[0]:'custom',grantSeq:decision?.seq??null,revokedSeq:revokedAt.get(claims.instance)??null});wireFrames.set(claims.jti,frames);
  });
 }
}
const persist=fs.mkdtempSync(path.join(os.tmpdir(),'f123-ws-qa-'));
async function startRelay(extraBindings={}){const bindings={SALA_PILOTO:room,WS_AUTHORITY_QA:'1',WS_SERVICE_KEY:secret,...extraBindings};if(bindings.WS_AUTHORITY_QA===undefined)delete bindings.WS_AUTHORITY_QA;mf=new Miniflare({modules:true,script:bundle,compatibilityDate:'2026-06-01',compatibilityFlags:['nodejs_compat'],durableObjects:{Tienda:{className:'Tienda',useSQLite:true}},durableObjectsPersist:path.join(persist,'do'),kvNamespaces:['LICENCIAS'],bindings,serviceBindings:{WS_AUTHORITY:async request=>{if(!available)return new Response('unavailable',{status:503});const raw=await request.text();if(holdCheckToken&&!heldOnce&&new URL(request.url).pathname==='/ws/check'&&JSON.parse(raw).token===holdCheckToken){heldOnce=true;holdEntered?.();await new Promise(r=>releaseCheck=r);}return authorityTrace.run({path:new URL(request.url).pathname},()=>authorityWorker.fetch(new Request(request.url,{method:request.method,headers:request.headers,body:raw}),env));}}});await(await mf.getKVNamespace('LICENCIAS')).put('inst:'+instance,JSON.stringify({licenseCode:license,instanceId:instance}));url=await mf.ready;}
function storage(){let records=new Map(),tail=Promise.resolve();return{get:async k=>structuredClone(records.get(k)),transaction:async f=>{let release;const prev=tail;tail=new Promise(r=>release=r);await prev;const next=new Map([...records].map(([k,v])=>[k,structuredClone(v)]));try{const r=await f({get:async k=>structuredClone(next.get(k)),put:async(k,v)=>next.set(k,structuredClone(v)),delete:async k=>next.delete(k),list:async({prefix,limit})=>new Map([...next].filter(([k])=>k.startsWith(prefix)).slice(0,limit))});const previous=records;records=next;const seq=++traceSeq;for(const [k,v] of next)if(k.startsWith('inst:')&&v.estado==='bloqueada'&&previous.get(k)?.estado!=='bloqueada')revokedAt.set(v.instanceId,seq);if(authorityTrace.getStore()?.path==='/ws/check'&&r?.ok&&r.principal?.jti){const entries=grants.get(r.principal.jti)||[];entries.push({seq});grants.set(r.principal.jti,entries);}return r;}finally{release();}}};}
async function api(route,body){return authorityWorker.fetch(new Request('https://authority.invalid'+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env);}
async function issue(channel='priv',scopes=['priv:read','priv:write'],ttlMs=30000){const r=await api('/ws/ticket',{credentials:{kind:'owner',licenseCode:license,instanceId:instance,pin:'123'},room:room+'-'+channel,scopes,ttlMs});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data.token;}
async function raw(channel,token){return new Promise((resolve,reject)=>{let binary=0,done=false;const target=new URL('/parties/tienda/'+room+'-'+channel,url);target.protocol='ws:';target.search=new URLSearchParams({licencia:license,instancia:instance,...(token?{cap:token}:{})});const ws=new WebSocket(target);const finish=status=>{if(done)return;done=true;clearTimeout(timer);ws.terminate();resolve({status,binary});};const timer=setTimeout(()=>finish('open'),250);ws.on('message',(_,isBinary)=>{if(isBinary)binary++;});ws.on('close',code=>finish(code));ws.on('unexpected-response',(_req,res)=>finish(res.statusCode));ws.on('error',()=>{});});}
async function until(fn,label){const start=Date.now();while(!fn()){if(Date.now()-start>5000)throw Error('timeout '+label);await new Promise(r=>setTimeout(r,15));}}
async function durableBarrier(provider){
 let timer,handler;
 try{await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('durable protocol barrier missing')),5000);handler=message=>{if(message.startsWith('estado-durable:'))resolve();};provider.on('custom-message',handler);provider.sendMessage('estado-durable');});}
 finally{clearTimeout(timer);if(handler)provider.off('custom-message',handler);}
}
async function connect(token){const doc=new Y.Doc();const p=new YProvider(url.host,room+'-priv',doc,{party:'tienda',params:{licencia:license,instancia:instance,cap:token},WebSocketPolyfill:AuditedSocket,disableBc:true});try{await until(()=>p.synced,'sync');}catch(e){p.destroy();doc.destroy();throw e;}return{doc,p,close(){p.destroy();doc.destroy();}};}
before(async()=>{room=await salaDeLicencia(license);db=storage();await db.transaction(tx=>tx.put('inst:'+instance,{licenseCode:license,instanceId:instance}));env={PIN_PEPPER:'synthetic-owner-secret-more-than-32bytes',TEAM_PIN_PEPPER:'synthetic-team-secret-separate-32bytes',TEAM_AUTHORITY_QA:'1',TEAM_AUTHORITY_LICENSE:license,WS_AUTHORITY_QA:'1',WS_SIGNING_KEY:'synthetic-ws-signing-secret-more-than-32bytes',WS_SERVICE_KEY:secret};const owner=pinAuthority(db,env.PIN_PEPPER);await owner.masterSet(license,'123',0,[instance]);await owner.masterActivate(license,'123',0,[instance]);registry=new RegistroLicencias({storage:db},env);env.REGISTROS={idFromName:()=>({}),get:()=>({fetch:(u,o)=>registry.fetch(new Request(u,o))})};const result=await build({entryPoints:[path.join(import.meta.dirname,'../src/index.js')],bundle:true,format:'esm',platform:'neutral',mainFields:['module','main'],conditions:['workerd','worker','browser'],external:['cloudflare:*'],write:false});bundle=result.outputFiles[0].text;await startRelay();});
after(async()=>{await mf?.dispose();fs.rmSync(persist,{recursive:true,force:true});});
test('copied identifiers without a ticket receive zero Yjs frames',{timeout:15000},async()=>{const r=await raw('cat');assert.equal(r.binary,0);assert.notEqual(r.status,'open');});
test('real Owner ticket opens private YServer, persists facts, and cannot replay',{timeout:15000},async()=>{const token=await issue(),a=await connect(token);try{a.doc.getMap('private').set('synthetic-value',41);const second=await issue(),b=await connect(second);try{await until(()=>b.doc.getMap('private').get('synthetic-value')===41,'private readback');}finally{b.close();}const replay=await raw('priv',token);assert.equal(replay.binary,0);assert.notEqual(replay.status,'open');}finally{a.close();}});
test('missing authority fails closed before any Yjs state',{timeout:15000},async()=>{const token=await issue();available=false;try{const result=await raw('priv',token);assert.equal(result.binary,0);assert.notEqual(result.status,'open');}finally{available=true;}});
test('raw operations and broad shared rooms remain closed in secure QA until their boundary exists',{timeout:15000},async()=>{for(const channel of ['cat','ops','fotos']){const token=await issue(channel,[channel==='ops'?'ops:sale':channel+':read']);const result=await raw(channel,token);assert.equal(result.binary,0);assert.notEqual(result.status,'open');}});

test('a read-only Owner credential cannot persist or broadcast a raw private edit',{timeout:15000},async()=>{
 const observer=await connect(await issue()),reader=await connect(await issue('priv',['priv:read']));
 try{reader.doc.getMap('private').set('forbidden-readonly-edit',99);const fresh=await connect(await issue());try{assert.equal(fresh.doc.getMap('private').has('forbidden-readonly-edit'),false);assert.equal(observer.doc.getMap('private').has('forbidden-readonly-edit'),false);}finally{fresh.close();}}finally{reader.close();observer.close();}
});
test('expired idle recipient gets no binary update when a valid Owner publishes',{timeout:15000},async()=>{
 const writer=await connect(await issue()),token=await issue('priv',['priv:read'],650),expiry=JSON.parse(Buffer.from(token.split('.')[0],'base64url')).exp;
 const idle=await connect(token),socket=idle.p.ws;let frames=0,closed;
 try{await new Promise(r=>setTimeout(r,Math.max(0,expiry-Date.now()+30)));socket.on('message',(_,binary)=>{if(binary)frames++;});socket.on('close',code=>{closed=code;});writer.doc.getMap('private').set('post-expiry',77);await until(()=>closed!==undefined,'expiry close');assert.equal(closed,1008);assert.equal(frames,0);assert.equal(idle.doc.getMap('private').has('post-expiry'),false);}finally{idle.close();writer.close();}
});
test('revoked idle recipient gets no next update; valid instance still syncs',{timeout:15000},async()=>{
 const other='synthetic-second-instance';await db.transaction(tx=>tx.put('inst:'+other,{licenseCode:license,instanceId:other}));
 const writer=await connect(await issue()),response=await api('/ws/ticket',{credentials:{kind:'owner',licenseCode:license,instanceId:other,pin:'123'},room:room+'-priv',scopes:['priv:read']});const token=(await response.json()).token;
 const idleDoc=new Y.Doc(),provider=new YProvider(url.host,room+'-priv',idleDoc,{party:'tienda',params:{licencia:license,instancia:other,cap:token},WebSocketPolyfill:AuditedSocket,disableBc:true});
 try{await until(()=>provider.synced,'second instance');await durableBarrier(provider);const socket=provider.ws;let frames=0,closed;socket.on('message',(_,binary)=>{if(binary)frames++;});socket.on('close',code=>{closed=code;});await db.transaction(tx=>tx.put('inst:'+other,{licenseCode:license,instanceId:other,estado:'bloqueada'}));writer.doc.getMap('private').set('post-revocation',88);await until(()=>closed!==undefined,'revocation close');assert.equal(closed,1008);assert.equal(frames,0);assert.equal(idleDoc.getMap('private').has('post-revocation'),false);}finally{provider.destroy();idleDoc.destroy();writer.close();}
});
test('private facts survive full Workerd restart in SQL and require a fresh real ticket',{timeout:20000},async()=>{
 const a=await connect(await issue());a.doc.getMap('private').set('cold-recovery',12345);const witness=await connect(await issue());await until(()=>witness.doc.getMap('private').get('cold-recovery')===12345,'before restart');a.close();witness.close();await mf.dispose();await startRelay();const cold=await connect(await issue());try{assert.equal(cold.doc.getMap('private').get('cold-recovery'),12345);assert.equal(cold.doc.getMap('private').has('forbidden-readonly-edit'),false);}finally{cold.close();}
});
test('revoked recipient gets no awareness frame when another socket closes',{timeout:15000},async()=>{
 const sender=await connect(await issue()),receiver=await connect(await issue());let timer;
 try{
  sender.p.awareness.setLocalStateField('syntheticMarker','synthetic-presence');
  await until(()=>[...receiver.p.awareness.getStates().values()].some(s=>s.syntheticMarker==='synthetic-presence'),'presence setup');
  let binary=0,closed;
  const observed=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('no revocation outcome')),5000);receiver.p.ws.on('message',(_,isBinary)=>{if(isBinary){binary++;resolve();}});receiver.p.ws.once('close',code=>{closed=code;resolve();});});
  await db.transaction(tx=>tx.put('inst:'+instance,{licenseCode:license,instanceId:instance,estado:'bloqueada'}));
  sender.p.ws.terminate();await observed;
  if(binary)console.log('SYNTHETIC-FRAME-AUDIT',JSON.stringify([...wireFrames].map(([jti,frames])=>({jti,frames:frames.slice(-8)}))));assert.equal(binary,0,'revoked recipient must receive no lifecycle frame');assert.equal(closed,1008);
 }finally{clearTimeout(timer);sender.close();receiver.close();await db.transaction(tx=>tx.put('inst:'+instance,{licenseCode:license,instanceId:instance}));}
});

for(const flag of ['0',undefined])test('secure QA flag '+String(flag)+' never falls back to copied-identifier access',{timeout:20000},async()=>{
 await mf.dispose();await startRelay({WS_AUTHORITY_QA:flag});
 try{const result=await raw('cat');assert.equal(result.binary,0,'missing secure mode must not reopen the historical reader');assert.notEqual(result.status,'open');}finally{await mf.dispose();await startRelay();}
});

test('a valid admission waiting for authority is not revoked by another peer activity',{timeout:15000},async()=>{
 const writer=await connect(await issue()),token=await issue();holdCheckToken=token;heldOnce=false;
 const entered=new Promise(r=>holdEntered=r),doc=new Y.Doc();
 const joining=new YProvider(url.host,room+'-priv',doc,{party:'tienda',params:{licencia:license,instancia:instance,cap:token},WebSocketPolyfill:AuditedSocket,disableBc:true});
 try{await entered;const socket=joining.ws;writer.doc.getMap('private').set('during-admission',314);await durableBarrier(writer.p);assert.equal(joining.synced,false,'admission cannot expose state before authority returns');releaseCheck();await until(()=>joining.synced,'queued valid admission');assert.equal(doc.getMap('private').get('during-admission'),314);}
 finally{releaseCheck?.();holdCheckToken=null;holdEntered=null;releaseCheck=null;joining.destroy();doc.destroy();writer.close();}
});
