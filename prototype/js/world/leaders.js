'use strict';
/* ---------- leaders: whoever leads a band on the map grows by the same rules. A level from experience (level x 60 to the
   next) and disciplines that rise by use (0 to 10, (level + 1) x 20 to the next). The hero, the lords, your companions and the
   bandit chieftains are all leaders: one class for each kind, over the plain data its owner keeps (and saves as it is):
   leaderOf(o) gives the class that reads it. What differs is how each learns and what a new level brings. ---------- */
const LV_XP=lv=>lv*60,SK_XP=lv=>(lv+1)*20,SK_MAX=10;
class Leader{
  constructor(o){this.o=o}
  get lv(){return this.o.lv} set lv(v){this.o.lv=v}
  get xp(){return this.o.xp} set xp(v){this.o.xp=v}
  get sk(){return this.o.sk}
  get name(){return this.o.name}
  skill(k){const s=this.sk[k];return s?s.lv:0}
  // experience: returns the levels it gained
  gainXp(n){if(!(n>0))return 0;this.xp+=n;let up=0;while(this.xp>=LV_XP(this.lv)){this.xp-=LV_XP(this.lv);this.lv++;up++}if(up)this.levelled(up);return up}
  // a discipline used: it rises by its use, as fast as this leader learns it
  train(k,n){const s=this.sk[k];if(!s||s.lv>=SK_MAX||!(n>0))return;s.xp+=n*this.learn(k);
    while(s.lv<SK_MAX&&s.xp>=SK_XP(s.lv)){s.xp-=SK_XP(s.lv);s.lv++;this.rose(k,s.lv)}if(s.lv>=SK_MAX)s.xp=0}
  learn(k){return 1}
  levelled(up){}
  rose(k,lv){}
}
// you: your attributes and your knacks speed your learning; each level brings a skill point
class HeroLeader extends Leader{
  get lv(){return P.level} set lv(v){P.level=v}
  get name(){return 'you'}
  learn(k){return (1+P.attr[SKILLS[k].a]*.1)*(1+(P.apt&&P.apt[k]||0))}
  levelled(up){P.tp=(P.tp||0)+up;log('You reach level '+P.level+'. '+(up>1?up+' skill points':'A skill point')+' to spend in Skills (K).','gold')}
  rose(k,lv){log(SKILLS[k].n+' rises to '+lv+'.','gold')}
}
// a lord: news of it reaches you when he is near or serves your realm
class LordLeader extends Leader{
  constructor(l){super(lordStats(l))}
  levelled(){const l=this.o;if(Math.hypot(l.x-P.x,l.y-P.y)<vis()*1.5||l.fac===P.fac)log(l.name+' of the '+FACS[l.fac].n+' grows in skill: level '+l.lv+'.')}
}
// a companion: a perk to choose every third level
class CompanionLeader extends Leader{
  constructor(c,id){super(c);this.id=id}
  get name(){return COMPS[this.id].short}
  levelled(up){const c=this.o;for(let lv=c.lv-up+1;lv<=c.lv;lv++){if(lv%3===0)c.perkPend++;log(this.name+' reaches level '+lv+(lv%3===0?': a perk to choose (Hero, Party tab)':'')+'.','gold')}}
  rose(k,lv){log(this.name+'’s '+COMP_SK[k]+' rises to '+lv+'.','gold')}
}
// a bandit chieftain: grows only by winning battles (chiefWins); word of it spreads when it is near
class ChiefLeader extends Leader{
  levelled(){const c=this.o,o=chiefHolder(c);if(o&&Math.hypot(o.x-P.x,o.y-P.y)<vis()*2)log('Word spreads of '+c.name+': the bandit chief grows bolder (level '+c.lv+', bounty '+bountyOf(c)+' gold).')}
}
// the leader over a record: the hero (P), a lord, a companion (P.comps[id]) or a chieftain (its record); kept aside, never saved
const LEADERS=new WeakMap();
function leaderOf(o,id){
  if(!o)return null;let L=LEADERS.get(o);if(L)return L;
  // (a lord: a realm and an army; a companion's record has neither)
  L=o===P?new HeroLeader(o):o.k==='chief'?new ChiefLeader(o):o.fac&&Array.isArray(o.troops)?new LordLeader(o):new CompanionLeader(o,id||Object.keys(P.comps).find(k=>P.comps[k]===o));
  LEADERS.set(o,L);return L;
}

/* bandit chieftains: every band on the road and every camp and hideout has one (o.ld), with a name, a level and a bounty on its
   head that grows with it. Its level makes its fighters harder (they fight at encounter level chiefLv), and the bounty is yours
   when you break its band. In the taverns they talk of the most wanted. */
const CHIEF_NAMES={
  bandits:[['Grak','Morwen','Ulf','Brannoc','Sable','Hask','Vey','Tarn','Rook','Edda','Corvin','Maudlin'],['the Red','One-Eye','Knifehand','the Crow','Blackthorn','the Wolf','Ironjaw','the Grey','Quickfingers','Halfhand']],
  raiders:[['Zug','Krath','Ograk','Shaz','Durg','Mogra','Varz','Ishka'],['Sandfang','the Scorched','Skullsplitter','Dune-Runner','Sun-Eater','Bonegrin']],
  bog:[['Slurk','Mire-Ma','Gubb','Nettle','Hagga','Wort'],['Bogtooth','the Drowned','Reedcutter','Leechmother','Mudjaw']]
};
const CHIEF_SK=['lead','tact'];
// every chieftain on the map: those leading bands, and those holding camps and hideouts
const allChiefs=()=>[...bandits,...W.sites,...(W.exiles||[]),...(P.captives||[])].map(o=>o.ld).filter(Boolean);// (with those rebuilding and those you hold)
const chiefHolder=c=>bandits.find(b=>b.ld===c)||W.sites.find(s=>s.ld===c)||null;
// (also: places still being made, not yet on the map, whose names are taken too)
function newChief(band,lv,also){
  const N=CHIEF_NAMES[band]||CHIEF_NAMES.bandits,taken=new Set([...allChiefs(),...(also||[]).map(o=>o.ld).filter(Boolean)].map(c=>c.name));let name='';
  for(let k=0;k<30&&(!name||taken.has(name));k++)name=N[0][rint(0,N[0].length-1)]+' '+N[1][rint(0,N[1].length-1)];
  lv=Math.max(1,lv|0);return{k:'chief',name,band,lv,xp:0,wins:0,sk:Object.fromEntries(CHIEF_SK.map(k=>[k,{lv:Math.min(SK_MAX,Math.floor(lv/2)),xp:0}]))};
}
const bountyOf=c=>c?10+15*c.lv:0;
const chiefLabel=c=>c.name+' (level '+c.lv+')';
// how hard its fighters are: the encounter level its chieftain gives them
const chiefLv=o=>o&&o.ld?1+Math.floor(o.ld.lv/3):1;
// a chieftain whose band won a battle (it grows by nothing else): experience by how many it beat
function chiefWins(o,foes){const c=o&&o.ld;if(!c)return;c.wins=(c.wins||0)+1;const L=leaderOf(c);L.gainXp(20+4*foes);L.train('lead',2+foes*.5);L.train('tact',2);o.pw=0}
// the most wanted, for the taverns' talk: the highest chieftains, with where they are
function mostWanted(n){return allChiefs().sort((a,b)=>b.lv-a.lv||(b.wins||0)-(a.wins||0)).slice(0,n).map(c=>{const o=chiefHolder(c);return{c,o,near:o?nearestOf(o,TOWNS):null}})}
