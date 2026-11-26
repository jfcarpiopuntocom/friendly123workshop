'use strict';
// node integrated-alias-queue-review.cjs cartera.js hechos.js payment-alias-stress.cjs independent-identity-conflict.cjs independent-alias-write.cjs independent-conflict-queue.cjs
const fs=require('node:fs');
async function run(cartera,hechos,harness,prior,alias,queue){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const builder=swap(alias.slice(0,alias.indexOf("run(...process.argv")), '\n const f=(id,tipo,datos,ts=1790000001000)', '\n return fixed;\n const f=(id,tipo,datos,ts=1790000001000)');
 const old=await new Function("require","cartera","harness","prior",builder+"\nreturn run(cartera,harness,prior);")(()=>({}),cartera,harness,prior);
 const q=await new Function("require","hechos",queue.slice(0,queue.indexOf("run(fs.readFileSync"))+"\nreturn run(hechos);")(()=>({}),hechos);
 const fixed=swap(old,'return global.AMG.Hechos.registrar(APLICACION, payload, {\n        repetido:', 'return global.AMG.Hechos.registrar(APLICACION, payload, {\n        propagarConflicto: true,\n        repetido:');
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const charge=f("c","cartera_cargo",{monto:35}),p=f("a","cartera_abono",{monto:10,opId:"p",motivo:"payment"}),aliasP={...p,id:"z"},wrong={...aliasP,datos:{...p.datos,monto:12}},parts=[{cargoKey:"cargo:c",monto:10}];
 async function suite(code,regCode){
  let facts=[charge,p],writes=0,inject=wrong;
  const w={AMG:{Hechos:{todos:async()=>facts.slice(),verificarCadenas:async()=>({ok:true})}}};
  w.AMG.Hechos.registrar=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+regCode+"\nreturn registrar;")(async(tipo,datos,n,opts)=>{if(inject){facts.push(inject);inject=null}const prior=opts?.repetido?.(facts.slice());if(prior)return prior;const h=f("written-"+(++writes),tipo,datos,1790000005000+writes);facts.push(h);return h},{warn:()=>{}});
  new Function("window",code)(w);const api=w.AMG.Cartera;
  let err;try{await api.aplicarAbono("A","a",parts,[],"app")}catch(e){err={status:e.status??null,message:e.message}}
  const conflictWrites=writes;
  facts=[charge,p,aliasP];const first=await api.aplicarAbono("A","z",parts,[],"app2"),retry=await api.aplicarAbono("A","a",parts,[],"app2");
  const balance=api.calcularSaldo(facts,"A",[]);
  return {err,conflictWrites,retrySame:first.id===retry.id,writes,saldo:balance.saldo,applied:balance.movimientos.find(m=>m.tipo==="cargo").aplicado};
 }
 const red=await suite(old,q.original),green=await suite(fixed,q.candidate);
 if(red.err.status!==null||green.err.status!==409||green.conflictWrites!==0||green.writes!==1||!green.retrySame||green.saldo!==-25||green.applied!==10)throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"real Cartera and registrar functions; injected persistence, synthetic ledger",candidate:{cartera:fixed,hechos:swap(hechos,q.original,q.candidate)}};
}
run(...process.argv.slice(2,8).map(p=>fs.readFileSync(p,'utf8'))).then(({candidate,...r})=>{console.log(JSON.stringify(r,null,2));if(process.env.F123_CANDIDATE_DIR){fs.mkdirSync(process.env.F123_CANDIDATE_DIR,{recursive:true});for(const [name,src] of Object.entries(candidate))fs.writeFileSync(require('node:path').join(process.env.F123_CANDIDATE_DIR,name+'.js'),src,{flag:'wx'})}}).catch(e=>{console.error(e);process.exitCode=1});
