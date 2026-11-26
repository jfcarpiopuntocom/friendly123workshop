'use strict';
// node independent-dashboard-remote-chain.cjs sync-realtime.js hechos-chain-readonly.js
// pinned base 344e7a448c097231b0f026ebc0dd4c703110944e
const fs=require('node:fs');
async function run(src,verifier){
 const a=src.indexOf("  async function armarFoto() {"),b=src.indexOf("\n  /* Corta una tabla",a);if(a<0||b<0)throw Error("anchor");
 const original=src.slice(a,b).trimEnd();
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 let fixed=swap(original,"    return {\n      productos:","    let integridadHechos = false, motivoHechos = 'error-lectura';\n    if (Array.isArray(hechos)) {\n      motivoHechos = 'sin-verificador';\n      const lector = window.AMG && window.AMG.Hechos;\n      if (lector && typeof lector.verificarCadenas === 'function') {\n        motivoHechos = 'cadena-invalida';\n        try { const prueba = await lector.verificarCadenas(hechos); integridadHechos = !!(prueba && prueba.ok === true); if (integridadHechos) motivoHechos = null; } catch (_) {}\n      }\n    }\n    return {\n      productos:");
 fixed=swap(fixed,"hechosFinancieros: Array.isArray(hechos) ? hechos.filter","hechosFinancieros: integridadHechos ? hechos.filter");
 fixed=swap(fixed,"hechosFinancieros:Array.isArray(hechos),resumen:","hechosFinancieros:integridadHechos,motivoHechos:motivoHechos,resumen:");
 const w={};new Function("window",verifier)(w);const verify=w.F123HechosChain.verificarCadenas;
 function hash(s){let a=0x811c9dc5,b=0x01000193;for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);a=(a^c)>>>0;a=(a*0x01000193)>>>0;b=(b+c*(i+1))>>>0;}return "w:"+a.toString(16)+b.toString(16)}
 function fact(seq,tipo,prev){const h={id:"A-"+seq,instanceId:"A",autor:"test",reloj:{A:seq},ts:1790000000000+seq,tipo,datos:{clienteId:"C",monto:10},hashPrevio:prev};h.hash=hash(JSON.stringify(h));return h}
 const one=fact(1,"plan_pago_creado",""),two=fact(2,"cartera_abono",one.hash),three=fact(3,"caja_chica_ingreso",two.hash);
 const tampered={...two,datos:{...two.datos,monto:900}};
 const scenarios=[["complete",[one,two,three],verify,true,2],["out-of-order",[three,one,two],verify,true,2],["gap",[one,three],verify,false,0],["tampered",[one,tampered,three],verify,false,0],["unavailable",null,verify,false,0],["missing-verifier",[one,two],undefined,false,0],["rejected-verifier",[one,two],()=>Promise.reject(Error("failed")),false,0],["empty",[],verify,true,0]];
 async function suite(code){const rows=[];for(const [name,facts,ver,ready,count] of scenarios){const snap=JSON.stringify(facts);const window={AMG:{Hechos:{todos:async()=>facts,verificarCadenas:ver}}};const f=new Function("window","fetch","localStorage",code+"\nreturn armarFoto;")(window,async url=>({ok:true,json:async()=>url.endsWith("/reporting/corte")?{schema:1,revision:1,ventas:[],gastos:[],ajustesComision:[]}:[]}),{getItem:()=>null});const r=await f();rows.push({name,ready:r.cobertura.hechosFinancieros,reason:r.cobertura.motivoHechos??null,count:r.hechosFinancieros.length,expectedReady:ready,expectedCount:count,pass:r.cobertura.hechosFinancieros===ready&&r.hechosFinancieros.length===count,unchanged:JSON.stringify(facts)===snap,financeCoherent:r.cobertura.finanzasCoherentes});}return rows}
 const red=await suite(original),green=await suite(fixed);if(green.some(x=>!x.pass||!x.unchanged||!x.financeCoherent)||red.filter(x=>!x.pass).length!==4)throw Error(JSON.stringify({red,green}));
 return {red,green,scope:"exact armarFoto and read-only chain verifier, legacy hashes, synthetic API and facts; not browser or transport",patch:{before:original,after:fixed}};
}
run(...process.argv.slice(2,4).map(p=>fs.readFileSync(p,'utf8'))).then(({patch,...r})=>{if(process.argv.includes('--emit'))fs.writeFileSync('remote-chain-candidate.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2))}).catch(e=>{console.error(e);process.exitCode=1});
