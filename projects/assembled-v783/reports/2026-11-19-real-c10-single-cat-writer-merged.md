# APP REAL · PORT 2.0 C10 · único escritor público Workerd · MERGED (2026-11-19)

## Hechos inmutables verificados
- Destino de código: `jfcarpiopuntocom/friendly-123`, [PR #790](https://github.com/jfcarpiopuntocom/friendly-123/pull/790) **MERGED**, candidato exacto `cd2b6b64950aa6839cae8ff00b7dd22c88b07882`, merge `7444246379706a50ba58673c6d9b359acea35820`. Se verificó el HEAD de `master` igual al SHA de merge.
- [Plan PRECODE C10](../plans/2026-11-19-real-c10-single-cat-writer-precode.md) comprometido ANTES del cambio de producto; plan en workshop, injerto solo en producto.
- [RED verdadera #44531929964](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44531929964) en `a88644b56fee575f56942838a7e2ac2ca4b3951b`: dos Owners con tickets independientes `cat:write` admitidos simultáneamente; respuesta esperada 1008, medida `open`. La suite sintética compartida acumuló un 429 posterior al añadir un escenario.
- [GREEN C10 #44534842144](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44534842144): **15/15 Workerd/issuer/SQL/Yjs**, cero fallos/omisiones; y [GREEN confirmación SHA final #44534187741](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44534187741) 15/15 en grupos de presupuesto, anterior al ajuste final del harness. La primera URL sobre el SHA final es la evidencia preferente.
- El workflow global **P0 PORT 2.0 behind per-store switch (OFF)** comprobó `app` y `yparty-worker`, tras mover C10 AL FINAL de la suite para evitar consumir los 32 tickets/min del fixture antes del test Team. La **suite worker total 211/211 PASS** debe citarse solo contra el run final del candidato; no se cambiaron límites de tickets. Todos los checks del SHA candidato fueron verificados `completed/success` antes de merge.

## Cambio Ponytail
- En `cloudflare-yparty-worker/src/index.js`, `Tienda.onConnect` para `-cat` comprueba el ticket Owner vigente y si hay otra conexión `cat:write` autorizada y con `readyState===1`; deniega la nueva conexión antes de entregar Yjs al proveedor. El estado viene de sockets vivos y sobrevive hibernación, no de una variable del proceso.
- En `cloudflare-yparty-worker/qa/p0-secure-separate-rooms.test.mjs`, C10 envía un UPDATE Yjs **válido** de segundo escritor. Confirma **0 frames devueltos y 0 actualización publicada** al Owner/lector originales; tras la salida de A, otro Owner entra con ticket nuevo y su actualización llega al lector.
- `.github/workflows/qa-port2-real-c10-single-writer.yml` ejecuta los **15 tests reales Workerd** sin filtros, un proceso, sobre código final.
- `src/yparty-piloto.js` y `docs/sync-yjs.js` permanecen reservados/no editados; Sync3 intacto. Shell y switches sin modificar, sin despliegue específico del Worker de QA.

## Riesgo confirmado pendiente de aceptación del navegador
En Miniflare, el intento `conexion.close(1008)` cambia `readyState` del socket server a `CLOSING` (2), pero el cliente puede no recibir un evento close durante el timeout; el segundo WebSocket se abrió a nivel de handshake. La prueba verde acredita el aislamiento en el **plano de datos** (ningún frame Yjs recibido ni aplicado), no una recepción fiable de 1008/fin del socket en el cliente. Probar cierre de red y reintentos del cliente al activar un canario; no confundir protección del plano de datos con handshake totalmente cerrado.

## PORT realmente sustituido
Este injerto añade una precondición segura al servidor 2.0. **No mueve el porcentaje de camino 1.0 sustituido**, porque el cliente piloto todavía entra en el relay legacy. 0/6 gates comerciales; indicadores históricos calidad 67 y completitud operativa 61 no equivalen a 80% del camino activo.

Próximos cortes causales: (a) certificar HEAD/ancestros reales Firebase + packager R2 e instalar fuente/binding/issuer QA; (b) asignar un solo escritor canónico para el catálogo público detrás de ticket Owner; (c) **cablear C8+C9 al navegador real** sin pasar el doc privado de Sync3, con failback probado; (d) pruebas PC↔Safari A→B→A×2 antes de cualquier afirmación de GO. Las reservas Notion de los archivos fuente deben coordinarse con sus dueños.
