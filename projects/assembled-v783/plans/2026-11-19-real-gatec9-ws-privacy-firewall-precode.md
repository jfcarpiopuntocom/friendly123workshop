# PORT 2.0 · Gate C9 · Firewall de privacidad EN EL PROVEEDOR WebSocket real (PRECODE, 19 Nov 2026)

**Destino**: `jfcarpiopuntocom/friendly-123` master `594fa02e58c12c647d8769340308ab9eb8da8dea` (C8 #788 merged). Workshop SOLO plan y pruebas. Sync3 no se edita. OpenCode/Hermes observador.

**Causa raíz**: C8 crea un Y.Doc público aislado, pero cualquier llamador futuro puede pasar el Y.Doc privado por error directamente a `new AuthorizedYProvider(host,sala+'-cat',rawDoc,options)`. El pilot tiene #765 return preventivo, pero debemos tener defensa en profundidad **antes del super() que abre el WS**.

**Ponytail mínimo**:
- Solo `src/authorized-yprovider.mjs` + utilidad exportada `assertPublicCatalogTransportDoc` en `src/port2-public-catalog-bridge.mjs` y nuevas pruebas fuente real.
- Validar **antes de super** para room `<32hex>-cat`: Y.Doc no destruido, 0 parents Yjs pendientes, raíces exclusivamente productos/ubicaciones; filas EXACTAMENTE iguales a lo permitido por `projectPublicCatalog` (sin fields extra: PIN/costo/private metadata dentro del objeto aunque nombre de mapa sea público). Si falla, throw sin credencial, provider ni WS.
- Mantener ops/priv ya segregados; no introducir controles para sus raíces distintas. Verificar que el Y.Doc producido por C8 sí entra al proveedor mientras el privado sale rechazado.
- Shim en esbuild para probar de verdad la clase `AuthorizedYProvider` sin abrir sockets, usando constructor base instrumentado. TDD RED→GREEN.
- No tocar `src/yparty-piloto.js` reservado, ni `docs/sync-yjs.js`, ni bundles producción hasta revalidar pipeline. No activar flags/Cloudflare. GitHub release gates.
- No contar con ello sustitución del relay 1.0 hasta que esté compilado y cableado bajo un solo escritor y haya canario físico.
