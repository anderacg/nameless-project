'use strict';
/* ---------- the map's ground from stored pieces (the owner, 2026-11-24: "would it better if we skip those drawing by using tileset
   concept? Just store curve and edge, hill and all as variants so we can capture biomes current possible tiles"; data/world.js
   TILE_GROUND): a quicker painter for a chunk (worldart.js paintSteps), the same inputs and the same records as terrainChunk's
   (worldterrain.js), its look the same palettes', its work a lookup a px:
   - each ground (TERK: grass, meadow, a wood's floor, sand, wet sand, dunes, bank, scree, rock, snow) and the water's depths, in each
     climate: a texture painted once (TileSet: the lab's tones, grain and decor, seamless, period px square), read by the px's world
     place, so no seam where one tile meets the next;
   - each tile's corner its ground (by the same rules as terLand: height, slope, the water's distance, the woods, the meadows), the
     grounds between them laid by a B-spline over the corners, the higher over the lower, their edge ragged by a stored noise (the
     pattern's own, world-placed: the same edge from both sides);
   - the land's lift as the lab draws it (its levels at the corners, stepped where steep), its faces from stored strips (earth, rock,
     sand by noise looked up, never computed); the rivers and roads along their curves (worldways.js waysBand), their colours stored
     too. What is not drawn here: a river's moving current and falls' spray (rec.flow, rec.falls: none), a ford's gravel bar ----- */
class TileSet{
  constructor(){const TG=TILE_GROUND;this.P=TG.period;this.N=TG.noise;this.tex=new Map();this.nt=null;this.face=new Map()}
  // (a seamless picture P x P from f(x, y) -> rgb: painted P + B square, its first B rows and columns crossing over to the far side
  //  by a dither, so its right edge runs on into its left and its foot into its head)
  seam(f,seed){const P=this.P,B=TILE_GROUND.cross,S=P+B,R=new Uint8ClampedArray(S*S*3),O=new Uint8ClampedArray(P*P*3);
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const c=f(x,y),o=(y*S+x)*3;R[o]=c[0];R[o+1]=c[1];R[o+2]=c[2]}
    for(let y=0;y<P;y++)for(let x=0;x<P;x++){const sx=x<B&&hs(x,y,seed)>x/B?x+P:x,sy=y<B&&hs(x,y,seed+1)>y/B?y+P:y,o=(sy*S+sx)*3,q=(y*P+x)*3;O[q]=R[o];O[q+1]=R[o+1];O[q+2]=R[o+2]}
    return O}
  // (the noise the edges and faces read, N x N, seamless: two octaves and a grain, the lab's shore's)
  noise(){if(this.nt)return this.nt;const N=this.N,A=new Float32Array(N*N),f=(x,y)=>wnoise2(x/9,y/9,571)*.6+wnoise2(x/3.5,y/3.5,572)*.25+hs(x,y,573)*.15;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/N,v=y/N;A[y*N+x]=f(x,y)*(1-u)*(1-v)+f(x-N,y)*u*(1-v)+f(x,y-N)*(1-u)*v+f(x-N,y-N)*u*v}
    let lo=1,hi=0;for(const v of A){if(v<lo)lo=v;if(v>hi)hi=v}for(let k=0;k<A.length;k++)A[k]=(A[k]-lo)/(hi-lo||1);return this.nt=A}
  // a ground's texture in a climate (k: TERK, or TG_WATER + a depth band; river: a river's water), made when first asked
  get(ci,k){const key=ci*64+k;let t=this.tex.get(key);if(!t){const river=k>=TG_RIVER;t=this.seam((x,y)=>this.col(ci,river?k-8:k,river,x,y),601+key);this.tex.set(key,t)}return t}
  // (a px's colour of ground k in climate ci at fine px (x, y): terLand's colours, its climate's grain and its small things)
  col(ci,k,river,x,y){const Q=terrainPal()[ci],cl=CLIMS[ci],T=WORLD_TERRAIN,DC=T.decor,W=TILE_GROUND.water;
    if(k>=TG_WATER){const b=k-TG_WATER,d=W.band[b],S=river?Q.river:Q.sea;
      if(cl==='frost'&&!river&&b===0){let c=tpick(Q.ice,x,y,372);if(Math.abs(wnoise2(x/10,y/10,373)-.5)<.018)c=tmul(c,.86);return c}
      let c=d<.4?tmix(S[0],S[1],d/.4):d<1?tmix(S[1],S[2],(d-.4)/.6):tmix(S[2],S[3],Math.min(1,d-1));const bed=river?Q.pebble[Math.floor(hs(x>>1,y>>1,374)*4)]:Q.bed[Math.sin(x*.35+y*.12+wnoise2(x/12,y/12,375)*6)>.55?0:1],
        a=Math.pow(Math.max(0,1-d/(river?.55:T.clear)),1.4);c=tmix(c,bed,a*.8);if(a>.15&&wnoise2(x/3,y/3,376)>.74)c=tmix(c,[232,246,246],.22*a);
      if(river&&d>.3&&wnoise2(x/9,y/2.5,519)>.8)c=tmix(c,Q.fall[1],.18);return c}
    const q=hs(x,y+1,580),q2=hs(x,y+2,580);let c;
    switch(k){
      case TERK.snow:c=tpick(Q.snow,x,y,345);break;
      case TERK.rock:{c=tpick(Q.rock.slice(0,3),x,y,346);if(wnoise2(x/14,y/14,347)>.62)c=tmix(c,Q.grass[0],.5);if(q<.03)c=Q.scree[1];break}
      case TERK.scree:c=tmix(tpick(Q.scree,x,y,348),Q.grass[0],hs(x>>2,y>>2,349)<.3?.4:0);if(q<.03)c=Q.scree[0];break;
      case TERK.wet:c=tpick(Q.wet,x,y,350);break;
      case TERK.sand:c=tpick(Q.sand,x,y,351);if(hs(x,y,580)<.012)c=DC.shell;break;
      case TERK.dune:c=tmix(tpick(Q.sand,x,y,352),Q.dune[hs(x,y,353)<.5?0:1],.45);if(q<.05)c=DC.marram[1];else if(q2<.03)c=DC.marram[0];break;
      case TERK.bank:c=tmix(tpick(Q.mud,x,y,354),Q.grass[0],.5);break;
      case TERK.wood:c=tpick(Q.wood,x,y,355);if(q<.012)c=DC.litter[Math.floor(hs(x,y+1,584)*3)];else if(q<.03)c=tmul(Q.wood[0],.7);break;
      case TERK.oasis:c=tpick(terrainPal()[0].grass,x,y,357);break;
      case TERK.meadow:c=tpick(Q.meadow,x,y,356);if(q<.05&&q>=.03)c=DC.flower[Math.floor(hs(x,y+1,581)*4)];else if(q<.03)c=tmul(Q.grass[q<.012?0:1],.72);break;
      default:c=tpick(Q.grass,x,y,357);if(q<.03)c=tmul(Q.grass[q<.012?0:1],.72);else if(q2<.015)c=tmul(Q.grass[0],.62)}
    if(cl==='desert'&&(k===TERK.grass||k===TERK.dune))c=tmul(c,1+.05*Math.sin(x*.3+y*.85+wnoise2(x/20,y/20,358)*7));
    else if(cl==='frost'&&(k===TERK.grass||k===TERK.meadow)){const a=snowDrift(x,y);if(a>0){const sd=wnoise2(x/T.snowPatch.shade,y/T.snowPatch.shade,366);c=tmix(c,sd<.45?tmix(Q.meadow[2],Q.meadow[0],sd/.45):tmix(Q.meadow[0],Q.meadow[1],Math.min(1,(sd-.45)/.4)),a)}}
    else if(cl==='swamp'&&k===TERK.meadow&&wnoise2(x/5,y/5,364)>.72)c=tmix(c,[120,136,130],.35);
    return c}
}
// (whether the stored pieces paint the map: TILE_GROUND.on, or the page's ?tiles)
function tileGroundOn(){const q=typeof location!=='undefined'&&/[?&]tiles(=([01]))?/.exec(location.search);if(q)return q[2]!=='0';const o=TILE_GROUND.on;
  return o==='phone'?typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches:!!o}
const TG_WATER=16,TG_RIVER=24;// (a water texture's k: TG_WATER (still water) or TG_RIVER (a river's) + its depth band)
const TILES=new TileSet();
// (a ground's rank among those laid over each other: the water lowest, the shore's, the land's, the heights' over all)
const TG_RANK=(()=>{const R=new Uint8Array(32),o=[TG_WATER,TG_RIVER,TERK.wet,TERK.sand,TERK.dune,TERK.bank,TERK.oasis,TERK.grass,TERK.meadow,TERK.wood,TERK.scree,TERK.rock,TERK.snow];o.forEach((k,i)=>R[k]=i);return R})();
// (a corner's ground, terLand's choice without its colour)
function tgKind(ci,e,g,dd,wd,fx,fy){const T=WORLD_TERRAIN,wob=wnoise2(fx/50,fy/50,341)-.5,dw=dd*2;
  if(e>=T.rock+wob*3||g>=T.cliffG)return e>=T.snow+wob*2.4&&g<T.cliffG?TERK.snow:TERK.rock;
  if(g>=T.steepG&&e>2)return TERK.scree;
  if(dw<T.wet+wob*4)return TERK.wet;if(dw<T.sand+wob*12&&e<1.2)return TERK.sand;if(dw<T.dune+wob*20&&e<1.6&&CLIMS[ci]!=='swamp')return TERK.dune;
  if(wd>.5)return TERK.wood;return meadowShare(fx,fy)>=.5?TERK.meadow:TERK.grass}

// the chunk X, Y, w x h (game px) painted r times finer into rec.fcv: terrainChunk's inputs and records (rec.fcv, fr, wet, shd, lift,
// dep, shore, flow, props, grass), from the stored pieces
function* tileChunk(rec,P,F,G,KP,X,Y,w,h,HE,x0,y0,ww,r){
  const T=WORLD_TERRAIN,TG=TILE_GROUND,PAL=terrainPal(),LV=WM.lv||(WM.lv=reliefOf(WM)),LH=landHeight(WM),WY=waysOf(P),WV=WORLD_WAYS,Rv=WM.river,k2=r/2,TS=16,R2=TS*r;
  const W2=w*r,H2=h*r,HE2=HE*r,PS=TILES.P,PM=PS-1,NT=TILES.noise(),NN=TILES.N,NM=NN-1,nz=(x,y)=>NT[(y&NM)*NN+(x&NM)];
  const ow=ti=>tiles[ti]===T_WATER&&(!(Rv[ti]&3)||WY.mouth[ti]),tAt=(tx,ty)=>Math.max(0,Math.min(MH-1,ty))*MW+Math.max(0,Math.min(MW-1,tx));
  // (a wide river's tiles (two tiles or more: its water the tiles', its banks smooth, as terrainChunk's), kept with the ways)
  if(!WY.WR){const A=WY.WR=new Uint8Array(MW*MH),B=WY.WRN=new Uint8Array(MW*MH);for(let i=0;i<MW*MH;i++)A[i]=tiles[i]===T_WATER&&(Rv[i]&3)>=2&&!WY.mouth[i]?1:0;
    for(let i=0;i<MW*MH;i++){if(!A[i])continue;const x=i%MW,y=(i-x)/MW;for(let b=-3;b<=3;b++)for(let a=-3;a<=3;a++){const u=x+a,v=y+b;if(u>=0&&v>=0&&u<MW&&v<MH)B[v*MW+u]=1}}}
  const WR=WY.WR,wat=ti=>ow(ti)||WR[ti]===1;
  // (the corners: their tiles from two west and north of the chunk to three past it, as far south as its lift reaches)
  const A0=Math.floor(X/TS)-2,B0=Math.floor(Y/TS)-2,CA=Math.ceil(w/TS)+6,CB=Math.ceil(HE/TS)+6,NC=CA*CB;
  // (each tile's distance to open water (the beach's: a river's banks are its own) and any water's to the land, tiles (chamfers over a
  //  margin as far as the dunes reach))
  const M=Math.ceil(T.dune/2/TS)+2,DA=CA+2*M,DB=CB+2*M,TD=new Float32Array(DA*DB),TL=new Float32Array(DA*DB);
  const cham=D=>{for(let b=0;b<DB;b++)for(let a=0;a<DA;a++){const q=b*DA+a;let d=D[q];if(!d)continue;if(a)d=Math.min(d,D[q-1]+1);if(b){d=Math.min(d,D[q-DA]+1);if(a)d=Math.min(d,D[q-DA-1]+1.414);if(a<DA-1)d=Math.min(d,D[q-DA+1]+1.414)}D[q]=d}
    for(let b=DB-1;b>=0;b--)for(let a=DA-1;a>=0;a--){const q=b*DA+a;let d=D[q];if(!d)continue;if(a<DA-1)d=Math.min(d,D[q+1]+1);if(b<DB-1){d=Math.min(d,D[q+DA]+1);if(a<DA-1)d=Math.min(d,D[q+DA+1]+1.414);if(a)d=Math.min(d,D[q+DA-1]+1.414)}D[q]=d}};
  for(let b=0;b<DB;b++)for(let a=0;a<DA;a++){const tx=A0-M+a,ty=B0-M+b,inM=tx>=0&&ty>=0&&tx<MW&&ty<MH,i=ty*MW+tx;TD[b*DA+a]=inM&&ow(i)?0:1e6;TL[b*DA+a]=inM&&wat(i)?1e6:0}
  cham(TD);cham(TL);
  const tdm=(D,tx,ty)=>{const q=(ty-B0+M)*DA+tx-A0+M;return Math.min(D[q-DA-1],D[q-DA],D[q-1],D[q])};
  /* (each corner: its height (levels), its water's level (-1 land), its ground's key (climate x 32 + ground) and rank, its water's depth
     and the land's distance to the water (game px)) */
  const CE=new Float32Array(NC),CW=new Float32Array(NC),CK=new Uint8Array(NC),CR=new Uint8Array(NC),CD=new Float32Array(NC),CP=new Float32Array(NC);
  for(let b=0;b<CB;b++){for(let a=0;a<CA;a++){const tx=A0+a,ty=B0+b,gx=tx*TS,gy=ty*TS,c=b*CA+a;let n=0,nr=0,wl=1e9;
      for(let q=-1;q<=0;q++)for(let p=-1;p<=0;p++){const i=tAt(tx+p,ty+q);if(WR[i])nr++;if(wat(i)){n++;wl=Math.min(wl,LV[i])}}
      const wet=n>2||n===2&&hs(tx,ty,611)<.5,ci=terClimate(gx,gy);CE[c]=Math.max(0,LH(gx*2,gy*2));CW[c]=wet?wl:-1;
      CD[c]=wet?0:Math.max(0,tdm(TD,tx,ty)-.5)*TS;
      let k;if(wet){const dl=Math.max(0,tdm(TL,tx,ty)-.5)*TS;k=nr*2>=n?TG_RIVER:TG_WATER;CP[c]=k===TG_RIVER?Math.min(1.4,dl*.14):Math.min(terDepth(P,gx,gy)*T.depth*2,dl*.09)}
      else k=nr?-2:-1;CK[c]=ci*32+(k<0?0:k);CR[c]=k===-2?255:k<0?0:TG_RANK[k]*4}
    yield}
  /* (the land's heights on a grid finer than the tiles (TG.hs game px), so its relief keeps its small rises; each node's step share by
     its slope, as terrainChunk's) */
  const HS=TG.hs,HX0=X-2*HS,HY0=Y-2*HS,HA=Math.ceil(w/HS)+5,HB=Math.ceil(HE/HS)+5,HE_=new Float32Array(HA*HB),HSW=new Float32Array(HA*HB);
  for(let j=0;j<HB;j++){for(let i=0;i<HA;i++)HE_[j*HA+i]=Math.max(0,LH((HX0+i*HS)*2,(HY0+j*HS)*2));if(!(j&15))yield}
  for(let j=0;j<HB;j++)for(let i=0;i<HA;i++){const q=j*HA+i,ex=(HE_[j*HA+Math.min(HA-1,i+1)]-HE_[j*HA+Math.max(0,i-1)])/(2*HS),ey=(HE_[Math.min(HB-1,j+1)*HA+i]-HE_[Math.max(0,j-1)*HA+i])/(2*HS),g=Math.hypot(ex,ey),s=Math.max(0,Math.min(1,(g-T.steps.from)/(T.steps.to-T.steps.from)));HSW[q]=s*s*(3-2*s)}
  // (each land corner's ground, by its slope on that grid)
  for(let b=0;b<CB;b++)for(let a=0;a<CA;a++){const c=b*CA+a;if(CW[c]>=0)continue;const bank=CR[c]===255,gx=(A0+a)*TS,gy=(B0+b)*TS,ci=CK[c]>>5,i=Math.max(1,Math.min(HA-2,Math.round((gx-HX0)/HS))),j=Math.max(1,Math.min(HB-2,Math.round((gy-HY0)/HS)));
    const g=Math.hypot((HE_[j*HA+i+1]-HE_[j*HA+i-1])/(2*HS),(HE_[(j+1)*HA+i]-HE_[(j-1)*HA+i])/(2*HS)),k0=tgKind(ci,CE[c],g,CD[c],terWood(WY.land,gx,gy),gx*r,gy*r),k=bank&&k0!==TERK.rock&&k0!==TERK.snow&&k0!==TERK.scree?TERK.bank:k0;CK[c]=ci*32+k;CR[c]=TG_RANK[k]*4+ci}
  yield;
  // (each tile's grounds: those of its sixteen corners, highest first, with their keys; one alone, the tile is that ground)
  const CN=new Uint8Array(NC),CC=new Uint8Array(NC*16),CY=new Uint8Array(NC*16),CMK=new Uint16Array(NC*16),TX=[];
  for(let b=1;b<CB-2;b++)for(let a=1;a<CA-2;a++){const cell=b*CA+a,c0=cell-CA-1,o=cell*16;let n=0;
    for(let q=0;q<4;q++)for(let p=0;p<4;p++){const c=c0+q*CA+p,rk=CR[c];let s=0;for(;s<n;s++)if(CC[o+s]===rk)break;if(s===n){CC[o+n]=rk;CY[o+n]=CK[c];n++}}
    for(let s=0;s<n;s++)for(let t=s+1;t<n;t++)if(CC[o+t]>CC[o+s]){let x=CC[o+s];CC[o+s]=CC[o+t];CC[o+t]=x;x=CY[o+s];CY[o+s]=CY[o+t];CY[o+t]=x}
    CN[cell]=n;for(let s=0;s<n;s++){const ky=CY[o+s],k=ky&31;if(k<TG_WATER&&!TX[ky])TX[ky]=TILES.get(ky>>5,k);let m=0;for(let q=0;q<4;q++)for(let p=0;p<4;p++)if(CR[c0+q*CA+p]>=CC[o+s])m|=1<<(q*4+p);CMK[o+s]=m}}
  // (the rivers' and the roads' bands at fine px, as terrainChunk's)
  const bankF=WV.river.bank*k2,edgeF=WV.road.edge*k2,varyF=WV.road.hw[1]*WV.road.vary*k2,shG=WV.road.sh*WAY_LP,RDR=edgeF+varyF;
  const RF=yield* waysBand(WY.SA,X*r,Y*r,W2,HE2,r,bankF+2),DF=yield* waysBand(WY.RA,X*r,Y*r,W2,HE2,r,RDR+2),DG=yield* waysBand(WY.RA,X,Y,w,HE,1,shG+1);
  bridgeOpen(WY.bridges,DF,X*r,Y*r,W2,HE2,r,(edgeF+varyF)/r);
  // (what the game painted over the ground (yards, trampled patches), by game px)
  const OV=new Uint8Array(w*HE);for(let y=0;y<HE;y++)for(let x=0;x<w;x++){const fo=(y*w+x)*4,go=((Y+y-y0)*ww+X+x-x0)*4;OV[y*w+x]=F[fo]!==G[go]||F[fo+1]!==G[go+1]||F[fo+2]!==G[go+2]?1:0}
  // (the B-spline's weights for a fine px's place in its tile)
  const BW=new Float32Array(R2*4);for(let i=0;i<R2;i++)BW.set(labBS((i+.5)/R2),i*4);
  // (a row of four corners' share at each place across the tile, by which of them are in: 16 masks)
  const RS=new Float32Array(16*R2);for(let m=0;m<16;m++)for(let i=0;i<R2;i++){let t=0;for(let p=0;p<4;p++)if(m>>p&1)t+=BW[i*4+p];RS[m*R2+i]=t}
  // (the water's stored bands, by climate: still water's and a river's)
  const WTX=[],WBD=TG.water.band;for(let ci=0;ci<4;ci++)for(let b=0;b<3;b++){WTX[ci*6+b]=TILES.get(ci,TG_WATER+b);WTX[ci*6+3+b]=TILES.get(ci,TG_RIVER+b)}
  const wcol=(ci,riv,d,to)=>{const base=ci*6+(riv?3:0);let lo=0,t=0;if(d<=WBD[0]){lo=0;t=0}else if(d<WBD[1]){lo=0;t=(d-WBD[0])/(WBD[1]-WBD[0])}else if(d<WBD[2]){lo=1;t=(d-WBD[1])/(WBD[2]-WBD[1])}else{lo=2;t=0}
    const A=WTX[base+lo],B=t>0?WTX[base+lo+1]:A;cl[0]=A[to]+(B[to]-A[to])*t;cl[1]=A[to+1]+(B[to+1]-A[to+1])*t;cl[2]=A[to+2]+(B[to+2]-A[to+2])*t};
  // the tops: each fine px its ground's stored colour, the land's height (LFF), water (WK 1 still, 2 a river), shade
  const BF=TILES.bufs(W2*HE2,W2*H2,rec),CO=BF.CO,WK=BF.WK,LFF=BF.LFF,SF=BF.SF;WK.fill(0);
  const cl=[0,0,0],RAG=TG.rag,LP=T.shore.lip,lh=T.lh,SB=T.steps.band,BM=WV.road.biome,RIM=T.water.rim,rd0=TILES.road(0),rd1=TILES.road(1),bankT=[0,1,2,3].map(ci=>TILES.get(ci,TERK.bank));
  for(let fy=0;fy<HE2;fy++){const ay=Y*r+fy,gy=Y+((fy/r)|0),ty=Math.floor(ay/R2),v=ay-ty*R2,b=ty-B0,by=v*4,fv=(v+.5)/R2,row=(ay&PM)*PS*3,hy=((ay+.5)/r-HY0)/HS,hj=Math.floor(hy),hv=hy-hj,nrow=(ay&NM)*NN;
    for(let fx=0;fx<W2;fx++){const ax=X*r+fx,tx=Math.floor(ax/R2),u=ax-tx*R2,a=tx-A0,fi=fy*W2+fx,o3=fi*3,cell=b*CA+a,n=CN[cell],o16=cell*16,to=row+(ax&PM)*3;
      // (its ground: the highest of its tile's grounds whose share of the sixteen corners reaches the ragged edge's threshold)
      let ky=CY[o16+n-1];if(n>1){const th=.5+(NT[nrow+(ax&NM)]-.5)*RAG;
        for(let s=0;s<n-1;s++){const m=CMK[o16+s],f=RS[(m&15)*R2+u]*BW[by]+RS[(m>>4&15)*R2+u]*BW[by+1]+RS[(m>>8&15)*R2+u]*BW[by+2]+RS[(m>>12)*R2+u]*BW[by+3];if(f>=th){ky=CY[o16+s];break}}}
      const ci=ky>>5,k=ky&31,fu=(u+.5)/R2;let wet=k>=TG_WATER,shade=!wet,riv=false;
      // (its height: the grid's four nodes round it, bilinear; stepped by their share where steep)
      const hx=((ax+.5)/r-HX0)/HS,hi=Math.floor(hx),hu=hx-hi,h0=hj*HA+hi,e00=HE_[h0],e10=HE_[h0+1],e01=HE_[h0+HA],e11=HE_[h0+HA+1];
      let e=(e00*(1-hu)+e10*hu)*(1-hv)+(e01*(1-hu)+e11*hu)*hv,sw=(HSW[h0]*(1-hu)+HSW[h0+1]*hu)*(1-hv)+(HSW[h0+HA]*(1-hu)+HSW[h0+HA+1]*hu)*hv;
      const dex=((e10-e00)*(1-hv)+(e11-e01)*hv)/HS,dey=((e01-e00)*(1-hu)+(e11-e10)*hu)/HS;
      if(wet){const k00=b*CA+a;let wl=1e9;if(CW[k00]>=0)wl=CW[k00];if(CW[k00+1]>=0&&CW[k00+1]<wl)wl=CW[k00+1];if(CW[k00+CA]>=0&&CW[k00+CA]<wl)wl=CW[k00+CA];if(CW[k00+CA+1]>=0&&CW[k00+CA+1]<wl)wl=CW[k00+CA+1];
        e=wl<1e8?wl:e;sw=0;riv=k===TG_RIVER;WK[fi]=riv?2:1;
        let d=0;{const c0=k00-CA-1,bx=u*4;for(let q=0;q<4;q++){const cq=c0+q*CA;d+=(CP[cq]*BW[bx]+CP[cq+1]*BW[bx+1]+CP[cq+2]*BW[bx+2]+CP[cq+3]*BW[bx+3])*BW[by+q]}}
        const c0=CK[k00]>>5,c1=CK[k00+1]>>5,c2=CK[k00+CA]>>5,c3=CK[k00+CA+1]>>5;
        if(c0===c1&&c0===c2&&c0===c3)wcol(c0,riv,d,to);else{const ws=[(1-fu)*(1-fv),fu*(1-fv),(1-fu)*fv,fu*fv],cs=[c0,c1,c2,c3];let r0=0,g0=0,b0=0;for(let q=0;q<4;q++){wcol(cs[q],riv,d,to);r0+=cl[0]*ws[q];g0+=cl[1]*ws[q];b0+=cl[2]*ws[q]}cl[0]=r0;cl[1]=g0;cl[2]=b0}
        if(d<RIM*.03&&NT[nrow+((ax*3)&NM)]>.55+d*8){const fm=PAL[ci].foam;cl[0]+=(fm[0]-cl[0])*.45;cl[1]+=(fm[1]-cl[1])*.45;cl[2]+=(fm[2]-cl[2])*.45}}
      else{const tex=TX[ky];cl[0]=tex[to];cl[1]=tex[to+1];cl[2]=tex[to+2]}
      // (a river's curve: its water by its depth down the middle, its foam at the banks, its surface; its muddy bank eased to it)
      const rs=RF.S[fi];
      if(rs<0&&WK[fi]!==1){const sg=RF.Q[fi],aa=WY.SP[sg],tt=RF.T[fi],hw=(WY.HW[aa]+(WY.HW[aa+1]-WY.HW[aa])*tt)*r,qq=Math.min(1,(rs+hw)/hw),dp=WY.DP[aa]+(WY.DP[aa+1]-WY.DP[aa])*tt;
        if(!riv){wcol(ci,true,dp*(1-qq*qq)+.04,to);if(-rs<RIM*r*.6&&NT[nrow+((ax*3)&NM)]>.55){const fm=PAL[ci].foam;cl[0]+=(fm[0]-cl[0])*.5;cl[1]+=(fm[1]-cl[1])*.5;cl[2]+=(fm[2]-cl[2])*.5}}
        e=Math.max(0,riverLevel(WY,aa,tt));wet=riv=true;shade=false;WK[fi]=2;sw=0}
      else if(!wet&&rs<bankF){const sv=riverLevel(WY,WY.SP[RF.Q[fi]],RF.T[fi])+.3,tb=rs/bankF;e=sv+(e-sv)*wsm(tb);sw=0;
        const mt=bankT[ci],m=tb<.45?1-tb/.45:0;cl[0]=cl[0]*.86+(mt[to]-cl[0]*.86)*m;cl[1]=cl[1]*.86+(mt[to+1]-cl[1]*.86)*m;cl[2]=cl[2]*.86+(mt[to+2]-cl[2]*.86)*m}
      // (what the game painted over it (yards, trampled patches): its colour, a grain kept, its edge ragged)
      if(!wet){const gx=(fx/r)|0,oy=gy-Y;if(OV[oy*w+gx]&&NT[((ay+37)&NM)*NN+((ax+91)&NM)]<.86){const fo=(oy*w+gx)*4,gr=1+(hs(ax,ay,588)-.5)*T.over.grain;cl[0]=F[fo]*gr;cl[1]=F[fo+1]*gr;cl[2]=F[fo+2]*gr}}
      // (a road: its crown and loose sides stored, the land's colour through it by its climate, its edge ragged; its grade)
      const kg=(gy-Y)*w+((fx/r)|0),dg=DG.S[kg];if(!wet&&dg<shG){const sg=DG.Q[kg],rz=WY.RZ[sg*2]+(WY.RZ[sg*2+1]-WY.RZ[sg*2])*DG.T[kg];e=dg<0?rz:rz+(e-rz)*wsm(dg/shG);sw=0}
      const ds=DF.S[fi];
      if(!wet&&ds<RDR){const sg=DF.Q[fi],hwR=WY.RA[sg*6+4]*r;
        if(ds+(NT[((ay+13)&NM)*NN+((ax+57)&NM)]-.5)*2*edgeF<0){const rt=ds+hwR<hwR*.72?rd0:rd1,m=BM.mix[ci];cl[0]=rt[to]+(cl[0]-rt[to])*m;cl[1]=rt[to+1]+(cl[1]-rt[to+1])*m;cl[2]=rt[to+2]+(cl[2]-rt[to+2])*m}}
      LFF[fi]=wet?Math.max(0,Math.round(e*lh)-(riv?LP:0)):Math.max(0,Math.round((e+(Math.floor(e/SB)*SB-e)*sw)*lh));
      SF[fi]=sw;const s=shade?1+Math.max(-.16,Math.min(.12,(-dex-.6*dey)*lh*T.shade/r)):1;CO[o3]=cl[0]*s;CO[o3+1]=cl[1]*s;CO[o3+2]=cl[2]*s}
    if(!(fy&15))yield}
  /* the land drawn lifted, as terrainChunk's: column by column north to south, each top up the screen by its lift, the nearer over the
     farther; where the next px's top lies lower its south face fills down to it (a stored strip: earth, rock or sand; water falling
     white), the lip lit, the foot shaded */
  const out=new ImageData(W2,H2),O=out.data,DEPF=BF.DEPF.fill(-1),TOP=BF.TOP.fill(0),SH=[],SR=[],RM=T.rim,FC=T.face;
  for(let fx=0;fx<W2;fx++){const ax=X*r+fx;let first=-1;
    for(let fy=0;fy<HE2;fy++){const fi=fy*W2+fx,L=LFF[fi],wt=WK[fi],sy=fy-L,ci3=fi*3;
      if(sy>=0&&sy<H2){const o=(sy*W2+fx)*4;let s=1;const fp=fy>0?fi-W2:fi,fq=fy>1?fi-2*W2:fi;
        if(LFF[fp]>L+3&&!wt)s=.78;else if(LFF[fq]>L+3&&!wt)s=.9;
        else if(!wt){if(fp!==fi&&LFF[fp]<L-RM.drop&&!WK[fp])s=RM.north;else{const fw=fx>0?fi-1:fi,fe=fx<W2-1?fi+1:fi;if(fw!==fi&&LFF[fw]<L-RM.drop&&!WK[fw]||fe!==fi&&LFF[fe]<L-RM.drop&&!WK[fe])s=RM.side}}
        O[o]=CO[ci3]*s;O[o+1]=CO[ci3+1]*s;O[o+2]=CO[ci3+2]*s;O[o+3]=255;DEPF[sy*W2+fx]=fy;TOP[sy*W2+fx]=1;if(first<0)first=sy;
        if(wt===1&&(fx>0&&!WK[fi-1]||fx<W2-1&&!WK[fi+1]||fy>0&&!WK[fi-W2]||fy<HE2-1&&!WK[fi+W2])){SH.push(fx,sy,(nz(ax,fy)*1900)|0);SR.push(fy)}}
      if(fy+1>=HE2)continue;const fN=fi+W2,LN=LFF[fN],syN=fy+1-LN;if(syN<=sy+1)continue;const n=syN-sy-1,wetB=WK[fN];
      // (a small drop on smooth ground, or water onto water: no face, this top shading into the next)
      if(n<=3&&(SF[fi]<.5&&SF[fN]<.5||wt&&wetB)){const c2=fN*3;for(let dz=1;dz<=n;dz++){const yy=sy+dz;if(yy<0||yy>=H2)continue;const f=dz/(n+1),o=(yy*W2+fx)*4;
          O[o]=CO[ci3]+(CO[c2]-CO[ci3])*f;O[o+1]=CO[ci3+1]+(CO[c2+1]-CO[ci3+1])*f;O[o+2]=CO[ci3+2]+(CO[c2+2]-CO[ci3+2])*f;O[o+3]=255;DEPF[yy*W2+fx]=fy;TOP[yy*W2+fx]=1}continue}
      const ty=Math.floor((Y*r+fy)/R2),tx=Math.floor(ax/R2),cc=(ty-B0)*CA+tx-A0,ci=CK[cc]>>5,Q=PAL[ci],lv=L/lh,snowy=lv>=T.snow-1,rock=n>FC.rockN[1]*lh||lv>T.rock-.6||nz(ax+11,fy)<sst(n,FC.rockN[0]*lh,FC.rockN[1]*lh),sand=!rock&&lv<FC.sand[0];
      if(sy>=0&&sy<H2&&!wt){const o=(sy*W2+fx)*4;if(snowy){O[o]=242;O[o+1]=246;O[o+2]=252}else{O[o]=Math.min(255,O[o]*1.12);O[o+1]=Math.min(255,O[o+1]*1.12);O[o+2]=Math.min(255,O[o+2]*1.12)}}
      const ft=TILES.faceOf(ci,wt&&wetB?3:rock?1:sand?2:0),fall=wt&&wetB,ov=fall?0:Math.min(rock?FC.overRock:9,Math.floor(NT[((fy>>3)&NM)*NN+((ax>>1)&NM)]*(FC.over+1))),low=n<=FC.low?FC.lowK*(1-(n-2)/(2*FC.low)):0;
      for(let dz=1;dz<=n;dz++){const yy=sy+dz;if(yy<0)continue;if(yy>=H2)break;const zr=((L-dz)&63),q=(zr*PS+(ax&PM))*3,o=(yy*W2+fx)*4,f=dz/Math.max(1,n);
        if(dz<=ov){const k=FC.overK-.06*dz;O[o]=CO[ci3]*k;O[o+1]=CO[ci3+1]*k;O[o+2]=CO[ci3+2]*k;O[o+3]=255;DEPF[yy*W2+fx]=fy;TOP[yy*W2+fx]=0;continue}
        let k=1-FC.foot*f;if(wetB&&dz>=n-1&&!wt)k*=.72;
        O[o]=ft[q]*k;O[o+1]=ft[q+1]*k;O[o+2]=ft[q+2]*k;if(low>0){O[o]+=(CO[ci3]-O[o])*low;O[o+1]+=(CO[ci3+1]-O[o+1])*low;O[o+2]+=(CO[ci3+2]-O[o+2])*low}O[o+3]=255;DEPF[yy*W2+fx]=fy;TOP[yy*W2+fx]=0;
        if(snowy&&rock&&(zr%FC.band)<1&&nz(ax,yy)<.6){O[o]=Q.snow[1][0];O[o+1]=Q.snow[1][1];O[o+2]=Q.snow[1][2]}}}
    if(first>0){const o0=(first*W2+fx)*4;for(let yy=0;yy<first;yy++){const o=(yy*W2+fx)*4;O[o]=O[o0];O[o+1]=O[o0+1];O[o+2]=O[o0+2];O[o+3]=255}}
    if(!(fx&31))yield}
  rec.fcv=mkcv(W2,H2);rec.fcv.getContext('2d').putImageData(out,0,0);rec.fr=r;
  {const o=[];for(let k=0,j=0;k<SH.length;k+=3,j++)if(DEPF[SH[k+1]*W2+SH[k]]===SR[j])o.push(SH[k],SH[k+1],SH[k+2]);rec.shore=Int16Array.from(o);rec.flow=new Int16Array(0);rec.shoreCut=0;rec.flowCut=0}
  // (the records the game reads, as terrainChunk's: each game px wet or not, its distance to the drawn land, its lift, its ground row)
  {const WE=rec.wet=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)WE[y*w+x]=WK[(y*r+(r>>1))*W2+x*r+(r>>1)];
    const SD=rec.shd=new Uint8Array(w*h),D=new Uint16Array(w*h);for(let k=0;k<w*h;k++)D[k]=WE[k]?765:0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=y*w+x;if(!D[k])continue;let v=D[k];if(x>0)v=Math.min(v,D[k-1]+3);if(y>0){v=Math.min(v,D[k-w]+3);if(x>0)v=Math.min(v,D[k-w-1]+4);if(x<w-1)v=Math.min(v,D[k-w+1]+4)}D[k]=v}
    for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const k=y*w+x;if(!D[k])continue;let v=D[k];if(x<w-1)v=Math.min(v,D[k+1]+3);if(y<h-1){v=Math.min(v,D[k+w]+3);if(x<w-1)v=Math.min(v,D[k+w+1]+4);if(x>0)v=Math.min(v,D[k+w-1]+4)}D[k]=v}
    for(let k=0;k<w*h;k++)SD[k]=Math.min(255,Math.round(D[k]/3))}
  yield;
  {const LI=rec.lift=new Int16Array(w*h),DE=rec.dep=new Int16Array(w*h).fill(-1);for(let y=0;y<h;y++)for(let x=0;x<w;x++){LI[y*w+x]=LFF[(y*r+(r>>1))*W2+x*r+(r>>1)];const d=DEPF[(y*r)*W2+x*r];DE[y*w+x]=d<0?-1:Y+((d/r)|0)}}
  // (what stands on it: terrainProps's, given its game px levels, sea and water's distance from the corners)
  const gx0=X-2,gy0=Y-2,GW=w+4,GH=HE+4,Lv=new Float32Array(GW*GH),St=new Float32Array(GW*GH),LF=new Int16Array(GW*GH),SEA=new Uint8Array(GW*GH),DW=new Float32Array(GW*GH);
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const gx=gx0+i,gy=gy0+j,tx=Math.floor(gx/TS),ty=Math.floor(gy/TS),c=(ty-B0)*CA+tx-A0,fu=(gx-tx*TS+.5)/TS,fv=(gy-ty*TS+.5)/TS,k=j*GW+i;
    const e=(CE[c]*(1-fu)+CE[c+1]*fu)*(1-fv)+(CE[c+CA]*(1-fu)+CE[c+CA+1]*fu)*fv;Lv[k]=e;St[k]=e;DW[k]=(CD[c]*(1-fu)+CD[c+1]*fu)*(1-fv)+(CD[c+CA]*(1-fu)+CD[c+CA+1]*fu)*fv;
    const fx=(gx-X)*r+(r>>1),fy=(gy-Y)*r+(r>>1);if(fx>=0&&fy>=0&&fx<W2&&fy<HE2){const q=fy*W2+fx;SEA[k]=WK[q]===1?1:0;LF[k]=LFF[q]}else LF[k]=Math.round(e*lh)}
  const at=(gx,gy)=>(gy-gy0)*GW+gx-gx0,lfAt=(jx,jy)=>{const fx=jx-X*r,fy=jy-Y*r;return fx>=0&&fy>=0&&fx<W2&&fy<HE2?LFF[fy*W2+fx]:LF[at(Math.floor(jx/r),Math.floor(jy/r))]};
  const vis=(jx,jy)=>{const L=lfAt(jx,jy),sy=jy-Y*r-L,sx=jx-X*r;return sy<0?-2:sy>=H2||sx<0||sx>=W2?-3:DEPF[sy*W2+sx]===jy-Y*r&&TOP[sy*W2+sx]?sy:-1};
  const inW=(gx,gy)=>gx>=gx0&&gy>=gy0&&gx<gx0+GW&&gy<gy0+GH;
  yield* terrainProps(rec,P,F,G,KP,X,Y,w,h,x0,y0,ww,r,vis,Lv,St,at,{RF,DF,seaT:ow,seaAt:(gx,gy)=>inW(gx,gy)&&SEA[at(gx,gy)]===1,dw:(gx,gy)=>inW(gx,gy)?DW[at(gx,gy)]:99,bankF,LF,lfAt,DEPF,W2,H2,PL:new Uint8Array(W2*HE2)});BF.rec=null}
// (the stored strips: a face's look by its kind (0 earth, 1 rock, 2 sand, 3 a fall's white water) in a climate, P wide (along the
//  face, seamless), 64 rows (its depth under the lip's level, by the level it stands at: strata run level))
TileSet.prototype.faceOf=function(ci,kind){const key=ci*4+kind;let t=this.face.get(key);if(t)return t;const P=this.P,Q=terrainPal()[ci],FC=WORLD_TERRAIN.face,O=new Uint8ClampedArray(64*P*3);
  for(let z=0;z<64;z++)for(let x=0;x<P;x++){let c;const n1=this.noise()[(z*3&(this.N-1))*this.N+(x&(this.N-1))];
    if(kind===3){const q=hs(x,0,332);c=Q.fall[q<.35?0:q<.75?1:2];if(hs(x,z,331)<.05)c=Q.foam}
    else if(kind===1){const band=Math.floor(z/FC.band),inb=z-band*FC.band,bw=FC.block[0]+Math.floor(hs(band,7,342)*(FC.block[1]-FC.block[0]+1)),bo=Math.floor(hs(band,9,343)*bw),blk=Math.floor((x+bo)/bw);
      c=tmix(tmix(Q.rock[2],Q.rock[3],hs(band,blk,344)*.8),Q.face[2],.2);if(inb<1&&hs(x>>1,band,345)>FC.crackGap)c=tmul(c,.64);else if(inb<2)c=tmix(c,Q.rock[1],.45);if((x+bo)%bw===0&&hs(blk,band,346)<FC.joint)c=tmul(c,.74)}
    else if(kind===2)c=tmul(tmix(Q.sand[0],Q.wet[1],.3),.95+.1*n1);
    else{c=tmix(Q.bank[0],Q.bank[2],Math.min(1,(z%12)/12*.8+.2));if(n1>.74)c=tmul(c,.86);else if(n1<.2)c=tmix(c,Q.bank[0],.4);if(hs(x,z,350)<FC.pebble)c=tmix(c,Q.scree[0],.6)}
    c=tmul(c,1-FC.shade+FC.shade*2*(n1*.8+hs(x,z,355)*.2));const o=(z*P+x)*3;O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2]}
  this.face.set(key,O);return O};
// (the painter's big buffers, kept between chunks of the same size: each held by the chunk's record being painted, free again once
//  it is done or its job let go (worldart.js jobs), so two chunks painted by turns never share one)
TileSet.prototype.bufs=function(n,m,rec){const P=this.pool||(this.pool=[]),live=r=>typeof WorldArt!=='undefined'&&[...WorldArt.jobs.values()].some(j=>j.rec===r);
  let B=P.find(B=>B.n===n&&B.m===m&&(!B.rec||!live(B.rec)));
  if(!B){B={n,m,CO:new Uint8ClampedArray(n*3),WK:new Uint8Array(n),LFF:new Int16Array(n),SF:new Float32Array(n),DEPF:new Int32Array(m),TOP:new Uint8Array(m)};if(P.length<TILE_GROUND.bufs)P.push(B)}
  B.rec=rec;return B};
// (the road's stored colours: 0 its packed crown, 1 its loose sides and gravel)
TileSet.prototype.road=function(kind){const key=900+kind;let t=this.tex.get(key);if(t)return t;const C=WAY_COL,RR=WORLD_WAYS.road;
  t=this.seam((x,y)=>{if(kind===0){let c=C.crown[wnoise2(x/5,y/5,523)>.5?0:1];const p=wnoise2(x/6,y/6,522);if(p>.6)c=C.pack[p>.72?0:1];return c}
    let c=C.loose[Math.floor(wnoise2(x/3,y/3,525)*2.99)];if(hs(x,y,526)<RR.gravel)c=C.gravel[Math.floor(hs(x,y,527)*3)];return c},1700+kind);this.tex.set(key,t);return t};
