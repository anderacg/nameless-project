'use strict';
/* ---------- PX engine: beasts and monsters ---------- */
// The battle's beasts and monsters in the people figures' style (the game's people.js): drawn side-on facing right, pixel by pixel
// into a grid, shaded in hue-shifted four-tone ramps (light from the top left: a broad lit side, the shadow narrow on the right and
// underneath; highlights warm, shadows cool, colours muted), then a dark navy outline round the silhouette only. Each kind has its
// canvas (the same for every pose), its feet on the row above the bottom one (the outline under them), so the game puts it in a
// power-of-two cell (8, 16, 32, 64) with its feet on the unit's point. Seeded: a variant (v) picks the coat's shade and its marks,
// never Math.random.
// PX.beast(kind, {v, pose, team}) -> canvas (c.fh: the figure's height over its feet, for the health bar). Poses as the people's:
// 0-1 standing (breathing), 2-5 walking, 15-18 running, 6-8 the attack (wind up, strike, follow through: a bite, a claw, a slam,
// a spit), 9-11 the second attack (the dragon's breath; the rest the first again), 19-26 the walk; PX.BEAST_DEAD lying dead.
// team 0 (your side): a collar or a band in the side's blue on a beast that fights for you; a wild one (team 1) wears nothing.
// PX.beastMap(kind, f): the world map's figure (the dragon flying, its own smaller figure, wings up, then level; the rest their walk,
// f 0-3). PX._beastFit(kind): how far each kind's poses reach (none may touch its canvas's edge: the gallery's ?view=beasts&fit=1).
(function(PX){
  const OUT='#1a1c26',DEAD=99;
  PX.BEAST_DEAD=DEAD;PX.BEAST_POSES=[0,1,2,3,4,5,15,16,17,18,6,7,8,9,10,11];
  /* colour: a hue-shifted ramp from one muted base (light warm toward yellow, shadows cool toward blue) */
  const h2r=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  function hsl(c){let [r,g,b]=h2r(c).map(v=>v/255);const M=Math.max(r,g,b),m=Math.min(r,g,b),l=(M+m)/2;let h=0,s=0;
    if(M!==m){const d=M-m;s=l>.5?d/(2-M-m):d/(M+m);h=(M===r?(g-b)/d+(g<b?6:0):M===g?(b-r)/d+2:(r-g)/d+4)*60}return[h,s,l]}
  function fromHsl(h,s,l){h=((h%360)+360)%360;s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,
    [r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+[r,g,b].map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('')}
  const toward=(h,t,k)=>h+(((t-h+540)%360)-180)*k;
  // (grey: no hue of its own, so the light is a faint warm and the shade a faint cool)
  PX.ramp=c=>{const [h,s0,l]=hsl(c),s=Math.min(s0,.48),grey=s0<.06,hh=grey?40:h,hs=grey?235:h;
    return[fromHsl(toward(hh,48,.2),grey?.08:s*1.05,l+.13),fromHsl(h,s,l),fromHsl(toward(hs,232,.16),grey?.07:s*.92,l-.12),fromHsl(toward(hs,242,.28),grey?.08:s*.85,l-.22)]};
  const RAMPS={};const R=c=>RAMPS[c]||(RAMPS[c]=PX.ramp(c));
  const TEAM=['#a9d4fb','#398dd5','#3056ac','#353287'];
  /* the grid and its masks */
  const grid=(w,h)=>({w,h,p:new Array(w*h).fill(null)});
  // (OX: where a kind's x = 0 falls in the grid it is drawn on: room round it, cut to its canvas after)
  let OX=0;
  const put=(g,x,y,c)=>{x=Math.round(x)+OX;y=Math.round(y);if(c&&x>=0&&y>=0&&x<g.w&&y<g.h)g.p[y*g.w+x]=c};
  const putR=(g,x,y,c)=>{if(c&&x>=0&&y>=0&&x<g.w&&y<g.h)g.p[y*g.w+x]=c};
  const at=(g,x,y)=>x>=0&&y>=0&&x<g.w&&y<g.h?g.p[y*g.w+x]:null;
  const K=(x,y)=>(y+256)*1024+x+256;
  class Mask{constructor(){this.s=new Set()}
    add(x,y){this.s.add(K(Math.round(x),Math.round(y)));return this}has(x,y){return this.s.has(K(x,y))}
    pts(){const o=[];for(const k of this.s)o.push([k%1024-256,Math.floor(k/1024)-256]);return o}
    // an ellipse; a limb from (x0,y0) to (x1,y1), w0 wide at its root and w1 at its end; a polygon; a rectangle
    ell(cx,cy,rx,ry){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)if(((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1)this.add(x,y);return this}
    limb(x0,y0,x1,y1,w0,w1){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)*2)),flat=Math.abs(x1-x0)>Math.abs(y1-y0);
      for(let i=0;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,w=Math.max(1,Math.round(w0+(w1-w0)*t)),a=flat?-(w-1):-Math.floor((w-1)/2);for(let k=0;k<w;k++)flat?this.add(x,y+a+k):this.add(x+a+k,y)}return this}
    poly(P){const ys=P.map(p=>p[1]);for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++){const cy=y+.5,xs=[];
      for(let i=0;i<P.length;i++){const [ax,ay]=P[i],[bx,by]=P[(i+1)%P.length];if((ay<=cy&&by>cy)||(by<=cy&&ay>cy))xs.push(ax+(cy-ay)/(by-ay)*(bx-ax))}
      xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.round(xs[k]);x<Math.round(xs[k+1]);x++)this.add(x,y)}return this}
    rect(x,y,w,h){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.add(x+i,y+j);return this}
    box(){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const [x,y] of this.pts()){a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);d=Math.max(d,y)}return[a,b,c,d]}}
  const mask=()=>new Mask();
  /* shading a part: each pixel by where it lies on the part (its box, or the frame o gives: cx, cy, rx, ry), lit from the top left;
     its top edge catching the light, its underside and its right in shade. dk: a step darker throughout (the far side) */
  function shade(g,m,Rp,o){o=o||{};const [x0,y0,x1,y1]=m.box(),cx=o.cx??(x0+x1+1)/2,cy=o.cy??(y0+y1+1)/2,rx=o.rx??Math.max(1,(x1-x0+1)/2),ry=o.ry??Math.max(1,(y1-y0+1)/2);
    for(const [x,y] of m.pts()){const nx=(x+.5-cx)/rx,ny=(y+.5-cy)/ry,L=-(nx*.45+ny*.9);let t=L>.5?0:L>-.4?1:L>-.85?2:3;
      if(!m.has(x,y-1)&&t>0&&!o.noTop)t--;if(!m.has(x,y+1))t=Math.max(t,2);else if(!m.has(x+1,y)&&ny>-.35)t=Math.max(t,2);
      put(g,x,y,Rp[Math.max(o.lo||0,Math.min(3,t+(o.dk||0)))])}}
  // a flat part (a limb seen edge on): t0 its tone, the bottom pixel t1
  function flat(g,m,Rp,t0,t1){for(const [x,y] of m.pts())put(g,x,y,Rp[!m.has(x,y+1)&&t1!=null?t1:t0])}
  // (nothing may touch the canvas's edge, where no outline could go round it: such a pixel becomes the outline)
  function outline(g){for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)if(at(g,x,y)&&(x===0||y===0||x===g.w-1||y===g.h-1))put(g,x,y,OUT);const o=[];for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)if(!at(g,x,y)&&(at(g,x-1,y)||at(g,x+1,y)||at(g,x,y-1)||at(g,x,y+1)))o.push([x,y]);for(const [x,y] of o)put(g,x,y,OUT)}
  function canvas(g){const c=PX.canvas(g.w,g.h),x=c.getContext('2d'),id=x.createImageData(g.w,g.h),d=id.data,mem={};
    for(let i=0;i<g.p.length;i++){const col=g.p[i];if(!col)continue;const v=mem[col]||(mem[col]=h2r(col));d[i*4]=v[0];d[i*4+1]=v[1];d[i*4+2]=v[2];d[i*4+3]=255}x.putImageData(id,0,0);return c}
  // (a grid turned a quarter clockwise, pixel for pixel: what stood up now lies, its head to the right)
  function turn(g){const r=grid(g.h,g.w);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=g.p[y*g.w+x];if(c)r.p[x*r.w+(g.h-1-y)]=c}return r}
  // (a tube along a path of [x, y, r] points: a neck, a tail, a serpent's body; shaded round its own line; the side toward under
  // (bx, by) its belly, in the ramp L)
  function tube(g,pts,C,o){o=o||{};const S=[],m=mask();
    for(let i=0;i+1<pts.length;i++){const [x0,y0,r0]=pts[i],[x1,y1,r1]=pts[i+1],n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)*2));
      for(let k=0;k<=n;k++){const t=k/n,x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,r=r0+(r1-r0)*t,l=Math.hypot(x1-x0,y1-y0)||1;S.push([x,y,r,-(y1-y0)/l,(x1-x0)/l]);m.ell(x,y,Math.max(.6,r),Math.max(.6,r))}}
    for(const [x,y] of m.pts()){let b=null,bd=1e9;for(const s of S){const d=Math.hypot(x+.5-s[0],y+.5-s[1]);if(d<bd){bd=d;b=s}}
      const nx=(x+.5-b[0])/Math.max(1,b[2]),ny=(y+.5-b[1])/Math.max(1,b[2]),L=-(nx*.5+ny*.85);let t=L>.45?0:L>-.35?1:L>-.8?2:3;if(!m.has(x,y+1))t=Math.max(t,2);
      // (the belly: the side of the line toward o.belly (a direction), when the tube is thick enough to show it)
      let c=C[Math.min(3,t+(o.dk||0))];if(o.L&&b[2]>=1.5){const s=Math.sign(b[3]*o.belly[0]+b[4]*o.belly[1])||1,bx=b[3]*s,by=b[4]*s;if((nx*bx+ny*by)>.3)c=o.L[Math.min(3,Math.max(1,t))]}
      put(g,x,y,c)}
    return m}
  // a wing from its root (rx, ry): mode fold, up, mid or down; size [w, h]; feathers or a membrane between bones; the far one darker
  const WING={fold:[[0,0],[-.3,-.45],[-1,-.62],[-.82,-.12],[-.4,.12]],up:[[0,0],[-.12,-.62],[-.5,-1],[-.72,-.42],[-.38,.05]],
    mid:[[0,0],[-.4,-.38],[-1,-.5],[-.85,-.05],[-.38,.12]],down:[[0,0],[-.45,-.08],[-1,.22],[-.7,.4],[-.32,.22]]};
  function wing(g,rx,ry,mode,sz,C,o){const P=WING[mode].map(([x,y])=>[rx+x*sz[0],ry+y*sz[1]]),dk=o.far?1:0,m=mask().poly(P);
    if(o.membrane){shade(g,m,o.membrane,{dk,cx:P[2][0],cy:P[2][1],rx:sz[0],ry:sz[1]});const bone=mask();bone.limb(P[0][0],P[0][1],P[1][0],P[1][1],2,2).limb(P[1][0],P[1][1],P[2][0],P[2][1],2,1);
      for(const k of [3,4])bone.limb(P[1][0]+(P[2][0]-P[1][0])*.2,P[1][1]+(P[2][1]-P[1][1])*.2,P[k][0],P[k][1],1,1);bone.limb(P[2][0],P[2][1],P[3][0],P[3][1],1,1);flat(g,bone,C,1+dk,2+dk);put(g,P[2][0],P[2][1],o.claw||C[0])}
    else{shade(g,m,C,{dk,cx:P[1][0],cy:P[1][1]-1,rx:sz[0]*.6,ry:sz[1]*.6});
      // (the long feathers: their tips darker in steps along the trailing edge, the leading edge in the light)
      for(const [x,y] of m.pts()){if(!m.has(x,y+1)&&((x+y)&1))put(g,x,y,C[Math.min(3,2+dk)]);if(!m.has(x,y-1)&&!dk)put(g,x,y,C[0])}
      const s=mask();for(let t=.25;t<.95;t+=.22)s.limb(P[1][0]+(P[2][0]-P[1][0])*t,P[1][1]+(P[2][1]-P[1][1])*t,P[4][0]+(P[3][0]-P[4][0])*t,P[4][1]+(P[3][1]-P[4][1])*t,1,1);
      for(const [x,y] of s.pts())if(m.has(x,y))put(g,x,y,C[Math.min(3,2+dk)])}
    return m}

  /* the frame: what a pose asks of the body. act: idle, walk, run, atk, alt, dead; i: its step */
  function act(pose){if(pose===DEAD)return['dead',0];if(pose<=1)return['idle',pose];if(pose<=5)return['walk',pose-2];if(pose<=8)return['atk',pose-6];
    if(pose<=11)return['alt',pose-9];if(pose<=14)return['atk',pose-12];if(pose<=18)return['run',pose-15];return['walk',(pose-19)%4]}
  /* a four-legged gait: legs [far hind, far fore, near hind, near fore] each [dx, lift]; bob (the body's rise, negative up); head
     [dx, dy]; jaw (open 0-2); tail (-1 down .. 1 up); paw (the near fore raised for a blow: 0-2); wing (fold, up, mid, down) */
  function gait(a,i){
    const F={a,i,legs:[[0,0],[0,0],[0,0],[0,0]],bob:0,head:[0,0],jaw:0,tail:0,paw:0,lean:0,wing:'fold'};
    if(a==='idle'){if(i){F.head=[0,1];F.tail=1}}
    else if(a==='walk'){F.legs=[[[2,0],[-2,0],[-2,0],[2,0]],[[0,0],[0,1],[0,1],[0,0]],[[-2,0],[2,0],[2,0],[-2,0]],[[0,1],[0,0],[0,0],[0,1]]][i];F.bob=i%2?-1:0;F.head=[0,i%2?0:1]}
    else if(a==='run'){F.legs=[[[-3,0],[3,0],[-3,0],[4,0]],[[1,2],[-1,2],[2,2],[-1,1]],[[2,0],[-2,1],[3,0],[-2,1]],[[-1,1],[1,0],[-1,1],[2,0]]][i];F.bob=[0,-2,-1,0][i];F.head=[1,[0,-1,0,1][i]];F.tail=[1,0,1,1][i];F.lean=1;F.wing=['up','mid','down','mid'][i]}
    else if(a==='atk'||a==='alt'){F.legs=[[[0,0],[-1,0],[0,0],[-1,0]],[[1,0],[2,0],[1,0],[3,1]],[[1,0],[1,0],[0,0],[2,0]]][i];F.head=[[-2,-1],[3,1],[2,0]][i];F.jaw=[0,2,1][i];F.bob=[1,0,0][i];F.paw=[2,1,0][i];F.tail=[1,1,0][i];F.wing=['up','up','mid'][i]}
    return F}

  /* a four-legged beast from its shape S and the frame F: the far wing and legs, the tail, the body, the near legs and wing, the
     neck and head. S: the ground row Y; hip and sho (where the legs join), back (the back's height over the ground at the hips and
     shoulders: [rump, withers]), belly (its height), ry, rh, rc (the body's half lengths), legs [thigh width, shin width, hind hock
     back]; pawUp (how high a blow lifts the near fore: 0 for a biter); head {x, y (its middle, from the shoulder and the ground), w,
     h, snout [length, depth], sy, M (the muzzle's ramp), ear, more}; neck (its own, instead); tail, marks, collar, wing: their own;
     C the coat ramp, L the belly's, D the dark (paws, nose) */
  function quad(g,S,F,o){
    const Y=S.Y,b=F.bob,lx=F.lean?1:0,hip=S.hip,sho=S.sho+lx,top=[Y-S.back[0]+b,Y-S.back[1]+b],bel=Y-S.belly+b,C=S.C,Dk=S.D,P={Y,b,lx,hip,sho,top,bel};
    // (a leg: from its root under the body to its foot on the ground (lift: raised), a hind one bent back at the hock)
    const leg=(i,near)=>{const fore=i%2===1,[dx,lift]=F.legs[i]||[0,0],up=fore&&near&&S.pawUp?[0,S.pawUp,Math.ceil(S.pawUp/2)][F.paw]||0:0,rx=(fore?sho:hip)+(near?0:-1),ry=bel-1,
      fx=rx+dx+(near?0:(fore?-1:1))+(up?2:0),fy=Y-lift-up,m=mask(),[w0,w1,hock]=fore&&S.fore?S.fore:S.legs,LC=fore&&S.foreC?S.foreC:C;
      if(!fore&&hock){const kx=rx-hock+Math.round(dx/2),ky=Math.round((ry+fy)/2)+1;m.limb(rx,ry,kx,ky,w0,w1).limb(kx,ky,fx,fy,w1,w1)}else m.limb(rx,ry,fx,fy,w0,w1);
      if(near){shade(g,m,LC,{noTop:true});for(const [x,y] of m.pts())if(y>=fy-(S.paw||0))put(g,x,y,Dk[y===fy?2:1])}else{flat(g,m,LC,3,3);for(const [x,y] of m.pts())if(y===fy)put(g,x,y,Dk[3])}
      if(S.claws&&(near||S.claws>1))put(g,fx+Math.ceil(w1/2),fy,S.claws>1?'#d8d0bc':'#c8c0ac')};
    if(S.wing)S.wing(g,F,P,true);
    leg(0,false);leg(1,false);
    if(S.tail)S.tail(g,hip-2,top[0]+1,F,P);
    // the body: the haunch, the chest and the back between, shaded as one; its belly lighter
    const body=mask(),hcx=hip+(S.hx||0),ccx=sho-(S.cx||0);body.ell(hcx,(top[0]+bel)/2+.5,S.rh||S.ry,(bel-top[0])/2+.5).ell(ccx,(top[1]+bel)/2+.5,S.rc||S.ry+.5,(bel-top[1])/2+.5);
    body.poly([[hcx,top[0]],[ccx,top[1]],[ccx,bel+1],[hcx,bel+1]]);if(S.hump)body.ell(sho-S.hump[0],top[1]+1,S.hump[1],S.hump[2]);
    shade(g,body,C);
    if(S.L)for(const [x,y] of body.pts())if(y>=bel-(S.lb||0)&&x>hcx&&x<ccx+1&&body.has(x,y+1))put(g,x,y,S.L[y===bel?2:1]);
    if(S.marks)S.marks(g,body,F,o,P);
    leg(2,true);leg(3,true);
    if(S.wing)S.wing(g,F,P,false);
    const h=S.neck?S.neck(g,F,P,o):head(g,S,F,P);
    if(o.team===0&&S.collar)S.collar(g,P,h,F);
    return h}
  // the neck and head: the neck from the withers to the back of the head; the skull, the snout, the jaw (open in a bite)
  function head(g,S,F,P){const H=S.head,C=S.C,Dk=S.D,sho=P.sho,hx=sho+H.x+F.head[0]+P.lx,hy=P.Y-H.y+P.b+F.head[1],neck=mask();
    neck.poly([[sho-2,P.top[1]],[hx-H.w/2+1,hy-H.h/2],[hx,hy+H.h/2],[sho+1,P.bel-1]]);shade(g,neck,C,{cx:sho-1,cy:hy-2,rx:H.w,ry:H.h+3});
    if(S.mane)S.mane(g,F,P,hx,hy);
    const [sl,sd]=H.snout,sx=Math.round(hx+H.w/2-1),sy=Math.round(hy-sd/2+(H.sy||0)),sk=mask().ell(hx,hy,H.w/2,H.h/2),sn=mask().rect(sx,sy,sl,sd);if(sd>2)sn.s.delete(K(sx+sl-1,sy+sd-1));
    shade(g,sk,C,{cx:hx-1,cy:hy-1,rx:H.w/2+1,ry:H.h/2+1});shade(g,sn,H.M||C,{cx:hx,cy:sy,rx:H.w/2+sl,ry:sd+1});
    if(F.jaw){const my=sy+sd;for(let k=0;k<F.jaw;k++)for(let x=sx;x<sx+sl-(k?1:0);x++)put(g,x,my+k,k?'#6a3038':'#3a2430');for(let x=sx-1;x<sx+sl-(F.jaw>1?0:1);x++)put(g,x,my+F.jaw,(H.M||C)[2]);
      if(H.fang){put(g,sx+sl-2,my,'#efe8d8');put(g,sx+1,my+F.jaw-1,'#d8d0bc')}}
    put(g,sx+sl-1,sy,Dk[3]);// (the nose)
    if(H.ear)H.ear(g,hx,hy,F);
    put(g,Math.round(hx+(H.ex??1)),Math.round(hy-1+(H.ey||0)),F.dead?C[3]:H.eye||'#e8c050');
    if(H.more)H.more(g,hx,hy,F,sx,sy);
    return{hx,hy}}
  /* a beast lying dead, side-on: the body low on the ground, its legs out stiff toward you, the head flat ahead */
  function quadDead(g,S,o){const F=gait('idle',0),lay={...S,belly:2,back:[S.back[0]-S.belly+2,S.back[1]-S.belly+2],legs:[S.legs[0],S.legs[1],0],fore:S.fore?[S.fore[0],S.fore[1],0]:null,pawUp:0,
      head:S.head?{...S.head,y:S.head.h/2+1,x:S.head.x+2}:null,wing:S.wing?(g,F,P,far)=>S.wing(g,{...F,wing:'down'},P,far):null};
    F.dead=true;F.legs=[[-2,0],[2,0],[-3,0],[3,0]];F.tail=-1;return quad(g,lay,F,o)}
  // (one that falls on its back: the standing figure turned over, its legs in the air, lying on the ground)
  function onBack(g,draw){const s=grid(g.w,g.h);draw(s);let lo=0,hi=g.h;for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++)if(at(s,x,y)){hi=Math.min(hi,y);lo=Math.max(lo,y)}
    const Y=g.h-2;for(let y=hi;y<=lo;y++)for(let x=0;x<g.w;x++){const c=at(s,x,y);if(c)putR(g,x,Y-(y-hi),c)}}
  const hash=(a,b,c)=>PX.hash(a,b,c);
  // (one that lies along the ground: its lowest pixel set on the ground row Y)
  function snap(g,Y){let lo=-1;for(let y=g.h-1;y>=0&&lo<0;y--)for(let x=0;x<g.w;x++)if(at(g,x,y)){lo=y;break}const d=Y-lo;if(lo<0||!d)return;
    const p=g.p.slice();g.p.fill(null);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=p[y*g.w+x];if(c)putR(g,x,y+d,c)}}

  /* ---------- the kinds ---------- */
  const KINDS={};
  // a frost wolf: lean and long-legged, a little under a horse's height; grey, pale or dark, a lighter chest and throat
  KINDS.wolf={W:30,H:20,coats:['#8a8e98','#a8a8a4','#6c707c'],
    draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),Lb=R(['#c4c4c0','#d8d4c8','#a8aab0'][v]);
      const S={Y:g.h-2,hip:8,sho:16,back:[8,9],belly:5,ry:3.5,rh:4,rc:4,cx:1,legs:[2,1,1],C,D:R('#4a4a52'),paw:0,pawUp:0,
        head:{x:5,y:10,w:6,h:5,snout:[3,2],sy:1,fang:true,M:Lb,ex:1,
          ear:(g,x,y)=>{put(g,x-1,y-3,C[1]);put(g,x,y-3,C[1]);put(g,x-1,y-4,C[0]);put(g,x+1,y-3,C[2])}},
        tail:(g,x,y,F)=>{const m=mask(),up=F.tail,ty=Math.min(g.h-3,y+5-up*3);m.limb(x+1,y,x-3,y+1-up,3,2).limb(x-3,y+1-up,x-5,ty,2,2);shade(g,m,C);put(g,x-5,ty,Lb[0])},
        marks:(g,b,F,o,P)=>{for(const [x,y] of b.pts())if(x>=P.sho&&y>=P.top[1]+3&&b.has(x,y+1))put(g,x,y,Lb[x>P.sho+1?1:2])},
        collar:(g,P)=>{for(let y=P.top[1];y<=P.top[1]+3;y++)put(g,P.sho+2,y,TEAM[y===P.top[1]?0:1])}};
      return F.dead?quadDead(g,S,o):quad(g,S,F,o)}};
  // a dire boar: heavy and low, a high bristled shoulder, the head carried low, tusks; brown, dark or grizzled
  KINDS.boar={W:30,H:18,coats:['#5e4636','#4e3e38','#6e5a48'],
    gait(a,i){const F=gait(a,i);if(a==='atk'||a==='alt'){F.head=[[-1,1],[3,-1],[2,0]][i];F.paw=0}return F},
    draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),Dk=R('#3a2c28');
      const S={Y:g.h-2,hip:7,sho:16,back:[8,10],belly:4,ry:4,rh:4.5,rc:5,cx:1,hump:[1,4,2.5],legs:[2,1,0],C,D:Dk,paw:0,pawUp:0,
        head:{x:4,y:6,w:6,h:5,snout:[3,3],sy:1,M:R('#8a6a60'),ex:0,ey:-1,eye:'#d8a848',
          ear:(g,x,y)=>{put(g,x-2,y-3,C[2]);put(g,x-1,y-3,C[1]);put(g,x-2,y-4,C[3])},
          more:(g,x,y,F,sx,sy)=>{put(g,sx,sy+2-(F.jaw?0:0),'#e8e0c8');put(g,sx,sy+1,'#f4eedc');put(g,sx-1,sy+3,'#c8bca4')}},
        tail:(g,x,y,F)=>{const m=mask();m.limb(x+1,y,x-1,y+3-F.tail,1,1);flat(g,m,C,2,3);put(g,x-1,y+4-F.tail,Dk[2])},
        // (the bristles: a dark crest along the back, standing up in tufts)
        mane:(g,F,P)=>{for(let x=P.hip-1;x<=P.sho+1;x++){const ty=P.top[0]+Math.round((P.top[1]-P.top[0])*(x-P.hip)/(P.sho-P.hip))-(x>P.sho-4?2:0);put(g,x,ty,Dk[1]);if(x%2===0)put(g,x,ty-1,Dk[2])}},
        collar:(g,P)=>{for(let y=P.top[1];y<=P.top[1]+4;y++)put(g,P.sho+2,y,TEAM[y===P.top[1]?0:1])}};
      return F.dead?quadDead(g,S,o):quad(g,S,F,o)}};
  // a cave bear: bigger than a horse in the body, the shoulder hump, thick pillar legs, a short muzzle; it swipes with a paw
  KINDS.bear={W:32,H:22,coats:['#6a4c36','#58463a','#7a6650'],
    draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),Dk=R('#3a2c26'),M=R(['#9a7a5a','#8a7462','#a89070'][v]);
      const S={Y:g.h-2,hip:7,sho:18,back:[11,12],belly:5,ry:5.5,rh:6,rc:6,cx:1,hump:[2,4,3],legs:[3,3,0],C,D:Dk,paw:1,pawUp:6,claws:1,
        head:{x:5,y:9,w:6,h:5,snout:[3,3],sy:1,M,ex:0,ey:-1,eye:'#c8a040',fang:true,
          ear:(g,x,y)=>{put(g,x-2,y-3,C[1]);put(g,x-1,y-3,C[2]);put(g,x-2,y-4,C[2])}},
        tail:(g,x,y)=>{put(g,x,y+1,C[2]);put(g,x+1,y+1,C[1])},
        collar:(g,P)=>{for(let y=P.top[1]-1;y<=P.top[1]+4;y++)put(g,P.sho+2,y,TEAM[y<P.top[1]+1?0:1])}};
      return F.dead?quadDead(g,S,o):quad(g,S,F,o)}};
  // a tiger: long and low, big paws, the tail long; striped, a pale belly and cheeks; it pounces with a paw
  KINDS.tiger={W:32,H:18,coats:['#c27a3e','#b06a38','#c89058'],
    draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),Lb=R('#e4d8bc'),Dk=R('#3e302e'),st='#3a2c2c';
      const S={Y:g.h-2,hip:9,sho:21,back:[8,9],belly:4,ry:3.5,rh:4.5,rc:4.5,cx:1,legs:[2,2,1],C,L:Lb,lb:0,D:Dk,paw:0,pawUp:4,claws:1,
        head:{x:3,y:9,w:6,h:5,snout:[2,3],sy:1,M:Lb,ex:0,ey:-1,eye:'#d8c048',fang:true,
          ear:(g,x,y)=>{put(g,x-1,y-3,C[1]);put(g,x-2,y-3,C[2])},more:(g,x,y)=>{put(g,x-1,y-2,st);put(g,x,y-2,st);put(g,x-2,y+1,Lb[1]);put(g,x-1,y+1,Lb[1])}},
        tail:(g,x,y,F)=>{const up=F.tail,m=mask(),p=[[x+1,y],[x-3,y+1],[x-5,y+3-up],[x-6,y+1-up*2]];for(let i=0;i<3;i++)m.limb(p[i][0],p[i][1],p[i+1][0],p[i+1][1],2,2);shade(g,m,C);
          for(const [px,py] of m.pts())if((px+py)%4===0)put(g,px,py,st);put(g,p[3][0],p[3][1],st)},
        // (the stripes: dark bars down the back and flanks, where the seed puts them)
        marks:(g,b,F,o,P)=>{for(let k=0;k<6;k++){const x0=P.hip-3+k*3+(hash(o.v,k,7)>.5?1:0),n=2+Math.floor(hash(o.v,k,9)*3);for(let j=0;j<n;j++){const x=x0+(j>1?1:0),y=P.top[0]+(k>3?0:0)+j+(x>P.sho-2?-1:0);if(b.has(x,y)&&y<P.bel-1)put(g,x,y,st)}}},
        collar:(g,P)=>{for(let y=P.top[1];y<=P.top[1]+3;y++)put(g,P.sho+2,y,TEAM[y===P.top[1]?0:1])}};
      return F.dead?quadDead(g,S,o):quad(g,S,F,o)}};
  // a griffin: a lion's hindquarters, an eagle's head, breast, forelegs and wings (folded up its back, spread to run and to strike)
  KINDS.griffin={W:32,H:25,coats:['#b8905a','#c09a5a','#8a7a66'],
    draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),Wc=R(['#8a6a48','#7a5e44','#6a6058'][v]),Wh=R('#e2dacb'),Dk=R('#4a3a30'),Yl=R('#c8a04a');
      const S={Y:g.h-2,hip:8,sho:18,back:[9,11],belly:5,ry:4,rh:4,rc:4.5,cx:1,legs:[2,1,1],fore:[1,1,0],foreC:Yl,C,D:Dk,paw:0,pawUp:4,claws:2,
        tail:(g,x,y,F)=>{const m=mask(),up=F.tail;m.limb(x+1,y,x-3,y+2-up,1,1).limb(x-3,y+2-up,x-4,Math.min(g.h-4,y+5-up*2),1,1);flat(g,m,C,2);put(g,x-4,Math.min(g.h-3,y+6-up*2),Dk[1]);put(g,x-5,Math.min(g.h-3,y+6-up*2),Dk[2])},
        wing:(g,F,P,far)=>wing(g,P.sho-2+(far?2:0),P.top[1]+1-(far?1:0),F.dead?'down':F.wing,[12,11],Wc,{far}),
        neck:(g,F,P,o)=>{const hx=P.sho+(F.dead?6:4)+F.head[0]+P.lx,hy=F.dead?P.Y-3:P.Y-15+P.b+F.head[1],n=mask();n.poly([[P.sho-3,P.top[1]],[hx-2,hy-2],[hx+2,hy+1],[P.sho+3,P.bel]]);shade(g,n,Wh,{cx:P.sho,cy:hy,rx:5,ry:7});
          const hd=mask().ell(hx,hy,2.6,2.4);shade(g,hd,Wh);for(const [x,y] of [[hx-3,hy-2],[hx-4,hy-1],[hx-4,hy-3]])put(g,x,y,Wh[1]);
          const bx=Math.round(hx+2),by=Math.round(hy-1);put(g,bx,by,Yl[0]);put(g,bx+1,by,Yl[1]);put(g,bx+2,by+1,Yl[2]);put(g,bx+1,by+1,Yl[2]);
          if(F.jaw){put(g,bx,by+1,'#3a2430');put(g,bx,by+2,Yl[2]);put(g,bx+1,by+2,Yl[3])}else put(g,bx,by+1,Yl[1]);
          put(g,Math.round(hx),by,F.dead?Wh[3]:'#c88a30');return{hx,hy}},
        collar:(g,P,h)=>{for(let y=Math.round(h.hy)+2;y<=Math.round(h.hy)+4;y++)put(g,Math.round(h.hx)-1+(y-Math.round(h.hy)-2),y,TEAM[1])}};
      return F.dead?quadDead(g,S,o):quad(g,S,F,o)}};

  // a giant spider: wide and low, eight long legs arched over a round body; it rears and strikes, or spits its web
  KINDS.spider={W:32,H:19,coats:['#3e3646','#4a3c32','#3a4238'],
    draw(g,F,o){if(F.dead)return onBack(g,s=>this.body(s,{a:'idle',i:0},o,true));this.body(g,F,o)},
    body(g,F,o,dead){const v=o.v%3,C=R(this.coats[v]),Y=g.h-2,a=F.a,i=F.i,b=a==='walk'||a==='run'?(i%2?-1:0):0,rear=a==='atk'||a==='alt'?[1,3,1][i]:0;
      const cx=19,cy=Y-4+b-rear,ax=10,ay=Y-6+b;
      // (the legs: four a side, far and near, each up to a knee high over the body and down to its foot, the hind two back and the
      // fore two ahead; walking, they lift in turn; rearing, the first pair up)
      const leg=(k,near)=>{const sx=cx-2+k,sy=cy,f=near?0:1,step=a==='walk'||a==='run'?((k+(near?1:0)+i)%2?1:-1)*(a==='run'?2:1):0,lift=step>0?1:0,
          raise=k===3&&rear?rear+2:0,kx=sx+[-6,-3,3,6][k]+f,ky=Y-(near?10:11)-raise+b,fx=sx+[-12,-7,4,7][k]+f+step,fy=Y-lift-raise*2,m=mask();
        m.limb(sx,sy,kx,ky,1,1).limb(kx,ky,fx,fy,1,1);flat(g,m,C,near?1:3,near?2:3);if(near)put(g,kx,ky,C[0])};
      for(let k=0;k<4;k++)leg(k,false);
      const ab=mask().ell(ax,ay,6,4.5),ce=mask().ell(cx,cy,3.5,2.6);shade(g,ab,C);shade(g,ce,C);
      // (its mark: an hourglass in red on the abdomen; its eyes, a cluster at the front; fangs, out when it strikes)
      const mk=['#8a3a44','#a8823a','#7a3a3a'][v];put(g,ax-1,ay-3,mk);put(g,ax,ay-2,mk);put(g,ax-1,ay-1,mk);put(g,ax,ay,mk);put(g,ax-1,ay-2,mk);
      put(g,cx+2,cy-2,'#c8505a');put(g,cx+3,cy-1,'#c8505a');put(g,cx+1,cy-2,'#9a3a44');
      put(g,cx+4,cy+1,C[0]);if(rear){put(g,cx+4,cy+2,'#d8d0bc');put(g,cx+5,cy+1,C[1])}
      for(let k=0;k<4;k++)leg(k,true);
      if(o.team===0){put(g,ax+2,ay-4,TEAM[0]);put(g,ax+3,ay-4,TEAM[1]);put(g,ax+3,ay-3,TEAM[2])}}};
  // a giant scorpion: low and segmented, two claws held out, its tail curled over the back to sting
  KINDS.scorpion={W:30,H:21,coats:['#a87a4a','#8a6a4a','#b4925e'],
    draw(g,F,o){if(F.dead)return onBack(g,s=>this.body(s,{a:'idle',i:0},o));this.body(g,F,o)},
    body(g,F,o){const v=o.v%3,C=R(this.coats[v]),Dk=R('#4a3428'),Y=g.h-2,a=F.a,i=F.i,b=a==='walk'||a==='run'?(i%2?-1:0):0,st=a==='atk'||a==='alt'?i:-1;
      const leg=(k,near)=>{const x=9+k*2.5,step=a==='walk'||a==='run'?((k+i+(near?1:0))%2?1:-1):0,m=mask();m.limb(x,Y-3+b,x+(k<2?-2:1)+step,Y-4+b,1,1).limb(x+(k<2?-2:1)+step,Y-4+b,x+(k<2?-3:2)+step,Y-(step>0?1:0),1,1);flat(g,m,C,near?2:3,3)};
      for(let k=0;k<4;k++)leg(k,false);
      // the tail: five segments from the rump up over the back to the sting; striking, it whips forward over the head
      const T=st<0?[[8,Y-4],[5,Y-8],[6,Y-12],[10,Y-14],[13,Y-12]]:[[[8,Y-4],[4,Y-8],[4,Y-13],[8,Y-16],[11,Y-15]],[[8,Y-4],[6,Y-9],[10,Y-14],[15,Y-14],[19,Y-11]],[[8,Y-4],[5,Y-9],[8,Y-13],[12,Y-14],[16,Y-12]]][st];
      const tp=T.map(([x,y],k)=>[x,y+b,[2.2,2,1.8,1.6,1.2][k]]);const tm=tube(g,tp,C);for(const [x,y] of tm.pts())if((x*3+y*2)%5===0&&tm.has(x,y-1)&&tm.has(x+1,y))put(g,x,y,C[2]);
      const [sx,sy]=T[4];put(g,sx+1,sy+1+b,Dk[1]);put(g,sx+2,sy+2+b,Dk[2]);put(g,sx+1,sy+2+b,Dk[2]);
      const body=mask().ell(13,Y-3.5+b,6.5,2.6).ell(18,Y-4+b,3,2.2);shade(g,body,C);for(let x=9;x<=18;x+=3)for(let y=Y-6+b;y<=Y-2+b;y++)if(body.has(x,y)&&body.has(x,y-1))put(g,x,y,C[2]);
      // the claws: an arm forward to the pincer, its fingers open as it strikes
      const cl=(near)=>{const ox=near?0:-1,oy=near?0:-1,px=24+(st===1?1:0)+ox,py=Y-5+b+oy,m=mask();m.limb(19,Y-4+b+oy,21+ox,Y-6+b+oy,1,1).limb(21+ox,Y-6+b+oy,px-1,py,1,1);flat(g,m,C,near?1:3,near?2:3);
        const p=mask().ell(px+.5,py+.5,1.8,1.4);shade(g,p,C,{dk:near?0:1});put(g,px+2,py-1,C[near?1:3]);put(g,px+3,py-1,C[near?2:3]);put(g,px+2,py+1,C[near?2:3]);if(st===1||st===0)put(g,px+2,py,'#3a2430')};
      cl(false);for(let k=0;k<4;k++)leg(k,true);cl(true);put(g,20,Y-5+b,'#2c2430');
      if(o.team===0){put(g,12,Y-6+b,TEAM[0]);put(g,13,Y-6+b,TEAM[1]);put(g,14,Y-6+b,TEAM[1])}}};
  // a bog slime: a blob that squashes and stretches as it hops; it rears up and spits
  KINDS.slime={W:16,H:16,coats:['#6a9e4a','#5e9a72','#8e9e4a'],
    draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),Y=g.h-2,a=F.a,i=F.i;
      if(F.dead){const m=mask().ell(8,Y-.5,7,1.6);shade(g,m,C);put(g,5,Y-1,C[0]);return}
      const sq=a==='idle'?[0,.5][i]:a==='walk'||a==='run'?[0,-1,.5,-1][i]:[-1.5,1,.5][i],up=a==='run'&&i%2?2:0,rx=5.6+sq*.5,ry=4.5-sq*.7,cx=8+(a==='atk'||a==='alt'?[-.5,.5,0][i]:0);
      const m=mask().ell(cx,Y-ry+.5-up,rx,ry);for(const [x,y] of m.pts())if(y>Y)m.s.delete(K(x,y));if(!up)for(const [x,y] of m.pts())if(y===Y-1)m.add(x,Y);shade(g,m,C);
      // (its shine, its dark heart, its eyes on its front, a mouth open as it spits)
      const tx=Math.round(cx-rx*.45),ty=Math.round(Y-ry*1.6-up);put(g,tx,ty,'#eef4d8');put(g,tx+1,ty,C[0]);put(g,tx,ty+1,C[0]);
      put(g,Math.round(cx-1),Math.round(Y-ry*.6-up),C[2]);put(g,Math.round(cx),Math.round(Y-ry*.6-up),C[2]);
      const ex=Math.round(cx+rx*.35),ey=Math.round(Y-ry*1.1-up);put(g,ex,ey,'#2c2430');put(g,ex+2,ey,'#2c2430');
      if((a==='atk'||a==='alt')&&i===1){put(g,ex+1,ey+2,'#3a2430');put(g,ex+2,ey+2,'#3a2430');put(g,ex+3,ey+1,C[0])}
      if(o.team===0){put(g,Math.round(cx),Math.round(Y-ry*2-up)+1,TEAM[1]);put(g,Math.round(cx)+1,Math.round(Y-ry*2-up)+1,TEAM[2])}}};
  // a troll: twice a man's height, hunched, long-armed, a small head thrust forward with a big nose and tusks; a club it slams down
  KINDS.troll={W:32,H:32,coats:['#6c7c5e','#6e7066','#5e7268'],
    draw(g,F,o){if(F.dead){const s=grid(g.w,g.h);this.body(s,{a:'idle',i:0,dead:true},o);const r=turn(s);let lo=0,x0=1e9,x1=-1;for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)if(at(r,x,y)){lo=Math.max(lo,y);x0=Math.min(x0,x);x1=Math.max(x1,x)}
        for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++){const c=at(r,x,y);if(c)putR(g,x-x0+PAD+((this.W-(x1-x0+1))>>1),y+(g.h-2-lo),c)}snap(g,g.h-2);return}this.body(g,F,o)},
    body(g,F,o){const v=o.v%3,C=R(this.coats[v]),Lc=R('#6a4e36'),Wd=R('#7a5a3a'),Y=g.h-2,a=F.a,i=F.i,mv=a==='walk'||a==='run',b=mv&&i%2?-1:0,
        st=a==='atk'||a==='alt'?i:-1,sw=mv?[2,0,-2,0][i]*(a==='run'?1.5:1):0;
      const hipY=Y-9+b,shY=Y-19+b;
      // legs (the far darker), short and thick, feet wide; the far arm hanging, swinging as he walks
      const legm=(x,dx,near)=>{const m=mask();m.limb(x,hipY,x+dx,Y-2,4,3);m.rect(Math.round(x+dx)-1,Y-1,5,2);shade(g,m,C,{dk:near?0:1,noTop:true});for(let k=0;k<5;k++)put(g,Math.round(x+dx)-1+k,Y,C[3])};
      legm(9,-sw,false);
      const fa=mask();fa.limb(12,shY+1,10-sw,Y-12+b,3,3).limb(10-sw,Y-12+b,11-sw,Y-7+b,3,2);shade(g,fa,C,{dk:1});
      // the body: a great hunched trunk, its belly lighter, a hide about the loins
      const bd=mask().ell(13,Y-14+b,6.5,6.5).ell(15,shY+.5,6,4);shade(g,bd,C,{cx:13,cy:Y-17+b,rx:8,ry:9});
      for(const [x,y] of bd.pts())if(x>14&&y>Y-15+b&&y<hipY&&bd.has(x+1,y))put(g,x,y,C[x>17?2:1]);
      for(let x=7;x<=19;x++)for(let y=hipY-1;y<=hipY+1;y++)if(bd.has(x,y)||y===hipY+1)put(g,x,y,Lc[y===hipY-1?0:y===hipY+1?2:1]);for(let y=hipY+2;y<=hipY+4;y++){put(g,16,y,Lc[2]);put(g,17,y,Lc[1])}
      legm(16,sw,true);
      // the head: low and forward of the shoulders; a brow, small eyes, a big nose, a tusk, a pointed ear, a tuft of hair
      const hx=21+(st===1?1:0),hy=Y-20+b+(st===1?1:st===0?-1:0),hd=mask().ell(hx,hy,3.6,3.4);shade(g,hd,C);
      put(g,hx+3,hy,C[1]);put(g,hx+4,hy,C[1]);put(g,hx+4,hy+1,C[2]);put(g,hx+3,hy+1,C[2]);put(g,hx+1,hy-2,C[2]);put(g,hx+2,hy-2,C[2]);
      put(g,hx+1,hy-1,F.dead?C[3]:'#e0c050');put(g,hx+2,hy+2,'#3a2430');put(g,hx+3,hy+2,'#3a2430');put(g,hx+2,hy+1,'#ece4cc');
      put(g,hx-3,hy-2,C[1]);put(g,hx-4,hy-3,C[2]);put(g,hx-1,hy-4,'#3e3a36');put(g,hx,hy-4,'#4e4a44');put(g,hx-2,hy-3,'#3e3a36');
      // the near arm and the club: hanging at rest, raised behind him, then slammed down in front
      const arm=[[[19,Y-12],[21,Y-8],[26,Y-3]],[[19,Y-12],[21,Y-8],[26,Y-3]],[[15,Y-23],[13,Y-25],[8,Y-26]],[[22,Y-15],[24,Y-13],[29,Y-4]],[[21,Y-12],[23,Y-9],[28,Y-1]]][st<0?(mv?0:1):2+st];
      const [el,hn,ce]=arm.map(([x,y])=>[x+(st<0?sw*.5:0),y+b]),am=mask();am.limb(16,shY+1,el[0],el[1],3,3).limb(el[0],el[1],hn[0],hn[1],3,2);
      const club=mask();club.limb(hn[0],hn[1],ce[0],ce[1],1,3);shade(g,club,Wd);put(g,ce[0],ce[1],Wd[0]);
      shade(g,am,C);put(g,hn[0],hn[1],C[2]);
      if(o.team===0){put(g,el[0],el[1]-1,TEAM[0]);put(g,el[0]+1,el[1]-1,TEAM[1]);put(g,el[0],el[1],TEAM[1]);put(g,el[0]+1,el[1],TEAM[2])}}};
  // a sand wyrm: a great serpent risen out of its coils, its neck reared, a frilled head; it strikes down with its jaws
  KINDS.wyrm={W:32,H:32,coats:['#a8804e','#9a7650','#b08c5e'],
    draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),Lb=R('#d8c08a'),Dk=R('#4e3a2a'),Y=g.h-2,a=F.a,i=F.i,dead=!!F.dead,mv=a==='walk'||a==='run';
      const w=mv?(a==='run'?2:1)*(i%2?1:-1):0,sw=a==='idle'&&i?1:0,st=a==='atk'||a==='alt'?i:-1;
      const hd=dead?[26,Y-2]:st<0?[23,Y-23+sw]:[[19,Y-25],[26,Y-13],[25,Y-17]][st],nk=dead?[19,Y-3]:st<0?[18,Y-17+sw]:[[15,Y-17],[21,Y-14],[20,Y-15]][st];
      const P=[[2,Y-1,.8],[6,Y-2+w,1.8],[11,Y-3-w,3],[16,Y-4+w,4],[20,Y-6,4.4],[nk[0],nk[1],3.8],[hd[0]-3,hd[1]+1,3]];
      if(dead)P.splice(4,1,[20,Y-3,3.4]);
      const tm=tube(g,P,C,{L:Lb,belly:[1,1]});for(const [x,y] of tm.pts())if((x+2*y)%4===0&&tm.has(x+1,y)&&tm.has(x,y-1)&&at(g,x+OX,y)!==Lb[1]&&at(g,x+OX,y)!==Lb[2])put(g,x,y,C[2]);
      // (spines down its back: dark, on the side away from the light)
      for(let k=2;k<P.length-1;k++){const [x,y,r]=P[k];put(g,x-Math.round(r*.5),y-Math.round(r)-1,Dk[1]);if(k>3)put(g,x-Math.round(r)-1,y-Math.round(r*.5),Dk[2])}
      const [hx,hy]=hd,hm=mask().ell(hx-1,hy,4.2,3).rect(hx,hy-1,5,3);shade(g,hm,C);
      const jaw=st===1?2:st===2?1:0;if(jaw){for(let x=hx;x<hx+4;x++){put(g,x,hy+1,'#3a2430');if(jaw>1)put(g,x,hy+2,'#6a3038')}for(let x=hx-1;x<hx+3;x++)put(g,x,hy+1+jaw,Lb[2]);put(g,hx+3,hy+1,'#efe8d8');put(g,hx+1,hy+jaw,'#efe8d8')}
      put(g,hx+3,hy-1,Dk[2]);put(g,hx,hy-1,dead?C[3]:'#e06048');
      // (its frill: three spines fanned behind the head)
      for(const [dx,dy] of [[-5,-2],[-6,-1],[-5,-3],[-4,-4],[-6,-3],[-3,-5]])put(g,hx+dx,hy+dy,Dk[dy<-2?2:1]);
      if(o.team===0)for(let k=-1;k<=1;k++){put(g,nk[0]+k,nk[1]-1,TEAM[k?1:0]);put(g,nk[0]+k,nk[1],TEAM[2])}
      snap(g,Y)}};

  // the dragon: a great four-legged drake, a long neck and tail, horns, its wings raised over its back; it bites, and lowers its
  // head to breathe fire. D: its sizes (the battle's in a 64 cell; the map's, flying, in a 32)
  const DRAGON={big:{W:64,H:60,hip:20,sho:37,back:[19,21],belly:10,ry:8,rh:8.5,rc:9,legs:[5,4,2],k:2,neck:[6,4.5],hd:[13,34],hw:10,hh:7,sn:[6,4],ws:[30,34],tl:[[-7,-6],[-12,-3],[-15,-5]],tw:[5,3.5,2,1]},
    small:{W:32,H:30,hip:11,sho:19,back:[9,10],belly:5,ry:3.6,rh:4,rc:4.2,legs:[2,2,1],k:1,neck:[3,2],hd:[6,15],hw:5,hh:4,sn:[3,2],ws:[15,14],tl:[[-4,-3],[-6,-2],[-7,-3]],tw:[3,2,1.2,.8]}};
  function dragon(g,F,o,D){const v=o.v%3,C=R(['#9a3e36','#86363e','#a04e30'][v]),Lb=R('#d4b07a'),Mb=R(['#5e2a30','#4e2834','#6a3428'][v]),Dk=R('#3a2a2a'),k=D.k,bone='#e4dcc4';
    const breath=F.a==='alt',fly=o.fly;
    const S={Y:g.h-2,hip:D.hip,sho:D.sho,back:D.back,belly:D.belly,ry:D.ry,rh:D.rh,rc:D.rc,cx:1,legs:D.legs,C,L:Lb,lb:k-1,D:Dk,paw:0,pawUp:0,claws:2};
    if(fly){F={...F,legs:[[-2*k,2*k],[-k,2*k],[-2*k,2*k],[-k,2*k]],bob:-k}}
    S.tail=(g,x,y,F,P)=>{const up=F.tail*k,T=[[x+2,y+1,D.tw[0]],...D.tl.map(([dx,dy],j)=>[x+dx,P.Y+dy-up*(j+1)*.5+(F.dead?3:0),D.tw[j+1]])];tube(g,T,C,{L:Lb,belly:[0,1]});
      const [tx,ty]=T[T.length-1];for(const [dx,dy] of [[-1,0],[-1,-1],[-1,1]])put(g,tx+dx,ty+dy,Dk[1])};
    S.wing=(g,F,P,far)=>{const mode=F.dead?'down':fly?(F.i%2?'mid':'up'):breath?['up','mid','mid'][F.i]:F.wing;wing(g,P.sho-3*k+(far?3*k:0),P.top[1]+k-(far?2*k:0),mode,D.ws,C,{far,membrane:Mb,claw:bone})};
    S.marks=(g,b,F,o,P)=>{for(let x=P.hip-3*k;x<=P.sho;x+=2*k){const ty=P.top[0]+Math.round((P.top[1]-P.top[0])*(x-P.hip)/(P.sho-P.hip))-1;put(g,x,ty,Dk[1]);if(k>1){put(g,x+1,ty,Dk[2]);put(g,x,ty-1,Dk[2])}}};
    S.neck=(g,F,P)=>{const hh=F.dead?[P.sho+D.hd[0]+2*k,P.Y-D.hh/2-1]:breath?[[P.sho+D.hd[0]-3*k,P.Y-D.hd[1]-3*k],[P.sho+D.hd[0]-k,P.Y-7*k],[P.sho+D.hd[0]-k,P.Y-8*k]][F.i]:[P.sho+D.hd[0]+Math.min(1,F.head[0])*k,P.Y-D.hd[1]+F.head[1]*k+P.b];
      const [hx,hy]=hh,mid=F.dead?[P.sho+(hx-P.sho)*.5,P.Y-4*k]:breath&&F.i?[P.sho+5*k,P.top[1]-k]:[P.sho+3*k,Math.min(P.top[1]-5*k,hy+4*k)];
      tube(g,[[P.sho-k,P.top[1]+3*k,D.neck[0]],[mid[0],mid[1],(D.neck[0]+D.neck[1])/2],[hx-D.hw/2+1,hy,D.neck[1]]],C,{L:Lb,belly:[1,1]});
      for(let j=0;j<=4;j++){const t=j/5,x=P.sho+(mid[0]-P.sho)*t*2-(t>.5?0:0),y=P.top[1]+(mid[1]-P.top[1])*Math.min(1,t*2);if(j<3)put(g,x-D.neck[0]*.3,y-D.neck[0]+1,Dk[1])}
      const hb=mask();hb.limb(hx-D.hw/4,hy-D.hh/2+1,hx-D.hw/2-3*k,hy-D.hh/2-2*k,k+1,1);if(k>1)hb.limb(hx-D.hw/2+1,hy-1,hx-D.hw/2-4*k,hy-k,2,1);flat(g,hb,R('#d8ccb0'),1,2);
      const [sl,sd]=D.sn,jaw=F.dead?0:breath?[0,2*k,2*k][F.i]:F.jaw*k,hm=mask().ell(hx,hy,D.hw/2,D.hh/2),sm=mask().rect(Math.round(hx+D.hw/2-2),Math.round(hy-sd/2+k*.5),sl,sd);shade(g,hm,C);shade(g,sm,C,{cx:hx,cy:hy-1,rx:D.hw/2+sl,ry:D.hh/2+1});
      const sx=Math.round(hx+D.hw/2-2),my=Math.round(hy+sd/2+k*.5);
      if(jaw){for(let j=0;j<jaw;j++)for(let x=sx;x<sx+sl-(j?1:0);x++)put(g,x,my+j,j?'#6a3038':'#3a2430');for(let x=sx-k;x<sx+sl-1;x++)put(g,x,my+jaw,Lb[2]);for(let x=sx;x<sx+sl;x+=2)put(g,x,my,bone);
        // (fire in its throat as it breathes)
        if(breath&&F.i>0){const fx=sx+sl,fy=my+(jaw>>1);for(let j=0;j<Math.min((F.i===1?4:2)*k,D.W-3-fx);j++){put(g,fx+j,fy,j<2?'#ffe8a0':'#f0a040');if(j>1)put(g,fx+j,fy-1+(j%2),'#e86a30')}}}
      put(g,sx+sl-1,Math.round(hy-sd/2+k*.5),Dk[3]);
      // (horns swept back, a brow, a burning eye)
      put(g,Math.round(hx+k),Math.round(hy-1),F.dead?C[3]:'#f0d048');if(k>1){put(g,Math.round(hx+k+1),Math.round(hy-1),F.dead?C[3]:'#e8a030');put(g,Math.round(hx+k-1),Math.round(hy-2),C[3]);put(g,Math.round(hx+k),Math.round(hy-2),C[3])}
      return{hx,hy}};
    S.collar=(g,P)=>{for(let y=P.top[1]+k;y<=P.bel;y++)for(let j=0;j<k;j++)put(g,P.sho-2*k+j,y,TEAM[y===P.top[1]+k?0:1+(j>0?1:0)])};
    return F.dead?quadDead(g,S,o):quad(g,S,F,o)}
  KINDS.dragon={W:64,H:60,alt:true,draw(g,F,o){return dragon(g,F,o,DRAGON.big)}};
  const DRAKE={W:32,H:30,draw(g,F,o){return dragon(g,F,o,DRAGON.small)}};

  /* ---------- the figure ---------- */
  const fhOf={};
  PX.BEAST_KINDS=Object.keys(KINDS);
  // (drawn with room round it (PAD), outlined, then cut to the kind's canvas: K.W x K.H, its x shifted by K.dx; PX._beastFit says
  // how much room each kind's poses take)
  const PAD=16;
  function raw(K,o,fly){const pose=o.pose||0,[a,i]=act(pose),g=grid(K.W+2*PAD,K.H+PAD),v=(o.v||0)>>>0;
    const F=a==='dead'?{a,i,dead:true}:(K.gait||gait)(a==='alt'&&!K.alt?'atk':a,i);if(a==='alt'&&K.alt)F.a='alt';
    OX=PAD+(K.dx||0);try{K.draw(g,F,{v,team:o.team,fly})}finally{OX=0}
    // (nothing below the ground: the bottom row is the outline's)
    g.p.fill(null,(g.h-1)*g.w);outline(g);return g}
  function figure(K,kind,o,fly){const r=raw(K,o,fly),g=grid(K.W,K.H);for(let y=0;y<K.H;y++)for(let x=0;x<K.W;x++)g.p[y*K.W+x]=r.p[(y+PAD)*r.w+x+PAD];return g}
  PX._beastFit=kind=>{const K=kind==='drake'?DRAKE:KINDS[kind];let a=1e9,b=1e9,c=-1e9,pa,pb,pc;for(const pose of kind==='drake'?[15,16]:[...PX.BEAST_POSES,DEAD])for(const v of [0,1,2])for(const team of [0,1]){const r=raw(K,{pose,v,team},kind==='drake');
    for(let y=0;y<r.h;y++)for(let x=0;x<r.w;x++)if(r.p[y*r.w+x]){if(x-PAD<a)a=x-PAD,pa=pose;if(x-PAD>c)c=x-PAD,pc=pose;if(y-PAD<b)b=y-PAD,pb=pose}}return{kind,W:K.W,H:K.H,left:a+'@'+pa,right:c+'@'+pc,top:b+'@'+pb,ok:a>=0&&c<K.W&&b>=0}};
  PX.beast=(kind,o)=>{o=o||{};const K=KINDS[kind];if(!K)return null;const c=canvas(figure(K,kind,o));
    if(fhOf[kind]==null){const g0=figure(K,kind,{v:0,team:1,pose:0});let t=g0.h;for(let y=0;y<g0.h&&t===g0.h;y++)for(let x=0;x<g0.w;x++)if(at(g0,x,y)){t=y;break}fhOf[kind]=g0.h-t}
    c.fh=fhOf[kind];c.kind=kind;return c};
  // the world map: the dragon on the wing (its own small figure: wings up, then level), the rest walking
  PX.beastMap=(kind,f)=>{f=f||0;if(kind!=='dragon')return PX.beast(kind,{pose:2+(f%4),team:1});const c=canvas(figure(DRAKE,'drake',{pose:15+(f%2),team:1},true));c.fh=c.height;c.kind='drake';return c};
  PX._beastKit={grid,put,at,mask,shade,flat,outline,canvas,R,gait,quad,quadDead,tube,wing,turn,TEAM,KINDS};
})(window.PX=window.PX||{});
