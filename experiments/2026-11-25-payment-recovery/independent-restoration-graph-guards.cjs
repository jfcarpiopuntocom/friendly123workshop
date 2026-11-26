'use strict';
// Workshop only. node independent-restoration-graph-guards.cjs <candidate.js emitted by independent-restoration-lineage.cjs> [next.js]
const fs=require('node:fs');
function experiment(prior){
 const start=prior.indexOf("    var porId = {}, restauradaDe = {}, restorationBranches = new Map();"),end=prior.indexOf("    // Workshop: known direct",start);
 if(start<0||end<0)throw Error("anchors");
 const block=`    var porId = Object.create(null), restauradaDe = Object.create(null), restorationBranches = new Map();
    var saleRows=new Map(), rejectedSaleIds=new Set();
    function owner(v){return String(v&&v.clienteId||"");}
    function relevant(v){return JSON.stringify([owner(v),String(v.restauracionDe||""),!!v.anulada,!!v.devuelta,
      Number(v.precioUnit)||0,Number(v.cantidad)||0,v.info&&v.info.formaPago||"",!!(v.info&&v.info.fiadoAtomico===true),
      Number(new Date(v.fecha).getTime())||0]);}
    (ventas||[]).forEach(function(v){
      if(!v||!v.id)return;
      var id=String(v.id),list=saleRows.get(id)||[];list.push(v);saleRows.set(id,list);
    });
    saleRows.forEach(function(list,id){
      if(list.some(function(v){return relevant(v)!==relevant(list[0]);})){
        rejectedSaleIds.add(id);
        if(list.some(function(v){return owner(v)===String(clienteId);}))ambiguous++;
        return;
      }
      porId[id]=list[0];
    });
    Object.keys(porId).forEach(function(id){
      var v=porId[id],parent=String(v.restauracionDe||"");if(!parent)return;
      var root=porId[parent];
      if(rejectedSaleIds.has(parent)||(root&&owner(root)&&owner(v)&&owner(root)!==owner(v))){
        if(owner(v)===String(clienteId)||owner(root)===String(clienteId))ambiguous++;
        return;
      }
      var list=restorationBranches.get(parent)||[];list.push(v);restorationBranches.set(parent,list);
    });
    restorationBranches.forEach(function(list,parent){
      if(list.length===1){restauradaDe[parent]=list[0];return;}
      var root=porId[parent];
      if(owner(root)===String(clienteId)||list.some(function(v){return owner(v)===String(clienteId);}))ambiguous++;
    });
    var done=new Set();
    Object.keys(porId).forEach(function(id){
      var path=[],seen=new Map(),next=id;
      while(next&&!done.has(next)&&porId[next]&&restauradaDe[next]){
        if(seen.has(next)){
          var cycle=path.slice(seen.get(next));
          if(cycle.some(function(k){return owner(porId[k])===String(clienteId);}))ambiguous++;
          cycle.forEach(function(k){delete restauradaDe[k];});
          break;
        }
        seen.set(next,path.length);path.push(next);next=String(restauradaDe[next].id);
      }
      path.forEach(function(k){done.add(k);});
    });
`;
 const candidate=prior.slice(0,start)+block+prior.slice(end);
 const load=s=>{const w={};new Function("window",s)(w);return w.AMG.Cartera.calcularSaldo};
 const a=load(prior),b=load(candidate);
 const v=(id,extra={})=>({id,clienteId:"A",precioUnit:35,cantidad:1,info:{formaPago:"fiado",fiadoAtomico:true},...extra});
 const f=(id,tipo,datos)=>({id,tipo,ts:1790000001000,datos:{clienteId:"A",...datos}});
 const c=f("c","cartera_cargo",{monto:35,ventaId:"old",opId:"c"}),p=f("p","cartera_abono",{monto:10,opId:"p"}),app=f("a","cartera_aplicacion",{abonoId:"p",accion:"aplicar",partes:[{cargoKey:"venta:old",monto:10}],opId:"a"});
 const chain=[v("old",{anulada:true}),v("mid",{anulada:true,restauracionDe:"old"}),v("end",{restauracionDe:"mid"})];
 const cases=[
 ["duplicate ID contradictory price",[c,p,app],[v("old"),v("old",{precioUnit:99})],-25,10,1,0],
 ["duplicate ID identical sale",[c,p,app],[v("old"),v("old")],-25,10,0,0],
 ["cross-customer intermediate",[c,p,app],[v("old",{anulada:true}),v("mid",{anulada:true,restauracionDe:"old",clienteId:"B"}),v("end",{restauracionDe:"mid"})],-25,0,2,1],
 ["cycle",[c,p,app],[v("old",{anulada:true,restauracionDe:"mid"}),v("mid",{anulada:true,restauracionDe:"old"})],10,0,1,1],
 ["linear history",[c,p,app],chain,-25,10,0,0],
 ["synthetic historical allocation",[p,app],chain,-25,10,0,0],
 ["ordinary 10/35",[c,p,app],[v("old")],-25,10,0,0],
 ["true fork",[c,p,app],[v("old",{anulada:true}),v("mid",{restauracionDe:"old"}),v("end",{restauracionDe:"old"})],-60,0,1,1],
 ["closed sibling conservative conflict",[c,p,app],[v("old",{anulada:true}),v("dead",{anulada:true,restauracionDe:"old"}),v("live",{restauracionDe:"old"})],-25,0,1,1]
 ];
 const inspect=(calc,fs,vs)=>{const r=calc(fs,"A",vs);return [r.saldo,r.movimientos.filter(m=>m.tipo==="cargo").reduce((n,m)=>n+m.aplicado,0),r.conflictosIdentidadExperimental||0,r.conflictosAplicacion]};
 const rows=cases.map(([name,fs,vs,...expected])=>{const snapshot=JSON.stringify([fs,vs]),before=inspect(a,fs,vs),beforeReverse=inspect(a,fs.slice().reverse(),vs.slice().reverse()),after=inspect(b,fs,vs),reverse=inspect(b,fs.slice().reverse(),vs.slice().reverse());return {name,expected,before,beforeReverse,after,reverse,pass:JSON.stringify(after)===JSON.stringify(expected)&&JSON.stringify(after)===JSON.stringify(reverse)&&snapshot===JSON.stringify([fs,vs])}});
 return {rows,candidate};
}
const r=experiment(fs.readFileSync(process.argv[2],'utf8'));if(process.argv[3])fs.writeFileSync(process.argv[3],r.candidate);console.log(JSON.stringify(r.rows,null,2));if(r.rows.some(x=>!x.pass))process.exitCode=1;
