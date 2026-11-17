# P0 · YParty Workerd firmado: fotos >2MiB sin pérdida, diario/snapshot en bloques (RED→GREEN)

**Fecha:** 2026-11-17 UTC. Fuente exacta `jfcarpiopuntocom/friendly-123-injertos/fix/yparty-server-authz-qa-20261117@151e5b36fb1893b3f3558031bc63b4cd5ea99173` (PR #8 DRAFT). **Rama nueva** `fix/yparty-photo-chunks-qa-20261117`, PR DRAFT hacia la anterior, nunca producción.

## Fuente y justificación técnica

- El Workerd actual guarda `documento(id=1, contenido BLOB)` en onSave y cada evento como `diario(n,cambio BLOB)`; no divide en bloques. El límite por valor de SQLite DO puede impedir fotos Yjs cuyo UPDATE serializado supera 2MiB, o puede impedir compactar el snapshot. Ante error de diario, la rama actual correctamente aborta sala; eso evita falso ACK pero la venta/foto puede quedar sólo local. **No asumir un fallo antes de reproducirlo**.
- La fuente histórica dentro del mismo repo privado `injertos/yparty-worker/src/index.js@b93c43a8072d7058200712e9da7d349098441a86` implementa bloques `BLOQUE_BYTES=512*1024`, tablas `documento_bloques` y `diario_bloques`, journal insert y rollback transaccional, compactación de snapshot con `transactionSync` y reconstrucción ordenada al despertar. Reutilizar el algoritmo **selectivamente**, NO copiar su seguridad antigua ni habilitarlo en producción.
- [PR#8 Workerd real 11/11 PASS ×2](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44019709851): HMAC, nonce de uso único, scopes Owner/empleado, salas cat/ops/priv/fotos, SHA `estado-durable`, 2.000 opId en 20 lotes, foto 64 KiB. No certifica fotogramas de >2MiB.
- [MDD aprobada](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac): no reemplazar libro causal/autoridad comercial, no perder datos, no publicar sin pruebas físicas. [P2 WCAG](https://app.notion.com/p/41b1642b67f381c381efdf41e372238c) sigue separado.

## Archivos autorizados SOLO en la rama nueva

- `injertos/yparty-worker/src/index.js` (journal y snapshot chunking; mantener exactamente guards de auth; no modificar `server-capability.mjs`).
- `injertos/yparty-worker/qa/p0-signed-large-photo-chunks.test.mjs` (RED real en Workerd, fake owner/employee, clave HMAC pública **solo fixture**, 2+MiB de bytes sintéticos, server stop/restart y readback SHA).
- `.github/workflows/qa-yparty-signed-photo-chunks.yml` (CI Node22, Workerd local, chmod sin Cloudflare; cero upload-artifact por cuota agotada; TAP en logs).
- Plan/workshop + Notion actualizados en cada fase. No tocar PR #5/#6/#7/#8, app, client, PIN real, Worker desplegado, SW ni producción.

## Fases

1. Guardar plan en workshop y reserva en Notion **antes de código**.
2. Rama derivada de SHA `151e5b36fb1893b3f3558031bc63b4cd5ea99173`, test real que crea Owner firmado `-fotos` y empleado solo lectura; publica contenido sintético JPEG BASE64 de >2MiB, verifica SHA-256 de **bytes originales** cuando llega al segundo YDoc, exige `estado-durable` de estado completo tras `ctx.storage.sync()`, luego cierra Worker totalmente, arranca con misma persistencia y B nuevo firmado verifica byte-hash. Debe fallar por tamaño/diario/snapshot o timeout en source original; clasificar causa exacta sin debilitar test. También debe probar que empleado no puede alterar foto. No recibir fotografías privadas de clientes.
3. Si RED confirmada, portar solo esquema `documento_bloques` + `diario_bloques` con chunks ≤512KiB, transacciones SQL atómicas, preservar migración de `documento` legacy, abort si falla cualquier chunk, nunca ACK de RAM sin storage sync, limpieza de journal+snapshot en una misma transaction. Límite y revalidar integridad/orden; no crear dos escritores comerciales.
4. GREEN focal sobre HEAD exacto y rerun 11/11 de auth previo en el mismo SHA. Probar precio empleado denegado, firma/clon/replay, ops sale/coldjoin intactos y foto grande tras reinicio. Regresar ROJO si hay error y registrar. Abrir PR DRAFT sin merge/deploy.
5. Aun verde, **no** equivale a entrega de foto real por cliente, comprobante privado, opId ACK económico ni autoridad Owner/Team real. El plugin client actual no pide tickets, requiere integración futura. El almacenamiento puede tener límites de DO totales y costo; no subir a clientes sin medición y pilotaje A→B→A.

## Stop/rollback

Branch reproducible con SHAs y links en `projects/assembled-v783/STATUS.md` y este plan. No secretos reales, no publicaciones, no actualizar manifest de release. Si red de CI falla por cuota artifacts, eliminar sólo subida sin cambiar tests (ya aprendido PR7). Si se reproduce dato inválido de source, no silenciar. No fusionar la rama sin seguridad+durabilidad completas.
## RED reproducido con archivo original sin modificaciones

[GitHub Actions 44020392859](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44020392859), PR privada #9 HEAD `4b2a499674f61fba3116c9b80f99a603f1330d59` con **SOLO test y workflow**, todavía sin cambiar el Worker:
- Job `large-photo-coldjoin` **1 test / 0 PASS / 1 FAIL / 0 SKIP**. Log real Workerd `Uncaught Error: YParty could not durably journal a Yjs update` al insertar 2MiB+ y luego test falla `Timeout: server delivery of >2MiB public photo`. Esto confirma fallo del diario SQLite (en esta configuración), no solamente una demora de red; no imprime dato cliente.
- Job `signed-auth-regression` **11/11 PASS, 0 FAIL/SKIP/CANCEL** en el mismo HEAD, lo que demuestra baseline intacta antes del injerto.
- La fotografía es enteramente ficticia: `Buffer.alloc(2*1024*1024+32768,0x5A)` con cabeceras JPEG de ejemplo, serializada en base64; SHA256 de bytes reales. Ninguna imagen real ni clave comercial.
- **Solo ahora** portar esquema SQL `documento_bloques` y `diario_bloques` desde b93; preservar `ws_consumed_nonce`, `onConnect`, `isReadOnly`, `currentConnection`, `onMessage`, `onCustomMessage`, `revisionEstado` de PR8/7; usar SQL transacciones atómicas y rollback. Repetir Workerd large photo + 11 auth en mismo SHA. Si el worker sigue fallando, registrar causa en vez de relajar la prueba.
