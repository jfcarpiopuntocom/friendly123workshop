import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTypedCommercialLedger} from '../src/typed-commercial-ledger.mjs';

const LICENSE='F123-SYNTHETIC-LEDGER';
const sale=(over={})=>({opId:'synthetic-op-001',license:LICENSE,kind:'sale.record',productId:'sku-1',quantity:1,amountCents:1999,...over});
const expense=(over={})=>({opId:'synthetic-expense-002',license:LICENSE,kind:'expense.record',categoryId:'rent',amountCents:235,...over});
const payment=(over={})=>({opId:'synthetic-payment-003',license:LICENSE,kind:'credit.payment.record',receivableId:'synthetic-debt-1',amountCents:505,...over});
function fixture({authorize,insertFails=false,clock=()=>1730000000000}={}) {
 const rows=new Map(),payloads=new Map(),invocations={auth:[],writes:0,reads:0};
 const sql={exec(query,...params){
  if(/^\s*CREATE TABLE/i.test(query))return [];
  if(/^\s*SELECT payload_json FROM typed_commercial_payloads/i.test(query)){
   invocations.reads++;
   const payload=payloads.get(params[0]+'::'+params[1]);
   return payload===undefined?[]:[{payload_json:payload}];
  }
  if(/^\s*SELECT /i.test(query)){
   invocations.reads++;
   const row=rows.get(params[0]+'::'+params[1]);
   return row?[{payload_hash:row.payload_hash,receipt_json:row.receipt_json}]:[];
  }
  if(/^\s*INSERT INTO typed_commercial_payloads/i.test(query)){
   if(insertFails)throw Error('synthetic payload storage denied');
   const [license,opId,payload]=params,key=license+'::'+opId;
   if(payloads.has(key))throw Error('duplicate payload');
   payloads.set(key,payload);return [];
  }
  if(/^\s*INSERT /i.test(query)){
   if(insertFails)throw Error('synthetic storage denied');
   const [license,opId,hash,receipt]=params,key=license+'::'+opId;
   if(rows.has(key))throw Error('duplicate primary key');
   rows.set(key,{payload_hash:hash,receipt_json:receipt});
   invocations.writes++;return [];
  }
  throw Error('unexpected SQL '+query);
 }};
 const transactionSync=(cb)=>{
  const previous=new Map(rows),previousPayloads=new Map(payloads),writes=invocations.writes;
  try{return cb()}catch(e){rows.clear();for(const [key,val] of previous)rows.set(key,val);payloads.clear();for(const [key,val] of previousPayloads)payloads.set(key,val);invocations.writes=writes;throw e}
 };
 const verify=authorize|| (async ({ticket,license,scope})=>{
  invocations.auth.push({ticket,license,scope});
  return ticket==='synthetic-signed-ticket' ? {ok:true,principal:{license,subject:'owner-account',scopes:[scope]}}:{ok:false};
 });
 return {api:createTypedCommercialLedger({sql,transactionSync,authorize:verify,clock}),rows,payloads,invocations};
}
const send=(f,command,ticket='synthetic-signed-ticket')=>f.api.submit({ticket,command});
test('reject unknown operation before reading or writing storage',async()=>{
 const f=fixture(),r=await send(f,sale({kind:'stock.set'}));
 assert.equal(r.ok,false);assert.equal(r.status,400);assert.equal(f.invocations.writes,0);assert.equal(f.invocations.auth.length,0);
});
test('reject raw extra fields including client role, PIN or private contact',async()=>{
 for(const extra of [{role:'dueno'},{pin:'123'},{customerPhone:'0991112222'},{authorized:true}]){
  const f=fixture(),r=await send(f,sale(extra));
  assert.equal(r.ok,false);assert.equal(r.status,400);assert.equal(f.rows.size,0);
 }
});
test('fail closed without trusted server authorization, no false receipt',async()=>{
 const f=fixture();
 const denied=await send(f,sale(),'unsigned-user-assertion');
 assert.equal(denied.ok,false);assert.equal(denied.status,403);assert.equal(f.rows.size,0);
 const failure=fixture({authorize:async()=>{throw Error('down')}}),r=await send(failure,sale());
 assert.equal(r.ok,false);assert.equal(r.status,503);assert.equal(failure.rows.size,0);
});
test('atomic server receipt is an inbox receipt, NOT a completed business sale',async()=>{
 const f=fixture(),r=await send(f,sale());
 assert.equal(r.ok,true);assert.equal(r.status,200);assert.equal(r.receipt.stage,'stored-for-application');
 assert.equal(r.receipt.opId,'synthetic-op-001');assert.equal(r.receipt.license,LICENSE);
 assert.equal('saleCommitted' in r.receipt,false);
 assert.equal(f.rows.size,1);assert.equal(f.invocations.writes,1);
 assert.equal(f.invocations.auth[0].scope,'ops:sale');
});
test('same opId and payload return identical receipt with zero additional writes',async()=>{
 const f=fixture(),a=await send(f,sale()),b=await send(f,sale());
 assert.equal(a.ok,true);assert.equal(b.ok,true);assert.deepEqual(a.receipt,b.receipt);
 assert.equal(b.duplicate,true);assert.equal(f.invocations.writes,1);assert.equal(f.invocations.auth.length,2);
});
test('same opId and different quantity or amount is conflict, never overwrite',async()=>{
 const f=fixture(),initial=await send(f,sale());
 for(const changed of [sale({quantity:2}),sale({amountCents:2000})]){
  const x=await send(f,changed);assert.equal(x.ok,false);assert.equal(x.status,409);
 }
 assert.equal(f.invocations.writes,1);
 const again=await send(f,sale());assert.deepEqual(again.receipt,initial.receipt);
});
test('same opId under separate license cannot bypass authoritative tenant match',async()=>{
 const f=fixture(),a=await send(f,sale());
 const b=await send(f,sale({license:'F123-SYNTHETIC-OTHER'}));
 assert.equal(a.ok,true);assert.equal(b.ok,true);
 assert.equal(f.rows.size,2);
 const denied=fixture({authorize:async()=>({ok:true,principal:{license:LICENSE,scopes:['ops:sale']}})});
 const c=await send(denied,sale({license:'F123-SYNTHETIC-OTHER'}));
 assert.equal(c.ok,false);assert.equal(c.status,403);assert.equal(denied.rows.size,0);
});
test('read-only actor cannot write even with plausible owner role fields',async()=>{
 const f=fixture({authorize:async()=>({ok:true,principal:{license:LICENSE,subject:'employee',scopes:['priv:read']}})});
 const r=await send(f,sale());assert.equal(r.status,403);assert.equal(f.rows.size,0);
});
test('only required receipt metadata is returned; no payload, PIN or credentials',async()=>{
 const f=fixture(),r=await send(f,sale(),'synthetic-signed-ticket');
 assert.equal(r.ok,true);const json=JSON.stringify(r);
 for(const forbidden of ['synthetic-signed-ticket','productId','quantity','amountCents','pin','customerPhone']) assert.equal(json.includes(forbidden),false,forbidden);
});
test('SQL insertion failure must not report stored receipt and must not retain row',async()=>{
 const f=fixture({insertFails:true}),r=await send(f,sale());
 assert.equal(r.ok,false);assert.equal(r.status,503);assert.equal(f.rows.size,0);
 assert.equal(f.invocations.writes,0);
});
test('explicit sale, expense and partial debt payment have distinct scopes',async()=>{
 const f=fixture();
 for(const [cmd,scope] of [[sale(),'ops:sale'],[expense(),'ops:expense'],[payment(),'ops:payment']]){
  const r=await send(f,cmd);assert.equal(r.ok,true);assert.equal(f.invocations.auth.at(-1).scope,scope);
 }
 assert.equal(f.invocations.writes,3);
});
test('reject imprecise, negative or excessively large cents without hiding error as zero',async()=>{
 for(const amountCents of [-1,0.01,NaN,Infinity,Number.MAX_SAFE_INTEGER,'100',1e13]){
  const f=fixture(),r=await send(f,sale({amountCents}));assert.equal(r.ok,false,JSON.stringify(amountCents));
  assert.equal(f.rows.size,0);
 }
});
test('required product and ids must be narrow, refuse traversal or XSS values',async()=>{
 for(const payload of [sale({productId:'../../etc/passwd'}),sale({opId:'<script>alert(1)</script>'}),expense({categoryId:'<img src=x>'}),payment({receivableId:''})]){
  const f=fixture(),r=await send(f,payload);assert.equal(r.ok,false);assert.equal(f.rows.size,0);
 }
});
test('an authority that returns no principal scope cannot be accepted',async()=>{
 for(const principal of [null,{}, {license:LICENSE,scopes:[]},{license:LICENSE,scopes:['ops:sale'],subject:''}]){
  const f=fixture({authorize:async()=>({ok:true,principal})}),r=await send(f,sale());
  assert.equal(r.ok,false);assert.equal(r.status,403);
 }
});
test('authorization is rechecked on every idempotent retry, not cached by opId',async()=>{
 let n=0;const f=fixture({authorize:async({license,scope})=>({ok:++n===1,principal:{license,subject:'owner-account',scopes:[scope]}})});
 assert.equal((await send(f,sale())).ok,true);
 const denied=await send(f,sale());assert.equal(denied.ok,false);assert.equal(denied.status,403);
 assert.equal(f.invocations.writes,1);
});

test('valid license alphabet from the existing WS issuer is accepted byte-for-byte',async()=>{
 const allowed='F123-AB*~$=-CDE123';
 const f=fixture();
 const cmd=sale({license:allowed});
 const result=await send(f,cmd);
 assert.equal(result.ok,true);
 assert.equal(result.receipt.license,allowed);
 assert.equal((await send(f,cmd)).duplicate,true);
 assert.equal(f.invocations.writes,1);
});
test('license boundary exactly follows existing issuer limit of 8..34 characters after F123-',async()=>{
 for(const code of ['F123-'+'A'.repeat(7),'F123-'+'A'.repeat(35)]){
  const f=fixture(),r=await send(f,sale({license:code}));
  assert.equal(r.ok,false);assert.equal(r.status,400);assert.equal(f.rows.size,0);
 }
 for(const code of ['F123-'+'A'.repeat(8),'F123-'+'A'.repeat(34)]){
  const f=fixture(),r=await send(f,sale({license:code}));
  assert.equal(r.ok,true,code);
 }
});

const customerPayment=(over={})=>({
 opId:'customer-payment:8f79b07c-3db5-478f-ab69-59b0e483912b',
 license:LICENSE,kind:'credit.customer.payment.record',
 clienteId:'client_1',amountCents:101,...over
});
test('RED: a persisted customer payment has its own clienteId contract and unchanged colon opId',async()=>{
 const f=fixture(),cmd=customerPayment(),a=await send(f,cmd);
 assert.equal(a.status,200);
 assert.equal(a.receipt.stage,'stored-for-application');
 assert.equal(a.receipt.kind,'credit.customer.payment.record');
 assert.equal(a.receipt.opId,cmd.opId);
 assert.deepEqual(JSON.parse(f.payloads.get(LICENSE+'::'+cmd.opId)),{
  license:LICENSE,opId:cmd.opId,kind:cmd.kind,clienteId:'client_1',amountCents:101
 });
 assert.equal(f.invocations.auth[0].scope,'ops:payment');
 const b=await send(f,{...cmd});
 assert.equal(b.status,200);assert.equal(b.duplicate,true);
 assert.deepEqual(b.receipt,a.receipt);
 assert.equal(f.invocations.writes,1);
});
test('RED: a customer payment keeps identity and cents under retries and rejects changed intentions',async()=>{
 const f=fixture(),base=customerPayment();
 assert.equal((await send(f,base)).status,200);
 for(const changed of [{clienteId:'client_2'},{amountCents:100},{amountCents:102}]){
  const result=await send(f,customerPayment(changed));
  assert.equal(result.status,409);
 }
 assert.equal(f.invocations.writes,1);
});
test('RED: customer payment forbids receivableId and allocation, roles, PII and zero cents',async()=>{
 const f=fixture();
 const bad=[
 {receivableId:'debt_1'},
 {cargoKey:'venta:sale_1'},
 {partes:[{cargoKey:'venta:sale_1',monto:1}]},
 {role:'dueno'},
 {pin:'123456'},
 {customerPhone:'0991234567'},
 {amountCents:0},
 {amountCents:1.01},
 {clienteId:'../../other'},
 {opId:'customer-payment:../bad'},
 {opId:'customer-payment:<script>alert(1)</script>'},
 {opId:'prefix:abc123456'},
 ];
 for(const ext of bad){
  const response=await send(f,customerPayment(ext));
  assert.equal(response.status,400,JSON.stringify(ext));
 }
 assert.equal(f.rows.size,0);
});
test('RED: colon opId is valid ONLY on customer payment kind; legacy receivable stays stable',async()=>{
 const f=fixture();
 assert.equal((await send(f,customerPayment())).status,200);
 assert.equal((await send(f,payment({opId:customerPayment().opId}))).status,400);
 assert.equal((await send(f,sale({opId:customerPayment().opId}))).status,400);
 const old=await send(f,payment());
 assert.equal(old.status,200);
 assert.equal(old.receipt.kind,'credit.payment.record');
 const oldPayload=JSON.parse(f.payloads.get(LICENSE+'::'+'synthetic-payment-003'));
 assert.equal(oldPayload.receivableId,'synthetic-debt-1');
 assert.equal('clienteId' in oldPayload,false);
});
test('RED: revoked actor must not retrieve prior customer payment receipt',async()=>{
 let called=0;const f=fixture({authorize:async({license,scope})=>({
  ok:++called===1,principal:{license,scopes:[scope],subject:'synthetic-owner'}
 })});
 assert.equal((await send(f,customerPayment())).status,200);
 const retry=await send(f,customerPayment());
 assert.equal(retry.status,403);
 assert.equal(f.invocations.writes,1);
});
