'use strict';
// Reproduction only: fake IndexedDB, synthetic records, no production network.
// Run: node --test /workspace/shared/friendly123-coordinacion/hechos-c3-raw-marker-red.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const path = require('node:path');
const repo = process.env.F123_REPO || '/workspace/friendly-123';
const { IDBFactory } = createRequire(path.join(repo, 'package.json'))('fake-indexeddb');
const SOURCE = execFileSync('git', ['-C', repo, 'show', 'c3ec60e:docs/hechos.js'], { encoding: 'utf8' });

async function seed(idb, name, id) {
  await new Promise((resolve, reject) => {
    const req = idb.open(name, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('hechos', { keyPath: 'id' });
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result, tx = db.transaction('hechos', 'readwrite');
      tx.objectStore('hechos').put({ id, tipo: 'venta', ts: 100, instanceId: 'synthetic', reloj: {}, hash: 'fixture', datos: {} });
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  });
}

async function run(initialDb, { listingStalls = true } = {}) {
  const idb = new IDBFactory();
  await seed(idb, initialDb, 'synthetic-fact');
  const nativeOpen = idb.open.bind(idb);
  // Match aislamiento.js: open is namespaced, databases() is not.
  const wrapped = {
    open(name, version) { return nativeOpen(name.startsWith('f123::') ? name : 'f123::' + name, version); },
    databases() { return listingStalls ? new Promise(() => {}) : idb.databases(); }
  };
  const local = new Map();
  const win = { indexedDB: wrapped, AMG: { Aislamiento: { namespace: 'f123', idbInstalado: true } },
    localStorage: { getItem: k => local.get(k) || null, setItem: (k, v) => local.set(k, String(v)) },
    addEventListener() {}, dispatchEvent() {} };
  win.window = win;
  const ctx = { window: win, self: win, indexedDB: wrapped, localStorage: win.localStorage,
    crypto: globalThis.crypto, TextEncoder, Promise, Date, Number, Math, String, Array, Object, JSON, Error,
    console: { warn() {}, error() {}, log() {} },
    setTimeout(fn, ms) { return setTimeout(fn, ms === 1500 ? 5 : ms); }, clearTimeout };
  vm.runInNewContext(SOURCE, ctx);
  let result, failure;
  try { result = await win.AMG.Hechos.todos(); } catch (e) { failure = e; }
  return { result, failure, marker: local.get('f123_hechos_migrado_v1'), databases: await idb.databases() };
}

test('raw-only + stalled list must not mark migration complete or infer an empty history', async () => {
  const r = await run('amg_hechos_db');
  assert.equal(r.marker, undefined, 'unknown raw ownership and incomplete list cannot certify migration');
  assert.ok(r.failure, 'history must not silently appear empty while ownership is unresolved');
  assert.ok(r.databases.some(d => d.name === 'amg_hechos_db'), 'raw source is not deleted');
});

test('prefixed-only + stalled list must keep marker unconfirmed until absence of raw is known', async () => {
  const r = await run('f123::amg_hechos_db');
  assert.equal(r.marker, undefined, 'timeout cannot prove raw absence');
  assert.ok(r.databases.some(d => d.name === 'f123::amg_hechos_db'), 'prefixed source is not deleted');
});

 test('raw-only + completed list must not certify empty prefixed legacy as complete', async () => {
  const r = await run('amg_hechos_db', { listingStalls: false });
  assert.equal(r.marker, undefined, 'raw presence leaves ownership unresolved, even when enumeration finishes');
  assert.ok(r.failure, 'the new ledger must not be reported complete while legacy ownership is unresolved');
  assert.ok(r.databases.some(d => d.name === 'amg_hechos_db'));
});
