'use strict';
/* ---------- ambient life (owner, 2026-10-19): flocks crossing the sky, birds pecking in the fields, crows over a fight, gulls on
   the shore, butterflies, fireflies, fish jumping, a hare or a squirrel on the world map, and a few birds in battle. Drawn only:
   never saved, nothing in W, nothing the simulation reads, and never a draw of Math.random (its own little PRNG, ambR, seeded
   from the clock and where you stand, as mist.js keeps its own). Real time, so it lives while paused, as the water does.
   Only where you see: each is born in your sight (fog.js inSight; in a wood only near you, as parties.js spotted), within the
   view and AMBIENT.margin px round it, and gone once out of it; what flies out of your sight goes under the fog with the rest
   (render.js fogMem). Each kind has its place and its hours (ambientCan) and its rate (every: s between new ones, on average;
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
const AMBIENT={margin:40,storm:.3,rain:.6,snow:.5,calm:.5,slow:.6,density:1,hours:{Dawn:1.5,Dusk:1.5,Midday:.6},tame:.5,
  // a flock over: n birds, at speed px a second, alt px up, its shadow on the ground below
  flock:{every:25,max:1,n:[3,7],speed:[24,34],alt:[46,72]},
  // birds pecking on open ground, a field's or one within near tiles of a holding (elsewhere away × as often); off they fly
  // when anyone comes within scare px (or after life s), climbing rise px a second to top px up
  peck:{every:12,max:1,n:[2,4],near:10,away:.3,scare:30,life:[14,28],speed:[50,70],rise:30,top:42},
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
  // battle: birds out of trees trees (n each), flying off at speed, climbing rise px a second; crows over the fallen
  battle:{trees:[2,3],n:[3,5],speed:[44,70],rise:[22,34],life:5,crows:[3,5],r:[24,46],alt:[36,56],spin:.4}};
Object.defineProperty(AMBIENT,'on',{get:()=>prefGet('ambient'),set:v=>{PREFS.ambient.v=!!v},enumerable:true});
const AMB_KINDS=['flock','peck','crow','gull','fly','glow','fish','hare','squirrel'],AMB_BIRDS={flock:1,peck:1,crow:1,gull:1},AMB_GROUND={peck:1,hare:1,squirrel:1,fly:1};
// (kept between frames, drawn only: the map's (list), the clock they last stepped at (t), the PRNG's state (q), the battle's (bt))
const AMBV={list:[],t:0,q:0,bt:null};
onWorld(()=>{AMBV.list.length=0;AMBV.t=0});
// (its own PRNG, never Math.random: seeded once from the clock and where you stand)
function ambR(){if(!AMBV.q)AMBV.q=((Date.now()%2147483647)^Math.imul(Math.round(P.x)*73856093^Math.round(P.y)*19349663,1))>>>0||1;
  const q=AMBV.q=AMBV.q+0x6d2b79f5|0;let z=Math.imul(q^q>>>15,1|q);z=z+Math.imul(z^z>>>7,61|z)^z;return ((z^z>>>14)>>>0)/4294967296}
const ambIn=a=>a[0]+ambR()*(a[1]-a[0]);
const ambInt=a=>Math.floor(a[0]+ambR()*(a[1]-a[0]+1));
// the weather where you are: the map has none of its own yet but the snow falling in the frost (worldart.js drawEnv; a storm on
// the road is a line in the log, events.js), so 'snow' there, else 'clear'; 'rain' and 'storm' are read too, for when it has them
function ambWeather(){return climAt(P.x,P.y)==='frost'?'snow':'clear'}
// (what stands on a tile, for the life on the ground: 0 nothing, 1 a lot's field, 2 a building or a camp's ground: lots.js OCC)
function ambLot(tx,ty){const id=OCC?occAt(tx,ty):0;if(!id)return 0;const l=id>0&&LOT[id];if(!l)return 2;return tx>=l.x&&tx<l.x+l.n&&ty>=l.y&&ty<l.y+l.n?2:1}
// (water with land within r tiles: a shore, a lake, a river)
function ambShore(x,y,r){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tAt(tx,ty)!==T_WATER)return false;
  for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){const a=tx+i,b=ty+j;if(a>=0&&b>=0&&a<MW&&b<MH&&tAt(a,b)!==T_WATER)return true}return false}
// may one of kind k be born at (x, y) now: in your sight, on its ground, at its hours, in its weather
function ambientCan(k,x,y){
  if(!inSight(x,y))return false;
  const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),t=tAt(tx,ty),c=climAt(x,y),w=ambWeather(),d=darkness(),near=f=>Math.hypot(x-P.x,y-P.y)<vis()*f;
  if(k==='flock')return d<.35;
  if(k==='peck'){if(!(d<.35&&t===T_OPEN&&w!=='storm'))return false;const L=ambLot(tx,ty);if(L===2)return false;if(L===1)return true;const h=nearestOf({x,y},TOWNS);return !!h&&Math.hypot(h.x-x,h.y-y)<AMBIENT.peck.near*TILE}
  if(k==='crow')return d<.6;
  if(k==='gull')return d<.35&&ambShore(x,y,AMBIENT.gull.shore);
  if(k==='fly')return d<.1&&w==='clear'&&(c==='grass'||c==='swamp')&&t===T_OPEN&&ambLot(tx,ty)<2;
  if(k==='glow')return d>.55&&w==='clear'&&(c==='grass'||c==='swamp')&&(t===T_FOREST?near(AMBIENT.glow.near):c==='swamp'&&t!==T_WATER&&t!==T_MOUNT);
  if(k==='fish')return c!=='frost'&&ambShore(x,y,AMBIENT.fish.shore);
  if(k==='hare')return d<.6&&t===T_OPEN&&c!=='desert'&&ambLot(tx,ty)<2;
  if(k==='squirrel')return d<.4&&t===T_FOREST&&c!=='desert'&&near(AMBIENT.squirrel.near);
  return false}
// (how many of kind k, × its numbers and its rate: birds fewer in foul weather, all fewer with reducedMotion)
// (a spot on a holding's land or by a road kept only tame of the time: life keeps to the wilds and the marsh)
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
  for(const s of W.sites)if(s.type==='ruins'&&s.seen)out.push(['s'+s.i,s.x,s.y]);return out}
// a new one of kind k at (x, y) (its ground point: a flock's middle on its way over), each with its own fields
function ambSpawn(k,x,y){
  const A=AMBIENT[k],s=reducedMotion()?AMBIENT.slow:1,e={k,x,y,t:0,ph:ambR()*6.283,alt:0,m:null};
  if(k==='flock'){let ux=Math.cos(e.ph),uy=Math.sin(e.ph)*.7;const l=Math.hypot(ux,uy);ux/=l;uy/=l;const v=ambIn(A.speed)*s,D=vis()+AMBIENT.margin+24;
    Object.assign(e,{x:x-ux*D,y:y-uy*D,vx:ux*v,vy:uy*v,life:2*D/v,alt:ambIn(A.alt),m:[]});
    // (a loose V behind the first: each a little off its place, out of time with the next)
    for(let i=0,n=ambInt(A.n);i<n;i++){const r=Math.ceil(i/2),sd=i%2?1:-1,b=r*(4+ambR()*2),c=sd*r*(2.5+ambR()*2);e.m.push({dx:-ux*b-uy*c,dy:-uy*b+ux*c,ph:ambR()*6.283,da:(ambR()-.5)*8})}}
  else if(k==='peck'){e.life=ambIn(A.life);e.st='peck';e.m=[];for(let i=0,n=ambInt(A.n);i<n;i++)e.m.push({dx:Math.round((ambR()-.5)*12),dy:Math.round((ambR()-.5)*5),ph:ambR()*6.283,f:ambR()<.5?0:1})}
  else if(k==='crow'){e.m=[];const n=ambInt(A.n),dir=ambR()<.5?1:-1;for(let i=0;i<n;i++)e.m.push({r:ambIn(A.r),a:i*6.283/n+ambR()*.8,ph:ambR()*6.283,alt:ambIn(A.alt),w:A.spin*s*dir*(.8+ambR()*.4)})}
  else if(k==='gull')Object.assign(e,{cx:x,cy:y,h:e.ph,v:ambIn(A.speed)*s,alt:ambIn(A.alt),life:ambIn(A.life)});
  else if(k==='fly')Object.assign(e,{h:e.ph,v:ambIn(A.speed)*s,life:ambIn(A.life),col:AMB_PAL.fly[Math.floor(ambR()*AMB_PAL.fly.length)]});
  else if(k==='glow')Object.assign(e,{life:ambIn(A.life),z:2+ambR()*7});
  else if(k==='fish')e.life=A.life;
  else if(k==='hare')Object.assign(e,{life:ambIn(A.life),st:'sit',dir:ambR()<.5?1:-1,hop:1+ambR()*2,white:climAt(x,y)==='frost'?1:0});
  else if(k==='squirrel')Object.assign(e,{st:'sit',wait:ambIn(A.wait),dir:ambR()<.5?1:-1,dd:10+ambR()*6});
  return e}
// (the birds pecking, up and away from (fx, fy): each its own way, a little apart)
function ambScatter(e,fx,fy){const A=AMBIENT.peck,s=reducedMotion()?AMBIENT.slow:1,a0=Math.atan2(e.y-fy,e.x-fx);e.st='fly';e.ft=e.t;
  for(const m of e.m){const a=a0+(ambR()-.5)*1.6,v=ambIn(A.speed)*s;Object.assign(m,{x:e.x+m.dx,y:e.y+m.dy,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,alt:0})}}
// one step of e, dt s: false once it is gone. F: who is about; inV(x, y): in the view and its margin
function ambStep(e,dt,F,inV){
  const A=AMBIENT[e.k],s=reducedMotion()?AMBIENT.slow:1;
  if(e.k==='flock'){e.x+=e.vx*dt;e.y+=e.vy*dt;return e.t<e.life}
  if(e.k==='peck'){
    if(e.st==='peck'){const [o,d]=ambNear(F,e.x,e.y);if(d<A.scare)ambScatter(e,o.x,o.y);else if(e.t>e.life)ambScatter(e,e.x+ambR()-.5,e.y+ambR()-.5);return inV(e.x,e.y)}
    let any=false;for(const m of e.m){m.x+=m.vx*dt;m.y+=m.vy*dt;m.alt=Math.min(A.top,m.alt+A.rise*s*dt);if(inV(m.x,m.y))any=true}return any&&e.t-e.ft<6}
  if(e.k==='crow')return true;
  if(e.k==='gull'){e.h+=Math.sin(e.t*.6+e.ph)*.5*dt;
    if(e.t<e.life&&Math.hypot(e.x-e.cx,e.y-e.cy)>A.range){let dh=Math.atan2(e.cy-e.y,e.cx-e.x)-e.h;dh=Math.atan2(Math.sin(dh),Math.cos(dh));e.h+=Math.sign(dh)*Math.min(Math.abs(dh),1.2*dt)}
    e.x+=Math.cos(e.h)*e.v*dt;e.y+=Math.sin(e.h)*e.v*.7*dt;return e.t<e.life||inV(e.x,e.y)}
  if(e.k==='fly'){e.h+=Math.sin(e.t*2.3+e.ph)*2.4*dt;e.x+=Math.cos(e.h)*e.v*dt;e.y+=Math.sin(e.h)*e.v*.6*dt;return e.t<e.life}
  if(e.k==='glow'){e.x+=Math.sin(e.t*.8+e.ph)*5*dt;e.y+=Math.cos(e.t*.6+e.ph*1.7)*3*dt;return e.t<e.life}
  if(e.k==='fish')return e.t<e.life;
  if(e.k==='hare'){
    if(e.st==='sit'){const [o,d]=ambNear(F,e.x,e.y),scared=d<A.scare;
      if(scared||e.t>e.life){const a=scared?Math.atan2(e.y-o.y,e.x-o.x)+(ambR()-.5)*.8:ambR()*6.283;Object.assign(e,{st:'bolt',v:ambIn(A.speed)*s*(scared?1:.45),vx:Math.cos(a),vy:Math.sin(a)*.6,run:0,dir:Math.cos(a)<0?-1:1});return true}
      // (sitting: a short hop now and then, this way or that)
      if(e.t>e.hop){e.hx=e.t;e.hop=e.t+1.5+ambR()*3;e.dir=ambR()<.5?-1:1}if(e.hx!=null&&e.t-e.hx<.25)e.x+=e.dir*14*s*dt;return inV(e.x,e.y)}
    e.x+=e.vx*e.v*dt;e.y+=e.vy*e.v*dt;e.run+=e.v*dt;return e.run<90&&inV(e.x,e.y)}
  if(e.k==='squirrel'){
    if(e.st==='sit'){if(ambNear(F,e.x,e.y)[1]<A.scare||e.t>e.wait)Object.assign(e,{st:'dart',v:ambIn(A.speed)*s,run:0});return true}
    e.x+=e.dir*e.v*dt;e.y-=e.v*.25*dt;e.run+=e.v*dt;return e.run<e.dd}
  return false}
/* each frame of the map (render.js drawWorld, while the frame's list is made): every one stepped on real time, the gone let go,
   new ones born, and those on the ground put on the list by their feet (ents: drawn with everyone, behind what stands in front:
   depth.js worldOverdraw; nf: nothing over them fades for them). V: your sight */
function ambientWorld(ents,cam,V){
  const S=AMBV,L=S.list;if(!AMBIENT.on){L.length=0;S.t=0;return}
  const now=performance.now()/1000,dt=S.t?Math.min(.1,Math.max(0,now-S.t)):0;S.t=now;
  const g=AMBIENT.margin,x0=cam.x-g,y0=cam.y-g,x1=cam.x+VW+g,y1=cam.y+VH+g,inV=(x,y)=>x>=x0&&x<=x1&&y>=y0&&y<=y1,F=ambFigures(x0,y0,x1,y1),n={},anc=new Map();
  for(const a of ambAnchors())if(inV(a[1],a[2])&&inSight(a[1],a[2]))anc.set(a[0],a);
  for(let i=L.length-1;i>=0;i--){const e=L[i];e.t+=dt;let keep=ambStep(e,dt,F,inV);
    // (crows stay while their place is there to see; then they fade over a second)
    if(e.k==='crow'){const a=anc.get(e.ak);if(a){e.x=a[1];e.y=a[2];e.go=0}else e.go=(e.go||0)+dt;keep=e.go<1}
    if(!keep){L.splice(i,1);continue}n[e.k]=(n[e.k]||0)+1}
  for(const k of AMB_KINDS){const A=AMBIENT[k],mul=ambMul(k);if((n[k]||0)>=Math.max(1,Math.round(A.max*mul))||!(ambR()<dt/A.every*mul))continue;
    if(k==='crow'){const have=new Set(L.filter(e=>e.k==='crow').map(e=>e.ak)),a=[...anc.values()].find(a=>!have.has(a[0]));if(a&&ambientCan(k,a[1],a[2]))L.push(Object.assign(ambSpawn(k,a[1],a[2]),{ak:a[0]}));continue}
    // (a few tries at a spot in your sight)
    for(let j=0;j<4;j++){const r=V*.92*Math.sqrt(ambR()),a=ambR()*6.283,x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r;
      if(inV(x,y)&&ambientCan(k,x,y)&&!(A.scare&&ambNear(F,x,y)[1]<A.scare*1.6)&&ambWild(x,y)){L.push(ambSpawn(k,x,y));break}}}
  for(const e of L)if(AMB_GROUND[e.k]&&!(e.k==='peck'&&e.st!=='peck'))ents.push({y:e.y,nf:1,f:()=>ambGround(e,cam)})}
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
    squirrel:sq.map(r=>both(ambPic(r,{t:'#c4703a',r:'#a4562a',d:'#6e381a'})))}}
// (a big bird's wings by its clock: gliding mostly, a few flaps now and then; held gliding with reducedMotion)
const ambWing=(t,rm)=>{const c=((t%4)+4)%4;return rm||c>.7?1:Math.floor(c*8)%2?2:0};
// one on the ground, drawn with everyone (at its place to 1/VS px, its parts in whole game px)
function ambGround(e,cam){const S=ambSpr(),X=snapV(e.x)-cam.x,Y=snapV(e.y)-cam.y;
  if(e.k==='peck'){for(const m of e.m){const s=S.sparrow[Math.floor(e.t*1.6+m.ph*3)%3===0?1:0][m.f];ctx.drawImage(s,X+m.dx-1,Y+m.dy-2)}return}
  if(e.k==='fly'){const a=Math.min(1,e.t/.6,(e.life-e.t)/.6),hv=Math.round(3+Math.sin(e.t*7+e.ph)*1.5);if(a<=0)return;ctx.globalAlpha=a;ctx.fillStyle=e.col;
    if(Math.floor(e.t*11+e.ph)%2)ctx.fillRect(X-1,Y-hv,2,1);else ctx.fillRect(X,Y-hv,1,1);ctx.globalAlpha=1;return}
  let s,a=1;
  if(e.k==='hare'){const go=e.st==='bolt'||e.hx!=null&&e.t-e.hx<.25;s=S.hare[e.white][go&&Math.floor(e.t*9)%2?1:0][e.dir<0?1:0];if(e.st==='bolt')a=Math.max(0,Math.min(1,(90-e.run)/30))}
  else{s=S.squirrel[e.st==='dart'?1:0][e.dir<0?1:0];a=e.st==='dart'?Math.max(0,Math.min(1,1-(e.run/e.dd-.55)/.45)):Math.min(1,e.t*4)}
  if(a<=0)return;ctx.globalAlpha=a;ctx.drawImage(s,X-(s.width>>1),Y-s.height+1);ctx.globalAlpha=1}
// (each bird of e in the air: f(x, y: its ground point, alt: px up, its picture now, alpha))
function ambBirds(e,f){const S=ambSpr(),rm=reducedMotion();
  if(e.k==='flock'){const a=Math.max(0,Math.min(1,e.t/.8,(e.life-e.t)/.8));for(const m of e.m)f(e.x+m.dx+Math.sin(e.t*1.3+m.ph)*1.2,e.y+m.dy,e.alt+m.da,S.flock[rm?1:Math.floor(e.t*7+m.ph)%2?0:2],a)}
  else if(e.k==='peck'){if(e.st!=='fly')return;const a=Math.max(0,Math.min(1,6-(e.t-e.ft)));for(const m of e.m)f(m.x,m.y,m.alt,S.brown[Math.floor(e.t*(rm?5:9)+m.ph)%2],a)}
  else if(e.k==='crow'){const a=Math.max(0,Math.min(1,e.t,1-(e.go||0)));for(const m of e.m){const an=m.a+m.w*e.t;f(e.x+Math.cos(an)*m.r,e.y+Math.sin(an)*m.r*.5,m.alt+Math.sin(e.t*.7+m.ph)*2,S.crow[ambWing(e.t+m.ph,rm)],a)}}
  else if(e.k==='gull')f(e.x,e.y,e.alt+Math.sin(e.t*.5+e.ph)*3,S.gull[ambWing(e.t*1.1+e.ph,rm)],Math.min(1,e.t/.8))}
// flat on the ground, under everyone (render.js drawWorld): the fish's leaps and splashes, and the flyers' shadows, offset from
// under them as the sun throws them
function ambientFlat(cam){
  const L=AMBV.list;if(!AMBIENT.on||!L.length)return;ctx.save();ctx.fillStyle='rgb('+SHADOW.col.join(',')+')';
  for(const e of L){if(e.k==='fish')continue;ambBirds(e,(x,y,alt,s,a)=>{const w=s.width>3?3:2;ctx.globalAlpha=.22*a;ctx.fillRect(snapV(x+alt*.3)-cam.x-(w>>1),snapV(y)-cam.y,w,1)})}
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
  for(const b of S.list){if(b.k!=='crow'&&b.t<=b.d)continue;ctx.globalAlpha=.22*al(b);ctx.fillRect(sn(b.x+b.alt*.3)-1,sn(b.y),3,1)}
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
