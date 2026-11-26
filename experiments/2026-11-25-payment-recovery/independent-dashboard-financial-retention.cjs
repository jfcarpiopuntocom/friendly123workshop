'use strict';
// node independent-dashboard-financial-retention.cjs dashboard-main.js [--emit]
// base 344e7a448c097231b0f026ebc0dd4c703110944e
const fs=require('node:fs');
function run(src){
 const a=src.indexOf("  function recibirTrozo("),b=src.indexOf("  /* Belén 2026-10-14",a);if(a<0||b<0)throw Error("anchor");
 const original=src.slice(a,b).trimEnd();
 const anchor="    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones;";
 if(original.split(anchor).length!==2)throw Error("anchor");
 const fixed=original.replace(anchor,`    // Experimental: financial facts are append-only. A newer clock cannot
    // justify disappearance or mutation of an already verified fact.
    var perdidaHechos = false;
    if (prevCobertura && prevCobertura.hechosFinancieros === true && prevCobertura.verificacionHechos === 1) {
      var prevHechos = Array.isArray(datos.hechosFinancieros) ? datos.hechosFinancieros : [];
      var nuevosHechos = fotoTemporal.hechosFinancieros;
      var mapaHechos = Object.create(null);
      perdidaHechos = !nuevaCobertura || nuevaCobertura.hechosFinancieros !== true ||
        nuevaCobertura.verificacionHechos !== 1 || !Array.isArray(nuevosHechos);
      if (!perdidaHechos) {
        nuevosHechos.forEach(function(h) {
          if (!h || typeof h.id !== "string" || !h.id || typeof h.hash !== "string" || !h.hash ||
              Object.prototype.hasOwnProperty.call(mapaHechos,h.id)) { perdidaHechos = true; return; }
          mapaHechos[h.id] = h.hash;
        });
        perdidaHechos = perdidaHechos || prevHechos.some(function(h) {
          return !h || !Object.prototype.hasOwnProperty.call(mapaHechos,h.id) || mapaHechos[h.id] !== h.hash;
        });
      }
    }
    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones || perdidaHechos;`);
 const h=(id,hash)=>({id,hash,tipo:"cartera_abono",datos:{monto:10}});
 const f=h("A-1","hash-a"),g=h("B-1","hash-b"),n=h("A-2","hash-c");
 const coverage={ventas:true,hechosFinancieros:true,verificacionHechos:1};
 const cases=[
 ["missing-author",[f],coverage,"B",false],
 ["missing-same-source",[f],coverage,"A",false],
 ["mutated-hash",[f,{...g,hash:"different"}],coverage,"B",false],
 ["duplicate-id",[f,g,g],coverage,"B",false],
 ["legacy-downgrade",[f,g],{ventas:true,hechosFinancieros:true},"B",false],
 ["missing-facts-table",null,coverage,"B",false],
 ["append",[f,g,n],coverage,"B",true],
 ["reorder",[g,f],coverage,"B",true],
 ["same-source-append",[f,g,n],coverage,"A",true],
 ["coverage-false",[f],{ventas:true,hechosFinancieros:false},"B",false]
 ];
 function exercise(code,rows,cv,source){
  const initial={ventas:[{id:"sale"}],productos:[],hechosFinancieros:[f,g],cobertura:coverage};
  const driver=new Function("initial","codeUnused",`var datos=initial,editorDeviceId="A",_fuenteDatosDashboard="remota",fotoEnCurso="",fotoFecha="",esperados={},recibidos={},fotoTemporal={},totalTrozos=0,clavesTrozos={},reconexionMs=0,ultimoDato=0;
 var renders=0,pulses=[],window={OCBusinessReadModel:{stock:p=>({units:p.stockActual}),expiry:()=>null}},document={documentElement:{lang:"es"}};
 function $(id){return {textContent:""}} function pulso(a,b){pulses.push([a,b])} function mostrar(){renders++}
 ${code}
 return {send:recibirTrozo,read:()=>({ids:(datos.hechosFinancieros||[]).map(h=>h.id),hashes:(datos.hechosFinancieros||[]).map(h=>h.hash),accepted:renders>0,review:!!recibirTrozo.sinConciliar,pulse:pulses.at(-1)||null,reset:fotoEnCurso===""})};`)(JSON.parse(JSON.stringify(initial)));
  const tables=[["ventas",[{id:"sale"}]],["productos",[]],["cobertura",[cv]]];if(rows!==null)tables.push(["hechosFinancieros",rows]);
  tables.forEach(([tabla,filas],k)=>driver.send({fotoId:"new",generadaEn:"2026-11-26T14:40:00Z",tabla,i:0,total:1,k,deTotal:tables.length,filas},source));
  const result=driver.read();
  if(!result.accepted){
    const recovery=[["ventas",[{id:"sale"}]],["productos",[]],["cobertura",[coverage]],["hechosFinancieros",[f,g,n]]];
    recovery.forEach(([tabla,filas],k)=>driver.send({fotoId:"recovery",generadaEn:"2026-11-26T14:39:00Z",tabla,i:0,total:1,k,deTotal:recovery.length,filas},"A"));
    result.recovery=driver.read();
  }
  return result;
 }
 const suite=code=>cases.map(([name,rows,cv,source,expected])=>{const r=exercise(code,rows,cv,source);return {name,expected,...r,pass:r.accepted===expected&&(expected||r.review&&r.ids.join(",")==="A-1,B-1"&&r.reset&&r.recovery.accepted&&r.recovery.ids.length===3)}});
 const red=suite(original),green=suite(fixed);if(green.some(x=>!x.pass)||red.filter(x=>!x.pass).length!==6)throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"exact recibirTrozo, synthetic complete chunks, verified marker assumed, no network or browser",patch:{before:original,after:fixed}};
}
const {patch,...r}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('dashboard-financial-retention-patch.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
