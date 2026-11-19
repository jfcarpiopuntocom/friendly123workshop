# 2026-11-19 · C13 APP REAL · Lector público certificado C12 cableado en `docs/sync-yjs.js` (LISTO PARA FUSIÓN DE SOL6)

- **Producto:** `jfcarpiopuntocom/friendly-123`
- **PR candidata (lista para Sol6, NO fusionada):** [#793](https://github.com/jfcarpiopuntocom/friendly-123/pull/793)
- **Rama:** `port2/20261119-c13-certified-reader-wire` (base `master@5daab17d24d5407f7d089b1d9d28c8a89b647319`)
- **SHA runtime sellado (`v0.8.03`):** `83790575a369a5d6d1f044232c4e049e9b49433d`
- **SHA HEAD final (con score + fix LF `.mjs` en manifest):** `23ece8b`
- **Plan PRECODE:** [`2026-11-19-real-c13-browser-certified-reader-precode.md`](../plans/2026-11-19-real-c13-browser-certified-reader-precode.md) (`workshop/main@15f77bf`)

## Evidencia TDD y CI exact-HEAD (`23ece8b`)
- **RED real:** `0/7` pass, `7/7` fail contra `master@5daab17`.
- **GREEN local:** `62/62` pass (`7/7` C13 + `55/55` regresión `bridge/rollout/bfcache/origin/bundle/tickets/photo-sha/ultrareview/C12/score`) + `check-sw.sh` 7/7 OK.
- **Hallazgo real cazado en CI:** `verify-twice` detectó que `scripts/gen-manifest.js` normalizaba CRLF→LF para `.html/.js/.json/.css` pero omitía `.mjs`, alterando el hash de `./pago-intento-idb.mjs` en Windows. Corregido en `scripts/gen-manifest.js` y `check-sw.sh` (`23ece8b`); `git diff master -- docs/version-manifest.json` toca únicamente `version`, `shell`, `./sync-yjs.js` y `./dashboard.html`.
- **CI GitHub exact-HEAD (`23ece8b`):** **41 SUCCESS, 0 FAILED, 1 SKIPPED (CodeRabbit)**:
  - `c13` (15s), `c12` (14s), `yparty-worker` Workerd (1m34s), `app` (55s), `P0 Hotfix Gate` (1m43s), `Release continuity gate` (2m03s), `verify-twice` (7s), `seal` (19s), `browser-parity` (51s), `belen-finance-browser` (1m04s), `two-tab-sales` (1m24s), `Workers Builds: friendly-123` (preview).

## Métricas auditables tras fusión
- **PORT 1.0→2.0:** `78,5 → 81,5 / 100,0` (`+3,0` por `browser-cutover/real-public-reader-on-client`; `+13,0` vs pos-D7 `68,5`).
- **Calidad arquitectónica:** `71,5 → 72,7 / 100,0` (`+1,2` en `sync`; `+5,7` vs `67,0` del 17-nov).
- **GO comercial:** `0/6` (separado; `docs/sync-rollout.json` permanece OFF y las 6 flags QA de Cloudflare siguen en `0`).

## Riesgos y límites declarados (sin inflar)
- Código ensamblado y cableado detrás de doble switch QA **OFF**; ningún cliente ni Belén cambia de ruta.
- Cloudflare R2 sigue desactivado en cuenta `c4d8aa3b3e1db0d80b0beb4abc7c1364` (JFC activándolo) y `friendly123-licencias` sigue en código del 4 nov (sin `/ws/ticket`).
- Ninguna prueba física en iPhone Safari / Opera PC ejecutada aún.
