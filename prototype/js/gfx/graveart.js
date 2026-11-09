'use strict';
/* ---------- a grave's place on the map (the owner, 2026-11-09: "Can the grave be a special area? And more detail"; world/death.js
   Grave): a ground of its own and what stands on it, made once into a picture (sprite, kept by kind and seed), and what moves on
   it each frame (live: the light, the candles, the cloth, the banner, fireflies by night).
   - a cairn (no heir, where you fell): trodden earth, wildflowers, a ring of standing stones; the cairn of stacked stones, moss on
     them, your weapon planted in its top, a cloth of your banner's colour tied to its hilt;
   - a grave (at your heir's holding): a fenced plot with its gate to the front, a path of stones to it; a carved headstone on its
     slab, the earth mound before it in flowers, two candles at its foot, your heir's banner on a pole beside it.
   Its numbers and colours: data/death.js DEATH.grave.art ---------- */
const GraveArt={
  cache:new Map(),
  // (the pictures, w × h px, their foot at (ax, ay): its ground, drawn under everything, and what stands on it, among the figures)
  sprite(kind,seed){const key=kind+':'+seed;let s=this.cache.get(key);if(s)return s;
    const A=DEATH.grave.art,C=DEATH.grave.col,w=A.w,h=A.h,mk=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c},gcv=mk(),cv=mk(),ax=w>>1,ay=h-A.foot;
    let g=gcv.getContext('2d');const px=(x,y,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),1,1)},rect=(x,y,ww,hh,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),ww,hh)},hash=(x,y,k)=>PX.hash(x,y,seed*17+k);
    // (the ground: trodden earth in an oval, its edge broken, grass tufts, flowers)
    const rx=A.ground[0],ry=A.ground[1];
    for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const d=(x*x)/(rx*rx)+(y*y)/(ry*ry);if(d>1||d>.75&&hash(x,y,1)<.5)continue;px(ax+x,ay+y,hash(x,y,2)<.3?C.earth2:C.earth)}
    for(let i=0;i<A.tufts;i++){const a=hash(i,0,3)*6.283,r=.7+hash(i,0,4)*.35,x=ax+Math.cos(a)*rx*r,y=ay+Math.sin(a)*ry*r;px(x,y,C.grass);px(x+1,y-1,C.grass2)}
    for(let i=0;i<A.flowers;i++){const a=hash(i,1,5)*6.283,r=.3+hash(i,1,6)*.6,x=ax+Math.cos(a)*rx*r,y=ay+Math.sin(a)*ry*r;px(x,y,C.flowers[Math.floor(hash(i,1,7)*C.flowers.length)])}
    // (a grave's path of stones from its gate toward you)
    if(kind==='grave'){const F=A.fence;for(let i=0;i<4;i++)rect(ax-1+((i&1)?1:-1),ay+F.h/2+1+i*2,2,1,C.light)}
    g=cv.getContext('2d');if(kind==='cairn')this.cairn(ax,ay,px,rect,hash);else this.grave(ax,ay,px,rect,hash);
    s={ground:gcv,cv,ax,ay};this.cache.set(key,s);return s},
  cairn(ax,ay,px,rect,hash){const C=DEATH.grave.col,A=DEATH.grave.art,R=A.ring;
    // (the ring of standing stones round it, the back ones first)
    const ring=[];for(let i=0;i<R.n;i++){const a=i/R.n*6.283+.3;ring.push([ax+Math.cos(a)*R.rx,ay+Math.sin(a)*R.ry])}ring.sort((a,b)=>a[1]-b[1]);
    const stone=(x,y,hh)=>{rect(x-1,y-hh,3,hh,C.stone);rect(x+1,y-hh,1,hh,C.shade);px(x-1,y-hh,C.light);rect(x-1,y,3,1,C.dark)};
    for(const [x,y] of ring.filter(p=>p[1]<ay))stone(x,y,3+Math.round(hash(x,y,8)*2));
    // (the cairn: rows of stones, wide at its foot, moss on some)
    let y=ay;for(const wd of A.rows){const x0=ax-(wd>>1)+Math.round((hash(wd,y,15)-.5)*2);for(let x=x0;x<x0+wd;){const sw=2+Math.round(hash(x,y,9)),col=[C.stone,C.stone2,C.light][Math.floor(hash(x,y,10)*3)];
        rect(x,y-2,sw,2,col);rect(x,y,sw,1,C.dark);if(hash(x,y,11)<.2)px(x,y-2,C.moss);x+=sw+(hash(x,y,12)<.15?1:0)}y-=2}
    // (your weapon planted in its top: the blade, the guard, the grip, the pommel)
    const top=y,sx=ax;rect(sx,top-A.blade,1,A.blade,C.blade);px(sx,top-A.blade,C.light);rect(sx-2,top-A.blade-1,5,1,C.guard);rect(sx,top-A.blade-4,1,3,C.grip);px(sx,top-A.blade-5,C.guard);
    for(const [x,y2] of ring.filter(p=>p[1]>=ay))stone(x,y2,3+Math.round(hash(x,y2,8)*2))},
  grave(ax,ay,px,rect,hash){const C=DEATH.grave.col,F=DEATH.grave.art.fence;
    // (the back of the fence, its sides)
    const x0=ax-F.w/2,y0=ay-F.h/2,x1=ax+F.w/2,y1=ay+F.h/2,post=(x,y)=>{rect(x,y-4,1,4,C.wood);px(x,y-4,C.wood2)};
    rect(x0,y0-2,F.w,1,C.wood2);rect(x0,y0-3,F.w,1,C.wood);for(let x=x0;x<=x1;x+=F.gap)post(x,y0);
    for(let y=y0;y<=y1;y+=3){post(x0,y);post(x1,y)}rect(x0,y0,1,F.h,C.wood2);rect(x1,y0,1,F.h,C.wood2);
    // (the headstone on its slab, carved; the mound in flowers before it)
    const sx=ax,sy=ay-2;rect(sx-6,sy,13,2,C.shade);rect(sx-4,sy-11,9,11,C.stone);rect(sx-3,sy-12,7,1,C.stone);rect(sx-2,sy-13,5,1,C.stone);rect(sx+3,sy-11,2,11,C.shade);px(sx-4,sy-11,C.light);px(sx-3,sy-12,C.light);
    rect(sx,sy-10,1,6,C.carve);rect(sx-2,sy-8,5,1,C.carve);rect(sx-2,sy-3,5,1,C.carve);
    rect(sx-5,sy+2,11,4,C.mound);rect(sx-4,sy+2,9,1,C.earth2);for(let i=0;i<6;i++)px(sx-4+Math.round(hash(i,2,13)*8),sy+3+Math.round(hash(i,2,14)*2),C.flowers[i%C.flowers.length]);
    // (the front of the fence, its gate open in the middle)
    for(const [a,b] of [[x0,ax-3],[ax+3,x1]]){rect(a,y1-2,b-a+1,1,C.wood2);rect(a,y1-3,b-a+1,1,C.wood)}for(let x=x0;x<=x1;x+=F.gap)if(Math.abs(x-ax)>2)post(x,y1)},
  // what moves on it this frame (o: the grave; x, y: its foot on the screen; t: seconds; night)
  live(o,x,y,t,night){const C=DEATH.grave.col,A=DEATH.grave.art;
    if(o.kind==='cairn'){const top=y-A.rows.length*2-A.blade-3,c=o.cloth||C.cloth;for(let i=0;i<4;i++){const f=Math.sin(t*5+i*.9)*(i*.5);ctx.fillStyle=c;ctx.fillRect(Math.round(x+1+i),Math.round(top+f),1,2)}}
    else{const F=A.fence,sy=y-2;
      // (two candles, their flames flickering, a little light round each)
      for(const dx of [-5,5]){const fl=Math.sin(t*9+dx)*.5+Math.sin(t*13.7+dx*2)*.5;ctx.fillStyle=C.wax;ctx.fillRect(x+dx,sy,1,2);ctx.globalAlpha=.25+.1*fl;ctx.fillStyle=C.glow;ctx.beginPath();ctx.arc(x+dx+.5,sy-1,2.5,0,6.283);ctx.fill();
        ctx.globalAlpha=1;ctx.fillStyle=fl>.3?C.flame2:C.flame;ctx.fillRect(x+dx,sy-1-(fl>.6?1:0),1,1)}
      // (the heir's banner on its pole, waving)
      const bx=x+F.w/2-4,by=y-F.h/2-14;ctx.fillStyle=C.wood;ctx.fillRect(bx,by,1,14);const col=o.fac&&FACS[o.fac]?FACS[o.fac].col:C.cloth;
      for(let i=0;i<5;i++){const f=Math.round(Math.sin(t*4-i*.8)*(i*.3));ctx.fillStyle=col;ctx.fillRect(bx+1+i,by+1+f,1,4)}}
    // (fireflies by night, round its ground)
    if(night)for(let i=0;i<A.flies;i++){const a=t*.4+i*2.4,fx=x+Math.cos(a*1.3+i)*A.ground[0]*.9,fy=y-3+Math.sin(a+i*1.7)*A.ground[1]*.9-Math.abs(Math.sin(a*2))*3,on=.5+.5*Math.sin(t*3+i*1.9);
      ctx.globalAlpha=.25*on;ctx.fillStyle=C.fly;ctx.beginPath();ctx.arc(fx,fy,1.6,0,6.283);ctx.fill();ctx.globalAlpha=on;ctx.fillRect(Math.round(fx),Math.round(fy),1,1)}
    ctx.globalAlpha=1}
};
