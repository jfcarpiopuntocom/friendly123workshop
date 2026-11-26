'use strict';
// node independent-dashboard-journal-export.cjs dashboard-main.js
const fs=require('node:fs');
function run(src){
 const a=src.indexOf("  function exportar(tipo) {"),b=src.indexOf("\n  /* ================================================== QUIEN",a);if(a<0||b<0)throw Error("anchors");
 const original=src.slice(a,b),fixed=original.replace("  function exportar(tipo) {",`  function exportar(tipo) {
    // Export only a verified, reconciled financial journal; leave other views unchanged.
    if (vista === "hechosFinancieros" && (!datos.cobertura ||
        datos.cobertura.hechosFinancieros !== true || datos.cobertura.verificacionHechos !== 1 ||
        recibirTrozo.sinConciliar)) {
      $("cierre").textContent = localStorage.getItem("f123_lang") === "es"
        ? "Libro financiero pendiente de verificar o conciliar. Actualiza la lectura antes de exportar."
        : "Financial journal pending verification or reconciliation. Update the reading before exporting.";
      return;
    }`);
 const modes=[["verified",{hechosFinancieros:true,verificacionHechos:1},false,true],["stale",{hechosFinancieros:true,verificacionHechos:1},true,false],["legacy",{hechosFinancieros:true},false,false],["missing",undefined,false,false],["unavailable",{hechosFinancieros:false},false,false]];
 function suite(code){
  const results=[];
  for(const es of [true,false])for(const vista of ["hechosFinancieros","ventas"])for(const [state,cobertura,stale,verified] of modes)for(const type of ["csv","xlsx","json","pdf","copy"]){
   const calls=[],nodes={"neg-nombre":{textContent:"synthetic"},cierre:{textContent:"",innerHTML:""}};
   const tabla={download:(...a)=>calls.push(a[0]),copyToClipboard:()=>calls.push("copy"),getColumns:()=>[]};
   const fn=new Function("$","VISTAS","vista","tabla","etiquetaExportacion","pdfDeTabla","datos","recibirTrozo","localStorage","window",code+"\nreturn exportar;")(id=>nodes[id],{[vista]:{nombre:vista}},vista,tabla,String,()=>calls.push("pdf"),{cobertura},{sinConciliar:stale},{getItem:()=>es?"es":"en"},{});
   fn(type);const expected=vista!=="hechosFinancieros"||verified;
   results.push({es,vista,state,type,expected,actual:calls.length===1,pass:(calls.length===1)===expected&&(expected||!!nodes.cierre.textContent)});
  }
  return results;
 }
 const red=suite(original),green=suite(fixed);if(green.some(x=>!x.pass)||red.filter(x=>!x.pass).length!==40||green.length!==100)throw Error("gate");
 return {red,green,scope:"exact export dispatcher; mocked Tabulator/PDF/clipboard, no native downloads; experimental policy for unverified journal only",patch:{before:original,after:fixed}};
}
const {patch,...r}=run(fs.readFileSync(process.argv[2],'utf8'));if(process.argv.includes('--emit'))fs.writeFileSync('journal-export-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
