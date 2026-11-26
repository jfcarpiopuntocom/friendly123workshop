'use strict';
// node integrated-conflict.cjs cartera.js hechos.js payment-alias-stress.cjs independent-identity-conflict.cjs independent-alias-write.cjs independent-conflict-queue.cjs
const fs=require('node:fs');
async function run(src,hechos,harness,prior,alias,queue){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const builder=swap(alias.slice(0,alias.indexOf("run(...process.argv")),"\n const f=(id,tipo,datos,ts=1790000001000)","\n return fixed;\n const f=(id,tipo,datos,ts=1790000001000)");
 const old=await new Function("require","src","harness","prior",builder+"\nreturn run(src,harness,prior);")(()=>({}),src,harness,prior);
 const q=await new Function("require","src",queue.slice(0,queue.indexOf("run(fs.readFileSync"))+"\nreturn run(src);")(()=>({}),hechos);
 const fixed=swap(old,"return global.AMG.Hechos.registrar(APLICACION, payload, {\n        repetido:","return global.AMG.Hechos.registrar(APLICACION, payload, {\n        propagarConflicto: true,\n        repetido:");
 const hechosFixed=swap(hechos,q.original,q.candidate);
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const c=f("c","cartera_cargo",{monto:35}),p=f("p","cartera_abono",{monto:10,opId:"p"}),bad=f("p2","cartera_abono",{monto:12,opId:"p"}),cb=f("cb","cartera_cargo",{clienteId:"B",monto:20}),pb=f("pb","cartera_abono",{clienteId:"B",monto:5,opId:"pb"});
 const parts=[{cargoKey:"cargo:c",monto:10}],partsB=[{cargoKey:"cargo:cb",monto:5}];
 async function suite(cartera,registrar){
  const facts=[c,p,cb,pb],writes=[],warnings=[],snap=JSON.stringify(facts);let inject=true;
  const store={todos:async()=>facts.slice(),verificarCadenas:async()=>({ok:true})};
  store.registrar=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+registrar+"\nreturn registrar;")(async(tipo,datos,n,opts)=>{if(inject){facts.push(bad);inject=false}const prev=opts?.repetido?.(facts.slice());if(prev)return prev;const h=f("write-"+writes.length,tipo,datos,1790000005000+writes.length);facts.push(h);writes.push(h.id);return h},{warn:(...a)=>warnings.push(a.join(" "))});
  const w={AMG:{Hechos:store}};new Function("window",cartera)(w);const api=w.AMG.Cartera;
  const capture=async p=>{try{return {id:(await p).id}}catch(e){return {status:e.status||null,message:e.message}}};
  const first=await capture(api.aplicarAbono("A","p",parts,[],"a"));
  const second=await capture(api.aplicarAbono("B","pb",partsB,[],"b"));
  const retry=await capture(api.aplicarAbono("B","pb",partsB,[],"b"));
  const x=await api.saldoDeCliente("A",[]),y=await api.saldoDeCliente("B",[]);
  return {first,second,retry,writes,warnings,a:{saldo:x.saldo,flag:x.conflictosIdentidadExperimental},b:{saldo:y.saldo,flag:y.conflictosIdentidadExperimental,applied:y.movimientos.find(m=>m.tipo==="cargo").aplicado},originalFactsPreserved:JSON.stringify(facts.slice(0,4))===snap};
 }
 const red=await suite(old,q.original),green=await suite(fixed,q.candidate);
 if(red.first.status!==null||green.first.status!==409||green.writes.length!==1||green.second.id!==green.retry.id||green.a.flag!==1||green.b.flag!==0||green.b.saldo!==-15||green.b.applied!==5||!green.originalFactsPreserved)throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"actual aplicarAbono/calcularSaldo/saldoDeCliente/registrar; mocked construirYGuardar and storage",candidate:{cartera:fixed,hechos:hechosFixed}};
}
run(...process.argv.slice(2,8).map(p=>fs.readFileSync(p,'utf8'))).then(({candidate,...r})=>{console.log(JSON.stringify(r,null,2));if(process.env.F123_CANDIDATE_DIR){fs.mkdirSync(process.env.F123_CANDIDATE_DIR,{recursive:true});fs.writeFileSync(process.env.F123_CANDIDATE_DIR+'/cartera.js',candidate.cartera);fs.writeFileSync(process.env.F123_CANDIDATE_DIR+'/hechos.js',candidate.hechos)}}).catch(e=>{console.error(e);process.exitCode=1});
