'use strict';
// P0 Gate C post-PIN: execute real extracted source, not a reimplemented algorithm.
// Synthetic Owner+license, no real PIN, customer photo or network access.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../docs/sync-yjs.js'),'utf8');
const LICENSE='F123-SYNTHPHOTO1234',INSTANCE='test-device-0001';
const assign=source.match(/^    API\.fotoSha = .*;$/m);
assert.ok(assign,'real API.fotoSha assignment must remain source-locatable');
const first=source.indexOf('  function crearPuenteFotoPerecedero('),last=source.indexOf('  async function arrancarInicial()',first);
const realHelper=first>=0&&last>first?source.slice(first,last):'';

function setup({noPilot=false}={}){
 const state={role:null,pin:null,owned:{licenseCode:LICENSE,instanceId:INSTANCE},calls:0,puts:0,gets:0,putBody:null,getBody:null};
 const win={OCAuth:{rolActual:()=>state.role},OCSecure:{leerPinQueAbre:()=>({owner:state.pin})}};
 const localStorage={getItem:k=>k==='f123_owned'?JSON.stringify(state.owned):null};
 const pilot=noPilot?null:{fotoSha(){
  state.calls++;
  if(state.role!=='dueno'||state.pin!=='123'||state.owned.licenseCode!==LICENSE||state.owned.instanceId!==INSTANCE)return null;
  return {
   put:async(...args)=>{state.puts++;return typeof state.putBody==='function'?state.putBody(...args):{sha:args[0],bytes:11,tipo:'image/png'};},
   get:async(...args)=>{state.gets++;return typeof state.getBody==='function'?state.getBody(...args):'data:image/png;base64,AA==';}
  };
 }};
 const ctx={window:win,localStorage,API:{},piloto:pilot,codigo:LICENSE,JSON,Promise,Object,Error,String};
 vm.createContext(ctx);
 vm.runInContext(realHelper+'\n'+assign[0],ctx,{timeout:1000});
 return {state,ctx};
}

test('RED cold PIN: stable SHA adapter exists without asking issuer, then acquires current Owner on put and get',async()=>{
 const {state,ctx}=setup();
 const adapter=ctx.API.fotoSha;
 assert.ok(adapter&&typeof adapter.put==='function'&&typeof adapter.get==='function'&&typeof adapter.disponible==='function');
 assert.equal(state.calls,0,'no eager PIN/token/remote access before login');
 assert.equal(adapter.disponible(),false);
 await assert.rejects(()=>adapter.put('sha','data'),/owner|session|unavailable/i);
 assert.equal(state.puts,0);
 state.role='dueno';state.pin='123';
 assert.equal(ctx.API.fotoSha,adapter,'stable identity is mandatory for photo ACK fences');
 assert.equal(adapter.disponible(),true);
 const result=await adapter.put('abcdef','data:image/png;base64,AA==');
 assert.equal(result.sha,'abcdef');assert.equal(state.puts,1);
 assert.equal(await adapter.get('abcdef'),'data:image/png;base64,AA==');
 assert.equal(state.gets,1);
});
test('late logout or license/device switch rejects in-flight HTTP ACK instead of publishing reference',async()=>{
 const {state,ctx}=setup();state.role='dueno';state.pin='123';
 let finish;state.putBody=()=>new Promise(resolve=>finish=resolve);
 const pending=ctx.API.fotoSha.put('sha','bytes');
 assert.equal(typeof finish,'function');
 state.role='empleado';
 finish({sha:'sha',bytes:4,tipo:'image/png'});
 await assert.rejects(pending,/session|owner|changed|unavailable/i);
 assert.equal(ctx.API.fotoSha.disponible(),false);
 state.role='dueno';
 state.owned={licenseCode:'F123-SYNTHOTHER999',instanceId:INSTANCE};
 await assert.rejects(()=>ctx.API.fotoSha.get('sha'),/session|owner|unavailable/i);
});
test('PIN change mid-GET cannot pass same-shop readback checks',async()=>{
 const {state,ctx}=setup();state.role='dueno';state.pin='123';
 let finish;state.getBody=()=>new Promise(resolve=>finish=resolve);
 const pending=ctx.API.fotoSha.get('sha');
 state.pin='456';
 finish('data:image/png;base64,AA==');
 await assert.rejects(pending,/session|owner|changed|unavailable/i);
});
test('legacy/off pilot remains null and never enters new HTTP mode',()=>{
 const {ctx}=setup({noPilot:true});
 assert.equal(ctx.API.fotoSha,null);
});
test('reseed after actual oc-login Owner, not on staff; destroy removes old handler',()=>{
 const start=source.indexOf('  function resembrarFotoTrasLogin(');
 const end=source.indexOf('  API.fotosDoc.once("destroy", resembrarFotoTrasLoginCancelar);',start);
 assert.ok(start>0&&end>start,'exact production oc-login handler and cleanup required');
 // Registration belongs to an initialized photo document, not top-level
 // script evaluation, which happens before arrancarInicial creates fotosDoc.
 const body=source.slice(start,end+'  API.fotosDoc.once("destroy", resembrarFotoTrasLoginCancelar);'.length)+'\n  }';
 const callbacks={};let seeds=0;
 const ctx={window:{addEventListener:(ev,fn)=>callbacks[ev]=fn,removeEventListener:(ev,fn)=>{if(callbacks[ev]===fn)delete callbacks[ev];}},API:{fotoSha:{disponible:()=>true},fotosDoc:null},sembrarFotosAlRelay:()=>seeds++};
 vm.createContext(ctx);vm.runInContext(body,ctx,{timeout:1000});
 vm.runInContext('registrarResiembraFotoTrasLogin()',ctx);
 assert.equal(callbacks['oc-login'],undefined,'not before the photo Y.Doc exists');
 ctx.API.fotosDoc={once:(ev,fn)=>callbacks.destroy=fn};
 vm.runInContext('registrarResiembraFotoTrasLogin()',ctx);
 assert.equal(typeof callbacks['oc-login'],'function');
 callbacks['oc-login']({detail:{rol:'empleado'}});assert.equal(seeds,0);
 callbacks['oc-login']({detail:{rol:'dueno'}});assert.equal(seeds,1);
 callbacks.destroy();assert.equal(callbacks['oc-login'],undefined);
});
test('internal IDB seeder uses original local read, never the UI remote read-through',async()=>{
 const a=source.indexOf('          if (!dataUrl && lecturasIDBBloqueadas < 2 && fotos && typeof fotos.leerPorHash === "function")');
 const b=source.indexOf('          if (!dataUrl) dataUrl = (API.fotosMap',a);
 assert.ok(a>0&&b>a,'source seed IDB read block must be real');
 const snippet=source.slice(a,b);
 let remote=0,local=0;
 const ctx={dataUrl:null,lecturasIDBBloqueadas:0,fotos:{__f123PhotoReadOriginal:async()=>{local++;return'local-photo'},leerPorHash:async()=>{remote++;return'remote-photo'}},hash:'sha',_esperarFoto:p=>p};
 vm.createContext(ctx);
 const value=await vm.runInContext('(async()=>{'+snippet+'return dataUrl;})()',ctx,{timeout:1000});
 assert.equal(value,'local-photo');assert.equal(local,1);assert.equal(remote,0);
});
test('UI photo GET does not burn remote quota before Owner is actually available',()=>{
 const a=source.indexOf('      fotosShaStore.leerPorHash = async function (hash) {');
 const b=source.indexOf('    if (API.fotosRefs?.observe)',a);
 assert.ok(a>0&&b>a);
 const section=source.slice(a,b);
 const guard=section.indexOf('bridge.disponible()');
 const budget=section.indexOf('lecturasRemotas++');
 assert.ok(guard>=0&&budget>guard,'must reject no-Owner requests before remote quota is incremented');
});
