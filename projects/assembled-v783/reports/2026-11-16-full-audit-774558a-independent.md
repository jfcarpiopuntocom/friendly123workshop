# Independent full audit — runtime 774558ac — 16 Nov 2026

## Exact source and method
- Candidate job 133570039891, baseline job 133570040390, run https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43944393991.
- Read complete decoded GitHub job logs; extracted all `not ok N - name` entries, compared exact names (not merely counts). Distinguish wrapper/file failures from individual tests; totals differ from `not ok` lines.
- Candidate: 3217 tests, 3165 pass, **48 fail**, 1 cancelled, 3 skipped. Baseline: 3151 tests, 3090 pass, **57 fail**, 1 cancelled, 3 skipped.
- Targeted CI https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43944394047: synthetic-qa job 133570040613 completed SUCCESS; prior 585/585 count in project STATUS, not recalculated here.

## Candidate-only failed test names (exact-match comparison)
1. `direct webkit: durable business/photo recovery without central payload`
2. `Fable P1-4 storage pressure on the old lease keys (WebKit, lease): nobody is expelled, both screens keep writing, no lease or intent is stranded`

These are **candidate-only occurrences in this execution**, NOT proven regressions or fixed bugs. WebKit lease and business/photo recovery are P0 risk surfaces. Preserve assertions. Reproduce each independently against candidate and baseline under identical environment; collect storage state, cold-read, console trace, page lifecycle, commit SHA and test fixture. No timeouts/sleeps as substitutes for causal evidence.

## Baseline-only failed names
- `Expenses compares actual monthly sales and expenses; returned sales do not inflate net`
- `App expense month stays pending when an expense cannot be assigned a date`
- `test/fiados-forensics-readonly-4d.test.js`
- `P0: empty first-join catalog cannot seed factory metadata before recovery`
- `P0 old local shop name cannot overwrite shared owner name during first pull`
- `P0 legitimate owner rename still works after full recovery`
- `S4: atomic v1->v2 migration, readback, incremental append, and reload in synthetic real IndexedDB`
- `S4 never duplicates a large customer backlog or deletes the v1 source`
- `test/p0-v766-diario-yjs-poda.test.cjs`
- `test/stock-journal-forensic-reconciliation.test.cjs`
- `test/stock-journal-legacy-preflight.test.cjs`

## Next execution (TDD, Ponytail full, Superpowers)
1. Revalidate HEAD; do not overwrite other agents' commits. Capture isolated RED on candidate-only WebKit lease first; compare baseline.
2. Test independent cold-read persistence and loss of writer/lease; distinguish host pressure from app state. Then business/photo recovery case. Never claim pass because a transient UI looks correct.
3. Apply minimal root-cause fix only after deterministic evidence; preserve imported components and exactly-once payment/stock/photo semantics.
4. Run focal Chromium/WebKit, relevant historical tests, integrated and full candidate/baseline. Log SHA, job IDs, exact failure names, review.
5. No production release or issuer scope expansion until verified authority, ACK, physical A→B→A ×2 and full GO gates.

This is a diagnostic/report-only commit; no runtime modification or new test execution.

## Next controlled phase — full-suite concurrency, saved before editing CI
The first isolated run #43948229037 on PR checkout e8304239 passed both WebKit cases 1/1 each, without skipping. This **does not close** 2 full-suite-only failures. A follow-up PR run #43948588068 repeats the pair serially; preserve its conclusion separately. Since the full npm test uses Node test-concurrency=4, run the two named cases simultaneously as independent test files with the same Node concurrency, while keeping the official native WebKit gate and no-production-network preload. Save independent raw logs. A failure here is a useful RED; if it passes, isolate wider suite interference, not edit production or relax assertions. No unverified green should be attributed to a new SHA.
