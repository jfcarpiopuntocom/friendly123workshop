'use strict';
// node independent-dashboard-fact-retention.cjs dashboard-main.js
// pinned base 344e7a448c097231b0f026ebc0dd4c703110944e
const fs=require('node:fs');
function run(src){
 const a=src.indexOf("  function recibirTrozo("),b=src.indexOf("\n  /* Belén",a);if(a<0||b<0)throw Error("source anchors");
 const original=src.slice(a,b);
 const anchor="    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones;";
 if(original.split(anchor).length!==2)throw Error("unique anchor");
 const fixed=original.replace(anchor,`    // A verified financial journal is append-only. Newer wall clock is not proof of a superset.
    var hechosPrevios = datos && datos.hechosFinancieros;
    var hechosNuevos = fotoTemporal.hechosFinancieros;
    var prevVerificada = prevCobertura && prevCobertura.hechosFinancieros === true && prevCobertura.verificacionHechos === 1;
    var nuevaVerificada = nuevaCobertura && nuevaCobertura.hechosFinancieros === true && nuevaCobertura.verificacionHechos === 1;
    var perdidaHechos = false;
    if (prevVerificada) {
      if (!nuevaVerificada || !Array.isArray(hechosPrevios) || !Array.isArray(hechosNuevos)) perdidaHechos = true;
      else {
        var nuevosPorId = new Map();
        hechosNuevos.forEach(function(h) {
          if (!h || typeof h.id !== "string" || !h.id || typeof h.hash !== "string" || !h.hash || nuevosPorId.has(h.id)) perdidaHechos = true;
          else nuevosPorId.set(h.id, h.hash);
        });
        hechosPrevios.forEach(function(h) {
          if (!h || !nuevosPorId.has(h.id) || nuevosPorId.get(h.id) !== h.hash) perdidaHechos = true;
        });
      }
    }
    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones || perdidaHechos;`);
 const fact=(id,hash)=>({id,hash,tipo:"cartera_abono",datos:{monto:10}});
 const f1=fact("A-1","hash1"),f2=fact("A-2","hash2"),f3=fact("B-1","hash3");
 const cov={ventas:true,hechosFinancieros:true,verificacionHechos:1};
 const cases=[
 ["superset",[f1,f2,f3],cov,"B",true],
 ["reorder",[f2,f1],cov,"B",true],
 ["missing-from-peer",[f1],cov,"B",false],
 ["missing-same-peer",[f1],cov,"A",false],
 ["changed-hash",[f1,{...f2,hash:"different"}],cov,"B",false],
 ["legacy-proof",[f1,f2],{ventas:true,hechosFinancieros:true},"B",false],
 ["duplicate-id",[f1,f2,f2],cov,"B",false],
 ["missing-table",undefined,cov,"B",false],
 ["explicit-incomplete",[],{ventas:true,hechosFinancieros:false},"B",false]
 ];
 function suite(code){return cases.map(([name,rows,coverage,sender,expected])=>{
   const initial={ventas:[{id:"s"}],productos:[],hechosFinancieros:[f1,f2],cobertura:cov};
   const input=JSON.stringify({initial,rows,coverage});
   const f=new Function("initial","rows","coverage","sender",`var datos=initial, editorDeviceId="A", _fuenteDatosDashboard="remota", fotoEnCurso="",fotoFecha="",esperados={},recibidos={},fotoTemporal={},totalTrozos=0,clavesTrozos={},ultimoDato=0,reconexionMs=0;
    var paints=0,pulses=[],window={OCBusinessReadModel:{stock:()=>({units:0}),expiry:()=>null}},document={documentElement:{lang:"es"}};
    function $(id){return {textContent:""}} function pulso(t,s){pulses.push({t,s})} function mostrar(){paints++}
    ${code}
    var tables=[["ventas",[{id:"s"}]],["productos",[]],["cobertura",[coverage]]];
    if(rows!==undefined)tables.push(["hechosFinancieros",rows]);
    function send(tables,id,date,sender){tables.forEach(function(t,k){recibirTrozo({fotoId:id,generadaEn:date,k,deTotal:tables.length,tabla:t[0],i:0,total:1,filas:t[1]},sender)})}
    send(tables,"new","2026-11-26T01:00:00Z",sender);
    var first={accepted:paints===1,stale:recibirTrozo.sinConciliar===true,oldKept:datos===initial,cursor:fotoEnCurso};
    if(first.stale)send([["ventas",[{id:"s"}]],["productos",[]],["cobertura",[initial.cobertura]],["hechosFinancieros",[...initial.hechosFinancieros,{id:"C-1",hash:"hash4",tipo:"cartera_abono"}]]],"recovery","2026-11-26T00:59:00Z","C");
    return {...first,recovered:first.stale?paints===1&&datos.hechosFinancieros.length===3:null,pulses};`);
   const r=f(initial,rows,coverage,sender);return {name,expected,...r,pass:r.accepted===expected&&(expected||r.stale&&r.oldKept&&r.recovered),unchanged:JSON.stringify({initial,rows,coverage})===input};
 })}
 const red=suite(original),green=suite(fixed);
 if(green.some(x=>!x.pass||!x.unchanged)||red.filter(x=>!x.pass).length!==6)throw Error(JSON.stringify({red,green}));
 return {red,green,patch:{before:original,after:fixed},scope:"exact receiver source, synthetic packets and DOM; prior remote verified snapshot, no network or browser; hash equality not re-verification"};
}
const {patch,...r}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('dashboard-fact-retention-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
