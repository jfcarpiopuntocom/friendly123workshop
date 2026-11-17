# friendly-123 · DOS MÉTRICAS /100 · 17-nov-2026

Fuente ejecutable de la calidad: [score-v1.json](score-v1.json) + [score.cjs](score.cjs). Fuente independiente de **culminación del port**: [port-v1.json](port-v1.json) + [port.cjs](port.cjs). Los pesos/stages y **seis gates aprobados JFC/Opus están congelados**, no se mueven por necesidad de ingeniería. Este marcador mide **hitos con evidencia**: los decimales no son probabilidades ni porcentaje de horas trabajadas.

## Comparación auditada

| Métrica | Hace una semana | Corte anterior 17-nov | Actual 17-nov | Meta |
|---|---:|---:|---:|---:|
| Calidad y robustez arquitectónica | 45.0/100 estimado retrospectivo (±5) | 64.5/100 | **64.5/100** (±4 criterio) | ≥95 |
| Culminación del PORT operativo | Sin rúbrica histórica (no inventar) | 27.0/100 | **36.0/100** | 100 **y 6/6 gates** |

Calidad +19.5 puntos estimados frente al 10-nov. Port +9.0 **desde la primera medición versionada**, no inferir avance semanal. **Comercial 0/6 gates certificados. NO-GO**. La primera tienda solo puede activarse tras las seis condiciones aprobadas por JFC y el score de calidad ≥95.

## Rubros de port (100 puntos exactos, inmutables)

| Gate JFC/Opus | Máximo | Hitos comprobados | Restante |
|---|---:|---:|---:|
| A. Empleado denegado raw Yjs; venta, ajuste, cobro tipados opId con ACK comercial | 20 | 4.0 | 16.0 |
| B. Emisor Owner/Team; ingreso firmado por canal y reconexión; revocación | 20 | **16.0** | **4.0** |
| C. Foto como blob SHA fuera de Yjs | 10 | **3.0** | **7.0** |
| D. Firebase→DO→Firebase completo, SHA, sin padres pendientes | 25 | 10.0 | 15.0 |
| E. Web Locks outbox y recuperación iPhone | 10 | 3.0 | 7.0 |
| F. Dos ciclos físicos Opera PC↔Safari iPhone A→B→A | 15 | 0.0 | 15.0 |
| **TOTAL** | **100** | **36.0** | **64.0** |

### C1 · foto SHA Workerd SQL +3/100 acreditado (NO gate C completo)

[PR89 Workerd real](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/89), [CI exacta 44160604233](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44160604233) SHA `f76deabc271b73702619992155b4a33d114119b4`: bloques SQL de 512 KiB con foto >2 MiB sintética, PUT/GET autenticado por tickets Owner, SHA validado, reinicio Workerd y recuperación binaria, foto **nunca** aceptada como sala Yjs WebSocket en esa ruta. Se acredita exclusivamente stage `photo-sha-sql-blob` (+3.0); NO acreditar referencias Yjs `fotos_refs` ni recuperación PC-iPhone hasta pruebas del navegador/equipo exactas. La rama foto browser sigue fuera de main y no se activa comercialmente. La calidad **se mantiene 64.5**, GO **0/6**; el [TDD RED del marcador](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44176289376) mostró 33 frente a 36 esperado antes de cambiar JSON. PR92 mantiene contraprueba de privacidad Team RED 7/8: no fusionar ni activar Team sin aislamiento.

### Avance material del port: dos injertos previamente importados ahora están cableados

**PR86** [Workerd 4/4](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44150775169) y [585/585 integrada](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44150993853), SHA `f01ef2f11fef1e6b83c955ac081db192b9f944cc`. Worker actual admite separadamente `-cat` y `-ops` bajo bandera QA de servidor `WS_SEPARATE_ROOMS_QA=1`. Ticket de un solo uso consumido en la autoridad central. `ops:sale` **no** habilita actualización económica Yjs arbitraria; catálogo requiere `cat:write`; sala `-priv` anterior sigue compatible. **No activar la bandera ni modificar producción sin seis gates**.

**PR87** [cliente/vendedor compilado 9/9](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44153648394) y [585/585 integrada](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/44153648286), SHA `1db297d2387d389b2b2b05e6191133c52b7b4ebd`. El auténtico `app/src/yparty-piloto.js` usa `AuthorizedYProvider` más `createOwnerTicketParams` con el PIN Owner de sesión (no guardado), un `cap` nuevo por socket y por reconexión. Salas `cat`/ `ops` separadas; `fotos` conserva relay legado cifrado hasta salir del documento Yjs. El **vendor que carga `sync-yjs.js`** `app/docs/vendor/yparty-piloto.min.js` fue recompilado desde fuente con el lock existente y coincide byte a byte en CI; SHA256 `19c19f71868eeac94adaf9f656877a484cbdb6c05e0a1ea79987e6a1d8c88a68`.

Se acredita **solo** el stage *browser-fresh-ticket* **+6** de la etapa B, definido antes del trabajo. **NO se certifica el gate B**: falta probar Owner/Team real, revocación, y el flujo económico tipado. Las pruebas de navegador sintético del proveedor+Workerd y el código cliente recompilado son evidencia de laboratorio; **no** reemplazan pruebas del piloto completo en un iPhone real.

### Incompatibilidad vieja y corrección de diagnóstico

El validador antiguo `port.cjs:inspectClientWire` exigía indebidamente una sala única `-priv` para tres Y.Doc independientes, y seguía diciendo BLOCKED incluso después de PR86/PR87. El contrato correcto es Y.Doc `cat` y `ops` en rooms autorizadas separadas; `fotos` nunca debe fusionarse en esa sala económica. [PR88](https://github.com/jfcarpiopuntocom/friendly123workshop/pull/88) añade RED→GREEN para reconocer sólo ese contrato sin aceptar una mezcla insegura de documentos.

### Lo que bloquea la **primera tienda** (únicamente los seis gates originales)

El Worker todavía no ejecuta venta/ajuste/cobro tipados con efecto comercial durable y **ACK de hecho aplicado**: el inbox actual entrega `stored-for-application`, no éxito de caja. Hay almacenamiento externo SHA en Worker probado, pero las fotos como bytes siguen en Yjs legado y todavía falta puente completo del navegador. Falta importar la historia **Firebase real** de 5.348 frames sin 15 padres pendientes y un rollback cifrado verificado; no sirve omitir `pendingStructs`. Outbox del transporte y iPhone deben superar Web Locks y suspensión física, y faltan dos ciclos A→B→A de Opera PC y Safari iPhone. Ningún otro requisito se añade aquí.

## Comandos de control, fail-closed

```sh
node projects/assembled-v783/quality/score.cjs
node projects/assembled-v783/quality/port.cjs
node --test projects/assembled-v783/quality/port.test.cjs projects/assembled-v783/qa/p0-port-client-worker-contract.test.cjs
# Retorna 2 hasta tener 100/100 port, calidad >=95 y seis gates de JFC verdaderamente certificados.
node projects/assembled-v783/quality/port.cjs --require-operational-go
```

**No ejecutar deploy ni activar `f123_yparty_qa`/ `WS_SEPARATE_ROOMS_QA` en cliente real todavía.** El desarrollo y su progreso se registran únicamente en `friendly123workshop`; producción `friendly-123` queda intacta.
