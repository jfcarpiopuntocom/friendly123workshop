# Customer payment → typed inbox contract implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) task-by-task. Commit RED before GREEN, verify exact SHA, and keep evidence.

**Goal:** preserve a real persisted `cartera_abono` as a replayable, tenant-scoped typed inbox operation with its exact `customer-payment:<UUID>` opId, without ever equating a client with a receivable or returning a business ACK.

**Architecture:** Add an additive `credit.customer.payment.record` inbox kind carrying `clienteId` and `amountCents`. Keep the old `credit.payment.record(receivableId)` legacy kind unchanged for existing stored receipts, with no executor. Add a pure local `readPersistedFacts()` projection that builds the new kind from an already-durable `cartera_abono`; never wires network or changes historical books.

**Tech stack:** existing Node22 ESM, `AMG.Hechos.todos()`, Dinero.js-loaded `cartera.js`, Cloudflare `transactionSync` inbox via existing `createTypedCommercialLedger`, Miniflare/Workerd real SQLite fixtures.

**Spec:** [Notion — live injertos relay](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902). Origin `main@0fef969ddfd704d034f26bd61eb63a0b147d10b7`.

## Global constraints
- Only `projects/assembled-v783/` on isolated branch. No production `jfcarpiopuntocom/friendly-123`, no PWA, SW, PIN, role service, Yjs, sales/stock, customer data, remote deployment, or real credentials.
- `stored-for-application` is **not** `business-committed`. Never issue business acknowledgement from an inbox write.
- No bridge from `receivableId` to `clienteId`. Payment allocation `cartera_aplicacion(abonoId,cargoKey,partes)` remains a separate human-approved operation; no FIFO.
- Existing `credit.payment.record` bytes and stored receipts unchanged. Never alter the meaning of a committed opId or invent missing payload.
- Permit only the prefix `customer-payment:` followed by bounded safe ID characters for the new kind; old kinds keep original tight ID guard.
- Write server-side `ops:payment` still requires trustworthy issuer; no new service binding or client-side role claims.

## Files & tasks

### Task 1 — typed inbox schema (RED→GREEN)
- [ ] Add failing cases to `relay/injertos/yparty-worker/qa/p0-typed-commercial-ledger.test.mjs`: `credit.customer.payment.record` with `clienteId`, same `customer-payment:UUID`, exact receipt and one row; replay without duplicate; changed `clienteId`/cents returns 409; reject role, PIN, customerPhone, `receivableId`, `cargoKey`, 0 cents, malicious opId; older `credit.payment.record` unaffected. Verify RED on Actions SHA.
- [ ] Minimal change in `relay/injertos/yparty-worker/src/typed-commercial-ledger.mjs`: new validated kind, positive cents, prefix-only opId syntax **new kind only**, same `ops:payment`, same canonical SQL transaction, ACK stage unchanged.
- [ ] GREEN with node test + existing Workerd SQLite tests. No unsafe ACL bypass.

### Task 2 — persisted-fact projection (RED→GREEN)
- [ ] Add failing browser/Node tests `app/test/p0-customer-payment-command.test.cjs` and ESM import `app/src/credit-payment-command.mjs`.
- [ ] API: `creditPaymentCommandFromDurableFact({license,opId,readPersistedFacts})`. **Await** a fresh `AMG.Hechos.todos`-style readback; require exactly one matching fact with type `cartera_abono` and matching `opId`; project stored cents, never recompute half-up from raw requested amount.
- [ ] Reject missing, duplicate/colliding, malformed, unsupported engine, non-cent, zero/unsafe, wrong customer, mismatched license format; preserve opId verbatim. Do not use browser-provided `role` as authority.
- [ ] Verify test includes existing `customer-payment:<UUID>` format, historical 1.00 vs imported 1.01 by stored fact, no money mutation, idempotent byte output after readback; fail-closed on readback failure.
- [ ] No runtime import/wiring of remote transmitter yet.

### Task 3 — Workerd proof and integration
- [ ] Extend Workerd fixture test or add dedicated real SQLite test to verify `clienteId` canonical command persists after DO restart, duplicate same opId no new row, conflicting cents rejects, denial 403.
- [ ] Dedicated CI branch + PR and assembled gate; verify on **exact head SHA**. Preserve existing full audit baseline redness, do not claim global green.
- [ ] Review diff, verify only permitted paths, Notion evidence and readable handoff. PR review before merge; no client deployment.

## Review Focus
1. A `customer-payment:UUID` submitted as a sale or legacy receivable command must remain **invalid**.
2. A payment must not morph into `cartera_aplicacion`, automatically split by cargo, or silently reinterpret `receivableId`.
3. Browser facts don't establish remote license/role; issuer must decide separately at submit.
4. Duplicates, out-of-order retries, missing readback, storage failure and revoked issuer never produce a false business ACK.
5. Money cents come from the saved fact, not current Dinero.js setting, and cannot be fabricated as zero.

**Ruling:** Choose an additive typed customer payment schema + browser-side projection over altering the old receivable schema: old payloads are immutable, new client IDs have distinct semantics. **Cost if wrong:** requires explicit future consumer version routing; no old receipts are silently reinterpreted.

**NO-GO** until end-to-end authorized consumer with exactly-once money/stock readback, safe role projections, images ACK and physical PC↔Safari/Opera×2.
