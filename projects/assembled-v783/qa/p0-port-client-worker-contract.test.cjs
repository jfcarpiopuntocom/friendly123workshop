'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const client=fs.readFileSync(path.resolve(__dirname,'../app/src/yparty-piloto.js'),'utf8');
const authorized=fs.readFileSync(path.resolve(__dirname,'../app/src/authorized-yprovider.mjs'),'utf8');
const worker=fs.readFileSync(path.resolve(__dirname,'../relay/injertos/yparty-worker/src/index.js'),'utf8');
const {inspectClientWire}=require('../quality/port.cjs');
test('P0 current Option A proves signed catalog-only bridge and no full new money room',()=>{
 const result=inspectClientWire({client,authorized,worker});
 assert.equal(result.compatible,false,'cat-only is not full business port');
 assert.equal(result.secureWorkerRequiresTicket,true);
 assert.equal(result.authorizedProviderAvailable,true);
 assert.equal(result.pilotUsesFreshTicket,true);
 assert.equal(result.pilotUsesPrivateRoom,false);
 assert.equal(result.pilotUsesSeparatedRooms,false);
 assert.equal(result.hybridCatalogOnly,true);
 assert.equal(result.channelIsolationPreserved,true);
 assert.match(result.reason,/SAFE HYBRID/);
});
test('a fixture having ticket request and private room becomes source-compatible only when both are present',()=>{
 const a=inspectClientWire({
  client:"import AuthorizedYProvider from './authorized-yprovider.mjs'; const provider = new AuthorizedYProvider(host,sala+'-priv',doc,{params:async()=>({cap,licencia,instancia})});",
  authorized,worker
 });
 assert.equal(a.compatible,true);
 const noTicket=inspectClientWire({client:"new AuthorizedYProvider(host,sala+'-priv',doc,{});",authorized,worker});
 assert.equal(noTicket.compatible,false);
 const noRoom=inspectClientWire({client:"new AuthorizedYProvider(host,sala+'-ops',doc,{params:async()=>({cap})});",authorized,worker});
 assert.equal(noRoom.compatible,false);
});

test('single -priv room must NOT count as compatible for three separate channel Y.Docs',()=>{
 const unsafe="import AuthorizedYProvider from './authorized-yprovider.mjs'; window.F123YPartyPilot=function(sala){return {canal(doc,tipo){ return new AuthorizedYProvider(host,sala+'-priv',doc,{params:async()=>({cap,licencia,instancia})});}}};";
 const result=inspectClientWire({client:unsafe,authorized,worker});
 assert.equal(result.pilotUsesFreshTicket,true);
 assert.equal(result.pilotUsesPrivateRoom,true);
 assert.equal(result.channelIsolationPreserved,false);
 assert.equal(result.compatible,false,'all Y.Docs in one YServer would falsely merge catalog/ops/fotos');
});

// 17-Nov approved Option A: server supports separate rooms, but actual browser
// is intentionally signed catalog-only; money stays on the old encrypted relay.
test('current browser safely signs catalog only and explicitly retains legacy ops path',()=>{
 const verdict=inspectClientWire({client,worker,authorized});
 assert.equal(verdict.secureWorkerRequiresTicket,true);
 assert.equal(verdict.authorizedProviderAvailable,true);
 assert.equal(verdict.pilotUsesFreshTicket,true,'actual pilot uses existing createOwnerTicketParams on each connection');
 assert.equal(verdict.pilotUsesSeparatedRooms,false,'ops are not joined to YParty');
 assert.equal(verdict.hybridCatalogOnly,true,'new provider is only allowed for catalog');
 assert.equal(verdict.channelIsolationPreserved,true,'cat only; no Yjs room mixing');
 assert.equal(verdict.compatible,false,'full 2.0 migration remains incomplete');
 const sync=fs.readFileSync(path.resolve(__dirname,'../app/docs/sync-yjs.js'),'utf8');
 assert.ok(sync.includes('API.opsCanal = crearCanal(Y, API.opsDoc, "-ops"'),
   'real app keeps money on legacy encrypted outbox while catalog joins YParty');
});
test('two-channel secure server never blesses fabricated bare tickets or raw economic edits',()=>{
 assert.match(worker,/WS_SEPARATE_ROOMS_QA/);
 assert.match(worker,/this\.name\.endsWith\('-ops'\)\) return true/);
 assert.match(client,/createOwnerTicketParams/);
 assert.doesNotMatch(client,/new YProvider\(/);
});
