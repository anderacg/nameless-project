'use strict';
/* ---------- the dismount (doc/TROOPS_DESIGN.md step 4; its numbers: data/dismount.js DISMOUNT). A troop rider (a mounted kind's
   soldier; characters ride as they ever did) steps down where he stands at his group's Dismount (unitabilities.js), his horse left
   standing there; at Mount he walks back to it and climbs up, enemies near or not. A charge or a hard blow may throw him
   (physics.js physThrow, physBraced): down a moment, then he goes back to his horse on his own while no enemy is near, else
   fights on foot. His horse has its own health (Horse): a share of every hit on him lands on it (Dismount.share); killed, he falls
   and fights on foot to the end. On foot his stats are his kind's on foot (footOf: no charge, a man's pace), so his foot drills
   (Brace, the hedge of spears: rankskills.js) are his again; up again, as he rode (rideOf).
   Thrown, his mount does as its kind does (DISMOUNT.temper; Horse#loose): a horse, a stag or a ram bolts away from the nearest
   enemy and stands farther off, where he must walk to catch it; a wolf or a warg turns on the enemies near him, biting, and
   comes back to his side when none is left near (Horse.step, battle.js battleStep).
   Set on him only when it first happens (u.horse, u.afoot, u.remount, u.mountT): a rider none of it befalls is as he ever was.
   Your groups' horses after the fight (settle, resolution.js), and the men without one on foot from the start (muster, setup.js)
   ---------- */
// (a troop rider: a mounted kind's soldier, none of your hero, a companion or a leader)
const isRider=u=>!!u&&!u.hero&&!u.comp&&!u.leader&&!!ST[u.type]?.mounted;
/* a rider's horse: its breed (an item: m_horse, m_destrier), its health, its look (its rider's, as he rode), and where it stands while
   no one rides it (B.horses: drawn with the living, render.js battleEnts; never in B.units, so nothing counts or strikes it; no kind,
   which the drawing reads as an obstacle's) */
class Horse{
  constructor(u){this.rider=u;this.team=u.team;this.breed=horseOf(u.type)||'m_horse';this.max=this.hp=DISMOUNT.hp[this.breed]??DISMOUNT.hp.m_horse;this.look=unitLook(u);this.mount=this.look.mount||'horse';this.x=u.x;this.y=u.y;this.face=u.face||1;this.dead=false;this.way=null}
  // (his horse, made when first needed; null: none, a man who began on foot)
  static of(u){return u.horse===undefined?(u.horse=new Horse(u)):u.horse}
  // (those standing riderless)
  static get standing(){return B.horses||(B.horses=[])}
  get isHorse(){return true}
  // (does it fight when its rider is thrown: a wolf, a warg; else it bolts)
  get fights(){return DISMOUNT.temper[this.mount]==='fight'}
  // left standing where its rider stepped down or was thrown
  stand(){const u=this.rider,L=Horse.standing;this.x=u.x;this.y=u.y;this.face=u.face||1;this.way=null;this.mv=false;if(!L.includes(this))L.push(this)}
  /* its rider thrown: it stands loose there, then a fighter turns on the enemy (way 'fight'), any other bolts (way 'bolt') away from
     the nearest enemy (else the way its rider faced) to (tx, ty), far off within the field */
  loose(){this.stand();if(this.fights){this.way='fight';this.bite=0;return}const u=this.rider,e=nearest(u),F=DISMOUNT.bolt,d=rnd(F.far[0],F.far[1]);
    let a=e?Math.atan2(u.y-e.y,u.x-e.x):(u.face||1)>0?0:Math.PI;a+=rnd(-.5,.5);this.way='bolt';
    this.tx=B.world?u.x+Math.cos(a)*d:clamp(u.x+Math.cos(a)*d,12,BW-12);this.ty=B.world?u.y+Math.sin(a)*d:clamp(u.y+Math.sin(a)*d,fieldTop()+4,fieldBot()-4)}
  // ridden again
  ride(){const L=Horse.standing,i=L.indexOf(this);if(i>=0)L.splice(i,1);this.way=null;this.mv=false}
  // (a step of its own toward (x, y) at spd px/s, stopping within stop px of it: true when there)
  toward(x,y,spd,stop,dt){const dx=x-this.x,dy=y-this.y,d=Math.hypot(dx,dy);this.mv=d>stop;if(!this.mv)return true;
    const k=Math.min(1,spd*dt/d);this.x+=dx*k;this.y+=dy*k;if(Math.abs(dx)>.5)this.face=dx>0?1:-1;return false}
  // a frame of a loose mount (Horse.step): bolting till it stands far off; fighting the enemies near its rider, else at his side
  step(dt){if(this.dead||!this.way)return;if(this.lunge>0)this.lunge-=dt;
    if(this.way==='bolt'){if(this.toward(this.tx,this.ty,DISMOUNT.bolt.spd,2,dt)){this.way=null;this.mv=false}return}
    const F=DISMOUNT.fight,u=this.rider,ox=u.hp>0?u.x:this.x,oy=u.hp>0?u.y:this.y;let e=null,bd=DISMOUNT.near;
    for(const o of B.units){if(o.hp<=0||o.left||!battleEnemy(o,this))continue;const d=Math.hypot(o.x-ox,o.y-oy);if(d<bd){bd=d;e=o}}
    if(!e){if(u.hp>0)this.toward(u.x+(u.face||1)*-6,u.y,F.spd,3,dt);else this.mv=false;return}
    const r=F.reach+(e.s.big?12:0);if(!this.toward(e.x,e.y,F.spd,r,dt))return;this.face=e.x>=this.x?1:-1;
    if((this.bite-=dt)>0)return;this.bite=F.cd;this.lunge=.15;applyDmg(e,F.dmg[this.mount]??F.dmg.wolf,1,'pierce',u,false);
    if(e.hp>0&&!e.s.range&&!(e.stun>0)&&this.hurt(meleeDmgOf(e.s)*F.back))this.die()}
  // (every loose mount's frame: battle.js battleStep)
  static step(dt){for(const h of Horse.standing.slice())h.step(dt)}
  // its share of a blow on its rider: true when that fells it (its rider then down with it: Dismount.down)
  hurt(n){if(this.dead)return false;this.hp-=n;return this.hp<=0}
  // it falls under its rider and lies there (vfx.js drawCorpses: a mount's body, no man in it)
  die(){const u=this.rider,c=corpseOf(u),loose=Horse.standing.includes(this),x=loose?this.x:u.x,y=loose?this.y:u.y;this.dead=true;this.hp=0;this.ride();
    B.corpses.push({x,y,team:u.team,face:loose?this.face:u.face||1,sp:{mount:c.mount,down:c.down,horse:true},td:B.t,dry:false,pool:rnd(8,11),seed:Math.random()*4|0})}
  /* standing saddled in its side's colour (sprites.js horseSprite), on the camera's pixels as the living are; running, it bounds
     (a hop a stride), and a bite lunges it forward */
  draw(){const q=B.world?VS/B.world.scale:B.cam?camPx():1,hop=this.mv?Math.round(Math.abs(Math.sin(B.t*14))*2):0,ln=this.lunge>0?2*this.face:0,
    x=Math.round((this.x+ln)*q)/q,y=Math.round(this.y*q)/q,sp=horseSprite(this.look);
    ctx.save();ctx.translate(x,y);if(B.world)ctx.scale(WORLD_BATTLE.sprite,WORLD_BATTLE.sprite);
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,0,9,2,0,0,6.283);ctx.fill();if(this.face<0)ctx.scale(-1,1);ctx.drawImage(sp,-(sp.width>>1),-sp.height+2-hop);ctx.restore()}
}
// (his stats on foot, and back in the saddle: by the stats he has now, so a quiver run dry, his rank and upgrades stay his)
const FOOT=new WeakMap(),RIDE=new WeakMap();
class Dismount{
  // (does the dismount hold for him: on, and a troop rider)
  static rider(u){return DISMOUNT.on&&isRider(u)}
  // his stats on foot: no charge, a man's pace by his armour (× his own speed against his kind's: upgrades and the ground kept); how
  // he rode kept beside them (ride)
  static footOf(u){const s=u.s;let f=FOOT.get(s);if(f)return f;const D=DISMOUNT.spd,k=ST[u.type];
    f={...s,mounted:false,charge:false,spd:s.spd*(D[armorOf(s)]??D.none)/(k?.spd||s.spd),ride:{spd:s.spd,charge:s.charge}};FOOT.set(s,f);RIDE.set(f,s);return f}
  // his stats in the saddle again: the very ones he stepped down with, else (changed on foot) these with his ride's
  static rideOf(u){const s=u.s;if(RIDE.has(s))return RIDE.get(s);if(!s.ride)return s;const {ride,...r}=s;return{...r,mounted:true,spd:ride.spd,charge:ride.charge}}
  /* he steps down (how: 'order', his group's Dismount; 'thrown', by a charge or a hard blow; 'killed', his horse down under him; 'none', a
     man with no horse from the start): his horse left standing (or lying), he on foot; thrown or his horse killed, he falls */
  static down(u,how){if(u.afoot)return;const h=how==='none'?(u.horse=null):Horse.of(u);if(how==='killed'){if(!h.dead)h.die()}else if(how==='thrown')h.loose();else if(h)h.stand();
    u.s=Dismount.footOf(u);u.afoot=true;u.remount=how==='thrown'?'auto':null;u.mountT=0;u.run=0;u.vel=0;u.wind=null;u.shot=null;
    if(how==='thrown'||how==='killed')Dismount.fall(u,how==='killed'?'Horse down':'Unhorsed');Dismount.role(u)}
  // thrown: down a moment (stunned with physics off), his unit shaken, what befell him over him (say) and a puff of dust
  static fall(u,say){const D=DISMOUNT;if(PHYSICS.on){u.down=u.downFor=D.stun;u.acl=0}else stun(u,D.stun);if(!steady(u))shake(u,PHYSICS.hit.downShock);
    B.floats.push({x:u.x,y:u.y-20,t:say,life:1,c:'#ffc070'});
    for(let i=0;i<6;i++){const a=rnd(0,6.283),v=rnd(10,35);vfx({k:'dust',x:u.x,y:u.y-1,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.4,r:rnd(2,3),grow:8,life:rnd(.4,.7),col:dustCol()})}}
  // he climbs back into the saddle
  static up(u){const h=u.horse;if(!u.afoot||!h||h.dead)return;h.ride();u.x=h.x;u.y=h.y;u.s=Dismount.rideOf(u);u.afoot=false;u.remount=null;u.mountT=0;Dismount.role(u)}
  // (his group's role, as most of its men go now: commander.js reads it)
  static role(u){const g=u.grp&&B.groups[u.grp];if(!g||g.role==='hero')return;const m=g.units,on=m.filter(x=>x.s.mounted).length*2>=m.length,rep=m.find(x=>!!x.s.mounted===on);if(rep)g.role=grpOf(rep.s)}
  /* a man on foot going back to his horse (u.remount: 'order', at Mount; 'auto', thrown, while no enemy is within near): there he
     mounts in mountT s. True while it takes his moment (actors.js step); false, he fights on foot as ever */
  static going(a,dt){const u=a.u,h=u.horse,D=DISMOUNT;if(!h||h.dead){u.remount=null;return false}
    if(u.remount==='auto'){if((u.mlook=(u.mlook||0)-dt)<=0){u.mlook=D.look;const e=nearest(u);u.mnear=!!e&&Math.hypot(e.x-u.x,e.y-u.y)<D.near}if(u.mnear)return false}
    u.tgt=null;u.shot=null;u.inSlot=false;
    if(Math.hypot(h.x-u.x,h.y-u.y)>D.reach){u.mountT=0;a.march(B.groups[u.grp],u.s,h.x,h.y,D.reach/2,dt);return true}
    u.spdNow=0;u.face=h.x>=u.x?1:-1;if((u.mountT+=dt)>=D.mountT)Dismount.up(u);return true}
  // a hit of amt on t (attacks.js wound): his horse takes its share (by what struck him), he the rest; his horse falling, he falls too
  static share(t,amt,source,missile,dt){if(!Dismount.rider(t)||!t.s.mounted)return amt;const S=DISMOUNT.share,
    k=isMagical(dt)?S.magic:missile?S.missile:source?.s&&unitClass(source.s)==='spear'?S.spear:S.blow;if(Horse.of(t).hurt(amt*k))Dismount.down(t,'killed');return amt*(1-k)}
  // a throw of dv px/s (res: the footing it must beat: movesets.js) unhorses him? Hard enough for his own weight in the saddle (seat),
  // and not again within the grace of getting up (physics.js physThrow)
  static throws(t,dv,res){if(!Dismount.rider(t)||!t.s.mounted||t.hp<=0)return false;const man=physMass(t)-PHYSICS.mass.horse;
    return dv>DISMOUNT.seat*man*res&&(MOVESETS.old||!(B.t-(t.upAt??-Infinity)<MOVESETS.grace))}
  // his group's men in the saddle, of its riders ({on, of}; none: no riders)
  static tally(m){const r=m.filter(isRider);return r.length?{on:r.filter(u=>u.s.mounted).length,of:r.length}:null}
  /* your groups' horses after the fight (resolution.js finish, before the losses): the hurt ones come back, the dead are lost; a
     roster group keeps its own count only once it has lost some (core/army.js groupHorses) */
  static settle(members,source){const dead=members.filter(u=>u.horse?.dead).length;if(dead&&source)source.horses=Math.max(0,groupHorses(source)-dead)}
  // (the start: your groups' men beyond their horses on foot, with none; setup.js muster)
  static muster(){if(!DISMOUNT.on)return;const r=partyRoster(P);
    for(const g of Object.values(B.groups)){const src=g.player&&g.sourceGroupId&&r.groups.find(x=>x.id===g.sourceGroupId);if(!src||src.horses==null)continue;
      let n=Math.max(0,src.count-src.horses);for(const u of g.units)if(n>0&&isRider(u)){Dismount.down(u,'none');n--}}}
}
