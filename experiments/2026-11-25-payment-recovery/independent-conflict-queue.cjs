'use strict';
// node independent-conflict-queue.cjs /path/to/hechos.js
const fs=require('node:fs');
async function run(src){
 const start=src.indexOf("  function registrar(tipo, datos, opciones) {"),end=src.indexOf("\n  // ---",start);if(start<0||end<0)throw Error("anchors");
 const original=src.slice(start,end).trimEnd();
 const candidate=`  function registrar(tipo, datos, opciones) {
    var trabajo = _cola.then(function () { return construirYGuardar(tipo, datos, 0, opciones); });
    _cola = trabajo.catch(function (e) {
      try { console.warn("[hechos] no se pudo registrar:", e && e.message); } catch (_) {}
      return null;
    });
    return opciones && opciones.propagarConflicto ? trabajo.catch(function (e) {
      if (e && e.status === 409) throw e;
      return null;
    }) : _cola;
  }`;
 const suite=async code=>{
   const attempts=[],warnings=[];
   const fn=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+code+"\nreturn registrar;")(async(tipo,datos,n,opts)=>{attempts.push(datos.id);if(datos.kind==="conflict"){const e=new Error("identity conflict");e.status=409;throw e}if(datos.kind==="abort")throw Error("abort");return datos},{warn:(...args)=>warnings.push(args.join(" "))});
   const result=async p=>{try{return {value:await p}}catch(e){return {status:e.status,message:e.message}}};
   const outcomes=await Promise.all([result(fn("cartera_aplicacion",{id:1,kind:"conflict"},{propagarConflicto:true})),result(fn("cartera_aplicacion",{id:2})),result(fn("legacy",{id:3,kind:"conflict"})),result(fn("cartera_aplicacion",{id:4,kind:"abort"},{propagarConflicto:true})),result(fn("cartera_aplicacion",{id:5}))]);
   return {attempts,warnings,outcomes};
 };
 const red=await suite(original),green=await suite(candidate);
 if(red.outcomes[0].value!==null||green.outcomes[0].status!==409||green.outcomes[1].value.id!==2||green.outcomes[2].value!==null||green.outcomes[3].value!==null||green.outcomes[4].value.id!==5||JSON.stringify(green.attempts)!=="[1,2,3,4,5]")throw Error(JSON.stringify({red,green}));
 return {red,green,original,candidate,scope:"exact registrar source; injected construirYGuardar; option not yet wired into product"};
}
run(fs.readFileSync(process.argv[2],'utf8')).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
