'use strict';
const fs=require('node:fs');
function experiment(src){
 const anchor="    var centavos = 0;\n    var movimientos = mios.map(function (h) {";
 if(src.split(anchor).length!==2)throw Error("anchor");
 const candidate=src.replace(anchor,`    // EXPERIMENT ONLY: a directly linked sale with a known customer, exact
    // charge amount and identical explicit sale ID is one obligation.
    // Do not infer identities for manual, missing, restored or cross-client sales.
    var seenExplicit = new Map();
    mios = mios.slice().sort(function(a,b){return String(a.id).localeCompare(String(b.id));}).filter(function(h){
      var d=_d(h), id=String(d.ventaId||""), v=porId[id];
      if(h.tipo!==TIPOS.cargo||!id||!v||String(v.clienteId||"")!==String(clienteId)||v.anulada||v.devuelta||v.restauracionDe||!v.info||v.info.formaPago!=="fiado")return true;
      var key=JSON.stringify([id,_centavos(d.monto)]);
      if(seenExplicit.has(key))return false;
      seenExplicit.set(key,h.id);return true;
    });
`+anchor);
 const load=s=>{const w={};new Function("window",s)(w);return w.AMG.Cartera.calcularSaldo};
 const original=load(src),fixed=load(candidate),client="synthetic",t=1790000001000;
 const fact=(id,tipo,d,ts=t)=>({id,tipo,ts,datos:{clienteId:client,...d}});let seed=12893;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};
 let pass=0,red=0;const failures=[];
 for(let i=0;i<1000;i++){
  const cents=1+rnd()%25000,amount=cents/100,payment=(1+rnd()%cents)/100;
  const v={id:"sale",clienteId:client,cantidad:1,precioUnit:amount,fecha:"2026-11-25",info:{formaPago:"fiado",fiadoAtomico:true}};
  const a=fact("a-1","cartera_cargo",{monto:amount,motivo:"sale",ventaId:"sale",opId:"charge-a"}),b=fact("b-1","cartera_cargo",{monto:amount,motivo:"sale",ventaId:"sale",opId:"charge-b"});
  const p=fact("payment","cartera_abono",{monto:payment,motivo:"payment",opId:"payment-x"},t+3000),allocation=fact("allocation","cartera_aplicacion",{abonoId:"payment",accion:"aplicar",partes:[{cargoKey:"venta:sale",monto:payment}],opId:"allocation-x"},t+4000);
  const mode=i%4,fs=mode===0?[a,b]:mode===1?[a,b,p,allocation]:mode===2?[a]:[a,{...b,datos:{...b.datos,ventaId:"other"}},p];
  const vs=mode===3?[v,{...v,id:"other"}]:[v];for(let j=fs.length-1;j>0;j--){const k=rnd()%(j+1);[fs[j],fs[k]]=[fs[k],fs[j]]}
  const expected={saldo:-(mode===3?2:1)*cents+(mode===1||mode===3?Math.round(payment*100):0),applied:mode===1?Math.round(payment*100):0,count:mode===3?2:1};
  const snap=JSON.stringify({fs,vs});
  function inspect(calc){let x=calc(fs,client,vs);return {saldo:Math.round(x.saldo*100),applied:Math.round(x.movimientos.filter(m=>m.tipo==="cargo").reduce((n,m)=>n+m.aplicado,0)*100),count:x.movimientos.filter(m=>m.tipo==="cargo").length}}
  const x=inspect(original),y=inspect(fixed);if(JSON.stringify(x)!==JSON.stringify(expected))red++;
  if(JSON.stringify(y)===JSON.stringify(expected)&&JSON.stringify({fs,vs})===snap)pass++;else if(failures.length<5)failures.push({i,mode,expected,x,y});
 }
 const v={id:"sale",clienteId:client,cantidad:1,precioUnit:108,fecha:"2026-11-25",info:{formaPago:"fiado",fiadoAtomico:true}},a=fact("a","cartera_cargo",{monto:108,motivo:"sale",ventaId:"sale"}),b={...a,id:"b"};
 const boundaries=[["sale missing",[a,b],[]],["conflicting stored amount",[a,{...b,datos:{...b.datos,monto:100}}],[v]],["different customer",[a,b],[{...v,clienteId:"other"}]],["manual charges",[a,b].map(h=>({...h,datos:{...h.datos,ventaId:undefined}})),[]]].map(([name,fs,vs])=>({name,before:original(fs,client,vs).saldo,after:fixed(fs,client,vs).saldo}));
 return {pass,red,failures,boundaries};
}
const result=experiment(fs.readFileSync(process.argv[2],'utf8'));console.log(JSON.stringify(result,null,2));if(result.pass!==1000||result.boundaries.some(x=>x.before!==x.after))process.exitCode=1;
