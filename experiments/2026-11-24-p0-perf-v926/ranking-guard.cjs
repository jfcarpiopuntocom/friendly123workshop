'use strict';
// Run against exact v0.9.26 source: node ranking-guard.cjs /path/to/src/app/app-inline-01.js
const fs=require('node:fs'),assert=require('node:assert/strict');
const full=fs.readFileSync(process.argv[2],'utf8');
const source=full.slice(full.indexOf('function resumenComisionesGlobalHtml(sales){'),full.indexOf('function _ocFilaVentaRawHtml'));
const old="if(rich10&&typeof matrizComisionistasHtml===\"function\"&&typeof document.getElementById===\"function\"){",next="if(!window._ocComOmitirFiltros&&rich10&&typeof matrizComisionistasHtml===\"function\"&&typeof document.getElementById===\"function\"){";
assert.equal(source.split(old).length,2);
function exercise(source) {
  const make=new Function("window","document","flechaComisionHtml","matrizComisionistasHtml","fmtMoney","escHtml",source+"\nreturn resumenComisionesGlobalHtml;");
  const sales=Array.from({length:400},(_,i)=>({id:"s"+i,productoId:"p"+i,productoNombre:"Product "+i,ubicacionId:"r"+(i%30),ubicacionNombre:"Rack "+(i%30),promotoraId:"a"+(i%30),asociadoNombre:"Associate "+(i%30),clienteNombre:"Customer "+(i%120),cantidad:1,precioUnit:25,comisionAsociado:5,netoCasa:20,fecha:"2026-11-21"}));
  const rankWrites=[],matrixCalls=[];
  const rank={set innerHTML(v){rankWrites.push(v);}},list={};
  const window={_ocComHistoryGroup:"producto",OCCommissionHistory:{filterSales:({sales})=>sales,project:({sales})=>({totals:{count:sales.length,gross:sales.length*25,commission:sales.length*5},rows:[],groups:[]})}};
  const doc={documentElement:{lang:"es"},getElementById:id=>id==="rankingComisiones"?rank:list};
  const render=make(window,doc,()=>"",arr=>{matrixCalls.push(JSON.stringify(arr));return "<matrix/>";},String,String);
  const primary=render(sales);
  window._ocComOmitirFiltros=true;
  window._ocComVentasFiltradas=sales;
  const secondary=["percha","cliente","comisionista","mes"].map(group=>{window._ocComHistoryGroup=group;return render(sales);});
  const beforeRefresh=rankWrites.length;
  const redundantWrites=rankWrites.slice(1).every(x=>x===rankWrites[0]);
  window._ocComOmitirFiltros=false;window._ocComVentasFiltradas=undefined;window._ocComHistoryGroup="producto";
  const refreshed=render(sales.slice(0,20));
  return {beforeRefresh,totalWrites:rankWrites.length,matrixCalls:matrixCalls.length,initialRank:rankWrites[0],lastRank:rankWrites.at(-1),redundantWrites,primary,secondary,refreshed};
}
const x=exercise(source),y=exercise(source.replace(old,next));
assert.equal(x.beforeRefresh,5);assert.equal(y.beforeRefresh,1);assert.equal(x.redundantWrites,true);assert.equal(x.primary,y.primary);assert.deepEqual(x.secondary,y.secondary);assert.equal(x.initialRank,y.initialRank);assert.equal(x.lastRank,y.lastRank);assert.equal(x.refreshed,y.refreshed);assert.notEqual(y.initialRank,y.lastRank);assert.equal(y.matrixCalls,2);
console.log(JSON.stringify({baselineWrites:x.beforeRefresh,candidateWrites:y.beforeRefresh,baselineMatrixCalls:x.matrixCalls,candidateMatrixCalls:y.matrixCalls,checks:9},null,2));
