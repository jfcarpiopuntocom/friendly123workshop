# Follow-on P0 — verified durable ACK for rack PUT, activate/deactivate and DELETE

> Saved before coding. Ponytail full (reuse existing helpers), Superpowers systematic-debugging + TDD. **Do NOT implement this plan on main while PR41 is awaiting full CI.**

## Goal and authority
A 2xx response to a successful catalog edit must be backed by a locally read-back-verified durable commit; failed writes must not leave a partial rack, product cascade, event, or photo pointer. Existing rack POST strict CAS from [merged PR39](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/39) is the reference; separate PR41 adds atomic input prevalidation for rejected PUT. Do not rewrite these two fixes or the global `finally`.

## Proven source gap (no inference about a customer's incident)
- `app/docs/mock-backend.js` rack `PUT /api/ubicaciones/:id`: mutates the location, calls `guardarEstadoLocal()` without await, broadcasts, returns `J(u)`. The global `finally` also invokes `guardarEstadoLocal()` without await when `debePersistir`, around the bottom of `_fetchInterno`.
- Rack `DELETE /api/ubicaciones/:id`: marks rack and **all products** deleted, deletes associated monthly expense, writes movement, then returns `J({ok:true,...})` before generic background save. Activation/deactivation same issue.
- Merely awaiting one save or returning 503 after an ambiguous commit is **not** acceptable. Need safe snapshot + exact rollback/cold readback/abort or CAS rebase; do not erase unrelated peer operations.

## Scope and interfaces
Main source `projects/assembled-v783/app/docs/mock-backend.js` and existing browser tests `app/test/tab-session-handoff.test.js`, `app/test/stock-journal-forensic-reconciliation.test.cjs`; use existing `guardarEstadoLocal(true)`/IDB CAS and A/B verified fallback, `_fetchConCandado` FIFO, `mov(tipo, detalle, false)`, exact `_revNueva()` and `avisarCatalogoCambiado()`. **No new engine**; no production relay, license, role change, data migration or service worker. Keep uploaded legacy photos and product history.

## Task 1 — isolated RED for valid PUT under two-store failure
- [ ] Create branch from latest **post PR41** workshop main and commit this plan with exact base SHA.
- [ ] Reuse `seed(ctx)`, `ownerLogin` in native Chromium/WebKit; create rack and record old name/rev/pointers/movements counts.
- [ ] Inject actual `idb.guardarConRevision` rejection (quota), A/B journal `Storage.prototype.setItem` failure, and also `idb.guardar` rejection; assert injectors exercised.
- [ ] PUT a valid rename and commission. Assert **no 2xx**, no in-memory phantom rename and cold third page preserves original. Distinguish hard quota (507) vs CAS fence (503) and never retry quota.
- [ ] Independently test delayed CAS settle; not allowed to report failure while a write can commit later.
- [ ] Save RED run ID, SHA, assertion and logs on the new branch; don't call a harness failure evidence.

## Task 2 — minimal GREEN PUT
- [ ] After all prevalidation (PR41), capture minimal before state **without cloning customer data**, including rack identity/rev and shared movement tail where required.
- [ ] Apply patch and await **one** strict `guardarEstadoLocal(true)`, suppress global fire-and-forget by `debePersistir=false`. Use exactly the existing CAS and fallback semantics; no external network.
- [ ] Only after verified durable ACK emit catalog change and reply 2xx. If failed, roll back only own mutation when witness still matches; otherwise block ambiguous state and preserve evidence, never erase a peer event.
- [ ] Run native browser negative/positive and shared revision contention. The read-back must be exact and contain one legitimate change.
- [ ] Reseal actual SHA256 source in `docs/version-manifest.json` and verify all frozen shell hashes.

## Task 3 — DELETE/activate/deactivate separately
- [ ] RED: failed DELETE must preserve rack and **each cascaded product**, expenses, movement log, and cold readback; on success all correlated facts disappear together. Test two tabs and IDB error.
- [ ] Use existing snapshot/durable CAS primitive with scoped inverse operations and no fixed stock count. Do not suppress product history. Avoid globally changing endpoint behavior.
- [ ] RED: activation/deactivation failure must not create a phantom status or additional event. GREEN with strict commit and explicit rollback.
- [ ] Excluded: unrelated artist/team routes; scope expansion needs separate owner-reviewed plan.

## Task 4 — review and admission
- [ ] Compare native WebKit and Chromium, restart, quota, CAS, exactly-once idempotency, no false success.
- [ ] Run existing 585 integrated jobs and full candidate vs baseline `npm test`, distinguish inherited failures. Require exact runner SHA.
- [ ] Run real PC→iPhone Safari/PWA→PC x2 before any customers.
- [ ] Record results in GitHub report + Notion. Workshop merge only after checks; production stays NO-GO without physical convergent evidence and rollout gates.

## Caveats
- Strict local commit ACK is **not** another-device/cloud ACK.
- PR39 and PR41 must be intact before implementing.
- A rejected mutation that has any uncertainty about a completed IDB transaction MUST not be silently reissued.
- Do not use fixed-value stock adjustments to patch inventory divergence.
