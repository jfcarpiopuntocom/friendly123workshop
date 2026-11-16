# Dinero.js en ventas reales de la candidata: default, sello y fallback coherente

## CI financiera y de integración confirmada

[CI43873497777](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43873497777), código **93991dc2cac9fefa51662fb586817345d56d72fb**, terminó SUCCESS: **483 ejecuciones de casos,0 fallos/omitidas**. [Log íntegro](../evidence/ci-43873497777.txt). Son varios contextos de ejecución, con pruebas repetidas deliberadamente con/sin componente en fixtures; no483 escenarios únicos. Desglose por lote:105 autoridad/contratos,8 comerciales browser,5 doble pestaña,22 cancelación/fiado/stock,28 dinero/reportes previos,234 financiero ampliado,33 fotos/backup,21 roles/recuperación y27 cliente/relay.

El financiero ampliado pasó **234/234**, incluidos Chromium y WebKit con la app completa por defecto, recarga y reintento. Resuelve la limitación de bibliotecas del entorno local para ese lote, conservando sus logs fallidos anteriores. No resuelve por sí solo los demás gates de arquitectura/producción.

## Auditoría completa del comando npm test: local detenido, CI separada preparada

El npm test local se ejecutó con la ruta correcta de binarios y el componente presente. Se quedó sin avanzar después de497 pases visibles y varios fallos WebKit. Se inspeccionaron sus procesos: cuatro archivos de tests permanecían activos entre2 y11min aunque los tests ya habían informado error. Sus fixtures abren un HTTP server y hacen await engine.launch ANTES de entrar en try/finally; al fallar WebKit por las bibliotecas ausentes, ese servidor queda abierto y el proceso no sale. No atribuir esa falta de terminación al dinero nuevo ni presentar el lote parcial como PASS.

Se envió SIGINT exclusivamente al proceso Node padre verificado del comando propio, se conservó la salida [parcial](../evidence/issuer/money-default-full-project.txt) y [diagnóstico acotado](../evidence/issuer/money-full-local-blocker.json). La terminación fue exit1; no una ejecución completa ni un verde. No se bajaron aserciones, se añadieron skips ni se usó test-force-exit.

Al interrumpir, el reporter liberó también la salida que tenía en búfer: **2585 casos reportados,2349 pasan,132 fallan,101 cancelados,3 omitidos existentes**. No se atribuyen los132 fallos a entorno sin examinarlos: hay que contrastarlos por nombre en un runner completo. Los101 cancelados y errores de promesa pendiente posteriores pertenecen a la interrupción, no acreditan por sí mismos101 defectos del producto. Los497 pases eran los visibles antes de liberar el búfer, no el total final reportado.

Se añade un workflow separado `.github/workflows/assembled-full-audit.yml`: instala los lockfiles y bibliotecas oficiales Chromium/WebKit, y ejecuta el npm test completo existente en Ubuntu/Node22 con el componente presente. Mantiene intactos los120s por test del package.json; su presupuesto de job45min es para el lote completo nuevo, no modifica un límite de rendimiento ni el workflow previo20min que ya pasó. No hace deploy ni recibe secretos/perfiles reales. Su resultado aún está pendiente. El comando del package no incluye .mjs; autoridad y relay .mjs permanecen cubiertos por la CI de integración separada.

La auditoría tiene dos jobs independientes, sin cancelación entre ellos: candidata y baseline910affee (main antes de dinero). Ambos usan lockfile y browsers oficiales del árbol respectivo. Así se podrán separar fallos comunes y regresiones nuevas sin asumir que un test ya estaba roto. No se modifica el baseline ni se usa un resultado anterior como si fuera la candidata.

## Cambio concreto

El bundle Dinero2.0.2 ya estaba congelado y cargado por index.html, pero el backend solo lo usaba con f123_dinero_qa=1. Ahora las nuevas ventas de la candidata usan el componente disponible por defecto, tanto para la comisión como para el reparto de asistente. El cierre del día también crea recibos con esa regla. f123_dinero_qa=0 permite iniciar nuevas ventas con el calculador anterior; si falta/falla el componente se conserva ese camino de continuidad.

No se publica la candidata en Pages ni se activa una tienda. No se cambian los stores, opId, PIN, roles, namespace, importe/stock de una venta ya confirmada, ni la app histórica. No se modifica el componente vendor: el adaptador utiliza Dinero real y el bundle se regenera con el script existente. No se añaden dependencias ni se escriben generados a mano. PWA/SW siguen aplazados por la orden vigente.

El alcance financiero es porcentaje, normalización de la base monetaria y reparto del asistente, conservando las reglas de origen de trato, margen, aporte, mínimo, escalas y permisos. No se presenta como migración de cada cálculo de toda la contabilidad.

## Evidencia RED→GREEN de la ruta real

Se usa el backend real mediante sus rutas de producto/venta/exportación; datos sintéticos y red prohibida.

- Venta0.10 con comisión15% sin flag: antes0.01, después0.02; neto0.08.
- Comisión0.10 con asistente15%: antes0.01 de asistente, después0.02 y vendedor0.08. Se redondea una parte y el vendedor recibe el resto en centavos; no hay dos redondeos independientes.
- Venta0.29 ×3 al50%: la multiplicación JS entrega0.8699999999999999. Antes el componente calculaba0.43 sobre esa cola aunque el recibo decía bruto0.87. Ahora Dinero normaliza la base a87 centavos antes de multiplicar: comisión0.44 y neto0.43.
- Cierre del día con ese mismo producto/cantidad también pasa de0.43 a0.44, con una sola venta y stock5 desde8 tras repetir el mismo opId.

[RED inicial](../evidence/issuer/money-default-red.txt), [RED de revisión](../evidence/issuer/money-review-red.txt), [RED cierre](../evidence/issuer/money-day-close-red.txt), [GREEN focal final16/16](../evidence/issuer/money-default-final-focal.txt). Cero fallos/omitidos en ese último lote.

## Contrato sellado y recuperación

El rollback solo decide la regla de una NUEVA venta. Un recibo importado ya confirmado conserva split.moneyEngine=dinero-2.0.2-half-up; una corrección posterior aplica esa misma regla, aunque se haya activado el override0. Los recibos históricos sin marca conservan su cálculo anterior: cargar el componente no reescribe el historial ni convierte sus reglas por inferencia.

Se reprodujo que corregir el mismo15% después del rollback cambiaba0.02 a0.01. El arreglo conserva0.02. También se prueba editar cantidad de una venta con asistente: comisión0.30, asistente0.05 y vendedor0.25, conservando la regla del recibo.

Si el cálculo de un recibo marcado no puede cargarse, una edición que necesita recalcular se prepara antes de tocar stock, venta o crédito. Devuelve503 sin cambios. No se bloquea una venta nueva legítima por falta del componente: esa nueva venta puede usar legacy. No se interpreta la indisponibilidad de sync ni del componente como permiso para borrar una venta ya durable.

La prueba de ausencia tuvo inicialmente un error del arnés: delete sobre el objeto host del VM no quitaba el valor dentro de window del contexto. Se corrigió asignándolo desde el VM y comprobando typeof===undefined. Luego se retiró temporalmente solo el guard de preparación, se observó un RED válido (500/mutación potencial en vez de rechazo previo503) y se restauró exactamente la fuente. [Countertest válido](../evidence/issuer/money-sealed-corrected-vm-red.txt). No contar el montaje anterior como prueba válida de ausencia del componente.

## Revisión independiente y fallbacks

El revisor de contexto limpio encontró3 Important y1 defecto menor de la prueba; no Critical. Los3 Important tienen reproducción y arreglo:

1. Base con cola binaria: se normaliza a escala de moneda dentro del adaptador Dinero antes del porcentaje.
2. Asistente archivado: el cálculo preparado eliminaba reparto, pero Object.assign no borraba la propiedad anterior. Ahora se reemplaza el split preparado completo; una comisión corregida a0.05 no puede conservar partes obsoletas que sumaban0.10.
3. Fallo solo del asistente: el total importado se marcaba antes de terminar las partes y el error devolvía500, impidiendo una venta nueva. Antes del commit, ahora se vuelve a calcular TODA la comisión y su reparto con legacy, sin marca Dinero. No se mezclan calculadores. La prueba inyecta ese fallo alrededor del adaptador genuino y exige una sola venta, mismo opId y una sola baja de stock.

El contrato es asimétrico por necesidad: nueva venta sin componente puede usar el fallback anterior; un recibo importado ya sellado no puede cambiar de regla en silencio al editarse. Debe conservarse y requerir recuperar su componente. La UI muestra un error de recálculo/reintento, sin detalles de implementación irrelevantes.

No hubo segunda revisión presentada como aprobación. Los hallazgos se verificaron por pruebas y suite. Mantener una versión antigua en otro dispositivo editando recibos marcados no queda aceptado por este trabajo: la aceptación A→B→A y mezcla de versiones siguen abiertas.

## App completa en navegador y regresión financiera

Las pruebas nuevas cargan index.html completo con el componente real, sin flag de opt-in. En Chromium se crea una venta a15%, se cambia el producto usando su ruta PATCH real, se crea otra con asistente y se repite el mismo opId. Se recarga la misma página/perfil y se reenvía el opId: siguen dos ventas, stock2 desde4, primera venta idéntica, comisión0.02 y asistente0.02. Es backend real sobre persistencia de navegador, no un doble de transporte. No implica autenticación de negocio real: la fixture usa rol local sintético y bloquea toda red externa/WS y Service Worker.

Los primeros intentos del arnés usaron PUT para cambiar un producto; esa ruta no edita ese campo. Se corrigió al PATCH que usa la app. Esos dos logs de preparación no son bugs de dinero ni RED de producto; las aserciones monetarias permanecen.

La regresión financiera carga el bundle también en los VM mediante F123_QA_IMPORTED_MONEY=1, reflejando el orden de index.html y evitando probar inadvertidamente el calculador viejo por ausencia del componente. Ejecutó **234 casos:231 pasan y3 fallan por WebKit local sin bibliotecas de sistema**,0 omitidos. [Log financiero completo](../evidence/issuer/money-default-full-financial.txt). Fallos identificados: statement/contactos EN/ES, payout parcial móvil y el nuevo caso WebKit de comisiones por defecto. Se conservan para contrastar en CI con dependencias oficiales.

Una primera regresión omitió PLAYWRIGHT_BROWSERS_PATH:204/221 pasan y17 fallan por no encontrar el ejecutable. El comando se corrigió para usar la ubicación ya instalada, sin cambiar versiones. [Ese log](../evidence/issuer/money-default-regression.txt) es error de configuración de ejecución, no resultado final de producto.

El comando completo npm test está en curso en esta entrega; su salida se guarda aparte. No se presenta como verde ni se extrapola el resultado de la regresión financiera al proyecto entero. El workflow conserva todos sus checks anteriores y añade este lote234 con componente presente y los dos motores instalados. Debe acreditarse por SHA exacto de CI.

## Lo que no se cambia por este paso

El evento de stock legado no representa una venta completa y aplicarOpRemota lo neutraliza para impedir doble conteo. No se usa ese evento como ACK comercial ni se fabrica otro ledger. Las fronteras de lectura por rol, comandos comerciales autorizados, ACK remoto de fotos, incidentes de revocación/awareness, failback y aceptación física siguen pendientes de integración. Un verde de dinero no autoriza ese cutover ni un despliegue.
