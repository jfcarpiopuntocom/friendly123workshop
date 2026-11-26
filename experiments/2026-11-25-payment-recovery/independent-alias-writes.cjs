'use strict';
// Isolated synthetic writer tests. Pinned base 344e7a448c097231b0f026ebc0dd4c703110944e
// node independent-alias-writes.cjs cartera.js payment-alias-stress.cjs independent-identity-conflict.cjs
const fs=require('node:fs');
async function run(src,harness,prior){
 const anchor=" const after=make(next);";
 const cut=prior.indexOf(anchor);if(cut<0)throw Error("prior anchor");
 const start=prior.indexOf("async function run(");
 const original=await new Function("src","harness",prior.slice(start,cut)+" return make(next).patch.after;\n}\nreturn run(src,harness);")(src,harness);
 function rep(s,a,b){if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)}
 let fixed=rep(original,"conflictosIdentidadExperimental: ambiguous,","conflictosIdentidadExperimental: ambiguous,\n      aliasesAbonoExperimental: aliases,");
 fixed=rep(fixed,'    var abono = r.movimientos.find(function (m) {\n      return m.tipo === "abono" && String(m.id) === String(abonoId);','    if (r.conflictosIdentidadExperimental) { var e = new Error("cartera: identidad de movimiento en conflicto"); e.status = 409; throw e; }\n    var canon = r.aliasesAbonoExperimental.get(String(abonoId)) || String(abonoId);\n    var abono = r.movimientos.find(function (m) {\n      return m.tipo === "abono" && String(m.id) === canon;');
 fixed=rep(fixed,"        if (!_mismaAplicacion(anterior, clienteId, abonoId, partes)) {",`        var r = calcularSaldo(lista, clienteId, _ventasActuales(ventas));
        if (r.conflictosIdentidadExperimental) { var e = new Error("cartera: identidad de movimiento en conflicto"); e.status = 409; throw e; }
        var d = _d(anterior), aliases = r.aliasesAbonoExperimental;
        var actual = aliases.get(String(abonoId)) || String(abonoId);
        var previoId = aliases.get(String(d.abonoId)) || String(d.abonoId);
        var comparable = Object.assign({}, anterior, {datos: Object.assign({}, d, {abonoId: previoId})});
        if (!_mismaAplicacion(comparable, clienteId, actual, partes)) {`);
 async function test(code){
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const c=f("c","cartera_cargo",{monto:35}),p=f("a","cartera_abono",{monto:10,opId:"p",motivo:"payment"}),q={...p,id:"b"};
 const parts=[{cargoKey:"cargo:c",monto:10}];
 function env(facts){
 let rows=facts.slice(),writes=0;const w={AMG:{Hechos:{todos:async()=>rows.slice(),registrar:async(tipo,d,opts)=>{const old=opts?.repetido?.(rows.slice());if(old)return old;const h=f("new"+(++writes),tipo,d,1790000005000+writes);rows.push(h);return h;}}}};
 new Function("window",code)(w);return {api:w.AMG.Cartera,rows:()=>rows,writes:()=>writes};
 }
 async function act(fn){try{const r=await fn();return {ok:true,id:r.id}}catch(e){return {ok:false,status:e.status??null,error:e.message}}}
 const e=env([c,p,q]);const alias=await act(()=>e.api.aplicarAbono("A","b",parts,[],"app"));const replay=await act(()=>e.api.aplicarAbono("A","a",parts,[],"app"));const over=await act(()=>e.api.aplicarAbono("A","a",parts,[],"different"));
 const calc=e.api.calcularSaldo(e.rows(),"A",[]);
 const e2=env([c,p,{...q,datos:{...q.datos,monto:15}}]);const conflict=await act(()=>e2.api.aplicarAbono("A","a",parts,[],"app"));
 const e3=env([c,p,q]);const normal=await act(()=>e3.api.aplicarAbono("A","a",[{cargoKey:"cargo:c",monto:5}],[],"app"));const r3=e3.api.calcularSaldo(e3.rows(),"A",[]);
 return {alias,replay,over,writes:e.writes(),saldo:calc.saldo,applied:calc.movimientos.find(m=>m.tipo==="cargo").aplicado,conflict,conflictWrites:e2.writes(),normal,partial:r3.movimientos.find(m=>m.tipo==="cargo").pendiente,partialSaldo:r3.saldo};
 }
 const red=await test(original),green=await test(fixed);
 if(red.alias.ok||!red.conflict.ok||!green.alias.ok||!green.replay.ok||green.replay.id!==green.alias.id||green.over.ok||green.writes!==1||green.saldo!==-25||green.applied!==10||green.conflict.ok||green.conflict.status!==409||green.conflictWrites!==0||!green.normal.ok||green.partial!==30||green.partialSaldo!==-25)throw Error(JSON.stringify({red,green}));
 return {red,green};
}
run(...process.argv.slice(2,5).map(p=>fs.readFileSync(p,'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
