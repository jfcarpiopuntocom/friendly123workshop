function patch(s){
 const edits=[
 ["if (!response.ok || result.error) throw new Error(result.error || 'Could not confirm the payment.');","if (!response.ok || result.error) { var error = new Error(result.error || 'Could not confirm the payment.'); error.status = response.status; throw error; }"],
 ['throw new Error(respuesta.error || "Payment saved; allocation pending confirmation.");','var error = new Error(respuesta.error || "Payment saved; allocation pending confirmation."); error.status = res.status; throw error;'],
 ['"No se envió el pago: su referencia no pudo guardarse. No borres datos."','"Referencia de pago no verificada. Revisa la referencia original antes de cobrar de nuevo."'],
 ['"Payment not sent: durable reference unavailable. Do not clear data."','"Payment reference not verified. Review the original reference before charging again."']
 ];for(const [a,b] of edits){if(s.split(a).length!==2)throw Error("anchor "+a);s=s.replace(a,b);}return s;
}
async function run(s,patch){
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
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='e4396184dee07a7b0c963c7ed28241c38b50ba5e')throw Error('wrong blob');run(s,patch).then(r=>{console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;});
