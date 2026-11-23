import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createSync4Engine, createJsonOutbox } from '../src/sync4-engine.mjs';
import { createSync4AccountingLedger } from '../src/sync4-accounting-ledger.mjs';

const WORKER_DIR = 'C:/00 Projects/claude-f123/wt-multisala/cloudflare-worker';
const HAS_REAL_WORKER = fs.existsSync(WORKER_DIR + '/ws-capability-issuer.mjs');

test('Micropaso 56: 100x replay storm of same opId applies stock & money EXACTLY ONCE', async () => {
  const ledger = createSync4AccountingLedger({
    initialProducts: [{ id: 'p-storm', stockActual: 50, unitPriceCents: 1999, artistCommissionBps: 2500 }]
  });
  const outbox = createJsonOutbox();
  let serverCalls = 0;

  const engine = createSync4Engine({
    licenseCode: 'F123-STORM-56-0001',
    role: 'empleado',
    outbox,
    primaryA: {
      async send({ opId, payload }) {
        serverCalls++;
        return ledger.applyOp(opId, payload);
      }
    }
  });

  const cmd = {
    opId: 'sale-storm-100x-01',
    payload: { kind: 'sale.record', productId: 'p-storm', quantity: 2, amountCents: 3998 }
  };

  // 50 simultaneous concurrent submissions
  const batch1 = await Promise.all(Array.from({ length: 50 }, () => engine.submit(cmd)));
  assert.equal(batch1.every(r => r.committed === true), true);
  assert.equal(serverCalls, 1, '50 concurrent identical calls must coalesce into 1 network dispatch');

  // 50 sequential replays after commit
  for (let i = 0; i < 50; i++) {
    const r = await engine.submit(cmd);
    assert.equal(r.committed, true);
    assert.equal(r.duplicate, true);
  }

  assert.equal(serverCalls, 1, '100 total submissions must hit server exactly ONCE');
  const s = ledger.summary();
  assert.equal(s.stockByProduct['p-storm'], 48, 'Stock decremented ONCE (50 -> 48)');
  assert.equal(s.netRevenueCents, 3998, 'Revenue recorded ONCE ($39.98)');
  assert.equal(s.uniqueOpsCount, 1);
});

test('Micropaso 39 + 57 + 61: HTTP 202 / lost ACK never fakes committed; cold browser restart reconciles cleanly with 0 double charge', async () => {
  const ledger = createSync4AccountingLedger({
    initialProducts: [{ id: 'p-202', stockActual: 10, unitPriceCents: 2500 }]
  });
  const outbox1 = createJsonOutbox();
  let modeA = '202-persisted'; // Server persists sale, returns 202 (unproven ACK)

  const transportA = {
    async send({ opId, payload }) {
      const applied = ledger.applyOp(opId, payload);
      if (modeA === '202-persisted') {
        return { committed: false, status: 202, stage: 'stored-for-application' };
      }
      return applied;
    }
  };

  let callsB = 0;
  const engine1 = createSync4Engine({
    licenseCode: 'F123-ACK202-57-01',
    role: 'admin',
    outbox: outbox1,
    primaryA: transportA,
    fallbackB: {
      async send() { callsB++; return { committed: false, status: 202, connected: true }; }
    }
  });

  const cmd = {
    opId: 'sale-202-lostack-01',
    payload: { kind: 'sale.record', productId: 'p-202', quantity: 1, amountCents: 2500 }
  };

  // 1. A persists on DO but client only gets HTTP 202 -> MUST NOT fake committed:true & MUST NOT fork onto B!
  const r1 = await engine1.submit(cmd);
  assert.equal(r1.committed, false, 'HTTP 202 MUST NEVER be treated as committed ACK');
  assert.equal(r1.pendingAck, true);
  assert.equal(r1.localDurable, true);
  assert.equal(r1.blocked, false);
  assert.equal(callsB, 0, 'A returning 202 must NOT fork same op onto fallback B');

  // 2. Micropaso 61: Simulate Safari/Opera full restart — serialize outbox to JSON, spin up brand-new engine!
  const persistedSnapshot = outbox1.exportSnapshot();
  const outboxAfterRestart = createJsonOutbox(persistedSnapshot);
  modeA = 'normal';

  const engine2 = createSync4Engine({
    licenseCode: 'F123-ACK202-57-01',
    role: 'admin',
    outbox: outboxAfterRestart,
    primaryA: transportA
  });

  const failback = await engine2.reconcileAndFailbackToA();
  assert.equal(failback.readyForSteadyStateA, true);
  assert.equal(failback.remainingPending, 0);
  assert.equal(failback.committedNow, 1);

  // Exact single business effect despite 202 + browser restart + replay!
  assert.equal(ledger.summary().stockByProduct['p-202'], 9);
  assert.equal(ledger.summary().netRevenueCents, 2500);
  assert.equal(ledger.summary().uniqueOpsCount, 1);
});

test('Micropaso 39: Fallback B returning only HTTP 202 / connected without proven persistence is rejected as uncommitted', async () => {
  const outbox = createJsonOutbox();
  const engine = createSync4Engine({
    licenseCode: 'F123-FALLBACKB-39',
    role: 'dueno',
    outbox,
    primaryA: { async send() { return { committed: false, status: 503, reason: 'down' }; } },
    fallbackB: { async send() { return { status: 202, connected: true }; } },
    fallbackC: { async reinforce() { return { relayed: true }; } }
  });

  const r = await engine.submit({ opId: 'sale-b-202-01', payload: { totalCents: 500 } });
  assert.equal(r.committed, false, 'Unproven 202 from Fallback B MUST NOT mark committed');
  assert.equal(r.localDurable, true);
  assert.equal(r.blocked, false);
  assert.equal((await outbox.listPending()).length, 1);
});

test('Micropaso 43 + 60 + 32: Partial ACK during failback keeps remaining ops durable until full A absorption + exposes diagnostics', async () => {
  let now = 1_795_420_000_000;
  const outbox = createJsonOutbox();
  let failOp2Once = true;
  let aOnline = false;

  const engine = createSync4Engine({
    licenseCode: 'F123-FAILBACK-60',
    role: 'dueno',
    outbox,
    clock: () => now,
    primaryA: {
      async send({ opId }) {
        if (!aOnline) return { committed: false, status: 503, reason: 'offline' };
        if (opId === 'op-fb-02' && failOp2Once) {
          failOp2Once = false;
          return { committed: false, status: 503, reason: 'partial-ack-interruption' };
        }
        return { committed: true, stage: 'business-committed', opId };
      }
    }
  });

  // Queue 3 ops offline in C
  await engine.submit({ opId: 'op-fb-01', payload: { n: 1 } });
  await engine.submit({ opId: 'op-fb-02', payload: { n: 2 } });
  await engine.submit({ opId: 'op-fb-03', payload: { n: 3 } });
  assert.equal((await outbox.listPending()).length, 3);

  // A comes back, commits op-fb-01, then hits 503 on op-fb-02 (partial ACK -> circuit opens & preserves FIFO barrier!)
  now += 20_000;
  aOnline = true;
  const fb1 = await engine.reconcileAndFailbackToA();
  assert.equal(fb1.readyForSteadyStateA, false, 'Must NOT declare steady-state A ready while ops remain pending');
  assert.equal(fb1.committedNow, 1, 'op-fb-01 committed before 503 interruption');
  assert.equal(fb1.remainingPending, 2, 'FIFO barrier preserves op-fb-02 and op-fb-03 durable after 503');
  assert.deepEqual(fb1.remainingOpIds, ['op-fb-02', 'op-fb-03']);

  // After breaker cooldown, second reconciliation absorbs op-fb-02 & op-fb-03 in exact FIFO order and completes failback
  now += 10_000;
  const fb2 = await engine.reconcileAndFailbackToA();
  assert.equal(fb2.readyForSteadyStateA, true);
  assert.equal(fb2.committedNow, 2);
  assert.equal(fb2.remainingPending, 0);
  assert.equal(fb2.rutaEfectiva, 'sync4-a-2.0');

  // Micropaso 32 diagnostics check (no PINs/PII, per-opId transport trail)
  const diag = engine.diagnostics();
  assert.equal(diag.rutaEfectiva, 'sync4-a-2.0');
  assert.ok(diag.recentOps.some(e => e.opId === 'op-fb-02' && e.committed === true && e.layer === 'A-arch20'));
});

test('Micropaso 47 + 65: Two-store strict cross-isolation (Shop Alpha vs Shop Beta) with REAL ws-capability-issuer', async () => {
  if (!HAS_REAL_WORKER) return;
  const { pinAuthority } = await import(pathToFileURL(WORKER_DIR + '/pin-authority.mjs').href);
  const { teamAuthority } = await import(pathToFileURL(WORKER_DIR + '/team-authority.mjs').href);
  const { wsCapabilityAuthority, roomForLicense } = await import(pathToFileURL(WORKER_DIR + '/ws-capability-issuer.mjs').href);

  const kv = new Map();
  const tx = {
    async get(k) { return kv.has(k) ? structuredClone(kv.get(k)) : undefined; },
    async put(k, v) { kv.set(k, structuredClone(v)); },
    async delete(k) { kv.delete(k); },
    async list({ prefix = '', limit = 128 } = {}) {
      const m = new Map();
      for (const [k, v] of kv.entries()) if (k.startsWith(prefix) && m.size < limit) m.set(k, structuredClone(v));
      return m;
    }
  };
  const storage = { ...tx, async transaction(fn) { return fn(tx); } };

  const SHOP_A = 'F123-SHOP-ALPHA-0001';
  const SHOP_B = 'F123-SHOP-BETA-0002';
  const INST_A = 'inst-alpha-01';
  const INST_B = 'inst-beta-02';
  await storage.put('inst:' + INST_A, { instanceId: INST_A, licenseCode: SHOP_A, estado: 'activa' });
  await storage.put('inst:' + INST_B, { instanceId: INST_B, licenseCode: SHOP_B, estado: 'activa' });

  const now = 1_795_430_000_000;
  const ownerAuth = pinAuthority(storage, 'pepper-owner-two-store-test-32bytes-01', () => now);
  const teamAuth = teamAuthority({ storage, ownerAuthority: ownerAuth, secret: 'pepper-team-two-store-test-32bytes-02', clock: () => now });
  await ownerAuth.reportExisting(SHOP_A, INST_A, '111', now);
  await ownerAuth.reportExisting(SHOP_B, INST_B, '222', now);

  const issuer = wsCapabilityAuthority({
    storage, ownerAuthority: ownerAuth, teamAuthority: teamAuth,
    secret: 'ws-key-two-store-isolation-32bytes-03', clock: () => now
  });

  const roomA = (await roomForLicense(SHOP_A)) + '-ops';
  const roomB = (await roomForLicense(SHOP_B)) + '-ops';
  assert.notEqual(roomA, roomB);

  // Shop A cannot obtain a ticket for Shop B's room!
  const crossIssue = await issuer.issue({
    credentials: { kind: 'owner', licenseCode: SHOP_A, instanceId: INST_A, pin: '111' },
    room: roomB,
    scopes: ['ops:sale']
  });
  assert.equal(crossIssue.ok, false);
  assert.equal(crossIssue.reason, 'room-mismatch');

  // Valid ticket for Shop A MUST be rejected if presented to Shop B!
  const validA = await issuer.issue({
    credentials: { kind: 'owner', licenseCode: SHOP_A, instanceId: INST_A, pin: '111' },
    room: roomA,
    scopes: ['ops:sale']
  });
  assert.equal(validA.ok, true);
  const crossConsume = await issuer.consume({
    token: validA.token,
    licenseCode: SHOP_B,
    instanceId: INST_B,
    room: roomB,
    requiredScope: 'ops:sale'
  });
  assert.equal(crossConsume.ok, false);
  assert.equal(crossConsume.reason, 'identity-or-room-mismatch');

  // Separate Sync4 engines + ledgers: Shop A outage/sales NEVER affect Shop B!
  const ledgerA = createSync4AccountingLedger({ initialProducts: [{ id: 'item-1', stockActual: 10, unitPriceCents: 1000 }] });
  const ledgerB = createSync4AccountingLedger({ initialProducts: [{ id: 'item-1', stockActual: 10, unitPriceCents: 1000 }] });
  const engA = createSync4Engine({
    licenseCode: SHOP_A, role: 'dueno', outbox: createJsonOutbox(),
    primaryA: { async send() { return { committed: false, status: 503, reason: 'shop-a-down' }; } }
  });
  const engB = createSync4Engine({
    licenseCode: SHOP_B, role: 'dueno', outbox: createJsonOutbox(),
    primaryA: { async send({ opId, payload }) { return ledgerB.applyOp(opId, payload); } }
  });

  const rA = await engA.submit({ opId: 'op-shared-name-01', payload: { kind: 'sale.record', productId: 'item-1', quantity: 4, amountCents: 4000 } });
  const rB = await engB.submit({ opId: 'op-shared-name-01', payload: { kind: 'sale.record', productId: 'item-1', quantity: 1, amountCents: 1000 } });
  assert.equal(rA.committed, false);
  assert.equal(rB.committed, true);
  assert.equal(ledgerA.summary().stockByProduct['item-1'], 10);
  assert.equal(ledgerB.summary().stockByProduct['item-1'], 9);
});
