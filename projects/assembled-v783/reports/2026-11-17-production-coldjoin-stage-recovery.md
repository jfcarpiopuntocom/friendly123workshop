# Coldjoin real después de PR #740 · falla RECUPERACION · 17 noviembre UTC

## Evidencia de campo, no hipótesis

- Producto live `jfcarpiopuntocom/friendly-123/master@45757cac5d9268402049c0fba90cccdece150ac6`; [recorrido 44012954943](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44012954943) activado automáticamente por merge QA-only #740, sin publicar código nuevo en docs. Dos jobs: `recorrer` **SUCCESS** y `union-fria` **FAILURE**, job `133804052005`.
- Nuevo marcador constante probado por tests 31/31 ×3: **`CANARIO_ERROR_ETAPA: RECUPERACION`** y `FALLA EXCEPCION: Error durante la unión`. No es un fallo de navegar ni de ingresar licencia; todavía es desconocida la operación concreta dentro del bucle de recuperación (espera, observación socket, diagnóstico o acceso a la página). `Error.name` no permite inferir el mensaje; deliberadamente no lo expone para preservar secreto.
- Último pulso a **145 s**: `catalogoRecuperando=true`, `pendientesStructs=true`, `pendientesDs=true`, **15 padres Yjs faltantes** (2 clientes ausentes, 13 huecos), `clientesYjsAplicados=176`, `estructurasYjsAplicadas=8157`, `pullPaginas=28`, `pullFrames=5348`, `pullAvances=27`, `pullIguales=0`, `pullUltimaMas=true`, `pullHeads=0`, `pullReconexiones=0`, fotos=13, productos=15, metadatosOwner=false. El socket catálogo estaba OPEN (1) y se observaba progreso de páginas cifradas, no recuperación final.
- Al cierre red agregada sin URLs: Firebase **116 respuestas 2xx, 9 respuestas 4xx, 2 errores de red**, Supabase 1 respuesta 2xx, WebRTC peer 1 conexión. Estos contadores **NO** revelan cuál petición falló ni prueban por sí mismos que los 4xx fueran el origen de la excepción.
- Checkpoint temprano: `consultado:false`, `checkpointExiste:null`, `corte:desconocido`; **esto no demuestra que no exista checkpoint**. No hubo prueba de lectura de stock/Owner porque no completó las barreras.

## Contraste con ayer

[Run 43961509893](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/43961509893) reportaba cerca de segundo 130: 26 páginas, 4966 frames y ~15 dependencias Yjs faltantes antes de excepción genérica. El nuevo run avanzó al menos a 28/5348, pero siguió sin concluir. Se confirma la repetición de síntoma; **no** cuál componente lo causa.

## Implicaciones de ingeniería senior / NO-GO

- No incrementar 180s del arnés para esconder un fallo; se necesita separar tiempo `t_pull`, latencia de red, decrypt, `Y.applyUpdate`, barrera de IndexedDB y cancelación/rotación del contexto Playwright.
- Proponer **PR QA nueva y tests RED** que distingan dentro del canario `RECUPERACION_ESPERA`, `RECUPERACION_CHECKPOINT`, `RECUPERACION_OBSERVADOR`, `RECUPERACION_DIAGNOSTICO`, usando solo tokens literales; conservar el test de secretos de #740, no emitir `e.message` ni URLs. Con objetivo de hallar la operación exacta, luego reproducir con fixture local/WebKit, no modificar Sync3 sin prueba.
- El arreglo workshop [PR #74](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/74) de falso ACK de cursor todavía está SOLO en workshop, no en master productivo. Revalidarlo en candidato privado de navegador [PR #5](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/5) antes de proponer port comercial.
- El port **workshop-v783** verificó 1160/1160 ficheros privados y abrió PR #5 DRAFT, todavía con CI browser. Esto no prueba Codex v783 ni revoca decisión browser-first, PWA deferred.
- No usar PIN real, no datos clientes, no diagnostico que exponga el `room` o archivos de negocio; no server autoritativo por el error.
