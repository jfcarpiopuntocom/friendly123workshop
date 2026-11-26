'use strict';
// node independent-dashboard-receiver-facts.cjs dashboard-main.js [--emit]
const fs=require('node:fs');
function run(src){
 const a=src.indexOf("  function recibirTrozo(p, emisor)"),b=src.indexOf("\n  /* Belén 2026-10-14",a);if(a<0||b<0)throw Error("anchors");const original=src.slice(a,b).trimEnd();
 const anchor="    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones;";
 if(original.split(anchor).length!==2)throw Error("anchor");
 const fixed=original.replace(anchor,`    // Preserve immutable fact identities in the last verified remote reading.
    var retrocesoHechos = false;
    if (prevCobertura && prevCobertura.hechosFinancieros === true && prevCobertura.verificacionHechos === 1) {
      var recibidosHechos = Object.create(null);
      retrocesoHechos = !nuevaCobertura || nuevaCobertura.hechosFinancieros !== true ||
        nuevaCobertura.verificacionHechos !== 1 || !Array.isArray(fotoTemporal.hechosFinancieros);
      (Array.isArray(fotoTemporal.hechosFinancieros) ? fotoTemporal.hechosFinancieros : []).forEach(function(h) {
        if (!h || typeof h.id !== "string" || !h.id || typeof h.hash !== "string" || !h.hash ||
            Object.prototype.hasOwnProperty.call(recibidosHechos, h.id)) { retrocesoHechos = true; return; }
        recibidosHechos[h.id] = h.hash;
      });
      retrocesoHechos = retrocesoHechos || (datos.hechosFinancieros || []).some(function(h) {
        return !h || recibidosHechos[h.id] !== h.hash;
      });
    }
    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones || retrocesoHechos;`);
 const f=(id,hash)=>({id,hash,tipo:"cartera_abono",datos:{monto:10}});
 const one=f("A-1","hash1"),two=f("A-2","hash2"),three=f("B-1","hash3");
 const cv={ventas:true,hechosFinancieros:true,verificacionHechos:1};
 const cases=[["missing-id-same",[one],cv,"A",false],["missing-id-peer",[one],cv,"B",false],["changed-hash",[one,{...two,hash:"different"}],cv,"B",false],["legacy-marker",[one,two],{ventas:true,hechosFinancieros:true},"B",false],["missing-coverage",[one,two],null,"B",false],["duplicate-id",[one,two,two],cv,"A",false],["reordered",[two,one],cv,"B",true],["additive",[two,three,one],cv,"B",true],["explicit-incomplete",[],{ventas:true,hechosFinancieros:false},"B",false]];
 function suite(code){return cases.map(([name,rows,cov,emisor,expected])=>{
 const initial={ventas:[{id:"sale"}],productos:[],hechosFinancieros:[one,two],cobertura:cv};
 const fn=new Function("initial","rows","cov","emisor",`var datos=JSON.parse(JSON.stringify(initial)), editorDeviceId="A",_fuenteDatosDashboard="remota",fotoEnCurso="",fotoFecha="",esperados={},recibidos={},fotoTemporal={},totalTrozos=0,clavesTrozos={},reconexionMs=0,ultimoDato=0,paints=0,pulses=[];var window={OCBusinessReadModel:{stock:()=>({units:0}),expiry:()=>null}};var $=()=>({});var pulso=(s,t)=>pulses.push({s,t});var mostrar=()=>paints++;\n`+code+`\nfunction send(id,date,rr,cc,who){var payload=[["ventas",[{id:"sale"}]],["hechosFinancieros",rr],["cobertura",[cc]]];payload.forEach(function(x,k){recibirTrozo({fotoId:id,generadaEn:date,tabla:x[0],i:0,total:1,k:k,deTotal:3,filas:x[1]},who)});}\nsend("candidate","2026-11-26T12:00:00Z",rows,cov,emisor);var out={accepted:paints===1,stale:!!recibirTrozo.sinConciliar,ids:datos.hechosFinancieros.map(h=>h.id),hashes:datos.hechosFinancieros.map(h=>h.hash),paints};if(out.stale){send("recovery","2026-11-26T11:00:00Z",initial.hechosFinancieros,initial.cobertura,"A");out.recovered=paints===1&&!recibirTrozo.sinConciliar;}return out;`);
 const r=fn(initial,rows,cov,emisor);return {name,expected,...r,pass:r.accepted===expected&&(!expected?r.stale&&r.ids.join(",")==="A-1,A-2"&&r.hashes.join(",")==="hash1,hash2"&&r.recovered:true)};
 })}
 const red=suite(original),green=suite(fixed);if(green.some(x=>!x.pass)||red.filter(x=>!x.pass).length!==5)throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"exact receiver; synthetic chunks, opaque hashes; no transport/browser; previous remote verified snapshot only",patch:{before:original,after:fixed}};
}
const {patch,...result}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('dashboard-receiver-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(result,null,2));
