# Diagnose Chromium/WebKit A→B→A missed phone sale under historical audit (P0)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:systematic-debugging → test-driven-development → executing-plans → verification-before-completion; follow this plan task-by-task and preserve RED/GREEN evidence before any product changes.

**Goal:** Explain and reproduce the native browser A→B manual Yjs pump divergence (A stock 7, one receipt; B stock 6, two), distinguishing test fixture transport capture from real business synchronization.

**Architecture:** First run the **unchanged** existing test repeatedly on exact assembled v783 source in a dedicated GitHub workflow, using two real browser engines and *separate IndexedDB profiles*. If failure reproduces, observe four boundaries: B commercial sale commit, B Yjs map + outgoing update queue, pump delivery into A Yjs, and A commercial projection/readback. This is diagnosis only; user data/servers/roles cannot be changed. Keep initial errors visible. Only after root cause and RED evidence consider a minimal fix in the correct component, in a separate scoped PR.

**Tech stack:** Node22, `node:test`, Playwright official Chromium+WebKit, existing `app/test/helpers/e2e-app.cjs`, Yjs, local HTTP server, no real network, no service worker. Plan/reservation in [Notion](https://app.notion.com/p/41b1642b67f3819e980ef02c66cd55a9).

**Spec:** [JFC approved MDD](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac); [user physical A→B→A×2 hard rule, workshop report](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/reports/2026-11-16-a2b2a-native-red-green-provenance.md). Base workshop main `3dad8c512c3fe4a95b2082bdc31d53c1af21b5a4`, code app test `p0-a2b2a-chromium-webkit-stock-sales.test.cjs@a0adf71d645b7abf3bb544b5290243b71710dd4f`, helper `e2e-app.cjs@94de10bcf4ea4648420962c274a5b6a37da746c8`.

## Global constraints

- No runtime edits, no changes to `docs/sync-yjs.js`, `mock-backend.js`, `sync-outbox.js`, `e2e-app.cjs`, YParty Worker or license/Owner/PIN. No production deploy, no flag.
- Tests run **offline synthetic only**; same exact local license in two real native engines and separate IDB; both as synthetic Owner. Manual Yjs pump is **NOT** the remote provider/ACK.
- Keep exact 8 initial units, two cycles, 4 unique receipts and idempotent retry, cold reload; never use stock snapshots or set to 7/6 artificially.
- Do NOT increase timeout or loosen stock receipt assertions to obtain green. No uncontrolled long background CI; bounded five independent samples with actual results and explicit timestamp.
- Root-cause gate requires cause at one of: B local Yjs emit; listener buffer; pump A delivery; A projection; original 3 quiet-round early break; browser CPU load. Report unknown if cannot discriminate.
- Source branch ownership reserved only to new plan+workflow and possible diagnostic-only additions in the existing test, after pre-code RED. Other agents own Workerd PR12/13, outbox and deployment.

## Why here

[Full merged audit after PR78](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44110987614) finished candidate 3276 tests, 3242 PASS, **30 FAIL**, 1 CANCEL, 3 SKIP. Previous [full postPR77](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44106406835) candidate 3276, 3237 PASS, **35 FAIL**, 1 CANCEL, 3 SKIP. Six older VM handler tests fixed. A native browser test not failing in prior run now fails:
```
B→A cycle 1: A {stock:7,receipts:[1,0]}, B {stock:6,receipts:[1,1]}.
Both: Yjs product:true, commercial product:true, recovering:true, headAccess:false,
localRecoveryPending:false, applyError:"". Twelve seconds before timeout.
```
This is real regression *evidence*, not proof of a product root cause; full audit executes other tests concurrently, whereas the [original PR68 isolated GREEN](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43997058974) occurred at lighter load.

## Review focus

1. B durable receipt may precede B's Yjs `doc.on('update')`: manual pump can stop after 3 quiet rounds; characterize measured lag rather than guessing.
2. The Y.Doc could be replaced after listener install; a test attached to old doc silently captures nothing. Check current `OCYjs.doc` vs hooked document identity **without printing content**.
3. A Yjs update may have applied but commercial projection not caught up; observe each layer separately without showing customer data.
4. Client reload removes hooks; `installPump` called after reload, but race could leave update before hook attachment; compare rejoin full-state and incremental paths.
5. Deterministic dual device isolation: check two browser contexts have distinct storage; no real Firebase, SW or externally generated identifiers.

---

### Task 1: Run existing test unchanged as strict reproducibility experiment

**Files**
- Create `.github/workflows/qa-a2b2a-repro-stress.yml` only after this plan commit. No changes to existing test until CI baseline.

- [ ] Create PR draft from pinned branch, link reservation.
- [ ] CI install locked dependencies, Playwright chromium+webkit, then execute `node --test test/p0-a2b2a-chromium-webkit-stock-sales.test.cjs` FIVE independent processes, capture result of each; do not alter timeout or assertion, preserve errors on failure. Stop on hard GitHub timeout 14min.
- [ ] Run actual CI, inspect exact SHA/joblogs. If 0/5 failures in isolated run, add a concurrent load case only with a reproducible isolated helper, not arbitrary sleeps or production changes.
- [ ] Record ALL attempts and TAP in Notion + plan. A pass isolated does not invalidate full-suite failing case.

### Task 2: Diagnose 4 boundaries (only if red reproduced)

**File** `projects/assembled-v783/app/test/p0-a2b2a-chromium-webkit-stock-sales.test.cjs`, diagnostic-only.

- [ ] Before changes, persist exact failure, hypothesized boundary and expected diagnostics.
- [ ] Add only to **failure-path** JSON summary: B outgoing count `__out.length`, Yjs sales/operation map count, A corresponding op presence, active document listener marker, local app receipt counts and strictly bounded UTF8-safe errors; **no customer content, PIN, token, license, raw ciphertext or full opIds**. Never modify assertions, number of pump rounds or delays.
- [ ] Run CI again. If no failure occurs, document environmental/CI evidence and do not claim fix.
- [ ] If reproducible, reduce to one failing test at real component; TDD actual RED→GREEN and 585 integrated. A root cause in shared helper or runtime requires a new file reservation and source-first review, not this diagnostic scope.

### Task 3: Preserve & integrate isolated evidence only

- [ ] No merge unless diagnostics are grounded and tests are compatible. If only CI new and no source change, merge workshop QA tool after evidence; production remains untouched.
- [ ] Full audit result and blocking commercial issues remain listed (29 historic failures; owner authority, YParty PR13, remote 15 parents, physical Safari/Opera A↔B↔A×2).
- [ ] Handoff via Notion and workshop STATUS, including observed sample histogram, test fixture sha, workflow links, and future next action.

**Rollback:** Delete only new workflow and plan/test diagnostic if needed. No product mutation or client data.

## Evidence-backed root-cause refinement — BEFORE code, 17 Nov

Original source comparisons (no app changes):
- `app/docs/sync-yjs.js` around lines 2645–2673 creates a separate `API.opsDoc = new Y.Doc()`, `API.opsMap = API.opsDoc.getMap('eventos')`, `API.opsCanal`. App publishes business events on `oc-op-local` into this separate doc; remote event consumer `OCSync.aplicarOpRemota` is idempotent.
- `app/test/helpers/e2e-app.cjs` lines 45–72 implements `installPump` and `pump`. It reads `Y.encodeStateAsUpdate(OCYjs.doc)` and hooks `OCYjs.doc.on('update')` ONLY, never `OCYjs.opsDoc`. Thus the two-browser test helper omits the REAL independent operations room. Whether this omission explains the intermittent sale mismatch requires a native behavioral RED→GREEN, not a claim from code reading alone.
- Business save is durable local-first, stock op emitted after saving. Genuine ops relay should transmit Yjs updates from opsDoc; old manual test pump never does.

**Scoped addition BEFORE code:** reserve test-only shared helper `projects/assembled-v783/app/test/helpers/e2e-app.cjs` blob `94de10bcf4ea4648420962c274a5b6a37da746c8` and NEW native browser test `app/test/p0-dual-yjs-room-pump.test.cjs`. The helper will be changed ONLY after RED proves missing opsDoc transfer. This is test infrastructure, NOT product runtime. Do not change original A→B→A assertions or timeouts.

**Expected minimal fix:** snapshot and observe both `OCYjs.doc` (catalog) and `OCYjs.opsDoc` (commercial ops) separately. Pump each encrypted/Yjs update into matching remote Y.Doc using origin 'red'; apply catalog projection via original `_store.aplicar()`; opsDoc original 'red' listener already calls `pedirProcesarEventos`. Preserve two-way initial full-state and incremental updates, no network. Do not change fotosDoc or other subsystems.

**Native RED contract:** two real Chromium/WebKit browsers, separate IDB, same synthetic license and Owner arnes. After `installPump([A,B])`, WebKit writes a non-commercial marker into `OCYjs.opsDoc.getMap('__qa_probe')`; Chromium should receive it after `pump(A,B)`, and vice versa. Catalog marker via `OCYjs.doc.getMap('__qa_probe')` must cross as a positive control. No writes to `opsMap/eventos` or business stock or access. On pre-fix helper opsDoc receipt must fail semantically, while catalog succeeds. Then patch helper only, GREEN dual-room, run original 2-cycle A→B→A five samples, browser integrated 585, full 3K with all remaining failures enumerated.

**No permissions** granted to real clients, YParty, photos, PIN, Worker, SW, provider, business source or production. New branch PR79 and Notion reservation are ownership source of truth. Historical 15 missing remote causal parents still unknown.

## Original unmodified native QA results and pre-fix dual-room RED experiment

- [Run 44114041160](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44114041160), original fixture and helper SHA 39f63d480b63b26c7e10444fb79fe7f3d4be7da2: 5/5 independent native Chromium/WebKit A→B→A successes.
- [Concurrent PR run 44114065356](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44114065356), *same SHA*, failed the first of its five tests on INITIAL JOIN before sales: Chromium Yjs product missing (0) versus WebKit present (1). Due shell fail-fast, this run did NOT execute all five; do not claim a 5-sample failure rate for it. Thus flaky behavior is real in test harness even during catalog transfer, not only late B sale.
- [Historical full run 44110987614](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44110987614) failed B sale A stock7/one receipt vs B stock6/two.
- Added separate REAL native browser dual-room probe via new test at commit 4886f1c053f71e5e1e08289a75005131d0a72a6d. Probe writes synthetic non-economic Yjs markers into catalog doc and OPS doc, no business data. Workflow commit 3566a96ce1e53bed3417ffce032c7f32d1c3438c runs this probe before sale samples using unchanged test helper. RED pending log. Only after a valid RED may helper be patched.

## Mandatory TDD RED before helper patch — proof, not supposition

- [GitHub Actions 44114727330](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44114727330), job 134149567026, exact SHA `3566a96ce1e53bed3417ffce032c7f32d1c3438c`: **1/1 semantic FAIL expected**, 0 cancelled/skipped, actual native Chromium+WebKit against current REAL app docs and unchanged helper. The positive control (catalog marker B→A) PASSED. Fail at test line 36: `B→A independent ops room must cross the manual Yjs pump`, expected `ops-received`, actual `null`. No setup, dependency, syntax, network, app source or nondeterministic timeout failure. This proves **missing operations room on manual test helper**, not server economics permission.
- Root-cause code: helper snapshots/listens to `OCYjs.doc` alone, though `sync-yjs.js` uses `OCYjs.opsDoc` for sale opIds. Original helper also installs listener only AFTER both snapshots, leaving a race for any update created during the initial handshake. Initial-join flake appeared in unchanged helper on [CI 44114065356](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44114065356) first run (no sale).
- **Minimal helper scope NOW authorized by Notion reservation:** modify ONLY `app/test/helpers/e2e-app.cjs` to install idempotent per-doc listeners BEFORE full exchange, maintain catalog `__out` and ops `__opsOut` queues, two-way initial Yjs state exchange for BOTH documents, and per-round route updates to matching remote Y.Doc with `origin:'red'`. Call `_store.aplicar()` only for catalog updates (the original opsDoc listener schedules its own event processor). Do not change pump iteration/quiet budget or original sale assertions, to attribute any residual flake honestly. No test data access/real provider.
- Before patch commit, record this in Notion. Then run dual-room GREEN and unmodified 2-cycle sale five samples, plus 585 integrated and full 3K after merge. If still RED, inspect B emission and A business projection separately instead of increasing retries or setting stock values.
