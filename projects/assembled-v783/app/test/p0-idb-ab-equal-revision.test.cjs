'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const project=path.join(__dirname,'..');
const {browser}=require(path.join(project,'test/helpers/browser.cjs'));
const owner=w=>{w.OCAuth={rolActual:()=> 'dueno'};return w;};
const entries=w=>Array.from({length:w.localStorage.length},(_,i)=>{
 const k=w.localStorage.key(i);
 return [k,w.localStorage.getItem(k)];
});
function fork(w){
 const duplicate=browser();
 for(const [k,value] of entries(w)) duplicate.localStorage.setItem(k,value);
 return owner(browser(duplicate.localStorage));
}
const saved=w=>JSON.parse(w.localStorage.getItem('f123_estado_v4_'+w.localStorage.getItem('f123_estado_v4_ptr')));
const load=name=>fs.readFileSync(path.join(project,'docs',name),'utf8');
const server=http.createServer((_req,res)=>res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>QA</title>'));
test('equal revisions from distinct commits preserve both notebooks and stop a divergent write', {timeout:50000}, async()=>{
 const base=owner(browser());
 const item=await base.request('/api/productos','POST',{nombre:'Pieza QA',barcode:'QA-IDB-TIE',precio:19,stockInicial:8});
 const a=fork(base), b=fork(base);
 const salePath='/api/productos/'+item.id+'/venta';
 await a.request(salePath,'POST',{cantidad:1});
 const saleB=await b.request(salePath,'POST',{cantidad:2});
 const ab=saved(a),idb=saved(b);
 assert.equal(ab._rev,idb._rev);
 assert.notEqual(ab._abCommit,idb._abCommit);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let ch;
 try {
  ch=await chromium.launch({headless:true});
  const page=await ch.newPage({serviceWorkers:'block'});
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'commit',timeout:9000});
  await page.evaluate(pairs=>{
   for(const [k,value] of pairs) localStorage.setItem(k,value);
   window.OCAuth={rolActual:()=> 'dueno'};
   window.OCSecure={estadoSecreto:()=> 'ok',leePinsVisibles:()=>null};
  },entries(a));
  await page.addScriptTag({content:['estado-ab.js','estado-idb.js','core/payout-ledger.js','core/business-read-model.js'].map(load).join('\n;\n')});
  const savedInIdb=await page.evaluate(async ({ab,idb})=>{
   await OCEstadoIDB.guardarYa(idb);
   const inferred={...ab,_rev:ab._rev+1};
   const rejected=await OCEstadoIDB.guardarConRevision(inferred,ab._rev,ab._abCommit);
   return {accepted:rejected,exact:(await OCEstadoIDB.leer())._abCommit===idb._abCommit};
  },{ab,idb});
  assert.deepEqual(savedInIdb,{accepted:false,exact:true});
  await page.addScriptTag({content:load('mock-backend.js')});
  await page.waitForFunction(()=>window.__ocFallos?.some(f=>f[1]==='ab-conflicto'),null,{timeout:7500,polling:40});
  const actual=await page.evaluate(async ({salePath,rev,commit,id})=>{
   const failed=await fetch(salePath,{method:'POST',body:'{"cantidad":1}'});
   const exported=await (await fetch('/api/respaldo/exportar')).json();
   const evidence=exported.recuperacionAB.copias;
   const sibling=evidence.find(copy=>copy.clave==='IndexedDB');
   const disk=await OCEstadoIDB.leer();
   return {status:failed.status,exported:JSON.parse(sibling.raw)._abCommit===commit,
     intact:disk._rev===rev&&disk._abCommit===commit&&disk.ventas.some(s=>s.id===id)};
  },{salePath,rev:idb._rev,commit:idb._abCommit,id:saleB.ventaId});
  assert.deepEqual(actual,{status:507,exported:true,intact:true});
 } finally {await ch?.close();server.closeAllConnections();server.close();}
});
