# P0 — CIERRE DEL PORT EN TRES BLOQUES, UN SOLO OWNER
Fecha 2026-11-17 (Ecuador). **Plan duradero ANTES de cualquier cambio**. Fuente: decisión textual JFC/Opus 5.5 en Notion https://app.notion.com/p/41b1642b67f381fbab5cf45ac55aabd3; handoff https://app.notion.com/p/41b1642b67f381819878ecf04eb44c42; restricción arquitectura https://app.notion.com/p/4191642b67f38151a49bd0e021c5b372.

## Identidad y punto de recuperación
- Repo único persistente: `jfcarpiopuntocom/friendly123workshop`; rama de este checkpoint: `feat/20261117-p0-closure-single-owner-checkpoint`.
- **Base inmutable observada**: `main@5cb0fe63f3dad72937a15bc209881fbef1a28411` (PR91 Team cat:read fusionada).
- Producción `friendly-123` NO se toca; no deploy ni flags hasta criterios binarios, QA sin datos de cliente ni secretos.
- Métricas del JSON canónico: calidad **64.5/100** (frente 45.0 retrospectivo del 10-Nov; incertidumbre ±4/±5) y port **33.0/100** (inicio 27.0 del 17-Nov; semana previa NO EXISTE métrica). **0/6 gates GO**. Nunca aumentar puntos por una PR o un componente dormido; cada aumento requiere evidencia exacta SHA/CI.
- Código a auditar: `projects/assembled-v783/quality/{score-v1.json,port-v1.json,port.cjs,PORT-STATUS.md}`, app `src/yparty-piloto.js`, docs `sync-yjs.js`, relay `src/index.js`. Ejecución: `node projects/assembled-v783/quality/port.cjs --require-operational-go` falla hasta 100/100, calidad >=95, 6/6.

## Seis gates congelados (NO mover ni añadir)
A economía tipada 20 (hoy 4): `sale.record`, ajuste, pago/cobro y ACK de efecto contable tras SQL/Yjs/stock/caja, `opId` estable y rechazo de empleado con raw Yjs; recibo `stored-for-application` jamás es aplicado.
B identidad 20 (hoy 16): Owner/Team emisor central, tickets frescos separados cat/ops, revocación y retransmisión segura; cliente Owner de PR87, servidor PR86 y Team cat:read PR91.
C fotos SHA 10 (hoy 0): bytes externos en SQL existente de 512 KiB, referencia sólo `{sha,bytes,tipo}` en Yjs y restauración cliente a cliente; servidor PR89 7/7 NO acredita aún navegación completa.
D import/export 25 (hoy 10): Firebase real congelado, un solo importador hasta HEAD con `pendingStructs=null` por completitud REAL (jamás limpiar a mano), conteo opId, SHA/state-vector, DO SQL frío y Firebase de reversión con journal completo, cero pérdida/duplicación.
E Web Locks + iPhone 10 (hoy 3): concurrencia de dos tabs y outbox duradero, ausencia de Web Locks explícita **fail-closed** o una sola pestaña segura + aviso; pageshow.persisted real y app reanudada.
F físico 15 (hoy 0): Opera PC ↔ Safari iPhone A→B→A dos veces; 3 ventas A, 2 offline B, reconciliar cinco hechos, stock/dinero, fotos, permisos, cierre/reinicio y hashes coincidentes; JFC aporta evidencia física.

## 3 bloques de 4h acordados (ventanas de trabajo, NO promesas de aprobación)
**Bloque 1 (B+E+C; objetivo orientativo ~54)**: unificar PRs de workshop ya probadas, completar foto SHA browser respetando la reserva; resolver 1 RED de PR90 de ausencia de Web Locks; comprobar bundle, navegador Chromium/WebKit y fallbacks por falta de PIN o ticket. Fuentes y tests exactos antes de sumar cada stage. No sumar B 4/20 extra por acceso Team aislado: flujo real/revocación del cliente aún pendiente.
**Bloque 2 (A+D; ~95 orientativo)**: comando económico tipado sólo por canal servidor autenticado con `opId` UNIQUE, dinero centavos y efectos **una** vez en inventario/caja; ACK aplicación después de commit, no mero inbox. Importar Firebase real congelado con único importador y certificado (hoy 5.348 frames / 15 padres pendientes); exportar al relay antiguo, restaurar una copia limpia, verificar checksum de business y failback. Si error, conservar cola local, jamás reclamar venta recibida.
**Bloque 3 (F; 100 y 6/6 sólo si pasan)**: exactamente dos ciclos físicos Opera PC/iPhone Safari; caída conexión/reanudar/cerrar-reabrir; si alguna diferencia o ACK no verificable, NO-GO, mantener producción, documentar fallo sin mover gate.

## Estado demostrado, restricciones de edición y conflictos
- PR87 cliente firmada 9/9 + integrada 585/585; PR89 servidor foto SHA 7/7 y 585/585; PR91 Team catálogo read-only Workerd 8/8 + integrada 585/585. Son pruebas de laboratorio; no dicen que el cliente comercial converja.
- **PR90 sigue DRAFT RED** SHA `60f7e3c271c3cf918e69a0ae74148b93d2386fcd`: 3/4 casos reales con fake-indexeddb y Web Locks simulados; el fallback `navigator.locks` ausente llama `run()` silenciosamente. NO editar `app/docs/sync-yjs.js` mientras la reserva de fotos está activa; enviar el fallo y una corrección mínima al dueño de ese archivo, luego ejecutar de nuevo **el mismo test** con Chromium/WebKit y reload.
- Reserva de fotos browser Notion https://app.notion.com/p/41b1642b67f381828d00eea08115d82b ocupa `app/src/yparty-piloto.js`, `app/src/ws-owner-ticket-params.mjs`, `app/docs/sync-yjs.js`, vendor generado y nuevos tests. No competir desde esta rama ni editar esos paths hasta liberar y rebasar.
- PR91 ya fusionada: Owner/Team seguridad Workerd es admisión, no executor de dinero. `typed-commercial-ledger.mjs` almacena sólo `stored-for-application`. No anunciarlo como `business-committed`.
- CI histórica 585/585 **no equivale a GO**; full historical audit reportó 29 FAIL; historiales reales y pruebas físicas pendientes.

## Ponytail / Superpowers: cada edición
1. Buscar reserva/PR más reciente en Notion, fijar SHA y registrar quién posee cada archivo. Una sola rama de ensamblaje; otras IA revisan. No pisar cambios de trabajo simultáneo.
2. Reproducir fallo mediante test RED antes de tocar código. Escribir cambio mínimo completo o importar adaptador maduro **ya incorporado**; nada de otro motor, dependencia nueva o refactor de UX/PWA/WCAG.
3. GREEN en foco + suite integrada 585 y full audit (reportar rojos sin ocultarlos) en SHA exacto. Browser Chromium y WebKit de QA; distinguir del iPhone real.
4. Actualizar `port-v1.json` y `score-v1.json` únicamente con test acreditable, fuente, SHA; verificar `port.cjs`, `PORT-STATUS.md`; mantener 0/6 hasta certificado binario. Nunca dar una cifra estimada de fiabilidad.
5. Push de plan, pruebas, código y evidencia al workshop; anexar Notion y enlace a PR, detener despliegue comercial hasta 100/100 + >=95 calidad + 6/6 pruebas y GO JFC.

## Siguiente operación inmediatamente habilitada
Cerrar interferencia de PR90 con reserva de fotos: informar al titular de `sync-yjs.js` que el bug reproducido es `navigator.locks ? request(...) : run()`; la reparación mínima debe **bloquear la mutación sin lock**, preservar fila de IDB existente y mostrar estado de operación pendiente, a menos que exista comprobación robusta de una pestaña. Consumir test PR90 de nuevo; solo tras GREEN hacer merge y puntuar stage E. Paralelamente terminar foto browser en rama reservada PR89; una vez liberada, rebasar una sola rama integración y ejecutar todos los gates, no abrir diseño nuevo.

## Semáforo al escribir este archivo
**NO-GO, calidad 64.5, port 33.0, 0/6**. Este checkpoint es plan, no implementación ni resultado de QA. Esta rama inicialmente no cambia runtime, Worker, PIN, datos, flags ni producción.
