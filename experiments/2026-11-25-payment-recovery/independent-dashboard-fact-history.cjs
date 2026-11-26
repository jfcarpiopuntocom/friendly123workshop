'use strict';
// node independent-dashboard-fact-history.cjs dashboard-main.js [--emit]
// pinned base 344e7a448c097231b0f026ebc0dd4c703110944e
const fs=require('node:fs');
function run(src){
 const a=src.indexOf("  function recibirTrozo("),b=src.indexOf("  /* Belén 2026-10-14",a);if(a<0||b<0)throw Error("anchors");
 const original=src.slice(a,b);
 const anchor="    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones;";
 if(original.split(anchor).length!==2)throw Error("anchor");
 const fixed=original.replace(anchor,`    // Immutable facts may only accumulate within the same authorized notebook.
    // Compare the known IDs and hashes; do not infer a balance or merge snapshots.
    var hechosVistos = Array.isArray(datos && datos.hechosFinancieros) ? datos.hechosFinancieros : [];
    var hechosRecibidos = Array.isArray(fotoTemporal.hechosFinancieros) ? fotoTemporal.hechosFinancieros : [];
    var porHecho = Object.create(null), repetidoHecho = false;
    hechosRecibidos.forEach(function(h) {
      if (!h || typeof h.id !== "string" || !h.id || typeof h.hash !== "string" || !h.hash ||
          Object.prototype.hasOwnProperty.call(porHecho,h.id)) { repetidoHecho = true; return; }
      porHecho[h.id] = h;
    });
    var conflictoHechos = !!(prevCobertura && prevCobertura.hechosFinancieros === true &&
      prevCobertura.verificacionHechos === 1 && (
        !nuevaCobertura || nuevaCobertura.hechosFinancieros !== true ||
        nuevaCobertura.verificacionHechos !== 1 || !Array.isArray(fotoTemporal.hechosFinancieros) ||
        repetidoHecho || hechosVistos.some(function(h) {
          var recibido = h && porHecho[h.id];
          return !recibido || recibido.hash !== h.hash;
        })));
    var cifrasDiscrepantes = cambioMonetario || cambioInventario || cambioGastos || cambioLiquidaciones || conflictoHechos;`);
 const oldFact={id:"A-1",hash:"w:aa",tipo:"cartera_abono",datos:{monto:10}},newFact={id:"B-1",hash:"w:bb",tipo:"cartera_cargo",datos:{monto:35}};
 const coverage={ventas:true,productos:true,hechosFinancieros:true,verificacionHechos:1,gastos:true,liquidaciones:true,transferencias:true};
 const fixtures=[
 ["drop-known-same",[],coverage,"A",false],
 ["drop-known-peer",[newFact],coverage,"B",false],
 ["changed-hash-same",[{...oldFact,hash:"w:zz"}],coverage,"A",false],
 ["duplicate-id",[oldFact,oldFact],coverage,"A",false],
 ["missing-hash",[{...oldFact,hash:""}],coverage,"B",false],
 ["legacy-coverage",[oldFact],{...coverage,verificacionHechos:undefined},"B",false],
 ["unknown-coverage",[oldFact],{...coverage,verificacionHechos:2},"B",false],
 ["additive",[oldFact,newFact],coverage,"B",true],
 ["reordered",[newFact,oldFact],coverage,"A",true],
 ["exact-replay",[oldFact],coverage,"A",true],
 ["incomplete-cover",[oldFact],{...coverage,hechosFinancieros:false},"B",false]
 ];
 function suite(code){
  return fixtures.map(([name,facts,cov,emisor,expected])=>{
    const before={ventas:[{id:"v1",precioUnit:35}],productos:[],hechosFinancieros:[oldFact],cobertura:coverage};
    const events=[];
    const f=new Function("initial","events","window",`var datos=initial, _fuenteDatosDashboard="remota",editorDeviceId="A",fotoEnCurso="",fotoFecha="",esperados={},recibidos={},fotoTemporal={},totalTrozos=0,clavesTrozos={},ultimoDato=0,reconexionMs=0;
      function $(id){return {textContent:""}} function pulso(msg,state){events.push({msg,state})} function mostrar(){events.push({paint:true})}
      ${code}
      return {receive:recibirTrozo,state:()=>({datos,stale:!!recibirTrozo.sinConciliar,fotoEnCurso})};`)(JSON.parse(JSON.stringify(before)),events,{OCBusinessReadModel:{stock:p=>({units:p.stockActual}),expiry:()=>null}});
    const tables=[["ventas",before.ventas],["productos",[]],["hechosFinancieros",facts],["cobertura",[cov]]];
    const send=(id,ts,emitter,tsTables)=>tsTables.forEach(([tabla,filas],k)=>f.receive({tabla,filas,i:0,total:1,k,deTotal:tsTables.length,fotoId:id,generadaEn:ts},emitter));
    send("new","2026-11-26T14:00:00Z",emisor,tables);
    const state=f.state(),accepted=events.some(x=>x.paint),retained=JSON.stringify(state.datos.hechosFinancieros)===JSON.stringify(before.hechosFinancieros),stale=state.stale;
    // A rejected newer clock must not suppress recovery by an older but complete snapshot.
    let recovered=null;if(!accepted){send("recovery","2026-11-26T13:59:00Z","A",[["ventas",before.ventas],["productos",[]],["hechosFinancieros",[oldFact,newFact]],["cobertura",[coverage]]]);recovered=f.state().datos.hechosFinancieros.length===2&&!f.state().stale;}
    return {name,expected,accepted,retained,stale,recovered,pass:accepted===expected&&(expected||retained&&stale&&recovered)};
  });
 }
 const red=suite(original),green=suite(fixed);if(green.some(r=>!r.pass)||red.filter(r=>!r.pass).length!==7)throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"exact receive function, synthetic chunks with claimed verification marker; no native transport, hash checking occurs at producer; same authorized notebook assumed",patch:{before:original,after:fixed}};
}
const {patch,...r}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('dashboard-fact-history-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
