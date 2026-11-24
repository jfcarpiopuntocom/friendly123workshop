import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
const root='/lab-r12/';
const entries={
 'base-store.mjs':'../2026-11-24-sync4-r11/port2-typed-ops-idb-store.mjs',
 'fixed-store.mjs':'./store-candidate.mjs',
 'base-reconciler.mjs':'../2026-11-24-sync4-r11/product-candidate-reconciler.mjs',
 'fixed-reconciler.mjs':'./reconciler-candidate.mjs',
 'port2-typed-ops-client.mjs':'../../src/port2-typed-ops-client.mjs'
};
const payloads=new Map(await Promise.all(Object.entries(entries).map(async ([p,u])=>[root+p,await readFile(new URL(u,import.meta.url),'utf8')])));
for(const [browserName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
 const ctx=await browser.newContext({serviceWorkers:'block'});
 await ctx.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='http://localhost:8899')return route.abort();
  if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>R12 native fixtures</title>'});
  if(payloads.has(url.pathname))return route.fulfill({contentType:'text/javascript',body:payloads.get(url.pathname)});
  return route.abort();
 });
 const page=await ctx.newPage();await page.goto('http://localhost:8899/');
 const results=await page.evaluate(async root=>{
  const {createTypedOpsIdbStore:baseStore}=await import(root+'base-store.mjs');
  const {createTypedOpsIdbStore:fixedStore}=await import(root+'fixed-store.mjs');
  const {createTypedOpsReconciler:baseR}=await import(root+'base-reconciler.mjs');
  const {createTypedOpsReconciler:fixedR}=await import(root+'fixed-reconciler.mjs');
  let n=0;
  const ns=()=> (++n).toString(16).padStart(64,'0');
  const command=(opId='r12-sale-001',amountCents=1500)=>({license:'F123-TEST0001',opId,kind:'sale.record',productId:'sku1',quantity:1,amountCents});
  const row=(state='pending',c=command())=>({opId:c.opId,command:c,sameDoLocked:true,attempts:state==='quarantined'?3:1,state,createdAt:1,updatedAt:state==='quarantined'?3:1});
  async function run(makeStore,makeR,kind){
   const namespace=ns(),a=makeStore({indexedDB,namespace}),b=makeStore({indexedDB,namespace});
   const other=makeStore({indexedDB,namespace:ns()});
   await a.save(row());let posts=0,result=null,code=null;
   let rec=null;
   if(['stale-submit','stale-drain'].includes(kind)){
    rec=makeR({store:b,dispatch:async()=>{posts++;return {committed:true,stage:'business-committed',status:200,receipt:{opId:command().opId,license:command().license}};},isVisible:()=>true});
    await rec.ready();
   }
   if(kind==='settled')await a.markCommitted(command().opId);
   else await a.save(row('quarantined'));
   const snapshot=JSON.stringify(await a.loadAll());
   let rejected=false;
   try{
    if(kind==='stale-submit')result=await rec.submit(command());
    else if(kind==='stale-drain')result=(await rec.reconcileNow()).results[0];
    else if(kind==='other-namespace')await other.save(row());
    else if(kind==='other-op')await b.save(row('pending',command('r12-sale-002')));
    else if(kind==='same-quarantine')await b.save(row('quarantined'));
    else if(kind==='payload-conflict')await b.save(row('quarantined',command(undefined,9999)));
    else if(kind==='verified-commit-cleanup')await b.markCommitted(command().opId);
    else await b.save(row(kind==='settled'?'pending':kind));
   }catch(e){rejected=true;code=e.code||null;}
   const rows=await a.loadAll(),terminal=await a.loadCommittedOpIds();
   let pass;
   if(['pending','prepared','paused-auth-required','paused-retry-exhausted'].includes(kind))pass=rejected&&code==='TYPED_OPS_ALREADY_QUARANTINED'&&JSON.stringify(rows)===snapshot;
   else if(kind==='stale-submit'||kind==='stale-drain')pass=posts===0&&result?.quarantine===true&&result?.fallbackLegacy===false&&rec.quarantined().some(q=>q.opId===command().opId)&&JSON.stringify(rows)===snapshot;
   else if(kind==='other-namespace')pass=!rejected&&(await other.loadAll()).length===1&&JSON.stringify(rows)===snapshot;
   else if(kind==='other-op')pass=!rejected&&rows.length===2&&rows.find(r=>r.opId===command().opId)?.state==='quarantined';
   else if(kind==='same-quarantine')pass=!rejected&&JSON.stringify(rows)===snapshot;
   else if(kind==='payload-conflict')pass=rejected&&JSON.stringify(rows)===snapshot;
   else if(kind==='settled')pass=rejected&&code==='TYPED_OPS_ALREADY_SETTLED'&&rows.length===0&&terminal.includes(command().opId);
   else if(kind==='verified-commit-cleanup')pass=!rejected&&rows.length===0&&terminal.includes(command().opId);
   rec?.destroy();
   return {pass,rejected,code,posts,result,remaining:rows.map(r=>({opId:r.opId,state:r.state,attempts:r.attempts})),terminal};
  }
  const cases=['pending','prepared','paused-auth-required','paused-retry-exhausted','stale-submit','stale-drain','other-namespace','other-op','same-quarantine','payload-conflict','settled','verified-commit-cleanup'];
  const rows=[];
  for(const kind of cases)rows.push({kind,baseline:await run(baseStore,baseR,kind),candidate:await run(fixedStore,fixedR,kind)});
  return {baseline:rows.filter(x=>x.baseline.pass).length,candidate:rows.filter(x=>x.candidate.pass).length,total:rows.length,rows};
 },root);
 console.log(JSON.stringify({browser:browserName,...results},null,2));
 if(results.baseline!==6||results.candidate!==12)process.exitCode=1;
 await ctx.close();
 }finally{await browser.close();}
}
