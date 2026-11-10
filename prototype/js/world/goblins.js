'use strict';
/* ---------- goblins: their warbands on the map, who sends them, and their raids (numbers: data/goblins.js GOBLINS) ----------
   Their camps are sites (world/sites.js GoblinCamp). A warband is a band in bandits like any other (kind 'goblins'), so it hunts,
   keeps away, flees, is cornered and yields, plunders caravans and robs refugees as bandits do (brains.js BandBrain, parley.js);
   it is of its camp (camp: the site's i), haunts the land round it (haunt: it heads back past GOBLINS.leash tiles), shelters in it
   by night (GoblinCamp shelters), and is short of nerve (GOBLINS.nerve). Every draw here is from the stream 'goblins' (core/rng.js),
   so the world's Math.random is as it was; GOBLINS.on off, nothing here happens */
// (who speaks for you in the goblins' tongue (GOBLIN_TONGUE): 'you', a companion's name, one of your goblins; null, no one. alone:
// held captive, only you)
function goblinSpeaker(alone){const T=GOBLIN_TONGUE;if(T.races.includes(P.race))return 'you';if(alone)return null;
  for(const id in P.comps||{}){const c=P.comps[id],C=COMPS[id];if(C&&!c.party&&T.races.includes(C.race))return C.short||C.n}
  for(const k in P.troops||{})if(P.troops[k]>0&&ST[k]?.race==='goblin')return 'your '+ST[k].n.toLowerCase();return null}
// (why there are no terms to be had with goblins: '' when someone speaks their tongue; never for anyone else)
const goblinTongueWhy=(goblins,alone)=>goblins&&!goblinSpeaker(alone)?cap1(GOBLIN_TONGUE.why):'';
// (who speaks, said on the page: a line, or '')
const goblinTongueSay=(goblins,alone)=>{const s=goblins&&goblinSpeaker(alone);return !s?'':s==='you'?'You know their tongue. ':cap1(s)+' speaks for you in their tongue. '};
class GoblinBand extends BandParty{
  get nerve(){return GOBLINS.nerve}
  get hauntR(){return GOBLINS.leash}
  // (what the scouts count on the pre-battle page: parley.js meetBand)
  get word(){return 'goblins'}
  mapDot(V){const d=super.mapDot(V);return d&&[GOBLINS.col,1]}
  banner(){return this.flagB!==undefined?this.flagB:{k:'rag',col:GOBLINS.col,dev:'skull'}}
  // (their host in their colour, of their race: gfx/people.js RACE_LOOK goblin; their label by how they judge you)
  look(){return{...super.look(),col:this.colB||GOBLINS.col,race:'goblin',labelCol:STANCE_COL[stance(this.power()*this.nerve)]}}
}
// a crowd of n goblins by GOBLINS.mix; a camp's, or a warband of GOBLINS.bossAt or more, has its boss
function goblinList(n,camp){
  const a=[];for(let i=0;i<n;i++){let r=Math.random();a.push((GOBLINS.mix.find(([,w])=>(r-=w)<0)||GOBLINS.mix[0])[0])}
  if(camp||n>=GOBLINS.bossAt)a.push(GOBLINS.boss);return a;
}
const goblinCamps=()=>W.sites.filter(s=>s instanceof GoblinCamp&&!s.cleared);
// a camp's warbands: out on the map, and sheltering in it tonight
const warbandsOf=s=>bandits.filter(b=>b.camp===s.i).length+(s.bands||[]).length;
// a warband out of camp s: on open ground a few tiles from it, out of your sight, its own chieftain; null if none was found
function spawnGoblins(s){
  for(let k=0;k<30;k++){
    const a=Math.random()*6.283,r=rint(2,6)*TILE,x=s.x+Math.cos(a)*r,y=s.y+Math.sin(a)*r;
    if(!passable(terrAt(x,y))||Math.hypot(x-P.x,y-P.y)<vis())continue;
    const n=rint(GOBLINS.band[0],GOBLINS.band[1])+Math.floor(G.day/GOBLINS.grow);
    const b=asParty({x,y,n,kind:'goblins',list:goblinList(n,false),t:0,a:0,idle:false,cool:0,ld:newChief('goblins',1+Math.floor(G.day/25)),haunt:{x:s.x,y:s.y},camp:s.i});
    bandits.push(b);return b;
  }
  return null;
}
// a new game (core/session.js begin): every camp sends out its warbands
function goblinsStart(){if(GOBLINS.on)Rng.use('goblins',()=>{for(const s of goblinCamps())for(let i=0;i<GOBLINS.bands;i++)spawnGoblins(s)})}
// a raid: a warband within GOBLINS.raid.r tiles of a hamlet or a village not besieged nor frightened already, by chance: its
// workers run home (conduct.js frighten) and the goblins carry off some of its food; the talk of it (news 'raid'). Its holding, or null
function goblinRaid(b){
  const R=GOBLINS.raid,t=TOWNS.find(h=>h.T.tier<=2&&!besieged(h)&&Math.hypot(h.x-b.x,h.y-b.y)<R.r*TILE);
  if(!t||Timed.of(t).has('fear')||Math.random()>=R.chance)return null;
  frighten(t,R.fear);ensureEcon(t);takeFood(t.stock,rint(R.steal[0],R.steal[1]));newsRecord('raid',t,{town:t.name});
  if(t.owner==='player'||Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5)log('Goblins raid the fields of '+t.name+'. Its workers flee home.','bad','war');
  return t;
}
// the day: a camp short of warbands may send one out; warbands by a hamlet or a village may raid it
function goblinDay(){
  if(!GOBLINS.on)return;
  Rng.use('goblins',()=>{for(const s of goblinCamps())if(warbandsOf(s)<GOBLINS.bands&&Math.random()<GOBLINS.spawn)spawnGoblins(s);
    for(const b of bandits)if(b.kind==='goblins'&&!b.fight)goblinRaid(b)});
}
Systems.add({name:'goblins',order:{day:71},day:goblinDay});
