function patchUI(s){
 const a='var errorAsignacion = function (e) {';
 const start=s.indexOf(a),end=s.indexOf('\n      };',start)+9;
 if(start<0||end<9||s.indexOf(a,start+1)!==-1)throw Error('anchor mismatch');
 const b='var errorAsignacion = function (e, noEnviado) {\n        msg.style.color = "#B0183E";\n        if (pendienteAsignacion && pendienteAsignacion.abonoId) {\n          msg.textContent = es ? "Recibo de pago identificado; asignación pendiente de confirmar. No cobres de nuevo." : "Payment receipt identified; allocation awaiting confirmation. Do not charge again.";\n        } else if (noEnviado) {\n          msg.textContent = es ? "No se envió este pago. Su referencia requiere revisión." : "This payment was not sent. Its reference requires review.";\n        } else if (e && (e.codigo === "F123_REFERENCIA_PAGO_NO_GUARDADA" || e.status === 409)) {\n          msg.textContent = es ? "Referencia de pago requiere revisión. No cobres de nuevo." : "Payment reference requires review. Do not charge again.";\n        } else {\n          msg.textContent = es ? "Pago sin confirmar. Verifica la referencia original antes de cobrar de nuevo." : "Payment unconfirmed. Verify the original reference before charging again.";\n        }\n      };';
 s=s.slice(0,start)+b+s.slice(end);
 // Only the newly initiated allocation path can prove it has not invoked the payment sender.
 const x='var tarea;\n      if (partes.length) {';
 const y='var tarea, pagoNoEnviado = false;\n      if (partes.length) {';
 if(s.split(x).length!==2)throw Error('task anchor');s=s.replace(x,y);
 const c='.then(function () { return reanudarAsignacion(clienteId, pendienteAsignacion); })';
 if(s.split(c).length!==2)throw Error('phase anchor');
 s=s.replace(c,'.then(function () { return reanudarAsignacion(clienteId, pendienteAsignacion); }, function (error) {\n            // An existing payment intent may represent a previous uncertain POST.\n            pagoNoEnviado = !anterior;\n            throw error;\n          })');
 const d='          errorAsignacion(e);\n        } else {';
 if(s.split(d).length!==2)throw Error('handler anchor');return s.replace(d,'          errorAsignacion(e, pagoNoEnviado);\n        } else {');
}
function runUI(source,patch){
 const cases=[
 ['new pre-send failure',null,{codigo:'F123_REFERENCIA_PAGO_NO_GUARDADA'},true,'not sent'],
 ['existing intent storage error',null,{codigo:'F123_REFERENCIA_PAGO_NO_GUARDADA'},false,'requires review'],
 ['uncertain network',null,new Error('network'),false,'unconfirmed'],
 ['receipt then allocation error','r1',new Error('network'),false,'receipt identified'],
 ['receipt then storage error','r1',{codigo:'F123_REFERENCIA_PAGO_NO_GUARDADA'},false,'receipt identified'],
 ['identity conflict',null,{status:409},false,'requires review']];
 const esMap={'not sent':'no se envió','requires review':'requiere revisión','unconfirmed':'sin confirmar','receipt identified':'recibo de pago identificado'};
 const out={};for(const [name,s] of [['original',source],['candidate',patch(source)]]){
 new Function(s);const start=s.indexOf('var errorAsignacion = function (e'),end=s.indexOf('\n      };',start)+9;const handler=s.slice(start,end);
 out[name]=cases.flatMap(([id,receipt,e,unsent,expected])=>[false,true].map(es=>{
 let pass=0,last='';for(let i=0;i<20;i++){const msg={style:{}};const f=new Function('es','msg','pendienteAsignacion',handler+';return errorAsignacion;')(es,msg,{abonoId:receipt});f(e,unsent);last=msg.textContent;if(last.toLowerCase().includes(es?esMap[expected]:expected))pass++;}
 return {id,es,pass,total:20,last};
 }));}return out;
}

function patchHTTP(s){
 const edits=[
 ["if (!response.ok || result.error) throw new Error(result.error || 'Could not confirm the payment.');","if (!response.ok || result.error) { var error = new Error(result.error || 'Could not confirm the payment.'); error.status = response.status; throw error; }"],
 ['throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");','var error = new Error(respuesta.error || "Payment saved; allocation pending confirmation."); error.status = res.status; throw error;'],
 ['"No se envió el pago: su referencia no pudo guardarse. No borres datos."','"Referencia de pago no verificada. Revisa la referencia original antes de cobrar de nuevo."'],
 ['"Payment not sent: durable reference unavailable. Do not clear data."','"Payment reference not verified. Review the original reference before charging again."']
 ];for(const [a,b] of edits){if(s.split(a).length!==2)throw Error("anchor "+a);s=s.replace(a,b);}return s;
}
async function runHTTP(s,patch){
 const cases=[{name:"payment 409",status:409,allocation:false},{name:"payment 503",status:503,allocation:false},{name:"allocation 409",status:409,allocation:true},{name:"allocation 503",status:503,allocation:true},{name:"payment success",status:200,allocation:false},{name:"allocation success",status:200,allocation:true},{name:"mismatched receipt",status:200,allocation:false,mismatch:true}];
 const result={};for(const [label,code] of [["original",s],["candidate",patch(s)]]){
 new Function(code);
 const a=code.indexOf("global.ocEnviarAbono = async function"),b=code.indexOf("  /* A confirmed payment",a);
 const c=code.indexOf("async function confirmarAsignacion"),d=code.indexOf("  async function reanudarAsignacion",c);
 if([a,b,c,d].some(x=>x<0))throw Error("extract");
 result[label]=[];
 for(const x of cases){let pass=0,last;
 for(let i=0;i<20;i++){let posts=0,releases=0;const global={crypto:{randomUUID:()=>"uuid"}};const fetch=async()=>{posts++;return {ok:x.status===200,status:x.status,json:async()=>x.status!==200?{error:"failure"}:{opId:x.mismatch?"other":x.allocation?"alloc":"pay",movimientoId:"receipt",aplicacionId:"application"}}};
 const f=new Function("global","fetch","API","_pagoAutorizarCobro","claveAbono","leerReferenciaDurable","guardarReferenciaPagoDurable","_pagoMismaSesion","_pagoLiberarReferencia","claveAsignacion",code.slice(a,b)+code.slice(c,d)+";return confirmarAsignacion;")(global,fetch,"/api",()=>{},()=> "payment",async()=>null,async()=>({}),()=>{},async()=>{releases++},()=> "allocation");
 let error=null;try{if(x.allocation)await f("C",{abonoId:"receipt",partes:[],opId:"alloc",paymentOpId:"pay"},{});else await global.ocEnviarAbono("C",10,"Abono",{opId:"pay"});}catch(e){error=e;}
 const ok=posts===1&&(x.status!==200?error?.status===x.status&&releases===0:x.mismatch?!!error&&releases===0:!error&&releases===(x.allocation?2:1));if(ok)pass++;last={posts,releases,status:error?.status??null,error:!!error};}
 result[label].push({name:x.name,pass,total:20,last});}
 }return result;
}

function combined(s){return patchHTTP(patchUI(s));}
async function check(s){const u=runUI(s,combined),h=await runHTTP(s,combined);return {ui:u,http:h};}
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='e4396184dee07a7b0c963c7ed28241c38b50ba5e')throw Error('wrong blob');check(s).then(r=>{console.log(JSON.stringify(r,null,2));if(Object.values(r).some(v=>v.candidate.some(x=>x.pass!==x.total)))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
