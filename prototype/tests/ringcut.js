'use strict';
// A fight on the map drawn as a cut of the map (the owner, 2026-11-26: "the separated should remain the same map detail just a cut
// version in the battle ring ... keep all element the same and draw only ring's picture"; gfx/render.js RING_CUT, RingCut;
// PREFS.separate): on by default; its ring's picture as the map draws it, whoever moves outside it not drawn, nor the fog, dark past
// its edge; off, the whole map as before; the world runs on round it.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);G.paused=false;G.speed=1;t.GUIDE.on=false;W.seen.fill(1);
 ok(t.prefGet('separate')===true,'on by default');
 G.mode='world';G.modal=false;P.troops={hum_levy:12,hum_bow:6};
 const e=t.asParty({kind:'bandits',troops:Array(12).fill('militia'),x:P.x+60,y:P.y,cool:0});W.parties.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
 t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const B=t.B;ok(!!B&&!!B.world,'a fight on the map');if(!B)return;if(B.muster)B.muster.active=false;B.ready=true;B.paused=false;
 const A=B.world;G.cam.x=A.x-VW/2+A.r*.9;G.cam.y=A.y-VH/2;A.syncCamera();for(let i=0;i<20;i++){t.updateBattle(1/60);t.openFightWorld(1/60*t.WORLD_TEMPO);t.frame()}
 const cv=document.querySelector('canvas'),g=cv.getContext('2d'),k=cv.width/(VW+1),px=(x,y)=>[...g.getImageData(Math.round((x-G.cam.x)*k),Math.round((y-G.cam.y)*k),1,1).data].slice(0,3),dark=c=>c.every((v,i)=>Math.abs(v-t.RING_CUT.col[i])<=3);
 // (outside the ring dark, inside the map's picture)
 const far={x:A.x+A.r+t.RING_CUT.pad+t.RING_CUT.feather+20,y:A.y},mid={x:A.x+A.r*.5,y:A.y-A.r*.3};
 const ow=window.worldOverdraw;let movers=null;window.worldOverdraw=(list,cam)=>{if(!movers)movers=list;return ow(list,cam)};// (the map's movers: its first call a frame; its men's after it, drawBattle)
 try{t.frame();ok(dark(px(far.x,far.y))&&!dark(px(mid.x,mid.y)),'outside the ring dark, inside it the map ('+px(far.x,far.y)+' / '+px(mid.x,mid.y)+')');
  ok(movers&&movers.every(m=>t.RingCut.inside(m.x,m.y)),'whoever moves outside it not drawn ('+(movers?movers.length:0)+' drawn)');
  // (off: the whole map, as before)
  t.prefSet('separate',false);t.FightSnap.clear();t.frame();ok(!t.RingCut.on()&&!dark(px(far.x,far.y)),'switched off: the whole map, as before')}
 finally{window.worldOverdraw=ow;t.prefSet('separate',true)}
 // (the world runs on round it)
 const c0=G.clock+G.day*t.DAY;for(let i=0;i<30;i++)t.openFightWorld(1/60*t.WORLD_TEMPO);ok(G.clock+G.day*t.DAY>c0,'the world runs on round it');
 t.BattleSetup.undo();G.mode='world';ok(!t.RingCut.on(),'out of the fight: the map as ever');
 ok(!ERR.length,'no runtime errors')});
