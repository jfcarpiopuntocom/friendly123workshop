'use strict';
// JFC P0: every actual sale entry point must reuse a durable opId after a
// lost HTTP acknowledgement, rather than creating two economic events.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const app=fs.readFileSync(path.join(__dirname,'../src/app/app-inline-01.js'),'utf8');
const min=fs.readFileSync(path.join(__dirname,'../docs/app-inline-01.min.js'),'utf8');
const start=app.indexOf('const _ocVentaIntentosRAM = new Map();');
const end=app.indexOf('let _sellando = false;',start);
assert.ok(start>=0&&end>start,'sale intent helper must exist in production source');
const helper=app.slice(start,end);
test('P0: pending sale opId stays entirely on-device, never sent to JFC health panel',()=>{
 assert.doesNotMatch(helper,/sendBeacon|fetch\s*\(|WebSocket|\/checkin|payload\.salud/,
   'the crash-safe sale intent helper must not export its commercial fingerprint');
});
test('P0: quick, modal CONFIRM, basket and day close send matching crash-safe opId, not just backend-generated IDs',()=>{
 assert.equal((app.match(/_ocVentaOpPendiente\(/g)||[]).length,5,
   'helper plus four distinct user sale entry points');
 assert.equal((app.match(/opId:\s*intento\.opId/g)||[]).length,4,
   'all four sale POST bodies carry the same opId');
 assert.equal((app.match(/_ocVentaIntentoConfirmado\(intento\)/g)||[]).length,4,
   'four sale entry points and helper definition clear only after receipt');
 assert.match(min,/f123_sale_intent_v1/,
   'generated minified production JS must include this code, not only src/app');
});
test('P0: pending opId survives fresh JS context, then matching receipt retires it',()=>{
 const saved=new Map(),store={
   getItem:k=>saved.has(k)?saved.get(k):null,
   setItem:(k,v)=>{saved.set(k,String(v));},
   removeItem:k=>saved.delete(k)
 };
 let counter=0;
 const script=helper+'\n({make:_ocVentaOpPendiente,ack:_ocVentaIntentoConfirmado})';
 function fresh(){
   const cryptoApi={randomUUID:()=>('00000000-0000-4000-8000-'+String(++counter).padStart(12,'0'))};
   return vm.runInNewContext(script,{
     localStorage:store,
     crypto:cryptoApi,globalThis:{crypto:cryptoApi},
     Date,JSON,Map,Math,String,Number
   });
 }
 const first=fresh(),input={cantidad:1,info:{formaPago:'cash'}};
 const a=first.make('confirm','synthetic-product',input);
 const b=fresh().make('confirm','synthetic-product',input);
 assert.equal(b.opId,a.opId,'reopened UI must retry the exact opId');
 first.ack(a);
 const c=fresh().make('confirm','synthetic-product',input);
 assert.notEqual(c.opId,a.opId,'later genuine sale gets a new opId after ACK');
 const d=fresh().make('confirm','synthetic-product',{cantidad:2,info:{formaPago:'cash'}});
 assert.notEqual(d.opId,c.opId,'changed intent cannot replay another sale');
});

test('day close blocks a second click and resumes the original quantities after losing the reply',async()=>{
 const begin=app.indexOf('const elBtnCierre = document.getElementById("btnAplicarCierre");');
 const finish=app.indexOf('// ===',begin);
 assert.ok(begin>=0&&finish>begin);
 const store=new Map(), calls=[], confirmations=[];
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 let listener, send, submits=0;
 const fieldA={value:'2',dataset:{cierreProd:'sku-a'}},fieldB={value:'1',dataset:{cierreProd:'sku-b'}};
 const msg={style:{}};
 function abrir(fields){
  const button={disabled:false,addEventListener:(_type,fn)=>{listener=fn;}};
  const document={
   getElementById:id=>id==='btnAplicarCierre'?button:msg,
   querySelectorAll:()=>fields
  };
  const scope={document,localStorage,crypto:require('node:crypto').webcrypto,API:'/api',
   t:k=>k,tf:k=>k,ocConfirm:async label=>{confirmations.push(label);return true;},
   fetch:async (_url,opts)=>{calls.push(JSON.parse(opts.body));return send(calls.at(-1));},
   cargarCierreLista:()=>{submits++;},cargarGridVender:()=>{}};
  vm.runInNewContext(helper+'\n'+app.slice(begin,finish),scope);
  return button;
 }
 abrir([fieldA,fieldB]);
 let cortar;
 send=()=>new Promise((_,reject)=>{cortar=reject;});
 const primero=listener();
 await listener();
 assert.equal(calls.length,1);
 cortar(Error('reply lost'));
 await primero;
 assert.equal(msg.textContent,'sold.closeUnconfirmed');
 assert.equal(fieldA.value,'2');
 const nuevos=[{value:'0',dataset:{cierreProd:'sku-a'}},{value:'4',dataset:{cierreProd:'sku-b'}}];
 abrir(nuevos); // the first product can disappear from this screen after the saved close
 send=async request=>({ok:true,json:async()=>({opId:request.opId,aplicadas:2,errores:['invalid'],productosAplicados:['sku-a']})});
 await listener();
 assert.deepEqual(calls[1],calls[0]);
 assert.equal(confirmations.at(-1),'sold.closeResumeConfirm');
 assert.equal(nuevos[1].value,'4');
 assert.equal(submits,1);
 assert.equal(store.size,0);
});
