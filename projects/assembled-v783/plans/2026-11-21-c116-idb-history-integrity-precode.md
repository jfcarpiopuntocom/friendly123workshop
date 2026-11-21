# C116 PRECODE, 21 noviembre 2026, friendly-123 v0.8.39

Producto: misma app, Sync3 intacto. JFC ordena corregir y revisar tres veces. No fusionar ni desplegar esta candidata sin aprobación explícita. HEAD inicial master 353d18a6a504c1523582be79274dbd741c91a39f. 

## Defectos reales observables en el código
1. docs/estado-idb.js: _huella usa FNV-1a 32 bit + longitud para omitir puts. Hay una colisión concreta: notas 00iikdb0 y 01jsqfb2 producen igual huella sobre el bloque de 500 eventos aunque los bytes difieren. Si una modificación conserva la misma huella en el mismo proceso, el código puede confirmar _rev sin escribir el evento cambiado.
2. _leerCompleto usa r.result || [] y no valida len ni tipos de bloques. Un bloque ausente aparece como array vacío y la lectura se anuncia completa; riesgo de false ACK / pérdida al recuperar.
3. Reescritura de app antigua: con h:meta y mismo eventId, los bloques más viejos prevalecen sobre la versión inline más nueva. Contrato de reimportación por id incompleto.

## Test RED, parche Ponytail, GREEN y revisión triple
A. Playwright Chromium y WebKit sobre docs/estado-idb.js exacto: dos revisiones de historial con colisión FNV, bloquear false OK; lectura de historial con bloque borrado debe dar null y no un cuaderno truncado; actualización legacy inline del mismo ID debe preservar versión nueva. RED se captura en GitHub Actions en branch antes de modificar runtime.
B. Parche pequeño solo docs/estado-idb.js: si coincide la huella, comparar el bloque almacenado mediante lectura en la misma transacción antes de omitir put, con commit atómico; abortar si está ausente y pertenecía a un meta durable. Comprobar que cada bloque es array y que sum(len)==meta.len antes de confirmar lectura. Fusionar entrada inline más nueva por id, sin fabricar eventos ni tocar licencias/PIN/ventas.
C. GREEN sobre SHA de candidato + suites IDB, CAS, Safari, dinero, stock y release seal oficial. Score PORT100, calidad81.7 sin adjudicar puntos sin auditoría nueva. GO0/6, físico0/5. Actualizar metadatos release solo con herramienta oficial, sin publicar.

## Separación de trabajo
PR #900 diagnóstico Safari privacidad: eliminar e.message libre de registros (puede contener datos) y probar snapshot/logs adversariales; no cablear en shell ni atribuir cierre crash.
PR #630 documentos EGM: fechado v692, no tratarlo como gate actual ni fusionar sin relevo independiente.
