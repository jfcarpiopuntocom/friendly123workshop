'use strict';
// Workshop only: pinned base 344e7a448c097231b0f026ebc0dd4c703110944e; prior harness 0c1533f6.
// node independent-identity-conflict.cjs /path/to/cartera.js /path/to/payment-alias-stress.cjs
const fs=require('node:fs');
async function run(src,harness){
 const footer=harness.indexOf("const {patch,...result}");if(footer<0)throw Error("harness anchor");
 const make=h=>new Function("require","src",h.slice(0,h.indexOf("const {patch,...result}"))+"return experiment(src);")(()=>({}),src);
 const replace=(s,a,b)=>{if(s.split(a).length!==2)throw Error("nonunique anchor "+a);return s.replace(a,b)};
 const before=make(harness);
 let next=replace(harness,'if(h.tipo!==TIPOS.abono||String(d.clienteId)!==String(clienteId)||!d.opId)return;', 'if((h.tipo!==TIPOS.abono&&h.tipo!==TIPOS.cargo)||!d.opId)return;');
 next=replace(next,'groups.forEach(function(g){','groups.forEach(function(g){\n      if(!g.some(function(h){return String(_d(h).clienteId)===String(clienteId);}))return;');
 next=replace(next,'g.slice(1).forEach(function(h){aliases.set(String(h.id),String(g[0].id));});','if(g[0].tipo===TIPOS.abono)g.slice(1).forEach(function(h){aliases.set(String(h.id),String(g[0].id));});');
 // Public balance wrapper must preserve signal; still experimental, not a UI fix.
 next=replace(next, 'if(candidate===src||', 'const withPublicSignal=candidate.replace("conflictosAplicacion: r.conflictosAplicacion,","conflictosAplicacion: r.conflictosAplicacion, conflictosIdentidadExperimental: r.conflictosIdentidadExperimental || 0,");\n if(withPublicSignal===candidate)throw Error("API anchor");\n if(candidate===src||');
 next=replace(next,'fixed=load(candidate)','fixed=load(withPublicSignal)');
 next=replace(next,'after:candidate','after:withPublicSignal');
 const after=make(next);
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const c=f("c","cartera_cargo",{monto:35}),p=f("a","cartera_abono",{monto:10,opId:"p",motivo:"payment"}),q={...p,id:"b"},other={...q,datos:{...q.datos,clienteId:"B"}},wrong={...q,datos:{...q.datos,monto:15}},mixed={...q,tipo:"cartera_cargo"};
 async function adversarial(code){
  const w={AMG:{Hechos:{todos:async()=>[c,p,wrong],verificarCadenas:async()=>({ok:true})}}};new Function("window",code)(w);const api=w.AMG.Cartera,calc=api.calcularSaldo;
  const a=f("app1","cartera_aplicacion",{abonoId:"a",accion:"aplicar",partes:[{cargoKey:"cargo:c",monto:10}],opId:"app1"},1790000003000),b=f("app2","cartera_aplicacion",{abonoId:"b",accion:"aplicar",partes:[{cargoKey:"cargo:c2",monto:10}],opId:"app2"},1790000004000),c2=f("c2","cartera_cargo",{monto:20});
  const summary=x=>({saldo:x.saldo,identity:x.conflictosIdentidadExperimental??null,applications:x.conflictosAplicacion,applied:x.movimientos.filter(m=>m.tipo==="cargo").reduce((n,m)=>n+m.aplicado,0)});
  return {crossClientA:summary(calc([c,p,other],"A",[])),crossClientB:summary(calc([c,p,other],"B",[])),sameClient:summary(calc([c,p,wrong],"A",[])),mixedType:summary(calc([c,p,mixed],"A",[])),publicApi:summary(await api.saldoDeCliente("A",[])),overAllocation:summary(calc([c,c2,p,q,a,b],"A",[])),reversed:summary(calc([c,c2,p,q,a,b].reverse(),"A",[]))};
 }
 const red=await adversarial(before.patch.after),green=await adversarial(after.patch.after);
 if(after.pass!==1000||after.legacy!==-95||after.conflictFlag!==1||green.crossClientA.identity!==1||green.crossClientB.identity!==1||green.publicApi.identity!==1||green.mixedType.identity!==1||green.overAllocation.applied!==10||green.overAllocation.applications!==1||JSON.stringify(green.overAllocation)!==JSON.stringify(green.reversed))throw Error(JSON.stringify(green));
 return {baseline:{pass:before.pass,red:before.originalFail},candidate:{pass:after.pass,legacy:after.legacy},red,green};
}
run(fs.readFileSync(process.argv[2],'utf8'),fs.readFileSync(process.argv[3],'utf8')).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
