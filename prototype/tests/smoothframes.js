'use strict';
// Even frames (doc/TIME_SPEED_DESIGN.md §3.3; the owner, 2026-11-28: "I still feel like the battle frame rate is not smooth"): a fight on
// the map takes a frame's time in one battle step, as the battle screen does (worldbattle.js WORLD_BATTLE.step), a faster battle
// speed still cut to steps that long; the captains' "can they reach it?" answered from the ground's regions as the whole-field search
// answered it (route.js routeRegions, routeReach), a one-way cliff too; the men fleeing a fight and those coming back share one
// reckoning of the way out and the way in (routeNearest, worldbattle.js nearestField), not a search of the whole field a block of them.
// The roads' speed band (roadband.js RoadBand) is made again when the roads change, not each time a holding's gates shut.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;
 // (the regions against the measure of the way: every pair of a spread of points, on ground with a wall and its gap, a shut pen and a cliff down one way)
 {const g=t.routeGrid(40,30,8);for(let r=0;r<30;r++)if(r!==7)t.routeCell(g,20,r,0);for(let c=28;c<34;c++)for(let r=12;r<18;r++)if(c===28||c===33||r===12||r===17)t.routeCell(g,c,r,0);
  for(let c=0;c<20;c++)t.routeWall(g,c,22,6,true);// (rows 22 on: down from them north never, up to them from the north freely: one way)
  const far=(a,b)=>{const D=t.routeDist(g,a[0],a[1]),i=t.routeNear(g,t.routeIx(g,b[0],b[1]));return i>=0&&D[i]<Infinity},pts=[];for(let y=4;y<240;y+=28)for(let x=4;x<320;x+=36)pts.push([x,y]);
  let n=0,bad=0,yes=0;for(const a of pts)for(const b of pts){n++;const want=far(a,b),got=t.routeReach(g,a[0],a[1],b[0],b[1]);if(want)yes++;if(want!==got)bad++}
  info(n+' pairs, '+yes+' reachable, '+bad+' answered otherwise; '+new Set(t.routeRegions(g)).size+' regions with the shut ground\'s');
  ok(!bad&&yes>0&&yes<n,'"can they reach it?" by the ground\'s regions answers as the search of the whole field did');
  const up=[60,200],down=[60,120];ok(t.routeReach(g,down[0],down[1],up[0],up[1])!==t.routeReach(g,up[0],up[1],down[0],down[1]),'a one-way cliff: reached one way, not the other');
  const rg=t.routeRegions(g);t.routeCell(g,20,3,t.ROUTE.unit);ok(t.routeRegions(g)!==rg,'the regions made again when the ground changes')}
 // (a fight on the map: one battle step a frame's time)
 Kit.begin('soldier',51);G.paused=false;G.speed=1;t.GUIDE.on=false;G.mode='world';G.modal=false;P.troops={hum_levy:10,hum_spear:8};
 const e=t.asParty({kind:'bandits',troops:Array(14).fill('militia'),x:P.x+90,y:P.y,cool:0});W.parties.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
 t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const B=t.B;ok(!!B&&!!B.world,'a fight on the map');if(!B||!B.world)return;if(B.muster)B.muster.active=false;B.ready=true;B.paused=false;
 const bs=window.battleStep;let steps=[];window.battleStep=(rt,w)=>{steps.push(rt);return bs(rt,w)};
 try{
  for(const fps of [60,30,20]){steps=[];t.updateBattle(1/fps);ok(steps.length===1&&Math.abs(steps[0]-1/fps)<1e-9,'at '+fps+' frames a second a frame is one battle step ('+steps.length+')')}
  B.speed=2;steps=[];t.updateBattle(1/30);ok(steps.length===2&&Math.max(...steps)<=t.WORLD_BATTLE.step+1e-9&&Math.abs(steps[0]+steps[1]-2/30)<1e-9,'a battle at 2x: its time kept, cut to steps no longer than a frame\'s ('+steps.map(s=>s.toFixed(3)).join(', ')+')');B.speed=1;
  ok(t.WORLD_BATTLE.step===t.FRAME_TIME.step,'its longest step the frame loop\'s own');
 }finally{window.battleStep=bs}
 // (the way out and the way in: one reckoning for every man)
 {const A=B.world,g=A.escapeRoutes&&A.escapeRoutes.foot;ok(!!g,'the fight\'s ground has its ways out');if(g){
   const rd=window.routeDist,rn=window.routeNearest;let dist=0,near=0;window.routeDist=(...a)=>{dist++;return rd(...a)};window.routeNearest=(...a)=>{near++;return rn(...a)};
   try{const men=B.units.filter(u=>u.hp>0&&!u.wildlife).slice(0,12);let out=0;for(const u of men){u.worldEscape=null;const p=A.escapePlan(u);if(p&&p.to&&A.distance(p.to)>=A.radius)out++}
    ok(out===men.length,'every man\'s way out ends past the ring ('+out+' of '+men.length+')');ok(near===1&&dist===0,'one reckoning for them all, no search of the whole field a man ('+near+' made, '+dist+' searches)');
    const u=men[0],x=u.x,y=u.y,to=A.exit(u,-40);u.x=to.x;u.y=to.y;const r=A.returnPlan(u);u.x=x;u.y=y;ok(!r||A.inside(r.to,17),'the way back in ends inside the ring');
    ok(near===2&&dist===0,'and one for the way back in')}
   finally{window.routeDist=rd;window.routeNearest=rn}}}
 t.BattleSetup.undo();G.mode='world';
 // (the roads' speed band: made again when the roads change, not when the ways' version moves for a gate shutting (roadband.js touch))
 {const RB=t.RoadBand,build=RB.build;let made=0;RB.build=function(){made++;return build.call(this)};
  try{t.speedAt(P.x,P.y);made=0;const v0=t.WAYV;(0,eval)('WAYV++');t.speedAt(P.x,P.y);ok(t.WAYV!==v0&&made===0,'the ways\' version moving (a holding\'s gates shut) does not make the roads\' band again');
   t.wayRechart();t.speedAt(P.x,P.y);ok(made===1,'the ways charted again (an estate\'s track laid) does, once ('+made+')')}
  finally{RB.build=build}}
 ok(!ERR.length,'no runtime errors '+ERR.slice(0,2).join(' | '))});
