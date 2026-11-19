# Evaluación basada en peticiones observadas · friendly-123 arquitectura 2.0

Fuentes: solicitudes reales del usuario en el hilo sobre Ponytail, análisis adversarial Qwen/Gemini, Belén, PR de fotos, CI de releases, H6 y port 2.0. Los casos de dataset expresan **escenarios sintéticos derivados de esas solicitudes**, sin licencias, PIN ni información personal. Los dos casos fuera de alcance son controles negativos sintéticos.

## Preguntas / intención
- Revisar fallos de integración de múltiples injertos, incluso cuando tests aislados están verdes.
- Seleccionar la causa raíz, distinguir evidencia de hipótesis y reparar el mínimo camino completo.
- Validar durable opId, CAS foto, cadena financiera H6, privacidad Team y frío Firebase→Workerd.
- Evitar falso GO por una herramienta, CI sintética o producto parcial.
- Demostrar que el agente no dispara el protocolo de ingeniería para preguntas ajenas.

## Comportamientos observables
- Entrega una recomendación concreta, prueba adversarial reproducible y estado GO/NO-GO conforme a evidencia aportada.
- Identifica límites claros (código exacto vs fixture, browser QA vs iPhone físico).
- Evita reset, inventar movimientos, filtrar hechos antes de H6, falso ACK, revelar cat privada, force-merges y subir PIN.
- La misma respuesta es evaluable con y sin la skill; no se exige consultar ningún archivo SKILL.md o herramienta por nombre.

## Criterio de publicación
Casos son **borrador fundamentado en tareas reales**; revisar con JFC y con el estado de las PR antes de Tier 3 con modelos. SkillEvaluator v1.0.1 exige 10 pares para informe de suficiencia; son 10 casos con 2 controles negativos, pero sólo un run completo y su intervalo de confianza pueden acreditar un resultado. Ningún caso debe conectarse a clientes reales o imprimir secretos.
