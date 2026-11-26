function patch(fin,main){
 function edit(s,a,b){if(s.split(a).length!==2)throw Error('anchor '+a);return s.replace(a,b);}
 fin=edit(fin,'  function buildReport() {','  let reconciliationPending = false;\n  function invalidate() {\n    reconciliationPending = true; revision++; lastReport = null;\n    const output = document.getElementById("finance-output"), status = document.getElementById("finance-status");\n    if (output) output.replaceChildren();\n    if (status) status.textContent = text("Device data differs. Reconcile before calculating or exporting.", "Los datos difieren entre aparatos. Concilia antes de calcular o exportar.");\n  }\n  function buildReport() {\n    if (reconciliationPending) throw new Error(text("Device data differs. Reconcile before calculating or exporting.", "Los datos difieren entre aparatos. Concilia antes de calcular o exportar."));');
 fin=edit(fin,'  function update(snapshot, businessZone) {\n    data = snapshot || {};','  function update(snapshot, businessZone, pending) {\n    reconciliationPending = pending === true;\n    data = snapshot || {};');
 fin=edit(fin,"    document.getElementById('finance-output').replaceChildren();\n  }\n  let reconciliationPending","    document.getElementById('finance-output').replaceChildren();\n    if (reconciliationPending) invalidate();\n  }\n  let reconciliationPending");
 fin=edit(fin,'{ update, buildReport: calculate }','{ update, invalidate, buildReport: calculate }');
 main=edit(main,'      recibirTrozo.sinConciliar = true;','      recibirTrozo.sinConciliar = true;\n      if (window.OCFinanceReport && window.OCFinanceReport.invalidate) window.OCFinanceReport.invalidate();');
 main=edit(main,'window.OCFinanceReport.update(datos, zone);','window.OCFinanceReport.update(datos, zone, _fuenteDatosDashboard === "remota" && recibirTrozo.sinConciliar === true);');
 return {fin,main};
}
async function run(fin,main,patch){
 const p=patch(fin,main);new Function(p.fin);new Function(p.main);
 async function test(s,kind,lang){
  const elements=new Map();
  function node(){return {value:"monthly",textContent:"",disabled:false,style:{},children:[],append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},setAttribute(){},removeAttribute(){}};}
  for(const k of ["finanzas-foto-contenido","finance-period-report","finance-cadence","finance-group","finance-month","finance-heading","finance-generate","finance-pdf","finance-status","finance-output","neg-nombre"])elements.set(k,node());
  let pending=[],saves=0,prepared=0;
  class Worker {postMessage(){pending.push(this)}terminate(){}}
  const document={getElementById:k=>elements.get(k)||null,createElement:node};
  const window={OCBusinessReadModel:{},OCReportPeriod:{range:()=>({from:"2026-01-01",to:"2026-01-31"})},OCDashboardExports:{captureSession:()=>()=>true,prepare:async()=>{prepared++}},jspdf:{jsPDF:function(){this.save=()=>saves++;this.lastAutoTable={finalY:0}}},OCReportPDF:{create:()=>({metrics(){},paragraph(){},table(){},finish(){}})}};
  // Test hooks expose actual internal entrypoints only inside the harness.
  const code=s.replace('window.OCFinanceReport = {','window.__test = { render, exportPDF }; window.OCFinanceReport = {');
  new Function("window","document","localStorage","Worker",code)(window,document,{getItem:()=>lang},Worker);
  const f=window.OCFinanceReport, t=window.__test;
  const snap={cobertura:{ventas:true,gastos:true,ajustesComision:true,finanzasCoherentes:true}};
  const update=(flag=false)=>f.update(snap,"America/Guayaquil",flag);
  const reject=()=>{if(f.invalidate)f.invalidate();};
  const deliver=()=>{const w=pending.shift();if(w)w.onmessage({data:{rows:[{name:"all",result:Object.fromEntries(["netCents","artistShareCents","houseShareCents","costCents","directExpensesCents","contributionCents","houseAfterExpensesCents","expensesCents"].map(k=>[k,100]))}]}});};
  const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
  update();
  if(kind==="valid"){const q=t.render();deliver();await q;return elements.get("finance-output").children.length>0;}
  if(kind==="retained visible"){let q=t.render();deliver();await q;reject();return elements.get("finance-output").children.length===0;}
  if(kind==="rejected before calculate"){reject();const q=t.render();deliver();await q;return elements.get("finance-output").children.length===0;}
  if(kind==="rejected during worker"){const q=t.render();reject();deliver();await q;return elements.get("finance-output").children.length===0;}
  if(kind==="rejected before PDF"){reject();const q=t.exportPDF();await flush();deliver();await q;return saves===0&&prepared===0;}
  if(kind==="rejected during PDF"){const q=t.exportPDF();await flush();reject();deliver();await q;return saves===0;}
  if(kind==="pending refresh"){update(true);const q=t.render();deliver();await q;return elements.get("finance-output").children.length===0;}
  if(kind==="recovered"){reject();update(false);const q=t.render();deliver();await q;return elements.get("finance-output").children.length>0;}
  throw Error(kind);
 }
 const kinds=["valid","retained visible","rejected before calculate","rejected during worker","rejected before PDF","rejected during PDF","pending refresh","recovered"];
 const result={};for(const [label,s] of [["original",fin],["candidate",p.fin]]){result[label]=[];for(const kind of kinds)for(const lang of ["es","en"]){let pass=0;for(let i=0;i<20;i++)if(await test(s,kind,lang))pass++;result[label].push({kind,lang,pass,total:20});}}return result;
}
const fs=require('node:fs'),crypto=require('node:crypto');const f=fs.readFileSync(process.argv[2],'utf8'),m=fs.readFileSync(process.argv[3],'utf8');function blob(s){return crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')}if(blob(f)!=='5b002b8b8c5f507cb1c78dff32f196de5238d73e'||blob(m)!=='c82edfe4a008182f20f69536d1a7000ef0b9410f')throw Error('wrong blobs');run(f,m,patch).then(r=>{console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
