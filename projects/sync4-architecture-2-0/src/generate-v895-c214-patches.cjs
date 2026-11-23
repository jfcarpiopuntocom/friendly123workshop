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
  buildCargaTardiaV2Source
} = require('./sync4-v895-c214-patchers.cjs');

const LIVE_REPO = 'C:\\00 Projects\\claude-f123\\friendly-123';
const BASE_COMMIT = 'f13c0a7d'; // origin/feat/c213-sync4-todos-roles-pin-panel (v0.8.95)
const OUT_DIR = path.join(__dirname, '..', 'patches-v895');

function gitShow(relPath) {
  return cp.execFileSync('git', ['-C', LIVE_REPO, 'show', `${BASE_COMMIT}:${relPath}`], { encoding: 'utf8' });
}

function makeUnifiedPatch(files) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-c214-patch-'));
  try {
    cp.execFileSync('git', ['init', '-q'], { cwd: tmp });
    for (const f of files) {
      const p = path.join(tmp, f.relPath);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, f.before, 'utf8');
    }
    cp.execFileSync('git', ['add', '.'], { cwd: tmp });
    cp.execFileSync('git', ['-c', 'user.name=Builder', '-c', 'user.email=builder@local', 'commit', '-q', '-m', 'base'], { cwd: tmp });
    for (const f of files) {
      fs.writeFileSync(path.join(tmp, f.relPath), f.after, 'utf8');
    }
    return cp.execFileSync('git', ['diff', '--no-ext-diff', '--binary'], { cwd: tmp, encoding: 'utf8' });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const specs = [
  {
    name: '01-v895-readonly-catalog-salavacia-empty-roots.patch',
    files: [
      {
        relPath: 'src/port2-readonly-catalog-session.mjs',
        transform: patchReadOnlyCatalogSalaVaciaEmptyRoots
      }
    ]
  },
  {
    name: '02-v895-sync-realtime-allow-cold-device-pause.patch',
    files: [
      {
        relPath: 'docs/sync-realtime.js',
        transform: patchSyncRealtimeAllowColdDevicePause
      }
    ]
  },
  {
    name: '03-v895-yparty-piloto-ruta-efectiva-diagnostico.patch',
    files: [
      {
        relPath: 'src/yparty-piloto.js',
        transform: patchYpartyPilotoDiagnostico
      }
    ]
  },
  {
    name: '04-v895-carga-tardia-40pct-boot.patch',
    files: [
      {
        relPath: 'docs/index.html',
        transform: patchIndexHtmlDeferredBoot
      },
      {
        relPath: 'docs/carga-tardia.js',
        transform: () => ({ source: buildCargaTardiaV2Source(), changed: true })
      }
    ]
  }
];

for (const spec of specs) {
  const pairs = spec.files.map(f => {
    const before = gitShow(f.relPath);
    const res = f.transform(before);
    if (!res.changed) throw new Error(`Expected change for ${f.relPath} in ${spec.name}`);
    return { relPath: f.relPath, before, after: res.source };
  });
  const patchText = makeUnifiedPatch(pairs);
  const outPath = path.join(OUT_DIR, spec.name);
  fs.writeFileSync(outPath, patchText, 'utf8');
  console.log(`GENERATED_C214_ON_${BASE_COMMIT} ${spec.name} (${Buffer.byteLength(patchText, 'utf8')} B)`);
}
