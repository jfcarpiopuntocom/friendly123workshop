# C246 · revisión compartida (no publicar)

Base del parche: friendly-123 master 58a9d3f (v0.9.25). El master avanzó a c3ec60e (v0.9.27): comprobar aplicación, regenerar minificados y repetir pruebas antes de integrar. El parche incluye solo fuentes y pruebas; no incluye minificados, datos de clientes ni el experimento de hechos.js.

Objetivo: cuando un canal queda en recuperación, aplicar lotes posteriores de catálogo sin exponer identidad parcial ni encolar detrás de una venta, pago o retención. El documento Yjs conserva las operaciones pendientes. Respetar sesión, modo demo, licencia y cuaderno.

Pruebas previas en base 58a9d3f: RED/GREEN sintético de cambios de lote, fallo, cierre/reingreso, namespace, identidad y cola con venta/pago/retención; WebKit aislado con archivos minificados mostró 5→14. Revisión independiente en https://app.notion.com/p/4221642b67f3811cb80ed21b6d6ed637. No valida clientes, iPhone físico ni la cascada real completa.

No publicar todavía. Falta revalidar sobre v0.9.27, revisión de la versión exacta, generación de manifest/shell y coordinación. Riesgo separado en hechos.js de v0.9.27: el marcador de migración podría establecerse al abrir una base prefijada vacía cuando otra base raw existe y el listado está incompleto o solo reporta raw; procedencia desconocida. NO importar ni mezclar datos sin prueba de identidad. Ver https://app.notion.com/p/4231642b67f3812f9291fe70fe198eb4.

Archivo local de este entorno: /workspace/shared/friendly123-coordinacion/c246-v925/. No se ha probado acceso desde ordenadores externos; esta rama de workshop es la copia remota para coordinación.

SHA-256 de c246-source.patch: 47ed77406ec65ae762fce7dae7ca0aff4bec429d0d35a2a735382ac136e1a6ec
