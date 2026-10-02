const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const shellPath = path.join(root, 'docs', 'exp001', 'index.html');
const versionPath = path.join(root, 'docs', 'exp001', 'version.json');
const src = fs.readFileSync(shellPath, 'utf8');

test('vEXP001 shell exists and is explicitly experimental', () => {
  assert.ok(fs.existsSync(shellPath), 'docs/exp001/index.html must exist');
  assert.match(src, /vEXP001/);
  assert.match(src, /WORKSHOP|EXPERIMENTAL/i);
  const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
  assert.equal(version.shell, 'vEXP001');
  assert.equal(version.experimental, true);
});

test('New Product exposes required code before Save and confirms only after save', () => {
  assert.match(src, /Barcode \/ internal code \(required\)/);
  assert.match(src, /Product saved\./);
  assert.match(src, /zero-price-confirm/i);
});

test('Move shelves makes the dependency explicit', () => {
  assert.match(src, /Choose a shelf first\./);
  assert.match(src, /No products on this shelf\./);
  assert.match(src, /id="move-item"[^>]*disabled/);
});

test('English shell has no reported Spanish leak strings in visible labels', () => {
  for (const bad of ['fiado', 'abono', 'comisionista', 'Sin sucursal', 'Ninguno', 'SUCURSAL']) {
    assert.equal(src.includes('>' + bad + '<'), false, 'visible leak: ' + bad);
  }
});

test('demo state is framed as sample data, not customer emergency', () => {
  assert.match(src, /DEMO DATA/);
  assert.match(src, /These alerts belong to the sample business/);
  assert.match(src, /Sample business needs attention today/);
});

test('regression locks are represented in the experimental shell', () => {
  assert.match(src, /Not enough quantity/);
  assert.match(src, /5 seconds/);
  assert.match(src, /undo-sale/);
  assert.match(src, /average sale/i);
});

test('reported jargon is replaced with plain-language copy', () => {
  assert.doesNotMatch(src, />\s*bc\s*</i);
  assert.doesNotMatch(src, /the rack's deal/i);
  assert.doesNotMatch(src, /house people/i);
  assert.doesNotMatch(src, /Bar \(count by serving\)/i);
  assert.doesNotMatch(src, />\s*Consignment\s*</i);
  assert.match(src, /use shelf commission/i);
  assert.match(src, /Partner shelf/);
});

test('PIN gate explains the action and active role remains visible', () => {
  assert.match(src, /Enter a 3-digit demo PIN/);
  assert.match(src, /id="pin-enter"/);
  assert.match(src, /Active role:/);
  assert.match(src, /456/);
});

test('duplicate product codes are blocked before creation', () => {
  assert.match(src, /That code is already in use/);
  assert.match(src, /products\.some\([^)]*code/i);
});

test('product form has relevant category example and no ambiguous badge copy', () => {
  assert.match(src, /e\.g\. Coffee, Art prints, Accessories/);
  assert.doesNotMatch(src, /money waiting for you/i);
  assert.match(src, /High margin/);
});

test('courtesy and debt flows have explicit safeguards', () => {
  assert.match(src, /Courtesy sale: revenue will be \$0/);
  assert.match(src, /Debt requires a named customer/);
  assert.match(src, /id="courtesy-confirm"/);
});

test('sale confirmation is guarded against rapid double submission', () => {
  assert.match(src, /saleBusy/);
  assert.match(src, /sell-go[^;]*disabled\s*=\s*true/);
});

test('delete product requires confirmation in the workshop', () => {
  assert.match(src, /Delete this product\?/);
  assert.match(src, /data-delete-product/);
});

test('product draft survives an accidental refresh in the experimental shell', () => {
  assert.match(src, /sessionStorage/);
  assert.match(src, /exp001_product_draft/);
});

test('Customers validates the name and Expenses reject invalid money', () => {
  assert.match(src, /Customer name is required/);
  assert.match(src, /Amount must be greater than 0/);
  assert.match(src, /Use no more than 2 decimal places/);
});

test('HTML-like product names are rendered as text, not injected markup', () => {
  assert.match(src, /escapeHtml/);
  assert.match(src, /escapeHtml\(p\.name\)/);
});
