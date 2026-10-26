'use strict';
window.RUN=async()=>{const {ok,exc,out}=Kit.report(),t=T,P=t.P,G=t.G,W=t.W,H=t.WildHunt;
 try{
  window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;P.gear.weapon=t.gearId('sword',2);P.troops={hum_foot:3,hum_bow:2};G.paused=false;
  const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+25;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
  const c=t.asHerd({crit:true,id:'deer',n:3,x:P.x+25,y:P.y,hx:P.x+25,hy:P.y,dir:1,t:5,a:0,cool:0,idle:true,escapeSta:0});W.critters=[c];t.frame();G.cam.x=P.x-t.VW/2;G.cam.y=P.y-t.VH/2;t.frame();
  document.getElementById('mapToggle').click();document.querySelector('#worldMapChoices [data-act="hunt-area"]').click();ok(H.armed&&document.getElementById('worldMapChoices').hidden,'mobile Map control arms hunting and closes the menu');
  const cv=t.cv,r=cv.getBoundingClientRect(),point={clientX:r.left+(c.x-G.cam.x)/t.VW*r.width,clientY:r.top+(c.y-G.cam.y)/t.VH*r.height};cv.dispatchEvent(new PointerEvent('pointerdown',{...point,pointerType:'touch',pointerId:71,isPrimary:true,button:0,bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,t.RING.hold+60));window.dispatchEvent(new PointerEvent('pointerup',{...point,pointerType:'touch',pointerId:71,isPrimary:true,button:0,bubbles:true}));
  ok(H.choice&&G.mode==='dialog'&&panelShown()&&!H.armed,'a real finger hold opens the hunting-area preview without travelling');
  t.act('hunt-method','melee');t.act('hunt-start');const h=H.active;h.pursue=true;h.actor(c).alert=1;const hunterStarts=h.sources.map(u=>[u,u.x,u.y]),preyStart=c.x,anchor={x:h.x,y:h.y},endButton=document.querySelector('#huntBar [data-hunt="end"]'),meat=t.goodN('meat');
  let frames=0;for(;frames<1200&&!h.body;frames++){const rt=.05,d=rt*t.WORLD_PACE;t.EscapeStamina.tick(rt);h.step(d,rt);t.updateCritters(d);t.marchStep(d);t.MarchArmy.of(P).step(d)}
  ok(h.body&&c.n===2&&hunterStarts.some(([u,x,y])=>Math.hypot(u.x-x,u.y-y)>2)&&c.x>preyStart,'automatic melee pursuit physically catches exhausted fleeing prey');
  ok(h.x===anchor.x&&h.y===anchor.y&&h.sources.every(u=>h.inside(u)),'the hunting circle stays fixed and pursuing hunters remain inside it');
  ok(endButton===document.querySelector('#huntBar [data-hunt="end"]'),'status updates preserve mobile action buttons during a touch');
  document.querySelector('#huntBar [data-hunt="collect"]').click();for(let i=0;i<100&&h.body;i++){h.step(.02,.05);t.marchStep(.02);t.MarchArmy.of(P).step(.02)}ok(!h.body&&t.goodN('meat')>meat,'Collect works through the mobile control and actual hunter movement');
  const draw=t.ctx.drawImage,calls=[];try{t.ctx.drawImage=function(...a){calls.push(a);return draw.apply(this,a)};t.frame()}finally{t.ctx.drawImage=draw}
  const sprites=new Set(Object.keys(t.WORLD_FATIGUE.states).map(s=>t.fatigueSprite(s))),icons=calls.filter(a=>sprites.has(a[0]));ok(icons.length>=2&&icons.every(a=>Math.abs(a[3]*t.VS/(devicePixelRatio||1)-16)<.01),'player and wildlife fatigue icons stay at their own fixed screen size');
  ok(!ERR.length,'the complete mobile hunting flow has no runtime errors');
 }catch(e){exc(e)}out();
 function panelShown(){return !document.getElementById('ov').hidden&&!!document.querySelector('.hunt-setup')}
};
