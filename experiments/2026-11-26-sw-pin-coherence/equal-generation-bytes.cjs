'use strict';
// Experimental only: exact #1115 handler from sibling fixture; no browser certification.
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'client-id-bypass.cjs'),'utf8');
const original=JSON.parse(source.split('const original=')[1].split(';\nconst candidate=')[0]);
const base=original.replace('recursoVersionado && evento.clientId)', 'recursoVersionado)').replace('const nombre = await leerShellDeDocumento(evento.clientId);','const nombre = evento.clientId ? await leerShellDeDocumento(evento.clientId) : null;');
const candidate=base.replace('if (anteriores.length) return respuestaOffline();',`if (anteriores.length) {
  const copias = await Promise.all([CACHE_LOCAL, ...anteriores].map(cacheName =>
    caches.match(evento.request, { cacheName, ignoreSearch: true })));
  if (copias.some(c => !c || !c.ok)) return respuestaOffline();
  const bytes = await Promise.all(copias.map(c => c.clone().arrayBuffer()));
  const a = new Uint8Array(bytes[0]);
  if (!bytes.every(b => b.byteLength === a.length && new Uint8Array(b).every((v,i)=>v===a[i]))) return respuestaOffline();
  return limpiarRedireccion(copias[0]);
}`);
assert.notEqual(base,candidate);
async function run(src,values,query="",id="",pin=null){
  let handler,p,network=0,writes=0;
  const self={location:{origin:"https://fixture.invalid"},registration:{scope:"https://fixture.invalid/app/"},addEventListener:(n,h)=>handler=h};
  const response=k=>values[k]==null?null:new Response(values[k]);
  const local={match:async()=>response("f123-shell-v931"),put:async()=>{writes++}};
  const caches={open:async()=>local,match:async(req,opts)=>response(opts?.cacheName),keys:async()=>Object.keys(values)};
  const fetch=async()=>{network++;return new Response("NEW")};
  new Function("self","HOSTS_PERMITIDOS","SHELL","CACHE_LOCAL","CACHE","caches","abrirCacheLocal","leerShellDeDocumento","esDeMiCanal","fetch","URL","Response",src)(self,[self.location.origin],["./app.js"],"f123-shell-v931","v931",caches,async()=>local,async()=>pin,()=>true,fetch,URL,Response);
  handler({request:{url:self.registration.scope+"app.js"+query,method:"GET",mode:"cors"},clientId:id,respondWith:x=>p=x});
  const z=await p;return {status:z.status,body:await z.text(),network,writes};
}
const cases=[
["equal",{"f123-shell-v931":"SAME","f123-shell-v930":"SAME"},"","",null,200,503,"SAME"],
["equal-query",{"f123-shell-v931":"SAME","f123-shell-v930":"SAME"},"?v=old","",null,200,503,"SAME"],
["different",{"f123-shell-v931":"NEW","f123-shell-v930":"OLD"},"","",null,503,503],
["missing",{"f123-shell-v931":"SAME","f123-shell-v930":null},"","",null,503,503],
["three-different",{"f123-shell-v931":"SAME","f123-shell-v930":"SAME","f123-shell-v929":"OTHER"},"","",null,503,503],
["pinned-old",{"f123-shell-v931":"NEW","f123-shell-v930":"OLD"},"","doc","f123-shell-v930",200,200,"OLD"],
["unknown-pin",{"f123-shell-v931":"SAME","f123-shell-v930":"SAME"},"","doc","?",503,503]];
(async()=>{for(const [name,v,q,id,pin,expected,beforeStatus,body] of cases){
const before=await run(base,v,q,id,pin),after=await run(candidate,v,q,id,pin);
assert.equal(before.status,beforeStatus,name);assert.equal(after.status,expected,name);
assert.equal(after.network,0);assert.equal(after.writes,0);
if(body)assert.equal(after.body,body);console.log(name,JSON.stringify({before,after}));
}})().catch(e=>{console.error(e);process.exitCode=1});
// Equal bytes are not proof of manifest authenticity or equivalent MIME/CSP headers.
// Before promotion: verify manifests, response metadata, cache generation races, native worker/importScripts,
// module/preload and dashboard, and bound memory/latency for large resources. No production wiring.
