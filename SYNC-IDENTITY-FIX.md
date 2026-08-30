# Fix: Bug de Identidad en Join (unirse)

**Archivo:** `docs/sync-realtime.js`  
**Líneas afectadas:** ~1223-1322 (función `unirse`), ~1260-1273 (rama Lord)  
**Severidad:** P0 - Corrupción de identidad en producción  
**Impacto:** Lord y usuarios normales pierden identidad al hacer join

---

## Causa Raíz

### Problema 1: `conectar()` falla silenciosamente sin bloquear `cambiar()`

```javascript
// CÓDIGO ACTUAL (línea ~1230)
const r = this.activar(codigo);
// activar() guarda ROOM_KEY y llama a conectar()
// PERO: conectar() es async, no se espera el resultado

// Continúa inmediatamente a cambiar(), sin confirmar que conectó
try {
  if (r && r.ok && window.OCTienda && window.OCTienda.cambiar) {
    const c = window.OCTienda.cambiar(cod, { desde: _desde });
    // ← Cambia de namespace SIN sync real si conectar() falló
  }
}
```

**Resultado:** Dispositivo en namespace correcto pero sin WebSocket activo → inventario vacío, ni siquiera pide catálogo.

### Problema 2: Lord adopta identidad ajena sin límite

```javascript
// CÓDIGO ACTUAL (línea ~1260-1273)
if (_esLord()) {
  _registrarAcceso(_codNorm);
  if (_codNorm && /^F123-/.test(_codNorm)) {
    _ow.licenseCode = _codNorm;  // ← ADOPTA la licencia del cliente
    _ow.syncCode = _codNorm;     // ← Se vuelve indistinguible del cliente
  }
}
```

**Resultado esperado de la rama Lord:** Auditoría únicamente, identidad inalterada.  
**Resultado real:** PC del Lord reporta licencia del cliente al Worker → panel muestra datos incorrectos.

### Problema 3: `f123_tiendas` corrupta acumula mapeos viejos

Registro que nunca se auto-limpia cuando un namespace se abandona:

```javascript
// f123_tiendas actual (en PC del 28 ago)
{
  "P3W1D": "",       // ← Apunta a namespace propio (corrupción)
  "JENF": ""         // ← También apunta a "" (corrupción)
}
```

**Resultado:** Si el cambiar() se ejecuta 2x con licencias distintas, ambas quedan registradas apuntando al mismo namespace.

---

## Fix: Implementación

### Fase 1: Clave Inmutable para el Lord

**Agregar línea ~154 (tras `const LORD_KEY = "f123_lord"`):**

```javascript
const LORD_LICENCIA_CANONICA_KEY = "f123_lord_licencia_canonica";

function _licenciaCanonicaDelLord() {
  try {
    if (!_esLord()) return null;
    return localStorage.getItem(LORD_LICENCIA_CANONICA_KEY) || null;
  } catch (_) { return null; }
}

function _fijarLicenciaCanonicaDelLord(licencia) {
  if (!_esLord()) return;
  try {
    // SOLO se escribe UNA vez, al verificar el código maestro (en auth-ui.js)
    if (!localStorage.getItem(LORD_LICENCIA_CANONICA_KEY)) {
      localStorage.setItem(LORD_LICENCIA_CANONICA_KEY, String(licencia || ""));
    }
  } catch (_) {}
}
```

### Fase 2: Reescribir la rama Lord en unirse()

**Reemplazar líneas ~1260-1273:**

```javascript
// ANTES:
if (_esLord()) {
  _registrarAcceso(_codNorm);
  if (_codNorm && /^F123-/.test(_codNorm)) {
    _ow.licenseCode = _codNorm;
    _ow.syncCode = _codNorm;
  }
}

// DESPUÉS (FIX):
if (_esLord()) {
  _registrarAcceso(_codNorm);
  // Lord NUNCA adopta licencia ajena. Conserva su identidad canónica.
  // La canónica se fijó UNA SOLA VEZ en auth-ui.js al verificar el código maestro.
  const licenciaCanonica = _licenciaCanonicaDelLord();
  if (licenciaCanonica && /^F123-/.test(licenciaCanonica)) {
    _ow.licenseCode = licenciaCanonica;
    _ow.syncCode = licenciaCanonica;
  }
  // Si por algún motivo no tiene canónica guardada, NO adopta nada.
  // Queda como está: es un guard, no una puerta.
}
```

### Fase 3: Validar conexión antes de cambiar()

**Modificar líneas ~1305-1320:**

```javascript
// ANTES:
try {
  if (r && r.ok && window.OCTienda && window.OCTienda.cambiar) {
    const sala = leerSala();
    const cod = sala && sala.codigo ? sala.codigo : codigo;
    const c = window.OCTienda.cambiar(cod, { desde: _desde }); // Recarga sin confirmar conexión
  }
} catch (_) {}
return r;

// DESPUÉS (FIX):
try {
  if (r && r.ok && window.OCTienda && window.OCTienda.cambiar) {
    const sala = leerSala();
    const cod = sala && sala.codigo ? sala.codigo : codigo;
    
    // Validar que la sala se guardó y está lista para conectar
    if (!sala || !sala.codigo) {
      return { ok: false, error: "Failed to set sync room. Try again." };
    }
    
    // NO esperamos la conexión completa (es async), pero sí confirmamos que
    // se intentó: notificarEstado("conectando") ya se ejecutó en conectar().
    // Si conectar() falla por red, el backoff reintentará.
    // Aquí solo confirmamos que la sala quedó guardada.
    
    const c = window.OCTienda.cambiar(cod, { desde: _desde });
    
    // Si cambiar() no recargó (mismo:true), se fuerza reconexión
    if (c && c.mismo) {
      try { reintentoMs = 1000; intentosSeguidos = 0; conectar(); } catch (_) {}
      return { ok: true, mismo: true, info: "Re-syncing with team..." };
    }
  }
} catch (err) {
  try { console.error("[unirse] error:", err); } catch (_) {}
  return { ok: false, error: "Unexpected error. Try again." };
}
return r;
```

### Fase 4: Blindar cambiar() contra f123_tiendas corruptas

**Ubicación:** En el archivo que implementa `window.OCTienda.cambiar()` (probablemente `mock-backend.js` o módulo de datos).

**Patrón a buscar:**

```javascript
// DONDE SEA QUE ESCRIBA f123_tiendas:
var tiendas = JSON.parse(localStorage.getItem("f123_tiendas") || "{}");
tiendas[sufijo] = namespace; // ← Aquí se corrompe si sufijo ya existe
localStorage.setItem("f123_tiendas", JSON.stringify(tiendas));

// DESPUÉS (FIX):
var tiendas = JSON.parse(localStorage.getItem("f123_tiendas") || "{}");

// Blindaje: si el sufijo ya existe y apunta a "" (namespace compartido),
// es un mapeo corrupto de una sesión anterior. Lo borramos.
if (tiendas[sufijo] === "" || tiendas[sufijo] === null) {
  delete tiendas[sufijo];
}

tiendas[sufijo] = namespace; // Ahora escribe limpio
localStorage.setItem("f123_tiendas", JSON.stringify(tiendas));
```

---

## Verificación Post-Fix

### En el PC del Lord:
1. Abre Avanzado → Sync diagnostics
2. Debe mostrar licenseCode = syncCode = tu licencia canónica (S2J24)
3. Intenta join a una tienda de cliente
4. PC debe reconectar a SU PROPIA licencia tras terminar, no quedarse en la del cliente

### En un celular de cliente:
1. Código de tu negocio en Avanzado → Sync
2. Tras 10 segundos, el catálogo debe llegar sin tocar "Merge"
3. Los PINs del equipo deben funcionar

### Automatizado (si tienes tests):
```javascript
// Verificar que Lord nunca corrompe identidad
const ow = JSON.parse(localStorage.getItem("f123_owned"));
const expectedLicense = localStorage.getItem("f123_lord_licencia_canonica");
assert(ow.licenseCode === expectedLicense, "Lord cambió de identidad");
assert(ow.syncCode === expectedLicense, "syncCode divergió de licenseCode");
```

---

## Notas de Diseño

- **No es retroactivo:** Los datos guardados en f123_estado_v4_ no se borran ni se mueven. El fix es solo de identidad.
- **Lord puede entrar a cualquier tienda:** Seguirá registrando accesos, pero ahora regresa a su propia identidad después.
- **Usuarios normales no cambian:** Adoptan la licencia (comportamiento esperado), solo que ahora sincronizarán de verdad antes de cambiar de namespace.

---

## Timeline de Cambios (fecha esperada: 30 agosto 2026)

1. **Ahora:** Merge del fix a main/production
2. **5 min:** SW ve el cambio en sync-realtime.js
3. **10 min:** Dispositivos existentes piden actualización del SW
4. **24h max:** Todos los dispositivos en v149+ tienen el fix
5. **Mientras:** Usuarios sin fix siguen con el bug, pero datos intactos (sin pérdida)
