# C97 · C95→R2 immutable publication, crash/replay safety and missing baseline digest — MERGED / DEPLOYED

20-Nov-2026, same app **friendly-123** 1.0→2.0. This is a verified low-level **QA-only** R2 publication seam; NOT live commercial 2.0 cutover or actual customer data migration.

## PRECODE and ownership
- [Plan persisted BEFORE any code](../plans/2026-11-20-c97-r2-immutable-publisher-precode.md), workshop commit `c8d3372d831e5950a186fd57ac13db027728d225`.
- Coordination via [Gemini/Sol6 Notion shared handoff](https://app.notion.com/p/41d1642b67f3811db916d2c190983473). C97 reserved only new tool/test/workflow plus precise one-line seal baseline fix. No client access, Cloudflare flag changes, sales, PIN, Sync3 or storage resets.

## Actual RED→GREEN
- [RED GitHub Actions 44815760051](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44815760051): test-only source SHA `3e76a4bc95c1cf15c395a912ac7b1332110f77aa`; 4 publisher tests failed because C95 had NO publisher. This stage produced no deploy.
- [First GREEN attempt 44815926892](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44815926892): found **real latent C95 bug**: seal summary set `opsBaselineSha256: opsData.baseline.sha256`, but original C14 `prepareImportedOpsBaseline` returns `{rows,digest,count}`; was undefined. Corrected to `opsData.baseline.digest`, regression asserts 64-character SHA.
- [Second GREEN attempt 44816081618](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44816081618): Miniflare RPC cannot serialize `Headers` options for R2 `put` from test host; corrected to Cloudflare-native atomic `onlyIf:{etagDoesNotMatch:'*'}`, documented API, preserving first-writer-wins atomicity.
- [Final source GREEN 44816220960](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44816220960), `15/15 tests PASS, 0 FAIL`: C93 present union, C95 sealed -ops/-cat, C97 immutable R2 writer. Real Miniflare R2 conditional put, pages of BOTH channels written and read back before either manifest; strict identical retry; interruption after one page then resume without deletion; collision under same HEAD refuses and retains original; malformed page refused BEFORE writes; frozen-r2-source Workerd→trusted source→prepareFrozenImport cold-read matches original opId and state SHA.
- [PR #899](https://github.com/jfcarpiopuntocom/friendly-123/pull/899) MERGED squash actual product master `884f8e5c528a0384147804777e7800112304adb9`; final candidate `ef931ca5f8ef5392cf186f0be585437ba287ae67`, **12/12 GitHub Actions SUCCESS**, zero failure, including p0-hotfix, release-control, worker, WebKit Chromium, E1–E6.

## Real Cloudflare production readback
Authenticated Cloudflare GET `friendly-123` Workers deployment `99023802-fa25-4f96-b034-25ff5c206a63`, created `2026-11-20T21:02:30.452545Z`, 100% traffic version `4e871b28-1660-4d39-91f7-5212c70de577`. **Worker Builds GET for EXACT VERSION ID** returns build UUID `108efd1c-5e21-4276-82c7-f36f055bc8fa`, `stopped/success`, commit SHA **`884f8e5c528a0384147804777e7800112304adb9`**, exact match to merged master. A production build can ship a helper not invoked in runtime; this report does not misclassify QA-only R2 tool as live business availability.

## Independent environment inspection
Cloudflare GET of `friendly123-yparty-port2-canary-qa` shows `WS_FROZEN_HISTORY_SOURCE` service binding present and `WS_AUTHORITY_QA`, `WS_OPEN_EXISTING_QA`, `WS_SEPARATE_ROOMS_QA` plain text flags 1; GET of `friendly123-frozen-history-qa` shows `F123_FROZEN_R2` bucket binding and pinned manifest secret BINDING NAMES. Values of secrets and customer data not requested or exposed; cannot from metadata certify original current device union, frozen HEAD completeness, authenticated seal, R2 data contents, or physical acceptance. No flags or real QA R2 objects modified.

## Metrics and constraints
Fixed original rubric remains **port 92.0/100.0**, **architectural quality 80.4/100.0**, GO commercial 0/6, physical 0/5 until documentary code plus actual-device evidence supports earned milestones. No invented points: C97 enhances QA safety of present-state bridge but is not proof of true 1.0→2.0 commercial cutover. No reconstruction of past data, no deletion or modifications to Belén devices, photos, outboxes, local PIN, indexedDB, SW, Firebase or live R2.

Cloudflare R2 Workers conditional put and strong consistency verified in https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ and https://developers.cloudflare.com/r2/reference/consistency/.
