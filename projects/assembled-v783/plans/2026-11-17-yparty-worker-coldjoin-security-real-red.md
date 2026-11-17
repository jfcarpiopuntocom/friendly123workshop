# P0 · YParty Worker local · unir en frío, persistir y rechazar acceso clonado (RED real)

**Fecha Ecuador:** 2026-11-16 23:11 / UTC 2026-11-17. **Origen exacto** del código a probar: `jfcarpiopuntocom/friendly-123-injertos@3f724ef2293ee9285f9f792268277cc691678c00`, [PR #5 DRAFT](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/5). **Producto desplegado** `friendly-123/master@45757cac5d9268402049c0fba90cccdece150ac6`, SIN CAMBIOS.

## Hechos comprobados leyendo fuente (no inferir resultados de pruebas)

- `injertos/yparty-worker/src/index.js` contiene la clase `Tienda extends YServer`, SQL `documento` + `diario`; registra cada Yjs update en un listener y onSave compacta en transacción sync. **Posible** durabilidad entre reinicios: probar.
- Guardia `guardia(req,lobby,env)` solo verifica parámetros de URL `licencia` e `instancia` contra KV `LICENCIAS`, sala derivada por SHA256; sin PIN, ticket firmado ni posesión. Puede admitir un segundo cliente con ID copiado.
- `injertos/yparty-worker/qa/p0-cloned-device-identity-red.test.mjs` posee un test de reproducción y un gate que requiere `!==101`. `qa/p0-rol-precio-deny-gate.test.mjs` requiere que un empleado no pueda alterar precio Yjs en owner ni tras coldjoin. **Estas pruebas no están certificadas por las 252 pruebas previas**; se deben ejecutar contra este Worker real con workerd local.
- `test/frio.test.js` prueba 2000 cambios Yjs, reinicio worker y lectura en un navegador totalmente nuevo; `test/contrato-dos-salas.test.js` prueba cat+ops opId tras reinicio. Hubo tests históricos en otra plataforma pero debe obtenerse evidencia actual del SHA.
- [MDD aprobada JFC](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac), [relevo](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902): licencia+PIN = mismo cuaderno/rol; no borrar historial ni reproducir operación, no inventar permisos; prioridad BROWSERS FIRST. [Investigación previa QA de capacidad](https://github.com/jfcarpiopuntocom/friendly-123-injertos/blob/3f724ef2293ee9285f9f792268277cc691678c00/cloudflare-worker/ws-capability-issuer.mjs): issuer HMAC scoped con nonce/revision, no integrado al Worker YParty; QA POC puede parchear Worker transitorio pero **no** legitima producción.

## Plan y ownership

1. Escribir este plan **ANTES** de crear la rama de pruebas. Reservar en Notion **solo** `audit/yparty-worker-p0-20261117` nueva rama privada; workflows de QA de esa rama, tests **existentes sin editar**. No tocar `injertos/yparty-worker/src/*`, `src/yparty-piloto.js`, `docs/sync-yjs.js`, los otros owners, producción, KV Cloudflare ni credenciales. No solapar PR #5.
2. Crear rama aislada desde SHA exacto `3f724ef2293ee9285f9f792268277cc691678c00`; añadir workflow `.github/workflows/qa-yparty-worker-p0-red-coldjoin.yml` con `permissions:contents:read`, checkout exacto, Node22, `cd injertos/yparty-worker; npm ci --ignore-scripts`. Debe ejecutar en runner local (sin cuenta Cloudflare) el Workerd real `frio.test.js`, `contrato-dos-salas.test.js` y en gate separado los dos tests P0 de autorización. El resultado de tests negativos debe ser genuino RED (no `|| true`): ni shims ni mocks para simular un servidor seguro.
3. Ejecutar y guardar RUN IDs / SHA / TAP por tests. Si el entorno falla (Miniflare, dependencia, permisos), diagnosticar entorno primero sin cambiar expectativas de seguridad. Conservar output del gate RED en Notion y workshop.
4. Si el worker **pasa coldjoin y opId** pero falla autorización, NO activar ni desplegar YParty: especificar el mínimo cableado de ticket efímero firmado (con `ws-capability-issuer.mjs`, roles, scopes, check/consume, revocación, handshake **antes de emitir cualquier frame Yjs**), separación de doc privado de owner, deny price update, foto hash lane, límites de almacenamiento. No sustituir garantías con checks del cliente.
5. Abrir PR DRAFT hacia rama de importación privada; label claro `QA SECURITY RED — NO DEPLOY`; no merge al working candidate hasta una solución GREEN que preserve coldjoin. Mantener la PR #5 DRAFT y su 117+135/252 intacto. No dar GO comercial.
6. Nunca copiar PIN/secretos/certificados en URL o logs; fixtures solo `F123-PRUEBA0001`, `F123-CLONEQA0001`, `F123-ROLESEC0001`, sin datos clientes. Detener en caso de acceso remoto no intencionado.

## Salida / criterios

**Positivo:** workerd levanta en runner y demuestra SQLite durable 2000 cambios después de reinicio y canal cat/ops; **negativo:** si clon entra o empleado manipula catálogo, fallo de autorización reproducido, blocking release, no bypass. **No equivalencia** con WhatsApp-like sincronía PC↔iPhone físico; no confundir con el error firebase 5348 frames/15 padres no recuperados.

Para otro agente en relevo: consultar esta ruta y Notion, luego rama privada y runs exactos. Si CI falla, NO reemplazar aserciones; si pasa positivo y falla seguridad, diseñar el puente **issuer real** antes de pedir aprobación de cambios runtime. No deployment.
