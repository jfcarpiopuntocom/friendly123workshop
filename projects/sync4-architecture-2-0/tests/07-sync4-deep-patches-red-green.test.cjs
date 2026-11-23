'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {
  patchTeamTicketParams,
  patchReadOnlyCatalogSession,
  patchWsWorkerApi,
  patchAuthUiCentralTeamPin,
  patchSyncYjsNonBlocking,
  patchTeamAuthorityPinOnlyVerify
} = require('../src/sync4-deep-patchers.cjs');

const ROOT = 'C:/00 Projects/claude-f123/wt-multisala';

test('RED -> GREEN (C16): ws-team-ticket-params allows cat:read on -cat while still denying cat:write/priv/fotos:write', () => {
  const file = ROOT + '/src/ws-team-ticket-params.mjs';
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');

  assert.ok(!raw.includes("'cat:read'"), 'RED: unpatched ws-team-ticket-params rejects cat:read');
  const { changed, source } = patchTeamTicketParams(raw);
  assert.equal(changed, true);
  assert.ok(source.includes("const CAT_ROOM = /^[a-f0-9]{32}-cat$/;"));
  assert.ok(source.includes("'cat:read': CAT_ROOM"));
  assert.ok(!source.includes("'cat:write'"), 'Team ticket client must NEVER request cat:write');
  assert.ok(!source.includes("'priv:read'"), 'Team ticket client must NEVER request priv:read');
  assert.ok(!source.includes("'fotos:write'"), 'Team ticket client must NEVER request fotos:write');
});

test('RED -> GREEN (C16): port2-readonly-catalog-session supports team tickets + sala-vacia cold-join', () => {
  const file = ROOT + '/src/port2-readonly-catalog-session.mjs';
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');

  assert.ok(!raw.includes('createTeamTicketParams'), 'RED: unpatched readonly catalog hardcodes owner tickets');
  assert.ok(!raw.includes('sala-vacia'), 'RED: unpatched readonly catalog rejects sala-vacia');

  const { changed, source } = patchReadOnlyCatalogSession(raw);
  assert.equal(changed, true);
  assert.ok(source.includes("import {createTeamTicketParams} from './ws-team-ticket-params.mjs';"));
  assert.ok(source.includes("scope:'cat:read'"));
  assert.ok(source.includes("body.frozenHead!=='sala-vacia'"));
  assert.ok(source.includes('assertPublicCatalogTransportDoc({doc:publicDoc,room});'), 'Public allowlist assertion remains mandatory');
});

test('RED -> GREEN (C16): ws-worker-api supplies safe Sync4 default Team grants when WS_QA_ROLE_GRANTS is unset', () => {
  const file = ROOT + '/cloudflare-worker/ws-worker-api.mjs';
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');

  assert.ok(raw.includes('let grants={};'), 'RED: unpatched ws-worker-api defaults Team grants to empty {}');
  const { changed, source } = patchWsWorkerApi(raw);
  assert.equal(changed, true);
  assert.ok(source.includes("admin:['cat:read','ops:sale','ops:adjust','ops:payment','fotos:read']"));
  assert.ok(source.includes("empleado:['cat:read','ops:sale','ops:payment','fotos:read']"));
  assert.ok(source.includes('if(env.WS_QA_ROLE_GRANTS!==undefined)grants=JSON.parse(env.WS_QA_ROLE_GRANTS)'), 'Explicit env override preserved');
});

test('RED -> GREEN (C17): auth-ui wires central /team/verify on strict OC_WORKER_URL origin', () => {
  const file = ROOT + '/docs/auth-ui.js';
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');

  assert.ok(!raw.includes('/team/verify'), 'RED: unpatched auth-ui never calls central /team/verify');
  const { changed, source } = patchAuthUiCentralTeamPin(raw);
  assert.equal(changed, true);
  assert.ok(source.includes('epC17.origin + "/team/verify"'));
  assert.ok(source.includes('epC17.hostname === "friendly123-licencias.jfcarpio.workers.dev"'));
  assert.ok(source.includes('window.__f123CentralTeamPrincipal'));
});

test('RED -> GREEN (S18): sync-yjs does not let broken legacy Sync3 pendingStructs block Sync4 activation', () => {
  const file = ROOT + '/docs/sync-yjs.js';
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');

  assert.ok(!raw.includes('sync4Direct'), 'RED: unpatched sync-yjs blocks 2.0 on legacy pendingStructs');
  const { changed, source } = patchSyncYjsNonBlocking(raw);
  assert.equal(changed, true);
  assert.ok(source.includes('var sync4Direct = !!(API.rollout && (API.rollout.sync4 === true || API.rollout.frozenHead === "sala-vacia"));'));
});

test('RED -> GREEN (C17): team-authority.mjs supports PIN-only keypad verify without subject + preserves rate limit', () => {
  const file = ROOT + '/cloudflare-worker/team-authority.mjs';
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, 'utf8');

  assert.ok(raw.includes("if(!id||!SUBJECT.test(input.subject||'')||!validPin(input.pin))return deny('invalid-input');"),
    'RED: unpatched team-authority rejects PIN-only keypad verify without subject');
  const { changed, source } = patchTeamAuthorityPinOnlyVerify(raw);
  assert.equal(changed, true);
  assert.ok(source.includes("const attemptsKey='team-attempts-v1:'+id.license+':__pin__';"));
  assert.ok(source.includes('if(cand&&same(m.fingerprint,cand)&&!matched)matched=m;'));
});
