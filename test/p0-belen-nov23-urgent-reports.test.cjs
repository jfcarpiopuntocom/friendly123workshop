'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { webkit } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const APP_URL = pathToFileURL(path.join(ROOT, 'docs/index.html')).href;
const DASH_SRC = fs.readFileSync(path.join(ROOT, 'src/dashboard/dashboard-main.js'), 'utf8');

test('Belén A: Fiado $10 of $35 works typing before chip AND after cancelling unconfirmed RESUME OPERATION', async () => {
  const browser = await webkit.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(APP_URL, { waitUntil: 'load' });
    await page.waitForFunction(() => window.abonarCliente && window.OCAuth && window.__ocMockBackendReady);
    await page.addStyleTag({ content: '#oc-gate,#puerta,#oc-splash{display:none!important;pointer-events:none!important}' });

    // Create customer + $35 fiado sale as admin (Belén's role)
    const cid = await page.evaluate(async () => {
      localStorage.setItem('f123_lang', 'en');
      OCAuth.rolActual = () => 'admin';
      const c = await (await fetch('/api/clientes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'Belen Client 35' })
      })).json();
      const prods = await (await fetch('/api/productos')).json();
      const prod = prods[0];
      const v = await (await fetch(`/api/productos/${prod.id}/venta`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad: 1, clienteId: c.id, info: { formaPago: 'fiado', precioOverride: 35, fiadoAtomico: true } })
      })).json();
      await (await fetch(`/api/clientes/${c.id}/fiar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: 35, motivo: 'VENTA FIADA', ventaId: v.ventaId })
      })).json();
      return c.id;
    });

    // 1) Stuck unconfirmed $35 pending allocation ("RESUME OPERATION") lets Belén switch to $10
    await page.evaluate((id) => {
      localStorage.setItem('f123_customer_allocation_intent_v1:' + id, JSON.stringify({
        paymentOpId: 'customer-payment:stuck-35-test',
        opId: 'customer-allocation:stuck-35-test',
        abonoId: null,
        partes: [{ cargoKey: 'cargo:c1', monto: 35 }],
        monto: 35,
        motivo: 'Abono'
      }));
      abonarCliente(id, 'Belen Client 35');
    }, cid);

    await page.waitForSelector('#pp-ab-abandon');
    await page.waitForFunction(() => {
      const ok = document.getElementById('pp-ab-ok');
      const ab = document.getElementById('pp-ab-abandon');
      return ok && !ok.disabled && /Resume/i.test(ok.textContent) && ab && ab.style.display !== 'none';
    });
    assert.equal(await page.locator('#pp-ab-monto').isDisabled(), true);

    await page.click('#pp-ab-abandon');
    await page.waitForFunction(() => {
      const inp = document.getElementById('pp-ab-monto');
      const chips = document.querySelectorAll('#pp-ab-consumos .pp-chip');
      return inp && !inp.disabled && chips.length >= 1;
    });

    // Type 10 FIRST, THEN tap the $35 chip -> input MUST remain 10!
    await page.fill('#pp-ab-monto', '10');
    await page.locator('#pp-ab-consumos .pp-chip').first().click();
    assert.equal(await page.locator('#pp-ab-monto').inputValue(), '10', 'chip click must not overwrite manually typed $10');

    await page.click('#pp-ab-ok');
    await page.waitForFunction(() => !document.getElementById('pp-modal-abono'));

    const mid = await page.evaluate(async (id) => (await (await fetch(`/api/clientes/${id}/cartera`)).json()), cid);
    assert.equal(mid.saldo, -25, 'paying $10 of $35 leaves $25 owed');
    assert.equal(mid.consumosPendientes[0].pendiente, 25);

    // 2) Second partial payment $25 settles the debt
    await page.evaluate((id) => abonarCliente(id, 'Belen Client 35'), cid);
    await page.waitForFunction(() => document.querySelectorAll('#pp-ab-consumos .pp-chip').length >= 1);
    await page.locator('#pp-ab-consumos .pp-chip').first().click();
    assert.equal(await page.locator('#pp-ab-monto').inputValue(), '25.00');
    await page.click('#pp-ab-ok');
    await page.waitForFunction(() => !document.getElementById('pp-modal-abono'));

    const end = await page.evaluate(async (id) => (await (await fetch(`/api/clientes/${id}/cartera`)).json()), cid);
    assert.equal(end.saldo, 0, 'paying remaining $25 settles balance to $0');
  } finally {
    await browser.close();
  }
});

test('Belén B & C + Audit: New product drops Category, Sold supports historical date (UTC/EC safe), Dashboard hides borrado & admin rates customers', async () => {
  const browser = await webkit.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(APP_URL, { waitUntil: 'load' });
    await page.waitForFunction(() => window.mostrarFormNuevoProducto && window.abrirAltaProducto && window.abrirPanelVentaInfo && window.tarjetaCliente);
    await page.addStyleTag({ content: '#oc-gate,#puerta,#oc-splash{display:none!important;pointer-events:none!important}' });

    // B) New product form & modal MUST omit #np-categoria and save cleanly while keeping existing product category
    await page.evaluate(() => {
      OCAuth.rolActual = () => 'admin';
      mostrarFormNuevoProducto();
    });
    assert.equal(await page.locator('#fichaResultado #np-nombre').count(), 1, 'inline New product renders #np-nombre');
    assert.equal(await page.locator('#fichaResultado #np-categoria').count(), 0, 'inline New product must not show Category');
    await page.evaluate(() => {
      document.querySelectorAll('.vista').forEach(el => el.style.display = 'none');
      document.getElementById('vista-inventario').style.display = 'block';
      return abrirAltaProducto();
    });
    await page.waitForSelector('#modalFicha #np-nombre');
    assert.equal(await page.locator('#modalFicha #np-categoria').count(), 0, 'modal New product must not show Category');
    await page.fill('#modalFicha #np-barcode', 'NOCAT-001');
    await page.fill('#modalFicha #np-nombre', 'Modal NoCat Piece');
    await page.fill('#modalFicha #np-precio', '18');
    await page.fill('#modalFicha #np-costo', '9');
    await page.fill('#modalFicha #np-stock', '4');
    await page.locator('#modalFicha #np-ubicacion').selectOption({ index: 1 });
    await page.evaluate(() => crearProductoNuevo(''));
    const diag = await page.evaluate(async () => ({
      ps: await (await fetch('/api/productos')).json(),
      msg: (document.querySelector('#modalFicha #np-msg') || {}).textContent || ''
    }));
    const createdProd = diag.ps.find(p => p.nombre === 'Modal NoCat Piece');
    assert.ok(createdProd, 'Modal NoCat Piece must be created without Category: msg=' + diag.msg);
    assert.ok(diag.ps.some(p => p.categoria && p.nombre !== 'Modal NoCat Piece'), 'historical products preserve existing categoria');

    // Verify existing product with category keeps its category + admin customer card has rating controls
    const cardHtml = await page.evaluate(() => tarjetaCliente({ id: 'cx1', nombre: 'Admin Target', codigo: '99', genero: 'unknown', estrellas: 4, corazon: 5 }, true));
    assert.ok(cardHtml.includes('evaluarCliente('), 'admin must see customer rating controls');

    // C) Sold allows historical date 2026-06-23 without shifting day or inflating Today
    const saleCheck = await page.evaluate(async (pid) => {
      const before = await (await fetch('/api/dashboard')).json();
      await abrirPanelVentaInfo(pid, false);
      return { beforeToday: before.resumenDia.entradas, hasDateInput: !!document.getElementById('vi-fecha-venta'), prodId: pid };
    }, createdProd.id);
    assert.equal(saleCheck.hasDateInput, true, 'Sold panel exposes Sale date input');

    await page.fill('#vi-fecha-venta', '2026-06-23');
    await page.click('#oc-ventainfo-caja button.vender');
    await page.waitForFunction(() => document.getElementById('oc-ventainfo-overlay').style.display === 'none');

    const after = await page.evaluate(async (prodId) => {
      const todas = await (await fetch('/api/ventas/todas')).json();
      const dash = await (await fetch('/api/dashboard')).json();
      const sale = todas.find(v => v.productoId === prodId);
      return { sale, afterToday: dash.resumenDia.entradas };
    }, saleCheck.prodId);
    assert.ok(after.sale, 'historical sale must appear in /api/ventas/todas');
    assert.equal(after.sale.fecha.slice(0, 10), '2026-06-23', 'UTC date stays 2026-06-23');
    assert.equal(after.sale.fechaLocal, '2026-06-23', 'America/Guayaquil date stays 2026-06-23');
    assert.ok(after.sale.creadaEn && after.sale.creadaEn.slice(0, 10) >= '2026-11-23', 'creadaEn records real save time');
    assert.equal(after.afterToday, saleCheck.beforeToday, 'June sale must not inflate Today summary');
  } finally {
    await browser.close();
  }

  // Dashboard source contracts: !borrado in datosDesdeLocal & ES formatting in degradarSinTabulator
  assert.match(DASH_SRC, /clientesArr\.filter\(function \(c\) \{ return c && !c\.despedido && !c\.borrado; \}\)/);
  assert.match(DASH_SRC, /e\.promotoras \|\| \[\]\)\.filter\(function \(p\) \{ return p && !p\.borrado; \}\)/);
  assert.match(DASH_SRC, /degradarSinTabulator[\s\S]*window\.OCCustomerProfile\.genderLabel/);
});
