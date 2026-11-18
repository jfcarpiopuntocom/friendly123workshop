// Gate D, SERVER-ONLY and dormant (flag WS_OPEN_EXISTING_QA, OFF by default).
// The YParty DO opens an existing shop's current Yjs history as-is (same state,
// SHA-anchored, zero pending parents) and keeps going forward. Any refusal leaves
// SQL untouched and the shop stays on the current Firebase path (failback).
// Future wiring: src/index.js Tienda.onStart, right before `await super.onStart();`.
import * as Y from 'yjs';
import {prepareFrozenImport,installFrozenImport} from './certified-frozen-import.mjs';
import {exportCompleteYpartyYjs} from './durable-full-yjs-export.mjs';

export async function openExistingStore({env,storage,source}={}) {
  if(env?.WS_OPEN_EXISTING_QA!=='1')return {opened:false,failback:'flag-off'};
  try {
    const sql=storage.sql;
    // Already opened: never re-import (the journal holds forward ops since then).
    if(sql.exec("SELECT 1 FROM sqlite_master WHERE type='table' AND name='f123_frozen_imports'").toArray().length&&
       sql.exec('SELECT 1 FROM f123_frozen_imports WHERE id=1').toArray().length)
      return {opened:true,already:true};
    const {receipt}=await installFrozenImport({storage,proof:await prepareFrozenImport(source)});
    return {opened:true,already:false,receipt};
  } catch(e) {return {opened:false,failback:String(e?.message||e)};}
}

// Failback: only what the current path lacks (diff by its state vector), so
// applying it once or twice never duplicates history.
export async function failbackUpdate({storage,channel,legacyStateVector}={}) {
  const full=await exportCompleteYpartyYjs({storage,channel});
  const doc=new Y.Doc();
  try {
    Y.applyUpdate(doc,full.bytes);
    return {update:Y.encodeStateAsUpdate(doc,legacyStateVector),sha256:full.sha256,eventCount:full.eventCount};
  } finally {doc.destroy();}
}
