# Browser-first en el repositorio único

El código de pruebas y los injertos nuevos pertenecen a `jfcarpiopuntocom/friendly123workshop` exclusivamente. El cliente integrado está bajo `apps/friendly-123/`; las pruebas `qa/browser/`. **No usar los `docs/` históricos de la raíz para inyectar v783.**

- Motores de QA: Chromium y WebKit; complementan, pero no sustituyen, Opera y Safari físicos.
- Aplicación con ventas locales duraderas, centavos, fiados/pagos parciales, fotos byte-exactas, permisos y respaldo.
- El transporte remoto debe estar desactivado/controlado en los fixtures locales, sin credenciales comerciales ni datos de clientes.
- El SHA final v783 aún no se encuentra en este repositorio. Las pruebas históricas del repo privado solo demuestran v782.
- NO PWA / NO SW esta ronda. NO despliegue productivo automático ni destrucción de IndexedDB.

Ver `AGENTS.md` y `docs/coordination/ESTADO-UNIFICACION-2026-11-16.md`.
