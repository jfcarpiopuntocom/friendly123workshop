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
