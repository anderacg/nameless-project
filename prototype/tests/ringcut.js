'use strict';
// A fight on the map drawn as a cut of the map (the owner, 2026-11-26: "the separated should remain the same map detail just a cut
// version in the battle ring ... keep all element the same and draw only ring's picture"; gfx/render.js RING_CUT, RingCut;
// PREFS.separate): on by default; its ring's picture as the map draws it, every feature of it ("include all feature in separated
// battle": the fog of what your men do not see, its fires, flags and fish live), whoever moves outside it not drawn, dark past its edge; off, the whole map as before; the world runs on round it.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);G.paused=false;G.speed=1;t.GUIDE.on=false;W.seen.fill(1);
 ok(t.prefGet('separate')===true,'on by default');
 G.mode='world';G.modal=false;P.troops={hum_levy:12,hum_bow:6};
 const e=t.asParty({kind:'bandits',troops:Array(12).fill('militia'),x:P.x+60,y:P.y,cool:0});W.parties.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
 t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const B=t.B;ok(!!B&&!!B.world,'a fight on the map');if(!B)return;if(B.muster)B.muster.active=false;B.ready=true;B.paused=false;
 const A=B.world;G.cam.x=A.x-VW/2+A.r*.9;G.cam.y=A.y-VH/2;A.syncCamera();for(let i=0;i<20;i++){t.updateBattle(1/60);t.openFightWorld(t.Time.map(1/60));t.frame()}
 const cv=document.querySelector('canvas'),g=cv.getContext('2d'),k=cv.width/(VW+1),px=(x,y)=>[...g.getImageData(Math.round((x-G.cam.x)*k),Math.round((y-G.cam.y)*k),1,1).data].slice(0,3),dark=c=>c.every((v,i)=>Math.abs(v-t.RING_CUT.col[i])<=3);
 // (outside the ring dark, inside the map's picture)
 const far={x:A.x+A.r+t.RING_CUT.pad+t.RING_CUT.feather+20,y:A.y},mid={x:A.x+A.r*.5,y:A.y-A.r*.3};
 const ow=window.worldOverdraw;let movers=null;window.worldOverdraw=(list,cam)=>{if(!movers)movers=list;return ow(list,cam)};// (the map's movers: its first call a frame; its men's after it, drawBattle)
 try{t.frame();ok(dark(px(far.x,far.y))&&!dark(px(mid.x,mid.y)),'outside the ring dark, inside it the map ('+px(far.x,far.y)+' / '+px(mid.x,mid.y)+')');
  ok(movers&&movers.every(m=>t.RingCut.inside(m.x,m.y)),'whoever moves outside it not drawn ('+(movers?movers.length:0)+' drawn)');
  // (every feature of a fight on the map in it: the fog of what your men do not see, its ground live, not kept still)
  {const f0=window.drawWorldFog,m0=window.fogMem;let fog=0,mem=0;window.drawWorldFog=(...a)=>{fog++;return f0(...a)};window.fogMem=(...a)=>{mem++;return m0(...a)};
   try{t.frame()}finally{window.drawWorldFog=f0;window.fogMem=m0}ok(fog===1&&mem===1&&!t.FightSnap.q,'every feature in it: the fog of what your men do not see, the ground live (fires, flags, fish)')}
  // (off: the whole map, as before)
  t.prefSet('separate',false);t.FightSnap.clear();t.frame();ok(!t.RingCut.on()&&!dark(px(far.x,far.y)),'switched off: the whole map, as before')}
 finally{window.worldOverdraw=ow;t.prefSet('separate',true)}
 // (its dark drawn only where it shows: the feather's band and the flat dark past it, nothing inside the ring; the same picture as the
 //  gradient laid over the whole screen, whatever the view and the screen's scale)
 {const whole=cam=>{const r=A.r+t.RING_CUT.pad,x=A.x-cam.x,y=A.y-cam.y,[R,Gc,Bl]=t.RING_CUT.col,gr=ctx.createRadialGradient(x,y,r,x,y,r+t.RING_CUT.feather);
   gr.addColorStop(0,'rgba('+R+','+Gc+','+Bl+',0)');gr.addColorStop(1,'rgb('+R+','+Gc+','+Bl+')');ctx.fillStyle=gr;ctx.fillRect(-2,-2,VW+4,VH+4)};
  const pic=(f,cam,k)=>{const c=document.createElement('canvas');c.width=Math.ceil((VW+2)*k);c.height=Math.ceil((VH+2)*k);const q=c.getContext('2d',{willReadFrequently:true}),was=ctx;ctx=q;q.setTransform(k,0,0,k,0,0);q.fillStyle='#8a9a50';q.fillRect(0,0,VW+2,VH+2);try{f(cam)}finally{ctx=was}return q.getImageData(0,0,c.width,c.height).data};
  let worst=0,n=0;for(const k of [1,2,3.5])for(const [dx,dy] of [[0,0],[-A.r,0],[A.r*.7,A.r*.7],[-A.r-VW,0],[0,-A.r*1.3],[A.r*.3,-A.r*.2]]){const cam={x:Math.round(A.x+dx-VW/2),y:Math.round(A.y+dy-VH/2)},a=pic(whole,cam,k),b=pic(c=>t.RingCut.draw(c),cam,k);
   for(let i=0;i<a.length;i++)worst=Math.max(worst,Math.abs(a[i]-b[i]));n++}
  ok(worst<=1,'its dark drawn only where it shows, the same picture as over the whole screen ('+n+' views, 3 scales: off by '+worst+' at most)')}
 // (the world runs on round it)
 const c0=G.clock+G.day*t.DAY;for(let i=0;i<30;i++)t.openFightWorld(t.Time.map(1/60));ok(G.clock+G.day*t.DAY>c0,'the world runs on round it');
 t.BattleSetup.undo();G.mode='world';ok(!t.RingCut.on(),'out of the fight: the map as ever');
 ok(!ERR.length,'no runtime errors')});
