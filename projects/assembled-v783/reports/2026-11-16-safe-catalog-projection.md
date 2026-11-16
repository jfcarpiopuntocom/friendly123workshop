# Catálogo Yjs seguro: proyección independiente, no permisos implícitos

**16 de noviembre 2026 · friendly123workshop · complemento de la candidata assembled-v783**

## Por qué se necesita

El Y.Doc legado de `docs/sync-yjs.js` agrupa al menos `productos`, `ubicaciones`, `usuarios`, `clientes`, `ventas`, `gastos`, `promotoras`, `transferencias` y metadatos `_meta.pinsRol`. Dar lectura de ese documento bruto a un empleado implicaría divulgar contactos, PINs, costes y dinero. El Worker actual acierta al mantener `cat/ops/fotos` cerrados para roles no autorizados.

Esta PR NO abre `cat`. Añade solamente el **materializador independiente** `relay/injertos/yparty-worker/src/catalog-safe-projection.mjs` que usa `Y.Doc` y `Y.encodeStateAsUpdate` de la librería Yjs **ya importada**. No fabrica otro CRDT, no actualiza el Y.Doc original, ni añade una nueva dependencia. Su objetivo es que una futura sala read-only tenga un estado distinto, creado por allowlist, en lugar de recibir la actualización binaria completa del propietario.

## Frontera de datos

- Origen privado: **solo lectura** mediante `sourceDoc.share.get`; no `sourceDoc.getMap` (evita crear roots privados ausentes).
- Destino: **nuevo Y.Doc** que contiene EXCLUSIVAMENTE `productos` y `ubicaciones`.
- Producto expone `id`, `nombre`, `sku`, `barcode`, `categoria`, `ubicacionId`, `precio` y `stockActual`. Precio es **visualización**, nunca autorización de caja/recibo.
- Percha expone `id`, `nombre`, `tipo`, `activa`.
- Nunca copia campos extra como `costo`, `stockPN`, `comisionSocio`, `clienteTelefono`, `proveedor`, `foto`, `promotorPIN`, `usuarios`, `clientes`, `ventas` ni `_meta`.
- IDs tienen formato restringido, textos limitados sin controles, precios y existencias finitos/tipados, máximo 10.000 productos; errores provocan rechazo, **no** estado parcial presentado como completo.
- Al cambiar el documento privado, la copia pública anterior **NO recibe el cambio automáticamente**; un proceso de servidor tendrá que generar/publicar un nuevo snapshot con revisión propia. Eso evita enlaces o referencias compartidas inadvertidos.

## Pruebas RED→GREEN

- [RED 0/11](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43887517746): stub inseguro que devolvía el Y.Doc privado.
- [GREEN 11/11](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43887709851) en Node22 con el **Yjs importado y lockfile existente**: secreto sintético en PIN, costo, comisiones, contactos, ventas, foto base64 y notas; 0 cadenas secretas en el update Yjs transferible y replica que aplica esos bytes. Origen byte-idéntico y original intacto.
- Tests también cubren datos inválidos, claves patológicas, límite de 10.000 y desconexión entre actualizaciones privadas y snapshot público.

## Lo que NO se puede proclamar todavía

1. **Proyección no es autorización.** Se necesita equipo/verificación humana server-side, aislamiento de salas y cierre de broadcasts/awareness a usuarios no autorizados.
2. El Y.Doc de salida de Yjs es técnicamente editable; antes de habilitar un canal de empleado, su servidor debe **rechazar TODOS los mensajes entrantes con mutación**, y comprobar que no se persiste siquiera un cambio malicioso.
3. Si una persona escribe datos sensibles **en el nombre del producto o de la percha**, un allowlist sintáctico no elimina PII por significado. Necesitamos política de negocio y revisión humana de campos visibles a roles.
4. No se computa stock a partir de eventos, no se envía `ops` ni se deduce precio contable; el módulo no sustituye el Ledger tipado [PR #25](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/25), cuya confirmación es solo `stored-for-application`.
5. Falta el mecanismo de creación de snapshots incremental, revisión y reconexión con pérdida cero, prueba real del Worker/Workerd con admin/employee, permisos de solo lectura por rol y aceptación física PC↔Safari/Opera A→B→A. **NO-GO comercial** hasta todo ello.

**Condición de integración:** solo generar y servir esta proyección tras resolver una sesión real autorizada; nunca generar un `cat` de empleados reenviando `Y.encodeStateAsUpdate(privateDoc)`. Ninguna sala de servidor o datos productivos se cambian en esta PR.
