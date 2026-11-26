'use strict';
// node payment-state-copy.cjs plan-pagos-ui.js; optional F123_CANDIDATE_FILE
const fs=require('node:fs');
async function run(src){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const start=src.indexOf("      var errorAsignacion = function (e) {"),end=src.indexOf("\n      function finalizar()",start);if(start<0||end<0)throw Error("UI anchors");
 const original=src.slice(start,end);
 const candidate=`      var errorAsignacion = function (e) {
        msg.style.color = "#B0183E";
        var confirmado = !!(pendienteAsignacion && pendienteAsignacion.abonoId) || !!(e && e.cobroConfirmado);
        if (e && e.status === 409) {
          msg.textContent = es ? "Conflicto de operación. Revisa el historial y conserva la referencia original." : "Operation conflict. Review the history and keep the original reference.";
        } else if (confirmado) {
          msg.textContent = es ? "Pago confirmado; asignación pendiente. Reanuda la asignación." : "Payment confirmed; allocation pending. Resume allocation.";
        } else if (e && e.codigo === "F123_REFERENCIA_PAGO_NO_GUARDADA") {
          msg.textContent = es ? "Referencia del pago no guardada. Revisa los intentos anteriores antes de cobrar." : "Payment reference not saved. Review previous attempts before charging.";
        } else {
          msg.textContent = es ? "Pago sin confirmar. Comprueba la operación con la referencia original." : "Payment not confirmed. Verify the operation with the original reference.";
        }
      };`;
 let fixed=swap(src,original,candidate);
 fixed=swap(fixed,"    if (!response.ok || result.error) throw new Error(result.error || 'Could not confirm the payment.');","    if (!response.ok || result.error) { var e = new Error(result.error || 'Could not confirm the payment.'); e.status = response.status; throw e; }");
 fixed=swap(fixed,'      throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");','      var e = new Error(respuesta.error || "Payment saved; allocation pending confirmation."); e.status = res.status; throw e;');
 const cases=[
  ["reference-failure",{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:false},null],
  ["receipt-unknown",new Error("network timeout"),{paymentOpId:"p"}],
  ["receipt-confirmed",new Error("network timeout"),{paymentOpId:"p",abonoId:"receipt"}],
  ["identity-conflict",{status:409},{paymentOpId:"p",abonoId:"receipt"}],
  ["receipt-confirmed-storage",{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:true},null]
 ];
 function messages(code){return [true,false].flatMap(es=>cases.map(([name,e,pendiente])=>{const msg={style:{}};new Function("msg","es","pendienteAsignacion","e",code+"\nerrorAsignacion(e);")(msg,es,pendiente,e);return {lang:es?"ES":"EN",name,text:msg.textContent,color:msg.style.color}}))}
 const red=messages(original),green=messages(candidate);
 for(const lang of ["ES","EN"]){const a=green.filter(x=>x.lang===lang);if(new Set(a.slice(0,4).map(x=>x.text)).size!==4||a[2].text!==a[4].text||/confirmado;|confirmed;|conservado;|preserved;/.test(a[0].text)||/confirmado;|confirmed;|conservado;|preserved;/.test(a[1].text))throw Error("classification "+JSON.stringify(a))}
 async function allocationHTTP(code){const i=code.indexOf("  async function confirmarAsignacion("),j=code.indexOf("  async function reanudarAsignacion(",i);const fn=new Function("_pagoMismaSesion","fetch","API",code.slice(i,j)+"\nreturn confirmarAsignacion;")(()=>{},async()=>({ok:false,status:409,json:async()=>({error:"conflict"})}),"");try{await fn("A",{abonoId:"r",partes:[],opId:"a"},null);throw Error("expected failure")}catch(e){return {status:e.status||null,message:e.message}}}
 const httpRed=await allocationHTTP(src),httpGreen=await allocationHTTP(fixed);if(httpRed.status!==null||httpGreen.status!==409)throw Error("http status");
 return {red,green,httpRed,httpGreen,scope:"extracted actual UI handler and HTTP allocation function; mock DOM and HTTP; no browser or backend",candidate:fixed};
}
run(fs.readFileSync(process.argv[2],'utf8')).then(({candidate,...r})=>{console.log(JSON.stringify(r,null,2));if(process.env.F123_CANDIDATE_FILE)fs.writeFileSync(process.env.F123_CANDIDATE_FILE,candidate)}).catch(e=>{console.error(e);process.exitCode=1});
