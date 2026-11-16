'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {startServer,openDevice,enterAs}=require('./helpers/e2e-app.cjs');
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(`stale sync tab rebases before saving fichas; peer sale survives cold reload (${name})`,{timeout:45000},async()=>{
  const {srv,base}=await startServer();let browser;
  try{
   browser=await engine.launch({headless:true});
   const {ctx,page:a}=await openDevice(browser,base);await enterAs(a);
   const b=await ctx.newPage();
   await b.addInitScript(()=>{
    window.addEventListener('storage',event=>event.stopImmediatePropagation(),true);
    window.BroadcastChannel=class{postMessage(){}close(){}addEventListener(){}removeEventListener(){}};
   });
   await b.goto(base+'/index.html',{waitUntil:'load'});
   await b.waitForFunction(()=>window.OCSync&&window.OCAuth);await enterAs(b);
   const ids=await a.evaluate(async()=>{
    const post=async(url,body)=>{const r=await fetch(url,{method:'POST',body:JSON.stringify(body)});if(!r.ok)throw Error(await r.text());return r.json()};
    const rack=await post('/api/ubicaciones',{nombre:'Synthetic peer rack',tipo:'propio'});
    const product=await post('/api/productos',{nombre:'Synthetic peer product',barcode:'SYN-FICHAS-NATIVE',precio:17,costo:2,stockInicial:3,ubicacionId:rack.id});
    await post('/api/productos/'+product.id+'/venta',{cantidad:1,opId:'synthetic-native-fichas-sale-001',info:{formaPago:'cash'}});
    if(!await OCSync.confirmarCatalogoDurable())throw Error('peer did not commit');
    return {rack:rack.id,product:product.id};
   });
   assert.equal(await b.evaluate(async id=>(await (await fetch('/api/ubicaciones')).json()).some(r=>r.id===id),ids.rack),false,'storage notification is deliberately delayed');
   await b.evaluate(()=>OCSync.aplicarFichas({ubicaciones:[{
    id:'synthetic-native-incoming-rack',nombre:'Synthetic incoming rack',tipo:'propio',activa:true,rev:{c:99,d:'synthetic'}
   }]}));
   const cold=await ctx.newPage();await cold.goto(base+'/index.html',{waitUntil:'load'});
   await cold.waitForFunction(()=>window.OCSync&&window.OCAuth);await enterAs(cold);
   const state=await cold.evaluate(async()=>({
    racks:await (await fetch('/api/ubicaciones')).json(),products:await (await fetch('/api/productos')).json(),sales:await (await fetch('/api/ventas/todas')).json()
   }));
   assert.equal(state.racks.filter(r=>r.id===ids.rack).length,1);
   assert.equal(state.racks.filter(r=>r.id==='synthetic-native-incoming-rack').length,1);
   assert.equal(state.products.find(p=>p.id===ids.product)?.stockActual,2);
   assert.equal(state.sales.filter(s=>s.productoId===ids.product).length,1);
  }finally{await browser?.close();await new Promise(r=>srv.close(r));}
 });
}
