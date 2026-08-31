/* mantenedor-reportar.js — Fase 2: botón "Report a problem", captura
   silenciosa opt-in, y panel en Avanzado. Destinos: GitHub Issue y/o
   Google Sheet, siempre con preview del JSON sanitizado ANTES de enviar. */
(function (global) {
  "use strict";

  function P() { return global.OCMantenedorPrivacidad || null; }

  function leerCajaNegra() {
    try {
      var lista = JSON.parse(localStorage.getItem("f123_errores") || "[]");
      if (!Array.isArray(lista)) return [];
      return lista.slice(-8).map(function (e) {
        var p = P();
        var msg = e && (e.msg || e.message || e.tipo) || "";
        return p ? p.limpiarTexto(String(msg).slice(0, 220)) : String(msg).slice(0, 220);
      });
    } catch (_) { return []; }
  }

  async function enviar(kind, extra) {
    var p = P();
    if (!p) return { ok: false, error: "Privacy module missing." };
    var payload = p.sanitizar(Object.assign({}, p.contexto(), extra || {}, { kind: kind }));
    var stored = null;
    try {
      if (global.OCMantenedorStore) stored = global.OCMantenedorStore.push(kind === "silencio" ? "silencio" : "reportes", payload);
    } catch (_) {}
    try {
      var r = await fetch("/api/mantenedor/reporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var j = {};
      try { j = await r.json(); } catch (_) {}
      if (j && j.ok) return j;
    } catch (_) {}
    if (stored) return { ok: true, id: stored.id, url: "./mantenedor.html", lab: true };
    return { ok: false, error: "Could not store the report." };
  }

  function montarAvanzado() {
    var vista = document.getElementById("vista-avanzado");
    if (!vista || document.getElementById("oc-mantenedor-card")) return;
    var p = P();
    var card = document.createElement("div");
    card.className = "tag-card";
    card.id = "oc-mantenedor-card";
    card.style.cssText = "text-align:left;margin-top:22px;";
    card.innerHTML =
      '<h3 class="seccion" style="margin-top:0;">Technical reports (opt-in)</h3>' +
      '<p style="font-size:14px;color:var(--ink-soft);margin:0 0 10px;">Off by default. When on, this device may send <strong>technical</strong> errors (app, version, module, message). Never inventory, sales, customers or license codes.</p>' +
      '<label style="display:flex;align-items:center;gap:10px;font-size:15px;font-weight:700;cursor:pointer;margin:0 0 12px;">' +
        '<input type="checkbox" id="oc-mant-optin" style="width:20px;height:20px;">' +
        'Allow technical reports from this device</label>' +
      '<button type="button" id="oc-mant-reportar" class="ir">Report a problem</button>' +
      '<p id="oc-mant-msg" style="font-size:13px;margin:8px 0 0;color:var(--ink-soft);"></p>' +
      '<p style="font-size:13px;margin:10px 0 0;"><a href="./mantenedor.html" style="color:var(--azul-medio);">Open maintainer inbox</a> · <a href="./landing-contacto.html" style="color:var(--azul-medio);">Contact / NPS landing</a></p>';
    vista.appendChild(card);
    var box = card.querySelector("#oc-mant-optin");
    var msg = card.querySelector("#oc-mant-msg");
    if (p && box) box.checked = p.optIn();
    if (box) box.addEventListener("change", function () {
      if (p) p.setOptIn(!!box.checked);
      msg.textContent = box.checked
        ? "Opt-in on. Uncaught errors can be sent as technical reports."
        : "Opt-in off. Nothing leaves this device.";
    });
    card.querySelector("#oc-mant-reportar").addEventListener("click", abrirReporte);
  }

  async function abrirReporte() {
    var p = P();
    var caja = leerCajaNegra();
    var modulo = prompt("Which screen or module broke? (e.g. Sold, Sync, PIN gate)", "");
    if (modulo == null) return;
    var que = prompt("What happened, in one or two sentences? No product names, no customer names.", "");
    if (que == null) return;
    var preview = p ? p.sanitizar(Object.assign({}, p.contexto(), {
      kind: "reporte",
      modulo: modulo,
      mensaje: que + (caja.length ? (" | log: " + caja.join(" · ")) : "")
    })) : {};
    var okPreview = confirm("This is ALL that will be sent. No business data.\n\n" + JSON.stringify(preview, null, 2) + "\n\nSend technical report?");
    if (!okPreview) return;
    if (p && !p.optIn()) p.setOptIn(true);
    var r = await enviar("reporte", { modulo: preview.modulo, mensaje: preview.mensaje });
    var el = document.getElementById("oc-mant-msg");
    if (r && r.ok) {
      if (el) el.textContent = "Sent. Ticket " + (r.id || "") + (r.url ? (" — " + r.url) : "");
      try { if (global.ocAlert) ocAlert("Report sent as " + (r.id || "ticket") + ". Thank you."); } catch (_) {}
    } else {
      if (el) el.textContent = "Could not send: " + ((r && r.error) || "network");
    }
  }

  function capturaSilenciosa() {
    function mandar(kind, msg, src) {
      var p = P();
      if (!p || !p.optIn()) return;
      var payload = p.sanitizar(Object.assign({}, p.contexto(), {
        kind: kind,
        modulo: p.limpiarTexto(String(src || "window")),
        mensaje: p.limpiarTexto(String(msg || ""))
      }));
      if (!payload.mensaje) return;
      try { if (global.OCMantenedorStore) global.OCMantenedorStore.push("silencio", payload); } catch (_) {}
      try {
        fetch("/api/mantenedor/silencio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function () {});
      } catch (_) {}
    }
    global.addEventListener("error", function (e) {
      try { mandar("silencio", e.message, (e.filename || "").split("/").pop() + ":" + (e.lineno || 0)); } catch (_) {}
    });
    global.addEventListener("unhandledrejection", function (e) {
      try { mandar("silencio", (e.reason && e.reason.message) || e.reason, "promise"); } catch (_) {}
    });
  }

  function init() {
    capturaSilenciosa();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", montarAvanzado);
    else montarAvanzado();
    try { global.addEventListener("oc-login", function () { setTimeout(montarAvanzado, 80); }); } catch (_) {}
  }
  init();
  global.OCMantenedorReportar = { enviar: enviar, abrir: abrirReporte };
})(window);
