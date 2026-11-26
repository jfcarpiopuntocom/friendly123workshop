'use strict';
// node independent-dashboard-snapshot-recovery.cjs src/dashboard/dashboard-main.js independent-dashboard-snapshot-facts.cjs [--emit]
const fs=require('node:fs');
function run(src,harness){
 const cut=harness.indexOf("\nconst {patch,...r}=run(");if(cut<0)throw Error("harness footer");
 const out=new Function("require","src",harness.slice(0,cut)+"\nreturn run(src);")(()=>({}),src);
 const anchor='    var sello = String(p.fotoId || p.generadaEn || "");';
 if(out.patch.after.split(anchor).length!==2)throw Error("anchor");
 const candidate=out.patch.after.replace(anchor,anchor+'\n    if (sello && sello === fotoEnCurso && fotoTemporal === datos) return;');
 const p={id:"a",hash:"hash-a",tipo:"cartera_abono",datos:{monto:10}},q={id:"b",hash:"hash-b",tipo:"cartera_abono",datos:{monto:12}},r={id:"c",hash:"hash-c",tipo:"cartera_abono",datos:{monto:15}};
 const cov={ventas:true,gastos:true,hechosFinancieros:true,verificacionHechos:1};
 const make=code=>new Function("p","q","r","cov",`var datos={ventas:[{id:"v"}],productos:[],hechosFinancieros:[p,q],cobertura:cov},editorDeviceId="A",_fuenteDatosDashboard="remota",fotoEnCurso="",fotoFecha="",esperados={},recibidos={},fotoTemporal={},totalTrozos=0,clavesTrozos={},ultimoDato=0,reconexionMs=0,paint=0,pulses=[];var window={OCBusinessReadModel:{stock:()=>({units:0}),expiry:()=>null}},document={documentElement:{lang:"es"}};function $(x){return {}}function pulso(t,s){pulses.push([t,s])}function mostrar(){paint++}
 ${code}
 function send(id,ts,rows,peer,partial){var next={ventas:[{id:"v"}],productos:[],hechosFinancieros:rows,cobertura:cov};var keys=Object.keys(next);keys.forEach(function(k,i){if(partial&&k==="hechosFinancieros")return;recibirTrozo({tabla:k,i:0,total:1,k:i,deTotal:keys.length,fotoId:id,generadaEn:ts,filas:k==="cobertura"?[next[k]]:next[k]},peer)});return {ids:datos.hechosFinancieros.map(h=>h.id),stale:!!recibirTrozo.sinConciliar,paint,stamp:fotoFecha}}
 return {bad:send("bad","2026-11-26T23:59:59Z",[p],"B"),partial:send("recovery","2026-11-26T01:00:00Z",[q,p,r],"A",true),good:send("recovery","2026-11-26T01:00:00Z",[q,p,r],"A"),duplicate:send("recovery","2026-11-26T01:00:00Z",[q,p,r],"A"),append:send("next","2026-11-26T01:00:01Z",[q,p,r,{id:"d",hash:"hash-d"}],"A")};`)(p,q,r,cov);
 const red=make(out.patch.before),intermediate=make(out.patch.after),green=make(candidate);
 if(!green.bad.stale||green.bad.paint!==0||green.partial.paint!==0||!green.partial.stale||green.good.stale||green.good.paint!==1||green.good.ids.length!==3||green.duplicate.paint!==1||green.append.paint!==2||green.append.ids.length!==4||red.good.ids.length!==1||intermediate.good.paint!==2||intermediate.duplicate.paint<=2)throw Error(JSON.stringify({red,intermediate,green}));
 // Re-run the original 12-case suite by substituting the candidate at the last invocation.
 const anchor2="const red=suite(original),green=suite(fixed);";if(harness.split(anchor2).length!==2)throw Error("regression anchor");
 const h2=harness.slice(0,cut).replace(anchor2,"const red=suite(original),green=suite(candidate);");
 const regress=new Function("require","src","candidate",h2+"\nreturn run(src);")(()=>({}),src,candidate);
 return {red,intermediate,green,priorRegressionCount:regress.green.length,scope:"real receive closure; simulated packets and two peers; no transport/browser",patch:{before:out.patch.before,after:candidate}};
}
const {patch,...r}=run(...process.argv.slice(2,4).map(p=>fs.readFileSync(p,'utf8')));if(process.argv.includes('--emit'))fs.writeFileSync('snapshot-recovery-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
