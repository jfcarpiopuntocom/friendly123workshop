'use strict';
const fs=require('node:fs');
function experiment(source){
 const get=x=>{const w={};new Function("window",x)(w);return w.AMG.Cartera.calcularSaldo};
 const calc=get(source);
 const anchor="    var mios = _sinDuplicados(todos.filter(function (h) {";
 const candidate=source.replace(anchor,`    // EXPERIMENT ONLY: illustrate why dedup alone is insufficient.\n    var seen = new Set();\n    todos = todos.slice().sort(function(a,b){return String(a.id).localeCompare(String(b.id));}).filter(function(h){\n      var d=_d(h);if(h.tipo!==TIPOS.abono||!d.opId)return true;\n      var k=JSON.stringify([h.tipo,d.clienteId,d.opId,d.monto,d.motivo||'',d.ventaId||'']);\n      if(seen.has(k))return false;seen.add(k);return true;\n    });\n`+anchor);
 if(candidate===source)throw Error("anchor");
 const simple=get(candidate);const ts=1790000001000;const client="synthetic";const h=(id,tipo,datos,t=ts)=>({id,tipo,ts:t,datos:{clienteId:client,...datos}});
 const c=h("charge","cartera_cargo",{monto:35,motivo:"charge"},ts-1000);
 const p=h("a-1","cartera_abono",{monto:10,motivo:"payment",opId:"same-pay"});const q={...p,id:"b-1"};
 const alloc=(id,abonoId,monto,cargoKey,opId)=>h(id,"cartera_aplicacion",{abonoId,accion:"aplicar",partes:[{cargoKey,monto}],opId},ts+2000);
 const a=alloc("alloc-b","b-1",10,"cargo:charge","allocation-x");
 const d=h("charge2","cartera_cargo",{monto:15,motivo:"charge2"},ts-1000);
 const b=alloc("alloc-a","a-1",10,"cargo:charge2","allocation-y");
 function summarize(c,fs){const before=JSON.stringify(fs),r=c(fs,client,[]);return {saldo:r.saldo,allocated:r.movimientos.filter(m=>m.tipo==="cargo").reduce((n,m)=>n+m.aplicado,0),unassigned:r.movimientos.filter(m=>m.tipo==="abono").reduce((n,m)=>n+m.sinAsignar,0),conflicts:r.conflictosAplicacion,unchanged:before===JSON.stringify(fs)}}
 const rows=[["duplicate with allocation to secondary receipt",[c,p,q,a],{saldo:-25,allocated:10,unassigned:0}],["duplicate allocated independently to two charges",[c,d,p,q,a,b],{saldo:-40,allocated:10,unassigned:0}],["distinct legitimate payments and allocation",[c,p,{...q,datos:{...q.datos,opId:"other-pay"}},a],{saldo:-15,allocated:10,unassigned:10}]].map(([name,fs,expected])=>({name,expected,original:summarize(calc,fs),naive:summarize(simple,fs)}));
 return rows;
}
const source=fs.readFileSync(process.argv[2],'utf8');
console.log(JSON.stringify(experiment(source),null,2));
