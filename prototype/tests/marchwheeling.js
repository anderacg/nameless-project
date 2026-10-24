'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;
 function begin(){Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;P.troops={hum_foot:8};P.bsta=100;const h=Kit.goHome('Ashford');Kit.goTo(h.x+240,h.y+200);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-20;y<=ty+20;y++)for(let x=tx-20;x<=tx+20;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}return t.MarchArmy.of(P)}
 let a=begin(),x=P.x,y=P.y;P.tx=x;P.ty=y+180;let bounded=true;
 for(let i=0;i<40;i++){const before=a.units.map(u=>({x:u.x,y:u.y})),limit=t.moveStep(t.MAP_BASE*t.travelMul(),1/60);t.marchStep(1/60);a.step(1/60);bounded&&=a.units.every((u,j)=>Math.hypot(u.x-before[j].x,u.y-before[j].y)<=limit+.001)}
 ok(P.y>y&&P.tx===x&&P.ty===y+180,'leader moves during a turn instead of waiting for formation completion');
 ok(bounded,'followers retain ordinary marching speed without catch-up acceleration');
 a=begin();const col=Math.floor(P.x/t.TILE)+1;for(let yy=0;yy<t.MH;yy++)t.WM.kind[yy*t.MW+col]=t.T_WATER;
 const id=t.partyRoster(P).groups[0].id;P.army.march={[id]:{x:24,y:0}};a.sync();a.ground=null;
 for(let i=0;i<900;i++)a.step(1/60);
 ok(a.units.every(u=>a.ground.open(u)&&u.goal&&a.ground.open(u.goal)&&Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'formation slots over water settle at nearby legal ground');
 const parked=a.units.map(u=>({x:u.x,y:u.y}));for(let i=0;i<180;i++)a.step(1/60);
 ok(a.units.every((u,i)=>Math.hypot(u.x-parked[i].x,u.y-parked[i].y)<.01&&!u.walking),'terrain-adjusted formation stops instead of shuffling or pursuing water slots');
 const isolated=a.units[0];isolated.x=(col+2.5)*t.TILE;isolated.y=P.y;a.ground=null;for(let i=0;i<600;i++)a.step(1/60);
 ok(isolated.x>(col+1)*t.TILE&&a.ground.open(isolated)&&Math.hypot(isolated.x-isolated.goal.x,isolated.y-isolated.goal.y)<.6,'a disconnected marcher settles on its own reachable bank instead of chasing an unreachable slot');
 const anchor=P.x;P.tx=P.x-80;P.ty=P.y;t.marchStep(.1);ok(P.x<anchor,'a marcher stranded on another bank cannot immobilize the leader');
 const row=Math.floor(P.y/t.TILE),i=row*t.MW+col;t.WM.crossings.push({kind:'ferry',i:i-1,j:i+1,tiles:[i]});const ferry=new t.MarchGround(P,a.units),point={x:(col+.5)*t.TILE,y:(row+.5)*t.TILE},park=ferry.snap(point,ferry.reachable(P));
 ok(ferry.open(point)&&!ferry.stand(point)&&park&&ferry.stand(park),'ferry water can be crossed but final formation slots stop at legal land');
 a=begin();const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE),tile=ty*t.MW+tx;t.WM.edge[tile]=1;t.WM.edge[tile+1]=4;const nav=new t.MarchGround(P,a.units);
 ok(!nav.clear({x:(tx+.8)*t.TILE,y:(ty+.5)*t.TILE},{x:(tx+1.2)*t.TILE,y:(ty+.5)*t.TILE}),'formation navigation respects world cliff edges');
 const npc=t.asParty({kind:'bandits',troops:['militia','militia','militia'],x:P.x-40,y:P.y,cool:0}),na=t.MarchArmy.of(npc),nx=npc.x,ny=npc.y;t.walk(npc,-1,0,.3);
 ok(npc.x<nx&&npc.y===ny,'NPC leaders also move without waiting for formation completion');
});
