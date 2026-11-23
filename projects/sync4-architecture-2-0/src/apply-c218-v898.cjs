'use strict';
const path = require('node:path');
const cp = require('node:child_process');

/**
 * 1-command installer for C218 (v0.8.98) onto friendly-123 (be33ccbf).
 * Applies the pre-built, CI-pretested atomic patch (patches 01, 02, 03, 06, 07
 * + rebuilt .min.js + version seal + version-manifest.json) and verifies Scope Lock C218.
 *
 * Usage:
 *   node apply-c218-v898.cjs --repo "C:\00 Projects\claude-f123\friendly-123"
 */

const args = process.argv.slice(2);
const idx = args.indexOf('--repo');
const repo = idx >= 0 ? args[idx + 1] : null;
if (!repo) {
  console.error('Usage: node apply-c218-v898.cjs --repo "<path-to-friendly-123>"');
  process.exit(2);
}

const patchPath = path.resolve(__dirname, '..', 'releases', 'C218-v0.8.98-on-be33ccbf.patch');
const scopeLockPath = path.resolve(__dirname, 'verify-scope-lock.cjs');

cp.execFileSync('git', ['-C', repo, 'apply', '--check', patchPath], { stdio: 'inherit' });
cp.execFileSync('git', ['-C', repo, 'apply', patchPath], { stdio: 'inherit' });

const changed = cp.execFileSync('git', ['-C', repo, 'status', '--porcelain'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(l => l.slice(3).trim())
  .filter(Boolean);

cp.execFileSync('node', [scopeLockPath, '--cut', 'C218', '--files', changed.join(',')], { stdio: 'inherit' });
console.log('C218_V0_8_98_APPLIED_AND_SCOPE_VERIFIED:', changed.length, 'files');
