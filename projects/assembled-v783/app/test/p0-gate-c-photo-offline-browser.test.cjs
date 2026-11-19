'use strict';
// Gate C: exact sync-yjs.js photo seed + read-through blocks in real Chromium and
// WebKit pages with the real idb-fotos.js IndexedDB store. Synthetic bytes only,
// local loopback server stands in for the signed SHA blob endpoint (PR89/PR93).
// WebKit here is NOT an iPhone; no physical-device claim.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createHash}=require('node:crypto');
const {chromium,webkit}=require('playwright');
const docs=path.join(__dirname,'../docs');
const src=fs.readFileSync(path.join(docs,'sync-yjs.js'),'utf8');
const cut=(a,b)=>{const i=src.indexOf(a),j=src.indexOf(b,i);assert.ok(i>0&&j>i,'exact source block '+a.trim());return src.slice(i,j);};
const seed=cut('  var _fotosSembradas =','  /* SEMBRAR VENTAS');
// Exact reconnect hook line (absent before GREEN: then the writer never drains its outbox).
const onlineHook=(src.match(/^  window\.addEventListener\("online", function \(\) \{ if \(API\.fotoSha\) sembrarFotosAlRelay\(\); \}\);.*$/m)||[''])[0];
const readThrough=cut('    if (API.fotoSha && window.OCFotos?.leerPorHash','    if (API.fotosRefs?.observe)');
const raw=Buffer.alloc(300*1024);for(let i=0;i<raw.length;i++)raw[i]=(i*31+7)&255;
const dataUrl='data:image/png;base64,'+raw.toString('base64');
const hash=createHash('sha256').update(raw).digest('hex');

async function server(){
 const blobs=new Map();let offline=true;
 const files={'/yjs.js':path.join(docs,'vendor/yjs-bundle.min.js'),'/idb-fotos.js':path.join(docs,'idb-fotos.js')};
 const app=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://x');
  if(files[u.pathname]){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end(fs.readFileSync(files[u.pathname]));}
  if(u.pathname==='/blob'){
   if(offline){res.writeHead(503);return res.end();}
   const sha=u.searchParams.get('sha');
   if(req.method==='GET'){const d=blobs.get(sha);res.writeHead(d?200:404);return res.end(d||'');}
   let body='';req.on('data',c=>body+=c);req.on('end',()=>{
    const bytes=Buffer.from(body.slice(body.indexOf(',')+1),'base64');
    if(createHash('sha256').update(bytes).digest('hex')!==sha){res.writeHead(400);return res.end();}
    blobs.set(sha,body);res.writeHead(201,{'Content-Type':'application/json'});
    res.end(JSON.stringify({sha,bytes:bytes.length,tipo:body.slice(5,body.indexOf(';'))}));
   });return;
  }
  res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});
  res.end('<!doctype html><title>Gate C synthetic</title><script src="/yjs.js"></script><script src="/idb-fotos.js"></script>');
 });
 await new Promise(r=>app.listen(0,'127.0.0.1',r));
 return{url:'http://127.0.0.1:'+app.address().port+'/',blobs,setOffline:v=>{offline=v;},close:()=>new Promise(r=>app.close(r))};
}

// Same globals sync-yjs.js gives these blocks: API, OCSync, OCFotos, Y.
const install=(page,blocks)=>page.evaluate(({blocks,hash})=>{
 window.__puts=0;
 const doc=new Y.Doc(),fotosDoc=new Y.Doc();
 window.API={doc,fotosRefs:doc.getMap('fotos_refs'),fotosDoc,fotosMap:fotosDoc.getMap('blobs'),
  fotosCanal:{ws:{relayLayer:'synthetic'},enviarUpdate:()=>{window.__legacySends=(window.__legacySends||0)+1;}},
  fotoSha:{
   async put(h,d){window.__puts++;const r=await fetch('/blob?sha='+h,{method:'PUT',body:d});if(r.status!==201)throw Error('offline');return r.json();},
   async get(h){const r=await fetch('/blob?sha='+h);if(!r.ok)throw Error('miss');return r.text();}
  }};
 window.OCSync={catalogoPropio:()=>({productos:[{fotoHash:hash}],ubicaciones:[],gastos:[]})};
 for(const b of blocks)(0,eval)(b);
},{blocks,hash});
const yjsState=page=>page.evaluate(()=>({blobs:API.fotosMap.size,legacySends:window.__legacySends||0,
 refs:API.fotosRefs.toJSON(),catBytes:Y.encodeStateAsUpdate(API.doc).length,fotosBytes:Y.encodeStateAsUpdate(API.fotosDoc).length}));

for(const [writerName,writer,readerName,reader] of [['Chromium',chromium,'WebKit',webkit],['WebKit',webkit,'Chromium',chromium]]){
 test(`Gate C ${writerName}->${readerName}: offline photo never enters Yjs, durable IDB outbox uploads on reconnect, other browser restores by SHA`,{timeout:120000},async()=>{
  const s=await server();
  const bw=await writer.launch(),br=writerName===readerName?bw:await reader.launch();
  try{
   const ctxW=await bw.newContext(),w=await ctxW.newPage();
   await w.goto(s.url);
   assert.equal(await w.evaluate(({hash,dataUrl})=>OCFotos.guardarPorHash(hash,dataUrl),{hash,dataUrl}),true);
   await install(w,[seed,onlineHook]);
   await ctxW.setOffline(true);
   await w.evaluate(()=>sembrarFotosAlRelay());
   await w.waitForFunction(()=>window.__puts>=1&&!_fotosSembrando);
   let st=await yjsState(w);
   assert.equal(st.blobs,0,'disconnected: no photo blob inserted into Yjs fotos doc');
   assert.equal(st.legacySends,0,'disconnected: no legacy photo bytes sent');
   assert.deepEqual(st.refs,{},'no reference without a durable SHA ACK');
   await ctxW.setOffline(false);
   // Restart the writer: the photo survives only in its durable IndexedDB outbox.
   await w.reload();
   await install(w,[seed,onlineHook]);
   s.setOffline(false);
   await w.evaluate(()=>window.dispatchEvent(new Event('online')));
   await w.waitForFunction(h=>!!API.fotosRefs.get(h),hash,{timeout:20000});
   st=await yjsState(w);
   assert.deepEqual(st.refs,{[hash]:{sha:hash,bytes:raw.length,tipo:'image/png'}});
   assert.equal(st.blobs,0);assert.equal(st.legacySends,0);
   assert.ok(st.catBytes<2048&&st.fotosBytes<64,'Yjs keeps only the tiny sha/bytes/tipo reference: '+JSON.stringify(st));
   assert.equal(s.blobs.get(hash),dataUrl,'exact bytes stored by SHA');
   const update=await w.evaluate(()=>Array.from(Y.encodeStateAsUpdate(API.doc)));
   // Second, independent browser engine with empty storage.
   const ctxR=await br.newContext(),r=await ctxR.newPage();
   await r.goto(s.url);
   await install(r,[seed,readThrough]);
   const got=await r.evaluate(async({update,hash})=>{Y.applyUpdate(API.doc,Uint8Array.from(update),'red');return OCFotos.leerPorHash(hash);},{update,hash});
   assert.equal(got,dataUrl,'restored exact photo from SHA blob');
   assert.equal((await yjsState(r)).blobs,0);
   s.setOffline(true);await r.reload();
   assert.equal(await r.evaluate(h=>OCFotos.leerPorHash(h),hash),dataUrl,'restored photo persisted in reader IndexedDB');
  }finally{await bw.close();if(br!==bw)await br.close();await s.close();}
 });
}
