import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../docs/archify-f123/index.html', import.meta.url), 'utf8');

test('mobile atlas has no forced desktop-width SVG', () => {
  assert.doesNotMatch(html, /svg\\s*\\{[^}]*min-width\\s*:\\s*1080px/is);
  assert.match(html, /overflow-x\\s*:\\s*(?:clip|hidden)/i);
});

test('mobile gets a dedicated readable flow, not a shrunk desktop graph', () => {
  assert.match(html, /id=["']mobile-flow["']/i);
  assert.match(html, /@media\\s*\\(max-width:\\s*799px\\)[\\s\\S]*\\.desktop-map\\s*\\{\\s*display\\s*:\\s*none/i);
  assert.match(html, /\\.mobile-node/i);
});

test('detail panel becomes an iPhone bottom sheet with safe-area padding', () => {
  assert.match(html, /env\\(safe-area-inset-bottom\\)/i);
  assert.match(html, /translateY\\(100%\\)/i);
  assert.match(html, /--ease-drawer\\s*:\\s*cubic-bezier\\(0\\.32,\\s*0\\.72,\\s*0,\\s*1\\)/i);
});

test('touch controls meet 44px minimum and reduced motion is respected', () => {
  assert.match(html, /min-height\\s*:\\s*44px/i);
  assert.match(html, /prefers-reduced-motion\\s*:\\s*reduce/i);
});

test('interactive source evidence and all five guided stories remain', () => {
  for (const story of ['daily','money','photos','sync','release']) assert.match(html, new RegExp(story));
  assert.match(html, /PINNED SOURCE EVIDENCE/i);
  assert.match(html, /3bbe5da1/i);
});
