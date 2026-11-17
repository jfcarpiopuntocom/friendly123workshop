'use strict';
// LAB ONLY: two isolated IndexedDB profiles, native Chromium + WebKit.
// Same synthetic license; explicit Yjs updates simulate the relay.
// No real transport, Owner PIN, installed PWA or physical-device GO.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {startServer,openDevice,enterAs,installPump,pump}=require('./helpers/e2e-app.cjs');

async function api(page,url,method='GET',body) {
  return page.evaluate(async args => {
    const response=await fetch(args.url,{
      method:args.method,
      ...(args.body===undefined?{}:{body:JSON.stringify(args.body)})
    });
    let data=null; try{data=await response.json();}catch(_){}
    return {status:response.status,data};
  },{url,method,body});
}
async function state(page) {
  const response=await api(page,'/api/respaldo/exportar');
  assert.equal(response.status,200,'cannot read durable business snapshot');
  assert.ok(Array.isArray(response.data.productos)&&Array.isArray(response.data.ventas));
  return response.data;
}
function check(snapshot,productId,ids,tag) {
  const item=snapshot.productos.find(p=>p.id===productId);
  assert.ok(item,tag+': product disappeared');
  assert.equal(item.stockActual,8-ids.length,tag+': stock must reflect each unique sale once');
  const receipts=snapshot.ventas.filter(v=>ids.includes(v.id)).map(v=>v.id).sort();
  assert.deepEqual(receipts,[...ids].sort(),tag+': receipts lost, duplicated or invented');
}
async function untilPair(a,b,productId,ids,tag) {
  let seenA,seenB;
  for(let i=0;i<9;i++) {
    await pump(a,b,180,10);
    [seenA,seenB]=await Promise.all([state(a.page),state(b.page)]);
    const valid=s=>{
      const item=s.productos.find(p=>p.id===productId);
      return item&&item.stockActual===8-ids.length
        &&ids.every(id=>s.ventas.filter(v=>v.id===id).length===1);
    };
    if(valid(seenA)&&valid(seenB)) {
      check(seenA,productId,ids,tag+' Chromium');
      check(seenB,productId,ids,tag+' WebKit');
      return;
    }
    await a.page.waitForTimeout(150);
  }
  // Synthetic-safe diagnosis: distinguish CRDT delivery from store projection.
  const diagnostics=await Promise.all([a,b].map(d=>d.page.evaluate(id=>{
    const y=window.OCYjs,cat=window.OCSync?.catalogoPropio?.();
    let recovering=null;try{recovering=!!y?._diag?.().recuperacionLocalPendiente;}catch(_){}
    return {yjsProduct:!!y?.mapas?.productos?.has(String(id)),
      yjsCount:y?.mapas?.productos?.size??null,
      commercialProduct:!!cat?.productos?.some(p=>p.id===id),
      commercialCount:cat?.productos?.length??null,
      yjsStore:!!y?._store,estado:y?.estado||null,
      recovering:!!y?.canal?.recuperando,headAccess:!!y?.canal?.headAcceso,
      localRecoveryPending:recovering,applyError:String(window.__aplicarErr||'').slice(0,160)};
  },productId)));
  assert.fail(tag+': browsers did not converge through the Yjs test pump; '+
    JSON.stringify({A:{stock:seenA?.productos.find(p=>p.id===productId)?.stockActual,
      receipts:ids.map(id=>seenA?.ventas.filter(v=>v.id===id).length)},
    B:{stock:seenB?.productos.find(p=>p.id===productId)?.stockActual,
      receipts:ids.map(id=>seenB?.ventas.filter(v=>v.id===id).length)},
    diagnostics}));
}
async function reload(device,role) {
  await device.page.reload({waitUntil:'domcontentloaded'});
  await device.page.waitForFunction(()=>Boolean(window.OCAuth&&window.OCSync&&window.OCYjs));
  await enterAs(device.page,role);
  await device.page.waitForFunction(()=>OCYjs.estado==='activo');
}
test('A→B→A twice: separate Chromium/WebKit IDB keeps unique sales and physical stock after cold reload',
  {timeout:180000},async()=>{
    const errors=[],{srv,base}=await startServer();
    let desktop,phone,A,B;
    try {
      [desktop,phone]=await Promise.all([chromium.launch(),webkit.launch()]);
      A=await openDevice(desktop,base,{width:1280,height:800,errors});
      B=await openDevice(phone,base,{width:390,height:844,errors});
      await enterAs(A.page,'dueno');
      await enterAs(B.page,'dueno');
      await Promise.all([
        A.page.waitForFunction(()=>OCYjs.estado==='activo'),
        B.page.waitForFunction(()=>OCYjs.estado==='activo')
      ]);
      const rack=await api(A.page,'/api/ubicaciones','POST',{
        nombre:'QA A2B2A RACK',tipo:'propio'});
      assert.equal(rack.status,200,JSON.stringify(rack.data));
      const product=await api(A.page,'/api/productos','POST',{
        nombre:'QA A2B2A PRODUCT',barcode:'QA-A2B2A-STOCK-001',
        stockInicial:8,precio:17,costo:4,ubicacionId:rack.data.id});
      assert.equal(product.status,200,JSON.stringify(product.data));
      const productId=product.data.id;
      assert.ok(productId);
      await A.page.evaluate(()=>OCSync.confirmarCatalogoDurable());
      // A local durable ACK is not the asynchronous Yjs publication barrier.
      await A.page.waitForFunction(id=>Boolean(
        window.OCYjs?._store && window.OCYjs?.mapas?.productos?.has(String(id))
      ),productId,{timeout:12000});
      await installPump([A,B]);
      await untilPair(A,B,productId,[],'initial full-state join');
      const receiptIds=[];
      for(let cycle=1;cycle<=2;cycle++) {
        const before=receiptIds.length;
        const aOp='synthetic-a2b2a-sale-A-'+cycle;
        const aSale=await api(A.page,'/api/productos/'+productId+'/venta','POST',
          {cantidad:1,opId:aOp});
        assert.equal(aSale.status,200,'PC sale cycle '+cycle+': '+JSON.stringify(aSale.data));
        assert.ok(aSale.data.ventaId);
        receiptIds.push(aSale.data.ventaId);
        await untilPair(A,B,productId,receiptIds,'A→B cycle '+cycle);

        const bOp='synthetic-a2b2a-sale-B-'+cycle;
        const bSale=await api(B.page,'/api/productos/'+productId+'/venta','POST',
          {cantidad:1,opId:bOp});
        assert.equal(bSale.status,200,'phone sale cycle '+cycle+': '+JSON.stringify(bSale.data));
        assert.ok(bSale.data.ventaId);
        assert.ok(!receiptIds.includes(bSale.data.ventaId),'fresh B sale must have distinct receipt ID');
        receiptIds.push(bSale.data.ventaId);
        await untilPair(A,B,productId,receiptIds,'B→A cycle '+cycle);

        const replay=await api(A.page,'/api/productos/'+productId+'/venta','POST',
          {cantidad:1,opId:aOp});
        assert.equal(replay.status,200,'idempotent retry must preserve original ACK');
        assert.equal(replay.data.ventaId,aSale.data.ventaId);
        assert.equal(receiptIds.length,before+2);
        await untilPair(A,B,productId,receiptIds,'retry no double stock cycle '+cycle);

        await Promise.all([reload(A,'dueno'),reload(B,'dueno')]);
        await installPump([A,B]);
        await untilPair(A,B,productId,receiptIds,'cold IndexedDB readback cycle '+cycle);
      }
      assert.equal(receiptIds.length,4);
      assert.equal(new Set(receiptIds).size,4);
      assert.deepEqual(errors.filter(e=>/unhandled|fatal|TypeError.*Yjs/i.test(e)),[],
        'no unhandled synchronization errors in native browser pages');
    }finally{
      await Promise.allSettled([A?.ctx?.close(),B?.ctx?.close()]);
      await Promise.allSettled([desktop?.close(),phone?.close()]);
      await new Promise(resolve=>srv.close(resolve));
    }
  });
