# friendly-123 · PORT REAL Gate D3 · pavimento Hermes y red→green (19 nov 2026)

## Registro principal

- **Producto real:** `jfcarpiopuntocom/friendly-123`; [PR #783 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/783).
- **Commit master comprobado después del merge:** `ec8359432ffd2ffeb6a9974cd1721ecb02a7ca40`, padre candidato `aa6babe7b8da24b9ec0bf273806bf58185dc76d1`, anterior `c4ca4bbaa3054562b0604655d5054eb284230117`.
- **Ámbito:** `cloudflare-yparty-worker/src/catalog-safe-projection.mjs`, `src/trusted-frozen-source.mjs`, pruebas QA Gate D3 y adaptación de prueba Gate D2; workflow `qa-port2-gated3-paving.yml`. **Sync3 y clientes 1.0 intactos.**
- **Plan PRECODE:** [documento Ponytail](../plans/2026-11-19-real-gated3-paving-hermes-precode.md). [Hermes Notion](https://app.notion.com/p/41d1642b67f3810891f0f987393fcf94) consultado íntegro; el HTML privado vinculado allí no pudo abrirse. Se desarrolló un fixture equivalente nuevo, no una copia literal del fixture de Hermes.

## Dos causas y su prueba

**(A) Proyección SHA no reproducible.** `projectPublicCatalog()` inicializaba Y.Doc con `clientID` aleatorio. [RED real #44469037290](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44469037290): misma fuente proyectada dos veces → SHA diferentes. Fix: `F123_PUBLIC_PROJECTION_VERSION='v1'`, `clientID` estable hash 32bit del scope `version|room|cat|frozenHead` **antes de cualquier escritura** al doc público. Las llamadas antiguas sin scope siguen devolviendo doc desprendido y privado intacto. Las entradas parciales de scope se rechazan. `expectedProjectedSha256` opcional y `projectionVersion=v1` del servicio independiente se contrastan en el Worker después de proyectar localmente y repetir el digest; cada página debe tener la misma declaración.

**(B) Pico de memoria por 64MiB raw más base64, Yjs y reexport.** [RED real #44469312732](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44469312732): **6112 frames Yjs de clase ~8KB**, generados con `productos` válidos y SHA/state vector consistentes, aceptados por el lector anterior. Es un fixture de tamaño, **usa repetición de un frame Yjs**; no simula 6112 hechos económicos únicos. Se eliminó antes un primer fixture incorrecto que rechazaba por SHA ficticio (falso GREEN). Fix provisional verificable: `MAX_PAGES=8`, `MAX_TOTAL_BYTES=24MiB`, rechazo del `manifest.totalBytes` excesivo en **primera página**, antes de acumular, sin SQL parcial ni `opened:true`. Esta protección **no admite aún** historiales reales mayores de 24MiB; el `f123_frozen_staging` propuesto por Hermes **NO está implementado**. Más aún, concat de staging de 48MiB más Yjs en la transacción final puede explotar RAM: se necesita finalizador incremental y medición real Workerd para que staging sea un avance certificado.

## Contrato de páginas reforzado

- SHA raíz `SHA256(UTF8(concat(chunk + ':' + pageSha + '\n')))`, no lista desindexada.
- `manifest.firstFrameIndex` obligatorio y contiguo desde cero; `manifest.frameCount` igual al número de frames reales; `completeToHead` solo en el último chunk y sin páginas extra. Mantiene base64 estricto y SHA de cada frame prefijado por longitud.
- `WS_FROZEN_HISTORY_SOURCE` Service Binding con `WS_SERVICE_KEY`; HTTP 401/403 **sin reintento**, HTTP 429/5xx **máximo dos intentos totales**, timeout 5s/intento, deadline global 120s; sin credencial del navegador.
- `expectedProjectedSha256` se valida con la copia pública determinista del mismo frozenHead. Protección contra raíces privadas, campos de costo/PIN y catálogo de más de 10000 productos sigue en vigor.
- Formato legado v1 (`number[]`, una página) conserva test de compatibilidad, no se autoriza enviar docs privados.

## Auditorías y compuertas

- [GREEN final sobre candidato `aa6babe7`](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44469849380): **17/17** proyección+RAM; **32/32** paginación y regresiones reales Tienda Workerd/SQLite; cero fail/cancel/skip. **17/17 check-runs GitHub full PR** completaron SUCCESS antes de fusionar; HEAD inmutable confirmado y [PR merge](https://github.com/jfcarpiopuntocom/friendly-123/pull/783).
- Cloudflare API lectura posterior al merge: las seis flags QA `WS_*_QA` siguen `'0'`, falta binding `WS_FROZEN_HISTORY_SOURCE`; `WS_AUTHORITY` apunta a `friendly123-licencias`. Merge GitHub ≠ despliegue del script ≠ unión fría física.
- **Todavía críticos:** `installFrozenImport` sigue rechazando DO ocupado; 19 antecesores Yjs y 9 HTTP401 del canario viejo no certificados, falta fuente histórica independiente y checksum de negocio, staging+finalizador acotado, pruebas físicos Opera PC↔Safari iPhone A→B→A×2 y QA autorizado.
- **Gobierno de scores:** calidad arquitectura **67/100**, PORT operativo certificado **61/100**, GO comercial **0/6**. Ningún punto nuevo sin criterio final del rúbric.

## Próxima operación Ponytail

1. RED Workerd de **DO ya poblado** + freeze independiente, exactitud `10+100` eventos sin sobrescribir ni duplicar dinero; injerto de fusión CRDT+SQL `transactionSync` y digest de contenido, con failback y protección de una sola autoridad. Evitar mezclarlo con staging.
2. Staging de frames `f123_frozen_staging` en una sola sala QA, control de tamaño real y finalizador incremental/compacto, con test de **48MiB 6112 frames distintos** bajo restricción de memoria Workerd y journal del negocio intacto hasta commit. No inferir que concatenar bytes en última transacción resuelve el OOM.
3. Encender flags solo con fuente independiente certificada, emisor de tickets, revisión cruzada, Go autorizados y prueba física.
