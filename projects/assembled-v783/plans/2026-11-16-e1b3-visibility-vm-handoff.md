# v783 E1b-3 visibility VM — plan and five-hour restart checkpoint (2026-11-16)

> REQUIRED: Superpowers systematic-debugging → TDD (observed RED) → minimal GREEN → verification-before-completion. Ponytail approach: reuse real established code, no new dependency, no gratuitous abstraction.

## Authoritative baseline
- Repo: `jfcarpiopuntocom/friendly123workshop`; isolated branch `sol/20261116-e1b3-vm-real-visibility`; base EXACT workshop main `6a536cb3e49bf8472136e718ee2771c5591c2f11`.
- Fresh unfiltered native historical audit [run 43983149410](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43983149410), PR #57 SHA `427a99c2`: **3,228 tests; 3,176 PASS, 48 FAIL, 3 SKIP, 1 CANCEL**. Nonzero, NO-GO. Older audit run 43965240844: 3,220 total, 3,162 PASS, 54 FAIL, 3 SKIP, 1 CANCEL; denominators differ, cannot call 6 defects resolved without by-name comparison.
- Failure `not ok 679 - E1b-3: three Yjs rooms follow visibility and lease` at `app/test/e1b3-one-active-tab.test.cjs:118-137` is a **VM harness ReferenceError `programarRetorno is not defined`**, not evidence of an actual production reconnection bug.
- Actual shipped `app/docs/sync-yjs.js` has `sincronizarVisibilidad()` which calls outer-scope `programarRetorno()` when visible; when hidden, it calls `clearTimeout(timerRetorno)`, resets timer, and optionally pauses `canalesPiloto`. The test extracts only `sincronizarVisibilidad` into `vm.runInContext`; it lacks these enclosing bindings. Real current contract: `activo = !document.hidden`, independent of tab lease, for all three channels. Existing assertions already correctly pin 3 resume on visible, 3 pause on hidden, then 3 resume on visible despite lease holder false. Do not change those assertions.

## One isolated, test-first repair, no runtime modification
1. Preserve the exact historical RED error from run 43983149410 in this checkpoint (done).
2. Modify ONLY `projects/assembled-v783/app/test/e1b3-one-active-tab.test.cjs` within the `E1b-3: three Yjs rooms follow visibility and lease` fixture. Provide missing VM lexical helpers `programarRetorno`, `clearTimeout`, `timerRetorno`, `retornoEnCurso`, `canalesPiloto`, nothing more. Do not stub real channel pause/resume. Prefer counting scheduled returns and asserting visible→hidden→visible calls exactly twice; assert hidden clears pending timer if simple; preserve all existing no-lease-gating assertions.
3. Add a one-purpose GitHub Actions workflow under `.github/workflows/v783-e1b3-visibility-vm.yml` (Node 22, `npm ci` inside `projects/assembled-v783/app`, `node --test test/e1b3-one-active-tab.test.cjs`; do not contact production or add a deploy). If dependencies need Chromium/fixtures, report honestly, don't fake green.
4. Open DRAFT workshop-only PR to main; read native job logs and full original file results, 0 failures/skips required. Do not claim global full green from focused tests.
5. Revalidate main and avoid overlap with PR #52 (rack activate/deactivate modifies `mock-backend.js`, `tab-session-handoff.test.js`; this branch must not modify those).
6. If test GREEN on exact head and PR diff is test-only, workshop-only merge may proceed; production `friendly-123` remains unchanged. On failures, keep draft and log exact job and cause. Do not bypass permissions or lower business security.

## Next risk-ranked work after this independent fixture
- Analyze true P0 sale/store behavior `venta-durable-deficit.test.js:193` (background A/B quota assertion): check against new durable rack POST ACK from #39 before choosing whether historic fixture is obsolete. Never silence real full-device quota notifications.
- PIN joined-team owner safety `p0-v617-recovered-team-gate.test.cjs` #1662/#1664: source-slice offsets or real role gap? inspect before editing.
- Production customer GO gates unresolved: physical PC Opera↔iPhone Safari/PWA A→B→A twice; actual remote financial ACK, idempotent opId, license/PIN cross-device, sales, money, stock, photos and offline restoration. Full historical suite remains NO-GO.
- Continue writing *before* code under this branch and [live Notion handoff](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902); no work lost across 5h stops.
