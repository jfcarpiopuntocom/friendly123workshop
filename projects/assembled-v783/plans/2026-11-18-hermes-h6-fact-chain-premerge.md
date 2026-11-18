# 2026-11-18 · Next Ponytail integration after H1: H6 verified financial fact chains

## Read-first constraints
Qwen Hermes report H6: Dashboard currently uses raw getAll IndexedDB without `verificarCadenas`, while `docs/hechos.js` exposes this validation for app read paths. H1 PR #768 (diagnostics/IDB read only) must first land. No migration or ledger edits in Dashboard. No YParty 2.0 activation.
User explicitly orders root causes by upstream dependency and Belén reports as primary real-world acceptance. sa-0-ed5f1c5a owns billing roles + backend opId dedup; sa-1-6e860c6b owns stock, photos and receipts. Avoid same files.

## Acceptance contract
- A financial fact is counted only if its entire per-author sequence and prev/hash chain is consistent in a complete, read-only snapshot; invalid or uncheckable hash -> coverage remains false with localized reason; no invented zero.
- In V1 schema legacy weak hashes `w:` accepted only if same algorithm as `docs/hechos.js`; do not call this cryptographic authenticity, only consistency. Strong SHA-256 must match on Chromium+WebKit.
- An empty ledger is valid only when modern DB is known and session code remains identical. A separate legacy DB without migration proof is a pending condition, not zero.
- An unscoped fact from a different notebook cannot be assigned to active store by hash alone; need business provenance or defer its inclusion. Do not mint license mapping from UI name or PIN.
- Adopt one pure verifier or prove parity against `AMG.Hechos.verificarCadenas` in at least 30 synthetic scenarios (two authors, duplicates, gaps, tamper, wrong author, weak hash, no crypto, clock skew, reversal) before wiring.
- Fail closed on old/new browser state, destroyed IndexedDB, blocked read, role revoked, session/license changes during async hash validation. Never alter facts.
- CI: RED on current raw Dashboard; GREEN on actual extracted source + Chromium/WebKit, existing fiscal model and panel regression, official compiled asset parity, hotfix and release control, required hex boundary. Fast-track only if all green.

## Required investigation before edits
- Inspect current master/PR head to avoid colliding with #768, check Notion source, and inspect `docs/hechos.js` `verificarCadenas` hash serialization and `docs/core/*` pure modules.
- Audit author/business linkage available in each `hecho` and whether active license provenance can be established; if no, do not claim full integrity or import old records.
- Never use `AMG.Hechos.todos()` in the Dashboard without reviewing side effects: it invokes `abrirDB` and `_migrarDesdeBaseVieja`, which writes/migrates ledger; dashboard is immutable viewer.

## Rollback
Source-only typed chain verifier adapter behind read-only coverage; revert module/script on persistent failure; never delete or rewrite customer facts. Scores stay at 67/100 quality candidate, 57/100 port QA, 0/6 production gates until independent evidence.
