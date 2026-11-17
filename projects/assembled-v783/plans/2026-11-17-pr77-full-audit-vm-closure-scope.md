# Post-PR77 full historical audit: isolated VM closure scope — TDD plan

> **For agentic workers:** REQUIRED SUB-SKILLS superpowers:systematic-debugging, test-driven-development, executing-plans, verification-before-completion. Plan committed BEFORE test or source edits.

**Goal:** Distinguish the six new full historical failures after PR77 from a real transport regression; restore honest VM test behavior if the test extracts a closure without the newly referenced binding. Preserve all business, Yjs, auth and durable source bytes.

**Architecture:** The real `crearCanal` closure declares `var _antecedentesBuscados = false`, newly read by the `ws.onmessage` historical replay. Older tests execute `ws.onmessage`/replay slices in a newly created `vm` global context. Reproduce six failures on the exact current runtime. For each fixture, add only the missing `_antecedentesBuscados:false` value that reflects an uninitialized channel; keep all assertions and business events identical. If test still fails, investigate genuine product regression separately, do not change expectations.

**Spec:** [MDD approved JFC](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac), [Claude transition handoff + our correction](https://app.notion.com/p/41b1642b67f381819878ecf04eb44c42), [scoped Notion reservation](https://app.notion.com/p/41b1642b67f381e6925fe52529b7d364), [PR77 merged source](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/77).

**Base:** `friendly123workshop/main@106466e42abfbc1e133490eb42b131d08abb5eb1` (docs-only successor of verified PR77 merge `f610b8375e414a3976322840a1d3b7a4b64311f4`).

## Scope / ownership

Allowed only these 4 **test** files, new CI workflow and this plan:
- `projects/assembled-v783/app/test/incident-relay-quota-budget-v559.test.js`
- `projects/assembled-v783/app/test/incident-yjs-causal-replay-v559.test.js`
- `projects/assembled-v783/app/test/incident-yjs-receive-queue-v558.test.js`
- `projects/assembled-v783/app/test/p0-v762-pin-sin-historia.test.cjs`
- `.github/workflows/qa-v783-pr77-postmerge-vm-scope.yml`

**Absolutely no changes** to `docs/sync-yjs.js`, `docs/firebase-relay.js`, `docs/auth-ui.js`, client code, Workerd, economic ledger, outbox, inventory, business data, PIN, license, version or SW. No real Firebase, Supabase or customer network.

## Root cause evidence (pre-work)

[Unfiltered full postmerge audit 44106406835](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44106406835) exact source `f610b837...`:
- candidate: **3276 tests, 3237 pass, 35 fail, 1 cancelled, 3 skipped**;
- baseline: **3151 tests, 3090 pass, 57 fail, 1 cancelled, 3 skipped**.
Prior [full 44096312834](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44096312834) candidate 3272/3239 pass/29 fail; six newly red nominally from four files.
  1. incident-relay-quota-budget-v559.test.js: unresolved same-lifetime reconnect.
  2. incident-yjs-causal-replay-v559.test.js: orphan replay should schedule retry.
  3. incident-yjs-causal-replay-v559.test.js: resolved history completes.
  4. incident-yjs-receive-queue-v558.test.js: valid cursor ACK and recovery.
  5. p0-v762-pin-sin-historia.test.cjs: HEAD immediately after last page with orphan.
  6. p0-v762-pin-sin-historia.test.cjs: no redundant HEAD for unchanged cursor.

All four fixtures extract current Yjs handlers into isolated VM, but the runtime grew a closure variable in PR77. **Hypothesis only until reproduced.** Earlier independent precedent [PR643](https://github.com/jfcarpiopuntocom/friendly-123/pull/643), plus PR77 earlier fixed `p0-yjs-pending-snapshot.test.js` by binding real lexical variables, not changing semantics.

## Review focus

1. Every assertion remains byte-identical before and after patch.
2. VM only supplies bindings truly available in original production closure, no fake response/ACK/HEAD injection.
3. Truly orphaned Yjs remains incomplete and never silently grants PIN.
4. A valid page still ACKs only after proven cursor barrier; no removal of negative tests.
5. Full 3K+ audit is compared **by names and source SHAs**, not by aggregate counts only (historical baseline, 1 cancel, 3 skip remain visible).

## Task 1: RED on exact postPR77 source

- [ ] Create workflow running ONLY the four original test files unchanged, syntax-checks and no network.
- [ ] Commit plan FIRST and workflow second; ensure CI RED has six semantic failures (not tool/setup errors).
- [ ] Record exact commit/run/job/TAP failures in this plan and Notion BEFORE test code.
- [ ] If failure set differs, re-investigate before any fix.

## Task 2: Minimal GREEN only in VM fixtures

- [ ] For each test VM context that evaluates new production `ws.onmessage` code, include `_antecedentesBuscados:false` at initialization in the same scope as the original `crearCanal`. Preserve `nombre` and existing guard states. No assertions, timeout, fixtures, source or code changes.
- [ ] Test RED→GREEN on the same workflow; no disabled tests or altered expectations.
- [ ] Run earlier 70/70 causal, 63/63 cursor and 585/585 integrated on the exact head. Inherited real Yjs test already proved 95/95 and missing-parent fail-closed; don't repeat against customer providers.

## Task 3: Full audit, review and preservation

- [ ] Inspect changed file paths and patch exactness. Execute unfiltered postmerge full 3K+; compare six fixed nominally, 29 old known failures. If remaining failures appear, report precise names and investigate.
- [ ] Merge into workshop ONLY after focal/integrated GREEN; commercial production remains NO-GO.
- [ ] Update Notion reservation, Claude handoff if finding differs, STATUS.md checkpoint with exact refs/SHAs and outcomes.
- [ ] Preserve branching and all CI references to survive tooling interruptions. Do not touch central Owner/Team or YParty PR12 reservations.

## Rollback / fail closed

Fixture-only commit reversible; real code remains unchanged. If any test shows actual runtime violation or output mismatch after binding lexical scope, leave branch DRAFT and don't modify the assertion to force green. Any commercial release blocked by actual full audit failures, 15 parents unknown in remote history, YParty economic PR13 RED, PIN central and 2x physical A↔B↔A.
