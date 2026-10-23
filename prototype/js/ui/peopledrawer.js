'use strict';
/* ---------- people: the People button in the bottom bar (or P) opens a drawer from the right edge of the people you know
   (your companions, the lords by realm, those you have met, the realms), each with where they are, how they feel about you,
   and Show on map, Profile and Talk. On the map, in a town's window and in its streets; never in battle (style.css hides it).
   It knows only what you could: a lord's whereabouts while he is in your sight (the map's rule: parties.js spotted), inside the
   holding you are in, or as you last saw him (PEOPLE.seen, for PEOPLE.memory days; kept for this session only, never saved).
   Show on map centres the drawer's small map on them and rings them on the world when they are on the screen (it moves no
   camera: the map follows your band) ---------- */
const PEOPLE={on:false,tab:'comps',card:null,look:null,memory:3,seen:new Map(),back:null,timer:0,el:null,html:''};
onWorld(()=>PEOPLE.seen.clear());// (a new world, or a game loaded: what you remember goes with it)
// (world.js updateWorld, every step): lords in your sight are remembered where you saw them, and in the saved Journal (knowledge.js)
function peopleWatch(){KNOWLEDGE.watch();const V=vis();for(const l of W.lords)if(!l.dead&&!l.gone&&!l.inside&&spotted(l,V))PEOPLE.seen.set(l.id,{x:l.x,y:l.y,day:G.day,n:l.troops.length})}
// what you know of a lord: {x, y, where, n (his soldiers, when you know), here (in this place with you)}; null: unknown
function lordKnown(l){
  if(l.dead||l.gone)return null;const near=(x,y)=>{const t=Spatial.nearestHolding(x,y);return t?' near '+t.name:''};
  if(l.inside&&G.town&&G.town.ref.name===l.inside){const t=G.town.ref;return {x:t.x,y:t.y,where:'Here, in '+t.name,n:l.troops.length,here:true}}
  if(!l.inside&&spotted(l,vis()))return {x:l.x,y:l.y,where:'In sight'+near(l.x,l.y),n:l.troops.length,here:G.mode==='world'&&Math.hypot(l.x-P.x,l.y-P.y)<=REACH*2};
  const s=PEOPLE.seen.get(l.id);if(s&&Clock.daysSince(s.day)<=PEOPLE.memory)return {x:s.x,y:s.y,where:'Seen'+near(s.x,s.y)+(s.day===G.day?' today':' on day '+s.day),n:s.n};
  return null;
}
const ppAvail=()=>['world','town','scene'].includes(G.mode)&&!(G.mode!=='town'&&G.modal);
// open or close it (P, the tab, a tap outside, Esc)
function peopleToggle(on){
  const E=PEOPLE.el;if(!E)return;on=on==null?!PEOPLE.on:!!on;if(on&&!ppAvail())on=false;
  PEOPLE.on=on;E.root.classList.toggle('open',on);E.tab.setAttribute('aria-expanded',String(on));clearInterval(PEOPLE.timer);
  if(on){peopleRender();PEOPLE.timer=setInterval(()=>{if(!ppAvail())return peopleToggle(false);peopleRender()},1000)}else PEOPLE.card=null;
}
const peopleKey=()=>{if(!ppAvail()&&!PEOPLE.on)return false;peopleToggle();return true};
const peopleEsc=()=>{if(!PEOPLE.on)return false;peopleToggle(false);return true};
// one entry: a face or an emblem, the name, where, how they feel, and its buttons; card: its profile, when open
function ppEntry(id,pic,name,lines,acts,card){return '<div class="pp-e" data-id="'+id+'">'+pic+'<div class="pp-i"><strong>'+name+'</strong>'+lines.map(s=>'<small>'+s+'</small>').join('')+
  '<div class="pp-acts">'+acts.join('')+'</div>'+(PEOPLE.card===id&&card?'<div class="pp-card">'+card+'</div>':'')+'</div></div>'}
const ppBtn=(a,arg,label,why)=>'<button class="btn sm" type="button" data-pp="'+a+'" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
const ppEmblem=f=>'<span class="pp-pic pp-em">'+facFlag(f,22)+'</span>';
const ppFac=f=>FACS[f]?'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>':'';
// where a companion is, and the spot Show on map goes to
function compWhere(id){const c=P.comps[id],p=c.party;if(!p)return {x:P.x,y:P.y,where:c.hurt>G.day?'With you, wounded':'With you'};
  return {x:p.x,y:p.y,where:({follow:'Riding with you',patrol:'Patrolling the land of '+p.base,return:'Coming back to you',stay:(p.inside?'Staying in ':'On the way to ')+p.base})[p.order]||'Leading a party'}}
function ppLord(l,why){const k=lordKnown(l),hostile=hostileTo(l.fac)&&!lordSpares(l),fr=lordFriends(l).filter(o=>!o.dead).slice(0,2),rv=lordRivals(l).filter(o=>!o.dead).slice(0,2),w=(P.lrelWhy||{})[l.id]||[];
  return ppEntry('l:'+l.id,ppEmblem(l.fac),l.name,[(k?k.where:'Whereabouts unknown')+(k&&k.n!=null?' · '+k.n+' soldiers':''),'Toward you: '+relTag(relWith(l))+(why?' · '+why:'')],
    [ppBtn('look','l:'+l.id,'Show on map',k?'':'Whereabouts unknown'),ppBtn('card','l:'+l.id,PEOPLE.card==='l:'+l.id?'Hide':'Profile'),k&&k.here&&!hostile?ppBtn('talk','l:'+l.id,'Talk'):''],
    'Lord of the '+ppFac(l.fac)+(l.lv?' · level '+l.lv:'')+(l.renown?' · renown '+l.renown:'')+(w.length?'<br>Last: '+w[w.length-1].why:'')+(fr.length?'<br>Friends: '+fr.map(o=>o.name).join(', '):'')+(rv.length?'<br>Rivals: '+rv.map(o=>o.name).join(', '):'')+
    (hostile?'<br><span class="bad">Your realms are at odds.</span>':''))}
function peopleBody(){
  const tab=PEOPLE.tab,lords=W.lords.filter(l=>!l.gone);
  if(tab==='comps'){const ids=Object.keys(P.comps||{});return ids.length?ids.map(id=>{const c=compInit(id),st=compStats(id),w=compWhere(id);
      return ppEntry('c:'+id,'<img class="pp-pic" src="'+portrait(id)+'" alt="">',COMPS[id].n+' <span class="muted">Lv '+c.lv+'</span>',[w.where,(c.hurt>G.day?'<span class="bad">Wounded until day '+c.hurt+'</span>':'<span class="good">Fit</span>')+' · '+st.hp+' hp · '+(c.role?ROLES[c.role]:'no role')],
        [ppBtn('look','c:'+id,'Show on map'),ppBtn('card','c:'+id,PEOPLE.card==='c:'+id?'Hide':'Profile'),G.mode==='world'&&!G.modal?ppBtn('manage',id,'Manage'):''],
        COMPS[id].d+'<br>'+apName(c.ap)+' · '+st.dmg+' damage'+(c.perks.length?' · '+c.perks.map(p=>COMP_PERKS[p].n).join(', '):'')+(c.party?'<br>Leading '+c.party.troops.length+' soldiers':''))}).join('')
    :'<p class="muted">No companions yet. Look for them in town taverns.</p>'}
  if(tab==='lords')return FIDS.filter(f=>!W.dead[f]).map(f=>{const ls=lords.filter(l=>l.fac===f);return ls.length?'<div class="lab pp-grp">'+ppFac(f)+' · '+ls.length+' lords</div>'+ls.map(l=>ppLord(l)).join(''):''}).join('');
  if(tab==='known'){const qs=P.quests.filter(q=>{const Q=Quest.as(q);return Q.cat==='job'&&!Q.story}).map(q=>{const l=q.lord&&lords.find(x=>x.name===q.giver);if(l)return ppLord(l,'gave you '+q.title);const t=townBy(q.home),here=G.mode==='town'&&G.town&&G.town.ref===t;
      return ppEntry('q:'+q.id,ppEmblem(t&&t.owner),'The steward of '+q.home,['In '+q.home+(here?' (here)':''),'Gave you: '+q.title],[ppBtn('look','t:'+q.home,'Show on map'),here?ppBtn('talk','q:'+q.home,'Talk'):''],null)});
    const met=lords.filter(l=>((P.lrelWhy||{})[l.id]||[]).length&&!P.quests.some(q=>q.lord&&q.giver===l.name)).map(l=>ppLord(l));
    return qs.length||met.length?(qs.length?'<div class="lab pp-grp">Quest givers</div>'+qs.join(''):'')+(met.length?'<div class="lab pp-grp">Lords you have dealt with</div>'+met.join(''):''):'<p class="muted">No one yet. Take work from a town’s notices or a lord, and they will be here.</p>'}
  return FIDS.filter(f=>!W.dead[f]).map(f=>{const hs=fiefsOf(f),ls=lords.filter(l=>l.fac===f&&!l.dead),top=ls.slice().sort((a,b)=>(b.renown||0)-(a.renown||0))[0],war=enemiesOf(f),seat=realmSeat(f);
    return ppEntry('r:'+f,ppEmblem(f),ppFac(f),['Foremost lord: '+(top?top.name:'none in the field')+' · '+hs.length+' holding'+(hs.length===1?'':'s'),war.length?'<span class="bad">At war with</span> '+war.map(ppFac).join(', '):'At peace'],
      [ppBtn('look','r:'+f,'Show on map',seat?'':'You know none of its holdings'),ppBtn('card','r:'+f,PEOPLE.card==='r:'+f?'Hide':'Profile')],
      FACS[f].d+'<br>Your honor: '+honorWith(f)+(P.fac===f?' · <span class="good">you serve them</span>':hostileTo(f)?' · <span class="bad">hostile to you</span>':'')+'<br>Holds: '+(hs.map(t=>t.name).join(', ')||'nothing')+'<br>Lords: '+ls.length)}).join('');
}
// a realm's seat on the map: its city, else its first holding, if you know where it is
function realmSeat(f){const hs=fiefsOf(f).filter(t=>seenTile(t.tx,t.ty));return hs.find(t=>t.kind==='city')||hs[0]||null}
function peopleRender(){
  const E=PEOPLE.el;if(!E)return;if(!PEOPLE.on)return;
  const keep=E.list.scrollTop;E.tabs.innerHTML=[['comps','Companions'],['lords','Lords'],['known','Known'],['realms','Realms']].map(([k,n])=>'<button class="btn sm'+(PEOPLE.tab===k?' on':'')+'" type="button" data-pp="tab" data-arg="'+k+'" aria-pressed="'+(PEOPLE.tab===k)+'">'+n+'</button>').join('');
  const h=peopleBody();if(h!==PEOPLE.html){PEOPLE.html=h;E.list.innerHTML=h;E.list.scrollTop=keep}peopleMap();// (redrawn only when something it says changed: a button is never swapped under a click)
}
// the spot an entry stands for (only what you know), and its name
function ppSpot(arg){const [k,id]=String(arg).split(/:(.*)/);
  if(k==='c'){if(!P.comps[id])return null;const w=compWhere(id);return {x:w.x,y:w.y,n:COMPS[id].n}}
  if(k==='l'){const l=W.lords.find(x=>String(x.id)===id),s=l&&lordKnown(l);return s?{x:s.x,y:s.y,n:l.name}:null}
  if(k==='t'){const t=townBy(id);return t&&seenTile(t.tx,t.ty)?{x:t.x,y:t.y,n:t.name}:null}
  if(k==='r'){const t=realmSeat(id);return t?{x:t.x,y:t.y,n:FACS[id].n+' · '+t.name}:null}
  return null}
// the drawer's small map: the land as you know it (the minimap's layers), centred on the spot looked at, and a ring on it
function peopleMap(){
  const c=PEOPLE.el.map,L=PEOPLE.look;c.hidden=!L;if(!L||typeof WorldArt==='undefined')return;
  const Z=4,w=c.width=240,h=c.height=Math.round(w*(c.clientWidth?c.clientHeight/c.clientWidth:.5)),g=c.getContext('2d'),x0=L.x/TILE-w/Z/2,y0=L.y/TILE-h/Z/2;// (Z: canvas px a tile; x0, y0: its corner, in tiles)
  g.imageSmoothingEnabled=false;g.fillStyle='#05070b';g.fillRect(0,0,w,h);
  const lay=src=>{const f=src.width/MW;g.drawImage(src,x0*f,y0*f,w/Z*f,h/Z*f,0,0,w,h)};
  lay(WorldArt.mini(Math.max(1,Math.round(MW/256))));g.globalAlpha=.4;lay(landMiniCv());g.globalAlpha=1;lay(fogMiniCv());
  const at=(x,y)=>[(x/TILE-x0)*Z,(y/TILE-y0)*Z];
  {const [px,py]=at(P.x,P.y);g.fillStyle='#fff';g.fillRect(Math.round(px)-2,Math.round(py)-2,4,4)}
  g.strokeStyle='#e8b94a';g.lineWidth=2;g.beginPath();g.arc(w/2,h/2,8,0,7);g.stroke();g.fillStyle='#e8b94a';g.fillRect(w/2-1,h/2-1,2,2);
  g.font='bold 11px Arial';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#000';g.strokeText(L.n,w/2,h/2-13);g.fillStyle='#ffe9a8';g.fillText(L.n,w/2,h/2-13);
}
// Show on map: the drawer's map centred on them; on the world, a ring where they stand while they are on the screen
function peopleLook(arg){const s=ppSpot(arg);if(!s)return;PEOPLE.look=s;peopleMap();peoplePing()}
function peoplePing(){
  const E=PEOPLE.el,L=PEOPLE.look,t0=performance.now();if(!E||!L)return;
  const put=()=>{const r=cv.getBoundingClientRect(),sr=E.root.getBoundingClientRect(),k=r.width/cv.width,x=(L.x-G.cam.x)*k+r.left-sr.left,y=(L.y-G.cam.y)*k+r.top-sr.top,on=G.mode==='world'&&x>=0&&y>=0&&x<=sr.width&&y<=sr.height;
    E.ping.hidden=!on;E.ping.style.left=Math.round(x)+'px';E.ping.style.top=Math.round(y)+'px';if(PEOPLE.look===L&&performance.now()-t0<4000)requestAnimationFrame(put);else E.ping.hidden=true};
  put();
}
// Talk, in the same place: a lord holding court in this town, or one by you on the map (realms.js lordMeet; Leave brings you
// back to the town: peopleTalkBack); the steward who gave you work here: the Notices
function peopleTalk(arg){const [k,id]=String(arg).split(/:(.*)/);
  if(k==='q'){if(G.mode==='town'&&G.town&&G.town.ref.name===id){peopleToggle(false);act('tab','jobs')}return}
  const l=k==='l'&&W.lords.find(x=>String(x.id)===id),s=l&&lordKnown(l);if(!s||!s.here||hostileTo(l.fac)&&!lordSpares(l))return;
  peopleToggle(false);PEOPLE.back=G.mode==='town'&&!G.town.inScene?G.town.ref:null;lordMeet(l)}
function peopleTalkBack(){const t=PEOPLE.back;PEOPLE.back=null;if(!t||G.mode!=='dialog'||!G.town||G.town.ref!==t)return false;G.enc=null;G.mode='town';renderTown();return true}
function peopleClick(e){const b=e.target.closest('[data-pp]');if(!b||b.disabled)return;const a=b.dataset.pp,arg=b.dataset.arg;
  if(a==='tab'){PEOPLE.tab=arg;PEOPLE.card=null;PEOPLE.el.list.scrollTop=0}
  else if(a==='card')PEOPLE.card=PEOPLE.card===arg?null:arg;
  else if(a==='look')return peopleLook(arg);
  else if(a==='talk')return peopleTalk(arg);
  else if(a==='manage'){peopleToggle(false);return openComp(arg)}
  else if(a==='close')return peopleToggle(false);
  peopleRender()}
// built once the page is there (not in the wiki, which has no game screen)
function peopleInit(){
  const scr=document.getElementById('screen');if(!scr||PEOPLE.el)return;const root=document.createElement('div');root.className='people';root.id='people';
  root.innerHTML='<div class="pp-scrim"></div><span class="pp-ping" hidden></span>'+
    '<aside class="pp-drawer" role="dialog" aria-label="People"><div class="pp-head"><h2>People</h2><button class="btn sm" type="button" data-pp="close" title="Close (P or Esc)">Close</button></div><div class="pp-tabs tabs" role="group" aria-label="Who"></div><canvas class="pp-map" hidden></canvas><div class="pp-list"></div></aside>';
  scr.appendChild(root);const q=s=>root.querySelector(s);PEOPLE.el={root,tab:document.getElementById('peopleBtn')||document.createElement('button'),tabs:q('.pp-tabs'),list:q('.pp-list'),map:q('.pp-map'),ping:q('.pp-ping')};
  PEOPLE.el.tab.addEventListener('click',()=>peopleToggle());q('.pp-scrim').addEventListener('click',()=>peopleToggle(false));q('.pp-drawer').addEventListener('click',peopleClick);
  peopleRender();
}
peopleInit();
