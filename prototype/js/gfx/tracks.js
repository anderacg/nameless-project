'use strict';
/* ---------- tracks drawn (world/tracks.js keeps them; data/tracks.js TRACKS; doc/WORLD_DESIGN.md §12.7): each trail's prints every
   step px along its line, turned the way it went, a small print each (TRACK_GLYPH, lit on its up-left edge) in the people's style: footprints, hoof prints,
   paw prints, a wagon's two ruts, a beast's dragged furrow; a band's size class spreads them wider. They lie on the ground, over
   the land and under everything built and everyone (render.js drawWorld), as clear as their ground keeps them and fading with
   their age; only those you see (Tracks.seen: in your sight; others' by your Scouting), at most TRACKS.max a frame ---------- */
const TRACK_SI={foot:0,hoof:1,paw:2,rut:3,drag:4};
/* one print of each style, pointing east (forward: +x; rows across the way): a boot's sole and heel, a hoof's curve open behind,
   a paw's pad and toes; a wagon's two ruts and a beast's dragged furrow are lines (no print). '#' its ground's dark, turned to the
   nearest of the four ways (exact: pixel art turned 45° only blurs); a highlight (TRACKS.glow) lies on its up-left edges, as a
   pressed-in mark catches the light */
const TRACK_GLYPH=[['.#..##.','##.####','.#..##.'],['##.','..#','..#','##.'],['...#.','##...','##..#','##...','...#.'],null,null];
const TRACK_MARK=[null,null,null,[[-1,-3],[0,-3],[1,-3],[-1,3],[0,3],[1,3]],[[-1,0],[0,0],[1,0],[0,1]]];
// where the prints of a size class lie across the way, in lanes (a wagon and a dragged beast: one, in the middle)
const TRACK_ACROSS=[[-1,1],[-3,-1,1,3],[-5,-3,-1,1,3,5],[-7,-5,-3,-1,1,3,5,7]];
// (the pictures, made once each: [style][class][way][left or right step][ground's colour, or a known bounty's])
const TRACK_SPR=[];
function trackSprite(si,cls,dir,alt,ci){
  const a=TRACK_SPR[si]||(TRACK_SPR[si]=[]),b=a[cls]||(a[cls]=[]),c=b[dir]||(b[dir]=[]),d=c[alt]||(c[alt]=[]);if(d[ci])return d[ci];
  const col=Object.values(TRACKS.col)[ci],G=TRACK_GLYPH[si],px=[];
  if(G){// (a print: its pixels in lanes TRACKS.lane apart, left and right steps a stagger apart, turned to its way's nearest quarter)
    const q=Math.round(dir/2)%4,rot=(f,l)=>q===0?[f,l]:q===1?[-l,f]:q===2?[-f,-l]:[l,-f],W=G[0].length,H=G.length;
    TRACK_ACROSS[cls].forEach((l,j)=>{const f0=((j*5+alt*3)%4)*TRACKS.stagger-W/2,l0=l*TRACKS.lane/2+(alt?1:-1)-H/2;
      G.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='#')px.push(rot(Math.round(f0+x),Math.round(l0+y)))}))})}
  else{const ang=dir*Math.PI/4,ux=Math.cos(ang),uy=Math.sin(ang);for(const [fa,fb] of TRACK_MARK[si])px.push([Math.round(fa*ux-fb*uy),Math.round(fa*uy+fb*ux)])}
  // (cut to its pixels' box and a pixel round for the highlight, ox, oy its corner from the print's place)
  const on=new Set(px.map(p=>p+'')),ox=Math.min(...px.map(q=>q[0]))-1,oy=Math.min(...px.map(q=>q[1]))-1,S=mkc(Math.max(...px.map(q=>q[0]))-ox+1,Math.max(...px.map(q=>q[1]))-oy+1,g=>{
    g.fillStyle=TRACKS.glow;for(const [x,y] of px)if(!on.has([x-1,y-1]+''))g.fillRect(x-1-ox,y-1-oy,1,1);g.fillStyle=col;for(const [x,y] of px)g.fillRect(x-ox,y-oy,1,1)});
  S.ox=ox;S.oy=oy;return d[ci]=S}
// every trail's prints you see in view, onto the scene (ctx: the scene in game pixels, cam its whole pixels); how many it drew.
// Each laid from its stretch's own two points, from the older (its place and heading fixed once both are kept: a turn, or the
// trail growing, never moves one); a trail still being walked shows up to its last point (Tracks.step keeps one every sample px),
// none on to its walker (that stretch's heading would follow the walker and turn the prints as it turns: the owner, 2026-10-23)
function drawTracks(cam){if(!TRACKS.on||!W.tracks||!W.tracks.length)return 0;
  const V=Tracks.view(),x0=cam.x-12,y0=cam.y-12,x1=cam.x+VW+12,y1=cam.y+VH+12,m=TRACKS.sample,CR=Object.keys(TRACKS.col).indexOf('road');let left=TRACKS.max;
  ctx.save();
  try{all:for(const tr of W.tracks){const b=tr.box;if(b[2]+m<x0||b[0]-m>x1||b[3]+m<y0||b[1]-m>y1)continue;
    const p=tr.p,st=tr.style,si=TRACK_SI[st],cls=si>=3?0:trackClass(tr.n),gold=tr.q&&Tracks.known.has(tr.q),step=TRACKS.step[st],r2=tr.own?V.v2:V.r2;
    for(let i=0;i+3<p.length;i+=3){const ax=p[i],ay=p[i+1],bx=p[i+3],by=p[i+4];
      if((ax<x0&&bx<x0)||(ax>x1&&bx>x1)||(ay<y0&&by<y0)||(ay>y1&&by>y1))continue;
      const age=Tracks.sight(tr,i/3,V);if(age===null)continue;
      const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);if(!len)continue;
      const ux=dx/len,uy=dy/len,dir=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
      for(let s=0,k=0;s<len;s+=step,k++){const x=ax+ux*s,y=ay+uy*s,ex=x-V.x,ey=y-V.y;
        if(ex*ex+ey*ey>r2)continue;// (out of your sight now)
        const a=Tracks.clear(x,y,age);if(!a)continue;// (its ground keeps none (a bridge's deck crossed between two points), or faded there)
        const o=TRACK_SPOT,ci=gold?4:o.road?CR:CLIM[o.c];ctx.globalAlpha=gold?Math.min(1,a*1.5):a;
        const S=trackSprite(si,cls,dir,k&1,ci);ctx.drawImage(S,Math.round(x-cam.x)+S.ox,Math.round(y-cam.y)+S.oy);
        if(--left<=0)break all}}}}
  finally{ctx.restore()}
  return TRACKS.max-left}
