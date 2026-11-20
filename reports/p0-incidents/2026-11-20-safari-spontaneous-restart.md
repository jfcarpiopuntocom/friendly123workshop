# P0 Safari spontaneous restart — 2026-11-20 15:58 Ecuador

JFC observed LORD store on Opera PC and iPhone Safari simultaneously: 'Las 13 Aventuras de James Bond' displayed 13 on both after ~20 seconds. This is a real two-device visible convergence observation, not a durable event-set certification. 13 is NOT a target stock constant.

New incident: iPhone Safari app spontaneously restarts (user report). Screenshot references v0.8.27; deployed SHA not verified. Root cause unknown. Investigate SW controllerchange/update/skipWaiting, app reload/navigation, session epoch guard, memory pressure/iOS WebKit process eviction. Preserve local IDB, outbox and evidence. Add privacy-safe diagnostic logging (navigation type, pageshow persisted, pagehide, controllerchange, SW activation, session epoch changes) and RED-GREEN regression before any release. Do not modify client credentials or stock.

Notion MDD priority: #3 JFC/PIN, #1 causal ledger and #5 forensics parallel, then #2 encrypted inbox, #4 discussion only. Commercial GO not established. Screenshot cites port 92.0/100 and GO 0/6; no new scoring audit.

Next: (1) trace Safari restart on exact deployed SHA; (2) reproduce/fix and test with CI; (3) physical PC-Safari-PWA A-B-A twice with reopen and opId checks.
