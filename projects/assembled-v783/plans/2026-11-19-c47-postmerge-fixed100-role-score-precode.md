# C47 completion audit, phase 2 — fixed-100 score only AFTER actual product merge

Scope: **same** jfcarpiopuntocom/friendly-123 app; no new product. Reuse Sync3. Workshop is persistent evidence only.

## Necessary prerequisite
[PR #845](https://github.com/jfcarpiopuntocom/friendly-123/pull/845) v0.8.20 actual real app role event integration MUST be merged with 52/52 required GitHub workflows and Workers Builds SUCCESS on exact master merge SHA. The real C47 RED 18/21 occurred on candidate head 8f533bdba79861a234053a3904c5245d810beb5d, with three distinct security/durability cases: forged Owner event, demo spoofing, stale C21a activate20 after logout. Fix uses OCAuth.rolActual()/esDemo() plus monotone API.__authEpoch20 to reject delayed activation and call failbackToLegacy; tests must all pass. C38 legacy isolated extraction regression must remain GREEN (no global epoch variable).

## Crediting rule, no false claims
Current verified fixed 100 master pre-C47:
- Implemented 88.0/100; quality 77.3/100; GO0/6, physical0/5.
- Identity-rooms **14.0** weight, `commercial-role-switch` **1.5 pending**. Only when C47 actually merged + exact-source tests pass, split to a *QA role event wiring and activation epoch guard* **0.5 done**, leaving **1.0 unearned** for live protected role switch + real devices. Other groups untouched; implementation **88.5/100**, missing11.5. This 0.5 measures the shipped role integration, not a production permission verification and not an additional worker.
- Quality security dimension (weight15) could gain +0.2 from explicit RED→GREEN forgery/demo/late-resurrection source tests, total **77.5/100** iff full pipeline GREEN; all other dimensions unchanged, physical stays0. Previous dimension security10.3, new10.5.
- Both scores pinned to exact **MERGED master app SHA** of C47 (not C47 branch and not workshop); repin every DONE evidence blob to that SHA. Exact 100.0 weights and source-manifest seal enforced.

## Ponytail score-only files
`docs/engineering/architecture-2-port-score.json`, `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`, `docs/engineering/architecture-2-port-score.md`. **Do not modify** runtime `docs/sync-yjs.js` again in score phase; preserve 0/6, physical0/5, and pending Firebase/R24.5. Inspect exact current master before opening score-only branch.

TDD: RED score regression first, confirm GH Actions failure, then JSON+strict source guard+MD GREEN, 11/11 score workflows and Workers Builds SUCCESS; merge. No silent progress claims before merged evidence.
