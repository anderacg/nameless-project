'use strict';
/* ---------- ambient life (owner, 2026-10-19; residents and rhythms, 2026-10-23): flocks, birds in the fields and woods, coastal
   gulls, wetland birds, butterflies, fireflies, fish, hares, squirrels, bats, owls, lizards and vultures. Drawn only: habitats
   come from the world seed; disturbance and battle remains live only in AMBV. Never saved, nothing in W, nothing the
   simulation reads, and never a draw of Math.random (its own little PRNG, ambR, seeded
   from the clock and where you stand, as mist.js keeps its own). Real time, so it lives while paused, as the water does.
   Only where you see: each is born in your sight (fog.js inSight; in a wood only near you, as parties.js spotted), within the
   view and AMBIENT.margin px round it, and gone once out of it; what flies out of your sight goes under the fog with the rest
   (render.js fogMem). Each kind has fixed local habitats and its hours (ambientCan) and its rate (every: s between new ones, on average;
   max: at once), birds fewer in a storm, the rain or the snow (ambWeather: storm, rain, snow, × their numbers), all fewer and
   slower with reducedMotion (calm: × their numbers; slow: × their speed). Birds on the ground and the critters scatter from
   anyone who comes within scare px of them: you, the parties, workers out of doors, caravans, refugees, beasts, the road's
   people. The layers (render.js drawWorld): on the ground, by their feet with everyone else and behind what stands in front of
   them (depth.js; they fade nothing over them: nf), the pecking birds, hares, squirrels and butterflies (ambientWorld); flat
   on the ground under everyone, the splashes and the flyers' shadows (ambientFlat); in the air over everyone, under the fog and
   the labels, the flyers (ambientAir); over the night, the fireflies' light (ambientGlow). In battle (render.js drawBattle,
   under its fog of war: ambientBattle) a few birds burst out of the trees in view as it begins, and crows circle the field once
   it is over. on: a view over Settings → Ambient life (PREFS ambient, ui.js; off in tests/harness.js: tests/ambient.js turns
   it on). Every distance in px (the map's, the field's), every time in s; [a, b]: from a to b ---------- */
/* (owner, 2026-10-19: too many: about a third of the first numbers; density: one value for them all; the hours: dusk and dawn
   livelier, midday quieter (hours, by timeOfDay); the land: half as much on a holding's land or by a road (tame)) */
// homes: patch tiles, placement tries, occupancy chance, cached patches; quiet campaign hours, remembered places, remains
// campaign days, army headcount and flock turn radians/s. All other lifetimes below are real seconds.
const AMBIENT={homes:{tiles:8,tries:8,chance:.65,cache:256,quiet:2,memories:96,remains:1,army:12,turn:1.6},margin:40,storm:.3,rain:.6,snow:.5,calm:.5,slow:.6,density:1,hours:{Dawn:1.5,Dusk:1.5,Midday:.6},tame:.5,
  // a flock over: n birds, at speed px a second, alt px up, its shadow on the ground below
  flock:{every:25,max:1,n:[3,7],speed:[24,34],alt:[46,72]},
  // resident birds peck in meadows or woods, with a local tree or roof to roost in; off they fly
  // when anyone comes within scare px (or after life s), climbing rise px a second to top px up
  peck:{every:12,max:1,n:[2,4],scare:30,life:[14,28],speed:[50,70],rise:30,top:42},
  // crows circling a place (a fight, a trace on the road, ruins), r px round it, spin radians a second
  crow:{every:1.2,max:1,n:[2,3],r:[12,22],spin:.45,alt:[22,36]},
  // a gull over water within shore tiles of land, gliding about where it came (range px) for life s, then on its way
  gull:{every:15,max:1,shore:2,speed:[16,24],alt:[22,36],life:[14,24],range:48},
  fly:{every:5,max:2,speed:[6,12],life:[7,13]},
  // fireflies on warm nights in the woods (only within near × your sight: what a wood hides) and over the marsh
  glow:{every:1,max:8,life:[4,9],near:.45},
  fish:{every:6,max:1,shore:3,life:1.2},
  hare:{every:20,max:1,scare:36,speed:[70,90],life:[12,24]},
  // a squirrel on the floor of a wood near you: it sits wait s, then darts off into the trees
  squirrel:{every:25,max:1,scare:26,speed:[60,75],near:.45,wait:[.8,2.5]},
  // gliders round their home (range px) for life s, alt px up: bats at dusk and night over a wood, owls in the dark there,
  // vultures over the desert by day
  bat:{every:12,max:1,speed:[22,32],alt:[12,20],life:[12,20],range:38},
  owl:{every:24,max:1,speed:[16,22],alt:[14,24],life:[16,24],range:48},
  // on the ground by their home, off when anyone comes within scare px: herons by water, ducks on the shore's water, lizards
  // on desert ground
  heron:{every:22,max:1,scare:40,speed:[20,28],life:[24,40]},
  duck:{every:16,max:1,scare:32,speed:[5,9],life:[20,34]},
  lizard:{every:22,max:1,scare:24,speed:[28,40],life:[14,26]},
  vulture:{every:28,max:1,speed:[12,18],alt:[30,46],life:[22,36],range:48},
  // battle: birds out of trees trees (n each), flying off at speed, climbing rise px a second; crows over the fallen
  battle:{trees:[2,3],n:[3,5],speed:[44,70],rise:[22,34],life:5,crows:[3,5],r:[24,46],alt:[36,56],spin:.4}};
Object.defineProperty(AMBIENT,'on',{get:()=>prefGet('ambient'),set:v=>{PREFS.ambient.v=!!v},enumerable:true});
const AMB_KINDS=['flock','peck','crow','gull','fly','glow','fish','hare','squirrel','bat','owl','heron','duck','lizard','vulture'],
  AMB_BIRDS={flock:1,peck:1,crow:1,gull:1,owl:1,heron:1,duck:1,vulture:1},AMB_GROUND={peck:1,hare:1,squirrel:1,fly:1,heron:1,duck:1,lizard:1},
  AMB_GLIDE={gull:1,bat:1,owl:1,vulture:1};
// (kept between frames, drawn only: the map's (list), the clock they last stepped at (t), the PRNG's state (q), the battle's (bt))
const AMBV={list:[],t:0,q:0,bt:null,homes:new Map(),quiet:new Map(),meals:new Map(),homeDay:0};
onWorld(()=>{AMBV.list.length=0;AMBV.t=0;AMBV.bt=null;AMBV.homes.clear();AMBV.quiet.clear();AMBV.meals.clear();AMBV.homeDay=0});
// (its own PRNG, never Math.random: seeded once from the clock and where you stand)
function ambR(){if(!AMBV.q)AMBV.q=((Date.now()%2147483647)^Math.imul(Math.round(P.x)*73856093^Math.round(P.y)*19349663,1))>>>0||1;
  const q=AMBV.q=AMBV.q+0x6d2b79f5|0;let z=Math.imul(q^q>>>15,1|q);z=z+Math.imul(z^z>>>7,61|z)^z;return ((z^z>>>14)>>>0)/4294967296}
const ambIn=a=>a[0]+ambR()*(a[1]-a[0]);
const ambInt=a=>Math.floor(a[0]+ambR()*(a[1]-a[0]+1));
// the weather at a point (where you are, unless given; world/tracks.js reads it at a print): the map has none of its own yet but the snow falling in the frost (worldart.js drawEnv; a storm on
// the road is a line in the log, incidents.js), so 'snow' there, else 'clear'; 'rain' and 'storm' are read too, for when it has them
function ambWeather(x=P.x,y=P.y){return climAt(x,y)==='frost'?'snow':'clear'}
// (what stands on a tile, for the life on the ground: 0 nothing, 1 a lot's field, 2 a building or a camp's ground: lots.js OCC)
function ambLot(tx,ty){const id=OCC?occAt(tx,ty):0;if(!id)return 0;const l=id>0&&LOT[id];if(!l)return 2;return tx>=l.x&&tx<l.x+l.n&&ty>=l.y&&ty<l.y+l.n?2:1}
// (water with land within r tiles: a shore, a lake, a river)
function ambShore(x,y,r){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tAt(tx,ty)!==T_WATER)return false;
  for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const a=tx+i,b=ty+j;if(a>=0&&b>=0&&a<MW&&b<MH&&tAt(a,b)!==T_WATER)return true}return false}
// Residents are derived from the world's seed and fixed patches, never the camera or the animation PRNG. Only nearby patches
// are materialized; forgetting one does not change its residents. Empty patches stay empty, including after a return visit.
const ambHash=(x,y,salt)=>hash(x,y,(WM.seedNum||0)+salt);
function ambCoast(x,y){const i=Math.floor(y/TILE)*MW+Math.floor(x/TILE);return terrAt(x,y)===T_WATER&&!(WM.feat[i]&2)&&!(WM.river[i]&3)}
function ambHabitat(k,x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tx<1||ty<1||tx>=MW-1||ty>=MH-1)return false;
  const t=tAt(tx,ty),c=climAt(x,y),lot=ambLot(tx,ty),water=r=>nearTile(tx,ty,T_WATER,r);
  if(k==='flock'||k==='bat'||k==='owl')return t===T_FOREST&&c!=='desert';
  if(k==='peck')return (t===T_OPEN||t===T_FOREST)&&c!=='desert'&&c!=='swamp'&&lot<2;
  if(k==='hare')return t===T_OPEN&&(c==='grass'||c==='frost')&&lot<2;
  if(k==='squirrel')return t===T_FOREST&&c!=='desert'&&lot<2;
  if(k==='gull')return ambCoast(x,y)&&ambShore(x,y,AMBIENT.gull.shore);
  if(k==='duck'||k==='fish')return c!=='frost'&&ambShore(x,y,AMBIENT.fish.shore);
  if(k==='heron')return c!=='frost'&&c!=='desert'&&(t===T_OPEN||t===T_FOREST)&&lot<2&&water(1);
  if(k==='lizard')return c==='desert'&&(t===T_OPEN||t===T_HILL)&&lot<2;
  if(k==='vulture')return c==='desert'&&(t===T_OPEN||t===T_HILL)&&lot<2;
  if(k==='glow')return (c==='grass'&&t===T_FOREST||c==='swamp'&&passable(t)&&t!==T_ROAD)&&lot<2;
  if(k==='fly')return (c==='grass'||c==='swamp')&&t===T_OPEN&&lot<2;
  return false}
// A roost can be a tree or a roof; its feeding place must be close enough to fly to, not a random point beyond the view.
function ambRoost(x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
  for(let r=0;r<=5;r++)for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){
    if(Math.max(Math.abs(a),Math.abs(b))!==r)continue;const X=tx+a,Y=ty+b;if(X<1||Y<1||X>=MW-1||Y>=MH-1)continue;
    if(tAt(X,Y)===T_FOREST)return{x:(X+.5)*TILE,y:(Y+.5)*TILE,alt:14};
    const id=OCC&&occAt(X,Y),l=id>0&&LOT[id];if(l&&X>=l.x&&X<l.x+l.n&&Y>=l.y&&Y<l.y+l.n)return{x:(l.x+l.n/2)*TILE,y:(l.y+l.n/2)*TILE,alt:12};
  }return null}
function ambFeeding(x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
  for(let r=1;r<=5;r++)for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++)if(Math.max(Math.abs(a),Math.abs(b))===r){const X=(tx+a+.5)*TILE,Y=(ty+b+.5)*TILE;
    if(terrAt(X,Y)===T_OPEN&&ambHabitat('peck',X,Y))return{x:X,y:Y,alt:0}}
  return null}
function ambHomes(cx,cy){const S=AMBV,H=AMBIENT.homes,key=cx+':'+cy;let list=S.homes.get(key);if(list)return list;list=[];
  for(let n=0;n<AMB_KINDS.length;n++){const k=AMB_KINDS[n];if(k==='crow')continue;
    const salt=101+n*37;if(ambHash(cx,cy,salt)>H.chance)continue;
    for(let j=0;j<H.tries;j++){const tx=cx*H.tiles+Math.floor(ambHash(cx,cy,salt+1+j*2)*H.tiles),ty=cy*H.tiles+Math.floor(ambHash(cx,cy,salt+2+j*2)*H.tiles),x=(tx+.5)*TILE,y=(ty+.5)*TILE;
      if(!ambHabitat(k,x,y))continue;
      if((landHold(x,y)||nearTile(tx,ty,T_ROAD,1))&&ambHash(cx,cy,salt+300)>AMBIENT.tame)break;
      const roost=k==='peck'||k==='flock'?ambRoost(x,y):null,feed=k==='flock'?ambFeeding(x,y):null;
      if(k==='flock'&&!feed)continue;
      list.push({key:key+':'+k,k,x,y,roost,feed,species:k==='peck'||k==='flock'?(climAt(x,y)==='frost'?'raven':terrAt(x,y)===T_FOREST?'pigeon':'sparrow'):null});break;
    }
  }
  S.homes.set(key,list);if(S.homes.size>H.cache)S.homes.delete(S.homes.keys().next().value);return list}
function ambHomeView(cam,V){const d=AMBIENT.homes.tiles*TILE,r=V+TILE,out=[];
  for(let cy=Math.max(0,Math.floor((P.y-r)/d));cy<=Math.min(Math.ceil(MH*TILE/d)-1,Math.floor((P.y+r)/d));cy++)
    for(let cx=Math.max(0,Math.floor((P.x-r)/d));cx<=Math.min(Math.ceil(MW*TILE/d)-1,Math.floor((P.x+r)/d));cx++)out.push(...ambHomes(cx,cy));
  return out}
function ambQuiet(e){if(!e.hk)return;AMBV.quiet.delete(e.hk);AMBV.quiet.set(e.hk,Clock.hours()+AMBIENT.homes.quiet);
  if(AMBV.quiet.size>AMBIENT.homes.memories)AMBV.quiet.delete(AMBV.quiet.keys().next().value)}
function ambRemains(p){if(!AMBIENT.on||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>=MW*TILE||p.y>=MH*TILE)return;
  const key='m'+Math.floor(p.x/TILE)+':'+Math.floor(p.y/TILE);AMBV.meals.delete(key);AMBV.meals.set(key,{x:p.x,y:p.y,until:Clock.hours()+24*AMBIENT.homes.remains});
  if(AMBV.meals.size>AMBIENT.homes.memories)AMBV.meals.delete(AMBV.meals.keys().next().value)}
worldOn('fight:ended',d=>ambRemains(d.fight));
worldOn('battle:ended',d=>{if(d.how==='won'||d.how==='lost')ambRemains(d.enc&&d.enc.ref||P)});
function ambMemory(){const h=Clock.hours();for(const [key,until] of AMBV.quiet)if(h>=until)AMBV.quiet.delete(key);
  for(const [key,p] of AMBV.meals)if(h>=p.until)AMBV.meals.delete(key);
  if(AMBV.homeDay!==Clock.day){AMBV.homes.clear();AMBV.homeDay=Clock.day}}
// A resident's feet stay on its habitat. Never send a hare through a river, a squirrel through a house or a duck ashore.
function ambMove(e,dx,dy){const x=e.x+dx,y=e.y+dy,k=e.k;
  if(!ambHabitat(k,x,y)||!ambHabitat(k,e.x+dx,e.y)||!ambHabitat(k,e.x,e.y+dy))return false;e.x=x;e.y=y;return true}
function ambPlace(e,h){e.hk=h.key;e.home=h;e.species=h.species;
  if(e.k==='flock'&&h.feed&&h.roost){const back=Clock.part()==='Dusk',a=back?h.feed:h.roost,b=back?h.roost:h.feed,v=Math.hypot(e.vx,e.vy);
    e.x=a.x;e.y=a.y;e.alt=a.alt;e.h=Math.atan2(b.y-a.y,b.x-a.x);e.route=b;e.v=v;e.life=Math.hypot(b.x-a.x,b.y-a.y)/v+4;
    for(let i=0;i<e.m.length;i++){const r=Math.ceil(i/2),side=i%2?1:-1;e.m[i].back=r*5;e.m[i].side=side*r*3;e.m[i].dx=-Math.cos(e.h)*r*5-Math.sin(e.h)*side*r*3;e.m[i].dy=-Math.sin(e.h)*r*5+Math.cos(e.h)*side*r*3}}
  return e}
// Bird shadows change sides as the sun crosses the sky; their ground point remains independent of the drawn altitude.
function ambShadow(alt){const f=Math.max(0,Math.min(1,Clock.frac/NIGHT_AT));return[alt*(.45-.9*f),alt*(.1+.12*Math.abs(.5-f))]}

// may one of kind k be born at (x, y) now: in your sight, on its ground, at its hours, in its weather
function ambientCan(k,x,y){
  if(!inSight(x,y))return false;
  const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),t=tAt(tx,ty),c=climAt(x,y),w=ambWeather(),d=darkness(),near=f=>Math.hypot(x-P.x,y-P.y)<vis()*f;
  if(k==='flock')return d<.35;
  if(k==='peck')return d<.35&&w!=='storm'&&ambHabitat(k,x,y)&&(t!==T_FOREST||near(AMBIENT.squirrel.near));
  if(k==='crow')return d<.6;
  if(k==='gull')return d<.35&&ambHabitat(k,x,y);
  if(k==='fly')return d<.1&&w==='clear'&&(c==='grass'||c==='swamp')&&t===T_OPEN&&ambLot(tx,ty)<2;
  if(k==='glow')return d>.55&&w==='clear'&&(c==='grass'||c==='swamp')&&(t===T_FOREST?near(AMBIENT.glow.near):c==='swamp'&&t!==T_WATER&&t!==T_MOUNT);
  if(k==='fish')return c!=='frost'&&ambShore(x,y,AMBIENT.fish.shore);
  if(k==='hare')return d<.6&&ambHabitat(k,x,y);
  if(k==='squirrel')return d<.4&&t===T_FOREST&&c!=='desert'&&near(AMBIENT.squirrel.near);
  if(k==='bat')return (timeOfDay()==='Dusk'||timeOfDay()==='Night')&&w==='clear'&&ambHabitat(k,x,y);
  if(k==='owl')return d>.55&&ambHabitat(k,x,y);
  if(k==='heron'||k==='duck')return d<.6&&w!=='storm'&&ambHabitat(k,x,y);
  if(k==='lizard'||k==='vulture')return d<.35&&w==='clear'&&ambHabitat(k,x,y);
  return false}
// (how many of kind k, × its numbers and its rate: birds fewer in foul weather, all fewer with reducedMotion)
// (the shared tame factor: fixed homes use a seeded check, so a quiet patch cannot be rerolled by moving the camera)
const ambWild=(x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return !(landHold(x,y)||nearTile(tx,ty,T_ROAD,1))||ambR()<AMBIENT.tame};
function ambMul(k){const w=ambWeather();let m=(reducedMotion()?AMBIENT.calm:1)*AMBIENT.density*(AMBIENT.hours[timeOfDay()]||1);if(AMB_BIRDS[k])m*=w==='storm'?AMBIENT.storm:w==='rain'?AMBIENT.rain:w==='snow'?AMBIENT.snow:1;return m}
// (whoever is about in the box, to scatter from)
function ambFigures(x0,y0,x1,y1){const out=[],add=o=>{if(o&&o.x>=x0&&o.x<=x1&&o.y>=y0&&o.y<=y1)out.push(o)};
  if(!P.stay)add(P);for(const o of W.parties)if(!o.dead&&!o.inside)add(o);for(const f of W.folk||[])if(f.st!=='in'&&f.st!=='town')add(f);
  for(const L of [W.caravans,W.refugees,W.monsters])for(const o of L||[])add(o);for(const e of roadList())if(!e.trace&&!e.gone)add(e);return out}
const ambNear=(F,x,y)=>{let b=null,bd=1e9;for(const o of F){const d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;b=o}}return [b,bd]};
// (the crows' places in view: a fight, a trace on the road (a body, a burnt wagon), ruins you know: [key, x, y])
function ambAnchors(){const out=[];for(const f of W.fights)out.push(['f'+f.id,f.x,f.y]);
  for(const e of roadList())if(e.trace&&!e.gone)out.push(['r'+e.i,e.x,e.y]);
  for(const s of W.sites)if(s.type==='ruins'&&s.seen)out.push(['s'+s.i,s.x,s.y]);
  for(const [key,p] of AMBV.meals)if(Clock.hours()<p.until)out.push([key,p.x,p.y]);
  for(const p of [P,...W.parties])if(!p.dead&&!p.inside&&!p.gone&&(p.tx!=null||p.state==='march'||p.order==='follow')){
    let n=0;for(const k in p.tc||{})n+=p.tc[k];if(n>=AMBIENT.homes.army)out.push(['a'+(p===P?'player':p.uid||p.name||p.id),p.x,p.y])}
  return out}
// a new one of kind k at (x, y) (its ground point: a flock's middle on its way over), each with its own fields
function ambSpawn(k,x,y){
  const A=AMBIENT[k],s=reducedMotion()?AMBIENT.slow:1,e={k,x,y,t:0,ph:ambR()*6.283,alt:0,m:null};
  if(k==='flock'){let ux=Math.cos(e.ph),uy=Math.sin(e.ph)*.7;const l=Math.hypot(ux,uy);ux/=l;uy/=l;const v=ambIn(A.speed)*s,D=vis()+AMBIENT.margin+24;
    Object.assign(e,{x:x-ux*D,y:y-uy*D,vx:ux*v,vy:uy*v,life:2*D/v,alt:ambIn(A.alt),m:[]});
    // (a loose V behind the first: each a little off its place, out of time with the next)
    for(let i=0,n=ambInt(A.n);i<n;i++){const r=Math.ceil(i/2),sd=i%2?1:-1,b=r*(4+ambR()*2),c=sd*r*(2.5+ambR()*2);e.m.push({dx:-ux*b-uy*c,dy:-uy*b+ux*c,ph:ambR()*6.283,da:(ambR()-.5)*8})}}
  else if(k==='peck'){e.life=ambIn(A.life);e.st='peck';e.m=[];for(let i=0,n=ambInt(A.n);i<n;i++)e.m.push({dx:Math.round((ambR()-.5)*12),dy:Math.round((ambR()-.5)*5),ph:ambR()*6.283,f:ambR()<.5?0:1})}
  else if(k==='crow'){e.m=[];const n=ambInt(A.n),dir=ambR()<.5?1:-1;for(let i=0;i<n;i++)e.m.push({r:ambIn(A.r),a:i*6.283/n+ambR()*.8,ph:ambR()*6.283,alt:ambIn(A.alt),w:A.spin*s*dir*(.8+ambR()*.4)})}
  else if(AMB_GLIDE[k])Object.assign(e,{cx:x,cy:y,h:e.ph,v:ambIn(A.speed)*s,alt:ambIn(A.alt),life:ambIn(A.life)});
  else if(k==='fly')Object.assign(e,{h:e.ph,v:ambIn(A.speed)*s,life:ambIn(A.life),col:AMB_PAL.fly[Math.floor(ambR()*AMB_PAL.fly.length)]});
  else if(k==='glow')Object.assign(e,{life:ambIn(A.life),z:2+ambR()*7});
  else if(k==='fish')e.life=A.life;
  else if(k==='hare')Object.assign(e,{life:ambIn(A.life),st:'sit',dir:ambR()<.5?1:-1,hop:1+ambR()*2,white:climAt(x,y)==='frost'?1:0});
  else if(k==='squirrel')Object.assign(e,{st:'sit',wait:ambIn(A.wait),dir:ambR()<.5?1:-1,dd:10+ambR()*6});
  else if(k==='heron'||k==='duck'||k==='lizard')Object.assign(e,{st:'sit',dir:ambR()<.5?1:-1,h:e.ph,v:ambIn(A.speed)*s,life:ambIn(A.life),run:0});
  return e}
// (the birds pecking, up and away from (fx, fy): each its own way, a little apart)
function ambScatter(e,fx,fy){ambQuiet(e);const A=AMBIENT.peck,s=reducedMotion()?AMBIENT.slow:1,a0=Math.atan2(e.y-fy,e.x-fx);e.st='fly';e.ft=e.t;
  for(const m of e.m){const a=a0+(ambR()-.5)*1.6,v=ambIn(A.speed)*s;Object.assign(m,{x:e.x+m.dx,y:e.y+m.dy,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,alt:0})}}
// one step of e, dt s: false once it is gone. F: who is about; inV(x, y): in the view and its margin
function ambStep(e,dt,F,inV){
  const A=AMBIENT[e.k],s=reducedMotion()?AMBIENT.slow:1;
  if(e.k==='flock'){
    if(e.route){const d=Math.hypot(e.route.x-e.x,e.route.y-e.y),a=Math.atan2(e.route.y-e.y,e.route.x-e.x)+(d>30?Math.sin(e.t*.9+e.ph)*.2:0),turn=Math.atan2(Math.sin(a-e.h),Math.cos(a-e.h));
      e.h+=Math.sign(turn)*Math.min(Math.abs(turn),AMBIENT.homes.turn*dt);const step=Math.min(d,e.v*dt);e.x+=Math.cos(e.h)*step;e.y+=Math.sin(e.h)*step;
      const alt=d<30?e.route.alt:AMBIENT.flock.alt[0];e.alt+=(alt-e.alt)*Math.min(1,dt*3);
      if(d<=2&&Math.abs(e.alt-e.route.alt)<1){const h=e.home,hk=e.hk,species=e.species,p=ambSpawn('peck',e.route.x,e.route.y),high=e.route.alt;Object.assign(e,p,{home:h,hk,species,alt:high});if(high){e.st='perch';e.perched=0}return true}return e.t<e.life}
    e.x+=e.vx*dt;e.y+=e.vy*dt;return e.t<e.life}
  if(e.k==='peck'&&e.home&&e.st==='peck'&&darkness()>=.35){
    if(e.home.roost){ambScatter(e,e.x+1,e.y);e.roost=e.home.roost}else return false;
  }
  if(e.k==='peck'){
    if(e.st==='perch'){e.perched+=dt;return e.perched<8}
    if(e.st==='peck'){const [o,d]=ambNear(F,e.x,e.y);if(d<A.scare)ambScatter(e,o.x,o.y);else if(e.t>e.life)ambScatter(e,e.x+ambR()-.5,e.y+ambR()-.5);return inV(e.x,e.y)}
    let any=false;for(const m of e.m){
      if(e.roost){const d=Math.hypot(e.roost.x-m.x,e.roost.y-m.y),step=Math.min(d,A.speed[0]*s*dt);if(d>2){m.x+=(e.roost.x-m.x)/d*step;m.y+=(e.roost.y-m.y)/d*step;any=true}m.alt+=(e.roost.alt-m.alt)*Math.min(1,dt*4)}
      else{m.x+=m.vx*dt;m.y+=m.vy*dt;m.alt=Math.min(A.top,m.alt+A.rise*s*dt);if(inV(m.x,m.y))any=true}}
    if(!any&&e.roost){e.x=e.roost.x;e.y=e.roost.y;e.alt=e.roost.alt;e.st='perch';e.perched=0;return true}return any&&e.t-e.ft<6}
  if(e.k==='crow')return true;
  if(AMB_GLIDE[e.k]){if(e.home&&!ambientCan(e.k,e.home.x,e.home.y))return false;e.h+=Math.sin(e.t*.6+e.ph)*.5*dt;
    if(e.t<e.life&&Math.hypot(e.x-e.cx,e.y-e.cy)>A.range){let dh=Math.atan2(e.cy-e.y,e.cx-e.x)-e.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));e.h+=Math.sign(dh)*Math.min(Math.abs(dh),1.2*dt)}
    e.x+=Math.cos(e.h)*e.v*dt;e.y+=Math.sin(e.h)*e.v*.7*dt;return e.t<e.life||inV(e.x,e.y)}
  if(e.k==='fly'){e.h+=Math.sin(e.t*2.3+e.ph)*2.4*dt;e.x+=Math.cos(e.h)*e.v*dt;e.y+=Math.sin(e.h)*e.v*.6*dt;return e.t<e.life}
  if(e.k==='glow'){e.x+=Math.sin(e.t*.8+e.ph)*5*dt;e.y+=Math.cos(e.t*.6+e.ph*1.7)*3*dt;return e.t<e.life}
  if(e.k==='fish')return e.t<e.life;
  if(e.k==='hare'){
    if(e.st==='sit'){const [o,d]=ambNear(F,e.x,e.y),scared=d<A.scare;
      if(scared||e.t>e.life){if(scared)ambQuiet(e);const a=scared?Math.atan2(e.y-o.y,e.x-o.x)+(ambR()-.5)*.8:ambR()*6.283;Object.assign(e,{st:'bolt',v:ambIn(A.speed)*s*(scared?1:.45),vx:Math.cos(a),vy:Math.sin(a)*.6,run:0,dir:Math.cos(a)<0?-1:1});return true}
      // (sitting: a short hop now and then, this way or that)
      if(e.t>e.hop){e.hx=e.t;e.hop=e.t+1.5+ambR()*3;e.dir=ambR()<.5?-1:1}if(e.hx!=null&&e.t-e.hx<.25&&!ambMove(e,e.dir*14*s*dt,0))e.dir=-e.dir;return inV(e.x,e.y)}
    if(!ambMove(e,e.vx*e.v*dt,e.vy*e.v*dt)){const a=Math.atan2(e.vy,e.vx);for(const turn of [.6,-.6,1.2,-1.2,1.57,-1.57]){const vx=Math.cos(a+turn),vy=Math.sin(a+turn)*.6;if(ambMove(e,vx*e.v*dt,vy*e.v*dt)){e.vx=vx;e.vy=vy;e.dir=vx<0?-1:1;break}}}e.run+=e.v*dt;return e.run<90&&inV(e.x,e.y)}
  if(e.k==='squirrel'){
    if(e.st==='sit'){const [o,d]=ambNear(F,e.x,e.y);if(d<A.scare){ambQuiet(e);Object.assign(e,{st:'dart',dir:e.x>=o.x?1:-1,v:ambIn(A.speed)*s,run:0})}else if(e.t>e.wait)Object.assign(e,{st:'dart',v:ambIn(A.speed)*s,run:0});return true}
    if(!ambMove(e,e.dir*e.v*dt,-e.v*.25*dt))e.dir=-e.dir;e.run+=e.v*dt;return e.run<e.dd}
  if(e.k==='heron'||e.k==='duck'||e.k==='lizard'){
    const [o,d]=ambNear(F,e.x,e.y),scared=d<A.scare;if(scared&&e.st==='sit'){ambQuiet(e);e.st='flee';e.ft=e.t;e.h=Math.atan2(e.y-o.y,e.x-o.x)}
    if(e.k==='heron'&&e.st==='flee'){e.x+=Math.cos(e.h)*e.v*dt;e.y+=Math.sin(e.h)*e.v*dt;e.alt=Math.min(28,e.alt+16*s*dt);return e.t-e.ft<4&&inV(e.x,e.y)}
    if(e.k==='duck'||e.st==='flee'){const v=e.v*(scared?2:1);e.h+=Math.sin(e.t+e.ph)*dt*.5;if(!ambMove(e,Math.cos(e.h)*v*dt,Math.sin(e.h)*v*.6*dt))e.h+=Math.PI;e.dir=Math.cos(e.h)<0?-1:1}
    return e.t<e.life&&(!e.home||ambientCan(e.k,e.x,e.y))&&inV(e.x,e.y)}

  return false}
/* each frame of the map (render.js drawWorld, while the frame's list is made): every one stepped on real time, the gone let go,
   new ones born, and those on the ground put on the list by their feet (ents: drawn with everyone, behind what stands in front:
   depth.js worldOverdraw; nf: nothing over them fades for them). V: your sight */
function ambientWorld(ents,cam,V){
  const S=AMBV,L=S.list;if(!AMBIENT.on){L.length=0;S.t=0;return}
  const now=performance.now()/1000,dt=S.t?Math.min(.1,Math.max(0,now-S.t)):0;S.t=now;
  ambMemory();const homes=ambHomeView(cam,V);
  const g=AMBIENT.margin,x0=cam.x-g,y0=cam.y-g,x1=cam.x+VW+g,y1=cam.y+VH+g,inV=(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1,F=ambFigures(x0,y0,x1,y1),n={},anc=new Map();
  for(const a of ambAnchors())if(inV(a[1],a[2])&&inSight(a[1],a[2]))anc.set(a[0],a);
  for(let i=L.length-1;i>=0;i--){const e=L[i];e.t+=dt;let keep=ambStep(e,dt,F,inV);
    // (crows stay while their place is there to see; then they fade over a second)
    if(e.k==='crow'){const a=anc.get(e.ak);if(a){e.x=a[1];e.y=a[2];e.go=0}else e.go=(e.go||0)+dt;keep=e.go<1}
    if(!keep||e.home&&!inV(e.x,e.y)&&e.k!=='flock'){L.splice(i,1);continue}n[e.k]=(n[e.k]||0)+1}
  for(const k of AMB_KINDS){const A=AMBIENT[k],mul=ambMul(k);if((n[k]||0)>=Math.max(1,Math.round(A.max*mul))||!(ambR()<dt/A.every*mul))continue;
    if(k==='crow'){const have=new Set(L.filter(e=>e.k==='crow').map(e=>e.ak)),a=[...anc.values()].find(a=>!have.has(a[0]));if(a&&ambientCan(k,a[1],a[2]))L.push(Object.assign(ambSpawn(k,a[1],a[2]),{ak:a[0],species:climAt(a[1],a[2])==='desert'?'vulture':climAt(a[1],a[2])==='frost'?'raven':'crow'}));continue}
    const have=new Set(L.map(e=>e.hk));const candidates=homes.filter(h=>h.k===k&&!have.has(h.key)&&!S.quiet.has(h.key)&&inV(h.x,h.y)&&ambientCan(k,h.x,h.y)&&!(A.scare&&ambNear(F,h.x,h.y)[1]<A.scare*1.6));
    if(candidates.length){const h=candidates[Math.floor(ambR()*candidates.length)];L.push(ambPlace(ambSpawn(k,h.x,h.y),h))}}
  for(const e of L)if(AMB_GROUND[e.k]&&!(e.k==='peck'&&e.st!=='peck'&&e.st!=='perch')&&!(e.k==='heron'&&e.st==='flee'))ents.push({y:e.y,nf:1,f:()=>ambGround(e,cam)})}
// ---- the pictures: tiny, crisp, made once (rows of letters, each a colour; '.' clear), each also facing left
let AMBS=null;
const AMB_PAL={fly:['#f4f0dc','#f0e08a','#c8dcf0','#f0c8d8']};
function ambPic(rows,pal){return mkc(rows[0].length,rows.length,g=>rows.forEach((r,y)=>{for(let x=0;x<r.length;x++){const c=pal[r[x]];if(c){g.fillStyle=c;g.fillRect(x,y,1,1)}}}))}
const ambFlip=s=>mkc(s.width,s.height,g=>{g.translate(s.width,0);g.scale(-1,1);g.drawImage(s,0,0)});
function ambSpr(){if(AMBS)return AMBS;const both=s=>[s,ambFlip(s)],small=[['x...x','.xbx.'],['.xbx.','x...x']],
    big=[['x...x','.x.x.','..x..'],['.....','xx.xx','..x..'],['.....','.xxx.','x.x.x']],
    hare=[['....d.','...bd.','.bbbbe','wbbbb.','.bb.b.'],['.....d','....bd','.bbbbe','wbb...','b.....']],
    sq=[['t..d.','tt.rr','.trr.','..rr.','..r.r'],['.....','tt...','.trrr','.rr.r','r....']];
  return AMBS={brown:small.map(r=>ambPic(r,{x:'#5a4430',b:'#7a5c3c'})),
    // (big birds: wings up, gliding, down; the battle's pale wood pigeons, seen against the trees they leave)
    flock:big.map(r=>ambPic(r,{x:'#2a2a32'})),crow:big.map(r=>ambPic(r,{x:'#16161c'})),bird:big.map(r=>ambPic(r.map(s=>s.replace(/^x/,'t').replace(/x$/,'t')),{x:'#d4d2c8',t:'#4a4a52'})),gull:big.map(r=>ambPic(r.map(s=>s.replace(/^x/,'t').replace(/x$/,'t')),{x:'#f0f2ee',t:'#7e848e'})),
    sparrow:[['..h','bbb','.l.'],['...','bbb','.lh']].map(r=>both(ambPic(r,{b:'#7a5c3c',h:'#54402a',l:'#3a2c1e'}))),
    hare:[{b:'#8c7054',d:'#6a523c',e:'#1e1610',w:'#ece4d4'},{b:'#e6eaf0',d:'#b4bcc8',e:'#2a2a30',w:'#ffffff'}].map(p=>hare.map(r=>both(ambPic(r,p)))),
    squirrel:sq.map(r=>both(ambPic(r,{t:'#c4703a',r:'#a4562a',d:'#6e381a'}))),
    pigeon:[['..h','bbb','.l.'],['...','bbb','.lh']].map(r=>both(ambPic(r,{b:'#9c9da8',h:'#596477',l:'#ae7964'}))),
    raven:[['..h','bbb','.l.'],['...','bbb','.lh']].map(r=>both(ambPic(r,{b:'#30323c',h:'#191d28',l:'#515567'}))),
    bat:[['x...x','xxxxx','.x.x.'],['.....','xxxxx','..x..'],['.....','.xxx.','x.x.x']].map(r=>ambPic(r,{x:'#5d4668'})),
    owl:big.map(r=>ambPic(r,{x:'#c5aa7b'})),ravenAir:big.map(r=>ambPic(r,{x:'#303644'})),vulture:big.map(r=>ambPic(r,{x:'#685545'})),
    heron:both(ambPic(['...hh','...nb','...n.','bbbb.','.bb..','.l.l.','.l.l.'],{h:'#6b838c',n:'#c4d0c9',b:'#809699',l:'#705a38'})),
    duck:both(ambPic(['...hhb','...hh.','.bbbb.','bbbbb.','.llll.'],{h:'#51775c',b:'#a38258',l:'#d3b382'})),
    lizard:both(ambPic(['.....h.','ttbbbbh','..l..l.'],{h:'#bfa270',t:'#9a794b',b:'#b0925b',l:'#785d3a'}))}}
// (a big bird's wings by its clock: gliding mostly, a few flaps now and then; held gliding with reducedMotion)
const ambWing=(t,rm)=>{const c=((t%4)+4)%4;return rm||c>.7?1:Math.floor(c*8)%2?2:0};
// one on the ground, drawn with everyone (at its place to 1/VS px, its parts in whole game px)
function ambGround(e,cam){const S=ambSpr(),X=snapV(e.x)-cam.x,Y=snapV(e.y)-cam.y;
  if(e.k==='peck'){for(const m of e.m){const s=(S[e.species]||S.sparrow)[Math.floor(e.t*1.6+m.ph*3)%3===0?1:0][m.f];ctx.drawImage(s,X+m.dx-1,Y+m.dy-2-(e.alt||0))}return}
  if(e.k==='fly'){const a=Math.min(1,e.t/.6,(e.life-e.t)/.6),hv=Math.round(3+Math.sin(e.t*7+e.ph)*1.5);if(a<=0)return;ctx.globalAlpha=a;ctx.fillStyle=e.col;
    if(Math.floor(e.t*11+e.ph)%2)ctx.fillRect(X-1,Y-hv,2,1);else ctx.fillRect(X,Y-hv,1,1);ctx.globalAlpha=1;return}
  if(e.k==='heron'||e.k==='duck'||e.k==='lizard'){const sp=S[e.k][e.dir<0?1:0];ctx.globalAlpha=Math.max(0,Math.min(1,e.t/.6,(e.life-e.t)/.6));
    ctx.drawImage(sp,X-(sp.width>>1),Y-sp.height+1);ctx.globalAlpha=1;return}
  let s,a=1;
  if(e.k==='hare'){const go=e.st==='bolt'||e.hx!=null&&e.t-e.hx<.25;s=S.hare[e.white][go&&Math.floor(e.t*9)%2?1:0][e.dir<0?1:0];if(e.st==='bolt')a=Math.max(0,Math.min(1,(90-e.run)/30))}
  else{s=S.squirrel[e.st==='dart'?1:0][e.dir<0?1:0];a=e.st==='dart'?Math.max(0,Math.min(1,1-(e.run/e.dd-.55)/.45)):Math.min(1,e.t*4)}
  if(a<=0)return;ctx.globalAlpha=a;ctx.drawImage(s,X-(s.width>>1),Y-s.height+1);ctx.globalAlpha=1}
// (each bird of e in the air: f(x, y: its ground point, alt: px up, its picture now, alpha))
function ambBirds(e,f){const S=ambSpr(),rm=reducedMotion();
  if(e.k==='flock'){const a=Math.max(0,Math.min(1,e.t/.8,(e.life-e.t)/.8));for(const m of e.m){const dx=e.route?-Math.cos(e.h)*m.back-Math.sin(e.h)*m.side:m.dx,dy=e.route?-Math.sin(e.h)*m.back+Math.cos(e.h)*m.side:m.dy;f(e.x+dx+Math.sin(e.t*1.3+m.ph)*1.2,e.y+dy,e.alt+m.da,(e.species==='raven'?S.ravenAir:e.species==='pigeon'?S.bird:S.flock)[ambWing(e.t+m.ph,rm)],a)}}
  else if(e.k==='peck'){if(e.st!=='fly')return;const a=Math.max(0,Math.min(1,6-(e.t-e.ft)));for(const m of e.m)f(m.x,m.y,m.alt,S.brown[Math.floor(e.t*(rm?5:9)+m.ph)%2],a)}
  else if(e.k==='crow'){const a=Math.max(0,Math.min(1,e.t,1-(e.go||0)));for(const m of e.m){const an=m.a+m.w*e.t;f(e.x+Math.cos(an)*m.r,e.y+Math.sin(an)*m.r*.5,m.alt+Math.sin(e.t*.7+m.ph)*2,(S[e.species==='raven'?'ravenAir':e.species]||S.crow)[ambWing(e.t+m.ph,rm)],a)}}
  else if(AMB_GLIDE[e.k])f(e.x,e.y,e.alt+Math.sin(e.t*.5+e.ph)*3,S[e.k][e.k==='bat'&&!rm?Math.floor(e.t*9)%3:ambWing(e.t*1.1+e.ph,rm)],Math.max(0,Math.min(1,e.t/.8,(e.life-e.t)/.8)));
  else if(e.k==='heron'&&e.st==='flee')f(e.x,e.y,e.alt,S.bird[ambWing(e.t,rm)],Math.max(0,Math.min(1,4-(e.t-e.ft))))}
// flat on the ground, under everyone (render.js drawWorld): the fish's leaps and splashes, and the flyers' shadows, offset from
// under them as the sun throws them
function ambientFlat(cam){
  const L=AMBV.list;if(!AMBIENT.on||!L.length)return;ctx.save();ctx.fillStyle='rgb('+SHADOW.col.join(',')+')';
  for(const e of L){if(e.k==='fish')continue;ambBirds(e,(x,y,alt,s,a)=>{const w=s.width>3?3:2,sh=ambShadow(alt);ctx.globalAlpha=.22*a;ctx.fillRect(snapV(x+sh[0])-cam.x-(w>>1),snapV(y+sh[1])-cam.y,w,1)})}
  for(const e of L){if(e.k!=='fish')continue;const p=e.t/e.life,X=snapV(e.x)-cam.x,Y=snapV(e.y)-cam.y;
    if(p<.3){const q=p/.3;ctx.globalAlpha=1;ctx.fillStyle='#c8d4dc';ctx.fillRect(X-2+Math.round(q*4),Y-Math.round(Math.sin(q*Math.PI)*4),2,1)}
    else{const q=(p-.3)/.7,r=1+Math.round(q*4),ry=Math.max(1,Math.round(r*.45));ctx.globalAlpha=.8*(1-q);ctx.fillStyle='#e8f2f4';
      for(let dx=-r;dx<=r;dx++){const dy=Math.round(ry*Math.sqrt(Math.max(0,1-(dx/(r+.5))**2)));ctx.fillRect(X+dx,Y-dy,1,1);if(dy)ctx.fillRect(X+dx,Y+dy,1,1)}
      if(q<.4){ctx.fillRect(X-1,Y-2-Math.round(q*4),1,1);ctx.fillRect(X+1,Y-1-Math.round(q*5),1,1)}}}
  ctx.restore()}
// in the air, over everyone (render.js drawWorld: before the fog, which puts what is out of your sight under it)
function ambientAir(cam){const L=AMBV.list;if(!AMBIENT.on||!L.length)return;ctx.save();
  for(const e of L)ambBirds(e,(x,y,alt,s,a)=>{if(a<=0)return;ctx.globalAlpha=a;ctx.drawImage(s,snapV(x)-cam.x-(s.width>>1),snapV(y-alt)-cam.y-1)});
  ctx.restore()}
// the fireflies' light, over the night (render.js drawWorld, after the dark): only in your sight, and in a wood only near you
function ambientGlow(cam){const L=AMBV.list;if(!AMBIENT.on||!L.some(e=>e.k==='glow'))return;const V=vis(),gn=AMBIENT.glow.near,dk=darkness(),rm=reducedMotion();ctx.save();ctx.globalCompositeOperation='lighter';
  for(const e of L){if(e.k!=='glow'||!inSight(e.x,e.y)||terrAt(e.x,e.y)===T_FOREST&&Math.hypot(e.x-P.x,e.y-P.y)>=V*gn)continue;
    const b=Math.max(0,Math.sin(e.t*(rm?1:2.2)+e.ph)),a=b*b*Math.max(0,Math.min(1,e.t/.8,(e.life-e.t)/.8))*dk;if(a<.03)continue;const X=snapV(e.x)-cam.x,Y=snapV(e.y-e.z)-cam.y;
    ctx.globalAlpha=a*.35;ctx.fillStyle='#9ad040';ctx.fillRect(X-1,Y,3,1);ctx.fillRect(X,Y-1,1,3);ctx.globalAlpha=a;ctx.fillStyle='#eaff8c';ctx.fillRect(X,Y,1,1)}
  ctx.restore()}
/* ---------- in battle (render.js drawBattle, in the field's px under its camera, before its fog of war): as a battle begins (its
   deployment over, or at once without one) a few birds burst out of trees in view (the field's own: engine/ground.js props, dk
   1; a field without trees has none), and once it is over crows come circling over the fallen nearest the middle of the view.
   AMBV.bt: this battle's (b: which battle), dropped with it ---------- */
function ambientBattle(){
  if(!AMBIENT.on||!B)return;const now=performance.now()/1000;let S=AMBV.bt;if(!S||S.b!==B)S=AMBV.bt={b:B,burst:false,crows:false,list:[],t:now};
  const dt=Math.min(.1,Math.max(0,now-S.t));S.t=now;
  if(!S.burst&&!B.deploy){S.burst=true;ambBurst(S)}
  if(!S.crows&&B.over){S.crows=true;ambFieldCrows(S)}
  if(!S.list.length)return;const z=B.cam?B.cam.z:1,sn=v=>Math.round(v*z)/z,Sp=ambSpr(),rm=reducedMotion();
  for(const b of S.list){b.t+=dt;if(b.k==='crow'){b.a+=b.w*dt;b.x=b.cx+Math.cos(b.a)*b.r;b.y=b.cy+Math.sin(b.a)*b.r*.5}else if(b.t>b.d){b.x+=b.vx*dt;b.y+=b.vy*dt;b.alt+=b.va*dt}}
  S.list=S.list.filter(b=>b.t<b.life);
  const al=b=>b.k==='crow'?Math.min(1,b.t/.8):Math.max(0,Math.min(1,(b.life-b.t)/.6));
  ctx.save();ctx.fillStyle='rgb('+SHADOW.col.join(',')+')';
  for(const b of S.list){if(b.k!=='crow'&&b.t<=b.d)continue;const sh=ambShadow(b.alt);ctx.globalAlpha=.22*al(b);ctx.fillRect(sn(b.x+sh[0])-1,sn(b.y+sh[1]),3,1)}
  for(const b of S.list){if(b.k!=='crow'&&b.t<=b.d)continue;const s=b.k==='crow'?Sp.crow[ambWing(b.t+b.ph,rm)]:Sp.bird[rm?1:Math.floor(b.t*10+b.ph)%2?0:2];ctx.globalAlpha=al(b);ctx.drawImage(s,sn(b.x)-2,sn(b.y-b.alt)-1)}
  ctx.restore()}
// (the birds out of the trees: trees trees in view (toward its middle), n birds each, off every way from its crown, one after another)
function ambBurst(S){const A=AMBIENT.battle,T=B.ground&&B.ground.props;if(!T)return;const c=B.cam,z=c?c.z:1,vx=c?c.x:0,vy=c?c.y:0,w=BVW/z,h=BVH/z,s=reducedMotion()?AMBIENT.slow:1;
  const inB=(p,f,g)=>p.dk===1&&p.x>=vx+w*f&&p.x<=vx+w*(1-f)&&p.y>=vy+h*g+16&&p.y<=vy+h*(1-g)+16,mid=T.filter(p=>inB(p,.2,.15)),trees=mid.length?mid:T.filter(p=>inB(p,0,0));// (the middle of the view first)
  for(let i=0,k=Math.max(1,Math.round(ambInt(A.trees)*(reducedMotion()?AMBIENT.calm:1)));i<k&&trees.length;i++){const p=trees.splice(Math.floor(ambR()*trees.length),1)[0],top=Math.max(8,(p.y-p.box[1])*.7);
    for(let q=0,n=ambInt(A.n);q<n;q++){const a=ambR()*6.283,v=ambIn(A.speed)*s;S.list.push({k:'bird',x:p.x+(ambR()-.5)*8,y:p.y,alt:top,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,va:ambIn(A.rise)*s,t:0,d:ambR()*.5,life:A.life,ph:ambR()*6.283})}}}
// (crows over the fallen nearest the middle of the view, or its middle when none fell)
function ambFieldCrows(S){const A=AMBIENT.battle,c=B.cam,z=c?c.z:1,mx=(c?c.x:0)+BVW/z/2,my=(c?c.y:0)+BVH/z/2,cs=B.corpses||[];
  const o=cs.length?cs.reduce((a,b)=>Math.hypot(b.x-mx,b.y-my)<Math.hypot(a.x-mx,a.y-my)?b:a):{x:mx,y:my},dir=ambR()<.5?1:-1;
  for(let i=0,n=Math.max(2,Math.round(ambInt(A.crows)*(reducedMotion()?AMBIENT.calm:1)));i<n;i++)S.list.push({k:'crow',cx:o.x,cy:o.y,r:ambIn(A.r),a:ambR()*6.283,w:A.spin*dir*(.8+ambR()*.4)*(reducedMotion()?AMBIENT.slow:1),alt:ambIn(A.alt),ph:ambR()*6.283,t:0,d:0,life:1e9,x:o.x,y:o.y})}
