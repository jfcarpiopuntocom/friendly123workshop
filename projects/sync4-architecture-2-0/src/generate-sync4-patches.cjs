'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { patchYPartyPiloto, patchSyncYjs } = require('./sync4-all-roles-patcher.cjs');
const {
  patchTeamTicketParams,
  patchReadOnlyCatalogSession,
  patchWsWorkerApi,
  patchAuthUiCentralTeamPin,
  patchSyncYjsNonBlocking,
  patchTeamAuthorityPinOnlyVerify
} = require('./sync4-deep-patchers.cjs');

const LIVE_ROOT = process.argv[2] || 'C:/00 Projects/claude-f123/wt-multisala';
const PATCHES_DIR = path.join(__dirname, '../patches');
fs.mkdirSync(PATCHES_DIR, { recursive: true });

const JOBS = [
  { name: '01-yparty-piloto-sync4-all-roles.patch', rel: 'src/yparty-piloto.js', apply: patchYPartyPiloto },
  {
    name: '02-sync-yjs-sync4-all-roles-and-nonblocking.patch',
    rel: 'docs/sync-yjs.js',
    apply: (src) => {
      const s1 = patchSyncYjs(src);
      const s2 = patchSyncYjsNonBlocking(s1.source);
      return { changed: s1.changed || s2.changed, source: s2.source };
    }
  },
  { name: '03-app-inline-01-post-pin-boot.patch', rel: 'src/app/app-inline-01.js', apply: require('./post-pin-boot-guard.cjs').applyPatchToSource },
  { name: '04-business-read-model-perf.patch', rel: 'docs/core/business-read-model.js', apply: require('./business-read-model-fast.cjs').applyPatchToSource },
  { name: '05-mock-backend-hoy-index.patch', rel: 'docs/mock-backend.js', apply: require('./mock-backend-hoy-index.cjs').applyPatchToSource },
  { name: '06-ws-team-ticket-cat-read.patch', rel: 'src/ws-team-ticket-params.mjs', apply: patchTeamTicketParams },
  { name: '07-readonly-catalog-team-salavacia.patch', rel: 'src/port2-readonly-catalog-session.mjs', apply: patchReadOnlyCatalogSession },
  { name: '08-ws-worker-api-default-team-grants.patch', rel: 'cloudflare-worker/ws-worker-api.mjs', apply: patchWsWorkerApi },
  { name: '09-auth-ui-central-team-pin.patch', rel: 'docs/auth-ui.js', apply: patchAuthUiCentralTeamPin },
  { name: '10-team-authority-pin-only-verify.patch', rel: 'cloudflare-worker/team-authority.mjs', apply: patchTeamAuthorityPinOnlyVerify }
];

// Clean stale patch filenames if replaced
for (const oldFile of fs.readdirSync(PATCHES_DIR)) {
  if (oldFile.endsWith('.patch') && !JOBS.some(j => j.name === oldFile)) {
    fs.unlinkSync(path.join(PATCHES_DIR, oldFile));
  }
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-sync4-deep-'));
try {
  for (const job of JOBS) {
    const orig = fs.readFileSync(path.join(LIVE_ROOT, job.rel), 'utf8');
    const { changed, source: next } = job.apply(orig);
    if (!changed) throw new Error('Patcher produced no change for ' + job.rel);
    const aPath = path.join(tmpDir, 'a_' + path.basename(job.rel));
    const bPath = path.join(tmpDir, 'b_' + path.basename(job.rel));
    fs.writeFileSync(aPath, orig, 'utf8');
    fs.writeFileSync(bPath, next, 'utf8');
    const res = spawnSync('git', ['diff', '--no-index', '--unified=3', aPath, bPath], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    });
    if (res.status !== 1 || !res.stdout) throw new Error(`git diff failed for ${job.rel}`);
    const normalized = res.stdout
      .replace(new RegExp('^diff --git .*$', 'm'), `diff --git a/${job.rel} b/${job.rel}`)
      .replace(new RegExp('^--- .*$', 'm'), `--- a/${job.rel}`)
      .replace(new RegExp('^\\+\\+\\+ .*$', 'm'), `+++ b/${job.rel}`);
    fs.writeFileSync(path.join(PATCHES_DIR, job.name), normalized, 'utf8');
    console.log(`GENERATED ${job.name} (${Buffer.byteLength(normalized, 'utf8')} B)`);
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
