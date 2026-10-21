'use strict';
/* ---------- parties: every band of soldiers on the map keeps them the same way, as counts by kind ({hum_spear: 6, ...}, as
   your own band does), in o.tc. A party's troops are a view: a list built from the counts, read-only, for everything that
   reads soldiers one by one (power, battles, drawing). Change them through the party: add, remove, removeAny, cull, or by
   setting troops to a new list. The kinds: lords, your companions' parties, bandit bands,
   holdings' patrols, caravans (caravans.js) and your own band. Each says for itself what it is (mapKind), how strong it is
   (power), what it is called (label) and whose it is (faction: a realm, 'player' for yours, null for bandits). A party made as
   plain data (a new one, or one from a save) is made one of its kind by asParty(o) where it is made or loaded. ---------- */
const LISTS=new WeakMap();// each party's list view, rebuilt when its soldiers change (kept aside: never saved)
const ROSTERS=new WeakMap();
function partyRoster(o){let r=ROSTERS.get(o);if(!r){r=new ArmyRoster(o,'tc',{valid:k=>Object.prototype.hasOwnProperty.call(ST,k),changed:()=>o.changed(),characters:()=>o===P?['hero',...Object.keys(P.comps).filter(id=>!P.comps[id].party).map(id=>'comp_'+id)]:[],reserved:()=>o===P?1+Object.keys(P.comps).filter(id=>!P.comps[id].party).length:o.cid||o.ld||W.lords.includes(o)||o.kind==='cparty'?1:0});ROSTERS.set(o,r)}return r}
class Party extends WorldObject{
  get troops(){let a=LISTS.get(this);if(!a){a=Object.freeze(expandCounts(this.tc));LISTS.set(this,a)}return a}
  set troops(list){this.tc=countsOf(list);this.changed()}
  get size(){return partyRoster(this).size}
  has(k){return partyRoster(this).count(k)>0}
  add(k,n=1){partyRoster(this).add(k,n);return this}
  // take up to n of a kind; returns how many
  remove(k,n=1){return partyRoster(this).remove(k,n)}
  // take n at random, one by one; returns the kinds taken
  removeAny(n=1){return partyRoster(this).removeAny(n)}
  // each soldier lost with this chance
  cull(frac){partyRoster(this).cull(frac);return this}
  changed(){LISTS.delete(this)}
  // on the map (to be drawn and clicked): not beaten, not inside a holding
  onMap(){return !this.dead&&!this.inside}
  // in sight (fog): within your sight, or nearer when it is in woods or hills
  inView(V){return this.onMap()&&spotted(this,V)}
  // a click: on its ring, on its leader's figure (a lord's whole horse: render.js partyFig, opaqueBox) and on its banner
  pick(at){if(!this.onMap())return;at.add(this,10,4);if(Math.hypot(this.x-at.x,this.y-at.y)<32){const F=partyFig(this,this.look(),0);at.fig(this,F.s,F.x,F.y,F.flip)}const B=at.flag&&bannerAt(this,0);if(B)at.flag(this,B)}
  // the banner it flies over it, Total War-style (sprites.js bannerSprite: k its shape, col its field, dev its device), null for
  // none; and the map row of its leader's head, the banner's pole standing over it (render.js bannerAt)
  banner(){return null}
  headY(){return Math.round(this.y)+3-16+figTop(this.look())}
  // in sight: its host of soldiers, its leader's figure (a rider, a bandit), a torch on a night watch, its label (as it looks: look)
  draw(ents,cam,V){if(!this.inView(V))return;const o=this;
    // (its step by how far it has walked: on foot a step each WALK.foot px, a rider each WALK.ride; standing still, or resting,
    // the first; drawn at its own place to the screen's pixel: render.js subT)
    // (its banner over it all, with its label over the banner: render.js drawBanners)
    ents.push({y:o.y,own:o.faction==='player',f:()=>{subT(o);const L=o.look(),sx=Math.round(o.x-cam.x),sy=Math.round(o.y-10-cam.y),fd=L.dir<0?-1:1,rider=!!L.rider&&!L.bandit,go=L.moving&&mapStepping(o),fr=go?frameOf(o,rider?WALK.ride:WALK.foot,WALK.n):0;
      const s=partyFig(o,L,fr).s;// (a rider: his host behind his horse)
      drawHost(o.size,L.col,sx-(rider?fd*4:0),sy+12,fd,go?o.wd:null,L.seed,L.race,L.bandit);
      ctx.save();ctx.translate(sx,sy);if(fd<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),13-s.height);ctx.restore();
      if(L.torch){const tx=sx+fd*4,ty=sy+3;rect(ctx,'#5a3e24',tx,ty,1,4);LIGHTQ.push({x:tx,y:ty-1,r:16})}
      BANNERQ.push({o,label:!o.fight&&L.label?[L.label,L.labelCol]:null})}})}
  // sheltering in a holding: inside is the holding's name. shelterWhy(t): why it may not go in there ('' if it may; each kind
  // has its rules); enter and leave by the gate
  shelterWhy(t){return !t?'Nowhere':besieged(t)?'The gates are barred for the siege':''}
  enter(t){this.inside=t.name;this.x=t.x;this.y=t.y+4}
  leave(){const t=townBy(this.inside);this.inside=null;if(t){this.x=t.x+rint(-6,6);this.y=t.y+14}}
  // how it looks on the map (render.js drawParties): colour, rider, moving, label
  look(){return{col:'#888',dir:this.dir||1,moving:true,seed:0,label:String(this.size),labelCol:'#ccc'}}
  // its fighting strength (engage.js rating), and its realm; in a fight on the map, its fighters as they are (fights.js)
  power(){return rating(this.troops)}
  fightPower(){return power(this.troops)}
  takeLoss(blow){this.removeAny(1)}
  get faction(){return this.fac}
}
class LordParty extends Party{
  get mapKind(){return 'lord'}
  here(){return W.lords.includes(this)}
  meet(){lordMeet(this)}
  mapDot(V){return !this.dead&&!this.inside&&this.fromYou()<V?[FACS[this.fac].col,1]:null}
  label(){return this.name}
  tip(){return '<b>'+this.name+' <span class="muted">Lv '+lordStats(this).lv+'</span></b><small>'+tipFac(this.fac)+' · '+this.troops.length+' soldiers'+tipOdds(this.power())+paceVs(lordSpeed(this))+'</small><span class="act">Click: '+(hostileTo(this.fac)?'fight':'talk')+'</span>'}
  get brain(){return BRAINS.lord}
  shelterWhy(t){return t&&t.owner!==this.fac?'Not a holding of his realm':super.shelterWhy(t)}
  banner(){return{k:'banner',col:FACS[this.fac].col,dev:this.fac}}
  look(){const col=FACS[this.fac].col,still=this.state==='rest'||this.state==='siege';return{col,race:FACS[this.fac].races[0],rider:'horse',dir:faceDir(this),moving:!still,seed:this.id.length*31+this.name.length,label:String(this.size),labelCol:hostileTo(this.fac)?STANCE_COL[stance(this.power())]:col}}
}
class CompanionParty extends Party{
  get mapKind(){return 'cparty'}
  meet(){openComp(this.cid)}// (no minimap dot)
  label(){return COMPS[this.cid].short+'’s party'}
  get faction(){return 'player'}
  // (its leader's Leadership makes it stronger)
  power(){return power(this.troops)*(1+.04*compSkill(this.cid,'lead'))}
  tip(){return '<b>'+this.label()+'</b><small>Your companion · '+this.troops.length+' soldiers · '+({follow:'riding with you',patrol:'patrolling '+this.base,return:'coming back'})[this.order]+'</small><span class="act">Click: orders</span>'}
  get brain(){return BRAINS.cparty}
  shelterWhy(t){return !t?'Nowhere':yourShelterWhy(t)}
  enter(t){this.inside=t.name;this.x=t.x;this.y=t.y}
  inView(V){return this.onMap()&&Math.hypot(this.x-P.x,this.y-P.y)<V}// (yours: always in sight)
  banner(){return{k:'banner',col:FACS.player.col,dev:'star'}}// (yours, a companion's mark on it)
  look(){return{col:FACS.player.col,race:P.race,dir:this.dir||1,moving:true,seed:this.cid.length*7,label:COMPS[this.cid].short+' '+this.size,labelCol:'#9fc0ff'}}
}
class PatrolParty extends Party{
  get mapKind(){return 'patrol'}
  here(){return W.patrols.includes(this)}
  meet(){patrolMeet(this)}
  get meetsAnyTime(){return true}
  label(){return watchName(this)}
  tip(){return '<b>'+watchName(this)+'</b><small>'+tipFac(this.fac)+' · '+this.troops.length+' soldiers'+(hostileTo(this.fac)?tipOdds(this.power()):'')+'</small><span class="act">Click: meet</span>'}
  mapDot(V){return this.fromYou()<V?[this.fac==='player'?FACS.player.col:FACS[this.fac].col,1]:null}
  get brain(){return BRAINS.patrol}
  banner(){return watchOf(this)==='night'?{k:'pennant',col:WATCH.night.pennant,dev:'lantern'}:{k:'pennant',col:this.fac==='player'?FACS.player.col:FACS[this.fac].col,dev:this.fac}}// (the day watch: its holding's realm's pennant; the night watch: a dark one with a lantern)
  look(){const col=this.fac==='player'?FACS.player.col:FACS[this.fac].col,near=Math.hypot(this.x-P.x,this.y-P.y)<120;
    return{col,race:this.fac==='player'?P.race:FACS[this.fac].races[0],dir:this.dir||1,moving:true,seed:this.home.length*13,torch:watchOf(this)==='night',label:near?String(this.size):'',labelCol:hostileTo(this.fac)?STANCE_COL[stance(this.power())]:crimeAt(townBy(this.home))&&this.fac!=='player'?'#ff9a90':col}}
}
// a bandit band: n (how many it shows) follows its troops; its power is kept (pw) until they change or its chieftain grows
// (its own kind field is which bandits it is: bandits, raiders, bog; mapKind is what it is on the map)
class BandParty extends Party{
  get mapKind(){return 'band'}
  here(){return bandits.includes(this)}
  meet(){meetBand(this)}
  mapDot(V){return this.fromYou()<V?['#ff6a60',1]:null}
  label(){const b=BANDS[this.kind||'bandits'];return b?b[0].replace(' ahead',''):'Bandits'}
  get faction(){return null}
  // (its chieftain hardens it: leaders.js chiefLv)
  power(){return this.pw||(this.pw=rating(this.troops,chiefLv(this)))}
  tip(){return '<b>'+this.label()+'</b>'+chiefTip(this)+'<small>'+this.n+' fighters'+tipOdds(this.power())+paceVs(partySpeed(this,this.troops))+'</small><span class="act">Click: attack</span>'}
  get brain(){return BRAINS.band}
  banner(){return{k:'rag',col:BAND_FLAG[this.kind]||BAND_FLAG.bandits,dev:'skull'}}// (a tattered rag: red, a desert raider's ochre, a bog raider's green)
  look(){const c=this.ld;return{col:'#8a4a3a',bandit:true,dir:faceDir(this),moving:!this.idle,seed:Math.round(this.x)%97,label:(c?c.name.split(' ')[0]+' Lv'+c.lv+' · ':'')+this.n,labelCol:STANCE_COL[stance(this.power())]}}
  changed(){super.changed();if(this.tc)this.n=this.size;this.pw=0}
}
// your own band: its counts are P.troops, as they always were (read everywhere as counts), and it changes the way every party
// does (P.add, P.remove, P.size...). Its own troops shadow the list view; its list is built on asking. You are its brain.
class PlayerParty extends Party{
  get mapKind(){return 'you'}
  here(){return false}// (drawn on its own, never picked or met: render.js drawWorld)
  get tc(){return this.troops} set tc(v){this.troops=v}
  get list(){return expandCounts(this.troops)}
  changed(){super.changed();txpClamp()}
  get brain(){return null}
  get inside(){return this.stay?this.stay.town:null}
  onMap(){return !this.stay}
  shelterWhy(t){return !t?'Nowhere':yourShelterWhy(t,stayCost())}
  enter(t){return startStay(t)}
  leave(why,cls){if(this.stay)leaveStay(why,cls)}
  label(){return 'Your band'}
  get faction(){return 'player'}
  power(){return partyPower()}
  look(){return{col:'#3d74d6',rider:mountDef()?mountDef().col:'',dir:this.dir||1,moving:this.tx!=null,seed:5,label:'',labelCol:'#fff'}}
  banner(){return{k:'banner',col:FACS.player.col,dev:'crown'}}
  headY(){const m=mountDef();return Math.round(this.y)+3-16+opaqueBox(partySprite('#e8b94a',m?m.col:'',0))[1]}
  /* your numbers (their older names in state.js and combat.js are aliases of these). P is your band and your hero's record at
     once: here, the band's size and room, what it eats and how far it sees; then your hero's disciplines with everything that
     adds to them, what her gear, tree and perks give, her fighting numbers, and her health, stamina and mana */
  troopCount(){return sum(this.troops)}
  compCount(){return Object.keys(this.comps).length}
  woundedCount(){return sum(this.wounded||{})}
  // riders in your band (their horses want feed and their wages are higher)
  mountedCount(){return Object.keys(this.troops).reduce((a,k)=>a+(ST[k]&&ST[k].mounted?this.troops[k]:0),0)}
  // everyone you lead: soldiers, companions and the wounded
  headcount(){return this.troopCount()+this.compCount()+this.woundedCount()}
  prisonerCount(){return sum(this.prisoners)}
  // how many you may lead: your level, renown, Leadership and Charisma, and your talents
  cap(){
    const n=8+this.level*3+Math.floor(this.renown/25)+this.skill('lead')+Math.floor(this.attr.cha/2)+this.treeMod('cap');
    return Math.max(3,Math.round(n*(1+this.treeMod('capPct'))))}
  // room left: negative while over capacity (callers decide whether a transfer is allowed)
  room(){return this.cap()-this.headcount()}
  prisonCap(){return 2+this.skill('lead')+(this.hasPerk('warden')?6:0)+this.treeMod('prison')}
  // food a day: everyone, their horses and your prisoners, a quarter each; marching hard eats more, a quartermaster less
  eatPerDay(){
    const n=(this.headcount()+this.mountedCount()+this.prisonerCount()+1)/4;
    return Math.ceil(n*(this.hasPerk('forced')?1.2:1)*(this.hasPerk('quarter')?.75:1)*(roleOf('quarter')?.75:1)*(1-this.treeMod('food')))}
  // how far you see: your Scouting, the ground you stand on and your gear
  sight(){return (110+8*this.skill('scout'))*visMulAt(this.x,this.y)*(1+this.gearMod('vis'))}
  // what your skill tree gives (tmOf: any character's), and the disciplines it adds
  treeMod(k){return tmOf(this,k)}
  treeSkill(k){return treeSkOf(this,k)}
  // perks: the old picks, or the talent notables that grant them
  hasPerk(p){return this.perks.includes(p)||typeof TREE!=='undefined'&&(this.tree||[]).some(id=>TREE[id]&&TREE[id].m.perk===p)}
  // a companion in a role adds their own discipline: 2, and a third of their Scouting (scout) or Medicine (surgeon)
  roleBonus(k){
    const id=k==='scout'?roleOf('scout'):k==='med'?roleOf('surgeon'):null;
    if(!id||!(typeof compInBand!=='function'||compInBand(id)))return 0;
    return 2+Math.floor((typeof compSkill==='function'?compSkill(id,k):0)/3)}
  // one stat summed over your equipped gear (a mount's gear only with a mount; an off-hand weapon's damage at half), and your talents
  gearMod(k){
    let a=0;
    for(const key in this.gear){
      const id=this.gear[key];if(!id||!ITEMS[id])continue;if(MOUNT_KEYS.includes(key)&&!this.gear.mount)continue;
      const I=ITEMS[id];let v=I.m[k]||0;if(key==='offhand'&&I.slot==='weapon'&&k==='dmg')v*=.5;a+=v}
    return a+this.treeMod(k)}
  gearSkill(k){return Object.values(this.gear).reduce((a,id)=>a+(id&&ITEMS[id].m.sk&&ITEMS[id].m.sk[k]||0),0)}
  // a discipline: as you trained it, with your companions' roles, your gear and your tree (charOf(P).skill: as trained only)
  skill(k){return this.sk[k].lv+this.roleBonus(k)+this.gearSkill(k)+this.treeSkill(k)}
  // your hero's numbers in battle: her level, attributes, disciplines, gear and talents
  heroStats(){
    const tm=k=>this.treeMod(k),gm=k=>this.gearMod(k),melee=this.skill(meleeSk()),two=hybridTwo(),kind=heroKind();
    return {n:'You',
      hp:Math.round((50+10*this.level+4*this.attr.str+gm('hp'))*(1+tm('hpPct'))),
      dmg:(8+2*this.level+this.bonus+this.attr.str*.5+melee*.6+gm('dmg'))*(1+tm('dmgPct'))*(two?1.2:1),
      spd:(48+this.attr.agi*2)*(1+gm('spd')),
      reach:21+melee*.4+gm('reach')+(two?4:0),
      range:heroRange(),magic:kind==='magic',
      dt:itemDt(this.gear.weapon)||(kind==='magic'?'arcane':'blunt'),armor:itemArmor(this.gear.body)||'none',race:this.race,
      cd:.45*(1-this.attr.agi*.03)*(1+gm('cd')),
      tags:Object.values(this.gear).map(id=>id&&ITEMS[id].tag).filter(Boolean)}}
  // stamina pays for physical effort, mana for skills
  maxSP(){return 60+this.attr.agi*5+this.level*2+this.treeMod('sp')+4*this.skill('athl')}
  maxMP(){return Math.round((30+this.attr.int*6+this.level*2+this.gearMod('mp'))*(1+this.treeMod('mpPct')))}
  // health, stamina and mana persist between battles; null means full (a new hero or an old save). Returns their maxima
  vitals(){
    const m=[this.heroStats().hp,this.maxSP(),this.maxMP()];
    if(this.hp==null)this.hp=m[0];if(this.sp==null)this.sp=m[1];if(this.mp==null)this.mp=m[2];
    this.hp=clamp(this.hp,0,m[0]);this.sp=clamp(this.sp,0,m[1]);this.mp=clamp(this.mp,0,m[2]);
    return m}
  // recovery on the map, per day of travel (combat.js REGEN_DAY; Medicine helps health); doubled near a holding
  regenVitals(days){
    const m=this.vitals(),sh=TOWNS.some(t=>Math.hypot(t.x-this.x,t.y-this.y)<48)?2:1;
    this.hp=Math.min(m[0],this.hp+m[0]*(REGEN_DAY.hp+.03*this.skill('med'))*sh*days);
    this.sp=Math.min(m[1],this.sp+m[1]*REGEN_DAY.sp*sh*days);
    this.mp=Math.min(m[2],this.mp+m[2]*REGEN_DAY.mp*sh*days)}
  restoreVitals(){
    const m=this.vitals();
    this.hp=m[0];this.sp=m[1];this.mp=m[2]}
}
Object.setPrototypeOf(P,PlayerParty.prototype);
// which kind a plain party is
const partyClassOf=o=>o.cid?CompanionParty:o.pt?PatrolParty:o.cv?CaravanParty:o.fac&&o.name?LordParty:BandParty;
// make a party one of its kind: its own list of soldiers (or a save's counts) becomes its counts; a band with only its number
// (n) musters its fighters here, once
function asParty(o){
  if(!o||o instanceof Party)return o;
  const own=k=>Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined,list=own('troops')||own('list'),C=partyClassOf(o);
  delete o.troops;delete o.list;Object.setPrototypeOf(o,C.prototype);
  o.tc=o.tc||(list?countsOf(list):C===BandParty?countsOf(makeEnemies(o.n||3,false,o.kind)):{});o.changed();return o;
}
// every party on the map: the lords in the field, bands, patrols, your companions' parties (not caravans: they are drawn and
// picked as their carts, caravans.js, not as a host behind a leader, render.js drawParties)
function allParties(){return [...W.lords.filter(l=>!l.dead),...bandits,...W.patrols,...cparties()]}
Object.defineProperty(W,'parties',{get:allParties,enumerable:false});
