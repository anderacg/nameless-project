'use strict';
/* ---------- the land defended: the wilds are dangerous, the lands are defended (the owner, 2026-10-19; numbers: data/factions.js
   DEFEND). Beasts make their lairs in the wilds and bands take to the roads away from where people live (monsters.js lairLand,
   world.js spawnBandit); a beast falls on a band it meets, and the band fights back (monsters.js beastMeets: a fight on the map,
   fights.js). A threat on a holding's land that its watch, or the holding or one of its estates, has in sight brings the watch
   out after it, when the watch can beat it (PatrolBrain runs it down: p.hunt, its uid). A lord at or near home rides at one that
   comes near a holding or estate of his realm on its land, when he can beat it, and goes back to what he was doing after
   (LordBrain: l.defend, its uid; l.defX, l.defY where he set out; l.defT when he may look again). Estate guards stay as they
   are (estates.js GUARDS). Wild game (critters.js) is no threat.
   LandDefence (doc/STORY_DESIGN.md §7, wave D) is the service: its state (check: the time to its next look over the land) and
   its system, 'land defence' (core/systems.js: each moment on the map, after the change of the watch, before the patrols'
   own moments). The old names (isThreat, threats, canBeat, homeDist, watchOut, watchPower, huntable, patrolPrey, watchAt,
   lordAtHome, lordRides, lordDefended, lordDefends, landDefence) are aliases. ---------- */
// at or near home: in his realm's business at home (resting, going home, riding his lands)
const HOME_STATES=['rest','home','patrol'];
const LandDefence={
  // the map's time to the next look over the land (from 0 again in a new game or a load, as the watches' timer: never the last
  // game's)
  check:0,
  // the threats as they stand this moment, filed by place (look; null: none filed, prey scans them all)
  grid:null,
  // a threat: a band or a beast, out of any fight, not one a quest set out, nor a mythic beast (it ravages armies its own way)
  isThreat(o){
    return !!o&&!o.qid&&!o.fight&&!o.gone&&(o.mapKind!=='monster'||fightsOnMap(o));
  },
  // every threat on the map: the bands, then the beasts
  threats(){
    return [...bandits,...W.monsters.map(asMonster)].filter(o=>this.isThreat(o));
  },
  // can a defender of strength pw beat it (its own power: monsters.js, parties.js)
  canBeat(pw,o){
    return pw>=o.power()*DEFEND.edge;
  },
  // how near (x, y) is to where a holding's people live: its centre or one of its estates (territory.js homesOf)
  homeDist(t,x,y){
    return Math.min(...homesOf(t).map(o=>Math.hypot(o.x-x,o.y-y)));
  },

  /* the watch (world/patrols.js Watches) */
  // a threat its watch may run down: still there to fight, on its land (patrols.js patrolLand), and one it can beat
  huntable(p,o){
    return this.isThreat(o)&&o.here()&&patrolLand(p,o.x,o.y)&&this.canBeat(p.power(),o);
  },
  // what a watch runs down (PatrolBrain): the threat its holding set it on, else one on its land in its own sight (the first in
  // the threats' order: from the grid look filed them in this moment, which answers as the scan of them all does; one that
  // has since gone into a fight or away fails huntable, wherever it stands)
  prey(p){
    const h=p.hunt&&partyBy(p.hunt);if(h&&this.huntable(p,h))return h;p.hunt=null;
    return (this.grid?this.grid.within(p.x,p.y,PATROL.see):this.threats()).find(o=>Math.hypot(o.x-p.x,o.y-p.y)<PATROL.see&&this.huntable(p,o))||null;
  },
  // a threat on a holding's land (hd: how near its homes): seen by its watch or from its homes, and one the watch can beat, it
  // sends the watch on duty out (if it can go) and sets it on the threat, unless it already hunts another
  watchAt(t,o,hd){
    const w=t.watch,p=w.out();if(!(hd<DEFEND.see||p&&Math.hypot(p.x-o.x,p.y-o.y)<PATROL.see)||!this.canBeat(w.power(),o))return;
    if(!p)w.send();const q=p||w.out();if(!q||q.fight)return;
    const cur=q.hunt&&partyBy(q.hunt);if(!(cur&&this.huntable(q,cur)))q.hunt=uidOf(o);
  },

  /* the lords */
  // at or near home: in his realm's business at home, not fighting nor shut in a siege, not resting from a sortie, within
  // DEFEND.home of one of his realm's holdings
  lordAtHome(l){
    return !l.dead&&!l.fight&&!l.defend&&HOME_STATES.includes(l.state)&&!((l.defT||0)>worldTime())&&!(l.inside&&besieged(townBy(l.inside)))&&fiefsOf(l.fac).some(t=>Math.hypot(t.x-l.x,t.y-l.y)<DEFEND.home);
  },
  lordRides(l,o,t){
    if(l.inside)l.leave();l.defend=uidOf(o);l.defX=l.x;l.defY=l.y;
    if(l.fac===P.fac||t.owner==='player'||Math.hypot(l.x-P.x,l.y-P.y)<vis()*1.5)log(l.name+' rides out against the '+o.label().toLowerCase()+' near '+t.name+'.');
  },
  // done (the threat beaten, gone or out of reach): back to what he was doing, and no new sortie for DEFEND.cool
  lordDefended(l){
    l.defend=null;l.defT=worldTime()+DEFEND.cool;
  },
  // a lord's moment while he rides out (LordBrain): after the threat while it is there to fight on his realm's land, within his
  // leash and while home's business is still his; true while he does (his brain does nothing else)
  lordDefends(l,d){
    if(inFight(l))return false;
    const o=partyBy(l.defend),t=o&&landHold(o.x,o.y);
    if(!this.isThreat(o)||!t||t.owner!==l.fac||Math.hypot(o.x-l.defX,o.y-l.defY)>DEFEND.leash||!HOME_STATES.includes(l.state)){this.lordDefended(l);return false}
    if(l.inside)l.leave();
    const sp=moveStep(lordSpeed(l),d);Router.travel(l,o,sp)||walk(l,o.x-l.x,o.y-l.y,Math.min(Math.hypot(o.x-l.x,o.y-l.y),sp));
    if(Math.hypot(o.x-l.x,o.y-l.y)<12)startFight([l],[o]);
    return true;
  },

  /* every DEFEND.look of the map's time: each threat on a holding's land, its watch; and, near one of its homes, the first lord
     of its realm at home within reach who can beat it */
  // (each moment, first: the threats filed in a grid for the watches' moments after it, brains.js movePatrols: Spatial.index)
  look(d){
    this.grid=Spatial.index(this.threats(),64);
    if((this.check-=d)>0)return;this.check=DEFEND.look;
    const lords=W.lords.filter(l=>this.lordAtHome(l));
    for(const o of this.threats()){const t=landHold(o.x,o.y);if(!t||!t.owner||ruined(t)||besieged(t))continue;const hd=this.homeDist(t,o.x,o.y);
      this.watchAt(t,o,hd);worldEmit('land:threat',{town:t,foe:o});// (talk of it: the bus, news.js)
      if(hd<DEFEND.near){const l=lords.find(l=>!l.defend&&l.fac===t.owner&&Math.hypot(l.x-o.x,l.y-o.y)<DEFEND.ride&&this.canBeat(l.power(),o));if(l)this.lordRides(l,o,t)}}
  }
};
onWorld(()=>{LandDefence.check=0;LandDefence.grid=null});
// the old names
const isThreat=o=>LandDefence.isThreat(o);
const threats=()=>LandDefence.threats();
const canBeat=(pw,o)=>LandDefence.canBeat(pw,o);
const homeDist=(t,x,y)=>LandDefence.homeDist(t,x,y);
const watchOut=t=>Watches.of(t).out();
const watchPower=t=>Watches.of(t).power();
const huntable=(p,o)=>LandDefence.huntable(p,o);
const patrolPrey=p=>LandDefence.prey(p);
const watchAt=(t,o,hd)=>LandDefence.watchAt(t,o,hd);
const lordAtHome=l=>LandDefence.lordAtHome(l);
const lordRides=(l,o,t)=>LandDefence.lordRides(l,o,t);
const lordDefended=l=>LandDefence.lordDefended(l);
const lordDefends=(l,d)=>LandDefence.lordDefends(l,d);
const landDefence=d=>LandDefence.look(d);
// its work in the world's frame (core/systems.js): after the change of the watch (patrols.js), before the patrols' moments
// (brains.js)
Systems.add({name:'land defence',order:{frame:102},frame:d=>LandDefence.look(d)});
