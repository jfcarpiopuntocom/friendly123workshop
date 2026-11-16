#!/usr/bin/env node
'use strict';
// Standalone QA browser artifact builder for exact reconstructed client.
// Not an app integration step. Does not touch production and emits NO_GO metadata.
const fs=require('node:fs'), path=require('node:path'),crypto=require('node:crypto');
const [source,dest]=process.argv.slice(2);
if(!source||!dest||!path.isAbsolute(source)||!path.isAbsolute(dest)||path.resolve(source)===path.resolve(dest))
  throw Error('usage: node package-browser-candidate.cjs ABSOLUTE_CLIENT_DOCS ABSOLUTE_DIST');
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
if(!fs.existsSync(path.join(source,'index.html'))||!fs.existsSync(path.join(source,'mock-backend.js')))
  throw Error('app sources not found');
if(fs.existsSync(dest))throw Error('destination already exists; fail closed');
fs.mkdirSync(dest,{recursive:true});
const files=[];
function copy(src,rel=''){
  for(const ent of fs.readdirSync(src,{withFileTypes:true})){
    if(ent.isSymbolicLink())throw Error('symlink forbidden in QA package: '+ent.name);
    const local=path.join(src,ent.name),name=path.posix.join(rel,ent.name);
    if(ent.isDirectory()){copy(local,name);continue}
    if(!ent.isFile())throw Error('unsupported file entry in QA package');
    // Browser-only artifact cannot register a SW at this temporary origin.
    if(/(^|\/)(sw\.js|service-worker\.js|manifest\.webmanifest)$/i.test(name))continue;
    // Never ship credential or workstation files in QA archives.
    if(/(^|\/)(\.env[^/]*|[^/]*\.(?:pem|key|p12|pfx)|node_modules)$/i.test(name))
      throw Error('possible sensitive file: '+name);
    const bytes=fs.readFileSync(local);
    const out=path.join(dest,name);
    fs.mkdirSync(path.dirname(out),{recursive:true});
    fs.writeFileSync(out,bytes);
    files.push({path:name,sha256:sha(bytes),bytes:bytes.length});
  }
}
copy(source);
files.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={
  purpose:'FRIENDLY123_SYNTHETIC_BROWSER_PREVIEW_ONLY',
  authorization:'NO_GO_NOT_PUBLISHED_NO_V783',
  exactCandidateSha:'f6276adac490f0610e130afec0615f98acd4b32b',
  missingWork:'Codex v783 candidate.patch and imported-sources.tar.gz not present',
  browserOnly:true,
  includedFiles:files.length,
  files
};
fs.writeFileSync(path.join(dest,'qa-bundle-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(dest,'QA-NO-PRODUCTION.txt'),
'QA synthetic browser candidate v782, NOT v783. NO customer data, real license, PIN, production use or rollout. Serve from isolated localhost profile. PWA installation intentionally excluded.\n');
console.log(JSON.stringify({files:files.length,sha256:sha(JSON.stringify(manifest)),authorization:manifest.authorization}));
