# Continuidad v783 — 2026-11-16 — checkpoint previo a implementar

## Fuente de verdad y no duplicación
- Relevo Notion: https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902
- MDD vinculante: https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac
- Leer `projects/assembled-v783/START-HERE.md` y `STATUS.md` de main ANTES de editar.
- Último runtime indicado por esos dos documentos: `774558acac3802a1a0cdb8849cf3b9ed017610d3` (NO asumir que sigue siendo HEAD; revalidar).
- CI focal declarada: https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43944394047 — 585/585; verificar logs si se reutiliza.
- Full previo declarado rojo: https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43942634062; full exacto nuevo pendiente: https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43944393991.

## Plan de implementación (siguiente agente)
1. Revalidar HEAD y resultados de CI exactos, diff del runtime 774558a, y pruebas de relay awareness78/79; distinguir hechos anteriores/posteriores a revocación.
2. Elegir UN defecto causal reproducible con fixture local y prueba RED no vacua; comparar baseline. No corregir síntomas mediante sleeps, bajar aserciones, reinicios o reset de datos.
3. Aplicar parche mínimo TDD con componentes importados y Ponytail full; conservar guardas de licencia/namespace/generación, FIFO, readback y dedup atómica por opId.
4. Correr focal, Chromium/WebKit, regresiones históricas y full candidata/baseline. Registrar SHA exacto, archivos y logs. Revisión adversaria de carrera/IDOR/dinero.
5. Integrar solo tras gates. Aún NO-GO para clientes: no issuer de rol humano completo, no autoridad real cliente/deuda, no ACK comercial remoto, no pruebas físicas 2x PC–Safari/PWA–PC. No desplegar shell rojo.

## Invariantes
- Prioridades JFC: #3 PIN/identidad urgente + #1 ledger causal y #5 forense paralelos; #2 inbox cifrado después; #4 solo discusión.
- `stored-for-application` nunca equivale a `business-committed`.
- No conceder `ops:payment` por fixture, no asignar abonos a deudas automáticamente, no equiparar `clienteId` y `receivableId`.
- Sin secretos/PIN/licencias cliente en commits o notas; sin tocar clientes, Supabase/Cloudflare, ni PWA productiva.
- Este commit es SOLO documental: no afirma nuevas pruebas ni implementación.
