# C12 · 19 nov 2026 · medición viva + lectura fría pública sin nueva siembra · PRECODE

Objetivo vinculante: PORTAR friendly-123 existente 1.0 → arquitectura 2.0 mediante injertos de componentes probados. Sync3 ya es 2.0, NO forma parte del denominador. Workshop = laboratorio/evidencias; `jfcarpiopuntocom/friendly-123` = producto. Tomar referencia exacta `1b147ad99f4fdbf6cf60d8f6a57e7f79bbe3ad4a`. No contar GO comercial ni pruebas físicas en el porcentaje de port de ingeniería. Calidad arquitectónica es otro /100.

## Entrega de medición
Nuevo `docs/engineering/architecture-2-port-score.json` en la app real con sumandos explícitos de 100.0, capacidad, prueba y estado; `scripts/architecture-2-port-score.cjs` que comprueba el peso total, IDs únicos, estado, presencia de archivos de producto, puntaje reproducible y SHA de referencia, sin llamadas de red. Mantener baseline tras D7 antes de C8 y actual tras C11 para mostrar delta de progreso. Poner dos métricas /100 con decimales, rubricarlas como *cumplimiento de capacidades portadas en código*, no porcentaje de clientes en nuevo transporte ni GO.

## Próximo injerto causa-raíz
C8 crea Y.Doc público NUEVO presembrado; no conectarlo directamente al YParty de catálogo precongelado por riesgo de reauthoring duplicado. C12 debe usar un Y.Doc inicialmente VACÍO y aislado + cap Owner `cat:read` + certificado C11 (frozenHead SHA) + lectura remota y comparación de paridad. No colocar doc Sync3 en proveedor. Sender typed -ops queda aparte. Fuente y cliente `src/yparty-piloto.js` y `docs/sync-yjs.js` con reservas: patch únicamente en nueva rama aislada y no sobrescribir trabajo concurrente; preferir módulo nuevo `src/port2-readonly-catalog-session.mjs` y ajuste mínimo a `src/ws-owner-ticket-params.mjs` para scope `cat:read`; cablear al producto evitando segundo writer y sólo con autorización.

## Test RED→GREEN y lanzamiento
Pruebas Node/browser contra módulos reales: cap solo lectura y cap nueva por reconexión, proof C11 válido/fallido/incorrecto, GET CORS, doc privado nunca pasa, cero transmisión local antes de HEAD, Y.Doc vacío después de read, clean close sin socket residual, falsos ACK rechazados. Confirmar que el bundle entregado no cambia si no se edita piloto. Gate GitHub exact SHA en rama real y suite integral. No marcar activación ni puntuar más por módulo si no entra al flujo activo; reporte de score debe describir la distancia exacta.

## No modificar
No tocar Sync3, permisos central Worker, source real Firebase, clientes físicos, switches Cloudflare/producción; mantener 0/6 GO hasta pruebas. Priorizar superpowers y Ponytail (menor cambio completo). Evidencias en workshop y Notion, código SOLO en friendly-123.
