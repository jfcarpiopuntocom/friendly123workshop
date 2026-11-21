# C102 PRECODE · Prueba integral de Comisiones por persona contra ledger real
Fecha 2026-11-20 Ecuador. JFC ordena fast track.

C100 v0.8.31 #910 fue GREEN 25/25, pero su test de pestaña por persona usó un DOM y fetch de saldos ficticios. Falta comprobar con transacciones reales del mock-backend en navegador (sin tocar clientes): cuentas por payeeId en dos perchas, venta y pago parcial, segunda persona independiente.

Owner: Sol6. Archivo nuevo test/p0-c102-commissions-person-real-ledger-browser.test.js. No tocar código de clientes, Sync3, ventas, fotos, permisos ni stock. Solo si el test descubre RED de producción se permite arreglo mínimo en docs/commissions-by-person.js con v0.8.32 y sellado SHA/manifest.

Acceptance: Chromium y WebKit móvil 390x844 ES/EN; seed sintético Ana en dos racks y Beto en otra; compare earned/paid/held/due exactos desde GET REAL /api/liquidaciones, no stub; verificar dropdown persona y mes, dos tratos Ana; abrir pago de segunda percha a misma Ana, sin realizar nueva salida; no crear pagos hasta confirmación; re-render conserva vista y mes. Preserve old #910 tests. A/B browsers isolated and no external requests.

Run tests RED->GREEN GitHub Actions exact SHA, document artifacts, merge only green; publication only if source changed and version/check-sw exact. Metric transition 94.0/100, quality 80.4/100, GO 0/6, physical 0/5.