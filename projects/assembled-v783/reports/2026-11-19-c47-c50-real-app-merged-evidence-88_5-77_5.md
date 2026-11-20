# friendly-123 1.0→2.0 · C47+C50 CERRADAS con evidencia real

Ecuador 2026-11-19, UTC 2026-11-20. **Mismo producto** jfcarpiopuntocom/friendly-123. Workshop = almacén persistente de planes/pruebas, nunca producto separado. Sync3 se conserva.

## C47: reparación de seguridad y durabilidad de sesión/rol en la app real

- [PR #845 C47](https://github.com/jfcarpiopuntocom/friendly-123/pull/845) **MERGED**, SHA master **2172eeae497cc62b96b60d86588418a6ee21fddf**, código v0.8.20 shell v820/golden356.
- Archivo de producto modificado y sellado con SHA256 en manifest: `docs/sync-yjs.js`; pruebas `test/p0-c47-auth-role-switch-20.test.cjs`. `OCAuth.rolActual()` y `OCAuth.esDemo()` ahora validan que `oc-login` no pueda reclamar un rol distinto de la sesión real; guard `API.__authEpoch20` impide que una activación asíncrona reestablezca un writer tras logout, con failback al legado.
- [GitHub C47 RED](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44664213110): 18/21 PASS, **3/21 FAIL** (rol Owner falsificado; demo falsa; activación tardía tras logout). [GitHub C47 GREEN](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44664840437): **21/21 PASS**; full CI final candidato SHA `5ece69610e8e9ae6383a06495b37abacd7f75725`: **52/52 GREEN**, incl. C38 barrera doble writer, C46 fotos, pin, stock, browser Chromium/WebKit y release-control.
- Cloudflare Workers Builds autenticado en cuenta productiva: exact C47 merged SHA **SUCCESS**, build UUID `6a1e7226-1cf9-4801-9cc5-5500611a1fa5` (build test ≠ habilitación comercial).

## C50: auditoría puntuación FIJA tras PR real fusionada

- [PRECODE guardado antes de editar](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-19-c47-postmerge-fixed100-role-score-precode.md).
- [PR #848 C50](https://github.com/jfcarpiopuntocom/friendly-123/pull/848) **MERGED** SHA master **80da1366304b7c5e848a4dadb7abbb34885167da**, puntuación en los JSON originales del PRODUCTO. TDD RED real [run 44667870635](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44667870635) `88 !== 88.5` antes de modificar scorecards; **GREEN 11/11 workflows** SHA candidato `cebf73cd2adb69c8cf39830d7fe2024ed2901738`, incluye score source-manifest guard y release-control. Cloudflare Workers Builds autenticado: exact SHA master C50 **SUCCESS**, UUID `c0f47679-6b33-463f-8931-2468e3a5bbae`.
- Rúbrica **sin cambio de pesos**, total100.0: `identity-rooms` original14.0, milestone `commercial-role-switch` pendiente1.5 dividido en `real-auth-role-epoch-qa-c47` **0.5 DONE** (fuente real `docs/sync-yjs.js`, evidencia pinneada a SHA C47 merge) + `commercial-role-switch` **1.0 PENDING** para validación comercial y aparatos.
- **Migración de arquitectura 1.0→2.0: 88.0 → 88.5/100.0 (+0.5)**; **calidad arquitectónica: 77.3 → 77.5/100.0 (+0.2)** por seguridad `security` 10.3→10.5/15, regresiones adversariales RED→GREEN. Base post-D7=68.5; avance acumulado +20.0 en capacidades ensambladas. **11.5 puntos todavía pendientes**. Comparar SHA master C50 del score con SHA master C47 `assessedProductSha`: el segundo identifica **el código medido**, el primero registra la auditoría que lo acredita.
- **GO comercial0/6 y aceptación física0/5**. Switches 2.0 QA OFF. No activación de clientes, nuevas escrituras a R2 ni estado histórico por el mero merge. No puntuación por el reporte simulado Hermes.

## Reporte '33 minutos adelantado' y ledger

El reporte `Reporte de Situación Post-Ejecución (Simulada)` no contiene SHA, PR, ejecución o log verificable para las tres afirmaciones: nuevo `sha256(clientId+sequenceNumber)`, dashboard paginado SQLite DO, cola atómica fiado+comisión; `C:\00 Projects\00 friendly-123\qa\sol6-execution-sim.log` no estaba montado ni accesible. La misma auditoría Hermes v509-v521 fue leída desde Library e investigada: [triage](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/reports/2026-11-19-hermes-v509-v521-predictive-audit-triage.md). No aceptar estas simulaciones como producción.
El P0 contable objetivo es `docs/core/ledger.js::dedupe`: elegir JSON mínimo si mismo ID y diferentes importes. [PR #841 product RED](https://github.com/jfcarpiopuntocom/friendly-123/pull/841) 5 fallos adversariales reales; [PR #14 privada QA GREEN 29/29](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/14) sobre fuente reservada por otro dueño; falta injerto en producto + UI de totales no definitivos y pruebas reales. Mantener reserva de otro agente, evitar abrir duplicados.

## Cierre y siguiente causa raíz, una sola línea

Producto actual v0.8.20 con C47 y C50 fusionadas. Próxima acción: terminar el frente existente de reconciliación contable o revisión de [PR #847 C49 fotos](https://github.com/jfcarpiopuntocom/friendly-123/pull/847) según reservas, sin otro producto, sin inventar cambios, priorizando causa raíz, fuente histórica real y pruebas PC↔Safari/PWA×2. NUNCA otorgar GO sin esas pruebas.
