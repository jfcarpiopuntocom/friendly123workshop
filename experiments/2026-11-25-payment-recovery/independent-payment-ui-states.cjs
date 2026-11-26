'use strict';
// Synthetic UI state experiment. No DOM or actual HTTP; exact handler and request source.
// node independent-payment-ui-states.cjs <plan-pagos-ui.js>
const fs=require('node:fs');
async function experiment(src){
 const start='      var errorAsignacion = function (e) {',end='      function finalizar() {';
 const i=src.indexOf(start),j=src.indexOf(end,i);if(i<0||j<0)throw Error("anchor");const orig=src.slice(i,j);
 const candidate=`      var errorAsignacion = function (e) {
        msg.style.color = "#B0183E";
        if (e && e.status === 409) {
          msg.textContent = es ? "Conflicto de referencia; no vuelvas a cobrar hasta conciliar el historial." : "Reference conflict; do not charge again until the history is reconciled.";
        } else if ((e && e.cobroConfirmado === true) || (pendienteAsignacion && pendienteAsignacion.abonoId)) {
          msg.textContent = es ? "Pago confirmado; asignación pendiente. No cobres de nuevo." : "Payment confirmed; allocation pending. Do not charge again.";
        } else if (e && e.codigo === "F123_REFERENCIA_PAGO_NO_GUARDADA") {
          msg.textContent = es ? "Referencia no disponible; este intento no envió el pago. Revisa la operación anterior." : "Reference unavailable; this attempt did not send the payment. Review the previous operation.";
        } else {
          msg.textContent = es ? "Pago sin confirmar; conserva la referencia original." : "Payment unconfirmed; keep the original reference.";
        }
      };
`;
 const old1="    if (!response.ok || result.error) throw new Error(result.error || 'Could not confirm the payment.');";
 const new1="    if (!response.ok || result.error) { var errorPago = new Error(result.error || 'Could not confirm the payment.'); errorPago.status = response.status; throw errorPago; }";
 const old2='      throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");';
 const new2='      var errorAplicacion = new Error(respuesta.error || "Payment saved; allocation pending confirmation."); errorAplicacion.status = res.status; throw errorAplicacion;';
 for(const a of [old1,old2])if(src.split(a).length!==2)throw Error("http anchor");
 const fixed=src.replace(orig,candidate).replace(old1,new1).replace(old2,new2);
 const fixtures=[
 {name:"storage-before-send",pending:{abonoId:null},error:{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:false}},
 {name:"ack-unknown",pending:{abonoId:null},error:new Error("network unavailable")},
 {name:"confirmed-allocation-fail",pending:{abonoId:"receipt"},error:new Error("allocation failed")},
 {name:"confirmed-receipt-storage-fail",pending:{abonoId:"receipt"},error:{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:true}},
 {name:"conflict",pending:{abonoId:null},error:{status:409}},
 {name:"conflict-after-receipt",pending:{abonoId:"receipt"},error:{status:409}}
 ];
 const rows=[];
 for(const es of [true,false])for(const f of fixtures){const render=code=>{const msg={style:{},textContent:""};new Function("msg","es","pendienteAsignacion","e",code+"\nerrorAsignacion(e);")(msg,es,f.pending,f.error);return msg.textContent};
 rows.push({locale:es?"es":"en",name:f.name,red:render(orig),green:render(candidate)});}
 for(const es of [true,false]){const a=rows.filter(r=>r.locale===(es?"es":"en"));if(new Set(a.map(r=>r.green)).size!==4||a[2].green!==a[3].green||a[4].green!==a[5].green)throw Error("state count");}
 async function testHTTP(code){const body=code.slice(code.indexOf("  global.ocEnviarAbono = async function"),code.indexOf("  function modalAbonar"));const global={OCI18n:{locale:()=> "en"}};
 const exports=new Function("global","_pagoAutorizarCobro","leerReferenciaDurable","guardarReferenciaPagoDurable","_pagoMismaSesion","fetch","API","_pagoLiberarReferencia","claveAbono",body+"\nreturn {confirmarAsignacion};")(global,()=>{},async()=>null,async()=>null,()=>{},async()=>({ok:false,status:409,json:async()=>({error:"conflict"})}),"/fixture",async()=>{throw Error("must not release")},x=>"pay:"+x);
 const out=[];for(const [name,fn] of [["payment",()=>global.ocEnviarAbono("A",10,"Abono",{opId:"p"})],["allocation",()=>exports.confirmarAsignacion("A",{abonoId:"r",partes:[],opId:"a"},null)]]){try{await fn();throw Error("unexpected success")}catch(e){out.push({name,status:e.status??null,message:e.message})}}return out;}
 const redHttp=await testHTTP(src),greenHttp=await testHTTP(fixed);
 if(redHttp.some(r=>r.status!==null||r.message!=="conflict")||greenHttp.some(r=>r.status!==409||r.message!=="conflict"))throw Error("HTTP status");
 return {rows,redHttp,greenHttp};
}
experiment(fs.readFileSync(process.argv[2],'utf8')).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
