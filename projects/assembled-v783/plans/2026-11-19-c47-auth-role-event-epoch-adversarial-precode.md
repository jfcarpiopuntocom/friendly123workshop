# C47 hardening · same PR #845, RED→GREEN Ponytail plan

**Real product:** jfcarpiopuntocom/friendly-123. Open PR [#845](https://github.com/jfcarpiopuntocom/friendly-123/pull/845) at head f54fb6c27a35ac2e0be0a00e3218f699d0bb5c6e, base f05cd2fa0a104439845bad96f9e341267c82e33c. 52/52 CI initial GREEN; **not safe to equate this with auth adversarial coverage**. Runtime shell v0.8.20 has Sync3 intact, 2.0 QA flag OFF. Product score at C48 88.0/100 implementation, 77.3/100 quality, commercial GO0/6, physical0/5.

## Root-cause audit prior to any code
- `docs/auth-ui.js` emits `oc-login` with detail `{rol,demo}`; actual `window.OCAuth.rolActual()` closes over current authenticated `rol` in same module. `docs/sync-yjs.js` C47 handler currently trusts `ev.detail.rol` and calls `API.cambiarRolComercial20(r)`. Any synthetic/late event with `rol:dueno` while actual session is empleado can upgrade the client-facing photo role to owner PUT/GET (server signed tickets remain additional authorization; do not claim remote privilege bypass).
- `API.activarCorte20Runtime` has two await edges (crearCoordinadorCorte20, activate20); an intervening logout may clear flags, yet the resolved await later sets `modoCorte20Activo = true`. This is a potential resurrection of the commercial writer on a logged-out tab.
- C47 existing 2 tests only exercise nominal empleado and logout; their VM stub always returns `OCAuth.rolActual() === dueno`, so cannot detect forged role or late completion.

## Scope bounded to existing PR #845 only
- `test/p0-c47-auth-role-switch-20.test.cjs`: independent RED cases: event role disagrees with live OCAuth session; demo live state; logout while delayed `activate20` prevents rearming. Keep happy-path downgrade and logout GREEN.
- `docs/sync-yjs.js`: check event role against live `OCAuth.rolActual()`, including optional demo `OCAuth.esDemo()`; fail closed on mismatch. Existing `cambiarRolComercial20` and C21a coordinator retained. Add one monotone `_authEpoch20`; bump on logout and accepted role events; after each await in existing activation reject and failback if epoch changed. No new auth service or second writer.
- `docs/version-manifest.json`: update only exact sync-yjs.js SHA; keep v0.8.20/v820 release family and stable cache labels if source hashed.
- No edits to other agents' `ledger.js`, photos, C49 QA, score JSON, Firebase/R2, clients, flags, Workerd routes, or Sync3 unrelated logic. Do not merge if any required gate fails.

## Mandatory gates
1. Commit RED tests on #845 branch. GH Actions role workflow should fail *with* new assertions; record exact failing run.
2. Commit minimal runtime + source integrity hash. C47 role test GREEN, C31/C38/C42/C44 browser regressions, full GH CI + Cloudflare preview/release-control on HEAD.
3. Merge only after head green and mergeable; Cloudflare master build exact SHA success; update Notion, workshop and (in separate score-only step if warranted) original fixed 100.0 rubric. No points on open PR/virtual auth.
4. Commercial GO0/6 and physical0/5 until customer devices.
