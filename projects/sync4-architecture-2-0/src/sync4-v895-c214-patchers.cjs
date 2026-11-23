'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cargaTardia = require('./carga-tardia-v2.js');

/**
 * Surgical Ponytail C214 patchers targeting LIVE friendly-123 v0.8.95 (f13c0a7d).
 * Every patch closes a verified P0 Sync4/boot blocker discovered directly in f13c0a7d:
 *  1) src/port2-readonly-catalog-session.mjs: Team (admin/empleado) cold-join on brand-new
 *     'sala-vacia' threw before materializing empty public roots 'productos'/'ubicaciones'.
 *  2) docs/sync-realtime.js: pausarParaArquitectura20() returned {ok:false} when !leerSala(),
 *     preventing brand-new/linked devices (with no legacy Sync3 room) from activating Sync4.
 *  3) src/yparty-piloto.js: exposes zero-PII window.OCSync4Diagnostico() + diagnostico() with
 *     explicit rutaEfectiva (Micropasos 23 & 32) without ever touching or exposing private Y.Doc.
 *  4) docs/index.html + docs/carga-tardia.js: defers 44 post-PIN/on-demand scripts (100% present
 *     in sw.js SHELL) to bring synchronous pre-PIN JS boot weight <= 40% of 22-nov baseline.
 */

function patchReadOnlyCatalogSalaVaciaEmptyRoots(source) {
  const target =
    "  if(!publicDoc.share.has('productos')||!publicDoc.share.has('ubicaciones'))\n" +
    "    throw fail();\n" +
    "  publicDoc.getMap('productos');\n" +
    "  publicDoc.getMap('ubicaciones');";

  const replacement =
    "  if(body.frozenHead==='sala-vacia'){\n" +
    "   publicDoc.getMap('productos');\n" +
    "   publicDoc.getMap('ubicaciones');\n" +
    "  }else if(!publicDoc.share.has('productos')||!publicDoc.share.has('ubicaciones')){\n" +
    "   throw fail();\n" +
    "  }else{\n" +
    "   publicDoc.getMap('productos');\n" +
    "   publicDoc.getMap('ubicaciones');\n" +
    "  }";

  if (source.includes("if(body.frozenHead==='sala-vacia'){")) {
    return { source, changed: false };
  }
  if (!source.includes(target)) {
    throw new Error('BUG-V895-1 anchor not found in src/port2-readonly-catalog-session.mjs');
  }
  return { source: source.replace(target, replacement), changed: true };
}

function patchSyncRealtimeAllowColdDevicePause(source) {
  const target =
    "      if (document.hidden || !actual || normalizarCodigo(licencia) !== actual ||\n" +
    "          !sala || normalizarCodigo(sala.codigo) !== actual) return { ok: false };\n" +
    "      // On restart a certified IDB tombstone distinguishes a 2.0-committed\n" +
    "      // operation from a genuinely pending old-relay operation, without erasure.\n" +
    "      if (colaLargo() > 0 && !(await recargarConfirmados20(actual))) return { ok: false };\n" +
    "      if (document.hidden || codigoCuadernoActivo() !== actual ||\n" +
    "          normalizarCodigo((leerSala() || {}).codigo) !== actual ||\n" +
    "          tienePendientesDurables()) return { ok: false };";

  const replacement =
    "      // Sync4 C214: brand-new/linked devices with no legacy Sync3 room (!sala) MUST be allowed\n" +
    "      // to pause legacy relay and enter Sync4 directly, while still rejecting mismatched rooms.\n" +
    "      if (document.hidden || !actual || normalizarCodigo(licencia) !== actual ||\n" +
    "          (sala && normalizarCodigo(sala.codigo) !== actual)) return { ok: false };\n" +
    "      // On restart a certified IDB tombstone distinguishes a 2.0-committed\n" +
    "      // operation from a genuinely pending old-relay operation, without erasure.\n" +
    "      if (colaLargo() > 0 && !(await recargarConfirmados20(actual))) return { ok: false };\n" +
    "      const salaActual = leerSala();\n" +
    "      if (document.hidden || codigoCuadernoActivo() !== actual ||\n" +
    "          (salaActual && normalizarCodigo(salaActual.codigo) !== actual) ||\n" +
    "          tienePendientesDurables()) return { ok: false };";

  if (source.includes('Sync4 C214: brand-new/linked devices with no legacy Sync3 room')) {
    return { source, changed: false };
  }
  if (!source.includes(target)) {
    throw new Error('BUG-V895-2 anchor not found in docs/sync-realtime.js');
  }
  return { source: source.replace(target, replacement), changed: true };
}

function patchYpartyPilotoDiagnostico(source) {
  const anchor = "    // PORT2 C23/C16b-store: durable IndexedDB store factory isolated by SHA-256";
  if (source.includes('OCSync4Diagnostico')) {
    return { source, changed: false };
  }
  if (!source.includes(anchor)) {
    throw new Error('BUG-V895-3 anchor not found in src/yparty-piloto.js');
  }
  const helper = [
    "  function leerDiagnosticoSeguro() {",
    "    const y = typeof window !== 'undefined' ? window.OCYjs : null;",
    "    const role = (typeof window !== 'undefined' && window.OCAuth && typeof window.OCAuth.rolActual === 'function')",
    "      ? String(window.OCAuth.rolActual() || '').trim().toLowerCase() : null;",
    "    const activo20 = Boolean(y && y.modoCorte20Activo === true);",
    "    const coordMode = (y && y.coordinadorCorte20 && typeof y.coordinadorCorte20.mode === 'function')",
    "      ? y.coordinadorCorte20.mode() : null;",
    "    const rutaEfectiva = activo20 && coordMode === 'active-2.0'",
    "      ? 'sync4-a-2.0'",
    "      : (coordMode === 'failback-legacy-1.0' ? 'sync4-c-peer-idb' : 'legacy-privado-aislado');",
    "    return Object.freeze({",
    "      motor: 'sync4',",
    "      rutaEfectiva,",
    "      modoCorte20Activo: activo20,",
    "      coordMode,",
    "      rol: role || null,",
    "      host,",
    "      privadoExpuesto: false",
    "    });",
    "  }",
    "  if (typeof window !== 'undefined') {",
    "    window.OCSync4Diagnostico = leerDiagnosticoSeguro;",
    "  }",
    "  return {",
    "    diagnostico: leerDiagnosticoSeguro,"
  ].join('\n');

  const returnAnchor = "  return {\n    // PORT2 C23/C16b-store: durable IndexedDB store factory isolated by SHA-256";
  if (!source.includes(returnAnchor)) {
    throw new Error('BUG-V895-3 return anchor not found in src/yparty-piloto.js');
  }
  return {
    source: source.replace(returnAnchor, helper + '\n' + anchor),
    changed: true
  };
}

function patchIndexHtmlDeferredBoot(htmlSource) {
  const deferredSet = new Set(cargaTardia.listarDiferidos());
  let removedCount = 0;
  const out = htmlSource.replace(
    /^[ \t]*<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>[ \t]*\r?\n?/gm,
    (fullMatch, src) => {
      if (deferredSet.has(src)) {
        removedCount++;
        return '';
      }
      return fullMatch;
    }
  );
  return { source: out, changed: removedCount > 0, removedCount };
}

function buildCargaTardiaV2Source() {
  return fs.readFileSync(path.join(__dirname, 'carga-tardia-v2.js'), 'utf8');
}

module.exports = {
  patchReadOnlyCatalogSalaVaciaEmptyRoots,
  patchSyncRealtimeAllowColdDevicePause,
  patchYpartyPilotoDiagnostico,
  patchIndexHtmlDeferredBoot,
  buildCargaTardiaV2Source
};
