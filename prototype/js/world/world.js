'use strict';
/* ---------- world ---------- */
function spawnBandit(initial,ld){// (ld: a chieftain coming back)
  for(let tries=0;tries<40;tries++){
    const x=rint(3,MW-4)*TILE+8,y=rint(3,MH-4)*TILE+8;
    if(!passable(terrAt(x,y)))continue;
    if(Math.hypot(x-P.x,y-P.y)<(initial?220:260))continue;
    const c=climAt(x,y),n=rint(3,5)+Math.floor(G.day/12),kind=c==='desert'?'raiders':c==='swamp'?'bog':'bandits';bandits.push(asParty({x,y,n,kind,list:makeEnemies(n,false,kind),t:0,a:0,idle:false,cool:0,ld:ld||newChief(kind,1+Math.floor(G.day/25)+(Math.random()<.3?1:0))}));if(ld&&Math.hypot(x-P.x,y-P.y)<vis()*3)log(ld.name+' is back on the roads with a new band.','bad');return;
  }
}
// on a bridge, anyone crossing keeps to the middle of its deck
const bridgeAt=(tx,ty)=>tAt(tx,ty)!==T_ROAD?0:tAt(tx-1,ty)===T_WATER&&tAt(tx+1,ty)===T_WATER?1:tAt(tx,ty-1)===T_WATER&&tAt(tx,ty+1)===T_WATER?2:0;
function walk(o,dx,dy,step,ok){
  const a0=Math.atan2(dy,dx);
  for(const off of [0,.6,-.6,1.2,-1.2,1.9,-1.9]){const a=a0+off;let nx=o.x+Math.cos(a)*step,ny=o.y+Math.sin(a)*step;if(passable(terrAt(nx,ny))&&(!ok||ok(nx,ny))){
    const tx=Math.floor(nx/TILE),ty=Math.floor(ny/TILE),b=bridgeAt(tx,ty),m=Math.max(1,step);if(b===1)nx+=clamp((tx+.5)*TILE-nx,-m,m);else if(b===2)ny+=clamp((ty+.5)*TILE-ny,-m,m);
    o.x=nx;o.y=ny;return true}}
  return false;
}
// a click on something you already stand beside opens it at once, even if you just left it or fled from it
// touching distance: you interact with something only when you reach it; a click on something farther away walks you there
const REACH=14;
// what lies under a click: the nearest clickable thing you can see
function pickAt(wx,wy){
  const V=vis(),c=[],add=(o,r,dy)=>{const d=Math.hypot(o.x-wx,o.y-(dy||0)-wy);if(d<r&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([d,o])};
  // structures answer anywhere on what is drawn of them, ranked as near as their own spot (a holding's gate) but never nearer
  // than 12 pixels away, so someone clicked on top of one is picked, and a click on the gate still picks the holding
  const box=(o,x0,y0,x1,y1,dy)=>{if(wx>=x0&&wx<x1&&wy>=y0&&wy<y1&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([Math.min(12,Math.hypot(o.x-wx,o.y-(dy||0)-wy))+Math.hypot(o.x-wx,o.y-wy)/1000,o])};
  const camp=(o,sp)=>{const x0=o.x-sp.ax,y0=o.y+8-sp.ay;box(o,x0,y0,x0+sp.width,y0+sp.height)};// anywhere on its picture
  // a holding answers on its square and on any of its buildings and walls; an estate on its building and its fields
  TOWNS.forEach(t=>{if(Math.hypot(t.x-P.x,t.y-P.y)>V+340)return;box(t,t.x-8,t.y-18,t.x+8,t.y+8,4);// its gate
    for(const l of t.lots||[]){const o=ESTATES[l.k]&&bldLv(t,l.k)?estatePick(t,l.k):t;box(o,l.x*TILE,l.y*TILE,(l.x+l.n)*TILE,(l.y+l.n)*TILE,ESTATES[l.k]?0:4);
      if(o!==t)plotsAt(t,l.k,bldLv(t,l.k)).forEach(([x,y])=>box(o,x*TILE,y*TILE,(x+1)*TILE,(y+1)*TILE))}});W.parties.forEach(o=>{if(o.onMap())add(o,10,4)});W.monsters.forEach(m=>add(m,11,6));
  // each kind of site says where it is clicked (sites.js)
  W.sites.forEach(s=>{if(s.pickable())s.box(box,camp)});W.critters.forEach(k=>add(k,9,4));(W.caravans||[]).forEach(k=>add(k,11,5));(W.refugees||[]).forEach(k=>add(k,10,4));(W.folk||[]).forEach(k=>add(k,6,4));
  c.sort((a,b)=>a[0]-b[0]);return c.length?c[0][1]:null;
}
const objKind=o=>o&&o.cid&&o.troops?'cparty':o&&o.est?'estate':TOWNS.includes(o)?'town':W.lords.includes(o)?'lord':W.monsters.includes(o)?'monster':bandits.includes(o)?'band':W.sites.includes(o)?'site':W.critters.includes(o)?'critter':(W.caravans||[]).includes(o)?'caravan':(W.refugees||[]).includes(o)?'refugee':(W.patrols||[]).includes(o)?'patrol':(W.folk||[]).includes(o)?'worker':null;
// meet whatever you have reached
function interact(o){
  const k=objKind(o);P.tx=null;G.chase=null;G.youAttack=true;setTimeout(()=>{G.youAttack=false},0);
  if(o&&o.fight&&fightOf(o)){fightMeet(fightOf(o));return true}
  if(k==='town')approachHolding(o);
  else if(k==='cparty')openComp(o.cid);
  else if(k==='lord')lordMeet(o);
  else if(k==='monster')startMonster(o);
  else if(k==='band')meetBand(o);
  else if(k==='site'){G.lastSite=o;enterSite(o)}
  else if(k==='caravan')caravanMeet(o);
  else if(k==='refugee')refugeeMeet(o);
  else if(k==='patrol')patrolMeet(o);
  else if(k==='worker')workerMeet(o);
  else if(k==='estate')estateMeet(o);
  else if(k==='critter'){o.cool=4;if(CRITTERS[o.id].live)openHerd(o);else hunt(o)}
  return !!k;
}
// a click on the map: interact if you are touching it, else walk to it (and interact on arrival). Returns true if something opened.
function clickAt(wx,wy){
  const o=pickAt(wx,wy);if(!o){G.chase=null;return false}
  if(Math.hypot(o.x-P.x,o.y-P.y)<=REACH)return interact(o);
  G.chase=o;P.tx=o.x;P.ty=o.y;P.stuck=0;return false;
}
// the camp a band heads for at night: the nearest that is not cleared, within reach
const campNear=b=>{let best=null,bd=220;for(const c of camps()){if(c.cleared)continue;const d=Math.hypot(c.x-b.x,c.y-b.y);if(d<bd){bd=d;best=c}}return best};
// at dawn the bands in a camp ride out again
function campEmpty(c){if(!c.bands||!c.bands.length)return;for(const b of c.bands){b.x=c.x+rint(-12,12);b.y=c.y+rint(10,18);b.cool=2;b.gone=false;bandits.push(b)}c.bands=[]}
// attacking a camp: its own bandits and chieftain, and any bands sheltering there tonight
function campFight(c){const own=makeEnemies(rint(7,9)+Math.floor(G.day/15),true),bands=c.bands||[];
  startEncounter({kind:'camp',ref:c,list:own.concat(...bands.map(b=>b.list)),title:(c.name||'Bandit camp')+(bands.length?' · '+bands.length+' band'+(bands.length>1?'s':'')+' sheltering inside':'')})}
// the hero's speed multiplier where they stand: ground, race, mount, Pathfinder and gear
/* how fast a party moves on the map: what it is made of. Each member's pace is its battle speed (a foot soldier 38, a rider 62
   to 80); a party moves near its slowest (3/4 the slowest, 1/4 the average), compressed so riders are about 1.5x foot. Big
   parties are slower, and a party mostly of riders loses more in forest, hills and swamp, unless the mounts are at home there.
   The same for you, lords, bands, patrols and your companions' parties (each with its own base: MAP_BASE x its factor). */
const PACE_REF=38,MAP_BASE=34;
function paceRatio(sp){let n=0,sum=0,mn=1e9;for(const [s,c] of sp){if(!c)continue;n+=c;sum+=s*c;if(s<mn)mn=s}return n?Math.pow((.75*mn+.25*sum/n)/PACE_REF,.7):1}
const sizeMul=n=>Math.max(.7,1-.006*Math.max(0,n-12));
const mountedShare=sp=>{let n=0,m=0;for(const [s,c] of sp){n+=c;if(s>=60)m+=c}return n?m/n:0};
const roughFor=(x,y,ign)=>{const t=terrAt(x,y);ign=ign||[];return t===T_FOREST&&!ign.includes('forest')||t===T_HILL&&!ign.includes('hills')||climAt(x,y)==='swamp'&&!ign.includes('swamp')};
function listSpeeds(list){const m={};for(const k of list){const s=(ST[k]&&ST[k].spd)||PACE_REF;m[s]=(m[s]||0)+1}return Object.entries(m).map(([s,c])=>[+s,c])}
function partySpeed(o,list){const sp=listSpeeds(list);return MAP_BASE*paceRatio(sp)*sizeMul(list.length)*Math.max(.45,speedAt(o.x,o.y)||1)*(mountedShare(sp)>=.5&&roughFor(o.x,o.y)?.8:1)}
// your hero's own pace: on foot a fit 40; mounted, by the mount
// a lord's army: its pace, slowed by its baggage train unless it is mostly mounted
const lordSpeed=l=>partySpeed(l,l.troops)*(mountedShare(listSpeeds(l.troops))>=.5?1:.85);
const heroPace=()=>{const m=mountDef();return m?40+150*(m.m.travel||0):40};
function bandSpeeds(){const sp=[[heroPace(),1]];for(const k in P.troops)if(P.troops[k]>0)sp.push([(ST[k]&&ST[k].spd)||PACE_REF,P.troops[k]]);for(const id of compsInBand())sp.push([(ST[id]&&ST[id].spd)||PACE_REF,1]);return sp}
// your band's pace before the ground: the slowest of you and its size, the wounded you carry and your own wounds, Athletics on
// foot or Riding in the saddle, gear, a Guide, Forced March; at most 1.8x
function bandPace(){
  const sp=bandSpeeds(),n=sp.reduce((a,[,c])=>a+c,0),m=mountDef(),w=woundedN(),hpf=P.hp/Math.max(1,vitals()[0]);
  let p=paceRatio(sp)*sizeMul(n)*(1+gm('travel')-(m&&m.m.travel||0))*(m?1+.02*skill('ride'):1+.015*skill('athl'));
  p*=1-.5*w/Math.max(1,n+w);if(hpf<.5)p*=1-.4*(.5-hpf);
  const g=roleOf('guide');if(g&&compInBand(g))p*=1.03+.01*compSkill(g,'scout');if(has('forced'))p*=1.15;
  return Math.min(1.8,p);
}
function travelMul(){let t=speedAt(P.x,P.y,P.race,mountIgn())||1;if(t<1&&has('path'))t=1-(1-t)/2;return bandPace()*t*(mountedShare(bandSpeeds())>=.5&&roughFor(P.x,P.y,mountIgn())?.8:1)}
// daily price of the land you camp in; holdings shelter you from all of it
function survive(){
  const clim=climAt(P.x,P.y),home=RACES[P.race].home,shelter=TOWNS.some(t=>Math.hypot(t.x-P.x,t.y-P.y)<48);
  if(shelter)return;
  // Survival: each day in harsh land teaches it, and it softens what the land costs (sv: the share still paid)
  const harsh=clim==='frost'&&!home.includes('frost')||clim==='desert'&&!home.includes('desert')||clim==='swamp'&&!home.includes('swamp');if(harsh)train('surv',4);
  const sv=1-.06*skill('surv');
  if(clim==='frost'&&!home.includes('frost')){
    foodTake(Math.ceil(eatPerDay()*.5*sv));
    const need=Math.ceil((partySize()+1)/5);
    if(goodN('furs')<need){P.morale-=Math.ceil(3*sv);log('Your band shivers through the night. Carry 1 fur for every 5 people in the frost ('+need+' needed).','bad')}
  }else if(clim==='desert'&&!home.includes('desert')&&!nearWater(P.x,P.y,3)){P.morale-=Math.ceil(3*sv);log('The desert sun saps your band. Rest by an oasis or a holding.','bad')}
  else if(clim==='swamp'&&!home.includes('swamp')&&Math.random()<Math.max(.05,.25-.02*skill('surv'))){
    P.morale-=Math.ceil(5*sv);const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);
    if(ks.length&&Math.random()<.5){const k=ks[rint(0,ks.length-1)];P.remove(k);log('Swamp fever takes '+an(ST[k].n.toLowerCase())+'.','bad')}else log('Swamp fever spreads through the camp. Morale drops.','bad');
  }
}
function dayTick(){
  G.day++;
  const cnt=troopCount()+woundedN()+cparties().reduce((a,p)=>a+p.troops.length,0),wage=Math.ceil(cnt*.5+mountedN()*.5)+2*compCount(),eat=eatPerDay();
  if(wage>0){if(P.gold>=wage)P.gold-=wage;else{P.gold=0;P.morale-=6;log('You cannot pay your troops. Morale falls.','bad');mood('unpaid')}}
  if(foodN()>=eat)foodTake(eat);else{foodTake(eat);P.morale-=8;log('Your band goes hungry. Buy food in a town, or hunt.','bad');mood('hungry')}
  // fresh food spoils; a varied larder (3 or more kinds) lifts spirits
  let rot=0;for(const g of FOODS){const r=GOODS[g].spoil,n=goodN(g);if(r&&n)rot+=goodTake(g,Math.min(n,Math.floor(n*r+Math.random())))}
  if(rot>2)log(rot+' food spoils in the packs. Fresh food is eaten first; grain and cheese keep.','bad');
  const kinds=foodKinds();if(kinds>=3)P.morale+=kinds-2;
  for(const id in P.comps){const r=COMPS[id].rival;if(r&&P.comps[r]&&Math.random()<.12){P.comps[id].ap--;P.comps[r].ap--;log(COMPS[id].short+' and '+COMPS[r].short+' quarrel by the fire. Both are unhappy.','bad')}}
  if(P.morale<25&&cnt>0&&Math.random()<.5){const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);const k=ks[rint(0,ks.length-1)];P.remove(k);log(cap1(an(ST[k].n.toLowerCase()))+' deserts in the night.','bad')}
  survive();
  P.morale=clamp(P.morale,Math.min(30,skill('lead')*3)+tm('morale'),100);
  if(bandits.length<BANDITS&&Math.random()<.6)spawnBandit(false);
  if(P.renown>=250&&!G.rankSeen){G.rankSeen=1;log('Your name carries across Ashmark. A throne is within reach.','gold')}
  if(P.fac){P.gold+=troopCount();addHonor(P.fac,1,true)}
  worldDay();patrolDay();relDay();monsterDay();siteDay();critterDay();siegeDay();landDay();econDay();estateDay();caravanDay();shipDay();compDay();woundedDay();chiefDay();refugeeDay();caravanUpkeep();fiefDay();questDay();
  saveGame(true);
  if(!P.stay&&Math.random()<.32)roadEvent();
}
function updateWorld(dt){
  if(G.paused)return;
  const d=dt*G.speed*WORLD_PACE;
  G.clock+=dt*G.speed*DAY/DAY_SECONDS;if(G.clock>=DAY){G.clock-=DAY;dayTick()}
  G.encCool=Math.max(0,G.encCool-d);regenVitals(d/DAY);
  if(P.stay&&stayTick(d))return;
  if(G.capture&&!G.modal){showCapture();return}
  raidTick(d);landWatch();
  if(P.siege){const st=townBy(P.siege.town);if(!st||Math.hypot(P.x-st.x,P.y-st.y)>80){P.siege=null;log('You march away and the siege'+(st?' of '+st.name:'')+' is lifted.','bad')}}
  if(G.chase){const o=G.chase,k=objKind(o);if(!k||o.dead||k==='site'&&!o.pickable()||k==='estate'&&!bldLv(townBy(o.town)||{},o.k))G.chase=null;else{P.tx=o.x;P.ty=o.y;
    if(Math.hypot(o.x-P.x,o.y-P.y)<=REACH&&!G.modal&&(G.encCool<=0||['town','site','critter','caravan','refugee','worker','estate','patrol'].includes(k))){interact(o);return}}}
  if(P.tx!=null){
    const dx=P.tx-P.x,dy=P.ty-P.y,dist=Math.hypot(dx,dy);
    if(dist<2){P.tx=null}
    else{
      const step=Math.min(dist,MAP_BASE*travelMul()*d*(P.morale<25?.8:1));
      P.dir=dx>=0?1:-1;
      if(walk(P,dx,dy,step)){P.stuck=0;train('scout',step/TILE*.08);if(mountDef())train('ride',step/TILE*.1)}else{P.stuck+=d;if(P.stuck>.4){P.tx=null;P.stuck=0}}
    }
  }
  if(updateSites())return;
  updateFights(d);
  updateShips(d);
  // every party's brain (brains.js), then the beasts and the wanderers
  if(updateParties(d)||updateMonsters(d)||updateCritters(d)||updateRefugees(d))return;
  updateFolk(d);
  for(const t of TOWNS){
    const dd=Math.hypot(P.x-t.x,P.y-t.y);
    if(dd<11&&G.lastTown!==t&&!G.modal){
      approachHolding(t);
      return;
    }
    if(G.lastTown===t&&dd>28)G.lastTown=null;
  }
}

// the wounded heal: each day a share of them is fit again (more with Medicine, more near a friendly holding)
function woundedDay(){const W0=P.wounded||{},near=TOWNS.some(t=>!hostileTo(t.owner)&&Math.hypot(t.x-P.x,t.y-P.y)<80),r=Math.min(.9,(.2+.03*skill('med')+(near?.2:0))*(P.stay?2:1));let back=0;
  for(const k in W0){const n=W0[k];if(!n)continue;const h=Math.min(n,Math.floor(n*r+Math.random()));if(h){W0[k]-=h;P.add(k,h);back+=h}if(!W0[k])delete W0[k]}
  if(back)log(back+' of your wounded '+(back>1?'are':'is')+' fit to fight again.','good')}
