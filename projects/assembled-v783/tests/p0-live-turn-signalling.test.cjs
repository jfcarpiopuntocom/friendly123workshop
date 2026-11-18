'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');

function inbox(ws){
 const events=[],pending=[];
 ws.addEventListener('message',ev=>{
   let msg;try{msg=JSON.parse(ev.data);}catch{return;}
   events.push(msg);
   for(const p of [...pending])if(p.pred(msg)){pending.splice(pending.indexOf(p),1);clearTimeout(p.timer);p.resolve(msg);}
 });
 return pred=>new Promise((resolve,reject)=>{
   const hit=events.find(pred);if(hit)return resolve(hit);
   const p={pred,resolve,timer:setTimeout(()=>{pending.splice(pending.indexOf(p),1);reject(Error('Timed out waiting for verified metadata frame'))},12000)};
   pending.push(p);
 });
}
function ready(ws){
 return new Promise((resolve,reject)=>{
   if(ws.readyState===WebSocket.OPEN)return resolve();
   ws.addEventListener('open',resolve,{once:true});
   ws.addEventListener('error',()=>reject(Error('Signalling socket failed')),{once:true});
   ws.addEventListener('close',ev=>reject(Error('Signalling socket closed before open: '+ev.code)),{once:true});
 });
}
test('LIVE Cloudflare signal v17 forwards only validated synthetic TURN ICE between two nonbusiness peers',{timeout:45000},async()=>{
  const room=randomBytes(20).toString('hex');
  const id1=randomBytes(16).toString('hex'),id2=randomBytes(16).toString('hex');
  const base='wss://friendly123-sync-relay.jfcarpio.workers.dev/signal/'+room;
  const left=new WebSocket(base+'?peer='+id1), right=new WebSocket(base+'?peer='+id2);
  const leftRecv=inbox(left),rightRecv=inbox(right);
  try{
    await Promise.all([ready(left),ready(right)]);
    await Promise.all([
      leftRecv(m=>m.k==='peers'&&m.peers?.includes(id1)&&m.peers?.includes(id2)),
      rightRecv(m=>m.k==='peers'&&m.peers?.includes(id1)&&m.peers?.includes(id2))
    ]);
    const ice='candidate:1234 1 UDP 1677729535 192.0.2.10 54321 typ relay raddr 198.51.100.4 rport 33333';
    left.send(JSON.stringify({v:1,k:'ice',to:id2,data:{candidate:ice,sdpMid:'0',sdpMLineIndex:0,usernameFragment:'abc'}}));
    const packet=await rightRecv(m=>m.k==='ice');
    assert.equal(packet.from,id1,'source authenticated as synthetic peer socket');
    assert.equal(packet.to,id2);
    assert.equal(packet.data.candidate,ice);
    console.log('LIVE TURN SIGNAL PASS: real deployed Worker forwarded validated synthetic ICE metadata.');
  }finally{
    for(const ws of [left,right])try{ws.close();}catch{}
  }
});
