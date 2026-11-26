'use strict';
// A fight on the map fought over a still copy of its ground (the owner, 2026-11-26: "make it into a small battle map ... create a copy
// version of the area and battle in a separate map", tried in place first; gfx/render.js FIGHT_SNAP, FightSnap): what stands drawn once
// and kept while the camera holds, drawn again when it moves, out of the fight none kept; the picture as if drawn whole. The look for
// who rides in, every WORLD_BATTLE.scan s, not every frame (battle/worldbattle.js reinforce).
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W,F=t.FightSnap,on0=t.FIGHT_SNAP.on;t.FIGHT_SNAP.on=true;// (off by default since 2026-11-26: the switch on for this)
window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);G.paused=false;G.speed=1;t.GUIDE.on=false;
 G.mode='world';G.modal=false;P.troops={hum_levy:12,hum_bow:6};
 const e=t.asParty({kind:'bandits',troops:Array(12).fill('militia'),x:P.x+70,y:P.y,cool:0});W.parties.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
 t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const B=t.B;ok(!!B&&!!B.world,'a fight on the map');if(!B)return;if(B.muster)B.muster.active=false;B.ready=true;B.paused=false;
 for(let i=0;i<30;i++){t.updateBattle(1/60);t.frame()}
 // (kept, then used while the camera holds)
 const fresh=F.fresh.bind(F);let hits=0;F.fresh=(k,n)=>{const r=fresh(k,n);if(r)hits++;return r};
 try{t.frame();const k0=F.key;t.frame();t.frame();ok(!!F.q&&hits>=2&&F.key===k0,'what stands kept, and drawn from it while the camera holds ('+hits+' frames)');
  // (the camera moved: drawn again, kept anew)
  G.cam.x+=7;t.B.world.syncCamera();const h0=hits;t.frame();ok(hits===h0&&F.key!==k0&&!!F.q,'the camera moved: drawn again and kept anew');
  // (the picture as if drawn whole every frame: the same but for what moves on its own)
  const cv=document.querySelector('canvas'),grab=()=>cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;t.frame();const a=grab();
  t.FIGHT_SNAP.on=false;t.frame();const b=grab();t.FIGHT_SNAP.on=true;let diff=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>24)diff++;
  const share=diff/(a.length/4);ok(share<.02,'the picture as if drawn whole: '+(share*100).toFixed(2)+'% of its pixels differ (flames, flags)')}
 finally{F.fresh=fresh;t.FIGHT_SNAP.on=on0}
 // (who rides in: looked for every scan s, not every frame)
 {const A=B.world,R=t.WORLD_BATTLE.scan,rf=A.reinforce;let n=0;A.reinforce=function(dt,look){if(look)n++;return rf.call(this,dt,look)};A.scanT=0;
  try{for(let i=0;i<60;i++)A.step(1/60)}finally{delete A.reinforce}ok(n>=Math.floor(1/R)&&n<=Math.ceil(1/R)+1,'who rides in looked for '+n+' times in a second (every '+R+' s)')}
 // (out of the fight: none kept)
 t.BattleSetup.undo();G.mode='world';t.frame();ok(!F.q,'out of the fight: none kept');
 ok(!ERR.length,'no runtime errors')});
