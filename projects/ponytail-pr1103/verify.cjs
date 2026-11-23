'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const home=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(home,'source-manifest.json'),'utf8'));
const upstream=path.resolve(home,'../../..','upstream');
for(const file of manifest.files){
  assert.deepEqual(fs.readFileSync(path.join(home,'upstream',file.path)),
    fs.readFileSync(path.join(upstream,file.path)),file.path);
}
const orig=fs.readFileSync(path.join(home,'upstream/docs/plan-pagos-ui.js'),'utf8');
const c=fs.readFileSync(path.join(home,'candidate/docs/plan-pagos-ui.js'),'utf8');
const start=orig.indexOf('function modalAbonar('),end=orig.indexOf('global.abonarCliente = modalAbonar;',start);
assert.ok(start>=0&&end>start);
let expected=orig.slice(start,end);
for(const [id,name] of [['pp-ab-monto','campoMonto'],['pp-ab-msg','mensajeAbono'],['pp-ab-ok','botonAbono']]){
 expected=expected.replace(new RegExp('q\\(["\\x27]'+id+'["\\x27]\\)','g'),name);
}
const lookup='    var q = function (id) { return m.querySelector("#" + id); };';
assert.ok(expected.includes(lookup));
expected=expected.replace(lookup,lookup+'\n    // Only purchase chips rerender; these three payment controls are stable.\n    var campoMonto = q("pp-ab-monto"), mensajeAbono = q("pp-ab-msg"), botonAbono = q("pp-ab-ok");');
const before='          .then(function () { return reanudarAsignacion(clienteId, pendienteAsignacion); })\n          .catch(function (errorGuardar) {\n            // Keep the exact pending reference if storage succeeded and the\n            // network failed. Never create a new opId on an uncertain payment.\n            throw errorGuardar;\n          });';
assert.ok(expected.includes(before));
expected=expected.replace(before,'          // Rejections reach the existing payment-preservation handler.\n          .then(function () { return reanudarAsignacion(clienteId, pendienteAsignacion); });');
// An existing guard test intentionally asserts the literal amount read on the deferred plan response.
expected=expected.replace('!elegidos.length && !campoMonto.value','!elegidos.length && !q("pp-ab-monto").value');
assert.equal(c,orig.slice(0,start)+expected+orig.slice(end),'unreviewed source modification');
assert.match(c,/await _pagoLiberarReferencia\(/);
assert.match(c,/Number\.isSafeInteger\(centavos\)/);
assert.match(c,/payload\.opId = intencionId/);
assert.match(c,/previo\.monto !== payload\.monto/);
console.log('PASS copied '+manifest.files.length+' exact PR HEAD files; candidate restricted to reviewed Ponytail edits.');
console.log('Payment source chars original/candidate: '+orig.length+' / '+c.length);
