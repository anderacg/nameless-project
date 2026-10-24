'use strict';
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,q=new URLSearchParams(location.search),scene=q.get('scene')||'bridge';window.requestAnimationFrame=()=>0;Kit.begin('soldier',17);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+240,h.y+200);P.troops=q.has('large')?{hum_foot:100,hum_bow:40,hum_knight:10}:{hum_foot:12,hum_bow:8,hum_knight:4};G.clock=t.DAY*.25;G.paused=true;
 const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE),river=tx+3;for(let y=ty-14;y<=ty+14;y++)for(let x=tx-14;x<=tx+22;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=x===river?(y===ty?t.T_ROAD:t.T_WATER):t.T_OPEN;t.WM.elev[i]=64;t.WM.edge[i]=0;t.WM.high[i]=0}
 t.WorldArt.invalidate();const a=t.MarchArmy.of(P);for(let i=0;i<(scene==='reformed'?300:105);i++){P.x+=.6;a.step(1/30)}if(scene==='reformed')for(let i=0;i<600;i++)a.step(1/30);
 t.fitScreen();t.frame();ok(a.units.every(u=>a.ground.open(u)),'all marchers remain on navigable ground at '+innerWidth+'×'+innerHeight);ok(!ERR.length,'no march render errors');if(scene==='reformed')ok(a.units.every(u=>Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'the army reforms after passing the bridge');
 const samples=[];for(let i=0;i<80;i++){const at=performance.now();a.step(1/30);samples.push(performance.now()-at)}info('March update '+a.units.length+' sprites: mean '+(samples.reduce((a,b)=>a+b,0)/samples.length).toFixed(2)+' ms');
});
