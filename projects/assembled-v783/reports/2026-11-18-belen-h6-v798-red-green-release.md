# Belén H6 · v798 financial fact-chain safe Dashboard, source-to-visible evidence

## Exact predecessor and owner boundaries
- Production repository: jfcarpiopuntocom/friendly-123 master===estable at v0.7.97, SHA dfa81fb9379e5b166d8072fd7613367c3d90c7a3 after PR #773. Cloudflare production build successful for exact SHA; public Pages /version.json inaccessible to web tool and device adoption unverified.
- Original H6 owner PR #769 at bbedf177b4b24ca972ae3d3feb7b45cda0462021 was based on obsolete v793. Its head/branch remained untouched. New independent transplant PR #774 based on current v797; no overwriting current dashboard wholesale.
- Highest-value Belén source: wants to reconcile event/bar revenue and $34 cash, product-level commission and Casa share. Reported amount is CLIENT CLAIM not audited cash, and history integrity is prerequisite before numerical closure.
## RED
- Original #769 actual-source H6 test transplanted alone before production changes. CI run 44428835610: 2 PASS, 4 FAIL (changed amount treated as complete; missing author predecessor treated as complete; absent verifier treated as complete; missing WebCrypto treated as complete). This is actual baseline behavior, not speculated bug.
## Minimal patch and proof
- Copy exact upstream read-only `docs/core/hechos-chain-readonly.js`; parity test with original `docs/hechos.js` strong SHA256 and legacy weak hash. No data/storage/network writes.
- In live src/dashboard/dashboard-main.js, only two hunks changed: statuses for absent/inconsistent verifier; `tx.oncomplete` no longer treats getAll as proof, verifies unfiltered full journal, then publishes filtered cash facts only if proof.ok and same PIN/license/generation is still active. Reject path explicitly checks current session.
- Updated H1 synthetic fixture to use valid hash facts; actual Chrome/WebKit fixture with real WebCrypto, valid history, tampered amount refusal, no accidental IndexedDB creation. Added delayed digest rejection after notebook switch; no stale repaint.
- Source test GREEN after production fix (CI 44429179190). One-shot official v798 seal CI 44429626613 SUCCESS: official `node scripts/build-dashboard-entry.cjs`, --check, gen-manifest, bash check-sw.sh, release-control validate from v797; README not touched.
- Release identity generated: v0.7.98, `f123-shell-v798`, `golden334`; `docs/dashboard.html` loads new verifier before dashboard-main.min.js. Temporary initial RED workflow and one-shot sealer both deleted from final PR. Existing dashboard D1 QA extended with H6 tests.
- Final exact PR #774 candidate (after removing temp workflows): 1d2a91b4ee52eb943ecff74880a4ed2eaff625fa. Required 25+ CI in progress; don't claim all green until checked.
## Constraints and causal next
- H6 prevents misleading "complete" financing; it does NOT reconcile missing financial facts, compute a new Casa profit, change payments, or solve missing cold-join inventory. Source facts remain untouched.
- Do not assert Belén received shell, that her $34 cash ties, or that PC vs Safari histories have converged until physical verification.
- Next common cause after this read-only safety gate: cross-device cold-join certified event history by opId/causal cutoff (single license one notebook), preserving PN stock and financial facts; inspect existing workshop PR #77 and active source reservations before a new code change.

## Exact-SHA final premerge / fast-track
- Final ordinary SHA 1d2a91b4ee52eb943ecff74880a4ed2eaff625fa: GitHub Actions **25/26 SUCCESS, zero failures**. The last `P0 v637 incremental inventory DOM parity (Chromium + WebKit)` run 44429798600 stays **IN_PROGRESS** at `npx playwright install --with-deps chromium webkit`, before executing any browser tests. That gate is unrelated to H6 production source and must NOT be described as green.
- Explicit exact-SHA mandatory ruleset checks: Release continuity gate, integrated, Synthetic sync + real-browser contracts, Workers Builds: friendly-123, two-tab-sales, mixed-shell, hex-boundary ALL success. Specific D1 Belén finance `belen-finance-browser` Chromium and WebKit success; Fable and hotfix gates success.
- Owner explicitly approved repeated fast-track publishes. Scope is read-only H6 fact verification; no new ledger writers or business transforms. Proposed squash/estable promotion may proceed with exact SHA plus this transparent non-blocking installer exception, without editing or bypassing protected GitHub ruleset.
- Zero client data touched; physical A→B→A and real idiomARTE adoption remain UNKNOWN.
