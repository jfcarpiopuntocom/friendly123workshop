'use strict';
const fs=require('node:fs'),path=require('node:path'),{webcrypto}=require('node:crypto');
async function experiment(hechos,cartera,webcrypto,Encoder){
 function extract(src,start,end){const a=src.indexOf(start),b=src.indexOf(end,a);if(a<0||b<=a)throw Error("anchors "+start);return src.slice(a,b)}
 const hashing=extract(hechos,"function hashDebil(txt)","  // ---------------------------------------------------------------------------");
 const importer=extract(hechos,"function importarRemoto(hecho)","  // ---------------------------------------------------------------------------");
 const verify=extract(hechos,"function verificarCadenas(lista)","  // ---------------------------------------------------------------------------");
 const global={crypto:webcrypto,dispatchEvent(){}},map=new Map();
 const clone=x=>JSON.parse(JSON.stringify(x));
 function abrirDB(){return Promise.resolve({transaction(){
   const tx={error:null,abort(){tx.aborted=true;Promise.resolve().then(()=>tx.onabort())},objectStore(){return {get(id){const req={result:map.get(id)};Promise.resolve().then(()=>{req.onsuccess();if(!tx.aborted){if(tx.pending)map.set(tx.pending.id,clone(tx.pending));tx.oncomplete()}});return req},add(h){tx.pending=h}}}};return tx
 }})}
 const api=new Function("global","abrirDB","STORE","TextEncoder","CustomEvent","DOMException",hashing+importer+'var _cadenaVerificada={firma:"",resultado:null};'+verify+";return {importarRemoto,verificarCadenas,calcularHash};")(global,abrirDB,"hechos",Encoder,function(){},Error);
 const w={};new Function("window",cartera)(w);const calc=w.AMG.Cartera.calcularSaldo;
 async function fact(author,num,prev,tipo,datos,ts=1790000001000){const h={id:author+"-"+num,instanceId:author,autor:"dueno",reloj:{[author]:num},ts,tipo,datos,hashPrevio:prev};h.hash=await api.calcularHash(JSON.stringify(h));return h}
 const cl="synthetic";const charge=await fact("a",1,"","cartera_cargo",{clienteId:cl,monto:35,motivo:"charge"},1790000000000);
 const p={clienteId:cl,monto:10,motivo:"payment",opId:"customer-payment:synthetic-same"};
 const a=await fact("a",2,charge.hash,"cartera_abono",p),b=await fact("b",1,"","cartera_abono",p),different=await fact("b",1,"","cartera_abono",{payload:{...p,opId:"customer-payment:synthetic-other"}});
 const sale={id:"s",clienteId:cl,cantidad:1,precioUnit:108,fecha:"2026-11-25",info:{formaPago:"fiado",fiadoAtomico:true}},d={clienteId:cl,monto:108,motivo:"sale",ventaId:"s"};
 const ca=await fact("a",1,"","cartera_cargo",{...d,opId:"charge-a"}),cb=await fact("b",1,"","cartera_cargo",{...d,opId:"charge-b"});
 const rows=[];
 for(const [name,fs,vs,expected] of [["same-opid",[charge,a,b],[],-25],["distinct-nested",[charge,a,different],[],-15],["same-sale",[ca,cb],[sale],-108]]){
  for(const reverse of [false,true]){map.clear();const received=[];for(const h of reverse?fs.slice().reverse():fs)received.push(await api.importarRemoto(h));const exactReplay=await api.importarRemoto(fs[0]);const integrity=await api.verificarCadenas([...map.values()]);const balance=calc([...map.values()],cl,vs).saldo;rows.push({name,reverse,accepted:received,exactReplay,integrity,balance,expected,hashMode:fs[0].hash.startsWith("w:")?"weak-legacy":"sha256"})}
 }
 let tamperedRejected=false;try{await api.importarRemoto({...ca,datos:{...ca.datos,monto:999}})}catch(e){tamperedRejected=/hash remoto/.test(e.message)}
 return {rows,tamperedRejected}
}
(async()=>{const root=process.argv[2];if(!root)throw Error('Usage: node import-projection-reachability.cjs /path/to/snapshot');const h=fs.readFileSync(path.join(root,'docs/hechos.js'),'utf8'),c=fs.readFileSync(path.join(root,'docs/cartera.js'),'utf8');for(const [mode,crypto] of [['SHA-256',webcrypto],['legacy weak',undefined]]){const r=await experiment(h,c,crypto,TextEncoder);console.log(JSON.stringify({mode,...r},null,2));if(r.rows.some(x=>!x.integrity.ok||x.balance!==x.expected)||!r.tamperedRejected)process.exitCode=1;}})().catch(e=>{console.error(e);process.exitCode=2});
