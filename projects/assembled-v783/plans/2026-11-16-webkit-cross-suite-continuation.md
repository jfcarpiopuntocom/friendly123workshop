# v783 · Continuation checkpoint after WebKit 8/8 · 2026-11-16

## Binding user orders
- Work only in `jfcarpiopuntocom/friendly123workshop`, branch `docs/continuity-20261116-chatgpt`, draft PR #38, until GO criteria. Never mutate production `friendly-123`.
- Save next steps and evidence in GitHub *before* risky changes, and record material conclusions in Notion engineering log.
- Ponytail full: smallest tested change; reuse the mature already-integrated components, no new sync framework or unrequested rewriting.
- Superpowers workflow: inspect actual code and callers, reproduce RED, minimal fix, verify GREEN, review diff and rollback.

## Established facts
- Full GitHub audit run 43944393991: candidate and baseline red; two candidate-only WebKit failures previously identified.
- Isolated run 43948229037: 2/2 PASS without runtime modifications.
- Repetition run 43948588068: 4 rounds × 2 WebKit tests = 8/8 PASS, zero skipped, checkout 34b17b8c9611c625103d8d3ec8148376115f247b. This does NOT eliminate global failures.
- Added cross-suite step with `node --test --test-concurrency=4` to workflow in commit 73693307c1751e73055904c670f600edab055f04. No observed run at time of checkpoint.

## Execution plan (in order)
1. Determine why cross-suite workflow did not trigger; inspect PR and CI actual runs, verify YAML test-name regex and triggers. Correct workflow only if needed, preserving production network block and archived logs. Trigger through PR changes; don't claim results without job logs.
2. Run WebKit pair concurrently; if green, expand only to other documented interacting suites, not hundreds of irrelevant tests. Capture exact SHA, browser build, test names, skips, failures and timings.
3. Compare global failure context with isolation: resource exhaustion vs persistence readback vs retry liveness; inspect **all callers** of any runtime function before editing. Specifically check `pendientesRelay` queue ACK/liveness and API/IndexedDB racks readback; avoid arbitrary timeout increases.
4. Write smallest **failing regression** proving a root cause; then fix existing shared runtime, retaining error handling, idempotent opIds, local-first fallback and license scope. No new dependency without necessity.
5. Validate integration and full audit, Chromium plus WebKit, actual durable sales, money, inventory, photos, access and offline recovery. Compare baseline for legacy failures. Hold production NO-GO until critical gates and physical A→B→A twice, same license/PIN.
6. Commit each completed experiment, failed hypotheses and next executable command in this same branch; update Notion. Keep PR in draft until gates proven.

## Forbidden shortcuts
- Don't classify a skip as a PASS, don't silence a failed test, don't accept arbitrary sleeps/timeouts as functional correction, don't fake server ACKs, don't assume runtime bug from flakes.
- No production credential, data, deployment, or user-facing false assurance.
