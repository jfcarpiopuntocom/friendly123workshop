import test from 'node:test';
import assert from 'node:assert/strict';
import {
  projectPublicProductRow,
  projectPublicShelfRow,
  createSync4CatalogBridge
} from '../src/sync4-catalog-bridge.mjs';
import { createSync4Engine } from '../src/sync4-engine.mjs';

test('Sync4 catalog bridge strips ALL private/financial/PIN fields and blocks prototype pollution IDs', () => {
  const projected = projectPublicProductRow({
    id: 'prod-oil-01',
    nombre: 'Cuadro Andino',
    sku: 'ART-001',
    precio: 120,
    stockActual: 10,
    ubicacionId: 'galeria',
    // Private/sensitive fields that MUST NEVER cross into public -cat:
    costo: 45,
    margen: 75,
    proveedor: 'Taller Privado',
    pin: '842',
    clientes: [{ nombre: 'Secreto' }],
    comisionProveedorPct: 30
  });

  assert.equal(projected.id, 'prod-oil-01');
  assert.equal(projected.precio, 120);
  assert.equal(projected.stockActual, 10);
  assert.equal('costo' in projected, false, 'costo MUST be stripped');
  assert.equal('margen' in projected, false, 'margen MUST be stripped');
  assert.equal('proveedor' in projected, false, 'proveedor MUST be stripped');
  assert.equal('pin' in projected, false, 'pin MUST be stripped');
  assert.equal('clientes' in projected, false, 'clientes MUST be stripped');
  assert.equal('comisionProveedorPct' in projected, false, 'commission pct MUST be stripped');

  assert.throws(() => projectPublicProductRow({ id: '__proto__', nombre: 'x' }), /invalid product id/);
  assert.throws(() => projectPublicShelfRow({ id: 'constructor', nombre: 'x' }), /invalid shelf id/);
});

test('Sync4 catalog bridge applies directly when writer online and reinforces via Sync4 non-blocking engine when writer fails', async () => {
  const applied = [];
  let writerOnline = true;
  const rows = new Map();
  const outbox = {
    async put(r) { rows.set(r.opId, { ...r }); },
    async get(id) { return rows.get(id) || null; },
    async markCommitted(id, m) { rows.set(id, { ...rows.get(id), committed: true, committedLayer: m.layer }); },
    async listPending() { return [...rows.values()].filter(r => !r.committed); }
  };

  const fallbackEngine = createSync4Engine({
    licenseCode: 'F123-TEST-BRIDGE-01',
    role: 'dueno',
    outbox,
    primaryA: { async send() { return { committed: false, status: 503, reason: 'offline' }; } },
    fallbackB: { async send() { return { committed: false, status: 429, reason: 'quota' }; } },
    fallbackC: { async reinforce() { return { relayed: true }; } }
  });

  const bridge = createSync4CatalogBridge({
    getWriter: () => writerOnline ? { async applyDelta(d) { applied.push(d); } } : null,
    sync4Fallback: fallbackEngine
  });

  // 1. Writer online -> direct applyDelta
  const r1 = await bridge.upsertProduct({ id: 'p-1', nombre: 'Taza', precio: 15, stockActual: 4, costo: 5 });
  assert.equal(r1.applied, true);
  assert.equal(r1.mode, 'direct-cat-writer');
  assert.equal(applied.length, 1);
  assert.equal('costo' in applied[0].product, false);

  // 2. Writer offline -> non-blocking Sync4 durable fallback (zero lost edit, zero UI block!)
  writerOnline = false;
  const r2 = await bridge.upsertProduct({ id: 'p-2', nombre: 'Jarrón', precio: 60, stockActual: 2, costo: 20 }, { opId: 'cat-op-p2' });
  assert.equal(r2.ok, true);
  assert.equal(r2.blocked, false);
  assert.equal(r2.queued, true);
  assert.equal(r2.mode, 'C-local-peer');
  assert.equal((await outbox.listPending()).length, 1);
  assert.equal('costo' in (await outbox.get('cat-op-p2')).payload.product, false);
});
