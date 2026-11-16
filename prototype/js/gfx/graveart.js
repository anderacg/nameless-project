'use strict';
/* ---------- a grave's place on the map (the owner, 2026-11-09: "Can the grave be a special area? And more detail"; world/death.js
   Grave): a ground of its own and what stands on it, made once into a picture (sprite, kept by kind and seed), and what moves on
   it each frame (live: the light, the candles, the cloth, the banner, fireflies by night).
   - a cairn (no heir, where you fell): trodden earth, wildflowers, a ring of standing stones; the cairn of stacked stones, moss on
     them, your weapon planted in its top, a cloth of your banner's colour tied to its hilt;
   - a grave (at your heir's holding): a fenced plot with its gate to the front, a path of stones to it; a carved headstone on its
     slab, the earth mound before it in flowers, two candles at its foot, your heir's banner on a pole beside it.
   At the lab's scale: each picture s px a game px (1/WORLD_VIEW.build), its stones lit from the top left in ramps of a colour
   (ramp), drawn back at WORLD_VIEW.build (put); what moves on it in fine px too (q). Its numbers (game px) and colours: data/death.js
   DEATH.grave.art ---------- */
const GraveArt={
  cache:new Map(),
  // (px of its pictures a game px)
  get s(){return Math.round(1/WORLD_VIEW.build)},
  // (a colour's ramp: lit, itself, shaded, dark)
  ramp(c){return [PX.shade(c,1.18),c,PX.shade(c,.8),PX.shade(c,.62)]},
  // (the pictures, w × h px, their foot at (ax, ay): its ground, drawn under everything, and what stands on it, among the figures; k:
  // drawn at k of their size)
  sprite(kind,seed){const key=kind+':'+seed;let S=this.cache.get(key);if(S)return S;
    const A=DEATH.grave.art,C=DEATH.grave.col,s=this.s,w=A.w*s,h=A.h*s,mk=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c},gcv=mk(),cv=mk(),ax=w>>1,ay=h-A.foot*s;
    let g=gcv.getContext('2d');const px=(x,y,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),1,1)},rect=(x,y,ww,hh,c)=>{if(ww<=0||hh<=0)return;g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(ww),Math.round(hh))},hash=(x,y,k)=>PX.hash(x,y,seed*17+k),ramp=c=>this.ramp(c);
    // (a block of stone, w × h: its face flecked, its top and left edge lit, its right in shade, its foot dark; round: its top corners off)
    const block=(x,y,ww,hh,c,round)=>{const R=ramp(c);x=Math.round(x);y=Math.round(y);rect(x,y,ww,hh,R[1]);
      for(let j=1;j<hh-1;j++)for(let i=1;i<ww-1;i++){const v=hash(x+i,y+j,20);if(v<.1)px(x+i,y+j,R[2]);else if(v>.94)px(x+i,y+j,R[0])}
      rect(x,y,ww,1,R[0]);rect(x,y,1,hh-1,R[0]);rect(x+ww-1,y+1,1,hh-1,R[2]);rect(x+1,y+hh-1,ww-1,1,R[3]);if(round){g.clearRect(x,y,1,1);g.clearRect(x+ww-1,y,1,1)}};
    // (a heap of earth, an oval rx × ry about (cx, cy): lit to the top left, shaded to the bottom right, clods on it)
    const mound=(cx,cy,rx,ry,c)=>{const R=ramp(c);for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x*x)/(rx*rx)+(y*y)/(ry*ry);if(d>1)continue;
      const v=x/rx*.45+y/ry*.7+(hash(x,y,21)-.5)*.5;px(cx+x,cy+y,v<-.45?R[0]:v<.35?R[1]:v<.8?R[2]:R[3])}};
    // (a flower: its bloom, a petal lit, its leaf under it)
    const flower=(x,y,i)=>{const n=C.flowers.length,c=C.flowers[(i%n+n)%n];px(x,y+1,C.grass);px(x,y,c);if(hash(x,y,22)<.5)px(x+1,y,PX.shade(c,1.15));else px(x-1,y+1,C.grass2)};
    const D={block,mound,flower,ramp,s};
    // (the ground: trodden earth in an oval, its edge broken, flecked, lit to the top left; pebbles, grass tufts, flowers)
    const [gw,gh]=A.groundOf[kind]||A.ground,rx=gw*s,ry=gh*s,E=ramp(C.earth);
    for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x*x)/(rx*rx)+(y*y)/(ry*ry);if(d>1||d>.7&&hash(x>>1,y>>1,1)<(d-.7)/.3+.15)continue;
      const v=hash(x,y,2)-(x/rx+y/ry)*.12;px(ax+x,ay+y,v<.16?E[2]:v>.88?E[0]:hash(x>>1,y>>1,3)<.3?C.earth2:E[1])}
    for(let i=0;i<(kind==='remains'?3:6);i++){const a=hash(i,2,4)*6.283,r=hash(i,2,5)*.75,x=ax+Math.cos(a)*rx*r,y=ay+Math.sin(a)*ry*r;px(x,y,C.stone);px(x,y+1,C.shade);if(hash(i,2,6)<.5)px(x+1,y,C.light)}
    for(let i=0;i<(A.groundOf[kind]?A.tufts>>1:A.tufts);i++){const a=hash(i,0,3)*6.283,r=.75+hash(i,0,4)*.3,x=Math.round(ax+Math.cos(a)*rx*r),y=Math.round(ay+Math.sin(a)*ry*r);
      px(x-1,y,C.grass);px(x,y,C.grass);px(x,y-1,C.grass2);px(x+1,y,C.grass);if(hash(i,0,5)<.6)px(x+1,y-2,C.grass2);if(hash(i,0,6)<.4)px(x-1,y-1,C.grass2)}
    for(let i=0;i<(kind==='remains'?0:kind==='small'?3:A.flowers);i++){const a=hash(i,1,5)*6.283,r=.3+hash(i,1,6)*.6;flower(Math.round(ax+Math.cos(a)*rx*r),Math.round(ay+Math.sin(a)*ry*r),Math.floor(hash(i,1,7)*C.flowers.length))}
    // (a grave's path of stones from its gate toward you)
    if(kind==='grave'){const F=A.fence;for(let i=0;i<4;i++)block(ax-2+((i&1)?2:-2),ay+F.h*s/2+2+i*4,4,2,C.light)}
    g=cv.getContext('2d');this[kind](ax,ay,px,rect,hash,D);
    S={ground:gcv,cv,ax,ay,k:1/s};this.cache.set(key,S);return S},
  // (one of its pictures, c (S.ground or S.cv), with its foot at screen (x, y): at the lab's scale)
  put(S,c,x,y){const k=S.k;ctx.drawImage(c,x-S.ax*k,y-S.ay*k,c.width*k,c.height*k)},
  // (a picture of it at the map's own px, for what lays pictures 1 px a game px (a page's banner: ui/window.js pageBanner))
  half(c){if(c._half)return c._half;const k=WORLD_VIEW.build;return c._half=mkc(Math.round(c.width*k),Math.round(c.height*k),g=>{g.imageSmoothingQuality='high';g.drawImage(c,0,0,c.width*k,c.height*k)})},
  // (remains no one buried: bones in the grass, a skull, ribs, a torn cloak, the sword fallen by them)
  remains(ax,ay,px,rect,hash,D){const C=DEATH.grave.col,cl=D.ramp(C.cloak),B=D.ramp(C.bone),bl=D.ramp(C.blade),gd=D.ramp(C.guard);
    rect(ax-12,ay-2,18,4,cl[1]);rect(ax-10,ay-4,10,2,cl[1]);rect(ax-10,ay-4,10,1,cl[0]);rect(ax-12,ay-2,2,1,cl[0]);rect(ax-12,ay+1,18,1,cl[2]);
    for(const x of [-8,-3,2])rect(ax+x,ay-3,1,3,cl[2]);for(let i=0;i<6;i++)if(hash(i,0,30)<.5)px(ax-12+i*3,ay+2,cl[2]);px(ax+4,ay-3,cl[1]);// (its folds, its torn hem)
    rect(ax-10,ay-1,14,1,B[2]);for(let i=0;i<5;i++){const x=ax-9+i*3;rect(x,ay-5,1,4,B[1]);px(x,ay-5,B[0]);px(x,ay-2,B[2])}
    rect(ax-1,ay+3,7,1,B[1]);px(ax-1,ay+2,B[0]);px(ax+5,ay+2,B[1]);rect(ax-15,ay+1,7,1,B[1]);px(ax-15,ay,B[0]);px(ax-9,ay+2,B[2]);
    const sx=ax+6,sy=ay-6;rect(sx,sy,6,5,B[1]);rect(sx+1,sy-1,4,1,B[0]);rect(sx,sy,1,3,B[0]);rect(sx+5,sy+1,1,3,B[2]);px(sx+2,sy+1,C.dark);px(sx+3,sy+1,C.dark);px(sx+4,sy+2,C.dark);rect(sx+1,sy+4,4,1,B[2]);px(sx+2,sy+3,B[0]);px(sx+4,sy+3,B[0]);
    rect(ax-16,ay+5,18,1,bl[0]);rect(ax-16,ay+6,18,1,bl[2]);px(ax-17,ay+6,bl[1]);rect(ax+2,ay+3,2,6,gd[1]);px(ax+2,ay+3,gd[0]);px(ax+3,ay+8,gd[2]);
    rect(ax+4,ay+5,4,2,C.grip);px(ax+5,ay+5,PX.shade(C.grip,1.4));px(ax+7,ay+5,PX.shade(C.grip,1.4));rect(ax+8,ay+5,2,2,gd[1]);px(ax+8,ay+5,gd[0])},
  // (a small grave: an earth mound, a cross of two sticks bound with cord, a few stones round it)
  small(ax,ay,px,rect,hash,D){const C=DEATH.grave.col,W=D.ramp(C.wood),st=[];
    for(let i=0;i<6;i++){const a=i/6*6.283+.5;st.push([ax+Math.round(Math.cos(a)*12),ay+Math.round(Math.sin(a)*6),i])}st.sort((a,b)=>a[1]-b[1]);
    const stone=([x,y,i])=>D.block(x-2,y-2,4+(i&1),3,i%2?C.stone:C.stone2,true);
    for(const p of st)if(p[1]<ay)stone(p);D.mound(ax,ay+1,10,4,C.mound);
    rect(ax,ay-19,2,18,W[1]);rect(ax,ay-19,1,18,W[0]);px(ax+1,ay-12,W[2]);px(ax,ay-6,W[2]);px(ax,ay-19,W[1]);
    rect(ax-4,ay-15,10,2,W[1]);rect(ax-4,ay-15,10,1,W[0]);px(ax+5,ay-14,W[2]);px(ax-4,ay-14,W[2]);
    for(const [x,y] of [[-1,-16],[0,-15],[1,-14],[2,-13],[2,-16],[-1,-13]])px(ax+x,ay+y,C.grip);
    for(const p of st)if(p[1]>=ay)stone(p)},
  // (a lord's crypt: a house of stone in courses on its steps, its pediment and cornice, two columns, the door dark under its arch,
  // a band cut with names, its side in shade)
  crypt(ax,ay,px,rect,hash,D){const C=DEATH.grave.col,St=D.ramp(C.stone),sy=ay;
    D.block(ax-24,sy,50,4,C.stone2);D.block(ax-22,sy-4,46,4,C.stone2);D.block(ax-18,sy-28,36,24,C.stone);rect(ax+18,sy-28,4,24,C.shade);rect(ax+18,sy-28,1,24,St[3]);
    for(let r=0;r<6;r++){const y=sy-25+r*4,o=r%2?4:0;rect(ax-17,y,34,1,St[2]);for(let x=ax-17+o;x<ax+17;x+=8)px(x,y-1,St[2]),px(x,y-2,St[2]),px(x+1,y-2,St[0])}
    for(const cx of [ax-16,ax+11]){rect(cx,sy-26,5,22,St[0]);rect(cx+1,sy-26,3,22,C.light);rect(cx+4,sy-26,1,22,St[1]);rect(cx-1,sy-27,7,2,C.light);rect(cx-1,sy-6,7,2,St[1]);rect(cx-1,sy-5,7,1,St[2])}
    for(let i=0;i<12;i++){const ww=Math.round(44-i*3.6),x=ax-(ww>>1);rect(x,sy-30-i,ww,1,i?St[1]:St[2]);px(x,sy-30-i,St[0]);px(x+1,sy-30-i,St[0]);px(x+ww-1,sy-30-i,St[2])}
    rect(ax-22,sy-29,46,1,C.light);rect(ax-21,sy-28,44,1,St[2]);
    rect(ax-12,sy-26,26,2,C.carve);for(let x=ax-11;x<ax+13;x+=2+(hash(x,0,31)<.3?1:0))px(x,sy-25,St[0]);
    rect(ax-4,sy-18,10,14,C.dark);rect(ax-3,sy-20,8,2,C.dark);rect(ax-2,sy-21,6,1,C.dark);rect(ax+1,sy-19,1,15,PX.shade(C.dark,.7));px(ax-1,sy-11,St[1]);px(ax+3,sy-11,St[1]);
    rect(ax-5,sy-21,1,17,St[0]);rect(ax+6,sy-21,1,17,St[2]);rect(ax-8,sy+4,18,2,C.light);rect(ax-8,sy+5,18,1,St[1])},
  // (a headstone over a mound in flowers: rounded, carved with a cross or lines of names (by its seed), cracked or mossed on some)
  stone(ax,ay,px,rect,hash,D){const C=DEATH.grave.col,sy=ay-2;
    D.block(ax-9,sy,18,3,C.stone2);this.head(ax,sy,14,17,px,rect,hash,D);
    D.mound(ax,sy+7,11,3,C.mound);for(let i=0;i<5;i++)D.flower(ax-8+Math.round(hash(i,3,13)*16),sy+6+Math.round(hash(i,3,14)*2),i)},
  // (a headstone w wide, h tall on (cx, by): its rounded top, lit left, shaded right, flecked; its carving: a cross, or lines of names;
  // moss at its foot, a crack, by its seed)
  head(cx,by,w,h,px,rect,hash,D){const C=DEATH.grave.col,R=D.ramp(C.stone),x0=cx-(w>>1),ins=[4,2,1,1];
    for(let j=0;j<h;j++){const i=ins[j]||0,x=x0+i,ww=w-2*i,y=by-h+j;rect(x,y,ww,1,R[1]);px(x,y,R[0]);px(x+ww-1,y,R[2]);if(ww>4)px(x+ww-2,y,R[2]);if(j<2)rect(x+1,y,ww-3,1,R[0])}
    for(let j=2;j<h-1;j++)for(let i=2;i<w-3;i++){const v=hash(x0+i,by+j,23);if(v<.08)px(x0+i,by-h+j,R[2]);else if(v>.95)px(x0+i,by-h+j,R[0])}
    rect(x0,by-1,w,1,R[3]);
    if(hash(0,0,40)<.5){rect(cx-1,by-h+4,2,9,C.carve);rect(cx-4,by-h+6,8,2,C.carve);px(cx+1,by-h+4,R[0]);px(cx+4,by-h+6,R[0])}
    else for(let l=0;l<3;l++){const y=by-h+5+l*3,ww=(l===0?8:6)-(hash(l,0,41)<.5?1:0);rect(cx-(ww>>1),y,ww,1,C.carve);rect(cx-(ww>>1),y+1,ww,1,R[0])}
    for(let i=0;i<4;i++)if(hash(i,0,42)<.6)px(x0+1+i,by-2-(i&1),C.moss);
    if(hash(0,0,43)<.35)for(let j=0;j<5;j++)px(cx+3+(j>>1),by-h+3+j,R[3])},
  // (a tomb: a tall stone on its steps, capped, its plaque carved; railed in iron, spear-tipped; flower beds at its foot)
  tomb(ax,ay,px,rect,hash,D){const C=DEATH.grave.col,s=D.s,R=DEATH.grave.art.rail,I=D.ramp(C.iron),St=D.ramp(C.stone),x0=ax-R.w*s/2,y0=ay-R.h*s/2,x1=ax+R.w*s/2,y1=ay+R.h*s/2,gap=R.gap*s,
      rail=(x,y)=>{rect(x,y-10,1,10,I[1]);px(x,y-11,C.light);px(x-1,y-10,I[1]);px(x+1,y-10,I[2]);px(x,y-12,C.light)};// (an iron bar, its spear tip)
    rect(x0,y0-7,R.w*s,1,I[1]);rect(x0,y0-2,R.w*s,1,I[2]);for(let x=x0;x<=x1;x+=gap)rail(x,y0);for(let y=y0;y<=y1;y+=6){rail(x0,y);rail(x1,y)}rect(x0,y0,1,R.h*s,I[2]);rect(x1,y0,1,R.h*s,I[2]);
    const sy=ay;for(const dx of [-24,18])D.mound(ax+dx+3,sy+2,5,2,C.earth2);
    D.block(ax-16,sy,34,4,C.stone2);D.block(ax-14,sy-4,30,4,C.stone2);D.block(ax-10,sy-8,22,4,C.stone);
    for(let i=0;i<40;i++){const ww=i<32?10-(i>>4):Math.max(0,10-Math.ceil((i-31)*1.25));if(ww<=0)break;const x=ax+1-(ww>>1),y=sy-9-i;rect(x,y,ww,1,St[1]);px(x,y,St[0]);if(ww>3)px(x+1,y,St[0]);px(x+ww-1,y,St[2]);if(ww>4)px(x+ww-2,y,St[2]);
      if(i>2&&i<30&&hash(x,y,24)<.12)px(x+2+Math.floor(hash(x,y,25)*(ww-4)),y,St[2])}
    rect(ax-4,sy-20,10,6,St[2]);rect(ax-4,sy-20,10,1,St[3]);rect(ax-4,sy-14,10,1,St[0]);rect(ax+6,sy-20,1,7,St[0]);for(let l=0;l<2;l++)rect(ax-2,sy-18+l*2,6,1,C.carve);
    for(const dx of [-24,18])for(let i=0;i<6;i++)D.flower(ax+dx+i,sy+1+(i&1),i+dx);
    for(const [a,b] of [[x0,ax-6],[ax+6,x1]]){rect(a,y1-7,b-a+1,1,I[1]);rect(a,y1-2,b-a+1,1,I[2])}for(let x=x0;x<=x1;x+=gap)if(Math.abs(x-ax)>4)rail(x,y1)},
  cairn(ax,ay,px,rect,hash,D){const C=DEATH.grave.col,A=DEATH.grave.art,R=A.ring,s=D.s,St=D.ramp(C.stone),bl=D.ramp(C.blade),gd=D.ramp(C.guard);
    // (the ring of standing stones round it, the back ones first: each lit to the left, moss on some tops, a dark foot)
    const ring=[];for(let i=0;i<R.n;i++){const a=i/R.n*6.283+.3;ring.push([Math.round(ax+Math.cos(a)*R.rx*s),Math.round(ay+Math.sin(a)*R.ry*s)])}ring.sort((a,b)=>a[1]-b[1]);
    const stone=(x,y,hh)=>{D.block(x-3,y-hh,6,hh,hash(x,y,16)<.5?C.stone:C.stone2,true);if(hash(x,y,17)<.5){px(x-2,y-hh,C.moss);px(x-1,y-hh,C.moss);px(x-2,y-hh+1,C.moss)}rect(x-3,y,6,1,C.dark)};
    for(const [x,y] of ring.filter(p=>p[1]<ay))stone(x,y,6+Math.round(hash(x,y,8)*4));
    // (the cairn: rows of stones, wide at its foot, each rounded and lit, moss on some)
    let y=ay;for(const wd of A.rows){const W=wd*s,x0=ax-(W>>1)+Math.round((hash(wd,y,15)-.5)*4);for(let x=x0;x<x0+W;){const sw=4+Math.round(hash(x,y,9)*2),col=[C.stone,C.stone2,C.light][Math.floor(hash(x,y,10)*3)];
        D.block(x,y-4,sw,4,col,true);rect(x,y,sw,1,C.dark);if(hash(x,y,11)<.25){px(x+1,y-4,C.moss);px(x+2,y-4,C.moss)}x+=sw+(hash(x,y,12)<.15?1:0)}y-=4}
    // (your weapon planted in its top: the blade lit down its left, the guard, the grip bound, the pommel)
    const top=y,b=A.blade*s;rect(ax,top-b,2,b,bl[1]);rect(ax,top-b,1,b,bl[0]);px(ax+1,top-b,bl[0]);rect(ax+1,top-4,1,4,bl[2]);
    rect(ax-4,top-b-2,10,2,gd[1]);rect(ax-4,top-b-2,10,1,gd[0]);px(ax+5,top-b-1,gd[2]);rect(ax,top-b-8,2,6,C.grip);for(let i=0;i<6;i+=2)px(ax,top-b-8+i,PX.shade(C.grip,1.4));
    rect(ax-1,top-b-10,4,2,gd[1]);px(ax-1,top-b-10,gd[0]);
    for(const [x,y2] of ring.filter(p=>p[1]>=ay))stone(x,y2,6+Math.round(hash(x,y2,8)*4))},
  grave(ax,ay,px,rect,hash,D){const C=DEATH.grave.col,s=D.s,F=DEATH.grave.art.fence,W=D.ramp(C.wood);
    // (the back of the fence, its sides: posts pointed and lit to the left, two rails)
    const x0=ax-F.w*s/2,y0=ay-F.h*s/2,x1=ax+F.w*s/2,y1=ay+F.h*s/2,gap=F.gap*s,post=(x,y)=>{rect(x,y-8,2,8,W[1]);rect(x,y-8,1,8,W[0]);px(x+1,y-9,W[1]);px(x,y-1,W[3])},
      rails=(a,b,y)=>{rect(a,y-6,b-a+1,1,W[0]);rect(a,y-5,b-a+1,1,W[1]);rect(a,y-3,b-a+1,1,W[1]);rect(a,y-2,b-a+1,1,W[2])};
    rails(x0,x1+1,y0);for(let x=x0;x<=x1;x+=gap)post(x,y0);
    for(let y=y0;y<=y1;y+=6){post(x0,y);post(x1,y)}rect(x0,y0-5,1,F.h*s,W[1]);rect(x0+1,y0-5,1,F.h*s,W[2]);rect(x1,y0-5,1,F.h*s,W[1]);rect(x1+1,y0-5,1,F.h*s,W[2]);
    // (the headstone on its slab, carved; the mound in flowers before it)
    const sy=ay-4;D.block(ax-12,sy,26,4,C.stone2);this.head(ax+1,sy,18,22,px,rect,hash,D);
    D.mound(ax+1,sy+9,11,4,C.mound);for(let i=0;i<6;i++)D.flower(ax-7+Math.round(hash(i,2,13)*16),sy+7+Math.round(hash(i,2,14)*4),i);
    // (the front of the fence, its gate open in the middle between taller posts, capped)
    for(const [a,b] of [[x0,ax-6],[ax+6,x1+1]])rails(a,b,y1);for(let x=x0;x<=x1;x+=gap)if(Math.abs(x-ax)>6)post(x,y1);
    for(const x of [ax-7,ax+6]){rect(x,y1-11,2,11,W[1]);rect(x,y1-11,1,11,W[0]);rect(x-1,y1-12,4,1,W[2])}rect(ax-5,y1-8,1,7,W[2]);rect(ax-4,y1-9,1,7,W[1])},
  // (what moves on it: drawn on the screen in game px, each a fine px (q: WORLD_VIEW.build) of the lab's scale)
  // (a candle, its wax lit to the left, its flame flickering in two tones, a little light round it)
  candle(x,y,t){const C=DEATH.grave.col,q=WORLD_VIEW.build,fl=Math.sin(t*9+x)*.5+Math.sin(t*13.7+x*2)*.5,f=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a*q,y+b*q,w*q,h*q)};
    f(0,0,2,4,C.wax);f(0,0,1,4,PX.shade(C.wax,1.05));f(1,1,1,3,PX.shade(C.wax,.85));ctx.globalAlpha=.25+.1*fl;ctx.fillStyle=C.glow;ctx.beginPath();ctx.arc(x+.5,y-1,2.5,0,6.283);ctx.fill();
    ctx.globalAlpha=1;const up=fl>.6?1:0,sd=fl<-.5?1:0;f(sd,-2-up,1,2,C.flame);f(sd,-2-up,1,1,fl>.3?C.flame2:C.flame);f(1-sd,-1,1,1,C.flame)},
  // (your family's plot: a low wall of stones round its graves, each lit on top and dark at its foot, its gate to the front under a
  // wooden arch, a board on it; drawn on the ground)
  plot(ents,cam,V,fp,graves){if(!graves.length||!graves.some(g=>g.inView(V)))return;const C=DEATH.grave.col,M=DEATH.grave.plot.wall,q=WORLD_VIEW.build,St=this.ramp(C.stone),St2=this.ramp(C.stone2),W=this.ramp(C.wood),
      f=(x,y,a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a*q,y+b*q,w*q,h*q)};
    const x0=Math.min(...graves.map(g=>g.x))-M,x1=Math.max(...graves.map(g=>g.x))+M,y0=Math.min(...graves.map(g=>g.y))-M,y1=Math.max(...graves.map(g=>g.y))+M*.7,gx=Math.round((x0+x1)/2);
    const wall=(ax,ay,bx,by)=>{const n=Math.max(1,Math.round(Math.hypot(bx-ax,by-ay)/3));for(let i=0;i<=n;i++){const x=Math.round(ax+(bx-ax)*i/n-cam.x),y=Math.round(ay+(by-ay)*i/n-cam.y),R=i%2?St:St2,w=5+(PX.hash(i,Math.round(ax+ay),7)<.5?1:0);
      f(x,y,-2,-4,w,4,R[1]);f(x,y,-2,-4,w,1,R[0]);f(x,y,-2,-3,1,2,R[0]);f(x,y,w-3,-3,1,3,R[2]);f(x,y,-2,0,w,2,C.dark);if(PX.hash(i,Math.round(bx+by),8)<.2)f(x,y,-1,-4,2,1,C.moss)}};
    ents.push({x:gx,ly:y1,y:y0-1e5+1,f:()=>{ctx.save();wall(x0,y0,x1,y0);wall(x0,y0,x0,y1);wall(x1,y0,x1,y1);wall(x0,y1,gx-5,y1);wall(gx+5,y1,x1,y1);ctx.restore()}});
    ents.push({x:gx,y:y1,f:()=>{const x=Math.round(gx-cam.x),y=Math.round(y1-cam.y);ctx.save();for(const a of [-10,8]){f(x,y,a,-18,2,18,W[1]);f(x,y,a,-18,1,18,W[0]);f(x,y,a,-1,2,1,W[3])}
      f(x,y,-11,-20,22,2,W[1]);f(x,y,-11,-20,22,1,W[0]);f(x,y,-6,-26,14,6,C.wood2);f(x,y,-6,-26,14,1,W[1]);f(x,y,-4,-24,10,1,C.carve);f(x,y,-4,-22,7,1,C.carve);f(x,y,-6,-20,1,2,W[3]);f(x,y,7,-20,1,2,W[3]);ctx.restore()}})},
  // what moves on it this frame (o: the grave; x, y: its foot on the screen; t: seconds; night)
  live(o,x,y,t,night,banner){const C=DEATH.grave.col,A=DEATH.grave.art,q=WORLD_VIEW.build,f=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a*q,y+b*q,w*q,h*q)},sh=(c,k)=>/^#[0-9a-f]{6}$/i.test(c)?PX.shade(c,k):c;
    // (a cloth of col waving from (a, b) fine px, n wide, h tall: its folds shaded, its top lit)
    const cloth=(a,b,n,h,col,amp,sp)=>{const lo=sh(col,.78),hi=sh(col,1.15);for(let i=0;i<n;i++){const d=Math.round(Math.sin(t*sp-i*.8)*(i*amp)),dk=Math.sin(t*sp-i*.8+1)>.4;f(a+i,b+d,1,h,dk?lo:col);f(a+i,b+d,1,1,hi);f(a+i,b+d+h-1,1,1,lo)}};
    if(o.kind==='crypt'){this.candle(x-5,y-2,t);this.candle(x+5,y-2,t);cloth(-4,-26,8,6,banner||C.cloth,.25,3)}
    if(o.kind==='cairn'){const top=-(A.rows.length*4+A.blade*2+6),c=o.cloth||C.cloth;for(let i=0;i<8;i++){const d=Math.round(Math.sin(t*5+i*.45)*(i*.5));f(2+i,top+d,1,4-(i>5?1:0),i%3===2?sh(c,.8):c);f(2+i,top+d,1,1,sh(c,1.15))}}
    else if(o.kind==='grave'){const F=A.fence,sy=y-2;
      // (two candles at its foot)
      for(const dx of [-5,5])this.candle(x+dx,sy,t);
      // (the heir's banner on its pole, waving)
      const bx=(F.w/2-4)*2,by=(-F.h/2-14)*2,W=this.ramp(C.wood);f(bx,by,1,28,W[0]);f(bx+1,by,1,28,W[2]);f(bx,by-1,2,1,C.guard);
      cloth(bx+2,by+2,10,8,o.fac&&FACS[o.fac]?FACS[o.fac].col:C.cloth,.15,4)}
    else if(o.kind==='tomb'){const R=A.rail;for(const [dx,dy] of [[-R.w/2+2,-R.h/2+1],[R.w/2-2,-R.h/2+1],[-R.w/2+2,R.h/2-2],[R.w/2-2,R.h/2-2]])this.candle(x+dx,y+dy,t)}
    // (fireflies by night, round its ground)
    if(night)for(let i=0;i<A.flies;i++){const a=t*.4+i*2.4,fx=x+Math.cos(a*1.3+i)*A.ground[0]*.9,fy=y-3+Math.sin(a+i*1.7)*A.ground[1]*.9-Math.abs(Math.sin(a*2))*3,on=.5+.5*Math.sin(t*3+i*1.9);
      ctx.globalAlpha=.25*on;ctx.fillStyle=C.fly;ctx.beginPath();ctx.arc(fx,fy,1.6,0,6.283);ctx.fill();ctx.globalAlpha=on;ctx.fillRect(Math.round(fx/q)*q,Math.round(fy/q)*q,q,q)}
    ctx.globalAlpha=1}
};
