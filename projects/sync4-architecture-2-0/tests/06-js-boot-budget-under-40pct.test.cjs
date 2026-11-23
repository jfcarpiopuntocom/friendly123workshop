'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { measureDocsDir, TARGET_40PCT_BYTES } = require('../src/audit-js-budget.cjs');

const REAL_DOCS = 'C:/00 Projects/claude-f123/wt-multisala/docs';
const LOADER_PATH = path.join(__dirname, '../src/carga-tardia-v2.js');

test('Sync4 deferred JS loader: 0 pre-PIN loads, deduplicates groups, crosses <= 40% target (<= 1,482,506 B)', async () => {
  const appended = [];
  const win = { OCAuth: { rolActual: () => null }, addEventListener: () => {} };
  const doc = {
    readyState: 'complete',
    getElementById: () => ({ style: { display: 'flex' } }),
    createElement: (tag) => ({ tag, src: '', async: true, onload: null, onerror: null }),
    head: { appendChild(n) { appended.push(n); setImmediate(() => n.onload && n.onload()); } }
  };
  vm.runInNewContext(fs.readFileSync(LOADER_PATH, 'utf8'), {
    globalThis: win, window: win, document: doc, setTimeout: (fn) => { setImmediate(fn); return 0; }, Promise, Object, Array, Error
  });
  await new Promise(r => setImmediate(r));
  await new Promise(r => setImmediate(r));
  assert.equal(appended.length, 0, 'Zero deferred scripts loaded behind locked PIN');

  await Promise.all([win.OCCargaTardia.asegurar('perchas'), win.OCCargaTardia.asegurar('perchas')]);
  assert.equal(appended.length, 2);

  if (fs.existsSync(REAL_DOCS)) {
    const report = measureDocsDir(REAL_DOCS);
    assert.equal(report.safetyViolations.length, 0);
    assert.equal(report.meets40PctGoal, true);
    assert.ok(report.afterDeferAndMinifyBytes <= TARGET_40PCT_BYTES);
  }
});
