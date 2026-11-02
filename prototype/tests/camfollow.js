'use strict';
// The map's camera eased after your army (gfx/render.js camFollow, CAM_FOLLOW; the owner, 2026-11-02: on a short walk "the camera
// will snap"): a two-tile walk scrolls the map in small steps, and then, its men settling, its point wobbling a few px a while, the
// camera stands still through it (a locked camera followed that wobble: the snap); a leap is gone to at once; off, locked, as before.
Kit.suite(({ok,info})=>{const t=T,P=t.P,G=t.G,F=t.CAM_FOLLOW,pn=performance.now;let now=1e7;performance.now=()=>now;
 try{Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.mode='world';G.paused=false;
  const h=t.townBy('Ashford');Kit.goTo(h.x+260,h.y+220);P.troops={hum_foot:12};P.comps={};P.bsta=100;t.MARCH_ARMIES.delete(P);F.force=true;
  const tick=()=>{now+=1000/30;t.updateWorld(1/30);t.frame()},cx=()=>G.cam.x+t.VW/2;
  for(let i=0;i<90;i++)tick();const c0=cx(),p0=P.x;P.tx=P.x+32;P.ty=P.y;let most=0,last=G.cam.x;
  for(let i=0;i<30*4;i++){tick();most=Math.max(most,Math.abs(G.cam.x-last));last=G.cam.x}
  let wob=0,lp=P.x,lc=G.cam.x,cam=0;for(let i=0;i<30*4;i++){tick();wob+=Math.abs(P.x-lp);cam+=Math.abs(G.cam.x-lc);lp=P.x;lc=G.cam.x}
  info('walked '+(P.x-p0).toFixed(1)+' px, the camera '+(cx()-c0).toFixed(1)+', its biggest step '+most.toFixed(2)+'; then its point wobbled '+wob.toFixed(1)+' px, the camera '+cam.toFixed(1));
  ok(most<=1.5&&cam<=Math.max(.5,wob*.2),'a two-tile walk: the camera in steps of at most '+most.toFixed(2)+' px, then still ('+cam.toFixed(1)+' px) while your men settle (their point '+wob.toFixed(1)+' px)');
  ok(Math.abs(cx()-P.x)<=F.dead+1,'and keeps your army within '+F.dead+' px of the middle ('+(cx()-P.x).toFixed(1)+')');
  Kit.goTo(P.x+600,P.y);t.MARCH_ARMIES.delete(P);tick();ok(Math.abs(cx()-P.x)<2,'a leap: gone to at once ('+(cx()-P.x).toFixed(1)+' px off)');
  F.on=false;try{P.x+=10;tick();ok(Math.abs(cx()-P.x)<1,'off: locked on your army, as before')}finally{F.on=true}
 }finally{performance.now=pn;F.force=false}
});
