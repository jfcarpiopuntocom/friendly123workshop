# P0: YParty chunked SQL — falla inyectada durante compacción y rollback de diario (QA solamente)

**Fecha 2026-11-17 UTC**, base privada importadora del Worker firmado [PR #9](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/9) HEAD `d17e5bc259929b13a466360f5937ac9e52ee950f`. **NO-GO comercial**, no desplegar, sin cliente, sin claves, sin licencias ni clientes reales.

## Estado previo

- [RED 44020392859](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44020392859) del Worker sin chunks 2.129.920 bytes provocó `YParty could not durably journal a Yjs update`.
- [GREEN 44020943710](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44020943710) y [44020948845](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44020948845) sobre `d17e5bc259929b13a466360f5937ac9e52ee950f`: 1/1 imagen grande + 11/11 HMAC/nonce/coldjoin/regression **×2**, 0 omitidos. Test incluye ventana 4,5s `onSave`, segundo SHA, shutdown y readback de foto por dueño, pero todavía **no prueba rollback parcial ni cuenta filas SQL**.
- Código `injertos/yparty-worker/src/index.js` `onSave()` es síncrono y escribe `documento_bloques` 512KiB bajo `ctx.storage.transactionSync`, borra `documento`, `diario_bloques` y `diario` SOLO dentro de la misma transacción. El riesgo: falla de SQL en un chunk intermedio no debe destruir el diario o dejar un snapshot inconsistente; al reintentar debe publicar el corte Yjs completo.

## Plan-first / ownership

1. Guardar este plan en workshop y crear reserva Notion. **Nueva rama** `qa/yparty-sql-rollback-20261117` desde SHA `d17e5bc259929b13a466360f5937ac9e52ee950f`, PR DRAFT hacia `fix/yparty-photo-chunks-qa-20261117`. Rutas: nuevo `injertos/yparty-worker/qa/p0-chunked-transaction-rollback.test.mjs` + `.github/workflows/qa-yparty-chunk-rollback.yml`. **No modificar** source Workerd si prueba pasa, tampoco `docs/`, cliente, producción, roles, KEY, PWA ni PR9.
2. Crear test que ejecuta literalmente métodos `onSave/onLoad` leídos de `src/index.js` bajo `vm.runInNewContext`, con Y.Doc REAL, estado >2MiB y SQL sintético **con transacción y rollback explícitos**: presembrar un diario completo de actualización nueva y antiguo snapshot, disparar fallo en segundo `INSERT INTO documento_bloques` y comprobar rollback de todos los cambios, preservación completa del journal y revisión; luego reintentar sin fallo y confirmar snapshot en bloques ordenados, diario borrado y estado recuperado mediante `onLoad` literal. Reportar el rol del fixture, no afirmar prueba SQL real por esta prueba unit.
3. Añadir caso de bloques incompletos en `diario_bloques`: `onLoad` debe **fallar cerrado** y no reconstruir un documento silenciosamente parcial.
4. CI Node22, `npm ci --ignore-scripts`, `node --test`, source pinned; no cuenta Cloudflare, sin `upload-artifact` por cuota, TAP en job logs. Volver a ejecutar las 12 pruebas Workerd reales de #9 sobre SAME SHA en job separado si se cambia el source; si solo test/workflow y están verdes, citar último GREEN de `d17e5bc` como evidencia de fuente idéntica pero nuevo HEAD de QA no se ha probado end-to-end (no extrapolar).
5. Si los métodos fallan, registrar RED SHA y analizar causa antes de alterar runtime en rama hija; no forzar green. Si todo pasa, PR DRAFT con fuente unchanged y evidencias, dejar P0 de autoridad real/typed opId sin cerrar.

## Límite y próximos pendientes

Es una prueba **unitaria fiel al código fuente, no Workerd transaccional real**: la atomicidad de `transactionSync` proviene de Cloudflare, no del simulador. Para aceptación comercial faltan inyección real por storage API o pruebas de caída en Workerd, autoridad central PIN/Team y nonce central, privacidad histórica, cliente firmado, venta typed opId, fotos de gastos, recuento de filas SQL, full audit y físicos Opera↔Safari A→B→A ×2. No activar YParty ni cambiar proveedor. WCAG P2 siguiente versión aparte.
