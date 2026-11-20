#!/usr/bin/env node
const {randomBytes}=require('node:crypto');
const assert=require('node:assert/strict');
const WSS="wss://uhvzdrlhmznxxelniizi.supabase.co/realtime/v1/websocket?apikey=sb_publishable_qpRKJ7TdvTfwPEjRl3L-Ag_QOjdim9H&vsn=2.0.0";
const topic='realtime:f123-dash-qa-'+randomBytes(12).toString('hex'), nonce=randomBytes(16).toString('hex');
const sockets=[];
function join(){
 return new Promise((resolve,reject)=>{
 const ws=new WebSocket(WSS),stats={received:0,joined:false};
 const timer=setTimeout(()=>reject(new Error('realtime joined/received timeout')),15000);
 ws.onopen=()=>{console.log('DASH SUPABASE SOCKET OPEN');ws.send(JSON.stringify({topic,event:'phx_join',payload:{config:{broadcast:{self:false,ack:false},presence:{key:''},private:false}},ref:'1',join_ref:'1'}));};
 ws.onmessage=(ev)=>{
  const p=JSON.parse(ev.data);console.log('DASH SUPABASE INBOUND TYPE',p.event,'status',p.payload?.status||'', 'ref',p.ref||'');
  if(p.event==='phx_reply'&&p.ref==='1'){if(p.payload?.status==='ok'){stats.joined=true;clearTimeout(timer);resolve({ws,stats});}else{clearTimeout(timer);reject(new Error('realtime join refused '+JSON.stringify(p.payload).slice(0,240)));}}
  if(p.event==='broadcast'&&p.payload?.payload?.nonce===nonce)stats.received++;
 };
 ws.onclose=(ev)=>{console.log('DASH SUPABASE CLOSED',ev.code);clearTimeout(timer);reject(new Error('realtime websocket closed'));};
 ws.onerror=()=>{clearTimeout(timer);reject(new Error('realtime websocket error'));};
 sockets.push(ws);
 });
}
(async()=>{
 let a=await join(),b=await join();
 await new Promise(r=>setTimeout(r,500));
 a.ws.send(JSON.stringify({topic,event:'broadcast',payload:{type:'broadcast',event:'qa',payload:{nonce}},ref:'2',join_ref:'1'}));
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('broadcast was not delivered')),7000);const iv=setInterval(()=>{if(b.stats.received){clearInterval(iv);clearTimeout(t);resolve();}},50)});
 assert.equal(b.stats.received,1);console.log('DASH SUPABASE REALTIME GREEN: two clients, private random topic, byte delivery, no database writes');
})().catch(e=>{console.error('DASH SUPABASE REALTIME RED:',e.message);process.exitCode=1}).finally(()=>{sockets.forEach(x=>x.close())});
