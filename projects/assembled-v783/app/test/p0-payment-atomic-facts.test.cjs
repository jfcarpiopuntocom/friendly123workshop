'use strict';
// Force both writers to read before hashing finishes: only the IDB transaction can dedup.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const {IDBFactory,IDBObjectStore}=require('fake-indexeddb');
const hechos=fs.readFileSync(require.resolve('../docs/hechos.js'),'utf8');
const cartera=fs.readFileSync(require.resolve('../docs/cartera.js'),'utf8');
const money=fs.readFileSync(require.resolve('../docs/vendor/money-imported.min.js'),'utf8');
const OP='customer-payment:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function pair({gate=true}={}){
 const indexedDB=new IDBFactory();let pending=[],gated=gate;
 const digest=async(...args)=>{
  if(gated)await new Promise(resolve=>{pending.push(resolve);if(pending.length===2){gated=false;pending.splice(0).forEach(r=>r());}});
  return webcrypto.subtle.digest(...args);
 };
 function writer(id){
  const map=new Map([['f123_owned',JSON.stringify({instanceId:id})],['f123_hechos_migrado_v1','1']]);
  const events=[],w={indexedDB,crypto:{subtle:{digest}},TextEncoder,Uint8Array,DOMException,console:{warn(){}},Date,Number,Promise,
   localStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v))},
   dispatchEvent:e=>events.push(e),CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts?.detail}},
   OCAuth:{rolActual:()=> 'dueno'},document:{readyState:'loading',addEventListener(){}},AMG:{}};
  w.window=w;vm.createContext(w);vm.runInContext(hechos,w);vm.runInContext(cartera,w);vm.runInContext(money,w);
  return {w,events,map,pay:(amount=1.005,opId=OP)=>w.AMG.Cartera.registrarMovimiento('client_1','abono',amount,'Cash',{opId})};
 }
 return {a:writer('synthetic-author-a'),b:writer('synthetic-author-b'),writer};
}
test('one payment opId commits once across concurrent ledger writers and survives fresh readback',async()=>{
 const {a,b,writer}=pair();
 const [first,second]=await Promise.all([a.pay(),b.pay()]);
 assert.equal(first.id,second.id,'both confirmations must identify the same durable payment');
 const facts=await a.w.AMG.Hechos.todos();assert.equal(facts.length,1);
 assert.equal(facts[0].datos.monto,1.01);
 assert.equal((await b.w.AMG.Cartera.saldoDeCliente('client_1')).saldo,1.01);
 const fresh=writer('synthetic-author-c');
 assert.equal((await fresh.pay()).id,first.id);assert.equal((await fresh.w.AMG.Hechos.todos()).length,1);
 const next=await b.pay(2.675,'customer-payment:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
 assert.ok(next);assert.equal((await b.w.AMG.Hechos.todos()).length,2);
 assert.equal((await b.w.AMG.Hechos.verificarCadenas(await b.w.AMG.Hechos.todos())).ok,true);
});
test('concurrent conflicting payment intentions cannot both change the customer balance',async()=>{
 const {a,b}=pair();
 const results=await Promise.allSettled([a.pay(1.005),b.pay(2.675)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const facts=await a.w.AMG.Hechos.todos();assert.equal(facts.length,1);
 assert.ok([1.01,2.68].includes(facts[0].datos.monto));
 assert.equal((await a.w.AMG.Cartera.saldoDeCliente('client_1')).saldo,facts[0].datos.monto);
});
test('payment intent keeps its original opId when the caller mutates its object during hashing',async()=>{
 const {a,b}=pair();
 const [old]=await Promise.all([a.pay(),b.pay()]);
 let entered,release;
 const ready=new Promise(r=>{entered=r}),held=new Promise(r=>{release=r});
 b.w.crypto.subtle.digest=async(...args)=>{entered();await held;return webcrypto.subtle.digest(...args)};
 const original='customer-payment:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const relation={opId:original};
 const pending=b.w.AMG.Cartera.registrarMovimiento('client_1','abono',2.675,'Cash',relation);
 await ready;relation.opId=OP;release();
 const receipt=await pending;
 assert.notEqual(receipt.id,old.id,'another intention must not masquerade as this payment');
 assert.equal(receipt.datos.opId,original);
 const facts=await a.w.AMG.Hechos.todos();
 assert.equal(facts.length,2);assert.equal((await a.w.AMG.Cartera.saldoDeCliente('client_1')).saldo,3.69);
});
test('aborted payment transaction gives no receipt, hash metadata or event; retry commits once',async()=>{
 const {a}=pair({gate:false}),add=IDBObjectStore.prototype.add;
 try{
  IDBObjectStore.prototype.add=function(...args){
   const request=add.apply(this,args);if(this.name==='hechos')this.transaction.abort();return request;
  };
  await assert.rejects(a.pay(),/no se pudo guardar/);
  assert.equal((await a.w.AMG.Hechos.todos()).length,0);
  assert.equal(a.map.has('f123_hechos_meta_v1'),false);
  assert.equal(a.events.filter(e=>e.type==='oc-hecho-local').length,0);
 }finally{IDBObjectStore.prototype.add=add;}
 const receipt=await a.pay();assert.ok(receipt);
 assert.equal((await a.pay()).id,receipt.id);
 assert.equal((await a.w.AMG.Hechos.todos()).length,1);
 assert.equal(a.events.filter(e=>e.type==='oc-hecho-local').length,1);
});
