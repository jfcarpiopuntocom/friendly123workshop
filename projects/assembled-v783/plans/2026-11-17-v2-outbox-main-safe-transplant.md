# P0 Opus Gate E: cherry-pick minimal v2 no-WebLocks atomic IDB onto workshop main · Nov 17 2026

Workshop main is 9f535639561cb6013ce5981cbe39cf6fdde888df (PR92 merged; port36/100, quality66.5, gates0/6). Photo agent has independent active reservation for its branch; this is a **separate QA transplant branch**. NEVER update their branch, never overwrite their photo additions, never deploy/activate flags, and do not merge this until CI/owner coordination.

## Exact proven source and red-green
PR95 isolated photo-combined branch SHA 7ab0f6168ecac45ae7c49c24bfe78bc37a6cb120. [RED two-tab source 44207154344](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44207154344): with navigator.locks absent, 2 IDB tabs racing ACK of A against new C lost A's tombstone (5/7). [GREEN focal 44208241569](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44208241569): 7/7 under locks and no-lock atomic transaction, plus [historical Firebase precut 44208241466](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44208241466) restored after preserving rollout-v1 legacy path.

## Minimal port, ownership and test
1. On THIS main-derived QA branch, add this plan before editing anything.
2. Import exact PR95 WebLocks test+workflow (no source edits). Compare main and PR95 around function guardarOutbox/mutarOutbox and insert ONLY standalone mutarOutboxAtomicoSinLocks helper and no-lock branch. Preserve original code outside ~90-line hunk; do not import source photo changes, vendor or app/sync-yjs from photo agent wholesale.
3. Verify GitHub diff vs main lists just this focused hunk, test+workflow+plan. Run source-extracted fake-indexeddb 7/7, historical frozen Firebase/Yjs, browser authority Chromium/WebKit, score/port. Reject any RED; test all relevant source pinned to this SHA.
4. Coordinate photo agent before merging this file to main; ensure their source remains mergeable after this patch. If release granted and all green, stage E `idb-outbox-web-locks` earns fixed +5 **only on merged verified code** (port main 36→41/100; 0/6 gates until all stages). Do NOT alter rubric weights, quality baseline or physical claims.

## Safety semantics
In v2 when Web Locks unavailable: one native IDB readwrite transaction reads latest meta+op rows, applies only synchronous mutation, writes rows/tombstones+meta together; durable ACK only after oncomplete. When v2 IDB unavailable fail closed. When rollout v1 expressly OFF/deferred, preserve unmodified legacy get/set for historical backward compatibility and fire `legacy-v1-single-tab-required` event (not a guarantee of v1 multi-tab safety). Existing Web Locks route unchanged.

## Rollback
Discard this branch/PR; production friendly-123/master 45757cac and photo agent branch untouched. PR95 persists full candidate proof. No original source files overwritten.
