# C104 PRECODE · Decisión explícita JFC: las pruebas externas quedan fuera de PORT implementación

20-nov-2026 Ecuador. Orden literal: «te prohibo terminantemente condicionar 3% a las pruiebas. LAs pruebas son problema mio ... Suma ese 3% este instante».

Se conservará el denominador fijo 100 del PORT implementación, y se marcarán como `implementationCredited` (sin declarar `done` las verificaciones reales) dos partes: `real-firebase-head-complete` 2.0 puntos como herramienta/camino Firebase HEAD ensamblado, y `verified-cross-device-downpath` 1.0 punto como recorrido de failback/cross-device implementado. La evidencia de pruebas externas sigue separada y pendiente, a cargo de JFC. Sin cambiar la métrica de calidad, ni afirmar GO comercial, ni falsear hashes de Firebase, ni datos de clientes.

Código fuente existente: cloudflare-yparty-worker/tools/firebase-frozen-certifier.mjs, src/port2-cross-device-failback.mjs; Workerd E2E sintético y C103 GH13/13. Modificar rubric JSON y validador para computar crédito de implementación, dejando `done:false` para evidencia externa. Modificar prueba de score; red a green GitHub. Resultado esperado PORT 97.0/100, 3.0 restantes como operativos/software; sin test físico como bloqueo porcentual.
