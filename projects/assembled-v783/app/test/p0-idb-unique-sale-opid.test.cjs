'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { browser } = require('./helpers/browser.cjs');

for (const [name, engine] of [['Chromium', chromium], ['WebKit', webkit]]) test('IndexedDB version 1 records a sale key atomically and rejects its duplicate (' + name + ')', {timeout:50000}, async()=>{
  const fixture=browser();
  fixture.OCAuth={rolActual:()=> 'dueno'};
  fixture.localStorage.setItem('f123_owned',JSON.stringify({instanceId:'synthetic-opid'}));
  const product=await fixture.request('/api/productos','POST',{
    nombre:'QA unique receipt',barcode:'QA-UNIQUE-IDB',precio:12,stockInicial:8
  });
  const pointer=fixture.localStorage.getItem('f123_estado_v4_ptr');
  const initial=JSON.parse(fixture.localStorage.getItem('f123_estado_v4_'+pointer));
  const local=Array.from({length:fixture.localStorage.length},(_,i)=>{
    const key=fixture.localStorage.key(i);
    return [key,fixture.localStorage.getItem(key)];
  });
  const docs=path.join(__dirname,'../docs');
  const server=http.createServer((_req,res)=>res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>QA</title>'));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browserInstance;
  try {
    browserInstance=await engine.launch({headless:true});
    const page=await browserInstance.newPage({serviceWorkers:'block'});
    await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'commit',timeout:9000});
    await page.evaluate(async ({local,initial})=>{
      for(const [k,v] of local) localStorage.setItem(k,v);
      window.OCAuth={rolActual:()=> 'dueno'};
      window.OCSecure={estadoSecreto:()=> 'ok',leerPinsVisibles:()=>null};
      await new Promise((resolve,reject)=>{
        const request=indexedDB.open('f123_estado',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('estado');
        request.onerror=()=>reject(request.error);
        request.onsuccess=()=>{
          const db=request.result;
          const tx=db.transaction('estado','readwrite');
          tx.objectStore('estado').put(initial,'actual');
          tx.oncomplete=()=>{db.close();resolve();};
          tx.onabort=()=>{db.close();reject(tx.error);};
        };
      });
    },{local,initial});
    const files=['estado-ab.js','estado-idb.js','core/payout-ledger.js','core/business-read-model.js','mock-backend.js'];
    await page.addScriptTag({content:files.map(file=>fs.readFileSync(path.join(docs,file),'utf8')).join('\n;\n')});
    const observed=await page.evaluate(async productId=>{
      async function read(key) {
        return await new Promise((resolve,reject)=>{
          const request=indexedDB.open('f123_estado',1);
          request.onerror=()=>reject(request.error);
          request.onsuccess=()=>{
            const db=request.result;
            const tx=db.transaction('estado','readonly');
            const record=tx.objectStore('estado').get(key);
            tx.oncomplete=()=>{db.close();resolve(record.result);};
            tx.onabort=()=>{db.close();reject(tx.error);};
          };
        });
      }
      const sell=async (url,body)=>{
        const r=await fetch(url,{method:'POST',body:JSON.stringify(body)});
        if(!r.ok)throw Error(url+' '+r.status);
        return r.json();
      };
      const saleKey='sale-synthetic-native-unique';
      const closeKey='sale-synthetic-close-unique';
      await sell('/api/productos/'+productId+'/venta',{cantidad:2,opId:saleKey});
      await sell('/api/ventas/cierre',{items:[{productoId:productId,cantidad:1}],opId:closeKey});
      const current=await read('actual');
      const receipts=[await read(['venta',saleKey]),await read(['venta',closeKey])];
      const future={...current,_rev:current._rev+1};
      const duplicate=await OCEstadoIDB.guardarConRevision(future,current._rev,current._abCommit,saleKey);
      const duplicateIsConflict=OCEstadoIDB.ultimoError()===null;
      const revisionAfterDuplicate=(await read('actual'))._rev;

      const resubmit='sale-synthetic-aborted-unique';
      const put=IDBObjectStore.prototype.put;
      let aborted;
      try {
        IDBObjectStore.prototype.put=function(value,key) {
          if(this.name==='estado'&&key==='actual') throw Error('synthetic write rejected');
          return put.call(this,value,key);
        };
        aborted=await OCEstadoIDB.guardarConRevision(future,current._rev,current._abCommit,resubmit);
      } finally {IDBObjectStore.prototype.put=put;}
      const hasAbortedKey=(await read(['venta',resubmit]))!==undefined;
      const accepted=await OCEstadoIDB.guardarConRevision(future,current._rev,current._abCommit,resubmit);
      return {receipts,stock:current.productos.find(p=>p.id===productId).stockActual,
        duplicate,duplicateIsConflict,sameRevision:revisionAfterDuplicate===current._rev,
        aborted,hasAbortedKey,accepted,retryKey:await read(['venta',resubmit])};
    },product.id);
    assert.deepEqual(observed,{receipts:[true,true],stock:5,duplicate:false,
      duplicateIsConflict:true,sameRevision:true,aborted:false,hasAbortedKey:false,accepted:true,retryKey:true});
  } finally {
    await browserInstance?.close();
    server.closeAllConnections();
    server.close();
  }
});
