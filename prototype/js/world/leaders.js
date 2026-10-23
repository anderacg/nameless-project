'use strict';
/* ---------- leaders: whoever leads a band on the map (your hero, the lords, your companions, the bandit chieftains) is a
   Character and grows by the same rules (characters.js). Here: the roles of the lords and the chieftains, and the chieftains
   themselves. ---------- */

/* a lord: he fights as his realm's best kind (captives.js lordUnit), with his own attributes, skills and gear (his numbers: the
   one formula, characters.js), and spends his own skill points. His record is his party (parties.js LordParty); his realm's
   loose helpers (lordStats, lordSkill, lcapOf) are in realms.js */
class Lord extends Character{
  get role(){return 'lord'}
  get roleName(){return 'Lord'}
  get key(){return lordUnit(this.o)}
  get race(){return ST[lordUnit(this.o)].race}
  get aiOwned(){return true}
  // word of him when you see him or fought him (worldlog.js): never news, nor worth a rider, even your realm's
  grew(up){
    const l=this.o;
    worldEvent({text:l.name+' of the '+FACS[l.fac].n+' grows in skill: level '+l.lv+'.',x:l.x,y:l.y,fac:[l.fac],post:false,kind:'',was:Math.hypot(l.x-P.x,l.y-P.y)<vis()*1.5||l.fac===P.fac})}
  // a battle won: experience and renown, and his Leadership and Tactics rise
  won(foes){
    const l=this.o;
    this.gainXp(12+2*foes);
    l.renown=(l.renown||0)+Math.ceil(foes/3);
    this.train('lead',3+foes*.5);
    this.train('tact',2)}
}

/* a bandit chieftain: a chief (with his own attributes, skills and gear), with a bounty on his head; he grows only by winning
   battles (won) */
class Chieftain extends Character{
  get role(){return 'chieftain'}
  get roleName(){return 'Chieftain'}
  get key(){return 'chief'}
  get race(){return null}
  get aiOwned(){return true}
  outfitWeapons(){return ['axe']}
  bounty(){return bountyOf(this.o)}
  // the band, camp or hideout he leads (none while he is held or rebuilding)
  holder(){return chiefHolder(this.o)}
  // word of him when his band is near
  grew(up){
    const o=this.holder();
    if(o&&Math.hypot(o.x-P.x,o.y-P.y)<vis()*2)log('Word spreads of '+this.o.name+': the bandit chief grows bolder (level '+this.o.lv+', bounty '+this.bounty()+' gold).')}
  // a battle his band won: experience by how many it beat
  won(foes){
    const c=this.o;
    c.wins=(c.wins||0)+1;
    this.gainXp(20+4*foes);
    this.train('lead',2+foes*.5);
    this.train('tact',2)}
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
const allChiefs=()=>[...bandits,...W.sites,...W.sites.map(s=>s.occ&&s.occ.s).filter(Boolean),...W.exiles,...(P.captives||[])].map(o=>o.ld).filter(Boolean);// (with those rebuilding, those in ruins (sites.js Ruins) and those you hold)
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
function chiefWins(o,foes){const c=o&&o.ld;if(!c)return;leaderOf(c).won(foes);o.pw=0}
// the most wanted, for the taverns' talk: the highest chieftains, with where they are
function mostWanted(n){return allChiefs().sort((a,b)=>b.lv-a.lv||(b.wins||0)-(a.wins||0)).slice(0,n).map(c=>{const o=chiefHolder(c);return{c,o,near:o?Spatial.nearestHolding(o.x,o.y):null}})}
