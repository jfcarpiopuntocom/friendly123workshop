// P0 RED→GREEN: actual Workerd SQLite transaction, not Map mocks.
// Every identity, product and amount is synthetic; no deployed Worker is called.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {build} from 'esbuild';import {Miniflare} from 'miniflare';

const LICENSE='F123-SYNTHETIC-BUSINESS';
const persist=fs.mkdtempSync(path.join(os.tmpdir(),'f123-atomic-business-'));
const sale=(opId='synthetic-op-001',amountCents=1999)=>({
  opId,license:LICENSE,kind:'sale.record',productId:'sku-1',quantity:1,amountCents
});
let mf,base,bundle;
async function start(){
  mf=new Miniflare({modules:true,script:bundle,compatibilityDate:'2026-06-01',
    compatibilityFlags:['nodejs_compat'],durableObjects:{BUSINESS:{className:'SyntheticBusiness',useSQLite:true}},
    durableObjectsPersist:path.join(persist,'sqlite')});
  base=await mf.ready;
}
async function submit(command,ticket='synthetic-signed-ticket'){
  const response=await fetch(new URL('/submit',base),{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({ticket,command})});
  return {status:response.status,body:await response.json()};
}
async function inspect(){
  const r=await fetch(new URL('/inspect',base));
  assert.equal(r.status,200);
  return r.json();
}
test('P0 Workerd real SQL: business-committed ACK iff money+stock+opId stored in ONE transaction, cold replay exactly-once',
  {timeout:45000},async()=>{
  const out=await build({entryPoints:[path.join(import.meta.dirname,'fixtures/typed-business-worker.mjs')],
    bundle:true,format:'esm',platform:'neutral',conditions:['workerd','worker','browser'],
    mainFields:['module','main'],external:['cloudflare:*'],write:false});
  bundle=out.outputFiles[0].text;
  try{
    await start();
    const original=await submit(sale());
    assert.equal(original.status,200);
    assert.equal(original.body.ok,true);
    assert.equal(original.body.receipt.stage,'business-committed',
      'stored-for-application is NOT a business ACK');
    assert.equal(original.body.duplicate,false);
    assert.deepEqual(await inspect(),{stock:9,cash:1999,ops:1,payloads:1});

    const duplicate=await submit(sale());
    assert.equal(duplicate.status,200);
    assert.equal(duplicate.body.duplicate,true);
    assert.deepEqual(duplicate.body.receipt,original.body.receipt);
    assert.deepEqual(await inspect(),{stock:9,cash:1999,ops:1,payloads:1},
      'retry MUST NOT reduce stock or add cash twice');
    const conflict=await submit(sale('synthetic-op-001',2999));
    assert.equal(conflict.status,409);
    assert.deepEqual(await inspect(),{stock:9,cash:1999,ops:1,payloads:1});
    assert.equal((await submit(sale('synthetic-op-002'),'revoked-invalid-ticket')).status,403);
    assert.deepEqual(await inspect(),{stock:9,cash:1999,ops:1,payloads:1});

    for(const [opId,label] of [
      ['synthetic-op-fail','SQL statement failure after stock decrement'],
      ['synthetic-op-async','async adapter may not escape transaction'],
      ['synthetic-op-refused','adapter explicit false is not a business commit']
    ]){
      const failed=await submit(sale(opId));
      assert.equal(failed.status,503,label);
      assert.equal(failed.body.ok,false,label);
      assert.deepEqual(await inspect(),{stock:9,cash:1999,ops:1,payloads:1},label);
    }

    await mf.dispose();mf=null;
    await start();
    const replay=await submit(sale());
    assert.equal(replay.status,200);
    assert.equal(replay.body.duplicate,true);
    assert.deepEqual(replay.body.receipt,original.body.receipt);
    assert.deepEqual(await inspect(),{stock:9,cash:1999,ops:1,payloads:1},
      'cold process restart cannot replay economic effects');
    const second=await submit(sale('synthetic-op-003',500));
    assert.equal(second.body.receipt.stage,'business-committed');
    assert.deepEqual(await inspect(),{stock:8,cash:2499,ops:2,payloads:2});
  } finally{
    await mf?.dispose();
    fs.rmSync(persist,{recursive:true,force:true});
  }
});
