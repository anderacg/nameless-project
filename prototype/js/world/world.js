'use strict';
/* ---------- world ---------- */
function spawnBandit(initial){
  for(let tries=0;tries<40;tries++){
    const x=rint(3,MW-4)*TILE+8,y=rint(3,MH-4)*TILE+8;
    if(!passable(terrAt(x,y)))continue;
    if(Math.hypot(x-P.x,y-P.y)<(initial?220:260))continue;
    const c=climAt(x,y),n=rint(3,5)+Math.floor(G.day/12),kind=c==='desert'?'raiders':c==='swamp'?'bog':'bandits';bandits.push({x,y,n,kind,list:makeEnemies(n,false,kind),t:0,a:0,idle:false,cool:0});return;
  }
}
function walk(o,dx,dy,step,ok){
  const a0=Math.atan2(dy,dx);
  for(const off of [0,.6,-.6,1.2,-1.2,1.9,-1.9]){const a=a0+off,nx=o.x+Math.cos(a)*step,ny=o.y+Math.sin(a)*step;if(passable(terrAt(nx,ny))&&(!ok||ok(nx,ny))){o.x=nx;o.y=ny;return true}}
  return false;
}
// a click on something you already stand beside opens it at once, even if you just left it or fled from it
// touching distance: you interact with something only when you reach it; a click on something farther away walks you there
const REACH=14;
// what lies under a click: the nearest clickable thing you can see
function pickAt(wx,wy){
  const V=vis(),c=[],add=(o,r,dy)=>{const d=Math.hypot(o.x-wx,o.y-(dy||0)-wy);if(d<r&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([d,o])};
  TOWNS.forEach(t=>add(t,18,4));W.lords.forEach(l=>{if(!l.dead)add(l,10,4)});W.monsters.forEach(m=>add(m,11,6));bandits.forEach(b=>add(b,10,4));
  CAMPS.forEach(k=>{if(!k.cleared)add(k,12)});W.sites.forEach(s=>{if(s.seen)add(s,12,4)});W.critters.forEach(k=>add(k,9,4));(W.caravans||[]).forEach(k=>add(k,11,5));(W.refugees||[]).forEach(k=>add(k,10,4));(W.folk||[]).forEach(k=>add(k,6,4));
  TOWNS.forEach(t=>{if(!t.bld||Math.hypot(t.x-P.x,t.y-P.y)>V+240)return;const sp=bldSpots(t);for(const k in sp)if(bldLv(t,k)){const p=sp[k];if(Math.hypot(p.x-wx,p.y-wy)<13)add(estatePick(t,k),13)}});
  c.sort((a,b)=>a[0]-b[0]);return c.length?c[0][1]:null;
}
const objKind=o=>o&&o.est?'estate':TOWNS.includes(o)?'town':W.lords.includes(o)?'lord':W.monsters.includes(o)?'monster':bandits.includes(o)?'band':CAMPS.includes(o)?'camp':W.sites.includes(o)?'site':W.critters.includes(o)?'critter':(W.caravans||[]).includes(o)?'caravan':(W.refugees||[]).includes(o)?'refugee':(W.folk||[]).includes(o)?'worker':null;
// meet whatever you have reached
function interact(o){
  const k=objKind(o);P.tx=null;G.chase=null;
  if(k==='town')approachHolding(o);
  else if(k==='lord')lordMeet(o);
  else if(k==='monster')startMonster(o);
  else if(k==='band')meetBand(o);
  else if(k==='camp'){if(!o.cleared)startEncounter({kind:'camp',ref:o,n:rint(7,9)+Math.floor(G.day/15)})}
  else if(k==='site'){G.lastSite=o;enterSite(o)}
  else if(k==='caravan')caravanMeet(o);
  else if(k==='refugee')refugeeMeet(o);
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
// the hero's speed multiplier where they stand: ground, race, mount, Pathfinder and gear
function travelMul(){let mul=speedAt(P.x,P.y,P.race,mountIgn())||1;if(mul<1&&has('path'))mul=1-(1-mul)/2;return mul*(1+gm('travel'))}
// daily price of the land you camp in; holdings shelter you from all of it
function survive(){
  const clim=climAt(P.x,P.y),home=RACES[P.race].home,shelter=TOWNS.some(t=>Math.hypot(t.x-P.x,t.y-P.y)<48);
  if(shelter)return;
  if(clim==='frost'&&!home.includes('frost')){
    foodTake(Math.ceil(eatPerDay()*.5));
    const need=Math.ceil((partySize()+1)/5);
    if(goodN('furs')<need){P.morale-=3;log('Your band shivers through the night. Carry 1 fur for every 5 people in the frost ('+need+' needed).','bad')}
  }else if(clim==='desert'&&!home.includes('desert')&&!nearWater(P.x,P.y,3)){P.morale-=3;log('The desert sun saps your band. Rest by an oasis or a holding.','bad')}
  else if(clim==='swamp'&&!home.includes('swamp')&&Math.random()<Math.max(.05,.25-.03*skill('med'))){
    P.morale-=5;const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);
    if(ks.length&&Math.random()<.5){const k=ks[rint(0,ks.length-1)];P.troops[k]--;log('Swamp fever takes '+an(ST[k].n.toLowerCase())+'.','bad')}else log('Swamp fever spreads through the camp. Morale drops.','bad');
  }
}
function dayTick(){
  G.day++;
  const cnt=troopCount(),wage=Math.ceil(cnt*.5)+2*compCount(),eat=eatPerDay();
  if(wage>0){if(P.gold>=wage)P.gold-=wage;else{P.gold=0;P.morale-=6;log('You cannot pay your troops. Morale falls.','bad');mood('unpaid')}}
  if(foodN()>=eat)foodTake(eat);else{foodTake(eat);P.morale-=8;log('Your band goes hungry. Buy food in a town, or hunt.','bad');mood('hungry')}
  // fresh food spoils; a varied larder (3 or more kinds) lifts spirits
  let rot=0;for(const g of FOODS){const r=GOODS[g].spoil,n=goodN(g);if(r&&n)rot+=goodTake(g,Math.min(n,Math.floor(n*r+Math.random())))}
  if(rot>2)log(rot+' food spoils in the packs. Fresh food is eaten first; grain and cheese keep.','bad');
  const kinds=foodKinds();if(kinds>=3)P.morale+=kinds-2;
  for(const id in P.comps){const r=COMPS[id].rival;if(r&&P.comps[r]&&Math.random()<.12){P.comps[id].ap--;P.comps[r].ap--;log(COMPS[id].short+' and '+COMPS[r].short+' quarrel by the fire. Both are unhappy.','bad')}}
  if(P.morale<25&&cnt>0&&Math.random()<.5){const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);const k=ks[rint(0,ks.length-1)];P.troops[k]--;log(cap1(an(ST[k].n.toLowerCase()))+' deserts in the night.','bad')}
  survive();
  P.morale=clamp(P.morale,Math.min(30,skill('lead')*3)+tm('morale'),100);
  CAMPS.forEach(c=>{if(c.cleared&&G.day>=c.back){c.cleared=false}});
  if(bandits.length<BANDITS&&Math.random()<.6)spawnBandit(false);
  if(P.renown>=250&&!G.rankSeen){G.rankSeen=1;log('Your name carries across Ashmark. A throne is within reach.','gold')}
  if(P.fac){P.gold+=troopCount();addHonor(P.fac,1,true)}
  worldDay();monsterDay();siteDay();critterDay();siegeDay();landDay();econDay();estateDay();caravanDay();refugeeDay();caravanUpkeep();fiefDay();questDay();
  saveGame(true);
  if(Math.random()<.32)roadEvent();
}
function updateWorld(dt){
  if(G.paused)return;
  const d=dt*G.speed*WORLD_PACE;
  G.clock+=dt*G.speed*DAY/DAY_SECONDS;if(G.clock>=DAY){G.clock-=DAY;dayTick()}
  G.encCool=Math.max(0,G.encCool-d);regenVitals(d/DAY);
  if(G.capture&&!G.modal){showCapture();return}
  raidTick(d);landWatch();
  if(P.siege){const st=townBy(P.siege.town);if(!st||Math.hypot(P.x-st.x,P.y-st.y)>80){P.siege=null;log('You march away and the siege'+(st?' of '+st.name:'')+' is lifted.','bad')}}
  if(G.chase){const o=G.chase,k=objKind(o);if(!k||o.dead||k==='camp'&&o.cleared||k==='estate'&&!bldLv(townBy(o.town)||{},o.k))G.chase=null;else{P.tx=o.x;P.ty=o.y;
    if(Math.hypot(o.x-P.x,o.y-P.y)<=REACH&&!G.modal&&(G.encCool<=0||['town','site','critter','caravan','refugee','worker','estate'].includes(k))){interact(o);return}}}
  if(P.tx!=null){
    const dx=P.tx-P.x,dy=P.ty-P.y,dist=Math.hypot(dx,dy);
    if(dist<2){P.tx=null}
    else{
      const step=Math.min(dist,36*travelMul()*d*(P.morale<25?.8:1));
      P.dir=dx>=0?1:-1;
      if(walk(P,dx,dy,step)){P.stuck=0;train('scout',step/TILE*.08)}else{P.stuck+=d;if(P.stuck>.4){P.tx=null;P.stuck=0}}
    }
  }
  for(const b of bandits){
    const dx=P.x-b.x,dy=P.y-b.y,dist=Math.hypot(dx,dy);b.cool=Math.max(0,b.cool-d);
    const st=stance(bandPower(b)),see=95*(hiddenAt(P.x,P.y)?.55:1);
    if(b.cool>0||!stanceMove(b,st,dist,dx,dy,see,Math.min(1,speedAt(b.x,b.y)||1)*30*d,true)){b.t-=d;if(b.t<=0){b.t=2+Math.random()*3;b.a=Math.random()*6.283;b.idle=Math.random()<.3}if(!b.idle)walk(b,Math.cos(b.a),Math.sin(b.a),12*d)}
    if(dist<10&&b.cool<=0&&G.encCool<=0&&!G.modal){meetBand(b);return}
  }
  for(const c of CAMPS){if(!c.cleared&&G.encCool<=0&&!G.modal&&Math.hypot(P.x-c.x,P.y-c.y)<12){startEncounter({kind:'camp',ref:c,n:rint(7,9)+Math.floor(G.day/15)});return}}
  if(updateSites())return;
  if(updateLords(d)||updateMonsters(d)||updateCritters(d)||updateCaravans(d)||updateRefugees(d))return;
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
