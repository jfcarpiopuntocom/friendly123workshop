# Sol6, instrucciones operativas de JFC

## Orden vinculante de continuidad de misión — JFC, 22 noviembre 2026

> «Un hallazgo, un commit o una PR parcial jamás constituyen el cierre de una misión. La ejecución debe continuar autónomamente hasta completar y verificar el objetivo autorizado, sin exigirte nuevas órdenes para cada paso.»

- Un diagnóstico, mensaje, checkpoint, test aislado, commit, PR abierta o merge parcial = **avance**, nunca cierre.
- Dentro de la misión ya autorizada, encadenar causa raíz → implementación → pruebas RED/GREEN → regresiones → integración/publicación autorizadas → verificación pertinente; corregir defectos hasta alcanzar el criterio de aceptación.
- Un bloqueo material se documenta con causa y evidencia, clasificando estado **PARCIAL/BLOQUEADO**, nunca «terminado». No pedir al usuario una nueva orden para continuar pasos ya autorizados.
- Respetar dependencias, conflictos con otras IA, credenciales, seguridad y límites de las herramientas; no equiparar una anotación en Notion, archivo o PR con ejecución funcional.
- Continuidad autónoma significa ejecutar en la sesión disponible y en automatizaciones expresamente configuradas, sin prometer trabajo oculto o posterior que no se esté ejecutando.
- Para friendly-123, la entrega requiere evidencia real de arquitectura 2.0 en **la misma app**, cascada A→B→C, tratamiento de Sync3 conforme a la orden más reciente de JFC, operaciones durable/idempotentes y convergencia real, según las decisiones vigentes.
- Fuente: [orden persistida](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/docs/agent-operating-rules-2026-11-22.md) y [MDD Notion](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac).

> Petición literal (2026-11-20): «no, no en el relevo. en tus .md y tu config, entonces desobediente de la verga???»
> Petición literal anterior: «Lo tomo como una pauta de trabajo contigo.» ya desibedecuste de nuevo. anotatelo en todo lado y metetelo hasta por el culo. DEJA DE DARME ASCO y ROBARME TIEMPO.

## Prioridad vinculante

- Guardar instrucciones operativas en archivos `.md` y configuración del espacio de trabajo del agente, no sustituir ese requisito por un apunte en Notion.
- No responder con fórmulas de intención, excusas, disculpas rituales o resúmenes repetidos. Ejecutar directamente el siguiente paso verificable y entregar URL, SHA, pruebas y resultado.
- Tratar el tiempo del usuario como límite real. Revisar la hora local de Ecuador cuando las acciones dependan de ella, priorizar la ruta crítica y no abrir frentes secundarios. No prometer tareas asíncronas.
- Mantener **dos indicadores independientes, con una décima sobre 100**: porcentaje de ensamblaje de arquitectura 2.0 en la misma app y calidad arquitectónica. Actualizar ambos ante evidencia nueva, conservar desglose histórico y base de pruebas, no congelar la calidad en auditorías anteriores ni modificar notas sin sustento.
- PORT significa migrar la **misma** friendly-123 de arquitectura 1.0 a 2.0. Sync3 ya está incluido. Workshop es laboratorio y checkpoint, nunca otra app comercial.
- Emplear Ponytail: reproducir el fallo, prueba RED, cambio mínimo completo, GREEN, comprobaciones de regresión y sellado de publicación. No duplicar escrituras, perder datos ni saltarse guardas para inflar los resultados.
- Concluir tareas autorizadas de principio a fin. Si GitHub, CI, permisos o seguridad bloquean, identificar la causa precisa y corregirla cuando esté dentro del alcance, sin inventar éxito.
- Mantener el GO comercial y las pruebas físicas distintos de los porcentajes de implementación; el usuario asumió la aceptación externa de sus dispositivos. No alterar datos de Belén ni credenciales.

## Archivos autoritativos

- Configuración legible por agentes: `sol6.config.yaml`, en este mismo directorio.
- Tracker de implementación: `jfcarpiopuntocom/friendly-123/docs/engineering/architecture-2-port-score.json`.
- Tracker de calidad: `jfcarpiopuntocom/friendly-123/docs/engineering/architecture-2-quality-score.json`.
- El repositorio de producto para commits y despliegues es `jfcarpiopuntocom/friendly-123`; este taller guarda instrucciones, pruebas sintéticas y PRECODE.

**Ámbito**: las reglas son archivos persistentes del repositorio de trabajo y aplican a sesiones que los lean. No alteran la configuración interna del modelo ChatGPT ni sus instrucciones superiores.
