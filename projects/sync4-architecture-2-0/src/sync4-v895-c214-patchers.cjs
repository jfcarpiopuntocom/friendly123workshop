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

function patchI18nSplitEs(i18nSource) {
  const esStartRe = /^[ \t]*es:\s*\{[ \t]*\r?\n/m;
  const startMatch = esStartRe.exec(i18nSource);
  if (!startMatch) {
    throw new Error('i18n es dictionary start anchor not found in docs/i18n.js');
  }
  const openBraceIdx = i18nSource.indexOf('{', startMatch.index);
  let depth = 0, inStr = false, quote = '', esc = false, closeBraceIdx = -1;
  for (let i = openBraceIdx; i < i18nSource.length; i++) {
    const ch = i18nSource[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '/' && i18nSource[i + 1] === '/') {
      const nl = i18nSource.indexOf('\n', i);
      i = nl === -1 ? i18nSource.length : nl;
      continue;
    }
    if (ch === '/' && i18nSource[i + 1] === '*') {
      const endC = i18nSource.indexOf('*/', i + 2);
      i = endC === -1 ? i18nSource.length : endC + 1;
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { closeBraceIdx = i; break; }
    }
  }
  if (closeBraceIdx <= openBraceIdx) {
    throw new Error('i18n es dictionary closing brace not found');
  }
  const esObjectLiteral = i18nSource.slice(openBraceIdx, closeBraceIdx + 1);
  const esModuleSource = [
    '// i18n-es.js — Spanish dictionary split for <=40% JS startup budget (C214).',
    '// Loaded lazily on demand or at startup when active language is "es"; cached in sw.js SHELL.',
    '(function () {',
    '  "use strict";',
    '  const ES = ' + esObjectLiteral + ';',
    '  if (typeof window !== "undefined" && window.OCI18n && typeof window.OCI18n.registrarEs === "function") {',
    '    window.OCI18n.registrarEs(ES);',
    '  } else if (typeof window !== "undefined") {',
    '    window.__OCI18nEsPending = ES;',
    '  }',
    '})();',
    ''
  ].join('\n');

  let slimI18n = i18nSource.slice(0, openBraceIdx) + '{}' + i18nSource.slice(closeBraceIdx + 1);

  const setLangTarget =
    '  function setLang(l) {\n' +
    '    lang = l === "es" ? "es" : "en";\n' +
    '    try { localStorage.setItem(LS_KEY, lang); } catch (_) {}\n' +
    '    document.documentElement.lang = lang;\n' +
    '    applyStatic();\n' +
    '    // Las vistas dinámicas escuchan esto para re-renderizar en el nuevo idioma.\n' +
    '    window.dispatchEvent(new CustomEvent("oc-lang-change", { detail: { lang } }));\n' +
    '  }';

  const setLangReplacement = [
    '  let _esCargado = false;',
    '  let _esCargando = false;',
    '  function registrarEs(dic) {',
    '    if (!dic || typeof dic !== "object") return;',
    '    Object.assign(DICT.es, dic);',
    '    _esCargado = true;',
    '    _esCargando = false;',
    '    if (lang === "es") {',
    '      try { applyStatic(); } catch (_) {}',
    '      try { window.dispatchEvent(new CustomEvent("oc-lang-change", { detail: { lang } })); } catch (_) {}',
    '    }',
    '  }',
    '  function cargarEsSiHaceFalta() {',
    '    if (_esCargado || _esCargando) return;',
    '    if (typeof window !== "undefined" && window.__OCI18nEsPending) {',
    '      const pending = window.__OCI18nEsPending;',
    '      delete window.__OCI18nEsPending;',
    '      registrarEs(pending);',
    '      return;',
    '    }',
    '    _esCargando = true;',
    '    if (typeof window !== "undefined" && window.OCCargaTardia && typeof window.OCCargaTardia.asegurar === "function") {',
    '      window.OCCargaTardia.asegurar("i18nEs").catch(function () { _esCargando = false; });',
    '      return;',
    '    }',
    '    if (typeof document !== "undefined" && document.createElement) {',
    '      const s = document.createElement("script");',
    '      s.src = "./i18n-es.min.js";',
    '      s.async = false;',
    '      s.onerror = function () { _esCargando = false; };',
    '      (document.head || document.documentElement).appendChild(s);',
    '    } else {',
    '      _esCargando = false;',
    '    }',
    '  }',
    '  function setLang(l) {',
    '    lang = l === "es" ? "es" : "en";',
    '    try { localStorage.setItem(LS_KEY, lang); } catch (_) {}',
    '    document.documentElement.lang = lang;',
    '    if (lang === "es" && !_esCargado) cargarEsSiHaceFalta();',
    '    applyStatic();',
    '    // Las vistas dinámicas escuchan esto para re-renderizar en el nuevo idioma.',
    '    window.dispatchEvent(new CustomEvent("oc-lang-change", { detail: { lang } }));',
    '  }'
  ].join('\n');

  if (!slimI18n.includes(setLangTarget)) {
    throw new Error('i18n setLang anchor not found in docs/i18n.js');
  }
  slimI18n = slimI18n.replace(setLangTarget, setLangReplacement);

  const exportTarget = '  window.OCI18n = { t, tf, setLang, getLang, locale, applyStatic, DICT };';
  const exportReplacement =
    '  window.OCI18n = { t, tf, setLang, getLang, locale, applyStatic, registrarEs, cargarEsSiHaceFalta, DICT };\n' +
    '  if (lang === "es") cargarEsSiHaceFalta();';
  if (!slimI18n.includes(exportTarget)) {
    throw new Error('i18n export anchor not found in docs/i18n.js');
  }
  slimI18n = slimI18n.replace(exportTarget, exportReplacement);

  return { i18nSource: slimI18n, i18nEsSource: esModuleSource, changed: true };
}

function patchSwAddI18nEs(swSource) {
  if (swSource.includes('./i18n-es.min.js')) return { source: swSource, changed: false };
  const anchor = '"./i18n.min.js",';
  if (!swSource.includes(anchor)) {
    throw new Error('sw.js ./i18n.min.js anchor not found');
  }
  return {
    source: swSource.replace(anchor, '"./i18n.min.js",\n  "./i18n-es.min.js",'),
    changed: true
  };
}

function patchAuthUiAdminVerifyAndLogoutWipe(source) {
  let out = source;
  let changed = false;

  const verifyTarget =
    '    if ((!rolHash || rolHash === "empleado") && dispositivoApropiado() && central !== "owner" &&';
  const verifyReplacement =
    '    window.__f123CentralTeamPrincipal = null;\n' +
    '    if ((!rolHash || rolHash === "empleado" || rolHash === "admin") && dispositivoApropiado() && central !== "owner" &&';
  if (!out.includes('rolHash === "admin") && dispositivoApropiado()')) {
    if (!out.includes(verifyTarget)) {
      throw new Error('BUG-V895-6 verify anchor not found in docs/auth-ui.js');
    }
    out = out.replace(verifyTarget, verifyReplacement);
    changed = true;
  }

  const revokeTarget =
    '            if (rTeam && rTeam.status === 429) { error("Acceso bloqueado temporalmente por seguridad."); return; }\n' +
    '            const dTeam = rTeam && rTeam.ok ? await rTeam.json().catch(() => null) : null;';
  const revokeReplacement =
    '            if (rTeam && rTeam.status === 429) { error("Acceso bloqueado temporalmente por seguridad."); return; }\n' +
    '            const dTeam = rTeam ? await rTeam.json().catch(() => null) : null;\n' +
    '            if (rTeam && rTeam.status === 403 && dTeam && dTeam.reason === "team-not-verified" &&\n' +
    '                (rolHash === "admin" || rolHash === "empleado")) {\n' +
    '              error("Este PIN de equipo fue reemplazado o desactivado en el panel JFC.");\n' +
    '              return;\n' +
    '            }';
  if (!out.includes('dTeam.reason === "team-not-verified"')) {
    if (!out.includes(revokeTarget)) {
      throw new Error('BUG-V895-6 revoke anchor not found in docs/auth-ui.js');
    }
    out = out.replace(revokeTarget, revokeReplacement);
    changed = true;
  }

  const logoutTarget =
    '    window.OCCurrentUser = null; // borrar sesion de encargado nombrado\n' +
    '    window.OCCurrentArtista = null; // benchmark #6';
  const logoutReplacement =
    '    window.OCCurrentUser = null; // borrar sesion de encargado nombrado\n' +
    '    window.OCCurrentArtista = null; // benchmark #6\n' +
    '    window.__f123CentralTeamPrincipal = null; // C214: wipe central team principal on logout';
  if (!out.includes('window.__f123CentralTeamPrincipal = null; // C214')) {
    if (!out.includes(logoutTarget)) {
      throw new Error('BUG-V895-6 logout anchor not found in docs/auth-ui.js');
    }
    out = out.replace(logoutTarget, logoutReplacement);
    changed = true;
  }

  return { source: out, changed };
}

function patchSyncYjsUnblockPilotAndRetry(source) {
  let out = source;
  let changed = false;

  const t1 = 'var sync4Direct = !!(API.rollout && (API.rollout.sync4 === true || API.rollout.frozenHead === "sala-vacia"));';
  const r1 = 'var sync4Direct = !!(API.rollout && (API.rollout.yparty === true || API.rollout.sync4 === true || API.rollout.frozenHead === "sala-vacia"));';
  if (!out.includes(r1)) {
    if (!out.includes(t1)) throw new Error('BUG-V897-7a sync4Direct anchor not found in docs/sync-yjs.js');
    out = out.replace(t1, r1);
    changed = true;
  }

  const t2 =
    '        if (API.modoCorte20Activo !== true && API.coordinadorCorte20) {\n' +
    '          _intentarActivarCorte20SiElegible();\n' +
    '        }';
  const r2 =
    '        if (API.modoCorte20Activo !== true) {\n' +
    '          _intentarActivarCorte20SiElegible();\n' +
    '        }';
  if (!out.includes(r2)) {
    if (!out.includes(t2)) throw new Error('BUG-V897-7b visibility retry anchor not found in docs/sync-yjs.js');
    out = out.replace(t2, r2);
    changed = true;
  }

  const t3 = '    window.addEventListener("oc-login", _intentarActivarCorte20SiElegible);';
  const r3 =
    '    window.addEventListener("oc-login", _intentarActivarCorte20SiElegible);\n' +
    '    window.addEventListener("online", _intentarActivarCorte20SiElegible);';
  if (!out.includes('window.addEventListener("online", _intentarActivarCorte20SiElegible);')) {
    if (!out.includes(t3)) throw new Error('BUG-V897-7c online retry anchor not found in docs/sync-yjs.js');
    out = out.replace(t3, r3);
    changed = true;
  }

  return { source: out, changed };
}

/**
 * Patch 08 (targets 94096dde:cloudflare-worker/pin-worker-api.mjs):
 * C218 allowed a brand-new device (not yet in inst:<id>) to pass /pin/verify via verify-unmatched,
 * but stripped instanceId and never persisted inst:<id> in the DO — causing /ws/ticket to fail
 * 1 second later with 403 license-instance-mismatch!
 * Fix: pass instanceId to verify-unmatched; ONLY after p.verify() returns ok:true on a non-factory
 * central Owner PIN, auto-register inst:<instanceId> if absent (never overwriting a bloqueada row).
 */
function patchPinWorkerAutoRegisterVerifiedInstance(source) {
  let out = source;
  let changed = false;

  const t1 =
    '    const fabrica=body.pin==="789"||body.pin==="456";\n' +
    '    r=stored&&!fabrica?await p.verify(body.licenseCode,body.pin,body.pinTs)\n' +
    '     :stored?{ok:false,reason:"license-instance-mismatch"}\n' +
    '     :(obs&&obs.devices&&Object.keys(obs.devices).length)?{ok:false,reason:"factory-pin-retired"}:{ok:false,reason:"unconfigured"};';
  const r1 =
    '    const fabrica=body.pin==="789"||body.pin==="456";\n' +
    '    r=stored&&!fabrica?await p.verify(body.licenseCode,body.pin,body.pinTs)\n' +
    '     :stored?{ok:false,reason:"license-instance-mismatch"}\n' +
    '     :(obs&&obs.devices&&Object.keys(obs.devices).length)?{ok:false,reason:"factory-pin-retired"}:{ok:false,reason:"unconfigured"};\n' +
    '    if(r&&r.ok===true&&INSTANCE.test(body.instanceId||"")){\n' +
    '     const instKey="inst:"+body.instanceId;\n' +
    '     const prev=await storage.get(instKey);\n' +
    '     if(!prev){await storage.put(instKey,{instanceId:body.instanceId,licenseCode:l,estado:"activa",origen:"central-pin-verify",createdAt:Date.now()});}\n' +
    '    }';
  if (!out.includes('origen:"central-pin-verify"')) {
    if (!out.includes(t1)) throw new Error('BUG-C218-8a verify-unmatched anchor not found in cloudflare-worker/pin-worker-api.mjs');
    out = out.replace(t1, r1);
    changed = true;
  }

  const t2 = ' if(unmatched)data={licenseCode,pin:String(data.pin||"")};';
  const r2 = ' if(unmatched)data={licenseCode,instanceId,pin:String(data.pin||"")};';
  if (!out.includes(r2)) {
    if (!out.includes(t2)) throw new Error('BUG-C218-8b unmatched payload anchor not found in cloudflare-worker/pin-worker-api.mjs');
    out = out.replace(t2, r2);
    changed = true;
  }

  return { source: out, changed };
}

module.exports = {
  patchReadOnlyCatalogSalaVaciaEmptyRoots,
  patchSyncRealtimeAllowColdDevicePause,
  patchYpartyPilotoDiagnostico,
  patchIndexHtmlDeferredBoot,
  buildCargaTardiaV2Source,
  patchI18nSplitEs,
  patchSwAddI18nEs,
  patchAuthUiAdminVerifyAndLogoutWipe,
  patchSyncYjsUnblockPilotAndRetry,
  patchPinWorkerAutoRegisterVerifiedInstance
};
