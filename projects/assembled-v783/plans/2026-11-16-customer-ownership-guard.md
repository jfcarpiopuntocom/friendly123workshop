# Customer ownership guard for typed inbox — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Implement test RED → functional GREEN → Workerd SQLite, read exact CI logs, preserve rollback.

**Goal:** prevent `credit.customer.payment.record` from being stored or replayed under a license unless a trusted server-side customer ownership reader verifies `clienteId` within that specific license and principal context.

**Architecture:** Extend existing `createTypedCommercialLedger` constructor with optional callback `authorizeCustomer({license,clienteId,principal})` (only server code supplies this). For the *new* `credit.customer.payment.record` kind, **require the callback** and strict boolean `true` result on every call; missing/throws→503; deny/false→403. The callback runs only **after** trusted issuer proves license/scope, but **before** any SQLite reads or writes. No change to previous kinds or payload bytes. Workerd test injects an explicit synthetic membership predicate; product has no such reader yet, so new kind remains unavailable, fail-closed.

**Tech stack:** existing Node22 ESM, Cloudflare SQLite Durable Object `transactionSync`, Miniflare Workerd and compiled QA bundle. No dependency changes.

**Spec:** Notion [live injertos](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902), based on `main@4992e1b0e0382b043f91c82816ba5423d2a94da1`.

## Global constraints
- No production activation, no issuer CEILING modifications, no `ops:payment` grant, no client app/PIN/PWA/index.js changes.
- Existing sale/expense/legacy receivable inbox semantics byte-identical and permitted independently of customer callback.
- Every replay re-checks issuer AND customer owner; no cached trust.
- Callback is trusted **server-only**, never supplied by browser or by command.
- The browser local namespace `f123` is app-level, not license proof; the actual source-of-truth for customer ownership is still a future dependency.
- The receipt stage remains `stored-for-application`, not business commit.

### Task 1: tests RED
- [ ] Extend existing `qa/p0-typed-commercial-ledger.test.mjs` fixture to accept `authorizeCustomer` injectable, default synthetic customer membership only inside tests.
- [ ] Missing callback→503 no DB access; false→403; throwing→503; changed `clienteId` denied even when malformed? Test valid alternate ID; callback sees exact principal.
- [ ] First authorized submission then membership revoked→403 on duplicate, no receipt leaked or new writes.
- [ ] Existing `sale.record`, `expense.record`, `credit.payment.record` unaffected by absence of callback; issuer denial wins before callback.
- [ ] Run CI RED, verify expected 200 actual 403/503 mismatches, no fixture errors.

### Task 2: minimal safe server guard GREEN
- [ ] Add `authorizeCustomer` to ledger constructor (no new endpoint).
- [ ] After issuer authentication and before digest/SQLite on customer payment only, require trusted callback, catch exceptions, require `===true`; return no receipt or payload.
- [ ] Reverify duplicate receipts. Run focal unit and existing cases.

### Task 3: real Workerd + integration
- [ ] QA-only Worker fixture injects `authorizeCustomer` with only `client_1` in `F123-SYNTHETIC-LEDGER`, no production storage.
- [ ] Workerd restarts/replay and amount conflicts still succeed for approved synthetic client; unauthorized client denied.
- [ ] Full `assembled-browser-qa.yml` + focal exact HEAD. Verify diff and report in Notion.
- [ ] PR laboratory only, no customer deploy; rollback is ignoring new kind with missing callback (deny), not accepting an unauthenticated payment.

## Review focus
- Scope denial must precede customer callback; no side-channel from row existence.
- Ownership revocation must block duplicate receipt read.
- Database stays untouched after ownership error, and missing callback never falls through.
- Existing kinds unaffected, historical payload hash immutable.
- Do not infer license from local IndexedDB prefix; a real tenant-customer registry must prove it.
