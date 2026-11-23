'use strict';
// 1-command zero-CRLF installer for C226 (v0.9.04) on top of friendly-123 origin/master (30713d64, v0.9.03).
// Usage: node apply-c226-v904.cjs [path-to-friendly-123-worktree]
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const targetRepo = path.resolve(process.argv[2] || process.cwd());
const rawPatchPath = path.resolve(__dirname, '..', 'releases', 'C226-v0.9.04-CleanRoom-Commissions-PlanPagos-on-30713d64.patch');
const normalizedLf = fs.readFileSync(rawPatchPath, 'utf8').replace(/\r\n/g, '\n');
const patchPath = path.join(os.tmpdir(), `c226-lf-${process.pid}.patch`);
fs.writeFileSync(patchPath, normalizedLf, 'utf8');

try {
  execFileSync('git', ['-C', targetRepo, 'apply', '--check', patchPath], { stdio: 'inherit' });
  execFileSync('git', ['-C', targetRepo, 'apply', patchPath], { stdio: 'inherit' });
  console.log('C226 (v0.9.04 / f123-shell-v904 / golden440) applied cleanly to:', targetRepo);
} finally {
  try { fs.unlinkSync(patchPath); } catch (_) {}
}
