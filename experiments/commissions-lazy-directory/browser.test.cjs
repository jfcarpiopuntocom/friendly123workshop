'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const variants=require('./variants.cjs'),{chromium,webkit}=require('playwright');
const results=[];
const p95=a=>a.slice().sort((x,y)=>x-y)[Math.ceil(a.length*.95)-1];
for(const [engine,browserType] of Object.entries({chromium,webkit}))test(engine+' directory benchmark and behavior',{timeout:600000},async()=>{
 const browser=await browserType.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  for(const [variant,source] of Object.entries(variants))for(const count of [8,100,1000]){
   const samples=[];
   for(let i=0;i<20;i++){
    await page.setContent('<div id="gestionPromotoras"></div><details data-comm-ranking-fold open><summary>By results</summary></details>');
    await page.evaluate(({source,count})=>{
     const people=Array.from({length:count},(_,i)=>({id:'p'+i,nombre:'Agent '+i,telefono:'555'+i,cedula:'ID'+i,comisionBase:i%100,notas:'synthetic'}));
     window.calls=[];window.edits=[];window.confirms=[];
     window.t=k=>k;window.tf=(k,a)=>k+JSON.stringify(a);
     const env={API:'/api',fetch:async(url,opt)=>{window.calls.push([url,opt?.method||'GET']);return{json:async()=>url==='/api/promotoras'?people:[]}},normalizarTexto:s=>String(s).toLowerCase(),escHtml:s=>String(s),abrirEditorComisionista:id=>window.edits.push(id),ocConfirm:async m=>{window.confirms.push(m);return false},ocAlert:async()=>{}};
     new Function(...Object.keys(env),'let _promotorasVivasCache=[];'+source+';window.renderGestionPromotoras=renderGestionPromotoras;')(...Object.values(env));
     window.people=people;
    },{source,count});
    const initial=await page.evaluate(async()=>{const t=performance.now();await window.renderGestionPromotoras();return {ms:performance.now()-t,cards:document.querySelectorAll('.comm-agent-row').length,nodes:document.querySelectorAll('#listaPromotoras *').length}});
    const fold=page.locator('[data-comm-directory-fold]'),summary=fold.locator(':scope > summary'),cards=page.locator('.comm-agent-row'),search=page.locator('#promBuscar');
    assert.equal(await fold.count(),1);assert.equal(await fold.evaluate(e=>e.open),variant==='A');assert.equal(initial.cards,variant==='C'?0:count);
    const start=await page.evaluate(()=>performance.now());
    if(variant!=='A')await summary.click();
    await cards.first().waitFor({state:'visible'});
    const openMs=await page.evaluate(t=>performance.now()-t,start);
    assert.equal(await cards.count(),count);
    await search.fill('Agent 0');assert.equal(await cards.count(),1);
    await page.locator('[data-abrir-promotora="p0"]').click();await page.locator('[data-archivar-promotora="p0"]').click();
    assert.deepEqual(await page.evaluate(()=>window.edits),['p0']);assert.equal(await page.evaluate(()=>window.confirms.length),1);
    await summary.click();assert.equal(await search.isVisible(),false);
    assert.equal(await page.locator('#btnAltaPromotora').isVisible(),true);
    assert.equal(await page.locator('[data-comm-ranking-fold]').evaluate(e=>e.open),true);
    const repaint=await page.evaluate(async()=>{window.people[0].notas='updated while closed';const t=performance.now();await window.renderGestionPromotoras();return {ms:performance.now()-t,cards:document.querySelectorAll('.comm-agent-row').length}});
    assert.equal(await fold.evaluate(e=>e.open),false);assert.equal(repaint.cards,variant==='C'?0:1);
    await summary.click();await cards.first().waitFor({state:'visible'});assert.equal(await search.inputValue(),'Agent 0');assert.equal(await cards.count(),1);assert.match(await cards.first().innerText(),/updated while closed/);
    assert.ok((await page.evaluate(()=>window.calls)).every(c=>c[1]==='GET'));assert.equal(await page.evaluate(()=>window.calls.length),6);
    samples.push({initial,openMs,repaint});
   }
   results.push({engine,variant,count,iterations:20,initialCards:samples[0].initial.cards,initialCardNodes:samples[0].initial.nodes,p95InitialMs:p95(samples.map(x=>x.initial.ms)),p95OpenWallMs:p95(samples.map(x=>x.openMs)),p95ClosedRepaintMs:p95(samples.map(x=>x.repaint.ms))});
   console.log(JSON.stringify(results.at(-1)));
   fs.writeFileSync('commissions-lazy-browser-results.json',JSON.stringify(results,null,2));
  }
  await page.close();
 }finally{await browser.close()}
});
