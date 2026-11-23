import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const WORKER_DIR = 'C:/00 Projects/claude-f123/wt-multisala/cloudflare-worker';
const HAS_REAL_WORKER = fs.existsSync(WORKER_DIR + '/ws-capability-issuer.mjs');

function sha256Hex(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function createMemoryStorage() {
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
  return { ...tx, async transaction(fn) { return fn(tx); } };
}

/**
 * Simulates the real Cloudflare YParty -fotos Durable Object HTTP handler
 * backed by REAL ws-capability-issuer.mjs one-use HMAC ticket consumption.
 */
function createPhotoRoomServer({ issuer }) {
  const blobs = new Map(); // room -> Map<sha, Uint8Array>
  let uploadsStored = 0;

  async function handleRequest({ method, licenseCode, instanceId, room, sha, token, bodyBytes, metadata }) {
    // Micropaso 53: NEVER accept private financial/PIN metadata in photo channel
    if (metadata && typeof metadata === 'object') {
      for (const forbidden of ['pin', 'costo', 'margen', 'clientes', 'ventas', 'deuda']) {
        if (Object.hasOwn(metadata, forbidden)) {
          return { status: 400, ok: false, reason: 'private-field-forbidden-in-fotos' };
        }
      }
    }
    if (!/^[a-f0-9]{64}$/.test(sha || '')) return { status: 400, ok: false, reason: 'invalid-sha' };
    const requiredScope = method === 'PUT' ? 'fotos:write' : 'fotos:read';
    const consumed = await issuer.consume({ licenseCode, instanceId, room, token, requiredScope });
    if (!consumed.ok) {
      return { status: consumed.reason === 'replayed-ticket' ? 409 : 403, ok: false, reason: consumed.reason };
    }

    if (!blobs.has(room)) blobs.set(room, new Map());
    const roomStore = blobs.get(room);

    if (method === 'PUT') {
      if (!(bodyBytes instanceof Uint8Array) || bodyBytes.byteLength === 0) {
        return { status: 400, ok: false, reason: 'empty-body' };
      }
      const computed = sha256Hex(bodyBytes);
      if (computed !== sha) return { status: 400, ok: false, reason: 'sha-mismatch' };
      const existed = roomStore.has(sha);
      if (!existed) {
        roomStore.set(sha, Uint8Array.from(bodyBytes));
        uploadsStored++;
      }
      return { status: 200, ok: true, sha, deduplicated: existed, bytes: bodyBytes.byteLength };
    }

    if (method === 'GET') {
      const stored = roomStore.get(sha);
      if (!stored) return { status: 404, ok: false, reason: 'not-found' };
      return { status: 200, ok: true, sha, bytes: Uint8Array.from(stored) };
    }
    return { status: 405, ok: false, reason: 'method-not-allowed' };
  }

  return { handleRequest, uploadsStored: () => uploadsStored };
}

test('Micropasos 31 & 53: Real HMAC photo SHA-256 blobs — Owner PUT/dedup, Admin/Employee read-only, cross-store & private metadata denied', async () => {
  if (!HAS_REAL_WORKER) return;
  const { pinAuthority } = await import(pathToFileURL(WORKER_DIR + '/pin-authority.mjs').href);
  const { teamAuthority } = await import(pathToFileURL(WORKER_DIR + '/team-authority.mjs').href);
  const { wsCapabilityAuthority, roomForLicense } = await import(pathToFileURL(WORKER_DIR + '/ws-capability-issuer.mjs').href);

  const storage = createMemoryStorage();
  const SHOP_A = 'F123-FOTO-ALPHA-001';
  const SHOP_B = 'F123-FOTO-BETA-0002';
  const INST_OWNER_A = 'inst-foto-owner-a';
  const INST_EMP_A = 'inst-foto-emp-a';
  const INST_OWNER_B = 'inst-foto-owner-b';

  await storage.put('inst:' + INST_OWNER_A, { instanceId: INST_OWNER_A, licenseCode: SHOP_A, estado: 'activa' });
  await storage.put('inst:' + INST_EMP_A, { instanceId: INST_EMP_A, licenseCode: SHOP_A, estado: 'activa' });
  await storage.put('inst:' + INST_OWNER_B, { instanceId: INST_OWNER_B, licenseCode: SHOP_B, estado: 'activa' });

  const now = 1_795_440_000_000;
  const ownerAuth = pinAuthority(storage, 'pepper-owner-fotos-test-32bytes-001', () => now);
  const teamAuth = teamAuthority({ storage, ownerAuthority: ownerAuth, secret: 'pepper-team-fotos-test-32bytes-002', clock: () => now });
  await ownerAuth.reportExisting(SHOP_A, INST_OWNER_A, '101', now);
  await ownerAuth.reportExisting(SHOP_B, INST_OWNER_B, '202', now);
  await teamAuth.update({
    licenseCode: SHOP_A, instanceId: INST_OWNER_A, ownerPin: '101', expectedRevision: 0,
    opId: 'op-add-emp-fotos-01', subject: 'emp-sofia-01', role: 'empleado', pin: '303', active: true
  });

  const issuer = wsCapabilityAuthority({
    storage, ownerAuthority: ownerAuth, teamAuthority: teamAuth,
    secret: 'ws-key-fotos-isolation-32bytes-003',
    grants: {
      admin: ['cat:read', 'ops:sale', 'ops:adjust', 'ops:payment', 'fotos:read'],
      empleado: ['cat:read', 'ops:sale', 'ops:payment', 'fotos:read']
    },
    clock: () => now
  });

  const fotosRoomA = (await roomForLicense(SHOP_A)) + '-fotos';
  const fotosRoomB = (await roomForLicense(SHOP_B)) + '-fotos';
  const server = createPhotoRoomServer({ issuer });

  const photoBytes = new TextEncoder().encode('FAKE-WEBP-PRODUCT-PHOTO-CERAMIC-CUP-V1');
  const photoSha = sha256Hex(photoBytes);

  // 1. Owner uploads photo with real one-use fotos:write ticket
  const putTicket1 = await issuer.issue({
    credentials: { kind: 'owner', licenseCode: SHOP_A, instanceId: INST_OWNER_A, pin: '101' },
    room: fotosRoomA, scopes: ['fotos:write'], ttlMs: 30_000
  });
  assert.equal(putTicket1.ok, true);
  const putRes1 = await server.handleRequest({
    method: 'PUT', licenseCode: SHOP_A, instanceId: INST_OWNER_A, room: fotosRoomA, sha: photoSha, token: putTicket1.token, bodyBytes: photoBytes
  });
  assert.equal(putRes1.status, 200);
  assert.equal(putRes1.deduplicated, false);
  assert.equal(server.uploadsStored(), 1);

  // 2. Replaying same ticket is cryptographically rejected (409)
  const replayRes = await server.handleRequest({
    method: 'PUT', licenseCode: SHOP_A, instanceId: INST_OWNER_A, room: fotosRoomA, sha: photoSha, token: putTicket1.token, bodyBytes: photoBytes
  });
  assert.equal(replayRes.status, 409);

  // 3. Uploading identical SHA with fresh ticket deduplicates (0 extra storage)
  const putTicket2 = await issuer.issue({
    credentials: { kind: 'owner', licenseCode: SHOP_A, instanceId: INST_OWNER_A, pin: '101' },
    room: fotosRoomA, scopes: ['fotos:write'], ttlMs: 30_000
  });
  const putRes2 = await server.handleRequest({
    method: 'PUT', licenseCode: SHOP_A, instanceId: INST_OWNER_A, room: fotosRoomA, sha: photoSha, token: putTicket2.token, bodyBytes: photoBytes
  });
  assert.equal(putRes2.status, 200);
  assert.equal(putRes2.deduplicated, true);
  assert.equal(server.uploadsStored(), 1);

  // 4. Employee downloads photo via real fotos:read ticket and verifies SHA-256 byte integrity
  const empReadTicket = await issuer.issue({
    credentials: { kind: 'team', licenseCode: SHOP_A, instanceId: INST_EMP_A, subject: 'emp-sofia-01', role: 'empleado', pin: '303' },
    room: fotosRoomA, scopes: ['fotos:read'], ttlMs: 30_000
  });
  assert.equal(empReadTicket.ok, true);
  const getRes = await server.handleRequest({
    method: 'GET', licenseCode: SHOP_A, instanceId: INST_EMP_A, room: fotosRoomA, sha: photoSha, token: empReadTicket.token
  });
  assert.equal(getRes.status, 200);
  assert.equal(sha256Hex(getRes.bytes), photoSha);

  // 5. Employee MUST BE DENIED fotos:write ticket
  const empWriteTicket = await issuer.issue({
    credentials: { kind: 'team', licenseCode: SHOP_A, instanceId: INST_EMP_A, subject: 'emp-sofia-01', role: 'empleado', pin: '303' },
    room: fotosRoomA, scopes: ['fotos:write'], ttlMs: 30_000
  });
  assert.equal(empWriteTicket.ok, false);

  // 6. Cross-store isolation: Shop B Owner CANNOT obtain or use a ticket on Shop A -fotos
  const crossIssue = await issuer.issue({
    credentials: { kind: 'owner', licenseCode: SHOP_B, instanceId: INST_OWNER_B, pin: '202' },
    room: fotosRoomA, scopes: ['fotos:read'], ttlMs: 30_000
  });
  assert.equal(crossIssue.ok, false);

  const shopBTicket = await issuer.issue({
    credentials: { kind: 'owner', licenseCode: SHOP_B, instanceId: INST_OWNER_B, pin: '202' },
    room: fotosRoomB, scopes: ['fotos:read'], ttlMs: 30_000
  });
  assert.equal(shopBTicket.ok, true);
  const crossConsume = await server.handleRequest({
    method: 'GET', licenseCode: SHOP_A, instanceId: INST_OWNER_B, room: fotosRoomA, sha: photoSha, token: shopBTicket.token
  });
  assert.equal(crossConsume.status, 403);

  // 7. Private metadata rejection in photo channel
  const privMetaRes = await server.handleRequest({
    method: 'PUT', licenseCode: SHOP_A, instanceId: INST_OWNER_A, room: fotosRoomA, sha: photoSha, token: putTicket2.token, bodyBytes: photoBytes,
    metadata: { costo: 500, pin: '101' }
  });
  assert.equal(privMetaRes.status, 400);
  assert.equal(privMetaRes.reason, 'private-field-forbidden-in-fotos');
});
