# PRECODE / Ponytail · C49 + C51, finish existing READY PRs in the SAME friendly-123

Date 2026-11-19 Ecuador (2026-11-20 UTC), source product jfcarpiopuntocom/friendly-123. Workshop is documentation only, never the product. Sync3 retained.

## Current verified baseline
- Actual product master after C50 PR #848 SHA `80da1366304b7c5e848a4dadb7abbb34885167da`, shell v0.8.20. Fixed 100 score migration 88.5/100 and architecture quality 77.5/100, GO0/6, physical0/5, QA OFF.
- [C49 PR #847](https://github.com/jfcarpiopuntocom/friendly-123/pull/847), exact HEAD `0ba31feeef83e486aef14218c13808d00d49102f`: 11/11 CI success, mergeable true, adds only Workerd SQLite / shelf photo 409-vs-200 + cold-employee SHA readback E2E test and workflow, no app runtime source touched. Originally based on previous C48 master `a1b7168`. If merging after C47/C50, verify mergeability and track exact final master SHA.
- [C51 PR #849](https://github.com/jfcarpiopuntocom/friendly-123/pull/849), exact HEAD `d4762f9e91bb8b3e9760111c9a608fbf3ab97f82`: 53/53 CI success, mergeable true, source same real app v0.8.21. Adds bounded Web Locks AbortController wait 1500ms then IDB atomic fallback (with strict rejection for real business/IDB errors). Starts certified 2.0 runtime ONLY with QA flags `f123_yparty_qa=1` AND `f123_corte20_qa=1`, live non-demo Owner/Admin and C38 legacy writer quiescence. Both flags default OFF; no R2/Worker/customer cutover by this merge.

## Finite integration order
1. Merge C49 #847 first, unchanged, after verifying exact branch SHA / 11 SUCCESS / mergeable. It only adds QA, so operational app code remains C50. Re-fetch master SHA.
2. Merge C51 #849 next if still mergeable on new master and its exact HEAD still has all 53 SUCCESS. No auto-merging if branches changed, guard no double writer and QA OFF. Verify exact Cloudflare Workers Builds master SHA SUCCESS.
3. Optional focused QA after both merges on combined master if the C49 Workerd source-extraction depends on new sync-yjs.js: create minimal added combined regression on a new QA-only branch / run C49 workflow, don't weaken assertions. Record Workerd SQL actual source, not physical devices.
4. Only after code merged + proof, split existing fixed 100 weights, NEVER add rubric points: C49 may earn up to 0.5 QA/photo-CAS from existing pending photo1.5 if it demonstrates something materially new beyond C46, leaving real UI/physical photo1.0; C51 may earn up to 0.5 QA operational bootstrap from existing operational-switch1.0, leaving live activation physical0.5. Quality any credits only with demonstrated negative and positive regressions, not PR count. Apply in independent score-only PR RED→GREEN with fixed total 100 and exact merge SHA.
5. Keep commercials GO0/6, physical0/5, no actual customer devices, no new architecture/product. RED ledger PR #841 and docs/core/ledger.js are assigned to another owner and MUST NOT be touched. Do NOT make the speculative Hermes 33-min future claims real.
6. After CI + Cloudflare builds, update Notion living log and workshop report with merge SHAs and scores. If any gate red, leave candidate unmerged, record blocker and remain on existing score 88.5/77.5.

Success is SOURCE + FULL CI + exact master build, not a synthetic simulation or future promise.
