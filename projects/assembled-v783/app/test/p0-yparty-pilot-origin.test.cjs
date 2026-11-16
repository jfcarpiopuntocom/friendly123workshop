'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../docs/sync-yjs.js'),'utf8').replace(/\r\n/g,'\n');

function fixture(piloto, proveedor=null) {
  const calls=[];
  const channels=[
    ['catalogo','doc','canal','bc'],
    ['operaciones','opsDoc','opsCanal','opsBc']
  ];
  const listeners={};
  const API={};
  for(const [name,doc,channel,bc] of channels){
    API[doc]={on:(event,fn)=>{assert.equal(event,'update');listeners[name]=fn;}};
    API[channel]={proveedor,enviarUpdate:()=>calls.push(name+':enviar')};
    API[bc]={postMessage:()=>calls.push(name+':otra-pestana')};
    const start=source.indexOf('    API.'+doc+'.on("update", function (update, origin) {');
    const end=source.indexOf('\n    });',start);
    assert.ok(start>=0&&end>start);
    vm.runInNewContext(source.slice(start,end+7),{API,piloto,pedirProcesarEventos:()=>calls.push('operaciones:aplicar')});
  }
  return {calls, listeners};
}
test('the default relay still sends locally created operations with Yjs origin null',()=>{
  const {calls,listeners}=fixture(null);
  for(const handle of Object.values(listeners))handle(new Uint8Array([1]),null);
  assert.deepEqual(calls,['catalogo:otra-pestana','catalogo:enviar','operaciones:otra-pestana','operaciones:enviar']);
});
test('a disconnected provider cannot turn a local update into a remote update',()=>{
  const {calls,listeners}=fixture({});
  listeners.operaciones(new Uint8Array([1]),null);
  assert.deepEqual(calls,['operaciones:otra-pestana','operaciones:enviar']);
});
test('an incoming update from the real provider is shared across tabs without echo',()=>{
  const provider={};
  const {calls,listeners}=fixture({},provider);
  for(const handle of Object.values(listeners))handle(new Uint8Array([1]),provider);
  assert.deepEqual(calls,['catalogo:otra-pestana','operaciones:otra-pestana','operaciones:aplicar']);
});


test('a failed pilot import leaves the existing relay available to the boot sequence', async () => {
  const start = source.indexOf('    var Y = window.Y;', source.indexOf('  async function arrancarInicial()'));
  const end = source.indexOf('    API.doc = new Y.Doc();', start);
  assert.ok(start >= 0 && end > start);
  const boot = vm.runInNewContext('(async () => {\n' + source.slice(start,end) + '\nreturn piloto;\n})', {
    window: {Y: {}},
    codigo: 'synthetic-only',
    cargarPiloto: async () => { throw Error('synthetic missing script'); },
    log() {}
  });
  assert.equal(await boot(), null);
});

test('a stalled pilot script releases startup and its late load cannot select the provider', async () => {
  const start = source.indexOf('  async function cargarPiloto(');
  const end = source.indexOf('\n  // Fase 1:', start);
  assert.ok(start >= 0 && end > start);
  let expire, removed = false, factoryCalls = 0;
  const script = {remove() { removed = true; }};
  let appended;
  const scriptAppended = new Promise(resolve => { appended = resolve; });
  const load = vm.runInNewContext(source.slice(start, end) + '\ncargarPiloto;', {
    TextEncoder,
    crypto: {subtle: {digest: async () => new ArrayBuffer(32)}},
    localStorage: {getItem: key => key === 'f123_yparty_qa' ? '1' : '0'.repeat(32)},
    window: {F123YPartyPilot() { factoryCalls++; }},
    document: {createElement: () => script, head: {appendChild: appended}},
    setTimeout: callback => { expire = callback; return 1; },
    clearTimeout() {}
  });
  const pending = load('synthetic-only');
  await scriptAppended;
  assert.equal(typeof expire, 'function');
  expire();
  await assert.rejects(pending, /plazo/);
  assert.equal(removed, true);
  script.onload?.();
  assert.equal(factoryCalls, 0);
});

test('the pilot groups small catalog writes and preserves the separate path during recovery or for large records', () => {
  const start=source.indexOf('  function loteAnexosPiloto(');
  const end=source.indexOf('\n  function sembrarFinanzas(',start);
  assert.ok(start>=0&&end>start);
  const canal={proveedor:{},recuperando:false};
  const mapa=new Map();
  const prepare=vm.runInNewContext(source.slice(start,end)+'\nloteAnexosPiloto;',{
    API:{canal},
    sembrarAnexos: (rows,write) => rows.forEach(({id,valor})=>write(mapa,id,valor))
  });
  const venta={opId:'sale-synthetic',precioUnit:15};
  const group=prepare([{id:'recibo',valor:venta},{id:'actividad',valor:{clase:'evento'}}]);
  assert.equal(group.length,2);
  assert.equal(group[0][0],mapa);
  assert.equal(group[0][2],venta);
  assert.equal(mapa.size,0,'Preparing a catalog lot does not write anything');
  assert.equal(prepare([{id:'historial',valor:{texto:'abc'.repeat(33000)}}]),null);
  canal.recuperando=true;
  assert.equal(prepare([{id:'recibo',valor:venta}]),null);
  canal.recuperando=false;
  canal.proveedor=null;
  assert.equal(prepare([{id:'recibo',valor:venta}]),null);
});
