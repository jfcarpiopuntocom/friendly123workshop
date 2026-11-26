'use strict';
// node independent-integrated-payment.cjs cartera.js hechos.js payment-alias-stress.cjs independent-identity-conflict.cjs independent-alias-write.cjs independent-conflict-queue.cjs
const fs=require('node:fs');
async function run(cartera,hechos,harness,prior,alias,queue){
 const replace=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const build=replace(alias.slice(0,alias.indexOf("run(...process.argv")),"\n const f=(id,tipo,datos,ts=1790000001000)","\n return fixed;\n const f=(id,tipo,datos,ts=1790000001000)");
 const prev=await new Function("require","src","harness","prior",build+"\nreturn run(src,harness,prior);")(()=>({}),cartera,harness,prior);
 let fixed=replace(prev,"      return global.AMG.Hechos.registrar(APLICACION, payload, {\n        repetido:","      return global.AMG.Hechos.registrar(APLICACION, payload, {\n        propagarConflicto: true,\n        repetido:");
 fixed=replace(fixed,"var opciones = relacion && relacion.opId ? { repetido:","var opciones = relacion && relacion.opId ? { propagarConflicto: true, repetido:");
 const qrun=queue.slice(0,queue.indexOf("run(fs.readFileSync"));
 const q=await new Function("require","src",qrun+"\nreturn run(src);")(()=>({}),hechos);
 let fixedHechos=replace(hechos,q.original,q.candidate);
 fixedHechos=replace(fixedHechos,'        tx.onerror = function () { reject(fallo || tx.error); };\n      });\n    });\n  }\n\n  // Un hecho remoto','        tx.onerror = function () { reject(fallo || tx.error); };\n        tx.onabort = function () { reject(fallo || tx.error || new DOMException("hecho abortado", "AbortError")); };\n      });\n    });\n  }\n\n  // Un hecho remoto');
 function extract(src,start,end){const a=src.indexOf(start),b=src.indexOf(end,a);if(a<0||b<a)throw Error("extract "+start);return src.slice(a,b)}
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const charge=f("charge","cartera_cargo",{monto:35}),payment=f("a","cartera_abono",{monto:10,opId:"pay",motivo:"Abono"}),conflict={...payment,id:"z",datos:{...payment.datos,monto:12}},parts=[{cargoKey:"cargo:charge",monto:10}];
 function setup(csrc,hsrc,initial){
  const facts=JSON.parse(JSON.stringify(initial)),warnings=[],events=[];let inject=null,abort=false,attempts=0,commits=0;
  const w={AMG:{},dispatchEvent:e=>events.push(e.type)};
  let meta={instanceId:"device",contador:0,ultimoHash:"",reloj:{}};
  const publicTodos=async()=>facts.slice(),privateTodos=async()=>{if(inject){facts.push(inject);inject=null}return facts.slice()};
  const db={transaction(){attempts++;const tx={error:null,objectStore(){return {add(hecho){const req={error:null};const shouldAbort=abort;abort=false;Promise.resolve().then(()=>{if(shouldAbort){if(tx.onabort)tx.onabort()}else{facts.push(JSON.parse(JSON.stringify(hecho)));commits++;tx.oncomplete()}});return req}}}};return tx}};
  const src=extract(hsrc,"  function guardar(hecho) {","\n  // Un hecho remoto")+extract(hsrc,"  var _cola = Promise.resolve();","\n  // ---------------------------------------------------------------------------\n  // Lectura");
  const api=new Function("abrirDB","STORE","todos","leerMeta","instanceId","autorActual","calcularHash","guardarMeta","global","CustomEvent","DOMException","console",src+"\nreturn {registrar};")(async()=>db,"hechos",privateTodos,()=>JSON.parse(JSON.stringify(meta)),()=>"device",()=>"tester",async s=>"fixture-"+s.length,m=>{meta=m},w,class{constructor(type,opts){this.type=type;this.detail=opts.detail}},class extends Error{constructor(m,n){super(m);this.name=n}}, {warn:(...x)=>warnings.push(x.join(" "))});
  w.AMG.Hechos={registrar:api.registrar,todos:publicTodos,verificarCadenas:async()=>({ok:true})};new Function("window",csrc)(w);
  return {api:w.AMG.Cartera,facts,warnings,events,inject:h=>inject=h,abort:()=>abort=true,stats:()=>({attempts,commits})};
 }
 async function settle(p){let result={state:"pending"};p.then(v=>{result={state:"resolved",id:v?.id}},e=>{result={state:"rejected",status:e.status??null,message:e.message}});for(let i=0;i<500;i++)await Promise.resolve();return result}
 async function suite(csrc,hsrc){
  const q=setup(csrc,hsrc,[charge,payment]);q.inject(conflict);
  const conflictOutcome=await settle(q.api.aplicarAbono("A","a",parts,[],"alloc"));
  const next=await settle(q.api.registrarMovimiento("B","abono",3,"Abono",{opId:"next"}));
  const p=setup(csrc,hsrc,[charge]);p.abort();
  const first=await settle(p.api.registrarMovimiento("A","abono",10,"Abono",{opId:"retry-pay"}));
  const second=await settle(p.api.registrarMovimiento("A","abono",10,"Abono",{opId:"retry-pay"}));
  const duplicate=await settle(p.api.registrarMovimiento("A","abono",10,"Abono",{opId:"retry-pay"}));
  const balance=p.api.calcularSaldo(p.facts,"A",[]);
  return {conflict:{outcome:conflictOutcome,next,stats:q.stats(),allocationCount:q.facts.filter(h=>h.tipo==="cartera_aplicacion").length},abort:{first,second,duplicate,stats:p.stats(),balance:balance.saldo,receiptCount:p.facts.filter(h=>h.tipo==="cartera_abono").length,opIds:p.facts.filter(h=>h.tipo==="cartera_abono").map(h=>h.datos.opId),events:p.events}};
 }
 const red=await suite(prev,hechos),green=await suite(fixed,fixedHechos);
 if(red.conflict.outcome.status!==null||red.conflict.allocationCount!==0||red.abort.first.state!=="pending"||red.abort.second.state!=="pending"||green.conflict.outcome.status!==409||green.conflict.allocationCount!==0||green.conflict.next.state!=="resolved"||green.abort.first.state!=="rejected"||green.abort.second.state!=="resolved"||green.abort.second.id!==green.abort.duplicate.id||green.abort.balance!==-25||green.abort.receiptCount!==1||green.abort.opIds[0]!=="retry-pay"||green.abort.stats.attempts!==2||green.abort.stats.commits!==1)throw Error(JSON.stringify({red,green}));
 return {red,green,candidate:{cartera:fixed,hechos:fixedHechos},scope:"actual Cartera, guardar, construirYGuardar and registrar; injected synthetic storage, hash and metadata; not native IDB or Sync4"};
}
run(...process.argv.slice(2,8).map(p=>fs.readFileSync(p,'utf8'))).then(({candidate,...r})=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
