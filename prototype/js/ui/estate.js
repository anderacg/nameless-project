'use strict';
/* ---------- an estate's window (met on the map: its areas down the rail, what you can do to it, its actions, es-), and the
   Estates section of your Fief (estatesBody, estateRow). The estate itself is world/estates.js Estate ---------- */
/* met on the map: the estate's own areas down the rail (window.js), as the rooms of a house: its overview (the rail's header:
   what it is, its level, owner and state: townui.js bldTop), where its workers live (folk: a card for them, Talk: folk.js
   workerMeet), a pasture's pens (herd: its herd and what the pasture makes of it, to look at: nothing is sold), its fields, its
   works (what it made and its stores: townui.js bldWorks); what is done to the estate itself is on its overview (estateDeeds):
   building your own, raiding someone else's (its guards, sabotage, plunder and burning). G.est: the estate; G.estTab: the area
   open (null: the overview). The worker's talk opens on the same rail; Back returns to the area he was met in */
// each kind's areas, by what they hold: folk (its workers' home), herd (its herd's pens: only while it has one), fields, works
// (what it makes, its stores)
const ESTATE_AREAS={farm:{folk:'Farmhouse',fields:'Fields',works:'Barn'},pasture:{folk:'Herders’ hut',herd:'Pens',works:'Dairy'},lumber:{folk:'Woodcutters’ camp',works:'Log yard'},
  mine:{folk:'Miners’ camp',works:'Mine shaft'},quarry:{folk:'Quarrymen’s lodge',fields:'Quarry pit',works:'Stone yard'},port:{folk:'Fishers’ huts',works:'Piers'},
  workshop:{works:'Workshop'},smithy:{works:'Forge'},brewery:{works:'Brewhouse'}};
const WORKS_ICO={farm:'crate',pasture:'barrel'};
// its areas that apply: [key, name, icon, a few words on what is there (its overview's list)]
function estateMenus(o){
  const t=townBy(o.town),ms=[];if(!t)return ms;const k=o.k,E=ESTATES[k],A=ESTATE_AREAS[k]||{},lv=bldLv(t,k),own=t.owner==='player';
  const hands=W.folk.filter(f=>f.home===t.name&&f.k===k).length,herd=k==='pasture'&&lv&&herdOf(t),L=(t.last||{}).out||{},M=MAKE[k]||{};
  if(lv&&E.work&&A.folk)ms.push(['folk',A.folk,'house',hands?hands+' '+E.work+(hands>1?'s':'')+' about':'nobody about']);
  if(herd&&A.herd)ms.push(['herd',A.herd,'sheep',herd.n+' '+CRITTERS[herd.id].n.toLowerCase()+' grazing']);
  if(lv&&PLOTS[k]&&A.fields)ms.push(['fields',A.fields,HOLD_ICO[k],plotsAt(t,k,lv).length+' of '+PLOTS_AT[k](lv)+' worked']);
  if(lv&&A.works&&(M.out||E.goods.length))ms.push(['works',A.works,WORKS_ICO[k]||HOLD_ICO[k],Object.keys(M.out||{}).some(g=>L[g])?'made '+Object.keys(M.out).filter(g=>L[g]).map(g=>L[g]+' '+GOODS[g].n.toLowerCase()).join(', ')+' yesterday':'nothing made yesterday']);
  return ms;
}
// (a slim rail: the last word of a long name)
const areaShort=n=>{const w=n.split(' ');return w.length>1?cap1(w[w.length-1]):n};
// the rail round a window w ({title, sub, body, back, close}): tab the area chosen
function estateRail(o,tab,w,key){const t=townBy(o.town),lv=bldLv(t,o.k);
  showRail({head:{act:['es-tab','home'],on:!tab,fac:t.owner,name:ESTATES[o.k].n,sub:(lv?'Level '+lv:'Not built')+' · '+ownerTag(t),back:!!tab},label:'Estate of '+t.name,gold:true,...w,
    items:estateMenus(o).map(([k,n,ico])=>({act:'es-tab',arg:k,ico,n,short:areaShort(n),on:k===tab}))},'est:'+t.name+':'+o.k+':'+(tab||'')+':'+(key||''));
}
function estateMeet(o){
  const t=townBy(o.town),k=o.k;if(!t||!bldLv(t,k))return;G.est=o;G.estTab=null;G.mode='dialog';P.tx=null;G.chase=null;showEstate();
}
// back from a worker's talk: the estate again, at the area he was met in
function estateBack(o,tab){estateMeet(o);if(G.est){G.estTab=tab;showEstate()}}
function showEstate(){
  const o=G.est,t=townBy(o.town),k=o.k,ms=estateMenus(o),tab=ms.some(m=>m[0]===G.estTab)?G.estTab:null;G.estTab=tab;ensureEcon(t);
  const E=ESTATES[k],lv=bldLv(t,k),emp=P.fac&&P.fac===t.owner,ws=W.folk.filter(f=>f.home===t.name&&f.k===k),race=t.races[0],m=ms.find(x=>x[0]===tab);let body;
  if(!tab)body=(sabotaged(t,k)?'<p class="bad">Wrecked: it makes nothing until day '+t.sab[k]+'.</p>':'')+(lv&&PLOTS[k]&&fieldShare(t,k)<1?'<p class="bad">Fields: '+plotsAt(t,k,lv).length+' of the '+PLOTS_AT[k](lv)+' its level works (no open ground for more: it makes '+Math.round(fieldShare(t,k)*100)+'%).</p>':'')+
    (Timed.of(t).has('fear')?'<p class="bad">The workers are afraid to come out.</p>':'')+bldTop(t,k)+estateDeeds(t,k)+RAIL_SCREEN.overview(ms.map(([k,n,ico,note])=>({act:'es-tab',arg:k,n,note})));
  else if(tab==='folk'){const inn=ws.filter(f=>f.st==='in'),field=ws.filter(f=>f.st==='field').length,away=ws.length-inn.length-field;// (only those inside: the rest are met where they are, folk.js)
    body=(inn.length?railCards(inn.map(f=>{const kk=recruitKind(t,f);return {pic:workerPic(f.job,race,f.v),name:f.name,role:cap1(f.job)+' of the '+E.n.toLowerCase(),facts:['At work inside',Timed.of(t).has('fear')?['Afraid to come out','bad']:'',remembers(t,f)?['Remembers you','bad']:'','Recruit: '+ST[kk].n.toLowerCase()+', '+hireCost(kk)+'g'],
        acts:[['es-folk',f.id,'Talk'],['es-recruit',f.id,'Recruit',workerRecruitWhy(t,f)]]}})):'<p class="muted">Nobody is in: '+(field?'they are at work outside.':ws.length?'they are out with the day’s load.':'the '+E.work+'s are out of sight.')+'</p>')+
      (field?'<p class="muted">'+field+(inn.length?' more':'')+' at work outside on the '+E.n.toLowerCase()+': meet '+(field>1?'them':'him')+' there.</p>':'')+
      (away?'<p class="muted">'+away+' more out on the road to '+t.name+' with the day’s load: meet them there.</p>':'')+(lostHands(t,k)?'<p class="bad">'+lostHands(t,k)+' pair'+(lostHands(t,k)>1?'s':'')+' of hands short: it makes '+Math.round(handsLeft(t,k)*100)+'% until someone new moves in.</p>':'')+
      '<p class="muted" style="font-size:13px">A worker you recruit becomes a '+ST[recruitKind(t,{k,job:E.work})].n.toLowerCase()+' (tier 0, trains into '+ST[UP[recruitKind(t,{k,job:E.work})][0]].n+'s). The estate is a pair of hands short for '+REFILL_DAYS+' days'+(t.owner==='player'?'':'; '+t.name+' minds it a little (reputation −2)')+'.</p>'}
  else if(tab==='herd'){const c=herdOf(t),D=CRITTERS[c.id],out=(MAKE[k]||{}).out||{},f=plotsAt(t,k,lv).length;
    body='<p>The '+D.n.toLowerCase()+' graze behind the fence while the herders watch over them. The herd is the '+E.n.toLowerCase()+'’s own: what it gives goes to '+t.name+'.</p>'+
      railCards([{pic:critterPic(c.id),name:D.n,role:'The herd of the '+E.n.toLowerCase(),n:c.n,facts:[f+' of '+PLOTS_AT[k](lv)+' fields fenced',['Not for sale','muted']],
        note:'Each day at level '+lv+' it makes about '+Object.keys(out).map(g=>Math.round(out[g]*lv*10)/10+' '+GOODS[g].n.toLowerCase()).join(', ')+' for '+t.name+'’s stores.'}])}
  else if(tab==='fields'){const n=plotsAt(t,k,lv).length,need=PLOTS_AT[k](lv);
    body='<p>'+E.d+'</p>'+railRow('Fields worked',n<need?'<span class="bad">No open ground for more: it makes '+Math.round(fieldShare(t,k)*100)+'%</span>':'All its level works',null,n+' / '+need)+
      (lv<bldCap(t,k)?railRow('At level '+(lv+1),'It would work '+PLOTS_AT[k](lv+1)+' fields',null,null):'')}
  else if(tab==='works')body=bldWorks(t,k,true);
  estateRail(o,tab,{title:m?m[1]:E.n+' of '+t.name,sub:m?E.n+' of '+t.name:(lv?'Level '+lv:'Not built')+' · '+ownerTag(t),body,back:tab?['es-tab','home','Back']:null,close:['dlg-close',null,'Leave']});
}
// what you can do to the estate itself, on its overview, as its key actions (window.js railKeyActions): build up or pull down your
// own; sabotage, plunder or burn someone else's (its guards above them: a card, for what you would face); nothing for your employer's
function estateDeeds(t,k){const E=ESTATES[k],lv=bldLv(t,k),emp=P.fac&&P.fac===t.owner,w=t.work;
  if(t.owner==='player'){const cap=bldCap(t,k);
    return '<div class="lab">The '+E.n.toLowerCase()+'</div>'+(w&&w.k===k?'<p class="gold" style="font-size:13px">Done in '+Math.max(1,w.done-G.day)+' days'+(besieged(t)?' (stopped by the siege)':'')+'.</p>':
      w?'<p class="muted" style="font-size:13px">Builders are busy with '+(w.k==='wall'?'the walls':w.k==='house'?'a house':'the '+ESTATES[w.k].n.toLowerCase())+' for '+Math.max(1,w.done-G.day)+' more days. One project at a time.</p>':'')+
      railKeyActions(estateDeedList(t,k),lv>=cap?'At its best: level '+lv+' of '+cap+'.':'Built with gold and materials from '+t.name+'’s stock.')}
  if(!lv||emp)return '';
  const g=estateGuards(t,k),c=countsOf(g),host=hostileTo(t.owner),pb=CONDUCT.plunderEstate,bn=CONDUCT.burnEstate;
  return '<div class="lab">Raid it</div>'+railCards([{pic:portrait(g[0]),name:'Its guards',role:'Watching the '+E.n.toLowerCase()+' of '+t.name,n:g.length,facts:Object.keys(c).map(u=>c[u]+' × '+ST[u].n),
      note:g.length+' guards watch it (power '+rating(g)+' vs your '+partyPower()+').'}])+
    railKeyActions(estateDeedList(t,k),'Caught or fighting, '+(host?'you are already the '+FACS[t.owner].n+'’s enemy':'the '+FACS[t.owner].n+' turns hostile ('+pb.hostile+'–'+bn.hostile+' days)')+'. Each asks you first.');
}
// the estate's deeds: {icon, label, facts, act, arg, why, tip, ask (it cannot be undone: a confirm first, estateAsk), go (the act
// its Confirm sends)}: your own, build up or pull down; someone else's, sabotage, plunder, burn
function estateDeedList(t,k){const E=ESTATES[k],lv=bldLv(t,k);
  if(t.owner==='player'){const cap=bldCap(t,k),c=bldCost(k,lv+1),mats=ESTATE_MAT(k,lv+1),short=matsLacking(t,mats),w=t.work;
    return [cap&&lv<cap&&{icon:'house',label:lv?'Upgrade':'Place',act:'fief-build',arg:k,facts:[c+'g · '+workDays(t,lv+1)+' days','to level '+(lv+1),matsText(mats)],tip:(lv?'Upgrade':'Place')+' the '+E.n.toLowerCase()+': '+mt0(t,mats),
        why:w?'Already building':!lv&&!needsMet(t,k)?'Needs '+needsText(k):P.gold<c?'Not enough gold':short.length?'Short of '+short.join(', '):''},
      lv&&{icon:'axe',label:'Pull down',act:'es-ask',arg:'demolish',go:['fief-demolish',k],facts:['+'+Math.floor(bldCost(k,Math.max(1,lv))/2)+'g back','gone for good'],tip:'Pull the '+E.n.toLowerCase()+' down: half its last level’s cost back; it is gone for good'}].filter(Boolean)}
  const g=estateGuards(t,k),no=troopCount()<3?'Need 3 troops':'',host=hostileTo(t.owner),pb=CONDUCT.plunderEstate,bn=CONDUCT.burnEstate;
  return [{icon:'moon',label:'Sabotage',act:'es-ask',arg:'sabotage',go:['es-sabotage'],facts:[Math.round(sabotageChance(t,k)*100)+'% unseen','idle '+(3+2*lv)+' days'],why:sabotaged(t,k)?'Already wrecked':'',
      tip:'Sabotage it: slip in and wreck its work, so it makes nothing for '+(3+2*lv)+' days. Unseen, only rumour follows you (reputation −'+CONDUCT.sabotageEstate.rep+'); caught, you fight its guards and pay as for a plunder. Night, Scouting and Agility help; a big band and a big estate make it harder.'},
    {icon:'bag',label:'Plunder',act:'es-ask',arg:'plunder',go:['es-plunder'],facts:['fight '+g.length+' guards','reputation −'+pb.rep+' · honor −'+pb.honor],why:no,
      tip:'Plunder its stores: fight the guards and take what the estate made for '+t.name+': reputation there −'+pb.rep+', honor −'+pb.honor+(host?'':', and the '+FACS[t.owner].n+' turns hostile for '+pb.hostile+' days')+'.'},
    {icon:'fire',label:'Burn',act:'es-ask',arg:'burn',go:['es-burn'],facts:['fight '+g.length+' guards','down a level · reputation −'+bn.rep],why:no,
      tip:'Burn it: fight the guards, take what it made and burn it: it drops a level; reputation −'+bn.rep+', honor −'+bn.honor+(host?'':', hostile for '+bn.hostile+' days')+'; its people may leave.'}]}
// a deed that cannot be undone asks first (window.js railConfirm): what it does and costs; Confirm sends its act, Back the overview
function estateAsk(t,k,which){const d=estateDeedList(t,k).find(x=>x.arg===which);if(!d||d.why)return showEstate();
  railConfirm({title:d.label+' the '+ESTATES[k].n.toLowerCase()+'?',sub:ESTATES[k].n+' of '+t.name,text:d.tip,facts:d.facts,confirm:[d.go[0],d.go[1]??null,d.label],back:['es-tab','home','Back']})}
const mt0=(t,mats)=>{const l=matsLacking(t,mats);return 'needs '+matsText(mats)+(l.length?' (short: '+l.join(', ')+')':'')};
// your own estate's building buttons (estateRow: fief-build, fief-demolish), as in your Fief (siege.js fiefAct); placing a new one
// goes out to the map
function estateFief(a,arg){
  if(!a.startsWith('fief-'))return false;const t=townBy(G.est.town);if(!t)return true;fiefAct(a,arg,t);if(G.place){G.est=null;return true}
  updateHUD(true);showEstate();railFocus(a,arg);return true;
}
function estateAct(a,arg){
  // the rail: one of its areas, or home: its overview (from its workers too)
  if(a==='es-tab'){const o=G.est||G.wkFrom,t=o&&townBy(o.town);if(!t)return;if(!G.est){G.wk=G.wkFrom=null;G.est=o;G.mode='dialog'}
    G.estTab=arg==='home'?null:arg;return showEstate()}
  const o=G.est,t=o&&townBy(o.town);if(!t||!bldLv(t,o.k)){closeDialog();return}
  if(a==='es-folk'){const ws=W.folk.filter(f=>f.home===t.name&&f.k===o.k),f=arg&&ws.find(x=>x.id===arg)||ws.find(f=>f.st==='in')||ws[0];if(f){G.est=null;workerMeet(f,o)}return}// (one by his id, from his card)
  if(a==='es-recruit'){const f=W.folk.find(x=>x.id===arg&&x.home===t.name&&x.k===o.k);if(f&&workerRecruit(f))updateHUD(true);return showEstate()}
  if(a==='es-ask')return estateAsk(t,o.k,arg);
  if(a==='es-sabotage'&&P.fac!==t.owner&&t.owner!=='player'&&!sabotaged(t,o.k)){const k=o.k;G.est=null;train('scout',4);
    if(Math.random()<sabotageChance(t,k)){sabotage(t,k);addRep(t.name,-CONDUCT.sabotageEstate.rep,true);closeDialog();
      return notice('Sabotaged','Under cover your people foul the '+ESTATES[k].n.toLowerCase()+' of '+t.name+'. It will make nothing for '+(t.sab[k]-G.day)+' days, and nobody saw who did it.','good')}
    wrong(t,{hostile:CONDUCT.plunderEstate.hostile});log('You are caught at the '+ESTATES[k].n.toLowerCase()+' of '+t.name+'!','bad');
    return startEncounter({kind:'estate',ref:{town:t.name,k,sab:true,x:o.x,y:o.y,fac:t.owner,cool:0},list:estateGuards(t,k),title:'Guards of the '+ESTATES[k].n.toLowerCase()+' of '+t.name})}
  if((a==='es-plunder'||a==='es-burn')&&troopCount()>=3&&P.fac!==t.owner){const burn=a==='es-burn';wrong(t,{hostile:(burn?CONDUCT.burnEstate:CONDUCT.plunderEstate).hostile});G.est=null;
    startEncounter({kind:'estate',mine:true,ref:{town:t.name,k:o.k,burn,x:o.x,y:o.y,fac:t.owner,cool:0},list:estateGuards(t,o.k),title:'Guards of the '+ESTATES[o.k].n.toLowerCase()+' of '+t.name})}
}

/* the Estates section of the Fief: the project underway; the walls, the houses and each estate have a window of their own on
   the holding's rail (ui/townui.js bldBody), with its row (estateRow) */
function estatesBody(t){
  const w=t.work,wn=wallOf(t)+1;
  return '<div class="lab" style="margin-top:6px">Walls and estates · built with gold and materials from '+t.name+'&rsquo;s stock</div>'+
    (w?'<p class="gold" style="font-size:13px">Building: '+(w.k==='wall'?WALL_N[w.lv||wn]:ESTATES[w.k].n+' level '+(bldLv(t,w.k)+1))+', done in '+Math.max(1,w.done-G.day)+' days'+(besieged(t)?' (stopped by the siege)':'')+'. One project at a time.</p>':'')+
    '<ul class="tnotes">'+bldKeys().filter(k=>!ESTATES[k]||bldLv(t,k)||w&&w.k===k).map(k=>{const [st,tone]=bldStatus(t,k);return '<li>'+bldName(k)+': <span class="'+tone+'">'+st+'</span>.</li>'}).join('')+'</ul>'+
    '<p class="muted" style="font-size:13px">Choose the walls, the houses or an estate on the left to build, upgrade or pull it down.</p>';
}
// one row: k is 'wall', 'house' or an estate; what it is now and what the next step needs, and its buttons (what an estate
// does is said above it, in its window)
function estateRow(t,k){
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  const w=t.work,busy=!!w,b=(arg,label,why)=>'<button class="btn sm" type="button" data-act="fief-build" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const wl=wallOf(t),wn=wl+1,wc=WALL_COST[wn];
  const mt=(mats)=>{const l=matsLacking(t,mats);return ' Needs '+matsText(mats)+(l.length?' (short: '+l.join(', ')+')':'')+'.'};
  if(k==='wall')return row('Fortification: '+WALL_N[wl]+(wl<t.T.wallMax?'':' (best)'),'Defenders fight as level '+(1+wl)+'; sieges by lords take '+(2+wl)+' days; garrison up to '+fiefCap(t)+'.'+(wl<t.T.wallMax?' Next: '+WALL_N[wn]+'.'+mt(WALL_MAT[wn]):''),
      wl<t.T.wallMax?b('wall','Fortify '+wc+'g · '+workDays(t,wn)+' days',busy?'Already building':P.gold<wc?'Not enough gold':matsLacking(t,WALL_MAT[wn]).length?'Not enough materials in stock':''):'');
  // houses: the room they give, a new one placed by hand, an old one pulled down
  if(k==='house'){const hs=(t.lots||[]).filter(l=>l.k==='house'),hc=HOUSE_COST,why=busy?'Already building':P.gold<hc.gold?'Not enough gold':matsLacking(t,hc.mats).length?'Not enough materials in stock':'';
    return row('Houses '+hs.length,'Room for '+housing(t)+' people; '+Math.round(t.pop||0)+' live here.'+(housingFull(t)?' <span class="bad">Full: no one more can settle, and some will leave.</span>':'')+' A new house needs '+matsText(hc.mats)+'.',
      '<button class="btn sm" type="button" data-act="fief-house"'+(why?' disabled title="'+why+'"':'')+'>Place a house '+hc.gold+'g · '+workDays(t,HOUSE_DAYS)+' days</button>'+(hs.length?'<button class="btn sm" type="button" data-act="fief-demolish" data-arg="house">Pull one down</button>':''))}
  const lv=bldLv(t,k),cap=bldCap(t,k),c=bldCost(k,lv+1);
  return row(ESTATES[k].n+' '+lv+' / '+(cap||'–'),(cap?(lv<cap?mt(ESTATE_MAT(k,lv+1)).trim():''):'No suitable land near '+t.name+'.'),
    (lv?'<button class="btn sm" type="button" data-act="fief-demolish" data-arg="'+k+'">Pull down</button>':'')+
    (cap&&lv<cap?b(k,(lv?'Upgrade ':'Place ')+c+'g · '+workDays(t,lv+1)+' days',busy?'Already building':!lv&&!needsMet(t,k)?'Needs '+needsText(k):P.gold<c?'Not enough gold':matsLacking(t,ESTATE_MAT(k,lv+1)).length?'Not enough materials in stock':''):''));
}
onAct('es-',estateAct);
