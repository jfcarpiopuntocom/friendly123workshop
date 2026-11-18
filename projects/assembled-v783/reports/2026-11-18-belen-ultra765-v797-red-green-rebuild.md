# Belén P0 · #765 safe transplant onto mainline v797 (Nov 18, 2026)
## Provenance / RED
- Previous PR #765 source head fe28314aef11b814a272b37a4335d7af67876290, prior frozen v794; 6 release gates red on outdated shell.
- New independent PR #773 branch integrate/p0-belen-opaque-coldjoin-v797-20261118 created from master v0.7.96 7a8d2584338d1540fcd9789cc889c8e2a1592968; original #765 untouched.
- Actual unmodified #765 test executed on current master: GitHub Actions run 44420936607, 1 PASS / 4 expected RED. Raw catalog Y.Doc provider, premature authority, plaintext photo bridge, second writer.
## Minimal GREEN
- Transplanted same five guard hunks only to src/yparty-piloto.js and one call-site guard to docs/sync-yjs.js. Existing encrypted legacy relay is retained; no YParty plaintext, no photo HTTP before sealed redesign.
- New test exact code, GitHub Actions run 44421096553 GREEN (all 5). No real store data, no new business writer, no PIN or source migration.
- Initial one-shot official build run 44421255806 FAILED because root npm ci lacks the pinned nested y-partyserver/provider dependency; no code product failure. Corrected workflow to npm ci --prefix cloudflare-yparty-worker with its existing package-lock and NODE_PATH to nested modules; rerun 44421596621 SUCCESS.
- Official bot generated bundle from real src and v0.7.97 version, shell f123-shell-v797, golden333, deterministic version-manifest and official release-control validate from v796 base. Bot commit b71cb40fad80b0da5ed33f81fc5ce74d65fb724b. Temporary one-shot workflow deleted. FINAL candidate SHA cf4c2107b52bc5253634d65bcd0b5beaee7e263c.
## Unverified / next release gate
- Final exact SHA requires targeted security green, hotfix, release-control, hex-boundary, exact manifest, regression sync, browser/device. PR #773 must be merged with head SHA match only. Do not claim final GO unless proven.
- Must verify GitHub master===estable after promotion and served URL https://jfcarpiopuntocom.github.io/friendly-123/version.json. Git branch parity != served release; actual Belén Safari/PWA UAT distinct.
- H6 #769 is independent and reserved. Empty cold join/legacy PIN acceptance remains unproven on real devices, irrespective of pilot confidentiality fix.
- No new turn beyond current user's blanket fast-track approval; any new irreversible product/provider decision requires explicit approval.
