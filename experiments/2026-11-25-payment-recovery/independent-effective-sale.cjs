'use strict';
// node independent-effective-sale.cjs <base cartera.js> <independent-payment-candidate.diff> [output-candidate.js]
const fs=require('node:fs');
function experiment(src,patch){
 function apply(s,p){const lines=s.split("\n"),out=[];let i=0;const rows=p.split("\n");for(let j=0;j<rows.length;j++){const m=rows[j].match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(!m)continue;const start=+m[1]-1;if(start<i)throw Error("overlap");out.push(...lines.slice(i,start));i=start;let old=0,added=0;while(j+1<rows.length&&/^[ +\-]/.test(rows[j+1])&&!rows[j+1].startsWith("--- ")&&!rows[j+1].startsWith("+++ ")){const row=rows[++j],v=row.slice(1);if(row[0]!="+"){if(lines[i++]!==v)throw Error("context "+i);old++;}if(row[0]!="-"){out.push(v);added++;}}if(old!==+(m[2]??1)||added!==+(m[4]??1))throw Error("counts");}out.push(...lines.slice(i));return out.join("\n");}
 const pre=apply(src,patch);
 const anchor="    var centavos = 0;\n    var movimientos = mios.map(function (h) {";
 const insertion=`    // Workshop: known direct sale receipts describe one full obligation, not partial charges.
    // Keep all immutable facts; collapse only matching stored values within a verified sale.
    var saleGroups = new Map(), saleAliases = new Map(), suppressed = new Set();
    mios.forEach(function(h){
      var d=_d(h), v=porId[String(d.ventaId||"")];
      if(h.tipo!==TIPOS.cargo||!v||String(v.clienteId||"")!==String(clienteId))return;
      var effective=_ventaEfectiva(v,restauradaDe,{});
      if(!effective||effective.anulada||effective.devuelta||!effective.info||effective.info.formaPago!=="fiado"||
        String(effective.clienteId||"")!==String(clienteId))return;
      var key=String(effective.id), g=saleGroups.get(key)||[];
      g.push(h);saleGroups.set(key,g);
    });
    saleGroups.forEach(function(g){
      if(g.length<2)return;
      var cents=_centavos(_d(g[0]).monto);
      if(cents<=0||g.some(function(h){return _centavos(_d(h).monto)!==cents;})){ambiguous++;return;}
      g.sort(function(a,b){return String(a.id).localeCompare(String(b.id));});
      var canonical="venta:"+String(_d(g[0]).ventaId);
      g.forEach(function(h,i){saleAliases.set("venta:"+String(_d(h).ventaId),canonical);if(i)suppressed.add(String(h.id));});
    });
    mios=mios.filter(function(h){return !suppressed.has(String(h.id));});
    todos=todos.map(function(h){
      var d=_d(h);
      if(h.tipo!==APLICACION||String(d.clienteId)!==String(clienteId))return h;
      function remap(k){return saleAliases.get(String(k))||k;}
      var copy=Object.assign({},d);
      if(Array.isArray(d.partes))copy.partes=d.partes.map(function(p){return Object.assign({},p,{cargoKey:remap(p.cargoKey)});});
      if(d.cargoKey)copy.cargoKey=remap(d.cargoKey);
      return Object.assign({},h,{datos:_anidado(h)?Object.assign({},h.datos,{payload:copy}):copy});
    });
`;
 if(pre.split(anchor).length!==2)throw Error("anchor");
 const candidate=pre.replace(anchor,insertion+anchor);
 const load=s=>{const w={};new Function("window",s)(w);return w.AMG.Cartera.calcularSaldo};
 const before=load(pre),after=load(candidate);
 const c="A",t=1790000001000, fact=(id,tipo,d,ts=t)=>({id,tipo,ts,datos:{clienteId:c,...d}});
 const sale=(id,extra={})=>({id,clienteId:c,precioUnit:108,cantidad:1,info:{formaPago:"fiado",fiadoAtomico:true},...extra});
 const charge=(id,ventaId,monto=108)=>fact(id,"cartera_cargo",{ventaId,monto,motivo:"venta",opId:"op-"+id});
 const pay=fact("p","cartera_abono",{monto:10,opId:"pay",motivo:"payment"});
 const alloc=(id,key,amount,ts)=>fact(id,"cartera_aplicacion",{abonoId:"p",accion:"aplicar",partes:[{cargoKey:key,monto:amount}],opId:id},ts);
 const undo=(id,key,ts)=>fact(id,"cartera_aplicacion",{abonoId:"p",accion:"desaplicar",cargoKey:key,monto:0},ts);
 const a=charge("a","old"),b=charge("b","old"),rest=charge("b","new"),vs=[sale("old")],restVs=[sale("old",{anulada:true}),sale("new",{restauracionDe:"old"})];
 const cases=[
 ["A05", [a,b],vs,-108,0,0],
 ["A05 payment", [a,b,pay,alloc("x","venta:old",10,t+1)],vs,-98,10,0],
 ["restored sale", [a,rest],restVs,-108,0,0],
 ["restored sale + new key", [a,rest,pay,alloc("x","venta:new",10,t+1)],restVs,-98,10,0],
 ["restored sale + undo old key", [a,rest,pay,alloc("x","venta:new",10,t+1),undo("y","venta:old",t+2)],restVs,-98,0,0],
 ["different sales", [a,rest], [sale("old"),sale("new")],-216,0,0],
 ["missing sale", [a,b],[],-216,0,0],
 ["different customer", [a,b],[sale("old",{clienteId:"B"})],-216,0,0],
 ["unequal historic amounts", [a,charge("b","old",100)],vs,-216,0,1],
 ["manual independent charges",[charge("a",undefined),charge("b",undefined)],[],-216,0,0],
 ["annulled no restore",[a,b],[sale("old",{anulada:true})],0,0,0],
 ["cash sale",[a,b],[sale("old",{info:{formaPago:"cash"}})],0,0,0],
 ["single receipt repriced",[a],[sale("old",{precioUnit:80})],-80,0,0],
 ["10/35 no sale",[charge("a",undefined,35),pay],[],-25,0,0]
 ];
 function inspect(calc,fs,vs){const x=calc(fs,c,vs);return {saldo:x.saldo,applied:Math.round(x.movimientos.filter(m=>m.tipo==="cargo").reduce((n,m)=>n+m.aplicado,0)*100)/100,conflict:x.conflictosIdentidadExperimental||0,allocationConflicts:x.conflictosAplicacion};}
 const rows=cases.map(([name,fs,vs,saldo,applied,conflict])=>{const snap=JSON.stringify([fs,vs]);const expected={saldo,applied,conflict,allocationConflicts:0},red=inspect(before,fs,vs),green=inspect(after,fs,vs),rev=inspect(after,fs.slice().reverse(),vs.slice().reverse());return {name,expected,red,green,pass:JSON.stringify(green)===JSON.stringify(expected)&&JSON.stringify(green)===JSON.stringify(rev)&&snap===JSON.stringify([fs,vs]),beforePass:JSON.stringify(red)===JSON.stringify(expected)}});
 let seed=12893;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};let pass=0,red=0;for(let i=0;i<1000;i++){const cents=1+rnd()%25000,v=sale("old",{precioUnit:cents/100}),fs=[charge("a","old",cents/100),charge("b","old",cents/100)];if(rnd()%2)fs.reverse();if(inspect(after,fs,[v]).saldo===-cents/100)pass++;if(inspect(before,fs,[v]).saldo!==-cents/100)red++;}
 return {rows,stress:{pass,red},candidate};
}
const r=experiment(fs.readFileSync(process.argv[2],'utf8'),fs.readFileSync(process.argv[3],'utf8')); if(process.argv[4])fs.writeFileSync(process.argv[4],r.candidate);console.log(JSON.stringify({rows:r.rows,stress:r.stress},null,2));if(r.rows.some(x=>!x.pass)||r.stress.pass!==1000||r.stress.red!==1000)process.exitCode=1;
