'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
test('assembled candidate creates a synthetic sale with imported money in Chromium',async()=>{
  const root=path.resolve(__dirname,'../docs');
  const server=http.createServer((req,res)=>{
    const name=new URL(req.url,'http://local').pathname;
    const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.statusCode=404;return res.end();}
    res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{
    browser=await chromium.launch({headless:true});const page=await browser.newPage({serviceWorkers:'block'});
    const origin='http://127.0.0.1:'+server.address().port;
    await page.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
    await page.routeWebSocket('**/*',ws=>ws.close());
    await page.addInitScript(()=>localStorage.setItem('f123_dinero_qa','1'));
    await page.goto(origin);await page.waitForFunction(()=>window.F123MoneyImported&&window.OCSync);
    const result=await page.evaluate(async()=>{
      window.OCAuth={rolActual:()=> 'dueno'};
      const req=async(url,body)=>{const r=await fetch(url,{method:body?'POST':'GET',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('HTTP '+r.status);return r.json();};
      const u=await req('/api/ubicaciones',{nombre:'Synthetic',tipo:'propio'});
      const p=await req('/api/productos',{nombre:'Synthetic',barcode:'ASSEMBLED',precio:0.1,costo:0,stockInicial:4,ubicacionId:u.id,pctAsociado:15});
      const sale=await req('/api/productos/'+p.id+'/venta',{cantidad:1,opId:'synthetic-assembled-sale'});
      const data=await req('/api/respaldo/exportar');const v=data.ventas.find(v=>v.id===sale.ventaId);
      return{stock:sale.producto.stockActual,commission:v.split.montoComisionSocio,net:v.split.montoNetoDueno};
    });
    assert.deepEqual(result,{stock:3,commission:0.02,net:0.08});
  }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
