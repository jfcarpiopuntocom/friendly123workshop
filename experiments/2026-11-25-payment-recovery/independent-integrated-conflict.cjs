'use strict';
// node independent-integrated-conflict.cjs cartera.js hechos.js plan-pagos-ui.js payment-alias-stress.cjs independent-identity-conflict.cjs independent-alias-write.cjs independent-conflict-queue.cjs
const fs=require('node:fs');
async function run(cartera,hechos,ui,harness,prior,alias,queue){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const cut=alias.lastIndexOf("\nrun(...process.argv");const ac=alias.slice(0,cut).replace("\n const cargo=f(","\n return fixed;\n const cargo=f(");
 if(!ac.includes("return fixed;"))throw Error("alias anchor");
 const candidate=await new Function("require","cartera","harness","prior",ac+"\nreturn run(cartera,harness,prior);")(()=>({}),cartera,harness,prior);
 const qc=queue.slice(0,queue.lastIndexOf("\nrun(fs.readFileSync"));
 const q=await new Function("require","hechos",qc+"\nreturn run(hechos);")(()=>({}),hechos);
 const wired=swap(candidate,"return global.AMG.Hechos.registrar(APLICACION, payload, {\n        repetido:","return global.AMG.Hechos.registrar(APLICACION, payload, {\n        propagarConflicto: true,\n        repetido:");
 const fact=(id,tipo,datos)=>({id,tipo,ts:1790000000000,datos:{clienteId:"A",...datos}});
 async function trial(code,reg){
  const p=fact("a","cartera_abono",{monto:10,opId:"p"}),cargo=fact("c","cartera_cargo",{monto:35}),conflict=fact("z","cartera_abono",{monto:12,opId:"p"});const facts=[cargo,p];let writes=0,inject=true;
  const w={AMG:{Hechos:{todos:async()=>facts.slice()}}};
  const registrar=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+reg+"\nreturn registrar;")(async(tipo,datos,n,opts)=>{if(inject){inject=false;facts.push(conflict)}const old=opts?.repetido?.(facts.slice());if(old)return old;const h=fact("w"+(++writes),tipo,datos);facts.push(h);return h},{warn:()=>{}});
  w.AMG.Hechos.registrar=registrar;new Function("window",code)(w);
  let error;try{await w.AMG.Cartera.aplicarAbono("A","a",[{cargoKey:"cargo:c",monto:10}],[],"apply")}catch(e){error={status:e.status||null,message:e.message}}
  const after=await registrar("unrelated",{clienteId:"B"});
  return {error,writesAfterConflict:writes-1,queueRecovered:!!after,originalFactsPreserved:JSON.stringify(facts.slice(0,2))===JSON.stringify([cargo,p])};
 }
 const red=await trial(candidate,q.original),green=await trial(wired,q.candidate);
 if(red.error.status!==null||green.error.status!==409||green.writesAfterConflict!==0||!green.queueRecovered||!green.originalFactsPreserved)throw Error(JSON.stringify({red,green}));
 const start=ui.indexOf("  async function confirmarAsignacion("),end=ui.indexOf("  async function reanudarAsignacion(",start);const old=ui.slice(start,end);
 const fixed=swap(old,'throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");','var e = new Error(respuesta.error || "Payment saved; allocation pending confirmation.");\n      e.status = res.status;\n      throw e;');
 async function http(code){let releases=0;const f=new Function("_pagoMismaSesion","fetch","API","_pagoLiberarReferencia","claveAsignacion","claveAbono",code+"\nreturn confirmarAsignacion;")(()=>{},async()=>({ok:false,status:409,json:async()=>({error:"conflict"})}),"",async()=>{releases++},x=>x,x=>x);let error;try{await f("A",{abonoId:"a",opId:"alloc",paymentOpId:"p",partes:[]},null)}catch(e){error={status:e.status||null,message:e.message}}return {error,releases}}
 const httpRed=await http(old),httpGreen=await http(fixed);if(httpRed.error.status!==null||httpGreen.error.status!==409||httpGreen.releases!==0)throw Error("HTTP");
 return {red,green,httpRed,httpGreen,scope:"exact functions; injected persistence and HTTP; no native IDB, no real server; no UI DOM certification"};
}
run(...process.argv.slice(2,9).map(p=>fs.readFileSync(p,'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
