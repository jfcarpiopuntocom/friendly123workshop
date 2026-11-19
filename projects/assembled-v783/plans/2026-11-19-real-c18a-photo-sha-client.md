# PRECODE · PORT2 C18a · Cliente HTTP de fotos por SHA endurecido (Owner PUT/GET + Team read-only GET) + Workerd real (`USD 0,00`)

- **Fecha:** 2026-11-19
- **Gasto nuevo autorizado:** `USD 0,00` · **Cambios Cloudflare/R2:** NINGUNO (usa SQLite nativo del Durable Object existente en Miniflare/Workerd; cero R2).
- **Base:** `jfcarpiopuntocom/friendly-123` `origin/master@f5f400d`.
- **Colisión con #805 (`v0.8.06`) y #806 (Sol6 IDB store):** CERO (solo 4 archivos nuevos: `src/port2-photo-sha-client.mjs`, `test/p0-c18a-photo-sha-client.test.cjs`, `cloudflare-yparty-worker/qa/p0-c18a-photo-sha-client-workerd.test.mjs`, `.github/workflows/qa-port2-real-c18a-photo-sha-client.yml`).

## Brechas cerradas respecto al puente antiguo (`src/photo-sha-bridge.mjs`)
1. **Host pinning estricto:** `src/photo-sha-bridge.mjs` aceptaba cualquier `*.jfcarpio.workers.dev`; el nuevo cliente fija estrictamente `host === 'friendly123-yparty-port2-canary-qa.jfcarpio.workers.dev'` para impedir exfiltración de Bearer (mismo principio que Sol6 selló en C15).
2. **Timeout `AbortController` acotado y visibilidad:** impide peticiones colgadas en Safari iOS móvil (`timeoutMs` acotado `500..15000 ms`) y falla en cerrado cuando `!isVisible()` antes de pedir ticket.
3. **Single-flight por `(method, sha)`:** evita duplicar subidas o descargas concurrentes del mismo hash (ahorra tickets y ancho de banda).
4. **Lector Team (`admin`/`empleado`) de solo lectura (`createTeamPhotoShaReader`):** reutiliza `createTeamTicketParams` (`scope: 'fotos:read'`, C17a ya en `master`) y **no expone `put`**, permitiendo a empleados ver fotos de catálogo por SHA-256 sin acceso a Yjs privado ni permiso de escritura.

## Plan TDD (RED → GREEN → Workerd real)
- **RED:** `test/p0-c18a-photo-sha-client.test.cjs` falla antes de crear `src/port2-photo-sha-client.mjs`.
- **GREEN unitario:** host arbitrario rechazado, pestaña oculta rechazada con 0 red, SHA mismatch bloqueado antes de red, corrupción en respuesta GET detectada por SHA-256, single-flight por `sha`, timeout `AbortController`, y `createTeamPhotoShaReader` solo-lectura sin `put`.
- **GREEN Workerd real (`Tienda` DO SQLite):** Owner sube foto multi-chunk (> 512 KiB) → reinicio completo del DO → `empleado` descarga y verifica SHA-256 exacto → `WS_PHOTO_BLOBS_QA=0` falla en cerrado.
- **Métricas:** sin cambios en PORT (`81.5/100.0`), Calidad (`74.1/100.0`) ni GO (`0/6`) — prepara el corte `photo-sha/browser-photo-cutover` (+2.0 pts).
