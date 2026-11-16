# Relevo único para Codex, Claude, Sol, Fable y Ponytail
Fecha: 16-nov-2026. Fuente de verdad: [friendly123workshop](https://github.com/jfcarpiopuntocom/friendly123workshop), **rama `integrate/browser-injertos-20261116`**.

## Orden vigente JFC
> «desde ahora quiero que vaya todo a friendly123workshop repo ya existente, para que dejen de estar dislocados tu y Codex y mis Claudes, etc!!! ahi vamos a hacer todo el coding desde ahora en subcarpetas!».

Prevalece sobre instrucciones anteriores de usar `friendly-123`, `friendly-123-injertos` u otros clones como sitio de desarrollo. Los anteriores se consultan **sin escribir**. No push a main de producción ni despliegue automático. Se pospone la PWA/Workbox/instalaciones duplicadas: **hoy los browsers**.

## Qué existe de verdad aquí
- `AGENTS.md` y cabecera de `CLAUDE.md` y `.claude/ESTADO.md`: guía nueva para todos, sin borrar historia.
- `apps/friendly-123/`: árbol completo **v781 PUBLICO** `94a4e047cdb0b2b14cbab004de599d7e43fef79b`, copiado sin alterar bytes y verificado por GitHub Actions. Es el punto de partida común de código; **NO** son los últimos injertos Codex v783.
- `qa/browser/browser-first-commercial.test.cjs`, `adjust-legacy-static-assertion.cjs` y `package-browser-candidate.cjs`: copia byte-idéntica de pruebas sintéticas antes repartidas, sin datos de clientes.
- `.github/workflows/qa-browser-integration.yml`: corre dentro de `apps/friendly-123` en Chromium y WebKit con serviceWorkers bloqueados, red externa y WebSockets interceptados.
- `injertos/dinero/`, `injertos/equipo/`, `injertos/fotos/`, `injertos/yparty-worker/`, `qa/seguridad/`: carpetas canónicas de trabajo con contratos; ninguna README implica función integrada.

## Qué falta por integrar de Codex
El **parche REAL v783** y los módulos instalados (Dinero.js, Team/issuer, y-partyserver, y-indexeddb, fotos con ACK remoto; Workbox queda aplazado). Codex anteriormente indicó un `candidate.patch` y `imported-sources.tar.gz` locales, pero no hay bytes públicos/commits verificables de estos en este repositorio. **No atribuir el verde histórico v782 a la versión final**.

Para reconciliar:
1. Recuperar y respaldar localmente **la base v782 exacta** `f6276adac490f0610e130afec0615f98acd4b32b` desde el archivo anterior, sin sobrescribir el workshop.
2. Verificar el SHA y generar el diff v781→v782 **sólo de rutas comerciales pertinentes**. El árbol actualmente importado es v781; no aplicar un parche v783 diseñado sobre v782 directamente a v781 sin preparar primero la base.
3. Revisar **ANTES de publicar** que el diff, fixtures y config no contienen licencias/secretos/fotos/PINs reales (este repo es PUBLICO). No subir bundles privados completos.
4. Trabajar en una nueva rama creada desde `integrate/browser-injertos-20261116` y aplicar los cambios comerciales a `apps/friendly-123/`, librerías reutilizables en `injertos/`, tests a `qa/`. No editar el `docs/` histórico de raíz.
5. Abrir PR en **este mismo repo** contra `integrate/browser-injertos-20261116`, registrar SHA, copiar evidencias y corregir tests RED→GREEN. No generar rutas activas de SW en navegador hoy.
6. Si Team no tiene verdadero emisor backend con identidad humana de todos los roles, marcarlo P0 NO-GO remoto: el rol local NO autoriza recepción de costos, clientes, fotos privadas ni dinero.
7. Mantener venta local-first durable y `opId` tras 403, sin falsos ACK; no pedir que el usuario borre/reinstale ninguna PWA.

### Comandos orientativos para cada IA con acceso local
```bash
git clone https://github.com/jfcarpiopuntocom/friendly123workshop.git
cd friendly123workshop
git fetch origin integrate/browser-injertos-20261116
git checkout -b codex/v783-browser-integration origin/integrate/browser-injertos-20261116
cat AGENTS.md
cat docs/coordination/ESTADO-UNIFICACION-2026-11-16.md
# Integrar el código real auditado en apps/friendly-123/ e injertos/;
# nada de añadir archivos secretos al control de versiones.
git diff --check
# ... instalar dependencias y ejecutar pruebas según CI ...
git add apps/friendly-123 injertos qa docs/coordination
git commit -m "feat(browser): integrar injertos v783 con pruebas verificadas"
git push -u origin codex/v783-browser-integration
# Abrir PR a integrate/browser-injertos-20261116 en friendly123workshop
```

## Umbral de producto
La app debe vender en un aparato aunque el transporte remoto esté fuera; stock y dinero cambian una sola vez y sobreviven recarga, cierre y pago parcial. Integración remota: misma licencia, persona/rol autorizado, permisos verificados del lado del servidor, 0 bytes ilegítimos en Yjs, fotos exactas, catálogo y 22 claves preservadas, 2 ciclos PC→Safari/Opera→PC con evidencia y latencia. Nada toca producción sin gates y GO.

### Enlaces históricos de lectura
- [QA E2E antigua (v782)](https://github.com/jfcarpiopuntocom/friendly-123-injertos/pull/4)
- [Registro histórico en Notion](https://app.notion.com/p/4181642b67f381c0a3eff1ff56e44902)
- [Candidata browser sintética v782 — privada y NO-GO](https://github.com/jfcarpiopuntocom/friendly-123-injertos/releases/tag/qa-browser-v782-be1bf6b1b765)

**Bitácora:** cada IA añadirá notas fechadas en `docs/coordination/` y revisará `AGENTS.md` en el SHA de su rama. No multiplicar repositorios.
