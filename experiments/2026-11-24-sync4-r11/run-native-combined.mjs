import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
const prefix='/experiments/2026-11-24-sync4-r11/';
const r10='/experiments/2026-11-24-sync4-r10/';
const names=['baseline.mjs','candidate.mjs','native-scenarios.mjs','product-baseline-reconciler.mjs','product-candidate-reconciler.mjs','port2-typed-ops-idb-store.mjs'];
const urls=new Map(names.map(n=>[prefix+n,new URL(n,import.meta.url)]));
urls.set(prefix+'port2-typed-ops-client.mjs',new URL('../../src/port2-typed-ops-client.mjs',import.meta.url));
urls.set(r10+'scenarios.mjs',new URL('../2026-11-24-sync4-r10/scenarios.mjs',import.meta.url));
const payloads=new Map(await Promise.all([...urls].map(async ([p,u])=>[p,await readFile(u,'utf8')])));
for(const [browserName,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='http://localhost:8899')return route.abort();
  if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Workshop R11 native fixtures</title>'});
  if(payloads.has(url.pathname))return route.fulfill({contentType:'text/javascript',body:payloads.get(url.pathname)});
  return route.abort();
 });
 const page=await context.newPage();
 await page.goto('http://localhost:8899/');
 const results=await page.evaluate(async ({prefix,r10})=>{
  const {createTypedOpsIdbStore}=await import(prefix+'port2-typed-ops-idb-store.mjs');
  const {createVerifiedCrossDeviceFailbackCoordinator:original}=await import(prefix+'baseline.mjs');
  const {createVerifiedCrossDeviceFailbackCoordinator:candidate}=await import(prefix+'candidate.mjs');
  const {createTypedOpsReconciler:baseR}=await import(prefix+'product-baseline-reconciler.mjs');
  const {createTypedOpsReconciler:fixedR}=await import(prefix+'product-candidate-reconciler.mjs');
  const {cases,runCase,deferred}=await import(prefix+'native-scenarios.mjs');
  const {exerciseFull}=await import(r10+'scenarios.mjs');
  let n=0;
  const newStore=()=>createTypedOpsIdbStore({indexedDB:window.indexedDB,namespace:(++n).toString(16).padStart(64,'0')});
  const summarize=rows=>({baseline:rows.filter(x=>x.baseline.pass).length,candidate:rows.filter(x=>x.candidate.pass).length,total:rows.length,rows});
  const native=[];
  for(const kind of cases)native.push({kind,baseline:await runCase(original,kind,newStore()),candidate:await runCase(candidate,kind,newStore())});
  const r10rows=[];
  for(const [kind,reverse] of [['settled',false],['settled',true],['inflight',false],['quarantine',false],['pending',false],['retry-later',false],['submit-pending',false],['timer-pending',false],['serial',false],['hidden',false]])r10rows.push({kind,reverse,baseline:await exerciseFull(baseR,newStore(),kind,reverse),candidate:await exerciseFull(fixedR,newStore(),kind,reverse)});
  async function combined(create,createR,kind){
   const native=newStore(),entered=deferred(),release=deferred(),sending=deferred(),releaseSend=deferred();
   let block=false,posts=0,visible=true;
   const store={...native,async loadAll(){const snapshot=await native.loadAll();if(block){block=false;entered.resolve();await release.promise;}return snapshot;}};
   const command={opId:'r11-sale-001',license:'F123-TEST0001',kind:'sale.record',productId:'sku1',quantity:1,amountCents:1500};
   const commit={committed:true,stage:'business-committed',status:200,receipt:{opId:command.opId,license:command.license}};
   const makeR=()=>createR({store,isVisible:()=>visible,dispatch:async()=>{posts++;if(kind==='late-fallback'||kind==='late-commit'){sending.resolve();await releaseSend.promise;}return kind==='late-fallback'?{fallbackLegacy:true,stage:'precondition-denied'}:commit;}});
   const rA=makeR(),rB=makeR(); await rA.ready();await rB.ready();
   const make=r=>create({store,reconciler:r,openCatalogSession:async()=>({frozenHead:'head-001',close(){},isActive(){return true}}),isVisible:()=>visible});
   const a=make(rA),b=make(rB);
   let res,pass;
   if(kind==='claim-during'||kind==='assert-claim-during'){
    await b.activate20();block=true;
    const p=kind==='claim-during'?a.canDispatchOnLegacy(command.opId):a.assertLegacyAllowed(command.opId).catch(e=>({allowed:false,code:e.code}));
    await entered.promise;const q=b.submitCommercial(command);release.resolve();res=await p;const ack=await q;
    pass=(kind==='claim-during'?res===false:res.allowed===false)&&ack.committed===true&&posts===1;
   }else if(kind==='submit-destroy'){
    await a.activate20();block=true;const p=a.submitCommercial(command);await entered.promise;a.destroy();release.resolve();res=await p;
    pass=res.fallbackLegacy===false&&posts===0;
   }else if(kind==='late-fallback'||kind==='late-commit'){
    await a.activate20();const p=a.submitCommercial(command);await sending.promise;a.destroy();releaseSend.resolve();res=await p;
    pass=kind==='late-fallback'?res.fallbackLegacy===false&&posts===1:res.committed===true&&posts===1;
   }else{
    await a.activate20();await a.failbackToLegacy('network');res=await a.submitCommercial(command);pass=res.fallbackLegacy===true&&posts===0;
   }
   const rows=await native.loadAll(),terminal=await native.loadCommittedOpIds();
   const expectCommit=['claim-during','assert-claim-during','late-commit'].includes(kind);
   pass=pass&&rows.length===0&&(expectCommit?terminal.includes(command.opId):terminal.length===0);
   a.destroy();b.destroy();
   return {pass,res,posts,pending:rows.length,terminal};
  }
  const combinedRows=[];
  for(const kind of ['claim-during','assert-claim-during','submit-destroy','late-fallback','late-commit','fresh-fallback'])combinedRows.push({kind,baseline:await combined(original,baseR,kind),candidate:await combined(candidate,fixedR,kind)});
  return {r11:summarize(native),r10:summarize(r10rows),combined:summarize(combinedRows)};
 },{prefix,r10});
 console.log(JSON.stringify({browser:browserName,...results},null,2));
 if(results.r11.baseline!==4||results.r11.candidate!==14||results.r10.baseline!==2||results.r10.candidate!==10||results.combined.baseline!==2||results.combined.candidate!==6)process.exitCode=1;
 await context.close();
 }finally{await browser.close();}
}
