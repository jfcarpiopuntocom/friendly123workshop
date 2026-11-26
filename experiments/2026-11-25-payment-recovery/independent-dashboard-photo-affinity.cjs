'use strict';
// node independent-dashboard-photo-affinity.cjs dashboard-main.js independent-dashboard-fact-retention.cjs
const fs=require('node:fs');
function run(src,prior){
 const cut=prior.lastIndexOf("\nconst {patch,...r}=run");const prev=new Function("require","src",prior.slice(0,cut)+"\nreturn run(src);")(()=>({}),src).patch.after;
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 let fixed=swap(prev,'      fotoEnCurso = sello;\n      fotoFecha = String(p.generadaEn || "");','      fotoEnCurso = sello;\n      recibirTrozo.emisorFoto = emisor;\n      fotoFecha = String(p.generadaEn || "");');
 fixed=swap(fixed,'    ultimoDato = Date.now();','    if (sello && recibirTrozo.emisorFoto !== emisor) return;\n    ultimoDato = Date.now();');
 fixed=swap(fixed,'    var perdidaHechos = false;','    var perdidaHechos = false;\n    if (nuevaVerificada) {\n      var idsHechos = new Set();\n      nuevaVerificada = Array.isArray(hechosNuevos) && hechosNuevos.every(function(h) {\n        if (!h || typeof h.id !== "string" || !h.id || typeof h.hash !== "string" || !h.hash || idsHechos.has(h.id)) return false;\n        idsHechos.add(h.id); return true;\n      });\n    }\n    if (!nuevaVerificada && nuevaCobertura && nuevaCobertura.verificacionHechos === 1) {\n      fotoTemporal.cobertura = Object.assign({}, nuevaCobertura, {hechosFinancieros:false, verificacionHechos:null, motivoHechos:"cadena-invalida"});\n      nuevaCobertura = fotoTemporal.cobertura;\n    }');
 const cov={ventas:true,hechosFinancieros:true,verificacionHechos:1},h={id:"A-1",hash:"w:valid",tipo:"cartera_abono"};
 function scenario(code,mode){
  const f=new Function("cov","h","mode",`var datos={},editorDeviceId="",_fuenteDatosDashboard="",fotoEnCurso="",fotoFecha="",esperados={},recibidos={},fotoTemporal={},totalTrozos=0,clavesTrozos={},reconexionMs=0,ultimoDato=0,paints=0;
  var window={OCBusinessReadModel:{stock:()=>({units:0}),expiry:()=>null}},document={documentElement:{lang:"es"}};function $(){return {}}function pulso(){}function mostrar(){paints++}
  ${code}
  var tables=[["ventas",[{id:"sale"}]],["productos",[]],["cobertura",[cov]]];if(mode!=="missing-table")tables.push(["hechosFinancieros",mode==="duplicate"?[h,h]:[h]]);
  tables.forEach(function(t,k){recibirTrozo({fotoId:"photo",generadaEn:"2026-11-26T02:00:00Z",tabla:t[0],filas:t[1],i:0,total:1,k:k,deTotal:tables.length},mode==="mixed-sender"&&k===tables.length-1?"B":"A")});
  var first={paints,ready:datos.cobertura?.hechosFinancieros??null,editor:editorDeviceId};
  if(mode==="mixed-sender"){var t=tables[tables.length-1];recibirTrozo({fotoId:"photo",generadaEn:"2026-11-26T02:00:00Z",tabla:t[0],filas:t[1],i:0,total:1,k:tables.length-1,deTotal:tables.length},"A")}
  return {first,final:{paints,ready:datos.cobertura?.hechosFinancieros??null,editor:editorDeviceId}};`);
  return f(cov,h,mode);
 }
 const cases=["mixed-sender","duplicate","missing-table","valid"];
 function suite(code){return cases.map(name=>{const x=scenario(code,name);let pass=name==="mixed-sender"?x.first.paints===0&&x.final.paints===1&&x.final.editor==="A":name==="valid"?x.first.ready===true&&x.first.paints===1:x.first.ready===false;return {name,...x,pass}})}
 const red=suite(prev),green=suite(fixed);if(red.filter(x=>!x.pass).length!==3||green.some(x=>!x.pass))throw Error(JSON.stringify({red,green}));
 return {red,green,patch:{before:prev,after:fixed},scope:"actual receiver closure, synthetic messages; no transport authentication, native browser, or hash verification; assumes sender identity supplied by transport"};
}
const {patch,...r}=run(...process.argv.slice(2,4).map(p=>fs.readFileSync(p,'utf8')));if(process.argv.includes('--emit'))fs.writeFileSync('dashboard-photo-affinity-patch.json',JSON.stringify(patch,null,2),{flag:'wx'});console.log(JSON.stringify(r,null,2));
