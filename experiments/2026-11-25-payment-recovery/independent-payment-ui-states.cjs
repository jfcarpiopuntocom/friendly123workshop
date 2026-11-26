'use strict';
// node independent-payment-ui-states.cjs plan-pagos-ui.js
const fs=require('node:fs');
async function run(src){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const oldError=`      var errorAsignacion = function (e) {
        msg.style.color = "#B0183E";
        msg.textContent = es
          ? "Pago conservado; asignación pendiente: " + ((e && e.message) || "reintenta la asignación")
          : "Payment preserved; allocation pending: " + ((e && e.message) || "retry allocation");
      };`;
 const newError=`      var errorAsignacion = function (e) {
        msg.style.color = "#B0183E";
        var confirmado = !!(pendienteAsignacion && pendienteAsignacion.abonoId) || !!(e && e.cobroConfirmado);
        var conflicto = !!(e && e.status === 409);
        var sinReferencia = !!(e && e.codigo === "F123_REFERENCIA_PAGO_NO_GUARDADA");
        if (conflicto) msg.textContent = confirmado
          ? (es ? "Pago confirmado; asignación en conflicto. Revisa el historial antes de continuar." : "Payment confirmed; allocation conflict. Review history before continuing.")
          : (es ? "Conflicto de pago; recibo sin confirmar. Revisa la referencia original." : "Payment conflict; receipt unconfirmed. Review the original reference.");
        else if (confirmado) msg.textContent = es
          ? "Pago confirmado; asignación pendiente. No cobres de nuevo." : "Payment confirmed; allocation pending. Do not charge again.";
        else if (sinReferencia) msg.textContent = es
          ? "Referencia no guardada; verifica el estado del pago antes de reanudar." : "Reference not saved; verify payment status before resuming.";
        else msg.textContent = es
          ? "Pago sin confirmar. Reanuda con la misma referencia." : "Payment unconfirmed. Resume with the same reference.";
      };`;
 let fixed=swap(src,oldError,newError);
 fixed=swap(fixed,"    if (!response.ok || result.error) throw new Error(result.error || 'Could not confirm the payment.');","    if (!response.ok || result.error) { var e = new Error(result.error || 'Could not confirm the payment.'); e.status = response.status; throw e; }");
 fixed=swap(fixed,'      throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");','      var e = new Error(respuesta.error || "Payment saved; allocation pending confirmation."); e.status = res.status; throw e;');
 // Keep non-financial 409 from being labelled as a new payment or silent success.
 function messages(code){
  const a=code.indexOf("      var errorAsignacion = function (e) {"),b=code.indexOf("\n      function finalizar()",a);
  if(a<0||b<0)throw Error("message extraction");
  const block=code.slice(a,b);
  const scenarios=[["reference",null,{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA"}],["unknown",null,new Error("network")],["confirmed",{abonoId:"receipt"},new Error("network")],["conflict-confirmed",{abonoId:"receipt"},{status:409}],["conflict-unknown",null,{status:409}],["confirmed-storage",null,{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:true}]];
  return [true,false].flatMap(es=>scenarios.map(([name,pendienteAsignacion,e])=>{const msg={style:{}};new Function("msg","es","pendienteAsignacion","e",block+"\nerrorAsignacion(e);")(msg,es,pendienteAsignacion,e);return {locale:es?"es":"en",name,text:msg.textContent}}));
 }
 async function responseStatuses(code){
  const a=code.indexOf("  global.ocEnviarAbono = async function"),b=code.indexOf("\n  /* A confirmed payment",a);
  const c=code.indexOf("  async function confirmarAsignacion("),d=code.indexOf("\n  async function reanudarAsignacion",c);
  if([a,b,c,d].some(x=>x<0))throw Error("network anchors");
  const global={crypto:{randomUUID:()=>"fixed"},OCI18n:{locale:()=>"en"}},calls=[];
  const fetch=async(url,opts)=>{calls.push({url,body:JSON.parse(opts.body)});return {ok:false,status:409,json:async()=>({error:"conflict"})}};
  const confirm=new Function("global","API","fetch","_pagoAutorizarCobro","claveAbono","leerReferenciaDurable","guardarReferenciaPagoDurable","_pagoMismaSesion","_pagoLiberarReferencia","claveAsignacion",code.slice(a,b)+"\n"+code.slice(c,d)+"\nreturn confirmarAsignacion;")(global,"/api",fetch,()=>{} ,()=>"pay",async()=>null,async()=>({}),()=>{},async()=>{throw Error("unexpected release")},()=>"allocation");
  const status=async f=>{try{await f();return "unexpected success"}catch(e){return e.status??null}};
  return {payment:await status(()=>global.ocEnviarAbono("A",10,"Abono",{opId:"customer-payment:fixed"})),allocation:await status(()=>confirm("A",{abonoId:"receipt",opId:"allocation:fixed",partes:[{cargoKey:"cargo:1",monto:10}]},{})),calls};
 }
 const red={messages:messages(src),statuses:await responseStatuses(src)},green={messages:messages(fixed),statuses:await responseStatuses(fixed)};
 const text=(locale,name)=>green.messages.find(x=>x.locale===locale&&x.name===name).text;
 if(red.statuses.payment!==null||red.statuses.allocation!==null||green.statuses.payment!==409||green.statuses.allocation!==409||!text("es","unknown").startsWith("Pago sin confirmar")||!text("en","unknown").startsWith("Payment unconfirmed")||!text("es","reference").startsWith("Referencia no guardada")||!text("en","reference").startsWith("Reference not saved")||!text("es","confirmed").startsWith("Pago confirmado")||!text("en","confirmed").startsWith("Payment confirmed")||!text("es","conflict-unknown").startsWith("Conflicto de pago")||!text("en","conflict-confirmed").includes("allocation conflict"))throw Error(JSON.stringify(green));
 return {red,green,scope:"exact modal message function and POST response paths, fake DOM message/fetch; no browser UI certification",candidate:fixed};
}
run(fs.readFileSync(process.argv[2],'utf8')).then(({candidate,...r})=>{console.log(JSON.stringify(r,null,2));if(process.env.OUT_FILE)fs.writeFileSync(process.env.OUT_FILE,candidate)}).catch(e=>{console.error(e);process.exitCode=1});
