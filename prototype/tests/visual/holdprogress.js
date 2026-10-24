'use strict';
// Real map holds, frozen for screenshots: &scene=mouse|touch&progress=.5&w=844&h=390.
Kit.suite(({ok})=>{
 const t=T,q=new URLSearchParams(location.search),touch=q.get('scene')==='touch';window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world();t.GUIDE.on=false;
 const size=()=>{if(q.get('w')){const s=document.getElementById('screen').style;s.width=q.get('w')+'px';s.height=q.get('h')+'px'}};size();addEventListener('resize',size);
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+70,h.y+50);t.G.clock=t.DAY*.3;t.G.paused=true;performance.now=()=>1e7;t.frame();
 const r=t.cv.getBoundingClientRect(),e={clientX:r.left+r.width*.6,clientY:r.top+r.height*.55,pointerType:touch?'touch':'mouse',pointerId:1,isPrimary:true,button:0,bubbles:true};
 t.cv.dispatchEvent(new PointerEvent('pointerdown',e));const p=touch?t.TOUCH.lp:t.RING.press;clearTimeout(p.timer);p.t0-=t.RING.hold*Number(q.get('progress')||.5);t.frame();
 ok(t.drawMapHold()&&!t.ActionRing.now,'visible '+(touch?'touch':'mouse')+' hold progress over the actual map');
});
