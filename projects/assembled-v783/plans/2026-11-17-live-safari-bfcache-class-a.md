# Clase A 02 Opus 5.5: Safari/PWA BFCache pageshow Yjs reconnect LIVE

Plan remoto ANTES del código. Ecuador 17 nov 2026, noche. Workshop main@d0688c378d2cf42e939d01659ce414a509d7b89b; LIVE master@45757cac5d9268402049c0fba90cccdece150ac6. docs/sync-yjs.js blob fa7ab886523f23f8fff37bf1618516f7810cbff3.

Guía https://app.notion.com/p/41c1642b67f381fe898ee37fca461d61 y https://app.notion.com/p/41b1642b67f381fbab5cf45ac55aabd3. Editor de PR #741 posee otra rama LIVE con archivo sync-yjs.js: NO editar SU rama, NO fusionar sin coordinación. Crear nueva rama independiente de master, cambio puntual SOLO en listener al lado de sincronizarVisibilidad; siguiente integración deberá rebasar y revisar contra #741. No tocar scripts, PIN, SW, UI, otros archivos reservados.

1. Crear LIVE rama hotfix/20261117-safari-bfcache-pageshow desde master exacto; copiar test de taller app/test/p0-yparty-bfcache-pageshow.test.cjs y SOLO adaptar dos aserciones programarRetorno al LIVE que no tiene ese helper; mantener resto de comportamientos intactos.

2. CI RED fuente real: 4/5 verde, BFCache persistente falla porque pageshow no existe. Sin Safari físico, esto es VM sintética, no afirmar prueba física.

3. Injertar exactamente 11 líneas del taller: listener pageshow con evento.persisted, no hidden; pausar cada canal API.canal, fotosCanal, opsCanal; sincronizarVisibilidad reanuda rutas ya probadas; no rehidratar, no vaciar IDB, no remitir opId manual ni cargar UI.

4. CI GREEN 5/5; ejecución regresiones Yjs existentes y full checks cuando posible, SHA exacto y cambios en solo docs/sync-yjs.js. Crear PR DRAFT; no merge ni producción sin usuario, 5 gates de release, script oficial node scripts/gen-manifest.js, nueva identidad shell, prueba física iPhone.

5. Guardar prueba, PR, HEAD, recuperación Notion. Calidad 67.0/100, port 41.0/100, GO 0/6. Este hotfix legado no suma gate E físico ni prueba la unión fría de 5348 frames. Rollback: revert listener, conservar IDB/outbox; si páginas canario muestran degradación, NO GO.