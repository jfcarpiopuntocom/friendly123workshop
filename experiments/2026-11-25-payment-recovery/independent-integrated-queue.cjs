'use strict';
// node independent-integrated-queue.cjs cartera.js hechos.js payment-alias-stress.cjs independent-identity-conflict.cjs independent-alias-write.cjs independent-conflict-queue.cjs
// Optional --emit writes experimental candidates to working directory.
const fs=require('node:fs');
async function run(cartera,hechos,harness,prior,alias,queue){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor: "+a);return s.replace(a,b)};
 const build=swap(alias.slice(0,alias.indexOf("run(...process.argv")),"\n const f=(id,tipo,datos,ts=1790000001000)=>","\n return fixed;\n const f=(id,tipo,datos,ts=1790000001000)=>");
 const old=await new Function("require","src","harness","prior",build+"\nreturn run(src,harness,prior);")(()=>({}),cartera,harness,prior);
 const q=await new Function("require","src",queue.slice(0,queue.indexOf("run(fs.readFileSync"))+"\nreturn run(src);")(()=>({}),hechos);
 const next=swap(old,"      return global.AMG.Hechos.registrar(APLICACION, payload, {\n        repetido:", "      return global.AMG.Hechos.registrar(APLICACION, payload, {\n        propagarConflicto: true,\n        repetido:");
 const nextHechos=swap(hechos,q.original,q.candidate);
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const charge=f("c","cartera_cargo",{monto:35}),p=f("a","cartera_abono",{monto:10,opId:"p",motivo:"pay"}),aliasP={...p,id:"z"},conflict={...p,id:"bad",datos:{...p.datos,monto:12}};
 const parts=[{cargoKey:"cargo:c",monto:10}];
 async function suite(code,registrarSource){
   const rows=[];
   for(const mode of ["queued-conflict","alias-retry","legacy-null","generic-failure"]){
    let facts=[charge,p,aliasP], writes=0,inject=null,fail=null,logs=[],original=JSON.stringify(facts);
    const construct=async(tipo,datos,n,opts)=>{if(inject){facts.push(inject);inject=null}if(fail){const e=fail;fail=null;throw e}const prev=opts?.repetido?.(facts.slice());if(prev)return prev;const h=f("write-"+(++writes),tipo,datos,1790000010000+writes);facts.push(h);return h;};
    const registrar=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+registrarSource+"\nreturn registrar;")(construct,{warn:(...a)=>logs.push(a.join(" "))});
    const w={AMG:{Hechos:{todos:async()=>facts.slice(),registrar,verificarCadenas:async()=>({ok:true})}}};new Function("window",code)(w);const api=w.AMG.Cartera;
    const result=async fn=>{try{const v=await fn();return v===null?{null:true}:{id:v.id}}catch(e){return {status:e.status||null,error:e.message}}};
    let first,second;
    if(mode==="queued-conflict"){inject=conflict;first=await result(()=>api.aplicarAbono("A","z",parts,[],"apply"));second=await result(()=>registrar("legacy",{ok:1}));}
    if(mode==="alias-retry"){first=await result(()=>api.aplicarAbono("A","a",parts,[],"apply"));second=await result(()=>api.aplicarAbono("A","z",parts,[],"apply"));}
    if(mode==="legacy-null"){fail=Object.assign(new Error("legacy conflict"),{status:409});first=await result(()=>registrar("legacy",{}));second=await result(()=>api.aplicarAbono("A","a",parts,[],"apply"));}
    if(mode==="generic-failure"){fail=new Error("abort injected");first=await result(()=>api.aplicarAbono("A","a",parts,[],"apply"));second=await result(()=>api.aplicarAbono("A","a",parts,[],"apply"));}
    const balance=api.calcularSaldo(facts,"A",[]);rows.push({mode,first,second,writes,assignments:facts.filter(h=>h.tipo==="cartera_aplicacion").length,saldo:balance.saldo,identity:balance.conflictosIdentidadExperimental,originalsPreserved:JSON.stringify(facts.slice(0,3))===original,logs});
   }
   return rows;
 }
 const red=await suite(old,q.original),green=await suite(next,q.candidate);
 if(red[0].first.status!==null||green[0].first.status!==409||green[0].assignments!==0||green[0].second.id!=="write-1"||green[1].first.id!==green[1].second.id||green[1].assignments!==1||!green[2].first.null||green[2].assignments!==1||green[3].first.status!==null||green[3].assignments!==1||green.slice(1).some(r=>r.saldo!==-25)||green.some(r=>!r.originalsPreserved))throw Error(JSON.stringify({red,green}));
 return {red,green,candidate:{cartera:next,hechos:nextHechos}};
}
run(...process.argv.slice(2,8).map(p=>fs.readFileSync(p,'utf8'))).then(({candidate,...r})=>{if(process.argv.includes('--emit')){fs.writeFileSync('cartera.experimental.js',candidate.cartera,{flag:'wx'});fs.writeFileSync('hechos.experimental.js',candidate.hechos,{flag:'wx'});}console.log(JSON.stringify(r,null,2));}).catch(e=>{console.error(e);process.exitCode=1});
