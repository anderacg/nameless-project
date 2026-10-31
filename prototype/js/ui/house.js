'use strict';
/* ---------- a house's page (world/houses.js House; the frame of PAGE_SCREEN: its header, its banner (the house on its ground),
   what it is, its actions, its bottom bar): its kind, its households and people, its state, its holding's homes; your quests
   that lead to it; Visit its holding, Back to map ---------- */
function houseMeet(o){if(!o?.holding)return;G.house=o;G.mode='dialog';P.tx=null;G.chase=null;showHouse()}
function showHouse(){const o=G.house,t=o.holding,l=o.lot,s=lotSprite(t,l),qs=o.quests();
  const ps=[[s,l.x*TILE,l.y*TILE]],B=PAGE_BANNER,cy=(l.y+l.n/2)*TILE-B.h/2+B.foot;// (as the map draws it: structures.js holdingEnts; the house in the middle)
  const state=l.st==='built'?'':l.st==='ruined'?'<p class="bad">Burnt out: no one lives here now.</p>':'<p class="muted">Still being built.</p>';
  const homes=Layout.of(t).housing(),pop=Math.round(t.pop||0);
  PAGE_SCREEN.show({ico:'house',title:o.kindN(),sub:'A house of '+t.name+(t.owner&&FACS[t.owner]?' · '+FACS[t.owner].n:''),
    banner:{key:'house:'+t.name+':'+l.id+':'+l.st,x:o.x,y:cy,ps,alt:o.kindN()+' in '+t.name},
    body:state+pageFacts([l.st==='built'?o.households()+' household'+(o.households()>1?'s':'')+', about '+o.people()+' people':'',t.name+': '+pop+' people, homes for '+homes])+
      (qs.length?'<div class="lab">Your quests here</div>'+qs.map(q=>'<p class="gold">'+htmlText(q.title)+'<small class="muted"> · '+htmlText(q.todo?q.todo():'')+'</small></p>').join(''):''),
    acts:[{act:'house-town',icon:'house',label:'Visit '+t.name,facts:['walk to its gate']}],close:['house-close',null,'Back to map']},'house:'+l.id)}
onAct('house-',a=>{const o=G.house;G.house=null;hidePanel();G.mode='world';if(a==='house-town'&&o?.holding)worldApproach(o.holding)});
