# v783 Rack PUT atomic validation integration plan
> For agentic workers: REQUIRED SUB-SKILL superpowers:executing-plans + test-driven-development. Ponytail full: reuse existing validators, no new dependencies.

**Goal:** Integrate existing proven PR #41 prevalidation into CURRENT workshop main without losing #39 durable rack POST, #43 category durable ACK, #44 relay test and #46 Yjs fixture.
**Architecture:** A single existing backend handler PUT /api/ubicaciones/:id must validate all rejecting fields BEFORE changing the current rack object. Do not alter Yjs, money, or the generic persistence system.
**Tech stack:** Browser native fetch API, existing mock-backend.js, Playwright Chromium/WebKit and Node test, SHA256 version-manifest.
**Spec:** Current user order same license/PIN => same durable business, no false success, and existing PR #41 test for invalid rack edits.

## Global constraints
- Repository `jfcarpiopuntocom/friendly123workshop`; base exact SHA `1808c9327543e15651f0bcde0d1a5d9640181ab7` (never older PR41 branch for runtime).
- Avoid production/customer data, deploys, new vendors, permission relaxations, changes to receipt or stock semantics.
- Preserve current backend category batch strict ACK from #43 and rack creation strict ACK/CAS from #39, as well as #44/#46.
- PR #41 head `3c9c7eed09289c41d23fda2d1bdfc301ade99928` already recorded Chromium/WebKit six green checks, plus 585 integrated green (see GitHub Actions run 43957096110, 43957096214). It is based on older main and cannot safely merge directly. Source PR40/41 is the contract, not the integration target.
- All artifacts and next steps committed in this branch before implementation; leave old PR41 intact until replacement is landed.

## Review focus
1. PUT with `nombre` + invalid `pctQuedaEnCasa:101`: HTTP400, unchanged name and commission in memory and after cold reopen.
2. PUT with `nombre` + invalid `contribFija` plus tier ladder: HTTP400, old name and commission unchanged.
3. PUT with valid house share `pctQuedaEnCasa:15` must still yield canonical associated percentage 85.
4. Existing POST rack quota failure, concurrent A/B rack CAS (4 tests), category durable rollback, credit and money must stay intact.
5. Existing manifest must match exact new `mock-backend.js` SHA256; no false release integrity.

## Task 1: RED check on modern main
- [ ] Copy **only** the two Chromium/WebKit tests named `P0 invalid rack edits are atomic` from PR41 `app/test/tab-session-handoff.test.js` into current test file (no other test changes).
- [ ] Run isolated native Chromium/WebKit tests with `node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=65000 --test-name-pattern='P0 invalid rack edits are atomic' test/tab-session-handoff.test.js`, archived SHA and log. Must fail on changed name despite 400; if fail for setup, repair test first. Do not change runtime before true RED.

## Task 2: Minimal runtime integration + seal
- [ ] Move validation of `comisionSocio`, `pctQuedaEnCasa`, conflicting `contribFija` + tier mode before ALL mutations in PUT existing handler. No new helper, copy proven narrow PR41 diff while preserving current main's category patch in same file.
- [ ] Compute SHA256 of **exact emitted bytes**, update only `./mock-backend.js` in `app/docs/version-manifest.json`. Verify SHA via node:crypto in CI.
- [ ] Run six native rack tests (POST quota/CAS + PUT atomic) GREEN and adjacent category batch durability tests Chromium/WebKit, no skips.

## Task 3: Integration, review, and landing
- [ ] Run existing 585 integrated browser+authority CI on new branch, verify counts by log, plus money/credit and native rack.
- [ ] Full historical suite remains independent baseline-red; compare critical new failures, never hide them. Source #45 run 43965240844: 3220 tests, 3162 passed, 54 failed, 3 skipped, 1 cancelled (4 pinned historical bridge tests green, #46 fixture fix has since landed).
- [ ] Coordinate/mark PR41 superseded after reconciling and landing replacement to workshop main; no production deploy, no role/issuer changes. iPhone Safari/PWA ×2 physical gate remains NO-GO until real tests.
