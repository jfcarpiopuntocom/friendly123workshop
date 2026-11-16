# Procedencia de QA navegador

Fuente Sol6: friendly-123-injertos commit5006264a6053b93fbae5bccbb40336a5802b0ffa (suite117 verde sobre v782). JFC trasladó el coding a friendly123workshop el16 noviembre2026. Solo se trasladaron estos dos scripts sintéticos, no notas privadas ni el repo entero.

- browser-first-commercial.test.cjs original SHA256:3aea85635e51e28d94e8e5058db53c5c2d6c35ef06ed363d0d071ddb00f669de.
- adjust-legacy-static-assertion.cjs original SHA256:4eb3ea6424ea9b226457b2d11400860659bbb8b95f5705c357a6adf185440b58.

Cambio local del primer arnés: engine.launch pasó dentro del try/finally y browser.close es opcional. Motivo observado: si WebKit no arranca por bibliotecas ausentes, se dejaba abierto el servidor localhost y el runner no terminaba. No se cambió ningún gesto ni aserción comercial.

El adaptador CAS se aplica solo a la copia efímera del test en CI. La aserción exige ahora explícitamente completo, _localRev, _commitLocal, opIdVenta; no modifica app ni elimina comprobaciones. No atribuir117PASS al taller hasta leer la ejecución exacta.

Instalación WebKit local: binario presente, faltan GTK4/Graphene/Harfbuzz-ICU/Manette/Hyphen/GLES. El instalador oficial install-deps webkit llegó a su y falló por autenticación: no hay privilegio de root disponible. Esta evidencia se conserva. CI usa el instalador oficial en ubuntu24.04, donde sí puede preparar esas bibliotecas; no hay shim ni sustitución de motor. Producción y datos reales no se usan.

Para esta candidata se añadió F123_QA_IMPORTED_MONEY=1: activa el adaptador Dinero BigInt en initScript y comprueba que esté cargado antes del recorrido. CI lo habilita para los ocho casos. Así no se atribuye cobertura del injerto a una ejecución que lo deja apagado. Workbox/PWA siguen fuera de esta ronda.
