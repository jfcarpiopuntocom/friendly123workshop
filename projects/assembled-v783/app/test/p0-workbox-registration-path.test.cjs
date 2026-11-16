'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(process.env.WORKBOX_SOURCE||path.join(__dirname,'../src/app/app-inline-03.js'),'utf8');
async function run(component,flag='1'){
  const calls=[];let load;
  const navigator={serviceWorker:{register:async()=>{calls.push('legacy');return{update:async()=>calls.push('update')};}}};
  const window={addEventListener:(_,f)=>{load=f;},F123WorkboxImported:component&&(async()=>{calls.push('imported');if(component==='reject')throw Error('synthetic');})};
  vm.runInNewContext(source.slice(0,source.indexOf('  /* MEJORA #3'))+'\n}',{window,navigator,localStorage:{getItem:()=>flag},Promise});
  load();await new Promise(r=>setImmediate(r));return calls;
}
test('QA registration uses the imported component without a second writer',async()=>{
  assert.deepEqual(await run('ok'),['imported']);
});
test('component failure returns to the existing registration path once',async()=>{
  assert.deepEqual(await run('reject'),['imported','legacy','update']);
});
test('default and missing component retain the existing path',async()=>{
  assert.deepEqual(await run('ok','0'),['legacy','update']);
  assert.deepEqual(await run(null),['legacy','update']);
});
