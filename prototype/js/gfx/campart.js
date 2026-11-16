'use strict';
/* ---------- camp art: a camp's tents and pieces as the engine's models (the owner, 2026-11-14: "make more tent variety", "make each
   object such as barrel etc more detailed", "if they are a cluster then just stack them", "it should be top down view") ----------
   Each a 16 px model of engine/build-camp.js, drawn in the map's own view (model.js: roofs seen from above, fronts below, lit from
   the upper left, outlined and snowed as every building): CampArt.tent(style, look, seed, clim), a tent of a style (ridge, bell,
   tepee, yurt, pavilion, leanto, pup, marquee, porch, hut; each varied by its seed) in its look's cloth and trim (any colour: the engine's nearest, PX.campLv); CampArt.prop(type,
   n, seed, clim, look), a piece (barrels, crates, sacks, logs: n of them heaped; wagon, cart, stall, shrine, rack, mound); CampArt.army
   (i, seed, clim, col), an army's tent i. Each a canvas as a site's (structures.js siteCanvas: ax, ay its feet, sh its shadow), its
   size in game px.
   At the world lab's scale (engine/worldlab.js: a sprite's px a fine px): each drawn as its model made the scene's times finer
   (CampArt.fine: render.js sceneRes, 2), at its own size in game px, so the same tent with twice the detail (CampArt.put). The
   camp's fire pit (CampArt.pit: a ring of stones round its ash and charred logs, by its seed a spit over it or no stones) and a
   makeshift camp's bedrolls (CampArt.roll) drawn at that scale by hand ---------- */
/* canvas: an army's tents' cloth; army: their styles; pit: a fire pit's stones (lit to dark), ash, logs (lit, side, charred end),
   embers and spit; roll: a bedroll's strap and its pillow (lit, shade); ms: the time a frame may spend making finer pictures */
const CAMP_ART={ms:8,canvas:['#d8ccb0','#cbbd9c','#e0d6c0','#c8b890','#d8d0bc','#b0a490','#ece6d4','#a89a80','#e0c890'],army:['ridge','bell','pup','porch','ridge','marquee','bell','yurt'],
  // (a piece's type here, the engine's there: the logs stacked are its camp_logs)
  props:{woodpile:'logs'},
  pit:{stone:['#b4b0a4','#8e8a80','#6a665e','#4a4640'],ash:['#6a625a','#4a4440','#2e2a28'],log:['#8a6440','#5e4028','#2e2420'],ember:['#ffb444','#f27a2c','#cc4026'],spit:['#7a5634','#4a3220'],meat:['#a8603a','#7a3e24']},
  roll:{strap:'#3e3024',pillow:['#d8ccb0','#b0a488']}};
const CampArt={
  model(type,seed,clim,lv){const k='campm:'+type+':'+seed+':'+clim+':'+lv;if(spr[k])return spr[k];
    const mk=d=>PX.buildingModel({type:'camp_'+type,seed,env:clim,snow:clim==='frost'?1:0,lv,detail:d}),m=mk(1);return spr[k]=siteCanvas(m,m.cell/2,m.cell,mk)},
  tent(style,L,seed,clim){return CampArt.model(style,seed%12,clim,PX.campLv(L.cloth,L.trim,0))},// (each tent its own of 12 by its seed: engine/build-camp.js varies them)
  prop(type,n,seed,clim,L){return CampArt.model(CAMP_ART.props[type]||type,seed%5,clim,PX.campLv(L&&L.cloth,L&&L.trim,Math.min(7,n||1)))},
  // (an army's tents: plain canvas of a few styles, its first, its commander's, a pavilion in its side's colour)
  army(i,seed,clim,col){const A=CAMP_ART;return CampArt.tent(i===0?'pavilion':A.army[(seed+i)%A.army.length],{cloth:A.canvas[(seed*3+i)%A.canvas.length],trim:col||'#8a6a4a'},seed,clim)},
  /* (a model's picture at the scene's finer resolution: the same model made r times finer (its siteCanvas maker), with its shadow
     and its yard (its own shadow shaded in), kept on the picture; none finer to be had, the picture itself. A model takes ms to
     make: those made a frame (render.js drawWorld: FIGURES.tick) stop at CAMP_ART.ms, the rest drawn as they were until a later one) */
  fine(cv){const r=sceneRes();if(r<=1||!cv.mk)return cv;if(cv._lab&&cv._labr===r)return cv._lab;const B=CampArt.budget,t0=performance.now();
    if(B.tick!==FIGURES.tick){B.tick=FIGURES.tick;B.ms=0}if(B.ms>=CAMP_ART.ms)return cv;const m=cv.mk(r),N=m.cell;
    const f=mkc(N,N,g=>{g.drawImage(m.img,0,0);if(m.snow)g.drawImage(m.snow.img,0,0)});f.sh=m.shadow;
    f.gr=mkc(N,N,g=>{g.drawImage(m.ground,0,0);if(m.snow)g.drawImage(m.snow.ground,0,0);g.globalCompositeOperation='source-atop';g.globalAlpha=SHADOW.a;g.drawImage(m.shadow,0,0)});
    B.ms+=performance.now()-t0;cv._labr=r;return cv._lab=f},budget:{tick:-1,ms:0},
  // (a picture cv at (x, y), its corner, at its own size in game px: its shadow once it stands whole, then it, h of its height risen
  // from its foot (a tent's cloth hauled up));
  //  standing whole, it stands in front of those behind it as a building does (depth.js depthPic: they fade, yours show through)
  put(cv,x,y,h=cv.height){const f=CampArt.fine(cv),W=cv.width,H=cv.height;
    if(h>=H&&f.sh){ctx.globalAlpha=SHADOW.a;ctx.drawImage(f.sh,x,y,W,H);ctx.globalAlpha=1}if(h>=H&&typeof depthPic==='function')depthPic(cv,x,y,cv.foot??H-1);
    ctx.drawImage(f,0,0,f.width,f.height,x,y+H-h,W,Math.max(1,h))},
  /* (a fire pit by its seed, in fine px (2 a game px), ax, ay: its middle, where the flame stands: a ring of stones round its ash and
     two charred logs crossed; look 1 a spit on forked sticks over it, 2 a roast on the spit, 3 no stones, the logs in the ash) */
  pit(seed){const v=(seed|0)%4,k='cpit'+v;if(spr[k])return spr[k];const A=CAMP_ART.pit,W=22,H=v===1||v===2?22:12,cy=H-6,
      px=(g,c,x,y,w=1,h=1)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
    const cv=mkc(W,H,g=>{
      // (the ash, darkest in the middle, a few embers in it)
      for(let y=-3;y<=3;y++)for(let x=-8;x<=8;x++){const e=(x/8)**2+(y/3.2)**2;if(e<=1)px(g,A.ash[e<.35?2:e<.7?1:0],11+x,cy+y)}
      for(const [x,y,c] of [[9,cy,0],[13,cy+1,1],[11,cy-1,2],[7,cy+1,2]])px(g,A.ember[c],x,y);
      // (two logs crossed in it, lit along their tops, charred where they meet)
      for(const [x0,y0,x1,y1] of [[4,cy+2,17,cy-2],[5,cy-2,18,cy+2]])for(let i=0;i<=13;i++){const x=Math.round(x0+(x1-x0)*i/13),y=Math.round(y0+(y1-y0)*i/13),c=Math.abs(i-6.5)<2.5?2:0;px(g,A.log[c],x,y);px(g,A.log[c?2:1],x,y+1)}
      // (the ring of stones, each lit top left and shaded bottom right; the near ones larger)
      if(v!==3)for(let i=0;i<11;i++){const a=i/11*Math.PI*2+.3,x=Math.round(11+Math.cos(a)*9.5),y=Math.round(cy+Math.sin(a)*4.2),w=Math.sin(a)>.3?3:2;
        px(g,A.stone[1],x-1,y-1,w,2);px(g,A.stone[0],x-1,y-1);px(g,A.stone[2],x+w-2,y);px(g,A.stone[3],x-1,y+1,w,1)}
      // (a spit on two forked sticks over it, a roast on it)
      if(v===1||v===2){for(const x of [1,19]){px(g,A.spit[0],x,cy-14,1,15);px(g,A.spit[1],x+1,cy-13,1,14);px(g,A.spit[0],x-1,cy-16,1,2);px(g,A.spit[0],x+2,cy-16,1,2)}
        px(g,A.spit[0],0,cy-15,W,1);if(v===2){px(g,A.meat[0],8,cy-16,6,3);px(g,A.meat[1],8,cy-14,6,1);px(g,A.meat[1],13,cy-15,1,2)}}});
    cv.ax=11;cv.ay=cy;return spr[k]=cv},
  // (a bedroll in col, its pillow to the left (dir < 0) or right, in fine px, ax, ay its middle: rolled cloth, lit along its top,
  // a strap round it)
  roll(col,dir){const k='croll'+col+(dir<0?'l':'r');if(spr[k])return spr[k];const A=CAMP_ART.roll,R=[PX.shade(col,1.18),col,PX.shade(col,.72)];
    const cv=mkc(11,5,g=>{const px=(c,x,y,w=1,h=1)=>{g.fillStyle=c;g.fillRect(dir<0?11-x-w:x,y,w,h)};
      px(R[1],0,1,11,3);px(R[0],1,0,9,1);px(R[2],1,4,9,1);px(R[2],0,3,1,1);px(A.strap,6,0,1,5);px(A.pillow[0],8,1,3,2);px(A.pillow[1],8,3,3,1)});
    cv.ax=5;cv.ay=2;return spr[k]=cv},
  // (a fine picture made by hand (a pit, a roll) at (x, y), its point, in game px: each of its px a fine px)
  hand(cv,x,y){const r=WORLD_VIEW.fine;ctx.drawImage(cv,x-cv.ax/r,y-cv.ay/r,cv.width/r,cv.height/r)}
};
const CAMP_TENTS=Object.fromEntries(['ridge','bell','tepee','yurt','pavilion','leanto','pup','marquee','porch','hut'].map(k=>[k,'camp_'+k]));
