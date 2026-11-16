'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
test('imported Workbox registers the local worker without reloading the active page',async()=>{
  const file=path.join(__dirname,'../docs/vendor/workbox-imported.min.js');
  const server=http.createServer((req,res)=>{
    if(req.url==='/sw.js'){res.setHeader('Content-Type','application/javascript');return res.end('self.addEventListener("fetch",()=>{});');}
    if(req.url==='/adapter.js'){res.setHeader('Content-Type','application/javascript');return res.end(fs.existsSync(file)?fs.readFileSync(file):'');}
    res.setHeader('Content-Type','text/html');res.end('<script src="/adapter.js"></script><p>synthetic</p>');
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage();
    const origin='http://127.0.0.1:'+server.address().port;
    await page.goto(origin);
    assert.equal(await page.evaluate(()=>typeof window.F123WorkboxImported),'function');
    let navigations=0;page.on('framenavigated',()=>navigations++);
    const script=await page.evaluate(async()=>{const r=await window.F123WorkboxImported('./sw.js');await navigator.serviceWorker.ready;return (r.installing||r.waiting||r.active).scriptURL;});
    assert.equal(script,origin+'/sw.js');
    assert.equal(navigations,0);
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
