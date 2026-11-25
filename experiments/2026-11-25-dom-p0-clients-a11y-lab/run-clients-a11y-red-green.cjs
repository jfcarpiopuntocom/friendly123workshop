'use strict';

/**
 * Engineering 2.0 / Ponytail RED -> GREEN Lab Proof (PARKING LOT POST-STABLE)
 * Target baseline: friendly-123 v0.9.27 (c3ec60e0b) — ZERO edits to product tree!
 *
 * Scope (IN SCOPE — strictly in-memory HTTP overlay during GREEN pass):
 *   1. src/app/app-inline-01.js:
 *      - Lazy-mount #oc-cliedit-${c.id} ONLY when panelEditAbierto === true
 *        (eliminates 15,600 hidden <option> nodes for 400 customers; zero visual change)
 *      - Pass tamanoLote: 40, debounceMs: 150 to AMG.ListaDinamica.crear()
 *      - Cap Seasons (L2002) & neutros (L2040) display lists to 12 names + "+N more"
 *   2. docs/lista-dinamica.js:
 *      - Optional tamanoLote batching + incremental "Show more" ([data-lista-ver-mas])
 *        while keeping 100% search, sort, and Pending payment filter intact
 *      - Optional debounceMs on search input (immediate on empty clear)
 *   3. src/app/app-inline-07.js:
 *      - Pre-index label[for] into a Set once per pass (eliminates O(M*N) querySelector)
 *      - Scope labeling to active view + visible modals instead of scanning hidden tabs
 *
 * OUT OF SCOPE:
 *   - Zero visual/CSS/color/button/copy changes
 *   - Zero edits to friendly-123 master/estable or PR #1110 files
 *   - Zero changes to customer data, balances, or persistence contracts
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const esbuild = require('esbuild');
const { chromium, webkit } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');
const OUT_JSON = path.join(__dirname, 'results-red-green.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.cjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function mustReplace(src, target, replacement, label) {
  const idx = src.indexOf(target);
  if (idx < 0) throw new Error(`[PATCH FAIL] Target not found for: ${label}`);
  if (src.indexOf(target, idx + 1) >= 0) throw new Error(`[PATCH FAIL] Multiple matches for: ${label}`);
  return src.slice(0, idx) + replacement + src.slice(idx + target.length);
}

function buildPatchedBundles() {
  // 1. Patch src/app/app-inline-01.js (strictly minimal Ponytail diff)
  let app01 = fs.readFileSync(path.join(REPO_ROOT, 'src/app/app-inline-01.js'), 'utf8');

  // 1a. Lazy-mount #oc-cliedit-${c.id} ONLY when panelEditAbierto === true
  const targetPanelStart = '  const panelEditar = `<div id="oc-${editKey}" style="display:${panelEditAbierto ? "flex" : "none"};gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;padding:8px 10px;background:var(--blanco-calido,#fbf5e8);border-radius:6px;">';
  const targetPanelEnd = '      <button onclick="guardarContactoCliente(${argHtml(c.id)})" class="ir" style="font-size:13px;padding:6px 12px;">Save</button>\n    </div>`;';
  const pStart = app01.indexOf(targetPanelStart);
  const pEnd = app01.indexOf(targetPanelEnd, pStart);
  assert.ok(pStart > 0 && pEnd > pStart, 'Locate panelEditar block in app-inline-01.js');
  const origPanelBlock = app01.slice(pStart, pEnd + targetPanelEnd.length);
  const patchedPanelBlock = origPanelBlock
    .replace(
      'const panelEditar = `<div id="oc-${editKey}" style="display:${panelEditAbierto ? "flex" : "none"};',
      'const panelEditar = !panelEditAbierto ? "" : `<div id="oc-${editKey}" style="display:flex;'
    );
  app01 = app01.slice(0, pStart) + patchedPanelBlock + app01.slice(pEnd + targetPanelEnd.length);

  // 1b. Pass tamanoLote: 40, debounceMs: 150 into AMG.ListaDinamica.crear()
  app01 = mustReplace(
    app01,
    '      minCaracteres: 2,\n      limite: 8,',
    '      minCaracteres: 2,\n      limite: 8,\n      tamanoLote: 40,\n      debounceMs: 150,',
    'ListaDinamica tamanoLote + debounceMs'
  );

  // 1c. Cap Seasons (L2002) and neutros (L2040) to 12 names + "+N more" (matching celdaComp L2024)
  app01 = mustReplace(
    app01,
    '<div style="font-size:14px;color:#0F1923;margin-top:6px;">${l.length ? l.map((c) => escHtml(c.nombre.split(" ")[0])).join(", ") : "—"}</div>',
    '<div style="font-size:14px;color:#0F1923;margin-top:6px;">${l.length ? l.slice(0, 12).map((c) => escHtml(c.nombre.split(" ")[0])).join(", ") + (l.length > 12 ? " +" + (l.length - 12) + " more" : "") : "—"}</div>',
    'Cap Seasons quadrant names'
  );
  app01 = mustReplace(
    app01,
    '${neutros.length ? `<p style="font-size:14px;color:var(--ink-soft);margin-top:10px;">Not evaluated yet: ${neutros.map(c=>escHtml(c.nombre.split(" ")[0])).join(", ")}.</p>` : ""}',
    '${neutros.length ? `<p style="font-size:14px;color:var(--ink-soft);margin-top:10px;">Not evaluated yet (${neutros.length}): ${neutros.slice(0, 12).map(c=>escHtml(c.nombre.split(" ")[0])).join(", ")}${neutros.length > 12 ? " +" + (neutros.length - 12) + " more" : ""}.</p>` : ""}',
    'Cap neutros names'
  );

  // 2. Patch docs/lista-dinamica.js (optional tamanoLote + incremental Show more + optional debounceMs)
  let listaDyn = fs.readFileSync(path.join(REPO_ROOT, 'docs/lista-dinamica.js'), 'utf8');
  listaDyn = mustReplace(
    listaDyn,
    '    var limite = opts.limite != null ? opts.limite : 8;\n',
    '    var limite = opts.limite != null ? opts.limite : 8;\n' +
    '    var tamanoLote = (!restringido && Number(opts.tamanoLote) > 0) ? Math.floor(Number(opts.tamanoLote)) : 0;\n' +
    '    var debounceMs = Number(opts.debounceMs) > 0 ? Math.floor(Number(opts.debounceMs)) : 0;\n' +
    '    var mostrados = tamanoLote;\n' +
    '    var ultimosFiltrados = [];\n',
    'ListaDinamica batch config'
  );
  listaDyn = mustReplace(
    listaDyn,
    '    var lista = document.createElement("div");\n    var mensaje = document.createElement("p");',
    '    var lista = document.createElement("div");\n' +
    '    var pieLote = document.createElement("div");\n' +
    '    pieLote.style.cssText = "margin:10px 0 4px;text-align:center;";\n' +
    '    var mensaje = document.createElement("p");',
    'ListaDinamica pieLote container'
  );
  listaDyn = mustReplace(
    listaDyn,
    '    cont.appendChild(lista);\n    cont.appendChild(mensaje);',
    '    cont.appendChild(lista);\n    cont.appendChild(pieLote);\n    cont.appendChild(mensaje);',
    'ListaDinamica mount pieLote'
  );
  listaDyn = mustReplace(
    listaDyn,
    '      if (!filtrados.length) {\n        lista.innerHTML = "";',
    '      if (!filtrados.length) {\n        lista.innerHTML = "";\n        pieLote.innerHTML = "";\n        ultimosFiltrados = [];',
    'ListaDinamica empty clear pieLote'
  );
  listaDyn = mustReplace(
    listaDyn,
    '      lista.innerHTML = filtrados.map(opts.renderFila).join("");\n      if (opts.alPintar) { try { opts.alPintar(filtrados); } catch (_) {} }',
    '      ultimosFiltrados = filtrados;\n' +
    '      var visibles = (tamanoLote && filtrados.length > mostrados) ? filtrados.slice(0, mostrados) : filtrados;\n' +
    '      lista.innerHTML = visibles.map(opts.renderFila).join("");\n' +
    '      if (opts.alPintar) { try { opts.alPintar(visibles); } catch (_) {} }\n' +
    '      actualizarBotonMas();',
    'ListaDinamica batched render'
  );
  listaDyn = mustReplace(
    listaDyn,
    '    input.addEventListener("input", function () {\n      estado.busqueda = input.value;\n      avisarEstado();\n      pintar();\n    });',
    '    function actualizarBotonMas() {\n' +
    '      if (!tamanoLote || ultimosFiltrados.length <= mostrados) { pieLote.innerHTML = ""; return; }\n' +
    '      var rest = ultimosFiltrados.length - mostrados;\n' +
    '      var _esB = (function(){try{return window.OCI18n&&window.OCI18n.getLang()==="es";}catch(_){return false;}})();\n' +
    '      var txt = _esB ? ("Mostrar más (" + rest + " restantes)") : ("Show more (" + rest + " remaining)");\n' +
    '      pieLote.innerHTML = \'<button type="button" data-lista-ver-mas style="min-height:44px;padding:8px 18px;border:2px solid var(--azul-medio,#2c4a68);border-radius:8px;background:transparent;color:var(--azul-medio,#2c4a68);font-size:14px;font-weight:700;cursor:pointer;">\' + txt + "</button>";\n' +
    '    }\n' +
    '    pieLote.addEventListener("click", function (e) {\n' +
    '      if (!e.target.closest("[data-lista-ver-mas]")) return;\n' +
    '      var prev = mostrados;\n' +
    '      mostrados += tamanoLote;\n' +
    '      var extra = ultimosFiltrados.slice(prev, mostrados);\n' +
    '      if (extra.length) {\n' +
    '        lista.insertAdjacentHTML("beforeend", extra.map(opts.renderFila).join(""));\n' +
    '        if (opts.alPintar) { try { opts.alPintar(extra); } catch (_) {} }\n' +
    '      }\n' +
    '      actualizarBotonMas();\n' +
    '    });\n' +
    '    var _debTimer = null;\n' +
    '    input.addEventListener("input", function () {\n' +
    '      estado.busqueda = input.value;\n' +
    '      mostrados = tamanoLote;\n' +
    '      avisarEstado();\n' +
    '      if (_debTimer) { clearTimeout(_debTimer); _debTimer = null; }\n' +
    '      if (debounceMs && estado.busqueda.trim()) { _debTimer = setTimeout(pintar, debounceMs); }\n' +
    '      else { pintar(); }\n' +
    '    });',
    'ListaDinamica Show more + debounce'
  );
  listaDyn = mustReplace(
    listaDyn,
    '        if (estado.ordenPor === key) estado.ordenAsc = !estado.ordenAsc;\n        else { estado.ordenPor = key; estado.ordenAsc = true; }\n        avisarEstado();\n        pintarOrden();\n        pintar();',
    '        if (estado.ordenPor === key) estado.ordenAsc = !estado.ordenAsc;\n        else { estado.ordenPor = key; estado.ordenAsc = true; }\n        mostrados = tamanoLote;\n        avisarEstado();\n        pintarOrden();\n        pintar();',
    'ListaDinamica reset batch on sort'
  );

  // 3. Patch src/app/app-inline-07.js (O(M*N) -> O(N) Set index + active-view scoping)
  const app07Patched = `
/* ETIQUETAS ACCESIBLES (Ponytail O(N) lab candidate: Set index for label[for] + active-view scoping) */
(function () {
  function etiquetar(raiz) {
    try {
      var targets = raiz ? [raiz] : Array.prototype.slice.call(
        document.querySelectorAll(".vista.activa, .modal.visible, [id$='-overlay']")
      );
      if (!targets.length) targets = [document];
      var conLabel = new Set();
      document.querySelectorAll("label[for]").forEach(function (l) {
        var f = l.getAttribute("for");
        if (f) conLabel.add(f);
      });
      targets.forEach(function (scope) {
        scope.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea").forEach(function (el) {
          if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return;
          if (el.id && conLabel.has(el.id)) return;
          if (el.closest("label")) return;
          var t = el.getAttribute("placeholder") || el.getAttribute("title") || (el.previousElementSibling && el.previousElementSibling.textContent) || el.name || el.id || "";
          t = String(t).replace(/\\s+/g, " ").trim().slice(0, 80);
          if (t) el.setAttribute("aria-label", t);
        });
      });
    } catch (_) {}
  }
  var t = null;
  function pronto() { clearTimeout(t); t = setTimeout(function () { etiquetar(); }, 250); }
  document.addEventListener("DOMContentLoaded", function () { etiquetar(document); });
  try { new MutationObserver(pronto).observe(document.documentElement, { childList: true, subtree: true }); } catch (_) {}
})();
`;

  const min01 = esbuild.transformSync(app01, { minify: true, loader: 'js', target: 'safari15' }).code;
  const minLista = esbuild.transformSync(listaDyn, { minify: true, loader: 'js', target: 'safari15' }).code;
  const min07 = esbuild.transformSync(app07Patched, { minify: true, loader: 'js', target: 'safari15' }).code;

  return {
    '/app-inline-01.min.js': Buffer.from(min01, 'utf8'),
    '/lista-dinamica.min.js': Buffer.from(minLista, 'utf8'),
    '/app-inline-07.min.js': Buffer.from(min07, 'utf8'),
  };
}

function startStaticServer(rootDir, overlayMap) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const cleanUrl = (req.url || '/').split('?')[0];
        let rel = decodeURIComponent(cleanUrl);
        if (rel === '/' || rel === '') rel = '/index.html';
        if (overlayMap && overlayMap[rel]) {
          res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
          return res.end(overlayMap[rel]);
        }
        const abs = path.resolve(rootDir, '.' + rel);
        if (!abs.startsWith(rootDir) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
          res.writeHead(404);
          return res.end('Not found');
        }
        const ext = path.extname(abs).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        fs.createReadStream(abs).pipe(res);
      } catch (e) {
        res.writeHead(500);
        res.end(String(e));
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

function buildSyntheticPayload(baseBackup) {
  const now = new Date();
  const ym = (offsetMonths) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offsetMonths, 15, 16, 0, 0));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  };
  const m0 = ym(0), m1 = ym(1), m2 = ym(2);
  const todayIso = now.toISOString();
  const ubicaciones = Array.from({ length: 12 }, (_, i) => ({
    id: `syn-ub-${i + 1}`,
    nombre: i === 0 ? 'Main Showroom Floor' : `Partner Rack ${i + 1}`,
    tipo: i === 0 ? 'propia' : 'consignacion',
    activa: true,
    comisionPct: i === 0 ? 0 : 25 + (i % 4) * 5,
    duenoId: i === 0 ? null : `syn-pr-${(i % 15) + 1}`,
  }));
  const promotoras = Array.from({ length: 15 }, (_, i) => ({
    id: `syn-pr-${i + 1}`,
    nombre: `Synthetic Artist ${String(i + 1).padStart(2, '0')}`,
    comisionBase: 20 + (i % 5) * 5,
    telefono: `099000${String(1000 + i)}`,
    banco: `Bank ${i % 4}`,
    activa: true,
  }));
  const categories = ['Ceramics', 'Jewelry', 'Textiles', 'Leather', 'Prints', 'Candles', 'Woodcraft', 'Glass'];
  const productos = Array.from({ length: 1200 }, (_, i) => {
    const ubIdx = i < 600 ? 0 : 1 + (i % 11);
    const prIdx = i % 15;
    const precio = 12 + (i % 45) * 2.5;
    const costo = Math.round(precio * 0.45 * 100) / 100;
    const stock = (i % 19 === 0) ? 0 : 3 + (i % 25);
    return {
      id: `syn-prod-${i + 1}`,
      nombre: `${categories[i % categories.length]} Piece #${String(i + 1).padStart(4, '0')}`,
      sku: `SYN-${String(i + 1).padStart(5, '0')}`,
      codigoBarras: `786000${String(100000 + i)}`,
      categoria: categories[i % categories.length],
      precio, costo, stockActual: stock, stock, stockMinimo: 2,
      estado: stock === 0 ? 'rojo' : (stock <= 3 ? 'amarillo' : 'verde'),
      ubicacionId: ubicaciones[ubIdx].id,
      promotoraId: promotoras[prIdx].id,
      comisionPct: promotoras[prIdx].comisionBase,
      direccionComision: 'casaPaga',
      estrella: i < 24,
      archivado: false,
      creadoEn: `${m2}-02T10:00:00.000Z`,
    };
  });
  const clientes = Array.from({ length: 400 }, (_, i) => ({
    id: `syn-cli-${i + 1}`,
    nombre: `Synthetic Customer ${String(i + 1).padStart(3, '0')}`,
    telefono: `098100${String(1000 + i)}`,
    email: `customer${i + 1}@example.invalid`,
    notas: i % 5 === 0 ? 'VIP repeat buyer' : '',
    resideCuenca: i % 2 === 0 ? true : false,
    genero: i % 3 === 0 ? 'female' : (i % 3 === 1 ? 'male' : 'unknown'),
    creadoEn: `${m2}-05T14:00:00.000Z`,
  }));
  const meses = [m0, m1, m2];
  const ventas = Array.from({ length: 2000 }, (_, i) => {
    const prod = productos[i % productos.length];
    const cli = clientes[i % clientes.length];
    const mes = i < 900 ? m0 : (i < 1500 ? m1 : m2);
    const day = String(1 + (i % 26)).padStart(2, '0');
    const fecha = i < 40 ? todayIso : `${mes}-${day}T15:${String(i % 60).padStart(2, '0')}:00.000Z`;
    const cantidad = 1 + (i % 3);
    const total = Math.round(prod.precio * cantidad * 100) / 100;
    const comisionSocio = Math.round(total * (prod.comisionPct / 100) * 100) / 100;
    return {
      id: `syn-vta-${i + 1}`, fecha, productoId: prod.id, productoNombre: prod.nombre, sku: prod.sku,
      cantidad, precioUnit: prod.precio, costoUnit: prod.costo, total,
      ubicacionId: prod.ubicacionId, clienteId: cli.id, clienteNombre: cli.nombre,
      promotoraId: prod.promotoraId, formaPago: i % 3 === 0 ? 'transfer' : 'cash',
      metodoPago: i % 3 === 0 ? 'transfer' : 'cash', liquidada: mes === m2, anulada: false,
      split: { promotoraId: prod.promotoraId, porcentaje: prod.comisionPct, montoComisionSocio: comisionSocio, netoCasa: Math.round((total - comisionSocio) * 100) / 100, direccion: 'casaPaga' },
    };
  });
  const gastoCats = ['Rent', 'Utilities', 'Packaging', 'Supplies', 'Marketing', 'Maintenance', 'Shipping'];
  const gastos = Array.from({ length: 400 }, (_, i) => ({
    id: `syn-gto-${i + 1}`,
    fecha: `${meses[i % 3]}-${String(1 + (i % 26)).padStart(2, '0')}T12:00:00.000Z`,
    concepto: `${gastoCats[i % gastoCats.length]} Invoice #${i + 1}`,
    categoria: gastoCats[i % gastoCats.length],
    monto: Math.round((8.5 + (i % 40) * 3.25) * 100) / 100,
    ubicacionId: ubicaciones[i % ubicaciones.length].id,
    formaPago: i % 2 === 0 ? 'cash' : 'transfer',
    notas: 'Synthetic stress test expense',
  }));
  return Object.assign({}, baseBackup, {
    ubicaciones, promotoras, productos, clientes, ventas, gastos,
    movimientos: [], payouts: [], nombreNegocio: 'Synthetic Lab Shop',
  });
}

async function getCdpMetrics(cdp) {
  if (!cdp) return null;
  const { metrics } = await cdp.send('Performance.getMetrics');
  const map = Object.fromEntries(metrics.map((m) => [m.name, m.value]));
  return {
    jsHeapUsedMB: Math.round(((map.JSHeapUsedSize || 0) / (1024 * 1024)) * 100) / 100,
    cdpNodes: map.Nodes || 0,
    cdpEventListeners: map.JSEventListeners || 0,
  };
}

async function waitTwoRafs(page, extraMs = 200) {
  await page.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), extraMs);
}

async function runPass(baseUrl, profile, mode) {
  const { name, engine, viewport, isMobile, hasTouch, deviceScaleFactor, useCdp } = profile;
  const browser = await engine.launch({ headless: true });
  const context = await browser.newContext({ viewport, isMobile: !!isMobile, hasTouch: !!hasTouch, deviceScaleFactor: deviceScaleFactor || 2 });
  await context.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(baseUrl) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: () => Promise.resolve({ scope: '/', update: () => Promise.resolve() }), ready: new Promise(() => {}), getRegistrations: () => Promise.resolve([]), addEventListener: () => {} },
        configurable: true,
      });
    } catch (_) {}
    window.WebSocket = function FakeWS() { this.readyState = 3; this.close = () => {}; this.send = () => {}; this.addEventListener = () => {}; };
  });

  let cdp = null;
  if (useCdp && engine === chromium) {
    cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
  }

  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => !!window.__ocMockBackendReady, { timeout: 30000 });
  await page.addStyleTag({ content: '#oc-gate,#puerta,#oc-splash,.oc-splash{display:none!important;pointer-events:none!important}' });

  const baseBackup = await page.evaluate(async () => {
    window.OCAuth = Object.assign(window.OCAuth || {}, { rolActual: () => 'dueno', esDemo: () => false });
    return (await fetch('/api/respaldo/exportar')).json();
  });
  const payload = buildSyntheticPayload(baseBackup);
  const imp = await page.evaluate(async (bk) => {
    const r = await fetch('/api/respaldo/importar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bk) });
    return r.status;
  }, payload);
  assert.equal(imp, 200, 'Synthetic import HTTP 200');

  await page.reload({ waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => !!window.__ocMockBackendReady, { timeout: 30000 });
  await page.addStyleTag({ content: '#oc-gate,#puerta,#oc-splash,.oc-splash{display:none!important;pointer-events:none!important}' });
  await page.evaluate(() => {
    window.OCAuth = Object.assign(window.OCAuth || {}, { rolActual: () => 'dueno', esDemo: () => false });
  });
  await waitTwoRafs(page, 250);

  const tabs = ['comisiones', 'clientes', 'gastos', 'perchas', 'comisiones'];
  const measured = [];
  for (let idx = 0; idx < tabs.length; idx++) {
    const vista = tabs[idx];
    const t0 = Date.now();
    await page.evaluate((v) => { const b = document.querySelector(`nav button[data-vista="${v}"]`); if (b) b.click(); }, vista);
    await waitTwoRafs(page, 260);
    const switchMs = Date.now() - t0;
    const dom = await page.evaluate(() => {
      const cli = document.getElementById('listaClientes');
      const secCli = document.getElementById('vista-clientes');
      return {
        totalDomNodes: document.querySelectorAll('*').length,
        clientesVistaNodes: secCli ? secCli.querySelectorAll('*').length : 0,
        clientesHiddenOptions: cli ? cli.querySelectorAll('select option').length : 0,
        clientesHiddenEditPanels: cli ? cli.querySelectorAll('[id^="oc-cliedit-"]').length : 0,
        clientesCards: cli ? cli.querySelectorAll('.oc-edit-btn').length : 0,
        showMoreBtnText: cli && cli.querySelector('[data-lista-ver-mas]') ? cli.querySelector('[data-lista-ver-mas]').textContent : null,
      };
    });
    const cdpM = await getCdpMetrics(cdp);
    measured.push({ step: idx + 1, vista, switchMs, ...dom, cdp: cdpM });
    console.log(
      `  [${mode} ${name}] #${idx + 1} ${vista.padEnd(10)} switch=${String(switchMs).padStart(5)}ms | totalDOM=${String(dom.totalDomNodes).padStart(5)} | cliNodes=${String(dom.clientesVistaNodes).padStart(5)} | hiddenOpts=${String(dom.clientesHiddenOptions).padStart(5)}` +
      (cdpM ? ` | listeners=${cdpM.cdpEventListeners}` : '')
    );
  }

  // Strict Functional E2E Preservation Checks on GREEN pass!
  let functionalE2E = null;
  if (mode === 'GREEN') {
    await page.evaluate(() => { const b = document.querySelector('nav button[data-vista="clientes"]'); if (b) b.click(); });
    await waitTwoRafs(page, 250);

    // E2E 1: Initial mount = 40 cards, 0 hidden options, Show more says 360 remaining
    const init = await page.evaluate(() => {
      const cli = document.getElementById('listaClientes');
      return {
        cards: cli.querySelectorAll('.oc-edit-btn').length,
        hiddenOpts: cli.querySelectorAll('select option').length,
        showMore: cli.querySelector('[data-lista-ver-mas]')?.textContent || '',
      };
    });
    assert.equal(init.cards, 40, 'GREEN initial Customers batch must mount 40 cards');
    assert.equal(init.hiddenOpts, 0, 'GREEN initial Customers must mount 0 hidden <option> nodes');
    assert.match(init.showMore, /360/, 'GREEN Show more must report 360 remaining');

    // E2E 2: Clicking Show more mounts next 40 incrementally (40 -> 80)
    await page.locator('#listaClientes [data-lista-ver-mas]').click();
    await waitTwoRafs(page, 150);
    const afterMore = await page.evaluate(() => document.querySelectorAll('#listaClientes .oc-edit-btn').length);
    assert.equal(afterMore, 80, 'GREEN Show more must append cards 41..80');

    // E2E 3: Global search finds Customer 399 (far beyond first 80!)
    const searchInput = page.locator('#listaClientes input[type="text"]').first();
    await searchInput.fill('Customer 399');
    await waitTwoRafs(page, 300);
    const searchCheck = await page.evaluate(() => ({
      textHas399: document.getElementById('listaClientes').textContent.includes('Synthetic Customer 399'),
      cardsShown: document.querySelectorAll('#listaClientes .oc-edit-btn').length,
    }));
    assert.equal(searchCheck.textHas399, true, 'GREEN global search must locate Synthetic Customer 399');
    assert.equal(searchCheck.cardsShown, 1, 'GREEN search must filter cleanly to 1 matching card');

    // E2E 4: Clicking Edit contact lazily mounts #oc-cliedit-* with all 29 countries & saves note roundtrip!
    await page.locator('#listaClientes .oc-edit-btn').first().click();
    await waitTwoRafs(page, 250);
    const editMounted = await page.evaluate(() => {
      const panel = document.querySelector('#listaClientes [id^="oc-cliedit-"]');
      const pais = panel ? panel.querySelector('[id^="oc-edit-pais-"]') : null;
      const notas = panel ? panel.querySelector('[id^="oc-edit-notas-"]') : null;
      if (notas) notas.value = 'Verified lazy roundtrip note';
      return {
        panelVisible: !!(panel && panel.style.display === 'flex'),
        countryOptions: pais ? pais.querySelectorAll('option').length : 0,
      };
    });
    assert.equal(editMounted.panelVisible, true, 'GREEN clicking Edit must lazily mount visible edit panel');
    assert.equal(editMounted.countryOptions, 29, 'GREEN lazy edit panel must preserve all 29 OC_PAISES options');

    await page.locator('#listaClientes [id^="oc-cliedit-"] button.ir').first().click();
    await waitTwoRafs(page, 300);
    const noteSaved = await page.evaluate(() =>
      document.getElementById('listaClientes').textContent.includes('Verified lazy roundtrip note')
    );
    assert.equal(noteSaved, true, 'GREEN saving lazy edit form must persist updated note');

    functionalE2E = {
      initialBatch40: true,
      zeroHiddenOptions: true,
      showMore40To80: true,
      globalSearchCustomer399: true,
      lazyEditMount29Countries: true,
      saveNoteRoundtrip: true,
    };
  }

  await browser.close();
  assert.equal(pageErrors.length, 0, `[${mode} ${name}] Zero pageErrors required`);
  return { mode, profile: name, engine: engine.name(), pageErrors, measured, functionalE2E };
}

async function main() {
  const gitSha = execFileSync('git', ['-C', REPO_ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const overlay = buildPatchedBundles();
  const redSrv = await startStaticServer(DOCS_DIR, null);
  const greenSrv = await startStaticServer(DOCS_DIR, overlay);

  const profiles = [
    { name: 'webkit-ipad-1024x768', engine: webkit, viewport: { width: 1024, height: 768 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2, useCdp: false },
    { name: 'webkit-iphone-390x844', engine: webkit, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, useCdp: false },
    { name: 'chromium-tablet-1024x768-cdp', engine: chromium, viewport: { width: 1024, height: 768 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2, useCdp: true },
  ];

  const results = [];
  try {
    for (const p of profiles) {
      console.log(`\n=== ${p.name} ===`);
      const red = await runPass(redSrv.baseUrl, p, 'RED');
      const green = await runPass(greenSrv.baseUrl, p, 'GREEN');
      results.push({ profile: p.name, red, green });
    }
  } finally {
    redSrv.server.close();
    greenSrv.server.close();
  }

  const out = {
    meta: {
      generatedAt: new Date().toISOString(),
      targetSha: gitSha,
      targetVersion: 'v0.9.27',
      syntheticOnly: true,
      productTreeUntouched: true,
      scopeClass: 'PARKING_LOT_POST_STABLE_WORKSHOP_LAB',
    },
    results,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`\nALL RED -> GREEN & FUNCTIONAL E2E ASSERTIONS PASSED! Saved to ${OUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
