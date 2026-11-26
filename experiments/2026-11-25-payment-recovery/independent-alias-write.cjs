'use strict';
// Workshop-only source-executed test; synthetic storage, not native IDB.
// node independent-alias-write.cjs cartera.js payment-alias-stress.cjs independent-identity-conflict.cjs
const fs=require('node:fs');
async function run(src,harness,prior){
 const replace=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const before=await new Function("require","src","harness",replace(prior.slice(0,prior.indexOf("run(fs.readFileSync")),"return {baseline:{pass:before.pass,red:before.originalFail},candidate:{pass:after.pass,legacy:after.legacy},red,green};","return after.patch.after;")+"\nreturn run(src,harness);")(()=>({}),src,harness);
 let after=replace(before,"conflictosIdentidadExperimental: ambiguous,","conflictosIdentidadExperimental: ambiguous,\n      aliasesIdentidadExperimental: aliases,");
 after=replace(after,'    var abono = r.movimientos.find(function (m) {\n      return m.tipo === "abono" && String(m.id) === String(abonoId);','    _exigirIdentidadClara(r);\n    var canon = _aliasCanonico(r, abonoId);\n    var abono = r.movimientos.find(function (m) {\n      return m.tipo === "abono" && String(m.id) === canon;');
 after=replace(after,"  function _mismaAplicacion(h, clienteId, abonoId, partes) {",`  function _aliasCanonico(r, id) {
    return r.aliasesIdentidadExperimental.get(String(id)) || String(id);
  }
  function _exigirIdentidadClara(r) {
    if (r.conflictosIdentidadExperimental) {
      var e = new Error("cartera: identidad de pago en conflicto");
      e.status = 409; throw e;
    }
  }
  function _mismaAplicacion(h, clienteId, abonoId, partes, r) {`);
 after=replace(after,'String(d.clienteId) === String(clienteId) && String(d.abonoId) === String(abonoId) &&','String(d.clienteId) === String(clienteId) && _aliasCanonico(r, d.abonoId) === _aliasCanonico(r, abonoId) &&');
 after=replace(after,'        if (!_mismaAplicacion(anterior, clienteId, abonoId, partes)) {','        var r = calcularSaldo(lista, clienteId, _ventasActuales(ventas));\n        _exigirIdentidadClara(r);\n        if (!_mismaAplicacion(anterior, clienteId, abonoId, partes, r)) {');
 const t=1790000001000, f=(id,tipo,datos,ts=t)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const c=f("c","cartera_cargo",{monto:35}),p=f("p-b","cartera_abono",{monto:10,opId:"pay",motivo:"payment"}),q={...p,id:"p-a"},wrong={...q,datos:{...q.datos,monto:15}};
 const parts=[{cargoKey:"cargo:c",monto:10}];
 async function suite(code){
  const rows=[];
  async function scenario(name,initial,fn,inject){
   let facts=initial.slice(),writes=0,late=inject;
   const w={AMG:{Hechos:{todos:async()=>facts.slice(),registrar:async(tipo,datos,options)=>{if(late){facts.push(late);late=null}const prev=options?.repetido?.(facts);if(prev)return prev;const h=f("write-"+(++writes),tipo,datos,t+3000);facts.push(h);return h;}}}};
   new Function("window",code)(w);const api=w.AMG.Cartera;
   let error=null,returns=[];try{returns=await fn(api,facts)}catch(e){error={status:e.status??null,message:e.message}}
   const r=api.calcularSaldo(facts,"A",[]);
   rows.push({name,writes,error,returns:returns.map(x=>x?.id),saldo:r.saldo,applied:r.movimientos.filter(m=>m.tipo==="cargo").reduce((n,m)=>n+m.aplicado,0),identity:r.conflictosIdentidadExperimental});
  }
  await scenario("write via noncanonical alias",[c,p,q],async a=>[await a.aplicarAbono("A","p-b",parts,[],"apply")]);
  await scenario("retry after canonical changes",[c,p],async(a,facts)=>{const first=await a.aplicarAbono("A","p-b",parts,[],"apply");facts.push(q);return [first,await a.aplicarAbono("A","p-a",parts,[],"apply")]});
  await scenario("conflict blocks new write",[c,p,wrong],async a=>[await a.aplicarAbono("A","p-b",parts,[],"apply")]);
  await scenario("late conflict inside queue",[c,p],async a=>[await a.aplicarAbono("A","p-b",parts,[],"apply")],wrong);
  await scenario("late alias inside queue",[c,p],async a=>[await a.aplicarAbono("A","p-b",parts,[],"apply")],q);
  await scenario("normal partial 10/35",[c,p],async a=>[await a.aplicarAbono("A","p-b",parts,[],"apply")]);
  return rows;
 }
 const red=await suite(before),green=await suite(after);
 for(const i of [0,1,4,5]){const x=green[i];if(x.error||x.writes!==1||x.saldo!==-25||x.applied!==10)throw Error(JSON.stringify(x));}
 for(const i of [2,3]){const x=green[i];if(x.error?.status!==409||x.writes!==0||x.applied!==0)throw Error(JSON.stringify(x));}
 if(green[1].returns[0]!==green[1].returns[1])throw Error("retry not idempotent");
 return {red,green};
}
run(...process.argv.slice(2,5).map(p=>fs.readFileSync(p,'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
