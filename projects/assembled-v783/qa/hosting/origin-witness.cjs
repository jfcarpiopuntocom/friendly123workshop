'use strict';
// Witness only: successful assertion means the unsafe same-origin namespace is reproduced.
// Fresh synthetic Chromium context; NEVER navigate to customer/production origins.
const {chromium}=require('../../app/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const docs=path.resolve(__dirname,'../../app/docs');
const prefixes=['/friendly-123/','/friendly123workshop/projects/assembled-v783/app/docs/'];
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://local').pathname,prefix=prefixes.find(p=>pathname.startsWith(p));
 if(!prefix){res.writeHead(404);res.end();return;}
 const relative=pathname.slice(prefix.length)||'index.html',file=path.resolve(docs,relative);
 if(!file.startsWith(docs+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 const ext=path.extname(file);res.setHeader('Content-Type',ext==='.js'?'application/javascript':ext==='.html'?'text/html':ext==='.json'?'application/json':ext==='.css'?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{let browser;await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 try{
  browser=await chromium.launch({headless:true});const context=await browser.newContext({serviceWorkers:'block'});
  await context.route('**/*',r=>r.request().url().startsWith(origin+'/')?r.continue():r.abort());
  await context.routeWebSocket('**/*',socket=>socket.close());
  await context.addInitScript(()=>{for(const name of ['RTCPeerConnection','webkitRTCPeerConnection'])Object.defineProperty(window,name,{configurable:true,value:undefined});});
  const first=await context.newPage();await first.goto(origin+prefixes[0]);await first.waitForFunction(()=>window.AMG?.Aislamiento);
  const marker='synthetic-origin-witness';await first.evaluate(value=>localStorage.setItem('f123_origin_witness',value),marker);
  const second=await context.newPage();await second.goto(origin+prefixes[1]);await second.waitForFunction(()=>window.AMG?.Aislamiento);
  const seen=await second.evaluate(()=>localStorage.getItem('f123_origin_witness'));
  assert.equal(seen,marker,'witness: both routes currently use the same f123 namespace');
  const native=(await context.storageState()).origins.flatMap(o=>o.localStorage).find(e=>e.value===marker);
  assert.equal(native?.name,'f123::f123_origin_witness');
  process.stdout.write(JSON.stringify({kind:'VULNERABILITY-WITNESS',reproduced:true,sameOrigin:true,sharedNativeKey:native.name,safeToOpenCandidateInExistingProfile:false,syntheticDataOnly:true},null,2)+'\n');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
