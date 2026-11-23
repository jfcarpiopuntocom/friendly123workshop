'use strict';
/**
 * Non-Sync3 Performance Fix: Stop cargarDashboardInicial(0) from executing before PIN unlock.
 * Target: src/app/app-inline-01.js (v0.8.90+)
 */

const ORIGINAL_SNIPPET = 'cargarDashboardInicial(0);';

const PATCHED_SNIPPET = `let _dashboardInicialEnCurso = null;
let _dashboardInicialRolCargado = "";
function _gatePinBloqueandoArranque() {
  const gate = typeof document !== "undefined" && document.getElementById("oc-gate");
  if (gate) {
    const disp = gate.style && gate.style.display;
    if (disp !== "none") return true;
  }
  const auth = typeof window !== "undefined" ? window.OCAuth : null;
  if (auth && typeof auth.rolActual === "function") {
    return !auth.rolActual();
  }
  if (typeof window !== "undefined" && !window.OC_DEMO && !gate &&
      typeof document !== "undefined" && document.readyState === "loading") {
    return true;
  }
  return false;
}
function arrancarDashboardInicialSeguro() {
  if (_gatePinBloqueandoArranque()) return null;
  const auth = typeof window !== "undefined" ? window.OCAuth : null;
  const rol = auth && typeof auth.rolActual === "function" ? String(auth.rolActual() || "") : "__noauth__";
  if (_dashboardInicialEnCurso) return _dashboardInicialEnCurso;
  if (_dashboardInicialRolCargado && _dashboardInicialRolCargado === rol) return null;
  _dashboardInicialRolCargado = rol;
  _dashboardInicialEnCurso = Promise.resolve()
    .then(() => cargarDashboardInicial(0))
    .catch(() => { _dashboardInicialRolCargado = ""; })
    .finally(() => { _dashboardInicialEnCurso = null; });
  return _dashboardInicialEnCurso;
}
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("oc-login", () => {
    _dashboardInicialRolCargado = "";
    if (window.OCSyncRender && typeof window.OCSyncRender.solicitar === "function") {
      window.OCSyncRender.solicitar("oc-login");
    } else {
      arrancarDashboardInicialSeguro();
    }
  });
  window.addEventListener("oc-logout", () => {
    _dashboardInicialRolCargado = "";
  });
}
if (typeof document !== "undefined" && document.readyState === "loading" &&
    typeof document.addEventListener === "function") {
  document.addEventListener("DOMContentLoaded", () => { arrancarDashboardInicialSeguro(); }, { once: true });
} else {
  arrancarDashboardInicialSeguro();
}`;

function applyPatchToSource(source) {
  const idx = source.lastIndexOf(ORIGINAL_SNIPPET);
  if (idx === -1) throw new Error('Target snippet `cargarDashboardInicial(0);` not found in app-inline-01.js');
  if (source.includes('arrancarDashboardInicialSeguro')) return { changed: false, source };
  const patched = source.slice(0, idx) + PATCHED_SNIPPET + source.slice(idx + ORIGINAL_SNIPPET.length);
  return { changed: true, source: patched };
}

module.exports = { ORIGINAL_SNIPPET, PATCHED_SNIPPET, applyPatchToSource };
