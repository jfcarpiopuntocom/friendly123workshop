from pathlib import Path
import sys,json
from playwright.sync_api import sync_playwright
src=Path(sys.argv[1]).read_text()
if 'function resumenComisionesGlobalHtml(' in src:
 start=src.index('function mostrarDetalleComisiones(');src=src[start:src.index('async function cargarComisiones(',start)]
h=2166136261
for c in src:h=((h^ord(c))*16777619)&0xffffffff
assert (len(src),h)==(1263,3018362336)
fixture=r'''({inject,collision,group})=>{
 document.body.innerHTML='<section data-commissions-current-view="'+group+'"><details open data-comm-history-group '+(inject?'data-comm-search-injected="true"':'')+'><div data-comm-details data-loaded="0"></div><button data-comm-history-more>More</button></details></section>';
 const panel=document.querySelector('details');panel.dataset.commGroup=inject?'p65':JSON.stringify([group,'p65']);
 const good=Array.from({length:81},(_,i)=>({id:group+'-receipt-'+i}));
 window._ocComHistoryRowsPorGrupo=new Map();if(!inject)window._ocComHistoryRowsPorGrupo.set(panel.dataset.commGroup,good);if(collision)window._ocComHistoryRowsPorGrupo.set('p65',[{id:'WRONG'}]);
 window._ocComGroupState={[group]:{rowsByGroup:new Map([['p65',good]])}};window._ocComHistoryGroup='producto';window.fmtMoney=String;window._ocFilaVentaRawHtml=v=>'<p>'+v.id+'</p>';
 mostrarDetalleComisiones(panel,false);const first=[...panel.querySelectorAll('p')].map(p=>p.textContent);mostrarDetalleComisiones(panel,true);const all=[...panel.querySelectorAll('p')].map(p=>p.textContent);
 return {first:first.length,total:all.length,wrong:all.includes('WRONG'),correct:JSON.stringify(all)===JSON.stringify(good.map(v=>v.id)),moreHidden:panel.querySelector('button').hidden};
}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);print('Chromium',b.version)
 def run(code):
  out=[]
  for group in ['producto','cliente']:
   for inject in [False,True]:
    for collision in [False,True]:
     page=b.new_page();page.route('**/*',lambda r:r.abort());page.set_content('<html><body></body></html>');page.add_script_tag(content=code);r=page.evaluate(fixture,dict(inject=inject,collision=collision,group=group));page.close();out.append(dict(group=group,inject=inject,collision=collision,**r))
  return out
 before=run(src);print('RED',json.dumps(before));assert all(x['correct']==(not x['inject']) for x in before);assert all(x['wrong']==(x['inject'] and x['collision']) for x in before)
 old='  if(!rows)rows=[];';assert src.count(old)==1
 fixed=src.replace(old,'''  if(panel.hasAttribute("data-comm-search-injected")){
    const sec=panel.closest("section[data-commissions-current-view]");
    const group=sec?sec.dataset.commissionsCurrentView:window._ocComHistoryGroup;
    const state=window._ocComGroupState&&window._ocComGroupState[group];
    rows=state&&state.rowsByGroup&&state.rowsByGroup.get(rawKey);
  }
  if(!rows)rows=[];''')
 after=run(fixed);print('GREEN',json.dumps(after));assert all(x['first']==80 and x['total']==81 and x['correct'] and not x['wrong'] and x['moreHidden'] for x in after);b.close()
