# Fotografías / recibos — injerto byte-exacto

**Estado:** preparado como carpeta central de código; no se ha trasladado el canal privado v783.

La foto original debe sobrevivir IDB, cierre/reapertura del browser, exportación y readback remoto con mismo SHA-256 y bytes; **solo** ACK después de persistencia real, nunca tras aceptación de frame. Mantener outbox y referencia `opId`; cargas fallidas no deben perder el blob. Pruebas sintéticas en `qa/browser/`, pruebas de permisos en `qa/seguridad/`.

Sin subir fotografías de clientes al repositorio público. PWA y service worker quedan aplazados.
