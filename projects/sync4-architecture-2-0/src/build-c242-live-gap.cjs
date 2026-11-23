#!/usr/bin/env node
"use strict";

/**
 * C242 (v0.9.12 / f123-shell-v912 / golden448)
 * Base: origin/master = origin/estable = 4a6d038f7e8230e90036e543671fde987bb65ad5 (v0.9.11 / C241)
 *
 * Strictly zero new scope — closes ONLY the exact deltas left between PR #1091 (which merged an
 * earlier draft) and verified C239 (b2984f43), while preserving C240 (dormant Supabase) and C241 (13px):
 * 1. docs/index.html: move crash-loop circuit breaker RIGHT AFTER <script src="./aislamiento.js"></script>
 *    so sessionStorage uses the f123:: namespace, remove __f123SafeBootMode side-suppression, and exempt
 *    intentional SW reloads (f123_sw_reload_ts < 15000ms).
 * 2. src/app/app-inline-03.js: stamp f123_sw_reload_ts before location.reload() inside intentar().
 * 3. docs/reenganchar.html: clear both f123:: namespaced and raw transient crash/reload latches.
 * 4. docs/estado-idb.js: add missing 8000ms (15000ms onupgradeneeded) WebKit indexedDB.open() hang watchdog.
 * 5. docs/backup-scheduler.js & docs/sync-yjs.js: cut backup blob URL retention 300s -> 5s + info=null
 *    (keeping C199 100% active), and restore 2500ms checkpoint timing in sync-yjs.js.
 */

const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const targetRoot = process.argv[2];
if (!targetRoot || !fs.existsSync(path.join(targetRoot, "src", "app", "app-inline-03.js"))) {
  console.error("Usage: node build-c242-live-gap.cjs <path-to-friendly-123-clone>");
  process.exit(2);
}

function readRel(rel) {
  return fs.readFileSync(path.join(targetRoot, rel), "utf8");
}
function writeRel(rel, text) {
  fs.writeFileSync(path.join(targetRoot, rel), text, "utf8");
}
function replaceExact(rel, target, replacement, label) {
  const src = readRel(rel);
  const idx = src.indexOf(target);
  if (idx === -1) throw new Error(`[${rel}] missing target for: ${label}`);
  if (src.indexOf(target, idx + target.length) !== -1) {
    throw new Error(`[${rel}] ambiguous multiple matches for: ${label}`);
  }
  writeRel(rel, src.slice(0, idx) + replacement + src.slice(idx + target.length));
}

// 1. docs/index.html — remove pre-aislamiento breaker and reinsert RIGHT AFTER ./aislamiento.js
replaceExact(
  "docs/index.html",
  `<script>
// C237 Safari / iOS PWA non-destructive crash-loop circuit breaker (never deletes IDB/localStorage).
(function () {
  var KEY = "f123_boot_crash_v1";
  try {
    if (window.__f123ManualPurgeReentry) { sessionStorage.removeItem(KEY); return; }
    var now = Date.now(), st = null;
    try { st = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (_) {}
    var withinWindow = st && typeof st.t === "number" && (now - st.t) < 12000;
    var count = withinWindow ? (Number(st.c) || 0) + 1 : 1;
    sessionStorage.setItem(KEY, JSON.stringify({ c: count, t: now }));
    if (count >= 2) window.__f123SafeBootMode = true;
    var clearHealthy = function () {
      setTimeout(function () { try { sessionStorage.removeItem(KEY); } catch (_) {} }, 6000);
    };
    if (document.readyState === "complete") clearHealthy();
    else window.addEventListener("load", clearHealthy, { once: true });
    if (count >= 3) {
      window.__f123CrashLoopPaused = true;
      window.addEventListener("DOMContentLoaded", function () {
        if (!document.body || document.getElementById("f123-safe-recovery")) return;
        var wrap = document.createElement("div");
        wrap.id = "f123-safe-recovery";
        wrap.setAttribute("role", "alertdialog");
        wrap.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#0F1923;color:#FFF8E8;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:system-ui,-apple-system,sans-serif;";
        wrap.innerHTML = '<div style="max-width:360px;">'
          + '<h2 style="margin:0 0 10px;font-size:22px;">Safe recovery</h2>'
          + '<p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Safari restarted the page repeatedly. Your notebook and sales data stay untouched.</p>'
          + '<div style="display:flex;flex-direction:column;gap:10px;">'
          + '<button type="button" id="f123-safe-retry" style="min-height:44px;padding:10px 20px;border-radius:8px;border:2px solid #E8A020;background:#E8A020;color:#0F1923;font-weight:800;font-size:15px;cursor:pointer;">Continue cleanly</button>'
          + '<a id="f123-safe-reengage" href="./reenganchar.html?desde=recovery" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 20px;border-radius:8px;border:2px solid #5294AC;background:#152840;color:#FFF8E8;font-weight:700;font-size:15px;text-decoration:none;">Update &amp; repair loading</a>'
          + '</div></div>';
        document.body.appendChild(wrap);
        var btn = document.getElementById("f123-safe-retry");
        if (btn) btn.addEventListener("click", function () {
          try { sessionStorage.removeItem(KEY); } catch (_) {}
          location.replace(location.pathname + location.search + location.hash);
        });
      }, { once: true });
    }
  } catch (_) {}
})();
</script>
`,
  ``,
  "docs/index.html remove pre-aislamiento circuit breaker"
);

replaceExact(
  "docs/index.html",
  `<script src="./aislamiento.js"></script>`,
  `<script src="./aislamiento.js"></script>
<script>
// C242 Safari / iOS PWA non-destructive crash-loop circuit breaker (runs AFTER aislamiento.js for f123:: namespace).
(function () {
  var KEY = "f123_boot_crash_v1", SW_KEY = "f123_sw_reload_ts";
  try {
    var now = Date.now(), swTs = 0;
    try { swTs = Number(sessionStorage.getItem(SW_KEY) || "0") || 0; } catch (_) {}
    if (swTs) { try { sessionStorage.removeItem(SW_KEY); } catch (_) {} }
    if (window.__f123ManualPurgeReentry || (swTs && (now - swTs) < 15000)) {
      sessionStorage.removeItem(KEY);
      return;
    }
    var st = null;
    try { st = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (_) {}
    var withinWindow = st && typeof st.t === "number" && (now - st.t) < 12000;
    var count = withinWindow ? (Number(st.c) || 0) + 1 : 1;
    sessionStorage.setItem(KEY, JSON.stringify({ c: count, t: now }));
    var clearHealthy = function () {
      setTimeout(function () { try { sessionStorage.removeItem(KEY); } catch (_) {} }, 6000);
    };
    if (document.readyState === "complete") clearHealthy();
    else window.addEventListener("load", clearHealthy, { once: true });
    if (count >= 3) {
      window.__f123CrashLoopPaused = true;
      window.addEventListener("DOMContentLoaded", function () {
        if (!document.body || document.getElementById("f123-safe-recovery")) return;
        var wrap = document.createElement("div");
        wrap.id = "f123-safe-recovery";
        wrap.setAttribute("role", "alertdialog");
        wrap.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#0F1923;color:#FFF8E8;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:system-ui,-apple-system,sans-serif;";
        wrap.innerHTML = '<div style="max-width:360px;">'
          + '<h2 style="margin:0 0 10px;font-size:22px;">Safe recovery</h2>'
          + '<p style="margin:0 0 16px;font-size:15px;line-height:1.5;">Safari restarted the page repeatedly. Your notebook and sales data stay untouched.</p>'
          + '<div style="display:flex;flex-direction:column;gap:10px;">'
          + '<button type="button" id="f123-safe-retry" style="min-height:44px;padding:10px 20px;border-radius:8px;border:2px solid #E8A020;background:#E8A020;color:#0F1923;font-weight:800;font-size:15px;cursor:pointer;">Continue cleanly</button>'
          + '<a id="f123-safe-reengage" href="./reenganchar.html?desde=recovery" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 20px;border-radius:8px;border:2px solid #5294AC;background:#152840;color:#FFF8E8;font-weight:700;font-size:15px;text-decoration:none;">Update &amp; repair loading</a>'
          + '</div></div>';
        document.body.appendChild(wrap);
        var btn = document.getElementById("f123-safe-retry");
        if (btn) btn.addEventListener("click", function () {
          try { sessionStorage.removeItem(KEY); } catch (_) {}
          location.replace(location.pathname + location.search + location.hash);
        });
      }, { once: true });
    }
  } catch (_) {}
})();
</script>`,
  "docs/index.html insert circuit breaker right after aislamiento.js"
);

// 2. src/app/app-inline-03.js — stamp f123_sw_reload_ts before intentional location.reload()
replaceExact(
  "src/app/app-inline-03.js",
  `      sessionStorage.setItem(KA, JSON.stringify({ shell: objetivo }));
      sessionStorage.removeItem(KP);
      limpiarFrenada();
      marcarRecarga("version-pin");
      location.reload();`,
  `      sessionStorage.setItem(KA, JSON.stringify({ shell: objetivo }));
      sessionStorage.removeItem(KP);
      try { sessionStorage.setItem("f123_sw_reload_ts", String(Date.now())); } catch (_) {}
      limpiarFrenada();
      marcarRecarga("version-pin");
      location.reload();`,
  "app-inline-03 stamp f123_sw_reload_ts before location.reload()"
);

// 3. docs/reenganchar.html — clear both f123:: namespaced and raw transient crash/reload latches
replaceExact(
  "docs/reenganchar.html",
  `    // 4) Clear transient boot/crash latches so re-engagement lands cleanly on the newest version.
    try{
      sessionStorage.removeItem("f123_boot_crash_v1");
      sessionStorage.removeItem("f123_act_sola_pendiente");
      sessionStorage.removeItem("f123_autorecarga");
      sessionStorage.removeItem("f123_reload_al_entrar");
      sessionStorage.removeItem("f123_update_frenada_desde");
    }catch(_){}`,
  `    // 4) Clear transient boot/crash latches (both f123:: namespaced and raw) without touching IDB/localStorage.
    try{
      ["f123_boot_crash_v1","f123_sw_reload_ts","f123_act_sola_pendiente","f123_autorecarga","f123_reload_al_entrar","f123_update_frenada_desde"].forEach(function(k){
        sessionStorage.removeItem("f123::"+k);
        sessionStorage.removeItem(k);
      });
    }catch(_){}`,
  "docs/reenganchar.html clear f123:: and raw latches"
);

// 4. docs/estado-idb.js — add missing 8000ms (15000ms onupgradeneeded) WebKit indexedDB.open() hang watchdog
replaceExact(
  "docs/estado-idb.js",
  `  function abrirDB() {
    if (dbPromise) return dbPromise;
    var req;
    try { req = indexedDB.open(DB_NAME, 1); } catch (err) { return Promise.reject(err); }
    var promise, settled = false;
    promise = new Promise(function (resolve, reject) {
      function fail(err) {
        if (settled) return;
        settled = true;
        if (dbPromise === promise) dbPromise = null;
        reject(err);
      }
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = function () {
        var db = req.result;
        if (settled) { db.close(); return; }
        settled = true;`,
  `  function abrirDB() {
    if (dbPromise) return dbPromise;
    var req;
    try { req = indexedDB.open(DB_NAME, 1); } catch (err) { return Promise.reject(err); }
    var promise, settled = false, watchdog = null;
    promise = new Promise(function (resolve, reject) {
      function resetWatchdog(ms) {
        if (watchdog) clearTimeout(watchdog);
        watchdog = setTimeout(function () { fail(new Error("IndexedDB state open timed out")); }, ms);
      }
      function fail(err) {
        if (settled) return;
        settled = true;
        if (watchdog) { clearTimeout(watchdog); watchdog = null; }
        if (dbPromise === promise) dbPromise = null;
        reject(err);
      }
      resetWatchdog(8000);
      req.onupgradeneeded = function () {
        resetWatchdog(15000);
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = function () {
        var db = req.result;
        if (settled) { db.close(); return; }
        settled = true;
        if (watchdog) { clearTimeout(watchdog); watchdog = null; }`,
  "estado-idb WebKit open timeout watchdog"
);

// 5. docs/backup-scheduler.js & docs/sync-yjs.js — non-destructive RAM hygiene (5s blob revoke + 2500ms ckpt restored)
replaceExact(
  "docs/backup-scheduler.js",
  `    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 300_000);`,
  `    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), soloAncla ? 5_000 : 60_000);`,
  "backup-scheduler 5s blob revoke"
);

replaceExact(
  "docs/backup-scheduler.js",
  `  async function prepararExportLocal() {
    if (_exportPreparando || yaExportadoHoy()) return;
    _exportPreparando = true;
    let info;
    try { info = await construirExportLocal(new Date()); }
    catch (_) { _exportPreparando = false; return; } // sin aviso: se reintenta en el proximo login
    document.addEventListener("pointerdown", function () {
      _exportPreparando = false;
      const now = Date.now();
      if (yaExportadoHoy(now)) return;
      try {
        // Record the 24h stamp BEFORE triggering the download so iOS Safari cannot re-trigger in the same session
        localStorage.setItem(LS_AUTOEXPORT, String(now));
        descargarArchivo(info.texto, info.nombre, true);
      } catch (_) {}
    }, { once: true, capture: true });
  }`,
  `  async function prepararExportLocal() {
    if (window.__f123CrashLoopPaused) return;
    if (_exportPreparando || yaExportadoHoy()) return;
    _exportPreparando = true;
    let info;
    try { info = await construirExportLocal(new Date()); }
    catch (_) { _exportPreparando = false; return; } // sin aviso: se reintenta en el proximo login
    document.addEventListener("pointerdown", function () {
      _exportPreparando = false;
      const now = Date.now();
      if (yaExportadoHoy(now) || !info) { info = null; return; }
      try {
        // Record the 24h stamp BEFORE triggering the download so iOS Safari cannot re-trigger in the same session
        localStorage.setItem(LS_AUTOEXPORT, String(now));
        descargarArchivo(info.texto, info.nombre, true);
      } catch (_) {}
      info = null;
    }, { once: true, capture: true });
  }`,
  "backup-scheduler release info after click"
);

replaceExact(
  "docs/sync-yjs.js",
  `    function hacerCkpt() {
      if (typeof window !== "undefined" && (window.__f123SafeBootMode || window.__f123CrashLoopPaused)) return; // C239: also runs outside a browser window`,
  `    function hacerCkpt() {
      if (typeof window !== "undefined" && window.__f123CrashLoopPaused) return;`,
  "sync-yjs hacerCkpt guard only CrashLoopPaused"
);

replaceExact(
  "docs/sync-yjs.js",
  `        if (permiteCkpt) { clearTimeout(_tCkpt); _tCkpt = setTimeout(hacerCkpt, _aparatoMovil() ? 12000 : 2500); }`,
  `        if (permiteCkpt) { clearTimeout(_tCkpt); _tCkpt = setTimeout(hacerCkpt, 2500); }`,
  "sync-yjs restore 2500ms checkpoint timing"
);

// 6. Regression test with LF line endings
writeRel(
  "test/p0-c242-safari-idb-watchdog-f123-namespace.test.cjs",
  `'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('C242: circuit breaker runs after aislamiento.js and exempts intentional SW reloads', () => {
  const html = fs.readFileSync('docs/index.html', 'utf8');
  const aisl = html.indexOf('<script src="./aislamiento.js"></script>');
  const brk = html.indexOf('f123_boot_crash_v1');
  assert.ok(aisl > 0 && brk > aisl, 'breaker must run after aislamiento.js so f123:: sessionStorage matches');
  assert.match(html, /f123_sw_reload_ts/);
  assert.doesNotMatch(html, /__f123SafeBootMode/);
  assert.doesNotMatch(html, /indexedDB\\.deleteDatabase|localStorage\\.clear\\(/);
});

test('C242: app-inline-03 stamps f123_sw_reload_ts and reenganchar clears both f123:: and raw latches', () => {
  const s = fs.readFileSync('src/app/app-inline-03.js', 'utf8');
  assert.match(s, /f123_sw_reload_ts/);
  const r = fs.readFileSync('docs/reenganchar.html', 'utf8');
  assert.ok(r.includes('sessionStorage.removeItem("f123::"+k)'));
  assert.doesNotMatch(r, /indexedDB\\.deleteDatabase|localStorage\\.clear|localStorage\\.removeItem/);
});

test('C242: estado-idb has WebKit open hang timeout and C199/sync-yjs preserve normal cadence', () => {
  const e = fs.readFileSync('docs/estado-idb.js', 'utf8');
  assert.match(e, /IndexedDB state open timed out/);
  const b = fs.readFileSync('docs/backup-scheduler.js', 'utf8');
  assert.ok(b.includes('soloAncla ? 5_000 : 60_000'));
  const y = fs.readFileSync('docs/sync-yjs.js', 'utf8');
  assert.ok(y.includes('setTimeout(hacerCkpt, 2500)'));
});
`
);

// 7. Seal release v0.9.12 / f123-shell-v912 / golden448 on top of 4a6d038f (v0.9.11)
replaceExact(
  "docs/sw.js",
  `const CACHE = "f123-shell-v911";`,
  `const CACHE = "f123-shell-v912";`,
  "sw.js bump CACHE v912"
);
replaceExact(
  "docs/sw.js",
  `const CACHE_GENERACION = "-golden447";`,
  `const CACHE_GENERACION = "-golden448";`,
  "sw.js bump golden448"
);
replaceExact(
  "docs/dashboard.html",
  `<meta name="dashboard-shell" content="f123-shell-v911">
<meta name="dashboard-release" content="v0.9.11">`,
  `<meta name="dashboard-shell" content="f123-shell-v912">
<meta name="dashboard-release" content="v0.9.12">`,
  "dashboard.html meta v0.9.12"
);
replaceExact(
  "docs/dashboard.html",
  `<span id="dashboard-version" style="font-size:14px;font-weight:700;color:#0F1923;">Dashboard v0.9.11</span>`,
  `<span id="dashboard-version" style="font-size:14px;font-weight:700;color:#0F1923;">Dashboard v0.9.12</span>`,
  "dashboard.html header v0.9.12"
);
writeRel(
  "docs/version.json",
  JSON.stringify(
    {
      version: "v0.9.12",
      fecha: "2026-11-23",
      changelog: "v0.9.12 C242: cierre final sin recortes sobre C239/C240/C241: circuit-breaker bajo prefijo f123:: con exencion de recarga SW, watchdog 8s/15s en indexedDB.open() de estado-idb, limpieza f123:: en reenganchar, blobs 5s y checkpoint 2500ms.",
      requerida: false,
      shell: "f123-shell-v912",
      apagar: [],
      releaseName: "v0.9.12",
      cacheGeneration: "golden448"
    },
    null,
    2
  ) + "\n"
);

cp.execFileSync(process.execPath, ["scripts/build-app-entry.cjs"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-min-scripts.cjs"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/gen-manifest.js"], { cwd: targetRoot, stdio: "inherit" });

console.log("C242 applied, minified & manifest-sealed (v0.9.12 / f123-shell-v912 / golden448) on:", targetRoot);
