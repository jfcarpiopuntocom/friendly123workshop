# D1 LIVE dashboard · columna filtrable y totales fiables / Opus 5.5 (plan ANTES de editar)
Fecha Ecuador 17 nov 2026, tras la orden más reciente JFC en Opus «dashboard mejorado prioridad para mañana».

## Fuentes y alcance
- Guía actual de Opus: https://app.notion.com/p/41b1642b67f381fbab5cf45ac55aabd3 ; propuesta detallada https://app.notion.com/p/41c1642b67f3810692f0e938149cbd14 ; decisiones JFC: dashboard prioridad, 16 rótulos ES/EN aprobados; sin rediseño, sin cambio de colores, sin banners, UI OWNER/ADMIN idéntica.
- base LIVE master@45757cac5d9268402049c0fba90cccdece150ac6, src/dashboard/dashboard-main.js blob 9bc56f6916d878e2a63037824cd62039a5f1bd7d, scripts/build-dashboard-entry.cjs blob bbd20cda1830c76fd526456d74f6483b46b9f9cc.
- Taller main@d0688c378d2cf42e939d01659ce414a509d7b89b; port 41.0/100, calidad 67.0/100, 0/6 GO inalterados porque D1 es mejora LIVE, no gate de injertos.
- Trabajo D1 (solo pieza 1): en VISTAS del dashboard existente, habilitar headerFilter por columna no acción ni columna opt-out, y bottomCalc en métricas realmente aditivas (unidades, tickets, montos de transacciones, NO precios/costos unitarios ni porcentajes). Sumar solo números finitos y seguros; cualquier valor pendiente/unknown deja —, no un total 0 engañoso. Los filtros globales y exportaciones filtradas actuales deben seguir funcionando. Refrescos de datos deben conservar filtros y orden; no crear más render completo.
- Extender prueba Node fuente real y arnés VM de Tabulator con filas sintéticas: filtros, rango numérico, totales sobre subconjunto, desconocido null => pendiente, precios no acumulados, cero instrucciones de venta ni consulta remota, sin UI nueva en el dashboard salvo filtros/fila de totales de Tabulator.
- Live PR DRAFT, NO MERGE/DEPLOY sin las cinco compuertas de JFC (full exact SHA, SHA servido, RED→GREEN, QA iPhone real con licencia de prueba, 'va' expreso), sin usuario real.
- Build reproducible: script OFICIAL node scripts/build-dashboard-entry.cjs, no edit manual de .min.js; version-manifest SOLO con script OFICIAL node scripts/gen-manifest.js, nunca hash manual. Puede mantenerse release NO-GO hasta shell nuevo y firma release oficial. Bot QA en rama propia exclusiva para generar activos, jamás master.
- No tocar docs/sync-yjs.js, docs/sync-outbox.js, fotos, PIN, Woo/Cloudflare, negocios, PR LIVE #741/#742/#743 ni manifiesto sin build oficial.
- Failback: git revert de un único cambio D1 + reconstrucción y sello oficiales. Datos leídos únicamente; no hay migración comercial ni base editada.
