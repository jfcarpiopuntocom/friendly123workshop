const API = "/api";
let ubicaciones = [];
let ubicacionActual = "todas";
let filtroEstadoActual = "";

function fmtMoney(n){
  return "$" + Number(n).toFixed(2);
}

async function cargarUbicaciones(){
  // Reforzado (JFC 2026-07-18): sin este try/catch, un fallo de red aqui
  // (offline, servidor caido) tiraba una excepcion no atrapada que dejaba el
  // selector de ubicaciones congelado en su ultimo estado SIN avisar nada.
  // Ahora, si falla, se deja el selector tal cual estaba (nunca se rompe) y
  // se registra el error para diagnostico — nunca un crash silencioso.
  let datos;
  try {
    const res = await fetch(`${API}/ubicaciones`);
    datos = await res.json();
  } catch (err) {
    console.error("[cargarUbicaciones] fallo de red, se conserva el selector anterior:", err);
    return;
  }
  ubicaciones = datos;
  const sel = document.getElementById("selectUbicacion");
  const valorPrevio = sel.value;
  sel.innerHTML = `<option value="todas" data-i18n="header.allLocations">All locations</option>` +
    ubicaciones.map(u => `<option value="${u.id}">${escHtml(u.nombre)}</option>`).join("");
  // Si la ubicación que estaba seleccionada ya no existe en la lista (ej. se
  // desactivó), vuelve a "todas" en vez de quedar en un valor fantasma.
  if ([...sel.options].some(o => o.value === valorPrevio)) sel.value = valorPrevio;
  ubicacionActual = sel.value;
  // cargarUbicaciones() ahora se llama repetidamente (tras crear/renombrar/
  // desactivar una ubicación desde Avanzado, no solo al cargar la página).
  // Antes esto agregaba un listener "change" nuevo cada vez que se llamaba
  // — el mismo bug de listeners acumulados que ya se corrigió en el
  // teclado de acceso. dataset.ocListo evita registrar el listener 2 veces.
  if (!sel.dataset.ocListo) {
    sel.dataset.ocListo = "1";
    sel.addEventListener("change", () => {
      ubicacionActual = sel.value;
      refrescarVistaActiva();
      // Microcirugia 6 (2026-07-07): si el cierre del dia esta abierto, su
      // lista era de la percha ANTERIOR — aplicar ahi seria cerrar la percha
      // equivocada. Se recarga con la nueva (lo tecleado se descarta: era de
      // otra percha) y se avisa.
      const cd = document.getElementById("cierreDia");
      if (cd && cd.open) {
        cargarCierreLista();
        const m = document.getElementById("cierreMsg");
        if (m) { m.textContent = t("sold.branchChanged"); m.style.color = "var(--sim-naranja-dk)"; }
      }
    });
  }
}

function vistaActivaId(){
  const activa = document.querySelector("nav button.activo");
  return activa ? activa.dataset.vista : "hoy";
}

// ============================================================================
// VENDER: CUADRICULA TACTIL + CIERRE DEL DIA (JFC 2026-07-07)
// Un toque = venderUno() (misma ruta que el buscador: cliente opcional del
// select, toast de deshacer 5s). Nada de carrito: esto registra salidas, no
// cobra. Estrellas primero, luego alfabetico; sin stock = apagado.
// ============================================================================
// ---- Modo "Fill a basket": carrito en memoria, nada persiste hasta cobrar ----
// Vive solo en esta pestaña (se pierde al recargar) — a proposito: es un
// borrador de trabajo, no un dato que deba sincronizarse entre dispositivos.
let _modoVenta = "quick";
let _carritoVenta = []; // { productoId, nombre, precio, cantidad, stockDisponible }

function fijarModoVenta(modo) {
  _modoVenta = modo;
  const bq = document.getElementById("btnModoQuick"), bc = document.getElementById("btnModoCarrito");
  const activo = "background:var(--azul-medio,#2c4a68);color:#fbf5e8 !important;-webkit-text-fill-color:#fbf5e8 !important;";
  const inactivo = "background:transparent;color:var(--azul-medio,#2c4a68) !important;-webkit-text-fill-color:var(--azul-medio,#2c4a68) !important;";
  if (bq) bq.style.cssText += (modo === "quick" ? activo : inactivo);
  if (bc) bc.style.cssText += (modo === "carrito" ? activo : inactivo);
  const panel = document.getElementById("panelCarrito");
  if (panel) panel.style.display = (modo === "carrito" && _carritoVenta.length) ? "block" : "none";
}
document.getElementById("btnModoQuick") && document.getElementById("btnModoQuick").addEventListener("click", () => fijarModoVenta("quick"));
document.getElementById("btnModoCarrito") && document.getElementById("btnModoCarrito").addEventListener("click", () => fijarModoVenta("carrito"));
fijarModoVenta("quick");

function agregarAlCarrito(p) {
  const linea = _carritoVenta.find(l => l.productoId === p.id);
  const enCarrito = linea ? linea.cantidad : 0;
  if (enCarrito + 1 > p.stockActual) { pintarCarrito(); return; } // silencioso: el tile ya se ve sin stock
  if (linea) linea.cantidad += 1;
  else _carritoVenta.push({ productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, stockDisponible: p.stockActual });
  pintarCarrito();
}

function pintarCarrito() {
  const panel = document.getElementById("panelCarrito");
  const lista = document.getElementById("listaCarrito");
  const subtotalEl = document.getElementById("subtotalCarrito");
  if (!panel || !lista || !subtotalEl) return;
  if (!_carritoVenta.length) { panel.style.display = "none"; return; }
  panel.style.display = "block";
  let subtotal = 0;
  lista.innerHTML = _carritoVenta.map(l => {
    subtotal += l.precio * l.cantidad;
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--linea,#D7E0E8);">
      <span style="flex:1;font-size:14px;color:#0F1923;">${escHtml(l.nombre)}</span>
      <button data-carrito-menos="${l.productoId}" style="width:28px;height:28px;border-radius:6px;border:2px solid var(--azul-medio,#2c4a68);background:transparent;color:var(--azul-medio,#2c4a68) !important;-webkit-text-fill-color:var(--azul-medio,#2c4a68) !important;cursor:pointer;font-weight:700;">−</button>
      <span style="min-width:20px;text-align:center;font-weight:700;">${l.cantidad}</span>
      <button data-carrito-mas="${l.productoId}" ${l.cantidad >= l.stockDisponible ? "disabled" : ""} style="width:28px;height:28px;border-radius:6px;border:2px solid var(--azul-medio,#2c4a68);background:transparent;color:var(--azul-medio,#2c4a68) !important;-webkit-text-fill-color:var(--azul-medio,#2c4a68) !important;cursor:pointer;font-weight:700;">+</button>
      <span style="min-width:70px;text-align:right;font-weight:700;">${fmtMoney(l.precio * l.cantidad)}</span>
    </div>`;
  }).join("");
  subtotalEl.textContent = fmtMoney(subtotal);
}

document.getElementById("listaCarrito") && document.getElementById("listaCarrito").addEventListener("click", (e) => {
  const menos = e.target.closest("[data-carrito-menos]");
  const mas = e.target.closest("[data-carrito-mas]");
  const id = (menos && menos.dataset.carritoMenos) || (mas && mas.dataset.carritoMas);
  if (!id) return;
  const linea = _carritoVenta.find(l => l.productoId === id);
  if (!linea) return;
  if (menos) { linea.cantidad -= 1; if (linea.cantidad <= 0) _carritoVenta = _carritoVenta.filter(l => l.productoId !== id); }
  if (mas && linea.cantidad < linea.stockDisponible) linea.cantidad += 1;
  pintarCarrito();
});

document.getElementById("btnVaciarCarrito") && document.getElementById("btnVaciarCarrito").addEventListener("click", async () => {
  if (!_carritoVenta.length) return;
  if (!(await ocConfirm("Clear this sale in progress? Nothing has been recorded yet."))) return;
  _carritoVenta = [];
  pintarCarrito();
});

// Sellar: registra CADA linea con el endpoint de siempre (una llamada por
// producto, ya probado), amarradas al mismo cliente. Si una linea falla a
// mitad de camino (ej. alguien mas vendio el ultimo justo antes), se PARA y
// se informa exactamente que quedo hecho y que no — nunca un "listo" falso.
async function sellarVenta() {
  if (!_carritoVenta.length) return;
  const sel = document.getElementById("ventaCliente");
  const nombreCliente = sel && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent : "Counter sale";
  const subtotal = _carritoVenta.reduce((a, l) => a + l.precio * l.cantidad, 0);
  const resumen = _carritoVenta.map(l => `${l.cantidad}× ${l.nombre}`).join(", ");
  if (!(await ocConfirm(`Check out this basket — ${resumen}. Total ${fmtMoney(subtotal)} for ${nombreCliente}?`))) return;
  const msg = document.getElementById("carritoMsg");
  const btn = document.getElementById("btnSellarVenta");
  btn.disabled = true;
  const hechas = [];
  for (const l of _carritoVenta) {
    try {
      const res = await fetch(`${API}/productos/${l.productoId}/venta`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad: l.cantidad, clienteId: (sel && sel.value) || undefined, info: infoEventoActivo() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      hechas.push(l);
    } catch (err) {
      // Corte honesto: lo que ya se sello queda sellado (no se revierte),
      // lo que falto se informa con nombre y numero exactos.
      const faltan = _carritoVenta.filter(x => !hechas.includes(x));
      _carritoVenta = faltan;
      pintarCarrito();
      btn.disabled = false;
      if (msg) { msg.style.color = "#C0392B"; msg.textContent = `Stopped at "${l.nombre}": ${err.message}. Everything before that IS checked out — only the rest is still pending.`; }
      cargarGridVender();
      return;
    }
  }
  _carritoVenta = [];
  pintarCarrito();
  btn.disabled = false;
  if (msg) { msg.style.color = "#006B3C"; msg.textContent = `✓ Checked out. ${resumen} — ${fmtMoney(subtotal)} for ${nombreCliente}.`; setTimeout(() => { if (msg) msg.textContent = ""; }, 6000); }
  cargarGridVender();
  if (document.getElementById("cierreDia").open) cargarCierreLista();
}
document.getElementById("btnSellarVenta") && document.getElementById("btnSellarVenta").addEventListener("click", sellarVenta);

async function cargarGridVender(){
  const grid = document.getElementById("gridVender");
  if (!grid) return;
  let productos;
  try { productos = await (await fetch(`${API}/productos?ubicacionId=${ubicacionActual}`)).json(); } catch (_) { return; }
  if (!Array.isArray(productos)) return;
  window._productosVenderCache = productos;
  productos.sort((a, b) => (b.estrella - a.estrella) || a.nombre.localeCompare(b.nombre));
  /* Las categorias del pulldown salen de los productos REALES del negocio, no
     de una lista fija: las suyas van primero porque son las que va a repetir. */
  try { if (window.OCCategorias) window.OCCategorias.refrescar(productos); } catch (_) {}
  grid.innerHTML = productos.map(p => {
    const sinStock = p.stockActual <= 0;
    const visual = p.foto
      ? `<img src="${p.foto}" alt="" style="width:100%;height:64px;object-fit:cover;border-radius:6px;">`
      : `<div style="width:100%;height:64px;border-radius:6px;background:var(--sim-${p.estado}-bg,#E8ECF2);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--sim-${p.estado}-dk,#2C3E50);">${escHtml(p.nombre.charAt(0).toUpperCase())}</div>`;
    return `<button data-vender-tile="${p.id}" ${sinStock ? "disabled" : ""} style="text-align:left;padding:8px;border:2px solid var(--sim-${p.estado},#C4CDD8);border-radius:10px;background:#FFFFFF;cursor:${sinStock ? "not-allowed" : "pointer"};touch-action:manipulation;${sinStock ? "filter:grayscale(1);" : ""}">
      ${visual}
      <div style="font-size:15px;font-weight:700;color:#0F1923;margin-top:6px;line-height:1.25;">${p.estrella ? "⭐ " : ""}${escHtml(p.nombre)}</div>
      <div style="display:flex;flex-direction:column;gap:2px;margin-top:4px;">
        <span style="font-size:16px;font-weight:700;color:#0F1923;">${fmtMoney(p.precio)}</span>
        <span style="font-size:13px;color:${sinStock ? "#B0183E" : "#2C3E50"};font-weight:700;">${sinStock ? "SIN STOCK" : p.stockActual + " u."}</span>
      </div>
    </button>`;
  }).join("");
  // Delegacion: UN solo listener en el contenedor, marcado con dataset para
  // no re-atarlo en cada render. Estructuralmente imposible que un toque
  // dispare N ventas por listeners apilados (visto 1 caso en QA 2026-07-07).
  if (!grid.dataset.listenerListo) {
    grid.dataset.listenerListo = "1";
    grid.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-vender-tile]");
      if (!b || b.disabled) return;
      if (_modoVenta === "carrito") {
        // "Fill a basket": el toque solo agrega al carrito, NADA se descuenta
        // de stock todavia — eso pasa solo al cobrar. Misma cuadricula, otra ruta.
        const p = (window._productosVenderCache || []).find(x => x.id === b.dataset.venderTile);
        if (p) agregarAlCarrito(p);
        return;
      }
      /* Portado de amigable-123 (JFC 2026-08-26): en vez de vender directo, se abre
         la PANTALLA DE DATOS DE VENTA (captura cliente/pago; obligatoria en tickets).
         El modal hace el refresh (gridVender/cierre) al confirmar. */
      const _pv = (window._productosVenderCache || []).find(x => x.id === b.dataset.venderTile);
      abrirPanelVentaInfo(b.dataset.venderTile, !!(_pv && _pv.tipoProducto === "ticket"));
    });
  }
  montarBuscadorVender(productos);
}

// Buscador + chips de categoria para el grid tactil de Sold (JFC
// 2026-07-30). Filtra por display:none los botones ya renderizados -
// nunca vuelve a pedir datos ni toca el listener de venta.
let _venderCategoriaActiva = "";
function montarBuscadorVender(productos){
  const chips = document.getElementById("venderCategoriaChips");
  const input = document.getElementById("venderBuscarInput");
  if (!chips || !input) return;
  const categorias = Array.from(new Set(productos.map(p => (p.categoria || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  if (_venderCategoriaActiva && !categorias.includes(_venderCategoriaActiva)) _venderCategoriaActiva = "";
  const chipEstilo = (activo) => `font-size:13px;padding:6px 12px;border-radius:999px;border:2px solid var(--azul-medio,#2c4a68);cursor:pointer;background:${activo ? "var(--azul-medio,#2c4a68)" : "transparent"};color:${activo ? "#fff" : "var(--azul-medio,#2c4a68)"} !important;-webkit-text-fill-color:${activo ? "#fff" : "var(--azul-medio,#2c4a68)"} !important;`;
  chips.innerHTML = `<button type="button" data-chip-cat="" style="${chipEstilo(!_venderCategoriaActiva)}">${window.t("sold.chipAll")}</button>` +
    categorias.map(c => `<button type="button" data-chip-cat="${escHtml(c)}" style="${chipEstilo(_venderCategoriaActiva === c)}">${escHtml(c)}</button>`).join("");
  // Indice de busqueda tolerante a errores de tipeo (JFC 2026-07-30, "world
  // standards"). MiniSearch esta vendorizado localmente. Se reconstruye
  // cada vez que llega una lista nueva de productos (evita indice viejo) y
  // SIEMPRE en try/catch: si falla, idx queda null y aplicarFiltro() cae
  // sola al filtro por substring de siempre - ver
  // feedback_aislar_fallos_ui_nunca_datos (JFC, "pecado mortal").
  let idx = null;
  try {
    if (typeof MiniSearch === "function") {
      idx = new MiniSearch({ fields: ["nombre", "categoria", "sku", "barcode"], idField: "id", searchOptions: { prefix: true, fuzzy: 0.2 } });
      idx.addAll(productos);
    }
  } catch (_) { idx = null; }
  function aplicarFiltro(){
    const q = (input.value || "").trim();
    let idsCoinciden = null;
    if (q && idx) {
      try { idsCoinciden = new Set(idx.search(q).map(r => r.id)); } catch (_) { idsCoinciden = null; }
    }
    const qLower = q.toLowerCase();
    document.querySelectorAll("#gridVender [data-vender-tile]").forEach(btn => {
      const p = (window._productosVenderCache || []).find(x => x.id === btn.dataset.venderTile);
      if (!p) return;
      const matchTexto = !q
        ? true
        : idsCoinciden
          ? idsCoinciden.has(p.id)
          : (p.nombre.toLowerCase().includes(qLower) || (p.categoria || "").toLowerCase().includes(qLower));
      const matchCategoria = !_venderCategoriaActiva || p.categoria === _venderCategoriaActiva;
      btn.style.display = (matchTexto && matchCategoria) ? "" : "none";
    });
  }
  if (!chips.dataset.listenerListo) {
    chips.dataset.listenerListo = "1";
    chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-chip-cat]");
      if (!b) return;
      _venderCategoriaActiva = b.dataset.chipCat;
      montarBuscadorVender(window._productosVenderCache || []);
    });
  }
  if (!input.dataset.listenerListo) {
    input.dataset.listenerListo = "1";
    input.addEventListener("input", aplicarFiltro);
  }
  aplicarFiltro();
}

// ---- Cierre del dia ----
async function cargarCierreLista(){
  const cont = document.getElementById("cierreLista");
  if (!cont) return;
  // Preservar lo ya tecleado: si el dueño cierra/abre el panel o vende un
  // toque arriba (re-render), sus cantidades no se pierden.
  const previos = {};
  cont.querySelectorAll("[data-cierre-prod]").forEach(i => { if (Number(i.value) > 0) previos[i.dataset.cierreProd] = Number(i.value); });
  let productos, hoyMap = {};
  try {
    productos = await (await fetch(`${API}/productos?ubicacionId=${ubicacionActual}`)).json();
    hoyMap = await (await fetch(`${API}/ventas/hoy?ubicacionId=${ubicacionActual}`)).json();
  } catch (_) { return; }
  const conStock = productos.filter(p => p.stockActual > 0).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const totalHoy = Object.values(hoyMap).reduce((a, b) => a + b, 0);
  // "hoy: N" = lo YA registrado (toques de arriba o cierres previos). Lo que
  // se teclea aquí es ADICIONAL — por eso nunca se pre-carga en el input.
  cont.innerHTML = `<p style="font-size:15px;font-weight:700;color:var(--sim-verde-dk);margin:8px 0 4px;">${tf("sold.alreadyToday", {n: totalHoy})}</p>` + conStock.map(p => `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--linea,#D7E0E8);">
      <span style="font-size:15px;color:#0F1923;flex:1;">${escHtml(p.nombre)} <span style="color:#2C3E50;">(hay ${p.stockActual})</span>${hoyMap[p.id] ? ` <span style="font-size:14px;font-weight:700;color:var(--sim-verde-dk);">· hoy: ${hoyMap[p.id]}</span>` : ""}</span>
      <input type="number" min="0" max="${p.stockActual}" value="${previos[p.id] || 0}" data-cierre-prod="${p.id}" inputmode="numeric" style="width:76px;padding:8px;border:2px solid var(--azul-medio);border-radius:6px;text-align:center;">
    </div>`).join("");
  // Anti-dummy: si teclean mas que el stock, se recorta al maximo al salir
  // del campo (el endpoint valida igual, pero mejor avisar aqui mismo).
  cont.querySelectorAll("[data-cierre-prod]").forEach(i => i.addEventListener("change", () => {
    const max = Number(i.max), v = Number(i.value) || 0;
    if (v > max) i.value = max;
    if (v < 0) i.value = 0;
  }));
}
// Null-guards (microcirugia 2, 2026-07-07): si un markup futuro cambia un id,
// el script principal completo NO debe morir por un addEventListener sobre null.
const elCierreDia = document.getElementById("cierreDia");
if (elCierreDia) elCierreDia.addEventListener("toggle", function(){ if (this.open) cargarCierreLista(); });
// "+ Nuevo cliente" en Vender: navega a la vista de Clientes para registrar uno.
// El operador crea el cliente, vuelve a Vender y lo elige en el selector.
// Mini-modal inline "Nuevo cliente" desde Vender.
// NO navega a la vista Clientes: crea el cliente en contexto, lo auto-selecciona
// en el selector, y cierra. Seamless — el vendedor no pierde el hilo.
(function () {
  const btn = document.getElementById("btnNuevoCliente");
  if (!btn) return;

  // Crear el modal una sola vez y adjuntarlo al body.
  // Ajuste minimo para que intl-tel-input (ver abajo) ocupe el ancho completo
  // del label y no rompa el box-sizing del formulario. Sin esto, la
  // libreria pone su .iti como inline-block y desborda a la derecha.
  if (!document.getElementById("oc-iti-fix")) {
    var s = document.createElement("style");
    s.id = "oc-iti-fix";
    s.textContent = "#oc-nuevo-cli-modal .iti{display:block;width:100%;} #oc-nuevo-cli-modal .iti input[type=tel]{width:100%;box-sizing:border-box;}";
    document.head.appendChild(s);
  }
  const overlay = document.createElement("div");
  overlay.id = "oc-nuevo-cli-modal";
  overlay.style.cssText = "position:fixed;inset:0;z-index:9995;background:rgba(21,40,64,.82);display:none;align-items:flex-end;justify-content:center;";
  overlay.innerHTML = `
    <div style="background:var(--blanco-calido,#fbf5e8);width:100%;max-width:480px;border-radius:16px 16px 0 0;padding:20px 18px 28px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
        <strong id="oc-ncli-titulo" style="font-family:var(--font-display);font-size:17px;color:var(--ink);flex:1;">${t("newcust.title")}</strong>
        <button id="oc-ncli-cerrar" style="font-size:13px;padding:6px 12px;border:2px solid var(--azul-medio,#2c4a68);border-radius:7px;background:var(--azul-medio,#2c4a68);color:#fbf5e8;cursor:pointer;">${t("newcust.close")}</button>
      </div>
      <label style="display:block;font-size:14px;font-weight:700;color:var(--ink);margin-bottom:8px;"><span id="oc-ncli-lbl-nombre">${t("newcust.name")}</span>
        <input id="oc-ncli-nombre" type="text" maxlength="80" autocomplete="off"
          style="display:block;width:100%;margin-top:4px;padding:9px 10px;border:2px solid var(--azul-medio,#2c4a68);border-radius:7px;font-size:15px;box-sizing:border-box;background:#fff;">
      </label>
      <label style="display:block;font-size:14px;font-weight:700;color:var(--ink);margin-bottom:14px;"><span id="oc-ncli-lbl-tel">${t("newcust.phone")}</span>
        <input id="oc-ncli-tel" type="tel" maxlength="24" autocomplete="tel" inputmode="tel"
          style="display:block;width:100%;margin-top:4px;padding:9px 10px;border:2px solid var(--azul-medio,#2c4a68);border-radius:7px;font-size:15px;box-sizing:border-box;background:#fff;">
      </label>
      <!-- EMAIL EN ALTA RAPIDA (JFC 2026-08-29): el modal de "+ New customer" del
           panel de venta era el unico punto de alta de cliente que NO pedia email
           (si lo pedian vista-clientes y la edicion ex-post-facto). Este es el
           punto mas usado (durante el checkout), asi que era el hueco real. -->
      <label style="display:block;font-size:14px;font-weight:700;color:var(--ink);margin-bottom:14px;"><span id="oc-ncli-lbl-email">${t("newcust.email")}</span>
        <input id="oc-ncli-email" type="email" inputmode="email" autocomplete="off" maxlength="120"
          data-i18n-attr="placeholder:newcust.emailPlaceholder" placeholder="Email (optional)"
          style="display:block;width:100%;margin-top:4px;padding:9px 10px;border:2px solid var(--azul-medio,#2c4a68);border-radius:7px;font-size:15px;box-sizing:border-box;background:#fff;">
      </label>
      <button id="oc-ncli-crear" style="width:100%;padding:11px 18px;border:2px solid var(--azul-medio,#2c4a68);border-radius:8px;background:var(--azul-medio,#2c4a68);color:#fbf5e8 !important;-webkit-text-fill-color:#fbf5e8 !important;font-size:15px;font-weight:700;cursor:pointer;">
        ${t("newcust.save")}
      </button>
      <p id="oc-ncli-msg" style="font-size:13px;margin:8px 0 0;font-weight:700;"></p>
    </div>`;
  document.body.appendChild(overlay);

  // ────────────────────────────────────────────────────────────────
  // WhatsApp/telefono world-class (JFC 2026-08-19): intl-tel-input,
  // libreria estandar MIT (jackocnr) para que un cliente de cualquier
  // pais entre su numero con bandera, prefijo y validacion propios de
  // ese pais. Cargada bajo demanda desde jsDelivr; si no carga (offline),
  // el input queda como <input type="tel"> plano y todo sigue funcionando.
  // La app no depende de la libreria: la usa si existe, no se rompe si no.
  var _iti = null;
  var _itiCargado = false;
  function cargarITIUnaVez() {
    if (_itiCargado) return Promise.resolve(!!window.intlTelInput);
    _itiCargado = true;
    return new Promise(function (resolve) {
      try {
        var css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.7/build/css/intlTelInput.min.css";
        document.head.appendChild(css);
        var js = document.createElement("script");
        js.src = "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.7/build/js/intlTelInputWithUtils.min.js";
        js.async = true;
        js.onload = function () { resolve(!!window.intlTelInput); };
        js.onerror = function () { resolve(false); };
        document.head.appendChild(js);
      } catch (_) { resolve(false); }
    });
  }
  function abrir() {
    document.getElementById("oc-ncli-nombre").value = "";
    var telEl = document.getElementById("oc-ncli-tel");
    if (_iti && _iti.setNumber) _iti.setNumber(""); else telEl.value = "";
    { const _e = document.getElementById("oc-ncli-email"); if (_e) _e.value = ""; }
    document.getElementById("oc-ncli-msg").textContent = "";
    overlay.style.display = "flex";
    setTimeout(function () { document.getElementById("oc-ncli-nombre").focus(); }, 60);
    // Inicializar el picker al primer abrir. Si el CDN no responde en 3s,
    // continuamos sin el (el input queda como tel plano).
    if (!_iti) {
      cargarITIUnaVez().then(function (ok) {
        if (!ok || !window.intlTelInput || _iti) return;
        try {
          _iti = window.intlTelInput(telEl, {
            initialCountry: "auto",
            geoIpLookup: function (cb) {
              // No pedimos IP externa: fallback silencioso a US (mercado
              // primario de friendly-123). La lista completa de paises esta
              // disponible en el dropdown, el usuario escoge el suyo.
              cb("us");
            },
            preferredCountries: ["us", "ec", "mx", "co", "pe", "cl", "ar", "es"],
            separateDialCode: true,
            utilsScript: "" // ya viene en intlTelInputWithUtils.min.js
          });
        } catch (_) { _iti = null; }
      });
    }
  }
  function cerrar() { overlay.style.display = "none"; }

  // JFC 2026-08-27: exponer el modal para reutilizarlo desde el panel de venta
  // (selector "abajo"). El callback se invoca con el cliente recien creado.
  window.ocAbrirNuevoCliente = abrir;
  window.ocCerrarNuevoCliente = cerrar;
  window._ocNuevoClienteCb = null;

  btn.addEventListener("click", abrir);
  document.getElementById("oc-ncli-cerrar").addEventListener("click", cerrar);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrar(); });

  // Enter en nombre → foco a teléfono; Enter en teléfono → crear
  document.getElementById("oc-ncli-nombre").addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("oc-ncli-tel").focus(); });
  document.getElementById("oc-ncli-tel").addEventListener("keydown", (e) => { if (e.key === "Enter") { const _e = document.getElementById("oc-ncli-email"); if (_e) _e.focus(); else document.getElementById("oc-ncli-crear").click(); } });
  { const _emailEl = document.getElementById("oc-ncli-email"); if (_emailEl) _emailEl.addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("oc-ncli-crear").click(); }); }

  document.getElementById("oc-ncli-crear").addEventListener("click", async () => {
    const nombre = (document.getElementById("oc-ncli-nombre").value || "").trim();
    // Con intl-tel-input activo, tomamos el numero en formato E.164 (+593999...).
    // Sin la libreria, cae al valor crudo del input. Ambos casos son validos.
    let telefono = "";
    try {
      if (_iti && _iti.getNumber) {
        const raw = (document.getElementById("oc-ncli-tel").value || "").trim();
        telefono = raw ? (_iti.getNumber() || raw) : "";
      } else {
        telefono = (document.getElementById("oc-ncli-tel").value || "").trim();
      }
    } catch (_) {
      telefono = (document.getElementById("oc-ncli-tel").value || "").trim();
    }
    const email = (document.getElementById("oc-ncli-email") || {}).value || "";
    const msg = document.getElementById("oc-ncli-msg");
    if (!nombre) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = t("newcust.nameRequired"); return; }
    const btn2 = document.getElementById("oc-ncli-crear");
    btn2.disabled = true;
    try {
      const res = await fetch(`${API}/clientes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, telefono, email: (email || "").trim() }) });
      const r = await res.json();
      if (!res.ok) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = r.error || t("newcust.createError"); btn2.disabled = false; return; }
      // Agregar al selector y seleccionarlo automáticamente
      const sel = document.getElementById("ventaCliente");
      if (sel) {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = escHtml(r.nombre) + " (" + escHtml(r.codigo) + ")";
        sel.appendChild(opt);
        sel.value = r.id;
      }
      // JFC 2026-08-27: si el modal se abrio desde el panel de venta (selector
      // "abajo"), agregar el cliente ahi tambien y seleccionarlo.
      const selAbajo = document.getElementById("vi-cliente");
      if (selAbajo) {
        const opt2 = document.createElement("option");
        opt2.value = r.id;
        opt2.textContent = escHtml(r.nombre) + " (" + escHtml(r.codigo) + ")";
        selAbajo.appendChild(opt2);
        selAbajo.value = r.id;
      }
      if (window._ocNuevoClienteCb) { try { window._ocNuevoClienteCb(r); } catch (_) {} window._ocNuevoClienteCb = null; }
      cerrar();
    } catch (_) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = t("newcust.networkError"); btn2.disabled = false; }
  });

  // Ambos idiomas (JFC 2026-08-25): el modal se arma una vez, asi que si el
  // usuario cambia de idioma despues hay que repintar sus textos fijos.
  window.addEventListener("oc-lang-change", function () {
    try {
      var set = function (id, k) { var el = document.getElementById(id); if (el) el.textContent = t(k); };
      set("oc-ncli-titulo", "newcust.title");
      set("oc-ncli-cerrar", "newcust.close");
      set("oc-ncli-lbl-nombre", "newcust.name");
      set("oc-ncli-lbl-tel", "newcust.phone");
      set("oc-ncli-lbl-email", "newcust.email");
      set("oc-ncli-crear", "newcust.save");
    } catch (_) {}
  });
})();

// ============================================================================
// SHOW CUSTOMERS EN VENDER (JFC 2026-08-27, bloque 1e)
// El boton negro "Show customers" abre un modal con los clientes que SI han
// comprado (agregados desde /api/ventas/todas), ordenados por compra mas
// reciente: nombre, codigo, telefono, numero de compras, total gastado y
// fecha de la ultima compra. Tocar una fila la selecciona en el selector de
// cliente de arriba y cierra — el vendedor no pierde el hilo. Solo lectura.
// ============================================================================
(function () {
  const btn = document.getElementById("btnShowCustomers");
  const overlay = document.createElement("div");
  overlay.id = "oc-showcli-modal";
  overlay.style.cssText = "position:fixed;inset:0;z-index:9996;background:rgba(21,40,64,.82);display:none;align-items:center;justify-content:center;";
  overlay.innerHTML = `
    <div style="background:var(--blanco-calido,#fbf5e8);width:100%;max-width:560px;max-height:86vh;border-radius:16px 16px 0 0;padding:20px 18px 24px;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <strong id="oc-showcli-titulo" style="font-family:var(--font-display);font-size:17px;color:var(--ink);flex:1;"></strong>
        <button id="oc-showcli-imprimir" title="Print" style="font-size:14px;padding:6px 12px;border:2px solid #0F1923;border-radius:7px;background:#0F1923;color:#fff !important;-webkit-text-fill-color:#fff !important;cursor:pointer;">🖨️</button>
        <button id="oc-showcli-cerrar" title="Close" aria-label="Close" style="width:36px;height:36px;font-size:20px;line-height:1;cursor:pointer;color:#0F1923;background:#FFFFFF;border:2px solid #0F1923;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;flex:0 0 auto;">✕</button>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <label id="oc-showcli-filtro-label" for="oc-showcli-filtro" style="font-size:12px;font-weight:700;color:var(--ink-soft);white-space:nowrap;"></label>
        <select id="oc-showcli-filtro" style="flex:1;font-size:13px;padding:7px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:7px;background:#fff;color:var(--ink);"></select>
      </div>
      <div id="oc-showcli-lista" style="overflow:auto;flex:1;min-height:0;"></div>
      <p id="oc-showcli-msg" style="font-size:13px;margin:8px 0 0;font-weight:700;"></p>
    </div>`;
  document.body.appendChild(overlay);
  const lista = document.getElementById("oc-showcli-lista");
  const msg = document.getElementById("oc-showcli-msg");
  const filtro = document.getElementById("oc-showcli-filtro");
  const tituloEl = document.getElementById("oc-showcli-titulo");
  const imprimirBtn = document.getElementById("oc-showcli-imprimir");
  const cerrarBtn = document.getElementById("oc-showcli-cerrar");

  let _ventas = [], _clientes = [], _filas = [], _cliPorNombre = {};

  function cerrar() { overlay.style.display = "none"; }
  cerrarBtn.addEventListener("click", cerrar);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrar(); });

  function opcionesFiltro() {
    const prods = new Map(), evts = new Map();
    for (const v of _ventas) {
      if (v.productoNombre) prods.set(v.productoId, v.productoNombre);
      if (v.eventoNombre) evts.set(v.eventoNombre, v.eventoNombre);
    }
    const opts = [{ k: "__all__", label: t("sold.showCustomersAll") }];
    for (const [k, n] of prods) opts.push({ k: "p:" + k, label: n });
    for (const [k, n] of evts) opts.push({ k: "e:" + k, label: n });
    return opts;
  }

  function render() {
    const sel = filtro.value;
    _cliPorNombre = {};
    for (const c of _clientes) _cliPorNombre[c.nombre] = c;
    const porNombre = {};
    for (const v of _ventas) {
      if (!v.clienteNombre) continue;
      if (sel !== "__all__") {
        if (sel.indexOf("p:") === 0 && v.productoId !== sel.slice(2)) continue;
        if (sel.indexOf("e:") === 0 && v.eventoNombre !== sel.slice(2)) continue;
      }
      const k = v.clienteNombre;
      if (!porNombre[k]) porNombre[k] = { nombre: k, compras: 0, total: 0, ultima: 0 };
      porNombre[k].compras += Number(v.cantidad) || 0;
      porNombre[k].total += (Number(v.precioUnit) || 0) * (Number(v.cantidad) || 0);
      const d = new Date(v.fecha).getTime();
      if (d > porNombre[k].ultima) porNombre[k].ultima = d;
    }
    _filas = Object.values(porNombre).sort((a, b) => b.ultima - a.ultima);
    if (!_filas.length) {
      lista.innerHTML = `<p style="font-size:15px;color:var(--ink-soft);padding:8px 0;">${escHtml(t("sold.showCustomersEmpty"))}</p>`;
      return;
    }
    const selCliente = document.getElementById("ventaCliente");
    const fila = (f) => {
      const cli = _cliPorNombre[f.nombre];
      const fecha = f.ultima ? new Date(f.ultima).toLocaleDateString() : "—";
      const tel = cli && cli.telefono ? escHtml(cli.telefono) : "";
      const codigo = cli && cli.codigo ? escHtml(cli.codigo) : "";
      const selBtn = cli ? `<button type="button" data-sel="${escHtml(cli.id)}" style="font-size:12px;font-weight:700;padding:5px 10px;border:2px solid #0F1923;border-radius:6px;background:#0F1923;color:#fff !important;-webkit-text-fill-color:#fff !important;cursor:pointer;white-space:nowrap;">${escHtml(t("sold.showCustomersSelect"))}</button>` : "";
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--linea,#D7E0E8);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:700;color:var(--ink);">${escHtml(f.nombre)} ${codigo ? `<span style="font-weight:400;color:var(--ink-soft);font-size:12px;">(${codigo})</span>` : ""}</div>
          <div style="font-size:12px;color:var(--ink-soft);">${tel ? tel + " · " : ""}${f.compras} ${escHtml(t("sold.showCustomersColPurchases"))} · ${fmtMoney(f.total)} · ${escHtml(t("sold.showCustomersColLast"))} ${fecha}</div>
        </div>
        ${selBtn}
      </div>`;
    };
    lista.innerHTML = _filas.map(fila).join("");
    lista.querySelectorAll("button[data-sel]").forEach((b) => {
      b.addEventListener("click", () => {
        if (selCliente) { selCliente.value = b.getAttribute("data-sel"); }
        cerrar();
      });
    });
  }

  function pintarTitulo() {
    const sel = filtro.value;
    if (sel === "__all__") tituloEl.textContent = t("sold.showCustomersTitle");
    else if (sel.indexOf("p:") === 0) {
      const pid = sel.slice(2);
      const v = _ventas.find((x) => x.productoId === pid);
      tituloEl.textContent = t("sold.showCustomersForProduct").replace("{name}", (v && v.productoNombre) || pid);
    }
    else if (sel.indexOf("e:") === 0) tituloEl.textContent = t("sold.showCustomersForEvent").replace("{name}", sel.slice(2));
  }

  async function abrir(opts) {
    opts = opts || {};
    overlay.style.display = "flex";
    lista.innerHTML = `<p style="font-size:14px;color:var(--ink-soft);">${escHtml(t("sold.showCustomersEmpty"))}...</p>`;
    msg.textContent = "";
    try { _ventas = await (await fetch(`${API}/ventas/todas`)).json(); } catch (_) {}
    try { _clientes = await (await fetch(`${API}/clientes`)).json(); } catch (_) {}
    if (!Array.isArray(_ventas)) _ventas = [];
    if (!Array.isArray(_clientes)) _clientes = [];
    const optsF = opcionesFiltro();
    filtro.innerHTML = optsF.map((o) => `<option value="${escHtml(o.k)}">${escHtml(o.label)}</option>`).join("");
    let presel = "__all__";
    if (opts.productoId) presel = "p:" + opts.productoId;
    else if (opts.eventoNombre) presel = "e:" + opts.eventoNombre;
    if (optsF.some((o) => o.k === presel)) filtro.value = presel;
    pintarTitulo();
    render();
  }

  filtro.addEventListener("change", () => { pintarTitulo(); render(); });

  imprimirBtn.addEventListener("click", () => {
    const w = window.open("", "_blank", "width=640,height=800");
    if (!w) return;
    const filasHtml = _filas.map((f) => {
      const cli = _cliPorNombre[f.nombre];
      const fecha = f.ultima ? new Date(f.ultima).toLocaleDateString() : "—";
      const tel = cli && cli.telefono ? escHtml(cli.telefono) : "";
      return `<tr><td>${escHtml(f.nombre)}${tel ? "<br><small>" + tel + "</small>" : ""}</td><td>${f.compras}</td><td>${fmtMoney(f.total)}</td><td>${escHtml(fecha)}</td></tr>`;
    }).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(tituloEl.textContent)}</title><style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h2{font-size:18px;margin:0 0 4px}p.sub{color:#666;margin:0 0 16px;font-size:13px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;padding:7px 8px;border-bottom:1px solid #ddd}th{background:#f4f4f4}</style></head><body><h2>${escHtml(tituloEl.textContent)}</h2><p class="sub">${escHtml(new Date().toLocaleString())}</p><table><thead><tr><th>${escHtml(t("sold.showCustomersColName"))}</th><th>${escHtml(t("sold.showCustomersColPurchases"))}</th><th>${escHtml(t("sold.showCustomersColSpent"))}</th><th>${escHtml(t("sold.showCustomersColLast"))}</th></tr></thead><tbody>${filasHtml}</tbody></table><script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  });

  if (btn) btn.addEventListener("click", () => abrir({}));

  window.abrirCompradores = abrir;

  window.addEventListener("oc-lang-change", function () {
    try {
      cerrarBtn.title = t("sold.showCustomersClose");
      cerrarBtn.setAttribute("aria-label", t("sold.showCustomersClose"));
      imprimirBtn.title = t("sold.showCustomersPrint");
      document.getElementById("oc-showcli-filtro-label").textContent = t("sold.showCustomersFilter");
      pintarTitulo();
      render();
    } catch (_) {}
  });
})();

// ============================================================================
// EVENTO ACTIVO EN VENDER (JFC 2026-08-25)
// Un evento se ELIGE una vez (pulldown de eventos ya vistos, o "+ Nuevo evento"
// y se escribe una sola vez). Queda como evento activo y cada venta se le suma
// sola: nunca se vuelve a pedir el nombre. Al lado, ver invitados y exportar
// CSV. Todo aditivo — mismo patron que el selector de cliente, sin reordenar
// nada. El backend ya acepta body.info.{nombreEvento,fechaEvento}.
// ============================================================================
let _eventoActivo = null;
try { const _rawEv = localStorage.getItem("f123_evento_activo"); if (_rawEv) _eventoActivo = JSON.parse(_rawEv); } catch (_) {}
function infoEventoActivo() {
  if (_eventoActivo && _eventoActivo.nombre) return { nombreEvento: _eventoActivo.nombre, fechaEvento: _eventoActivo.fecha || "" };
  return undefined;
}
function _guardarEventoActivo() {
  try { if (_eventoActivo && _eventoActivo.nombre) localStorage.setItem("f123_evento_activo", JSON.stringify(_eventoActivo)); else localStorage.removeItem("f123_evento_activo"); } catch (_) {}
}
function _refrescarEventoUI() {
  const activo = !!(_eventoActivo && _eventoActivo.nombre);
  const inv = document.getElementById("btnEventoInvitados");
  const exp = document.getElementById("btnEventoExport");
  const hint = document.getElementById("oc-evento-hint");
  if (inv) inv.style.display = activo ? "" : "none";
  if (exp) exp.style.display = activo ? "" : "none";
  if (hint) hint.style.display = activo ? "" : "none";
}
async function poblarSelectEventos() {
  const sel = document.getElementById("ventaEvento");
  if (!sel) return;
  let rows = [];
  try { rows = await (await fetch(`${API}/ventas/todas`)).json(); } catch (_) { rows = []; }
  const mapa = new Map();
  (rows || []).forEach((r) => { const n = (r.eventoNombre || "").trim(); if (n && !mapa.has(n)) mapa.set(n, r.eventoFecha || ""); });
  // Un evento recien creado sin ventas aun no aparece en /ventas/todas: se agrega.
  if (_eventoActivo && _eventoActivo.nombre && !mapa.has(_eventoActivo.nombre)) mapa.set(_eventoActivo.nombre, _eventoActivo.fecha || "");
  const nombres = Array.from(mapa.keys()).sort((a, b) => a.localeCompare(b));
  sel.innerHTML = `<option value="">${escHtml(t("sold.noEvent"))}</option>` +
    nombres.map((n) => { const f = mapa.get(n) || ""; return `<option value="${escHtml(n)}" data-fecha="${escHtml(f)}">${escHtml(n)}${f ? ` · ${escHtml(String(f).slice(0, 10))}` : ""}</option>`; }).join("");
  sel.value = (_eventoActivo && _eventoActivo.nombre) || "";
  _refrescarEventoUI();
}
async function _ventasDelEventoActivo() {
  if (!(_eventoActivo && _eventoActivo.nombre)) return [];
  let rows = [];
  try { rows = await (await fetch(`${API}/ventas/todas`)).json(); } catch (_) { rows = []; }
  const n = _eventoActivo.nombre;
  return (rows || []).filter((r) => (r.eventoNombre || "").trim() === n);
}
async function mostrarInvitados() {
  const rows = await _ventasDelEventoActivo();
  const g = new Map();
  rows.forEach((r) => {
    const nombre = ((r.clienteNombre || r.pagador || "").trim()) || t("guests.counter");
    const cur = g.get(nombre) || { qty: 0, spent: 0 };
    cur.qty += Number(r.cantidad) || 0;
    cur.spent += (Number(r.precioUnit) || 0) * (Number(r.cantidad) || 0);
    g.set(nombre, cur);
  });
  const filas = Array.from(g.entries()).sort((a, b) => b[1].spent - a[1].spent);
  const totQty = filas.reduce((a, f) => a + f[1].qty, 0);
  const totSpent = filas.reduce((a, f) => a + f[1].spent, 0);
  const cuerpo = filas.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:14px;">
         <thead><tr style="text-align:left;border-bottom:2px solid var(--azul-suave,#dde5ec);">
           <th style="padding:6px 4px;">${escHtml(t("guests.colName"))}</th>
           <th style="padding:6px 4px;text-align:right;">${escHtml(t("guests.colQty"))}</th>
           <th style="padding:6px 4px;text-align:right;">${escHtml(t("guests.colSpent"))}</th></tr></thead>
         <tbody>${filas.map((f) => `<tr style="border-bottom:1px solid var(--azul-suave,#eef2f6);"><td style="padding:6px 4px;">${escHtml(f[0])}</td><td style="padding:6px 4px;text-align:right;">${f[1].qty}</td><td style="padding:6px 4px;text-align:right;">${fmtMoney(f[1].spent)}</td></tr>`).join("")}</tbody>
         <tfoot><tr style="border-top:2px solid var(--azul-suave,#dde5ec);font-weight:700;"><td style="padding:6px 4px;">${escHtml(t("guests.total"))}</td><td style="padding:6px 4px;text-align:right;">${totQty}</td><td style="padding:6px 4px;text-align:right;">${fmtMoney(totSpent)}</td></tr></tfoot>
       </table>`
    : `<p style="font-size:14px;color:var(--ink-soft);">${escHtml(t("guests.none"))}</p>`;
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;z-index:9996;background:rgba(21,40,64,.82);display:flex;align-items:flex-end;justify-content:center;";
  const titulo = `${t("guests.titlePrefix")} — ${_eventoActivo.nombre}`;
  overlay.innerHTML = `<div style="background:var(--blanco-calido,#fbf5e8);width:100%;max-width:520px;border-radius:16px 16px 0 0;padding:20px 18px 28px;max-height:80vh;overflow:auto;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <strong style="font-family:var(--font-display);font-size:17px;color:var(--ink);flex:1;">${escHtml(titulo)}</strong>
      <button id="oc-inv-cerrar" style="font-size:13px;padding:6px 12px;border:2px solid var(--azul-medio,#2c4a68);border-radius:7px;background:var(--azul-medio,#2c4a68);color:#fbf5e8;cursor:pointer;">${escHtml(t("newcust.close"))}</button>
    </div>${cuerpo}</div>`;
  document.body.appendChild(overlay);
  const cerrar = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
  overlay.querySelector("#oc-inv-cerrar").addEventListener("click", cerrar);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrar(); });
}
async function exportarEventoCSV() {
  const rows = await _ventasDelEventoActivo();
  if (!rows.length) { await ocAlert(t("guests.export.nothing")); return; }
  const head = ["Date", "Product", "SKU", "Qty", "Unit", "Total", "Customer", "Event", "EventDate"];
  const q = (s) => `"${String(s == null ? "" : s).replace(/"/g, '""')}"`;
  const lineas = [head.map(q).join(",")].concat(rows.map((r) => [
    (r.fecha || "").slice(0, 10), r.productoNombre, r.sku, r.cantidad, r.precioUnit,
    ((Number(r.precioUnit) || 0) * (Number(r.cantidad) || 0)).toFixed(2),
    (r.clienteNombre || r.pagador || ""), r.eventoNombre, (r.eventoFecha || ""),
  ].map(q).join(",")));
  const csv = "﻿" + lineas.join("\r\n"); // BOM: Excel abre UTF-8 bien
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "event-" + String(_eventoActivo.nombre).replace(/[^\w.-]+/g, "_").slice(0, 60) + ".csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
(function () {
  const sel = document.getElementById("ventaEvento");
  const btnNuevo = document.getElementById("btnNuevoEvento");
  const wrapNuevo = document.getElementById("oc-evento-nuevo");
  const inpNombre = document.getElementById("oc-evento-nombre");
  const inpFecha = document.getElementById("oc-evento-fecha");
  const btnFijar = document.getElementById("oc-evento-fijar");
  const btnInv = document.getElementById("btnEventoInvitados");
  const btnExp = document.getElementById("btnEventoExport");
  if (sel) sel.addEventListener("change", () => {
    const o = sel.selectedOptions[0];
    _eventoActivo = sel.value ? { nombre: sel.value, fecha: (o && o.dataset.fecha) || "" } : null;
    _guardarEventoActivo(); _refrescarEventoUI();
    if (wrapNuevo) wrapNuevo.style.display = "none";
  });
  if (btnNuevo) btnNuevo.addEventListener("click", () => {
    if (!wrapNuevo) return;
    wrapNuevo.style.display = wrapNuevo.style.display === "none" ? "" : "none";
    if (wrapNuevo.style.display !== "none" && inpNombre) setTimeout(() => inpNombre.focus(), 40);
  });
  if (btnFijar) btnFijar.addEventListener("click", async () => {
    const nombre = (inpNombre.value || "").trim();
    if (!nombre) { if (inpNombre) inpNombre.focus(); await ocAlert(t("sold.eventNameRequired")); return; }
    _eventoActivo = { nombre: nombre, fecha: (inpFecha.value || "") };
    _guardarEventoActivo();
    inpNombre.value = ""; inpFecha.value = "";
    if (wrapNuevo) wrapNuevo.style.display = "none";
    await poblarSelectEventos();
  });
  if (btnInv) btnInv.addEventListener("click", mostrarInvitados);
  if (btnExp) btnExp.addEventListener("click", exportarEventoCSV);
})();

const elBtnCierre = document.getElementById("btnAplicarCierre");
if (elBtnCierre) elBtnCierre.addEventListener("click", async () => {
  const items = [...document.querySelectorAll("[data-cierre-prod]")]
    .map(i => ({ productoId: i.dataset.cierreProd, cantidad: Number(i.value) || 0 }))
    .filter(i => i.cantidad > 0);
  const msgEl = document.getElementById("cierreMsg");
  if (!items.length) { msgEl.textContent = t("sold.noQty"); msgEl.style.color = "var(--sim-rojo-dk)"; return; }
  const totalCierre = items.reduce((a, i) => a + i.cantidad, 0);
  if (!(await ocConfirm(tf("sold.closeConfirm", {n: totalCierre})))) return;
  const res = await fetch(`${API}/ventas/cierre`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
  const r = await res.json();
  if (!res.ok) { msgEl.textContent = r.error; msgEl.style.color = "var(--sim-rojo-dk)"; return; }
  msgEl.textContent = tf("sold.closeApplied", {n: r.aplicadas}) + (r.errores.length ? tf("sold.closeIssues", {errors: r.errores.join(" · ")}) : "");
  msgEl.style.color = r.errores.length ? "var(--sim-naranja-dk)" : "var(--sim-verde-dk)";
  cargarCierreLista();
  cargarGridVender();
});

// ============================================================================
// CLIENTES + MATRICES (JFC 2026-07-07)
// - Estaciones RFM: colores Simon reutilizados (verde/amarillo/naranja/azul).
// - Matriz de estaciones (clientes) y matriz BCG (inventario): SOLO dueno.
// ============================================================================
const ESTACIONES = {
  verano:    { icono: "", titulo: "Summer — peak harvest",  bg: "var(--sim-amarillo-bg)", borde: "var(--sim-amarillo)", tinta: "#B8860B", frase: "Buy often and big. Treat them like gold." },
  primavera: { icono: "", titulo: "Spring — growing",       bg: "var(--sim-verde-bg)",    borde: "var(--sim-verde)",    tinta: "#009A5A", frase: "Just sprouting. One touch of attention and they come back." },
  otono:     { icono: "", titulo: "Autumn — cooling down",         bg: "var(--sim-naranja-bg)",  borde: "var(--sim-naranja)",  tinta: "#C05000", frase: "Were your best clients and haven't shown up in a while. Reach out today." },
  invierno:  { icono: "", titulo: "Winter — dormant",         bg: "var(--sim-azul-bg)",     borde: "var(--sim-azul)",     tinta: "#2E6278", frase: "No signs of life. One message might wake them up." },
};
// Etiqueta de comportamiento según trato × confiabilidad.
// Badges de comportamiento como chips HTML — sin emojis, legibles y serios.
// Cada cuadrante tiene color semántico Simon: verde=saludable, rojo=emergencia, naranja=urgente, azul=contable.
// svgStarR/svgHeartR (JFC 2026-08-06, unico sistema de calificar en TODAS las
// apps, portado tal cual de amigable-123): estrella=confiabilidad,
// corazon=trato, escala 1-5, llena u con contorno gris segun este "on".
function svgStarR(on, size) {
  size = size || 22;
  return `<svg width="${size}" height="${size}" viewBox="0 0 14 14" fill="${on ? "#E8A020" : "none"}" stroke="${on ? "#B8760A" : "#B9C4CE"}" stroke-width="1.1"><polygon points="7,1 8.8,5.3 13.4,5.7 10.1,8.6 11.1,13.1 7,10.6 2.9,13.1 3.9,8.6 0.6,5.7 5.2,5.3"/></svg>`;
}
function svgHeartR(on, size) {
  size = size || 22;
  return `<svg width="${size}" height="${size}" viewBox="0 0 14 14" fill="${on ? "#E0245E" : "none"}" stroke="${on ? "#A81745" : "#B9C4CE"}" stroke-width="1.1"><path d="M7 12.5 C3 9.5 1 7.3 1 4.8 C1 3 2.4 1.6 4.1 1.6 C5.3 1.6 6.4 2.3 7 3.4 C7.6 2.3 8.7 1.6 9.9 1.6 C11.6 1.6 13 3 13 4.8 C13 7.3 11 9.5 7 12.5 Z"/></svg>`;
}
// nivelEv: normaliza escala 1-5 -> -1/0/+1 para los badges. 4-5=positivo, 1-2=negativo.
function nivelEv(v) { return v >= 4 ? 1 : (v > 0 && v <= 2) ? -1 : 0; }
function badgeComportamiento(ev) {
  if (!ev) return "";
  const t = nivelEv(ev.trato), cv = nivelEv(ev.confiabilidad);
  if (t === 0 && cv === 0) return "";
  const svgStar = `<svg width="14" height="14" viewBox="0 0 14 14" fill="#E8A020" style="vertical-align:middle;"><polygon points="7,1 8.8,5.3 13.4,5.7 10.1,8.6 11.1,13.1 7,10.6 2.9,13.1 3.9,8.6 0.6,5.7 5.2,5.3"/></svg>`;
  const svgFlag = `<svg width="13" height="14" viewBox="0 0 13 14" fill="#C0392B" style="vertical-align:middle;"><rect x="1" y="0" width="1.5" height="14"/><polygon points="2.5,0 12,3 2.5,7"/></svg>`;
  const svgEye = `<svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="#E86040" stroke-width="1.4" style="vertical-align:middle;"><ellipse cx="8" cy="5.5" rx="7" ry="4.5"/><circle cx="8" cy="5.5" r="2" fill="#E86040" stroke="none"/></svg>`;
  const svgCase = `<svg width="14" height="13" viewBox="0 0 14 13" fill="none" stroke="#2E6278" stroke-width="1.4" style="vertical-align:middle;"><rect x="1" y="4" width="12" height="8" rx="2"/><path d="M5 4V2.5A1.5 1.5 0 0 1 9 2.5V4"/></svg>`;
  const chip = (icon, txt, bg, color) =>
    `<span title="${txt}" style="display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 7px;border-radius:20px;font-size:13px;font-weight:700;background:${bg};color:${color} !important;-webkit-text-fill-color:${color} !important;">${icon}${txt}</span>`;
  if (t === 1 && cv === 1)   return chip(svgStar,  "VIP",      "#FEF6E0", "#8A5A00");
  if (t === -1 && cv === -1) return chip(svgFlag,  "Alert",   "#FDECEA", "#C0392B");
  if (t === 1 && cv === -1)  return chip(svgEye,   "Watch",   "#FFF3EE", "#E86040");
  if (t === -1 && cv === 1)  return chip(svgCase,  "Difficult",  "#EBF4F9", "#2E6278");
  if (t === 1)   return chip(svgHeartR(true, 14),  "Good manner",  "#EDFAF4", "#006B3C");
  if (t === -1)  return chip(svgHeartR(false, 14), "Difficult manner","#FDECEA","#C0392B");
  if (cv === 1)  return chip(svgStarR(true, 14),   "Reliable",   "#EDFAF4", "#006B3C");
  if (cv === -1) return chip(svgStarR(false, 14),  "Caution",  "#FEF6E0", "#8A5A00");
  return "";
}

function tarjetaCliente(c, esDueno){
  const ev = c.evaluacion || { trato: 0, confiabilidad: 0, historial: [] };
  /* "Han comprado" (2026-08-27, portado de amigable-123): un chip claro que
     dice si el cliente ha comprado o no, en vez de solo el número de compras.
     Verde = ha comprado; gris = aún no. Visible a dueño/admin. */
  const haComprado = (Number(c.frecuencia) || 0) > 0;
  const chipCompra = esDueno
    ? `<span title="${haComprado ? "Has bought" : "No purchases yet"}" style="display:inline-flex;align-items:center;gap:3px;margin-left:6px;padding:2px 8px;border-radius:4px;font-size:13px;font-weight:700;${haComprado ? "background:#EDFAF4;color:#006B3C !important;-webkit-text-fill-color:#006B3C !important;" : "background:#F4F7FA;color:#8A94A0 !important;-webkit-text-fill-color:#8A94A0 !important;"}">${haComprado ? "✓ Has bought" : "○ No purchases yet"}</span>`
    : "";
  const dato = esDueno
    ? `<div style="font-size:15px;color:#2C3E50;margin-top:3px;">${c.frecuencia} purchase(s) in 90 days · ${fmtMoney(c.monto)}${c.recencia != null ? ` · last ${c.recencia} day(s) ago` : " · no purchases yet"}</div>`
    : "";
  // Contacto + notas (2026-08-27, portado de amigable-123): el shared digital
  // notebook deja ver y editar el contacto y las notas del cliente. Privacidad
  // por rol: solo dueño/admin ven telefono/email/notas completos.
  const contactoPartes = [];
  if (esDueno && c.telefono) contactoPartes.push(`☎ ${escHtml(c.telefono)}`);
  if (esDueno && c.email) contactoPartes.push(`✉ ${escHtml(c.email)}`);
  const lineaContacto = contactoPartes.length
    ? `<div style="font-size:14px;color:var(--ink-soft);margin-top:2px;">${contactoPartes.join(" · ")}</div>` : "";
  const lineaNotas = (esDueno && c.notas)
    ? `<div style="font-size:14px;color:var(--ink-soft);margin-top:2px;font-style:italic;">"${escHtml(c.notas)}"</div>` : "";
  // Lapicito para editar contacto/notas (2026-08-27): panel colapsable.
  const editKey = "cliedit-" + c.id;
  const panelEditAbierto = window.OCClienteEditOpen && window.OCClienteEditOpen.has(editKey);
  const btnEditar = `<button onclick="toggleEditarContacto('${editKey}')" style="margin-top:8px;font-size:13px;padding:4px 12px;background:#F4F7FA;border:1.5px solid var(--azul-medio,#2E6278);border-radius:6px;color:#1E4258 !important;-webkit-text-fill-color:#1E4258 !important;cursor:pointer;">✎ Edit contact / notes</button>`;
  // Borrar cliente (JFC 2026-08-27): solo dueño/admin. Borrado REAL, pero
  // siempre queda constancia en el registro de auditoría (mov "cliente-borrado").
  const btnBorrar = esDueno
    ? `<button onclick="borrarCliente('${c.id}','${escHtml(c.nombre)}')" title="Delete this customer permanently (kept in the audit log)"
        style="margin-top:8px;font-size:13px;padding:4px 12px;background:#FDECEA;border:1.5px solid #C0392B;border-radius:6px;color:#C0392B !important;-webkit-text-fill-color:#C0392B !important;cursor:pointer;">🗑 Delete</button>`
    : "";
  const panelEditar = `<div id="oc-${editKey}" style="display:${panelEditAbierto ? "flex" : "none"};gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px;padding:8px 10px;background:var(--blanco-calido,#fbf5e8);border-radius:6px;">
      <input id="oc-edit-nombre-${c.id}" type="text" value="${escHtml(c.nombre || "")}" placeholder="Name" style="flex:1;min-width:140px;padding:7px;border:2px solid var(--azul-medio);border-radius:4px;font-size:15px;">
      ${esDueno ? `<input id="oc-edit-tel-${c.id}" type="text" value="${escHtml(c.telefono || "")}" placeholder="Phone / WhatsApp" style="flex:1;min-width:120px;padding:7px;border:2px solid var(--azul-medio);border-radius:4px;font-size:15px;">
      <input id="oc-edit-email-${c.id}" type="email" value="${escHtml(c.email || "")}" placeholder="Email" style="flex:1;min-width:140px;padding:7px;border:2px solid var(--azul-medio);border-radius:4px;font-size:15px;">
      <input id="oc-edit-notas-${c.id}" type="text" value="${escHtml(c.notas || "")}" placeholder="Notes" style="flex:2;min-width:140px;padding:7px;border:2px solid var(--azul-medio);border-radius:4px;font-size:15px;">` : ""}
      <button onclick="guardarContactoCliente('${c.id}')" class="ir" style="font-size:13px;padding:6px 12px;">Save</button>
    </div>`;
  // Controles de evaluación: visibles a dueño y encargados (no en demo si no hay sesión).
  const puedeEvaluar = window.OCAuth && window.OCAuth.rolActual && (window.OCAuth.rolActual() === "dueno" || window.OCAuth.rolActual() === "empleado");
  // CALIFICADOR 1-5 (JFC 2026-08-06, portado tal cual de amigable-123 — es el
  // UNICO sistema de calificar en todas las apps, fin de manitos/upvotes/tri-
  // estado). Tap acumulativo: tocar N enciende 1..N; tocar el mismo N otra vez
  // limpia a 0. confiabilidad=estrella, trato=corazon.
  const filaRate = (campo, valor, iconoFn, titulo) => {
    let btns = "";
    for (let n = 1; n <= 5; n++) {
      btns += `<button class="oc-rate-btn" title="${titulo} ${n} of 5"
        onclick="evaluarCliente('${c.id}','${campo}',${n},this)">${iconoFn(n <= valor, 20)}</button>`;
    }
    return `<span class="oc-rate-row" data-valor="${valor}">${btns}</span>`;
  };
  const promEje = (campo) => {
    const vals = (ev.historial || []).map(h => Number(h[campo]) || 0).filter(v => v >= 1 && v <= 5);
    if (vals.length) return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    const actual = Number(ev[campo]) || 0;
    return actual >= 1 ? actual.toFixed(1) : null;
  };
  // Campo hora del incidente — auto-rellena con la hora actual; va en el historial
  // para que el encargado pueda conciliar con cámaras/audios si hay un alegato.
  const ahoraHora = new Date().toTimeString().slice(0,5);
  const hayNegativo = nivelEv(ev.trato) === -1 || nivelEv(ev.confiabilidad) === -1;
  const campoHora = puedeEvaluar ? `
    <div id="oc-inc-wrap-${c.id}" style="display:${hayNegativo ? "flex" : "none"};align-items:center;gap:8px;margin-top:6px;padding:6px 10px;background:#FFF8F8;border:1px solid #FDDBD8;border-radius:7px;flex-wrap:wrap;">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#C0392B" stroke-width="1.4" style="flex-shrink:0;"><circle cx="7" cy="7" r="6"/><path d="M7 4v3l2 1.5"/></svg>
      <label style="font-size:13px;font-weight:700;color:#C0392B !important;-webkit-text-fill-color:#C0392B !important;">Incident time:</label>
      <input type="time" id="oc-inc-${c.id}" value="${ahoraHora}"
        style="padding:3px 8px;border:1.5px solid #E0B0AD;border-radius:5px;font-size:13px;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;background:#fff;">
      <span style="font-size:13px;color:#999999 !important;-webkit-text-fill-color:#999999 !important;">(for cross-reference with cameras / audio)</span>
    </div>` : "";
  const controles = puedeEvaluar ? `
    <div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:8px;align-items:center;">
      <span style="display:inline-flex;align-items:center;white-space:nowrap;">
        <span style="font-size:13px;font-weight:700;color:#2E6278;margin-right:4px;">Reliability:</span>
        ${filaRate("confiabilidad", ev.confiabilidad, svgStarR, "Reliability")}
      </span>
      <span style="display:inline-flex;align-items:center;white-space:nowrap;">
        <span style="font-size:13px;font-weight:700;color:#2E6278;margin-right:4px;">Manner:</span>
        ${filaRate("trato", ev.trato, svgHeartR, "Manner")}
      </span>
    </div>${campoHora}` : "";
  const btnDespedir = (esDueno && nivelEv(ev.trato) === -1 && nivelEv(ev.confiabilidad) === -1)
    ? `<button style="margin-top:8px;font-size:13px;padding:4px 12px;background:#FDECEA;border:1.5px solid #C0392B;border-radius:6px;color:#C0392B !important;-webkit-text-fill-color:#C0392B !important;cursor:pointer;"
        data-despedir-id="${c.id}" data-despedir-nombre="${escHtml(c.nombre)}"
        onclick="despedirCliente(this.dataset.despedirId, this.dataset.despedirNombre)">Fire client 🚪</button>` : "";
  // Cartera (fiado/abono) — Fase 1 del roadmap. El saldo se pide async
  // despues de pintar la tarjeta (ver cargarClientes) para no bloquear el
  // render con una lectura a IndexedDB; el placeholder queda vacio hasta ahi.
  // Alerta de saldo pendiente: activable/desactivable POR CLIENTE (no hay
  // penalidad ni recargo nunca — solo si se avisa o no). Default encendida.
  const alertaOn = window.AMG && window.AMG.Cartera ? window.AMG.Cartera.alertaActiva(c.id) : true;
  const toggleAlerta = esDueno ? `
    <label style="display:flex;align-items:center;gap:5px;font-size:13px;color:#2C3E50;margin-top:6px;cursor:pointer;">
      <input type="checkbox" ${alertaOn ? "checked" : ""} onchange="toggleAlertaCliente('${c.id}', this.checked)">
      Alert me if this client owes money
    </label>` : "";
  const carteraHtml = `
    <div id="cartera-${c.id}" style="margin-top:8px;"></div>
    <div style="display:flex;gap:8px;margin-top:6px;">
      <button style="font-size:13px;padding:4px 12px;background:#FDECEA;border:1.5px solid #C0392B;border-radius:6px;color:#C0392B !important;-webkit-text-fill-color:#C0392B !important;cursor:pointer;"
        onclick="fiarCliente('${c.id}','${escHtml(c.nombre)}')">Record credit (fiado)</button>
      <button style="font-size:13px;padding:4px 12px;background:#EDFAF4;border:1.5px solid #006B3C;border-radius:6px;color:#006B3C !important;-webkit-text-fill-color:#006B3C !important;cursor:pointer;"
        onclick="abonarCliente('${c.id}','${escHtml(c.nombre)}')">Record payment (abono)</button>
    </div>${toggleAlerta}`;
  return `<div class="cliente-card" style="background:#FFFFFF;border:2px solid var(--linea,#D7E0E8);border-radius:10px;padding:10px 12px;margin:6px 0;">
    <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
      <strong style="font-size:16px;color:#0F1923;">${escHtml(c.nombre)}</strong>
      <span style="font-family:var(--font-mono);font-size:14px;color:#2E6278;margin-left:6px;">${escHtml(c.codigo)}</span>
      ${chipCompra}
      ${(promEje("confiabilidad") || promEje("trato")) ? `<span title="Average rating" style="display:inline-flex;align-items:center;gap:3px;margin-left:6px;padding:2px 8px;border-radius:4px;font-size:13px;font-weight:700;background:#F4F7FA;color:#1E4258;">${promEje("confiabilidad") ? `${svgStarR(true, 13)}${promEje("confiabilidad")}` : ""}${promEje("trato") ? `${svgHeartR(true, 13)}${promEje("trato")}` : ""}</span>` : ""}
      ${esDueno ? badgeComportamiento(ev) : ""}
    </div>
    ${dato}${lineaContacto}${lineaNotas}${controles}${btnDespedir}${carteraHtml}
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;">${btnEditar}${btnBorrar}</div>
    ${panelEditar}
  </div>`;
}
// Editar contacto/notas del cliente (2026-08-27, portado de amigable-123).
window.OCClienteEditOpen = window.OCClienteEditOpen || new Set();
function toggleEditarContacto(key) {
  if (window.OCClienteEditOpen.has(key)) window.OCClienteEditOpen.delete(key);
  else window.OCClienteEditOpen.add(key);
  cargarClientes();
}
async function guardarContactoCliente(id) {
  // Solo se manda lo que exista en el DOM (privacidad por rol): un encargado
  // no tiene telefono/email/notas, así que no se pisan con "".
  const nombreEl = document.getElementById(`oc-edit-nombre-${id}`);
  const telEl = document.getElementById(`oc-edit-tel-${id}`);
  const emailEl = document.getElementById(`oc-edit-email-${id}`);
  const notasEl = document.getElementById(`oc-edit-notas-${id}`);
  const body = {};
  if (nombreEl) body.nombre = nombreEl.value;
  if (telEl) body.telefono = telEl.value;
  if (emailEl) body.email = emailEl.value;
  if (notasEl) body.notas = notasEl.value;
  const res = await fetch(`${API}/clientes/${id}/contacto`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { const r = await res.json().catch(() => ({})); alert(r.error || "Could not save the contact."); return; }
  cargarClientes();
}
// Pinta el saldo derivado (nunca un numero guardado) en el placeholder de la
// tarjeta. Formato: "Owes $40.00" / "Credit $10.00" / sin nada si esta en 0.
async function pintarSaldoCartera(clienteId) {
  const el = document.getElementById(`cartera-${clienteId}`);
  if (!el) return;
  try {
    const info = await (await fetch(`${API}/clientes/${clienteId}/cartera`)).json();
    if (!info || !info.saldo) { el.innerHTML = ""; return; }
    const debe = info.saldo < 0;
    const color = debe ? "#C0392B" : "#006B3C";
    const texto = debe ? `Owes ${fmtMoney(-info.saldo)}` : `Credit ${fmtMoney(info.saldo)}`;
    // La alerta es solo un badge visual (nunca interes/recargo): se muestra
    // si el cliente debe Y el dueño no la apagó para este caso puntual.
    const alertaOn = window.AMG && window.AMG.Cartera ? window.AMG.Cartera.alertaActiva(clienteId) : true;
    const badge = (debe && alertaOn)
      ? `<span style="margin-left:6px;font-size:13px;font-weight:700;background:#C0392B;color:#fff !important;-webkit-text-fill-color:#fff !important;padding:2px 8px;border-radius:20px;">pending</span>`
      : "";
    el.innerHTML = `<span style="font-size:14px;font-weight:700;color:${color} !important;-webkit-text-fill-color:${color} !important;">${texto}</span>${badge}`;
  } catch (_) { el.innerHTML = ""; }
}
function toggleAlertaCliente(clienteId, activa) {
  if (window.AMG && window.AMG.Cartera) window.AMG.Cartera.fijarAlerta(clienteId, activa);
  pintarSaldoCartera(clienteId);
}
async function fiarCliente(clienteId, nombre) {
  const monto = parseFloat((await ocPrompt(`Amount ${nombre} is taking on credit ($):`, "") || "").trim());
  if (!(monto > 0)) return;
  const motivo = (await ocPrompt("Reason (optional):", "") || "").trim();
  if (!(await ocConfirm(`Record ${fmtMoney(monto)} owed by ${nombre}?`))) return;
  try {
    await fetch(`${API}/clientes/${clienteId}/fiar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monto, motivo }) });
    pintarSaldoCartera(clienteId);
  } catch (e) { console.error("Error registrando fiado:", e); }
}
async function abonarCliente(clienteId, nombre) {
  const monto = parseFloat((await ocPrompt(`Payment amount from ${nombre} ($):`, "") || "").trim());
  if (!(monto > 0)) return;
  const motivo = (await ocPrompt("Reason (optional):", "") || "").trim();
  if (!(await ocConfirm(`Record ${fmtMoney(monto)} paid by ${nombre}?`))) return;
  try {
    await fetch(`${API}/clientes/${clienteId}/abonar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monto, motivo }) });
    pintarSaldoCartera(clienteId);
  } catch (e) { console.error("Error registrando abono:", e); }
}
async function cargarClientes(){
  // dueño Y admin ven todo ("plenamente visibles", JFC 2026-07-29) — solo
  // encargado/contador quedan en modo restringido mas abajo.
  const rolAhora = window.OCAuth && window.OCAuth.rolActual ? window.OCAuth.rolActual() : "";
  const esDueno = rolAhora === "dueno" || rolAhora === "admin";
  let grupos;
  try { grupos = await (await fetch(`${API}/clientes/matriz`)).json(); } catch (_) { return; }
  const orden = ["verano", "primavera", "otono", "invierno"];
  const todos = orden.reduce((a, k) => a.concat(grupos[k] || []), []);

  // Lista dinámica (búsqueda + orden) — reemplaza el listado plano de antes.
  // Modo restringido para empleado: sin ver NADA hasta buscar, tope de
  // resultados, sin el badge de comportamiento (ver tarjetaCliente). No es
  // "seguridad dura" (esta app no tiene servidor que la imponga) — es
  // fricción deliberada y respetuosa, no un candado.
  if (window.AMG && window.AMG.ListaDinamica) {
    window.AMG.ListaDinamica.crear({
      contenedorId: "listaClientes",
      restringido: !esDueno,
      minCaracteres: 2,
      limite: 8,
      placeholderBusqueda: "Search by name or code...",
      mensajeRestringido: "Type a name or code to look up a customer.",
      mensajeVacio: "No clients yet. Add the first one above.",
      // "90-day spend" es dato financiero del cliente — mismo criterio que
      // el resto de la tarjeta (esDueno): ni siquiera se ofrece como opcion
      // de orden si no se va a mostrar el numero.
      columnas: [
        { key: "nombre", label: "Name", ordenable: true },
        { key: "codigo", label: "Code", ordenable: true },
      ].concat(esDueno ? [{ key: "monto", label: "90-day spend", ordenable: true, valor: (c) => c.monto || 0 }] : []),
      datos: () => todos,
      renderFila: (c) => tarjetaCliente(c, esDueno),
    });
  } else {
    // Respaldo si el script no cargó: comportamiento anterior, sin romper la pantalla.
    document.getElementById("listaClientes").innerHTML = todos.map((c) => tarjetaCliente(c, esDueno)).join("") || '<p style="font-size:16px;">No clients yet. Add the first one above.</p>';
  }
  // Saldo de cartera: se pinta DESPUES del render (lectura async a IndexedDB
  // via AMG.Hechos) para no bloquear la pintura de las tarjetas.
  todos.forEach((c) => pintarSaldoCartera(c.id));
  // Matriz de estaciones 2x2 — solo dueno. Eje horizontal: qué tan reciente
  // compra. Eje vertical: cuánto valor deja. Es la lectura RFM en un vistazo.
  const mc = document.getElementById("matrizClientes");
  if (!esDueno) { mc.innerHTML = ""; }
  else {
    const celda = (k) => { const e = ESTACIONES[k], l = grupos[k] || []; return `<div style="background:${e.bg};border:2px solid ${e.borde};border-radius:10px;padding:12px;min-height:90px;">
      <div style="font-weight:700;font-size:15px;color:${e.tinta};">${e.icono} ${e.titulo.split(" — ")[0]}</div>
      <div style="font-size:14px;color:#0F1923;margin-top:6px;">${l.length ? l.map((c) => escHtml(c.nombre.split(" ")[0])).join(", ") : "—"}</div></div>`; };
    /* Se arma pero NO se escribe todavia: va DEBAJO de comportamiento. */
    var htmlEstaciones = `<h3 class="seccion">Seasons</h3>
      <p style="font-size:15px;color:var(--ink-soft);margin-top:0;">Right: bought recently. Top: higher value. The autumn corner is where lost revenue is recovered.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${celda("otono")}${celda("verano")}
        ${celda("invierno")}${celda("primavera")}
      </div>`;

    // Matriz de comportamiento — trato × confiabilidad (2026-07-08).
    // Cuatro cuadrantes: el negocio evalúa al cliente, no solo al revés.
    let comp;
    try { comp = await (await fetch(`${API}/clientes/comportamiento`)).json(); } catch(_) { comp = null; }
    if (comp) {
      const CUAD = [
        { key:"estrella",  emoji:"⭐", titulo:"Stars",          sub:"Pleasant and reliable. Treat them like gold.",      bg:"#FFFBEA", borde:"#E8A020", tinta:"#B8760A" },
        { key:"ojo",       emoji:"👀", titulo:"Watch list",     sub:"Friendly but with a history of issues.",      bg:"#FFF4E8", borde:"#E86040", tinta:"#C04020" },
        { key:"tolerable", emoji:"💼", titulo:"Tolerable",      sub:"Difficult manner, but they follow through and pay.",   bg:"#EBF4FF", borde:"#2E6278", tinta:"#1E4258" },
        { key:"bandera",   emoji:"🚩", titulo:"Red flag",       sub:"Issues on both axes. Evaluate whether it's worth it.", bg:"#FDECEA", borde:"#C0392B", tinta:"#8B0000" },
      ];
      const celdaComp = (q) => {
        const lista = comp[q.key] || [];
        const chips = lista.slice(0,6).map(c => `<span style="display:inline-block;background:#FFFFFF;border:1.5px solid ${q.borde};border-radius:6px;padding:2px 8px;margin:2px;font-size:13px;color:#0F1923;">${escHtml(c.nombre.split(" ")[0])}</span>`).join("");
        const extra = lista.length > 6 ? `<span style="font-size:13px;color:${q.tinta};">+${lista.length-6} more</span>` : "";
        return `<div style="background:${q.bg};border:2px solid ${q.borde};border-radius:10px;padding:12px;min-height:80px;">
          <div style="font-weight:700;font-size:15px;color:${q.tinta};">${q.emoji} ${q.titulo} (${lista.length})</div>
          <div style="font-size:13px;color:${q.tinta};margin:2px 0 6px;">${q.sub}</div>
          ${chips}${extra}</div>`;
      };
      const neutros = comp.neutro || [];
      const despedidos = comp.despedidos || [];
      var htmlComportamiento = `
        <h3 class="seccion" style="margin-top:24px;">Behavior matrix</h3>
        <p style="font-size:15px;color:var(--ink-soft);margin-top:0;">With friendly-123 you get to rate your customers too, and even build a blacklist. Tap Rate on any card and give stars for reliability and hearts for attitude, 1 to 5.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${celdaComp(CUAD[0])}${celdaComp(CUAD[1])}
          ${celdaComp(CUAD[2])}${celdaComp(CUAD[3])}
        </div>
        ${neutros.length ? `<p style="font-size:14px;color:var(--ink-soft);margin-top:10px;">Not evaluated yet: ${neutros.map(c=>escHtml(c.nombre.split(" ")[0])).join(", ")}.</p>` : ""}
        ${despedidos.length ? `
        <details style="margin-top:14px;">
          <summary style="font-size:14px;font-weight:700;cursor:pointer;color:#C0392B;">Clientes despedidos (${despedidos.length})</summary>
          <div style="margin-top:8px;">${despedidos.map(c => `
            <div style="background:#FDECEA;border:1.5px solid #C0392B;border-radius:8px;padding:8px 12px;margin:4px 0;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-size:15px;color:#0F1923;">${escHtml(c.nombre)}</span>
              <button style="font-size:13px;padding:3px 10px;background:#E8F8F0;border:1.5px solid #009A5A;border-radius:6px;color:#009A5A !important;-webkit-text-fill-color:#009A5A !important;cursor:pointer;"
                data-reactivar-id="${c.id}" data-reactivar-nombre="${escHtml(c.nombre)}"
                onclick="reactivarCliente(this.dataset.reactivarId, this.dataset.reactivarNombre)">Reactivar</button>
            </div>`).join("")}
          </div>
        </details>` : ""}`;
      }
      /* EL ORDEN IMPORTA (JFC, 2026-08-13): comportamiento primero, estaciones
         despues. Con quien puedo contar pesa mas que en que epoca compra, y las
         estaciones son una lectura secundaria que no debe abrir la seccion. */
      mc.innerHTML = (typeof htmlComportamiento === "string" ? htmlComportamiento : "") + htmlEstaciones;
  }
  poblarSelectClientes(grupos);
  // Importar CSV: solo el dueno lo ve (regla JFC). El encargado se queda con el
  // alta manual de arriba.
  const importBloque = document.getElementById("cliImportarBloque");
  if (importBloque) {
    importBloque.style.display = esDueno ? "block" : "none";
    if (esDueno) inicializarImportCSV();
  }
  const btn = document.getElementById("btnAltaCliente");
  if (btn && !btn.dataset.listo) {
    btn.dataset.listo = "1";
    btn.addEventListener("click", async () => {
      const nombre = document.getElementById("cliNombre").value;
      const telefono = document.getElementById("cliTelefono").value;
      const email = (document.getElementById("cliEmail") || {}).value || "";
      const res = await fetch(`${API}/clientes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, telefono, email }) });
      const r = await res.json();
      const msgEl = document.getElementById("cliMsg");
      if (!res.ok) { msgEl.textContent = r.error; msgEl.style.color = "var(--sim-rojo-dk)"; return; }
      msgEl.textContent = `Client registered with code ${r.codigo}.`;
      msgEl.style.color = "var(--sim-verde-dk)";
      document.getElementById("cliNombre").value = ""; document.getElementById("cliTelefono").value = "";
      { const _e = document.getElementById("cliEmail"); if (_e) _e.value = ""; }
      cargarClientes();
    });
  }
}
// Puebla un <select> de comisionistas (promotoras) con el valor actual opcional.
// JFC 2026-08-27: usado en alta (np-comisionista) y edición (ed-comisionista) de producto.
async function poblarSelectComisionistas(selectId, valorActual){
  const sel = document.getElementById(selectId);
  if (!sel) return;
  let lista = [];
  try { lista = await (await fetch(`${API}/promotoras`)).json(); } catch (_) {}
  if (!Array.isArray(lista)) lista = [];
  sel.innerHTML = `<option value="">— None —</option>` + lista.map(p => `<option value="${escHtml(p.id)}">${escHtml(p.nombre)}</option>`).join("");
  if (valorActual) sel.value = valorActual;
}
async function poblarSelectClientes(grupos){
  const sel = document.getElementById("ventaCliente");
  if (!sel) return;
  let lista = [];
  if (grupos && grupos.verano) lista = [].concat(grupos.verano, grupos.primavera, grupos.otono, grupos.invierno);
  else {
    // Microcirugia 9 (2026-07-08): antes el catch silencioso dejaba el select
    // con solo 'Mostrador' sin aviso — el operador asumia que no habia clientes.
    try { lista = await (await fetch(`${API}/clientes`)).json(); }
    catch (_) { if (sel) sel.title = 'Could not load the customer list. Reload this view.'; return; }
  }
  const actual = sel.value;
  sel.innerHTML = `<option value="">${escHtml(t("sold.counterSale"))}</option>` + lista.map((c) => `<option value="${c.id}">${escHtml(c.nombre)} (${escHtml(c.codigo)})</option>`).join("");
  if (actual) sel.value = actual;
}
// Parser CSV minimo y robusto (sin librerias): respeta comillas dobles y
// comas dentro de campos entrecomillados. Devuelve filas de campos ya
// recortados. Tolera saltos de linea Windows/Unix.
function parsearCSV(texto){
  const filas = [];
  const lineas = String(texto || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const linea of lineas){
    if (!linea.trim()) continue;
    const campos = [];
    let cur = "", enComillas = false;
    for (let i = 0; i < linea.length; i++){
      const ch = linea[i];
      if (ch === '"'){
        if (enComillas && linea[i + 1] === '"'){ cur += '"'; i++; }
        else enComillas = !enComillas;
      } else if (ch === "," && !enComillas){ campos.push(cur); cur = ""; }
      else cur += ch;
    }
    campos.push(cur);
    filas.push(campos.map((c) => c.trim()));
  }
  return filas;
}
// Importacion de clientes por CSV — SOLO dueno (el bloque ni se muestra al
// encargado). Toda la validacion pesada ocurre tambien en el mock; aqui se
// filtra lo obvio para dar feedback rapido y no mandar basura.
function inicializarImportCSV(){
  const inp = document.getElementById("cliCsvFile");
  if (!inp || inp.dataset.listo) return;
  inp.dataset.listo = "1";
  inp.addEventListener("change", async (e) => {
    const f = e.target.files && e.target.files[0];
    const msg = document.getElementById("cliCsvMsg");
    if (!f) return;
    if (f.size > 1024 * 1024){ msg.textContent = "El archivo es muy grande (maximo 1 MB)."; msg.style.color = "var(--sim-rojo-dk)"; inp.value = ""; return; }
    let texto;
    try { texto = await f.text(); } catch (_){ msg.textContent = "Could not read the file."; msg.style.color = "var(--sim-rojo-dk)"; inp.value = ""; return; }
    let filas = parsearCSV(texto);
    if (!filas.length){ msg.textContent = "El archivo esta vacio."; msg.style.color = "var(--sim-rojo-dk)"; inp.value = ""; return; }
    // Descartar una cabecera si la primera fila parece titulos.
    const c0 = (filas[0][0] || "").toLowerCase(), c1 = (filas[0][1] || "").toLowerCase();
    if (c0.includes("nombre") || c1.includes("tel")) filas = filas.slice(1);
    const nuevos = filas.map((r) => ({ nombre: r[0] || "", telefono: r[1] || "" })).filter((c) => c.nombre);
    if (!nuevos.length){ msg.textContent = "No valid names found. The first column must be the name."; msg.style.color = "var(--sim-rojo-dk)"; inp.value = ""; return; }
    if (nuevos.length > 5000){ msg.textContent = "Too many clients at once (max 5,000)."; msg.style.color = "var(--sim-rojo-dk)"; inp.value = ""; return; }
    msg.textContent = "Importando " + nuevos.length + "..."; msg.style.color = "var(--ink)";
    let r;
    try { r = await (await fetch(`${API}/clientes/importar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientes: nuevos }) })).json(); }
    catch (_){ msg.textContent = "Import failed (no connection to local server)."; msg.style.color = "var(--sim-rojo-dk)"; inp.value = ""; return; }
    if (r.error){ msg.textContent = r.error; msg.style.color = "var(--sim-rojo-dk)"; inp.value = ""; return; }
    msg.textContent = `Listo: ${r.agregados} cliente(s) agregados` + (r.repetidos ? `, ${r.repetidos} repetido(s) saltados` : "") + (r.invalidos ? `, ${r.invalidos} sin nombre` : "") + ".";
    msg.style.color = "var(--sim-verde-dk)";
    inp.value = "";
    cargarClientes();
  });
}

// Matriz BCG del inventario — bien al fondo de la vista, solo dueno.
async function cargarBCG(){
  const cont = document.getElementById("matrizBCG");
  if (!cont) return;
  if (!window.OCAuth || !window.OCAuth.puedeGestionar()) { cont.innerHTML = ""; return; }
  let q;
  // Microcirugia 10 (2026-07-08): catch silencioso dejaba la matriz BCG en blanco.
  try { q = await (await fetch(`${API}/inventario/bcg?ubicacionId=${ubicacionActual}`)).json(); }
  catch (_) { cont.innerHTML = '<p style="font-size:14px;color:var(--ink-soft);">' + window.t("err.bcgLoad") + '</p>'; return; }
  const CUAD = {
    estrellas:    { icono: "⭐", titulo: "Estrellas",      sub: "Sell a lot and trending up. Protect their stock.",         bg: "var(--sim-verde-bg)",    borde: "var(--sim-verde)",    tinta: "#009A5A" },
    vacas:        { icono: "", titulo: "Cash cows", sub: "Sell a lot, stable. They fund everything else.",       bg: "var(--sim-amarillo-bg)", borde: "var(--sim-amarillo)", tinta: "#B8860B" },
    promesas:     { icono: "❓", titulo: "Rising stars",       sub: "Sell little but trending up. Give them shelf space.",          bg: "var(--sim-azul-bg)",     borde: "var(--sim-azul)",     tinta: "#2E6278" },
    pesosMuertos: { icono: "💤", titulo: "Dead weight",  sub: "No movement in 60 days. Free up that capital.",         bg: "var(--sim-plata-bg)",    borde: "var(--sim-plata-dk)", tinta: "#2C3E50" },
  };
  const celda = (k) => {
    const c = CUAD[k], l = q[k] || [];
    const chips = l.slice(0, 8).map((i) => `<span style="display:inline-block;background:#FFFFFF;border:1.5px solid ${c.borde};border-radius:6px;padding:3px 8px;margin:3px 3px 0 0;font-size:14px;color:#0F1923;">${escHtml(i.nombre)}${i.total > 0 ? ` · ${fmtMoney(i.total)}` : ""}</span>`).join("");
    const extra = l.length > 8 ? `<div style="font-size:14px;color:#2C3E50;margin-top:4px;">and ${l.length - 8} more…</div>` : "";
    return `<div style="background:${c.bg};border:2px solid ${c.borde};border-radius:10px;padding:12px;">
      <div style="font-weight:700;font-size:15px;color:${c.tinta};">${c.icono} ${c.titulo} (${l.length})</div>
      <div style="font-size:14px;color:#2C3E50;margin:2px 0 6px;">${c.sub}</div>${chips}${extra}</div>`;
  };
  cont.innerHTML = `<h3 class="seccion">${t("bcg.heading")}</h3>
    <p style="font-size:15px;color:var(--ink-soft);margin-top:0;">${t("bcg.intro")}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      ${celda("promesas")}${celda("estrellas")}
      ${celda("pesosMuertos")}${celda("vacas")}
    </div>`;
}

function refrescarVistaActiva(){
  const v = vistaActivaId();
  const cargadores = { hoy: cargarHoy, inventario: () => { cargarInventario(); cargarBCG(); }, etiquetas: cargarEtiquetas, avanzado: cargarAvanzado, comisiones: cargarComisiones, clientes: cargarClientes, gastos: cargarGastos, escanear: () => { poblarSelectClientes(); poblarSelectEventos(); cargarGridVender(); }, perchas: () => window.VPerchas && window.VPerchas.cargar() };
  const fn = cargadores[v];
  if (fn) Promise.resolve(fn()).catch(err => console.error(`Error cargando vista "${v}":`, err));
}

// --- Logo header: volver a Hoy ---
const elLogoHeader = document.getElementById("logoHeader");
if (elLogoHeader) elLogoHeader.addEventListener("click", () => {
  const b = document.querySelector('nav button[data-vista="hoy"]');
  if (b) b.click();
});

// --- Switch bilingüe EN/ES ---
// Marca el idioma activo, cambia con OCI18n, y al cambiar re-traduce los nodos
// estáticos (applyStatic ya corre dentro de setLang) y re-renderiza la vista
// dinámica activa para que su contenido salga en el nuevo idioma.
(function () {
  function marcar() {
    if (!window.OCI18n) return;
    const cur = window.OCI18n.getLang();
    document.querySelectorAll(".oc-lang-btn").forEach((b) => b.classList.toggle("activo", b.dataset.lang === cur));
  }
  document.addEventListener("click", function (ev) {
    const b = ev.target && ev.target.closest && ev.target.closest(".oc-lang-btn");
    if (!b || !window.OCI18n) return;
    window.OCI18n.setLang(b.dataset.lang);
  });
  window.addEventListener("oc-lang-change", () => {
    marcar();
    try { refrescarVistaActiva(); } catch (_) {}
  });
  marcar();
})();

// --- Nombre editable del negocio (identidad de instancia, 2026-07-08) ---
// El dueño toca el lápiz junto al título y renombra su negocio; se guarda en la
// identidad de la instancia (viaja en respaldos/sync). FAIL-SAFE TOTAL: cada
// parte va en try/catch; si algo falla, el título por defecto se queda y NADA
// más se rompe. El lápiz NO se muestra en modo demo (no es una instancia real).
(function () {
  const span = document.getElementById("oc-negocio-nombre");
  const btn = document.getElementById("oc-negocio-editar");
  if (!span || !btn) return;
  function tituloPorDefecto() {
    try { if (window.t) return window.t("header.bizNameDefault"); } catch (_) {}
    return "My store or shelf(s)";
  }
  function esPlaceholder(s) {
    const x = String(s || "").trim();
    return !x || x === "My store or shelf(s)" || x === "Mi Local Comercial o Percha(s)" || x === tituloPorDefecto();
  }
  function pintarNombre(nombre) {
    const n = String(nombre || "").trim();
    if (n && !esPlaceholder(n)) {
      span.removeAttribute("data-i18n");
      span.textContent = n;
    } else {
      span.setAttribute("data-i18n", "header.bizNameDefault");
      span.textContent = tituloPorDefecto();
    }
  }
  async function cargarNombre() {
    try {
      const inst = await (await fetch(`${API}/instancia`)).json();
      if (inst && inst.nombreNegocio) {
        pintarNombre(inst.nombreNegocio);
        try { const o = JSON.parse(localStorage.getItem("f123_owned") || "null"); if (o && o.nombreNegocio !== inst.nombreNegocio) { o.nombreNegocio = inst.nombreNegocio; localStorage.setItem("f123_owned", JSON.stringify(o)); } } catch (_) {}
        return;
      }
      try {
        const o = JSON.parse(localStorage.getItem("f123_owned") || "null") || {};
        if (o.nombreNegocio) { pintarNombre(o.nombreNegocio); return; }
      } catch (_) {}
      pintarNombre("");
    } catch (_) {}
  }
  function actualizarLapiz() {
    try {
      const rol = (window.OCAuth && window.OCAuth.rolActual) ? window.OCAuth.rolActual() : "";
      const puede = rol === "dueno" || rol === "admin" || !!(window.OCAuth && window.OCAuth.puedeGestionar && window.OCAuth.puedeGestionar());
      const esDemo = window.OCAuth && window.OCAuth.esDemo && window.OCAuth.esDemo();
      btn.style.display = (puede && !esDemo) ? "inline-block" : "none";
    } catch (_) { btn.style.display = "none"; }
  }
  btn.addEventListener("click", async () => {
    try {
      const actual = span.textContent.trim();
      const nuevo = (prompt((window.t && window.t("header.bizNamePrompt")) || "Your business name (the header title):", esPlaceholder(actual) ? "" : actual) || "").trim();
      if (!nuevo) return;
      const res = await fetch(`${API}/instancia/nombre`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nuevo }) });
      const d = await res.json();
      if (d && d.ok) {
        pintarNombre(d.nombreNegocio || nuevo);
        try { const o = JSON.parse(localStorage.getItem("f123_owned") || "null"); if (o) { o.nombreNegocio = d.nombreNegocio || nuevo; localStorage.setItem("f123_owned", JSON.stringify(o)); } } catch (_) {}
        try { window.dispatchEvent(new CustomEvent("oc-negocio-actualizado", { detail: { nombre: d.nombreNegocio || nuevo } })); } catch (_) {}
      }
    } catch (_) {}
  });
  cargarNombre();
  actualizarLapiz();
  window.addEventListener("oc-login", () => { cargarNombre(); actualizarLapiz(); pintarApodoHeader(); });
  window.addEventListener("oc-logout", () => { btn.style.display = "none"; ocultarApodoHeader(); });
  window.addEventListener("oc-negocio-actualizado", function (ev) {
    try { if (ev && ev.detail && ev.detail.nombre) pintarNombre(ev.detail.nombre); } catch (_) {}
  });
  window.addEventListener("oc-lang-change", function () {
    if (esPlaceholder(span.textContent)) pintarNombre("");
  });

  const apodoWrap = document.getElementById("oc-header-apodo");
  const apodoTxt = document.getElementById("oc-header-apodo-txt");
  const apodoBtn = document.getElementById("oc-header-apodo-btn");
  function ocultarApodoHeader() {
    if (apodoWrap) apodoWrap.style.display = "none";
  }
  function pintarApodoHeader() {
    if (!apodoWrap || !apodoTxt) return;
    let apodo = "";
    try { apodo = (window.OCMicelio && window.OCMicelio.miApodo) ? (window.OCMicelio.miApodo() || "") : ""; } catch (_) {}
    apodoTxt.textContent = apodo
      ? ((window.tf && window.tf("header.deviceNamed", { name: apodo })) || ("This device: " + apodo))
      : ((window.t && window.t("header.deviceUnnamed")) || "Name this device");
    apodoWrap.style.display = "block";
  }
  if (apodoBtn) {
    apodoBtn.addEventListener("click", () => {
      let actual = "";
      try { actual = (window.OCMicelio && window.OCMicelio.miApodo) ? (window.OCMicelio.miApodo() || "") : ""; } catch (_) {}
      const v = prompt((window.t && window.t("header.devicePrompt")) || "Name this device (your team will see it):", actual);
      if (v === null) return;
      try { if (window.OCMicelio && window.OCMicelio.ponerApodo) window.OCMicelio.ponerApodo(v); } catch (_) {}
      pintarApodoHeader();
    });
  }
  try { window.addEventListener("oc-micelio-cambio", pintarApodoHeader); } catch (_) {}
  try { window.addEventListener("oc-lang-change", pintarApodoHeader); } catch (_) {}
  try {
    const _ses = JSON.parse(sessionStorage.getItem("f123_sesion") || "null");
    if (_ses && _ses.rol) { pintarApodoHeader(); actualizarLapiz(); }
  } catch (_) {}
})();

// --- Navegación ---
document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");
    document.querySelectorAll(".vista").forEach(v => v.classList.remove("activa"));
    document.getElementById(`vista-${btn.dataset.vista}`).classList.add("activa");
    refrescarVistaActiva();
  });
});

// --- Alto real del header -> --riel-top (JFC 2026-08-05) ---
// BUG "se tapa el HOY": el header es position:sticky y su alto REAL crece al
// envolver en pantallas angostas, pero el riel lateral (position:fixed) se
// desplazaba con --header-h fija (104px), asi que el header tapaba HOY. Se
// mide el header real y se sincroniza --riel-top (variable SEPARADA de
// --header-h, que tambien es el min-height del header — escribir ahi crea un
// bucle de realimentacion). offsetHeight = alto por contenido (estable).
(function sincronizarAltoHeader() {
  var header = document.querySelector("header");
  if (!header) return;
  function ajustar() {
    var real = Math.ceil(header.offsetTop + header.offsetHeight) + 16;
    if (!real) return;
    var actual = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--riel-top"), 10) || 0;
    if (Math.abs(real - actual) > 1) document.documentElement.style.setProperty("--riel-top", real + "px");
  }
  ajustar();
  try { new ResizeObserver(ajustar).observe(header); } catch (_) { window.addEventListener("resize", ajustar); }
  window.addEventListener("orientationchange", function () { setTimeout(ajustar, 120); });
  window.addEventListener("oc-login", function () { setTimeout(ajustar, 60); });
})();

// GUARDIA DE DOBLE PESTAÑA (portado de AMIGABLE, JFC 2026-08-05) — VITAL.
// Dos pestañas de la MISMA app se pisan el estado (last-writer-wins). El
// listener "storage" que debia recargar quedo neutralizado por el prefijo que
// aislamiento.js pone a cada clave, asi que la unica defensa segura es NO
// permitir dos pestañas activas a la vez. Detecta la 2ª por BroadcastChannel y
// la tapa (con escape para la pestaña zombie legitima). NO borrar sin reemplazo.
(function guardiaDoblePestana() {
  var esES = true;
  try { esES = !window.OCI18n || window.OCI18n.getLang() !== "en"; } catch (_) {}

  /* A1 — CANDADO REAL ENTRE PESTANAS (JFC 2026-08-19).
     El guard viejo era un apreton de manos por BroadcastChannel: la 2a pestana
     avisaba "hola", la 1a contestaba "ocupado". Funciona casi siempre, pero es
     una carrera: si las dos arrancan en el mismo instante, las dos pueden
     creerse principales, que es exactamente el caso que hay que evitar porque
     aqui las dos pestanas se pisan los datos (el listener "storage" quedo
     neutralizado por el prefijo de aislamiento.js).

     navigator.locks da un mutex de verdad, resuelto por el navegador via IPC,
     sin carrera posible. La 1a pestana toma el candado y lo retiene mientras
     viva; cualquier otra pide el mismo nombre con ifAvailable y recibe null al
     instante, y ahi sabe que es secundaria.

     El BroadcastChannel se queda de RESPALDO para navegadores sin Web Locks
     (Safari < 15.4). No se borra: degradar al comportamiento anterior es mejor
     que quedarse sin guardia. */
  function taparPestana() {
    if (document.getElementById("oc-doble-tab")) return;
    _pintarAvisoDoble();
  }
  var _hayLocks = false;
  try { _hayLocks = !!(navigator.locks && navigator.locks.request); } catch (_) {}
  if (_hayLocks) {
    navigator.locks.request("f123-sesion-unica", { ifAvailable: true }, function (lock) {
      if (!lock) { taparPestana(); return Promise.resolve(); }
      /* Se retiene mientras la pestana viva: la promesa no se resuelve nunca.
         Al cerrarla, el navegador suelta el candado solo y la siguiente
         pestana pasa a ser la principal sin que nadie tenga que limpiar nada. */
      return new Promise(function () {});
    }).catch(function () { /* si Web Locks falla, manda el respaldo de abajo */ });
  }

  if (typeof BroadcastChannel === "undefined") return;
  var canal = new BroadcastChannel("friendly-123-sesion-unica");
  var soyPrincipal = true;
  canal.onmessage = function (e) {
    if (e.data === "hola" && soyPrincipal) canal.postMessage("ocupado");
    /* Con Web Locks disponible, el candado ya decidio: este respaldo no vuelve
       a opinar y se evita que dos mecanismos peleen por la misma pantalla. */
    if (_hayLocks) return;
    if (e.data === "ocupado" && !document.getElementById("oc-doble-tab")) {
      soyPrincipal = false;
      _pintarAvisoDoble(function () { soyPrincipal = true; });
    }
  };
  canal.postMessage("hola");

  /* Una sola definicion del aviso, para las dos vias. Antes cada guardia tenia
     su copia y las dos usaban el id #oc-doble-tab. */
  function _pintarAvisoDoble(alUsarIgual) {
    if (document.getElementById("oc-doble-tab")) return;
    var d = document.createElement("div");
    d.id = "oc-doble-tab";
    d.style.cssText = "position:fixed;inset:0;z-index:10003;background:#0F1923;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;";
    d.innerHTML = '<p style="color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:18px;font-weight:700;max-width:440px;">'
      + (esES ? 'Ya hay una sesión de friendly-123 abierta en otra pestaña. Para no pisar los datos, usa una sola a la vez.' : 'friendly-123 is already open in another tab. To avoid overwriting your data, use just one at a time.')
      + '</p><button id="oc-doble-usar" style="min-height:48px;padding:12px 22px;border-radius:8px;border:2px solid #5294AC;background:transparent;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:16px;font-weight:700;cursor:pointer;">'
      + (esES ? 'Usar aquí de todos modos' : 'Use here anyway') + '</button>';
    document.body.appendChild(d);
    document.getElementById("oc-doble-usar").addEventListener("click", function () {
      if (typeof alUsarIgual === "function") { try { alUsarIgual(); } catch (_) {} }
      d.remove();
    });
  }
})();

// Mood/flavor del día para el dueño (12, voz JFC). Estable por día.
const MOODS = [
  "What you already have counts double: protect your inventory before chasing the next sale.",
  "Fine-pricing day. Look at what moves slowly and give it a reason to leave.",
  "Start with the red. Restock the urgent and the rest falls into place.",
  "Balance the till early. A clear number in the morning is worth ten at night.",
  "Your shelves are talking. See which ones perform and which ones are sleeping.",
  "Today's star is your call. Pick one product, focus on it, and push it.",
  "Less discount, more story. Sell the why, not just the price.",
  "Every sale logged right is a better decision tomorrow. Record everything.",
  "What doesn't move, weighs you down. Spot the slow items and move them before they go cold.",
  "Your margin takes care of itself only if you take care of it. Review costs today.",
  "A tidy space sells more. Ten minutes of order, a full day of clarity.",
  "Trust your colors. The signal already told you where to start.",
];

// Reloj del hero (sin clima). Se actualiza al cargar y cada 20s.
function actualizarReloj(){
  const el = document.getElementById("heroReloj");
  if (!el) return;
  el.textContent = new Date().toLocaleString(OCI18n.getLang() === "en" ? "en-US" : "es", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
}

// --- VISTA HOY ---
async function cargarHoy(){
  // Microcirugia 3 (2026-07-08): guard contra respuesta 5xx o red cortada.
  // Sin esto, data.semaforoGeneral seria undefined => hero.className = '...undefined'.
  let res, data;
  try {
    res = await fetch(`${API}/dashboard?ubicacionId=${ubicacionActual}`);
    if (!res.ok) throw new Error('Dashboard: ' + res.status);
    data = await res.json();
  } catch (err) {
    const hero = document.getElementById('heroSemaforo');
    if (hero) hero.innerHTML = `<p style="font-size:15px;color:var(--rojo,#a3392a);margin:0;">${t("hoy.err")}</p>`;
    return;
  }

  const hero = document.getElementById("heroSemaforo");
  hero.className = "hero-semaforo tag-card " + data.semaforoGeneral;
  const tKey = { verde: "hoy.titulo.verde", amarillo: "hoy.titulo.amarillo", rojo: "hoy.titulo.rojo" }[data.semaforoGeneral];
  document.getElementById("heroTitulo").textContent = tKey ? t(tKey) : t("hoy.titulo.default");
  // Plata del negocio (ganancia/entra/sale/inventario): SOLO dueño. El titular
  // tampoco le revela la ganancia al encargado — solo el conteo de ventas.
  const esDuenoHoy = (window.OCAuth && window.OCAuth.puedeGestionar && window.OCAuth.puedeGestionar());
  document.getElementById("heroSubtitulo").textContent = esDuenoHoy
    ? tf("hoy.subOwner", { monto: fmtMoney(data.resumenDia.gananciaHoy), n: data.resumenDia.ventasCount })
    : tf("hoy.subStaff", { n: data.resumenDia.ventasCount });
  document.querySelectorAll(".fin-dueno").forEach(el => el.style.display = esDuenoHoy ? "" : "none");

  document.getElementById("resEntra").textContent = fmtMoney(data.resumenDia.entra);
  document.getElementById("resSale").textContent = fmtMoney(data.resumenDia.sale);
  document.getElementById("resGanancia").textContent = fmtMoney(data.resumenDia.gananciaHoy);
  document.getElementById("resInventario").textContent = fmtMoney(data.resumenDia.inventarioValorizado);
  document.getElementById("resVentasCount").textContent = data.resumenDia.ventasCount;
  const ticketProm = data.resumenDia.ventasCount > 0 ? data.resumenDia.entra / data.resumenDia.ventasCount : 0;
  document.getElementById("resTicketProm").textContent = fmtMoney(ticketProm);

  const puntito = (color) => `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:currentColor;margin-right:9px;flex-shrink:0;"></span>`;
  const lista = document.getElementById("listaAlertas");
  if (data.alertas.length === 0){
    lista.innerHTML = `<li class="verde" style="background:var(--sim-verde); color:#FFFFFF; -webkit-text-fill-color:#FFFFFF; border:2px solid var(--sim-verde-dk);">${puntito()}${t("hoy.noAlerts")}</li>`;
  } else {
    lista.innerHTML = data.alertas.map(a =>
      `<li class="${a.estado}">${puntito()}${a.mensaje}</li>`
    ).join("");
  }

  // Para impulsar hoy: productos estrella de la percha actual (encargado los ve).
  try {
    const prods = await fetch(`${API}/productos?ubicacionId=${ubicacionActual}`).then(r => r.json());
    const estrellas = (Array.isArray(prods) ? prods : []).filter(p => p.estrella);
    const cont = document.getElementById("estrellaHoy");
    if (cont) {
      cont.innerHTML = estrellas.length ? `
        <h3 class="seccion">${t("hoy.boostHeading")}</h3>
        <ul class="lista-alertas">${estrellas.map(p =>
          `<li class="amarillo" style="background:#FFFFFF;color:#0F1923;border:2px solid var(--sim-amarillo);"><span style="margin-right:8px;">⭐</span>${escHtml(p.nombre)} · ${p.stockActual} ${t("hoy.inStock")} · ${fmtMoney(p.precio)}</li>`
        ).join("")}</ul>` : "";
    }
  } catch (_) { /* sin estrellas: el bloque queda vacío */ }

  // Mood/flavor del día, SOLO dueño (moodHoy tiene clase fin-dueno, ya oculta al
  // encargado arriba). Estable por día del año.
  const mood = document.getElementById("moodHoy");
  if (mood && esDuenoHoy) {
    const ahora = new Date();
    const dia = Math.floor((ahora - new Date(ahora.getFullYear(), 0, 0)) / 86400000);
    mood.innerHTML = `<div class="tag-card" style="margin-top:16px;padding:16px;border-left:5px solid var(--sim-azul);">
      <div style="font-family:var(--font-mono);font-size:13px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${t("hoy.moodLabel")}</div>
      <div style="font-family:var(--font-display);font-size:17px;color:var(--ink);line-height:1.35;">${MOODS[dia % MOODS.length]}</div>
    </div>`;
  }

  actualizarReloj();
}
if (!window.__relojInterval) window.__relojInterval = setInterval(actualizarReloj, 20000);

// --- VISTA INVENTARIO ---
document.getElementById("filtrosEstado")?.addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  document.querySelectorAll("#filtrosEstado button").forEach(b => b.classList.remove("activo"));
  e.target.classList.add("activo");
  filtroEstadoActual = e.target.dataset.estado;
  cargarInventario();
});

// semaforo de colores: 3 grados DENTRO de cada color (nunca un color nuevo).
// Ojo dueno: esto es una heuristica con lo unico que el cliente ya recibe
// (stockActual, perecible, fechaCaducidad). Si el backend algun dia expone
// un campo real (p.ej. p.nivelBloom, o dias sin venta en el producto), esta
// funcion lo debe preferir sobre el estimado — dejo el gancho listo abajo.
function calcularNivelBloom(p){
  if (typeof p.nivelBloom === "number") return Math.min(3, Math.max(1, p.nivelBloom));
  const stock = Number(p.stockActual) || 0;
  let diasParaVencer = null;
  if (p.perecible && p.fechaCaducidad) {
    const dias = (new Date(p.fechaCaducidad) - new Date()) / 86400000;
    if (!isNaN(dias)) diasParaVencer = dias;
  }
  switch (p.estado) {
    case "verde":
      return stock >= 15 ? 3 : stock >= 7 ? 2 : 1;
    case "amarillo":
      return stock <= 2 ? 3 : stock <= 5 ? 2 : 1;
    case "naranja":
      if (diasParaVencer !== null) return diasParaVencer <= 2 ? 3 : diasParaVencer <= 5 ? 2 : 1;
      return stock <= 1 ? 3 : stock <= 3 ? 2 : 1;
    case "rojo":
      if (stock === 0) return 3;
      if (diasParaVencer !== null && diasParaVencer <= 0) return 3;
      return 2;
    // Azul = oportunidad: mide MARGEN (precio - costo), no stock. Confirmado
    // JFC 2026-07-04. El backend ya usa 0.5 de margen como umbral para
    // marcar "azul" — aquí solo graduamos QUÉ TAN bueno es ese margen.
    // Si p.costo aún no llega del backend, cae al nivel 2 fijo de antes
    // (no rompe nada mientras se completa esa parte en mock-backend.js).
    // Negro = producto dormido: mide DÍAS SIN VENTA de verdad, ya no un
    // gris fijo. Confirmado JFC 2026-07-04. p.diasSinVenta === null quiere
    // decir "nunca se ha vendido" — el estado más muerto que existe, más
    // que cualquier número de días, así que va directo a nivel 3.
    // Si el campo aún no llega del backend (undefined), cae a nivel 2.
    case "negro": {
      if (p.diasSinVenta === null) return 3;
      if (typeof p.diasSinVenta === "number") {
        return p.diasSinVenta >= 120 ? 3 : p.diasSinVenta >= 60 ? 2 : 1;
      }
      return 2;
    }
    default:
      return 2;
  }
}

// Frase corta y humana por nivel — la voz "Amigable" metida en el propio
// indicador. Por debajo cada color sigue midiendo algo distinto y honesto
// (Alternativa B: salud de stock, urgencia, margen, abandono...), pero
// nadie tiene que aprenderse 6 métricas — la frase ya dice qué pasa, con
// un vistazo (espíritu de la Alternativa C, sin sacrificar el rigor de B).
function captionBloom(estado, nivel){
  const FRASES = {
    verde:    ["Right on time, don't let up", "Healthy stock cushion", "Plenty to last a while"],
    amarillo: ["Start thinking about restocking", "Getting close to restock time", "Last unit — don't wait any longer"],
    naranja:  ["Keep an eye on it, still time", "Don't let it slip by", "Expiring soon — move it"],
    rojo:     ["Act today", "Act today", "Emergency: out of stock"],
    negro:    ["Cooling down", "Has been dormant for a while", "Nobody has touched it in months"],
  };
  const arr = FRASES[estado];
  if (!arr) return "";
  return arr[Math.min(3, Math.max(1, nivel)) - 1] || "";
}

// FEATURE — DORMANT (retirada por JFC 2026-07-07: "la escala es INTERNA, el
// encendido va EN la tarjeta"). NO BORRAR. Dibujaba 3 segmentos del mismo
// color como indicador visible dentro de cada tarjeta; hoy el nivel se
// aplica como clase n1/n2/n3 de .caja (ver CSS de encendidos). Para
// re-habilitar: volver a llamar renderBloom() en el template de tarjeta.
function renderBloom(estado, nivel){
  const estadosValidos = ["verde","amarillo","naranja","rojo","negro"];
  if (!estadosValidos.includes(estado)) return "";
  const stops = ["bg", "", "dk"];
  const caption = captionBloom(estado, nivel);
  const barras = stops.map((stop, i) => {
      const varName = stop ? `--sim-${estado}-${stop}` : `--sim-${estado}`;
      const lit = i < nivel;
      const h = 6 + i * 4;
      return `<span style="width:16px;height:${h}px;border-radius:2px;background:var(${varName});opacity:${lit ? 1 : 0.25};border:1px solid rgba(0,0,0,0.18);display:block;"></span>`;
    }).join("");
  return `<div class="bloom-sinclair" title="Intensidad ${nivel}/3" style="display:flex;flex-direction:column;gap:3px;margin:6px 0 2px;">
    <div style="display:flex;gap:3px;align-items:flex-end;">${barras}</div>
    ${caption ? `<span style="font-size:13px;color:#3A4048;line-height:1.25;">${escHtml(caption)}</span>` : ""}
  </div>`;
}

// Filtro por nombre/SKU/categoria (Microcirugia #11, alto ROI): reduce el
// scroll en tiendas con decenas/cientos de productos. Filtra en el DOM
// (data-buscar ya trae el texto normalizado), sin fetch adicional.
function filtrarBusquedaInventario(){
  const input = document.getElementById("inputBuscarInventario");
  if (!input) return;
  const q = input.value.trim().toLowerCase();
  document.querySelectorAll("#gridInventario [data-buscar]").forEach(card => {
    card.style.display = (!q || card.dataset.buscar.includes(q)) ? "" : "none";
  });
}
(function () {
  const input = document.getElementById("inputBuscarInventario");
  if (input && !input.dataset.ocListo) {
    input.dataset.ocListo = "1";
    input.addEventListener("input", filtrarBusquedaInventario);
  }
})();

// Ordenar por columna (2026-07-29) — complementa la busqueda que ya existia.
// Estado en memoria, se pierde al recargar (es una preferencia de sesion,
// no un dato que deba sincronizarse).
const COLUMNAS_INVENTARIO = [
  { key: "nombre", label: "Name" },
  { key: "stockActual", label: "Stock" },
  { key: "precio", label: "Price" },
  { key: "categoria", label: "Category" },
];
let _ordenInv = { col: null, asc: true };
function ordenarInventario(lista) {
  if (!_ordenInv.col) return lista;
  const col = _ordenInv.col;
  return lista.slice().sort((a, b) => {
    const va = a[col], vb = b[col];
    let r;
    if (typeof va === "number" && typeof vb === "number") r = va - vb;
    else r = String(va == null ? "" : va).localeCompare(String(vb == null ? "" : vb), "en", { sensitivity: "base", numeric: true });
    return _ordenInv.asc ? r : -r;
  });
}
function pintarBotonesOrdenInventario() {
  const cont = document.getElementById("ordenInventario");
  if (!cont || cont.dataset.listo) { if (cont) actualizarBotonesOrdenInventario(cont); return; }
  cont.dataset.listo = "1";
  COLUMNAS_INVENTARIO.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.ordInvCol = c.key;
    b.textContent = c.label;
    b.style.cssText = "font-size:13px;padding:4px 10px;border-radius:6px;border:1.5px solid var(--azul-medio,#2c4a68);background:transparent;color:var(--azul-medio,#2c4a68) !important;-webkit-text-fill-color:var(--azul-medio,#2c4a68) !important;cursor:pointer;";
    cont.appendChild(b);
  });
  cont.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ord-inv-col]");
    if (!b) return;
    const key = b.dataset.ordInvCol;
    if (_ordenInv.col === key) _ordenInv.asc = !_ordenInv.asc;
    else { _ordenInv.col = key; _ordenInv.asc = true; }
    cargarInventario();
  });
  actualizarBotonesOrdenInventario(cont);
}
function actualizarBotonesOrdenInventario(cont) {
  cont.querySelectorAll("[data-ord-inv-col]").forEach((b) => {
    const c = COLUMNAS_INVENTARIO.find((x) => x.key === b.dataset.ordInvCol);
    const activo = _ordenInv.col === b.dataset.ordInvCol;
    b.style.background = activo ? "var(--azul-medio,#2c4a68)" : "transparent";
    b.style.color = activo ? "#fbf5e8" : "var(--azul-medio,#2c4a68)";
    b.style.setProperty("-webkit-text-fill-color", activo ? "#fbf5e8" : "var(--azul-medio,#2c4a68)");
    b.textContent = c.label + (activo ? (_ordenInv.asc ? " ↑" : " ↓") : "");
  });
}



/* ============================================================================
   M1 y M4 del plan de variantes (2026-08-14).
   familiaDe() es una FUNCION PURA sobre el SKU: no lee ni escribe nada. La
   familia de ALM5-V2 es ALM5. No hay tabla de familias que pueda quedar
   huerfana, desincronizarse entre dispositivos o apuntar a productos borrados:
   el prefijo vive DENTRO del producto que describe.
   Un SKU sin guion simplemente no tiene familia, y su producto funciona igual.
   ============================================================================ */
function familiaDe(sku) {
  var s = String(sku || "").trim();
  var i = s.indexOf("-");
  return i > 0 ? s.slice(0, i).toUpperCase() : "";
}

/* Eslabon 2 de la cadena de respaldo: la foto de otra variante de la misma
   familia. Solo mira el array que la cuadricula YA tiene cargado, no pide nada
   a la red ni a IndexedDB. Devuelve null si no hay, y ahi entra el eslabon 3. */
function fotoDeLaFamilia(p, todos) {
  var fam = familiaDe(p && p.sku);
  if (!fam || !Array.isArray(todos)) return null;
  for (var i = 0; i < todos.length; i++) {
    var o = todos[i];
    if (o && o.foto && o.id !== p.id && familiaDe(o.sku) === fam) return o.foto;
  }
  return null;
}

/* Iniciales para el eslabon 3. Dos letras cuando el nombre tiene dos palabras
   utiles, para que dos variantes no queden con la misma letra sola. */
function inicialesDe(nombre) {
  var partes = String(nombre || "?").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

/* Arma el bloque visual completo. Las iniciales van SIEMPRE debajo; la imagen
   encima, y si falla se borra a si misma con onerror. Sin estado, sin timers y
   sin ninguna rama que pueda dejar la tarjeta en blanco. */
function bloqueFoto(p, todos) {
  var propia = p && p.foto ? p.foto : null;
  var heredada = propia ? null : fotoDeLaFamilia(p, todos);
  var src = propia || heredada;
  var html = '<div class="fotowrap"><span class="iniciales">' + escHtml(inicialesDe(p && p.nombre)) + "</span>";
  if (src) {
    html += '<img src="' + src + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">';
    if (heredada) html += '<span class="heredada">foto de la familia</span>';
  }
  return html + "</div>";
}

/* ============================================================================
   M6 y M7 del plan de variantes (2026-08-14).

   M6, AGRUPAR SIN FUSIONAR. El total por familia es SIEMPRE derivado: se suma
   al pintar y no se guarda en ningun lado. Misma regla que rige saldos y planes
   de pago en esta app: un total guardado es un total que puede mentir.
   El agrupamiento es una PREFERENCIA DE VISTA y vive en localStorage, aparte
   del inventario. Si se corrompe, la lista vuelve a plana y no se pierde un
   solo dato de negocio.

   M7, ALTA DE VARIANTE. Duplica lo que se repite y deja en cero lo que no.
   Stock en cero es el valor seguro: si el duplicado sale mal, lo peor que pasa
   es que aparece un producto vacio que se borra. Nunca aparece stock que nadie
   compro.
   ============================================================================ */
var PP_AGRUPAR_KEY = "amg_inv_agrupar_familias";

function agruparFamiliasActivo() {
  try { return localStorage.getItem(PP_AGRUPAR_KEY) === "1"; } catch (_) { return false; }
}
function fijarAgruparFamilias(v) {
  try { localStorage.setItem(PP_AGRUPAR_KEY, v ? "1" : "0"); } catch (_) {}
}

/* Devuelve las familias con mas de un miembro y su total DERIVADO. Los
   productos sueltos no forman familia: agrupar de a uno solo agrega ruido. */
function resumenFamilias(productos) {
  var mapa = {};
  (productos || []).forEach(function (p) {
    var f = familiaDe(p.sku);
    if (!f) return;
    (mapa[f] = mapa[f] || []).push(p);
  });
  var out = [];
  Object.keys(mapa).sort().forEach(function (f) {
    if (mapa[f].length < 2) return;
    out.push({
      familia: f,
      variantes: mapa[f].length,
      unidades: mapa[f].reduce(function (a, p) { return a + (Number(p.stockActual) || 0); }, 0)
    });
  });
  return out;
}

/* Encabezado con el resumen. Se pinta ARRIBA del grid y no lo altera: si esta
   funcion fallara, la cuadricula sigue exactamente igual. */
function pintarResumenFamilias(productos) {
  var cont = document.getElementById("invFamilias");
  if (!cont) return;
  if (!agruparFamiliasActivo()) { cont.innerHTML = ""; return; }
  var fams = resumenFamilias(productos);
  if (!fams.length) { cont.innerHTML = ""; return; }
  cont.innerHTML = fams.map(function (f) {
    return '<button type="button" class="fam-chip" data-fam="' + escHtml(f.familia) + '">' +
      escHtml(f.familia) + " · " + f.variantes + " variantes · " + f.unidades + " u.</button>";
  }).join("");
}

/* M7: abre el alta con los campos ya copiados del producto de origen. */
async function duplicarComoVariante(id) {
  try {
    var p = await (await fetch(API + "/productos/" + id)).json();
    if (!p || p.error) throw new Error((p && p.error) || "no se pudo leer el producto");
    await abrirAltaProducto();
    var scope = document.getElementById(fichaTargetActual) || document;
    var set = function (sel, v) { var e = scope.querySelector(sel); if (e) e.value = v; };
    set("#np-nombre", p.nombre || "");
    set("#np-categoria", p.categoria || "");
    set("#np-precio", p.precio != null ? p.precio : "");
    set("#np-costo", p.costo != null ? p.costo : "");
    set("#np-proveedor", p.proveedor || "");
    set("#np-stock", 0);              // el valor seguro, siempre
    set("#np-barcode", "");           // el codigo NO se duplica: es unico
    set("#np-chip", "");
    var chip = scope.querySelector("#np-chip");
    if (chip) { chip.focus(); }
  } catch (e) {
    try { console.error("duplicar variante:", e); } catch (_) {}
    const _msgVarFail = (typeof window.t === "function") ? window.t("inv.variantPrepFailed") : "Could not prepare the variant.";
    if (typeof ocAlert === "function") ocAlert(_msgVarFail);
    else alert(_msgVarFail);
  }
}

async function cargarInventario(){
  // El "+" de alta libre es del dueno; el encargado ni lo ve (dos capas).
  const btnAlta = document.getElementById("btnAltaProducto");
  if (btnAlta) btnAlta.style.display = (window.OCAuth && window.OCAuth.puedeGestionar && window.OCAuth.puedeGestionar()) ? "" : "none";
  let url = `${API}/productos?ubicacionId=${ubicacionActual}`;
  if (filtroEstadoActual) url += `&estado=${filtroEstadoActual}`;
  const grid = document.getElementById("gridInventario");
  let productos;
  try {
    const res = await fetch(url);
    productos = await res.json();
  } catch (_) {
    grid.innerHTML = `<p>${t("inv.loadError")}</p>`;
    return;
  }
  if (!Array.isArray(productos)){
    grid.innerHTML = `<p>${t("inv.readError")}</p>`;
    return;
  }
  if (productos.length === 0){
    grid.innerHTML = `<p>${t("inv.emptyFilter")}</p>`;
    return;
  }
  const esDuenoInv = (window.OCAuth && window.OCAuth.puedeGestionar && window.OCAuth.puedeGestionar());
  productos = ordenarInventario(productos);
  pintarBotonesOrdenInventario();
  grid.innerHTML = productos.map(p => `
    <div class="caja tag-card ${p.estado} n${calcularNivelBloom(p)}" data-buscar="${escHtml(`${p.nombre} ${p.sku} ${p.categoria}`.toLowerCase())}">
      ${p.estrella ? '<span class="estrella-badge">⭐</span>' : ''}
      <div onclick="abrirFichaDesdeInventario('${p.id}')" style="cursor:pointer;">
        ${bloqueFoto(p, productos)}
        <div class="nombre">${escHtml(p.nombre)}${p.perecible ? ' 🕓' : ''}</div>
        <div class="detalle">${escHtml(p.categoria)} · ${escHtml(p.sku)}</div>
        ${p.chip ? `<span class="chip-var">${escHtml(p.chip)}</span>` : ""}
        <div class="stock">${p.stockActual}</div>
        <div class="detalle">${escHtml(p.mensaje)}</div>
      </div>
      <!-- Ajuste rápido de stock sin escanear -->
      <div class="ajuste-rapido" onclick="event.stopPropagation()" style="margin-top:8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <button data-ajuste-menos="${p.id}" title="${t('inv.removeOne')}" style="width:36px;height:36px;border-radius:50%;border:2px solid currentColor;background:transparent;color:inherit;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
        <button data-ajuste-mas="${p.id}" title="${t('inv.addOne')}" style="width:36px;height:36px;border-radius:50%;border:2px solid currentColor;background:transparent;color:inherit;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
        ${esDuenoInv ? `<button data-estrella-toggle="${p.id}" title="${p.estrella ? t('inv.starRemove') : t('inv.starAdd')}" style="width:36px;height:36px;border-radius:50%;border:2px solid currentColor;background:transparent;color:inherit;font-size:16px;cursor:pointer;">${p.estrella ? '★' : '☆'}</button>` : ''}
        ${esDuenoInv ? `<button data-variante="${p.id}" title="Agregar variante de este producto" style="width:36px;height:36px;border-radius:50%;border:2px solid currentColor;background:transparent;color:inherit;font-size:17px;font-weight:700;cursor:pointer;">&#43;&#43;</button>` : ''}
        ${esDuenoInv ? `<button data-editar-directo="${p.id}" title="${t('inv.editTooltip')}" style="width:36px;height:36px;border-radius:50%;border:2px solid currentColor;background:transparent;color:inherit;font-size:15px;cursor:pointer;">✏️</button>` : ''}
      </div>
    </div>
  `).join("");
  /* M6: el interruptor solo aparece si de verdad HAY familias que agrupar.
     Un negocio sin variantes no ve nada nuevo, que es la prueba M9. */
  try {
    var _wrap = document.getElementById("invAgruparWrap");
    var _chk = document.getElementById("invAgrupar");
    var _hayFam = resumenFamilias(productos).length > 0;
    if (_wrap) _wrap.style.display = _hayFam ? "flex" : "none";
    if (_chk && !_chk.dataset.listo) {
      _chk.dataset.listo = "1";
      _chk.checked = agruparFamiliasActivo();
      _chk.addEventListener("change", function () { fijarAgruparFamilias(_chk.checked); cargarInventario(); });
    }
    pintarResumenFamilias(productos);
  } catch (_) { /* el resumen es decoracion: nunca puede tumbar el grid */ }
  filtrarBusquedaInventario();
  grid.querySelectorAll("[data-editar-directo]").forEach(btn => {
    btn.addEventListener("click", (ev) => { ev.stopPropagation(); abrirEdicionDesdeInventario(btn.dataset.editarDirecto); });
  });

  /* M7: un solo listener delegado, marcado con dataset para no re-atarlo. */
  if (!grid.dataset.varianteListo) {
    grid.dataset.varianteListo = "1";
    grid.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-variante]");
      if (!b) return;
      ev.stopPropagation();
      duplicarComoVariante(b.dataset.variante);
    });
  }
  // Ajuste rápido +/- stock sin escanear. Pide motivo, deja log para el dueño.
  grid.querySelectorAll("[data-ajuste-menos],[data-ajuste-mas]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const esMenos = btn.hasAttribute("data-ajuste-menos");
      const id = esMenos ? btn.dataset.ajusteMenos : btn.dataset.ajusteMas;
      const delta = esMenos ? -1 : 1;
      // Dropdown de motivos estandarizados (idea Omar 2026-07-12) en vez de prompt() libre.
      const motivo = await pedirMotivoAjuste(delta);
      if (!motivo) return;
      // Microcirugia 8 (2026-07-08): red cortada dejaba el boton como si nada.
      let res8, r8;
      try {
        res8 = await fetch(`${API}/productos/${id}/ajustar`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ delta, motivo })
        });
        r8 = await res8.json();
      } catch (_) { await ocAlert('Could not adjust stock. Try again.'); return; }
      if (!res8.ok){ await ocAlert(r8.error); return; }
      cargarInventario();
    });
  });

  // Estrella: dueño marca/desmarca productos para que el encargado los promueva
  grid.querySelectorAll("[data-estrella-toggle]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.estrellaToggle;
      const res = await fetch(`${API}/productos/${id}/estrella`, {
        method:"POST", headers:{"Content-Type":"application/json"}, body:"{}"
      });
      const r = await res.json();
      if (!res.ok){ await ocAlert(r.error); return; }
      cargarInventario();
    });
  });

  // Log de movimientos recientes: SOLO dueño — anti-descuadre de stock
  const secLog = document.getElementById("seccionLogAjustes");
  if (secLog) {
    secLog.style.display = esDuenoInv ? "" : "none";
    if (esDuenoInv) cargarLogAjustes();
  }
  // Perchas: 2da parte de Inventario, SOLO dueño
  const secPerchas = document.getElementById("seccionPerchas");
  if (secPerchas) {
    secPerchas.style.display = esDuenoInv ? "" : "none";
    if (esDuenoInv) cargarPerchas();
  }
}

// Escapa HTML — el log muestra "motivo" tecleado por el encargado (via prompt),
// nunca debe insertarse crudo en innerHTML (riesgo de XSS almacenado).
function escHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============================================================================
// MOTIVOS ESTANDARIZADOS DEL AJUSTE +/- (idea Omar 2026-07-12)
// Reemplaza el prompt() de open-text por un dropdown de opciones fijas: labels
// consistentes en el log del dueño en vez de texto libre que cada encargado
// teclea distinto. "Otro…" revela un campo de texto para el caso no previsto.
// Para cambiar/agregar opciones: editar MOTIVOS_AJUSTE. No borrar "Otro".
// ============================================================================
const MOTIVOS_AJUSTE = {
  get mas()   { return [t("motivo.newInv"), t("motivo.custReturn"), t("motivo.correction")]; },
  get menos() { return [t("motivo.damage"), t("motivo.consumed"), t("motivo.correction")]; },
};
// Devuelve Promise<string|null> con el motivo elegido (o null si se cancela).
function pedirMotivoAjuste(delta){
  return new Promise((resolve) => {
    const esMas = delta > 0;
    const opciones = esMas ? MOTIVOS_AJUSTE.mas : MOTIVOS_AJUSTE.menos;
    let modal = document.getElementById("oc-motivo-modal");
    if (!modal){
      modal = document.createElement("div");
      modal.id = "oc-motivo-modal";
      modal.style.cssText = "position:fixed;inset:0;z-index:9998;background:rgba(21,40,64,.85);display:none;align-items:flex-end;justify-content:center;";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div style="background:var(--blanco-calido,#fbf5e8);width:100%;max-width:560px;border-radius:16px 16px 0 0;padding:20px 18px 28px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <strong style="font-family:var(--font-display);font-size:18px;color:var(--ink);flex:1;">${esMas ? t("motivo.addTitle") : t("motivo.removeTitle")}</strong>
          <button data-mot-cancel style="font-size:14px;padding:6px 12px;border-radius:8px;border:2px solid var(--azul-medio,#2c4a68);background:var(--azul-medio,#2c4a68);color:#fbf5e8;cursor:pointer;">${t("motivo.cancel")}</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${opciones.map(o => `<button data-mot="${escHtml(o)}" style="padding:12px 14px;border:2px solid var(--azul-medio,#2c4a68);border-radius:8px;background:#fff;color:var(--ink);font-size:15px;font-weight:700;cursor:pointer;text-align:left;">${escHtml(o)}</button>`).join("")}
          <button data-mot-otro style="padding:12px 14px;border:2px dashed var(--azul-medio,#2c4a68);border-radius:8px;background:transparent;color:var(--ink);font-size:15px;font-weight:700;cursor:pointer;text-align:left;">${t("motivo.other")}</button>
        </div>
        <div data-mot-otrowrap style="display:none;margin-top:10px;">
          <input data-mot-otrotxt type="text" maxlength="60" placeholder="${t('motivo.otherPlaceholder')}"
            style="display:block;width:100%;padding:10px;border:2px solid var(--azul-medio,#2c4a68);border-radius:7px;font-size:15px;box-sizing:border-box;background:#fff;color:var(--ink);">
          <button data-mot-otrook style="margin-top:8px;padding:10px 16px;border:2px solid var(--azul-medio,#2c4a68);border-radius:8px;background:var(--azul-medio,#2c4a68);color:#fbf5e8;font-size:14px;font-weight:700;cursor:pointer;width:100%;">${t("motivo.save")}</button>
        </div>
      </div>`;
    modal.style.display = "flex";
    const cerrar = (val) => { modal.style.display = "none"; resolve(val); };
    modal.querySelectorAll("[data-mot]").forEach(b => b.addEventListener("click", () => cerrar(b.dataset.mot)));
    modal.querySelector("[data-mot-cancel]").addEventListener("click", () => cerrar(null));
    modal.addEventListener("click", (e) => { if (e.target === modal) cerrar(null); });
    const otroWrap = modal.querySelector("[data-mot-otrowrap]");
    modal.querySelector("[data-mot-otro]").addEventListener("click", () => {
      otroWrap.style.display = "block";
      const t = modal.querySelector("[data-mot-otrotxt]"); if (t) setTimeout(() => t.focus(), 60);
    });
    modal.querySelector("[data-mot-otrook]").addEventListener("click", () => {
      const t = modal.querySelector("[data-mot-otrotxt]");
      const v = ((t && t.value) || "").trim();
      if (!v){ if (t) t.focus(); return; }
      cerrar(v);
    });
  });
}

// Log de movimientos recientes — el dueño vigila ajustes del encargado
async function cargarLogAjustes(){
  // Microcirugia 5 (2026-07-08): fetch sin guard dejaba el log de ajustes en
  // blanco sin ningun aviso si /actividad fallaba.
  const cont = document.getElementById('logAjustes');
  let movs;
  try {
    const res = await fetch(API + '/actividad');
    if (!res.ok) throw new Error(res.status);
    movs = await res.json();
  } catch (_) {
    if (cont) cont.innerHTML = `<p style="color:var(--ink-soft);font-size:13px;">${t("log.loadError")}</p>`;
    return;
  }
  if (!movs.length){ cont.innerHTML = `<p style="color:var(--ink-soft);">${t("log.empty")}</p>`; return; }
  cont.innerHTML = movs.slice(0, 20).map(m => {
    const fecha = new Date(m.fecha).toLocaleString(OCI18n.getLang() === "en" ? "en-US" : "es", { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
    const icono = m.tipo === 'ajuste' ? '📦' : m.tipo === 'venta' ? '💰' : m.tipo === 'estrella' ? '⭐' : m.tipo === 'anulacion' ? '🔄' : m.tipo === 'alta' ? '🆕' : m.tipo === 'cliente-borrado' ? '🗑' : '📋';
    const detalle = escHtml((m.detalle && m.detalle.producto) || (m.tipo === 'cliente-borrado' ? (m.detalle && m.detalle.cliente) || '' : ''));
    const extra = m.tipo === 'ajuste' ? ` (${m.detalle.delta > 0 ? '+' : ''}${m.detalle.delta}) — ${escHtml(m.detalle.motivo)}` : m.tipo === 'venta' ? ` × ${m.detalle.cantidad} = $${m.detalle.total}` : m.tipo === 'estrella' ? ` ${escHtml(m.detalle.accion)}` : m.tipo === 'cliente-borrado' ? ` — deleted` : '';
    // Atribución multi-usuario (2026-07-08): mostrar QUIÉN hizo el movimiento.
    // El dato ya viajaba en cada movimiento (mov() lo guarda); antes no se pintaba.
    // "Sistema" (dueño por PIN clásico, sin encargado nombrado) no se muestra.
    const quien = (m.usuarioNombre && m.usuarioNombre !== 'Sistema')
      ? ` <span style="font-size:13px;font-weight:700;color:var(--azul-medio,#2c4a68);">· ${escHtml(m.usuarioNombre)}</span>` : '';
    return `<div style="padding:6px 0;border-bottom:1px solid var(--linea,#e0d6c0);font-size:13px;color:var(--ink);"><span>${icono}</span> <strong>${detalle}</strong>${extra}${quien} <span style="color:var(--ink-soft);margin-left:8px;">${fecha}</span></div>`;
  }).join('');
}

// Perchas (ubicaciones): SOLO dueño — CRUD sobre tarjetas, 2da parte de Inventario.
// renderPerchaCard: tarjeta individual de percha con selector para mover de sucursal.
// JFC 2026-07-02: UI habla de percha; sucursal es el encabezado de grupo.
// Editor de comisión de percha (JFC 2026-08-27, portado de amigable-123):
// % asociado, meta mensual, tramos/escalas, contribución fija, mínimo
// garantizado, lectura preferida y switch "usar comisión propia". El backend
// ya aceptaba estos campos; faltaba la UI.
async function abrirEditorComisionPercha(id){
  let u;
  try { u = (await (await fetch(`${API}/ubicaciones?todas=1`)).json()).find((x) => x.id === id); } catch (_) {}
  if (!u) return;
  const esc = (v) => escHtml(v == null ? "" : v);
  const tramos = (Array.isArray(u.escalasComision) ? u.escalasComision : []).slice().sort((a,b) => (a.desde||0)-(b.desde||0));
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(6,13,20,.55);z-index:9600;display:flex;align-items:center;justify-content:center;padding:16px;";
  overlay.innerHTML = `
    <div style="background:var(--blanco-calido,#fbf5e8);border:2px solid var(--azul-medio,#2c4a68);border-radius:12px;max-width:520px;width:100%;max-height:90vh;overflow:auto;padding:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong style="font-size:16px;">Commission — ${esc(u.nombre)}</strong>
        <button data-cep-cerrar style="font-size:20px;line-height:1;width:30px;height:30px;border-radius:50%;border:2px solid var(--ink);background:#fff;color:var(--ink);cursor:pointer;">✕</button>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <label style="font-size:13px;">Associate takes (%)<br><input id="cep-pct" type="number" min="0" max="100" step="0.5" value="${Number(u.comisionSocio)||0}" style="width:110px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;"></label>
        <label style="font-size:13px;">Monthly target ($)<br><input id="cep-meta" type="number" min="0" step="1" value="${Number(u.metaMensual)||0}" style="width:130px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;"></label>
        <label style="font-size:13px;">Fixed contribution ($)<br><input id="cep-contrib" type="number" min="0" step="0.01" value="${Number(u.contribFija)||0}" style="width:120px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;"></label>
        <label style="font-size:13px;">Minimum guaranteed ($)<br><input id="cep-minimo" type="number" min="0" step="0.01" value="${Number(u.minimoGarantizado)||0}" style="width:120px;padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;"></label>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px;">
        <input id="cep-propia" type="checkbox" ${u.usarComisionPropia ? "checked" : ""} style="width:18px;height:18px;">
        Use this shelf's own commission (ignore the agent's deal)</label>
      <label style="display:block;font-size:13px;margin-top:8px;">Preferred reading<br>
        <select id="cep-lectura" style="padding:8px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;">
          <option value="asociado" ${u.lecturaPreferida !== "casa" ? "selected" : ""}>Associate takes X%</option>
          <option value="casa" ${u.lecturaPreferida === "casa" ? "selected" : ""}>House keeps X%</option>
        </select></label>
      <div style="margin-top:10px;">
        <div style="font-size:13px;font-weight:700;color:var(--azul-medio,#2c4a68);">Goal-based tiers (optional)</div>
        <div id="cep-tramos" style="margin-top:4px;"></div>
        <button id="cep-add-tramo" type="button" style="font-size:12px;padding:4px 10px;margin-top:6px;border:1.5px solid var(--azul-medio,#2E6278);border-radius:6px;background:transparent;color:var(--azul-medio,#2E6278);cursor:pointer;">+ Add tier</button>
      </div>
      <p id="cep-msg" style="font-size:13px;font-weight:700;margin:10px 0 0;"></p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button id="cep-guardar" style="flex:1;font-size:14px;font-weight:700;padding:10px;background:#006B3C;border:1.5px solid #006B3C;border-radius:6px;color:#fff !important;-webkit-text-fill-color:#fff !important;cursor:pointer;">Save</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const tramosEl = overlay.querySelector("#cep-tramos");
  const pintarTramos = () => {
    const filas = [...tramosEl.querySelectorAll("[data-tramo]")].map((f) => ({ desde: Number(f.querySelector(".ce-t-desde").value) || 0, pct: Number(f.querySelector(".ce-t-pct").value) || 0 }));
    tramosEl.innerHTML = filas.map((t) => `
      <div data-tramo style="display:flex;gap:6px;align-items:center;margin-top:4px;">
        <span style="font-size:12px;color:var(--ink-soft);">from</span>
        <input class="ce-t-desde" type="number" min="0" step="1" value="${t.desde}" style="width:90px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <span style="font-size:12px;color:var(--ink-soft);">%</span>
        <input class="ce-t-pct" type="number" min="0" max="100" step="0.5" value="${t.pct}" style="width:80px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <button type="button" data-tramo-del style="font-size:12px;padding:3px 8px;border:1px solid #C0392B;border-radius:5px;background:transparent;color:#C0392B;cursor:pointer;">✕</button>
      </div>`).join("");
    tramosEl.querySelectorAll("[data-tramo-del]").forEach((b) => b.addEventListener("click", () => { b.closest("[data-tramo]").remove(); pintarTramos(); }));
  };
  tramosEl.innerHTML = tramos.map((t) => `
    <div data-tramo style="display:flex;gap:6px;align-items:center;margin-top:4px;">
      <span style="font-size:12px;color:var(--ink-soft);">from</span>
      <input class="ce-t-desde" type="number" min="0" step="1" value="${t.desde}" style="width:90px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <span style="font-size:12px;color:var(--ink-soft);">%</span>
      <input class="ce-t-pct" type="number" min="0" max="100" step="0.5" value="${t.pct}" style="width:80px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <button type="button" data-tramo-del style="font-size:12px;padding:3px 8px;border:1px solid #C0392B;border-radius:5px;background:transparent;color:#C0392B;cursor:pointer;">✕</button>
    </div>`).join("");
  tramosEl.querySelectorAll("[data-tramo-del]").forEach((b) => b.addEventListener("click", () => { b.closest("[data-tramo]").remove(); pintarTramos(); }));
  overlay.querySelector("#cep-add-tramo").addEventListener("click", () => {
    const filas = [...tramosEl.querySelectorAll("[data-tramo]")];
    const ultimo = filas.length ? Number(filas[filas.length-1].querySelector(".ce-t-desde").value) || 0 : 0;
    tramosEl.insertAdjacentHTML("beforeend", `
      <div data-tramo style="display:flex;gap:6px;align-items:center;margin-top:4px;">
        <span style="font-size:12px;color:var(--ink-soft);">from</span>
        <input class="ce-t-desde" type="number" min="0" step="1" value="${ultimo + 500}" style="width:90px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <span style="font-size:12px;color:var(--ink-soft);">%</span>
        <input class="ce-t-pct" type="number" min="0" max="100" step="0.5" value="" style="width:80px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <button type="button" data-tramo-del style="font-size:12px;padding:3px 8px;border:1px solid #C0392B;border-radius:5px;background:transparent;color:#C0392B;cursor:pointer;">✕</button>
      </div>`);
    tramosEl.querySelectorAll("[data-tramo-del]").forEach((b) => b.addEventListener("click", () => { b.closest("[data-tramo]").remove(); pintarTramos(); }));
  });
  const cerrar = () => overlay.remove();
  overlay.querySelector("[data-cep-cerrar]").addEventListener("click", cerrar);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrar(); });
  overlay.querySelector("#cep-guardar").addEventListener("click", async () => {
    const msg = overlay.querySelector("#cep-msg");
    const escalas = [...tramosEl.querySelectorAll("[data-tramo]")].map((f) => ({ desde: Number(f.querySelector(".ce-t-desde").value) || 0, pct: Number(f.querySelector(".ce-t-pct").value) || 0 })).filter((e) => e.pct > 0);
    const body = {
      comisionSocio: overlay.querySelector("#cep-pct").value,
      metaMensual: overlay.querySelector("#cep-meta").value,
      contribFija: overlay.querySelector("#cep-contrib").value,
      minimoGarantizado: overlay.querySelector("#cep-minimo").value,
      usarComisionPropia: overlay.querySelector("#cep-propia").checked,
      lecturaPreferida: overlay.querySelector("#cep-lectura").value,
      escalasComision: escalas,
    };
    try {
      const res = await fetch(`${API}/ubicaciones/${encodeURIComponent(id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const r = await res.json();
      if (!res.ok) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = r.error || "Could not save."; return; }
      msg.style.color = "var(--verde,#2f7a4f)"; msg.textContent = "Saved.";
      setTimeout(() => { cerrar(); cargarPerchas(); }, 600);
    } catch (_) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = "Could not reach the server."; }
  });
}

function renderPerchaCard(u, sucursalesDisp, promotorasDisp) {
  const inactiva = u.activa === false;
  const tipo = u.tipo || 'propio';
  const tipoLabel = { propio:'Own', socio:'Partner', franquicia:'Franchise', consignacion:'Consignment' }[tipo] || tipo;
  const comLabel = (tipo !== 'propio') ? ` · ${Number(u.comisionSocio)||0}% commission` : '';
  const optsS = sucursalesDisp.map(s =>
    `<option value="${s.id}"${u.sucursalId === s.id ? ' selected' : ''}>${escHtml(s.nombre)}</option>`
  ).join('');
  return `<div class="tag-card" style="text-align:left;padding:14px;margin-bottom:8px;${inactiva ? 'background:#E7E9E5;border-color:#9DA29B;' : ''}">
    <strong style="font-size:16px;color:var(--ink);">${escHtml(u.nombre)}</strong>
    <div style="font-size:13px;color:var(--ink-soft);margin:4px 0 10px;">${tipoLabel}${comLabel}${u.esFeria ? ' · <strong style="color:var(--rust,#E86040);">FERIA</strong>' : ''}${inactiva ? ' · DESACTIVADA' : ''}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
      <button data-percha-renombrar="${u.id}" style="font-size:13px;padding:6px 10px;border:2px solid var(--azul-medio);border-radius:5px;background:transparent;color:var(--azul-medio);cursor:pointer;">Rename</button>
      ${tipo !== 'propio' ? `<button data-percha-comision="${u.id}" style="font-size:13px;padding:6px 10px;border:2px solid #B8860B;border-radius:5px;background:transparent;color:#7a5510;cursor:pointer;">Commission</button>` : ""}
      <button data-percha-toggle="${u.id}" data-activa="${u.activa !== false}" data-feria="${u.esFeria ? '1' : ''}" style="font-size:13px;padding:6px 10px;border:2px solid var(--rust);border-radius:5px;background:transparent;color:var(--rust);cursor:pointer;">${inactiva ? 'Reactivate' : (u.esFeria ? 'Close and settle' : 'Deactivate')}</button>
      <button data-percha-borrar="${u.id}" data-nombre="${escHtml(u.nombre)}" style="font-size:13px;padding:6px 10px;border:2px solid var(--rojo,#E8365D);border-radius:5px;background:transparent;color:var(--rojo,#E8365D);cursor:pointer;">Delete</button>
      <label style="font-size:13px;color:var(--ink-soft);">Move to:
        <select data-percha-mover="${u.id}" style="font-size:13px;padding:4px 6px;border:1px solid var(--azul-medio);border-radius:4px;margin-left:4px;">
          <option value="">— Sin sucursal —</option>${optsS}
        </select></label>
      <label style="font-size:13px;color:var(--ink-soft);">Promoter:
        <select data-percha-promotor="${u.id}" style="font-size:13px;padding:4px 6px;border:1px solid var(--azul-medio);border-radius:4px;margin-left:4px;">
          <option value="">— Ninguno —</option>${(promotorasDisp||[]).map(pr => `<option value="${pr.id}"${u.promotoraId === pr.id ? ' selected' : ''}>${escHtml(pr.nombre)}</option>`).join('')}
        </select></label>
    </div>
  </div>`;
}

async function cargarPerchas(){
  // Microcirugia 4 (2026-07-08): 3 fetches en paralelo sin proteccion eran un
  // crash silencioso si cualquiera fallaba. Ahora la seccion muestra un aviso.
  let sucursalesDisp, perchas, promotorasDisp;
  try {
    const [resSuc, resUbic, resProm] = await Promise.all([
      fetch(API + '/sucursales'),
      fetch(API + '/ubicaciones?todas=1'),
      fetch(API + '/promotoras')
    ]);
    sucursalesDisp = await resSuc.json();
    perchas        = await resUbic.json();
    promotorasDisp = await resProm.json();
  } catch (_) {
    const g = document.getElementById('gridPerchas');
    if (g) g.innerHTML = '<p style="color:var(--rojo,#a3392a);font-size:14px;">' + window.t("err.racksLoad") + '</p>';
    return;
  }
  const grid = document.getElementById('gridPerchas');
  if (!grid) return;

  // Poblar select sucursal del form "Agregar percha"
  const selSuc = document.getElementById('perchaSucursal');
  if (selSuc) {
    selSuc.innerHTML = '<option value="">' + window.t("err.noBranch") + '</option>' +
      sucursalesDisp.map(s => `<option value="${s.id}">${escHtml(s.nombre)}</option>`).join('');
  }

  // Agrupar perchas por sucursal
  const porSucursal = {};
  const sinSucursal = [];
  perchas.forEach(u => {
    if (u.sucursalId) { (porSucursal[u.sucursalId] = porSucursal[u.sucursalId] || []).push(u); }
    else sinSucursal.push(u);
  });

  let html = '';
  sucursalesDisp.forEach(s => {
    const ps = porSucursal[s.id] || [];
    const btnBorrarSuc = ps.length === 0
      ? `<button data-suc-borrar="${s.id}" data-nombre="${escHtml(s.nombre)}" style="font-size:13px;padding:3px 8px;border:1px solid var(--rojo,#E8365D);border-radius:4px;background:transparent;color:var(--rojo,#E8365D);cursor:pointer;">Delete</button>`
      : '';
    html += `<div style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;border-bottom:1px solid var(--azul-medio,#4a7fa5);padding-bottom:4px;">
        <span style="font-size:13px;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.06em;">Sucursal: ${escHtml(s.nombre)}</span>
        <button data-suc-renombrar="${s.id}" style="font-size:13px;padding:3px 8px;border:1px solid var(--azul-medio);border-radius:4px;background:transparent;color:var(--azul-medio);cursor:pointer;">Rename</button>
        ${btnBorrarSuc}
      </div>
      ${ps.length ? ps.map(u => renderPerchaCard(u, sucursalesDisp, promotorasDisp)).join('') : '<p style="font-size:13px;color:var(--ink-soft);margin:0 0 8px;">Ninguna percha asignada.</p>'}
    </div>`;
  });
  if (sinSucursal.length) {
    html += `<div style="margin-bottom:20px;">
      <div style="margin-bottom:8px;border-bottom:1px solid var(--azul-medio,#4a7fa5);padding-bottom:4px;">
        <span style="font-size:13px;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.06em;">Sin sucursal</span>
      </div>
      ${sinSucursal.map(u => renderPerchaCard(u, sucursalesDisp, promotorasDisp)).join('')}
    </div>`;
  }
  if (!perchas.length) html = '<p style="font-size:14px;color:var(--ink-soft);">No shelves registered.</p>';
  grid.innerHTML = html;

  // ---- Eventos sucursales ----
  grid.querySelectorAll('[data-suc-renombrar]').forEach(btn => btn.addEventListener('click', async () => {
    const nuevo = (await ocPrompt('Nuevo nombre de la sucursal:', '') || '').trim();
    if (!nuevo) return;
    const res = await fetch(`${API}/sucursales/${btn.dataset.sucRenombrar}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre: nuevo }) });
    if (res.ok) cargarPerchas();
  }));
  grid.querySelectorAll('[data-suc-borrar]').forEach(btn => btn.addEventListener('click', async () => {
    if (!(await ocConfirm(`Delete location "${btn.dataset.nombre}". Only possible if it has no assigned shelves.`, { danger: true }))) return;
    const res = await fetch(`${API}/sucursales/${btn.dataset.sucBorrar}`, { method:'DELETE' });
    const r = await res.json(); if (!res.ok) { await ocAlert(r.error); return; }
    cargarPerchas();
  }));

  // ---- Eventos perchas ----
  grid.querySelectorAll('[data-percha-renombrar]').forEach(btn => btn.addEventListener('click', async () => {
    const nuevo = (await ocPrompt(t('shelves.renamePrompt','New shelf name:'), '') || '').trim();
    if (!nuevo) return;
    const res = await fetch(`${API}/ubicaciones/${btn.dataset.perchaRenombrar}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre: nuevo }) });
    const r = await res.json(); if (!res.ok){ await ocAlert(r.error); return; }
    cargarPerchas(); if (window.cargarUbicaciones) window.cargarUbicaciones();
  }));
  grid.querySelectorAll('[data-percha-comision]').forEach(btn => btn.addEventListener('click', () => abrirEditorComisionPercha(btn.dataset.perchaComision)));
  grid.querySelectorAll('[data-percha-toggle]').forEach(btn => btn.addEventListener('click', async () => {
    const activaAhora = btn.dataset.activa === 'true';
    const esFeria = btn.dataset.feria === '1';
    const aviso = esFeria
      ? 'This event will close: it stops receiving sales and you will see the settlement. History is preserved. Continue?'
      : 'This rack will stop receiving new sales. History is preserved. Continue?';
    if (activaAhora && !(await ocConfirm(aviso))) return;
    const accion = activaAhora ? 'desactivar' : 'activar';
    const res = await fetch(`${API}/ubicaciones/${btn.dataset.perchaToggle}/${accion}`, { method:'POST' });
    if (res.ok){
      cargarPerchas(); if (window.cargarUbicaciones) window.cargarUbicaciones();
      // Rec 10: cerrar feria -> mostrar su liquidación al instante.
      if (esFeria && activaAhora){ const nav = document.querySelector('nav button[data-vista="comisiones"]'); if (nav) nav.click(); }
    }
  }));
  grid.querySelectorAll('[data-percha-borrar]').forEach(btn => btn.addEventListener('click', async () => {
    if (!(await ocConfirm(`Delete rack "${btn.dataset.nombre}" and ALL its products. This cannot be undone. Are you sure?`, { danger: true }))) return;
    const res = await fetch(`${API}/ubicaciones/${btn.dataset.perchaBorrar}`, { method:'DELETE' });
    const r = await res.json(); if (!res.ok){ await ocAlert(r.error); return; }
    cargarPerchas(); if (window.cargarUbicaciones) window.cargarUbicaciones(); cargarInventario();
  }));
  grid.querySelectorAll('[data-percha-mover]').forEach(sel => sel.addEventListener('change', async () => {
    const sucursalId = sel.value || null;
    const res = await fetch(`${API}/ubicaciones/${sel.dataset.perchaMover}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sucursalId }) });
    if (res.ok) cargarPerchas();
  }));
  // Asignar asociado/a a la percha (alimenta el panel de fotos y comisiones)
  grid.querySelectorAll('[data-percha-promotor]').forEach(sel => sel.addEventListener('change', async () => {
    const promotoraId = sel.value || null;
    const res = await fetch(`${API}/ubicaciones/${sel.dataset.perchaPromotor}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ promotoraId }) });
    if (res.ok) cargarPerchas();
  }));
}

// Alta de percha y alta de sucursal (delegados: botones viven en HTML estático)
document.addEventListener('click', async (e) => {
  if (!e.target) return;
  if (e.target.id === 'sucursalCrear') {
    const nombre = document.getElementById('sucursalNombre').value.trim();
    const msg = document.getElementById('sucursalMsg');
    if (!nombre){ msg.style.color='var(--rojo,#E8365D)'; msg.textContent='Name is required.'; return; }
    const res = await fetch(`${API}/sucursales`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre }) });
    const r = await res.json(); if (!res.ok){ msg.style.color='var(--rojo,#E8365D)'; msg.textContent=r.error; return; }
    document.getElementById('sucursalNombre').value='';
    msg.style.color='var(--verde,#2f7a4f)'; msg.textContent=`Sucursal "${r.nombre}" creada.`;
    cargarPerchas();
    return;
  }
  if (e.target.id === 'feriaAbrir') {
    const nombre = document.getElementById('feriaNombre').value.trim();
    const comisionSocio = document.getElementById('feriaComision').value;
    const msg = document.getElementById('feriaMsg');
    if (!nombre){ msg.style.color='var(--rojo,#E8365D)'; msg.textContent='Event name is required.'; return; }
    const res = await fetch(`${API}/ubicaciones`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre: 'Feria: ' + nombre, tipo:'consignacion', comisionSocio, esFeria:true }) });
    const r = await res.json(); if (!res.ok){ msg.style.color='var(--rojo,#E8365D)'; msg.textContent=r.error; return; }
    document.getElementById('feriaNombre').value=''; document.getElementById('feriaComision').value='';
    msg.style.color='var(--verde,#2f7a4f)'; msg.textContent=`Event "${r.nombre}" opened. Assign products in Inventory and, when done, close it from its card.`;
    cargarPerchas(); if (window.cargarUbicaciones) window.cargarUbicaciones();
    return;
  }
  if (e.target.id === 'perchaCrear') {
    const nombre = document.getElementById('perchaNombre').value.trim();
    const tipo = document.getElementById('perchaTipo').value;
    const comisionSocio = document.getElementById('perchaComision').value;
    const metaMensual = document.getElementById('perchaMeta').value;
    /* Vacio se manda como 0: el motor trata 0 como "no aplica" y el reparto
       queda identico al de siempre. Ver repartir() en mock-backend.js. */
    const minimoGarantizado = document.getElementById('perchaMinimo').value || 0;
    const contribFija = document.getElementById('perchaContrib').value || 0;
    const sucursalId = document.getElementById('perchaSucursal').value || null;
    const msg = document.getElementById('perchaMsg');
    if (!nombre){ msg.style.color='var(--rojo,#E8365D)'; msg.textContent='Name is required.'; return; }
    const res = await fetch(`${API}/ubicaciones`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre, tipo, comisionSocio, metaMensual, sucursalId, lecturaPreferida: _f123Lectura, minimoGarantizado, contribFija }) });
    const r = await res.json(); if (!res.ok){ msg.style.color='var(--rojo,#E8365D)'; msg.textContent=r.error; return; }
    document.getElementById('perchaNombre').value=''; document.getElementById('perchaComision').value=''; document.getElementById('perchaMeta').value=''; document.getElementById('perchaMinimo').value=''; document.getElementById('perchaContrib').value='';
    { const _c = document.getElementById('perchaCasa'); if (_c) _c.value=''; }
    msg.style.color='var(--verde,#2f7a4f)'; msg.textContent=`"${r.nombre}" creada.`;
    cargarPerchas(); if (window.cargarUbicaciones) window.cargarUbicaciones();
  }
});

// FIX 2026-07-07 (JFC: "eso debe abrir su propio editar producto"): antes
// esta funcion saltaba a la vista Vender y la ficha quedaba enterrada bajo
// la cuadricula. Ahora abre el editor en un modal, sin salir de Inventario.
async function abrirFichaDesdeInventario(id){
  // Reforzado (JFC 2026-07-18): sin este catch, un fallo de red aqui tiraba
  // una excepcion no atrapada y tocar un producto del inventario no hacia
  // nada visible.
  let p;
  try {
    const res = await fetch(`${API}/productos/${id}`);
    p = await res.json();
  } catch (err) {
    console.error("[abrirFichaDesdeInventario]", err);
    await ocAlert("Could not reach the server. Check your connection and try again.");
    return;
  }
  fichaTargetActual = "fichaModalBody";
  pintarFicha(p);
  const modal = document.getElementById("modalFicha");
  if (modal) modal.classList.add("activo");
}

// Acceso directo #2 a la edicion (homologado de AMIGABLE, 2026-07-22,
// "todo lleva a todo"): el lapiz de la tarjeta abre el modal YA en modo
// edicion, sin pasar por la ficha. La ruta clasica (ficha -> Editar) sigue.
async function abrirEdicionDesdeInventario(id){
  fichaTargetActual = "fichaModalBody";
  const modal = document.getElementById("modalFicha");
  if (modal) modal.classList.add("activo");
  await mostrarFormEditarProducto(id);
}
(function () {
  const modal = document.getElementById("modalFicha");
  const cerrar = () => {
    if (!modal) return;
    modal.classList.remove("activo");
    fichaTargetActual = "fichaResultado"; // el buscador de Vender vuelve a ser el destino
    cargarInventario(); // reflejar ediciones/ventas hechas dentro del modal
    // TODO LLEVA A TODO (homologado de AMIGABLE, 2026-07-22): si el modal se
    // abrio desde Perchas, refrescar tambien esa vista.
    if (vistaActivaId && vistaActivaId() === "perchas" && window.VPerchas && window.VPerchas.cargar) window.VPerchas.cargar();
  };
  const btn = document.getElementById("cerrarModalFicha");
  if (btn) btn.addEventListener("click", cerrar);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) cerrar(); });
})();

// --- VISTA ESCANEAR ---
async function ejecutarEscaneo(){
  fichaTargetActual = "fichaResultado"; // el buscador siempre pinta en su propio panel
  const codigo = document.getElementById("inputEscaner").value.trim();
  const contenedor = document.getElementById("fichaResultado");
  if (!codigo){
    contenedor.innerHTML = "";
    return;
  }
  // Reforzado (JFC 2026-07-18): esto corre en cada lectura del escaner — sin
  // try/catch, un fallo de red aqui (offline, servidor caido) tiraba una
  // excepcion no atrapada en cada intento de venta, sin avisar nada en
  // pantalla. Ahora se avisa claro en el mismo panel donde ya se muestran
  // los errores de "producto no encontrado".
  let res;
  try {
    res = await fetch(`${API}/escanear`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({codigo})
    });
  } catch (err) {
    console.error("[ejecutarEscaneo]", err);
    contenedor.innerHTML = `<p style="color:var(--rojo); font-weight:bold;">${window.t("err.serverReach")}</p>`;
    return;
  }
  if (!res.ok){
    const err = await res.json();
    const puedeCrear = (window.OCAuth && window.OCAuth.puedeGestionar && window.OCAuth.puedeGestionar());
    contenedor.innerHTML = `<p style="color:var(--rojo); font-weight:bold;">${err.error}</p>` +
      (puedeCrear ? `<button class="ir" style="margin-top:10px;" onclick="mostrarFormNuevoProducto('${escHtml(codigo).replace(/'/g, "\\'")}')">+ Dar de alta este producto</button>` : "");
    return;
  }
  const p = await res.json();
  pintarFicha(p);
  sonarBeepExito();
}

// --- Beep de confirmación (tronco de UX de escaneo) ---
// Un tono corto vía Web Audio API cuando el escaneo encuentra el producto —
// el cajero no necesita mirar la pantalla para saber que la lectura fue
// exitosa. Sin dependencias, sin archivo de audio (todo generado en código).
let audioCtxBeep = null;
function sonarBeepExito(){
  try {
    audioCtxBeep = audioCtxBeep || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtxBeep.createOscillator();
    const gain = audioCtxBeep.createGain();
    osc.type = "sine"; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, audioCtxBeep.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxBeep.currentTime + 0.12);
    osc.connect(gain); gain.connect(audioCtxBeep.destination);
    osc.start(); osc.stop(audioCtxBeep.currentTime + 0.12);
  } catch (e) { /* Audio API no disponible: silencioso, no rompe el escaneo */ }
}

// --- Autofocus persistente en el input de escaneo ---
// Si el operario toca fuera del campo (o el lector de código de barras le
// quita el foco un instante), el foco vuelve solo en 2s — así el flujo es
// "apuntar y escanear" sin tener que tocar la pantalla entre cada lectura.
// Se cancela si el usuario está escribiendo en otro input (ej. el formulario
// de "nuevo producto" que vive en esta misma vista) para no robarle el foco.
let refocoTimer = null;
document.getElementById("inputEscaner").addEventListener("blur", () => {
  clearTimeout(refocoTimer);
  refocoTimer = setTimeout(() => {
    const vistaActiva = document.getElementById("vista-escanear");
    const activo = document.activeElement;
    const otroInputEnfocado = activo && activo !== document.body && activo.id !== "inputEscaner" && (activo.tagName === "INPUT" || activo.tagName === "SELECT" || activo.tagName === "TEXTAREA");
    if (vistaActiva && vistaActiva.classList.contains("activa") && !otroInputEnfocado) {
      document.getElementById("inputEscaner").focus();
    }
  }, 2000);
});

/* UN SOLO FORMULARIO np-* A LA VEZ (JFC 2026-08-19).
   El formulario de producto nuevo se pinta en DOS sitios: en #fichaResultado
   (cuando el buscador/escaner no encuentra el codigo) y en el cuerpo de
   #modalFicha (boton "+ producto"). Los dos usan los MISMOS ids: np-nombre,
   np-precio, np-costo, np-stock...

   Si los dos estaban montados a la vez —escanear un codigo desconocido y
   despues abrir el modal— document.getElementById("np-nombre") devolvia el
   PRIMERO, o sea el del panel de atras. El usuario escribia en el modal y la
   app guardaba lo que hubiera en el formulario escondido: precios, costos y
   stock de otro producto, sin ningun error a la vista.

   Se resuelve en el origen en vez de andar cambiando cada lectura: antes de
   pintar uno, se vacia el otro. Asi todo el codigo que ya lee por id sigue
   siendo correcto, porque solo hay un candidato. */
function ocLimpiarOtroFormProducto(destino) {
  try {
    ["fichaResultado", "modalFichaBody"].forEach(function (id) {
      if (id === destino) return;
      var c = document.getElementById(id);
      if (c && c.querySelector("#np-nombre")) c.innerHTML = "";
    });
    var m = document.getElementById("modalFicha");
    if (destino !== "modalFichaBody" && m) {
      var b = m.querySelector(".cuerpo, .body, [data-modal-body]");
      if (b && b.querySelector("#np-nombre")) b.innerHTML = "";
    }
  } catch (_) {}
}

function mostrarFormNuevoProducto(codigoEscaneado){
  ocLimpiarOtroFormProducto("fichaResultado");
  const contenedor = document.getElementById("fichaResultado");
  contenedor.innerHTML = `
    <div class="ficha-producto tag-card" style="text-align:left;">
      <div class="titulo">${t("form.newProduct")}</div>
      ${codigoEscaneado
        ? `<div class="linea"><strong>Code:</strong> ${codigoEscaneado}</div>`
        : `<label style="display:block;margin-top:10px;font-size:14px;">${t("form.barcodeLabel")}<br>
            <input id="np-barcode" type="text" placeholder="${t('form.barcodePlaceholder')}" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>`}
      <label style="display:block;margin-top:10px;font-size:14px;"><span data-i18n="common.name">Name</span><br>
        <input id="np-nombre" type="text" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.category")}<br>
        <input id="np-categoria" type="text" placeholder="${t('form.categoryPlaceholder')}" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
      <label style="display:block;margin-top:10px;font-size:14px;">Product type<br>
        <select id="np-tipo-producto" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;">
          <option value="normal">Normal</option>
          <option value="ticket">Ticket / Event</option>
          <option value="bar">Bar (count by serving)</option>
        </select></label>
      <div id="np-bar-wrap" style="display:none;margin-top:10px;">
        <div style="display:flex;gap:10px;">
          <label style="flex:1;font-size:14px;">Serving size (ml)<br><input id="np-serving-ml" type="number" min="1" step="1" value="50" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
          <label style="flex:1;font-size:14px;">Bottle size (ml)<br><input id="np-botella-ml" type="number" min="1" step="1" value="750" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
        </div>
        <p style="font-size:13px;color:var(--ink-soft);margin:6px 0 0;">Stock is counted in servings. 1 bottle (750 ml) ≈ 15 servings at 50 ml.</p>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <label style="flex:1;font-size:14px;">${t("form.salePrice")}<br>
          <input id="np-precio" type="number" min="0" step="0.01" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
        <label style="flex:1;font-size:14px;">${t("form.cost")}<br>
          <input id="np-costo" type="number" min="0" step="0.01" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
      </div>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.initialStock")}<br>
        <input id="np-stock" type="number" min="0" step="1" value="0" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.supplier")}<br>
        <input id="np-proveedor" type="text" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
      <label style="display:block;margin-top:10px;font-size:14px;">Commission agent (comisionista)<br>
        <select id="np-comisionista" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;">
          <option value="">— None —</option>
        </select></label>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.photoAltaLabel")}<br>
        <input id="np-foto" type="file" accept="image/*" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
      <label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-size:15px;font-weight:700;">
        <input id="np-perecible" type="checkbox" style="width:20px;height:20px;"> <span>${t("form.expiresQ")}</span></label>
      <div id="np-fecha-wrap" style="display:none;margin-top:8px;">
        <label style="display:block;font-size:14px;">${t("form.expiryDate")}<br>
          <input id="np-fecha" type="date" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"></label>
        <label style="display:block;margin-top:8px;font-size:14px;">${t("form.sellOrder")}<br>
          <select id="np-metodo" style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;">
            <option value="FIFO">${t("form.fifo")}</option>
            <option value="LIFO">${t("form.lifo")}</option>
          </select></label>
      </div>
      <div id="np-msg" style="font-size:14px;margin-top:10px;font-weight:700;"></div>
      <button class="ir" style="margin-top:12px;" onclick="crearProductoNuevo('${escHtml(codigoEscaneado).replace(/'/g, "\\'")}')">${t("form.saveProduct")}</button>
    </div>
  `;
  document.getElementById("np-perecible").addEventListener("change", (e) => {
    document.getElementById("np-fecha-wrap").style.display = e.target.checked ? "block" : "none";
  });
  /* Tipo de producto: al elegir "Bar" se muestran los campos de serving/botella. */
  const _npTipo = document.getElementById("np-tipo-producto");
  if (_npTipo) _npTipo.addEventListener("change", (e) => {
    const w = document.getElementById("np-bar-wrap");
    if (w) w.style.display = e.target.value === "bar" ? "block" : "none";
  });
  /* Comisionista (JFC 2026-08-27): poblar el dropdown con las promotoras. */
  poblarSelectComisionistas("np-comisionista", null);
  /* Categoria como combo mixto: se elige de la lista o se escribe otra. */
  try { if (window.OCCategorias) window.OCCategorias.enganchar(document.getElementById("np-categoria")); } catch (_) {}
  /* Nada tecleado se pierde: si se va la luz, se toca "atras" o el telefono
     manda la app al fondo, lo escrito sigue aqui al volver. Ver borradores.js. */
  try {
    if (window.OCBorradores) {
      const _c = document.getElementById("np-nombre");
      if (_c) window.OCBorradores.enganchar(_c.closest(".ficha-producto"), "alta-producto", { msgId: "np-msg" });
    }
  } catch (_) {}
}

async function crearProductoNuevo(codigoEscaneado){
  // FIX (JFC 2026-08-20, caza microbugs): dos bugs reales, homologado del
  // mismo fix ya aplicado en AMIGABLE y consultorio-123.
  // 1) el("np-chip") llamaba a una funcion que NO existe en ningun archivo
  //    -- tiraba ReferenceError y crearProductoNuevo fallaba SIEMPRE.
  // 2) np-nombre/np-precio/etc. estan DUPLICADOS en el HTML (una copia por
  //    contenedor: fichaResultado y fichaModalBody). document.getElementById
  //    sin scope siempre agarra la PRIMERA copia -- si el usuario llenaba el
  //    modal, el guardado podia leer campos viejos/vacios del otro
  //    contenedor sin avisar.
  const scope = document.getElementById(fichaTargetActual) || document;
  const val = (id) => { const e = scope.querySelector("#" + id); return e ? e.value.trim() : ""; };
  const el = (id) => scope.querySelector("#" + id);
  const perecible = el("np-perecible").checked;
  const body = {
    nombre: val("np-nombre"), categoria: val("np-categoria"), barcode: codigoEscaneado || val("np-barcode"),
    chip: el("np-chip") ? val("np-chip").slice(0, 12) : "",
    precio: val("np-precio"), costo: val("np-costo"), stockInicial: val("np-stock"), proveedor: val("np-proveedor"),
    ubicacionId: el("np-ubicacion") ? val("np-ubicacion") : (ubicacionActual === "todas" ? "todas" : ubicacionActual),
    tipoProveedor: el("np-tipo-proveedor") ? el("np-tipo-proveedor").value : "compra",
    comisionProveedorPct: el("np-tipo-proveedor") && el("np-tipo-proveedor").value === "consignacion" ? Number(val("np-comision-pct")) || 0 : 0,
    comisionistaId: el("np-comisionista") ? (el("np-comisionista").value || null) : null,
    perecible, fechaCaducidad: perecible ? val("np-fecha") : null,
    metodoCosteo: perecible ? el("np-metodo").value : "FIFO",
    /* Tipo de producto + campos de bar (JFC 2026-08-27): "bar" cuenta stock en
       servings; servingMl/botellaMl definen la conversión (default 50/750 ml). */
    tipoProducto: el("np-tipo-producto") ? el("np-tipo-producto").value : "normal",
    servingMl: el("np-tipo-producto") && el("np-tipo-producto").value === "bar" ? Number(val("np-serving-ml")) || 50 : 50,
    botellaMl: el("np-tipo-producto") && el("np-tipo-producto").value === "bar" ? Number(val("np-botella-ml")) || 750 : 750,
  };
  const msg = el("np-msg");
  if (!body.nombre){ msg.style.color = "var(--rojo)"; msg.textContent = t("form.nameRequired"); return; }
  if (!body.barcode){ msg.style.color = "var(--rojo)"; msg.textContent = t("form.codeRequired"); return; }
  if (Number(body.precio) === 0){ if (!(await ocConfirm(t("form.zeroPriceConfirm")))) return; }
  // Foto por producto en alta (homologado de AMIGABLE, 2026-07-22)
  const fotoNp = el("np-foto");
  if (fotoNp) { const fotoNueva = await leerFotoRedimensionada(fotoNp); if (fotoNueva) body.foto = fotoNueva; }
  let res, data;
  try {
    res = await fetch(`${API}/productos`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
    data = await res.json();
  } catch (err) {
    console.error("[crearProductoNuevo]", err);
    msg.style.color = "var(--rojo)"; msg.textContent = "Could not reach the server. Check your connection and try again.";
    return;
  }
  if (!res.ok){ msg.style.color = "var(--rojo)"; msg.textContent = data.error; return; }
  // Guardado de verdad: el borrador ya cumplio y estorbaria en el proximo alta.
  try { if (window.OCBorradores) window.OCBorradores.limpiar("alta-producto"); } catch (_) {}
  pintarFicha(data);
}

// ============================================================================
// EDICION LIBRE DE LA FICHA (solo dueno). Todo editable: nombre, foto, precio,
// proveedor, categoria y el CODIGO INTERNO — que NO cambia al renombrar: solo
// cambia si el dueno lo digita de nuevo en su campo propio. El encargado NUNCA
// ve estos botones (dos capas de management).
// ============================================================================
async function mostrarFormEditarProducto(id){
  // Reforzado (JFC 2026-07-18): sin este catch, un fallo de red aqui tiraba
  // una excepcion no atrapada y "Editar" no hacia nada visible.
  let p, perchas = [];
  try {
    const res = await fetch(`${API}/productos/${id}`);
    p = await res.json();
    if (!res.ok || !p || !p.id) throw new Error(p && p.error ? p.error : "product not found");
  } catch (err) {
    console.error("[mostrarFormEditarProducto]", err);
    await ocAlert("Could not reach the server. Check your connection and try again.");
    return;
  }
  // Blindaje (2026-07-22, homologado de AMIGABLE): las perchas son OPCIONALES
  // para editar — si su fetch falla, el editor abre igual con "Sin percha".
  try {
    perchas = await (await fetch(`${API}/ubicaciones`)).json();
    if (!Array.isArray(perchas)) perchas = [];
  } catch (_) { perchas = []; }
  const contenedor = document.getElementById(fichaTargetActual) || document.getElementById("fichaResultado");
  const q = (s) => escHtml(s == null ? "" : s); // item 20: escape completo (<,>,&,comillas), no solo comillas
  const inp = 'style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"';
  // Multi-percha + tipo proveedor/artista (homologado de AMIGABLE, 2026-07-22)
  const optsPerchas = perchas.map(u =>
    `<option value="${escHtml(u.id)}"${u.id === p.ubicacionId ? " selected" : ""}>${escHtml(u.nombre)}</option>`
  ).join("");
  contenedor.innerHTML = `
    <div class="ficha-producto tag-card" style="text-align:left;">
      <div class="titulo">${t("form.editTitle")}</div>
      <label style="display:block;margin-top:10px;font-size:14px;"><span data-i18n="common.name">Name</span><br>
        <input id="ed-nombre" type="text" value="${q(p.nombre)}" ${inp}></label>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.photoLabel")}<br>
        <input id="ed-foto" type="file" accept="image/*" ${inp}></label>
      ${p.foto ? `<img src="${p.foto}" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:8px;margin-top:6px;">` : ""}
      <div style="display:flex;gap:10px;margin-top:10px;">
        <label style="flex:1;font-size:14px;">${t("form.salePrice")}<br><input id="ed-precio" type="number" min="0" step="0.01" value="${p.precio}" ${inp}></label>
        <label style="flex:1;font-size:14px;">${t("form.cost")}<br><input id="ed-costo" type="number" min="0" step="0.01" value="${p.costo || 0}" ${inp}></label>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <label style="flex:1;font-size:14px;">${t("form.supplier")}<br><input id="ed-proveedor" type="text" value="${q(p.proveedor)}" ${inp}></label>
        <label style="flex:1;font-size:14px;">${t("form.relationType")}<br>
          <select id="ed-tipo-proveedor" ${inp}>
            <option value="compra"${p.tipoProveedor !== "consignacion" ? " selected" : ""}>${t("form.directPurchase")}</option>
            <option value="consignacion"${p.tipoProveedor === "consignacion" ? " selected" : ""}>${t("form.consignmentArtist")}</option>
          </select></label>
      </div>
      <div id="ed-comision-wrap" style="margin-top:8px;display:${p.tipoProveedor === "consignacion" ? "block" : "none"};">
        <label style="display:block;font-size:14px;">${t("form.artistCommissionPct")}<br>
          <input id="ed-comision-pct" type="number" min="0" max="100" step="1" value="${p.comisionProveedorPct || 0}" ${inp}></label>
      </div>
      <label style="display:block;margin-top:10px;font-size:14px;">Commission agent (comisionista)<br>
        <select id="ed-comisionista" ${inp}>
          <option value="">— None —</option>
        </select></label>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.shelfLabel")}<br>
        <select id="ed-ubicacion" ${inp}>
          <option value="todas"${!p.ubicacionId || p.ubicacionId === "todas" ? " selected" : ""}>${t("form.noShelf")}</option>
          ${optsPerchas}
        </select></label>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <label style="flex:1;font-size:14px;">${t("form.redThreshold")}<br><input id="ed-umbral-rojo" type="number" min="0" step="1" value="${p.umbralRojo || 0}" ${inp}></label>
        <label style="flex:1;font-size:14px;">${t("form.yellowThreshold")}<br><input id="ed-umbral-amarillo" type="number" min="0" step="1" value="${p.umbralAmarillo || 0}" ${inp}></label>
      </div>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.category")}<br>
        <input id="ed-categoria" type="text" value="${q(p.categoria)}" ${inp}></label>
      <label style="display:block;margin-top:10px;font-size:14px;">Product type<br>
        <select id="ed-tipo-producto" ${inp}>
          <option value="normal"${p.tipoProducto !== "ticket" && p.tipoProducto !== "bar" ? " selected" : ""}>Normal</option>
          <option value="ticket"${p.tipoProducto === "ticket" ? " selected" : ""}>Ticket / Event</option>
          <option value="bar"${p.tipoProducto === "bar" ? " selected" : ""}>Bar (count by serving)</option>
        </select></label>
      <div id="ed-bar-wrap" style="margin-top:10px;display:${p.tipoProducto === "bar" ? "block" : "none"};">
        <div style="display:flex;gap:10px;">
          <label style="flex:1;font-size:14px;">Serving size (ml)<br><input id="ed-serving-ml" type="number" min="1" step="1" value="${p.servingMl || 50}" ${inp}></label>
          <label style="flex:1;font-size:14px;">Bottle size (ml)<br><input id="ed-botella-ml" type="number" min="1" step="1" value="${p.botellaMl || 750}" ${inp}></label>
        </div>
        <p style="font-size:13px;color:var(--ink-soft);margin:6px 0 0;">Stock is counted in servings. 1 bottle (750 ml) ≈ 15 servings at 50 ml.</p>
      </div>
      <label style="display:block;margin-top:14px;font-size:14px;color:var(--rust,#E86040);font-weight:700;">${t("form.internalCode")}<br>
        <input id="ed-barcode" type="text" value="${q(p.barcode)}" ${inp}></label>
      <div id="ed-msg" style="font-size:14px;margin-top:10px;font-weight:700;"></div>
      <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
        <button class="ir" onclick="guardarEdicionProducto('${p.id}')">${t("form.saveChanges")}</button>
        <button onclick="abrirFichaDesdeInventario('${p.id}')">${t("motivo.cancel")}</button>
      </div>
    </div>`;
  const _edTipo = document.getElementById("ed-tipo-producto");
  if (_edTipo) _edTipo.addEventListener("change", (e) => {
    const w = document.getElementById("ed-bar-wrap");
    if (w) w.style.display = e.target.value === "bar" ? "block" : "none";
  });
  try { if (window.OCCategorias) window.OCCategorias.enganchar(document.getElementById("ed-categoria")); } catch (_) {}
  document.getElementById("ed-tipo-proveedor").addEventListener("change", (e) => {
    document.getElementById("ed-comision-wrap").style.display = e.target.value === "consignacion" ? "block" : "none";
  });
  /* Comisionista (JFC 2026-08-27): poblar el dropdown y preseleccionar el del producto. */
  poblarSelectComisionistas("ed-comisionista", p.comisionistaId || null);
}

// Redimensiona la foto en el navegador (lado mayor 320px, JPEG 82%) a dataURL.
function leerFotoRedimensionada(fileInput){
  return new Promise((resolve) => {
    const f = fileInput && fileInput.files && fileInput.files[0];
    if (!f) return resolve(null);
    const img = new Image();
    // Item 24: revocar el objectURL al terminar — sin esto, cada foto subida
    // en una sesion larga filtraba memoria.
    const urlTemporal = URL.createObjectURL(f);
    img.onload = () => {
      const MAX = 320, esc = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(urlTemporal);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(urlTemporal); resolve(null); };
    img.src = urlTemporal;
  });
}

async function guardarEdicionProducto(id){
  // Blindaje (2026-07-22, homologado de AMIGABLE): lectura null-safe — si un
  // campo no existe en el DOM, se OMITE del PATCH en vez de reventar todo.
  const v = (x) => { const el = document.getElementById(x); return el ? el.value.trim() : undefined; };
  // OJO: el SKU no se toca aqui — solo el barcode si el dueno lo digito.
  const body = { nombre: v("ed-nombre"), precio: v("ed-precio"), costo: v("ed-costo"), proveedor: v("ed-proveedor"), categoria: v("ed-categoria"), barcode: v("ed-barcode"), ubicacionId: v("ed-ubicacion"), umbralRojo: v("ed-umbral-rojo"), umbralAmarillo: v("ed-umbral-amarillo"), tipoProveedor: v("ed-tipo-proveedor"), comisionProveedorPct: v("ed-comision-pct"), tipoProducto: v("ed-tipo-producto"), servingMl: v("ed-serving-ml"), botellaMl: v("ed-botella-ml"), comisionistaId: (() => { const e = document.getElementById("ed-comisionista"); return e ? (e.value || null) : undefined; })() };
  Object.keys(body).forEach(k => { if (body[k] === undefined) delete body[k]; });
  const foto = await leerFotoRedimensionada(document.getElementById("ed-foto"));
  if (foto) body.foto = foto;
  const msg = document.getElementById("ed-msg");
  if (!body.nombre){ msg.style.color = "var(--rojo)"; msg.textContent = t("form.nameRequired"); return; }
  if (!body.barcode){ msg.style.color = "var(--rojo)"; msg.textContent = t("form.codeCannotBeEmpty"); return; }
  let res, data;
  try {
    res = await fetch(`${API}/productos/${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
    data = await res.json();
  } catch (err) {
    console.error("[guardarEdicionProducto]", err);
    msg.style.color = "var(--rojo)"; msg.textContent = "Could not reach the server. Check your connection and try again.";
    return;
  }
  if (!res.ok){ msg.style.color = "var(--rojo)"; msg.textContent = data.error; return; }
  pintarFicha(data);
  cargarInventario();
}

// Borrado con RE-confirmacion: primer toque arma 4s; el segundo ejecuta.
async function eliminarProductoUI(id, btn){
  if (btn.dataset.armado !== "1"){
    btn.dataset.armado = "1";
    btn.textContent = t("delete.confirmAgain");
    setTimeout(() => { if (btn && btn.isConnected){ btn.dataset.armado = ""; btn.textContent = t("ficha.deleteBtn"); } }, 4000);
    return;
  }
  let res, data;
  try {
    res = await fetch(`${API}/productos/${id}`, { method: "DELETE" });
    data = await res.json();
  } catch (err) {
    console.error("[eliminarProductoUI]", err);
    btn.dataset.armado = ""; btn.textContent = t("ficha.deleteBtn");
    await ocAlert("Could not reach the server. The product was NOT deleted. Check your connection and try again.");
    return;
  }
  if (!res.ok){ await ocAlert(data.error); return; }
  document.getElementById("fichaResultado").innerHTML = `<p style="font-weight:700;">${t("delete.done")}</p>`;
  cargarInventario();
}

// "+" general del inventario: alta SIN escanear (el codigo se digita a mano).
async function abrirAltaProducto(){
  // FIX 2026-07-15: en vez de navegar a Escanear/Vender (donde cargarGridVender()
  // sobreescribía el form recién pintado), abrimos el modal de Inventario directamente.
  fichaTargetActual = "fichaModalBody";
  const body = document.getElementById("fichaModalBody");
  const modal = document.getElementById("modalFicha");
  if (!body || !modal) return;
  // Homologado de AMIGABLE (2026-07-22): fetch perchas para el selector de alta
  let perchasAlta = [];
  try { perchasAlta = await (await fetch(`${API}/ubicaciones`)).json(); if (!Array.isArray(perchasAlta)) perchasAlta = []; } catch(_){}
  // Reutilizar mostrarFormNuevoProducto pero apuntando al modal body
  const inp = 'style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:5px;"';
  /* Mismo motivo que en mostrarFormNuevoProducto: si el panel de atras dejo un
     formulario np-* montado, se vacia ANTES de pintar este. Sin esto los ids
     quedan duplicados y las lecturas por id agarran el formulario equivocado. */
  ocLimpiarOtroFormProducto("modalFichaBody");
  try { if (document.getElementById("fichaResultado") && document.getElementById("fichaResultado").querySelector("#np-nombre")) document.getElementById("fichaResultado").innerHTML = ""; } catch (_) {}
  body.innerHTML = `
    <div class="ficha-producto tag-card" style="text-align:left;">
      <div class="titulo">${t("form.newProduct")}</div>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.barcodeLabel")}<br>
        <input id="np-barcode" type="text" placeholder="${t('form.barcodePlaceholder')}" ${inp}></label>
      <label style="display:block;margin-top:10px;font-size:14px;"><span data-i18n="common.name">Name</span><br>
        <input id="np-nombre" type="text" ${inp}></label>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.category")}<br>
        <input id="np-categoria" type="text" placeholder="${t('form.categoryPlaceholder')}" ${inp}></label>
      <label style="display:block;margin-top:10px;font-size:14px;">Product type<br>
        <select id="np-tipo-producto" ${inp}>
          <option value="normal">Normal</option>
          <option value="ticket">Ticket / Event</option>
          <option value="bar">Bar (count by serving)</option>
        </select></label>
      <div id="np-bar-wrap" style="display:none;margin-top:10px;">
        <div style="display:flex;gap:10px;">
          <label style="flex:1;font-size:14px;">Serving size (ml)<br><input id="np-serving-ml" type="number" min="1" step="1" value="50" ${inp}></label>
          <label style="flex:1;font-size:14px;">Bottle size (ml)<br><input id="np-botella-ml" type="number" min="1" step="1" value="750" ${inp}></label>
        </div>
        <p style="font-size:13px;color:var(--ink-soft);margin:6px 0 0;">Stock is counted in servings. 1 bottle (750 ml) ≈ 15 servings at 50 ml.</p>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <label style="flex:1;font-size:14px;">${t("form.salePrice")}<br>
          <input id="np-precio" type="number" min="0" step="0.01" ${inp}></label>
        <label style="flex:1;font-size:14px;">${t("form.cost")}<br>
          <input id="np-costo" type="number" min="0" step="0.01" ${inp}></label>
      </div>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.initialStock")}<br>
        <input id="np-stock" type="number" min="0" step="1" value="0" ${inp}></label>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.supplier")}<br>
        <input id="np-proveedor" type="text" ${inp}></label>
      <label style="display:block;margin-top:10px;font-size:14px;">${t("form.photoAltaLabel")}<br>
        <input id="np-foto" type="file" accept="image/*" ${inp}></label>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <label style="flex:1;font-size:14px;">${t("form.relationType")}<br>
          <select id="np-tipo-proveedor" ${inp}>
            <option value="compra">${t("form.directPurchase")}</option>
            <option value="consignacion">${t("form.consignmentArtist")}</option>
          </select></label>
        <label style="flex:1;font-size:14px;">${t("form.shelfLabel")}<br>
          <select id="np-ubicacion" ${inp}>
            <option value="todas">${t("form.noShelf")}</option>
            ${perchasAlta.map(u => `<option value="${escHtml(u.id)}"${u.id === ubicacionActual ? " selected" : ""}>${escHtml(u.nombre)}</option>`).join("")}
          </select></label>
      </div>
      <div id="np-comision-wrap" style="display:none;margin-top:8px;">
        <label style="display:block;font-size:14px;">${t("form.artistCommissionPct")}<br>
          <input id="np-comision-pct" type="number" min="0" max="100" step="1" ${inp}></label>
      </div>
      <label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-size:15px;font-weight:700;">
        <input id="np-perecible" type="checkbox" style="width:20px;height:20px;"> <span>${t("form.expiresQ")}</span></label>
      <div id="np-fecha-wrap" style="display:none;margin-top:8px;">
        <label style="display:block;font-size:14px;">${t("form.expiryDate")}<br>
          <input id="np-fecha" type="date" ${inp}></label>
        <label style="display:block;margin-top:8px;font-size:14px;">${t("form.sellOrder")}<br>
          <select id="np-metodo" ${inp}>
            <option value="FIFO">${t("form.fifo")}</option>
            <option value="LIFO">${t("form.lifo")}</option>
          </select></label>
      </div>
      <div id="np-msg" style="font-size:14px;margin-top:10px;font-weight:700;"></div>
      <button class="ir" style="margin-top:12px;" onclick="crearProductoNuevo('')">${t("form.saveProduct")}</button>
    </div>`;
  document.getElementById("np-perecible").addEventListener("change", (e) => {
    document.getElementById("np-fecha-wrap").style.display = e.target.checked ? "block" : "none";
  });
  document.getElementById("np-tipo-proveedor").addEventListener("change", (e) => {
    document.getElementById("np-comision-wrap").style.display = e.target.value === "consignacion" ? "block" : "none";
  });
  const _npTipo2 = document.getElementById("np-tipo-producto");
  if (_npTipo2) _npTipo2.addEventListener("change", (e) => {
    const w = document.getElementById("np-bar-wrap");
    if (w) w.style.display = e.target.value === "bar" ? "block" : "none";
  });
  try { if (window.OCCategorias) window.OCCategorias.enganchar(document.getElementById("np-categoria")); } catch (_) {}
  /* Mismo borrador que el formulario de Escanear: son el MISMO alta con dos
     puertas de entrada, asi que comparten clave y lo empezado en una se
     recupera en la otra. */
  try {
    if (window.OCBorradores) {
      const _c = document.getElementById("np-nombre");
      if (_c) window.OCBorradores.enganchar(_c.closest(".ficha-producto"), "alta-producto", { msgId: "np-msg" });
    }
  } catch (_) {}
  modal.classList.add("activo");
}

document.getElementById("btnEscanear").addEventListener("click", ejecutarEscaneo);
document.getElementById("inputEscaner").addEventListener("keydown", (e) => {
  if (e.key === "Enter") ejecutarEscaneo();
});

// Destino de pintarFicha: "fichaResultado" (buscador de Vender) por defecto;
// "fichaModalBody" mientras el modal de Inventario esta abierto. Conmutado
// por abrirFichaDesdeInventario()/cerrar del modal y ejecutarEscaneo().
let fichaTargetActual = "fichaResultado";
function pintarFicha(p){
  // (2026-08-27) Se eliminó la caché _occoProductCache junto con la vista de
  // mostrador fullscreen; el botón 👁 ahora abre abrirCompradores(productoId).
  const contenedor = document.getElementById(fichaTargetActual) || document.getElementById("fichaResultado");
  contenedor.innerHTML = `
    <div class="ficha-producto tag-card">
      ${p.foto ? `<img src="${p.foto}" alt="" style="width:96px;height:96px;object-fit:cover;border-radius:8px;border:2px solid var(--sim-plata-dk,#8A9AAA);float:right;margin-left:10px;">` : ""}
      <div class="titulo">${escHtml(p.nombre)}</div>
      <div class="precio">${fmtMoney(p.precio)}</div>
      <div class="linea"><strong>SKU:</strong> ${escHtml(p.sku)}</div>
      <div class="linea"><strong>${t("ficha.code")}</strong> ${escHtml(p.barcode)}</div>
      <div class="linea"><strong>${t("ficha.supplier")}</strong> ${escHtml(p.proveedor)}</div>
      <div class="linea"><strong>${t("ficha.currentStock")}</strong> ${p.stockActual} ${t("ficha.units")}</div>
      ${p.tipoProducto === "bar" ? `<div class="linea" id="bar-servings-line"><strong>Servings per bottle:</strong> ≈ ${Math.max(1, Math.round((Number(p.botellaMl) || 750) / (Number(p.servingMl) || 50)))} (${escHtml(p.servingMl)} ml each)${(window.OCAuth && window.OCAuth.puedeGestionar && window.OCAuth.puedeGestionar()) ? `<button onclick="editarServings('${p.id}')" title="Adjust servings per bottle" style="font-size:12px;padding:2px 8px;margin-left:6px;background:#FFF6E5;border:1.5px solid #B8860B;border-radius:6px;color:#7a5510 !important;-webkit-text-fill-color:#7a5510 !important;cursor:pointer;">✏️</button>` : ""}</div>` : ""}
      ${p.perecible ? `<div class="linea"><strong>${t("ficha.expires")}</strong> ${escHtml(p.fechaCaducidad || t("ficha.noDate"))}${p.metodoCosteo ? ` · ${escHtml(p.metodoCosteo)}` : ""}</div>` : ""}
      <span class="badge-estado ${escHtml(p.estado)}">${escHtml(p.mensaje)}</span>
      <div class="acciones-rapidas">
        <button class="vender" onclick="abrirPanelVentaInfo('${p.id}', ${p.tipoProducto === "ticket" ? "true" : "false"})" ${p.stockActual === 0 ? "disabled" : ""}>${p.tipoProducto === "ticket" ? "Sell ticket/event" : t("ficha.sellOne")}</button>
        <button onclick="ajustar('${p.id}', 1)">+1 stock</button>
        <button onclick="ajustar('${p.id}', -1)">-1 stock</button>
        <button class="etiqueta" onclick="abrirEtiqueta('${p.id}')">${t("ficha.viewLabel")}</button>
      </div>
      <!-- "Compradores": visible para cualquier rol autenticado (encargado o dueño).
           Abre la lista de compradores de este producto (reemplaza a la antigua
           vista de mostrador fullscreen, JFC 2026-08-27). -->
      <div class="acciones-rapidas" style="margin-top:8px;">
        <button onclick="abrirCompradores({productoId:'${p.id}'})" style="background:var(--azul-oscuro,#1c3049);color:#fff;border-color:var(--azul-oscuro,#1c3049);">${t("customer.showBtn")}</button>
      </div>
      ${(window.OCAuth && window.OCAuth.puedeGestionar && window.OCAuth.puedeGestionar()) ? `<div class="acciones-rapidas" style="margin-top:8px;">
        <button onclick="mostrarFormEditarProducto('${p.id}')">${t("ficha.editBtn")}</button>
        <button style="border-color:var(--rojo);color:var(--rojo);" onclick="eliminarProductoUI('${p.id}', this)">${t("ficha.deleteBtn")}</button>
      </div>` : ""}
    </div>
    <div id="oc-transfer-banner"></div>
  `;
  if (p.estado === "rojo" || p.estado === "amarillo") cargarSugerenciaTransferencia(p.id);
}

// --- Inventario compartido (brote 2): "hay X unidades en [Local]" ---
// Pain point investigado: la queja más repetida en gestión multi-local es
// justo esta — un local se queda sin stock mientras el de al lado tiene de
// sobra, y nadie se entera hasta que el cliente ya se fue. Este banner
// cierra esa brecha en el momento exacto en que más importa: cuando el
// cajero ya está mirando el producto en rojo/amarillo.
async function cargarSugerenciaTransferencia(productoId){
  const cont = document.getElementById("oc-transfer-banner");
  if (!cont) return;
  // Reforzado (JFC 2026-07-18): esto es solo un aviso informativo — si la red
  // falla aqui, mejor que el banner desaparezca en silencio a que reviente
  // toda la ficha del producto.
  let sugerencias;
  try {
    sugerencias = await (await fetch(`${API}/productos/${productoId}/sugerencias-transferencia`)).json();
  } catch (err) {
    console.error("[cargarSugerenciaTransferencia]", err);
    cont.innerHTML = "";
    return;
  }
  if (!sugerencias.length) { cont.innerHTML = ""; return; }
  cont.innerHTML = sugerencias.map(s => `
    <div class="tag-card" style="margin-top:10px;background:var(--azul-oscuro,#1c3049);color:#fff;padding:12px 14px;text-align:left;">
      <div style="font-size:14px;">📦 ${tf("transfer.available", {n: `<strong>${s.stockOrigen}</strong>`, loc: `<strong>${escHtml(s.desdeNombre)}</strong>`})}</div>
      <button class="ir" style="margin-top:8px;background:#fff;color:var(--azul-oscuro,#1c3049);border-color:#fff;" onclick="solicitarTransferencia('${s.productoOrigenId}','${s.productoDestinoId}',${s.cantidadSugerida},this)">${tf("transfer.request", {n: s.cantidadSugerida})}</button>
    </div>
  `).join("");
}

async function solicitarTransferencia(origenId, destinoId, cantidad, btn){
  btn.disabled = true;
  let res, r;
  try {
    res = await fetch(`${API}/transferencias`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productoOrigenId: origenId, productoDestinoId: destinoId, cantidad }) });
    r = await res.json();
  } catch (err) {
    console.error("[solicitarTransferencia]", err);
    btn.disabled = false;
    await ocAlert("Could not reach the server. The transfer was NOT requested. Check your connection and try again.");
    return;
  }
  if (!res.ok){ await ocAlert(r.error); btn.disabled = false; return; }
  btn.parentElement.innerHTML = `<div style="font-size:14px;">${t("transfer.requested")}</div>`;
}

const _ventasEnCurso = new Set(); // guard: evita ventas duplicadas por doble-tap
async function venderUno(id){
  if (_ventasEnCurso.has(id)) return;
  _ventasEnCurso.add(id);
  try {
    const sel = document.getElementById("ventaCliente");
    let res;
    try {
      res = await fetch(`${API}/productos/${id}/venta`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({cantidad:1, clienteId: (sel && sel.value) || undefined, info: infoEventoActivo()})
      });
    } catch (err) {
      // Reforzado (JFC 2026-07-18): esta es LA accion de venta mas frecuente
      // de toda la app (tocar un producto). Sin este catch, un fallo de red
      // hacia que el toque no hiciera nada visible — el cajero no sabia si
      // vendio o no. El lock (_ventasEnCurso) ya se libera con el finally
      // exterior; aqui solo se avisa claro.
      console.error("[venderUno]", err);
      await ocAlert("Could not reach the server. The sale was NOT recorded. Check your connection and try again.");
      return;
    }
    const data = await res.json();
    if (!res.ok){ await ocAlert(data.error); return; }
    pintarFicha(data.producto);
    if (data.ventaId) mostrarToastAnular(data.ventaId, id);
  } finally {
    _ventasEnCurso.delete(id);
  }
}

/* PANTALLA DE DATOS DE VENTA (portado de amigable-123, JFC 2026-08-26 —
   "homologa a lo mejor y más avanzado"). Al vender, se abre un modal que captura
   quién compró, cómo pagó y cuánto — opcional en productos normales, OBLIGATORIO
   en tipo ticket/evento (así cobra el negocio las reservaciones). El backend de
   friendly ya aceptaba `info`; solo faltaba esta captura en la UI. Injertado a
   mano (REGLA 1b), traducido a inglés (friendly es la app en inglés), reusando
   los helpers propios de friendly (pintarFicha/mostrarToastAnular/cargarGridVender). */
let _ventaInfoProductoCache = null;
async function abrirPanelVentaInfo(id, esTicket){
  let p, clientes = [];
  try { p = await (await fetch(`${API}/productos/${id}`)).json(); }
  catch (err) { console.error("[abrirPanelVentaInfo]", err); await ocAlert("Could not reach the server."); return; }
  try { clientes = await (await fetch(`${API}/clientes`)).json(); } catch (_) { clientes = []; }
  _ventaInfoProductoCache = p;
  const overlay = document.getElementById("oc-ventainfo-overlay");
  const caja = document.getElementById("oc-ventainfo-caja");
  const inp = 'style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:4px;"';
  const req = esTicket ? ' <span style="color:var(--rojo,#a3392a);">*</span>' : '';
  const esBar = p.tipoProducto === "bar";
  const _servPorBotella = esBar ? Math.max(1, Math.round((Number(p.botellaMl) || 750) / (Number(p.servingMl) || 50))) : 0;
  caja.innerHTML = `
    <div class="ficha-producto tag-card" style="text-align:left;background:var(--blanco-calido,#fbf5e8);">
      <div class="titulo" style="font-family:var(--font-display);font-size:17px;font-weight:700;">${esTicket ? "Sell ticket / event" : (esBar ? "Sell by serving" : "Sale details")} — ${escHtml(p.nombre)}</div>
      <p style="font-size:14px;color:var(--ink-soft);">${esTicket ? "This is a Ticket/Event product: these details are required." : (esBar ? "Count servings sold; the app tracks the bottle equivalent." : "Optional — only if you want to record who bought and how they paid.")}</p>
      ${esBar ? `
      <label style="display:block;margin-top:10px;font-size:14px;">Servings sold<br><input id="vi-servings" type="number" min="1" step="1" value="1" ${inp}></label>
      <p id="vi-botellas" style="font-size:13px;color:var(--ink-soft);margin:6px 0 0;"></p>` : ""}
      <label style="display:block;margin-top:10px;font-size:14px;">Customer<br>
        <div style="display:flex;gap:8px;align-items:center;margin-top:4px;">
          <select id="vi-cliente" size="1" style="flex:1;padding:8px;border:2px solid var(--azul-medio);border-radius:4px;">
            <option value="">Counter sale (no customer)</option>
            ${clientes.map(c => `<option value="${c.id}">${escHtml(c.nombre)} (${escHtml(c.codigo)})</option>`).join("")}
          </select>
          <button type="button" id="vi-nuevo-cliente" title="New customer"
            style="flex:0 0 auto;font-size:13px;font-weight:700;padding:8px 12px;border:2px solid var(--azul-medio,#2c4a68);border-radius:6px;background:var(--azul-medio,#2c4a68);color:#fbf5e8 !important;-webkit-text-fill-color:#fbf5e8 !important;cursor:pointer;">+ New</button>
        </div>
        <input id="vi-cliente-buscar" type="text" placeholder="Type to filter..." style="width:100%;padding:8px;margin-top:6px;border:2px solid var(--azul-medio);border-radius:4px;"></label>
      ${esTicket ? `
      <label style="display:block;margin-top:10px;font-size:14px;">Event/class date${req}<br><input id="vi-fecha" type="date" ${inp}></label>
      <label style="display:block;margin-top:10px;font-size:14px;">People in the reservation<br><input id="vi-personas" type="number" min="0" step="1" ${inp}></label>` : ""}
      <label style="display:block;margin-top:10px;font-size:14px;">Group / +1 (optional)
        <button type="button" id="vi-toggle-pagador" title="Add a group name or extra people (+1, +N)"
          style="margin-left:6px;font-size:13px;font-weight:700;padding:4px 9px;border:2px solid var(--azul-medio,#2c4a68);border-radius:6px;background:transparent;color:var(--azul-medio,#2c4a68);cursor:pointer;">✎</button>
        <input id="vi-pagador" type="text" placeholder="Group name or +N extra people" style="display:none;width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:4px;"></label>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <label style="flex:1;font-size:14px;">Email<br><input id="vi-email" type="email" ${inp}></label>
        <label style="flex:1;font-size:14px;">WhatsApp<br><input id="vi-whatsapp" type="text" ${inp}></label>
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;">
        <label style="flex:1;font-size:14px;">Payment method<br>
          <select id="vi-forma-pago" ${inp}><option value="">—</option><option value="cash">Cash</option><option value="transfer">Transfer</option><option value="card">Card</option><option value="other">Other</option></select></label>
        <label style="flex:1;font-size:14px;">Amount paid${req}<br><input id="vi-monto" type="number" min="0" step="0.01" ${inp}></label>
      </div>
      <label style="display:block;margin-top:10px;font-size:14px;">Notes (optional)<br><textarea id="vi-notas" rows="2" placeholder="Anything worth remembering about this sale..." ${inp}></textarea></label>
      <div id="vi-msg" style="font-size:14px;margin-top:10px;font-weight:700;"></div>
      <div class="acciones-rapidas" style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;">
        <button class="vender" onclick="confirmarVentaConInfo('${p.id}', ${esTicket ? "true" : "false"})">Confirm sale</button>
        <button onclick="cancelarPanelVentaInfo()">Cancel</button>
      </div>
    </div>`;
  overlay.style.display = "flex";
  const buscar = document.getElementById("vi-cliente-buscar");
  const selCli = document.getElementById("vi-cliente");
  buscar.addEventListener("input", () => {
    const q = buscar.value.trim().toLowerCase();
    [...selCli.options].forEach(o => { o.hidden = !!(q && o.value && !o.textContent.toLowerCase().includes(q)); });
  });
  buscar.focus();
  // JFC 2026-08-27: "+ New" en el panel de venta abre el mismo modal de nuevo
  // cliente; al crearlo se agrega al selector "abajo" y se selecciona.
  const btnNuevo = document.getElementById("vi-nuevo-cliente");
  if (btnNuevo) {
    btnNuevo.addEventListener("click", () => {
      window._ocNuevoClienteCb = null; // el handler de creacion ya agrega a vi-cliente
      if (window.ocAbrirNuevoCliente) window.ocAbrirNuevoCliente();
    });
  }
  // JFC 2026-08-27: "Payer's name" → lapicito opcional para +1/grupos. El ✎
  // muestra/oculta el campo de grupo; es opcional, nunca obligatorio.
  const btnPag = document.getElementById("vi-toggle-pagador");
  const inpPag = document.getElementById("vi-pagador");
  if (btnPag && inpPag) {
    btnPag.addEventListener("click", () => {
      inpPag.style.display = inpPag.style.display === "none" ? "block" : "none";
      if (inpPag.style.display !== "none") inpPag.focus();
    });
  }
  if (esBar) {
    const sInp = document.getElementById("vi-servings");
    const bEl = document.getElementById("vi-botellas");
    const actualizar = () => {
      const n = Math.max(1, Number(sInp.value) || 1);
      bEl.textContent = `${n} servings ≈ ${(n / _servPorBotella).toFixed(2)} bottles (${_servPorBotella} servings/bottle)`;
    };
    sInp.addEventListener("input", actualizar);
    actualizar();
  }
}
function cancelarPanelVentaInfo(){
  const overlay = document.getElementById("oc-ventainfo-overlay");
  if (overlay) overlay.style.display = "none";
  const caja = document.getElementById("oc-ventainfo-caja");
  if (caja) caja.innerHTML = "";
  _ventaInfoProductoCache = null;
}
async function confirmarVentaConInfo(id, esTicket){
  if (_ventasEnCurso.has(id)) return;
  const g = (x) => { const el = document.getElementById(x); return el ? el.value.trim() : ""; };
  /* Bar (JFC 2026-08-27): se vende por servings; cantidad = servings y se
     registra el equivalente en botellas en info. Stock se cuenta en servings. */
  const _pBar = _ventaInfoProductoCache;
  const _esBar = _pBar && _pBar.tipoProducto === "bar";
  const _servPorBotella = _esBar ? Math.max(1, Math.round((Number(_pBar.botellaMl) || 750) / (Number(_pBar.servingMl) || 50))) : 0;
  const _servings = _esBar ? Math.max(1, Number(g("vi-servings")) || 1) : 1;
  const info = {
    fechaEvento: g("vi-fecha"), numPersonas: g("vi-personas"), nombrePagador: g("vi-pagador"),
    email: g("vi-email"), whatsapp: g("vi-whatsapp"), formaPago: g("vi-forma-pago"), montoPagado: g("vi-monto"),
    notas: g("vi-notas"),
    ...(_esBar ? { servings: _servings, botellas: +(_servings / _servPorBotella).toFixed(2) } : {})
  };
  const msg = document.getElementById("vi-msg");
  if (esTicket && (!info.fechaEvento || !info.montoPagado)){
    msg.style.color = "var(--rojo,#a3392a)";
    msg.textContent = "For tickets/events you need: date and the amount paid.";
    return;
  }
  const clienteId = document.getElementById("vi-cliente").value || undefined;
  _ventasEnCurso.add(id);
  try {
    let res, data;
    try {
      res = await fetch(`${API}/productos/${id}/venta`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ cantidad: _esBar ? _servings : 1, clienteId, info })
      });
      data = await res.json();
    } catch (err) {
      console.error("[confirmarVentaConInfo]", err);
      msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = "Could not reach the server. The sale was NOT recorded.";
      return;
    }
    if (!res.ok){ msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = data.error; return; }
    cancelarPanelVentaInfo();
    if (document.getElementById(fichaTargetActual)) pintarFicha(data.producto);
    if (document.getElementById("gridVender")) cargarGridVender();
    if (document.getElementById("cierreDia") && document.getElementById("cierreDia").open) cargarCierreLista();
    if (data.ventaId) mostrarToastAnular(data.ventaId, id);
  } finally {
    _ventasEnCurso.delete(id);
  }
}

// Guarda el interval activo del toast para poder cancelarlo si llega un segundo
// toast antes de que expire el primero (evita que el interval huérfano borre el
// toast nuevo cuando llega a 0). Fix del bug detectado en code-review 2026-07-03.
let toastVentaIntervalo = null;
function mostrarToastAnular(ventaId, productoId){
  const cont = document.getElementById("oc-toast-venta");
  if (!cont) return;
  clearInterval(toastVentaIntervalo); // cancela el interval anterior si existía
  cont.innerHTML = `<div class="tag-card" style="position:fixed;left:16px;right:16px;bottom:calc(var(--nav-h,78px) + 16px);z-index:400;
    background:var(--azul-oscuro,#1c3049);color:var(--blanco-calido,#F8F9FB);padding:14px 16px;border-radius:8px;
    display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;" id="oc-toast-anular">
    <span>✓ Sold. Tap here to undo (disappears in 5s)</span>
    <strong id="oc-toast-cuenta">5s</strong>
  </div>`;
  let restante = 5;
  const el = document.getElementById("oc-toast-anular");
  const cuenta = document.getElementById("oc-toast-cuenta");
  toastVentaIntervalo = setInterval(() => {
    restante -= 1;
    if (cuenta) cuenta.textContent = restante + "s";
    if (restante <= 0) { clearInterval(toastVentaIntervalo); toastVentaIntervalo = null; cont.innerHTML = ""; }
  }, 1000);
  const intervalo = toastVentaIntervalo; // alias local para el click handler
  el.addEventListener("click", async () => {
    clearInterval(intervalo);
    cont.innerHTML = "";
    const res = await fetch(`${API}/ventas/${ventaId}/anular`, { method: "POST" });
    const data = await res.json();
    if (!res.ok){ await ocAlert(data.error); return; }
    pintarFicha(data.producto);
  });
}

async function ajustar(id, delta){
  let res, data;
  try {
    res = await fetch(`${API}/productos/${id}/ajustar`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({delta, motivo:"Ajuste manual desde panel"})
    });
    data = await res.json();
  } catch (err) {
    console.error("[ajustar]", err);
    await ocAlert("Could not reach the server. The adjustment was NOT recorded. Check your connection and try again.");
    return;
  }
  if (!res.ok){ await ocAlert(data.error); return; }
  pintarFicha(data);
}

// --- VISTA ETIQUETAS ---
async function cargarEtiquetas(){
  const grid = document.getElementById("gridEtiquetas");
  let productos;
  try {
    const res = await fetch(`${API}/productos?ubicacionId=${ubicacionActual}`);
    productos = await res.json();
  } catch (_) {
    grid.innerHTML = `<p>${window.t("err.labelsLoad")}</p>`;
    return;
  }
  if (!Array.isArray(productos)){
    grid.innerHTML = `<p>${window.t("err.labelsRead")}</p>`;
    return;
  }
  // Mismo patrón escHtml que el resto del archivo (pintarFicha, el log,
  // el escáner, la grilla de inventario) — esta era la última vista que
  // insertaba nombre/SKU crudos en innerHTML. XSS almacenado cerrado aquí.
  grid.innerHTML = productos.map(p => `
    <div class="etiqueta-card tag-card" onclick="abrirEtiqueta('${p.id}')">
      <div class="nombre-prod">${escHtml(p.nombre)}</div>
      <div class="precio-prod">${fmtMoney(p.precio)}</div>
      <div class="sku-prod">${escHtml(p.sku)}</div>
      ${p.perecible ? `<div style="font-size:13px;font-weight:700;color:var(--rust);margin-top:4px;">🕓 Perecible</div>` : ""}
    </div>
  `).join("");
}

async function abrirEtiqueta(id){
  // Reforzado (JFC 2026-07-18): sin este catch, un fallo de red aqui tiraba
  // una excepcion no atrapada y tocar "Ver etiqueta" no hacia nada visible.
  let res, data;
  try {
    res = await fetch(`${API}/productos/${id}/etiqueta`);
    data = await res.json();
  } catch (err) {
    console.error("[abrirEtiqueta]", err);
    await ocAlert("Could not reach the server. Check your connection and try again.");
    return;
  }
  const p = data.producto;
  // Guardamos la etiqueta activa para imprimirla en un iframe aislado (v2.0):
  // imprimir el documento completo con window.print() sacaba botones, la X y el
  // nav en el papel. Ahora el print se arma limpio, solo la etiqueta.
  window._etiquetaActual = { data, p };
  // Contenido imprimible — solo lo que aparece en papel (sin botón "Imprimir")
  document.getElementById("contenidoEtiqueta").innerHTML = `
    <button class="cerrar" id="cerrarModal2">✕</button>
    <h4>${escHtml(p.nombre)}</h4>
    <div class="precio-grande">${fmtMoney(p.precio)}</div>
    ${p.perecible && p.fechaCaducidad ? `<div style="font-size:13px;font-weight:700;color:var(--rust);">Vence: ${p.fechaCaducidad}</div>` : ""}
    <div class="codigo">${p.barcode}</div>
    <div class="barras" id="barrasClicable" style="cursor:pointer;position:relative;" title="Tap to print or save just the barcode">${data.barcodeSvg || ""}</div>
    <div style="font-size:13px;color:var(--azul-medio,#2c4a68);margin-top:-6px;">👆 Tap the barcode to print or save it alone</div>
    ${data.qrDataUrl ? `<img src="${data.qrDataUrl}" width="160" height="160" alt="Product QR code">
    <div style="font-size:13px; color:var(--azul-medio);">Scan to see the full record</div>` : ""}
  `;
  // Botón de impresión fuera de la etiqueta — no viaja al papel ni aparece en el preview
  const accionesEl = document.getElementById("oc-etiqueta-acciones");
  if (accionesEl) accionesEl.innerHTML = `<button class="imprimir" id="oc-print-completa">Imprimir etiqueta completa</button>`;
  document.getElementById("modalEtiqueta").classList.add("activo");
  document.getElementById("cerrarModal2").addEventListener("click", cerrarModalEtiqueta);
  document.getElementById("barrasClicable").addEventListener("click", (e) => mostrarMenuBarcode(e, data.barcodeSvg, p));
  document.getElementById("oc-print-completa").addEventListener("click", () => imprimirEtiquetaCompleta());
}

// v2.0 — Etiqueta completa impresa en iframe aislado: SOLO la etiqueta llega al
// papel (sin botones, sin nav). Diseño estándar de retail para PYMEs: nombre,
// precio, vencimiento (si aplica), código de barras Code128 escaneable con su
// número legible, y QR opcional a la ficha. Estética conservada (precio ámbar,
// tipografía display), pero autocontenida para imprimir en cualquier navegador.
function imprimirEtiquetaCompleta(){
  const cur = window._etiquetaActual;
  if (!cur || !cur.p) return;
  const { data, p } = cur;
  const nombre = escHtml(p.nombre || "");
  const precio = fmtMoney(p.precio);
  const barcode = escHtml(p.barcode || "");
  const exp = (p.perecible && p.fechaCaducidad)
    ? `<div class="exp">Vence: ${escHtml(p.fechaCaducidad)}</div>` : "";
  const qr = data.qrDataUrl
    ? `<div class="qr"><img src="${data.qrDataUrl}" alt="QR"><div class="qr-cap">Escanea para la ficha</div></div>` : "";
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>${nombre}</title><meta charset="utf-8"><style>
    @page { margin: 8mm; }
    *{ box-sizing:border-box; }
    body{ margin:0; font-family:"Space Grotesk","Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#0F1923; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .label{ width:300px; margin:0 auto; text-align:center; padding:16px 14px; border:1.5px solid #0F1923; border-radius:12px; }
    .name{ font-weight:700; font-size:18px; line-height:1.2; margin:0 0 2px; }
    .price{ font-weight:800; font-size:32px; color:#E86040; margin:6px 0; }
    .exp{ font-size:13px; font-weight:700; color:#C05000; margin:0 0 6px; }
    .barcode{ display:flex; justify-content:center; margin:10px 0 2px; }
    .barcode svg{ max-width:100%; height:auto; }
    .code{ font-family:"Courier New",monospace; font-size:14px; letter-spacing:3px; margin-top:2px; }
    .qr{ margin-top:10px; }
    .qr img{ width:120px; height:120px; }
    .qr-cap{ font-size:13px; color:#2E6278; margin-top:2px; }
  </style></head><body>
    <div class="label">
      <div class="name">${nombre}</div>
      <div class="price">${precio}</div>
      ${exp}
      <div class="barcode">${data.barcodeSvg || ""}</div>
      <div class="code">${barcode}</div>
      ${qr}
    </div>
  </body></html>`);
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  };
}

function mostrarMenuBarcode(e, svgBarcode, producto){
  document.getElementById("oc-menu-barcode")?.remove();
  const menu = document.createElement("div");
  menu.id = "oc-menu-barcode";
  menu.style.cssText = "position:fixed;z-index:10000;background:var(--blanco-calido,#F8F9FB);border:2px solid var(--sim-plata-dk,#8A9AAA);border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.35);padding:8px;display:flex;flex-direction:column;gap:4px;min-width:220px;";
  const rect = e.target.closest("#barrasClicable").getBoundingClientRect();
  menu.style.left = Math.max(8, rect.left) + "px";
  menu.style.top = (rect.bottom + 8) + "px";
  menu.innerHTML = `
    <button id="oc-mb-imprimir" style="text-align:left;padding:10px;border:none;background:transparent;border-radius:5px;cursor:pointer;font-size:14px;color:var(--ink,#211c14);">🖨️ Print barcode only</button>
    <button id="oc-mb-guardar" style="text-align:left;padding:10px;border:none;background:transparent;border-radius:5px;cursor:pointer;font-size:14px;color:var(--ink,#211c14);">💾 Save as image</button>
  `;
  document.body.appendChild(menu);
  const cerrar = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener("click", cerrar, true); } };
  setTimeout(() => document.addEventListener("click", cerrar, true), 0);

  document.getElementById("oc-mb-imprimir").addEventListener("click", () => {
    menu.remove();
    imprimirSoloBarcode(svgBarcode, producto);
  });
  document.getElementById("oc-mb-guardar").addEventListener("click", () => {
    menu.remove();
    guardarBarcodeComoImagen(svgBarcode, producto);
  });
}

function imprimirSoloBarcode(svgBarcode, producto){
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>${escHtml(producto.nombre)}</title><style>
    body{margin:0;padding:24px;text-align:center;font-family:sans-serif;}
    svg{max-width:100%;height:auto;}
    p{font-size:14px;margin-top:8px;letter-spacing:2px;}
  </style></head><body>${svgBarcode}<p>${producto.barcode}</p></body></html>`);
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1000);
  };
}

function guardarBarcodeComoImagen(svgBarcode, producto){
  const svgBlob = new Blob([svgBarcode], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const escala = 3;
    const canvas = document.createElement("canvas");
    canvas.width = img.width * escala;
    canvas.height = img.height * escala;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `barcode-${producto.sku || producto.barcode}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };
  img.src = url;
}

function cerrarModalEtiqueta(){
  document.getElementById("modalEtiqueta").classList.remove("activo");
}
document.getElementById("cerrarModal").addEventListener("click", cerrarModalEtiqueta);
document.getElementById("modalEtiqueta").addEventListener("click", (e) => {
  if (e.target.id === "modalEtiqueta") cerrarModalEtiqueta();
});

// --- VISTA ACTIVIDAD ---
async function cargarActividad(){
  // Microcirugia 12 (2026-07-08): fetch sin guard dejaba listaActividad en blanco.
  const cont = document.getElementById("listaActividad");
  let items;
  try {
    const res = await fetch(`${API}/actividad`);
    if (!res.ok) throw new Error(res.status);
    items = await res.json();
  } catch (_) {
    if (cont) cont.innerHTML = '<p style="font-size:14px;color:var(--ink-soft);">' + window.t("err.activityLoad") + '</p>';
    return;
  }
  if (items.length === 0){
    cont.innerHTML = `<p>No activity recorded yet in this session.</p>`;
    return;
  }
  // Fix 2026-07-08: antes se inyectaba JSON.stringify(it.detalle) SIN escapar —
  // XSS almacenado (un producto llamado "<img onerror=...>" ejecutaba al ver el
  // log). Ahora todo pasa por escHtml y el detalle se resume legible, no en JSON
  // crudo. Se agrega también quién hizo el movimiento (atribución multi-usuario).
  const resumenDetalle = (d) => {
    if (!d || typeof d !== 'object') return '';
    if (d.producto) return escHtml(d.producto);
    if (d.nombre) return escHtml(d.nombre);
    return escHtml(Object.values(d).filter(v => typeof v !== 'object').join(' · '));
  };
  cont.innerHTML = items.map(it => {
    const quien = (it.usuarioNombre && it.usuarioNombre !== 'Sistema')
      ? `<div style="font-size:13px;font-weight:700;color:var(--azul-medio,#2c4a68);">${escHtml(it.usuarioNombre)}</div>` : '';
    return `
    <div class="actividad-item">
      <div class="tipo">${escHtml(it.tipo)}</div>
      <div>${resumenDetalle(it.detalle)}</div>
      ${quien}
      <div style="color:var(--azul-medio);">${escHtml(new Date(it.fecha).toLocaleString())}</div>
    </div>`;
  }).join("");
}

// --- VISTA COMISIONES (reparto de comisiones a asociados/as) ---
// GESTION DE COMISIONISTAS / ASOCIADOS (portado y simplificado de amigable-123,
// JFC 2026-08-25). friendly NO tenia forma de AGREGAR comisionistas ni de ver su
// lista — solo mostraba el ranking y las liquidaciones. Sale para dueno Y admin
// (puedeGestionar). Es aditivo y autocontenido: no toca el reparto ni las
// liquidaciones existentes.
let _comisionistasCache = [];
async function renderComisionistas(){
  const cont = document.getElementById("listaComisionistas");
  if (!cont) return;
  const puede = !!(window.OCAuth && window.OCAuth.puedeGestionar && window.OCAuth.puedeGestionar());
  if (!puede) { cont.innerHTML = ""; return; } // staff: no gestiona comisionistas
  let lista = [];
  try { lista = await (await fetch(`${API}/promotoras`)).json(); } catch (_) { lista = []; }
  _comisionistasCache = (Array.isArray(lista) ? lista : []).slice().sort((a,b) => String(a.nombre||"").localeCompare(String(b.nombre||"")));
  const inp = (id, ph, extra) => `<input id="${id}" type="text" autocomplete="off" placeholder="${escHtml(ph)}" style="flex:1;min-width:130px;padding:9px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;${extra||''}">`;
  cont.innerHTML = `
    <div class="tag-card" style="text-align:left;margin-bottom:16px;">
      <h3 class="seccion" style="margin-top:0;font-size:15px;" data-i18n="comm.assoc.heading">${t("comm.assoc.heading")}</h3>
      <p style="font-size:13px;color:var(--ink-soft);margin:0 0 10px;" data-i18n="comm.assoc.intro">${t("comm.assoc.intro")}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <label style="font-size:13px;flex:2;min-width:160px;"><span data-i18n="common.name">${t("common.name")}</span><br>${inp("cmNombre", t("comm.assoc.namePh"),"width:100%;")}</label>
        <label style="font-size:13px;"><span data-i18n="comm.assoc.pct">${t("comm.assoc.pct")}</span><br><input id="cmComision" type="number" min="0" max="100" step="0.5" placeholder="e.g. 15" style="width:110px;padding:9px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;"></label>
        <label style="font-size:13px;">Monthly target ($)<br><input id="cmMeta" type="number" min="0" step="1" placeholder="e.g. 2000" style="width:130px;padding:9px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;"></label>
      </div>
      <label style="display:block;font-size:13px;margin-top:8px;">Origin<br>
        <select id="cmOrigen" style="padding:9px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;">
          <option value="libre">Free agent (brings their own people)</option>
          <option value="empleado">Employee / staff</option>
          <option value="proveedor">Supplier / artist</option>
        </select></label>
      <label style="display:block;font-size:13px;margin-top:8px;">Notes<br><input id="cmNotas" type="text" placeholder="Anything worth remembering..." style="width:100%;padding:9px;border:2px solid var(--azul-medio);border-radius:5px;font-size:14px;"></label>
      <details style="margin-top:8px;">
        <summary style="cursor:pointer;font-size:13px;font-family:var(--font-mono);color:var(--azul-medio,#2c4a68);font-weight:700;list-style:none;" data-i18n="comm.assoc.more">${t("comm.assoc.more")}</summary>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:8px;">
          ${inp("cmTelefono", t("comm.assoc.phone"))}
          ${inp("cmCedula", t("comm.assoc.id"))}
          ${inp("cmBanco", t("comm.assoc.bank"))}
          ${inp("cmCuenta", t("comm.assoc.account"))}
          ${inp("cmDireccion", t("comm.assoc.address"),"flex:2;min-width:160px;")}
        </div>
      </details>
      <div style="margin-top:10px;"><button class="ir" id="btnAltaComisionista" style="padding:10px 16px;" data-i18n="comm.assoc.addBtn">${t("comm.assoc.addBtn")}</button></div>
      <p id="cmMsg" style="font-size:14px;font-weight:700;margin:8px 0 0;"></p>
      <div class="tag-card" style="padding:8px 12px;display:flex;align-items:center;gap:10px;margin-top:14px;">
        <input id="cmBuscar" type="search" autocomplete="off" placeholder="${escHtml(t("comm.assoc.searchPh"))}" style="flex:1;min-width:0;padding:9px 11px;font-size:14px;border:2px solid var(--azul-medio);border-radius:5px;">
      </div>
      <div id="cmLista" style="margin-top:10px;"></div>
    </div>`;
  const pintarLista = (q) => {
    const ql = String(q||"").trim().toLowerCase();
    const fil = _comisionistasCache.filter(p => !ql || String(p.nombre||"").toLowerCase().includes(ql) || String(p.telefono||"").toLowerCase().includes(ql) || String(p.cedula||"").toLowerCase().includes(ql));
    const el = document.getElementById("cmLista");
    if (!el) return;
    el.innerHTML = fil.length ? fil.map(p => `
      <div class="tag-card" id="cm-card-${escHtml(p.id)}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:8px;">
        <div style="flex:1;"><strong>${escHtml(p.nombre)}</strong>
          <div style="font-size:13px;color:var(--ink-soft);">${(Number(p.comision)||0)}%${p.metaMensual ? ` · target ${fmtMoney(p.metaMensual)}` : ''}${p.telefono?` · ${escHtml(p.telefono)}`:''}${p.origen ? ` · ${escHtml(p.origen)}` : ''}</div>
          ${p.notas ? `<div style="font-size:12px;color:var(--ink-soft);font-style:italic;">${escHtml(p.notas)}</div>` : ""}</div>
        <button data-cm-editar="${escHtml(p.id)}" style="font-size:13px;padding:6px 10px;border:2px solid var(--azul-medio,#2E6278);border-radius:5px;background:transparent;color:var(--azul-medio,#2E6278);cursor:pointer;">✎ Edit</button>
        <button data-cm-borrar="${escHtml(p.id)}" data-nombre="${escHtml(p.nombre)}" style="font-size:13px;padding:6px 10px;border:2px solid var(--rojo,#E8365D);border-radius:5px;background:transparent;color:var(--rojo,#E8365D);cursor:pointer;">${t("common.delete")}</button>
      </div>`).join("") : `<p style="font-size:14px;color:var(--ink-soft);">${t("comm.assoc.empty")}</p>`;
  };
  pintarLista("");
  const buscar = document.getElementById("cmBuscar");
  if (buscar) buscar.addEventListener("input", () => pintarLista(buscar.value));
  const btn = document.getElementById("btnAltaComisionista");
  if (btn) btn.addEventListener("click", async () => {
    const nombre = (document.getElementById("cmNombre").value||"").trim();
    const msg = document.getElementById("cmMsg");
    if (!nombre) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = t("comm.assoc.nameReq"); return; }
    const body = { nombre, comision: document.getElementById("cmComision").value,
      metaMensual: document.getElementById("cmMeta").value,
      origen: document.getElementById("cmOrigen").value,
      notas: document.getElementById("cmNotas").value,
      telefono: document.getElementById("cmTelefono").value, cedula: document.getElementById("cmCedula").value,
      banco: document.getElementById("cmBanco").value, cuenta: document.getElementById("cmCuenta").value,
      direccion: document.getElementById("cmDireccion").value };
    btn.disabled = true;
    try {
      const res = await fetch(`${API}/promotoras`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
      const r = await res.json();
      if (!res.ok) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = r.error || t("comm.assoc.addFail"); btn.disabled = false; return; }
      msg.style.color = "var(--verde,#2f7a4f)"; msg.textContent = t("comm.assoc.added");
      await renderComisionistas();
    } catch (_) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = t("comm.assoc.addFail"); btn.disabled = false; }
  });
  const elLista = document.getElementById("cmLista");
  if (elLista) elLista.addEventListener("click", async (e) => {
    const bEd = e.target.closest("[data-cm-editar]");
    if (bEd) { abrirEditorComisionista(bEd.dataset.cmEditar); return; }
    const b = e.target.closest("[data-cm-borrar]"); if (!b) return;
    if (!(await ocConfirm(tf("comm.assoc.delConfirm", {nombre: b.dataset.nombre})))) return;
    try { await fetch(`${API}/promotoras/${b.dataset.cmBorrar}`, { method:"DELETE" }); } catch (_) {}
    await renderComisionistas();
  });
}

// Editor de comisionista (JFC 2026-08-27, portado de amigable-123): edita
// nombre, %, meta mensual, tramos/escalas, datos de pago y notas. Inline en la
// tarjeta, mismo patrón que el editor de gasto/servings.
async function abrirEditorComisionista(id){
  const card = document.getElementById("cm-card-" + id);
  if (!card) return;
  let p;
  try { p = await (await fetch(`${API}/promotoras`)).json(); } catch (_) {}
  const pr = (Array.isArray(p) ? p : []).find((x) => x.id === id);
  if (!pr) return;
  const esc = (v) => escHtml(v == null ? "" : v);
  const tramos = (Array.isArray(pr.escalasComision) ? pr.escalasComision : []).slice().sort((a,b) => (a.desde||0)-(b.desde||0));
  card.innerHTML = `
    <div style="flex:1;min-width:0;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <input id="ce-nombre" value="${esc(pr.nombre)}" placeholder="Name" style="flex:2;min-width:140px;font-size:14px;padding:7px 9px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <label style="font-size:13px;">%<br><input id="ce-comision" type="number" min="0" max="100" step="0.5" value="${Number(pr.comision)||0}" style="width:80px;font-size:14px;padding:7px 9px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;"></label>
        <label style="font-size:13px;">Target ($)<br><input id="ce-meta" type="number" min="0" step="1" value="${Number(pr.metaMensual)||0}" style="width:110px;font-size:14px;padding:7px 9px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;"></label>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
        <input id="ce-telefono" value="${esc(pr.telefono)}" placeholder="Phone" style="flex:1;min-width:110px;font-size:13px;padding:6px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <input id="ce-cedula" value="${esc(pr.cedula)}" placeholder="ID" style="flex:1;min-width:90px;font-size:13px;padding:6px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <input id="ce-banco" value="${esc(pr.banco)}" placeholder="Bank" style="flex:1;min-width:110px;font-size:13px;padding:6px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <input id="ce-cuenta" value="${esc(pr.cuenta)}" placeholder="Account" style="flex:1;min-width:110px;font-size:13px;padding:6px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      </div>
      <input id="ce-notas" value="${esc(pr.notas)}" placeholder="Notes" style="width:100%;margin-top:6px;font-size:13px;padding:6px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <div style="margin-top:8px;">
        <div style="font-size:13px;font-weight:700;color:var(--azul-medio,#2c4a68);">Goal-based tiers (optional)</div>
        <div id="ce-tramos" style="margin-top:4px;"></div>
        <button id="ce-add-tramo" type="button" style="font-size:12px;padding:4px 10px;margin-top:6px;border:1.5px solid var(--azul-medio,#2E6278);border-radius:6px;background:transparent;color:var(--azul-medio,#2E6278);cursor:pointer;">+ Add tier</button>
      </div>
      <p id="ce-msg" style="font-size:13px;font-weight:700;margin:8px 0 0;"></p>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      <button id="ce-guardar" style="font-size:13px;font-weight:700;padding:7px 12px;background:#006B3C;border:1.5px solid #006B3C;border-radius:6px;color:#fff !important;-webkit-text-fill-color:#fff !important;cursor:pointer;">Save</button>
      <button id="ce-cancelar" style="font-size:13px;padding:7px 12px;background:#fff;border:1.5px solid var(--linea,#D7E0E8);border-radius:6px;color:var(--ink) !important;-webkit-text-fill-color:var(--ink) !important;cursor:pointer;">Cancel</button>
    </div>`;
  const tramosEl = document.getElementById("ce-tramos");
  const pintarTramos = () => {
    const filas = [...tramosEl.querySelectorAll("[data-tramo]")].map((f) => ({
      desde: Number(f.querySelector(".ce-t-desde").value) || 0,
      pct: Number(f.querySelector(".ce-t-pct").value) || 0,
    }));
    tramosEl.innerHTML = filas.map((t, i) => `
      <div data-tramo style="display:flex;gap:6px;align-items:center;margin-top:4px;">
        <span style="font-size:12px;color:var(--ink-soft);">from</span>
        <input class="ce-t-desde" type="number" min="0" step="1" value="${t.desde}" style="width:90px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <span style="font-size:12px;color:var(--ink-soft);">%</span>
        <input class="ce-t-pct" type="number" min="0" max="100" step="0.5" value="${t.pct}" style="width:80px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <button type="button" data-tramo-del style="font-size:12px;padding:3px 8px;border:1px solid #C0392B;border-radius:5px;background:transparent;color:#C0392B;cursor:pointer;">✕</button>
      </div>`).join("");
    tramosEl.querySelectorAll("[data-tramo-del]").forEach((b) => b.addEventListener("click", () => { b.closest("[data-tramo]").remove(); pintarTramos(); }));
  };
  tramosEl.innerHTML = tramos.map((t) => `
    <div data-tramo style="display:flex;gap:6px;align-items:center;margin-top:4px;">
      <span style="font-size:12px;color:var(--ink-soft);">from</span>
      <input class="ce-t-desde" type="number" min="0" step="1" value="${t.desde}" style="width:90px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <span style="font-size:12px;color:var(--ink-soft);">%</span>
      <input class="ce-t-pct" type="number" min="0" max="100" step="0.5" value="${t.pct}" style="width:80px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <button type="button" data-tramo-del style="font-size:12px;padding:3px 8px;border:1px solid #C0392B;border-radius:5px;background:transparent;color:#C0392B;cursor:pointer;">✕</button>
    </div>`).join("");
  tramosEl.querySelectorAll("[data-tramo-del]").forEach((b) => b.addEventListener("click", () => { b.closest("[data-tramo]").remove(); pintarTramos(); }));
  document.getElementById("ce-add-tramo").addEventListener("click", () => {
    const filas = [...tramosEl.querySelectorAll("[data-tramo]")];
    const ultimo = filas.length ? Number(filas[filas.length-1].querySelector(".ce-t-desde").value) || 0 : 0;
    tramosEl.insertAdjacentHTML("beforeend", `
      <div data-tramo style="display:flex;gap:6px;align-items:center;margin-top:4px;">
        <span style="font-size:12px;color:var(--ink-soft);">from</span>
        <input class="ce-t-desde" type="number" min="0" step="1" value="${ultimo + 500}" style="width:90px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <span style="font-size:12px;color:var(--ink-soft);">%</span>
        <input class="ce-t-pct" type="number" min="0" max="100" step="0.5" value="" style="width:80px;font-size:13px;padding:5px 7px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
        <button type="button" data-tramo-del style="font-size:12px;padding:3px 8px;border:1px solid #C0392B;border-radius:5px;background:transparent;color:#C0392B;cursor:pointer;">✕</button>
      </div>`);
    tramosEl.querySelectorAll("[data-tramo-del]").forEach((b) => b.addEventListener("click", () => { b.closest("[data-tramo]").remove(); pintarTramos(); }));
  });
  document.getElementById("ce-cancelar").addEventListener("click", () => renderComisionistas());
  document.getElementById("ce-guardar").addEventListener("click", async () => {
    const msg = document.getElementById("ce-msg");
    const nombre = document.getElementById("ce-nombre").value.trim();
    if (!nombre) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = "A name is required."; return; }
    const escalas = [...tramosEl.querySelectorAll("[data-tramo]")].map((f) => ({
      desde: Number(f.querySelector(".ce-t-desde").value) || 0,
      pct: Number(f.querySelector(".ce-t-pct").value) || 0,
    })).filter((e) => e.pct > 0);
    const body = {
      nombre, comision: document.getElementById("ce-comision").value,
      metaMensual: document.getElementById("ce-meta").value, escalasComision: escalas,
      telefono: document.getElementById("ce-telefono").value, cedula: document.getElementById("ce-cedula").value,
      banco: document.getElementById("ce-banco").value, cuenta: document.getElementById("ce-cuenta").value,
      notas: document.getElementById("ce-notas").value,
    };
    try {
      const res = await fetch(`${API}/promotoras/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const r = await res.json();
      if (!res.ok) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = r.error || "Could not save."; return; }
      msg.style.color = "var(--verde,#2f7a4f)"; msg.textContent = "Saved.";
      setTimeout(() => renderComisionistas(), 500);
    } catch (_) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = "Could not reach the server."; }
  });
}

// GASTOS (2026-08-27): registrar gastos individuales y ver gastos vs ingresos.
// El resumen muestra: total gastos del mes, ingresos (ventas) del mes y neto.
let _gastosCache = [];
async function cargarGastos(){
  const cont = document.getElementById("listaGastos");
  const resumen = document.getElementById("gastosResumen");
  const fechaEl = document.getElementById("gastoFecha");
  if (fechaEl && !fechaEl.value) fechaEl.value = new Date().toISOString().slice(0, 10);
  let data;
  try { data = await (await fetch(`${API}/gastos`)).json(); }
  catch (_) { if (cont) cont.innerHTML = '<p style="font-size:14px;color:var(--rojo,#a3392a);">Could not load expenses. Reload the view.</p>'; return; }
  const gastos = (data && data.gastos) || [];
  // Ingresos del mes (ventas) para el neto.
  let ventasMes = 0;
  try {
    const dash = await (await fetch(`${API}/dashboard?ubicacionId=${ubicacionActual}`)).json();
    ventasMes = (dash && dash.resumenMes && dash.resumenMes.ventas) || 0;
  } catch (_) {}
  const totalGastos = gastos.reduce((a, g) => a + (Number(g.monto) || 0), 0);
  /* Enriquecimiento (JFC 2026-08-28): separar "este mes" de "todo el tiempo" y
     que el neto compare el MISMO periodo (ventas del mes − gastos del mes).
     Antes el neto mezclaba gastos de todo el tiempo con ventas del mes, un
     número engañoso. */
  const _mesActual = (() => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); })();
  const gastosMes = gastos.filter((g) => String(g.fecha || "").slice(0, 7) === _mesActual).reduce((a, g) => a + (Number(g.monto) || 0), 0);
  const neto = ventasMes - gastosMes;
  const tarjeta = (label, valor, color) => `<div style="flex:1;min-width:120px;background:#FFFFFF;border:2px solid var(--linea,#D7E0E8);border-radius:10px;padding:12px 14px;">
    <div style="font-size:13px;color:var(--ink-soft);">${label}</div>
    <div style="font-size:20px;font-weight:700;color:${color};">${fmtMoney(valor)}</div></div>`;
  /* Gating por rol (JFC 2026-08-27): dueño/admin/contador ven ingresos y neto;
     el encargado/clerk ve SOLO gastos, para no exponer la ganancia del negocio. */
  const _rolG = (window.OCAuth && window.OCAuth.rolActual) ? window.OCAuth.rolActual() : "";
  const _verIngresos = _rolG === "dueno" || _rolG === "admin" || _rolG === "contador";
  if (resumen) resumen.innerHTML =
    tarjeta("Expenses this month", gastosMes, "#C0392B") +
    tarjeta("Expenses (all time)", totalGastos, "#C0392B") +
    (_verIngresos
      ? tarjeta("Sales this month", ventasMes, "#006B3C") +
        tarjeta("Net", neto, neto >= 0 ? "#006B3C" : "#C0392B")
      : "");
  cargarCajaChica();
  if (!gastos.length) { if (cont) cont.innerHTML = '<p style="font-size:14px;color:var(--ink-soft);">No expenses recorded yet. Add the first one above.</p>'; return; }
  _gastosCache = gastos;
  const _puedeEditarGasto = _rolG === "dueno" || _rolG === "admin" || _rolG === "contador";
  if (cont) cont.innerHTML = gastos.map((g) => `
    <div class="tag-card" id="gasto-fila-${g.id}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:8px;">
      <div style="flex:1;">
        <strong style="font-size:15px;">${escHtml(g.concepto)}</strong>
        <div style="font-size:13px;color:var(--ink-soft);">${new Date(g.fecha).toLocaleDateString()}${g.usuarioNombre ? " · " + escHtml(g.usuarioNombre) : ""}</div>
      </div>
      <strong style="color:#C0392B;font-size:16px;">-${fmtMoney(g.monto)}</strong>
      ${_puedeEditarGasto ? `<button onclick="editarGasto('${g.id}')" title="Edit this expense" style="font-size:13px;padding:3px 8px;background:#FFF6E5;border:1.5px solid #B8860B;border-radius:6px;color:#7a5510 !important;-webkit-text-fill-color:#7a5510 !important;cursor:pointer;">✏️</button>` : ""}
      ${_puedeEditarGasto ? `<button onclick="anularGasto('${g.id}')" title="Delete this expense" style="font-size:13px;padding:3px 8px;background:#FDECEA;border:1.5px solid #C0392B;border-radius:6px;color:#C0392B !important;-webkit-text-fill-color:#C0392B !important;cursor:pointer;">✕</button>` : ""}
    </div>`).join("");
}
async function registrarGasto(){
  const conceptoEl = document.getElementById("gastoConcepto");
  const montoEl = document.getElementById("gastoMonto");
  const fechaEl = document.getElementById("gastoFecha");
  const msg = document.getElementById("gastoMsg");
  const concepto = (conceptoEl.value || "").trim();
  const monto = Number(montoEl.value);
  if (!concepto) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = "Enter a description for the expense."; return; }
  if (!Number.isFinite(monto) || monto <= 0) { msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = "Enter a valid amount."; return; }
  const res = await fetch(`${API}/gastos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ concepto, monto, fecha: fechaEl.value ? new Date(fechaEl.value).toISOString() : undefined, ubicacionId: ubicacionActual }) });
  if (!res.ok) { const r = await res.json().catch(() => ({})); msg.style.color = "var(--rojo,#a3392a)"; msg.textContent = r.error || "Could not save the expense."; return; }
  conceptoEl.value = ""; montoEl.value = "";
  msg.style.color = "var(--sim-verde-dk,#1a6e3c)"; msg.textContent = "Expense recorded.";
  cargarGastos();
}
async function anularGasto(id){
  if (!(await ocConfirm("Delete this expense? It stays in the activity log."))) return;
  await fetch(`${API}/gastos/${id}`, { method: "DELETE" });
  cargarGastos();
}
// CAJA CHICA en Gastos (JFC 2026-08-27): movida desde el modal de percha.
// Solo dueño/admin. Selector de percha + saldo + ingreso/retiro.
let _cajaChicaPerchaActual = "";
async function cargarCajaChica(){
  const bloque = document.getElementById("cajaChicaBloque");
  if (!bloque) return;
  const _rol = (window.OCAuth && window.OCAuth.rolActual) ? window.OCAuth.rolActual() : "";
  const _puede = _rol === "dueno" || _rol === "admin";
  if (!_puede) { bloque.style.display = "none"; return; }
  bloque.style.display = "";
  const sel = document.getElementById("cajaChicaPercha");
  let perchas = [];
  try { perchas = await (await fetch(`${API}/ubicaciones`)).json(); } catch (_) {}
  if (!Array.isArray(perchas)) perchas = [];
  const actual = _cajaChicaPerchaActual || (perchas[0] && perchas[0].id) || "";
  sel.innerHTML = perchas.map(u => `<option value="${escHtml(u.id)}">${escHtml(u.nombre)}</option>`).join("");
  if (actual) sel.value = actual;
  _cajaChicaPerchaActual = sel.value;
  pintarSaldoCajaChicaGastos(sel.value);
}
async function pintarSaldoCajaChicaGastos(perchaId){
  const el = document.getElementById("cajaChicaSaldo");
  if (!el || !perchaId) { if (el) el.textContent = ""; return; }
  try {
    const info = await (await fetch(`${API}/ubicaciones/${encodeURIComponent(perchaId)}/caja-chica`)).json();
    const saldo = (info && info.saldo) || 0;
    el.textContent = fmtMoney(saldo);
    el.style.color = saldo < 0 ? "#C0392B" : "var(--ink)";
  } catch (_) { el.textContent = ""; }
}
async function moverCajaChicaGastos(tipo){
  const perchaId = document.getElementById("cajaChicaPercha").value;
  if (!perchaId) return;
  const monto = parseFloat((await ocPrompt(`Amount (${tipo === "ingreso" ? "cash in" : "cash out"}) ($):`, "") || "").trim());
  if (!(monto > 0)) return;
  const motivo = (await ocPrompt("Reason (required):", "") || "").trim();
  if (!motivo) return;
  if (!(await ocConfirm(`Record ${tipo === "ingreso" ? "cash in" : "cash out"} of ${fmtMoney(monto)}?`))) return;
  try {
    await fetch(`${API}/ubicaciones/${encodeURIComponent(perchaId)}/caja-chica/${tipo}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monto, motivo })
    });
    pintarSaldoCajaChicaGastos(perchaId);
  } catch (err) { console.error("[cajaChicaGastos]", err); }
}
(function(){
  const sel = document.getElementById("cajaChicaPercha");
  if (sel) sel.addEventListener("change", () => { _cajaChicaPerchaActual = sel.value; pintarSaldoCajaChicaGastos(sel.value); });
  const btnIn = document.getElementById("cajaChicaIngreso");
  if (btnIn) btnIn.addEventListener("click", () => moverCajaChicaGastos("ingreso"));
  const btnOut = document.getElementById("cajaChicaRetiro");
  if (btnOut) btnOut.addEventListener("click", () => moverCajaChicaGastos("retiro"));
})();
/* Edición inline de servings por botella (JFC 2026-08-27): cada negocio define
   su propia medida de trago. El lapicito de la ficha de un producto bar convierte
   la línea en inputs de servingMl/botellaMl con Guardar/Cancelar. Solo dueño/admin
   (el encargado no ve el botón: el gating de rol está en el render de la ficha). */
async function editarServings(id){
  const fila = document.getElementById("bar-servings-line");
  if (!fila) return;
  let p;
  try { p = await (await fetch(`${API}/productos/${id}`)).json(); } catch (_) {}
  if (!p || !p.id) return;
  const serv = Number(p.servingMl) || 50, bot = Number(p.botellaMl) || 750;
  fila.innerHTML = `
    <strong>Servings per bottle:</strong>
    <span style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;">
      <input id="bs-serving" type="number" min="1" step="1" value="${serv}" title="Serving size (ml)" style="width:70px;font-size:13px;padding:4px 6px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <span style="font-size:12px;color:var(--ink-soft);">ml each</span>
      <input id="bs-botella" type="number" min="1" step="1" value="${bot}" title="Bottle size (ml)" style="width:70px;font-size:13px;padding:4px 6px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <span style="font-size:12px;color:var(--ink-soft);">ml bottle</span>
      <button id="bs-guardar" style="font-size:12px;font-weight:700;padding:4px 10px;background:#006B3C;border:1.5px solid #006B3C;border-radius:6px;color:#fff !important;-webkit-text-fill-color:#fff !important;cursor:pointer;">Save</button>
      <button id="bs-cancelar" style="font-size:12px;padding:4px 10px;background:#fff;border:1.5px solid var(--linea,#D7E0E8);border-radius:6px;color:var(--ink) !important;-webkit-text-fill-color:var(--ink) !important;cursor:pointer;">Cancel</button>
    </span>`;
  document.getElementById("bs-cancelar").addEventListener("click", () => pintarFicha(p));
  document.getElementById("bs-guardar").addEventListener("click", async () => {
    const servingMl = Math.max(1, Number(document.getElementById("bs-serving").value) || 50);
    const botellaMl = Math.max(1, Number(document.getElementById("bs-botella").value) || 750);
    try {
      const res = await fetch(`${API}/productos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ servingMl, botellaMl }) });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Could not save."); return; }
      pintarFicha(data);
    } catch (_) { alert("Could not reach the server. Check your connection and try again."); }
  });
}
/* Edición inline de un gasto (JFC 2026-08-27): el lapicito convierte la fila en
   inputs de concepto/monto/fecha con Guardar/Cancelar. Solo dueño/admin/contador
   (el encargado no ve el botón: el gating de rol está en el render). */
async function editarGasto(id){
  const g = (_gastosCache || []).find((x) => x.id === id);
  const fila = document.getElementById("gasto-fila-" + id);
  if (!g || !fila) return;
  const fecha = (g.fecha || "").slice(0, 10);
  fila.innerHTML = `
    <div style="flex:1;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
      <input id="ge-concepto" value="${escHtml(g.concepto)}" placeholder="Concept" style="flex:1;min-width:140px;font-size:13px;padding:6px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <input id="ge-monto" type="number" min="0" step="0.01" value="${Number(g.monto) || 0}" style="width:110px;font-size:13px;padding:6px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
      <input id="ge-fecha" type="date" value="${escHtml(fecha)}" style="font-size:13px;padding:6px 8px;border:1px solid var(--linea,#D7E0E8);border-radius:6px;">
    </div>
    <button id="ge-guardar" style="font-size:13px;font-weight:700;padding:6px 12px;background:#006B3C;border:1.5px solid #006B3C;border-radius:6px;color:#fff !important;-webkit-text-fill-color:#fff !important;cursor:pointer;">Save</button>
    <button id="ge-cancelar" style="font-size:13px;padding:6px 12px;background:#fff;border:1.5px solid var(--linea,#D7E0E8);border-radius:6px;color:var(--ink) !important;-webkit-text-fill-color:var(--ink) !important;cursor:pointer;">Cancel</button>`;
  document.getElementById("ge-cancelar").addEventListener("click", () => cargarGastos());
  document.getElementById("ge-guardar").addEventListener("click", async () => {
    const concepto = document.getElementById("ge-concepto").value.trim();
    const monto = Number(document.getElementById("ge-monto").value);
    const fechaVal = document.getElementById("ge-fecha").value;
    if (!concepto || !Number.isFinite(monto) || monto <= 0) return;
    await fetch(`${API}/gastos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ concepto, monto, fecha: fechaVal ? new Date(fechaVal).toISOString() : undefined }) });
    cargarGastos();
  });
}

// Matriz RFM de comisionistas (JFC 2026-08-27, portado de amigable-123).
// Clasifica a cada asociado en 4 cuadrantes según valor (ventas brutas del mes)
// y recencia (días sin vender). Segunda lectura del mismo ranking ya cargado.
function matrizComisionistasHtml(ranking){
  if (!Array.isArray(ranking) || !ranking.length) return "";
  const mediana = ranking.map(r => r.ventasBrutas || 0).sort((a,b) => a-b)[Math.floor(ranking.length/2)] || 0;
  const cuadrante = (r) => {
    const altoValor = (r.ventasBrutas || 0) >= mediana;
    const activo = (r.diasSinVenta == null || r.diasSinVenta < 7);
    if (altoValor && activo) return { k: "campeon", t: "Champions", c: "#006B3C", d: "High value, active. Protect and reward." };
    if (altoValor && !activo) return { k: "riesgo", t: "At risk", c: "#E86040", d: "High value but dormant. Re-engage now." };
    if (!altoValor && activo) return { k: "promesa", t: "Promising", c: "#2E6278", d: "Active but low value. Nurture to grow." };
    return { k: "dormido", t: "Dormant", c: "#8A8A8A", d: "Low value and inactive. Consider re-activating or releasing." };
  };
  const grupos = { campeon: [], riesgo: [], promesa: [], dormido: [] };
  ranking.forEach(r => grupos[cuadrante(r).k].push(r));
  const orden = [["campeon","Champions","#006B3C","High value, active. Protect and reward."],["riesgo","At risk","#E86040","High value but dormant. Re-engage now."],["promesa","Promising","#2E6278","Active but low value. Nurture to grow."],["dormido","Dormant","#8A8A8A","Low value and inactive. Consider re-activating or releasing."]];
  return `
    <h3 class="seccion" style="font-size:15px;margin-top:26px;">${t("comm.rfmHeading")}</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">
      ${orden.map(([k, titulo, color, desc]) => {
        const lista = grupos[k];
        return `<div style="border:2px solid ${color};border-radius:10px;padding:12px;background:#fff;">
          <div style="font-size:14px;font-weight:700;color:${color};">${titulo} <span style="font-weight:400;font-size:12px;">(${lista.length})</span></div>
          <div style="font-size:12px;color:var(--ink-soft);margin:2px 0 8px;">${desc}</div>
          ${lista.length ? lista.map(r => `<div style="font-size:13px;padding:3px 0;border-top:1px solid var(--linea,#E8E0D4);">${escHtml(r.nombre)} <span style="color:var(--ink-soft);">· ${fmtMoney(r.ventasBrutas)}${r.diasSinVenta != null ? ` · ${r.diasSinVenta}d` : ""}</span></div>`).join("") : `<div style="font-size:13px;color:var(--ink-soft);">—</div>`}
        </div>`;
      }).join("")}
    </div>`;
}

async function cargarComisiones(){
  try { renderComisionistas(); } catch (_) {}
  // Microcirugia 11 (2026-07-08): Promise.all sin guard dejaba Comisiones en blanco.
  const cont = document.getElementById("listaComisiones");
  let filas, ranking;
  try {
    [filas, ranking] = await Promise.all([
      fetch(`${API}/liquidaciones`).then(r => r.json()),
      fetch(`${API}/promotores/desempeno`).then(r => r.json()).catch(() => []),
    ]);
  } catch (_) {
    if (cont) cont.innerHTML = '<p style="font-size:14px;color:var(--rojo,#a3392a);">Could not load commissions. Reload the view.</p>';
    return;
  }
  // Rec 03: botón que arma el resumen del día y lo abre en WhatsApp listo.
  const btnWA = `<button class="ir" style="margin-bottom:16px;background:#25D366;color:#fff;border-color:#1da851;" onclick="enviarResumenWhatsApp()">${t("comm.sendWhatsappDaily")}</button>`;
  // Exportar comisiones a CSV (2026-08-27, portado de amigable-123): descarga
  // un CSV con el desglose por percha del mes. El dueño lo puede abrir en
  // Excel/Sheets o mandarlo al contador.
  const btnExport = `<button class="ir" style="margin-bottom:16px;background:#2C3E50;color:#fff;border-color:#0F1923;" onclick="exportarComisionesCSV()">⬇ Export CSV</button>`;

  if (filas.length === 0){
    cont.innerHTML = btnWA + `<p>You don't have shelves that generate commission yet (partner, franchise, or consignment). Create them in Inventory → Shelves.</p>`;
    return;
  }

  // Rec 04 + 09: ranking de asociados/as con su mejor SKU y alerta de dormido.
  const rankHtml = (Array.isArray(ranking) && ranking.length) ? `
    <h3 class="seccion" style="font-size:15px;margin-top:0;">${t("comm.rankingHeading")}</h3>
    <div style="margin-bottom:20px;">${ranking.map((r, i) => {
      const med = ["🥇","🥈","🥉"][i] || `${i + 1}.`;
      const dormido = (r.diasSinVenta != null && r.diasSinVenta >= 7)
        ? `<span class="badge-estado rojo" style="margin-left:8px;font-size:13px;">dormant ${r.diasSinVenta}d</span>` : "";
      const top = r.topSku ? ` · top SKU: ${escHtml(r.topSku.sku)} (${r.topSku.unidades}u)` : "";
      return `<div class="tag-card" style="display:flex;align-items:center;gap:12px;padding:12px 14px;margin-bottom:8px;">
        <span style="font-size:20px;line-height:1;">${med}</span>
        <div style="flex:1;"><strong>${escHtml(r.nombre)}</strong>${dormido}
          <div style="font-size:13px;color:var(--ink-soft);">${r.ventasCount} sold · gross ${fmtMoney(r.ventasBrutas)}${top}</div></div>
        <strong style="color:var(--verde,#2f7a4f);font-size:17px;">${fmtMoney(r.comision)}</strong>
      </div>`;
    }).join("")}</div>` : "";

  // MEJORA 1 — Termómetro de meta animado.
  // Genera HTML de barra + etiqueta de color según el % alcanzado.
  // Se llama dentro de cada card; la animación de relleno se dispara con
  // requestAnimationFrame una vez que el HTML está en el DOM.
  function termometroMeta(pct, meta) {
    if (pct == null || !meta) return "";
    const p = Math.min(pct, 150); // cap visual en 150%
    const color = pct >= 100 ? "#E8A020"   // dorado: meta alcanzada
                : pct >= 60  ? "#00C87A"   // verde: bien encaminada
                : pct >= 30  ? "#E86040"   // naranja: en riesgo
                :              "#C0392B";  // rojo: muy atrasada
    const etiqueta = pct >= 100 ? "Target reached!" : `${pct}% of target`;
    return `
      <div style="margin-top:10px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:${color};margin-bottom:4px;">
          <span>Monthly target: ${fmtMoney(meta)}</span><span>${etiqueta}</span>
        </div>
        <div style="background:#e8e0d4;border-radius:6px;height:10px;overflow:hidden;">
          <div class="oc-thermo-fill" data-pct="${p}" style="height:100%;width:0%;background:${color};border-radius:6px;transition:width 0.7s cubic-bezier(.4,0,.2,1);"></div>
        </div>
      </div>`;
  }

  // MEJORA 2 — Simulador "¿qué pasa si?" por percha.
  // Slider de ventas proyectadas → recalcula comisión y neto en tiempo real.
  // El % de comisión base viene de comisionSocio/ventasBrutas (real); si no hay
  // ventas usa el porcentaje configurado en la percha (campo pctBase).
  function simuladorHtml(f) {
    const pctReal = f.ventasBrutas > 0
      ? (f.comisionSocio / f.ventasBrutas)
      : (f.pctBase || 0) / 100;
    const max = Math.max(f.metaMensual || 500, f.ventasBrutas * 2, 500);
    const uid = f.ubicacionId.replace(/[^a-z0-9]/gi, "");
    return `
      <details style="margin-top:10px;">
        <summary style="font-size:14px;font-weight:700;cursor:pointer;color:var(--azul-medio,#2c4a68);user-select:none;">What if I sell more? →</summary>
        <div style="padding:10px 0 4px;">
          <label style="font-size:13px;">Projected sales: <strong id="sim-lbl-${uid}">${fmtMoney(f.ventasBrutas)}</strong></label><br>
          <input type="range" id="sim-rng-${uid}"
            min="0" max="${Math.round(max)}" step="5" value="${Math.round(f.ventasBrutas)}"
            style="width:100%;margin:6px 0 4px;accent-color:#E8A020;"
            oninput="(function(v){
              var com=(v*${pctReal.toFixed(4)});
              var neto=v-com;
              document.getElementById('sim-lbl-${uid}').textContent=fmtMoney(v);
              document.getElementById('sim-com-${uid}').textContent=fmtMoney(com);
              document.getElementById('sim-net-${uid}').textContent=fmtMoney(neto);
            })(+this.value)">
          <div style="display:flex;gap:16px;font-size:14px;margin-top:4px;">
            <span>Promoter commission: <strong id="sim-com-${uid}" style="color:#C0392B;">${fmtMoney(f.comisionSocio)}</strong></span>
            <span>Your net: <strong id="sim-net-${uid}" style="color:#009A5A;">${fmtMoney(f.netoDueno)}</strong></span>
          </div>
        </div>
      </details>`;
  }

  // #19: cacheamos el desglose pendiente por ubicacion para que, al marcar pagado,
  // el recibo de WhatsApp liste DE QUE ventas exactas es el pago (no un total suelto).
  window._ocLiqDet = {};
  filas.forEach(f => { window._ocLiqDet[f.ubicacionId] = f.detallePendientes || []; });

  /* CORREGIR EL PORCENTAJE EN RETROSPECTIVA (P1: portado de amigable-123).
     El % se congelaba al vender; corregirlo obligaba a anular ventas reales,
     o sea ensuciar el historial para arreglar un dato. Ahora se recalcula el
     reparto del mes y queda constancia: una correccion SE SUMA, no reemplaza.
     Los dos campos se espejan; imposible dejar un reparto que no suma 100. */
  function editorComisionHtml(f){
    if (!f.ventasBrutas) return "";
    const uid = f.ubicacionId.replace(/[^a-z0-9]/gi, "");
    const actual = f.pctEfectivo != null ? f.pctEfectivo : (f.pctBase || 0);
    return `
      <details style="margin-top:10px;">
        <summary style="font-size:14px;font-weight:700;cursor:pointer;color:var(--rust,#E86040);user-select:none;">Was the percentage wrong? Fix it →</summary>
        <div style="padding:10px 0 4px;">
          <p style="font-size:13px;color:var(--ink-soft);margin:0 0 8px;">Recalculates the split for this month's sales on this shelf. The sale, the product and the stock stay the same — only the split changes. There's a record of what it said before.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
            <label style="font-size:13px;flex:1;min-width:120px;">Associate takes (%)<br>
              <input type="number" id="cor-aso-${uid}" min="0" max="100" step="0.5" value="${actual}" data-no-borrador="1"
                style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:4px;"></label>
            <label style="font-size:13px;flex:1;min-width:120px;">House keeps (%)<br>
              <input type="number" id="cor-casa-${uid}" min="0" max="100" step="0.5" value="${(100 - actual).toFixed(2).replace(/\.?0+$/, "")}" data-no-borrador="1"
                style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:4px;"></label>
          </div>
          <label style="display:block;font-size:13px;margin-top:8px;">Why the correction (saved for the record)<br>
            <input type="text" id="cor-mot-${uid}" maxlength="200" placeholder="e.g. deal was 85/15, typed backwards" data-no-borrador="1"
              style="width:100%;padding:8px;margin-top:4px;border:2px solid var(--azul-medio);border-radius:4px;"></label>
          <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px;">
            <input type="checkbox" id="cor-todas-${uid}" style="width:18px;height:18px;">
            Also fix the ones I already marked as paid this month</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <button type="button" data-corregir="${escHtml(f.ubicacionId)}" data-uid="${uid}" data-nombre="${escHtml(f.ubicacion)}"
              style="font-size:14px;padding:8px 14px;border-color:var(--rust,#E86040);color:var(--rust,#E86040);">Apply fix</button>
          </div>
          <p id="cor-msg-${uid}" style="font-size:13px;font-weight:700;margin:8px 0 0;"></p>
        </div>
      </details>`;
  }
  const cardsHtml = filas.map(f => {
    const dormida = (f.diasSinVenta != null && f.diasSinVenta >= 7)
      ? `<span class="badge-estado rojo" style="font-size:13px;">dormant ${f.diasSinVenta}d</span>` : "";
    return `
    <div class="tag-card" style="text-align:left;margin-bottom:12px;padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <strong style="font-size:16px;">${escHtml(f.ubicacion)}</strong>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${dormida}<span class="badge-estado ${f.estado === "pagado" ? "verde" : f.estado === "sin ventas" ? "amarillo" : "rojo"}">${({ "sin ventas": "no sales", "pagado": "paid", "pendiente": "pending" })[f.estado] || f.estado}</span></div>
      </div>
      ${f.promotorNombre ? `<div style="font-size:13px;color:var(--ink-soft);margin-top:4px;">Promoter: <strong>${f.promotoraId ? `<a href="javascript:void(0)" data-abrir-promotora="${escHtml(f.promotoraId)}" style="color:var(--azul-medio,#2c4a68);text-decoration:underline;cursor:pointer;">${escHtml(f.promotorNombre)}</a>` : escHtml(f.promotorNombre)}</strong></div>` : ""}
      ${f.origenComision === "comisionista" ? `<div style="font-size:12px;color:var(--ink-soft);margin-top:2px;">Using the commission agent's own deal (${f.pctBase}%).</div>` : (f.promotorNombre ? `<div style="font-size:12px;color:var(--ink-soft);margin-top:2px;">Using this shelf's standard commission.</div>` : "")}
      <table style="width:100%;margin-top:10px;font-size:14px;">
        <tr><td>Monthly sales</td><td style="text-align:right;">${fmtMoney(f.ventasBrutas)}</td></tr>
        ${f.contribFija ? `<tr><td>Fixed contribution</td><td style="text-align:right;">-${fmtMoney(f.contribFija)}</td></tr>` : ""}
        <tr><td><strong>Associate takes</strong> <span style="color:var(--ink-soft);font-weight:400;">(${f.pctEfectivo != null ? f.pctEfectivo : (f.pctBase || 0)}%)</span></td><td style="text-align:right;"><strong>${fmtMoney(f.comisionSocio)}</strong></td></tr>
        <tr><td>House keeps <span style="color:var(--ink-soft);">(${f.pctEfectivo != null ? (100 - f.pctEfectivo).toFixed(2).replace(/\.00$/,"") : (f.pctQuedaEnCasa || 0)}%)</span></td><td style="text-align:right;">${fmtMoney(f.netoDueno)}</td></tr>
      </table>
      ${(f.avisosTrato && f.avisosTrato.length) ? f.avisosTrato.map(a => `<p style="font-size:12px;color:var(--rust,#E86040);margin:6px 0 0;">${escHtml(a)}</p>`).join("") : ""}
      ${f.ventasCorregidas ? `<p style="font-size:13px;color:var(--rust,#E86040);font-weight:700;margin:6px 0 0;">${f.ventasCorregidas} sale(s) this month have the percentage manually corrected.</p>` : ""}
      ${editorComisionHtml(f)}
      ${(f.detallePendientes && f.detallePendientes.length) ? `
      <details style="margin-top:8px;">
        <summary style="font-size:14px;font-weight:700;cursor:pointer;color:var(--azul-medio,#2c4a68);user-select:none;">Which sales does this payment cover? →</summary>
        <table style="width:100%;margin-top:6px;font-size:14px;">
          ${f.detallePendientes.map(d => `<tr><td>${d.cantidad}× ${escHtml(d.producto)}</td><td style="text-align:right;">${fmtMoney(d.comisionSocio)}</td></tr>`).join("")}
        </table>
      </details>` : ""}
      ${termometroMeta(f.cumplimientoMeta, f.metaMensual)}
      ${simuladorHtml(f)}
      ${f.estado === "pendiente" ? `<button class="ir" style="margin-top:12px;background:var(--sim-verde,#00C87A);color:#fff;border-color:var(--sim-verde-dk,#009A5A);" onclick="marcarComisionPagada('${f.ubicacionId}','${escHtml(f.promotorNombre||'')}',${f.comisionSocio})">✓ Mark as paid (${f.ventasPendientes} sales)</button>` : ""}
    </div>`;
  }).join("");

  cont.innerHTML = btnWA + btnExport + rankHtml + cardsHtml + matrizComisionistasHtml(ranking);

  /* Los dos campos son el mismo numero visto al reves. Se espejan mientras se
     escribe: imposible dejar un reparto que no suma 100. */
  /* Clic en el nombre del promotor → abre el editor de comisionista (JFC 2026-08-27). */
  cont.querySelectorAll("[data-abrir-promotora]").forEach(a => {
    a.addEventListener("click", () => abrirEditorComisionista(a.dataset.abrirPromotora));
  });

  cont.querySelectorAll("[data-corregir]").forEach(btn => {
    const uid = btn.dataset.uid;
    const inAso = document.getElementById(`cor-aso-${uid}`);
    const inCasa = document.getElementById(`cor-casa-${uid}`);
    const msg = document.getElementById(`cor-msg-${uid}`);
    const limpio = (n) => Math.round(Math.max(0, Math.min(100, n)) * 100) / 100;
    if (inAso && inCasa) {
      let espejando = false;
      const espejo = (origen, destino) => origen.addEventListener("input", () => {
        if (espejando) return;
        const n = Number(origen.value);
        if (!Number.isFinite(n)) return;
        espejando = true;
        destino.value = String(limpio(100 - limpio(n)));
        espejando = false;
      });
      espejo(inAso, inCasa);
      espejo(inCasa, inAso);
    }
    btn.addEventListener("click", async () => {
      const pct = Number(inAso ? inAso.value : NaN);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        msg.style.color = "var(--rojo)"; msg.textContent = "The percentage must be between 0 and 100.";
        return;
      }
      const motivo = (document.getElementById(`cor-mot-${uid}`) || {}).value || "";
      const incluirPagadas = !!(document.getElementById(`cor-todas-${uid}`) || {}).checked;
      if (!(await ocConfirm(
        `This month's sales at "${btn.dataset.nombre}" will be split ` +
        `${pct}% for the associate and ${(100 - pct).toFixed(2).replace(/\.?0+$/, "")}% for the house.` +
        (incluirPagadas ? "\n\nIncluding the ones you already marked as paid." : "\n\nOnly the unpaid ones.") +
        "\n\nThere's a record of what they said before."))) return;
      btn.disabled = true;
      msg.style.color = "var(--ink-soft)"; msg.textContent = "Applying…";
      let res, data;
      try {
        res = await fetch(`${API}/ubicaciones/${btn.dataset.corregir}/comisiones-del-mes`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comisionPct: pct, motivo: motivo,
            quien: (window.OCAuth && window.OCAuth.rolActual) ? window.OCAuth.rolActual() : "",
            soloPendientes: !incluirPagadas }),
        });
        data = await res.json();
      } catch (err) {
        console.error("[corregirComision]", err);
        btn.disabled = false;
        msg.style.color = "var(--rojo)"; msg.textContent = "Could not reach the server. NOTHING was changed.";
        return;
      }
      if (!res.ok) {
        btn.disabled = false;
        msg.style.color = "var(--rojo)"; msg.textContent = data.error || "Could not apply the fix.";
        return;
      }
      msg.style.color = "var(--verde,#2f7a4f)";
      msg.textContent = `Done: ${data.corregidas} sale(s) fixed.`;
      setTimeout(() => cargarComisiones(), 900);
    });
  });

  // Animar termómetros después de que el HTML esté en el DOM.
  requestAnimationFrame(() => {
    document.querySelectorAll(".oc-thermo-fill").forEach(el => {
      el.style.width = (el.dataset.pct || 0) + "%";
    });
  });
}

// Rec 03: arma el resumen del día y lo abre en WhatsApp (wa.me, sin servidor).
// Ventas de hoy + comisiones pendientes + stock crítico. El dueño solo elige
// a quién enviarlo. La app le habla; no tiene que abrir nada más.
// Exportar comisiones a CSV (2026-08-27, portado de amigable-123). Descarga
// un archivo CSV con el desglose por percha del mes: percha, promotor, ventas,
// % asociado, comisión, % casa, neto, estado. Se abre en Excel/Sheets.
async function exportarComisionesCSV(){
  let filas;
  try { filas = await (await fetch(`${API}/liquidaciones`)).json(); }
  catch (_) { alert("Could not load commissions to export."); return; }
  if (!Array.isArray(filas) || !filas.length) { alert("No commissions to export yet."); return; }
  const esc = (s) => { s = String(s == null ? "" : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const cab = ["Rack","Promoter","Monthly sales","Associate %","Associate takes","House %","House keeps","Status"];
  const filasCSV = filas.map(f => [
    esc(f.ubicacion), esc(f.promotorNombre || ""),
    (f.ventasBrutas || 0).toFixed(2),
    (f.pctEfectivo != null ? f.pctEfectivo : (f.pctBase || 0)),
    (f.comisionSocio || 0).toFixed(2),
    (f.pctEfectivo != null ? (100 - f.pctEfectivo).toFixed(2) : (f.pctQuedaEnCasa || 0)),
    (f.netoDueno || 0).toFixed(2),
    esc(({ "sin ventas": "no sales", "pagado": "paid", "pendiente": "pending" })[f.estado] || f.estado)
  ].join(","));
  const csv = "\uFEFF" + cab.join(",") + "\n" + filasCSV.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "comisiones-" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function enviarResumenWhatsApp(){
  const [dash, liq] = await Promise.all([
    fetch(`${API}/dashboard?ubicacionId=${ubicacionActual}`).then(r => r.json()).catch(() => ({})),
    fetch(`${API}/liquidaciones`).then(r => r.json()).catch(() => []),
  ]);
  const rd = dash.resumenDia || {};
  const pend = (Array.isArray(liq) ? liq : []).filter(f => f.estado === "pendiente");
  const totalPend = pend.reduce((a, f) => a + (f.comisionSocio || 0), 0);
  const criticos = (dash.alertas || []).filter(a => a.estado === "rojo").slice(0, 3).map(a => a.mensaje);
  const L = ["*Daily summary — friendly-123*"];
  L.push(`Today's sales: ${fmtMoney(rd.entra || 0)} in ${rd.ventasCount || 0} sale(s).`);
  if (totalPend > 0) L.push(`Pending commissions: ${fmtMoney(totalPend)} (${pend.length} rack(s)).`);
  if (criticos.length){ L.push("Critical stock:"); criticos.forEach(c => L.push("• " + c)); }
  else L.push("No critical stock. Everything is fine.");
  window.open("https://wa.me/?text=" + encodeURIComponent(L.join("\n")), "_blank");
}

// Mejora #5 (JFC 2026-07-16): resumen SEMANAL por WhatsApp, ofrecido solo (no
// enviado en automático — no existe forma de mandar WhatsApp sin que el
// dueno lo confirme, wa.me siempre abre la app para que el humano toque
// enviar). Se ofrece como maximo una vez cada 7 dias, con un toast chico y
// descartable — nunca bloquea el flujo ni se repite el mismo dia.
async function enviarResumenSemanalWhatsApp(){
  const [dash, liq] = await Promise.all([
    fetch(`${API}/dashboard?ubicacionId=${ubicacionActual}`).then(r => r.json()).catch(() => ({})),
    fetch(`${API}/liquidaciones`).then(r => r.json()).catch(() => []),
  ]);
  const rs = dash.resumenSemana || {};
  const pend = (Array.isArray(liq) ? liq : []).filter(f => f.estado === "pendiente");
  const totalPend = pend.reduce((a, f) => a + (f.comisionSocio || 0), 0);
  const criticos = (dash.alertas || []).filter(a => a.estado === "rojo").slice(0, 5).map(a => a.mensaje);
  const L = [t("weekly.msgTitle")];
  L.push(tf("weekly.msgSales", { amount: fmtMoney(rs.entra || 0), count: rs.ventasCount || 0 }));
  if (totalPend > 0) L.push(tf("weekly.msgPending", { amount: fmtMoney(totalPend), count: pend.length }));
  if (criticos.length){ L.push(t("weekly.msgCritical")); criticos.forEach(c => L.push("• " + c)); }
  else L.push(t("weekly.msgNoCritical"));
  const mensaje = L.join("\n");
  if (navigator.share) { try { await navigator.share({ text: mensaje }); return; } catch (_) {} }
  // (2026-07-17) el resumen semanal es "para ti": si el dueno registro su
  // WhatsApp en Avanzado, se abre directo a su propio numero — cero pasos extra.
  const numPropio = (window.OCSecure && window.OCSecure.leerWhatsapp && String(window.OCSecure.leerWhatsapp() || "").replace(/\D/g, "")) || "";
  // Guard: sin numero registrado, wa.me abre picker de contactos — el resumen
  // podria acabar en el chat equivocado. Mejor avisar y abrir picker consciente.
  window.open("https://wa.me/" + (numPropio || "") + "?text=" + encodeURIComponent(numPropio ? mensaje : mensaje + "\n\n(" + t("weekly.noWhatsappHint") + ")"), "_blank");
}

function ofrecerResumenSemanalSiToca(){
  if (!window.OCAuth || window.OCAuth.rolActual() !== "dueno") return;
  if (window.OCAuth.esDemo && window.OCAuth.esDemo()) return;
  let ultimo = 0;
  try { ultimo = Number(localStorage.getItem("f123_resumen_semanal_ofrecido") || 0); } catch (_) {}
  if (Date.now() - ultimo < 7 * 86400000) return;
  // (2026-07-17) el sello de 'ya ofrecido' se guarda al RESPONDER, no al pintar —
  // si el toast falla, la oferta no se quema por 7 dias.
  const toast = document.createElement("div");
  toast.style.cssText = "position:fixed;bottom:16px;left:16px;right:16px;max-width:420px;margin:0 auto;background:#0F1923;border:2px solid #25D366;border-radius:10px;padding:14px 16px;z-index:9500;box-shadow:0 8px 30px #060d14;";
  toast.innerHTML = `<p style="color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;font-size:14px;margin:0 0 10px;font-weight:700;">${t("weekly.nudgeTitle")}</p>
    <div style="display:flex;gap:8px;">
      <button id="oc-resumen-sem-si" style="flex:1;min-height:44px;border:none;border-radius:7px;background:#25D366;color:#04210f !important;-webkit-text-fill-color:#04210f !important;font-weight:700;cursor:pointer;">${t("weekly.nudgeSend")}</button>
      <button id="oc-resumen-sem-no" style="min-height:44px;padding:0 14px;border:2px solid #5294AC;border-radius:7px;background:transparent;color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;cursor:pointer;">${t("weekly.nudgeNotNow")}</button>
    </div>`;
  document.body.appendChild(toast);
  toast.querySelector("#oc-resumen-sem-si").addEventListener("click", () => { try { localStorage.setItem("f123_resumen_semanal_ofrecido", String(Date.now())); } catch (_) {} enviarResumenSemanalWhatsApp(); toast.remove(); });
  toast.querySelector("#oc-resumen-sem-no").addEventListener("click", () => { try { localStorage.setItem("f123_resumen_semanal_ofrecido", String(Date.now())); } catch (_) {} toast.remove(); });
}
window.addEventListener("oc-login", () => setTimeout(ofrecerResumenSemanalSiToca, 1200));

// MEJORA 3 — Recibo instantáneo al pagar comisión.
// Después de marcar como pagado, la app arma un mini-recibo en WhatsApp listo
// para enviarle a la asociada/socio. Un toque cierra el ciclo sin salir de la app.
// ============================================================================
// EVALUACIÓN DE CLIENTES (2026-07-08)
// El negocio evalúa en 2 ejes: Trato y Confiabilidad (-1/0/+1).
// Dueño y encargados pueden evaluar; la atribución va en el historial.
// ============================================================================
// EVALUACIÓN DE CLIENTES (JFC 2026-08-06, portado de amigable-123) — escala
// 1-5: estrella=confiabilidad, corazon=trato. Tap acumulativo: tocar el mismo
// valor N ya encendido -> limpia (0 = sin calificar). Actualizacion optimista
// del icono en pantalla; cargarClientes() refresca a los 300ms.
async function evaluarCliente(clienteId, campo, valor, btn) {
  if (btn) btn.disabled = true;
  const _lockKey = clienteId + ":" + campo;
  evaluarCliente._locks = evaluarCliente._locks || new Set;
  if (evaluarCliente._locks.has(_lockKey)) { if (btn) btn.disabled = false; return; }
  evaluarCliente._locks.add(_lockKey);
  let _row = null, _valorAnterior = 0;
  try {
    if (btn && btn.parentElement) {
      const row = btn.closest(".oc-rate-row") || btn.parentElement;
      _row = row;
      const currentVal = parseInt(row.dataset.valor || "0", 10);
      _valorAnterior = currentVal;
      if (currentVal === valor) valor = 0;
      row.dataset.valor = String(valor);
      try {
        const iconoFn = campo === "trato" ? svgHeartR : svgStarR;
        row.querySelectorAll(".oc-rate-btn").forEach((b, i) => { b.innerHTML = iconoFn(i + 1 <= valor, 20); });
      } catch(_) {}
    }
    const quien = (window.OCAuth && window.OCAuth.usuarioActual && window.OCAuth.usuarioActual().nombre) || "Sistema";
    const horaInput = document.getElementById(`oc-inc-${clienteId}`);
    const horaIncidente = (valor >= 1 && valor <= 2 && horaInput) ? horaInput.value || null : null;
    const body = { quien, horaIncidente };
    body[campo] = valor;
    const res = await fetch(`${API}/clientes/${clienteId}/evaluacion`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    if (res.ok) {
      const wrap = document.getElementById(`oc-inc-wrap-${clienteId}`);
      if (wrap) wrap.style.display = (valor >= 1 && valor <= 2) ? "flex" : "none";
      setTimeout(cargarClientes, 300);
    } else {
      console.warn("[evaluarCliente] PATCH no-ok:", res.status, clienteId, campo, valor);
      if (_row) {
        _row.dataset.valor = String(_valorAnterior);
        try {
          const iconoFn = campo === "trato" ? svgHeartR : svgStarR;
          _row.querySelectorAll(".oc-rate-btn").forEach((b, i) => { b.innerHTML = iconoFn(i + 1 <= _valorAnterior, 20); });
        } catch(_) {}
      }
      setTimeout(cargarClientes, 50);
    }
  } catch(e) {
    console.error("Error evaluando cliente:", e);
    if (_row) {
      _row.dataset.valor = String(_valorAnterior);
      try {
        const iconoFn = campo === "trato" ? svgHeartR : svgStarR;
        _row.querySelectorAll(".oc-rate-btn").forEach((b, i) => { b.innerHTML = iconoFn(i + 1 <= _valorAnterior, 20); });
      } catch(_) {}
    }
    setTimeout(cargarClientes, 400);
  } finally {
    evaluarCliente._locks.delete(_lockKey);
    if (btn) btn.disabled = false;
  }
}

async function despedirCliente(clienteId, nombre) {
  if (!(await ocConfirm(`Fire ${nombre}? They will no longer appear in the sales selector.\nYou can reactivate them later from this section.`))) return;
  try {
    const quien = (window.OCAuth && window.OCAuth.usuarioActual && window.OCAuth.usuarioActual().nombre) || "Sistema";
    await fetch(`${API}/clientes/${clienteId}/despedir`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quien }) });
    cargarClientes();
  } catch(e) { console.error("Error despidiendo cliente:", e); }
}

// Borrar cliente por completo (JFC 2026-08-27). Solo dueño/admin. El borrado
// queda SIEMPRE en el registro de auditoría (mov "cliente-borrado").
async function borrarCliente(clienteId, nombre) {
  if (!(await ocConfirm(`Delete ${nombre} permanently?\n\nThis removes them from the customer list and the sales selector. The deletion is recorded in the audit log (who, whom, when).`))) return;
  try {
    const quien = (window.OCAuth && window.OCAuth.usuarioActual && window.OCAuth.usuarioActual().nombre) || "Sistema";
    const res = await fetch(`${API}/clientes/${clienteId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quien }) });
    if (!res.ok) { const r = await res.json().catch(() => ({})); await ocAlert(r.error || "Could not delete the customer."); return; }
    cargarClientes();
  } catch(e) { console.error("Error borrando cliente:", e); }
}

async function reactivarCliente(clienteId, nombre) {
  try {
    const quien = (window.OCAuth && window.OCAuth.usuarioActual && window.OCAuth.usuarioActual().nombre) || "Sistema";
    await fetch(`${API}/clientes/${clienteId}/reactivar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quien }) });
    cargarClientes();
  } catch(e) { console.error("Error reactivando cliente:", e); }
}

async function marcarComisionPagada(ubicacionId, promotorNombre, monto){
  if (!(await ocConfirm("Confirm you have already paid the promoter what is owed this month?"))) return;
  // #19: capturamos el desglose ANTES de sellar (marcar-pagado deja pendientes en 0).
  const detalle = (window._ocLiqDet && window._ocLiqDet[ubicacionId]) || [];
  // try/catch (homologado de AMIGABLE, auditoria 2026-07-23): antes un fallo
  // de red aqui tiraba una excepcion no atrapada, y si el servidor respondia
  // con error, fallaba en silencio total sin avisar nada al dueño.
  let res, r;
  try {
    res = await fetch(`${API}/liquidaciones/${ubicacionId}/marcar-pagado`, { method: "POST" });
    r = await res.json();
  } catch (err) {
    console.error("[marcarComisionPagada]", err);
    await ocAlert("Could not reach the server. The payment was NOT recorded. Check your connection and try again.");
    return;
  }
  if (!res.ok) { await ocAlert(r.error || "Could not mark the payment."); return; }
  cargarComisiones();
  // Recibo para WhatsApp: solo se ofrece si hay nombre de asociado/a y monto > 0.
  if (promotorNombre && monto > 0) {
    const neg = (function(){ try { const s = document.getElementById("oc-negocio-nombre"); return s ? s.textContent.trim() : ""; } catch(_){ return ""; } })();
    const mes = new Date().toLocaleDateString("es", { month: "long", year: "numeric" });
    // #19: lineas del desglose — "de qué ventas exactas". Cada producto con
    // unidades y comisión, para que el socio concilie sin preguntar.
    const lineasDet = detalle.map(d =>
      `• ${d.cantidad}× ${d.producto} — ${fmtMoney(d.comisionSocio)}`
    );
    const recibo = [
      `*Commission payment confirmed*`,
      `Asociado/a: ${promotorNombre}`,
      `Monto: ${fmtMoney(monto)}`,
      `Mes: ${mes}`,
      neg ? `Negocio: ${neg}` : "",
      lineasDet.length ? `` : "",
      lineasDet.length ? `*Detalle (${detalle.reduce((a,d)=>a+d.cantidad,0)} u):*` : "",
      ...lineasDet,
      ``,
      `Gracias por tu trabajo este mes. — friendly-123`,
    ].filter(Boolean).join("\n");
    if (await ocConfirm(`Send receipt to ${promotorNombre} via WhatsApp?`)) {
      window.open("https://wa.me/?text=" + encodeURIComponent(recibo), "_blank");
    }
  }
}

// --- VISTA AVANZADO ---
// --- Selector de zona horaria (Microcirugia USA-ready 2026-07-15) ---
// Zonas más comunes de USA + la detectada por el navegador (para que un
// dueño en, digamos, Denver, no tenga que buscarla en una lista larga).
// El valor se guarda en localStorage("oc_timezone"); mock-backend.js y
// server.js lo leen ahí para decidir qué cuenta como "hoy". Vacío = auto.
const TIMEZONES_COMUNES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix",
  "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
];
// --- Indicador offline (Microcirugia USA-ready 2026-07-15) ---
// El service worker ya soporta trabajar sin conexion, pero no habia forma
// visible de saber si una venta se guardo local o si de plano no hay señal.
(function () {
  const badge = document.getElementById("oc-offline-badge");
  function actualizar() { if (badge) badge.style.display = navigator.onLine ? "none" : "flex"; }
  window.addEventListener("online", actualizar);
  window.addEventListener("offline", actualizar);
  actualizar();
})();

function inicializarSelectorTimezone(){
  const sel = document.getElementById("selectTimezone");
  if (!sel || sel.dataset.ocListo) return;
  sel.dataset.ocListo = "1";
  const detectada = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const zonas = TIMEZONES_COMUNES.includes(detectada) ? TIMEZONES_COMUNES : [detectada, ...TIMEZONES_COMUNES];
  sel.innerHTML = `<option value="">${t("adv.timezoneAuto")} — ${detectada}</option>` +
    zonas.map(z => `<option value="${z}">${z}</option>`).join("");
  sel.value = localStorage.getItem("f123_timezone") || "";
  sel.addEventListener("change", () => {
    const msg = document.getElementById("msgTimezone");
    if (sel.value) localStorage.setItem("f123_timezone", sel.value);
    else localStorage.removeItem("f123_timezone");
    msg.style.color = "var(--verde)";
    msg.textContent = t("adv.timezoneSaved");
    cargarAvanzado();
  });
}

async function cargarGastosMensuales(){
  const input = document.getElementById("inputGastosMensuales");
  const msg = document.getElementById("msgGastos");
  const btn = document.getElementById("btnGuardarGastos");
  const selectorWrap = document.getElementById("gastosSelectorWrap");
  msg.textContent = "";

  // Reforzado (JFC 2026-07-18): mismo patron que cargarActividad() (Microcirugia
  // 12) — sin este guard, un fallo de red aqui dejaba el resto de Avanzado sin
  // cargar (esta funcion es un await dentro de cargarAvanzado). Ahora se avisa
  // claro y no arrastra el fallo al resto del panel.
  let data;
  try {
    const res = await fetch(`${API}/configuracion/gastos?ubicacionId=${ubicacionActual}`);
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (err) {
    console.error("[cargarGastosMensuales]", err);
    msg.style.color = "var(--rojo)";
    msg.textContent = "Could not load expenses. Check your connection and try again.";
    return;
  }
  input.value = data.gastosMensuales;

  if (ubicacionActual === "todas"){
    input.disabled = true;
    btn.disabled = true;
    msg.textContent = `This total covers ${fmtMoney(data.gastosMensuales)} across all your locations. Pick one below to edit.`;
    // Antes esto solo mostraba un mensaje y el dueño tenía que acordarse de
    // subir hasta el selector del header — muchos pensaban que la caja
    // estaba rota. Ahora el selector vive aquí mismo, al lado del problema.
    selectorWrap.style.display = "block";
    const sel = document.getElementById("gastosUbicSelector");
    sel.innerHTML = ubicaciones.map(u => `<option value="${u.id}">${escHtml(u.nombre)}</option>`).join("");
    if (!sel.dataset.ocListo) {
      sel.dataset.ocListo = "1";
      sel.addEventListener("change", () => {
        document.getElementById("selectUbicacion").value = sel.value;
        ubicacionActual = sel.value;
        cargarGastosMensuales();
      });
    }
  } else {
    input.disabled = false;
    btn.disabled = false;
    selectorWrap.style.display = "none";
  }
}

document.getElementById("btnGuardarGastos").addEventListener("click", async () => {
  const input = document.getElementById("inputGastosMensuales");
  const msg = document.getElementById("msgGastos");
  const res = await fetch(`${API}/configuracion/gastos`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ ubicacionId: ubicacionActual, gastosMensuales: Number(input.value) })
  });
  const data = await res.json();
  if (!res.ok){
    msg.style.color = "var(--rojo)";
    msg.textContent = data.error;
    return;
  }
  msg.style.color = "var(--verde)";
  msg.textContent = "Guardado. Actualizando el P&G...";
  cargarAvanzado();
});

function volverArribaAvanzado() {
  const sec = document.getElementById("vista-avanzado");
  if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function cargarAvanzado(){
  inicializarSelectorTimezone();
  await cargarGastosMensuales();
  await cargarActividad();
  // Reforzado (JFC 2026-07-18): cargarAvanzado() se llama fire-and-forget (nav
  // click, sin await) — sin este try/catch, un fallo de red aqui tiraba una
  // excepcion no atrapada y el panel Avanzado se quedaba congelado en blanco,
  // sin ningun aviso (el click parecia no hacer nada). Ahora se avisa claro
  // en las 3 tablas y no revienta silencioso.
  let pl, balance, valorizado;
  try {
    [pl, balance, valorizado] = await Promise.all([
      fetch(`${API}/reportes/pl?ubicacionId=${ubicacionActual}`).then(r => r.json()),
      fetch(`${API}/reportes/balance?ubicacionId=${ubicacionActual}`).then(r => r.json()),
      fetch(`${API}/reportes/valorizado?ubicacionId=${ubicacionActual}`).then(r => r.json()),
    ]);
  } catch (err) {
    console.error("[cargarAvanzado]", err);
    const aviso = `<tr><td colspan="5" style="color:var(--rojo);padding:12px;">Could not load. Check your connection and try again.</td></tr>`;
    document.getElementById("tablaPL").innerHTML = aviso;
    document.getElementById("tablaBalance").innerHTML = aviso;
    document.getElementById("tablaValorizado").innerHTML = aviso;
    return;
  }

  // Color intencional: azul = capa contable (Simon semantica). Verde solo
  // en resultados positivos. Sin rojo — los gastos son normales, no alarma.
  document.getElementById("tablaPL").innerHTML = `
    <tr><th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.concept")}</th><th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.amount")}</th></tr>
    <tr><td>${t("adv.pl.revenue")}</td><td>${fmtMoney(pl.ingresos)}</td></tr>
    <tr><td>${t("adv.pl.cogs")}</td><td>${fmtMoney(pl.costoVentas)}</td></tr>
    <tr style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;"><td>${t("adv.pl.grossProfit")}</td><td>${fmtMoney(pl.utilidadBruta)}</td></tr>
    <tr><td>${t("adv.pl.opex")}</td><td>${fmtMoney(pl.gastosOperativos)}</td></tr>
    <tr style="background:var(--sim-verde);"><td><strong style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;">${t("adv.pl.netProfit")}</strong></td><td><strong style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;">${fmtMoney(pl.utilidadNeta)}</strong></td></tr>
  `;

  document.getElementById("tablaBalance").innerHTML = `
    <tr><th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.concept")}</th><th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.amount")}</th></tr>
    <tr><td>${t("adv.bal.estCash")}</td><td>${fmtMoney(balance.activos.efectivoEstimado)}</td></tr>
    <tr><td>${t("adv.bal.valuedInv")}</td><td>${fmtMoney(balance.activos.inventarioValorizado)}</td></tr>
    <tr style="background:var(--sim-azul);"><td><strong style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;">${t("adv.bal.totalAssets")}</strong></td><td><strong style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;">${fmtMoney(balance.activos.total)}</strong></td></tr>
  `;

  document.getElementById("tablaValorizado").innerHTML = `
    <tr>
      <th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.val.product")}</th>
      <th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.val.stock")}</th>
      <th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.val.costValue")}</th>
      <th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.val.saleValue")}</th>
      <th style="background:var(--sim-azul-dk);color:#fff;">${t("adv.val.potentialProfit")}</th>
    </tr>
    ${valorizado.productos.map(p => `
      <tr>
        <td>${escHtml(p.nombre)}</td>
        <td>${p.stockActual}</td>
        <td>${fmtMoney(p.valorCosto)}</td>
        <td>${fmtMoney(p.valorVenta)}</td>
        <td style="color:var(--sim-verde-dk);font-weight:600;">${fmtMoney(p.utilidadPotencial)}</td>
      </tr>
    `).join("")}
    <tr style="background:var(--sim-azul);">
      <td><strong style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;">${t("adv.val.total")}</strong></td>
      <td></td>
      <td><strong style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;">${fmtMoney(valorizado.totales.valorCosto)}</strong></td>
      <td><strong style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;">${fmtMoney(valorizado.totales.valorVenta)}</strong></td>
      <td><strong style="color:#FFFFFF;-webkit-text-fill-color:#FFFFFF;">${fmtMoney(valorizado.totales.utilidadPotencial)}</strong></td>
    </tr>
  `;
}

// --- Init ---
// Reintenta una vez antes de rendirse (ver nota igual en Olimpo Control):
// en la demo estática, mock-backend.js se carga externo y en red lenta puede
// no haber interceptado fetch() a tiempo. El mensaje final nunca debe hablar
// de "server.js" cuando window.OC_DEMO está activo (seteado por mock-backend.js).
async function cargarDashboardInicial(intento){
  try{
    await cargarUbicaciones();
    await cargarHoy();
  }catch(err){
    if (!intento) {
      await new Promise((r) => setTimeout(r, 400));
      return cargarDashboardInicial(1);
    }
    console.error("No se pudo cargar el panel inicial:", err);
    const hero = document.getElementById("heroSemaforo");
    hero.className = "hero-semaforo tag-card amarillo";
    if (window.OC_DEMO) {
      document.getElementById("heroTitulo").textContent = "Cargando la demo…";
      document.getElementById("heroSubtitulo").textContent = "If this doesn't change in a few seconds, reload the page.";
    } else {
      document.getElementById("heroTitulo").textContent = "Could not connect to the server.";
      document.getElementById("heroSubtitulo").textContent = "Verify that the backend (server.js) is running and reload the page.";
    }
  }
}
cargarDashboardInicial(0);

// Splash de arranque: visible ~0.8s, fade de 0.45s y se quita del DOM.
setTimeout(() => {
  const sp = document.getElementById("oc-splash");
  if (sp) { sp.classList.add("fuera"); setTimeout(() => sp.remove(), 500); }
}, 800);
