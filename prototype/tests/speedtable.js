'use strict';
// One clock, one speed table (doc/TIME_SPEED_DESIGN.md; the owner, 2026-11-28: "make the game use single time unit, speed and make all
// units, or characters even the town folks or camps or armys or bandit using the same speed system ... This also include world battle,
// battle screen and etc"; data/speed.js SPEED, core/speed.js Speed, core/time.js Time). The table's unit is map px a game second for a
// man on foot; a game second is a real second at 1x in every mode. Read back here from the code that moves each kind: the ladder in
// its order, the battle's speeds everywhere (the owner's choice), a map walker's gait, a party's march, the table's rows, a soldier's
// walk and run in both kinds of battle, a scene's people; a day's march the same ground as before; the map's own animation on the
// game's clock (still while paused, twice as fast at 2x).
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W,S=t.SPEED,Sp=t.Speed,Tm=t.Time,near=(a,b,k=1e-6)=>Math.abs(a-b)<=k*Math.max(1,Math.abs(b));window.requestAnimationFrame=()=>0;
 // (the ladder)
 const L=['stalk','laden','stroll','walk','march','hurry','run','rout','sprint'],g=S.gait;
 ok(L.every(k=>g[k]>0)&&L.every((k,i)=>!i||g[k]>g[L[i-1]])&&Object.keys(g).length===L.length,'one ladder of gaits, each faster than the last: '+L.map(k=>k+' '+g[k].toFixed(1)).join(', '));
 ok(near(g.run,S.man*.54/2)&&near(g.walk,g.run*.55)&&near(g.rout,g.run*1.1),'the battle\'s speeds are the ladder\'s: a run, a formation\'s walk and a rout as the battle was tuned');
 ok(g.walk<g.march&&g.march<g.run&&g.stroll<g.walk,'an army marches between a formation\'s walk and a charge, a townsman strolls slower than a soldier walks');
 // (a game second on the map: d, what its movers are handed)
 const d1=Tm.map(1)*t.WORLD_PACE,px=n=>t.moveStep(n,d1);
 ok(near(px(t.MAP_BASE),g.march),'a march on the map: '+px(t.MAP_BASE).toFixed(3)+' px a game second (the table\'s '+g.march+')');
 ok(['stalk','laden','stroll','hurry','run'].every(k=>near(t.footStep(k,d1),g[k]))&&near(t.footStep('walk',d1),g.march),'everyone on foot on the map goes at the ladder\'s gaits (his walk a march): stroll '+t.footStep('stroll',d1).toFixed(2)+', hurry '+t.footStep('hurry',d1).toFixed(2)+', run '+t.footStep('run',d1).toFixed(2));
 ok(Object.keys(S.map).every(k=>near(px(Sp.pace(k)),S.map[k]))&&near(px(t.CARAVAN_SPD),S.map.caravan)&&near(px(t.SHIP_SPD),S.map.ship)&&near(px(t.BOAT_SPD),S.map.boat)&&near(px(t.REFUGEE_SPD),S.map.refugee),'the table\'s rows are what moves: caravans '+px(t.CARAVAN_SPD).toFixed(2)+', ships '+px(t.SHIP_SPD).toFixed(2)+', refugees '+px(t.REFUGEE_SPD).toFixed(2)+' px a second');
 ok(near(Sp.px(40),40/34*g.march)&&near(Sp.px(Sp.pace('beast')),S.map.beast),'a pace number of the other tables is on the march\'s scale (34 a march): a deer\'s 40 is '+Sp.px(40).toFixed(2)+' px a second');
 // (a day: as much longer as the march is slower, a day's march the same ground)
 const ground=34*.4*1.11*1.28*293;info('a day at 1x: '+Tm.day().toFixed(0)+' game seconds ('+(Tm.day()/60).toFixed(1)+' minutes); the map\'s seconds to a game second '+Sp.mapRate().toFixed(4));
 ok(near(g.march*Tm.day(),ground,1e-9)&&near(Tm.map(Tm.day()),t.DAY_SECONDS),'a day\'s march covers the same ground as before ('+(g.march*Tm.day()).toFixed(0)+' px), a day '+t.DAY_SECONDS+' of the map\'s own seconds');
 // (a party on the map by the real code: a band of militia on open ground a game second)
 Kit.begin('soldier',51);Kit.clear();Kit.world();G.paused=false;G.speed=1;t.GUIDE.on=false;G.mode='world';G.modal=false;
 {const o=t.asParty({kind:'bandits',troops:Array(8).fill('militia'),x:P.x+300,y:P.y,cool:0}),v=Sp.px(t.partySpeed(o,o.troops)),gm=t.armyGround(o,t.partyGround,false);
  info('a band of 8 militia where it stands: '+v.toFixed(2)+' px a game second (the ground x'+gm.toFixed(2)+')');ok(near(v,g.march*gm*t.sizeMul(8),1e-6),'a band of militia marches at the table\'s march, times its ground and its size')}
 // (a soldier in both kinds of battle: his stat's share of a run, on the field's scale)
 for(const map of [false,true]){t.WORLD_BATTLE.on=map;P.troops={hum_levy:6};const e=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x+90,y:P.y,cool:0});W.parties.push(e);G.mode='world';G.modal=false;G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
  t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const B=t.B,u=B&&B.units.find(m=>m.team===0&&m.type==='hum_levy');
  if(!u||!!B.world!==map){ok(false,(map?'a fight on the map':'the battle screen')+' begins');continue}
  const k=Sp.scale(),run=u.s.spd*t.groundMul(u,1,0)/k,walk=run*t.MARCH.walk;
  ok(near(k,map?S.body*t.WORLD_BATTLE.sprite:S.body)&&(!map||near(k,B.world.scale)),(map?'a fight on the map':'the battle screen')+': '+k+' field px a map px');
  ok(near(run,g.run*u.s.spd/S.man)&&near(walk,g.walk*u.s.spd/S.man),(map?'a fight on the map':'the battle screen')+': a levy (speed '+u.s.spd+') runs '+run.toFixed(2)+' and walks '+walk.toFixed(2)+' map px a second: the ladder\'s, by his speed');
  t.BattleSetup.undo();G.mode='world';G.enc=null;const ix=W.parties.indexOf(e);if(ix>=0)W.parties.splice(ix,1)}
 // (a town's scene: you at a run, Shift a sprint, its folk at a stroll, on a figure's own px)
 ok(near(Sp.scene('run'),g.run*S.body)&&near(Sp.scene('stroll'),g.stroll*S.body)&&Sp.scene('sprint')>Sp.scene('run'),'a town\'s scene: you run '+Sp.scene('run').toFixed(1)+' px a second (Shift '+Sp.scene('sprint').toFixed(1)+'), its folk stroll '+Sp.scene('stroll').toFixed(1));
 // (the map's own clock: still while paused, twice as fast at 2x; a herd's animals on it)
 {G.mode='world';G.modal=false;G.paused=false;G.speed=1;const t0=Tm.t;for(let i=0;i<20;i++)t.updateWorld(Tm.map(.05));const one=Tm.t-t0;
  G.speed=2;const t1=Tm.t;for(let i=0;i<20;i++)t.updateWorld(Tm.map(.05));const two=Tm.t-t1;G.speed=1;
  G.paused=true;const t2=Tm.t;for(let i=0;i<20;i++)t.updateWorld(Tm.map(.05));const none=Tm.t-t2;G.paused=false;
  ok(near(one,1,1e-9)&&near(two,2,1e-9)&&none===0,'the map\'s clock: a game second a second at 1x ('+one.toFixed(3)+'), two at 2x ('+two.toFixed(3)+'), none while paused ('+none+')');
  const src=String(t.Herd.prototype.members)+String(t.penEnts)+String(t.marchFacing);ok(!/performance\.now/.test(src)&&/Time\.(ms\(\)|t)\b/.test(src),'a herd\'s animals, a pasture\'s and an army turning run on it, not on the wall clock')}
 ok(!ERR.length,'no runtime errors '+ERR.slice(0,2).join(' | '))});
