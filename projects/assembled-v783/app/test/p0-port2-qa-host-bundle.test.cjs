'use strict';
// Source / compiled vendor parity: connects ONLY to the isolated 2.0 QA
// worker after an explicit JFC per-license pilot switch; no client activation.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const docs=path.join(__dirname,'../docs'),src=fs.readFileSync(path.join(__dirname,'../src/yparty-piloto.js'),'utf8');
const bundle=fs.readFileSync(path.join(docs,'vendor/yparty-piloto.min.js'),'utf8');
const target='friendly123-yparty-port2-canary-qa.jfcarpio.workers.dev';
const stale='friendly123-yparty-qa-20261114.jfcarpio.workers.dev';

test('P0 client uses the isolated PORT 2.0 QA host and not legacy YParty QA',()=>{
 assert.match(src,new RegExp("const host = '"+target.replaceAll('.','\\.')+"'"));
 assert.ok(!src.includes(stale),'source must never address the stale Worker');
});
test('P0 compiled browser vendor matches the exact source host',()=>{
 assert.ok(bundle.includes(target),'compiled vendor must include the 2.0 QA target');
 assert.ok(!bundle.includes(stale),'compiled browser bundle cannot address old QA Worker');
});
test('P0 no new HTTP token shortcut or mandatory pilot flag',()=>{
 assert.match(src,/createOwnerTicketParams/);
 assert.match(src,/createPhotoShaBridge/);
 assert.match(src,/window\.F123YPartyPilot/);
 assert.match(src,/if\(String\(owned\?\.licenseCode/);
 const sync=fs.readFileSync(path.join(docs,'sync-yjs.js'),'utf8');
 assert.match(sync,/localStorage\.getItem\("f123_yparty_qa"\) !== "1"/,
  'new pilot remains off unless explicitly enabled per test browser');
});
