'use strict';
/* ---------- tracks drawn (world/tracks.js keeps them; data/tracks.js TRACKS; doc/WORLD_DESIGN.md §12.7): each trail's prints every
   step px along its line, turned the way it went, a print each (trackPic: the art's, art/tracks.svg, lit on its up-left edge; or pixel: trackPix): a soldier's
   hobnailed boots, a bandit's boots, bare feet, shod hooves, paws by the beast, a wagon's two ruts, a beast's dragged furrow (its
   look: world/tracks.js Track#art); a band's size class spreads them wider. They lie on the ground, over
   the land and under everything built and everyone (render.js drawWorld), as clear as their ground keeps them and fading with
   their age; only those you see (Tracks.seen: in your sight; others' by your Scouting), at most TRACKS.max a frame ---------- */
// where the prints of a size class lie across the way, in lanes (a wagon and a dragged beast: one, in the middle)
const TRACK_ACROSS=[[-1,1],[-3,-1,1,3],[-5,-3,-1,1,3,5],[-7,-5,-3,-1,1,3,5,7]];
/* the prints' pictures (the owner, 2026-10-29: the art's tracks, art/tracks.svg, for the old pixel ones): each art of data/
   trackart.js (TRACK_ART, its shapes Path2D) drawn smooth at the screen's own pixels (k a game pixel: the map's VS, a battle's
   scale), turned to the way it went (TRACK_TURNS steps of a turn), a left or right step mirrored, its size class's lanes
   (TRACK_ACROSS, TRACKS.lane apart, steps TRACKS.stagger apart along), in its ground's colour (ci: TRACKS.col's), the light on
   its up-left edge (TRACKS.glow), its details (tread, nails, a frog) lighter (TRACKS.detail). Its size: TRACKS.art.px (the
   print's length in game px); a wagon's ruts and a beast's drag, a band along the way (its step's length, art.px across).
   Each made once (TRACK_PICS) and kept: its corner ox, oy and its size w, h in game px */
const TRACK_TURNS=32,TRACK_PICS=new Map(),TRACK_PATHS={};
const trackPath=(id,part)=>TRACK_PATHS[id+part]||(TRACK_PATHS[id+part]=new Path2D(TRACK_ART[id][part]));
const trackLine=id=>id==='ruts'||id==='drag';
function trackPic(id,cls,a,alt,ci,k,len){if(SPRITES.pixel)return trackPix(id,cls,a,alt,ci);
  const q=((Math.round(a/(2*Math.PI)*TRACK_TURNS)%TRACK_TURNS)+TRACK_TURNS)%TRACK_TURNS,kk=Math.max(1,Math.min(TRACKS.art.hd,Math.round(k*2)/2)),line=trackLine(id),
    key=id+'|'+cls+'|'+q+'|'+(alt?1:0)+'|'+ci+'|'+kk+'|'+(line?len:0);let S=TRACK_PICS.get(key);if(S)return S;
  const T=TRACKS,px=T.art.px[id]||6,lanes=line?[0]:TRACK_ACROSS[cls],col=Object.values(T.col)[ci],ang=q/TRACK_TURNS*2*Math.PI+Math.PI/2;
  const places=lanes.map((l,j)=>line?[0,0]:[l*T.lane/2+(alt?1:-1),((j*5+(alt?3:0))%4)*T.stagger]);
  const R=Math.ceil(Math.max(...places.map(([x,y])=>Math.hypot(x,y)))+Math.max(px,line?len:0)*.75+1),n=Math.ceil(2*R*kk);
  S=mkc(n,n,g=>{const all=(fill,detail,dx,dy)=>{for(const [x,y] of places){g.save();g.setTransform(kk,0,0,kk,(R+dx)*kk,(R+dy)*kk);g.rotate(ang);g.translate(x,-y);
      if(line)g.scale(px/100,len*1.15/96);else{g.scale(px/100,px/100);if(alt)g.scale(-1,1)}
      g.fillStyle=fill;g.fill(trackPath(id,'p'));if(detail&&TRACK_ART[id].m){g.fillStyle=detail;g.fill(trackPath(id,'m'))}g.restore()}};
    all(T.glow,null,-T.art.edge,-T.art.edge);all(col,T.detail,0,0)});
  S.ox=-R;S.oy=-R;S.w=S.h=2*R;TRACK_PICS.set(key,S);return S}
/* the same, pixel (the setting Sprites: Pixel): each art pixelated at its size in the game (TRACK_PX: art/tracks.py, its sheet
   art/tracks-px.svg), turned to the nearest of the 4 ways (east, south, west, north: pixel art turned 45° is another shape, so a slant takes the nearest; the owner: "still not the same"), its lanes laid as the art's, whole pixels (halves away from the middle,
   so each way the same turned); no light on it (the owner, 2026-10-29: "make them the same, no light": a light from one side looks
   different on each way), its details lighter (TRACKS.detail). Its corner ox, oy in whole game px, drawn unsmoothed */
const trackRound=v=>Math.sign(v)*Math.round(Math.abs(v));
function trackPix(id,cls,a,alt,ci){
  const way=((Math.round(a/(Math.PI/2))%4)+4)%4,line=trackLine(id),key='px|'+id+'|'+cls+'|'+way+'|'+(alt?1:0)+'|'+ci;let S=TRACK_PICS.get(key);if(S)return S;
  const T=TRACKS,g=TRACK_PX[id][way*2+(alt&&!line?1:0)],lanes=line?[0]:TRACK_ACROSS[cls],c=[0,-1,0,1][way],s=[1,0,-1,0][way],on=new Map();
  lanes.forEach((l,j)=>{const x=line?0:l*T.lane/2+(alt?1:-1),y=line?0:-((j*5+(alt?3:0))%4)*T.stagger,dx=trackRound(x*c-y*s)+g.o[0],dy=trackRound(x*s+y*c)+g.o[1];
    g.r.forEach((r,j2)=>{for(let i=0;i<r.length;i++)if(r[i]!=='.')on.set((dx+i)+','+(dy+j2),r[i])})});
  const px=[...on.keys()].map(k=>k.split(',').map(Number)),ox=Math.min(...px.map(p=>p[0])),oy=Math.min(...px.map(p=>p[1]));
  S=mkc(Math.max(...px.map(p=>p[0]))-ox+1,Math.max(...px.map(p=>p[1]))-oy+1,G=>{G.fillStyle=Object.values(T.col)[ci];for(const [x,y] of px)G.fillRect(x-ox,y-oy,1,1);G.fillStyle=T.detail;for(const [x,y] of px)if(on.get(x+','+y)==='+')G.fillRect(x-ox,y-oy,1,1)});
  S.ox=ox;S.oy=oy;S.w=S.width;S.h=S.height;TRACK_PICS.set(key,S);return S}
// every trail's prints you see in view, onto the scene (ctx: the scene in game pixels, cam its whole pixels); how many it drew.
// Each laid from its stretch's own two points, from the older (its place and heading fixed once both are kept: a turn, or the
// trail growing, never moves one); a trail still being walked shows up to its last point (Tracks.step keeps one every sample px),
// none on to its walker (that stretch's heading would follow the walker and turn the prints as it turns: the owner, 2026-10-23)
// TRACK_BOX: the box they drew in this frame, the scene's game pixels [x0, y0, x1, y1] (render.js puts what stands back over it)
const TRACK_BOX=[0,0,0,0];
function drawTracks(cam){if(!TRACKS.on||!W.tracks||!W.tracks.length)return 0;const TB=TRACK_BOX;TB[0]=TB[1]=Infinity;TB[2]=TB[3]=-Infinity;
  const V=Tracks.view(),x0=cam.x-12,y0=cam.y-12,x1=cam.x+VW+12,y1=cam.y+VH+12,m=TRACKS.sample,CR=Object.keys(TRACKS.col).indexOf('road');let left=TRACKS.max;
  ctx.save();const K=ctx.getTransform().a,PX=SPRITES.pixel;if(PX)ctx.imageSmoothingEnabled=false;// (the screen's pixels a game pixel; pixel ones on whole game pixels)
  try{all:for(const tr of W.tracks){const b=tr.box;if(b[2]+m<x0||b[0]-m>x1||b[3]+m<y0||b[1]-m>y1)continue;
    const p=tr.p,st=tr.style,art=tr.art,cls=trackLine(art)?0:trackClass(tr.n),gold=tr.q&&Tracks.known.has(tr.q),step=TRACKS.step[st],r2=tr.own?V.v2:V.r2;
    for(let i=0;i+3<p.length;i+=3){const ax=p[i],ay=p[i+1],bx=p[i+3],by=p[i+4];
      if((ax<x0&&bx<x0)||(ax>x1&&bx>x1)||(ay<y0&&by<y0)||(ay>y1&&by>y1))continue;
      const age=Tracks.sight(tr,i/3,V);if(age===null)continue;
      const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);if(!len)continue;
      const ux=dx/len,uy=dy/len,dir=Math.atan2(dy,dx);
      for(let s=0,k=0;s<len;s+=step,k++){const x=ax+ux*s,y=ay+uy*s,ex=x-V.x,ey=y-V.y;
        if(ex*ex+ey*ey>r2)continue;// (out of your sight now)
        const a=Tracks.clear(x,y,age);if(!a)continue;// (its ground keeps none (a bridge's deck crossed between two points), or faded there)
        const o=TRACK_SPOT,ci=gold?4:o.road?CR:CLIM[o.c];ctx.globalAlpha=gold?Math.min(1,a*1.5):a;
        const S=trackPic(art,cls,dir,k&1,ci,K,step),sx=(PX?Math.round(x-cam.x):x-cam.x)+S.ox,sy=(PX?Math.round(y-cam.y):y-cam.y)+S.oy;ctx.drawImage(S,sx,sy,S.w,S.h);
        if(sx<TB[0])TB[0]=Math.floor(sx);if(sy<TB[1])TB[1]=Math.floor(sy);if(sx+S.w>TB[2])TB[2]=Math.ceil(sx+S.w);if(sy+S.h>TB[3])TB[3]=Math.ceil(sy+S.h);
        if(--left<=0)break all}}}}
  finally{ctx.restore()}
  return TRACKS.max-left}
