// Gate A · real issuer/relay perimeter + Workerd SQLite cobro by Owner/Admin/Team.
// Synthetic identifiers and isolated local Miniflare; no customer data or network.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {askAuthority} from '../src/ws-authority-client.js';

const license='F123-SYNTHETIC-BUSINESS';
const instance='synthetic-instance';
const room='a'.repeat(32)+'-ops';
const access=scope=>({token:'synthetic-cap',licenseCode:license,instanceId:instance,room,requiredScope:scope});
function authority(role,scope,ok=true){
  const now=Date.now();
  const subject=role==='dueno'?'owner-account':role==='admin'?'admin_12345':'team_12345';
  const principal={license,instance,room,role,subject,scopes:[scope],iat:now-100,exp:now+25000};
  return {WS_AUTHORITY_QA:'1',WS_SERVICE_KEY:'synthetic-local-binding-key-more-than-32-characters',
    WS_AUTHORITY:{fetch:async()=>Response.json(ok?{ok:true,principal}:{ok:false})}};
}
test('P0 gate A: authenticated Admin/Team one-scope payment passes; raw Yjs and employee stock adjust remain blocked',async()=>{
  for(const role of ['admin','empleado']){
    assert.equal((await askAuthority(authority(role,'ops:payment'),'consume',access('ops:payment')))?.principal?.role,role);
    assert.equal(await askAuthority(authority(role,'ops:read'),'consume',access('ops:read')),null);
    assert.equal(await askAuthority(authority(role,'ops:payment',false),'consume',access('ops:payment')),null);
    assert.equal(await askAuthority(authority(role,'ops:payment'),'consume',{...access('ops:payment'),instanceId:'wrong-instance'}),null);
  }
  assert.equal(await askAuthority(authority('empleado','ops:adjust'),'consume',access('ops:adjust')),null);
  assert.equal((await askAuthority(authority('admin','ops:adjust'),'consume',access('ops:adjust')))?.principal?.role,'admin');
});
test('P0 gate A: real Workerd SQLite applies each authorized fiado payment once; no employee stock adjust', {timeout:60000},async()=>{
  const bundle=await build({entryPoints:[path.join(import.meta.dirname,'fixtures/authoritative-sql-worker.mjs')],
    bundle:true,format:'esm',platform:'neutral',conditions:['workerd','worker','browser'],
    mainFields:['module','main'],external:['cloudflare:*'],write:false});
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'f123-role-pay-'));
  const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,
    compatibilityDate:'2026-06-01',compatibilityFlags:['nodejs_compat'],
    durableObjects:{BUSINESS:{className:'CommercialFixture',useSQLite:true}},
    durableObjectsPersist:path.join(dir,'sqlite')});
  try{
    const base=await mf.ready;
    const post=async(route,payload)=>{
      const r=await fetch(new URL(route,base),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      return{status:r.status,data:await r.json()};
    };
    const seed={license,frozenHead:'firebase-head-roles-001',
      products:[{productId:'sku_1',quantity:10,unitPriceCents:1999}],
      openingCashCents:500,receivables:[{receivableId:'fiado_1',balanceCents:3000}]};
    const expectedSha256=createHash('sha256').update(JSON.stringify(seed)).digest('hex');
    assert.equal((await post('/seed',{...seed,sourceFrozenVerified:true,expectedSha256})).status,200);
    const pay=(opId,amountCents)=>({license,opId,kind:'credit.payment.record',receivableId:'fiado_1',amountCents});
    const cases=[['synthetic-owner-ticket','role-pay-owner-001',600],
      ['synthetic-admin-ticket','role-pay-admin-001',700],
      ['synthetic-team-ticket','role-pay-team-001',800]];
    for(const [ticket,opId,amountCents] of cases){
      const first=await post('/submit',{ticket,command:pay(opId,amountCents)});
      assert.equal(first.status,200,JSON.stringify(first));
      assert.equal(first.data.receipt.stage,'business-committed');
      assert.equal(first.data.duplicate,false);
      const replay=await post('/submit',{ticket,command:pay(opId,amountCents)});
      assert.equal(replay.status,200);
      assert.equal(replay.data.duplicate,true);
      assert.deepEqual(replay.data.receipt,first.data.receipt);
    }
    const denied=await post('/submit',{ticket:'synthetic-revoked-ticket',command:pay('role-pay-revoked-001',100)});
    assert.notEqual(denied.status,200);
    const overpay=await post('/submit',{ticket:'synthetic-team-ticket',command:pay('role-pay-excess-001',901)});
    assert.notEqual(overpay.status,200);
    const adjust=await post('/submit',{ticket:'synthetic-team-ticket',
      command:{license,opId:'role-stock-team-001',kind:'stock.adjust',productId:'sku_1',quantity:1,amountCents:0}});
    assert.notEqual(adjust.status,200);
    const s=await (await fetch(new URL('/stats',base))).json();
    assert.deepEqual(s.receivables.map(r=>Number(r.balance_cents)),[900]);
    assert.equal(Number(s.baseline[0].cash_cents),2600);
    assert.equal(Number(s.stock[0].quantity),10);
    assert.equal(s.effects.length,3);
    assert.equal(s.receipts.length,3);
  }finally{await mf.dispose();fs.rmSync(dir,{recursive:true,force:true});}
});
