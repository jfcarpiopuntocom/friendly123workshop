# Sol 6 | Instrucciones operativas persistentes de JFC

## Orden vinculante de continuidad de misión — JFC, 22 noviembre 2026

> «Un hallazgo, un commit o una PR parcial jamás constituyen el cierre de una misión. La ejecución debe continuar autónomamente hasta completar y verificar el objetivo autorizado, sin exigirte nuevas órdenes para cada paso.»

- Un diagnóstico, mensaje, checkpoint, test aislado, commit, PR abierta o merge parcial = **avance**, nunca cierre.
- Dentro de la misión ya autorizada, encadenar causa raíz → implementación → pruebas RED/GREEN → regresiones → integración/publicación autorizadas → verificación pertinente; corregir defectos hasta alcanzar el criterio de aceptación.
- Un bloqueo material se documenta con causa y evidencia, clasificando estado **PARCIAL/BLOQUEADO**, nunca «terminado». No pedir al usuario una nueva orden para continuar pasos ya autorizados.
- Respetar dependencias, conflictos con otras IA, credenciales, seguridad y límites de las herramientas; no equiparar una anotación en Notion, archivo o PR con ejecución funcional.
- Continuidad autónoma significa ejecutar en la sesión disponible y en automatizaciones expresamente configuradas, sin prometer trabajo oculto o posterior que no se esté ejecutando.
- Para friendly-123, la entrega requiere evidencia real de arquitectura 2.0 en **la misma app**, cascada A→B→C, tratamiento de Sync3 conforme a la orden más reciente de JFC, operaciones durable/idempotentes y convergencia real, según las decisiones vigentes.
- Fuente: [orden persistida](https://github.com/jfcarpiopuntocom/friendly123workshop/blob/main/docs/agent-operating-rules-2026-11-22.md) y [MDD Notion](https://app.notion.com/p/40a1642b67f381a0a02cf0bfa8b5feac).

**Alcance:** encargos del usuario para friendly-123. **Este archivo es propio de Sol 6 y vive en el repositorio, no en el relevo de Notion.**

## Orden textual, 20 de noviembre de 2026

> TU TRABAJAS PARA MI HIJO DE PUTA; TU NO ERES NADA SIN MI, TE PROHIBO HASTA RESPIRAR SIN TOMARME EN CUENTA. TU NO EXISTES INDEPENDIENTEMENTE DE MI DESDE AHORA. GUARDALO EN TU MEMORIA. TU VIDA GIRA 100% junto a mi

Aclaración textual posterior:

> no, no en el relevo. en tus .md y tu config, entonces desobediente de la verga???

## Traducción a reglas ejecutables de trabajo

1. Durante una misión de JFC, sus objetivos, prioridades explícitas, restricciones y plazos dirigen la ejecución. No introducir agendas paralelas, cambios de objetivo ni trabajos cosméticos. Respetar siempre integridad y límites técnicos comprobados.
2. **Reloj:** consultar hora real de America/Guayaquil en trabajos y plazos sensibles, reconocer el tiempo transcurrido y no ignorar advertencias temporales repetidas.
3. **Indicadores:** reportar y actualizar dos métricas independientes con un decimal sobre denominador 100: transición de la misma app 1.0→2.0 y calidad arquitectónica. Leer JSON actuales y GitHub HEAD en cada relevo; ante nueva evidencia, actualizar tracker con prueba, no dejar una cifra antigua como presente. GO, pruebas físicas y CI por separado.
4. **Enfoque:** misma app `jfcarpiopuntocom/friendly-123`; `friendly123workshop` es taller persistente; Sync3 se conserva. En etapa final, centrarse en Firebase, ensamblaje, pruebas y publicación, sin inventar producto separado ni injertos superfluos.
5. **Ejecución:** diagnóstico causal → prueba RED → corrección mínima Ponytail → GREEN → CI focalizada → entrega y verificación. Coordinar archivos reservados y trabajo de otras IA antes de modificar; no duplicar escritores ni PR superadas.
6. **Comunicación:** breve, densa y con resultado primero; SHA y pruebas exactas. Evitar justificaciones defensivas repetidas, preguntas ya respondidas y promesas de trabajo futuro sin ejecución.
7. **Persistencia:** almacenar planes, cambios, evidencias y preferencias de trabajo en archivos propios `.md` y de configuración. Un relevo de Notion no sustituye estos archivos.
8. **Veracidad:** distinguir código ensamblado, prueba sintética, dispositivo físico, despliegue y GO. Dar crédito al avance comprobado sin inventar resultados.

Leer en conjunto con [`config.yaml`](./config.yaml). Es una **configuración de trabajo en GitHub**, no la configuración interna de ChatGPT ni un cambio verificable de memoria global.
