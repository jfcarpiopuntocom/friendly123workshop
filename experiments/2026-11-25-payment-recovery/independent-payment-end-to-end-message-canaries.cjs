'use strict';
// node independent-payment-end-to-end-message-canaries.cjs plan-pagos-ui.js [--emit]
const fs=require('node:fs');
async function run(src){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 let fixed=swap(src,"    if (!response.ok || result.error) throw new Error(result.error || 'Could not confirm the payment.');","    if (!response.ok || result.error) { var e = new Error(result.error || 'Could not confirm the payment.'); e.status = response.status; throw e; }");
 fixed=swap(fixed,'      throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");','      var e = new Error(respuesta.error || "Payment saved; allocation pending confirmation."); e.status = res.status; throw e;');
 const i=src.indexOf("      var errorAsignacion = function (e) {"),j=src.indexOf("      function finalizar()",i);
 if(i<0||j<0)throw Error("UI anchors");
 fixed=swap(fixed,src.slice(i,j),`      var errorAsignacion = function (e) {
        msg.style.color = "#B0183E";
        var recibo = !!(pendienteAsignacion && pendienteAsignacion.abonoId) || !!(e && e.cobroConfirmado);
        if (e && e.status === 409) {
          msg.textContent = es ? (recibo ? "Pago confirmado; conflicto de asignación. Revisa el historial." : "Conflicto de referencia; pago sin confirmar. Revisa el historial.")
            : (recibo ? "Payment confirmed; allocation conflict. Review history." : "Reference conflict; payment unconfirmed. Review history.");
        } else if (recibo) {
          msg.textContent = es ? "Pago confirmado; asignación pendiente." : "Payment confirmed; allocation pending.";
        } else if (e && e.codigo === "F123_REFERENCIA_PAGO_NO_GUARDADA") {
          msg.textContent = es ? "No se envió un nuevo pago en este intento. Conserva la referencia anterior." : "No new payment sent in this attempt. Keep the earlier reference.";
        } else {
          msg.textContent = es ? "Pago sin confirmar. Reanuda con la referencia original." : "Payment unconfirmed. Resume with the original reference.";
        }
      };
`);
 async function suite(code){
  const k=code.indexOf("  function claveAbono("),l=code.indexOf("  function modalAbonar",k),a=code.indexOf("      var errorAsignacion = function (e) {"),b=code.indexOf("      function finalizar()",a);
  if([k,l,a,b].some(n=>n<0))throw Error("extraction");
  const rows=[];
  for(const es of [true,false])for(const mode of ["intent-failed","payment-uncertain","payment-conflict","allocation-failed","allocation-conflict","receipt-intent-failed","success"]){
   const dato={paymentOpId:"customer-payment:p",opId:"customer-allocation:p",abonoId:null,partes:[{cargoKey:"cargo:c",monto:10}],monto:10,motivo:"Abono"};
   const posts=[],released=[];
   const persist=async(key,value,confirmed)=>{if(mode==="intent-failed"||mode==="receipt-intent-failed"&&confirmed)throw Object.assign(Error("injected persistence error"),{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:confirmed});return {}};
   const fetch=async(url,opts)=>{const body=JSON.parse(opts.body);posts.push({url,body});const pay=url.endsWith("/abonar");if(pay&&mode==="payment-uncertain")throw Error("lost response");const status=pay&&mode==="payment-conflict"||!pay&&mode==="allocation-conflict"?409:!pay&&mode==="allocation-failed"?503:200;return {status,ok:status===200,json:async()=>status!==200?{error:"injected server error"}:pay?{opId:body.opId,movimientoId:"receipt-1"}:{opId:body.opId,aplicacionId:"allocation-1"}}};
   const w={OCI18n:{locale:()=>es?"es":"en"}};
   const resume=new Function("global","API","_pagoAutorizarCobro","leerReferenciaDurable","guardarReferenciaPagoDurable","_pagoMismaSesion","_pagoLiberarReferencia","fetch",code.slice(k,l)+"\nreturn reanudarAsignacion;")(w,"/api",()=>{},async()=>null,persist,()=>{},async(...args)=>released.push(args[2]),fetch);
   const msg={style:{},textContent:""};let status=null,success=false;
   try{await resume("A",dato);success=true}catch(e){status=e.status||null;new Function("es","msg","pendienteAsignacion","e",code.slice(a,b)+"\nerrorAsignacion(e);")(es,msg,dato,e)}
   rows.push({es,mode,status,success,message:msg.textContent,posts,released,receipt:dato.abonoId});
  }return rows;
 }
 const red=await suite(src),green=await suite(fixed);
 for(const r of green){const n=r.mode==="intent-failed"?0:["payment-uncertain","payment-conflict","receipt-intent-failed"].includes(r.mode)?1:2;
 if(r.posts.length!==n||r.posts.some(p=>p.body.opId!==(p.url.endsWith("/abonar")?"customer-payment:p":"customer-allocation:p"))||r.released.length!==(r.mode==="success"?2:0)||r.success!==(r.mode==="success"))throw Error(JSON.stringify(r));
 if(r.mode.endsWith("conflict")&&r.status!==409)throw Error("status lost");
 if(["intent-failed","payment-uncertain","payment-conflict"].includes(r.mode)&&/Pago confirmado|Payment confirmed|Payment preserved|Pago conservado/.test(r.message))throw Error("false receipt");
 if(r.mode==="intent-failed"&&!/No new payment sent|No se envió un nuevo pago/.test(r.message))throw Error("wrong state");
 if(r.mode==="payment-uncertain"&&!/Pago sin confirmar|Payment unconfirmed/.test(r.message))throw Error("wrong uncertainty");
 if(["allocation-failed","allocation-conflict","receipt-intent-failed"].includes(r.mode)&&!/Pago confirmado|Payment confirmed/.test(r.message))throw Error("missing confirmed state");
 }
 if(red.filter(x=>x.mode!=="success").some(x=>!/Pago conservado|Payment preserved/.test(x.message)))throw Error("baseline changed");
 return {red,green,candidate:fixed,scope:"exact source functions; injected fetch and persistence; message object, not native DOM"};
}
run(fs.readFileSync(process.argv[2],'utf8')).then(({candidate,...r})=>{if(process.argv.includes('--emit'))fs.writeFileSync('plan-pagos-ui.experimental.js',candidate,{flag:'wx'});console.log(JSON.stringify(r,null,2))}).catch(e=>{console.error(e);process.exitCode=1});
