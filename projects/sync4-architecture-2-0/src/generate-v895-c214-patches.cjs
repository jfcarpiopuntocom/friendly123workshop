'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const {
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
} = require('./sync4-v895-c214-patchers.cjs');

const LIVE_REPO = 'C:\\00 Projects\\claude-f123\\friendly-123';
const BASE_COMMIT = 'be33ccbf'; // merged origin/master = origin/estable (v0.8.97)
const C218_WORKER_COMMIT = '94096dde'; // origin/fix/c218-pin-aparato-nuevo
const OUT_DIR = path.join(__dirname, '..', 'patches-v895');

function gitShow(relPath, rev = BASE_COMMIT) {
  return cp.execFileSync('git', ['-C', LIVE_REPO, 'show', `${rev}:${relPath}`], { encoding: 'utf8' });
}

function makeUnifiedPatch(files) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-c214-patch-'));
  try {
    cp.execFileSync('git', ['init', '-q'], { cwd: tmp });
    for (const f of files) {
      if (f.before === null) continue;
      const p = path.join(tmp, f.relPath);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, f.before, 'utf8');
    }
    cp.execFileSync('git', ['add', '.'], { cwd: tmp });
    cp.execFileSync('git', ['-c', 'user.name=Builder', '-c', 'user.email=builder@local', 'commit', '-q', '-m', 'base'], { cwd: tmp });
    for (const f of files) {
      const p = path.join(tmp, f.relPath);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, f.after, 'utf8');
      if (f.before === null) cp.execFileSync('git', ['add', '-N', f.relPath], { cwd: tmp });
    }
    return cp.execFileSync('git', ['diff', '--no-ext-diff', '--binary'], { cwd: tmp, encoding: 'utf8' });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const i18nBase = gitShow('docs/i18n.js');
const i18nSplit = patchI18nSplitEs(i18nBase);

const specs = [
  {
    name: '01-v895-readonly-catalog-salavacia-empty-roots.patch',
    pairs: () => {
      const before = gitShow('src/port2-readonly-catalog-session.mjs');
      const res = patchReadOnlyCatalogSalaVaciaEmptyRoots(before);
      return [{ relPath: 'src/port2-readonly-catalog-session.mjs', before, after: res.source }];
    }
  },
  {
    name: '02-v895-sync-realtime-allow-cold-device-pause.patch',
    pairs: () => {
      const before = gitShow('docs/sync-realtime.js');
      const res = patchSyncRealtimeAllowColdDevicePause(before);
      return [{ relPath: 'docs/sync-realtime.js', before, after: res.source }];
    }
  },
  {
    name: '03-v895-yparty-piloto-ruta-efectiva-diagnostico.patch',
    pairs: () => {
      const before = gitShow('src/yparty-piloto.js');
      const res = patchYpartyPilotoDiagnostico(before);
      return [{ relPath: 'src/yparty-piloto.js', before, after: res.source }];
    }
  },
  {
    name: '04-v895-carga-tardia-40pct-boot.patch',
    pairs: () => {
      const idxBefore = gitShow('docs/index.html');
      const ctBefore = gitShow('docs/carga-tardia.js');
      return [
        { relPath: 'docs/index.html', before: idxBefore, after: patchIndexHtmlDeferredBoot(idxBefore).source },
        { relPath: 'docs/carga-tardia.js', before: ctBefore, after: buildCargaTardiaV2Source() }
      ];
    }
  },
  {
    name: '05-v895-i18n-es-lazy-split.patch',
    pairs: () => {
      const swBefore = gitShow('docs/sw.js');
      return [
        { relPath: 'docs/i18n.js', before: i18nBase, after: i18nSplit.i18nSource },
        { relPath: 'docs/i18n-es.js', before: null, after: i18nSplit.i18nEsSource },
        { relPath: 'docs/sw.js', before: swBefore, after: patchSwAddI18nEs(swBefore).source }
      ];
    }
  },
  {
    name: '06-v895-auth-ui-admin-central-verify-and-logout-wipe.patch',
    pairs: () => {
      const before = gitShow('docs/auth-ui.js');
      const res = patchAuthUiAdminVerifyAndLogoutWipe(before);
      return [{ relPath: 'docs/auth-ui.js', before, after: res.source }];
    }
  },
  {
    name: '07-v897-sync-yjs-unblock-pilot-and-online-retry.patch',
    pairs: () => {
      const before = gitShow('docs/sync-yjs.js');
      const res = patchSyncYjsUnblockPilotAndRetry(before);
      return [{ relPath: 'docs/sync-yjs.js', before, after: res.source }];
    }
  },
  {
    name: '08-c218-pin-worker-auto-register-verified-instance.patch',
    pairs: () => {
      const before = gitShow('cloudflare-worker/pin-worker-api.mjs', C218_WORKER_COMMIT);
      const res = patchPinWorkerAutoRegisterVerifiedInstance(before);
      return [{ relPath: 'cloudflare-worker/pin-worker-api.mjs', before, after: res.source }];
    }
  }
];

for (const spec of specs) {
  const pairs = spec.pairs();
  const patchText = makeUnifiedPatch(pairs);
  const outPath = path.join(OUT_DIR, spec.name);
  fs.writeFileSync(outPath, patchText, 'utf8');
  console.log(`GENERATED_C214_ON_${BASE_COMMIT} ${spec.name} (${Buffer.byteLength(patchText, 'utf8')} B)`);
}
