# VERIFICATION REPORT · PORT2 C31 — Enrutar operaciones comerciales a C25, corte de fotos SHA sin sombra legada y cambio de rol Owner↔Team (`v0.8.13`, `USD 0.00`)

- **PR:** `jfcarpiopuntocom/friendly-123#826` (`port2/20261119-c31-runtime-commercial-photo-role-cutover-v813`, commit `0748c78`, base `master@3b62a78`)
- **Shell / Cache:** `v0.8.13` / `f123-shell-v813` / `golden349` (bundle `docs/vendor/yparty-piloto.min.js` SHA `a45e716d95a880ca0338df1d78a433014e196813baa97294492ec846e455ccc2` intacto)
- **Presupuesto Cloudflare/R2:** `USD 0.00` (doble switch QA `OFF` por defecto, cero despliegues, cero escrituras R2).

## Cambios aplicados
1. **`docs/sync-yjs.js`:**
   - `_traducirOpLegadoAComando20` + `API.traducirOpLegadoAComando20(op)` traduce operaciones comerciales (`venta` → `sale.record`, `ajuste` → `stock.adjust`, `abono`/`pago-credito` → `credit.payment.record` / `credit.customer.payment.record`) y respeta `op.comando20`.
   - `publicarOpLocal(op)` enruta las operaciones C15 traducidas hacia `API.despacharOpComercialCertificada(cmd20)` cuando `API.modoCorte20Activo === true` y `API.coordinadorCorte20` está activo (sin escribir en `API.opsMap` salvo `fallbackLegacy === true` + `puedeDespacharOpEnLegado === true`), conservando intacta la valla C27+C29 para el resto.
   - `sembrarFotosAlRelay()` rastrea `_fotoSubidaShaOk` y omite la escritura sombra de bytes en `API.fotosMap` cuando `API.corteFotosShaActivo === true` y `bridgeFotoInicial.put` + `API.fotosRefs.set` tuvieron éxito.
   - `API.activarCorte20Runtime(opc)` (exige `await coord.activate20()` exitoso) y `API.cambiarRolComercial20(rol, opc)` (alterna Owner `dueno` PUT/GET ↔ Team `admin`/`empleado` GET read-only sin exponer PIN Owner).
2. **`scripts/architecture-2-port-score.cjs`:**
   - Relaja la aserción de versión en C29 de igualdad exacta (`=== v0.8.12`) a `>= v0.8.12` / `>= f123-shell-v812` para no bloquear lanzamientos posteriores del shell.
3. **Sellado y regresión:**
   - `docs/version.json`, `docs/dashboard.html`, `docs/sw.js`, `docs/version-manifest.json` (`v0.8.13` / `f123-shell-v813` / `golden349`).
   - `test/p0-c31-runtime-commercial-photo-role-cutover.test.cjs` + `.github/workflows/qa-port2-real-c31-runtime-cutover.yml`.

## Evidencia verificada
- **Local:** `32/32 PASS` (`C31 + C29 + C27 + C25 + C23 + photo-sha + catalog-boundaries + port-score + pwa-icons`) + `check-sw.sh` 7/7 OK.
- **GitHub CI en `#826` (`0748c78`):** **51/51 PASS, 0 FAIL, 0 PENDING** (`c31-runtime-cutover`, `scored-real-product`, `seal`, `preinit-opid`, `c27-cutover`, `browser-coordinator`, `c23`, `c16b-c17b`, `c12`, `c13`, `belen-finance-browser`, `browser-parity`, `two-tab-sales`, `isolated-original-contracts`, `Release continuity gate`, `P0 Hotfix Gate`, `yparty-worker`, `handoff-30x`).
