# friendly-123 Architecture Atlas — 2026-10-04

Source-backed interactive HTML inspired by Archify's evidence-console principles, but authored specifically for friendly-123.

- Source repo: `jfcarpiopuntocom/friendly-123`
- Pinned commit: `3bbe5da157886eeb0c43a0b7994a37126e14e23f`
- Artifact: `index.html`
- Typed source: `candidate.architecture.json`
- Production impact: **none**. This lives only in `friendly123workshop`.
- Customer data: **none**.

## What the atlas can do

- Click a node to open a Semantic Passport with Git-pinned source evidence.
- Use the five guided stories: daily business, money integrity, photo recovery, multi-device sync, and safe release.
- Filter by data, sync, safety, or delivery.
- Press `/` to search and `Esc` to reset.
- Deep links: `#focus=<node>` and `#story=<story>`.

## Why a standalone HTML

Archify's own philosophy is portable-by-default. The workshop artifact therefore avoids a React/Three.js build dependency: one HTML file can be opened, shared, or served by GitHub Pages without a bundler. The visual depth comes from SVG, CSS, semantic animation and source-backed interactions.