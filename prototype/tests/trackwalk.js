'use strict';
// Tracks by who walked them (the owner, 2026-11-21: "Tracks are not follow the characters, can you make it more realistic follow the
// characters and amount of steps"; gfx/worldterrain.js stepPrint, printGround, printsSeen; world/tracks.js trackHead, Track#wide,
// walked, stamp; gfx/tracks.js trackPic, drawTracks; data/tracks.js dense, wide). Each man's every step leaves a print under his own
// foot, on grass and a dirt road as on snow and sand; a band's kept trail is as wide as its men walked and holds a print a man a
// step; and its strewn prints wait while its men's own still show.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,K=t.Tracks,TR=t.TRACKS,PR=t.WORLD_TERRAIN.prints,F=t.FOOTPRINTS;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.mode='world';G.paused=false;G.speed=1;
 const h=t.townBy('Ashford');Kit.goTo(h.x+240,h.y+200);P.troops={hum_foot:24};P.comps={};P.bsta=100;t.MARCH_ARMIES.delete(P);
 const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE),keep=new Map();for(let y=ty-20;y<=ty+20;y++)for(let x=tx-10;x<=tx+40;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;keep.set(i,t.tiles[i]);t.tiles[i]=t.T_OPEN}
 try{
  // ---- each man's own prints ----
  {const r=t.sceneRes(),grass=[],spot=(k)=>{for(let d=0;d<400;d+=7)for(let a=0;a<12;a++){const x=P.x+Math.cos(a*.52)*d,y=P.y+Math.sin(a*.52)*d;let all=true;for(let e=0;e<=32&&all;e+=2)for(const v of [-1,0,1])if(t.printGround(x+e,y+v)!==k)all=false;if(all){t.printGround(x,y);return{x,y,s:t.PRINT_AT.s}}}return null};// (a run of it 32 px east)
   const g=spot(PR.kinds.grass);ok(g&&Math.abs(g.s-PR.strong[PR.kinds.grass])<1e-9,'grass takes a print, fainter than snow or sand ('+(g?g.s:'none found')+' of theirs)');
   let wet=null;for(let y=2;y<t.MH-2&&!wet;y++)for(let x=2;x<t.MW-2&&!wet;x++)if(t.tiles[y*t.MW+x]===t.T_WATER)wet={x:(x+.5)*t.TILE,y:(y+.5)*t.TILE};
   ok(wet&&t.printGround(wet.x,wet.y)===-1,'water takes none');
   if(r<=1||!g)info('the scene at game px here: no fine prints laid');else{
    F.n=0;F.at=0;const u={x:g.x,y:g.y},who={},steps=10,far=steps*PR.step+.5;t.stepPrint(u,false,who);for(let d=PR.step/2;d<=far;d+=PR.step/2){u.x=g.x+d;t.stepPrint(u,false,who)}
    const B=F.buf,xs=[];for(let k=0;k<F.n;k++)xs.push(B[k*6]/r);
    ok(F.n>=Math.floor(far/(PR.step*1.5))&&F.n<=steps&&xs.every(x=>x>=g.x&&x<=g.x+far+1),'a man walking '+far.toFixed(0)+' px leaves a print each step (once his foot has gone '+PR.step+' px) under his own feet: '+F.n+' prints, none off his way');
    const sides=new Set();for(let k=0;k<F.n;k++)sides.add(Math.sign(B[k*6+4]));ok(sides.size===2&&Math.abs(Math.abs(B[4])-PR.strong[PR.kinds.grass])<1e-6,'a left and a right by turns, as faint as its ground makes them');
    ok(t.printsSeen(who)>0&&t.printsSeen({})===0,'his band is told its men\'s prints are being drawn');
    F.n=0;F.at=0;const hv={x:g.x,y:g.y};t.stepPrint(hv,true,null);for(let d=.5;d<=6;d+=.5){hv.x=g.x+d;t.stepPrint(hv,true,null)}ok(F.n>0&&F.buf[3]>=16,'a horse\'s or a beast\'s a round pad, not a boot\'s')}}
  // ---- a band's trail as wide as its men walked ----
  K.reset();t.MARCH_ARMIES.delete(P);for(let i=0;i<40;i++)t.updateWorld(1/30);const x0=P.x;P.tx=P.x+300;P.ty=P.y;for(let i=0;i<30*10&&P.x<x0+170;i++)t.updateWorld(1/30);
  const tr=t.W.tracks.find(q=>q.k==='you'),a=t.MARCH_ARMIES.get(P);
  {const ys=a?a.units.filter(u=>!u.dead).map(u=>u.y):[0],half=(Math.max(...ys)-Math.min(...ys))/2;
   ok(tr&&tr.size>=3&&tr.w>=0&&Math.abs(tr.w-half)<=Math.max(3,half*.5),'your army of 25 leaves a trail as wide as it walks: half its '+(2*half).toFixed(0)+' px across kept ('+(tr?tr.w.toFixed(1):'none')+')');
   const one=new t.Track('lord',1,0,'',0),many=new t.Track('lord',25,0,'',0);ok(one.wide===0&&Math.abs(many.wide-4*TR.spread)<1e-9,'a trail from a save, its width not known, by its number: one walker none, 25 men '+many.wide.toFixed(1)+' px either side');
   const e=new t.Track('lord',9,0,'',0);e.walked(10,2);e.walked(20,2);ok(e.w>10&&e.w<20&&e.c===2,'its width follows its band as it is laid')}
  // ---- its prints: one a man a step, strewn across it ----
  {const px=S=>{const d=S.getContext('2d').getImageData(0,0,S.width,S.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n},pic=(c,w,v,alt)=>t.trackPic('hobnail',0,0,alt||0,0,c,w,v||0);
   const n1=px(pic(1,1)),n6=px(pic(6,12)),n12=px(pic(12,12)),n24=px(pic(24,60));ok(n1>0&&n6>n1*2&&n12>n6&&n24>n12,'the more men, the more prints a step ('+n1+' px for one, '+n6+' for six, '+n12+' for twelve, '+n24+' for twenty-four or more)');
   ok(pic(6,24).height>pic(6,3).height&&pic(6,24).height<=2*24+12&&pic(24,60).height>pic(6,24).height,'strewn as wide as they walked ('+pic(6,3).height+' px across for 3 either side, '+pic(6,24).height+' for 24)');
   const L=pic(1,1,0,0),R=pic(1,1,0,1);ok(L!==R&&L.oy!==R.oy,'one walker\'s a left then a right, either side of his line');
   ok(pic(6,12,0)!==pic(6,12,1)&&pic(6,12,0)===pic(6,12,0),'each stretch its own strewing of '+TR.vary+', each made once');
   ok(t.trackNear(TR.dense,1)===1&&t.trackNear(TR.dense,7)===8&&t.trackNear(TR.dense,400)===TR.dense[TR.dense.length-1]&&t.trackNear(TR.wide,0)===1&&t.trackNear(TR.wide,13)===16,'as many as its men, '+TR.dense[TR.dense.length-1]+' the most; its width to the next kept')}
  // ---- its strewn prints wait while its men's own show ----
  if(tr){const all=t.W.tracks;t.W.tracks=[tr];const mid=3*(tr.size>>1),cam={x:Math.floor(tr.p[mid]-t.VW/2),y:Math.floor(tr.p[mid+1]-t.VH/2)},cv=document.createElement('canvas');cv.width=t.VW;cv.height=t.VH;// (the view over its middle)
   const count=()=>{let n=-1;const g=cv.getContext('2d');window.__g=g;window.eval('var __c=ctx;ctx=window.__g;try{window.__n=drawTracks({x:'+cam.x+',y:'+cam.y+'})}finally{ctx=__c}');return window.__n};
   try{const rt0=tr.rt;tr.rt=null;const old=count();tr.rt=Array.from({length:tr.size},()=>performance.now());const fresh=count();tr.rt=Array.from({length:tr.size},()=>performance.now()-PR.fade*1000);const faded=count();tr.rt=rt0;
    ok(old>0&&fresh===0&&faded===old,'a stretch laid while its men\'s own prints were drawn shows none of its own until theirs have faded ('+old+' drawn old, '+fresh+' fresh, '+faded+' after)')}
   finally{t.W.tracks=all}}
  ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
 }finally{for(const [i,k] of keep)t.tiles[i]=k}
});
