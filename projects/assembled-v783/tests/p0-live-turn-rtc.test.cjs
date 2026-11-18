'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes,createHmac,createHash}=require('node:crypto');
const http=require('node:http');
const {chromium}=require('playwright');

test('v787 LIVE: two separate browser contexts exchange binary over forced TURN-only RTC',{timeout:110000},async()=>{
  const scriptURL='https://jfcarpiopuntocom.github.io/friendly-123/peer-sync.js';
  const response=await fetch(scriptURL,{cache:'no-store'});
  assert.equal(response.status,200,'live public peer-sync.js must be reachable');
  const source=await response.text();
  assert.ok(!source.includes("candidate.type !== 'relay'"),'live script must forward relay candidates');
  assert.ok(source.includes('window.F123Peer = { create }'),'real peer adapter must load');

  const room=randomBytes(20).toString('hex');
  const locate='wss://friendly123-sync-relay.jfcarpio.workers.dev/sala/'+room;
  const username=(Math.floor(Date.now()/1000)+86400)+':f123';
  const credential=createHmac('sha1','openrelayprojectsecret').update(username).digest('base64');
  const turnServers=[{urls:[
    'turn:staticauth.openrelay.metered.ca:80',
    'turn:staticauth.openrelay.metered.ca:80?transport=tcp',
    'turn:staticauth.openrelay.metered.ca:443',
    'turns:staticauth.openrelay.metered.ca:443?transport=tcp'
  ],username,credential}];

  const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>synthetic RTC fixture</title>');});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({headless:true});
    const contexts=[await browser.newContext(),await browser.newContext()];
    const pages=[];
    for(const context of contexts){
      const page=await context.newPage();
      await page.goto(origin);
      await page.addScriptTag({content:source});
      await page.evaluate(({turnServers,locate})=>{
        const Native=window.RTCPeerConnection;
        const OriginalWebSocket=window.WebSocket;
        const signal={sent:[],received:[],closed:[],iceErrors:[],candidates:[],rtcEvents:[]};
        class ObservedWS extends OriginalWebSocket {
          constructor(url){super(url);this.addEventListener('message',ev=>{try{const m=JSON.parse(ev.data);signal.received.push(m.k||'unknown');}catch{signal.received.push('nonjson');}});this.addEventListener('close',ev=>signal.closed.push(ev.code));}
          send(value){try{const m=JSON.parse(value);signal.sent.push(m.k||'unknown');}catch{signal.sent.push('nonjson');}return super.send(value);}
        }
        function RelayOnly(settings){
          const peer=new Native({...settings,iceTransportPolicy:'relay'});
          window.__nativePc=peer;
          peer.addEventListener('icecandidateerror',ev=>signal.iceErrors.push({code:ev.errorCode,text:String(ev.errorText||'').slice(0,180)}));
          peer.addEventListener('icecandidate',ev=>{if(ev.candidate)signal.candidates.push(ev.candidate.type||'unknown');});
          peer.addEventListener('signalingstatechange',()=>signal.rtcEvents.push('signal:'+peer.signalingState));
          peer.addEventListener('iceconnectionstatechange',()=>signal.rtcEvents.push('ice:'+peer.iceConnectionState));
          return peer;
        }
        window.__signal=signal;
        const transport=window.F123Peer.create({iceServers:turnServers,RTCPeerConnection:RelayOnly,WebSocket:ObservedWS});
        const socket=transport.connect(locate);
        const status={open:false,bytes:[],errors:[],closed:false};
        window.__probe={socket,status,transport};
        socket.addEventListener('open',()=>{status.open=true;});
        socket.addEventListener('error',()=>status.errors.push('socket-error'));
        socket.addEventListener('close',ev=>{status.closed=true;status.errors.push('close-'+ev.code);});
        socket.addEventListener('message',ev=>{
          if(ev.data instanceof ArrayBuffer)status.bytes.push(Array.from(new Uint8Array(ev.data)));
        });
      },{turnServers,locate});
      pages.push(page);
    }
    try{
      await Promise.all(pages.map(p=>p.waitForFunction(()=>window.__probe.status.open,null,{timeout:70000})));
      const evidence=await Promise.all(pages.map(p=>p.evaluate(async()=>{
        const pc=window.__nativePc;
        const stats=await pc.getStats();
        let chosen=null;
        for(const v of stats.values())if(v.type==='candidate-pair'&&v.state==='succeeded'&&(v.nominated||v.selected)){
          const local=stats.get(v.localCandidateId);
          chosen=local?.candidateType||null;
        }
        return {iceConnectionState:pc.iceConnectionState,connectionState:pc.connectionState,localCandidateType:chosen};
      })));
      assert.ok(evidence.every(x=>x.localCandidateType==='relay'),JSON.stringify(evidence));
      await pages[0].evaluate(()=>window.__probe.socket.send(Uint8Array.from([7,8,9,123]).buffer));
      await pages[1].waitForFunction(()=>window.__probe.status.bytes.length>0,{timeout:15000});
      const bytes=await pages[1].evaluate(()=>window.__probe.status.bytes[0]);
      assert.deepEqual(bytes,[7,8,9,123]);
      console.log('LIVE TURN-ONLY RTC PASS:',JSON.stringify({contexts:2,localCandidateTypes:evidence.map(x=>x.localCandidateType),receivedBytes:bytes.length}));
    }catch(error){
      const trace=await Promise.all(pages.map(p=>p.evaluate(()=>({socket:window.__probe?.status,signal:window.__signal,rtc:window.__nativePc?{connectionState:window.__nativePc.connectionState,iceConnectionState:window.__nativePc.iceConnectionState,iceGatheringState:window.__nativePc.iceGatheringState,hasLocalDescription:!!window.__nativePc.localDescription,hasRemoteDescription:!!window.__nativePc.remoteDescription}:null})).catch(e=>({error:e.message}))));
      console.error('LIVE TURN-ONLY RTC DIAGNOSTIC:',JSON.stringify(trace));
      throw error;
    }finally{
      for(const p of pages)try{await p.close();}catch{}
      for(const c of contexts)try{await c.close();}catch{}
    }
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
});
