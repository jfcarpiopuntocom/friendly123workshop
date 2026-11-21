# C116: integridad de bloques IndexedDB v839, versión candidata v0.8.40

Fecha: 2026-11-21 (Ecuador). Producto único: `jfcarpiopuntocom/friendly-123`; workshop solo PRECODE, QA y evidencia.

## Veredicto

PR [#934](https://github.com/jfcarpiopuntocom/friendly-123/pull/934) **DRAFT**, HEAD exacto `4e1f81065bcd3fa2b8e3bde340ab06f4465e491b`, derivada de `master@353d18a6a504c1523582be79274dbd741c91a39f` (v0.8.39). **27/27 workflows SUCCESS**, incluyendo los gates [P0 44869952861](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44869952861) y [release-control 44869953005](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44869953005). **No merge, no deploy y no GO comercial.** Shell candidata `f123-shell-v840`, cache `golden376`, manifiesto oficial de 131 assets.

## Tres pasadas, con evidencia

1. **Reproducción RED** [Actions 44868844998](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44868844998) con source v839 original: 161 PASS, 4 FAIL genuinos en Chromium y WebKit. El mismo FNV32 de bloques distintos de igual tamaño producía falso ACK de nuevo historial: `00iikdb0` seguía en disco después de confirmar `01jsqfb2`. Eliminar la clave `h:movimientos:0` hacía que una lectura de 501 movimientos devolviese uno, sin avisar de corrupción.
2. **Ponytail fuente:** `docs/estado-idb.js` comprueba contenido durable del bloque aunque coincida la huella antes de omitir el write; hace `put` solo si realmente difiere, dentro de la misma transacción IDB CAS; aborta ante ausencia en el camino de escritura y `leer()` rechaza bloques desaparecidos, longitudes incoherentes y metadatos imposibles. Se corrigió una condición errónea detectada en revisión: actividad vacía con **64 cubetas hash y longitud cero** es un caso válido. Tiene prueba positiva real Chromium y WebKit.
3. **Regresiones y rendimiento GREEN:** [P0 44869952861](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44869952861) 175 PASS, 0 FAIL, 1 SKIP; incluye 10 pruebas adversariales nuevas en ambos navegadores y la prueba original de v839. Historial sintético de 6.765.141 bytes y acción adicional: **733.283 bytes escritos**, no 6,8 MB; 53 ms Chromium y 23 ms WebKit reportados por CI. En [release-control previo 44869746092](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44869746092) hubo dos fallos solo por una aserción demasiado exigente (un bloque de 401 eventos ×1800 caracteres no puede costar menos del 10 % del total); se corrigió el umbral a menos de 1 MB y menos de 1/8 del total, sin cambiar código comercial. [release-control final](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44869953005) SUCCESS. Las 27 workflows del HEAD terminaron SUCCESS.

## Alcance, ausencia de efecto lateral

Solo `docs/estado-idb.js`, test `test/p0-v837-history-chunks.test.cjs` y sello/versión `docs/version.json`, `docs/dashboard.html`, `docs/sw.js`, `docs/version-manifest.json` cambiaron respecto de base. Manifest 131/131; solo difieren las huellas de `estado-idb.js` y `dashboard.html`. No se modifican `docs/sync-yjs.js`, dinero, fotos, stock causal, PIN ni identidades. Los Workflows temporales de sellado se eliminaron de la rama.

El laboratorio sintético no prueba Safari iPhone físico, no acredita cross-device A→B→A×2, no confirma Firebase económico real ni R2 comercial. Trackers oficiales de master sin incremento: **PORT 100,0/100 de código ensamblado, calidad 81,7/100, GO 0/6, físico 0/5**.

### Trabajo paralelo, sin mezclar PR

PR [#900](https://github.com/jfcarpiopuntocom/friendly-123/pull/900) es diagnóstico manual Safari, no crash fix. Se eliminó la captura de `ErrorEvent.message` arbitrario y se reemplazó por categoría de error permitida. Regresión de privacidad [#44869979986](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44869979986): **2/2 PASS**. Sigue sin fusionar. PR #630 antigua contiene contrato EGM no revalidado para v839.

PRECODE original: [C116](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/projects/assembled-v783/plans/2026-11-21-c116-idb-history-integrity-precode.md). Estado y reserva Notion [C116](https://app.notion.com/p/41f1642b67f381bb9058f41fe81cc782).

## Regla final

No eliminar ni sintetizar movimientos; no cambiar la autoridad comercial; respetar A/B/C y Sync3. PR preparada y probada, **no autorización implícita de despliegue**. La evidencia física debe constar por separado.
