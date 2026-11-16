# friendly123workshop — instrucciones vigentes para TODAS las IA
**Actualización vinculante de JFC: 16-nov-2026.**

Este repositorio `jfcarpiopuntocom/friendly123workshop` es, desde hoy, el **único repositorio de coding e integración** para friendly-123: Codex, Claude, ChatGPT/Sol, Fable, Ponytail y demás agentes. No crear PRs ni escribir código nuevo en `friendly-123` ni `friendly-123-injertos`; quedan como **fuentes históricas de lectura**, salvo una orden expresa posterior de JFC. No mover los repositorios anteriores ni sus datos; no dar por integrados los cambios locales de otras máquinas sin un commit visible aquí.

## Estructura de trabajo (sin alterar el workshop legado)
- `apps/friendly-123/`: **único árbol cliente/base comercial** que se integra, construye y prueba. La base recuperada debe llevar SHA de origen y no sobrescribir los `docs/` históricos de la raíz.
- `injertos/yparty-worker/`: Worker y-partyserver/y-indexeddb (no auto-conceder acceso remoto).
- `injertos/moneda/`: Dinero.js, contratos y adapters de centavos (cuando exista código verificado).
- `injertos/equipo/`: autoridad de roles, permisos, sesión firmada y tests.
- `injertos/fotos/`: pruebas/adapter de bytes y ACK durable de foto.
- `qa/browser/`: Chromium/WebKit, pruebas sintéticas de ventas/fiados/abonos, stock, comisiones, fotos y recarga; controlar red/scope.
- `qa/seguridad/`: tests P0 de permisos, filtración Yjs, revocación, opId, respaldo y cero pérdidas.
- `docs/coordination/`: estado vivo, SHAs, actas y handoffs para todas las IA.

## Orden de ejecución
1. **HOY: BROWSERS PRIMERO**: hacer funcionar Chrome, Opera y Safari en modo navegador con TODOS los injertos sin alterar los datos de clientes. **PWA/Workbox, instalaciones duplicadas y service worker quedan pospuestos**.
2. Branch dedicado `integrate/browser-injertos-20261116` sobre backup `backup/workshop-before-unification-20261116`; cambios incrementales, TDD RED→GREEN, SHA exacto, revisión. No merge a main ni despliegue hasta pruebas finales y aprobación JFC para publicación.
3. Priorizar venta local-first durable, mismo `opId`, fondos/stock una vez, abonos y gastos correctos, PIN y rol vigente, fotos byte-exactas y sincronización comprobada; nunca aceptar 403/false como ACK.
4. El repositorio **ES PÚBLICO**. No importar `candidate.patch`, `imported-sources.tar.gz`, bundles privados, licencias, PINs reales, credenciales, capturas o fotografías de clientes sin auditoría y autorización explícita para publicar. Tests solo datos sintéticos. Código ya público puede reutilizarse con SHA y procedencia.
5. No rebajar permisos: `OCAuth.rolActual()`, un `instanceId` o un fixture `verifiedByBackend:true` no prueban autorización remota. Documentos Yjs no dan ACL por campo; bloquear filtración de costo/PIN/contactos y operaciones financieras crudas.
6. Distinguir **fuente que está en este repo y prueba verde** de planes, reportes de Codex y trabajo local inaccesible. No anunciar v783 ni release completo si los bytes/SHAs no están confirmados.

**Punteros:** `docs/coordination/ESTADO-UNIFICACION-2026-11-16.md`, el `CLAUDE.md` raíz y el relevo [Notion](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902). Ante reglas antiguas que indiquen otra ubicación, **esta orden más reciente de JFC prevalece**.
