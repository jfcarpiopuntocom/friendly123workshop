# P0 Gate E · navegador real IndexedDB / Web Locks y failback
Fecha: 2026-11-17 Ecuador. Responsable de este corte: Sol6. Sin deploy. Plan persistido ANTES del test o runtime.
Base exacta: `friendly123workshop/main@428a4d476acfe8749515ded07ad344f4aaaed649`. Archivo de código observado `app/docs/sync-yjs.js` blob `7d98526e431980d5b3b5f4a5f4fdb3336e0c7827`. No sobrescribir archivos reservados: `app/docs/sync-yjs.js`, `app/src/yparty-piloto.js`, `relay/injertos/yparty-worker/src/index.js`, `docs/sync-outbox.js`.

## Orden JFC/Opus congelada
Métrica ingeniería 67.0/100 (+22 desde 45 estimado 10-Nov). Port 36.0/100, E=3/10, GO 0/6. No puntuar pruebas que no demuestren un stage completo; seis gates A20/B20/C10/D25/E10/F15 permanecen fijos. Tres bloques, ningún gate nuevo. Port stage `idb-outbox-web-locks` 0/5 hasta probar con evidencia idónea.

## Prueba primero (sin algoritmo copiado)
Crear `app/test/p0-gate-e-native-idb-browser.test.cjs` para ejecutar dentro de Chromium y WebKit el segmento ACTUAL `var _v2DB...function mutarOutbox...` extraído de `app/docs/sync-yjs.js` (sin sustituirlo por una implementación parecida), usando IndexedDB real de cada navegador y DOS páginas del MISMO origen. Instanciar dos closures por página o pestaña, cada una con su propia `_unsaved`, sin navigator.locks. Base con object store `custom`, rollout v2 activado y meta persistida. Cobertura TDD:
1. A/B escriben `op-A`, `op-B` concurrentemente; tercera pestaña cierra/reabre y recupera ambos.
2. A ACK `op-A` mientras B añade `op-C`; tercera pestaña recupera B,C y tombstone A, nunca resucita A.
3. Fallo de IDB o cierre de DB rechaza mutación y deja opId pendiente y ninguna señal de durabilidad.
4. Repetir con Web Locks NATIVOS cuando existan y, cuando no existan o se anulen en el harness, usar fallback de transacción atómica. Comparar exactamente las mismas operaciones.
5. No depender de endpoints de red reales, PIN, licencias o datos de clientes.

## Resultado/reparación
Prueba RED primero si detecta condición real: guardar SHA, run y TAP. Corregir SOLAMENTE el código mínimo necesario después de revisar y liberar explícitamente reserva; nueva PR separada si toca archivo compartido. GREEN nativo exige ambos motores Chromium y WebKit sobre HEAD exacto, sin skips; escribir resultados en `reports/`, revisar CI integrada y no añadir puntos si solo valida aislamiento de prueba. Registrar el porcentaje únicamente mediante `quality/port-v1.json`, `port.cjs` y `PORT-STATUS.md`, bajo rúbrica existente.

## Safety
Este test no activa pilotos, no publica en Cloudflare, no despliega app y no modifica datos reales; `friendly-123` LIVE queda fuera. No confundir WebKit Playwright con Safari físico. Sin dos ciclos físicos Opera/iPhone, GO comercial siempre 0/6.
