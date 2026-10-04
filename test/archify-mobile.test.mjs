import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../docs/archify-f123/index.html', import.meta.url), 'utf8');

test('atlas is progressive HTML with no runtime dependency', () => {
  assert.doesNotMatch(html, /<script\b/i);
  assert.doesNotMatch(html, /<svg\b/i);
  assert.doesNotMatch(html, /<canvas\b/i);
  assert.doesNotMatch(html, /data:image/i);
});

test('all architecture content exists before interaction', () => {
  assert.equal((html.match(/<details class="node"/g) || []).length, 13);
  assert.equal((html.match(/<article class="story"/g) || []).length, 5);
  assert.match(html, /v448 GOLDEN/i);
  assert.match(html, /ZERO-KNOWLEDGE RELAY/i);
  assert.match(html, /PHOTO EVIDENCE VAULT/i);
});

test('mobile safety primitives are present', () => {
  assert.match(html, /viewport-fit=cover/i);
  assert.match(html, /overflow-x:hidden/i);
  assert.match(html, /env\(safe-area-inset-top\)/i);
  assert.match(html, /env\(safe-area-inset-bottom\)/i);
  assert.match(html, /min-height:44px/i);
  assert.match(html, /prefers-reduced-motion:reduce/i);
});

test('source evidence remains pinned', () => {
  assert.match(html, /3bbe5da157886eeb0c43a0b7994a37126e14e23f/);
  assert.match(html, /ARCHITECTURE-HEXAGONAL\.md/);
  assert.match(html, /DATA-INTEGRITY-PRIME-DIRECTIVE\.md/);
});
