# friendly-123 same-app 1.0→2.0 · C46+C48 CLOSED, merged and verified

Ecuador date: 2026-11-19; UTC GitHub/Cloudflare timestamp: 2026-11-20. This report is *evidence only* in `friendly123workshop`, not a new app.

## Final product SHAs
- [PR #844 C46](https://github.com/jfcarpiopuntocom/friendly-123/pull/844) MERGED into real `jfcarpiopuntocom/friendly-123` master: **f05cd2fa0a104439845bad96f9e341267c82e33c**. Final tested branch HEAD a475298171c958ed2e6161df7d9897a8ffd8fe4e.
- [PR #846 C48 fixed100 score](https://github.com/jfcarpiopuntocom/friendly-123/pull/846) MERGED: **a1b716855e9f1048c4e99b22ae54768211c82b53**. Final branch HEAD c40128709c40b04498d2ee391b429e5daf8783e5. Product runtime source remains v0.8.19/v819: no feature flags enabled and no code change to Sync3.

## End-to-end C46 verified QA (actual shipped source, synthetic devices)
- Actual modules `docs/idb-fotos.js`, `docs/sync-yjs.js`, `docs/application/recover-shelf-photo.js` plus YParty compiled browser bundle loaded into isolated VM and exercised against real Miniflare Workerd SQLite DO `-fotos` and `-ops`.
- Owner stores SHA256-identified photo bytes, no legacy Yjs binary shadow; cold Team with separate IndexedDB reads identical bytes through `F123Application.recoverShelfPhoto`.
- Original C46 test only did A1-B1-A2 yet claimed A-B-A ×2. Ponytail correction on SAME existing PR added genuine *two full* cycles A1→B1→A2→B2→A3 plus old-opId replays: initial stock5 became stock0, initial cash500 became cash8000 cents, exactly FIVE effects and FIVE receipts. It tests sequential handoffs; not simultaneous writers or physical devices.
- [C46 Workerd Actions run 44660882184](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44660882184) 1/1 TAP PASS, 0 FAIL, full [11/11 branch workflows](https://github.com/jfcarpiopuntocom/friendly-123/pull/844/checks) SUCCESS.
- Authenticated Cloudflare Workers Builds **SUCCESS** master f05cd2fa0a104439845bad96f9e341267c82e33c, build UUID `a93e3071-3082-4000-9608-ad60f766b95f`.

## C48 strict score RED→GREEN
- PRECODE: [C47-named plan, executed as PR C48 to avoid collision with existing C47 role-switch PR #845](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c47-c46-real-product-fixed100-photo-qa-score-precode.md).
- Genuine RED before scoring: [Actions 44661540164](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44661540164) failed exact source test with `87.5 !== 88`. This is expected TDD, not post-release failure.
- GREEN fixed100: 11/11 exact candidate workflows SUCCESS including [C30 score run 44661968524](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44661968524), [C12 score run 44661968497](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44661968497), [release-control run 44661968616](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44661968616). [PR #846 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/846).
- Independently read actual master JSON after merge:
  - Migration **88.0/100.0**, previously87.5: +0.5, same 100.0 points group budget, remaining12.0.
  - Quality **77.3/100.0**, previously77.0: +0.3, specifically photos +0.2 and synthetic sequential Workerd sync +0.1.
  - `assessedProductSha` pinned to actual app C46 merge f05cd2fa0a104439845bad96f9e341267c82e33c, not a workshop/test branch.
- Fixed photo group weight9: split previous `browser-photo-cutover` pending2.0 to `real-photo-browser-do-readback-c46` done0.5 with merged app code evidence + `browser-photo-cutover` remaining1.5. **No credits** to physical `verified-cross-device-downpath` pending1.5; no browser/physical CAS acceptance alleged.
- Authenticated Cloudflare Workers Build of EXACT C48 master merge **SUCCESS**, build UUID `6581b1a2-eca6-4871-aceb-b13ab6cc4b53`, commit `a1b716855e9f1048c4e99b22ae54768211c82b53`.

## Non-negotiable remaining gates
- **Commercial GO0/6, physical0/5**, no real PC/Safari/PWA A→B→A×2 acceptance. QA switches OFF. Not a claim of commercial convergence or uptime.
- No new R2 bucket, no customer-data import, no new Worker deployment or billing changes by this audit. Sync3 intact; same business license and exact-opId rules apply.
- 12.0 unearned points: history certified real Firebase HEAD+R2 binding4.5, runtime operational switch1.0, economics live dispatch0.5, central role switch1.5, photo UI/CAS physical1.5, legacy retirement1.5, physical verified cross-device downpath1.5.
- Existing [PR #845](https://github.com/jfcarpiopuntocom/friendly-123/pull/845) role-switch runtime and [PR #841](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) intentional ledger red-team remain separately owned; do not double-write reserved sources.
