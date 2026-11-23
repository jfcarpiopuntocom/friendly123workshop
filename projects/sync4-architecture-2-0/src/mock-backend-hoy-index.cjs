'use strict';
/**
 * Non-Sync3 Performance Fix: O(n) Map indexes inside /api/dashboard in docs/mock-backend.js.
 */

const DASHBOARD_DAILY_TARGET = `        const dailyReader = window.OCBusinessReadModel;
        const dailyProjection = dailyReader ? dailyReader.daily(ventasActivas().filter(v => !uid || uid === "todas" || v.ubicacionId === uid).map(v => ({...v,fechaLocal:fechaLocalDe(v.fecha,v.relojDesfaseMs),fechaDevolucion:v.fechaDevolucion || (ajustesComision.find(a => a && (a.id === v.devolucionId || (a.tipo === "devolucion" && a.ventaId === v.id))) || {}).fecha})),hoyISO(),ZONA) : null;`;

const DASHBOARD_DAILY_REPLACEMENT = `        const dailyReader = window.OCBusinessReadModel;
        let dailyProjection = null;
        if (dailyReader) {
          const _ajPorId = new Map();
          const _devPorVentaId = new Map();
          for (let i = 0; i < ajustesComision.length; i++) {
            const a = ajustesComision[i];
            if (!a) continue;
            if (a.id != null && !_ajPorId.has(a.id)) _ajPorId.set(a.id, a);
            if (a.tipo === "devolucion" && a.ventaId != null && !_devPorVentaId.has(a.ventaId)) _devPorVentaId.set(a.ventaId, a);
          }
          const _ventasScope = ventasActivas().filter(v => !uid || uid === "todas" || v.ubicacionId === uid).map(v => {
            let fDev = v.fechaDevolucion;
            if (!fDev) {
              const aj = (v.devolucionId != null && _ajPorId.get(v.devolucionId)) || _devPorVentaId.get(v.id);
              if (aj) fDev = aj.fecha;
            }
            return { ...v, fechaLocal: fechaLocalDe(v.fecha, v.relojDesfaseMs), fechaDevolucion: fDev };
          });
          dailyProjection = dailyReader.daily(_ventasScope, hoyISO(), ZONA);
        }`;

const DASHBOARD_WEEKLY_TARGET = `        const devSemana = ajustesComision.filter((a) => a && a.tipo === "devolucion" && new Date(a.fecha).getTime() >= hace7dias && (!uid || uid === "todas" || a.ubicacionId === uid))
          .map((a) => ventas.find((v) => v.id === a.ventaId)).filter(Boolean);`;

const DASHBOARD_WEEKLY_REPLACEMENT = `        const _devSemanaAjustes = ajustesComision.filter((a) => a && a.tipo === "devolucion" && new Date(a.fecha).getTime() >= hace7dias && (!uid || uid === "todas" || a.ubicacionId === uid));
        let devSemana = [];
        if (_devSemanaAjustes.length) {
          const _ventaPorId = new Map();
          for (let i = 0; i < ventas.length; i++) {
            const v = ventas[i];
            if (v && v.id != null && !_ventaPorId.has(v.id)) _ventaPorId.set(v.id, v);
          }
          devSemana = _devSemanaAjustes.map((a) => _ventaPorId.get(a.ventaId)).filter(Boolean);
        }`;

function applyPatchToSource(source) {
  let out = source;
  let changed = false;
  if (!out.includes('const _devPorVentaId = new Map()')) {
    if (!out.includes(DASHBOARD_DAILY_TARGET)) throw new Error('Target `/api/dashboard` dailyProjection block not found');
    out = out.replace(DASHBOARD_DAILY_TARGET, DASHBOARD_DAILY_REPLACEMENT);
    changed = true;
  }
  if (!out.includes('const _devSemanaAjustes =')) {
    if (!out.includes(DASHBOARD_WEEKLY_TARGET)) throw new Error('Target `/api/dashboard` devSemana block not found');
    out = out.replace(DASHBOARD_WEEKLY_TARGET, DASHBOARD_WEEKLY_REPLACEMENT);
    changed = true;
  }
  return { changed, source: out };
}

module.exports = { applyPatchToSource };
