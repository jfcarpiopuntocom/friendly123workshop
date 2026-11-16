# Admisión WS pendiente, revocación y aislamiento del taller

## Cierre de verificación de este checkpoint

La CI [43846447684](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43846447684), código exacto `eb50581c8a517697d82675d965a308cf6d668780`, terminó SUCCESS. [Log íntegro](../evidence/ci-43846447684.txt): **223 pruebas, 223 pasan, cero fallos y omitidas**. Desglose por lote: 94 autoridad/contratos, 8 comerciales navegador, 5 ventas en dos pestañas, 22 cancelación/fiado/stock, 28 dinero/comisiones, 33 fotos/backup, 21 roles/recuperación y12 relay. Se ejecutó en runner limpio Ubuntu24.04 con Node22, lockfiles y Chromium/WebKit instalados por el workflow. No es aceptación en iPhone físico, Firefox, producción ni credenciales reales.

Además del lote local12/12, se investigó el fallo intermitente con cinco procesos independientes del caso exacto de awareness, deteniendo el barrido si alguno fallaba. [Resultados](../evidence/issuer/awareness-investigation/results.json) y logs run-1 a run-5 de la misma carpeta: cinco pases1/1, sin reproducir el frame. No se cambió código entre esas ejecuciones. Esta repetición está justificada por la intermitencia no resuelta; no se presenta como prueba de ausencia de la carrera.

La conclusión limitada es: la carrera de admisión quedó corregida con reproducción controlada; este SHA pasa la CI completa. La causa del frame de la CI anterior aún requiere evidencia y la revisión independiente final está pendiente. Mantener NO-GO de clientes y los gates descritos al final.

## Qué se cambió y por qué

El relay importado puede recibir actividad de una conexión mientras otra espera la respuesta del servicio de autoridad. La comprobación de destinatarios recorría también esa conexión pendiente, que todavía no tenía `accesoFirmado`, y la cerraba como si hubiera perdido permisos. Eso dejaba un dispositivo válido sin completar la sincronización. No se resolvió con reintentos ni aumentando tiempos.

`pendingAdmissions` registra la promesa de admisión por ID de conexión antes de llamar a la autoridad. Las comprobaciones de grupo excluyen solo esas admisiones pendientes; los mensajes de esa conexión esperan su resolución. La conexión continúa fuera de `getConnections()` hasta tener autorización válida. La promesa se elimina en finally. Es estado efímero: no se introduce una autorización persistente que pudiera sobrevivir a un reinicio sin revalidación.

La prueba nueva retiene deliberadamente la respuesta de autoridad de un segundo dispositivo, provoca una escritura desde el primero y espera un ACK durable de ese primero. Exige que el segundo siga sin sincronizarse antes de resolver su permiso y que luego reciba el valor 314. Con el código anterior falla por timeout de admisión; con el cambio pasa. Las aserciones no se eliminaron ni se elevaron sus límites.

## Evidencia y alcance exactos

- [RED válido](../evidence/issuer/pending-admission-red.txt): un caso, un fallo `timeout queued valid admission`.
- [GREEN focal](../evidence/issuer/pending-admission-green.txt): un caso, cero fallos.
- [Lote local actualizado](../evidence/issuer/relay-admission-and-trace.txt): 12 casos, 12 pasan, cero fallos/omitidos. Incluye admisión controlada, persistencia SQLite tras reinicio completo Workerd, lectura sin escritura, caducidad, revocación y cierre ante falta de autoridad/flag.
- [Error inicial de preparación](../evidence/issuer/pending-admission-setup-error.txt): no contar como RED producto; esperaba un socket abierto mientras la propia prueba retenía la admisión.
- `node --check` de fuente y test y `git diff --check`: salida cero. El paquete relay solo declara script test; no hay comando separado de lint/typecheck que se pueda declarar ejecutado.

Workerd y el relay YServer son reales en estas pruebas locales. Los PIN, instancias y licencia son sintéticos. La autoridad usa sus módulos reales con un adaptador transaccional en memoria. No es una prueba de despliegue Cloudflare ni de un negocio real.

## Intermitencia que sigue abierta

La CI [43842018630](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43842018630), SHA `effee3abed63ea42a6f3136c15d97999d0a72957`, pasó 222 casos. Se conserva [su log completo](../evidence/ci-43842018630.txt). La repetición [43843328597](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43843328597), SHA `3d747be4ce15d153bc965e222ae110f7014eb39a`, pasó los lotes de app pero falló en relay: timeout de lector nuevo y un frame binario en el caso de awareness/revocación. Se conserva [también el log fallido completo](../evidence/ci-43843328597.txt). Ese segundo SHA solo modificó hosting/documentación/disparadores; no justifica culpar a un cambio de runtime ni llamar todo verde.

El timeout tiene ahora una reproducción controlada y un arreglo. El frame no se reprodujo en el lote local actualizado: sigue abierto. Se añadió observación desde la construcción de cada WebSocket y secuencias de commits sintéticos de autoridad/revocación. Si vuelve a fallar, el log imprime únicamente nonce sintético y secuencias de los últimos frames. La asociación ordinal entre decisión y frame es una ayuda diagnóstica, no prueba independiente de causalidad ni de orden de entrega entre redes. No registra PIN ni token completo. El objetivo es separar un frame ya autorizado en tránsito de un envío nuevo autorizado indebidamente tras revocar. No se adelantó una conclusión sin esa evidencia y se conserva la exigencia de cero frames del test.

## Hosting y preservación de clientes

Dos rutas del mismo origen no aíslan localStorage/IndexedDB. [El testigo Chromium](../qa/hosting/origin-witness.cjs) abrió dos rutas de una app sintética y confirmó que ambas compartían la clave `f123::f123_origin_witness`; [el resultado](../evidence/origin-witness.json) es una vulnerabilidad reproducida, no PASS de aislamiento. No se usaron perfiles ni datos de clientes.

Por ello `_config.yml` excluye `projects` del sitio Pages. [La comprobación HTTP](../evidence/hosting-proof.json) registra candidata antes 200 y después 404; la app histórica del taller sigue 200 con SHA256 `f3d4b56ac09d6f789d62d44e5eb6a1abd0d3cd815aaf792c0c73d58481e6e95f`, idéntica al archivo fuente. GitHub conserva todos los archivos de la candidata. No se cambió el namespace ni los stores de clientes para aparentar aislamiento.

## Límites y siguiente aceptación

No hay migración completa ni GO de producción. Falta conectar el cliente al contrato nuevo sin reabrir el proveedor histórico, acotar proyecciones de artista/contador y salas compartidas, comandos comerciales con opId y ACK durable, fotos con confirmación remota, failback A→B→A, pruebas físicas, coste/latencia y despliegue controlado. Una venta local durable no puede depender de que el relay esté disponible. PWA/Workbox siguen aplazados por orden vigente.

La revisión independiente previa detectó un problema real de awareness que motivó el guard de salida. La última revisión no finalizó; no presentar este arreglo de admisión como aprobado por un revisor independiente ni como sustituto de ese gate. La siguiente CI se debe evaluar por su SHA propio, conservando tanto fallos como verdes y sin extrapolar resultados anteriores.
