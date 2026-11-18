# LIVE dashboard D1 · evidencia reproducible y puerta comercial congelada
Fecha local 17 noviembre 2026 (Ecuador). Unidad de JFC con prioridad mañana: D1 filtros por columna y totales sin rediseño. Baseline workshop/main@95b64738c3318a1b9ef11afe8c36d15813671f85.

## Plan FIRST
- [Plan previo a editar](../plans/2026-11-17-dashboard-d1-live.md), origen commit e92cf618c98e23ff164ac00c578ddf2b4ffe2df3, [workshop PR #102 MERGED](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/102), SHA 95b64738c3318a1b9ef11afe8c36d15813671f85.
- [Guía Opus 5.5 última decisión JFC](https://app.notion.com/p/41b1642b67f381fbab5cf45ac55aabd3): dashboard para mañana; UI/UX actual, no nuevos modales; 16 textos ES/EN aprobados; después clase A outbox, Safari, cursor, etc.
- No tocar LIVE master sin GO de cinco compuertas y VA JFC.

## Código y pruebas fuente real
- [LIVE PR #744 DRAFT](https://github.com/jfcarpiopuntocom/friendly-123/pull/744), base master@45757cac5d9268402049c0fba90cccdece150ac6, rama feat/20261117-dashboard-d1-column-analysis. El código D1 usa Tabulator 6.3.1 existente: filtros encabezado, rango inclusive numeric `2..5`, bottomCalc de montos y unidades aditivas filtradas, nada en precios unitarios ni porcentajes, cero si observado y '—' si unknown. Sin cambios a negocio, datos, PIN ni sync.
- [TDD RED run 44232048703](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44232048703): 0/5.
- [TDD GREEN run 44232187076](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44232187076): 5/5.
- Test añadido sobre artefactos oficiales: min JS/CSS coinciden byte-hash de docs/version-manifest.json y página carga el min JS.
- [Construcción oficial run 44232307731](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44232307731) PASS: node scripts/build-dashboard-entry.cjs + --check, node scripts/gen-manifest.js; bot commit SOLO en branch PR, no master.
- Primer build del candidato versión tenía shell v781 reutilizado; se arregló solo en branch con docs/version.json v0.7.82, shell f123-shell-v782, golden318, SW y meta dashboard mismo shell. [Segunda construcción oficial](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44233016708) PASS con node scripts/release-control.cjs validate origin/master, check-sw.sh y manifest creado SOLO por script. Bot guardó artefactos.
- Commit [bde9857f](https://github.com/jfcarpiopuntocom/friendly-123/commit/bde9857f7adfbcaafe05e8fe27193c5420a825bc): P0 Hotfix Gate, release continuity, hex-boundary, verify-twice, browser-parity, mixed-shell, integrated, two-tab-sales, d1-source y demás checks ejecutados PASS.
- [release/ui-contract.json](https://github.com/jfcarpiopuntocom/friendly-123/blob/feat/20261117-dashboard-d1-column-analysis/release/ui-contract.json): aprobación textual JFC para 16 rótulos ES/EN; D1 aún no introduce nuevas etiquetas visibles excepto versión.
- Prueba QA extra del Tabulator 6.3.1 real con Chromium/WebKit y cuatro filas sintéticas `test/p0-dashboard-d1-tabulator-browser.test.cjs`, workflow `p0-dashboard-d1-browser.yml`. Primera corrida [44233431699](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44233431699) falló por **safe.directory del GitHub Actions container ANTES de ejecutar test**, NO hay veredicto de app. Workflow corregido commit 96cae598837632440f6762be09d721019adb04ca y [nuevo run 44233577955](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44233577955) en progreso al escribir. NO llamar GREEN todavía.

## Bloqueos y failback
- NO fusionar ni publicar LIVE: aún falta prueba física iPhone Safari con licencia QA, SHA servido exacto y VA explícito de JFC. Ningún cliente/venta/test físico tocado, master permanece v0.7.81.
- UI ES/EN conserva estructura actual; no mostrar totales si alguna cifra falta. Esta unidad no implica dato certificado desde Firebase ni repara coldjoin.
- Puntajes del port 2.0 NO se mueven: calidad arquitectónica **67.0/100**, culminación **41.0/100**, seis gates A20/B20/C10/D25/E10/F15 **0/6 GO**, no añadir stages ni atribuir puntos a D1.
- Para revertir: revert de cambios D1 y nueva versión QA antes de merge, regenerar build/manifiesto SOLO con scripts oficiales. No muta base, llave ni servidor.
- Siguiente: terminar browser nativo; validar cadena de release en HEAD exacto; JFC prueba en su iPhone y da VA si procede. Luego D2 periodos rápidos, D3 beneficios/costos con worker existente y D7 contra cuelgues, más clase A sync y puente YParty.
