'use strict';
// Terrain phase 4 (battle/terrain.js's way round, route.js; doc/TERRAIN_DESIGN.md §10): impassable deep water, cliffs (sheer and
// one-way hills, their ramps), rock (mountains, spires). Generation: the art's contract, fairness (the zones reach each other and
// every top, both ways; no rock in a zone) and variety by biome over many seeds, determinism. Every soldier's step: never into
// rock or deep water, never over a cliff its blocked way (checked each frame of long AI battles). Group moves over a bridge or a
// ford, two columns over one bridge, a single-bridge field to the end; one-way hills climbed by the ramp only; charges round a
// cliff with no momentum till clear; the AI takes a top by its ramp and leaves one whose ramp is far. TERRAIN.on is turned on
// here (tests/harness.js turns it off).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,L=t.BattleLab,ev=s=>(0,eval)(s),K=t.TKIND,X=t.TERRAIN_ROCK,TR=t.TERRAIN,BH=t.BH;
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;ev('TERRAIN.on=true');
 // (a lab battle on this ground; the captains silent (B.cmdT) unless the AI fights (ai) or cap)
 const lab=(left,right,ground,extra={})=>{if(L.active)L.exit();G.mode='world';G.modal=false;const {cap,...cfg}=extra;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:true,morale:true,seed:5,ground,...cfg});t.B.obs=[];if(!cfg.ai&&!cap)t.B.cmdT=1e9;return t.B};
 const Gp=(type,count,form)=>({type,count,...(form?{form}:{})}),W=()=>t.BW,cellOf=(T,x,y)=>t.tIx(T,x,y),lvAt=(T,p)=>T.lvl[cellOf(T,p.x,p.y)];
 const place=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
 const fp=()=>{let h=2166136261;const mix=v=>{h=Math.imul(h^(v|0),16777619)>>>0};for(const u of t.B.units){mix(u.x*1e6);mix(u.y*1e6);mix(u.hp*1e3);mix(u.rout?1:0)}return h.toString(16)};
 // (an independent judge of one frame's step from (ax,ay) to (bx,by): false (fine), 'solid', 'wall', 'corner' or 'jump' (over a
 // cell); out of a solid cell anything goes, as terrainHold allows)
 const badStep=(T,ax,ay,bx,by)=>{const cs=T.cs,C=T.C,c0=Math.floor(ax/cs),r0=Math.floor(ay/cs),c1=Math.floor(bx/cs),r1=Math.floor(by/cs);if(c0===c1&&r0===r1||T.solid[r0*C+c0])return false;
  if(T.solid[r1*C+c1])return 'solid';const Wl=T.wall||new Uint8Array(1),bit=(c,r,dc,dr)=>Wl[r*C+c]&(dc>0?1:dc<0?4:dr>0?2:8)||0,dc=c1-c0,dr=r1-r0;
  if(Math.abs(dc)+Math.abs(dr)===1)return bit(c0,r0,dc,dr)?'wall':false;
  if(Math.abs(dc)===1&&Math.abs(dr)===1){const vx=!T.solid[r0*C+c1]&&!bit(c0,r0,dc,0)&&!bit(c1,r0,0,dr),vy=!T.solid[r1*C+c0]&&!bit(c0,r0,0,dr)&&!bit(c0,r1,dc,0);return vx||vy?false:'corner'}
  return 'jump'};
 // (run the lab battle frame by frame up to s seconds (or while go()), judging every living soldier's step each frame)
 const watch=(s,go=()=>true,each=null)=>{const T=t.B.terrain,prev=new Map(t.B.units.map(u=>[u,[u.x,u.y]])),out={frames:0,solid:0,wall:0,corner:0,jump:0,inSolid:0,end:null};t.B.paused=false;ev('B.cmdT=B.cmdT||0');
  while(t.B.t<s&&!L.session.result&&go()){t.updateBattle(1/60);out.frames++;
   for(const u of t.B.units){if(u.hp<=0){prev.delete(u);continue}const p=prev.get(u);if(p){const b=badStep(T,p[0],p[1],u.x,u.y);if(b)out[b]++}if(T.solid[cellOf(T,u.x,u.y)]&&!(p&&T.solid[cellOf(T,p[0],p[1])]))out.inSolid++;prev.set(u,[u.x,u.y])}
   if(each)each()}
  t.B.paused=true;out.end=L.session.result;return out};
 const clean=w=>!w.solid&&!w.wall&&!w.corner&&!w.inSolid;
 // ======== the contract with the art
 ok(K.rock===6&&t.TERRAIN_GROUND.rock.solid&&t.TERRAIN_GROUND.rock.blocks&&t.TGROUND[6]===t.TERRAIN_GROUND.rock&&TR.wade===false,'the contract: TKIND.rock is 6, solid and blocking sight; deep water impassable (TERRAIN.wade false)');
 {let T0=null,s0=0;for(let s=1;s<60&&!T0;s++){const T=t.buildTerrain({recipe:'hills',crags:true,seed:s,W:1100,top:40,bot:560});if(T.wall&&T.rockH&&T.recipe.hills.some(h=>h.oneway)&&T.recipe.hills.length===2){T0=T;s0=s}}
  ok(!!T0,'a crags field with cliffs, rock and a one-way pair (seed '+s0+')');
  if(T0){const {C,R,kind,lvl,wall,rockH}=T0,N=C*R,DC=[1,0,-1,0],DR=[0,1,0,-1];let badBit=0,bits=0,up=0,down=0;
   for(let i=0;i<N;i++)for(let q=0;q<4;q++){if(!(wall[i]&1<<q))continue;bits++;const c=i%C+DC[q],r=Math.floor(i/C)+DR[q];if(c<0||r<0||c>=C||r>=R){badBit++;continue}const j=r*C+c;if(lvl[j]>lvl[i])up++;else if(lvl[i]>lvl[j])down++;else badBit++}
   const oneH=T0.recipe.hills.filter(h=>h.oneway);
   ok(wall instanceof Uint8Array&&wall.length===N&&wall.every(v=>v<16)&&bits>0&&!badBit,'B.terrain.wall: a Uint8Array(C×R) of edge bits (E 1, S 2, W 4, N 8), each between a terrace cell and a lower neighbour ('+bits+' bits: '+up+' on the low side, '+down+' on the high)');
   ok(oneH.length===2&&!down,'one-way hills: bits only on the low cells, pointing up (down allowed, up refused)');
   ok(rockH instanceof Uint8Array&&rockH.length===N&&kind.every((k,i)=>(k===K.rock)===(rockH[i]>0))&&Math.max(...rockH)<=X.mh[1],'B.terrain.rockH: a Uint8Array(C×R), a height in levels (14 px each to the art) on every rock cell and only there (peak '+Math.max(...rockH)+' levels)');
   ok(T0.recipe.hills.every(h=>Array.isArray(h.ramps)&&h.ramps.length>=1&&h.ramps.every(Number.isFinite))&&T0.recipe.rocks.length>0&&T0.ai.tops.every(h=>h.cliff)&&T0.has.rock&&T0.has.cliff,'recipe.hills carry cliff, oneway and ramps (radians); recipe.rocks; has.rock, has.cliff');
   ok(T0.route&&['foot','mounted','big'].every(k=>T0.route[k].C===C&&T0.route[k].R===R)&&T0.blocky&&kind.every((k,i)=>k!==K.rock||!T0.route.foot.cost[i]),'B.terrain.route: foot, mounted and big grids of the field; rock impassable on them');
   // the mirrored pair: its ramps mirror about the middle
   const [a,b]=T0.recipe.hills,m=a.ramps.map(v=>Math.PI-v);ok(b.ramps.every((v,k)=>Math.abs(Math.cos(v)-Math.cos(m[k]))<1e-9&&Math.abs(Math.sin(v)-Math.sin(m[k]))<1e-9),'a pair’s ramps mirror each other about the field’s middle')}}
 // ======== generation over many seeds: fairness by reach, no rock in the zones nor the lane; variety; never Math.random; same seed, same field
 {const recs=['open','forest','hills','swamp','desert'],rivs=[null,{},{bridge:true},{frozen:true}],bad=[],tally={};let calls=0,dropped=0;const r0=Math.random;Math.random=()=>{calls++;return r0()};
  const hash=T=>{let h=2166136261;const mix=v=>{h=Math.imul(h^(v&255),16777619)>>>0};for(const A of [T.kind,T.lvl,T.wall||[],T.rockH||[]])for(const v of A)mix(v);return h.toString(16)};
  let same=true;
  try{for(let i=0;i<300;i++){const rc=recs[i%5],frost=(i>>3)%3===0&&rc!=='desert'&&rc!=='swamp',rv=rc==='desert'||rc==='swamp'?null:rivs[(i>>2)%4],Wd=960+(i*37)%341,top=30+(i*13)%50,bot=600-((i*7)%40)-10,sp={recipe:rc,seed:(i*2654435761+11)>>>0,W:Wd,top,bot,frost,river:rv&&{...rv}},T=t.buildTerrain(sp);
    if(i<20&&hash(T)!==hash(t.buildTerrain({...sp,river:rv&&{...rv}})))same=false;if(T.recipe.dropped.length)dropped++;
    const k=rc+(frost?'/frost':''),c=tally[k]||(tally[k]={n:0,sheer:0,oneway:0,mount:0,spire:0,blocky:0});c.n++;if(T.recipe.hills.some(h=>h.cliff&&!h.oneway))c.sheer++;if(T.recipe.hills.some(h=>h.oneway))c.oneway++;
    if(T.recipe.rocks.some(p=>p.r>=30))c.mount++;if(T.recipe.rocks.some(p=>p.r<30))c.spire++;if(T.blocky)c.blocky++;
    const g=T.route.foot,C=T.C,cs=T.cs,mid=(top+bot)/2,z=TR.zone*Wd,at=(x,y)=>t.routeNear(g,t.routeIx(g,x,y)),a=at(z/2,mid),b=at(Wd-z/2,mid),fa=t.routeFlood(g,a),fb=t.routeFlood(g,b);
    let zr=true;for(let j=0;j<g.cost.length;j++){if(!g.cost[j])continue;const x=(j%C+.5)*cs;if(x<z&&!fa[j]||x>Wd-z&&!fb[j]){zr=false;break}}
    const tops=T.recipe.hills.every(h=>{const j=at(h.x,h.y);return j>=0&&fa[j]&&fb[j]}),rockZ=T.kind.some((v,j)=>v===K.rock&&((j%C+.5)*cs<z||(j%C+.5)*cs>Wd-z)),ln=T.recipe.lane,rockL=!!ln&&T.kind.some((v,j)=>{if(v!==K.rock)return false;const y=(Math.floor(j/C)+.5)*cs;return y>ln.y0+8&&y<ln.y1-8});
    if(!(fa[b]&&fb[a])||!zr||!tops||rockZ||rockL||!t.terrainFair(T,Wd,top,bot).ok)bad.push(k+'#'+i+(fa[b]&&fb[a]?'':' zones')+(zr?'':' sealed')+(tops?'':' tops')+(rockZ?' rockInZone':'')+(rockL?' rockInLane':''))}}
  finally{Math.random=r0}
  ok(!bad.length,'300 fields (every recipe, frost, rivers with fords, a bridge, frozen): each deployment zone reaches the other both ways and all of its own ground, every hilltop is reached from both, no rock in a zone or the open lane'+(bad.length?': '+bad.slice(0,6).join('; '):''));
  ok(calls===0&&same,'generation never draws Math.random ('+calls+' calls); the same spec gives the same kind, lvl, wall and rockH');
  info('features by recipe (fields with: sheer hills / one-way hills / mountains / spires / blocking anything): '+Object.entries(tally).map(([k,c])=>k+' '+c.n+': '+[c.sheer,c.oneway,c.mount,c.spire,c.blocky].join('/')).join('; ')+'; '+dropped+' fields dropped a feature');
  const hil=tally.hills,des=tally.desert,sw=tally.swamp;ok(hil.sheer>0&&hil.oneway>0&&hil.mount>0&&des.spire>0&&!des.sheer&&!des.mount&&!sw.blocky,'variety by biome: hills fields get sheer and one-way hills and mountains; deserts spires only (no cliffs on dunes, no mountains); swamps none');
  const fr=(tally['hills/frost'].mount+tally['open/frost'].mount+tally['forest/frost'].mount+tally['hills/frost'].spire+tally['open/frost'].spire+tally['forest/frost'].spire)/(tally['hills/frost'].n+tally['open/frost'].n+tally['forest/frost'].n),
   wm=(hil.mount+tally.open.mount+tally.forest.mount+hil.spire+tally.open.spire+tally.forest.spire)/(hil.n+tally.open.n+tally.forest.n);
  ok(fr>wm,'frost fields have more rock ('+fr.toFixed(2)+' a field against '+wm.toFixed(2)+')')}
 // ======== the lab key: cliffs, ramps, rock; bad ones refused
 {const v=L.validate({ground:{hills:[{x:.5,y:.5,r:90,top:2,cliff:true,ramps:[0,180]}],rocks:[{x:.3,y:.2,r:40,h:6}]}}).ground,v2=L.validate({ground:{recipe:'crags',seed:4}}).ground;
  ok(v.hills[0].cliff===true&&v.hills[0].ramps.join()==='0,180'&&v.rocks[0].h===6&&v2.recipe==='crags','the lab ground key takes hills with cliff, oneway and ramps (degrees), rocks [{x, y, r, h}] and the recipe crags');
  let th=0;for(const g of [{hills:[{x:.5,y:.5,r:90,ramps:[0]}]},{hills:[{x:.5,y:.5,r:90,cliff:1}]},{hills:[{x:.5,y:.5,r:90,cliff:true,ramps:[0,90,180,270,45]}]},{hills:[{x:.5,y:.5,r:90,cliff:true,ramps:'n'}]},{rocks:[{x:2,y:.5,r:20}]},{rocks:[{x:.5,y:.5,r:2}]},{rocks:[{x:.5,y:.5,r:20,h:30}]},{rocks:'x'},{recipe:'crag'}])try{L.validate({ground:g})}catch(e){th++}
  ok(th===9,'bad cliffs, ramps and rocks are refused ('+th+'/9)')}
 // ======== a sheer hill, a one-way hill and a mountain, laid by hand: walls where they should be; a group goes up by the ramp only
 {const B=lab([Gp('hum_foot',16),Gp('hum_knight',8,'wedge')],[Gp('hum_foot',8)],{hills:[{x:.35,y:.42,r:100,top:1,oneway:true,ramps:[90]},{x:.72,y:.42,r:90,top:2,cliff:true,ramps:[0]}],rocks:[{x:.55,y:.2,r:44}]}),T=B.terrain,cs=T.cs;
  const [h1,h2]=T.recipe.hills,R=t.TERRAIN_ROCK.ramp/2,ramp1=p=>p.y>h1.y&&Math.abs(p.x-h1.x)<=R+cs;
  const north={x:h1.x,y:h1.y-h1.ry-40},top={x:h1.x,y:h1.y},gf=t.playerGroups().map(id=>B.groups[id])[0],foe=Object.values(B.groups).find(g=>g.foe);place(foe,W()-60,BH-90);
  ok(T.blocky&&T.wall&&T.kind[cellOf(T,W()*.55,BH*.2)]===K.rock&&lvAt(T,top)===1,'a lab field: a one-way hill (ramp south), a sheer hill (ramp east) and a mountain');
  const gr=T.route.foot,up=t.routePath(gr,north.x,north.y,top.x,top.y),dn=t.routePath(gr,top.x,top.y,north.x,north.y),len=(a,p)=>{let x=a.x,y=a.y,n=0;for(const w of p){n+=Math.hypot(w[0]-x,w[1]-y);x=w[0];y=w[1]}return n};
  ok(up.ok&&len(north,up)>2*Math.hypot(top.x-north.x,top.y-north.y)&&up.some(w=>ramp1({x:w[0],y:w[1]}))&&dn.ok&&dn.length===1,'the one-way hill: from the north the way up goes round to the ramp in the south ('+Math.round(len(north,up))+' px), the way down the north cliff is straight');
  // up it by the ramp: every soldier who climbs onto it crosses its rim in the ramp's band
  place(gf,north.x,north.y);gf.moveTo(top.x,top.y);const rimAt=[];const prev=new Map(gf.units.map(u=>[u,lvAt(T,u)]));
  const w=watch(60,()=>gf.units.filter(u=>lvAt(T,u)===1).length<gf.units.length,()=>{for(const u of gf.units){const l=lvAt(T,u);if(l>prev.get(u))rimAt.push({x:u.x,y:u.y});prev.set(u,l)}});
  const onTop=gf.units.filter(u=>lvAt(T,u)===1).length;
  ok(onTop===gf.units.length&&rimAt.length>0&&rimAt.every(ramp1)&&clean(w),'a group sent up from the north: '+onTop+'/'+gf.units.length+' on top in '+Math.round(t.B.t)+' s, every one onto it by the ramp ('+rimAt.length+' climbs, none over a cliff; steps judged: '+JSON.stringify(w)+')');
  // down the north side: straight over the cliff's edge (one-way: dropping is allowed)
  {const t0=t.B.t;gf.moveTo(north.x,north.y-20);const w2=watch(t0+30,()=>gf.units.some(u=>lvAt(T,u)===1));const dt=t.B.t-t0;ok(dt<15&&clean(w2),'and down its north side: they drop straight over the cliff ('+dt.toFixed(1)+' s)')}
  // the sheer hill: up only by its east ramp, and down too
  {const t2={x:h2.x,y:h2.y},west={x:h2.x-h2.rx-30,y:h2.y},p=t.routePath(gr,t2.x,t2.y,west.x,west.y);ok(p.ok&&p.length>1&&p.some(q=>q[0]>h2.x+cs),'the sheer hill: even the way down from its top to its west goes by the ramp in the east ('+p.length+' waypoints)');
   ok(!t.lineClear(gr,t2.x,t2.y,west.x,west.y)&&!t.lineClear(gr,west.x,west.y,t2.x,t2.y)&&t.lineClear(gr,t2.x,t2.y,h2.x+h2.rx+30,h2.y),'lineClear: no straight way over a sheer cliff either way; along the ramp, clear')}
  // the riders round the mountain: never in rock
  {const kn=t.playerGroups().map(id=>B.groups[id])[1],mt=T.recipe.rocks[0];place(kn,mt.x-mt.r-50,mt.y);kn.moveTo(mt.x+mt.r+60,mt.y);const t0=t.B.t,w3=watch(t0+30,()=>kn.units.some(u=>u.x<mt.x+mt.r+40));
   ok(kn.units.every(u=>u.x>=mt.x+mt.r+40)&&clean(w3),'riders sent through a mountain ride round it ('+(t.B.t-t0).toFixed(1)+' s), none in its rock')}
  L.exit()}
 // ======== a river with impassable deep water: groups cross by a bridge and a ford and reach their places
 {const B=lab([Gp('hum_foot',24),Gp('hum_knight',12),Gp('troll',3),Gp('hum_bow',16)],[Gp('hum_foot',4)],{rivers:[{x:.5,crossings:[{kind:'ford',y:.28},{kind:'bridge',y:.58}]}]},{morale:false}),T=B.terrain,[cF,cB]=T.ai.crossings;
  const mine=t.playerGroups().map(id=>B.groups[id]),foe=Object.values(B.groups).find(g=>g.foe);place(foe,W()-30,t.fieldTop()+10);foe.units.forEach(u=>{u.s={...u.s,spd:0};u.hp=u.max=1e9});
  ok(T.blocky&&T.has.water&&cF.kind==='ford'&&cB.kind==='bridge'&&['foot','mounted','big'].every(w=>T.kind.every((k,i)=>k!==K.deep||T.route[w].cost[i]===0)),'a lab river: deep water impassable on every grid, a ford and a bridge');
  const ft=t.fieldTop(),fb=t.fieldBot(),fy=k=>ft+(fb-ft)*k,goals=[[W()*.8,fy(.2)],[W()*.8,fy(.5)],[W()*.75,fy(.4)],[W()*.82,fy(.85)]];mine.forEach((g,i)=>{place(g,W()*.2,t.fieldTop()+60+i*((t.fieldBot()-t.fieldTop()-120)/3));g.moveTo(goals[i][0],goals[i][1])});
  const off=(g,u)=>Math.hypot(u.x-t.clamp(g.ax+(u.sx||0),8,W()-8),u.y-t.clamp(g.ay+(u.sy||0),t.fieldTop(),t.fieldBot()));
  let wet=0,onF=0,onB=0;const by=mine.map(()=>[new Set(),new Set()]),w=watch(120,()=>mine.some(g=>g.units.some(u=>off(g,u)>14)),()=>{mine.forEach((g,i)=>{for(const u of g.units){const k=t.groundAt(u.x,u.y);if(k===K.deep)wet++;else if(k===K.ford){onF++;by[i][0].add(u)}else if(k===K.bridge){onB++;by[i][1].add(u)}}})});
  const there=mine.map((g,i)=>g.units.filter(u=>off(g,u)<=14).length+'/'+g.units.length+' (ford '+by[i][0].size+', bridge '+by[i][1].size+')');
  ok(mine.every(g=>g.units.every(u=>u.x>cB.x1))&&!wet&&onF>0&&onB>0&&clean(w),'four groups (foot, riders, trolls, archers) sent over: all across in '+Math.round(t.B.t)+' s by the ford and the bridge ('+onF+' and '+onB+' soldier-frames on them), never in deep water; at their places '+there.join(', '));
  // a charge over the river: no wading, by a crossing
  {const k=mine[1],f=foe.units[0];place(foe,cF.x1+120,cF.y+90);place(k,cF.x0-120,cF.y+90);k.attack(f);let wk=0;const w2=watch(t.B.t+30,()=>f.hp>f.max-1,()=>{for(const u of k.units)if(t.groundAt(u.x,u.y)===K.deep)wk++});
   ok(!wk&&clean(w2)&&k.units.some(u=>Math.hypot(u.x-f.x,u.y-f.y)<30),'riders charging a foe over the river go round by a crossing (none ever in deep water) and reach him')}
  L.exit()}
 // ======== one bridge, no ford: two columns over it the same way and two the other way at once; then a whole battle on it
 {const ground={rivers:[{x:.5,crossings:[{kind:'bridge',y:.5}]}]},B=lab([Gp('hum_foot',30),Gp('hum_bow',20),Gp('hum_foot',30),Gp('hum_knight',12)],[Gp('hum_foot',4)],ground,{morale:false}),T=B.terrain,c=T.ai.crossings[0];
  const mine=t.playerGroups().map(id=>B.groups[id]),foe=Object.values(B.groups).find(g=>g.foe);place(foe,W()-30,t.fieldTop()+10);foe.units.forEach(u=>{u.s={...u.s,spd:0};u.hp=u.max=1e9});
  place(mine[0],c.x0-150,c.y-90);place(mine[1],c.x0-160,c.y+90);place(mine[2],c.x1+150,c.y-90);place(mine[3],c.x1+170,c.y+80);
  mine[0].moveTo(c.x1+160,c.y+60);mine[1].moveTo(c.x1+200,c.y-60);mine[2].moveTo(c.x0-160,c.y+60);mine[3].moveTo(c.x0-190,c.y-70);
  const done=()=>mine.every((g,i)=>g.units.every(u=>i<2?u.x>c.x1+8:u.x<c.x0-8)),w=watch(150,()=>!done());
  ok(done()&&clean(w),'one bridge (32 px), no ford: two columns over it each way at once, '+mine.reduce((n,g)=>n+g.units.length,0)+' men: all across in '+Math.round(t.B.t)+' s, no deadlock');
  L.exit();
  const arm=[Gp('hum_foot',24),Gp('hum_bow',14),Gp('hum_knight',8,'wedge')],res=[];
  for(const seed of [3,8]){lab(arm,arm,ground,{ai:true,seed,distance:500});const w2=watch(400);res.push((w2.end||'unfinished')+' in '+Math.round(t.B.t)+' s');ok(!!w2.end&&clean(w2),'a single-bridge field, AI on AI (seed '+seed+'): '+res[res.length-1]+'; every step clean ('+w2.frames+' frames)')}}
 // ======== charges round a cliff: no momentum while the way is not clear; never over the edge
 {const B=lab([Gp('hum_knight',8)],[Gp('hum_foot',10)],{hills:[{x:.5,y:.42,r:100,top:1,cliff:true,ramps:[90]}]},{morale:false}),T=B.terrain,h=T.recipe.hills[0],gr=T.route.mounted;
  const k=t.playerGroups().map(id=>B.groups[id])[0],f=Object.values(B.groups).find(g=>g.foe);f.files=5;place(f,h.x,h.y-h.ry*.45);f.units.forEach(u=>{u.s={...u.s,spd:0}});place(k,h.x,h.y-h.ry-90);
  k.attack(f.units[0],{run:true});let built=0,blind=0,first=null;const was=new Map(k.units.map(u=>[u,0]));
  const w=watch(60,()=>!first,()=>{for(const u of k.units){const r=u.run||0;if(r>was.get(u)+1e-9){built++;if(u.tgt&&!t.lineClear(gr,u.x,u.y,u.tgt.x,u.tgt.y,255,6))blind++}was.set(u,r);if(!first&&u.tgt&&Math.hypot(u.x-u.tgt.x,u.y-u.tgt.y)<16)first={t:t.B.t,run:r,mom:t.momentum(u)}}});
  ok(!!first&&clean(w)&&built>0&&blind<=built*.02,'riders charging foot on a sheer top from below its cliff: round by the ramp, '+(first?'on them at '+first.t.toFixed(1)+' s':'never there')+'; momentum built in '+built+' rider-frames, '+blind+' of them without a clear line');
  ok(!t.lineClear(gr,h.x,h.y-h.ry-90,h.x,h.y-h.ry*.45,255,4),'(no straight charge line up the cliff: lineClear refuses it)');L.exit()}
 // ======== the AI: a top on its half taken by its ramp; one whose ramp is on the far side is far, and left
 {const TA=t.TERRAIN_AI,X0=()=>W()-300,def=hills=>{const B=lab([Gp('hum_foot',36)],[Gp('hum_foot',12),Gp('hum_bow',16)],{hills},{cap:true});const mine=t.playerGroups().map(id=>B.groups[id]),foe=Object.values(B.groups).filter(g=>g.foe);
   place(mine[0],250,300);place(foe[0],W()-160,300);place(foe[1],W()-110,300);mine[0].units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999});t.command(1);return foe};
  const hb=back=>[{x:X0()/W(),y:300/BH,r:100,top:2,cliff:true,ramps:[back?0:180]}];
  let [di,da]=def(hb(true));const Q=t.captainMem(1),T=t.B.terrain,h=T.recipe.hills[0],cs=T.cs;
  ok(Q.post==='defend'&&Q.hold&&Q.hold.lvl===2,'a sheer hill on the defender’s half, its ramp on the defender’s side: taken ('+(Q.hold?'level '+Q.hold.lvl:'none')+')');
  const rims=[],lv=new Map(di.units.map(u=>[u,lvAt(T,u)])),w=watch(25,()=>true,()=>{for(const u of di.units){const l=lvAt(T,u);if(l>lv.get(u))rims.push(l===1?{x:u.x,y:u.y}:null);lv.set(u,l)}}),onTop=di.units.filter(u=>lvAt(T,u)>=1).length;
  const inRamp=p=>p.x>h.x&&Math.abs(p.y-h.y)<=X.ramp/2+cs;
  ok(onTop>=di.units.length*.75&&rims.filter(Boolean).every(inRamp)&&clean(w),'its infantry goes up by the ramp ('+onTop+'/'+di.units.length+' on the hill after 25 s; every step onto its first terrace in the ramp’s band)');
  [di]=def(hb(false));const far=t.captainMem(1).hold,straight=Math.hypot(t.B.terrain.recipe.hills[0].x-(W()-160+40),0);
  [di]=def([{x:X0()/W(),y:300/BH,r:100,top:2}]);const plain=t.captainMem(1).hold;
  ok(!far&&plain&&plain.lvl===2,'the same hill with its ramp on the foe’s side (the way round longer than holdR '+TA.holdR+' px, the straight line '+Math.round(straight)+'): left; without cliffs it is taken');L.exit()}
 // ======== a whole crags-and-river battle, AI on AI: every step clean; the same seed, the same battle
 // (a seed whose crags field has rock beside the river: mountains need room between its banks and the zones)
 {const arm=[Gp('hum_foot',24),Gp('hum_bow',14),Gp('hum_knight',8,'wedge'),Gp('troll',2)],runs=[];let ground=null;
  for(let s=1;s<40&&!ground;s++){const g={recipe:'crags',river:{bridge:true},seed:s};lab(arm,arm,g,{ai:true,seed:11,distance:520});if(t.B.terrain.has.rock&&t.B.terrain.has.cliff)ground=g}
  for(let k=0;k<2&&ground;k++){lab(arm,arm,ground,{ai:true,seed:11,distance:520});const T=t.B.terrain,w=watch(300);runs.push(fp());
   if(!k){ok(T.blocky&&T.has.rock&&T.has.cliff&&T.has.water&&clean(w),'a crags field with a river (a bridge and a ford), AI on AI: '+(w.end||'unfinished')+' in '+Math.round(t.B.t)+' s; '+w.frames+' frames, every soldier’s every step clean ('+JSON.stringify(w)+')');info('crags: '+T.recipe.text)}}
  ok(runs[0]===runs[1],'the same seed, the same battle ('+runs.join(' = ')+')')}
 // ======== nobody in sight (rock and a crest between): after a lull the captains go looking (commander.js captainSearch)
 {const arm=[Gp('hum_foot',20),Gp('hum_bow',12),Gp('hum_knight',6,'wedge')];lab(arm,arm,{recipe:'crags',seed:6},{ai:true,seed:6,distance:500});const w=watch(300);
  ok(!!w.end&&clean(w),'a crags field where neither side can see the other once they part (seed 6): they go looking where the foe was last seen, and the battle ends ('+(w.end||'unfinished')+' in '+Math.round(t.B.t)+' s)')}
 // ======== route.js's two helpers: routeFlood, routeDist
 {const g=t.routeGrid(20,10,16);for(let r=0;r<10;r++)t.routeCell(g,10,r,0);t.routeCell(g,10,5,16);const s=t.routeIx(g,24,24),f=t.routeFlood(g,s),D=t.routeDist(g,24,24),U=t.ROUTE.unit;
  ok(f[t.routeIx(g,300,24)]&&!f[t.routeIx(g,168,24)]&&Math.abs(D[t.routeIx(g,56,24)]-4*U)<1e-9&&Math.abs(D[t.routeIx(g,40,40)]-2*U*Math.SQRT2)<1e-9&&D[t.routeIx(g,168,40)]===Infinity&&t.routeDist(g,24,24)===D,'routeFlood: the far side through the one gap, never the wall; routeDist: 2·unit a cell, √2 more on the diagonal, Infinity in the wall, kept per start cell');
  t.routeCell(g,10,5,0);ok(!t.routeFlood(g,s)[t.routeIx(g,300,24)]&&t.routeDist(g,24,24)[t.routeIx(g,300,24)]===Infinity,'the gap shut: out of reach, and the kept field dropped with the grid’s version')}
 // ======== terrain off: nothing of this runs
 {ev('TERRAIN.on=false');lab([Gp('hum_foot',6)],[Gp('hum_foot',6)],'none');ok(!t.B.terrain&&t.steerDir(t.B.units[1],0,0)===null,'terrain off: no grids, no steering (steerDir null), as before');ev('TERRAIN.on=true')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
try{(0,eval)('TERRAIN.on=false');if(T.BattleLab.active)T.BattleLab.exit()}catch(e){}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
