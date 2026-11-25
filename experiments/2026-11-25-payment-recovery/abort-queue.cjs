'use strict';
// Exact source extracts from v931 docs/hechos.js blob c32397ff26db5cae625d71d3fc7efdafc78663b9. Isolated experiment; no production data.
const assert=require('node:assert/strict');
const save="  function guardar(hecho) {\n    return abrirDB().then(function (db) {\n      return new Promise(function (resolve, reject) {\n        var tx = db.transaction(STORE, \"readwrite\");\n        var fallo = null;\n        var req = tx.objectStore(STORE).add(hecho); // nunca sobrescribir un hecho existente\n        req.onerror = function () { fallo = req.error; };\n        tx.oncomplete = function () { resolve(hecho); };\n        tx.onerror = function () { reject(fallo || tx.error); };\n      });\n    });\n  }\n\n";
const register="  function registrar(tipo, datos, opciones) {\n    _cola = _cola.then(function () { return construirYGuardar(tipo, datos, 0, opciones); }).catch(function (e) {\n      // Fase A nunca puede tumbar la app: si algo falla, se anota y se sigue.\n      try { console.warn(\"[hechos] no se pudo registrar:\", e && e.message); } catch (_) {}\n      return null;\n    });\n    return _cola;\n  }\n\n";
const patched="  function guardar(hecho) {\n    return abrirDB().then(function (db) {\n      return new Promise(function (resolve, reject) {\n        var tx = db.transaction(STORE, \"readwrite\");\n        var fallo = null;\n        var req = tx.objectStore(STORE).add(hecho); // nunca sobrescribir un hecho existente\n        req.onerror = function () { fallo = req.error; };\n        tx.oncomplete = function () { resolve(hecho); };\n        tx.onerror = function () { reject(fallo || tx.error); };\n        tx.onabort = function () { reject(fallo || tx.error || new DOMException(\"hecho abortado\", \"AbortError\")); };\n      });\n    });\n  }\n\n";
async function testMock(save,register,patched){
 const results=[];
 for(const [mode,code] of [["RED",save],["GREEN",patched]]){
  let txs=[],log=[];
  const db={transaction(){const tx={error:null,objectStore:()=>({add:()=>({})})};txs.push(tx);return tx}};
  const guardar=new Function("abrirDB","STORE","DOMException",code+"\nreturn guardar;")(()=>Promise.resolve(db),"hechos",class extends Error{constructor(m,n){super(m);this.name=n}});
  const reg=new Function("construirYGuardar","console","var _cola=Promise.resolve();\n"+register+"\nreturn registrar;")((tipo,datos)=>guardar({tipo,datos}),{warn:(...a)=>log.push(a.join(" "))});
  let first="pending",second="pending";
  reg("cartera_abono",{n:1}).then(x=>{first=x===null?"rejected":"committed"});
  for(let i=0;i<30;i++)await Promise.resolve();
  if(txs.length!==1)throw Error("expected first tx");
  if(typeof txs[0].onabort==="function")txs[0].onabort();
  reg("cartera_abono",{n:2}).then(x=>{second=x===null?"rejected":"committed"});
  for(let i=0;i<60;i++)await Promise.resolve();
  if(txs[1])txs[1].oncomplete();
  for(let i=0;i<60;i++)await Promise.resolve();
  results.push({mode,first,second,transactions:txs.length,log});
 }
 if(results[0].first!=="pending"||results[0].transactions!==1||results[1].first!=="rejected"||results[1].second!=="committed"||results[1].transactions!==2)throw Error(JSON.stringify(results));
 return results;
}
async function native({save,register,patched}){
 const out=[];
 for(const [mode,code] of [["RED",save],["GREEN",patched]]){
 const STORE="hechos";
 const db=await new Promise((res,rej)=>{const r=indexedDB.open("f123-abort-fixture-"+mode,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:"id"});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
 let abortNext=true,aborted=0,errors=0,completed=0,txs=0;
 const dbWrapper={transaction:(...args)=>{txs++;const tx=db.transaction(...args);tx.addEventListener("abort",()=>aborted++);tx.addEventListener("error",()=>errors++);tx.addEventListener("complete",()=>completed++);return {objectStore:name=>({add:fact=>{const req=tx.objectStore(name).add(fact);if(abortNext){abortNext=false;req.addEventListener("success",()=>tx.abort());}return req;}}),set oncomplete(f){tx.oncomplete=f},set onerror(f){tx.onerror=f},set onabort(f){tx.onabort=f},get error(){return tx.error}};}};
 const guardar=new Function("abrirDB","STORE",code+"\nreturn guardar;")(()=>Promise.resolve(dbWrapper),STORE);
 const registrar=new Function("construirYGuardar","var _cola=Promise.resolve();\n"+register+"\nreturn registrar;")((tipo,datos)=>guardar({id:datos.id,tipo,datos}));
 const bound=p=>Promise.race([p.then(x=>x===null?"rejected":"committed"),new Promise(r=>setTimeout(()=>r("pending"),1000))]);
 const first=await bound(registrar("cartera_abono",{id:"one"}));const second=await bound(registrar("cartera_abono",{id:"two"}));
 const ids=await new Promise((res,rej)=>{const req=db.transaction(STORE).objectStore(STORE).getAllKeys();req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)});
 out.push({mode,first,second,aborted,errors,completed,txs,ids});db.close();
 }
 return out;
}
(async()=>{
 console.log('EVENT HARNESS',JSON.stringify(await testMock(save,register,patched)));
 if(!process.argv.includes('--native'))return;
 const {chromium,webkit}=require('playwright');
 const server=require('node:http').createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>synthetic fixture</title>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{for(const engine of [chromium,webkit]){const browser=await engine.launch();try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);const result=await page.evaluate(native,{save,register,patched});console.log(engine.name(),JSON.stringify(result));assert.equal(result[0].aborted,1);assert.equal(result[0].errors,0);assert.equal(result[0].first,'pending');assert.equal(result[0].second,'pending');assert.deepEqual(result[0].ids,[]);assert.equal(result[1].first,'rejected');assert.equal(result[1].second,'committed');assert.deepEqual(result[1].ids,['two']);}finally{await browser.close()}}}finally{await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
