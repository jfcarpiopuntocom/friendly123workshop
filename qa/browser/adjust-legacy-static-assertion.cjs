#!/usr/bin/env node
'use strict';
// QA-only archived-v782 test compatibility. Changes only one obsolete
// static assertion in the ephemeral CI checkout; NEVER edits app source.
// The old test expected (state, revision). Newer v782 intentionally passes
// the commit token and sale opId as additional CAS identity and dedup witnesses.
// The replacement is MORE SPECIFIC than the former assertion.
const fs=require('node:fs');
const path=require('node:path');
const p=process.argv[2];
if(!p||!path.isAbsolute(path.resolve(p))||
  path.basename(p)!=='p0-sales-atomic-idb-webkit-browser.test.cjs')
  throw Error('Exact archived QA test file required');
let s=fs.readFileSync(p,'utf8');
const before=String.raw`assert.match(save,/idb\.guardarConRevision\(completo, _localRev\)/);`;
const after=String.raw`assert.match(save,/idb\.guardarConRevision\(completo, _localRev, _commitLocal, opIdVenta\)/);`;
const nOld=s.split(before).length-1;
const nNew=s.split(after).length-1;
if(nOld===0&&nNew===1){
  console.log('QA-only: strict opId CAS assertion already present; no modification');
  process.exit(0);
}
if(nOld!==1||nNew!==0)
  throw Error('QA contract drift: expected exactly one legacy or one strict CAS signature assertion');
const updated=s.replace(before,after);
if(!updated.includes(after))throw Error('failed to enforce opId contract');
fs.writeFileSync(p,updated);
console.log('QA-only: upgraded one stale static assertion to require commit and opId arguments; app source untouched.');
