# v783 rack PUT durable ACK after atomic validation — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Ponytail full: reuse current strict local commit and rollback, no new library.

**Goal:** A successful valid `PUT /api/ubicaciones/:id` must mean its edit was durably saved locally, just as #39 POST and #43 category batch do.
**Architecture:** Current app/docs/mock-backend.js mutates rack and calls un-awaited `guardarEstadoLocal()`, then `avisarCatalogoCambiado()`, returns HTTP200; outer finally may attempt another non-strict save. Replace this one handler's persistence with one awaited `guardarEstadoLocal(true)`, publish only after true ACK, otherwise restore only the unchanged provisional object or fail closed if a peer edited during await.
**Tech Stack:** Existing browser `OCEstadoIDB` strict CAS and localStorage A/B fallback, Playwright Chromium/WebKit, no new dependencies.
**Spec:** JFC local-first order (valid business operations survive reload), no false success; source conventions from #39 rack POST and #43 categories strict commit.
**Base:** `f370e73d71a72129852bd1103c866d0c6bf720fd` in `jfcarpiopuntocom/friendly123workshop`. Workshop-only; production untouched.

## Global constraints
- Same license + PIN => same role/notebook; no sale/stock/money double effect. No customer or production data, no vendor changes and no broad refactor.
- Preserve #39 POST rack CAS, #43 category strict ACK, #44 relay barrier, #46 opsDoc fixture, #47 PUT early 400 validation. Manifest SHA256 must match edited runtime.
- A genuine storage quota is HTTP507 and `RACK_UPDATE_STORAGE_QUOTA`; uncertain strict save HTTP503 and `RACK_UPDATE_DURABILITY_UNCONFIRMED`. No false 200 nor pre-commit Yjs announcement.
- Never truncate peer facts/changes during rollback. If provisional rack rev/object changed during strict await, block further writes rather than erase concurrent facts. Never silently retry non-idempotent edits.

## Review focus
1. Both IDB and A/B quota failures on **valid** PUT leave original name and commission in memory and cold reload; report HTTP507 (not 200).
2. Retry after storage recovery accepts one edit (e.g. house share 15=>associated 85), confirmed durable on cold browser.
3. No `oc-catalogo-cambiado` from rejected edit; publish once after success; signal possible unrelated events separately.
4. Malformed percentages and conflicting tiers still reject 400 atomically (#47).
5. Two-tab rack CAS, category batches, money/credit, new Workerd-authority suite stay green; if not, classify before merge.

## Task 1 — true RED
- [ ] Add two native browser tests in `projects/assembled-v783/app/test/tab-session-handoff.test.js` for Chromium+WebKit under synthetic owner. Build rack with existing `seed(ctx)`, inject denial on `OCEstadoIDB.guardar`, `guardarConRevision`, and `Storage.prototype.setItem` for `f123_estado_v4` journal/A/B/pointer; capture flags; execute valid rack PUT name+house pct; assert 507/code/old identity, restore adapters, retry and verify cold IDB and read model.
- [ ] Run isolated guarded test in GitHub Actions under exact SHA; require **RED specifically HTTP200 vs 507** and injector activation. Fix fixture if it dies before target, not the product.

## Task 2 — minimum existing runtime fix
- [ ] Fetch current main handler and `guardarEstadoLocal(true)` pattern used in POST; capture complete previous rack via existing `clonar(u)`, then mutate as before using existing validation.
- [ ] Replace trailing `guardarEstadoLocal(); avisarCatalogoCambiado(); return J(u)` with `debePersistir=false; const guardado=await guardarEstadoLocal(true); if(guardado!==true){...}`; if object and rev still equal provisional snapshot, restore own old object keys and values. Else set `_estadoLecturaBloqueada=true` and `_errorBloqueoLectura`, no destruction. Classify 507 quota via existing `_esErrorDeCuota(_causaGuardadoEstricto(window.OCEstadoIDB,_estadoAB()))` and 503 otherwise. Event only after ACK. Don't touch stock/financial entries.
- [ ] Recompute only `./mock-backend.js` digest in `projects/assembled-v783/app/docs/version-manifest.json`; independent Node `crypto` check in CI.

## Task 3 — GREEN, integrated and handoff
- [ ] Native new 2/2 GREEN plus prior 6/6 rack, category 5/5, integrated 585/585 exact SHA, 0 FAIL/0 SKIP. Archive actual logs and SHA.
- [ ] Read full historical (base had 3220/3162/54 red with 3 skips/1 cancelled before #46) only as independent NO-GO, never claim entirely green.
- [ ] If gates pass, merge to WORKSHOP main with expected HEAD SHA and record result in Notion; no customer publish. Physical iPhone PC↔Safari/PWA A→B→A ×2, remote ACK, photos, credentials remain mandatory.
