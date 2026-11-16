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
- [ ] Add tests for absent/throwing/denied provider, authenticated principal, cross-license and revocation; capture functional RED.
- [ ] Add minimal guard and update explicit QA-only allowlists. Preserve historical canonical command/receipt bytes and other kinds.
- [ ] Run unit, payload rollback and real SQLite restart/conflict tests; save logs, commit and push.

## Task 2 — Save retry race
Files: app/test/v608-guardado-veraz.test.cjs, app/docs/mock-backend.js only if independently reproduced; add focused deterministic test if needed.
- [ ] Run existing browser regression and inspect callers of retry scheduler/reset. Compare baseline if reproduced.
- [ ] Reproduce extra 3000ms retry deterministically before runtime edit. If no reproduction, record unresolved evidence; never loosen assertion or label fixed.
- [ ] Minimal shared-cause fix if established; test bounded retries and successful-save reset, preserving A/B and IDB durability. Run affected core suite, save logs, push.

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
