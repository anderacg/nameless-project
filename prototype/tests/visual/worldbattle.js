'use strict';
Kit.suite(({ok})=>{
 const t=T,q=new URLSearchParams(location.search),scene=q.get('scene')||'battle';window.requestAnimationFrame=()=>0;Kit.begin('soldier',17);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;t.PHYSICS.on=true;t.FOG.on=true;
 const h=Kit.goHome('Ashford');let best=null,dist=Infinity;for(let i=0;i<t.WM.kind.length;i++){if(t.WM.kind[i]!==t.T_OPEN)continue;const x=(i%t.MW+.5)*t.TILE,y=(Math.floor(i/t.MW)+.5)*t.TILE,d=Math.hypot(x-h.x-120,y-h.y-100);if(d<dist){best={x,y};dist=d}}Kit.goTo(best.x,best.y);
 const P=t.P,G=t.G;P.troops={hum_foot:12,hum_bow:8,hum_knight:4};P.comps={brann:{ap:5,role:''}};t.compInit('brann');G.clock=t.DAY*.35;G.paused=true;
 const enemy=t.asParty({kind:'bandits',troops:[...Array(14).fill('militia'),...Array(6).fill('archer')],x:P.x+80,y:P.y+10,cool:0,n:20});t.bandits.push(enemy);
 if(scene==='march'){G.mode='char';t.openMarch()}
 else if(scene!=='travel'){t.frame();G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false,deploy:true});const b=t.B;b.paused=true;b.sel=null;
   if(scene==='reinforce'){const l=t.W.lords.find(l=>l.fac==='vale');l.dead=false;l.inside=null;l.fight=null;l.x=b.world.x+b.world.r+14;l.y=b.world.y-15;l.troops=['hum_foot','hum_foot','hum_bow'];G.enc.allies.push(l);b.world.step(.1)}
 }
 t.fitScreen();t.frame();ok(scene==='march'?!!document.getElementById('marchCanvas'):scene==='travel'?G.mode==='world':!!t.B.world,'world-map '+scene+' at '+innerWidth+'×'+innerHeight);
 ok(!ERR.length,'no render errors');
 if(scene==='march')ok(document.getElementById('marchCanvas').getBoundingClientRect().height>=100,'formation canvas remains usable on the screen');
});
