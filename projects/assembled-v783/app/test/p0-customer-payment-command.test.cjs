'use strict';
// A browser fact is an input, NEVER remote authority. No networking or customer data.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {browser}=require('./helpers/browser.cjs');
const modulePath=path.resolve(__dirname,'../src/credit-payment-command.mjs');
const moduleApi=async()=>{
 assert.ok(fs.existsSync(modulePath),'RED: persisted-fact projection module must exist');
 return import('file://'+modulePath);
};
const LICENSE='F123-ABCDEF1234';
const OP='customer-payment:8f79b07c-3db5-478f-ab69-59b0e483912b';
const fact=(over={},datum={})=>({
 id:'local-fact-001',tipo:'cartera_abono',datos:{
  opId:OP,clienteId:'client_1',monto:1.01,motivo:'Cash',moneyEngine:'dinero-2.0.2-half-up',
  montoSolicitado:1.005,...datum
 },...over
});
const project=async(facts,[over={}][0]=[{ }])=>{
 const {creditPaymentCommandFromDurableFact}=await moduleApi();
 return creditPaymentCommandFromDurableFact({
  license:LICENSE,opId:OP,readPersistedFacts:async()=>facts,...over
 });
};

test('RED: converts actual committed cartera_abono to the exact customer-payment inbox kind',async()=>{
 const before=fact();
 const original=JSON.stringify(before);
 const result=await project([before]);
 assert.deepEqual(result,{
  license:LICENSE,opId:OP,kind:'credit.customer.payment.record',
  clienteId:'client_1',amountCents:101
 });
 assert.equal(JSON.stringify(before),original,'pure projection must not mutate facts');
 for(const forbidden of ['pin','role','motivo','montoSolicitado','moneyEngine','hash'])assert.equal(forbidden in result,false);
});
test('RED: readback is required; missing, duplicate or colliding opId must fail closed',async()=>{
 const {creditPaymentCommandFromDurableFact}=await moduleApi();
 const call=readPersistedFacts=>creditPaymentCommandFromDurableFact({license:LICENSE,opId:OP,readPersistedFacts});
 for(const facts of [[],[fact(),fact({id:'another'})],[fact({tipo:'cartera_cargo'})],[fact({datos:{opId:OP}})]])
  await assert.rejects(call(async()=>facts));
 await assert.rejects(call(async()=>{throw Error('Synthetic IndexedDB failure')}),/Synthetic IndexedDB failure/);
 await assert.rejects(call(async()=>null));
});
test('RED: exact saved cents win over any future Dinero flag or original request rounding',async()=>{
 const old=await project([fact({},{
  monto:1,moneyEngine:undefined,montoSolicitado:undefined
 })]);
 const modern=await project([fact()]);
 assert.equal(old.amountCents,100);
 assert.equal(modern.amountCents,101);
 assert.equal(old.opId,modern.opId);
});
test('RED: unsafe amounts and forged ids never produce a payment command',async()=>{
 const corrupt=[
  fact({},{monto:1.005}),fact({},{monto:0}),fact({},{monto:-1}),
  fact({},{monto:'1.01'}),fact({},{monto:1e15}),
  fact({},{clienteId:'../../other'}),fact({},{clienteId:''}),
  fact({},{moneyEngine:'unknown-rounding-engine'}),
 ];
 for(const bad of corrupt)await assert.rejects(project([bad]));
 await assert.rejects(project([fact()],[{license:'wrong-license'}]));
 await assert.rejects(project([fact()],[{opId:'customer-payment:../escape'}]));
});
test('RED: real browser /abonar records a fact that projects with its original opId',async()=>{
 const {creditPaymentCommandFromDurableFact}=await moduleApi();
 const w=browser(),facts=[];
 w.OCAuth={rolActual:()=> 'dueno',usuarioActual:()=>({nombre:'Synthetic owner'})};
 w.AMG={Hechos:{
  todos:async()=>facts.slice(),
  registrar:async(tipo,datos,options)=>{
   let duplicate=options?.repetido?.(facts.slice());if(duplicate)return duplicate;
   let h={id:'synthetic-'+(facts.length+1),tipo,datos:JSON.parse(JSON.stringify(datos)),ts:1000+facts.length};
   facts.push(h);return h;
  },
  verificarCadenas:async()=>({ok:true})
 }};
 vm.runInContext(fs.readFileSync(require.resolve('../docs/cartera.js'),'utf8'),w);
 vm.runInContext(fs.readFileSync(require.resolve('../docs/vendor/money-imported.min.js'),'utf8'),w);
 const customer=await w.request('/api/clientes','POST',{nombre:'Synthetic payment customer'});
 const r=await w.request('/api/clientes/'+customer.id+'/abonar','POST',{
  monto:1.005,opId:OP,motivo:'Synthetic payment'
 });
 assert.ok(r.movimientoId);
 assert.equal(facts.length,1);
 const command=await creditPaymentCommandFromDurableFact({
  license:LICENSE,opId:OP,readPersistedFacts:()=>w.AMG.Hechos.todos()
 });
 assert.equal(command.clienteId,customer.id);
 assert.equal(command.amountCents,101);
 assert.equal(command.opId,OP);
 assert.equal(facts.length,1,'projection cannot create another payment');
});
