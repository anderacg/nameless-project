'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);P.troops={hum_bow:2};const e=t.asParty({kind:'bandits',troops:['hum_knight'],x:P.x+70,y:P.y,cool:0});G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 const b=t.B,a=b.world,u=b.units.find(u=>u.team===1),mine=b.units.filter(u=>!u.team);b.paused=true;b.obs=[];
 ok(b.sight instanceof t.BattleSight&&b.units.filter(u=>u.hp>0).every(u=>u.team===0||t.seenBy(0,u)===(!(u.hid&1)&&a.visible(u,0))),'battle start initializes terrain sight after placing actors');
 const original=b.units;u.x=a.cx;u.y=a.cy;u.s={...t.ST.hum_knight};b.units=[mine[0],u];
 const step=(kind,{y=u.y,z=1}={})=>{const arrow={x:u.x-100,y,z,vx:2000,vy:0,vz:0,g:0,t:0,life:2,team:0,elf:true,magic:kind==='magic',arc:kind==='arc',a:0},m=kind==='arc'?new t.ArcMissile(arrow):kind==='magic'?new t.MagicBolt(arrow):new t.Bolt(arrow);let hits=0;m.strike=e=>{if(e===u)hits++;arrow.life=0};t.spatialOpen();try{m.step(.1)}finally{t.spatialClose()}return{arrow,hits}};
 for(const kind of ['arc','bolt','magic']){const result=step(kind,{y:u.y-(kind==='arc'?0:30)});ok(result.hits===1&&result.arrow.x<u.x,'swept '+kind+' hits the enlarged cavalry body rather than skipping past it')}
 ok(step('arc',{y:u.y+80}).hits===0&&step('arc',{z:100}).hits===0,'arrows passing clear of the body or overhead remain misses');
 b.units=original;const tr=b.terrain;tr.kind.fill(t.TKIND.open);tr.lvl.fill(0);tr.wall.fill(0);tr.built.fill(0);tr.index();
 // All friendly observers remain farther than close detection but well within normal world sight.
 for(const f of mine){f.x=a.cx-300;f.y=a.cy;f.rout=false}u.x=a.cx;u.y=a.cy;u.hid=0;delete u.rv;delete u.ls;
 tr.kind[t.tIx(tr,u.x,u.y)]=t.TKIND.wood;tr.index();b.t+=1;t.sightStep(true);
 ok(a.visible(u)&&!t.seenBy(0,u)&&!t.visibleFoes(0).includes(u),'a unit concealed in trees stays hidden even inside normal world vision');
 ok(t.lastSeen(0,u)===null,'an unseen hidden unit does not leak its position into last-known information');
 t.camCentre(u.x,u.y);ok(!t.battleEnts().includes(u),'concealed units are excluded from the actual battle draw list');
 const f=mine[0];f.x=u.x-100;f.y=u.y;t.sightStep(true);ok(t.seenBy(0,u),'approaching within scaled close-detection range reveals the hidden rider');
 f.x=u.x-300;b.t+=1;t.sightStep(true);ok(!t.seenBy(0,u),'moving away lets an undetected unit conceal itself again');
 t.sightStruck(u,f);ok(t.seenBy(0,u),'attacking reveals the concealed unit immediately');
 b.t+=t.SIGHT.memory+1;t.sightStep(true);ok(!t.seenBy(0,u),'attack reveal expires and restores tree concealment');
 tr.kind[t.tIx(tr,u.x,u.y)]=t.TKIND.open;tr.index();t.sightStep(true);ok(t.seenBy(0,u),'the same unit on clear ground remains visible');
 // Terrain concealment cannot extend the ordinary world sight disk.
 u.x=a.field({x:t.worldEye().x+t.vis()+50,y:t.worldEye().y}).x;t.sightStep(true);
 ok(!t.seenBy(0,u)&&a.sight().length===1&&a.sight()[0].r===t.vis(),'concealment respects the unchanged world vision range');
});
