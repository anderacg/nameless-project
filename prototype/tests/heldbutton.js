'use strict';
// A finger on a button (ui/input.js): held and let go on it, it is still pressed, once (phones drop the click of a held tap); a
// quick tap and a click the browser sends anyway are not pressed twice; a finger that slides off presses nothing; a quick tap the
// browser cancels for a scroll that hardly moved is pressed, a real scroll is not. Buttons select no text, and hover looks are only
// where there is a mouse (style.css).
Kit.suite(({ok})=>{
 const t=T;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const b=document.createElement('button');b.className='btn';b.textContent='Held';b.style.cssText='position:fixed;left:40px;top:40px;width:120px;height:44px;z-index:9999';document.body.appendChild(b);
 let n=0;b.addEventListener('click',()=>n++);const r=b.getBoundingClientRect(),x=r.left+20,y=r.top+20;
 const pn=performance.now,st=window.setTimeout,later=[];let now=1000;performance.now=()=>now;window.setTimeout=(f,ms)=>{later.push(f);return 0};
 const fire=(k,px=x,py=y)=>b.dispatchEvent(new PointerEvent(k,{pointerId:7,pointerType:'touch',clientX:px,clientY:py,bubbles:true,composed:true}));
 const run=()=>{while(later.length)later.shift()()};
 try{
  fire('pointerdown');now+=t.TOUCH.hold+100;fire('pointerup');run();ok(n===1,'held and let go on it: pressed once');
  n=0;fire('pointerdown');now+=t.TOUCH.hold+100;fire('pointerup');b.click();run();ok(n===1,'and when the browser clicks it as well: still once');
  n=0;fire('pointerdown');now+=80;fire('pointerup');run();ok(n===0,'a quick tap is left to the browser’s own click');
  n=0;fire('pointerdown');now+=t.TOUCH.hold+100;fire('pointerup',x+200,y);run();ok(n===0,'a finger that slides off presses nothing');
  n=0;fire('pointerdown');now+=60;fire('pointermove',x+4,y+3);fire('pointercancel',x+4,y+3);ok(n===1,'a quick tap the browser cancelled for a scroll that hardly moved: pressed');
  n=0;fire('pointerdown');now+=60;fire('pointermove',x+4,y+40);fire('pointercancel',x+4,y+40);ok(n===0,'a real scroll presses nothing');
  const cs=getComputedStyle(b);ok(cs.userSelect==='none'||cs.webkitUserSelect==='none','buttons select no text when held');
 }finally{performance.now=pn;window.setTimeout=st;b.remove()}
 const css=[...document.styleSheets].flatMap(s=>{try{return [...s.cssRules]}catch(e){return []}}),loose=css.filter(r=>r.selectorText&&/:hover/.test(r.selectorText));
 ok(!loose.length,'every hover look is kept for a mouse (none outside @media (hover:hover))'+(loose.length?': '+loose.map(r=>r.selectorText).join(' | '):''));
});
