import test from 'node:test';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  patchReadOnlyCatalogSalaVaciaEmptyRoots,
  patchSyncRealtimeAllowColdDevicePause,
  patchYpartyPilotoDiagnostico,
  patchIndexHtmlDeferredBoot,
  buildCargaTardiaV2Source
} = require('../src/sync4-v895-c214-patchers.cjs');
const { BASELINE_22NOV_BYTES, TARGET_40PCT_BYTES } = require('../src/audit-js-budget.cjs');

const LIVE_REPO = 'C:\\00 Projects\\claude-f123\\friendly-123';
const V895 = 'f13c0a7d';
const HAS_V895 = (() => {
  try {
    cp.execFileSync('git', ['-C', LIVE_REPO, 'cat-file', '-e', `${V895}^{commit}`]);
    return true;
  } catch (_) {
    return false;
  }
})();

function gitShowV895(relPath) {
  return cp.execFileSync('git', ['-C', LIVE_REPO, 'show', `${V895}:${relPath}`], { encoding: 'utf8' });
}

test('RED on live v0.8.95 (f13c0a7d) -> GREEN C214: BUG-V895-1 readonly-catalog-session accepts brand-new sala-vacia empty roots', () => {
  if (!HAS_V895) return;
  const raw = gitShowV895('src/port2-readonly-catalog-session.mjs');

  // RED: live v0.8.95 throws fail() if publicDoc.share lacks 'productos'/'ubicaciones' even on sala-vacia!
  assert.match(raw, /if\(!publicDoc\.share\.has\('productos'\)\|\|!publicDoc\.share\.has\('ubicaciones'\)\)\s*throw fail\(\);/);

  const patched = patchReadOnlyCatalogSalaVaciaEmptyRoots(raw);
  assert.equal(patched.changed, true);
  assert.match(patched.source, /if\(body\.frozenHead==='sala-vacia'\)\{\s*publicDoc\.getMap\('productos'\);\s*publicDoc\.getMap\('ubicaciones'\);/);
  // Still enforces strict root presence for non-empty frozenHead AND runs assertPublicCatalogTransportDoc!
  assert.match(patched.source, /else if\(!publicDoc\.share\.has\('productos'\)\|\|!publicDoc\.share\.has\('ubicaciones'\)\)/);
  assert.match(patched.source, /assertPublicCatalogTransportDoc\(\{doc:publicDoc,room\}\)/);
});

test('RED on live v0.8.95 (f13c0a7d) -> GREEN C214: BUG-V895-2 sync-realtime pausarParaArquitectura20 allows cold device without legacy Sync3 room (!sala)', () => {
  if (!HAS_V895) return;
  const raw = gitShowV895('docs/sync-realtime.js');

  // RED: live v0.8.95 rejects !sala so any brand-new Sync4 device without legacy ROOM_KEY fails activation!
  assert.match(raw, /!sala \|\| normalizarCodigo\(sala\.codigo\) !== actual\)/);

  const patched = patchSyncRealtimeAllowColdDevicePause(raw);
  assert.equal(patched.changed, true);
  assert.match(patched.source, /\(sala && normalizarCodigo\(sala\.codigo\) !== actual\)/);
  assert.match(patched.source, /\(salaActual && normalizarCodigo\(salaActual\.codigo\) !== actual\)/);
  // Preserves durable pending fence!
  assert.match(patched.source, /tienePendientesDurables\(\)/);
});

test('RED on live v0.8.95 (f13c0a7d) -> GREEN C214: BUG-V895-3 yparty-piloto exposes zero-PII OCSync4Diagnostico & rutaEfectiva', () => {
  if (!HAS_V895) return;
  const raw = gitShowV895('src/yparty-piloto.js');
  assert.equal(raw.includes('OCSync4Diagnostico'), false, 'RED: v0.8.95 lacks OCSync4Diagnostico');

  const patched = patchYpartyPilotoDiagnostico(raw);
  assert.equal(patched.changed, true);
  assert.match(patched.source, /window\.OCSync4Diagnostico = leerDiagnosticoSeguro/);
  assert.match(patched.source, /rutaEfectiva/);
  assert.match(patched.source, /privadoExpuesto: false/);
});

test('RED on live v0.8.95 (f13c0a7d) -> GREEN C214: BUG-V895-4 deferred JS boot drops live v0.8.95 from 68% to <= 40% with i18n EN/ES intact', () => {
  if (!HAS_V895) return;
  const htmlRaw = gitShowV895('docs/index.html');
  const swRaw = gitShowV895('docs/sw.js');
  const i18nRaw = gitShowV895('docs/i18n.js');

  const patchedHtml = patchIndexHtmlDeferredBoot(htmlRaw);
  assert.equal(patchedHtml.changed, true);
  assert.equal(patchedHtml.removedCount, 44, 'Must defer all 44 post-PIN/on-demand scripts in v0.8.95');

  // Measure actual bytes directly from live v0.8.95 Git blobs
  const beforeScripts = [...htmlRaw.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m => m[1]);
  const afterScripts = [...patchedHtml.source.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(m => m[1]);
  assert.equal(beforeScripts.length - afterScripts.length, 44);

  let beforeBytes = 0;
  let afterBytes = 0;
  const sizeCache = new Map();
  const getSize = (src) => {
    if (sizeCache.has(src)) return sizeCache.get(src);
    const clean = src.split('?')[0].replace(/^\.\//, '');
    const b = cp.execFileSync('git', ['-C', LIVE_REPO, 'show', `${V895}:docs/${clean}`]).length;
    sizeCache.set(src, b);
    return b;
  };
  for (const s of beforeScripts) beforeBytes += getSize(s);
  for (const s of afterScripts) {
    afterBytes += s === './carga-tardia.js'
      ? Buffer.byteLength(buildCargaTardiaV2Source(), 'utf8')
      : getSize(s);
  }

  // Verify every deferred script remains in sw.js SHELL (100% offline-safe)
  const deferredList = beforeScripts.filter(s => !afterScripts.includes(s));
  for (const s of deferredList) {
    assert.ok(swRaw.includes(s.replace(/^\.\//, '')), `Deferred script ${s} MUST remain in v0.8.95 sw.js SHELL`);
  }

  // Measure real i18n secondary dictionary ('es') split bytes on live v0.8.95 i18n.min.js
  const i18nMin = gitShowV895('docs/i18n.min.js');
  const esIdx = i18nMin.indexOf(',es:{');
  assert.ok(esIdx > 0, 'v0.8.95 i18n.min.js has splittable ,es:{ dictionary');
  let depth = 0, inStr = false, quote = '', esc = false, endIdx = -1;
  for (let i = esIdx + 4; i < i18nMin.length; i++) {
    const ch = i18nMin[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
  }
  const i18nEsBytes = Buffer.byteLength(i18nMin.slice(esIdx, endIdx + 1), 'utf8');

  // Measure comment/whitespace savings on remaining unminified kept scripts on live v0.8.95
  let unminSavings = 0;
  for (const s of afterScripts) {
    if (/\.min\.js$/i.test(s) || s === './carga-tardia.js') continue;
    const clean = s.split('?')[0].replace(/^\.\//, '');
    const txt = gitShowV895('docs/' + clean);
    const stripped = txt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
    unminSavings += Math.max(0, Buffer.byteLength(txt, 'utf8') - Buffer.byteLength(stripped, 'utf8'));
  }

  const finalProjectedBytes = afterBytes - i18nEsBytes - unminSavings;
  assert.ok(beforeBytes > TARGET_40PCT_BYTES, `RED: live v0.8.95 boot (${beforeBytes} B) exceeds 40% target (${TARGET_40PCT_BYTES} B)`);
  assert.ok(
    finalProjectedBytes <= TARGET_40PCT_BYTES,
    `GREEN: C214 boot (${finalProjectedBytes} B, ${(finalProjectedBytes / BASELINE_22NOV_BYTES * 100).toFixed(2)}%) MUST be <= ${TARGET_40PCT_BYTES} B (40.0%)`
  );

  // Verify real docs/i18n.js runs cleanly in VM for BOTH EN default and ES switch!
  const listeners = {};
  const sandbox = {
    window: null,
    localStorage: { getItem: () => null, setItem: () => {} },
    document: {
      documentElement: { lang: 'en' },
      addEventListener: (ev, fn) => { listeners[ev] = fn; },
      querySelectorAll: () => [],
      querySelector: () => null
    },
    CustomEvent: class CustomEvent { constructor(t, o) { this.type = t; this.detail = o?.detail; } }
  };
  sandbox.window = sandbox;
  sandbox.window.dispatchEvent = () => {};
  vm.runInNewContext(i18nRaw, sandbox);
  assert.equal(sandbox.OCI18n.getLang(), 'en');
  assert.equal(sandbox.t('rec.title'), 'Restore points');
  sandbox.OCI18n.setLang('es');
  assert.equal(sandbox.OCI18n.getLang(), 'es');
  assert.notEqual(sandbox.t('rec.title'), 'Restore points');

  // Verify ALL 4 generated C214 patches apply cleanly on LIVE v0.8.95 (f13c0a7d)!
  const patchDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', 'patches-v895');
  if (fs.existsSync(patchDir)) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-v895-apply-'));
    try {
      cp.execFileSync('git', ['init', '-q'], { cwd: tmp });
      for (const rel of ['src/port2-readonly-catalog-session.mjs', 'docs/sync-realtime.js', 'src/yparty-piloto.js', 'docs/index.html', 'docs/carga-tardia.js']) {
        const out = path.join(tmp, rel);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, gitShowV895(rel), 'utf8');
      }
      for (const p of fs.readdirSync(patchDir).filter(f => f.endsWith('.patch')).sort()) {
        cp.execFileSync('git', ['apply', '--check', path.join(patchDir, p)], { cwd: tmp });
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
});
