# P0 friendly-123 · Legacy encrypted outbox IndexedDB transaction abort must never hang · 2026-11-16 Ecuador

## Persisted BEFORE touching any test/runtime (5-hour restart)
Repo `jfcarpiopuntocom/friendly123workshop`; branch `fix/20261116-sync-outbox-idb-abort-failback`, immutable main base `368f81b21a2a664be54a3c23fdf8008fb9f4e96d` (latest main before concurrent PR #68, which touches separate A→B→A synthetic browser tests only). Exact existing source `projects/assembled-v783/app/docs/sync-outbox.js` blob `76653372b1a5ee3cee29a6e959a6df2776f836e0`. User's approved architecture uses original outbox alongside imported Yjs, y-indexeddb and synchronous local sale ledger; no new dependency or substitute transport.

### Technical root cause from actual source
`OCOutbox.guardar(blobCifrado)` opens `f123_outbox/cola`, then:
```js
await new Promise(function(resolve,reject){
  var tx=db.transaction(STORE,"readwrite");
  tx.objectStore(STORE).put({ id:LS_KEY, blob:blobCifrado, guardado:Date.now() });
  tx.oncomplete=resolve;
  tx.onerror=function(){reject(tx.error)};
});
```
The IndexedDB transaction lifecycle can fire **abort without an error event** (e.g. explicit `tx.abort()`). No `onabort` callback is attached. In that case `guardar` remains pending indefinitely, never reaches its existing safe localStorage fallback and never returns the `true/false` needed by `avanzado-extra.js`'s `guardarColaCifrada()` to warn `oc-sync-cola-perdida`. That caller awaits the `OCOutbox.guardar()` result. This may explain hung operations but is **not** claimed as the cause of any unmeasured customer's physical sync incident. Need real RED before product claim.

### TDD scope — smallest complete Ponytail fix
1. Add **one** new test-only `projects/assembled-v783/app/test/p0-sync-outbox-idb-abort-failback.test.cjs` that evaluates the **real, unmodified** `sync-outbox.js` in a Node VM with synthetic IndexedDB open/tx; simulates a lone `tx.onabort` with **no `onerror`** and asserts `guardar` settles via legacy localStorage encrypted blob fallback. Second case localStorage quota blocked must settle with `false` (not claim durable ACK); third adjacent case successful IDB transaction must return true and remove legacy localStorage. No customer identifiers, no internet.
2. Add tiny Node22 no-deploy CI `.github/workflows/v783-sync-outbox-abort-failback.yml`, run entire new suite with `--require ./test/helpers/sin-red-produccion.cjs`, archive exact SHA/TAP and respect nonzero exit. Run **RED on original source**; failure should be `abort left unresolved`, not syntax/setup. If it fails for wrong cause, repair fixture first; no runtime edit until valid RED.
3. Only after confirmed RED, change **one transaction handler** in `docs/sync-outbox.js`: `tx.onabort = function(){reject(tx.error || new Error("Transacción IndexedDB abortada"));};` alongside `onerror`; no changes to transaction DB name, schema, encrypted payloads, fallback order, existing success behavior, or error messages. No new timer or queue.
4. Run new full suite GREEN, test related legacy outbox cases, integrated assembled 585 when CI runs. Existing global historical unfiltered may remain red due old deploy-site constraints; don't claim global GO.
5. Review resulting diff and verify main SHA / parallel #68 before workshop-only merge. Source/test/workflow/plan only. Record RED and GREEN runs, SHA, test names, and CI artifacts here, in `projects/assembled-v783/STATUS.md` and [Notion live](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902). Never overwrite another agent's progress.
6. Security/real-data: error path does NOT silently drop encrypted operations; `guardar` returns false if both IDB and LS fail, and higher layer retains its owner warning. Do not add any plaintext logging, external writes, PIN/license/photo read, or change production. No PWA/SW/Workbox; source is the separate lab `projects/assembled-v783/app/docs/` and Pages excludes `projects/`.

### Cross-device GO remains blocked
Synthetic PR #68 (two local isolated Chromium/WebKit engines with direct Yjs pump) is **not** physical PC↔iPhone relay proof; PR #67 full historical 3,240 tests, 3,203 pass, 33 fail, 1 cancelled, 3 skipped still RED. Same-license same-PIN physical A→B→A ×2, real remote app-level ACK, exact sale/stock/money/photos/roles convergence and trusted server authority cannot be inferred from this change. MDD #3/#1/#5 local-first approved; server business-authoritative P2 not authorized.

## Confirmed native RED · 2026-11-17 UTC · before any runtime modification

[GitHub Actions 43998275104](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43998275104), job `133755651728`, tested head `e420af4f528eadfb569938b91be7501048780d72`, **FAILURE** with original unmodified `docs/sync-outbox.js`. Three real-source VM cases: **1/3 PASS, 2/3 FAIL, 0 SKIP**. Both failed assertions are exact expected symptom `aborted IDB tx must settle, even without onerror event` and `dual-store failure must settle so caller can warn owner`, `false !== true` after 150ms timeout. The normal IDB success scenario PASSED, proving the fixture is attached and the primary success path still works. No code changes to source at this stage. RED is causal and specific to missing abort handler; not a browser-independent claim about all real abort reasons.

**Ruling:** Reuse existing IndexedDB error/fallback logic by assigning the **same** rejection handler to both `tx.onerror` and `tx.onabort`, with `tx.error || new Error("Transacción IndexedDB abortada")` so callers receive a proper cause. No new watcher/timer or outbox implementation. Commit only this source diff, run exact suite again and the separately triggered integrated QA, then re-evaluate. Do not claim success until fresh GREEN.
