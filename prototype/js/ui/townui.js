'use strict';
/* ---------- a holding's rail (window.js): its places down the left, the chosen one's window beside it ----------
   G.town.tab: the place open (null: the overview, what the town is and what is notable in it); G.town.bld: in your Fief, the
   building open (null: the holding's overview); G.town.direct: opened straight from someone in the streets (scene.js), so there
   is no window behind it to go Back to, only out. The places are the window's old tabs (townTabs, which the streets share),
   with the lord's hall and the tournament as places of their own; each place's content is still town.js renderTown's.
   In your own fief the Fief place turns the rail into the holding's: its walls, houses and estates, each with its own window */
// key → its name, a short one for a slim rail, its icon; in this order down the rail
const PLACES={trade:{n:'Market',ico:'stall'},tavern:{n:'Tavern',ico:'mug'},smith:{n:'Smithy',ico:'anvil'},stable:{n:'Stable',ico:'shoe'},recruit:{n:'Barracks',ico:'shield'},
  hall:{n:'Lord’s hall',short:'Hall',ico:'crown'},jobs:{n:'Notices',ico:'scroll'},tourney:{n:'Tournament',short:'Tourney',ico:'renown'},stores:{n:'Stores',ico:'crate'},
  garrison:{n:'Garrison',ico:'tower'},fief:{n:'Fief',ico:'banner'},siege:{n:'Siege',ico:'ladder'}};
// the places a holding has: its tabs, the hall where a lord holds court (towns and castles, or any holding with a lord inside),
// the lists where it holds tournaments
function townPlaces(t){const ks=townTabs(t).map(x=>x[0]);if(t.kind!=='village'||lordsInside(t).length)ks.push('hall');if(t.T.tourney)ks.push('tourney');
  return Object.keys(PLACES).filter(k=>ks.includes(k))}
const shut=t=>until(t,'sacked')?'sacked':until(t,'raided')?'raided':null;
// a place's status on the rail: a few words, and their tone (gold: something for you; bad: closed or in trouble). Read only:
// nothing here restocks a shop or posts jobs (they keep their own days)
function placeStatus(t,k){
  const cl=shut(t),sh=W.shops&&W.shops[t.name],jobs=P.jobs&&P.jobs[t.name];
  if(k==='trade'){ensureEcon(t);const s=Object.keys(GOODS).filter(g=>marketState(t,g)==='shortage');return s.length>1?[s.length+' goods scarce','']:s.length?['short of '+GOODS[s[0]].n.toLowerCase(),'']:['prices fair','']}
  if(k==='tavern'){const c=Object.keys(COMPS).find(id=>compTown(id)===t&&!P.comps[id]);
    return P.stay&&P.stay.town===t.name?['your lodgings','good']:c?[COMPS[c].n+' for hire','gold']:t.T.broker&&prisonerCount()?['ransom '+ransomValue()+'g','gold']:['rooms and rumours','']}
  if(k==='smith')return cl?['closed (burned)','bad']:sh&&G.day-sh.day<7?[sh.items.length?sh.items.length+' for sale':'sold out','']:['new stock',''];
  if(k==='stable')return cl?['closed (burned)','bad']:[stableStock(t).length+' mounts',''];
  if(k==='recruit'){const v=Math.floor(t.vol||0);return cl?['closed ('+cl+')','bad']:until(t,'turmoil')?['closed (turmoil)','bad']:[v+(v===1?' recruit':' recruits'),'']}
  if(k==='hall'){const ls=lordsInside(t);return ls.length?[ls.length>1?ls.length+' lords inside':ls[0].name+' inside','gold']:t.owner==='player'?['your hall','good']:P.fac&&P.fac===t.owner?['your employer','good']:t.T.contract&&!P.fac&&t.owner!=='player'?['contract offered','']:['no lord in','']}
  if(k==='jobs'){const ready=P.quests.some(q=>canReportAt(q,t)&&questReady(q)),mine=P.quests.filter(q=>canReportAt(q,t)).length;
    return ready?['Quest ready!','gold']:mine?[mine+' of yours','']:jobs&&G.day-jobs.day<JOB_REFRESH?[jobs.list.length?jobs.list.length+' jobs':'no work','']:['new notices','']}
  if(k==='tourney')return ['today · 10g to enter','gold'];
  if(k==='stores'){ensureEcon(t);const n=Object.keys(GOODS).filter(g=>(t.stock[g]||0)>=1).length;return [n+' goods','']}
  if(k==='garrison')return besieged(t)?['under siege','bad']:[t.gar+' soldiers'+(lordsInside(t).length?' + lords':''),''];
  if(k==='fief')return t.work?['building '+Math.round(workProg(t)*100)+'%','gold']:[fiefIncome(t)+' gold a day','good'];
  if(k==='siege'){const [n,c]=odds(rating(siegeDefenders(t).list,siegeLv(t)));return [n+' to attack',c==='bad'?'bad':'']}
  return ['',''];
}
// the rail's header (window.js): the holding's colours, its name and owner (with your gold); a click: its overview (‹ when that is
// a step back). Also an estate's rail (estates.js)
const ownerTag=t=>{const f=FACS[t.owner];return f?'<span style="color:'+f.col+'">'+(t.owner==='player'?'Yours':f.n)+'</span>':cap1(t.label)};
const townHead=(t,back)=>({fac:t.owner,name:t.name,sub:ownerTag(t),back});

/* the overview: what the holding is, who holds it and how it fares, and what is notable here today */
function townOverview(t){
  const f=FACS[t.owner],ls=lordsInside(t),cell=(n,v,c)=>'<span><b>'+n+'</b><span'+(c?' class="'+c+'"':'')+'>'+v+'</span></span>',fd=t.stock?foodDays(t):null,st=standingAt(t);
  const notes=[besieged(t)&&['bad','Under siege.'],until(t,'sacked')&&['bad','Sacked: ruined for '+(t.sacked-G.day)+' more days.'],!until(t,'sacked')&&until(t,'raided')&&['bad','Raided: ruined for '+(t.raided-G.day)+' more days.'],
    until(t,'turmoil')&&['gold','In turmoil after changing hands.'],t.stock&&foodDays(t)<3&&['bad','Hungry: food for '+foodDays(t)+' days.'],
    ls.length&&['', 'Lords inside: '+ls.map(l=>l.name+' and '+l.troops.length+' soldiers').join(', ')+'.'],
    P.stay&&P.stay.town===t.name&&['good','Your band is staying here.'],
    P.quests.some(q=>canReportAt(q,t)&&questReady(q))&&['gold','A quest of yours is ready to report at the Notices.'],
    ...townPlaces(t).filter(k=>['tavern','tourney'].includes(k)).map(k=>{const [s,c]=placeStatus(t,k);return c==='gold'&&[c,PLACES[k].n+': '+s+'.']})].filter(Boolean);
  return '<p class="muted">'+cap1(an(t.label))+' of the '+(f?'<span style="color:'+f.col+'">'+f.n+'</span>':'free folk')+'. '+t.note+'</p>'+
    '<div class="loot-stats tstats">'+[['Held by',f?'<span style="color:'+f.col+'">'+(t.owner==='player'?'You':f.n)+'</span>':'—'],['Folk',t.races.map(r=>RACES[r].n).join(', ')],['People',(t.pop||0)],['Prosperity',Math.round(t.pros||0)+'%'],
      ['Garrison',t.gar+(ls.length?' + '+ls.length+' lord'+(ls.length>1?'s':''):'')],['Walls',WALL_N[wallOf(t)]],['Food',fd==null?'—':fd+' days',fd!=null&&fd<3?'bad':''],['Your standing',st,st>=REP_NEED[1]?'gold':'']].map(x=>cell(...x)).join('')+'</div>'+
    (notes.length?'<div class="lab">Today</div><ul class="tnotes">'+notes.map(([c,s])=>'<li'+(c?' class="'+c+'"':'')+'>'+s+'</li>').join('')+'</ul>':'')+
    '<p class="muted" style="font-size:13px">'+(resText(t)?'Its land yields '+resText(t)+'. ':'')+'Estates: '+estateLine(t)+'.</p>'+
    (G.town.inScene?'':'<div class="btns">'+(hasScene(t)?'<button class="btn" type="button" data-act="scene-enter">'+SCENES[t.T.scene].hint+'</button>':'')+(P.stay&&P.stay.town===t.name?'<button class="btn" type="button" data-act="sy-leave">Leave '+t.label+'</button>':stayBtn(t))+'</div>')+
    '<p class="muted" style="font-size:13px">Choose a place on the left'+(G.mouse&&G.mouse.type==='touch'?'':' (or its number key)')+'.</p>';
}

/* the Lord's hall: who holds it, the lords holding court here, and the realm's mercenary contract */
function hallBody(t){
  const f=FACS[t.owner],ls=lordsInside(t),sw=g=>'<span style="color:'+FACS[g].col+'">'+FACS[g].n+'</span>',row=(a,b,acts,own)=>'<div class="row"><div class="info"><strong>'+a+'</strong><small>'+b+'</small></div>'+(own!=null?'<span class="own">'+own+'</span>':'')+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>';
  return '<div class="lab">Held by</div><p>'+(t.owner==='player'?'You hold '+t.name+'. Its reeve keeps the ledgers in your Fief.':f?'The '+sw(t.owner)+'. Your honor with them: '+honorWith(t.owner)+'. '+(enemiesOf(t.owner).length?'At war with the '+enemiesOf(t.owner).map(sw).join(' and the ')+'.':'At peace.'):'No realm.')+'</p>'+
    '<div class="lab">Lords holding court</div>'+(ls.length?ls.map(l=>row(l.name+' · '+sw(l.fac),l.troops.length+' soldiers quartered with the garrison',null,relTag(relWith(l)))).join(''):'<p class="muted">None today.</p>')+
    (!t.T.contract||t.owner==='player'?'':'<div class="lab">Service</div>'+(P.fac===t.owner?row('Your contract','The '+f.n+' pays you 1 gold per troop each day.','<button class="btn sm" type="button" data-act="end-contract">End contract</button>')
      :P.fac?'<p class="muted">You serve the '+sw(P.fac)+'.</p>':row('Mercenary contract','Serve the '+f.n+' for 1 gold per troop each day. Their enemies become yours.','<button class="btn sm" type="button" data-act="contract">Sign</button>')));
}
// the tournament: one bout against the champion
const tourneyBody=t=>'<p>One-on-one against the town champion, before the crowd. Win 45 gold and renown.</p><div class="row"><div class="info"><strong>Tournament</strong><small>Entry 10 gold · you have '+P.gold+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="tourney"'+(P.gold<10?' disabled':'')+'>Enter 10g</button></div></div>';

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
function holdingItems(t){return [{act:'tab',arg:'fief',ico:'banner',n:'Holding',short:'Holding',st:fiefIncome(t)+' gold a day',tone:'good',on:!G.town.bld},
  ...bldKeys().map(k=>{const [st,tone]=bldStatus(t,k),lv=ESTATES[k]?bldLv(t,k):1;return {act:'bld',arg:k,ico:HOLD_ICO[k],n:bldName(k),short:bldShort(k),st,tone,on:G.town.bld===k,dim:!lv&&!(t.work&&t.work.k===k)}})]}
// a building's window: what it is and does, its state, its workers, what it made, the stores of what it makes (bldInfo, also an
// estate's window on the map, here: you stand at it: estates.js), and building it (bldBuild)
const bldBody=(t,k)=>bldInfo(t,k)+bldBuild(t,k);
function bldInfo(t,k,here){
  const [st,tone]=bldStatus(t,k),L=t.last||{},cell=(n,v,c)=>'<span><b>'+n+'</b><span'+(c?' class="'+c+'"':'')+'>'+v+'</span></span>';
  let h='<p>'+(k==='wall'?'The fortification of the centre: walls make every defender stronger, sieges longer and the garrison bigger.':k==='house'?'Houses give the people room to live; a full holding grows no more and sends people away.':ESTATES[k].d)+'</p>';
  if(k==='wall'||k==='house')h+='<div class="loot-stats">'+cell('State',st,tone)+(k==='wall'?cell('Defenders fight as','level '+(1+wallOf(t)))+cell('Garrison up to',fiefCap(t)):cell('People',Math.round(t.pop||0))+cell('Room for',housing(t)))+'</div>';
  else{const lv=bldLv(t,k),M=MAKE[k]||{},gs=ESTATES[k].goods,hands=W.folk.filter(f=>f.home===t.name&&f.k===k),ws=workerScale(t);
    h+='<div class="loot-stats">'+cell('State',st,tone)+cell('Level',lv+' / '+(bldCap(t,k)||'–'))+(M.out?cell('Workers',lv?lv*WORKERS+' needed · '+Math.round(ws*100)+'% at work':'—',ws<1&&lv?'gold':''):'')+
      (PLOTS[k]&&lv?cell('Fields',plotsAt(t,k,lv).length+' of '+PLOTS_AT[k](lv)):'')+'</div>';
    if(lv&&M.out)h+='<div class="lab">Production</div><p style="font-size:14px">'+(Object.keys(M.out).some(g=>(L.out||{})[g])?'Made yesterday: '+Object.keys(M.out).filter(g=>(L.out||{})[g]).map(g=>L.out[g]+' '+GOODS[g].n.toLowerCase()).join(', ')+'.':'Nothing made yesterday.')+
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
  const items=hold?holdingItems(t):townPlaces(t).map(k=>{const [st,tone]=placeStatus(t,k),p=PLACES[k];return {act:'tab',arg:k,ico:p.ico,n:p.n,short:p.short,st,tone,on:k===tab}});
  const close=['leave',null,s.inScene?'Back to the streets':P.stay&&P.stay.town===t.name?'Back to your lodgings':'Leave '+t.label];
  showRail({head:{act:['tab','home'],on:!tab,...townHead(t,hold)},label:hold?'Walls and estates':'Places',items,
    title:bld?bldName(bld):P0&&tab?(hold?'Your holding':P0.n):t.name,sub:tab?t.name+(hold?' · '+(bld?'your holding':fiefIncome(t)+' gold a day'):''):cap1(t.label)+(t.owner?' of the '+FACS[t.owner].n:''),gold:true,
    body:(s.greet?'<p class="gold">'+s.greet+'</p>':'')+body,back:bld?['tab','fief','Back']:tab&&!s.direct?['tab','home','Back']:null,close},'town:'+t.name+':'+(tab||'')+':'+(bld||''));
}
