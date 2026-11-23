'use strict';
/**
 * Generates clean unified patches directly against LIVE friendly-123 origin/master
 * (default: v0.8.94 SHA 9fe50b58, which already includes C212 post-PIN + Hoy perf).
 *
 * Usage:
 *   node generate-sync4-patches.cjs [repoPath] [gitRef]
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync, execFileSync } = require('node:child_process');
const { patchYPartyPiloto, patchSyncYjs } = require('./sync4-all-roles-patcher.cjs');
const {
  patchTeamTicketParams,
  patchReadOnlyCatalogSession,
  patchWsWorkerApi,
  patchAuthUiCentralTeamPin,
  patchSyncYjsNonBlocking,
  patchTeamAuthorityPinOnlyVerify
} = require('./sync4-deep-patchers.cjs');

const LIVE_REPO = process.argv[2] || 'C:/00 Projects/claude-f123/friendly-123';
const TARGET_REF = process.argv[3] || '9fe50b58';
const PATCHES_DIR = path.join(__dirname, '../patches');
fs.mkdirSync(PATCHES_DIR, { recursive: true });

// 7 clean Sync4 patches on top of v0.8.94 (9fe50b58) — C212 already merged post-PIN & Hoy perf!
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
  { name: '03-ws-team-ticket-cat-read.patch', rel: 'src/ws-team-ticket-params.mjs', apply: patchTeamTicketParams },
  { name: '04-readonly-catalog-team-salavacia.patch', rel: 'src/port2-readonly-catalog-session.mjs', apply: patchReadOnlyCatalogSession },
  { name: '05-ws-worker-api-default-team-grants.patch', rel: 'cloudflare-worker/ws-worker-api.mjs', apply: patchWsWorkerApi },
  { name: '06-auth-ui-central-team-pin.patch', rel: 'docs/auth-ui.js', apply: patchAuthUiCentralTeamPin },
  { name: '07-team-authority-pin-only-verify.patch', rel: 'cloudflare-worker/team-authority.mjs', apply: patchTeamAuthorityPinOnlyVerify }
];

for (const oldFile of fs.readdirSync(PATCHES_DIR)) {
  if (oldFile.endsWith('.patch') && !JOBS.some(j => j.name === oldFile)) {
    fs.unlinkSync(path.join(PATCHES_DIR, oldFile));
  }
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'f123-sync4-v0894-'));
try {
  for (const job of JOBS) {
    const orig = execFileSync('git', ['-C', LIVE_REPO, 'show', `${TARGET_REF}:${job.rel}`], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024
    });
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
    console.log(`GENERATED_ON_${TARGET_REF} ${job.name} (${Buffer.byteLength(normalized, 'utf8')} B)`);
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
