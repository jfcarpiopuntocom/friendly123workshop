'use strict';
// Behavioral RED-first test: extracts the real hybrid transition controller
// from sync-yjs.js. No production network, no money or PIN secrets.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../docs/sync-yjs.js'),'utf8');
const controlStart=source.indexOf('    var canalesPiloto, canalesRespaldo, timerRetorno');
const controlEnd=source.indexOf('    API.doc.on("update",',controlStart);
const opsStart=source.indexOf('    API.opsCanal =',controlEnd);
const opsEnd=source.indexOf('    API.opsDoc.on("update",',opsStart);
assert.ok(controlStart>0&&controlEnd>controlStart&&opsStart>controlEnd&&opsEnd>opsStart,
 'must execute actual runtime transport selection, not a copied algorithm');
const code=source.slice(controlStart,controlEnd)+'\n'+source.slice(opsStart,opsEnd)+
 '\nthis.controls={volverAlPiloto,usarRelayHabitual};';
function make(){
 const events=[], pilotChannels=[], legacyChannels=[];
 const makeChannel=(name,type)=>({name,type,recuperando:false,
   proveedor:type==='pilot'?{}:null,ws:{readyState:1,peerOnly:false},
   conectar(){events.push(name+':connect');},
   reanudar(){events.push(name+':resume');},
   pausar(){events.push(name+':pause');},
   certificar(){return Promise.resolve(()=>true);},
   diagnosticoOutboxLectura(){return{total:0,sinGuardar:0};},
   enviarUpdate(){events.push(name+':send');}
 });
 const piloto={canal(doc,tipo,idb,aplicar,fallback){
   const x=makeChannel('pilot-'+tipo,'pilot');x.fallback=fallback;pilotChannels.push(x);return x;
 }};
 const API={doc:{},opsDoc:{},idb:{synced:true},opsIdb:{synced:true},_store:{aplicar(){}}};
 const ctx={API,piloto,Y:{},document:{hidden:false},Math,Promise,
    setTimeout(){return 1;},clearTimeout(){},log(){},
    crearCanal(_Y,doc,suffix,nombre){
      const c=makeChannel('legacy-'+nombre,'legacy');legacyChannels.push(c);return c;
    },pedirProcesarEventos(){}
 };
 vm.runInNewContext(code,ctx,{filename:'sync-yjs-hybrid-controller.js'});
 return{API,events,pilotChannels,legacyChannels,controls:ctx.controls};
}
test('Option A: after boot, catalog is 2.0 while sales ops use ONLY old encrypted relay',()=>{
 const f=make();
 assert.deepEqual(f.pilotChannels.map(x=>x.name),['pilot-cat'],
  'ops cannot be sent to 2.0 read-only Yjs room');
 assert.equal(f.API.canal,f.pilotChannels[0]);
 assert.equal(f.API.opsCanal,f.legacyChannels.find(x=>x.name==='legacy-ops'));
 f.API.opsCanal.enviarUpdate(new Uint8Array([1]));
 assert.deepEqual(f.events,['legacy-ops:send']);
});
test('Option A: falling catalog back and returning to 2.0 never pauses, replaces, or loses sales channel',async()=>{
 const f=make(),ops=f.API.opsCanal,cat=f.API.canal;
 cat.fallback();
 assert.notEqual(f.API.canal,cat,'catalog switches to old relay on auth problem');
 assert.equal(f.API.opsCanal,ops,'sale channel must not be recreated on catalog fallback');
 assert.equal(f.events.includes('legacy-ops:pause'),false);
 await f.controls.volverAlPiloto();
 assert.equal(f.API.canal,cat,'catalog can switch back to 2.0 after proof');
 assert.equal(f.API.opsCanal,ops,'money stays on old transport after catalog recovers');
 assert.equal(f.events.includes('legacy-ops:pause'),false,'never interrupt money transport during catalog rejoin');
 ops.enviarUpdate(new Uint8Array([2]));
 assert.equal(f.events.filter(x=>x==='legacy-ops:send').length,1);
});
