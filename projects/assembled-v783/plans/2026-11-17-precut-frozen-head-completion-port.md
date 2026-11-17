# Complete frozen pre-checkpoint history in v783 — implementation plan (P0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Keep task-by-task RED/GREEN evidence on SHA-pinned GitHub Actions.

**Goal:** Prevent a cold-joining Yjs replica from abandoning still-available historical operations from independent writers after its missing causal parent has been recovered early.

**Architecture:** Preserve the per-channel frozen historical interval `rescateCausalDesde → rescateCausalHasta` as an obligation independent of `pendingStructs`. Continue existing bounded pagination at the frozen revision without asking the post-cut HEAD until `more:false` completes the interval; only then permit final HEAD/readback and release recovery. Patch only existing `programarRelectura` in the assembled app and verify the whole transport with real vendored Yjs and real Firebase REST adapter over an entirely in-memory backend.

**Tech stack:** v783 browser app (plain JS), Yjs vendored bundle, Firebase REST adapter, Node22 `node:test`, VM, Actions.

**Spec:** [Approved JFC MDD-2026-10-31](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac), [Notion scoped reservation](https://app.notion.com/p/41b1642b67f381e2a210e5a360613b08), [prior verified P0 v698 prototype #644](https://github.com/jfcarpiopuntocom/friendly-123/pull/644). Source root: `jfcarpiopuntocom/friendly123workshop@81db6d89c24e72e3a95a1ef3a1b636ea49173ce2`; runtime blob `docs/sync-yjs.js@16b648f19e585d08e2145bf4621f59c392e4a6a3`.

## Global constraints

- Original user rule: one license, one business, one notebook; never invent stock adjustments, merge physical bases or silently throw away original events.
- All ciphertext remains encrypted E2EE; no external Firebase, Supabase, Cloudflare or customer calls in test.
- **Do not touch** commercial production `friendly-123/master`, client data, PIN, mock-backend, other PR reservations, YParty Worker, relay provider/quotas, outbox, PWA/SW/manifest or deployed flags. Browser-first.
- No widening of page caps, same-millisecond staging cap, per-channel retry limits, HEAD timeout or cursor durability criteria.
- Scope only `projects/assembled-v783/app/docs/sync-yjs.js` `programarRelectura` plus a new test, focal workflow and plan; no security/role or backend policy changes.
- Never claim commercial GO without full historical audit, genuine remote durable/consumer ACK, real iPhone Safari↔Opera PC A→B→A twice.
- Preserve all pre-code commits, RED/GREEN logs, exact SHA, Notion and STATUS handoff.

## Review focus

1. Early parent found but independent writer history spans later pre-cut pages: receive **all** 95 historical ops and the child, no fake completion.
2. The backoff timer with no Yjs pending debt must still resume **before** frozen HEAD; no HEAD shortcut that unlocks recovery while history unfinished.
3. Truly missing parent remains RED and cannot forge an empty checkpoint or PIN barrier.
4. A frozen interval that finishes `more:false` releases its historical obligation normally; no permanent 8s timer or redundant HEAD loop.
5. A stale socket, new HEAD revision, more-than-five stalled retries, timestamp ties, IDB journal rejection never relax the existing safety contracts.

---

### Task 1: Historical two-writer Yjs regression — real module, RED

**Files**
- Create `projects/assembled-v783/app/test/p0-precut-independent-writers-v783.test.cjs`.
- Create `.github/workflows/qa-v783-precut-completion.yml`.

**Interfaces:** source `docs/sync-yjs.js` + `docs/firebase-relay.js` + `docs/vendor/yjs-bundle.min.js` executed in Node VM; `F123_SOURCE_ROOT` optional test-only path.

- [ ] Copy only the necessary harness and **unchanged** independent-writer 95-operation test from already-proven v698 `test/p0-s3-preckpt-ancestor.test.cjs` (do not alter assertions or synthetic business payload). Preserve strict REST allowlist to `https://synthetic.invalid/f123/<synthetic room>`, zero network.
- [ ] Fixture: valid rev1 CKPT; B1 early parent; B2 (different clientID) 95 independent ops; B1 child; malformed synthetic rev2 CKPT false cutoff; all 97 original ciphertext OPs remain available. C must autonomously finish complete historical scan with 95/95, no pending causal parents, release recovery only after complete, no unsafe checkpoint and durable revision unchanged.
- [ ] Run RED under untouched `sync-yjs.js` on exact commit; inspect logs. Valid RED is 43/95 or other partial/uncompleted causal replay, not missing fixtures, stalled test driver or unsupported dependencies; fix harness-only errors without modifying expected state.
- [ ] Keep historical Sync3 regression tests alongside the new test in focal CI.

### Task 2: Minimal frozen-HEAD replay repair — GREEN

**File:** Modify only `projects/assembled-v783/app/docs/sync-yjs.js`, original `programarRelectura` subblock.

- [ ] Define `barridoPendiente()` predicate of `estado.rescateCausalDesde` and `rescateCausalHasta` with remaining frozen interval. Existing conditions: `desde.rev < hasta.rev || (desde.rev === hasta.rev && desde.seq <= hasta.seq)`; no timestamps/stock/PIN inference.
- [ ] If no `deudaPendiente()`, do not cancel timer while historical interval remains. In callback obey same condition.
- [ ] When continuing a bounded historical scan, pass `barridoPendiente()` to `pedirPagina(sock,estado,sinHead)`, bypassing a post-cut HEAD until `more:false`. Keep bounded backoff and existing durable cursor untouched.
- [ ] Run focal green, source syntax, Sync3 HEAD causal gap and cursor IDB ACK tests. Document source diff exactly.

### Task 3: Integrated + unfiltered, preservation, GO gates

- [ ] Run 585 integrated browser+authority QA on exactly final source SHA; inspect TAP not checkmark.
- [ ] Run complete `npm test` historical audit (3k+), compare candidate/base, report ALL failures and cancellations, do not silence/manipulate tests, manifests or version locks.
- [ ] Verify changed paths exactly four and no product/customer operations. Keep branch/PR DRAFT until verified; decide merge **into workshop only** on verified tight source and no regression.
- [ ] Post evidence in this Notion reservation and `projects/assembled-v783/STATUS.md`, including commands, HEAD, results and next owners. Full physical acceptance remains NO-GO.

## Rollback

GitHub draft PR remains separate; revert the workshop squash merge if needed. No real data/provider changes, so no client migration or PIN impact. If actual RED does not reproduce the expected source behavior, STOP without changing runtime, investigate test gap and preserve results.

## Baseline known today

- [Workshop combined postmerge 44096312680](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44096312680): 585/585 PASS, exact main prior to plan.
- [Full historical audit 44096312834](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44096312834): candidate 3272 tests, 3239 PASS, **29 FAIL**, 1 CANCEL, 3 SKIP; baseline 3151 tests, 3088 PASS, **59 FAIL**, 1 CANCEL, 3 SKIP. Never claim a clean release from focal green.
- [True scheduled synthetic canary 44012954943](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44012954943): 28 pages / 5348 encrypted frames / 15 missing Yjs parents, Owner metadata unavailable, exception during RECUPERACION; cannot attribute real incident to the frozen interval yet.

## TDD RED verified on actual v783 BEFORE ANY runtime edit

- Plan commit `fe2a421030d54b98eaea39dcc5357263e2e5dbd0`; fixture port commit `2d8860c5a20666171879ba9af8972f0b2cfffedd`; CI fixture commit `85e1fefc8927704eb5a053ac48c2c06a20a03c34`.
- [Exact CI RED #44103726364](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44103726364) / job `134110355714`: **26 tests, 25 PASS, 1 EXPECTED FAIL, 0 SKIP/CANCEL**, on *unaltered* main `docs/sync-yjs.js` blob `16b648f19e585d08e2145bf4621f59c392e4a6a3`. 97 original encrypted ops stored, 95 independent writer ops, **0/95 recovered**, 1 parent missing, 13 REST pages, 6 fake backoff resumptions; recovery stayed false, no network. Existing Sync3 HEAD, Firebase timestamp, IDB cursor tests 25/25 green. Not a syntax/fixture failure.
- Source diagnosis: unlike v697, v783 lacks the Firebase-only **one-time genesis pre-CKPT rescue** guard `_antecedentesBuscados` and its triggers. Previous planned 3-line timer-only fix cannot address this RED; port the earlier *verified* v697 PR#642 one-time trigger as a separate minimal part of **the same current source file**, plus v698 PR#644 frozen-interval termination. No other file/runtime changes.
- Original [PR#642 source patch](https://github.com/jfcarpiopuntocom/friendly-123/pull/642) proves three anchors: `crearCanal` lifetime boolean, verified same HEAD + pendingStructs pre-CKPT start, final pull-page HEAD-check/renew; [PR#644](https://github.com/jfcarpiopuntocom/friendly-123/pull/644) proves `programarRelectura` continue until frozen history interval ends. Need recheck actual v783 source anchors before touching code.
- **Updated scoped implementation**: modify only `docs/sync-yjs.js` at 4 small existing closure spots: add `_antecedentesBuscados=false`; gate one Firebase catalog rescue per channel on verified same HEAD, stale-CKPT with parents and no fragments; gate final HEAD at `pull-page` while parents unresolved and force post-rescue HEAD after tail; repair timer condition and suppress HEAD during frozen scan. Keep unchanged 5-retry, 4-page, 24 tie, IDB ACK, quotas. All original data remains immutable.
- After GREEN run original more comprehensive older v698 coldjoin suite (10 fixtures including truly unavailable parent) or manually port negative control. Never claim only a 95-op success addresses corrupt/missing ciphertext in actual production room.
