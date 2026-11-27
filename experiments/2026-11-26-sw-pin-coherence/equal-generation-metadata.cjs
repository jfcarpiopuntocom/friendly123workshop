'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'client-id-bypass.cjs'),'utf8');
const fixture=fs.readFileSync(path.join(__dirname,'equal-generation-bytes.cjs'),'utf8');
const original=JSON.parse(source.split('const original=')[1].split(';\nconst candidate=')[0]);
const base=original.replace('recursoVersionado && evento.clientId)', 'recursoVersionado)').replace('const nombre = await leerShellDeDocumento(evento.clientId);','const nombre = evento.clientId ? await leerShellDeDocumento(evento.clientId) : null;');
const expression=fixture.split('const candidate=base.replace(')[1].split(');\nassert.notEqual')[0];
const candidate=new Function('base','return base.replace('+expression+')')(base);
const fixed=candidate.replace('const bytes = await Promise.all(copias.map(c => c.clone().arrayBuffer()));',`const firma = c => JSON.stringify([c.status, c.statusText, [...c.headers].sort((a,b)=>a[0].localeCompare(b[0]))]);
  if (!copias.every(c => firma(c) === firma(copias[0]))) return respuestaOffline();
  const bytes = await Promise.all(copias.map(c => c.clone().arrayBuffer()));`);
assert.notEqual(candidate,fixed);
async function run(src,headers){
  let handler,p,network=0,writes=0;
  const self={location:{origin:'https://fixture.invalid'},registration:{scope:'https://fixture.invalid/app/'},addEventListener:(n,h)=>handler=h};
  const names=['f123-shell-v931','f123-shell-v930'];
  const response=k=>new Response('SAME',{headers:headers[names.indexOf(k)]});
  const local={match:async()=>response(names[0]),put:async()=>{writes++}};
  const caches={open:async()=>local,match:async(req,o)=>response(o.cacheName),keys:async()=>names};
  new Function('self','HOSTS_PERMITIDOS','SHELL','CACHE_LOCAL','CACHE','caches','abrirCacheLocal','leerShellDeDocumento','esDeMiCanal','fetch','URL','Response',src)(self,[self.location.origin],['./app.js'],names[0],'v931',caches,async()=>local,async()=>null,()=>true,async()=>{network++;return new Response('NEW')},URL,Response);
  handler({request:{url:self.registration.scope+'app.js',method:'GET',mode:'cors'},clientId:'',respondWith:x=>p=x});
  const r=await p;return {status:r.status,network,writes};
}
const cases=[['same',{'content-type':'application/javascript'},{'content-type':'application/javascript'},200],['mime',{'content-type':'application/javascript'},{'content-type':'text/plain'},503],['csp',{'content-security-policy':"default-src 'none'"},{'content-security-policy':'default-src *'},503],['nosniff',{'x-content-type-options':'nosniff'},{},503],['header-order',{'content-type':'application/javascript','cache-control':'no-cache'},{'cache-control':'no-cache','content-type':'application/javascript'},200]];
(async()=>{for(const [name,a,b,expected] of cases){const before=await run(candidate,[a,b]),after=await run(fixed,[a,b]);assert.equal(before.status,200,name);assert.equal(after.status,expected,name);assert.equal(after.network,0);assert.equal(after.writes,0);console.log(name,JSON.stringify({before,after}));}})().catch(e=>{console.error(e);process.exitCode=1});
// Experimental: exact handler executed with V8 synthetic Response/URL/CacheStorage.
// Native Node replay of this file and browser acceptance remain pending.
// Strict metadata equality can reduce availability; manifest authenticity and generation races remain open.
