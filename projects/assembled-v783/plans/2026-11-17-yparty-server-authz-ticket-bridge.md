# P0 · YParty - puente de autorización server-side en Workerd local · RED→GREEN

**Fecha:** 2026-11-17 UTC; **base privada** `jfcarpiopuntocom/friendly-123-injertos/fix/yparty-durable-cert-20261117@ad171f7ca8e542405da86e257e14adfdca67230c` (PR #7 DRAFT). **Destino propuesto** `fix/yparty-server-authz-qa-20261117` nueva rama. **No producción, no deployment, no flags cliente, no personas reales.**

## Mandatos aprobados

- [MDD 2026-10-31](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac): identidad y PIN Owner/Team administrados y verificados en autoridad central; no confiar en roles reportados por navegador ni inventar un segundo motor de ventas/stock. Libro causal + idempotencia opId; transición segura.
- [Relevo completo](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902): browsers first; PWA deferred; no data rescue, no acceso a clientes ni rotar PIN.
- [CI local 44015740350](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44015740350): y-partyserver SQL journal pasa 4/4 coldjoin; **2 tests de seguridad P0 RED**: copia de license+instance abre WS y recibe Yjs, empleado manipula precio en canal `-cat`.
- [PR #7 / CI 44017222884](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/7): `estado-durable` SHA after `storage.sync`, 6 focal y 4 coldjoin PASS, pero no autoridad.
- Ya existe `cloudflare-worker/ws-capability-issuer.mjs` (ticket tras autenticación central de Owner/Team) y prototipo HMAC con nonce `qa/security/capability-lab-v1.mjs`. Este puente QA DEBE exigir firma, scope, revisión y consumo durable **antes de `super.onConnect()`** y detener sockets revocados/expirados. No confundir firma con sesión autenticada si ningún issuer está conectado.

## Propiedad de archivos y checkpoints

Reservar antes de escribir: SOLO nueva rama privada `fix/yparty-server-authz-qa-20261117` desde PR#7; archivos `injertos/yparty-worker/src/index.js`, nuevo `injertos/yparty-worker/src/server-capability.mjs`, prueba nueva `injertos/yparty-worker/qa/p0-strict-capability-bridge.test.mjs` y workflow nuevo `.github/workflows/qa-yparty-strict-capability-bridge.yml`. No modificar src cliente `src/yparty-piloto.js`, `docs/sync-yjs.js`, `cloudflare-worker/ws-capability-issuer.mjs`, pruebas RED antiguas, repositorios producción, PR#5/#6/#7.

## Modelo de defensa propuesto

1. **Fail closed por defecto**: sin `WS_CAPABILITY_KEY` de 32+ bytes **NO** WS. No introducir fallback legacy por license+instance; ninguna key privada en código ni frontend. Para pruebas sintéticas únicamente usar `WS_CAPABILITY_KEY` env Worker en memoria de runner con clave fija declarada de QA (NUNCA real).
2. **Prueba HMAC y audiencia**: ticket `v=1`, `aud`, licencia, dispositivo, sujeto, rol, room, scopes, roleRevision, iat/exp, nonce; firma HMAC SHA256 verificada con WebCrypto y comparación segura, no `atob` de payload sin límites. Rechazar TTL >60s, sala distinta, empleado con `cat:write` o `priv:read`.
3. **Autoridad viva**: usar solo una fuente de confianza que la autoridad central administra. **No se conoce aún una conexión operativa al endpoint Owner/Team de producción**; el laboratorio tendrá un censo KV sintético con campos `wsRoleRevision`, `wsRole`, `wsSubject` firmados por el servidor de prueba. En producción NO será suficiente sin validación de issuer central y recovación/roleRevision. Si no hay autoridad → acceso rechazado y NO-GO.
4. **No datos antes de verificar**: `onBeforeConnect` exige ticket firmado y scope de lectura, y `async onConnect` consume nonce en SQL con `INSERT ... PRIMARY KEY` antes de `super.onConnect()`; evita replay sobre reinicio y 2 sockets simultáneos. No eco de secret/IP/room en logs.
5. **Rol escrito en servidor**: `isReadOnly` de y-partyserver, employee `-cat` readonly, `-ops` acepta solo con `ops:sale` (pendiente validador de *tipo* económico por opId), priv owner-only. Revalidar expiración y revisión de rol antes de `super.onMessage` y antes de broadcast a receptores cuando el proveedor lo permita.
6. **Privacidad:** propietario no debe escribir PIN, costes, recibos privados en shared `-cat`, aunque tenga `cat:write`: el YDoc entregaría esos bytes a empleados. Separación `-priv` y proyección pública son requisito de rollout; un hook `isReadOnly` NO elimina ya persistidos secretos. Existe POC de filtración en pruebas, se conserva como NO-GO. Fotos privadas también pendientes.
7. **Sale ACK:** ninguno de estos tickets ni SHA de Yjs equivale a dinero/stock opId aceptado una vez; utilizar contratos tipados y libro de movimientos antes de GO.

## Ejecución TDD

1. Crear plan **en workshop** y reserva **en Notion** antes de tocar rama. Crear rama anclada al SHA de PR#7; registrar todo.
2. Escribir nueva prueba real de Workerd que debe dar **RED** en el Worker de PR#7: (a) clon license+instance sin ticket rechazado sin 1 frame, (b) token con firma falsa rechazado, (c) ticket auténtico owner y employee leen solo salas permitidas; employee no puede editar precio en `-cat`, sí conservar venta opId en `-ops`; (d) un mismo nonce rechaza replay incluso tras reinicio; (e) ausencia de clave o autoridad falla cerrada; (f) `estado-durable` y frío 2k siguen válidos en contextos autorizados. No reducir tests ni modificar los que prueban vulnerabilidades.
3. CI Node22 + `wrangler unstable_dev` real con KV y credenciales de prueba, sin Cloudflare externo. Separar los resultados estructurales de fallos de fixture y quota de artefactos (no subir archivos). Registrar CI RED exacto.
4. Portar módulo de verificación y guardia mínima al Worker; no copiar POC que usa `new Uint8Array(32).fill(41)` como secreto real. Conectar tests al issuer legítimo o identificar explícitamente el contrato sintético y la falta de conexión real.
5. Repetir GREEN exacto y pruebas de durabilidad; si rol/nonce no se prueba server-side, continuar NO-GO. PR DRAFT y Notion/STATUS siempre al día.

## Stop/continuidad

GitHub `friendly123workshop/projects/assembled-v783/STATUS.md` + este plan son el punto de restauración. No merge con PR#5 ni publicación hasta cerrar identidad clonada, alteración de precios, lectura privada y p0 físico. Próxima versión accesibilidad H1-H4 es **P2** ([Notion](https://app.notion.com/p/41b1642b67f381c381efdf41e372238c)), NO implementar mientras estos P0 estén abiertos.
