import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { createSync4Engine } from '../src/sync4-engine.mjs';
import { verifyCentralPinAllRoles } from '../src/sync4-central-pin-client.mjs';
import { createSync4CatalogBridge } from '../src/sync4-catalog-bridge.mjs';

const WORKER_DIR = 'C:/00 Projects/claude-f123/wt-multisala/cloudflare-worker';
const HAS_REAL_WORKER = fs.existsSync(WORKER_DIR + '/ws-capability-issuer.mjs');

function makeDoStorage() {
  const kv = new Map();
  const tx = {
    async get(k) { return kv.has(k) ? structuredClone(kv.get(k)) : undefined; },
    async put(k, v) { kv.set(k, structuredClone(v)); },
    async delete(k) { kv.delete(k); },
    async list({ prefix = '', limit = 128 } = {}) {
      const out = new Map();
      for (const [k, v] of kv.entries()) {
        if (k.startsWith(prefix)) {
          out.set(k, structuredClone(v));
          if (out.size >= limit) break;
        }
      }
      return out;
    }
  };
  return {
    kv,
    get: tx.get,
    put: tx.put,
    delete: tx.delete,
    list: tx.list,
    async transaction(fn) { return fn(tx); }
  };
}

function makeOutbox() {
  const rows = new Map();
  return {
    rows,
    async put(r) { rows.set(r.opId, { ...r }); },
    async get(id) { return rows.get(id) || null; },
    async markCommitted(id, meta) {
      const cur = rows.get(id);
      if (cur) rows.set(id, { ...cur, committed: true, committedLayer: meta.layer, receipt: meta.receipt });
    },
    async listPending() { return [...rows.values()].filter(r => !r.committed); }
  };
}

test('3-Device A->B->A x2 E2E Sync4 with REAL HMAC ws-capability-issuer, Central Panel PIN (C17), All Roles (C16), Non-Blocking Fallbacks (S18) & Revocation', async () => {
  if (!HAS_REAL_WORKER) return;

  const { pinAuthority } = await import(pathToFileURL(WORKER_DIR + '/pin-authority.mjs').href);
  const { teamAuthority } = await import(pathToFileURL(WORKER_DIR + '/team-authority.mjs').href);
  const { wsCapabilityAuthority, roomForLicense } = await import(pathToFileURL(WORKER_DIR + '/ws-capability-issuer.mjs').href);

  let now = 1_795_410_000_000;
  const clock = () => now;
  const storage = makeDoStorage();
  const LICENSE = 'F123-SYNC4-E2E-9999';
  const DEV_OWNER = 'dev-opera-owner-01';
  const DEV_ADMIN = 'dev-iphone-admin-02';
  const DEV_EMP = 'dev-iphone-emp-03';

  // Register 3 physical devices in central panel KV/DO storage
  for (const inst of [DEV_OWNER, DEV_ADMIN, DEV_EMP]) {
    await storage.put('inst:' + inst, { instanceId: inst, licenseCode: LICENSE, estado: 'activa' });
  }

  const PIN_PEPPER = 'pepper-owner-pin-test-key-32-bytes-min-001';
  const TEAM_PEPPER = 'pepper-team-pin-test-key-32-bytes-min-002';
  const WS_KEY = 'hmac-ws-signing-test-key-32-bytes-min-003';

  const ownerAuth = pinAuthority(storage, PIN_PEPPER, clock);
  const teamAuth = teamAuthority({ storage, ownerAuthority: ownerAuth, secret: TEAM_PEPPER, clock });

  // Configure Owner PIN (842) + Admin (517) + Employee (309) in central panel
  const sealOwner = await ownerAuth.reportExisting(LICENSE, DEV_OWNER, '842', now);
  assert.equal(sealOwner.ok, true);
  assert.equal((await ownerAuth.status(LICENSE)).revision, 1);

  const sealAdmin = await teamAuth.update({
    licenseCode: LICENSE,
    instanceId: DEV_OWNER,
    ownerPin: '842',
    expectedRevision: 0,
    opId: 'team-add-admin-01',
    subject: 'adm-belen-01',
    role: 'admin',
    pin: '517',
    active: true
  });
  assert.equal(sealAdmin.ok, true);

  const sealEmp = await teamAuth.update({
    licenseCode: LICENSE,
    instanceId: DEV_OWNER,
    ownerPin: '842',
    expectedRevision: 1,
    opId: 'team-add-emp-02',
    subject: 'emp-luis-02',
    role: 'empleado',
    pin: '309',
    active: true
  });
  assert.equal(sealEmp.ok, true);

  // Real Sync4 C16 issuer with default least-privilege grants
  const issuer = wsCapabilityAuthority({
    storage,
    ownerAuthority: ownerAuth,
    teamAuthority: teamAuth,
    secret: WS_KEY,
    clock,
    grants: {
      admin: ['cat:read', 'ops:sale', 'ops:adjust', 'ops:payment', 'fotos:read'],
      empleado: ['cat:read', 'ops:sale', 'ops:payment', 'fotos:read']
    }
  });

  // Wire Central Panel HTTP fetch adapter for verifyCentralPinAllRoles (C17)
  const panelFetch = async (url, init) => {
    const pathname = new URL(url).pathname;
    const body = JSON.parse(init.body);
    if (pathname === '/pin/verify') {
      const r = await ownerAuth.verify(body.licenseCode, body.pin);
      return { ok: r.ok, status: r.ok ? 200 : 403, json: async () => r };
    }
    if (pathname === '/team/verify') {
      const r = await teamAuth.verify(body);
      return { ok: r.ok, status: r.ok ? 200 : 403, json: async () => r };
    }
    return { ok: false, status: 404, json: async () => ({ ok: false }) };
  };

  // === CYCLE 1: Brand-new Admin & Employee devices unlock via Central Panel (ZERO Sync3!) ===
  const loginOwner = await verifyCentralPinAllRoles({ licenseCode: LICENSE, instanceId: DEV_OWNER, pin: '842', fetchImpl: panelFetch });
  const loginAdmin = await verifyCentralPinAllRoles({ licenseCode: LICENSE, instanceId: DEV_ADMIN, pin: '517', subject: 'adm-belen-01', fetchImpl: panelFetch });
  const loginEmp = await verifyCentralPinAllRoles({ licenseCode: LICENSE, instanceId: DEV_EMP, pin: '309', subject: 'emp-luis-02', fetchImpl: panelFetch });

  assert.equal(loginOwner.ok && loginOwner.role === 'dueno', true);
  assert.equal(loginAdmin.ok && loginAdmin.role === 'admin', true);
  assert.equal(loginEmp.ok && loginEmp.role === 'empleado', true);

  const baseRoom = await roomForLicense(LICENSE);
  const catRoom = baseRoom + '-cat';
  const opsRoom = baseRoom + '-ops';
  const privRoom = baseRoom + '-priv';

  const ownerCreds = { kind: 'owner', licenseCode: LICENSE, instanceId: DEV_OWNER, pin: '842' };
  const adminCreds = { kind: 'team', licenseCode: LICENSE, instanceId: DEV_ADMIN, subject: 'adm-belen-01', role: 'admin', pin: '517' };
  const empCreds = { kind: 'team', licenseCode: LICENSE, instanceId: DEV_EMP, subject: 'emp-luis-02', role: 'empleado', pin: '309' };

  // Real HMAC-SHA256 tickets: Admin & Employee GET `cat:read`, Employee DENIED `cat:write`, `ops:adjust`, `priv:read`!
  const empCatRead = await issuer.issue({ credentials: empCreds, room: catRoom, scopes: ['cat:read'] });
  assert.equal(empCatRead.ok, true, 'Employee MUST receive cat:read ticket in Sync4');

  const empCatWrite = await issuer.issue({ credentials: empCreds, room: catRoom, scopes: ['cat:write'] });
  assert.equal(empCatWrite.ok, false);
  assert.equal(empCatWrite.reason, 'scope-denied');

  const empAdjust = await issuer.issue({ credentials: empCreds, room: opsRoom, scopes: ['ops:adjust'] });
  assert.equal(empAdjust.ok, false);
  assert.equal(empAdjust.reason, 'scope-denied');

  const empPriv = await issuer.issue({ credentials: empCreds, room: privRoom, scopes: ['priv:read'] });
  assert.equal(empPriv.ok, false);
  assert.equal(empPriv.reason, 'scope-denied');

  // Consume one-use ticket once -> OK; replay same token -> REJECTED!
  const c1 = await issuer.consume({ token: empCatRead.token, licenseCode: LICENSE, instanceId: DEV_EMP, room: catRoom, requiredScope: 'cat:read' });
  assert.equal(c1.ok, true);
  const cReplay = await issuer.consume({ token: empCatRead.token, licenseCode: LICENSE, instanceId: DEV_EMP, room: catRoom, requiredScope: 'cat:read' });
  assert.equal(cReplay.ok, false);
  assert.equal(cReplay.reason, 'replayed-ticket');

  // Shared simulated Architecture 2.0 Store DO ledger (idempotent by opId) + Public -cat store
  const publicCatalog = new Map();
  const committedOps = new Map(); // opId -> op
  let aOnline = true;
  let bQuotaExceeded = true; // Simulate Supabase 429 quota hit from the start!

  function applyOpToLedger(opId, payload) {
    if (committedOps.has(opId)) return { committed: true, duplicate: true, opId };
    committedOps.set(opId, payload);
    const prod = publicCatalog.get(payload.productId);
    if (prod && payload.kind === 'sale.record') {
      publicCatalog.set(payload.productId, { ...prod, stockActual: prod.stockActual - payload.quantity });
    } else if (prod && payload.kind === 'stock.adjust') {
      publicCatalog.set(payload.productId, { ...prod, stockActual: prod.stockActual + payload.delta });
    }
    return { committed: true, stage: 'business-committed', opId };
  }

  // Owner publishes product via Sync4 catalog bridge (private `costo` & `pin` stripped!)
  const catalogBridge = createSync4CatalogBridge({
    getWriter: () => ({
      async applyDelta(delta) {
        if (delta.kind === 'product.upsert') publicCatalog.set(delta.product.id, delta.product);
      }
    })
  });
  await catalogBridge.upsertProduct({
    id: 'cuadro-andino',
    nombre: 'Cuadro Andino',
    precio: 120,
    stockActual: 10,
    costo: 45,
    pin: '842'
  });
  assert.equal('costo' in publicCatalog.get('cuadro-andino'), false);
  assert.equal('pin' in publicCatalog.get('cuadro-andino'), false);

  // Build Sync4 engines for all 3 devices (Primary A requires REAL HMAC ticket!)
  function buildDeviceEngine(role, creds) {
    const outbox = makeOutbox();
    const engine = createSync4Engine({
      licenseCode: LICENSE,
      role,
      outbox,
      clock,
      primaryA: {
        async send({ opId, payload }) {
          if (!aOnline) return { committed: false, status: 503, reason: 'yparty-503' };
          const scope = payload.kind === 'stock.adjust' ? 'ops:adjust' : 'ops:sale';
          const issued = await issuer.issue({ credentials: creds, room: opsRoom, scopes: [scope] });
          if (!issued.ok) return { committed: false, status: 403, reason: issued.reason };
          const consumed = await issuer.consume({
            token: issued.token,
            licenseCode: LICENSE,
            instanceId: creds.instanceId,
            room: opsRoom,
            requiredScope: scope
          });
          if (!consumed.ok) return { committed: false, status: 403, reason: consumed.reason };
          return applyOpToLedger(opId, payload);
        }
      },
      fallbackB: {
        async send({ opId, payload }) {
          if (bQuotaExceeded) return { committed: false, status: 429, reason: 'supabase-egress-quota-exceeded' };
          return applyOpToLedger(opId, payload);
        }
      },
      fallbackC: {
        async reinforce({ opId }) { return { relayed: true, opId }; }
      }
    });
    return { engine, outbox };
  }

  const devOwner = buildDeviceEngine('dueno', ownerCreds);
  const devAdmin = buildDeviceEngine('admin', adminCreds);
  const devEmp = buildDeviceEngine('empleado', empCreds);

  // Cycle 1 sale: Employee sells 2 units ($240) while B is 429-dead -> commits on A!
  const s1 = await devEmp.engine.submit({
    opId: 'sale-c1-emp-001',
    payload: { kind: 'sale.record', productId: 'cuadro-andino', quantity: 2, amountCents: 24000 }
  });
  assert.equal(s1.committed, true);
  assert.equal(s1.layer, 'A-arch20');
  assert.equal(publicCatalog.get('cuadro-andino').stockActual, 8);

  // === CYCLE 2: Fault injection — A goes 503, B reinforces; then BOTH A+B fail, C keeps durable! ===
  aOnline = false;
  bQuotaExceeded = false; // B healthy to reinforce while A is down!

  const s2 = await devAdmin.engine.submit({
    opId: 'sale-c2-adm-002',
    payload: { kind: 'sale.record', productId: 'cuadro-andino', quantity: 1, amountCents: 12000 }
  });
  assert.equal(s2.committed, true);
  assert.equal(s2.layer, 'B-relay');
  assert.equal(s2.blocked, false);

  const adj1 = await devAdmin.engine.submit({
    opId: 'adj-c2-adm-003',
    payload: { kind: 'stock.adjust', productId: 'cuadro-andino', delta: 5, amountCents: 0 }
  });
  assert.equal(adj1.committed, true);
  assert.equal(adj1.layer, 'B-relay');
  assert.equal(publicCatalog.get('cuadro-andino').stockActual, 12); // 8 - 1 + 5 = 12

  // Now BOTH A (503) AND B (429 quota) fail! Employee rings Sale #3 (qty=3, $360) with double-tap!
  bQuotaExceeded = true;
  const [s3a, s3b] = await Promise.all([
    devEmp.engine.submit({
      opId: 'sale-c2-emp-004',
      payload: { kind: 'sale.record', productId: 'cuadro-andino', quantity: 3, amountCents: 36000 }
    }),
    devEmp.engine.submit({
      opId: 'sale-c2-emp-004',
      payload: { kind: 'sale.record', productId: 'cuadro-andino', quantity: 3, amountCents: 36000 }
    })
  ]);
  assert.equal(s3a.blocked, false, 'Sale #3 MUST NOT block UI when A+B are down');
  assert.equal(s3a.localDurable, true);
  assert.equal(s3a.committed, false, 'MUST NOT fake committed ACK offline');
  assert.equal(s3a.layer, 'C-local-peer');
  assert.equal(s3b.opId, 'sale-c2-emp-004');

  // Tampered retry with same opId MUST fail closed!
  await assert.rejects(
    () => devEmp.engine.submit({
      opId: 'sale-c2-emp-004',
      payload: { kind: 'sale.record', productId: 'cuadro-andino', quantity: 3, amountCents: 100 }
    }),
    (err) => err.code === 'OPID_PAYLOAD_CONFLICT'
  );

  // Primary A recovers -> Employee drains Sale #3 cleanly under exact same opId!
  now += 15_000;
  aOnline = true;
  const drained = await devEmp.engine.drainPending();
  assert.equal(drained.length, 1);
  assert.equal(drained[0].committed, true);
  assert.equal(drained[0].layer, 'A-arch20');

  // Final economic & stock convergence across all 3 devices:
  // Initial 10 - 2 (Sale 1) - 1 (Sale 2) + 5 (Restock) - 3 (Sale 3) = 9 units
  assert.equal(publicCatalog.get('cuadro-andino').stockActual, 9);
  const totalSalesCents = [...committedOps.values()]
    .filter(op => op.kind === 'sale.record')
    .reduce((sum, op) => sum + op.amountCents, 0);
  assert.equal(totalSalesCents, 72_000, 'Exact converged revenue = $720.00 across 3 unique sales');
  assert.equal(committedOps.size, 4, '3 sales + 1 stock adjustment, 0 duplicates, 0 lost ops');

  // === SECURITY CLOSURE: Owner rotates PIN -> previously active Owner ticket revoked immediately! ===
  const ownerLiveTicket = await issuer.issue({ credentials: ownerCreds, room: catRoom, scopes: ['cat:read', 'cat:write'] });
  assert.equal(ownerLiveTicket.ok, true);
  assert.equal((await issuer.consume({
    token: ownerLiveTicket.token, licenseCode: LICENSE, instanceId: DEV_OWNER, room: catRoom, requiredScope: 'cat:write'
  })).ok, true);

  // Rotate Owner PIN centrally 842 -> 963
  const rotated = await ownerAuth.rotate(LICENSE, '842', '963', 1);
  assert.equal(rotated.ok, true);

  const recheck = await issuer.checkMany({
    licenseCode: LICENSE,
    room: catRoom,
    requests: [{ token: ownerLiveTicket.token, licenseCode: LICENSE, instanceId: DEV_OWNER, room: catRoom, requiredScope: 'cat:write' }]
  });
  assert.equal(recheck.ok, true);
  assert.equal(recheck.results[0].ok, false, 'Rotated Owner PIN MUST immediately revoke active WS grant');
  assert.equal(recheck.results[0].reason, 'authority-changed');
});
