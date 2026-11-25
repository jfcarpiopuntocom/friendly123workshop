'use strict';
const fs=require('node:fs');
function experiment(src){
 const start="    var mios = _sinDuplicados(todos.filter(function (h) {";
 const candidate=src.replace(start,`    // EXPERIMENT: exact payment identities only. Never modify original facts.
    var aliases = new Map(), groups = new Map(), ambiguous = 0;
    var sorted = todos.slice().sort(function(a,b){return String(a.id).localeCompare(String(b.id));});
    sorted.forEach(function(h){
      var d=_d(h);
      if(h.tipo!==TIPOS.abono||String(d.clienteId)!==String(clienteId)||!d.opId)return;
      var key=String(d.opId);
      var g=groups.get(key)||[];g.push(h);groups.set(key,g);
    });
    groups.forEach(function(g){
      function fingerprint(h){var d=_d(h);return JSON.stringify([h.tipo,String(d.clienteId),Number(d.monto),d.motivo||'',String(d.ventaId||'')]);}
      if(g.some(function(h){return fingerprint(h)!==fingerprint(g[0]);})){ambiguous++;return;}
      g.slice(1).forEach(function(h){aliases.set(String(h.id),String(g[0].id));});
    });
    todos=todos.filter(function(h){return !aliases.has(String(h.id));}).map(function(h){
      if(h.tipo!==APLICACION)return h;
      var d=_d(h),canonical=aliases.get(String(d.abonoId));
      if(!canonical||String(d.clienteId)!==String(clienteId))return h;
      var copy=Object.assign({},d,{abonoId:canonical});
      return Object.assign({},h,{datos:_anidado(h)?Object.assign({},h.datos,{payload:copy}):copy});
    });
`+start).replace('      (grupos[k] = grupos[k] || []).push(h);','      if (h.tipo === "cartera_abono" && d.opId) k = JSON.stringify(["identified-payment", String(d.opId), String(h.id)]);\n      (grupos[k] = grupos[k] || []).push(h);').replace('conflictosAplicacion: movimientos.conflictosAplicacion || 0,\n      aplicacionesAceptadas:', 'conflictosAplicacion: movimientos.conflictosAplicacion || 0,\n      conflictosIdentidadExperimental: ambiguous,\n      aplicacionesAceptadas:');
 if(candidate===src||!candidate.includes("conflictosIdentidadExperimental: ambiguous"))throw Error("anchor");
 const load=s=>{const w={};new Function("window",s)(w);return w.AMG.Cartera.calcularSaldo};
 const original=load(src),fixed=load(candidate),client="synthetic",t=1790000001000;
 const fact=(id,tipo,d,ts=t)=>({id,tipo,ts,datos:{clienteId:client,...d}});const charge=fact("charge","cartera_cargo",{monto:100,motivo:"charge"},t-1000);
 let seed=19371;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};
 const rows=[];let pass=0,originalFail=0;
 for(let n=0;n<1000;n++){
   const cents=1+rnd()%4999, amount=cents/100, mode=n%5;
   const p=fact("a-1","cartera_abono",{monto:amount,motivo:"payment",opId:"p1"});
   const duplicate={...p,id:"b-1"};const distinct={...duplicate,datos:{payload:{...p.datos,opId:"p2"}}};
   const a=fact("alloc","cartera_aplicacion",{abonoId:"b-1",accion:"aplicar",partes:[{cargoKey:"cargo:charge",monto:amount}],opId:"alloc1"},t+2000);
   const undo=fact("undo","cartera_aplicacion",{abonoId:"b-1",cargoKey:"cargo:charge",monto:0,accion:"desaplicar"},t+3000);
   const fixtures=[[p,duplicate],[p,distinct],[p,duplicate,a],[p,duplicate,a,undo],[p,distinct,a]];
   const facts=[charge,...fixtures[mode]];for(let i=facts.length-1;i>0;i--){let j=rnd()%(i+1);[facts[i],facts[j]]=[facts[j],facts[i]]}
   const expected={saldo:((mode===1||mode===4?2:1)*cents-10000)/100,applied:mode===2||mode===4?amount:0,unassigned:((mode===1||mode===4?2:1)*cents-(mode===2||mode===4?cents:0))/100};
   const snap=JSON.stringify(facts);
   function inspect(calc){const x=calc(facts,client,[]);return {saldo:x.saldo,applied:Math.round(x.movimientos.filter(m=>m.tipo==="cargo").reduce((a,m)=>a+m.aplicado,0)*100)/100,unassigned:Math.round(x.movimientos.filter(m=>m.tipo==="abono").reduce((a,m)=>a+m.sinAsignar,0)*100)/100}}
   const red=inspect(original),green=inspect(fixed);if(JSON.stringify(red)!==JSON.stringify(expected))originalFail++;const ok=JSON.stringify(green)===JSON.stringify(expected)&&JSON.stringify(facts)===snap;if(ok)pass++;else if(rows.length<5)rows.push({n,mode,expected,red,green});
 }
 const p=fact("a-1","cartera_abono",{monto:10,motivo:"payment",opId:"p1"}),q={...p,id:"b-1",datos:{...p.datos,monto:12}};
 const conflict=fixed([charge,p,q],client,[]);const legacy1=fact("l1","cartera_abono",{monto:5,motivo:"legacy"}),legacy2={...legacy1,id:"l2",datos:{payload:legacy1.datos}};const legacy=fixed([charge,legacy1,legacy2],client,[]).saldo;
 return {pass,originalFail,failed:rows,conflictFlag:conflict.conflictosIdentidadExperimental,legacy,patch:{before:src,after:candidate}};
}
const {patch,...result}=experiment(fs.readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(result,null,2));if(result.pass!==1000||result.conflictFlag!==1||result.legacy!==-95)process.exitCode=1;
