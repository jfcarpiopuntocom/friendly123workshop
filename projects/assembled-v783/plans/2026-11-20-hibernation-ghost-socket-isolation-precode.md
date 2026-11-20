# PRECODE · Aislamiento por socket en `enviarLoteAutorizado` ante ghost-socket en Hibernation (`cloudflare-yparty-worker/src/index.js`)

**20-nov-2026 · Ecuador.** Para la **MISMA** `jfcarpiopuntocom/friendly-123` (PORT 1.0→2.0, Sync3 intacto).

## Riesgo real (research Cloudflare DO Hibernation + auditoría de `src/index.js:61-102`)

- En `cloudflare-yparty-worker/src/index.js:61-102`, `enviarLoteAutorizado(batch)` verifica los permisos de hasta 32 frames en paralelo y entrega cada frame en un loop síncrono (`connection.send(payload)` sin `try/catch`).
- Bajo Cloudflare WebSocket Hibernation o desconexión abrupta de Safari/iOS, un socket muerto/semi-cerrado (`readyState === 1` transitorio) puede lanzar una excepción en `send()`, `setState()` o `close()`.
- En el código actual, ese fallo sobre un único socket muerto **aborta el loop** (descartando frames válidos del mismo lote para clientes sanos) y dispara `.catch()` sobre `this.outboundQueue`, cerrando **con `1008 Salida no autorizada` a todos los demás clientes sanos y autorizados del lote**. Además, si el socket muerto vuelve a lanzar dentro de `.catch()`, el cleanup de otros sockets también se interrumpe.

## Arreglo Ponytail (cambio mínimo completo)

- Editar exclusivamente `cloudflare-yparty-worker/src/index.js` + nuevo test `qa/p0-c87-hibernation-ghost-socket-isolation.test.mjs` + nuevo workflow `.github/workflows/qa-port2-c87-hibernation-ghost-socket.yml` (0 colisión con `#885`, `#886`, `#871`, `#868`, `#841`, runtime cliente o scores; `USD 0,00`):
  - Extraer helper per-socket con aislamiento `try/catch` para `setState`/`close`.
  - Aislar `connection.send(payload)` en el loop de entrega: si un socket falla al enviar, eliminar solo ese socket de `proven` y cerrarlo limpiamente sin abortar ni revocar a los demás destinatarios válidos del mismo lote.
  - Conservar fail-closed total si falla `askAuthorityBatch` o si expira/revoca el grant individual de un cliente.
- TDD RED → GREEN + regresión completa de `p0-secure-separate-rooms.test.mjs` y `p0-real-session-room.test.mjs`.
