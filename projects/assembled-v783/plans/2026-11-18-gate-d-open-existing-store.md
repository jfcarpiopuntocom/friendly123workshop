# Gate D · el servidor nuevo abre la tienda existente y sigue hacia adelante, con failback (QA, no deploy)

Base workshop/main@`286fa5acf16b4b7959b8b42310d1f43ef01bb264`, 18 nov 2026.

## Aclaración vinculante de JFC
«No hay nada que migrar, los datos siguen ahí y con que el backend ya sirva bien, todo sigue HACIA ADELANTE.»
Gate D = el Durable Object (y-partyserver `Tienda`) abre la tienda existente tal como está —su historial Yjs actual de Firebase, anclado por SHA y sin padres pendientes— y sigue hacia adelante. Si algo falla, la tienda sigue en el camino actual (Firebase) sin perder ni duplicar nada. Nada de copiar, convertir ni transformar datos: el DO sirve el mismo estado Yjs.

## Código aislado
- Nuevo `relay/injertos/yparty-worker/src/open-existing-store.mjs`: `openExistingStore` (bandera `WS_OPEN_EXISTING_QA`, OFF por defecto) reutiliza `prepareFrozenImport`/`installFrozenImport`; cualquier rechazo deja el SQL intacto y devuelve `failback`. `failbackUpdate` reutiliza `exportCompleteYpartyYjs` y entrega solo lo que le falta al camino actual (diff por state vector).
- Fixture QA `qa/fixtures/gate-d-open-existing-worker.mjs`: subclase de la `Tienda` real, sin tocar `src/index.js` (reservado para la puerta A).
- Test `qa/p0-gate-d-open-existing-workerd.test.mjs` + workflow `qa-v783-gate-d-open-existing.yml`.
- Cableado futuro, NO hecho aquí: en `src/index.js`, `Tienda.onStart`, justo antes de la línea 341 `await super.onStart();` → `await openExistingStore({env:this.env,storage:this.ctx.storage,source})`. La fuente real (historial Firebase congelado y sus hashes independientes) queda fuera de este PR.

## Pruebas (Workerd/Miniflare reales, historial SINTÉTICO con forma real)
1. Historial de dos escritores en orden de páginas Firebase (hijo antes que padre, con borrado): el DO lo abre con SHA y vector idénticos, cero pendientes; un cliente y-partyserver firmado lo recibe igual, escribe hacia adelante, otro cliente lo ve; reinicio frío: unión fría con historia + avance; reapertura es no-op (no duplica ni borra diario); failback entrega solo el avance y aplicarlo dos veces no duplica.
2. Historial con un padre faltante: rechazo, SQL vacío, failback al camino actual con su estado intacto.
3. Bandera OFF: no abre nada.

## No acreditar
Etapas `frozen-real-head-zero-pending`, `firebase-restore-transport` y `real-shop-single-cutover` exigen historial real, transporte cifrado real y una tienda real: este PR no las cumple; el marcador no cambia.
