# NEXT RELEASE · P2 · Accesibilidad WCAG 2.2 AA en friendly-123 · modo demo público

**Fuente:** informe de muestra entregado por JFC, fechado **16 noviembre 2026**. **Registro:** 16 nov Ecuador / 17 nov UTC. **Decisión de prioridad:** JFC solicita incorporar estos detalles en la **próxima versión**, con **prioridad inferior** a los P0 de sincronización, unión fría, durabilidad, autoridad de roles/PIN y corrección de inventario, ventas y dinero. **No hay versión numérica de destino autorizada.** Esta ficha es backlog y especificación de aceptación; NO demuestra todavía reproducciones independientes ni certifica cumplimiento legal.

**Alcance del informe recibido:** aplicación en demo pública; Chromium 1366×900; 10 flujos navegados; axe-core 4.x con etiquetas WCAG 2.0/2.1/2.2 A/AA, árbol accesible CDP, 16 Tab por flujo, medición de tamaños, inspección manual. Normas mencionadas: WCAG 2.2 AA y EN 301 549. **No tocó datos personales.**

## Métricas de la muestra (atribuidas al informe de JFC, no verificadas de nuevo)

- **8 nodos A/AA** con incumplimiento detectado por el análisis informado.
- **80 candidatos** a objetivo táctil menor de **24×24 píxeles**. **Antes de declarar 80 incumplimientos** aplicar excepciones de WCAG 2.2 criterio 2.5.8 (enlaces en línea, espaciado, equivalencias, etc.), sin alterar de forma indiscriminada layout.
- **3/10 flujos** con hallazgos automatizados A/AA; **0 imágenes sin alt**; **0 ID duplicados**; **0 controles interactivos sin nombre**; foco de Tab visible (borde sólido de 2 px en elementos visitados); **0 errores de consola**.
- **NO VERIFICADO:** modal de venta rápida en modo demo no se pudo abrir. Tampoco hubo NVDA/VoiceOver humano, zoom 200%, espaciado de texto ampliado, formularios forzados a error ni usuarios con discapacidad. El informe no es certificación de conformidad ni asesoría legal.

## Matriz exacta de los 10 flujos informados

| Flujo | Nodos A/AA | Reglas | Objetivos pequeños | Paradas Tab |
|---|---:|---|---:|---:|
| Acceso / PIN | 0 | ninguna | 3 | 212 |
| Inicio / hoy | 1 | color-contrast | 2 | 233 |
| Inventario / lista y filtros | 1 | color-contrast | 3 | 229 |
| Vendidos / historial | 0 | ninguna | 3 | 484 |
| Perchas y sucursales | 0 | ninguna | 6 | 36 |
| Clientes | 0 | ninguna | 12 | 164 |
| Comisiones | 6 | color-contrast, nested-interactive | 5 | 72 |
| Gastos | 0 | ninguna | 2 | 24 |
| Etiquetas y QR | 0 | ninguna | 2 | 17 |
| Avanzado | 0 | ninguna | 21 | 92 |

**Nota:** los 8 nodos combinan resultados de Inicio (1), Inventario (1) y Comisiones (6); el conteo de objetivos pequeños es una categoría distinta. Evitar afirmar de forma automática que todos los 80 violan 2.5.8 hasta analizar excepciones.

## Hallazgos y reparación no invasiva (H1–H4)

| ID | Severidad reportada | Criterio | Evidencia aportada | Cambio acotado / aceptación |
|---|---|---|---|---|
| H1 | GRAVE | WCAG 1.4.3 AA | Botón naranja en demo: **blanco sobre `#e86040`, 3.39:1**, texto 16px bold en 3 vistas | Cambiar fondo solo del botón afectado a `#b8402a` o texto a `#13202b`, respetando branding; recalcular ratio en DOM real **≥4.5:1** para texto normal; no alterar header amarillo aprobado |
| H2 | GRAVE | WCAG 4.1.2 A | **5 tarjetas Comisiones** con controles anidados, `div[data-product-id]` clicable con botón interior; doble tab-stop | Convertir tarjeta a grupo no interactivo y exponer **una acción Abrir ficha** + acciones hermanas separadas (p. ej., Editar), sin perder la funcionalidad ni las acciones por teclado; axe sin `nested-interactive` y orden/semántica accesible |
| H3 | MODERADO | WCAG 2.5.8 AA (2.2) | **80 candidatos <24×24 px**; concentrados en Avanzado (21), Clientes (12), Perchas (6) | Mínimo 24×24 para objetivos reales, preferiblemente más cómodo en táctil; aplicar padding/min-height sin romper formularios y registrar explícitamente excepciones permitidas. Re-test por navegador y zoom |
| H4 | MENOR | WCAG 1.3.1 A si estructura semántica perjudicada; también buena práctica | Saltos de encabezados en Inventario, Comisiones y Avanzado (1 cada) | Reordenar jerarquía h2/h3 dentro de cada vista manteniendo estilos/identidad visual; comprobar árbol accesible y navegación por encabezados |

### Anexo de selectores y propuestas recibidas

**H1 selector reproducible informado:** `div[data-gancho="hoy"] > button[data-gancho-prueba]`.

```css
/* Candidato visual, sujeto a medición contrastes y revisión de branding */
button[data-gancho-prueba] {
  background: #b8402a; /* antes #e86040 */
  color: #fff;
}
```

**H2 ejemplo semántico aportado:** sustituir `<div data-product-id="p07" onclick="abrir()"><button>Editar</button></div>` por un `div` no accionable con botones hermanos `Abrir ficha` y `Editar`, nombres accesibles claros. Preservar `data-product-id` y el comportamiento de caja/comisiones en pruebas E2E.

**H3 ejemplos dimensionados por la auditoría:**

| Vista | Elemento | Tamaño reportado |
|---|---|---|
| Hoy | footer `jfcarpio.com` y `avatiun.com` | 68×18, 67×18 |
| Inventario | `input#invAgrupar` | 22×22 |
| Escanear | `button#btnAplicarCierre` | 133×23 |
| Perchas | botones editar `✎` | 24×19 |
| Clientes | `input#cliCuenca` y otros checkbox | 13×13 |
| Comisiones | checkboxes | 13×13 |
| Avanzado | enlace `↑ Back to top` | 75×18 |
| Avanzado | `button#oc-emp-agregar` | 340×23 |

Los links de pie se repiten en otras vistas; analizar excepción *inline* antes de modificarlos. El informe propone `.control-compacto { min-width:24px; min-height:24px; padding:4px }` como referencia inicial, **no** inyectar globalmente: múltiples controles podrían cambiar layout o provocar overflow.

### H4 jerarquía

Inventario, Comisiones y Avanzado: revisar saltos entre h2/h3. No cambiar CSS para corregir semántica; validar orden en el árbol accesible.

## Plan vinculante para **próxima versión**: tres tandas, secuenciadas TRAS gates P0

> Estas son tres *tandas de trabajo*, NO tres lanzamientos nuevos ni un cambio de prioridades P0; las expresiones “Semana 1/2/3” son duración relativa del plan de muestra, no fechas de publicación prometidas.

- [ ] **Tanda 1 — H1 + H2** (estimaciones recibidas: 30 min + 2–4 h). En Inicio, Inventario y Comisiones correr axe 4.x sin hallazgos **graves** de contraste/nested-interactive; test teclado entra en la tarjeta exactamente por las acciones justificadas, sin nested focus/duplicación; re-test tras hotfixes funcionales.
- [ ] **Tanda 2 — H3** (4–8 h estimadas). Inventariar los 80 candidatos en Avanzado, Clientes y Perchas y resto de vistas, registrar excepciones de WCAG 2.5.8, dimensionar objetivos efectivos ≥24×24 cuando aplique, sin hacer popovers inutilizables. Probar touch, teclado, 1366×900 y tamaños móviles.
- [ ] **Tanda 3 — H4 + verificación manual** (1 h headings más verificación). NVDA y VoiceOver, zoom 200%, reflow, espaciado de texto, mensajes de error y modales, particularmente **venta rápida** anteriormente no verificable; no pérdida de foco, controles cortados ni cambios de venta/rol/PIN.

### Gates de release para estas mejoras, sin desplazar funcionalidad

1. Capturar **RED** axe + DOM+CSS de cada selector sobre candidato EXACTO, no manipular informes para inventar errores; los valores pertenecen a demo Chromium 2026-11-16 y pueden haber cambiado.
2. PR separada sobre la rama de **siguiente versión candidata**, un dueño por archivo y reserva en Notion; no tocar `docs/sync-yjs.js`, Workers, servicios, cifra, stock/venta, PIN o PWA sin necesidad demostrada.
3. Test **GREEN** axe WCAG 2.2 AA + verificación de teclado y lector de pantalla; conservar los 0 faltantes de alt/IDs; sin regressions en ventas, roles, comisiones, tamaños o Focus; sellar versión/manifest solo junto con la candidata final, nunca durante el P0.
4. Separar “cumplir todas las pautas” de un escaneo automatizado: auditoría manual y pruebas de dispositivos siguen necesarias. Registrar hallazgos no automatizables.

## Paquetes comerciales del informe — conservar como **ejemplo de oferta**, NO aprobados para publicar

| Paquete del informe | Alcance ilustrativo | Plazo indicado | Precio indicado |
|---|---|---|---|
| Express | 5 flujos, informe y prioridades | 48 h | USD 150 |
| Estándar | 10 flujos, informe, anexo técnico y plan | 72 h | USD 300 |
| Estándar con arreglos | 10 flujos + corrección de plantilla | 5 días | USD 600 |
| Vigilancia | Re-test mensual de 5 flujos y 5 hallazgos | mensual | USD 150/mes |

**Importante:** es una muestra de propuesta comercial proporcionada por JFC, NO instrucción para modificar `jfcarpio.com`, publicar paquetes, crear suscripciones o contactar prospectos.

## Estado y ruta de recuperación

- **Estado actual:** REGISTRADO como backlog P2 de **la siguiente versión**, pendiente de reproducir y ejecutar tras P0. No hay fixes de UI implementados en esta ficha.
- **P0 vigente:** la unión fría en producción [run 44012954943](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44012954943) aún FALLA RECUPERACION (28 páginas, 5348 frames y 15 padres Yjs faltantes). [PR privada #5](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/5) green 117 browser + 135 Team/WS/Yjs **sintéticos** pero sin GO comercial. [Workerd real YParty run 44015740350](https://github.com/jfcarpiopuntocom/friendly-123-injertos/actions/runs/44015740350): durabilidad 4/4 PASS, seguridad clon-device y precio-empleado 2 FAIL: **NO ACTIVAR**.
- Siguiente agente: leer esta ficha, conservarla en la planificación del siguiente release, respetar prioridades P0 y abrir PR H1/H2 aislada cuando la integración y estabilidad comercial tenga gate suficiente.
