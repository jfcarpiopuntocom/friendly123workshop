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
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='49353f93f067d8efdd4484ecd689ebf628980ae5')throw Error('wrong blob');run(s,patch2).then(r=>{console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
