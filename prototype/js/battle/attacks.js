'use strict';
/* ---------- damage and attack execution ---------- */
// Targeting and activation stay with actors/commanders. These helpers execute an attack and preserve its existing effects.
function fx(x,y,c,n){for(let i=0;i<n;i++)B.parts.push({x,y,vx:(Math.random()-.5)*70,vy:(Math.random()-.5)*70,life:.35,c})}
function applyDmg(t,amt,m,dt,source,missile){
  if(B.terrain)sightStruck(source,t);// (whoever strikes or shoots at a side is seen by it: terrain.js)
  if((t.hero?B.hx&&B.hx.inv:t.ch&&t.ch.inv)>0){B.floats.push({x:t.x,y:t.y-16,t:'Dodge',life:.4,c:'#cfe0ff'});return}// (rolling, leaping, dashing: unhurt)
  if(t.hero)amt*=1-tm('dr');
  if(t.wardT>0)amt*=.75;
  if(t.comp&&t.s.block)amt*=1-t.s.block;// a companion's shield and armour
  if(!t.hero&&t.s.dr)amt*=1-t.s.dr;// (a character's tree: less damage taken)
  amt=Math.max(1,Math.round(amt));const wasHp=t.hp,effective=Math.min(Math.max(0,wasHp),amt);if(B.opts.sandbox&&BattleLab.active)BattleLab.damage(t,effective,source);t.hp-=amt;B.lastHit=B.t;t.flash=.1;t.hitAt=B.t;moraleHurt(t,effective,source,missile);
  B.floats.push({x:t.x,y:t.y-14,t:String(amt),life:.7,c:m>=1.25?'#ffb04a':m&&m<=.8?'#9aa3ad':isMagical(dt)?'#c8a0ff':t.team?'#ffe08a':'#ff9a90'});// (telling: orange, dulled: grey, magic: violet)
  if(BLOOD.on&&!undead(t))for(let i=0;i<2;i++)vfx({k:'blood',x:t.x,y:t.y,z:7,vx:(Math.random()-.5)*60,vy:(Math.random()-.5)*30,vz:20+Math.random()*50,life:1.2});// (gfx/vfx.js; none with Blood off)
  if(t.hp<=0){
    if(wasHp>0&&B.opts.sandbox&&BattleLab.active)BattleLab.kill(t,source);
    t.hp=0;const cp={x:t.x,y:t.y,team:t.team,face:t.face,hero:t.hero,wait:true};B.corpses.push(cp);vfxDeath(t,cp);if(wasHp>0)moraleDeath(t,source);// (it falls first, then lies: vfx.js)
    if(t.team===1){B.kills++;B.slain.push(t.type);if(wasHp>0&&source&&source.grp){const K=B.grpKills||(B.grpKills={});K[source.grp]=(K[source.grp]||0)+1}}// (and by whose group: the unit of the battle, resolution.js)
    else if(t.hero){B.heroDown=true;B.floats.push({x:t.x,y:t.y-22,t:'You are down!',life:1.6,c:'#fff'});log('You are knocked down. Your troops fight on.','bad')}
    else if(t.comp){const c=compInit(t.type);if(c)c.hurt=Math.max(c.hurt||0,G.day+2);log(COMPS[t.type].n+' is wounded and drops out of the fight: out for 2 days.','bad')}// (never killed)
    else if(!t.lord)B.lost[t.type]=(B.lost[t.type]||0)+1;
    if(t.lord&&!t.leader){if(t.sourceArmy===t.lord&&t.sourceGroupId)partyRoster(t.sourceArmy).remove(t.type,1,t.sourceGroupId);else t.lord.remove(t.type,1)}
    else if(t.team===1&&t.sourceArmy&&t.sourceGroupId&&!t.leader){partyRoster(t.sourceArmy).remove(t.type,1,t.sourceGroupId);B.primaryLossesApplied=true}
    if(t.grp){if(B.sel===t.grp&&!grpUnits(t.grp).length)B.sel='all';setOrderUI()}
    shakeIt(2);
  }
}
function shakeIt(n){G.shake=Math.max(G.shake,n)}
// one of your troops (not your hero, a companion or a lord's man) earns XP for a blow: the damage it dealt, and a kill by the foe's tier
function earnXp(u,t,was){if(!u||u.team!==0||u.hero||u.comp||u.lord||u.leader||!t||t.team===0)return;const dealt=Math.max(0,was-Math.max(0,t.hp));
  u.xp=(u.xp||0)+dealt*TROOP_XP.dmg+(was>0&&t.hp<=0?TROOP_XP.kill*(ST[t.type]&&ST[t.type].tier||1):0)}
function hit(att,t,dm,dt){
  const m=matchup(att.s,t.s,dt);dm*=m*(att.buffT>0?1.3:1)*groundHit(att,t);/* (from high ground harder, from marsh softer: terrain.js) */if(att.comp)compTrain(att.type,compMeleeSk(att.type),2);
  if(t.hero&&B.blocking){const a=Math.atan2(att.y-t.y,att.x-t.x),df=angGap(a,B.aim);if(df<1.25&&guard(dm)){dm*=blockMul();fx(t.x+Math.cos(B.aim)*10,t.y-6,'#cfe0ff',5);B.floats.push({x:t.x,y:t.y-14,t:'Block',life:.5,c:'#9fc0ff'})}}
  const was=t.hp;applyDmg(t,dm*formTaken(t,att)*flankMul(t,att),m,dt||dtOf(att.s),att,false);vfxHit(att,t,dm);earnXp(att,t,was);// (its formation: formations.js; the side it is hit on: morale.js)
  if(sfxOn())blowSound(att,t,false,isMagical(dt||dtOf(att.s)));
}
/* the sound of a blow or a missile landing on t from src (a unit, or a missile's point): on the front of a shield a block (the
   test vfxHit splinters by); an arrow or bolt otherwise its strike; steel on mail or plate a clash; magic, a beast's claws, a
   beast struck, the rest: a hit. Only one in SND_EVERY of each kind is played (a counter, never a dice), so a 400-man melee stays
   readable; the cues' own limits (audio.js SFX gap, max) and the voice cap do the rest. battlesound.js bsBlow: once its beds
   run, only blows near the camera are heard alone (the melee bed has the rest), and arrows landing together are a hail */
const SND_EVERY={clash:2,hit:2,block:1,arrowhit:2,ground:3,loose:2},SND_N={};
const sndTurn=k=>(SND_N[k]=(SND_N[k]||0)+1)%SND_EVERY[k]===0;
function blowSound(src,t,arrow,magic){
  const ts=t.s||{},k=magic?'hit':tagsOf(ts).includes('shield')&&sideOf(t,src)==='front'?'block':arrow?'arrowhit':
    ts.beast||ts.big||src.s&&src.s.beast||!/^(mail|plate)$/.test(armorOf(ts))?'hit':'clash';
  if(bsBlow(k,t.x,t.y,arrow&&!magic)&&sndTurn(k))sfxAt(k,t.x,t.y)}
// a quiver per battle: at least 32 for every shooter (bows and slings 40, crossbows 32); casters and beasts never run out.
// When it is empty the unit draws a blade: melee reach, weaker blows.
const AMMO={min:32,bow:40,xbow:32,sling:40};// (every shooter starts with at least AMMO.min: bows and slings 40, crossbows 32)
const quiverOf=s=>s.magic||s.beast||s.big?Infinity:Math.max(AMMO.min,s.ammo||(s.flat?AMMO.xbow:s.bow?AMMO.bow:AMMO.sling));
/* how true a shot flies, for every shooter alike: a spread round the aim (a, radians, from side to side) and, for an arrow's arc,
   how far long or short it may fall (d, a share). By the weapon (a bow, a crossbow or sling or bolt of magic: flat), then halved
   for an elf; a soldier steadier by his kind's tier, a character by their skill (Archery, Spellcraft for magic) and their
   weapon's quality (its tier); worse tired, worse again spent; a bow loosed before full draw, worse by how far short */
const AIM={bow:[.08,.06],flat:[.2,0],elf:.5,tier:.08,skill:.06,gear:.06,floor:.3,tired:1.25,spent:1.5,draw:.4};
const shotSkill=u=>{const k=u.s.magic?'spell':'archery';return u.hero?skill(k):u.unit&&u.unit.isChar?u.unit.skill(k):0};
const weaponTier=u=>{const id=u.hero?P.gear.weapon:u.unit&&u.unit.isChar&&u.unit.o.gear&&u.unit.o.gear.weapon,I=id&&ITEMS[id];return I&&I.tier||0};
function aimErr(u,p){
  const s=u.s,base=s.magic||s.flat||u.hero&&heroShot().flat?AIM.flat:AIM.bow;let m=(u.hero?P.race:s.race)==='elf'?AIM.elf:1;
  if(u.hero||u.leader||u.comp)m*=Math.max(AIM.floor,1-AIM.skill*shotSkill(u))*Math.max(AIM.floor,1-AIM.gear*weaponTier(u));else m*=Math.max(AIM.floor,1-AIM.tier*((s.tier||1)-1));
  const T=tiredMul(u);m*=T.dmg<.8?AIM.spent:T.dmg<1?AIM.tired:1;if(p!=null)m*=1+AIM.draw*(1-p);
  return{a:base[0]*m,d:base[1]*m}}
const spreadOf=E=>(Math.random()-.5)*E.a;
function outOfAmmo(u){u.s={...u.s,range:0,reach:Math.max(u.s.reach||0,10),dmg:u.s.dmg*.6};u.empty=true;B.floats.push({x:u.x,y:u.y-20,t:'Out of ammo',life:.7,c:'#9aa3ad'})}
function attack(u,t){
  const s=u.s;u.cd=s.cd*(.9+Math.random()*.2);u.atkAt=B.t;if(B.terrain)sightStruck(u,t);// (a blow or a shot loosed gives him away: terrain.js)
  if(s.range){const flat=s.magic||s.flat,E=aimErr(u);fireBolt(u,Math.atan2(t.y-(flat?u.y-6:u.y),t.x-u.x)+spreadOf(E),s.dmg*(.85+Math.random()*.3)*(u.buffT>0?1.3:1)*arrowMul(u),arrowSrc(u,s),Math.hypot(t.x-u.x,t.y-u.y),{sc:E.d});if(!s.magic&&sfxOn())bsLoose(u)}// (its twang, or with its group's a volley: battlesound.js; fire arrows: unitabilities.js)
  else{let dm=s.dmg*(.8+Math.random()*.4)*chargeMul(u,t)*tiredMul(u).dmg;fatigueBlow(u);// (a charge: by how far it ran, braced spears blunt it, morale.js; tired, softer: fatigue.js)
    hit(u,t,dm);meleeFollow(u,t,dm)}
  if(s.range&&!u.hero){if(u.ammo==null)u.ammo=quiverOf(s);if(--u.ammo<=0)outOfAmmo(u)}
}
// a troop's melee blow: the look of its weapon, and what it does beyond the one it hits
function meleeFollow(u,t,dm){
  const s=u.s,a=Math.atan2(t.y-u.y,t.x-u.x),R=(s.reach||11)+2;u.face=Math.cos(a)>=0?1:-1;u.atkN=(u.atkN||0)+1;
  if(s.beast){B.slashes.push({kind:'claw',x:t.x,y:t.y-8,a,life:.18,max:.18,col:'255,255,255',w:1});return}
  const style=troopStyle(u);u.atkStyle=style;
  if(style==='thrust'){B.slashes.push({kind:'thrust',x:u.x,y:u.y-6,a,life:.14,max:.14,r:R+4,w:1,col:'230,236,255',wid:3});
    const b=(spatialOn()?SG.near(u.x,u.y,R+14+31,t.team,false):B.units).find(o=>o!==t&&o.hp>0&&o.team===t.team&&inShape(u.x,u.y,a,R+14,{shape:'thrust',wid:5},o));if(b)hit(u,b,dm*.5)}
  else{B.slashes.push({kind:style==='overhead'?'slam':'arc',x:u.x,y:u.y-6,a,life:.14,max:.14,arc:.8,r:R,w:1,dir:u.atkN%2?1:-1,area:7,col:'255,255,255'});
    if(s.big||style==='overhead'){const b=(spatialOn()?SG.near(t.x,t.y,13,t.team,false):B.units).find(o=>o!==t&&o.hp>0&&o.team===t.team&&Math.hypot(o.x-t.x,o.y-t.y)<12);if(b)hit(u,b,dm*.5)}}
}
// spears thrust; chieftains, trolls and the heaviest hitters come down from above; the rest swing, with now and then an overhead blow
const troopStyle=u=>unitClass(u.s)==='spear'?'thrust':u.type==='chief'||u.s.big||u.s.dmg>=14?'overhead':(u.atkN%3===0?'overhead':'swing');
function breathe(u,t){
  const a=Math.atan2(t.y-u.y,t.x-u.x),ox=u.x+Math.cos(a)*14,oy=u.y-10;u.face=Math.cos(a)>=0?1:-1;u.atkAt=B.t;
  for(const e of spatialOn()?SG.near(u.x,u.y,96,u.team,true):B.units){if(e.hp<=0||e.team===u.team)continue;const ea=Math.atan2(e.y-u.y,e.x-u.x),df=angGap(ea,a);
    if(df<.5&&Math.hypot(e.x-u.x,e.y-u.y)<95)hit(u,e,14*(.8+Math.random()*.4)*(tagsOf(e.s).includes('ward')?.6:1))}
  for(let i=0;i<34;i++){const j=a+(Math.random()-.5)*.9,v=70+Math.random()*90;B.parts.push({x:ox,y:oy,vx:Math.cos(j)*v,vy:Math.sin(j)*v-20,life:.5,c:Math.random()<.5?'#ff7a30':'#ffd24a'})}
  B.floats.push({x:u.x,y:u.y-30,t:'FIRE',life:.6,c:'#ff9a50'});shakeIt(3);
}
const BLADE={reach:12,dmg:.6,cd:.8};
function bladeBlow(u,e){const s=u.s,dm=meleeDmgOf(s)*(.8+Math.random()*.4)*tiredMul(u).dmg;u.cd=s.cd*BLADE.cd*(.9+Math.random()*.2);u.atkAt=B.t;u.atkStyle='swing';fatigueBlow(u);u.face=e.x>=u.x?1:-1;hit(u,e,dm);meleeFollow(u,e,dm)}
