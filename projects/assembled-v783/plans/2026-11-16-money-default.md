# Dinero.js en la ruta real de nuevas ventas de la candidata

Base910affeea00dff41e7e6742242c4bf7d777228ce. Arquitectura importada ya aprobada: Dinero2.0.2 congelado, half-up decimal explícito para nuevas operaciones. No deployment, no clientes, PWA aplazada.

## Alcance y decisiones

La candidata ya carga el bundle, pero la venta solo lo usa con f123_dinero_qa=1; el reparto de asistente aún usa toFixed binario. Cambiar solo las llamadas de NUEVA venta: usar el componente disponible por defecto y permitir f123_dinero_qa=0 como rollback explícito. Componente ausente/fallido conserva el calculador histórico. Los splits guardados, correcciones/ediciones históricas y reportes no se recalculan con una regla nueva. No rehacer margen/aporte/mínimo ni el ledger en este paso.

Ruling: activar el cálculo importado disponible en la candidata para nuevas ventas, con override0 — JFC pidió pasar ya a los componentes aprobados y el bundle forma parte de la candidata — coste: en empates de medio centavo cambia respecto de toFixed binario; se exige evidencia literal y conservación de recibos históricos. No es una activación de producción.

Ruling: mantener seller+assistant como un redondeo y resto entero en centavos — conserva exactamente la comisión total y evita dos redondeos independientes — coste si se aplicara a historia: reescritura indebida; por eso solo la llamada de nueva venta recibe el parámetro de importación.

## Pasos

1. RED con backend real: nueva venta sin flag debe usar half-up; asistente debe recibir2 centavos de10 al15%, vendedor8; flag0 y componente ausente conservan compatibilidad; historia no muta tras habilitar componente/recarga.
2. Diff mínimo de repartir y aplicarRepartoAsistente, manteniendo nombres/orden y rutas de edición histórica; sin tocar vendor ni generados a mano.
3. GREEN focal y regresión de comisiones/margen/liquidaciones/devoluciones/centavos. Chromium/WebKit con la app completa, sin flag1 y sin red externa; comprobarrecarga e idempotencia opId.
4. Revisión independiente, CI por SHA exacto y publicación en repo común/Notion. Mantener gates de privacidad y comandos separados: el op legado de stock NO es venta financiera.

## Ledger

Pre-flight: solo calcularSplitVenta de nueva venta pasa imported=true; rutas históricas permanecen false. AplicarRepartoAsistente tiene otras llamadas de corrección: parámetro nuevo opcional false y true únicamente al crear venta. Mantener esa separación al revisar.

Ruling: el diseño inicial era incompleto para recibos nuevos editados tras rollback — guardar split.moneyEngine solo cuando el cálculo importado termina permite conservar su regla; recibos históricos sin marca conservan la anterior — coste: clientes antiguos no conocen la marca; no mezclar versiones ni activar clientes sin aceptación. La preparación de ediciones marcadas se hace antes de mutar venta/stock/crédito y rechaza503 si falta su componente. No se añade otro ledger.

Ruling: fallback de una venta nueva elige el calculador para TODO el reparto — si falla solo el asistente se recalculan comisión y partes con legacy antes del commit; nunca combinar total nuevo con partes viejas — coste: esa venta puede redondear un centavo distinto, pero queda sin marca Dinero y conserva coherencia. Un recibo importado ya guardado no hace ese fallback: rechaza la edición sin mutar.

Task1: RED2 original por default/asistente; RED de sello tras rollback; se corrigió el montaje VM (delete desde host no eliminaba el valor dentro del contexto) y se verificó un RED válido retirando temporalmente solo el guard, seguido de restauración exacta. Logs separados; el error inicial no acredita ausencia real del componente.

Task2: implementación real en mock-backend y adaptador importado; bundle regenerado con scripts/build-money-imported.cjs. Revisor independiente:3 Important (base binaria, reparto obsoleto por Object.assign, fallo del asistente bloqueando venta); los3 reproducidos RED y corregidos, focal16/16. Minor de VM corregido con aserción de ausencia interna. No re-review presentado como aprobación.

Ruling: cierre del día también crea recibos NUEVOS — añadir imported=true a esa única llamada, con RED0.43→0.44 y reintento mismo opId — coste: omitirlo dejaría dos reglas para nuevas ventas. Asistente vuelve a su firma original; decide por la marca del split, no por un argumento nuevo. La línea pre-flight inicial queda sustituida por estas decisiones verificadas.

Task3: financiero local con componente cargado234 casos,231 pasan y3 WebKit no arrancan por bibliotecas del entorno; Chromium completo por defecto, recarga y reintento pasa. npm test completo está en ejecución con salida a archivo; no afirmar verde global. Primera regresión con ruta de binarios omitida produjo17 fallos de entorno, conservada aparte. CI instala dependencias oficiales y repetirá los234 casos.

CI43873497777 sobre93991dc: SUCCESS483 ejecuciones,0 fallos/omitidas; financiero234/234 con Chromium/WebKit. El npm test completo local no terminó: se verificaron4 procesos con servidores que las fixtures abren antes de launch/try; falta de bibliotecas WebKit deja esos handles activos. Se interrumpió solo Node padre verificado y se conservó salida parcial, no PASS. Auditoría npm test en workflow separado preparado con entorno oficial; tiempos por test120000 sin cambios, no test-force-exit ni skips. Task3 financiero completo; comando global pendiente del nuevo workflow. Task4 fuentes/revisión/evidencia ya ancladas a main93991dc y Notion actualizado; cierre global aún pendiente.

Tras SIGINT se liberó búfer:2585 reportados,2349pass/132fail/101cancelled/3skip existentes. No llamar a los132 fallos previos sin compararlos. Ruling: auditoría completa en2 jobs independientes candidate/baseline910affee — misma configuración oficial, sin alterar baseline ni cancelación cruzada — coste: doble ejecución de QA, necesaria para atribuir regresiones; no acredita producción. No se atribuyen las cancelaciones por interrupción a defectos de app.
