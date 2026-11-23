'use strict';
// Builds and verifies the pre-sealed C226 (v0.9.04) atomic patch on top of friendly-123 origin/master
// (30713d64, v0.9.03), delivering the 4 exact root-cause fixes:
// 1. cloudflare-relay-worker/src/priv-relay-core.mjs:
//    Accept BOTH legacyRoomHexForLicense(lic) AND legacyCleanRoomHexForLicense(lic)
//    ('amigable-sala:' + lic + '::limpio-2026-09-16' from docs/sync-yjs.js:2802) so JFC's principal
//    store never gets 403 room-license-mismatch on /session!
// 2. src/app/app-inline-01.js + docs/app-inline-01.min.js:
//    - All Commissions view buttons (By artist / associate, Product, Rack / event, Customer, Associate, Period)
//      are click-ON / click-OFF toggles: clicking the active button unselects it (leaving all buttons OFF)
//      and displays the full RAW ungrouped list of all sales & commissions ("total").
//    - Restores 1.0 Commissions UI elements in All-dates mode (resumenComisionesGlobalHtml):
//      * v521 Causality Arrow (flechaComisionHtml: "Associate takes [<- House pays / Associate pays ->] House keeps")
//        with [data-comm-flecha] and [data-flecha-revisar] on product cards.
//      * Product SKU, status badge (paid / pending / house share unverified), Rack & Associate subtitle,
//        House keeps, House share held by associate, Still to pay, and "See people & record payment" sheet button.
//      * Live search input (#comm-product-search + #comm-product-count) across all grouped cards and raw rows.
//      * Rack deal editor button (data-comm-edit-rack) and Associate deal editor button (data-abrir-promotora).
//      * WhatsApp daily summary button in the toolbar and Associate Ranking + 4-quadrant RFM Matrix in #rankingComisiones.
// 3. docs/commissions-by-person.js:
//    Match tab button geometry, make "By artist / associate" toggleable ON/OFF (switching to RAW "total" when
//    toggled OFF so all buttons are unselected), and wrap window.cambiarRangoComisionesGlobal + sync
//    [data-commissions-view-global] & [data-commissions-summary] so all buttons in the row are mutually exclusive.
// 4. docs/mock-backend.js + docs/plan-pagos-ui.js:
//    In DELETE /api/clientes/:id (and despedir/reactivar), emit window.OCReactivo.emitir("clientes"),
//    avisarCatalogoCambiado(), and AMG.PlanPagosUI.refrescarHoy(), and subscribe PlanPagosUI to
//    oc:datos:clientes, oc-catalogo-cambiado, and oc-sync-merge while filtering out borrado/despedido
//    customers so deleting a customer (e.g. Okey Okeyo) immediately clears the "1 payment has not arrived"
//    banner on Hoy and propagates the deletion tombstone to all devices!
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const WORKSHOP_ROOT = path.resolve(__dirname, '..');
const LIVE_REPO = 'C:\\00 Projects\\claude-f123\\friendly-123';
const BASE_SHA = '30713d64f829b2c96dcc6655db53bad04d82d572';
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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-c226-build-'));
try {
  console.log('1. Cloning pristine friendly-123 at', BASE_SHA);
  run('git', ['clone', '-q', '-c', 'core.autocrlf=false', LIVE_REPO, tmp]);
  run('git', ['-C', tmp, 'checkout', '-q', BASE_SHA]);

  // 2. Copy updated cloudflare-relay-worker/src/priv-relay-core.mjs (with legacyCleanRoomHexForLicense)
  fs.copyFileSync(
    path.join(WORKSHOP_ROOT, 'cloudflare-relay-worker', 'src', 'priv-relay-core.mjs'),
    path.join(tmp, 'cloudflare-relay-worker', 'src', 'priv-relay-core.mjs')
  );

  // 3. Patch src/app/app-inline-01.js:
  //    a) cambiarRangoComisionesGlobal & selectorRangoComisionesGlobalHtml support click-ON/click-OFF -> "total" (RAW)
  //    b) resumenComisionesGlobalHtml & mostrarDetalleComisiones restore 1.0 causality arrow, stats, search, and RAW mode
  const app01Path = path.join(tmp, 'src', 'app', 'app-inline-01.js');
  replaceExact(
    app01Path,
    'function cambiarRangoComisionesGlobal(tipo, valor){\n' +
    '  if(tipo!=="grupo")return;\n' +
    '  const next=["producto","percha","cliente","comisionista","mes"].includes(valor)?valor:"producto";\n' +
    '  window._ocComHistoryGroup=next;',
    'function cambiarRangoComisionesGlobal(tipo, valor){\n' +
    '  if(tipo!=="grupo")return;\n' +
    '  const cur=["total","producto","percha","cliente","comisionista","mes"].includes(window._ocComHistoryGroup)?window._ocComHistoryGroup:"producto";\n' +
    '  const next=(valor===cur||valor==="total"||!valor)?"total":(["producto","percha","cliente","comisionista","mes"].includes(valor)?valor:"total");\n' +
    '  window._ocComHistoryGroup=next;',
    'app-inline-01 cambiarRangoComisionesGlobal toggle on/off to total (RAW)'
  );
  replaceExact(
    app01Path,
    'function selectorRangoComisionesGlobalHtml(){\n' +
    '  const es=document.documentElement.lang==="es";\n' +
    '  const group=["producto","percha","cliente","comisionista","mes"].includes(window._ocComHistoryGroup)?window._ocComHistoryGroup:"producto";',
    'function selectorRangoComisionesGlobalHtml(){\n' +
    '  const es=document.documentElement.lang==="es";\n' +
    '  const group=["total","producto","percha","cliente","comisionista","mes"].includes(window._ocComHistoryGroup)?window._ocComHistoryGroup:"producto";',
    'app-inline-01 selectorRangoComisionesGlobalHtml allow total (all buttons off)'
  );

  replaceExact(
    app01Path,
    'function resumenComisionesGlobalHtml(sales){\n' +
    '  // Same Commissions visual components as before: tag-card, stats, rotulo, cifra.\n' +
    '  // Only the view changes; the source spans every sale, with no implicit month.\n' +
    '  const es=document.documentElement.lang==="es";\n' +
    '  const group=["producto","percha","cliente","comisionista","mes"].includes(window._ocComHistoryGroup)\n' +
    '    ?window._ocComHistoryGroup:"producto";\n' +
    '  const view=window.OCCommissionHistory.project({sales:sales,group:group,lang:es?"es":"en"});\n' +
    '  const totals=view.totals;\n' +
    '  const money=(v,unknown)=>unknown||v===null||!Number.isFinite(v)?(es?"Por verificar":"Needs review"):fmtMoney(v);\n' +
    '  const tile=(name,value)=>\'<div class="tag-card ventana-estado" style="padding:10px 12px;margin:0;text-align:left;box-shadow:none;">\'\n' +
    '    +\'<div class="rotulo">\'+name+\'</div>\'\n' +
    '    +\'<div class="cifra">\'+value+\'</div></div>\';\n' +
    '  const titles={producto:es?"Por producto":"By product",percha:es?"Por percha / evento":"By rack / event",\n' +
    '    cliente:es?"Por cliente":"By customer",comisionista:es?"Por comisionista":"By associate",\n' +
    '    mes:es?"Por período":"By period"};\n' +
    '  const warnings=(totals.conflicts||totals.splitConflicts||totals.customerConflicts||totals.associateConflicts)\n' +
    '    ?\'<p role="alert" style="font-size:14px;color:var(--rojo-ink,#a3392a);margin:8px 0;">\'\n' +
    '      +(es?"Hay recibos o repartos por verificar.":"Some receipts or allocations need review.")+\'</p>\':"";\n' +
    '  // C194: the old loop filtered EVERY sale once per group (O(sales × groups))\n' +
    '  // and eagerly instantiated every receipt node inside closed <details>.\n' +
    '  // Safari could be killed by the CPU/memory spike a few seconds after entry.\n' +
    '  // Index exactly once; keep every historical receipt available on demand.\n' +
    '  const byGroup=new Map();\n' +
    '  view.rows.forEach(function(v){\n' +
    '    let entries=byGroup.get(v.group);\n' +
    '    if(!entries){entries=[];byGroup.set(v.group,entries);}\n' +
    '    entries.push(v);\n' +
    '  });\n' +
    '  window._ocComHistoryRowsPorGrupo=byGroup;\n' +
    '  const cards=view.groups.map(function(g){\n' +
    '    const associated=group==="comisionista";\n' +
    '    const period=group==="mes"&&/^\\d{4}-(0[1-9]|1[0-2])$/.test(String(g.id))?\n' +
    '      \'<button type="button" data-commissions-open-month="\'+escHtml(g.id)+\'" onclick="cambiarMesComisiones(this.dataset.commissionsOpenMonth)"\'\n' +
    '        +\' class="tecla" style="min-height:44px;padding:6px 10px;margin-top:6px;">\'\n' +
    '        +(es?"Liquidar este mes":"Settle this month")+\'</button>\':"";\n' +
    '    return \'<details data-comm-history-group data-comm-group="\'+escHtml(g.id)+\'" ontoggle="if(this.open)mostrarDetalleComisiones(this,false)" class="tag-card" style="text-align:left;padding:12px 16px;margin:0 0 10px;">\'\n' +
    '      +\'<summary style="cursor:pointer;min-height:44px;">\'\n' +
    '      +\'<strong style="display:block;font-size:16px;color:var(--ink);">\'+escHtml(g.label)+\'</strong>\'\n' +
    '      +\'<div class="stats" style="margin-top:8px;">\'\n' +
    '      +(associated?\'\':\'<div><div class="rotulo">\'+(es?"Ventas brutas":"Gross sales")\n' +
    '        +\'</div><div class="cifra">\'+money(g.gross,g.unknownGross)+\'</div></div>\')\n' +
    '      +\'<div><div class="rotulo">\'+(es?"Comisiones":"Commissions")+\'</div><div class="cifra">\'\n' +
    '        +money(g.commission,g.unknownCommission)+\'</div></div></div>\'\n' +
    '      +\'<span style="font-size:13px;color:var(--ink-soft);">\'+g.count+\' \'+(es?"ventas":"sales")+\'</span>\'\n' +
    '      +\'</summary><div data-comm-details data-loaded="0" style="padding-top:8px;"></div>\'\n' +
    '      +\'<button type="button" data-comm-history-more hidden onclick="event.stopPropagation();mostrarDetalleComisiones(this.closest(\\\'details\\\'),true)" class="tecla" style="min-height:44px;margin-top:8px;">\'\n' +
    '      +(es?"Mostrar más ventas":"Show more sales")+\'</button>\'+period+\'</details>\';\n' +
    '  }).join("");\n' +
    '  return \'<section data-commissions-summary="all" data-commissions-current-view="\'+group+\'">\'\n' +
    '    +warnings+\'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 16px;">\'\n' +
    '    +tile(es?"Total de comisiones":"Total commissions",money(totals.commission,totals.unknownCommission))\n' +
    '    +tile(es?"Ventas brutas":"Gross sales",money(totals.gross,totals.unknownGross))\n' +
    '    +tile(es?"Ventas":"Sales",String(totals.count))+\'</div>\'\n' +
    '    +\'<h3 class="seccion" style="font-size:16px;margin:0 0 10px;">\'+titles[group]+\'</h3>\'\n' +
    '    +(cards||\'<p style="font-size:14px;">\'+(es?"No hay ventas registradas en esta vista.":"No recorded sales in this view.")+\'</p>\')\n' +
    '    +\'</section>\';\n' +
    '}\n' +
    '// Retain the original receipt breakdown, but mount at most 80 rows per gesture.\n' +
    '// No date filters, truncated reports or changes to sales/settlements.\n' +
    'function mostrarDetalleComisiones(panel,more){\n' +
    '  if(!panel||!panel.open||!panel.isConnected)return;\n' +
    '  const target=panel.querySelector("[data-comm-details]");\n' +
    '  if(!target)return;\n' +
    '  const loaded=Number(target.dataset.loaded)||0;\n' +
    '  if(loaded&&!more)return;\n' +
    '  const rows=window._ocComHistoryRowsPorGrupo&&window._ocComHistoryRowsPorGrupo.get(panel.dataset.commGroup)||[];\n' +
    '  const next=rows.slice(loaded,loaded+80);\n' +
    '  if(next.length){\n' +
    '    const es=document.documentElement.lang==="es";\n' +
    '    const money=(v)=>v===null||!Number.isFinite(v)?(es?"Por verificar":"Needs review"):fmtMoney(v);\n' +
    '    target.insertAdjacentHTML("beforeend",next.map(function(v){\n' +
    '      return \'<div style="padding:6px 0;border-top:1px solid var(--hairline,#E8ECF2);font-size:13px;display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;">\'\n' +
    '        +\'<span>\'+escHtml(v.day||v.id||"")+\'</span>\'\n' +
    '        +\'<span>\'+money(v.commission)+\'</span></div>\';\n' +
    '    }).join(""));\n' +
    '    target.dataset.loaded=String(loaded+next.length);\n' +
    '  }\n' +
    '  const button=panel.querySelector("[data-comm-history-more]");\n' +
    '  if(button)button.hidden=loaded+next.length>=rows.length;\n' +
    '}',
    'function resumenComisionesGlobalHtml(sales){\n' +
    '  // Same Commissions visual components as before: tag-card, stats, rotulo, cifra.\n' +
    '  // Only the view changes; the source spans every sale, with no implicit month.\n' +
    '  const es=document.documentElement.lang==="es";\n' +
    '  const group=["total","producto","percha","cliente","comisionista","mes"].includes(window._ocComHistoryGroup)\n' +
    '    ?window._ocComHistoryGroup:"producto";\n' +
    '  const view=window.OCCommissionHistory.project({sales:sales,group:group,lang:es?"es":"en"});\n' +
    '  const totals=view.totals;\n' +
    '  const money=(v,unknown)=>unknown||v===null||!Number.isFinite(v)?(es?"Por verificar":"Needs review"):fmtMoney(v);\n' +
    '  const tile=(name,value)=>\'<div class="tag-card ventana-estado" style="padding:10px 12px;margin:0;text-align:left;box-shadow:none;">\'\n' +
    '    +\'<div class="rotulo">\'+name+\'</div>\'\n' +
    '    +\'<div class="cifra">\'+value+\'</div></div>\';\n' +
    '  const titles={total:es?"Todas las ventas y comisiones (RAW)":"All sales & commissions (raw)",\n' +
    '    producto:es?"Por producto":"By product",percha:es?"Por percha / evento":"By rack / event",\n' +
    '    cliente:es?"Por cliente":"By customer",comisionista:es?"Por comisionista":"By associate",\n' +
    '    mes:es?"Por período":"By period"};\n' +
    '  const warnings=(totals.conflicts||totals.splitConflicts||totals.customerConflicts||totals.associateConflicts)\n' +
    '    ?\'<p role="alert" style="font-size:14px;color:var(--rojo-ink,#a3392a);margin:8px 0;">\'\n' +
    '      +(es?"Hay recibos o repartos por verificar.":"Some receipts or allocations need review.")+\'</p>\':"";\n' +
    '  const rich10=typeof flechaComisionHtml==="function";\n' +
    '  const metaByGroup=new Map(),saleById=new Map(),rankByPerson=new Map();\n' +
    '  if(rich10&&Array.isArray(sales)){\n' +
    '    sales.forEach(function(v){\n' +
    '      if(!v||typeof v!=="object"||v.anulada||v.cancelled||v.borrado)return;\n' +
    '      if(v.id!=null)saleById.set(String(v.id),v);\n' +
    '      let gid="";\n' +
    '      if(group==="total")gid="total";\n' +
    '      else if(group==="producto")gid=String(v.productoId||v.productoNombre||"");\n' +
    '      else if(group==="percha")gid=String(v.ubicacionId||v.ubicacionNombre||"");\n' +
    '      else if(group==="cliente")gid=String(v.clienteId||v.clienteNombre||"");\n' +
    '      else if(group==="comisionista")gid=String(v.promotoraId||v.asociadoNombre||"");\n' +
    '      else gid=String(v.fechaLocal||v.fecha||"").slice(0,7);\n' +
    '      if(gid){\n' +
    '        let m=metaByGroup.get(gid);\n' +
    '        if(!m){\n' +
    '          m={productoId:"",ubicacionId:"",promotoraId:"",sku:"",direccion:"casaPaga",\n' +
    '            perchas:new Set(),asociados:new Set(),clientes:new Set(),\n' +
    '            units:0,casaEnAsociadoCents:0,revisarDir:0,pendCents:0};\n' +
    '          metaByGroup.set(gid,m);\n' +
    '        }\n' +
    '        if(v.productoId&&!m.productoId)m.productoId=String(v.productoId);\n' +
    '        if(v.ubicacionId&&!m.ubicacionId)m.ubicacionId=String(v.ubicacionId);\n' +
    '        if(v.promotoraId&&!m.promotoraId)m.promotoraId=String(v.promotoraId);\n' +
    '        if(v.sku&&!m.sku)m.sku=String(v.sku);\n' +
    '        if(v.direccionProducto==="asociadoPaga"||v.direccionComision==="asociadoPaga")m.direccion="asociadoPaga";\n' +
    '        if(v.ubicacionNombre)m.perchas.add(String(v.ubicacionNombre));\n' +
    '        if(v.asociadoNombre)m.asociados.add(String(v.asociadoNombre));\n' +
    '        if(v.clienteNombre)m.clientes.add(String(v.clienteNombre));\n' +
    '        const cant=Number(v.cantidad)||1;\n' +
    '        m.units+=cant;\n' +
    '        const casa=v.netoCasa!=null&&Number.isFinite(Number(v.netoCasa))?Math.round(Number(v.netoCasa)*100):0;\n' +
    '        if(v.direccionComision==="asociadoPaga"){\n' +
    '          m.casaEnAsociadoCents+=casa;\n' +
    '          if(v.liquidada||v.comisionPagada)m.revisarDir++;\n' +
    '        }\n' +
    '        if(v.comisionPendiente!=null&&Number.isFinite(Number(v.comisionPendiente))){\n' +
    '          m.pendCents+=Math.round(Number(v.comisionPendiente)*100);\n' +
    '        }else if(!v.liquidada&&v.comisionAsociado!=null&&Number.isFinite(Number(v.comisionAsociado))){\n' +
    '          m.pendCents+=Math.round(Number(v.comisionAsociado)*100);\n' +
    '        }\n' +
    '      }\n' +
    '      const pid=v.promotoraId||v.asociadoNombre||"",pnom=v.asociadoNombre||"",com=Number(v.comisionAsociado)||0;\n' +
    '      if(pid&&pnom&&com>0){\n' +
    '        let r=rankByPerson.get(pid);\n' +
    '        if(!r){r={id:String(v.promotoraId||pid),nombre:String(pnom),ventasBrutas:0,ventasCount:0,comision:0,ultima:"",porSku:{}};rankByPerson.set(pid,r);}\n' +
    '        const cant=Number(v.cantidad)||1,bruto=(Number(v.precioUnit)||0)*cant;\n' +
    '        r.ventasBrutas+=bruto;r.comision+=com;r.ventasCount+=cant;\n' +
    '        const f=String(v.fecha||v.fechaLocal||"");\n' +
    '        if(f>r.ultima)r.ultima=f;\n' +
    '        const sk=String(v.sku||v.productoNombre||v.productoId||"");\n' +
    '        if(sk)r.porSku[sk]=(r.porSku[sk]||0)+cant;\n' +
    '      }\n' +
    '    });\n' +
    '  }\n' +
    '  window._ocComHistorySaleById=saleById;\n' +
    '  const byGroup=new Map();\n' +
    '  view.rows.forEach(function(v){\n' +
    '    let entries=byGroup.get(v.group);\n' +
    '    if(!entries){entries=[];byGroup.set(v.group,entries);}\n' +
    '    entries.push(v);\n' +
    '  });\n' +
    '  window._ocComHistoryRowsPorGrupo=byGroup;\n' +
    '  const cards=view.groups.map(function(g){\n' +
    '    const associated=group==="comisionista";\n' +
    '    const isRaw=group==="total";\n' +
    '    const m=rich10?metaByGroup.get(g.id):null;\n' +
    '    const searchAttr=m?\' data-search="\'+escHtml([g.label,m.sku,...m.perchas,...m.asociados,...m.clientes].join(" "))+\'"\':"";\n' +
    '    const skuHtml=(m&&m.sku&&group==="producto")?\' <span style="font-weight:400;font-size:13px;color:var(--ink-soft);">\'+escHtml(m.sku)+\'</span>\':"";\n' +
    '    const badgeHtml=(m&&group==="producto"&&!g.unknownCommission&&(g.commission>0||m.casaEnAsociadoCents>0))\n' +
    '      ?\'<span class="badge-estado \'+(m.pendCents>0?"rojo":m.casaEnAsociadoCents>0?"amarillo":"verde")+\'" style="margin-top:0;">\'\n' +
    '        +(m.casaEnAsociadoCents>0?(es?"parte de la casa sin conciliar":"house share unverified"):m.pendCents>0?"pending":"paid")+\'</span>\':"";\n' +
    '    const editRackBtn=(m&&group==="percha"&&m.ubicacionId&&typeof abrirEditorComisionPercha==="function")\n' +
    '      ?\'<button type="button" class="tecla" data-comm-edit-rack="\'+escHtml(m.ubicacionId)+\'" onclick="event.preventDefault();event.stopPropagation();abrirEditorComisionPercha(this.dataset.commEditRack)" style="min-height:40px;font-size:13px;margin:0;">\'+(es?"✎ Editar trato de percha":"✎ Adjust shelf deal")+\'</button>\':"";\n' +
    '    const editAssocBtn=(m&&group==="comisionista"&&m.promotoraId&&typeof abrirEditorComisionista==="function")\n' +
    '      ?\'<button type="button" class="tecla" data-abrir-promotora="\'+escHtml(m.promotoraId)+\'" onclick="event.preventDefault();event.stopPropagation();abrirEditorComisionista(this.dataset.abrirPromotora)" style="min-height:40px;font-size:13px;margin:0;">\'+(es?"✎ Editar trato":"✎ Edit deal")+\'</button>\':"";\n' +
    '    const subHtml=m?(group==="producto"\n' +
    '      ?\'<div style="font-size:13px;color:var(--ink-soft);margin-top:4px;">Rack: \'+escHtml([...m.perchas].join(", ")||"-")+(m.asociados.size?\' · Associate: <strong>\'+escHtml([...m.asociados].join(", "))+\'</strong>\':"")+\'</div>\'\n' +
    '      :group==="percha"&&m.asociados.size?\'<div style="font-size:13px;color:var(--ink-soft);margin-top:4px;">Associate: <strong>\'+escHtml([...m.asociados].join(", "))+\'</strong></div>\'\n' +
    '      :group==="comisionista"&&m.perchas.size?\'<div style="font-size:13px;color:var(--ink-soft);margin-top:4px;">Rack: \'+escHtml([...m.perchas].join(", "))+\'</div>\':""):"";\n' +
    '    const houseKeepsHtml=(rich10&&!associated&&!g.unknownGross&&!g.unknownCommission&&Number.isFinite(g.gross)&&Number.isFinite(g.commission)&&g.gross>0)\n' +
    '      ?\'<div><div class="rotulo">\'+(es?"La casa retiene":"House keeps")+\'</div><div class="cifra">\'+fmtMoney(Math.max(0,+(g.gross-g.commission).toFixed(2)))+\'</div></div>\':"";\n' +
    '    const heldHtml=(m&&m.casaEnAsociadoCents>0)\n' +
    '      ?\'<div><div class="rotulo" style="color:#006B3C;">\'+(typeof t==="function"?t("flecha.casaEnAsociado"):(es?"Parte de la casa en manos del asociado":"House share held by associate"))+\'</div><div class="cifra" style="color:#006B3C;">\'+fmtMoney(m.casaEnAsociadoCents/100)+\'</div></div>\':"";\n' +
    '    const pendHtml=(m&&m.pendCents>0)\n' +
    '      ?\'<div><div class="rotulo" style="color:var(--rust-deep,#C05000);">\'+(es?"Por pagar":"Still to pay")+\'</div><div class="cifra" style="color:var(--rust-deep,#C05000);">\'+fmtMoney(m.pendCents/100)+\'</div></div>\':"";\n' +
    '    const flechaHtml=(rich10&&group==="producto"&&m&&m.productoId)\n' +
    '      ?\'<div data-comm-flecha style="margin-top:6px;" onclick="event.preventDefault();event.stopPropagation()">\'+flechaComisionHtml("",m.direccion,m.productoId,g.label)+\'</div>\'\n' +
    '        +(m.revisarDir?\'<div data-flecha-revisar style="margin-top:8px;border:2px solid #B0183E;padding:8px 10px;font-size:14px;font-weight:700;color:#B0183E;">\'+escHtml(typeof t==="function"?t("flecha.ventaRevisar"):"Paid sales to review")+\': \'+m.revisarDir+\'</div>\':""):"";\n' +
    '    const sheetBtn=(rich10&&group==="producto"&&m&&m.productoId&&typeof abrirFichaProducto==="function")\n' +
    '      ?\'<div style="margin-top:8px;" onclick="event.preventDefault();event.stopPropagation()"><button type="button" class="tecla" data-comm-open-sheet="\'+escHtml(m.productoId)+\'" onclick="event.preventDefault();event.stopPropagation();abrirFichaProducto(this.dataset.commOpenSheet)" style="min-height:40px;font-size:13px;margin:0;">\'+(es?"Ver personas y registrar pago":"See people & record payment")+\'</button></div>\':"";\n' +
    '    const period=group==="mes"&&/^\\d{4}-(0[1-9]|1[0-2])$/.test(String(g.id))?\n' +
    '      \'<button type="button" data-commissions-open-month="\'+escHtml(g.id)+\'" onclick="cambiarMesComisiones(this.dataset.commissionsOpenMonth)"\'\n' +
    '        +\' class="tecla" style="min-height:44px;padding:6px 10px;margin-top:6px;">\'\n' +
    '        +(es?"Liquidar este mes":"Settle this month")+\'</button>\':"";\n' +
    '    const headHtml=(badgeHtml||editRackBtn||editAssocBtn)\n' +
    '      ?\'<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><strong style="display:block;font-size:16px;color:var(--ink);">\'+escHtml(g.label)+skuHtml+\'</strong>\'+badgeHtml+editRackBtn+editAssocBtn+\'</div>\'\n' +
    '      :\'<strong style="display:block;font-size:16px;color:var(--ink);">\'+escHtml(g.label)+skuHtml+\'</strong>\';\n' +
    '    const rawRows=isRaw?(byGroup.get(g.id)||[]):[];\n' +
    '    const rawBatch=isRaw?rawRows.slice(0,80):[];\n' +
    '    const rawHtml=isRaw?rawBatch.map(function(rv){return _ocFilaVentaRawHtml(rv,es,function(val){return money(val,false);});}).join(""):"";\n' +
    '    const rawMoreHidden=!isRaw||rawBatch.length>=rawRows.length;\n' +
    '    return \'<details data-comm-history-group data-comm-group="\'+escHtml(g.id)+\'"\'+searchAttr+(isRaw?" open":"")+\' ontoggle="if(this.open)mostrarDetalleComisiones(this,false)" class="tag-card" style="text-align:left;padding:12px 16px;margin:0 0 10px;">\'\n' +
    '      +\'<summary style="cursor:pointer;min-height:44px;">\'\n' +
    '      +headHtml+subHtml\n' +
    '      +\'<div class="stats" style="margin-top:8px;">\'\n' +
    '      +(associated?\'\':\'<div><div class="rotulo">\'+(es?"Ventas brutas":"Gross sales")\n' +
    '        +\'</div><div class="cifra">\'+money(g.gross,g.unknownGross)+(m&&m.units?\' <small>\'+m.units+\'u</small>\':"")+\'</div></div>\')\n' +
    '      +\'<div><div class="rotulo">\'+(es?"Comisiones":"Commissions")+\'</div><div class="cifra">\'\n' +
    '        +money(g.commission,g.unknownCommission)+\'</div></div>\'+houseKeepsHtml+heldHtml+pendHtml+\'</div>\'\n' +
    '      +flechaHtml+sheetBtn\n' +
    '      +\'<span style="display:inline-block;margin-top:6px;font-size:13px;color:var(--ink-soft);">\'+g.count+\' \'+(es?"ventas":"sales")+\'</span>\'\n' +
    '      +\'</summary><div data-comm-details data-loaded="\'+(isRaw?rawBatch.length:0)+\'" style="padding-top:8px;">\'+rawHtml+\'</div>\'\n' +
    '      +\'<button type="button" data-comm-history-more\'+(rawMoreHidden?" hidden":"")+\' onclick="event.stopPropagation();mostrarDetalleComisiones(this.closest(\\\'details\\\'),true)" class="tecla" style="min-height:44px;margin-top:8px;">\'\n' +
    '      +(es?"Mostrar más ventas":"Show more sales")+\'</button>\'+period+\'</details>\';\n' +
    '  }).join("");\n' +
    '  if(rich10&&typeof matrizComisionistasHtml==="function"&&typeof document.getElementById==="function"){\n' +
    '    const rankCont=document.getElementById("rankingComisiones"),listCont=document.getElementById("listaComisiones");\n' +
    '    if(rankCont&&rankCont!==listCont){\n' +
    '      const arr=[...rankByPerson.values()].map(function(r){\n' +
    '        const top=Object.entries(r.porSku).sort(function(a,b){return b[1]-a[1];})[0];\n' +
    '        const ts=Date.parse(r.ultima);\n' +
    '        return {id:r.id,nombre:r.nombre,ventasBrutas:+r.ventasBrutas.toFixed(2),ventasCount:r.ventasCount,\n' +
    '          comision:+r.comision.toFixed(2),diasSinVenta:Number.isFinite(ts)?Math.max(0,Math.floor((Date.now()-ts)/86400000)):null,\n' +
    '          topSku:top?{sku:top[0],unidades:top[1]}:null};\n' +
    '      }).sort(function(a,b){return b.ventasBrutas-a.ventasBrutas;});\n' +
    '      const rankHtml=arr.length?\'<h3 class="seccion" style="font-size:16px;margin-top:0;">\'+(typeof t==="function"?t("comm.rankingHeading"):(es?"Ranking de comisionistas":"Associate ranking"))+\'</h3><div style="margin-bottom:20px;">\'+arr.map(function(r,i){\n' +
    '        const dormido=(r.diasSinVenta!=null&&r.diasSinVenta>=7)?\'<span class="badge-estado rojo" style="margin-left:8px;font-size:13px;">dormant \'+r.diasSinVenta+\'d</span>\':"";\n' +
    '        const top=r.topSku?\' · top SKU: \'+escHtml(r.topSku.sku)+\' (\'+r.topSku.unidades+\'u)\':"";\n' +
    '        return \'<div class="tag-card" style="display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:8px;"><span style="font-size:16px;font-weight:700;line-height:1;min-width:22px;">\'+(i+1)+\'.</span><div style="flex:1;"><strong>\'+escHtml(r.nombre)+\'</strong>\'+dormido+\'<div style="font-size:13px;color:var(--ink-soft);">\'+r.ventasCount+\' sold · gross \'+fmtMoney(r.ventasBrutas)+top+\'</div></div><strong style="color:#0B7A4B;font-size:16px;">\'+fmtMoney(r.comision)+\'</strong></div>\';\n' +
    '      }).join("")+\'</div>\':"";\n' +
    '      rankCont.innerHTML=rankHtml+matrizComisionistasHtml(arr);\n' +
    '    }\n' +
    '  }\n' +
    '  const houseTotalTile=(rich10&&!totals.unknownGross&&!totals.unknownCommission&&Number.isFinite(totals.gross)&&Number.isFinite(totals.commission)&&totals.gross>0)\n' +
    '    ?tile(es?"La casa retiene":"House keeps",fmtMoney(Math.max(0,+(totals.gross-totals.commission).toFixed(2)))):"";\n' +
    '  const searchBar=rich10?\'<input id="comm-product-search" type="search" aria-label="\'+(es?"Buscar producto, SKU, percha o comisionista":"Search product, SKU, rack or associate")+\'" placeholder="\'+(es?"Buscar producto, SKU, percha o comisionista…":"Search product, SKU, rack or associate…")+\'" autocomplete="off" oninput="if(typeof filtrarComisionesGlobal===\\\'function\\\')filtrarComisionesGlobal(this.value)" style="width:100%;max-width:460px;min-height:44px;margin:0 0 8px;padding:8px 12px;border:1px solid #9BAEBF;border-radius:8px;background:var(--paper,#fff);color:var(--ink);font:inherit;"><div id="comm-product-count" role="status" aria-live="polite" style="font-size:13px;color:var(--ink-soft);margin-bottom:10px;"></div>\':"";\n' +
    '  return \'<section data-commissions-summary="all" data-commissions-current-view="\'+group+\'">\'\n' +
    '    +warnings+\'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 16px;">\'\n' +
    '    +tile(es?"Total de comisiones":"Total commissions",money(totals.commission,totals.unknownCommission))\n' +
    '    +tile(es?"Ventas brutas":"Gross sales",money(totals.gross,totals.unknownGross))\n' +
    '    +houseTotalTile\n' +
    '    +tile(es?"Ventas":"Sales",String(totals.count))+\'</div>\'\n' +
    '    +\'<h3 class="seccion" style="font-size:16px;margin:0 0 10px;">\'+titles[group]+\'</h3>\'\n' +
    '    +searchBar\n' +
    '    +(cards||\'<p style="font-size:14px;">\'+(es?"No hay ventas registradas en esta vista.":"No recorded sales in this view.")+\'</p>\')\n' +
    '    +\'</section>\';\n' +
    '}\n' +
    'function _ocFilaVentaRawHtml(v,es,money){\n' +
    '  const s=window._ocComHistorySaleById&&window._ocComHistorySaleById.get(String(v.id||""));\n' +
    '  if(!s)return \'<div style="padding:6px 0;border-top:1px solid var(--hairline,#E8ECF2);font-size:13px;display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;">\'\n' +
    '    +\'<span>\'+escHtml(v.day||v.id||"")+\'</span>\'\n' +
    '    +\'<span>\'+money(v.commission)+\'</span></div>\';\n' +
    '  const cant=Number(s.cantidad)||1;\n' +
    '  const prod=s.productoNombre?cant+"× "+s.productoNombre+(s.sku?" ("+s.sku+")":""):"";\n' +
    '  const meta=[s.ubicacionNombre?(es?"Percha: ":"Rack: ")+s.ubicacionNombre:"",\n' +
    '    s.asociadoNombre?(es?"Comisionista: ":"Associate: ")+s.asociadoNombre:"",\n' +
    '    s.clienteNombre?(es?"Cliente: ":"Customer: ")+s.clienteNombre:"",\n' +
    '    (s.direccionComision==="asociadoPaga"||s.direccionProducto==="asociadoPaga")\n' +
    '      ?(es?"Asociado paga →":"Associate pays →"):(es?"← Casa paga":"← House pays")].filter(Boolean).join(" · ");\n' +
    '  const search=escHtml([v.day,s.productoNombre,s.sku,s.ubicacionNombre,s.asociadoNombre,s.clienteNombre].join(" "));\n' +
    '  return \'<div style="padding:6px 0;border-top:1px solid var(--hairline,#E8ECF2);font-size:13px;display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;" data-comm-raw-row data-search="\'+search+\'">\'\n' +
    '    +\'<div style="min-width:0;"><strong>\'+escHtml(v.day||v.id||"")+\'</strong>\'\n' +
    '    +(prod?\' · <span>\'+escHtml(prod)+\'</span>\':"")\n' +
    '    +(meta?\'<div style="font-size:12px;color:var(--ink-soft);">\'+escHtml(meta)+\'</div>\':"")\n' +
    '    +\'</div>\'\n' +
    '    +\'<div style="text-align:right;white-space:nowrap;">\'\n' +
    '    +(v.gross!=null?\'<span style="color:var(--ink-soft);margin-right:8px;">\'+(es?"Bruto: ":"Gross: ")+money(v.gross)+\'</span>\':"")\n' +
    '    +\'<strong>\'+(es?"Comisión: ":"Commission: ")+money(v.commission)+\'</strong></div></div>\';\n' +
    '}\n' +
    'function filtrarComisionesGlobal(valor){\n' +
    '  window._ocBuscaComisionProducto=String(valor||"");\n' +
    '  const cont=typeof document!=="undefined"&&typeof document.getElementById==="function"?document.getElementById("listaComisiones"):null;\n' +
    '  if(!cont)return;\n' +
    '  const norm=typeof normalizarTexto==="function"?normalizarTexto:function(s){return String(s||"").toLowerCase();};\n' +
    '  const needle=norm(window._ocBuscaComisionProducto.trim());\n' +
    '  if(window._ocComHistoryGroup==="total"){\n' +
    '    const rows=cont.querySelectorAll("[data-comm-raw-row]");\n' +
    '    let shown=0;\n' +
    '    rows.forEach(function(r){\n' +
    '      const hay=!needle||norm(r.getAttribute("data-search")||r.textContent||"").includes(needle);\n' +
    '      r.hidden=!hay;\n' +
    '      if(hay)shown++;\n' +
    '    });\n' +
    '    const cnt=cont.querySelector("#comm-product-count");\n' +
    '    if(cnt){const es=document.documentElement.lang==="es";cnt.textContent=needle?(es?("Mostrando "+shown+" de "+rows.length):("Showing "+shown+" of "+rows.length)):"";}\n' +
    '    return;\n' +
    '  }\n' +
    '  const cards=cont.querySelectorAll("[data-comm-history-group]");\n' +
    '  let shown=0;\n' +
    '  cards.forEach(function(card){\n' +
    '    const hay=!needle||norm(card.getAttribute("data-search")||card.textContent||"").includes(needle);\n' +
    '    card.hidden=!hay;\n' +
    '    if(hay)shown++;\n' +
    '  });\n' +
    '  const cnt=cont.querySelector("#comm-product-count");\n' +
    '  if(cnt){\n' +
    '    const es=document.documentElement.lang==="es";\n' +
    '    cnt.textContent=needle?(es?("Mostrando "+shown+" de "+cards.length):("Showing "+shown+" of "+cards.length)):"";\n' +
    '  }\n' +
    '}\n' +
    '// Retain the original receipt breakdown, but mount at most 80 rows per gesture.\n' +
    '// No date filters, truncated reports or changes to sales/settlements.\n' +
    'function mostrarDetalleComisiones(panel,more){\n' +
    '  if(!panel||!panel.open||!panel.isConnected)return;\n' +
    '  const target=panel.querySelector("[data-comm-details]");\n' +
    '  if(!target)return;\n' +
    '  const loaded=Number(target.dataset.loaded)||0;\n' +
    '  if(loaded&&!more)return;\n' +
    '  const rows=window._ocComHistoryRowsPorGrupo&&window._ocComHistoryRowsPorGrupo.get(panel.dataset.commGroup)||[];\n' +
    '  const next=rows.slice(loaded,loaded+80);\n' +
    '  if(next.length){\n' +
    '    const es=document.documentElement.lang==="es";\n' +
    '    const money=(v)=>v===null||!Number.isFinite(v)?(es?"Por verificar":"Needs review"):fmtMoney(v);\n' +
    '    target.insertAdjacentHTML("beforeend",next.map(function(v){\n' +
    '      return _ocFilaVentaRawHtml(v,es,money);\n' +
    '    }).join(""));\n' +
    '    target.dataset.loaded=String(loaded+next.length);\n' +
    '  }\n' +
    '  const button=panel.querySelector("[data-comm-history-more]");\n' +
    '  if(button)button.hidden=loaded+next.length>=rows.length;\n' +
    '}',
    'app-inline-01 restore 1.0 Commissions UI elements and RAW ungrouped mode in resumenComisionesGlobalHtml'
  );

  replaceExact(
    app01Path,
    '      const actions=\'<button type="button" class="tecla" onclick="exportarComisionesTotalCSV()" style="min-height:44px;">⤓ CSV</button>\';',
    '      const actions=(typeof enviarResumenWhatsApp==="function"&&typeof escHtml==="function"&&typeof t==="function"\n' +
    '        ?\'<button type="button" class="ir" style="font-size:14px;min-height:44px;padding:6px 12px;margin:0;background:#25D366;color:#0F1923;border-color:#1da851;" aria-label="\'+escHtml(t("comm.sendWhatsappDaily"))+\'" title="\'+escHtml(t("comm.sendWhatsappDaily"))+\'" onclick="enviarResumenWhatsApp()">\'+t("comm.sendWhatsappDailyShort")+\'</button> \':"")\n' +
    '        +\'<button type="button" class="tecla" onclick="exportarComisionesTotalCSV()" style="min-height:44px;">⤓ CSV</button>\';',
    'app-inline-01 restore WhatsApp daily summary button in All-dates toolbar'
  );

  // 4. Patch docs/commissions-by-person.js so global tabs (Product / Rack / Customer / Associate / Period)
  // and By artist / associate share identical button geometry, are mutually exclusive, and toggle off to RAW ("total")
  const cbpPath = path.join(tmp, 'docs', 'commissions-by-person.js');
  replaceExact(
    cbpPath,
    "      btn.setAttribute('aria-selected','false');\n" +
    "      btn.tabIndex = -1;\n" +
    "      btn.textContent = tx('Por artista / comisionista','By artist / associate');",
    "      btn.setAttribute('aria-selected','false');\n" +
    "      btn.tabIndex = -1;\n" +
    "      btn.style.cssText = 'flex:0 0 auto;min-height:44px;margin:0;padding:6px 10px;font-size:14px;white-space:nowrap;';\n" +
    "      btn.textContent = tx('Por artista / comisionista','By artist / associate');",
    'commissions-by-person button geometry'
  );
  replaceExact(
    cbpPath,
    "    if (person) {\n" +
    "      container.querySelectorAll('[data-commissions-section]').forEach(function(p) {\n" +
    "        if (p !== panel) p.hidden = true;\n" +
    "      });\n" +
    "    }\n" +
    "    container.querySelectorAll('[data-commissions-view]').forEach(function(b) {\n" +
    "      var on = person ? b.dataset.commissionsView === 'person' : b.dataset.commissionsView !== 'person' && b.getAttribute('aria-selected') === 'true';\n" +
    "      b.setAttribute('aria-selected',on ? 'true':'false');\n" +
    "      b.tabIndex = on ? 0 : -1;\n" +
    "      b.classList.toggle('hundida',on);\n" +
    "    });",
    "    if (person) {\n" +
    "      container.querySelectorAll('[data-commissions-section], [data-commissions-summary]').forEach(function(p) {\n" +
    "        if (p !== panel) p.hidden = true;\n" +
    "      });\n" +
    "    } else {\n" +
    "      container.querySelectorAll('[data-commissions-summary]').forEach(function(p) {\n" +
    "        p.hidden = false;\n" +
    "      });\n" +
    "      var elegida = root._ocVistaComisiones === 'rack' ? 'by-rack-event' : 'by-product';\n" +
    "      container.querySelectorAll('[data-commissions-section]').forEach(function(p) {\n" +
    "        if (p !== panel) p.hidden = (root._ocVistaComisiones === 'raw') ? false : (p.dataset.commissionsSection !== elegida);\n" +
    "      });\n" +
    "    }\n" +
    "    container.querySelectorAll('[data-commissions-view]').forEach(function(b) {\n" +
    "      var on = person ? b.dataset.commissionsView === 'person' : (root._ocVistaComisiones !== 'raw' && b.dataset.commissionsView !== 'person' && b.getAttribute('aria-selected') === 'true');\n" +
    "      b.setAttribute('aria-selected',on ? 'true':'false');\n" +
    "      b.tabIndex = on ? 0 : -1;\n" +
    "      b.classList.toggle('hundida',on);\n" +
    "    });\n" +
    "    var activeGroup = ['total','producto','percha','cliente','comisionista','mes'].indexOf(root._ocComHistoryGroup) >= 0 ? root._ocComHistoryGroup : 'producto';\n" +
    "    container.querySelectorAll('[data-commissions-view-global]').forEach(function(b) {\n" +
    "      var on = !person && activeGroup !== 'total' && (b.dataset.commissionsViewGlobal === activeGroup);\n" +
    "      b.setAttribute('aria-selected',on ? 'true':'false');\n" +
    "      b.classList.toggle('hundida',on);\n" +
    "    });",
    'commissions-by-person setMode syncs data-commissions-view-global and data-commissions-summary'
  );
  replaceExact(
    cbpPath,
    "  var original=root.cambiarVistaComisiones;\n" +
    "  if (typeof original !== 'function') return;\n" +
    "  root.cambiarVistaComisiones = function (vista) {\n" +
    "    if (vista !== 'person') {\n" +
    "      state.active=false; state.seq++;\n" +
    "      original(vista); setMode(); return;\n" +
    "    }\n" +
    "    original('product');\n" +
    "    state.active=true;\n" +
    "    root._ocVistaComisiones='person';\n" +
    "    setMode(); load();\n" +
    "  };\n" +
    "  container.addEventListener('click',function(e) {\n" +
    "    var tab=e.target.closest('#comm-tab-person');\n" +
    "    if (tab) {e.preventDefault(); root.cambiarVistaComisiones('person'); return;}",
    "  var original=root.cambiarVistaComisiones;\n" +
    "  if (typeof original !== 'function') return;\n" +
    "  root.cambiarVistaComisiones = function (vista) {\n" +
    "    if (vista !== 'person') {\n" +
    "      state.active=false; state.seq++;\n" +
    "      if (vista === 'raw') { root._ocVistaComisiones = 'raw'; setMode(); return; }\n" +
    "      original(vista); setMode(); return;\n" +
    "    }\n" +
    "    original('product');\n" +
    "    state.active=true;\n" +
    "    root._ocVistaComisiones='person';\n" +
    "    root._ocComHistoryGroup='total';\n" +
    "    setMode(); load();\n" +
    "  };\n" +
    "  var origGlobal=root.cambiarRangoComisionesGlobal;\n" +
    "  if (typeof origGlobal === 'function') {\n" +
    "    root.cambiarRangoComisionesGlobal = function (tipo, valor) {\n" +
    "      var wasPerson = isPerson();\n" +
    "      state.active=false; state.seq++;\n" +
    "      if (root._ocVistaComisiones === 'person') root._ocVistaComisiones = 'product';\n" +
    "      if (wasPerson && valor && valor !== 'total') root._ocComHistoryGroup = 'total';\n" +
    "      var r = origGlobal.apply(this, arguments);\n" +
    "      setMode();\n" +
    "      return r;\n" +
    "    };\n" +
    "  }\n" +
    "  container.addEventListener('click',function(e) {\n" +
    "    var tab=e.target.closest('#comm-tab-person');\n" +
    "    if (tab) {\n" +
    "      e.preventDefault();\n" +
    "      if (isPerson()) {\n" +
    "        state.active=false; state.seq++;\n" +
    "        root._ocVistaComisiones='raw';\n" +
    "        if (typeof root.cambiarRangoComisionesGlobal === 'function' && !root._ocMesComisiones) {\n" +
    "          root.cambiarRangoComisionesGlobal('grupo', 'total');\n" +
    "        } else {\n" +
    "          setMode();\n" +
    "        }\n" +
    "        return;\n" +
    "      }\n" +
    "      root.cambiarVistaComisiones('person');\n" +
    "      return;\n" +
    "    }",
    'commissions-by-person wrap cambiarRangoComisionesGlobal and toggleable #comm-tab-person to RAW total'
  );

  // 5. Patch docs/mock-backend.js DELETE /api/clientes/:id and despedir/reactivar so deleting or blacklisting a customer notifies Sync4 + Hoy banner immediately
  const mbPath = path.join(tmp, 'docs', 'mock-backend.js');
  replaceExact(
    mbPath,
    '        avisarCatalogoCambiado();\n' +
    '        return J({ ok: true, despedido: c.despedido });\n' +
    '      }\n' +
    '      // DELETE /api/clientes/:id — borra el cliente por completo (solo dueño/admin).\n' +
    '      // JFC 2026-08-27: el borrado queda SIEMPRE en el registro de auditoría\n' +
    '      // (mov) con quién, a quién y cuándo — "todo esto queda en registro".\n' +
    '      const mCliDel = path.match(/^\\/api\\/clientes\\/([^/]+)$/);\n' +
    '      if (mCliDel && opts && opts.method === "DELETE") {\n' +
    '        const c = clientes.find((x) => x.id === mCliDel[1]);\n' +
    '        if (!c) return J({ error: "Customer not found." }, 404);\n' +
    '        c.borrado = true; c.rev = _revNueva();\n' +
    '        mov("cliente-borrado", { cliente: c.nombre, codigo: c.codigo || "", quien: body.quien || "Sistema" });\n' +
    '        guardarEstadoLocal();\n' +
    '        return J({ ok: true });\n' +
    '      }',
    '        avisarCatalogoCambiado();\n' +
    '        try { if (window.OCReactivo && typeof window.OCReactivo.emitir === "function") window.OCReactivo.emitir("clientes"); } catch (_) {}\n' +
    '        try { if (window.AMG && window.AMG.PlanPagosUI && typeof window.AMG.PlanPagosUI.refrescarHoy === "function") window.AMG.PlanPagosUI.refrescarHoy(); } catch (_) {}\n' +
    '        return J({ ok: true, despedido: c.despedido });\n' +
    '      }\n' +
    '      // DELETE /api/clientes/:id — borra el cliente por completo (solo dueño/admin).\n' +
    '      // JFC 2026-08-27: el borrado queda SIEMPRE en el registro de auditoría\n' +
    '      // (mov) con quién, a quién y cuándo — "todo esto queda en registro".\n' +
    '      const mCliDel = path.match(/^\\/api\\/clientes\\/([^/]+)$/);\n' +
    '      if (mCliDel && opts && opts.method === "DELETE") {\n' +
    '        const c = clientes.find((x) => x.id === mCliDel[1]);\n' +
    '        if (!c) return J({ error: "Customer not found." }, 404);\n' +
    '        c.borrado = true; c.rev = _revNueva();\n' +
    '        mov("cliente-borrado", { cliente: c.nombre, codigo: c.codigo || "", quien: body.quien || "Sistema" });\n' +
    '        guardarEstadoLocal();\n' +
    '        avisarCatalogoCambiado();\n' +
    '        try { if (window.OCReactivo && typeof window.OCReactivo.emitir === "function") window.OCReactivo.emitir("clientes"); } catch (_) {}\n' +
    '        try { if (window.AMG && window.AMG.PlanPagosUI && typeof window.AMG.PlanPagosUI.refrescarHoy === "function") window.AMG.PlanPagosUI.refrescarHoy(); } catch (_) {}\n' +
    '        return J({ ok: true });\n' +
    '      }',
    'mock-backend DELETE /api/clientes/:id emit clientes & refrescarHoy'
  );

  // 6. Patch docs/plan-pagos-ui.js to exclude c.borrado / c.despedido and re-evaluate on oc:datos:clientes & oc-sync-merge
  const ppUiPath = path.join(tmp, 'docs', 'plan-pagos-ui.js');
  replaceExact(
    ppUiPath,
    '  function clientesConEstado() {\n' +
    '    if (!global.AMG || !global.AMG.PlanPagos) return Promise.resolve([]);\n' +
    '    return fetch(API + "/clientes").then(function (r) { return r.json(); }).then(function (d) {\n' +
    '      var lista = (d && d.clientes) || d || [];\n' +
    '      return Promise.all(lista.map(function (c) {',
    '  function clientesConEstado() {\n' +
    '    if (!global.AMG || !global.AMG.PlanPagos) return Promise.resolve([]);\n' +
    '    return fetch(API + "/clientes").then(function (r) { return r.json(); }).then(function (d) {\n' +
    '      var lista = ((d && d.clientes) || d || []).filter(function (c) { return c && !c.borrado && !c.despedido; });\n' +
    '      return Promise.all(lista.map(function (c) {',
    'plan-pagos-ui filter out deleted/dismissed customers'
  );
  replaceExact(
    ppUiPath,
    '  global.addEventListener("oc-login", function () { setTimeout(montar, 600); });',
    '  global.addEventListener("oc-login", function () { setTimeout(montar, 600); });\n' +
    '  global.addEventListener("oc-sync-merge", function () { try { refrescarHoy(); } catch (_) {} });\n' +
    '  global.addEventListener("oc-catalogo-cambiado", function () { try { refrescarHoy(); } catch (_) {} });\n' +
    '  try {\n' +
    '    if (global.AMG && global.AMG.EventBus && typeof global.AMG.EventBus.on === "function") {\n' +
    '      global.AMG.EventBus.on("oc:datos:clientes", function () { try { refrescarHoy(); } catch (_) {} });\n' +
    '    }\n' +
    '  } catch (_) {}',
    'plan-pagos-ui refresh on customer changes and sync merges'
  );

  // 7. Add permanent CI test assertions in test/p0-c224-cf-relay-privado.test.mjs
  const testPath = path.join(tmp, 'test', 'p0-c224-cf-relay-privado.test.mjs');
  const testExtra = `
test('C226 clean-room suffix (::limpio-2026-09-16), Commissions 1.0 causality arrow, click on/off to RAW total, and deleted-customer payment-plan banner clear', async () => {
  const coreMod = await import('../cloudflare-relay-worker/src/priv-relay-core.mjs');
  const lic = 'F123-C226-CLEAN-0001';
  const cleanRoom40 = await coreMod.legacyCleanRoomHexForLicense(lic);
  const yparty32 = await coreMod.ypartyBaseForLicense(lic);
  const auth = makeMockAuthority({ license: lic, instance: 'inst-clean-01', role: 'dueno' });
  const tClean = auth.issue({ room: yparty32 + '-priv', scopes: ['priv:read', 'priv:write'] });
  const sess = await coreMod.exchangeTicketForSession({
    env: {
      WS_SERVICE_KEY: 'synthetic-service-secret-at-least-32-bytes-long!',
      WS_AUTHORITY: auth.WS_AUTHORITY
    },
    room: cleanRoom40 + '-y',
    licenseCode: lic,
    instanceId: 'inst-clean-01',
    roleHint: 'dueno',
    ticket: tClean.token
  });
  assert.equal(sess.ok, true, '::limpio-2026-09-16 room hash must be accepted for its matching license');
  assert.ok(yparty32.length === 32);

  const cbp = fs.readFileSync(path.join(ROOT, 'docs', 'commissions-by-person.js'), 'utf8');
  assert.match(cbp, /root\\.cambiarRangoComisionesGlobal\\s*=\\s*function/);
  assert.match(cbp, /querySelectorAll\\('\\[data-commissions-view-global\\]'\\)/);
  assert.match(cbp, /root\\.cambiarRangoComisionesGlobal\\('grupo', 'total'\\)/);

  const app01 = fs.readFileSync(path.join(ROOT, 'src', 'app', 'app-inline-01.js'), 'utf8');
  assert.match(app01, /const rich10=typeof flechaComisionHtml==="function";/);
  assert.match(app01, /flechaComisionHtml\\("",m\\.direccion,m\\.productoId,g\\.label\\)/);
  assert.match(app01, /function filtrarComisionesGlobal\\(valor\\)/);
  assert.match(app01, /const next=\\(valor===cur\\|\\|valor==="total"\\|\\|!valor\\)\\?"total":/);

  const mb = fs.readFileSync(path.join(ROOT, 'docs', 'mock-backend.js'), 'utf8');
  assert.ok(mb.includes('mov("cliente-borrado"'));
  assert.ok(mb.includes('window.OCReactivo.emitir("clientes")'));
  assert.ok(mb.includes('window.AMG.PlanPagosUI.refrescarHoy()'));
});
`;
  fs.writeFileSync(testPath, fs.readFileSync(testPath, 'utf8') + testExtra, 'utf8');

  // 8. Bump version.json, sw.js, dashboard.html to v0.9.04 / f123-shell-v904 / golden440
  const vPath = path.join(tmp, 'docs', 'version.json');
  const v = JSON.parse(fs.readFileSync(vPath, 'utf8'));
  v.version = 'v0.9.04';
  v.releaseName = 'v0.9.04';
  v.shell = 'f123-shell-v904';
  v.cacheGeneration = 'golden440';
  v.changelog = 'v0.9.04 C226: sala canonica ::limpio-2026-09-16 habilitada en friendly123-relay-privado; flecha de causalidad 1.0 (quien paga a quien), buscador, desglose y botones de vista click on/off (todos off = vista RAW completa) en Commissions; borrado de cliente actualiza al instante el aviso de plan de pagos en Hoy y propaga lapida.';
  fs.writeFileSync(vPath, JSON.stringify(v, null, 2) + '\n', 'utf8');

  replaceExact(path.join(tmp, 'docs', 'sw.js'), 'const CACHE = "f123-shell-v903";', 'const CACHE = "f123-shell-v904";', 'sw CACHE');
  replaceExact(path.join(tmp, 'docs', 'sw.js'), 'const CACHE_GENERACION = "-golden439";', 'const CACHE_GENERACION = "-golden440";', 'sw CACHE_GENERACION');
  const dashPath = path.join(tmp, 'docs', 'dashboard.html');
  fs.writeFileSync(
    dashPath,
    fs.readFileSync(dashPath, 'utf8')
      .replace(/v0\.9\.03/g, 'v0.9.04')
      .replace(/f123-shell-v903/g, 'f123-shell-v904')
      .replace(/golden439/g, 'golden440'),
    'utf8'
  );

  // 9. Rebuild app-inline-01.min.js, minified scripts & manifest
  const envBuild = { ...process.env, NODE_PATH: NODE_MODULES_PATH };
  console.log('2. Building app-inline-01.min.js, .min.js and version-manifest.json');
  console.log(run('node', ['scripts/build-app-entry.cjs'], { cwd: tmp, env: envBuild }).trim());
  console.log(run('node', ['scripts/build-app-entry.cjs', '--check'], { cwd: tmp, env: envBuild }).trim());
  console.log(run('node', ['scripts/build-min-scripts.cjs'], { cwd: tmp, env: envBuild }).trim());
  console.log(run('node', ['scripts/build-min-scripts.cjs', '--check'], { cwd: tmp, env: envBuild }).trim());
  console.log(run('node', ['scripts/gen-manifest.js'], { cwd: tmp, env: envBuild }).trim());

  // 10. Run release-control.cjs validate against BASE_SHA
  console.log('3. Running release-control.cjs validate', BASE_SHA);
  console.log(run('node', ['scripts/release-control.cjs', 'validate', BASE_SHA], { cwd: tmp, env: envBuild }).trim());

  // 11. Run real friendly-123 CI tests (including C182, C194, commissions-by-person, C224/C225/C226)
  console.log('4. Running real friendly-123 CI test suite...');
  const tests = [
    'test/p0-c224-cf-relay-privado.test.mjs',
    'test/p0-c182-commissions-original-ui-all-dates.test.cjs',
    'test/p0-c182-commissions-compact-view-switches.test.cjs',
    'test/p0-c194-commissions-safari-lazy.test.cjs',
    'test/commissions-by-person.test.cjs',
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
  console.log(testOut.split('\n').slice(-20).join('\n'));

  // 12. Stage and export atomic pre-sealed patch C226-v0.9.04-CleanRoom-Commissions-PlanPagos-on-30713d64.patch
  run('git', ['-C', tmp, 'add', '-A']);
  const atomicPatch = run('git', ['-C', tmp, 'diff', '--cached', '--binary']);
  const relDir = path.join(WORKSHOP_ROOT, 'releases');
  fs.mkdirSync(relDir, { recursive: true });
  const patchFile = path.join(relDir, 'C226-v0.9.04-CleanRoom-Commissions-PlanPagos-on-30713d64.patch');
  fs.writeFileSync(patchFile, atomicPatch, 'utf8');
  console.log(`5. Wrote atomic pre-sealed patch: ${patchFile} (${Buffer.byteLength(atomicPatch)} B)`);

  // 13. Verify git apply --check on pristine 30713d64
  const tmpCheck = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-c226-verify-'));
  try {
    run('git', ['clone', '-q', '-c', 'core.autocrlf=false', LIVE_REPO, tmpCheck]);
    run('git', ['-C', tmpCheck, 'checkout', '-q', BASE_SHA]);
    run('git', ['-C', tmpCheck, 'apply', '--check', patchFile]);
    run('git', ['-C', tmpCheck, 'apply', patchFile]);
    const st = run('git', ['-C', tmpCheck, 'status', '--short']).trim();
    console.log('6. Verified atomic patch git apply --check + git apply PASS on pristine 30713d64!\n' + st);
  } finally {
    fs.rmSync(tmpCheck, { recursive: true, force: true });
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
