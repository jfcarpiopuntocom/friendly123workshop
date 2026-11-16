# Autoridad de equipo / sesiones WS — injerto de roles

**Estado:** pendiente de código v783 revisado. La lógica UI local `dueno/admin/empleado/contador/artista` NO constituye prueba remota.

Exigir Owner validado por autoridad central existente; no alterar PIN vigente/10 intentos. Otros roles necesitan identificación humana real (no copiar `usuarios.rol` desde Yjs). Prohibido acceso a usuario privado sin credencial independiente. Debe protegerse el canal remoto sin bloquear el registro local de una venta legítima cuando el servidor está caído.

Tests bajo `qa/seguridad/`: rol inventado/no emitido, replay, cancelación, revocación, expiry, cross-license, fuga de `usuarios.pin`, contactos, costo y campos privados; 0 bytes emitidos al no autorizado. No desplegar el prototipo histórico.
