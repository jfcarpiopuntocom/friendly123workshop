import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkChangeSet,verifyInjertoLedger,checkUpstreamOverlap} from './no-clobber.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ledger=JSON.parse(fs.readFileSync(path.join(ROOT,'docs/coordination/INJERTOS-OWNERSHIP.json'),'utf8'));
const inspect=(actor,paths)=>checkChangeSet({ledger,actor,paths});
const codes=x=>x.violations.map(v=>v.code);
test('Sol may add own browser and coordination tests without editing Codex-owned app',()=>{
  const r=inspect('sol',['qa/browser/new-browser.test.cjs','qa/coordination/no-clobber.mjs','docs/coordination/STATUS.md']);
  assert.equal(r.ok,true,JSON.stringify(r.violations));
});
test('Codex can integrate its own app and yparty/Team source',()=>{
  const r=inspect('codex',['apps/friendly-123/docs/mock-backend.js','injertos/yparty-worker/src/index.js','injertos/equipo/authority.mjs']);
  assert.equal(r.ok,true,JSON.stringify(r.violations));
});
test('Sol changes to active Codex commercial source are rejected without explicit handoff',()=>{
  const r=inspect('sol',['apps/friendly-123/docs/mock-backend.js','injertos/dinero/adapter.mjs']);
  assert.equal(r.ok,false);
  assert.equal(codes(r).filter(x=>x==='OWNER_COLLISION').length,2);
});
test('Codex may not silently replace Sol browser regressions',()=>{
  const r=inspect('codex',['qa/browser/browser-first-commercial.test.cjs']);
  assert.deepEqual(codes(r),['OWNER_COLLISION']);
});
test('Claude may add security proofs but cannot rewrite live money adapter',()=>{
  assert.equal(inspect('claude',['qa/seguridad/employee-leak.test.mjs']).ok,true);
  assert.ok(codes(inspect('claude',['injertos/dinero/adapter.mjs'])).includes('OWNER_COLLISION'));
});
test('Legacy root docs and source are protected from all agent feature writes',()=>{
  const r=inspect('codex',['docs/mock-backend.js','src/app/app-inline-01.js','CLAUDE.md']);
  assert.equal(r.ok,false);
  assert.equal(codes(r).filter(x=>x==='UNOWNED_ROOT').length,3);
});
test('Reject real-user-secret-like paths even inside otherwise owned directories',()=>{
  const r=inspect('codex',[
    'apps/friendly-123/.env.production',
    'injertos/equipo/owner-private.pem',
    'injertos/fotos/customer-original.zip',
    'injertos/fotos/production.sqlite'
  ]);
  assert.equal(r.ok,false);
  assert.equal(codes(r).filter(x=>x==='SENSITIVE_PATH').length,4);
});
test('Reject path traversal and non-normalized files before ownership matching',()=>{
  const r=inspect('sol',['qa/browser/../../docs/index.html','qa//browser/t.cjs','/tmp/secret.txt','qa\\browser\\test.cjs']);
  assert.equal(r.ok,false);
  assert.equal(codes(r).filter(x=>x==='INVALID_PATH').length,4);
});
test('Require a known agent identity, do not accept an anonymous owner',()=>{
  const r=inspect('unknown',['qa/browser/abc.test.cjs']);
  assert.deepEqual(codes(r),['UNKNOWN_ACTOR']);
});
test('Duplicate changed file paths are rejected before write/checks',()=>{
  const r=inspect('sol',['qa/browser/x.test.cjs','qa/browser/x.test.cjs']);
  assert.ok(codes(r).includes('DUPLICATE_PATH'));
});
test('Manifest claims integrated only with exact 40-character proof and real existing paths',()=>{
  const files=new Set(['apps/friendly-123/docs/index.html','qa/browser/browser-first-commercial.test.cjs']);
  const r=verifyInjertoLedger({ledger,exists:p=>files.has(p)});
  assert.equal(r.ok,true,JSON.stringify(r.violations));
});
test('Manifest refuses invented integration status when files or SHA proof are missing',()=>{
  const bad=structuredClone(ledger);
  bad.components.find(x=>x.id==='team-real-role-authority').status='integrated';
  const r=verifyInjertoLedger({ledger:bad,exists:()=>false});
  assert.equal(r.ok,false);
  assert.ok(codes(r).includes('UNPROVEN_INTEGRATION'));
});
test('Manifest rejects incorrect evidence SHA and missing bytes for formerly integrated component',()=>{
  const bad=structuredClone(ledger);
  const b=bad.components.find(x=>x.id==='public-baseline-v781');
  b.proofSha='short';
  const r=verifyInjertoLedger({ledger:bad,exists:()=>false});
  assert.ok(codes(r).includes('UNPROVEN_INTEGRATION'));
});
test('Manifest cannot mislabel a deferred PWA as installed without evidence',()=>{
  const bad=structuredClone(ledger);
  const x=bad.components.find(x=>x.id==='workbox-pwa');
  x.status='integrated';
  const r=verifyInjertoLedger({ledger:bad,exists:()=>false});
  assert.ok(codes(r).includes('UNPROVEN_INTEGRATION'));
});
test('Reject strange owner specifications that could let Codex/Claude clobber each other',()=>{
  const bad=structuredClone(ledger);
  bad.owners.push({pattern:'injertos/equipo/**',owner:'sol'});
  const r=verifyInjertoLedger({ledger:bad,exists:()=>true});
  assert.ok(codes(r).includes('OVERLAPPING_OWNERS'));
});

test('Even a clean same-owner PR fails if Codex changed the same file after branch point',()=>{
  const r=checkUpstreamOverlap({
    ours:['apps/friendly-123/docs/mock-backend.js','qa/browser/other.test.cjs'],
    upstream:['apps/friendly-123/docs/mock-backend.js']
  });
  assert.equal(r.ok,false);
  assert.deepEqual(codes(r),['UPSTREAM_PATH_OVERLAP']);
});
test('Disjoint upstream and local paths are safe for independent integration',()=>{
  const r=checkUpstreamOverlap({
    ours:['qa/coordination/new-guard.mjs'],
    upstream:['apps/friendly-123/docs/mock-backend.js','injertos/dinero/adapter.mjs']
  });
  assert.equal(r.ok,true);
});
test('Shared docs are still protected if two collaborators edited the exact same file',()=>{
  const r=checkUpstreamOverlap({
    ours:['docs/coordination/ESTADO-UNIFICACION-2026-11-16.md'],
    upstream:['docs/coordination/ESTADO-UNIFICACION-2026-11-16.md']
  });
  assert.equal(r.ok,false);
  assert.ok(codes(r).includes('UPSTREAM_PATH_OVERLAP'));
});
test('A stale merge cannot be made safe by listing a path twice',()=>{
  const r=checkUpstreamOverlap({ours:['qa/coordination/no-clobber.mjs','qa/coordination/no-clobber.mjs'],upstream:[]});
  assert.equal(r.ok,false);
  assert.ok(codes(r).includes('DUPLICATE_PATH'));
});
