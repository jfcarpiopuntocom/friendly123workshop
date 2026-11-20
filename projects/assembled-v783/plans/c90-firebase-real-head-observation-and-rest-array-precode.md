# C90 · Observación real del HEAD Firebase (solo lectura) + certificador acepta la forma array REST de /k

**Agente:** Claude CLI · **Fecha:** 20 nov 2026 · **Base producto:** master `b56d560c` · **Rama/PR:** `port2/20261120-c90-firebase-rest-array-checkpoints` → https://github.com/jfcarpiopuntocom/friendly-123/pull/890 (`783281a9`)
**Reservas respetadas:** #841, #868, #871, #888, #889 (ninguna toca `tools/firebase-frozen-certifier.mjs`).

## PRECODE
- Archivos: `cloudflare-yparty-worker/tools/firebase-frozen-certifier.mjs` (collectOrderedRecords), `cloudflare-yparty-worker/qa/p0-firebase-frozen-certifier.test.mjs` (test C90).
- RED: `k` como array REST (`[null,k1,k2]`) → `invalid checkpoint map`.
- GREEN: array → rev por índice; índice 0 debe ser null; huecos no se inventan; entradas mal formadas fallan cerradas; mismos SHA que la forma objeto.
- Aceptación: 4/4 certificador, 1/1 score test, validador 92.0/80.0/GO 0/6 sin cambio.

## Evidencia real (agregados; sin licencia, sala, PIN ni datos)
- Firebase CLI 15.37.0, OAuth; proyecto `friendly-123-ab7b3`, instancia `friendly-123-ab7b3-default-rtdb`. `/f123`: 148 nodos (60 `-y`, 30 `-ops`).
- Testigo HEAD (conteo + SHA de claves) antes = después en `-y/k,-y/o,-ops/k,-ops/o,legacy/k,legacy/o` (5/1976/76/77/195/678).
- `-ops` CERTIFICA: 153 frames, 227 opIds, pendingStructs 0, pendingDs false, sin checkpoint obsoleto; tipos: ajuste 168, venta 55, cancelación ex-post 3, cierre-día 1.
- `-y` NO certifica: 1 grupo tag 3 huérfano (3/20 piezas, ~14 días). Sin él quedan 18 escritores con ancestro faltante (~458 KB en espera). Contiene raíces económicas (`hechos_financieros` 489, `ventas`, `clientes`).
- Legacy 1.0 (JSON, misma clave): 52 opIds económicos; 47 en `-ops`; **5 solo en legacy** (3 ventas, 2 ajustes).

## Veredicto
HEAD económico completo **NO CERTIFICADO**. Puntos: sin cambio (92,0 / 80,0).

## Siguiente cambio mínimo
1. Certificación de unión: `-ops` ∪ legacy 1.0 (5 hechos) ∪ `hechos_financieros` de `-y`, por opId, con duplicados detectados.
2. Recuperar el fragmento huérfano de `-y` desde el outbox del aparato que lo emitió (marcado `huerfano` en IndexedDB), sin borrar nada local; volver a certificar.
3. Solo después: paquete R2 + Worker fuente + Service Binding QA.

## C90b · Unión certificable y recuperación del fragmento huérfano (20 nov, tarde)
Fuentes, todas en solo lectura: Firebase (`-y`, `-ops`, legacy 1.0) + **copia** del IndexedDB de la app en Opera Air de la laptop de JFC (abierta en Chromium con toda la red interceptada; no corrió código de la app; el original quedó intacto). Vivaldi, AbacusAI y Playwright: sin datos de la tienda.
- **Eventos:** `-ops` ∪ legacy = 232 opIds (227 + 5 solo-legacy), 0 conflictos de payload. `-ops` local = Firebase byte a byte (mismo stateSha).
- **Ledger `hechos_financieros`:** Firebase 489 → unión con local **547** (58 hechos que solo estaban en el navegador). 1 cadena sigue con el eslabón previo ausente.
- **`-y`:** la copia local aporta ~15 MB que Firebase no tiene. Pendientes de causalidad: Firebase 18 escritores → unión 17. El fragmento huérfano del 4 nov (update tag 0, 20 piezas) no se encontró completo en ningún navegador de la laptop.
- Corregí un error propio: las bases `amig::`/`c123::` son otras apps (amigable-123 / consultorio-123) con el mismo código; no se mezclan.
**Veredicto:** HEAD económico completo todavía **NO CERTIFICADO** (17 escritores con ancestro ausente). Puntos sin cambio.
**Siguiente:** obtener el IndexedDB de los aparatos que estuvieron activos el 4–7 nov (copia de solo lectura del navegador del celular/PC), repetir la unión; solo con 0 pendientes → paquete R2.

## C90c · SELLADO en R2 QA privado (20 nov, ~15:10)
Decisión de JFC: «no hay datos perdidos; solo sellar y avanzar»; los aparatos (iPhone y tablet de Belén) no se tocan y lo suyo entra hacia adelante por unión.
- HEAD sellado `fb-7d8e5559ecb3eb245c73f7c5`; testigo de Firebase releído justo antes de subir: **igual** (sin escrituras entre lectura y sellado).
- Bucket `friendly123-frozen-history-qa` (privado, Standard, sin dominio público): estaba vacío; sin sobrescrituras.
- **`-ops` certificado** con el packer del repo: `f123-frozen/v1/<sala32>/<HEAD>/ops/` = manifest + 2 páginas; manifest SHA-256 **c1d0116caf669bb4bb71f201218cb3af96bb35a232bff8678b811396c283b35a** (ancla externa: este reporte); 227 opIds; stateSha 5d551592…; vectorSha c75c6388….
- **Copia sellada byte a byte** (todavía cifrada AES-GCM) de `-y`, `-ops` y legacy 1.0 + manifiesto: `f123-sealed-raw/v1/<sala32>/<HEAD>/`. No se importa; es una garantía.
- 7/7 objetos subidos y **releídos desde R2 con el mismo SHA-256**. Costo: 7 PUT + 7 GET y ~36 MB, dentro del plan gratuito de R2 (sin cargo comprobado en facturación: **sin comprobar**).
- Sin cambios en Firebase, aparatos, Worker de producción ni banderas.
**Pendiente para el +2,0 de R2:** desplegar el Worker privado `friendly123-frozen-history-qa` (wrangler.frozen-source.jsonc) con el pin del manifest e instalar `WS_FROZEN_HISTORY_SOURCE` en el Worker QA; verificar binding por API + lectura real. Puntos: **sin cambio** hasta entonces.

## C91 · Worker de fuente + Service Binding QA + lectura real E2E (20 nov, ~16:00)
- Fuente privada `friendly123-frozen-history-qa` desplegada (4c2534de), sin rutas ni workers.dev; ROOM/HEAD del sellado; pin `F123_FROZEN_OPS_MANIFEST_SHA256` = c1d0116c…b35a.
- Worker QA `friendly123-yparty-port2-canary-qa` desplegado desde la rama C91 (5ea0fba3): binding `WS_FROZEN_HISTORY_SOURCE → friendly123-frozen-history-qa` **verificado por API**; clave propia `WS_FROZEN_SOURCE_KEY` (la `WS_SERVICE_KEY` compartida con licencias ni se envía ni se rotó).
- **Lectura real E2E PASS:** probe efímero `wrangler dev --remote` (binding real al Worker desplegado), `readTrustedFrozenSource` con `WS_R2_MANIFEST_REQUIRED_QA=1` → `prepareFrozenImport` del producto: HEAD fb-7d8e5559ecb3eb245c73f7c5, stateSha **5d551592bba72b2be7b998e584e0e3b913ec9010d6364ada77ec872cca4cec95**, vectorSha c75c6388…, **227 opIds** = certificación independiente de Firebase.
- PR #902 (incluye #890): CI 19/19 pass, MERGEABLE/CLEAN. **Merge pendiente** (la sesión de Claude no tiene permiso para mergear a master).
### Traspaso para acreditar puntos (archivo reservado por #889: scripts/architecture-2-port-score.cjs + test)
- `r2-service-binding-installed` (+2,0): evidencia completa arriba (objetos R2 auténticos releídos con SHA, manifest anclado fuera de R2, Worker fuente privado, binding por API, lectura real E2E idéntica a la certificación). Acreditar **después del merge de #902**.
- `real-firebase-head-complete` (+2,0): `-ops` completo y certificado; `-y` sellado byte a byte con 17 escritores con ancestro pendiente, a completarse hacia adelante desde los aparatos. Criterio de JFC: «no hay datos perdidos, sellar y avanzar». Acreditarlo o no depende de la rúbrica oficial; Claude no lo acredita por su cuenta.
