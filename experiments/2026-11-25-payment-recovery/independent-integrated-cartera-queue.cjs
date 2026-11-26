'use strict';
// Inputs: cartera.js hechos.js payment-alias-stress.cjs independent-identity-conflict.cjs independent-alias-write.cjs independent-conflict-queue.cjs
const fs=require('node:fs');
async function run(cartera,hechos,alias,identity,write,queue){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const w=swap(write.slice(0,write.indexOf("run(...process.argv")),"\n const f=(id,tipo,datos,ts=1790000001000)=>","\n return fixed;\n const f=(id,tipo,datos,ts=1790000001000)=>");
 const c0=await new Function("require","cartera","alias","identity",w+"\nreturn run(cartera,alias,identity);")(()=>({}),cartera,alias,identity);
 const c1=swap(c0,"      return global.AMG.Hechos.registrar(APLICACION, payload, {\n        repetido:","      return global.AMG.Hechos.registrar(APLICACION, payload, {\n        propagarConflicto: true,\n        repetido:");
 const q=await new Function("require","src",queue.slice(0,queue.indexOf("run(fs.readFileSync"))+"\nreturn run(src);")(()=>({}),hechos);
 const h0=hechos.slice(hechos.indexOf("  function construirYGuardar("),hechos.indexOf("\n  // ---",hechos.indexOf("  function registrar(tipo, datos, opciones) {"))).trimEnd();
 const h1=swap(h0,q.original,q.candidate);
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const cargo=f("charge","cartera_cargo",{monto:35}),p=f("a","cartera_abono",{monto:10,opId:"pay",motivo:"payment"}),aliasP={...p,id:"z"},conflict={...aliasP,datos:{...aliasP.datos,monto:12}},parts=[{cargoKey:"cargo:charge",monto:10}];
 async function suite(cCode,hCode){
  const cases=[];
  async function test(name,initial,body){
   let facts=JSON.parse(JSON.stringify(initial)),before=JSON.stringify(facts),inject=null,fail=false,writes=0,reads=0,metadataWrites=0,events=0,meta={instanceId:"local",contador:0,ultimoHash:"",reloj:{}};
   const todos=async()=>{reads++;if(inject&&reads===inject.at){facts.push(inject.fact);inject=null}return facts.slice()};
   const guardar=async h=>{if(fail){fail=false;throw Error("synthetic abort")}facts.push(h);writes++;return h};
   const w={AMG:{},dispatchEvent:()=>events++};
   const registrar=new Function("todos","leerMeta","instanceId","autorActual","calcularHash","guardar","guardarMeta","global","CustomEvent","console","var _cola=Promise.resolve();\n"+hCode+"\nreturn registrar;")(todos,()=>JSON.parse(JSON.stringify(meta)),()=>"local",()=>"test",async s=>"synthetic-"+s.length,guardar,m=>{meta=JSON.parse(JSON.stringify(m));metadataWrites++},w,function(){},{warn:()=>{}});
   w.AMG.Hechos={todos,registrar,verificarCadenas:async()=>({ok:true})};new Function("window",cCode)(w);const api=w.AMG.Cartera;
   const outcome=async fn=>{try{const v=await fn();return {id:v?.id||null}}catch(e){return {status:e.status||null,message:e.message}}};
   const out=await body({api,outcome,inject:()=>{inject={at:reads+2,fact:conflict}},abort:()=>{fail=true},registrar});
   const r=api.calcularSaldo(facts,"A",[]);cases.push({name,out,writes,metadataWrites,events,saldo:r.saldo,applied:r.movimientos.find(m=>m.tipo==="cargo")?.aplicado,identity:r.conflictosIdentidadExperimental,originalFactsPreserved:JSON.stringify(facts.slice(0,initial.length))===before});
  }
  await test("conflict-during-real-queue",[cargo,p],async({api,outcome,inject,registrar})=>{inject();const first=await outcome(()=>api.aplicarAbono("A","a",parts,[],"apply"));const next=await outcome(()=>registrar("test_event",{ok:true}));return {first,next}});
  await test("alias-retry",[cargo,p,aliasP],async({api,outcome})=>{const first=await outcome(()=>api.aplicarAbono("A","z",parts,[],"apply"));const next=await outcome(()=>api.aplicarAbono("A","a",parts,[],"apply"));return {first,next}});
  await test("failed-append-then-retry",[cargo,p],async({api,outcome,abort})=>{abort();const first=await outcome(()=>api.aplicarAbono("A","a",parts,[],"apply"));const next=await outcome(()=>api.aplicarAbono("A","a",parts,[],"apply"));return {first,next}});
  return cases;
 }
 const red=await suite(c0,h0),green=await suite(c1,h1);
 if(red[0].out.first.status!==null||green[0].out.first.status!==409||green[0].out.next.id!=="local-1"||green[0].writes!==1||green[0].applied!==0||green[1].writes!==1||green[1].out.first.id!==green[1].out.next.id||green[1].saldo!==-25||green[1].applied!==10||green[2].writes!==1||green[2].metadataWrites!==1||green[2].out.next.id!=="local-1"||green[2].applied!==10||green.some(x=>!x.originalFactsPreserved))throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"real Cartera and extracted construirYGuardar/registrar, simulated store/hash/meta/events; no native IDB or Sync4",candidate:{cartera:c1,hechos:swap(hechos,q.original,q.candidate)}};
}
run(...process.argv.slice(2,8).map(p=>fs.readFileSync(p,'utf8'))).then(({candidate,...r})=>{console.log(JSON.stringify(r,null,2));if(process.env.OUT_DIR){fs.mkdirSync(process.env.OUT_DIR,{recursive:true});for(const [k,v] of Object.entries(candidate))fs.writeFileSync(process.env.OUT_DIR+'/'+k+'.js',v);}}).catch(e=>{console.error(e);process.exitCode=1});
