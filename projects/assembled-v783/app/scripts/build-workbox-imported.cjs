const path=require('node:path');
require('esbuild').buildSync({
  absWorkingDir:path.join(__dirname,'..'),entryPoints:['src/workbox-imported.js'],
  outfile:'docs/vendor/workbox-imported.min.js',bundle:true,minify:true,
  platform:'browser',format:'iife',legalComments:'inline',
  define:{'process.env.NODE_ENV':'"production"'},
  alias:{'workbox-core':path.join(__dirname,'../src/vendor/workbox-imported/core')}
});
