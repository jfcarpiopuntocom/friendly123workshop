# PRECODE · PORT2 C31 — Enrutar operaciones comerciales a C25, corte de fotos SHA sin sombra legada y cambio de rol comercial Owner↔Team (`v0.8.13`, `USD 0.00`)

- **Base:** `jfcarpiopuntocom/friendly-123` `master@3b62a78` (`v0.8.12`, `PORT 84.0/100.0`, `Calidad 75.8/100.0`, `GO 0/6`)
- **Reserva Notion:** `41d1642b-67f3-813b-a72d-ccf95dba3c26` (`Estado: En curso`)
- **Presupuesto autorizado:** `USD 0.00` (cero cambios en Cloudflare/R2, cero despliegues, doble switch QA `OFF` por defecto).

## 1. Problema y objetivo (Ponytail `full`)
Tras C25 (`#820`), C27 (`#822`), C29 (`#823`) y C30 (`#825`), `docs/sync-yjs.js` expone `API.crearCoordinadorCorte20`, `API.despacharOpComercialCertificada`, `API.puedeDespacharOpEnLegado` y `API.activarClienteFotosShaCertificado`, pero aún falta conectar el corte real en runtime cuando el piloto 2.0 está activado:
1. **`publicarOpLocal(op)`** solo aplica la valla `canDispatchOnLegacy(op.opId)` y escribe en `API.opsMap` legado; nunca traduce ni enruta operaciones comerciales (`venta`, `ajuste`, `abono`) hacia `API.despacharOpComercialCertificada`.
2. **`sembrarFotosAlRelay()`** siempre ejecuta shadow-write a `API.fotosMap` legado incluso cuando `bridgeFotoInicial.put(hash, dataUrl)` y `API.fotosRefs.set(hash, ref)` tuvieron éxito.
3. No existe helper unificado de activación (`API.activarCorte20Runtime`) ni de cambio de rol comercial (`API.cambiarRolComercial20`, Owner `dueno` PUT/GET ↔ Team `admin`/`empleado` GET read-only) sobre `API.fotoSha` y `API.coordinadorCorte20`.

## 2. Diseño mínimo completo (sin tocar `src/yparty-piloto.js` ni recompilar bundle)
En `docs/sync-yjs.js` (detrás del doble switch QA `OFF` existente):
1. **`API.traducirOpLegadoAComando20(op)` + enrutamiento en `publicarOpLocal(op)`**:
   - Si `op.comando20` viene ya construido con el esquema C15, se valida y usa directamente.
   - Si `op.tipo === "venta"`, traduce a `{ opId, license, kind: "sale.record", productId, quantity, amountCents }` (cuando `productId`, `quantity >= 1` entero y `amountCents >= 0` entero son válidos).
   - Si `op.tipo === "ajuste"`, traduce a `{ opId, license, kind: "stock.adjust", productId, quantity, amountCents: 0 }` cuando `quantity >= 0` entero es válido.
   - Si `op.tipo === "abono"` o `"pago-credito"`, traduce a `credit.payment.record` (`receivableId`) o `credit.customer.payment.record` (`clienteId`, `opId: "customer-payment:..."`) cuando los campos enteros son válidos.
   - Cuando `API.modoCorte20Activo === true` y `API.coordinadorCorte20` está activo y la traducción devuelve comando C15 válido: `publicarOpLocal(op)` despacha vía `API.despacharOpComercialCertificada(comando)` (y NO escribe en `API.opsMap` salvo si `res && res.fallbackLegacy === true && await API.puedeDespacharOpEnLegado(op.opId) === true`).
   - Cuando `API.modoCorte20Activo !== true` o el `op.tipo` no es C15, conserva intacta la valla C27+C29 (`canDispatchOnLegacy` / `puedeDespacharOpEnLegado`).
2. **Corte de fotos SHA sin sombra legada (`sembrarFotosAlRelay` + `API.corteFotosShaActivo`)**:
   - Cuando `API.corteFotosShaActivo === true` y `bridgeFotoInicial.put(hash, dataUrl)` + `API.fotosRefs.set(hash, ref)` tuvieron éxito, `sembrarFotosAlRelay` marca `_fotosSembradas[hash][capaFoto] = seedHex` y **omite** la escritura de bytes en `API.fotosMap` (1.0 legado). Si `put` falla o `API.corteFotosShaActivo !== true`, conserva la escritura sombra 1.0 intacta.
3. **Activación unificada y cambio de rol comercial (`API.activarCorte20Runtime`, `API.cambiarRolComercial20`)**:
   - `API.activarCorte20Runtime(opc)` activa `API.crearCoordinadorCorte20`, configura `API.modoCorte20Activo` y activa `API.activarClienteFotosShaCertificado` para el rol indicado (`dueno` vs `admin`/`empleado`), fijando `API.corteFotosShaActivo`.
   - `API.cambiarRolComercial20(rol, opc)` cambia limpiamente el cliente SHA de fotos (`dueno` PUT/GET ↔ Team `admin`/`empleado` GET read-only) y actualiza `API.rolComercial20Activo`; si pasa a Team, desactiva el corte escritor comercial de Owner sin perder el fence C21b.

## 3. Verificación TDD RED → GREEN
- Nuevo `test/p0-c31-runtime-commercial-photo-role-cutover.test.cjs` cargando el código real de `docs/sync-yjs.js` + `docs/vendor/yparty-piloto.min.js` (SHA `a45e716d95a880ca0338df1d78a433014e196813baa97294492ec846e455ccc2` sin modificar):
  1. `publicarOpLocal` con `modoCorte20Activo=true` enruta `venta`, `ajuste`, `abono` a `despacharOpComercialCertificada` y NO escribe en `API.opsMap`; `canDispatchOnLegacy` bloquea doble despacho.
  2. `sembrarFotosAlRelay` con `corteFotosShaActivo=true` sube por `API.fotoSha.put`, escribe `API.fotosRefs` y NO envía bytes a `API.fotosMap` (mientras `corteFotosShaActivo=false` conserva shadow write).
  3. `cambiarRolComercial20` alterna Owner (`put`+`get`) ↔ Team `empleado` (`get` read-only sin `put` ni acceso al PIN Owner).
  4. Con QA `OFF`, el flujo local-first 1.0 y `piloto.fotoSha() === null` permanecen intactos.
- Sellado `v0.8.13` / `f123-shell-v813` / `golden349`, `bash scripts/check-sw.sh`, suite completa local + workflow `.github/workflows/qa-port2-real-c31-runtime-cutover.yml`.
