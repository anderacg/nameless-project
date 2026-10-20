'use strict';
/* ---------- a holding's rail (window.js): its places down the left, the chosen one's window beside it ----------
   G.town.tab: the place open (null: the overview, what the town is and what is notable in it); G.town.bld: in your Fief, the
   building open (null: the holding's overview); G.town.direct: opened straight from someone in the streets (scene.js), so there
   is no window behind it to go Back to, only out. The places are the window's old tabs (townTabs, which the streets share),
   with the lord's hall and the tournament as places of their own; each place's content is still town.js renderTown's.
   In your own fief the Fief place turns the rail into the holding's: its walls, houses and estates, each with its own window */
// key → its name (an area of the holding, as the rooms of a house), a short one for a slim rail, its icon; in this order down the rail
const PLACES={trade:{n:'Market square',short:'Market',ico:'stall'},tavern:{n:'Tavern',ico:'mug'},smith:{n:'Smithy',ico:'anvil'},stable:{n:'Stable',ico:'shoe'},recruit:{n:'Barracks',ico:'shield'},
  hall:{n:'Lord’s hall',short:'Hall',ico:'crown'},jobs:{n:'Notice board',short:'Notices',ico:'scroll'},tourney:{n:'The lists',short:'Lists',ico:'renown'},stores:{n:'Storehouse',short:'Stores',ico:'crate'},
  garrison:{n:'Walls & garrison',short:'Walls',ico:'tower'},fief:{n:'Steward’s office',short:'Steward',ico:'banner'},siege:{n:'Siege camp',short:'Siege',ico:'ladder'}};
// the places a holding has: its tabs, the hall where a lord holds court (towns and castles, or any holding with a lord inside),
// the lists where it holds tournaments
function townPlaces(t){const ks=townTabs(t).map(x=>x[0]);if(t.kind!=='village'||lordsInside(t).length)ks.push('hall');if(t.T.tourney)ks.push('tourney');
  return Object.keys(PLACES).filter(k=>k!=='siege'&&ks.includes(k))}// (an attack on the whole holding: on its overview)
const shut=t=>Timed.of(t).has('sacked')?'sacked':Timed.of(t).has('raided')?'raided':null;
// a quest of yours to report here (the Notice board's dot on the rail); the companions waiting in its tavern
const questHere=t=>P.quests.some(q=>canReportAt(q,t)&&questReady(q));
const compsHere=t=>Object.keys(COMPS).filter(id=>compTown(id)===t&&!P.comps[id]);
// the rail's header (window.js): the holding's colours, its name and owner (with your gold); a click: its overview (‹ when that is
// a step back). Also an estate's rail (estates.js)
const ownerTag=t=>{const f=FACS[t.owner];return f?'<span style="color:'+f.col+'">'+(t.owner==='player'?'Yours':f.n)+'</span>':cap1(t.label)};
const townHead=(t,back)=>({fac:t.owner,name:t.name,sub:ownerTag(t),back});

/* the overview: what the holding is, who holds it and how it fares, and what is notable here today */
function townOverview(t){
  const f=FACS[t.owner],ls=lordsInside(t),cell=(n,v,c)=>'<span><b>'+n+'</b><span'+(c?' class="'+c+'"':'')+'>'+v+'</span></span>',fd=t.stock?foodDays(t):null,st=standingAt(t);
  const notes=[besieged(t)&&['bad','Under siege.'],Timed.of(t).has('sacked')&&['bad','Sacked: ruined for '+Timed.of(t).daysLeft('sacked')+' more days.'],!Timed.of(t).has('sacked')&&Timed.of(t).has('raided')&&['bad','Raided: ruined for '+Timed.of(t).daysLeft('raided')+' more days.'],
    Timed.of(t).has('turmoil')&&['gold','In turmoil after changing hands.'],t.stock&&foodDays(t)<3&&['bad','Hungry: food for '+foodDays(t)+' days.'],
    ls.length&&['', 'Lords inside: '+ls.map(l=>l.name+' and '+l.troops.length+' soldiers').join(', ')+'.'],
    P.stay&&P.stay.town===t.name&&['good','Your band is staying here.'],
    questHere(t)&&['gold','A quest of yours is ready to report at the Notice board.'],
    compsHere(t).length&&['gold','In the Tavern: '+compsHere(t).map(id=>COMPS[id].n).join(' and ')+' for hire.'],
    !compsHere(t).length&&t.T.broker&&prisonerCount()&&['gold','In the Tavern: the ransom broker pays '+ransomValue()+'g for your prisoners.'],
    townPlaces(t).includes('tourney')&&['gold','The lists: a tournament today, 10 gold to enter.']].filter(Boolean);
  return '<p class="muted">'+cap1(an(t.label))+' of the '+(f?'<span style="color:'+f.col+'">'+f.n+'</span>':'free folk')+'. '+t.note+'</p>'+
    '<div class="loot-stats tstats">'+[['Held by',f?'<span style="color:'+f.col+'">'+(t.owner==='player'?'You':f.n)+'</span>':'—'],['Folk',t.races.map(r=>RACES[r].n).join(', ')],['People',(t.pop||0)],['Prosperity',Math.round(t.pros||0)+'%'],
      ['Garrison',t.gar+(ls.length?' + '+ls.length+' lord'+(ls.length>1?'s':''):'')],['Walls',WALL_N[wallOf(t)]],['Food',fd==null?'—':fd+' days',fd!=null&&fd<3?'bad':''],['Your standing',st,st>=REP_NEED[1]?'gold':'']].map(x=>cell(...x)).join('')+'</div>'+
    (notes.length?'<div class="lab">Today</div><ul class="tnotes">'+notes.map(([c,s])=>'<li'+(c?' class="'+c+'"':'')+'>'+s+'</li>').join('')+'</ul>':'')+letterTownHtml(t)+
    '<p class="muted" style="font-size:13px">'+(resText(t)?'Its land yields '+resText(t)+'. ':'')+'Estates: '+estateLine(t)+'.</p>'+
    (G.town.inScene?'':'<div class="btns">'+(hasScene(t)?'<button class="btn" type="button" data-act="scene-enter">'+SCENES[t.T.scene].hint+'</button>':'')+(P.stay&&P.stay.town===t.name?'<button class="btn" type="button" data-act="sy-leave">Leave '+t.label+'</button>':stayBtn(t))+'</div>')+
    (townTabs(t).some(x=>x[0]==='siege')&&!G.town.inScene?siegeBody(t):'')+
    '<p class="muted" style="font-size:13px">Choose a place on the left'+(G.mouse&&G.mouse.type==='touch'?'':' (or its number key)')+'.</p>';
}

/* the Lord's hall: who holds it, the lords holding court here (a card each: Talk), and the realm's mercenary contract */
function hallBody(t){
  const f=FACS[t.owner],ls=lordsInside(t),sw=g=>'<span style="color:'+FACS[g].col+'">'+FACS[g].n+'</span>',b=(a,l)=>'<button class="btn sm" type="button" data-act="'+a+'">'+l+'</button>';
  return '<div class="lab">Held by</div><p>'+(t.owner==='player'?'You hold '+t.name+'. Its reeve keeps the ledgers in the Steward’s office.':f?'The '+sw(t.owner)+'. Your honor with them: '+honorWith(t.owner)+'. '+(enemiesOf(t.owner).length?'At war with the '+enemiesOf(t.owner).map(sw).join(' and the ')+'.':'At peace.'):'No realm.')+'</p>'+
    '<div class="lab">Lords holding court</div>'+(ls.length?railCards(ls.map(l=>({fac:l.fac,name:l.name,role:'Lord of the '+sw(l.fac),facts:[l.troops.length+' soldiers quartered here','Toward you: '+relTag(relWith(l))],
      acts:[['hall-talk',l.id,'Talk',hostileTo(l.fac)&&!lordSpares(l)?'Your realms are at odds':'']]}))):'<p class="muted">None today.</p>')+
    (!t.T.contract||t.owner==='player'?'':'<div class="lab">Service</div>'+(P.fac===t.owner?railRow('Your contract','The '+f.n+' pays you 1 gold per troop each day.',b('end-contract','End contract'))
      :P.fac?'<p class="muted">You serve the '+sw(P.fac)+'.</p>':railRow('Mercenary contract','Serve the '+f.n+' for 1 gold per troop each day. Their enemies become yours.',b('contract','Sign'))));
}
// the lists: one bout against the town champion
const tourneyBody=t=>'<p>One-on-one against the town champion, before the crowd.</p>'+railCards([{pic:portrait('chief'),name:'The town champion',role:'Waiting in the lists',facts:[['Win 45 gold and renown','gold'],'Entry 10 gold · you have '+P.gold],
  acts:[['tourney',null,'Enter 10g',P.gold<10?'Not enough gold':'']]}]);

/* your holding: its walls, houses and estates down the rail, each with its window (estates.js builds their rows) */
const HOLD_ICO={wall:'tower',house:'house',farm:'wheat',pasture:'sheep',lumber:'axe',mine:'pick',quarry:'stone',port:'anchor',workshop:'spool',smithy:'anvil',brewery:'barrel',granary:'sack',market:'stall'};
const bldName=k=>k==='wall'?'Walls':k==='house'?'Houses':ESTATES[k].n;
const bldKeys=()=>['wall','house',...Object.keys(ESTATES)];
const bldShort=k=>k==='workshop'?'Weavers':k==='lumber'?'Wood':bldName(k).split(' ')[0];
// a building's status: being built, wrecked, idle and why, short of hands or fields, or working
function bldStatus(t,k){
  const w=t.work,pct=()=>'building '+Math.round(workProg(t)*100)+'%';
  if(w&&w.k===k)return [pct(),'gold'];
  if(k==='wall')return [WALL_N[wallOf(t)],''];
  if(k==='house'){const n=(t.lots||[]).filter(l=>l.k==='house').length;return housingFull(t)?[n+' · full','bad']:[n+' · room for '+housing(t),'']}
  const lv=bldLv(t,k),M=MAKE[k]||{},out=(t.last&&t.last.out)||{};
  if(!lv)return bldCap(t,k)?[needsMet(t,k)?'not built':'needs '+needsText(k),'']:['no land',''];
  if(sabotaged(t,k))return ['sabotaged','bad'];
  if(ruined(t))return ['idle: ruined','bad'];
  if(besieged(t))return ['idle: siege','bad'];
  if(M.in&&M.out&&t.last&&!Object.keys(M.out).some(g=>out[g]))return ['idle: no '+Object.keys(M.in).map(g=>GOODS[g].n.toLowerCase()).join(', '),'bad'];
  if(PLOTS[k]&&fieldShare(t,k)<1)return ['short of fields','bad'];
  if(M.out&&workerScale(t)<1)return ['short of workers','gold'];
  return ['level '+lv+(M.out?' · working':''),'good'];
}
function holdingItems(t){return [{act:'tab',arg:'fief',ico:'banner',n:PLACES.fief.n,short:PLACES.fief.short,on:!G.town.bld},
  ...bldKeys().map(k=>{const lv=ESTATES[k]?bldLv(t,k):1;return {act:'bld',arg:k,ico:HOLD_ICO[k],n:bldName(k),short:bldShort(k),on:G.town.bld===k,dim:!lv&&!(t.work&&t.work.k===k)}})]}
// a building's window: what it is and does, its state (bldTop), its workers, what it made, the stores of what it makes (bldWorks;
// both also an estate's areas on the map, here: you stand at it: estates.js), and building it (bldBuild)
const bldBody=(t,k)=>bldInfo(t,k)+bldBuild(t,k);
const bldInfo=(t,k,here)=>bldTop(t,k)+bldWorks(t,k,here);
const bldCell=(n,v,c)=>'<span><b>'+n+'</b><span'+(c?' class="'+c+'"':'')+'>'+v+'</span></span>';
function bldTop(t,k){
  const [st,tone]=bldStatus(t,k),cell=bldCell;
  let h='<p>'+(k==='wall'?'The fortification of the centre: walls make every defender stronger, sieges longer and the garrison bigger.':k==='house'?'Houses give the people room to live; a full holding grows no more and sends people away.':ESTATES[k].d)+'</p>';
  if(k==='wall'||k==='house')h+='<div class="loot-stats">'+cell('State',st,tone)+(k==='wall'?cell('Defenders fight as','level '+(1+wallOf(t)))+cell('Garrison up to',fiefCap(t)):cell('People',Math.round(t.pop||0))+cell('Room for',housing(t)))+'</div>';
  else{const lv=bldLv(t,k),M=MAKE[k]||{},ws=workerScale(t);
    h+='<div class="loot-stats">'+cell('State',st,tone)+cell('Level',lv+' / '+(bldCap(t,k)||'–'))+(M.out?cell('Workers',lv?lv*WORKERS+' needed · '+Math.round(ws*100)+'% at work':'—',ws<1&&lv?'gold':''):'')+
      (PLOTS[k]&&lv?cell('Fields',plotsAt(t,k,lv).length+' of '+PLOTS_AT[k](lv)):'')+'</div>'}
  return h;
}
function bldWorks(t,k,here){
  if(k==='wall'||k==='house')return '';const lv=bldLv(t,k),M=MAKE[k]||{},gs=ESTATES[k].goods,hands=W.folk.filter(f=>f.home===t.name&&f.k===k),L=t.last||{};let h='';
  {if(lv&&M.out)h+='<div class="lab">Production</div><p style="font-size:14px">'+(Object.keys(M.out).some(g=>(L.out||{})[g])?'Made yesterday: '+Object.keys(M.out).filter(g=>(L.out||{})[g]).map(g=>L.out[g]+' '+GOODS[g].n.toLowerCase()).join(', ')+'.':'Nothing made yesterday.')+
      (M.in?' Uses '+Object.keys(M.in).map(g=>M.in[g]*lv+' '+GOODS[g].n.toLowerCase()).join(' and ')+' a day from the stores.':'')+
      (ESTATES[k].work?' '+(hands.length?hands.length+' '+ESTATES[k].work+(hands.length>1?'s':'')+' about'+(hands.some(f=>f.st!=='in')?', '+hands.filter(f=>f.st!=='in').length+' carrying the day’s load':'')+(here?'.':'; meet them at the estate on the map.'):here?'':'Its '+ESTATES[k].work+'s are met at the estate on the map.'):'')+'</p>';
    if(gs.length){ensureEcon(t);h+='<div class="lab">In store</div><p style="font-size:14px">'+gs.map(g=>GOODS[g].n+' <b>'+Math.floor(t.stock[g]||0)+'</b>'+(marketState(t,g)?' <span class="'+(marketState(t,g)==='shortage'?'bad':'good')+'">('+marketState(t,g)+')</span>':'')).join(' · ')+'</p>'}}
  return h;
}
function bldBuild(t,k){
  const w=t.work;let h='';
  if(w&&w.k===k)h+='<p class="gold" style="font-size:13px">Done in '+Math.max(1,w.done-G.day)+' days'+(besieged(t)?' (stopped by the siege)':'')+'.</p>';
  else if(w)h+='<p class="muted" style="font-size:13px">Builders are busy with '+(w.k==='wall'?'the walls':w.k==='house'?'a house':'the '+ESTATES[w.k].n.toLowerCase())+' for '+Math.max(1,w.done-G.day)+' more days. One project at a time.</p>';
  return h+'<div class="lab">'+(k==='wall'?'Fortify':k==='house'?'Build':'Build, upgrade or pull down')+'</div>'+estateRow(t,k);
}

/* the window: the rail (the town's places, or your holding's buildings) and the chosen one's window */
function showTown(t,body){
  const s=G.town,tab=s.tab,hold=tab==='fief'&&t.owner==='player',bld=hold&&s.bld,P0=PLACES[tab];
  const items=hold?holdingItems(t):townPlaces(t).map(k=>{const p=PLACES[k];return {act:'tab',arg:k,ico:p.ico,n:p.n,short:p.short,on:k===tab,dot:k==='jobs'&&questHere(t)}});
  const close=['leave',null,s.inScene?'Back to the streets':P.stay&&P.stay.town===t.name?'Back to your lodgings':'Leave '+t.label];
  showRail({head:{act:['tab','home'],on:!tab,...townHead(t,hold)},label:hold?'Walls and estates':'Places',items,
    title:bld?bldName(bld):P0&&tab?(hold?'Your holding':P0.n):t.name,sub:tab?t.name+(hold?' · '+(bld?'your holding':fiefIncome(t)+' gold a day'):''):cap1(t.label)+(t.owner?' of the '+FACS[t.owner].n:''),gold:true,
    body:(s.greet?'<p class="gold">'+s.greet+'</p>':'')+body,back:bld?['tab','fief','Back']:tab&&!s.direct?['tab','home','Back']:null,close},'town:'+t.name+':'+(tab||'')+':'+(bld||''));
}
