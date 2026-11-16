# Durable payment recovery — 16 November 2026

Status: laboratory integration, no production GO. The payment runtime e9ff257 has verified 554/554 integrated checks. The newer fichas receiver fix below has 30/30 local checks and requires its own exact-SHA CI; never transfer the earlier green to it.

## Recovered context and durable delivery

Start main: a5d845bb3997b99321cf42aea6d51f4f03e65776. Plan was uploaded BEFORE implementation at 66e57596ee43e777deffc6ba7ea3c93639abd599 and prepended to the existing Notion handoff. Existing assembled app/relay are reused; historical root/docs are untouched. Frequent commits preserve RED, GREEN and decisions. No new branch/PR, deployment, customer data, issuer scope or PWA/SW activation.

Ponytail full recovered from JFC's Notion token guide and fork jfcarpiopuntocom/ponytail, pinned 96608e078b2d5ea607c5c3b8b5a54d1c1fba6846 (MIT). Superpowers planning, executing-plans, TDD and independent review applied. Windows TokenEconomizer hooks cannot be claimed active from this cloud session.

JFC subsequently requested elementalsouls/Claude-BugHunter. Read its source at 2f9a226d38d35d28d06f1ed63753799d498a2b3d and applied hunt-race-condition, hunt-business-logic and hunt-idor to synthetic local tests. This is methodological use, not automatic installation of its entire bundle, an external scan, or proof every vulnerability is closed. No extra accounting/sync engine or dependency was added.

## Changes and evidence

### Legacy receivable ownership — 0af3dbe

A payment scope alone did not prove receivableId ownership. createTypedCommercialLedger now accepts trusted server-only authorizeReceivable({license,receivableId,principal}); strict true is required for credit.payment.record on EVERY submission, before any SQL including duplicate receipt lookup. Missing/throwing provider gives 503 receivable-authority-unavailable; deny/nonboolean gives 403 receivable-not-authorized. Canonical legacy payload/receipt bytes remain stable. Customer guard shares the same small branch; sale/expense semantics do not change.

Functional RED: 5 newly failing assertions. GREEN: 41/41 (34 guard tests, 6 payload/rollback tests, 1 real Workerd SQLite test with restart). Fixtures alone allow synthetic debt_1; product still has no trusted ownership provider and grants no ops:payment. See evidence/payment-recovery/legacy-guard-{red,green}.txt.

### Real application payment atomicity — 651dc23 and followup

Cartera's duplicate callback ran before asynchronous hashing; two writers with different author IDs sharing IndexedDB (such as overlapping activation) could both pass and insert different facts with the same opId. Synchronizing hash completion reproduced 2 separate confirmations/facts and a double balance effect. No real customer incident is claimed.

Hechos.guardar now reruns the EXISTING synchronous duplicate/validation callback inside the same readwrite transaction as add. On a duplicate, it returns the original durable fact and does not consume hash metadata or emit oc-hecho-local. Transaction abort rejects without a confirmed receipt. Historical facts are never removed, rewritten or recalculated. No new store/version/namespace is introduced. The existing cartera_aplicacion callback also gets its dedup and allocation checks in the same transaction.

Tests cover identical and conflicting opIds, fresh readback, next author hash-chain validity, and abort → no fact/meta/event → retry commits once. Real Chromium AND WebKit run synchronized two-page writes, read back one 101-cent payment and balance, reload and retry the same opId. See payment-atomic-red.txt, payment-atomic-green.txt, payment-browser-final.txt and payment-intent-green.txt. Fake-IDB is explicitly an emulator; the browser tests use native IndexedDB.

Independent reviewer found a minor API edge: the caller could mutate relacion.opId while hashing, causing the duplicate callback to inspect a different intention. No current UI caller was found mutating it. Added a RED test and snapshot of relation at registrarMovimiento entry; GREEN 18/18 in related unit/projector/money suite. This is the only additional runtime change after the main atomicity review.

### Backoff false positive — 3e2d23c

Existing browser test failed 4/5 with 6–7 timers instead of 5. Traces proved actual storage retries progress 3000,6000,12000,24000,48000 with no reset/success between them. Extra 3000ms timers came from relay-selector.js:537 during Supabase/Firebase reconnect, not from storage. Corrected only the TEST timer interceptor to count/accelerate _falloGuardadoLocal callers and added a deliberate unrelated 3000ms timer. GREEN 5/5, original sequence/no-sixth-retry assertions intact. mock-backend.js is unchanged. Full diagnostic origins preserved in retry-origins-*.txt.

## Independent review and local verification

Fresh reviewer inspected a5d845bb..3e2d23c: no Critical/Important finding. Independently ran guard 34/34, atomic emulator 2/2 and Chromium atomicity/recovery/convergence 3/3; examined metadata, next-author chain and cartera_aplicacion. Minor mutable-intent edge fixed with test as above. Existing cartera_*:registrado notification can still occur on a duplicate; no built-in consumer or duplicate money effect was found. No new remote business ACK was inferred.

Both lockfile installs succeeded. Node syntax, git diff --check, generated integrity hashes and bash check-sw.sh pass. Per current AGENTS, PWA/SW/version were not bumped; version-manifest.json hashes were regenerated by the existing generator for laboratory runtime edits.

Local WebKit initially could not launch due system libraries; those failed attempts are preserved, not product failures. Official Debian packages were downloaded into /workspace/work and extracted without modifying system files; symlinks were placed only in the disposable browser bundle's sys/lib. The bundle's wrapper replaces LD_LIBRARY_PATH. Playwright's ldconfig-only preflight still cannot see workspace libraries, so ONLY its host-presence preflight was bypassed after ctypes/library checks; actual WebKit launch, native IndexedDB, assertions and test counts all ran (2/2, 0 skips). CI uses its normal official install --with-deps, without that bypass.

Bare npm test was also started with production-network guard. It was started before the final relation snapshot and before WebKit host setup; its result is not exact-final-SHA evidence. Preserve its complete/partial log and classify every failure. Exact-final-SHA integrated CI and full candidate-vs-baseline audit must be read before changing the status below.

## Limits and next required integration

The real LOCAL application consumer is strengthened; a remote executor/ACK is NOT implemented. stored-for-application remains inbox-only. Browser local facts do not prove license ownership or human authority. Real trusted customer/receivable registry, human-role issuer, remote application/readback/business-committed receipt, photo SHA/ACK, role privacy, full audit and physical PC→Safari/Opera→PC twice remain open. Do not implement a new standalone cloud accounting ledger or enable scopes to simulate completion.

## Final CI/readback

Runtime SHA e9ff257f0b768adf6a41029994eef03400440578: integrated CI43937264730 completed SUCCESS, 554/554 in 14 groups, 0 fail/cancel/skip; raw log preserved. Local full finance248/248 and UI/recovery20/20 pass. Local relay all79:78 pass,1 historical awareness fail; do not convert that to green because the27-case CI subset passed.

Full CI43937264804 completed FAILURE in both targets: candidate3207 tests/3144pass/59fail/1cancel/3skip; baseline3148/3075/69/1/3. Complete failure names, shared and exclusive sets in full-ci-comparison.json. A single candidate-exclusive name in this run: Fable P1-4 WebKit lease storage-pressure, two racks observed then a later read lost one. No causal link to the payment change is claimed; investigate before classifying. Missing git b8bd538 and loteAnexosPiloto in extracted VM fixtures explain some shared failures, not all.

GitHub connector independently read back six critical code/test/integrity files from e9ff257; all Git blob hashes match local (github-readback.json). Further work explicitly authorized by JFC is recorded as Tasks5–7 in the persisted plan.

## Followup: actual stale fichas receiver data loss

While investigating the candidate-only WebKit cold-load occurrence, a deterministic independent route was reproduced through the REAL backend: two tabs share A/B; A commits a rack/product/17-dollar cash sale; stale B receives fichas and saves its old complete snapshot with a newer revision. A cold reader loses A's rack/product/sale. This is confirmed through the public OCSync.aplicarFichas interface, not an extracted mock of the save function. The exact WebKit lease audit occurrence is not yet causally attributed to this path.

Minimum integration: aplicarFichas reuses the existing local-write FIFO, snapshots the incoming payload, waits its own pending save, then uses the SAME reload-before-write helper as API mutations. The production sync-realtime caller now awaits it before recording receive signatures. Stock test callers also await the new asynchronous completion. No new accounting/sync engine or storage format.

Independent review found an Important lifecycle edge in that asynchronous change: an old-room payload could wait behind a sale, then apply after a notebook switch and tag the CURRENT license's factory PIN. Actual VM reproduction confirmed old-room rack plus wrong-license PIN marker. Added separate RED notebook/generation tests; backend captures license/namespace and checks them after waits, accepts a connection-validity callback, and the sole sync caller checks its existing generation/socket/notebook before execution and again before signatures. GREEN final30/30 (4 VM cases,2 native Chromium/WebKit cases,24 existing stock/checkpoint cases), zero skips. Relevant logs: stale-fichas-red.txt, fichas-context-red.txt, fichas-final.txt. The39-case tab/fiado/stock group also passed before the final lifecycle guard; its exact timing is preserved, not presented as verification of the later guard.

The returned result remains a local merge result, NOT a remote commercial ACK. A durable local sale is never rolled back due to later connection change; obsolete queued incoming content is rejected before merge/PIN adoption.

## Followup: historical verification sources

Three shared VM failures were missing actual helper dependencies after extracting sembrar from sync-yjs.js. Fixtures now include the real adjacent helper source (no stubbed allow/deny),19/19 pass. Tests that read old code were failing because workshop history is a different repository. Recovered exact public friendly-123 commits for v459, v606/v607, v636/v639 and the pinned old HTML. Full-audit workflow fetches those immutable refs and supplies the two existing historical-bridge environment variables to BOTH candidate and baseline. Nothing is replaced with current code. Local historical suites58/58 plus mixed-v6364/4 pass; prior RED traces are in the full audit logs.

Current-source identity and public readback must be updated after this followup commit. Global suite still has unclassified/missing-hosting-source/PWA/static failures; do not call those fixed or delete their assertions.
