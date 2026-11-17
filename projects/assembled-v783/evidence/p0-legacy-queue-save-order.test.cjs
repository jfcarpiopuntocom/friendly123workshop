'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../app/docs/avanzado-extra.js'),'utf8');
const start=src.indexOf('  const OCSync = (function () {');
const end=src.indexOf('\n\n  function init() {',start);
assert.ok(start>=0&&end>start,'real sync closure anchors');
const closure=src.slice(start,end)+'\nwindow.__testSync=OCSync;';

test('overlapping encrypted saves retain both completed requests',async()=>{
  const items=new Map(),encryptions=[],stored=[];
  const localStorage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)};
  const window={fetch:async()=>({ok:true}),addEventListener(){},dispatchEvent(){},
    OCSecure:{activarSync:async()=>true,syncActiva:()=>true,
      cifrarSync:txt=>new Promise(resolve=>encryptions.push({txt,resolve})),descifrarSync:async s=>s},
    OCOutbox:{leer:async()=>null,guardar:async blob=>{stored.push(blob);return true;}}};
  const context={window,localStorage,API:'/api',setInterval:()=>1,clearInterval(){},console,CustomEvent:function(){},Date,Math,JSON,Set};
  vm.runInNewContext(closure,context,{filename:'real-avanzado-extra-sync'});
  assert.equal(await window.__testSync.activar('synthetic'),true);
  const a=window.fetch('/api/sale-a',{method:'POST',body:'A'});
  const b=window.fetch('/api/sale-b',{method:'POST',body:'B'});
  for(let i=0;i<20&&encryptions.length<2;i++) await Promise.resolve();
  assert.ok(encryptions.length>=1,'first encryption started');
  if(encryptions.length===2){
    encryptions[1].resolve(encryptions[1].txt);await b;
    encryptions[0].resolve(encryptions[0].txt);await a;
  } else {
    encryptions[0].resolve(encryptions[0].txt);await a;
    for(let i=0;i<20&&encryptions.length<2;i++) await Promise.resolve();
    assert.equal(encryptions.length,2,'second encryption starts after first finishes');
    encryptions[1].resolve(encryptions[1].txt);await b;
  }
  assert.equal(JSON.parse(stored.at(-1)).length,2,'last durable snapshot retains both operations');
});

test('an encryption failure does not permanently block later pending operations',async()=>{
  const items=new Map(),stored=[];let calls=0;
  const localStorage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)};
  const window={fetch:async()=>({ok:true}),addEventListener(){},dispatchEvent(){},
    OCSecure:{activarSync:async()=>true,syncActiva:()=>true,
      cifrarSync:async txt=>{if(++calls===1)throw Error('synthetic encryption failure');return txt;},descifrarSync:async s=>s},
    OCOutbox:{leer:async()=>null,guardar:async blob=>{stored.push(blob);return true;}}};
  const context={window,localStorage,API:'/api',setInterval:()=>1,clearInterval(){},console,CustomEvent:function(){},Date,Math,JSON,Set};
  vm.runInNewContext(closure,context,{filename:'real-avanzado-extra-sync'});
  await window.__testSync.activar('synthetic');
  await window.fetch('/api/sale-a',{method:'POST'});
  await window.fetch('/api/sale-b',{method:'POST'});
  assert.equal(calls,2);
  assert.equal(JSON.parse(stored.at(-1)).length,2);
});
