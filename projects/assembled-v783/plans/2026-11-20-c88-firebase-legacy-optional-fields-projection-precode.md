# C88 PRECODE — catálogo heredado Firebase: campos opcionales vacíos/nulos sin bloquear la proyección pública 2.0
Fecha: 2026-11-20 · proyecto: MISMA friendly-123 arquitecturas 1.0→2.0.
Producto: `jfcarpiopuntocom/friendly-123`; workshop = SOLO QA/planes/evidencia.

## Fuente y causa raíz (read-only)
- Fuente ORIGINAL producto `docs/mock-backend.js::_catalogoInterno()`: incluye `sku`, `barcode`, `categoria` y `ubicacionId`, con valores `""`, `null` o ausentes legítimos.
- Puente real: `cloudflare-yparty-worker/src/catalog-safe-projection.mjs`, `maybeText()` envía cualquier campo presente a `text()`, que exige string no vacío. Resultado: `projectPublicCatalog` rechaza todo catálogo por un campo opcional vacío, bloqueando preparar el histórico en `frozen-r2-packager`, `trusted-frozen-source` y lector/copia pública.
- Evidencia de código de `master@b56d560c8955d846c2cd8a17e77907a26a715f32`; **no** afirma haber leído datos económicos Firebase originales (solo existe CLI/MCP Firebase LOCAL del propietario).

## Contrato Ponytail de mínimo cambio completo
1. Crear prueba RED con OSS Yjs real: productos heredados con `sku:""`, `barcode:""`, `categoria:null`, `ubicacionId:null`, y perchas `tipo:""` se proyectan sin esos campos, conservan ID/precio/stock y no transfieren secretos.
2. En proyección, tratar exactamente `undefined/null/""` de campos OPCIONALES como ausentes. No tocar obligatorios ID/nombre/precio/stock, ni aceptar arrays/objetos, ceros, whitespace, valores malformados.
3. El verificador del transporte público sigue *fail closed*: un Y.Doc construido manualmente con esos campos presentes no pasa allowlist; la proyección los elimina primero.
4. TDD RED→GREEN en GitHub Actions por SHA y regresiones `p0-safe-catalog-projection`, `p0-gated3-paving-deterministic-memory`, empaquetador R2/lectura Gate D, score original100; ningún cambio a `docs/sync-yjs.js`, `docs/vista-perchas.js`, `merge-frozen-into-existing.mjs` o `docs/core/ledger.js` (reservas #868/#871/#841).
5. Producto real en PR separada (NO directo master); QA switches OFF, Sync3 intacto; sin Firebase/R2 writes, sin activar bandera, deploy ni gasto Cloudflare. No reemplazar pruebas físicas o GO por CI.
6. Métricas `docs/engineering/architecture-2-*-score.json` solo tras CI y merge real si la rúbrica fija reconoce mejora independiente. No contar histórico Firebase real ni R2 Service Binding hasta ver HEAD autenticado. Preservar transición inicial 92,0/100,0 y calidad 80,0/100,0 hasta evidencia.

## Riesgos y rollback
Si alguna forma heredada es ambigua o una prueba rechaza privacidad, mantener fail-closed y documentar fuente; rollback PR. Revisar cualquier sobreescritura de archivos reservados antes del merge.
