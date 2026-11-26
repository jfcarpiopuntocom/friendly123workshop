'use strict';
// Uses exact registrar from hechos.js; storage simulated. No production data.
// node independent-queued-errors.cjs cartera.js payment-alias-stress.cjs independent-identity-conflict.cjs independent-alias-write.cjs hechos.js
const fs=require('node:fs');
async function run(src,harness,prior,alias,hechos){
 const replace=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const before=await new Function("require","src","harness","prior",replace(alias.slice(0,alias.indexOf("run(...process.argv")),"return {red,green};","return after;")+"\nreturn run(src,harness,prior);")(()=>({}),src,harness,prior);
 let after=replace(before,"        var anterior = lista.find(function (h) { return h.tipo === APLICACION && String(_d(h).opId || \"\") === clave; });","        var anteriores = lista.filter(function (h) { return h.tipo === APLICACION && String(_d(h).opId || \"\") === clave; });\n        var anterior = anteriores[0];");
 after=replace(after,"if (!_mismaAplicacion(anterior, clienteId, abonoId, partes, r)) {","if (anteriores.some(function (h) { return !_mismaAplicacion(h, clienteId, abonoId, partes, r); })) {");
 after=replace(after,"      return global.AMG.Hechos.registrar(APLICACION, payload, {","      var falloValidacion = null;\n      return global.AMG.Hechos.registrar(APLICACION, payload, {");
 after=replace(after,`          var viejo = buscarRepetido(lista);
          if (viejo) return viejo;
          _validarPartesAplicacion(lista, clienteId, abonoId, partes, ventas);
          return null;`,`          try {
            var viejo = buscarRepetido(lista);
            if (viejo) return viejo;
            _validarPartesAplicacion(lista, clienteId, abonoId, partes, ventas);
            return null;
          } catch (e) { falloValidacion = e; throw e; }`);
 after=replace(after,'        if (!r) throw new Error("cartera: no se pudo confirmar la asignación; el pago permanece guardado");','        if (!r && falloValidacion) throw falloValidacion;\n        if (!r) throw new Error("cartera: no se pudo confirmar la asignación; el pago permanece guardado");');
 const start=hechos.indexOf("  function registrar(tipo, datos, opciones) {"),end=hechos.indexOf("\n  // ---------------------------------------------------------------------------",start);if(start<0||end<0)throw Error("registrar extract");
 const realRegistrar=hechos.slice(start,end);
 const t=1790000001000,f=(id,tipo,datos,ts=t)=>({id,tipo,ts,datos:{clienteId:"A",...datos}});
 const c=f("c","cartera_cargo",{monto:35}),p=f("p","cartera_abono",{monto:10,opId:"pay",motivo:"payment"}),q={...p,id:"q",datos:{...p.datos,monto:15}},parts=[{cargoKey:"cargo:c",monto:10}],app=f("app1","cartera_aplicacion",{abonoId:"p",accion:"aplicar",partes:parts,opId:"apply"},t+1000),bad={...app,id:"app2",datos:{...app.datos,partes:[{cargoKey:"cargo:c",monto:5}]}};
 async function suite(code){
 const rows=[];
 for(const mode of ["late-identity-conflict","conflicting-application-replay","valid-replay","storage-failure","normal-10-35"]){
 let facts=[c,p],writes=0,logs=[];if(mode==="conflicting-application-replay")facts.push(app,bad);if(mode==="valid-replay")facts.push(app,{...app,id:"app2"});
 const registrar=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+realRegistrar+"\nreturn registrar;")(async(tipo,datos,retries,opts)=>{if(mode==="late-identity-conflict")facts.push(q);const prev=opts?.repetido?.(facts);if(prev)return prev;if(mode==="storage-failure")throw Error("fixture storage failure");const h=f("write-"+(++writes),tipo,datos,t+2000);facts.push(h);return h},{warn:(...x)=>logs.push(x.join(" "))});
 const w={AMG:{Hechos:{todos:async()=>facts.slice(),registrar}}};new Function("window",code)(w);
 const api=w.AMG.Cartera;let error=null,id=null;try{id=(await api.aplicarAbono("A","p",parts,[],"apply")).id}catch(e){error={status:e.status??null,message:e.message}}
 const r=api.calcularSaldo(facts,"A",[]);
 rows.push({mode,writes,id,error,logs,saldo:r.saldo,applied:r.movimientos.filter(m=>m.tipo==="cargo").reduce((n,m)=>n+m.aplicado,0)});
 }return rows;
 }
 const red=await suite(before),green=await suite(after);
 if(red[0].error?.status!==null||red[1].id!=="app1"||green[0].error?.status!==409||green[1].error?.status!==409||green[2].id!=="app1"||green[2].writes!==0||green[3].error?.status!==null||green[3].writes!==0||green[4].writes!==1||green[4].saldo!==-25||green[4].applied!==10)throw Error(JSON.stringify({red,green}));
 return {red,green};
}
run(...process.argv.slice(2,7).map(p=>fs.readFileSync(p,'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
