'use strict';
window.RUN=async()=>{const {ok,exc,out}=Kit.report(),t=T,P=t.P,G=t.G,W=t.W,H=t.WildHunt;
 try{
  window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;G.speed=1;P.gear.weapon=t.gearId('sword',2);P.troops={hum_bow:4};
  const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+25;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
  const herd=(offset)=>t.asHerd({crit:true,id:'deer',n:3,x:P.x+offset,y:P.y,hx:P.x+offset,hy:P.y,dir:1,t:5,a:0,cool:0,idle:true,escapeSta:0});let c=herd(25);W.critters=[c];t.frame();
  document.getElementById('mapToggle').click();document.querySelector('#worldMapChoices [data-act="hunt-area"]').click();ok(H.armed&&document.getElementById('worldMapChoices').hidden,'mobile Map control arms the hunting area');
  const cv=t.cv,r=cv.getBoundingClientRect(),point={clientX:r.left+(c.x-G.cam.x)/t.VW*r.width,clientY:r.top+(c.y-G.cam.y)/t.VH*r.height};cv.dispatchEvent(new PointerEvent('pointerdown',{...point,pointerType:'touch',pointerId:71,isPrimary:true,button:0,bubbles:true}));await new Promise(resolve=>setTimeout(resolve,t.RING.hold+60));window.dispatchEvent(new PointerEvent('pointerup',{...point,pointerType:'touch',pointerId:71,isPrimary:true,button:0,bubbles:true}));
  ok(H.choice&&G.mode==='dialog'&&!document.querySelector('[data-act="hunt-pick"]'),'finger hold previews a whole-army hunt without hunter selection');document.querySelector('[data-act="hunt-start"]').click();t.frame();
  let b=t.B,a=b.hunt;ok(window.mobileBattleHud.enabled&&G.mode==='battle'&&!b.muster,'the hunt uses the mobile battle HUD immediately');
  document.getElementById('battleOrdersToggle').click();document.getElementById('bAuto').click();ok(t.aiAll(),'the existing mobile AI button enables Auto Hunt');
  const bows=b.units.filter(u=>u.type==='hum_bow'),ammo=bows.reduce((n,u)=>n+(u.ammo??t.quiverOf(u.s)),0),began=a.animals.map(u=>({u,x:u.x,y:u.y}));let arrows=false;
  for(let i=0;i<900&&t.B===b&&!b.kills&&!b.over;i++){t.updateBattle(.05);arrows=arrows||b.arrows.length>0}
  ok(b.kills>0&&arrows&&bows.reduce((n,u)=>n+(u.ammo??t.quiverOf(u.s)),0)<ammo,'Auto Hunt fires ordinary projectiles, spends normal ammunition and kills wildlife');ok(began.some(({u,x,y})=>Math.hypot(u.x-x,u.y-y)>1)&&a.animals.some(u=>u.escapeSta===0),'individual wildlife physically flees at its exhausted speed');
  document.getElementById('battleMoreToggle').click();const end=document.getElementById('huntEnd'),er=end.getBoundingClientRect();ok(!end.hidden&&er.width>0&&er.left>=0&&er.right<=innerWidth&&er.top>=0&&er.bottom<=innerHeight,'End hunt is reachable inside the mobile More drawer');end.click();ok(!t.B&&G.mode==='dialog'&&G.loot.pile.some(s=>s.id==='meat'),'ending via the mobile battle UI opens kill-based loot');t.act('lt-leave');Kit.done({world:true});
  P.troops={hum_foot:4};P.bsta=100;G.paused=false;c=herd(12);W.critters=[c];t.frame();H.prepare(c);H.start();t.frame();b=t.B;a=b.hunt;t.setAuto(true,true);const feet=b.units.filter(u=>u.type==='hum_foot'),starts=feet.map(u=>({u,x:u.x,y:u.y}));
  for(let i=0;i<1400&&t.B===b&&!b.kills&&!b.over;i++)t.updateBattle(.05);
  ok(b.kills>0&&starts.some(({u,x,y})=>Math.hypot(u.x-x,u.y-y)>5),'melee-only Auto Hunt physically closes on exhausted animals and kills at weapon reach');
  ok(!b.units.some(u=>u.type==='hum_bow')&&!b.arrows.length,'melee hunting needs no ranged troops or separate hunt mode');ok(b.units.filter(u=>!u.team&&u.hp>0&&!u.rout).every(u=>a.inside(u)),'automatic hunters remain inside the fixed area');
  t.frame();ok(!ERR.length,'whole-army mobile hunting has no runtime errors');
 }catch(e){exc(e)}out();
};
