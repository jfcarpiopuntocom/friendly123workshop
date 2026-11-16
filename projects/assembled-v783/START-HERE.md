# friendly-123 assembled v783 — entrada compartida

## Continuación de cliente autorizado — WIP, CI nueva pendiente

[Informe del cliente importado](reports/2026-11-16-authorized-client.md) y [plan/ledger](plans/2026-11-16-authorized-client.md). Se añadieron renovación de pases, pausa/reanudación y recuperación de IndexedDB, con revisión independiente y dos hallazgos corregidos RED→GREEN. Focal11/11 y Chromium real pasan. El lote local completo nuevo registra25/27: awareness anterior volvió a fallar y WebKit local no inicia por dependencias de sistema. No confundir el verde223/223 histórico que sigue abajo con aceptación del código nuevo; leer el resultado CI del SHA nuevo cuando esté disponible. No se activó el piloto comercial, ni se cambió el servidor relay en esta continuación.

## Estado vigente: conexión pendiente corregida; CI 223/223; aceptación abierta

Todo el código ejecutable está en [app/](app/) y [relay/](relay/). Esta carpeta es el punto de relevo; no hace falta recuperar otro contenedor. El archivo que sigue conserva la historia del rescate inicial. Para la situación actual, leer [STATUS.md](STATUS.md) y [el diagnóstico de admisiones](reports/2026-11-16-pending-admission.md).

La autorización de JFC resolvió la promoción antes bloqueada: `effee3a` ya está en main. Su CI pasó 222 casos. La repetición posterior sobre `3d747be` falló en dos casos del relay, por lo que ese verde no certifica ausencia de intermitencias. Se reprodujo y corrigió una carrera de admisión con test RED→GREEN. La CI nueva [43846447684](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43846447684), sobre código `eb50581c8a517697d82675d965a308cf6d668780`, pasó **223/223**, cero fallos y omitidos; [log completo](evidence/ci-43846447684.txt). El lote local pasó12/12 y cinco reproducciones focales de awareness pasaron1/1 cada una. El frame observado en CI anterior sigue sin explicación concluyente: no se quitó su aserción ni se declara eliminada toda intermitencia. Consultar el informe antes de dar un GO.

Pages excluye `projects/`: código accesible por GitHub, candidata sin servir bajo el mismo origen de la app histórica. El testigo Chromium de colisión de namespace se conserva como vulnerabilidad reproducida, no como aceptación de seguridad. La app histórica publicada mantiene bytes idénticos. No hay despliegue del nuevo relay ni cambio de clientes.

Orden de JFC, 16 noviembre 2026: todo el coding de esta misión pasa al repositorio friendly123workshop, organizado en subcarpetas. Los paths de un contenedor no son una entrega. Código y evidencia deben quedar en commits accesibles; Notion enlaza esos commits.

Este primer checkpoint rescata exactamente el trabajo Team revisado que otras sesiones no podían descargar:

- [Parche exacto revisado](checkpoints/team-reviewed/candidate.patch): SHA256 `987b1d2c83666b7729c4c31a36a41d12a3ff47bc16e40639a4b6e033c811fa62`.
- [Fuentes importadas y licencias](checkpoints/team-reviewed/imported-sources.tar.gz): SHA256 `04e799e4271c2ffbde84058cbee992115555854c4bfb8ed9aa8b4171ae776817`.
- [Procedencia y hashes](checkpoints/team-reviewed/provenance.json), [explicación de implementación](checkpoints/team-reviewed/README.md), [evidencia original](checkpoints/team-reviewed/evidence).

Base del parche: `friendly-123@f6276adac490f0610e130afec0615f98acd4b32b`. No aplicarlo sobre v781. La base histórica está archivada en el repo privado de injertos; la siguiente entrega añade la candidata reconstruida completa, para que no dependa de reconstruir ese archivo ni de otro entorno.

Qué acredita este checkpoint: 71 pruebas focales y tres Chromium, con dos carreras de ACK Team corregidas y revisión independiente. Los logs son originales sintéticos; extensiones .txt para conservarlos pese al ignore *.log del repo. No contiene licencias, PIN ni claves reales.

Estado: código de laboratorio, sin despliegue ni activación de clientes. NO migración completa. La continuación del emisor WS y relay privado sigue en curso; dos pruebas del relay todavía están rojas y NO forman parte de este checkpoint revisado. El objetivo siguiente es navegador según la orden vigente: PWA/Workbox aplazados.

## Código completo y continuación accesibles

[app/](app/) contiene runtime, fuentes importadas, backend/Worker y tests sin reconstruir el bundle privado. [relay/](relay/) contiene la continuación Workerd. Leer [STATUS.md](STATUS.md) antes de editar: issuer y relay son continuación WIP diferenciada del checkpoint revisado. No hay que pedir archivos de otro contenedor.
