function patch(s){
 const a='          q.onsuccess = function () { rows = q.result; };';
 const b='          var lecturaTerminada = false, cerrado = false;\n          function cerrarLectura() { if (!cerrado) { cerrado = true; db.close(); } }\n          function terminarLectura(motivo) {\n            if (lecturaTerminada) return false;\n            lecturaTerminada = true; clearTimeout(limiteLectura); cerrarLectura();\n            if (motivo) _hechosPendientes(motivo);\n            return true;\n          }\n          var limiteLectura = setTimeout(function () {\n            if (!terminarLectura("error-lectura")) return;\n            try { tx.abort(); } catch (_) {}\n          }, 8000);\n          q.onsuccess = function () { if (!lecturaTerminada) rows = q.result; };';
 const c='          q.onerror = function () { _hechosPendientes("error-lectura"); };\n          tx.onerror = function () { _hechosPendientes("error-lectura"); };\n          tx.onabort = function () { db.close(); _hechosPendientes("error-lectura"); };\n          tx.oncomplete = function () {\n            db.close();';
 const d='          q.onerror = function () { terminarLectura("error-lectura"); };\n          tx.onerror = function () { terminarLectura("error-lectura"); };\n          tx.onabort = function () { terminarLectura("error-lectura"); };\n          tx.oncomplete = function () {\n            if (!terminarLectura()) return;';
 const e='            Promise.resolve().then(function () { return verificador.verificarCadenas(rows); })\n              .then(function (prueba) {';
 const f='            var verificacionTerminada = false;\n            var limiteVerificacion = setTimeout(function () {\n              if (verificacionTerminada) return;\n              verificacionTerminada = true; _hechosPendientes("error-lectura");\n            }, 8000);\n            Promise.resolve().then(function () { return verificador.verificarCadenas(rows); })\n              .then(function (prueba) {\n                if (verificacionTerminada) return;\n                verificacionTerminada = true; clearTimeout(limiteVerificacion);';
 const g='                // Keep old-book failure notifications out of a newer session.\n                if (_hechosSesionVigente()) _hechosPendientes("cadena-invalida");';
 const h='                if (verificacionTerminada) return;\n                verificacionTerminada = true; clearTimeout(limiteVerificacion);\n                // Keep old-book failure notifications out of a newer session.\n                if (_hechosSesionVigente()) _hechosPendientes("cadena-invalida");';
 for(const [x,y] of [[a,b],[c,d],[e,f],[g,h]]){if(s.split(x).length!==2)throw Error("anchor mismatch "+x);s=s.replace(x,y);}return s;
}
async function run(s,patch){
 const cases=[
 ["normal",["rows","complete","verify"],true,"",1,0],
 ["read timeout",["timeout"],false,"error-lectura",1,1],
 ["read timeout late complete",["timeout","rows","complete","verify"],false,"error-lectura",1,1],
 ["read success but no complete",["rows","timeout"],false,"error-lectura",1,1],
 ["read abort",["abort"],false,"error-lectura",1,0],
 ["read error then abort",["error","abort"],false,"error-lectura",1,0],
 ["crypto timeout",["rows","complete","timeout"],false,"error-lectura",1,0],
 ["crypto late success",["rows","complete","timeout","verify"],false,"error-lectura",1,0],
 ["crypto late rejection",["rows","complete","timeout","reject"],false,"error-lectura",1,0],
 ["crypto reject",["rows","complete","reject"],false,"cadena-invalida",1,0],
 ["crypto bad",["rows","complete","bad"],false,"cadena-invalida",1,0],
 ["logout during crypto",["rows","complete","stale","verify"],false,"",1,0],
 ["logout during read",["stale","timeout"],false,"",1,1]
 ];const out={};for(const [label,code] of [["original",s],["candidate",patch(s)]]){
 new Function(code);const a=code.indexOf("      function _abrirHechosActuales()"),b=code.indexOf("      try {\n        if (!indexedDB)",a);if(a<0||b<0)throw Error("extract");out[label]=[];
 for(const [name,steps,verified,reason,closes,aborts] of cases){let pass=0,last;for(let i=0;i<20;i++){
 let valid=true,why="",closed=0,aborted=0,shown=0,seq=0,timers=new Map(),resolve,reject;
 const q={result:[{tipo:"cartera_abono",id:"1"}]},tx={abort(){aborted++;this.onabort?.();},objectStore(){return {getAll(){return q;}};}};
 const db={objectStoreNames:{contains:()=>true},transaction(n,mode){if(mode!=="readonly")throw Error("write");return tx;},close(){closed++;}};
 const req={result:db},idb={open:()=>req},data={hechosFinancieros:[],cobertura:{hechosFinancieros:false}};
 const win={F123HechosChain:{verificarCadenas:()=>new Promise((r,j)=>{resolve=r;reject=j;})}};
 const flush=async()=>{for(let j=0;j<16;j++)await Promise.resolve();};
 new Function("indexedDB","window","datos","_hechosSesionVigente","_hechosPendientes","mostrar","setTimeout","clearTimeout",code.slice(a,b)+"\n_abrirHechosActuales();")(idb,win,data,()=>valid,x=>{if(valid&&!data.cobertura.hechosFinancieros)why=x;},()=>shown++,(f,ms)=>{if(ms!==8000)throw Error("timeout");timers.set(++seq,f);return seq;},id=>timers.delete(id));
 req.onsuccess();await flush();for(const step of steps){if(step==="rows")q.onsuccess?.();if(step==="complete")tx.oncomplete?.();if(step==="abort")tx.onabort?.();if(step==="error")q.onerror?.();if(step==="stale")valid=false;if(step==="timeout"){const f=[...timers.values()];timers.clear();f.forEach(x=>x());}if(step==="verify")resolve?.({ok:true});if(step==="bad")resolve?.({ok:false});if(step==="reject")reject?.(Error("crypto"));await flush();}
 last={verified:data.cobertura.hechosFinancieros,reason:why,closes:closed,aborts:aborted,shown,rows:data.hechosFinancieros.length,timers:timers.size};
 if(last.verified===verified&&last.reason===reason&&last.closes===closes&&last.aborts===aborts&&last.shown===Number(verified)&&last.rows===Number(verified)&&last.timers===0)pass++;
 }out[label].push({name,pass,total:20,last});}
 }return out;
}
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='c82edfe4a008182f20f69536d1a7000ef0b9410f')throw Error('wrong blob');run(s,patch).then(r=>{console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
