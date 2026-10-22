'use strict';
/* ---------- mist in the fog of war, the world's (fog.js drawWorldFog) and the battle's (battlefog.js fogDraw): drawn only.
   Two tileable noise fields baked once (MIST.n px each, from a little seeded PRNG of their own, never Math.random), drifting
   MIST.drift[i] px a second. They make the fog's edge mist (mistFog): each cell of the fog (a few px) reads the fog's smooth
   strength at a point pushed about by the slow noise (MIST.warp px: the edge bulges and recedes in puffs), then the fine
   noise frays its threshold into tendrils, and it becomes a dense body behind a thin, paler fringe (no band of even width).
   And as pictures, laid MIST.scale[i]× over the ground, they are the wisps drifting in the fog and a little ahead of it
   (mistLay, kept where the fog is with a mask drawn 'destination-in'), their strength breathing slowly (MIST.breath: radians
   a second). The cells and the wisps are laid into one small picture of the frame, drawn up smooth in one step: no work a
   screen pixel at a time. Real time, so it drifts while paused, as the water does; still (the same look) with reducedMotion.
   n: the fields' size (px, a power of two); res: ground px a pixel of the wisps' picture; col: the mist's colour (its wisps,
   its thin fringe); peak: the wisps' strength where thickest (0-1); scale: each picture's size over the ground (×); drift:
   px a second, x and y, each; breath: how fast each one's strength comes and goes; seeds: each field's; warp: px the edge is
   pushed about at most; wscale: ground px a pixel of the field that pushes it (puffs of 20-60 px); fscale: of the fine field
   that frays it; fray: how far the fine field moves the edge's threshold (in strength); pale: how much the thin fringe takes
   the mist's colour; ahead: strength the wisps reach full by (they drift ahead of the body) ---------- */
const MIST={n:128,res:8,col:[150,160,178],peak:.22,scale:[4,2.6],drift:[[5,1.6],[-2.6,3.8]],breath:[.23,.17],seeds:[11,29],
  warp:22,wscale:2.6,smooth:'high',fscale:1.1,fray:.9,pale:.55,ahead:.35};
let MISTV=null;
// (a field of mist: value noise over three lattices (8, 16 and 32 cells across, wrapping, so it tiles); its picture shaped into
// wisps (cv), and the field itself stretched to 0..1 (v), for the edges)
function mistTex(seed){
  let q=seed>>>0;const rnd=()=>{q=q+0x6d2b79f5|0;let z=Math.imul(q^q>>>15,1|q);z=z+Math.imul(z^z>>>7,61|z)^z;return ((z^z>>>14)>>>0)/4294967296};// (its own little PRNG, seeded)
  const n=MIST.n,v=new Float32Array(n*n),sm=f=>f*f*(3-2*f);
  for(const [m,w] of [[8,.66],[16,.26],[32,.08]]){const H=Float32Array.from({length:m*m},rnd),h=(i,j)=>H[(j%m)*m+i%m],sp=n/m;
    for(let y=0;y<n;y++){const j=Math.floor(y/sp),fy=sm(y/sp-j);for(let x=0;x<n;x++){const i=Math.floor(x/sp),fx=sm(x/sp-i),a=h(i,j)+(h(i+1,j)-h(i,j))*fx,b=h(i,j+1)+(h(i+1,j+1)-h(i,j+1))*fx;v[y*n+x]+=w*(a+(b-a)*fy)}}}
  let lo=1,hi=0;for(const x of v){if(x<lo)lo=x;if(x>hi)hi=x}const st=v.map(x=>(x-lo)/(hi-lo||1));
  const cv=mkc(n,n,g=>{const d=g.createImageData(n,n),[r,gg,b]=MIST.col;for(let i=0;i<n*n;i++){const p=i*4,e=Math.max(0,Math.min(1,(v[i]-.3)/.5));d.data[p]=r;d.data[p+1]=gg;d.data[p+2]=b;d.data[p+3]=Math.round(e*Math.sqrt(e)*255)}g.putImageData(d,0,0)});
  return {cv,v:st}}
const mistV=()=>MISTV||(MISTV=(()=>{const T=MIST.seeds.map(mistTex);return {tex:T.map(o=>o.cv),v:T.map(o=>o.v),pat:[],cv:null,w:0}})());
// (the clock the mist drifts by, s: real time; held at 0 with reducedMotion)
const mistTime=()=>reducedMotion()?0:performance.now()/1000;
// (field i at ground point (x, y), s ground px a pixel, drifting with its layer: 0..1, smoothly between its pixels)
function mistN(i,x,y,s,t){
  const n=MIST.n,v=MISTV.v[i],d=MIST.drift[i];let u=((x-d[0]*t)/s)%n,w=((y-d[1]*t)/s)%n;if(u<0)u+=n;if(w<0)w+=n;
  const a=u|0,b=w|0,fx=u-a,fy=w-b,a1=a+1===n?0:a+1,b1=b+1===n?0:b+1,p=v[b*n+a],q=v[b*n+a1],r=v[b1*n+a],z=v[b1*n+a1];
  return p+(q-p)*fx+(r-p+(z-r-q+p)*fx)*fy}
const mistSm=(a,b,x)=>{const f=x<=a?0:x>=b?1:(x-a)/(b-a);return f*f*(3-2*f)};
/* the fog over the box x, y, w, h of the ground (world or field px), its edge made mist, wisps drifting in it: laid into E.comp
   (a pixel k ground px, its corner at ground E.gx, E.gy; its part used E.cw × E.ch) for the caller to draw up in one step.
   cs: px a cell; levels, under to over: {s(x, y, X, Y): the fog's smooth strength 0..1 at (x, y) (the cell's middle X, Y,
   pushed about), flat(X, Y): 0 or 1 when it is that all round within MIST.warp px of X, Y, else -1 (those cells skip the
   noise: most of them), a: its darkness, col: its colour, m: the wisps' strength in it; optional haze, hz: its thin edge in the
   colour haze, turning to col from strength hz[0] to hz[1]}. E keeps the pictures between frames */
function mistFog(E,x,y,w,h,cs,k,levels){
  const M=mistV(),gx=Math.floor(x/cs)*cs-cs,gy=Math.floor(y/cs)*cs-cs,cols=Math.ceil((x+w-gx)/cs)+1,rows=Math.ceil((y+h-gy)/cs)+1,f=cs/k;
  if(E.cols!==cols||E.rows!==rows){E.cols=cols;E.rows=rows;E.cv=mkc(cols,rows,()=>{});E.mk=mkc(cols,rows,()=>{});E.img=E.cv.getContext('2d').createImageData(cols,rows);E.mimg=E.mk.getContext('2d').createImageData(cols,rows);E.comp=mkc(cols*f,rows*f,()=>{})}
  const t=mistTime(),d=E.img.data,m=E.mimg.data,[pr,pg,pb]=MIST.col,W=MIST.warp,ws=MIST.wscale,fs=MIST.fscale,fr=MIST.fray,nl=levels.length;
  const fl=E.fl||(E.fl=[]);
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const X=gx+(c+.5)*cs,Y=gy+(r+.5)*cs;let A=0,cr=0,cg=0,cb=0,thin=0,wm=0,all=true;for(let i=0;i<nl;i++){const v=levels[i].flat(X,Y);fl[i]=v;if(v<0)all=false}
    if(all)for(let i=0;i<nl;i++){const L=levels[i],a=fl[i]*L.a;cr+=(L.col[0]-cr)*a;cg+=(L.col[1]-cg)*a;cb+=(L.col[2]-cb)*a;A+=a*(1-A);thin*=1-fl[i];wm=Math.max(wm,fl[i]*L.m)}
    else{
      // (the point it reads, pushed about by the slow field; the fine field fraying the threshold most where the fog is half)
      const px=X+(mistN(1,X,Y,ws,t)-.5)*2*W,py=Y+(mistN(1,X+977,Y+613,ws,t)-.5)*2*W,fn=mistN(0,X,Y,fs,t)-.5;
      for(let i=0;i<nl;i++){const L=levels[i],s=fl[i]>=0?fl[i]:L.s(px,py,X,Y),g=s+fr*fn*4*s*(1-s),dn=.42*mistSm(.1,.48,g)+.58*mistSm(.38,.8,g),a=dn*L.a;
        // (a level with a haze: its thin edge that colour (pale: fog, not a shadow), its own colour from hz[0] to hz[1] of its
        // strength)
        if(L.haze){const u=mistSm(L.hz[0],L.hz[1],g),H=L.haze;cr+=(H[0]+(L.col[0]-H[0])*u-cr)*a;cg+=(H[1]+(L.col[1]-H[1])*u-cg)*a;cb+=(H[2]+(L.col[2]-H[2])*u-cb)*a}else{
        cr+=(L.col[0]-cr)*a;cg+=(L.col[1]-cg)*a;cb+=(L.col[2]-cb)*a}A+=a*(1-A);thin=thin*(1-dn)+4*dn*(1-dn);wm=Math.max(wm,mistSm(0,MIST.ahead,g)*L.m)}}
    // (the thin fringe paled toward the mist's colour: lighter where it is thin)
    const o=(r*cols+c)*4,p=Math.min(1,thin*MIST.pale),q=A>0?1/A:0;
    d[o]=Math.round(cr*q*(1-p)+pr*p);d[o+1]=Math.round(cg*q*(1-p)+pg*p);d[o+2]=Math.round(cb*q*(1-p)+pb*p);d[o+3]=Math.round(A*255);m[o+3]=Math.round(wm*255)}
  E.cv.getContext('2d').putImageData(E.img,0,0);E.mk.getContext('2d').putImageData(E.mimg,0,0);
  const g=E.comp.getContext('2d'),cw=cols*f,ch=rows*f;g.clearRect(0,0,cw,ch);g.imageSmoothingEnabled=true;g.imageSmoothingQuality=MIST.smooth;g.drawImage(E.cv,0,0,cols,rows,0,0,cw,ch);
  mistLay(x,y,w,h,q=>q.drawImage(E.mk,0,0,cols,rows,gx,gy,cols*cs,rows*cs));g.imageSmoothingQuality='low';mistOnto(g,gx,gy,k);
  E.gx=gx;E.gy=gy;E.cw=cw;E.ch=ch;E.k=k;return E}
// (a grid's flat parts, for mistFog: G, C × R cells cs px, smoothly between their middles; over the box x0..x1, y0..y1 of the
// ground: a function (X, Y) -> 0 or 1 when every cell a point within MIST.warp px of (X, Y) reads from is that, else -1.
// Summed tables of its cells not 0 and not 1, kept in F)
function mistFlat(F,G,C,R,cs,x0,y0,x1,y1){
  const W=MIST.warp,c0=Math.max(0,Math.floor((x0-W)/cs)-2),r0=Math.max(0,Math.floor((y0-W)/cs)-2),c1=Math.min(C-1,Math.ceil((x1+W)/cs)+2),r1=Math.min(R-1,Math.ceil((y1+W)/cs)+2),w=c1-c0+2,h=r1-r0+2;
  if(!F.z||F.z.length<w*h){F.z=new Int32Array(w*h);F.o=new Int32Array(w*h)}const Z=F.z,O=F.o;
  for(let c=0;c<w;c++){Z[c]=0;O[c]=0}
  for(let r=1;r<h;r++){let sz=0,so=0;const q=r*w,p=q-w,g=(r0+r-1)*C+c0-1;Z[q]=0;O[q]=0;for(let c=1;c<w;c++){const v=G[g+c];if(v>1e-4)sz++;if(v<1-1e-4)so++;Z[q+c]=Z[p+c]+sz;O[q+c]=O[p+c]+so}}
  return (X,Y)=>{const a=Math.max(c0,Math.floor((X-W)/cs-.5)),b=Math.max(r0,Math.floor((Y-W)/cs-.5)),e=Math.min(c1,Math.floor((X+W)/cs-.5)+1),f=Math.min(r1,Math.floor((Y+W)/cs-.5)+1);
    if(e<a||f<b)return -1;const i0=(b-r0)*w+(a-c0),i1=(f-r0+1)*w+(e-c0+1),j0=(b-r0)*w+(e-c0+1),j1=(f-r0+1)*w+(a-c0);
    return Z[i1]-Z[j0]-Z[j1]+Z[i0]===0?0:O[i1]-O[j0]-O[j1]+O[i0]===0?1:-1}}
// the wisps over the box x, y, w, h of the ground, laid into MISTV.cv (its part used: w, h); mask(g): draws where the fog is
// (alpha), in ground px
function mistLay(x,y,w,h,mask){
  const M=mistV();if(w<=0||h<=0){M.w=0;return M}const r=MIST.res,cw=Math.ceil(w/r)+1,ch=Math.ceil(h/r)+1;
  if(!M.cv||M.cv.width<cw||M.cv.height<ch){M.cv=mkc(Math.max(cw,M.cv?M.cv.width:0),Math.max(ch,M.cv?M.cv.height:0),()=>{});M.pat=[]}
  const g=M.cv.getContext('2d'),rm=reducedMotion(),t=mistTime();M.t=t;M.x=x;M.y=y;M.w=cw;M.h=ch;
  g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,cw,ch);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='low';
  for(let i=0;i<M.tex.length;i++){const s=MIST.scale[i],L=MIST.n*s,[vx,vy]=MIST.drift[i],ox=((x-vx*t)%L+L)%L,oy=((y-vy*t)%L+L)%L,p=M.pat[i]||(M.pat[i]=g.createPattern(M.tex[i],'repeat'));
    g.globalAlpha=MIST.peak*(rm?.75:.75+.25*Math.sin(t*MIST.breath[i]+i*2.1));g.setTransform(s/r,0,0,s/r,-ox/r,-oy/r);g.fillStyle=p;g.fillRect(ox/s,oy/s,cw*r/s,ch*r/s)}
  g.globalAlpha=1;g.setTransform(1/r,0,0,1/r,-x/r,-y/r);g.globalCompositeOperation='destination-in';mask(g);g.globalCompositeOperation='source-over';g.setTransform(1,0,0,1,0,0);return M}
// (the wisps last laid, onto g, whose pixel is k ground px with its corner at ground (gx, gy); smoothly, by g's own smoothing)
function mistOnto(g,gx,gy,k){const M=MISTV;if(!M||!M.w)return;const r=MIST.res;g.drawImage(M.cv,0,0,M.w,M.h,(M.x-gx)/k,(M.y-gy)/k,M.w*r/k,M.h*r/k)}
