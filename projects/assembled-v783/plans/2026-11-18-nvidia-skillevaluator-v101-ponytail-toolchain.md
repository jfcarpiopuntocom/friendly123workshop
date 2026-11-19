# NVIDIA SkillEvaluator v1.0.1 · herramienta transversal para injertos friendly-123

Fecha: 2026-11-18 Ecuador. **PLAN ANTES DEL CÓDIGO**. Base única workshop main `4f588e8b3e2813b27c6f42283df8aee04f12ebc9`. Rama `feat/20261118-nvidia-skillevaluator-v101-port-audit`. No editar `friendly-123` LIVE, ni las rutas de foto #117, importador #116, ni metadatos de GO/port.

## Misión
Integrar [NVIDIA/SkillEvaluator v1.0.1](https://github.com/NVIDIA/SkillEvaluator/releases/tag/v1.0.1) como evaluador de **SKILL.md e instrucciones de agentes** (Ponytail, Superpowers, auditoría adversarial y Notion) para Codex, Claude Code, Hermes, OpenCode y otros harnesses. No confundir score de skills con calidad arquitectónica 67/100, culminación port 57/100 o 0/6 GO. Fuente de release: tag `v1.0.1` commit firmado `914c15c`. Workflow oficial versionado: `evaluate-skills.yml@c9369a7811bde083b550f2ac488222e8c388d7fd` + imagen `ghcr.io/nvidia/skillevaluator-tier1@sha256:fbff256df8f760019539d442b7cb533d7ec50efab37f4482b7b670e2e4b4189a`, ambos extraídos de la plantilla release `ci/bundles/1.0.1/skill-checks.yml`.

## TDD / implementación
1. Crear **skill pequeña** bajo `skills/friendly123-ponytail/SKILL.md`, nombre/frontmatter y descripción compatibles en seis harnesses. Triggers: tarea de port/PR/release/QA de friendly-123. Contenido: origen Notion obligatorio; localizar autoridad y reserva; plan escrito en workshop; mínimo cambio completo; RED real → GREEN completo; detectar conflictos entre injertos; gate de CI/CD, coldjoin, ACK por opId, foto SHA, dinero e identidad; evidencia SHA y notar GO físico. Nunca pedir PIN ni subir secretos a logs o evaluaciones. 
2. Incorporar CI oficial NVIDIA v1.0.1 `.github/workflows/skill-checks.yml` con paths `skills`, threshold >=80, image/workflow por SHA inmutable; Tier1 escáner real sin LLM/credenciales, reportes como artifact. Auto PR + push main; no deploy, salida real no engañosa.
3. Añadir `skills/friendly123-ponytail/evals/EVAL.md` con casos provenientes de peticiones textuales del usuario (y negativo genérico), criterios observables iguales con/sin skill; preparar Tier2 dedup y Tier3 con y sin skill como fases explícitas, `evals.json` sólo al revisar dataset y tener proveedor/sandbox. No afirmar lift hasta ejecutar.
4. Comprobar `check-runs` del SHA de PR; si CI falla, leer el log y corregir SOLO el archivo conflictivo. Si Workflow externo no está permitido, no reducir checks; pasar a una ejecución por CLI pinneado en runner de CI.
5. Registrar salida en Notion como checkpoint vinculado a la MDD aprobada, al workshop y a las auditorías Qwen/Gemini. **Mantener el port 2.0 en ruta A→F; SkillEvaluator es solo instrumental.**

## Contratos adversariales obligatorios (no son cobertura automática de NVIDIA)
- Qwen/Gemini/Hermes: historial Firebase largo, early pre-cut con padres Yjs independientes, falso HEAD del canario, 401, cuotas y snapshots.
- Fotos: CAS opcional sin UI conectada, intento IDB durable, readback por opId y conflicto concurrente A→B→C; Workerd #117 sin blobs Yjs.
- H6: snapshot íntegro y cadena financiera verificada antes del filtro remoto.
- Release: hotfix puede publicar antes de fallar `union-fria`; probar el **SHA candidato** antes del GO, sin rollback automático de datos comerciales.
- Workers: no divulgar raw Y.Doc a Team, no marcar `stored-for-application` como `business-committed`; importación de historial no incompleto.
- Prioridad de Belén por raíz, no por orden cronológico; 6 gates A20 B20 C10 D25 E10 F15 inmutables.

## Restricciones
- Sólo paths nuevos `skills/`, `.github/workflows/skill-checks.yml`, este plan y reporte de evidencia. Sin reservas de otros agentes.
- Tier2 requiere proveedor embeddings + chat; Tier3 requiere casos revisados, proveedor, agente y sandbox (Docker predeterminado). **No credenciales en PR/fork**, no gastos automáticos no autorizados.
- Ambiente actual de ejecución no resuelve PyPI por DNS: usar GitHub Actions y no presentar una instalación local fallida como suite aprobada.
- Los tests de skills no mueven calidad ni port/100 ni un solo gate GO.
