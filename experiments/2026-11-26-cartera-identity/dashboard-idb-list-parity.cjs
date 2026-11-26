function patch(s){
 const old='Promise.resolve(indexedDB.databases()).then(function (bases) {\n            if (!_hechosSesionVigente()) return;\n            if (!Array.isArray(bases)) { _hechosPendientes("error-lectura"); return; }\n            var moderna = bases.some(function (b) { return b && b.name === "f123_hechos_db"; });\n            var vieja = bases.some(function (b) { return b && b.name === "amg_hechos_db"; });';
 const next='new Promise(function (resolve) {\n            var settled = false;\n            var timer = setTimeout(function () { done(null); }, 1500);\n            function done(bases) {\n              if (settled) return;\n              settled = true; clearTimeout(timer); resolve(bases);\n            }\n            try { Promise.resolve(indexedDB.databases()).then(done, function () { done(null); }); }\n            catch (_) { done(null); }\n          }).then(function (bases) {\n            if (!_hechosSesionVigente()) return;\n            if (!Array.isArray(bases)) { _abrirHechosActuales(); return; }\n            var iso = window.AMG && window.AMG.Aislamiento;\n            var prefijo = iso && iso.namespace ? String(iso.namespace) + "::" : "";\n            var moderna = bases.some(function (b) { return b && b.name === prefijo + "f123_hechos_db"; });\n            var vieja = bases.some(function (b) { return b && b.name === prefijo + "amg_hechos_db"; });';
 if(s.split(old).length!==2)throw Error("anchor mismatch"); return s.replace(old,next);
}
async function run(s,patch){
 const cases=[
 ["scoped modern","friendly-123",["friendly-123::f123_hechos_db"],"open"],
 ["scoped legacy","friendly-123",["friendly-123::amg_hechos_db"],"sin-migrar"],
 ["other namespace","friendly-123",["other::f123_hechos_db"],"sin-almacen"],
 ["raw ignored with isolation","friendly-123",["f123_hechos_db"],"sin-almacen"],
 ["raw legacy ignored","friendly-123",["amg_hechos_db"],"sin-almacen"],
 ["raw valid without isolation","",["f123_hechos_db"],"open"],
 ["empty list","friendly-123",[],"sin-almacen"],
 ["list rejected","friendly-123","reject","open"],
 ["list throws","friendly-123","throw","open"],
 ["invalid list","friendly-123","invalid","open"],
 ["unsupported listing","friendly-123","unsupported","open"],
 ["hanging list then late success","friendly-123","hang","open"],
 ["late rejected after timeout","friendly-123","lateReject","open"],
 ["session invalidated during listing","friendly-123","stale",""],
 ["session invalidated before timeout","friendly-123","staleHang",""]
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
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='c82edfe4a008182f20f69536d1a7000ef0b9410f')throw Error('wrong blob');run(s,patch).then(r=>{console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
