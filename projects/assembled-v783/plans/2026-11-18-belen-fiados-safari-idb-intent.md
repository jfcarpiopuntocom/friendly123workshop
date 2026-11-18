# 2026-11-18 · Belén fiados Safari quota: atomic IDB intent register (first isolated injerto)
Evidence: https://app.notion.com/p/4031642b67f38194a024cea8832b105c and LIVE docs/plan-pagos-ui.js + test/fiados-quota-cliente-4d.test.js. Current UI fails closed on full localStorage; this avoids duplicate payments but leaves collection blocked. Target is no loss or duplicate credit even when Safari localStorage quota is full.

Scope of this first step: new `src/pago-intento-idb.mjs` in live repo, with real transactional IndexedDB tests using fake-indexeddb. Independent of existing UI, so no client data, auth, release or PWA shell changes yet. Next step is safe integration with explicit namespace from active license, historical reference import, allocation and payment two-phase idempotent resume, browser WebKit + physical client testing.

Acceptance: tenant+client+kind+opId isolate; initial put atomic; two tabs race only one winner; existing intent wins across reload; replacement and deletion require exact original opId; quota/IDB close failure never claims durable ACK; no secrets, no writes to real shops; no separate business ledger. Server receipt exactly-once must be verified independently. This first module alone does not unblock Safari commerce, earn port points, or resolve five IPA sales disputed.

Plan-first in friendly123workshop; source branch in friendly-123; RED before module, GREEN after; PR draft until UI contract and real closure.
