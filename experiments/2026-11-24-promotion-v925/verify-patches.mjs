#!/usr/bin/env node
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'../..');
const {patches}=JSON.parse(await readFile(join(here,'manifest.json'),'utf8'));
const stages=[...new Set(patches.map(p=>p.stage))];
const temp=await mkdtemp(join(tmpdir(),'f123-promotion-'));
const hash=path=>execFileSync('git',['hash-object',path],{cwd:temp,encoding:'utf8'}).trim();
async function check(p,which){
 const expected=which==='before'?p.baseBlob:p.candidateBlob;
 assert.equal(hash(p.target),expected,p.stage+' '+p.target+' '+which);
 assert.deepEqual(await readFile(join(temp,p.target)),await readFile(join(root,p[which])));
}
try {
 for(const t of new Map(patches.slice().reverse().map(p=>[p.target,p])).values()){
   const path=join(temp,t.target);await mkdir(dirname(path),{recursive:true});await writeFile(path,await readFile(join(root,t.before)));
 }
 for(const stage of stages){
  const rows=patches.filter(p=>p.stage===stage);
  for(const p of rows)await check(p,'before');
  const path=join(here,stage+'.patch');
  execFileSync('git',['apply','--check',path],{cwd:temp});
  execFileSync('git',['apply',path],{cwd:temp});
  for(const p of rows)await check(p,'after');
  console.log(stage+' apply PASS '+rows.length+' file(s)');
 }
 for(const stage of stages.slice().reverse()){
  const rows=patches.filter(p=>p.stage===stage);
  for(const p of rows)await check(p,'after');
  const path=join(here,stage+'.patch');
  execFileSync('git',['apply','--reverse','--check',path],{cwd:temp});
  execFileSync('git',['apply','--reverse',path],{cwd:temp});
  for(const p of rows)await check(p,'before');
  console.log(stage+' reverse PASS '+rows.length+' file(s)');
 }
}finally{await rm(temp,{recursive:true,force:true});}
