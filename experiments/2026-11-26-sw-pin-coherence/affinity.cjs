'use strict';
// Workshop only; exact functions extracted from friendly-123 94b0e5f8f89e29cf6c4174c07befbde9cf2ca960, docs/sw.js:413-436.
// This proves cross-worker in-memory stale reads, not the cause of the full WebKit failure.
// Run: node experiments/2026-11-26-sw-pin-coherence/affinity.cjs
// Optional: same command --native (Playwright Chromium and WebKit installed).
const assert=require('node:assert/strict');
const original="function cacheDeAfinidad() { return \"f123-shell-client-pins\" + CANAL; }\nfunction claveDeDocumento(id) {\n  return new URL(\"./__f123_client_shell__/\" + encodeURIComponent(id), self.registration.scope).href;\n}\nconst afinidadesDocumento = new Map();\nasync function leerShellDeDocumento(id) {\n  if (!id) return null;\n  if (!afinidadesDocumento.has(id)) {\n    const lectura = (async () => {\n      const r = await (await caches.open(cacheDeAfinidad())).match(claveDeDocumento(id));\n      if (!r) return null;\n      const nombre = await r.text();\n      return nombre === \"?\" || esDeMiCanal(nombre) && /^f123-shell-v[0-9]+(?:-|$)/.test(nombre) ? nombre : \"?\";\n    })();\n    afinidadesDocumento.set(id, lectura);\n    lectura.catch(() => { if (afinidadesDocumento.get(id) === lectura) afinidadesDocumento.delete(id); });\n  }\n  return afinidadesDocumento.get(id);\n}\nasync function fijarShellDeDocumento(id, nombre) {\n  if (!id) return;\n  await (await caches.open(cacheDeAfinidad())).put(claveDeDocumento(id), new Response(nombre));\n  afinidadesDocumento.set(id, Promise.resolve(nombre));\n}\n";
const candidate="function cacheDeAfinidad() { return \"f123-shell-client-pins\" + CANAL; }\nfunction claveDeDocumento(id) {\n  return new URL(\"./__f123_client_shell__/\" + encodeURIComponent(id), self.registration.scope).href;\n}\nasync function leerShellDeDocumento(id) {\n  if (!id) return null;\n  const r = await (await caches.open(cacheDeAfinidad())).match(claveDeDocumento(id));\n  if (!r) return null;\n  const nombre = await r.text();\n  return nombre === \"?\" || esDeMiCanal(nombre) && /^f123-shell-v[0-9]+(?:-|$)/.test(nombre) ? nombre : \"?\";\n}\nasync function fijarShellDeDocumento(id, nombre) {\n  if (!id) return;\n  await (await caches.open(cacheDeAfinidad())).put(claveDeDocumento(id), new Response(nombre));\n}\n";
const exercise=async function exercise(code,cacheStorage,ResponseType,URLType,scope,label){
 const make=()=>new Function("caches","Response","URL","self","CANAL","esDeMiCanal",code+"\nreturn {leerShellDeDocumento,fijarShellDeDocumento}")(cacheStorage,ResponseType,URLType,{registration:{scope}},label,n=>!n.endsWith("-next"));
 const A=make(),B=make(),out={};
 const old="f123-shell-v931-golden469",next="f123-shell-v933-golden471";
 out.missing=await B.leerShellDeDocumento("doc");
 await A.fijarShellDeDocumento("doc",old);out.afterMissing=await B.leerShellDeDocumento("doc");
 await A.fijarShellDeDocumento("existing",old);out.initial=await B.leerShellDeDocumento("existing");
 await A.fijarShellDeDocumento("existing",next);out.afterWrite=await B.leerShellDeDocumento("existing");
 await A.fijarShellDeDocumento("other","f123-shell-v100-golden1-next");out.channel=await B.leerShellDeDocumento("other");
 out.empty=await B.leerShellDeDocumento("");out.fresh=await make().leerShellDeDocumento("existing");return out;
};
const mock=async function mock(code,exercise){
 const buckets=new Map();
 const cacheStorage={open:async name=>{if(!buckets.has(name))buckets.set(name,new Map());const m=buckets.get(name);return{match:async k=>m.get(k),put:async(k,v)=>m.set(k,v)}}};
 class R{constructor(v){this.v=v}async text(){return this.v}}
 class U{constructor(p,b){this.href=b+p}}
 return exercise(code,cacheStorage,R,U,"https://fixture.invalid/app/","-fixture");
};
const redExpected={"missing":null,"afterMissing":null,"initial":"f123-shell-v931-golden469","afterWrite":"f123-shell-v931-golden469","channel":"?","empty":null,"fresh":"f123-shell-v933-golden471"};
const greenExpected={"missing":null,"afterMissing":"f123-shell-v931-golden469","initial":"f123-shell-v931-golden469","afterWrite":"f123-shell-v933-golden471","channel":"?","empty":null,"fresh":"f123-shell-v933-golden471"};
(async()=>{
 const red=await mock(original,exercise),green=await mock(candidate,exercise);
 assert.deepEqual(red,redExpected);assert.deepEqual(green,greenExpected);
 console.log('RED',JSON.stringify(red));console.log('GREEN',JSON.stringify(green));
 if(!process.argv.includes('--native'))return;
 const {chromium,webkit}=require('playwright'),http=require('node:http');
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>synthetic</title>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{for(const engine of [chromium,webkit]){const browser=await engine.launch();try{const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
 for(const [label,code,expected] of [['red',original,redExpected],['green',candidate,greenExpected]]){
 const actual=await page.evaluate(async ({code,label,exerciseSource})=>{const exercise=new Function('return ('+exerciseSource+')')();return exercise(code,caches,Response,URL,location.origin+'/app/','-'+label)},{code,label,exerciseSource:exercise.toString()});
 assert.deepEqual(actual,expected);console.log(engine.name(),label,JSON.stringify(actual));
 }
 }finally{await browser.close()}}}finally{await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
