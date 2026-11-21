# C101 PRECODE — separación del canario de unión fría respecto al despliegue

Fecha: 2026-11-20 Ecuador; orden: JFC «Sigue greenlight fast track!!!».

## Evidencia RED real
- v0.8.30 hotfix run [44850563486](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44850563486): probar, construir, desplegar y recorrer SUCCESS; subjob `recorrido/union-fria` FAILURE; run global FAILURE pese a página web publicada y con release-proof SHA íntegro.
- v0.8.31 hotfix run [44851443156](https://github.com/jfcarpiopuntocom/friendly-123/actions/runs/44851443156) igualmente se invoca desde `hotfix.yml` con evento `push`.
- `.github/workflows/recorrido.yml`: comentario asegura que `union-fria` no corre en `workflow_call` pero su `if:` usa solo `github.event_name == 'push' || schedule || workflow_dispatch`. Según GitHub Docs, workflow reusable hereda el `github` context del caller, incluido el nombre del workflow. En un hotfix con push, la condición es true indebidamente.

## Objetivo y contrato
1. **No esconder ni aprobar la unión fría.** Mantener el canario independiente **ROJO si falla**, en runs `recorrido` directos `schedule`, `workflow_dispatch` y `push` que afecte archivos del canario. Mantener HTTP/cliente y prueba de páginas reales `recorrer` en cada hotfix.
2. En llamado `hotfix -> workflow_call recorrido`, permitir solamente `recorrer`, nunca `union-fria`; no permitir que el CI de historia 1.0 falle después de desplegar, a menos que ocurra en su workflow independiente.
3. Prueba RED primero: resolver matriz para combinación de `github.workflow` y `github.event_name`, incluyendo hotfix(push) NO, recorrido(schedule/dispatch/push) SÍ, workflow diferente llamado NO.
4. Mínimo cambio en `.github/workflows/recorrido.yml` y nueva prueba `test/recorrido-workflow-call-isolation.test.cjs`. No modificar app, autenticación, worker, PN/Yjs, foto, SW, shell ni clientes. No cambiar score de transición 94,0/100 ni calidad 80,4/100. GO 0/6, física 0/5.

## Ejecución
PRECODE → tests RED en GH Actions → condicional robusto usando `github.workflow == 'recorrido'` y condición de evento; comprobar helper/ejecuciones GitHub Actions → GREEN exacto → merge si todos los checks relevantes pasan → readback en master. La recuperación real de la tienda sintética es un P0 distinto y sigue abierta, documentada en Notion.

Fuentes: https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations ; https://app.notion.com/p/41d1642b67f3811db916d2c190983473 .
