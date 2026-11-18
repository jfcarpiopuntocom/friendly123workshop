## Orden de JFC · 18 noviembre 2026 · comunicación operacional de ingeniería (obligatoria)

- Respuestas de trabajo **breves, técnicas y orientadas a resultados**: acción realizada, SHA/URL/evidencia exacta, hallazgo, estado actual y próximo paso indispensable.
- **Eliminar la justificación defensiva, complacencia, disculpas rituales y enumeraciones repetitivas de lo que no se hará.** No gastar tokens en promesas de prudencia; demostrarla con pruebas, salvaguardas reales y evidencia.
- **Concentración P0:** una causa a la vez; diagnóstico reproducible → test RED → corrección Ponytail mínima → GREEN → suite pertinente → publicación coordinada y comprobación real cuando corresponda. Cerrar el circuito y sus dependencias, no saltar a mejoras accesorias.
- Distinguir explícitamente código integrado, test sintético, navegador real, servicio desplegado y aceptación con clientes. Nunca afirmar «arreglado» por una coincidencia de hashes o una prueba parcial.
- Proteger tiempo y contexto de JFC: leer Notion, instrucciones y checkpoints de workshop; actualizar evidencia persistente, preferentemente con referencias a pruebas y sin discursos.
- En urgencias de uso comercial, priorizar servicio operativo y trazabilidad del problema real sobre explicaciones o trabajos colaterales.

# friendly123workshop — instrucciones vigentes para todas las IA

## Orden de JFC · 16 noviembre 2026

Este repositorio existente es desde ahora el punto común de coding de friendly-123 para Codex, Sol6 y las sesiones Claude. Trabajar en subcarpetas; no dejar código terminado únicamente en un workspace local ni confundir notas Notion con entrega de archivos. La raíz histórica y sus apps no se sobrescriben para integrar una candidata.

- Misión ensamblada actual: leer [projects/assembled-v783/START-HERE.md](projects/assembled-v783/START-HERE.md) y su estado antes de editar. Fuentes, tests y pruebas de esa misión van bajo esa subcarpeta.
- Preservar trabajo de otras IA. Leer HEAD/estado antes de cada push; no amend, force-push ni reset destructivo. No abrir PRs, cambiar ramas, desplegar o activar clientes por iniciativa propia.
- La orden actual autoriza entregar el código en este repo. Commits pequeños y pushes frecuentes para checkpoints revisables; etiquetar explícitamente WIP/RED si se respalda trabajo incompleto. Nunca llamar GREEN a un test no ejecutado.
- JFC autorizó expresamente promover effee3a a main con conocimiento del Pages automático del taller. El build de Pages excluye projects/: los archivos se comparten por GitHub, pero las candidatas no se abren como otra app bajo el mismo origen de clientes. No quitar esa exclusión ni cambiar namespaces/stores para simular aislamiento.
- Repo público: publicar solo código y evidencia sintética auditados. Nunca claves, credenciales, licencias/PIN de clientes, datos de negocios, perfiles, incidentes privados ni copias indiscriminadas de repos privados. Notion conserva el contexto privado y enlaza al código.
- Prioridad actual: navegador (Chromium/Opera, WebKit/Safari); PWA, SW y Workbox aplazados por JFC. No publicar assets en raíz/docs ni tocar una PWA instalada por este trabajo.
- Arquitectura aprobada: ensamblar y-partyserver, y-indexeddb, Workbox y Dinero.js, sin reescribir innecesariamente infraestructura. Conservar los PIN/roles existentes, fotos, ventas, stock, dinero, opId, outbox y respaldos. Un fallback nunca crea otra venta ni reabre un canal inseguro.
- Fuente→guard→commit durable→transporte→otro aparato→reinicio: mapear y probar el recorrido afectado. Para fallos relevantes: test RED, diff mínimo, GREEN y revisión independiente; conservar salidas en archivos.
- Correr pruebas focalizadas, sintaxis, linter/typecheck si existen. Un mock o recuento de tests no acredita cliente real. No borrar checks ni rebajar límites para conseguir verde. No reintroducir la puerta eliminada de 33 minutos.
- Rechazo remoto no cancela una venta local durable. Identidad/rol de navegador no autoriza el servidor. Mantener deny por defecto para scopes sin contrato y distinguir issuer, permisos de lectura y comandos de escritura.
- Antes de cerrar: push comprobado por lectura de GitHub, SHA y enlaces reproducibles; actualizar estado/Notion con resultados, pendientes y límites. Si falla el respaldo remoto, decirlo y resolverlo; no declarar entrega con rutas locales solamente.

Estas órdenes nuevas prevalecen sobre versiones antiguas de CLAUDE.md y .claude/ESTADO.md en asuntos de destino de trabajo, arquitectura importada, prioridad navegador y proceso actual. Conservar los demás invariantes de datos/seguridad vigentes.
