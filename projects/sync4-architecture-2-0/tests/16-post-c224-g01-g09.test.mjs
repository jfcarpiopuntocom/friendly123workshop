import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { applyBloque1G01ToG06CfRelay, applyBloque2G07ToG09 } from '../src/post-c224-g01-g09.mjs';
import {
  initRelaySchema,
  createRelayStore,
  mintSessionToken,
  verifySessionToken
} from '../cloudflare-relay-worker/src/priv-relay-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function makeDoStorage() {
  const db = new DatabaseSync(':memory:');
  const sql = {
    exec(query, ...params) {
      if (params.length === 0 && query.includes(';') && query.trim().toUpperCase().startsWith('CREATE')) {
        db.exec(query);
        return { toArray: () => [] };
      }
      const stmt = db.prepare(query);
      if (/^\s*SELECT\b/i.test(query) || /\bRETURNING\b/i.test(query)) {
        return { toArray: () => stmt.all(...params) };
      }
      stmt.run(...params);
      return { toArray: () => [] };
    }
  };
  return {
    sql,
    transactionSync(fn) {
      db.exec('BEGIN IMMEDIATE');
      try { const r = fn(); db.exec('COMMIT'); return r; }
      catch (e) { db.exec('ROLLBACK'); throw e; }
    },
    async sync() {}
  };
}

test('Bloque I (G01-G06) RED -> GREEN: G01 blocks cold empty ckpt overwrite, G02 prunes N-2 ckpts, G03 tolerates ±60s clock skew, G06 closes 1013 on 507', async () => {
  // 1. G02: N-2 checkpoint pruning in SQLite DO
  const storage = makeDoStorage();
  initRelaySchema(storage.sql);
  const store = createRelayStore(storage);
  const validCipher = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(64))));

  await store.putCkpt({ rev: 0, seq: 1, lam: 1, c: validCipher });
  await store.putCkpt({ rev: 1, seq: 2, lam: 2, c: validCipher });
  await store.putCkpt({ rev: 2, seq: 3, lam: 3, c: validCipher });
  await store.putCkpt({ rev: 3, seq: 4, lam: 4, c: validCipher });

  const remainingRevs = storage.sql.exec('SELECT rev FROM relay_ckpt_meta ORDER BY rev ASC').toArray().map(r => r.rev);
  assert.deepEqual(remainingRevs, [3, 4], 'G02: only the last 2 checkpoint revisions (N-1, N) remain in SQLite');

  // 2. G03: ±60s clock skew tolerance on iat
  const secret = store.getOrCreateDoSecret();
  const room = 'a'.repeat(40) + '-y';
  const futureClock = () => 1_700_000_045_000; // isolate A is 45s ahead of isolate B
  const laggingClock = () => 1_700_000_000_000;
  const minted = await mintSessionToken({}, {
    room, licenseCode: 'F123-TEST-12345678', instanceId: 'inst-123456', role: 'dueno', roleRevision: 1
  }, futureClock, secret);
  const verified = await verifySessionToken({}, minted.token, room, laggingClock, secret);
  assert.equal(verified.ok, true, 'G03: token issued 45s ahead in another isolate passes within ±60s clock skew tolerance');

  // 3. G01 & G06 on enhanced cf-relay.js
  const rawCfRelay = fs.readFileSync(path.join(ROOT, 'browser', 'cf-relay.js'), 'utf8');
  const enhancedCfRelay = applyBloque1G01ToG06CfRelay(rawCfRelay);

  let serverRev = 2;
  let force507 = false;
  async function mockFetch(url, init = {}) {
    const u = new URL(url);
    if (u.pathname === '/ws/ticket') {
      return new Response(JSON.stringify({ ok: true, token: 'tok.1' }), { status: 200 });
    }
    if (u.pathname.endsWith('/session')) {
      return new Response(JSON.stringify({ ok: true, token: 'sess.1', expiresAt: Date.now() + 600_000 }), { status: 200 });
    }
    if (u.pathname.endsWith('/head')) {
      return new Response(JSON.stringify({ ok: true, v: 2, rev: serverRev, seq: 5 }), { status: 200 });
    }
    if (u.pathname.endsWith('/op')) {
      if (force507) return new Response(JSON.stringify({ ok: false, reason: 'store-quota-exceeded' }), { status: 507 });
      return new Response(JSON.stringify({ ok: true, seq: 6 }), { status: 201 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const sandbox = {
    window: { addEventListener() {} },
    crypto, TextEncoder, atob, btoa, Blob, DOMException, URL, Response, Headers, setInterval, clearInterval,
    document: { hidden: false }
  };
  vm.runInNewContext(enhancedCfRelay, sandbox);
  const relay = sandbox.window.F123CloudflareRelay.create({
    fetch: mockFetch,
    livePollMs: 0,
    getCredentials: () => ({
      role: 'dueno', licenseCode: 'F123-TEST-12345678', instanceId: 'inst-123456',
      authSuffix: '-priv', scopes: ['priv:read', 'priv:write'],
      credentials: { kind: 'owner', licenseCode: 'F123-TEST-12345678', instanceId: 'inst-123456', pin: '555' }
    })
  });
  const locator = 'wss://friendly123-sync-relay.jfcarpio.workers.dev/sala/' + room;
  const ws = relay.connect(locator);
  const messages = [];
  const closes = [];
  await new Promise(r => { ws.onopen = r; });
  ws.onmessage = e => messages.push(JSON.parse(e.data));
  ws.onclose = e => closes.push(e);

  // G01: Cold device tries to push rev:0 checkpoint before pulling when server already has rev:2
  ws.send(JSON.stringify({ k: 'ckpt', v: 2, rev: 0, seq: 0, id: 'cold-empty-ckpt', ack: 1, c: validCipher }));
  await new Promise(r => setTimeout(r, 40));
  const blockedAck = messages.find(m => m.id === 'cold-empty-ckpt');
  assert.deepEqual(blockedAck, { k: 'persist-result', kind: 'ckpt', id: 'cold-empty-ckpt', ok: false, conflict: true }, 'G01 must block cold unpulled rev:0 ckpt overwrite');

  // G06: Server returns 507 -> socket closes with 1013 so relay-selector fails back to Layer 1/2
  force507 = true;
  ws.send(JSON.stringify({ k: 'op', id: 'op-quota', ack: 1, c: validCipher }));
  await new Promise(r => setTimeout(r, 40));
  assert.equal(closes.length, 1);
  assert.equal(closes[0].code, 1013, 'G06: 507 closes with 1013 to trigger relay-selector fallback');
});

test('Bloque II (G07-G09) RED -> GREEN: G07 pauses empty Layer 0 for 3 min + registers recovery, G09 binds online/offline in help-ui', () => {
  const rsPatch = fs.readFileSync(path.join(ROOT, 'patches-v895', '13-v901-relay-selector-3layer-cf-privado.patch'), 'utf8');
  assert.match(rsPatch, /f123_relay_cupo_cf_v1/);

  // Simulate relay-selector + help-ui snippets with applyBloque2G07ToG09
  const fakeRs =
    '    fb.leerHead(url).then(function (n) {\n' +
    '      sumarBajada(capaFb, null, url);\n' +
    '      if (!n || !(n.rev || n.seq) || ws.readyState !== 1) return;\n' +
    '      var c = leer(capa.key); c.pausaHasta = Date.now() + PAUSA_MS; guardar(capa.key, c);\n' +
    '      try { ws.close(1013, "layer empty; next durable layer has data"); } catch (_) {}\n' +
    '    }).catch(function () {});';
  const fakeHu =
    '  window.addEventListener("oc-op-20-recibo", function () { pintarMini(); });\n' +
    '  window.addEventListener("oc-login", function () { setTimeout(function () { pintarMini(); }, 250); });';

  const out = applyBloque2G07ToG09({ relaySelectorSource: fakeRs, helpUiSource: fakeHu });
  assert.match(out.relaySelectorSource, /OTRA_CAPA_LEER_MS/);
  assert.match(out.relaySelectorSource, /_fallbackRecovery\[url\] = list/);
  assert.match(out.helpUiSource, /window\.addEventListener\("online"/);
  assert.match(out.helpUiSource, /window\.addEventListener\("offline"/);
});
