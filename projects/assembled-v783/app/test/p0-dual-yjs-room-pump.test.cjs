'use strict';
// P0 test of the ACTUAL native browser helper, not a fake Yjs provider.
// A commercial sale is not performed: QA probe maps are isolated from opsMap.
// No external networks, real customers, app source or business event mutations.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {startServer,openDevice,enterAs,installPump,pump}=require('./helpers/e2e-app.cjs');

test('P0 two-room Yjs pump preserves catalog and separate opsDoc updates both directions', {timeout:120000}, async()=>{
  const {srv,base}=await startServer();
  let desktop,phone,A,B;
  try{
    [desktop,phone]=await Promise.all([chromium.launch(),webkit.launch()]);
    A=await openDevice(desktop,base,{width:1280,height:800});
    B=await openDevice(phone,base,{width:390,height:844});
    await enterAs(A.page,'dueno');
    await enterAs(B.page,'dueno');
    await Promise.all([A,B].map(d=>d.page.waitForFunction(()=>
      window.OCYjs?.estado==='activo' && !!window.OCYjs?.doc && !!window.OCYjs?.opsDoc
    )));
    // Initial state vector exchange + listeners use the unchanged helper under test.
    await installPump([A,B]);

    // Positive control: the old catalog-only helper already knows this room.
    await B.page.evaluate(()=>OCYjs.doc.getMap('__qa_dualroom').set('catalogB','catalog-received'));
    await pump(A,B,100,10);
    const catalog=await A.page.evaluate(()=>OCYjs.doc.getMap('__qa_dualroom').get('catalogB'));
    assert.equal(catalog,'catalog-received','catalog updates B→A still cross, so test transport is active');

    // Actual app creates a SECOND independent Y.Doc for immutable opId events.
    // A valid test bridge MUST deliver these Yjs bytes, independent of catalog.
    await B.page.evaluate(()=>OCYjs.opsDoc.getMap('__qa_dualroom').set('opsB','ops-received'));
    await pump(A,B,100,10);
    const receivedA=await A.page.evaluate(()=>OCYjs.opsDoc.getMap('__qa_dualroom').get('opsB')||null);
    assert.equal(receivedA,'ops-received','B→A independent ops room must cross the manual Yjs pump');

    await A.page.evaluate(()=>OCYjs.opsDoc.getMap('__qa_dualroom').set('opsA','reverse-received'));
    await pump(A,B,100,10);
    const receivedB=await B.page.evaluate(()=>OCYjs.opsDoc.getMap('__qa_dualroom').get('opsA')||null);
    assert.equal(receivedB,'reverse-received','A→B independent ops room also must cross');

    // Rejoin on full state must retain the op room; never seed phantom stock.
    await installPump([A,B]);
    for(const d of [A,B]){
      const actual=await d.page.evaluate(()=>({
        a:OCYjs.opsDoc.getMap('__qa_dualroom').get('opsA'),
        b:OCYjs.opsDoc.getMap('__qa_dualroom').get('opsB')
      }));
      assert.deepEqual(actual,{a:'reverse-received',b:'ops-received'});
    }
  }finally{
    await Promise.allSettled([A?.ctx?.close(),B?.ctx?.close()]);
    await Promise.allSettled([desktop?.close(),phone?.close()]);
    await new Promise(resolve=>srv.close(resolve));
  }
});
