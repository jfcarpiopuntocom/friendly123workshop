'use strict';
// Builds and verifies the pre-sealed C224 (v0.9.02) Cloudflare Encrypted Private Relay kit
// against a pristine isolated clone of friendly-123 origin/master (ae7c7138, v0.9.01).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const WORKSHOP_ROOT = path.resolve(__dirname, '..');
const LIVE_REPO = 'C:\\00 Projects\\claude-f123\\friendly-123';
const BASE_SHA = 'ae7c7138d00c8c541afac078974dcfd182593cd9';
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-c224-build-'));
try {
  console.log('1. Cloning pristine friendly-123 at', BASE_SHA);
  run('git', ['clone', '-q', '-c', 'core.autocrlf=false', LIVE_REPO, tmp]);
  run('git', ['-C', tmp, 'checkout', '-q', BASE_SHA]);

  // 2. Copy cloudflare-relay-worker/
  const workerSrc = path.join(WORKSHOP_ROOT, 'cloudflare-relay-worker');
  const workerDst = path.join(tmp, 'cloudflare-relay-worker');
  fs.mkdirSync(path.join(workerDst, 'src'), { recursive: true });
  for (const rel of ['wrangler.jsonc', 'src/priv-relay-core.mjs', 'src/index.mjs']) {
    fs.copyFileSync(path.join(workerSrc, rel), path.join(workerDst, rel));
  }

  // 3. Copy docs/cf-relay.js
  const cfSrc = path.join(WORKSHOP_ROOT, 'browser', 'cf-relay.js');
  const cfDst = path.join(tmp, 'docs', 'cf-relay.js');
  fs.copyFileSync(cfSrc, cfDst);
  const cfBytes = fs.statSync(cfDst).size;
  const cfMinName = cfBytes >= 10 * 1024 ? './cf-relay.min.js' : './cf-relay.js';
  console.log(`   docs/cf-relay.js = ${cfBytes} B -> HTML/SW ref: ${cfMinName}`);

  // 4. Patch docs/sync-yjs.js (Patch 12)
  const syPath = path.join(tmp, 'docs', 'sync-yjs.js');
  replaceExact(
    syPath,
    '      var capaFb = ws.relayLayer === "f123_relay_cupo_fb_v1";',
    '      var capaFb = ws.relayLayer === "f123_relay_cupo_fb_v1" || ws.relayLayer === "f123_relay_cupo_cf_v1";',
    'sync-yjs C224 drenarDurable capaFb allows cf'
  );
  replaceExact(
    syPath,
    '          if (packed || cabeCrudo || !canal.ws || canal.ws.relayLayer !== "f123_relay_cupo_fb_v1") return packed;',
    '          if (packed || cabeCrudo || !canal.ws || (canal.ws.relayLayer !== "f123_relay_cupo_fb_v1" && canal.ws.relayLayer !== "f123_relay_cupo_cf_v1")) return packed;',
    'sync-yjs C224 hacerCkpt gzip gate allows cf'
  );
  replaceExact(
    syPath,
    '      if (!API.modoCorte20Activo || API.canal === API.canalPiloto) API.canal.enviarUpdate(update);\n' +
    '      if (!API.modoCorte20Activo && API.canalSombra && API.canalSombra !== API.canal) API.canalSombra.enviarUpdate(update);',
    '      // C224: Cloudflare 2.0 E2E-encrypted private relay (f123_relay_cupo_cf_v1) is NOT a legacy relay;\n' +
    '      // keep private collections (ventas, dinero/hechos_financieros, comisiones, clientes, gastos) syncing there while 2.0 is active.\n' +
    '      var cfPrivadoActivo = !!(API.canal && API.canal.ws && API.canal.ws.relayLayer === "f123_relay_cupo_cf_v1");\n' +
    '      if (!API.modoCorte20Activo || API.canal === API.canalPiloto || cfPrivadoActivo) API.canal.enviarUpdate(update);\n' +
    '      if (!API.modoCorte20Activo && API.canalSombra && API.canalSombra !== API.canal) API.canalSombra.enviarUpdate(update);',
    'sync-yjs C224 cfPrivadoActivo'
  );
  replaceExact(
    syPath,
    '      if (!API.modoCorte20Activo) API.opsCanal.enviarUpdate(update);',
    '      var cfOpsActivo = !!(API.opsCanal && API.opsCanal.ws && API.opsCanal.ws.relayLayer === "f123_relay_cupo_cf_v1");\n' +
    '      if (!API.modoCorte20Activo || cfOpsActivo) API.opsCanal.enviarUpdate(update);',
    'sync-yjs C224 cfOpsActivo'
  );

  // 5. Patch docs/relay-selector.js (Patch 13)
  const rsPath = path.join(tmp, 'docs', 'relay-selector.js');
  replaceExact(
    rsPath,
    '  var sb = window.F123Relay, fb = window.F123FirebaseRelay;',
    '  var cf = window.F123CloudflareRelay, sb = window.F123Relay, fb = window.F123FirebaseRelay;',
    'relay-selector cf var'
  );
  replaceExact(
    rsPath,
    '  var CAP_UP_RESERVA = 10 * 1024 * 1024, FRAME_RESERVADO = 16 * 1024;\n' +
    '  var CIERRE = "daily relay budget reached; local data retained";\n' +
    '  var capas = [];',
    '  var CAP_UP_RESERVA = 10 * 1024 * 1024, FRAME_RESERVADO = 16 * 1024;\n' +
    '  var CAP_CF_UP = 32 * 1024 * 1024, CAP_CF_DOWN = 128 * 1024 * 1024;\n' +
    '  var CIERRE = "daily relay budget reached; local data retained";\n' +
    '  var capas = [];\n' +
    '  if (cf && cf !== sb && cf !== fb && typeof cf.connect === "function") capas.push({ relay: cf, key: "f123_relay_cupo_cf_v1", capUp: CAP_CF_UP, capDown: CAP_CF_DOWN });',
    'relay-selector capas push cf'
  );
  replaceExact(
    rsPath,
    '  function usable(capa) { var c = leer(capa.key); return Date.now() >= c.pausaHasta && (capa.relay === fb || c.up < CAP_UP) && c.down < CAP_DOWN; }',
    '  function usable(capa) { var c = leer(capa.key); return Date.now() >= c.pausaHasta && (capa.relay === fb || c.up < (capa.capUp || CAP_UP)) && c.down < (capa.capDown || CAP_DOWN); }',
    'relay-selector usable'
  );
  replaceExact(
    rsPath,
    '  function resolverRecuperacion(url) {\n' +
    '    var p = _fallbackRecovery[url]; if (!p) return;\n' +
    '    delete _fallbackRecovery[url];\n' +
    '    if (p.photo) {\n' +
    '      var key = p.key + "_fotos", value = leer(key);\n' +
    '      if (Number(value.pausaHasta) === p.until) {\n' +
    '        value.pausaHasta = Date.now(); guardar(key, value);\n' +
    '      }\n' +
    '    } else {\n' +
    '      var c = leer(p.key);\n' +
    '      if (Number(c.pausaHasta) === p.until) {\n' +
    '        c.pausaHasta = Date.now(); guardar(p.key, c);\n' +
    '      }\n' +
    '    }\n' +
    '  }',
    '  function resolverRecuperacion(url) {\n' +
    '    var raw = _fallbackRecovery[url]; if (!raw) return;\n' +
    '    delete _fallbackRecovery[url];\n' +
    '    var items = Array.isArray(raw) ? raw : [raw];\n' +
    '    for (var i = 0; i < items.length; i++) {\n' +
    '      var p = items[i];\n' +
    '      if (p.photo) {\n' +
    '        var key = p.key + "_fotos", value = leer(key);\n' +
    '        if (Number(value.pausaHasta) === p.until) {\n' +
    '          value.pausaHasta = Date.now(); guardar(key, value);\n' +
    '        }\n' +
    '      } else {\n' +
    '        var c = leer(p.key);\n' +
    '        if (Number(c.pausaHasta) === p.until) {\n' +
    '          c.pausaHasta = Date.now(); guardar(p.key, c);\n' +
    '        }\n' +
    '      }\n' +
    '    }\n' +
    '  }',
    'relay-selector resolverRecuperacion'
  );
  replaceExact(
    rsPath,
    '  function leerFirebase(ws, url) {\n' +
    '    var cs = capas[0];\n' +
    '    if (!OTRA_CAPA_LEER_MS || !ws || !cs || cs.relay === fb) return;\n' +
    '    // A photo-only bootstrap must never pause inventory/money on the preferred relay.\n' +
    '    var photo = esFoto(url), until = 0;\n' +
    '    if (photo) until = pausarFotos(cs, OTRA_CAPA_LEER_MS);\n' +
    '    else {\n' +
    '      var c = leer(cs.key);\n' +
    '      until = c.pausaHasta = Math.max(Number(c.pausaHasta) || 0, Date.now() + OTRA_CAPA_LEER_MS);\n' +
    '      guardar(cs.key, c);\n' +
    '    }\n' +
    '    _fallbackRecovery[url] = { key: cs.key, photo: photo, until: until };',
    '  function leerFirebase(ws, url) {\n' +
    '    if (!OTRA_CAPA_LEER_MS || !ws || !capas.length || capas[0].relay === fb) return;\n' +
    '    // A photo-only bootstrap must never pause inventory/money on the preferred relay.\n' +
    '    // C224: with 3 durable layers (Cloudflare -> Supabase -> Firebase), pause ALL layers ahead of Firebase.\n' +
    '    var photo = esFoto(url), paused = [];\n' +
    '    for (var i = 0; i < capas.length && capas[i].relay !== fb; i++) {\n' +
    '      var cs = capas[i], until = 0;\n' +
    '      if (photo) until = pausarFotos(cs, OTRA_CAPA_LEER_MS);\n' +
    '      else {\n' +
    '        var c = leer(cs.key);\n' +
    '        until = c.pausaHasta = Math.max(Number(c.pausaHasta) || 0, Date.now() + OTRA_CAPA_LEER_MS);\n' +
    '        guardar(cs.key, c);\n' +
    '      }\n' +
    '      paused.push({ key: cs.key, photo: photo, until: until });\n' +
    '    }\n' +
    '    if (!paused.length) return;\n' +
    '    _fallbackRecovery[url] = paused;',
    'relay-selector leerFirebase'
  );
  replaceExact(
    rsPath,
    '      if (!esFoto(url) && c.down >= CAP_DOWN) { c.pausaHasta = Date.now() + PAUSA_MS; guardar(key, c); try { ws.close(1013, CIERRE); } catch (_) {} }',
    '      if (!esFoto(url) && c.down >= (capa.capDown || CAP_DOWN)) { c.pausaHasta = Date.now() + PAUSA_MS; guardar(key, c); try { ws.close(1013, CIERRE); } catch (_) {} }',
    'relay-selector capDown'
  );
  replaceExact(
    rsPath,
    '      var limite = photo ? limiteFotoUp(capa) :\n' +
    '        capa.relay === fb && (n <= FRAME_RESERVADO || !/-(y|ops)$/.test(String(url)))\n' +
    '          ? CAP_UP_RESERVA : CAP_UP;',
    '      var limite = photo ? limiteFotoUp(capa) :\n' +
    '        capa.capUp ? capa.capUp :\n' +
    '        capa.relay === fb && (n <= FRAME_RESERVADO || !/-(y|ops)$/.test(String(url)))\n' +
    '          ? CAP_UP_RESERVA : CAP_UP;',
    'relay-selector capUp'
  );
  // Instant upgrade to CF Layer 0 once PIN login unlocks credentials
  replaceExact(
    rsPath,
    '  window.F123Relay = {',
    '  // C224: before PIN unlock, CF layer cannot request a ticket and pauses. On oc-login, release that pause immediately.\n' +
    '  if (cf && typeof window !== "undefined" && typeof window.addEventListener === "function") {\n' +
    '    window.addEventListener("oc-login", function () {\n' +
    '      try {\n' +
    '        var c = leer("f123_relay_cupo_cf_v1");\n' +
    '        if (c.pausaHasta > Date.now()) { c.pausaHasta = 0; guardar("f123_relay_cupo_cf_v1", c); }\n' +
    '        Object.keys(_sondasWs).forEach(function (u) {\n' +
    '          var s = _sondasWs[u];\n' +
    '          if (s && s.ws && s.ws.readyState === 1 && s.ws.relayLayer !== "f123_relay_cupo_cf_v1") {\n' +
    '            try { s.ws.close(1012, "auth ready; upgrading to preferred layer"); } catch (_) {}\n' +
    '          }\n' +
    '        });\n' +
    '      } catch (_) {}\n' +
    '    });\n' +
    '  }\n' +
    '  window.F123Relay = {\n' +
    '    ckptFrameBytes: (cf && cf.ckptFrameBytes) || (fb && fb.ckptFrameBytes) || 768 * 1024,',
    'relay-selector oc-login upgrade + ckptFrameBytes'
  );

  // Save clean LF-only individual patches 12 & 13 into workshop
  const p12 = run('git', ['-C', tmp, 'diff', '--', 'docs/sync-yjs.js']);
  const p13 = run('git', ['-C', tmp, 'diff', '--', 'docs/relay-selector.js']);
  fs.writeFileSync(path.join(WORKSHOP_ROOT, 'patches-v895', '12-v901-sync-yjs-cf-privado-always-syncs.patch'), p12, 'utf8');
  fs.writeFileSync(path.join(WORKSHOP_ROOT, 'patches-v895', '13-v901-relay-selector-3layer-cf-privado.patch'), p13, 'utf8');
  console.log('2. Exported clean LF patches 12 & 13 (zero BOM)');

  // 6. Wire cf-relay into docs/index.html & docs/sw.js
  replaceExact(
    path.join(tmp, 'docs', 'index.html'),
    '  <script defer src="./firebase-relay.min.js"></script>\n  <script defer src="./relay-selector.min.js"></script>',
    `  <script defer src="./firebase-relay.min.js"></script>\n  <script defer src="${cfMinName}"></script>\n  <script defer src="./relay-selector.min.js"></script>`,
    'index.html cf-relay script'
  );
  replaceExact(
    path.join(tmp, 'docs', 'sw.js'),
    '  "./firebase-relay.min.js",\n  "./relay-selector.min.js",',
    `  "./firebase-relay.min.js",\n  "${cfMinName}",\n  "./relay-selector.min.js",`,
    'sw.js SHELL cf-relay'
  );

  // 7. Update test/relay-sin-cloudflare-datos-v557.test.js per JFC handoff item #4
  const auditTest = path.join(tmp, 'test', 'relay-sin-cloudflare-datos-v557.test.js');
  replaceExact(
    auditTest,
    "  assert.deepEqual(donde(/friendly123-sync-relay/), [...esperados, 'dashboard-broadcast.js', 'firebase-relay.js', 'peer-sync.js'].sort());",
    "  assert.deepEqual(donde(/friendly123-sync-relay/), [...esperados, 'cf-relay.js', 'dashboard-broadcast.js', 'firebase-relay.js', 'peer-sync.js'].sort());",
    'v557 allow cf-relay.js locator regex'
  );
  replaceExact(
    auditTest,
    "  assert.deepEqual([...hosts.keys()].sort(), ['amigable-licencias', 'friendly123-licencias', 'friendly123-sync-relay']);",
    "  // C224 (MDD-2026-10-31 #2): friendly123-relay-privado stores E2E AES-256-GCM ciphertext only.\n" +
    "  assert.deepEqual([...hosts.keys()].sort(), ['amigable-licencias', 'friendly123-licencias', 'friendly123-relay-privado', 'friendly123-sync-relay']);\n" +
    "  assert.deepEqual([...hosts.get('friendly123-relay-privado')].sort(), ['cf-relay.js']);",
    'v557 allow friendly123-relay-privado host'
  );
  replaceExact(
    auditTest,
    "  assert.deepEqual(lic, ['auth-ui.js', 'crypto-store.js', 'dashboard-main.min.js', 'panel-pin.js', 'panel.html']);",
    "  assert.deepEqual(lic, ['auth-ui.js', 'cf-relay.js', 'crypto-store.js', 'dashboard-main.min.js', 'panel-pin.js', 'panel.html']);",
    'v557 allow cf-relay.js /ws/ticket on friendly123-licencias'
  );
  replaceExact(
    auditTest,
    "      if (/\\.workers\\.dev$/i.test(u.hostname)) assert.equal(u.hostname, 'friendly123-licencias.jfcarpio.workers.dev');",
    "      if (/\\.workers\\.dev$/i.test(u.hostname)) {\n" +
    "        if (u.hostname === 'friendly123-relay-privado.jfcarpio.workers.dev') {\n" +
    "          assert.match(u.pathname, /^\\/f123\\/[a-f0-9]{40}(-y|-ops|-fotos)?\\/(session|head|pull|op|ckpt|ts)$/);\n" +
    "        } else {\n" +
    "          assert.equal(u.hostname, 'friendly123-licencias.jfcarpio.workers.dev');\n" +
    "        }\n" +
    "      }",
    'v557 allow friendly123-relay-privado encrypted HTTPS routes'
  );

  // 8. Add permanent CI test test/p0-c224-cf-relay-privado.test.mjs
  const ciTestSrc = fs.readFileSync(path.join(WORKSHOP_ROOT, 'tests', '15-c224-cf-privado-e2e.test.mjs'), 'utf8')
    .replace("'../cloudflare-relay-worker/src/priv-relay-core.mjs'", "'../cloudflare-relay-worker/src/priv-relay-core.mjs'")
    .replace("path.join(ROOT, 'browser', 'cf-relay.js')", "path.join(ROOT, 'docs', 'cf-relay.js')");
  fs.writeFileSync(path.join(tmp, 'test', 'p0-c224-cf-relay-privado.test.mjs'), ciTestSrc, 'utf8');

  // 9. Bump version.json, sw.js, dashboard.html to v0.9.02 / f123-shell-v902 / golden438
  const vPath = path.join(tmp, 'docs', 'version.json');
  const v = JSON.parse(fs.readFileSync(vPath, 'utf8'));
  v.version = 'v0.9.02';
  v.releaseName = 'v0.9.02';
  v.shell = 'f123-shell-v902';
  v.cacheGeneration = 'golden438';
  v.changelog = 'v0.9.02 C224: buzon cifrado 2.0 en Cloudflare (friendly123-relay-privado) primero en la cascada con autorizacion por licencia y rol (dueno/admin/empleado); historial privado completo (dinero, ventas, comisiones, clientes) en aparatos nuevos.';
  fs.writeFileSync(vPath, JSON.stringify(v, null, 2) + '\n', 'utf8');

  replaceExact(path.join(tmp, 'docs', 'sw.js'), 'const CACHE = "f123-shell-v901";', 'const CACHE = "f123-shell-v902";', 'sw CACHE');
  replaceExact(path.join(tmp, 'docs', 'sw.js'), 'const CACHE_GENERACION = "-golden437";', 'const CACHE_GENERACION = "-golden438";', 'sw CACHE_GENERACION');
  const dashPath = path.join(tmp, 'docs', 'dashboard.html');
  fs.writeFileSync(
    dashPath,
    fs.readFileSync(dashPath, 'utf8')
      .replace(/v0\.9\.01/g, 'v0.9.02')
      .replace(/f123-shell-v901/g, 'f123-shell-v902')
      .replace(/golden437/g, 'golden438'),
    'utf8'
  );

  // 10. Rebuild minified scripts & manifest
  const envBuild = { ...process.env, NODE_PATH: NODE_MODULES_PATH };
  console.log('3. Building .min.js and version-manifest.json');
  console.log(run('node', ['scripts/build-min-scripts.cjs'], { cwd: tmp, env: envBuild }).trim());
  console.log(run('node', ['scripts/build-min-scripts.cjs', '--check'], { cwd: tmp, env: envBuild }).trim());
  console.log(run('node', ['scripts/gen-manifest.js'], { cwd: tmp, env: envBuild }).trim());

  // 11. Run release-control.cjs validate against BASE_SHA
  console.log('4. Running release-control.cjs validate', BASE_SHA);
  console.log(run('node', ['scripts/release-control.cjs', 'validate', BASE_SHA], { cwd: tmp, env: envBuild }).trim());

  // 12. Run real friendly-123 CI tests (non-Playwright + C224 E2E + relay-selector + auth + rollout + manifest)
  console.log('5. Running real friendly-123 CI test suite...');
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

  // 12b. Run ALL 7 Parte 1 static security audits from test/relay-sin-cloudflare-datos-v557.test.js (pure Node, no Chromium)
  console.log('5b. Verifying Parte 1 static audits of test/relay-sin-cloudflare-datos-v557.test.js...');
  const v557Src = fs.readFileSync(auditTest, 'utf8');
  const v557StaticOnly = v557Src
    .replace("const { startServer, openDevice, enterAs, go, chromium } = require('./helpers/e2e-app.cjs');", '')
    .split('// ---------- Parte 2: navegador real ----------')[0];
  const v557Tmp = path.join(tmp, 'test', '_tmp_v557_static.test.cjs');
  fs.writeFileSync(v557Tmp, v557StaticOnly, 'utf8');
  const v557Out = run('node', ['--test', v557Tmp], { cwd: tmp, env: envBuild });
  fs.unlinkSync(v557Tmp);
  console.log(v557Out.split('\n').slice(-15).join('\n'));

  // 13. Stage untracked files and export complete pre-sealed atomic release patch!
  run('git', ['-C', tmp, 'add', '-A']);
  const atomicPatch = run('git', ['-C', tmp, 'diff', '--cached', '--binary']);
  const relDir = path.join(WORKSHOP_ROOT, 'releases');
  fs.mkdirSync(relDir, { recursive: true });
  const atomicPath = path.join(relDir, 'C224-v0.9.02-CF-Privado-on-ae7c7138.patch');
  fs.writeFileSync(atomicPath, atomicPatch, 'utf8');
  console.log(`6. Wrote atomic pre-sealed patch: ${atomicPath} (${Buffer.byteLength(atomicPatch)} B)`);

  // 14. Self-verify atomic patch applies cleanly onto a fresh reset of BASE_SHA!
  run('git', ['-C', tmp, 'reset', '--hard', '-q', BASE_SHA]);
  run('git', ['-C', tmp, 'clean', '-fdq']);
  run('git', ['-C', tmp, 'apply', '--check', atomicPath]);
  run('git', ['-C', tmp, 'apply', atomicPath]);
  console.log('7. Verified atomic patch git apply --check + git apply PASS on pristine ae7c7138!');
  console.log(run('git', ['-C', tmp, 'status', '--short']).trim());
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
