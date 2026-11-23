'use strict';
const path = require('node:path');
const cp = require('node:child_process');

/**
 * 1-command installer for C221 (v0.9.0 / f123-shell-v900 / golden436) onto friendly-123 (e48c63dd).
 * Applies the pre-built, manifest-sealed, release-control-verified atomic patch
 * (patches 01, 02, 03, 06, 07, 09, 10, 11 + esbuild .min.js + version seal + version-manifest.json)
 * and verifies Scope Lock C218/C221 with exit code 0.
 *
 * Usage:
 *   node apply-c221-v900.cjs --repo "C:\00 Projects\claude-f123\friendly-123"
 */

const args = process.argv.slice(2);
const idx = args.indexOf('--repo');
const repo = idx >= 0 ? args[idx + 1] : null;
if (!repo) {
  console.error('Usage: node apply-c221-v900.cjs --repo "<path-to-friendly-123>"');
  process.exit(2);
}

const patchPath = path.resolve(__dirname, '..', 'releases', 'C221-v0.9.0-Sync4-Complete-on-e48c63dd.patch');
const scopeLockPath = path.resolve(__dirname, 'verify-scope-lock.cjs');

cp.execFileSync('git', ['-C', repo, 'apply', '--check', patchPath], { stdio: 'inherit' });
cp.execFileSync('git', ['-C', repo, 'apply', patchPath], { stdio: 'inherit' });

const changed = cp.execFileSync('git', ['-C', repo, 'status', '--porcelain'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(l => l.slice(3).trim())
  .filter(Boolean);

cp.execFileSync('node', [scopeLockPath, '--cut', 'C218', '--files', changed.join(',')], { stdio: 'inherit' });
console.log('C221_V0_9_0_APPLIED_AND_SCOPE_VERIFIED:', changed.length, 'files');
