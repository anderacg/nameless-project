'use strict';
/* ---------- the land defended: the wilds are dangerous, the lands are defended (the owner, 2026-10-19; numbers: data/factions.js
   DEFEND). Beasts make their lairs in the wilds and bands take to the roads away from where people live (monsters.js lairLand,
   world.js spawnBandit); a beast falls on a band it meets, and the band fights back (monsters.js beastMeets: a fight on the map,
   fights.js). A threat on a holding's land that its watch, or the holding or one of its estates, has in sight brings the watch
   out after it, when the watch can beat it (PatrolBrain runs it down: p.hunt, its uid). A lord at or near home rides at one that
   comes near a holding or estate of his realm on its land, when he can beat it, and goes back to what he was doing after
   (LordBrain: l.defend, its uid; l.defX, l.defY where he set out; l.defT when he may look again). Estate guards stay as they
   are (estates.js GUARDS). Wild game (critters.js) is no threat. ---------- */
// a threat: a band or a beast, out of any fight, not one a quest set out, nor a mythic beast (it ravages armies its own way)
const isThreat=o=>!!o&&!o.qid&&!o.fight&&!o.gone&&(o.mapKind!=='monster'||fightsOnMap(o));
// every threat on the map: the bands, then the beasts
const threats=()=>[...bandits,...W.monsters.map(asMonster)].filter(isThreat);
// can a defender of strength pw beat it (its own power: monsters.js, parties.js)
const canBeat=(pw,o)=>pw>=o.power()*DEFEND.edge;
// how near (x, y) is to where a holding's people live: its centre or one of its estates (territory.js homesOf)
const homeDist=(t,x,y)=>Math.min(...homesOf(t).map(o=>Math.hypot(o.x-x,o.y-y)));

/* the watch */
// the watch on duty out on the land; its strength, out or as it would go out now
const watchOut=t=>W.patrols.find(p=>p.home===t.name&&!p.gone&&watchOf(p)===watchNow());
const watchPower=t=>{const p=watchOut(t);if(p)return p.power();const X=watchesOf(t)[watchNow()];return rating(X.kinds.slice(0,X.n))};
// a threat its watch may run down: still there to fight, on its land (patrols.js patrolLand), and one it can beat
const huntable=(p,o)=>isThreat(o)&&o.here()&&patrolLand(p,o.x,o.y)&&canBeat(p.power(),o);
// what a watch runs down (PatrolBrain): the threat its holding set it on, else one on its land in its own sight
function patrolPrey(p){
  const h=p.hunt&&partyBy(p.hunt);if(h&&huntable(p,h))return h;p.hunt=null;
  return threats().find(o=>Math.hypot(o.x-p.x,o.y-p.y)<PATROL.see&&huntable(p,o))||null;
}
// a threat on a holding's land (hd: how near its homes): seen by its watch or from its homes, and one the watch can beat, it
// sends the watch on duty out (sendWatch: if it can go) and sets it on the threat, unless it already hunts another
function watchAt(t,o,hd){
  const p=watchOut(t);if(!(hd<DEFEND.see||p&&Math.hypot(p.x-o.x,p.y-o.y)<PATROL.see)||!canBeat(watchPower(t),o))return;
  if(!p)sendWatch(t);const q=p||watchOut(t);if(!q||q.fight)return;
  const cur=q.hunt&&partyBy(q.hunt);if(!(cur&&huntable(q,cur)))q.hunt=uidOf(o);
}

/* the lords */
// at or near home: in his realm's business at home (resting, going home, riding his lands), not fighting nor shut in a siege,
// not resting from a sortie, within DEFEND.home of one of his realm's holdings
const HOME_STATES=['rest','home','patrol'];
const lordAtHome=l=>!l.dead&&!l.fight&&!l.defend&&HOME_STATES.includes(l.state)&&!((l.defT||0)>worldTime())&&!(l.inside&&besieged(townBy(l.inside)))&&fiefsOf(l.fac).some(t=>Math.hypot(t.x-l.x,t.y-l.y)<DEFEND.home);
function lordRides(l,o,t){
  if(l.inside)l.leave();l.defend=uidOf(o);l.defX=l.x;l.defY=l.y;
  if(l.fac===P.fac||t.owner==='player'||Math.hypot(l.x-P.x,l.y-P.y)<vis()*1.5)log(l.name+' rides out against the '+o.label().toLowerCase()+' near '+t.name+'.');
}
// done (the threat beaten, gone or out of reach): back to what he was doing, and no new sortie for DEFEND.cool
function lordDefended(l){l.defend=null;l.defT=worldTime()+DEFEND.cool}
// a lord's moment while he rides out (LordBrain): after the threat while it is there to fight on his realm's land, within his
// leash and while home's business is still his; true while he does (his brain does nothing else)
function lordDefends(l,d){
  if(inFight(l))return false;
  const o=partyBy(l.defend),t=o&&landHold(o.x,o.y);
  if(!isThreat(o)||!t||t.owner!==l.fac||Math.hypot(o.x-l.defX,o.y-l.defY)>DEFEND.leash||!HOME_STATES.includes(l.state)){lordDefended(l);return false}
  if(l.inside)l.leave();
  const sp=moveStep(lordSpeed(l),d);Router.travel(l,o,sp)||walk(l,o.x-l.x,o.y-l.y,Math.min(Math.hypot(o.x-l.x,o.y-l.y),sp));
  if(Math.hypot(o.x-l.x,o.y-l.y)<12)startFight([l],[o]);
  return true;
}

/* every DEFEND.look of the map's time (brains.js updatePatrols): each threat on a holding's land, its watch; and, near one of
   its homes, the first lord of its realm at home within reach who can beat it */
// (from 0 again in a new game or a load, as patrols.js watchCheck: never the last game's timer)
let defendCheck=0;onWorld(()=>{defendCheck=0});
function landDefence(d){
  if((defendCheck-=d)>0)return;defendCheck=DEFEND.look;
  const lords=W.lords.filter(lordAtHome);
  for(const o of threats()){const t=landHold(o.x,o.y);if(!t||!t.owner||ruined(t)||besieged(t))continue;const hd=homeDist(t,o.x,o.y);
    watchAt(t,o,hd);worldEmit('land:threat',{town:t,foe:o});// (talk of it: the bus, news.js)
    if(hd<DEFEND.near){const l=lords.find(l=>!l.defend&&l.fac===t.owner&&Math.hypot(l.x-o.x,l.y-o.y)<DEFEND.ride&&canBeat(l.power(),o));if(l)lordRides(l,o,t)}}
}
