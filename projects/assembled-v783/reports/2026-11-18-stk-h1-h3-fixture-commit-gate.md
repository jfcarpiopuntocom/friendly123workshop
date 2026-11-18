# STK-H1 v0.7.95 · QA H3 cancelledByParent diagnosis · 2026-11-18

## Exact source
- Candidate PR #771 head `a325d7844e66f8a7e81401fe6a1e6d135ed985ce` on branch `fix/p0-belen-photo-snapshot-safe-v795-20261118`.
- Related legacy photo gate run https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44412766803, job `h3-photo-memory`, exited 1: 16 PASS, 0 FAIL, **5 CANCELLED**.
- First cancellation: `H3 RED: IDB miss falls back to original localStorage hashed bytes`. Node: `Promise resolution is still pending but the event loop has already resolved`. All subsequent legacy subtests are cancelled as consequence.
- The `fixture()` inside `test/p0-h3-photo-legacy-fallback.test.cjs` constructs a fake IDB transaction that delivers only `req.onsuccess()`; it never calls `tx.oncomplete()`.
- New `docs/idb-fotos.js` `leerHashSoloIdb` *intentionally* resolves after readonly `tx.oncomplete` (before caching strict durable IDB proof), while real Chromium and WebKit photo quota QA succeeded.
- Causal classification: incompatible old synthetic harness, not demonstrated user-facing regression. Keep the app's stronger strict-read completion protocol.

## Minimal proposed repair (before code)
- Modify **only** the test fixture `transaction()` for H3 to emit a proper `tx.oncomplete` after `req.onsuccess` in a queued microtask, both for `getAllKeys` and `get`; abort fixture remains intentionally separate.
- Do not make `leerHashSoloIdb` trust `req.onsuccess` as an IDB durability ACK; do not change client photos/stock/receipts or YParty.
- Push a new source SHA onto PR #771, then check H3 21/21 as well as photo-durability, native-photo-quota Chromium/WebKit, p0-hotfix, release-control, exact manifest and Safari payment gate at **new SHA**.
- Merge with expected_head_sha only after mandatory gates pass. No physical Safari acceptance implied.

## Rerun on commit 63e27db8 · second fixture-only dependency
- New H3 run https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44414078795 ended 19 PASS, **2 FAIL** (not cancelled).
- Specific Node error: `_fotoBytesIdbConfirmados is not defined` at `leerPorHash` in the **VM-extracted function slice**, because the old test never loaded the new in-memory proof state and `_recordarFotoIdbConfirmada` helper from the top of `docs/idb-fotos.js`.
- This is distinct from transaction completion. Repair the H3 fixture context only: supply a minimal in-memory Map and proof recorder, keeping all source-level assertions intact. No production change.
