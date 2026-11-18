'use strict';
// Real PORT milestone ledger. The six gates are the original JFC/Claude
// requirements; never equate work on dormant helpers with operational GO.
const fs=require('node:fs');
const path=require('node:path');
const {evaluate:qualityEvaluate}=require('./score.cjs');
const FIXED={
 economics:{weight:20,stages:{'reject-employee-raw-yjs':4,'typed-sale-commit':5,'typed-adjust-commit':4,'typed-payment-commit':4,'business-committed-ack':3}},
 identity:{weight:20,stages:{'central-issuer-service':5,'server-private-admission':5,'browser-fresh-ticket':6,'owner-team-role-flows':4}},
 photos:{weight:10,stages:{'photo-sha-sql-blob':3,'yjs-sha-reference-only':4,'photo-restore-cross-device':3}},
 migration:{weight:25,stages:{'frozen-real-head-zero-pending':5,'verified-once-import-workerd':4,'do-cold-durable-readback':3,'snapshot-plus-journal-backexport':3,'firebase-restore-transport':6,'real-shop-single-cutover':4}},
 mobile:{weight:10,stages:{'idb-outbox-web-locks':5,'safari-bfcache-reconnect':3,'iphone-physical-resume':2}},
 physical:{weight:15,stages:{'physical-cycle-one':7.5,'physical-cycle-two':7.5}}
};
const HEX40=/^[a-f0-9]{40}$/;
const round=n=>Math.round(n*10)/10;
function valid(c,msg){if(!c)throw new Error('port score invalid: '+msg);}
function validEvidence(e){
 return !!e&&HEX40.test(e.sha||'')&&
 /^https:\/\/github\.com\/jfcarpiopuntocom\/friendly123workshop\/actions\/runs\/\d+$/.test(e.url||'')&&
 typeof e.claim==='string'&&e.claim.length>=24&&typeof e.type==='string'&&e.type.length>3;
}
function assessPort(data){
 valid(data&&data.version===1&&data.metric==='operational-port-completion'&&data.target===100,'version/target');
 valid(HEX40.test(data.reviewedSha||'')&&/^2026-11-17T/.test(data.reviewedAt||''),'reviewed commit/date');
 valid(Array.isArray(data.gates)&&data.gates.length===6,'exact six gates');
 let score=0,maximum=0,gatesPassed=0;
 const used=new Set(),gates=[];
 for(const g of data.gates){
  const contract=FIXED[g.id];
  valid(contract&&!used.has(g.id)&&g.weight===contract.weight,'immutable gate '+g.id);
  used.add(g.id);maximum+=g.weight;
  valid(typeof g.certified==='boolean'&&typeof g.label==='string'&&g.label.length>20,'gate certification/label '+g.id);
  const ids=Object.keys(contract.stages);
  valid(Array.isArray(g.stages)&&g.stages.length===ids.length,'stage count '+g.id);
  const seen=new Set();let earned=0,fullyComplete=true;
  for(const s of g.stages){
   valid(!seen.has(s.id)&&ids.includes(s.id)&&s.points===contract.stages[s.id],'immutable stage '+s.id);
   seen.add(s.id);
   valid(typeof s.done==='boolean'&&typeof s.label==='string'&&s.label.length>=22,'stage status '+s.id);
   valid(Array.isArray(s.evidence),'missing stage evidence '+s.id);
   if(s.done){
     valid(s.evidence.some(validEvidence),'completed stage has no SHA/CI proof '+s.id);
     earned+=s.points;
   }else{
     fullyComplete=false;
     valid(s.evidence.length===0&&typeof s.pendingReason==='string'&&s.pendingReason.length>=20,'pending evidence/reason '+s.id);
   }
  }
  valid(seen.size===ids.length,'unknown/hidden stages '+g.id);
  valid(!g.certified||fullyComplete,'cannot certify incomplete gate '+g.id);
  if(g.certified)gatesPassed++;
  earned=round(earned);score+=earned;
  gates.push({id:g.id,label:g.label,weight:g.weight,earned,certified:g.certified,remaining:round(g.weight-earned),
   pendingStages:g.stages.filter(s=>!s.done).map(s=>({id:s.id,points:s.points,label:s.label}))});
 }
 valid(used.size===6&&maximum===100,'immutable weights total 100');
 score=round(score);
 return Object.freeze({metric:'operational-port-completion',target:100,score,maximum,
  reviewedSha:data.reviewedSha,reviewedAt:data.reviewedAt,
  gatesPassed,gatesRequired:6,ready:score===100&&gatesPassed===6,gates});
}

function inspectClientWire({client,worker,authorized}){
 valid(typeof client==='string'&&typeof worker==='string'&&typeof authorized==='string','source text');
 const secureWorkerRequiresTicket=worker.includes('WS_AUTHORITY_QA')&&
   worker.includes("get('cap')")&&worker.includes('askAuthority(');
 const authorizedProviderAvailable=/class\s+AuthorizedYProvider\s+extends\s+YProvider/.test(authorized)&&
   authorized.includes("session.request()")&&authorized.includes('cap');
 const importedProvider=/new\s+AuthorizedYProvider\s*\(/.test(client);
 const dynamicProvider=/params\s*:\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(client);
 const importedTicketSource=/params\s*=\s*createOwnerTicketParams\s*\(/.test(client)&&
   /(?:party\s*:\s*['"]tienda['"]\s*,\s*params\s*,|params\s*,\s*disableBc)/.test(client);
 const pilotUsesFreshTicket=importedProvider&&(dynamicProvider||importedTicketSource);
 const pilotUsesPrivateRoom=/(?:['"]-priv['"])/.test(client);
 // Distinct Y.Doc types are NOT safely multiplexed into a single -priv room.
 // The current secured Worker and browser ship two independent cat/ops
 // channels, while fotos explicitly stays on the encrypted legacy relay.
 const separateDocs=/\bcanal\s*\(\s*doc\s*,\s*tipo\b/.test(client);
 const pilotUsesSeparatedRooms=/sala\s*\+\s*['"]-['"]\s*\+\s*tipo/.test(client)&&
   /tipo\s*!==\s*['"]cat['"]\s*&&\s*tipo\s*!==\s*['"]ops['"]/.test(client);
 // Option A approved 17-Nov: ONLY catalog joins authenticated YParty; sales
 // stay on the encrypted legacy ops transport, never a second Yjs writer.
 // A safe hybrid is not a complete 2.0 economic/role integration.
 const hybridCatalogOnly=/tipo\s*!==\s*['"]cat['"]/.test(client)&&
   /enRespaldo\s*=\s*true\s*;\s*usarRelayHabitual\(\)\s*;\s*return\s*;/.test(client)&&
   /sala\s*\+\s*['"]-['"]\s*\+\s*tipo/.test(client);
 const serverSeparatesRooms=worker.includes('WS_SEPARATE_ROOMS_QA')&&
   /['"]-cat['"]/.test(worker)&&/['"]-ops['"]/.test(worker)&&
   /if\s*\(this\.name\.endsWith\(['"]-ops['"]\)\)\s*return true/.test(worker);
 const channelIsolationPreserved=!separateDocs || (
   ((pilotUsesSeparatedRooms||hybridCatalogOnly)&&serverSeparatesRooms) ||
   (/-priv-cat/.test(worker)&&/-priv-ops/.test(worker)&&/-priv-fotos/.test(worker)&&
    /-priv-['"]\s*\+\s*tipo/.test(client))
 );
 const compatible=secureWorkerRequiresTicket&&authorizedProviderAvailable&&pilotUsesFreshTicket&&
   (pilotUsesPrivateRoom||pilotUsesSeparatedRooms)&&channelIsolationPreserved;
 return {secureWorkerRequiresTicket,authorizedProviderAvailable,pilotUsesFreshTicket,
   pilotUsesPrivateRoom,pilotUsesSeparatedRooms,hybridCatalogOnly,channelIsolationPreserved,compatible,
   reason:compatible?
     'Client/Worker source signed room contract aligned; real store GO and physical coldjoin still pending':
     hybridCatalogOnly&&channelIsolationPreserved?
       'SAFE HYBRID: signed catalog-only YParty; economic ops remain on the encrypted legacy relay; commercial GO still pending':
     !channelIsolationPreserved?'BLOCKED: separate cat/ops/fotos Y.Docs cannot share one YServer or bypass signed scopes':
     'BLOCKED: real client missing one-use cap callback or secure room contract'};
}
function formatDual({port,quality}){
 return [
  'friendly-123 · DOS métricas /100, distintas, basadas en evidencia SHA',
  'CALIDAD arquitectura: '+quality.current.toFixed(1)+'/100 (10-nov retrospectivo '+quality.baseline.toFixed(1)+'/100; Δ+'+quality.delta.toFixed(1)+')',
  'CULMINACIÓN PORT operativo: '+port.score.toFixed(1)+'/100 (objetivo 100.0), '+port.gatesPassed+'/'+port.gatesRequired+' gates certificados',
  'Estado: '+(port.ready&&quality.ready?'APTO PARA REVISIÓN DE GO':'NO-GO para primera tienda real'),
  'Port revisado: '+port.reviewedSha,
  ...port.gates.map(g=>g.id+': '+g.earned.toFixed(1)+'/'+g.weight.toFixed(1)+(g.certified?' · GATE CERTIFICADO':' · PENDIENTE')),
  'Próximo P0: comando económico aplicado en servidor, fotos SHA fuera Yjs y migración real reversible; sin nuevas condiciones'
 ].join('\n');
}
module.exports={assessPort,formatDual,inspectClientWire};
if(require.main===module){
 const dir=__dirname;
 const port=assessPort(JSON.parse(fs.readFileSync(path.join(dir,'port-v1.json'),'utf8')));
 const quality=qualityEvaluate(JSON.parse(fs.readFileSync(path.join(dir,'score-v1.json'),'utf8')));
 if(process.argv.includes('--json'))process.stdout.write(JSON.stringify({quality,port},null,2)+'\n');
 else process.stdout.write(formatDual({port,quality})+'\n');
 if(process.argv.includes('--require-operational-go')&&(!port.ready||!quality.ready))process.exitCode=2;
}
