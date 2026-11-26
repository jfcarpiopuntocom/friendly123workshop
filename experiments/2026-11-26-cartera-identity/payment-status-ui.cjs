function patch(s){
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
function run(source,patch){
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
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='e4396184dee07a7b0c963c7ed28241c38b50ba5e')throw Error('wrong blob');const r=run(s,patch);console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;
