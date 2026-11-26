'use strict';
// node independent-dashboard-fact-export.cjs dashboard-main.js
const fs=require('node:fs');
function run(src){
 const a=src.indexOf("  function pintarTabla() {"),b=src.indexOf("\n  /* Si un CDN",a),c=src.indexOf("  function exportar(tipo) {"),d=src.indexOf("\n  /* ================================================== QUIEN ESTA",c);if(a<0||b<0||c<0||d<0)throw Error("anchors");
 const table=src.slice(a,b),exp=src.slice(c,d);
 const guard=`  function hechosVerificadosParaExportar() {
    var cobertura = datos && datos.cobertura;
    return !!(cobertura && cobertura.hechosFinancieros === true &&
      cobertura.verificacionHechos === 1 && Array.isArray(datos.hechosFinancieros) &&
      !(typeof recibirTrozo === "function" && recibirTrozo.sinConciliar));
  }\n`;
 const anchor='    $("cierre").innerHTML = incompleta ?';if(table.split(anchor).length!==2)throw Error("table anchor");
 const tableFixed=table.replace(anchor,'    if (vista === "hechosFinancieros" && !hechosVerificadosParaExportar()) incompleta = true;\n'+anchor);
 const expFixed=exp.replace("  function exportar(tipo) {",`  function exportar(tipo) {
    if (vista === "hechosFinancieros" && !hechosVerificadosParaExportar()) {
      var es = localStorage.getItem("f123_lang") === "es";
      $("cierre").textContent = es ? "Verificación financiera pendiente. Reintenta la exportación después de conciliar." : "Financial verification pending. Retry export after reconciliation.";
      return;
    }`);
 const cases=[["verified",{hechosFinancieros:true,verificacionHechos:1},false,true],["legacy",{hechosFinancieros:true},false,false],["unknown",undefined,false,false],["incomplete",{hechosFinancieros:false},false,false],["stale",{hechosFinancieros:true,verificacionHechos:1},true,false]];
 function suite(t,e,helper){const rows=[];for(const es of [true,false])for(const [name,cov,stale,expected] of cases){
  const data={cobertura:cov,hechosFinancieros:[{id:"A-1",hash:"h"}]};
  const before=JSON.stringify(data);
  const res=new Function("datos","stale","es",`var vista="hechosFinancieros", nodes={},downloads=[],displayed=0;function $(id){return nodes[id]||(nodes[id]={textContent:"",innerHTML:""})}
  function recibirTrozo(){} recibirTrozo.sinConciliar=stale;
  var VISTAS={hechosFinancieros:{nombre:"facts",filas:()=>datos.hechosFinancieros,cierre:f=>"immutable facts "+f.length},ventas:{nombre:"sales"}};
  var tabla={download:(...a)=>downloads.push(a[0]),copyToClipboard:()=>downloads.push("copy")},localStorage={getItem:()=>es?"es":"en"};
  function etiquetaExportacion(x){return x} function pdfDeTabla(){downloads.push("pdf")} function degradarSinTabulator(v,filas){displayed=filas.length}
  ${helper}\n${t}\n${e}
  pintarTabla();var warning=nodes.cierre.innerHTML.includes("Información pendiente");
  for(const kind of ["csv","xlsx","json","copy","pdf"])exportar(kind);
  var factDownloads=downloads.length;vista="ventas";exportar("csv");
  return {warning,factDownloads,otherDownloads:downloads.length-factDownloads,displayed};`)(data,stale,es);
  rows.push({es,name,expected,...res,pass:res.warning===!expected&&res.factDownloads===(expected?5:0)&&res.otherDownloads===1&&res.displayed===1&&JSON.stringify(data)===before});
 }return rows}
 const red=suite(table,exp,""),green=suite(tableFixed,expFixed,guard);if(green.some(x=>!x.pass)||red.filter(x=>!x.pass).length!==8)throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"actual table/export functions, DOM and exporter spies; raw forensic rows preserved with pending warning, operational export blocked only for unverified financial facts; no actual file export",patch:{helper:guard,table:tableFixed,export:expFixed}};
}
const {patch,...r}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('dashboard-fact-export-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
