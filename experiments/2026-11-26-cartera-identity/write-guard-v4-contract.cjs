function patch(source) {
  const a='    if (!existente) return null;\n    var d = _d(existente);';
  const b='    if (!existente) {\n      if (tipo === "cargo" && relacion.ventaId && hechos.some(function(h){\n        return h.tipo === TIPOS.cargo && String(_d(h).ventaId || "") === String(relacion.ventaId);\n      })) {\n        var ocupado = new Error("This sale already has a credit receipt; reconcile before retrying.");\n        ocupado.status = 409; throw ocupado;\n      }\n      return null;\n    }\n    var d = _d(existente);';
  if(source.split(a).length!==2)throw Error("anchor mismatch");
  return source.replace(a,b);
}
async function run(source,patch) {
  function load(s) {
    const facts=[];let queue=Promise.resolve(),seq=0;
    const w={AMG:{Hechos:{
      todos:async()=>facts.slice(),
      registrar(tipo,datos,opts){
        const t=queue.then(async()=>{
          const repeat=opts?.repetido?.(facts.slice());if(repeat)return repeat;
          const h={id:"h"+(++seq),tipo,datos,ts:seq};facts.push(h);return h;
        });
        queue=t.catch(()=>null);return queue;
      }
    }}};
    new Function("window",s)(w);
    return {f:w.AMG.Cartera.registrarMovimiento,facts};
  }
  const cases=[
    ["exact retry",async(f)=>{await f("C","cargo",108,"x",{opId:"a",ventaId:"v"});await f("C","cargo",108,"x",{opId:"a",ventaId:"v"});},1],
    ["two opIds same sale",async(f)=>{await f("C","cargo",108,"x",{opId:"a",ventaId:"v"});await f("C","cargo",108,"x",{opId:"b",ventaId:"v"});},1],
    ["concurrent opIds same sale",async(f)=>{await Promise.allSettled([f("C","cargo",108,"x",{opId:"a",ventaId:"v"}),f("C","cargo",108,"x",{opId:"b",ventaId:"v"})]);},1],
    ["cross customer sale",async(f)=>{await f("C","cargo",108,"x",{opId:"a",ventaId:"v"});await f("D","cargo",108,"x",{opId:"b",ventaId:"v"});},1],
    ["legacy first",async(f)=>{await f("C","cargo",108,"x",{ventaId:"v"});await f("C","cargo",108,"x",{opId:"a",ventaId:"v"});},1],
    ["separate sales",async(f)=>{await f("C","cargo",108,"x",{opId:"a",ventaId:"v"});await f("C","cargo",108,"x",{opId:"b",ventaId:"w"});},2],
    ["separate manual charges",async(f)=>{await f("C","cargo",108,"x",{opId:"a"});await f("C","cargo",108,"x",{opId:"b"});},2],
    ["mixed concurrent opId and legacy",async(f)=>{await Promise.allSettled([f("C","cargo",108,"x",{opId:"a",ventaId:"v"}),f("C","cargo",108,"x",{ventaId:"v"})]);},1],
    ["mixed concurrent legacy and opId",async(f)=>{await Promise.allSettled([f("C","cargo",108,"x",{ventaId:"v"}),f("C","cargo",108,"x",{opId:"a",ventaId:"v"})]);},1]
,
    ["mixed cross client modern first",async(f)=>{await Promise.allSettled([f("C","cargo",108,"x",{opId:"a",ventaId:"v"}),f("D","cargo",108,"x",{ventaId:"v"})]);},1],
    ["mixed cross client legacy first",async(f)=>{await Promise.allSettled([f("D","cargo",108,"x",{ventaId:"v"}),f("C","cargo",108,"x",{opId:"a",ventaId:"v"})]);},1],
    ["same sale mismatched amount",async(f)=>{await f("C","cargo",108,"x",{opId:"a",ventaId:"v"});await f("C","cargo",100,"x",{ventaId:"v"});},1]
  ];
  const result={};
  for(const [label,s] of [["original",source],["candidate",patch(source)]]){
    result[label]=[];
    for(const [name,execute,expected] of cases){
      let pass=0,observed,err;
      for(let i=0;i<20;i++){const {f,facts}=load(s);try{await execute(f);}catch(e){err=e.status||e.message;}observed=facts.length;if(observed===expected)pass++;}
      result[label].push({name,pass,total:20,expected,observed,err});
    }
  }
  return result;
}

function patch2(source) {
  source=patch(source);
  function one(a,b){if(source.split(a).length!==2)throw Error("anchor: "+a);source=source.replace(a,b);}
  // Preserve the original sale receipt lookup and validation, but move the second
  // check inside Hechos.registrar's serial queue, including legacy callers.
  const a=source.indexOf('      var vinculos = reusarCargoVenta ?');
  const b=source.indexOf('      return guardarMovimiento(clienteId, tipo, monto, motivo, relacion);',a);
  if(a<0||b<a)throw Error("sale guard anchors missing");
  const body=source.slice(a,b);
  source=source.slice(0,a)+'      var existente = cargoVentaExistente(hechos, clienteId, monto, relacion, reusarCargoVenta);\n      if (existente) return existente;\n      return guardarMovimiento(clienteId, tipo, monto, motivo, relacion, reusarCargoVenta);'+source.slice(b+'      return guardarMovimiento(clienteId, tipo, monto, motivo, relacion);'.length);
  one('  function guardarMovimiento(clienteId, tipo, monto, motivo, relacion) {','  function cargoVentaExistente(hechos, clienteId, monto, relacion, reusarCargoVenta) {\n'+body+'      return null;\n  }\n\n  function guardarMovimiento(clienteId, tipo, monto, motivo, relacion, reusarCargoVenta) {');
  one('      }} : null;\n      return global.AMG.Hechos.registrar','      }} : (tipo === "cargo" && relacion && relacion.ventaId ? { repetido: function(hechos){\n        return cargoVentaExistente(hechos, clienteId, monto, relacion, reusarCargoVenta);\n      }} : null);\n      return global.AMG.Hechos.registrar');
  return source;
}

function patch3(source) {
  source=patch2(source);
  const a='if (reusarCargoVenta && hechos.some(function (h) {\n        var d = _d(h);\n        return h.tipo === TIPOS.cargo';
  const b='if (hechos.some(function (h) {\n        var d = _d(h);\n        return (reusarCargoVenta || !!d.opId) && h.tipo === TIPOS.cargo';
  if(source.split(a).length!==2)throw Error("cross-customer anchor");
  return source.replace(a,b);
}

function patch4(source) {
 source=patch3(source);
 const a='      return global.AMG.Hechos.registrar(TIPOS[tipo], payload, opciones).then(function (r) {\n        if (!r) throw new Error("cartera: no se pudo guardar el hecho");\n        var eb = bus();\n        if (eb) eb.emit(TIPOS[tipo] + ":registrado", { payload: payload });';
 const b='      var repetido = false, errorRepetido = null;\n      if (opciones && opciones.repetido) {\n        var comprobar = opciones.repetido;\n        opciones.repetido = function(hechos) {\n          repetido = false; errorRepetido = null;\n          try { var previo = comprobar(hechos); repetido = !!previo; return previo; }\n          catch (e) { errorRepetido = e; throw e; }\n        };\n      }\n      return global.AMG.Hechos.registrar(TIPOS[tipo], payload, opciones).then(function (r) {\n        if (!r) throw errorRepetido || new Error("cartera: no se pudo guardar el hecho");\n        var eb = bus();\n        if (eb && !repetido) eb.emit(TIPOS[tipo] + ":registrado", { payload: payload });';
 if(source.split(a).length!==2)throw Error("anchor mismatch");
 return source.replace(a,b);
}
async function check(cartera,hechos) {
 const a=hechos.indexOf("  function registrar(tipo, datos, opciones) {");
 const b=hechos.indexOf("\n  // ---------------------------------------------------------------------------",a);
 if(a<0||b<a)throw Error("registrar anchor missing");
 const actualRegistrar=hechos.slice(a,b);
 const scenarios=[
 ["concurrent conflict opId payload",async(f)=>Promise.allSettled([f("C","abono",10,"x",{opId:"a"}),f("C","abono",11,"x",{opId:"a"})]),1,1,409],
 ["concurrent sale different opId",async(f)=>Promise.allSettled([f("C","cargo",108,"x",{opId:"a",ventaId:"v"}),f("C","cargo",108,"x",{opId:"b",ventaId:"v"})]),1,1,409],
 ["concurrent modern then legacy",async(f)=>Promise.allSettled([f("C","cargo",108,"x",{opId:"a",ventaId:"v"}),f("C","cargo",108,"x",{ventaId:"v"})]),1,1,null],
 ["concurrent legacy then modern",async(f)=>Promise.allSettled([f("C","cargo",108,"x",{ventaId:"v"}),f("C","cargo",108,"x",{opId:"a",ventaId:"v"})]),1,1,409],
 ["exact retry",async(f)=>Promise.allSettled([f("C","abono",10,"x",{opId:"a"}),f("C","abono",10,"x",{opId:"a"})]),1,1,null],
 ["two separate payments",async(f)=>Promise.allSettled([f("C","abono",10,"x",{opId:"a"}),f("C","abono",10,"x",{opId:"b"})]),2,2,null]
 ];
 function load(s){
   const facts=[],events=[];let seq=0;
   const w={AMG:{EventBus:{emit:(...a)=>events.push(a)},Hechos:{todos:async()=>facts.slice()}}};
   // Exact queue and error swallowing from product; persistence/construct simulated.
   const registrar=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+actualRegistrar+"\nreturn registrar;")(
    async(tipo,datos,tries,opts)=>{const prev=opts?.repetido?.(facts.slice());if(prev)return prev;const h={id:"h"+(++seq),tipo,datos,ts:seq};facts.push(h);return h;},{warn(){}});
   w.AMG.Hechos.registrar=registrar;
   new Function("window",s)(w);
   return {f:w.AMG.Cartera.registrarMovimiento,facts,events};
 }
 const result={};
 for(const [label,src] of [["v3",patch3(cartera)],["v4",patch4(cartera)]]){
  result[label]=[];
  for(const [name,act,nFacts,nEvents,status] of scenarios){
   let pass=0,observed;
   for(let i=0;i<20;i++){
    const {f,facts,events}=load(src);
    const outcomes=await act(f);
    observed={facts:facts.length,events:events.length,errors:outcomes.filter(x=>x.status==="rejected").map(x=>x.reason.status??x.reason.message)};
    // Check subsequent independent write even after rejected conflict.
    await f("C","abono",1,"next",{opId:"after"});
    const recovered=facts.length===observed.facts+1&&events.length===observed.events+1;
    if(observed.facts===nFacts&&observed.events===nEvents&&JSON.stringify(observed.errors)===JSON.stringify(status===null?[]:[status])&&recovered)pass++;
   }
   result[label].push({name,pass,total:20,observed});
  }
 }
 return result;
}
const fs=require('node:fs'),crypto=require('node:crypto');const c=fs.readFileSync(process.argv[2],'utf8'),h=fs.readFileSync(process.argv[3],'utf8');const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');if(blob(c)!=='49353f93f067d8efdd4484ecd689ebf628980ae5'||blob(h)!=='c32397ff26db5cae625d71d3fc7efdafc78663b9')throw Error('wrong blob');check(c,h).then(r=>{console.log(JSON.stringify(r,null,2));if(r.v4.some(x=>x.pass!==x.total))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
