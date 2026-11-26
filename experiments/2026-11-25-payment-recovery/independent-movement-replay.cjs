'use strict';
// Synthetic fixtures; original full cartera.js and registrar() from hechos.js.
// node independent-movement-replay.cjs <cartera.js> <hechos.js>
const fs=require('node:fs');
async function experiment(src,hechos){
 const a="  function movimientoExistente(", b="  // Unico punto de escritura";
 const i=src.indexOf(a),j=src.indexOf(b,i);if(i<0||j<0)throw Error("source anchors");
 const original=src.slice(i,j),modified=original.replace("var existente = hechos.find(function (h) { return _d(h).opId === String(relacion.opId); });\n    if (!existente) return null;\n    var d = _d(existente);","var candidatos = hechos.filter(function (h) { return _d(h).opId === String(relacion.opId); });\n    for (var i = 0; i < candidatos.length; i++) {\n    var existente = candidatos[i], d = _d(existente);").replace("    return existente;","    }\n    return candidatos[0] || null;");
 if(modified===original||!modified.includes("candidatos[0]"))throw Error("identity anchor");
 let fixed=src.replace(original,modified);
 const old="      var opciones = relacion && relacion.opId ? { repetido: function (hechos) {\n        return movimientoExistente(hechos, clienteId, tipo, monto, motivo, relacion);\n      }} : null;\n      return global.AMG.Hechos.registrar(TIPOS[tipo], payload, opciones).then(function (r) {\n        if (!r) throw new Error(\"cartera: no se pudo guardar el hecho\");";
 const newer="      var errorIdentidad = null;\n      var opciones = relacion && relacion.opId ? { repetido: function (hechos) {\n        try { return movimientoExistente(hechos, clienteId, tipo, monto, motivo, relacion); }\n        catch (e) { errorIdentidad = e; throw e; }\n      }} : null;\n      return global.AMG.Hechos.registrar(TIPOS[tipo], payload, opciones).then(function (r) {\n        if (!r && errorIdentidad) throw errorIdentidad;\n        if (!r) throw new Error(\"cartera: no se pudo guardar el hecho\");";
 if(fixed.split(old).length!==2)throw Error("queue anchor");fixed=fixed.replace(old,newer);
 const k=hechos.indexOf("  function registrar(tipo, datos, opciones)"),l=hechos.indexOf("\n  // ---",k);
 if(k<0||l<0)throw Error("registrar anchor");const register=hechos.slice(k,l);
 const f=(id,monto,clienteId="A",tipo="cartera_abono")=>({id,tipo,datos:{clienteId,monto,motivo:"Abono",opId:"payment-p"}});
 async function execute(code,mode){
  const p=f("a",10),wrong=f("b",15),cross=f("b",10,"B"),mixed=f("b",10,"A","cartera_cargo");
  let list=mode==="matching-first"?[p,wrong]:mode==="conflict-first"?[wrong,p]:mode==="cross-client"?[p,cross]:mode==="mixed-type"?[p,mixed]:mode==="valid-alias"?[p,{...p,id:"b"}]:[];
  let writes=0,logs=[],reads=0;
  const registrar=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+register+"\nreturn registrar;")(async(tipo,datos,_,opciones)=>{
    if(mode==="late-conflict")list=[wrong];
    const r=opciones?.repetido?.(list);if(r)return r;
    if(mode==="storage-fail")throw Error("fixture storage failure");
    writes++;const h={id:"new",tipo,datos};list.push(h);return h;
  },{warn:(...a)=>logs.push(a.join(" "))});
  const w={AMG:{Hechos:{todos:async()=>{reads++;return list.slice()},registrar}}};new Function("window",code)(w);
  let id=null,error=null;try{id=(await w.AMG.Cartera.registrarMovimiento("A","abono",10,"Abono",{opId:"payment-p"})).id;}catch(e){error={status:e.status??null,message:e.message}}
  return {mode,id,error,writes,reads,logs};
 }
 const modes=["matching-first","conflict-first","cross-client","mixed-type","late-conflict","valid-alias","fresh","storage-fail"];
 const red=[],green=[];for(const mode of modes){red.push(await execute(src,mode));green.push(await execute(fixed,mode))}
 const assert=(c,m)=>{if(!c)throw Error(m)};
 for(let n=0;n<5;n++)assert(green[n].error?.status===409&&green[n].writes===0,"conflict "+modes[n]);
 for(const n of [0,2,3])assert(red[n].id==="a"&&red[n].writes===0,"red "+modes[n]);
 assert(red[4].error?.status===null&&red[4].writes===0,"late red");
 assert(JSON.stringify(red[1])===JSON.stringify(green[1]),"conflict first preserved");
 for(const n of [5,6,7])assert(JSON.stringify(red[n])===JSON.stringify(green[n]),"regression "+modes[n]);
 return {red,green,patch:{original,modified,old,newer}};
}
experiment(fs.readFileSync(process.argv[2],'utf8'),fs.readFileSync(process.argv[3],'utf8')).then(({patch,...r})=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
