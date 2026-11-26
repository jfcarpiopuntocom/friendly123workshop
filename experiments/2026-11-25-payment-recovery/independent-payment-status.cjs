'use strict';
// node independent-payment-status.cjs /path/to/plan-pagos-ui.js [--emit]
// Base 344e7a448c097231b0f026ebc0dd4c703110944e, UI callback and allocation HTTP handler, mocked DOM and transport.
const fs=require('node:fs');
async function run(src){
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 const begin='      var errorAsignacion = function (e) {',end='\n      function finalizar()';
 const extract=s=>s.slice(s.indexOf(begin),s.indexOf(end,s.indexOf(begin)));
 const old=extract(src);
 if(!old.includes("Payment preserved"))throw Error("wrong UI anchor");
 const improved=`      var errorAsignacion = function (e) {
        msg.style.color = "#B0183E";
        var confirmado = !!(pendienteAsignacion && pendienteAsignacion.abonoId) || !!(e && e.cobroConfirmado === true);
        if (e && e.status === 409) {
          msg.textContent = es
            ? "Conflicto de referencia. Revisa el historial antes de continuar; conserva la referencia original."
            : "Reference conflict. Review history before continuing; keep the original reference.";
        } else if (confirmado) {
          msg.textContent = es
            ? "Pago confirmado; asignación pendiente. Reanuda la misma operación."
            : "Payment confirmed; allocation pending. Resume the same operation.";
        } else if (e && e.codigo === "F123_REFERENCIA_PAGO_NO_GUARDADA") {
          msg.textContent = es
            ? "Referencia no guardada; no se envió el pago en este intento. Revisa cualquier intento anterior."
            : "Reference not saved; payment was not sent in this attempt. Review any earlier attempt.";
        } else {
          msg.textContent = es
            ? "Pago por confirmar. Reanuda con la referencia original y verifica el recibo."
            : "Payment unconfirmed. Resume using the original reference and verify the receipt.";
        }
      };`;
 let candidate=swap(src,old,improved);
 candidate=swap(candidate,'      throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");','      var error = new Error(respuesta.error || "Allocation receipt not confirmed.");\n      error.status = res.status;\n      throw error;');
 candidate=swap(candidate,"    if (!response.ok || result.error) throw new Error(result.error || 'Could not confirm the payment.');","    if (!response.ok || result.error) { var error = new Error(result.error || 'Could not confirm the payment.'); error.status = response.status; throw error; }");
 const states=[
  {name:"storage-before-send",e:{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:false},pending:{abonoId:null},en:"Reference not saved",es:"Referencia no guardada"},
  {name:"lost-ack",e:new Error("network"),pending:{abonoId:null},en:"Payment unconfirmed",es:"Pago por confirmar"},
  {name:"confirmed-allocation-pending",e:new Error("network"),pending:{abonoId:"receipt"},en:"Payment confirmed",es:"Pago confirmado"},
  {name:"confirmed-storage-failed",e:{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA",cobroConfirmado:true},pending:{abonoId:"receipt"},en:"Payment confirmed",es:"Pago confirmado"},
  {name:"identity-conflict",e:{status:409},pending:{abonoId:null},en:"Reference conflict",es:"Conflicto de referencia"},
  {name:"allocation-conflict",e:{status:409},pending:{abonoId:"receipt"},en:"Reference conflict",es:"Conflicto de referencia"}
 ];
 function messages(s){
  const rows=[];for(const state of states)for(const es of [false,true]){
   const msg={style:{},textContent:""};const fn=new Function("msg","es","pendienteAsignacion",extract(s)+"\nreturn errorAsignacion;")(msg,es,state.pending);
   fn(state.e);rows.push({name:state.name,locale:es?"es":"en",text:msg.textContent,pass:msg.textContent.startsWith(es?state.es:state.en)});
  }return rows;
 }
 async function transport(s){
  const start=s.indexOf("  async function confirmarAsignacion("),stop=s.indexOf("  async function reanudarAsignacion(",start);if(start<0||stop<0)throw Error("transport anchors");
  let released=0;const fn=new Function("API","fetch","_pagoMismaSesion","_pagoLiberarReferencia","claveAsignacion","claveAbono",s.slice(start,stop)+"\nreturn confirmarAsignacion;")("",async()=>({ok:false,status:409,json:async()=>({error:"conflict"})}),()=>{},async()=>{released++},()=>"",()=>"");
  try{await fn("A",{abonoId:"receipt",opId:"app",paymentOpId:"pay",partes:[]},null);throw Error("expected conflict")}catch(e){return {status:e.status??null,released}}
 }
 const red=messages(src),green=messages(candidate),transportRed=await transport(src),transportGreen=await transport(candidate);
 if(green.some(r=>!r.pass)||red.some(r=>r.pass)||transportRed.status!==null||transportGreen.status!==409||transportGreen.released!==0)throw Error(JSON.stringify({red,green,transportRed,transportGreen}));
 return {red,green,transportRed,transportGreen,candidate};
}
run(fs.readFileSync(process.argv[2],'utf8')).then(({candidate,...r})=>{if(process.argv.includes('--emit'))fs.writeFileSync('plan-pagos-ui.experimental.js',candidate,{flag:'wx'});console.log(JSON.stringify(r,null,2));}).catch(e=>{console.error(e);process.exitCode=1});
