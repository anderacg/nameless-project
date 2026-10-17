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
    const front=TOWNS.some(o=>o!==t&&atWar(t.owner,o.owner)&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<60);
    // a full holding builds a house first (its people have nowhere else to go)
    if(t.lots&&t.pop>=housing(t)*.9&&!matsLacking(t,HOUSE_COST.mats).length&&payRealm(t.owner,HOUSE_COST.gold)){takeMats(t,HOUSE_COST.mats);startWork(t,'house',HOUSE_DAYS);continue}
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
const estateGuards=(t,k)=>{const lv=bldLv(t,k),near=Math.hypot(bldSpots(t)[k].x-t.x,bldSpots(t)[k].y-t.y)<7*TILE,n=2+2*lv+(near?Math.min(4,t.gar||0):0),a=[];
  for(let i=0;i<n;i++){const c=RACES[t.races[i%t.races.length]];a.push(i%3===2?c.ranged:c.melee)}return a};
function estateMeet(o){
  const t=townBy(o.town),k=o.k;if(!t||!bldLv(t,k))return;G.est=o;G.mode='dialog';P.tx=null;G.chase=null;ensureEcon(t);
  const E=ESTATES[k],lv=bldLv(t,k),own=t.owner==='player',emp=P.fac&&P.fac===t.owner,out=(t.last&&t.last.out)||{},gs=E.goods.filter(g=>out[g]);
  const hands=W.folk.filter(f=>f.home===t.name&&f.k===k).length,guard=estateGuards(t,k),pw=rating(guard),herd=k==='pasture'&&herdOf(t),
    job=E.work,herdBtn=(herd?dlgBtn('es-herd',null,'Buy livestock'):'')+
      (job?dlgBtn('es-folk',null,'Talk to the '+job+'s · '+hands,hands?'':'Nobody about'):'');
  showPanel('<div class="top"><h2>'+E.n+' of '+t.name+'</h2><span class="muted">Level '+lv+' · '+(t.owner?'<span style="color:'+FACS[t.owner].col+'">'+FACS[t.owner].n+'</span>':'')+'</span></div>'+
    '<p>'+E.d+'</p>'+(PLOTS[k]?'<p class="'+(fieldShare(t,k)<1?'bad':'muted')+'">Fields: '+plotsAt(t,k,lv).length+' of the '+PLOTS_AT[k](lv)+' its level works'+(fieldShare(t,k)<1?' (no open ground for more: it makes '+Math.round(fieldShare(t,k)*100)+'%)':'')+'.</p>':'')+(sabotaged(t,k)?'<p class="bad">Wrecked: it makes nothing until day '+t.sab[k]+'.</p>':'')+'<p class="muted">'+(gs.length?'Yesterday it sent '+gs.map(g=>out[g]+' '+GOODS[g].n.toLowerCase()).join(', ')+' to '+t.name+'. ':'')+(hands?hands+' at work here now. ':'')+(until(t,'fear')?'The workers are afraid to come out. ':'')+'</p>'+
    (own?'<p class="good">Your estate. Build and upgrade it from the Fief tab in '+t.name+'.</p>'+(herdBtn?'<div class="btns">'+herdBtn+'</div>':''):
     '<p>'+guard.length+' guards watch it (power '+pw+' vs your '+partyPower()+').</p><div class="btns">'+herdBtn+
     dlgBtn('es-sabotage',null,'Sabotage it ('+Math.round(sabotageChance(t,k)*100)+'% unseen)',emp?'Your employer':sabotaged(t,k)?'Already wrecked':'')+dlgBtn('es-plunder',null,'Plunder its stores',emp?'Your employer':troopCount()<3?'Need 3 troops':'')+
dlgBtn('es-burn',null,'Burn it',emp?'Your employer':troopCount()<3?'Need 3 troops':'')+'</div>'+
     '<p class="muted">Sabotage: you slip in and wreck its work: it makes nothing for '+(3+2*lv)+' days. Unseen, only rumour follows you (reputation there −'+CONDUCT.sabotageEstate.rep+'); caught, you fight its guards and pay as for a plunder. Night, Scouting and Agility help; a big band and a big estate make it harder.</p>'+
     '<p class="muted">Plunder: you fight the guards and take what the estate made for '+t.name+': reputation there −'+CONDUCT.plunderEstate.rep+', honor −'+CONDUCT.plunderEstate.honor+(hostileTo(t.owner)?'':', and the '+FACS[t.owner].n+' turns hostile for '+CONDUCT.plunderEstate.hostile+' days')+'. Burning also knocks it down a level and costs more: reputation −'+CONDUCT.burnEstate.rep+', honor −'+CONDUCT.burnEstate.honor+(hostileTo(t.owner)?'':', hostile for '+CONDUCT.burnEstate.hostile+' days')+'; its people may leave.</p>')+nav(null,['dlg-close',null,'Leave']));
}
// the chance of slipping in unseen
const sabotageChance=(t,k)=>clamp(.35+.03*skill('scout')+.02*P.attr.agi+(darkness()>.5?.2:0)-.06*bldLv(t,k)-(partySize()>20?.1:0),.1,.9);
function sabotage(t,k){t.sab=t.sab||{};t.sab[k]=G.day+3+2*bldLv(t,k)}
function estateAct(a){
  const o=G.est,t=o&&townBy(o.town);if(!t||!bldLv(t,o.k)){closeDialog();return}
  if(a==='es-herd'){const c=herdOf(t);if(c){G.est=null;openHerd(c,o)}return}
  if(a==='es-folk'){const ws=W.folk.filter(f=>f.home===t.name&&f.k===o.k),f=ws.find(f=>f.st==='in')||ws[0];if(f){G.est=null;workerMeet(f,o)}return}
  if(a==='es-sabotage'&&P.fac!==t.owner&&t.owner!=='player'&&!sabotaged(t,o.k)){const k=o.k;G.est=null;train('scout',4);
    if(Math.random()<sabotageChance(t,k)){sabotage(t,k);addRep(t.name,-CONDUCT.sabotageEstate.rep,true);closeDialog();
      return notice('Sabotaged','Under cover your people foul the '+ESTATES[k].n.toLowerCase()+' of '+t.name+'. It will make nothing for '+(t.sab[k]-G.day)+' days, and nobody saw who did it.','good')}
    wrong(t,{hostile:CONDUCT.plunderEstate.hostile});log('You are caught at the '+ESTATES[k].n.toLowerCase()+' of '+t.name+'!','bad');
    return startEncounter({kind:'estate',ref:{town:t.name,k,sab:true,x:o.x,y:o.y,fac:t.owner,cool:0},list:estateGuards(t,k),title:'Guards of the '+ESTATES[k].n.toLowerCase()+' of '+t.name})}
  if((a==='es-plunder'||a==='es-burn')&&troopCount()>=3&&P.fac!==t.owner){const burn=a==='es-burn';wrong(t,{hostile:(burn?CONDUCT.burnEstate:CONDUCT.plunderEstate).hostile});G.est=null;
    startEncounter({kind:'estate',mine:true,ref:{town:t.name,k:o.k,burn,x:o.x,y:o.y,fac:t.owner,cool:0},list:estateGuards(t,o.k),title:'Guards of the '+ESTATES[o.k].n.toLowerCase()+' of '+t.name})}
}
// won the fight at an estate (from concludeEncounter): the spoils and the damage
function estateWon(e){
  const r=e.ref,t=townBy(r.town);if(!t)return '';ensureEcon(t);const lv=bldLv(t,r.k),M=MAKE[r.k]||{},got=[];
  if(r.sab){sabotage(t,r.k);const cost=wrong(t,{rep:CONDUCT.plunderEstate.rep,honor:CONDUCT.plunderEstate.honor});return ' You beat its guards and wreck the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name+' anyway: idle for '+(t.sab[r.k]-G.day)+' days ('+cost+').'}
  for(const g in M.out||{}){const n=Math.min(t.stock[g]||0,Math.ceil(M.out[g]*Math.max(1,lv)*3));if(n<=0)continue;const k=invAdd('good',g,n);t.stock[g]-=n;if(k)got.push(k+' '+GOODS[g].n.toLowerCase())}
  const gold=rint(10,25)*Math.max(1,lv),c=r.burn?CONDUCT.burnEstate:CONDUCT.plunderEstate;P.gold+=gold;
  const cost=wrong(t,{rep:c.rep,honor:c.honor,fear:c.fear,pros:c.pros});
  if(r.burn){t.bld[r.k]=Math.max(0,lv-1);t.raided=Math.max(t.raided||0,G.day+4);mood('cruel');syncLots(t)}
  return ' You '+(r.burn?'burn the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name+' (now level '+bldLv(t,r.k)+')':'plunder the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name)+': '+(got.length?got.join(', ')+' and ':'')+gold+' gold. Its workers flee and '+t.name+' grows poorer ('+cost+').';
}

/* the Estates section of the Fief tab */
function estatesBody(t){
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  const w=t.work,busy=!!w,b=(arg,label,why)=>'<button class="btn sm" type="button" data-act="fief-build" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const wl=wallOf(t),wn=wl+1,wc=WALL_COST[wn];
  const mt=(mats)=>{const l=matsLacking(t,mats);return ' Needs '+matsText(mats)+(l.length?' (short: '+l.join(', ')+')':'')+'.'};
  return '<div class="lab" style="margin-top:6px">Walls and estates · built with gold and materials from '+t.name+'&rsquo;s stock</div>'+
    (w?'<p class="gold" style="font-size:13px">Building: '+(w.k==='wall'?WALL_N[w.lv||wn]:ESTATES[w.k].n+' level '+(bldLv(t,w.k)+1))+', done in '+Math.max(1,w.done-G.day)+' days'+(besieged(t)?' (stopped by the siege)':'')+'. One project at a time.</p>':'')+
    row('Fortification: '+WALL_N[wl]+(wl<t.T.wallMax?'':' (best)'),'Defenders fight as level '+(1+wl)+'; sieges by lords take '+(2+wl)+' days; garrison up to '+fiefCap(t)+'.'+(wl<t.T.wallMax?' Next: '+WALL_N[wn]+'.'+mt(WALL_MAT[wn]):''),
      wl<t.T.wallMax?b('wall','Fortify '+wc+'g · '+workDays(t,wn)+' days',busy?'Already building':P.gold<wc?'Not enough gold':matsLacking(t,WALL_MAT[wn]).length?'Not enough materials in stock':''):'')+
    // houses: the room they give, a new one placed by hand, an old one pulled down
    (()=>{const hs=(t.lots||[]).filter(l=>l.k==='house'),hc=HOUSE_COST,why=busy?'Already building':P.gold<hc.gold?'Not enough gold':matsLacking(t,hc.mats).length?'Not enough materials in stock':'';
      return row('Houses '+hs.length,'Room for '+housing(t)+' people; '+Math.round(t.pop||0)+' live here.'+(housingFull(t)?' <span class="bad">Full: no one more can settle, and some will leave.</span>':'')+' A new house needs '+matsText(hc.mats)+'.',
        '<button class="btn sm" type="button" data-act="fief-house"'+(why?' disabled title="'+why+'"':'')+'>Place a house '+hc.gold+'g · '+workDays(t,HOUSE_DAYS)+' days</button>'+(hs.length?'<button class="btn sm" type="button" data-act="fief-demolish" data-arg="house">Pull one down</button>':''))})()+
    Object.keys(ESTATES).map(k=>{const lv=bldLv(t,k),cap=bldCap(t,k),c=bldCost(k,lv+1);
      return row(ESTATES[k].n+' '+lv+' / '+(cap||'–'),ESTATES[k].d+(cap?(lv<cap?mt(ESTATE_MAT(k,lv+1)):''):' No suitable land near '+t.name+'.'),
        (lv?'<button class="btn sm" type="button" data-act="fief-demolish" data-arg="'+k+'">Pull down</button>':'')+
        (cap&&lv<cap?b(k,(lv?'Upgrade ':'Place ')+c+'g · '+workDays(t,lv+1)+' days',busy?'Already building':!lv&&!needsMet(t,k)?'Needs '+needsText(k):P.gold<c?'Not enough gold':matsLacking(t,ESTATE_MAT(k,lv+1)).length?'Not enough materials in stock':''):''))}).join('');
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
