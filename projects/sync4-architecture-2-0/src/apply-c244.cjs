#!/usr/bin/env node
'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const targetRepo = path.resolve(process.argv[2] || '.');
const patchFile = path.resolve(__dirname, '../releases/C244-SlowRecovery-IdbArchivoWatchdog-on-4a6d038f.patch');

if (!fs.existsSync(patchFile)) {
  console.error('Missing C244 patch:', patchFile);
  process.exit(1);
}

execFileSync('git', ['-C', targetRepo, 'apply', '--whitespace=error', '--check', patchFile], { stdio: 'inherit' });
execFileSync('git', ['-C', targetRepo, 'apply', '--whitespace=error', patchFile], { stdio: 'inherit' });

const buildMin = path.join(targetRepo, 'scripts/build-min-scripts.cjs');
if (fs.existsSync(buildMin)) {
  execFileSync(process.execPath, [buildMin], { cwd: targetRepo, stdio: 'inherit' });
  execFileSync(process.execPath, [buildMin, '--check'], { cwd: targetRepo, stdio: 'inherit' });
}

console.log('C244 applied cleanly on', targetRepo);