# 2026-11-18 · Orden de injertos a partir de incidencias de Belén (idiomARTE)

## Fuentes primarias y fechas
- 15/oct, acta literal de 15 notas facilitadas por JFC (no hay audio original verificado): https://app.notion.com/p/3fa1642b67f381668834c2f402c925d6
- 24/oct, alerta genuina por cervezas descuadradas, ACK stock PN incompleto: https://app.notion.com/p/4031642b67f3814f9cb2fc3a5ee74e2e
- 24/oct, Safari quota en abonos, cerveza IPA 29/9 vinculada a cliente incorrecto, congelamiento/toques: https://app.notion.com/p/4031642b67f38194a024cea8832b105c
- UltraReview Nov18: https://app.notion.com/p/41c1642b67f381209690f76fe5c89e8c

## Scores versionados que NO se incrementan por planificación
- Arquitectura 67.0/100 calidad técnica (±4 juicio; 10/nov retrospectivo 45±5).
- PORT QA 57.0/100; 0/6 gates comercialmente certificados. No asimilar auth-dashboard v791 a migración 2.0.
- Fuente: projects/assembled-v783/quality/{PORT-STATUS.md,score-v1.json,port-v1.json} (pesos congelados).

## Prioridad P0: stock/ventas/recibo/convergencia, con aceptación de Belén
1. Sales: `ventaId/opId` único y recibo duradero + `stockPN` en el **mismo ACK**, también tras cierre antes de sincronizar. Inventario no cambia por cobrar abono. No usar ajuste a valor fijo para reparar divergencias.
2. Distintos dispositivos de la misma licencia: cold join nuevo lee hechos y último PIN/nombre desde almacenamiento duradero sin necesitar otra pestaña online; dos ciclos PC Opera→iPhone Safari→PC, incluyendo cierre/reinicio. Contrastar cada SKU (incl. cerveza) por **ID** y movimientos, no por nombre/cantidad estimada.
3. Diagnóstico causal actual: v791 post-release `hotfix` #44380915291: publish Pages & Chromium/WebKit smoke PASS, `recorrido / union-fria` FAIL. Log #135073905081 a 166s aún `pullMas:true`, 28 páginas y 5,348 frames, `pendingStructs + pendingDs`, 16 padres faltantes y Owner metadata ausente; esto es una recuperación INCOMPLETA, no prueba de stock perdido. Firebase 129 2xx, 12 4xx, 1 network error. Reproducir contra fixtures completos antes de cambiar cursor/replay/parents. No marcar el gate D/F como cumplido.
4. Estado fuente ya reparado en laboratorio: LIVE `test/v579-venta-pn-ack.test.js` comprueba PN antes de ACK, undo en rechazo, no sembrar stock provisional, ventas serializadas; no atribuir el descuadre físico de Belén a la misma causa sin comparar hechos.
**Próximo injerto**: cold-join scanner + bounded canonical snapshot import/readback sin hermanos Yjs pendientes, con E2E wire encryption; TDD con catálogo histórico y cierre por cursor/HEAD, no acortar pruebas ni simular ack.

## P0: fiados Safari, cliente cruzado
- `docs/plan-pagos-ui.js` guarda opId/intención en localStorage y falla **cerrado** al llenar cuota; esto evita cobrar sin referencia pero impide cobrar. `test/fiados-quota-cliente-4d.test.js` prueba no enviar pago ni asignar la venta a cliente equivocado. No es reparación de capacidad.
- Injerto siguiente: journal IDB por licencia/cliente/opId (Web Locks / transacciones atómicas / readback), migración de intención legacy read-only, preservar cuota llena y poder cobrar/reanudar sin doble envío, al confirmar ACK borrar solo el registro exacto; dry-run Chromium/WebKit cuota llena + crash/reopen + dos pestañas. Nunca reasignar las 5 cervezas IPA históricas sin evidencia original de venta/cliente.

## P0/P1: dinero / comisiones (notas #1, #5, #7-9, #15)
- Contrato: venta, costo, comisión devengada, pago al artista, gastos Cash/Transfer, Casa neta, percha y evento coherentes desde un solo ledger de centavos enteros y opId, sin descontar la comisión dos veces.
- Reconciliar By Product/By Rack/By Person, monthly sales & commissions, PDF y español para contador, no "números que no match".
- Probar producto con precio Reserva vs Walk-in ($15/$18 son ejemplos), parcial y devolución; casa vs artista; pagos en efectivo/transferencia.

## P1: fotos, crash, UX
- Facturas y fotos por SHA con lectura local prioritaria, timeout HTTP, fallbacks y sin gastar el cupo remoto durante semillado; no subir bytes sin E2E. Cotizar (0) como UNKNOWN cuando falta cobertura.
- Safari storage full, freeze y toques retrasados, PWA duplicada; QA interactivo y trazas sin identificar clientes; no atribuir hipótesis sin reproducción.

## Contención activación 2.0, paralela y obligatoria
- UltraReview #756 P0 uno/two RED #44383332467: plaintext Y.Doc -> Workerd y PIN pre-legacy. Fuente `src/yparty-piloto.js`, `docs/sync-yjs.js` aisladas en PR #765.
- GREEN #44383742152: no conectar raw YDoc, legacyReady exige pull certificado, no apply con debt. RED fotos HTTP en #44383967452; GREEN pendiente de comprobación sobre fe28314.
- Contención *no es cifrado YParty completo*. `yparty` sigue OFF. Ticket issuer permanece sin activación; E2E y restored cold join son los siguientes dos pasos medibles antes de permitir siquiera QA.
- No tocar datos de idiomARTE, ni publicar secretos/license/PIN ni purgar IDB. No inflar métricas ni certificar UAT por CI. 
