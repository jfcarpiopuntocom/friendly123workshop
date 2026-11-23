# Ponytail · PR #1103 · laboratorio (23 noviembre 2026)
Origen: https://github.com/jfcarpiopuntocom/friendly-123/pull/1103
PR HEAD: `18b4ecf7663159c50fbea15379e1c786d94a4c58`; fusionada en `61e638d4fb066c6a76735f5e50f5378d90537276`.

**Copia íntegra del alcance de la PR:** `upstream/` contiene los 14 archivos tocados, copiados sin modificaciones del SHA inmutable. **Código refactorizado:** `candidate/docs/plan-pagos-ui.js`. La CI toma el checkout completo del SHA original, aplica *solamente* este archivo candidato, regenera minificados y corre el contrato contable + WebKit con fixtures sintéticos.

Se eliminaron 37 búsquedas DOM repetidas (tres nodos estables del modal) y un catch que solamente relanzaba el mismo error. Siguen intactos los controles de identidad, roles, write-ahead, opId, deduplicación, importe parcial, fecha de venta, stock y recuperación. Se preserva idéntica posición de los manejadores de error. Una lectura literal quedó intacta para respetar la prueba heredada del valor elegido por el operador. Esta rama es laboratorio: ningún cambio en el repositorio comercial.

## Verificación en GitHub Actions

- Primer control: [45289992153](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/45289992153), 26/27; una prueba heredada acoplada a `q("pp-ab-monto")` exigió conservar esa expresión textual.
- Corrección localizada: commit `096222a9534da73b1f86cc052e4325b2afd40b2b`.
- Ejecución corregida: [45290151396](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/45290151396), **PASS**: 9/9 baseline, 27/27 pruebas focales, 3/3 WebKit, y 43 bundles regenerados. Prueba sintética/browser CI; no prueba física de la clienta.
- Archivo modificado: 54.786 → 54.647 caracteres (**−139**, ≈0,25 % de este archivo), reducción muy acotada. No representa reducción global del JS cargado.
- Los tres flujos comerciales del PR #1103 conservaron su contrato, pero esta ejecución no constituye validación de todas las rutas de friendly-123.
