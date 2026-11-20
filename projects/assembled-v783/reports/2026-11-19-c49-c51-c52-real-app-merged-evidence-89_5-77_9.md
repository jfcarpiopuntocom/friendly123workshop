# friendly-123 1.0→2.0 · C49, C51, C52 CERRADAS con evidencia REAL, no simulación

Date: Ecuador 2026-11-19, UTC 2026-11-20. SOURCE OF TRUTH: the SAME product `jfcarpiopuntocom/friendly-123`. `friendly123workshop` only stores precode, QA and reports; NOT a second/new app. Sync3 stays integrated.

## Three final real-product merge SHAs and Cloudflare Workers Builds

1. [PR #847 C49](https://github.com/jfcarpiopuntocom/friendly-123/pull/847) MERGED **b488705cfaeb4bac6e7a763696cb7af23576315d**, exact tested head `0ba31feeef83e486aef14218c13808d00d49102f`: **11/11 GitHub CI SUCCESS**, Cloudflare Workers Builds exact merged product SHA **SUCCESS**, build UUID **abeb10ae-046f-4509-ac9e-d55f871cf02e**. Only Workerd SQLite CAS E2E test + QA workflow added; existing app source is directly exercised, not forked.
2. [PR #849 C51](https://github.com/jfcarpiopuntocom/friendly-123/pull/849) MERGED **1b64b3ca40d07abce9924222eea541e4c93ba283**, exact tested HEAD `d4762f9e91bb8b3e9760111c9a608fbf3ab97f82`: **53/53 GitHub CI SUCCESS**, Cloudflare exact merged SHA **SUCCESS**, build UUID **6439a73b-ea07-466c-9163-219ee085c623**. Product v0.8.21 shell v821 / golden357, Sync3 untouched, double QA flags OFF.
3. [PR #850 C52](https://github.com/jfcarpiopuntocom/friendly-123/pull/850) MERGED **40192ecc51b41e59fdcaa2d91c3be0522813069a**, exact final tested HEAD **e2fa7f4aef6b6829296f199e961d95c85f1f96b0**: **14/14 GitHub CI SUCCESS**, including C12/C30 fixed score, release-control, P0 stock/sales/PIN, 2-tab Chromium/WebKit, Workerd C49 replay **ON COMBINED C51 source**, plus port QA switch OFF check. Cloudflare Workers Builds exact merged SHA **SUCCESS**, build UUID **94b51dbe-d499-4f82-9c88-489b26c5f876**.

## Root-cause / Ponytail proof, not invented features

- **C49 photo CAS**. The E2E runs `docs/mock-backend.js` real `PUT /api/ubicaciones/:id` CAS guard `expectedFotoHash/expectedFotoRev`: first valid write **200**, stale expected pointer **409 PHOTO_POINTER_CONFLICT** (preserves previous hash), correct CAS update **200**. It then exercises actual `docs/idb-fotos.js` + `docs/sync-yjs.js` SHA bridge against Miniflare/Workerd SQLite `-fotos` DO; cold Team with isolated IndexedDB `F123Application.recoverShelfPhoto` reads exact winning photo bytes. No legacy binary Yjs shadow, no physical device claim. This is *additional, distinct* CAS protection beyond C46 SHA readback.
- **C51 bounded Safari Web Locks and QA-only operational boot**. `docs/sync-yjs.js` requests `navigator.locks.request` with AbortController and **1500ms default acquisition wait**. On aborted/timeout lock acquisition it delegates to the already existing atomic IDB no-lock arbitration; real IDB/business callback errors are rethrown, not silently retried. A new `API.corte20QaHabilitado()` requires both `f123_yparty_qa=1` and `f123_corte20_qa=1`; also live non-demo Owner/Admin and existing C38 legacy transport quiescence guard before activating 2.0; **both flags OFF by default**. QA tests cover lock timeout, normal lock, rejecting actual IDB failure, double flag with role/demo. Commercial switch not enabled by merging.
- **C52 fixed 100 scoring RED→GREEN**. [PRECODE saved before merges](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c49-c51-sameapp-integration-finite-precode.md). RED first: [Actions 44670839539](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44670839539) **expected `88.5 !== 89.5`** before JSON score edit. Code-only source guards then added to `scripts/architecture-2-port-score.cjs`, not weakened; older C38/C46 guard remaining-budget caps updated after splitting the already existing pending budgets. New test re-ran C49 against **combined** v0.8.21 `docs/sync-yjs.js` code and Workerd SQLite, still GREEN. Exact final candidate 14/14 workflow GREEN and Cloudflare master SHA built SUCCESS.
- No user data, no production R2 bucket, no new customer rollout, no ledger owner-reserved source, no Sync3 rewrite. Hermes 33-minute future report is a simulation and earns no credit.

## Official scores validated by reading BOTH JSONs in real master after #850 merge

| Independent rubric | Prior C50 | After C52 MERGED | Change |
|---|---:|---:|---:|
| Architecture 1.0→2.0 migration of **same app** | 88.5/100.0 | **89.5/100.0** | **+1.0** |
| Architectural engineering quality | 77.5/100.0 | **77.9/100.0** | **+0.4** |
| Commercial GO | 0/6 | **0/6** | 0 |
| Physical PC/Safari/PWA acceptance | 0/5 | **0/5** | 0 |

- **Fixed full rubric sum =100.0**, remaining unearned **10.5**. Source assessed SHA in both JSON `1b64b3ca40d07abce9924222eea541e4c93ba283` = merged C49+C51 actual runtime; scoring PR #850 master SHA separately points to audit, not another product.
- Existing `storage` group weight17: `operational-switch` remaining1.0 split into **C51 bounded lock + double-QA operational bootstrap0.5 DONE** / live operational switch **0.5 PENDING**.
- Existing `photo-sha` group weight9: `browser-photo-cutover` remaining1.5 split into **C49 real source CAS Workerd QA0.5 DONE** / real UI and physical validation **1.0 PENDING**.
- Quality dimensions: `durability` 18.0→18.2 /20, `photos` 7.5→7.7 /10, all others unchanged. Physical remains zero; engineering QA != real uptime SLA. No second writer or physical Apple Safari claim.
- Remaining unearned: Firebase real HEAD + R2 service binding4.5, browser/legacy writer retirement1.5, physical failback1.5, role live1.0, photo UI/device1.0, storage live switch0.5, economics live dispatcher0.5. **NO client commercial GO before original preincident backups, authoritative PIN/census, durable full history, signed tickets and actual PC↔Safari/PWA A→B→A×2.**
- Ledger P0 conflicting same ID/different amounts is explicitly **NOT CLOSED**; [product PR #841 RED](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) and [private injertos #14 GREEN](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/14) belong to separate reserved owner. Do not double edit docs/core/ledger.js or declare exact totals while conflicting entries unreviewed.

Next cut follows the one existing owner-reserved ledger P0 or real frozen history / R2 binding with verified source and physical validation, WITHOUT another product or a new speculative roadmap. 
