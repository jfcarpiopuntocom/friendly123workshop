'use strict';
// node independent-payment-ack-gates.cjs plan-pagos-ui.js independent-payment-status.cjs
const fs=require('node:fs');
async function run(src,prior){
 const prev=await new Function("require","src",prior.slice(0,prior.indexOf("\nrun(fs.readFileSync"))+"\nreturn run(src);")(()=>({}),src);
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 let fixed=swap(prev.candidate,"if (e && e.status === 409) {","if (e && (e.status === 409 || e.needsReview)) {");
 fixed=swap(fixed,"error.status = res.status;","error.status = res.status; error.needsReview = !!respuesta.needsReview;");
 fixed=swap(fixed,"error.status = response.status;","error.status = response.status; error.needsReview = !!result.needsReview;");
 fixed=swap(fixed,"Referencia no guardada; no se envió el pago en este intento. Revisa cualquier intento anterior.","Referencia no guardada; revisa la operación original antes de cobrar.");
 fixed=swap(fixed,"Reference not saved; payment was not sent in this attempt. Review any earlier attempt.","Reference not saved; review the original operation before charging.");
 async function test(s){
  const start=s.indexOf("  async function confirmarAsignacion("),end=s.indexOf("  async function reanudarAsignacion(",start);
  const data={abonoId:"receipt",paymentOpId:"pay-1",opId:"alloc-1",partes:[]};const rows=[];
  for(const [name,status,body] of [["conflict",409,{error:"conflict",needsReview:true}],["needs-review",422,{error:"review",needsReview:true}],["wrong-ack",200,{aplicacionId:"a",opId:"wrong"}],["success",200,{aplicacionId:"a",opId:"alloc-1"}]]){
   let released=[];const fn=new Function("API","fetch","_pagoMismaSesion","_pagoLiberarReferencia","claveAsignacion","claveAbono",s.slice(start,end)+"\nreturn confirmarAsignacion;")("",async()=>({status,ok:status<300,json:async()=>body}),()=>{},async(...x)=>released.push(x[3]),()=>"a",()=>"p");
   let out;try{await fn("A",data,null);out={ok:true}}catch(e){out={ok:false,status:e.status??null,needsReview:!!e.needsReview}}
   rows.push({name,...out,released});
  }
  const ps=s.indexOf("  global.ocEnviarAbono ="),pe=s.indexOf("  /* A confirmed payment",ps);
  const global={OCI18n:{locale:()=>"en"}};new Function("global","_pagoAutorizarCobro","claveAbono","leerReferenciaDurable","guardarReferenciaPagoDurable","_pagoMismaSesion","fetch","API",s.slice(ps,pe))(global,()=>{},()=>"p",async()=>null,async()=>({}),()=>{},async()=>({status:409,ok:false,json:async()=>({error:"payment conflict",needsReview:true})}),"");
  try{await global.ocEnviarAbono("A",10,"Abono",{opId:"pay-1"});rows.push({name:"payment-conflict",ok:true})}catch(e){rows.push({name:"payment-conflict",ok:false,status:e.status??null,needsReview:!!e.needsReview})}
  const ms=s.indexOf("      var errorAsignacion = function (e) {"),me=s.indexOf("      function finalizar()",ms);
  const msgs=[];for(const es of [true,false])for(const [name,e,p] of [["review",{needsReview:true},{}],["receipt",{}, {abonoId:"receipt"}],["reference",{codigo:"F123_REFERENCIA_PAGO_NO_GUARDADA"},{}],["unknown",{},{}]]){
    const msg={style:{},textContent:""};new Function("msg","es","pendienteAsignacion","e",s.slice(ms,me)+"\nerrorAsignacion(e);")(msg,es,p,e);msgs.push({locale:es?"es":"en",name,text:msg.textContent});
  }
  return {rows,msgs};
 }
 const red=await test(src),green=await test(fixed);
 if(green.rows[0].status!==409||!green.rows[1].needsReview||green.rows.slice(0,3).some(r=>r.released.length)||green.rows[3].released.join(",")!=="alloc-1,pay-1"||green.rows[4].status!==409||!green.rows[4].needsReview)throw Error(JSON.stringify(green));
 for(const l of ["es","en"])if(new Set(green.msgs.filter(x=>x.locale===l).map(x=>x.text)).size!==4)throw Error("four states");
 return {priorCases:prev.green.length,red,green,scope:"source-executed UI and HTTP handlers; simulated HTTP/storage/DOM; not native UI"};
}
run(...process.argv.slice(2,4).map(p=>fs.readFileSync(p,'utf8'))).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
