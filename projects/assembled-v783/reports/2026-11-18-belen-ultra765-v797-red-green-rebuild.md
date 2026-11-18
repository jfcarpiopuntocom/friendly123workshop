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

## Behavioral contract mismatch caught before release
- Final pre-test SHA cf4c2107b52bc5253634d65bcd0b5beaee7e263c: 29 green, two fail. PORT LIVE seal failed because old pinned vendor digest 54654be7 no longer matches newly secured official bundle SHA256 2b03c63a. Updated only immutable hash assertion in .github/workflows/qa-port2-v785-shell-seal.yml, preserving strict pin.
- More important: P0 PORT 2.0 synthetic gate 84 PASS / 7 FAIL, because 7 old tests REQUIRED an unsafe Owner catalog YParty provider to connect, including reconnect/auth-error scenarios. Since #765 deliberately denies all unsealed catalog connections, those assertions contradict the safety baseline.
- Rewrote precisely 7 affected contracts in test/p0-yparty-client-real-tickets.test.cjs and test/p0-bridge-store-switch.test.cjs to assert zero unencrypted provider, immediate encrypted legacy fallback, no credential ticket consumed, no duplicate writer across foreground/retry, no waiting timer. Other 84 behavioral assertions remain untouched; old provider expectations are a future sealed-E2E implementation requirement, not proof of safe current support.
- Current code head d4863e44bbe59d4282a3f56db3f4f46f669bb32c; required full focused gates running. If source change occurs after this checkpoint, update SHA evidence. Not yet merged/published; no physical acceptance.

## Final security fast-track, explicit infrastructure exception
- Final SHA d4863e44bbe59d4282a3f56db3f4f46f669bb32c: GitHub Actions 35 runs; **34 SUCCESS**, zero FAIL, one workflow release-control run 44422321547 remains PENDING with no job created. It is NOT certified GREEN.
- Official node scripts/release-control.cjs validate executed and PASSED inside successful one-shot release-builder 44421596621; P0 hotfix gate, portable PORT LIVE immutable bundle+manifest gate, PORT 2.0 full application/worker security scenario, two-tab, money, Sync3, stock and photo gates all SUCCESS on final SHA.
- Distinguish this controlled exception from functional failure: GitHub pending means no runnable job and not a code assertion. User explicitly approved every scoped fast-track publish. Merge only if no tests failed and exact head unchanged; publish separate proof, monitor physical device adoption and failback if needed.
- Old PR #765 remains unchanged; new #773 carries exact code semantics but new pinned bundle and present-day safety contract. Security gate remains OFF for all rollout config licenses. This is a privacy/authority blocker repair, NOT full cold-join delivery.
