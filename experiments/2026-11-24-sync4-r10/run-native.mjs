// R10b native IndexedDB in isolated Playwright origins; no production traffic.
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root='/experiments/2026-11-24-sync4-r10/';
const sources=new Map([
 ['/src/port2-typed-ops-reconciler.mjs',new URL('../../src/port2-typed-ops-reconciler.mjs',import.meta.url)],
 ['/src/port2-typed-ops-idb-store.mjs',new URL('../../src/port2-typed-ops-idb-store.mjs',import.meta.url)],
 ['/src/port2-typed-ops-client.mjs',new URL('../../src/port2-typed-ops-client.mjs',import.meta.url)],
 [root+'candidate-r10b/port2-typed-ops-reconciler.mjs',new URL('./candidate-r10b/port2-typed-ops-reconciler.mjs',import.meta.url)],
 [root+'scenarios.mjs',new URL('./scenarios.mjs',import.meta.url)]
]);
const payloads=new Map(await Promise.all([...sources].map(async ([p,u])=>[p,await readFile(fileURLToPath(u),'utf8')])));
const cases=[['settled',false],['settled',true],['inflight',false],['quarantine',false],['pending',false],['retry-later',false],['submit-pending',false],['timer-pending',false],['serial',false],['hidden',false]];
const results=[];
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*', async route=>{
   const url=new URL(route.request().url());
   if(url.origin!=='http://localhost:8899')return route.abort();
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>R10 native IDB fixture</title>'});
   if(payloads.has(url.pathname))return route.fulfill({contentType:'text/javascript',body:payloads.get(url.pathname)});
   return route.abort();
  });
  const page=await context.newPage();
  await page.goto('http://localhost:8899/');
  const rows=await page.evaluate(async ({cases,root})=>{
    if(!window.indexedDB)throw Error('native IndexedDB unavailable');
    const {createTypedOpsIdbStore}=await import('/src/port2-typed-ops-idb-store.mjs');
    const {createTypedOpsReconciler:original}=await import('/src/port2-typed-ops-reconciler.mjs');
    const {createTypedOpsReconciler:candidate}=await import(root+'candidate-r10b/port2-typed-ops-reconciler.mjs');
    const {exerciseFull}=await import(root+'scenarios.mjs');
    let n=0;const makeStore=()=>createTypedOpsIdbStore({indexedDB:window.indexedDB,namespace:(++n).toString(16).padStart(64,'0')});
    const results=[];
    for(const [kind,reverse] of cases) {
      const baseline=await exerciseFull(original,makeStore(),kind,reverse);
      const green=await exerciseFull(candidate,makeStore(),kind,reverse);
      results.push({kind,reverse,baseline,candidate:green});
    }
    return results;
  },{cases,root});
  const summary={browser:name,baseline:rows.filter(r=>r.baseline.pass).length,candidate:rows.filter(r=>r.candidate.pass).length,total:rows.length,results:rows};
  results.push(summary);console.log(JSON.stringify(summary,null,2));
  if(summary.baseline!==2||summary.candidate!==10)process.exitCode=1;
  await context.close();
 }finally{await browser.close();}
}
if(results.length!==2)process.exitCode=1;
