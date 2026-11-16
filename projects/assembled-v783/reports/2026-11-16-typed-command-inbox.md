# v783 · Inbox durable para comandos comerciales tipados (16 nov 2026)

## Qué añade y qué NO hace

Archivo **único**: `relay/injertos/yparty-worker/src/typed-commercial-ledger.mjs` en la candidata central `projects/assembled-v783/`.

**Sí:** primitivo servidor sobre la interfaz SQLite Durable Object existente (no otro proveedor ni otra base), con `transactionSync`, escritura atómica de `(license, opId, payloadHash, receipt)`, clasificación tipada de comandos, autorización de servidor por cada intento —incluyendo reintentos—, resistencia a reenvío, choque de `opId` → 409 y comprobación de bytes/carga solo sintéticos.

**No:** NO es el ledger contable comercial, NO sincroniza stock, dinero, facturas ni fotos, NO constituye un ACK de venta, NO abre el canal `ops`, NO añade endpoints, NO está enlazado a `mock-backend.js`, NO activa privilegios para otros roles ni cambia nada en `friendly-123` público o `docs/` de producción. Su recibo lleva literalmente `stage:'stored-for-application'`, nunca `saleCommitted`.

## Contrato programático

`createTypedCommercialLedger({sql,transactionSync,authorize,clock})` solo debe invocarse desde un contexto **de servidor** que provea la función `authorize` conectada al emisor REAL con vigencia y alcance por persona/rol/licencia. Nunca pasar al módulo `verifiedByBackend:true` desde cliente, ni confiar en `OCAuth.rolActual()`. Rechaza inputs con PIN/contacto/rol/flags extra.

`submit({ticket,command})`:
- `sale.record`: `opId,license,productId,quantity,amountCents` y scope `ops:sale`.
- `expense.record`: `opId,license,categoryId,amountCents` y scope `ops:expense`.
- `credit.payment.record`: `opId,license,receivableId,amountCents` y scope `ops:payment`.
- Todos los montos son **enteros seguros en centavos**, sin decimales binarios ni conversiones de proveedor implícitas. Se calcula SHA-256 de payload canónico; el recibo no contiene monto, cliente, producto, credenciales ni PIN.
- Primer intento autorizado: `200`, `duplicate:false`, `receipt.stage='stored-for-application'` tras commit síncrono.
- Reintento idéntico y autorizado: mismo recibo, `duplicate:true`, cero escrituras nuevas.
- Mismo `opId` distinto contenido: `409 operation-conflict`, sin sobrescribir.
- Operación incorrecta: `400 invalid-command`. Sin autorización: `403 not-authorized`. Autoridad ausente o almacenamiento fallido: `503` **sin falso ACK**.

## Evidencia verificable, con fallos RED conservados

- [Primera suite RED, 14/15 fallos](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43885523170) con stub permisivo.
- [GREEN de contrato, 15/15](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43885714471).
- Primer test Workerd real fue RED de arnés: el binding se llamó `SyntheticCommands` pero el Worker fixture requería `env.COMMANDS`. No inferir bug de aplicación de esa excepción. Corregido **solo** el fixture, sin modificar el código comercial ni el módulo durable.
- [GREEN Workerd SQLite + contrato, 1/1 + 15/15](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43886426473): misma operación tras reabrir storage DO, duplicación sin segunda inserción, conflicto 409, permiso denegado 403, recibo byte-a-byte igual.

El test usa una autoridad estrictamente sintética encerrada en `qa/fixtures/typed-ledger-worker.mjs`. **No desplegar ni copiar esa fixture a Worker productivo**. No hay secretos ni identidades de clientes.

## Integración final pendiente, para Codex/Claude/Fable/Sol

1. El backend debe proporcionar issuer real por **identidad humana y rol**. El actual `ws-authorized-subject.mjs` declara solo `Owner-account` y roles adicionales desconfigurados; sin ese trabajo la autorización general de negocio permanece cerrada.
2. El ejecutor de comandos debe consumir la fila duradera dentro del proceso de negocio con otro identificador de aplicación que garantice stock, crédito y dinero exactamente una vez. **El recibo del inbox NO sustituye ACK del negocio.** No volver a emitir una operación distinta por timeout de red; repetir el mismo `opId`.
3. El commit de la venta debe tener prueba de lectura posterior, relaciones stock físico/pedido/pago separadas, compensaciones y soporte de reversos; las operaciones no deben vivir en Yjs compartido sin permisos.
4. Probar timeout y revocación **entre** la verificación remota y la transacción. Este contrato local todavía NO demuestra revocación atómica cross-DO/cross-POP.
5. Proteger canales `cat`, `ops`, `priv`, `fotos` por frontera y permisos. El Worker actual mantiene `cat/ops/fotos` fail-closed: **no los habilitar sin proyección segura**.
6. Ensayar exportación/rescate IDB, ACK de fotos con SHA/readback, operaciones con la misma licencia entre perfiles, reintentos 403, A→B→A físico en Opera/Safari iOS; dos rondas. No publicar antes.

**Clasificación:** componente primitivo validado para integrar posteriormente, **NO-GO de producto/producción**. No usar este PR para cambiar el estado comercial en Notion a «instalado y operativo». Ningún archivo original de Codex se sobrescribió; la PR es aditiva.
