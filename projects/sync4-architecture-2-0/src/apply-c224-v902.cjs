'use strict';
// Surgical 1-command applier for C224 (v0.9.02 — Cloudflare Encrypted Private Vault)
// onto friendly-123 origin/master (ae7c7138, v0.9.01).
// Usage: node src/apply-c224-v902.cjs <path-to-friendly-123-worktree>
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const target = process.argv[2];
if (!target || !fs.existsSync(path.join(target, '.git'))) {
  console.error('Usage: node src/apply-c224-v902.cjs <path-to-friendly-123-repo>');
  process.exit(1);
}

const patch = path.resolve(__dirname, '..', 'releases', 'C224-v0.9.02-CF-Privado-on-ae7c7138.patch');
if (!fs.existsSync(patch)) {
  console.error('Missing pre-sealed patch:', patch);
  process.exit(1);
}
// Normalize LF in case git checkout on Windows converted patch line endings to CRLF.
const rawPatch = fs.readFileSync(patch, 'utf8');
if (rawPatch.includes('\r\n')) {
  fs.writeFileSync(patch, rawPatch.replace(/\r\n/g, '\n'), 'utf8');
}

const run = (cmd, args) => execFileSync(cmd, args, { cwd: target, stdio: 'inherit' });
run('git', ['apply', '--check', patch]);
run('git', ['apply', patch]);
console.log('\n[C224] Applied cleanly onto', target);
console.log('[C224] Next surgical steps for Sol6:');
console.log('  1) Deploy Worker (with --config & --dry-run first):');
console.log('     cd cloudflare-relay-worker');
console.log('     npx wrangler deploy --config wrangler.jsonc --dry-run');
console.log('     npx wrangler deploy --config wrangler.jsonc');
console.log('     # Set WS_SERVICE_KEY secret (exact same value as friendly123-licencias WS_SERVICE_KEY):');
console.log('     # npx wrangler secret put WS_SERVICE_KEY --config wrangler.jsonc');
console.log('  2) Verify & open PR for v0.9.02:');
console.log('     node scripts/build-min-scripts.cjs --check');
console.log('     node scripts/release-control.cjs validate origin/master');
console.log('     node --test test/p0-c224-cf-relay-privado.test.mjs test/relay-selector.test.cjs test/p0-c210-port2-shipped-manifest-seal.test.mjs');
