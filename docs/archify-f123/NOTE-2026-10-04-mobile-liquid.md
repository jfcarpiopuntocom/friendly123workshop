# Architecture Atlas mobile liquid hotfix — 2026-10-04

## Why
The first Archify artifact was desktop-first. Its SVG forced a 1080px minimum width, so an iPhone received a horizontally scrolling desktop canvas. The detail passport was also a right-side desktop drawer.

## Change
- Dedicated mobile architecture flow below 800px, rendered from the same authored node/relationship data.
- Desktop SVG remains intact above 800px.
- Mobile Semantic Passport is now a bottom sheet with safe-area padding.
- Controls use a 44px minimum touch target.
- Story selector is horizontally scrollable with snap behavior.
- Reduced-motion, reduced-transparency and high-contrast media queries are present.
- No production friendly-123 code or customer data is involved.

## Verification
- TDD regression test: `test/archify-mobile.test.mjs`.
- Inline JavaScript syntax checked with `node --check`.
- Local Chromium rendering could not complete in this execution sandbox; browser automation was also unavailable because the TinyFish wallet is below zero. This limitation is stated rather than inferred away.
