'use strict';
// Real march positions, obstacle detours, narrow crossings and reforming after a turn.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,seed=Number(new URLSearchParams(location.search).get('seed'))||1;
 function begin(){
  Kit.begin('soldier',seed);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
  const h=Kit.goHome('Ashford');Kit.goTo(h.x+240,h.y+200);P.troops={hum_foot:8};P.army.march={[t.partyRoster(P).groups[0].id]:{x:-14,y:0}};
  const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-20;y<=ty+20;y++)for(let x=tx-20;x<=tx+30;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
  return t.MarchArmy.of(P);
 }
 let a=begin();ok(a.units.length===8&&a.units.every(u=>a.ground.open(u)),'each fit soldier has a real position on open terrain');const ids=a.units.map(u=>u.id).join();
 let bounds=true;for(let i=0;i<360;i++){const old=a.units.map(u=>({x:u.x,y:u.y}));if(i<180)P.x+=.3;a.step(1/30);bounds&&=a.units.every((u,k)=>Math.hypot(u.x-old[k].x,u.y-old[k].y )<2)}
 ok(bounds&&a.units.map(u=>u.id).join()===ids,'marchers move by bounded steps and keep their identities as the hero travels');ok(a.units.every(u=>Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.5),'the army reforms on its saved slots when the hero stops');
 const before=a.units.map(u=>({x:u.x,y:u.y})),face=a.face;P.y+=.3;a.step(1/30);ok(Math.abs(a.face-face)<=t.MARCH_MOVE.turn/30+.001&&a.units.every((u,i)=>Math.hypot(u.x-before[i].x,u.y-before[i].y )<2),'turning moves each soldier rather than rotating the entire formation instantly');
 for(let i=0;i<60;i++)a.step(1/30);ok(Math.abs(a.face-Math.PI/2)<.02,'a brief turn continues rotating toward the last travel heading after the leader stops');
 for(let i=0;i<420;i++){if(i<180)P.y+=.3;a.step(1/30)}ok(Math.abs(a.face-Math.PI/2)<.02&&a.units.every(u=>Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.5),'a right-angle turn finishes smoothly and returns the ranks to formation');
 {
  a=begin();const start=P.x,river=Math.floor((P.x+48)/t.TILE),row=Math.floor(P.y/t.TILE);for(let y=row-18;y<=row+18;y++)if(t.WM.has(river,y))t.WM.kind[y*t.MW+river]=y===row?t.T_ROAD:t.T_WATER;
  a.ground=null;let legal=true,queries=true,queue=false;for(let i=0;i<1200;i++){if(i<360)P.x+=.3;a.step(1/30);queries&&=a.queries<=t.MARCH_MOVE.queries;for(const u of a.units){legal&&=t.passable(t.terrAt(u.x,u.y));if(Math.abs(u.x-(river+.5)*t.TILE)<8)queue=true}}
  ok(legal&&queue,'soldiers cross the river on its narrow bridge instead of walking through water');ok(a.units.every(u=>u.x>start+60&&Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'the last soldier clears the crossing and the full formation reforms on the far bank');ok(queries,'path searches stay within the per-army frame budget');
 }
 {
  a=begin();const river=Math.floor((P.x+48)/t.TILE),row=Math.floor(P.y/t.TILE);for(let y=row-18;y<=row+18;y++)t.WM.kind[y*t.MW+river]=t.T_WATER;
  const index=t.WM.crossings.length;t.WM.crossings.push({kind:'ferry',i:row*t.MW+river-1,j:row*t.MW+river+1,tiles:[row*t.MW+river]});a.ground=null;let boarded=false;
  for(let i=0;i<1200;i++){if(i<360)P.x+=.3;a.step(1/30);boarded||=a.units.some(u=>t.terrAt(u.x,u.y)===t.T_WATER&&a.ground.open(u))}
  ok(boarded&&a.units.every(u=>Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'followers use the designated ferry corridor and reform at its far landing');
  const closed=new Uint8Array(index+1);closed[index]=1;t.WM.graph.closed=closed;const nav=new t.MarchGround(P,a.units),at=t.wayCentre(row*t.MW+river);ok(!nav.open({x:at[0],y:at[1]}),'a closed ferry does not open a path through the water');
 }
 {
  a=begin();P.x-=.3;for(let i=0;i<600;i++)a.step(1/30);ok(Math.abs(Math.abs(a.face)-Math.PI)<.02&&a.units.every(u=>Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'soldiers can reverse the formation without becoming stuck face to face');
  const old=a.units.map(u=>({x:u.x,y:u.y}));P.x+=25;a.step(1/30);ok(a.units.every((u,i)=>Math.hypot(u.x-old[i].x,u.y-old[i].y)<2),'a large leader step does not teleport the mini sprites with it');
 }
 {
  a=begin();const id=a.units[0].id,first=a.units[0];P.troops={hum_foot:10};a.step(1/30);ok(a.units.length===10&&a.units.includes(first)&&a.units[0].id===id,'recruitment adds marchers without rebuilding surviving soldiers');P.troops={hum_foot:5};a.step(1/30);ok(a.units.length===5&&a.units.includes(first),'roster losses remove surplus sprites while preserving the survivors');
  const pos=a.units.map(u=>[u.x,u.y]);t.marchDraw([],P,G.cam);t.marchDraw([],P,G.cam);ok(a.units.every((u,i)=>u.x===pos[i][0]&&u.y===pos[i][1]),'drawing never advances march movement');
  G.paused=true;const time=a.time;t.updateWorld(.2);ok(a.time===time,'world pause freezes mini-sprite movement');
  const old=a;Kit.begin('soldier',seed);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;ok(t.MARCH_ARMIES.get(P)!==old,'a new session forgets old positions and paths');
 }
 {
  a=begin();const town=t.townBy('Ashford'),sample=town.lots.find(l=>l.k==='house'),lot={...sample,x:Math.floor((P.x+42)/t.TILE),y:Math.floor(P.y/t.TILE)-1};town.lots.push(lot);a.ground=null;let legal=true;
  for(let i=0;i<900;i++){if(i<300)P.x+=.3;a.step(1/30);for(const u of a.units)legal&&=a.ground.open(u)}
  ok(legal&&a.units.every(u=>Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'marchers detour around a real building footprint and reform beyond it');
 }
 {
  a=begin();const band=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x+80,y:P.y+15,cool:20,n:6});t.bandits.push(band);const system=t.Systems.list.find(s=>s.name==='march formations');system.frame(1/30);const npc=t.MARCH_ARMIES.get(band),sprite=npc.units[0],before={x:sprite.x,y:sprite.y};band.x+=18;for(let i=0;i<120;i++)system.frame(1/30);
  ok(npc.units.length===6&&Math.hypot(sprite.x-before.x,sprite.y-before.y)>10&&npc.units.every(u=>Math.hypot(u.x-u.goal.x,u.y-u.goal.y)<.6),'nearby NPC armies use the same simulation-driven formation following');
 }
 {
  a=begin();P.x+=25;for(let i=0;i<10;i++)a.step(1/30);const before=new Map(a.units.map(u=>[u,{x:u.x,y:u.y}]));
  const e=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+70,y:P.y,cool:0,n:2});t.bandits.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B;
  ok(b.units.filter(u=>u.sourceArmy===P).every(u=>u.marchUnit&&Math.hypot(b.world.world(u).x-before.get(u.marchUnit).x,b.world.world(u).y-before.get(u.marchUnit).y)<.001),'battle starts at the actual marcher positions without reforming or teleporting');
  const soldier=b.units.find(u=>u.marchUnit),mini=soldier.marchUnit;soldier.x+=12;const expected=b.world.world(soldier);b.world.finish(b);ok(Math.hypot(mini.x-expected.x,mini.y-expected.y)<.001,'surviving battle positions return to the same travel sprites');
 }
 info('Physical marching checked without render-driven movement or random path choices.');
});
