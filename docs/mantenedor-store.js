/* Inbox local del lab de mantenedor. Misma clave la leen la app, la landing
   y el dashboard. En producción el Worker es la fuente; aquí no hay secretos. */
(function (global) {
  "use strict";
  var KEY = "f123_mantenedor_lab";
  function vacio() {
    return { reportes: [], nps: [], contactos: [], silencio: [], creado: Date.now() };
  }
  function leer() {
    try {
      var x = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!x || typeof x !== "object") return vacio();
      ["reportes", "nps", "contactos", "silencio"].forEach(function (k) {
        if (!Array.isArray(x[k])) x[k] = [];
      });
      return x;
    } catch (_) { return vacio(); }
  }
  function escribir(x) {
    try { localStorage.setItem(KEY, JSON.stringify(x)); } catch (_) {}
    return x;
  }
  function id(pref) {
    return (pref || "t") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function push(lista, item) {
    var box = leer();
    item.id = item.id || id(lista.slice(0, 3));
    item.ts = item.ts || Date.now();
    box[lista] = (box[lista] || []).concat([item]).slice(-80);
    escribir(box);
    return item;
  }
  function sembrarSiVacio() {
    var box = leer();
    if (box.reportes.length || box.nps.length) return box;
    push("reportes", { kind: "reporte", app: "friendly-123", modulo: "sync-realtime", mensaje: "Sample: websocket stuck connecting (sanitized).", version: "1.7.41", destino: "github" });
    push("nps", { kind: "nps", app: "friendly-123", mensaje: "Sync" });
    return leer();
  }
  global.OCMantenedorStore = { KEY: KEY, leer: leer, push: push, sembrarSiVacio: sembrarSiVacio, id: id };
})(window);
