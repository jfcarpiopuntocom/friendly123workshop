# Gate C · paquete YParty reproducible, complemento sin colisión con Opus (#117)

Fecha 18 nov 2026. Solo workshop: `projects/assembled-v783/app/docs/vendor/yparty-piloto.min.js`. No editar fuente, sync-yjs.js, PR #117, LIVE, datos, flags ni cliente. Propietario Opus conserva Gate C. Este trabajo corrige la precondición de build que impide pasar CI de #117.

## Fallo RED demostrado
- [PR #117](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/117), [CI photo-browser fallida](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44252859802), job 134627483735.
- `node scripts/build-yparty-piloto.cjs` regenera el vendor de fuente actual y `git diff --exit-code` falla. No fallan los tests funcionales Gate C (24/24), ni existe evidencia de pérdida de una foto por este error.
- CI imprimió sha256 del bundle regenerado `ae285562efa80db95d09d0aa74296e0ec395df80a0654a8e1b4488dcf00993f3` y diff Git index `90b672a..fef27c9`.
- Salida esbuild del mismo CI = fuente de verdad para el artefacto derivado. No empaquetar compilado con un generador nuevo; conservar lockfiles de Opus. Extraer DOS líneas `+` del diff en log, unir con newline y newline final. Verificar Git blob SHA `fef27c9` tras cargar.

## Cambio, comprobación y límites
1. Guardar este plan ANTES de editar. Cambiar solo vendor por el output generador exacto del CI fallido, sin alteraciones a fuente ni shell.
2. Ejecutar el mismo job `photo-browser` en PR QA aislada; `git diff --exit-code` sin cambios, scripts focales intactos.
3. Si `git diff --exit-code` sigue rojo, no integrar; identificar contexto/generador. Gate C y score de port quedan sin acreditar por este parche.
4. Dejar a Opus incorporar Gate C #117 por orden; no fusiones LIVE ni editar sus archivos. Esta reparación del vendorizado es infraestructura reproducible, **no equivale a portar la app**.
