'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function audit(calc){
 const t=1790000000000,client="synthetic";
 const h=(id,tipo,monto,opId,ts,extra={})=>({id,tipo,ts,datos:{clienteId:client,monto,motivo:tipo,opId,...extra}});
 const charge=h("a-1","cartera_cargo",35,"charge-x",t),p=h("a-2","cartera_abono",10,"customer-payment:same-0001",t+1000),q=h("b-1","cartera_abono",10,"customer-payment:same-0001",t+1000),q2=h("b-1","cartera_abono",10,"customer-payment:diff-0002",t+1000),nested={...q2,datos:{payload:q2.datos}};
 const v={id:"sale-synthetic",clienteId:client,fecha:"2026-11-25",cantidad:1,precioUnit:108,info:{formaPago:"fiado",fiadoAtomico:true}},c1=h("a-3","cartera_cargo",108,"sale-a",t,{ventaId:v.id}),c2=h("b-2","cartera_cargo",108,"sale-b",t+1,{ventaId:v.id});
 const cs=[350,1500,10800,1800,300].map((n,i)=>({id:"c"+i,tipo:"cartera_cargo",ts:Date.UTC(2026,8,22+i),datos:{clienteId:client,monto:n/100,motivo:"fixture "+i}})),pay=h("p","cartera_abono",39.5,"customer-payment:synthetic-0001",Date.UTC(2026,9,6)),sales=[{id:"sale-last",clienteId:client,fecha:"2026-11-25T21:12:42Z",cantidad:1,precioUnit:18,info:{formaPago:"fiado",fiadoAtomico:true}}],facts=[...cs,pay];
 const alloc={id:"alloc",tipo:"cartera_aplicacion",ts:Date.UTC(2026,10,25),datos:{clienteId:client,abonoId:"p",accion:"aplicar",opId:"customer-allocation:synthetic-0001",partes:[0,1,3,4].map(i=>({cargoKey:"cargo:c"+i,monto:cs[i].datos.monto}))}};
 return [
 ["A01 partial payment 10/35",[charge,p],[],-25],
 ["A02 same opId different fact IDs",[charge,p,q],[],-25],
 ["A03 distinct opIds same value",[charge,p,q2],[],-15],
 ["A04 distinct opIds mixed nested/flat",[charge,p,nested],[],-15],
 ["A05 same linked sale two receipt IDs",[c1,c2],[v],-108],
 ["A06 receipt not duplicated by atomic sale",[c1],[v],-108],
 ["A07 observed balance unallocated",facts,sales,-126,39.5],
 ["A08 allocate existing payment",[...facts,alloc],sales,-126,0],
 ["A09 duplicate allocation replay",[...facts,alloc,{...alloc,id:"alloc-replay"}],sales,-126,0],
 ["A10 counterfactual disputed charge absent",facts.filter(x=>x.id!=="c2"),sales,-18,39.5]
 ].map(([name,fs,vs,expected,unassigned])=>{const before=JSON.stringify({fs,vs});const r=calc(fs,client,vs),actualUnassigned=r.movimientos.filter(m=>m.tipo==="abono").reduce((n,m)=>n+m.sinAsignar,0),unchanged=JSON.stringify({fs,vs})===before;return {name,expected,actual:r.saldo,expectedUnassigned:unassigned,actualUnassigned,unchanged,pass:r.saldo===expected&&(unassigned===undefined||actualUnassigned===unassigned)&&unchanged,movements:r.movimientos.map(m=>({id:m.id,monto:m.monto,estado:m.estado,pendiente:m.pendiente,sinAsignar:m.sinAsignar}))}});
}
const file=process.argv[2];if(!file)throw Error('Usage: node audit-cartera.cjs /path/to/docs/cartera.js');
const w={};vm.runInNewContext(fs.readFileSync(path.resolve(file),'utf8'),{window:w},{filename:file});
const report=audit(w.AMG.Cartera.calcularSaldo);console.log(JSON.stringify(report,null,2));process.exitCode=report.some(x=>!x.pass)?1:0;
