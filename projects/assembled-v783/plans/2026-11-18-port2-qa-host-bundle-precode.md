# Port 2.0 · alinear host QA real y vendor navegador sin romper la 1.0 (PRECODE)

Fecha 18-nov noche / 19-nov UTC. Workshop main exacto `43109f7a76509184143c314c9a4d56a91267cbc6`; rama `fix/20261118-port2-qa-host-bundle`. [Diagnóstico Cloudflare real](../reports/2026-11-18-cloudflare-port2-qa-deployed-vs-workshop.md). Propiedad reservada: `app/src/yparty-piloto.js`, `app/docs/vendor/yparty-piloto.min.js`, test nuevo en `app/test/`, workflow temporal de ensamblado. Sin tocar `app/docs/sync-yjs.js`, licencias Worker, permisos, PIN, fotos ni clientes LIVE.

## Raíz
`app/src/yparty-piloto.js` fija host `friendly123-yparty-qa-20261114.jfcarpio.workers.dev`, Worker antiguo sin binding `WS_AUTHORITY`. Cloudflare API verificó que el canario 2.0 es `friendly123-yparty-port2-canary-qa.jfcarpio.workers.dev`, existe Service Binding `WS_AUTHORITY`, aunque sus seis flags QA están OFF, `SALA_PILOTO` sin configurar y el emisor desplegado no trae `/ws/ticket`. No habilitar esos servicios antes del contrato seguro de fuente y roles.

## Ponytail TDD
1. Test source+bundle exactos RED: ambos DEBEN apuntar al canario 2.0 y no al antiguo. No aceptar código fuente actualizado con JS minificado viejo.
2. Cambiar UNA línea `const host` en fuente 2.0; compilar `docs/vendor/yparty-piloto.min.js` desde `scripts/build-yparty-piloto.cjs`, `npm ci` lock exacto (esbuild 0.28.2). Si no se puede empaquetar reproduciblemente, NO fusionar.
3. Usar workflow temporal sólo para rama con permiso acotado `contents:write`, que genera y versiona el vendor compilado. Eliminar workflow temporal antes del merge; no hacer releases. Si token no puede escribir, conservar fuente/test en draft hasta alternativa aprobada; nunca inventar hashes.
4. GREEN test de host, `qa-v783-photo-sha-browser.yml` sellado del vendor, privacidad de roles y navegador, 2.0 **OFF**. Los recursos Cloudflare ya existen pero siguen sin autoridad funcional; un host correcto no da GO ni certifica 401, Yjs padres, dinero o iPhone.

## Salida
Evidencia RED→GREEN, SHA exacto, merge sólo en workshop y Notion. No sumar score: calidad 67/100, port 61/100, 0/6 gates. No actualizar `friendly-123` LIVE, `master/estable/previo`, ni cambiar ningún binding Cloudflare.
