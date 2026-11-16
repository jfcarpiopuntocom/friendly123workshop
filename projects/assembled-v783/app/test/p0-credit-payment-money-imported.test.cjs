'use strict';
// v783: RED-first migration of NEW customer payments to already-imported Dinero.
// Synthetic VM and facts only; no production network, license, PIN or client data.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {browser}=require('./helpers/browser.cjs');
const imported=fs.readFileSync(require.resolve('../docs/vendor/money-imported.min.js'),'utf8');
const cartera=fs.readFileSync(require.resolve('../docs/cartera.js'),'utf8');

async function fixture({money=true,rollback=false}={}){
  const w=browser(),facts=[];let writes=0,fail=false;
  w.OCAuth={rolActual:()=> 'dueno',usuarioActual:()=>({nombre:'Synthetic owner'})};
  w.AMG={Hechos:{
    todos:async()=>facts.slice(),
    registrar:async(tipo,datos,opciones)=>{
      writes++;
      if(fail)throw Error('Synthetic durable store unavailable');
      const duplicate=opciones?.repetido?.(facts.slice());
      if(duplicate)return duplicate;
      const h={id:'fact-'+(facts.length+1),tipo,datos:JSON.parse(JSON.stringify(datos)),ts:1000+facts.length};
      facts.push(h);return h;
    },
    verificarCadenas:async()=>({ok:true})
  }};
  vm.runInContext(cartera,w);
  if(money)vm.runInContext(imported,w);
  else vm.runInContext('window.F123MoneyImported=undefined',w);
  if(rollback)w.localStorage.setItem('f123_dinero_qa','0');
  const client=await w.request('/api/clientes','POST',{nombre:'Synthetic credit customer'});
  const pay=(amount,opId,extra={})=>w.request('/api/clientes/'+client.id+'/abonar','POST',
    {monto:amount,opId,motivo:'Synthetic cash payment',...extra});
  const charge=(amount,opId)=>w.request('/api/clientes/'+client.id+'/fiar','POST',
    {monto:amount,opId,motivo:'Synthetic manual debt'});
  const balance=()=>w.request('/api/clientes/'+client.id+'/cartera');
  return {w,facts,client,pay,charge,balance,writes:()=>writes,fail:(value=true)=>{fail=value;}};
}

test('new abonos use imported Dinero half-up for both half-cent decimal cases',async()=>{
  const s=await fixture();
  const a=await s.pay(1.005,'synthetic-payment-001'),b=await s.pay(2.675,'synthetic-payment-002');
  assert.ok(a.movimientoId);assert.ok(b.movimientoId);
  assert.equal(s.facts.length,2);
  assert.equal(s.facts[0].datos.monto,1.01,'1.005 USD must store 101 cents');
  assert.equal(s.facts[1].datos.monto,2.68,'2.675 USD must store 268 cents');
  assert.equal(s.facts[0].datos.moneyEngine,'dinero-2.0.2-half-up');
  assert.equal(s.facts[0].datos.montoSolicitado,1.005);
  assert.equal(s.facts[1].datos.montoSolicitado,2.675);
  assert.equal((await s.balance()).saldo,3.69);
});
test('same payment opId replays after rollback and missing adapter without a second fact',async()=>{
  const s=await fixture();
  const first=await s.pay(1.005,'synthetic-payment-retry');
  s.w.localStorage.setItem('f123_dinero_qa','0');
  vm.runInContext('window.F123MoneyImported=undefined',s.w);
  const twice=await s.pay(1.005,'synthetic-payment-retry');
  assert.equal(twice.movimientoId,first.movimientoId);
  assert.equal(s.facts.length,1);assert.equal(s.facts[0].datos.monto,1.01);
  await assert.rejects(s.pay(1.01,'synthetic-payment-retry'),/409/,
    'same rounded cents but changed raw amount must not silently replace the intention');
  assert.equal(s.facts.length,1);
});
test('a historical legacy payment retains old cents and remains idempotent after new import',async()=>{
  const s=await fixture({money:false});
  const old=await s.pay(1.005,'synthetic-legacy-payment');
  assert.equal(s.facts[0].datos.monto,1);
  assert.equal(s.facts[0].datos.moneyEngine,undefined);
  vm.runInContext(imported,s.w);
  const repeated=await s.pay(1.005,'synthetic-legacy-payment');
  assert.equal(repeated.movimientoId,old.movimientoId);
  assert.equal(s.facts.length,1);
  await s.pay(1.005,'synthetic-new-payment');
  assert.equal(s.facts.length,2);
  assert.equal(s.facts[1].datos.monto,1.01);
  assert.equal((await s.balance()).saldo,2.01);
});
test('explicit rollback flag preserves existing legacy behavior for new abonos',async()=>{
  const s=await fixture({money:true,rollback:true});
  await s.pay(1.005,'synthetic-rollback-payment');
  assert.equal(s.facts[0].datos.monto,1);
  assert.equal(s.facts[0].datos.moneyEngine,undefined);
});
test('missing or throwing imported component falls back fully to legacy for a NEW payment',async()=>{
  for(const mode of ['missing','throwing']){
    const s=await fixture({money:false});
    if(mode==='throwing')s.w.F123MoneyImported={percentage(){throw Error('Synthetic module unavailable');}};
    await s.pay(1.005,'synthetic-fallback-'+mode);
    assert.equal(s.facts.length,1);
    assert.equal(s.facts[0].datos.monto,1);
    assert.equal(s.facts[0].datos.moneyEngine,undefined);
  }
});
test('manual debt cargo stays on the original ledger rounding; only abonos migrate',async()=>{
  const s=await fixture();
  await s.charge(1.005,'synthetic-manual-debt');
  assert.equal(s.facts.length,1);
  assert.equal(s.facts[0].tipo,'cartera_cargo');
  assert.equal(s.facts[0].datos.monto,1);
  assert.equal(s.facts[0].datos.moneyEngine,undefined);
});
test('changed customer, motive, or amount with an existing payment opId is 409',async()=>{
  const s=await fixture();
  await s.pay(1.005,'synthetic-strict-op');
  await assert.rejects(s.pay(2.675,'synthetic-strict-op'),/409/);
  await assert.rejects(s.pay(1.005,'synthetic-strict-op',{motivo:'Another intent'}),/409/);
  const other=await s.w.request('/api/clientes','POST',{nombre:'Synthetic other customer'});
  await assert.rejects(s.w.request('/api/clientes/'+other.id+'/abonar','POST',
    {monto:1.005,opId:'synthetic-strict-op',motivo:'Synthetic cash payment'}),/409/);
  assert.equal(s.facts.length,1);
});
test('durable Hechos failure returns no confirmed payment; retry writes once',async()=>{
  const s=await fixture();
  s.fail(true);
  await assert.rejects(s.pay(1.005,'synthetic-disk-retry'),/400|503/);
  assert.equal(s.facts.length,0);
  s.fail(false);
  const result=await s.pay(1.005,'synthetic-disk-retry');
  assert.ok(result.movimientoId);assert.equal(s.facts.length,1);
});
test('invalid or negative payment never persists a monetary fact',async()=>{
  const s=await fixture();
  for(const amount of [-1,0,Infinity,NaN]){
    await assert.rejects(s.pay(amount,'synthetic-invalid-'+String(amount)),/400/);
  }
  assert.equal(s.facts.length,0);
});
