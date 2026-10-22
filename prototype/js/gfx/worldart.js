'use strict';
/* ---------- the world, painted in detail, a chunk at a time ---------- */
// The world map is painted in chunks of CHUNK px (512: 32 × 32 tiles), never as one canvas (a big map's would pass what a browser
// allows). A chunk: ground per pixel (each climate's colors in soft light and dark patches, fine speckle, the climates' edges blended by
// their covers (the frost's snow, the swamp's wet and the desert's dry ground laid over the grass, thinning out in patches: coverOf,
// landRGB), water shading from shallows to deep), the
// camps' and estates' trampled ground, the land's nature (engine/
// worldnature.js: woods, hills, mountain ranges and small things), then beaches and ice rims, roads that join their neighbors,
// bridges and ore veins. Each chunk is exactly the whole map's picture there (no seams): it is painted over a window PX.WN_APRON px
// larger, kept to the chunk, and whatever stands across its edge (a tree, a range, a road) is painted into every chunk it touches.
// worldArtPlan(): what the chunks share, made from the map and its holdings as they stand and kept until WorldArt.invalidate().
// WorldArt keeps the chunks near you (an LRU), paints those in view at once and those ahead a few ms a frame, and blits them.
// drawEnv adds what moves.
const GROUND_RGB={grass:[[70,110,50],[84,126,58],[104,146,70]],frost:[[192,203,218],[214,222,232],[238,243,249]],desert:[[196,162,88],[214,182,104],[232,204,132]],swamp:[[58,72,42],[72,88,52],[90,106,62]]};
const WATER_RGB={grass:[[96,150,204],[58,104,166],[36,70,126]],frost:[[184,212,232],[150,184,212],[124,160,196]],desert:[[96,156,196],[58,112,164],[38,80,134]],swamp:[[104,138,146],[74,110,126],[50,82,104]]};// (swamp: a lighter peat blue, the owner's pick 2026-10-22, tests/visual/swampwater.js C; was [[84,112,88],[64,90,72],[48,70,56]])
// the frost blended (doc/WORLD_DESIGN.md §15 Phase 3, snowCover, landRGB): the frost's tiles counted over r tiles each way; on the
// generated world how cold below the frost line, temp (WM.temp) a step of 1; its height past elev (WM.elev), high a step of 1;
// today's map: a hill's and a mountain's (hill); the ground under the snow dulled toward tundra (dull: how fast with the cover); the
// snow's edge, soft over edge of its noise, its rim a pale shade
const FROST={r:3,temp:12,elev:150,high:200,hill:[.1,.2],dull:1.2,edge:.035,tundra:[[118,126,106],[134,142,120],[156,162,140]],rim:[170,184,204]};
// the swamp's and the desert's edges blended as the frost's (the owner's third play-test, 2026-10-22: no blocks between climates;
// coverOf, landRGB): each climate's tiles counted over r tiles each way; the grass under its cover leaning toward under (wetter and
// darker by the swamp, yellowing by the desert) by dull; its own ground laid over in patches (their noise over sc px, two octaves),
// soft over edge, each patch's rim a shade (the swamp's moss, the desert's pale dust)
const COVER={desert:{r:3,dull:1.4,edge:.045,sc:[8,3],seed:34,under:[[126,124,56],[148,142,66],[176,164,84]],rim:[180,160,94]},
  swamp:{r:3,dull:1.25,edge:.09,sc:[5,2],seed:37,under:[[54,86,40],[66,100,46],[84,118,56]],rim:[80,106,46]}};
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
// climates' covers (coverOf: the desert's, the swamp's and the frost's snow, snowCover); the land's nature's (PX.worldNaturePlan)
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
  P.cover={desert:coverOf('desert',P.gen),swamp:coverOf('swamp',P.gen),frost:snowCover(P.gen)};P.snow=P.cover.frost;
  // (the roads' bands and a margin kept clear, before the land's nature: by tile on today's map, along their lines on the generated)
  // (a ford's track kept clear too, from bank to bank and up each bank: fordTrack)
  if(P.gen){artGenPlan(P,mark);const F=GENART.ford,hw=Math.ceil(F.tw)+2;for(const [ax,ay,bx,by] of P.fords){const L=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L;
    for(let s=-F.run;s<=L+F.run;s+=2)mark(Math.round(ax+ux*s)-hw,Math.round(ay+uy*s)-hw,2*hw+1,2*hw+1)}}else for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++)roadStamps(P,tx,ty,0,(x,y,w)=>mark(x-1,y-1,w+2,w+2));
  // (the generated world's: its brooks, the water as drawn, the trees' ecotone, the roads through woods and every road's band (a
  //  road's tile its own: the lanes, brooks beside roads), the oases and ponds (ringOf), the mountains' fields (their kinds))
  P.nature=PX.worldNaturePlan({W:MW*TILE,H:MH*TILE,C:MW,R:MH,ts:TILE,kind:tiles,clim:climate,clear,seed:7,snow:P.snow,cover:{desert:P.cover.desert,swamp:P.cover.swamp},...P.gen?{flow:WM.flow,river:WM.river,water:WATER_RGB,wet:(x,y)=>wpx(P.wk,x,y)===1,round:true,eco:ecoLean(),
    lane:P.lane,road:(x,y)=>roadAt(P,x,y),oases:(WM.oases||[]).map(q=>ringOf(q,'oasis')),ponds:(WM.ponds||[]).map(q=>ringOf(q,q.kind)),mount:{elev:WM.elev,temp:WM.temp,moist:WM.moist,rough:WM.rough}}:{}});
  CLEAR=clear;return P;
}
// (an oasis or a pond of the generator's lists (WM.oases {i, r, big, tiles}, WM.ponds {i, r, kind, tiles}: r the water's reach and
//  its ring's, tiles its water) as the land's nature reads it: its middle (tiles: the water tiles' mean), r its water's reach (from
//  the middle to its farthest tile's far side), ring the generator's ring past it, kind, big, tiles; an oasis with a holding's centre
//  within its water and GENART.farm tiles has gardens (farm))
const ringOf=(q,kind)=>{const T=q.tiles&&q.tiles.length?q.tiles:[q.i],tx=T.reduce((s,i)=>s+i%MW,0)/T.length,ty=T.reduce((s,i)=>s+((i/MW)|0),0)/T.length;
  const r=Math.max(.75,...T.map(i=>Math.hypot(i%MW-tx,((i/MW)|0)-ty)+.6));
  return{x:tx+.5,y:ty+.5,r,ring:Math.max(0,(q.r||r)-r),kind,big:!!q.big,tiles:T,farm:kind==='oasis'&&TOWNS.some(t=>Math.hypot(t.tx-tx,t.ty-ty)<=r+GENART.farm)}};
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
// a climate's cover a tile (0-1; doc/WORLD_DESIGN.md §15 Phase 3, the biomes blended), the snow's the frost's: how deep in it it
// lies (that climate's
// tiles counted over r tiles each way, FROST's or COVER's: -1 clear of it, 1 deep in it); the snow's on the generated world raised
// or lowered by how cold it is below the frost line or warm above it (WM.temp; the line halfway between the warmest frost tile and
// the coldest other land), by half at most, and by its height near the frost (FROST); its own tile's at least .55, any other's at
// most .45, and 0 clear of it
// (any climate's cover, coverOf: as the frost's, by its tiles alone)
const snowCover=gen=>coverOf('frost',gen);
function coverOf(c,gen){const N=MW*MH,F=CLIMS.indexOf(c),fr=c==='frost',r=(fr?FROST:COVER[c]).r,n=(2*r+1)*(2*r+1),A=new Float32Array(N),S=new Float32Array(N),Tm=WM.temp,El=WM.elev;gen=gen&&fr;
  for(let i=0;i<N;i++)A[i]=climate[i]===F?1:0;
  // (two running sums, along the rows then down the columns, the edge tiles standing on beyond the map)
  for(let y=0;y<MH;y++){const o=y*MW,at=x=>A[o+Math.max(0,Math.min(MW-1,x))];let s=0;for(let x=-r;x<=r;x++)s+=at(x);for(let x=0;x<MW;x++){S[o+x]=s;s+=at(x+r+1)-at(x-r)}}
  for(let x=0;x<MW;x++){const at=y=>S[Math.max(0,Math.min(MH-1,y))*MW+x];let s=0;for(let y=-r;y<=r;y++)s+=at(y);for(let y=0;y<MH;y++){A[y*MW+x]=s;s+=at(y+r+1)-at(y-r)}}
  let TL=0;if(gen){let a=-1,b=256;for(let i=0;i<N;i++){if(tiles[i]===T_WATER)continue;if(climate[i]===F)a=Math.max(a,Tm[i]);else b=Math.min(b,Tm[i])}TL=a<0?-1e3:b>255?a:(a+b)/2}
  for(let i=0;i<N;i++){const fr=climate[i]===F,t=tiles[i];let d=Math.max(-1,Math.min(1,2*A[i]/n-1));if(gen)d=Math.max(-1,Math.min(1,d+.5*Math.max(-1,Math.min(1,(TL-Tm[i])/FROST.temp))));
    const hg=!fr?0:gen?Math.max(0,El[i]-FROST.elev)/FROST.high:t===T_HILL?FROST.hill[0]:t===T_MOUNT?FROST.hill[1]:0,v=Math.max(0,Math.min(1,.5+.5*d+hg*(d+1)));
    S[i]=fr?Math.max(.55,v):Math.min(.45,v)}
  return S}
// the generated world's land leaning toward each climate a tile (the trees' ecotone, worldnature.js PX.WN_ECO: -1 to 1, 0 halfway
// between the means of that climate's land and the grass's), by the generator's own scores (worldgen.js GEN_CLIMATE, its hints
// left out): the frost's by the cold (WM.temp) or the height (WM.elev: -1 at FROST.elev, 1 a half of FROST.high above it); the
// desert's by heat less wet (temp less dry times moist); the swamp's by wet and low ground
function ecoLean(){const N=MW*MH,Tm=WM.temp,Mo=WM.moist,El=WM.elev,GC=typeof GEN_CLIMATE==='object'?GEN_CLIMATE:{desert:{dry:.9},swamp:{low:.35}},G=CLIMS.indexOf('grass'),out={};
  const sc={frost:i=>-Tm[i]/255,desert:i=>Tm[i]/255-GC.desert.dry*Mo[i]/255,swamp:i=>Mo[i]/255*(1-GC.swamp.low)+(1-Math.min(1,Math.max(0,El[i]-64)/50))*GC.swamp.low};
  for(const c of ['frost','desert','swamp']){const F=CLIMS.indexOf(c),f=sc[c],L=new Float32Array(N);let a=0,na=0,b=0,nb=0;for(let i=0;i<N;i++){if(tiles[i]===T_WATER)continue;if(climate[i]===F){a+=f(i);na++}else if(climate[i]===G){b+=f(i);nb++}}
    if(na&&nb){a/=na;b/=nb;const mid=(a+b)/2,half=Math.abs(a-b)/2||1,sg=a>b?1:-1;for(let i=0;i<N;i++)L[i]=Math.max(-1,Math.min(1,sg*(f(i)-mid)/half))}else L.fill(-1);
    if(c==='frost')for(let i=0;i<N;i++)L[i]=Math.max(L[i],Math.min(1,(El[i]-FROST.elev)/(FROST.high/4)-1));
    out[c]=L}
  return out}
// a land pixel: the grass's ground lit v (0-1), with its speckle, under the climates' covers cv (0-1 each, read between the tile
// corners: the desert's, the swamp's, the frost's snow, COVERS' order), each in turn: the ground dulled toward its under as the
// cover grows (FROST.tundra the snow's), and its climate's own ground laid over it where the cover beats the pixel's own noise (two
// smooth octaves and a grain): whole near 1, in patches thinning out below a half, a shade at each patch's rim. Clear of them all,
// the grass as ever; deep in a climate, its own ground as ever
// (written without arrays a pixel: a palette flat, its three tones' 9 numbers (flat3); the colour into LC, landRGB's own, read at
//  once by its caller)
const flat3=P3=>Float64Array.from(P3.flat()),GRASS_F=flat3(GROUND_RGB.grass),LQ=new Float64Array(9),LC=[0,0,0];
const COVERS=['desert','swamp','frost'].map(c=>({c,P3:GROUND_RGB[c],F:flat3(GROUND_RGB[c]),...c==='frost'?{dull:FROST.dull,edge:FROST.edge,sc:[6,2.3],seed:31,under:FROST.tundra,rim:FROST.rim}:COVER[c]}));
function landRGB(v,cv,x,y){const ph=hs(x,y,9);
  if(!(cv[0]>0||cv[1]>0||cv[2]>0))return litSpk(GRASS_F,v,ph,LC);
  LQ.set(GRASS_F);for(let k=0;k<3;k++){const s=cv[k];if(!(s>0))continue;const u=Math.min(1,s*COVERS[k].dull),U=COVERS[k].under;for(let n=0;n<9;n++){const a=LQ[n];LQ[n]=a+(U[n/3|0][n%3]-a)*u}}
  let c=litSpk(LQ,v,ph,LC);
  for(let k=0;k<3;k++){const s=cv[k];if(!(s>0))continue;const L=COVERS[k],a=s>=.98?1:(.25+.5*s+Math.max(0,s-.9)*4-(.55*wnoise2(x/L.sc[0],y/L.sc[0],L.seed)+.3*wnoise2(x/L.sc[1],y/L.sc[1],L.seed+1)+.15*hs(x,y,L.seed+2)))/L.edge+.5;
    if(a>=1)c=litSpk(L.F,v,ph,LC);else if(a>0){const t=Math.min(1,a*1.6),R=L.rim;c[0]=c[0]+(R[0]-c[0])*t;c[1]=c[1]+(R[1]-c[1])*t;c[2]=c[2]+(R[2]-c[2])*t}}
  return c}
// (a palette Q (flat) lit v (between its first two tones below a half, its last two above) with its speckle (ph: hs(x, y, 9): its
//  darkest tone now and then, its lightest), into o)
function litSpk(Q,v,ph,o){const lo=v<.5,i=lo?0:3,t=lo?v*2:(v-.5)*2;let r=Q[i]+(Q[i+3]-Q[i])*t,g=Q[i+1]+(Q[i+4]-Q[i+1])*t,b=Q[i+2]+(Q[i+5]-Q[i+2])*t;
  if(ph<.035){r=r+(Q[6]-r)*.6;g=g+(Q[7]-g)*.6;b=b+(Q[8]-b)*.6}else if(ph>.965){r=r+(Q[0]-r)*.7;g=g+(Q[1]-g)*.7;b=b+(Q[2]-b)*.7}
  o[0]=r;o[1]=g;o[2]=b;return o}
// (each tile of a window's cover grids CVG (coverGrids, LW wide) by its covers at its four corners: 0 none (the grass's ground), k
//  1-3 deep in COVERS[k-1] (.981 or more at every corner: landRGB lays its ground whole) and clear of those after it (its ground),
//  4 else (landRGB a pixel at a time))
function coverTiles(CVG,LW,nr){const TK=new Uint8Array(LW*nr);
  for(let j=0;j<nr;j++)for(let i=0;i<LW-1;i++){const q=j*LW+i;let k=0;for(let n=0;n<3;n++){const A=CVG[n],a=A[q],b=A[q+1],c=A[q+LW],d=A[q+LW+1];
    if(Math.min(a,b,c,d)>=.981)k=n+1;else if(Math.max(a,b,c,d)>0)k=4}TK[q]=k}
  return TK}
// (a value grid A (LW wide) read between the corners of its tile q at fx, fy (0-1))
const bil=(A,q,LW,fx,fy)=>{const a=A[q],b=A[q+1],c=A[q+LW],d=A[q+LW+1];return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy};
// a cover S (a value a tile) at the tile corners of a window's tiles tx0..tx1+1, ty0..ty1+1 (LW wide): each the mean of the tiles
// round it; coverGrids: the climates' covers' in COVERS' order
const coverGrids=(P,tx0,ty0,tx1,ty1,LW)=>COVERS.map(L=>coverGrid(P.cover[L.c],tx0,ty0,tx1,ty1,LW));
function coverGrid(S,tx0,ty0,tx1,ty1,LW){const SG=new Float32Array(LW*(ty1-ty0+2));
  for(let y=ty0;y<=ty1+1;y++)for(let x=tx0;x<=tx1+1;x++){let s=0,n=0;for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const tx=x+a,ty=y+b;if(tx<0||ty<0||tx>=MW||ty>=MH)continue;s+=S[ty*MW+tx];n++}SG[(y-ty0)*LW+x-tx0]=n?s/n:0}
  return SG}
// the climates' share at the tile corners of a window's tiles tx0..tx1+1, ty0..ty1+1 (LW wide), each corner's among the 4 x 4 tiles
// round it (CG: CLIMS.length a corner), so what is coloured by climate on the water shades across a climate's edge over two tiles
// (the land's own ground keeps its ragged border); one: a tile's climate where its four corners are all of it, else -1. ClimMix
// reads it a pixel at a time: at(q, fx, fy) (q the tile's place in the grid) sets W, the shares there, and gives the one climate
// or -1; then tone(A, k) is the colour of A (a colour a climate, by index) there, pal(A) a palette's (three tones a climate) and
// share(i) climate i's share
class ClimMix{
  constructor(tx0,ty0,tx1,ty1,LW){const LH=ty1-ty0+2,NC=CLIMS.length,CG=this.CG=new Float32Array(LW*LH*NC),one=this.one=new Int8Array(LW*LH).fill(-1);this.LW=LW;this.NC=NC;this.W=new Float32Array(NC);this.k=-1;
    for(let y=ty0;y<=ty1+1;y++)for(let x=tx0;x<=tx1+1;x++){const o=((y-ty0)*LW+x-tx0)*NC;for(let b=-2;b<=1;b++)for(let a=-2;a<=1;a++)CG[o+climate[Math.max(0,Math.min(MH-1,y+b))*MW+Math.max(0,Math.min(MW-1,x+a))]]+=1/16}
    for(let q=0;q<LW*(LH-1);q++){if(q%LW===LW-1)continue;for(let c=0;c<NC;c++)if(CG[q*NC+c]===1&&CG[(q+1)*NC+c]===1&&CG[(q+LW)*NC+c]===1&&CG[(q+LW+1)*NC+c]===1){one[q]=c;break}}}
  at(q,fx,fy){const k=this.k=this.one[q];if(k>=0)return k;const C=this.CG,NC=this.NC,W=this.W,a=q*NC,b=a+NC,c=a+this.LW*NC,d=c+NC;
    for(let i=0;i<NC;i++){const p=C[a+i],r=C[b+i],s=C[c+i];W[i]=p+(r-p)*fx+(s-p)*fy+(p-r-s+C[d+i])*fx*fy}return -1}
  tone(A,k){if(k>=0)return A[k];const W=this.W;let r=0,g=0,b=0;for(let i=0;i<this.NC;i++){const w=W[i];if(w>0){const c=A[i];r+=c[0]*w;g+=c[1]*w;b+=c[2]*w}}return[r,g,b]}
  pal(A){const W=this.W,o=[[0,0,0],[0,0,0],[0,0,0]];for(let i=0;i<this.NC;i++){const w=W[i];if(w>0)for(let n=0;n<3;n++){const c=A[i][n],t=o[n];t[0]+=c[0]*w;t[1]+=c[1]*w;t[2]+=c[2]*w}}return o}
  share(i){return this.k>=0?(this.k===i?1:0):this.W[i]}}
// the ground of the window x0, y0, w×h (px) into D, its RGBA: a smooth light field (one value per tile corner), the water's depth and
// the snow's cover read between the corners; a row of pixels a step (I: the rect kept of it, paintSteps' chunk: on the generated
// world only its pixels are painted, what lies round them read alike; nothing over the ground reads another pixel's)
function* groundSteps(P,D,x0,y0,w,h,I){
  if(P.gen)return yield* artGenGround(P,D,x0,y0,w,h,I||{x:x0,y:y0,w,h});
  const tx0=x0>>4,ty0=y0>>4,tx1=(x0+w-1)>>4,ty1=(y0+h-1)>>4,LW=tx1-tx0+2,LG=new Float32Array(LW*(ty1-ty0+2)),DG=new Float32Array(LW*(ty1-ty0+2)),dep=P.dep;
  for(let y=ty0;y<=ty1+1;y++)for(let x=tx0;x<=tx1+1;x++){const k=(y-ty0)*LW+x-tx0;LG[k]=(fbm(x/4.5,y/4.5,77)-.5)*2;
    let s=0,n=0;for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const tx=x+a,ty=y+b;if(tx<0||ty<0||tx>=MW||ty>=MH)continue;s+=Math.min(4,dep[ty*MW+tx]===9?4:dep[ty*MW+tx]);n++}DG[k]=n?s/n:4}
  const CVG=coverGrids(P,tx0,ty0,tx1,ty1,LW),cv=[0,0,0];
  const BR=(tx,ty)=>{const i=ty*MW+tx;return tx>0&&ty>0&&tx<MW-1&&ty<MH-1&&tiles[i]===T_ROAD&&(tiles[i-1]===T_WATER&&tiles[i+1]===T_WATER||tiles[i-MW]===T_WATER&&tiles[i+MW]===T_WATER)};
  const WL=CLIMS.map(c=>WATER_RGB[c]),CM=new ClimMix(tx0,ty0,tx1,ty1,LW);
  for(let y=y0;y<y0+h;y++){const ty=y>>4,fy=(y&15)/16;
    for(let x=x0;x<x0+w;x++){const tx=x>>4,fx=(x&15)/16,o=((y-y0)*w+x-x0)*4;
      const i=ty*MW+tx,q=(ty-ty0)*LW+tx-tx0;let c;
      const bl=A=>{const a=A[q],b=A[q+1],cc=A[q+LW],d=A[q+LW+1];return a+(b-a)*fx+(cc-a)*fy+(a-b-cc+d)*fx*fy};
      if(tiles[i]===T_WATER||BR(tx,ty)){const d=bl(DG),P3=palAt(CM,WL,q,fx,fy),wv=hs(x>>1,y,8);c=d<1.5?mixc(P3[0],P3[1],Math.max(0,d-.5)):mixc(P3[1],P3[2],Math.min(1,(d-1.5)/2.5));
        if(wv<.02)c=mixc(c,[255,255,255],.25)}
      else{const L=bl(LG),b4=hs(x>>2,y>>2,3);let v=.5+.38*L+.22*(b4-.5);v=Math.max(0,Math.min(1,v));cv[0]=bl(CVG[0]);cv[1]=bl(CVG[1]);cv[2]=bl(CVG[2]);c=landRGB(v,cv,x,y)}
      D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255}
    if(!((y-y0+1)&7))yield}
}
// (a palette (three tones a climate, WL) at a pixel of tile q of a ClimMix's grid: its climate's, or the climates' mixed there)
const palAt=(CM,WL,q,fx,fy)=>{const k=CM.at(q,fx,fy);return k>=0?WL[k]:CM.pal(WL)};
// a trampled patch [cx, cy, rx, ry, amount] over the window: worn ground, ragged at its edge, never on water (on the generated
// world the water as drawn, wpx: a bridge's water, a curved shore's)
function trample(P,D,x0,y0,w,h,[cx,cy,rx,ry,amt]){for(let yy=-ry;yy<=ry;yy++)for(let xx=-rx;xx<=rx;xx++){const x=cx+xx,y=cy+yy;if(x<x0||y<y0||x>=x0+w||y>=y0+h)continue;
  const d=(xx*xx)/(rx*rx)+(yy*yy)/(ry*ry),edge=1-hs(x,y,17)*.35;if(d>edge||tiles[(y>>4)*MW+(x>>4)]===T_WATER||P.gen&&wpx(P.wk,x,y))continue;const o=((y-y0)*w+x-x0)*4,dc=DIRT[CLIMS[climate[(y>>4)*MW+(x>>4)]]],k=amt*(d>edge-.25?.5:1)*(.75+hs(x,y,18)*.25);
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
   above, pixel for pixel). The water by the pixel (wpx): the water tiles (sea and lake, river, a ford's shallows, under a bridge:
   the plan's wk) read as a smooth field, its shore a curve (lakes rounded, rivers bending, a staircase of tiles a slope), wobbling
   a pixel or two. Over the window painted and a margin,
   each pixel's distance to the water's edge (wdist), and by it: rivers shaded by width (light at the bank, deeper in the middle
   of a wide one), a ford as a real one (the owner's third play-test): its shallows along its line, the river's bed showing through
   (gravel, sand, mud, slush; dappled), soft into the river, short ripples across the flow, the frost's ice at their edges; a
   gravel (sand, mud, slush) bank where they meet the land and a worn dirt track down each bank to the water (fordTrack); the
   sea and lakes as before, with a pale shallow halo along the shore (soft, cloudy edges), a few wave strokes and foam at the
   edge; on land a sand rim by the sea and lakes, a muddy bank by a river (a seasonal river's pale gravel and a dotted line). Roads (artGenRoads) follow their lines (WM.roads' line: the generator's smoothed ways, at
   any angle): each pixel shaded by how far inside the nearest band it lies: a worn verge, a dark edge, the middle with ruts (a
   track's middle grassed between them) and stones, a great road wider than a track, a little wider or narrower along the way;
   a fork's end carried onto the way it joins (joinEnds); a road's end at a holding led round its centre into its gate (gateLead), over worn ground
   there; each crossing met straight on its axis (straightOn), a bridge's deck by a ramp of road as wide. Over the land's nature
   (OVER_GEN): reeds and stones on the river banks, the crossings (stone or wooden bridges, a ford's few rocks scattered over its
   shallows, reeds at a swamp ford's edges, a ferry's landings, its raft and rope), white water on the rapids, the ore veins.
   Whatever is coloured by climate on and by the water (its tones, the shallows, sand, mud and foam, a ford) is shaded across a
   climate's edge by the climates' share round each tile corner (ClimMix), and a river's tones into a lake's or the sea's by the
   rivers' share (no square seams, no blocks of one climate's water in another's).
   GENART: the shore's wobble (px either way), the shallows' halo, the sand rim, a river's bank (px
   from the water); half a track's and a great road's width, the verge beyond it; the margin painted round a window (px); round a
   holding's centre the yard a road is led round (tiles), the covers over which a road's colour turns a climate's (roadPal), how far into the gate it ends (tiles) and the notch in the centre it
   may run into there (px either side of the gate, up from the centre's foot), how far a fork's end is carried on
   to the way it joins (tiles), and the worn ground before the gate
   [rx, ry, amount]; how far back along a crossing's axis its road runs straight onto it (tiles, at most; back where it turns back off a bridge), a bridge's ramp (px
   long) and its deck's half width (wood, stone); a ford's shallows (half their width, px, how soft their edge and how far the
   bar bends off its line; how much they lighten toward the bed (the river's lightest tone tint toward it), in two steps,
   dithered (bed), and the pebbles' share where shallowest, in clusters (peb), the ripples' share where shallow, the frost's ice (its noise past ice[0], where shallower than ice[1]); its track's half width and how far up each
   bank it runs past the end tile's middle (px); by climate (each light and dark), the bed (gravel, slush, sand, mud), the ripples,
   the track (dirt, trodden snow, sand, mud) and the rocks (shade, body, lit; a snow cap in the frost, moss in the swamp)). The
   ford's bar (the owner's fifth play-test: its shallows read as a pale box) bends as an S across the river (bend px each way, a
   second bend of bend2), w px either side of it, as much as width more or less along the way, its edge ragged by two noises (rag:
   their scales, px, then how far each moves it). wood: a road through a wood (a lane: a road's tile with n of its 8 neighbours wood;
   the land's nature makes it a wood's, PX.WN_LANE): its path narrower (narrow, a share), wandering wander px either way over sc px.
   farm: an oasis by a holding (tiles from its water to the holding's centre) has gardens. pond: a pond's shore wobbles pond[0] px
   (WM.ponds; a lake's wob) over a noise of pond[1] px */
const GENART={wob:1.6,halo:11,sand:2.6,bank:2.4,road:[2.3,3.6],verge:2.8,rblend:[.2,.8],margin:14,yard:.5,gate:.4,notch:[5,8],join:2,worn:[10,4,.32],lead:.9,back:1.6,ramp:9,deck:[5,6],
  wood:{n:4,narrow:.15,wander:1.3,sc:13},farm:4,pond:[3.5,9],
  ford:{w:7,width:.4,soft:7,bend:3,bend2:3,rag:[5,2.5,4,2],tint:.7,bed:[.3,.62],peb:.12,ripple:.18,ice:[.7,.6],tw:2.4,run:14,
    bed0:{grass:[188,178,142],frost:[204,214,226],desert:[236,216,164],swamp:[126,116,80]},bed1:{grass:[140,130,104],frost:[158,172,190],desert:[204,178,122],swamp:[90,82,56]},
    rip:{grass:[226,240,248],frost:[250,252,255],desert:[244,242,226],swamp:[150,168,132]},
    track0:{grass:[150,128,86],frost:[184,180,172],desert:[212,182,124],swamp:[102,88,60]},track1:{grass:[116,98,66],frost:[150,148,144],desert:[182,152,98],swamp:[76,64,44]},
    rock:{grass:['#5e5c58','#8e8a80','#c4c0b4'],frost:['#66707e','#96a0ae','#f6f9fc'],desert:['#866440','#b48c5c','#dcc08e'],swamp:['#363a2e','#565a44','#7a8a4a']}}};
const BAYER4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>v/16);
const rgbOf=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const SHORE_RGB=Object.fromEntries(Object.entries(SHORE).map(([k,v])=>[k,v.map(rgbOf)])),ROAD_RGB=Object.fromEntries(Object.entries(ROADC).map(([k,v])=>[k,v.map(rgbOf)]));
const PEB=[150,148,140],MUD={grass:[96,80,52],frost:[150,156,168],desert:[150,120,72],swamp:[62,54,36]},SEA_FOAM={grass:[200,224,244],frost:[232,242,250],desert:[206,228,244],swamp:[122,154,122]};
// (a smooth noise: along a line, hs at whole steps eased between; over the plane, the same at the lattice's corners)
const wnoise=(t,s)=>{const i=Math.floor(t),f=t-i,u=f*f*(3-2*f);return hs(i,s,71)*(1-u)+hs(i+1,s,71)*u};
const wnoise2=(x,y,s)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=hs(i,j,s),b=hs(i+1,j,s),c=hs(i,j+1,s),d=hs(i+1,j+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
// the plan's part: the water by tile (wk: 0 land, 1 sea or lake, 2 river, 3 ford (and a road's tile on a river that is no bridge:
// a ford a road was laid over), 4 a bridge's water, 5 a pond's), the roads' segments (segs:
// [x0, y0, x1, y1, k] px, from their lines (gateLead, straightOn); k 0 a track, 1 a great road, 2-5 a bridge's ramp: segW) and
// their bands kept clear, the holdings' centres (box: 1 no road painted there; 2 and 3 the tiles left and right of the gate, a
// road only in its notch) and the worn ground before their gates, the fords (fords: each its line bank to bank, px, and whether it
// runs across (horizontal); fd: 1 + its index on the tiles round it; fordOf: each ford crossing's 1 + index)
function artGenPlan(P,mark){const N=MW*MH,K=P.wk=new Uint8Array(N),Rv=WM.river,Fe=WM.feat,G=GENART;
  for(let i=0;i<N;i++){const t=tiles[i];K[i]=t===T_WATER?(Rv[i]&3?2:1):t===T_FORD||t===T_ROAD&&Rv[i]&3&&!(Fe[i]&32)?3:t===T_ROAD&&Fe[i]&32?4:0}
  const S=[],seg=(...a)=>S.push(...a);
  // (each line cut at its corners twice, Chaikin's way, its ends kept: a stretch the generator left in steps reads as a gentle bend)
  const soft=l=>{for(let t=0;t<2;t++){const o=[l[0],l[1]];for(let j=2;j<l.length;j+=2){const a=l[j-2],b=l[j-1],c=l[j],d=l[j+1];o.push(a*.75+c*.25,b*.75+d*.25,a*.25+c*.75,b*.25+d*.75)}o.push(l[l.length-2],l[l.length-1]);l=o}return l};
  // (the holdings' centres, each with its gate's x; the crossings by their two ends)
  const boxes=typeof centreBox==='function'?TOWNS.map(t=>Object.assign(centreBox(t),{gx:t.tx})):[],XE=new Map(),ramped=new Set();
  for(const c of WM.crossings){XE.set(c.i,[c,c.j]);XE.set(c.j,[c,c.i]);for(const q of c.tiles)XE.set(q,[c,-1])}
  const LS=[];for(const r of WM.roads){const k=r.kind==='road'?1:0;for(const l0 of r.line){const l=gateLead(l0,boxes);if(l.length>=4)LS.push([soft(straightOn(offDeck(l,XE),XE,k,ramped,seg)),k])}}
  // (an end at a gate or at a bridge's end (a track from a bridge end, worldplace.js: met by the ramp) stays where it is)
  const mt=v=>Math.abs(v-Math.floor(v)-.5)<.02,brEnd=(x,y)=>{const e=mt(x)&&mt(y)&&XE.get(Math.floor(y)*MW+Math.floor(x));return!!e&&e[1]>=0&&e[0].kind==='bridge'};
  joinEnds(LS,(x,y)=>brEnd(x,y)||boxes.some(b=>x>=b.x-G.yard&&x<=b.x+b.n+G.yard&&y>=b.y-G.yard&&y<=b.y+b.n+G.yard));for(const [l,k] of LS)for(let j=2;j<l.length;j+=2)seg(l[j-2]*TILE,l[j-1]*TILE,l[j]*TILE,l[j+1]*TILE,k);
  for(let k=0;k<S.length;k+=5){const a=S[k],b=S[k+1],c=S[k+2],d=S[k+3],hw=Math.ceil(segW(S[k+4],0)*1.15)+2,n=Math.max(1,Math.ceil(Math.max(Math.abs(c-a),Math.abs(d-b))/3));
    for(let s=0;s<=n;s++)mark(Math.round(a+(c-a)*s/n)-hw,Math.round(b+(d-b)*s/n)-hw,2*hw+1,2*hw+1)}
  P.segs=Float32Array.from(S);const B=P.box=new Uint8Array(N);
  // (the lanes: a road's tile in a wood (GENART.wood.n of its 8 neighbours wood, no water); each tile's segments whose band may
  //  reach it (ST: the start of each tile's in SI), for roadAt)
  const LN=P.lane=new Uint8Array(N);for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=y*MW+x;if(tiles[i]!==T_ROAD||K[i])continue;let n=0;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++)if(tiles[i+b*MW+a]===T_FOREST)n++;if(n>=G.wood.n)LN[i]=1}
  {const R=ROAD_REACH(),cnt=new Uint32Array(N+1),each=fn=>{for(let k=0;k<S.length;k+=5){const x0=Math.max(0,Math.floor((Math.min(S[k],S[k+2])-R)/TILE)),x1=Math.min(MW-1,Math.floor((Math.max(S[k],S[k+2])+R)/TILE)),y0=Math.max(0,Math.floor((Math.min(S[k+1],S[k+3])-R)/TILE)),y1=Math.min(MH-1,Math.floor((Math.max(S[k+1],S[k+3])+R)/TILE));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)fn(y*MW+x,k)}};
    each(t=>cnt[t+1]++);for(let t=0;t<N;t++)cnt[t+1]+=cnt[t];const SI=new Int32Array(cnt[N]),at=cnt.slice();each((t,k)=>{SI[at[t]++]=k});P.ST=cnt;P.SI=SI}
  for(const b of boxes)for(let y=Math.max(0,b.y);y<Math.min(MH,b.y+b.n);y++)for(let x=Math.max(0,b.x);x<Math.min(MW,b.x+b.n);x++)B[y*MW+x]=y<b.y+b.n-1?1:x===b.gx-1?2:x===b.gx?3:1;
  for(const t of TOWNS)P.tramples.push([t.x,t.y+3,...G.worn]);
  // (the ponds' and the oases' water (WM.ponds, WM.oases: each's water tiles from its middle, up to 9): a pond's bank its own, not a
  //  lake's sand (pk: 1 mud and grass, 2 a tarn's gravel; 3 an oasis's, sand); its water 5 in wk, so wpx curves its shore more,
  //  GENART.pond)
  const PK=P.pk=new Uint8Array(N);for(const q of (WM.ponds||[]).concat((WM.oases||[]).map(o=>({i:o.i,tiles:o.tiles,kind:'oasis'})))){const st=(q.tiles||[]).concat([q.i]),v=q.kind==='tarn'?2:q.kind==='oasis'?3:1;let n=0;while(st.length&&n<9){const i=st.pop();if(PK[i]||tiles[i]!==T_WATER)continue;PK[i]=v;K[i]=5;n++;const x=i%MW;if(x>0)st.push(i-1);if(x<MW-1)st.push(i+1);if(i>=MW)st.push(i-MW);if(i+MW<N)st.push(i+MW)}}
  const FD=P.fd=new Int16Array(N),FL=P.fords=[];P.fordOf=new Map();
  for(const c of WM.crossings){if(c.kind!=='ford')continue;const ax=c.i%MW,ay=(c.i-ax)/MW,bx=c.j%MW,by=(c.j-bx)/MW;FL.push([(ax+.5)*TILE,(ay+.5)*TILE,(bx+.5)*TILE,(by+.5)*TILE,ay===by]);P.fordOf.set(c,FL.length);
    for(let y=Math.max(0,Math.min(ay,by)-1);y<=Math.min(MH-1,Math.max(ay,by)+1);y++)for(let x=Math.max(0,Math.min(ax,bx)-1);x<=Math.min(MW-1,Math.max(ax,bx)+1);x++)FD[y*MW+x]=FL.length}}
// the generated world's roads as painted, for what must keep off them (lots.js roadPaint): mark(x, y, w, h) for each square kept
// clear along their lines (artGenPlan's band and margin)
function artRoadMarks(mark){artGenPlan({tramples:[]},mark)}
// (a segment's half width (px) at t (0-1) along it, by its kind k: a track's or a great road's; a ramp's (k 2 + great + 2 if the
//  bridge is stone) from as wide as the deck is inside at its start to its road's at its end)
const segW=(k,t)=>{const G=GENART;if(k<2)return G.road[k];const w0=G.deck[(k-2)>>1]-1,w1=G.road[(k-2)&1];return w0+(w1-w0)*t};
// (a line [x, y, ...] in tiles, its ends led to the gates: an end within a holding's centre or GENART.yard tiles round it is cut
//  where the line first comes into that yard (from its far end), then led round the yard's corners, the nearer way, to the middle
//  of the tile below the gate, and up into the gate; as lots.js leads the road tiles round the centre. A line wholly in a yard (a
//  stretch through the holding) is left out: [])
const revLine=l=>{const o=[];for(let j=l.length-2;j>=0;j-=2)o.push(l[j],l[j+1]);return o};
function gateLead(l,boxes){const m=GENART.yard,rev=revLine;
  const lead=l=>{const n=l.length,ex=l[n-2],ey=l[n-1],b=boxes.find(b=>ex>=b.x-m&&ex<=b.x+b.n+m&&ey>=b.y-m&&ey<=b.y+b.n+m);if(!b||n<4)return l;
    const x0=b.x-m,y0=b.y-m,x1=b.x+b.n+m,y1=b.y+b.n+m,gx=b.gx;
    for(let j=2;j<n;j+=2){const ax=l[j-2],ay=l[j-1],dx=l[j]-ax,dy=l[j+1]-ay;let t0=0,t1=1,ok=true;
      // (Liang and Barsky's clip: where the leg comes into the yard, if it does)
      for(const [p,q] of [[-dx,ax-x0],[dx,x1-ax],[-dy,ay-y0],[dy,y1-ay]]){if(!p){if(q<0)ok=false;continue}const r=q/p;if(p<0)t0=Math.max(t0,r);else t1=Math.min(t1,r)}
      if(!ok||t0>t1)continue;if(t0<=0)return l[0]>=x0&&l[0]<=x1&&l[1]>=y0&&l[1]<=y1?[]:l;
      const cx=ax+dx*t0,cy=ay+dy*t0,o=l.slice(0,j),e=1e-6,add=(x,y)=>{if(Math.abs(o[o.length-2]-x)>.05||Math.abs(o[o.length-1]-y)>.05)o.push(x,y)};add(cx,cy);
      if(Math.abs(cy-y1)>e){const sx=Math.abs(cx-x0)<e?x0:Math.abs(cx-x1)<e?x1:cx<gx?x0:x1;add(sx,Math.abs(cy-y0)<e?y0:cy);add(sx,y1)}
      add(gx,y1);add(gx,b.y+b.n-GENART.gate);return o}
    return l};
  const a=lead(l);return a.length?rev(lead(rev(a))):a}
// (each end of a softened line that stops on another's way (a fork, a junction) carried on to the nearest point of that line as
//  softened, within GENART.join tiles: the softening moves a line off the point its end was snapped to); not an end at a gate or a
//  bridge's end (at(x, y))
function joinEnds(LS,at){const J=GENART.join,bb=LS.map(([l])=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;for(let j=0;j<l.length;j+=2){a=Math.min(a,l[j]);b=Math.min(b,l[j+1]);c=Math.max(c,l[j]);d=Math.max(d,l[j+1])}return[a-J,b-J,c+J,d+J]});
  LS.forEach(([l],n)=>{for(const e of [0,1]){const px=e?l[l.length-2]:l[0],py=e?l[l.length-1]:l[1];let best=J*J,bx=0,by=0,hit=false;if(at(px,py))continue;
    LS.forEach(([m],q)=>{const B=bb[q];if(q===n||px<B[0]||py<B[1]||px>B[2]||py>B[3])return;
      for(let j=2;j<m.length;j+=2){const ax=m[j-2],ay=m[j-1],vx=m[j]-ax,vy=m[j+1]-ay,L=vx*vx+vy*vy,t=L?Math.max(0,Math.min(1,((px-ax)*vx+(py-ay)*vy)/L)):0,x=ax+vx*t,y=ay+vy*t,d=(x-px)*(x-px)+(y-py)*(y-py);
        if(d<best){best=d;bx=x;by=y;hit=true}}});
    if(hit&&best>1e-4){if(e)l.push(bx,by);else l.unshift(bx,by)}}})}
// (a line's end on a crossing's water (a stretch laid from the middle of its deck) moved back to the middle of the crossing's end
//  tile on the line's side, the points it passes over on the way dropped (that tile's own too: no leg of no length, which
//  straightOn cannot turn onto the axis); but a road leaving a ford sideways, off its middle onto
//  the bank, starts where it is, in the shallows)
function offDeck(l,XE){const at=(x,y)=>Math.floor(y)*MW+Math.floor(x),cen=t=>[t%MW+.5,(t-t%MW)/MW+.5];
  const fix=l=>{const n=l.length,e=n>=4&&XE.get(at(l[0],l[1]));if(!e||e[1]>=0)return l;const c=e[0],[ix,iy]=cen(c.i),[jx,jy]=cen(c.j),A=(x,y)=>(x-ix)*(jx-ix)+(y-iy)*(jy-iy),a0=A(l[0],l[1]);
    if(c.kind==='ford'&&Math.abs(A(l[2],l[3])-a0)<.7071*Math.hypot(l[2]-l[0],l[3]-l[1])*Math.hypot(jx-ix,jy-iy))return l;
    const [ex,ey]=A(l[2],l[3])<a0?[ix,iy]:[jx,jy],ae=A(ex,ey);let q=2;while(q<n-2&&(A(l[q],l[q+1])-a0)*(ae-a0)>0&&Math.abs(A(l[q],l[q+1])-a0)<Math.abs(ae-a0))q+=2;
    if(q<n&&Math.abs(l[q]-ex)<.02&&Math.abs(l[q+1]-ey)<.02)q+=2;
    return[ex,ey,...l.slice(q)]};
  return revLine(fix(revLine(fix(l))))}
// (a line's crossings met straight: where the line comes to the middle of a crossing's end tile from the land, on its way onto
//  the crossing (the next point the other end's middle) or ending there, a point is put on the crossing's axis on the land side
//  (GENART.lead tiles out, at most half the way to that next point, less as the way turns off the axis there; off a bridge, the whole
//  lead where it turns back, GENART.back tiles, so the turn comes clear of the ramp), so the softened
//  line runs onto it on its axis; a bridge's deck is met at that end by a ramp of road on its axis, as wide as the deck is inside,
//  narrowing to the road's width over GENART.ramp px or that straight run (seg, once an end). XE: each crossing end's tile to [the
//  crossing, its other end's tile], each of its water tiles to [the crossing, -1])
function straightOn(l,XE,k,ramped,seg){const G=GENART,o=[],n=l.length,mid=v=>Math.abs(v-Math.floor(v)-.5)<.02,at=(x,y)=>Math.floor(y)*MW+Math.floor(x);
  for(let j=0;j<n;j+=2){const x=l[j],y=l[j+1],e=mid(x)&&mid(y)?XE.get(at(x,y)):null;if(!e||e[1]<0){o.push(x,y);continue}
    const [c,ot]=e,ox=ot%MW+.5,oy=(ot-ot%MW)/MW+.5,on=q=>q>=0&&q<n&&Math.abs(l[q]-ox)<.02&&Math.abs(l[q+1]-oy)<.02,b=on(j-2),a=on(j+2);
    if(!b&&!a&&j&&j<n-2){o.push(x,y);continue}
    const L=Math.hypot(x-ox,y-oy),ux=(x-ox)/L,uy=(y-oy)/L;let d=G.lead;
    if(j&&!b||j<n-2&&!a){const q=j&&!b?j-2:j+2,dx=l[q]-x,dy=l[q+1]-y,h=Math.hypot(dx,dy);const cs=(dx*ux+dy*uy)/h;const bk=cs<0&&c.kind==='bridge';d=Math.min(bk?G.back:G.lead,.5*h*(bk?1:Math.max(.25,cs)))}
    if(j&&!b)o.push(x+ux*d,y+uy*d);o.push(x,y);if(j<n-2&&!a)o.push(x+ux*d,y+uy*d);
    const key=c.i===at(x,y)?'i':'j';if(c.kind!=='bridge'||ramped.has(c[key]))continue;ramped.add(c[key]);
    const hor=Math.abs(uy)<.5,lo=(hor?x-ox:y-oy)<0,u=lo?Math.floor(hor?x:y)*TILE+TILE-2:Math.floor(hor?x:y)*TILE+2,u1=u+(lo?-1:1)*(Math.max(2,Math.min(G.ramp,d*TILE*.75))+2),m=(hor?y:x)*TILE,g=2+k+(c.stone?2:0);
    if(hor)seg(u,m,u1,m,g);else seg(m,u,m,u1,g)}
  return o}
// is map pixel (x, y) water (1) or land (0): the water's field there over a half. The field: the tiles round it (water 1, land 0, off
// the map water) read between their middles a quadratic B-spline's way (a straight shore stays on its tiles' edge, a staircase of
// tiles reads as a slope, a corner as an arc), or bilinearly where that is more (a lone water tile or a thread of them keeps its
// size), its edge moved by a smooth noise (GENART.wob px either way): rounded lakes and smooth bends, each shore within some 6 px of
// its tiles' edge (passing stays by tile; the land's nature keeps clear of the water: worldnature.js spec.wet and round)
function wpx(K,x,y){const n=wnb(K,x>>4,y>>4,WN9);for(let k=1;k<9;k++)if(n[k]!==n[0])return wpxN(n,x,y);return n[0]}
// (WNP: a pond's water among the nine wnb last read, whose shore wobbles GENART.pond px, not wob: a small pond round, not a box)
let WNP=false;
// (the 3 x 3 tiles round tile (tx, ty) as wpx reads them, into n: 1 water or off the map, 0 land, row by row; wpxN: wpx with them
//  read, a tile's pixels with one wnb. The noise moves the field a tenth at most (GENART.wob/16 either way): where the field lies
//  farther from a half than that (everywhere, when all nine are alike) the pixel is what the field says, the noise not read)
const WN9=new Uint8Array(9);
function wnb(K,tx,ty,n){WNP=false;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const p=tx+a,q=ty+b,k=p<0||q<0||p>=MW||q>=MH?1:K[q*MW+p];n[(b+1)*3+a+1]=k>0?1:0;if(k===5)WNP=true}return n}
function wpxN(n,x,y){const u=((x&15)+.5)/16-.5,v=((y&15)+.5)/16-.5;
  const qa=(.5-u)*(.5-u)/2,qb=.75-u*u,qc=(.5+u)*(.5+u)/2,m01=n[3],m11=n[4],m21=n[5],r0=qa*n[0]+qb*n[1]+qc*n[2],r1=qa*m01+qb*m11+qc*m21,r2=qa*n[6]+qb*n[7]+qc*n[8];
  const fq=(.5-v)*(.5-v)/2*r0+(.75-v*v)*r1+(.5+v)*(.5+v)/2*r2,ix=u<0?-1:1,iy=v<0?-1:1,au=u<0?-u:u,av=v<0?-v:v;
  const fl=(1-av)*((1-au)*m11+au*(ix<0?m01:m21))+av*((1-au)*n[(iy+1)*3+1]+au*n[(iy+1)*3+ix+1]);
  const f=fq>fl?fq:fl,wb=WNP?GENART.pond[0]:GENART.wob,ws=WNP?GENART.pond[1]:6,nr=wb/16+1e-9;return f>.5+nr?1:f<.5-nr?0:f+(wnoise2(x/ws,y/ws,27)-.5)*wb/8>.5?1:0}
// (each pixel's distance to the edge between water and land, W x H of mask M: 1 px steps, 1.414 diagonal; at most 16. The passes
//  kept to the 16-px blocks by an edge's (R: those with one in them or in a block beside them); a pixel of any other is 17 px or
//  more from the edge and stays 16)
function* wdist(M,W,H){const D=new Float32Array(W*H).fill(16),BW=(W+15)>>4,BH=(H+15)>>4,R=new Uint8Array(BW*BH);let any=false;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,m=M[i];if(x>0&&M[i-1]!==m||x<W-1&&M[i+1]!==m||y>0&&M[i-W]!==m||y<H-1&&M[i+W]!==m){D[i]=.5;any=true;
    const bx=x>>4,by=y>>4;for(let b=Math.max(0,by-1);b<=Math.min(BH-1,by+1);b++)for(let a=Math.max(0,bx-1);a<=Math.min(BW-1,bx+1);a++)R[b*BW+a]=1}}
  if(!any)return D;
  yield;for(let y=0;y<H;y++){if(!(y&63))yield;const rb=(y>>4)*BW;for(let x=0;x<W;x++){if(!R[rb+(x>>4)]){x|=15;continue}const i=y*W+x;let d=D[i];if(x>0)d=Math.min(d,D[i-1]+1);if(y>0){d=Math.min(d,D[i-W]+1);if(x>0)d=Math.min(d,D[i-W-1]+1.414);if(x<W-1)d=Math.min(d,D[i-W+1]+1.414)}D[i]=d}}
  for(let y=H-1;y>=0;y--){if(!(y&63))yield;const rb=(y>>4)*BW;for(let x=W-1;x>=0;x--){if(!R[rb+(x>>4)]){x&=~15;continue}const i=y*W+x;let d=D[i];if(x<W-1)d=Math.min(d,D[i+1]+1);if(y<H-1){d=Math.min(d,D[i+W]+1);if(x<W-1)d=Math.min(d,D[i+W+1]+1.414);if(x>0)d=Math.min(d,D[i+W-1]+1.414)}D[i]=d}}
  return D}
// (the water tile a pixel of tile (tx, ty) belongs to: its own, else the nearest round it, one of kind no (a bridge's water) only if
//  there is no other; -1 none)
const WNEAR=[[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
function wnear(K,tx,ty,no){for(const [a,b] of WNEAR){const u=tx+a,v=ty+b;if(u>=0&&v>=0&&u<MW&&v<MH&&K[v*MW+u]&&K[v*MW+u]!==no)return v*MW+u}return no?wnear(K,tx,ty):-1}
// the generated world's ground of the window x0, y0, w×h into D, its pixels in I (groundSteps' part)
function* artGenGround(P,D,x0,y0,w,h,I){
  const MG=GENART.margin,X0=x0-MG,Y0=y0-MG,RW=w+2*MG,RH=h+2*MG,M=new Uint8Array(RW*RH),N9=new Uint8Array(9),K=P.wk,Rv=WM.river,G=GENART;
  // (a tile whose 8 neighbours are all its kind is that kind to its every pixel: only the tiles at an edge are worked a pixel at a time)
  const kd=(u,v)=>u<0||v<0||u>=MW||v>=MH||K[v*MW+u]>0?1:0;
  for(let ty=Y0>>4;ty<=(Y0+RH-1)>>4;ty++){for(let tx=X0>>4;tx<=(X0+RW-1)>>4;tx++){const k=kd(tx,ty);let same=true;for(let b=-1;b<=1&&same;b++)for(let a=-1;a<=1;a++)if(kd(tx+a,ty+b)!==k){same=false;break}
      const ya=Math.max(Y0,ty*16),yb=Math.min(Y0+RH,ty*16+16),xa=Math.max(X0,tx*16),xb=Math.min(X0+RW,tx*16+16);
      if(!same)wnb(K,tx,ty,N9);for(let y=ya;y<yb;y++){const o=(y-Y0)*RW-X0;if(same)M.fill(k,o+xa,o+xb);else for(let x=xa;x<xb;x++)M[o+x]=wpxN(N9,x,y)}}
    yield}
  const DT=yield* wdist(M,RW,RH);yield;
  const tx0=x0>>4,ty0=y0>>4,tx1=(x0+w-1)>>4,ty1=(y0+h-1)>>4,LW=tx1-tx0+2,LG=new Float32Array(LW*(ty1-ty0+2)),DG=new Float32Array(LW*(ty1-ty0+2)),dep=P.dep;
  for(let y=ty0;y<=ty1+1;y++)for(let x=tx0;x<=tx1+1;x++){const k=(y-ty0)*LW+x-tx0;LG[k]=(fbm(x/4.5,y/4.5,77)-.5)*2;
    let s=0,n=0;for(const [a,b] of [[0,0],[-1,0],[0,-1],[-1,-1]]){const tx=x+a,ty=y+b;if(tx<0||ty<0||tx>=MW||ty>=MH)continue;s+=Math.min(4,dep[ty*MW+tx]===9?4:dep[ty*MW+tx]);n++}DG[k]=n?s/n:4}
  // (the rivers' share of the water round each tile corner (its 2 x 2 tiles, else its 4 x 4): a river's tones run into a lake's;
  //  and their width there (WG, 1-3): a river's shading runs on from a narrow stretch into a wide one, no square)
  const RG=new Float32Array(LW*(ty1-ty0+2)),WG=new Float32Array(LW*(ty1-ty0+2)),rs=(x,y,r,o)=>{let n=0,m=0,wd=0;for(let b=-r;b<r;b++)for(let a=-r;a<r;a++){const u=x+a,v=y+b;if(u<0||v<0||u>=MW||v>=MH)continue;const k=K[v*MW+u];if(k){n++;if(k>1&&(k<4||Rv[v*MW+u]&3)){m++;wd+=Math.max(1,Rv[v*MW+u]&3)}}}
    if(!n)return false;o[0]=m/n;o[1]=m?wd/m:1;return true};
  for(let y=ty0;y<=ty1+1;y++)for(let x=tx0;x<=tx1+1;x++){const o=[0,1],q=(y-ty0)*LW+x-tx0;if(!rs(x,y,1,o))rs(x,y,2,o);RG[q]=o[0];WG[q]=o[1]}
  const WL=CLIMS.map(c=>WATER_RGB[c]),CVG=coverGrids(P,tx0,ty0,tx1,ty1,LW),cv=[0,0,0],FD=P.fd,FG=G.ford,CM=new ClimMix(tx0,ty0,tx1,ty1,LW),SW=CLIMS.indexOf('swamp'),FRI=CLIMS.indexOf('frost');
  const T=(o)=>CLIMS.map(c=>o[c]),FOAM=T(SEA_FOAM),SH0=CLIMS.map(c=>SHORE_RGB[c][0]),SH1=CLIMS.map(c=>SHORE_RGB[c][1]),MD=T(MUD),B0=T(FG.bed0),B1=T(FG.bed1),RP=T(FG.rip),T0=T(FG.track0),T1=T(FG.track1);
  const TK=coverTiles(CVG,LW,ty1-ty0+1),PK=[GRASS_F,...COVERS.map(L=>L.F)],C3=[0,0,0];
  for(let y=I.y;y<I.y+I.h;y++){const ty=y>>4,fy=(y&15)/16;let b4x=-1,b4=0;// (b4: the light's grain, a value each 4 x 4 px)
    for(let x=I.x;x<I.x+I.w;x++){const tx=x>>4,fx=(x&15)/16,o=((y-y0)*w+x-x0)*4,r=(y-Y0)*RW+x-X0,dd=DT[r],f=FD[ty*MW+tx];
      const q=(ty-ty0)*LW+tx-tx0;let c;
      if(M[r]){const P3=palAt(CM,WL,q,fx,fy),k=CM.k,rw=bil(RG,q,LW,fx,fy);let cl=null;
        // (a lake's or the sea's tones by depth, with the pale halo along its shore; a river's by width, lighter at its banks)
        if(rw<1){const d=bil(DG,q,LW,fx,fy);cl=d<1.5?mixc(P3[0],P3[1],Math.max(0,d-.5)):mixc(P3[1],P3[2],Math.min(1,(d-1.5)/2.5));
          if(dd<G.halo){const hk=Math.min(1,(1-dd/G.halo)*(.35+.9*wnoise2(x/9,y/9,23)));cl=mixc(cl,mixc(P3[0],[232,242,238],.45),hk*.8)}}
        if(rw>0){const wr=bil(WG,q,LW,fx,fy),t1=Math.min(1,dd/(2+wr*2));c=mixc(P3[0],P3[1],.2+.6*t1);if(wr>2)c=mixc(c,P3[2],Math.max(0,Math.min(1,(dd-5)/8))*.6*(wr-2));
          const sw=CM.share(SW);if(sw>0)c=mixc(c,[56,92,100],.35*sw);if(dd<1.2)c=mixc(c,[200,190,150],.2);if(cl)c=mixc(cl,c,rw)}else c=cl;
        if(rw<.5){if(dd<1.3&&hs(x,y,4)>.3)c=CM.tone(FOAM,k);
          else if(dd>3.5&&dd<G.halo-1){const sy=y>>2,sx=x+(sy&1)*4;if(hs(sx>>3,sy,29)<.08&&(sx&7)<4&&(y&3)===1)c=mixc(c,[255,255,255],.4)}}
        // (a ford: its shallows, the water lightened toward its bed (gravel, sand, mud, slush) and soft into the river, the bed showing
        //  through in pebbles light and dark, in clusters; short ripples across the flow (along its line), a few px each, here and
        //  there; the frost's ice plates at their edges)
        if(f){const sh=fordAt(P,f,x,y);if(sh>0){const b0=CM.tone(B0,k),lv=Math.min(2,Math.floor(sh*3+BAYER4[(y&3)*4+(x&3)]*.9));
          if(lv)c=mixc(c,mixc(P3[0],b0,FG.tint),FG.bed[lv-1]);
          const n=hs(x,y,f+61);if(lv===2&&wnoise2(x/4,y/4,f+60)>.55){if(n<FG.peb)c=mixc(c,CM.tone(B1,k),.7);else if(n>1-FG.peb)c=mixc(c,b0,.85)}
          const e=sh*sh*(3-2*sh);
          const hz=P.fords[f-1][4],u=hz?x:y,v=hz?y:x;if(e>.3&&!(v&1)&&hs((u+Math.floor(hs(v,f,72)*5))/5|0,v,f+70)<FG.ripple*e)c=mixc(c,CM.tone(RP,k),.55);
          const fs=CM.share(FRI);if(fs>.5&&sh<FG.ice[1]){const m=wnoise2(x/3,y/3,f+80);if(m>FG.ice[0])c=m>FG.ice[0]+.04?mixc(c,[238,245,251],.9*fs):mixc(c,[168,194,218],.7*fs)}}}
        if(hs(x>>1,y,8)<.02)c=mixc(c,[255,255,255],.25)}
      else{const L=bil(LG,q,LW,fx,fy);if(x>>2!==b4x){b4x=x>>2;b4=hs(b4x,y>>2,3)}let v=.5+.38*L+.22*(b4-.5);v=Math.max(0,Math.min(1,v));const tk=TK[q];
        if(tk<4)c=litSpk(PK[tk],v,hs(x,y,9),C3);else{cv[0]=bil(CVG[0],q,LW,fx,fy);cv[1]=bil(CVG[1],q,LW,fx,fy);cv[2]=bil(CVG[2],q,LW,fx,fy);c=landRGB(v,cv,x,y)}
        if(dd<7&&(f||dd<4.5)){const k=CM.at(q,fx,fy);
          if(dd<4.5){const j=wnear(K,tx,ty,4);if(j>=0){const kj=K[j];
            if(P.pk[j]&&P.pk[j]<3){if(dd<G.bank+1)c=mixc(c,P.pk[j]===2?PEB:CM.tone(MD,k),.6*Math.min(1,(G.bank+1-dd)/2));if(P.pk[j]===2&&dd<G.bank+1&&hs(x,y,14)<.3)c=mixc(c,[96,94,90],.6)}
            else if(kj===1||kj===5){const s0=CM.tone(SH0,k),s1=CM.tone(SH1,k);if(dd<G.sand)c=dd<1.3?mixc(s0,s1,.5):hs(x,y,13)<.15?s1:s0;else if(dd<G.sand+1.5)c=mixc(c,s0,.45*(1-(dd-G.sand)/1.5))}
            else if(Rv[j]&8){if(dd<2.8)c=mixc(c,[190,182,162],.6);if(dd>=1.8&&dd<2.9&&(x+y)%3===0)c=mixc(c,[104,98,86],.7)}
            else if(dd<G.bank+1)c=mixc(c,CM.tone(MD,k),.55*Math.min(1,(G.bank+1-dd)/2))}}
          // (where a ford's shallows meet the land, its bank: the bed's gravel (sand, mud, slush), dappled)
          if(f){const sh=fordAt(P,f,x,y)*Math.min(1,(7-dd)/3);if(sh>0)c=mixc(c,hs(x,y,f+62)<.3?CM.tone(B1,k):CM.tone(B0,k),.55*sh)}}
        // (a ford's track down each bank to the water: worn dirt, its ruts and pebbles, ragged at its edge)
        if(f){const tk=fordTrack(P,f,x,y);if(tk>0){const k=CM.at(q,fx,fy),n=hs(x,y,f+63);c=mixc(c,n<.3?CM.tone(T1,k):n>.96?CM.tone(B0,k):CM.tone(T0,k),Math.min(1,tk*(.75+.3*hs(x>>1,y>>1,f+64))))}}}
      D[o]=c[0];D[o+1]=c[1];D[o+2]=c[2];D[o+3]=255}
    if(!((y-y0+1)&3))yield}
}
// (how shallow a ford f's water is at pixel (x, y), 0-1: within GENART.ford.w of its line bank to bank (a bar wandering off it in
//  an S), more or less along it, its edge ragged and soft over ford.soft px; round at each end, over the bank)
const fordAt=(P,f,x,y)=>{const [ax,ay,bx,by]=P.fords[f-1],vx=bx-ax,vy=by-ay,L=vx*vx+vy*vy,ex=x+.5-ax,ey=y+.5-ay,t=Math.max(0,Math.min(1,(ex*vx+ey*vy)/L)),dx=ex-vx*t,dy=ey-vy*t,F=GENART.ford;
  // (the bar's middle wanders off the line along the way (bend px either way), an S across the river (bend2), back on it at each end)
  const sl=Math.sqrt(L),w=(wnoise(t*sl/16,f*7+2)-.5)*2*F.bend*Math.sin(Math.PI*t)+F.bend2*(f&1?1:-1)*Math.sin(2*Math.PI*t),p=(dx*vy-dy*vx)/sl-w,q=(dx*vx+dy*vy)/sl;
  return Math.max(0,Math.min(1,(F.w*(1-F.width/2+F.width*wnoise(t*sl/5,f*7))+(wnoise2(x/F.rag[0],y/F.rag[0],f+47)-.5)*F.rag[2]+(wnoise2(x/F.rag[1],y/F.rag[1],f+48)-.5)*F.rag[3]-Math.sqrt(p*p+q*q))/F.soft))};
// (how much of a ford f's track lies on pixel (x, y), 0-1: along its line from bank to bank and on up each bank GENART.ford.run px
//  past the end tile's middle, thinning out there; ford.tw px either side of the line, which wanders a px or so, its edge ragged)
const fordTrack=(P,f,x,y)=>{const [ax,ay,bx,by]=P.fords[f-1],F=GENART.ford,vx=bx-ax,vy=by-ay,L=Math.sqrt(vx*vx+vy*vy),ex=x+.5-ax,ey=y+.5-ay,s=(ex*vx+ey*vy)/L,out=s<0?-s:s>L?s-L:0;
  if(out>=F.run)return 0;const d=Math.abs((ex*vy-ey*vx)/L+(wnoise(s/7,f*3+1)-.5)*2.2);return Math.max(0,Math.min(1,(F.tw+.8*(hs(x,y,f+65)-.5)-d)/1.1))*Math.min(1,(F.run-out)/6)};
// (how far inside a ford f's track pixel (x, y) lies, px, as roadAt reads a band: its half width less its distance from the track's
//  wandering line, -99 past its end)
const fordBand=(P,f,x,y)=>{const [ax,ay,bx,by]=P.fords[f-1],F=GENART.ford,vx=bx-ax,vy=by-ay,L=Math.sqrt(vx*vx+vy*vy),ex=x+.5-ax,ey=y+.5-ay,s=(ex*vx+ey*vy)/L,out=s<0?-s:s>L?s-L:0;
  return out>=F.run?-99:F.tw-Math.abs((ex*vy-ey*vx)/L+(wnoise(s/7,f*3+1)-.5)*2.2)};
// the roads over the window's ground (paintSteps, before the land's nature): each pixel by the band it lies deepest in (SC: half
// the band's width there, a road's a little more or less along the way, less its distance from the line; DL: that distance; KF: a
// great road's); its tones and its verge's dirt the climates' mixed by their covers there (roadPal: no line where a road crosses
// from one climate into another, the owner's fourth play-test). Returns the bands for the brooks crossing them (worldnature.js
// PX.WN_XING): at(x, y) SC there (-99: none, or a holding's centre or water), great(x, y) a great road's
// (how far the roads' bands reach from their lines, px: the widest's half, its verge and a pixel)
const ROAD_REACH=()=>Math.max(GENART.road[1]*1.15,GENART.deck[1])+GENART.verge+1;
// (how much of a pixel is a lane's (P.lane, GENART.wood), 0-1: the lane tiles read between their middles)
function laneW(L,x,y){const u=x/TILE-.5,v=y/TILE-.5,i=Math.floor(u),j=Math.floor(v),fx=u-i,fy=v-j,q=(a,b)=>a<0||b<0||a>=MW||b>=MH?0:L[b*MW+a];
  const a=q(i,j),b=q(i+1,j),c=q(i,j+1),d=q(i+1,j+1);return a+b+c+d?a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy:0}
// (how far pixel (x, y) lies inside the band of segment k (P.segs) as artGenRoads paints it where wf (laneW) is over 0: a track's
//  or a great road's half width (a little more or less along the way) narrower by GENART.wood.narrow, its line wandering
//  wood.wander px either way; its distance from that line into BD[1])
const BD=[0,0];
function segBand(S,k,x,y,wf){const a=S[k],b=S[k+1],vx=S[k+2]-a,vy=S[k+3]-b,g=S[k+4],L=Math.sqrt(vx*vx+vy*vy)||1e-9,ex=x+.5-a,ey=y+.5-b,u=(ex*vx+ey*vy)/L,WD=GENART.wood;
  const ov=u<0?-u:u>L?u-L:0,sd=(ex*vy-ey*vx)/L-(wnoise2(x/WD.sc,y/WD.sc,62)-.5)*2*WD.wander*wf,dl=Math.sqrt(ov*ov+sd*sd);
  BD[1]=dl;return BD[0]=(g<2?GENART.road[g]*(.88+.24*wnoise2(x/40,y/40,61))*(1-WD.narrow*wf):segW(g,Math.max(0,Math.min(1,u/L))))-dl}
// the ways' band at map pixel (x, y), the roads' from all of them (P.ST, P.SI: each tile's segments) and a ford's track's: how far
// inside the nearest it lies, px (over 0 its surface; -99 none near), as painted (a lane's narrowed and wandering), whatever window
// is painted: for the land's nature (a wood's lane, a ford's track through a wood, a brook beside a road)
function roadAt(P,x,y){if(x<0||y<0||x>=MW*TILE||y>=MH*TILE)return -99;const t=(y>>4)*MW+(x>>4),S=P.segs,R=ROAD_REACH(),wf=laneW(P.lane,x,y);let s=-99;
  for(let p=P.ST[t];p<P.ST[t+1];p++){const k=P.SI[p],v=segBand(S,k,x,y,S[k+4]<2?wf:0);if(BD[1]<=R&&v>s)s=v}
  const f=P.fd[t];if(f){const v=fordBand(P,f,x,y);if(v>s)s=v}return s}
function* artGenRoads(P,D,x0,y0,w,h){const S=P.segs,K=P.wk,B=P.box,G=GENART,RD=GENART.road,V=GENART.verge,R=ROAD_REACH(),SC=new Float32Array(w*h).fill(-99),DL=new Float32Array(w*h),KF=new Uint8Array(w*h);
  // (a lane in or by the window: its pixels by segBand)
  let LN=false;for(let ty=Math.max(0,(y0>>4)-1);ty<=Math.min(MH-1,((y0+h-1)>>4)+1)&&!LN;ty++)for(let tx=Math.max(0,(x0>>4)-1);tx<=Math.min(MW-1,((x0+w-1)>>4)+1);tx++)if(P.lane[ty*MW+tx]){LN=true;break}
  for(let k=0;k<S.length;k+=5){const a=S[k],b=S[k+1],c=S[k+2],d=S[k+3],g=S[k+4];if(Math.max(a,c)+R<x0||Math.min(a,c)-R>=x0+w||Math.max(b,d)+R<y0||Math.min(b,d)-R>=y0+h)continue;
    const vx=c-a,vy=d-b,L=vx*vx+vy*vy,px0=Math.max(x0,Math.floor(Math.min(a,c)-R)),px1=Math.min(x0+w-1,Math.ceil(Math.max(a,c)+R)),py0=Math.max(y0,Math.floor(Math.min(b,d)-R)),py1=Math.min(y0+h-1,Math.ceil(Math.max(b,d)+R));
    for(let y=py0;y<=py1;y++)for(let x=px0;x<=px1;x++){const wf=LN&&g<2?laneW(P.lane,x,y):0;let s,dl;
      if(wf>0){s=segBand(S,k,x,y,wf);dl=BD[1];if(dl>R)continue}
      else{const ex=x+.5-a,ey=y+.5-b,t=L?Math.max(0,Math.min(1,(ex*vx+ey*vy)/L)):0,dx=ex-vx*t,dy=ey-vy*t;dl=Math.sqrt(dx*dx+dy*dy);if(dl>R)continue;s=(g<2?RD[g]*(.88+.24*wnoise2(x/40,y/40,61)):segW(g,t))-dl}
      const o=(y-y0)*w+x-x0;if(s>SC[o]){SC[o]=s;DL[o]=dl;KF[o]=g&1}}
    if(!(k%80))yield}
  const tx0=x0>>4,ty0=y0>>4,LW=((x0+w-1)>>4)-tx0+2,CVG=coverGrids(P,tx0,ty0,(x0+w-1)>>4,(y0+h-1)>>4,LW),cv=[0,0,0],RP4=[[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
  for(let y=y0;y<y0+h;y++){if(!((y-y0+1)&31))yield;for(let x=x0;x<x0+w;x++){const o=(y-y0)*w+x-x0,s=SC[o];if(s<=-V)continue;const i=(y>>4)*MW+(x>>4),bi=B[i];if(K[i]||bi===1||bi>1&&((y&15)<16-G.notch[1]||(bi===2?16-(x&15):(x&15)+1)>G.notch[0])||wpx(K,x,y))continue;
    const q4=((y>>4)-ty0)*LW+(x>>4)-tx0,fx=(x&15)/16,fy=(y&15)/16;for(let k=0;k<3;k++){const A=CVG[k],a=A[q4],b=A[q4+1],cc=A[q4+LW],d=A[q4+LW+1];cv[k]=a+(b-a)*fx+(cc-a)*fy+(a-b-cc+d)*fx*fy}
    const RC=roadPal(cv,RP4),q=o*4,cur=[D[q],D[q+1],D[q+2]];let c;
    if(s<=0){if(hs(x,y,57)<.25+.4*(-s/V))continue;c=mixc(cur,RC[3],.42*(1+s/V))}
    else if(s<=1.1)c=KF[o]?RC[0]:mixc(RC[1],RC[0],.4);
    else{const dl=DL[o];c=RC[1];if(KF[o]?Math.abs(dl-1.6)<.5:Math.abs(dl-1.05)<.42)c=mixc(c,RC[0],.45);else if(!KF[o]&&dl<.55)c=mixc(c,cur,.5);
      const ph=hs(x,y,58);if(ph<.025)c=RC[2];else if(ph>.98)c=RC[0]}
    D[q]=c[0];D[q+1]=c[1];D[q+2]=c[2]}}
  const ok=(x,y)=>{if(x<x0||y<y0||x>=x0+w||y>=y0+h)return false;const i=(y>>4)*MW+(x>>4);return!K[i]&&B[i]!==1};
  return{at:(x,y)=>ok(x,y)?SC[(y-y0)*w+x-x0]:-99,great:(x,y)=>ok(x,y)&&KF[(y-y0)*w+x-x0]===1}}
// (a road's three tones and its verge's dirt (o, 4 colours) at a pixel by the climates' covers there (cv, COVERS' order): the
//  grass's leaning toward each climate's in turn, from none at its cover GENART.rblend[0] to all at [1])
function roadPal(cv,o){const [lo,hi]=GENART.rblend,G=ROAD_RGB.grass,DG=DIRT.grass;for(let n=0;n<3;n++){o[n][0]=G[n][0];o[n][1]=G[n][1];o[n][2]=G[n][2]}o[3][0]=DG[0];o[3][1]=DG[1];o[3][2]=DG[2];
  for(let k=0;k<3;k++){const u=Math.max(0,Math.min(1,(cv[k]-lo)/(hi-lo)));if(!u)continue;const c=COVERS[k].c,R=ROAD_RGB[c],Dd=DIRT[c];for(let n=0;n<4;n++){const a=o[n],b=n<3?R[n]:Dd;a[0]+=(b[0]-a[0])*u;a[1]+=(b[1]-a[1])*u;a[2]+=(b[2]-a[2])*u}}
  return o}
// a crossing over the window (OVER_GEN): a bridge's deck from bank to bank (stone: grey courses, parapets, the arches' shade on the
// water below; wood: planks, rails, posts) on an abutment at each end (abut: the owner's fourth play-test, no wider than the deck), a ford's rocks (a few, scattered over its shallows, never in a row: 1 to 3 px, lit,
// a dark waterline under each and foam on its downstream side; capped with snow in the frost, mossy in the swamp) and a swamp
// ford's reeds at its edges, a ferry's landings, its raft and the rope across
function artGenXing(P,r,c){const ax=c.i%MW,ay=(c.i-ax)/MW,bx=c.j%MW,by=(c.j-bx)/MW,hor=ay===by,lo=hor?Math.min(ax,bx):Math.min(ay,by),hi=hor?Math.max(ax,bx):Math.max(ay,by),mid=(hor?ay:ax)*TILE+8;
  // (a rect along the crossing: from u0 to u1 along it, v0 to v1 across it, px)
  const R=(col,u0,u1,v0,v1)=>hor?r(col,u0,v0,u1-u0,v1-v0):r(col,v0,u0,v1-v0,u1-u0);
  if(c.kind==='bridge'){const u0=lo*TILE+TILE-4,u1=hi*TILE+4,hw=GENART.deck[c.stone?1:0],K=P.wk;
    // (an abutment at the deck's end e (its last row), d the way to the bank: as wide as the deck, a joint on the deck and the head
    //  over the bank (stone: lit, then its body; wood: a sill beam), its outer row ragged, drawn over land only (the shore keeps its
    //  curve to the deck))
    const AB=c.stone?['#6e665a','#c8c0ae','#9a9282','#7e7666']:['#2a1a10','#7a5432','#5a3c22','#3e2818'];
    const abut=(e,d)=>{for(let k=0;k<4;k++){const u=e-d*(1-k);for(let v=mid-hw;v<mid+hw;v++){const x=hor?u:v,y=hor?v:u;if(k>=2&&wpx(K,x,y)||k===3&&hs(x,y,c.i+91)<.4)continue;
      R(k===2&&hs(x,y,c.i+92)<.15?AB[0]:AB[k],u,u+1,v,v+1)}}};
    if(c.stone){R('#24323e',u0+4,u1-4,mid+hw,mid+hw+2);R('#a69e8e',u0,u1,mid-hw,mid+hw);
      for(let u=u0;u<u1;u++)for(let v=mid-hw+2;v<mid+hw-2;v++)if((v-mid)%3===0||(u+((v-mid+12)/3|0)*3)%6===0)R('#8e8676',u,u+1,v,v+1);
      R('#6e665a',u0,u1,mid-hw,mid-hw+2);R('#c8c0ae',u0,u1,mid-hw,mid-hw+1);R('#6e665a',u0,u1,mid+hw-2,mid+hw);R('#c8c0ae',u0,u1,mid+hw-2,mid+hw-1);
      for(let u=u0+8;u<u1-6;u+=10)R('#121c26',u,u+4,mid+hw,mid+hw+1);abut(u0,-1);abut(u1-1,1)}
    else{R('#8a6038',u0,u1,mid-hw,mid+hw);for(let u=u0;u<u1;u+=2)R('#6a4628',u,u+1,mid-hw,mid+hw);R('#3e2818',u0,u1,mid-hw-1,mid-hw);R('#3e2818',u0,u1,mid+hw,mid+hw+1);
      for(let u=u0+5;u<u1-3;u+=7){R('#2a1a10',u,u+1,mid+hw+1,mid+hw+3);R('#2a1a10',u+3,u+4,mid-hw-2,mid-hw-1)}abut(u0,-1);abut(u1-1,1)}}
  else if(c.kind==='ford'){const K=P.wk,f=P.fordOf.get(c),cl=clAt(...(hor?[(ax+bx)>>1,ay]:[ax,(ay+by)>>1])),RK=GENART.ford.rock[cl],span=(hi-lo)*TILE,at=[],h=n=>hs(c.i,c.j,n+120);
    // (up to 4 + 4 rocks for 3 tiles of its span: tried at random over the shallows, kept 5 px apart; 1 a pebble, 2 a stone, 3 a boulder)
    for(let q=0,n=0;q<48&&n<4+Math.round(span/12);q++){const u=lo*TILE+8+h(q*4)*span,v=mid+(h(q*4+1)-.5)*2*(GENART.ford.w+2),x=Math.round(hor?u:v),y=Math.round(hor?v:u),z=h(q*4+2),sw=z<.3?1:z<.75?2:3,sh=sw>1?2:1;
      if(fordAt(P,f,x,y)<.3||!wpx(K,x,y+sh)||!wpx(K,x+sw-1,y+sh)||at.some(([a,b])=>Math.abs(a-x)+Math.abs(b-y)<5))continue;at.push([x,y]);n++;
      const fl=WM.flow[(y>>4)*MW+(x>>4)]>>5,[dx,dy]=DIR8[fl]||[0,1];r(RK[0],x,y+sh,sw,1);r(RK[1],x,y,sw,sh);if(sw>1)r(RK[0],x+sw-1,y+1,1,1);r(RK[2],x,y,sw>2?2:1,1);
      if(h(q*4+3)<.6){const fx=dx>0?x+sw:dx<0?x-1:x+(sw>>1),fy=dy>0?y+sh+1:dy<0?y-1:y+(sh>>1);if(wpx(K,fx,fy))r('#e4eef4',fx,fy,1,1)}}
    // (the swamp's: reeds at the shallows' edges, in the water and on the bank)
    if(cl==='swamp'){const [c0,c1]=REED.swamp;for(let q=0;q<10;q++){const u=lo*TILE+4+h(q*3+200)*(span+8),v=mid+(h(q*3+201)<.5?-1:1)*(GENART.ford.w+2+h(q*3+202)*5),x=Math.round(hor?u:v),y=Math.round(hor?v:u),sa=fordAt(P,f,x,y);
      if(sa<.02||sa>.45||P.clear.at(x,y))continue;r(c0,x,y-2,1,3);r(c1,x,y-2,1,1);if(h(q*3+203)<.6){r(c0,x+1,y-1,1,2);r(c1,x+1,y-1,1,1)}}}}
  else{const dir=hi===(hor?bx:by)?1:-1,ends=[[c.i,dir],[c.j,-dir]],tip=[];
    for(const [t,d] of ends){const e=hor?t%MW:(t/MW|0),u0=d>0?e*TILE+TILE-3:e*TILE+3-9,u1=u0+9;R('#7a5432',u0,u1,mid-3,mid+3);for(let u=u0;u<u1;u+=2)R('#5a3c22',u,u+1,mid-3,mid+3);
      R('#2a1a10',d>0?u1-1:u0,d>0?u1:u0+1,mid-4,mid-3);R('#2a1a10',d>0?u1-1:u0,d>0?u1:u0+1,mid+3,mid+5);tip.push(d>0?u1:u0)}
    const [p,q]=tip[0]<tip[1]?tip:[tip[1],tip[0]];for(let u=p+1;u<q;u+=2)R('#d8c890',u,u+1,mid-5,mid-4);
    const rf=dir>0?tip[0]+1:tip[0]-12;R('#3e2818',rf,rf+11,mid-1,mid+6);R('#9a6e42',rf+1,rf+10,mid,mid+5);for(let u=rf+2;u<rf+10;u+=3)R('#6a4628',u,u+1,mid,mid+5);R('#2a1a10',rf+5,rf+6,mid-4,mid)}}
const REED={grass:['#4e7a34','#8aac52'],frost:['#9a9478','#c8c0a0'],desert:['#7a8040','#b0aa62'],swamp:['#4a5a2c','#7e8a42']};
const OVER_GEN=[
  // reeds and stones on the river banks (land beside a river tile, never in the water, not a pixel of them, or on clear ground)
  (P,r,tx0,ty0,tx1,ty1)=>{const K=P.wk;
    for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const i=ty*MW+tx;if(K[i]||tiles[i]===T_MOUNT)continue;const X=tx*TILE,Y=ty*TILE,[c0,c1]=REED[clAt(tx,ty)];
      for(const [a,b] of [[0,-1],[0,1],[-1,0],[1,0]]){const u=tx+a,v=ty+b;if(u<0||v<0||u>=MW||v>=MH||K[v*MW+u]!==2)continue;
        for(let k=0;k<4;k++){const h=n=>hs(tx*4+k,ty*4+a+2*b+2,n+80),al=2+Math.floor(h(1)*12),of=1+Math.floor(h(2)*3),x=b?X+al:a<0?X+of:X+TILE-1-of,y=a?Y+al:b<0?Y+of+2:Y+TILE-1-of;
          let wet=false;for(let b=-2;b<=1&&!wet;b++)for(let a=0;a<=1;a++)if(wpx(K,x+a,y+b)){wet=true;break}if(wet||P.clear.at(x,y))continue;
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
  yield* groundSteps(P,D,x0,y0,ww,wh,{x:X,y:Y,w,h});
  for(const t of P.tramples)trample(P,D,x0,y0,ww,wh,t);
  const road=P.gen?yield* artGenRoads(P,D,x0,y0,ww,wh):null;
  const TO=NT?new Uint8Array(ww*wh):null;
  rec.n=yield* PX.worldNatureSteps(P.nature,{x:x0,y:y0,w:ww,h:wh,inner:{x:X,y:Y,w,h},road},D,TO);
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
      const N={trees:0,fen:0,hills:0,peaks:0,decor:0,flat:0,rock:0,ms:0},tm={};for(const c of this.cnt.values()){for(const q in N)N[q]+=q==='ms'?c.n.ms:c.n[q];for(const q in c.n.tm)tm[q]=(tm[q]||0)+c.n.tm[q]}
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
