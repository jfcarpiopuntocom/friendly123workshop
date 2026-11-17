'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const client=fs.readFileSync(path.resolve(__dirname,'../app/src/yparty-piloto.js'),'utf8');
const authorized=fs.readFileSync(path.resolve(__dirname,'../app/src/authorized-yprovider.mjs'),'utf8');
const worker=fs.readFileSync(path.resolve(__dirname,'../relay/injertos/yparty-worker/src/index.js'),'utf8');
const {inspectClientWire}=require('../quality/port.cjs');
test('P0 current source proves secure distinct WS rooms and fresh client ticket callback, not complete commercial GO',()=>{
 const result=inspectClientWire({client,authorized,worker});
 assert.equal(result.compatible,true);
 assert.equal(result.secureWorkerRequiresTicket,true);
 assert.equal(result.authorizedProviderAvailable,true);
 assert.equal(result.pilotUsesFreshTicket,true);
 assert.equal(result.pilotUsesPrivateRoom,false);
 assert.equal(result.pilotUsesSeparatedRooms,true);
 assert.equal(result.channelIsolationPreserved,true);
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

// Regression added after PR86+PR87: real client *already ships* signed cat/ops rooms;
// the old checker falsely insists on one shared -priv room and reports BLOCKED.
test('actual merged worker + generated client now have isolated authenticated cat/ops contract',()=>{
 const verdict=inspectClientWire({client,worker,authorized});
 assert.equal(verdict.secureWorkerRequiresTicket,true);
 assert.equal(verdict.authorizedProviderAvailable,true);
 assert.equal(verdict.pilotUsesFreshTicket,true,'actual pilot uses existing createOwnerTicketParams on each connection');
 assert.equal(verdict.pilotUsesSeparatedRooms,true,'separate Y.Doc rooms cat and ops required');
 assert.equal(verdict.channelIsolationPreserved,true,'no Yjs doc mixing, photos use legacy relay');
 assert.equal(verdict.compatible,true,'source-level client/Worker contract now compatible, not commercial GO');
});
test('two-channel secure server never blesses fabricated bare tickets or raw economic edits',()=>{
 assert.match(worker,/WS_SEPARATE_ROOMS_QA/);
 assert.match(worker,/this\.name\.endsWith\('-ops'\)\) return true/);
 assert.match(client,/createOwnerTicketParams/);
 assert.doesNotMatch(client,/new YProvider\(/);
});
