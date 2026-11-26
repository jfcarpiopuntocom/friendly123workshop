'use strict';
// node independent-sale-conflict-guards.cjs <candidate.js emitted by independent-effective-sale.cjs> [next.js]
const fs=require('node:fs');
function guard(prior){
 const anchor='    var centavos = 0;\n    var movimientos = mios.map(function (h) {';
 // Add a guard earlier, before effective-sale grouping.
 const start='    var porId = {}, restauradaDe = {};\n    (ventas || []).forEach(function (v) {';
 const end='      if (v.restauracionDe && !v.anulada) restauradaDe[v.restauracionDe] = v;\n    });';
 const replace=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor: "+a);return s.replace(a,b)};
 let candidate=replace(prior,start,'    var porId = {}, restauradaDe = {}, restorationBranches = new Map();\n    (ventas || []).forEach(function (v) {');
 candidate=replace(candidate,end,`      if (v.restauracionDe && !v.anulada) {
        var parent=String(v.restauracionDe), list=restorationBranches.get(parent)||[];
        list.push(v);restorationBranches.set(parent,list);
      }
    });
    restorationBranches.forEach(function(list,parent){
      var unique=new Map();list.forEach(function(v){unique.set(String(v.id),v);});
      if(unique.size===1){restauradaDe[parent]=unique.values().next().value;return;}
      var root=porId[parent];
      if((root&&String(root.clienteId||"")===String(clienteId))||list.some(function(v){return String(v.clienteId||"")===String(clienteId);}))ambiguous++;
      // No arbitrary winner: retain both candidate debts and expose conflict.
    });`);
 // Detect direct/manual overlapping claims before suppression, don't infer equivalence.
 candidate=replace(candidate,'    saleGroups.forEach(function(g){\n      if(g.length<2)return;',`    var manualEffective = new Set();
    mios.forEach(function(h){
      var d=_d(h), id=vinculos[String(h.id)], v=porId[id];
      if(h.tipo!==TIPOS.cargo||d.ventaId||!id||!v||String(v.clienteId||"")!==String(clienteId))return;
      var effective=_ventaEfectiva(v,restauradaDe,{});
      if(effective&& !effective.anulada && !effective.devuelta && effective.info && effective.info.formaPago==="fiado" && String(effective.clienteId||"")===String(clienteId))manualEffective.add(String(effective.id));
    });
    saleGroups.forEach(function(g,key){
      if(manualEffective.has(key)){ambiguous++;return;}
      if(g.length<2)return;`);
 const load=s=>{const w={};new Function("window",s)(w);return w.AMG.Cartera.calcularSaldo};
 const before=load(prior),after=load(candidate),c="A";
 const v=(id,extra={})=>({id,clienteId:c,precioUnit:108,cantidad:1,info:{formaPago:"fiado",fiadoAtomico:true},...extra});
 const f=(id,tipo,datos,ts=1790000001000)=>({id,tipo,ts,datos:{clienteId:c,...datos}});
 const cargo=(id,ventaId)=>f(id,"cartera_cargo",{monto:108,ventaId,opId:"c-"+id});
 const a=cargo("a","old"),b=cargo("b","new"),manual=cargo("m",undefined),link=f("link","cartera_vinculo",{cargoId:"m",ventaId:"old",accion:"vincular"});
 const cases=[
 ["manual direct",[a,manual,link],[v("old")],-216,1],
 ["manual direct plus direct alias",[a,cargo("a2","old"),manual,link],[v("old")],-324,1],
 ["fork",[a,b,cargo("c","other")],[v("old",{anulada:true}),v("new",{restauracionDe:"old"}),v("other",{restauracionDe:"old"})],-216,1],
 ["single restoration",[a,b],[v("old",{anulada:true}),v("new",{restauracionDe:"old"})],-108,0],
 ["direct A05",[a,cargo("a2","old")],[v("old")],-108,0],
 ["separate manual",[a,manual],[v("old")],-216,0]
 ];
 const inspect=(calc,fs,vs)=>{const r=calc(fs,c,vs);return {saldo:r.saldo,conflicts:r.conflictosIdentidadExperimental,charges:r.movimientos.filter(m=>m.tipo==="cargo").map(m=>({id:m.id,key:m.cargoKey,monto:m.monto})).sort((a,b)=>a.id.localeCompare(b.id))}};
 const rows=cases.map(([name,fs,vs,saldo,conflicts])=>{const snap=JSON.stringify([fs,vs]),r=inspect(before,fs,vs),g=inspect(after,fs,vs),rev=inspect(after,fs.slice().reverse(),vs.slice().reverse());return {name,before:r,after:g,reverse:rev,pass:g.saldo===saldo&&g.conflicts===conflicts&&JSON.stringify(g)===JSON.stringify(rev)&&snap===JSON.stringify([fs,vs]),beforePass:r.saldo===saldo&&r.conflicts===conflicts&&JSON.stringify(r)===JSON.stringify(inspect(before,fs.slice().reverse(),vs.slice().reverse()))}});
 return {rows,candidate};
}
const r=guard(fs.readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(r.rows,null,2));if(process.argv[3])fs.writeFileSync(process.argv[3],r.candidate);if(r.rows.some(x=>!x.pass))process.exitCode=1;
