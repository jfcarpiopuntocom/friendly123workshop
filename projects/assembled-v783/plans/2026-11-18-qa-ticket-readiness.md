# 18 nov 2026 · QA 2.0 ticket readiness (planes antes de código)

Estado fuente: `friendly-123/master@a2761d9f6f184d96c4f84cf43da300a49bfd7a46` v0.7.86; QA Worker 2.0 ya desplegado con switches OFF, issuer de `/ws/ticket` no responde ruta nueva.

Lectura HTTP real sin credenciales: GET `https://friendly123-licencias.jfcarpio.workers.dev/ws/ticket` devolvió 404 `{"error":"Not found"}`; según `ws-worker-api.mjs` desplegado respondería 503 si falta autoridad y 405 si está configurado. GET `https://friendly123-yparty-port2-canary-qa.jfcarpio.workers.dev/` → 503 «Autoridad no configurada». El comando de Claude `activar-ticket-qa.sh` terminó sin salida; no se tomó como éxito. Código del emisor exige conjuntamente `WS_AUTHORITY_QA`, `TEAM_AUTHORITY_QA`, licencia QA y cuatro secretos independientes >=32 bytes, con ningún secreto en Git.

## Ponytail de este turno

1. `scripts/qa-port2-readiness.mjs`: sonda read-only de 4 rutas GET sin credenciales: /ws/ticket, Worker QA root, Pages /version.json y /sync-rollout.json. Clasifica ruta ausente, ruta instalada sin autoridad, ruta instalada configurada; bloquea conclusiones GO si 404/503 o flags activos inesperados. No POST a negocio, sin licencias ni PIN; timeouts 8s, sanitiza logs (solo HTTP status y códigos de bloqueo).
2. `test/qa-port2-readiness.test.mjs`: unit tests con fetch inyectado y status 404/503/405, fallo de red, rollout OFF; no solicitudes a la red.
3. `.github/workflows/qa-port2-readiness.yml`: PR test determinista y sonda read-only; distinguir job verde de los tests y NO-GO operacional. Reejecutable manualmente cuando emisor esté desplegado. No habilita ninguna tienda ni despliega Workers.
4. Correr local unit tests y CI exact SHA. Guardar bloqueos en Notion y conservar plan en workshop/main. No tocar rutas cliente, app PWA, login shared worker, historial, roles, datos o la review #756.

## Limitaciones

Esta intervención no despliega el login Worker, que sirve a TODOS los clientes, y no sustituye la revisión de los secretos, el censo de autoridad ni la autorización para hacer rollout. No atribuir 100% ni sumar puntos hasta datos de QA reales y coldjoin completo. La siguiente prueba real Gate D requiere una fuente completa y verificable de catálogo sin modificarla.
