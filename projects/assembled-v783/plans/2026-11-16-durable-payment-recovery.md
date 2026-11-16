# Durable payment confirmation and recovery — implementation plan

> For agentic workers: use superpowers:executing-plans, Ponytail full, RED → GREEN, one independent final review. JFC explicitly greenlit continuous execution and requested this plan saved before implementation.

**Goal:** advance the existing browser candidate without duplicating money or claiming a remote inbox receipt is a business commit.
**Architecture:** preserve the existing app ledger, imported Dinero/Yjs components and SQLite inbox. Extend the existing trusted resource guard to legacy receivables; investigate the observed save retry race; implement durable customer-payment confirmation using the real application ledger and stable opId, only where authority and atomic persistence can be proved.
**Tech stack:** existing JS/ESM, Node, Playwright Chromium/WebKit, IndexedDB, Workerd SQLite. No new dependency or standalone accounting engine.
**Spec:** START-HERE.md, STATUS.md, customer-payment reports, and Notion live handoff 4181642b67f381c0a3eff1ff56e44902. Immutable start: a5d845bb3997b99321cf42aea6d51f4f03e65776.

## Constraints and decisions
- JFC requested no pauses for routine confirmation. Native execution; final independent review required.
- Work only under projects/assembled-v783. No production deployment, PWA/SW changes, client data, new login, namespace migration, or issuer scope expansion.
- Keep stored-for-application distinct from business-committed. No customerId=receivableId assumption, automatic allocation, or new payment fact on a transport retry.
- Keep canonical historical bytes, receipts, rollback and outbox. Missing authority fails closed for remote commands; local durable operations survive remote rejection.
- Read current main before every push; never force/reset/amend; no unsolicited branch or PR. Checkpoints on existing main are authorized delivery to workshop, whose projects/ is excluded from Pages.
- Ponytail source: jfcarpiopuntocom/ponytail skills/ponytail/SKILL.md; recovered via the user's Notion token guide. Cloud environment does not prove Windows TokenEconomizer hooks active.

## Review focus
Revocation on duplicate receipt; authority errors before SQL; intent mutation across await; crash after durable write before ACK; cross-tab/reload duplicate and rounding stability.

## Task 1 — Legacy receivable guard
Files: relay/injertos/yparty-worker/src/typed-commercial-ledger.mjs, qa/p0-typed-commercial-ledger.test.mjs, qa/fixtures/typed-ledger-worker.mjs, qa/p0-typed-commercial-ledger-workerd.test.mjs.
Interface: authorizeReceivable({license,receivableId,principal}) returns strict true server-side. Missing/throws => 503 receivable-authority-unavailable; deny/nonboolean => 403 receivable-not-authorized. Recheck each submit, after issuer before SQL.
- [x] Add tests for absent/throwing/denied provider, authenticated principal, cross-license and revocation; capture functional RED.
- [x] Add minimal guard and update explicit QA-only allowlists. Preserve historical canonical command/receipt bytes and other kinds.
- [x] Run unit, payload rollback and real SQLite restart/conflict tests; save logs, commit and push.

## Task 2 — Save retry race
Files: app/test/v608-guardado-veraz.test.cjs, app/docs/mock-backend.js only if independently reproduced; add focused deterministic test if needed.
- [x] Run existing browser regression and inspect callers of retry scheduler/reset. Compare baseline if reproduced.
- [x] Reproduce extra 3000ms retry deterministically before runtime edit. If no reproduction, record unresolved evidence; never loosen assertion or label fixed.
- [x] Minimal shared-cause fix if established; test bounded retries and successful-save reset, preserving A/B and IDB durability. Run affected core suite, save logs, push.

## Task 3 — Durable application confirmation
Files: existing app/src/credit-payment-command.mjs and adjacent integration module/tests as needed; inspect app/docs/cartera.js and hechos.js before choosing write boundary.
- [ ] Map source → authorization → durable application ledger → readback → receipt → replay. Document actual limits rather than inventing distributed atomicity.
- [ ] RED tests for inbox-only receipt, missing/mismatched/ambiguous durable fact, same opId retry/reload, amount/customer conflict, authority denial and failed readback.
- [ ] Reuse existing ledger interfaces. Confirm only the same durable payment; no duplicate write or automatic allocation. If a real receiver cannot apply atomically with trusted license binding, preserve fail-closed and record precise missing integration instead of adding an unsafe executor.
- [ ] Real browser/IndexedDB tests and financial regression; save evidence, commit and push.

## Task 4 — Review, full checks and handoff
- [ ] npm ci from lockfiles; focused tests before broad checks. Run syntax/diff checks and required project suite; report every failed/skipped/environment-limited result separately.
- [ ] Independent reviewer of exact diff and trust/durability edges; fix consequential findings with RED→GREEN.
- [ ] Update STATUS and report with exact SHAs, commands, outcomes and remaining gates; update existing Notion handoff without replacing history.
- [ ] Push all changes; verify GitHub readback of critical bytes/SHA. No claim of production GO or physical Safari/Opera without evidence.

## Execution ledger
- Preflight: recovered attachment, AGENTS/CLAUDE, current source, latest Notion handoff and Ponytail skill. Baseline clean. Local pre-change archive under /workspace/work/checkpoints; main already remotely preserved.

- Task 1 complete: functional RED 5 failures (wrongly accepted or missing authority call), GREEN 41/41, 0 skip/cancel, real Workerd SQLite restart included. Logs evidence/payment-recovery/legacy-guard-{red,green}.txt. Existing customer guard unchanged; legacy kinds now require trusted receivable authority. No production provider or scope added.

- Task 3 ruling: the real application already has a payment consumer (Cartera → Hechos) and duplicate callback; adding a detached ACK adapter would not complete remote authority. Reuse and fix its atomic boundary instead. Forced concurrent hashes reproduce two facts/effects for one opId across authors sharing IDB (activation overlap). Move existing repetido callback into the same readwrite transaction as add; no new DB, writer, dependency or remote ACK. Initial fake-IDB RED 0/2 → GREEN 2/2; real Chromium also passes, WebKit host libs missing locally. Trusted server ownership/human binding and remote business-committed remain gates, not inferred from browser data.
- User added Claude-BugHunter URL during work. Source pinned 2f9a226d38d35d28d06f1ed63753799d498a2b3d; applying hunt-race-condition, hunt-business-logic and hunt-idor methodologies to synthetic lab only. Do not run external scans or install all 83 skills indiscriminately. Ponytail pinned 96608e078b2d5ea607c5c3b8b5a54d1c1fba6846.

- Task 2 complete: existing test RED 4/5 with 7 timers instead of 5. Instrumented source traces showed all actual storage calls progress 0→1→2→3→4→5 with NO success/reset; extra 3000ms timers originate relay-selector.js:537 (Supabase/Firebase reconnect). Root cause is test contamination, not money runtime. Test now records/accelerates only _falloGuardadoLocal-origin timers and includes deliberate unrelated timer; GREEN 5/5. Runtime mock-backend.js byte unchanged. Evidence retry-baseline.txt, retry-origins-1/2/3.txt, retry-green.txt. No need to compare/modify baseline runtime once exact foreign timers are proven.

- Final review: independent reviewer found no Critical/Important in a5d845bb..3e2d23c. Minor relation mutation across hash await reproduced and fixed (not deferred): snapshot relation; payment-intent-red.txt → payment-intent-green.txt 18/18. Abort regression verifies no receipt/meta/event and same-opId recovery. Both native browser engines pass 2/2 after isolated host library setup; no tests skipped. Expanded UI suite and bare npm test/global CI still running.

## Continued authorized work after full audit (JFC reiterated greenlight)

Exact e9ff257 integrated CI 43937264730: 554/554, zero fail/skip/cancel. Full CI43937264804 candidate3144/3207 pass,59fail,1cancel,3skip; baseline3075/3148 pass,69fail,1cancel,3skip. Every failing name is preserved in evidence/payment-recovery/full-ci-comparison.json. Candidate-only occurrence: WebKit lease storage-pressure cold-load test; do not call it flaky or fixed without reproduction.

### Task 5 — restore historical verification, not runtime workarounds
- [ ] Classify every full-audit failure by its actual trace: arnés dependency, absent historical git object, obsolete source assertion, environment, or reproducible runtime behavior. Keep unclassified until evidence exists.
- [ ] For incident-stale-stock-metadata-v558.test.js and e4-owner-name-role.test.cjs extracted seed fixture, include the ACTUAL dependencies used by sync-yjs.js (loteAnexosPiloto etc.); do not stub the domain behavior under assertion. Capture RED before test-fixture fix and GREEN after; runtime unchanged.
- [ ] For historical reader/bridge tests using git show, enumerate exact refs and repository origins; recover exact public source commits in CI or pin byte-verified existing fixtures. Never replace old code with current code, skip tests, or fabricate a commit.
- [ ] Rerun affected suites and save test-only changes/checkpoints. Regenerate runtime manifest only if runtime actually changed.

### Task 6 — WebKit cold-load write disappearance
- [ ] Reproduce test/tab-session-handoff.test.js exact WebKit lease case in isolation; reviewer independently traces initial IDB state, third-page restore, later catalog/stores and API reads.
- [ ] Add deterministic control at the actual asynchronous boundary before any product fix. Preserve both rack names exactly once; an HTTP2xx or a transient correct read is insufficient.
- [ ] Fix only demonstrated root cause, then verify two-tab writes, restart, hydration and monetary regressions. If no stable reproduction, retain unresolved result and causal trace rather than change test timing/limits.

### Task 7 — remaining security and delivery gates
- [ ] Historical awareness 78/79 local vs27/27 integrated subset: independent review finds no bypass path but cannot causally identify late frame. Preserve zero-frame assertion. Next diagnostic must correlate payload SHA, decision/response/send and revoke/receive phase; ordinal grants are insufficient. Do not repeat the old five passes as proof.
- [ ] Re-run exact final integrated/full checks when changes justify it, preserve all failures and update current STATUS/Notion and next-code plan. No deployment or issuer scope expansion.

- Task5 fixture dependency RED3 failures → GREEN19/19 using actual sembrarAnexos/loteAnexosPiloto/finance helper source from sync-yjs.js; no production change or domain stubs. Historical-source recovery not yet complete.
- Task6 confirmed a concrete source path with actual backend API: two VM tabs share A/B storage; tabA durably creates a rack; stale tabB calls existing OCSync.aplicarFichas with another rack; its background save allocates a newer revision from stale RAM, and cold tabC no longer sees rackA. This is a demonstrated bug, not yet proof it caused the exact intermittent WebKit test. Minimal proposed fix: reuse _recargarSiOtraPestanaEscribio at aplicarFichas entry BEFORE merge, as all API writes already do. Add RED test that also preserves peer product/sale/stock, then GREEN and native-tab regression. Do not introduce a generic new accounting/merge engine.

- Task6 ruling before implementation: a bare synchronous preflight could overwrite a provisional local sale or a pending background snapshot. Reuse the EXISTING _colaEscriturasLocal FIFO for aplicarFichas, await its pending catalog save, then use the API's existing _recargarSiOtraPestanaEscribio before merging. Preserve snapshot of incoming f while queued. Update the sole production caller in sync-realtime.js to await before marking received; update both existing stock-ficha test calls to await. Return is a completed merge result, still NOT a remote financial ACK. Add concurrency test with the real local API while this lane waits.

- Task6 independent review Important fixed: queued old-room fichas could adopt a PIN under a newly selected license. Added license/namespace snapshot plus execution-time generation callback, rechecked before caller receive signatures; notebook/generation RED2 → GREEN final30/30 including both native engines and24 stock cases. Incoming content snapshot stable and local in-flight sale preserved. No remote ACK claimed. New exact-SHA CI pending.
- Task5 exact public historical commits recovered, original reader/bridge fixtures58/58 and mixed-v6364/4 pass. Full audit CI now fetches exact immutable sources for both targets. Seed fixture19/19 passes without runtime edits. Global failure triage remains open beyond these evidenced causes.

- Further classified shared-name failures: app/docs/workshop-brand.js tests /friendly123workshop/i against all location.href, so file:// paths under this repo activate the lab header and replace expected shop names with VERSIÓN DE PRUEBAS. Origin scoping is a separate next fix; do not remove the real workshop safety label to make tests pass. Missing sitio-friendly123/official-app.mjs and app/.github release workflows are packaging/hosting-source gaps, not proof of monetary failure. PWA-related tests remain deferred by user order, assertions preserved.

- Final source edge reproduced and fixed locally: aplicarFichas returned ok:true even when guardarEstadoLocal=false. Return explicit failed merge result, preventing receive signatures on unconfirmed RAM; same-record recovery test RED→GREEN29/29 with existing stock cases. Native final31-case run in progress. Patch backed up under checkpoints/fichas-save-readback BEFORE waiting for d132 full CI to avoid losing either code or CI evidence. d132 integrated43942634639 is SUCCESS584/584, raw log/summary saved.

- Final failed-save followup final31/31 local passes including Chromium/WebKit; same incoming intent persists once after refusal/recovery. d132 fullCI43942634062 finished RED in both baseline/candidate; raw logs being read before new source commit. The pending patch can now be integrated without cancelling an earlier audit.

## Exact next commercial boundary (not implemented by the current fixes)

Do not restart or rebuild the app. The next builder starts at current main, reads STATUS, the two readback JSONs, final CI logs, and this ledger. Existing Owner-private and browser money paths stay as-is until a complete authorized consumer is proved.

1. **Reuse the real Team authority, do not invent a login.** app/cloudflare-worker/team-authority.mjs ALREADY implements update/verify/isCurrent/status with server-owned subject, roleRevision and sessionEpoch in the license DO. ws-authorized-subject.mjs is currently Owner-account-only and does not consume that Team source. Inspect ws-worker-api.mjs, ws-capability-issuer.mjs and worker.js wiring. Next change needs RED cases for verified Team subject → correct role, forged browser role/subject, revoked member or instance, changed role revision between resolve/issue/use, and authority failure. Preserve Owner-account semantics; never relabel it a uniquely identified human. Issuer CEILING and unconfigured scopes remain unchanged until their actual data/action boundary is tested.
2. **Bind role-specific read projections before opening rooms.** Relay src/catalog-safe-projection.mjs already constructs an allowlist Y.Doc. Connect only authenticated principal to the correct server materialized projection; do not hand shared raw Owner Y.Doc to staff/accountant/artist/support. Test serialized binary frames for costs, prices/numbers/contacts/PINs forbidden to the role, and expiry/revocation/restart. src/ws-authority-client.js currently accepts only Owner-private: changing it without those projection tests is not integration.
3. **Define trusted customer/receivable bootstrap.** typed-commercial-ledger.mjs now has both mandatory resource guards, but no product registry provider. Neither Hechos DB name nor browser-supplied clienteId or role proves license ownership. Reuse the license authority transaction model for an independently authenticated registry/bootstrap; require explicit legitimate authority for membership and revision changes. Do not fabricate receivableId=clienteId, auto-allocate payments, or seed real customer rows from QA fixtures.
4. **Wire an actual receiver without a second accounting engine.** app/src/credit-payment-command.mjs is an unsubmitted readback projector; the SQLite inbox stores payloads but performs no money write. Map the ORIGINAL committed fact and opId through authenticated transport into existing Hechos/Cartera, prove tenant/source binding and dedup in the SAME local transaction as effect. Require durable readback before business-committed; crash after commit before response must return the same receipt on retry. Failure before commit leaves original local fact/outbox pending; rejection never deletes a local sale. Never introduce a parallel SQL cash ledger merely to make an ACK test pass.
5. **Lifecycle, photos and physical acceptance.** Integrate existing authorized-yprovider.mjs renewal/pause with app logout/notebook events; retain queued-source guard patterns from fichas. Photo ACK must bind blob SHA to durable remote bytes and cold restart, not just a URL/connected/synced signal. Correlate awareness send decision/response/actual frame with revoke/receive, retaining original zero-frame regression. Finally exercise two PC→Safari/Opera→PC rounds and approved load before any customer GO. Real-device tests cannot be claimed from Playwright engines.

All work/RED/GREEN evidence and incremental plans go to projects/assembled-v783 in friendly123workshop before interrupted-session boundaries. Use Ponytail full and existing components; no unsolicited deployment/PR/new branch, no PWA work, no customer profiles or private data in this public repository.
