/* vEXP003 — presentation-only UX layer. No domain writes. */
(function(){
  "use strict";
  var T={
    en:{
      trust:"Sample business · workshop only",trustMore:"No real customer data or license is used by vEXP003.",
      kicker:"60-second product tour",mission:"See the value before learning every feature.",missionSub:"One guided proof: identify the priority, record a sale, see the business update.",
      s1:"See what needs attention",s2:"Record a sale",s3:"See what changed",
      priority:"Today’s priority",sell:"Sell",add:"Add product",comm:"View commissions",alerts:"See all alerts",
      inv:"Know what to restock, push, or stop carrying.",sold:"Record what left and see the result immediately.",cust:"Know who buys, who owes, and what needs follow-up.",commOut:"See the house/associate split without a spreadsheet.",shelves:"Keep store, pop-up and consignment stock in one operating picture.",
      before:"Before",beforeTxt:"Counts are scattered across paper, messages, memory, or separate sheets.",now:"With friendly-123",nowTxt:"Stock, sales, shelves, commissions and alerts live in one shared visual notebook.",
      setup:"Set up locations and events",import:"Import customers",advanced:"Deep controls and accounting",
      noProducts:"No products yet. Add the first item to start the visual inventory.",noCustomers:"No customers yet. Add one customer or import a CSV.",noCommissions:"No commissions yet. Assign a sales associate or consignor to a shelf.",noShelves:"No shelves yet. Create the first selling location.",
      create:"Create",addCustomer:"Add customer",
      ready:"Ready for your own business?",readySub:"$399 · 5-year license · one payment · no monthly fee.",cta:"Set up your business",
      ahaProduct:"Product saved. See it in Inventory.",ahaSale:"Sale recorded. Today’s numbers just changed.",whyInv:"Visual control: spot what needs attention without reading a spreadsheet.",whySold:"Operational control: record what left without turning the workflow into a heavyweight POS.",whyComm:"Settlement control: see what the house keeps and what the associate receives."
    },
    es:{
      trust:"Negocio de muestra · solo workshop",trustMore:"vEXP003 no usa datos ni licencias de clientes reales.",
      kicker:"Recorrido de 60 segundos",mission:"Entiende el valor antes de aprender cada función.",missionSub:"Una sola prueba guiada: identifica la prioridad, registra una venta y mira cómo cambia el negocio.",
      s1:"Mira qué requiere atención",s2:"Registra una venta",s3:"Mira qué cambió",
      priority:"Prioridad de hoy",sell:"Vender",add:"Agregar producto",comm:"Ver comisiones",alerts:"Ver todas las alertas",
      inv:"Sabe qué reponer, impulsar o dejar de cargar.",sold:"Registra lo que salió y ve el resultado de inmediato.",cust:"Sabe quién compra, quién debe y qué requiere seguimiento.",commOut:"Ve el reparto casa/asociado sin una hoja de cálculo.",shelves:"Mantén tienda, feria y consignación en una sola vista operativa.",
      before:"Antes",beforeTxt:"Los conteos quedan repartidos entre papel, mensajes, memoria u hojas separadas.",now:"Con friendly-123",nowTxt:"Inventario, ventas, perchas, comisiones y alertas viven en un cuaderno visual compartido.",
      setup:"Configurar ubicaciones y eventos",import:"Importar clientes",advanced:"Controles profundos y contabilidad",
      noProducts:"Aún no hay productos. Agrega el primero para iniciar el inventario visual.",noCustomers:"Aún no hay clientes. Agrega uno o importa un CSV.",noCommissions:"Aún no hay comisiones. Asigna un asociado o consignador a una percha.",noShelves:"Aún no hay perchas. Crea la primera ubicación de venta.",
      create:"Crear",addCustomer:"Agregar cliente",
      ready:"¿Listo para usarlo con tu negocio?",readySub:"$399 · licencia de 5 años · un solo pago · sin mensualidad.",cta:"Configura tu negocio",
      ahaProduct:"Producto guardado. Míralo en Inventario.",ahaSale:"Venta registrada. Los números de Hoy acaban de cambiar.",whyInv:"Control visual: detecta qué requiere atención sin leer una hoja de cálculo.",whySold:"Control operativo: registra lo que salió sin convertir el flujo en un POS pesado.",whyComm:"Control de reparto: ve cuánto conserva la casa y cuánto recibe el asociado."
    }
  };
  var lang="en", armedSale=false, saleBaseline=null;
  function tx(k){return (T[lang]&&T[lang][k])||T.en[k]||k}
  function detectLang(){var l=(document.documentElement.lang||"en").toLowerCase();lang=l.indexOf("es")===0?"es":"en";}
  function nav(view){var b=document.querySelector('nav button[data-vista="'+view+'"]');if(b)b.click();}
  function scrollTo(el){if(!el)return;try{el.scrollIntoView({behavior:"smooth",block:"center"});}catch(_){el.scrollIntoView();}}
  function pulse(el){if(!el)return;el.classList.remove("exp003-pulse");void el.offsetWidth;el.classList.add("exp003-pulse");}
  function mark(n){var b=document.querySelector('.exp003-step[data-step="'+n+'"]');if(b)b.classList.add("done");}
  function mission(){
    var sec=document.getElementById("vista-hoy"); if(!sec||document.getElementById("exp003-mission"))return;
    var d=document.createElement("div");d.id="exp003-mission";d.className="exp003-mission";
    d.innerHTML='<div class="exp003-kicker" data-e3="kicker"></div><h3 data-e3="mission"></h3><p data-e3="missionSub"></p><div class="exp003-steps">'+
      '<button class="exp003-step" data-step="1"><span>01</span><b data-e3="s1"></b></button>'+
      '<button class="exp003-step" data-step="2"><span>02</span><b data-e3="s2"></b></button>'+
      '<button class="exp003-step" data-step="3"><span>03</span><b data-e3="s3"></b></button></div>';
    sec.insertBefore(d,sec.firstChild);
    d.querySelector('[data-step="1"]').onclick=function(){mark(1);scrollTo(document.getElementById("listaAlertas"));};
    d.querySelector('[data-step="2"]').onclick=function(){mark(1);armedSale=true;saleBaseline=(document.getElementById("resVentasCount")||{}).textContent||null;nav("vender");};
    d.querySelector('[data-step="3"]').onclick=function(){nav("hoy");scrollTo(document.querySelector(".grid-resumen"));pulse(document.querySelector(".grid-resumen"));};
  }
  function command(){
    var sec=document.getElementById("vista-hoy");if(!sec||document.getElementById("exp003-command"))return;
    var hero=document.getElementById("heroSemaforo");var d=document.createElement("div");d.id="exp003-command";d.className="exp003-command";
    d.innerHTML='<button class="primary" data-a="priority" data-e3="priority"></button><button data-a="sell" data-e3="sell"></button><button data-a="add" data-e3="add"></button><button data-a="comm" data-e3="comm"></button><button data-a="alerts" data-e3="alerts"></button>';
    (hero&&hero.parentNode?hero.parentNode:sec).insertBefore(d,hero?hero.nextSibling:sec.firstChild);
    d.querySelector('[data-a="priority"]').onclick=function(){mark(1);scrollTo(document.getElementById("listaAlertas"));};
    d.querySelector('[data-a="sell"]').onclick=function(){armedSale=true;saleBaseline=(document.getElementById("resVentasCount")||{}).textContent||null;nav("vender");};
    d.querySelector('[data-a="add"]').onclick=function(){nav("inventario");setTimeout(function(){if(typeof window.abrirAltaProducto==="function")window.abrirAltaProducto();},120);};
    d.querySelector('[data-a="comm"]').onclick=function(){nav("comisiones");};
    d.querySelector('[data-a="alerts"]').onclick=function(){nav("hoy");setTimeout(function(){scrollTo(document.getElementById("listaAlertas"));},80);};
  }
  function trust(){
    if(document.getElementById("exp003-trust"))return;
    var d=document.createElement("div");d.id="exp003-trust";d.tabIndex=0;d.innerHTML='<span data-e3="trust"></span><small data-e3="trustMore"></small>';
    d.onclick=function(){d.classList.toggle("expanded")};d.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();d.click();}};
    var host=document.getElementById("vista-hoy")||document.querySelector("main")||document.body; host.insertBefore(d,host.firstChild);
  }
  function addOutcome(sectionId,key,whyKey){
    var s=document.getElementById(sectionId);if(!s)return;
    var h=s.querySelector("h3.seccion");if(!h||h.nextElementSibling&&h.nextElementSibling.classList.contains("exp003-outcome"))return;
    var p=document.createElement("p");p.className="exp003-outcome";p.setAttribute("data-e3",key);h.insertAdjacentElement("afterend",p);
    if(whyKey){var q=document.createElement("p");q.className="exp003-outcome";q.style.fontWeight="700";q.setAttribute("data-e3",whyKey);p.insertAdjacentElement("afterend",q);}
  }
  function proof(){
    var sec=document.getElementById("vista-hoy");if(!sec||document.getElementById("exp003-proof"))return;
    var alerts=document.getElementById("listaAlertas");var d=document.createElement("div");d.id="exp003-proof";d.className="exp003-proof";
    d.innerHTML='<div><strong data-e3="before"></strong><p data-e3="beforeTxt"></p></div><div><strong data-e3="now"></strong><p data-e3="nowTxt"></p></div>';
    if(alerts)alerts.insertAdjacentElement("afterend",d); else sec.appendChild(d);
  }
  function upsell(){
    var sec=document.getElementById("vista-hoy");if(!sec||document.getElementById("exp003-upsell"))return;
    var d=document.createElement("div");d.id="exp003-upsell";d.className="exp003-upsell";
    d.innerHTML='<div><h4 data-e3="ready"></h4><p data-e3="readySub"></p></div><a href="https://jfcarpiopuntocom.github.io/friendly-123/save.html#probar" rel="noopener" data-e3="cta"></a>';
    sec.appendChild(d);
  }
  function wrapCards(){
    function wrapByI18n(attr,summaryKey){
      var h=document.querySelector('[data-i18n="'+attr+'"]');if(!h)return;
      var card=h.closest(".tag-card");if(!card||card.closest(".exp003-disclosure"))return;
      var det=document.createElement("details");det.className="exp003-disclosure";
      var sum=document.createElement("summary");sum.setAttribute("data-e3",summaryKey);
      var body=document.createElement("div");body.className="exp003-disclosure-body";
      card.parentNode.insertBefore(det,card);det.appendChild(sum);det.appendChild(body);body.appendChild(card);
    }
    wrapByI18n("shelves.addBranch","setup");
    wrapByI18n("customers.importHeading","import");
    var adv=document.getElementById("vista-avanzado");
    if(adv&&!adv.dataset.exp003Disclosure){
      adv.dataset.exp003Disclosure="1";
      Array.prototype.slice.call(adv.children).forEach(function(ch,idx){
        if(idx<3||ch.id==="oc-reloj-aviso"||ch.id==="oc-invariantes-aviso")return;
        ch.classList.add("exp003-deep");
      });
      var deep=adv.querySelectorAll(".exp003-deep");
      if(deep.length){
        var det=document.createElement("details");det.className="exp003-disclosure";var sum=document.createElement("summary");sum.setAttribute("data-e3","advanced");var body=document.createElement("div");body.className="exp003-disclosure-body";
        deep[0].parentNode.insertBefore(det,deep[0]);det.appendChild(sum);det.appendChild(body);Array.prototype.slice.call(deep).forEach(function(x){body.appendChild(x);});
      }
    }
  }
  function emptyState(id,key,action){
    var host=document.getElementById(id);if(!host)return;
    var old=host.querySelector(":scope > .exp003-empty");
    var has=Array.prototype.slice.call(host.children).some(function(c){return !c.classList.contains("exp003-empty") && String(c.textContent||"").trim().length>0;});
    if(has){if(old)old.remove();return;}
    if(old)return;
    var d=document.createElement("div");d.className="exp003-empty";d.innerHTML='<p data-e3="'+key+'"></p><button data-e3="'+(action==="customer"?"addCustomer":"create")+'"></button>';
    d.querySelector("button").onclick=function(){
      if(action==="product"){nav("inventario");setTimeout(function(){if(typeof window.abrirAltaProducto==="function")window.abrirAltaProducto();},100);}
      if(action==="customer"){var b=document.getElementById("btnAltaCliente")||document.getElementById("btnNuevoCliente");if(b)b.click();}
      if(action==="shelf"){nav("inventario");setTimeout(function(){scrollTo(document.getElementById("seccionPerchas"));},100);}
      if(action==="commission"){nav("inventario");setTimeout(function(){scrollTo(document.getElementById("seccionPerchas"));},100);}
    };
    host.appendChild(d);applyText(d);
  }
  function empties(){
    emptyState("gridInventario","noProducts","product");
    emptyState("listaClientes","noCustomers","customer");
    emptyState("listaComisiones","noCommissions","commission");
    emptyState("gridPerchas","noShelves","shelf");
  }
  function applyText(root){
    detectLang();
    (root||document).querySelectorAll("[data-e3]").forEach(function(el){el.textContent=tx(el.getAttribute("data-e3"));});
  }
  function watchAha(){
    var count=document.getElementById("resVentasCount");
    if(count&&!count.dataset.exp003Watched){
      count.dataset.exp003Watched="1";
      new MutationObserver(function(){
        if(!armedSale)return;
        var now=count.textContent||"";
        if(saleBaseline!==null&&now!==saleBaseline){
          armedSale=false;mark(2);mark(3);nav("hoy");setTimeout(function(){pulse(document.querySelector(".grid-resumen"));},80);
        }
      }).observe(count,{childList:true,characterData:true,subtree:true});
    }
    if(!window.__EXP003_AHA_OBSERVER__){
      window.__EXP003_AHA_OBSERVER__=true;
      new MutationObserver(function(ms){
        ms.forEach(function(m){
          Array.prototype.slice.call(m.addedNodes||[]).forEach(function(n){
            var t=(n&&n.textContent)||"";
            if(/Product saved\.|Producto guardado\./i.test(t)){
              nav("inventario");setTimeout(function(){pulse(document.getElementById("gridInventario"));},120);
            }
          });
        });
      }).observe(document.documentElement,{childList:true,subtree:true});
    }
  }
  function ensureShell(){
    detectLang();trust();mission();command();proof();upsell();
    addOutcome("vista-inventario","inv","whyInv");
    addOutcome("vista-vender","sold","whySold");
    addOutcome("vista-clientes","cust",null);
    addOutcome("vista-comisiones","commOut","whyComm");
    addOutcome("vista-perchas","shelves",null);
    wrapCards();applyText(document);watchAha();empties();
  }
  function init(){
    ensureShell();
    var timer=null;
    new MutationObserver(function(){
      clearTimeout(timer);
      timer=setTimeout(ensureShell,120);
    }).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("oc-lang-change",function(){setTimeout(function(){applyText(document)},20);});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();