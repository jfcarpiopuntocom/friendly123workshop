'use strict';
// Reproducible arithmetic around an explicitly editorial, evidence-gated score.
// This is NOT a probability of data safety, nor a substitute for six JFC gates.
const fs=require('node:fs');
const path=require('node:path');
const FIXED=Object.freeze({business:20,durability:20,sync:20,security:15,photos:10,migration:10,physical:5});
const REQUIRED_GATES=new Set(['economics','identity','photo','migration','mobile','physical']);
const SHA=/^[a-f0-9]{40}$/;
const round=x=>Math.round((x+Number.EPSILON)*10)/10;
function check(condition,message){if(!condition)throw new Error('Scorecard invalid: '+message);}
function evidenceValid(e,baseline=false){
 if(!e||typeof e!=='object'||typeof e.claim!=='string'||e.claim.length<20)return false;
 if(typeof e.url!=='string'||!/^https:\/\//.test(e.url))return false;
 if(baseline)return true;
 return typeof e.level==='string'&&e.level.length>0&&SHA.test(e.sha||'')&&
    /^https:\/\/github\.com\/jfcarpiopuntocom\/friendly123workshop\/actions\/runs\/\d+$/.test(e.url);
}
function evaluate(data){
 check(data&&data.version===1&&data.target===95,'version and target are fixed');
 check(data.baselineDate==='2026-11-10'&&data.baselineProvenance==='retrospective-estimate','historical baseline provenance');
 check(SHA.test(data.reviewedSha||'')&&/^2026-11-17T/.test(data.reviewedDate||''),'current SHA and reviewed date');
 check(Array.isArray(data.dimensions)&&data.dimensions.length===7,'exactly seven dimensions');
 const ids=new Set(),detail=[];let max=0,old=0,now=0;
 for(const axis of data.dimensions){
  check(Object.prototype.hasOwnProperty.call(FIXED,axis.id),'unknown dimension');
  check(!ids.has(axis.id)&&axis.weight===FIXED[axis.id],'changed weights or duplicate dimension '+axis.id);
  ids.add(axis.id);max+=axis.weight;
  for(const snapshot of ['baseline','current']){
   const v=axis[snapshot];
   check(v&&Number.isFinite(v.points)&&v.points>=0&&v.points<=axis.weight,'bad score '+axis.id+'/'+snapshot);
   check(Math.abs(round(v.points)-v.points)<1e-8,'score precision must be tenths '+axis.id);
   check(Array.isArray(v.evidence),'missing evidence list '+axis.id+'/'+snapshot);
   if(v.points>0)check(v.evidence.some(e=>evidenceValid(e,snapshot==='baseline')),'points without evidence '+axis.id+'/'+snapshot);
  }
  if(axis.current.points>axis.baseline.points)
   check(axis.current.evidence.some(e=>evidenceValid(e,false)),'unsupported score increase '+axis.id);
  old+=axis.baseline.points;now+=axis.current.points;
  detail.push({id:axis.id,label:axis.label,weight:axis.weight,baseline:axis.baseline.points,current:axis.current.points,delta:round(axis.current.points-axis.baseline.points)});
 }
 check(ids.size===7&&max===100,'fixed weights must sum to 100');
 check(Array.isArray(data.gates)&&data.gates.length===6,'six closed JFC gates required');
 const seen=new Set();
 for(const gate of data.gates){
  check(REQUIRED_GATES.has(gate.id)&&!seen.has(gate.id),'invalid gate '+gate.id);
  seen.add(gate.id);
  check(typeof gate.passed==='boolean'&&Array.isArray(gate.evidence),'gate status/evidence invalid '+gate.id);
  if(gate.passed)check(gate.evidence.some(e=>evidenceValid(e,false)),'cannot pass gate without SHA-linked CI '+gate.id);
  else check(typeof gate.reason==='string'&&gate.reason.length>=15,'unexplained missing gate '+gate.id);
 }
 const gatesPassed=data.gates.filter(g=>g.passed).length;
 const baseline=round(old),current=round(now);
 return Object.freeze({maximum:100,target:95,baselineDate:data.baselineDate,baselineProvenance:data.baselineProvenance,
  reviewedDate:data.reviewedDate,reviewedSha:data.reviewedSha,baseline,current,delta:round(current-baseline),
  baselineUncertainty:data.baselineUncertainty,currentUncertainty:data.currentUncertainty,
  gatesPassed,gatesRequired:6,ready:current>=95&&gatesPassed===6,dimensions:detail,
  blockedGates:data.gates.filter(g=>!g.passed).map(g=>({id:g.id,label:g.label,reason:g.reason}))});
}
function formatReport(e){
 return [
  'friendly-123 · índice de calidad/robustez · estimación ingenieril v1 (no probabilidad)',
  'Revisión SHA '+e.reviewedSha+' · '+e.reviewedDate,
  'Hace 1 semana ('+e.baselineDate+'): '+e.baseline.toFixed(1)+'/100 ±'+e.baselineUncertainty,
  'Actual: '+e.current.toFixed(1)+'/100 ±'+e.currentUncertainty+' | delta '+(e.delta>=0?'+':'')+e.delta.toFixed(1)+' | meta '+e.target,
  'Gates reales: '+e.gatesPassed+'/'+e.gatesRequired+' | '+(e.ready?'GO PARA REVISIÓN':'NO-GO comercial'),
  'A→B→A real Opera PC ↔ Safari iPhone: '+(e.blockedGates.some(g=>g.id==='physical')?'NO verificado':'certificado'),
  ...e.dimensions.map(x=>x.label+': '+x.baseline.toFixed(1)+' → '+x.current.toFixed(1)+' / '+x.weight+' (Δ'+(x.delta>=0?'+':'')+x.delta.toFixed(1)+')')
 ].join('\n');
}
module.exports={evaluate,formatReport};
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(path.join(__dirname,'score-v1.json'),'utf8'));
 const e=evaluate(data);
 if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(e,null,2)+'\n');
 else process.stdout.write(formatReport(e)+'\n');
 if(process.argv.includes('--require-go')&&!e.ready)process.exitCode=2;
}
