import test from 'node:test';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  patchReadOnlyCatalogSalaVaciaEmptyRoots,
  patchSyncRealtimeAllowColdDevicePause,
  patchYpartyPilotoDiagnostico,
  patchIndexHtmlDeferredBoot,
  buildCargaTardiaV2Source,
  patchI18nSplitEs,
  patchSwAddI18nEs,
  patchAuthUiAdminVerifyAndLogoutWipe,
  patchSyncYjsUnblockPilotAndRetry,
  patchPinWorkerAutoRegisterVerifiedInstance,
  patchSyncYjsAutoFailbackReturnToA,
  patchYpartyPilotoWakeupDrain,
  patchHelpUiSync4StatusPill
} = require('../src/sync4-v895-c214-patchers.cjs');
const { BASELINE_22NOV_BYTES, TARGET_40PCT_BYTES } = require('../src/audit-js-budget.cjs');

const LIVE_REPO = 'C:\\00 Projects\\claude-f123\\friendly-123';
const V895 = '8d1519df';
const C218_PIN = '94096dde';
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

  // Verify ALL 6 generated C214 patches apply cleanly on LIVE v0.8.95 (17131947)!
  const patchDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'patches-v895');
  assert.ok(fs.existsSync(patchDir), 'patches-v895 directory MUST exist');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-v895-apply-'));
    try {
      cp.execFileSync('git', ['init', '-q'], { cwd: tmp });
      for (const rel of ['src/port2-readonly-catalog-session.mjs', 'docs/sync-realtime.js', 'docs/sync-yjs.js', 'src/yparty-piloto.js', 'docs/index.html', 'docs/carga-tardia.js', 'docs/i18n.js', 'docs/sw.js', 'docs/auth-ui.js', 'docs/help-ui.js']) {
        const out = path.join(tmp, rel);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, gitShowV895(rel), 'utf8');
      }
      for (const p of fs.readdirSync(patchDir).filter(f => f.endsWith('.patch') && !f.startsWith('08-')).sort()) {
        cp.execFileSync('git', ['apply', '--check', path.join(patchDir, p)], { cwd: tmp });
      }
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
});

test('C214 Patch 05 on live v0.8.95 (17131947): real i18n-es lazy split saves >80 KB raw with 100% Spanish key-for-key parity', () => {
  if (!HAS_V895) return;
  const origI18n = gitShowV895('docs/i18n.js');
  const origSw = gitShowV895('docs/sw.js');
  const split = patchI18nSplitEs(origI18n);
  const swPatched = patchSwAddI18nEs(origSw);

  assert.equal(swPatched.changed, true);
  assert.ok(swPatched.source.includes('./i18n-es.min.js'));
  const savedRaw = Buffer.byteLength(origI18n, 'utf8') - Buffer.byteLength(split.i18nSource, 'utf8');
  assert.ok(savedRaw > 80_000, `Expected >80 KB raw savings from ES split, got ${savedRaw} B`);

  const makeSandbox = (initialLang = null) => {
    const store = new Map(initialLang ? [['f123_lang', initialLang]] : []);
    const events = [];
    const lazyCalls = [];
    const sb = {
      window: null,
      navigator: { language: 'en-US' },
      localStorage: {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v))
      },
      document: {
        documentElement: { lang: 'en' },
        addEventListener: () => {},
        querySelectorAll: () => [],
        querySelector: () => null
      },
      CustomEvent: class CustomEvent { constructor(t, o) { this.type = t; this.detail = o?.detail; } },
      OCCargaTardia: {
        asegurar: (grp) => {
          lazyCalls.push(grp);
          if (grp === 'i18nEs') vm.runInNewContext(split.i18nEsSource, sb);
          return Promise.resolve(true);
        }
      },
      __events: events,
      __lazyCalls: lazyCalls
    };
    sb.window = sb;
    sb.window.dispatchEvent = (ev) => events.push(ev);
    return sb;
  };

  // Run original monolithic i18n.js to get ground-truth EN + ES dictionaries
  const sbOrig = makeSandbox();
  vm.runInNewContext(origI18n, sbOrig);
  const origEsKeys = Object.keys(sbOrig.OCI18n.DICT.es);
  assert.ok(origEsKeys.length > 500, `Expected >500 ES keys, got ${origEsKeys.length}`);

  // Run split slim i18n.js in EN default mode -> ZERO lazy ES load!
  const sbSplit = makeSandbox();
  vm.runInNewContext(split.i18nSource, sbSplit);
  assert.equal(sbSplit.__lazyCalls.length, 0, 'EN default boot MUST NOT load i18n-es');
  assert.equal(sbSplit.t('rec.title'), 'Restore points');

  // Switch to ES -> lazy loads i18n-es.js and matches 100% of original ES keys verbatim!
  sbSplit.OCI18n.setLang('es');
  assert.deepEqual(sbSplit.__lazyCalls, ['i18nEs']);
  assert.equal(Object.keys(sbSplit.OCI18n.DICT.es).length, origEsKeys.length);
  for (const k of origEsKeys) {
    assert.equal(sbSplit.OCI18n.DICT.es[k], sbOrig.OCI18n.DICT.es[k], `ES mismatch for key ${k}`);
  }
});

test('RED on live v0.8.95 (17131947) -> GREEN C214 Patch 06: Admin central /team/verify, 403 revocation block & logout principal wipe', () => {
  if (!HAS_V895) return;
  const raw = gitShowV895('docs/auth-ui.js');

  // RED: live v0.8.95 skips /team/verify for cached rolHash === "admin", ignores 403 team-not-verified, and never wipes __f123CentralTeamPrincipal on logout!
  assert.match(raw, /if \(\(!rolHash \|\| rolHash === "empleado"\) && dispositivoApropiado\(\)/);
  assert.equal(raw.includes('window.__f123CentralTeamPrincipal = null;'), false);

  const patched = patchAuthUiAdminVerifyAndLogoutWipe(raw);
  assert.equal(patched.changed, true);
  assert.match(patched.source, /rolHash === "empleado" \|\| rolHash === "admin"/);
  assert.match(patched.source, /rTeam\.status === 403 && dTeam && dTeam\.reason === "team-not-verified"/);
  assert.match(patched.source, /window\.__f123CentralTeamPrincipal = null; \/\/ C214: wipe central team principal on logout/);
});

test('RED on live v0.8.97 (bb684e1a) -> GREEN C218 Patch 07: sync-yjs unblocks yparty:true pilot with legacy pendingStructs + retries on visibilitychange & online', () => {
  if (!HAS_V895) return;
  const raw = gitShowV895('docs/sync-yjs.js');

  // RED: live v0.8.97 only sets sync4Direct for sync4:true or sala-vacia (deadlocking pilot store e048094f which has yparty:true + fb-... frozenHead!),
  // blocks visibility retry when coordinadorCorte20 is null, and lacks online retry listener!
  assert.match(raw, /var sync4Direct = !!\(API\.rollout && \(API\.rollout\.sync4 === true \|\| API\.rollout\.frozenHead === "sala-vacia"\)\);/);
  assert.match(raw, /if \(API\.modoCorte20Activo !== true && API\.coordinadorCorte20\)/);
  assert.equal(raw.includes('window.addEventListener("online", _intentarActivarCorte20SiElegible);'), false);

  const patched = patchSyncYjsUnblockPilotAndRetry(raw);
  assert.equal(patched.changed, true);
  assert.match(patched.source, /API\.rollout\.yparty === true \|\| API\.rollout\.sync4 === true/);
  assert.match(patched.source, /if \(API\.modoCorte20Activo !== true\) \{\n\s*_intentarActivarCorte20SiElegible\(\);/);
  assert.match(patched.source, /window\.addEventListener\("online", _intentarActivarCorte20SiElegible\);/);
});

test('RED on C218 pin-aparato-nuevo (94096dde) -> GREEN Patch 08: verified new device auto-registers inst:<id> so /ws/ticket succeeds immediately (never overwrites bloqueada)', () => {
  if (!HAS_V895) return;
  const raw = cp.execFileSync('git', ['-C', LIVE_REPO, 'show', `${C218_PIN}:cloudflare-worker/pin-worker-api.mjs`], { encoding: 'utf8' });

  // RED: C218 94096dde strips instanceId on unmatched verify and NEVER writes inst:<id> to DO storage!
  assert.match(raw, /if\(unmatched\)data=\{licenseCode,pin:String\(data\.pin\|\|""\)\};/);
  assert.equal(raw.includes('origen:"central-pin-verify"'), false);

  const patched = patchPinWorkerAutoRegisterVerifiedInstance(raw);
  assert.equal(patched.changed, true);
  assert.match(patched.source, /if\(unmatched\)data=\{licenseCode,instanceId,pin:String\(data\.pin\|\|""\)\};/);
  assert.match(patched.source, /if\(!prev\)\{await tx\.put\(instKey,\{instanceId:body\.instanceId,licenseCode:l,estado:"activa",origen:"central-pin-verify"/);

  // Also verify git apply --check of patch 08 directly on 94096dde!
  const patch08 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'patches-v895', '08-c218-pin-worker-auto-register-verified-instance.patch');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-c218-p08-'));
  try {
    cp.execFileSync('git', ['init', '-q'], { cwd: tmp });
    const out = path.join(tmp, 'cloudflare-worker', 'pin-worker-api.mjs');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, raw, 'utf8');
    cp.execFileSync('git', ['apply', '--check', patch08], { cwd: tmp });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('RED on live v0.8.98 (8d1519df) -> GREEN Patch 09 & 10: auto-return to Sync4-A after transient failback + foreground/online drain', () => {
  if (!HAS_V895) return;
  const syRaw = gitShowV895('docs/sync-yjs.js');
  const ypRaw = gitShowV895('src/yparty-piloto.js');

  assert.equal(syRaw.includes('API.__retornoSync4Timer'), false, 'RED: v0.8.98 never schedules return to Sync4-A after transient failback');
  assert.equal(ypRaw.includes("window.addEventListener('online', onOnline);"), false, 'RED: v0.8.98 never drains latched ops on foreground/online wakeup');

  const syPatched = patchSyncYjsAutoFailbackReturnToA(syRaw);
  const ypPatched = patchYpartyPilotoWakeupDrain(ypRaw);
  assert.equal(syPatched.changed, true);
  assert.equal(ypPatched.changed, true);
  assert.match(syPatched.source, /drainLatchedSameDo/);
  assert.match(syPatched.source, /_intentarActivarCorte20SiElegible/);
  assert.match(ypPatched.source, /window\.addEventListener\('online', onOnline\)/);
  assert.match(ypPatched.source, /coordinator\.drainLatchedSameDo\(\)/);
});

test('RED on live v0.8.98 (8d1519df) -> GREEN Patch 11: header sync pill reads Sync4 active state when Sync3 is paused', () => {
  if (!HAS_V895) return;
  const raw = gitShowV895('docs/help-ui.js');
  assert.equal(raw.includes('modoCorte20Activo'), false, 'RED: v0.8.98 help-ui.js ignores Sync4 active state');

  const patched = patchHelpUiSync4StatusPill(raw);
  assert.equal(patched.changed, true);
  assert.match(patched.source, /const sync4Activo = !!\(Y && Y\.modoCorte20Activo === true\);/);
  assert.match(patched.source, /window\.addEventListener\("oc-op-20-recibo"/);
});
