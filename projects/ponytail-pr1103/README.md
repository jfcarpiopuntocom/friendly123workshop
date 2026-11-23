# Ponytail · PR #1103 · laboratorio (23 noviembre 2026)
Origen: https://github.com/jfcarpiopuntocom/friendly-123/pull/1103
PR HEAD: `18b4ecf7663159c50fbea15379e1c786d94a4c58`; fusionada en `61e638d4fb066c6a76735f5e50f5378d90537276`.

**Copia íntegra del alcance de la PR:** `upstream/` contiene los 14 archivos tocados, copiados sin modificaciones del SHA inmutable. **Código refactorizado:** `candidate/docs/plan-pagos-ui.js`. La CI toma el checkout completo del SHA original, aplica *solamente* este archivo candidato, regenera minificados y corre el contrato contable + WebKit con fixtures sintéticos.

Se eliminaron 38 búsquedas DOM repetidas (tres nodos estables del modal) y un catch que solamente relanzaba el mismo error. Siguen intactos los controles de identidad, roles, write-ahead, opId, deduplicación, importe parcial, fecha de venta, stock y recuperación. Se preserva idéntica posición de los manejadores de error. Esta rama es laboratorio: ningún cambio en el repositorio comercial.
