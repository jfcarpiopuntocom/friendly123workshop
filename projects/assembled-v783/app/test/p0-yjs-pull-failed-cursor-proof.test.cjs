'use strict';
// Real ws.onmessage block from assembled sync-yjs.js; network-free VM.
// Explicitly exercises the durability result returned by guardarPullCursor.
// The established pull-cursor-durable-ack test verifies that the real
// guardarPullCursor returns false after IDB journal failure/readback mismatch.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../docs/sync-yjs.js'),'utf8');
const start=src.indexOf('      ws.onmessage = function (ev) {',src.indexOf('function crearCanal('));
const end=src.indexOf('      _directReceive = function (buf) {',start);
assert.ok(start>0 && end>start,'actual production-shape pull-page handler boundaries exist');
const handler=src.slice(start,end);

async function frame({proof=false,more=true,source='pull-page'}={}) {
  const sent=[],closed=[],logs=[];
  let pages=0;
  const ws={
    readyState:1, relayLayer:'f123_relay_cupo_fb_v1',
    send(data){sent.push(data);},
    close(code,reason){closed.push({code,reason});this.readyState=3;},
  };
  const applied={rev:0,seq:4};
  const ctx={
    ws,canal:{ws,recuperando:true,headAcceso:false},API:{clave:{},_store:null},
    _colaRecepcion:Promise.resolve(),
    _pullCursor:{...applied},_appliedPullCursor:{...applied},
    pullEstado:{enCurso:true,fallos:0,pullAplicado:false,renovarCkpt:false,rescateCausalDesde:null},
    nombre:'catalogo',_soloMemoria:false,partesEntrantes:Object.create(null),
    guardarPullCursor:async c=>{
      // This is the actual guardarPullCursor order: RAM pointer advances
      // before the IndexedDB transaction barrier and readback.
      ctx._pullCursor={rev:c.rev,seq:c.seq};
      if(proof===true)ctx._appliedPullCursor={rev:c.rev,seq:c.seq};
      return proof==='deferred'?undefined:proof;
    },
    pedirPagina:()=>{pages++;return Promise.resolve();},
    log:(...s)=>logs.push(s),
    programarRelectura:()=>{},
    // No data, keys, browser, relay, PIN nor credential calls.
    JSON,Promise,Number,Math,Object,Array,Map,Uint8Array,Date,
  };
  vm.createContext(ctx);
  vm.runInContext(handler,ctx,{filename:'real-sync-yjs-pull-handler.js',timeout:3000});
  ws.onmessage({data:JSON.stringify({k:source,rev:0,seq:12,more,n:8})});
  await ctx._colaRecepcion;
  return {ctx,ws,sent,closed,logs,pages};
}
test('RED P0: failed durable cursor proof must not paginate, mark pull applied, or retain unproven RAM cut',async()=>{
  const x=await frame({proof:false});
  assert.equal(x.pages,0,'do not skip history by requesting a page from an unproven cursor');
  assert.equal(x.ctx.pullEstado.pullAplicado,false,'do not certify ciphertext replay without IndexedDB readback');
  assert.equal(x.ctx.pullEstado.enCurso,false,'stop this pull, retry on reconnect');
  assert.equal(x.ctx._pullCursor.seq,4,'RAM cursor resets to last confirmed journal proof');
  assert.equal(x.ctx._appliedPullCursor.seq,4,'verified IDB cursor remains unchanged');
  assert.deepEqual(x.closed.map(v=>v.code),[1013],'reconnect safely without losing encrypted history');
});
test('RED P0: deferred pending Yjs or RAM-only cursor can keep reading but must not claim durable proof',async()=>{
  const x=await frame({proof:'deferred'});
  assert.equal(x.pages,1,'a pending proof may keep collecting encrypted pages in memory');
  assert.equal(x.closed.length,0,'do not break valid pending fragment/parent replay');
  assert.equal(x.ctx.pullEstado.pullAplicado,false,'deferred storage is never a durable page ACK');
});
test('control: verified cursor write plus readback still paginates and marks applied',async()=>{
  const x=await frame({proof:true});
  assert.equal(x.pages,1);
  assert.equal(x.closed.length,0);
  assert.equal(x.ctx.pullEstado.pullAplicado,true);
  assert.equal(x.ctx._appliedPullCursor.seq,12);
});
