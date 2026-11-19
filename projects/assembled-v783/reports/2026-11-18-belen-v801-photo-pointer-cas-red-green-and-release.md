# 2026-11-18 · Belén / Ponytail · v0.8.01 shelf photo pointer CAS · source TDD

## Verified baseline / authority
- Original user-approved causal order, source: Notion original 15-point Belén acta (15 October 2026): https://app.notion.com/p/3fa1642b67f381668834c2f402c925d6
- Notion shelf-camera photo symptom is distinct from Belén's original EXPENSE receipt photo request.
- Base master and estable **2ee8c1337771f42506cea70a3f98db96cab226e6**, v0.8.00; PR #776 strict recovery HTTP ACK successfully merged (25/25 required checks; CodeRabbit skipped).
- Work branch `fix/p0-belen-photo-pointer-cas-v801-20261118`, PR https://github.com/jfcarpiopuntocom/friendly-123/pull/777 (DRAFT pending exact-SHA gates). Single functional path `docs/mock-backend.js`, plus new test/workflow and deterministic release metadata.
- Existing workshop pre-code plan: `projects/assembled-v783/plans/2026-11-18-belen-v801-photo-pointer-cas-precode.md`.

## Root and RED (REAL source)
Backend PUT `/api/ubicaciones/:id` unconditionally replaced `fotoHash` and `fotoRev`, publishing catalog, without checking origin of stale retry. Repro test `test/p0-belen-shelf-photo-pointer-cas.test.cjs` with real `test/helpers/browser.cjs` synthetic isolated shelf: photos A/B/C, 409 requirement and unchanged source on failed stale write, compatible legacy PUT.
- Run https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44438666883, SHA `5f8aac5041b558e4556bc6e3c294cceb4008bf26`: **0 PASS / 3 FAIL**, each actual HTTP **200 instead of expected 409**. No harness exceptions/missing imports.
- Causality limited to local mock backend path: cross-device synchronization does NOT yet expose a shared authoritative photo CAS. This repair should not be presented as a real remote conflict solution by itself.

## Ponytail functional patch and GREEN
- Source commit `a9feb7521636bffd1a5c3642b1b475a0f13e4220` adds 15 lines before **first mutating line** of shelf PUT, checking explicit `expectedFotoHash` and exact expected `expectedFotoRev {c,d}`, allows explicit null only when actual null. Missing expected half, malformed revision, stale hash => HTTP409 `PHOTO_POINTER_CONFLICT`; no update, no notifications.
- Calls with no expected* remain unchanged for compatibility (necessary until the UI and durable IDB intent are ported).
- GREEN official workflow https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44438927720: **3 PASS, 0 FAIL** on actual source.
- Risk: no pointer intent persistence; old flow still sends legacy unconditional PUT. **These new CAS guards are not yet invoked by the ordinary photo UI!** The user-visible lost-ACK photo-retry issue remains OPEN. Next step must insert IDB durable intent+photo CAS into camera/recovery UI, not claim closure from this defensive API improvement.

## Official release identity / gates
- One-shot sealer official workflow https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44439153361 completed SUCCESS; generated `docs/version.json` v0.8.01, `shell=f123-shell-v801`, `golden337`, dashboard identity, SW cache and official `scripts/gen-manifest.js` SHA256, `check-sw.sh`, build-source checks, `release-control.cjs validate origin/master`.
- One-shot tool removed after sealing, ordinary candidate head **8dd1c699897ad96e2c3e767b872c1cd8ecf3d175**. GitHub 34 workflows triggered on this final SHA; at writing IN PROGRESS. No publish/merge claim while pending, and no customer UAT.
- Worktree surgical scope: backend local CAS, focus test, CI, version+SW+manifest+dashboard; no financial, stock, PIN, client data mutation or YParty 2.0 switch.

## Next critical dependency order
1. Finish exact 8dd1c699 gates on PR #777, independent review; if all green and mergeable, fast-track merge with SHA pin; verify master/estable/production Pages proof. If any gate RED, investigate causal and fix without weakening assertions.
2. Next independent graft: client capture & re-attach photo pointer must commit **IDB outbox intent** BEFORE PUT, same shop and shelf, hash+fotoRev observed; CAS 409 on conflict; lost ACK readback and dedup; never blind write older pointer. Prove Chromium/WebKit and join/reload/2-tab. This is the actual cross-device fix, not the backend guard alone.
3. Belén's Casa finances/percha/event expenses and historical 29 Sep five IPAs: compare original `opId` and source/client link using owner-only exports, no numeric or customer rewrites. Avoid duplicated enhancements already green in expense photo, bar conversion or existing money reports.
