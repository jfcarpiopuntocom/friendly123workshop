'use strict';
// Real Chromium and WebKit browser QA, exact reconstructed archival candidate.
// NO prod access, NO real license, synthetic sales, PWA intentionally blocked.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const clientRoot=process.env.F123_QA_CLIENT_ROOT;
if(!clientRoot||!path.isAbsolute(clientRoot))throw Error('EXACT_CANDIDATE_ROOT_REQUIRED');
const {chromium,webkit}=createRequire(path.join(clientRoot,'package.json'))('playwright');
const DOCS=path.join(process.env.F123_QA_CLIENT_ROOT||'', 'docs');
if(!process.env.F123_QA_CLIENT_ROOT||!path.isAbsolute(process.env.F123_QA_CLIENT_ROOT)
    ||!fs.existsSync(path.join(DOCS,'index.html')))throw Error('EXACT_CANDIDATE_ROOT_REQUIRED');
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8',
  '.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png',
  '.woff2':'font/woff2','.webp':'image/webp','.jpg':'image/jpeg'};
function server(){
  return http.createServer((req,res)=>{
    let pathname;
    try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{res.writeHead(400);res.end();return}
    const item=path.resolve(DOCS,'.'+(pathname==='/'?'/index.html':pathname));
    if(!item.startsWith(DOCS+path.sep) || !fs.existsSync(item) || !fs.statSync(item).isFile()){
      res.writeHead(404);res.end();return;
    }
    res.writeHead(200,{'Content-Type':MIME[path.extname(item)]||'application/octet-stream',
      'Cache-Control':'no-store'});
    res.end(fs.readFileSync(item));
  });
}
async function withPage(engine,fn){
  const srv=server();await new Promise(resolve=>srv.listen(0,'127.0.0.1',resolve));
  let browser,ctx;
  try{
    browser=await engine.launch({headless:true});
    ctx=await browser.newContext({serviceWorkers:'block'});
    // Playwright's HTTP route does not intercept WebSocket or WebRTC traffic.
    // Block them separately before the application can initialize any relay.
    await ctx.routeWebSocket('**/*', socket => socket.close());
    await ctx.addInitScript(({importedMoney}) => {
      if(importedMoney)localStorage.setItem('f123_dinero_qa','1');
      Object.defineProperty(window, 'RTCPeerConnection', {configurable:true,value:undefined});
      Object.defineProperty(window, 'webkitRTCPeerConnection', {configurable:true,value:undefined});
    },{importedMoney:process.env.F123_QA_IMPORTED_MONEY==='1'});
    const base='http://127.0.0.1:'+srv.address().port;
    await ctx.route('**/*', route=>{
      try{if(new URL(route.request().url()).origin===base)return route.continue()}
      catch(_){}
      return route.abort('blockedbyclient');
    });
    const pg=await ctx.newPage();pg.setDefaultTimeout(15000);
    await pg.goto(base+'/',{waitUntil:'domcontentloaded'});
    await pg.waitForFunction(()=>Boolean(window.OCAuth && window.OCSync && window.fetch),null,{timeout:15000});
    if(process.env.F123_QA_IMPORTED_MONEY==='1')await pg.waitForFunction(()=>Boolean(window.F123MoneyImported));
    return await fn({page:pg,ctx,base});
  }finally{if(ctx)await ctx.close();await browser?.close();await new Promise(resolve=>srv.close(resolve))}
}
async function call(page,url,method='GET',body){
  return page.evaluate(async({url,method,body})=>{
    if(window.OCAuth)window.OCAuth.rolActual=()=> 'dueno';
    const opts={method};
    if(body!==undefined)opts.body=JSON.stringify(body);
    const response=await fetch(url,opts);
    let value;try{value=await response.json()}catch{value=null}
    return {status:response.status,value};
  },{url,method,body});
}
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  test(engineName+' browser: synthetic sale persists across reload without service worker',async()=>{
    await withPage(engine,async({page,ctx,base})=>{
      const rack=await call(page,'/api/ubicaciones','POST',{nombre:'QA-BROWSER-ONLY-SHELF',tipo:'propio'});
      assert.equal(rack.status,200,JSON.stringify(rack));
      const product=await call(page,'/api/productos','POST',{
        nombre:'QA-BROWSER-ONLY-ITEM',barcode:'QA-BROWSER-ONLY-0001',
        precio:17,costo:4,stockInicial:3,ubicacionId:rack.value.id});
      assert.equal(product.status,200,JSON.stringify(product));
      const sale=await call(page,'/api/productos/'+product.value.id+'/venta','POST',{cantidad:1});
      assert.equal(sale.status,200,JSON.stringify(sale));
      assert.ok(sale.value.ventaId,'sale must have unique durable ID');
      const same=await call(page,'/api/ventas/todas');
      assert.equal(same.status,200);
      assert.equal(same.value.filter(x=>x.id===sale.value.ventaId).length,1);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>Boolean(window.OCAuth&&window.OCSync));
      const after=await call(page,'/api/ventas/todas');
      assert.equal(after.status,200);
      assert.equal(after.value.filter(x=>x.id===sale.value.ventaId).length,1,'reload lost or duplicated sale');
      const products=await call(page,'/api/productos');
      const item=products.value.find(x=>x.id===product.value.id);
      assert.ok(item,'reload lost product');
      assert.equal(item.stockActual,2,'reload lost sold inventory movement');
      // A second tab in the SAME browser profile uses original store, not a fabricated new license.
      const next=await ctx.newPage();
      try{
        await next.goto(base+'/',{waitUntil:'domcontentloaded'});
        await next.waitForFunction(()=>Boolean(window.OCAuth&&window.OCSync));
        const seen=await call(next,'/api/ventas/todas');
        assert.equal(seen.value.filter(x=>x.id===sale.value.ventaId).length,1);
      }finally{await next.close()}
    });
  });
  test(engineName+' browser: local-first sale remains durable after temporary offline state',async()=>{
    await withPage(engine,async({page,ctx})=>{
      const rack=await call(page,'/api/ubicaciones','POST',{nombre:'QA-OFFLINE-RACK',tipo:'propio'});
      assert.equal(rack.status,200);
      const product=await call(page,'/api/productos','POST',{nombre:'QA-OFFLINE-ITEM',barcode:'QA-OFFLINE-ITEM-001',
        precio:15,stockInicial:4,ubicacionId:rack.value.id});
      assert.equal(product.status,200);
      await ctx.setOffline(true);
      const sale=await call(page,'/api/productos/'+product.value.id+'/venta','POST',{cantidad:1});
      assert.equal(sale.status,200,'a legitimate local sale must not require remote transport');
      assert.ok(sale.value.ventaId);
      await ctx.setOffline(false);
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>Boolean(window.OCAuth&&window.OCSync));
      const sales=await call(page,'/api/ventas/todas');
      assert.equal(sales.value.filter(x=>x.id===sale.value.ventaId).length,1);
      const products=await call(page,'/api/productos');
      assert.equal(products.value.find(x=>x.id===product.value.id)?.stockActual,3);
    });
  });
}

for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  test(engineName+' browser: credit sale, partial payment and expense remain exact after reload',async()=>{
    await withPage(engine,async({page})=>{
      const p=await call(page,'/api/productos','POST',{
        nombre:'QA CREDIT BROWSER',barcode:'QA-CREDIT-BROWSER',stockInicial:4,precio:19.99,costo:5.12
      });
      assert.equal(p.status,200,JSON.stringify(p));
      const c=await call(page,'/api/clientes','POST',{nombre:'QA CREDIT CLIENT'});
      assert.equal(c.status,200,JSON.stringify(c));
      const sale=await call(page,'/api/productos/'+p.value.id+'/venta','POST',{
        cantidad:1,clienteId:c.value.id,info:{formaPago:'fiado',fiadoAtomico:true}
      });
      assert.equal(sale.status,200,JSON.stringify(sale));
      const first=await call(page,'/api/clientes/'+c.value.id+'/cartera');
      assert.equal(first.status,200,JSON.stringify(first));
      assert.equal(Math.round(first.value.saldo*100),-1999,
        'credit obligation must exist atomically with sale');
      const paid=await call(page,'/api/clientes/'+c.value.id+'/abonar','POST',{
        monto:5.99,motivo:'QA partial payment'
      });
      assert.equal(paid.status,200,JSON.stringify(paid));
      const expense=await call(page,'/api/gastos','POST',{
        concepto:'QA BROWSER RENT',monto:2.34,categoria:'services'
      });
      assert.equal(expense.status,200,JSON.stringify(expense));
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>Boolean(window.OCAuth&&window.OCSync));
      const state=await call(page,'/api/respaldo/exportar');
      assert.equal(state.status,200,JSON.stringify(state));
      assert.equal(state.value.ventas.filter(x=>x.id===sale.value.ventaId).length,1,
        'credit sale lost or duplicated across reload');
      assert.ok(state.value.gastos.some(x=>x.id===expense.value.id&&Math.round(x.monto*100)===234),
        'expense amount lost or mutated across reload');
      const balance=await call(page,'/api/clientes/'+c.value.id+'/cartera');
      assert.equal(balance.status,200,JSON.stringify(balance));
      assert.equal(Math.round(balance.value.saldo*100),-1400,
        'partial payment created duplicate debt or was not restored');
      const products=await call(page,'/api/productos');
      assert.equal(products.value.find(x=>x.id===p.value.id)?.stockActual,3);
    });
  });
  test(engineName+' browser: commission payment method survives sale, settlement and cold reload',async()=>{
    await withPage(engine,async({page})=>{
      const rack=await call(page,'/api/ubicaciones','POST',{
        nombre:'QA BROWSER ASSOCIATE SHELF',tipo:'socio',comisionSocio:40
      });
      assert.equal(rack.status,200,JSON.stringify(rack));
      const product=await call(page,'/api/productos','POST',{
        nombre:'QA COMMISSION BROWSER',barcode:'QA-COMMISSION-BROWSER',
        stockInicial:3,precio:50,costo:17,ubicacionId:rack.value.id
      });
      assert.equal(product.status,200,JSON.stringify(product));
      const sale=await call(page,'/api/productos/'+product.value.id+'/venta','POST',{cantidad:1});
      assert.equal(sale.status,200,JSON.stringify(sale));
      const settled=await call(page,'/api/liquidaciones/'+rack.value.id+'/marcar-pagado','POST',{
        medioPago:'transferencia'
      });
      assert.equal(settled.status,200,JSON.stringify(settled));
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>Boolean(window.OCAuth&&window.OCSync));
      const state=await call(page,'/api/respaldo/exportar');
      assert.equal(state.status,200,JSON.stringify(state));
      const payments=state.value.ventas.filter(x=>x.id===sale.value.ventaId);
      assert.equal(payments.length,1,'commission source sale missing/duplicated');
      assert.equal(payments[0].liquidada,true,'commission settlement must persist');
      assert.equal(payments[0].medioPagoComision,'transferencia',
        'commission payment channel must persist');
      const products=await call(page,'/api/productos');
      assert.equal(products.value.find(x=>x.id===product.value.id)?.stockActual,2,
        'commission settlement may never debit inventory a second time');
    });
  });
}
