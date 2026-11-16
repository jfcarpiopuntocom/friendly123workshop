# Estado compartido · 16 noviembre 2026

JFC ordenó concentrar coding aquí para evitar otra pérdida de accesibilidad. Prioridad inmediata: archivos accesibles por Sol6/Claude/Codex, luego seguir navegador con todos los injertos; PWA aplazada.

## Disponible en esta carpeta

- app/: runtime completo de navegador, fuentes de componentes congelados, backend local, Worker autoridad y tests; sin incidentes privados ni perfiles.
- relay/injertos/yparty-worker/: fuente exacta b93 + guard privado WS en progreso, lockfile y test Workerd. No es el Worker antiguo del HEAD QA.
- checkpoints/team-reviewed/: paquete EXACTO que faltaba, con hash conservado, antes de la continuación issuer.
- evidence/: salidas originales sintéticas, incluyendo rojos, errores de arnés y verdes. No confundirlos.
- SOURCE-MANIFEST.json: hashes de archivos de app y exclusiones deliberadas de documentos/artefactos históricos ajenos al código.

## Comprobado antes del traslado

Checkpoint Team: 71 core/local/API +3 Chromium; otra ampliación del mismo caso confirma recibo ACK tras recarga real. Revisión independiente de dos carreras HTTP/IDB; notas detalladas en checkpoint.

Continuación issuer: 16 casos de núcleo de emisión/consumo/revalidación y 4 de API con entrypoint Worker real, más regresión PIN de entrada: 21 casos pasan. API Team adyacente también pasó en lote anterior. Autoridad central DO, nonce único durable, caducidad máxima60s, revisión actual a emisión/uso, secretos distintos, scopes con techo estricto. No cliente ni despliegue activados.

Relay real Workerd: arnés instalado con lockfile. Primer npm ci falló por caché no escribible; misma instalación con --cache /workspace permitido pasó. Primer build del test no configuró mainFields y fue error de arnés, no RED producto. Otro arnés olvidó activar Owner sintético; corregido antes de atribuir seguridad. RED válido: b93 entrega un frame Yjs a identificadores sin pase. Tras integración parcial, casos sin pase y salas compartidas cerradas pasan; siguen dos fallos porque replay/indisponibilidad no cierran el socket dentro de 250ms, aunque el contador de frames permanece0. Investigar causa antes de cambiar timeout/aserciones. No rebajar checks.

## Siguiente trabajo

1. Reproducir desde ESTA copia y confirmar hashes y tests. No continuar editando paths anteriores fuera del repo.
2. Cerrar dos fallos relay, revisar expiry/readOnly/revocación/reinicio. Solo canal Owner-private habilitable en QA; cat/ops/fotos amplios continúan cerrados mientras falten límites de lectura y comandos.
3. Traer a QA las pruebas browser-first de Sol6 (117 pasan sobre v782, NO sobre este código); ejecutar sobre SHA exacto de esta candidata. Preservar Node/Chromium/WebKit y red externa bloqueada.
4. Revisar independientemente antes de considerar integración segura. Fotos ACK remoto, permisos, comando opId y failback A→B→A siguen pendientes. No hay prueba física ni Cloudflare real, ni GO de producción.

## Reejecución dentro de workshop

Instalación limpia de ambos lockfiles correcta (app146 paquetes, relay45). Desde app/ se ejecutaron las 71 regresiones previas más16 issuer y4 API: **91/91 PASS**, 0 FAIL, 0 omitidos. Log compartido evidence/issuer/workshop-core.txt. Estos resultados sí corresponden al código trasladado; no certificar los dos tests pendientes del relay ni los117 de Sol6 aún no corridos sobre este SHA.

Dos recorridos adicionales Chromium desde esta copia también pasan: venta sintética con Dinero y Team 503→recarga→recuperación→recibo durable. Log evidence/issuer/workshop-browser.txt. No se ejecutó Workbox ni se cambió PWA en esta entrega.

## Continuación relay · ocho casos verdes, revisión todavía abierta

Se resolvieron los dos fallos iniciales sin cambiar el timeout/aserciones: el router consume el pase antes del upgrade y onConnect vuelve a comprobar su vigencia antes de llamar a YServer. Logs workshop-relay-green.txt y workshop-relay-edges.txt. Ocho casos pasan con Workerd real local: identificadores sin pase no reciben frames; Owner-private con escritura/lectura; replay; caída de autoridad; shared/ops cerrados; Owner readonly no persiste cambios crudos; receptor caducado sin siguiente frame; instancia revocada sin siguiente frame; reinicio completo Workerd con recuperación SQL. El test de restart confirma también que la edición readonly nunca persistió.

La revisión independiente de la fase está en curso y está intentando una carrera de respuestas de autorización y el broadcast de awareness durante onClose. No llamar a estos ocho casos certificación de revocación inmediata/cross-POP. NO-GO de activación se mantiene.

## Cierre de lifecycle y snapshot de permisos

Revisión independiente reprodujo awareness enviado a receptor revocado al cerrar otro socket. Test rojo relay-close-awareness-red.txt:1 frame frente a0. onClose ahora revalida receptores antes de llamar al lifecycle de YServer;9 casos reales Workerd pasan en relay-close-awareness-green.txt. También se sustituyeron RPCs independientes por check-many con una transacción final común de todos los destinatarios:2 regresiones de batch RED→GREEN y una de API. Lote core actual **94/94 PASS**, relay **9/9 PASS**. El batch evita mezclar una concesión temprana con una revocación observada durante otra consulta, pero no demuestra entrega atómica entre dos DO/regiones; sigue NO-GO para producción.

La revisión independiente aportó el hallazgo anterior pero su ejecución terminó con un error del servicio antes del dictamen final. No afirmar revisión final completa/limpia. Se conserva esa limitación.

WebKit local bloqueado por seis bibliotecas ausentes; install-deps oficial falló en su:Authentication failure. Cuatro casos Sol6 Chromium sí pasaron, cuatro WebKit no arrancaron; no son117PASS. Se corrigió solo cleanup de su arnés para cerrar localhost cuando launch falla. Workflow QA de este taller usa ubuntu24.04 e instalación oficial con dependencias, sin deploy, secretos ni artifacts de cuota agotada. Esperar el resultado del SHA exacto. El arnés de ocho browsers activa explícitamente Dinero BigInt y exige bundle presente.

## Primer CI del taller · SHA9c31714

Run43821169475 confirmó94 autoridad/core,8 Chromium/WebKit con Dinero activado y5 doble pestaña. Falló al comenzar stock porque la exportación omitió lab/stock-journal/engine.cjs y yjs-bridge.cjs. Son dependencias sintéticas originales de los tests, NO un motor nuevo integrado. Se restauraron sin modificaciones desde f6276ad; bloque stock ahora22/22 local. Dinero/reportes28/28 local; foto/backup se ejecutó también. Log completo de CI conservado en evidence/ci-43821169475.txt. No se contabilizan como verdes los pasos skipped de esa CI; repetir la ejecución exacta después del arreglo de entrega.

## Fallback seguro de configuración · regresión adicional

Tras CI220 verde de831838a se probó apagar el flag seguro del relay. RED válido: reaparecía1 frame por el camino de identificadores legado. Esta candidata ahora requiere WS_AUTHORITY_QA=1 en la entrada pública; flag0 o ausente retorna indisponibilidad, sin reabrir la sala antigua. El b93 histórico sigue archivado y no se modificó ningún Worker productivo. Lote Workerd local actualizado:11/11 PASS; cero frames de bypass, readonly, expiración, revocación, cierre awareness y reinicio SQL. Fuente y logs red/green se entregan en el siguiente checkpoint. El fallback comercial sigue local-first con sus hechos/opId; no significa aceptar un transporte sin autorización.
