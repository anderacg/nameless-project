'use strict';
// World scale (data/world.js): the named distances, the one movement lever (moveStep) and the caps per size of map hold today's
// numbers exactly; every cap and site count reads the table (MAP_DENS, which grew them from the map's area, is gone); and none of
// the moved numbers is left written out in the files that now read the table. Phase 1 (doc/WORLD_DESIGN.md §10.2, D9, D25): a
// realistic pace on today's map: the day 180 s at a world pace of .4 (so every timer counted per game day lasts as it did), the
// lever at .68 (a band on foot some 9 px a second on open ground, 25 km a day), the grace after a fight 1.47 times as long (the
// gap you open in it as before), the AI on the same lever, and the walk cycles by the distance walked.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,get=u=>{const x=new XMLHttpRequest();x.open('GET',u,false);x.send();return x.responseText};
 const S=t.WORLD_SCALE,D=t.DENSITY;
 // ---- the table: every moved number, at today's value
 const want={move:.68,sight:{lord:90,band:95,monster:70,caravan:80,refugee:70},
  ai:{graceGap:24,grace:1.47,dread:70,bandCamp:220,lairHunt:140,lairLeash:60,mythicRoam:[120,90],mythicScorch:200,gameLeash:50,herdLeash:24,penLeash:99,
   compFoes:90,compFlee:70,compBeat:[80,60],compTake:60,compDraft:120,folkNear:520,folkForget:120,folkBandit:70,folkFear:90,slipAway:40},
  spawn:{bandit:[220,260],monster:[180,240],monsterHold:64,mythic:200,critter:[120,200],critterHold:56},
  econ:{caravanNear:10,caravanFar:90,caravanCost:150,refuge:70,resRange:10,homeRange:24},
  law:{repNear:15,eventNear:15,siegeOutrage:20},land:{shelter:48,healNear:80,estateGuard:7,friendly:50,pacify:35},war:{front:60,raidLeash:80,siegeLeash:80},battle:{elfR:10,bridge:2}};
 ok(JSON.stringify(S)===JSON.stringify(want),'WORLD_SCALE holds every moved distance at today\'s value, the lever and the grace at Phase 1\'s ('+Object.keys(S).join(', ')+')');
 const classic={bandits:30,camps:12,monsterStart:48,monsterCap:60,critterStart:96,critterCap:120,caravans:72,refugees:42,ships:30,sites:{cave:30,travelers:21,hideout:24,ruins:21,shrine:18}};
 ok(JSON.stringify(D.classic)===JSON.stringify(classic)&&t.density()===D.classic,'DENSITY.classic holds today\'s caps, and it is the one in use');
 // ---- every cap reads the table; the site kinds scattered at random are the table's, and none keeps a count of its own
 const C=D.classic,K=Object.keys(t.SITE_TYPES);
 ok(t.CARAVAN_CAP===C.caravans&&t.REFUGEE_CAP===C.refugees&&t.CRITTER_CAP===C.critterCap&&t.CRITTER_START===C.critterStart,'caravan, refugee and critter caps read the table');
 ok(C.bandits===t.BANDITS&&C.monsterCap===t.MONSTER_CAP&&C.monsterStart===t.MONSTER_START&&C.ships===t.SHIP_CAP&&C.camps===t.CAMP_SPOTS.length,'bandits, monsters and ships read the table, and its camps are the map\'s spots');
 ok(JSON.stringify(K.filter(k=>!t.SITE_TYPES[k].spots))===JSON.stringify(Object.keys(C.sites))&&K.every(k=>!('count' in t.SITE_TYPES[k])),'the table counts every kind of site but the camps, and SITE_TYPES keeps no counts');
 {const core=get('js/core/core.js'),left=['js/core/core.js','js/world/sites.js','wiki.html','tests/sites.js'].filter(f=>/MAP_DENS|MAP_AREA/.test(get(f)));
  ok(!left.length&&!/BANDITS|MONSTER_CAP|MONSTER_START/.test(core)&&(0,eval)('typeof MAP_DENS')==='undefined','MAP_DENS is retired: core.js grows no caps and nothing reads it'+(left.length?': '+left.join(', '):''))}
 ok(t.GRACE_GAP===S.ai.graceGap&&t.RES_RANGE===S.econ.resRange&&t.HOME_RANGE===S.econ.homeRange,'the old names (GRACE_GAP, RES_RANGE, HOME_RANGE) read the table');
 // ---- one movement lever: at move 1 a step is exactly pace x d
 const R=t.seeded(5);let same=true;for(let i=0;i<2000;i++){const px=R()*90,d=R()*.2;same=same&&t.moveStep(px,d)===px*d*S.move}
 ok(S.move===.68&&same,'moveStep(pace, d) is exactly pace x d x move (2000 samples)');
 // ---- no moved number left written out (the old expressions are gone; every step goes through moveStep)
 const gone={
  'world/brains.js':['const GRACE_GAP=24','this.sight(90)','this.sight(95)','this.sight(80)','o.y-l.y)<70','26*mul*d','16*d','12*d','.9*d','.75*d','dd<90','[1]<70','rint(-80,80)','rint(-60,60)','*d)'],
  'world/caravans.js':['MAP_DENS','>10&&','<90;','/150'],
  'world/sites.js':['MAP_DENS','count:'],
  'world/monsters.js':['initial?180:240','<64)','<140','70*hide','*d,hunt','>60)','<200)','rint(-120,120)','rint(-90,90)','*d)'],
  'data/critters.js':['MAP_DENS'],
  'world/critters.js':['initial?120:200','<56)','*d;walk','99:24):50','*d,ok'],
  'world/refugees.js':['MAP_DENS','d<70','70*hide','*d)'],
  'world/patrols.js':['/l,40)'],
  'world/folk.js':['FOLK_R','<70)','<90;','*d)'],
  'world/estates.js':['<60)','7*TILE'],
  'world/reputation.js':['15*TILE'],
  'world/events.js':['15*TILE'],
  'world/siege.js':['>80)','20*TILE'],
  'world/world.js':['initial?220:260','bd=220','<48)','>80)','<80)','travelMul()*d'],
  'data/economy.js':['RES_RANGE=10','HOME_RANGE=24']};
 const left=[];let reads=0;
 for(const f in gone){const src=get('js/'+f);if(/WORLD_SCALE|moveStep|density\(\)/.test(src))reads++;for(const s of gone[f])if(src.includes(s))left.push(f+': '+s)}
 ok(!left.length&&reads===Object.keys(gone).length,'the '+Object.keys(gone).length+' files read the table, with none of the moved numbers left in them'+(left.length?': '+left.join('; '):''));
 // (a step is pace * d: none left outside moveStep; critters.js keeps two, a herd's spot round its holding at distance d)
 const steps=Object.keys(gone).map(f=>[f,(get('js/'+f).match(/\*d\b/g)||[]).length]).filter(([f,n])=>n!==(f==='world/critters.js'?2:0));
 ok(!steps.length,'no step on the map is written as pace*d outside moveStep'+(steps.length?': '+steps.map(s=>s.join(' ')).join(', '):''));
 // ---- Phase 1: the pace (D9). The day 180 s at .4: 72 units of the world's time a day, as 120 s at .6 gave
 {const t=T,G=t.G,P=t.P,W=t.W,info=m=>o.push('INFO '+m);
  ok(t.DAY_SECONDS===180&&t.WORLD_PACE===.4&&Math.abs(t.DAY_SECONDS*t.WORLD_PACE-120*.6)<1e-9&&Math.abs(S.ai.grace*S.move-1)<.001,'a day lasts 180 s at a world pace of .4: '+t.DAY_SECONDS*t.WORLD_PACE+' units of world time a day, as before (120 x .6); the grace x'+S.ai.grace+' undoes the lever x'+S.move);
  t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();t.setSpeed(1);
  const park=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.patrols=[];W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.fights=[];W.folk=[];G.encCool=0;G.chase=null};park();
  // every timer counted in the world's time lasts the same share of a day: a day of frames at 8x adds up to 72 units of d
  {let sum=0,f=0;const d0=G.day,c0=G.clock;P.x=-999;P.y=-999;P.tx=null;t.setSpeed(8);
   for(;f<5000;f++){const before=G.clock;t.updateWorld(.05);sum+=.05*G.speed*t.WORLD_PACE;if(G.clock<before)break}
   ok(Math.abs(sum-(t.DAY-c0)/t.DAY*72)<.25,'a day of play runs '+sum.toFixed(1)+' units of world time (the clock from '+(c0/t.DAY).toFixed(2)+' of a day to the next): every per-day timer is unchanged ('+f+' frames at 8x)');t.setSpeed(1)}
  // ---- on screen at 1x (a 16-px tile, 1 tile some 250 m): a band on foot (you and ten levies), an all-mounted band (you on a riding
  // horse, ten knights), on each ground; each exactly today's pace x (.4 / .6) x .68, and near the doc's targets (§10.2: a people
  // with no ground of its own here, a dwarf off his hills; a human is 10% faster on roads and open grass, so 10% over them)
  const spot=(tt,cl,k=0)=>{let n=0;for(let ty=12;ty<t.MH-12;ty++)for(let tx=12;tx<t.MW-12;tx++){if(t.tAt(tx,ty)!==tt||t.tAt(tx+1,ty)!==tt||t.climAt((tx+.5)*16,(ty+.5)*16)!==cl||t.climAt((tx+1.5)*16,(ty+.5)*16)!==cl)continue;
    if(t.TOWNS.some(h=>Math.hypot(h.x-(tx+.5)*16,h.y-(ty+.5)*16)<60))continue;if(n++===k)return [(tx+.5)*16,(ty+.5)*16]}return null};
  const grounds={open:spot(t.T_OPEN,'grass'),road:spot(t.T_ROAD,'grass'),forest:spot(t.T_FOREST,'grass'),hills:spot(t.T_HILL,'grass'),swamp:spot(t.T_OPEN,'swamp')};
  const speed=([x,y])=>{P.x=x;P.y=y;P.dir=1;P.tx=x+60;P.ty=y;G.chase=null;const x0=P.x,y0=P.y;t.updateWorld(.05);const px=Math.hypot(P.x-x0,P.y-y0)/.05;P.tx=null;return px};
  P.gear.mount=null;P.sk.ride.lv=0;P.sk.athl.lv=0;P.perks=[];P.comps={};P.wounded={};P.morale=60;P.hp=t.vitals()[0];
  const rows=[],bad=[],kmDay=v=>v*t.DAY_SECONDS/t.TILE*.25,want={foot:{open:[8.9,.05],road:[11.6,.05],forest:[5.3,.05]},horse:{open:[13.3,.08],road:[17.3,.08]}},race0=P.race;
  for(const [who,setup] of [['foot',()=>{P.race='dwarf';P.gear.mount=null;P.troops={hum_levy:10}}],['horse',()=>{P.race='dwarf';P.gear.mount='m_horse';P.troops={hum_knight:10}}],['human foot',()=>{P.race='human';P.gear.mount=null;P.troops={hum_levy:10}}]]){setup();
   for(const g in grounds){if(!grounds[g])continue;P.x=grounds[g][0];P.y=grounds[g][1];const v=speed(grounds[g]),tm=(P.x=grounds[g][0],P.y=grounds[g][1],t.travelMul()),today=t.MAP_BASE*tm*.6,now=t.MAP_BASE*tm*t.WORLD_PACE*S.move;
    if(Math.abs(v-now)>1e-6||Math.abs(v/today-.4/.6*.68)>1e-6)bad.push(who+' '+g+' '+v.toFixed(2)+' (want '+now.toFixed(2)+')');
    const w=(want[who]||{})[g];if(w&&Math.abs(v/w[0]-1)>w[1])bad.push(who+' '+g+' '+v.toFixed(2)+' px/s, off the doc\'s '+w[0]+' by '+Math.round((v/w[0]-1)*100)+'%');
    if(who==='human foot'&&g!=='open'&&g!=='road')continue;rows.push(who+' '+g+' '+v.toFixed(1)+' px/s ('+today.toFixed(1)+' before), '+kmDay(v).toFixed(0)+' km a day')}}
  P.gear.mount=null;P.troops={};
  info('on screen at 1x: '+rows.join('; '));
  ok(!bad.length&&rows.length>=12,'every ground, on foot and mounted: today\'s pace x .4/.6 x .68 exactly, near the doc\'s targets (on foot within 5% of 8.9 open, 11.6 road, 5.3 forest; mounted within 8% of 13.3 and 17.3)'+(bad.length?': '+bad.join('; '):''));
  {P.race='dwarf';P.troops={hum_levy:10};P.x=grounds.open[0];P.y=grounds.open[1];const km=kmDay(speed(grounds.open));ok(Math.abs(km/25-1)<.06,'a band on foot covers some 25 km a day on open ground ('+km.toFixed(1)+' km, '+(km*4).toFixed(0)+' tiles)');P.race=race0}
  // ---- the AI on the same lever: a caravan's step on open ground, a lord's on the march
  {park();const [x,y]=grounds.open,to=t.TOWNS.reduce((a,h)=>Math.hypot(h.x-x,h.y-y)>Math.hypot(a.x-x,a.y-y)?h:a);
   const c=t.asParty({cv:true,fac:to.owner,from:to.name,to:to.name,x,y,goods:{grain:5},guards:3,cool:0,dir:1});W.caravans.push(c);
   P.x=-999;P.y=-999;const d=.02,x0=c.x,y0=c.y;c.brain.think(c,d);const step=Math.hypot(c.x-x0,c.y-y0),wantS=t.CARAVAN_SPD*Math.max(.5,t.speedAt(x0,y0)||1)*d*S.move;
   ok(Math.abs(step-wantS)<1e-6,'a caravan steps by the same lever: '+step.toFixed(4)+' px in '+d+' (pace '+t.CARAVAN_SPD+' x '+S.move+')');W.caravans=[]}
  // ---- the grace after a fight: 1.47 times as long in world time, so the gap you open in it is what it was
  {park();P.troops={hum_levy:10};const [x,y]=grounds.open;P.x=x;P.y=y;const tm=t.travelMul();G.encCool=3;let f=0;for(;f<4000&&G.encCool>0;f++){P.x=x;P.y=y;P.tx=null;t.updateWorld(.05)}
   const secs=f*.05,gap=secs*t.MAP_BASE*tm*t.WORLD_PACE*S.move,before=3*t.MAP_BASE*tm;
   ok(Math.abs(gap/before-1)<.02,'the grace (G.encCool 3) lasts '+secs.toFixed(1)+' s at 1x: you walk '+gap.toFixed(0)+' px in it, as before ('+before.toFixed(0)+' px in '+(3/.6).toFixed(1)+' s)');P.troops={}}
  // ---- walk cycles by distance (R13): your figure's step is a frame each WALK.foot px you walk on foot, each WALK.ride px mounted,
  // WALK.n frames a cycle (render.js: eight, the old four-frame cycles' strides of 2.5 and 4 px cut in two, the same pace in finer
  // steps); 0 standing; the followers by the same distance; a caravan's wheel an eighth of a turn each 2.4 px; a beast a cycle each
  // body length
  {park();const [x,y]=grounds.open;P.x=x;P.y=y;P.tx=null;P.troops={hum_levy:12};const pn=performance.now;let now=1e6;performance.now=()=>now;
   const keep=(0,eval)('partySprite'),keepF=(0,eval)('followerSprite'),got=[],gotF=[];window.__ps=keep;window.__fs=keepF;
   (0,eval)('partySprite=function(c,m,f){window.__got.push(f||0);return window.__ps(c,m,f)};followerSprite=function(c,f,v,r,b){window.__gotF.push(f||0);return window.__fs(c,f,v,r,b)}');window.__got=got;window.__gotF=gotF;
   const draw=()=>{got.length=0;gotF.length=0;t.drawWorld();now+=16;return got[0]};// (yours, the first drawn: the banners ask for the standing figure's height after)
   const WK=t.WALK;try{const res=[],ok1=[];draw();for(let i=0;i<14;i++){t.walk(P,1,0,1.3);const f=draw();res.push(f);ok1.push(f===Math.floor(P.wd/WK.foot)%WK.n)}
    const fol=gotF.slice();now+=1000;const still=draw();
    ok(ok1.every(Boolean)&&new Set(res).size===WK.n&&WK.n>=6&&WK.n<=8&&still===0,'on foot your figure steps a frame each '+WK.foot+' px walked, '+WK.n+' a cycle ('+res.join('')+'), and stands (frame 0) once still');
    ok(fol.length>0&&fol.every(f=>f>=0&&f<WK.n)&&gotF.every(f=>f===0),'your host steps with you by the same distance ('+fol.join('')+'), and stands when you stand');
    P.gear.mount='m_horse';draw();const rm=[];let okm=true;for(let i=0;i<10;i++){t.walk(P,1,0,1.7);const f=draw();rm.push(f);okm=okm&&f===Math.floor(P.wd/WK.ride)%WK.n}
    ok(okm&&new Set(rm).size===WK.n,'mounted, a frame each '+WK.ride+' px ('+rm.join('')+')');P.gear.mount=null;
    // (the same distance at 1x or 8x gives the same frames: the step is by the ground covered, not the clock)
    const w0=P.wd;t.walk(P,1,0,10);const a=draw();ok(a===Math.floor(P.wd/WK.foot)%WK.n&&P.wd-w0>9.9,'a frame is set by the ground covered, whatever the speed of time (10 px: frame '+a+')');
    const cv=t.caravanSprite('#c74453',0),cv1=t.caravanSprite('#c74453',1),cv2=t.caravanSprite('#c74453',2);ok(cv!==cv1&&cv1!==cv2&&cv.width===32,'a caravan\'s wheel turns and its ox and drover step by its frame ('+WK.n+' of them, a step each 1.2 px)');
   }finally{(0,eval)('partySprite=window.__ps;followerSprite=window.__fs');performance.now=pn;P.troops={}}}
  park()}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
