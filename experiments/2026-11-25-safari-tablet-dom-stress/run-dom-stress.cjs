'use strict';

/**
 * Safari / iPadOS / Tablet-First DOM Time-Bomb Stress Harness (Synthetic Only)
 * Target: friendly-123 origin/master v0.9.27 (c3ec60e0b)
 *
 * Measures REAL browser behavior across:
 *   1. WebKit iPad (1024x768, touch)
 *   2. WebKit iPhone (390x844, touch)
 *   3. Chromium Tablet (1024x768, touch) + CDP Performance.getMetrics
 *      (JSHeapUsedSize, Nodes, JSEventListeners, LayoutCount, RecalcStyleCount)
 *
 * Strictly synthetic data. Zero edits to app code. External network blocked.
 */

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium, webkit } = require('playwright');

const REPO_ROOT = path.resolve(__dirname, '../..');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');
const OUT_JSON = path.join(__dirname, 'results.json');

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

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const cleanUrl = (req.url || '/').split('?')[0];
        let rel = decodeURIComponent(cleanUrl);
        if (rel === '/' || rel === '') rel = '/index.html';
        const abs = path.resolve(rootDir, '.' + rel);
        if (!abs.startsWith(rootDir)) {
          res.writeHead(403);
          return res.end('Forbidden');
        }
        if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
          res.writeHead(404);
          return res.end('Not found');
        }
        const ext = path.extname(abs).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        });
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
  const m0 = ym(0);
  const m1 = ym(1);
  const m2 = ym(2);
  const todayIso = now.toISOString();

  // 12 shelves (ubicaciones): ub-1 is primary store with 600 products; ub-2..ub-12 have ~55 each = 1,200 total
  const ubicaciones = Array.from({ length: 12 }, (_, i) => ({
    id: `syn-ub-${i + 1}`,
    nombre: i === 0 ? 'Main Showroom Floor' : `Partner Rack ${i + 1}`,
    tipo: i === 0 ? 'propia' : 'consignacion',
    activa: true,
    comisionPct: i === 0 ? 0 : 25 + (i % 4) * 5,
    duenoId: i === 0 ? null : `syn-pr-${(i % 15) + 1}`,
  }));

  // 15 associates (promotoras)
  const promotoras = Array.from({ length: 15 }, (_, i) => ({
    id: `syn-pr-${i + 1}`,
    nombre: `Synthetic Artist ${String(i + 1).padStart(2, '0')}`,
    comisionBase: 20 + (i % 5) * 5,
    telefono: `099000${String(1000 + i)}`,
    banco: `Bank ${i % 4}`,
    activa: true,
  }));

  // 1,200 products (600 in ub-1 so active-location POS grids experience real 600-item catalog pressure;
  // 600 across ub-2..ub-12 for cross-location labels/inventory/commissions)
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
      precio,
      costo,
      stockActual: stock,
      stock,
      stockMinimo: 2,
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

  // 400 customers (clientes)
  const clientes = Array.from({ length: 400 }, (_, i) => ({
    id: `syn-cli-${i + 1}`,
    nombre: `Synthetic Customer ${String(i + 1).padStart(3, '0')}`,
    telefono: `098100${String(1000 + i)}`,
    email: `customer${i + 1}@example.invalid`,
    notas: i % 5 === 0 ? 'VIP repeat buyer' : '',
    resideCuenca: i % 2 === 0 ? 'si' : 'no',
    genero: i % 3 === 0 ? 'f' : (i % 3 === 1 ? 'm' : 'otro'),
    creadoEn: `${m2}-05T14:00:00.000Z`,
  }));

  // 2,000 sales (ventas) spread over 3 months + today
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
      id: `syn-vta-${i + 1}`,
      fecha,
      productoId: prod.id,
      productoNombre: prod.nombre,
      sku: prod.sku,
      cantidad,
      precioUnit: prod.precio,
      costoUnit: prod.costo,
      total,
      ubicacionId: prod.ubicacionId,
      clienteId: cli.id,
      clienteNombre: cli.nombre,
      promotoraId: prod.promotoraId,
      formaPago: i % 3 === 0 ? 'transfer' : 'cash',
      metodoPago: i % 3 === 0 ? 'transfer' : 'cash',
      liquidada: mes === m2,
      anulada: false,
      split: {
        promotoraId: prod.promotoraId,
        porcentaje: prod.comisionPct,
        montoComisionSocio: comisionSocio,
        netoCasa: Math.round((total - comisionSocio) * 100) / 100,
        direccion: 'casaPaga',
      },
    };
  });

  // 400 expenses (gastos)
  const gastoCats = ['Rent', 'Utilities', 'Packaging', 'Supplies', 'Marketing', 'Maintenance', 'Shipping'];
  const gastos = Array.from({ length: 400 }, (_, i) => {
    const mes = meses[i % 3];
    const day = String(1 + (i % 26)).padStart(2, '0');
    return {
      id: `syn-gto-${i + 1}`,
      fecha: `${mes}-${day}T12:00:00.000Z`,
      concepto: `${gastoCats[i % gastoCats.length]} Invoice #${i + 1}`,
      categoria: gastoCats[i % gastoCats.length],
      monto: Math.round((8.5 + (i % 40) * 3.25) * 100) / 100,
      ubicacionId: ubicaciones[i % ubicaciones.length].id,
      formaPago: i % 2 === 0 ? 'cash' : 'transfer',
      notas: 'Synthetic stress test expense',
    };
  });

  const payload = Object.assign({}, baseBackup, {
    ubicaciones,
    promotoras,
    productos,
    clientes,
    ventas,
    gastos,
    movimientos: [],
    payouts: [],
    nombreNegocio: 'Synthetic Stress Lab Shop',
  });
  return {
    payload,
    counts: {
      ubicaciones: ubicaciones.length,
      promotoras: promotoras.length,
      productos: productos.length,
      productosEnUbicacionPrincipal: 600,
      clientes: clientes.length,
      ventas: ventas.length,
      gastos: gastos.length,
    },
  };
}

async function getCdpMetrics(cdp) {
  if (!cdp) return null;
  const { metrics } = await cdp.send('Performance.getMetrics');
  const map = Object.fromEntries(metrics.map((m) => [m.name, m.value]));
  return {
    jsHeapUsedMB: Math.round(((map.JSHeapUsedSize || 0) / (1024 * 1024)) * 100) / 100,
    jsHeapTotalMB: Math.round(((map.JSHeapTotalSize || 0) / (1024 * 1024)) * 100) / 100,
    cdpNodes: map.Nodes || 0,
    cdpEventListeners: map.JSEventListeners || 0,
    layoutCount: map.LayoutCount || 0,
    recalcStyleCount: map.RecalcStyleCount || 0,
  };
}

async function snapshotDom(page) {
  return page.evaluate(() => {
    const vistas = Array.from(document.querySelectorAll('section.vista'));
    const perVista = {};
    let activeVistaId = null;
    let activeSectionDomNodes = 0;
    let hiddenRetainedDomNodes = 0;
    for (const sec of vistas) {
      const count = sec.querySelectorAll('*').length;
      perVista[sec.id] = count;
      if (sec.classList.contains('activa')) {
        activeVistaId = sec.id;
        activeSectionDomNodes += count;
      } else {
        hiddenRetainedDomNodes += count;
      }
    }
    const gridCount = (id) => {
      const el = document.getElementById(id);
      return el ? el.querySelectorAll('*').length : 0;
    };
    return {
      activeVistaId,
      totalDomNodes: document.querySelectorAll('*').length,
      activeSectionDomNodes,
      hiddenRetainedDomNodes,
      perVista,
      grids: {
        gridVender: gridCount('gridVender'),
        gridInventario: gridCount('gridInventario'),
        gridEtiquetas: gridCount('gridEtiquetas'),
        listaComisiones: gridCount('listaComisiones'),
        listaClientes: gridCount('listaClientes'),
        listaGastos: gridCount('listaGastos'),
      },
      invHtmlCacheSize: window._inventarioHtmlPorNodo ? Object.keys(window._inventarioHtmlPorNodo).length : null,
      imgCount: document.querySelectorAll('img').length,
      canvasCount: document.querySelectorAll('canvas').length,
    };
  });
}

async function waitTwoRafs(page, extraMs = 200) {
  await page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setTimeout(resolve, ms))
        );
      }),
    extraMs
  );
}

async function runAppProfile(baseUrl, profile) {
  const { name, engine, viewport, isMobile, hasTouch, deviceScaleFactor, useCdp } = profile;
  console.log(`\n[APP] Running profile: ${name} (${engine.name()} ${viewport.width}x${viewport.height})`);
  const browser = await engine.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    isMobile: !!isMobile,
    hasTouch: !!hasTouch,
    deviceScaleFactor: deviceScaleFactor || 2,
  });

  // Block external hosts so tests are 100% deterministic & offline
  await context.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(baseUrl) || u.startsWith('data:') || u.startsWith('blob:')) {
      return route.continue();
    }
    return route.abort();
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  // Stub WebSocket and bypass service worker registration for deterministic local benchmarking
  await page.addInitScript(() => {
    try {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: () => Promise.resolve({ scope: '/', update: () => Promise.resolve() }),
          ready: new Promise(() => {}),
          getRegistrations: () => Promise.resolve([]),
          addEventListener: () => {},
        },
        configurable: true,
      });
    } catch (_) {}
    window.WebSocket = function FakeWS() {
      this.readyState = 3;
      this.close = () => {};
      this.send = () => {};
      this.addEventListener = () => {};
    };
  });

  let cdp = null;
  if (useCdp && engine === chromium) {
    cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('HeapProfiler.enable');
  }

  const tBoot0 = Date.now();
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => !!window.__ocMockBackendReady, { timeout: 30000 });
  const bootMs = Date.now() - tBoot0;

  // Hide gate/splash overlays so real nav clicks work deterministically as owner
  await page.addStyleTag({
    content: '#oc-gate,#puerta,#oc-splash,.oc-splash{display:none!important;pointer-events:none!important}',
  });

  // Seed synthetic backup via the official /api/respaldo/importar route
  const baseBackup = await page.evaluate(async () => {
    window.OCAuth = Object.assign(window.OCAuth || {}, {
      rolActual: () => 'dueno',
      esDemo: () => false,
    });
    const r = await fetch('/api/respaldo/exportar');
    return r.json();
  });

  const { payload, counts } = buildSyntheticPayload(baseBackup);

  const importRes = await page.evaluate(async (bk) => {
    const t0 = performance.now();
    const r = await fetch('/api/respaldo/importar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bk),
    });
    const body = await r.json();
    // Point ubicacionActual to Main Showroom Floor (600 products)
    try {
      localStorage.setItem('f123_ubicacion', 'syn-ub-1');
    } catch (_) {}
    if (typeof window.cargarUbicaciones === 'function') {
      try { await window.cargarUbicaciones(); } catch (_) {}
    }
    return { status: r.status, body, importMs: Math.round(performance.now() - t0) };
  }, payload);

  if (importRes.status !== 200) {
    throw new Error(`[${name}] Synthetic import failed (${importRes.status}): ${JSON.stringify(importRes.body)}`);
  }

  // Reload once so the app boots naturally with the seeded IDB/localStorage state!
  const tReload0 = Date.now();
  await page.reload({ waitUntil: 'load', timeout: 45000 });
  await page.waitForFunction(() => !!window.__ocMockBackendReady, { timeout: 30000 });
  const seededReloadMs = Date.now() - tReload0;

  await page.addStyleTag({
    content: '#oc-gate,#puerta,#oc-splash,.oc-splash{display:none!important;pointer-events:none!important}',
  });
  await page.evaluate(() => {
    window.OCAuth = Object.assign(window.OCAuth || {}, {
      rolActual: () => 'dueno',
      esDemo: () => false,
    });
  });
  await waitTwoRafs(page, 300);

  const tabsToVisit = [
    { vista: 'hoy', waitForSelector: '#vista-hoy.activa', label: 'Today' },
    { vista: 'escanear', waitForSelector: '#gridVender [data-vender-tile]', label: 'Sell (#gridVender)' },
    { vista: 'inventario', waitForSelector: '#gridInventario .caja, #gridInventario [data-editar-directo], #gridInventario > *', label: 'Inventory (#gridInventario)' },
    { vista: 'etiquetas', waitForSelector: '#gridEtiquetas > *', label: 'Labels (#gridEtiquetas)' },
    { vista: 'comisiones', waitForSelector: '#listaComisiones > *', label: 'Commissions (#listaComisiones)' },
    { vista: 'clientes', waitForSelector: '#listaClientes > *', label: 'Customers (#listaClientes)' },
    { vista: 'gastos', waitForSelector: '#listaGastos > *', label: 'Expenses (#listaGastos)' },
    { vista: 'perchas', waitForSelector: '#vista-perchas.activa', label: 'Shelves (#vista-perchas)' },
  ];

  const tabResults = [];
  for (const tab of tabsToVisit) {
    const t0 = Date.now();
    await page.evaluate((v) => {
      const btn = document.querySelector(`nav button[data-vista="${v}"]`);
      if (btn) btn.click();
    }, tab.vista);
    try {
      await page.waitForSelector(tab.waitForSelector, { timeout: 15000, state: 'attached' });
    } catch (_) {
      // Capture whatever rendered even if selector differed
    }
    await waitTwoRafs(page, 250);
    const switchMs = Date.now() - t0;
    const dom = await snapshotDom(page);
    const cdpMetrics = await getCdpMetrics(cdp);
    tabResults.push({
      vista: tab.vista,
      label: tab.label,
      switchMs,
      totalDomNodes: dom.totalDomNodes,
      activeSectionDomNodes: dom.activeSectionDomNodes,
      hiddenRetainedDomNodes: dom.hiddenRetainedDomNodes,
      gridNodes: dom.grids,
      perVista: dom.perVista,
      cdp: cdpMetrics,
    });
    console.log(
      `  [${name}] ${tab.vista.padEnd(11)} switch=${String(switchMs).padStart(4)}ms | totalDOM=${String(dom.totalDomNodes).padStart(6)} | active=${String(dom.activeSectionDomNodes).padStart(6)} | hiddenRetained=${String(dom.hiddenRetainedDomNodes).padStart(6)}` +
      (cdpMetrics ? ` | heap=${cdpMetrics.jsHeapUsedMB}MB | listeners=${cdpMetrics.cdpEventListeners}` : '')
    );
  }

  // Extra probe on Inventory: switch location selector to ALL locations if present, or note active location count
  const inventoryDetails = await page.evaluate(() => {
    const grid = document.getElementById('gridInventario');
    const etq = document.getElementById('gridEtiquetas');
    const vend = document.getElementById('gridVender');
    const gst = document.getElementById('listaGastos');
    const cli = document.getElementById('listaClientes');
    const com = document.getElementById('listaComisiones');
    const editButtons = grid ? grid.querySelectorAll('[data-editar-directo]').length : 0;
    const stockButtons = grid ? grid.querySelectorAll('[data-ajuste-menos],[data-ajuste-mas]').length : 0;
    return {
      venderTiles: vend ? vend.querySelectorAll('[data-vender-tile]').length : 0,
      inventoryDirectEditBtns: editButtons,
      inventoryStockAdjustBtns: stockButtons,
      inventoryChildren: grid ? grid.children.length : 0,
      etiquetasChildren: etq ? etq.children.length : 0,
      gastosChildren: gst ? gst.children.length : 0,
      clientesTextLength: cli ? (cli.textContent || '').length : 0,
      clientesHiddenOptionNodes: cli ? cli.querySelectorAll('select option').length : 0,
      clientesHiddenEditPanels: cli ? cli.querySelectorAll('[id^="oc-cliedit-"]').length : 0,
      clientesSvgNodes: cli ? cli.querySelectorAll('svg').length : 0,
      comisionesNodes: com ? com.querySelectorAll('*').length : 0,
      comisionesShowMoreBtns: com ? com.querySelectorAll('[data-com-ver-mas],[data-commissions-more]').length : 0,
    };
  });

  // 15 rapid tab switches (3 cycles x 5 POS tabs) after Customers is already resident in hidden DOM
  // to measure cumulative leak / listener / heap growth without spending 3x37s blocking WebKit on Customers re-init
  if (cdp) {
    try { await cdp.send('HeapProfiler.collectGarbage'); } catch (_) {}
  }
  const beforeCyclesDom = await snapshotDom(page);
  const beforeCyclesCdp = await getCdpMetrics(cdp);

  const cycleOrder = ['inventario', 'escanear', 'etiquetas', 'gastos', 'comisiones'];
  const cycleTimes = [];
  for (let c = 0; c < 3; c++) {
    for (const v of cycleOrder) {
      const t0 = Date.now();
      await page.evaluate((vista) => {
        const btn = document.querySelector(`nav button[data-vista="${vista}"]`);
        if (btn) btn.click();
      }, v);
      await waitTwoRafs(page, 100);
      cycleTimes.push({ cycle: c + 1, vista: v, ms: Date.now() - t0 });
    }
    console.log(`  [${name}] cycle ${c + 1}/3 done (last=${cycleTimes[cycleTimes.length - 1].ms}ms)`);
  }
  if (cdp) {
    try { await cdp.send('HeapProfiler.collectGarbage'); } catch (_) {}
  }
  const afterCyclesDom = await snapshotDom(page);
  const afterCyclesCdp = await getCdpMetrics(cdp);

  const avgCycleMs = Math.round(cycleTimes.reduce((s, x) => s + x.ms, 0) / cycleTimes.length);
  const maxCycle = cycleTimes.reduce((best, x) => (x.ms > best.ms ? x : best), cycleTimes[0]);

  await browser.close();

  return {
    profile: name,
    engine: engine.name(),
    viewport,
    counts,
    bootMs,
    importMs: importRes.importMs,
    seededReloadMs,
    pageErrors,
    tabs: tabResults,
    inventoryDetails,
    stressCycles: {
      totalSwitches: cycleTimes.length,
      avgSwitchMs: avgCycleMs,
      maxSwitch: maxCycle,
      before: {
        totalDomNodes: beforeCyclesDom.totalDomNodes,
        hiddenRetainedDomNodes: beforeCyclesDom.hiddenRetainedDomNodes,
        cdp: beforeCyclesCdp,
      },
      after: {
        totalDomNodes: afterCyclesDom.totalDomNodes,
        hiddenRetainedDomNodes: afterCyclesDom.hiddenRetainedDomNodes,
        cdp: afterCyclesCdp,
      },
    },
  };
}

async function runDashboardObserverStress(baseUrl, profile) {
  const { name, engine, viewport, useCdp } = profile;
  console.log(`\n[DASHBOARD] Running MutationObserver burst stress: ${name}`);
  const browser = await engine.launch({ headless: true });
  const context = await browser.newContext({ viewport, hasTouch: true, deviceScaleFactor: 2 });
  await context.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(baseUrl) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.abort();
  });

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  // Instrument createTreeWalker & querySelectorAll BEFORE dashboard-main.js mounts its global body MutationObserver
  await page.addInitScript(() => {
    window.__obsMetrics = {
      treeWalkerCalls: 0,
      treeWalkerNextNodeCalls: 0,
      qsaAttrCalls: 0,
      mutationObserverInstances: 0,
    };
    const OrigMO = window.MutationObserver;
    window.MutationObserver = function InstrumentedMO(cb) {
      window.__obsMetrics.mutationObserverInstances++;
      return new OrigMO(cb);
    };
    window.MutationObserver.prototype = OrigMO.prototype;

    const origCreateTW = Document.prototype.createTreeWalker;
    Document.prototype.createTreeWalker = function (...args) {
      window.__obsMetrics.treeWalkerCalls++;
      const tw = origCreateTW.apply(this, args);
      const origNext = tw.nextNode.bind(tw);
      tw.nextNode = function () {
        const res = origNext();
        if (res) window.__obsMetrics.treeWalkerNextNodeCalls++;
        return res;
      };
      return tw;
    };

    const origQsa = Element.prototype.querySelectorAll;
    Element.prototype.querySelectorAll = function (sel) {
      if (typeof sel === 'string' && sel.includes('[placeholder]')) {
        window.__obsMetrics.qsaAttrCalls++;
      }
      return origQsa.apply(this, arguments);
    };

    window.WebSocket = function FakeWS() {
      this.readyState = 3;
      this.close = () => {};
      this.send = () => {};
      this.addEventListener = () => {};
    };
  });

  let cdp = null;
  if (useCdp && engine === chromium) {
    cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
  }

  await page.goto(`${baseUrl}/dashboard.html`, { waitUntil: 'load', timeout: 45000 });
  await waitTwoRafs(page, 300);

  const afterLoad = await page.evaluate(() => ({ ...window.__obsMetrics }));
  const cdpBefore = await getCdpMetrics(cdp);

  // Reset counters, then simulate a realistic 1,000-row dashboard table render + 10 live heartbeat updates
  const burst = await page.evaluate(async () => {
    window.__obsMetrics.treeWalkerCalls = 0;
    window.__obsMetrics.treeWalkerNextNodeCalls = 0;
    window.__obsMetrics.qsaAttrCalls = 0;

    const host = document.createElement('div');
    host.id = '__synthetic_dash_burst';
    document.body.appendChild(host);

    const rowsHtml = Array.from({ length: 1000 }, (_, i) =>
      `<tr><td>SYN-${i + 1}</td><td>Product ${i + 1}</td><td>Rack ${(i % 12) + 1}</td><td>Artist ${(i % 15) + 1}</td><td>$${(15 + (i % 50)).toFixed(2)}</td><td><span title="Status">Paid</span></td></tr>`
    ).join('');

    const t0 = performance.now();
    host.innerHTML = `<table><tbody>${rowsHtml}</tbody></table>`;
    // Wait for MutationObserver microtask + 2 rAFs so observer synchronous work is fully captured
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const tableInsertPlusObserverMs = Math.round((performance.now() - t0) * 10) / 10;

    const afterTable = { ...window.__obsMetrics };

    // Simulate 10 pintarMicelio-like 20s heartbeat innerHTML refreshes (15 connected devices each)
    const t1 = performance.now();
    const hb = document.createElement('div');
    document.body.appendChild(hb);
    for (let k = 0; k < 10; k++) {
      hb.innerHTML = Array.from({ length: 15 }, (_, d) =>
        `<div class="micelio-row"><span title="Online">Device ${d + 1}</span><span>v0.9.27</span><span>${k}s ago</span></div>`
      ).join('');
      await new Promise((r) => setTimeout(r, 0));
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const tenHeartbeatsMs = Math.round((performance.now() - t1) * 10) / 10;

    const afterHeartbeats = { ...window.__obsMetrics };
    host.remove();
    hb.remove();

    return {
      tableInsertPlusObserverMs,
      afterTable,
      tenHeartbeatsMs,
      afterHeartbeats,
    };
  });

  const cdpAfter = await getCdpMetrics(cdp);
  await browser.close();

  console.log(
    `  [DASHBOARD ${name}] MOs=${afterLoad.mutationObserverInstances} | 1000-row table burst=${burst.tableInsertPlusObserverMs}ms | TreeWalker calls=${burst.afterTable.treeWalkerCalls} | textNodesWalked=${burst.afterTable.treeWalkerNextNodeCalls} | qsaAttrCalls=${burst.afterTable.qsaAttrCalls}`
  );

  return {
    profile: name,
    engine: engine.name(),
    pageErrors,
    afterLoad,
    burst,
    cdpBefore,
    cdpAfter,
  };
}

async function main() {
  const gitSha = execFileSync('git', ['-C', REPO_ROOT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  const { server, baseUrl } = await startStaticServer(DOCS_DIR);
  const startedAt = new Date().toISOString();

  const profiles = [
    { name: 'webkit-ipad-1024x768', engine: webkit, viewport: { width: 1024, height: 768 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2, useCdp: false },
    { name: 'webkit-iphone-390x844', engine: webkit, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, useCdp: false },
    { name: 'chromium-tablet-1024x768-cdp', engine: chromium, viewport: { width: 1024, height: 768 }, isMobile: false, hasTouch: true, deviceScaleFactor: 2, useCdp: true },
  ];

  try {
    const appRuns = [];
    for (const p of profiles) {
      appRuns.push(await runAppProfile(baseUrl, p));
    }

    const dashboardRuns = [];
    for (const p of [profiles[0], profiles[2]]) {
      dashboardRuns.push(await runDashboardObserverStress(baseUrl, p));
    }

    const report = {
      meta: {
        generatedAt: new Date().toISOString(),
        startedAt,
        targetRepo: 'friendly-123',
        targetSha: gitSha,
        targetVersion: 'v0.9.27',
        syntheticOnly: true,
        nodeVersion: process.version,
        platform: process.platform,
      },
      appRuns,
      dashboardRuns,
    };

    fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n', 'utf8');
    console.log(`\nSaved exact measurements to ${OUT_JSON}`);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
