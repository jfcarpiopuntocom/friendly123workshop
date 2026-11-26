function candidate(source) {
  // Experimental projection only: input ledger is immutable. One license per input.
  function replaceOnce(a,b) {
    if(source.split(a).length!==2) throw Error("source anchor mismatch: "+a);
    source=source.replace(a,b);
  }
  replaceOnce('function calcularSaldo(todos, clienteId, ventas) {', 'function calcularSaldo(todos, clienteId, ventas) {\n    var aliases = Object.create(null), ids = Object.create(null), ops = Object.create(null);\n    var sorted = todos.slice().sort(function(a,b){return String(a.id)<String(b.id)?-1:String(a.id)>String(b.id)?1:0;});\n    var filtered = sorted.filter(function(h){\n      if(h.tipo!==TIPOS.cargo && h.tipo!==TIPOS.abono) return true;\n      var d=_d(h), op=String(d.opId||""); if(!op) return true;\n      var key=JSON.stringify([h.tipo,String(d.clienteId),Number(d.monto),String(d.motivo||""),String(d.ventaId||"")]);\n      var prior=ops[op];\n      if(!prior){ops[op]={id:String(h.id),key:key};return true;}\n      if(prior.key!==key){var e=new Error("conflicting financial opId");e.status=409;throw e;}\n      aliases[String(h.id)]=prior.id;return false;\n    });\n    // Explicit IDs bypass the legacy time-window heuristic. Never delete ledger facts.\n    todos=filtered.map(function(h){\n      if(h.tipo!==APLICACION) return h;\n      var d=_d(h), ab=aliases[String(d.abonoId)]; if(!ab)return h;\n      var nd=Object.assign({},d,{abonoId:ab});\n      return Object.assign({},h,{datos:_anidado(h)?Object.assign({},h.datos,{payload:nd}):nd});\n    });');
  replaceOnce('var mios = _sinDuplicados(todos.filter(function (h) {','var todosMios = todos.filter(function (h) {');
  replaceOnce('    }), "clienteId");\n    var vinculos', '    });\n    var mios = todosMios.filter(function(h){return !!_d(h).opId;}).concat(_sinDuplicados(todosMios.filter(function(h){return !_d(h).opId;}),"clienteId"));\n    var vinculos');
  // A05 deliberately narrow: verified current sale, same client, direct full-charge receipt.
  replaceOnce('    var centavos = 0;\n    var movimientos = mios.map', '    var fullSale = Object.create(null);\n    mios = mios.filter(function(h){\n      var d=_d(h);if(h.tipo!==TIPOS.cargo||!d.ventaId||!ventas)return true;\n      var v=porId[d.ventaId]; if(!v || String(v.clienteId||"")!==String(clienteId) || v.anulada || v.devuelta || _centavosVenta(v)<=0 || _centavos(d.monto)!==_centavosVenta(v))return true;\n      var k=String(v.id); if(fullSale[k])return false; fullSale[k]=true;return true;\n    });\n    var centavos = 0;\n    var movimientos = mios.map');
  return source;
}
function run(source,candidate) {
  function load(s){const w={};new Function("window",s)(w);return w.AMG.Cartera.calcularSaldo;}
  const h=(id,t,m,op,nested=false,extra={})=>({id,tipo:"cartera_"+t,ts:1000,datos:nested?{payload:{clienteId:"C",monto:m,motivo:"x",opId:op,...extra}}:{clienteId:"C",monto:m,motivo:"x",opId:op,...extra}});
  const c=h("c","cargo",35,"c"), p=h("p1","abono",10,"p"), dup=h("p2","abono",10,"p");
  const app={id:"a",tipo:"cartera_aplicacion",ts:2000,datos:{clienteId:"C",abonoId:"p2",cargoKey:"cargo:c",monto:10,accion:"aplicar",opId:"a"}};
  const sale={id:"v",clienteId:"C",precioUnit:108,cantidad:1,info:{formaPago:"fiado",fiadoAtomico:true}};
  const cases=[
    ["A02",[c,p,dup],[],-25],["A04",[c,p,h("p2","abono",10,"q",true)],[],-15],
    ["A05",[h("c1","cargo",108,"a",false,{ventaId:"v"}),h("c2","cargo",108,"b",false,{ventaId:"v"})],[sale],-108],
    ["alias",[c,p,dup,app],[],-25,10],["10/35",[c,p,{...app,datos:{...app.datos,abonoId:"p1"}}],[],-25,10],
    ["legacy pair",[c,h("p1","abono",10,undefined),h("p2","abono",10,undefined,true)],[],-25],
    ["distinct flat",[c,p,h("p2","abono",10,"q")],[],-15],
    ["conflicting opId",[c,p,h("p2","abono",11,"p")],[],"409"],
    ["cross client opId",[c,p,h("p2","abono",10,"p",false,{clienteId:"D"})],[],"409"],
    ["no sale projection",[h("c1","cargo",108,"a",false,{ventaId:"v"}),h("c2","cargo",108,"b",false,{ventaId:"v"})],[],-216],
    ["distinct manual charges",[h("c1","cargo",108,"a"),h("c2","cargo",108,"b")],[],-216]
  ];
  const result={};
  for(const [label,fn] of [["original",load(source)],["candidate",load(candidate(source))]]){
    result[label]=cases.map(([name,hs,vs,expected,applied])=>{
      let pass=0,observed;for(let i=0;i<20;i++){
        const input=i%2?hs.slice().reverse():hs;const before=JSON.stringify(input);
        try {const r=fn(input,"C",vs);observed=r.saldo;
          if(r.saldo===expected && (applied===undefined || (r.movimientos.find(m=>m.tipo==="cargo").aplicado===applied && r.conflictosAplicacion===0)))pass++;
        }catch(e){observed=String(e.status||e.message);if(observed===expected)pass++}
        if(JSON.stringify(input)!==before)throw Error("mutated ledger");
      }return {name,pass,total:20,expected,observed};
    });
  }return result;
}
const fs=require('node:fs'); const crypto=require('node:crypto'); const source=fs.readFileSync(process.argv[2],'utf8'); const blob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex'); if(blob!=='49353f93f067d8efdd4484ecd689ebf628980ae5')throw Error('unexpected source blob '+blob); const results=run(source,candidate); console.log(JSON.stringify(results,null,2)); if(results.candidate.some(x=>x.pass!==x.total))process.exitCode=1;
