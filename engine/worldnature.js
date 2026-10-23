'use strict';
/* ---------- PX engine: the world map's nature (trees, woods, hills, mountain ranges, small things) ---------- */
// The world map's natural art in the engine's style, on 16-px tiles: hue-shifted 4-tone ramps (highlights warm, shadows cool),
// lit from the upper left (a broad lit side, a narrow shade on the right and below), a dark navy outline (#1a1c26) round
// silhouettes only, a ground shadow to the lower right. Sprites sit in power-of-two boxes (8, 16, 32, 64; the drawn pixels may be
// smaller), their foot on (ax, ay). Variety comes from structure (species, shapes; seeded), never Math.random.
// PX.worldTree(clim,sp,v,dim): a tree in a 16 box (oak, birch, pine, a bare tree, a broken snag; snowy pine, fir, a bare birch; bog
//   willow, mangrove, mossy oak, dead tree; palm, acacia; willow), v 0-3 its shape, dim 1 one deep in a wood (darker and cooler).
//   Which grow where: PX.WORLD_TREES (each climate's woods and the fen's, by weight), PX.WORLD_SPECIES (each climate's species).
// PX.worldPeak(clim,v,n,kind): a mountain alone in an n box (16 a crag or spire, 32 and 64 a massif), v 0-5: drawn as the ranges
//   are (kind: one of PX.WORLD_MOUNTS, else its climate's look; a forested one its wood's floor, no trees: a tree is 16 px).
// PX.worldRange(o): mountain ranges as the battle's (ground.js rockMasses): each mass of rock tiles a height field (fluted cones on
//   some of its tiles, as high as the tile lies deep in the range, over a lower body, steep at its edge; sandstone buttes in the
//   desert; a spire if it is one or two tiles), drawn front to back a column at a time, each ground point (x, y) at height z at
//   (x, y-z), so the peaks rise up the screen over what lies behind; half-Lambert lit from the left, darker toward the foot, its
//   own shadow and one cast on the ground to the lower right; granite with tufts and lichen, snow above a ragged line (the frost,
//   and the high peaks elsewhere), strata of ochre and red (desert), moss (swamp); a navy outline round the silhouette and a deep
//   contour along each crest standing before the rock behind. Never over kept-clear ground: a peak is lowered rather than rise
//   over a road or water behind it. On the generated world each range is of a kind drawn from its climates' pools (PX.WN_MOUNT.pool:
//   the original look, the climate's own rock as today's map, and PX.WORLD_MOUNTS: sandstone buttes, granite, basalt, alpine peaks,
//   forested low mountains, the swamp's knolls; PX.worldMountKind), its look, trees, snow and foot blended across a climate's edge by
//   the climates' covers; a forested range wooded with the world's own trees standing on its slopes (PX.WN_MOUNT.trees).
/// PX.worldHill(clim,v,opts): a rise, a height bump in a 32 box (the gallery's: on the map a group of hill tiles is one rise, PX.WN_HILL), shaded as ground (soft edges,
//   lit upper-left slopes, cool shade, a soft shadow to the lower right), tufts, strata, snow or moss by climate. opts.edge is kept
//   for cliffs (a later feature: the sides a face would drop on, E 1, S 2, W 4, N 8, as ground.js's wall); today nothing reads it.
// PX.worldDecor(clim,kind,v): the small things (PX.WORLD_DECOR: each climate's), in 8 or 16 boxes; the flat ones (flowers, tufts,
//   drifts, ripples, reeds, moss, pools, bones, mushrooms, oasis green, pads, floes) lie on the ground, unoutlined, shadowless.
// PX.worldCrop(kind,clim,v,o): a farm's plot, its crop in rows of plants (PX.WORLD_CROPS), flat; PX.worldCropThing(kind,v): what
//   stands on it (stook, haystack, fruit tree), outlined (fields, below).
// Every sprite is a canvas with ax, ay (its foot), box (its drawn pixels), flat, and for the painter a (a byte a pixel: 1 body,
//   2 outline), rgb, sh (its shadow: offsets from the foot).
// PX.worldNature(spec): all of it over a painted map, in depth order. spec: {D (the map's RGBA pixels), W, H (px), C, R (tiles of
//   ts px, 16), kind (a byte a tile: PX.WN_KIND, the game's own codes), clim (a byte a tile: 0 grass, 1 frost, 2 desert, 3 swamp),
//   clear (where nothing may stand: roads, holdings, estates: a PX.TileMask, or a byte a pixel), seed, snow (optional: the snow's
//   cover a tile, 0-1: drifts only where it lies whole), cover (optional: {desert, swamp}, each climate's cover a tile, 0-1, as the
//   map's ground blends them: the small things across its edge mixed by it, PX.WN_MIX), eco (optional: {frost, desert, swamp},
//   each a float a tile, -1 to 1, how far the land leans toward that climate: the trees' ecotone, PX.WN_ECO), touch (optional: a
//   byte a pixel, set to 1 where nature drew on land, 2 where it drew on water, 3 where it toned kept-clear ground: a hill's shading
//   under a road or a yard, a brook crossing a road, a wood's floor and its trees' crowns by a path through it or a road's verge),
//   4 where a wood's tree's crown leans over the shore (PX.WN_WOOD.shore), wet (optional:
//   (x, y) => is that map pixel drawn as water; pads and floes only there), round (optional: the water's shores are curves: a land
//   tile's corner between two waters kept clear too); the generated world's (optional): flow, river and water (its brooks), lane (a
//   byte a tile: the roads through woods, PX.WN_LANE), road ((x, y) => how far inside a way's band, PX.WN_LANE), oases and ponds
//   ({x, y, r, ring, kind, big, farm, tiles} each: PX.WN_RING), mount ({elev, temp, moist, rough} a byte a tile: the ranges'
//   kinds; with it the ranges blend by the covers)}. Woods darken their floor and stand as
//   one mass (outlined round its edge only, deeper trees dimmer; the swamp's forest a bog: fewer trees over peat pools; each tile a
//   full stand, PX.WN_WOOD), its floor's shade and a fringe of undergrowth and trees thinning out over the open ground round it
//   (PX.WN_FRINGE); hills shade the ground, a group of hill tiles one rise (PX.WN_HILL); ranges rise; small things lie and stand on the open; palms by
//   desert water. Nothing on clear ground, a beach (3 px of land along water) or water (but pads and floes on water). Returns its
//   counts and timings. Same spec, same picture. A big map is painted a window at a time instead (a chunk: the game's world map):
//   PX.worldNaturePlan(spec) once, then PX.worldNaturePaint(plan, win, D, TO) or its steps, PX.worldNatureSteps, for each window
//   (the painter, below); stitched, the windows are the one picture PX.worldNature paints.
(function(PX){
  const CLIMS=['grass','frost','desert','swamp'],NAVY='#1a1c26';
  // (ford: a river's ford, painted as open ground until the river art comes, doc/WORLD_DESIGN.md §15.2.2 wave 2)
  PX.WN_KIND={open:0,forest:1,hill:2,water:3,road:4,mount:5,ford:6};
  const hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  const RP=c=>(PX.GROUND_PAL[c]||PX.GROUND_PAL.grass);
  const mixA=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

  /* palettes: leaf ramps light (warm) to deep (cool) by species; trunk lit, mid, shade; snow lit, mid, shade (blue); a deep tree's
     tones darker, its highlight softened, mixed toward DIM. Hills: lit and shade the ground leans toward (k: how far a step; lo the
     deepest step of shade, sh a cast shadow's steps: the grass's shade held light, the owner's fourth play-test: a hill's shade read
     as a swamp's wet ground);
     floor a wood's ground; tuft colours; bush the climate's bush */
  const LEAF={oak:['#9cb058','#6a9242','#426c3a','#28463a'],moak:['#94a058','#687a3e','#465a34','#2a3a30'],birch:['#c4c468','#96aa4c','#668840','#3e5c3a'],
    pine:['#78a05e','#4c7c4a','#305c44','#1e3a38'],spine:['#6a8c74','#46705e','#2e5048','#1c3438'],fir:['#628472','#3e665a','#2a4a46','#1c3036'],
    willow:['#a0a660','#748840','#506636','#30402e'],mangrove:['#56643a','#3a4a2e','#2a3828','#1a2420'],palm:['#bcc65e','#88a444','#5a7c38','#34522e'],dead:['#8a9a4a','#5e6e34','#3e4a2c','#2a3226'],
    bogwillow:['#626c3e','#465430','#323e2a','#202a24'],acacia:['#b4b462','#8a9446','#626e38','#3e4a2e'],bbirch:['#a08c90','#7a6870','#56484e','#3a3036']};
  LEAF.bare=LEAF.snag=LEAF.dead;
  const TRUNK={def:['#8e6a48','#624830','#3e3028'],birch:['#eee8d8','#c4beae','#8a8478'],dead:['#9a8a70','#6c5e4c','#463c36'],palm:['#c4a06a','#94744a','#62503a'],mangrove:['#6e5e4a','#4a3e32','#2e2824'],
    bare:['#8a7662','#5e4e40','#3c322c'],acacia:['#9a7a56','#6e5638','#46382a'],bogwillow:['#6a5c48','#4a4034','#2e2824']};
  TRUNK.bbirch=TRUNK.birch;TRUNK.snag=TRUNK.dead;
  const SNOW=['#fbfcff','#dce4f0','#aebcd2'],DIM='#1c2836',HANG=['#76825e','#525c44'];
  /* which trees grow where (the woods' and the trees standing alone by them; the fen's on the swamp's open ground): each climate's
     species, each [species, its weight where the grove noise is low, where it is high (groves: the temperate's pines, the frost's
     firs), more at a wood's edge], a tree picked by the weights there. A few leafless or dead in each (some 5-10%: the frost's bare
     birches, the odd bare or broken tree; the swamp's snags and dead trees nearer a fifth), more at a wood's edge. PX.WORLD_SPECIES: each climate's species (the gallery, the tests) */
  PX.WORLD_TREES={
    grass:{wood:[['oak',.52,.12,0],['birch',.24,.12,0],['pine',.16,.68,0],['bare',.05,.04,.08],['snag',.03,.04,.03]]},
    frost:{wood:[['spine',.52,.36,0],['fir',.37,.56,0],['bbirch',.08,.05,.06],['snag',.03,.03,.03]]},
    swamp:{wood:[['bogwillow',.34,.26,0],['mangrove',.36,.42,0],['moak',.14,.12,0],['snag',.09,.11,.06],['dead',.07,.09,.04]],fen:[['mangrove',.76,.64,0],['bogwillow',.16,.24,0],['snag',.08,.12,0]]},
    desert:{wood:[['palm',.6,.72,0],['acacia',.34,.23,0],['snag',.06,.05,.05]]}};
  PX.WORLD_SPECIES=Object.fromEntries(CLIMS.map(c=>[c,[...new Set(Object.values(PX.WORLD_TREES[c]).flat().map(e=>e[0]))]]));
  // (a tree from list L at grove noise g (0-1), r (0-1) its draw, edge: at a wood's edge)
  PX.pickWorldTree=(L,g,r,edge)=>{let n=0;for(const e of L)n+=e[1]+(e[2]-e[1])*g+(edge?e[3]:0);r*=n;for(const e of L){r-=e[1]+(e[2]-e[1])*g+(edge?e[3]:0);if(r<0)return e[0]}return L[L.length-1][0]};
  PX.WORLD_NATURE={
    grass:{hill:{lit:'#c8cc78',shade:'#2e4e36',k:[.15,.12],lo:-2,sh:.8},floor:'#2c4426',tuft:['#a2c062','#5e8c3a','#3e6a2e'],bush:'oak'},
    frost:{hill:{lit:'#ffffff',shade:'#8a98b8',k:[.22,.12]},floor:'#a6b2c4',tuft:['#d8c890','#ac9c6c','#857650'],bush:'spine'},
    desert:{hill:{lit:'#fae4aa',shade:'#a06a48',k:[.2,.16]},floor:'#a89656',tuft:['#c8b46a','#9a9450','#72703e'],bush:'scrub',green:['#a4b456','#7a9440','#56703a']},
    swamp:{hill:{lit:'#9a9e5c',shade:'#18241c',k:[.14,.15]},floor:'#232c1c',tuft:['#8a8e4c','#5e6a36','#3e4a26'],bush:'willow'}};
  PX.WORLD_DECOR={grass:['tuft','flowers','bush','stone','scree'],frost:['drift','stone','shrub','bush','scree'],desert:['ripple','cactus','stone','rock','bones','scrub','oasis','garden'],
    swamp:['pool','reeds','moss','mushroom','stump','bush'],water:['pad','floe']};
  const FLAT={tuft:1,flowers:1,drift:1,ripple:1,reeds:1,moss:1,pool:1,bones:1,mushroom:1,oasis:1,pad:1,floe:1,garden:1,scree:1};
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
  // grey moss hanging from a crown's underside (tones 14, 15): from about a share p of its columns, up to n px
  function hang(M,N,v,s,p,n){for(let x=1;x<N-1;x++){if(PX.hash(x,v,s+9)>=p)continue;let y0=-1;for(let y=N-1;y>=0;y--)if(M[y*N+x]>=1&&M[y*N+x]<=4){y0=y;break}if(y0<0)continue;
    const k=1+Math.floor(PX.hash(x,v,s+10)*n);for(let i=1;i<=k&&y0+i<N;i++)if(!M[(y0+i)*N+x])M[(y0+i)*N+x]=i===k?15:14}}
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
    else if(sp==='mangrove'){// (low and twisted: a broad, ragged crown of dark leaves on a short, bent trunk over arched stilt roots
      // splayed into the mud and water, grey moss hanging from the crown)
      const RT=[[[7,10,4,12,3,15],[8,10,11,12,12,15],[7,11,6,13,6,15],[8,11,9,13,9,15]],[[7,10,3,12,2,15],[8,10,12,12,13,14],[8,11,8,13,9,15]],
        [[7,10,5,12,4,15],[7,10,3,11,1,13],[8,10,10,12,11,15],[7,11,7,13,7,15]],[[7,10,4,11,2,14],[8,10,11,12,13,15],[7,11,5,13,5,15],[8,11,10,13,10,15]]][v];
      const bx=[[0,1,1,0],[1,1,0,0],[0,0,1,1],[1,0,0,1]][v];for(let y=8;y<=11;y++){M[y*N+7+bx[y-8]]=5;M[y*N+8+bx[y-8]]=7}
      for(const [x0,y0,x1,y1,x2,y2] of RT){line(M,N,x0,y0,x1,y1,x1<x0?5:6);line(M,N,x1,y1,x2,y2,x1<x0?6:7)}
      const o=[0,.5,-.5,.3][v],CL=[[8+o,6.6,3],[4.6+o,7.4,2.6],[11.4+o,7,2.6],[2.8+o,8.4,1.6],[13.2+o,8.2,1.7],[6.4+o,5.2,2.2],[9.8+o,5,2.2],[7+o*2,3.6,1.6]];
      clumps(M,N,v===1?CL.slice(0,5).concat([[8+o,5.2,2.4]]):v===3?CL.filter((c,k)=>k!==3):v===2?CL.filter((c,k)=>k!==7):CL,7,4,7,s);hang(M,N,v,s,.3,3)}
    else if(sp==='bogwillow'){// (a bog willow: a low, broad dome of dark leaves on a short trunk, roots splayed, strands of leaves
      // and grey moss hanging from it to the ground)
      for(let y=10;y<=15;y++){M[y*N+7]=5;M[y*N+8]=7}M[15*N+5]=6;M[15*N+6]=6;M[15*N+9]=7;M[15*N+10]=7;M[14*N+6]=5;M[14*N+9]=7;
      const o=[0,1,-1,0][v],CL=[[8,6.6,4.2],[4+o*.3,8,3.1],[12+o*.3,8,3.1],[8+o*.5,4,3],[2.2,9.8,1.6],[13.8,9.6,1.6]];
      clumps(M,N,v===2?CL.slice(0,4):v===3?CL.filter((c,k)=>k!==4):CL,7,4,6,s);
      for(let x=1;x<N-1;x++){if(PX.hash(x,v,s+2)<.35)continue;let y0=-1;for(let y=N-1;y>=0;y--)if(M[y*N+x]>=1&&M[y*N+x]<=4){y0=y;break}if(y0<0)continue;
        const n=2+Math.floor(PX.hash(x,v,s+3)*4),moss=PX.hash(x,v,s+4)<.22;for(let k=1;k<=n&&y0+k<N;k++)M[(y0+k)*N+x]=moss?(k===n?15:14):k===n?4:3}}
    else if(sp==='bare'||sp==='bbirch'){// (leafless: limbs forking from the trunk, twigs at their ends; a birch's white trunk marked
      // black under a fine dark crown of twigs; in the frost snow along their tops)
      const bb=sp==='bbirch',LB=[[[7,9,3,4],[8,8,12,3],[8,11,13,8],[7,7,7,2]],[[7,10,2,6],[8,9,11,4],[7,7,5,2],[8,6,10,2]],[[7,9,4,3],[8,10,13,6],[8,7,9,2]],[[7,11,3,8],[7,8,5,3],[8,8,12,5],[8,6,9,2]]][v];
      if(bb){for(let y=3;y<=15;y++){M[y*N+7]=5;M[y*N+8]=6;if((y*3+v)%4===0)M[y*N+7+(y&1)]=11}M[15*N+6]=6}else trunk(M,N,7,6,15);
      for(const [x0,y0,x1,y1] of LB){line(M,N,x0,y0,x1,y1,bb?2:x1<x0?5:6);for(const [a,b] of [[-1,-2],[1,-1]])line(M,N,x1,y1,x1+(x1<x0?a:-a),y1+b,bb?3:6)}
      if(clim==='frost')for(let y=2;y<N;y++)for(let x=1;x<N-1;x++){const t=M[y*N+x];if((t>=2&&t<=7)&&!M[(y-1)*N+x]&&PX.hash(x,y,s+5)>.55)M[(y-1)*N+x]=8}}
    else if(sp==='snag'){// (a broken dead tree: a stout grey trunk snapped off, its top jagged, a stub of a branch, roots at its foot;
      // moss on it in the swamp)
      const H=[6,8,5,9][v],sl=v&1;for(let y=H;y<=15;y++){M[y*N+6]=5;M[y*N+7]=6;M[y*N+8]=7}
      M[(H-1)*N+(sl?6:8)]=sl?5:7;M[(H-2)*N+(sl?6:8)]=sl?5:7;if(v>1)M[(H-1)*N+7]=6;M[15*N+5]=6;M[15*N+9]=7;
      if(v%2===0)line(M,N,8,H+3,11,H+1,7);else line(M,N,6,H+4,3,H+2,5);if(v===2)line(M,N,6,H+6,4,H+5,5);
      for(let y=H+1;y<15;y+=3)M[y*N+7]=11;if(clim==='swamp')for(let y=H+2;y<=15;y++)if(PX.hash(6,y,s)<.3)M[y*N+(PX.hash(7,y,s)<.5?6:8)]=12}
    else if(sp==='acacia'){// (an acacia: a thin, leaning trunk forking just under a flat, wide crown, lit along its top)
      const o=[0,1,-1,0][v],cy=[5,4,5,6][v],ln=[1,-1,1,0][v],tx=y=>7+Math.round((15-y)*ln/4);for(let y=cy+3;y<=15;y++){M[y*N+tx(y)]=5;M[y*N+tx(y)+1]=7}M[15*N+tx(15)-1]=6;
      const fx=tx(cy+3);line(M,N,fx,cy+3,fx-2+o,cy+1,5);line(M,N,fx+1,cy+3,fx+3+o,cy+1,7);
      const pads=v===3?[[5,cy,3.6],[11,cy-1,3.4]]:[[8+o*.5,cy,6.4]];
      for(let y=1;y<N;y++)for(let x=1;x<N-1;x++)for(const [px,py,rx] of pads){const d=((x+.5-px)/rx)**2+((y+.5-py)/2.1)**2;if(d>1-PX.hash(x,y,s)*.25)continue;
        const n=PX.hash(x,y,s+1);M[y*N+x]=y+.5<py-1?(n<.6?1:2):y+.5<py?(n<.25?1:2):y+.5<py+1?(n<.3?2:3):4}}
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
    const col=[null,...LD,...TR.map(D2),...SNOW.map(c=>dim?PX.mix(c,DIM,.12):c),'#3e3a38',D2(LEAF.dead[0]),D2(LEAF.dead[2]),...HANG.map(D2)];
    return CACHE[key]=build(N,M,col,8,15,false)};

  /* small things: 8 (or 16) boxes, the foot at the bottom middle (a garden: an oasis's plot, rows of crops on dark soil; scree:
     loose stones round a tarn) */
  PX.worldDecor=(clim,kind,v)=>{clim=PX.WORLD_NATURE[clim]?clim:'grass';v=((v|0)%4+4)%4;const key='d'+clim+kind+v;if(CACHE[key])return CACHE[key];
    const big=kind==='drift'||kind==='ripple'||kind==='pool'||kind==='floe'||kind==='cactus'||kind==='rock'||kind==='garden',N=big?16:8,M=new Uint8Array(N*N),s=v*29+kind.length*5+clim.length,P=RP(clim),Wn=PX.WORLD_NATURE[clim];
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
    else if(kind==='garden'){const w=10+(v&1)*2,h=7+(v>>1),x0=8-(w>>1),y0=15-h;for(let y=0;y<h;y++)for(let x=0;x<w;x++){if((x===0||x===w-1)&&(y===0||y===h-1))continue;const row=(y+v)%3,n=PX.hash(x,y,s);
        set(x0+x,y0+y,row===1?(n<.2?2:x%2?3:4):row===0&&n<.12?5:n<.5?1:2)}
      col=[null,'#6e5434','#5a4228',v===2?'#c8b04a':'#6a9a3e','#4e7a32','#8a6e44']}
    else if(kind==='scree'){const RK=P.rock.c;for(let k=0;k<5+v;k++){const x=1+Math.floor(PX.hash(k,v,s)*6),y=3+Math.floor(PX.hash(k,v,s+1)*5),t=PX.hash(k,v,s+2);set(x,y,t<.3?1:t<.7?2:3);if(t>.8)set(x+1,y,3)}
      col=[null,RK[1],RK[2],RK[3]]}
    else if(kind==='floe'){const w=5+v,hh=2+(v>>1);for(let y=0;y<hh+1;y++)for(let x=0;x<w;x++){if((x===0||x===w-1)&&(y===0||y===hh)&&PX.hash(x,y,s)>.3)continue;set(4+x,8+y,y===0?1:y===hh?3:2)}col=[null,'#ffffff','#e2eef8','#b6cde2']}
    return CACHE[key]=build(N,M,col,N>>1,N-1,flat)};
  /* fields: a farm's plot on the map (a tile, 16 x 16; the owner 2026-10-22: "can farmland have actual sprites, like crops and
     vegetables?"), its crop in rows lit from the upper left, the troughs between them bare soil (snow in them in the frost, water
     now and then in the swamp), and what stands on it. PX.WORLD_CROPS: each crop's tones (c0 unripe, c1 ripe: light, mid, deep;
     ripe, a later season's hook, mixes them), its rows' period (p, px) and whether they run across only (plants seen upright).
     The kinds: wheat, barley, rye (ears over stalks), veg (rows of cabbages, leeks and turnips), turnips, potato (leaves on earthed
     ridges), vines (on stakes, grapes), orchard (meadow under small fruit trees), flax (blue flowers), hay (a meadow mown into
     windrows, a haystack), herbs (rows of lavender, sage, marigold, camomile), irrigated (the desert's: green rows on wet soil, a
     water channel along them, date palms by it), fallow (stubble), grazed (the Ashgor's herd ground: grazed short, trodden bare).
     PX.WORLD_SOIL: each climate's soil. In the desert the meadows and herd ground lean dry (CROP_X.dry).
     PX.worldCrop(kind, clim, v, o): the plot's rows, a flat 16 sprite (a, rgb; tr a byte a pixel, 1 a trough; ch the channel's
       row, -1 none), v 0-3 (rows across or along, their offset), o {ripe 0-1 (1 as drawn), snow 0-1 (the frost's: in the troughs,
       a little on the crop), wet 0-1 (water in the troughs), terrace (the Karn's: a stone lip every 5 rows)}.
     PX.worldCropThing(kind, v): what stands on a plot, an 8 box, its foot at (4, 7): stook (sheaves stood up and tied), haystack,
       fruit (a small fruit tree, v 0-3: its fruit red, yellow, red, green-gold) */
  PX.WORLD_SOIL={grass:'#6e5434',frost:'#8a8070',desert:'#a07a48',swamp:'#4e4430'};
  PX.WORLD_CROPS={
    wheat:{pat:['.L.','LML','MDM','.D.','ttt'],st:1,c0:['#9cc05a','#76a040','#52803a'],c1:['#f6dc7c','#d8ae4c','#a07a36']},
    barley:{pat:['L.L','.L.','MLM','.D.','ttt'],st:2,c0:['#a8c468','#82a44a','#5a8240'],c1:['#f0e0a4','#cdb676','#9a8450']},
    rye:{pat:['L.','M.','M.','D.','tt'],st:1,c0:['#98b070','#748e54','#526c44'],c1:['#dccf9c','#ae9e6a','#7a6e4a']},
    veg:{rows:[['LM..','MMD.','.DD.','tttt'],['D.','M.','W.','tt'],['L.L','.M.','PB.','ttt']],st:2,across:1,c0:['#a8cc6a','#6a9a40','#3e6a30'],c1:['#a8cc6a','#6a9a40','#3e6a30']},
    turnips:{pat:['L.L','.M.','PB.','ttt'],st:1,across:1,c0:['#9ac462','#5e9a3c','#3e6a30'],c1:['#9ac462','#5e9a3c','#3e6a30']},
    potato:{pat:['.LM.','LMMD','MDDs','ssss','tttt'],st:2,across:1,c0:['#7aa64a','#56843a','#3a5e2e'],c1:['#8aa44a','#62803a','#44602e']},
    vines:{pat:['LMLML','MDMDM','G.D.G','..K..','ssKss','ttttt'],st:0,across:1,c0:['#8ab452','#5e8e3a','#3e6a30'],c1:['#9aae4e','#6e8a3a','#4a6630']},
    flax:{pat:['F.f','M.M','D.D','ttt'],st:1,across:1,c0:['#8ab45a','#6a9a4a','#4a7838'],c1:['#8ab45a','#6a9a4a','#4a7838']},
    herbs:{pat:['.H.','HhH','.M.','ttt'],st:1,across:1,c0:['#7aa452','#5e8a3e','#44683a'],c1:['#7aa452','#5e8a3e','#44683a']},
    irrigated:{pat:['.L.','LMD','.D.','ttt'],st:1,across:1,c0:['#8ac852','#62a43e','#447c34'],c1:['#9ac85a','#6aa840','#4a8036']},
    orchard:{c0:['#8cb456','#6e9a44','#527a36'],c1:['#94b456','#76984a','#587838']},
    hay:{c0:['#9cb85a','#80a04a','#62843c'],c1:['#c4c070','#a4a856','#7e8a44']},
    fallow:{c0:['#b8a070','#9a8458','#76643e'],c1:['#c4ac76','#a08a5a','#7a6640']},
    grazed:{c0:['#7e9a48','#66843c','#4e6a32'],c1:['#869c4a','#6a843e','#506a34']}};
  const CROP_X={grape:['#7a4a8a','#4e2e62'],unripe:'#9ab85a',cab:'#c4dc8a',leek:'#ecf0dc',bulb:['#ece4ea','#a85a9a'],flower:['#86a2e8','#b8c8f4'],hay:['#ead890','#b89a58'],
    herb:[['#b49ae0','#7e5eb0'],['#a8bc98','#6e8a62'],['#f4bc40','#c8862a'],['#f6f2e4','#d0caa8']],water:['#78b4e2','#4a86c0'],snow:'#e4eaf2',frost:'#d8e2ee',wet:[70,92,96],stone:['#a49c8c','#6a6458'],stub:'#6e5c3a',post:'#5a3e24',trod:'#8a7450',dry:[[214,196,120],[186,164,96],[150,128,76]]};
  // (rows of plants: a crop's pattern (pat; veg: rows, one a row of plants in turn) tiled along each row, a row of patterns shifted
  //  st px from the one before (the plants staggered); L, M, D its tones, s soil, '.' soil between plants, t a trough, W a leek's
  //  white, P and B a turnip's bulb, G grapes, K a stake, F and f flax's flowers, H and h a herb's flowers (a row's herb in turn);
  //  a plant now and then missing (gap) or a tone off)
  const CROP_GAP=.07;
  PX.worldCrop=(kind,clim,v,o)=>{o=o||{};kind=PX.WORLD_CROPS[kind]?kind:'wheat';clim=PX.WORLD_SOIL[clim]?clim:'grass';v=((v|0)%4+4)%4;const CR=PX.WORLD_CROPS[kind];
    const q=x=>Math.round(Math.max(0,Math.min(1,x))*10)/10,ripe=q(o.ripe==null?1:o.ripe),snow=q(o.snow||0),wet=q(o.wet||0),ter=o.terrace?1:0,key='f'+kind+clim+v+ripe+snow+wet+ter;if(CACHE[key])return CACHE[key];
    const N=16,a=new Uint8Array(N*N).fill(1),rgb=new Uint8Array(N*N*3),tr=new Uint8Array(N*N),s=v*37+kind.length*11+clim.length,X=CROP_X,H=(x,y,k)=>PX.hash(x,y,s+k);
    const pal=CR.c0.map((c,i)=>mixA(mixA(hx(c),hx(CR.c1[i]),ripe),CROP_X.dry[i],clim==='desert'&&!CR.pat&&!CR.rows?.45:0)),soil=hx(PX.WORLD_SOIL[clim]),dark=mixA(soil,[30,24,20],.3),lite=mixA(soil,[230,210,170],.18),across=CR.pat||CR.rows||ter||v&1,off=v>>1,ch=6+off*2;
    const grape=mixA(hx(X.unripe),hx(X.grape[0]),ripe),RW=CR.rows||(CR.pat?[CR.pat]:null);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=across?y:x,w=across?x:y,n=H(x,y,1),i=y*N+x;let c=pal[1],t=0;
      if(RW){// (a row of plants)
        const ph=RW[0].length,rb=Math.floor((u+off)/ph),pat=RW[(rb+v)%RW.length],pu=(u+off)%ph,pw=pat[0].length,ws=w+rb*(CR.st||0)+off*3,pi=Math.floor(ws/pw);let L=pat[pu][ws%pw];
        if(kind==='irrigated'&&(u===ch-1||u===ch||u===ch+1||u===ch+2))L=u===ch?'w':u===ch+1?'v':'b';
        else if(L!=='t'&&L!=='s'&&L!=='K'&&PX.hash(pi,rb,s+6)<CROP_GAP)L='.';
        const m=n<.12?1:0;
        switch(L){case 'L':c=m?pal[1]:pal[0];break;case 'M':c=m?pal[0]:pal[1];break;case 'D':c=pal[2];break;case 's':c=lite;break;case '.':c=soil;t=1;break;case 't':c=dark;t=2;break;
          case 'W':c=hx(X.leek);break;case 'B':c=hx(X.bulb[0]);break;case 'P':c=hx(X.bulb[1]);break;case 'G':c=grape;break;case 'K':c=hx(X.post);break;
          case 'F':c=ripe>.5?hx(X.flower[0]):pal[0];break;case 'f':c=ripe>.5?hx(X.flower[1]):pal[1];break;
          case 'H':case 'h':{const hb=X.herb[(rb+v)%4];c=hx(hb[L==='H'?0:1]);break}
          case 'w':c=hx(X.water[0]);break;case 'v':c=hx(X.water[1]);break;case 'b':c=mixA(dark,[20,30,40],.25);break}
        if(kind==='veg'&&L==='L'&&pat===RW[0])c=hx(X.cab)}
      else if(kind==='hay'){// (a meadow mown into windrows: gently bending lines of hay, their lee in shade, the stubble between)
        const k=(y+off+5+Math.round(Math.sin(x/3+v)*1.2))%5;c=k===0?hx(X.hay[n<.2?1:0]):k===1?hx(X.hay[1]):n<.25?pal[0]:n>.85?pal[2]:pal[1]}
      else if(kind==='fallow'){c=n<.12?hx(X.stub):n<.4?pal[0]:n<.8?pal[1]:pal[2];t=1}
      else if(kind==='grazed'){const m=PX.hash(x>>2,y>>1,s+5);c=m<.22?(n<.5?hx(X.trod):mixA(hx(X.trod),pal[2],.4)):n<.15?pal[2]:n>.85?pal[0]:pal[1]}
      else c=n<.2?pal[0]:n>.85?pal[2]:pal[1];// (the orchard's meadow)
      if(ter&&(u+off)%5===4){c=hx(X.stone[n<.6?0:1]);t=0}else if(ter&&(u+off)%5===0)c=mixA(c,[24,20,18],.3);
      if(t&&snow&&H(x,y,2)<snow*(t>1?.85:.3))c=hx(X.snow);else if(!t&&snow&&kind!=='irrigated'&&H(x,y,3)<snow*.1)c=hx(X.frost);else if(t&&wet&&H(x,y,4)<wet*.3)c=X.wet;
      rgb[i*3]=c[0];rgb[i*3+1]=c[1];rgb[i*3+2]=c[2];tr[i]=t?1:0}
    const sp=finish(N,a,rgb,8,15,true);sp.tr=tr;sp.ch=kind==='irrigated'?ch:-1;sp.kind=kind;return CACHE[key]=sp};
  PX.worldCropThing=(kind,v)=>{v=((v|0)%4+4)%4;const key='ft'+kind+v;if(CACHE[key])return CACHE[key];const N=8,M=new Uint8Array(N*N),set=(x,y,t)=>{if(x>0&&y>0&&x<N-1&&y<N)M[y*N+x]=t};let col;
    if(kind==='haystack'){for(let y=2;y<7;y++)for(let x=1;x<7;x++){const d=((x+.5-4)/3)**2+((y+.5-6)/4)**2;if(d>1)continue;set(x,y,x+y<7?1:x>4||y>5?3:2)}for(let x=2;x<6;x++)set(x,7,4);set(4,1,2);col=[null,'#f0dc94','#cba85c','#8e7438','#6a5430']}
    else if(kind==='fruit'){clumps(M,N,[[4,3.4,2.6],[2.8,4.2,1.6],[5.2,4,1.7]],3,2.5,3,v*13+5);for(let i=0;i<N*N;i++)if(M[i]>=1&&M[i]<=3&&PX.hash(i,v,91)<.2)M[i]=6;set(4,6,5);set(4,7,5);
      col=[null,'#9cc05e','#6e9a44','#4a7438','#36562e','#6a4a30',['#d8463a','#e8c440','#e05a3a','#c8c450'][v]]}
    else{for(let y=2;y<8;y++){const w=y<3?0:1;for(let x=4-w;x<=4+w;x++)set(x,y,x<4?1:x===4?2:3)}for(let x=3;x<6;x++)set(x,5,4);// (a stook: sheaves stood up, tied)
      col=[null,'#f2d880','#cfa850','#9a7836','#8a6a30']}
    return CACHE[key]=build(N,M,col,4,7,false)};

  /* mountains: masses of rock tiles, each a height field drawn in projection (see PX.worldRange above). o: {W, H (px), C, R, ts,
     ox, oy (the tiles' grid on the pixels), h(i,j) (a tile's rock height in px, 0 none), clim(i,j) (its climate), kept(x,y) (kept
     clear: no rock stands there, nor rises over it), seed, shade (cast its shadow on the ground), wob}. massLabel finds the masses
     (numbered by their first tile in scan order); massSteps reckons one's height field over its box (the same whatever window is
     painted, so the plan keeps it); massPaint paints a mass into a window w: {x, y, w, h (px), D (its RGBA), S (a byte a pixel: low
     bits what stands there, 128 kept clear; set to 2 where rock stands), ZO (a byte a pixel: the rock's lift there +1, read by
     whatever is drawn after so the rock stays before what lies behind it), TO (touch), I (the rect its rock pixels are counted in)}.
     Every step is per pixel, but the outline, which reads its four neighbours: a window is exact but for its edge (PX.WN_APRON).
     Seeded noise read through value lattices; never Math.random */
  // (a value lattice read between its points, each point's hash reckoned when read: the values a Float32 lattice over the whole
  //  map holds, at no memory)
  const noiseF=(W,H,step,s)=>(x,y)=>{const gx=Math.min(W-1,Math.max(0,x))/step,gy=Math.min(H-1,Math.max(0,y))/step,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
    const a=Math.fround(PX.hash(ix,iy,s)),b=Math.fround(PX.hash(ix+1,iy,s)),c=Math.fround(PX.hash(ix,iy+1,s)),d=Math.fround(PX.hash(ix+1,iy+1,s));
    return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy};
  // (a smooth noise over the plane by a plan's hash h: its values at whole steps eased between)
  const tileNoise=(h,x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),w=yf*yf*(3-2*yf),a=h(xi,yi,s),b=h(xi+1,yi,s),c=h(xi,yi+1,s),d=h(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w};
  const PALR={};
  /* the mountains' kinds (the owner's fifth play-test: more than one look; the generated world's ranges, spec.mount; a climate's own
     look on today's map): each its rock (c: five tones, lit to deep; s its own snow, m moss, b strata, g lichen, f a wood's canopy,
     lit to deep, r rust), h its height (a share of the range's), its peaks' slope (ps), ridges ([fewest, most]), crag (how rough its
     crests and faces), edge (how steep its foot), snow (where its own snow begins, a share of its height), wood (its trees up to this
     share of its height), scree (a butte's talus fan: [px high at most, a share of its height]), tone (its shading swung by a broad
     noise either way), wob (its foot's wobble, times the range's: round, not its tiles' box). sandstone: flat-topped buttes and
     mesas, banded red and ochre, sheer, scree fans at their feet; granite: craggy, bare, pale grey, cracked; basalt: dark, jagged,
     columns down its faces, rust; alpine: tall, snow-capped; forested: low and round, the world's trees standing up its flanks over
     a wood's floor (f, lit to deep; PX.WN_MOUNT.trees), bare rock on its steepest faces, crags and crest; knoll: low, round, mossy,
     dark. The original look (classic, PX.WN_MOUNT.pool) is none of these: each climate's own rock, as on today's map */
  PX.WORLD_MOUNTS={
    sandstone:{rock:{c:['#f2cc92','#d8a066','#b4744a','#86523a','#5a362c'],b:['#c8644a','#f6dcaa','#9a5838']},h:1,scree:[6,.32],tone:.08},
    granite:{rock:{c:['#e2e0d8','#bcbab2','#94938e','#6c6c70','#46464e'],g:['#8a9a5a','#6a7a44','#4e5c36']},h:1,ps:1.15,ridges:[4,5],crag:1.7,edge:1.1,tone:.06},
    basalt:{rock:{c:['#7a7682','#58546a','#403d4c','#2c2a36','#1a1822'],r:['#a0503a','#6a3a2e']},h:.95,ps:1.4,ridges:[5,5],crag:2.4,edge:1.4,tone:.05},
    alpine:{rock:{c:['#d8dee8','#a8b0c2','#7c849a','#586078','#3a4056'],s:['#fafcff','#dce6f2','#b2c2da']},h:1.15,ps:1.25,ridges:[3,5],crag:1.2,edge:1.1,snow:.34,tone:.05},
    forested:{rock:{c:['#b4b29e','#8e8e7c','#6c6e60','#4e5248','#32362e'],f:['#5e7440','#485c34','#36482a','#263420']},h:.85,ps:.7,ridges:[3,4],crag:.6,edge:.8,wood:.74,tone:.06,wob:1.6},
    knoll:{rock:{c:['#8a8c7c','#686c60','#4e5448','#383e34','#22281f'],m:['#66763a','#4a5a2c','#34421f']},h:.7,ps:.9,ridges:[3,4],crag:1,edge:.9,tone:.04,wob:1.5}};
  const KINDS=Object.keys(PX.WORLD_MOUNTS),PNAMES=CLIMS.concat(KINDS);
  /* the generated world's ranges (spec.mount; the owner's fifth play-test notes: some kinds liked as they were, some as new, so the
     original look kept as a kind of its own and all of them a pool). pool: each climate's kinds, [kind, weight, gate], classic the
     original look (the climate's own rock) in every climate's; a kind with a gate only where the range's fields there allow it
     (cold: colder than cold.temp or higher than cold.elev; wet: wetter than wood.moist and lower than wood.elev; low: lower than
     wood.elev; high: higher than it). jit: the climates' covers read this many px off a point, by a noise (a ragged blend); blend:
     a cover's weight from 0 at blend[0] to 1 at [1] (as PX.WN_BLEND, but a mountain's tiles lie in one climate: its edge's covers
     reach some .45 into the next, and the rock leans that far toward its look). foot: the
     rock's lowest [px] leaning toward the ground under it (a share at most), so it meets each climate's ground as painted. trees: a
     forested range's (PX.WORLD_MOUNTS.forested) on a lattice of step px (jit either way, gap the chance a spot is empty, fewer by the
     forested look's share across an edge), on slopes gentler than steep (the normal's z), under its tree line (the kind's wood, a
     share of its height, ragged by line either way), on no crest (a point higher than the mean of the points crest[0] px round it by
     crest[1] px); each a
     conifer (up, by the climate whose tree it is) with a chance from none at conifer[0] of the height to all at [1], else one of
     that climate's woods' (sub: none of the lowland's palms or mangroves); lit with the slope (light: lit, the slope's light where
     its colours are as drawn; below it darker toward dark, by k, dim under dim; above it toward light) */
  PX.WN_MOUNT={jit:28,blend:[.12,.62],cold:{temp:58,elev:240},wood:{moist:35,elev:228},
    pool:{grass:[['classic',4],['granite',3],['forested',3,'wet'],['alpine',2,'cold'],['basalt',.35]],
      frost:[['classic',4],['alpine',4],['granite',1],['forested',1.5,'low']],
      desert:[['classic',4],['sandstone',4],['basalt',.35]],
      swamp:[['classic',4],['knoll',4],['forested',2,'high']]},
    foot:[5,.55],
    trees:{step:[6,5],jit:2,gap:.3,steep:.5,line:.1,crest:[4,.9],conifer:[.45,.9],up:{grass:'pine',frost:'fir',swamp:'pine',desert:'pine'},sub:{palm:'acacia',mangrove:'bogwillow'},
      light:{lit:.62,k:2,dim:.52,max:.7,dark:[20,30,46],light:[220,226,150],up:.12}}};
  const MGATE={cold:f=>f.temp<PX.WN_MOUNT.cold.temp||f.elev>PX.WN_MOUNT.cold.elev,wet:f=>f.moist>PX.WN_MOUNT.wood.moist&&f.elev<PX.WN_MOUNT.wood.elev,
    low:f=>f.elev<PX.WN_MOUNT.wood.elev,high:f=>f.elev>PX.WN_MOUNT.wood.elev};
  // PX.worldMountPool(c, f): the kinds a range may be in climate c, by the world's fields there (f: the means over its tiles of that
  // climate of elev, temp, moist, rough, 0-255); PX.worldMountKind(c, f, r): the one a draw r (0-1) falls on, by their weights
  PX.worldMountPool=(c,f)=>(PX.WN_MOUNT.pool[c]||PX.WN_MOUNT.pool.grass).filter(e=>!e[2]||MGATE[e[2]](f));
  PX.worldMountKind=(c,f,r)=>{const L=PX.worldMountPool(c,f);let n=0;for(const e of L)n+=e[1];r*=n;for(const e of L){r-=e[1];if(r<0)return e[0]}return L[L.length-1][0]};
  // (a climate's or a kind's rock: its tones and details, for massPaint)
  const rpal=c=>PALR[c]||(PALR[c]=(()=>{const KD=PX.WORLD_MOUNTS[c]||null,RK=KD?KD.rock:RP(c).rock,X=a=>a?a.map(hx):null;
    return{RC:RK.c.map(hx),SN:RK.s?RK.s.map(hx):c==='desert'||KD&&!KD.crag||c==='knoll'||c==='forested'?null:SNOW.map(hx),own:!!RK.s,MS:X(RK.m),RB:X(RK.b),GT:X(RK.g),FO:X(RK.f),RU:X(RK.r),desert:c==='desert'||c==='sandstone',K:KD}})());
  const SK=1.6,LSX=-.92,LSY=-.38,LX=-.6,LY=0,LZ=.8,LN_=Math.hypot(LX,LY,LZ),SHC=[18,26,42];
  const massNoise=o=>o.N||(o.N={NX:noiseF(o.W,o.H,8,o.seed|0),NY:noiseF(o.W,o.H,8,(o.seed|0)+1),NR1:noiseF(o.W,o.H,15,(o.seed|0)+80),NR2:noiseF(o.W,o.H,7,(o.seed|0)+81),NT:noiseF(o.W,o.H,5,(o.seed|0)+82)});
  const massLabel=(C,R,h,clim)=>{const lab=new Int32Array(C*R).fill(-1),M=[];
    for(let q0=0;q0<C*R;q0++){if(lab[q0]>=0||!h(q0%C,(q0/C)|0))continue;const id=M.length,m={id,q0,c0:C,c1:-1,r0:R,r1:-1,n:0,c:clim(q0%C,(q0/C)|0)},st=[q0];lab[q0]=id;
      while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;m.n++;if(i<m.c0)m.c0=i;if(i>m.c1)m.c1=i;if(j<m.r0)m.r0=j;if(j>m.r1)m.r1=j;
        for(const [a,c] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+c,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&lab[n]<0&&h(x,y)){lab[n]=id;st.push(n)}}}M.push(m)}
    return{lab,M}};
  // (a mass's height at a point (0 off it); whether a point at height z0 lies in its own shadow (tested every st px toward the light);
  //  whether a forested look's wood grows on a point at height z, its slope's normal nz (PX.WN_MOUNT.trees: not steep, under the tree
  //  line, on no crest): the trees and the floor under them alike)
  const mzAt=(md,x,y)=>x<md.x0||y<md.y0||x>=md.x1||y>=md.y1?0:md.ZR[(y-md.y0)*md.bw+x-md.x0];
  const mShade=(md,x,y,z0,st)=>{for(let k=2;k<=md.K;k+=st){const qx=Math.round(x+LSX*k),qy=Math.round(y+LSY*k);if(qx<md.x0||qy<md.y0)return false;if(mzAt(md,qx,qy)>z0+k*SK)return true}return false};
  const woodAt=(md,x,y,z,nz,NT)=>{const T=PX.WN_MOUNT.trees;if(nz<T.steep||z>md.zmax*(PX.WORLD_MOUNTS.forested.wood+(NT(x+90,y)-.5)*2*T.line))return false;
    const c=T.crest[0];return z-(mzAt(md,x-c,y)+mzAt(md,x+c,y)+mzAt(md,x,y-c)+mzAt(md,x,y+c))/4<T.crest[1]};
  // (a mass's kind (m.kind, or o.kind for a peak alone; none or classic: its climate's look, today's map) sets its shape. Each
  //  point's look: on today's map its tile's climate's; on the generated world (m.kinds) each climate's kind there (classic: the
  //  climate's own look) by the climates' weights at the point (their covers, o.cv, read a little off it: PX.WN_MOUNT.jit px by the
  //  wobble's noise), the two most weighed kept (CL, CL2) and the second's share (CT, 0-255), so a range blends across a climate's
  //  edge as the ground does. A forested look's trees (o.tree: a sprite for a point, its height's share and light) stand on it)
  function* massSteps(o,lab,m){const W=o.W,H=o.H,C=o.C,R=o.R,ts=o.ts,ox=o.ox||0,oy=o.oy||0,seed=o.seed|0,kept=o.kept,id=m.id,{NX,NY,NR1,NR2,NT}=massNoise(o);
    const kind=PX.WORLD_MOUNTS[m.kind]?m.kind:o.kind||null,KD=kind?PX.WORLD_MOUNTS[kind]:null,wob=(KD&&KD.wob||1)*(o.wob||5),MK=m.kinds||null,ki=kind?PNAMES.indexOf(kind):-1,JT=PX.WN_MOUNT.jit;
    const x0=Math.max(0,ox+m.c0*ts-6),x1=Math.min(W,ox+(m.c1+1)*ts+6),y0=Math.max(0,oy+m.r0*ts-6),y1=Math.min(H,oy+(m.r1+1)*ts+6),bw=x1-x0,bh=y1-y0;if(bw<=0||bh<=0)return null;
    const small=m.n<=2,A=new Uint16Array(bw*bh),HV=new Float32Array(bw*bh),ZR=new Float32Array(bw*bh),CL=new Uint8Array(bw*bh),gi0=m.c0-1,gj0=m.r0-1,gw=m.c1-m.c0+3,gh=m.r1-m.r0+3,GI=new Float32Array(gw*gh),GH=new Float32Array(gw*gh);
    for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const ci=gi0+i,cj=gj0+j;if(ci>=0&&cj>=0&&ci<C&&cj<R&&lab[cj*C+ci]===id){GI[j*gw+i]=1;GH[j*gw+i]=o.h(ci,cj)}}
    // (the generated world's: each climate's look (LK), the covers at the tile corners over its box (CG: each the mean of the 4 tiles
    //  round it, as the painter's), a point's climates' weights (wq: PX.WN_MOUNT.blend; without covers its tile's climate's) and looks'
    //  (LW))
    let CL2=null,CT=null,LK=null,CG=null;const WQ=new Float32Array(4),LW=new Float32Array(PNAMES.length),BL=PX.WN_MOUNT.blend,cw1=gw+1;
    if(MK){CL2=new Uint8Array(bw*bh);CT=new Uint8Array(bw*bh);LK=CLIMS.map(c=>PNAMES.indexOf(!MK[c]||MK[c]==='classic'?c:MK[c]));
      if(o.cv)CG=o.cv.map(S=>{if(!S)return null;const G=new Float32Array(cw1*(gh+1));for(let j=0;j<=gh;j++)for(let i=0;i<=gw;i++){let s=0,n=0;
        for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const u=gi0+i+a,v=gj0+j+b;if(u<0||v<0||u>=C||v>=R)continue;s+=S[v*C+u];n++}G[j*cw1+i]=n?s/n:0}return G})}
    const wq=(X,Y)=>{const u=(X-ox)/ts-gi0,v=(Y-oy)/ts-gj0,i=Math.max(0,Math.min(gw-1,Math.floor(u))),j=Math.max(0,Math.min(gh-1,Math.floor(v))),fx=Math.min(1,Math.max(0,u-i)),fy=Math.min(1,Math.max(0,v-j)),q=j*cw1+i;
      const tc=CLIMS.indexOf(o.clim(Math.floor((X-ox)/ts),Math.floor((Y-oy)/ts)));let s=0;
      for(let k=1;k<4;k++){const G=CG&&CG[k];let w;if(G){const a=G[q],b=G[q+1],c=G[q+cw1],d=G[q+cw1+1];w=Math.max(0,Math.min(1,(a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy-BL[0])/(BL[1]-BL[0])))}else w=tc===k?1:0;WQ[k]=w;s+=w}
      if(s>1){for(let k=1;k<4;k++)WQ[k]/=s;s=1}WQ[0]=1-s};
    // (1) its footprint: its tiles read through a wobble, kept-clear pixels left out; the distance in from its edge (chamfer 3-4);
    //     each point's tile height (bilinear) and look
    for(let y=y0;y<y1;y++){for(let x=x0;x<x1;x++){if(kept(x,y))continue;const u=(x-ox+.5+(NX(x,y)-.5)*wob)/ts-.5-gi0,v=(y-oy+.5+(NY(x,y)-.5)*wob)/ts-.5-gj0,iu=Math.floor(u),iv=Math.floor(v);if(iu<0||iv<0||iu>=gw-1||iv>=gh-1)continue;
        const fu=u-iu,fv=v-iv,q=iv*gw+iu,a=GI[q],b=GI[q+1],c=GI[q+gw],d=GI[q+gw+1],w=a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv;
        if(w>.42){const e=GH[q],f=GH[q+1],g=GH[q+gw],h=GH[q+gw+1],k=(y-y0)*bw+x-x0;A[k]=999;HV[k]=(KD?kind==='sandstone':m.c==='desert')?(fu<.5?(fv<.5?e:g):(fv<.5?f:h))||Math.max(e,f,g,h):(e+(f-e)*fu+(g-e)*fv+(e-f-g+h)*fu*fv)/w;
          if(MK){wq(x+(NX(x+211,y+97)-.5)*JT,y+(NY(x+97,y+211)-.5)*JT);LW.fill(0);for(let c2=0;c2<4;c2++)LW[LK[c2]]+=WQ[c2];let la=-1,lb=-1;
            for(let c2=0;c2<4;c2++){const l=LK[c2];if(l===la||l===lb||!(LW[l]>0))continue;if(la<0||LW[l]>LW[la]){lb=la;la=l}else if(lb<0||LW[l]>LW[lb])lb=l}
            if(la<0)la=LK[0];CL[k]=la;CL2[k]=lb<0?la:lb;CT[k]=lb<0?0:Math.round(255*LW[lb]/(LW[la]+LW[lb]))}
          else CL[k]=ki>=0?ki:CLIMS.indexOf(o.clim(Math.floor((x-ox)/ts),Math.floor((y-oy)/ts)))}}
      if(!((y-y0+1)&31))yield}
    for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const k=y*bw+x;if(!A[k])continue;A[k]=Math.min(A[k],x?A[k-1]+3:3,y?A[k-bw]+3:3,x&&y?A[k-bw-1]+4:4,y&&x<bw-1?A[k-bw+1]+4:4)}
    for(let y=bh-1;y>=0;y--)for(let x=bw-1;x>=0;x--){const k=y*bw+x;if(!A[k])continue;A[k]=Math.min(A[k],x<bw-1?A[k+1]+3:3,y<bh-1?A[k+bw]+3:3,x<bw-1&&y<bh-1?A[k+bw+1]+4:4,y<bh-1&&x?A[k+bw-1]+4:4)}
    yield;
    // (2) its peaks: cones on some of its tiles, a tile and a half apart or more, each as high as its tile (the first the highest,
    //     the rest a little lower), its flanks fluted into three to five ridges by angle; reckoned on a 2-px lattice and read between
    const desert=KD?kind==='sandstone':m.c==='desert';let PZ=null,pw=0;
    if(!small&&!desert){const Rk=PX.dice(PX.rng(seed*13+id*101+7)),cand=[],PK=[];for(let j=m.r0;j<=m.r1;j++)for(let i=m.c0;i<=m.c1;i++)if(lab[j*C+i]===id)cand.push([i,j]);
      for(let k=cand.length-1;k>0;k--){const r=Rk.int(0,k),t=cand[k];cand[k]=cand[r];cand[r]=t}
      cand.sort((a,b)=>o.h(b[0],b[1])-o.h(a[0],a[1]));
      for(const [i,j] of cand){if(PK.length>=Math.max(2,Math.round(m.n/2.6)))break;const px=ox+(i+.5)*ts+Rk.int(-4,4)*ts/16,py=oy+(j+.5)*ts+Rk.int(-4,4)*ts/16;if(PK.some(p=>Math.hypot(p.x-px,p.y-py)<ts*1.45))continue;
        const f=Rk.R()*6.28;PK.push({x:px,y:py,h:o.h(i,j)*(PK.length?.7+.28*Rk.R():1),s:.85+.55*Rk.R(),n:3+Rk.int(0,2),cf:Math.cos(f),sf:Math.sin(f),e:1})}
      // (a kind's peaks: their slope, ridges and a stretch along their own axis (e), so no two side by side alike)
      if(KD)for(const p of PK){p.s*=KD.ps||1;p.n=Math.max(KD.ridges[0],Math.min(KD.ridges[1],p.n));p.e=.72+.56*Rk.R()}
      pw=(bw>>1)+2;const ph=(bh>>1)+2;PZ=new Float32Array(pw*ph);
      for(let j=0;j<ph;j++){for(let i=0;i<pw;i++){const x=x0+2*i,y=y0+2*j;let z=0;for(const p of PK){const dx=x-p.x,dy=(y-p.y)*1.15,r0=Math.sqrt(dx*dx+dy*dy),u=dx*p.cf+dy*p.sf,v=dy*p.cf-dx*p.sf,r=p.e===1?r0:Math.sqrt(u*u*p.e*p.e+v*v/(p.e*p.e));if(p.h-p.s*r*.68<=z)continue;
          const c=r0?dx/r0:1,s=r0?dy/r0:0,c2=c*c,s2=s*s,cn=p.n===3?c*(4*c2-3):p.n===4?8*c2*c2-8*c2+1:c*(16*c2*c2-20*c2+5),sn=p.n===3?s*(3-4*s2):p.n===4?4*s*c*(c2-s2):s*(16*s2*s2-20*s2+5);
          const q=p.h-p.s*r*(1+.32*(cn*p.cf-sn*p.sf));if(q>z)z=q}PZ[j*pw+i]=z}
        if(!((j+1)&15))yield}}
    // (3) the height: a butte in the desert (flat on top, sheer), a spire if small, else the cones over a low body, steep at its edge;
    //     never rising over kept-clear ground behind it (UP: the free pixels above each point)
    const UP=new Uint16Array(bw*bh);for(let x=x0;x<x1;x++){let run=0;for(let y=Math.max(0,y0-96);y<y1;y++){if(kept(x,y))run=0;else run++;if(y>=y0)UP[(y-y0)*bw+x-x0]=run-1}}
    yield;
    let zmax=0;
    for(let y=y0;y<y1;y++){for(let x=x0;x<x1;x++){const k=(y-y0)*bw+x-x0;if(!A[k])continue;if(UP[k]<3){A[k]=0;continue}const d=A[k]/3,rid=1-Math.abs(2*NR1(x,y)-1),cr=NR2(x,y)-.5,Hp=HV[k];let z;
        if(desert&&KD&&KD.scree){const T=Math.min(KD.scree[0],Hp*KD.scree[1]),zc=Math.min(Hp*(.95+.05*rid)+cr*1.5,Math.max(0,d-T/1.1-1)*(small?9:6)+T);z=Math.max(Math.min(d*1.1,T),zc)}// (a scree fan at its foot, then its cliff)
        else if(desert)z=Math.min(Hp*(.95+.05*rid)+cr*1.5,d*(small?9:6));
        else if(small)z=Math.min(Hp*(.82+.18*rid)*(1+cr*.3),d*6);
        else{const u=(x-x0)/2,v=(y-y0)/2,iu=u|0,iv=v|0,fu=u-iu,fv=v-iv,q=iv*pw+iu,a=PZ[q],b=PZ[q+1],c=PZ[q+pw],e=PZ[q+pw+1];
          const cg=KD?KD.crag:1;z=Math.max(Hp*.3*Math.min(1,d/12),a+(b-a)*fu+(c-a)*fv+(a-b-c+e)*fu*fv);z=Math.min(z*(1+cr*.12*cg)+rid*2*cg,d*(2+1.6*NR2(x+57,y+31))*(KD?KD.edge:1))}
        z=Math.max(.6,Math.min(z,UP[k]-2));ZR[k]=z;if(z>zmax)zmax=z}
      if(!((y-y0+1)&31))yield}
    // (what it paints: the rock up to zmax over its box, its outline round it, its shadow K to the right and below)
    const K=Math.ceil(zmax/SK)+1,X1=Math.min(W,x1+K+2),Y1=Math.min(H,y1+Math.ceil(K*.45)+2);
    const md={x0,x1,y0,y1,bw,bh,ZR,CL,CL2,CT,zmax,K,c:m.c,pk:kind||m.c,X1,Y1,ex0:Math.max(0,x0-1),ey0:Math.max(0,y0-Math.ceil(zmax)-2),ex1:Math.max(o.shade?X1:0,Math.min(W,x1+1)),ey1:o.shade?Math.max(Y1,y1):y1,bytes:bw*bh*(MK?7:5)};
    // (3b) a forested look's trees (PX.WN_MOUNT.trees): on a lattice of ground points, each jittered, where its wood grows (woodAt) and
    //      by the forested look's share there; its sprite by its height's share and the slope's light (as massPaint lights the rock);
    //      {x, y (its foot on the ground), z (its lift), sp, t (its tint: + darker, - lighter)}, the box widened to their crowns
    const FOI=PNAMES.indexOf('forested');
    if(o.tree&&LK&&LK.includes(FOI)){const T=PX.WN_MOUNT.trees,TL=T.light,[sx,sy]=T.step,TR=md.trees=[];
      for(let gy=Math.ceil(y0/sy)*sy;gy<y1;gy+=sy){for(let gx=Math.ceil(x0/sx)*sx;gx<x1;gx+=sx){const hs=n=>PX.hash(gx,gy,seed*31+n),x=gx+Math.round((hs(1)-.5)*2*T.jit),y=gy+Math.round((hs(2)-.5)*2*T.jit);
          if(x<x0||y<y0||x>=x1||y>=y1)continue;const k=(y-y0)*bw+x-x0,z=ZR[k];if(!z)continue;
          const fw=CL[k]===FOI?(CL2[k]===FOI?1:1-CT[k]/255):CL2[k]===FOI?CT[k]/255:0;if(hs(3)>=fw*(1-T.gap))continue;
          const gx2=(mzAt(md,x+1,y)-mzAt(md,x-1,y))/2,gy2=(mzAt(md,x,y+1)-mzAt(md,x,y-1))/2,nl=Math.hypot(gx2,gy2,1);if(!woodAt(md,x,y,z,1/nl,NT))continue;
          const v=.5+.45*(-gx2*LX-gy2*LY+LZ)/nl/LN_-(mShade(md,x,y,z,1)?.22:0),t=Math.max(-TL.up,Math.min(TL.max,(TL.lit-v)*TL.k)),sp=o.tree(x,y,z/zmax,v<TL.dim?1:0,hs(4));
          TR.push({x,y,z:Math.round(z),sp,t});const b=sp.box,top=y-Math.round(z)-sp.ay+b[1];if(top<md.ey0)md.ey0=Math.max(0,top);if(x-sp.ax+b[0]<md.ex0)md.ex0=Math.max(0,x-sp.ax+b[0]);if(x-sp.ax+b[2]+1>md.ex1)md.ex1=Math.min(W,x-sp.ax+b[2]+1)}
        if(!(((gy/sy)|0)&7))yield}
      md.bytes+=TR.length*24}
    return md}
  // (a rock pixel's colour in look P (rpal): v its light, at column x, screen row r, hg px up the face of ground point (x, y) whose
  //  top shows at row sy, nz its slope's normal, wd: a forested look's wood grows on that point (its floor))
  function rockPx(P,v,x,r,y,sy,hg,nz,md,seed,NT,wd){const KD=P.K;if(KD)v+=(NT(x*.2+300,r*.2+300)-.5)*2*KD.tone;
    let kk=v>.82?0:v>.66?1:v>.48?2:v>.32?3:4;if(nz<.5&&PX.hash(x,(r+(x&3))>>2,seed+86)<.07)kk=Math.min(4,kk+1);if(P.RB&&nz>.8)kk=Math.max(1,kk);
    let c=P.RC[kk];
    if(P.RB){if(nz<.8||r>sy){const u=(hg+NT(x,7)*4)/3.5,bd=Math.floor(u)&3;if(bd===1)c=mixA(c,P.RB[0],.32);else if(bd===3)c=mixA(c,P.RB[1],.3);if(u%1<.29&&nz<.6)c=mixA(c,P.RB[2],.4)}else if(PX.hash(x,r,seed+88)<.06)c=mixA(c,P.RB[2],.3)}
    else if(P.own){if(nz>.5&&hg>md.zmax*(KD&&KD.snow||.46)+(NT(x,r)-.5)*10||nz>.82&&hg>8)c=P.SN[v>.66?0:v>.42?1:2]}
    else if(P.SN&&!P.MS&&md.zmax>32&&nz>.45&&hg>Math.max(30,md.zmax*.72)+(NT(x,r)-.5)*8)c=P.SN[v>.66?0:v>.42?1:2];// (the high peaks: snow)
    else if(P.MS){if(nz>.55&&NT(x+70,y)>.5||hg<3&&PX.hash(x,r,seed+87)<.35)c=P.MS[kk<2?0:kk<4?1:2]}
    else if(P.GT){if(nz>.72&&hg<md.zmax*.6&&NT(x+40,y)>.6)c=P.GT[kk<2?0:kk<4?1:2];else if(PX.hash(x,r,seed+87)<.005)c=[180,180,140]}
    // (a kind's own: a wood's floor under its trees (lit with the slope, dappled), basalt's columns and rust, granite's cracks, a
    //  butte's scree)
    if(KD){if(P.FO){if(wd)c=P.FO[Math.min(3,Math.max(0,Math.round(kk*.75)+(PX.hash(x,r,seed+89)<.14?1:0)))]}
      else if(P.RU){if(nz<.75&&(x+((PX.hash(x>>2,r>>3,seed+90)*3)|0))%3===0)c=P.RC[Math.min(4,kk+1)];if(PX.hash(x,r,seed+91)<.006)c=P.RU[kk<2?0:1]}
      else if(P.GT){if(nz<.7&&PX.hash(x,r>>2,seed+92)<.05)c=P.RC[Math.min(4,kk+2)]}
      else if(P.desert&&KD.scree&&nz>.5&&hg<KD.scree[0]){const n=PX.hash(x,r,seed+93);c=n<.3?P.RC[3]:n<.65?P.RC[2]:mixA(P.RC[2],P.RC[1],.5)}}
    return c}
  function* massPaint(o,md,w){const W=o.W,H=o.H,seed=o.seed|0,NT=massNoise(o).NT,x0=md.x0,x1=md.x1,y0=md.y0,y1=md.y1,bw=md.bw,ZR=md.ZR,CL=md.CL,CL2=md.CL2,CT=md.CT,FT=o.blend?PX.WN_MOUNT.foot:null;
    const wx0=w.x,wy0=w.y,ww=w.w,wx1=wx0+ww,wy1=wy0+w.h,D=w.D,S=w.S,ZO=w.ZO,TO=w.TO||null,I=w.I||w,at=(x,y)=>(y-wy0)*ww+x-wx0;let px=0;
    const zAt=(x,y)=>mzAt(md,x,y),shadowed=(x,y,z0,st)=>mShade(md,x,y,z0,st);
    const put=(q,c)=>{const p=q*4;D[p]=c[0];D[p+1]=c[1];D[p+2]=c[2];if(TO)TO[q]=1},mix=(q,c,t)=>{const p=q*4;D[p]+=(c[0]-D[p])*t;D[p+1]+=(c[1]-D[p+1])*t;D[p+2]+=(c[2]-D[p+2])*t;if(TO)TO[q]=1};
    // (4) its shadow on the ground to the lower right (tested on a 2-px lattice: each point's once, SV, for the 2 x 2 px round it)
    if(o.shade){const sx0=Math.max(x0,wx0)&~1,SV=new Int8Array(((Math.min(md.X1,wx1)-sx0)>>1)+2);let sy=-1;
      for(let y=Math.max(y0,wy0);y<Math.min(md.Y1,wy1);y++){if((y&~1)!==sy){sy=y&~1;SV.fill(-1)}for(let x=Math.max(x0,wx0);x<Math.min(md.X1,wx1);x++){const q=at(x,y);if(S[q]&(128|64)||ZO[q]||(x<x1&&y<y1&&ZR[(y-y0)*bw+x-x0]))continue;
          const k=((x&~1)-sx0)>>1;if(SV[k]<0)SV[k]=shadowed(x&~1,sy,0,2)?1:0;if(SV[k]){S[q]|=64;mix(q,SHC,.3)}}
        if(!((y+1)&15))yield}}
    // (5) the rock, front to back a column at a time: a point at height z shows at (x, y-z), above the rock drawn before it in the
    //     column (hz); a nearer mass already there stays. (Each column reckoned whole, its pixels painted in the window only.) Its look
    //     the point's, mixed with its second's by its share (CL2, CT); on the generated world its foot leaning toward the ground under
    //     it (PX.WN_MOUNT.foot: each climate's as painted)
    for(let x=Math.max(x0,wx0);x<Math.min(x1,wx1);x++){let hz=1e9,prev=false;
      for(let y=y1-1;y>=y0;y--){const k=(y-y0)*bw+x-x0;if(!ZR[k]){prev=false;continue}if(!prev)hz=Math.min(hz,y+1);prev=true;
        const z=ZR[k],sy=Math.round(y-z);if(sy>=hz)continue;const ra=Math.max(0,sy,wy0),rb=Math.min(hz,H,wy1);
        if(ra<rb){const P=rpal(PNAMES[CL[k]]),t2=CT?CT[k]/255:0,P2=t2?rpal(PNAMES[CL2[k]]):null;
          const gx=(zAt(x+1,y)-zAt(x-1,y))/2,gy=(zAt(x,y+1)-zAt(x,y-1))/2,nl=Math.hypot(gx,gy,1),nz=1/nl,lam=(-gx*LX-gy*LY+LZ)/nl/LN_;
          const v0=.5+.45*lam-(shadowed(x,y,z,1)?.22:0),wd=P.FO||P2&&P2.FO?woodAt(md,x,y,z,nz,NT):false;
          for(let r=ra;r<rb;r++){const q=at(x,r),hg=y-r;if(ZO[q]&&r+ZO[q]-1>y)continue;
            const v=v0-.16*Math.max(0,1-hg/10)+(NT(x,r)-.5)*.1+(PX.hash(x,r,seed+85)-.5)*.07;let c=rockPx(P,v,x,r,y,sy,hg,nz,md,seed,NT,wd);
            if(P2)c=mixA(c,rockPx(P2,v,x,r,y,sy,hg,nz,md,seed,NT,wd),t2);
            if(FT&&hg<FT[0]){const p=q*4;c=mixA(c,[D[p],D[p+1],D[p+2]],FT[1]*(1-hg/FT[0]))}
            put(q,c);S[q]=(S[q]&~7)|2;ZO[q]=Math.min(255,hg+1);if(x>=I.x&&x<I.x+I.w&&r>=I.y&&r<I.y+I.h)px++}}
        hz=sy}
      if(!((x+1)&15))yield}
    yield;
    // (6) its outline: navy round its silhouette (but along its foot, where it meets the ground), a deep contour along a crest over
    //     the rock behind it (the rock behind a step of 6+ px). (A neighbour outside the window reads as no rock)
    const zm=Math.ceil(md.zmax),CRc=rpal(md.pk).RC[4],zo=(x,y)=>x>=wx0&&y>=wy0&&x<wx1&&y<wy1?ZO[at(x,y)]:0;
    const OUT=[];for(let x=Math.max(0,x0-1,wx0);x<Math.min(W,x1+1,wx1);x++)for(let y=Math.max(0,y0-zm-2,wy0);y<Math.min(y1,wy1);y++){const q=at(x,y),zq=ZO[q];
      if(zq){const zb=zo(x,y+1);if(y+1<H&&zb&&!(S[q+ww]&8)&&(y+1+zb-1)-(y+zq-1)>5)put(q,CRc);continue}
      if(S[q]&128)continue;const zd=zo(x,y+1),zl=zo(x-1,y),zr=zo(x+1,y),zu=zo(x,y-1);let n=0;if(zd>2)n=zd+1;else if(zl>2)n=zl;else if(zr>2)n=zr;else if(zu>3)n=zu-1;
      if(n)OUT.push(q,n)}
    for(let k=0;k<OUT.length;k+=2){const q=OUT[k];put(q,NV);S[q]=(S[q]&~7)|2|8;ZO[q]=Math.min(255,OUT[k+1])}
    return px}
  const runSteps=g=>{let r;while(!(r=g.next()).done);return r.value};
  // all the masses over a whole picture (o as above, with D, S, ZO, touch: a peak's sprite)
  function massif(o){const S=o.S,W=o.W;o=Object.assign({kept:(x,y)=>S[y*W+x]&128},o);const {lab,M}=massLabel(o.C,o.R,o.h,o.clim),out={masses:M.length,px:0},w={x:0,y:0,w:W,h:o.H,D:o.D,S,ZO:o.ZO,TO:o.touch||null};
    for(const m of M){const md=runSteps(massSteps(o,lab,m));if(md)out.px+=runSteps(massPaint(o,md,w))}return out}
  PX.worldRange=massif;

  /* a mountain alone in an n box: a few tiles of rock (by v) on a small grid, drawn as a range is (kind: as a kind's, PX.WORLD_MOUNTS;
     else its climate's), then cut out as a sprite */
  const PEAKSHAPE=[[[1,0],[0,1],[1,1],[2,1]],[[0,0],[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1],[2,1]],[[0,1],[1,1],[2,1]],[[1,0],[1,1],[2,1]],[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]];
  PX.worldPeak=(clim,v,n,kind)=>{clim=PX.WORLD_NATURE[clim]?clim:'grass';v=((v|0)%6+6)%6;n=n>=64?64:n>=32?32:16;kind=PX.WORLD_MOUNTS[kind]?kind:null;const key='p'+clim+v+n+(kind||'');if(CACHE[key])return CACHE[key];
    const N=n,G=3,ts=n===16?5:N/4,ox=n===16?3:N/8,oy=N-2-2*ts,cells=n===16?(v%2?[[1,1]]:[[0,1],[1,1]]):PEAKSHAPE[v],HT=new Float32Array(G*G);
    cells.forEach(([i,j],k)=>{HT[j*G+i]=N*(k===0?(n===16?.5:.56):.3+.16*PX.hash(i,j,v+n))*(kind?Math.max(.6,PX.WORLD_MOUNTS[kind].h):1)});
    const D=new Uint8ClampedArray(N*N*4),S=new Uint8Array(N*N),ZO=new Uint8Array(N*N);
    massif({D,W:N,H:N,S,ZO,C:G,R:2,ts,ox,oy,h:(i,j)=>HT[j*G+i],clim:()=>clim,kind,seed:v*7+n+clim.length,shade:false,wob:Math.max(1.5,ts/16*5)});
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
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,c=hillPx(hc(Wn),clim,base,at(x+1,y)-at(x-1,y),at(x,y+1)-at(x,y-1),z[i],x,y,v,hillShade(at,x,y,z[i]));d.set(c,i*4);d[i*4+3]=255}g.putImageData(im,0,0)});
    return CACHE[key]=Object.assign(cv,{z,N,ax:16,ay:16,flat:true,edge:opts&&opts.edge||0,box:[0,0,N-1,N-1]})};
  // a hill's pixel: its slope (gx, gy: height differences across two pixels; the rise seen from above, so north-south slopes
  // foreshortened) against the light from the upper left, beyond flat ground, in steps (dithered: soft), leaning the ground colour
  // toward the climate's lit or shade tone; a little lighter the higher; a soft shadow where a rise stands between it and the light;
  // tufts on the lit slopes (grass), strata on the shaded (desert), rock through the snow (frost), moss (swamp). H: its palette (hc:
  // lit, shade, k, lo (the deepest step of shade) and sh (a cast shadow's steps)), clim: the climate its tufts, strata, rock or moss are of
  // (none: no details)
  const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>v/16),HL=[-.68,-.42,.6];
  // (a rise's shadow on the ground behind it, 0-1: soft, by how far the rise stands over the line to the light, over a penumbra of
  //  PX.WN_HILL.soft px of height (more the farther off it stands; the owner's fifth play-test: a hard shadow's edge ran straight
  //  along the light, a sharp cut through a hill); road: a road's tile with this many hills of its 8 neighbours rises as they do.
  //  A group of hill tiles is one rise (PX.worldNatureSteps 2, the owner 2026-10-22): its edge wobbling wob px (a noise over wn px),
  //  blur [r, n] (n box blurs of r px each way: its soft slope), deep the wider blur its depth is read by, h its height (px) [all of
  //  it, more deep in a big group], knoll the big knolls' noise (px across)), all reckoned on a lattice of step px (blur and deep
  //  in its steps)
  PX.WN_HILL={soft:[.5,.45],road:3,wob:6,wn:9,step:2,blur:[2,3],deep:[7,2],h:[7,14],knoll:44};
  // (a box blur of a whole-number field A (w x h, nothing beyond it), n times r points each way (a step a pass): its sums whole
  //  numbers, so any window reckons a point alike; divide by (2r+1)^(2n))
  function* boxBlur(A,w,h,r,n){const T=new Int32Array(w),S=new Int32Array(w);let O=new Int32Array(w*h);
    for(let k=0;k<n;k++){for(let y=0;y<h;y++){if(!((y+1)&63))yield;const o=y*w;let s=0;for(let x=0;x<=r&&x<w;x++)s+=A[o+x];for(let x=0;x<w;x++){T[x]=s;if(x+r+1<w)s+=A[o+x+r+1];if(x-r>=0)s-=A[o+x-r]}A.set(T,o)}yield;
      S.fill(0);for(let y=0;y<=r&&y<h;y++){const o=y*w;for(let x=0;x<w;x++)S[x]+=A[o+x]}
      for(let y=0;y<h;y++){if(!((y+1)&63))yield;const o=y*w;O.set(S,o);if(y+r+1<h){const p=(y+r+1)*w;for(let x=0;x<w;x++)S[x]+=A[p+x]}if(y-r>=0){const p=(y-r)*w;for(let x=0;x<w;x++)S[x]-=A[p+x]}}
      const Q=A;A=O;O=Q;yield}
    return A}
  const HSOFT=[1,2,3,4,5,6,7].map(k=>1/(PX.WN_HILL.soft[0]+PX.WN_HILL.soft[1]*k));
  const hillShade=(at,x,y,z0)=>{let s=0;for(let k=1;k<=7;k++){const d=at(Math.round(x-k*1.6),Math.round(y-k*.7))-z0-k*.75-.3;if(d>0){const a=d*HSOFT[k-1];if(a>=1)return 1;if(a>s)s=a}}return s};
  const HC={},hc=(Wn)=>HC[Wn.floor]||(HC[Wn.floor]={lit:hx(Wn.hill.lit),shade:hx(Wn.hill.shade),k:Wn.hill.k,lo:Wn.hill.lo||-3,sh:Wn.hill.sh||1.2}),HX={tl:hx('#a8c466'),td:hx('#3a5a2e'),sb:hx('#9a5a3a'),sr:hx('#8e5e3e'),fr:hx('#7a8298'),sm:hx('#3e4a2c')};
  function hillPx(H,clim,c,gx,gy,z,x,y,s,shd){const ax=gx*.5,ay=gy*.5*.6,nl=Math.sqrt(ax*ax+ay*ay+1),lam=(ax*-HL[0]+ay*-HL[1]+HL[2])/nl-HL[2]+z*.01;
    const r=lam*11-shd*H.sh+BAYER[(y&3)*4+(x&3)]-.5,q=Math.max(H.lo,Math.min(3,r<0?-Math.floor(-r):Math.floor(r)));let o=c;
    if(q>0)o=mixA(c,H.lit,q*H.k[0]);else if(q<0)o=mixA(c,H.shade,-q*H.k[1]);
    if(clim&&z>.8){const n=PX.hash(x,y,s*7+91);if(clim==='grass'&&q>0&&n<.03)o=HX.tl;else if(clim==='grass'&&q<0&&n<.02)o=HX.td;
      else if(clim==='desert'&&q<=0&&z>2&&(y+Math.floor(z*.7))%3===0)o=mixA(o,HX.sb,.3);else if(clim==='desert'&&n<.02)o=HX.sr;
      else if(clim==='frost'&&q<=-1&&z>2.5&&PX.hash(x>>2,y>>1,s+92)<.35&&n<.7)o=mixA(o,HX.fr,.55);else if(clim==='swamp'&&n<.05)o=HX.sm}return o}

  /* the painter, in two halves, so a map is painted a window at a time (a chunk), never needing one canvas or array a pixel for it
     all. PX.worldNaturePlan(spec): what is global, a byte or so a tile: what is kept clear (a PX.TileMask: the clear ground, water,
     bridges, beaches), each water's size, the ranges' tile heights and masses (each mass's height field reckoned when first
     painted, then kept: md). PX.worldNatureSteps(plan, win, D, TO): a generator painting the window win {x, y, w, h, inner, road} (px;
     road optional: the roads' bands there, for the brooks crossing them, PX.WN_XING) whose ground is D (RGBA, w×h) in small steps (yielding between them: sliced painting), touch TO (w×h, optional); returns the
     counts of what it painted (things on tiles in inner, rises with their middle in it, rock pixels in it, masses with their
     first tile in it; cross: those from outside it reaching into it), its phases' ms (tm) and all (ms), and what stands in inner
     (stand: standIndex, below). PX.worldNaturePaint runs it through. What lies and stands is gathered
     from the tiles round the window in the map's own order, rises from the lattice round it, so whatever crosses its edge is
     painted as on the whole map: a window's pixels are the whole map's there, but within PX.WN_APRON of its edge (a range's
     outline reads its neighbours, each mass a pixel deeper): paint a window that much larger than what is kept. */
  // PX.TileMask(C, R, ts): a bit a pixel (ts ≤ 16), kept by tile: f a byte a tile (0 none, 1 all, 2 some: its ts rows of bits from o[t] in m)
  PX.TileMask=class{
    constructor(C,R,ts){this.C=C;this.R=R;this.ts=ts;this.W=C*ts;this.H=R*ts;this.f=new Uint8Array(C*R);this.o=new Int32Array(C*R);this.m=new Uint16Array(ts*64);this.n=0;this.all=(1<<ts)-1}
    at(x,y){if(x<0||y<0||x>=this.W||y>=this.H)return 0;const ts=this.ts,tx=(x/ts)|0,ty=(y/ts)|0,t=ty*this.C+tx,f=this.f[t];return f<2?f:(this.m[this.o[t]+y-ty*ts]>>(x-tx*ts))&1}
    fill(x,y,w,h){const ts=this.ts,x0=Math.max(0,x),y0=Math.max(0,y),x1=Math.min(this.W,x+w),y1=Math.min(this.H,y+h);if(x1<=x0||y1<=y0)return;
      for(let ty=(y0/ts)|0;ty<=((y1-1)/ts|0);ty++)for(let tx=(x0/ts)|0;tx<=((x1-1)/ts|0);tx++){const t=ty*this.C+tx;if(this.f[t]===1)continue;
        const a=Math.max(x0,tx*ts)-tx*ts,b=Math.min(x1,(tx+1)*ts)-tx*ts,c=Math.max(y0,ty*ts)-ty*ts,d=Math.min(y1,(ty+1)*ts)-ty*ts;if(!a&&b===ts&&!c&&d===ts){this.f[t]=1;continue}
        if(!this.f[t]){if((this.n+1)*ts>this.m.length){const m=new Uint16Array(this.m.length*2);m.set(this.m);this.m=m}this.o[t]=this.n*ts;this.n++;this.f[t]=2}
        const o=this.o[t],bits=((1<<(b-a))-1)<<a;for(let r=c;r<d;r++)this.m[o+r]|=bits;let full=true;for(let r=0;r<ts;r++)if(this.m[o+r]!==this.all){full=false;break}if(full)this.f[t]=1}}
    // v into S (a byte a pixel of the window x0, y0, w×h, inside the map) wherever the mask is set
    paint(S,x0,y0,w,h,v){const ts=this.ts,x1=x0+w,y1=y0+h;for(let ty=(y0/ts)|0;ty<=((y1-1)/ts|0);ty++)for(let tx=(x0/ts)|0;tx<=((x1-1)/ts|0);tx++){const t=ty*this.C+tx,f=this.f[t];if(!f)continue;
      const X0=Math.max(x0,tx*ts),X1=Math.min(x1,(tx+1)*ts),Y1=Math.min(y1,(ty+1)*ts);
      for(let y=Math.max(y0,ty*ts);y<Y1;y++){const row=f===1?this.all:this.m[this.o[t]+y-ty*ts],o=(y-y0)*w-x0;if(row)for(let x=X0;x<X1;x++)if(row>>(x-tx*ts)&1)S[o+x]=v}}}
    copy(){const k=new PX.TileMask(this.C,this.R,this.ts);k.f.set(this.f);k.o.set(this.o);k.m=this.m.slice();k.n=this.n;return k}
    get bytes(){return this.f.length*5+this.m.length*2}
    static of(B,C,R,ts){const k=new PX.TileMask(C,R,ts),W=C*ts;if(B)for(let i=0;i<B.length;i++)if(B[i])k.fill(i%W,(i/W)|0,1,1);return k}// (from a byte a pixel)
  };
  const KIND=PX.WN_KIND,LAY=[[[3,5],[11,4],[7,10],[14,10],[2,14],[10,15]],[[6,4],[14,6],[2,9],[10,10],[5,15],[13,14]],[[2,6],[9,4],[14,8],[6,11],[12,13],[3,15]]];
  // (the swamp's forest: three looser layouts of three, a slot empty with a chance gap, its bog showing between; and its floor's
  //  bog pools, BOG: up to n a tile, each with a chance p, rx by ry px at most, in peat water, lit at its near rim)
  const LAY_BOG=[[[4,5],[13,9],[6,15]],[[10,4],[3,10],[12,15]],[[5,3],[13,7],[8,13]]];
  const BOG={gap:.12,n:3,p:.85,rx:5,ry:2.4,water:[[50,70,72],[74,98,98],[30,44,46]]};
  PX.WN_APRON=8;
  // brooks (PX.worldNatureSteps 2b): the flow (bits 0-4 of spec.flow, worldgen.js's log2) a brook starts at, is 2 px wide from, 3 px
  const BROOK=[6,7,8];
  // a brook crossing a road (the owner's fourth play-test: the stream shows across it; win.road, the painter's: at(x, y) how far a
  // pixel lies inside a road's band (over 0 its surface, down to its verge's -V; -99 no road there), great(x, y) a great road's):
  // over a track a splash ford, the stream's water over the road at ford, its banks on the road wet ruts (the road darkened by wet)
  // with a stone here and there (stone: the share, in the climate's rock); over a great road a stone culvert, the water shaded
  // (shade toward dark) between kerbs of stone
  PX.WN_XING={ford:.8,wet:.32,stone:.3,shade:.35,dark:[24,30,40]};
  // the fen's own trees (PX.worldNatureSteps 3): on open swamp ground, up to three a tile, each standing with a chance p, more or less
  // by groves (a smooth noise over g tiles, swinging it by swing): some .6 a tile, about a third of a wood's cover
  const FEN={p:.2,swing:.5,g:4};
  // (the climates' small things mixed across an edge (the owner's third play-test: no line where the swamp's or the desert's begin):
  // an open tile's set its own climate's, or with a chance of p times the other's cover there (spec.cover) the other's: a grass
  // tile's the swamp's (pools, reeds, moss, the fen's mangroves) or the desert's (ripples, cacti, scrub), a swamp's or a desert's
  // tile's the grass's, thinning out as the cover does, over some 3 tiles)
  PX.WN_MIX={p:.85};
  // PX.worldNatureMix(plan, c, tx, ty): the climate whose small things an open tile (tx, ty) of climate c has (PX.WN_MIX)
  PX.worldNatureMix=(P,c,tx,ty)=>{const CV=P.CV,MX=PX.WN_MIX.p;if(!CV)return c;const i=ty*P.C+tx,r=P.h(tx,ty,102);
    if(c==='grass'){const d=CV.desert[i]*MX,w=CV.swamp[i]*MX;return r<d?'desert':r<d+w?'swamp':c}return CV[c]&&r<(1-CV[c][i])*MX?'grass':c};
  // (a wood's fringe on the open ground round it: its floor's shade reaching out px into it (k at most, a noise over n px ragging
  // it), and within r tiles undergrowth (bush) and trees (tree) by the wood's share round the tile (r tiles each way), up to two of
  // each a tile; the wood's own kinds of tree at its edge, but the desert's acacias (sp: its palms stand by water))
  PX.WN_FRINGE={px:5,k:.3,n:4,r:2,bush:.9,tree:.55,sp:{desert:'acacia'}};
  // (a wood's tile a full stand, at its edge and in a small wood too (the owner 2026-10-22: "a 1-tile forest with 1 tree"; the fringe
  //  thins the trees outside it, never on it): a slot empty only with a chance gap (the swamp's: BOG.gap); a tree that does not fit
  //  (kept-clear ground, water by it) drawn a share pull of the way toward the tile's middle (8, mid) instead; then, short of min
  //  trees (a wood's, the swamp's), the spots fill tried in turn (the last along its foot, under a shore); by water or a way its
  //  crown may lean over the shore (its beach and a curved shore's water on a land tile, never a water tile's, nor within mouth px
  //  of a brook's way into the water) or the way's verge (verge), its rows shore px and more above its foot)
  PX.WN_WOOD={gap:.08,pull:[0,.35,.7],mid:10,min:[4,2],shore:4,verge:1,mouth:3,fill:[[8,10],[4,13],[12,13],[4,6],[12,6],[8,15],[8,5],[2,10],[14,10],[3,15],[13,15]]};
  // (a road through a wood (spec.lane: its tiles; spec.road(x, y): how far a pixel lies inside the nearest way's band (a road's, a
  // ford's track), the painted path's surface over 0, global: the owner's fifth play-test, a track through a wood read as a tile of
  // bright grass cut through it): its tile a wood's, the forest floor right up to the path (floor: its shade from none at the path's
  // edge to all at floor[1] px off it, a little worn first: floor[0] less; ragged by rag, a share of the fringe's noise), trees
  // standing on it beside the path (each's foot at least foot px off the path's surface, its crown over it no farther in than crown,
  // so some hang over the path's edge), undergrowth (bush: tries a tile) and the trees' shadows over it)
  PX.WN_LANE={floor:[.15,1.4],rag:1.2,foot:1.5,crown:1.6,bush:3};
  // (the oases and ponds (spec.oases, spec.ponds: the generator's lists, WM.oases and WM.ponds; each round its water of 1-3 tiles):
  // round each, over reach tiles past its water, the ground leaning green (green: the colour, k at most, ragged by a noise of n px;
  // tarns: scree grey), and by its kind (the share a tile, at the water and thinning to none at reach): an oasis's date palms (palm,
  // big: x of them), tall grass (tuft), shrubs (shrub) and, by a holding, gardens (garden); a hollow's, an oxbow's or a spring's
  // reeds, bushes and flowers; a tarn's stones and scree, its water iced in the frost (ice: how much, past the noise's ice[1]); a
  // swamp pool's reeds and moss; lily pads (pads) on the water of a hollow, an oxbow and a pool. A frost tarn frozen over: ice (ice[0]
  // its strength), cracked where a noise crosses ice[1]. Past k the lean only soft (soft of what is over), so the noise still
  // mottles it at the water: no flat band)
  PX.WN_RING={n:7,soft:.4,
    oasis:{reach:3.2,green:[112,150,62],k:.62,palm:.85,big:1.5,tuft:.9,shrub:.35,garden:.5},
    hollow:{reach:1.6,green:[74,126,50],k:.4,reeds:.9,bush:.3,flowers:.35,pads:.45},
    oxbow:{reach:1.6,green:[74,126,50],k:.35,reeds:.9,bush:.25,flowers:.2,pads:.35},
    spring:{reach:1.4,green:[80,134,52],k:.45,reeds:.8,bush:.2,flowers:.5,pads:0},
    tarn:{reach:1.6,green:[132,132,126],k:.18,stone:.5,scree:.9,ice:[.8,.5]},
    pool:{reach:1.4,green:[56,84,44],k:.35,reeds:1,moss:.6,pads:.8}};
  // (the climates' covers read as weights (a hill's palette and details, a wood's floor): each other climate's (the frost's the
  // snow's) from 0 at cover lo to 1 at hi, the grass's the rest)
  PX.WN_BLEND={lo:.25,hi:.75};
  // (the trees across a climate's edge as a real ecotone (the owner's fourth play-test, 2026-10-22: no line where the species switch):
  // a tree on the grass is another climate's with the chance of that climate's cover there (spec.snow, spec.cover; times mix), and
  // one in another climate the grass's with the chance of its cover's shortfall: mixed stands thinning out over some 3 tiles each
  // way. The chance swung, most where the cover is a half and not at all where it is 0 or 1, by f times how far the land leans
  // toward that climate (spec.eco: -1 to 1 a tile, the generated world's own temperature, moisture and height: colder or higher for
  // the conifers, wetter and lower for the swamp's trees, hotter and drier for the desert's) and a smooth noise (over n tiles, amp
  // either way). A climate's tree standing out of it is its kind there (sp: the desert's acacias; its palms stand by water). Then
  // by the snow where it stands (its cover, snow either way by a hash): a tree in the snow takes its frosty kind (freeze; on a wood's
  // tile a conifer for a leafy tree, wood: a wood in the snow stays a full stand, not bare sticks), one out of it its snowless one
  // (thaw); and a wood's pines thicken toward the cold (pine times the frost's lean past pineAt, in the
  // grove noise)
  PX.WN_ECO={mix:1,f:.25,n:3,amp:.15,snow:.12,pine:.6,pineAt:-.6,sp:{desert:'acacia'},thaw:{spine:'pine',fir:'pine',bbirch:'birch'},freeze:{pine:'spine',birch:'bbirch',oak:'bare',moak:'bare',bogwillow:'bare',acacia:'bare',mangrove:'snag',palm:'snag',dead:'snag'},
    wood:{oak:'spine',moak:'fir',bogwillow:'fir',acacia:'spine',mangrove:'fir',palm:'spine'}};
  // PX.worldTreeClimate(plan, c, tx, ty, k): whose species a tree k of tile (tx, ty) (climate c) is (PX.WN_ECO)
  PX.worldTreeClimate=(P,c,tx,ty,k)=>{const CV=P.CV,SN=P.SN,EC=P.EC,E=PX.WN_ECO,i=ty*P.C+tx,r=P.h(tx*8+k,ty,160);if(!CV&&!SN)return c;
    const cov=q=>{const S=q==='frost'?SN:CV&&CV[q];return S?S[i]:0},lean=(q,v)=>(1-Math.abs(2*v-1))*((EC&&EC[q]?E.f*EC[q][i]:0)+E.amp*2*(tileNoise(P.h,tx/E.n,ty/E.n,q.length*17+150)-.5));
    if(c!=='grass'){const v=cov(c);return r<Math.max(0,Math.min(1,(1-v)*E.mix-lean(c,v)))?'grass':c}
    let acc=0;for(const q of ['frost','desert','swamp']){const v=cov(q);if(!(v>0))continue;acc+=Math.max(0,Math.min(1,v*E.mix+lean(q,v)));if(r<acc)return q}
    return c};
  PX.worldNaturePlan=spec=>{const W=spec.W,H=spec.H,C=spec.C,R=spec.R,ts=spec.ts||16,K=spec.kind,CI=spec.clim,seed=(spec.seed|0)||1;
    const kAt=(x,y)=>x<0||y<0||x>=C||y>=R?KIND.water:K[y*C+x],cAt=(x,y)=>CLIMS[CI[Math.max(0,Math.min(R-1,y))*C+Math.max(0,Math.min(C-1,x))]]||'grass',h=(x,y,k)=>PX.hash(x,y,seed*977+k);
    // kept clear: the clear ground, water, a bridge's tile, and the beach (3 px of land along the water or a bridge's tile, where the
    // game lays its shore)
    const clear=spec.clear instanceof PX.TileMask?spec.clear:PX.TileMask.of(spec.clear,C,R,ts),keep=clear.copy();
    // (the oases' and ponds' water (spec.oases, spec.ponds: up to 9 tiles each from its middle; PW a tile, 2 in a wood: 4 or more of
    //  its 8 neighbours wood): kept by the water as drawn (spec.wet), a pixel at a time, not by its tiles, nor a beach round them (the
    //  owner's fifth play-test: nothing square round a small water); PN: those tiles and the tiles round them)
    const PW=new Uint8Array(C*R),PN=new Uint8Array(C*R);let pwn=0;
    if(spec.wet)for(const q of (spec.oases||[]).concat(spec.ponds||[])){const st=(q.tiles||[]).concat([Math.floor(q.y)*C+Math.floor(q.x)]);let n=0;while(st.length&&n<9){const i=st.pop();if(i<0||i>=C*R||PW[i]||K[i]!==KIND.water)continue;PW[i]=1;n++;pwn++;const x=i%C;if(x>0)st.push(i-1);if(x<C-1)st.push(i+1);st.push(i-C,i+C)}}
    if(pwn)for(let i=0;i<C*R;i++){if(!PW[i])continue;const x=i%C,y=(i-x)/C;let f=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const u=x+a,v=y+b;if(u<0||v<0||u>=C||v>=R)continue;PN[v*C+u]=1;if(K[v*C+u]===KIND.forest)f++}if(f>=4)PW[i]=2}
    const bridge=(x,y)=>kAt(x,y)===KIND.road&&(kAt(x-1,y)===KIND.water&&kAt(x+1,y)===KIND.water||kAt(x,y-1)===KIND.water&&kAt(x,y+1)===KIND.water);
    for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++){const X=tx*ts,Y=ty*ts;if(K[ty*C+tx]===KIND.water||K[ty*C+tx]===KIND.ford||bridge(tx,ty)){if(!PW[ty*C+tx])keep.fill(X,Y,ts,ts);continue}const wa=(a,b)=>tx+a>=0&&ty+b>=0&&tx+a<C&&ty+b<R&&(K[(ty+b)*C+tx+a]===KIND.water&&!PW[(ty+b)*C+tx+a]||bridge(tx+a,ty+b));
      if(wa(0,-1))keep.fill(X,Y,ts,3);if(wa(0,1))keep.fill(X,Y+ts-3,ts,3);if(wa(-1,0))keep.fill(X,Y,3,ts);if(wa(1,0))keep.fill(X+ts-3,Y,3,ts);
      // (round shores, spec.round: a corner with water on both sides of it, where the curved water reaches into the land, kept too)
      if(spec.round)for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])if(wa(a,0)&&wa(0,b))keep.fill(a<0?X:X+ts-6,b<0?Y:Y+ts-6,6,6)}
    // (the tiles by water or a bridge (one of the 8 round it), where a curved shore (spec.wet) may reach in past the beach: nothing
    // stands on it there)
    const NW=new Uint8Array(C*R);for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++){for(let b=-1;b<=1&&!NW[ty*C+tx];b++)for(let a=-1;a<=1;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<C&&y<R&&(K[y*C+x]===KIND.water||K[y*C+x]===KIND.ford||bridge(x,y))){NW[ty*C+tx]=1;break}}}
    // (each water's size, up to 255, so a desert's palms stand by an oasis or a lake, not along the sea)
    const WS=new Uint8Array(C*R);{const st=[];for(let q0=0;q0<C*R;q0++){if(K[q0]!==KIND.water||WS[q0])continue;const L=[q0];WS[q0]=-1;st.push(q0);while(st.length){const q=st.pop(),i=q%C,j=(q-i)/C;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+a,y=j+b,n=y*C+x;if(x>=0&&y>=0&&x<C&&y<R&&K[n]===KIND.water&&!WS[n]){WS[n]=-1;st.push(n);L.push(n)}}}for(const q of L)WS[q]=Math.min(255,L.length)}}
    // the ranges: each tile of rock as high as it lies deep in its range (5×5 round it), the great peaks higher (inside a range, 5+
    // of 8 neighbours rock, the highest hash of its 3×3, rock above it)
    const inner=(x,y)=>{if(kAt(x,y)!==KIND.mount)return false;let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&kAt(x+a,y+b)===KIND.mount)n++;return n>=5};
    const great=(tx,ty)=>{if(!inner(tx,ty))return false;const v=h(tx,ty,61);if(v<.35)return false;for(const [a,b] of [[-1,0],[1,0],[-1,-1],[0,-1],[1,-1],[0,-2]])if(kAt(tx+a,ty+b)!==KIND.mount)return false;
      for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&inner(tx+a,ty+b)&&h(tx+a,ty+b,61)>v)return false;return true};
    // (the generated world's (spec.mount: its elev, temp, moist and rough a tile): each range draws one number (a hash of its first
    //  tile) and each climate takes the kind it falls on in that climate's pool (m.kinds: PX.worldMountKind on the means over its
    //  tiles of that climate, a climate it has no tile of on its means over all: so it has a look where that climate's cover reaches
    //  it); its shape its most common climate's kind's (m.kind): a butte's heights for sandstone, a peak's times the kind's h, the
    //  original's (classic) as on today's map)
    const MF=spec.mount&&spec.mount.elev?spec.mount:null,RH=new Float32Array(C*R),{lab,M}=massLabel(C,R,(i,j)=>K[j*C+i]===KIND.mount,cAt),FL=['elev','temp','moist','rough'];
    if(MF){const SM=M.map(()=>CLIMS.concat(['all']).map(()=>({n:0,elev:0,temp:0,moist:0,rough:0})));for(let i=0;i<C*R;i++){if(lab[i]<0)continue;for(const q of [SM[lab[i]][CI[i]]||SM[lab[i]][0],SM[lab[i]][4]]){q.n++;for(const f of FL)q[f]+=MF[f]?MF[f][i]:0}}
      M.forEach((m,k)=>{const r=h(m.q0%C,(m.q0/C)|0,66),all=SM[k][4];let best=-1;m.kinds={};for(const f of FL)all[f]/=all.n;
        SM[k].slice(0,4).forEach((q,c)=>{if(q.n)for(const f of FL)q[f]/=q.n;m.kinds[CLIMS[c]]=PX.worldMountKind(CLIMS[c],q.n?q:all,r);if(q.n>best){best=q.n;m.kind=m.kinds[CLIMS[c]]}})})}
    for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++){if(K[ty*C+tx]!==KIND.mount)continue;let d=0;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(kAt(tx+a,ty+b)===KIND.mount)d++;const KD=MF?PX.WORLD_MOUNTS[M[lab[ty*C+tx]].kind]:null;
      RH[ty*C+tx]=(KD?KD===PX.WORLD_MOUNTS.sandstone:cAt(tx,ty)==='desert')?8*Math.max(1,Math.round((1.2+3.2*Math.min(1,(d-1)/18))*(.55+.6*h(tx,ty,63)))):(14+24*Math.min(1,(d-1)/20))*(great(tx,ty)?1.4:1)*(.9+.2*h(tx,ty,62))*(KD?KD.h:1)}
    // (ro: the ranges' painting; on the generated world the climates' covers (cv: [none, the snow's, the desert's, the swamp's]), the
    //  foot's blend, and the forested looks' trees (tree, below))
    const ro={W,H,C,R,ts,h:(i,j)=>RH[j*C+i],clim:cAt,seed:seed+5,shade:true,kept:pwn?(x,y)=>keep.at(x,y)||PN[((y/ts)|0)*C+((x/ts)|0)]===1&&spec.wet(x,y):(x,y)=>keep.at(x,y),
      ...MF?{cv:[null,spec.snow||null,spec.cover&&spec.cover.desert||null,spec.cover&&spec.cover.swamp||null],blend:true}:{}};
    // (the rings round the oases and ponds (PX.WN_RING): RL each {x, y (its middle, tiles), r, kind, big, farm}, RG a tile: 1 + the
    //  nearest's index whose reach it lies in)
    const RL=[],RG=new Int16Array(C*R),RD=new Float32Array(C*R).fill(1e9);
    for(const q0 of (spec.oases||[]).map(q=>Object.assign({kind:'oasis'},q)).concat(spec.ponds||[])){const Rn=PX.WN_RING[q0.kind];if(!Rn)continue;const q=Object.assign({},q0,{reach:Math.max(Rn.reach,q0.ring||0)}),n=RL.push(q),e=q.r+q.reach;
      for(let y=Math.max(0,Math.floor(q.y-e));y<=Math.min(R-1,Math.ceil(q.y+e));y++)for(let x=Math.max(0,Math.floor(q.x-e));x<=Math.min(C-1,Math.ceil(q.x+e));x++){const d=Math.hypot(x+.5-q.x,y+.5-q.y)-q.r;if(d<=q.reach&&d<RD[y*C+x]){RD[y*C+x]=d;RG[y*C+x]=n}}}
    // (the hills' tiles: a hill's, or a road's with PX.WN_HILL.road of its 8 neighbours hills (it rises as they do, the owner's fifth
    //  play-test); HN: their edge's wobble (x, y) and their knolls' noise)
    const HT=new Uint8Array(C*R);for(let ty=0;ty<R;ty++)for(let tx=0;tx<C;tx++){const k=K[ty*C+tx];if(k===KIND.hill){HT[ty*C+tx]=1;continue}if(k!==KIND.road)continue;let n=0;
      for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if((a||b)&&kAt(tx+a,ty+b)===KIND.hill)n++;if(n>=PX.WN_HILL.road)HT[ty*C+tx]=1}
    const HN=[noiseF(W,H,PX.WN_HILL.wn,seed*977+120),noiseF(W,H,PX.WN_HILL.wn,seed*977+121),noiseF(W,H,PX.WN_HILL.knoll,seed*977+122)];
    const P={W,H,C,R,ts,K,seed,kAt,cAt,h,clear,keep,WS,NW,RH,ro,lab,M,md:[],mdQ:[],mdBytes:0,mdCap:32<<20,hill:K.some(k=>k===KIND.hill),HT,HN,CI,SN:spec.snow||null,CV:spec.cover||null,EC:spec.eco||null,wet:spec.wet||null,F:spec.flow||null,RV:spec.river||null,WR:spec.water||null,
      LT:spec.lane||null,RS:spec.road||null,RL,RG:RL.length?RG:null,PW:pwn?PW:null,PN:pwn?PN:null,
      get bytes(){return keep.bytes+(clear===spec.clear?0:clear.bytes)+WS.byteLength+NW.byteLength+RH.byteLength+lab.byteLength+this.mdBytes}};
    // (a forested range's tree at (x, y), a share s of its mass's height up, dim, r its draw (PX.WN_MOUNT.trees): whose climate's by the
    //  ecotone (PX.worldTreeClimate), a conifer (up) the likelier the higher, else one of that climate's woods' (its grove noise, the
    //  pines thickening toward the cold, as a wood's; sub), then by the snow where it stands (PX.WN_ECO freeze, thaw), as a wood's)
    if(MF){const T=PX.WN_MOUNT.trees,E=PX.WN_ECO,TREES=PX.WORLD_TREES;
      ro.tree=(x,y,s,dim,r)=>{const tx=(x/ts)|0,ty=(y/ts)|0,i=ty*C+tx,c=cAt(tx,ty),q=PX.worldTreeClimate(P,c,tx,ty,(x+y*3)&7),a=T.conifer;let sp,cl=q;
        if(r<Math.max(0,Math.min(1,(s-a[0])/(a[1]-a[0]))))sp=T.up[q]||'pine';
        else{let g=tileNoise(h,tx/5,ty/5,71);if(q==='grass'&&P.EC&&P.EC.frost)g=Math.min(1,g+E.pine*Math.max(0,P.EC.frost[i]-E.pineAt));sp=PX.pickWorldTree((TREES[q]||TREES.grass).wood,g,h(x,y,183),false);sp=T.sub[sp]||sp}
        if(P.SN||q==='frost'){const sw=P.SN?Math.max(0,Math.min(1,(P.SN[i]-PX.WN_BLEND.lo)/(PX.WN_BLEND.hi-PX.WN_BLEND.lo))):1;if(sw+E.snow*2*(h(x,y,170)-.5)>.5){sp=E.freeze[sp]||sp;cl='frost'}else{sp=E.thaw[sp]||sp;if(cl==='frost')cl='grass'}}
        return PX.worldTree(cl,sp,Math.floor(h(x,y,184)*4),dim)}}
    return P};
  // a mass's height field: kept (the oldest let go past mdCap bytes, never the one asked for)
  // (two windows may reckon one at once: the first to finish keeps it)
  function* massOf(P,m){if(P.md[m.id]!==undefined)return P.md[m.id];const md=yield* massSteps(P.ro,P.lab,m);if(P.md[m.id]!==undefined)return P.md[m.id];P.md[m.id]=md;if(!md)return md;P.mdBytes+=md.bytes;P.mdQ.push(m.id);
    while(P.mdBytes>P.mdCap&&P.mdQ.length>1){const id=P.mdQ.shift(),d=P.md[id];delete P.md[id];if(d)P.mdBytes-=d.bytes}return md}
  const MASS_REACH=128;// (px round a mass's tiles its rock, outline and shadow may reach: generous)
  PX.worldNatureSteps=function*(P,win,D,TO){
    const t0=performance.now(),W=P.W,H=P.H,C=P.C,R=P.R,ts=P.ts,K=P.K,kAt=P.kAt,cAt=P.cAt,h=P.h,TM=P.keep,CLR=P.clear,I=win.inner||win,out={trees:0,mtrees:0,fen:0,hills:0,peaks:0,decor:0,flat:0,rock:0,cross:{things:0,rises:0,masses:0},tm:{}};
    const wx0=win.x,wy0=win.y,ww=win.w,wh=win.h,wx1=wx0+ww,wy1=wy0+wh,at=(x,y)=>(y-wy0)*ww+x-wx0;let tl=t0;const lap=n=>{const t=performance.now();out.tm[n]=t-tl;tl=t};
    const ownT=(tx,ty)=>tx*ts>=I.x&&tx*ts<I.x+I.w&&ty*ts>=I.y&&ty*ts<I.y+I.h?1:0,ownP=(x,y)=>x>=I.x&&x<I.x+I.w&&y>=I.y&&y<I.y+I.h,inI=(x0,y0,x1,y1)=>x0<I.x+I.w&&x1>I.x&&y0<I.y+I.h&&y1>I.y;
    // S: a byte a pixel: what stands there (low 3 bits: 0 ground, 2 rock, 3 wood, 4 a small thing; 8 a range's outline), 64 shaded,
    // 128 kept clear. ZO: the rock's lift there +1 (0 none)
    const S=new Uint8Array(ww*wh),ZO=new Uint8Array(ww*wh);TM.paint(S,wx0,wy0,ww,wh,128);
    // (a pixel of water: on a water or ford tile (a pond's: as drawn), or drawn as water (spec.wet))
    const wetP=(X,Y)=>{const t=((Y/ts)|0)*C+((X/ts)|0),k=kAt((X/ts)|0,(Y/ts)|0);if(P.PW&&X>=0&&Y>=0&&X<W&&Y<H&&P.PW[t])return!!P.wet(X,Y);return k===KIND.water||k===KIND.ford||!!(P.wet&&P.wet(X,Y))};
    const touch=(i,v)=>{if(TO)TO[i]=v};
    // (a pixel of water as drawn on a tile by water (P.NW: a curved shore reaching past the beach kept clear, a pond's or an oasis's
    //  water, kept by no tile): no ground's tone, rise or shadow on it)
    const nearWet=(X,Y)=>!!P.wet&&X>=0&&Y>=0&&X<W&&Y<H&&P.NW[((Y/ts)|0)*C+((X/ts)|0)]===1&&wetP(X,Y);
    const mixD=(i,c,t)=>{const o=i*4;D[o]+=(c[0]-D[o])*t;D[o+1]+=(c[1]-D[o+1])*t;D[o+2]+=(c[2]-D[o+2])*t};
    const tx0=(wx0/ts)|0,ty0=(wy0/ts)|0,tx1=((wx1-1)/ts)|0,ty1=((wy1-1)/ts)|0;lap('set');yield;
    // (the climates' covers (spec.snow, spec.cover) at the tile corners round the window (each the mean of the 4 tiles round it, as
    //  the map's ground reads them), read between them at a pixel: cw(X, Y), the weights of CLIMS' climates there (PX.WN_BLEND;
    //  without covers, the tile's own climate's); mixW(A) a colour a climate mixed by them; cwPick(X, Y, s) one of them picked by
    //  them (a hash s); pure(X, Y) the one climate whose weight is 1 over the pixel's whole tile, else -1 (kept a tile: the fast way))
    const BL=PX.WN_BLEND,CI=P.CI,cx0=Math.max(0,tx0-4),cy0=Math.max(0,ty0-4),cx1=Math.min(C,tx1+5),cy1=Math.min(R,ty1+5),CWW=cx1-cx0+1,CW=new Float32Array(4);
    const CG=[null,P.SN,P.CV&&P.CV.desert,P.CV&&P.CV.swamp].map(Sv=>{if(!Sv)return null;const G=new Float32Array(CWW*(cy1-cy0+1));
      for(let y=cy0;y<=cy1;y++)for(let x=cx0;x<=cx1;x++){let s=0,n=0;for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const u=x+a,v=y+b;if(u<0||v<0||u>=C||v>=R)continue;s+=Sv[v*C+u];n++}G[(y-cy0)*CWW+x-cx0]=n?s/n:0}return G});
    const cw=(X,Y)=>{const tc=CI?CI[Math.min(R-1,Math.max(0,(Y/ts)|0))*C+Math.min(C-1,Math.max(0,(X/ts)|0))]:0,u=X/ts-cx0,v=Y/ts-cy0,i=Math.max(0,Math.min(CWW-2,Math.floor(u))),j=Math.max(0,Math.min(cy1-cy0-1,Math.floor(v))),fx=Math.min(1,Math.max(0,u-i)),fy=Math.min(1,Math.max(0,v-j)),q=j*CWW+i;let s=0;
      for(let k=1;k<4;k++){const G=CG[k];let w;if(G){const a=G[q],b=G[q+1],c=G[q+CWW],d=G[q+CWW+1];w=Math.max(0,Math.min(1,(a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy-BL.lo)/(BL.hi-BL.lo)))}else w=tc===k?1:0;CW[k]=w;s+=w}
      if(s>1){for(let k=1;k<4;k++)CW[k]/=s;s=1}CW[0]=1-s;return CW};
    const PU=new Int8Array(CWW*(cy1-cy0+1)).fill(-2),pure=(X,Y)=>{const tx=Math.min(C-1,Math.max(0,(X/ts)|0)),ty=Math.min(R-1,Math.max(0,(Y/ts)|0)),i=Math.max(0,Math.min(CWW-2,tx-cx0)),j=Math.max(0,Math.min(cy1-cy0-1,ty-cy0)),q=j*CWW+i;
      if(PU[q]>-2)return PU[q];let one=0,n=0;for(let k=1;k<4;k++){const G=CG[k];let w;if(G){const a=G[q],b=G[q+1],c=G[q+CWW],d=G[q+CWW+1],lo=Math.max(a,b,c,d)<=BL.lo,hi=Math.min(a,b,c,d)>=BL.hi;if(!lo&&!hi)return PU[q]=-1;w=hi?1:0}else w=CI&&CI[ty*C+tx]===k?1:0;if(w){one=k;n++}}
      return PU[q]=n>1?-1:one};
    const mixW=A=>{let r=0,g=0,b=0;for(let k=0;k<4;k++){const w=CW[k];if(w>0){r+=A[k][0]*w;g+=A[k][1]*w;b+=A[k][2]*w}}return[r,g,b]};
    const cwPick=(X,Y,s)=>{const p=pure(X,Y);if(p>=0)return CLIMS[p];cw(X,Y);let r=PX.hash(X,Y,s);for(let k=0;k<4;k++){r-=CW[k];if(r<0)return CLIMS[k]}return CLIMS[0]};
    // (FK, FC: a wood's fringe's shade a pixel and its climate, the most of the woods beside it; FN its ragging noise)
    const WF=PX.WN_FRINGE,FK=new Float32Array(ww*wh),FN=noiseF(W,H,WF.n,P.seed*977+90),FLOOR=CLIMS.map(c=>hx(PX.WORLD_NATURE[c].floor)),floorAt=(X,Y)=>{const k=pure(X,Y);return k>=0?FLOOR[k]:(cw(X,Y),mixW(FLOOR))};
    // (1) a wood's floor: its ground darker, fading out over a few pixels where it meets open land, and its fringe beyond (the woods
    //     a tile round the window too); its colour the climates' floors mixed by their covers there (the frost's under the snow's)
    const LT=P.LT,RS=P.RS,LN=PX.WN_LANE,woodT=(x,y)=>{const k=kAt(x,y);return k===KIND.forest||!!LT&&k===KIND.road&&LT[y*C+x]===1||!!P.PW&&k===KIND.water&&x>=0&&y>=0&&x<C&&y<R&&P.PW[y*C+x]===2};
    for(let ty=Math.max(0,ty0-1);ty<=Math.min(R-1,ty1+1);ty++){for(let tx=Math.max(0,tx0-1);tx<=Math.min(C-1,tx1+1);tx++){const lane=K[ty*C+tx]!==KIND.forest;if(lane&&!woodT(tx,ty))continue;const fo=(a,b)=>woodT(tx+a,ty+b);const eL=!fo(-1,0),eR=!fo(1,0),eU=!fo(0,-1),eD=!fo(0,1);
        for(let y=0;y<ts;y++)for(let x=0;x<ts;x++){const X=tx*ts+x,Y=ty*ts+y;if(X<wx0||Y<wy0||X>=wx1||Y>=wy1)continue;const i=at(X,Y);let f=1,tv=1;if(nearWet(X,Y))continue;
          // (on a lane, and a wood's own tiles by a path (a ford's track), kept-clear ground off the path's surface takes the floor
          //  too, up to its edge)
          if(S[i]&128){if(!LT||!CLR.at(X,Y)||wetP(X,Y))continue;const sv=RS?RS(X,Y):-99;f=sv<=-99?1:Math.max(0,Math.min(1,(-sv-LN.floor[0])/(LN.floor[1]-LN.floor[0])+LN.rag*(FN(X+31,Y+17)-.5)));tv=3;if(f<=0)continue}
          let e=9;if(eL)e=Math.min(e,x);if(eR)e=Math.min(e,ts-1-x);if(eU)e=Math.min(e,y);if(eD)e=Math.min(e,ts-1-y);
          const k=.5*f*Math.min(1,(e+h(X,Y,1)*2.5)/4);if(k>0){mixD(i,floorAt(X,Y),k);touch(i,tv)}}
        // (its fringe: the open ground beside it shaded a little, ragged, the most of the woods round a pixel)
        for(const [a,b] of [[-1,0],[1,0],[0,-1],[0,1]]){const q=kAt(tx+a,ty+b);if(q!==KIND.open&&q!==KIND.hill)continue;
          for(let d=0;d<WF.px;d++)for(let m=0;m<ts;m++){const X=a?(a<0?tx*ts-1-d:tx*ts+ts+d):tx*ts+m,Y=b?(b<0?ty*ts-1-d:ty*ts+ts+d):ty*ts+m;if(X<wx0||Y<wy0||X>=wx1||Y>=wy1)continue;
            const i=at(X,Y);if(S[i]&128||nearWet(X,Y))continue;const k=WF.k*(1-(d+WF.px*.8*FN(X,Y))/WF.px);if(k>FK[i])FK[i]=k}}
        if(!lane&&cAt(tx,ty)==='swamp')for(let n=0;n<BOG.n;n++){if(h(tx*4+n,ty,30)>=BOG.p)continue;const cx=tx*ts+3+h(tx*4+n,ty,31)*10,cy=ty*ts+3+h(tx*4+n,ty,32)*10,rx=BOG.rx*(.6+.4*h(tx*4+n,ty,33)),ry=BOG.ry*(.7+.3*h(tx*4+n,ty,34));
          for(let Y=Math.max(ty*ts,Math.floor(cy-ry));Y<=Math.min(ty*ts+ts-1,cy+ry);Y++)for(let X=Math.max(tx*ts,Math.floor(cx-rx));X<=Math.min(tx*ts+ts-1,cx+rx);X++){if(X<wx0||Y<wy0||X>=wx1||Y>=wy1)continue;const i=at(X,Y);const kb=S[i]&128;if(kb&&!(LT&&CLR.at(X,Y)&&!wetP(X,Y)&&RS&&RS(X,Y)<-2.5)||nearWet(X,Y))continue;const d=((X+.5-cx)/rx)**2+((Y+.5-cy)/ry)**2;if(d>1-h(X,Y,35)*.3)continue;
            const o=i*4,c=BOG.water[Y+.5<cy-ry*.3?2:d>.55&&Y+.5>cy?1:0];D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];touch(i,kb?3:1)}}}
      if(!((ty-ty0+1)&1))yield}
    for(let i=0;i<ww*wh;i++)if(FK[i]>0){mixD(i,floorAt(wx0+i%ww,wy0+((i/ww)|0)),FK[i]);touch(i,1)}
    // (the rings round the oases and ponds: the ground leaning green (a tarn's grey), ragged, to the water's edge, under clear ground
    //  too, there only toned (a holding's yard over it takes its colour: no square of bare land where a lot stands, the owner,
    //  2026-10-23); its things (palms, tufts) keep off clear ground; a frost tarn's water iced in plates)
    if(P.RG){const RN=PX.WN_RING,GN=noiseF(W,H,RN.n,P.seed*977+140);
      for(const q of P.RL){const Rn=RN[q.kind],e=(q.r+q.reach)*ts,cx=q.x*ts,cy=q.y*ts;if(cx+e<wx0||cx-e>=wx1||cy+e<wy0||cy-e>=wy1)continue;const G=Rn.green,ice=Rn.ice&&cAt(q.x|0,q.y|0)==='frost';
        for(let Y=Math.max(wy0,Math.floor(cy-e));Y<Math.min(wy1,Math.ceil(cy+e));Y++)for(let X=Math.max(wx0,Math.floor(cx-e));X<Math.min(wx1,Math.ceil(cx+e));X++){const d=Math.hypot(X+.5-cx,Y+.5-cy)/ts-q.r;if(d>q.reach)continue;const i=at(X,Y);
          // (frozen: ice over all of the water as drawn, a few cracks in it, open water left in thin leads)
          if(wetP(X,Y)){if(ice&&!CLR.at(X,Y)){const m=GN(X+57,Y+23),cr=Math.abs(m-Rn.ice[1]);if(cr>.02){mixD(i,cr<.05?[150,176,204]:[226,236,246],Rn.ice[0]);touch(i,2)}}continue}
          const k=Rn.k*Math.min(1,(1-d/q.reach)*1.6)-(GN(X,Y)-.5)*.5;if(k<=0)continue;mixD(i,G,Math.min(k,Rn.k+(k-Rn.k)*RN.soft));touch(i,CLR.at(X,Y)?3:1)}}}
    lap('floor');yield;
    // (2) hills: each group of hill tiles one rise (the owner, 2026-10-22: "one large hill sprite", not a bump a tile): its tiles
    //     (P.HT: a hill's, or a road's over the hills) a footprint, its edge read through a wobble (PX.WN_HILL.wob px), blurred into a
    //     smooth height (soft edges, a broad top: b1, PX.WN_HILL.blur), higher deep in a big group, where it swells into a few big
    //     knolls (b2, the footprint's share over a wider blur, PX.WN_HILL.deep, times a smooth noise over knoll px): z = b1 (h[0] +
    //     h[1] b2 noise). Reckoned on a lattice of PX.WN_HILL.step px over the map (its sums whole numbers, so any window reckons any
    //     point alike) and read between its points. Then shaded as one ground: only the 8-px blocks a rise or its shadow reaches (BK).
    //     The field is reckoned over the window and the margin its shading reads (12 left, 6 up). Kept-clear ground that is no water
    //     (a road, a yard) neither stops a rise nor its shading (the owner's fourth play-test: the hill runs on under the road), but has
    //     no tufts, strata, rock or moss. Its palette the climates' hills' mixed by their covers there (cw: the frost's by the snow's),
    //     its details one climate's picked by them
    if(P.hill){const HW=PX.WN_HILL,BS=8,zx0=wx0-12,zy0=wy0-6,ZW=ww+14,ZN=wh+8,ZH=new Float32Array(ZW*ZN),bx0=wx0>>3,by0=wy0>>3,bxn=((wx1-1)>>3)-bx0+1,byn=((wy1-1)>>3)-by0+1,BK=new Uint8Array(bxn*byn);
      const zat=(x,y)=>x<0||x>=W||y<-6||y>H||x<zx0||y<zy0||x>=zx0+ZW||y>=zy0+ZN?0:ZH[(y-zy0)*ZW+x-zx0];
      // (the footprint on the lattice over the field and the blurs' reach round it (RR points): a tile whose 3 x 3 are all hill or
      //  all not is that at its every point, the rest a point at a time through the wobble)
      const G=HW.step,TG=ts/G,HT=P.HT,ht=(u,v)=>u<0||v<0||u>=C||v>=R?0:HT[v*C+u],[r1,n1]=HW.blur,[r2,n2]=HW.deep,RR=Math.max(r1*n1,r2*n2)+1;
      const gx0=Math.floor(zx0/G)-RR,gy0=Math.floor(zy0/G)-RR,GW=Math.ceil((zx0+ZW)/G)+RR+1-gx0,GH=Math.ceil((zy0+ZN)/G)+RR+1-gy0,MK=new Int32Array(GW*GH);let any=0,i0=GW,i1=-1,j0=GH,j1=-1;
      for(let ty=Math.floor(gy0/TG);ty<=Math.floor((gy0+GH-1)/TG);ty++){yield;for(let tx=Math.floor(gx0/TG);tx<=Math.floor((gx0+GW-1)/TG);tx++){let s=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)s+=ht(tx+a,ty+b);if(!s)continue;any=1;
        const ia=Math.max(gx0,tx*TG),ib=Math.min(gx0+GW,tx*TG+TG),ja=Math.max(gy0,ty*TG),jb=Math.min(gy0+GH,ty*TG+TG);i0=Math.min(i0,ia-gx0);i1=Math.max(i1,ib-1-gx0);j0=Math.min(j0,ja-gy0);j1=Math.max(j1,jb-1-gy0);
        for(let j=ja;j<jb;j++){const o=(j-gy0)*GW-gx0;if(s===9)MK.fill(1,o+ia,o+ib);else for(let i=ia;i<ib;i++){const X=i*G,Y=j*G;MK[o+i]=ht(Math.floor((X+(P.HN[0](X,Y)-.5)*HW.wob)/ts),Math.floor((Y+(P.HN[1](X,Y)-.5)*HW.wob)/ts))}}}}
      yield;
      // (blurred over the footprint's box and the blurs' reach round it only (E: nothing beyond it), the field F on its lattice, read
      //  between its points over the pixels it reaches)
      if(any){i0=Math.max(0,i0-RR);j0=Math.max(0,j0-RR);i1=Math.min(GW-1,i1+RR);j1=Math.min(GH-1,j1+RR);const ew=i1-i0+1,eh=j1-j0+1,E=new Int32Array(ew*eh);for(let j=0;j<eh;j++)E.set(MK.subarray((j+j0)*GW+i0,(j+j0)*GW+i1+1),j*ew);
        const B1=yield* boxBlur(E.slice(),ew,eh,r1,n1),D1=(2*r1+1)**(2*n1),B2=yield* boxBlur(E,ew,eh,r2,n2),D2=(2*r2+1)**(2*n2),KN=P.HN[2],F=new Float32Array(GW*GH);
        for(let j=0;j<eh;j++){if(!((j+1)&63))yield;for(let i=0;i<ew;i++){const q=j*ew+i;if(B1[q])F[(j+j0)*GW+i+i0]=B1[q]/D1*(HW.h[0]+HW.h[1]*B2[q]/D2*KN((gx0+i0+i)*G,(gy0+j0+j)*G))}}
        yield;
        for(let y=Math.max(0,(gy0+j0)*G-zy0);y<Math.min(ZN,(gy0+j1)*G-zy0);y++){if(!((y+1)&31))yield;const Y=zy0+y,v=Y/G-gy0,j=Math.floor(v),fy=v-j;for(let x=Math.max(0,(gx0+i0)*G-zx0);x<Math.min(ZW,(gx0+i1)*G-zx0);x++){const X=zx0+x,u=X/G-gx0,i=Math.floor(u),fx=u-i,q=j*GW+i,a=F[q],b=F[q+1],c=F[q+GW],d=F[q+GW+1];if(!(a||b||c||d))continue;
          ZH[y*ZW+x]=a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;BK[Math.min(byn-1,Math.max(0,(Y>>3)-by0))*bxn+Math.min(bxn-1,Math.max(0,(X>>3)-bx0))]=1}}
        // (a block reached by a rise's shadow: those to the right and below a risen one)
        for(let by=byn-1;by>=0;by--)for(let bx=bxn-1;bx>=0;bx--){if(BK[by*bxn+bx]!==1)continue;for(let b=0;b<=1;b++)for(let a=0;a<=2;a++)if(bx+a<bxn&&by+b<byn&&!BK[(by+b)*bxn+bx+a])BK[(by+b)*bxn+bx+a]=2}
        for(let ty=Math.max(0,(wy0/ts)|0);ty<=Math.min(R-1,((wy1-1)/ts)|0);ty++)for(let tx=Math.max(0,(wx0/ts)|0);tx<=Math.min(C-1,((wx1-1)/ts)|0);tx++)if(K[ty*C+tx]===KIND.hill){if(ownT(tx,ty))out.hills++;else if(inI(tx*ts-RR*G,ty*ts-RR*G,tx*ts+ts+RR*G,ty*ts+ts+RR*G))out.cross.rises++}}
      const HP=CLIMS.map(c=>hc(PX.WORLD_NATURE[c])),Hb={lit:[0,0,0],shade:[0,0,0],k:[0,0],lo:-3,sh:1.2},HL4=HP.map(q=>q.lit),HS4=HP.map(q=>q.shade);
      const hpal=(X,Y)=>{const p=pure(X,Y);if(p>=0)return HP[p];cw(X,Y);for(let k=0;k<4;k++)if(CW[k]>=.999)return HP[k];Hb.lit=mixW(HL4);Hb.shade=mixW(HS4);Hb.k[0]=Hb.k[1]=0;Hb.lo=Hb.sh=0;
        for(let k=0;k<4;k++){const w=CW[k],q=HP[k];Hb.k[0]+=q.k[0]*w;Hb.k[1]+=q.k[1]*w;Hb.lo+=q.lo*w;Hb.sh+=q.sh*w}Hb.lo=Math.round(Hb.lo);return Hb};
      const HD=[0,0,0],MO=[1,2,3,4,5,6,7].map(k=>[Math.round(-k*1.6),Math.round(-k*.7),k*.75+.3]),MD=MO.map(([dx,dy])=>dy*ZW+dx),MU=MO.map(m=>m[2]);
      for(let Y=wy0;Y<wy1;Y++){const ty=(Y/ts)|0,br=((Y>>3)-by0)*bxn-bx0,row=(Y-zy0)*ZW-zx0;for(let X=wx0;X<wx1;X++){if(!BK[br+(X>>3)]){X|=7;continue}const i=at(X,Y),kc=S[i]&128;if(kc&&(!CLR.at(X,Y)||wetP(X,Y))||nearWet(X,Y))continue;const zi=row+X,zh=ZH[zi];
          let sh=0;if(X>=12){for(let k=0;k<7;k++){const d=ZH[zi+MD[k]]-zh-MU[k];if(d>0){const a=d*HSOFT[k];if(a>=1){sh=1;break}if(a>sh)sh=a}}}else sh=hillShade(zat,X,Y,zh);if(zh<=.05&&!sh)continue;
          const pc=pure(X,Y),Hp=pc>=0?HP[pc]:hpal(X,Y),o=i*4;HD[0]=D[o];HD[1]=D[o+1];HD[2]=D[o+2];const c=hillPx(Hp,kc?null:pc>=0?CLIMS[pc]:cwPick(X,Y,P.seed+93),HD,zat(X+1,Y)-zat(X-1,Y),zat(X,Y+1)-zat(X,Y-1),zh,X,Y,7,sh);D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];touch(i,kc?3:1)}
        if(!((Y-wy0+1)&3))yield}}
    lap('hills');yield;
    // (2b) brooks (the generated world's, spec.flow and river): each land tile whose flow is a brook's (bits 0-4 at least BROOK[0]) and
    //     no river's, a line 1-3 px wide (by its flow, BROOK) from the middle of its way in (from the neighbour that feeds it most) to
    //     the middle of its way out (flow's bits 5-7), bending through the tile's own point (its middle moved a little by its hash),
    //     in its climate's water tones (spec.water); never on clear ground or water, but over the beach, so it meets the water
    if(P.F){const F=P.F,RV=P.RV,DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1],lvl=i=>K[i]===KIND.water||K[i]===KIND.mount||RV[i]&3?0:F[i]&31,brook=i=>lvl(i)>=BROOK[0];
      const RD=win.road||null,XS=PX.WN_XING,XG=new Set(),XB=new Set();
      // (a tile's point: its middle moved a little; a road's a brook runs along (its way in and out on road tiles too) moved off the
      //  road (spec.road), to whichever of a few spots lies farthest from its band, so a brook beside a road runs beside it)
      const PO=[[0,0],[6,0],[-6,0],[0,6],[0,-6],[5,5],[-5,5],[5,-5],[-5,-5]],rdT=(x,y)=>x>=0&&y>=0&&x<C&&y<R&&K[y*C+x]===KIND.road;
      const along=(x,y)=>{const i=y*C+x;if(!rdT(x,y)||!brook(i))return false;const d=F[i]>>5;if(!rdT(x+DX[d],y+DY[d]))return false;let ux=-1,uy=-1,ub=0;
        for(let k=0;k<8;k++){const a=x-DX[k],b=y-DY[k];if(a<0||b<0||a>=C||b>=R)continue;const j=b*C+a;if(brook(j)&&F[j]>>5===k&&lvl(j)>ub){ub=lvl(j);ux=a;uy=b}}return ux>=0&&rdT(ux,uy)};
      const pt=(x,y)=>{if(K[y*C+x]===KIND.water)return[x*ts+8,y*ts+8];const px=x*ts+8+(h(x,y,95)-.5)*6,py=y*ts+8+(h(x,y,96)-.5)*6;if(!RS||!along(x,y))return[px,py];
        let b=PO[0],bs=1e9;for(const o of PO){const v=RS(px+o[0],py+o[1]);if(v<bs-.01){bs=v;b=o}}return[px+b[0],py+b[1]]};
      for(let ty=Math.max(0,ty0-2);ty<=Math.min(R-1,ty1+2);ty++){if(!(ty&3))yield;for(let tx=Math.max(0,tx0-2);tx<=Math.min(C-1,tx1+2);tx++){const i=ty*C+tx;if(!brook(i))continue;
        const d=F[i]>>5,nx=tx+DX[d],ny=ty+DY[d];if(nx<0||ny<0||nx>=C||ny>=R)continue;let ux=-1,uy=-1,ub=0;
        for(let k=0;k<8;k++){const x=tx-DX[k],y=ty-DY[k];if(x<0||y<0||x>=C||y>=R)continue;const j=y*C+x;if(brook(j)&&F[j]>>5===k&&lvl(j)>ub){ub=lvl(j);ux=x;uy=y}}
        // (out of water (a lake's outflow) it starts in the water, and into water it runs on into it: the water as drawn stops it, so
        //  it meets a curved shore wherever it lies)
        let wi=false;if(ux<0)for(let k=0;k<8;k++){const x=tx-DX[k],y=ty-DY[k];if(x<0||y<0||x>=C||y>=R)continue;const j=y*C+x;if(K[j]===KIND.water&&F[j]>>5===k){ux=x;uy=y;wi=true;break}}
        const c=pt(tx,ty),n=pt(nx,ny),u0=ux<0?c:pt(ux,uy),a=wi?u0:[(u0[0]+c[0])/2,(u0[1]+c[1])/2],b=K[ny*C+nx]===KIND.water?n:[(c[0]+n[0])/2,(c[1]+n[1])/2],wd=lvl(i)>=BROOK[2]?3:lvl(i)>=BROOK[1]?2:1;
        const WT=(P.WR&&P.WR[cAt(tx,ty)])||[[120,170,220],[80,130,190]],core=WT[0],edge=WT[1];
        // (the edge pixels first, then the core over them: a line 2 or 3 wide has a darker rim)
        for(let pass=wd>1?1:0;pass>=0;pass--)for(let s=0;s<=48;s++){const u=s/48,w0=(1-u)*(1-u),w1=2*(1-u)*u,w2=u*u,px=w0*a[0]+w1*c[0]+w2*b[0],py=w0*a[1]+w1*c[1]+w2*b[1];
          for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){if(wd<2&&(xx||yy)||wd<3&&(xx<0||yy<0)||(wd>1&&(xx||yy)?1:0)!==pass)continue;const X=Math.floor(px)+xx,Y=Math.floor(py)+yy;
            // (over clear ground too (a road's verge and margin, a yard, a field: the owner's fifth play-test, no brook cut short by
            //  the art); over a road's surface a crossing)
            if(X<wx0||Y<wy0||X>=wx1||Y>=wy1||(P.wet?P.wet(X,Y):wetP(X,Y)))continue;let rs=-99;if(CLR.at(X,Y))rs=RD?Math.max(-98,RD.at(X,Y)):-98;
            const q=at(X,Y),o=q*4;let col=pass?edge:core;
            if(rs>0){XG.add(q);col=RD.great(X,Y)?mixA(col,XS.dark,XS.shade):mixA([D[o],D[o+1],D[o+2]],col,XS.ford)}
            D[o]=col[0];D[o+1]=col[1];D[o+2]=col[2];touch(q,rs>-99?3:1)}}}}
      // (the crossings' banks: the road's pixels beside the stream on it, wet ruts and stones over a track, kerbs over a great road)
      for(const q of XG){const qx=q%ww,qy=(q-qx)/ww;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=qx+a,v=qy+b,n=v*ww+u,X=wx0+u,Y=wy0+v;if(u<0||v<0||u>=ww||v>=wh||XG.has(n)||XB.has(n)||!(RD.at(X,Y)>0)||nearWet(X,Y))continue;XB.add(n);
        const RK=rpal(cAt((X/ts)|0,(Y/ts)|0)).RC,o=n*4,r=h(X,Y,175);
        if(RD.great(X,Y))mixD(n,r<.5?RK[1]:RK[2],.85);else if(r<XS.stone)mixD(n,r<XS.stone/2?RK[1]:RK[3],.8);else{D[o]*=1-XS.wet;D[o+1]*=1-XS.wet;D[o+2]*=1-XS.wet*.6}touch(n,3)}}
      yield}
    lap('brooks');yield;
    // (3) the small things lying on the ground, and what stands: gathered by tile, from 3 tiles round the window (the farthest a
    //     thing or its shadow reaches from its tile)
    const items=[],flats=[];let own=0;
    // (a thing on land whose box lies on the map, on tiles with nothing kept clear and no water by them (the most), fits: no pixel of
    //  it to look at)
    const TF=TM.f,fits=(sp,x,y,water)=>{const N=sp.width,X0=x-sp.ax,Y0=y-sp.ay;
      if(!water){const b=sp.box,x0=X0+b[0],y0=Y0+b[1],x1=X0+b[2],y1=Y0+b[3];if(x0>=0&&y0>=0&&x1<W&&y1<H){let ok=true;
        for(let ty=(y0/ts)|0;ty<=((y1/ts)|0)&&ok;ty++)for(let tx=(x0/ts)|0;tx<=((x1/ts)|0);tx++){const t=ty*C+tx;if(TF[t]||P.wet&&P.NW[t]){ok=false;break}}if(ok)return true}}
      for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(!sp.a[j*N+i])continue;const X=X0+i,Y=Y0+j;if(X<0||Y<0||X>=W||Y>=H)return false;
      if(water?CLR.at(X,Y)||kAt((X/ts)|0,(Y/ts)|0)!==KIND.water||P.wet&&!P.wet(X,Y):TM.at(X,Y)||P.wet&&P.NW[((Y/ts)|0)*C+((X/ts)|0)]&&P.wet(X,Y))return false}return true};
    // (in a wood (its tiles, its lanes: PX.WN_LANE), a path's kept-clear band (a road's, a ford's track) no bar but on the path: a
    //  pixel there fits if its rows by the foot lie off the path's surface by foot px, the crown's no farther over it than crown)
    const laneOK=(X,Y,foot)=>{if(!LT||!woodT((X/ts)|0,(Y/ts)|0)||!CLR.at(X,Y)||wetP(X,Y))return false;const sv=RS?RS(X,Y):-99;return sv>-99&&(foot?sv<=-LN.foot:sv<=LN.crown)};
    // (a wood's tree (sh) by water or a way: its crown may lean out over the shore (its beach and a curved shore's water on a land
    //  tile, landT; but by a brook's way into the water: its mouth shows, brookT) or a way's verge (never its surface; PX.WN_WOOD.verge), its rows PX.WN_WOOD.shore px and more above
    //  its foot, so a wood's tile by a lake, a river or a road stands full too)
    const landT=(X,Y)=>{const k=kAt((X/ts)|0,(Y/ts)|0);return k!==KIND.water&&k!==KIND.ford&&k!==KIND.road},WD=PX.WN_WOOD,BDX=[1,1,0,-1,-1,-1,0,1],BDY=[0,1,1,1,0,-1,-1,-1],brookT=(X,Y)=>{if(!P.F)return false;const tx=(X/ts)|0,ty=(Y/ts)|0,i=ty*C+tx;if(K[i]===KIND.water||K[i]===KIND.mount||P.RV&&P.RV[i]&3||(P.F[i]&31)<BROOK[0])return false;
      const d=P.F[i]>>5,ax=tx*ts+8,ay=ty*ts+8,vx=BDX[d]*ts,vy=BDY[d]*ts,u=Math.max(0,Math.min(1,((X-ax)*vx+(Y-ay)*vy)/(vx*vx+vy*vy)));return Math.hypot(X-ax-vx*u,Y-ay-vy*u)<=WD.mouth};
    const fitsL=(sp,x,y,sh)=>{if(fits(sp,x,y))return true;if(!LT&&!sh)return false;const N=sp.width,X0=x-sp.ax,Y0=y-sp.ay;let lane=false;
      for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(!sp.a[j*N+i])continue;const X=X0+i,Y=Y0+j;if(X<0||Y<0||X>=W||Y>=H)return false;const crown=sh&&j<sp.ay-WD.shore;
        if(TM.at(X,Y)){if(CLR.at(X,Y)?!laneOK(X,Y,j>=sp.ay-2)&&!(crown&&WD.verge&&RS&&!wetP(X,Y)&&(v=>v>-99&&v<=0)(RS(X,Y))):!crown||brookT(X,Y)||!landT(X,Y))return false;lane=true}
        else if(P.wet&&P.NW[((Y/ts)|0)*C+((X/ts)|0)]&&P.wet(X,Y)&&(!crown||brookT(X,Y)||!landT(X,Y)))return false}return lane};
    const stand=(sp,x,y,cls,ln,sh)=>{if(!(ln||sh?fitsL(sp,x,y,sh):fits(sp,x,y)))return false;items.push([y,x,sp,cls,own]);return true};
    const lie=(sp,x,y,water)=>{if(!fits(sp,x,y,water))return false;flats.push([x,y,sp,water,own]);return true};
    const VN=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),w=yf*yf*(3-2*yf),a=h(xi,yi,s),b=h(xi+1,yi,s),c=h(xi,yi+1,s),d=h(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w};
    // (a tree k of tile (tx, ty) standing at (x, y): its species and the climate it is drawn in, [sp, clim]: by the ecotone (PX.
    //  worldTreeClimate, PX.WN_ECO) and the snow where it stands; a set but a wood's (the fen's) its own climate's)
    const WS=P.WS,TREES=PX.WORLD_TREES,EO=PX.WN_ECO,TS=[null,null];
    const pickTree=(c,tx,ty,k,edge,set,x,y,wd)=>{const q=set?c:PX.worldTreeClimate(P,c,tx,ty,k),L=(TREES[q]||TREES.grass)[set||'wood']||TREES[q].wood;
      let g=VN(tx/5,ty/5,71);if(q==='grass'&&P.EC&&P.EC.frost)g=Math.min(1,g+EO.pine*Math.max(0,P.EC.frost[ty*C+tx]-EO.pineAt));
      let sp=q!==c&&EO.sp[q]||PX.pickWorldTree(L,g,h(tx,ty,k),edge),cl=q;
      if(x!=null&&(P.SN||q==='frost')){cw(x,y);const snowy=CW[1]+EO.snow*2*(h(x,y,170)-.5)>.5;if(snowy){sp=wd&&EO.wood[sp]||EO.freeze[sp]||sp;cl='frost'}else{sp=EO.thaw[sp]||sp;if(cl==='frost')cl='grass'}}
      TS[0]=sp;TS[1]=cl;return TS};
    // (a wood's tile: one of three loose layouts of six trees (the swamp's forest: of three, over a bog), shuffled a little, each tree by
    //  PX.WORLD_TREES (more leafless at the edge), a full stand at its edge too (PX.WN_WOOD: a slot empty only by gap, a tree that does
    //  not fit drawn nearer the middle, and the free spots filled up to min); now and then a tree or a bush stands out on the open
    //  ground beside it; deeper trees (another wood tile in front) dimmer. A lane (a road through a wood, PX.WN_LANE) is a wood's tile
    //  too, its trees and undergrowth those off the path)
    for(let ty=Math.max(0,ty0-3);ty<=Math.min(R-1,ty1+3);ty++){if(ty>ty0-3)yield;for(let tx=Math.max(0,tx0-3);tx<=Math.min(C-1,tx1+3);tx++){const k=K[ty*C+tx],X=tx*ts,Y=ty*ts,c=cAt(tx,ty),c0=c,hh=n=>h(tx,ty,n+40);own=ownT(tx,ty);
      if(k===KIND.forest||(k===KIND.road||k===KIND.water)&&woodT(tx,ty)){const op=(a,b)=>{const q=kAt(tx+a,ty+b);return(q===KIND.open||q===KIND.ford||q===KIND.hill||q===KIND.road)&&!woodT(tx+a,ty+b)},below=woodT(tx,ty+1),ln=!!LT;
        const bog=c==='swamp',dim=below?1:0,wood=k===KIND.forest;let got=0;
        const put=(sx,sy,n,edge)=>{const jx=Math.round((hh(n+6)-.5)*(bog?3:4)),jy=Math.round((hh(n+12)-.5)*3),[sp,tc]=pickTree(c,tx,ty,n+20,edge,null,X+sx+jx,Y+sy+jy,wood),v=Math.floor(hh(n+18)*4);
          for(const f of WD.pull){const x=X+Math.max(0,Math.min(ts-1,Math.round(sx+(8-sx)*f)+jx)),y=Y+Math.max(0,Math.min(ts-1,Math.round(sy+(WD.mid-sy)*f)+jy));
            if(P.PW&&P.PW[((y/ts)|0)*C+((x/ts)|0)]?wetP(x,y):kAt((x/ts)|0,(y/ts)|0)===KIND.water)continue;if(stand(PX.worldTree(tc,sp,v,dim),x,y,3,ln,wood)){out.trees+=own;got++;return}}};
        (bog?LAY_BOG:LAY)[Math.floor(hh(0)*3)].forEach(([sx,sy],n)=>{const edge=(sx<5&&op(-1,0))||(sx>11&&op(1,0))||(sy<6&&op(0,-1))||(sy>13&&op(0,1));if(hh(n+50)<(bog?BOG.gap:WD.gap))return;put(sx,sy,n,edge)});
        if(wood)for(let n=0;n<WD.fill.length&&got<(bog?WD.min[1]:WD.min[0]);n++)put(WD.fill[n][0],WD.fill[n][1],n+200,true);
        if(k===KIND.road)for(let n=0;n<LN.bush;n++){const x=X+1+Math.floor(hh(110+n)*14),y=Y+3+Math.floor(hh(113+n)*13);if(stand(PX.worldDecor(c,c==='desert'?'scrub':'bush',Math.floor(hh(116+n)*4)),x,y,3,true))out.decor+=own}
        for(const [a,b] of [[-1,0],[1,0],[0,1],[0,-1]]){if(!op(a,b)||hh(30+a+2*b)>.3)continue;const x=X+8+a*(11+Math.round(hh(34)*3))+(b?Math.round((hh(35)-.5)*10):0),y=Y+(b>0?ts+3+Math.round(hh(36)*3):b<0?-3:8+Math.round(hh(37)*6));
          let sp;if(hh(38)<.55){const [s,tc]=pickTree(c,tx,ty,39,true,null,x,y);sp=PX.worldTree(tc,s,Math.floor(hh(40)*4),0)}else sp=PX.worldDecor(c,c==='desert'?'scrub':'bush',Math.floor(hh(41)*4));if(stand(sp,x,y,3))out.trees+=own}}
      else if(k===KIND.water){const rw=P.RG&&P.RG[ty*C+tx]?PX.WN_RING[P.RL[P.RG[ty*C+tx]-1].kind]:null;
        if(rw&&rw.pads&&c!=='frost'&&hh(5)<rw.pads){for(let n=0;n<2;n++)if(lie(PX.worldDecor('swamp','pad',Math.floor(hh(6+n*3)*4)),X+3+Math.floor(hh(7+n*3)*10),Y+3+Math.floor(hh(8+n*3)*10),true))out.flat+=own}
        else if(c==='swamp'&&hh(5)<.35&&lie(PX.worldDecor('swamp','pad',Math.floor(hh(6)*4)),X+4+Math.floor(hh(7)*8),Y+4+Math.floor(hh(8)*8),true))out.flat+=own;
        else if(c==='frost'&&hh(5)<.25&&lie(PX.worldDecor('frost','floe',Math.floor(hh(6)*4)),X+2+Math.floor(hh(7)*12),Y+2+Math.floor(hh(8)*8),true))out.flat+=own}
      else if(k===KIND.open||k===KIND.ford||k===KIND.hill){const c=PX.worldNatureMix(P,c0,tx,ty),at2=(n,m)=>[X+2+Math.floor(hh(n)*12),Y+4+Math.floor(hh(m)*11)],D0=(kind,v,n,m,st)=>{const sp=PX.worldDecor(c,kind,v),[x,y]=at2(n,m);if(st?stand(sp,x,y,4):lie(sp,x,y)){if(st)out.decor+=own;else out.flat+=own}};
        const hill=k===KIND.hill;
        // (round an oasis or a pond (PX.WN_RING): its own things, thick at the water, thinning out over its reach; near the water
        //  instead of the climate's)
        const rq=P.RG&&P.RG[ty*C+tx]&&k!==KIND.ford?P.RL[P.RG[ty*C+tx]-1]:null;let near=false;
        if(rq){const Rn=PX.WN_RING[rq.kind],d=Math.hypot(tx+.5-rq.x,ty+.5-rq.y)-rq.r,f=Math.max(0,1-d/rq.reach),St=(sp,n,m)=>{const [x,y]=at2(n,m);if(stand(sp,x,y,3))out.decor+=own},Li=(sp,n,m)=>{const [x,y]=at2(n,m);if(lie(sp,x,y))out.flat+=own};near=d<1.2;
          if(rq.kind==='oasis'){for(let i=0;i<3;i++)if(hh(140+i)<Rn.palm*f*(rq.big?Rn.big:1)){const [x,y]=at2(142+i,145+i);if(stand(PX.worldTree('desert','palm',Math.floor(hh(148+i)*4),0),x,y,3))out.trees+=own}
            for(let i=0;i<2;i++)if(hh(151+i)<Rn.tuft*f)Li(PX.worldDecor('desert','oasis',Math.floor(hh(153+i)*4)),155+i,157+i);
            if(hh(159)<Rn.shrub*f)St(PX.worldDecor('desert','scrub',Math.floor(hh(160)*4)),161,162);
            if(rq.farm&&d>.6&&hh(163)<Rn.garden*f)Li(PX.worldDecor('desert','garden',Math.floor(hh(164)*4)),165,166)}
          else if(rq.kind==='tarn'){if(hh(170)<Rn.stone*f)St(PX.worldDecor(c,hill||k===KIND.mount?'rock':'stone',Math.floor(hh(171)*4)),172,173);for(let i=0;i<2;i++)if(hh(174+i)<Rn.scree*f)Li(PX.worldDecor(c==='desert'?'grass':c,'scree',Math.floor(hh(176+i)*4)),178+i,180+i)}
          else{for(let i=0;i<2;i++)if(hh(182+i)<(Rn.reeds||0)*f)Li(PX.worldDecor(c,'reeds',Math.floor(hh(184+i)*4)),186+i,188+i);
            if(hh(190)<(Rn.bush||0)*f)St(PX.worldDecor(c,'bush',Math.floor(hh(191)*4)),192,193);if(c==='grass'&&hh(194)<(Rn.flowers||0)*f)Li(PX.worldDecor(c,'flowers',Math.floor(hh(195)*4)),196,197);
            if(hh(198)<(Rn.moss||0)*f)Li(PX.worldDecor('swamp','moss',Math.floor(hh(199)*4)),200,201)}}
        // (a wood's fringe: undergrowth and a tree or two, by the wood's share round the tile; the trees of the wood's climate)
        if(k!==KIND.ford){let nf=0;for(let b=-WF.r;b<=WF.r;b++)for(let a=-WF.r;a<=WF.r;a++)if(kAt(tx+a,ty+b)===KIND.forest)nf++;const fw=nf/((2*WF.r+1)*(2*WF.r+1)-1);
          if(fw>0)for(let n=0;n<2;n++){if(hh(84+n)<fw*WF.tree){const [x,y]=at2(86+n,88+n),[s,tc]=WF.sp[c0]?[WF.sp[c0],c0]:pickTree(c0,tx,ty,90+n,true,null,x,y);if(stand(PX.worldTree(tc,s,Math.floor(hh(92+n)*4),0),x,y,3))out.trees+=own}
            else if(hh(94+n)<fw*WF.bush){const [x,y]=at2(96+n,98+n);if(stand(PX.worldDecor(c0,c0==='desert'?'scrub':'bush',Math.floor(hh(100+n)*4)),x,y,3))out.decor+=own}}}
        if(near){}
        else if(c==='grass'){if(hh(10)<(hill?.25:.45))for(let i=0;i<1+(hh(11)>.6?1:0);i++)D0('tuft',Math.floor(hh(12+i)*4),13+i,15+i);if(!hill&&hh(17)<.12)D0('flowers',Math.floor(hh(18)*4),19,20);
          if(hh(21)<(hill?.08:.05))D0('bush',Math.floor(hh(22)*4),23,24,1);if(hh(25)<(hill?.08:.03))D0('stone',Math.floor(hh(26)*4),27,28,1)}
        else if(c==='frost'){if(!hill&&hh(10)<.26&&(!P.SN||P.SN[ty*C+tx]>=.85))D0('drift',Math.floor(hh(11)*4),12,13);if(hh(14)<(hill?.1:.05))D0('stone',Math.floor(hh(15)*4),16,17,1);if(hh(18)<.045)D0('shrub',Math.floor(hh(19)*4),20,21,1);if(!hill&&hh(22)<.03)D0('bush',Math.floor(hh(23)*4),24,25,1)}
        else if(c==='desert'){// (by water: an oasis, palms and green; elsewhere ripples, cacti, rocks, scrub, now and then bones)
          let wet=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<C&&y<R&&K[y*C+x]===KIND.water&&WS[y*C+x]<=120)wet++}
          if(wet&&!hill){for(let i=0;i<1+(hh(30)>.4?1:0)+(wet>2&&hh(31)>.5?1:0);i++){const [x,y]=at2(32+i,35+i);if(stand(PX.worldTree('desert','palm',Math.floor(hh(38+i)*4),0),x,y,3))out.trees+=own}
            for(let i=0;i<2;i++)D0('oasis',Math.floor(hh(41+i)*4),43+i,45+i)}
          else{if(!hill&&hh(10)<.3)D0('ripple',Math.floor(hh(11)*4),12,13);if(hh(14)<(hill?.04:.05))D0('cactus',Math.floor(hh(15)*4),16,17,1);if(hh(18)<(hill?.2:.03))D0(hill?'rock':'stone',Math.floor(hh(19)*4),20,21,1);
            if(hh(22)<.035)D0('scrub',Math.floor(hh(23)*4),24,25,1);if(!hill&&hh(26)<.012)D0('bones',Math.floor(hh(27)*4),28,29)}}
        else{if(!hill&&hh(10)<.14)D0('pool',Math.floor(hh(11)*4),12,13);if(hh(14)<.32)D0('reeds',Math.floor(hh(15)*4),16,17);if(hh(18)<.26)D0('moss',Math.floor(hh(19)*4),20,21);if(hh(22)<.04)D0('mushroom',Math.floor(hh(23)*4),24,25);
          if(hh(26)<.04)D0('stump',Math.floor(hh(27)*4),28,29,1);if(hh(30)<(hill?.08:.025))D0('bush',Math.floor(hh(31)*4),32,33,1);
          // (the fen's sparse trees, by groves: mangroves the most (PX.WORLD_TREES.swamp.fen))
          if(k===KIND.open){const p=FEN.p+FEN.swing*(VN(tx/FEN.g,ty/FEN.g,73)-.5),L=LAY[Math.floor(hh(59)*3)];
            for(let n=0;n<3;n++){if(hh(60+n)>=p)continue;const x=X+L[n*2][0]+Math.round((hh(63+n)-.5)*4),y=Y+L[n*2][1]+Math.round((hh(66+n)-.5)*3);
              if(kAt((x/ts)|0,(y/ts)|0)===KIND.water)continue;if(stand(PX.worldTree(c,pickTree(c,tx,ty,72+n,false,'fen')[0],Math.floor(hh(69+n)*4),0),x,y,3)){out.trees+=own;out.fen+=own}}}}}}}
    yield;let n=0;
    // (a sprite's pixels in the window: rows j0..j1, columns i0..i1 of its box)
    const clip=(N,X0,Y0)=>[Math.max(0,wx0-X0),Math.min(N,wx1-X0),Math.max(0,wy0-Y0),Math.min(N,wy1-Y0)];
    for(const [x,y,sp,water,mine] of flats){const N=sp.width,X0=x-sp.ax,Y0=y-sp.ay,[i0,i1,j0,j1]=clip(N,X0,Y0);if(!mine&&inI(X0,Y0,X0+N,Y0+N))out.cross.things++;for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++){const a=j*N+i;if(sp.a[a]!==1)continue;const q=at(X0+i,Y0+j),o=q*4;D[o]=sp.rgb[a*3];D[o+1]=sp.rgb[a*3+1];D[o+2]=sp.rgb[a*3+2];touch(q,water?2:1)}
      if(!(++n&255))yield}
    lap('things');yield;
    // (4) the ranges, mass by mass in order: each mass's height field reckoned once (massOf), painted where it reaches the window
    for(const m of P.M){if(ownT(m.q0%C,(m.q0/C)|0))out.peaks++;
      if(m.c0*ts-MASS_REACH>=wx1||(m.c1+1)*ts+MASS_REACH<=wx0||m.r0*ts-MASS_REACH>=wy1||(m.r1+1)*ts+MASS_REACH<=wy0)continue;
      const md=yield* massOf(P,m);if(!md||md.ex0>=wx1||md.ex1<=wx0||md.ey0>=wy1||md.ey1<=wy0)continue;
      if(!ownT(m.q0%C,(m.q0/C)|0)&&inI(md.ex0,md.ey0,md.ex1,md.ey1))out.cross.masses++;
      out.rock+=yield* massPaint(P.ro,md,{x:wx0,y:wy0,w:ww,h:wh,D,S,ZO,TO,I});
      // (a forested range's trees reaching the window stand with the rest, lifted by their ground's height (their foot's depth its
      //  ground's) and tinted by the slope's light; each counted where its foot is, whether it reaches that window or not)
      if(md.trees)for(const tr of md.trees){const sp=tr.sp,b=sp.box,X0=tr.x-sp.ax,Y0=tr.y-tr.z-sp.ay;own=ownP(tr.x,tr.y)?1:0;out.trees+=own;out.mtrees+=own;
        if(X0+b[2]>=wx0&&X0+b[0]<wx1&&Y0+b[3]>=wy0&&Y0+b[1]<wy1)items.push([tr.y,tr.x,sp,3,own,tr.z,tr.t])}}
    lap('ranges');
    // (5) what stands, sorted by its feet: every shadow first (on the ground, once each; a forested range's tree's on its rock, near
    //     its foot's depth), then each back to front. An outline goes down only on what is not its own kind (a wood's mass is
    //     outlined once, round its edge); nothing is drawn where the rock stands before it (its ground nearer than the thing's foot).
    //     A thing lifted (lz: a forested range's tree) stands lz px up the screen, its colours leaning by its tint (tn: + toward the
    //     dark, - toward the light, PX.WN_MOUNT.trees.light)
    items.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);const TLc=PX.WN_MOUNT.trees.light;
    for(const [y,x,sp,,,lz] of items){const o=sp.sh;for(let k=0;k<o.length;k+=2){const X=x+o[k],Y=y+o[k+1]-(lz|0);if(X<wx0||Y<wy0||X>=wx1||Y>=wy1)continue;const q=at(X,Y);
        if(lz){if((S[q]&7)!==2||S[q]&(64|8)||Math.abs(Y+ZO[q]-1-y)>4)continue}else if(S[q]&(64|7)||S[q]&128&&!laneOK(X,Y,false)||nearWet(X,Y))continue;S[q]|=64;mixD(q,SHC,.3);touch(q,S[q]&128?3:1)}
      if(!(++n&511))yield}
    yield;
    for(const [y,x,sp,cls,mine,lz,tn] of items){const N=sp.width,X0=x-sp.ax,Y0=y-(lz|0)-sp.ay,[i0,i1,j0,j1]=clip(N,X0,Y0),TC=tn>0?TLc.dark:TLc.light,ta=Math.abs(tn||0);if(!mine&&inI(X0,Y0,X0+N,Y0+N))out.cross.things++;for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++){const a=j*N+i,t=sp.a[a];if(!t)continue;const q=at(X0+i,Y0+j),o=q*4,low=S[q]&7;
        if(ZO[q]&&Y0+j+ZO[q]-1>y)continue;
        if(t===2){if(low===cls)continue;D[o]=NV[0];D[o+1]=NV[1];D[o+2]=NV[2]}else{D[o]=sp.rgb[a*3];D[o+1]=sp.rgb[a*3+1];D[o+2]=sp.rgb[a*3+2];if(ta){D[o]+=(TC[0]-D[o])*ta;D[o+1]+=(TC[1]-D[o+1])*ta;D[o+2]+=(TC[2]-D[o+2])*ta}}S[q]=(S[q]&~15)|cls;ZO[q]=0;touch(q,S[q]&128?(CLR.at(X0+i,Y0+j)?3:4):cls===3&&nearWet(X0+i,Y0+j)?4:1)}
      if(!(++n&127))yield}
    lap('stand');out.stand=standIndex(items,I,ZO,wx0,wy0,ww,wh);out.ms=performance.now()-t0;return out};
  /* the standing index of a window's inner rect I (what PX.worldNatureSteps hands back as stand, for the game's depth order:
     gfx/depth.js draws what stands in front of a figure again over it): each standing thing whose drawn pixels reach into I (a
     tree, a wood's trees, a bush, a stone, a cactus) and each column run of the ranges' rock there (rock rising up the screen, as
     the battle's faces are cut: its foot the ground y of its nearest pixel, ZO), sorted by foot. {X, Y, w, h (I), n, E (Int16, 4
     an entry, X, Y its origin: ox, oy, ref, foot; ref a sprite's number in PX.WN_SPR, its pixels sp.a from (ox, oy); or -len, a
     run of rock at column ox from row oy, len rows), and a grid of STAND_CELL px cells over I for the lookup: C, R, at (C*R+1
     starts), L (the entries each cell's pixels reach, in foot order)}. 8 bytes an entry, 2-4 more in the grid */
  PX.WN_SPR=[];const STAND_CELL=32;
  const sprNo=sp=>sp._wn!=null?sp._wn:(sp._wn=PX.WN_SPR.push(sp)-1);
  function standIndex(items,I,ZO,wx0,wy0,ww,wh){const X=I.x,Y=I.y,w=I.w,h=I.h,ex1=X+w,ey1=Y+h,A=[];
    for(const [y,x,sp,,,lz] of items){const ox=x-sp.ax,oy=y-(lz|0)-sp.ay,b=sp.box;if(ox+b[2]<X||ox+b[0]>=ex1||oy+b[3]<Y||oy+b[1]>=ey1)continue;A.push([y,ox,oy,sprNo(sp)])}
    for(let x=X;x<ex1;x++){const c=x-wx0;for(let r=0;r<wh;r++){if(!ZO[r*ww+c])continue;let r1=r,f=0;while(r1<wh&&ZO[r1*ww+c]){const g=wy0+r1+ZO[r1*ww+c]-1;if(g>f)f=g;r1++}
      const a=Math.max(wy0+r,Y),b=Math.min(wy0+r1,ey1);if(a<b)A.push([f,x,a,a-b]);r=r1}}
    A.sort((p,q)=>p[0]-q[0]||p[1]-q[1]||p[2]-q[2]);
    const n=A.length,E=new Int16Array(n*4),C=Math.ceil(w/STAND_CELL),R=Math.ceil(h/STAND_CELL),cnt=new Uint32Array(C*R+1),bx=new Int16Array(n*4);
    A.forEach(([f,ox,oy,ref],k)=>{E.set([ox-X,oy-Y,ref,f-Y],k*4);const s=ref>=0?PX.WN_SPR[ref].box:[0,0,0,-ref-1];
      bx.set([Math.max(0,ox+s[0]-X)/STAND_CELL|0,Math.max(0,oy+s[1]-Y)/STAND_CELL|0,Math.min(w-1,ox+s[2]-X)/STAND_CELL|0,Math.min(h-1,oy+s[3]-Y)/STAND_CELL|0],k*4)});
    const each=fn=>{for(let k=0;k<n;k++)for(let j=bx[k*4+1];j<=bx[k*4+3];j++)for(let i=bx[k*4];i<=bx[k*4+2];i++)fn(j*C+i,k)};
    each(q=>cnt[q+1]++);for(let q=0;q<C*R;q++)cnt[q+1]+=cnt[q];const at=cnt.slice(),L=new (n<65536?Uint16Array:Uint32Array)(cnt[C*R]);each((q,k)=>{L[at[q]++]=k});
    return{X,Y,w,h,n,E,C,R,cell:STAND_CELL,at:cnt,L,get bytes(){return E.byteLength+cnt.byteLength+L.byteLength}}}
  PX.worldNaturePaint=(P,win,D,TO)=>runSteps(PX.worldNatureSteps(P,win,D,TO));
  // PX.worldNature(spec): the whole of a small map in one go (spec: the plan's, with D, its RGBA, and touch, a byte a pixel)
  PX.worldNature=spec=>{const t0=performance.now(),P=PX.worldNaturePlan(spec),o=PX.worldNaturePaint(P,{x:0,y:0,w:spec.W,h:spec.H},spec.D,spec.touch||null);o.ms=performance.now()-t0;
    let s=0;o.t=Object.keys(o.tm).map(k=>k+' '+(s+=o.tm[k]).toFixed(0)).join(', ');return o};
})(window.PX=window.PX||{});
