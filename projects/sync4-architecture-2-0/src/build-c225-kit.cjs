'use strict';
// Builds and verifies the pre-sealed C225 (v0.9.03) atomic patch on top of friendly-123 origin/master
// (a3ea5068, v0.9.02), delivering:
// 1. Full-store (>768 KiB) encrypted checkpoint & live opsDoc sync on Cloudflare Layer 0 (f123_relay_cupo_cf_v1):
//    - docs/relay-selector.js: expose ckptFrameBytes on window.F123Relay
//    - docs/sync-yjs.js: allow f123_relay_cupo_cf_v1 in hacerCkpt() tag-7 gzip gate & drenarDurable() capaFb filter
//    - docs/sync-yjs.js: allow cfOpsActivo on API.opsDoc.on("update") so live financial ops sync to Layer 0
// 2. Safari iPhone WebKitBlobResource error 1 & 24h rolling auto-export window fix (docs/backup-scheduler.js):
//    - 24h rolling window (86,400,000 ms) instead of calendar date (plus backward compatibility with YYYY-MM-DD)
//    - write LS_AUTOEXPORT before triggering the download gesture so an iOS navigation cannot re-arm on next login
//    - defer URL.revokeObjectURL to 5 minutes and skip automatic window.open(blobUrl, "_blank") inside auto-export on iOS
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const WORKSHOP_ROOT = path.resolve(__dirname, '..');
const LIVE_REPO = 'C:\\00 Projects\\claude-f123\\friendly-123';
const BASE_SHA = 'a3ea506862da18749b97dd3b6a99fdf66fd13a3a';
const NODE_MODULES_PATH = 'C:\\00 Projects\\claude-f123\\wt-sync4\\node_modules';

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts
  });
}

function replaceExact(filePath, from, to, label) {
  const s = fs.readFileSync(filePath, 'utf8');
  if (!s.includes(from)) throw new Error(`Missing target (${label}) in ${filePath}`);
  fs.writeFileSync(filePath, s.replace(from, to), 'utf8');
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-c225-build-'));
try {
  console.log('1. Cloning pristine friendly-123 at', BASE_SHA);
  run('git', ['clone', '-q', '-c', 'core.autocrlf=false', LIVE_REPO, tmp]);
  run('git', ['-C', tmp, 'checkout', '-q', BASE_SHA]);

  // 2. Patch docs/sync-yjs.js (3 critical full-store fixes on f123_relay_cupo_cf_v1)
  const syPath = path.join(tmp, 'docs', 'sync-yjs.js');
  replaceExact(
    syPath,
    '      var capaFb = ws.relayLayer === "f123_relay_cupo_fb_v1";',
    '      var capaFb = ws.relayLayer === "f123_relay_cupo_fb_v1" || ws.relayLayer === "f123_relay_cupo_cf_v1";',
    'sync-yjs C225 drenarDurable capaFb allows cf'
  );
  replaceExact(
    syPath,
    '          if (packed || cabeCrudo || !canal.ws || canal.ws.relayLayer !== "f123_relay_cupo_fb_v1") return packed;',
    '          if (packed || cabeCrudo || !canal.ws || (canal.ws.relayLayer !== "f123_relay_cupo_fb_v1" && canal.ws.relayLayer !== "f123_relay_cupo_cf_v1")) return packed;',
    'sync-yjs C225 hacerCkpt gzip gate allows cf'
  );
  replaceExact(
    syPath,
    '      if (!API.modoCorte20Activo) API.opsCanal.enviarUpdate(update);',
    '      var cfOpsActivo = !!(API.opsCanal && API.opsCanal.ws && API.opsCanal.ws.relayLayer === "f123_relay_cupo_cf_v1");\n' +
    '      if (!API.modoCorte20Activo || cfOpsActivo) API.opsCanal.enviarUpdate(update);',
    'sync-yjs C225 cfOpsActivo'
  );

  // 3. Patch docs/relay-selector.js (expose ckptFrameBytes on window.F123Relay)
  const rsPath = path.join(tmp, 'docs', 'relay-selector.js');
  replaceExact(
    rsPath,
    '  window.F123Relay = {',
    '  window.F123Relay = {\n    ckptFrameBytes: (cf && cf.ckptFrameBytes) || (fb && fb.ckptFrameBytes) || 768 * 1024,',
    'relay-selector C225 ckptFrameBytes'
  );

  // 4. Patch docs/backup-scheduler.js (24h rolling window + Safari iPhone WebKitBlobResource error 1 fix)
  const bkPath = path.join(tmp, 'docs', 'backup-scheduler.js');
  replaceExact(
    bkPath,
    '  function descargarArchivo(texto, nombre) {\n' +
    '    const blob = new Blob([texto], { type: "application/json" });\n' +
    '    const url = URL.createObjectURL(blob);\n' +
    '    const a = document.createElement("a");\n' +
    '    a.href = url;\n' +
    '    a.download = nombre;\n' +
    '    document.body.appendChild(a);\n' +
    '    try { a.click(); } catch (_) { try { window.open(url, "_blank"); } catch (_) {} }\n' +
    '    a.remove();\n' +
    '    setTimeout(() => URL.revokeObjectURL(url), 60_000);\n' +
    '  }',
    '  function descargarArchivo(texto, nombre, soloAncla) {\n' +
    '    const blob = new Blob([texto], { type: "application/json" });\n' +
    '    const url = URL.createObjectURL(blob);\n' +
    '    const a = document.createElement("a");\n' +
    '    a.href = url;\n' +
    '    a.download = nombre;\n' +
    '    document.body.appendChild(a);\n' +
    '    try { a.click(); } catch (_) { if (!soloAncla) { try { window.open(url, "_blank"); } catch (_) {} } }\n' +
    '    a.remove();\n' +
    '    setTimeout(() => URL.revokeObjectURL(url), 300_000);\n' +
    '  }',
    'backup-scheduler C225 descargarArchivo 5min revoke'
  );
  replaceExact(
    bkPath,
    '  const LS_AUTOEXPORT = "f123_autoexport_dia_v1";\n' +
    '  function diaLocal(d) {\n' +
    '    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");\n' +
    '  }',
    '  const LS_AUTOEXPORT = "f123_autoexport_dia_v1";\n' +
    '  const AUTOEXPORT_INTERVAL_MS = 24 * 60 * 60 * 1000;\n' +
    '  function diaLocal(d) {\n' +
    '    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");\n' +
    '  }',
    'backup-scheduler C225 AUTOEXPORT_INTERVAL_MS'
  );
  replaceExact(
    bkPath,
    '  let _exportPreparando = false;\n' +
    '  function yaExportadoHoy() {\n' +
    '    try { return localStorage.getItem(LS_AUTOEXPORT) === diaLocal(new Date()); } catch (_) { return true; }\n' +
    '  }\n' +
    '  async function prepararExportLocal() {\n' +
    '    if (_exportPreparando || yaExportadoHoy()) return;\n' +
    '    _exportPreparando = true;\n' +
    '    let info;\n' +
    '    try { info = await construirExportLocal(new Date()); }\n' +
    '    catch (_) { _exportPreparando = false; return; } // sin aviso: se reintenta en el proximo login\n' +
    '    document.addEventListener("pointerdown", function () {\n' +
    '      _exportPreparando = false;\n' +
    '      if (yaExportadoHoy()) return;\n' +
    '      try {\n' +
    '        descargarArchivo(info.texto, info.nombre);\n' +
    '        localStorage.setItem(LS_AUTOEXPORT, diaLocal(new Date()));\n' +
    '      } catch (_) {}\n' +
    '    }, { once: true, capture: true });\n' +
    '  }',
    '  let _exportPreparando = false;\n' +
    '  function yaExportadoHoy(ahoraMs) {\n' +
    '    try {\n' +
    '      const now = Number.isFinite(ahoraMs) ? ahoraMs : Date.now();\n' +
    '      const raw = localStorage.getItem(LS_AUTOEXPORT);\n' +
    '      if (!raw) return false;\n' +
    '      if (/^\\d+$/.test(raw)) {\n' +
    '        const ts = parseInt(raw, 10);\n' +
    '        return ts > 0 && (now - ts) < AUTOEXPORT_INTERVAL_MS;\n' +
    '      }\n' +
    '      return raw === diaLocal(new Date(now));\n' +
    '    } catch (_) { return true; }\n' +
    '  }\n' +
    '  async function prepararExportLocal() {\n' +
    '    if (_exportPreparando || yaExportadoHoy()) return;\n' +
    '    _exportPreparando = true;\n' +
    '    let info;\n' +
    '    try { info = await construirExportLocal(new Date()); }\n' +
    '    catch (_) { _exportPreparando = false; return; } // sin aviso: se reintenta en el proximo login\n' +
    '    document.addEventListener("pointerdown", function () {\n' +
    '      _exportPreparando = false;\n' +
    '      const now = Date.now();\n' +
    '      if (yaExportadoHoy(now)) return;\n' +
    '      try {\n' +
    '        // Record the 24h stamp BEFORE triggering the download so iOS Safari cannot re-trigger in the same session\n' +
    '        localStorage.setItem(LS_AUTOEXPORT, String(now));\n' +
    '        descargarArchivo(info.texto, info.nombre, true);\n' +
    '      } catch (_) {}\n' +
    '    }, { once: true, capture: true });\n' +
    '  }',
    'backup-scheduler C225 24h rolling window and pre-gesture stamp'
  );
  replaceExact(
    bkPath,
    '  window.OCBackupScheduler._construirExportLocal = construirExportLocal;',
    '  window.OCBackupScheduler._construirExportLocal = construirExportLocal;\n' +
    '  window.OCBackupScheduler._yaExportadoHoy = yaExportadoHoy;',
    'backup-scheduler expose _yaExportadoHoy for test'
  );

  // 5. Update test/p0-c224-cf-relay-privado.test.mjs with full-store + 24h Safari backup assertions
  const testPath = path.join(tmp, 'test', 'p0-c224-cf-relay-privado.test.mjs');
  const testExtra = `
test('C225 full-store (>768 KiB) checkpoint & opsDoc contract on f123_relay_cupo_cf_v1', () => {
  const sy = fs.readFileSync(path.join(ROOT, 'docs', 'sync-yjs.js'), 'utf8');
  const rs = fs.readFileSync(path.join(ROOT, 'docs', 'relay-selector.js'), 'utf8');
  const bk = fs.readFileSync(path.join(ROOT, 'docs', 'backup-scheduler.js'), 'utf8');

  // 1. relay-selector must expose ckptFrameBytes on window.F123Relay so >192KiB/512KiB checkpoints are not throttled
  assert.match(rs, /window\\.F123Relay\\s*=\\s*\\{\\s*ckptFrameBytes:/);

  // 2. hacerCkpt gzip gate (tag 7) and drenarDurable soloFb filter must allow f123_relay_cupo_cf_v1
  assert.match(sy, /var capaFb = ws\\.relayLayer === "f123_relay_cupo_fb_v1" \\|\\| ws\\.relayLayer === "f123_relay_cupo_cf_v1";/);
  assert.match(sy, /canal\\.ws\\.relayLayer !== "f123_relay_cupo_fb_v1" && canal\\.ws\\.relayLayer !== "f123_relay_cupo_cf_v1"/);

  // 3. Both API.doc and API.opsDoc must continue syncing live updates on f123_relay_cupo_cf_v1 when 2.0 cutover is active
  assert.match(sy, /var cfPrivadoActivo = !!\\(API\\.canal && API\\.canal\\.ws && API\\.canal\\.ws\\.relayLayer === "f123_relay_cupo_cf_v1"\\);/);
  assert.match(sy, /var cfOpsActivo = !!\\(API\\.opsCanal && API\\.opsCanal\\.ws && API\\.opsCanal\\.ws\\.relayLayer === "f123_relay_cupo_cf_v1"\\);/);

  // 4. backup-scheduler enforces 24-hour rolling window (86,400,000 ms) across midnight and stamps before gesture
  assert.match(bk, /const AUTOEXPORT_INTERVAL_MS = 24 \\* 60 \\* 60 \\* 1000;/);
  assert.match(bk, /localStorage\\.setItem\\(LS_AUTOEXPORT, String\\(now\\)\\);\\s*descargarArchivo\\(info\\.texto, info\\.nombre, true\\);/);
});
`;
  fs.writeFileSync(testPath, fs.readFileSync(testPath, 'utf8') + testExtra, 'utf8');

  // 6. Bump version.json, sw.js, dashboard.html to v0.9.03 / f123-shell-v903 / golden439
  const vPath = path.join(tmp, 'docs', 'version.json');
  const v = JSON.parse(fs.readFileSync(vPath, 'utf8'));
  v.version = 'v0.9.03';
  v.releaseName = 'v0.9.03';
  v.shell = 'f123-shell-v903';
  v.cacheGeneration = 'golden439';
  v.changelog = 'v0.9.03 C225: checkpoints completos comprimidos (tag 7 >768 KiB), ckptFrameBytes y opsDoc en vivo sobre friendly123-relay-privado (dinero, comisiones, movimientos, ventas y clientes); ventana corrida de 24h en auto-respaldo sin error WebKitBlobResource en iPhone.';
  fs.writeFileSync(vPath, JSON.stringify(v, null, 2) + '\n', 'utf8');

  replaceExact(path.join(tmp, 'docs', 'sw.js'), 'const CACHE = "f123-shell-v902";', 'const CACHE = "f123-shell-v903";', 'sw CACHE');
  replaceExact(path.join(tmp, 'docs', 'sw.js'), 'const CACHE_GENERACION = "-golden438";', 'const CACHE_GENERACION = "-golden439";', 'sw CACHE_GENERACION');
  const dashPath = path.join(tmp, 'docs', 'dashboard.html');
  fs.writeFileSync(
    dashPath,
    fs.readFileSync(dashPath, 'utf8')
      .replace(/v0\.9\.02/g, 'v0.9.03')
      .replace(/f123-shell-v902/g, 'f123-shell-v903')
      .replace(/golden438/g, 'golden439'),
    'utf8'
  );

  // 7. Rebuild minified scripts & manifest
  const envBuild = { ...process.env, NODE_PATH: NODE_MODULES_PATH };
  console.log('2. Building .min.js and version-manifest.json');
  console.log(run('node', ['scripts/build-min-scripts.cjs'], { cwd: tmp, env: envBuild }).trim());
  console.log(run('node', ['scripts/build-min-scripts.cjs', '--check'], { cwd: tmp, env: envBuild }).trim());
  console.log(run('node', ['scripts/gen-manifest.js'], { cwd: tmp, env: envBuild }).trim());

  // 8. Run release-control.cjs validate against BASE_SHA
  console.log('3. Running release-control.cjs validate', BASE_SHA);
  console.log(run('node', ['scripts/release-control.cjs', 'validate', BASE_SHA], { cwd: tmp, env: envBuild }).trim());

  // 9. Run real friendly-123 CI tests
  console.log('4. Running real friendly-123 CI test suite...');
  const tests = [
    'test/p0-c224-cf-relay-privado.test.mjs',
    'test/relay-selector.test.cjs',
    'test/p0-v767-cupo-dia-local.test.cjs',
    'test/relay-sondas-v644.test.cjs',
    'test/p0-rollout-policy.test.mjs',
    'test/p0-central-pin-authority.test.mjs',
    'test/p0-ws-capability-issuer.test.mjs',
    'test/p0-ws-worker-api.test.mjs',
    'test/p0-c210-port2-shipped-manifest-seal.test.mjs',
    'test/p0-c216-no-reenganchar-button.test.mjs',
    'test/p0-c217-recovery-link.test.mjs'
  ];
  const testOut = run('node', ['--test', ...tests], { cwd: tmp, env: envBuild });
  console.log(testOut.split('\n').slice(-18).join('\n'));

  // 10. Stage and export atomic pre-sealed patch C225-v0.9.03-FullStore-Safari24h-on-a3ea5068.patch
  run('git', ['-C', tmp, 'add', '-A']);
  const atomicPatch = run('git', ['-C', tmp, 'diff', '--cached', '--binary']);
  const relDir = path.join(WORKSHOP_ROOT, 'releases');
  fs.mkdirSync(relDir, { recursive: true });
  const patchFile = path.join(relDir, 'C225-v0.9.03-FullStore-Safari24h-on-a3ea5068.patch');
  fs.writeFileSync(patchFile, atomicPatch, 'utf8');
  console.log(`5. Wrote atomic pre-sealed patch: ${patchFile} (${Buffer.byteLength(atomicPatch)} B)`);

  // 11. Verify git apply --check on pristine a3ea5068
  const tmpCheck = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-c225-verify-'));
  try {
    run('git', ['clone', '-q', '-c', 'core.autocrlf=false', LIVE_REPO, tmpCheck]);
    run('git', ['-C', tmpCheck, 'checkout', '-q', BASE_SHA]);
    run('git', ['-C', tmpCheck, 'apply', '--check', patchFile]);
    run('git', ['-C', tmpCheck, 'apply', patchFile]);
    const st = run('git', ['-C', tmpCheck, 'status', '--short']).trim();
    console.log('6. Verified atomic patch git apply --check + git apply PASS on pristine a3ea5068!\n' + st);
  } finally {
    fs.rmSync(tmpCheck, { recursive: true, force: true });
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
