'use strict';
// A broken man fleeing a fight on the map runs as any man runs (battle/worldbattle.js escape; the owner, 2026-11-20: "when they flee
// they run. But running and all those also based on stamina"): his step the same as a run order's (his speed, tired or spent the
// slower, groundMul: the map's scale, the ground, the battle's pace), ROUT_RUN x for his life; drawn running and spending his breath;
// out of breath he walks, drawn walking, spending none
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);P.troops={hum_foot:3};
 const e=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+70,y:P.y,cool:0});
 G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 const b=t.B,a=b.world,tr=b.terrain,u=b.units.find(u=>u.team===1),gr=b.groups[u.grp];b.paused=true;
 tr.kind.fill(t.TKIND.open);tr.lvl.fill(0);tr.built.fill(0);tr.wall.fill(0);tr.routes.build(8,t.BH-8);a.escapeRoutes=tr.route;tr.index();
 u.rout=true;if(gr.resolve)gr.resolve.routed=true;
 const run=(sta,secs)=>{u.x=a.cx;u.y=a.cy;u.sta=sta;const x0=u.x,y0=u.y,s0=u.sta;let n=0;for(;n<secs/.05;n++)a.escape(u,.05);return{v:Math.hypot(u.x-x0,u.y-y0)/secs,spent:s0-u.sta,drawn:u.spdNow}};
 // (a run order's step, for the same man at the same breath: actors.js, his speed x tired x groundMul, a second's worth)
 const order=sta=>{u.sta=sta;return u.s.spd*t.tiredMul(u).spd*t.groundMul(u,1,0)};
 const fresh=run(t.FATIGUE.max,1),want=order(t.FATIGUE.max)*t.Speed.ratio('rout','run');
 info('fleeing, fresh: '+fresh.v.toFixed(1)+' px/s; a run order '+order(t.FATIGUE.max).toFixed(1)+' px/s, his walk '+(order(t.FATIGUE.max)*t.MARCH.walk).toFixed(1));
 ok(Math.abs(fresh.v-want)<want*.05,'a fresh man flees at a run, ROUT_RUN x a run order\'s pace, the map\'s scale in it ('+fresh.v.toFixed(1)+' px/s, '+want.toFixed(1)+' wanted)');
 ok(fresh.spent>0&&fresh.drawn>u.s.spd*.75,'running spends his breath ('+fresh.spent.toFixed(2)+' in a second) and he is drawn running');
 const tired=run(t.FATIGUE.spent+5,1);ok(Math.abs(tired.v-order(t.FATIGUE.spent+5)*t.Speed.ratio('rout','run'))<tired.v*.05&&tired.v<fresh.v*.9,'tired, he flees slower, as a tired man runs ('+tired.v.toFixed(1)+' px/s)');
 const out=run(0,1),walk=u.s.spd*t.MARCH.walk*t.tiredMul(u).spd*t.groundMul(u,1,0);
 ok(Math.abs(out.v-walk)<walk*.05&&out.drawn<u.s.spd*.75&&out.spent<=0,'out of breath he walks: a walk\'s pace ('+out.v.toFixed(1)+' px/s), drawn walking, spending none');
});
