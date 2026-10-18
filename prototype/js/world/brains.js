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
  look(o){const dx=P.x-o.x,dy=P.y-o.y;return{dx,dy,d:Math.hypot(dx,dy)}}
  // how far it sees you: its eyes, less when you are hidden, nothing while you stay inside a holding
  sight(base){return P.stay?0:base*(hiddenAt(P.x,P.y)?.55:1)}
  // close enough to meet you, and free to (in the grace after a fight, G.encCool, nothing meets you: hunters keep GRACE_GAP off)
  canMeet(o,dist){return dist<10&&o.cool<=0&&G.encCool<=0&&!G.modal}
  // which way it faces after moving from ox
  face(o,ox){if(Math.abs(o.x-ox)>.01)o.dir=o.x>ox?1:-1}
  think(o,d){return false}
}

// a lord: marches to war, lays siege, rests in his realm's holdings; hunts you if your realms are at odds and he is the stronger
class LordBrain extends Brain{
  think(l,d){
    if(l.dead)return false;this.cool(l,d);
    if(l.inside){const h=townBy(l.inside);if(l.state==='rest'&&l.tgt===l.inside&&h&&h.owner===l.fac)return false;l.leave()}
    if(inFight(l))return false;
    const v=this.look(l),pd=v.d,hostile=hostileTo(l.fac)&&!lordSpares(l),mul=lordSpeed(l)/26;// (26: a lord's old pace)
    const relief=hostile&&l.state==='relieve'&&!!P.siege&&P.siege.town===l.tgt,st=hostile?(relief?'attack':stance(l.power())):null,see=this.sight(WORLD_SCALE.sight.lord)*(relief?2:1);
    if(st==='afraid'&&l.state==='siege'&&pd<see){l.state='home';l.tgt=nearestOf(l,fiefsOf(l.fac)).name;log(l.name+' abandons the siege as your band approaches.','good')}
    const dread=W.lords.find(o=>!o.dead&&!o.inside&&o!==l&&atWar(o.fac,l.fac)&&Math.hypot(o.x-l.x,o.y-l.y)<WORLD_SCALE.ai.dread&&o.power()>=l.power()*1.5);
    if(dread&&l.state==='march'&&fiefsOf(l.fac).length){l.state='home';l.tgt=nearestOf(l,fiefsOf(l.fac)).name}
    if(!(hostile&&l.cool<=0&&l.state!=='siege'&&stanceMove(l,st,pd,v.dx,v.dy,see,moveStep(26*mul,d),true))){
      const t=townBy(l.tgt);if(!t){lordThink(l);return false}
      const tx=t.x+(l.state==='siege'?(l.id.endsWith('0')?-16:16):0),ty=t.y+12,dd=Math.hypot(tx-l.x,ty-l.y);
      if(dd>4)Router.travel(l,{x:tx,y:ty,tw:t},moveStep(26*mul,d));
      else if(l.state==='march'){
        if(atWar(l.fac,t.owner)){l.state='siege';l.sd=0;if(Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5||t.owner===P.fac||t.owner==='player')log(l.name+' of the '+FACS[l.fac].n+' lays siege to '+t.name+(t.owner==='player'?', your fief!':'.'),t.owner===P.fac||t.owner==='player'?'bad':'')}
        else lordThink(l);
      }else if(l.state==='home'||l.state==='patrol'||l.state==='relieve'){l.state='rest';if(!l.shelterWhy(t))l.enter(t)}
      else if(l.state==='rest'&&!l.shelterWhy(t))l.enter(t);
    }
    if(hostile&&st==='attack'&&this.canMeet(l,pd)){startEncounter({kind:'lord',ref:l,list:l.troops.slice()});return true}
    return false;
  }
}

// a bandit band: hunts you if it is the stronger, flees if it is not, wanders otherwise, and shelters in a camp by night
class BandBrain extends Brain{
  think(b,d,night){
    if(inFight(b))return false;
    const v=this.look(b);this.cool(b,d);
    const st=stance(b.power()),home=night&&campNear(b);
    if(b.cool>0||!stanceMove(b,st,v.d,v.dx,v.dy,this.sight(WORLD_SCALE.sight.band),moveStep(partySpeed(b,b.troops),d),true)){
      if(home){Router.travel(b,home,moveStep(16,d))||walk(b,home.x-b.x,home.y-b.y,Math.min(Math.hypot(home.x-b.x,home.y-b.y),moveStep(16,d)));if(Math.hypot(home.x-b.x,home.y-b.y)<8){(home.bands=home.bands||[]).push(b);b.x=home.x;b.y=home.y;b.gone=true;return false}}
      else{b.t-=d;if(b.t<=0){b.t=2+Math.random()*3;b.a=Math.random()*6.283;b.idle=Math.random()<.3}if(!b.idle)walk(b,Math.cos(b.a),Math.sin(b.a),moveStep(12,d))}}
    if(this.canMeet(b,v.d)){meetBand(b);return true}
    return false;
  }
}

// your companion's party: keeps clear of what it cannot beat, runs down bandits and weaker enemies near it, otherwise follows
// you, patrols its holding's land, comes back to you, or shelters in a holding (stay.js)
class CompanionBrain extends Brain{
  think(p,d){
    if(inFight(p))return false;if(!p.troops.length){cpDisband(p.cid,false);return false}
    if(p.order==='stay'){const t=townBy(p.base);if(!t||p.shelterWhy(t)&&!(p.inside&&besieged(t)&&!hostileTo(t.owner))){if(p.inside)p.leave();p.order='follow';log(COMPS[p.cid].short+(t?' can no longer stay in '+t.name:' has nowhere to stay')+' and rides to rejoin you.','bad')}
      else if(p.inside)return false;}// inside: off the map
    this.cool(p,d);const sp=moveStep(partySpeed(p,p.troops)*.9,d),ox=p.x,mine=p.power(),A=WORLD_SCALE.ai,go=(x,y,s)=>{const dd=Math.hypot(x-p.x,y-p.y);if(dd>1)Router.travel(p,{x,y},s)||walk(p,x-p.x,y-p.y,Math.min(dd,s))};
    const foes=[...bandits.filter(b=>!b.fight),...W.lords.filter(l=>!l.dead&&!l.inside&&!l.fight&&hostileTo(l.fac))].map(o=>[o,Math.hypot(o.x-p.x,o.y-p.y),o.power()]).filter(([,dd])=>dd<A.compFoes).sort((a,b)=>a[1]-b[1]);
    const strong=foes.find(([,,pw])=>pw>mine*1.2),prey=p.order!=='return'&&foes.find(([,,pw])=>pw<=mine);
    if(strong&&strong[1]<A.compFlee){go(P.x,P.y,sp*1.1)}
    else if(prey&&p.cool<=0){go(prey[0].x,prey[0].y,sp*1.15);if(prey[1]<10){startFight([p],[prey[0]]);p.cool=3}}
    else if(p.order==='follow'){if(Math.hypot(P.x-p.x,P.y-p.y)>28)go(P.x-14,P.y+10,sp*1.2)}
    else if(p.order==='return'){go(P.x,P.y,sp*1.2);if(Math.hypot(P.x-p.x,P.y-p.y)<12)cpDisband(p.cid,true)}
    else if(p.order==='stay'){const t=townBy(p.base);Router.travel(p,gateGoal(t),sp);if(Math.hypot(t.x-p.x,t.y+12-p.y)<8){p.enter(t);log(COMPS[p.cid].short+'’s party takes lodgings in '+t.name+'.')}}
    else{const t=townBy(p.base);if(!t){p.order='follow';return false}
      if(p.wx==null||Math.hypot(p.wx-p.x,p.wy-p.y)<6){for(let k=0;k<20;k++){const x=t.x+rint(-A.compBeat[0],A.compBeat[0]),y=t.y+rint(-A.compBeat[1],A.compBeat[1]);if(passable(terrAt(x,y))){p.wx=x;p.wy=y;break}}}
      if(p.wx!=null)go(p.wx,p.wy,sp*.8)}
    this.face(p,ox);return false;
  }
}

// a holding's patrol: on its watch it walks from estate to estate, runs down bandits and enemies it can beat on its land,
// arrests you if you are wanted or hostile, and goes home when its watch ends, when it is weak, or when an army is too near
class PatrolBrain extends Brain{
  think(p,d){
    const t=townBy(p.home);if(!t||t.owner!==p.fac||!p.troops.length){p.gone=true;return false}
    if(inFight(p))return false;
    this.cool(p,d);const sp=moveStep(partySpeed(p,p.troops)*.75,d),ox=p.x;
    const threat=W.lords.find(l=>!l.dead&&!l.inside&&atWar(l.fac,p.fac)&&Math.hypot(l.x-p.x,l.y-p.y)<PATROL.see);
    const home=besieged(t)||watchOf(p)!==watchNow()||p.troops.length<t.T.patrol.size/2||threat&&threat.power()>p.power();
    const pd=this.look(p).d,hostile=hostileTo(p.fac),wanted=!!crimeAt(t)&&p.fac!=='player',sees=pd<this.sight(PATROL.see);
    const afraid=hostile&&stance(p.power())==='afraid';
    if(sees&&(hostile||wanted)&&!home&&!afraid&&p.cool<=0){const st=G.encCool>0?Math.min(sp*1.25,pd-GRACE_GAP):sp*1.25;// (in the grace, no step into the gap)
      if(st>0)Router.travel(p,P,st)||walk(p,P.x-p.x,P.y-p.y,Math.min(pd,st));
      if(this.canMeet(p,pd)){patrolMeet(p);return true}}
    else if(threat&&!home&&Math.hypot(threat.x-p.x,threat.y-p.y)<16)startFight([p],[threat]);
    else{
      const b=!home&&bandits.find(o=>!o.qid&&!o.fight&&Math.hypot(o.x-p.x,o.y-p.y)<PATROL.see&&patrolLand(p,o.x,o.y));
      if(b){const bd=Math.hypot(b.x-p.x,b.y-p.y);Router.travel(p,b,sp*1.2)||walk(p,b.x-p.x,b.y-p.y,Math.min(bd,sp*1.2));
        if(bd<10)startFight([p],[b])}
      else if(home){Router.travel(p,gateGoal(t),sp);if(Math.hypot(t.x-p.x,t.y+12-p.y)<8){t.gar+=p.troops.length;p.gone=true}}
      else{const at=p.wx!=null&&Math.hypot(p.wx-p.x,p.wy-p.y)<6;// on its beat: stop a moment at each building, then on to the next
        if(at&&(p.wait||0)>0)p.wait-=d;else{if(p.wx==null||at||Math.random()<d*.02)patrolWaypoint(p,t);if(!Router.travel(p,{x:p.wx,y:p.wy},sp))p.wx=null}}}// (no way there over land: another stop next time)
    this.face(p,ox);return false;
  }
}

// a caravan (CaravanParty, caravans.js): on the road to its market, away from you if you are its enemy; bandits and enemy lords
// near it fall on it
class CaravanBrain extends Brain{
  think(c,d){
    if(c.idle||inFight(c))return false;
    this.cool(c,d);const to=townBy(c.to);if(!to||!c.mine&&atWar(to.owner,c.fac)){c.gone=true;return false}
    const v=this.look(c),pd=v.d,scared=!c.mine&&hostileTo(c.fac)&&pd<this.sight(WORLD_SCALE.sight.caravan);
    if(scared){walk(c,-v.dx,-v.dy,moveStep(CARAVAN_SPD*.9,d));c.dir=v.dx>0?-1:1}
    else{const ox=c.x;Router.travel(c,gateGoal(to),moveStep(CARAVAN_SPD*Math.max(.5,speedAt(c.x,c.y)||1),d));c.dir=c.x>=ox?1:-1}
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
  const night=G.clock/DAY>=NIGHT_AT;if(!night)camps().forEach(campEmpty);const met=lodEach(bandits,BRAINS.band,d,night);
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
function updatePatrols(d){
  // the change of the watch: the one on duty sets out (checked twice a second)
  if((watchCheck-=d)<=0){watchCheck=.5;for(const t of TOWNS)sendWatch(t)}
  if(lodEach(W.patrols,BRAINS.patrol,d))return true;
  W.patrols=W.patrols.filter(p=>!p.gone);return false;
}
function updateCaravans(d){
  if(lodEach(W.caravans,null,d))return true;
  for(const b of bandits)if(b.cvT&&Math.random()<.01)b.cvT=0;
  W.caravans=W.caravans.filter(c=>!c.gone);return false;
}
// every party's moment: true if one of them opened an encounter
function updateParties(d){updateCParties(d);return updateBands(d)||updateLords(d)||updateCaravans(d)||updatePatrols(d)}
