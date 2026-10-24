'use strict';
// Screenshot scenes: ?scene=start|meet|lords|rumours; &w=844&h=390.
Kit.suite(({ok})=>{
 const t=T,G=t.G,W=t.W,P=t.P,u=new URLSearchParams(location.search),scene=u.get('scene')||'meet';
 window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.world({town:null});
 const size=()=>{if(u.get('w')){const s=document.getElementById('screen').style;s.width=u.get('w')+'px';s.height=u.get('h')+'px'}};size();
 if(scene==='start')t.openJournal('lords');
 else{
  Kit.clear();P.hostile={};W.news=undefined;const l=W.lords.find(x=>x.name==='Lord Aldric'),mate=W.lords.find(x=>x!==l&&x.fac===l.fac),at=t.fiefsOf(l.fac)[0];
  Object.assign(l,{inside:null,x:P.x+3,y:P.y});t.newsRecord('lord',at,{lord:mate.name,fac:mate.fac});t.lordMeet(l);
  if(scene==='lords')t.act('lr-lords',l.id);if(scene==='rumours')t.act('lr-rumours',l.id);
 }
 document.getElementById('panel').style.animation='none';addEventListener('resize',size);ok(true,'lord dialogue '+scene);
});
