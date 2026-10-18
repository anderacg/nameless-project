'use strict';
/* ---------- projectile creation and stepping ---------- */
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
// the trees an arrow has passed (each tries to stop it once): a bitmask for the first 32, a list past them (a wide forest field's)
const treePast=(a,k)=>k<32?!!(a.tk&1<<k):!!(a.tkx&&a.tkx.includes(k));
const treeMark=(a,k)=>{if(k<32)a.tk|=1<<k;else(a.tkx||(a.tkx=[])).push(k)};
// one step of an arcing arrow: trees catch it only low, it hits on the way down, a miss sticks in the ground
function arcStep(a,dt){
  a.t+=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;a.z+=a.vz*dt;a.vz-=a.g*dt;const z=Math.max(0,a.z);
  if(z<10&&!a.elf)for(let k=0;k<B.obs.length;k++){const o=B.obs[k];if(o.kind==='tree'&&!treePast(a,k)&&Math.hypot(a.x-o.x,a.y-o.y)<o.r+2){treeMark(a,k);if(Math.random()<.35){a.life=0;fx(a.x,a.y-z-4,'#8b5a2b',2);return}}}
  if(z<10&&!a.elf&&B.terrain&&B.terrain.has.wood&&woodStops(a,a.x,a.y,a.x-a.vx*dt,a.y-a.vy*dt,a.vz<0)){a.life=0;fx(a.x,a.y-z-4,'#8b5a2b',2);return}// (low through woods, or down into them: terrain.js)
  if(z<9)for(const e of spatialOn()?SG.near(a.x,a.y,16,a.team,true):B.units){if(e.hp<=0||e.team===a.team)continue;if(Math.abs(e.x-a.x)<(e.s.big?14:6)&&Math.abs(e.y-a.y)<(e.s.big?10:5)){
    const mu=matchup(a.src||{},e.s);let dm=a.dmg*mu;
    if(e.hero&&B.blocking){const df=angGap(a.a+Math.PI,B.aim);if(df<1.25&&guard(dm)){dm*=blockMul();fx(a.x,a.y-6,'#cfe0ff',4)}}
    if(a.web){e.slow=2;B.floats.push({x:e.x,y:e.y-20,t:'Webbed',life:.6,c:'#e4e0cf'})}if(a.src&&a.src.heroShot)train('archery',1.5);{const O={x:a.x-a.vx,y:a.y-a.vy,arrow:!a.magic},was=e.hp;e.shotAt=B.t;applyDmg(e,dm*formTaken(e,O)*flankMul(e,O),mu,dtOf(a.src),a.by,true);vfxHit(O,e,dm,{arrow:!a.magic,magic:a.magic,col:a.col||(a.src&&a.src.bolt)});if(sfxOn())blowSound(O,e,true,a.magic);if(!a.magic)stickArrow(e,a);earnXp(a.by,e,was)}a.life=0;return}}
  if(a.z<=0&&a.t>.03){a.life=0;B.parts.push({x:a.x,y:a.y-1,vx:0,vy:0,life:5,c:'#c9b48a',stuck:a.vx>=0?1:-1});vfx({k:'dust',x:a.x,y:a.y,vx:0,vy:-3,r:1,grow:5,life:.3,col:dustCol()});if(sfxOn()&&bsLand(a.x,a.y)&&sndTurn('ground'))sfxAt('arrowhit',a.x,a.y,{vol:.4})}// (it stays where it lands a while; a thud, softer)
}
// Called at the original point in updateBattle: after unit movement/collision, before morale and battle-end checks.
// (nobody moves while arrows fly: the grid, spatial.js, offers each the soldiers round it, in their order)
function updateProjectiles(dt){
  terrainStep();// (each soldier's ground once a frame, after all movement: a shooter's range by his level, terrain.js)
  if(B.arrows.length){spatialOpen();try{flyArrows(dt)}finally{spatialClose()}}
  B.arrows=B.arrows.filter(a=>a.life>0&&a.x>-4&&a.x<BW+4&&a.y>-4&&a.y<BH+4);
}
function flyArrows(dt){
  for(const a of B.arrows){
    if(a.arc){arcStep(a,dt);continue}
    a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;
    if(!a.elf&&!a.magic)for(let k=0;k<B.obs.length;k++){const o=B.obs[k];if(o.kind==='tree'&&!treePast(a,k)&&Math.hypot(a.x-o.x,a.y-(o.y-6))<o.r+2){treeMark(a,k);if(Math.random()<.25){a.life=0;fx(a.x,a.y,'#8b5a2b',2)}}}
    if(!a.elf&&!a.magic&&a.life>0&&B.terrain&&B.terrain.has.wood&&woodStops(a,a.x,a.y+6,a.x-a.vx*dt,a.y+6-a.vy*dt)){a.life=0;fx(a.x,a.y,'#8b5a2b',2)}// (a bolt flies low: woods stop it, terrain.js)
    if(a.life<=0)continue;
    for(const e of spatialOn()?SG.near(a.x,a.y+10,24,a.team,true):B.units){if(e.hp<=0||e.team===a.team)continue;if(Math.abs(e.x-a.x)<(e.s.big?14:6)&&Math.abs((e.y-(e.s.big?10:6))-a.y)<(e.s.big?11:7)){
      const mu=matchup(a.src||{},e.s);let dm=a.dmg*mu;if(e.hero&&B.blocking){const df=angGap(a.a+Math.PI,B.aim);if(df<1.25&&guard(dm)){const bl=blockMul();dm*=a.magic?Math.max(.5,bl):bl;fx(a.x,a.y,'#cfe0ff',4)}}
      if(a.web){e.slow=2;B.floats.push({x:e.x,y:e.y-20,t:'Webbed',life:.6,c:'#e4e0cf'})}if(a.by&&a.by.comp)compTrain(a.by.type,'archery',1.5);{const O={x:a.x-a.vx,y:a.y-a.vy,arrow:!a.magic},was=e.hp;e.shotAt=B.t;applyDmg(e,dm*formTaken(e,O)*flankMul(e,O),mu,dtOf(a.src),a.by,true);vfxHit(O,e,dm,{arrow:!a.magic,magic:a.magic,col:a.col||(a.src&&a.src.bolt)});if(sfxOn())blowSound(O,e,true,a.magic);if(!a.magic)stickArrow(e,a);earnXp(a.by,e,was)}a.life=0;
      if(a.magic){const sr=a.src&&a.src.splash||18,sm=a.src&&a.src.splashMul||.5;if(sr>=28)vfxExplode(a.x,a.y,sr,a.col);// (a fireball: an explosion, vfx.js)
      B.rings.push({x:a.x,y:a.y,r:sr,life:.25,max:.25,col:'210,170,255'});for(const o of spatialOn()?SG.near(a.x,a.y+6,sr+1,a.team,true):B.units)if(o!==e&&o.hp>0&&o.team!==a.team&&Math.hypot(o.x-a.x,o.y-6-a.y)<sr)applyDmg(o,a.dmg*matchup(a.src||{},o.s)*sm,1,dtOf(a.src),a.by,true)}
      break}}
  }
}
