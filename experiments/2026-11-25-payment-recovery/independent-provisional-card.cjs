'use strict';
// node independent-provisional-card.cjs src/app/app-inline-01.js
const fs=require('node:fs');
async function run(src){
 const a=src.indexOf("async function pintarSaldoCartera(clienteId) {"),b=src.indexOf("\nfunction ",a);if(a<0||b<0)throw Error("source anchors");const original=src.slice(a,b);
 const swap=(s,a,b)=>{if(s.split(a).length!==2)throw Error("anchor "+a);return s.replace(a,b)};
 let candidate=swap(original,"    const integridadPendiente = !!(info && info.integridad && !info.integridad.ok);","    const identidadPendiente = !!(info && info.saldoProvisional);\n    const integridadPendiente = !!(info && info.integridad && !info.integridad.ok);");
 candidate=swap(candidate,'    const avisoIntegridad = integridadPendiente','    const avisoIdentidad = identidadPendiente ? \'<span role="alert" style="display:block;color:#B0183E;font-size:12px;font-weight:700;">\' + (es ? "Saldo pendiente de verificación — identidad de movimientos en conflicto" : "Balance pending verification — conflicting movement identities") + "</span>" : "";\n    const avisoIntegridad = integridadPendiente');
 candidate=swap(candidate,'      el.innerHTML = integridadPendiente ? avisoIntegridad : "";','      el.innerHTML = avisoIdentidad + (integridadPendiente ? avisoIntegridad : "");');
 candidate=swap(candidate,'    const texto = info.saldo === 0','    const texto = identidadPendiente ? `${es ? "Saldo provisional" : "Provisional balance"} ${fmtMoney(info.saldo)}` : info.saldo === 0');
 candidate=swap(candidate,'    const desglose = debe','    const desglose = identidadPendiente ? `${es ? "Cargos" : "Charges"} ${fmtMoney(cargos)} / ${es ? "pagos/créditos" : "payments/credits"} ${fmtMoney(abonos)} · ${es ? "Saldo provisional" : "Provisional balance"} ${fmtMoney(info.saldo)}` : debe');
 candidate=swap(candidate,'${btnPagar}${avisoIntegridad}${avisoAsignacion}${detalle}','${btnPagar}${avisoIntegridad}${avisoIdentidad}${avisoAsignacion}${detalle}');
 async function suite(code){
  const out=[];
  for(const lang of ["es","en"])for(const saldo of [-25,0,10])for(const flag of [false,true]){
   const info={saldo,saldoProvisional:flag,integridad:{ok:true},historial:[{tipo:"cargo",monto:35,motivo:"Purchase fixture"},{tipo:"abono",monto:10,motivo:"Receipt fixture"}]};
   const el={innerHTML:""},w={OCI18n:{locale:()=>lang}},errs=[];
   const f=new Function("window","document","fetch","API","escHtml","fmtMoney","argHtml","t","_accionesVinculoCartera","_credExpOverride","console",code+"\nreturn pintarSaldoCartera;")(w,{getElementById:()=>el},async()=>({json:async()=>info}),"/api",String,n=>"$"+Number(n).toFixed(2),JSON.stringify,s=>s,()=>"",()=>"",{error:(...a)=>errs.push(String(a))});
   await f("A");out.push({lang,saldo,flag,warning:/identidad de movimientos en conflicto|conflicting movement identities/.test(el.innerHTML),provisional:/Saldo provisional|Provisional balance/.test(el.innerHTML),settled:/Cuenta saldada|Account settled/.test(el.innerHTML),credit:/Saldo a favor|Credit balance/.test(el.innerHTML),paymentButton:el.innerHTML.includes("ocPagarDeuda"),receipt:el.innerHTML.includes("Receipt fixture"),errors:errs});
  }
  // Legacy sequence gap must preserve the old diagnostic and debt button, even with no identity conflict.
  const el={innerHTML:""},w={OCI18n:{locale:()=>"en"}};
  const f=new Function("window","document","fetch","API","escHtml","fmtMoney","argHtml","t","_accionesVinculoCartera","_credExpOverride",code+"\nreturn pintarSaldoCartera;")(w,{getElementById:()=>el},async()=>({json:async()=>({saldo:-10,integridad:{ok:false,razon:"hueco de secuencia"},historial:[]})}),"/api",String,n=>"$"+Number(n).toFixed(2),JSON.stringify,s=>s,()=>"",()=> "");
  await f("A");out.push({legacyGap:true,warning:/Balance pending verification/.test(el.innerHTML),debt:/Debt \$10.00/.test(el.innerHTML),paymentButton:el.innerHTML.includes("ocPagarDeuda")});
  return out;
 }
 const red=await suite(original),green=await suite(candidate);
 if(red.filter(x=>x.flag).some(x=>x.provisional||x.warning)||green.slice(0,12).some(x=>x.errors.length||!x.receipt||x.paymentButton!==(x.saldo<0)||x.provisional!==x.flag||x.warning!==x.flag||x.settled!==(!x.flag&&x.saldo===0)||x.credit!==(!x.flag&&x.saldo>0))||!green[12].warning||!green[12].debt||!green[12].paymentButton)throw Error(JSON.stringify({red,green}));
 return {red,green,change:{before:original,after:candidate},scope:"exact source function; DOM and GET mocked; preserves legacy integrity warning and payment action"};
}
run(fs.readFileSync(process.argv[2],'utf8')).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
