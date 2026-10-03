/* vEXP003 workshop safety boundary: presentation experiment only. */
(function(){
  "use strict";
  try{Object.defineProperty(window,"OC_EXP003",{value:true,writable:false,configurable:false});}catch(_){window.OC_EXP003=true;}
  try{var m=document.createElement("meta");m.name="robots";m.content="noindex,nofollow";document.head.appendChild(m);}catch(_){}

  /* Keep this experiment from falling through to real APIs, licensing, sync,
     telemetry or relay endpoints. mock-backend.js may intercept /api/* above
     this wrapper; anything it does not intercept fails closed here. */
  try{
    var nativeFetch=window.fetch&&window.fetch.bind(window);
    if(nativeFetch){
      window.fetch=function(input,init){
        try{
          var raw=typeof input==="string"?input:(input&&input.url)||"";
          var u=new URL(raw,location.href);
          var same=u.origin===location.origin;
          var expPath=u.pathname.indexOf("/friendly123workshop/docs/exp003/")===0;
          if(u.pathname.indexOf("/api/")===0){
            return Promise.reject(new Error("[vEXP003] blocked unmocked API request"));
          }
          if(!same || !expPath){
            return Promise.reject(new Error("[vEXP003] blocked outbound request"));
          }
        }catch(e){
          if(e&&String(e.message||e).indexOf("[vEXP003]")===0)return Promise.reject(e);
        }
        return nativeFetch(input,init);
      };
    }
  }catch(_){}

  try{
    var NativeWS=window.WebSocket;
    if(NativeWS){
      window.WebSocket=function(){throw new Error("[vEXP003] WebSocket disabled in workshop");};
      window.WebSocket.prototype=NativeWS.prototype;
    }
  }catch(_){}

  try{
    if(navigator.sendBeacon){
      navigator.sendBeacon=function(){return false;};
    }
  }catch(_){}

  try{
    var XO=XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open=function(method,url){
      try{
        var u=new URL(url,location.href);
        if(u.origin!==location.origin || u.pathname.indexOf("/friendly123workshop/docs/exp003/")!==0){
          throw new Error("[vEXP003] XHR blocked");
        }
      }catch(e){ if(e&&String(e.message||e).indexOf("[vEXP003]")===0) throw e; }
      return XO.apply(this,arguments);
    };
  }catch(_){}
})();