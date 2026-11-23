'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { applyPatchToSource: patchReadModel } = require('../src/business-read-model-fast.cjs');
const { applyPatchToSource: patchMockBackend } = require('../src/mock-backend-hoy-index.cjs');

const REAL_READ_MODEL = 'C:/00 Projects/claude-f123/wt-multisala/docs/core/business-read-model.js';
const REAL_MOCK_BACKEND = 'C:/00 Projects/claude-f123/wt-multisala/docs/mock-backend.js';

function loadReadModel(code) {
  let dtfCount = 0;
  const RealDTF = Intl.DateTimeFormat;
  const CountingIntl = Object.create(Intl);
  CountingIntl.DateTimeFormat = function (...args) { dtfCount++; return new RealDTF(...args); };
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports, globalThis: {}, Intl: CountingIntl,
    Date, Math, Number, String, Array, Object, Map, Set, JSON, RegExp
  });
  return { api: mod.exports, getDtfCount: () => dtfCount };
}

function makeSales(count) {
  const sales = [], adjustments = [], baseMs = Date.parse('2026-11-22T15:00:00.000Z');
  for (let i = 0; i < count; i++) {
    const ret = i % 20 === 0, id = 'v-' + i, off = (i % 10) * 86400000;
    sales.push({
      id, productoId: 'p-' + (i % 50), ubicacionId: 'loc-1', cantidad: 1 + (i % 3),
      precioUnit: 25, costoUnit: 10, fecha: new Date(baseMs - off).toISOString(),
      devuelta: ret, fechaDevolucion: ret ? new Date(baseMs - off + 3600000).toISOString() : undefined,
      devolucionId: ret ? 'adj-' + i : undefined, comisionAsociado: 5, netoCasa: 20, direccionComision: 'casaPaga'
    });
    if (ret) adjustments.push({ id: 'adj-' + i, tipo: 'devolucion', ventaId: id, ubicacionId: 'loc-1', fecha: new Date(baseMs - off + 3600000).toISOString(), montoComisionSocio: -5, montoNetoDueno: -20 });
  }
  return { sales, adjustments };
}

test('RED -> GREEN: Hoy read-model Intl cache (1 vs 1000+) & O(n) /api/dashboard Map indexes', () => {
  if (fs.existsSync(REAL_READ_MODEL)) {
    const rawCode = fs.readFileSync(REAL_READ_MODEL, 'utf8');
    const { changed, source: fastCode } = patchReadModel(rawCode);
    assert.equal(changed, true);
    const raw = loadReadModel(rawCode), fast = loadReadModel(fastCode);
    const { sales, adjustments } = makeSales(600);
    const plain = (x) => JSON.parse(JSON.stringify(x));
    const rRaw = raw.api.daily(sales, '2026-11-22', 'America/Guayaquil');
    const rFast = fast.api.daily(sales, '2026-11-22', 'America/Guayaquil');
    assert.ok(raw.getDtfCount() > 500);
    assert.equal(fast.getDtfCount(), 1);
    assert.deepStrictEqual(plain(rFast), plain(rRaw));

    const conflict = [...sales, { ...sales[3], precioUnit: 999 }];
    assert.deepStrictEqual(
      plain(fast.api.businessResult({ sales: conflict, adjustments, month: '2026-11', zone: 'America/Guayaquil' })),
      plain(raw.api.businessResult({ sales: conflict, adjustments, month: '2026-11', zone: 'America/Guayaquil' }))
    );
  }
  if (fs.existsSync(REAL_MOCK_BACKEND)) {
    const mb = fs.readFileSync(REAL_MOCK_BACKEND, 'utf8');
    const { changed, source } = patchMockBackend(mb);
    assert.equal(changed, true);
    assert.ok(source.includes('const _devPorVentaId = new Map()'));
  }
});
