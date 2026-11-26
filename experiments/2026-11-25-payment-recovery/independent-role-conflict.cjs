'use strict';
// node independent-role-conflict.cjs cartera.js [--emit]; apply to integrated candidate for full chain.
const fs=require('node:fs');
async function run(src){
 const a=src.indexOf("  function vistaCarteraSegunRol("),b=src.indexOf("\n  // ---",a);if(a<0||b<0)throw Error("anchor");
 const original=src.slice(a,b);
 const fixed=original.replace("      conflictosAplicacion: saldoInfo.conflictosAplicacion || 0,","      conflictosAplicacion: saldoInfo.conflictosAplicacion || 0,\n      conflictosIdentidadExperimental: saldoInfo.conflictosIdentidadExperimental || 0,\n      saldoEnRevision: !!saldoInfo.conflictosIdentidadExperimental,");
 if(fixed===original)throw Error("anchor");
 const input={saldo:-13,integridad:{ok:true},conflictosAplicacion:0,conflictosIdentidadExperimental:1,movimientos:[{tipo:"cargo",id:"c",cargoKey:"cargo:c",estado:"parcial",monto:35,pendiente:13,quien:"private"}]};
 const read=code=>new Function(code+"\nreturn vistaCarteraSegunRol;")();
 const red=[],green=[];
 for(const rol of ["empleado","dueno","admin"])for(const conflict of [0,1]){
 const info={...input,conflictosIdentidadExperimental:conflict};
 const before=read(original)(info,rol),after=read(fixed)(info,rol);
 if(after.conflictosIdentidadExperimental!==conflict||after.saldoEnRevision!==!!conflict||after.saldo!==before.saldo||JSON.stringify(after.historial)!==JSON.stringify(before.historial)||JSON.stringify(after.consumosPendientes)!==JSON.stringify(before.consumosPendientes)||after.puedeExportar!==before.puedeExportar||after.puedeVerListaGlobal!==before.puedeVerListaGlobal)throw Error("regression");
 red.push({rol,conflict,signal:before.conflictosIdentidadExperimental??null});green.push({rol,conflict,signal:after.conflictosIdentidadExperimental,review:after.saldoEnRevision,history:after.historial.length,export:after.puedeExportar});
 }
 return {red,green,candidate:src.replace(original,fixed)};
}
run(fs.readFileSync(process.argv[2],'utf8')).then(({candidate,...r})=>{if(process.argv.includes('--emit'))fs.writeFileSync('cartera.role.experimental.js',candidate,{flag:'wx'});console.log(JSON.stringify(r,null,2));}).catch(e=>{console.error(e);process.exitCode=1});
