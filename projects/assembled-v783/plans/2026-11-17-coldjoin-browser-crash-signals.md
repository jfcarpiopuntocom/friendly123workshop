# Cold-join canary browser-termination signals — Superpowers TDD implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:executing-plans. Do not merge without verification.

**Goal:** Identify whether a synthetic cold-join canary exception during recovery follows a browser crash/page close/browser disconnect, while closing a malicious pageerror.name logging gap.

**Architecture:** Add passive Playwright lifecycle listeners (booleans only) and emit a bounded constant-key JSON diagnostic BEFORE the canary's own browser.close; do not read or alter the Y.Doc or transport. Make the recovery polling wait an explicit allowlisted stage distinct from the initial recovery delay. Tests run the actual canary source against fake Playwright entirely inside a Node VM.

**Tech stack:** Node22, Playwright event signatures via stub, node:test, GitHub Actions. **Spec:** [JFC MDD ADR-001](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac); [Notion reservation](https://app.notion.com/p/41b1642b67f381beb043f8e8761a80e8).

## Global constraints
- Browser-first; PWA deferred. NO live Firebase, customer, PIN, Yjs writes, unlock attempt, release, provider changes, migration or production deployment.
- Do not interfere with active Worker PR12, YParty ops PR13, workshop PR75, or Codex outbox work. Only script, new test, new focal workflow and this plan on isolated branch.
- Logs must be allowlisted booleans or enums; no error message, stack, URL, token, room ID, license or arbitrary error.name.
- Never reclassify a true recovery failure as success. Read-only diagnostics cannot certify coldjoin.
- Preserve existing PR72 test `RECUPERACION` on **initial** 5-second wait. New stage applies only to **repeated** 2-second wait.

## Review focus
1. A browser crash fires `page.crash`, without a matching `page.close`: crash flag true, other flags accurate.
2. A page close fires without browser disconnect: closed true independently.
3. Browser disconnect fires without page crash: disconnect true independently.
4. Hostile `error.name` contains a synthetic secret: log only `Error`.
5. Cleanup via planned `browser.close()` must not be counted as the cause of the preceding failure (emit diagnostic **before** cleanup).

## Task 1 — Real canary VM test (RED)
**Files:** Create `projects/assembled-v783/app/test/p0-coldjoin-browser-termination-privacy.test.cjs`; create `.github/workflows/qa-v783-coldjoin-browser-signals.yml`.
**Interfaces:** Fake p.on('pageerror'|'crash'|'close') and browser.on('disconnected') handlers; assert named `CANARIO_NAVEGADOR` JSON and no error.name secrets.
- [ ] Build test using script source from `../scripts/canario-union-fria.cjs` with fake browser and thrown synthetic navigation/recovery errors; no remote requests.
- [ ] Trigger hostile pageerror during navigation and assert `CANARIO_JS_ERRORES: Error` rather than hostile name; trigger crash+close+disconnect during initial recovery and expect boolean signals.
- [ ] Trigger error on first 2-second poll **after** initial 5-second recovery wait and require `CANARIO_ERROR_ETAPA: RECUPERACION_SONDEO`.
- [ ] CI RED with original runtime on exact SHA; log failing assertions and independent baseline PR72 tests.

## Task 2 — Minimal canary fix (GREEN)
**Files:** Modify ONLY `projects/assembled-v783/app/scripts/canario-union-fria.cjs`.
- [ ] Replace pageerror listener with named-class allowlist matching catch; unknown names map to Error.
- [ ] Register passive event flags; print constant-key `CANARIO_NAVEGADOR` via JSON before `await b.close()`.
- [ ] Set only repeated poll stage `RECUPERACION_SONDEO` immediately before 2-second timeout. Preserve initial and other stages, all safety gates.
- [ ] GREEN focal + PR72 tests + canario guard, then integrated browser & authority 585 on exact candidate.
- [ ] Reinspect diff, no secret output, checkout SHA, Notion findings; keep PR draft unless verified.

## Rollback and NO-GO
Reject/close isolated PR without merging; no production impact. A green diagnostic test says NOTHING about the missing Yjs parents, 4xx or full customer cold join. Must still solve 15 parents, historical 3K+ failures, immutable economic opId and physical PC↔iPhone A→B→A ×2.
