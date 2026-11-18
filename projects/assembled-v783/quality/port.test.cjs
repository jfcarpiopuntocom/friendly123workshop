'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const parent=__dirname,root=path.resolve(parent,'..');
const data=JSON.parse(fs.readFileSync(path.join(parent,'port-v1.json'),'utf8'));
const quality=JSON.parse(fs.readFileSync(path.join(parent,'score-v1.json'),'utf8'));
const {assessPort,formatDual,inspectClientWire}=require('./port.cjs');
const {evaluate}=require('./score.cjs');

test('two distinct numbers: quality 67.0 and evidence-credited port 36.0',()=>{
 const p=assessPort(data),q=evaluate(quality);
 assert.equal(p.score,36.0);
 assert.equal(q.current,67.0);
 assert.equal(p.maximum,100);
 assert.equal(p.gatesPassed,0);
 assert.equal(p.gatesRequired,6);
 assert.equal(p.ready,false);
 assert.equal(p.target,100);
 assert.equal(p.reviewedSha,'641a58070e4915e3da945144e6365cdf1a225764');
 const report=formatDual({port:p,quality:q});
 assert.match(report,/67\.0\/100/);
 assert.match(report,/36\.0\/100/);
 assert.match(report,/45\.0\/100/);
 assert.match(report,/NO-GO/);
});
test('six JFC gates are immutable and sum to exactly 100 with fixed stages',()=>{
 const result=assessPort(data);
 assert.deepEqual(result.gates.map(g=>[g.id,g.weight,g.earned]),[
  ['economics',20,4],['identity',20,16],['photos',10,3],
  ['migration',25,10],['mobile',10,3],['physical',15,0]
 ]);
 assert.ok(result.gates.every(g=>g.certified===false));
});
test('even a mathematically complete port without six independently certified gates stays NO-GO',()=>{
 const copy=structuredClone(data);
 for(const gate of copy.gates)for(const step of gate.stages){
  step.done=true;
  if(!step.evidence?.length)step.evidence=[{
    sha:'d7545ab5100f2239260be2c9392f40c16b35dcd4',
    url:'https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44141527108',
    type:'hypothetical-unit-test',claim:'Artificial proof for gate-safety unit test only, never an actual completion claim'
  }];
 }
 const e=assessPort(copy);
 assert.equal(e.score,100);
 assert.equal(e.gatesPassed,0);
 assert.equal(e.ready,false);
});
test('reject weight manipulation, fabricated evidence, hidden gates and invalid stage IDs',()=>{
 for(const mutate of [
  d=>{d.gates[0].weight=21;},
  d=>{d.gates[0].stages[0].points=5;},
  d=>{d.gates.pop();},
  d=>{d.gates[0].stages[0].evidence=[];},
  d=>{d.gates[0].stages[0].evidence[0].sha='unknown';},
  d=>{d.gates[0].stages[0].done=false;d.gates[0].certified=true;},
  d=>{d.reviewedSha='latest';}
 ]){const copy=structuredClone(data);mutate(copy);assert.throws(()=>assessPort(copy));}
});
test('client↔Worker actual pilot source is signed and separated, but no complete commercial GO',()=>{
 const client=fs.readFileSync(path.join(root,'app/src/yparty-piloto.js'),'utf8');
 const worker=fs.readFileSync(path.join(root,'relay/injertos/yparty-worker/src/index.js'),'utf8');
 const authorized=fs.readFileSync(path.join(root,'app/src/authorized-yprovider.mjs'),'utf8');
 const e=inspectClientWire({client,worker,authorized});
 assert.equal(e.secureWorkerRequiresTicket,true);
 assert.equal(e.authorizedProviderAvailable,true);
 assert.equal(e.pilotUsesFreshTicket,true);
 assert.equal(e.pilotUsesPrivateRoom,false);
 assert.equal(e.pilotUsesSeparatedRooms,true);
 assert.equal(e.channelIsolationPreserved,true);
 assert.equal(e.compatible,true);
 assert.match(e.reason,/still pending|GO/i);
});
test('port gate cannot be certified before every declared stage has evidence and completion',()=>{
 const copy=structuredClone(data);
 copy.gates[0].certified=true;
 assert.throws(()=>assessPort(copy),/incomplete|certifi/i);
});
