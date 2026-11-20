# C76 PRECODE · Reapertura económica exige reciprocidad de payloads duraderos, incluso 202

**20-nov-2026 Ecuador.** SE PORTA LA MISMA app `jfcarpiopuntocom/friendly-123` de arquitectura 1.0 a2.0 ensamblando injertos maduros; Sync3 YA pertenece a2.0 y se conserva. Workshop es SOLO laboratorio/QA y registro persistente, no app diferente. Último master fuente real `e428ba67fdfea4636b70b4c858ac8511c65f1a3c`, puntuaciones oficiales independientes con decimales/100: **transición92,0/100,0; calidad79,6/100,0**. GO comercial0/6; físico PC Opera↔Safari/PWA iPhone0/5; flags QA OFF. 8,0 puntos reales de transición pendientes (Firebase HEAD económico real2,0, R2 Service Binding real2,0, operacional/roles/fotos/aceptación física4,0).

## Lectura previa de fuente + Notion

[Bitácora Notion](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94) y MDD aprobada releídas. [C72](https://github.com/jfcarpiopuntocom/friendly-123/pull/872), [C74](https://github.com/jfcarpiopuntocom/friendly-123/pull/875) están fusionados. `cloudflare-yparty-worker/src/typed-commercial-ledger.mjs` usa YA la transacción única SQLite para escribir **dos filas por cada intento** `typed_commercial_ops` (recibo 202 o 200) y `typed_commercial_payloads` (payload canonical). Una fila es recuperable solo si ambas existen; ACK no es saldo si stage202.

`src/authoritative-business-sql.mjs::verifyTypedBusinessEffects`, al reabrir certificado existente, comprueba que cada receipt tenga payload + SHA, que receipt 200 tenga efecto, y que cada efecto tenga receipt 200, **pero no recorre la inversa payload→receipt**: al leer `saved` hace `new Map`, después itera SOLO `receipts`. Un payload huérfano (especialmente venta 202 que perdió receipt después del corte) puede sobrevivir y el negocio responde `already:true`, ocultando obligación de recuperar/diagnosticar esa operación. C74 sí impide bootstrap original sobre tabla `typed_commercial_payloads` ya ocupada pero NO cierra la reentrada `if(old)`, causa distinta y complementaria.

## Matriz TDD RED antes de runtime, código VERDADERO

Archivo NUEVO `cloudflare-yparty-worker/qa/p0-c76-orphan-typed-payload-reopen.test.mjs` sobre fuentes REALES `prepareBusinessBaseline/installBusinessBaseline/createBusinessSqlExecutor/createTypedCommercialLedger` + `DatabaseSync` Node22 nativo, valores solo sintéticos, sin Firebase/R2/cliente. Controles:
1. baseline vacío, reentrada certified `already:true`; receipts 200 de venta2×1999 + abono1000 + recuento5 permiten reabrir y duplicado opId sin efectos adicionales;
2. receipt legítimo `stage:'stored-for-application'` 202 y su payload, SIN efecto, se conserva y reentrada responde `already:true` sin inventar dinero;
3. payload ajeno de OTRA licencia no altera reentrada de licencia certificada.

RED reales esperados (antes de modificar fuente):
4. tras negocio certificado (con venta200 existente), insertar un payload `sale.record` sintético con opId no registrado en `typed_commercial_ops`, reabrir **debe rechazar**; conservar fila en DB y no fabricar receipt;
5. después de un 202 legítimo con payload sin efecto, borrar SOLO su recibo `typed_commercial_ops`, reabrir **debe rechazar** aun sin movimiento económico, conservando payload y sin false business ACK.
6. tras business baseline certificado sin operaciones, insertar payload suelto válido, reabrir debe rechazar aunque no haya `effects`.
Un `Missing expected exception` demuestra falso ACK real; errores de parseo/setup NO cuentan.

## GREEN Ponytail mínimo

Modificar SOLO `cloudflare-yparty-worker/src/authoritative-business-sql.mjs` en `verifyTypedBusinessEffects` durante **read-only SQL transactionSync** de `installBusinessBaseline::if(old)`: construir `receiptById` o `Set` de IDs y exigir `saved.length===receipts.length` más ausencia de payloads sin recibo. Esta condición opera por `license` y trata 202 válido sin efecto correctamente, sin bloquear otros tenants. Mantener SÍ los existentes biyección receipt200↔effects y SHA256 `@noble/hashes`, guards C74 precio original/boot, el mismo escritor atómico de `typed-commercial-ledger.mjs`. NUNCA borrar payload huérfano, inventar ACK/efecto, reescribir saldo ni tocar hot sale, Shell, Sync3, PIN, roles, fotos, Cloudflare settings.

Workflow aislado CI C76 `qa-port2-c76-orphan-payload-readback.yml`, ejecuta C76 nativo, C74 5/5, C72 11/11, C68 8/8, real Workerd pagos/ventas, score original100. Fuente test RED→GREEN y 100% GitHub workflows en SHA final, PR merge al producto, Cloudflare Builds GET exact merge SHA SUCCESS. No tocar rutas reservadas [PR #871 Yjs](https://github.com/jfcarpiopuntocom/friendly-123/pull/871), [PR #868 fotos](https://github.com/jfcarpiopuntocom/friendly-123/pull/868), [PR #841 ledger](https://github.com/jfcarpiopuntocom/friendly-123/pull/841). PR873 cerrada no reintroducir.

## Métricas auditadas

Si y SOLO si source realmente fusionada, tests source y Workerd GREEN, Cloudflare SHA exact MERGED éxito, una PR C77 de SCORE **separada** para quality Business18,8→18,9/20 y calidad79,6→79,7/100 (+0,1 solo en calidad, no doble contabilizar C72/C74). **Transición92,0/100,0 sin mover** ya que falta certificación de HEAD Firebase real/R2/PC. GO0/6, físico0/5; presupuesto original100 fijo, comparación anterior sumar79,6. Documentar limitaciones de prueba sintética de SQL y ausencia de datos de Belén.
