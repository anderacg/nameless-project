'use strict';
/* ---------- the world, painted in detail, a chunk at a time ---------- */
// The world map is painted in chunks of CHUNK px (512: 32 × 32 tiles), never as one canvas (a big map's would pass what a browser
// allows). A chunk: ground per pixel (each climate's colors in soft light and dark patches, fine speckle, ragged borders between
// climates, water shading from shallows to deep), the camps' and estates' trampled ground, the land's nature (engine/
// worldnature.js: woods, hills, mountain ranges and small things), then beaches and ice rims, roads that join their neighbors,
// bridges and ore veins. Each chunk is exactly the whole map's picture there (no seams): it is painted over a window PX.WN_APRON px
// larger, kept to the chunk, and whatever stands across its edge (a tree, a range, a road) is painted into every chunk it touches.
// worldArtPlan(): what the chunks share, made from the map and its holdings as they stand and kept until WorldArt.invalidate().
// WorldArt keeps the chunks near you (an LRU), paints those in view at once and those ahead a few ms a frame, and blits them.
// drawEnv adds what moves.
const GROUND_RGB={grass:[[70,110,50],[84,126,58],[104,146,70]],frost:[[192,203,218],[214,222,232],[238,243,249]],desert:[[196,162,88],[214,182,104],[232,204,132]],swamp:[[58,72,42],[72,88,52],[90,106,62]]};
const WATER_RGB={grass:[[96,150,204],[58,104,166],[36,70,126]],frost:[[184,212,232],[150,184,212],[124,160,196]],desert:[[96,156,196],[58,112,164],[38,80,134]],swamp:[[84,112,88],[64,90,72],[48,70,56]]};
const SHORE={grass:['#d6c48c','#b8a46e'],frost:['#f4f8fc','#c8d8e8'],desert:['#ecd49a','#c8ac70'],swamp:['#6a6040','#504830']};
const hs=(x,y,s)=>{let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,1274126177);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
// CLEAR: a bit a map pixel (PX.TileMask: a byte a tile, bits only for a tile part clear), set where nothing may stand: roads and
// their margins, holdings and their yards, camps and estate plots. Trees, hills, peaks and small things are only painted where they
// touch none of it. The plan's (null until it is made; isClear makes it)
let CLEAR=null;
const isClear=(x,y)=>{x|=0;y|=0;return WorldArt.ensure().clear.at(x,y)===1};
const hex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
// what the land's nature painted (worldnature.js: its counts over the whole picture, WorldArt.whole), and where (tests set
// NATURE_TOUCH to a byte a map pixel before painting)
let NATURE=null,NATURE_TOUCH=null;
const CHUNK=512;
const DIRT={grass:[150,128,84],frost:[176,170,158],desert:[200,170,112],swamp:[104,92,64]};
const ROADC={grass:['#8a7448','#b89b62','#cdb47e'],frost:['#8e8a80','#b8b2a6','#d4cfc4'],desert:['#a8884c','#c9a868','#dcc084'],swamp:['#5a4a34','#7a6a48','#8e7e5a']};
const clAt=(x,y)=>CLIMS[climate[Math.max(0,Math.min(MH-1,y))*MW+Math.max(0,Math.min(MW-1,x))]];
// road tiles with water on both sides are bridges: water under the deck
const onBridge=(x,y)=>tAt(x,y)===T_ROAD&&(tAt(x-1,y)===T_WATER&&tAt(x+1,y)===T_WATER||tAt(x,y-1)===T_WATER&&tAt(x,y+1)===T_WATER);
const mkcv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').imageSmoothingEnabled=false;return c};

// the plan: the clear ground; the water's depth (tiles from the nearest land, up to 4; 9 deeper); the trampled patches (camps, the
// timber and ore estates), in order; the holdings' tiles (roads lead into them) and the road tiles shifted to their gates; the
// land's nature's (PX.worldNaturePlan)
function worldArtPlan(){
  const clear=new PX.TileMask(MW,MH,TILE),mark=(x,y,w,h)=>clear.fill(x|0,y|0,w,h);
  const dep=new Uint8Array(MW*MH);for(let i=0;i<MW*MH;i++)dep[i]=tiles[i]===T_WATER?9:0;
  for(let pass=1;pass<=4;pass++)for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=y*MW+x;if(dep[i]!==9)continue;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+a,ny=y+b;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const n=dep[ny*MW+nx];if(n===pass-1&&(pass>1||tiles[ny*MW+nx]!==T_WATER)){dep[i]=pass;break}}}
  // nothing grows under a holding's buildings and fields (lots.js), at its gate, in a camp or on an estate's plots
  const tramples=[];
  for(const t of TOWNS){mark(t.tx*TILE,t.ty*TILE,TILE,TILE);mark(t.x-12,t.y-14,24,24);// its gate, where you arrive
    for(const l of t.lots||[]){mark(l.x*TILE-2,l.y*TILE-2,l.n*TILE+4,l.n*TILE+4);for(const [x,y] of l.plots||[])mark(x*TILE,y*TILE,TILE,TILE)}}
  for(const c of CAMP_SPOTS){tramples.push([c.x+8,c.y+4,14,7,.5]);mark(c.x-24,c.y-40,64,64)}
  for(const t of TOWNS){const sp=bldSpots(t);for(const k in sp){const p=sp[k];if(k==='lumber'||k==='mine')tramples.push([p.x,p.y+3,9,5,.4])}}
  // where a road tile's path runs through: its middle, but at a holding's gate (and its own tile) half a tile to the left, so the
  // road comes up to the middle of the centre building's door (its gate lies on the line between two tiles)
  const P={clear,dep,tramples,towns:new Set(TOWNS.map(t=>t.ty*MW+t.tx)),shift:new Set(TOWNS.flatMap(t=>[t.ty*MW+t.tx,(t.ty+1)*MW+t.tx])),gen:WM.gen!=='classic-0'};
  // (the roads' bands and a margin kept clear, before the land's nature: by tile on today's map, along their lines on the generated)
  if(P.gen)artGenPlan(P,mark);else for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++)roadStamps(P,tx,ty,0,(x,y,w)=>mark(x-1,y-1,w+2,w+2));
  P.nature=PX.worldNaturePlan({W:MW*TILE,H:MH*TILE,C:MW,R:MH,ts:TILE,kind:tiles,clim:climate,clear,seed:7,...P.gen?{flow:WM.flow,river:WM.river,water:WATER_RGB}:{}});
  CLEAR=clear;return P;
}
// a road tile's band: from its path point to halfway to each road neighbor (so a shifted one still meets its neighbours), a square
// a step, w wide (pass 0: 9, the band kept clear; 1: 7, its dark edge; 2: 5, its middle; a bridge's deck in wood): st(x, y, w, colour)
const pathX=(P,x,y)=>x*TILE+8-(P.shift.has(y*MW+x)?8:0);
function roadStamps(P,tx,ty,pass,st){
  if(tAt(tx,ty)!==T_ROAD)return;const X=pathX(P,tx,ty),Y=ty*TILE+8,[e,m]=ROADC[clAt(tx,ty)],w=[9,7,5][pass],col=onBridge(tx,ty)?[null,'#3e2818','#8a6038'][pass]:[null,e,m][pass],h=w>>1;
  const isRoad=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&P.towns.has(y*MW+x)||tAt(x,y)===T_ROAD;
  const arms=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].filter(([a,b])=>isRoad(tx+a,ty+b)&&!(a&&b&&(isRoad(tx+a,ty)||isRoad(tx,ty+b))));
  st(X-h,Y-h,w,col);for(const [a,b] of arms){const mx=(X+pathX(P,tx+a,ty+b))/2,my=Y+b*8,n=Math.max(Math.abs(mx-X),Math.abs(my-Y));
    for(let s=0;s<=n;s++){const jx=Math.round((hs(tx*8+s,ty,a+3*b)-.5)*1.2);st(Math.round(X+(mx-X)*s/n)-h+(b?jx:0),Math.round(Y+(my-Y)*s/n)-h+(a?jx:0),w,col)}}
}
// the ground of the window x0, y0, w×h (px) into D, its RGBA: a smooth light field (one value per tile corner) and the water's depth
// read between the corners; a row of pixels a step
function* groundSteps(P,D,x0,y0,w,h){
  if(P.gen)return yield* artGenGround(P,D,x0,y0,w,h);
  const Wp=MW*TILE,Hp=MH*TILE,tx0=x0>>4,ty0=y0>>4,tx1=(x0+w-1)>>4,ty1=(y0+h-1)>>4,LW=tx1-tx0+2,LG=new Float32Array(LW*(ty1-ty0+2)),DG=new Float32Array(LW*(ty1-ty0+2)),dep=P.dep;
  for(let y=ty0;y<=ty1+1;y++)for(let x=tx0;x<=tx1+1;x++){const k=(y-ty0)*LW+x-tx0;LG[k]=(fbm(x/4.5,y/4.5,77)-.5)*2;
    let s=0,n=0;for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const tx=x+a,ty=y+b;if(tx<0||ty<0||tx>=MW||ty>=MH)continue;s+=Math.min(4,dep[ty*MW+tx]===9?4:dep[ty*MW+tx]);n++}DG[k]=n?s/n:4}
  const BR=(tx,ty)=>{const i=ty*MW+tx;return tx>0&&ty>0&&tx<MW-1&&ty<MH-1&&tiles[i]===T_ROAD&&(tiles[i-1]===T_WATER&&tiles[i+1]===T_WATER||tiles[i-MW]===T_WATER&&tiles[i+MW]===T_WATER)};
  const CL=CLIMS.map(c=>GROUND_RGB[c]),WL=CLIMS.map(c=>WATER_RGB[c]);
  for(let y=y0;y<y0+h;y++){const ty=y>>4,fy=(y&15)/16;
    for(let x=x0;x<x0+w;x++){const tx=x>>4,fx=(x&15)/16,o=((y-y0)*w+x-x0)*4;
      // ragged climate borders: read the climate a few pixels off, jittered in 3-pixel blocks
      const jx=Math.min(Wp-1,Math.max(0,x+Math.floor((hs(x/3|0,y/3|0,5)-.5)*14))),jy=Math.min(Hp-1,Math.max(0,y+Math.floor((hs(x/3|0,y/3|0,6)-.5)*14)));
      const ci=climate[(jy>>4)*MW+(jx>>4)],i=ty*MW+tx,q=(ty-ty0)*LW+tx-tx0;let c;
      const bl=A=>{const a=A[q],b=A[q+1],cc=A[q+LW],d=A[q+LW+1];return a+(b-a)*fx+(cc-a)*fy+(a-b-cc+d)*fx*fy};
      if(tiles[i]===T_WATER||BR(tx,ty)){const d=bl(DG),P3=WL[ci],wv=hs(x>>1,y,8);c=d<1.5?mixc(P3[0],P3[1],Math.max(0,d-.5)):mixc(P3[1],P3[2],Math.min(1,(d-1.5)/2.5));
        if(wv<.02)c=mixc(c,[255,255,255],.25)}
      else{const L=bl(LG),P3=CL[ci],b4=hs(x>>2,y>>2,3);let v=.5+.38*L+.22*(b4-.5);v=Math.max(0,Math.min(1,v));c=v<.5?mixc(P3[0],P3[1],v*2):mixc(P3[1],P3[2],(v-.5)*2);
        const ph=hs(x,y,9);if(ph<.035)c=mixc(c,P3[2],.6);else if(ph>.965)c=mixc(c,P3[0],.7)}
      D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255}
    if(!((y-y0+1)&7))yield}
}
// a trampled patch [cx, cy, rx, ry, amount] over the window: worn ground, ragged at its edge, never on water
function trample(D,x0,y0,w,h,[cx,cy,rx,ry,amt]){for(let yy=-ry;yy<=ry;yy++)for(let xx=-rx;xx<=rx;xx++){const x=cx+xx,y=cy+yy;if(x<x0||y<y0||x>=x0+w||y>=y0+h)continue;
  const d=(xx*xx)/(rx*rx)+(yy*yy)/(ry*ry),edge=1-hs(x,y,17)*.35;if(d>edge||tiles[(y>>4)*MW+(x>>4)]===T_WATER)continue;const o=((y-y0)*w+x-x0)*4,dc=DIRT[CLIMS[climate[(y>>4)*MW+(x>>4)]]],k=amt*(d>edge-.25?.5:1)*(.75+hs(x,y,18)*.25);
  D[o]+=(dc[0]-D[o])*k;D[o+1]+=(dc[1]-D[o+1])*k;D[o+2]+=(dc[2]-D[o+2])*k}}
// over the land's nature, drawn on a canvas g in map pixels, each pass over the tiles tx0..tx1, ty0..ty1 in the map's order (a
// chunk's and a tile round it: whatever reaches into it)
const OVER=[
  // shores: a beach (or ice, or mud) on the land side, a line of foam on the water side
  (P,r,tx0,ty0,tx1,ty1)=>{for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){if(tAt(tx,ty)===T_WATER||onBridge(tx,ty))continue;const X=tx*TILE,Y=ty*TILE,c=clAt(tx,ty),[s0,s1]=SHORE[c];
    for(const [a,b] of [[0,-1],[0,1],[-1,0],[1,0]]){if(tAt(tx+a,ty+b)!==T_WATER||tx+a<0||ty+b<0||tx+a>=MW||ty+b>=MH)continue;
      for(let k=0;k<TILE;k++){const w=1+(hs(X+k,Y,b+2*a+11)>.45?1:0)+(hs(X+k,Y,b+2*a+12)>.85?1:0);
        const [px,py,ww,hh]=b===-1?[X+k,Y,1,w]:b===1?[X+k,Y+TILE-w,1,w]:a===-1?[X,Y+k,w,1]:[X+TILE-w,Y+k,w,1];r(s0,px,py,ww,hh);
        const [fx,fy]=b===-1?[X+k,Y-1]:b===1?[X+k,Y+TILE]:a===-1?[X-1,Y+k]:[X+TILE,Y+k];if(hs(fx,fy,4)>.3)r(c==='frost'?'#e8f2fa':c==='swamp'?'#7a9a7a':'#c8e0f4',fx,fy,1,1);
        if(w>1&&hs(px,py,13)<.15)r(s1,px,py,1,1)}}}},
  // roads: the dark edge, then the middle, with ruts and stones
  (P,r,tx0,ty0,tx1,ty1)=>{for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++)roadStamps(P,tx,ty,1,(x,y,w,col)=>r(col,x,y,w,w))},
  (P,r,tx0,ty0,tx1,ty1)=>{for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++)roadStamps(P,tx,ty,2,(x,y,w,col)=>r(col,x,y,w,w))},
  // bridge planks across the deck, rails along it and posts in the water (a deck 10 wide, as wide as anyone crossing it: walk,
  // world.js, keeps them to its middle); then the stones on the roads
  (P,r,tx0,ty0,tx1,ty1)=>{for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){if(!onBridge(tx,ty))continue;const X=tx*TILE,Y=ty*TILE,vert=tAt(tx-1,ty)===T_WATER;
      if(vert){r('#8a6038',X+3,Y,10,16);for(let y=0;y<16;y+=2)r('#6a4628',X+3,Y+y,10,1);r('#3e2818',X+2,Y,1,16);r('#3e2818',X+13,Y,1,16);r('#2a1a10',X+1,Y+4,1,3);r('#2a1a10',X+14,Y+11,1,3)}
      else{r('#8a6038',X,Y+3,16,10);for(let x=0;x<16;x+=2)r('#6a4628',X+x,Y+3,1,10);r('#3e2818',X,Y+2,16,1);r('#3e2818',X,Y+13,16,1);r('#2a1a10',X+4,Y+14,1,2);r('#2a1a10',X+11,Y+14,1,2)}}
    for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){if(tAt(tx,ty)!==T_ROAD||onBridge(tx,ty))continue;const X=tx*TILE,Y=ty*TILE,c=ROADC[clAt(tx,ty)];for(let k=0;k<6;k++){const px=X+4+Math.floor(hs(tx,ty,k)*8),py=Y+4+Math.floor(hs(tx,ty,k+9)*8);r(k<2?c[0]:c[2],px,py,1,1)}}},
  // an ore vein: a few bright flecks of its metal low on the hill or mountain
  (P,r,tx0,ty0,tx1,ty1)=>{for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const t=tAt(tx,ty);if((t!==T_HILL&&t!==T_MOUNT)||DEP_AT[ty*MW+tx]<0)continue;const X=tx*TILE,Y=ty*TILE,h=k=>hs(tx,ty,k+40),col=GOODS[DEPOSITS[DEP_AT[ty*MW+tx]].g].col;
    for(let k=0;k<4;k++){const x=X+4+Math.floor(h(20+k)*8),y=Y+9+Math.floor(h(24+k)*5);r('#2a2620',x,y+1,2,1);r(col,x,y,2,1);if(k<2)r('#ffffff',x,y,1,1)}}}];
/* ---------- the generated world's water and roads (doc/WORLD_DESIGN.md §12.1; WM.gen not 'classic-0': today's map keeps the art
   above, pixel for pixel). The water by the pixel (wpx): each water tile square (sea and lake, river, a ford's shallows, under a
   bridge: the plan's wk), its edges wobbling a pixel or two, its outer corners rounded and its inner ones a little (within the
   3 px by the water that the land's nature keeps clear), so a river's stairs read as bends. Over the window painted and a margin,
   each pixel's distance to the water's edge (wdist), and by it: rivers shaded by width (light at the bank, deeper in the middle
   of a wide one), a ford's shallows lighter; the sea and lakes as before, with a pale shallow halo along the shore (soft, cloudy
   edges), a few wave strokes and foam at the edge; on land a sand rim by the sea and lakes, a muddy bank by a river (a seasonal
   river's pale gravel and a dotted line). Roads (artGenRoads) follow their lines (WM.roads' line: the generator's smoothed ways, at
   any angle): each pixel shaded by how far inside the nearest band it lies: a worn verge, a dark edge, the middle with ruts (a
   track's middle grassed between them) and stones, a great road wider than a track, a little wider or narrower along the way;
   forks and gates join where the bands meet. Over the land's nature (OVER_GEN): reeds and stones on the river banks, the
   crossings (stone or wooden bridges, a ford's stepping stones, a ferry's landings, its raft and rope), white water on the
   rapids, the ore veins.
   GENART: corners' radii (outer, inner), the edges' wobble (px either way), the shallows' halo, the sand rim, a river's bank (px
   from the water); half a track's and a great road's width, the verge beyond it; the margin painted round a window (px) */
const GENART={round:7,inner:5,wob:1.6,halo:11,sand:2.6,bank:2.4,road:[2.3,3.6],verge:2.8,margin:14};
const rgbOf=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const SHORE_RGB=Object.fromEntries(Object.entries(SHORE).map(([k,v])=>[k,v.map(rgbOf)])),ROAD_RGB=Object.fromEntries(Object.entries(ROADC).map(([k,v])=>[k,v.map(rgbOf)]));
const MUD={grass:[96,80,52],frost:[150,156,168],desert:[150,120,72],swamp:[62,54,36]},SEA_FOAM={grass:[200,224,244],frost:[232,242,250],desert:[206,228,244],swamp:[122,154,122]};
// (a smooth noise: along a line, hs at whole steps eased between; over the plane, the same at the lattice's corners)
const wnoise=(t,s)=>{const i=Math.floor(t),f=t-i,u=f*f*(3-2*f);return hs(i,s,71)*(1-u)+hs(i+1,s,71)*u};
const wnoise2=(x,y,s)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hs(i,j,s),b=hs(i+1,j,s),c=hs(i,j+1,s),d=hs(i+1,j+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
// the plan's part: the water by tile (wk: 0 land, 1 sea or lake, 2 river, 3 ford, 4 a bridge's water), the roads' segments (segs:
// [x0, y0, x1, y1, great] px, from their lines; a road tile no line runs through, as lots.js leads roads round a holding's centre
// to its gate, joined centre to centre to the road tiles round it) and their bands kept clear, the holdings' centres (box: no
// road painted under them)
function artGenPlan(P,mark){const N=MW*MH,K=P.wk=new Uint8Array(N),Rv=WM.river,Fe=WM.feat;
  for(let i=0;i<N;i++){const t=tiles[i];K[i]=t===T_WATER?(Rv[i]&3?2:1):t===T_FORD?3:t===T_ROAD&&Fe[i]&32?4:0}
  const S=[];
  // (each line cut at its corners twice, Chaikin's way, its ends kept: a stretch the generator left in steps reads as a gentle bend)
  const soft=l=>{for(let t=0;t<2;t++){const o=[l[0],l[1]];for(let j=2;j<l.length;j+=2){const a=l[j-2],b=l[j-1],c=l[j],d=l[j+1];o.push(a*.75+c*.25,b*.75+d*.25,a*.25+c*.75,b*.25+d*.75)}o.push(l[l.length-2],l[l.length-1]);l=o}return l};
  for(const r of WM.roads){const k=r.kind==='road'?1:0;for(const l0 of r.line){const l=soft(l0);for(let j=2;j<l.length;j+=2){const a=l[j-2]*TILE,b=l[j-1]*TILE,c=l[j]*TILE,d=l[j+1]*TILE;
    S.push(a,b,c,d,k)}}}
  for(let k=0;k<S.length;k+=5){const a=S[k],b=S[k+1],c=S[k+2],d=S[k+3],hw=Math.ceil(GENART.road[S[k+4]]*1.15)+2,n=Math.max(1,Math.ceil(Math.max(Math.abs(c-a),Math.abs(d-b))/3));
    for(let s=0;s<=n;s++)mark(Math.round(a+(c-a)*s/n)-hw,Math.round(b+(d-b)*s/n)-hw,2*hw+1,2*hw+1)}
  P.segs=Float32Array.from(S);const B=P.box=new Uint8Array(N);
  if(typeof centreBox==='function')for(const t of TOWNS){const b=centreBox(t);for(let y=Math.max(0,b.y);y<Math.min(MH,b.y+b.n);y++)for(let x=Math.max(0,b.x);x<Math.min(MW,b.x+b.n);x++)B[y*MW+x]=1}}
// is map pixel (x, y) water (1) or land (0): its tile's, but at a corner rounded (outer, where the two tiles beside it are the other
// kind; inner, where those and the one across are) and along an edge moved by its wobble (the same from either side)
function wpx(K,x,y){const tx=x>>4,ty=y>>4,fx=x&15,fy=y&15,R=GENART.round,Ri=GENART.inner,at=(u,v)=>u<0||v<0||u>=MW||v>=MH||K[v*MW+u]>0,w=at(tx,ty);
  const cx=fx<8?-1:1,cy=fy<8?-1:1,ex=cx<0?fx:15-fx,ey=cy<0?fy:15-fy,ox=at(tx+cx,ty),oy=at(tx,ty+cy);
  if(w&&!ox&&!oy&&ex<R&&ey<R){const a=R-ex-.5,b=R-ey-.5;if(a*a+b*b>R*R)return 0}
  if(!w&&ox&&oy&&ex<Ri&&ey<Ri&&at(tx+cx,ty+cy)){const a=Ri-ex-.5,b=Ri-ey-.5;if(a*a+b*b>Ri*Ri)return 1}
  if(fy<3||fy>12){const s=fy<3?0:1,o=(wnoise(x/6,(ty+s)*2)-.5)*2*GENART.wob,n=at(tx,ty+(s?1:-1));if(n!==w&&(s?fy+.5-16>=o:fy+.5<o))return n?1:0}
  if(fx<3||fx>12){const s=fx<3?0:1,o=(wnoise(y/6,(tx+s)*2+1)-.5)*2*GENART.wob,n=at(tx+(s?1:-1),ty);if(n!==w&&(s?fx+.5-16>=o:fx+.5<o))return n?1:0}
  return w?1:0}
// (each pixel's distance to the edge between water and land, W x H of mask M: 1 px steps, 1.414 diagonal; at most 16)
function* wdist(M,W,H){const D=new Float32Array(W*H).fill(16);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,m=M[i];if(x>0&&M[i-1]!==m||x<W-1&&M[i+1]!==m||y>0&&M[i-W]!==m||y<H-1&&M[i+W]!==m)D[i]=.5}
  yield;for(let y=0;y<H;y++){if(!(y&63))yield;for(let x=0;x<W;x++){const i=y*W+x;let d=D[i];if(x>0)d=Math.min(d,D[i-1]+1);if(y>0){d=Math.min(d,D[i-W]+1);if(x>0)d=Math.min(d,D[i-W-1]+1.414);if(x<W-1)d=Math.min(d,D[i-W+1]+1.414)}D[i]=d}}
  for(let y=H-1;y>=0;y--){if(!(y&63))yield;for(let x=W-1;x>=0;x--){const i=y*W+x;let d=D[i];if(x<W-1)d=Math.min(d,D[i+1]+1);if(y<H-1){d=Math.min(d,D[i+W]+1);if(x<W-1)d=Math.min(d,D[i+W+1]+1.414);if(x>0)d=Math.min(d,D[i+W-1]+1.414)}D[i]=d}}
  return D}
// (the water tile a pixel of tile (tx, ty) belongs to: its own, else the nearest round it; -1 none)
const WNEAR=[[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
function wnear(K,tx,ty){if(tx>=0&&ty>=0&&tx<MW&&ty<MH&&K[ty*MW+tx])return ty*MW+tx;for(const [a,b] of WNEAR){const u=tx+a,v=ty+b;if(u>=0&&v>=0&&u<MW&&v<MH&&K[v*MW+u])return v*MW+u}return -1}
// the generated world's ground of the window x0, y0, w×h into D (groundSteps' part)
function* artGenGround(P,D,x0,y0,w,h){
  const MG=GENART.margin,X0=x0-MG,Y0=y0-MG,RW=w+2*MG,RH=h+2*MG,M=new Uint8Array(RW*RH),K=P.wk,Rv=WM.river,G=GENART;
  // (a tile whose 8 neighbours are all its kind is that kind to its every pixel: only the tiles at an edge are worked a pixel at a time)
  const kd=(u,v)=>u<0||v<0||u>=MW||v>=MH||K[v*MW+u]>0?1:0;
  for(let ty=Y0>>4;ty<=(Y0+RH-1)>>4;ty++){for(let tx=X0>>4;tx<=(X0+RW-1)>>4;tx++){const k=kd(tx,ty);let same=true;for(let b=-1;b<=1&&same;b++)for(let a=-1;a<=1;a++)if(kd(tx+a,ty+b)!==k){same=false;break}
      const ya=Math.max(Y0,ty*16),yb=Math.min(Y0+RH,ty*16+16),xa=Math.max(X0,tx*16),xb=Math.min(X0+RW,tx*16+16);
      for(let y=ya;y<yb;y++){const o=(y-Y0)*RW-X0;if(same)M.fill(k,o+xa,o+xb);else for(let x=xa;x<xb;x++)M[o+x]=wpx(K,x,y)}}
    yield}
  const DT=yield* wdist(M,RW,RH);yield;
  const Wp=MW*TILE,Hp=MH*TILE,tx0=x0>>4,ty0=y0>>4,tx1=(x0+w-1)>>4,ty1=(y0+h-1)>>4,LW=tx1-tx0+2,LG=new Float32Array(LW*(ty1-ty0+2)),DG=new Float32Array(LW*(ty1-ty0+2)),dep=P.dep;
  for(let y=ty0;y<=ty1+1;y++)for(let x=tx0;x<=tx1+1;x++){const k=(y-ty0)*LW+x-tx0;LG[k]=(fbm(x/4.5,y/4.5,77)-.5)*2;
    let s=0,n=0;for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const tx=x+a,ty=y+b;if(tx<0||ty<0||tx>=MW||ty>=MH)continue;s+=Math.min(4,dep[ty*MW+tx]===9?4:dep[ty*MW+tx]);n++}DG[k]=n?s/n:4}
  const CL=CLIMS.map(c=>GROUND_RGB[c]),WL=CLIMS.map(c=>WATER_RGB[c]);
  for(let y=y0;y<y0+h;y++){const ty=y>>4,fy=(y&15)/16;
    for(let x=x0;x<x0+w;x++){const tx=x>>4,fx=(x&15)/16,o=((y-y0)*w+x-x0)*4,r=(y-Y0)*RW+x-X0,dd=DT[r];
      const jx=Math.min(Wp-1,Math.max(0,x+Math.floor((hs(x/3|0,y/3|0,5)-.5)*14))),jy=Math.min(Hp-1,Math.max(0,y+Math.floor((hs(x/3|0,y/3|0,6)-.5)*14)));
      const ci=climate[(jy>>4)*MW+(jx>>4)],cn=CLIMS[ci],q=(ty-ty0)*LW+tx-tx0,bl=A=>{const a=A[q],b=A[q+1],cc=A[q+LW],d=A[q+LW+1];return a+(b-a)*fx+(cc-a)*fy+(a-b-cc+d)*fx*fy};let c;
      if(M[r]){const j=wnear(K,tx,ty),k=j<0?1:K[j],P3=WL[ci];
        if(k===1){const d=bl(DG);c=d<1.5?mixc(P3[0],P3[1],Math.max(0,d-.5)):mixc(P3[1],P3[2],Math.min(1,(d-1.5)/2.5));
          if(dd<G.halo){const hk=Math.min(1,(1-dd/G.halo)*(.35+.9*wnoise2(x/9,y/9,23)));c=mixc(c,mixc(P3[0],[232,242,238],.45),hk*.8)}
          if(dd<1.3&&hs(x,y,4)>.3)c=SEA_FOAM[cn];
          else if(dd>3.5&&dd<G.halo-1){const sy=y>>2,sx=x+(sy&1)*4;if(hs(sx>>3,sy,29)<.08&&(sx&7)<4&&(y&3)===1)c=mixc(c,[255,255,255],.4)}}
        else{const wr=Math.max(1,Rv[j]&3),t1=Math.min(1,dd/(2+wr*2));c=mixc(P3[0],P3[1],.2+.6*t1);if(wr===3)c=mixc(c,P3[2],Math.max(0,Math.min(1,(dd-5)/8))*.6);if(cn==='swamp')c=mixc(c,[56,92,100],.35);if(dd<1.2)c=mixc(c,[200,190,150],.2);
          if(k===3){c=mixc(c,DIRT[cn],.38);if(hs(x>>1,y,8)<.07)c=mixc(c,[255,255,255],.35)}}
        if(hs(x>>1,y,8)<.02)c=mixc(c,[255,255,255],.25)}
      else{const L=bl(LG),P3=CL[ci],b4=hs(x>>2,y>>2,3);let v=.5+.38*L+.22*(b4-.5);v=Math.max(0,Math.min(1,v));c=v<.5?mixc(P3[0],P3[1],v*2):mixc(P3[1],P3[2],(v-.5)*2);
        const ph=hs(x,y,9);if(ph<.035)c=mixc(c,P3[2],.6);else if(ph>.965)c=mixc(c,P3[0],.7);
        if(dd<4.5){const j=wnear(K,tx,ty);if(j>=0){const k=K[j];
          if(k===1){const [s0,s1]=SHORE_RGB[cn];if(dd<G.sand)c=dd<1.3?mixc(s0,s1,.5):hs(x,y,13)<.15?s1:s0;else if(dd<G.sand+1.5)c=mixc(c,s0,.45*(1-(dd-G.sand)/1.5))}
          else if(Rv[j]&8){if(dd<2.8)c=mixc(c,[190,182,162],.6);if(dd>=1.8&&dd<2.9&&(x+y)%3===0)c=mixc(c,[104,98,86],.7)}
          else if(dd<G.bank+1)c=mixc(c,MUD[cn],.55*Math.min(1,(G.bank+1-dd)/2))}}}
      D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255}
    if(!((y-y0+1)&3))yield}
}
// the roads over the window's ground (paintSteps, before the land's nature): each pixel by the band it lies deepest in (SC: half
// the band's width, a little more or less along the way, less its distance from the line; DL: that distance; KF: a great road)
function* artGenRoads(P,D,x0,y0,w,h){const S=P.segs,K=P.wk,B=P.box,RD=GENART.road,V=GENART.verge,R=RD[1]*1.15+V+1,SC=new Float32Array(w*h).fill(-99),DL=new Float32Array(w*h),KF=new Uint8Array(w*h);
  for(let k=0;k<S.length;k+=5){const a=S[k],b=S[k+1],c=S[k+2],d=S[k+3],g=S[k+4];if(Math.max(a,c)+R<x0||Math.min(a,c)-R>=x0+w||Math.max(b,d)+R<y0||Math.min(b,d)-R>=y0+h)continue;
    const vx=c-a,vy=d-b,L=vx*vx+vy*vy,px0=Math.max(x0,Math.floor(Math.min(a,c)-R)),px1=Math.min(x0+w-1,Math.ceil(Math.max(a,c)+R)),py0=Math.max(y0,Math.floor(Math.min(b,d)-R)),py1=Math.min(y0+h-1,Math.ceil(Math.max(b,d)+R));
    for(let y=py0;y<=py1;y++)for(let x=px0;x<=px1;x++){const ex=x+.5-a,ey=y+.5-b,t=L?Math.max(0,Math.min(1,(ex*vx+ey*vy)/L)):0,dx=ex-vx*t,dy=ey-vy*t,dl=Math.sqrt(dx*dx+dy*dy);if(dl>R)continue;
      const s=RD[g]*(.88+.24*wnoise2(x/40,y/40,61))-dl,o=(y-y0)*w+x-x0;if(s>SC[o]){SC[o]=s;DL[o]=dl;KF[o]=g}}
    if(!(k%80))yield}
  for(let y=y0;y<y0+h;y++){if(!((y-y0+1)&31))yield;for(let x=x0;x<x0+w;x++){const o=(y-y0)*w+x-x0,s=SC[o];if(s<=-V)continue;const i=(y>>4)*MW+(x>>4);if(K[i]||B[i]||wpx(K,x,y))continue;
    const cl=CLIMS[climate[i]],RC=ROAD_RGB[cl],q=o*4,cur=[D[q],D[q+1],D[q+2]];let c;
    if(s<=0){if(hs(x,y,57)<.25+.4*(-s/V))continue;c=mixc(cur,DIRT[cl],.42*(1+s/V))}
    else if(s<=1.1)c=KF[o]?RC[0]:mixc(RC[1],RC[0],.4);
    else{const dl=DL[o];c=RC[1];if(KF[o]?Math.abs(dl-1.6)<.5:Math.abs(dl-1.05)<.42)c=mixc(c,RC[0],.45);else if(!KF[o]&&dl<.55)c=mixc(c,cur,.5);
      const ph=hs(x,y,58);if(ph<.025)c=RC[2];else if(ph>.98)c=RC[0]}
    D[q]=c[0];D[q+1]=c[1];D[q+2]=c[2]}}}
// a crossing over the window (OVER_GEN): a bridge's deck from bank to bank (stone: grey courses, parapets, the arches' shade on the
// water below; wood: planks, rails, posts), a ford's stepping stones, a ferry's landings, its raft and the rope across
function artGenXing(P,r,c){const ax=c.i%MW,ay=(c.i-ax)/MW,bx=c.j%MW,by=(c.j-bx)/MW,hor=ay===by,lo=hor?Math.min(ax,bx):Math.min(ay,by),hi=hor?Math.max(ax,bx):Math.max(ay,by),mid=(hor?ay:ax)*TILE+8;
  // (a rect along the crossing: from u0 to u1 along it, v0 to v1 across it, px)
  const R=(col,u0,u1,v0,v1)=>hor?r(col,u0,v0,u1-u0,v1-v0):r(col,v0,u0,v1-v0,u1-u0);
  if(c.kind==='bridge'){const u0=lo*TILE+TILE-4,u1=hi*TILE+4,hw=c.stone?6:5;
    if(c.stone){R('#24323e',u0+4,u1-4,mid+hw,mid+hw+2);R('#a69e8e',u0,u1,mid-hw,mid+hw);
      for(let u=u0;u<u1;u++)for(let v=mid-hw+2;v<mid+hw-2;v++)if((v-mid)%3===0||(u+((v-mid+12)/3|0)*3)%6===0)R('#8e8676',u,u+1,v,v+1);
      R('#6e665a',u0,u1,mid-hw,mid-hw+2);R('#c8c0ae',u0,u1,mid-hw,mid-hw+1);R('#6e665a',u0,u1,mid+hw-2,mid+hw);R('#c8c0ae',u0,u1,mid+hw-2,mid+hw-1);
      for(let u=u0+8;u<u1-6;u+=10)R('#121c26',u,u+4,mid+hw,mid+hw+1);R('#7e7666',u0-1,u0+2,mid-hw-1,mid+hw+1);R('#7e7666',u1-2,u1+1,mid-hw-1,mid+hw+1)}
    else{R('#8a6038',u0,u1,mid-hw,mid+hw);for(let u=u0;u<u1;u+=2)R('#6a4628',u,u+1,mid-hw,mid+hw);R('#3e2818',u0,u1,mid-hw-1,mid-hw);R('#3e2818',u0,u1,mid+hw,mid+hw+1);
      for(let u=u0+5;u<u1-3;u+=7){R('#2a1a10',u,u+1,mid+hw+1,mid+hw+3);R('#2a1a10',u+3,u+4,mid-hw-2,mid-hw-1)}}}
  else if(c.kind==='ford'){const K=P.wk,n=(hi-lo)*4;for(let s=1;s<n;s++){const u=lo*TILE+8+s*4,v=mid+(s&1?2:-2)-1,x=hor?u-1:v,y=hor?v:u-1;if(K[(y>>4)*MW+(x>>4)]!==3)continue;
      r('#3c4048',x,y+2,3,1);r('#8e8a80',x,y,3,2);r('#c8c4b8',x,y,2,1)}}
  else{const dir=hi===(hor?bx:by)?1:-1,ends=[[c.i,dir],[c.j,-dir]],tip=[];
    for(const [t,d] of ends){const e=hor?t%MW:(t/MW|0),u0=d>0?e*TILE+TILE-3:e*TILE+3-9,u1=u0+9;R('#7a5432',u0,u1,mid-3,mid+3);for(let u=u0;u<u1;u+=2)R('#5a3c22',u,u+1,mid-3,mid+3);
      R('#2a1a10',d>0?u1-1:u0,d>0?u1:u0+1,mid-4,mid-3);R('#2a1a10',d>0?u1-1:u0,d>0?u1:u0+1,mid+3,mid+5);tip.push(d>0?u1:u0)}
    const [p,q]=tip[0]<tip[1]?tip:[tip[1],tip[0]];for(let u=p+1;u<q;u+=2)R('#d8c890',u,u+1,mid-5,mid-4);
    const rf=dir>0?tip[0]+1:tip[0]-12;R('#3e2818',rf,rf+11,mid-1,mid+6);R('#9a6e42',rf+1,rf+10,mid,mid+5);for(let u=rf+2;u<rf+10;u+=3)R('#6a4628',u,u+1,mid,mid+5);R('#2a1a10',rf+5,rf+6,mid-4,mid)}}
const OVER_GEN=[
  // reeds and stones on the river banks (land beside a river tile, never in the water or on clear ground)
  (P,r,tx0,ty0,tx1,ty1)=>{const K=P.wk,REED={grass:['#4e7a34','#8aac52'],frost:['#9a9478','#c8c0a0'],desert:['#7a8040','#b0aa62'],swamp:['#4a5a2c','#7e8a42']};
    for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const i=ty*MW+tx;if(K[i]||tiles[i]===T_MOUNT)continue;const X=tx*TILE,Y=ty*TILE,[c0,c1]=REED[clAt(tx,ty)];
      for(const [a,b] of [[0,-1],[0,1],[-1,0],[1,0]]){const u=tx+a,v=ty+b;if(u<0||v<0||u>=MW||v>=MH||K[v*MW+u]!==2)continue;
        for(let k=0;k<4;k++){const h=n=>hs(tx*4+k,ty*4+a+2*b+2,n+80),al=2+Math.floor(h(1)*12),of=1+Math.floor(h(2)*3),x=b?X+al:a<0?X+of:X+TILE-1-of,y=a?Y+al:b<0?Y+of+2:Y+TILE-1-of;
          if(wpx(K,x,y)||P.clear.at(x,y))continue;
          if(h(3)<.62){r(c0,x,y-2,1,3);r(c1,x,y-2,1,1);if(h(4)>.5)r(c0,x+1,y-1,1,2)}else if(h(3)<.85){r('#5a5a5e',x,y+1,2,1);r('#8e8c88',x,y,2,1);r('#c4c0b8',x,y,1,1)}}}}},
  // the crossings that reach the window
  (P,r,tx0,ty0,tx1,ty1)=>{const inW=t=>{const x=t%MW,y=(t-x)/MW;return x>=tx0&&x<=tx1&&y>=ty0&&y<=ty1};for(const c of WM.crossings)if(inW(c.i)||inW(c.j)||c.tiles.some(inW))artGenXing(P,r,c)},
  // white water on the rapids: short strokes down the flow, foam between
  (P,r,tx0,ty0,tx1,ty1)=>{const K=P.wk,done=new Set();
    for(const rv of WM.rivers)for(const [s,e] of rv.rapids)for(let k=s;k<=e;k++){const t=rv.path[k],x=t%MW,y=(t-x)/MW;if(x<tx0-1||x>tx1+1||y<ty0-1||y>ty1+1)continue;
      for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const u=x+a,v=y+b,i=v*MW+u;if(u<tx0||v<ty0||u>tx1||v>ty1||K[i]!==2||done.has(i))continue;done.add(i);const [dx,dy]=DIR8[WM.flow[i]>>5];
        for(let q=0;q<4;q++){const h=n=>hs(u*7+q,v,n+90),px=u*TILE+2+Math.floor(h(1)*12),py=v*TILE+2+Math.floor(h(2)*12),n=2+Math.floor(h(3)*2);
          for(let m=0;m<n;m++){const X=px+dx*m,Y=py+dy*m;if(wpx(K,X,Y))r(m?'#b8d8ea':'#e8f4fa',X,Y,1,1)}if(h(4)<.5&&wpx(K,px-dy,py+dx))r('#eef6fa',px-dy,py+dx,1,1)}}}},
  OVER[OVER.length-1]];
// the map's rect X, Y, w×h (px) painted onto g at (ox, oy), as steps (a generator: each a ms or so; the rect a chunk, or any rect):
// its window's ground, the trampled patches and the land's nature, kept to the rect, then what lies over them, clipped to it. The
// counts of what it painted (and how long it took) into rec
function* paintSteps(P,X,Y,w,h,g,ox,oy,rec){
  const t0=performance.now(),Wp=MW*TILE,Hp=MH*TILE,AP=PX.WN_APRON,x0=Math.max(0,X-AP),y0=Math.max(0,Y-AP),ww=Math.min(Wp,X+w+AP)-x0,wh=Math.min(Hp,Y+h+AP)-y0,img=new ImageData(ww,wh),D=img.data,NT=NATURE_TOUCH;
  yield* groundSteps(P,D,x0,y0,ww,wh);
  for(const t of P.tramples)trample(D,x0,y0,ww,wh,t);
  if(P.gen)yield* artGenRoads(P,D,x0,y0,ww,wh);
  const TO=NT?new Uint8Array(ww*wh):null;
  rec.n=yield* PX.worldNatureSteps(P.nature,{x:x0,y:y0,w:ww,h:wh,inner:{x:X,y:Y,w,h}},D,TO);
  if(TO)for(let y=Y;y<Y+h;y++)NT.set(TO.subarray((y-y0)*ww+X-x0,(y-y0)*ww+X-x0+w),y*Wp+X);
  g.putImageData(img,ox+x0-X,oy+y0-Y,X-x0,Y-y0,w,h);
  const tx0=Math.max(0,(X>>4)-1),ty0=Math.max(0,(Y>>4)-1),tx1=Math.min(MW-1,((X+w-1)>>4)+1),ty1=Math.min(MH-1,((Y+h-1)>>4)+1),r=(col,x,y,w,h)=>{g.fillStyle=col;g.fillRect(x,y,w||1,h||1)};
  for(const pass of P.gen?OVER_GEN:OVER){yield;g.save();g.beginPath();g.rect(ox,oy,w,h);g.clip();g.translate(ox-X,oy-Y);pass(P,r,tx0,ty0,tx1,ty1);g.restore()}
  rec.ms=performance.now()-t0;
}
const runGen=gen=>{let r;while(!(r=gen.next()).done);return r.value};
// WorldArt: the painted map, by chunks (key cy*cols+cx).
//   ensure(): the plan (made when first needed).
//   chunk(cx, cy): a chunk's canvas, painted now if it isn't (kept in the LRU, cap chunks: 32 on a desktop, 20 on a phone; never
//     below the 6 a view can show).
//   draw(g, cam): blits the map under the view (cam.x, cam.y, VW×VH; whole pixels), painting a chunk in view at once if it must,
//     then queues the ring round the view, those the way the view moves first (as many as the cap leaves room for), and paints
//     them for slice ms (step).
//   step(ms): paints queued chunks for ms, a small step at a time (a chunk's painting resumes where it stopped).
//   invalidate(r): the map or its holdings changed: forget the plan (remade when next needed) and the chunks, all of them, or (r, a
//     rect of tiles) those within REACH tiles of it (enough for lots, plots, estates and camps; a change of tile kinds, mountains
//     above all, wants all). The whole picture repaints the same chunks when next asked.
//   whole(): the whole map as one canvas (the old worldCv: for the blit until render.js draws by chunks, the wiki and the tests;
//     painted chunk by chunk, chunks the LRU holds copied); sets NATURE.
//   mini(k): the minimap from the tile data, 1 px per k tiles (1: today's), kept until invalidate.
//   standing(x0, y0, x1, y1, fn): what stands on the map's rect (px, inclusive), from the standing index each chunk keeps with its
//     picture (engine/worldnature.js standIndex: the trees, the small things standing, the ranges' rock in column runs; a chunk
//     not painted yet is painted): fn(S, k) once for each entry k of a chunk's index S whose grid cells meet the rect (gfx/
//     depth.js); without fn, a list of {x, y (its foot), s (its sprite; null, a run of rock), dx, dy (where s is drawn), box (its
//     pixels in its chunk, [x0, y0, x1, y1])}, as the battle's props.
//   bytes(): what it holds.
const WorldArt={
  plan:null,chunks:new Map(),jobs:new Map(),queue:[],pool:[],view:new Set(),full:null,dirty:new Set(),cnt:new Map(),minis:{},last:null,slice:4,REACH:8,
  cap:typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<900?20:32,
  get cols(){return Math.ceil(MW*TILE/CHUNK)},get rows(){return Math.ceil(MH*TILE/CHUNK)},
  ensure(){return this.plan||(this.plan=worldArtPlan())},
  rect(cx,cy){const X=cx*CHUNK,Y=cy*CHUNK;return[X,Y,Math.min(CHUNK,MW*TILE-X),Math.min(CHUNK,MH*TILE-Y)]},
  // a chunk's painting: its own canvas (one the LRU let go, if one fits), as steps
  start(cx,cy){const k=cy*this.cols+cx;let j=this.jobs.get(k);if(j)return j;const [X,Y,w,h]=this.rect(cx,cy),i=this.pool.findIndex(c=>c.width===w&&c.height===h),cv=i>=0?this.pool.splice(i,1)[0]:mkcv(w,h),rec={cx,cy,cv};
    j={k,rec,gen:paintSteps(this.ensure(),X,Y,w,h,cv.getContext('2d'),0,0,rec)};this.jobs.set(k,j);return j},
  done(j){this.jobs.delete(j.k);this.chunks.set(j.k,j.rec);for(const [k,c] of this.chunks){if(this.chunks.size<=this.cap)break;if(this.view.has(k))continue;this.chunks.delete(k);this.recycle(c.cv)}},
  recycle(cv){if(this.pool.length<4)this.pool.push(cv)},
  chunk(cx,cy){const k=cy*this.cols+cx,c=this.chunks.get(k);if(c){this.chunks.delete(k);this.chunks.set(k,c);return c.cv}const j=this.start(cx,cy);runGen(j.gen);this.done(j);return j.rec.cv},
  draw(g,cam){const W=MW*TILE,H=MH*TILE,x0=Math.max(0,cam.x),y0=Math.max(0,cam.y),x1=Math.min(W,cam.x+VW),y1=Math.min(H,cam.y+VH);if(x1<=x0||y1<=y0)return;
    const c0=Math.floor(x0/CHUNK),r0=Math.floor(y0/CHUNK),c1=Math.floor((x1-1)/CHUNK),r1=Math.floor((y1-1)/CHUNK);this.view=new Set();
    for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++)this.view.add(cy*this.cols+cx);
    for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const cv=this.chunk(cx,cy),X=cx*CHUNK,Y=cy*CHUNK,sx=Math.max(x0,X),sy=Math.max(y0,Y),sw=Math.min(x1,X+cv.width)-sx,sh=Math.min(y1,Y+cv.height)-sy;
      g.drawImage(cv,sx-X,sy-Y,sw,sh,sx-cam.x,sy-cam.y,sw,sh)}
    // (ahead: the ring round the view, the way it moves first, as many as the cap leaves room for: those painted kept as freshly
    //  used, the rest queued; a job for a chunk no longer queued let go)
    const dx=this.last?Math.sign(cam.x-this.last.x):0,dy=this.last?Math.sign(cam.y-this.last.y):0,mx=(c0+c1)/2,my=(r0+r1)/2,ring=[];this.last={x:cam.x,y:cam.y};
    for(let cy=r0-1;cy<=r1+1;cy++)for(let cx=c0-1;cx<=c1+1;cx++){const k=cy*this.cols+cx;if(cx<0||cy<0||cx>=this.cols||cy>=this.rows||this.view.has(k))continue;ring.push([(cx-mx)*dx+(cy-my)*dy,Math.hypot(cx-mx,cy-my),k,cx,cy])}
    ring.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);ring.length=Math.min(ring.length,Math.max(0,this.cap-this.view.size));
    for(let i=ring.length-1;i>=0;i--){const k=ring[i][2],c=this.chunks.get(k);if(c){this.chunks.delete(k);this.chunks.set(k,c)}}
    this.queue=ring.filter(q=>!this.chunks.has(q[2])).map(q=>[q[3],q[4]]);const keep=new Set(this.queue.map(([cx,cy])=>cy*this.cols+cx));
    for(const [k,j] of this.jobs)if(!keep.has(k)){this.jobs.delete(k);this.recycle(j.rec.cv)}
    this.step(this.slice)},
  step(ms){const t0=performance.now();while(this.queue.length&&performance.now()-t0<ms){const [cx,cy]=this.queue[0];if(this.chunks.has(cy*this.cols+cx)){this.queue.shift();continue}const j=this.start(cx,cy);
      while(performance.now()-t0<ms)if(j.gen.next().done){this.done(j);this.queue.shift();break}}},
  invalidate(r){this.plan=null;CLEAR=null;this.minis={};this.queue=[];for(const j of this.jobs.values())this.recycle(j.rec.cv);this.jobs.clear();
    if(!r){for(const c of this.chunks.values())this.recycle(c.cv);this.chunks.clear();this.full=null;this.dirty.clear();this.cnt.clear();return}
    const m=this.REACH*TILE,x0=r.x*TILE-m,y0=r.y*TILE-m,x1=(r.x+r.w)*TILE+m,y1=(r.y+r.h)*TILE+m;
    for(let cy=Math.max(0,Math.floor(y0/CHUNK));cy<=Math.min(this.rows-1,Math.floor((y1-1)/CHUNK));cy++)for(let cx=Math.max(0,Math.floor(x0/CHUNK));cx<=Math.min(this.cols-1,Math.floor((x1-1)/CHUNK));cx++){
      const k=cy*this.cols+cx,c=this.chunks.get(k);if(c){this.chunks.delete(k);this.recycle(c.cv)}if(this.full)this.dirty.add(k)}},
  whole(){const W=MW*TILE,H=MH*TILE;if(this.full&&(this.full.width!==W||this.full.height!==H))this.full=null;
    if(!this.full){this.full=mkcv(W,H);this.dirty=new Set();this.cnt.clear();for(let k=0;k<this.cols*this.rows;k++)this.dirty.add(k)}
    if(this.dirty.size){const g=this.full.getContext('2d');
      for(const k of [...this.dirty].sort((a,b)=>a-b)){const cx=k%this.cols,cy=(k-cx)/this.cols,[X,Y,w,h]=this.rect(cx,cy),c=this.chunks.get(k);
        if(c&&!NATURE_TOUCH){g.drawImage(c.cv,X,Y);this.cnt.set(k,c)}else{const rec={cx,cy};runGen(paintSteps(this.ensure(),X,Y,w,h,g,X,Y,rec));this.cnt.set(k,rec)}}
      this.dirty.clear();
      // (the counts and phases summed over the chunks)
      const N={trees:0,hills:0,peaks:0,decor:0,flat:0,rock:0,ms:0},tm={};for(const c of this.cnt.values()){for(const q in N)N[q]+=q==='ms'?c.n.ms:c.n[q];for(const q in c.n.tm)tm[q]=(tm[q]||0)+c.n.tm[q]}
      let s=0;N.t=Object.keys(tm).map(q=>q+' '+(s+=tm[q]).toFixed(0)).join(', ');NATURE=N}
    return this.full},
  mini(k=1){return this.minis[k]||(this.minis[k]=mkc(Math.ceil(MW/k),Math.ceil(MH/k),g=>{const Rv=WM.river,Fe=WM.feat;
    for(let y=0;y*k<MH;y++)for(let x=0;x*k<MW;x++){let i=Math.min(MH-1,y*k+(k>>1))*MW+Math.min(MW-1,x*k+(k>>1));
      // (a pixel of k x k tiles: the middle one, but a river's tile there before it (else a road's), so rivers and roads stay
      // whole on a small map: the generated world's, WM.river and feat's road bits, none on today's map)
      if(k>1){let rd=-1,rv=-1;for(let b=0;b<k&&y*k+b<MH;b++)for(let a=0;a<k&&x*k+a<MW;a++){const j=(y*k+b)*MW+x*k+a;if(Rv[j]&3&&tiles[j]===T_WATER)rv=j;else if(Fe[j]&192&&tiles[j]===T_ROAD)rd=j}if(rv>=0)i=rv;else if(rd>=0)i=rd}
      rect(g,PAL[CLIMS[climate[i]]].mini[tiles[i]],x,y,1,1)}}))},
  standing(x0,y0,x1,y1,fn){const out=fn?null:[],seen=this.seen||(this.seen=new Set());x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(MW*TILE-1,Math.floor(x1));y1=Math.min(MH*TILE-1,Math.floor(y1));
    for(let cy=Math.floor(y0/CHUNK);cy<=Math.floor(y1/CHUNK)&&x0<=x1;cy++)for(let cx=Math.floor(x0/CHUNK);cx<=Math.floor(x1/CHUNK);cx++){const k=cy*this.cols+cx;if(!this.chunks.has(k))this.chunk(cx,cy);const S=this.chunks.get(k).n.stand,cs=S.cell;seen.clear();
      for(let j=Math.max(0,Math.floor((y0-S.Y)/cs));j<=Math.min(S.R-1,Math.floor((y1-S.Y)/cs));j++)for(let i=Math.max(0,Math.floor((x0-S.X)/cs));i<=Math.min(S.C-1,Math.floor((x1-S.X)/cs));i++){const q=j*S.C+i;
        for(let p=S.at[q];p<S.at[q+1];p++){const e=S.L[p];if(seen.has(e))continue;seen.add(e);if(fn){fn(S,e);continue}
          const E=S.E,o=e*4,dx=S.X+E[o],dy=S.Y+E[o+1],r=E[o+2],s=r>=0?PX.WN_SPR[r]:null,b=s?s.box:[0,0,0,-r-1];
          out.push({x:s?dx+s.ax:dx,y:S.Y+E[o+3],s,dx,dy,box:[Math.max(S.X,dx+b[0]),Math.max(S.Y,dy+b[1]),Math.min(S.X+S.w-1,dx+b[2]),Math.min(S.Y+S.h-1,dy+b[3])]})}}}
    return out},
  bytes(){let c=0,s=0;for(const q of this.chunks.values()){c+=q.cv.width*q.cv.height*4;s+=q.n.stand.bytes}let p=0;for(const q of this.pool)p+=q.width*q.height*4;const pl=this.plan;
    return{chunks:c,pool:p,full:this.full?this.full.width*this.full.height*4:0,plan:pl?pl.dep.byteLength+pl.clear.bytes+pl.nature.bytes:0,stand:s}}
};
// a world goes in (useWorld: a new game's too, whose lots differ from the title screen's): painted afresh when next drawn, minimap too
onWorld(()=>WorldArt.invalidate());
// the whole map painted afresh (a new plan: the tests)
function paintWorld(){WorldArt.invalidate();return WorldArt.whole()}
/* battle grounds: the same ground, with the battlefield's small things by climate (as a terrain's: engine/ground.js). No canvas of
   its own (R16): the arena paints any rect of the field (paintRect: its noise a pixel at a time, then the small things that reach
   into it, then the top band: the same pixels as the whole there), the base under a terrain's ground (engine/ground.js paints it a
   window at a time) and, with no terrain, drawn by its own tiles (ground: a PX.BattleGround). {c, width, height (the field's),
   paintRect(g, x, y, w, h): that rect onto g at its origin; paintSteps(g, x, y, w, h, px): the same as a generator, a band of rows
   (about px pixels) a step; ground}.
   steps: a generator returning it (sprites.js arenaSteps) */
// (map.js fbm(x/70, y/70, s): the same numbers, a row at a time: row(y), then at(x) along it, each octave's row part reckoned once
// and its lattice's hashes kept while the row stays in the same lattice cell)
const arenaFbm=s=>{let Y1=0,yi0=0,yi1=0,yi2=0,v0=0,v1=0,v2=0,xi0=NaN,xi1=NaN,xi2=NaN,a0,b0,c0,d0,a1,b1,c1,d1,a2,b2,c2,d2;
  const row=y=>{Y1=y/70;let ys=Y1,f;yi0=Math.floor(ys);f=ys-yi0;v0=f*f*(3-2*f);ys=Y1*2;yi1=Math.floor(ys);f=ys-yi1;v1=f*f*(3-2*f);ys=Y1*4;yi2=Math.floor(ys);f=ys-yi2;v2=f*f*(3-2*f);xi0=xi1=xi2=NaN};
  const at=x=>{const X1=x/70;let xs=X1,xi=Math.floor(xs),f=xs-xi,u=f*f*(3-2*f);
    if(xi!==xi0){xi0=xi;a0=hash(xi,yi0,s);b0=hash(xi+1,yi0,s);c0=hash(xi,yi0+1,s);d0=hash(xi+1,yi0+1,s)}const n0=a0+(b0-a0)*u+(c0-a0)*v0+(a0-b0-c0+d0)*u*v0;
    xs=X1*2;xi=Math.floor(xs);f=xs-xi;u=f*f*(3-2*f);if(xi!==xi1){xi1=xi;a1=hash(xi,yi1,s+1);b1=hash(xi+1,yi1,s+1);c1=hash(xi,yi1+1,s+1);d1=hash(xi+1,yi1+1,s+1)}const n1=a1+(b1-a1)*u+(c1-a1)*v1+(a1-b1-c1+d1)*u*v1;
    xs=X1*4;xi=Math.floor(xs);f=xs-xi;u=f*f*(3-2*f);if(xi!==xi2){xi2=xi;a2=hash(xi,yi2,s+2);b2=hash(xi+1,yi2,s+2);c2=hash(xi,yi2+1,s+2);d2=hash(xi+1,yi2+1,s+2)}const n2=a2+(b2-a2)*u+(c2-a2)*v2+(a2-b2-c2+d2)*u*v2;
    return n0*.6+n1*.3+n2*.1};
  return{row,at}};
function paintArena(c,steps){const W=BW,H=BH,P3=GROUND_RGB[c],seed=CLIMS.indexOf(c)*7+1,top=c==='frost'?['#b8c4d2','#9aa6b4']:c==='desert'?['#b8944c','#9a7a3a']:c==='swamp'?['#3a4a2a','#2a3a20']:['#3a5c2c','#2a4a22'];
  const A={c,width:W,height:H,
    paintRect(g,X,Y,w,h){const it=A.paintSteps(g,X,Y,w,h);while(!it.next().done);},
    // (k 2: at half resolution, a pixel of each 2×2 and the small things drawn halved: the overview of a field of more tiles than its
    // ground keeps)
    *paintSteps(g,X,Y,w,h,bpx,k=1){const ow=Math.ceil(w/k),img=g.createImageData(ow,Math.ceil(h/k)),D=img.data,F=arenaFbm(seed),band=Math.max(1,Math.floor((bpx||PX.GROUND_BAND)/w))*k;
      // (mixc written out: the same sums, no array a pixel)
      const [p0,p1,p2]=P3;let b4=0;for(let y=Y;y<Y+h;y+=k){if(y>Y&&!((y-Y)%band))yield;F.row(y);for(let x=X;x<X+w;x+=k){const L=(F.at(x)-.5)*2;if(x===X||!(x&3))b4=hs(x>>2,y>>2,seed);let v=.5+.4*L+.2*(b4-.5);v=Math.max(0,Math.min(1,v));
        const lo=v<.5,a=lo?p0:p1,b=lo?p1:p2,t=lo?v*2:(v-.5)*2;let r=a[0]+(b[0]-a[0])*t,gg=a[1]+(b[1]-a[1])*t,bb=a[2]+(b[2]-a[2])*t;const ph=hs(x,y,seed+9);
        if(ph<.03){r=r+(p2[0]-r)*.6;gg=gg+(p2[1]-gg)*.6;bb=bb+(p2[2]-bb)*.6}else if(ph>.97){r=r+(p0[0]-r)*.7;gg=gg+(p0[1]-gg)*.7;bb=bb+(p0[2]-bb)*.7}
        const o=((y-Y)/k*ow+(x-X)/k)*4;D[o]=r;D[o+1]=gg;D[o+2]=bb;D[o+3]=255}}
      g.putImageData(img,0,0);g.save();if(k>1){g.imageSmoothingEnabled=true;g.scale(1/k,1/k)}g.translate(-X,-Y);
      PX.battleDetails(g,W,H,c,seed,[X,Y,X+w,Y+h]);// (tufts, flowers, pebbles, bushes; drifts; stones; moss, reeds and pools: engine/ground.js)
      if(Y<15){g.fillStyle=top[0];g.fillRect(0,0,W,14);g.fillStyle=top[1];for(let x=Math.max(0,Math.floor((X-2)/3)*3);x<Math.min(W,X+w);x+=3)g.fillRect(x,13+(hs(x,0,4)>.5?1:0),2,1)}
      g.restore()},
    get ground(){return this._g||(this._g=new PX.BattleGround(W,H,function*(x,y,w,h,out){A.paintRect(out.getContext('2d'),x,y,w,h);return out},
      ()=>PX.canvas(Math.ceil(W/2),Math.ceil(H/2),g=>{const it=A.paintSteps(g,0,0,W,H,0,2);while(!it.next().done);})))}};
  return steps?(function*(){return A})():A}

/* what moves on the map: water glints, cloud shadows drifting by day, smoke over holdings, snow in the frost, fireflies at night */
// a cloud's shadow at full size, pixel by pixel (hard edges, never scaled)
const CLOUD=(()=>{const c=document.createElement('canvas');c.width=192;c.height=96;const g=c.getContext('2d');g.fillStyle='#000';
  const E=[...Array(9)].map((_,i)=>[36+hs(i,1,3)*120,28+hs(i,2,3)*40,(20+hs(i,3,3)*20)*1.4,(20+hs(i,3,3)*20)*.8]);
  for(let y=0;y<96;y++)for(let x=0;x<192;x++)if(E.some(([cx,cy,rx,ry])=>((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1))g.fillRect(x,y,1,1);return c})();
// layer 0 (under everything): water glints; layer 1 (over parties, under fog and night): clouds, smoke, snow, fireflies
function drawEnv(cam,V,layer){
  const now=performance.now()/1000,dark=darkness(),x0=Math.max(0,Math.floor(cam.x/TILE)),y0=Math.max(0,Math.floor(cam.y/TILE)),x1=Math.min(MW-1,x0+Math.ceil(VW/TILE)+1),y1=Math.min(MH-1,y0+Math.ceil(VH/TILE)+1);
  ctx.save();
  // glints on water, sliding with the current
  if(layer===0){for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){if(tiles[ty*MW+tx]!==T_WATER)continue;const c=CLIMS[climate[ty*MW+tx]];if(c==='frost')continue;
    for(let k=0;k<2;k++){const ph=(now*.35+hs(tx,ty,k))%1,a=Math.sin(ph*Math.PI);if(a<.15)continue;
      ctx.globalAlpha=a*.55;ctx.fillStyle=c==='swamp'?'#8ab08a':'#d8ecfa';ctx.fillRect(tx*TILE+2+Math.floor(hs(tx,ty,k+4)*9)+Math.floor(ph*3)-cam.x,ty*TILE+2+Math.floor(hs(tx,ty,k+6)*12)-cam.y,3,1)}}ctx.restore();return}
  // fish leap now and then over the fishing grounds (each its own colour: salmon, eel, pearl oysters' silver)
  if(layer===0){for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const d=DEP_AT[ty*MW+tx];if(d<0||tiles[ty*MW+tx]!==T_WATER)continue;const ph=(now*.4+hs(tx,ty,3)*7)%3;if(ph>1)continue;
    const fx=tx*TILE+4+Math.floor(hs(tx,ty,5)*6)+Math.floor(ph*6)-cam.x,fy=ty*TILE+10-Math.round(Math.sin(ph*Math.PI)*5)-cam.y;ctx.globalAlpha=1;ctx.fillStyle=GOODS[DEPOSITS[d].g].res==='fish'&&DEPOSITS[d].g!=='pearls'?GOODS[DEPOSITS[d].g].col:'#dfe4ea';ctx.fillRect(Math.round(fx),Math.round(fy),2,1);
    if(ph<.15||ph>.85){ctx.fillStyle='#d8ecfa';ctx.fillRect(Math.round(fx)-1,ty*TILE+11-cam.y,4,1)}}ctx.globalAlpha=1}
  // cloud shadows by day
  if(dark<.8){ctx.globalAlpha=.1*(1-dark);for(let i=0;i<14;i++){const span=MW*TILE+300,x=((hs(i,1,21)*span+now*6*(1+hs(i,2,21)))%span)-150,y=hs(i,3,21)*MH*TILE;
    if(x+192<cam.x||x>cam.x+VW||y+96<cam.y||y>cam.y+VH)continue;ctx.drawImage(CLOUD,Math.round(x-cam.x),Math.round(y-cam.y))}}
  // smoke from the hearths of a few houses of each holding in view
  for(const t of TOWNS){if(Math.hypot(t.x-P.x,t.y-P.y)>VW)continue;const hs0=(t.lots||[]).filter(l=>l.k==='house'&&l.st==='built').slice(0,t.T.smoke);
    for(let j=0;j<hs0.length;j++){const l=hs0[j],sx=(l.x+l.n*.7)*TILE-cam.x,sy=l.y*TILE+2-cam.y,ox=0,oy=0;if(sx<-20||sy<-40||sx>VW+20||sy>VH+20)continue;
      for(let k=0;k<5;k++){const ph=(now*.3+k/5+j*.37)%1;ctx.globalAlpha=(1-ph)*.45;ctx.fillStyle=ph<.3?'#8a8a8a':'#b4b4b4';const w=1+Math.round(ph*3);
        ctx.fillRect(Math.round(sx+ox+Math.sin(ph*5+k)*2+ph*6-w/2),Math.round(sy+oy-ph*18),w,w)}}}
  // snow falls in the frost, fireflies glow on warm nights (all over the view: with ambient life on, its own fireflies in the
  // woods and the marsh near you instead, ambient.js)
  const here=climAt(P.x,P.y);
  if(here==='frost'){ctx.fillStyle='#ffffff';for(let i=0;i<70;i++){const x=(hs(i,1,31)*VW+now*(8+hs(i,2,31)*10)+Math.sin(now+i)*6)%VW,y=(hs(i,3,31)*VH+now*(18+hs(i,4,31)*14))%VH;ctx.globalAlpha=.5+hs(i,5,31)*.5;ctx.fillRect(Math.round(x),Math.round(y),1,1)}}
  else if(dark>.5&&(here==='grass'||here==='swamp')&&!AMBIENT.on){ctx.fillStyle='#e8f080';for(let i=0;i<22;i++){const x=(hs(i,1,41)*VW+Math.sin(now*.7+i)*20+VW)%VW,y=(hs(i,2,41)*VH+Math.cos(now*.5+i*2)*14+VH)%VH;ctx.globalAlpha=dark*(.4+.6*Math.max(0,Math.sin(now*2+i*1.7)));ctx.fillRect(Math.round(x),Math.round(y),1,1)}}
  ctx.restore();
}

// worn ground under a site: sites move from game to game, so their clearing is drawn under them rather than painted in
function groundPatch(c){const k='gp'+c;if(spr[k])return spr[k];const P3=GROUND_RGB[c],dirt={grass:[124,108,70],frost:[176,170,158],desert:[196,166,110],swamp:[84,76,52]}[c];
  return spr[k]=mkc(30,12,g=>{for(let y=0;y<12;y++)for(let x=0;x<30;x++){const d=((x-14.5)/15)**2+((y-5.5)/6)**2,e=1-hs(x,y,27)*.4;if(d>e)continue;
    const col=mixc(P3[1],dirt,d>e-.3?.35:.6+hs(x,y,28)*.2);g.fillStyle=hex(col);g.fillRect(x,y,1,1)}})}
/* sprite helpers: a dark 1-pixel outline around any sprite, and a white silhouette for the flash when struck */
function outlined(src,col){
  const c=document.createElement('canvas');c.width=src.width+2;c.height=src.height+2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const m=document.createElement('canvas');m.width=src.width;m.height=src.height;const mg=m.getContext('2d');mg.drawImage(src,0,0);mg.globalCompositeOperation='source-in';mg.fillStyle=col||'rgba(18,14,12,.85)';mg.fillRect(0,0,m.width,m.height);
  for(const [a,b] of [[0,1],[2,1],[1,0],[1,2]])g.drawImage(m,a,b);g.drawImage(src,1,1);return c;
}
function whiteOf(src){if(src._w)return src._w;const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#ffffff';g.fillRect(0,0,c.width,c.height);return src._w=c}
