function patchOpen(s){
 const a='        req.onblocked = function () { _hechosPendientes("bloqueado"); };\n        req.onupgradeneeded = function (ev) {';
 const b='        var vencido = false;\n        var limite = setTimeout(function () {\n          vencido = true;\n          _hechosPendientes("error-lectura");\n        }, 8000);\n        req.onblocked = function () { if (!vencido) _hechosPendientes("bloqueado"); };\n        req.onupgradeneeded = function (ev) {\n          clearTimeout(limite);';
 const c='          _hechosPendientes("sin-almacen");\n        };\n        req.onerror = function () { if (!omitido) _hechosPendientes("error-lectura"); };\n        req.onsuccess = function () {\n          var db = req.result;\n          if (!_hechosSesionVigente()) { db.close(); return; }';
 const d='          if (!vencido) _hechosPendientes("sin-almacen");\n        };\n        req.onerror = function () { clearTimeout(limite); if (!omitido && !vencido) _hechosPendientes("error-lectura"); };\n        req.onsuccess = function () {\n          clearTimeout(limite);\n          var db = req.result;\n          if (vencido || !_hechosSesionVigente()) { db.close(); return; }';
 for(const [x,y] of [[a,b],[c,d]]){if(s.split(x).length!==2)throw Error("anchor");s=s.replace(x,y);}return s;
}
async function run(s,patch){
 const cases=[
 ["read existing",["success","rows","complete"],{reads:1,closes:1,aborts:0,shown:1,reason:"",verified:true}],
 ["missing DB",["upgrade","error"],{reads:0,closes:0,aborts:1,shown:0,reason:"sin-almacen",verified:false}],
 ["error opening",["error"],{reads:0,closes:0,aborts:0,shown:0,reason:"error-lectura",verified:false}],
 ["missing store",["noStore","success"],{reads:0,closes:1,aborts:0,shown:0,reason:"base-sin-store",verified:false}],
 ["stale before success",["stale","success"],{reads:0,closes:1,aborts:0,shown:0,reason:"",verified:false}],
 ["timeout only",["timeout"],{reads:0,closes:0,aborts:0,shown:0,reason:"error-lectura",verified:false}],
 ["timeout then success",["timeout","success","rows","complete"],{reads:0,closes:1,aborts:0,shown:0,reason:"error-lectura",verified:false}],
 ["timeout then upgrade",["timeout","upgrade","error"],{reads:0,closes:0,aborts:1,shown:0,reason:"error-lectura",verified:false}],
 ["blocked then succeeds",["blocked","success","rows","complete"],{reads:1,closes:1,aborts:0,shown:1,reason:"bloqueado",verified:true}],
 ["blocked then timeout",["blocked","timeout","error"],{reads:0,closes:0,aborts:0,shown:0,reason:"error-lectura",verified:false}],
 ["transaction abort",["success","abort"],{reads:1,closes:1,aborts:0,shown:0,reason:"error-lectura",verified:false}],
 ["invalid chain",["success","badChain","rows","complete"],{reads:1,closes:1,aborts:0,shown:0,reason:"cadena-invalida",verified:false}]
 ];
 const result={};for(const [label,code] of [["original",s],["candidate",patch(s)]]){
 new Function(code);
 const a=code.indexOf("      function _abrirHechosActuales()"),b=code.indexOf("      try {\n        if (!indexedDB)",a);if(a<0||b<0)throw Error("extract");
 result[label]=[];for(const [name,steps,expected] of cases){let pass=0,last;for(let i=0;i<20;i++){
 let valid=true,store=true,chain=true,reason="",reads=0,closes=0,aborts=0,shown=0,seq=0,timers=new Map();
 const q={result:[{tipo:"cartera_abono"}]},tx={objectStore(n){if(n!=="hechos")throw Error("store");return {getAll(){reads++;return q;}};}};
 const db={objectStoreNames:{contains:()=>store},transaction(n,mode){if(n!=="hechos"||mode!=="readonly")throw Error("write");return tx;},close(){closes++;}};
 const req={result:db},idb={open(name){if(name!=="f123_hechos_db")throw Error("wrong database");return req;}};
 const data={cobertura:{hechosFinancieros:false},hechosFinancieros:[]},win={F123HechosChain:{verificarCadenas:async()=>({ok:chain})}};
 new Function("indexedDB","window","datos","_hechosSesionVigente","_hechosPendientes","mostrar","setTimeout","clearTimeout",code.slice(a,b)+"\n_abrirHechosActuales();")(idb,win,data,()=>valid,x=>{if(valid&&!data.cobertura.hechosFinancieros)reason=x;},()=>shown++,(f,ms)=>{if(ms!==8000)throw Error("timeout");timers.set(++seq,f);return seq;},id=>timers.delete(id));
 for(const step of steps){if(step==="success")req.onsuccess?.();if(step==="rows")q.onsuccess?.();if(step==="complete")tx.oncomplete?.();if(step==="error")req.onerror?.();if(step==="upgrade")req.onupgradeneeded?.({target:{transaction:{abort(){aborts++;}}}});if(step==="timeout"){const f=[...timers.values()];timers.clear();f.forEach(x=>x());}if(step==="blocked")req.onblocked?.();if(step==="stale")valid=false;if(step==="noStore")store=false;if(step==="abort")tx.onabort?.();if(step==="badChain")chain=false;}
 for(let j=0;j<12;j++)await Promise.resolve();
 last={reads,closes,aborts,shown,reason,verified:data.cobertura.hechosFinancieros};
 if(JSON.stringify(last)===JSON.stringify(expected)&&timers.size===0)pass++;
 }result[label].push({name,expected,last,pass,total:20});}
 }return result;
}
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='c82edfe4a008182f20f69536d1a7000ef0b9410f')throw Error('wrong blob');run(s,patchOpen).then(r=>{console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
