# PRECODE · PORT2 C13 · Cablear lector público certificado C12 en `docs/sync-yjs.js`

- **Producto destino:** `jfcarpiopuntocom/friendly-123` (base verificada `master@5daab17d24d5407f7d089b1d9d28c8a89b647319`, `v0.8.02`).
- **Rama candidata:** `port2/20261119-c13-certified-reader-wire`.
- **Métrica antes:** PORT `78.5/100.0` (+10.0 vs post-D7), Calidad `71.5/100.0`, GO comercial `0/6`.
- **Hito objetivo:** `browser-cutover` → `real-public-reader-on-client` (+3.0 → `81.5/100.0`) únicamente tras RED→GREEN real y CI verde en SHA exacto.

## Causa raíz única
C8–C12 ensamblaron el bridge público, el firewall C9, el escritor único C10, el certificado SQL C11 y la sesión `leerCatalogoPublicoCertificado` C12 dentro de `src/yparty-piloto.js` y `docs/vendor/yparty-piloto.min.js`. Sin embargo, `docs/sync-yjs.js` nunca invoca `piloto.leerCatalogoPublicoCertificado(...)` ni administra su ciclo de vida (espera a recuperación sombra + IDB + sin deuda causal, cierre en `hidden` y `pageshow.persisted` BFCache, límite de reintentos y acceso de solo lectura `API.leerCatalogoPublicoCertificado()`).

## Cambio mínimo completo (Ponytail)
1. En `docs/sync-yjs.js`:
   - `_politicaRollout`: expone `frozenHead` opcional (validado `/^[A-Za-z0-9_.:-]{3,128}$/`) SOLO si `entry.yparty === true`, `approved === true` y `stage` coincide (nunca `stage: "all"`). `docs/sync-rollout.json` permanece intacto (0 entradas `yparty`).
   - `_crearLectorCatalogoPublicoCertificado(opts)`: controlador puro y auditable que:
     - Exige `!document.hidden`, `!doc.isDestroyed`, `!doc.store.pendingStructs && !doc.store.pendingDs`, `idb.synced` (si existe), `legadoListo() === true` (Ultrareview #2), y `expectedFrozenHead` válido (de `localStorage.f123_yparty_qa_frozen_head` o `API.rollout.frozenHead`).
     - Garantiza un solo lector activo (single-flight + generación `seq`), cero segundo escritor y cero mutación del `API.doc` privado.
     - Ante error/rechazo/divergencia/rol Team/PIN ausente: cierra limpio, registra estado seguro (`error`) con cooldown exponencial y tope de intentos por `head`, sin afectar el relay cifrado legado.
     - En `document.hidden`, `pageshow.persisted` (BFCache) y `doc.destroy`: cierra la sesión pública inmediatamente; al volver visible reintenta solo si se cumplen precondiciones y cooldown.
   - En `arrancar()`: cuando `piloto` es `null` (100 % de producción hoy), `API.leerCatalogoPublicoCertificado()` devuelve `null` y `API.estadoCatalogoPublicoCertificado()` devuelve `desactivado`, sin listeners ni tráfico. Cuando `piloto` está activo, conecta `API.catalogoPublicoLector` al ciclo real (`idb.once("synced")`, `doc.on("update")`, `sincronizarVisibilidad`, `pageshow`, `doc.once("destroy")`).
2. Sellado de shell (al tocar `docs/sync-yjs.js`): `v0.8.02` → `v0.8.03`, `f123-shell-v803`, `golden339` en `docs/sw.js`, `docs/version.json`, `docs/dashboard.html`, `node scripts/gen-manifest.js`, `bash check-sw.sh`.
3. Pruebas TDD RED→GREEN (`test/p0-c13-browser-certified-reader-wire.test.cjs`) y workflow focalizado `.github/workflows/qa-port2-real-c13-browser-reader.yml`.

## Rollback y límites
- Con `docs/sync-rollout.json` OFF y Cloudflare QA flags en `0`, ningún cliente ni la tienda de Belén cambia de ruta.
- Rollback: revertir PR o mantener `yparty` ausente/false en `docs/sync-rollout.json` (y borrar `f123_yparty_qa` en aparato QA).
- NO activa flags Cloudflare, NO habilita R2, NO certifica GO comercial (`0/6`) ni prueba física en iPhone.
