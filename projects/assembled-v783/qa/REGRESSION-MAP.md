# Durable payment regression map

Use Ponytail full ([pinned skill](https://github.com/jfcarpiopuntocom/ponytail/blob/96608e078b2d5ea607c5c3b8b5a54d1c1fba6846/skills/ponytail/SKILL.md)) and Superpowers TDD. JFC requested [Claude-BugHunter](https://github.com/elementalsouls/Claude-BugHunter/tree/2f9a226d38d35d28d06f1ed63753799d498a2b3d); use its race-condition, business-logic and IDOR methodology for this matrix. These are source skills applied to local synthetic QA, not a background scanner. Never read customer stores or call production to reproduce.

| Boundary/failure | Permanent regression | Required observable result |
| --- | --- | --- |
| Legacy receivableId outside license, revoked or missing authority | relay/injertos/yparty-worker/qa/p0-typed-commercial-ledger.test.mjs | 403/503 before ANY SQL; no receipt disclosure on replay |
| SQLite crash/restart and changed intention | relay/injertos/yparty-worker/qa/p0-typed-commercial-ledger-workerd.test.mjs | Same opId/receipt after restart; conflict 409; no overwrite |
| Two writers pass pre-hash duplicate check | app/test/p0-payment-atomic-facts.test.cjs | One durable fact/effect; both confirmations reference it; fresh readback and next hash-chain valid |
| Native IndexedDB transaction under overlapping authors | app/test/p0-payment-atomic-browser.test.cjs | Chromium AND WebKit: one 101-cent payment, reload/retry yields same receipt |
| Caller changes relation during await | app/test/p0-payment-atomic-facts.test.cjs | Original intention/opId persists; never acknowledge another intention |
| Transaction abort | app/test/p0-payment-atomic-facts.test.cjs | No receipt/meta/event; original-opId retry commits once |
| Lost response, duplicate tabs and reload | app/test/customer-payment-browser.test.js; customer-payment-recovery.test.js | Submit stays pending; recover existing payment; exact ledger unchanged on retry |
| Unrelated relay reconnect timer mistaken for save retry | app/test/v608-guardado-veraz.test.cjs | Deliberate unrelated 3000ms timer ignored; storage still exactly 3,6,12,24,48s, no sixth attempt |
| Remote fact abort/recovery and convergence | app/test/hechos-import-recovery.test.cjs; hechos-sync.test.js | Abort cause preserved; valid fact recovered; ID collision never overwrites |
| Historical awareness frame during revocation | relay/injertos/yparty-worker/qa/p0-real-session-room.test.mjs | Zero lifecycle frames assertion RETAINED; remains unresolved until causal send/revoke trace proves closure |

Run from app/: npm ci; then node --require ./test/helpers/sin-red-produccion.cjs --test --test-concurrency=1 --test-timeout=45000 test/p0-payment-atomic-facts.test.cjs test/p0-payment-atomic-browser.test.cjs test/p0-credit-payment-money-imported.test.cjs test/p0-customer-payment-command.test.cjs. Run UI/recovery and financial groups from assembled-browser-qa.yml for monetary changes. Run npm test and report all failures; earlier greens do not certify a new SHA.

Run from relay/injertos/yparty-worker/: npm ci; node --test --test-concurrency=1 --test-timeout=45000 qa/*.test.mjs. A positive inbox receipt is stored-for-application, not business-committed. QA authority fixtures never enable a production role.

Integrity: app/scripts/gen-manifest.js regenerates laboratory hashes, app/check-sw.sh and git diff --check verify consistency. Current JFC AGENTS defers PWA/SW changes. Follow the existing plan/STATUS and exact SHA, not old summaries. Do not reintroduce an unsafe sender to make a test green; never delete historical facts or loosen limits.
