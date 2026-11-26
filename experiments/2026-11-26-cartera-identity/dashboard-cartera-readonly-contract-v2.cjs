function proyectar(datos, clienteId, calcular, conciliacion) {
  // Read-only contract, never a substitute for verification of the snapshot.
  const c=datos&&datos.cobertura;
  if(!c || c.hechosFinancieros!==true || c.ventas!==true ||
     !Array.isArray(datos.hechosFinancieros)||!Array.isArray(datos.ventas)||
     conciliacion!==false || typeof calcular!=="function")
    return {estado:"pendiente",saldo:null};
  try {
    const r=calcular(datos.hechosFinancieros,clienteId,datos.ventas);
    if(!r || !Number.isFinite(r.saldo) || r.conflictosAplicacion)
      return {estado:"conflicto",saldo:null};
    return {estado:"proyeccion",saldo:r.saldo,movimientos:r.movimientos};
  } catch(e) {return {estado:"conflicto",saldo:null};}
}
function run(source){
  let writes=0;
  const w={AMG:{Hechos:{registrar(){writes++;throw Error("write")},todos(){writes++;throw Error("read storage")}},EventBus:{emit(){writes++;throw Error("event")}}}};
  new Function("window",source)(w);
  const calc=w.AMG.Cartera.calcularSaldo;
  const h=(id,t,m,op,extra={})=>({id,tipo:"cartera_"+t,ts:1000,datos:{clienteId:"C",monto:m,motivo:"x",opId:op,...extra}});
  const c=h("c","cargo",35,"c"),p=h("p","abono",10,"p");
  const ok={cobertura:{hechosFinancieros:true,ventas:true},hechosFinancieros:[c,p],ventas:[]};
  const cases=[
    ["partial 10/35",ok,"proyeccion",-25],
    ["unassigned 39.50",{...ok,hechosFinancieros:[h("c","cargo",165.5,"c"),h("p","abono",39.5,"p")]},"proyeccion",-126],
    ["verified empty",{...ok,hechosFinancieros:[]},"proyeccion",0],
    ["missing ledger",{...ok,hechosFinancieros:undefined},"pendiente",null],
    ["missing sales",{...ok,ventas:undefined},"pendiente",null],
    ["unverified ledger",{...ok,cobertura:{...ok.cobertura,hechosFinancieros:false}},"pendiente",null],
    ["unverified sales",{...ok,cobertura:{...ok.cobertura,ventas:false}},"pendiente",null],
    ["reconciliation pending",{...ok,sinConciliar:true},"pendiente",null],
    ["A02 remains baseline defect",{...ok,hechosFinancieros:[c,p,h("p2","abono",10,"p")]},"proyeccion",-15],
    ["A05 remains baseline defect",{...ok,hechosFinancieros:[h("c1","cargo",108,"a",{ventaId:"v"}),h("c2","cargo",108,"b",{ventaId:"v"})],ventas:[{id:"v",clienteId:"C",precioUnit:108,cantidad:1,info:{formaPago:"fiado",fiadoAtomico:true}}]},"proyeccion",-216]
  ];
  const results=cases.map(([name,data,state,saldo])=>{let pass=0;for(let i=0;i<20;i++){const before=JSON.stringify(data);const r=proyectar(data,"C",calc,data.sinConciliar===true);if(r.estado===state&&r.saldo===saldo&&JSON.stringify(data)===before)pass++;}return {name,pass,total:20,state,saldo};});
  for(const [name,fn] of [["missing engine",null],["exception",()=>{throw Error("409")}],["allocation conflict",()=>({saldo:-25,conflictosAplicacion:1})],["invalid amount",()=>({saldo:NaN})]]){let pass=0;for(let i=0;i<20;i++){const r=proyectar(ok,"C",fn,false);if(r.saldo===null&&r.estado===(fn?"conflicto":"pendiente"))pass++;}results.push({name,pass,total:20});}
  for(const [name,flag] of [['unknown reconciliation',undefined],['active reconciliation',true]]){let pass=0;for(let i=0;i<20;i++){const r=proyectar(ok,'C',calc,flag);if(r.estado==='pendiente'&&r.saldo===null)pass++;}results.push({name,pass,total:20});}
  return {writes,results};
}
const fs=require('node:fs'),crypto=require('node:crypto');const s=fs.readFileSync(process.argv[2],'utf8');if(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')!=='49353f93f067d8efdd4484ecd689ebf628980ae5')throw Error('wrong blob');const r=run(s);console.log(JSON.stringify(r,null,2));if(r.writes||r.results.some(x=>x.pass!==x.total))process.exitCode=1;
