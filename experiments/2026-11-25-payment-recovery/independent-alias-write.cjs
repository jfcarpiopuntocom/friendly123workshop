'use strict';
// Node 22+: node independent-alias-write.cjs cartera.js payment-alias-stress.cjs independent-identity-conflict.cjs
// Inputs pinned: product 344e7a448c097231b0f026ebc0dd4c703110944e, workshop harness 0c1533f6, prior 8c57231c149d6e1b1902f27147023dc3103c963c.
const fs=require('node:fs');
async function run(src,harness,prior){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor: "+a);return s.replace(a,b)};
 const build=swap(prior.slice(0,prior.indexOf("run(fs.readFileSync"))," const f=(id,tipo,datos,ts=1790000001000)"," return after.patch.after;\n const f=(id,tipo,datos,ts=1790000001000)");
 const old=await new Function("require","src","harness",build+"\nreturn run(src,harness);")(()=>({}),src,harness);
 let fixed=swap(old,"conflictosIdentidadExperimental: ambiguous,","conflictosIdentidadExperimental: ambiguous,\n      aliasesAbonoExperimental: aliases,");
 fixed=swap(fixed,"    var abono = r.movimientos.find(function (m) {\n      return m.tipo === \"abono\" && String(m.id) === String(abonoId);","    if (r.conflictosIdentidadExperimental) { var e = new Error('cartera: identidad de movimiento en conflicto'); e.status = 409; throw e; }\n    var canon = r.aliasesAbonoExperimental.get(String(abonoId)) || String(abonoId);\n    var abono = r.movimientos.find(function (m) {\n      return m.tipo === \"abono\" && String(m.id) === canon;");
 fixed=swap(fixed,"        if (!_mismaAplicacion(anterior, clienteId, abonoId, partes)) {","        var proy = calcularSaldo(lista, clienteId, _ventasActuales(ventas));\n        if (proy.conflictosIdentidadExperimental) { var e = new Error('cartera: identidad de movimiento en conflicto'); e.status = 409; throw e; }\n        var canon = function(id) { return proy.aliasesAbonoExperimental.get(String(id)) || String(id); };\n        var dAnterior = _d(anterior);\n        var previoNormal = Object.assign({}, anterior, { datos: Object.assign({}, dAnterior, { abonoId: canon(dAnterior.abonoId) }) });\n        if (!_mismaAplicacion(previoNormal, clienteId, canon(abonoId), partes)) {");
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const cargo=f("charge","cartera_cargo",{monto:35}),p=f("a","cartera_abono",{monto:10,opId:"pay",motivo:"payment"}),q={...p,id:"z"},conflict={...q,datos:{...q.datos,monto:12}},parts=[{cargoKey:"cargo:charge",monto:10}];
 async function suite(code){
  const cases=[];
  async function check(name,initial,body){
   let facts=JSON.parse(JSON.stringify(initial)),writes=0,before=JSON.stringify(facts),inject=null;
   const w={AMG:{Hechos:{todos:async()=>facts.slice(),registrar:async(tipo,datos,opts)=>{if(inject){facts.push(inject);inject=null}const old=opts?.repetido?.(facts.slice());if(old)return old;const h=f("write-"+(++writes),tipo,datos,1790000005000+writes);facts.push(h);return h},verificarCadenas:async()=>({ok:true})}}};new Function("window",code)(w);const api=w.AMG.Cartera;
   let out;try{out=await body({api,facts,inject:h=>{inject=h}})}catch(e){out={error:e.message,status:e.status||null}}
   const r=api.calcularSaldo(facts,"A",[]);cases.push({name,out,writes,saldo:r.saldo,applied:r.movimientos.find(m=>m.tipo==="cargo")?.aplicado,conflicts:r.conflictosAplicacion,identity:r.conflictosIdentidadExperimental,originalFactsPreserved:JSON.stringify(facts.slice(0,initial.length))===before});
  }
  await check("alias-write",[cargo,p,q],async({api})=>({id:(await api.aplicarAbono("A","z",parts,[],"apply")).id}));
  await check("alias-retry",[cargo,p,q],async({api})=>{const a=await api.aplicarAbono("A","a",parts,[],"apply");const b=await api.aplicarAbono("A","z",parts,[],"apply");return {same:a.id===b.id}});
  await check("canonical-changes-on-receive",[cargo,q],async({api,facts})=>{const a=await api.aplicarAbono("A","z",parts,[],"apply");facts.push(p);const b=await api.aplicarAbono("A","a",parts,[],"apply");return {same:a.id===b.id}});
  await check("conflict-before-write",[cargo,p,conflict],async({api})=>({id:(await api.aplicarAbono("A","a",parts,[],"apply")).id}));
  await check("conflict-inside-queue",[cargo,p],async({api,inject})=>{inject(conflict);return {id:(await api.aplicarAbono("A","a",parts,[],"apply")).id}});
  await check("alias-undo",[cargo,p,q],async({api})=>{await api.aplicarAbono("A","a",parts,[],"apply");await api.desaplicarAbono("A","z","cargo:charge");return {ok:true}});
  return cases;
 }
 const red=await suite(old),green=await suite(fixed);
 const [a,b,c,d,e,g]=green;
 if(a.writes!==1||a.applied!==10||a.saldo!==-25||b.out.same!==true||b.writes!==1||c.out.same!==true||c.writes!==1||d.out.status!==409||d.writes!==0||e.out.status!==409||e.writes!==0||g.applied!==0||g.saldo!==-25||g.writes!==2||green.some(x=>!x.originalFactsPreserved))throw Error(JSON.stringify(green));
 if(!red[0].out.error||red[1].out.status!==409||red[2].out.status!==409||red[3].writes!==1||red[4].writes!==1)throw Error("unexpected baseline "+JSON.stringify(red));
 return {red,green,scope:"actual Cartera functions; mocked Hechos transaction queue; synthetic facts only"};
}
run(...process.argv.slice(2,5).map(p=>fs.readFileSync(p,'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
