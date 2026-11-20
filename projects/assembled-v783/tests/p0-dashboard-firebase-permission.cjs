#!/usr/bin/env node
'use strict';
const { randomBytes }=require('node:crypto');
(async()=>{
 const room=randomBytes(20).toString('hex');
 const prefix='https://friendly-123-ab7b3-default-rtdb.firebaseio.com/f123/'+room+'/o';
 const j=async(r)=>{try{return await r.json();}catch{return null}};
 const test=await fetch(prefix+'.json',{method:'GET',signal:AbortSignal.timeout(12000)});
 console.log('F123 DASH PERMISSION read',test.status);
 if(!test.ok)throw Error('dash path unavailable for read');
 // Only the uniquely generated synthetic path. The exact written key is deleted.
 const payload={c:Buffer.from([1,2,3,4]).toString('base64'),t:{'.sv':'timestamp'}};
 const key='qa_'+randomBytes(10).toString('hex');
 const url=prefix+'/'+key+'.json';
 const put=await fetch(url+'?x-http-method-override=PUT',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({s:{'.sv':'timestamp'},c:payload.c,lam:0}),signal:AbortSignal.timeout(12000)});
 console.log('F123 DASH PERMISSION write',put.status);
 if(!put.ok)throw Error('isolated room op write refused');
 try{
 const get=await fetch(url,{signal:AbortSignal.timeout(12000)});
 const got=await j(get);
 console.log('F123 DASH PERMISSION verify',get.status,'cipherBytes',got?.c?.length||0);
 if(!get.ok||got?.c!==payload.c)throw Error('dash write did not persist');
 }finally{
 const del=await fetch(url,{method:'DELETE',signal:AbortSignal.timeout(12000)});
 console.log('F123 DASH PERMISSION cleanup',del.status);
 if(!del.ok)throw Error('dash record cleanup rejected');
 }
})().catch(err=>{console.error('F123 DASH GATE RED',err.message.replace(/https?:\/\/[^ ]+/g,'URL'));process.exitCode=1});
