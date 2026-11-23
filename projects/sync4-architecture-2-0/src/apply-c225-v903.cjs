'use strict';
// 1-command zero-CRLF installer for C225 (v0.9.03) on top of friendly-123 origin/master (a3ea5068, v0.9.02).
// Usage: node apply-c225-v903.cjs [path-to-friendly-123-worktree]
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const targetRepo = path.resolve(process.argv[2] || process.cwd());
const rawPatchPath = path.resolve(__dirname, '..', 'releases', 'C225-v0.9.03-FullStore-Safari24h-on-a3ea5068.patch');
const normalizedLf = fs.readFileSync(rawPatchPath, 'utf8').replace(/\r\n/g, '\n');
const patchPath = path.join(os.tmpdir(), `c225-lf-${process.pid}.patch`);
fs.writeFileSync(patchPath, normalizedLf, 'utf8');

try {
  execFileSync('git', ['-C', targetRepo, 'apply', '--check', patchPath], { stdio: 'inherit' });
  execFileSync('git', ['-C', targetRepo, 'apply', patchPath], { stdio: 'inherit' });
  console.log('C225 (v0.9.03 / f123-shell-v903 / golden439) applied cleanly to:', targetRepo);
} finally {
  try { fs.unlinkSync(patchPath); } catch (_) {}
}
