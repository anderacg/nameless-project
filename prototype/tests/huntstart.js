'use strict';
// A hunt begins where the map stood (the owner, 2026-11-20: "The hunting wildlife when hunt start should be start at the position in
// when player interact"; battle/hunting.js herdSpotNow): each animal at its own foot as the map drew it, facing its way, your men where
// they marched; and its game runs (the owner: "they like walking not running"; HUNT_AREA.run, the map's scale, fightSpace): a rested
// deer outruns a running footman, a winded one about keeps up with him, both at a gallop as drawn.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;G.speed=1;P.troops={hum_spear:4};
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-30;y<=ty+30;y++)for(let x=tx-30;x<=tx+30;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 const cap=t.EscapeStamina.capacity({crit:true,id:'deer'}),c=t.asHerd({crit:true,id:'deer',n:4,x:P.x+40,y:P.y+10,hx:P.x+40,hy:P.y+10,dir:1,t:5,a:0,cool:0,idle:true,escapeSta:cap});W.critters=[c];
 // ---- where it begins ----
 for(let i=0;i<30;i++)t.frame();const F=t.HERD_FLOCK.get(c),drawn=F.m.map(m=>({x:m.x,y:m.y,f:m.f<0?-1:1})),far=Math.max(...drawn.map(p=>Math.hypot(p.x-c.x,p.y-c.y)));
 const army=t.MarchArmy.of(P);army.sync();const marched=army.units.map(u=>({x:u.x,y:u.y}));
 t.hunt(c);const b=t.B,a=b&&b.hunt;ok(G.mode==='battle'&&a&&a.animals.length===4,'a tap on the herd starts the hunt');
 const at=a.animals.map(u=>a.world(u)),off=at.map((p,i)=>Math.hypot(p.x-drawn[i].x,p.y-drawn[i].y));
 ok(far>2&&Math.max(...off)<=1,'each animal begins at its own foot as the map drew it, not at a spot of the hunt\'s own (off by '+Math.max(...off).toFixed(2)+' px; its herd '+far.toFixed(1)+' px across about its point)');
 ok(a.animals.every((u,i)=>(u.face<0?-1:1)===drawn[i].f),'each facing the way it faced on the map');
 {const men=b.units.filter(u=>u.team===0&&!u.hero).map(u=>a.world(u)),gap=marched.length?Math.max(...men.map(p=>Math.min(...marched.map(q=>Math.hypot(p.x-q.x,p.y-q.y))))):0;
  ok(men.length&&gap<=2,'your men begin where they marched (each within '+gap.toFixed(1)+' px of a marcher)')}
 // ---- how fast it runs ----
 b.auto=false;t.setGroupsAuto(t.playerGroups(),false,false);for(const u of a.animals){u.alert=1;u.escapeSta=u.escapeCap}
 const run=(n,f)=>{const p0=a.animals.map(u=>a.world(u));for(let i=0;i<n;i++){t.updateBattle(.05);f&&f()}return a.animals.map((u,i)=>{const p=a.world(u);return Math.hypot(p.x-p0[i].x,p.y-p0[i].y)/(n*.05)})};
 let pose=0;const rest=run(20,()=>{for(const u of a.animals)if(u.hp>0&&!u.left&&u.spdNow>0){const q=t.beastPose(u,true);if(q>=15&&q<=18)pose++}});
 for(const u of a.animals){u.escapeSta=0}const tired=run(10);
 // (a footman's walk and run on the same field: the game held where it stands)
 const turn0=a.turn;a.turn=u=>{u.alert=0;u.spdNow=0};const sp=b.units.filter(u=>u.type==='hum_spear'),g=b.groups[sp[0].grp],speed=r=>{const q0=sp.map(u=>a.world(u));g.standAt(sp[0].x+(r?-300:300),sp[0].y+(r?-200:200));g.setRun(r);for(let i=0;i<40;i++)t.updateBattle(.05);return Math.max(...sp.map((u,i)=>{const p=a.world(u);return Math.hypot(p.x-q0[i].x,p.y-q0[i].y)/2}))};
 const walk=speed(false),runs=speed(true);a.turn=turn0;
 const R=Math.min(...rest),T2=Math.min(...tired);info('map px a second: a rested deer '+R.toFixed(1)+', winded '+T2.toFixed(1)+'; a footman walking '+walk.toFixed(1)+', running '+runs.toFixed(1));
 ok(R>runs*1.3,'a rested deer outruns a running footman ('+R.toFixed(1)+' against '+runs.toFixed(1)+' px a second)');
 ok(T2>walk&&T2>runs*.7,'a winded one still runs, about a footman\'s run ('+T2.toFixed(1)+')');
 ok(pose>0,'drawn at a gallop as it flees ('+pose+' frames)');
 ok(!ERR.length,'no runtime errors');
});
