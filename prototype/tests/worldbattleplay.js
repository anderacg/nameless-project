'use strict';
// Campaign combat through the normal update, AI, physics, sight and result pipeline.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',Number(new URLSearchParams(location.search).get('seed'))||33);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.PHYSICS.on=true;t.FOG.on=true;t.GUIDE.on=false;
 let tile=0;for(let i=0;i<t.WM.kind.length;i++)if(t.WM.kind[i]===t.T_OPEN&&i%t.MW>20&&i%t.MW<t.MW-20&&Math.floor(i/t.MW)>20){tile=i;break}Kit.goTo((tile%t.MW+.5)*t.TILE,(Math.floor(tile/t.MW)+.5)*t.TILE);
 // Open terrain is a controlled fixture; the field still samples, paints and routes the real map.
 const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-10;y<=ty+10;y++)for(let x=tx-10;x<=tx+15;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.elev[i]=64;t.WM.edge[i]=0;t.WM.high[i]=0}
 t.WorldArt.invalidate();P.troops={hum_foot:6,hum_bow:4};
 const enemy=t.asParty({kind:'bandits',troops:['militia','militia','militia','archer'],x:P.x+70,y:P.y,cool:0,n:4});t.bandits.push(enemy);
 const helper=W.lords.find(l=>l.fac==='vale');helper.dead=false;helper.inside=null;helper.fight=null;helper.x=P.x-90;helper.y=P.y+15;helper.troops=['hum_foot','hum_bow'];
 G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[helper],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false,deploy:true});const b=t.B,a=b.world;
 const pending=b.units.filter(u=>u.waiting),start=b.units.length;ok(pending.length===3&&pending.every(u=>u.hp===0&&u.left),'an ally named in the encounter waits at its real approach position, including its lord');
 t.setAuto(true,true);b.paused=false;let frames=0,bounds=true,finite=true;
 for(;frames<16000&&t.B===b;frames++){
   t.updateBattle(1/30);if(t.B!==b)break;
   bounds&&=b.units.filter(u=>u.hp>0&&!u.rout&&!t.withdrawing(u)).every(u=>a.inside(u,0));finite&&=b.units.every(u=>Number.isFinite(u.x)&&Number.isFinite(u.y));
   if(frames%60===0)t.frame();
 }
 ok(bounds&&finite,'normal AI, hero, physics and projectiles keep actors finite and fighting units inside the world boundary');
 ok(pending.every(u=>!u.waiting)&&b.units.length===start,'a waiting army activates its original troops and character without spawning duplicates');
 ok(t.B===null&&G.mode==='dialog'&&Kit.text().includes('Victory'),'the world battle reaches campaign victory and its normal report');
 ok(!t.bandits.includes(enemy)&&P.troopCount()<=10&&P.troopCount()>0,'campaign settlement removes the defeated party and retains surviving player troops');
 info('World battle completed after '+frames+' normal frames; '+b.kills+' enemies slain.');
});
