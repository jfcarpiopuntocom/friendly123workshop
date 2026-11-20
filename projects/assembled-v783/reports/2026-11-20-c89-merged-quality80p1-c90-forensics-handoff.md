# C89 · evidencia post-merge y relevo forense C90 — 20 nov 2026

**Producto real:** jfcarpiopuntocom/friendly-123, master `1d4443b425cafc7ab46e42d13025486c70e5070f`. **PR C89:** https://github.com/jfcarpiopuntocom/friendly-123/pull/889 (MERGED/squash, comprobación API de master y lectura de los dos JSON oficiales). **PRECODE anterior al código:** [C89 PRECODE](../plans/2026-11-20-c89-c86-original100-migration-quality80p1-precode.md).

## Evidencia verificada por Sol6, sin trabajo sobre datos de clientes

1. Se comprobó la PR #889 head `3796447ae201b040e8ab15191745b3f491bde885`, 11 GitHub Actions con conclusión SUCCESS (C12, C13, C30 y gates).
2. Se revisaron los tres diffs: `docs/engineering/architecture-2-quality-score.json`, `scripts/architecture-2-port-score.cjs`, `test/p0-architecture-2-port-score.test.cjs`; ningún runtime, Firebase, Cloudflare, Sync3 o dispositivo alterado.
3. La fuente funcional previamente integrada [C86 #886](https://github.com/jfcarpiopuntocom/friendly-123/pull/886), SHA `129e5d45155c4eeb7052c246a5944696f17ce461`, corrige los valores legítimos 1.0 `abono.monto` decimales y claves `undefined` durante canonización de hechos económicos, respaldado por pruebas RED→GREEN Yjs/R2/SQLite reopen.
4. Se fusionó la PR #889 con `expected_head_sha` exacto. GitHub confirmó `merged=true` y la nueva rama principal `master@1d4443b...`; la lectura posterior de los JSON en `master` confirma **transición 92.0/100.0**, **calidad 80.1/100.0** (previa80.0, migración7.7→7.8/10), **GO 0/6**, sin modificación de la rúbrica ni crédito por HEAD o R2 ausentes.
5. Las 11 acciones exitosas corresponden al HEAD de la PR. La compilación/deploy Cloudflare posterior al merge no está certificada por este registro, y este cambio documental no autoriza conmutación física o comercial.

## C90 paralelo de Claude (información comunicada, sin fingir lectura directa de Firebase desde esta sesión)

- [PR #890](https://github.com/jfcarpiopuntocom/friendly-123/pull/890), head `783281a977f955c8c56330e653500794ed75b067`, fue comprobada ABIERTA, no fusionada, con 11 GitHub workflow runs SUCCESS. Admite representación JSON-array de `/k` devuelta por Firebase REST, conservando revisiones, huecos y fail-closed.
- Según el [registro C90 de Claude](../plans/c90-firebase-real-head-observation-and-rest-array-precode.md), captura OAuth/CLI read-only con HEAD estable, `-ops` con 153 frames y 227 opIds verificables; `-y` incompleto (3/20 fragmentos, dependencias causales de 18 escritores, 489 `hechos_financieros`); legacy 1.0 con cinco hechos económicos únicos no encontrados en los otros canales. Estado **NO CERTIFICADO**; no sumar ni importar como historia completa.
- Ese reporte no demuestra que los 17 fragmentos ausentes residan hoy en determinado aparato. Es una hipótesis a comprobar con backup/exportación no destructiva por perfil de PC Opera/Chromium, iPhone Safari y cada PWA, inspeccionando IDB, outbox, fotos y recibos locales.
- Reconciliación propuesta: unión de hechos por `opId` + hash del contenido, retener procedencia y bytes originales, cuarentena de conflictos en vez de sobrescribir; probar cold reopen, datos locales y remote cross-device antes de cualquier cutover. El primer paso es exportación/verificación, no limpieza ni escrituras a clientes.

## Métricas independientes del original100

| Indicador | Antes C89 | Postmerge verificado |
|---|---:|---:|
| Transición de la MISMA friendly-123 arquitectura 1.0→2.0 | 92.0 | **92.0 /100.0** |
| Calidad arquitectónica | 80.0 | **80.1 /100.0** |
| GO comercial | 0/6 | 0/6 |
| Pruebas físicas Opera↔Safari/PWA | 0/5 | 0/5 |

**Reglas:** workshop únicamente PRECODE/QA/evidencias, producto exclusivamente `friendly-123`; Sync3 ya es parte 2.0. Respeto de reservas #841 (ledger), #868 (fotos), #871 (Yjs), #888 (catálogo), #890 (Claude certifier). Ningún reset o reemplazo de IndexedDB, outbox, Firebase, PIN o historial comercial; conservar licencias, fotos y hechos de los clientes.
