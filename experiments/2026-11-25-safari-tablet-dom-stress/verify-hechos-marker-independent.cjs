'use strict';

/**
 * Independent Cross-Browser Adversarial Verification (WebKit + Chromium)
 * Target: Codex's 2026-11-25 08:05 workshop guard for docs/hechos.js (c3ec60e0b)
 * Source under test: exact c3ec60e0b:docs/hechos.js (unmodified product tree)
 *
 * Tests:
 *   - All 9 cases from Codex's native_marker.py (7f6136fbb) in REAL Chromium AND REAL WebKit
 *   - Edge case #10 (adversarial contrarian check): browser/mock without indexedDB.databases()
 *
 * Strictly synthetic isolated origin (https://fixture.invalid/), external network aborted.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium, webkit } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '../..');
const HECHOS_PATH = path.join(REPO_ROOT, 'docs', 'hechos.js');
const OUT_JSON = path.join(__dirname, 'hechos-marker-independent-verification.json');

const FULL_SOURCE = fs.readFileSync(HECHOS_PATH, 'utf8');
const startIdx = FULL_SOURCE.indexOf('  var _migracionEnCurso = null;');
const endIdx = FULL_SOURCE.indexOf('  var _db = null;', startIdx);
if (startIdx < 0 || endIdx < 0) throw new Error('Could not locate _migrarDesdeBaseVieja slice in docs/hechos.js');
const SLICE_BEFORE = FULL_SOURCE.slice(startIdx, endIdx);

// FNV-1a 32-bit fingerprint matching Codex's native_marker.py (7f6136fbb)
function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0;
  }
  return h;
}

const GUARD_CODEX =
  '          if (!Array.isArray(dbs) || dbs.some(function (d) { return d && d.name === DB_NAME_VIEJA; })) { _registrarFalloMigracion(); return; }\n';

const SLICE_AFTER_CODEX = SLICE_BEFORE
  .replace(
    '        if (!lectura.registros.length) {\n          _marcarMigracionHecha();',
    '        if (!lectura.registros.length) {\n' + GUARD_CODEX + '          _marcarMigracionHecha();'
  )
  .replace(
    '          _marcarMigracionHecha();\n          return;\n        }\n        var lectura',
    GUARD_CODEX + '          _marcarMigracionHecha();\n          return;\n        }\n        var lectura'
  );

if (SLICE_AFTER_CODEX === SLICE_BEFORE) {
  throw new Error('Codex 2-line guard failed to apply cleanly to c3ec60e0b:docs/hechos.js');
}

const RAW = 'amg_hechos_db';
const SCOPED = 'f123::amg_hechos_db';

const CASES = [
  { name: 'complete absent', seed: {}, mode: 'normal', expectMarker: true, expectRows: [], restart: false },
  { name: 'complete raw-only', seed: { [RAW]: ['foreign'] }, mode: 'normal', expectMarker: false, expectRows: [], restart: false },
  { name: 'timeout raw-only', seed: { [RAW]: ['foreign'] }, mode: 'timeout', expectMarker: false, expectRows: [], restart: false },
  { name: 'timeout scoped-empty', seed: { [SCOPED]: [] }, mode: 'timeout', expectMarker: false, expectRows: [], restart: false },
  { name: 'complete scoped-empty', seed: { [SCOPED]: [] }, mode: 'normal', expectMarker: true, expectRows: [], restart: false },
  { name: 'timeout scoped-populated', seed: { [SCOPED]: ['owned'] }, mode: 'timeout', expectMarker: true, expectRows: ['owned'], restart: false },
  { name: 'complete scoped-populated', seed: { [SCOPED]: ['owned'] }, mode: 'normal', expectMarker: true, expectRows: ['owned'], restart: false },
  { name: 'both raw + scoped-populated', seed: { [RAW]: ['foreign'], [SCOPED]: ['owned'] }, mode: 'normal', expectMarker: true, expectRows: ['owned'], restart: false },
  { name: 'restart after ambiguous empty', seed: { [RAW]: ['foreign'] }, mode: 'timeout', expectMarker: false, expectRows: [], restart: true },
  // Adversarial edge case #10: browser/environment where indexedDB.databases is not implemented
  { name: 'adversarial: databases() unsupported + empty', seed: {}, mode: 'unsupported', expectMarker: false, expectRows: [], restart: false, advisoryOnly: true },
];

async function evalFixture(page, args) {
  return page.evaluate(async ({ code, seed, mode, second }) => {
    const raw = 'amg_hechos_db';
    const scoped = 'f123::amg_hechos_db';
    const target = 'f123::f123_hechos_db';
    const key = 'f123::f123_hechos_migrado_v1';

    const open = (name) =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open(name, 1);
        r.onupgradeneeded = () => {
          if (!r.result.objectStoreNames.contains('hechos')) {
            r.result.createObjectStore('hechos', { keyPath: 'id' });
          }
        };
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });

    const write = async (name, ids) => {
      const db = await open(name);
      await new Promise((resolve, reject) => {
        const t = db.transaction('hechos', 'readwrite');
        t.oncomplete = resolve;
        t.onabort = t.onerror = () => reject(t.error);
        for (const id of ids) t.objectStore('hechos').put({ id });
      });
      db.close();
    };

    const read = async (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction('hechos', 'readonly');
        const q = t.objectStore('hechos').getAllKeys();
        t.oncomplete = () => resolve(q.result);
        t.onerror = () => reject(t.error);
      });

    if (!second) {
      for (const [name, ids] of Object.entries(seed)) {
        await write(name, ids);
      }
    } else {
      await write(scoped, ['late-owned']);
    }

    const db = await open(target);
    let attempts = 0;
    const opens = [];
    const env = {
      global: { AMG: { Aislamiento: { namespace: 'f123' } } },
      DB_NAME_VIEJA: raw,
      DATABASES_TIMEOUT_MS: 1500,
      TX_TIMEOUT_MS: 10000,
      STORE: 'hechos',
      _migracionHecha: () => localStorage.getItem(key) === '1',
      _migracionProximoIntento: 0,
      _listarDatabasesConLimite: () =>
        mode === 'timeout' || mode === 'unsupported'
          ? Promise.resolve(null)
          : indexedDB.databases(),
      _marcarMigracionHecha: () => localStorage.setItem(key, '1'),
      _registrarFalloMigracion: () => { attempts++; },
      _abrirCruda: async (name) => {
        const physical = name.startsWith('f123::') ? name : 'f123::' + name;
        opens.push(physical);
        return open(physical);
      },
      console: { warn() {} },
    };

    const runFn = new Function(...Object.keys(env), code + '\nreturn _migrarDesdeBaseVieja;')(
      ...Object.values(env)
    );
    await runFn(db);
    const rows = await read(db);
    db.close();
    const marker = localStorage.getItem(key) === '1';
    const names = (await indexedDB.databases()).map((x) => x.name);
    let rawRows = null;
    if (names.includes(raw)) {
      const old = await open(raw);
      rawRows = await read(old);
      old.close();
    }
    return { marker, rows, attempts, opens, rawRows };
  }, args);
}

async function runEngine(engine) {
  const origin = 'https://fixture.invalid/';
  const browser = await engine.launch({ headless: true });
  const version = browser.version();
  console.log(`\n[${engine.name()} ${version}] Running 9 Codex cases + 1 adversarial edge case...`);

  async function runSlice(code, label) {
    const results = [];
    for (const c of CASES) {
      const ctx = await browser.newContext({ serviceWorkers: 'block' });
      await ctx.route('**/*', (route) => {
        if (route.request().url() === origin) {
          return route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' });
        }
        return route.abort();
      });
      const page = await ctx.newPage();
      await page.goto(origin);
      const first = await evalFixture(page, { code, seed: c.seed, mode: c.mode, second: false });
      const rawExpected = Object.prototype.hasOwnProperty.call(c.seed, RAW) ? c.seed[RAW] : null;
      let ok =
        first.marker === c.expectMarker &&
        JSON.stringify(first.rows) === JSON.stringify(c.expectRows) &&
        JSON.stringify(first.rawRows) === JSON.stringify(rawExpected) &&
        !first.opens.includes(RAW);

      let second = null;
      if (c.restart) {
        await page.close();
        const page2 = await ctx.newPage();
        await page2.goto(origin);
        second = await evalFixture(page2, { code, seed: c.seed, mode: 'normal', second: true });
        ok =
          ok &&
          second.marker === true &&
          JSON.stringify(second.rows) === JSON.stringify(['late-owned']) &&
          JSON.stringify(second.rawRows) === JSON.stringify(['foreign']) &&
          !second.opens.includes(RAW);
      }
      await ctx.close();
      results.push({ case: c.name, advisoryOnly: !!c.advisoryOnly, ok, first, second });
    }
    const core = results.filter((x) => !x.advisoryOnly);
    const passed = core.filter((x) => x.ok).length;
    const adv = results.find((x) => x.advisoryOnly);
    console.log(
      `  [${engine.name()} ${label}] Codex 9 cases: ${passed}/${core.length}` +
      ` | adversarial(databases() unsupported): marker=${adv.first.marker}, attempts=${adv.first.attempts}`
    );
    return { passed, total: core.length, results };
  }

  const red = await runSlice(SLICE_BEFORE, 'RED (v0.9.27 c3ec60e0b)');
  const green = await runSlice(SLICE_AFTER_CODEX, 'GREEN (+2-line Codex guard)');
  await browser.close();
  return { engine: engine.name(), version, red, green };
}

async function main() {
  const gitSha = execFileSync('git', ['-C', REPO_ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const sliceLen = SLICE_BEFORE.length;
  const sliceHash = fnv1a(SLICE_BEFORE);
  console.log(`Target docs/hechos.js @ ${gitSha} | sliceLen=${sliceLen} | fnv1a=${sliceHash}`);

  const engines = [];
  for (const eng of [chromium, webkit]) {
    engines.push(await runEngine(eng));
  }

  const out = {
    meta: {
      generatedAt: new Date().toISOString(),
      targetSha: gitSha,
      codexWorkshopRef: 'lab/p0-perf-gate-v926-20261124@7f6136fbb',
      sliceLen,
      sliceFnv1a: sliceHash,
      syntheticOnly: true,
    },
    engines,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nSaved independent verification to ${OUT_JSON}`);

  for (const e of engines) {
    if (e.red.passed !== 5 || e.green.passed !== 9) {
      throw new Error(`Unexpected result on ${e.engine}: RED=${e.red.passed}/9 GREEN=${e.green.passed}/9`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
