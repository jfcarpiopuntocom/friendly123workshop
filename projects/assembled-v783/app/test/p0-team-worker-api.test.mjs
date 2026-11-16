import {test} from 'node:test';import assert from 'node:assert/strict';
import {pinAuthority} from '../cloudflare-worker/pin-authority.mjs';
import {teamDoRoute,teamPublicRoute} from '../cloudflare-worker/team-worker-api.mjs';
const license='F123-SYNTHETIC-TEAM',instance='synthetic-instance';
async function setup(){let data=new Map(),tail=Promise.resolve();const storage={get:async k=>structuredClone(data.get(k)),transaction:async f=>{let release;const prior=tail;tail=new Promise(r=>release=r);await prior;const next=new Map([...data].map(([k,v])=>[k,structuredClone(v)]));try{const r=await f({get:async k=>structuredClone(next.get(k)),put:async(k,v)=>next.set(k,structuredClone(v)),delete:async k=>next.delete(k)});data=next;return r;}finally{release();}}};await storage.transaction(tx=>tx.put('inst:'+instance,{licenseCode:license,instanceId:instance}));const env={PIN_PEPPER:'synthetic-owner-secret-more-than-32-bytes',TEAM_PIN_PEPPER:'synthetic-team-secret-separate-32-bytes',TEAM_AUTHORITY_QA:'1',TEAM_AUTHORITY_LICENSE:license};const owner=pinAuthority(storage,env.PIN_PEPPER);await owner.masterSet(license,'123',0,[instance]);await owner.masterActivate(license,'123',0,[instance]);const stub={fetch:(url,opts)=>teamDoRoute(new Request(url,opts),storage,env)};const call=async(path,body)=>{const response=await teamPublicRoute(new Request('https://worker.invalid'+path,{method:'POST',body:JSON.stringify({licenseCode:license,instanceId:instance,...body})}),env,{getDo:()=>stub});return{status:response.status,body:await response.json()};};return{call,env,storage};}
test('HTTP API checks real Owner authority and preserves roles without returning PIN digests',async()=>{const {call}=await setup();const r=await call('/team/update',{ownerPin:'123',expectedRevision:0,opId:'synthetic-team-operation',subject:'member-one',role:'admin',pin:'234',active:true});assert.equal(r.status,200);const status=await call('/team/status',{ownerPin:'123'});assert.equal(status.body.members[0].role,'admin');assert.equal(JSON.stringify(status.body).includes('fingerprint'),false);assert.equal((await call('/team/verify',{subject:'member-one',pin:'234'})).body.principal.role,'admin');});
test('disabled or non-pilot authority cannot mutate a customer record',async()=>{const {call,env}=await setup();env.TEAM_AUTHORITY_QA='0';assert.equal((await call('/team/update',{})).status,503);env.TEAM_AUTHORITY_QA='1';assert.equal((await call('/team/status',{licenseCode:'F123-OTHER-FAKE',ownerPin:'123'})).status,404);});
test('missing or reused secret fails closed and stale revision is HTTP conflict',async()=>{const {call,env}=await setup();assert.equal((await call('/team/update',{ownerPin:'123',expectedRevision:1,opId:'synthetic-stale-op',subject:'member-one',role:'admin',pin:'234',active:true})).status,409);env.TEAM_PIN_PEPPER=env.PIN_PEPPER;assert.equal((await call('/team/status',{ownerPin:'123'})).status,503);});

test('oversized streaming request is cancelled before consuming the full body',async()=>{
 const {env}=await setup();let pulled=0,cancelled=false;
 const stream=new ReadableStream({pull(c){pulled++;if(pulled<20)c.enqueue(new Uint8Array(1024).fill(32));else c.close();},cancel(){cancelled=true;}});
 const response=await teamPublicRoute(new Request('https://worker.invalid/team/update',{method:'POST',body:stream,duplex:'half'}),env,{getDo:()=>{throw Error('must not forward');}});
 assert.equal(response.status,400);assert.equal(cancelled,true);assert.ok(pulled<20);
});
test('failed request body produces a closed rejection rather than an unhandled exception',async()=>{
 const {env}=await setup();const stream=new ReadableStream({start(c){c.error(Error('synthetic body failure'));}});
 const response=await teamPublicRoute(new Request('https://worker.invalid/team/update',{method:'POST',body:stream,duplex:'half'}),env,{getDo:()=>null});
 assert.equal(response.status,400);
});
