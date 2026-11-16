// Workerd/SQLite (not a Map mock): prove actual durable-object persistence.
// Fixture creates synthetic authority ONLY inside this isolated QA worker.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
const persist=fs.mkdtempSync(path.join(os.tmpdir(),'f123-typed-inbox-'));
let mf,base,bundle;
const sale=(opId='synthetic-op-001',amountCents=1999)=>({opId,kind:'sale.record',license:'F123-SYNTHETIC-LEDGER',productId:'sku-1',quantity:1,amountCents});
const send=async(command,ticket='synthetic-signed-ticket')=>{
 const response=await fetch(new URL('/submit',base),{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({ticket,command})
 });
 const raw=await response.text();let body;try{body=JSON.parse(raw);}catch(_){throw Error('nonJSON Workerd reply HTTP '+response.status+': '+raw.slice(0,1200));}return{status:response.status,body};
};
const count=async()=>{const r=await fetch(new URL('/test-count',base));assert.equal(r.status,200);return (await r.json()).count};
async function start(){
 mf=new Miniflare({modules:true,script:bundle,compatibilityDate:'2026-06-01',
  compatibilityFlags:['nodejs_compat'],durableObjects:{COMMANDS:{className:'SyntheticCommands',useSQLite:true}},
  durableObjectsPersist:path.join(persist,'storage')});
 base=await mf.ready;
}
test('real Workerd SQLite: one durable inbox row survives reopen and conflicting retries fail closed',{timeout:45000},async()=>{
 const bundleResult=await build({
  entryPoints:[path.join(ROOT,'fixtures/typed-ledger-worker.mjs')],
  bundle:true,format:'esm',platform:'neutral',conditions:['workerd','worker','browser'],
  mainFields:['module','main'],write:false,external:['cloudflare:*']
 });
 bundle=bundleResult.outputFiles[0].text;
 try{
  await start();
  const a=await send(sale());
  assert.equal(a.status,200);assert.equal(a.body.ok,true);assert.equal(a.body.receipt.stage,'stored-for-application');
  assert.equal(a.body.duplicate,false);
  const b=await send(sale());
  assert.equal(b.status,200);assert.equal(b.body.duplicate,true);assert.deepEqual(b.body.receipt,a.body.receipt);
  assert.equal(await count(),1);
  const conflict=await send(sale('synthetic-op-001',2000));
  assert.equal(conflict.status,409);assert.equal(await count(),1);
  const denied=await send(sale('synthetic-op-002'),'synthetic-expired');
  assert.equal(denied.status,403);assert.equal(await count(),1);
  await mf.dispose();mf=null;
  await start();
  const c=await send(sale());
  assert.equal(c.status,200);assert.equal(c.body.duplicate,true);assert.deepEqual(c.body.receipt,a.body.receipt);
  assert.equal(await count(),1);
 }finally{
   await mf?.dispose();
   fs.rmSync(persist,{recursive:true,force:true});
 }
});
