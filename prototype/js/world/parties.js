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
  // Displayed fighting headcount; size stays the soldier-only count used by recruitment and simulation.
  get fighters(){return this===P?1+this.size+compsInBand().length:this.size+Math.max(0,(this.dead?0:partyRoster(this).reserved)-(this.ld&&this.troops.includes('chief')?1:0))}
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
  // in sight (fog): within your sight, or nearer when it is in woods (map.js hiddenAt)
  inView(V){return this.onMap()&&spotted(this,V)}
  // a click: on its ring; marched man by man, on any of its men or inside its outline (world.js pickAt army, march.js MarchArmy
  // hit), else on its leader's figure (a lord's whole horse: render.js partyFig, opaqueBox); and on its banner
  pick(at){if(!this.onMap())return;at.add(this,10,4);if(!at.army?.(this)&&Math.hypot(this.x-at.x,this.y-at.y)<32){const F=partyFig(this,this.look(),0);at.fig(this,F.s,F.x,F.y,F.flip)}}
  // its banner, on its card (ui.js tipFlag) and its men's flags (marchgear.js) (sprites.js bannerSprite: k its shape, col its field,
  // dev its device), null for none; and the map row of its leader's head, its label over it (render.js armyTagAt)
  banner(){return null}
  headY(){return Math.round(this.y)+3-16+figTop(this.look(),this)}
  // in sight: its host of soldiers, its leader's figure (a rider, a bandit), a torch on a night watch, its label (as it looks: look)
  // (marching, its men hold the torches after dark, every army's: gfx/marchgear.js; else a night watch's over its middle, as before)
  draw(ents,cam,V){if(!this.inView(V)||B?.world?.hides(this))return;const o=this,L=o.look();if(WORLD_BATTLE.on)marchDraw(ents,o,cam);
    // (its step by how far it has walked: on foot a step each WALK.foot px, a rider each WALK.ride; standing still, or resting,
    // the first; drawn at its own place to the screen's pixel: render.js subT)
    // (its label over it: render.js drawBanners)
    ents.push({y:o.y,own:o.faction==='player',f:()=>{subT(o);const sx=Math.round(o.x-cam.x),sy=Math.round(o.y-10-cam.y),fd=L.dir<0?-1:1,rider=!!L.rider&&!L.bandit,go=L.moving&&mapStepping(o),fr=go?frameOf(o,rider?WALK.ride:WALK.foot,WALK.n):0;
      const s=partyFig(o,L,fr).s;// (a rider: his host behind his horse)
      if(!WORLD_BATTLE.on)drawHost(o.size,L.col,sx-(rider?fd*4:0),sy+12,fd,go?o.wd:null,L.seed,L.race,L.bandit);
      if(!WORLD_BATTLE.on){ctx.save();ctx.translate(sx,sy);if(fd<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),13-s.height);ctx.restore();}// (marching, its leader is one of its army: march.js)
      if(L.torch&&!WORLD_BATTLE.on){const tx=sx+fd*4,ty=sy+3;rect(ctx,'#5a3e24',tx,ty,1,4);if(FLAMES.on)fireTorchAt(tx,ty,o.id);LIGHTQ.push({x:tx,y:ty-1,r:16,id:o.id,g:8})}// (its flame: fire.js; the light only light)
      BANNERQ.push({o,label:!o.fight&&L.label?[L.label,L.labelCol]:null})}})}
  // sheltering in a holding: inside is the holding's name. shelterWhy(t): why it may not go in there ('' if it may; each kind
  // has its rules); enter and leave by the gate
  shelterWhy(t){return !t?'Nowhere':besieged(t)?'The gates are barred for the siege':''}
  enter(t){this.inside=t.name;this.x=t.x;this.y=t.y+4}
  leave(){const t=townBy(this.inside);this.inside=null;if(t){this.x=t.x+rint(-6,6);this.y=t.y+14}}
  // how it looks on the map (render.js drawParties): colour, rider, moving, label
  look(){return{col:'#888',dir:this.dir||1,moving:true,seed:0,label:String(this.fighters),labelCol:'#ccc'}}
  // its fighting strength (engage.js rating), and its realm; in a fight on the map, its fighters as they are (fights.js)
  power(){return rating(this.troops)}
  fightPower(){return power(this.troops)}
  takeLoss(blow){this.removeAny(1)}
  get faction(){return this.fac}
}
class LordParty extends Party{
  // (his unit slots: his men limit (realms.js lcapOf) in units of LORD_RECRUIT.men; he hires and refills units as you do)
  unitSlots(){return clamp(Math.round(lcapOf(this)/LORD_RECRUIT.men),1,ARMY_LIMIT)}
  get mapKind(){return 'lord'}
  here(){return W.lords.includes(this)}
  meet(){lordMeet(this)}
  mapDot(V){return !this.dead&&!this.inside&&yourSight(V).sees(this.x,this.y)?[FACS[this.fac].col,1]:null}
  label(){return this.name}
  tip(){return '<b>'+htmlText(lordName(this))+' <span class="muted">Lv '+lordStats(this).lv+'</span></b><small>'+tipFac(this.fac)+', '+this.fighters+' fighters, including the leader'+tipOdds(this.power())+paceVs(lordSpeed(this))+'</small>'+Houses.tagOf(this)+'<span class="act">Click: actions, double-click: '+(hostileTo(this.fac)?'fight':'talk')+'</span>'}
  get brain(){return BRAINS.lord}
  shelterWhy(t){return t&&t.owner!==this.fac?'Not a holding of '+pr(this).his+' realm':super.shelterWhy(t)}
  banner(){return{k:'banner',col:FACS[this.fac].col,dev:this.fac}}
  look(){const col=FACS[this.fac].col,still=this.state==='rest'||this.state==='siege';return{col,race:FACS[this.fac].races[0],rider:'horse',dir:faceDir(this),moving:!still,seed:this.id.length*31+this.name.length,label:String(this.fighters),labelCol:hostileTo(this.fac)?STANCE_COL[stance(this.power())]:col}}
}
class CompanionParty extends Party{
  get mapKind(){return 'cparty'}
  meet(){openComp(this.cid)}// (no minimap dot)
  label(){return COMPS[this.cid].short+'’s party'}
  get faction(){return 'player'}
  // (its leader's Leadership makes it stronger)
  power(){return power(this.troops)*(1+.04*compSkill(this.cid,'lead'))}
  tip(){return '<b>'+this.label()+'</b><small>Your companion, '+this.fighters+' fighters, '+({follow:'following you',patrol:'patrolling '+this.base,return:'coming back'})[this.order]+'</small><span class="act">Click: actions, double-click: orders</span>'}
  get brain(){return BRAINS.cparty}
  shelterWhy(t){return !t?'Nowhere':yourShelterWhy(t)}
  enter(t){this.inside=t.name;this.x=t.x;this.y=t.y}
  inView(V){return this.onMap()&&yourSight(V).sees(this.x,this.y)}// (yours: always in sight)
  banner(){return{k:'banner',col:FACS.player.col,dev:'star'}}// (yours, a companion's mark on it)
  look(){return{col:FACS.player.col,race:P.race,dir:this.dir||1,moving:true,seed:this.cid.length*7,label:COMPS[this.cid].short+' '+this.fighters,labelCol:'#9fc0ff'}}
}
class PatrolParty extends Party{
  get mapKind(){return 'patrol'}
  here(){return W.patrols.includes(this)}
  meet(){patrolMeet(this)}
  get meetsAnyTime(){return true}
  label(){return watchName(this)}
  tip(){return '<b>'+watchName(this)+'</b><small>'+tipFac(this.fac)+', '+this.fighters+' fighters'+(hostileTo(this.fac)?tipOdds(this.power()):'')+'</small><span class="act">Click: actions, double-click: meet</span>'}
  mapDot(V){return yourSight(V).sees(this.x,this.y)?[this.fac==='player'?FACS.player.col:FACS[this.fac].col,1]:null}
  get brain(){return BRAINS.patrol}
  banner(){return watchOf(this)==='night'?{k:'pennant',col:WATCH.night.pennant,dev:'lantern'}:{k:'pennant',col:this.fac==='player'?FACS.player.col:FACS[this.fac].col,dev:this.fac}}// (the day watch: its holding's realm's pennant; the night watch: a dark one with a lantern)
  look(){const col=this.fac==='player'?FACS.player.col:FACS[this.fac].col,near=Math.hypot(this.x-P.x,this.y-P.y)<120;
    return{col,race:this.fac==='player'?P.race:FACS[this.fac].races[0],dir:this.dir||1,moving:true,seed:this.home.length*13,torch:watchOf(this)==='night',label:near?String(this.size):'',labelCol:hostileTo(this.fac)?STANCE_COL[stance(this.power())]:crimeAt(townBy(this.home))&&this.fac!=='player'?'#ff9a90':col}}
}
// a bandit band: n (how many it shows) follows its troops; its power is kept (pw) until they change or its chieftain grows
// (its own kind field is which bandits it is: bandits, raiders, bog; mapKind is what it is on the map); carry: a captive of yours
// it holds (world/captives.js carryOff: [{cap, n}]), told on its tip
class BandParty extends Party{
  get mapKind(){return 'band'}
  here(){return bandits.includes(this)}
  meet(){meetBand(this)}
  mapDot(V){return yourSight(V).sees(this.x,this.y)?['#ff6a60',1]:null}
  label(){const b=BANDS[this.kind||'bandits'];return b?b[0].replace(' ahead',''):'Bandits'}
  get faction(){return null}
  // (its chieftain hardens it: leaders.js chiefLv)
  power(){return this.pw||(this.pw=rating(this.troops,chiefLv(this)))}
  tip(){return '<b>'+this.label()+'</b>'+chiefTip(this)+'<small>'+this.fighters+' fighters'+tipOdds(this.power())+paceVs(partySpeed(this,this.troops))+'</small>'+(this.carry?'<small class="gold">They hold '+this.carry.map(c=>c.n).join(' and ')+' captive</small>':'')+'<span class="act">Click: actions, double-click: attack</span>'}
  get brain(){return BRAINS.band}
  // (a tattered rag: red, a desert raider's ochre, a bog raider's green; flagB, colB: a fight's own men under their place's flag and
  //  colours (battle/setup.js: a camp's or a hideout's, sites.js flag; a realm's real toll-men, their holding's: encounters.js roadFight))
  banner(){return this.flagB!==undefined?this.flagB:{k:'rag',col:BAND_FLAG[this.kind]||BAND_FLAG.bandits,dev:'skull'}}// (flagB null: none, a ruin's cultists or grave robbers: no army's)
  look(){const c=this.ld;return{col:this.colB||'#8a4a3a',bandit:true,dir:faceDir(this),moving:!this.idle,seed:Math.round(this.x)%97,label:(c?c.name.split(' ')[0]+' Lv'+c.lv+', ':'')+this.fighters,labelCol:STANCE_COL[stance(this.power())]}}
  changed(){super.changed();if(this.tc)this.n=this.size;this.pw=0}
  // its nerve: how bold it is (brains.js BandBrain: it judges you as if it had this share of its power); how far it strays from
  // where it haunts (haunt) before it heads back, in tiles
  get nerve(){return 1}
  get hauntR(){return HAUNT.r}
  // its record in a save: on a generated world its numbers to a tenth, its strength made again (worldobject.js packs)
  toJSON(){if(!packs())return this;const {pw,...o}=this;return tenths(o)}
}
/* a holding's defenders in a fight for it (a siege, a raid: world/siege.js startAssault; the owner, 2026-11-07: "why raid in
   holding have different flags and unit factions"): its own men under its own flag, the one over it on the map (structures.js
   holdingFlag), in its realm's colours (worldbattle.js worldTint: forceRealm by faction), never a bandit band's rag; gar: its name.
   Made for the fight only (battle/setup.js), never on the map */
class GarrisonParty extends Party{
  get mapKind(){return 'garrison'}
  get town(){return townBy(this.gar)}
  get faction(){return this.town?.owner||null}
  here(){return false}
  label(){return (this.town?.name||'The')+' garrison'}
  banner(){const t=this.town;return t?holdingFlag(t,facCol(t)):null}
  look(){const t=this.town;return{col:t?facCol(t):'#98a0ba',dir:-1,moving:false,seed:0,label:String(this.size)}}
}
// your own band: its counts are P.troops, as they always were (read everywhere as counts), and it changes the way every party
// does (P.add, P.remove, P.size...). Its own troops shadow the list view; its list is built on asking. You are its brain.
class PlayerParty extends Party{
  get mapKind(){return 'you'}
  here(){return false}// (drawn on its own, never picked or met: render.js drawWorld)
  get tc(){return this.troops} set tc(v){this.troops=v}
  get list(){return expandCounts(this.troops)}
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
  headY(){if(WORLD_BATTLE.on)return Math.round(this.y)+3-16+figTop(this.look(),this);const m=mountDef();return Math.round(this.y)+3-16+opaqueBox(partySprite('#e8b94a',m?m.col:'',0))[1]}
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
  // how many you may lead: everyone now and the men your units could still take in (unit slots by Leadership and talents, each unit
  // its kind's size: core/army.js; the owner, 2026-10-31: "go by units")
  cap(){return this.headcount()+partyRoster(this).room()}
  // room left: negative while over capacity (callers decide whether a transfer is allowed)
  room(){return this.cap()-this.headcount()}
  prisonCap(){return 2+Math.floor(this.skill('lead'))+(this.hasPerk('warden')?6:0)+this.treeMod('prison')}
  // food a day: everyone, their horses and your prisoners, a quarter each; marching hard eats more, a quartermaster less
  eatPerDay(){
    const n=(this.headcount()+this.mountedCount()+this.prisonerCount()+1)/4;
    return Math.ceil(n*(this.hasPerk('forced')?1.2:1)*(this.hasPerk('quarter')?.75:1)*(roleOf('quarter')?.75:1)*(1-this.treeMod('food')))}
  // how far you see: your Scouting (to the old top: skillSafe), the ground you stand on and your gear
  sight(){const p=typeof worldEye==='function'?worldEye():this;return (110+8*this.skillSafe('scout'))*visMulAt(p.x,p.y)*(1+this.gearMod('vis'))}
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
  // (as the effects made for the old top read it: its level to PROF.made, gear and tree on top)
  skillSafe(k){const lv=this.sk[k].lv;return this.skill(k)-profPow(lv)+profPow(Math.min(lv,PROF.made))}
  skill(k){return profPow(this.sk[k].lv)+this.roleBonus(k)+this.gearSkill(k)+this.treeSkill(k)}// (a proficiency's level in power: profPow)
  // your hero's numbers in battle (HERO_BASE): her level, disciplines, gear and tree
  heroStats(){
    const tm=k=>this.treeMod(k),gm=k=>this.gearMod(k),melee=this.skill(meleeSk()),two=hybridTwo(),kind=heroKind(),fist=unarmed(),weak=this===P&&Death.weak()?DEATH.weak:null;// (bare hands: combat.js FISTS; weak after the beasts: world/death.js)
    return {n:'You',
      hp:Math.round((HERO_BASE.hp+gm('hp'))*(1+tm('hpPct'))),
      dmg:(HERO_BASE.dmg+LEVEL.dmg*this.level+this.bonus+melee*.6+gm('dmg'))*(1+tm('dmgPct'))*(two?1.2:1)*(fist?FISTS.dmg*(1+tm('fistPct')):1)*(weak?weak.dmg:1),
      spd:HERO_BASE.spd*(1+gm('spd'))*(weak?weak.spd:1),
      reach:21+melee*.4+gm('reach')+(two?4:0)+(fist?FISTS.reach:0),
      range:heroRange(),magic:kind==='magic',
      dt:itemDt(this.gear.weapon)||(kind==='magic'?'arcane':'blunt'),armor:itemArmor(this.gear.body)||'none',race:this.race,
      cd:HERO_BASE.cd*(1+gm('cd'))*(fist?FISTS.cd*(1+tm('fistCd')):1),
      tags:Object.values(this.gear).map(id=>id&&ITEMS[id].tag).filter(Boolean)}}
  // stamina pays for physical effort, mana for skills
  maxSP(){return HERO_BASE.sp+this.treeMod('sp')+4*this.skill('athl')}
  maxMP(){return Math.round((HERO_BASE.mp+this.gearMod('mp'))*(1+this.treeMod('mpPct')))}
  /* health, stamina and mana persist between battles; null means full (a new hero or an old save). Returns their maxima. Your
     hero's stamina on the map is your band's (doc/SUPPLY_DESIGN.md §2): kept in sp, on her scale (maxSP); bsta reads and sets it as
     the band's, 0-100 (world/supply.js); it comes back by the hour there, not here */
  vitals(){
    const m=[this.heroStats().hp,this.maxSP(),this.maxMP()];
    if(this.hp==null)this.hp=m[0];if(this.sp==null)this.sp=m[1];if(this.mp==null)this.mp=m[2];
    this.hp=clamp(this.hp,0,m[0]);this.sp=clamp(this.sp,0,m[1]);this.mp=clamp(this.mp,0,m[2]);
    return m}
  get bsta(){return this.sp==null?100:clamp(this.sp/Math.max(1,this.maxSP())*100,0,100)}
  set bsta(v){this.sp=clamp(v,0,100)*this.maxSP()/100}
  // your band's camp (world/supply.js: kept beside your record in BAND, not on it)
  get camp(){return BAND.camp}
  set camp(v){BAND.camp=v}
  // recovery on the map, per day of travel (combat.js REGEN_DAY; Medicine helps health); doubled near a holding. Hunger and thirst
  // stop it (world/supply.js heroRegen: mana from Hungry or Parched on, health from Starving or Dying of thirst on)
  regenVitals(days){
    const m=this.vitals(),sh=TOWNS.some(t=>Math.hypot(t.x-this.x,t.y-this.y)<48)?2:1,r=heroRegen();
    if(r.hp)this.hp=Math.min(m[0],this.hp+m[0]*(REGEN_DAY.hp+.03*this.skill('med'))*sh*days);
    if(r.mp)this.mp=Math.min(m[2],this.mp+m[2]*REGEN_DAY.mp*sh*days)}
  restoreVitals(){
    const m=this.vitals();
    this.hp=m[0];this.sp=m[1];this.mp=m[2]}
  /* your band's supplies (world/supply.js SUPPLY): its stamina's state ('fresh', 'tired' under SUPPLY.tired, 'exhausted' under
     SUPPLY.exhausted) and its pace by it; food rations and drink an hour (moving: on the march; drink, SUPPLY.drink.perDay a person
     a day: one water a day); the furs it needs in the frost;
     and its health: the hero (as one), the fit and the hurt companions with your soldiers, fit of the whole */
  staminaState(){return this.bsta<SUPPLY.exhausted?'exhausted':this.bsta<SUPPLY.tired?'tired':'fresh'}
  staminaPace(){const st=this.staminaState();return (st==='fresh'?1:SUPPLY.pace[st])*(BAND.dry>=SUPPLY.thirst.parched?SUPPLY.thirst.pace:1)}// (Parched: supply.js)
  foodHour(moving){return this.eatPerDay()/24*(moving?SUPPLY.eat.march:SUPPLY.eat.rest)}
  drinkHour(moving){return (this.headcount()+1)*SUPPLY.drink.perDay/24*(moving?1:SUPPLY.drink.rest)}
  furNeed(){return Math.ceil((this.headcount()+1)/SUPPLY.furPer)}
  fitness(){
    const hurt=Object.keys(this.comps).filter(id=>!this.comps[id].party&&this.comps[id].hurt>G.day+Clock.frac).length,fit=1+this.troopCount()+compsInBand().length,wounded=this.woundedCount()+hurt;
    return{fit,wounded,share:fit/(fit+wounded)}}
}
Object.setPrototypeOf(P,PlayerParty.prototype);
// which kind a plain party is
const partyClassOf=o=>o.gar?GarrisonParty:o.cid?CompanionParty:o.pt?PatrolParty:o.cv?CaravanParty:o.fac&&o.name?LordParty:o.kind==='goblins'?GoblinBand:BandParty;
/* a force made for a fight flies its source's flag (the owner, 2026-11-10: "When siege or battle with garrison the flag seems to be
   bugged and use bandit flag": a free holding's garrison, a village's folk and an estate's guards read as a band and flew the
   bandits' rag). A force: a party's or a holding's men as a plain record, src where they came from (fights.js forceOf,
   garrisonForce), or town their holding (estate.js, folk.js). A holding's men its banner (grey, free folk's), a patrol its pennant,
   a band its own rag; else its kind's. Its kind otherwise as before (partyClassOf), made once a kind */
const FORCE_KINDS=new Map();
function forceKindOf(C){let F=FORCE_KINDS.get(C);if(F)return F;
  F=class extends C{banner(){const s=this.src||townBy(this.town);return typeof s?.banner==='function'?s.banner():s&&TOWNS.includes(s)?holdingFlag(s,facCol(s)):super.banner()}};
  FORCE_KINDS.set(C,F);return F}
// make a party one of its kind: its own list of soldiers (or a save's counts) becomes its counts; a band with only its number
// (n) musters its fighters here, once
function asParty(o){
  if(!o||o instanceof Party)return o;
  const own=k=>Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined,list=own('troops')||own('list'),K=partyClassOf(o),C=o.src&&o.src!==o||o.town&&!o.name?forceKindOf(K):K;
  delete o.troops;delete o.list;Object.setPrototypeOf(o,C.prototype);
  o.tc=o.tc||(list?countsOf(list):K===BandParty?countsOf(makeEnemies(o.n||3,false,o.kind)):{});o.changed();return o;
}
// every party on the map: the lords in the field, bands, patrols, your companions' parties (not caravans: they are drawn and
// picked as their carts, caravans.js, not as a host behind a leader, render.js drawParties)
function allParties(){return [...W.lords.filter(l=>!l.dead),...bandits,...W.patrols,...cparties()]}
Object.defineProperty(W,'parties',{get:allParties,enumerable:false});
