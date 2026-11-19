# Gate C · photo SHA outside Yjs under disconnection + cross-browser restore (18 Nov 2026)

Base: workshop/main after PR89 (SQL blob DO) and PR93 (browser SHA bridge). Workshop only; no deploy, no LIVE, no real data. Pilot bridge stays OFF by default (`API.fotoSha` is null unless the pilot is loaded).

Scope (no open PR touches these files): `app/docs/sync-yjs.js` (seed fallback only), NEW `app/test/p0-gate-c-photo-offline-browser.test.cjs`, NEW `.github/workflows/qa-v783-gate-c-photo-offline-browser.yml`, this plan.

1. RED (own commit): exact seed + read-through blocks from sync-yjs.js run in real Chromium and WebKit with real `idb-fotos.js` IndexedDB. With the SHA bridge active and the network down, a pass must insert zero photo blobs in the Yjs fotos doc and send zero legacy bytes. Current code falls back to the legacy Yjs blob: RED.
2. GREEN: when the bridge is active and its PUT fails, keep the bytes only in the durable OCFotos IndexedDB store (the outbox), mark the pass for retry, and re-run the seed on the browser `online` event. Legacy relay path unchanged when the bridge is absent.
3. Proof: writer restart (reload) then reconnect uploads from IndexedDB, Yjs carries only `{sha,bytes,tipo}`; a second engine with empty storage restores exact bytes by SHA and persists them in its own IndexedDB. Both directions Chromium↔WebKit.

Limits: loopback server stands in for the signed Workerd endpoint (covered by PR89/PR93 CI). WebKit is not an iPhone: `photo-restore-cross-device` (PC↔iPhone) is NOT credited here. Scoreboard is credited by Sol6 only.
