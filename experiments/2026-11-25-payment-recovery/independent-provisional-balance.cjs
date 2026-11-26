'use strict';
// node independent-provisional-balance.cjs cartera.js mock-backend.js plan-pagos-ui.js
// pinned base 344e7a448c097231b0f026ebc0dd4c703110944e
const fs=require('node:fs');
async function run(cartera,backend,ui){
 const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor: "+a);return s.replace(a,b)};
 const slice=(s,a,b)=>{let i=s.indexOf(a),j=s.indexOf(b,i+1);if(i<0||j<0)throw Error("slice "+a);return s.slice(i,j)};
 const view=slice(cartera,"  function vistaCarteraSegunRol(","\n  // ---------------------------------------------------------------------------");
 let cv=once(view,'    var esEmpleado = rol === "empleado";','    var esEmpleado = rol === "empleado";\n    var identidadEnConflicto = Number(saldoInfo.conflictosIdentidadExperimental || 0) > 0;');
 cv=once(cv,"      saldo: saldoInfo.saldo,","      saldo: saldoInfo.saldo,\n      saldoProvisional: identidadEnConflicto,\n      conflictosIdentidadExperimental: saldoInfo.conflictosIdentidadExperimental || 0,");
 cv=once(cv,"      consumosPendientes: (saldoInfo.movimientos || []).filter","      consumosPendientes: (identidadEnConflicto ? [] : (saldoInfo.movimientos || [])).filter");
 const wrapper=slice(backend,"  async function _vistaCarteraConVinculos(","\n  }")+"\n  }";
 const route=slice(backend,"      const mCliAplicar = path.match(","      const mCliFiar = path.match(");
 const cr=once(route,"        if (!Array.isArray(info.aplicacionesAceptadas) ||","        if (Number(info.conflictosIdentidadExperimental || 0) > 0) {\n          return J({ error: \"Payment allocation needs review; the account has conflicting movement identities.\", needsReview: true }, 409);\n        }\n        if (!Array.isArray(info.aplicacionesAceptadas) ||");
 const read=slice(ui,'    fetch(API + "/clientes/" + clienteId + "/cartera")','\n\n    q("pp-ab-ok").addEventListener');
 // In the payment modal, don't convert provisional balance to amount due or 'no balance'.
 const cu=once(read,'        var debe = info && info.saldo < 0 ? -info.saldo : 0;','        if (info && info.saldoProvisional) {\n          q("pp-ab-msg").style.color = "#B0183E";\n          q("pp-ab-msg").textContent = es ? "Saldo pendiente de verificación. Revisa el historial antes de asignar el pago." : "Balance pending verification. Review the history before allocating payment.";\n          q("pp-ab-ctx").textContent = "";\n          return;\n        }\n        var debe = info && info.saldo < 0 ? -info.saldo : 0;');
 const makeView=x=>new Function(x+"\nreturn vistaCarteraSegunRol;")();
 const fixture=(flag,saldo=-25)=>({saldo,conflictosIdentidadExperimental:flag,integridad:{ok:true},conflictosAplicacion:0,aplicacionesAceptadas:["allocation-1"],movimientos:[{id:"charge",tipo:"cargo",estado:"parcial",cargoKey:"cargo:charge",motivo:"test",fecha:1,monto:35,pendiente:25},{id:"payment",tipo:"abono",monto:10,quien:"private"}]});
 async function suite(v,r,u){
  const rows=[];
  for(const rol of ["empleado","dueno","admin","contador"]){
   for(const flag of [0,1]){
    const f=fixture(flag),snapshot=JSON.stringify(f),w={AMG:{Cartera:{vistaCarteraSegunRol:makeView(v),opcionesVinculo:async()=>({opciones:[]})}}};
    // Clone because existing owner view annotates projected history objects.
    const wrap=new Function("window","ventas",wrapper+"\nreturn _vistaCarteraConVinculos;")(w,[]);
    const info=await wrap("A",JSON.parse(snapshot),rol);
    rows.push({type:"view",rol,flag,provisional:info.saldoProvisional??null,identity:info.conflictosIdentidadExperimental??null,pending:info.consumosPendientes.length,history:info.historial.length,export:info.puedeExportar,saldo:info.saldo});
   }
  }
  for(const mode of ["clean","conflict-after-commit","already-rejected","throw-409"]){
   let writes=0,logs=0;const f=fixture(mode==="conflict-after-commit"?1:0);
   if(mode==="already-rejected")f.aplicacionesAceptadas=[];
   const w={AMG:{Cartera:{aplicarAbono:async()=>{if(mode==="throw-409"){const e=Error("conflict");e.status=409;throw e;}writes++;return {id:"allocation-1"}},saldoDeCliente:async()=>f}}};
   const call=new Function("window","clientes","ventas","movimientos","mov","_rolLocal","J","_vistaCarteraConVinculos","return async function(path,opts,body){"+r+"\n}") (w,[{id:"A",nombre:"synthetic"}],[],[],()=>{logs++},()=>"dueno",(body,status=200)=>({body,status}),async(_,info,rol)=>makeView(v)(info,rol));
   const out=await call("/api/clientes/A/aplicar",{method:"POST"},{abonoId:"payment",opId:"alloc",partes:[{cargoKey:"cargo:charge",monto:10}]});
   rows.push({type:"route",mode,status:out.status,receipt:out.body.aplicacionId??null,needsReview:out.body.needsReview??false,writes,logs});
  }
  for(const es of [true,false])for(const flag of [0,1])for(const saldo of [-25,0]){
   const f=fixture(flag,saldo),info=makeView(v)(f,"empleado");
   const nodes={};const q=id=>nodes[id]||(nodes[id]={style:{},textContent:"",value:""});let planCalls=0,painted=null;
   const w={AMG:{PlanPagos:{estadoDelPlan:async()=>{planCalls++;return {hayPlan:true,diferencia:-25}}}}};
   const runUI=new Function("fetch","API","clienteId","q","pintarConsumos","es","global","fmt","anterior","pendienteAsignacion","elegidos","var consumosCargados;return "+u.trim()+";") (async()=>({json:async()=>info}),"/api","A",q,x=>{painted=x.length},es,w,x=>"$"+x,null,null,[]);
   await runUI;
   rows.push({type:"modal",es,flag,saldo,planCalls,painted,suggestion:q("pp-ab-monto").value,context:q("pp-ab-ctx").textContent,message:q("pp-ab-msg").textContent});
  }
  return rows;
 }
 const red=await suite(view,route,read),green=await suite(cv,cr,cu);
 const controls=green.filter(x=>x.type==="view").every(x=>x.provisional===(x.flag===1)&&x.identity===x.flag&&x.pending===(x.flag?0:1)&&x.history===(x.rol==="empleado"?0:2)&&x.export===(x.rol!=="empleado")&&x.saldo===-25);
 const routes=green.filter(x=>x.type==="route"),modals=green.filter(x=>x.type==="modal");
 if(!controls||routes[0].status!==200||routes[0].receipt!=="allocation-1"||routes[1].status!==409||routes[1].writes!==1||routes[1].logs!==0||routes[2].status!==409||routes[3].status!==409||routes[3].writes!==0||modals.some(x=>x.flag?(x.planCalls!==0||x.painted!==0||x.suggestion!==""||x.context!==""||!x.message):(x.planCalls!==1||x.painted!==1||x.suggestion!=="25.00")))throw Error(JSON.stringify(green));
 if(red.find(x=>x.mode==="conflict-after-commit").status!==200||red.filter(x=>x.type==="modal"&&x.flag).some(x=>x.planCalls!==1))throw Error("unexpected baseline");
 return {red,green,changes:[{file:"docs/cartera.js",before:view,after:cv},{file:"docs/mock-backend.js",before:route,after:cr},{file:"docs/plan-pagos-ui.js",before:read,after:cu}],scope:"source-executed view, local allocation route and modal promise chain; dependency injection; numeric balance kept for backward compatibility, explicit provisional flag; no browser, IDB, or network"};
}
run(...process.argv.slice(2,5).map(p=>fs.readFileSync(p,'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
