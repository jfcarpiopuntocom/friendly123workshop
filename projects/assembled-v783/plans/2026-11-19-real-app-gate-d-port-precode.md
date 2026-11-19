# PORT 2.0 · Gate D into the REAL friendly-123 application (PRECODE, 19 Nov 2026)

> **For agentic workers:** use Superpowers executing-plans, TDD and verification-before-completion; one reversible graft at a time.

**Goal:** transfer the already Workerd-tested Gate D cold-history opening from `friendly123workshop` to the REAL app repository `jfcarpiopuntocom/friendly-123`, behind OFF-by-default QA switches. Workshop is the test/provenance workspace, NOT the port target.

**Architecture:** Real `cloudflare-yparty-worker/src/index.js::Tienda.onStart` verifies an existing frozen SQLite certificate or obtains independently certified Yjs frames via PRIVATE Workerd Service Binding, invokes `openExistingStore` before `super.onStart()`, and refuses false empty-room readiness. Existing Sync3 and current customer transport remain intact. No new economy writer, no extra Y.Doc and no WebSocket raw private catalog for Team.

**Approved sources:** Workshop [PR #133](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/133), [#131](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/131), [Qwen/Gemini audit](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/reports/2026-11-18-qwen-gemini-adversarial-audit-reconciliation-v801.md), [Notion PORT log](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94). Real app initial master `f53604b7e99ba8a9eb5f9e906199b17f110ebdcb`; confirm again on execution.

## Frozen scope and file ownership

- Real app target: `cloudflare-yparty-worker/src/index.js` (ONLY source hunk: imports, server-only Gate D method, invocation before YServer starts).
- New real app files: `cloudflare-yparty-worker/src/open-existing-store.mjs`, `src/trusted-frozen-source.mjs`; import tested copies and preserve their reviewable SHAs.
- New real app tests: `cloudflare-yparty-worker/qa/p0-gate-d-real-onstart-workerd.test.mjs`, `qa/p0-gate-d-open-existing-workerd.test.mjs`, `qa/fixtures/gate-d-open-existing-worker.mjs`, adjusting only paths to the existing REAL `cloudflare-worker` issuer.
- CI: isolated `.github/workflows/qa-port2-real-gate-d.yml` on candidate branch and PR, with direct Workerd+SQLite/Yjs tests. No release metadata or auto-deploy.
- Existing real modules `certified-frozen-import.mjs`, `durable-full-yjs-export.mjs`, `authoritative-business-sql.mjs`, `typed-commercial-ledger.mjs`, `ws-authority-client.js` already MATCH the workshop byte-for-byte (verified 19 Nov). Do not duplicate them.
- Do not edit `docs/sync-yjs.js` (#780), `docs/mock-backend.js` (#777), `docs/vista-perchas.js` (#779) or active photo branches (#778); do not overwrite anyone's reserved work.

## TDD / Ponytail

- [ ] RED: add REAL `Tienda` Workerd test, before any source change, asserting certified two-author pre-cut catalog, separate ops room, no private map cross-room, refusal of missing parents or spoofed authority, OFF flag old route, SQL/journal reboot without a renewed external source.
- [ ] RED: add candidate workflow and observe expected failure on unmodified REAL Worker (the real `onStart` never calls import), distinguishing missing dependencies from the missing hook.
- [ ] GREEN: transfer two already-audited small helpers and the `Tienda` hook from workshop; review exact source diff against workshop #133, avoid extra behavior.
- [ ] GREEN: run Workerd real-onStart plus original certified-import, frozen-import, full-export tests and record exact SHA/counts. Follow up on failures in their own root cause rather than hiding them.
- [ ] Create DRAFT PR to REAL `friendly-123/master` only after candidate reviewed; never auto-merge/publish to customers from this PR. Verify exact SHA and Notion evidence, and keep reusable workshop plan.
- [ ] Preserve customer-visible 2.0 OFF until independent Firebase current/head proof (19 pending parents, 9 partial Firebase 401), dedicated QA issuer, no cross-room privacy leak, cold-join canary and real PC↔iPhone A→B→A×2.

## Review Focus

1. A valid local frozen certificate must reopen without contacting source; a corrupt certificate must not serve an empty room.
2. A forged/tampered source from browser/header must never be accepted; history intake is Service Binding only.
3. `-ops` must reject a catalog/private Y.Doc and reject unresolved Yjs causal parents.
4. Flag OFF must keep previous behavior and make zero calls to the new source.
5. Production app/Sync3, customer money, stock, photo and PIN cannot move or reset as a side effect of this dormant worker code.

**Port scoring:** retain last evidenced 67 architecture / 61 operational port / 0 of 6 commercial GO until independently verified; a PR or synthetic Workerd pass is not an 80% port milestone.

**Rollback:** no runtime rollout; candidate branch can be closed. For an eventual authorized QA deployment, keep `WS_OPEN_EXISTING_QA=0` and rollback Worker version if checks regress. SQL histories and old client paths untouched.
