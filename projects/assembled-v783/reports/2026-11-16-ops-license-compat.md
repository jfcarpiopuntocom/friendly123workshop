# Armonización de licencias: inbox tipado ↔ emisor WS existente

16-nov-2026. PR #27 sobre `main` de `jfcarpiopuntocom/friendly123workshop`.

## Error real reproducido
La nueva pieza `typed-commercial-ledger.mjs` incorporada por PR #25 usaba `/^F123-[A-Z0-9-]{8,48}$/`, distinto del contrato de identidad central del emisor WS existente en `projects/assembled-v783/app/cloudflare-worker/ws-capability-issuer.mjs`: `/^F123-[A-Z0-9*~$=-]{8,34}$/`. Una licencia válida con caracteres `*~$=` podía ser rechazada antes incluso de consultar la autoridad; algunas licencias inválidas por longitud podían llegar más lejos de lo debido.

## Cambio mínimo
El contrato del inbox ahora utiliza **exactamente el alfabeto y la longitud del emisor existente**, sin cambiar el emisor, los PIN, los permisos, la BD comercial, el relay, las fotos ni la PWA. Dos nuevos tests verifican caracteres permitidos, límite mínimo/máximo y rechazos correctos. RED reproducido en [Actions #43888402645](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43888402645): exactamente las 2 pruebas nuevas fallan, 15 anteriores siguen verdes; el test Workerd anterior pasó.

## Alcance y limitación de permisos
La política del emisor actual `ws-capability-issuer.mjs` solo incluye `ops:sale` en el techo de Owner/admin/empleado. **No concede `ops:expense` ni `ops:payment`**. Que el inbox soporte esos *tipos de comando* NO da autorización real a usuarios ni significa que puedan acceder a ellos hoy. Seguirán **fail-closed** al conectarlos al emisor hasta tener decisión de permisos por rol, autenticación humana y pruebas Workerd. Nunca añadir scopes arbitrariamente para poner una prueba en verde.

**Definición de completado:** CI SHA exacto con 17/17 contratos + 1/1 SQLite Workerd, 0 fail/skip; solo entonces fusionar. El inbox sigue **sin endpoint de producción** ni ejecutor real de venta, y la aceptación comercial es NO-GO.
