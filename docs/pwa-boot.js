// Item 4 (revision JFC 2026-07-05): capa PWA minima — cachea el shell
// (HTML/JS/CSS/assets propios) para que la app abra sin conexion. Nunca
// intercepta /api/* ni version.json (datos y updates siempre frescos).
// El chequeo de version (Fase 2) vive en auth-ui.js — no duplicarlo aqui.
// Falla en silencio en navegadores sin soporte — nunca bloquea la carga.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {}); });
}
// CONTROL DE VERSION FORZADO (JFC 2026-07-17, "no podemos andar sirviendo
// versiones viejas"): en CADA carga se pide version.json fresco (el SW nunca
// lo cachea, por diseno). Si la version publicada difiere de la ultima vista
// en este dispositivo, se purgan TODAS las caches, se actualiza el SW y se
// recarga UNA sola vez — automatico, sin banner, sin pedirle nada al usuario.
// Anti-loop: la version nueva se guarda ANTES de recargar, asi la segunda
// carga ya coincide y no vuelve a recargar. Primera visita: solo registra.
(async function () {
  try {
    const r = await fetch("./version.json?ts=" + Date.now(), { cache: "no-store" });
    if (!r.ok) { try { const eb = JSON.parse(localStorage.getItem("f123_errores") || "[]"); eb.push({ ts: Date.now(), tipo: "version-check", msg: "version.json " + r.status }); if (eb.length > 50) eb.splice(0, eb.length - 50); localStorage.setItem("f123_errores", JSON.stringify(eb)); } catch (_) {} return; }
    const _vj = (await r.json()) || {};
    // BUG RAIZ (JFC 2026-08-26, "3 semanas viendo codigo viejo"): antes esto
    // comparaba SOLO `version` ("1.7.5"), que casi nunca se subia. Cada build
    // sube el `shell` (f123-shell-vNN) pero `version` se quedaba igual, asi que
    // este reload forzado NUNCA se disparaba y el dispositivo seguia con el
    // shell viejo. Ahora la huella incluye AMBOS: si cambia cualquiera, refresca.
    const v = String(_vj.version || "") + "|" + String(_vj.shell || "");
    if (v === "|") return;
    const K = "f123_version_vista";
    const prev = localStorage.getItem(K);
    if (prev === v) return;
    /* ANTI-LOOP ROBUSTO (JFC 2026-08-28, sistema de integridad de versión):
       si el deploy está a medias o la red devuelve algo raro, no queremos un
       bucle infinito de recargas. Se guarda la versión ANTES de recargar (ya
       existía) y además un contador con timestamp: si se recarga más de 3
       veces en 30s, se para y se deja la app como está (mejor servir algo que
       recargar sin fin). */
    const KI = "f123_version_intento";
    try {
      const ahora = Date.now();
      const it = JSON.parse(localStorage.getItem(KI) || "null");
      if (it && (ahora - it.ts) < 30000) {
        if (it.n >= 3) { localStorage.setItem(K, v); return; } // tope: no más recargas
        it.n += 1; it.ts = ahora; localStorage.setItem(KI, JSON.stringify(it));
      } else {
        localStorage.setItem(KI, JSON.stringify({ n: 1, ts: ahora }));
      }
    } catch (_) {}
    localStorage.setItem(K, v);
    // Sin excepcion de primera visita: los dispositivos atascados en una
    // version vieja nunca guardaron esta clave — tambien necesitan la purga.
    try { const regs = await navigator.serviceWorker.getRegistrations(); for (const g of regs) { try { await g.update(); } catch (_) {} } } catch (_) {}
    /* JFC 2026-08-28 (Fix A3): purgar SOLO las caches del shell (f123-shell-*),
       nunca las de fuentes ni datos. Antes se borraban TODAS las caches
       (caches.keys() → delete), lo que rompía el offline-first si la red caía
       durante el reload. */
    try { const cs = await caches.keys(); for (const c of cs) { if (c.indexOf("f123-shell-") === 0) { try { await caches.delete(c); } catch (_) {} } } } catch (_) {}
    /* RECARGA COORDINADA (JFC 2026-08-28): avisar a las OTRAS pestañas abiertas
       para que recarguen juntas, en vez de dejar una pestaña vieja viva
       sirviendo código mixto. Cada pestaña escucha el canal y recarga. */
    try {
      const bc = new BroadcastChannel("f123-version");
      bc.postMessage({ tipo: "recargar", v: v });
      setTimeout(function () { try { bc.close(); } catch (_) {} }, 500);
    } catch (_) {}
    /* RELOAD FORZADO DE VERSIÓN. Forzar la siguiente versión — pero NO
       mientras el candado está en pantalla: ese refresh es para la pantalla
       que viene DESPUÉS del PIN. auth-ui.js recarga al entrar si queda la marca. */
    try {
      const g = document.getElementById("oc-gate");
      const enCandado = g && g.style.display !== "none";
      let ses = null;
      try { ses = JSON.parse(sessionStorage.getItem("f123_sesion") || "null"); } catch (_) {}
      if (enCandado && !(ses && ses.rol)) {
        sessionStorage.setItem("f123_reload_al_entrar", "1");
      } else {
        location.reload();
      }
    } catch (_) { location.reload(); }
  } catch (_) {}
})();

/* COMPATIBILIDAD DE VERSIÓN + RECARGA COORDINADA (JFC 2026-08-28, sistema de
   integridad de versión). La app le pregunta al service worker qué shell está
   sirviendo (la cache activa f123-shell-vNN) y lo compara con el shell que
   version.json declara. Si el SW sirve un shell distinto al publicado (mezcla
   de versiones), se fuerza una recarga coordinada UNA vez. También se escucha
   el canal BroadcastChannel("f123-version") para recargar cuando otra pestaña
   detecta una versión nueva. */
(function verificarCompatibilidadVersion() {
  try {
    const esperado = (function () { try { return (JSON.parse(localStorage.getItem("f123_version_vista") || "null") || "").split("|")[1] || ""; } catch (_) { return ""; } })();
    if (esperado && ("caches" in window)) {
      caches.keys().then(function (nombres) {
        const activa = (nombres.filter(function (n) { return n.indexOf("f123-shell-") === 0; }).pop() || "");
        if (activa && esperado && activa !== esperado) {
          try { console.warn("[version] el SW sirve " + activa + " pero version.json pide " + esperado + " — recargando."); } catch (_) {}
          try { localStorage.setItem("f123_version_vista", esperado); } catch (_) {}
          try {
            const g = document.getElementById("oc-gate");
            const enCandado = g && g.style.display !== "none";
            let ses = null;
            try { ses = JSON.parse(sessionStorage.getItem("f123_sesion") || "null"); } catch (_) {}
            if (enCandado && !(ses && ses.rol)) {
              sessionStorage.setItem("f123_reload_al_entrar", "1");
              return;
            }
          } catch (_) {}
          location.reload();
        }
      }).catch(function () {});
    }
  } catch (_) {}
  try {
    const bc = new BroadcastChannel("f123-version");
    bc.onmessage = function (ev) {
      try {
        if (ev && ev.data && ev.data.tipo === "recargar") {
          try { localStorage.setItem("f123_version_vista", ev.data.v || ""); } catch (_) {}
          try {
            const g = document.getElementById("oc-gate");
            const enCandado = g && g.style.display !== "none";
            let ses = null;
            try { ses = JSON.parse(sessionStorage.getItem("f123_sesion") || "null"); } catch (_) {}
            if (enCandado && !(ses && ses.rol)) {
              sessionStorage.setItem("f123_reload_al_entrar", "1");
              return;
            }
          } catch (_) {}
          location.reload();
        }
      } catch (_) {}
    };
  } catch (_) {}
})();

// Microcirugia 5 (2026-07-07): tras importar un respaldo o restaurar un punto
// de la caja fuerte (avanzado-extra dispara "oc-datos-importados"), la UI se
// re-sincroniza sola: ubicaciones, vista activa y select de clientes. Antes
// dependia de que el dueno recargara la pagina a mano.
window.addEventListener("oc-datos-importados", async () => {
  try { await cargarUbicaciones(); } catch (_) {}
  try { refrescarVistaActiva(); } catch (_) {}
  try { poblarSelectClientes(); } catch (_) {}
});

// FIX preventivo 2026-07-07: dos pestañas del mismo negocio abiertas a la vez
// se pisan el estado guardado (la ultima en escribir gana y la otra pierde
// ventas). Se detecta a la segunda pestaña con BroadcastChannel y se le pone
// un candado claro. "Usar aqui" queda para el caso legitimo (pestaña zombie).
// Microcirugia 3 (2026-07-07): CAJA NEGRA. En la tienda no hay DevTools —
// los ultimos 20 errores quedan en localStorage["oc_errores"] para poder
// diagnosticar por WhatsApp ("mandame lo que dice AVANZADO > soporte").
// Aviso discreto una sola vez por sesion; jamas bloquea nada.
(function cajaNegraErrores() {
  let avisado = false;
  window.addEventListener("unhandledrejection", (e) => { try { const lista = JSON.parse(localStorage.getItem("f123_errores") || "[]"); lista.push({ fecha: new Date().toISOString(), msg: String((e.reason && e.reason.message) || e.reason).slice(0, 300), src: "promise", linea: 0 }); localStorage.setItem("f123_errores", JSON.stringify(lista.slice(-10))); } catch (_) {} }); // (2026-07-17) promesas rechazadas tambien van a la caja negra
  window.addEventListener("error", (e) => {
    try {
      const lista = JSON.parse(localStorage.getItem("f123_errores") || "[]");
      lista.push({ fecha: new Date().toISOString(), msg: String(e.message || ""), src: String(e.filename || "").split("/").pop() + ":" + (e.lineno || 0) });
      localStorage.setItem("f123_errores", JSON.stringify(lista.slice(-20)));
    } catch (_) {}
    if (avisado) return;
    avisado = true;
    try {
      const d = document.createElement("div");
      d.setAttribute("role", "status");
      d.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:10004;background:#0F1923;border-top:3px solid #E86040;padding:10px 14px;text-align:center;";
      d.innerHTML = '<span style="color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:15px;font-weight:700;">Something failed on this screen. Reload the page; if it happens again, let us know via WhatsApp.</span>' +
        ' <button style="margin-left:10px;min-height:40px;padding:8px 14px;border-radius:6px;border:2px solid #5294AC;background:transparent;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:14px;font-weight:700;cursor:pointer;" onclick="location.reload()">Reload</button>';
      (document.body || document.documentElement).appendChild(d);
      setTimeout(() => d.remove(), 12000);
    } catch (_) {}
  });
})();

// Microcirugia 7 (2026-07-07): el navegador interno de WhatsApp/Instagram a
// veces bloquea prompt()/confirm() (devuelven null/false al instante, sin
// dialogo). dialogosBloqueados() lo detecta para avisar claro en vez de
// fallar mudo. Heuristica: confirm respondiendo en <15ms = no hubo dialogo
// humano.
// DORMANT parcial (2026-07-15): su único call site (cierre del día) ahora
// usa ocConfirm() propio, que no depende de window.confirm y por tanto no
// puede ser bloqueado por el webview. Se deja la función viva porque
// prompt() (renombrar sucursal/percha) sigue siendo nativo y podría
// usarla si se detecta el mismo problema ahí. NO BORRAR sin revisar esos
// call sites primero.
window.dialogosBloqueados = function () {
  try {
    const t0 = performance.now();
    const r = window.confirm("friendly-123: toca Aceptar para continuar");
    return (performance.now() - t0) < 15 && r === false;
  } catch (_) { return true; }
};

/* GUARDIA DE DOBLE PESTANA — BORRADA DE AQUI (JFC 2026-08-19).
   Habia DOS guardias haciendo lo mismo, cada una con su propio soyPrincipal:
   desbloquear una NO desbloqueaba la otra, y las dos creaban el mismo id
   #oc-doble-tab, asi que el boton "Use here anyway" podia quedar enganchado a
   la copia equivocada. Encima esta escuchaba el canal "amigable-caja-unica",
   el de la app HERMANA: abrir amigable-123 en otra pestana disparaba el
   bloqueo de friendly-123.
   Queda UNA sola, mas arriba en este archivo (guardiaDoblePestana), ahora
   sobre Web Locks. NO volver a agregar una segunda. */

