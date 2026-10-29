'use strict';
/* ---------- tracks drawn (world/tracks.js keeps them; data/tracks.js TRACKS; doc/WORLD_DESIGN.md §12.7): each trail's prints every
   step px along its line, turned the way it went, a print each (trackPic: the art's, art/tracks.svg, pixelated): a soldier's
   hobnailed boots, a bandit's boots, bare feet, shod hooves, paws by the beast, a wagon's two ruts, a beast's dragged furrow (its
   look: world/tracks.js Track#art); a band's size class spreads them wider. They lie on the ground, over
   the land and under everything built and everyone (render.js drawWorld), as clear as their ground keeps them and fading with
   their age; only those you see (Tracks.seen: in your sight; others' by your Scouting), at most TRACKS.max a frame ---------- */
// where the prints of a size class lie across the way, in lanes (a wagon and a dragged beast: one, in the middle)
const TRACK_ACROSS=[[-1,1],[-3,-1,1,3],[-5,-3,-1,1,3,5],[-7,-5,-3,-1,1,3,5,7]];
/* the prints' pictures (the owner, 2026-10-29: the art's tracks, art/tracks.svg, pixel only, 8 ways): each art pixelated at its size
   in the game (data/trackart.js TRACK_PX, by art/tracks.py; its sheet art/tracks-px.svg), turned to the nearest of the 8 ways it
   went (each straight one the east one turned, each slant the south-east one: pixel for pixel), a left or right step mirrored,
   its size class's lanes (TRACK_ACROSS, TRACKS.lane apart, steps TRACKS.stagger apart along; whole pixels, halves away from the
   middle, so each way the same turned), in its ground's colour (ci: TRACKS.col's), its details (tread, nails, a frog) lighter
   (TRACKS.detail); no light on it (the owner: "make them the same, no light"). Its size: TRACKS.art.px (the print's length in
   game px); a wagon's ruts and a beast's drag, a band along the way its step long. Each made once (TRACK_PICS) and kept: its
   corner ox, oy from the print's place, whole game px */
const TRACK_PICS=new Map();
const trackLine=id=>id==='ruts'||id==='drag';
const trackRound=v=>Math.sign(v)*Math.round(Math.abs(v));
function trackPic(id,cls,a,alt,ci){
  const way=((Math.round(a/(Math.PI/4))%8)+8)%8,line=trackLine(id),key=id+'|'+cls+'|'+way+'|'+(alt?1:0)+'|'+ci;let S=TRACK_PICS.get(key);if(S)return S;
  const T=TRACKS,g=TRACK_PX[id][way*2+(alt&&!line?1:0)],lanes=line?[0]:TRACK_ACROSS[cls],ang=way*Math.PI/4+Math.PI/2,c=Math.cos(ang),s=Math.sin(ang),on=new Map();
  lanes.forEach((l,j)=>{const x=line?0:l*T.lane/2+(alt?1:-1),y=line?0:-((j*5+(alt?3:0))%4)*T.stagger,dx=trackRound(Math.round((x*c-y*s)*1e6)/1e6)+g.o[0],dy=trackRound(Math.round((x*s+y*c)*1e6)/1e6)+g.o[1];
    g.r.forEach((r,j2)=>{for(let i=0;i<r.length;i++)if(r[i]!=='.')on.set((dx+i)+','+(dy+j2),r[i])})});
  const px=[...on.keys()].map(k=>k.split(',').map(Number)),ox=Math.min(...px.map(p=>p[0])),oy=Math.min(...px.map(p=>p[1]));
  S=mkc(Math.max(...px.map(p=>p[0]))-ox+1,Math.max(...px.map(p=>p[1]))-oy+1,G=>{G.fillStyle=Object.values(T.col)[ci];for(const [x,y] of px)G.fillRect(x-ox,y-oy,1,1);G.fillStyle=T.detail;for(const [x,y] of px)if(on.get(x+','+y)==='+')G.fillRect(x-ox,y-oy,1,1)});
  S.ox=ox;S.oy=oy;TRACK_PICS.set(key,S);return S}
// every trail's prints you see in view, onto the scene (ctx: the scene in game pixels, cam its whole pixels); how many it drew.
// Each laid from its stretch's own two points, from the older (its place and heading fixed once both are kept: a turn, or the
// trail growing, never moves one); a trail still being walked shows up to its last point (Tracks.step keeps one every sample px),
// none on to its walker (that stretch's heading would follow the walker and turn the prints as it turns: the owner, 2026-10-23)
function drawTracks(cam){if(!TRACKS.on||!W.tracks||!W.tracks.length)return 0;
  const V=Tracks.view(),x0=cam.x-12,y0=cam.y-12,x1=cam.x+VW+12,y1=cam.y+VH+12,m=TRACKS.sample,CR=Object.keys(TRACKS.col).indexOf('road');let left=TRACKS.max;
  ctx.save();
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
        const S=trackPic(art,cls,dir,k&1,ci);ctx.drawImage(S,Math.round(x-cam.x)+S.ox,Math.round(y-cam.y)+S.oy);
        if(--left<=0)break all}}}}
  finally{ctx.restore()}
  return TRACKS.max-left}
