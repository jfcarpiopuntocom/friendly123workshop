/* mantenedor-privacidad.js — Fase 0 del plan de APIs gratuitas.
   Contrato NO CLOUD: de esta app NO sale inventario, ventas, clientes,
   pacientes, PINs ni códigos de licencia. Solo telemetría técnica opt-in
   para el mantenedor (app, versión, módulo, mensaje de error, UA).
   Las 3 apps de la línea pueden copiar este archivo tal cual. */
(function (global) {
  "use strict";
  var CAMPOS = ["app", "version", "shell", "modulo", "mensaje", "ua", "online", "idioma", "origen", "kind", "ts"];
  var LICENCIA = /\b(?:F123|AMG|C123|TEAM)-[A-Z0-9*~$=-]{4,}\b/gi;
  var PROHIBIDO = /\b(sku|precio|stock|cliente|pacientes?|inventario|ventas?|passcode|whatsapp|cedula)\b/gi;
  var EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  var PINCERCA = /\bPIN\s*[:#-]?\s*\d{3}\b/gi;

  function recortar(s, n) {
    s = String(s == null ? "" : s);
    if (s.length > n) s = s.slice(0, n);
    return s;
  }
  function limpiarTexto(s) {
    s = recortar(s, 400);
    s = s.replace(EMAIL, "[redacted-email]");
    s = s.replace(LICENCIA, "[redacted-license]");
    s = s.replace(PINCERCA, "PIN [redacted-pin]");
    s = s.replace(PROHIBIDO, "[redacted]");
    return s;
  }
  function sanitizar(raw) {
    raw = raw && typeof raw === "object" ? raw : {};
    var out = {};
    CAMPOS.forEach(function (k) {
      if (raw[k] == null || raw[k] === "") return;
      var v = raw[k];
      if (k === "online") { out[k] = !!v; return; }
      if (k === "ts") { out[k] = Number(v) || Date.now(); return; }
      out[k] = limpiarTexto(v);
    });
    if (!out.app) out.app = "friendly-123";
    if (!out.ts) out.ts = Date.now();
    return out;
  }
  function optIn() {
    try { return localStorage.getItem("f123_mantenedor_optin") === "1"; } catch (_) { return false; }
  }
  function setOptIn(on) {
    try { localStorage.setItem("f123_mantenedor_optin", on ? "1" : "0"); } catch (_) {}
  }
  function contexto() {
    var v = {}, shell = "";
    try { v = JSON.parse(localStorage.getItem("f123_version_vista") || "null") || {}; } catch (_) {}
    try {
      var vista = String(localStorage.getItem("f123_version_vista") || "");
      shell = vista.split("|")[1] || "";
    } catch (_) {}
    var ua = "";
    try { ua = String(navigator.userAgent || "").slice(0, 180); } catch (_) {}
    var idioma = "en";
    try { if (global.OCI18n && global.OCI18n.getLang) idioma = global.OCI18n.getLang(); } catch (_) {}
    return sanitizar({
      app: "friendly-123",
      version: String((v && v.version) || ""),
      shell: shell,
      ua: ua,
      online: !!(navigator.onLine),
      idioma: idioma,
      origen: (function () { try { return location.pathname.split("/").pop() || "index.html"; } catch (_) { return "index.html"; } })()
    });
  }
  global.OCMantenedorPrivacidad = {
    CAMPOS: CAMPOS,
    sanitizar: sanitizar,
    limpiarTexto: limpiarTexto,
    optIn: optIn,
    setOptIn: setOptIn,
    contexto: contexto
  };
})(window);
