'use strict';
/* ---------- damage and attack execution ---------- */
// Targeting and activation stay with actors/commanders. These helpers execute an attack and preserve its existing effects.
function fx(x,y,c,n){for(let i=0;i<n;i++)B.parts.push({x,y,vx:(Math.random()-.5)*70,vy:(Math.random()-.5)*70,life:.35,c})}
function shakeIt(n){G.shake=Math.max(G.shake,n)}
/* the sound of a blow or a missile landing on t from src (a unit, or a missile's point): on the front of a shield a block (the
   test vfxHit splinters by); an arrow or bolt otherwise its strike; steel on mail or plate a clash; magic, a beast's claws, a
   beast struck, the rest: a hit. Only one in SND_EVERY of each kind is played (a counter, never a dice), so a 400-man melee stays
   readable; the cues' own limits (audio.js SFX gap, max) and the voice cap do the rest */
const SND_EVERY={clash:2,hit:2,block:1,arrowhit:2,ground:3,loose:2},SND_N={};
const sndTurn=k=>(SND_N[k]=(SND_N[k]||0)+1)%SND_EVERY[k]===0;
function blowSound(src,t,arrow,magic){
  const ts=t.s||{},k=magic?'hit':tagsOf(ts).includes('shield')&&sideOf(t,src)==='front'?'block':arrow?'arrowhit':
    ts.beast||ts.big||src.s&&src.s.beast||!/^(mail|plate)$/.test(armorOf(ts))?'hit':'clash';
  if(sndTurn(k))sfxAt(k,t.x,t.y)}
// a quiver per battle: at least 32 for every shooter (bows and slings 40, crossbows 32); casters and beasts never run out; a
// character's, its quiver's shots (its stats' shots: world/characters.js Character fieldStats, core/items.js Quiver).
// When it is empty the unit draws a blade: melee reach, weaker blows.
const AMMO={min:32,bow:40,xbow:32,sling:40};// (every shooter starts with at least AMMO.min: bows and slings 40, crossbows 32)
const quiverOf=s=>s.magic||s.beast||s.big?Infinity:s.shots!=null?s.shots:Math.max(AMMO.min,s.ammo||(s.flat?AMMO.xbow:s.bow?AMMO.bow:AMMO.sling));
/* how true a shot flies, for every shooter alike: a spread round the aim (a, radians, from side to side) and, for an arrow's arc,
   how far long or short it may fall (d, a share). By the weapon (a bow, a crossbow or sling or bolt of magic: flat), then halved
   for an elf; a soldier steadier by his kind's tier, a character by their skill (Archery, Spellcraft for magic) and their
   weapon's quality (its tier); worse tired, worse again spent; a bow loosed before full draw, worse by how far short */
const AIM={bow:[.08,.06],flat:[.2,0],elf:.5,tier:.08,skill:.06,gear:.06,floor:.3,tired:1.25,spent:1.5,draw:.4};
const spreadOf=E=>(Math.random()-.5)*E.a;
// spears thrust; chieftains, trolls and the heaviest hitters come down from above; the rest swing, with now and then an overhead blow
const troopStyle=u=>unitClass(u.s)==='spear'?'thrust':u.type==='chief'||u.s.big||u.s.dmg>=14?'overhead':(u.atkN%3===0?'overhead':'swing');
const BLADE={reach:12,dmg:.6,cd:.8};
/* ---------- a soldier's blows and wounds (Fighter, class wave E3): every soldier's, as his Actor (actors.js: Actor.of(u), one
   for each, holding nothing but its man). A troop's or a beast's as written here; the kinds that differ, a character (CharActor)
   and your hero (HeroActor), override in actors.js what is theirs: a roll that leaves them unhurt (dodging), what comes off a
   wound (taken), what a fall means (fell), a guard against a blow or a missile (guards), how true they shoot (flatShot, race,
   steady, shotSkill, weaponTier), their quiver (useAmmo) and XP for their blows (earnXp) ---------- */
class Fighter{
  constructor(u){this.u=u}
  // ---- struck: a wound of amt (m: the matchup, for its colour; dt: its damage type; source: who dealt it; missile: a shot)
  wound(amt,m,dt,source,missile){const t=this.u;
    if(B.sight)sightStruck(source,t);// (whoever strikes or shoots at a side is seen by it: terrain.js)
    if(this.dodging()>0){B.floats.push({x:t.x,y:t.y-16,t:'Dodge',life:.4,c:'#cfe0ff'});return}// (rolling, leaping, dashing: unhurt)
    amt=this.taken(amt);
    amt=Math.max(1,Math.round(amt));const wasHp=t.hp,effective=Math.min(Math.max(0,wasHp),amt);if(B.opts.sandbox&&BattleLab.active)BattleLab.damage(t,effective,source);t.hp-=amt;B.lastHit=B.t;t.flash=.1;t.hitAt=B.t;Duel.struck(t,amt);moraleHurt(t,effective,source,missile);
    B.floats.push({x:t.x,y:t.y-14,t:String(amt),life:.7,c:m>=1.25?'#ffb04a':m&&m<=.8?'#9aa3ad':isMagical(dt)?'#c8a0ff':t.team?'#ffe08a':'#ff9a90'});// (telling: orange, dulled: grey, magic: violet)
    if(BLOOD.on&&!undead(t))for(let i=0;i<2;i++)vfx({k:'blood',x:t.x,y:t.y,z:7,vx:(Math.random()-.5)*60,vy:(Math.random()-.5)*30,vz:20+Math.random()*50,life:1.2});// (gfx/vfx.js; none with Blood off)
    B.sides?.damage(t,effective,source);
    if(t.hp<=0){
      if(wasHp>0&&B.opts.sandbox&&BattleLab.active)BattleLab.kill(t,source);
      t.hp=0;const cp={x:t.x,y:t.y,team:t.team,face:t.face,hero:t.hero,wait:true};B.corpses.push(cp);vfxDeath(t,cp);if(wasHp>0)moraleDeath(t,source);if(wasHp>0&&B.sides&&!B.sides.active)B.sides.kill(t,source,false);// (it falls first, then lies: vfx.js)
      if(B.sides?.active){if(wasHp>0)B.sides.kill(t,source);if(t.team===0)this.fell()}else if(t.team===1){B.kills++;B.slain.push(t.type);if(wasHp>0&&source&&source.grp){const K=B.grpKills||(B.grpKills={});K[source.grp]=(K[source.grp]||0)+1}}// (and by whose group: the unit of the battle, resolution.js)
      else this.fell();
      if(t.lord&&!t.leader){if(t.sourceArmy===t.lord&&t.sourceGroupId)partyRoster(t.sourceArmy).remove(t.type,1,t.sourceGroupId);else t.lord.remove(t.type,1)}
      else if(t.team!==0&&t.sourceArmy&&t.sourceGroupId&&!t.leader){partyRoster(t.sourceArmy).remove(t.type,1,t.sourceGroupId);B.primaryLossesApplied=true}
      battleEvent('down',{u:t});// (the cards and the selection: battlehud.js)
      shakeIt(2);
    }
  }
  // (a champion's roll, leap or dash: u.ch, charmind.js)
  dodging(){const t=this.u;return t.ch&&t.ch.inv}
  taken(amt){const t=this.u;if(t.wardT>0)amt*=.75;if(t.s.dr)amt*=1-t.s.dr;return amt}
  // one of yours down (theirs are kills): a soldier lost to your band, but a lord's man
  fell(){const t=this.u;if(!t.lord)B.lost[t.type]=(B.lost[t.type]||0)+1}
  // (a blow or a missile from angle a, of dm: none but your hero ever guards)
  guards(a,dm){return false}
  // ---- striking: a blow of dm on t (dt: its damage type)
  hit(t,dm,dt){
    const att=this.u,m=matchup(att.s,t.s,dt);dm*=m*(att.buffT>0?1.3:1)*groundHit(att,t);/* (from high ground harder, from marsh softer: terrain.js) */if(att.comp)compTrain(att.type,compMeleeSk(att.type),2);
    if(Actor.of(t).guards(Math.atan2(att.y-t.y,att.x-t.x),dm)){dm*=blockMul();fx(t.x+Math.cos(B.aim)*10,t.y-6,'#cfe0ff',5);B.floats.push({x:t.x,y:t.y-14,t:'Block',life:.5,c:'#9fc0ff'})}
    const was=t.hp;Actor.of(t).wound(dm*formTaken(t,att)*flankMul(t,att),m,dt||dtOf(att.s),att,false);vfxHit(att,t,dm);this.earnXp(t,was);// (its formation: formations.js; the side it is hit on: morale.js)
    if(sfxOn())blowSound(att,t,false,isMagical(dt||dtOf(att.s)));
  }
  // one of your troops (not your hero, a companion or a lord's man) earns XP for a blow: the damage it dealt, and a kill by the foe's tier
  earnXp(t,was){const u=this.u;if(u.team!==0||u.lord||!t||!battleEnemy(u,t))return;const dealt=Math.max(0,was-Math.max(0,t.hp));
    u.xp=(u.xp||0)+dealt*TROOP_XP.dmg+(was>0&&t.hp<=0?TROOP_XP.kill*(ST[t.type]&&ST[t.type].tier||1):0)}
  // how true he shoots (p: a bow's draw, 0 to 1): AIM's spread by his weapon, his race, how steady he is, how tired, the draw
  aimErr(p){
    const u=this.u,s=u.s,base=s.magic||s.flat||this.flatShot()?AIM.flat:AIM.bow;let m=this.race()==='elf'?AIM.elf:1;
    m*=this.steady();
    const T=tiredMul(u);m*=T.dmg<.8?AIM.spent:T.dmg<1?AIM.tired:1;if(p!=null)m*=1+AIM.draw*(1-p);
    return{a:base[0]*m,d:base[1]*m}}
  flatShot(){return false}
  race(){return this.u.s.race}
  // (a soldier: by his kind's tier)
  steady(){const s=this.u.s;return Math.max(AIM.floor,1-AIM.tier*((s.tier||1)-1))}
  shotSkill(){const u=this.u,k=u.s.magic?'spell':'archery';return u.unit&&u.unit.isChar?u.unit.skill(k):0}
  weaponTier(){const u=this.u,id=u.unit&&u.unit.isChar&&u.unit.o.gear&&u.unit.o.gear.weapon,I=id&&ITEMS[id];return I&&I.tier||0}
  outOfAmmo(){const u=this.u;u.s={...u.s,range:0,reach:Math.max(u.s.reach||0,10*meleeK()),dmg:u.s.dmg*.6};u.empty=true;B.floats.push({x:u.x,y:u.y-20,t:'Out of ammo',life:.7,c:'#9aa3ad'})}
  // a shot from his quiver (s: his stats as he loosed)
  useAmmo(s){const u=this.u;if(u.ammo==null)u.ammo=quiverOf(s);if(--u.ammo<=0)this.outOfAmmo()}
  attack(t){
    const u=this.u,s=u.s;if(!s.range){const H=Moveset.hardNow(u,t);if(H)return this.windUp(t,H)}// (a hard attack ready: wound up first, movesets.js)
    u.cd=s.cd*(.9+Math.random()*.2);u.atkAt=B.t;if(B.sight)sightStruck(u,t);// (a blow or a shot loosed gives him away: terrain.js)
    if(s.range){const flat=s.magic||s.flat,E=this.aimErr(),k=B.world?WORLD_BATTLE.sprite:1,ty=B.world&&flat?t.y-(t.s.mounted||t.s.big?10:6)*k:t.y;Missile.fire(u,Math.atan2(ty-(flat?u.y-6*k:u.y),t.x-u.x)+spreadOf(E),s.dmg*(.85+Math.random()*.3)*(u.buffT>0?1.3:1)*arrowMul(u),arrowSrc(u,s),Math.hypot(t.x-u.x,t.y-u.y),{sc:E.d});if(!s.magic&&sfxOn()&&sndTurn('loose'))sfxAt('loose',u.x,u.y)}// (fire arrows: unitabilities.js)
    else{const cm=chargeMul(u,t);let dm=s.dmg*(.8+Math.random()*.4)*cm*tiredMul(u).dmg;fatigueBlow(u);// (a charge: by how far it ran, braced spears blunt it, morale.js; tired, softer: fatigue.js)
      Duel.meet(u,t);Duel.look(u,t);// (two men paired, and the look of his blow: duel.js)
      if(cm<=DEFENCE.charge&&Defence.stops(u,t))return this.follow(t,dm,true);// (met: blocked, parried or dodged, defence.js)
      this.hit(t,dm);if(PHYSICS.on)physBlow(u,t);this.follow(t,dm)}// (a heavy one's blow pushes men: physics.js)
    if(s.range)this.useAmmo(s);
  }
  /* ---- a hard attack (H: movesets.js MOVESETS.hard): wound up at t (u.wind {t: s left, e: t, H}), he stands (winding, from his
     step: actors.js) till it lands on t still in his reach (hardBlow), or is spoilt (he runs, is stunned or thrown down, is sent elsewhere, t falls).
     Its telegraph: a ring at his feet and its name over him. Its cooldown runs from the wind-up */
  windUp(t,H){const u=this.u;u.wind={t:H.wind,e:t,H};u.hardAt=B.t+H.wind+H.cd;u.run=0;u.shot=null;u.face=t.x>=u.x?1:-1;if(B.sight)sightStruck(u,t);
    B.rings.push({x:u.x,y:u.y-4,r:u.s.big?26:14,life:H.wind,max:H.wind,col:'255,150,60'});B.floats.push({x:u.x,y:u.y-(u.s.big?34:24),t:H.n,life:H.wind+.3,c:'#ffb070'})}
  // (each moment wound up: true while it holds him, and the moment it lands; false, spoilt: he goes on as ever)
  winding(dt){const u=this.u,W=u.wind;if(u.rout||withdrawing(u)||W.e.hp<=0||relocating(u,u.grp&&B.groups[u.grp])){u.wind=null;return false}
    u.spdNow=0;u.shot=null;if((W.t-=dt)>0)return true;u.wind=null;const e=W.e,d=Math.hypot(e.x-u.x,e.y-u.y)-(e.s.big?12:0);
    if(d<=(u.s.reach||11)+2+MOVESETS.slack)this.hardBlow(e,W.H);else B.floats.push({x:u.x,y:u.y-20,t:'Miss',life:.5,c:'#9aa3ad'});return true}
  // a troop's or a beast's hard blow: his blow × H.dmg, its throw (physics on: may throw down), a stomp's on all round t too
  hardBlow(t,H){
    const u=this.u,s=u.s,a=Math.atan2(t.y-u.y,t.x-u.x),dm=s.dmg*H.dmg*(.8+Math.random()*.4)*tiredMul(u).dmg;u.cd=s.cd*(.9+Math.random()*.2);u.atkAt=B.t;u.atkStyle='overhead';u.face=Math.cos(a)>=0?1:-1;fatigueBlow(u);
    this.hit(t,dm);if(PHYSICS.on)physBlow(u,t,H);
    if(H.area)for(const o of spatialOn()?SG.near(t.x,t.y,H.area+13,u.team,true):B.units)if(o!==t&&o.hp>0&&battleEnemy(u,o)&&Math.hypot(o.x-t.x,o.y-t.y)-(o.s.big?12:0)<=H.area){this.hit(o,dm*.5);if(PHYSICS.on)physBlow(u,o,H)}
    B.slashes.push({kind:'slam',x:u.x,y:u.y-6,a,life:.22,max:.22,arc:.8,r:(s.reach||11)+2,w:2,dir:1,area:H.area||9,col:'255,190,90'});fx(t.x,t.y,'#a89a78',8);shakeIt(2)}
  // a troop's melee blow: the look of its weapon, and what it does beyond the one it hits (met: stopped, its look only)
  follow(t,dm,met){
    const u=this.u,s=u.s,a=Math.atan2(t.y-u.y,t.x-u.x),R=(s.reach||11)+2;u.face=Math.cos(a)>=0?1:-1;u.atkN=(u.atkN||0)+1;
    if(s.beast){B.slashes.push({kind:'claw',x:t.x,y:t.y-8,a,life:.18,max:.18,col:'255,255,255',w:1});return}
    const style=troopStyle(u);u.atkStyle=style;
    if(style==='thrust'){B.slashes.push({kind:'thrust',x:u.x,y:u.y-6,a,life:.14,max:.14,r:R+4,w:1,col:'230,236,255',wid:3});
      if(met)return;const b=(spatialOn()?SG.near(u.x,u.y,R+14+31,u.team,true):B.units).find(o=>o!==t&&o.hp>0&&battleEnemy(u,o)&&inShape(u.x,u.y,a,R+14,{shape:'thrust',wid:5},o));if(b)this.hit(b,dm*.5)}
    else{B.slashes.push({kind:style==='overhead'?'slam':'arc',x:u.x,y:u.y-6,a,life:.14,max:.14,arc:.8,r:R,w:1,dir:u.atkN%2?1:-1,area:7,col:'255,255,255'});
      if(!met&&(s.big||style==='overhead')){const b=(spatialOn()?SG.near(t.x,t.y,13,u.team,true):B.units).find(o=>o!==t&&o.hp>0&&battleEnemy(u,o)&&Math.hypot(o.x-t.x,o.y-t.y)<12);if(b)this.hit(b,dm*.5)}}
  }
  // a dragon's fire: everyone in a cone ahead
  breathe(t){
    const u=this.u,a=Math.atan2(t.y-u.y,t.x-u.x),ox=u.x+Math.cos(a)*14,oy=u.y-10;u.face=Math.cos(a)>=0?1:-1;u.atkAt=B.t;
    for(const e of spatialOn()?SG.near(u.x,u.y,96,u.team,true):B.units){if(e.hp<=0||!battleEnemy(u,e))continue;const ea=Math.atan2(e.y-u.y,e.x-u.x),df=angGap(ea,a);
      if(df<.5&&Math.hypot(e.x-u.x,e.y-u.y)<95)this.hit(e,14*(.8+Math.random()*.4)*(tagsOf(e.s).includes('ward')?.6:1))}
    for(let i=0;i<34;i++){const j=a+(Math.random()-.5)*.9,v=70+Math.random()*90;B.parts.push({x:ox,y:oy,vx:Math.cos(j)*v,vy:Math.sin(j)*v-20,life:.5,c:Math.random()<.5?'#ff7a30':'#ffd24a'})}
    B.floats.push({x:u.x,y:u.y-30,t:'FIRE',life:.6,c:'#ff9a50'});shakeIt(3);
  }
  // a shooter's sidearm (Melee Mode): his melee damage, a blade's pace
  blade(e){const u=this.u,s=u.s,dm=meleeDmgOf(s)*(.8+Math.random()*.4)*tiredMul(u).dmg;u.cd=s.cd*BLADE.cd*(.9+Math.random()*.2);u.atkAt=B.t;u.atkStyle='swing';fatigueBlow(u);u.face=e.x>=u.x?1:-1;Duel.meet(u,e);Duel.look(u,e);if(Defence.stops(u,e))return this.follow(e,dm,true);this.hit(e,dm);this.follow(e,dm)}
}
// ---------- the old names: one-line aliases (earnXp: a missile's shooter may be none) ----------
function applyDmg(t,amt,m,dt,source,missile){return Actor.of(t).wound(amt,m,dt,source,missile)}
function earnXp(u,t,was){if(u)Actor.of(u).earnXp(t,was)}
function hit(att,t,dm,dt){return Actor.of(att).hit(t,dm,dt)}
const shotSkill=u=>Actor.of(u).shotSkill();
const weaponTier=u=>Actor.of(u).weaponTier();
function aimErr(u,p){return Actor.of(u).aimErr(p)}
function outOfAmmo(u){return Actor.of(u).outOfAmmo()}
function attack(u,t){return Actor.of(u).attack(t)}
function meleeFollow(u,t,dm){return Actor.of(u).follow(t,dm)}
function breathe(u,t){return Actor.of(u).breathe(t)}
function bladeBlow(u,e){return Actor.of(u).blade(e)}
