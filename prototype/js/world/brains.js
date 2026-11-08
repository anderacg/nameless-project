'use strict';
/* ---------- brains: how each kind of party behaves on the map. Every moment each party's brain takes the same steps: its
   cool-down runs, it sizes you up (how far, whether it can see you: hidden in woods or hills you are harder to see, inside a
   holding not at all), then it does what its kind does: hunt you, keep clear of you, or go about its business. One class per
   kind; the party's own data stays on the party. think(o, d) returns true when it opened an encounter (the world stops there).
   updateParties(d) runs them all, kind by kind, each party by its tier (parties.js lodEach; a far one would take its brain's
   farStep, which none has yet). Every way over the land is the router's (router.js). ---------- */
const GRACE_GAP=WORLD_SCALE.ai.graceGap;
class Brain{
  cool(o,d){o.cool=Math.max(0,(o.cool||0)-d)}
  // you, from where it stands
  look(o){const p=TravelAwareness.target(o)||P,dx=p.x-o.x,dy=p.y-o.y;return{dx,dy,d:Math.hypot(dx,dy)}}
  // how far it sees you: its eyes, less when you are hidden, nothing while you stay inside a holding
  sight(base){return P.stay?0:base*(hiddenAt(P.x,P.y)?.55:1)}
  // close enough to meet you, and free to (in the grace after a fight, G.encCool, nothing meets you: hunters keep GRACE_GAP off)
  canMeet(o,dist){return dist<(WORLD_BATTLE.on?worldBattleReach(o):10)&&o.cool<=0&&G.encCool<=0&&!G.modal&&(G.chase===o||TravelAwareness.sees(o))}
  // which way it faces after moving from ox
  face(o,ox){if(Math.abs(o.x-ox)>.01)o.dir=o.x>ox?1:-1}
  think(o,d){return false}
}

// a lord: marches to war, lays siege, rests in his realm's holdings; hunts you if your realms are at odds and he is the stronger;
// at home, rides out against bands and beasts that come near his realm's holdings and estates; on the road, turns on a beast
// near him he can beat (defence.js)
const LORD_TRIPS=new WeakMap();// (each lord's trip: its end, x, y, and whether it was long when he set out; never saved)
class LordBrain extends Brain{
  // (his way to tx, ty by holding t: a trip of more than TRAVEL_STYLES.long px when he set out on it (LORD_TRIPS) keeps to the roads a
  // little all the way (lordKeep, router.js wayKeep), so his column gets the road's pace (never dropped near its end: the way found
  // again there cut across the land, off the road); a shorter one as the land goes)
  way(l,tx,ty,t){const T=TRAVEL_STYLES;let k=LORD_TRIPS.get(l);if(!k||k.x!==tx||k.y!==ty)LORD_TRIPS.set(l,k={x:tx,y:ty,long:Math.hypot(tx-l.x,ty-l.y)>T.long});
    return{x:tx,y:ty,tw:t,road:k.long&&T.lordKeep}}
  think(l,d){
    if(l.dead)return false;if(l.follow||l.with){Host.lordStep(l,d,this);return false}// (he follows you, or his marshal: his place in the column, hosts.js)
    this.cool(l,d);
    if((l.defend||LandDefence.lordPasses(l))&&LandDefence.lordDefends(l,d))return false;
    if(l.inside){const h=townBy(l.inside);if(l.state==='rest'&&l.tgt===l.inside&&h&&h.owner===l.fac)return false;l.leave()}
    if(inFight(l))return false;
    // (lying in wait in the trees: waylay.js)
    if(l.waylay||['march','home','patrol'].includes(l.state)&&!TravelAwareness.sees(l)&&Waylay.consider(l,d,true)){const r=Waylay.step(l,moveStep(lordSpeed(l),d),d);if(r==='met')return true;if(r)return false}
    const v=this.look(l),pd=v.d,hostile=hostileTo(l.fac)&&!lordSpares(l),mul=lordSpeed(l)/26*Host.paceFor(l);// (26: a lord's old pace; a marshal's, his host's: hosts.js)
    const relief=hostile&&l.state==='relieve'&&!!P.siege&&P.siege.town===l.tgt,st=hostile?(relief?'attack':stance(l.power(),l)):null,see=TravelAwareness.sees(l)?travelDetection(l).range:0;
    if(st==='afraid'&&l.state==='siege'&&pd<see){l.state='home';l.tgt=Spatial.nearest(fiefsOf(l.fac),l.x,l.y).name;log(l.name+' abandons the siege as your band approaches.','good')}
    const dread=W.lords.find(o=>!o.dead&&!o.inside&&o!==l&&atWar(o.fac,l.fac)&&Math.hypot(o.x-l.x,o.y-l.y)<WORLD_SCALE.ai.dread&&o.power()>=l.power()*1.5);
    if(dread&&l.state==='march'&&fiefsOf(l.fac).length){l.state='home';l.tgt=Spatial.nearest(fiefsOf(l.fac),l.x,l.y).name}
    if(!(hostile&&l.cool<=0&&l.state!=='siege'&&stanceMove(l,st,pd,v.dx,v.dy,see,moveStep(26*mul,d),true))){
      let t=townBy(l.tgt);if(!t){lordThink(l);return false}
      // (afraid of you (fearOf) or of a lord far stronger (dread): never home through him; another fief of his that is safe, else away
      // from him (the owner, 2026-11-01: "same goes for all entity"; engage.js safeRefuge))
      {const f=hostile&&fearOf(l,st)||dread;if(f&&l.state!=='siege'&&!safeRefuge(l,{x:t.x,y:t.y+12},f)){const alt=Spatial.nearest(fiefsOf(l.fac).filter(h=>h!==t&&safeRefuge(l,{x:h.x,y:h.y+12},f)),l.x,l.y);
        if(!alt){Router.flee(l,f,moveStep(26*mul,d));return false}l.tgt=alt.name;t=alt}}
      // (a walled holding it marches on to take: its camp outside a gate, world/townwalls.js; else before its keep's gate)
      const cp=atWar(l.fac,t.owner)&&TownWall.camp(t,l),tx=(cp?cp.x:t.x)+(l.state==='siege'?(l.id.endsWith('0')?-16:16):0),ty=cp?cp.y:t.y+12,dd=Math.hypot(tx-l.x,ty-l.y);
      if(dd>4){const step=moveStep(26*mul,d);if(dread)EscapeStamina.run(l,dread,step,n=>Router.travel(l,{x:tx,y:ty,tw:t},n),true);else Router.travel(l,this.way(l,tx,ty,t),step)}
      else if(l.state==='march'){
        if(atWar(l.fac,t.owner)){l.state='siege';l.sd=0;worldEmit('siege:laid',{town:t,lord:l});
          {const F=FACS[l.fac].n,mine=t.owner==='player';worldEvent({text:l.name+' of the '+F+' lays siege to '+t.name+(mine?', your fief!':'.'),cls:t.owner===P.fac||mine?'bad':'',x:t.x,y:t.y,fac:[l.fac,t.owner],towns:[t],heard:['siege',t],kind:'',
            was:Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5||t.owner===P.fac||mine,past:l.name+' of the '+F+' laid siege to '+t.name,also:mine?' It is your fief.':''})}}
        else lordThink(l);
      }else if(l.state==='home'||l.state==='patrol'||l.state==='relieve'){l.state='rest';if(!l.shelterWhy(t))l.enter(t)}
      else if(l.state==='rest'&&!l.shelterWhy(t))l.enter(t);
    }
    if(hostile&&st==='attack'&&this.canMeet(l,pd)){startEncounter({kind:'lord',ref:l,list:l.troops.slice()});return true}
    return false;
  }
}

// a bandit band: hunts you if it is the stronger, flees if it is not, wanders otherwise, and shelters in a camp by night. Afraid of
// your army and remembering it (engage.js fearOf), it runs from it, just after a fight too (its cool-down), or by night into a camp
// your army is neither at nor across the way to (campNear); never into your army to reach its own
// (a band that works a stretch of road (haunt: a bounty's band out of its hideout, world/quests.js): further than HAUNT.r tiles
// from it, it heads back that way when it picks its way)
const HAUNT={r:8};
class BandBrain extends Brain{
  think(b,d,night){
    if(inFight(b))return false;
    const v=this.look(b);this.cool(b,d);
    const st=stance(b.power()*b.nerve,b),fear=fearOf(b,st),sp=moveStep(partySpeed(b,b.troops),d);
    if(!fear&&this.hunt(b,sp)){b.waylay=null;return false}// (a caravan it can take, ridden down before all else but its fear of you: BAND_HUNT)
    if(b.waylay||!TravelAwareness.sees(b)&&Waylay.consider(b,d)){const r=Waylay.step(b,sp,d);if(r==='met')return true;if(r)return false}// (lying in wait: waylay.js)
    const home=night&&campNear(b,fear);
    if(fear&&home||b.cool>0&&!fear||!stanceMove(b,st,v.d,v.dx,v.dy,TravelAwareness.sees(b)?travelDetection(b).range:0,sp,true)){
      if(home){const s=fear?sp*.85:moveStep(16,d);Router.travel(b,home,s)||walk(b,home.x-b.x,home.y-b.y,Math.min(Math.hypot(home.x-b.x,home.y-b.y),s));if(Math.hypot(home.x-b.x,home.y-b.y)<8){(home.bands=home.bands||[]).push(b);b.x=home.x;b.y=home.y;b.gone=true;return false}}
      else if(!(b.lootGo&&FieldLootQuest.seek(b,d))){b.t-=d;if(b.t<=0){b.t=2+Math.random()*3;b.a=Math.random()*6.283;b.idle=Math.random()<.3;if(b.haunt&&Math.hypot(b.haunt.x-b.x,b.haunt.y-b.y)>b.hauntR*TILE)b.a=Math.atan2(b.haunt.y-b.y,b.haunt.x-b.x)}if(!b.idle)walk(b,Math.cos(b.a),Math.sin(b.a),moveStep(12,d))}}
    if(this.canMeet(b,v.d)){meetBand(b);return true}
    return false;
  }
  // (bandits, goblins, looters: the nearest caravan in sight it thinks it can take, ridden down (true); the caravan's own brain starts
  // the fight when it is upon it (CaravanBrain: its guards against it), data/outlaws.js BAND_HUNT)
  hunt(b,sp){const X=BAND_HUNT;if(!X.on||b.cool>0||b.cvT)return false;const mine=b.power()*(b.nerve||1)*X.dare;let c=null,bd=X.see;
    for(const o of W.caravans){if(o.gone||o.idle||inFight(o))continue;const dd=Math.hypot(o.x-b.x,o.y-b.y);if(dd<bd&&o.power()<=mine){bd=dd;c=o}}
    if(!c)return false;b.idle=false;const s=sp*X.pace,x0=b.x,y0=b.y;if(!Router.travel(b,{x:c.x,y:c.y},s)||b.x===x0&&b.y===y0)walk(b,c.x-b.x,c.y-b.y,Math.min(bd,s));return true}
}
// (a band that fought in your battle, against you or beside you, knows where your army stands: the weaker leaves the field
// remembering every group of it (TravelAwareness), afraid of it as if it had just seen it; battle/sides.js puts it back on the map.
// Its power weighed without caching it (pw), so the battle's outcome stays as it was)
worldOn('battle:ended',({enc:e})=>{if(!e)return;for(const f of [e.ref,...(e.foes||[]),...(e.allies||[])]){const b=f&&(f.src||f);
  if(b&&b.mapKind==='band'&&bandits.includes(b)&&!b.fight&&stance(b.pw||rating(b.troops,chiefLv(b)))==='afraid')for(const g of TravelAwareness.snapshot||TravelGroups.groups())TravelAwareness.notice(b,g.id)}});

// your companion's party: keeps clear of what it cannot beat, runs down bandits and weaker enemies near it, otherwise follows
// you, patrols its holding's land, comes back to you, or shelters in a holding (stay.js)
class CompanionBrain extends Brain{
  think(p,d){
    if(inFight(p))return false;if(!p.troops.length){cpDisband(p.cid,false);return false}
    if(p.order==='stay'){const t=townBy(p.base);if(!t||p.shelterWhy(t)&&!(p.inside&&besieged(t)&&!hostileTo(t.owner))){if(p.inside)p.leave();p.order='follow';log(COMPS[p.cid].short+(t?' can no longer stay in '+t.name:' has nowhere to stay')+' and rides to rejoin you.','bad')}
      else if(p.inside)return false;}// inside: off the map
    this.cool(p,d);const sp=moveStep(partySpeed(p,p.troops)*.9,d),ox=p.x,mine=p.power(),A=WORLD_SCALE.ai,go=(x,y,s)=>{const dd=Math.hypot(x-p.x,y-p.y);if(dd>1)Router.travel(p,{x,y},s)||walk(p,x-p.x,y-p.y,Math.min(dd,s))};
    const foes=[...bandits.filter(b=>!b.fight),...W.lords.filter(l=>!l.dead&&!l.inside&&!l.fight&&hostileTo(l.fac))].map(o=>[o,Math.hypot(o.x-p.x,o.y-p.y),o.power()]).filter(([,dd])=>dd<A.compFoes).sort((a,b)=>a[1]-b[1]);
    const strong=foes.find(([,,pw])=>pw>mine*1.2),prey=p.order!=='return'&&p.order!=='follow'&&foes.find(([,,pw])=>pw<=mine);// (following, it keeps its place in your host: hosts.js)
    // (a foe too strong near: back to you, unless he stands at you or across the way, then away from him: engage.js safeRefuge)
    if(strong&&strong[1]<A.compFlee){if(safeRefuge(p,P,strong[0]))EscapeStamina.run(p,strong[0],sp,n=>go(P.x,P.y,n),true);else Router.flee(p,strong[0],sp)}
    else if(prey&&p.cool<=0){go(prey[0].x,prey[0].y,sp);if(prey[1]<10){startFight([p],[prey[0]]);p.cool=3}}
    else if(p.order==='follow')Host.keep(p,sp,go);// (its place in your column: hosts.js)
    else if(p.order==='return'){go(P.x,P.y,sp*1.2);if(Math.hypot(P.x-p.x,P.y-p.y)<12)cpDisband(p.cid,true)}
    else if(p.order==='stay'){const t=townBy(p.base);Router.travel(p,gateGoal(t),sp);if(Math.hypot(t.x-p.x,t.y+12-p.y)<8){p.enter(t);log(COMPS[p.cid].short+'’s party takes lodgings in '+t.name+'.')}}
    else{const t=townBy(p.base);if(!t){p.order='follow';return false}
      if(p.wx==null||Math.hypot(p.wx-p.x,p.wy-p.y)<6){for(let k=0;k<20;k++){const x=t.x+rint(-A.compBeat[0],A.compBeat[0]),y=t.y+rint(-A.compBeat[1],A.compBeat[1]);if(passable(terrAt(x,y))){p.wx=x;p.wy=y;break}}}
      if(p.wx!=null)go(p.wx,p.wy,sp*.8)}
    this.face(p,ox);return false;
  }
}

// a holding's patrol: on its watch it walks from estate to estate, runs down bandits, beasts (defence.js LandDefence prey: the one its
// holding sets it on, or one in its sight) and enemies it can beat on its land,
// arrests you if you are wanted or hostile, and goes home when its watch ends, when it is weak, or when an army is too near
class PatrolBrain extends Brain{
  think(p,d){
    const t=townBy(p.home);if(!t||t.owner!==p.fac||!p.troops.length){if(t&&t.owner===p.fac)t.watch.back(p);p.gone=true;return false}
    if(inFight(p))return false;
    this.cool(p,d);const sp=moveStep(partySpeed(p,p.troops)*.75,d),ox=p.x;
    const threat=W.lords.find(l=>!l.dead&&!l.inside&&atWar(l.fac,p.fac)&&Math.hypot(l.x-p.x,l.y-p.y)<PATROL.see);
    const home=besieged(t)||watchOf(p)!==watchNow()||p.troops.length<t.T.patrol.size/2||threat&&threat.power()>p.power();
    const v=this.look(p),pd=v.d,hostile=hostileTo(p.fac),wanted=!!crimeAt(t)&&p.fac!=='player',sees=TravelAwareness.sees(p);
    const afraid=hostile&&stance(p.power(),p)==='afraid',fear=afraid&&fearOf(p,'afraid');
    if(sees&&(hostile||wanted)&&!home&&!afraid&&p.cool<=0){const st=G.encCool>0?Math.min(sp,pd-GRACE_GAP):sp;// (in the grace, no step into the gap)
      if(st>0)Router.travel(p,{x:p.x+v.dx,y:p.y+v.dy},st)||walk(p,v.dx,v.dy,Math.min(pd,st));
      if(this.canMeet(p,pd)){patrolMeet(p);return true}}
    // (afraid of you, in its sight or remembered: home and in, unless your army is at its gate or across its way there: then away from it)
    else if(fear){const g=gateGoal(t);if(!safeRefuge(p,g,fear))Router.flee(p,fear,sp);else{EscapeStamina.run(p,P,sp,n=>Router.travel(p,g,n),true);if(Math.hypot(t.x-p.x,t.y+12-p.y)<8)t.watch.back(p)}}
    else if(threat&&!home&&Math.hypot(threat.x-p.x,threat.y-p.y)<16)startFight([p],[threat]);
    else{
      const b=!home&&LandDefence.prey(p);
      if(b){const bd=Math.hypot(b.x-p.x,b.y-p.y);Router.travel(p,b,sp)||walk(p,b.x-p.x,b.y-p.y,Math.min(bd,sp));
        if(bd<10)startFight([p],[b])}
      else if(home){if(threat)EscapeStamina.run(p,threat,sp,n=>Router.travel(p,gateGoal(t),n),true);else Router.travel(p,gateGoal(t),sp);if(Math.hypot(t.x-p.x,t.y+12-p.y)<8)t.watch.back(p)}
      else{const at=p.wx!=null&&Math.hypot(p.wx-p.x,p.wy-p.y)<6;// on its beat: stop a moment at each building, then on to the next
        if(at&&(p.wait||0)>0)p.wait-=d;else{if(p.wx==null||at||Math.random()<d*.02)t.watch.beat(p);if(!Router.travel(p,{x:p.wx,y:p.wy},sp))p.wx=null}}}// (no way there over land: another stop next time)
    this.face(p,ox);return false;
  }
}

// a caravan (CaravanParty, caravans.js): on the road to its market (keeping to the roads where they go: Router.travel's road),
// off it only away from you if you are its enemy; bandits and enemy lords near it fall on it
// (each caravan's heading on its way, its last step's: never saved)
const CARAVAN_HEAD=new WeakMap();
class CaravanBrain extends Brain{
  // (another caravan just in front of it, heading as it does: it holds back, CARAVAN_GAP; each one's heading its last step's, as
  // the road goes (a road may wind away from its gate a while), else straight for its gate: CARAVAN_HEAD)
  heading(c,gate,gd){return CARAVAN_HEAD.get(c)||[(gate.x-c.x)/(gd||1),(gate.y-c.y)/(gd||1)]}
  behind(c,gate,gd){const X=CARAVAN_GAP,[ux,uy]=this.heading(c,gate,gd);
    return W.caravans.some(o=>{if(o===c||o.gone||o.idle||inFight(o)||Math.hypot(o.x-c.x,o.y-c.y)>X.px)return false;const g=gateGoal(townBy(o.to)||{x:o.x,y:o.y}),[vx,vy]=this.heading(o,g,Math.hypot(g.x-o.x,g.y-o.y));
      return ux*vx+uy*vy>=X.dot&&(o.x-c.x)*ux+(o.y-c.y)*uy>0})}
  think(c,d){
    if(c.idle||inFight(c))return false;
    this.cool(c,d);const to=townBy(c.to);if(!to||!c.mine&&atWar(to.owner,c.fac)){c.gone=true;return false}
    const v=this.look(c),pd=v.d,scared=!c.mine&&hostileTo(c.fac)&&(TravelAwareness.sees(c)||fearSeen(c));// (in its sight, or remembered: engage.js fearSeen)
    // (afraid of you: the gate near, a run for it; you at the gate, another holding of its realm; else away from you)
    const gate=gateGoal(to),gd=Math.hypot(gate.x-c.x,gate.y-c.y),X=CARAVAN_FEAR,block=scared&&Math.hypot(P.x-gate.x,P.y-gate.y)<X.block;
    if(block){const alt=Spatial.nearest(TOWNS.filter(t=>t!==to&&t.owner===c.fac),c.x,c.y);if(alt)c.to=alt.name}
    // (you between it and its gate: once a trip it turns for a holding of its realm, or back whence it came, that lies the other way
    // from you, rather than run off and come back for ever (the owner, 2026-10-31: "stuck in the loop between going to
    // castle or escape from player"))
    else if(scared&&!(gd<pd*X.dash)&&!c.turned){const away=TOWNS.filter(t=>t!==to&&!t.gone&&(t.owner===c.fac||t.name===c.from)&&!atWar(t.owner,c.fac)&&(g=>(g.x-c.x)*(P.x-c.x)+(g.y-c.y)*(P.y-c.y)<0)(gateGoal(t))),alt=Spatial.nearest(away,c.x,c.y);
      if(alt){c.to=alt.name;c.turned=true;return false}}
    if(scared&&!block&&gd<pd*X.dash){const ox=c.x;Router.travel(c,{...gate,road:true},moveStep(CARAVAN_SPD,d));this.face(c,ox)}
    else if(scared){const ox=c.x;Router.flee(c,{x:c.x+v.dx,y:c.y+v.dy},moveStep(CARAVAN_SPD*.9,d));this.face(c,ox)}
    else{const ox=c.x,oy=c.y;Router.travel(c,{...gateGoal(to),road:true},moveStep(CARAVAN_SPD*armyGround(c,caravanGround)*(this.behind(c,gate,gd)?CARAVAN_GAP.slow:1),d));c.dir=c.x>=ox?1:-1;
      const m=Math.hypot(c.x-ox,c.y-oy);if(m>0)CARAVAN_HEAD.set(c,[(c.x-ox)/m,(c.y-oy)/m])}
    if(Math.hypot(to.x-c.x,to.y+12-c.y)<8){if(c.arrive(to))c.gone=true;return false}
    // preyed on: bandits close by, or a lord at war with its owner; the guards fight it out (fights.js)
    const b=bandits.find(o=>Math.hypot(o.x-c.x,o.y-c.y)<12&&!o.cvT);
    const l=!b&&W.lords.find(o=>!o.dead&&!o.inside&&o.state!=='siege'&&(c.mine?hostileTo(o.fac):atWar(o.fac,c.fac))&&Math.hypot(o.x-c.x,o.y-c.y)<14);
    if(b||l){startFight([c],[b||l]);return false}
    if(!c.gone&&this.canMeet(c,pd)&&G.chase===c){c.meet();return true}
    return false;
  }
}
const BRAINS={lord:new LordBrain(),band:new BandBrain(),cparty:new CompanionBrain(),patrol:new PatrolBrain(),caravan:new CaravanBrain()};

/* each kind's moment, and then what the kind does together */
function updateBands(d){
  // bands shelter in a camp at night (its site's bands, sites.js) and ride out at dawn
  const night=Clock.isNight;if(!night)nightCamps().forEach(campEmpty);const met=lodEach(bandits,BRAINS.band,d,night);
  if(bandits.some(b=>b.gone))bandits=bandits.filter(b=>!b.gone);return met;
}
function updateLords(d){
  if(lodEach(W.lords,BRAINS.lord,d))return true;
  // lords at war who meet fight it out
  for(let i=0;i<W.lords.length;i++){const a=W.lords[i];if(a.dead||a.inside||a.fight)continue;
    for(let j=i+1;j<W.lords.length;j++){const b=W.lords[j];if(!b.dead&&!b.inside&&!b.fight&&!(a.state==='siege'&&b.state==='siege')&&atWar(a.fac,b.fac)&&Math.hypot(a.x-b.x,a.y-b.y)<20){startFight([a],[b]);break}}}
  return false;
}
function updateCParties(d){lodEach(cparties(),BRAINS.cparty,d)}
// the patrols' own moments (PatrolBrain): true if one of them opened an encounter
function movePatrols(d){
  if(lodEach(W.patrols,BRAINS.patrol,d))return true;
  W.patrols=W.patrols.filter(p=>!p.gone);return false;
}
// the holdings' patrols at once, as the systems run them in turn ('patrols', 'land defence', 'patrol moves'): the change of the
// watch, the one on duty setting out (patrols.js Watches frame); threats on the land, the watch and the lords at home riding out
// (defence.js LandDefence look); then the patrols' own moments
function updatePatrols(d){
  Watches.frame(d);
  LandDefence.look(d);
  return movePatrols(d);
}
function updateCaravans(d){
  if(lodEach(W.caravans,null,d))return true;
  for(const b of bandits)if(b.cvT&&Math.random()<.01)b.cvT=0;
  W.caravans=W.caravans.filter(c=>!c.gone);return false;
}
// the other parties' moments (companions', bands', lords', caravans'): true if one of them opened an encounter
function moveParties(d){updateCParties(d);return updateBands(d)||updateLords(d)||updateCaravans(d)}
// every party's moment, in the systems' order: true if one of them opened an encounter
function updateParties(d){return moveParties(d)||updatePatrols(d)}
// its work in the world's frame (core/systems.js): every party's brain, the patrols' last, after the change of the watch
// (patrols.js, 101) and the land's defence (defence.js, 102); one that opens an encounter ends the frame
Systems.add({name:'parties',order:{frame:100},frame:moveParties,ends:true});
Systems.add({name:'patrol moves',order:{frame:103},frame:movePatrols,ends:true});
