# P0 coldjoin: clasificar etapa de excepción sin exponer credenciales (plan antes de código)

Fecha de Ecuador: 2026-11-16; taller `main@ae4dbbcf9d3ae8d7102700572d2c3437aced6815`; PR #71 ya fusionada. Responsable en esta unidad: ChatGPT. **No implica port, release, ni que unión fría quede reparada.**

## Fuente y causa de la incertidumbre

- `friendly-123/master@94a4e047cdb0b2b14cbab004de599d7e43fef79b` y `projects/assembled-v783/app/scripts/canario-union-fria.cjs` tienen `catch(e)` que imprime solo `e.name`; el 16-nov el canario de producción [43961509893](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/43961509893) reportó `FALLA EXCEPCION: Error durante la unión` después de progreso parcial (pulso 130s: 26 páginas, 4966 frames, 15 padres faltantes, `more=true`). Desconocemos la función/etapa que lanzó. No concluir timeout explícito ni pérdida real.
- El cierre de la PR workshop #71 y el retry #70 afectan `sync-outbox.js`/cola manual; el canario/Sync3 usan `sync-yjs.js`, y-indexeddb y relay. No atribuir coldjoin a ese outbox.
- Otro agente investiga P0 multipestaña y benchmark Yjs. Evitar `avanzado-extra.js`, `sync-yjs.js`, `mock-backend.js`, manifest/SW, roles, PIN, relay y `friendly-123` producción en esta unidad. **Único código QA modificable**: `projects/assembled-v783/app/scripts/canario-union-fria.cjs`; agregar test y workflow focal.

## Diseño propuesto y verificación Superpowers RED→GREEN

1. Reservar rama desde SHA exacto y guardar plan + enlace Notion **antes** de pruebas/runtime.
2. RED: añadir test VM con el canario **real**; sustituir Playwright por página sintética sin red que dispara `Error('CANARY_SECRET_LICENCIA_PIN_NEVER_LOG')` en navegación, unión o en sondeo de recuperación. Verificar código de fase seguro `NAVEGACION/UNION/RECUPERACION` en `CANARIO_ERROR_ETAPA`, error de salida no cero, que el mensaje secreto no llegue al log, que no se intente PIN Owner en recuperación, que la excepción con `Error.name` sin mensaje no sea suprimida. El test debe fallar contra el fuente original (RED real).
3. GREEN mínima: `let etapaExcepcion` delimitada al IIFE; asignar constantes de una allowlist antes de cada fase observable. En `catch`, emitir solo `CANARIO_ERROR_ETAPA: <enum>`, nunca `e.message`, stack, URLs, room, opIds ni contenido. Conservar texto existente `FALLA EXCEPCION: Error durante la unión` para no romper parsers, PASS/FAIL e invariantes de seguridad de PIN.
4. Probar suite focal nueva + `canario-union-fria-guard.test.cjs` + `p0-coldjoin-workflow-secrets.test.cjs` en CI Node22 sin red ni secrets; guardar TAP, HEAD y exit. QA integrada 585 sobre mismo SHA, y revisión de diff de solo 3 archivos. No modificar la expectativa de test para fabricar verde.
5. Sólo después del SUCCESS focal+integrada y revisión, fusionar **al workshop únicamente**; registrar conteos, SHAs y riesgos en Notion. No trasladar al canario productivo hasta PR independiente/test de acceso.
6. Próximo paso para solucionar coldjoin de verdad: ejecutar el canario de lectura bajo ambiente sintético con etapa segura y perfiles desconectados, revisar causa de Yjs `pull-page` + `pendingStructs.missing` versus cursor/checkpoint y transporte; medir latencia y business readback; no «arreglar» aumentando timeouts ni saltando metadatos Owner.

## Criterios de no-go

Nunca marcar GO comercial por un diagnóstico mejor. Permanecen pendientes: historia causal completa, replay ciphertext durable y aplicación exactamente una vez, <10s A→B→A×2 PC↔iPhone físicos, roles/PIN legítimos, fotos/dinero/ventas/stock, datos reales intactos, full histórico con fallos. Port de una línea #70 hacia producción sigue bloqueado por prueba de respaldo local más nuevo oculto por IDB viejo.

## Recuperación tras 5 h

Rama `qa/20261116-coldjoin-exception-phase` en `friendly123workshop`. Revisar la PR correspondiente y los archivos `plans/2026-11-16-coldjoin-safe-exception-phase.md`, `app/test/p0-coldjoin-exception-phase.test.cjs`, `.github/workflows/qa-v783-coldjoin-exception-phase.yml`. Inspeccionar RED/GREEN por run ID, **no fusionar sin evidencias exactas**. Revalidar main antes de merge, coordinar trabajo paralelo, citar Notion.
