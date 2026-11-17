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

## Integración end-to-end foto browser→issuer→Workerd→SQLite (plan antes de prueba)
- **Fallo de cobertura**, no necesariamente de producto: QA foto browser de PR93 usa fetch simulado, QA Workerd foto usa HTTP directo con token sintético; ningún caso anterior ejecutaba `createPhotoShaBridge` real con `ws-owner-ticket-params.mjs` contra emisor HMAC central y luego Workerd real, menos aún reapertura fría.
- Test focal nuevo en `relay/injertos/yparty-worker/qa/p0-secure-separate-rooms.test.mjs` (único archivo del equipo PR92, **NO** modificar fuente de foto reservada). Integrar el módulo original `app/src/photo-sha-bridge.mjs` vía import ESM en Node22 y un `fetch` de QA que enrutará la URL de issuer real a `authorityWorker.fetch` y la del relay a Miniflare real, con Origin HTTPS sintético `https://synthetic-photo.test`; no falsas respuestas HTTP.
- Un Owner con PIN sintético 123 obtiene token fotos:write fresco, el cliente sube data:image/png con SHA real de bytes sintéticos >2MiB, Workerd almacena en SQLite y entrega 201. Insertar **solo referencia** `{sha,bytes,tipo}` en catalog Y.Doc y comprobar recepción en segundo YProvider, sin dataURL en ese map. Detener/reabrir Workerd local; nuevo cliente de navegador con ticket fotos:read descarga el blob íntegro, verifica SHA antes de devolver dataURL. Sin tokens en URL ni contraseñas guardadas. Si falla, RED real con evidencia; no false GREEN.
- **Límites**: la app mantiene `fotosDoc` Yjs legado como fallback si HTTPS o autorización falla; un test del camino nuevo NO certifica que todo Yjs quede libre de bytes. Tampoco es PC Opera ↔ iPhone Safari físico. Stage C `yjs-sha-reference-only` 0/4 y `photo-restore-cross-device` 0/3 hasta pruebas más amplias. PORT 36.0/100, QUALITY 66.5/100, 0/6 GO. Nada de merge con reserva activa o despliegue.

## Resultado de cadena completa (17 Nov 18:48 Ecuador)
- [CI Workerd 44202469976](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44202469976), SHA `9ead72edbf4a088147ac62ae082d6aee46313433`, **13/13 TAP PASS**, 0 FAIL/SKIP, el nuevo test #13 duró ~444 ms. **Fuente cliente real** `createPhotoShaBridge` y `createOwnerTicketParams` produjo cap fresco de issuer HMAC central con Owner PIN 123 **sintético**, hizo PUT >2 MiB de imagen PNG sintética al Workerd real/SQLite, recibió 201, escribió solo `{sha,bytes,tipo}` al Y.Doc de catálogo que un segundo YProvider real recibió, detuvo/reinició Miniflare y un NUEVO cliente recibió GET y reconstruyó el mismo dataURL validando SHA/MIME. Cap/PIN nunca en URL, Origen HTTPS CORS permitido.
- Server source photo y cliente fuente reservado NO fueron editados; único archivo funcional añadido fue nuevo caso QA en `qa/p0-secure-separate-rooms.test.mjs`. Base PR92 + ocho blobs exactos del fotógrafo, ambos originales intactos. Resto CI de PR93 incluye photo bundle reproducible, WebKit BFCache, typed business, auth y Firebase synthetic; ver resultados por SHA.
- **Límites explícitos**: el bridge real fue inyectado con fetch de QA para conectar URLs al Miniflare local, no navegó iPhone físico, ni dos licencias/instancias reales; no certifica FULL Yjs-only SHA porque `sync-yjs.js` conserva Yjs `fotosDoc` para fallback legacy cuando PUT falla. C `yjs-sha-reference-only` sigue 0/4; C cross-device sigue 0/3. PORT 36.0/100, 0/6. Para resolver, el propietario del archivo reservado debe dar prioridad al outbox cifrado local al fallar HTTP sin publicar NUEVOS dataURL en Yjs; no cambiar fallback sin probar durabilidad, y respetar la preferencia del usuario por no perder fotos offline.
