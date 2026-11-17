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

## Primer RED con fuente intacta — PR #8 y arnés mejorable

- [GitHub Actions 44018199682](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44018199682) / SHA `85de62d0a234c60215e354c18178685d8e7b0217`: **5 tests, 1 PASS, 4 FAIL, 0 omitidos** contra el Worker original de PR#7. Fallos: WS sin cap, firma/rol/sala inválidos, empleado modifica catálogo, nonce reutilizado; la prueba de opId empleado pasó porque el Worker **admite a todos sin validar ticket**, NO porque su seguridad fuese correcta.
- El simulador `probe` esperó cierre en una conexión que el Worker vulnerable deja abierta; por eso tres fallos aparecen como `auth probe timeout` y no como `assert.notEqual(101)`. Antes de modificar runtime: ajustar solo el test para resolver `status:101` al abrir en pruebas pre-upgrade y para nonce exigir cierre `1008` incluso tras upgrade con cero frames; así RED es más inequívoco y rápido. Guardar segunda corrida RED SHA. **No** cambiar expectativas ni debilitar pruebas.

## RED limpio de seguridad ANTES de editar Worker

[GitHub Actions 44018414122](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44018414122), SHA privado `bdb38ee8f7a066ecef871b1c1d893d29cb8f58ce`, PR [#8](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/8). **5 tests / 1 PASS / 4 FAIL esperados / 0 SKIP/CANCEL**. Sólo se había creado el archivo de pruebas y su workflow; la versión del Worker es aún la **fuente idéntica de PR #7**. Prueba corregida para informar `101` inmediatamente en upgrade inseguro y distinguir `1008` de rechazo de nonce:
- Missing cap = **upgrade 101**: no hay admisión firmada.
- Firma alterada = **upgrade 101**: no se verifica HMAC/room/role.
- Empleado cambia precio vía Yjs = **FAIL**: el control se delega al cliente.
- Mismo nonce usado en segundo WS = **timeout de prueba**: el servidor vulnerable mantiene abierta conexión sin verificar nonce. En el caso GREEN, el servidor debe enviar `1008` y cero frames al replay.
- Una venta con opId de empleado = único test PASS pero **sin seguridad** porque no exige token; solo prueba que el camino de datos funciona. Su PASS no valida autorización.

Primer RED [44018199682](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44018199682) también fue 1 PASS/4 FAIL; se conservó y se corrigió **solo el simulador probe** para que los errores 101 no quedaran ocultos por timeouts. **Ahora** procede código de verificación HMAC, nonce durable SQL, scopes y estado de rol desde KV sintética; no tocar expectativas. Riesgos no cerrados: conexión real a Owner/Team central, privacidad de shared cat y tipos económicos arbitrarios en ops.

## GREEN I · servidor Workerd real verifica capability y prohíbe precio no autorizado

- Sobre `fix/yparty-server-authz-qa-20261117@e27ab5a3241605d15a3e97bc478e6ea603f47915` se crearon `src/server-capability.mjs` (sin secretos fijos) y cambios acotados a `src/index.js`. **CI en paralelo sobre HEAD idéntico** [44018657918](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44018657918) y [44018662694](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44018662694) = ambos **5/5 PASS, 0 FAIL/SKIP/CANCEL**.
- Funciones reales: `onBeforeConnect` firma HMAC/TTL/audiencia/sala/rol + revisión, niega si no existe `WS_CAPABILITY_KEY`; `onConnect` consume nonce por INSERT SQL PRIMARY KEY antes de `super.onConnect`; `isReadOnly` rechaza `cat:write` del empleado; `onMessage` revalida remitente y destinatarios contra KV sintética, expiración y revision, `estado-durable` revisa sesión; el diario SQL y SHA del PR#7 quedan incorporados.
- Los cinco tests sobre Workerd real usan un secreto **público marcado QA sólo dentro del archivo de prueba**, roles/censos `wsRole`, `wsSubject`, `wsRoleRevision` sembrados en **KV local sintética**; eso **NO** demuestra una sesión PIN Owner/Team auténtica en la aplicación real ni revocación fuertemente consistente. Los clientes hoy no solicitan tickets del issuer; **NO conectar a datos reales**.
- **Limitación grave:** KV LICENCIAS comercial NO tiene necesariamente los campos de rol verificado usados en el laboratorio. Con el código actual el Worker falla cerrado en producción; no está listo para rollout sin cablear emisión y revisión en la autoridad Owner/Team. Shared `-cat` todavía puede contener datos secretos si el Owner publica campos privados; `ops:sale` todavía permite escribir tipo de operación Yjs arbitrario. No confundir firma/permisos de sala con permisos económicos tipados ni migrar server business (#4 no autorizado).
- **Siguiente incremento TDD sin tocar runtime:** confirmar compatibilidad del **emisor real** `cloudflare-worker/ws-capability-issuer.mjs` con el verificador del Worker usando almacenamiento/Team authority locales simulados (no token HMAC recreado manualmente) y agregar coldjoin de 2.000 registros comerciales sintéticos por los permisos firmados. Guardar CI exacto. Si esa comprobación revela una incompatibilidad de firma/roles/sala, RED antes de cambiar source. No merge ni deploy, PR #8 DRAFT.
