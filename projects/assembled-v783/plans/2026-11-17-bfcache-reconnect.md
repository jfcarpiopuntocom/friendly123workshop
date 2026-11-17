# Plan-first — Safari BFCache Yjs lifecycle (17 Nov 2026)

**Base:** friendly123workshop/main@23291b69f32cecd10a5a3d6cc0c9cb3649fdfd34. **Private QA source, NO DEPLOY/NO CUSTOMER GO.**
**Reservation:** https://app.notion.com/p/41b1642b67f381da9393e3cb8fa8eaab
**Read:** MDD https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac; Claude handoff https://app.notion.com/p/41b1642b67f381819878ecf04eb44c42; app/AGENTS.md and root AGENTS.md.

## Reproduced design gap, not yet declared fixed
`app/docs/sync-yjs.js` registers `visibilitychange` and tab-session events to pause/restart channels, but no `pageshow` restoration listener. An iPhone Safari BFCache restoration can retain a stale WebSocket and skip a visibility transition. No claim yet that this caused the real-world 15 missing Firebase Yjs parents; different failure mode.

## RED→GREEN
1. Write minimal `app/test/p0-yparty-bfcache-pageshow.test.cjs` running actual extracted `sincronizarVisibilidad` block via VM, no production network. Test `pageshow.persisted` with visible document forces `pausar`→`reanudar` on exactly cat/fotos/ops, non-persisted show does nothing, hidden page never reconnects, visibility toggle behavior remains.
2. Get real RED in GitHub Actions for original app source (not a mocked implementation). Save run URL and failure reason.
3. Add just one `pageshow` listener in `app/docs/sync-yjs.js` between the existing visibility handler and the initial `API.canal.conectar()`. Only when persisted and visible, pause the three current channels and call existing `sincronizarVisibilidad` to re-open from durable IndexedDB/outbox.
4. GREEN on exact code SHA with focal CI. Confirm integrated CI and historical full baseline separately; do not label a test-only result a physical acceptance.
5. Verify repo branch file SHA, record evidence + Notion, preserve rollback by reverting one targeted commit.

## Invariants
No PIN/role changes; no new socket permissions; do not touch src/yparty-piloto.js (other reservation) or provider/worker, no cloud writes, PWA/SW, product stock or financial data. Never discard local opId/outbox, never claim HTTP status is ACK, and never count the lab as real two-cycle Opera PC ↔ Safari iPhone acceptance. 29 historical full-suite FAIL remain until independently closed. Commercial launch NO-GO.
