# PORT 2.0 APP REAL · Gate D2 historial paginado y auditoría OpenCode (19-nov-2026)

## Estado concreto
- Destino comercial de **código**: `jfcarpiopuntocom/friendly-123`, PR [#782](https://github.com/jfcarpiopuntocom/friendly-123/pull/782), branch `port2/20261119-gate-d-paged-trusted-source` desde master `5beff22163b41f86aab312c29471d5946345a658`.
- HEAD verificado código nuevo: `0fe850f77b4d77d526155d77d0d90370543be547`; no shell, proveedor de licencias, dinero, fotos, Sync3, cliente `docs/` ni Cloudflare desplegado tocados.
- `friendly123workshop` es exclusivamente laboratorio/documentación, **no PORT final**. Relevo principal [Notion](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94).
- Plan primero [Gate D2](../plans/2026-11-19-real-app-gate-d-paged-source-precode.md) y [OpenCode addendum](../plans/2026-11-19-real-app-gate-d-paged-source-opencode-addendum.md).

## Evidencia RED→GREEN app real

- **RED 1** [workflow 44466569048](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44466569048), SHA `e61b00e7`: **5/7** — fallan realmente lectura >4096 frames y 401 de la segunda página (solo una petición alcanzada).
- **RED 2 privacidad** [workflow 44467393317](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44467393317), SHA `3756a646`: **8/9** — un `productos` legacy v1 con campo `costo` y `ownerPin` extra pasa falsamente.
- **GREEN final** [workflow 44467465935](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44467465935), SHA exacto `0fe850f77b4d77d526155d77d0d90370543be547`: **9/9 nuevos** y **25/25 Workerd/SQLite Gate D heredados**; cero FAIL/SKIP/CANCEL según logs de ambos pasos. Esto acredita candidato QA sintético, NO migración real a Cloudflare ni físico.

## Cambio Ponytail

El lector auténtico del Worker 2.0, `cloudflare-yparty-worker/src/trusted-frozen-source.mjs`:
- mantiene servicio interno `WS_FROZEN_HISTORY_SOURCE`, sin endpoint de importación público, usa `WS_SERVICE_KEY` en cada petición;
- lee 1..16 páginas de un solo frozenHead, hash estado Yjs/vector y event count, sin aceptar salto, duplicado, falso último bloque, totales falsos, 401 intermedio, digest de página o SHA root falsos; serialización base64 de frames, hashing de frames prefijados con longitud y hash root de SHA por página;
- mantiene límites conservadores 16MiB JSON/página, 4096 frames/página, 16384 frames y 64MiB en total, 5s agregados; soporta v1 numérica de una sola página pero rechaza sus raíces reales privadas;
- impone catálogo v2 como copia *pública separada* de `productos`/`ubicaciones`, campos exactamente allowlisted vía `catalog-safe-projection.mjs`; nunca mete `_meta` ni `ventas`, dinero, clientes, teléfonos, fotos/PIN en el nuevo formato;
- encontró/solucionó un TypeError de raí­ces Yjs reconstruidas con `Y.applyUpdate`: deben materializarse mediante `doc.getMap()` antes de que el proyector llame `.forEach()`.
- QA flags inicialmente OFF y sin fuente real ligada. Las pruebas nuevas usan Yjs y Workerd reales con datos sintéticos.

## OpenCode/Hermes 19 nov · Qué adoptamos vs qué queda separado

Informe `cold-join-2026-11-19[1].md` del usuario (solo lectura) leído íntegro. Sus ideas incorporadas **hoy**: manifiesto, base64, rechazo privacidad del catálogo y tests negativos de autenticación/corte falso. Hallazgos adicionales validables: `installFrozenImport` rechaza DO que ya tiene datos; `openExistingStore` reabre con chequeo `eventCount` que no detecta reemplazo same-ID; `completeToHead:true` es una afirmación del proveedor que exige ancla externa; tienda real Firebase puede tener 6112 frames, 19 padres y 9 respuestas 401 sin resolver.

**Siguiente raíz en código real:** `merge-frozen-into-existing.mjs` con `Y.diffUpdate`, conservación del journal SQL por `transactionSync`, eventos de negocio idempotentes por opId, certificado union SHA/digest independiente y failback; regresión con tienda existente 10 ops + historia 100 ops = exactamente 110, sin perder ni duplicar dinero. Independientemente, fuente Firebase certificada por universe/HEAD cardinalidad y checksum comercial; servicio QA desplegado vía binding y secreto central; dos ciclos físicos Opera PC↔Safari iPhone. Cuidado: una fusión de CRDT no equivale automáticamente a un commit comercial.

**Regla de marcadores inmóviles:** arquitectura **67/100**, PORT **61/100**, GO comercial **0/6**. La PR nueva incrementa capacidad de Gate D en fuente, NO certifica `frozen-real-head-zero-pending` ni `real-shop-single-cutover` del rúbric. No inflar a 80/100.
