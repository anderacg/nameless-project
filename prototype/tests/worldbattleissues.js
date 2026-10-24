'use strict';
// Reported campaign failures: terminal outcomes, blocked exits, visibility and shared time controls.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,seed=Number(new URLSearchParams(location.search).get('seed'))||1;
 function start(){
  Kit.begin('soldier',seed);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.PHYSICS.on=true;t.FOG.on=true;t.GUIDE.on=false;
  const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);P.troops={hum_foot:4};G.speed=4;t.BSPEED.v=1;
  const e=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+70,y:P.y,cool:0,n:2});t.bandits.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B;
  b.paused=false;return b;
 }
 for(const lose of [false,true]){
  const b=start();for(const u of b.units)if(u.team===(lose?0:1))t.applyDmg(u,100000,1,null,b.units.find(v=>v.team!==u.team),false);
  for(let i=0;i<100&&t.B===b;i++)t.updateBattle(1/60);
  ok(t.B===null&&G.mode==='dialog'&&Kit.text().includes(lose?'Defeat':'Victory'),(lose?'defeat':'victory')+' settles promptly through the real damage and result pipeline');
 }
 {
  const b=start();for(const g of Object.values(b.groups))if(g.team===1)g.resolve?.route();
  for(let i=0;i<100&&t.B===b;i++)t.updateBattle(1/60);
  ok(t.B===null&&b.win,'a whole enemy rout is final instead of rallying during a long victory delay');
 }
 {
  const b=start(),a=b.world,u=b.units.find(u=>u.team===1),tr=b.terrain;
  tr.kind.fill(t.TKIND.open);tr.lvl.fill(0);tr.built.fill(0);tr.wall.fill(0);
  // A rock strip covers the radial destination; a legal escape exists around it.
  for(let i=0;i<tr.kind.length;i++){const x=(i%tr.C+.5)*tr.cs,y=(Math.floor(i/tr.C)+.5)*tr.cs;if(x>a.cx+a.radius-16)tr.kind[i]=t.TKIND.rock}
  tr.routes.build(8,t.BH-8);a.escapeRoutes=tr.route;tr.index();u.x=a.cx+a.radius-30;u.y=a.cy;u.rout=true;const hp=u.hp;
  let frames=0,legal=true;for(;frames<1800&&!u.left;frames++){b.t+=1/30;const was=new Map([[u,[u.x,u.y]]]);a.escape(u,1/30);t.keepOffObstacles(was);legal&&=!tr.solid[t.tIx(tr,u.x,u.y)]}
  ok(legal,'escaping never steps through the blocking rock');
  ok(u.left&&!a.inside(u)&&u.hpLeft===hp,'a router walks to a reachable circular exit when its radial destination is rock');info('Blocked exit: '+frames+' frames');
 }
 {
  const b=start(),g=Object.values(b.groups).find(g=>g.player&&g.sourceGroupId),m=b.units.filter(u=>u.grp===g.id);ok(Math.hypot(m[0].x-m[1].x,m[0].y-m[1].y)>30,'enlarged sprites have matching formation spacing instead of stacking on each other');ok(b.speed===4,'world combat inherits the current campaign speed');
  ok([...document.querySelectorAll('[data-bspeed]')].map(e=>e.dataset.bspeed).join(',')==='1,2,4,8','world combat offers the campaign 1x/2x/4x/8x choices');
  t.setBattleSpeed(2);ok(G.speed===2&&b.speed===2,'changing combat speed updates the shared campaign speed');
  let at=b.t;t.updateBattle(.01);const slow=b.t-at;document.querySelector('[data-bspeed="4"]').click();at=b.t;t.updateBattle(.01);ok(Math.abs((b.t-at)/slow-2)<1e-8,'world combat time doubles exactly from 2x to 4x');
  const settings=document.createElement('div');settings.innerHTML=t.settingsPage();ok([...settings.querySelectorAll('[data-act="bspeed"]')].map(e=>e.dataset.arg).join(',')==='1,2,4,8','Settings uses the same campaign speed choices during world combat');
  ok(!b.fog&&!t.sightOn(),'world battle has no tactical fog or sight concealment');for(const u of b.units)u.hid=3;t.sightStep(true);ok(b.units.every(u=>t.seenBy(0,u)&&t.seenBy(1,u)),'both sides see every combatant, including enemies formerly hidden by woods or range');
  t.frame();const native=t.VS;window.eval('VS=3');const u=b.hero,ctx=t.ctx,draw=ctx.drawImage,poses=[];ctx.save();ctx.setTransform(1,0,0,1,0,0);
  try{ctx.drawImage=function(...args){const m=this.getTransform();poses.push({x:m.e,y:m.f,k:m.a});return draw.apply(this,args)};u.x=b.world.cx+.3;u.y=b.world.cy+.3;t.drawUnit(u);const first=poses.find(p=>Math.abs(p.k)>0);poses.length=0;u.x+=2;t.drawUnit(u);const second=poses.find(p=>Math.abs(p.k)>0);ok(first&&second&&second.x!==first.x,'sub-world-pixel movement advances on the native display pixels');ok(first&&Math.abs(first.k)>2,'combat sprites are enlarged independently of the world camera')}
  finally{ctx.drawImage=draw;ctx.restore();window.eval('VS='+native)}
  const mind=t.CharacterMind.of(b.hero),auto=mind.auto,turn=window.updateNonHeroActors;let heroTime=0,troopTime=0;mind.auto=function(dt){heroTime+=dt;return auto.call(this,dt)};window.updateNonHeroActors=dt=>{troopTime+=dt;return turn(dt)};
  try{b.hx.stop=1;b.slow=1;t.updateBattle(.03);ok(troopTime>0&&Math.abs(heroTime-troopTime)<1e-8,'hero and soldiers share one movement clock without hero impacts freezing the whole battle')}finally{mind.auto=auto;window.updateNonHeroActors=turn}
  // Fog removal is local to the combat area and does not fill campaign exploration memory.
  const memory=t.W.seen.slice(),cam={x:b.world.x-30,y:b.world.y-30};ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,t.cv.width,t.cv.height);b.world.fog(cam,()=>{ctx.fillStyle='#ff0000';ctx.fillRect(0,0,t.VW+1,t.VH+1)});const clear=ctx.getImageData(30,30,1,1).data[3],outside=ctx.getImageData(Math.min(t.VW-1,Math.ceil(30+b.world.r+t.WORLD_BATTLE.apron+4)),30,1,1).data[3];ctx.restore();ok(clear===0&&outside===255,'world fog covers surrounding land while leaving the fight and escape apron clear');ok(memory.every((v,i)=>v===t.W.seen[i]),'battle visibility does not permanently reveal unexplored campaign land');
  b.paused=true;const paused=b.t;t.updateBattle(.1);ok(b.t===paused,'tactical pause still stops the shared-speed simulation');b.paused=false;
  const speed=G.speed;t.finishBattle();ok(G.speed===speed,'returning from combat retains the speed the player selected');
 }
});
