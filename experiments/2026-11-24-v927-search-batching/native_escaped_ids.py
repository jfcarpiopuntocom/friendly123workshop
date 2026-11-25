from pathlib import Path
import json,sys
from playwright.sync_api import sync_playwright
src=Path(sys.argv[1]).read_text()
def extract(a,b,n,expected):
 start=src.index(a);s=src[start:src.index(b,start)]
 h=2166136261
 for c in s:h=((h^ord(c))*16777619)&0xffffffff
 assert (len(s),h)==(n,expected),(len(s),h)
 return s
pagination=extract('function mostrarMasGruposComisiones(','window.mostrarMasGruposComisiones=',2408,1558219412)
details=extract('function mostrarDetalleComisiones(','async function cargarComisiones(',1263,3018362336)
fixture=r'''({id,order,multi})=>{
 document.documentElement.lang='es';
 document.body.innerHTML='';
 window.escHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.fmtMoney=String;window._ocFilaVentaRawHtml=v=>'<p>'+escHtml(v.id)+'</p>';
 window._ocComHistoryGroups=multi?['producto','cliente']:['producto'];window._ocComHistoryGroup='producto';window._ocComBatchSize=60;window._ocComGroupState={};window._ocComHistoryRowsPorGrupo=new Map();
 for(const group of window._ocComHistoryGroups){
  const sec=document.createElement('section');sec.dataset.commissionsCurrentView=group;sec.innerHTML='<div data-comm-groups-container></div><div data-comm-more-wrap><button>More</button></div>';document.body.append(sec);
  const rows=Array.from({length:81},(_,i)=>({id:group+'-'+i}));
  const groups=Array.from({length:61},(_,i)=>({id:i===60?id:group+'-'+i,label:'Card '+i}));
  const renderSlice=gs=>gs.map(g=>'<details data-comm-history-group data-comm-group="'+escHtml(g.id)+'"><summary>'+escHtml(g.label)+'</summary><div data-comm-details data-loaded="0"></div><button data-comm-history-more>More receipts</button></details>').join('');
  const box=sec.querySelector('[data-comm-groups-container]');box.innerHTML=renderSlice(groups.slice(0,60));
  window._ocComGroupState[group]={view:{groups},mounted:60,renderSlice,rowsByGroup:new Map([[id,rows]])};
  if(!multi)window._ocComHistoryRowsPorGrupo.set(id,rows);
 }
 for(const group of order){const sec=document.querySelector('section[data-commissions-current-view="'+group+'"]');mostrarMasGruposComisiones(sec.querySelector('[data-comm-more-wrap] button'),group);}
 return window._ocComHistoryGroups.map(group=>{
  const sec=document.querySelector('section[data-commissions-current-view="'+group+'"]');const cards=sec.querySelectorAll('details');const card=cards[cards.length-1];card.open=true;mostrarDetalleComisiones(card,false);const first=card.querySelectorAll('p').length;mostrarDetalleComisiones(card,true);const got=[...card.querySelectorAll('p')].map(p=>p.textContent);return {group,key:card.dataset.commGroup,namespace:card.dataset.commGroup===(multi?JSON.stringify([group,id]):id),first,count:got.length,correct:got.length===81&&got.every((v,i)=>v===group+'-'+i),hidden:card.querySelector('[data-comm-history-more]').hidden};
 });
}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);print('Chromium',b.version)
 def run(code):
  results=[]
  for id in ['shared','A&B','A"B',"A'B",'<A>','Ñ café']:
   for order in [['producto','cliente'],['cliente','producto'],['producto']]:
    page=b.new_page();page.route('**/*',lambda r:r.abort());page.set_content('<html><body></body></html>');page.add_script_tag(content=code+'\n'+details);rows=page.evaluate(fixture,dict(id=id,order=order,multi=len(order)>1));page.close();results.append(dict(id=id,order=order,rows=rows,ok=all(x['namespace'] and x['first']==80 and x['correct'] and x['hidden'] for x in rows)))
  return results
 before=run(pagination);print('RED',sum(x['ok'] for x in before),'/',len(before));print('failures',json.dumps([x for x in before if not x['ok']],ensure_ascii=False));assert sum(x['ok'] for x in before)==10
 old="html=html.replace('data-comm-group=\"'+g.id+'\"',";assert pagination.count(old)==1
 fixed=pagination.replace(old,"html=html.replace('data-comm-group=\"'+escHtml(g.id)+'\"',")
 after=run(fixed);print('GREEN',sum(x['ok'] for x in after),'/',len(after));assert all(x['ok'] for x in after);b.close()
 print(json.dumps({'before':before,'after':after},ensure_ascii=False))
