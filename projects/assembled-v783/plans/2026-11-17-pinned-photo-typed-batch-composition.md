# Composición QA exacta de photo SHA + typed ops/authorization batching · 17 Nov 2026

**Solo workshop, NO despliegue, NO merge, NO cliente real.** El propietario de `app/docs/sync-yjs.js` y `app/src/yparty-piloto.js` conserva su reserva activa [Notion](https://app.notion.com/p/41b1642b67f381828d00eea08115d82b). Esta es una rama LAB independiente. **No editar un solo byte de sus archivos; referenciar sus blobs Git exactos.**

## Origen inmutable, antes de importar
- Base: PR [#92](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/92) head `65e0526138cafd21e3608d7dc78130926d74f3a0`, código Workerd HMAC/Team, CORS, SQL typed, output signed batch <=32 y score quality 66.5, port 36.0 (0/6).
- Fuente fotografía: `feat/20261117-photo-sha-browser` commit `bf5946352d8d65dc99ab5d66ffa18b06420ebc85` con [QA focal GREEN 44164201552](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44164201552), no portada ni certificación física.
- Ramas main/prod no se actualizan. No sobreescribir futuras ediciones en la rama de foto; esta copia es un snapshot fijo de blobs.

## Lista fija de SOLO 8 rutas para incorporación de blobs intactos
1. .github/workflows/qa-v783-photo-sha-browser.yml
2. projects/assembled-v783/app/docs/sync-yjs.js
3. projects/assembled-v783/app/docs/vendor/yparty-piloto.min.js
4. projects/assembled-v783/app/src/photo-sha-bridge.mjs
5. projects/assembled-v783/app/src/ws-owner-ticket-params.mjs
6. projects/assembled-v783/app/src/yparty-piloto.js
7. projects/assembled-v783/app/test/p0-yparty-photo-sha-browser.test.cjs
8. projects/assembled-v783/plans/2026-11-17-photo-sha-browser.md

## Procedimiento seguro
1. Guardar este plan en la rama de integración ANTES de cualquier blob.
2. Leer los 8 blob SHAs de `bf5946352d8d65dc99ab5d66ffa18b06420ebc85` y el tree SHA del HEAD de esta rama.
3. Crear UN tree Git con los SHA de los blobs exactos, nuevo commit child y actualizar ref con expected_sha; no reescribir sus contenidos ni la rama reservada. En caso de conflicto o cambio simultáneo, abortar sin force y reconciliar con propietarios.
4. Correr CI Workerd seguridad/team, typed business, score 66.5/port36, FULL browser+authority, **photo SHA browser focal** y vendor reproducible sobre el mismo nuevo commit. Auditar TAP/logs, hashes y regresiones; no confundir GREEN de fuente foto en aislamiento con integración.
5. NO atribuir automáticamente puntos C: C stages se acreditan solo tras prueba real de flujo foto desde navegador y persistencia/reapertura; F exige Opera físico ↔ Safari iPhone A→B→A ×2, 0/15 pendiente. No activar flags ni despliegue a producción, no merge mientras reserva activa.

## Rollback
Eliminar/abandonar esta rama LAB; base PR92 y rama foto permanecen inalteradas. Mantener SHA, CI, resultados y blockers en este plan y Notion. La revisión Opus fija A/B/C/D/E/F, quality 66.5/100, port 36.0/100, 0/6 GO hasta prueba posterior.
