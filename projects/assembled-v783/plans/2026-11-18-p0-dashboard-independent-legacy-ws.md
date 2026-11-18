# P0 dashboard v788: PIN y fotografía independientes del socket legacy · 2026-11-18

> Superpowers: systematic-debugging → TDD RED/GREEN → verification-before-completion. Ponytail: cambio mínimo completo, una causa. Servicio comercial: conservar rollback /previo/ y pruebas de publicación.

**Goal:** El dashboard efímero cifrado debe obtener PIN Owner/Admin y snapshot cuando el enlace antiguo todavía está CONNECTING o caído, siempre que el canal efímero pertenezca al mismo cuaderno y esté SUBSCRIBED.

**Source:** `jfcarpiopuntocom/friendly-123@4f1551717b9722d7c501566e43b60e41cb99f81c`; `docs/sync-realtime.js`. PR #761 creó `_dashboardBroadcast` pero `responderPin` (alrededor de L1020) y `responderFoto` (alrededor de L964) hacen `if (!ws || ws.readyState !== WebSocket.OPEN) return`, incluso para `op.__dashboardBroadcast===true`. Un transporte nuevo no independiente puede fallar cuando falla el viejo. El test `qa/p0-dashboard-broadcast-browser.test.cjs` simula manualmente las respuestas Owner y foto, no ejecuta `responderPin/responderFoto` del runtime.

**Extra evidence:** GitHub Actions postrelease #44359796502: despliegue + Chromium/WebKit de interfaz SUCCESS; `recorrido/union-fria` FAIL (101s, 4202 frames, 9 padres faltantes). Usuario: pestaña abierta leída via Browser 18 nov 12:xx Ecuador sigue en Dashboard v0.7.82 y `No device on your team answered`, abierta antes de la promoción; necesita nueva carga de v788 y app iPhone actualizada. No publicar licencia ni PIN de esa pestaña.

**Invariants:** no rebajar verificación real `OCSecure.verificarOwnerOEmpleado`, rol Admin ni fotoToken; no nuevos datos en Supabase DB; no modificar ventas/ledger/Yjs/Service Worker salvo release coordinada. Ruta legacy sigue funcionando solo cuando su socket está OPEN. Ningún cambio a producción sin RED → GREEN, suites de seguridad, verificación del shell/manifest y navegador real.

## Task 1 · Aislar respuesta de PIN por canal
- [ ] Test RED en `test/p0-dashboard-broadcast-contract.test.cjs`: ejecutar función real `responderPin(op)` con `ws.readyState=CONNECTING`, `_dashboardBroadcast.readyState=OPEN`, pin Owner válido; assert respuesta cifrada emitida y token. Test inverso: bridge cerrado no responde. Mantener prohibición de PIN incorrecto.
- [ ] Ejecutar test focal sobre commit de test puro y guardar ID de CI que falla.
- [ ] Modificar exclusivamente guard en `docs/sync-realtime.js` usando transporte efectivo de la petición; comprobar PIN existente y expiración de token.
- [ ] Ejecutar focal y suites generales (exit codes).

## Task 2 · Snapshot por canal
- [ ] Test RED ejecutando `responderFoto` real con socket legacy CONNECTING + bridge OPEN + token autorizado y varias tablas, exigir fragmentos completos. Con bridge cerrado o token incorrecto, 0 fragmentos.
- [ ] Corregir guards de inicio, tras jitter y durante bucle de fragmentos; usar `pedido.__dashboardBroadcast` y bridge por fuente, sin aceptar una sesión vieja.
- [ ] Verificar fragmentación y respuesta sin usar socket legacy.

## Task 3 · Publicación y aceptación
- [ ] Auditar diff con defensa por licencia/sala/generación.
- [ ] Pasar QA focal, WebKit/Chromium, cifrado, PIN inválido, continuidad, manifest, integridad SW.
- [ ] Fusionar solo con gates verdes sobre SHA exacto; promover a estable + Pages y comprobar GET 200 sello/JS en producción.
- [ ] Registrar en workshop y Notion pruebas, rollback y límites. Aceptación real requiere código+PIN del propio dispositivo y cuadrar ventas/stock/fotos; no copiar credenciales de clientes a tests.
- [ ] Aislar P0 Yjs unión fría en investigación independiente; jamás llamar 100% mientras siga rojo.

**Test names/exit criteria:** `node --test test/p0-dashboard-broadcast-contract.test.cjs` (debe fallar en baseline con dos nuevos casos; pasar tras fix), `node --check docs/sync-realtime.js`, `bash check-sw.sh` y gate CI de publicación. El resultado `recorrido/union-fria` se reporta separado aunque otros grupos pasen.
