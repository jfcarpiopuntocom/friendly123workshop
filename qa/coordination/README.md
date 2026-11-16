# No-clobber: coordinación de injertos entre Codex, Claude y Sol

El contrato [INJERTOS-OWNERSHIP.json](../../docs/coordination/INJERTOS-OWNERSHIP.json) describe responsabilidades **provisionales**, no es prueba de identidad de GitHub, bloqueo de edición ni control de autorización de la aplicación.

La autoridad vigente de JFC es trabajar **en un solo repo** y **no reescribir lo que Codex ya implementó o empezó**. Por eso, antes de tocar una ruta:
1. Revisar el SHA del target `integrate/browser-injertos-20261116` y ramas/PRs actuales, y comprobar con Codex si hay cambios locales todavía sin commit (GitHub no puede detectar los cambios invisibles en su máquina).
2. Abrir rama aislada desde el target. El prefijo `codex/`, `sol/`, `claude/` o `fable/` se usa solamente para detectar solapamientos de colaboración; no concede permisos.
3. Ejecutar pruebas del guard y luego `node qa/coordination/no-clobber.mjs --actor sol --base <sha-de-base> --head HEAD` (sustituir el agente). No hay escrituras ni conexiones de red.
4. Si una ruta está asignada a otro agente, **detener ese cambio de archivo**, registrar el motivo en el handoff y realizar el traspaso explícito antes de modificarla. Nunca forzar el guard con cambio de nombre de rama.
5. Cambiar un componente a `integrated` en el manifiesto solo con SHA de commit de 40 caracteres y archivos realmente presentes. Una librería mencionada en Notion o instalada en otro workspace **no cuenta como integrada aquí**.
6. La CI en `.github/workflows/qa-no-clobber.yml` compara el diff real contra el target, no contra un SHA inventado de la aplicación. TDD: [RED 12/15](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43815730158) → [GREEN 15/15 y diff sin colisiones](https://github.com/jfcarpiopuntocom/friendly123workshop/actions/runs/43815999930).

**Alcance y límites:** no modifica la aplicación, contraseñas, Sync3, PWA, Workers ni dependencias. Controla rutas de archivo y veracidad mínima del inventario. No analiza el contenido de archivos, licencias ocultas, paquetes privados o bibliotecas indirectas. Para proteger el repositorio público se necesita revisión de secretos/PII además de este control. Si Codex ha hecho cambios locales sin publicarlos, ningún script de GitHub puede demostrar ausencia de duplicidad; se requiere su diff/handoff. La integración comercial v783 sigue pendiente.

**Dueños actuales del trabajo:** Codex = `apps/friendly-123/` e `injertos/`; Sol = `qa/browser/`, `qa/coordination/`; Claude = `qa/seguridad/`; `docs/coordination/` compartida, con el merge de Git como última defensa ante conflictos. Modificaciones en raíz histórica no permitidas en esta vía.
