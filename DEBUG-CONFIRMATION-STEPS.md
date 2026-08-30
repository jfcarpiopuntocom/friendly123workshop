# Plan de Confirmación — Hypothesis A: Join sin Sync Real

**Estado:** Producción - 29 de agosto de 2026
**Severidad:** CRÍTICA - Hipótesis A confirmada en celular
**Tokens disponibles:** ~110K

---

## Resumen Ejecutivo

En el celular del Lord:
- `f123_sync_room = null` (nunca conectó)
- Inventario = seed de fábrica (nunca llegó catálogo del equipo)
- PINs 444/777 = locales del namespace, no sincronizados
- `f123_owned` = licencia canónica S2J24 (reparada en PC, pendiente verificar en celular)

**Conclusión:** `unirse(codigo)` guardó ROOM_KEY pero `conectar()` falló silenciosamente. El namespace cambió, pero sin sincronización real.

---

## PASO 1: Verificar Versión del Shell (SIN consola)

**Ubicación:** App abierta → Avanzado (último tab)

### En el celular:
1. Abre la app (friendly-123)
2. Ve a Avanzado (botón inferior derecha)
3. Busca la sección "Acerca de" o "Versión"
4. Compara el número mostrado con `f123-shell-v149` (versión de producción esperada)

**Resultado esperado:**
- ✅ Si dice v149 o superior: shell está actualizado
- ❌ Si dice v88 o anterior: Service Worker atascado (Hypothesis D)

**Acción si falla:**
Cierra la app completamente (desliza en iOS, no solo minimizar). Espera 5 segundos. Reabre.

---

## PASO 2: Revisar Estado de Sync (SIN consola)

**Ubicación:** Avanzado → Sync Diagnostics (si existe panel)

### Qué buscar:
1. **Indicador de conexión:** Verde (conectado) / Gris (desconectado) / Rojo (error)
2. **Licencia mostrada:** ¿Aparecen dos licencias distintas en `licenseCode` vs `syncCode`?
3. **Sala activa:** ¿Qué código aparece?

**Hipótesis A confirmada si:**
- Indicador = GRIS (sin conexión)
- Y licenseCode = syncCode = S2J24 (la canónica)
- Y el inventario sigue siendo el seed de fábrica (Ceramic Ornament, Snow Globe, etc.)

**Hipótesis B (namespace viejo de pruebas):**
- Los productos del celular son algo que reconoces de una prueba anterior (no el seed genérico)
- LicenseCode/syncCode coinciden
- Pero los datos no son ni del Lord ni del cliente esperado

---

## PASO 3: Revisar Catálogo Visualmente

**Ubicación:** App abierta → Inventario (segundo botón)

### Identificar el seed de fábrica:
Si ves productos como:
- "Hand-Painted Ceramic Ornament"
- "Souvenir Snow Globe"
- "Poetry Collection - Advanced"
- "Premium Ceramic Set"

Son el seed genérico de `mock-backend.js` → **sync nunca llegó**.

**Si reconoces los nombres:**
- ¿Son productos tuyos que ingresaste en pruebas anteriores?
- ¿O de la tienda a la que intentaste unirte?

---

## PASO 4: Intentar Resincronizar (Botón NO destructivo)

**Ubicación:** Avanzado → buscar botón "Resincronizar" o similar

**Acción:** Toca el botón (si existe)

**Qué debería pasar:**
1. Indicador de sync cambia a AMARILLO (reconectando)
2. Espera 10-15 segundos
3. Si hay dispositivos del equipo online, el catálogo real debería llegar

**Si sigue gris después de 15s:** Hypothesis A confirmada → paso 5 obligatorio.

---

## PASO 5: Diagnóstico Manual (CON bookmarklet, si tienes tiempo)

Si los pasos 1-4 confirman Hypothesis A, ejecuta en Safari DevTools:

```javascript
// Confirmar identity corruption
JSON.parse(localStorage.getItem("f123_owned"))
// Debe mostrar: licenseCode = syncCode = "F123-A6YK-6V1J-BF2A-S2J24"

// Confirmar sala de sync
JSON.parse(localStorage.getItem("f123_sync_room"))
// Debe mostrar: {codigo: "F123-A6YK-6V1J-BF2A-S2J24"} (NO null)

// Confirmar dónde viven los datos
["f123_estado_v4_A","f123_estado_v4_B","f123_estado_v4::F123-A6YK-6V1J-BF2A-S2J24_A"]
  .forEach(k => console.log(k, "=>", localStorage.getItem(k) ? "DATOS (" + localStorage.getItem(k).length + " chars)" : "vacío"))
```

---

## Resumen de Hallazgos Esperados

| Escenario | licenseCode | syncCode | Sala | Catálogo | Conclusión |
|-----------|------------|----------|------|----------|------------|
| **Hypothesis A (esperado)** | S2J24 | S2J24 | {codigo: S2J24} | Seed genérico | Conectar() falló silenciosamente |
| **Hypothesis B** | S2J24 | S2J24 | {codigo: S2J24} | Datos reconocibles | Namespace viejo de pruebas |
| **SW viejo (D)** | Viejo (K7M2?) | Viejo | null o viejo | Seed | Service Worker atascado v88 |
| **BIEN** | S2J24 | S2J24 | {codigo: S2J24} | Catálogo del Lord | Sync funcionando |

---

## Próximos Pasos Tras Confirmación

1. **Si Hypothesis A confirmada:** Aplicar fix de `unirse()` en sync-realtime.js línea ~1230
2. **Si SW viejo:** Forzar actualización (Settings → Clear Cache, o esperar 24h)
3. **Si IndexedDB roto:** Buscar qué script pisa `window.indexedDB.open` después de aislamiento.js

---

## Notas para el Lord

- **No pierdes datos:** Todo vive en f123_estado_v4_A/_B intacto (70.667 caracteres confirmados)
- **PC está BIEN:** licenseCode=syncCode=S2J24, Avanzado funciona
- **Celular es el pendiente:** Confirma los 5 pasos arriba y reporta qué ves
- **Tiempo:** 10 minutos sin consola, 5 minutos más si necesitas bookmarklet
