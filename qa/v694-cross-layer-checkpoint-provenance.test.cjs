'use strict';
// Isolated RED-first regression against immutable production v694 source.
// No remote network, room IDs, credentials, clients, money or Firebase writes.
const test=require('node:test').test;
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=process.env.F123_SOURCE_ROOT;
const sha=process.env.F123_EXPECTED_SHA;
assert.ok(root && /^[0-9a-f]{40}$/.test(sha||''),'explicit source root and exact SHA required');
assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),sha,
  'never test moving source or another tree');
const src=fs.readFileSync(path.join(root,'docs/sync-yjs.js'),'utf8');
const selector=fs.readFileSync(path.join(root,'docs/relay-selector.js'),'utf8');
const start=src.indexOf('    function hacerCkpt() {');
const end=src.indexOf('    function conectar() {',start);
assert.ok(start>=0 && end>start,'production checkpoint function is present');

async function probe(provedBy,activeLayer){
  const docBytes=new Uint8Array(128).fill(7);
  const fingerprint=Buffer.from(docBytes).toString('base64');
  const sent=[];
  const ctx=vm.createContext({
    window:{F123Relay:{ckptFrameBytes:786432}},
    _soloMemoria:false,
    canal:{ws:{readyState:1,peerOnly:false,relayLayer:activeLayer},recuperando:false},
    permiteCkpt:true,
    API:{clave:'synthetic-only',rollout:{outboxV2:false,gzipWrite:false}},
    _currentPullState:null,_appliedPullCursor:{rev:1,seq:200},
    partesEntrantes:{},doc:{store:{}},
    Y:{encodeStateAsUpdate:()=>docBytes},
    _outbox:{pending:[],checkpoint:fingerprint,checkpointLayer:provedBy,confirmed:[]},
    _unsaved:[],
    MAX_CKPT_RPC_BYTES:256*1024,MAX_CKPT_CIPHER_BYTES:768*1024,
    _b64:b=>Buffer.from(b).toString('base64'),
    _frame:()=>new Uint8Array(1),
    cifrarBin:async()=>new Uint8Array(200).buffer,
    _compactarYjsSinCambiarCausalidad:()=>null,
    guardarSobre:e=>sent.push(e),
    diagnosticarCkpt(){},nombre:'catalogo',log(){}
  });
  vm.runInContext(src.slice(start,end),ctx);
  vm.runInContext('hacerCkpt()',ctx);
  await new Promise(r=>setImmediate(r));
  await new Promise(r=>setImmediate(r));
  return sent;
}

test('P0 cross-provider ACK: Supabase proof must NOT suppress identical Firebase checkpoint',async()=>{
 const a=await probe('f123_relay_cupo_v1','f123_relay_cupo_fb_v1');
 assert.equal(a.length,1,'Supabase stored a snapshot, but Firebase has no matching durable ACK');
 assert.equal(a[0].k,'ckpt');
});

test('P0 inherited unscoped checkpoint proof must not suppress Firebase checkpoint',async()=>{
 const a=await probe('', 'f123_relay_cupo_fb_v1');
 assert.equal(a.length,1,'legacy fingerprint has no provider proof; Firebase still needs a CKPT');
});

test('P0 same-layer durable proof must suppress redundant unchanged Firebase checkpoint',async()=>{
 const a=await probe('f123_relay_cupo_fb_v1','f123_relay_cupo_fb_v1');
 assert.equal(a.length,0,'avoid duplicate checkpoint writes within the same provider');
});

test('P0 relay selector binds checkpoint ACK to its originating durable adapter',()=>{
 assert.match(selector,/persistLayer/,
  'an ACK cannot be safely marked as Firebase when it originated on Supabase');
});
