'use strict';
// node integrated-alias-queue.cjs cartera.js hechos.js payment-alias-stress.cjs independent-identity-conflict.cjs independent-alias-write.cjs independent-conflict-queue.cjs
const fs=require('node:fs');
async function run(cartera,hechos,harness,prior,alias,queue){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor: "+a);return s.replace(a,b)};
 const aliasBuild=swap(alias.slice(0,alias.indexOf("\nrun(...process.argv")),"\n const f=(id,tipo,datos,ts=1790000001000)","\n return fixed;\n const f=(id,tipo,datos,ts=1790000001000)");
 const old=await new Function("require","src","harness","prior",aliasBuild+"\nreturn run(src,harness,prior);")(()=>({}),cartera,harness,prior);
 const q=await new Function("require","src",queue.slice(0,queue.indexOf("\nrun(fs.readFileSync"))+"\nreturn run(src);")(()=>({}),hechos);
 const fixed=swap(old,"return global.AMG.Hechos.registrar(APLICACION, payload, {\n        repetido:","return global.AMG.Hechos.registrar(APLICACION, payload, {\n        propagarConflicto: true,\n        repetido:");
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const cargo=f("charge","cartera_cargo",{monto:35}),p=f("a","cartera_abono",{monto:10,opId:"pay",motivo:"payment"}),aliasP={...p,id:"z"},bad={...aliasP,datos:{...aliasP.datos,monto:12}},parts=[{cargoKey:"cargo:charge",monto:10}];
 async function suite(code,registrar){
  const outcomes=[];
  async function test(name,initial,body){
   let facts=JSON.parse(JSON.stringify(initial)),writes=0,inject=null,fail=false;const warnings=[];
   const register=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+registrar+"\nreturn registrar;")(async(tipo,datos,n,opts)=>{if(inject){facts.push(inject);inject=null}if(fail){fail=false;throw Error("injected storage failure")}const prev=opts?.repetido?.(facts.slice());if(prev)return prev;const h=f("write-"+(++writes),tipo,datos,1790000005000+writes);facts.push(h);return h},{warn:(...xs)=>warnings.push(xs.join(" "))});
   const w={AMG:{Hechos:{todos:async()=>facts.slice(),registrar:register,verificarCadenas:async()=>({ok:true})}}};new Function("window",code)(w);const api=w.AMG.Cartera;
   const outcome=async fn=>{try{const r=await fn();return {ok:true,id:r?.id??null}}catch(e){return {ok:false,status:e.status??null,error:e.message}}};
   const results=await body({api,outcome,register,inject:h=>{inject=h},fail:()=>{fail=true}});
   const r=api.calcularSaldo(facts,"A",[]);outcomes.push({name,results,writes,saldo:r.saldo,applied:r.movimientos.find(m=>m.tipo==="cargo")?.aplicado,identity:r.conflictosIdentidadExperimental,originalFactsPreserved:JSON.stringify(facts.slice(0,initial.length))===JSON.stringify(initial),warnings});
  }
  await test("conflict during real registrar queue",[cargo,p],async({api,outcome,register,inject})=>{inject(bad);const x=await outcome(()=>api.aplicarAbono("A","a",parts,[],"apply"));const y=await outcome(()=>register("diagnostic",{opId:"probe"}));return [x,y]});
  await test("concurrent alias retries one intention",[cargo,p,aliasP],async({api,outcome})=>Promise.all([outcome(()=>api.aplicarAbono("A","a",parts,[],"apply")),outcome(()=>api.aplicarAbono("A","z",parts,[],"apply"))]));
  await test("storage failure then retry same intention",[cargo,p,aliasP],async({api,outcome,fail})=>{fail();return [await outcome(()=>api.aplicarAbono("A","a",parts,[],"apply")),await outcome(()=>api.aplicarAbono("A","z",parts,[],"apply"))]});
  await test("conflict before queue",[cargo,p,bad],async({api,outcome})=>[await outcome(()=>api.aplicarAbono("A","a",parts,[],"apply"))]);
  return outcomes;
 }
 const red=await suite(old,q.original),green=await suite(fixed,q.candidate);
 const [x,y,z,t]=green;if(red[0].results[0].status!==null||x.results[0].status!==409||x.writes!==1||!x.results[1].ok||y.writes!==1||y.results.some(r=>!r.ok)||y.results[0].id!==y.results[1].id||z.results[0].ok||!z.results[1].ok||z.writes!==1||t.results[0].status!==409||t.writes!==0||green.some(r=>!r.originalFactsPreserved))throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"real Cartera source and real extracted Hechos.registrar; injected construirYGuardar and storage; no native IDB"};
}
run(...process.argv.slice(2,8).map(p=>fs.readFileSync(p,'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
