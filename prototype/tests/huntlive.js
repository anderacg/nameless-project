'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;t.TERRAIN.on=true;t.FOG.on=true;t.BEAST_TACTICS.on=true;t.PHYSICS.on=true;t.COMMAND_POWERS.on=true;t.EXITS.on=true;G.paused=false;G.speed=1;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);P.troops={hum_foot:4};P.gear.weapon=t.gearId('sword',2);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+25;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
 const c=t.asHerd({crit:true,id:'rabbit',n:3,x:P.x+80,y:P.y,hx:P.x+80,hy:P.y,dir:1,t:5,a:0,cool:0,idle:true,escapeSta:0});W.critters=[c];t.frame();const preference=t.BAUTO.on;t.LOADING.sync=false;t.hunt(c);t.WildHunt.start();t.frame();const b=t.B,a=b.hunt;ok(t.aiAll(),'Begin hunt enables Auto Hunt for the whole army without another button press');ok(t.BAUTO.on===preference,'starting a hunt preserves the normal battle AI preference');const before=b.units.map(u=>({u,x:u.x,y:u.y}));
 for(let i=0;i<800&&t.B===b&&!b.over&&!b.kills;i++){t.updateBattle(.05);if(i%15===0)t.frame()}
 ok(b.t>0&&before.some(({u,x,y})=>!u.team&&Math.hypot(u.x-x,u.y-y)>1),'hunters move with normal physics and play settings');ok(before.some(({u,x,y})=>u.wildlife&&Math.hypot(u.x-x,u.y-y)>1),'wildlife flees with normal play settings');ok(b.kills>0,'normal combat can kill wildlife with production features enabled');ok(!ERR.length,'hunting advances without runtime errors');
});
