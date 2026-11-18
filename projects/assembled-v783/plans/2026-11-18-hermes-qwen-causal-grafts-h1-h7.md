# 2026-11-18 · Hermes/Qwen pre-merge audit → JFC Ponytail causal repair

## Imported user files read in current session
- `informe-junturas-v0.7.92.md` / `informe.html`: 10 findings, audited **master c7be661 v0.7.92**; Qwen explicitly read-only, no tests run.
- `2026-11-18_prompts-jfc.md`, `paste-2_registro-otro-agente.txt`, `paste-3_mision-premerge.txt` supply evidence of independent audit scope and no production changes by Qwen.
- User's latest authority: implement fast-track successive customer repairs ordered by causal dependency, maximize Belén direct reports, never chronological; keep 2.0 OFF. Qwen's own instruction not to touch JFC repo applied to Qwen's separate audit, not to this authorized implementation.

## Revalidation on current master (2026-11-18)
- `docs/version.json` is v0.7.92 shell v792 golden328.
- `src/dashboard/dashboard-main.js`: `indexedDB.open("f123_hechos_db")` only success path; no req.onerror/onblocked and no tx.onerror, store-missing silent return; `hechosFinancieros=false` thus Casa indefinitely pending with no cause.
- `docs/hechos.js`: `amg_hechos_db` is source of legacy migration, main app performs migration; dashboard intentionally doesn't load `hechos.js`, preserving read-only viewer. `verificarCadenas` verifies per-instance seq/hash before trusting values; not already present in dashboard.
- `docs/plan-pagos-ui.js`: on joined notebook, a prior unscoped legacy reference is fail-closed forever with no recovery; English diagnostics leak to Spanish UI. `_pagoIDB` returns null and fallback localStorage is actually fail-closed but lacks reason. Cross-apparatus journal is **local by design**; replacing namespace with business ID doesn't synchronize IndexedDB; any multi-device idempotency must be enforced at the authoritative financial execution.
- Qwen H9 shared pure models is positive interoperability evidence only, NOT numerical accuracy certification.
- 2.0 encrypted transport UltraReview P0 remains draft #765; union-fria run v792 #44393365047 failed with a stale >1d encrypted checkpoint, 4775 frames, missing Yjs parents while pullMas true; no proof of lost bytes.

## Priority DAG / change sequence
P0 remote cold-join checkpoint/auth/time/stock convergence: separate owner, protect Yjs and encrypted transport; do not treat pending parents during more=true as corruption.
P1 Dashboard financial source integrity/readiness (H1/H6): shared customer symptom Casa commissions/expenses; read-only and never misreport missing rows as zero. **Own src/dashboard/dashboard-main.js** for this surgical PR after checking reservations.
P1 Payment legacy ambiguity (H2), no silent clearing and owner-confirmed quarantine+receipt; isolate in separate PR from Dashboard.
P2 Authenticated error vocabulary/Spanish UI (H4) and explicit no-IDB reason (H3) in same payment error-boundary PR only if contract verified.
P2 roles (H5) need actual permissions and browser evidence; P3 H7 depends on backend opId semantics; no superficial namespace hack.

## First Ponytail PR (dashboard H1) — narrowly scoped READ-ONLY diagnostic, not unsafe backfill
1. Baseline minimal test RED using existing source live: new IDB lacks `hechos` store OR old DB only OR blocked/error: `datos.cobertura.hechosFinancieros` remains false but there is no explicit cause. Fake-indexeddb + actual extracted request path. No customer data.
2. Source: add reason codes `sin-migrar`, `base-sin-store`, `bloqueado`, `error-lectura` in `datos.cobertura.motivoHechos`; show localized actionable source-specific information in Casa panel. Cancel if session/license/generation changes. Detect old DB presence using indexedDB.databases() when supported without creating new legacy DB. **Do not display financial count from legacy raw DB**, because source has no authenticated business binding or chain verification, and Qwen's proposed blind fallback risks showing another shop's money.
3. Existing canonical `f123_hechos_db` and complete read retains current behavior only if no errors; transactions only after authentication. Never count invalid partial read or report zero as reliable. Independent new test proves 4 failure branches and 2 real-browser engines if feasible.
4. Backend no changes; no data migration; publisher must build docs/dashboard-main.min.js via scripts/build-dashboard-entry.cjs and seal v0.7.93 shell v793/golden329 with deterministic manifest. Do not enable YParty 2.0.
5. Gate: RED→GREEN, existing dashboard-finance and PIN test suites, Chromium/WebKit browser, exact hash after build, p0-hotfix-gate + release-control + hex-boundary on exact SHA. Publish only after all required gates. Report user-facing acceptance as diagnostic resolved (not Casa reconciled).

## Next financial root step
Introduce shared pure read-only chain verification for `hechos` on Dashboard before any numeric data; avoid importing effectful main `hechos.js`. Proof must support synthetic valid/invalid chain, same shop, no writes, two engines; then eventually safe legacy migration on the app side (not dashboard), preserving old ledger and proof of shop scope.

## Source and checkpoint links
Qwen original user attachment `informe-junturas-v0.7.92.md` (no repository URL).
Workshop plan: this file.
Notion idiomARTE Center: https://app.notion.com/p/3fa1642b67f381748036f2e0ed7c0f23
Ultrareview: https://app.notion.com/p/41c1642b67f381209690f76fe5c89e8c
