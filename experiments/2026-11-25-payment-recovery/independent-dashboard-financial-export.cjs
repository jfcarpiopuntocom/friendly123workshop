'use strict';
// node independent-dashboard-financial-export.cjs dashboard-main.js [--emit]
const fs=require('node:fs');
function run(src){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const a=src.indexOf("  function exportar(tipo) {"),b=src.indexOf("\n  /* ================================================== QUIEN",a);if(a<0||b<0)throw Error("export anchor");const original=src.slice(a,b).trimEnd();
 const helper=`  function hechosFinancierosExportables() {
    var coverage = datos && datos.cobertura;
    return !!(coverage && coverage.hechosFinancieros === true &&
      coverage.verificacionHechos === 1 && Array.isArray(datos.hechosFinancieros) &&
      !(typeof _fuenteDatosDashboard !== "undefined" && _fuenteDatosDashboard === "remota" && recibirTrozo.sinConciliar));
  }
`;
 const fixed=helper+swap(original,"  function exportar(tipo) {",`  function exportar(tipo) {
    if (vista === "hechosFinancieros" && !hechosFinancierosExportables()) {
      $("cierre").textContent = localStorage.getItem("f123_lang") === "es"
        ? "Movimientos financieros pendientes de verificar o conciliar. Exportación pendiente."
        : "Financial facts pending verification or reconciliation. Export pending.";
      return;
    }`);
 const tableAnchor='    var incompleta=(dependencias[vista]||[]).some(function(k){return datos.cobertura&&datos.cobertura[k]===false;});';
 const tablePatch=tableAnchor+'\n    if (vista === "hechosFinancieros" && !hechosFinancierosExportables()) incompleta = true;';
 const full=swap(swap(src,original,fixed),tableAnchor,tablePatch);
 const cv={hechosFinancieros:true,verificacionHechos:1};const row={id:"A-1",hash:"x"};
 const scenarios=[["verified",cv,[row],false,"remota","hechosFinancieros",true],["no-coverage",undefined,[row],false,"remota","hechosFinancieros",false],["legacy",{hechosFinancieros:true},[row],false,"remota","hechosFinancieros",false],["unverified",{hechosFinancieros:false},[],false,"remota","hechosFinancieros",false],["stale-retained",cv,[row],true,"remota","hechosFinancieros",false],["missing-table",cv,undefined,false,"remota","hechosFinancieros",false],["verified-empty",cv,[],false,"local","hechosFinancieros",true],["local-old-remote-flag",cv,[row],true,"local","hechosFinancieros",true],["sales-unaffected",undefined,[],true,"remota","ventas",true]];
 function suite(code){const out=[];for(const es of [true,false])for(const [name,cobertura,hechosFinancieros,stale,source,vista,expected] of scenarios)for(const tipo of ["csv","xlsx","json","copy","pdf"]){
 const events=[],cierre={textContent:"",innerHTML:""},datos={cobertura,hechosFinancieros};
 const v={nombre:"Test"};const col={getDefinition:()=>({title:"Amount"})};const tabla={getColumns:()=>[col],download:t=>events.push(t),copyToClipboard:()=>events.push("copy")};
 const fn=new Function("datos","_fuenteDatosDashboard","recibirTrozo","vista","$","localStorage","VISTAS","tabla","etiquetaExportacion","pdfDeTabla","window",code+"\nreturn exportar;")(datos,source,{sinConciliar:stale},vista,id=>id==="cierre"?cierre:{textContent:"Shop"},{getItem:()=>es?"es":"en"},{[vista]:v},tabla,String,()=>events.push("pdf"),{});
 fn(tipo);const ok=events.length===1&&events[0]===tipo;out.push({es,name,tipo,exported:ok,expected,pass:ok===expected&&(expected||cierre.textContent.includes(es?"Exportación pendiente":"Export pending"))});}return out}
 const red=suite(original),green=suite(fixed);if(green.some(x=>!x.pass)||red.filter(x=>!x.pass).length!==50)throw Error(JSON.stringify({redFails:red.filter(x=>!x.pass).length,greenFails:green.filter(x=>!x.pass)}));
 return {red,green,scope:"exact exportar function, mocked exporters; tests verify dispatch not generated files. Table warning patch not executed here.",patch:{before:src,after:full}};
}
const {patch,...r}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('dashboard-export.experimental.js',patch.after,{flag:'wx'});console.log(JSON.stringify(r,null,2));
