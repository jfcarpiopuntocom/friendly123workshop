const path=require('node:path');
require('esbuild').buildSync({
  absWorkingDir:path.join(__dirname,'..'),entryPoints:['src/money-imported.js'],
  outfile:'docs/vendor/money-imported.min.js',bundle:true,minify:true,
  platform:'browser',format:'iife',legalComments:'inline'
});
