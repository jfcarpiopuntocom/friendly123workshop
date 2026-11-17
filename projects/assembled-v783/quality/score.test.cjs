'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ledger=JSON.parse(fs.readFileSync(path.join(__dirname,'score-v1.json'),'utf8'));
const {evaluate,formatReport}=require('./score.cjs');

test('fixed weights are exactly 100 and the dated baseline is not changed retroactively',()=>{
 const e=evaluate(ledger);
 assert.equal(e.maximum,100);
 assert.equal(e.baseline,45.0);
 assert.equal(e.baselineDate,'2026-11-10');
 assert.equal(e.baselineProvenance,'retrospective-estimate');
});
test('current score is recomputed from verifiable entries and anchored to a concrete main commit',()=>{
 const e=evaluate(ledger);
 assert.equal(e.current,63.5);
 assert.equal(e.delta,18.5);
 assert.equal(e.reviewedSha,'932471c77a4e128adffc040e65002901fd8da6ef');
 assert.equal(e.target,95);
 assert.equal(e.gatesPassed,0);
 assert.equal(e.gatesRequired,6);
 assert.equal(e.ready,false);
 assert.match(formatReport(e),/63\.5\/100/);
 assert.match(formatReport(e),/45\.0\/100/);
});
test('all six JFC/Claude gates are mandatory even if points somehow reach 100',()=>{
 const copy=structuredClone(ledger);
 for(const axis of copy.dimensions)axis.current.points=axis.weight;
 const e=evaluate(copy);
 assert.equal(e.current,100);
 assert.equal(e.ready,false);
 assert.equal(e.gatesPassed,0);
});
test('reassigning 0.5 point after a verified Workerd regression changes the live number',()=>{
 const copy=structuredClone(ledger);
 const migration=copy.dimensions.find(x=>x.id==='migration');
 migration.current.points+=0.5;
 migration.current.evidence.push({level:'workerd',url:'https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44131873302',sha:'d20e06a2e5f9737de498bc12e4705f246514c6fd',claim:'synthetic placeholder for score arithmetic, not real proof'});
 const e=evaluate(copy);
 assert.equal(e.current,64.0);
 assert.equal(e.delta,19.0);
});
test('unsupported point gains, invalid scores, weight drift and false GO are blocked',()=>{
 for(const mutate of [
  l=>{l.dimensions[0].weight=21;},
  l=>{l.dimensions[0].current.points=25;},
  l=>{l.dimensions[0].current.points+=0.1;l.dimensions[0].current.evidence=[];},
  l=>{l.gates.pop();},
  l=>{l.reviewedSha='unknown';},
  l=>{l.dimensions[0].baseline.points=-0.1;}
 ]){
  const copy=structuredClone(ledger);
  mutate(copy);
  assert.throws(()=>evaluate(copy));
 }
});
test('new score date is explicit and no fictitious real device/Go claim is emitted',()=>{
 const report=formatReport(evaluate(ledger));
 assert.match(report,/NO-GO/);
 assert.match(report,/Opera.*Safari/);
 assert.match(report,/estimaci[oó]n/);
});
