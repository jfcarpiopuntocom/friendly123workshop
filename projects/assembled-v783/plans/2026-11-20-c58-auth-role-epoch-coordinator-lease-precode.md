# C58 PRECODE · certificado de retiro de lease al cambiar identidad en la MISMA friendly-123

Fecha: 2026-11-20 (Ecuador), base verificable friendly-123 master `f7d084e526f658f44d35b38c0785241b867180ea`. **Producto:** `jfcarpiopuntocom/friendly-123` arquitectura1.0→2.0 con Sync3 conservado. **Workshop:** solo bitácora/precode, nunca producto. Métricas oficiales antes de trabajar: **migración 91,0/100,0; calidad78,5/100,0**; presupuesto independiente fijo100,0, GO0/6 físico0/5.

## Auditoría de causa raíz
En el `docs/sync-yjs.js` de la misma app (C47):
- `oc-login` valida `detail.rol` versus `window.OCAuth.rolActual()` y `esDemo()`; incrementa `API.__authEpoch20`.
- Solo si nuevo rol `empleado` llama `API.coordinadorCorte20.failbackToLegacy("role-switch-empleado")`. **Nuevo `admin` y nuevo login `dueno` no retiran el lease C21a/-cat del Owner anterior**. Sin embargo el cliente de fotos pasa a Team GET-only, y en admin `API.modoCorte20Activo=false`, potencialmente coordinador catalog writer aún active; un login Owner mismo rol deja modo comercial anterior ON sin renegociar token/lease.
- Si `API.activarClienteFotosShaCertificado` falla al revalidar rol, el `catch` de `oc-login` actual lo ignora dejando `API.fotoSha` del Owner anterior, con privilegio PUT/GET (aunque una nueva sesión es Team).
- P0: evento legítimo de identidad jamás debe retener permisos, fotos ni escritor de la sesión previa, incluso el mismo rol. El cambio de sesión es distinto de `CustomEvent.detail` falsificado: ya se comprueba con `OCAuth`.

## Plan Ponytail RED→GREEN (source owner de esta rama SOLO docs/sync-yjs.js role event + release seals)
1. **RED first** modificar solo la suite source-extracted existente `test/p0-c47-auth-role-switch-20.test.cjs` y crear workflow `.github/workflows/qa-port2-real-c58-auth-lease-revocation.yml`. Tres tests nuevos:
   - Owner ACTIVO → admin legítimo: `modoCorte20Activo=false`, coordinador `failbackToLegacy` invocado para lease, foto Team GET-only, no reactivar comercio.
   - Owner ACTIVO → Owner real re-login mismo rol: failback y modo2.0 OFF, sin auto-arm; Owner fotos solo nueva sesión.
   - Owner ACTIVO → Team admin real pero fábrica de fotos da error: failback y modo2.0 OFF, fotoSha/corteFotosShaActivo/rolComercial20Activo reset (NUNCA privilegio Owner viejo).
   - Existing empleado downgrade, demo, forgery, authEpoch during in-flight activate, check-sw remain green. La ausencia de failback admin y reauth debe producir RED auténtico visible en Actions.
2. **GREEN mínimo** en el handler `window.addEventListener("oc-login",...)` existente. Tras `OCAuth` verificado, incrementar authEpoch; guardar si `corteFotosShaActivo` estaba activo; **revocar de inmediato** `modoCorte20Activo`, `corteFotosShaActivo`, `fotoSha`, `rolComercial20Activo` ANTES del `failbackToLegacy`; llamar failback para **todo** nuevo login validado que tuviese estado o coordinador C21a previo, con motivo `role-switch-empleado` si empleado y `oc-login-session-change` si admin o dueno. `API.cambiarRolComercial20(r, {cortarLegadoFotos: fotosActivas})` reata solo el rol acreditado; falla cerrado si la fábrica de fotos arroja. Nunca elevar `modoCorte20Activo` sin un `activarCorte20Runtime` posterior con doble QA.
3. **Release real** shell `f123-shell-v824`, `v0.8.24`, `golden360`, `docs/sw.js`, `docs/version.json`, los 3 sellos de dashboard y hashes de `./sync-yjs.js` y `./dashboard.html` en `docs/version-manifest.json`. No tocar `docs/index.html` (si se necesita hash externo, usar el index realmente modificado). Preservar el chequeo de manifiesto SHA-256 y check-sw.
4. 11/11 GitHub checks (puede ser más por workflow nuevo), prueba C58 focal, release-control, P0 hotfix (ventas/dinero), C47 regresiones, dos pestañas Chromium/WebKit, build Cloudflare exact commit SHA. SIN clientes, sin habilitar 2.0, sin datos reales, sin gastos. **No tocar** ledger P0 PR #841, Firebase, R2 ni otros dueños.
5. **Métrica posterior solo si C58 source merged**: rúbrica de identidad original14.0 `commercial-role-switch` PENDING1.0 → dividir en `c58-auth-epoch-coordinator-lease-revocation` **0.5 DONE de QA real de source**, `commercial-role-switch` **0.5 PENDING** de aceptación física/servidor; migración candidato 91.5/100,0, calidad security+0.2 10.5→10.7/15, total78.7/100,0. Esta propuesta queda SIN acreditar hasta fuente fusionada, CI, Cloudflare exact SHA, TDD score-only y lectura de JSON master; GO0/6 físico0/5.
6. Evidencia en este workshop + Notion; si STOP, retomar por este plan y GH PR/CI, no repetir trabajo.

## Limitaciones y riesgos
- Foto Team QA sigue simulada en role fixture; no es autenticación humana real de dos iPhones. La comprobación `OCAuth` ya es fuente real, pero evento malicioso no debe restaurar owner.
- `coordinador.failbackToLegacy` existente C21a cierra sesión -cat sin I/O peligroso antes de resolver Promise; se invoca sin bloquear el event listener y flags desarman sincrónicamente.
- Este avance reduce riesgo de doble escritor por **cambio de identidad**; no resuelve unión Firebase HEAD real, dinero histórico ni R2, ni valida otros gates.
