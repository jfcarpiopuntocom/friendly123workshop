# 2026-11-18 · v801 · Belén · CAS de puntero foto de percha (RED FIRST)

## Base y dueño de archivo
- Master/estable exacto `2ee8c1337771f42506cea70a3f98db96cab226e6` (PR #776 v0.8.00 fusionada).
- Rama `fix/p0-belen-photo-pointer-cas-v801-20261118`. Un solo owner para `docs/mock-backend.js` + test focal `test/p0-belen-shelf-photo-pointer-cas.test.cjs`. No editar la PR #776 ni foto bytes/stock/dinero/sync.
- Fuente primaria: acta idiomARTE 15/oct sobre factura de gastos (otro problema); incidencia foto de percha H2 posterior. Evitar mezclar ambos.

## Causa reproducible
La ruta PUT `/api/ubicaciones/:id` modifica `fotoHash` y `fotoRev` sin condición; tras ACK perdido, un escritor viejo puede reemplazar la foto más nueva. H2 v800 solo cierra ACK fantasma, no realiza CAS remoto.

## Test RED exacto
1. Percha sin foto: PATCH/PUT inicial con hash A y rev real.
2. Escritura B con `expectedFotoHash:null,expectedFotoRev:null` (stale): HTTP 409; A y rev permanecen, cero aviso/evento de éxito.
3. Escritura B con expected A+rev A: HTTP 200; hash B y fotoRev renovada.
4. Otra escritura C con expected A+rev A: HTTP 409; B no sobrescrita.
5. PUT legacy sin expected conserva comportamiento (compatibilidad). No usar datos de cliente.
6. Validar coste de cuota y ACK durable antes de habilitar reintentos automáticos; si la ruta retorna 200 sin commit durable, NO anunciar solución completa.

## Parche permitido
Agregar el guard *antes de la primera mutación* en el PUT de percha, con semántica strict para hash y par exacto {c,d} para rev, solo cuando expected* existe explícitamente. No aceptar mismatch por timestamp ni inferir borrados. Rechazo 409 fail-closed; no tocar ventas, stock ni foto bytes.

## Gates y límites
Node fuente real RED→GREEN; regresiones H2, original Photo, stock/venta, roles, CI y canonical manifest sobre SHA final. Toda publicación solo tras release-control, hotfix, native Chromium/WebKit y Workers Builds. El paso posterior **idb intent + same-shop + readback** es independiente y NO se habilita sin el mismo contrato 409. Invariantes: negocio/licencia único, no borrado, no doble publicación, no YParty 2.0, sin UAT físico certificado.
