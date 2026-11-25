from pathlib import Path
import sys,json
from playwright.sync_api import sync_playwright
s=Path(sys.argv[1]).read_text()
a=s.index('function filtrarComisionesGlobal(');b=s.index('async function cargarComisiones(',a) if 'async function cargarComisiones(' in s[a:] else len(s)
s=s[a:b]
for x,n,v in [(s[:s.index('// Retain the original')],5359,809138631),(s[s.index('function mostrarDetalleComisiones('):],1263,3018362336)]:
 h=2166136261
 for c in x:h=((h^ord(c))*16777619)&0xffffffff
 assert (len(x),h)==(n,v)
fixture=r'''({lang,reverse,id})=>{
 document.documentElement.lang=lang;
 document.body.innerHTML='<main id="listaComisiones"><div id="comm-product-count"></div></main>';
 const root=document.querySelector('main'),groups=['producto','cliente'];
 window.escHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));window.fmtMoney=String;window._ocFilaVentaRawHtml=v=>'<p>'+escHtml(v.id)+'</p>';
 window._ocComHistoryGroups=groups;window._ocComHistoryGroup='producto';window._ocComBatchSize=60;window._ocComGroupsTotal=1200;window._ocComGroupState={};window._ocComHistoryRowsPorGrupo=new Map();
 for(const g of groups){
  const sec=document.createElement('section');sec.dataset.commissionsCurrentView=g;sec.innerHTML='<div id="comm-groups-container" data-comm-groups-container></div><div data-comm-more-wrap><button>More</button></div>';root.append(sec);
  const all=Array.from({length:1200},(_,i)=>({id:i===65?id:g+'-'+i,label:i===65?'Needle':'Other '+i}));
  const rows=new Map(all.map(a=>[a.id,Array.from({length:81},(_,i)=>({id:g+'-'+a.id+'-'+i}))]));
  const renderSlice=gs=>gs.map(a=>'<details data-comm-history-group data-comm-group="'+escHtml(a.id)+'" data-search="'+escHtml(a.label)+'"><summary>'+a.label+'</summary><div data-comm-details data-loaded="0"></div><button data-comm-history-more>More</button></details>').join('');
  const box=sec.querySelector('[data-comm-groups-container]');box.innerHTML=renderSlice(all.slice(0,60));
  for(const card of box.querySelectorAll('details')){const raw=card.dataset.commGroup;card.dataset.commGroup=JSON.stringify([g,raw]);window._ocComHistoryRowsPorGrupo.set(card.dataset.commGroup,rows.get(raw));}
  window._ocComGroupState[g]={view:{groups:all},total:all.length,mounted:60,metaByGroup:new Map(),renderSlice,rowsByGroup:rows};
 }
 const sections=[...root.querySelectorAll('section')];
 const key=c=>{const k=c.dataset.commGroup;return k.startsWith('[')?JSON.parse(k)[1]:k;};
 const stats=()=>sections.map(sec=>{const cards=[...sec.querySelectorAll('details')];return {count:cards.length,dups:cards.length-new Set(cards.map(key)).size,visible:cards.filter(c=>!c.hidden).map(key)};});
 const receipts=()=>sections.map(sec=>{const card=[...sec.querySelectorAll('details')].find(c=>key(c)===id);if(!card)return false;card.open=true;mostrarDetalleComisiones(card,false);mostrarDetalleComisiones(card,true);const rows=[...card.querySelectorAll('p')].map(x=>x.textContent);return rows.length===81&&rows.every((r,i)=>r===sec.dataset.commissionsCurrentView+'-'+id+'-'+i);});
 filtrarComisionesGlobal('Needle');const initial=stats(),initialReceipts=receipts();
 for(const sec of reverse?sections.slice().reverse():sections)mostrarMasGruposComisiones(sec.querySelector('[data-comm-more-wrap] button'),sec.dataset.commissionsCurrentView);
 const paged=stats(),pagedReceipts=receipts();
 for(let i=0;i<10;i++){filtrarComisionesGlobal('Other');filtrarComisionesGlobal('missing');filtrarComisionesGlobal('Needle');}
 const repeated=stats();filtrarComisionesGlobal('');const cleared=stats();
 return {initial:initial.every(x=>x.visible.length===1&&x.visible[0]===id),initialReceipts:initialReceipts.every(Boolean),paged:paged.every(x=>x.visible.length===1&&x.visible[0]===id&&x.dups===0),pagedReceipts:pagedReceipts.every(Boolean),repeated:repeated.every(x=>x.visible.length===1&&x.visible[0]===id&&x.dups===0),cleared:cleared.every(x=>x.count===120&&x.visible.length===120&&x.dups===0)};
}'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);print('Chromium',browser.version)
 def run(src):
  result=[]
  for lang in ['es','en']:
   for reverse in [False,True]:
    for id in ['same','A&B','A"B',"A'B",'<A>','Ñ café']:
     page=browser.new_page();page.route('**/*',lambda r:r.abort());page.set_content('<html><body></body></html>');page.add_script_tag(content=src);r=page.evaluate(fixture,dict(lang=lang,reverse=reverse,id=id));page.close();result.append(r)
  return result
 before=run(s);print('RED',sum(sum(r.values()) for r in before),'/',len(before)*6,flush=True);assert any(not all(r.values()) for r in before)
 # Apply the existing three fixes as a single lab candidate. Search visits all mounted sections.
 def rep(a,b):
  global s
  assert s.count(a)==1,a
  s=s.replace(a,b)
 rep('  const groupCont=document.getElementById("comm-groups-container")||cont;\n  if(needle){\n    const activeGroup=window._ocComHistoryGroup||"producto";', '  let shownTotal=0,totalGroups=0;\n  for(const section of cont.querySelectorAll("section[data-commissions-current-view]")){\n  const groupCont=section.querySelector("[data-comm-groups-container]");\n  if(!groupCont)continue;\n  const activeGroup=section.dataset.commissionsCurrentView;\n  if(needle){')
 rep('  const cnt=cont.querySelector("#comm-product-count");\n  if(cnt){\n    const es=document.documentElement.lang==="es";\n    cnt.textContent=needle?(es?("Mostrando "+shown+" de "+(window._ocComGroupsTotal||cards.length)):("Showing "+shown+" of "+(window._ocComGroupsTotal||cards.length))):"";','  shownTotal+=shown;totalGroups+=window._ocComGroupState?.[activeGroup]?.total||cards.length;\n  }\n  const cnt=cont.querySelector("#comm-product-count");\n  if(cnt){\n    const es=document.documentElement.lang==="es";\n    cnt.textContent=needle?(es?("Mostrando "+shownTotal+" de "+totalGroups):("Showing "+shownTotal+" of "+totalGroups)):"";')
 rep('html=html.replace(\'data-comm-group="\'+g.id+\'"\',','html=html.replace(\'data-comm-group="\'+escHtml(g.id)+\'"\',')
 rep('    cont.insertAdjacentHTML("beforeend",html);\n  }\n  const remaining=', '    cont.insertAdjacentHTML("beforeend",html);\n    if(window._ocBuscaComisionProducto)filtrarComisionesGlobal(window._ocBuscaComisionProducto);\n  }\n  const remaining=')
 rep('  if(!rows)rows=[];', '  if(panel.hasAttribute("data-comm-search-injected")){\n    const group=panel.closest("section[data-commissions-current-view]")?.dataset.commissionsCurrentView;\n    rows=window._ocComGroupState?.[group]?.rowsByGroup?.get(rawKey);\n  }\n  if(!rows)rows=[];')
 after=run(s);print('GREEN',sum(sum(r.values()) for r in after),'/',len(after)*6,flush=True);print('failed',json.dumps([r for r in after if not all(r.values())]));assert all(all(r.values()) for r in after);browser.close()
