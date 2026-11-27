'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{randomBytes}=require('node:crypto'),{chromium}=require('playwright');
test('P0 LIVE Supabase SDK browser-to-browser encrypted synthetic ephemeral broadcast',{timeout:90000},async()=>{
 const r=await fetch('https://jfcarpiopuntocom.github.io/friendly-123/vendor/supabase-relay.min.js',{cache:'no-store'});
 assert.equal(r.status,200);let src=await r.text();
 assert.ok(src.includes('window.F123Relay=vn'),'pinned public bundle entry');
 src=src.replace('window.F123Relay=vn','window.F123DashRealtime=mn,window.F123Relay=vn');
 const room='f123-dash-qa-'+randomBytes(12).toString('hex'),nonce=randomBytes(8).toString('hex');
 const browser=await chromium.launch();const ctx=[await browser.newContext(),await browser.newContext()];
 try{
 const pages=await Promise.all(ctx.map(c=>c.newPage()));
 for(const p of pages){
  await p.goto('https://jfcarpiopuntocom.github.io/friendly-123/dashboard.html',{waitUntil:'domcontentloaded'});
  await p.addScriptTag({content:src});
  await p.evaluate((room)=>{
   window.__dashQA={states:[],messages:[]};
   const chan=window.F123DashRealtime.channel(room,{config:{broadcast:{self:false,ack:false},private:false}});
   window.__dashQA.chan=chan;
   chan.on('broadcast',{event:'qa'},m=>window.__dashQA.messages.push(m.payload));
   chan.subscribe(s=>window.__dashQA.states.push(s));
  },room);
 }
 await Promise.all(pages.map(p=>p.waitForFunction(()=>window.__dashQA.states.includes('SUBSCRIBED'),null,{timeout:25000})));
 await pages[0].evaluate((nonce)=>window.__dashQA.chan.send({type:'broadcast',event:'qa',payload:{nonce}}),nonce);
 await pages[1].waitForFunction(nonce=>window.__dashQA.messages.some(m=>m.nonce===nonce),nonce,{timeout:12000});
 console.log('DASH SDK REALTIME GREEN 2 browser contexts, subscription and ephemeral broadcast, same LIVE vendor adapter');
 }catch(e){
  const states=await Promise.all(ctx.map(async c=>{const ps=c.pages();return ps[0]?ps[0].evaluate(()=>window.__dashQA?{states:window.__dashQA.states,received:window.__dashQA.messages.length}:null).catch(()=>null):null}));
  console.error('DASH SDK DIAG',JSON.stringify(states));throw e;
 }finally{for(const c of ctx)await c.close();await browser.close();}
});
