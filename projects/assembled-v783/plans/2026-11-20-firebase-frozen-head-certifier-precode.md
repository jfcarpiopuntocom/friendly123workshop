# PRECODE · Certificador independiente Firebase RTDB → R2 / YParty (offline/read-only, USD 0,00)

**20-nov-2026 · Ecuador.** Para la **MISMA** `jfcarpiopuntocom/friendly-123` (PORT 1.0→2.0, Sync3 intacto).

## Contexto y problema causal

- `master@65d7a90` (C85) tiene **PORT 92,0/100,0** y **Calidad 80,0/100,0**, `GO 0/6`, `físico 0/5`, `flags QA OFF`.
- Para desbloquear `real-firebase-head-complete` (`2,0 pts`) y preparar `r2-service-binding-installed` (`2,0 pts`), Sol6 recibió acceso al MCP de Firebase en Codex.
- Hoy existe `cloudflare-yparty-worker/tools/frozen-r2-packager.mjs` (`Gate D7`), que requiere frames Yjs ya descifrados + `externalProof`, pero NO existe en el repo ningún lector/certificador que traduzca un snapshot de Firebase RTDB (`/f123/<room40>{-y,-ops}`) al contrato real de `frozen-r2-packager.mjs`:
  1. Firebase 1.0 usa `sha256("amigable-sala:" + codigo).slice(0, 40)` (**40 hex**), mientras YParty/R2 2.0 usa `sha256("f123-yparty-v1:" + codigo).slice(0, 32)` (**32 hex**).
  2. Cada entrada `/k/$rev` y `/o/$id` en Firebase está cifrada con `AES-GCM-256` (`PBKDF2("amigable-sync-v1", codigo.trim().toUpperCase(), 100000, SHA-256)`, IV de 12 bytes) y envuelta en frames de protocolo (`tag 0` crudo, `tag 3` multi-fragmento 22B header, `tag 7` checkpoint gzip).
  3. Desempatar `/o` exige orden `(s, firebaseKey)` (`docs/firebase-relay.js`), y un `/k` obsoleto puede omitir ancestros independientes previos en `/o` (`pendingStructs`), por lo que el certificador debe reproducir `/k` + `/o`, detectar checkpoints obsoletos y **fallar cerrado** ante fragmentos incompletos, AES-GCM inválido, bombas gzip, `pendingStructs/pendingDs` o raíces prohibidas en `-ops`.

## Alcance Ponytail (cero colisiones)

- Archivos NUEVOS exclusivamente en `friendly-123`:
  - `cloudflare-yparty-worker/tools/firebase-frozen-certifier.mjs`
  - `cloudflare-yparty-worker/qa/p0-firebase-frozen-certifier.test.mjs`
  - `.github/workflows/qa-port2-firebase-frozen-certifier.yml`
- **Cero** cambios a `src/index.js`, `src/yparty-piloto.js`, `docs/*`, `docs/engineering/*-score.json`, `#868`, `#871`, `#841`.
- **Cero** escrituras en Firebase/Cloudflare/R2 (`USD 0,00`), cero llamadas de red por defecto, cero logs de `codigo`/PII/PINs.
- TDD estricto RED → GREEN + verificación Miniflare `frozen-r2-source.mjs` + `prepareFrozenImport`.
