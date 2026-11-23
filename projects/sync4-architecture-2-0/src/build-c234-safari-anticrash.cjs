#!/usr/bin/env node
"use strict";

/**
 * C234 Safari iPhone Anti-Crash, Reset Circuit Breaker & Commissions UI 1.0 Completion Kit
 * Base: origin/master 2a9303dca99a32c062f48bd5a72a0109595b9b76
 *
 * Fixes verified directly in WebKit + source audit:
 * 1. docs/index.html: non-destructive iOS Safari/PWA startup crash-loop circuit breaker
 *    (sessionStorage 12s window, never deletes IDB/localStorage; at >=2 rapid crashes enters
 *    window.__f123SafeBootMode=true; at >=3 pauses heavy auto-boot with clean Retry button).
 * 2. docs/backup-scheduler.js: stagger mobile auto-export from 3s to 15s, skip in SafeBootMode,
 *    avoid firing <a download href="blob:..."> inside iOS standalone PWA pointerdown capture
 *    (which navigates/resets standalone PWAs), release info=null immediately, revoke silent
 *    blob URLs in 5s instead of 300s (keeping C224/C199 test contract verbatim).
 * 3. docs/vista-perchas.js, docs/expense-receipt.js, docs/idb-fotos.js, src/app/app-inline-01.js:
 *    explicitly clear Image handlers/src + zero canvas.width=0;canvas.height=0 in finally so WebKit
 *    releases IOSurface GPU memory immediately instead of Jetsam-crashing; reuse single canvas
 *    across vista-perchas attempts; safely revoke barcode PNG URL after 1500ms.
 * 4. docs/sync-yjs.js: chunked _b64() (zero 1.5M char-by-char string concat), stagger mobile
 *    hacerCkpt() from 2.5s to 12s, skip ckpt when window.__f123SafeBootMode===true.
 * 5. src/app/app-inline-01.js + docs/commissions-by-person.js:
 *    - v0.9.04 gap fix: resumenComisionesGlobalHtml now actually renders group==="total" (RAW)
 *      when all view buttons are toggled OFF, capped at 80 initial rows + "Show more sales".
 *    - v0.9.05 gap fix: resumenComisionesGlobalHtml renders window.flechaComisionHtml outside
 *      <summary> on every product card in All-dates "By product" (previously dead in render()).
 *    - Avoid redundant double cargarComisiones() when toggling By artist / associate OFF.
 * 6. docs/sw.js: remove duplicate "./core/commission-history.js" from SHELL.
 * 7. cloudflare-relay-worker/src/priv-relay-core.mjs: align repo with live Cloudflare d24e8d2e
 *    (::limpio-2026-09-16 room derivation support) so future deploys do not regress live Sync4.
 */

const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");

const targetRoot = process.argv[2];
if (!targetRoot || !fs.existsSync(path.join(targetRoot, "src", "app", "app-inline-01.js"))) {
  console.error("Usage: node build-c234-safari-anticrash.cjs <path-to-friendly-123-clone>");
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

// 1. docs/index.html — non-destructive Safari / PWA boot crash-loop circuit breaker
replaceExact(
  "docs/index.html",
  `    clean.searchParams.delete("_purge");
    history.replaceState(history.state, "", clean.pathname + clean.search + clean.hash);
  } catch (_) { /* URL cleanup must never prevent app startup. */ }
})();
</script>`,
  `    clean.searchParams.delete("_purge");
    history.replaceState(history.state, "", clean.pathname + clean.search + clean.hash);
  } catch (_) { /* URL cleanup must never prevent app startup. */ }
})();
</script>
<script>
// C234 Safari / iOS PWA non-destructive crash-loop circuit breaker (never deletes IDB/localStorage).
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
</script>`,
  "crash-loop circuit breaker in docs/index.html"
);

// 2. docs/backup-scheduler.js — Safari / iOS standalone PWA blob & memory guards
replaceExact(
  "docs/backup-scheduler.js",
  `  function descargarArchivo(texto, nombre, soloAncla) {
    const blob = new Blob([texto], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    try { a.click(); } catch (_) { if (!soloAncla) { try { window.open(url, "_blank"); } catch (_) {} } }
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 300_000);
  }`,
  `  function _esAppStandalone() {
    try {
      return !!(window.navigator && window.navigator.standalone === true) ||
        !!(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    } catch (_) { return false; }
  }
  function _esSafariMovil() {
    try {
      const ua = String((navigator && navigator.userAgent) || "");
      return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && Number(navigator.maxTouchPoints) > 1);
    } catch (_) { return false; }
  }
  function descargarArchivo(texto, nombre, soloAncla) {
    // Inside iOS standalone PWA, clicking an invisible <a download href="blob:..."> can navigate
    // the entire standalone WebView onto the blob URL and reset/lose app context. Keep manual
    // Advanced -> Export backup untouched; skip silent background anchor navigation in standalone iOS.
    if (soloAncla && _esAppStandalone() && _esSafariMovil()) return;
    const blob = new Blob([texto], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    try { a.click(); } catch (_) { if (!soloAncla) { try { window.open(url, "_blank"); } catch (_) {} } }
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), soloAncla ? 5_000 : 60_000);
  }`,
  "descargarArchivo iOS PWA and blob lifetime guard"
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
  }
  window.addEventListener("oc-login", function (ev) {
    try {
      const d = ev && ev.detail;
      if (!d || d.demo === true) return;
      if (window.OCAuth && window.OCAuth.esDemo && window.OCAuth.esDemo()) return;
      // Espera 3 s para no competir con el primer render despues del PIN.
      setTimeout(prepararExportLocal, 3000);
    } catch (_) {}
  });`,
  `  async function prepararExportLocal() {
    if (window.__f123SafeBootMode || window.__f123CrashLoopPaused) return;
    if (_exportPreparando || yaExportadoHoy()) return;
    if (_esAppStandalone() && _esSafariMovil()) return;
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
  }
  window.addEventListener("oc-login", function (ev) {
    try {
      if (window.__f123SafeBootMode || window.__f123CrashLoopPaused) return;
      const d = ev && ev.detail;
      if (!d || d.demo === true) return;
      if (window.OCAuth && window.OCAuth.esDemo && window.OCAuth.esDemo()) return;
      // Stagger on mobile Safari so auto-export never overlaps Yjs/Sync4 boot hydration peak RAM.
      setTimeout(prepararExportLocal, _esSafariMovil() ? 15000 : 3000);
    } catch (_) {}
  });`,
  "prepararExportLocal stagger + RAM release"
);

// 3. Canvas GPU / Image memory releases (Jetsam anti-OOM guards)
replaceExact(
  "docs/vista-perchas.js",
  `  function redimensionar(file, cb) {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const intentos = [[1400, 0.82], [1200, 0.8], [1000, 0.75], [820, 0.7], [640, 0.62]];
      let canvasElegido = null, jpegCalidadElegida = null;
      const rend = (lado, q) => {
        const escala = Math.min(1, lado / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(img.width * escala);
        cv.height = Math.round(img.height * escala);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        canvasElegido = cv; jpegCalidadElegida = q;
        return cv.toDataURL('image/jpeg', q);
      };
      let out = rend(intentos[0][0], intentos[0][1]);
      for (let i = 1; i < intentos.length && out.length > FOTO_BYTES_MAX; i++) out = rend(intentos[i][0], intentos[i][1]);
      // Piso duro (fix A, 2026-09-10): si una imagen rarísima sigue pasada tras el
      // paso más chico, un último recurso que SIEMPRE cabe en el frame del relay.
      if (out.length > FOTO_BYTES_MAX) out = rend(480, 0.5);
      // Compress NEW captures from the SAME pixels, never rewrite an old photo.
      // High-fidelity WebP aims at half the JPEG bytes; unsupported encoders
      // keep the original tested JPEG and its existing relay-size fallback.
      if (window.OCFotos && typeof window.OCFotos.optimizarCapturaFoto === 'function') {
        try { out = window.OCFotos.optimizarCapturaFoto(canvasElegido, out, FOTO_BYTES_MAX, {jpegQuality:jpegCalidadElegida, jpegFloor:0.72}); }
        catch (_) { /* JPEG fallback is already complete. */ }
      }
      cb(out);
    };
    img.src = URL.createObjectURL(file);
  }`,
  `  function redimensionar(file, cb) {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onerror = () => {
      try { URL.revokeObjectURL(objUrl); } catch (_) {}
      img.onload = img.onerror = null; img.src = '';
    };
    img.onload = () => {
      try { URL.revokeObjectURL(objUrl); } catch (_) {}
      const intentos = [[1400, 0.82], [1200, 0.8], [1000, 0.75], [820, 0.7], [640, 0.62]];
      const cv = document.createElement('canvas');
      let jpegCalidadElegida = null, out = '';
      try {
        const rend = (lado, q) => {
          const escala = Math.min(1, lado / Math.max(img.width, img.height));
          cv.width = Math.max(1, Math.round(img.width * escala));
          cv.height = Math.max(1, Math.round(img.height * escala));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          jpegCalidadElegida = q;
          return cv.toDataURL('image/jpeg', q);
        };
        out = rend(intentos[0][0], intentos[0][1]);
        for (let i = 1; i < intentos.length && out.length > FOTO_BYTES_MAX; i++) out = rend(intentos[i][0], intentos[i][1]);
        // Piso duro (fix A, 2026-09-10): si una imagen rarísima sigue pasada tras el
        // paso más chico, un último recurso que SIEMPRE cabe en el frame del relay.
        if (out.length > FOTO_BYTES_MAX) out = rend(480, 0.5);
        // Compress NEW captures from the SAME pixels, never rewrite an old photo.
        // High-fidelity WebP aims at half the JPEG bytes; unsupported encoders
        // keep the original tested JPEG and its existing relay-size fallback.
        if (window.OCFotos && typeof window.OCFotos.optimizarCapturaFoto === 'function') {
          try { out = window.OCFotos.optimizarCapturaFoto(cv, out, FOTO_BYTES_MAX, {jpegQuality:jpegCalidadElegida, jpegFloor:0.72}); }
          catch (_) { /* JPEG fallback is already complete. */ }
        }
      } finally {
        cv.width = 0; cv.height = 0;
        img.onload = img.onerror = null; img.src = '';
      }
      cb(out);
    };
    img.src = objUrl;
  }`,
  "vista-perchas canvas GPU cleanup"
);

replaceExact(
  "docs/expense-receipt.js",
  `    const url = URL.createObjectURL(file);
    let data, canvas, jpegCalidadElegida = null;
    try {
      const img = new Image();
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });`,
  `    const url = URL.createObjectURL(file);
    let data, canvas, img, jpegCalidadElegida = null;
    try {
      img = new Image();
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });`,
  "expense-receipt img hoist"
);

replaceExact(
  "docs/expense-receipt.js",
  `    if (typeof window.OCFotos.optimizarCapturaFoto === 'function') {
      try { data = window.OCFotos.optimizarCapturaFoto(canvas, data, 180000, {jpegQuality:jpegCalidadElegida, jpegFloor:0.77}); }
      catch (_) { /* Existing readable receipt JPEG remains unchanged. */ }
    }
    const hash = await OCFotos.hashDeDataUrl(data);`,
  `    try {
      if (typeof window.OCFotos.optimizarCapturaFoto === 'function') {
        try { data = window.OCFotos.optimizarCapturaFoto(canvas, data, 180000, {jpegQuality:jpegCalidadElegida, jpegFloor:0.77}); }
        catch (_) { /* Existing readable receipt JPEG remains unchanged. */ }
      }
    } finally {
      if (canvas) { canvas.width = 0; canvas.height = 0; canvas = null; }
      if (img) { img.onload = img.onerror = null; img.src = ''; img = null; }
    }
    const hash = await OCFotos.hashDeDataUrl(data);`,
  "expense-receipt canvas GPU cleanup"
);

replaceExact(
  "docs/idb-fotos.js",
  `            const esc = Math.min(1, MINIATURA_LADO / Math.max(img.width, img.height));
            const cv = document.createElement("canvas");
            cv.width = Math.max(1, Math.round(img.width * esc)); cv.height = Math.max(1, Math.round(img.height * esc));
            cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
            let out = cv.toDataURL("image/webp", MINIATURA_CALIDAD);
            if (!/^data:image\\/webp;base64,/.test(out)) out = cv.toDataURL("image/jpeg", MINIATURA_CALIDAD);
            resolve(/^data:image\\/(webp|jpeg);base64,/.test(out) ? out : null);
          } catch (_) { resolve(null); }`,
  `            const esc = Math.min(1, MINIATURA_LADO / Math.max(img.width, img.height));
            const cv = document.createElement("canvas");
            try {
              cv.width = Math.max(1, Math.round(img.width * esc)); cv.height = Math.max(1, Math.round(img.height * esc));
              cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
              let out = cv.toDataURL("image/webp", MINIATURA_CALIDAD);
              if (!/^data:image\\/webp;base64,/.test(out)) out = cv.toDataURL("image/jpeg", MINIATURA_CALIDAD);
              resolve(/^data:image\\/(webp|jpeg);base64,/.test(out) ? out : null);
            } finally {
              cv.width = 0; cv.height = 0;
              img.onload = img.onerror = null; img.src = "";
            }
          } catch (_) { resolve(null); }`,
  "idb-fotos crearMiniatura canvas cleanup"
);

replaceExact(
  "src/app/app-inline-01.js",
  `      const MAX = 320, esc = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(urlTemporal);
      const d = c.toDataURL("image/jpeg", 0.82);
      resolve(d.indexOf("data:image/") === 0 && d.length > 200 ? d : null);`,
  `      const MAX = 320, esc = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      try {
        c.width = Math.max(1, Math.round(img.width * esc)); c.height = Math.max(1, Math.round(img.height * esc));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(urlTemporal);
        const d = c.toDataURL("image/jpeg", 0.82);
        resolve(d.indexOf("data:image/") === 0 && d.length > 200 ? d : null);
      } finally {
        c.width = 0; c.height = 0;
        img.onload = img.onerror = null; img.src = "";
      }`,
  "app-inline-01 leerFotoRedimensionada canvas cleanup"
);

replaceExact(
  "src/app/app-inline-01.js",
  `    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = \`barcode-\${producto.sku || producto.barcode}.png\`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");`,
  `    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      canvas.width = 0; canvas.height = 0;
      img.onload = img.onerror = null; img.src = "";
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = \`barcode-\${producto.sku || producto.barcode}.png\`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 1500);
    }, "image/png");`,
  "app-inline-01 guardarBarcodeComoImagen cleanup"
);

// 4. docs/sync-yjs.js — chunked _b64 + mobile ckpt stagger + SafeBootMode check
replaceExact(
  "docs/sync-yjs.js",
  `    function _b64(buf) { var u = new Uint8Array(buf), s = ""; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }`,
  `    function _b64(buf) { var u = new Uint8Array(buf), parts = []; for (var i = 0; i < u.length; i += 16384) parts.push(String.fromCharCode.apply(null, u.subarray(i, i + 16384))); return btoa(parts.join("")); }`,
  "sync-yjs chunked _b64"
);

replaceExact(
  "docs/sync-yjs.js",
  `    function hacerCkpt() {
      // v756: internal log of WHY a checkpoint is skipped (read-only mirror of the guards below; behaviour unchanged).`,
  `    function hacerCkpt() {
      if (window.__f123SafeBootMode || window.__f123CrashLoopPaused) return;
      // v756: internal log of WHY a checkpoint is skipped (read-only mirror of the guards below; behaviour unchanged).`,
  "sync-yjs hacerCkpt safe-boot guard"
);

replaceExact(
  "docs/sync-yjs.js",
  `        if (permiteCkpt) { clearTimeout(_tCkpt); _tCkpt = setTimeout(hacerCkpt, 2500); }`,
  `        if (permiteCkpt) { clearTimeout(_tCkpt); _tCkpt = setTimeout(hacerCkpt, _aparatoMovil() ? 12000 : 2500); }`,
  "sync-yjs mobile hacerCkpt boot stagger"
);

// 5. Commissions v0.9.04 (RAW "total") + v0.9.05 (live causal arrow in All-dates By product)
replaceExact(
  "src/app/app-inline-01.js",
  `  const es=document.documentElement.lang==="es";
  const group=["producto","percha","cliente","comisionista","mes"].includes(window._ocComHistoryGroup)
    ?window._ocComHistoryGroup:"producto";
  const view=window.OCCommissionHistory.project({sales:sales,group:group,lang:es?"es":"en"});
  const totals=view.totals;
  const money=(v,unknown)=>unknown||v===null||!Number.isFinite(v)?(es?"Por verificar":"Needs review"):fmtMoney(v);
  const tile=(name,value)=>'<div class="tag-card ventana-estado" style="padding:10px 12px;margin:0;text-align:left;box-shadow:none;">'
    +'<div class="rotulo">'+name+'</div>'
    +'<div class="cifra">'+value+'</div></div>';
  const titles={producto:es?"Por producto":"By product",percha:es?"Por percha / evento":"By rack / event",
    cliente:es?"Por cliente":"By customer",comisionista:es?"Por comisionista":"By associate",
    mes:es?"Por período":"By period"};
  const warnings=(totals.conflicts||totals.splitConflicts||totals.customerConflicts||totals.associateConflicts)
    ?'<p role="alert" style="font-size:14px;color:var(--rojo-ink,#a3392a);margin:8px 0;">'
      +(es?"Hay recibos o repartos por verificar.":"Some receipts or allocations need review.")+'</p>':"";
  // C194: the old loop filtered EVERY sale once per group (O(sales × groups))
  // and eagerly instantiated every receipt node inside closed <details>.
  // Safari could be killed by the CPU/memory spike a few seconds after entry.
  // Index exactly once; keep every historical receipt available on demand.
  const byGroup=new Map();
  view.rows.forEach(function(v){
    let entries=byGroup.get(v.group);
    if(!entries){entries=[];byGroup.set(v.group,entries);}
    entries.push(v);
  });
  window._ocComHistoryRowsPorGrupo=byGroup;
  const cards=view.groups.map(function(g){
    const associated=group==="comisionista";
    const period=group==="mes"&&/^\\d{4}-(0[1-9]|1[0-2])$/.test(String(g.id))?
      '<button type="button" data-commissions-open-month="'+escHtml(g.id)+'" onclick="cambiarMesComisiones(this.dataset.commissionsOpenMonth)"'
        +' class="tecla" style="min-height:44px;padding:6px 10px;margin-top:6px;">'
        +(es?"Liquidar este mes":"Settle this month")+'</button>':"";
    return '<details data-comm-history-group data-comm-group="'+escHtml(g.id)+'" ontoggle="if(this.open)mostrarDetalleComisiones(this,false)" class="tag-card" style="text-align:left;padding:12px 16px;margin:0 0 10px;">'
      +'<summary style="cursor:pointer;min-height:44px;">'
      +'<strong style="display:block;font-size:16px;color:var(--ink);">'+escHtml(g.label)+'</strong>'
      +'<div class="stats" style="margin-top:8px;">'
      +(associated?'':'<div><div class="rotulo">'+(es?"Ventas brutas":"Gross sales")
        +'</div><div class="cifra">'+money(g.gross,g.unknownGross)+'</div></div>')
      +'<div><div class="rotulo">'+(es?"Comisiones":"Commissions")+'</div><div class="cifra">'
        +money(g.commission,g.unknownCommission)+'</div></div></div>'
      +'<span style="font-size:13px;color:var(--ink-soft);">'+g.count+' '+(es?"ventas":"sales")+'</span>'
      +'</summary><div data-comm-details data-loaded="0" style="padding-top:8px;"></div>'
      +'<button type="button" data-comm-history-more hidden onclick="event.stopPropagation();mostrarDetalleComisiones(this.closest(\\'details\\'),true)" class="tecla" style="min-height:44px;margin-top:8px;">'
      +(es?"Mostrar más ventas":"Show more sales")+'</button>'+period+'</details>';
  }).join("");`,
  `  const es=document.documentElement.lang==="es";
  const group=window._ocComHistoryGroup==="total"?"total":
    (["producto","percha","cliente","comisionista","mes"].includes(window._ocComHistoryGroup)
      ?window._ocComHistoryGroup:"producto");
  const view=window.OCCommissionHistory.project({sales:sales,group:group,lang:es?"es":"en"});
  const totals=view.totals;
  const money=(v,unknown)=>unknown||v===null||!Number.isFinite(v)?(es?"Por verificar":"Needs review"):fmtMoney(v);
  const tile=(name,value)=>'<div class="tag-card ventana-estado" style="padding:10px 12px;margin:0;text-align:left;box-shadow:none;">'
    +'<div class="rotulo">'+name+'</div>'
    +'<div class="cifra">'+value+'</div></div>';
  const titles={total:es?"Todo el historial (RAW)":"All sales (RAW)",producto:es?"Por producto":"By product",percha:es?"Por percha / evento":"By rack / event",
    cliente:es?"Por cliente":"By customer",comisionista:es?"Por comisionista":"By associate",
    mes:es?"Por período":"By period"};
  const warnings=(totals.conflicts||totals.splitConflicts||totals.customerConflicts||totals.associateConflicts)
    ?'<p role="alert" style="font-size:14px;color:var(--rojo-ink,#a3392a);margin:8px 0;">'
      +(es?"Hay recibos o repartos por verificar.":"Some receipts or allocations need review.")+'</p>':"";
  // C194: the old loop filtered EVERY sale once per group (O(sales × groups))
  // and eagerly instantiated every receipt node inside closed <details>.
  // Safari could be killed by the CPU/memory spike a few seconds after entry.
  // Index exactly once; keep every historical receipt available on demand.
  const byGroup=new Map();
  view.rows.forEach(function(v){
    let entries=byGroup.get(v.group);
    if(!entries){entries=[];byGroup.set(v.group,entries);}
    entries.push(v);
  });
  window._ocComHistoryRowsPorGrupo=byGroup;
  const cards=view.groups.map(function(g){
    const associated=group==="comisionista";
    const isRaw=group==="total";
    const rawRows=isRaw?(byGroup.get(g.id)||[]):[];
    const initialRaw=isRaw?rawRows.slice(0,80):[];
    const initialHtml=initialRaw.map(function(v){
      return '<div style="padding:6px 0;border-top:1px solid var(--hairline,#E8ECF2);font-size:13px;display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;">'
        +'<span>'+escHtml(v.day||v.id||"")+'</span>'
        +'<span>'+money(v.commission,false)+'</span></div>';
    }).join("");
    const period=group==="mes"&&/^\\d{4}-(0[1-9]|1[0-2])$/.test(String(g.id))?
      '<button type="button" data-commissions-open-month="'+escHtml(g.id)+'" onclick="cambiarMesComisiones(this.dataset.commissionsOpenMonth)"'
        +' class="tecla" style="min-height:44px;padding:6px 10px;margin-top:6px;">'
        +(es?"Liquidar este mes":"Settle this month")+'</button>':"";
    // C227/C234: render causal arrow outside <summary> in All-dates "By product" so Safari taps turn direction without toggling details.
    const flecha=group==="producto"&&g.productoId&&typeof window.flechaComisionHtml==="function"
      ?'<div data-comm-flecha style="margin-top:6px;">'+window.flechaComisionHtml("",g.direccion||"casaPaga",g.productoId,g.label)+'</div>':"";
    return '<details'+(isRaw?' open':'')+' data-comm-history-group data-comm-group="'+escHtml(g.id)+'" ontoggle="if(this.open)mostrarDetalleComisiones(this,false)" class="tag-card" style="text-align:left;padding:12px 16px;margin:0 0 10px;">'
      +'<summary style="cursor:pointer;min-height:44px;">'
      +'<strong style="display:block;font-size:16px;color:var(--ink);">'+escHtml(g.label)+'</strong>'
      +'<div class="stats" style="margin-top:8px;">'
      +(associated?'':'<div><div class="rotulo">'+(es?"Ventas brutas":"Gross sales")
        +'</div><div class="cifra">'+money(g.gross,g.unknownGross)+'</div></div>')
      +'<div><div class="rotulo">'+(es?"Comisiones":"Commissions")+'</div><div class="cifra">'
        +money(g.commission,g.unknownCommission)+'</div></div></div>'
      +'<span style="font-size:13px;color:var(--ink-soft);">'+g.count+' '+(es?"ventas":"sales")+'</span>'
      +'</summary><div data-comm-details data-loaded="'+initialRaw.length+'" style="padding-top:8px;">'+initialHtml+'</div>'
      +'<button type="button" data-comm-history-more'+((isRaw&&rawRows.length>initialRaw.length)?'':' hidden')+' onclick="event.stopPropagation();mostrarDetalleComisiones(this.closest(\\'details\\'),true)" class="tecla" style="min-height:44px;margin-top:8px;">'
      +(es?"Mostrar más ventas":"Show more sales")+'</button>'+flecha+period+'</details>';
  }).join("");`,
  "app-inline-01 resumenComisionesGlobalHtml RAW + causal arrow"
);

// 6. docs/sw.js — remove duplicate "./core/commission-history.js"
replaceExact(
  "docs/sw.js",
  `  "./core/commission-history.js",
  "./core/business-read-model.js",
  "./core/commission-history.js",`,
  `  "./core/commission-history.js",
  "./core/business-read-model.js",`,
  "sw.js deduplicate commission-history.js"
);

// 7. cloudflare-relay-worker/src/priv-relay-core.mjs — align repo with live d24e8d2e ::limpio-2026-09-16 support
replaceExact(
  "cloudflare-relay-worker/src/priv-relay-core.mjs",
  `export async function legacyRoomHexForLicense(licenseCode) {
  const norm = String(licenseCode || '').trim().toUpperCase();
  if (!LICENSE_RE.test(norm)) throw new Error('invalid-license');
  const hash = await crypto.subtle.digest('SHA-256', ENC.encode('amigable-sala:' + norm));
  return toHex(hash).slice(0, 40);
}`,
  `export async function legacyRoomHexForLicense(licenseCode) {
  const norm = String(licenseCode || '').trim().toUpperCase();
  if (!LICENSE_RE.test(norm)) throw new Error('invalid-license');
  const hash = await crypto.subtle.digest('SHA-256', ENC.encode('amigable-sala:' + norm));
  return toHex(hash).slice(0, 40);
}

export async function legacyCleanRoomHexForLicense(licenseCode) {
  const norm = String(licenseCode || '').trim().toUpperCase();
  if (!LICENSE_RE.test(norm)) throw new Error('invalid-license');
  const hash = await crypto.subtle.digest('SHA-256', ENC.encode('amigable-sala:' + norm + '::limpio-2026-09-16'));
  return toHex(hash).slice(0, 40);
}`,
  "priv-relay-core legacyCleanRoomHexForLicense"
);

replaceExact(
  "cloudflare-relay-worker/src/priv-relay-core.mjs",
  `  const expected40 = await legacyRoomHexForLicense(lic);
  if (m[1] !== expected40) {
    return { ok: false, status: 403, reason: 'room-license-mismatch' };
  }`,
  `  const expected40 = await legacyRoomHexForLicense(lic);
  const expectedClean40 = await legacyCleanRoomHexForLicense(lic);
  if (m[1] !== expected40 && m[1] !== expectedClean40) {
    return { ok: false, status: 403, reason: 'room-license-mismatch' };
  }`,
  "priv-relay-core accept clean room hex"
);

// 8. src/app/app-inline-03.js — fix dead _recargarSeguroVersion() + C168 getRegistrations() + waiting/installing SW adoption
replaceExact(
  "src/app/app-inline-03.js",
  `function _recargarSeguroVersion() {
  /* JFC 2026-09-04: nunca recargar mid-uso. Se difiere SIEMPRE al próximo login
     (invisible). Antes recargaba de golpe fuera del candado y reiniciaba la UI
     del usuario mientras trabajaba. */
  try { sessionStorage.setItem("f123_reload_al_entrar", "1"); } catch (_) {}
}`,
  `function _recargarSeguroVersion() {
  /* JFC 2026-09-04 / C234: never reload inside active work, ONLY queue adoption for PIN
     by setting BOTH legacy key and active KP ("f123_act_sola_pendiente") so Safari adopts on PIN. */
  try { sessionStorage.setItem("f123_reload_al_entrar", "1"); } catch (_) {}
  try { sessionStorage.setItem("f123_act_sola_pendiente", "1"); } catch (_) {}
  try { if (window._ocActSola && typeof window._ocActSola.intentar === "function") window._ocActSola.intentar(); } catch (_) {}
}`,
  "app-inline-03 _recargarSeguroVersion sets active KP and calls intentar"
);

replaceExact(
  "src/app/app-inline-03.js",
  `      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) { await reg.update(); if (reg.waiting) reg.waiting.postMessage({ tipo: "skip-waiting" }); }
      } catch (_) {}`,
  `      try {
        const regs = typeof navigator.serviceWorker.getRegistrations === "function"
          ? await navigator.serviceWorker.getRegistrations()
          : (await navigator.serviceWorker.getRegistration() ? [await navigator.serviceWorker.getRegistration()] : []);
        for (const g of regs) {
          if (!g) continue;
          if (typeof g.addEventListener === "function" && !g._ocUpdateWired) {
            g._ocUpdateWired = true;
            g.addEventListener("updatefound", () => {
              const sw = g.installing;
              if (!sw) return;
              sw.addEventListener("statechange", () => {
                if (sw.state === "installed" && g.waiting) { try { g.waiting.postMessage({ tipo: "skip-waiting" }); } catch (_) {} }
                if (sw.state === "activated") onShellTomado();
              });
            });
          }
          await g.update();
          if (g.waiting) g.waiting.postMessage({ tipo: "skip-waiting" });
          if (g.installing && !g.installing._ocStateWired) {
            g.installing._ocStateWired = true;
            g.installing.addEventListener("statechange", function () {
              if (this.state === "installed" && g.waiting) { try { g.waiting.postMessage({ tipo: "skip-waiting" }); } catch (_) {} }
              if (this.state === "activated") onShellTomado();
            });
          }
        }
      } catch (_) {}`,
  "app-inline-03 revisar updates all registrations and listens to installing->activated"
);

// 9. docs/reenganchar.html — stronger than 15-30d ago: busts Safari max-age=600 HTTP cache for core scripts & clears crash latches
replaceExact(
  "docs/reenganchar.html",
  `  async function releaseOldShell(){
    // Verify the newest shell is reachable before retiring any offline copy.
    const response=await deadline(fetch("./version.json?rescue="+Date.now(),{cache:"no-store"}),6000);
    if(!response || !response.ok)throw new Error("sin red");
    const version=await deadline(response.json(),5000);
    if(!version || !version.shell)throw new Error("versión no comprobada");
    if("serviceWorker" in navigator){
      try{
        var regs=await deadline(navigator.serviceWorker.getRegistrations(),5000);
        for(var i=0;i<regs.length;i++){
          if(belongs(regs[i].scope))try{await deadline(regs[i].unregister(),5000);}catch(_){}
        }
      }catch(_){}
    }
    if("caches" in window){
      try{
        var names=await deadline(caches.keys(),5000);
        for(var j=0;j<names.length;j++){
          if(/^f123-shell-v\\d+(?:-|$)/.test(names[j]))
            try{await deadline(caches.delete(names[j]),5000);}catch(_){}
        }
      }catch(_){}
    }
  }`,
  `  async function releaseOldShell(){
    // 1) Verify the newest shell is reachable before retiring any offline copy (zero data deleted).
    status.textContent="1/4 Comprobando la versión más reciente…";
    const response=await deadline(fetch("./version.json?rescue="+Date.now(),{cache:"no-store"}),6000);
    if(!response || !response.ok)throw new Error("sin red");
    const version=await deadline(response.json(),5000);
    if(!version || !version.shell)throw new Error("versión no comprobada");
    // 2) Retire only friendly-123 Service Workers & shell caches (PRIME DIRECTIVE 1: never touch IDB/localStorage).
    status.textContent="2/4 Retirando motor anterior…";
    if("serviceWorker" in navigator){
      try{
        var regs=await deadline(navigator.serviceWorker.getRegistrations(),5000);
        for(var i=0;i<regs.length;i++){
          if(belongs(regs[i].scope))try{await deadline(regs[i].unregister(),5000);}catch(_){}
        }
      }catch(_){}
    }
    if("caches" in window){
      try{
        var names=await deadline(caches.keys(),5000);
        for(var j=0;j<names.length;j++){
          if(/^f123-shell-v\\d+(?:-|$)/.test(names[j]))
            try{await deadline(caches.delete(names[j]),5000);}catch(_){}
        }
      }catch(_){}
    }
    // 3) Bypass Safari max-age=600 HTTP disk cache on core scripts before reloading ./?_purge=
    status.textContent="3/4 Descargando archivos frescos ("+String(version.version||version.shell)+")…";
    var coreAssets=["./","./index.html","./sw.js","./aislamiento.js","./estado-ab.min.js","./estado-idb.min.js","./mock-backend.min.js","./auth-ui.min.js","./sync-yjs.min.js","./backup-scheduler.min.js","./app-inline-01.min.js","./app-inline-03.min.js","./core/commission-history.js","./commissions-by-person.js"];
    try{
      var q=coreAssets.slice(),w=[];
      for(var k=0;k<3;k++)w.push((async function(){while(q.length){var u=q.shift();try{await deadline(fetch(u,{cache:"reload"}),2200);}catch(_){}}})());
      await deadline(Promise.allSettled(w),3600);
    }catch(_){}
    // 4) Clear transient boot/crash latches so re-engagement lands cleanly on the newest version.
    try{
      sessionStorage.removeItem("f123_boot_crash_v1");
      sessionStorage.removeItem("f123_act_sola_pendiente");
      sessionStorage.removeItem("f123_autorecarga");
      sessionStorage.removeItem("f123_reload_al_entrar");
      sessionStorage.removeItem("f123_update_frenada_desde");
    }catch(_){}
    status.textContent="4/4 Abriendo "+String(version.version||version.shell)+"…";
  }`,
  "docs/reenganchar.html 4-stage HTTP cache buster + crash latch reset"
);

// 10. src/app/app-inline-01.js — Sold (cargarVentasSold): stop mounting 200+ <option> per sale row (lazy populate on edit) & cap initial rows cleanly on huge histories
replaceExact(
  "src/app/app-inline-01.js",
  `  const _esVS = !!(window.OCI18n && window.OCI18n.getLang && window.OCI18n.getLang() === "es");
  const _tx = (en, es) => _esVS ? es : en;
  cont.innerHTML = rows.map((v) => {`,
  `  const _esVS = !!(window.OCI18n && window.OCI18n.getLang && window.OCI18n.getLang() === "es");
  const _tx = (en, es) => _esVS ? es : en;
  const _opcionCliInicial = (v) => v.clienteId
    ? \`<option value="\${escHtml(v.clienteId)}" selected>\${escHtml(v.clienteNombre || v.clienteId)}</option>\`
    : \`<option value="" selected>\${escHtml(t("sold.noCustomer"))}</option>\`;
  const _poblarClientesFila = (row, v) => {
    const sel = row && row.querySelector(".vs-cliente");
    if (!sel || sel.dataset.ocPopulated === "1") return;
    const prev = sel.value || (v && v.clienteId) || "";
    sel.innerHTML = _opcionesCliente(Object.assign({}, v || {}, { clienteId: prev }));
    sel.value = prev;
    sel.dataset.ocPopulated = "1";
  };
  const _renderFilaVS = (v) => {`,
  "app-inline-01 cargarVentasSold _renderFilaVS header"
);

replaceExact(
  "src/app/app-inline-01.js",
  `style="width:100%;padding:6px;border:2px solid var(--azul-medio);border-radius:4px;">\${_opcionesCliente(v)}</select></label>`,
  `style="width:100%;padding:6px;border:2px solid var(--azul-medio);border-radius:4px;">\${_opcionCliInicial(v)}</select></label>`,
  "app-inline-01 cargarVentasSold lazy option initial"
);

replaceExact(
  "src/app/app-inline-01.js",
  `  }).join("");
  // JFC 2026-09-23: "abajo de Sold puede todas las ventas" -> resumen por producto`,
  `  };
  const _vsLimitInicial = 120;
  let _vsMontadas = Math.min(rows.length, _vsLimitInicial);
  cont.innerHTML = rows.slice(0, _vsMontadas).map(_renderFilaVS).join("") +
    (rows.length > _vsMontadas ? \`<div id="oc-vs-more-wrap" style="margin:8px 0 12px;"><button type="button" id="oc-vs-show-more" class="tecla" style="min-height:44px;">\${_tx("Show more sales","Mostrar más ventas")} (\${rows.length - _vsMontadas})</button></div>\` : "");
  // JFC 2026-09-23: "abajo de Sold puede todas las ventas" -> resumen por producto`,
  "app-inline-01 cargarVentasSold bounded initial slice"
);

replaceExact(
  "src/app/app-inline-01.js",
  `  _aplicarFiltroVS(); // v506: la busqueda ya hecha arriba manda tambien sobre las tarjetas recien pintadas
  cont.querySelectorAll(".oc-vs-row").forEach((row) => {`,
  `  function _wireSoldRow(row) {
    if (!row || row.dataset.ocRowWired === "1") return;
    row.dataset.ocRowWired = "1";`,
  "app-inline-01 _wireSoldRow head"
);

replaceExact(
  "src/app/app-inline-01.js",
  `    if (btnEdit) btnEdit.addEventListener("click", () => { editor.style.display = editor.style.display === "none" ? "block" : "none"; });`,
  `    if (btnEdit) btnEdit.addEventListener("click", () => { _poblarClientesFila(row, rows.find(x => x.id === id)); editor.style.display = editor.style.display === "none" ? "block" : "none"; });`,
  "app-inline-01 populate client select lazily when Sold edit opens"
);

replaceExact(
  "src/app/app-inline-01.js",
  `        if (typeof cargarComisiones === "function") cargarComisiones();
      } catch (_) { await ocAlert("Could not reach the server."); }
    });
  });
}`,
  `        if (typeof cargarComisiones === "function") cargarComisiones();
      } catch (_) { await ocAlert("Could not reach the server."); }
    });
  }
  _aplicarFiltroVS();
  cont.querySelectorAll(".oc-vs-row").forEach(_wireSoldRow);
  const btnMoreVS = cont.querySelector("#oc-vs-show-more");
  if (btnMoreVS) {
    btnMoreVS.addEventListener("click", () => {
      const next = rows.slice(_vsMontadas, _vsMontadas + 80);
      if (!next.length) return;
      _vsMontadas += next.length;
      const wrap = cont.querySelector("#oc-vs-more-wrap");
      if (wrap) wrap.insertAdjacentHTML("beforebegin", next.map(_renderFilaVS).join(""));
      cont.querySelectorAll(".oc-vs-row").forEach(_wireSoldRow);
      _aplicarFiltroVS();
      if (_vsMontadas >= rows.length && wrap) wrap.remove();
      else btnMoreVS.textContent = _tx("Show more sales","Mostrar más ventas") + " (" + (rows.length - _vsMontadas) + ")";
    });
  }
}`,
  "app-inline-01 _wireSoldRow tail and Show more sales pagination"
);
// 11. Seal release v0.9.06 / f123-shell-v906 / golden442 cleanly
replaceExact(
  "docs/sw.js",
  `const CACHE = "f123-shell-v905";`,
  `const CACHE = "f123-shell-v906";`,
  "sw.js bump CACHE v906"
);
replaceExact(
  "docs/sw.js",
  `const CACHE_GENERACION = "-golden441";`,
  `const CACHE_GENERACION = "-golden442";`,
  "sw.js bump golden442"
);
replaceExact(
  "docs/dashboard.html",
  `<meta name="dashboard-shell" content="f123-shell-v905">
<meta name="dashboard-release" content="v0.9.05">`,
  `<meta name="dashboard-shell" content="f123-shell-v906">
<meta name="dashboard-release" content="v0.9.06">`,
  "dashboard.html meta v0.9.06"
);
replaceExact(
  "docs/dashboard.html",
  `<span id="dashboard-version" style="font-size:14px;font-weight:700;color:#0F1923;">Dashboard v0.9.05</span>`,
  `<span id="dashboard-version" style="font-size:14px;font-weight:700;color:#0F1923;">Dashboard v0.9.06</span>`,
  "dashboard.html header v0.9.06"
);
writeRel(
  "docs/version.json",
  JSON.stringify(
    {
      version: "v0.9.06",
      fecha: "2026-11-23",
      changelog: "v0.9.06 C234: guards anti-crasheo/reseteo Safari iOS/PWA, reenganchar con bust HTTP cache, adopcion automatica de SW/version en PIN, Sold acotado, y flecha causal + vista RAW en Commissions.",
      requerida: false,
      shell: "f123-shell-v906",
      apagar: [],
      releaseName: "v0.9.06",
      cacheGeneration: "golden442"
    },
    null,
    2
  ) + "\n"
);

// Rebuild app entry + minified scripts + deterministic manifest inside clone
cp.execFileSync(process.execPath, ["scripts/build-app-entry.cjs"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-min-scripts.cjs"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/gen-manifest.js"], { cwd: targetRoot, stdio: "inherit" });

console.log("C234 applied, minified & manifest-sealed (v0.9.06 / f123-shell-v906 / golden442) on:", targetRoot);
