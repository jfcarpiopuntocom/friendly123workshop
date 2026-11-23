'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cargaTardia = require('./carga-tardia-v2.js');

const BASELINE_22NOV_BYTES = 3706265;
const TARGET_40PCT_BYTES = Math.floor(BASELINE_22NOV_BYTES * 0.40);

const CORE_PREPIN_SOURCES = ['auth-ui.js', 'mock-backend.js', 'sync-yjs.js', 'sync-realtime.js', 'i18n.js', 'estado-idb.js'];

const DEFERRED_GLOBAL_MAP = {
  './avanzado-extra.min.js': /\b(OCAvanzado|avanzadoExtra)\b/,
  './vista-perchas.min.js': /\b(OCVistaPerchas|vistaPerchas)\b/,
  './plan-pagos-ui.min.js': /\bOCPlanPagosUI\b/,
  './salud-app.js': /\bOCSaludApp\b/,
  './help-ui.min.js': /\bOCHelp\b/,
  './cartera.min.js': /\bOCCartera\b/,
  './pocketbase-client.min.js': /\b(PocketBase|OCPocketBase)\b/,
  './backup-scheduler.min.js': /\bOCBackupScheduler\b/,
  './vendor/minisearch.min.js': /\bMiniSearch\b/,
  './core/commission-history.js': /\bOCCommissionHistory\b/,
  './micelio-ui.min.js': /\bOCMicelioUI\b/,
  './commissions-by-person.js': /\bOCCommissionsByPerson\b/,
  './reconciliacion.min.js': /\bOCReconciliacion\b/,
  './novedades.min.js': /\bOCNovedades\b/,
  './geo-ping.min.js': /\bOCGeoPing\b/,
  './hechos.min.js': /\bOCHechos\b/,
  './artista.min.js': /\bOCArtista\b/,
  './borradores.min.js': /\bOCBorradores\b/,
  './respaldo-empleado.min.js': /\bOCRespaldoEmpleado\b/,
  './simon-config.min.js': /\bOCSimon\b/,
  './welcome-ui.min.js': /\bOCWelcome\b/,
  './vendor/ufuzzy.min.js': /\buFuzzy\b/,
  './lista-dinamica.min.js': /\bOCListaDinamica\b/,
  './micelio-vivo.min.js': /\bOCMicelioVivo\b/,
  './plan-pagos.min.js': /\bOCPlanPagos\b/,
  './ganchos-demo.js': /\bOCGanchosDemo\b/,
  './dashboard-broadcast.js': /\bOCDashboardBroadcast\b/,
  './percha-reposicion.min.js': /\bOCPerchaReposicion\b/,
  './caja-chica.js': /\bOCCajaChica\b/,
  './sales-audit-ui.js': /\bOCSalesAuditUI\b/,
  './telemetry.js': /\bOCTelemetry\b/,
  './audit-store.js': /\bOCAuditStore\b/
};

function stripJsCommentsSimple(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function measureDocsDir(docsDir) {
  const html = fs.readFileSync(path.join(docsDir, 'index.html'), 'utf8');
  const scripts = [];
  let inlineBytes = 0;

  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1], body = m[2];
    if (/ld\+json/i.test(attrs)) continue;
    const src = (attrs.match(/\bsrc=["']([^"']+)["']/) || [])[1];
    if (src) {
      if (/^https?:/.test(src)) continue;
      const fullPath = path.join(docsDir, src);
      scripts.push({ src, bytes: fs.existsSync(fullPath) ? fs.statSync(fullPath).size : 0, isMin: /\.min\.js$/i.test(src) });
    } else {
      inlineBytes += Buffer.byteLength(body, 'utf8');
    }
  }

  const deferredSet = new Set(cargaTardia.listarDiferidos());
  const loaderBytes = fs.statSync(path.join(__dirname, 'carga-tardia-v2.js')).size;
  const currentTotalBytes = scripts.reduce((s, x) => s + x.bytes, 0) + inlineBytes;
  const deferredScripts = scripts.filter(x => deferredSet.has(x.src));
  const keptScripts = scripts.filter(x => !deferredSet.has(x.src));
  const deferredBytes = deferredScripts.reduce((s, x) => s + x.bytes, 0);

  let unminifiedSavingsMeasured = 0;
  for (const s of keptScripts) {
    if (s.isMin) continue;
    const fullPath = path.join(docsDir, s.src);
    if (!fs.existsSync(fullPath)) continue;
    const strippedBytes = Buffer.byteLength(stripJsCommentsSimple(fs.readFileSync(fullPath, 'utf8')), 'utf8');
    unminifiedSavingsMeasured += Math.max(0, s.bytes - strippedBytes);
  }

  let i18nSecondaryDictBytes = 0;
  const i18nMinPath = path.join(docsDir, 'i18n.min.js');
  if (fs.existsSync(i18nMinPath)) {
    const i18nMin = fs.readFileSync(i18nMinPath, 'utf8');
    const esIdx = i18nMin.indexOf(',es:{');
    if (esIdx > 0) {
      let depth = 0, inStr = false, quote = '', esc = false, endIdx = -1;
      for (let i = esIdx + 4; i < i18nMin.length; i++) {
        const ch = i18nMin[i];
        if (inStr) {
          if (esc) { esc = false; continue; }
          if (ch === '\\') { esc = true; continue; }
          if (ch === quote) inStr = false;
          continue;
        }
        if (ch === '"' || ch === "'") { inStr = true; quote = ch; continue; }
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (depth === 0) { endIdx = i; break; } }
      }
      if (endIdx > esIdx) i18nSecondaryDictBytes = Buffer.byteLength(i18nMin.slice(esIdx, endIdx + 1), 'utf8');
    }
  }

  const afterDeferBytes = currentTotalBytes - deferredBytes + loaderBytes;
  const afterDeferAndMinifyBytes = afterDeferBytes - unminifiedSavingsMeasured - i18nSecondaryDictBytes;

  const coreText = CORE_PREPIN_SOURCES
    .map(f => path.join(docsDir, f))
    .filter(p => fs.existsSync(p))
    .map(p => fs.readFileSync(p, 'utf8'))
    .join('\n');

  const safetyViolations = [];
  for (const [src, regex] of Object.entries(DEFERRED_GLOBAL_MAP)) {
    if (deferredSet.has(src) && regex.test(coreText)) safetyViolations.push({ src, pattern: regex.source });
  }

  return {
    baseline22NovBytes: BASELINE_22NOV_BYTES,
    target40PctBytes: TARGET_40PCT_BYTES,
    currentTotalBytes,
    currentPctOfBaseline: +(currentTotalBytes / BASELINE_22NOV_BYTES * 100).toFixed(2),
    deferredScriptCount: deferredScripts.length,
    deferredBytes,
    unminifiedSavingsMeasured,
    i18nSecondaryDictBytes,
    afterDeferAndMinifyBytes,
    afterDeferAndMinifyPct: +(afterDeferAndMinifyBytes / BASELINE_22NOV_BYTES * 100).toFixed(2),
    meets40PctGoal: afterDeferAndMinifyBytes <= TARGET_40PCT_BYTES,
    safetyViolations
  };
}

module.exports = { BASELINE_22NOV_BYTES, TARGET_40PCT_BYTES, measureDocsDir };
