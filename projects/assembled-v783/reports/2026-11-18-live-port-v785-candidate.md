# friendly-123 · Relevo del PORT en la app REAL · 18 nov 2026, candidato v0.7.85

## Decisión y alcance

**PORT significa portar la aplicación efectiva al nuevo ensamblaje**, no copiar o reconstruir datos de clientes. El autor del ensamblaje #751 es Opus 5.5; el paquete complementario #753 lo preparó GPT-6 en otra rama y **no se ha fusionado en master ni desplegado**. Este informe es un checkpoint verificable, no una autorización para activar una tienda.

### Evidencia GitHub exacta
- App comercial actual: [friendly-123/master v0.7.84, commit `67e1d993`](https://github.com/jfcarpiopuntocom/friendly-123/commit/67e1d993743be29b62789a1a45ac0c28b852b52d). Trae outbox v2 atómico sin Web Locks, HTTP replay 403/500 fail-closed e IndexedDB retry/abort.
- App real nueva detrás de dos llaves y escritura sombra: [PR #751](https://github.com/jfcarpiopuntocom/friendly-123/pull/751), HEAD `3a832ca0f08793dccdf4c283687a303867e3c205`, DRAFT de Opus. Por defecto OFF; con ON solo catálogo por YParty, ops/dinero por relay anterior; descarga SHA fotos on demand. Worker nuevo incluida su fuente, pendiente configuración.
- **Candidata consolidada** [PR #753](https://github.com/jfcarpiopuntocom/friendly-123/pull/753), HEAD **`14e195934816d80a755ebea75f00285b0203d215`**, PR abierta lista para revisión, apilada sobre la rama #751. EXACTAMENTE ocho ficheros nuevos/modificados: versión v0.7.85, shell `f123-shell-v785`, `golden321`, `dashboard-shell` y `dashboard-release` correctos, manifest determinista, bundle YParty REPRODUCIBLE Git blob `fef27c970d7763beaad8a7240b6f0d85282e7a37`, `cloudflare-yparty-worker/wrangler.jsonc` QA isolated con DO SQLite/KV/Service Binding y flags OFF, más 2 workflows QA. No modificación de `docs/sync-yjs.js` de Opus ni de datos de tiendas. [PR #752](https://github.com/jfcarpiopuntocom/friendly-123/pull/752) fue cerrada como SUPERSEDIDA sin borrar la rama.
- **20/20 checks SUCCESS exact HEAD #753, 0 fallos**: [seal y manifest oficial 25/25](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44307902378), [YParty Workerd 119/119](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44307902238), [Chromium 3/3 + WebKit 3/3](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44307902064), [P0 Hotfix Gate](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44307902066), [Release continuity](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44307902390), [Worker Wrangler dry-run, SIN DEPLOY](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44307902173), [two-tab sales](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44307902376). Los logs del exact-head se inspeccionaron, no solo badges CI.
- Plan previo al código preservado en [PR workshop #119, FUSIONADA](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/119) y en [Notion de Opus/Sol6](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94).

## Dos métricas invariables /100

| Indicador | Una semana antes / corte anterior | Última puntuación rigurosa | Referencia |
|---|---:|---:|---|
| **Calidad de arquitectura** | 45.0/100 ±5 (retroestimación, 10 nov) | **67.0/100 ±4** (candidato taller, revisión 17 nov) | `quality/score-v1.json`; no revaluada ni inflada por PR #753 |
| **Culminación del port operativo, rúbrica de hitos** | primera medición versionada 36→41; no hay cifra auditada 10 nov | **57.0/100** (candidato taller, evidencia Workerd, no actividad comercial) | `quality/port-v1.json`; **0/6 gates certificados** |

**NO representar 57/100 como porcentaje de nueva app 2.0 en producción.** La app LIVE usa todavía v784 y la arquitectura 2.0 está OFF; ni siquiera publicada. La rúbrica del taller demuestra preparación e integración de código, no convergencia física.

## Bloqueos reales siguientes, orden Ponytail

1. **Elegir SOLO una identidad de host QA:** la URL compilada de `src/yparty-piloto.js` apunta a `friendly123-yparty-qa-20261114.jfcarpio.workers.dev`, mientras que la config aislada de #753 usa Worker nuevo `friendly123-yparty-port2-canary-qa`. No sustituir el Worker anterior ni conectar un host incorrecto: antes de cualquier prueba hay que alinear el host, reconstruir el bundle+manifest y disponer de autorización; switches y permisos siguen OFF.
2. **Autoridad privada QA:** el emisor actualizado `/ws/ticket` en `cloudflare-worker` de #751 no está desplegado, faltan variables `WS_SIGNING_KEY`, `WS_SERVICE_KEY`, `WS_AUTHORITY_QA=1` estrictamente para QA. Nunca guardar secretos en Git ni activarlo globalmente; autorización y roles owner/empleado antes de primera tienda.
3. **Catálogo frío real:** [Gate D QA real run 44251710241](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44251710241): `ops` 202 eventos, 0 pending, pero catálogo `recuperando` después de 301 s, 67 structs parciales. **No** contar import real, no reemplazar historia ni forzar stock. Probar coldjoin A→B→A con 100 % catálogo y cursor durable a HEAD, evidencia explícita.
4. **Dinero/ventas client → ejecutor:** Worker Workerd puede aplicar sale/adjust/payment tipados sobre baseline sintético con `business-committed`, pero el cliente del puente A sigue usando `-ops` legado deliberadamente. Para migrar negocio real exige plan, client ACK por opId, rollback y cero doble aplicación. El grado de port **no** equivale a negocio nuevo operable.
5. **Fotos offline:** taller [#117](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/117) con 24 tests Gate C pero no integrada, debe actualizar base y repetir su QA tras fix vendor workshop #118; no declarar descarga física iPhone.
6. **Prueba física y aprobación:** 10 pasos de [relevo Notion](https://app.notion.com/p/41c1642b67f38184aeb6e5213570545e), dos aparatos reales, ON→OFF→ON, PC↔iPhone A→B→A ×2, stock/ventas/recibos/dinero/fotos iguales, operación en <10 s, venta ≤2 s, sin reconexión falsa; 6/6 gates necesarios, autorización JFC antes de merge/deploy comercial.

**Prohibiciones:** no importar, limpiar o reescribir datos; no deducir existencias por reloj; no aceptar `false`/403 como ACK; nunca duplicar stock/pago; no tocar la rama de Opus sin acuerdo; no convertir CI synthetic en aprobación de despliegue.

Este reporte documenta hechos ya comprobados y el siguiente bloqueo verificable, sin añadir etapas ni mover puntuaciones.
