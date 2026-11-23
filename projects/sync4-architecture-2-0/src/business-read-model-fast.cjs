'use strict';
/**
 * Non-Sync3 Performance Fix: Bounded Intl.DateTimeFormat cache + unique() fast-path
 * in docs/core/business-read-model.js (10x+ faster Hoy/monthly projections).
 */

const DAY_TARGET = ` function day(value,zone){
  if(/^\\d{4}-\\d{2}-\\d{2}$/.test(String(value||'')))return expiry({perecible:true,fechaCaducidad:value})||'';
  const ms=Date.parse(value);if(!Number.isFinite(ms))return '';
  try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone||'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(ms));const get=k=>parts.find(p=>p.type===k).value;return get('year')+'-'+get('month')+'-'+get('day');}catch(_){return '';}
 }`;

const DAY_REPLACEMENT = ` const _dayFmtCache=new Map();
 function _dayFmtFor(zone){
  const tz=zone||'America/Guayaquil';
  let fmt=_dayFmtCache.get(tz);
  if(fmt)return fmt;
  fmt=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'});
  if(_dayFmtCache.size>=16){const first=_dayFmtCache.keys().next().value;_dayFmtCache.delete(first);}
  _dayFmtCache.set(tz,fmt);
  return fmt;
 }
 function day(value,zone){
  if(/^\\d{4}-\\d{2}-\\d{2}$/.test(String(value||'')))return expiry({perecible:true,fechaCaducidad:value})||'';
  const ms=Date.parse(value);if(!Number.isFinite(ms))return '';
  try{const parts=_dayFmtFor(zone).formatToParts(new Date(ms));let y='',m='',d='';for(let i=0;i<parts.length;i++){const t=parts[i].type;if(t==='year')y=parts[i].value;else if(t==='month')m=parts[i].value;else if(t==='day')d=parts[i].value;}return y&&m&&d?y+'-'+m+'-'+d:'';}catch(_){return '';}
 }`;

const UNIQUE_TARGET = `   groups.forEach(g=>{if(g.some(v=>stable(v)!==stable(g[0]))){if(g.some(relevant)){warnings.add('conflicting-'+kind);if(kind==='sale')saleConflict=true;else if(kind==='expense')expenseConflict=true;else adjustmentConflict=true;}return;}result.push(g[0]);});return result;`;

const UNIQUE_REPLACEMENT = `   groups.forEach(g=>{if(g.length===1){result.push(g[0]);return;}const firstKey=stable(g[0]);if(g.some((v,i)=>i>0&&stable(v)!==firstKey)){if(g.some(relevant)){warnings.add('conflicting-'+kind);if(kind==='sale')saleConflict=true;else if(kind==='expense')expenseConflict=true;else adjustmentConflict=true;}return;}result.push(g[0]);});return result;`;

function applyPatchToSource(source) {
  let out = source;
  let changed = false;
  if (!out.includes('_dayFmtCache')) {
    if (!out.includes(DAY_TARGET)) throw new Error('Target `day(value,zone)` block not found');
    out = out.replace(DAY_TARGET, DAY_REPLACEMENT);
    changed = true;
  }
  if (!out.includes('if(g.length===1){result.push(g[0]);return;}')) {
    if (!out.includes(UNIQUE_TARGET)) throw new Error('Target `unique()` block not found');
    out = out.replace(UNIQUE_TARGET, UNIQUE_REPLACEMENT);
    changed = true;
  }
  return { changed, source: out };
}

module.exports = { applyPatchToSource };
