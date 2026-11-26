'use strict';
// node independent-payment-ui-states.cjs plan-pagos-ui.js [--emit]
const fs=require('node:fs');
async function run(src){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const start=src.indexOf("      var errorAsignacion = function (e) {"),end=src.indexOf("\n      function finalizar()",start);if(start<0||end<0)throw Error("handler anchors");
 const original=src.slice(start,end);
 const candidate=`      var errorAsignacion = function (e) {
        msg.style.color = "#B0183E";
        var confirmado = !!(pendienteAsignacion && pendienteAsignacion.abonoId) || !!(e && e.cobroConfirmado);
        if (e && e.status === 409) {
          msg.textContent = es ? "Conflicto de identidad del pago. Revisa el historial antes de continuar." : "Payment identity conflict. Review history before continuing.";
        } else if (e && e.codigo === "F123_REFERENCIA_PAGO_NO_GUARDADA") {
          msg.textContent = confirmado
            ? (es ? "Pago confirmado; referencia de asignación no disponible. No cobres de nuevo." : "Payment confirmed; allocation reference unavailable. Do not charge again.")
            : (es ? "Referencia del pago no disponible. Verifica el historial antes de continuar." : "Payment reference unavailable. Verify history before continuing.");
        } else if (confirmado) {
          msg.textContent = es ? "Pago confirmado; asignación pendiente. No cobres de nuevo." : "Payment confirmed; allocation pending. Do not charge again.";
        } else {
          msg.textContent = es ? "Pago por confirmar. Reutiliza la referencia original." : "Payment not yet confirmed. Reuse the original reference.";
        }
      };`;
 let fixed=swap(src,original,candidate);
 fixed=swap(fixed,'      throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");','      var error = new Error(respuesta.error || "Payment saved; allocation pending confirmation.");\n      error.status = res.status;\n      throw error;');
 function check(handler){
  const rows=[];
  for(const es of [true,false]){
   const cases=[["unconfirmed",{},null],["reference-unavailable",{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:false},null],["confirmed-pending",{}, {abonoId:"receipt"}],["identity-conflict",{status:409},{abonoId:"receipt"}],["confirmed-storage-fail",{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:true},null]];
   for(const [name,error,pendiente] of cases){const msg={style:{}};new Function("msg","es","pendienteAsignacion","e",handler+"\nerrorAsignacion(e);")(msg,es,pendiente,error);rows.push({lang:es?"ES":"EN",name,text:msg.textContent,color:msg.style.color});}
  }return rows;
 }
 const red=check(original),green=check(candidate);
 for(const lang of ["ES","EN"]){const rows=green.filter(x=>x.lang===lang);if(new Set(rows.map(x=>x.text)).size!==5)throw Error("ambiguous states");if(/Pago (confirmado|conservado)|Payment (confirmed|preserved)/i.test(rows[0].text)||/Pago (confirmado|conservado)|Payment (confirmed|preserved)/i.test(rows[1].text))throw Error("premature receipt");}
 async function httpStatus(code,status){
  const a=code.indexOf("  async function confirmarAsignacion"),b=code.indexOf("\n  async function reanudarAsignacion",a);if(a<0||b<0)throw Error("function");
  let releases=0;
  const fn=new Function("fetch","API","_pagoMismaSesion","_pagoLiberarReferencia","claveAsignacion","claveAbono",code.slice(a,b)+"\nreturn confirmarAsignacion;")(async()=>({ok:status===200,status,json:async()=>status===200?{aplicacionId:"a",opId:"x"}:{error:"identity conflict"}}),"",()=>{},async()=>{releases++},()=>"",()=>"");
  try{await fn("A",{abonoId:"p",opId:"x",paymentOpId:"p-op",partes:[]},{});return {status,ok:true,releases}}catch(e){return {status,ok:false,errorStatus:e.status||null,releases}}
 }
 const httpRed=await httpStatus(src,409),httpGreen=await httpStatus(fixed,409),success=await httpStatus(fixed,200);
 if(httpRed.errorStatus!==null||httpGreen.errorStatus!==409||httpGreen.releases!==0||success.releases!==2)throw Error("http gate");
 return {red,green,httpRed,httpGreen,success,candidate:fixed};
}
run(fs.readFileSync(process.argv[2],'utf8')).then(({candidate,...r})=>{if(process.argv.includes('--emit'))fs.writeFileSync('plan-pagos-ui.experimental.js',candidate,{flag:'wx'});console.log(JSON.stringify(r,null,2));}).catch(e=>{console.error(e);process.exitCode=1});
