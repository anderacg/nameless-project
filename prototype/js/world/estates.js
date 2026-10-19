'use strict';
/* ---------- estates and walls: what each holding has built ---------- */
// t.bld = {farm:lv, …}: 0 is none, up to its kind's estMax. t.wall = 0..its wallMax (holdings.js). t.work = {k, lv, done}: the project underway.
// Outdoor estates sit on a spot in the holding's land that suits them, where their workers go each day. What they make
// goes into the holding's stock (see economy.js); building needs gold and materials from that stock. Raids and sacks burn them.
// Walls make defenders stronger, sieges longer and the garrison bigger; a breach on capture costs a level.
const bldCost=(k,lv)=>ESTATES[k].cost*lv*lv;
// what an estate needs built first (ESTATE_NEEDS), and what is missing
const needsMet=(t,k)=>Object.entries(ESTATE_NEEDS[k]||{}).every(([e,lv])=>bldLv(t,e)>=lv);
const needsText=k=>Object.entries(ESTATE_NEEDS[k]||{}).map(([e,lv])=>ESTATES[e].n+' '+lv).join(' and ');
const buildDays=lv=>1+2*lv;
const wallOf=t=>t.wall==null?t.T.wall0:t.wall;
const bldLv=(t,k)=>t.bld&&t.bld[k]||0;
const bldTotal=t=>Object.keys(ESTATES).reduce((a,k)=>a+bldLv(t,k),0);

/* where each estate stands: its placed building (lots.js). GROUND says what land each kind of estate works. */
const GROUND={
  open:(x,y)=>tAt(x,y)===T_OPEN,
  forest:(x,y)=>tAt(x,y)===T_FOREST,
  rock:(x,y)=>passable(tAt(x,y))&&(tAt(x,y)===T_HILL||[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>tAt(x+a,y+b)===T_MOUNT)),
  shore:(x,y)=>passable(tAt(x,y))&&tAt(x,y)!==T_ROAD&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>tAt(x+a,y+b)===T_WATER)
};
// k -> {tx, ty, x, y}: where each estate's building stands (its front middle tile); only estates that have a building
function bldSpots(t){
  if(t._spots)return t._spots;const sp={};
  for(const l of t.lots||[])if(ESTATES[l.k]){const m=lotMid(l);sp[l.k]={tx:m.tx,ty:m.ty,x:m.x,y:m.y}}
  return t._spots=sp;
}
// the field tiles an estate keeps (farms, pastures, quarries), and those in use at a level
const PLOTS={farm:6,pasture:4,quarry:3};
const estatePlots=(t,k)=>{const l=lotAt(t,k);return l&&l.plots||[]};
const PLOTS_AT={farm:lv=>2*lv,pasture:lv=>lv+1,quarry:lv=>lv};
const plotsAt=(t,k,lv)=>estatePlots(t,k).slice(0,PLOTS_AT[k]?PLOTS_AT[k](lv):0);
// the share of its fields a farm, pasture or quarry actually has at its level (no fields: it makes nothing); 1 for the rest
const fieldShare=(t,k)=>{const lv=bldLv(t,k);if(!PLOTS[k]||!lv||!t.lots)return 1;return Math.min(1,plotsAt(t,k,lv).length/PLOTS_AT[k](lv))};
// an estate's worked fields: the tiles, and their middle (the plot nearest their centre, in pixels): where its workers work and
// its animals graze. null: it has none (no fields, or none worked at its level)
function fieldsOf(t,k){const lv=t&&bldLv(t,k),pl=lv&&PLOTS[k]?plotsAt(t,k,lv):[];if(!pl.length)return null;
  const cx=pl.reduce((a,p)=>a+p[0],0)/pl.length,cy=pl.reduce((a,p)=>a+p[1],0)/pl.length,m=pl.reduce((a,p)=>Math.hypot(p[0]-cx,p[1]-cy)<Math.hypot(a[0]-cx,a[1]-cy)?p:a);
  return{x:m[0]*TILE+TILE/2,y:m[1]*TILE+TILE-4,tiles:pl}}
// on those fields (a little inside each tile's edge), and a spot somewhere on them
const onFields=(F,x,y)=>F.tiles.some(([tx,ty])=>x>=tx*TILE+2&&x<tx*TILE+TILE-2&&y>=ty*TILE+4&&y<ty*TILE+TILE-1);
const fieldSpot=F=>{const [tx,ty]=F.tiles[rint(0,F.tiles.length-1)];return{x:tx*TILE+rint(3,TILE-4),y:ty*TILE+rint(6,TILE-2)}};
// sabotaged: idle until t.sab[k]
const sabotaged=(t,k)=>!!(t.sab&&t.sab[k]>G.day);
// can this holding have this estate: it has one, or there is room and ground for one
function canHave(t,k){
  if(lotAt(t,k))return true;t._can=t._can||{};if(t._can[k]!=null)return t._can[k];
  const type=ESTATE_LOT[k],n=lotSize(type),inner=INNER.includes(k),wb=wallBox(t),R=()=>.5;
  return t._can[k]=!!(inner?lotSpot(t,n,'open',1,9,R,{estate:true}):lotSpot(t,n,groundOf(k),3,k==='port'&&t.style==='port'?20:12,R,{estate:true,outside:wb&&{x0:wb.x0-1,y0:wb.y0-1,x1:wb.x1+1,y1:wb.y1+1},fields:PLOTS[k]?k:null}));
}

const bldCap=(t,k)=>canHave(t,k)?t.T.estMax:0;

// what a holding starts with: what its land and trade suggest
function initEstates(t){
  const R=seeded(t.seed*131+7),m=t.mod||{},b={},v=!!t.T.rural,c=!!t.T.fort;
  const set=(k,lv)=>{b[k]=Math.min(bldCap(t,k),Math.max(0,lv))};
  set('farm',v?2:1+(m.grain<=.8?1:0));set('pasture',v?1:R()<.4?1:0);
  set('lumber',m.timber<=.75?2:R()<.5?1:0);set('mine',m.iron<=.8?2:resHas(t,'ore').some(g=>GOODS[g].base>=60)?1:R()<.4?1:0);
  set('port',t.style==='port'?2:R()<.3?1:0);set('workshop',c?0:m.cloth<=.85||m.furs<=.8?1+(v?0:1):0);set('market',c?0:v?0:1);
  set('quarry',m.iron<=1||c?1:R()<.3?1:0);set('smithy',v?0:1);set('brewery',v?(R()<.3?1:0):R()<.6?1:0);set('granary',c?1:R()<.3?1:0);
  t.bld=b;t.wall=t.T.wall0;t.work=null;
}
const estateLine=t=>{const ks=Object.keys(ESTATES).filter(k=>bldLv(t,k));return (ks.length?ks.map(k=>ESTATES[k].n+' '+bldLv(t,k)).join(', '):'none')};

// once a day: projects finish, caravan goods fade, and every realm slowly builds; the frontier fortifies first
function estateDay(){
  for(const t of TOWNS){
    if(!t.bld)initEstates(t);
    if(t.work){if(besieged(t))t.work.done++;else if(G.day>=t.work.done)finishWork(t)}
    if(t.owner==='player'||t.work||besieged(t)||ruined(t)||Math.random()>.05)continue;
    // what to build: walls on the frontier, then whatever the holding is shortest of
    const front=TOWNS.some(o=>o!==t&&atWar(t.owner,o.owner)&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<WORLD_SCALE.war.front);
    // a full holding builds a house first (its people have nowhere else to go)
    if(t.lots&&t.pop>=housing(t)*.9&&!matsLacking(t,HOUSE_COST.mats).length&&payRealm(t.owner,HOUSE_COST.gold)){if(startWork(t,'house',HOUSE_DAYS))takeMats(t,HOUSE_COST.mats);else refundRealm(t.owner,HOUSE_COST.gold);continue}// (no free plot: nothing spent)
    let k=null;if(wallOf(t)<t.T.wallMax&&(front||Math.random()<.2))k='wall';
    else{const ks=Object.keys(ESTATES).filter(e=>bldLv(t,e)<bldCap(t,e)&&(bldLv(t,e)||needsMet(t,e)));ensureEcon(t);
      const want=e=>{const gs=ESTATES[e].goods;let w=gs.reduce((a,g)=>a+Math.max(0,1-(t.stock[g]||0)/targetStock(t,g)),0);if(e==='granary')w+=foodDays(t)<5?.6:0;if(e==='market')w+=.3;return w+Math.random()*.3};
      k=ks.sort((p,q)=>want(q)-want(p))[0]||null}
    if(!k)continue;const lv=k==='wall'?wallOf(t)+1:bldLv(t,k)+1,mats=k==='wall'?WALL_MAT[lv]:ESTATE_MAT(k,lv),gold=k==='wall'?WALL_COST[lv]:bldCost(k,lv);
    if(matsLacking(t,mats).length||!payRealm(t.owner,gold))continue;
    takeMats(t,mats);startWork(t,k,lv);
    if(k==='wall'&&(t.owner===P.fac||Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5))log('The '+FACS[t.owner].n+' starts raising '+WALL_N[lv].toLowerCase()+' around '+t.name+'.');
  }
}
function finishWork(t){
  const w=t.work;t.work=null;if(w.k==='house'){houseDone(t,w);if(t.owner==='player')log('A new house stands in '+t.name+'.','good');return}if(w.k==='wall')t.wall=Math.min(t.T.wallMax,wallOf(t)+1);else t.bld[w.k]=Math.min(bldCap(t,w.k),bldLv(t,w.k)+1);
  syncLots(t);
  if(t.owner==='player')log((w.k==='wall'?'The centre of '+t.name+' is fortified: '+WALL_N[t.wall].toLowerCase():'The '+ESTATES[w.k].n.toLowerCase()+' of '+t.name+' reaches level '+t.bld[w.k])+'.','good');
}
// war's damage: burn n estates (fields and herds first), and breach the walls on capture
function burnEstates(t,n){
  const out=[];for(let i=0;i<n;i++){const ks=['farm','pasture','lumber','workshop','brewery','granary','market','smithy','quarry','mine','port'].filter(k=>bldLv(t,k));if(!ks.length)break;const k=ks[Math.random()<.6?0:rint(0,ks.length-1)];t.bld[k]--;out.push(ESTATES[k].n.toLowerCase())}
  if(t.work&&t.work.k!=='wall')t.work=null;syncLots(t);return out;
}
const breach=t=>{t.wall=Math.max(0,wallOf(t)-1);if(t.work&&t.work.k==='wall')t.work=null;syncLots(t)};

/* someone else's estate: plunder or burn it */
/* estates: plunder or burn what a holding has built in its fields */
// an estate's guards: GUARDS.base + GUARDS.per a level of its own, less those fallen whose places are not filled yet (t.gd[k]: the day each comes
// back, GUARDS.refill days after, one a day), and up to GUARDS.gar of the garrison when it stands near the walls
const GUARDS={base:1,per:1,refill:5,gar:2,minPop:20};// (own guards: base + per a level; gar: the garrison's most that stand with them)
const guardsDown=(t,k)=>((t.gd&&t.gd[k])||[]).filter(d=>d>G.day).length;
const estateGuards=(t,k)=>{const lv=bldLv(t,k),near=Math.hypot(bldSpots(t)[k].x-t.x,bldSpots(t)[k].y-t.y)<WORLD_SCALE.land.estateGuard*TILE,n=Math.max(0,GUARDS.base+GUARDS.per*lv-guardsDown(t,k))+(near?Math.min(GUARDS.gar,t.gar||0):0),a=[];
  for(let i=0;i<n;i++){const c=RACES[t.races[i%t.races.length]];a.push(i%3===2?c.ranged:c.melee)}return a};
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
    (until(t,'fear')?'<p class="bad">The workers are afraid to come out.</p>':'')+bldTop(t,k)+estateDeeds(t,k)+RAIL_SCREEN.overview(ms.map(([k,n,ico,note])=>({act:'es-tab',arg:k,n,note})));
  else if(tab==='folk'){const inn=ws.filter(f=>f.st==='in'),field=ws.filter(f=>f.st==='field').length,away=ws.length-inn.length-field;// (only those inside: the rest are met where they are, folk.js)
    body=(inn.length?railCards(inn.map(f=>{const kk=recruitKind(t,f);return {pic:workerPic(f.job,race,f.v),name:f.name,role:cap1(f.job)+' of the '+E.n.toLowerCase(),facts:['At work inside',until(t,'fear')?['Afraid to come out','bad']:'',remembers(t,f)?['Remembers you','bad']:'','Recruit: '+ST[kk].n.toLowerCase()+', '+hireCost(kk)+'g'],
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
// the chance of slipping in unseen
const sabotageChance=(t,k)=>clamp(.35+.03*skill('scout')+.02*P.attr.agi+(darkness()>.5?.2:0)-.06*bldLv(t,k)-(partySize()>20?.1:0),.1,.9);
function sabotage(t,k){t.sab=t.sab||{};t.sab[k]=G.day+3+2*bldLv(t,k)}
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
// won the fight at an estate (from concludeEncounter): the spoils and the damage
// beaten (or fled the field): the guards there are gone, their own posts filled again one a day after GUARDS.refill days, the
// garrison's men lost from the garrison
function guardsBeaten(t,k){const lv=bldLv(t,k),down=guardsDown(t,k),own=Math.max(0,GUARDS.base+GUARDS.per*lv-down),near=Math.hypot(bldSpots(t)[k].x-t.x,bldSpots(t)[k].y-t.y)<WORLD_SCALE.land.estateGuard*TILE;
  t.gd=t.gd||{};const L=(t.gd[k]||[]).filter(d=>d>G.day),last=L.length?Math.max(...L):G.day+GUARDS.refill-1;for(let i=1;i<=own;i++)L.push(last+i);t.gd[k]=L;t.pop=Math.max(10,(t.pop||0)-own);// (the dead are the holding's people)
  if(near)t.gar=Math.max(0,(t.gar||0)-Math.min(GUARDS.gar,t.gar||0))}
// a new day: each post whose time has come is filled from the holding's people (one person each); too few people left (GUARDS.minPop)
// and it waits another day
function guardsDay(t){if(!t.gd)return;for(const k in t.gd){const L=t.gd[k];for(let i=0;i<L.length;i++)if(L[i]<=G.day){if((t.pop||0)>GUARDS.minPop){t.pop--;L.splice(i--,1)}else L[i]=G.day+1}if(!L.length)delete t.gd[k]}}
function estateWon(e){
  const r=e.ref,t=townBy(r.town);if(!t)return '';ensureEcon(t);guardsBeaten(t,r.k);const lv=bldLv(t,r.k),M=MAKE[r.k]||{},got=[];
  if(r.sab){sabotage(t,r.k);const cost=wrong(t,{rep:CONDUCT.plunderEstate.rep,honor:CONDUCT.plunderEstate.honor});return ' You beat its guards and wreck the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name+' anyway: idle for '+(t.sab[r.k]-G.day)+' days ('+cost+').'}
  for(const g in M.out||{}){const n=Math.min(t.stock[g]||0,Math.ceil(M.out[g]*Math.max(1,lv)*3));if(n<=0)continue;const k=invAdd('good',g,n);t.stock[g]-=n;if(k)got.push(k+' '+GOODS[g].n.toLowerCase())}
  const gold=rint(10,25)*Math.max(1,lv),c=r.burn?CONDUCT.burnEstate:CONDUCT.plunderEstate;P.gold+=gold;
  const cost=wrong(t,{rep:c.rep,honor:c.honor,fear:c.fear,pros:c.pros});
  if(r.burn){t.bld[r.k]=Math.max(0,lv-1);t.raided=Math.max(t.raided||0,G.day+4);mood('cruel');syncLots(t);newsRecord('raid',bldSpots(t)[r.k]||t,{town:t.name,estate:r.k})}
  return ' You '+(r.burn?'burn the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name+' (now level '+bldLv(t,r.k)+')':'plunder the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name)+': '+(got.length?got.join(', ')+' and ':'')+gold+' gold. Its workers flee and '+t.name+' grows poorer ('+cost+').';
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
function buildAct(t,k,at){
  if(t.work)return;
  if(k==='wall'){const n=wallOf(t)+1;if(n>t.T.wallMax||P.gold<WALL_COST[n]||matsLacking(t,WALL_MAT[n]).length)return;P.gold-=WALL_COST[n];takeMats(t,WALL_MAT[n]);startWork(t,k,n);log('Masons start on '+WALL_N[n].toLowerCase()+' at '+t.name+'.');return}
  if(!ESTATES[k])return;at=at||null;const lv=bldLv(t,k);if(lv>=bldCap(t,k)||!lv&&!needsMet(t,k))return;const c=bldCost(k,lv+1),mats=ESTATE_MAT(k,lv+1);if(P.gold<c||matsLacking(t,mats).length)return;P.gold-=c;takeMats(t,mats);startWork(t,k,lv+1,at);log('Work starts on the '+ESTATES[k].n.toLowerCase()+' of '+t.name+'.');
}

/* ---------- on the map: a holding and its estates are world objects (parties.js WorldObject). A holding's class is data
   (holdings.js, loaded before the world objects), so HoldingObject is put under it here. A holding answers a click on its gate
   and on any of its buildings and walls; an estate on its building and its fields, in the holding's order of lots (both:
   HoldingObject pick). Both are drawn with the holding's lots (structures.js holdingEnts, drawLotGround). ---------- */
class HoldingObject extends WorldObject{
  get mapKind(){return 'town'}
  here(){return TOWNS.includes(this)}
  get meetsAnyTime(){return true}
  meet(){approachHolding(this)}
  // its built estates, in the order of its lots (worldObjects lists them after it)
  estates(){return Object.keys(bldSpots(this)).filter(k=>bldLv(this,k)).map(k=>estatePick(this,k))}
  // (structures answer anywhere on what is drawn of them: pickAt box)
  pick(at){if(Math.hypot(this.x-P.x,this.y-P.y)>at.V+340)return;at.box(this,this.x-8,this.y-18,this.x+8,this.y+8,4);// its gate
    for(const l of this.lots||[]){if(ESTATES[l.k]&&bldLv(this,l.k))estatePick(this,l.k).pickOn(at,this,l);else at.box(this,l.x*TILE,l.y*TILE,(l.x+l.n)*TILE,(l.y+l.n)*TILE,ESTATES[l.k]?0:4)}}
  draw(ents,cam,V){holdingEnts(this,ents,cam,V)}
  mapDot(V){return seenTile(this.tx,this.ty)?[this._memCol||facCol(this),3]:null}// (its colour as you last saw it)
  tip(){return '<b>'+this.name+'</b><small>'+cap1(this.label)+(this.owner?' of the '+tipFac(this.owner):'')+' · '+WALL_N[wallOf(this)]+'</small>'+(closedNow(this)?'<small class="bad">Under siege</small>':'')+'<span class="act">'+(hostileTo(this.owner)?'Click: attack it':'Click: enter')+'</span>'}
}
Object.setPrototypeOf(Holding.prototype,HoldingObject.prototype);
// an estate: one per holding and kind, kept aside (never saved): town (its holding's name), k, and its building's spot (x, y) and
// owner (fac) as they are when it is asked for (estatePick)
const ESTATE_OBJ=new WeakMap();
class Estate extends WorldObject{
  constructor(t,k){super();this.town=t.name;this.k=k}
  get mapKind(){return 'estate'}
  get est(){return true}
  chaseable(){return super.chaseable()&&!!bldLv(townBy(this.town)||{},this.k)}// (pulled down or burnt while you walk there: no more)
  get meetsAnyTime(){return true}
  meet(){estateMeet(this)}
  pick(at){}// (with its holding's lots, in their order: pickOn)
  pickOn(at,t,l){at.box(this,l.x*TILE,l.y*TILE,(l.x+l.n)*TILE,(l.y+l.n)*TILE,0);plotsAt(t,this.k,bldLv(t,this.k)).forEach(([x,y])=>at.box(this,x*TILE,y*TILE,(x+1)*TILE,(y+1)*TILE))}
  tip(){return '<b>'+ESTATES[this.k].n+'</b><small>Estate of '+this.town+'</small><span class="act">Click: look</span>'}
}
function estatePick(t,k){let m=ESTATE_OBJ.get(t);if(!m)ESTATE_OBJ.set(t,m={});const o=m[k]||(m[k]=new Estate(t,k)),p=bldSpots(t)[k];o.x=p.x;o.y=p.y;o.fac=t.owner;return o}
/* drawn with every other placed building (structures.js: drawLotGround, lotEnts) */
const drawEstates=(cam,V)=>drawLotGround(cam,V);
const estateEnts=(ents,cam,V)=>lotEnts(ents,cam,V);
onAct('es-',estateAct);
