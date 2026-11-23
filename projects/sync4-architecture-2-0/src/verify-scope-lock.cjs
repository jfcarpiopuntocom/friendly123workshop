'use strict';
const cp = require('node:child_process');

/**
 * Automated Scope-Lock Enforcer for friendly-123 (C213 -> C214 -> C215).
 * Prevents scope creep / parallel fronts by validating every changed file against
 * the closed allowlist of the active cut and rejecting permanently frozen fronts.
 */

const FROZEN_PATTERNS = [
  { re: /^docs\/engineering\/architecture-2-(port|quality)-score/i, reason: 'Frozen front: synthetic score/metric files forbidden during release stabilization' },
  { re: /^scripts\/architecture-2-port-score/i, reason: 'Frozen front: synthetic score scripts forbidden' },
  { re: /^src\/sync3-silent-cascade\.mjs$/i, reason: 'Frozen front (S18): Sync3 rehabilitation prohibited' },
  { re: /incident-v608/i, reason: 'Frozen front (S18): legacy Sync3 v608 recovery prohibited' },
  { re: /^docs\/ui2\.css$/i, reason: 'Frozen front: CSS/UI redesign forbidden inside Sync4 cuts' }
];

const SEAL_FILES = [
  'docs/version.json',
  'docs/sw.js',
  'docs/dashboard.html',
  'docs/version-manifest.json',
  '.github/workflows/qa-port2-v785-shell-seal.yml'
];

const CUT_ALLOWLISTS = Object.freeze({
  C213: {
    title: 'Publish v0.8.95 (17131947) and deploy Workers — zero new runtime fronts',
    exact: new Set([
      ...SEAL_FILES
    ]),
    prefixes: ['test/'],
    forbiddenExplicit: [
      { re: /^docs\/(carga-tardia|i18n|sync-rollout|auth-ui|sync-yjs|sync-realtime)/i, reason: 'C213 is code-frozen (17131947); merge and deploy only, move new fixes to C214/C215' },
      { re: /^src\//i, reason: 'C213 is code-frozen (17131947); move new runtime fixes to C214' }
    ]
  },
  C214: {
    title: 'v0.8.98 (C218/C214) Sync4 correctness only (patches 01, 02, 03, 06, 07) — zero boot/i18n/rollout mixing',
    exact: new Set([
      'src/port2-readonly-catalog-session.mjs',
      'docs/sync-realtime.js',
      'docs/sync-realtime.min.js',
      'docs/sync-yjs.js',
      'docs/sync-yjs.min.js',
      'src/yparty-piloto.js',
      'docs/vendor/yparty-piloto.min.js',
      'docs/auth-ui.js',
      'docs/auth-ui.min.js',
      'docs/index.html',
      ...SEAL_FILES
    ]),
    prefixes: ['test/'],
    forbiddenExplicit: [
      { re: /^docs\/(carga-tardia|i18n|i18n-es|sync-rollout)/i, reason: 'Belongs strictly to C219/C215 — do NOT mix boot/i18n/rollout into Sync4 correctness cut' }
    ]
  },
  C215: {
    title: 'v0.8.99 (C219/C215) Client store rollout + <=40% JS boot (patches 04, 05) — zero Sync4 auth/runtime edits',
    exact: new Set([
      'docs/index.html',
      'docs/carga-tardia.js',
      'docs/carga-tardia.min.js',
      'docs/i18n.js',
      'docs/i18n.min.js',
      'docs/i18n-es.js',
      'docs/i18n-es.min.js',
      'docs/sync-rollout.json',
      ...SEAL_FILES
    ]),
    prefixes: ['test/'],
    forbiddenExplicit: [
      { re: /^docs\/(auth-ui|sync-yjs|sync-realtime)/i, reason: 'Sync4 runtime frozen in C219/C215 — auth/sync edits belong only to C218/C214' },
      { re: /^(src|cloudflare-worker|cloudflare-yparty-worker)\//i, reason: 'Runtime/Worker code frozen in C219/C215' }
    ]
  }
});

// Live release-number aliases (C216=v0.8.96 merged, C217=v0.8.97 open, C218=Sync4 correctness, C219=Rollout+40% boot)
const CUT_ALIASES = Object.freeze({
  C217: 'C213',
  C218: 'C214',
  C219: 'C215'
});

function normalizePath(p) {
  return String(p || '').trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function validateScopeLock({ cut, files }) {
  const rawCutKey = String(cut || '').trim().toUpperCase();
  const cutKey = CUT_ALIASES[rawCutKey] || rawCutKey;
  const spec = CUT_ALLOWLISTS[cutKey];
  if (!spec) {
    return { ok: false, cut: rawCutKey, violations: [{ file: '*', reason: `Unknown cut "${cut}". Allowed: C213/C217, C214/C218, C215/C219` }] };
  }
  const normalized = (files || []).map(normalizePath).filter(Boolean);
  const violations = [];

  for (const file of normalized) {
    const frozenHit = FROZEN_PATTERNS.find(f => f.re.test(file));
    if (frozenHit) {
      violations.push({ file, reason: frozenHit.reason });
      continue;
    }
    const explicitDeny = (spec.forbiddenExplicit || []).find(f => f.re.test(file));
    if (explicitDeny) {
      violations.push({ file, reason: explicitDeny.reason });
      continue;
    }
    const allowedExact = spec.exact.has(file);
    const allowedPrefix = spec.prefixes.some(pre => file.startsWith(pre));
    if (!allowedExact && !allowedPrefix) {
      violations.push({ file, reason: `Out of ${cutKey} allowlist ("${spec.title}")` });
    }
  }

  return {
    ok: violations.length === 0,
    cut: cutKey,
    title: spec.title,
    checkedCount: normalized.length,
    violations
  };
}

function getGitChangedFiles({ repo, base, head = 'HEAD' }) {
  const out = cp.execFileSync('git', ['-C', repo, 'diff', '--name-only', `${base}..${head}`], { encoding: 'utf8' });
  return out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : null;
  };
  const cut = getArg('--cut');
  const repo = getArg('--repo');
  const base = getArg('--base');
  const head = getArg('--head') || 'HEAD';
  const filesCsv = getArg('--files');

  const files = filesCsv
    ? filesCsv.split(',').map(s => s.trim()).filter(Boolean)
    : (repo && base ? getGitChangedFiles({ repo, base, head }) : []);

  const result = validateScopeLock({ cut, files });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

module.exports = { CUT_ALLOWLISTS, FROZEN_PATTERNS, validateScopeLock, getGitChangedFiles };
