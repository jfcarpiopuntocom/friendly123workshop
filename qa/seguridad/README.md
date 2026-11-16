# Seguridad y conservación · pruebas del workshop unificado

Aquí se prueban límites remotos de rol, filtrado por documento Yjs, `opId`, readback del ledger, ausencia de ACK falso, y contingencia de 22 claves comerciales más IDB/fotos/outbox.

Los tests del antiguo repositorio privado `friendly-123-injertos` son **referencia**, no «verificados aquí» hasta portar y ejecutar en este repo. Nunca publicar datos comerciales reales, tokens privados, PINs, licencias ni capturas del cliente.

**Bloqueante:** no migrar el Worker antiguo permisivo a producción; separar lectura de datos públicos y privados y prohibir operaciones monetarias Yjs sin comando autorizado. Navegadores primero, PWA después.
