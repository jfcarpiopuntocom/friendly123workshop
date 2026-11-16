'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {browser}=require('./helpers/browser.cjs');
function setup(){const w=browser();w.OCAuth={rolActual:()=> 'dueno'};w.OCTienda={licenciaActual:()=> 'F123-SYNTHETIC-TEAM'};w.localStorage.setItem('f123_team_authority_qa','1');w.localStorage.setItem('f123_owned',JSON.stringify({licenseCode:'F123-SYNTHETIC-TEAM',instanceId:'synthetic-instance'}));vm.runInContext(fs.readFileSync(path.join(__dirname,'../docs/team-authority-client.js'),'utf8'),w);return w;}
test('durable Team save retains its retry intent but the shared catalog excludes it',async()=>{const w=setup();assert.equal(typeof w.OCSync.leerIntencionesAutoridad,'function');const member=await w.request('/api/usuarios','POST',{nombre:'Synthetic',pin:'234',rol:'admin'});const pending=w.OCSync.leerIntencionesAutoridad();assert.equal(pending.length,1);assert.equal(pending[0].id,member.id);assert.ok(pending[0]._teamAuthorityIntent.opId);assert.equal(JSON.stringify(w.OCSync.catalogoPropio()).includes('_teamAuthorityIntent'),false);});
test('ack for a different operation never clears the durable local intent',async()=>{const w=setup();const member=await w.request('/api/usuarios','POST',{nombre:'Synthetic',pin:'234',rol:'empleado'});assert.equal(typeof w.OCSync.confirmarAutoridad,'function');assert.equal(await w.OCSync.confirmarAutoridad(member.id,'wrong-operation',0,1),false);assert.equal(w.OCSync.leerIntencionesAutoridad().length,1);});
test('ack advances the CAS of the same local batch without rebasing another device',async()=>{const w=setup();await w.request('/api/usuarios','POST',{nombre:'One',pin:'234',rol:'empleado'});await w.request('/api/usuarios','POST',{nombre:'Two',pin:'345',rol:'empleado'});const pending=w.OCSync.leerIntencionesAutoridad();assert.equal(pending.length,2);const first=pending[0];assert.equal(await w.OCSync.confirmarAutoridad(first.id,first._teamAuthorityIntent.opId,0,1,sourceOf(first)),true);assert.equal(w.OCSync.leerIntencionesAutoridad()[0]._teamAuthorityIntent.expectedRevision,1);});

function sourceOf(u){return {sourceRevision:JSON.stringify(u.rev),role:u.rol,active:!u.borrado&&u.activo!==false,pin:u.pin};}
test('delayed ACK retains the intent after a higher revision remote credential change',async()=>{
 const w=setup();const member=await w.request('/api/usuarios','POST',{nombre:'Synthetic',pin:'234',rol:'empleado'});
 const original=w.OCSync.leerIntencionesAutoridad()[0],source=sourceOf(original),catalog=w.OCSync.catalogoPropio();
 const remote=catalog.usuarios.find(u=>u.id===member.id);remote.rol='admin';remote.pin='345';remote.rev={...remote.rev,c:remote.rev.c+100};
 w.OCSync.aplicarCatalogo(catalog,null);
 assert.equal(w.OCSync.leerIntencionesAutoridad()[0].rol,'admin');
 assert.equal(await w.OCSync.confirmarAutoridad(member.id,original._teamAuthorityIntent.opId,0,1,source),false);
 assert.equal(w.OCSync.leerIntencionesAutoridad().length,1);
});
test('remote credential change during durable ACK save retains its retry witness',async()=>{
 const w=setup();const member=await w.request('/api/usuarios','POST',{nombre:'Synthetic',pin:'234',rol:'empleado'});
 const original=w.OCSync.leerIntencionesAutoridad()[0],catalog=w.OCSync.catalogoPropio();
 let release,entered;const started=new Promise(r=>entered=r);
 w.OCEstadoIDB={soportado:true,guardarConRevision:()=>{entered();return new Promise(r=>release=r);},ultimoError:()=>null};
 const saving=w.OCSync.confirmarAutoridad(member.id,original._teamAuthorityIntent.opId,0,1,sourceOf(original));await started;
 const remote=catalog.usuarios.find(u=>u.id===member.id);remote.rol='admin';remote.pin='345';remote.rev={...remote.rev,c:remote.rev.c+100};
 w.OCSync.aplicarCatalogo(catalog,null);release(true);
 assert.equal(await saving,false);assert.equal(w.OCSync.leerIntencionesAutoridad().length,1);
 assert.equal(w.OCSync.leerIntencionesAutoridad()[0]._teamAuthorityIntent.opId,original._teamAuthorityIntent.opId);
});
