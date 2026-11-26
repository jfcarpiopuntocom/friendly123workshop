'use strict';
// node independent-dashboard-snapshot-facts.cjs src/dashboard/dashboard-main.js [--emit]
// Base 344e7a448c097231b0f026ebc0dd4c703110944e
const fs=require('node:fs');
function run(src){
 const a=src.indexOf("  function recibirTrozo("),b=src.indexOf("\n  /* Belén 2026-10-14",a);if(a<0||b<0)throw Error("anchors");
 const original=src.slice(a,b).trimEnd();
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 let fixed=swap(original,"    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones;",`    // Financial facts are immutable and append-only, including from the same peer.
    // Keep prior verified history until a complete compatible snapshot arrives.
    var hechosPreviosVerificados = !!(prevCobertura && prevCobertura.hechosFinancieros === true && prevCobertura.verificacionHechos === 1);
    var hechosNuevosVerificados = !!(nuevaCobertura && nuevaCobertura.hechosFinancieros === true && nuevaCobertura.verificacionHechos === 1);
    var hechosNuevos = fotoTemporal.hechosFinancieros;
    var hechosPorId = new Map(), hechosInvalidos = false;
    if (hechosNuevosVerificados) {
      if (!Array.isArray(hechosNuevos)) hechosInvalidos = true;
      else hechosNuevos.forEach(function(h) {
        if (!h || typeof h.id !== "string" || !h.id || typeof h.hash !== "string" || !h.hash || hechosPorId.has(h.id)) hechosInvalidos = true;
        else hechosPorId.set(h.id,h.hash);
      });
    }
    var hechosDiscrepantes = hechosPreviosVerificados && (!hechosNuevosVerificados || !Array.isArray(datos.hechosFinancieros) ||
      datos.hechosFinancieros.some(function(h) { return !h || !hechosPorId.has(h.id) || hechosPorId.get(h.id) !== h.hash; }));
    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones || hechosDiscrepantes;`);
 fixed=swap(fixed,'if (typeof _fuenteDatosDashboard !== "undefined" && _fuenteDatosDashboard === "remota" && prevCobertura &&\n        ((prevCobertura.ventas === true && (faltaHistorial || faltaLectura)) ||\n         faltaCobertura || cifrasDiscrepantes)) {','if (hechosInvalidos || (typeof _fuenteDatosDashboard !== "undefined" && _fuenteDatosDashboard === "remota" && prevCobertura &&\n        ((prevCobertura.ventas === true && (faltaHistorial || faltaLectura)) ||\n         faltaCobertura || cifrasDiscrepantes))) {');
 const f=(id,hash)=>({id,hash,tipo:"cartera_abono",datos:{monto:10}});
 const p=f("a","hash-a"),q=f("b","hash-b"),r=f("c","hash-c");
 const cov={ventas:true,gastos:true,hechosFinancieros:true,verificacionHechos:1};
 const old={ventas:[{id:"v",cantidad:1}],productos:[],gastos:[],liquidaciones:[],transferencias:[],hechosFinancieros:[p,q],cobertura:cov};
 const cases=[
 ["same-peer-truncated",[p],cov,"A",false],
 ["other-peer-truncated",[p],cov,"B",false],
 ["same-id-different-hash",[p,{...q,hash:"changed"}],cov,"A",false],
 ["legacy-downgrade",[p,q],{ventas:true,gastos:true,hechosFinancieros:true},"A",false],
 ["unknown-version",[p,q],{...cov,verificacionHechos:2},"B",false],
 ["duplicate-fact",[p,q,q],cov,"A",false],
 ["missing-fact-table",null,cov,"A",false],
 ["reorder",[q,p],cov,"B",true],
 ["append",[p,q,r],cov,"B",true],
 ["invalid-coverage",[],{...cov,hechosFinancieros:false},"B",false],
 ["same-peer-sale-edit",[p,q],cov,"A",true],
 ["other-peer-sale-edit",[p,q],cov,"B",false]
 ];
 function suite(code){return cases.map(([name,rows,coverage,peer,accept])=>{
  const prior=JSON.parse(JSON.stringify(old));
  const next={...prior,ventas:[{id:"v",cantidad:name.endsWith("sale-edit")?2:1}],cobertura:coverage};
  if(rows===null)delete next.hechosFinancieros;else next.hechosFinancieros=rows;
  const f=new Function("initial","next","peer",`var datos=initial,editorDeviceId="A",_fuenteDatosDashboard="remota",fotoEnCurso="",fotoFecha="",esperados={},recibidos={},fotoTemporal={},totalTrozos=0,clavesTrozos={},ultimoDato=0,reconexionMs=0,paint=0,pulses=[];var window={OCBusinessReadModel:{stock:()=>({units:0}),expiry:()=>null}},document={documentElement:{lang:"es"}};function $(x){return {}}function pulso(t,s){pulses.push([t,s])}function mostrar(){paint++}
 ${code}
 var keys=Object.keys(next);keys.forEach(function(k,i){recibirTrozo({tabla:k,i:0,total:1,k:i,deTotal:keys.length,fotoId:"new",generadaEn:"2026-11-26T00:00:00Z",filas:k==="cobertura"?[next[k]]:next[k]},peer)});
 return {accepted:paint===1,stale:!!recibirTrozo.sinConciliar,lastPulse:pulses.at(-1),ids:(datos.hechosFinancieros||[]).map(h=>h.id),retained:datos===initial,saleQty:datos.ventas[0].cantidad};`);
  const out=f(prior,next,peer);return {name,expected:accept,...out,pass:out.accepted===accept&&(!accept?out.retained&&out.stale:true)};
 })}
 const red=suite(original),green=suite(fixed);if(red.filter(x=>!x.pass).length!==7||green.some(x=>!x.pass))throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"real receiving function, synthetic chunks, no network/browser; marker is compatibility contract, not attestation",patch:{before:original,after:fixed}};
}
const {patch,...r}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('snapshot-facts-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
