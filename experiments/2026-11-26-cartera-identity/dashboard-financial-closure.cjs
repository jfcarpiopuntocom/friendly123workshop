function patch(s){
 const a='    var incompleta=(dependencias[vista]||[]).some(function(k){return datos.cobertura&&datos.cobertura[k]===false;});';
 const b=a+'\n    if (vista === "hechosFinancieros") incompleta = !datos.cobertura || datos.cobertura.hechosFinancieros !== true || !Array.isArray(datos.hechosFinancieros) || (_fuenteDatosDashboard === "remota" && recibirTrozo.sinConciliar === true);';
 if(s.split(a).length!==2)throw Error("anchor mismatch");return s.replace(a,b);
}
function run(s){
 const cases=[
 ["verified empty","local",true,[],false,false],
 ["verified rows","local",true,[{id:"f"}],false,false],
 ["explicit missing","local",false,[],false,true],
 ["unknown coverage","local",undefined,[],false,true],
 ["missing array","local",true,undefined,false,true],
 ["remote conflict","remota",true,[{id:"f"}],true,true],
 ["remote coherent","remota",true,[{id:"f"}],false,false],
 ["local with stale remote flag","local",true,[{id:"f"}],true,false]
 ];
 const result={};for(const [label,code] of [["original",s],["candidate",patch(s)]]){
 new Function(code);
 const start=code.indexOf("  function pintarTabla() {"),end=code.indexOf("    if (typeof Tabulator",start);
 const body=code.slice(start,end)+"\n}";
 result[label]=cases.map(([name,source,coverage,rows,conflict,expected])=>{
 let pass=0,last;for(let i=0;i<20;i++){
 const els={cierre:{}, "agrupar-por":{}};const data={cobertura:{hechosFinancieros:coverage},hechosFinancieros:rows};
 const v={filas:()=>rows||[],cierre:()=>"<strong>confirmed</strong>"};
 const f=new Function("VISTAS","vista","$","datos","_fuenteDatosDashboard","recibirTrozo",body+";return pintarTabla;")({hechosFinancieros:v},"hechosFinancieros",id=>els[id],data,source,{sinConciliar:conflict});
 f();last=els.cierre.innerHTML; if(last.includes("pendiente")===expected)pass++;
 }return {name,pass,total:20,last};});
 }return result;
}
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='c82edfe4a008182f20f69536d1a7000ef0b9410f')throw Error('wrong blob');const r=run(s);console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;
