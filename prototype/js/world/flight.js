'use strict';
/* ---------- flight (the owner, 2026-11-28: "Dragon and griffin should also flying in the map or when figthing as well ( make it
   like a phase where they can fly and land for attacks)") ----------
   Who flies: a winged kind (engine/beasts.js PX.flies: a griffin and its breeds, the dragon) and your hero on a winged mount
   (data/gear.js MOUNTS fly: a griffin, a drake).
   On the map (MapFlight; drawn only, on the real clock): one who travels takes wing. He climbs to his kind's height (map.h px)
   over rise s, his wings beating a frame every beat s, bobbing bob px, his shadow on the ground under him, drawn over everyone
   he passes (the frame's top); standing, he comes down over land s and stands on the ground. A griffin flies only while it
   hunts or flees (m.wing: world/monsters.js BEAST_MIND) and walks while it wanders by its lair.
   In a fight (BattleFlight; a winged beast's, never inside a cave or a hold, nor one of your own men's, who keep to their group's
   orders), a phase at a time:
     ground: it fights on the ground as any beast, for its kind's ground s (first s at the start);
     rise:   it takes wing over rise s, up to its kind's h px;
     air:    on the wing no blow from the ground reaches it (arrows, bolts and spells do: Fighter#wound), it jostles no one and
             no ground slows it; it flies at its mark (a griffin: the nearest shooter, else the nearest foe; the dragon: the
             thickest of them, crowd px round) at spd times its pace, air s at least;
     dive:   within dive px of its mark it comes down on it over land s and lands with its blow: blow times its damage on its
             mark, the dragon's on everyone slam px round it; then the ground again.
   Your hero's winged mount in a fight only skims: at a run its wings beat and it lifts hero px, no higher than a blow reaches.
   FLIGHT.on false: no one flies, as before ---------- */
const FLIGHT={on:true,
  map:{h:{griffin:9,dragon:16,drake:9},rise:.9,land:.6,beat:.13,bob:1},
  battle:{on:true,first:1.5,rise:.7,land:.45,air:1.2,spd:1.5,dive:46,reach:6,hero:5,
    kinds:{griffin:{h:22,ground:6,blow:1.6},dragon:{h:34,ground:9,blow:1.5,slam:30,crowd:30}}}};
class MapFlight{
  static NONE={air:0,up:0,pose:null};static out={air:0,up:0,pose:null};
  // (his kind on the wing: a winged beast's, your hero's winged mount's; null: he walks)
  static kind(u,o){if(!FLIGHT.on)return null;if(o.mapKind==='monster')return PX.flies(u.type)?u.type:null;const M=o===P&&u.type==='hero'?mountDef():null;return M&&M.fly&&HERO_RIDES.on&&M.fig?M.fig[0]:null}
  // (whether he means to fly now: travelling; a beast that only wanders walks)
  static wants(u,o){return marchWalks(u)&&(o.mapKind!=='monster'||o.wing!==false)}
  // (how he is drawn this frame: air 0-1 (eased), up px, his pose on the wing; NONE on the ground)
  static of(u,o){const k=this.kind(u,o);if(!k)return this.NONE;const M=FLIGHT.map,now=performance.now()/1000,dt=Math.min(.1,now-(u._flT??now));u._flT=now;
    const a=u._air=clamp((u._air||0)+(this.wants(u,o)?dt/M.rise:-dt/M.land),0,1);if(!a)return this.NONE;
    const e=a*a*(3-2*a),R=this.out;R.air=e;R.up=Math.round(e*(M.h[k]||M.h.griffin)+(a>=1?Math.sin(now*2.2+(u.id||0))*M.bob:0));
    R.pose=(o.mapKind==='monster'?PX.BEAST_FLY:15)+Math.floor(now/M.beat+(u.id||0))%4;return R}
  static up(u){return (u._air||0)>.5}
  // (his shadow on the ground under him, smaller and fainter the higher he is)
  static shadow(x,y,air,w){ctx.save();ctx.globalAlpha=.3-.12*air;ctx.fillStyle='#000';const r=Math.max(2,w*.3*(1-.25*air));ctx.beginPath();ctx.ellipse(x,y,r,Math.max(1,r*.35),0,0,6.283);ctx.fill();ctx.restore()}
}
class BattleFlight{
  static kindOf(u){const K=FLIGHT.battle.kinds;return K[u.type]||(u.s.big?K.dragon:K.griffin)}
  // (whether he flies in this fight)
  static flies(u){return FLIGHT.on&&FLIGHT.battle.on&&!!u.s.beast&&!u.wildlife&&!B.inside&&!B.holds&&u.team!==0&&PX.flies(u.type)}
  static scale(){return B.world?WORLD_BATTLE.sprite/WORLD_BATTLE.scale:1}
  static range(){return typeof worldEffectScale==='function'?worldEffectScale():1}
  // (its mark: a griffin's the nearest shooter, else the nearest foe; the dragon's the one with the most of his own about him)
  static pick(u){const K=this.kindOf(u),L=foesOf(u).filter(e=>!e.left&&!e.waiting&&!e.aloft&&!e.rout);if(!L.length)return nearest(u);
    const d=e=>Math.hypot(e.x-u.x,e.y-u.y);
    if(K.crowd){const r=K.crowd*this.range(),S=L.length>48?L.filter((e,i)=>i%Math.ceil(L.length/48)===0):L;let best=null,bn=-1;
      for(const e of S){let n=0;for(const q of L)if(Math.abs(q.x-e.x)<r&&Math.abs(q.y-e.y)<r)n++;if(n>bn||n===bn&&d(e)<d(best)){bn=n;best=e}}return best}
    const sh=L.filter(e=>e.s.range>0),P0=sh.length?sh:L;return P0.reduce((a,e)=>d(e)<d(a)?e:a,P0[0])}
  // his turn while he is off the ground: true (his turn on the ground is not taken)
  static turn(u,dt,actor){if(!this.flies(u)){if(u.aloft){u.aloft=false;u.z=0}return false}
    const F=FLIGHT.battle,K=this.kindOf(u),H=K.h*this.scale(),f=u.fl||(u.fl={ph:'ground',t:F.first});
    if(f.ph==='ground'){if(u.rout||u.down>0||u.stun>0)return false;f.t-=dt;if(f.t>0||u.atkAt!=null&&B.t-u.atkAt<ATK_ANIM||!nearest(u))return false;f.ph='rise';f.t=0;return false}
    u.moving=true;u.inMelee=false;u.shot=null;
    if(f.ph==='rise'){f.t+=dt;const p=Math.min(1,f.t/F.rise);u.z=H*p*p*(3-2*p);u.aloft=u.z>F.reach*this.scale();if(p>=1){f.ph='air';f.t=0;f.mark=this.pick(u)}return true}
    if(f.ph==='air'){f.t+=dt;u.aloft=true;u.z=H+Math.sin(B.t*3+(u.id||0))*1.5*this.scale();let m=f.mark;if(!m||m.hp<=0||m.left)m=f.mark=this.pick(u);
      if(!m){f.ph='dive';f.t=0;f.from={x:u.x,y:u.y};return true}
      const dx=m.x-u.x,dy=m.y-u.y,d=Math.hypot(dx,dy),st=Math.min(d,u.s.spd*F.spd*dt*Speed.field());if(d>.01){u.x+=dx/d*st;u.y+=dy/d*st;u.face=dx>=0?1:-1;u.dir=Math.atan2(dy,dx);u.spdNow=u.s.spd}
      if(d<F.dive*this.range()&&f.t>=F.air){f.ph='dive';f.t=0;f.from={x:u.x,y:u.y}}return true}
    // (dive: down on its mark, landing a body short of him, with its blow)
    f.t+=dt;const p=Math.min(1,f.t/F.land),m=f.mark&&f.mark.hp>0?f.mark:null,a=m?Math.atan2(m.y-f.from.y,m.x-f.from.x):0,off=10*this.range(),tx=m?m.x-Math.cos(a)*off:f.from.x,ty=m?m.y-Math.sin(a)*off:f.from.y;
    u.x=f.from.x+(tx-f.from.x)*p;u.y=f.from.y+(ty-f.from.y)*p;u.z=H*(1-p*p);if(m)u.face=m.x>=u.x?1:-1;
    if(p>=1){u.z=0;u.aloft=false;f.ph='ground';f.t=K.ground;u.ab=4.5;u.cd=Math.max(u.cd||0,u.s.cd*.5);this.land(u,m,K,actor)}
    return true}
  // (it lands: its blow on its mark, the dragon's on everyone about it; dust and a ring where it comes down)
  static land(u,m,K,actor){const R=this.range();u.atkAt=B.t;u.atkStyle='swing';
    if(K.slam){const r=K.slam*R;for(const e of foesOf(u))if(!e.aloft&&Math.hypot(e.x-u.x,e.y-u.y)<r)actor.hit(e,u.s.dmg*K.blow);
      B.rings.push(fxAt({x:u.x,y:u.y-fxUp(4),r,life:.4,max:.4,col:'255,190,90'},fxUp(4)))}
    else if(m&&Math.hypot(m.x-u.x,m.y-u.y)<(u.s.reach+14)*R){actor.hit(m,u.s.dmg*K.blow);B.floats.push({x:u.x,y:u.y-fxUp(20),t:'POUNCE',life:.6,c:'#ffb070'})}
    for(let i=0;i<8;i++){const a=rnd(0,6.283),v=rnd(10,35);vfx({k:'dust',x:u.x,y:u.y-1,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.4,r:rnd(2,3),grow:8,life:rnd(.4,.7),col:dustCol()})}}
  // (your hero's winged mount: it skims the ground at a run, drawn only)
  static skim(u,moved){if(!FLIGHT.on||!u.hero||u.afoot)return;const M=mountDef();if(!M||!M.fly||!u.s.mounted)return;
    const want=moved&&u.spdNow>u.s.spd*.75?FLIGHT.battle.hero*this.scale():0;u.z=Math.abs((u.z||0)-want)<.5?want:(u.z||0)+(want-(u.z||0))*.2}
}
