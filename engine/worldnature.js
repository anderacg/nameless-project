'use strict';
/* ---------- PX engine: the world map's nature (trees, woods, hills, mountain ranges, small things) ---------- */
// The world map's natural art in the engine's style, on 16-px tiles: hue-shifted 4-tone ramps (highlights warm, shadows cool),
// lit from the upper left (a broad lit side, a narrow shade on the right and below), a dark navy outline (#1a1c26) round
// silhouettes only, a ground shadow to the lower right. Sprites sit in power-of-two boxes (8, 16, 32, 64; the drawn pixels may be
// smaller), their foot on (ax, ay). Variety comes from structure (species, shapes; seeded), never Math.random.
// PX.worldTree(clim,sp,v,dim): a tree in a 16 box (PX.WORLD_SPECIES: grass oak, birch, pine; frost snowy pine, fir; swamp willow,
//   dead, mossy oak; desert palm, by an oasis), v 0-3 its shape, dim 1 one deep in a wood (darker and cooler).
// PX.worldPeak(clim,v,n): a mountain alone in an n box (16 a crag or spire, 32 and 64 a massif), v 0-5: drawn as the ranges are.
// PX.worldRange(o): mountain ranges as the battle's (ground.js rockMasses): each mass of rock tiles a height field (fluted cones on
//   some of its tiles, as high as the tile lies deep in the range, over a lower body, steep at its edge; sandstone buttes in the
//   desert; a spire if it is one or two tiles), drawn front to back a column at a time, each ground point (x, y) at height z at
//   (x, y-z), so the peaks rise up the screen over what lies behind; half-Lambert lit from the left, darker toward the foot, its
//   own shadow and one cast on the ground to the lower right; granite with tufts and lichen, snow above a ragged line (the frost,
//   and the high peaks elsewhere), strata of ochre and red (desert), moss (swamp); a navy outline round the silhouette and a deep
//   contour along each crest standing before the rock behind. Never over kept-clear ground: a peak is lowered rather than rise
//   over a road or water behind it.
// PX.worldHill(clim,v,opts): a rise, a height bump in a 32 box: hills add their bumps up (two near merge into a ridge) and are shaded as one ground (soft edges,
//   lit upper-left slopes, cool shade, a soft shadow to the lower right), tufts, strata, snow or moss by climate. opts.edge is kept
//   for cliffs (a later feature: the sides a face would drop on, E 1, S 2, W 4, N 8, as ground.js's wall); today nothing reads it.
// PX.worldDecor(clim,kind,v): the small things (PX.WORLD_DECOR: each climate's), in 8 or 16 boxes; the flat ones (flowers, tufts,
//   drifts, ripples, reeds, moss, pools, bones, mushrooms, oasis green, pads, floes) lie on the ground, unoutlined, shadowless.
// Every sprite is a canvas with ax, ay (its foot), box (its drawn pixels), flat, and for the painter a (a byte a pixel: 1 body,
//   2 outline), rgb, sh (its shadow: offsets from the foot).
// PX.worldNature(spec): all of it over a painted map, in depth order. spec: {D (the map's RGBA pixels), W, H (px), C, R (tiles of
//   ts px, 16), kind (a byte a tile: PX.WN_KIND, the game's own codes), clim (a byte a tile: 0 grass, 1 frost, 2 desert, 3 swamp),
//   clear (a byte a pixel, 1 where nothing may stand: roads, holdings, estates), seed, touch (optional: a byte a pixel, set to 1
//   where nature drew on land, 2 where it drew on water)}. Woods darken their floor and stand as one mass (outlined round its edge
//   only, deeper trees dimmer); hills shade the ground; ranges rise; small things lie and stand on the open; palms by desert water.
//   Nothing on clear ground, a beach (3 px of land along water) or water (but pads and floes on water). Returns its counts and
//   timings. Same spec, same picture.
(function(PX){
  const CLIMS=['grass','frost','desert','swamp'],NAVY='#1a1c26';
  PX.WN_KIND={open:0,forest:1,hill:2,water:3,road:4,mount:5};
  const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  const RP=c=>(PX.GROUND_PAL[c]||PX.GROUND_PAL.grass);
  const mixA=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

  /* palettes: leaf ramps light (warm) to deep (cool) by species; trunk lit, mid, shade; snow lit, mid, shade (blue); a deep tree's
     tones darker, its highlight softened, mixed toward DIM. Hills: lit and shade the ground leans toward (k: how far a step);
     floor a wood's ground; tuft colours; bush the climate's bush */
  const LEAF={oak:['#9cb058','#6a9242','#426c3a','#28463a'],moak:['#94a058','#687a3e','#465a34','#2a3a30'],birch:['#c4c468','#96aa4c','#668840','#3e5c3a'],
    pine:['#78a05e','#4c7c4a','#305c44','#1e3a38'],spine:['#6a8c74','#46705e','#2e5048','#1c3438'],fir:['#628472','#3e665a','#2a4a46','#1c3036'],
    willow:['#a0a660','#748840','#506636','#30402e'],palm:['#bcc65e','#88a444','#5a7c38','#34522e'],dead:['#8a9a4a','#5e6e34','#3e4a2c','#2a3226']};
  const TRUNK={def:['#8e6a48','#624830','#3e3028'],birch:['#eee8d8','#c4beae','#8a8478'],dead:['#9a8a70','#6c5e4c','#463c36'],palm:['#c4a06a','#94744a','#62503a']};
  const SNOW=['#fbfcff','#dce4f0','#aebcd2'],DIM='#1c2836';
  PX.WORLD_SPECIES={grass:['oak','birch','pine'],frost:['spine','fir'],swamp:['willow','dead','moak'],desert:['palm']};
  PX.WORLD_NATURE={
    grass:{hill:{lit:'#c8cc78',shade:'#284638',k:[.14,.15]},floor:'#2c4426',tuft:['#a2c062','#5e8c3a','#3e6a2e'],bush:'oak'},
    frost:{hill:{lit:'#ffffff',shade:'#8a98b8',k:[.22,.12]},floor:'#a6b2c4',tuft:['#d8c890','#ac9c6c','#857650'],bush:'spine'},
    desert:{hill:{lit:'#fae4aa',shade:'#a06a48',k:[.2,.16]},floor:'#a89656',tuft:['#c8b46a','#9a9450','#72703e'],bush:'scrub',green:['#a4b456','#7a9440','#56703a']},
    swamp:{hill:{lit:'#9a9e5c',shade:'#18241c',k:[.14,.15]},floor:'#232c1c',tuft:['#8a8e4c','#5e6a36','#3e4a26'],bush:'willow'}};
  PX.WORLD_DECOR={grass:['tuft','flowers','bush','stone'],frost:['drift','stone','shrub','bush'],desert:['ripple','cactus','stone','rock','bones','scrub','oasis'],
    swamp:['pool','reeds','moss','mushroom','stump','bush'],water:['pad','floe']};
  const FLAT={tuft:1,flowers:1,drift:1,ripple:1,reeds:1,moss:1,pool:1,bones:1,mushroom:1,oasis:1,pad:1,floe:1};
  const NV=hx(NAVY);

  /* sprites. finish: body pixels (a 1) and outline (a 2) to the sprite, its shadow the silhouette laid on the ground to the lower
     right (a pixel at height z falls z/2 right and z/5 up of the foot). build: a tone map M (N×N, 0 empty, else an index into col)
     to the body (never on the box's top row or side columns, which the outline needs), then unless flat its outline in navy on
     every empty pixel beside the body */
  function finish(N,a,rgb,ax,ay,flat){const sh=[],seen=new Set();
    if(!flat)for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(a[y*N+x]===1){const z=ay-y,sx=x-ax+1+Math.round(z*.5),sy=Math.min(1,-Math.round(z*.2)+(z<2?1:0)),k=sx*4096+sy;if(!seen.has(k)){seen.add(k);sh.push(sx,sy)}}
    const cv=PX.canvas(N,N,g=>{const im=g.createImageData(N,N),d=im.data;for(let i=0;i<N*N;i++)if(a[i]){d[i*4]=rgb[i*3];d[i*4+1]=rgb[i*3+1];d[i*4+2]=rgb[i*3+2];d[i*4+3]=255}g.putImageData(im,0,0)});
    let x0=N,y0=N,x1=-1,y1=-1;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(a[y*N+x]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    return Object.assign(cv,{ax,ay,flat:!!flat,box:[x0,y0,x1,y1],a,rgb,sh:Int16Array.from(sh)})}
  function build(N,M,col,ax,ay,flat){const a=new Uint8Array(N*N),rgb=new Uint8Array(N*N*3),C=col.map(c=>c?hx(c):null);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,t=M[i];if(!t||!C[t]||(!flat&&(x===0||x===N-1||y===0)))continue;a[i]=1;rgb.set(C[t],i*3)}
    if(!flat)ring(N,a,rgb);return finish(N,a,rgb,ax,ay,flat)}
  // (an empty pixel the body closes round is part of the body, in the colour beside it; an outline pixel shut inside likewise:
  //  the outline lies round the silhouette only)
  const seal=(N,a,rgb)=>{const out=new Uint8Array(N*N),st=[];for(let i=0;i<N*N;i++){const x=i%N,y=(i/N)|0;if(a[i]!==1&&(x===0||y===0||x===N-1||y===N-1)){out[i]=1;st.push(i)}}
    while(st.length){const i=st.pop(),x=i%N,y=(i/N)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=x+dx,v=y+dy,j=v*N+u;if(u>=0&&v>=0&&u<N&&v<N&&!out[j]&&a[j]!==1){out[j]=1;st.push(j)}}}
    for(let i=0;i<N*N;i++)if(a[i]!==1&&!out[i]){const x=i%N,y=(i/N)|0,j=[[1,0],[0,1],[-1,0],[0,-1]].map(([dx,dy])=>(y+dy)*N+x+dx).find(j=>j>=0&&j<N*N&&a[j]===1);if(j==null)continue;a[i]=1;rgb[i*3]=rgb[j*3];rgb[i*3+1]=rgb[j*3+1];rgb[i*3+2]=rgb[j*3+2]}};
  const ring=(N,a,rgb)=>{seal(N,a,rgb);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(a[i])continue;if((x>0&&a[i-1]===1)||(x<N-1&&a[i+1]===1)||(y>0&&a[i-N]===1)||(y<N-1&&a[i+N]===1)){a[i]=2;rgb.set(NV,i*3)}}};
  const CACHE={};
  PX.worldNatureReset=()=>{for(const k in CACHE)delete CACHE[k]};// (the tests: draw them afresh)
  // leaf clumps [x,y,r], back to front (a pixel takes the last it lies in), each lit from its own upper left and the crown's (cx,cy,
  // cr) a little, dappled: tones 1-4, light to deep; the underside of the crown a tone deeper
  function clumps(M,N,Cl,cx,cy,cr,s){for(let y=0;y<N;y++)for(let x=0;x<N;x++){let c=null;for(const q of Cl)if((x+.5-q[0])**2+(y+.5-q[1])**2<=q[2]*q[2])c=q;if(!c)continue;
    const lit=((c[0]-x-.5)*.75+(c[1]-y-.5))/c[2]*.8+((cx-x-.5)*.5+(cy-y-.5)*.8)/cr*.55+(PX.hash(x,y,s)-.5)*.42;M[y*N+x]=lit>.5?1:lit>-.18?2:lit>-.75?3:4}
    for(let y=0;y<N-1;y++)for(let x=0;x<N;x++){const t=M[y*N+x];if(t>=1&&t<=4&&!(M[(y+1)*N+x]>=1&&M[(y+1)*N+x]<=4))M[y*N+x]=Math.max(t,3)}}
  // a trunk two pixels wide, lit left; dark where the crown hangs over it; a root each side of the foot
  function trunk(M,N,x0,y0,y1){for(let y=y0;y<=y1;y++){M[y*N+x0]=5;M[y*N+x0+1]=7}M[y1*N+x0-1]=6;M[y1*N+x0+2]=7}
  const shadeTrunk=(M,N)=>{for(let y=1;y<N;y++)for(let x=0;x<N;x++){const t=M[y*N+x];if((t===5||t===6)&&M[(y-1)*N+x]>=1&&M[(y-1)*N+x]<=4)M[y*N+x]=7;if(t===5&&y>1&&M[(y-2)*N+x]>=1&&M[(y-2)*N+x]<=4)M[y*N+x]=6}};
  // a conifer's tiers: from top to bot, each tier rows tall, half-width up to wmax; lit left, its right edge deep, each tier's lowest
  // row in its own shade; snow on each tier's top and its lit side
  function cone(M,N,top,bot,wmax,tier,o,s,snow){for(let y=top;y<=bot;y++){const k=(y-top)%tier,w=Math.min(wmax,.7+(y-top)*.5+o)-(k===tier-1&&y<bot?.9:0)-(k===0&&y>top?.5:0);
    for(let x=1;x<N-1;x++){const d=x+.5-8;if(Math.abs(d)>w)continue;const e=Math.abs(d)>w-1.1,n=PX.hash(x,y,s);let t=d<-w*.25?1:d<w*.35?2:3;if(e)t=d>0?4:2;if(k===tier-1)t=Math.min(4,t+1);if(n<.12)t=Math.min(4,t+1);
      if(t===1&&k>tier-3&&n>.6)t=2;M[y*N+x]=t;if(snow&&(k===0&&n>.15||k===1&&d<0&&n>.4||d<-w+1.5&&k<tier-1&&n>.35))M[y*N+x]=d<-.5?8:d<1.5?9:10}}}
  function line(M,N,x0,y0,x1,y1,t){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;for(let i=0;i<=n;i++){const x=Math.round(x0+(x1-x0)*i/n),y=Math.round(y0+(y1-y0)*i/n);if(x>0&&y>0&&x<N-1&&y<N)M[y*N+x]=typeof t==='function'?t(i,n):t}}

  /* the trees: 16×16, the foot at (8,15) (a palm's where its trunk stands). col: 1-4 leaf, 5-7 trunk (lit, mid, shade), 8-10 snow,
     11 a bark mark, 12-13 moss */
  PX.worldTree=(clim,sp,v,dim)=>{clim=PX.WORLD_NATURE[clim]?clim:'grass';sp=LEAF[sp]?sp:'oak';v=((v|0)%4+4)%4;dim=dim?1:0;const key='t'+clim+sp+v+dim;if(CACHE[key])return CACHE[key];
    const N=16,M=new Uint8Array(N*N),s=v*31+sp.length*7+3,L=LEAF[sp],TR=TRUNK[sp]||TRUNK.def;
    if(sp==='oak'||sp==='moak'){const CL=[[[8,7.6,4.6],[4.8,8.8,3.2],[11.4,8.6,3.2],[8.2,4.4,3.4]],[[8,7.6,3.8],[5.6,9.4,2.7],[10.6,9.2,2.9],[7.4,5.4,3],[8.6,3.2,2.8]],
        [[8,8.2,4.2],[3.8,9.2,3.2],[12.2,8.8,3.2],[6,5.6,3.1],[10.2,5.2,3.2]],[[7.4,8,4.4],[4.2,9.4,3],[11,9.6,2.8],[9.4,4.4,3.6]]][v];
      trunk(M,N,7,v===1?11:10,15);clumps(M,N,CL,6.5,4.5,6,s)}
    else if(sp==='birch'){const o=[0,1,-1,0][v],h=[0,1,0,2][v];for(let y=4+h;y<=15;y++){M[y*N+7]=5;M[y*N+8]=6;if((y*3+v)%4===0)M[y*N+7+(y&1)]=11}M[15*N+6]=6;
      clumps(M,N,[[8+o*.5,5.4+h,2.7],[5.8,8+h*.5,2.5],[10.4+o*.4,7.4+h*.5,2.5],[8+o*.6,3+h,2.3],[6.2,10.6,2],[10,10.2,1.9]].slice(0,v===2?5:6),7,4,5,s)}
    else if(sp==='pine'){trunk(M,N,7,12,15);cone(M,N,[1,2,1,3][v],12,[5,4.4,5.4,4.8][v],[4,3,4,3][v],[.2,0,.4,.1][v],s,false)}
    else if(sp==='spine'){trunk(M,N,7,12,15);cone(M,N,[1,2,1,2][v],12,[5.2,4.6,5.6,5][v],[4,3,4,3][v],[.2,0,.4,.2][v],s,true)}
    else if(sp==='fir'){trunk(M,N,7,13,15);cone(M,N,1,13,[3.8,3.4,4.2,3.6][v],[3,3,4,3][v],[0,0,.1,.2][v],s,true)}
    else if(sp==='willow'){trunk(M,N,7,10,15);const o=[0,1,-1,0][v];clumps(M,N,[[8,6.8,4.3],[4.4+o*.3,7.8,3],[11.6+o*.3,7.6,3],[8+o*.5,4,3.2]],6.5,4,6,s);
      for(let x=2;x<N-2;x++){if(PX.hash(x,v,s+2)<.4)continue;let y0=-1;for(let y=N-1;y>=0;y--)if(M[y*N+x]>=1&&M[y*N+x]<=4){y0=y;break}if(y0<0)continue;const n=2+Math.floor(PX.hash(x,v,s+3)*3);for(let k=1;k<=n&&y0+k<N;k++)M[(y0+k)*N+x]=k===n?4:3}}
    else if(sp==='dead'){const lean=[-.1,.12,0,.07][v],tx=y=>7+Math.round((15-y)*lean);for(let y=[3,4,2,5][v];y<=15;y++){M[y*N+tx(y)]=5;M[y*N+tx(y)+1]=7}M[15*N+6]=6;M[15*N+9]=7;
      const BR=[[[9,-5,-4],[6,4,-4],[11,4,-3]],[[8,-4,-5],[10,5,-3],[5,-2,-3]],[[9,-5,-3],[7,5,-4],[12,-3,-2],[4,2,-2]],[[10,-4,-4],[8,4,-5]]][v];
      for(const [y0,dx,dy] of BR){const x0=tx(y0)+(dx>0?1:0),x1=x0+dx,y1=y0+dy;line(M,N,x0,y0,x1,y1,(i,n)=>i>n*.5?6:dx<0?5:7);if(PX.hash(x1,y1,s)>.35&&x1>0&&x1<N-1&&y1>0){M[y1*N+x1]=12;if(y1+1<N)M[(y1+1)*N+x1]=13}}}
    else{const b=v%2?-1:1,tx=y=>8+Math.round(b*(15-y)**2/[50,46,62,40][v]);for(let y=5;y<=15;y++){const x=tx(y);M[y*N+x]=y%2?5:6;M[y*N+x+1]=7}// (palm: a curved, ringed trunk, fronds drooping from its crown)
      const cx=tx(5),cy=4,F=[[-6,1],[-5,-2],[-1,-3],[3,-3],[6,-1],[6,2],[-6,3],[2,3]].slice(0,6+v%2+(v>1?1:0));
      for(const [ex,ey] of F){const n=Math.max(Math.abs(ex),Math.abs(ey));for(let i=0;i<=n;i++){const f=i/n,x=Math.round(cx+ex*f),y=Math.round(cy+ey*f+(Math.abs(ex)>3?f*f*2:0));if(x<1||x>N-2||y<1||y>N-1)continue;
        M[y*N+x]=ex<0&&ey<1?(i<n*.6?1:2):ex>3||ey>1?(i<n*.5?3:4):2;if(f>.5&&y+1<N&&!M[(y+1)*N+x])M[(y+1)*N+x]=ex<0?3:4}}
      M[cy*N+cx]=1;M[(cy+1)*N+cx]=7;M[(cy+1)*N+cx+1]=7}
    shadeTrunk(M,N);
    const LD=dim?[PX.mix(L[1],L[0],.4),PX.mix(L[1],L[2],.25),L[2],L[3]].map(c=>PX.mix(c,DIM,.2)):L,D2=c=>dim?PX.mix(c,DIM,.24):c;
    const col=[null,...LD,...TR.map(D2),...SNOW.map(c=>dim?PX.mix(c,DIM,.12):c),'#3e3a38',D2(LEAF.dead[0]),D2(LEAF.dead[2])];
    return CACHE[key]=build(N,M,col,8,15,false)};

  /* small things: 8 (or 16) boxes, the foot at the bottom middle */
  PX.worldDecor=(clim,kind,v)=>{clim=PX.WORLD_NATURE[clim]?clim:'grass';v=((v|0)%4+4)%4;const key='d'+clim+kind+v;if(CACHE[key])return CACHE[key];
    const big=kind==='drift'||kind==='ripple'||kind==='pool'||kind==='floe'||kind==='cactus'||kind==='rock',N=big?16:8,M=new Uint8Array(N*N),s=v*29+kind.length*5+clim.length,P=RP(clim),Wn=PX.WORLD_NATURE[clim];
    const set=(x,y,t)=>{if(x>=0&&y>=0&&x<N&&y<N)M[y*N+x]=t},flat=!!FLAT[kind];let col=[null];
    if(kind==='bush'||kind==='scrub'){const sp=kind==='scrub'||Wn.bush==='scrub'?'scrub':Wn.bush,L=sp==='scrub'?['#b8b06a','#8a8a4c','#646a3e','#424a32']:LEAF[sp==='spine'?'fir':sp]||LEAF.oak;
      const CL=[[[4,4.6,2.6],[2.4,5.4,1.8],[5.6,5.2,1.9]],[[4,4.4,2.4],[2.6,5.6,1.7],[5.4,5.6,1.7],[4.6,3,1.6]],[[3.6,4.8,2.5],[5.6,5.6,1.8]],[[4,5,2.2],[2.2,5.6,1.6],[5.8,5.4,1.6],[4,3.4,1.8]]][v];
      clumps(M,N,CL,3,3,3.5,s);if(sp==='scrub'){for(let i=0;i<N*N;i++)if(M[i]&&PX.hash(i,v,s)<.3)M[i]=0;set(4,7,5);set(3,6,5);set(5,6,5)}
      if(sp==='spine')for(let x=0;x<N;x++)for(let y=0;y<N;y++)if(M[y*N+x]&&(y===0||!M[(y-1)*N+x])&&PX.hash(x,y,s)>.2){set(x,y,8);if(x<4&&y+1<N&&M[(y+1)*N+x])set(x,y+1,9)}
      if(clim==='grass'&&v%2===0){set(5,4,10);set(3,5,10)}
      col=[null,...L,'#5a4430','#3e3028','#2e2620',SNOW[0],SNOW[1],'#c84a3a']}
    else if(kind==='stone'||kind==='rock'){const RK=P.rock,C5=RK.c;// (a boulder or two, lit as stones from the upper left; snow, moss, strata or lichen)
      const CL=N===8?[[[4,5,2.6,2],[5.8,6.2,1.4,1.2]],[[3.6,5.2,2.2,2.2]],[[3,5.6,2,1.6],[5.2,5.2,1.8,1.8]],[[4,5.4,2.8,1.7]]][v]:[[[8,10.5,4.6,4],[11.8,12.6,2.4,2]],[[7.4,10,3.6,4.6],[10.6,12,3,2.8]],[[6,11.6,3.4,3],[10.4,11,3.4,3.6],[8,8.4,2.8,2.4]],[[8,11,5,3.4],[5,12.6,1.8,1.4]]][v];
      const F=N-1;for(let y=0;y<=F;y++)for(let x=0;x<N;x++){let hit=null;for(const c of CL){const dx=(x+.5-c[0])/c[2],dy=(y+.5-c[1])/c[3];if(dx*dx+(dy>0?dy*dy*dy*dy:dy*dy)<=1)hit=[c,dx,dy]}if(!hit)continue;
        const [,dx,dy]=hit,lam=-dx*.55-dy*.75+(PX.hash(x>>1,y>>1,s)-.5)*.5;let t=lam>.55?1:lam>.05?2:lam>-.45?3:4;if(F-y<1)t=Math.min(5,t+1);let c=t;
        if(RK.s&&dy<-.15&&PX.hash(x,y,s+1)>.15)c=t<3?6:7;else if(RK.m&&(dy<-.2||F-y<1)&&PX.hash(x,y,s+2)>.45)c=t<3?8:9;else if(RK.b&&((y+v)%3===0)&&t<4)c=10;else if(RK.g&&dy<-.35&&dx<0&&PX.hash(x,y,s+3)>.6)c=8;M[y*N+x]=c}
      const X=RK.s?[RK.s[0],RK.s[2]]:[null,null],Y=RK.m||RK.g||['#7a9644','#5a7a34'];col=[null,...C5,...X,Y[0],Y[1],RK.b?PX.mix(C5[2],RK.b[0],.45):C5[2]]}
    else if(kind==='cactus'){const C=['#b4cc6c','#8ab452','#62903e','#43702f'],F=15;// (a saguaro, one with a bloom, a barrel and its pup, an agave)
      const colm=(x0,w,y0,y1)=>{const pr=w>=3?[1,2,4]:[2,3];for(let y=y0;y<=y1;y++)for(let i=0;i<w;i++)set(x0+i,y,(y===y0&&i===w-1)?3:pr[Math.min(i,pr.length-1)]+(y===y0&&i===0?-1:0)||1)};
      if(v===0){colm(7,3,4,F);colm(4,2,8,11);set(5,12,3);set(6,12,3);colm(11,2,6,10);set(10,11,3)}
      else if(v===1){colm(7,3,3,F);colm(10,2,7,11);set(10,12,3);set(8,2,6)}
      else if(v===2){for(let y=10;y<=F;y++){const hw=y<11?2:3;for(let x=8-hw;x<8+hw;x++)set(x,y,x<7?1:x<9?2:3)}set(7,9,6);set(8,9,7);for(let y=13;y<=F;y++)for(let x=11;x<13;x++)set(x,y,x<12?2:3)}
      else{for(const [dx,dy] of [[-6,-1],[6,-1],[-5,-4],[5,-4],[-3,-6],[3,-6],[0,-7]])line(M,N,8,15,8+dx,15+dy,(i,n)=>dx<0?(i<n*.6?1:2):dx>0?(i<n*.6?3:4):2);set(8,8,6)}// (an agave)
      for(let i=0;i<N*N;i++)if(M[i]>=1&&M[i]<=3&&PX.hash(i,v,s)<.1)M[i]=5;col=[null,...C,'#f2ead0','#e8607a','#f6d04a']}
    else if(kind==='shrub'||kind==='stump'){const W0=kind==='stump'?TRUNK.dead:['#8a6a4e','#5e4634','#3e3026'];// (a frosted twig shrub; a swamp stump, mossy)
      if(kind==='shrub'){for(const [x0,y0,x1,y1] of [[4,7,4,3],[4,6,2,3],[4,5,6,2],[4,7,1,5],[4,6,7,4]].slice(0,3+v%3))line(M,N,x0,y0,x1,y1,(i,n)=>i>n*.6?2:1);for(let x=1;x<7;x++)for(let y=1;y<7;y++)if(M[y*N+x]&&!M[(y-1)*N+x]&&PX.hash(x,y,s)>.4)M[(y-1)*N+x]=4}
      else{for(let y=4+(v&1);y<=7;y++)for(let x=2;x<6;x++)set(x,y,x<3?1:x<5?2:3);set(1,7,3);set(6,7,3);set(2,4+(v&1),5);set(3,4+(v&1),5);if(v>1)set(5,3+(v&1),1)}
      col=[null,...W0,SNOW[0],LEAF.dead[0]]}
    else if(kind==='tuft'||kind==='oasis'){const TU=kind==='oasis'?PX.WORLD_NATURE.desert.green:Wn.tuft;for(let k=0;k<3;k++){const x=1+k*2+(v>>k&1),h=2+((v+k)%2)+(kind==='oasis'?1:0);for(let j=0;j<h;j++)set(x+(j===h-1&&k!==1?(k?1:-1):0),7-j,j===h-1?1:j?2:3)}col=[null,...TU]}
    else if(kind==='flowers'){const FC=['#e8d04a','#e0725e','#f0ece0','#b08ae0'][v];for(let k=0;k<4;k++){const x=1+Math.floor(PX.hash(k,v,s)*6),y=2+Math.floor(PX.hash(k,v,s+1)*5);set(x,y+1,2);set(x,y,1);if(k===0)set(x+1,y,1)}col=[null,FC,'#3e6a2e']}
    else if(kind==='drift'){const w=8+v*1.5,cx=8,cy=12;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const d=((x+.5-cx)/w*2)**2+((y+.5-cy)/(2.4+v*.3))**2;if(d>1-PX.hash(x,y,s)*.15)continue;set(x,y,y+.5<cy-.6?1:y+.5<cy+.6?2:3)}col=[null,SNOW[0],SNOW[1],SNOW[2]]}
    else if(kind==='ripple'){for(let k=0;k<2;k++){const y0=7+k*4+(v&1);for(let x=1;x<15;x++)if(PX.hash(x,k,s)>.2)set(x,y0+Math.round(Math.sin((x+v*2)/2.3)),x%5<3?1:2)}col=[null,'#ecd496','#bc9a5a']}
    else if(kind==='reeds'){const R0=P.reed;for(let k=0;k<3+v%2;k++){const x=1+k*2-(v&1)+(k>1?1:0),h=3+((v+k*3)%3),ln=((v+k)%3)-1;for(let j=0;j<h;j++)set(x+(j>h-2?ln:0),7-j,j===h-1?1:j<1?3:2);if(k===1&&v%2===0){set(x,7-h,4);set(x,6-h,4)}}col=[null,...R0,P.head]}
    else if(kind==='moss'){for(let y=3;y<8;y++)for(let x=0;x<8;x++){const d=((x+.5-4)/3.6)**2+((y+.5-5.6)/1.9)**2;if(d<1-PX.hash(x,y,s)*.35)set(x,y,PX.hash(x,y,s+1)<.3?1:2)}col=[null,'#4e6236','#38482c']}
    else if(kind==='mushroom'){for(let k=0;k<2+(v&1);k++){const x=1+k*3,y=5+(k&1);set(x,y+1,3);set(x,y,1);set(x+1,y,2)}col=[null,'#d24e3c','#a03428','#e8e0c8']}
    else if(kind==='bones'){set(1,6,1);set(2,6,1);set(3,6,2);set(4,5,1);set(5,6,2);set(5,4,1);set(6,5,2);if(v&1){set(2,4,1);set(3,4,2)}col=[null,'#ece4d0','#c4b89a']}
    else if(kind==='pool'){// (still water: a mud rim, the far bank's shade on it, lighter near, a glint; reeds at one end)
      const w=9+v,hh=4+(v&1),x0=8-(w>>1),y0=8;for(let y=-1;y<=hh;y++)for(let x=-1;x<=w;x++){const dx=(x+.5-w/2)/(w/2+1),dy=(y+.5-hh/2)/(hh/2+1),cut=PX.hash(x,y,s)*.14;if(dx*dx+dy*dy>1-cut)continue;
        const ix=(x+.5-w/2)/(w/2),iy=(y+.5-hh/2)/(hh/2),wet=ix*ix+iy*iy<=1-cut,top=wet&&ix*ix+((y-.5-hh/2)/(hh/2))**2>1-cut;set(x0+x,y0+y,!wet?1:top?2:iy<0?3:4)}
      set(x0+(w>>1),y0+(hh>>1)+1,5);set(x0+(w>>1)+1,y0+(hh>>1)+1,5);if(v<2){const rx=v?x0+w-1:x0;for(let k=0;k<3;k++){const h=3+k%2;for(let j=0;j<h;j++)set(rx+k-1,y0+1-j,j===h-1?6:7)}}
      col=[null,P.mud,P.bank,P.water[2],P.water[1],P.glint,P.reed[0],P.reed[1]]}
    else if(kind==='pad'){for(let k=0;k<2+(v&1);k++){const x=1+k*2+(v>>1),y=3+((k*3+v)%3);set(x,y,1);set(x+1,y,2);if(k===0)set(x,y+1,2)}if(v===3)set(3,2,3);col=[null,'#6a9a4a','#4a7a3a','#e8e0f0']}
    else if(kind==='floe'){const w=5+v,hh=2+(v>>1);for(let y=0;y<hh+1;y++)for(let x=0;x<w;x++){if((x===0||x===w-1)&&(y===0||y===hh)&&PX.hash(x,y,s)>.3)continue;set(4+x,8+y,y===0?1:y===hh?3:2)}col=[null,'#ffffff','#e2eef8','#b6cde2']}
    return CACHE[key]=build(N,M,col,N>>1,N-1,flat)};

  /* mountains: masses of rock tiles, each a height field drawn in projection (see PX.worldRange above). o: {D (RGBA), W, H, S (a
     byte a pixel: low bits what stands there, 128 kept clear; set to 2 where rock stands), ZO (a byte a pixel: the rock's lift there
     +1, read by whatever is drawn after so the rock stays before what lies behind it), C, R, ts, ox, oy (the tiles' grid on the
     pixels), h(i,j) (a tile's rock height in px, 0 none), clim(i,j) (its climate), seed, shade (cast its shadow on the ground),
     touch}. Seeded noise read through value lattices; never Math.random */
  const noiseF=(W,H,step,s)=>{const gw=Math.ceil(W/step)+2,gh=Math.ceil(H/step)+2,A=new Float32Array(gw*gh);for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)A[j*gw+i]=PX.hash(i,j,s);
    return(x,y)=>{const gx=Math.min(W-1,Math.max(0,x))/step,gy=Math.min(H-1,Math.max(0,y))/step,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),o=iy*gw+ix,a=A[o],b=A[o+1],c=A[o+gw],d=A[o+gw+1];
      return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy}};
  const PALR={};
  const rpal=c=>PALR[c]||(PALR[c]=(()=>{const RK=RP(c).rock;return{RC:RK.c.map(hx),SN:RK.s?RK.s.map(hx):c==='desert'?null:SNOW.map(hx),own:!!RK.s,MS:RK.m?RK.m.map(hx):null,RB:RK.b?RK.b.map(hx):null,GT:RK.g?RK.g.map(hx):null,desert:c==='desert'}})());
  function massif(o){const D=o.D,W=o.W,H=o.H,S=o.S,ZO=o.ZO,C=o.C,R=o.R,ts=o.ts,ox=o.ox||0,oy=o.oy||0,seed=o.seed|0,TO=o.touch||null,wob=o.wob||5,out={masses:0,px:0};
    const lab=new Int32Array(C*R).fill(-1),M=[];
    for(let q0=0;q0<C*R;q0++){if(lab[q0]>=0||!o.h(q0%C,(q0/C)|0))continue;const id=M.length,m={c0:C,c1:-1,r0:R,r1:-1,n:0,zmax:0,c:o.clim(q0%C,(q0/C)|0)},st=[q0];lab[q0]=id;
      while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;m.n++;if(i<m.c0)m.c0=i;if(i>m.c1)m.c1=i;if(j<m.r0)m.r0=j;if(j>m.r1)m.r1=j;
        for(const [a,c] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+c,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&lab[n]<0&&o.h(x,y)){lab[n]=id;st.push(n)}}}M.push(m)}
    if(!M.length)return out;out.masses=M.length;
    const NX=noiseF(W,H,8,seed),NY=noiseF(W,H,8,seed+1),NR1=noiseF(W,H,15,seed+80),NR2=noiseF(W,H,7,seed+81),NT=noiseF(W,H,5,seed+82);
    const kept=q=>S[q]&128,SK=1.6,LSX=-.92,LSY=-.38,LX=-.6,LY=0,LZ=.8,LN_=Math.hypot(LX,LY,LZ),SHC=[18,26,42];
    const put=(q,c)=>{const p=q*4;D[p]=c[0];D[p+1]=c[1];D[p+2]=c[2];if(TO)TO[q]=1},mix=(q,c,t)=>{const p=q*4;D[p]+=(c[0]-D[p])*t;D[p+1]+=(c[1]-D[p+1])*t;D[p+2]+=(c[2]-D[p+2])*t;if(TO)TO[q]=1};
    M.forEach((m,id)=>{const x0=Math.max(0,ox+m.c0*ts-6),x1=Math.min(W,ox+(m.c1+1)*ts+6),y0=Math.max(0,oy+m.r0*ts-6),y1=Math.min(H,oy+(m.r1+1)*ts+6),bw=x1-x0,bh=y1-y0;if(bw<=0||bh<=0)return;
      const small=m.n<=2,A=new Uint16Array(bw*bh),HV=new Float32Array(bw*bh),ZR=new Float32Array(bw*bh),CL=new Uint8Array(bw*bh),gi0=m.c0-1,gj0=m.r0-1,gw=m.c1-m.c0+3,gh=m.r1-m.r0+3,GI=new Float32Array(gw*gh),GH=new Float32Array(gw*gh);
      for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const ci=gi0+i,cj=gj0+j;if(ci>=0&&cj>=0&&ci<C&&cj<R&&lab[cj*C+ci]===id){GI[j*gw+i]=1;GH[j*gw+i]=o.h(ci,cj)}}
      // (1) its footprint: its tiles read through a wobble, kept-clear pixels left out; the distance in from its edge (chamfer 3-4);
      //     each point's tile height (bilinear) and climate
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){if(kept(y*W+x))continue;const u=(x-ox+.5+(NX(x,y)-.5)*wob)/ts-.5-gi0,v=(y-oy+.5+(NY(x,y)-.5)*wob)/ts-.5-gj0,iu=Math.floor(u),iv=Math.floor(v);if(iu<0||iv<0||iu>=gw-1||iv>=gh-1)continue;
        const fu=u-iu,fv=v-iv,q=iv*gw+iu,a=GI[q],b=GI[q+1],c=GI[q+gw],d=GI[q+gw+1],w=a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv;
        if(w>.42){const e=GH[q],f=GH[q+1],g=GH[q+gw],h=GH[q+gw+1],k=(y-y0)*bw+x-x0;A[k]=999;HV[k]=m.c==='desert'?(fu<.5?(fv<.5?e:g):(fv<.5?f:h))||Math.max(e,f,g,h):(e+(f-e)*fu+(g-e)*fv+(e-f-g+h)*fu*fv)/w;CL[k]=CLIMS.indexOf(o.clim(Math.floor((x-ox)/ts),Math.floor((y-oy)/ts)))}}
      for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const k=y*bw+x;if(!A[k])continue;A[k]=Math.min(A[k],x?A[k-1]+3:3,y?A[k-bw]+3:3,x&&y?A[k-bw-1]+4:4,y&&x<bw-1?A[k-bw+1]+4:4)}
      for(let y=bh-1;y>=0;y--)for(let x=bw-1;x>=0;x--){const k=y*bw+x;if(!A[k])continue;A[k]=Math.min(A[k],x<bw-1?A[k+1]+3:3,y<bh-1?A[k+bw]+3:3,x<bw-1&&y<bh-1?A[k+bw+1]+4:4,y<bh-1&&x?A[k+bw-1]+4:4)}
      // (2) its peaks: cones on some of its tiles, a tile and a half apart or more, each as high as its tile (the first the highest,
      //     the rest a little lower), its flanks fluted into three to five ridges by angle; reckoned on a 2-px lattice and read between
      const desert=m.c==='desert';let PZ=null,pw=0;
      if(!small&&!desert){const Rk=PX.dice(PX.rng(seed*13+id*101+7)),cand=[],PK=[];for(let j=m.r0;j<=m.r1;j++)for(let i=m.c0;i<=m.c1;i++)if(lab[j*C+i]===id)cand.push([i,j]);
        for(let k=cand.length-1;k>0;k--){const r=Rk.int(0,k),t=cand[k];cand[k]=cand[r];cand[r]=t}
        cand.sort((a,b)=>o.h(b[0],b[1])-o.h(a[0],a[1]));
        for(const [i,j] of cand){if(PK.length>=Math.max(2,Math.round(m.n/2.6)))break;const px=ox+(i+.5)*ts+Rk.int(-4,4)*ts/16,py=oy+(j+.5)*ts+Rk.int(-4,4)*ts/16;if(PK.some(p=>Math.hypot(p.x-px,p.y-py)<ts*1.45))continue;
          const f=Rk.R()*6.28;PK.push({x:px,y:py,h:o.h(i,j)*(PK.length?.7+.28*Rk.R():1),s:.85+.55*Rk.R(),n:3+Rk.int(0,2),cf:Math.cos(f),sf:Math.sin(f)})}
        pw=(bw>>1)+2;const ph=(bh>>1)+2;PZ=new Float32Array(pw*ph);
        for(let j=0;j<ph;j++)for(let i=0;i<pw;i++){const x=x0+2*i,y=y0+2*j;let z=0;for(const p of PK){const dx=x-p.x,dy=(y-p.y)*1.15,r=Math.sqrt(dx*dx+dy*dy);if(p.h-p.s*r*.68<=z)continue;
          const c=r?dx/r:1,s=r?dy/r:0,c2=c*c,s2=s*s,cn=p.n===3?c*(4*c2-3):p.n===4?8*c2*c2-8*c2+1:c*(16*c2*c2-20*c2+5),sn=p.n===3?s*(3-4*s2):p.n===4?4*s*c*(c2-s2):s*(16*s2*s2-20*s2+5);
          const q=p.h-p.s*r*(1+.32*(cn*p.cf-sn*p.sf));if(q>z)z=q}PZ[j*pw+i]=z}}
      // (3) the height: a butte in the desert (flat on top, sheer), a spire if small, else the cones over a low body, steep at its edge;
      //     never rising over kept-clear ground behind it (UP: the free pixels above each point)
      const UP=new Uint16Array(bw*bh);for(let x=x0;x<x1;x++){let run=0;for(let y=Math.max(0,y0-96);y<y1;y++){if(kept(y*W+x))run=0;else run++;if(y>=y0)UP[(y-y0)*bw+x-x0]=run-1}}
      for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const k=(y-y0)*bw+x-x0;if(!A[k])continue;if(UP[k]<3){A[k]=0;continue}const d=A[k]/3,rid=1-Math.abs(2*NR1(x,y)-1),cr=NR2(x,y)-.5,Hp=HV[k];let z;
        if(desert)z=Math.min(Hp*(.95+.05*rid)+cr*1.5,d*(small?9:6));
        else if(small)z=Math.min(Hp*(.82+.18*rid)*(1+cr*.3),d*6);
        else{const u=(x-x0)/2,v=(y-y0)/2,iu=u|0,iv=v|0,fu=u-iu,fv=v-iv,q=iv*pw+iu,a=PZ[q],b=PZ[q+1],c=PZ[q+pw],e=PZ[q+pw+1];
          z=Math.max(Hp*.3*Math.min(1,d/12),a+(b-a)*fu+(c-a)*fv+(a-b-c+e)*fu*fv);z=Math.min(z*(1+cr*.12)+rid*2,d*(2+1.6*NR2(x+57,y+31)))}
        z=Math.max(.6,Math.min(z,UP[k]-2));ZR[k]=z;if(z>m.zmax)m.zmax=z}
      const K=Math.ceil(m.zmax/SK)+1,zAt=(x,y)=>x<x0||y<y0||x>=x1||y>=y1?0:ZR[(y-y0)*bw+x-x0];
      const shadowed=(x,y,z0,st)=>{for(let k=2;k<=K;k+=st){const qx=Math.round(x+LSX*k),qy=Math.round(y+LSY*k);if(qx<x0||qy<y0)return false;if(zAt(qx,qy)>z0+k*SK)return true}return false};
      // (4) its shadow on the ground to the lower right (tested on a 2-px lattice)
      if(o.shade){const X1=Math.min(W,x1+K+2),Y1=Math.min(H,y1+Math.ceil(K*.45)+2);for(let y=y0;y<Y1;y++)for(let x=x0;x<X1;x++){const q=y*W+x;if(S[q]&(128|64)||ZO[q]||(x<x1&&y<y1&&A[(y-y0)*bw+x-x0]))continue;
        if(shadowed(x&~1,y&~1,0,2)){S[q]|=64;mix(q,SHC,.3)}}}
      // (5) the rock, front to back a column at a time: a point at height z shows at (x, y-z), above the rock drawn before it in the
      //     column (hz); a nearer mass already there stays
      for(let x=x0;x<x1;x++){let hz=1e9,prev=false;
        for(let y=y1-1;y>=y0;y--){const k=(y-y0)*bw+x-x0;if(!A[k]){prev=false;continue}if(!prev)hz=Math.min(hz,y+1);prev=true;
          const z=ZR[k],sy=Math.round(y-z);if(sy>=hz)continue;const P=rpal(CLIMS[CL[k]]);
          const gx=(zAt(x+1,y)-zAt(x-1,y))/2,gy=(zAt(x,y+1)-zAt(x,y-1))/2,nl=Math.hypot(gx,gy,1),nz=1/nl,lam=(-gx*LX-gy*LY+LZ)/nl/LN_;
          const v0=.5+.45*lam-(shadowed(x,y,z,1)?.22:0);
          for(let r=Math.max(0,sy);r<hz&&r<H;r++){const q=r*W+x,hg=y-r;if(ZO[q]&&r+ZO[q]-1>y)continue;
            let v=v0-.16*Math.max(0,1-hg/10)+(NT(x,r)-.5)*.1+(PX.hash(x,r,seed+85)-.5)*.07;
            let kk=v>.82?0:v>.66?1:v>.48?2:v>.32?3:4;if(nz<.5&&PX.hash(x,(r+(x&3))>>2,seed+86)<.07)kk=Math.min(4,kk+1);if(P.RB&&nz>.8)kk=Math.max(1,kk);
            let c=P.RC[kk];
            if(P.RB){if(nz<.8||r>sy){const u=(hg+NT(x,7)*4)/3.5,bd=Math.floor(u)&3;if(bd===1)c=mixA(c,P.RB[0],.32);else if(bd===3)c=mixA(c,P.RB[1],.3);if(u%1<.29&&nz<.6)c=mixA(c,P.RB[2],.4)}else if(PX.hash(x,r,seed+88)<.06)c=mixA(c,P.RB[2],.3)}
            else if(P.own){if(nz>.5&&hg>m.zmax*.46+(NT(x,r)-.5)*10||nz>.82&&hg>8)c=P.SN[v>.66?0:v>.42?1:2]}
            else if(P.SN&&!P.MS&&m.zmax>32&&nz>.45&&hg>Math.max(30,m.zmax*.72)+(NT(x,r)-.5)*8)c=P.SN[v>.66?0:v>.42?1:2];// (the high peaks: snow)
            else if(P.MS){if(nz>.55&&NT(x+70,y)>.5||hg<3&&PX.hash(x,r,seed+87)<.35)c=P.MS[kk<2?0:kk<4?1:2]}
            else if(P.GT){if(nz>.72&&hg<m.zmax*.6&&NT(x+40,y)>.6)c=P.GT[kk<2?0:kk<4?1:2];else if(PX.hash(x,r,seed+87)<.005)c=[180,180,140]}
            put(q,c);S[q]=(S[q]&~7)|2;ZO[q]=Math.min(255,hg+1);out.px++}
          hz=sy}}
      // (6) its outline: navy round its silhouette (but along its foot, where it meets the ground), a deep contour along a crest over
      //     the rock behind it (the rock behind a step of 6+ px)
      const zm=Math.ceil(m.zmax),CRc=rpal(m.c).RC[4],rock=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&ZO[y*W+x]>0;
      const OUT=[];for(let x=Math.max(0,x0-1);x<Math.min(W,x1+1);x++)for(let y=Math.max(0,y0-zm-2);y<y1;y++){const q=y*W+x;
        if(ZO[q]){if(y+1<H&&ZO[q+W]&&!(S[q+W]&8)&&(y+1+ZO[q+W]-1)-(y+ZO[q]-1)>5)put(q,CRc);continue}
        if(kept(q))continue;let n=0;if(rock(x,y+1)&&ZO[q+W]>2)n=ZO[q+W]+1;else if(rock(x-1,y)&&ZO[q-1]>2)n=ZO[q-1];else if(rock(x+1,y)&&ZO[q+1]>2)n=ZO[q+1];else if(rock(x,y-1)&&ZO[q-W]>3)n=ZO[q-W]-1;
        if(n)OUT.push(q,n)}
      for(let k=0;k<OUT.length;k+=2){const q=OUT[k];put(q,NV);S[q]=(S[q]&~7)|2|8;ZO[q]=Math.min(255,OUT[k+1])}});
    return out}
  PX.worldRange=massif;

  /* a mountain alone in an n box: a few tiles of rock (by v) on a small grid, drawn as a range is, then cut out as a sprite */
  const PEAKSHAPE=[[[1,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1],[2,1]],[[0,1],[1,1],[2,1]],[[1,0],[1,1],[2,1]],[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]];
  PX.worldPeak=(clim,v,n)=>{clim=PX.WORLD_NATURE[clim]?clim:'grass';v=((v|0)%6+6)%6;n=n>=64?64:n>=32?32:16;const key='p'+clim+v+n;if(CACHE[key])return CACHE[key];
    const N=n,G=3,ts=n===16?5:N/4,ox=n===16?3:N/8,oy=N-2-2*ts,cells=n===16?(v%2?[[1,1]]:[[0,1],[1,1]]):PEAKSHAPE[v],HT=new Float32Array(G*G);
    cells.forEach(([i,j],k)=>{HT[j*G+i]=N*(k===0?(n===16?.5:.56):.3+.16*PX.hash(i,j,v+n))});
    const D=new Uint8ClampedArray(N*N*4),S=new Uint8Array(N*N),ZO=new Uint8Array(N*N);
    massif({D,W:N,H:N,S,ZO,C:G,R:2,ts,ox,oy,h:(i,j)=>HT[j*G+i],clim:()=>clim,seed:v*7+n+clim.length,shade:false,wob:Math.max(1.5,ts/16*5)});
    const a=new Uint8Array(N*N),rgb=new Uint8Array(N*N*3);for(let i=0;i<N*N;i++)if(ZO[i]){const x=i%N,y=(i/N)|0,nav=D[i*4]===NV[0]&&D[i*4+1]===NV[1]&&D[i*4+2]===NV[2];if(!nav&&(x===0||x===N-1||y===0))continue;a[i]=nav?2:1;rgb[i*3]=D[i*4];rgb[i*3+1]=D[i*4+1];rgb[i*3+2]=D[i*4+2]}
    // (alone, the outline goes all round it, its foot too, as round any sprite)
    for(let i=0;i<N*N;i++)if(a[i]===2){const x=i%N,y=(i/N)|0;if(!((x>0&&a[i-1]===1)||(x<N-1&&a[i+1]===1)||(y>0&&a[i-N]===1)||(y<N-1&&a[i+N]===1)))a[i]=0}ring(N,a,rgb);
    return CACHE[key]=finish(N,a,rgb,N>>1,N-1,false)};

  /* hills: a bump of height (z, px) in a 32 box, the middle (16,16) on the hill tile's middle: a main rise, on some a shoulder or a
     second rise beside it (a ridge); low and broad. z = h (1-d²)², so its slope fades to nothing at its edge (soft) */
  PX.worldHill=(clim,v,opts)=>{clim=PX.WORLD_NATURE[clim]?clim:'grass';v=((v|0)%6+6)%6;const key='h'+clim+v;if(CACHE[key])return CACHE[key];
    const N=32,R=PX.dice(PX.rng(v*53+clim.length*11+7)),z=new Float32Array(N*N),sz=[.75,1,.9,1.15,.8,1.05][v],B=[[16+R.int(-1,1),17,12*sz+R.int(0,2),8*sz+R.int(0,1),(7+R.R()*3)*sz]];
    if(v%3===1)B.push([16+(v<3?-7:7),18,6,4.5,3.5+R.R()]);else if(v%3===2){B[0][0]-=5;B.push([22,18,8,5.5,4.5+R.R()*1.5])}
    if(v>=3)B[0][4]*=1.25;
    for(const [cx,cy,rx,ry,h] of B)for(let y=0;y<N;y++)for(let x=0;x<N;x++){const d=((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2;if(d<1)z[y*N+x]+=h*(1-d)*(1-d)}
    // (its look alone, for the gallery: shaded over the climate's middle ground tone)
    const base=hx(RP(clim).base[1]),Wn=PX.WORLD_NATURE[clim],at=(a,b)=>a<0||b<0||a>=N||b>=N?0:z[b*N+a],cv=PX.canvas(N,N,g=>{const im=g.createImageData(N,N),d=im.data;
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,c=hillPx(clim,Wn,base,at(x+1,y)-at(x-1,y),at(x,y+1)-at(x,y-1),z[i],x,y,v,hillShade(at,x,y,z[i]));d.set(c,i*4);d[i*4+3]=255}g.putImageData(im,0,0)});
    return CACHE[key]=Object.assign(cv,{z,N,ax:16,ay:16,flat:true,edge:opts&&opts.edge||0,box:[0,0,N-1,N-1]})};
  // a hill's pixel: its slope (gx, gy: height differences across two pixels; the rise seen from above, so north-south slopes
  // foreshortened) against the light from the upper left, beyond flat ground, in steps (dithered: soft), leaning the ground colour
  // toward the climate's lit or shade tone; a little lighter the higher; a soft shadow where a rise stands between it and the light;
  // tufts on the lit slopes (grass), strata on the shaded (desert), rock through the snow (frost), moss (swamp)
  const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>v/16),HL=[-.68,-.42,.6];
  const hillShade=(at,x,y,z0)=>{for(let k=1;k<=7;k++){const zz=at(Math.round(x-k*1.6),Math.round(y-k*.7));if(zz>z0+k*.75+.3)return 1}return 0};
  const HC={},hc=(Wn)=>HC[Wn.floor]||(HC[Wn.floor]={lit:hx(Wn.hill.lit),shade:hx(Wn.hill.shade),k:Wn.hill.k}),HX={tl:hx('#a8c466'),td:hx('#3a5a2e'),sb:hx('#9a5a3a'),sr:hx('#8e5e3e'),fr:hx('#7a8298'),sm:hx('#3e4a2c')};
  function hillPx(clim,Wn,c,gx,gy,z,x,y,s,shd){const H=hc(Wn),ax=gx*.5,ay=gy*.5*.6,nl=Math.sqrt(ax*ax+ay*ay+1),lam=(ax*-HL[0]+ay*-HL[1]+HL[2])/nl-HL[2]+z*.01;
    const r=lam*11-shd*1.2+BAYER[(y&3)*4+(x&3)]-.5,q=Math.max(-3,Math.min(3,r<0?-Math.floor(-r):Math.floor(r)));let o=c;
    if(q>0)o=mixA(c,H.lit,q*H.k[0]);else if(q<0)o=mixA(c,H.shade,-q*H.k[1]);
    if(z>.8){const n=PX.hash(x,y,s*7+91);if(clim==='grass'&&q>0&&n<.03)o=HX.tl;else if(clim==='grass'&&q<0&&n<.02)o=HX.td;
      else if(clim==='desert'&&q<=0&&z>2&&(y+Math.floor(z*.7))%3===0)o=mixA(o,HX.sb,.3);else if(clim==='desert'&&n<.02)o=HX.sr;
      else if(clim==='frost'&&q<=-1&&z>2.5&&PX.hash(x>>2,y>>1,s+92)<.35&&n<.7)o=mixA(o,HX.fr,.55);else if(clim==='swamp'&&n<.05)o=HX.sm}return o}

  /* the painter */
  const KIND=PX.WN_KIND,SHC=[18,26,42];
  PX.worldNature=spec=>{
    const t0=performance.now(),D=spec.D,W=spec.W,H=spec.H,C=spec.C,R=spec.R,ts=spec.ts||16,K=spec.kind,CI=spec.clim,CLR=spec.clear,seed=(spec.seed|0)||1,TO=spec.touch||null,out={trees:0,hills:0,peaks:0,decor:0,flat:0};
    const kAt=(x,y)=>x<0||y<0||x>=C||y>=R?KIND.water:K[y*C+x],cAt=(x,y)=>CLIMS[CI[Math.max(0,Math.min(R-1,y))*C+Math.max(0,Math.min(C-1,x))]]||'grass',h=(x,y,k)=>PX.hash(x,y,seed*977+k);
    // S: a byte a pixel: what stands there (low 3 bits: 0 ground, 2 rock, 3 wood, 4 a small thing; 8 a range's outline), 64 shaded,
    // 128 kept clear (clear ground, water, a bridge's tile, a beach). ZO: the rock's lift there +1 (0 none)
    const S=new Uint8Array(W*H),ZO=new Uint8Array(W*H);if(CLR)for(let i=0;i<W*H;i++)if(CLR[i])S[i]=128;
    const bridge=(x,y)=>kAt(x,y)===KIND.road&&(kAt(x-1,y)===KIND.water&&kAt(x+1,y)===KIND.water||kAt(x,y-1)===KIND.water&&kAt(x,y+1)===KIND.water);
    for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++)if(K[ty*C+tx]===KIND.water||bridge(tx,ty))for(let y=ty*ts;y<(ty+1)*ts&&y<H;y++)S.fill(128,y*W+tx*ts,y*W+Math.min(W,(tx+1)*ts));
    // (and the beach: 3 px of land along the water, where the game lays its shore)
    const keep=(x0,y0,w,h)=>{for(let y=Math.max(0,y0);y<Math.min(H,y0+h);y++)S.fill(128,y*W+Math.max(0,x0),y*W+Math.min(W,x0+w))};
    for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++){if(K[ty*C+tx]===KIND.water||bridge(tx,ty))continue;const X=tx*ts,Y=ty*ts,wa=(a,b)=>tx+a>=0&&ty+b>=0&&tx+a<C&&ty+b<R&&K[(ty+b)*C+tx+a]===KIND.water;
      if(wa(0,-1))keep(X,Y,ts,3);if(wa(0,1))keep(X,Y+ts-3,ts,3);if(wa(-1,0))keep(X,Y,3,ts);if(wa(1,0))keep(X+ts-3,Y,3,ts)}
    const touch=(i,v)=>{if(TO)TO[i]=v};
    const mixD=(i,c,t)=>{const o=i*4;D[o]+=(c[0]-D[o])*t;D[o+1]+=(c[1]-D[o+1])*t;D[o+2]+=(c[2]-D[o+2])*t};
    const T=[],lap=n=>T.push(n+' '+(performance.now()-t0).toFixed(0));lap('set');
    // (1) a wood's floor: its ground darker, fading out over a few pixels where it meets open land
    for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++){if(K[ty*C+tx]!==KIND.forest)continue;const F=hx(PX.WORLD_NATURE[cAt(tx,ty)].floor),fo=(a,b)=>kAt(tx+a,ty+b)===KIND.forest;const eL=!fo(-1,0),eR=!fo(1,0),eU=!fo(0,-1),eD=!fo(0,1);
      for(let y=0;y<ts;y++)for(let x=0;x<ts;x++){const X=tx*ts+x,Y=ty*ts+y,i=Y*W+X;if(X>=W||Y>=H||S[i]&128)continue;let e=9;if(eL)e=Math.min(e,x);if(eR)e=Math.min(e,ts-1-x);if(eU)e=Math.min(e,y);if(eD)e=Math.min(e,ts-1-y);
        const k=.5*Math.min(1,(e+h(X,Y,1)*2.5)/4);if(k>0){mixD(i,F,k);touch(i,1)}}}
    lap('floor');
    // (2) hills, a band of tile rows at a time: their rises, on a loose lattice of their own (22×18 px, each
    //     shifted, sized and shaped by a hash: not the tiles' grid), where the middle lies on a hill tile, added up into a height
    //     field (a rise whose middle touches kept-clear ground is left out), then shaded as one ground: only the 8-px blocks a rise
    //     or its shadow reaches (BK)
    const BT=12,UPR=6,BS=8,BW8=Math.ceil(W/BS);
    if(K.some(k=>k===KIND.hill))for(let r0=0;r0<R;r0+=BT){const y0=r0*ts,y1=Math.min(H,(r0+BT)*ts),BH=y1-y0+UPR+2,ZH=new Float32Array(W*BH),at=(x,y)=>x<0||x>=W||y<y0-UPR||y>y1?0:ZH[(y-y0+UPR)*W+x],BK=new Uint8Array(BW8*Math.ceil((y1-y0)/BS));let any=false;
      const LX=22,LY=18;for(let j=Math.max(0,Math.floor((y0-40)/LY));j<=Math.ceil((y1+24)/LY);j++)for(let i=0;i<=Math.ceil(W/LX);i++){if(h(i,j,8)<.18)continue;const px=i*LX+3+Math.floor(h(i,j,3)*16),py=j*LY+2+Math.floor(h(i,j,4)*14),tx=(px/ts)|0,ty=(py/ts)|0;
        if(kAt(tx,ty)!==KIND.hill)continue;const c=cAt(tx,ty),hl=PX.worldHill(c,Math.floor(h(i,j,2)*6)),cx=px-16,cy=py-16;
        let ok=true;for(const [a,b] of [[16,16],[10,16],[22,16],[16,12],[16,20]]){const X=cx+a,Y=cy+b;if(X<0||Y<0||X>=W||Y>=H||S[Y*W+X]&128){ok=false;break}}if(!ok)continue;if(py>=y0&&py<y1)out.hills++;any=true;for(let by=Math.max(0,Math.floor((cy-y0)/BS));by<Math.min(BK.length/BW8,Math.ceil((cy+40-y0)/BS));by++)for(let bx=Math.max(0,Math.floor(cx/BS));bx<Math.min(BW8,Math.ceil((cx+46)/BS));bx++)BK[by*BW8+bx]=1;
        for(let y=0;y<32;y++){const Y=cy+y;if(Y<y0-UPR||Y>y1)continue;for(let x=0;x<32;x++){const X=cx+x,zz=hl.z[y*32+x];if(zz&&X>=0&&X<W)ZH[(Y-y0+UPR)*W+X]+=zz}}}
      if(!any)continue;
      const MO=[1,2,3,4,5,6,7].map(k=>[Math.round(-k*1.6),Math.round(-k*.7),k*.75+.3]).map(([dx,dy,u])=>[dy*W+dx,u]);
      for(let Y=y0;Y<y1;Y++){const ty=(Y/ts)|0,br=((Y-y0)/BS|0)*BW8,row=(Y-y0+UPR)*W;for(let X=0;X<W;X++){if(!BK[br+(X>>3)]){X|=7;continue}const i=Y*W+X;if(S[i]&128)continue;const zi=row+X,zh=ZH[zi];
        let sh=0;if(X>=12){for(const [d,u] of MO)if(ZH[zi+d]>zh+u){sh=1;break}}else sh=hillShade(at,X,Y,zh);if(zh<=.05&&!sh)continue;
        const cl=cAt((X/ts)|0,ty),o=i*4,c=hillPx(cl,PX.WORLD_NATURE[cl],[D[o],D[o+1],D[o+2]],at(X+1,Y)-at(X-1,Y),at(X,Y+1)-at(X,Y-1),zh,X,Y,7,sh);D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];touch(i,1)}}}
    lap('hills');
    // (3) the small things lying on the ground, and what stands: gathered by tile
    const items=[],flats=[];
    const fits=(sp,x,y,water)=>{const N=sp.width,X0=x-sp.ax,Y0=y-sp.ay;for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(!sp.a[j*N+i])continue;const X=X0+i,Y=Y0+j;if(X<0||Y<0||X>=W||Y>=H)return false;const q=Y*W+X;
      if(water?(CLR&&CLR[q])||kAt((X/ts)|0,(Y/ts)|0)!==KIND.water:S[q]&128)return false}return true};
    const stand=(sp,x,y,cls)=>{if(!fits(sp,x,y))return false;items.push([y,x,sp,cls]);return true};
    const lie=(sp,x,y,water)=>{if(!fits(sp,x,y,water))return false;flats.push([x,y,sp,water]);return true};
    const VN=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),w=yf*yf*(3-2*yf),a=h(xi,yi,s),b=h(xi+1,yi,s),c=h(xi,yi+1,s),d=h(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w};
    // (each water's size, so a desert's palms stand by an oasis or a lake, not along the sea)
    const WS=new Int32Array(C*R);{const st=[];for(let q0=0;q0<C*R;q0++){if(K[q0]!==KIND.water||WS[q0])continue;const L=[q0];WS[q0]=-1;st.push(q0);while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&K[n]===KIND.water&&!WS[n]){WS[n]=-1;st.push(n);L.push(n)}}}for(const q of L)WS[q]=L.length}}
    const pickTree=(c,tx,ty,k)=>{const r=h(tx,ty,k),g=VN(tx/5,ty/5,71);
      if(c==='grass')return r<.08+.62*g?'pine':r<.08+.62*g+.24*(1-g)?'birch':'oak';if(c==='frost')return r<.3+.4*(g-.5)?'fir':'spine';if(c==='swamp')return r<.45?'willow':r<.75?'dead':'moak';return 'palm'};
    // (a wood's tile: one of three loose layouts of six trees, shuffled a little; at its edge a slot is often empty, and now and then
    //  a tree or a bush stands out on the open ground beside it; deeper trees (another wood tile in front) dimmer)
    const LAY=[[[3,5],[11,4],[7,10],[14,10],[2,14],[10,15]],[[6,4],[14,6],[2,9],[10,10],[5,15],[13,14]],[[2,6],[9,4],[14,8],[6,11],[12,13],[3,15]]];
    for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++){const k=K[ty*C+tx],X=tx*ts,Y=ty*ts,c=cAt(tx,ty),hh=n=>h(tx,ty,n+40);
      if(k===KIND.forest){const op=(a,b)=>{const q=kAt(tx+a,ty+b);return q===KIND.open||q===KIND.hill||q===KIND.road},below=kAt(tx,ty+1)===KIND.forest;
        LAY[Math.floor(hh(0)*3)].forEach(([sx,sy],n)=>{const edge=(sx<5&&op(-1,0))||(sx>11&&op(1,0))||(sy<6&&op(0,-1))||(sy>13&&op(0,1));if(hh(n+50)<(edge?.32:.08))return;
          const x=X+sx+Math.round((hh(n+6)-.5)*4),y=Y+sy+Math.round((hh(n+12)-.5)*3),sp=pickTree(c,tx,ty,n+20),dim=below?1:0;
          if(kAt((x/ts)|0,(y/ts)|0)===KIND.water)return;if(stand(PX.worldTree(c,sp,Math.floor(hh(n+18)*4),dim),x,y,3))out.trees++});
        for(const [a,b] of [[-1,0],[1,0],[0,1],[0,-1]]){if(!op(a,b)||hh(30+a+2*b)>.3)continue;const x=X+8+a*(11+Math.round(hh(34)*3))+(b?Math.round((hh(35)-.5)*10):0),y=Y+(b>0?ts+3+Math.round(hh(36)*3):b<0?-3:8+Math.round(hh(37)*6));
          const sp=hh(38)<.55?PX.worldTree(c,pickTree(c,tx,ty,39),Math.floor(hh(40)*4),0):PX.worldDecor(c,c==='desert'?'scrub':'bush',Math.floor(hh(41)*4));if(stand(sp,x,y,3))out.trees++}}
      else if(k===KIND.water){if(c==='swamp'&&hh(5)<.35&&lie(PX.worldDecor('swamp','pad',Math.floor(hh(6)*4)),X+4+Math.floor(hh(7)*8),Y+4+Math.floor(hh(8)*8),true))out.flat++;
        else if(c==='frost'&&hh(5)<.25&&lie(PX.worldDecor('frost','floe',Math.floor(hh(6)*4)),X+2+Math.floor(hh(7)*12),Y+2+Math.floor(hh(8)*8),true))out.flat++}
      else if(k===KIND.open||k===KIND.hill){const at=(n,m)=>[X+2+Math.floor(hh(n)*12),Y+4+Math.floor(hh(m)*11)],D0=(kind,v,n,m,st)=>{const sp=PX.worldDecor(c,kind,v),[x,y]=at(n,m);if(st?stand(sp,x,y,4):lie(sp,x,y))st?out.decor++:out.flat++};
        const hill=k===KIND.hill;
        if(c==='grass'){if(hh(10)<(hill?.25:.45))for(let i=0;i<1+(hh(11)>.6?1:0);i++)D0('tuft',Math.floor(hh(12+i)*4),13+i,15+i);if(!hill&&hh(17)<.12)D0('flowers',Math.floor(hh(18)*4),19,20);
          if(hh(21)<(hill?.08:.05))D0('bush',Math.floor(hh(22)*4),23,24,1);if(hh(25)<(hill?.08:.03))D0('stone',Math.floor(hh(26)*4),27,28,1)}
        else if(c==='frost'){if(!hill&&hh(10)<.26)D0('drift',Math.floor(hh(11)*4),12,13);if(hh(14)<(hill?.1:.05))D0('stone',Math.floor(hh(15)*4),16,17,1);if(hh(18)<.045)D0('shrub',Math.floor(hh(19)*4),20,21,1);if(!hill&&hh(22)<.03)D0('bush',Math.floor(hh(23)*4),24,25,1)}
        else if(c==='desert'){// (by water: an oasis, palms and green; elsewhere ripples, cacti, rocks, scrub, now and then bones)
          let wet=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<C&&y<R&&K[y*C+x]===KIND.water&&WS[y*C+x]<=120)wet++}
          if(wet&&!hill){for(let i=0;i<1+(hh(30)>.4?1:0)+(wet>2&&hh(31)>.5?1:0);i++){const [x,y]=at(32+i,35+i);if(stand(PX.worldTree('desert','palm',Math.floor(hh(38+i)*4),0),x,y,3))out.trees++}
            for(let i=0;i<2;i++)D0('oasis',Math.floor(hh(41+i)*4),43+i,45+i)}
          else{if(!hill&&hh(10)<.3)D0('ripple',Math.floor(hh(11)*4),12,13);if(hh(14)<(hill?.04:.05))D0('cactus',Math.floor(hh(15)*4),16,17,1);if(hh(18)<(hill?.2:.03))D0(hill?'rock':'stone',Math.floor(hh(19)*4),20,21,1);
            if(hh(22)<.035)D0('scrub',Math.floor(hh(23)*4),24,25,1);if(!hill&&hh(26)<.012)D0('bones',Math.floor(hh(27)*4),28,29)}}
        else{if(!hill&&hh(10)<.14)D0('pool',Math.floor(hh(11)*4),12,13);if(hh(14)<.32)D0('reeds',Math.floor(hh(15)*4),16,17);if(hh(18)<.26)D0('moss',Math.floor(hh(19)*4),20,21);if(hh(22)<.04)D0('mushroom',Math.floor(hh(23)*4),24,25);
          if(hh(26)<.04)D0('stump',Math.floor(hh(27)*4),28,29,1);if(hh(30)<(hill?.08:.025))D0('bush',Math.floor(hh(31)*4),32,33,1)}}}
    for(const [x,y,sp,water] of flats){const N=sp.width,X0=x-sp.ax,Y0=y-sp.ay;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*N+i;if(sp.a[a]!==1)continue;const q=(Y0+j)*W+X0+i,o=q*4;D[o]=sp.rgb[a*3];D[o+1]=sp.rgb[a*3+1];D[o+2]=sp.rgb[a*3+2];touch(q,water?2:1)}}
    lap('things');
    // (4) the ranges: each tile of rock as high as it lies deep in its range (5×5 round it), the great peaks higher (inside a range,
    //     5+ of 8 neighbours rock, the highest hash of its 3×3, rock above it)
    const inner=(x,y)=>{if(kAt(x,y)!==KIND.mount)return false;let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&kAt(x+a,y+b)===KIND.mount)n++;return n>=5};
    const great=(tx,ty)=>{if(!inner(tx,ty))return false;const v=h(tx,ty,61);if(v<.35)return false;for(const [a,b] of [[-1,0],[1,0],[-1,-1],[0,-1],[1,-1],[0,-2]])if(kAt(tx+a,ty+b)!==KIND.mount)return false;
      for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&inner(tx+a,ty+b)&&h(tx+a,ty+b,61)>v)return false;return true};
    const RH=new Float32Array(C*R);for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++){if(K[ty*C+tx]!==KIND.mount)continue;let d=0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(kAt(tx+a,ty+b)===KIND.mount)d++;
      RH[ty*C+tx]=cAt(tx,ty)==='desert'?8*Math.max(1,Math.round((1.2+3.2*Math.min(1,(d-1)/18))*(.55+.6*h(tx,ty,63)))):(14+24*Math.min(1,(d-1)/20))*(great(tx,ty)?1.4:1)*(.9+.2*h(tx,ty,62))}
    const rg=massif({D,W,H,S,ZO,C,R,ts,h:(i,j)=>RH[j*C+i],clim:cAt,seed:seed+5,shade:true,touch:TO});out.peaks=rg.masses;out.rock=rg.px;
    lap('ranges');
    // (5) what stands, sorted by its feet: every shadow first (on the ground, once each), then each back to front. An outline goes
    //     down only on what is not its own kind (a wood's mass is outlined once, round its edge); nothing is drawn where the rock
    //     stands before it (its ground nearer than the thing's foot)
    items.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
    for(const [y,x,sp] of items){const o=sp.sh;for(let k=0;k<o.length;k+=2){const X=x+o[k],Y=y+o[k+1];if(X<0||Y<0||X>=W||Y>=H)continue;const q=Y*W+X;if(S[q]&(128|64)||S[q]&7)continue;S[q]|=64;mixD(q,SHC,.3);touch(q,1)}}
    for(const [y,x,sp,cls] of items){const N=sp.width,X0=x-sp.ax,Y0=y-sp.ay;for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*N+i,t=sp.a[a];if(!t)continue;const q=(Y0+j)*W+X0+i,o=q*4,low=S[q]&7;
      if(ZO[q]&&Y0+j+ZO[q]-1>y)continue;
      if(t===2){if(low===cls)continue;D[o]=NV[0];D[o+1]=NV[1];D[o+2]=NV[2]}else{D[o]=sp.rgb[a*3];D[o+1]=sp.rgb[a*3+1];D[o+2]=sp.rgb[a*3+2]}S[q]=(S[q]&~15)|cls;ZO[q]=0;touch(q,1)}}
    lap('stand');out.ms=performance.now()-t0;out.t=T.join(', ');return out};
})(window.PX=window.PX||{});
