# Continuación: cliente importado con renovación cerrada

Base compartida: e32b55f7d17eed7c2a15081130d6f65a8ded3b77. Ejecutar en esta carpeta, sin deploy ni cambios de ramas. PWA aplazada.

## Contrato

Conservar YProvider2.2.0/Yjs13.6.33 y los documentos/persistencia existentes. Cada conexión remota obtiene parámetros nuevos del emisor real; un fallo de renovación nunca reutiliza el pase anterior ni selecciona un transporte menos protegido. Pausar, destruir o cambiar de sesión invalida peticiones pendientes antes de abrir un socket. Conectar o sincronizar no acredita un ACK comercial. El adaptador no crea ventas, no elimina opId/outbox y no reescribe IndexedDB.

La fuente importada `YProvider._reconnectWS` captura el fallo de `#resolveParams` y llama igualmente al reconnect base con URL anterior. Adaptar ese hook mediante subclase, sin editar vendor ni copiar un motor de transporte.

## Pasos verificables

1. Reproducir con WebSocket real local la reconexión con pase anterior cuando falla params. Guardar RED. Probar además pausa/destrucción durante una renovación y concurrencia de connect.
2. Implementar adaptador mínimo por composición/subclase. Conservar contrato YProvider y reanudación explícita; no reintentar autorización rechazada en bucle. GREEN y regresión relay completa.
3. Probar el adaptador con el issuer real y el relay Workerd real: pase nuevo por reconexión, rechazo de autoridad, documento local conservado y sincronización tras recuperación. No contar un servidor WebSocket vacío como prueba de negocio.
4. Añadir al workflow, revisión independiente del cambio nuevo, guardar código y evidencia por SHA en main y Notion. Registrar límites de integración: cat/ops/fotos y roles protegidos siguen sin contrato completo; no renombrar cat a priv ni mover documentos completos a una sala Owner para simular cutover.

## Ledger

Ruling: conservar la app histórica y su piloto sin activación mientras se ensambla este adaptador — los documentos actuales cat/ops contienen límites de lectura/escritura aún pendientes; sustituir solo la URL sería inseguro — coste si se interpreta como migración terminada: falsa aceptación. El adaptador es un paso verificable de cliente, no la activación de todas las salas.

Pre-flight: issuer produce token corto de uso único; YProvider necesita parámetros nuevos por cada intento. El reconnect importado reutiliza parámetros cuando falla su callback: conflicto confirmado en fuente. La subclase debe abortar ese intento. Documentos/Yjs/IndexedDB pertenecen al llamador y sobreviven a la pausa.

Task1: complete — RED original3/3 antes de existir adaptador, GREEN3; issuer RED4 por componente ausente y GREEN7 conjunto. Logs separados de errores de build.

Task2: complete — revisión independiente detectó dos Important: pausa/reanudación inmediata y bucle de emisión ante rechazo del relay. Ambos reproducidos: RED3 con ocho intentos donde se permiten dos, después GREEN11/11. Destrucción durante emisión cubierta sin cambio adicional de fuente.

Ruling: limitar a dos admisiones consecutivas sin sincronización — tolera un reintento con pase nuevo y pausa después, sin gastar el límite entero del issuer — coste: una caída prolongada exige reanudar explícitamente; la futura app debe vincular ese acto a sus eventos de conexión/sesión, sin fallback inseguro. Sincronización Yjs reinicia el presupuesto, pero nunca equivale a ACK comercial.

Task3: parcial — Workerd real y Chromium real pasan; dos caducidades reales renuevan. Lote local completo25/27: awareness previo falla y WebKit no puede iniciar. No marcar completo hasta CI WebKit y aceptación de los gates abiertos.

Task4: revisión independiente completada para este cliente; hallazgos Important corregidos con pruebas. Respaldo remoto/CI/documentación en curso. La revisión del servidor anterior continúa separada y no se presenta aceptada.
