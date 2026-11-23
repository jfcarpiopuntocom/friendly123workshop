import test from 'node:test';
import assert from 'node:assert/strict';
import { createSync4Engine } from '../src/sync4-engine.mjs';

function makeMemoryOutbox() {
  const rows = new Map();
  return {
    rows,
    async put(rec) { rows.set(rec.opId, { ...rec }); },
    async get(opId) { return rows.get(opId) || null; },
    async markCommitted(opId, meta) {
      const cur = rows.get(opId);
      if (cur) rows.set(opId, { ...cur, committed: true, committedLayer: meta.layer, receipt: meta.receipt });
    },
    async listPending() {
      return [...rows.values()].filter(r => !r.committed);
    }
  };
}

test('Sync4 primary A (Architecture 2.0) commits cleanly without touching fallbacks B or C', async () => {
  const outbox = makeMemoryOutbox();
  let callsA = 0, callsB = 0, callsC = 0;

  const engine = createSync4Engine({
    licenseCode: 'F123-TEST-SYNC4-0001',
    role: 'empleado',
    outbox,
    primaryA: {
      async send(req) {
        callsA++;
        return { committed: true, stage: 'business-committed', opId: req.opId };
      }
    },
    fallbackB: { async send() { callsB++; return { committed: true }; } },
    fallbackC: { async reinforce() { callsC++; return { relayed: true }; } }
  });

  const res = await engine.submit({
    opId: 'sale-sync4-0001',
    payload: { kind: 'sale', productId: 'p1', qty: 1, totalCents: 2500 }
  });

  assert.equal(res.committed, true);
  assert.equal(res.blocked, false);
  assert.equal(res.layer, 'A-arch20');
  assert.equal(callsA, 1);
  assert.equal(callsB, 0, 'Healthy A must not duplicate traffic on fallback B');
  assert.equal(callsC, 0, 'Healthy A must not trigger fallback C');
});

test('Sync4 S18 non-blocking fallbacks: A down -> B reinforces; B hits 429 quota -> circuit opens, C keeps sale durable & unblocked, then A drains on recovery', async () => {
  let now = 1_795_400_000_000;
  const outbox = makeMemoryOutbox();
  let aOnline = false;
  let bMode = 'ok';
  let callsA = 0, callsB = 0, callsC = 0;

  const engine = createSync4Engine({
    licenseCode: 'F123-TEST-SYNC4-0002',
    role: 'admin',
    outbox,
    clock: () => now,
    primaryA: {
      async send(req) {
        callsA++;
        if (!aOnline) return { committed: false, status: 503, reason: 'yparty-temporary-503' };
        return { committed: true, stage: 'business-committed', opId: req.opId };
      }
    },
    fallbackB: {
      async send(req) {
        callsB++;
        if (bMode === 'quota') return { committed: false, status: 429, reason: 'egress-quota-exceeded' };
        return { committed: true, stage: 'fallback-b-durable', opId: req.opId };
      }
    },
    fallbackC: {
      async reinforce(req) {
        callsC++;
        return { relayed: true, opId: req.opId };
      }
    }
  });

  // 1. A offline, B healthy -> B reinforces seamlessly without blocking
  const r1 = await engine.submit({ opId: 'sale-reinforce-01', payload: { totalCents: 1200 } });
  assert.equal(r1.committed, true);
  assert.equal(r1.blocked, false);
  assert.equal(r1.layer, 'B-relay');
  assert.equal(callsB, 1);

  // 2. B hits quota (429 / egress cap): B circuit opens immediately, C keeps sale durable & UNBLOCKED (no fake committed ACK!)
  bMode = 'quota';
  const r2 = await engine.submit({ opId: 'sale-reinforce-02', payload: { totalCents: 3500 } });
  assert.equal(r2.ok, true);
  assert.equal(r2.localDurable, true);
  assert.equal(r2.committed, false, 'Must NEVER fabricate committed ACK when both A and B failed');
  assert.equal(r2.queuedForCatchUp, true);
  assert.equal(r2.blocked, false, 'Fallbacks must NEVER block sales/UI');
  assert.equal(r2.layer, 'C-local-peer');
  assert.equal(callsC, 1);
  assert.equal(engine.status().fallbackB.open, true, 'Quota 429 must open B circuit breaker immediately');

  // 3. Another sale while B circuit is open: ZERO extra hits to quota-capped B (no retry storm!)
  const callsBBefore = callsB;
  const r3 = await engine.submit({ opId: 'sale-reinforce-03', payload: { totalCents: 4100 } });
  assert.equal(r3.blocked, false);
  assert.equal(r3.localDurable, true);
  assert.equal(callsB, callsBBefore, 'Open circuit breaker prevents retry storm against quota-capped B');

  // 4. Primary A recovers after cooldown -> drainPending commits both queued ops cleanly via A
  now += 10_000;
  aOnline = true;
  const drained = await engine.drainPending();
  assert.equal(drained.length, 2);
  assert.equal(drained.every(d => d.committed === true && d.layer === 'A-arch20'), true);
  assert.equal((await outbox.listPending()).length, 0);
});

test('Sync4 same-opId coalescing + payload conflict fail-closed BEFORE any transport touch', async () => {
  const outbox = makeMemoryOutbox();
  let dispatches = 0;
  let releaseA;
  const gateA = new Promise(r => { releaseA = r; });

  const engine = createSync4Engine({
    licenseCode: 'F123-TEST-SYNC4-0003',
    role: 'dueno',
    outbox,
    primaryA: {
      async send(req) {
        dispatches++;
        await gateA;
        return { committed: true, opId: req.opId };
      }
    }
  });

  // Key order differs (`{a:1,b:2}` vs `{b:2,a:1}`), canonical payload is identical -> must coalesce!
  const p1 = engine.submit({ opId: 'sale-coalesce-99', payload: { a: 1, b: 2 } });
  const p2 = engine.submit({ opId: 'sale-coalesce-99', payload: { b: 2, a: 1 } });

  // Conflicting payload for the SAME in-flight opId MUST fail closed immediately!
  await assert.rejects(
    () => engine.submit({ opId: 'sale-coalesce-99', payload: { a: 1, b: 999 } }),
    (err) => err.code === 'OPID_PAYLOAD_CONFLICT'
  );

  releaseA();
  const [res1, res2] = await Promise.all([p1, p2]);
  assert.equal(dispatches, 1, 'Concurrent identical opId must dispatch ONCE');
  assert.equal(res1.committed, true);
  assert.equal(res2.committed, true);

  // Re-submitting already committed opId with same payload returns duplicate without re-dispatching
  const resDup = await engine.submit({ opId: 'sale-coalesce-99', payload: { a: 1, b: 2 } });
  assert.equal(resDup.duplicate, true);
  assert.equal(dispatches, 1);

  // Re-submitting already committed opId with tampered payload fails closed
  await assert.rejects(
    () => engine.submit({ opId: 'sale-coalesce-99', payload: { a: 1, b: 0 } }),
    (err) => err.code === 'OPID_PAYLOAD_CONFLICT'
  );
});

test('Sync4 fallback B enforces daily byte budget to prevent provider saturation', async () => {
  const outbox = makeMemoryOutbox();
  let callsB = 0;
  const engine = createSync4Engine({
    licenseCode: 'F123-TEST-SYNC4-0004',
    role: 'dueno',
    outbox,
    maxDailyFallbackBBytes: 100, // tiny budget for deterministic proof
    primaryA: { async send() { return { committed: false, status: 503, reason: 'down' }; } },
    fallbackB: { async send() { callsB++; return { committed: true }; } }
  });

  const bigPayload = { note: 'x'.repeat(150) };
  const r = await engine.submit({ opId: 'sale-budget-01', payload: bigPayload });
  assert.equal(callsB, 0, 'Must skip fallback B before exceeding daily byte budget');
  assert.equal(r.blocked, false);
  assert.equal(r.layer, 'C-local-peer');
  assert.equal(engine.status().fallbackB.open, true);
});
