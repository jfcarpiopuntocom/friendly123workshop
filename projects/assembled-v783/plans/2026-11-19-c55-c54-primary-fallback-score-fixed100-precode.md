# C55 PRECODE score-only, conditional on REAL C54 merge (same friendly-123 app)

Date Ecuador 2026-11-19, UTC GitHub 2026-11-20. This is phase 2 of single C54 double-writer root cause, not an unrelated project. JFC original budget `docs/engineering/architecture-2-port-score.json` and `docs/engineering/architecture-2-quality-score.json` in PRODUCT remain authoritative. Workshop only logs evidence. Sync3 stays.

## Hard dependency

Existing [PR #853 C54](https://github.com/jfcarpiopuntocom/friendly-123/pull/853) product source v0.8.23 `docs/sync-yjs.js` must MERGE after 55/55 SUCCESS at exact final candidate HEAD and Cloudflare exact product master SHA SUCCESS. Initial TDD RED run [44674545607](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44674545607) caught legacy primary sender during 2.0 pilot failover. Source fix: `if (!API.modoCorte20Activo || API.canal === API.canalPiloto) API.canal.enviarUpdate(update)`. New pilot remains writable, OLD relay not selected under active 2.0, failback resumes exactly once; full C52 regression remains. Commercial QA flags OFF. If CI incomplete or red, no product merge, no score change. Source may never be credited on a branch.

## Fixed original 100.0 budget, no inflation

Current master post [PR #852](https://github.com/jfcarpiopuntocom/friendly-123/pull/852) = migration 90.0/100, architectural quality 78.1/100, GO0/6 physical0/5; source assessed C52 merged SHA `b223fe801ec9599949f135423551e63cf89105c4`. Browser group fixed10.0; `typed-delta-and-legacy-retirement` PENDING1.0.

After C54 actual merge+CF build:
- Split exact original remaining budget1.0 into `c54-primary-fallback-old-yjs-writer-fence` **0.5 DONE** source `docs/sync-yjs.js` with SHA-pinned evidence and PR #853, and remaining `typed-delta-and-legacy-retirement` **0.5 PENDING** for full old writer retirement/commercial/real PC Safari.
- Implementation 90.0→**90.5/100.0**, pending 10.0→**9.5**, original weight 100.0. This is **partial source QA only**, not live 2.0 customer activation.
- Quality category `migration` score7.5→7.7 of weight10.0, other dimensions unchanged, total78.1→**78.3/100.0** (engineering confidence from source-driven negative/positive fallback test).
- Both `assessedProductSha` pin exact C54 merged PRODUCT source, not the score-only PR head. All prior DONE evidence links repinned to same SHA. GO commercial0/6, physical0/5, approved two flags OFF.

## Score-only files and gates

1. After product merge verify current exact JSON/score source SHA, build branch only from that SHA.
2. RED first in `test/p0-architecture-2-port-score.test.cjs`: demand scores 90.5/78.3, 9.5 unearned, exact group weight10.0 and new 0.5 DONE source; insist on old 0.5 PENDING, GO0/6 physical0/5, real source SHA. Confirm actual failure CI expected difference.
3. GREEN `docs/engineering/architecture-2-port-score.json`, `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `docs/engineering/architecture-2-port-score.md`. Update historical remaining-budget and previous-score caps to reflect split, retaining all source, manifest, prior checks and no assertions dropped.
4. Run full score-only CI 11/11 and released SHA; merge if green + mergeable. Verify Cloudflare exact master SHA success before declaring OFFICIAL new values.
5. Close Notion + workshop detailed evidence. No edit to docs/core/ledger.js reserved for PR #841; no Cloudflare R2 bucket, Firebase customer import, PIN, new worker, Syn3 rewrite or physical acceptance.

Checkpoint [C54 status](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/reports/2026-11-19-c54-legacy-primary-fallback-fence-status.md).
