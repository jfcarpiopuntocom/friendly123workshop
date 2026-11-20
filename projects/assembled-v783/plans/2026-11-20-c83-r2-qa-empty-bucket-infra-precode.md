# C83 PRECODE · R2 QA empty bucket for SAME friendly-123 1.0→2.0 independent frozen source

**20-nov-2026 · Ecuador.** Greenlight usuario a avanzar/fast-track en **la MISMA** `jfcarpiopuntocom/friendly-123` portando arquitectura 1.0→2.0; Sync3 YA está en arquitectura 2.0 y se mantiene. `jfcarpiopuntocom/friendly123workshop` solo PRECODE, QA, auditoría, no app distinta. Source code funcional sigue en repositorio de producto.

## Estado verificable antes de escribir en Cloudflare

- Producto canónico `master@76044973a5b3168140396fe932cb61d8b8ee27e5`. Dos métricas originales rúbricas fijas100 con un decimal: **TRANSICIÓN92,0/100,0 y CALIDAD79,9/100,0**, GO comercial0/6, pruebas físicas PC Opera↔iPhone Safari/PWA0/5, switches QA OFF. 8,0 puntos port pendientes (HEAD original económico Firebase real2,0, R2 binding real + fuente completa2,0, operativo/fotos/roles/físico4,0).
- MDD Notion [aprobada](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac), [bitácora](https://app.notion.com/p/41c1642b67f381cf8e04f2e53e91db94) y `friendly123workshop/STATUS.md` leídos, reservas PR #871 (Yjs), #868 (fotos), #841 (ledger) se preservan.
- Cloudflare API GET real `/accounts/{account_id}/r2/buckets` devuelve **[] (0 buckets)**. Worker QA `friendly123-yparty-port2-canary-qa` tiene `WS_AUTHORITY` pero **NO** `WS_FROZEN_HISTORY_SOURCE` ni `F123_FROZEN_R2`.
- **Contrato repositorio** `cloudflare-yparty-worker/wrangler.frozen-source.jsonc`: Worker separado `friendly123-frozen-history-qa`, config `r2_buckets:[{binding:'F123_FROZEN_R2',bucket_name:'friendly123-frozen-history-qa'}]`, `workers_dev:false`, preview URLs false, observability false. El encabezado dice expresamente **NO desplegar Worker hasta historial original completo y certificado independientemente**. `cloudflare-yparty-worker/src/frozen-r2-source.mjs` es READ-ONLY, requiere habitación/head originales, manifiestos y SHA256 fuera de R2, chunks canónicos, secreto, rechaza sin pin. No crear datos ficticios.
- Búsqueda exploratoria Google Drive `firebase` halló informe de auditoría v675 y PDFs editoriales, **NO prueba de archivo export certificado**. No reclamar exhaustividad ni HEAD obtenido.

## Objetivo Ponytail infra, sin tocar live product

**Crear SOLO bucket R2 vacío QA de nombre EXACTAMENTE `friendly123-frozen-history-qa` en la cuenta Cloudflare conectada, ubicación default, clase Standard por defecto, sin objetos, sin acceso público, sin bindings ni código desplegado.** Ese nombre ya existe en config; no inventar segundo proveedor ni cuenta ni ruta. Obtener Cloudflare API readback: existe bucket con nombre exacto y 0 objetos si disponibilidad de listing sin contenido. Si API devuelve error por billing/permiso, registrar y NO reintentar con otro proveedor/pagos.

No enviar bytes de tienda, credenciales, opIds privados, PINs o fotos. No modificar Workers de producción ni QA, secretos, R2 objetos, bindings o PINs. No crear una falsa fuente congelada ni cambiar `WS_OPEN_EXISTING_QA=0`. Releer QA binding y R2 bucket tras operación, asegurar FAIL CLOSED: no `WS_FROZEN_HISTORY_SOURCE`, no master switch.

## Puntuación real y gates siguientes

**Este bucket vacío es preparación, NO es `r2-service-binding-installed` ni HEAD original; por tanto TRANSICIÓN92,0/100,0, CALIDAD79,9/100,0 SIN cambio.** Posterior: conseguir HEAD económico auténtico Firebase + par de manifiestos ops/cat reconstruidos de datos reales + SHA256 anclado independientemente (fuera de R2); subir bytes originales completos a bucket con política de inmutabilidad; entonces desplegar Worker de fuente con binding R2, URI interno y Service Binding QA `WS_FROZEN_HISTORY_SOURCE`, pasar pruebas Workerd cold join con clientes reales/anónimos y dos ciclos físicos Opera PC→iPhone Safari/PWA→PC. Solo cuando evidencia de cada gate EXISTA, rubric puntajes en PR score RED→GREEN separado.

No confundir testing de caso sintético con comercio GO; no actualizar puntuación por crear bucket. Registrar paso en Notion y workshop con nombre exacto y evidencia Cloudflare de operación, si resulta. **User fast-track general aplicado solo a staging QA vacío**, sin gasto de R2 por datos. 
