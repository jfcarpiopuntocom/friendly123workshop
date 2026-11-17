# P0 · Integración real del consumo central en el código del Worker YParty

**17 noviembre 2026 UTC. Plan antes de modificar fuentes.** Base `jfcarpiopuntocom/friendly-123-injertos/qa/yparty-central-service-bridge-20261117@034ac34fe3bfa96183d15dcb6b52ff323fb8d5aa` PR #11 DRAFT, derivada de PR #9 snapshot/chunks. Nueva rama aislada `fix/yparty-worker-central-admission-20261117`, PR DRAFT hija de #11, NO producción, NO Cloudflare live.

## Contexto aprobado y coordinación
- MDD [Notion](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac): autoridad PIN Owner/Team y libro causal, no backend comercial autoritativo implícito.
- PR #7–#10 conservan SHA durable, scopes, SQL por bloques, rollback y Workerd local; PR #11 [plan](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-17-yparty-central-service-auth-bridge.md) tiene adapter server-only central consume/check/checkMany 12/12 ×2, pero NO está cableado al Worker.
- Archivo `src/yparty-piloto.js` está reservado en Notion por otro agente. No tocar cliente, bundle, `cloudflare-worker`, producción, PIN reales ni PR #5–11.

## Riesgo reproducible y aceptación
Actualmente `guardia` llama `verifyAdmission` con KV `wsRole*` que son solo fixture. `Tienda.onConnect` consume nonce local SQL, no central. Un token podría marcarse usado localmente sin quedar consumido ante autoridad real; central revocación no invalida la sala si la licencia KV conserva rol antiguo. No habilitar cliente real sobre ello.

**Orden seguro exigido**:
1. Al recibir upgrade WS, determinar licencia/instance/room legítimos; derivar el selector de scope desde claims **solo como input de la autoridad** (un claim sin firma jamás autoriza). Construir query del ticket de un uso. Exigir `env.WS_AUTHORITY_SERVICE.fetch` (Service Binding real) + `env.WS_SERVICE_KEY` server-only; `adapter.consume` CENTRAL antes del primer frame WebSocket. Si falla: HTTP 401/403 sin upgrade. NO fallback a KV, HMAC en navegador ni bare licencia+instancia.
2. En `Tienda.onConnect`, `adapter.check` que **ya está consumido** con el mismo ticket, sala, principal, role, revision y epoch; hacer guardia SQL nonce adicional antes de `super.onConnect`. Si no coincide, cerrar 1008 sin Yjs. Almacenar query/token solamente en estado privado del WebSocket, jamás console/log/broadcast.
3. `currentConnection` y `onMessage`: check central a emisor; `checkMany` de todos receptores con correlación, cerrar denegados y **no emitir broadcast a nadie si un resultado es denegado/falla binding**. Evitar falsos `ok:true` cuando un miembro del lote está revocado; comprobar sessionEpoch. `onCustomMessage` `estado-durable` también exige ticket central vigente. Mantener regla `isReadOnly` por scopes firmados del principal central, no claims del cliente.
4. Sin binding/key -> **HTTP deny before any Yjs**, no flag de QA que permita acceso sin autoridad. Las pruebas anteriores de Worker que usaban KV roles sintéticos sin central binding son contratos del SHA anterior (#9) y no deben declararse verdes automáticamente para el nuevo Worker.

## TDD verificable y archivos
- Crear esta especificación en `friendly123workshop` y reserva de dueño única en Notion primero.
- Rama `fix/yparty-worker-central-admission-20261117` desde PR#11 exacto SHA citado, archivos permitidos `injertos/yparty-worker/src/index.js`, NUEVO `injertos/yparty-worker/qa/p0-central-worker-admission.test.mjs`, NUEVO `.github/workflows/qa-yparty-central-worker-admission.yml`. No editar `server-capability.mjs`, `central-ws-authority.mjs`, cliente o emisor.
- Primero RED con prueba del código fuente original que verifica `guardia/onConnect/currentConnection/onMessage` y rechaza enviar antes del consumo central; exigir API real Owner PIN y fake Service Binding para pruebas de métodos; falla por ausencia de consumo central en Worker. Además ejecutar Workerd REAL sin autoridad con ticket HMAC sintético y KV wsRole sembrado: **debe denegar sin un solo frame** aun cuando HMAC/KV pasen; fuente original fallará. No falsificar resultado.
- GREEN patch minimal; test de código fuente literal VM con principal real y falso binding que llama rutas reales `wsPublicRoute/wsDoRoute` con PIN ficticio; prueba ticket central primero, `check` en DO, nonce reusado, rotación PIN invalidación y receptor revocado corta broadcast. Workerd real sin binding deniega por defecto; Workerd autenticado con binding REAL es un gate posterior y NO se declara probado por VM.
- CI Node22 pin, TAP en Actions sin artifacts (cuota llena). Preservar evidencia RED/GREEN, SHA exactos, PR DRAFT NO MERGE, actualizar STATUS y Notion antes de parar.
- No desplegar: aún faltan provisionar Service Binding Cloudflare, ServiceKey secreta, client ticket refresh, recepción foto privada, ledger typed opId, censo privados en -cat, coldjoin Firebase histórico 5348 frames/15 padres, auditoría completa 29 fails y ABA ×2 PC Opera/iPhone Safari. WCAG 2.2 AA P2 próximo release ya respaldado.

**Fuente de producto** `friendly-123/master@45757cac5d9268402049c0fba90cccdece150ac6` no tocar.