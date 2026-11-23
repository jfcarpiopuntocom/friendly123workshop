import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateScopeLock } = require('../src/verify-scope-lock.cjs');
const PATCH_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'patches-v895');

function extractPatchTargets(patchPath) {
  const txt = fs.readFileSync(patchPath, 'utf8');
  return [...txt.matchAll(/^\+\+\+ b\/(.+)$/gm)].map(m => m[1].trim());
}

test('Scope Lock C214: patches 01, 02, 03, 06 pass cleanly; mixing C215 boot/i18n or Sync3/scores FAILS', () => {
  const patchDir = PATCH_DIR;
  const c214Files = [
    ...extractPatchTargets(path.join(patchDir, '01-v895-readonly-catalog-salavacia-empty-roots.patch')),
    ...extractPatchTargets(path.join(patchDir, '02-v895-sync-realtime-allow-cold-device-pause.patch')),
    ...extractPatchTargets(path.join(patchDir, '03-v895-yparty-piloto-ruta-efectiva-diagnostico.patch')),
    ...extractPatchTargets(path.join(patchDir, '06-v895-auth-ui-admin-central-verify-and-logout-wipe.patch')),
    ...extractPatchTargets(path.join(patchDir, '07-v897-sync-yjs-unblock-pilot-and-online-retry.patch')),
    'docs/version.json',
    'docs/sw.js',
    'test/p0-c214-sync4.test.mjs'
  ];
  const passRes = validateScopeLock({ cut: 'C218', files: c214Files });
  assert.equal(passRes.ok, true, `C218 valid files rejected: ${JSON.stringify(passRes.violations)}`);

  // Scope creep checks: mixing C215 i18n/carga-tardia, Sync3, CSS, or score files MUST FAIL!
  const creepRes = validateScopeLock({
    cut: 'C214',
    files: [
      'docs/auth-ui.js',
      'docs/i18n.js',
      'docs/carga-tardia.js',
      'src/sync3-silent-cascade.mjs',
      'docs/engineering/architecture-2-quality-score.json',
      'docs/ui2.css'
    ]
  });
  assert.equal(creepRes.ok, false);
  assert.equal(creepRes.violations.length, 5, 'All 5 out-of-scope/frozen files must be blocked');
});

test('Scope Lock C215: patches 04 & 05 + sync-rollout.json pass cleanly; touching auth/sync/worker FAILS', () => {
  const patchDir = PATCH_DIR;
  const c215Files = [
    ...extractPatchTargets(path.join(patchDir, '04-v895-carga-tardia-40pct-boot.patch')),
    ...extractPatchTargets(path.join(patchDir, '05-v895-i18n-es-lazy-split.patch')),
    'docs/sync-rollout.json',
    'docs/version.json',
    'test/p0-c215-boot-budget.test.mjs'
  ];
  const passRes = validateScopeLock({ cut: 'C215', files: c215Files });
  assert.equal(passRes.ok, true, `C215 valid files rejected: ${JSON.stringify(passRes.violations)}`);

  const creepRes = validateScopeLock({
    cut: 'C215',
    files: ['docs/index.html', 'docs/auth-ui.js', 'src/yparty-piloto.js', 'cloudflare-worker/team-authority.mjs']
  });
  assert.equal(creepRes.ok, false);
  assert.equal(creepRes.violations.length, 3);
});

test('Scope Lock C213: rejects any new runtime feature changes (freeze 17131947 for merge & deploy only)', () => {
  const passRes = validateScopeLock({ cut: 'C213', files: ['test/p0-c210-reenganche.test.cjs'] });
  assert.equal(passRes.ok, true);

  const failRes = validateScopeLock({ cut: 'C213', files: ['docs/auth-ui.js', 'docs/carga-tardia.js', 'src/yparty-piloto.js'] });
  assert.equal(failRes.ok, false);
  assert.equal(failRes.violations.length, 3);
});
