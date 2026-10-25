'use strict';
// Seamless rendering, bounded regrouping, and battles divided by impassable terrain.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',Number(new URLSearchParams(location.search).get('seed'))||1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+120,h.y+100);P.troops={hum_foot:4};t.frame();
 const enemy=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+70,y:P.y,cool:0,n:2});t.bandits.push(enemy);
 // Rings are real world draw entities, with transforms and opacity restored after each army.
 let ents=[];t.marchDraw(ents,P,G.cam);const arcs=[],ctx=t.ctx,arc=ctx.arc;try{ctx.arc=function(...a){arcs.push(a);return arc.apply(this,a)};ents[0].f()}finally{ctx.arc=arc}
 ok(arcs.length===2&&arcs[0][2]===t.marchOuter(P)&&arcs[1][2]===t.marchOuter(P)+t.WORLD_BATTLE.interaction,'every drawn army has an outer circle and interaction ring at its actual world radius');
 const before={x:G.cam.x,y:G.cam.y,scale:t.VS};G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,a=b.world;b.paused=true;
 ok(!t.LOADING.on&&G.mode==='battle','talk-to-fight completes in place without opening a battle loading screen');
 t.frame();ok(G.cam.x===before.x&&G.cam.y===before.y&&t.VS===before.scale&&t.CVS===t.VS,'live world drawing retains the exact world viewport and native resolution');
 const icon=b.icons.find(i=>i.team===0);ok(icon&&Math.abs(icon.w*t.VS/(devicePixelRatio||1)-t.UICON.s*t.UICON.k)<.001,'group markers keep a stable screen size on the native world canvas');
 const original=t.marchDraw,seen=[];window.__marchDraw=original;window.marchDraw=(out,o,cam)=>{seen.push(o);return original(out,o,cam)};try{t.frame()}finally{window.marchDraw=original;delete window.__marchDraw}
 ok(!seen.includes(P)&&!seen.includes(enemy),'campaign army figures are hidden while their battle actors occupy the same world positions');
 const mini=t.worldMiniRect(),hit=t.miniHit({x:mini.x+mini.w/2,y:mini.y+mini.h/2}),world=a.world(hit);ok(Math.abs(world.x-t.MW*t.TILE/2)<.001&&Math.abs(world.y-t.MH*t.TILE/2)<.001,'the world minimap retains its world coordinates during combat');
 const soldier=b.units.find(u=>u.team===1),group=b.groups[soldier.grp],hp=soldier.hp=11;group.resolve.worldReturns=t.WORLD_BATTLE.returns;group.resolve.routed=true;soldier.rout=true;
 // The second escape is final; it must not seed another rest/return cycle.
 const ex=a.exit({x:a.cx+a.radius,y:a.cy},t.WORLD_BATTLE.apron*.65*a.scale);soldier.x=ex.x;soldier.y=ex.y;a.escape(soldier,.01);
 ok(soldier.left&&!soldier.regroup&&soldier.hpLeft===hp&&b.fledFoes===1,'a group that has already regrouped leaves alive on its next rout instead of returning forever');
 soldier.regroup={t:0,phase:'return',cycle:0};const returnPoint=a.openPoint(a.exit(soldier,-18));soldier.x=returnPoint.x;soldier.y=returnPoint.y;a.step(.01);ok(group.resolve.routed&&soldier.rout&&group.resolve.worldReturns===t.WORLD_BATTLE.returns,'a late straggler cannot reset a group that has already broken again');
 for(const [who,g] of Object.entries(b.terrain.route)){const original=a.escapeRoutes[who];ok(g.cost.some((v,i)=>!v&&original.cost[i]&&Math.hypot((i%g.C+.5)*g.cs-a.cx,(Math.floor(i/g.C)+.5)*g.cs-a.cy)>a.radius),'normal '+who+' paths cannot leave the circle while escape paths retain the apron')}
 // Two separated open islands inside the same boundary: both armies alive, no legal route or missile reach.
 for(const u of b.units){delete u.left;delete u.regroup;u.hp=u.max;u.rout=false;u.x=a.cx+(u.team?110:-110);u.y=a.cy;u.s={...u.s,range:0,reach:12};u.hid=0}
 for(const g of Object.values(b.groups))if(g.resolve){g.resolve.routed=false;g.resolve.rallied=false;g.resolve.mor=80}
 for(const g of Object.values(b.terrain.route)){g.wall.fill(0);for(let i=0;i<g.cost.length;i++)g.cost[i]=a.inside({x:(i%g.C+.5)*g.cs,y:(Math.floor(i/g.C)+.5)*g.cs},4)?16:0;g.v++;g.memo.clear()}
 b.lastHit=0;b.t=t.WORLD_BATTLE.blocked+1;a.blockCheck=0;a.watchBlocked();ok(!b.over,'connected armies are not timed out merely because they hold position');
 for(const g of Object.values(b.terrain.route)){g.cost.fill(0);const c=Math.floor(a.cx/g.cs),r=Math.floor(a.cy/g.cs);for(let y=r-2;y<=r+2;y++)for(let x=c-11;x<=c+11;x++)if(Math.abs(x-c)>3&&y>=0&&x>=0&&x<g.C&&y<g.R)g.cost[y*g.C+x]=16;g.v++;g.memo.clear()}
 b.lastHit=b.t-1;a.blockCheck=0;a.watchBlocked();ok(!b.over,'recent combat prevents stalemate resolution even when routes are blocked');
 b.terrain.kind.fill(t.TKIND.open);b.terrain.lvl.fill(0);b.terrain.built.fill(0);b.terrain.wall.fill(0);b.terrain.index();b.units.filter(u=>u.team===0).forEach(u=>u.s.range=1000);b.lastHit=0;a.blockCheck=0;a.watchBlocked();ok(!b.over,'an unobstructed ranged attack across a barrier keeps the battle active');b.units.forEach(u=>u.s.range=0);
 b.lastHit=0;b.t=t.WORLD_BATTLE.blocked+1;a.blockCheck=0;a.watchBlocked();ok(b.over&&b.stalemate&&b.retreat&&!b.win,'a proven terrain stalemate disengages after the quiet interval instead of running forever');
 const gold=P.gold,renown=P.renown,enemyBefore=enemy.troops.length;t.finishBattle();ok(t.B===null&&G.mode==='dialog'&&Kit.text().includes('Disengaged')&&!Kit.text().includes('Run down'),'a blocked battle reaches an honest Disengaged result and releases the player');
 ok(P.gold===gold&&P.renown===renown&&enemy.troops.length===enemyBefore&&!G.encAgain,'disengagement does not invent a victory, gold loss, retreat penalty or compulsory rematch');
 ok(t.BVH===t.FIELD_H,'leaving world combat restores the separate battle viewport for tournaments and assaults');
 info('Army circles, seamless camera, finite routing and blocked-ground completion checked.');
});
