'use strict';
// Health squares that stay on their men (the owner, 2026-11-25: "The hp square is not smoothly attach to the units"; ui/individualhealth.js
// IndividualHealth anchors, gfx/marchdraw.js drawMarcherAt): each man's squares over his head as he was drawn this frame (his place to the
// scene's px, his step, the land's lift), on the screen's whole px; while the band walks they keep to him frame by frame.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,IH=t.IndividualHealth;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);
 P.troops={hum_spear:6,hum_foot:4};const was=t.HPBARS.on;t.HPBARS.on=true;G.paused=false;P.tx=P.x+120;P.ty=P.y+20;
 const paint=IH.paint,calls=[];IH.paint=function(x,y,...a){calls.push([x,y]);return paint.call(this,x,y,...a)};
 let frames=0,men=0,off=0,worst=0,missed=0;
 try{for(let i=0;i<40;i++){calls.length=0;t.frame();const A=t.MARCH_ARMIES.get(P);if(!A)continue;frames++;
   const cam=G.cam,k=IH.scale(t.dprOf()/t.VS,t.VS);
   for(const u of A.units){const a=IH.anchors.get(u);if(!a){missed++;continue}men++;
     // (his anchor on him: within a game px of his place across, his head above his feet)
     const dx=Math.abs(a.x-u.x);worst=Math.max(worst,dx);if(dx>.5+1/t.VS||!(a.y<u.y))off++;
     // (his squares painted at it)
     const want=[a.x-cam.x,a.y-cam.y-t.UNIT_HEALTH.clear*k];if(!calls.some(c=>Math.abs(c[0]-want[0])<1e-6&&Math.abs(c[1]-want[1])<1e-6))off++}}}
 finally{IH.paint=paint;t.HPBARS.on=was}
 info(frames+' frames walking, '+men+' men drawn with squares, worst across '+worst.toFixed(3)+' px, '+missed+' not anchored');
 ok(frames>20&&men>frames*5,'the band walks and its men are drawn with their squares');
 ok(missed===0,'every man drawn has his squares anchored to his drawing');
 ok(off===0,'each man\'s squares on him as drawn, frame by frame ('+off+' off)');
 ok(!ERR.length,'no runtime errors')});
