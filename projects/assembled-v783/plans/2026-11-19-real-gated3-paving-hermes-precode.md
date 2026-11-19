# PORT 2.0 / APP REAL Gate D3 · pavimento Hermes determinismo y memoria (PRECODE, 2026-11-19)

Target **jfcarpiopuntocom/friendly-123**, master base `c4ca4bbaa3054562b0604655d5054eb284230117`. Workshop es solo plan y QA. JFC: preservar Sync3, no reparaciones en arquitectura 1.0, implementación Ponytail y auditoría.

Fuente: [Notion Hermes Paving](https://app.notion.com/p/41d1642b67f3810891f0f987393fcf94). El HTML interno no está accesible desde este entorno; usar su síntesis publicada en Notion y fixtures equivalentes verificables; no atribuir lectura del HTML no obtenido.

## Defecto raíz A: SHA no reproducible
- `cloudflare-yparty-worker/src/catalog-safe-projection.mjs` crea Y.Doc con clientID aleatorio, SHA estado diferente entre llamadas sobre misma entrada. Root cause reproducible. Scope solo proyección y tests QA (sin cliente).
- TDD RED: dos ejecuciones de `projectPublicCatalog(..., room,channel,frozenHead)` producen igual bytes/sha y `clientID` derivado del contexto, estable, separado por distinto HEAD; sin contexto, proyección previa debe seguir segura. Test de proyección cambia después de aplicar contexto, privacidad y límites de 10k productos conservados.
- Derivar determinísticamente un entero de 32 bits no cero de scope `version|room|channel|frozenHead`; usar hash estable, sin contaminar ID de documento original. Versionar el contrato `F123_PUBLIC_PROJECTION_VERSION`. Yjs cliente ID de 32 bits es scope identifier, no autenticación y nunca se debe mezclar una proyección de HEAD con otra en mismo Y.Doc en producción.
- TODO: certificar que `expectedProjectedSha256` externo coincide con la proyección local solamente cuando se reciba una credencial del servicio independiente, NO confiar en sourceDoc privado como document legible por cualquier Team.

## Defecto raíz B: cap de RAM de paginado en READ-ONLY QA
- La versión fusionada `trusted-frozen-source.mjs` hace `all.push(...frames)` y `prepareFrozenImport` vuelve a construir Y.Doc y snapshot; 64MiB son peligrosos para isolate. `f123_frozen_staging` propuesto por Hermes en SQLite mejora la acumulación, pero la transacción FINAL que concatena un blob de 48MiB / reexporta Yjs puede exceder el isolate igualmente. No proclamar staging "arreglado" sin medir peak y el contrato de `Tienda.onStart`.
- Injerto mínimo **inmediato**: limitar la ruta sin staging a máximo **8 páginas / 24MiB** Yjs crudo y evitar rearmado del documento > presupuesto; rechazar con error saneado y sin SQL, nunca `opened:true`. TDD fixture 6112 x 8KiB (>48MiB) **debe rechazarse** antes de ensamblar, no quedar sin diagnóstico; fixture de 4097 x 30B pasa. La ruta de staging queda PR posterior que extienda contratos `readTrustedFrozenSource` → `prepareFrozenImport` → `Tienda.onStart` con prueba Workerd & peak.
- Endurecer `rootSha256` indexado con `chunk:sha\n`; `firstFrameIndex` y `frameCount` por página y contigüidad. `completeToHead` únicamente en último chunk. Compatibilidad con v1 numérica y rechazos de fraude de privacidad.
- HTTP 401/403 sin reintento; 429 y 5xx con 2 reintentos/retries idempotentes, backoff; deadline 5 s por página, 120 s global solo **cuando exista staging**; mientras acumulación en memoria no bloquea `onStart` >40s sin QA instrumentación. Conservar flags Cloudflare QA OFF.

## Rúbrica y flujo
- Tests primero en rama real `port2/20261119-gated3-paving`; CI real RED→GREEN + suite Workerd Gate D 25/25 + GitHub exact SHA. No cambio de producción, sin DB de clientes, sin materializar licencias ni credenciales.
- Auditar y documentar memoria/tamaño por fixture con relleno y fallo antes de agrupar; no aceptar como verde memoria la fixture de 30B de Hermes.
- Si GREEN, PR aislado en APP REAL; merge únicamente con controles verdes; Cloudflare flags OFF; reporte y Notion. Métrica 67/61 y 0/6 sin pruebas comerciales.
