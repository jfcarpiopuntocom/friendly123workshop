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

function timeoutPatch(s){
 const a='worker.onmessage = event => { if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.rows); };';
 const b='worker.onmessage = event => { if (event.data && event.data.error) reject(new Error(event.data.error)); else if (event.data && Array.isArray(event.data.rows) && event.data.rows.length && event.data.rows.every(row => row && row.result && typeof row.result === "object")) resolve(event.data.rows); else reject(new Error(text("Invalid report response. Calculate again.", "Respuesta del reporte inválida. Calcula otra vez."))); };';
 if(s.split(a).length!==2)throw Error('message anchor');s=s.replace(a,b);
 const c='    const rows = await new Promise((resolve, reject) => {';
 const d='    let timer;\n    const rows = await new Promise((resolve, reject) => {\n      timer = setTimeout(() => reject(new Error(text("Report calculation timed out. Calculate again.", "El cálculo del reporte excedió el tiempo. Calcula otra vez."))), 30000);';
 if(s.split(c).length!==2)throw Error('timer anchor');s=s.replace(c,d);
 const e='}).finally(() => { if (worker) worker.terminate(); worker = null; });';
 const g='}).finally(() => { clearTimeout(timer); const finished = worker; worker = null; if (finished) finished.terminate(); });';
 if(s.split(e).length!==2)throw Error('finally anchor');return s.replace(e,g);
}
async function timeoutRun(fin,main,patch,timeoutPatch){
 const original=patch(fin,main).fin, candidate=timeoutPatch(original);
 async function test(s,kind,lang){
  const elements=new Map();function node(){return {value:"monthly",textContent:"",disabled:false,style:{},children:[],append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},setAttribute(){},removeAttribute(){}};}
  for(const k of ["finanzas-foto-contenido","finance-period-report","finance-cadence","finance-group","finance-month","finance-heading","finance-generate","finance-pdf","finance-status","finance-output","neg-nombre"])elements.set(k,node());
  const workers=[],timers=new Map();let tid=0,saves=0;
  class Worker{constructor(){workers.push(this);this.terminated=0}postMessage(){}terminate(){this.terminated++}}
  const window={OCBusinessReadModel:{},OCReportPeriod:{range:()=>({from:"2026-01-01",to:"2026-01-31"})},OCDashboardExports:{captureSession:()=>()=>true,prepare:async()=>{}},jspdf:{jsPDF:function(){this.save=()=>saves++;this.lastAutoTable={finalY:0}}},OCReportPDF:{create:()=>({metrics(){},paragraph(){},table(){},finish(){}})}};
  const doc={getElementById:k=>elements.get(k)||null,createElement:node};
  const code=s.replace("window.OCFinanceReport = {","window.__test = { render, exportPDF }; window.OCFinanceReport = {");
  new Function("window","document","localStorage","Worker","setTimeout","clearTimeout",code)(window,doc,{getItem:()=>lang},Worker,fn=>{timers.set(++tid,fn);return tid},id=>timers.delete(id));
  const f=window.OCFinanceReport,t=window.__test;f.update({cobertura:{ventas:true,gastos:true,ajustesComision:true,finanzasCoherentes:true}},"America/Guayaquil",false);
  const good={rows:[{name:"all",result:Object.fromEntries(["netCents","artistShareCents","houseShareCents","costCents","directExpensesCents","contributionCents","houseAfterExpensesCents","expensesCents"].map(k=>[k,100]))}]};
  const flush=async()=>{for(let i=0;i<25;i++)await Promise.resolve()};
  const expire=()=>{for(const fn of [...timers.values()])fn()};
  let done=false;const q=(kind==="pdf timeout"?t.exportPDF():t.render()).then(()=>done=true);await flush();
  const w=workers[0];if(!w)throw Error("no worker");
  if(kind==="timeout"||kind==="pdf timeout")expire();
  else if(kind==="null response"){try{w.onmessage({data:null})}catch{}}
  else if(kind==="empty rows")w.onmessage({data:{rows:[]}});
  else if(kind==="malformed row")w.onmessage({data:{rows:[null]}});
  else if(kind==="valid")w.onmessage({data:good});
  else if(kind==="worker error")w.onerror();
  await flush();
  const status=elements.get("finance-status").textContent,output=elements.get("finance-output"),pdf=elements.get("finance-pdf");
  const valid=kind==="valid";const expected=lang==="es"?kind.includes("timeout")?"excedió":kind==="worker error"?"No cargó":"inválida":kind.includes("timeout")?"timed out":kind==="worker error"?"could not load":"Invalid report response";
  const first=done&&w.terminated===1&&timers.size===0&&saves===0&&(valid?output.children.length>0:output.children.length===0&&status.includes(expected))&&!pdf.disabled;
  if(!first)return false;
  if(!valid){let recovered=false;const retry=t.render().then(()=>recovered=true);await flush();const n=workers[1];if(!n)return false;w.onmessage({data:good});n.onmessage({data:good});await retry;return recovered&&n.terminated===1&&timers.size===0&&output.children.length>0;}
  return true;
 }
 const result={};for(const [label,s] of [["reconciliation",original],["candidate",candidate]]){result[label]=[];for(const kind of ["timeout","pdf timeout","null response","empty rows","malformed row","valid","worker error"])for(const lang of ["es","en"]){let pass=0;for(let i=0;i<20;i++)if(await test(s,kind,lang))pass++;result[label].push({kind,lang,pass,total:20});}}return result;
}

function numericPatch(s){
 const a='row && row.result && typeof row.result === "object"';
 const b='row && (row.name === null || typeof row.name === "string") && row.result && ["netCents","artistShareCents","houseShareCents","costCents","directExpensesCents","contributionCents","houseAfterExpensesCents","expensesCents"].every(key => row.result[key] === null || Number.isSafeInteger(row.result[key]))';
 if(s.split(a).length!==2)throw Error("anchor");return s.replace(a,b);
}
async function numericRun(fin,main){
 const old=timeoutPatch(patch(fin,main).fin), next=numericPatch(old);
 const keys=["netCents","artistShareCents","houseShareCents","costCents","directExpensesCents","contributionCents","houseAfterExpensesCents","expensesCents"];
 const cases=[["valid",100,true],["unknown",null,true],["negative",-100,true],["zero",0,true],["missing",undefined,false],["string","100",false],["nan",NaN,false],["infinity",Infinity,false],["fraction",1.25,false],["overflow",Number.MAX_SAFE_INTEGER+1,false],["boolean",false,false],["invalid group name",100,false],["invalid detail row",100,false]];
 async function test(s,lang,kind,value,valid,mode){
 const elements=new Map();function node(){return {value:"monthly",textContent:"",disabled:false,style:{},children:[],append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},setAttribute(){},removeAttribute(){}};}
 for(const k of ["finanzas-foto-contenido","finance-period-report","finance-cadence","finance-group","finance-month","finance-heading","finance-generate","finance-pdf","finance-status","finance-output","neg-nombre"])elements.set(k,node());
 let workers=[],saves=0;class Worker{constructor(){workers.push(this)}postMessage(){}terminate(){}}
 const window={OCBusinessReadModel:{},OCReportPeriod:{range:()=>({from:"2026-01-01",to:"2026-01-31"})},OCDashboardExports:{captureSession:()=>()=>true,prepare:async()=>{}},jspdf:{jsPDF:function(){this.save=()=>saves++;this.lastAutoTable={finalY:0}}},OCReportPDF:{create:()=>({metrics(){},paragraph(){},table(){},finish(){}})}};
 const doc={getElementById:k=>elements.get(k)||null,createElement:node};
 const code=s.replace("window.OCFinanceReport = {","window.__test = { render, exportPDF }; window.OCFinanceReport = {");
 new Function("window","document","localStorage","Worker","setTimeout","clearTimeout",code)(window,doc,{getItem:()=>lang},Worker,()=>1,()=>{});
 window.OCFinanceReport.update({cobertura:{ventas:true,gastos:true,ajustesComision:true,finanzasCoherentes:true}},"America/Guayaquil",false);
 const q=window.__test[mode]();for(let i=0;i<20;i++)await Promise.resolve();
 const r=Object.fromEntries(keys.map(k=>[k,100]));if(kind==="missing")delete r.costCents;else r.costCents=value;
 const rows=[{name:kind==="invalid group name"?{}:null,result:r}];if(kind==="invalid detail row")rows.push({name:"detail",result:{...r,netCents:"bad"}});
 workers[0].onmessage({data:{rows}});await q;
 const rendered=elements.get("finance-output").children.length>0;const status=elements.get("finance-status").textContent;
 return valid?rendered&&(mode==="render"||saves===1):!rendered&&saves===0&&status.includes(lang==="es"?"inválida":"Invalid report response");
 }
 const out={};for(const [label,s] of [["prior",old],["candidate",next]]){out[label]=[];for(const [kind,value,valid] of cases)for(const lang of ["es","en"])for(const mode of ["render","exportPDF"]){let pass=0;for(let i=0;i<20;i++)if(await test(s,lang,kind,value,valid,mode))pass++;out[label].push({kind,lang,mode,pass,total:20});}}return out;
}


function stalePatch(s){
 const a="  async function render() {\n    lastReport = null;";
 const b="  async function render() {\n    lastReport = null;\n    const output = document.getElementById('finance-output');\n    if (output) output.replaceChildren();";
 if(s.split(a).length!==2)throw Error("render anchor");return s.replace(a,b);
}
async function staleRun(fin,main){
 const old=numericPatch(timeoutPatch(patch(fin,main).fin)),next=stalePatch(old);
 const keys=["netCents","artistShareCents","houseShareCents","costCents","directExpensesCents","contributionCents","houseAfterExpensesCents","expensesCents"];
 async function test(s,lang,kind){
 const elements=new Map();function node(){return {value:"monthly",textContent:"",disabled:false,style:{},children:[],append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},setAttribute(){},removeAttribute(){}};}
 for(const k of ["finanzas-foto-contenido","finance-period-report","finance-cadence","finance-group","finance-month","finance-heading","finance-generate","finance-pdf","finance-status","finance-output","neg-nombre"])elements.set(k,node());
 let workers=[],saves=0;class Worker{constructor(){workers.push(this)}postMessage(){}terminate(){}}
 const window={OCBusinessReadModel:{},OCReportPeriod:{range:(month)=>month==="bad"?null:({from:month+"-01",to:month+"-28"})},OCDashboardExports:{captureSession:()=>()=>true,prepare:async()=>{}},jspdf:{jsPDF:function(){this.save=()=>saves++;this.lastAutoTable={finalY:0}}},OCReportPDF:{create:()=>({metrics(){},paragraph(){},table(){},finish(){}})}};
 const doc={getElementById:k=>elements.get(k)||null,createElement:node};
 const code=s.replace("window.OCFinanceReport = {","window.__test = { render, exportPDF }; window.OCFinanceReport = {");
 new Function("window","document","localStorage","Worker","setTimeout","clearTimeout",code)(window,doc,{getItem:()=>lang},Worker,()=>1,()=>{});
 const output=elements.get("finance-output"),month=elements.get("finance-month");month.value="2026-01";
 window.OCFinanceReport.update({cobertura:{ventas:true,gastos:true,ajustesComision:true,finanzasCoherentes:true}},"America/Guayaquil",false);
 const good={rows:[{name:null,result:Object.fromEntries(keys.map(k=>[k,100]))}]};
 const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
 let q=window.__test.render();workers[0].onmessage({data:good});await q;
 if(!output.children.length)throw Error("setup");
 month.value=kind==="invalid selection"?"bad":"2026-02";
 q=window.__test.render();await flush();
 const clearedBefore=output.children.length===0;
 if(kind==="worker error")workers[1].onerror();
 if(kind==="bad response")workers[1].onmessage({data:null});
 if(kind==="valid")workers[1].onmessage({data:good});
 if(kind==="selection race"){month.value="2026-03";workers[1].onmessage({data:good});}
 await q;
 const expected=kind==="valid"?output.children.length>0&&output.children[0].textContent.includes("2026-02"):output.children.length===0;
 return clearedBefore&&expected&&saves===0;
 }
 const out={};for(const [label,s] of [["prior",old],["candidate",next]]){out[label]=[];for(const kind of ["invalid selection","worker error","bad response","selection race","valid"])for(const lang of ["es","en"]){let pass=0;for(let i=0;i<20;i++)if(await test(s,lang,kind))pass++;out[label].push({kind,lang,pass,total:20});}}return out;
}


function selectionPatch(s){
 const a="    controls.append(cadence, month, group, generate, pdf); host.append(controls);";
 const b="    [cadence, month, group].forEach(control => control.addEventListener('change', selectionChanged));\n"+a;
 if(s.split(a).length!==2)throw Error("mount anchor");
 s=s.replace(a,b);
 const c="  function buildReport() {";
 const d="  function selectionChanged() {\n    revision++; lastReport = null;\n    const output = document.getElementById('finance-output'), status = document.getElementById('finance-status');\n    if (output) output.replaceChildren();\n    if (status && !reconciliationPending) status.textContent = text('Selection changed. Calculate again.', 'Cambió la selección. Calcula otra vez.');\n  }\n"+c;
 if(s.split(c).length!==2)throw Error("build anchor");return s.replace(c,d);
}
async function selectionRun(fin,main){
 const old=stalePatch(numericPatch(timeoutPatch(patch(fin,main).fin))),next=selectionPatch(old);
 const keys=["netCents","artistShareCents","houseShareCents","costCents","directExpensesCents","contributionCents","houseAfterExpensesCents","expensesCents"];
 async function test(s,lang,kind){
 const elements=new Map();function node(){return {value:"",textContent:"",disabled:false,style:{},children:[],listeners:{},set id(k){elements.set(k,this)},append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},setAttribute(){},removeAttribute(){},addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)},change(v){this.value=v;for(const fn of this.listeners.change??[])fn()}};}
 const target=node();target.parentNode={insertBefore(){}};elements.set("finanzas-foto-contenido",target);
 let workers=[];class Worker{constructor(){workers.push(this)}postMessage(){}terminate(){}}
 const window={OCBusinessReadModel:{day:()=>"2026-01-01"},OCReportPeriod:{range:(month,cadence)=>({from:month+"-01",to:month+"-"+(cadence==="monthly"?"28":"31")})}};
 const doc={getElementById:k=>elements.get(k)||null,createElement:node};
 const code=s.replace("window.OCFinanceReport = {","window.__test = { render }; window.OCFinanceReport = {");
 new Function("window","document","localStorage","Worker","setTimeout","clearTimeout",code)(window,doc,{getItem:()=>lang},Worker,()=>1,()=>{});
 window.OCFinanceReport.update({cobertura:{ventas:true,gastos:true,ajustesComision:true,finanzasCoherentes:true}},"America/Guayaquil",false);
 const output=elements.get("finance-output"),status=elements.get("finance-status");
 const good={rows:[{name:null,result:Object.fromEntries(keys.map(k=>[k,100]))}]};
 let q=window.__test.render();workers[0].onmessage({data:good});await q;
 if(!output.children.length)throw Error("setup");
 if(kind==="month")elements.get("finance-month").change("2026-02");
 if(kind==="cadence")elements.get("finance-cadence").change("quarterly");
 if(kind==="group")elements.get("finance-group").change("events");
 if(kind==="unchanged")return output.children.length>0;
 if(kind==="change back during worker"){q=window.__test.render();elements.get("finance-month").change("2026-02");elements.get("finance-month").change("2026-01");workers[1].onmessage({data:good});await q;return output.children.length===0;}
 if(kind==="pending reconciliation"){window.OCFinanceReport.invalidate();elements.get("finance-month").change("2026-02");return output.children.length===0&&status.textContent.includes(lang==="es"?"Concilia":"Reconcile");}
 const cleared=output.children.length===0&&status.textContent.includes(lang==="es"?"selección":"Selection");
 q=window.__test.render();workers[1].onmessage({data:good});await q;
 return cleared&&output.children.length>0;
 }
 const out={};for(const [label,s] of [["prior",old],["candidate",next]]){out[label]=[];for(const kind of ["month","cadence","group","unchanged","change back during worker","pending reconciliation"])for(const lang of ["es","en"]){let pass=0;for(let i=0;i<20;i++)if(await test(s,lang,kind))pass++;out[label].push({kind,lang,pass,total:20});}}return out;
}

function quickPatch(fin,main){
 const p=patch(fin,main);let s=selectionPatch(stalePatch(numericPatch(timeoutPatch(p.fin))));
 const a='{ update, invalidate, buildReport: calculate }',b='{ update, invalidate, selectionChanged, buildReport: calculate }';
 if(s.split(a).length!==2)throw Error('finance API anchor');s=s.replace(a,b);
 const x='      pintarTabla();\n    });\n    desde.addEventListener("change",pintarTabla);hasta.addEventListener("change",pintarTabla);';
 const y='      actualizarPeriodo();\n    });\n    function actualizarPeriodo() {\n      if (window.OCFinanceReport && window.OCFinanceReport.selectionChanged) window.OCFinanceReport.selectionChanged();\n      pintarTabla();\n    }\n    desde.addEventListener("change",actualizarPeriodo);hasta.addEventListener("change",actualizarPeriodo);';
 if(p.main.split(x).length!==2)throw Error('quick period anchor');return {fin:s,main:p.main.replace(x,y)};
}
async function quickRun(fin,main){
 const p=patch(fin,main),old={fin:selectionPatch(stalePatch(numericPatch(timeoutPatch(p.fin)))),main:p.main},next=quickPatch(fin,main);
 const keys=["netCents","artistShareCents","houseShareCents","costCents","directExpensesCents","contributionCents","houseAfterExpensesCents","expensesCents"];
 async function test(src,lang,kind){
 const elements=new Map();function node(){return {value:"",textContent:"",disabled:false,style:{},children:[],listeners:{},set id(k){elements.set(k,this)},append(...x){this.children.push(...x)},appendChild(x){this.append(x)},replaceChildren(){this.children=[]},setAttribute(){},removeAttribute(){},addEventListener(k,fn){(this.listeners[k]??=[]).push(fn)},change(v){this.value=v;for(const fn of this.listeners.change??[])fn()}};}
 const parent={insertBefore(){}};for(const id of ["finanzas-foto-contenido","buscar"]){const n=node();n.parentNode=parent;elements.set(id,n)}
 let workers=[],paint=0;class Worker{constructor(){workers.push(this)}postMessage(){}terminate(){}}
 const window={OCBusinessReadModel:{day:()=>"2026-11-26"},OCReportPeriod:{range:m=>({from:m+"-01",to:m+"-28"}),quick:(k,h,f,t)=>k==="custom"?(f&&t?{from:f,to:t}:null):{from:k==="today"?h:"2026-11-01",to:h}}};
 const doc={getElementById:k=>elements.get(k)||null,createElement:node};
 new Function("window","document","localStorage","Worker","setTimeout","clearTimeout",src.fin.replace("window.OCFinanceReport = {","window.__test = { render }; window.OCFinanceReport = {"))(window,doc,{getItem:()=>lang},Worker,()=>1,()=>{});
 const start=src.main.indexOf("  function periodoRapido() {"),end=src.main.indexOf("  function columnasParaTabulator",start);if(start<0||end<0)throw Error("extract quick controls");
 new Function("window","document","$","zonaNegocioDashboard","pintarTabla",src.main.slice(start,end)+";montarPeriodoRapido();")(window,doc,k=>elements.get(k),()=>"America/Guayaquil",()=>paint++);
 window.OCFinanceReport.update({cobertura:{ventas:true,gastos:true,ajustesComision:true,finanzasCoherentes:true}},"America/Guayaquil",false);
 const output=elements.get("finance-output"),status=elements.get("finance-status"),sel=elements.get("periodo-rapido"),from=elements.get("periodo-desde"),to=elements.get("periodo-hasta");
 const good={rows:[{name:null,result:Object.fromEntries(keys.map(k=>[k,100]))}]};
 if(kind==="from"||kind==="to"){sel.change("custom");from.change("2026-11-01");to.change("2026-11-20");}
 let q=window.__test.render();workers[0].onmessage({data:good});await q;if(!output.children.length)throw Error("setup");
 const before=paint;
 if(kind==="unchanged")return output.children.length>0;
 if(kind==="quick")sel.change("today");
 if(kind==="from")from.change("2026-11-02");
 if(kind==="to")to.change("2026-11-21");
 if(kind==="change back"){q=window.__test.render();sel.change("today");sel.change("");workers[1].onmessage({data:good});await q;return output.children.length===0&&paint===before+2;}
 if(kind==="pending"){window.OCFinanceReport.invalidate();sel.change("today");return output.children.length===0&&status.textContent.includes(lang==="es"?"Concilia":"Reconcile")&&paint===before+1;}
 const cleared=output.children.length===0&&status.textContent.includes(lang==="es"?"selección":"Selection")&&paint===before+1;
 q=window.__test.render();workers[1].onmessage({data:good});await q;return cleared&&output.children.length>0;
 }
 const out={};for(const [label,s] of [["prior",old],["candidate",next]]){new Function(s.fin);new Function(s.main);out[label]=[];for(const kind of ["quick","from","to","unchanged","change back","pending"])for(const lang of ["es","en"]){let pass=0;for(let i=0;i<20;i++)if(await test(s,lang,kind))pass++;out[label].push({kind,lang,pass,total:20});}}return out;
}
const fs=require('node:fs'),crypto=require('node:crypto');const f=fs.readFileSync(process.argv[2],'utf8'),m=fs.readFileSync(process.argv[3],'utf8');function blob(s){return crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex')}if(blob(f)!=='5b002b8b8c5f507cb1c78dff32f196de5238d73e'||blob(m)!=='c82edfe4a008182f20f69536d1a7000ef0b9410f')throw Error('wrong blobs');quickRun(f,m).then(r=>{console.log(JSON.stringify(r,null,2));if(r.candidate.some(x=>x.pass!==x.total))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});