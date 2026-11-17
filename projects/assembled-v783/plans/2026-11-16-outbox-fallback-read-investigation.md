# Investigación P0: lectura de respaldo reciente de outbox cifrado

Estado inicial: workshop main 21901e023a57c19430a4afb7f80cc1185d715ff7; auditoría comparativa 43999793625 en curso. No modifica producción, SW, clientes ni datos reales.

## Hipótesis por verificar
`sync-outbox.js` puede conservar una fila IndexedDB antigua cuando una escritura posterior falla y se guarda correctamente en localStorage. `leer()` parece elegir primero la fila IndexedDB si vuelve a estar disponible, dejando el respaldo más reciente sin leer. Esto es una hipótesis de lectura, no una afirmación de pérdida definitiva ni del comportamiento integral de ventas.

## Secuencia reproducible
1. Ejecutar el módulo real aislado con datos sintéticos: guardar A en IDB, provocar fallo de transacción en el guardado B, confirmar B guardado en localStorage, restaurar IDB y leer.
2. Repetir tras recarga del módulo y considerar borrado de respaldo, concurrencia, excepciones y cuota. Conservar resultado RED y causa antes de plantear parche. Revisar consumidores en avanzado-extra y pruebas #69/#70.
3. Cualquier corrección debe conservar ambas copias cuando no sea seguro elegir, preservar compatibilidad de formato, respetar commit y evitar pérdida en concurrencia. Test funcional real RED→GREEN y regresiones existentes; revisión cuidadosa; no desplegar.
4. Guardar evidencia, SHA, restricciones y pasos pendientes en este repositorio. La ejecución full sigue pendiente; no confundir almacenamiento local con ACK remoto o convergencia física.
