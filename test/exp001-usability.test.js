const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const shellPath = path.join(root, 'docs', 'exp001', 'index.html');
const versionPath = path.join(root, 'docs', 'exp001', 'version.json');

test('vEXP001 shell exists and is explicitly experimental', () => {
  assert.ok(fs.existsSync(shellPath), 'docs/exp001/index.html must exist');
  const src = fs.readFileSync(shellPath, 'utf8');
  assert.match(src, /vEXP001/);
  assert.match(src, /WORKSHOP|EXPERIMENTAL/i);
  const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  assert.equal(version.shell, 'vEXP001');
  assert.equal(version.experimental, true);
});

test('New Product exposes required code before Save and confirms only after save', () => {
  const src = fs.readFileSync(shellPath, 'utf8');
  assert.match(src, /Barcode \/ internal code \(required\)/);
  assert.match(src, /Product saved\./);
  assert.match(src, /zero-price-confirm/i);
});

test('Move shelves makes the dependency explicit', () => {
  const src = fs.readFileSync(shellPath, 'utf8');
  assert.match(src, /Choose a shelf first\./);
  assert.match(src, /No products on this shelf\./);
  assert.match(src, /id="move-item"[^>]*disabled/);
});

test('English shell has no reported Spanish leak strings in visible labels', () => {
  const src = fs.readFileSync(shellPath, 'utf8');
  for (const bad of ['fiado', 'abono', 'comisionista', 'Sin sucursal', 'Ninguno']) {
    assert.equal(src.includes('>' + bad + '<'), false, 'visible leak: ' + bad);
  }
});

test('demo state is framed as sample data, not customer emergency', () => {
  const src = fs.readFileSync(shellPath, 'utf8');
  assert.match(src, /DEMO DATA/);
  assert.match(src, /These alerts belong to the sample business/);
  assert.match(src, /Sample business needs attention today/);
});

test('regression locks are represented in the experimental shell', () => {
  const src = fs.readFileSync(shellPath, 'utf8');
  assert.match(src, /Not enough quantity/);
  assert.match(src, /5 seconds/);
  assert.match(src, /undo-sale/);
  assert.match(src, /average sale/i);
});

test('reported jargon is not used as visible UI', () => {
  const src = fs.readFileSync(shellPath, 'utf8');
  assert.doesNotMatch(src, />\s*bc\s*</i);
  assert.doesNotMatch(src, /the rack's deal/i);
  assert.match(src, /use shelf commission/i);
});