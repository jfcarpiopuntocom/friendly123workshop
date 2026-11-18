# 2026-11-18 · STK-H2 v796 RED→GREEN and official release seal

## Verified
- Base v0.7.95 stable + master same `21a5beca87f2925957288cb73ccf382d3455bc3f`.
- Draft PR [#772](https://github.com/jfcarpiopuntocom/friendly-123/pull/772), branch `fix/p0-belen-photo-pointer-ack-v796-20261118`.
- Exact-source RED via release-control [run 44415378804](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44415378804): 161 PASS, 5 FAIL, the five desired H2 cases. All previous commercial/causal tests on that run green.
- Implemented isolated `docs/vista-perchas.js` photo upload patch: HTTP `response.ok === true` required for pointer ACK, error warning and visible local photo, business/license frozen across async call, refresh via existing `recoverShelfPhoto` policy (never replay stale blind PUT).
- Exact-source H2 gate [run 44416211492](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44416211492) completed SUCCESS 7/7 tests on SHA `5a44560a2d5e30326d6116d3ecbdfeaafab7580f`.
- Initial new CI YAML had an unquoted colon in step label: repaired. After source patch, hex boundary failed due stale release manifest, **not** hex regression. This is expected and blocks merge until official seal.
- Restore test harness had static snapshot of `reloads` counter, corrected to live getter. Not a production change.
- Preserve all customer photos. No YParty 2.0 activation, stock or finance changes. Device/real-client acceptance still separate.

## Required seal
- New v0.7.96 public, `f123-shell-v796`, `golden332`; bump version.json, sw.js shell/cache identities, dashboard.html meta and label, then run **official** `node scripts/gen-manifest.js` on source with `node scripts/build-app-entry.cjs --check`, `node scripts/build-dashboard-entry.cjs --check`, `bash check-sw.sh`.
- Use temporary branch-scoped GitHub Actions workflow to run tools and commit generated artifacts, then remove temporary workflow, run full required gates on final exact SHA and verify review policy before merge/promote.
- Check PR #769/#765 file reservations; H2 touches only vista-perchas and version/seal files. The approved fast-track does not imply unverified physical Belén UAT.

## Official release proof, fixed SHAs
- One-shot GitHub Actions seal [run 44416511018](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44416511018) SUCCESS; bot-generated signed Git commit `5849e002cb027d12cf29dfb2acea3919229e6a4e` bumped `docs/version.json`, `docs/dashboard.html`, `docs/sw.js`, and ran official `node scripts/gen-manifest.js`, `bash check-sw.sh`, `node scripts/release-control.cjs validate` and official app/dashboard build parity checks.
- Removed temporary seal workflow. Final candidate SHA `77389fcac2f7904d95279bf31f7bfc35f715d25b`; only 7 files differ from v795: H2 test and CI, `vista-perchas.js`, version, dashboard shell, service worker, manifest.
- Final [PR #772](https://github.com/jfcarpiopuntocom/friendly-123/pull/772) has 19/20 workflow successes as of last check; remaining `P0 v637 incremental inventory DOM parity (Chromium + WebKit)` run [44416652193](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44416652193) is in progress at Playwright install, not a test failure. Merge conditional upon completed success and exact unchanged head.
- Edge warning for next photo effort: the current exact-shelf recovery policy intentionally does not overwrite an already valid old pointer; an offline new photo whose PUT failed could require reselecting the image to publish it. Do not describe existing policy as unconditional eventual delivery; solve only with fenced/ACKed durable intent respecting current pointers, not blind stale retry.
