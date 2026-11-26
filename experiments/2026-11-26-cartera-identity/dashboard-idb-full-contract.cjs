function patchList(s){
 const old='Promise.resolve(indexedDB.databases()).then(function (bases) {\n            if (!_hechosSesionVigente()) return;\n            if (!Array.isArray(bases)) { _hechosPendientes("error-lectura"); return; }\n            var moderna = bases.some(function (b) { return b && b.name === "f123_hechos_db"; });\n            var vieja = bases.some(function (b) { return b && b.name === "amg_hechos_db"; });';
 const next='new Promise(function (resolve) {\n            var settled = false;\n            var timer = setTimeout(function () { done(null); }, 1500);\n            function done(bases) {\n              if (settled) return;\n              settled = true; clearTimeout(timer); resolve(bases);\n            }\n            try { Promise.resolve(indexedDB.databases()).then(done, function () { done(null); }); }\n            catch (_) { done(null); }\n          }).then(function (bases) {\n            if (!_hechosSesionVigente()) return;\n            if (!Array.isArray(bases)) { _abrirHechosActuales(); return; }\n            var iso = window.AMG && window.AMG.Aislamiento;\n            var prefijo = iso && iso.namespace ? String(iso.namespace) + "::" : "";\n            var moderna = bases.some(function (b) { return b && b.name === prefijo + "f123_hechos_db"; });\n            var vieja = bases.some(function (b) { return b && b.name === prefijo + "amg_hechos_db"; });';
 if(s.split(old).length!==2)throw Error("anchor mismatch"); return s.replace(old,next);
}
async function runList(s,patch){
 const cases=[
 ["scoped modern","f123",["f123::f123_hechos_db"],"open"],
 ["scoped legacy","f123",["f123::amg_hechos_db"],"sin-migrar"],
 ["other namespace","f123",["other::f123_hechos_db"],"sin-almacen"],
 ["raw ignored with isolation","f123",["f123_hechos_db"],"sin-almacen"],
 ["raw legacy ignored","f123",["amg_hechos_db"],"sin-almacen"],
 ["raw valid without isolation","",["f123_hechos_db"],"open"],
 ["empty list","f123",[],"sin-almacen"],
 ["list rejected","f123","reject","open"],
 ["list throws","f123","throw","open"],
 ["invalid list","f123","invalid","open"],
 ["unsupported listing","f123","unsupported","open"],
 ["hanging list then late success","f123","hang","open"],
 ["late rejected after timeout","f123","lateReject","open"],
 ["session invalidated during listing","f123","stale",""],
 ["session invalidated before timeout","f123","staleHang",""]
 ];
 const result={};for(const [label,code] of [["original",s],["candidate",patch(s)]]){
 new Function(code);const a=code.indexOf("      try {\n        if (!indexedDB) _hechosPendientes"),b=code.indexOf("      try {\n        var o = JSON.parse",a);
 if(a<0||b<0)throw Error("extract");
 result[label]=[];
 for(const [name,ns,mode,want] of cases){let pass=0,last;for(let i=0;i<20;i++){
 let events=[],timers=new Map(),seq=0,valid=true,resolveLater,rejectLater;
 const idb={};if(mode!=="unsupported")idb.databases=()=>{if(mode==="throw")throw Error("sync");if(mode==="reject")return Promise.reject(Error("async"));if(["hang","lateReject","stale","staleHang"].includes(mode))return new Promise((r,j)=>{resolveLater=r;rejectLater=j;});return Promise.resolve(Array.isArray(mode)?mode.map(name=>({name})):null);};
 const win={AMG:{Aislamiento:{namespace:ns}}};
 const set=(f,ms)=>{if(ms!==1500)throw Error("wrong timeout");timers.set(++seq,f);return seq;};
 const clear=id=>timers.delete(id);
 new Function("indexedDB","window","_hechosSesionVigente","_hechosPendientes","_abrirHechosActuales","setTimeout","clearTimeout",code.slice(a,b))(idb,win,()=>valid,x=>events.push(x),()=>events.push("open"),set,clear);
 const flush=async()=>{for(let j=0;j<12;j++)await Promise.resolve();};
 if(mode==="stale"||mode==="staleHang")valid=false;
 if(mode==="stale")resolveLater([{name:ns+"::f123_hechos_db"}]);
 await flush();for(const f of [...timers.values()])f();await flush();
 if(mode==="hang")resolveLater([{name:ns+"::amg_hechos_db"}]);
 if(mode==="lateReject")rejectLater(Error("late"));
 await flush();last={events:events.slice(),timers:timers.size};
 if(events.join(",")===want && timers.size===0)pass++;
 }result[label].push({name,want,pass,total:20,last});}
 }return result;
}

function patchOpen(s){
 const a='        req.onblocked = function () { _hechosPendientes("bloqueado"); };\n        req.onupgradeneeded = function (ev) {';
 const b='        var vencido = false;\n        var limite = setTimeout(function () {\n          vencido = true;\n          _hechosPendientes("error-lectura");\n        }, 8000);\n        req.onblocked = function () { if (!vencido) _hechosPendientes("bloqueado"); };\n        req.onupgradeneeded = function (ev) {\n          clearTimeout(limite);';
 const c='          _hechosPendientes("sin-almacen");\n        };\n        req.onerror = function () { if (!omitido) _hechosPendientes("error-lectura"); };\n        req.onsuccess = function () {\n          var db = req.result;\n          if (!_hechosSesionVigente()) { db.close(); return; }';
 const d='          if (!vencido) _hechosPendientes("sin-almacen");\n        };\n        req.onerror = function () { clearTimeout(limite); if (!omitido && !vencido) _hechosPendientes("error-lectura"); };\n        req.onsuccess = function () {\n          clearTimeout(limite);\n          var db = req.result;\n          if (vencido || !_hechosSesionVigente()) { db.close(); return; }';
 for(const [x,y] of [[a,b],[c,d]]){if(s.split(x).length!==2)throw Error("anchor");s=s.replace(x,y);}return s;
}
async function runOpen(s,patch){
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

function combined(s){return patch(patchOpen(patchList(s)));}
async function runCombined(s){return {list:await runList(s,combined),open:await runOpen(s,combined)};}

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

async function all(s){return {...await runCombined(s),read:await run(s,combined)};}
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='c82edfe4a008182f20f69536d1a7000ef0b9410f')throw Error('wrong blob');all(s).then(r=>{console.log(JSON.stringify(r,null,2));if(Object.values(r).some(v=>v.candidate.some(x=>x.pass!==x.total)))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
