# C60 PRECODE · Yjs catalogo congelado válido no se rechaza por orden de claves

2026-11-20 Ecuador. Producto = LA MISMA friendly-123 (master 31ba0673258485ccdfabefaca82a2f4428def28f), Sync3 intacto. Workshop solo planes/evidencia. Estado previo medido: migración 91,5/100,0; calidad 78,7/100,0, GO0/6, físico0/5. No alterar score sin fuente merge y CI.

## Auditoría causa raíz

- cloudflare-yparty-worker/src/trusted-frozen-source.mjs, función validateDocument(): cuando cat incluye productos o ubicaciones, el código compara JSON.stringify(source.get(id)) con JSON.stringify(row) de projectPublicCatalog, copia pública YA EXISTENTE. JSON stringify depende del orden de inserción de campos aunque contenido económico y público sea idéntico, por lo que un Y.Doc legítimo con claves en orden distinto falla el cold join.
- Caso público: mismo producto id, nombre, precio, stockActual en orden inverso produce falso rechazo de trusted frozen history sin diferencia real. NO convertir Yjs privado en catálogo; los campos privados ownerPin/costo, IDs inválidos y roots privados deben continuar rechazados.
- Hallazgo P0 separado: el v1 legacy que carece de productos/ubicaciones pasa si solo contiene un root no explícitamente prohibido, por ejemplo products o desconocido. Merece reforma cerrada con fixtures legacy antiguos que hoy usan products/eventos; no confundirse con esta normalización de orden. No conceder crédito por eso en C60.

## Ponytail TDD

1. RED primero en suite cloudflare-yparty-worker/qa/p0-gate-d-trusted-paged-source.test.mjs, tras crear branch master C60. Fuente real con id,nombre,precio,stockActual de orden inverso. Probar v1 numeric y v2 paged base64 con manifest SHA, expectedStateSha256, expectedVectorSha256 y projectedSha independientes. Ambas deberían permitir readTrustedFrozenSource + prepareFrozenImport; fuente vieja debe rechazar.
2. Prueba adversarial: mismo orden inverso + campos privados ownerPin/costo, sigue rechazado en v1 y v2, no registra PIN.
3. GREEN mínimo: comparación campo-a-campo de claves en dos objetos planos y primitivos exactos contra ROW allowed de la proyección pública, same key count, ningún campo extra. Reutilizar el proyector existente; no crear nuevo servicio, no modificar HTTP/SQL/SW, no tocar historial, Sync3, dinero o clientes.
4. Añadir workflow QA específico y ejecutar tests Gate D, Workerd y GH CI; merge solo con CI completo, exact Cloudflare SUCCESS, fuente de producto real. Mantener flags QA OFF y reservas ledger PR #841.
5. Crédito FUTURO, limitado: si se demuestra capacidad nueva de unión congelada con objetos públicos reales sintéticos y ausencia de secreto, evaluar migración +0,3/100 desde pendiente real-firebase-head-complete 2,5 (restaría 2,2 real HEAD), y calidad durability +0,2 (18,2→18,4, total 78,9). No reclamar HEAD comercial real, R2 binding ni aceptación física. Sin source merge y score RED→GREEN no mover números.

Rollback: revert comparación y tests, ninguna transacción de cliente, cero gastos.