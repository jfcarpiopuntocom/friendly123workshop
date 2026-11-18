# P0 dinero · Hermes ROL findings → real RED/GREEN (2026-11-18)
Base: friendly-123 master v0.7.93 at time of reading, no unpublished edits; #769 H6 uses dashboard files only.

## Causal root
1. `docs/mock-backend.js` route POST /api/clientes/:id/(fiar|abonar) has no role gate. Contador and artista can call it through direct APIs. Protect at endpoint (UI alone not authority).
2. `docs/plan-pagos-ui.js` `_pagoIDB()` returns null on missing indexedDB/WebCrypto before checking `_pagoIdentidad()`; legacy localStorage fallback permits unauthorized attempt. Move identity/role validation before fallback; keep allowed staff and existing successful payments.
3. `docs/cartera.js` dedups only exact opId by design. Never block two legitimate installments by comparing customer+amount+clock. Cross-device exactly-once requires a shared authoritative transaction identity and a durable server-side claim/receipt, not just a local IndexedDB key or a cosmetic heuristic. This is a distinct architecture gate.

## Boundaries
- Only touch local role gate, finance UI fallback and synthetic test workflows. No changes to customer data, PINs or 2.0. Role explicitly allowed Owner/Admin/Team; contador/artista/unset denied.
- No browser storage deletion. Preserve previous opId receipt retry, no false ACK.
- Central backend outside this JS mocked route is not protected by this patch; do not label end-to-end server auth done.
- Separate H6 / #769 remains isolated. Release v794 reserved for H6 until verified; this P0 cash-authorization change must use next available shell only after checking master and release flags.

## Acceptance
- RED actual-source endpoint: `contador`, `artista`, empty role → 403 before amount processing, no Cartera calls; Owner/Admin/Team → business receipt; authorized same opId replay → same receipt, not duplicate; unexpected role state blocked.
- RED actual `_pagoIDB`: without IDB/WebCrypto, same unauthorized roles reject, without writing localStorage or calling network; authorized roles use legacy fallback as before.
- GREEN minimal fix then focused tests, Chromium+WebKit when possible; exact manifest/SW/release, hex-boundary, p0-hotfix-gate; fast track and verify published SHA.
- Verification artifact and signal separate from role patch: cross-device opId authority missing. No customer+amount+window dedup; no blanket block on double similar payment.

## Parallel root
- Photo rehydration `p.foto=d` and full A/B local snapshots may force quota but still a causal HYPOTHESIS for physical Belén until runtime RED. Owner in own PR after this finance gate.
- Yjs checkpoint aged, causal parent gaps, segmentation by relay remain separate; 2.0 OFF.
