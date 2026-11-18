# Clase A 01 Opus 5.5 · LIVE outbox IndexedDB abort/retry/orphan

Fecha 2026-11-17 (Ecuador), plan escrito ANTES de editar cualquier código LIVE.

Workshop main@d9b9e122c716e1092b08db5d82ffe27862d5254e. LIVE master@45757cac5d9268402049c0fba90cccdece150ac6. docs/sync-outbox.js blob 76653372b1a5ee3cee29a6e959a6df2776f836e0.

Fuentes: https://app.notion.com/p/41b1642b67f381fbab5cf45ac55aabd3 ; https://app.notion.com/p/41c1642b67f381fe898ee37fca461d61 ; https://app.notion.com/p/41c1642b67f3814f96bbd5383ed3449d.

Reserva Codex docs/sync-outbox.js en Notion figura En curso pero venció el 17 Nov 04:00Z. No tocar su rama ni sus archivos extras: rama independiente creada desde master. Revalidar su futuro trabajo antes de integrar.

OBJETIVO: clase A #69/#70/#71, sin diseño ni UI/UX ni PIN, ni nuevos banners, ni cambiar datos ni base f123_outbox / store cola / f123_sync_pending.

1) Plan en workshop primero. Crear LIVE rama hotfix/20261117-live-outbox-class-a desde master congelado. Copiar literalmente tests de workshop app/test/p0-sync-outbox-idb-abort-failback.test.cjs y app/test/p0-sync-outbox-idb-open-retry.test.cjs, sumar test Opus close tras onblocked seguido por onsuccess. Workflow QA 7 tests, TAP SHA artifact no deploy.

2) RED: en source LIVE original, abort no-settle (1/3), retry failed promise (0/3), orfandad DB (0/1). 3) Cambio Ponytail SOLO docs/sync-outbox.js, implementación byte por byte alineada con workshop blob 1c1b80310127484bdcb64662390517b1c38652c6. 4) GREEN 7/7 + smoke vecinos y test de release.

5) Version-manifest y shell: NUNCA hash manual. Solo script oficial node scripts/gen-manifest.js y release/version/cacheGeneration según scripts oficiales. Sin nuevo shell o release sellado, CI global puede quedar RED, no merge.

6) PR LIVE siempre DRAFT. Las cinco compuertas del último Opus: SHA exacto full CI, SHA servido, RED→GREEN, iPhone real con licencia QA, va específico de JFC. No se publica ni fusiona sin VA.

7) Notion y workshop persistidos; rollback: revert del único cambio sin migración de esquema, filas IDB/LS legibles. Calidad 67.0, port 41.0, 0/6 GO sin puntos por hotfix legacy.

Reglas: fallo IDB abort -> fallback cifrado LS si se escribió. Ambos fallan -> false sin borrar cola; abrir DB reintenta error/bloqueo/excepción; onsuccess tardío después de blocked cierra conexión; no promesas eternas ni falso ACK.