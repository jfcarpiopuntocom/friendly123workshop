'use strict';
// P0: run with Playwright installed in the invoking environment.
// node bench.cjs /path/to/v925/docs /path/to/v926/docs
// Compare equivalent independent-group interactions; v920 predates C251.
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium,webkit} = require('playwright');
const [before,after]=process.argv.slice(2);
if(!before||!after) throw new Error('Usage: node bench.cjs <v925 docs dir> <v926 docs dir>');
const sales=Array.from({length:400},(_,i)=>({
 id:'perf-s-'+i,fecha:'2026-11-21',cantidad:1,precioUnit:25,
 productoId:'perf-p-'+i,productoNombre:'Perf Item '+i,sku:'SKU-'+i,
 ubicacionId:'perf-u-'+(i%30),ubicacionNombre:'Rack '+(i%30),
 clienteId:'perf-c-'+(i%120),clienteNombre:'Customer '+(i%120),
 promotoraId:'perf-a-'+(i%30),asociadoNombre:'Artist '+(i%30),
 comisionAsociado:5,netoCasa:20,comisionPendiente:5,
 direccionComision:'casaPaga',direccionProducto:'casaPaga',formaPago:'cash'
}));
function stats(xs){const v=[...xs].sort((a,b)=>a-b);return {n:v.length,median:(v[Math.floor((v.length-1)/2)]+v[Math.ceil((v.length-1)/2)])/2,p95:v[Math.ceil(v.length*.95)-1],samples:xs};}
async function sample(browser,dir){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await page.route(/^https?:\/\//,r=>r.abort());
  await page.goto(pathToFileURL(path.resolve(dir,'index.html')).href,{waitUntil:'load',timeout:30000});
  await page.waitForFunction(()=>window.__ocMockBackendReady&&typeof window.resumenComisionesGlobalHtml==='function'&&typeof window.cambiarRangoComisionesGlobal==='function'&&!!window.F123CommissionsByPerson,{},{timeout:30000});
  await page.addStyleTag({content:'#oc-gate,#puerta,#oc-splash{display:none!important;pointer-events:none!important}#vista-comisiones{display:block!important}'});
  await page.evaluate(s=>{
   window.OCAuth=Object.assign(window.OCAuth||{},{rolActual:()=> 'dueno',esDemo:()=>false});
   window._ocComFiltrosAbiertos={};window._ocComFiltros={comisionista:[],producto:[],percha:[],cliente:[]};
   window._ocComHistoryGroups=['producto'];window._ocComHistoryGroup='producto';window._ocComHistorySales=s;
   document.getElementById('listaComisiones').innerHTML=barraComisionesHtml([], '')+resumenComisionesGlobalHtml(s);
  },sales);
  const result=await page.evaluate(async()=>{
   const root=document.getElementById('listaComisiones');
   const raf=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   await raf();
   const primary=root.querySelector('[data-commissions-summary="all"]');
   const initialChecks=root.querySelectorAll('[data-com-filtro-lista] input[type=checkbox]').length;
   const initialNodes=root.querySelectorAll('*').length;
   const times=[],views=[];
   for(const g of ['percha','cliente','percha','cliente']){
    const button=root.querySelector('[data-commissions-view-global="'+g+'"]');
    if(!button)throw new Error('Missing toggle '+g);
    const t=performance.now();button.click();await raf();times.push(performance.now()-t);
    views.push([...root.querySelectorAll('[data-commissions-summary="all"]')].map(el=>el.dataset.commissionsCurrentView));
   }
   return {times,views,initialChecks,initialNodes,finalNodes:root.querySelectorAll('*').length,reusedPrimary:primary===root.querySelector('[data-commissions-summary="all"]')};
  });
  assert.deepEqual(result.views,[['producto','percha'],['producto','percha','cliente'],['producto','cliente'],['producto']]);
  return result;
 }finally{await page.close();}
}
(async()=>{
 const report={fixture:{sales:400,distinctSoldProducts:400,customers:120,racks:30,associates:30},notes:'Synthetic file-origin UI, external network blocked; not physical Safari, real login, cold join or full catalog benchmark.',engines:{}};
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch({headless:true});
  try{
   const old=[],fixed=[];
   await sample(browser,before);await sample(browser,after); // warm-up excluded
   for(let i=0;i<8;i++){
    if(i%2===0){old.push(await sample(browser,before));fixed.push(await sample(browser,after));}
    else{fixed.push(await sample(browser,after));old.push(await sample(browser,before));}
   }
   for(const x of fixed){assert.equal(x.initialChecks,0);assert.equal(x.reusedPrimary,true);}
   const a=stats(old.flatMap(x=>x.times)),b=stats(fixed.flatMap(x=>x.times));
   report.engines[engine.name()]={before:a,after:b,medianRatio:b.median/a.median,initialNodesBefore:old.map(x=>x.initialNodes),initialNodesAfter:fixed.map(x=>x.initialNodes),closedChecksBefore:old.map(x=>x.initialChecks),closedChecksAfter:fixed.map(x=>x.initialChecks)};
  }finally{await browser.close();}
 }
 console.log(JSON.stringify(report,null,2));
 // Hard structural gate above; timing reports separately until host calibration.
})().catch(e=>{console.error(e);process.exitCode=1;});
