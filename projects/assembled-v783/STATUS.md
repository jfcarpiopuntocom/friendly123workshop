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
