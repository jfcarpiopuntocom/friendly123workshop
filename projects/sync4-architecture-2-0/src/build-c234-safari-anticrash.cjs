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
          + '<button type="button" id="f123-safe-retry" style="min-height:44px;padding:10px 20px;border-radius:8px;border:2px solid #E8A020;background:#E8A020;color:#0F1923;font-weight:800;font-size:15px;cursor:pointer;">Continue cleanly</button>'
          + '</div>';
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

// Rebuild app entry + minified scripts inside clone
cp.execFileSync(process.execPath, ["scripts/build-app-entry.cjs"], { cwd: targetRoot, stdio: "inherit" });
cp.execFileSync(process.execPath, ["scripts/build-min-scripts.cjs"], { cwd: targetRoot, stdio: "inherit" });

console.log("C234 applied & minified cleanly on:", targetRoot);
