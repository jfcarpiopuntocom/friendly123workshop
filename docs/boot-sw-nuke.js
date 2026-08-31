// SW nuke: flag va PRIMERO para no hacer loop si el reload falla (ej: Waterfox/Gecko).
// El nuke solo dispara una vez por dispositivo. Si no hay SW, no hace nada.
(function(){
  try{
    if(!("serviceWorker" in navigator))return;
    var K="f123_sw_nuke_v1";
    if(localStorage.getItem(K))return;
    // Marcar ANTES de hacer nada — si el proceso revienta, no vuelve a disparar.
    localStorage.setItem(K,"1");
    navigator.serviceWorker.getRegistrations().then(function(regs){
      if(!regs.length)return;
      var found=false;
      regs.forEach(function(r){
        if(r.active&&r.active.scriptURL&&r.active.scriptURL.indexOf("sw.js")!==-1){
          found=true;
          try{r.unregister()}catch(_){}
        }
      });
      if(!found)return;
      // Purgar caches, luego reload con setTimeout para que el unregister asiente.
      (caches.keys()||Promise.resolve([])).then(function(cs){
        var dels=(cs||[]).map(function(c){try{return caches.delete(c)}catch(_){return Promise.resolve()}});
        return Promise.all(dels);
      }).catch(function(){}).then(function(){
        setTimeout(function(){location.reload()},120);
      });
    }).catch(function(){});
  }catch(_){}
})();
