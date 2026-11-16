# y-partyserver / y-indexeddb — estado y contrato

**Destino común de código:** `jfcarpiopuntocom/friendly123workshop/injertos/yparty-worker/`.

**Estado 16-nov-2026:** el prototipo histórico permanece de solo lectura en el anterior repositorio privado. **No fue importado**: su versión experimental documentaba acceso a la sala por licencia + ID de aparato y un conocido bypass de lectura Yjs. No considerarlo seguro ni desplegado.

El Worker integrado debe usar:
1. Identidad humana y rol autorizados **por el backend**, con una clave de firma de WS independiente; no fiarse de `OCAuth.rolActual()`, `sessionStorage`, ni de un `instanceId` afirmado por el navegador.
2. Sala `-cat` sin PIN, costo reservado ni contacto privado; `-priv` separada y autorizada, `-fotos` con derechos de lectura/escritura, `-ops` de lectura y comandos tipados para venta/dinero, nunca escritura financiera Yjs arbitraria.
3. Token de breve duración, nonce de un solo uso, revocación de sockets inactivos, **0 frames** antes del permiso; aislamiento por licencia/persona/rol.
4. Fotos con bytes recuperables tras reinicio, 22 claves del negocio preservadas, operaciones `opId` idempotentes y ACK duradero.
5. Fallback local-first sin perder una venta cuando falla la conexión o la autoridad.

Codex entregará el código **auditado para repositorio público** aquí, con pruebas RED→GREEN bajo `qa/seguridad/`, no simplemente copiando el prototipo inseguro. No modificar PWA hoy.
