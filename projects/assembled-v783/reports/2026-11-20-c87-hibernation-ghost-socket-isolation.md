# C87 · Aislamiento per-socket en `enviarLoteAutorizado` ante ghost-socket en Hibernation (`USD 0,00`, cero colisión)

- **Branch:** `port2/20261120-c87-hibernation-ghost-socket-isolation` (sobre `master@65d7a90`, cero colisión con `#886`, `#885`, `#871`, `#868`, `#841`, runtime cliente, shell ni scores).
- **Causa raíz (auditoría tras research Cloudflare WebSocket Hibernation):** en `cloudflare-yparty-worker/src/index.js:61-101`, `enviarLoteAutorizado(batch)` ejecutaba `connection.setState` / `connection.close` / `connection.send(payload)` sin aislamiento por socket. Si un único cliente semi-cerrado lanzaba excepción al enviar o cerrar, abortaba el loop para los demás destinatarios sanos del lote y disparaba `.catch()` sobre `this.outboundQueue`, cerrando con `1008 Salida no autorizada` a **todos** los clientes sanos y autorizados del mismo lote.
- **Arreglo Ponytail en `cloudflare-yparty-worker/src/index.js`:**
  - Helper `cerrarConexionSegura(connection, code, reason)` con aislamiento `try/catch` en `setState` y `close`.
  - Aislamiento por socket al enviar `connection.send(payload)`: si un socket falla, se elimina solo ese socket de `proven` y se cierra sin abortar ni desautorizar a los demás destinatarios válidos.
  - Si falla la autoridad central (`askAuthorityBatch`), `.catch()` revoca y cierra todos los sockets activos del lote de manera aislada.
- **Verificación TDD RED → GREEN:**
  - RED (`index.js` intacto): `0/2 PASS, 2/2 FAIL` (`broken hibernation socket` y `close on faulted socket failed`).
  - GREEN: `p0-c87` + `p0-secure-separate-rooms` + `p0-real-session-room` + `p0-gate-d-real-onstart-workerd` + `p0-architecture-2-port-score.test.cjs` en validación.
