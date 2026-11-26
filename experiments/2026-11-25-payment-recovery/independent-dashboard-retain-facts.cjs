'use strict';
// node independent-dashboard-retain-facts.cjs dashboard-main.js
// base 344e7a448c097231b0f026ebc0dd4c703110944e
const fs=require('node:fs');
function run(src){
 const a=src.indexOf("  function recibirTrozo(p, emisor)"),b=src.indexOf("\n  /* Belén 2026-10-14",a);if(a<0||b<0)throw Error("anchor");
 const original=src.slice(a,b);
 const anchor="    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones;";
 if(original.split(anchor).length!==2)throw Error("anchor");
 const fixed=original.replace(anchor,`    // A later clock or a valid prefix does not imply a superset.
    var perdidaHechos = false;
    if (prevCobertura && prevCobertura.hechosFinancieros === true && prevCobertura.verificacionHechos === 1) {
      var anteriores = Array.isArray(datos.hechosFinancieros) ? datos.hechosFinancieros : [];
      var siguientes = fotoTemporal.hechosFinancieros;
      if (!nuevaCobertura || nuevaCobertura.hechosFinancieros !== true ||
          nuevaCobertura.verificacionHechos !== 1 || !Array.isArray(siguientes)) perdidaHechos = true;
      else {
        var porHecho = new Map();
        siguientes.forEach(function(h) {
          if (!h || typeof h.id !== "string" || !h.id || typeof h.hash !== "string" || !h.hash || porHecho.has(h.id)) perdidaHechos = true;
          else porHecho.set(h.id,h);
        });
        anteriores.forEach(function(h) {
          var nuevo = h && porHecho.get(h.id);
          if (!nuevo || nuevo.hash !== h.hash) perdidaHechos = true;
        });
      }
    }
    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones || perdidaHechos;`);
 const verified={ventas:true,hechosFinancieros:true,verificacionHechos:1};
 const f=(id,hash)=>({id,hash,tipo:"cartera_abono",datos:{monto:10}});
 const x=f("a-1","hash-a"),y=f("b-1","hash-b"),z=f("b-2","hash-c");
 const cases=[["missing-other-author",[x],verified,"B",false],["missing-same-author",[x],verified,"A",false],["changed-hash",[x,{...y,hash:"different"}],verified,"B",false],["duplicate-id",[x,y,y],verified,"B",false],["legacy-proof",[x,y],{ventas:true,hechosFinancieros:true},"B",false],["missing-coverage",[x,y],null,"B",false],["unavailable",[],{ventas:true,hechosFinancieros:false},"A",false],["reordered",[y,x],verified,"B",true],["append",[x,y,z],verified,"B",true],["same-snapshot",[x,y],verified,"A",true]];
 function trial(code,[name,rows,cov,peer,expected]){
  const old={ventas:[],productos:[],hechosFinancieros:[x,y],cobertura:verified};const pulses=[];let rendered=0;
  const init=`var datos=old,fotoEnCurso="",fotoFecha="",esperados={},recibidos={},fotoTemporal={},totalTrozos=0,clavesTrozos={},ultimoDato=0,reconexionMs=0,editorDeviceId="A",_fuenteDatosDashboard="remota";var $=()=>({}),pulso=(...a)=>pulses.push(a),mostrar=()=>mark();var window={OCBusinessReadModel:{stock:()=>({units:0}),expiry:()=>null}};`;
  const fn=new Function("old","pulses","mark",init+code+`\nreturn {receive:recibirTrozo,inspect:()=>({datos,sinConciliar:!!recibirTrozo.sinConciliar,fotoEnCurso,fotoFecha})};`)(old,pulses,()=>rendered++);
  const send=(id,date,parts,emisor)=>parts.forEach(([tabla,filas],k)=>fn.receive({fotoId:id,generadaEn:date,k,deTotal:parts.length,tabla,i:0,total:1,filas},emisor));
  const parts=[["ventas",[]],["hechosFinancieros",rows],["productos",[]]];if(cov)parts.push(["cobertura",[cov]]);
  send("new","2026-11-26T12:00:00Z",parts,peer);const state=fn.inspect();const accepted=rendered===1;
  const preserved=state.datos===old;const stale=pulses.some(p=>p[1]==="viejo");
  let recovery=null;if(!expected){const n=rendered;send("recovery","2026-11-26T11:00:00Z",[["ventas",[]],["hechosFinancieros",[x,y,z]],["productos",[]],["cobertura",[verified]]],"A");recovery=rendered===n+1&&fn.inspect().datos.hechosFinancieros.length===3;}
  return {name,expected,accepted,preserved,stale,recovery,pass:accepted===expected&&(expected||preserved&&stale&&recovery)};
 }
 const red=cases.map(c=>trial(original,c)),green=cases.map(c=>trial(fixed,c));if(green.some(x=>!x.pass)||red.filter(x=>!x.pass).length!==5)throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"exact receiver function, synthetic complete snapshots, hash comparison only; no network or browser",patch:{before:original,after:fixed}};
}
const {patch,...r}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('dashboard-retain-facts-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
