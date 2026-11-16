'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {browser}=require('./helpers/browser.cjs');
test('stale durable fichas receiver preserves a peer tab rack, sale and stock on cold readback',async()=>{
 const a=browser(),b=browser(a.localStorage);
 a.OCAuth=b.OCAuth={rolActual:()=> 'dueno'};
 const rack=await a.request('/api/ubicaciones','POST',{nombre:'Synthetic durable rack A',tipo:'propio'});
 const product=await a.request('/api/productos','POST',{
  nombre:'Synthetic durable product A',barcode:'SYN-STALE-FICHAS',precio:17,costo:2,stockInicial:3,ubicacionId:rack.id
 });
 const sale=await a.request('/api/productos/'+product.id+'/venta','POST',{
  cantidad:1,opId:'synthetic-stale-fichas-sale-001',info:{formaPago:'cash'}
 });
 assert.ok(sale);
 assert.ok(a.OCSync.revisionLocal()>b.OCSync.revisionLocal(),'receiver has not processed the peer storage event');
 await b.OCSync.aplicarFichas({ubicaciones:[{
  id:'synthetic-incoming-rack-b',nombre:'Synthetic incoming rack B',tipo:'propio',activa:true,rev:{c:99,d:'synthetic'}
 }]});
 await new Promise(r=>setImmediate(r));
 const cold=browser(a.localStorage);cold.OCAuth={rolActual:()=> 'dueno'};
 const racks=await cold.request('/api/ubicaciones'),products=await cold.request('/api/productos');
 const sales=await cold.request('/api/ventas/todas');
 assert.equal(racks.filter(r=>r.id===rack.id).length,1,'peer committed rack must survive the incoming sync lane');
 assert.equal(racks.filter(r=>r.id==='synthetic-incoming-rack-b').length,1,'incoming rack must also persist');
 assert.equal(products.find(p=>p.id===product.id)?.stockActual,2,'do not erase peer product or replay its stock delta');
 assert.equal(sales.filter(s=>s.productoId===product.id).length,1,'peer sale must remain exactly once');
});
for(const change of ['notebook','generation'])test(`queued fichas cannot enter a changed ${change} or adopt its PIN`,async()=>{
 const w=browser();w.OCAuth={rolActual:()=> 'dueno'};
 const product=await w.request('/api/productos','POST',{
  nombre:'Synthetic switched product',barcode:'SYN-SWITCH-FICHAS',precio:17,stockInicial:3,ubicacionId:'todas'
 });
 w.localStorage.setItem('f123_owned',JSON.stringify({licenseCode:'F123-SYNTHETIC-A'}));
 let entered,release,current=true;
 const ready=new Promise(r=>{entered=r}),held=new Promise(r=>{release=r});
 w.OCEstadoIDB={soportado:true,ultimoError:()=>null,guardar:async()=>true,
  guardarConRevision:async()=>{entered();await held;return true;}};
 const sale=w.request('/api/productos/'+product.id+'/venta','POST',{
  cantidad:1,opId:'synthetic-switch-fichas-sale-001',info:{formaPago:'cash'}
 });
 await ready;
 const queued=w.OCSync.aplicarFichas({ubicaciones:[{
  id:'synthetic-obsolete-rack',nombre:'Synthetic obsolete rack',tipo:'propio',activa:true,rev:{c:99,d:'synthetic'}
 }],pinsRol:{owner:'789'}},()=>current);
 if(change==='notebook')w.localStorage.setItem('f123_owned',JSON.stringify({licenseCode:'F123-SYNTHETIC-B'}));
 else current=false;
 release();await sale;const result=await queued;
 assert.equal(result,false,'obsolete context must not apply queued content');
 assert.equal((await w.request('/api/ubicaciones')).some(r=>r.id==='synthetic-obsolete-rack'),false);
 assert.equal(w.localStorage.getItem('f123_pin_tienda_789'),null,'old-room PIN must not be adopted into current notebook');
});
test('fichas wait behind an in-flight local sale and keep the incoming intention stable',async()=>{
 const w=browser();w.OCAuth={rolActual:()=> 'dueno'};
 const product=await w.request('/api/productos','POST',{
  nombre:'Synthetic pending product',barcode:'SYN-PENDING-FICHAS',precio:17,stockInicial:3,ubicacionId:'todas'
 });
 let entered,release;
 const ready=new Promise(r=>{entered=r}),held=new Promise(r=>{release=r});
 w.OCEstadoIDB={soportado:true,ultimoError:()=>null,guardar:async()=>true,
  guardarConRevision:async()=>{entered();await held;return true;}};
 const sale=w.request('/api/productos/'+product.id+'/venta','POST',{
  cantidad:1,opId:'synthetic-pending-fichas-sale-001',info:{formaPago:'cash'}
 });
 await ready;
 const incoming={ubicaciones:[{id:'synthetic-pending-rack',nombre:'Synthetic pending rack',tipo:'propio',activa:true,rev:{c:99,d:'synthetic'}}]};
 let merged=false;
 const pending=Promise.resolve(w.OCSync.aplicarFichas(incoming)).then(result=>{merged=true;return result});
 incoming.ubicaciones[0].id='mutated-after-receive';
 await new Promise(r=>setImmediate(r));
 assert.equal(merged,false,'sync must not replace a provisional sale snapshot');
 release();await sale;await pending;
 const cold=browser(w.localStorage);cold.OCAuth={rolActual:()=> 'dueno'};
 assert.equal((await cold.request('/api/productos')).find(p=>p.id===product.id)?.stockActual,2);
 assert.equal((await cold.request('/api/ventas/todas')).filter(s=>s.productoId===product.id).length,1);
 assert.equal((await cold.request('/api/ubicaciones')).filter(r=>r.id==='synthetic-pending-rack').length,1);
});
