# Gate D / Firebase HEAD real → R2 · estado Cloudflare comprobado, SOLO LECTURA

20 nov 2026 Ecuador. Fuente directa: Cloudflare API GET al entorno conectado del usuario (no capturas, no ambiente inventado, ninguna mutación). Trabajo para la MISMA friendly-123, la migración de arquitectura 1.0→2.0 con Sync3 ya dentro.

## Verificación real (solo metadatos, sin secretos)

GET `/accounts/<account>/r2/buckets` devolvió **success=true y 0 buckets**. No se creó, movió, listó contenido privado de ningún objeto, ni se ejecutó PUT o PATCH. Esto comprueba ausencia de un destino R2 disponible **en esa cuenta consultada al momento del GET**, no que sea imposible usar R2 en otro proyecto o cuenta.

GET `/accounts/<account>/workers/scripts` confirmó existentes entre otros scripts los Workers `friendly123-yparty-port2-canary-qa`, `friendly123-yparty-piloto` y `friendly-123`; no se cambió ninguno.

GET settings del script `friendly123-yparty-port2-canary-qa` confirmó nombres/tipos de bindings: `LICENCIAS` KV, `Tienda` Durable Object, `WS_AUTHORITY` Service Binding y flags QA `WS_AUTHORITY_QA`, `WS_BUSINESS_EXECUTOR_QA`, `WS_OPEN_EXISTING_QA`, `WS_PHOTO_BLOBS_QA`, `WS_SEPARATE_ROOMS_QA`, `WS_TYPED_COMMANDS_QA`, más `WS_SERVICE_KEY` secret_text (SOLO se leyó metadato nombre/tipo, jamás valor). **NO aparece `WS_FROZEN_HISTORY_SOURCE` Service Binding, ni R2 bucket binding** en este script.

GET settings de `friendly123-yparty-piloto` mostró solo `LICENCIAS` KV y `Tienda` DO; sin `WS_FROZEN_HISTORY_SOURCE` ni bucket R2. `friendly-123` devolvió lista de bindings vacía en endpoint settings. Estas conclusiones son del script/fecha revisados, no un inventario de todas las cuentas.

El código real `cloudflare-yparty-worker/src/trusted-frozen-source.mjs` exige para historia congelada `env.WS_FROZEN_HISTORY_SOURCE.fetch`, key service, canal/room/QA grants, SHA fuente, state-vector y documento Yjs completo sin padres pendientes. El proveedor `cloudflare-yparty-worker/src/frozen-r2-source.mjs` YA existe, y los tests QA Workerd Miniflare usan Service Binding **sintético**, no una vinculación real en los Workers arriba.

## Diagnóstico de bloqueo NO-GO

1. Existe un adaptador R2/fuente *implementado y probado de forma sintética*. **No** está instalado el bucket/Service Binding real en la cuenta/Worker comprobados, y no existe evidencia de Firebase RTDB HEAD histórico real certificado ni reconciliación económica del mismo opId/stock/caja hasta ese HEAD.
2. No mover puntuación de esta constatación: puntuación oficial C61 **91,8/100,0 migración y 78,9/100,0 calidad**; faltan en rubrica congelada **Firebase HEAD real2,2 y R2 binding2,0**, y 8,2 en total; GO0/6 físico0/5. [C62 PR #862 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/862) soluciona otro asunto de privacidad, sin convertir estos prerrequisitos en satisfechos.
3. Secuencia correcta cuando exista autorización operativa/certificado: congelar HEAD REAL independientemente de la app, auditar OP IDs por hechos financieros y saldo, proyección publica -cat y privada -ops separadas, archivado R2 con digest raíz/capacidad PITR, configurar los bindings QA sin exponer secretos, consultar en solo lectura antes de primer corte; recién entonces ensayar join en DO contra SHA y dos dispositivos físicos. No mezclar baselines económicos sin reconciliar el journal Yjs.
4. **Prohibido** usar este informe para afirmar que hay GO comercial, autorizar cobros/cambios de R2 o crear bucket/Service Binding automáticamente; ninguna mutación ni cargos nuevos en esta auditoría.

Fuente de los indicadores C61: [PR #861 MERGED](https://github.com/jfcarpiopuntocom/friendly-123/pull/861), [informe C60/C61](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/reports/2026-11-20-c60-c61-frozen-public-catalog-91_8-78_9.md).