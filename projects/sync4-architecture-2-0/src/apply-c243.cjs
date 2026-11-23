#!/usr/bin/env node
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const targetRepo = path.resolve(process.argv[2] || '.');
const patchFile = path.resolve(__dirname, '../releases/C243-CrossLayer-PullCursor-Corte20Diag-on-4a6d038f.patch');

if (!fs.existsSync(patchFile)) {
  console.error('Missing C243 patch:', patchFile);
  process.exit(1);
}

execFileSync('git', ['-C', targetRepo, 'apply', '--check', patchFile], { stdio: 'inherit' });
execFileSync('git', ['-C', targetRepo, 'apply', patchFile], { stdio: 'inherit' });

const buildMin = path.join(targetRepo, 'scripts/build-min-scripts.cjs');
if (fs.existsSync(buildMin)) {
  execFileSync(process.execPath, [buildMin], { cwd: targetRepo, stdio: 'inherit' });
  execFileSync(process.execPath, [buildMin, '--check'], { cwd: targetRepo, stdio: 'inherit' });
}

console.log('C243 applied cleanly on', targetRepo);
