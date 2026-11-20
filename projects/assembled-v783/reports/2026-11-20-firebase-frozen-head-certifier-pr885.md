# PR #885 · Certificador Firebase RTDB → Yjs / R2 (`USD 0,00`, cero colisiones)

- **Producto PR:** https://github.com/jfcarpiopuntocom/friendly-123/pull/885 (rama `port2/20261120-firebase-frozen-head-certifier` sobre `master@65d7a90`, commit `54beee8`).
- **Archivos tocados (3 netamente nuevos):**
  - `cloudflare-yparty-worker/tools/firebase-frozen-certifier.mjs`
  - `cloudflare-yparty-worker/qa/p0-firebase-frozen-certifier.test.mjs`
  - `.github/workflows/qa-port2-firebase-frozen-certifier.yml`
- **Gasto / mutaciones Firebase / R2:** `USD 0,00`. Inspección previa read-only en Firebase RTDB (`friendly-123-ab7b3-default-rtdb`) confirmó proyecto `friendly-123-ab7b3`, reglas `/f123/$room/{o,k}` y **148 canales** bajo `/f123` (`-y`: 60, `base`: 51, `-ops`: 30, `-fotos`: 7), todos cifrados AES-GCM-256 (`PBKDF2("amigable-sync-v1", codigo, 100000, SHA-256)`).
- **Trampas reales documentadas para Sol6 al leer Firebase vía MCP:**
  1. **Mapeo de sala distinto:** Firebase 1.0 usa `sha256("amigable-sala:"+codigo).slice(0,40)` (40 hex, sufijos `""`, `-y`, `-ops`, `-fotos`); YParty/R2 2.0 usa `sha256("f123-yparty-v1:"+codigo).slice(0,32)` (32 hex, sufijos `-cat`, `-ops`, `-fotos`).
  2. **Envoltorio binario tras AES-GCM:** después de `IV(12)+ciphertext` vienen tags de protocolo: `tag 0` (update crudo), `tag 3` (reconstrucción multi-fragmento de cabecera 22B) y `tag 7` (checkpoint gzip); no alimentar `bytes` crudos directo a `Y.applyUpdate`.
  3. **Ancestros previos a `/k` y empates de `s`:** un `/k/$rev` parcial/obsoleto no garantiza cierre causal si hubo ops pre-checkpoint de escritores independientes en `/o` (`s <= k.s`); ordenar `/o` por `(s, firebaseKey)` y detectar `staleCheckpointDetected`.
  4. **Privacidad en `-cat`:** `-y` trae raíces privadas (`_meta`, `usuarios`, `clientes`, etc.); `packFrozenR2Archive` las proyecta automáticamente solo a `productos` + `ubicaciones` públicos.
- **TDD RED → GREEN verificado localmente:**
  - RED inicial: fallo por módulo faltante (`tools/firebase-frozen-certifier.mjs`).
  - GREEN final local: `node --test --test-concurrency=1 qa/p0-firebase-frozen-certifier.test.mjs qa/p0-gated7-frozen-r2-packager.test.mjs qa/p0-gated6-frozen-r2-source-workerd.test.mjs` -> **21/21 PASS** (incluyendo Miniflare `frozen-r2-source.mjs` -> `readTrustedFrozenSource` -> `prepareFrozenImport`).
  - `node --test test/p0-architecture-2-port-score.test.cjs test/p0-firebase-network-recovery.test.cjs` -> **4/4 PASS**.
- **Colas abiertas previas sin colisión con `master@65d7a90`:** `PR #868` (C68 UI fotos SHA `v0.8.25`) y `PR #871` (C70 dominancia vectorial Yjs) comprobadas sin conflictos contra `origin/master@65d7a90` vía `git merge-tree`.
