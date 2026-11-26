'use strict';
// Workshop only. node independent-restoration-lineage.cjs <base cartera.js> <payment.diff> <effective-sale.cjs> <sale-conflict-guards.cjs> [candidate.js]
const fs=require('node:fs');
function prepare(src,patch,sale,guard){
 const s=new Function("require","src","patch",sale.slice(0,sale.indexOf("const r=experiment(fs.readFileSync"))+"return experiment(src,patch);")(()=>({}),src,patch);
 const g=new Function("require","prior",guard.slice(0,guard.indexOf("const r=guard(fs.readFileSync"))+"return guard(prior);")(()=>({}),s.candidate);
 if(s.rows.some(x=>!x.pass)||s.stress.pass!==1000||g.rows.some(x=>!x.pass))throw Error("prior regression");return g.candidate;
}
function experiment(prior){
 const replace=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 let candidate=replace(prior,'if (v.restauracionDe && !v.anulada) {','if (v.restauracionDe) {');
 // Move sale-key alias remapping after synthetic obligations have been materialized.
 const start=candidate.indexOf('    todos=todos.map(function(h){\n      var d=_d(h);\n      if(h.tipo!==APLICACION||String(d.clienteId)!==String(clienteId))return h;\n      function remap(k)');
 const end=candidate.indexOf('    var centavos = 0;',start);
 if(start<0||end<0)throw Error("remapping anchors");
 const remap=candidate.slice(start,end);candidate=candidate.slice(0,start)+candidate.slice(end);
 const at='    _marcarConsumos(movimientos, todos, clienteId);';
 candidate=replace(candidate,at,`    // Map historical keys to the sole known effective obligation, including synthetic receipts.
    // One pass over projected debts and one pass over sales; never merge ambiguous claims.
    var effectiveClaims=new Map();
    movimientos.forEach(function(m){
      if(m.tipo!=="cargo"||!m.ventaId)return;
      var v=porId[String(m.ventaId)];
      if(!v||String(v.clienteId||"")!==String(clienteId))return;
      var e=_ventaEfectiva(v,restauradaDe,{});
      if(!e||e.anulada||e.devuelta||!e.info||e.info.formaPago!=="fiado"||String(e.clienteId||"")!==String(clienteId))return;
      var id=String(e.id),list=effectiveClaims.get(id)||[];list.push(m);effectiveClaims.set(id,list);
    });
    Object.keys(porId).forEach(function(id){
      var v=porId[id];
      if(String(v.clienteId||"")!==String(clienteId))return;
      var e=_ventaEfectiva(v,restauradaDe,{});
      var claims=e&&effectiveClaims.get(String(e.id));
      if(claims&&claims.length===1&&!claims[0].vinculoManual) saleAliases.set("venta:"+id,claveCargo(claims[0]));
    });
`+remap+at);
 const load=s=>{const w={};new Function("window",s)(w);return w.AMG.Cartera.calcularSaldo};
 const a=load(prior),b=load(candidate),t=1790000001000;
 const f=(id,tipo,datos,ts=t)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const v=(id,extra={})=>({id,clienteId:"A",precioUnit:35,cantidad:1,info:{formaPago:"fiado",fiadoAtomico:true},...extra});
 const c=(id,ventaId)=>f(id,"cartera_cargo",{monto:35,ventaId,opId:"cargo-"+id});
 const p=f("p","cartera_abono",{monto:10,opId:"pay"});
 const app=(key)=>f("app","cartera_aplicacion",{abonoId:"p",accion:"aplicar",partes:[{cargoKey:key,monto:10}],opId:"app"},t+1);
 const undo=(key)=>f("undo","cartera_aplicacion",{abonoId:"p",accion:"desaplicar",cargoKey:key,monto:0},t+2);
 const chain=[v("old",{anulada:true}),v("mid",{anulada:true,restauracionDe:"old"}),v("end",{restauracionDe:"mid"})];
 const cases=[
 ["three generations, old receipt, end allocation",[c("c","old"),p,app("venta:end")],chain,-25,10,0,0],
 ["three generations, final receipt, historical allocation",[c("c","end"),p,app("venta:old")],chain,-25,10,0,0],
 ["three generations, old and final receipts",[c("c","old"),c("d","end"),p,app("venta:mid")],chain,-25,10,0,0],
 ["historical undo",[c("c","end"),p,app("venta:old"),undo("venta:mid")],chain,-25,0,0,0],
 ["ordinary 10/35",[c("c","end"),p,app("venta:end")],[v("end")],-25,10,0,0],
 ["single restoration",[c("c","old"),c("d","end"),p,app("venta:end")],[v("old",{anulada:true}),v("end",{restauracionDe:"old"})],-25,10,0,0],
 ["dead end",[c("c","old")],[v("old",{anulada:true}),v("mid",{anulada:true,restauracionDe:"old"})],0,0,0,0],
 ["ambiguous fork",[c("c","old"),c("d","mid"),c("e","end")],[v("old",{anulada:true}),v("mid",{restauracionDe:"old"}),v("end",{restauracionDe:"old"})],-70,0,1,0],
 ["synthetic obligation historical key",[p,app("venta:old")],chain,-25,10,0,0],
 ["synthetic undo",[p,app("venta:old"),undo("venta:mid")],chain,-25,0,0,0],
 ["foreign historical ID not remapped",[c("c","end"),p,app("venta:old")],[v("old",{anulada:true,clienteId:"B"}),v("end",{restauracionDe:"old"})],-25,0,0,1],
 ["manual overlap guarded",[c("c","end"),c("m",undefined),f("link","cartera_vinculo",{cargoId:"m",ventaId:"end",accion:"vincular"})],chain,-70,0,1,0]
 ];
 const inspect=(calc,fs,vs)=>{const r=calc(fs,"A",vs);return [r.saldo,r.movimientos.filter(m=>m.tipo==="cargo").reduce((n,m)=>n+m.aplicado,0),r.conflictosIdentidadExperimental||0,r.conflictosAplicacion]};
 const rows=cases.map(([name,fs,vs,...expected])=>{const snapshot=JSON.stringify([fs,vs]),before=inspect(a,fs,vs),after=inspect(b,fs,vs),reverse=inspect(b,fs.slice().reverse(),vs.slice().reverse());return {name,expected,before,after,reverse,pass:JSON.stringify(after)===JSON.stringify(expected)&&JSON.stringify(after)===JSON.stringify(reverse)&&snapshot===JSON.stringify([fs,vs])}});
 let seed=52187,pass=0,red=0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};
 for(let n=0;n<1000;n++){const amount=(1+rnd()%10000)/100, paid=(1+rnd()%Math.round(amount*100))/100, count=3+rnd()%6, sales=Array.from({length:count},(_,i)=>v("s"+i,{precioUnit:amount,anulada:i<count-1,...(i?{restauracionDe:"s"+(i-1)}:{})}));const facts=[{...p,datos:{...p.datos,monto:paid}},...(n%2?[{...c("c","s"+(count-1)),datos:{...c("c","s"+(count-1)).datos,monto:amount}}]:[]),{...app("venta:s0"),datos:{...app("venta:s0").datos,partes:[{cargoKey:"venta:s0",monto:paid}]}}];const expected=[Math.round((paid-amount)*100)/100,paid,0,0];if(JSON.stringify(inspect(a,facts,sales))!==JSON.stringify(expected))red++;if(JSON.stringify(inspect(b,facts,sales))===JSON.stringify(expected)&&JSON.stringify(inspect(b,facts.slice().reverse(),sales.slice().reverse()))===JSON.stringify(expected))pass++;}
 return {rows,stress:{seed:52187,pass,red},candidate};
}
const r=experiment(prepare(...process.argv.slice(2,6).map(p=>fs.readFileSync(p,'utf8')))); if(process.argv[6])fs.writeFileSync(process.argv[6],r.candidate); console.log(JSON.stringify({rows:r.rows,stress:r.stress},null,2));if(r.rows.some(x=>!x.pass)||r.stress.pass!==1000)process.exitCode=1;
