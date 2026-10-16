'use strict';
/* ---------- battle ---------- */
// your groups: your hero, infantry, archers (bows, crossbows, slings, javelins), mages (casters: their own group, placed apart from
// the archers, their reach being so much shorter) and cavalry
const GRPS=['hero','inf','arc','mag','cav'],GN={hero:'Hero',inf:'Infantry',arc:'Archers',mag:'Mages',cav:'Cavalry',all:'All troops'};
// the manual control of your hero (WASD, Space, F, B, skill slots) is set aside for now: you command, your hero fights on their
// own (RTS command: commands.js). true brings it back here (its keys and buttons are commented out in input.js and Ashmark.html)
let MANUAL_HERO=false;
const grpOf=s=>s.range?(s.magic?'mag':'arc'):s.charge?'cav':'inf';
const grpUnits=g=>B.units.filter(u=>u.grp===g&&u.hp>0);
/* how a group of yours moves and fights, besides its order (hold, charge, advance; withdraw):
   walk (at its slowest member's pace, keeping formation; no running charge), firm (holds its ground: strikes only what
   comes into reach, never steps out of line), fire (archers shoot at will; off, only at the enemy you set them on),
   skirmish (archers step back from enemies coming at them), queue (waypoints, Shift + right-click, taken in turn) */
// (a battle over: this long before its summary, the field left to settle)
const END_WAIT=2;
const GRP_FLAGS={walk:true,firm:false,cease:false,skirmish:false,melee:false};// (melee mode: off until you (or the AI commander) turn it on)// (your groups walk unless told to run: battle.js walking)
const MARCH={reached:10,skirmish:44,edge:40,walk:.55};
// walking: a group set to walk, unless this order is a run (g.run: a double right-click, a charge); a walk keeps the slowest's
// pace at MARCH.walk of it, and builds no charge
const walking=g=>!!(g&&g.walk&&!g.run);
// Setup, player commands and resolution live in their own files; this file owns combat simulation.
const nearest=u=>{let best=null,bd=1e9;for(const e of B.units){if(e.hp<=0||e.team===u.team)continue;const d=((e.x-u.x)**2+(e.y-u.y)**2)*(e.rout?9:1);if(d<bd){bd=d;best=e}}return best};
function fx(x,y,c,n){for(let i=0;i<n;i++)B.parts.push({x,y,vx:(Math.random()-.5)*70,vy:(Math.random()-.5)*70,life:.35,c})}
function applyDmg(t,amt,m,dt){
  if((t.hero?B.hx&&B.hx.inv:t.ch&&t.ch.inv)>0){B.floats.push({x:t.x,y:t.y-16,t:'Dodge',life:.4,c:'#cfe0ff'});return}// (rolling, leaping, dashing: unhurt)
  if(t.hero)amt*=1-tm('dr');
  if(t.wardT>0)amt*=.75;
  if(t.comp&&t.s.block)amt*=1-t.s.block;// a companion's shield and armour
  if(!t.hero&&t.s.dr)amt*=1-t.s.dr;// (a character's tree: less damage taken)
  amt=Math.max(1,Math.round(amt));t.hp-=amt;B.lastHit=B.t;t.flash=.1;t.hitAt=B.t;moraleHurt(t,amt);
  B.floats.push({x:t.x,y:t.y-14,t:String(amt),life:.7,c:m>=1.25?'#ffb04a':m&&m<=.8?'#9aa3ad':isMagical(dt)?'#c8a0ff':t.team?'#ffe08a':'#ff9a90'});// (telling: orange, dulled: grey, magic: violet)
  if(BLOOD.on&&!undead(t))for(let i=0;i<2;i++)vfx({k:'blood',x:t.x,y:t.y,z:7,vx:(Math.random()-.5)*60,vy:(Math.random()-.5)*30,vz:20+Math.random()*50,life:1.2});// (gfx/vfx.js; none with Blood off)
  if(t.hp<=0){
    t.hp=0;const cp={x:t.x,y:t.y,team:t.team,face:t.face,hero:t.hero,wait:true};B.corpses.push(cp);vfxDeath(t,cp);moraleDeath(t);// (it falls first, then lies: vfx.js)
    if(t.team===1){B.kills++;B.slain.push(t.type)}
    else if(t.hero){B.heroDown=true;B.floats.push({x:t.x,y:t.y-22,t:'You are down!',life:1.6,c:'#fff'});log('You are knocked down. Your troops fight on.','bad')}
    else if(t.comp){const c=compInit(t.type);if(c)c.hurt=Math.max(c.hurt||0,G.day+2);log(COMPS[t.type].n+' is wounded and drops out of the fight: out for 2 days.','bad')}// (never killed)
    else if(!t.lord)B.lost[t.type]=(B.lost[t.type]||0)+1;
    if(t.lord&&!t.leader){partyRemove(t.lord,t.type,1)}
    if(t.grp){if(B.sel===t.grp&&!grpUnits(t.grp).length)B.sel='all';setOrderUI()}
    shakeIt(2);
  }
}
function shakeIt(n){G.shake=Math.max(G.shake,n)}
// one of your troops (not your hero, a companion or a lord's man) earns XP for a blow: the damage it dealt, and a kill by the foe's tier
function earnXp(u,t,was){if(!u||u.team!==0||u.hero||u.comp||u.lord||u.leader||!t||t.team===0)return;const dealt=Math.max(0,was-Math.max(0,t.hp));
  u.xp=(u.xp||0)+dealt*TROOP_XP.dmg+(was>0&&t.hp<=0?TROOP_XP.kill*(ST[t.type]&&ST[t.type].tier||1):0)}
function hit(att,t,dm,dt){
  const m=matchup(att.s,t.s,dt);dm*=m*(att.buffT>0?1.3:1);if(att.comp)compTrain(att.type,compMeleeSk(att.type),2);
  if(t.hero&&B.blocking){const a=Math.atan2(att.y-t.y,att.x-t.x),df=angGap(a,B.aim);if(df<1.25&&guard(dm)){dm*=blockMul();fx(t.x+Math.cos(B.aim)*10,t.y-6,'#cfe0ff',5);B.floats.push({x:t.x,y:t.y-14,t:'Block',life:.5,c:'#9fc0ff'})}}
  const was=t.hp;applyDmg(t,dm*formTaken(t,att)*flankMul(t,att),m,dt||dtOf(att.s));vfxHit(att,t,dm);earnXp(att,t,was);// (its formation: formations.js; the side it is hit on: morale.js)
}
// arrows and bolts: src is the shooter's stats (its class, tags and bolt colour)
// Bow arrows (and thrown spears, sling stones, webs) fly in an arc: launched at a spot dist away, they rise, peak halfway and come
// down there. The arc grows with the square of the distance: point-blank shots fly almost flat, long ones lob high.
// An arrow hits whatever it passes while it is low (under 9 high), so a lob sails over the middle of the field.
// Crossbow bolts (flat) and magic bolts fly straight.
// Every arcing arrow is a real throw: height z, rising speed vz and gravity g. An aimed shot picks vz and g so it lands dist away
// (opts.speed sets how fast it travels); a manual bow shot (opts.v, opts.ang) is launched at a speed and an angle and lands where physics says.
const ARC_SPEED=170,BOLT_SPEED=320,MAGIC_SPEED=190,ARROW_G=260;// (an arrow at 400 lands in about a second)
function fireBolt(u,a,dmg,src,dist,opts){
  const mag=!!src.magic,base={by:u,team:u.team,dmg,a,src,elf:src.race==='elf',web:src.ability==='web',tk:0};
  if(!mag&&!src.flat){
    if(opts&&opts.v){const gv=opts.v*Math.cos(opts.ang);B.arrows.push({...base,x:u.x,y:u.y,vx:Math.cos(a)*gv,vy:Math.sin(a)*gv,z:0,vz:opts.v*Math.sin(opts.ang),g:ARROW_G,t:0,life:9,arc:true});return}
    const d0=clamp(dist||120,24,640),sp=opts&&opts.speed||ARC_SPEED*(.8+d0/250),sc=opts&&opts.sc!=null?opts.sc:src.race==='elf'?.03:.06,d=d0*(opts&&opts.exact?1:1-sc+Math.random()*sc*2),T=d/sp,H=Math.min(64,d*d/700);
    B.arrows.push({...base,x:u.x,y:u.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,z:0,vz:4*H/T,g:8*H/T/T,T,H,t:0,life:9,arc:true});return}
  const v=mag?MAGIC_SPEED:BOLT_SPEED;
  B.arrows.push({...base,x:u.x,y:u.y-6,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:mag?1.4:1.1,magic:mag,col:src.bolt||'#c58af0'});
}
const arcZ=a=>a.z||0;
// one step of an arcing arrow: trees catch it only low, it hits on the way down, a miss sticks in the ground
function arcStep(a,dt){
  a.t+=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.z+=a.vz*dt;a.vz-=a.g*dt;const z=Math.max(0,a.z);
  if(z<10&&!a.elf)for(let k=0;k<B.obs.length;k++){const o=B.obs[k];if(o.kind==='tree'&&!(a.tk&1<<k)&&Math.hypot(a.x-o.x,a.y-o.y)<o.r+2){a.tk|=1<<k;if(Math.random()<.35){a.life=0;fx(a.x,a.y-z-4,'#8b5a2b',2);return}}}
  if(z<9)for(const e of B.units){if(e.hp<=0||e.team===a.team)continue;if(Math.abs(e.x-a.x)<(e.s.big?14:6)&&Math.abs(e.y-a.y)<(e.s.big?10:5)){
    const mu=matchup(a.src||{},e.s);let dm=a.dmg*mu;
    if(e.hero&&B.blocking){const df=angGap(a.a+Math.PI,B.aim);if(df<1.25&&guard(dm)){dm*=blockMul();fx(a.x,a.y-6,'#cfe0ff',4)}}
    if(a.web){e.slow=2;B.floats.push({x:e.x,y:e.y-20,t:'Webbed',life:.6,c:'#e4e0cf'})}if(a.src&&a.src.heroShot)train('archery',1.5);{const O={x:a.x-a.vx,y:a.y-a.vy,arrow:!a.magic},was=e.hp;e.shotAt=B.t;applyDmg(e,dm*formTaken(e,O)*flankMul(e,O),mu,dtOf(a.src));vfxHit(O,e,dm,{arrow:!a.magic,magic:a.magic,col:a.col||(a.src&&a.src.bolt)});if(!a.magic)stickArrow(e,a);earnXp(a.by,e,was)}a.life=0;return}}
  if(a.z<=0&&a.t>.03){a.life=0;B.parts.push({x:a.x,y:a.y-1,vx:0,vy:0,life:5,c:'#c9b48a',stuck:a.vx>=0?1:-1});vfx({k:'dust',x:a.x,y:a.y,vx:0,vy:-3,r:1,grow:5,life:.3,col:dustCol()})}// (it stays where it lands a while)
}
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
  const s=u.s;u.cd=s.cd*(.9+Math.random()*.2);u.atkAt=B.t;
  if(s.range){const flat=s.magic||s.flat,E=aimErr(u);fireBolt(u,Math.atan2(t.y-(flat?u.y-6:u.y),t.x-u.x)+spreadOf(E),s.dmg*(.85+Math.random()*.3)*(u.buffT>0?1.3:1),s,Math.hypot(t.x-u.x,t.y-u.y),{sc:E.d})}
  else{let dm=s.dmg*(.8+Math.random()*.4)*chargeMul(u,t)*tiredMul(u).dmg;fatigueBlow(u);// (a charge: by how far it ran, morale.js; tired, softer: fatigue.js)
    hit(u,t,dm);meleeFollow(u,t,dm)}
  if(s.range&&!u.hero){if(u.ammo==null)u.ammo=quiverOf(s);if(--u.ammo<=0)outOfAmmo(u)}
}
// a troop's melee blow: the look of its weapon, and what it does beyond the one it hits
function meleeFollow(u,t,dm){
  const s=u.s,a=Math.atan2(t.y-u.y,t.x-u.x),R=(s.reach||11)+2;u.face=Math.cos(a)>=0?1:-1;u.atkN=(u.atkN||0)+1;
  if(s.beast){B.slashes.push({kind:'claw',x:t.x,y:t.y-8,a,life:.18,max:.18,col:'255,255,255',w:1});return}
  const style=troopStyle(u);u.atkStyle=style;
  if(style==='thrust'){B.slashes.push({kind:'thrust',x:u.x,y:u.y-6,a,life:.14,max:.14,r:R+4,w:1,col:'230,236,255',wid:3});
    const b=B.units.find(o=>o!==t&&o.hp>0&&o.team===t.team&&inShape(u.x,u.y,a,R+14,{shape:'thrust',wid:5},o));if(b)hit(u,b,dm*.5)}
  else{B.slashes.push({kind:style==='overhead'?'slam':'arc',x:u.x,y:u.y-6,a,life:.14,max:.14,arc:.8,r:R,w:1,dir:u.atkN%2?1:-1,area:7,col:'255,255,255'});
    if(s.big||style==='overhead'){const b=B.units.find(o=>o!==t&&o.hp>0&&o.team===t.team&&Math.hypot(o.x-t.x,o.y-t.y)<12);if(b)hit(u,b,dm*.5)}}
}
// spears thrust; chieftains, trolls and the heaviest hitters come down from above; the rest swing, with now and then an overhead blow
const troopStyle=u=>unitClass(u.s)==='spear'?'thrust':u.type==='chief'||u.s.big||u.s.dmg>=14?'overhead':(u.atkN%3===0?'overhead':'swing');
function breathe(u,t){
  const a=Math.atan2(t.y-u.y,t.x-u.x),ox=u.x+Math.cos(a)*14,oy=u.y-10;u.face=Math.cos(a)>=0?1:-1;u.atkAt=B.t;
  for(const e of B.units){if(e.hp<=0||e.team===u.team)continue;const ea=Math.atan2(e.y-u.y,e.x-u.x),df=angGap(ea,a);
    if(df<.5&&Math.hypot(e.x-u.x,e.y-u.y)<95)hit(u,e,14*(.8+Math.random()*.4)*(tagsOf(e.s).includes('ward')?.6:1))}
  for(let i=0;i<34;i++){const j=a+(Math.random()-.5)*.9,v=70+Math.random()*90;B.parts.push({x:ox,y:oy,vx:Math.cos(j)*v,vy:Math.sin(j)*v-20,life:.5,c:Math.random()<.5?'#ff7a30':'#ffd24a'})}
  B.floats.push({x:u.x,y:u.y-30,t:'FIRE',life:.6,c:'#ff9a50'});shakeIt(3);
}
function monsterAbility(u,dt){
  const ab=u.s.ability;
  if(ab==='regen')u.hp=Math.min(u.max,u.hp+4*dt);
  else if(ab==='pounce'){u.ab=(u.ab??1.5)-dt;if(u.ab>0)return;const t=nearest(u);if(!t)return;const d=Math.hypot(t.x-u.x,t.y-u.y);if(d<24||d>110)return;
    const a=Math.atan2(t.y-u.y,t.x-u.x);fx(u.x,u.y-6,'#e8d8a0',6);u.x=t.x-Math.cos(a)*10;u.y=t.y-Math.sin(a)*10;u.face=Math.cos(a)>=0?1:-1;
    hit(u,t,u.s.dmg*1.6);B.floats.push({x:u.x,y:u.y-20,t:'POUNCE',life:.6,c:'#ffb070'});u.ab=4.5}
}
// strike: how it hits (a character: combos, the bow and casts, commander.js charStrike); else a troop's attack
/* every shooter's shot, as in Total War: they shoot only in a forward arc (SHOOT.arc), where their group faces; turning it is
   yours or their commander's call (a move, a dragged line, the commander's facing: commander.js), never theirs; mages (their bolt; their spells have their own shapes), riders and units marked 'circle' shoot all round. The moment a foe is in range and in the arc (and
   they are not told to cease fire), they draw (their aim time), loose, and reload (their reload time); the two make up their
   attack time (s.cd), split by their weapon: a bow draws and reloads alike, a crossbow aims fast and spans slowly, a sling
   whirls, a staff gathers. s.aim and s.reload on a kind set them outright. A draw held with no foe to loose at is let down */
const SHOOT={arc:Math.PI/2,turn:3.2,hold:1.5,kinds:{bow:[.5,.5],xbow:[.25,.75],sling:[.45,.55],throw:[.4,.6],magic:[.55,.45]}};
function shotKind(u){
  if(u.s.magic)return 'magic';if(u.hero)return heroShot().flat?'xbow':'bow';if(ST[u.type]&&ST[u.type].beast)return 'throw';
  const w=unitLook(u).weapon||'';return w==='xbow'?'xbow':w==='sling'?'sling':w==='javelin'?'throw':u.s.flat?'xbow':'bow'}
function shotTimes(u){const f=SHOOT.kinds[shotKind(u)],tot=u.hero?heroShot().cd*(u.s.cd/.45):u.s.cd;return{aim:u.s.aim??tot*f[0],reload:u.s.reload??tot*f[1]}}
// (all round: a mage's bolt (their spells keep their own shapes: battle/abilities.js), a rider, a unit marked 'circle')
const roundFire=u=>!!(u.s.magic||u.s.mounted||tagsOf(u.s).includes('circle'));
// (his arc: where his group faces (its formation's front: your orders turn it, or its commander's), the way he walks while he
// walks; he never turns it himself, and shoots only what is in it. Alone, outside any group, where he last faced (u.aimA))
const bodyAim=u=>(u.face||(u.team?-1:1))>0?0:Math.PI;
const arcAim=u=>{if(u.walkA!=null)return u.walkA;const g=u.grp&&B.groups[u.grp];if(g&&g.face!=null)return g.face;return u.aimA!=null?u.aimA:bodyAim(u)};
const inArc=(u,t)=>roundFire(u)||angGap(Math.atan2(t.y-u.y,t.x-u.x),arcAim(u))<=SHOOT.arc/2+.01;
// a moment of a shooter: turn (toward a foe they may shoot, else the way they go, else their formation's front), then draw, loose, reload
function shotStep(u,g,t,can,mv,dx,dy,mx,my,dt,strike){
  // (walking, his arc is the way he walks; standing, his group's front: he turns nothing himself. His body faces the side his arc
  // does; all round (a mage, a rider), he faces whom he shoots)
  u.walkA=mv?Math.atan2(my,mx):null;
  if(roundFire(u)){if(can&&!mv&&Math.abs(dx)>3)u.face=dx>=0?1:-1}else if(!mv){const c=Math.cos(arcAim(u));if(Math.abs(c)>.2)u.face=c>=0?1:-1}
  // (on the move, only those who shoot on the move draw: the rest let a draw down and stand to shoot)
  const still=!mv&&!u.skirm||onTheMove(u.s);/* (his group backing off counts as moving) */if(u.shot&&!still)u.shot=null;
  if(u.shot){u.shot.t+=dt*(u.slow>0?.5:1);
    if(u.shot.t>=u.shot.aim){if(can&&inArc(u,t)){u.shot=null;(strike||attack)(u,t);u.atkAt=B.t;u.atkStyle='swing';u.cd=shotTimes(u).reload*(.9+Math.random()*.2)}
      else if(u.shot.t>u.shot.aim+SHOOT.hold)u.shot=null}
    return}
  if(can&&u.cd<=0&&inArc(u,t)&&still)u.shot={t:0,aim:shotTimes(u).aim}}
// a shooter's own target, by his own range and arc, not his group's: of the foes he can reach, the one his captain points out
// (g.prefer) if he can reach him, else the easiest kill of those already in his arc (no turn), else of the rest (he turns); but
// first of all one he can finish with a single shot;
// none in reach, the nearest (to face, or to close on). Routers last
/* a shooter close pressed. Skirmish (a group's E) has them keep their distance: the whole group backs away together (battlecontrol.js step),
   and on foot they do not shoot while backing (only those who shoot on the move loose while they go). The
   distance is each shooter's own, by his reach: a bowman keeps a foe further off than a slinger. Blades (a group's X, on unless
   turned off): one who reaches them (within BLADE.reach) they fight hand to hand with a sidearm (BLADE.dmg of their shot,
   BLADE.cd of their attack time), and shoot again once he is gone; off, they keep shooting, point blank */
const SKIRM={keep:.6,until:.85,max:140,burst:1.5,stand:1.2,outpaced:1.15,room:24};// (outpaced: a foe this much faster is not run from; room: the field's edge kept behind them)// (burst: the longest it backs off at a time; stand: then it stands that long to loose a volley)// (max: the farthest a skirmisher starts backing off, a long bow too)
// (shooting on the move: a trait, 'mobile' (riders' bows, rangers), and every elf with a bow; the rest stand to shoot)
const onTheMove=s=>!!s&&!s.magic&&(tagsOf(s).includes('mobile')||s.race==='elf');
const BLADE={reach:12,dmg:.6,cd:.8};
const meleeFoe=(u,r)=>{let best=null,bd=r;for(const e of B.units){if(e.hp<=0||e.team===u.team||e.rout||e.s.range)continue;const d=Math.hypot(e.x-u.x,e.y-u.y)-(e.s.big?12:0);if(d<bd){bd=d;best=e}}return best};
function bladeBlow(u,e){const s=u.s,dm=meleeDmgOf(s)*(.8+Math.random()*.4)*tiredMul(u).dmg;u.cd=s.cd*BLADE.cd*(.9+Math.random()*.2);u.atkAt=B.t;u.atkStyle='swing';fatigueBlow(u);u.face=e.x>=u.x?1:-1;hit(u,e,dm);meleeFollow(u,e,dm)}
/* whom a soldier goes for by himself (fire at will): the nearest foe in his reach, one already in his arc first (he turns for
   none he need not); out of reach, the nearest, to face or close on. Routers last. Nothing cleverer: whom to finish, whom to
   focus, when to hold fire are his commander's calls (commander.js) or yours: an attack order, cease fire */
// (his blows to fell a foe, by his damage against him, armour and kind counted: matchups.js; for his commander's reckoning)
const blowsToFell=(u,e)=>Math.ceil(e.hp/Math.max(.5,u.s.dmg*matchup(u.s,e.s)));
const meleeTarget=u=>nearest(u);
function shooterTarget(u){
  const R=u.s.range,d=e=>Math.hypot(e.x-u.x,e.y-u.y),inR=B.units.filter(e=>e.hp>0&&e.team!==u.team&&!e.rout&&d(e)<=R);if(!inR.length)return nearest(u);
  const fr=inR.filter(e=>inArc(u,e)),L=fr.length?fr:inR;return L.reduce((a,e)=>d(e)<d(a)?e:a)}
function aiUnit(u,dt,strike){
  if(u.stun>0){u.stun-=dt;u.spdNow=0;u.shot=null;return}
  if(u.rout){u.shot=null;return routStep(u,dt)}// (broken: it runs for its edge, morale.js)
  if(withdrawing(u)){u.shot=null;return withdrawStep(u,dt)}// (withdrawn: it leaves the field, morale.js)
  u.inSlot=false;
  // its target: the enemy its group was set on (right-click), else the nearest
  // (Melee Mode, his group's: a shooter puts his bow away and is a fighter: his melee damage, a sword's reach; he shoots nothing)
  const g=u.grp&&B.groups[u.grp],mm=!!(u.s.range&&!u.empty&&g&&g.melee),s=mm?(u.mmS&&u.mmS.base===u.s?u.mmS:(u.mmS={...u.s,base:u.s,range:0,reach:BLADE.reach,dmg:meleeDmgOf(u.s)})):u.s;u.rt-=dt;// (his group lets a fallen foe go: battlecontrol.js step)
  // (set on a target, it still turns on an enemy right on top of it: it does not stand and take the blows)
  if(g&&g.tgt){u.tgt=g.tgt;if(u.rt<=0){u.rt=.4;const n=nearest(u);u.near=n&&n!==g.tgt&&Math.hypot(n.x-u.x,n.y-u.y)<(s.range?30:(s.reach||11)+8)?n:null}if(u.near&&u.near.hp>0&&!u.near.rout)u.tgt=u.near}
  else if(u.rt<=0||!u.tgt||u.tgt.hp<=0){u.tgt=s.range?shooterTarget(u):meleeTarget(u);u.rt=.4}
  crowdTarget(u,dt);
  const t=u.tgt;u.spdNow=0;
  const order=g?(g.tgt?'charge':g.order):'charge';
  if(!t&&!(g&&order!=='charge'))return;
  const dx=t?t.x-u.x:0,dy=t?t.y-u.y:0,d=Math.hypot(dx,dy)||1,de=t?d-(t.s.big&&!s.range?12:0):1e9;
  const reach=s.range?s.range:s.reach+2;let mv=false,mx=0,my=0,chase=false,back=false;
  const reloc=relocating(u,g);
  // (his group moves him: its place for him, backing off together when it skirmishes, stopping together to shoot (battlecontrol.js step);
  // he himself only picks his foe, shoots, and fights with his blades whoever reaches him)
  const blade=null;
  u.skirm=!!(g&&g.backing);u.inMelee=mm;if(mm)u.shot=null;// (melee mode: his bow down (a draw let down), a sword out: render.js)
  if(g&&order!=='charge'){
    // keep a slot in the group's formation; melee breaks off only for enemies that come close to it (never, holding its
    // ground or withdrawing: it strikes only what is in reach)
    const sx=clamp(g.ax+u.sx,8,BW-8),sy=clamp(g.ay+u.sy,fieldTop(),fieldBot());
    const engage=order==='withdraw'||g.firm||FORMS[g.form]&&FORMS[g.form].firm?0:28;
    if(reloc){const px=sx-u.x,py=sy-u.y,pd=Math.hypot(px,py);if(u.relocFor!==g.mvId){u.relocFor=g.mvId;u.relocT=0}u.relocT+=dt;
      if(pd>RELOCATE.near&&u.relocT<RELOCATE.max){mv=true;mx=px/pd;my=py/pd}else{u.mvId=g.mvId;u.relocT=0;u.inSlot=true}}
    else if(t&&!s.range&&de<=reach){}
    else if(t&&!s.range&&engage&&Math.hypot(t.x-sx,t.y-sy)<engage){mv=true;mx=dx/d;my=dy/d;chase=true}
    else if(blade){}// (a foe on them, blades out: they stand and fight)
    else if(s.range&&t&&de<=reach&&!onTheMove(s)&&!g.backing&&!(g.cease&&!g.tgt)){}// (a foe in reach: they keep their ground and shoot, not step to their exact place: attacking first)
    else{const px=sx-u.x,py=sy-u.y,pd=Math.hypot(px,py);const going=g.going;// (its place on the move: battlecontrol.js step)
      if(pd>(u.slotted&&!going?7:2)){mv=true;mx=px/pd;my=py/pd;u.slotted=false}else{u.inSlot=true;u.slotted=true}}// (in its slot: it faces the formation's way, and stays till pushed clearly out)
  }else{
    if(s.range){if(blade){}else if(d>s.range||!u.inRng&&d>s.range*.97){mv=true;mx=dx/d;my=dy/d;u.inRng=false}else{u.inRng=true;if(d<28){mv=true;mx=-dx/d;my=-dy/d;back=true}}}
    else if(de>reach){mv=true;mx=dx/d;my=dy/d}
    chase=true;
  }
  // walking, they keep to the slowest one's pace (and keep their formation); running, or fighting, each goes as fast as it can
  const tm=tiredMul(u),wk=(walking(g)||staOf(u)<FATIGUE.runMin)&&order!=='withdraw';/* (no breath left: he walks, whatever he is told) */let spd=(wk?Math.min(s.spd,g&&g.pace||s.spd)*MARCH.walk:s.spd)*tm.spd;// (tired: slower, fatigue.js)
 if(g&&(!chase||g.form==='wall'))spd*=formPace(g);// (a column marches faster, a shield wall is slow)
  // (stuck: trying to move but going nowhere, against a rock or the field's edge, it steps aside to get round; not in the press
  // round its foe, where it finds another instead: crowdTarget)
  if(mv&&chase&&!back&&!(t&&!s.range&&de<reach+CROWD.slack)){u.stk=(u.stk||0)+dt;if(u.stk>.5){if(u.sx0!=null&&Math.hypot(u.x-u.sx0,u.y-u.sy0)<3){u.side=u.side||(Math.random()<.5?-1:1);u.sideT=.6}u.stk=0;u.sx0=u.x;u.sy0=u.y}
    if(u.sideT>0){u.sideT-=dt;const px=-my*u.side,py=mx*u.side;mx=mx*.3+px;my=my*.3+py;const l=Math.hypot(mx,my)||1;mx/=l;my/=l}}else{u.stk=0;u.sx0=u.x;u.sy0=u.y}
  if(mv&&!wk)footDust(u,dt);// (running: dust from their feet, vfx.js)
  if(mv){const sp=spd*dt*(u.slow>0?.5:1)*(u.buffT>0?1.25:1);u.x+=mx*sp;u.y+=my*sp;u.spdNow=spd;
    // (he faces where he goes, backing off too (no walking backwards): he turns to his foe again when he stops to shoot)
    const faceFoe=false;if(faceFoe){if(Math.abs(dx)>3)u.face=dx>=0?1:-1}else if(Math.abs(mx)>.35)u.face=mx>0?1:-1;u.dir=faceFoe?Math.atan2(dy,dx):Math.atan2(my,mx);u.run=chase&&!back&&!wk?(u.run||0)+sp*tm.run:0}
  else{if(t){if(Math.abs(dx)>3&&!(s.range&&!roundFire(u)))u.face=dx>=0?1:-1;if(!u.inSlot)u.dir=Math.atan2(dy,dx)}u.run=Math.max(0,(u.run||0)-CHARGE.run*dt)}
  // (facing: where it marches or whom it fights; momentum: the run at its target, spent on its first blow)
  fatigueStep(u,dt,mv,wk,chase&&!back&&!!t&&!wk,!!t&&de<=reach+8);
  // shooters: whatever comes into range and their arc, unless told to cease fire (then only the enemy you set them on); a move lets a draw down
  if(s.range){if(reloc||blade)u.shot=null;if(blade){if(u.cd<=0)bladeBlow(u,blade);return}shotStep(u,g,t,!!t&&!reloc&&de<=reach&&!(g&&g.cease&&!g.tgt),mv,dx,dy,mx,my,dt,strike);return}
  if(t&&u.cd<=0&&!reloc&&de<=reach+1){if(mm)bladeBlow(u,t);else(strike||attack)(u,t)}
}
/* RTS command, as in Total War: select your units (click one for its group, drag a box round several; 1-4 a group, 5 all),
   then right-click the ground to send them there in formation, or an enemy to set them on it. Z X C V give the old orders. */
/* the press: when the men round a foe stand too thick, those behind cannot reach him and would stand idle. A melee soldier
   kept out of reach for CROWD.wait turns on another foe close by (within CROWD.look) that has room round him, for CROWD.keep */
const CROWD={wait:.8,keep:2.5,look:90,slack:16,full:3};
function roomyFoe(u,not){let best=null,bs=1e9;const R=(u.s.reach||11)+6;
  for(const e of B.units){if(e.hp<=0||e.team===u.team||e===not||e.rout)continue;const d=Math.hypot(e.x-u.x,e.y-u.y);if(d>CROWD.look)continue;
    let n=0;for(const o of B.units)if(o!==u&&o.hp>0&&o.team===u.team&&Math.hypot(o.x-e.x,o.y-e.y)<R)n++;if(n>=CROWD.full)continue;const sc=d+n*14;if(sc<bs){bs=sc;best=e}}
  return best}
function crowdTarget(u,dt){
  if(u.s.range||u.hero)return;if(u.alt&&(u.alt.hp<=0||u.alt.rout||(u.altT-=dt)<=0))u.alt=null;
  const t=u.tgt;if(t&&t.hp>0&&!u.alt){const R=(u.s.reach||11)+2,d=Math.hypot(t.x-u.x,t.y-u.y)-(t.s.big?12:0);
    if(d>R&&d<R+CROWD.slack){u.blockT=(u.blockT||0)+dt;if(u.blockT>CROWD.wait){u.blockT=0;const a=roomyFoe(u,t);if(a){u.alt=a;u.altT=CROWD.keep}}}else u.blockT=0}
  if(u.alt)u.tgt=u.alt}
/* a move order (the ground right-clicked, a line dragged, the next waypoint): the group relocates. Each of its men breaks off
   the fight he is in and goes to his new place, striking no one on the way (and taking blows in the back if he turns from a
   foe), as in Total War; once there, he fights whatever comes to him. Hold where they stand is no move: they keep fighting.
   RELOCATE.near: close enough to his place; RELOCATE.max: he gives up getting there after this long (a place he cannot reach) */
const RELOCATE={near:6,max:8};
function moveOrder(g){const gr=B.groups[g];if(gr)gr.mvId=(gr.mvId||0)+1}
const relocating=(u,g)=>!!(g&&g.mvId&&u.mvId!==g.mvId&&g.order==='hold'&&!g.tgt);
/* the manual control of your hero, set aside for now (RTS command: commands.js): WASD, Space, F, B, the skill slots (input.js) */
function updateHero(dt){
  const h=B.hero;B.blocking=!!(G.keys.b||B.touchBlock);
  if(!h||h.hp<=0){B.blocking=false;return}
  h.cd-=dt;h.swing=Math.max(0,h.swing-dt);h.spdNow=0;
  if(heroActions(dt))return;
  const k=G.keys;let dx=(k.d||k.arrowright?1:0)-(k.a||k.arrowleft?1:0),dy=(k.s||k.arrowdown?1:0)-(k.w||k.arrowup?1:0);
  if(dx||dy)B.mt=null;else if(B.mt){const ex=B.mt.x-h.x,ey=B.mt.y-h.y,ed=Math.hypot(ex,ey);if(ed<3)B.mt=null;else{dx=ex/ed;dy=ey/ed}}
  const l=Math.hypot(dx,dy);
  const X=heroState(),run=l>0&&G.keys.shift&&!B.blocking&&X.sp>0;if(run){X.sp=Math.max(0,X.sp-STAM.sprint*dt);X.spT=0}
  if(l>0){dx/=l;dy/=l;const sp=h.s.spd*(B.blocking?.55:1)*(B.draw?.6:1)*(run?SPRINT_MUL:1)*(h.slow>0?.5:1)*dt;h.x+=dx*sp;h.y+=dy*sp;h.face=dx>=0?1:-1;h.spdNow=h.s.spd;if(run)train('athl',dt*.4)}
  if(G.mouse.in&&G.mouse.type==='mouse')B.aim=Math.atan2(G.mouse.y-(h.y-6),G.mouse.x-h.x);
  else{const n=nearest(h);if(n)B.aim=Math.atan2(n.y-h.y,n.x-h.x)}
}
// rt is real time; fighting runs on dt, slowed by BATTLE_PACE, while effects keep real time
function updateBattle(rt){
  // the battle's speed: everything runs on its clock; paused, nothing moves but you can still give orders
  if(B.paused||B.deploy)return;rt*=B.speed||1;if(B.slow>0){B.slow-=rt;rt*=VFX.slow}// (a charge's impact: a moment of slow motion, vfx.js)
  const dt=rt*BATTLE_PACE;B.t+=dt;
  // hit-stop: heavy blows freeze the fight for a moment while effects keep moving
  const frozen=B.hx&&B.hx.stop>0;if(frozen)B.hx.stop-=rt;
  // (the battle over: the field runs on, routers running, the dead falling, till the summary comes up: END_WAIT)
  if(!frozen){
    // (RTS command: your hero fights on their own, as every unit does; the manual control is set aside for now)
    if(MANUAL_HERO)updateHero(rt*HERO_PACE);else charAuto(B.hero,rt*HERO_PACE);for(const id in B.groups)B.groups[id].step(dt);command(dt);commandCharacters(dt);// (every group minds itself, then the captains give their orders: battlecontrol.js, commander.js)// (your hero fights on their own, as every character does; the enemy's captain: commander.js)
    for(const u of B.units){if(u.hp<=0)continue;if(u.kx||u.ky){u.x+=u.kx*dt;u.y+=u.ky*dt;if(Math.abs(u.kx)+Math.abs(u.ky)>60&&Math.random()<.4)vfx({k:'dust',x:u.x,y:u.y-1,vx:-u.kx*.1,vy:-u.ky*.05,r:2,grow:8,life:.4,col:'196,180,140'});const k=Math.pow(.004,dt);u.kx*=k;u.ky*=k;if(Math.abs(u.kx)+Math.abs(u.ky)<2)u.kx=u.ky=0}if(u.buffT>0)u.buffT-=dt;if(u.wardT>0)u.wardT-=dt}
    for(const u of B.units){if(u.hp<=0)continue;if(u.slow>0)u.slow-=dt;if(u.hero&&gm('regen'))u.hp=Math.min(u.max,u.hp+gm('regen')*dt)}
    // every unit's moment (lords, chieftains and companions fight as your hero does: commander.js charAuto)
    for(const u of B.units){if(u.hp<=0||u.hero)continue;u.cd-=dt;if(isFighter(u)){charAuto(u,dt);continue}aiUnit(u,dt,null);monsterAbility(u,dt);if(u.s.breath){u.br=(u.br??2.5)-dt;if(u.br<=0){const t=nearest(u);if(t&&Math.hypot(t.x-u.x,t.y-u.y)<90){breathe(u,t);u.br=3.5}}}}
    // (soldiers jostle apart; those running off the field, withdrawn or routed, slip through their own side)
    for(let i=0;i<B.units.length;i++){const a=B.units[i];if(a.hp<=0)continue;for(let j=i+1;j<B.units.length;j++){const b=B.units[j];if(b.hp<=0||a.team===b.team&&(a.rout||b.rout||withdrawing(a)||withdrawing(b)))continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);const R=a.s.big||b.s.big?18:8;if(d<R&&d>.01){const p=(R-d)*.5/d;if(!a.hero){a.x-=dx*p;a.y-=dy*p}if(!b.hero){b.x+=dx*p;b.y+=dy*p}}}}
    for(const u of B.units){if(u.hp<=0||u.s.big)continue;for(const o of B.obs){const dx=u.x-o.x,dy=u.y-o.y,dd=Math.hypot(dx,dy),r=o.r+3;if(dd<r&&dd>.01){u.x=o.x+dx/dd*r;u.y=o.y+dy/dd*r}}}
    for(const u of B.units){u.x=clamp(u.x,8,BW-8);u.y=clamp(u.y,fieldTop(),fieldBot())}
    for(const a of B.arrows){
      if(a.arc){arcStep(a,dt);continue}
      a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;
      if(!a.elf&&!a.magic)for(let k=0;k<B.obs.length;k++){const o=B.obs[k];if(o.kind==='tree'&&!(a.tk&1<<k)&&Math.hypot(a.x-o.x,a.y-(o.y-6))<o.r+2){a.tk|=1<<k;if(Math.random()<.25){a.life=0;fx(a.x,a.y,'#8b5a2b',2)}}}
      if(a.life<=0)continue;
      for(const e of B.units){if(e.hp<=0||e.team===a.team)continue;if(Math.abs(e.x-a.x)<(e.s.big?14:6)&&Math.abs((e.y-(e.s.big?10:6))-a.y)<(e.s.big?11:7)){
        const mu=matchup(a.src||{},e.s);let dm=a.dmg*mu;if(e.hero&&B.blocking){const df=angGap(a.a+Math.PI,B.aim);if(df<1.25&&guard(dm)){const bl=blockMul();dm*=a.magic?Math.max(.5,bl):bl;fx(a.x,a.y,'#cfe0ff',4)}}
        if(a.web){e.slow=2;B.floats.push({x:e.x,y:e.y-20,t:'Webbed',life:.6,c:'#e4e0cf'})}if(a.by&&a.by.comp)compTrain(a.by.type,'archery',1.5);{const O={x:a.x-a.vx,y:a.y-a.vy,arrow:!a.magic},was=e.hp;e.shotAt=B.t;applyDmg(e,dm*formTaken(e,O)*flankMul(e,O),mu,dtOf(a.src));vfxHit(O,e,dm,{arrow:!a.magic,magic:a.magic,col:a.col||(a.src&&a.src.bolt)});if(!a.magic)stickArrow(e,a);earnXp(a.by,e,was)}a.life=0;
        if(a.magic){const sr=a.src&&a.src.splash||18,sm=a.src&&a.src.splashMul||.5;if(sr>=28)vfxExplode(a.x,a.y,sr,a.col);// (a fireball: an explosion, vfx.js)
        B.rings.push({x:a.x,y:a.y,r:sr,life:.25,max:.25,col:'210,170,255'});for(const o of B.units)if(o!==e&&o.hp>0&&o.team!==a.team&&Math.hypot(o.x-a.x,o.y-6-a.y)<sr)applyDmg(o,a.dmg*matchup(a.src||{},o.s)*sm,1,dtOf(a.src))}
        break}}
    }
    B.arrows=B.arrows.filter(a=>a.life>0&&a.x>-4&&a.x<BW+4&&a.y>-4&&a.y<BH+4);
    moraleTick(dt);// (morale.js)
    if(!B.over){const ap=B.units.filter(u=>u.team===0&&fighting(u)).length,ae=B.units.filter(u=>u.team===1&&fighting(u)).length;
    if(ae>0&&retreating())retreatNow();// (you withdrew: morale.js)
    else if(ae===0||ap===0){B.over=true;B.endT=END_WAIT;B.win=ae===0;const run=B.units.some(u=>u.hp>0&&u.rout&&u.team===(B.win?1:0))||(B.win?B.fledFoes:B.fledMine);
      if(run){B.routed=B.win?1:0;log(B.win?'The enemy breaks and flees the field.':'Your men break and run.',B.win?'good':'bad')}}}
  }
  if(B.over){B.endT-=rt;if(B.endT<=0){finishBattle();return}}
  for(const p of B.parts){p.life-=rt;if(p.stuck)continue;p.x+=p.vx*rt;p.y+=p.vy*rt;p.vy+=90*rt}B.parts=B.parts.filter(p=>p.life>0);
  for(const f of B.floats){f.y-=14*rt;f.life-=rt;f.age=(f.age||0)+rt}B.floats=B.floats.filter(f=>f.life>0);vfxStep(rt);// (effects: gfx/vfx.js)
  for(const s of B.slashes)s.life-=rt;B.slashes=B.slashes.filter(s=>s.life>0);
  for(const r of B.rings)r.life-=rt;B.rings=B.rings.filter(r=>r.life>0);
  G.shake=Math.max(0,G.shake-rt*14);
}
