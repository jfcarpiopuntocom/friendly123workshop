// C200: suma bytes de cada <script src> local de docs/index.html + scripts inline.
// Uso: node c200-js-arranque.cjs <ruta-docs> [--min]   (--min: estima el tamano con esbuild minify)
const fs=require('fs'),path=require('path');
const docs=path.resolve(process.argv[2]||'.');const est=process.argv.includes('--min');
let esbuild;if(est)esbuild=require(process.argv[3]||'esbuild');
const html=fs.readFileSync(path.join(docs,'index.html'),'utf8');
const rows=[];let inline=0;
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  const a=m[1],body=m[2];const src=(a.match(/\bsrc=["']([^"']+)["']/)||[])[1];
  if(/ld\+json/.test(a))continue;
  if(src){if(/^https?:/.test(src))continue;const f=path.join(docs,src);if(!fs.existsSync(f)){rows.push([src,0]);continue;}
    const buf=fs.readFileSync(f);let n=buf.length;
    if(est&&!/\.min\.js$/.test(src))try{n=Buffer.byteLength(esbuild.transformSync(buf.toString(),{target:'es2020',minifySyntax:true,minifyWhitespace:true,minifyIdentifiers:false,legalComments:'none'}).code)}catch(e){}
    rows.push([src,n]);}
  else inline+=Buffer.byteLength(body);
}
const ext=rows.reduce((s,r)=>s+r[1],0);
rows.sort((x,y)=>y[1]-x[1]);
console.log(`scripts externos: ${rows.length}  bytes: ${ext}  inline: ${inline}  TOTAL: ${ext+inline}`);
for(const r of rows.slice(0,15))console.log(String(r[1]).padStart(9),r[0]);
