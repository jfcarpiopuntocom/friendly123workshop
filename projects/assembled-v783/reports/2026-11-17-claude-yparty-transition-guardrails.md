# Transición v783 → YParty · lectura crítica del relevo Claude y puertas verificables

**Fecha:** 17 noviembre 2026 (Ecuador). **Naturaleza:** revisión/plan de QA, no cambio de arquitectura ni autorización de migrar. **Responsables:** JFC decide alcance; IA ejecutoras aportan evidencia RED→GREEN. **Estado:** NO-GO comercial.

## 1. Fuentes y verdad actual

- [MDD-2026-10-31 aprobada por JFC](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac): orden **#3** autoridad PIN/identidad JFC urgente, **#1** hechos de negocio y stock inmutables, **#5** forénsica y pruebas en paralelo; luego **#2** buzón duradero opaco **E2EE**; **#4** servidor económico autoritativo solo para discusión y decisión posterior.
- [Claude → Sol6, 17 nov, transición YParty](https://app.notion.com/p/41b1642b67f381819878ecf04eb44c42) con 14 trampas y plan «strangler por tienda». Contiene orientación, **no una reserva exclusiva ni permiso para implantar propuestas marcadas DECIDE JFC**. Se añadieron dos «Puntualizaciones» contrastadas con fuente real.
- Workshop final tras [PR #77](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/77) y [#78](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/78), main fusionado **71fc431065e2166b36a1b37901bb0c0fa5808f80** y después solo documentado. Producción `jfcarpiopuntocom/friendly-123/master@45757cac5d9268402049c0fba90cccdece150ac6` **sin cambios**.
- #77 [RED 44103726364](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44103726364): 0/95 históricos independientes en Yjs in-memory; [GREEN 44105412579](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44105412579): 95/95, 70/70 pruebas focales. Recuperación robusta solo si cifrados antepasados **siguen almacenados**. #78 [RED 44108936742](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44108936742): seis tests VM legacy sin variable de cierre, 12/18; [GREEN 44109952774](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44109952774): 18/18+70/70+63/63; [integrada 44109952887](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44109952887): 585/585. #78 modifica **solo tests**, `app/docs/sync-yjs.js` queda blob `b77e9cde745a5deaaeed8989b88887cdb9bccd5f`.
- Auditoría completa post #77 [44106406835](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44106406835): **3276/3237 PASS/35 FAIL/1 CANCEL/3 SKIP** frente a candidata previa 29 FAIL; seis nuevos eran tests de VM sin binding y se corrigieron sin alterar aserciones. Auditoría post #78 [44110987614](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44110987614) y browser/authority [44110987886](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44110987886) en ejecución cuando se redactó. **No inventar resultados**.
- Canario sintético remoto de producción [44012954943](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44012954943): **28 páginas, 5.348 frames, 15 padres Yjs no resueltos**; NO se sabe si esos padres están disponibles. La QA de Firebase *in-memory* no es esa sala, y un solo diff de YParty tampoco inventa historia ausente.

## 2. Fuente Workerd comprobada: no confundir infraestructura con negocio certificado

- `projects/assembled-v783/relay/injertos/yparty-worker/src/index.js` importó `ws-authority-client.js`, pero su entrada pública devuelve HTTP **503** si `WS_AUTHORITY_QA !== '1'`; en modo seguro admite `-priv` con ticket consumido antes de WS. Ese flag **no se activa a clientes** por esta revisión.
- `ws-authority-client.js` comprueba solo Owner `role=dueno`, `priv:read`, sala/instancia/epoch vía Service Binding. El prototipo no demuestra Team ni la obtención cliente de tickets por cada canal. La [PR privada #12](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/12) aún tiene bloqueo HTTP 401 en integración multiworker. No pisar su archivo reservado.
- `typed-commercial-ledger.mjs` sí implementa inbox SQL canónico idempotente con rechazo 409 de opId mutado, recibo **stored-for-application**. El `index.js` actual **NO importa ni conecta ese módulo**, ni hay recibo **business-committed** y consumidores stock/dinero certificados. La [PR privada #13](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/13) sigue ROJA (escritor `ops:sale` puede inyectar ajuste y cambiar total de opId existente). **Nunca admitir a un Team que publique bytes Yjs arbitrarios como movimientos económicos autorizados**.
- En cabecera Workerd aparece **sin E2EE** como decisión 14 nov. La MDD #2 describe buzón durable opaco E2EE. **La custodia y cifrado para datos reales no son equivalentes**: JFC debe decidir qué arquitectura/privacy contract rige antes de custodiar inventario, dinero, clientes o fotos en servidor. No hacer una migración tácita.
- Fotos chunked 512KiB, SQL SHA durability y hibernación tienen pruebas QA en privadas #7–#10, pero no equivalen a estado comercial completo, permisos de lectura ni reanudación física Safari.

## 3. Secuencia finita, trabajos independientes y contratos RED→GREEN

### A · Acceso y autorización P0 (reserva PR12 y equipo Owner)

1. Reproducir 401 con Service Binding real y un ticket sintético, diferenciar nombres de rutas, binding, firma y nonce sin registrar tokens. Asegurar que **solo uno de dos sockets simultáneos con mismo nonce** recibe upgrade. Probar revocación entre await y emisión de frame, hibernación/serializeAttachment y múltiples receptores con checkMany. **No aflojar el guard a login por identificador**.
2. Diseñar política de escritura: Owner privado `-priv`, Team económico sujeto a mensajes **tipados**; el Y.Doc económico y catálogo no aceptan sync-step2/update de Team salvo permiso explícito y validado. Fijar actor, licencia, rol y epoch en servidor. Fuente de cliente antigua no debe sincronizar sin handshake de versión. Probar rechazo servidor, no solo UI.
3. Si requiere que el DO decida/aplique movimientos de dinero/stock, **pedir aprobación explícita JFC a MDD #4**; mientras tanto, diseñar alternativa inbox `stored-for-application` + ACK de aplicación separado, sin decir exactly-once empresarial cuando solo es retención.

### B · Importación causal certificada y reversión P0 (no tocar tiendas)

1. En sala totalmente **sintética**, un importador único por tienda y un candado durable; importar dos veces no duplica structs, ventas, movimientos ni fotos. Conservar copia original, IDs, Yjs vectors, hashes de estado bytes y manifiesto. **No fijar clientID** arbitrario. Probar falla cerrada si `pendingStructs`, `pendingDs`, fragmentos, conflictos de ledger u operaciones sin ACK.
2. Certificar fuente antes de mover el flag: igualdad causal de catálogo+operaciones+dinero+fotos, opId únicos, journal y snapshot en SQL; verificación después de hibernación/reinicio DO. Un estado Yjs restaurado con diff completo solo puede reflejar lo importado: **sin padres en origen, no prometer convergencia retroactiva**.
3. Ensayar **down path real de QA** YParty→Firebase con checkpoint/cursors seguros, roundtrip de estado y ledger por opId, cero doble siembra o borrados. No rollback a Firebase de tiendas reales sin mapa de operaciones creadas durante canario y verificación de consecuencias monetarias.
4. Compresión/fotos referenciadas por SHA en R2 vs SQL son **DECIDE JFC**; nunca ampliar filas SQLite o mover fotos reales silenciosamente.

### C · Browser-first y aceptación P0/P1

1. Safari IndexedDB: cifrar y enviar red ANTES de abrir transacción; IDB txn sin await externo, manejar abort/onerror; evitar pérdida por dos pestañas (Web Locks en ventana y fallback seguro single-tab). Test Chromium+WebKit con dos contextos/Outbox por licencia y cierre/reinicio.
2. WebSocket iOS: cierre/suspensión y bfcache, reconectar visible/pageshow, timeout y fallback HTTP diff de Yjs/estado; no reportar GET/ACK como commit monetario. Una copia local sin red debe seguir trabajando y persistir cada opId antes de UI éxito.
3. Versiones: protocolo N y N-1 negociado, rechazar N-2 explícito; un solo Yjs/y-protocols por app y Worker. Pin de dependencias, tests que fallan si carga doble rompe instanceof.
4. Instrumento de aceptación: **un negocio/licencia**, Opera PC → Safari iPhone → Opera PC, ciclo **A→B→A x2** con movimientos/opId de venta, ajustes, devolución, fiado, pago parcial, gastos, fotos/hash, roles y reposición tras cierre/frío. Observar estado comercial/IDB/ACK y permisos; no solo Y.Doc.

## 4. Puertas y decisiones (no falsificar GO)

- Sin publicación comercial hasta que autoridad central/nonce/rol sea genuina, economía tipada no permita inyección, proveedor y esquema de cifrado decididos, importador+exportador reversibles y sin pérdida, full histórico sin nuevas regresiones justificadas, dos ciclos físicos aceptados y aprobación final de JFC.
- **DECIDE JFC**: MDD #4 backend económico autoritativo sí/no y dueño del commit; confidencialidad E2EE versus DO plaintext; almacenamiento externo de fotos sí/no; primera tienda real y ventana/criterios de rollback. No obtener estas decisiones por deducción o al crear una PR.
- Cola abierta por reserva/PR; un único dueño por archivo, plan+Notion antes de cambios, CI RED auténtico antes de fuente, GREEN focal+integrada+full sobre mismo SHA, regresiones históricas siempre visibles. No activar PWA.
- Nunca copiar datos/referencias personales desde el informe a repos públicos; las pruebas y esta hoja usan solo referencias de código, IDs sintéticos, SHA de commits y sumas de casos.

**Handoff vivo:** [Notion Claude + puntualizaciones](https://app.notion.com/p/41b1642b67f381819878ecf04eb44c42), [Notion PR77](https://app.notion.com/p/41b1642b67f381e2a210e5a360613b08), [Notion PR78](https://app.notion.com/p/41b1642b67f381e6925fe52529b7d364), [STATUS](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/STATUS.md).
