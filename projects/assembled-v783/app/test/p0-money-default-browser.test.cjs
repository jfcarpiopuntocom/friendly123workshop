'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
for(const engine of [chromium,webkit])test(engine.name()+': default imported commissions survive reload and duplicate sale submission',{timeout:60000},async()=>{
 const root=path.resolve(__dirname,'../docs');
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404).end();return;}res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await engine.launch({headless:true});const page=await browser.newPage({serviceWorkers:'block'}),origin='http://127.0.0.1:'+server.address().port;
  await page.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());await page.routeWebSocket('**/*',s=>s.close());
  await page.goto(origin);await page.waitForFunction(()=>window.F123MoneyImported&&window.OCSync);
  const initial=await page.evaluate(async()=>{
   window.OCAuth={rolActual:()=> 'dueno'};
   const request=async(url,method='GET',body)=>{const r=await fetch(url,{method,headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});if(!r.ok)throw Error('HTTP '+r.status);return r.json();};
   if(localStorage.getItem('f123_dinero_qa')!==null)throw Error('test must exercise default without flag');
   const helper=await request('/api/promotoras','POST',{nombre:'Synthetic helper',comisionBase:0});
   const rack=await request('/api/ubicaciones','POST',{nombre:'Synthetic default browser',tipo:'propio'});
   const p=await request('/api/productos','POST',{nombre:'Synthetic default browser',barcode:'MONEY-DEFAULT-BROWSER',precio:0.1,costo:0,stockInicial:4,ubicacionId:rack.id,pctAsociado:15});
   await request('/api/productos/'+p.id+'/venta','POST',{cantidad:1,opId:'synthetic-default-base'});
   const first=(await request('/api/respaldo/exportar')).ventas.find(v=>v.opId==='synthetic-default-base');
   await request('/api/productos/'+p.id,'PATCH',{pctAsociado:100});
   const body={cantidad:1,opId:'synthetic-default-assistant',asistenteId:helper.id,asistentePct:15};
   await request('/api/productos/'+p.id+'/venta','POST',body);await request('/api/productos/'+p.id+'/venta','POST',body);
   const backup=await request('/api/respaldo/exportar'),sales=backup.ventas.filter(v=>v.productoId===p.id),second=sales.find(v=>v.opId===body.opId);
   return{productId:p.id,body,first:JSON.stringify(first),count:sales.length,baseCommission:first.split.montoComisionSocio,assistant:second.split.reparto[1].monto,seller:second.split.reparto[0].monto,stock:backup.productos.find(x=>x.id===p.id).stockActual};
  });
  assert.equal(initial.count,2);assert.equal(initial.baseCommission,0.02);assert.equal(initial.assistant,0.02);assert.equal(initial.seller,0.08);assert.equal(initial.stock,2);
  await page.reload();await page.waitForFunction(()=>window.F123MoneyImported&&window.OCSync);
  const restored=await page.evaluate(async({productId,body})=>{
   window.OCAuth={rolActual:()=> 'dueno'};
   const retry=await fetch('/api/productos/'+productId+'/venta',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});if(!retry.ok)throw Error('retry HTTP '+retry.status);
   const backup=await(await fetch('/api/respaldo/exportar')).json(),sales=backup.ventas.filter(v=>v.productoId===productId);
   return{count:sales.length,first:JSON.stringify(sales.find(v=>v.opId==='synthetic-default-base')),stock:backup.productos.find(x=>x.id===productId).stockActual,assistant:sales.find(v=>v.opId===body.opId).split.reparto[1].monto};
  },initial);
  assert.equal(restored.count,2);assert.equal(restored.first,initial.first);assert.equal(restored.stock,2);assert.equal(restored.assistant,0.02);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
