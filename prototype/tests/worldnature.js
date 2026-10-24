'use strict';
// World nature: the world map's trees, woods, hills, mountain ranges and small things (engine/worldnature.js). Every generator's
// sprite sits in a power-of-two box at whole pixels, its navy outline round its silhouette only; the looks are seeded (the same
// again, and told apart by their shapes, not their colours alone); the map's woods, hills and ranges are painted with them; nothing
// is painted on a road, a holding, an estate or water (but lily pads and floes); painting reads no Math.random and changes no map
// data; the fen's sparse mangroves and the frost's snow blended into the grass (the owner's play-test, 2026-10-22); each climate's
// own trees, a few of them leafless or dead, and the swamp's forest of bog trees over its pools (the second play-test); the swamp's
// and the desert's edges blended as the frost's, their small things mixed across them, and a wood's fringe of undergrowth and trees
// thinning out (the third); and how long the world takes to paint.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,TILE=t.TILE,MW=t.MW,MH=t.MH,Wp=MW*TILE,Hp=MH*TILE,CL=['grass','frost','desert','swamp'];t.act('begin','soldier');t.G.quietEvents=true;
 // ---- every generator's sprites
 const all=()=>{const L=[];for(const c of CL){for(const sp of PX.WORLD_SPECIES[c])for(let v=0;v<4;v++)for(const dim of [0,1])L.push(['tree '+c+' '+sp+' '+v+(dim?' dim':''),PX.worldTree(c,sp,v,dim)]);
   for(const k of PX.WORLD_DECOR[c].concat(PX.WORLD_DECOR.water))for(let v=0;v<4;v++)L.push(['decor '+c+' '+k+' '+v,PX.worldDecor(c,k,v)]);
   for(let v=0;v<6;v++){L.push(['hill '+c+' '+v,PX.worldHill(c,v)]);for(const n of [16,32,64])L.push(['peak '+c+' '+n+' '+v,PX.worldPeak(c,v,n)])}}
   for(const k of Object.keys(PX.WORLD_MOUNTS))for(let v=0;v<6;v++)for(const n of [32,64])L.push(['peak '+k+' '+n+' '+v,PX.worldPeak('grass',v,n,k)]);
   for(const k of Object.keys(PX.WORLD_CROPS))for(const c of CL)for(let v=0;v<4;v++)L.push(['crop '+k+' '+c+' '+v,PX.worldCrop(k,c,v,{snow:c==='frost'?1:0,wet:c==='swamp'?1:0})]);
   for(const k of ['stook','haystack','fruit'])for(let v=0;v<4;v++)L.push(['thing '+k+' '+v,PX.worldCropThing(k,v)]);return L};
 const list=all(),px=s=>s.getContext('2d', { willReadFrequently: true }).getImageData(0,0,s.width,s.height).data,by={};
 const pow=[],soft=[],out=[],flat=[];
 for(const [n,s] of list){const N=s.width;(by[N]=by[N]||new Set()).add(n.split(' ')[0]);
   if(s.width!==s.height||![8,16,32,64].includes(N)||!Number.isInteger(s.ax)||!Number.isInteger(s.ay)||s.ax<0||s.ay<0||s.ax>=N||s.ay>=N)pow.push(n+' '+s.width+'x'+s.height);
   const d=px(s),A=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&d[(y*N+x)*4+3]===255,nav=(x,y)=>{const i=(y*N+x)*4;return d[i+3]===255&&d[i]===26&&d[i+1]===28&&d[i+2]===38},body=(x,y)=>A(x,y)&&!nav(x,y);
   for(let i=3;i<d.length;i+=4)if(d[i]!==0&&d[i]!==255){soft.push(n);break}
   // (outside: every pixel reached from the box's edge without crossing the body)
   const OUT=new Uint8Array(N*N),st=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if((x===0||y===0||x===N-1||y===N-1)&&!body(x,y)){OUT[y*N+x]=1;st.push(y*N+x)}
   while(st.length){const i=st.pop(),x=i%N,y=(i/N)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=x+a,v=y+b,j=v*N+u;if(u>=0&&v>=0&&u<N&&v<N&&!OUT[j]&&!body(u,v)){OUT[j]=1;st.push(j)}}}
   let bad=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const nb=[[1,0],[-1,0],[0,1],[0,-1]];
     if(s.flat){if(nav(x,y))bad++;continue}
     if(nav(x,y)){if(!nb.some(([a,b])=>body(x+a,y+b))||!OUT[y*N+x])bad++}// (beside the body and outside it: never inside it)
     else if(!A(x,y)&&nb.some(([a,b])=>body(x+a,y+b)))bad++}// (no bare edge: every empty pixel beside the body is outline)
   if(bad)(s.flat?flat:out).push(n+' ('+bad+')')}
 ok(!pow.length,list.length+' nature sprites, each in a power-of-two box with its foot on a whole pixel: '+Object.keys(by).map(k=>k+'x'+k+' '+[...by[k]].join('/')).join(', ')+(pow.length?' — not: '+pow.slice(0,6).join(', '):''));
 ok(!soft.length,'every pixel of every nature sprite fully drawn or not at all'+(soft.length?': '+soft.slice(0,6).join(', '):''));
 ok(!out.length,'the standing ones (trees, bushes, stones, cacti, peaks, stooks, haystacks, fruit trees) wear the navy outline round their silhouette only: all round the body, never inside it'+(out.length?': '+out.slice(0,6).join(', '):''));
 ok(!flat.length,'what lies on the ground (tufts, flowers, drifts, ripples, reeds, moss, pools, pads, floes, hills, a field’s crops) has no outline'+(flat.length?': '+flat.slice(0,6).join(', '):''));
 // ---- seeded: drawn afresh, every one the same; the variants of a kind told apart by their shapes
 {const keep=list.map(([n,s])=>[n,px(s).join()]);PX.worldNatureReset();const again=all(),diff=keep.filter(([n,h],i)=>again[i][0]!==n||px(again[i][1]).join()!==h).map(([n])=>n);
  ok(!diff.length&&again[0][1]!==list[0][1],list.length+' sprites drawn afresh come out pixel for pixel the same (seeded, no Math.random)'+(diff.length?': '+diff.slice(0,6).join(', '):''));
  const mask=s=>{const d=px(s);let k='';for(let i=3;i<d.length;i+=4)k+=d[i]?1:0;return k},same=[];
  for(const c of CL){for(const sp of PX.WORLD_SPECIES[c]){const m=[0,1,2,3].map(v=>mask(PX.worldTree(c,sp,v,0)));if(new Set(m).size<4)same.push(c+' '+sp)}
    for(const n of [16,32,64]){const m=[0,1,2,3,4,5].map(v=>mask(PX.worldPeak(c,v,n)));if(new Set(m).size<(n===16?2:6))same.push(c+' peak '+n)}
    {const z=[0,1,2,3,4,5].map(v=>Array.from(PX.worldHill(c,v).z).map(q=>q.toFixed(1)).join());if(new Set(z).size<6)same.push(c+' hill')}}
  ok(!same.length,'each species’ four trees, each box’s peaks and the six hills differ in shape, not only in colour'+(same.length?': '+same.join(', '):''))}
 // ---- the map painted: with it, its woods, hills and ranges; never on clear ground or water; no Math.random; the map data untouched
 ok(PX.WN_KIND.open===t.T_OPEN&&PX.WN_KIND.forest===t.T_FOREST&&PX.WN_KIND.hill===t.T_HILL&&PX.WN_KIND.water===t.T_WATER&&PX.WN_KIND.road===t.T_ROAD&&PX.WN_KIND.mount===t.T_MOUNT,'the engine’s tile kinds are the game’s own codes');
 ok(['paintTree','paintHill','drawPeak','paintDecor','paintMountain','bigPeakAt','paintBigPeak','peakFits','ROCK_RGB','anyClear'].every(n=>(0,eval)('typeof '+n)==='undefined')&&/PX\.worldNatureSteps/.test(t.paintSteps.toString()),'the old trees, hills, peaks and small things are gone: the world is painted by PX.worldNature (a chunk at a time: tests/worldchunks.js)');
 const sum=a=>{let h=0;for(let i=0;i<a.length;i++)h=(h*31+a[i])|0;return h},tiles0=sum(t.tiles),clim0=sum(t.climate);
 const TO=new Uint8Array(Wp*Hp);window.__TO=TO;(0,eval)('NATURE_TOUCH=window.__TO');
 let rnd=0;const r0=Math.random,wt=PX.worldTree,drawn={};Math.random=function(){rnd++;return r0.apply(this,arguments)};PX.worldTree=(c,sp,v,d)=>{(drawn[c]=drawn[c]||{})[sp]=(drawn[c][sp]||0)+1;return wt(c,sp,v,d)};
 let cv;try{cv=t.paintWorld()}finally{Math.random=r0;PX.worldTree=wt;(0,eval)('NATURE_TOUCH=null')}
 const N=t.NATURE,CLR=t.CLEAR,cnt=k=>{let n=0;for(let i=0;i<MW*MH;i++)if(t.tiles[i]===k)n++;return n},nF=cnt(t.T_FOREST),nH=cnt(t.T_HILL),nM=cnt(t.T_MOUNT);
 ok(rnd===0&&sum(t.tiles)===tiles0&&sum(t.climate)===clim0,'painting the world reads no Math.random ('+rnd+') and leaves the map’s tiles and climates as they were');
 ok(cv.getContext('2d', { willReadFrequently: true }).imageSmoothingEnabled===false,'the world canvas is painted without smoothing');
 const share=k=>{let n=0,m=0;for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(t.tiles[ty*MW+tx]!==k)continue;for(let y=1;y<TILE;y+=3)for(let x=1;x<TILE;x+=3){const i=(ty*TILE+y)*Wp+tx*TILE+x;if(CLR.at(tx*TILE+x,ty*TILE+y))continue;m++;if(TO[i])n++}}return m?n/m:0};
 const sF=share(t.T_FOREST),sH=share(t.T_HILL),sM=share(t.T_MOUNT);
 ok(N&&N.trees>=nF*3.5&&sF>.9,nF+' wood tiles stand thick with trees ('+(N&&N.trees)+' trees, '+(N&&(N.trees/nF).toFixed(1))+' a tile), '+Math.round(sF*100)+'% of their ground painted');
 ok(N&&N.hills>=nH*.9&&sH>.8,nH+' hill tiles rise ('+(N&&N.hills)+' of them in a rise), '+Math.round(sH*100)+'% of their ground shaded');
 ok(N&&N.peaks>=1&&N.rock>=nM*120&&sM>.7,nM+' mountain tiles stand as '+(N&&N.peaks)+' ranges ('+(N&&N.rock)+' px of rock), '+Math.round(sM*100)+'% of their ground painted');
 ok(N&&N.decor>200&&N.flat>500,'small things on the open ground: '+(N&&N.decor)+' standing (bushes, stones, cacti, stumps), '+(N&&N.flat)+' lying (tufts, flowers, drifts, ripples, reeds, moss, pools, pads, floes)');
 {let onClear=0,onWater=0,offWater=0,lots=0,roads=0,n=0;
  // (water: a water tile's pixel; on the generated world the water as drawn (gfx/worldart.js wpx: its shores curves, a brook running
  //  on into it over a water tile's land, the owner's fifth play-test))
  const WK=t.WorldArt.ensure().wk,water=(x,y)=>WK?t.wpx(WK,x,y)===1:t.tAt(x>>4,y>>4)===t.T_WATER;
  // (3: a ground's tone on kept-clear ground, a hill's shading running on under a road or a yard and a brook crossing a road (the
  //  owner's fourth play-test), an oasis's or a pond's green under a yard (2026-10-23): never off it, and nothing else on it)
  // (4: a wood's tree's crown leaning over the shore (PX.WN_WOOD.shore): its beach and a curved shore's water on a land tile, never
  //  a road, a yard or a water tile)
  let toned=0,tonedOff=0,crowns=0,crownsOff=0;
  for(let y=0;y<Hp;y++)for(let x=0;x<Wp;x++){const i=y*Wp+x,v=TO[i];if(!v)continue;if(v===3){toned++;if(!CLR.at(x,y)||water(x,y))tonedOff++;continue}if(v===4){crowns++;const k=t.tAt(x>>4,y>>4);if(CLR.at(x,y)||k===t.T_WATER||k===t.T_FORD||k===t.T_ROAD)crownsOff++;continue}n++;if(CLR.at(x,y))onClear++;if(v===1&&water(x,y))onWater++;if(v===2&&!water(x,y))offWater++}
  for(const tw of t.TOWNS)for(const l of tw.lots||[]){for(let j=0;j<l.n*TILE;j++)for(let i=0;i<l.n*TILE;i++){const v=TO[(l.y*TILE+j)*Wp+l.x*TILE+i];if(v&&v!==3)lots++}for(const [px2,py2] of l.plots||[])for(let j=0;j<TILE;j++)for(let i=0;i<TILE;i++){const v=TO[(py2*TILE+j)*Wp+px2*TILE+i];if(v&&v!==3)lots++}}
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++)if(t.tiles[ty*MW+tx]===t.T_ROAD)for(let j=6;j<10;j++)for(let i=6;i<10;i++){const v=TO[(ty*TILE+j)*Wp+tx*TILE+i];if(v&&v!==3&&CLR.at(tx*TILE+i,ty*TILE+j))roads++}
  for(const tw of t.TOWNS)for(const l of tw.lots||[])for(let j=0;j<l.n*TILE;j++)for(let i=0;i<l.n*TILE;i++)if(TO[(l.y*TILE+j)*Wp+l.x*TILE+i]===4)lots++;
  ok(n>1e6&&!onClear&&!lots&&!roads&&!tonedOff&&!crownsOff,'nature painted '+n+' pixels, none on a road, a holding’s yard or building, an estate’s plot or a field ('+onClear+' on clear ground, '+lots+' on a lot, '+roads+' on a road); '+toned+' of clear ground toned (a hill’s shading under a road, a brook crossing it), '+tonedOff+' of them off it; '+crowns+' of a wood’s crowns leaning over the shore, '+crownsOff+' over a road, a yard or a water tile');
  ok(!onWater&&!offWater,'nothing on the water but its lily pads and floes, and those only on water ('+onWater+', '+offWater+')')}
 // ---- a wood's tile a full stand (PX.WN_WOOD; the owner 2026-10-22: "a 1-tile forest with 1 tree"): the trees whose feet stand on
 //      each wood tile (the chunks' standing indexes), on every tile with most of its ground free (no road's band, yard, shore or water), at
 //      a wood's edge, in a small wood (6 tiles or fewer) and by a road too: 4 at least (the swamp's bog forest 2), or (squeezed by
 //      a road, a yard or a shore above it: a crown leans over a verge or a beach, never a way's surface, a yard or a water tile) its
 //      ground 75% under the crowns of its trees and those beside it (COV: what the trees drew); a few stay thinner
 {const TS=new Set(),SP=[...new Set(Object.values(PX.WORLD_SPECIES).flat().concat(Object.values(PX.WN_ECO.freeze),Object.values(PX.WN_ECO.wood)))];
  for(const c of CL)for(const sp of SP)for(let v=0;v<4;v++)for(const d of [0,1])TS.add(PX.worldTree(c,sp,v,d));
  const n=new Uint8Array(MW*MH),KP=t.WorldArt.ensure().nature.keep,COV=new Uint8Array(Wp*Hp);for(const c of t.WorldArt.cnt.values()){const S=c.n.stand,E=S.E;for(let k=0;k<S.n;k++){const o=k*4,ref=E[o+2];if(ref<0)continue;const sp=PX.WN_SPR[ref];if(!TS.has(sp))continue;
    const x=S.X+E[o]+sp.ax,y=S.Y+E[o+3];if(x<S.X||y<S.Y||x>=S.X+S.w||y>=S.Y+S.h)continue;n[(y>>4)*MW+(x>>4)]++;const N=sp.width,X0=S.X+E[o],Y0=S.Y+E[o+1];
    for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(sp.a[j*N+i]){const X=X0+i,Y=Y0+j;if(X>=0&&Y>=0&&X<Wp&&Y<Hp)COV[Y*Wp+X]=1}}}
  const isF=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&t.tiles[y*MW+x]===t.T_FOREST,size=new Int32Array(MW*MH);
  for(let i=0;i<MW*MH;i++){if(!isF(i%MW,(i/MW)|0)||size[i])continue;const L=[i],st=[i];size[i]=-1;while(st.length){const q=st.pop(),x=q%MW,y=(q-x)/MW;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(isF(x+a,y+b)&&!size[q+b*MW+a]){size[q+b*MW+a]=-1;st.push(q+b*MW+a);L.push(q+b*MW+a)}}for(const q of L)size[q]=L.length}
  const B={all:[0,0],edge:[0,0],small:[0,0],road:[0,0]},bad=[];let lo=99,few=0;
  // (a brook's mouth: a tile a brook runs from into the water, a crown never over its way there; left out)
  const Fl=t.WM.flow,Rv=t.WM.river,DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1],mouth=i=>!(Rv[i]&3)&&(Fl[i]&31)>=6&&t.tAt(i%MW+DX[Fl[i]>>5],((i/MW)|0)+DY[Fl[i]>>5])===t.T_WATER;let mouths=0;
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(!isF(tx,ty))continue;if(mouth(ty*MW+tx)){mouths++;continue}let free=0,cov=0;for(let y=1;y<TILE;y+=2)for(let x=1;x<TILE;x+=2){const X=tx*TILE+x,Y=ty*TILE+y;if(!KP.at(X,Y)){free++;if(COV[Y*Wp+X])cov++}}if(free<48)continue;
   const sw=t.CLIMS[t.climate[ty*MW+tx]]==='swamp',m=n[ty*MW+tx],ok2=m>=(sw?PX.WN_WOOD.min[1]:PX.WN_WOOD.min[0])||cov>=free*.75,edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!isF(tx+a,ty+b)),road=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>t.tAt(tx+a,ty+b)===t.T_ROAD);
   for(const [k,on] of [['all',1],['edge',edge],['small',size[ty*MW+tx]<=6],['road',road]])if(on){B[k][0]++;if(ok2)B[k][1]++}if(!ok2&&bad.length<6)bad.push(tx+','+ty+' ('+m+', '+Math.round(cov/free*100)+'%)');if(!sw&&m<lo)lo=m;if(m<(sw?PX.WN_WOOD.min[1]:PX.WN_WOOD.min[0]))few++}
  ok(B.all[0]>1000&&B.edge[0]>200&&B.small[0]>20&&B.all[1]>=B.all[0]*.997&&B.edge[1]>=B.edge[0]*.99&&B.small[1]>=B.small[0]*.95,'every wood tile a full stand: '+Object.keys(B).map(k=>B[k][1]+' of '+B[k][0]+' '+(k==='all'?'wood tiles':k==='edge'?'at a wood\u2019s edge':k==='small'?'in a small wood':'by a road')).join(', ')+' with '+PX.WN_WOOD.min[0]+' trees or more (the swamp\u2019s '+PX.WN_WOOD.min[1]+', or 75% under crowns: '+few+' with fewer; fewest '+lo+'; '+mouths+' a brook runs from into the water left out)'+(bad.length?' \u2014 not: '+bad.join(', '):''))}
 // ---- the fen's own trees: mangroves on its open ground, sparse (some .6 a tile, about a third of a wood's cover)
 {let nS=0;for(let i=0;i<MW*MH;i++)if(t.tiles[i]===t.T_OPEN&&t.CLIMS[t.climate[i]]==='swamp')nS++;const f=N.fen/Math.max(1,nS),wd=(N.trees-N.fen)/Math.max(1,nF);
  ok(nS&&f>.3&&f<1&&f<wd/3,'the swamp’s open ground ('+nS+' tiles) stands with sparse mangroves: '+N.fen+' ('+f.toFixed(2)+' a tile, against a wood’s '+wd.toFixed(1)+')')}
 // ---- the trees by climate (PX.WORLD_TREES): each climate's woods its own species, a few leafless or dead (bare trees, bare
 //      birches, snags, dead trees: 4-20%), more at a wood's edge; the swamp's forest of bog trees (mangroves, bog willows, snags),
 //      looser than a wood elsewhere, its bog's pools showing between them (peat water on its floor)
 {const BARE=new Set(['bare','bbirch','snag','dead']),sh=[],bad=[];
  for(const c of CL){const L=PX.WORLD_TREES[c].wood;let n=0,b=0,eb=0;for(let i=0;i<41;i++)for(let j=0;j<40;j++){const g=i/40,r=(j+.5)/40;n++;if(BARE.has(PX.pickWorldTree(L,g,r,false)))b++;if(BARE.has(PX.pickWorldTree(L,g,r,true)))eb++}
   sh.push(c+' '+Math.round(b/n*100)+'% ('+Math.round(eb/n*100)+'% at the edge)');if(!(b/n>=.04&&b/n<=.2&&eb/n>b/n))bad.push(c)}
  // (drawn in the frost: its own species, or another's in the snow, frosted: PX.WN_ECO.freeze)
  const own=[];for(const c of CL)for(const sp in drawn[c]||{})if(!PX.WORLD_SPECIES[c].includes(sp)&&!(c==='frost'&&Object.values(PX.WN_ECO.freeze).includes(sp)))own.push(c+' '+sp+' '+drawn[c][sp]);
  ok(!bad.length&&!own.length&&CL.every(c=>PX.WORLD_SPECIES[c].length>=3),'each climate’s woods grow its own trees ('+CL.map(c=>c+': '+PX.WORLD_SPECIES[c].join('/')).join('; ')+'), a few of them leafless or dead: '+sh.join(', ')+(bad.length||own.length?' — not: '+bad.concat(own).join(', '):''));
  let nB=0;for(let i=0;i<MW*MH;i++)if(t.tiles[i]===t.T_FOREST&&t.CLIMS[t.climate[i]]==='swamp')nB++;const sw=drawn.swamp||{},bogs=(sw.mangrove||0)+(sw.bogwillow||0);
  const d=cv.getContext('2d', { willReadFrequently: true }).getImageData(0,0,Wp,Hp).data;let pools=0,seen=0;for(let i=0;i<MW*MH&&seen<400;i++){if(t.tiles[i]!==t.T_FOREST||t.CLIMS[t.climate[i]]!=='swamp')continue;seen++;const X=i%MW*TILE,Y=Math.floor(i/MW)*TILE;
   for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){const o=((Y+y)*Wp+X+x)*4;if(d[o]===50&&d[o+1]===70&&d[o+2]===72){pools++;y=TILE;break}}}
  ok(!nB||bogs>nB&&!sw.willow&&pools>seen*.2,(nB?nB+' tiles of the swamp’s forest stand with bog trees ('+(sw.mangrove||0)+' mangroves, '+(sw.bogwillow||0)+' bog willows, '+((sw.snag||0)+(sw.dead||0))+' snags and dead trees with the fen’s), its pools showing on '+pools+' of '+seen+' tiles':'no swamp forest on this map'))}
 // ---- the frost blended: the snow's cover (gfx/worldart.js snowCover) thins out over the grass beside the frost in patches, rises
 //      over the frost's edge and lies whole deep in it; no grass far from it is touched (snow: a pale blue-white pixel)
 {const S=t.WorldArt.ensure().snow,d=cv.getContext('2d', { willReadFrequently: true }).getImageData(0,0,Wp,Hp).data,F=t.CLIMS.indexOf('frost'),G=t.CLIMS.indexOf('grass');
  const share=(tx,ty)=>{let n=0,m=0;for(let y=1;y<TILE;y+=2)for(let x=1;x<TILE;x+=2){const o=((ty*TILE+y)*Wp+tx*TILE+x)*4;m++;if(d[o]>185&&d[o+1]>190&&d[o+2]>200)n++}return n/m};
  // (the open tiles with only open ground round them, by how far they lie from the frost's edge: -1 grass beside it, 1 frost beside
  //  grass, 4 frost 4 tiles in, 0 grass 6 tiles from any frost)
  const near=(tx,ty,r,c)=>{for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<MW&&y<MH&&t.climate[y*MW+x]===c)return true}return false};
  const B={'-1':[],1:[],4:[],0:[]};
  for(let ty=6;ty<MH-6;ty++)for(let tx=6;tx<MW-6;tx++){let open=true;for(let b=-1;b<=1&&open;b++)for(let a=-1;a<=1;a++)if(t.tiles[(ty+b)*MW+tx+a]!==t.T_OPEN){open=false;break}if(!open)continue;
    const c=t.climate[ty*MW+tx];if(c===G&&near(tx,ty,1,F))B[-1].push(share(tx,ty));else if(c===F&&near(tx,ty,1,G))B[1].push(share(tx,ty));else if(c===F&&!near(tx,ty,4,G))B[4].push(share(tx,ty));else if(c===G&&!near(tx,ty,6,F)&&B[0].length<4000)B[0].push(share(tx,ty))}
  const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length),M={};for(const k in B)M[k]=mean(B[k]);
  ok(B[-1].length>20&&B[1].length>20&&B[4].length>20&&M[0]<.01&&M[-1]>.03&&M[-1]<.45&&M[1]>M[-1]+.15&&M[1]<.95&&M[4]>.93,'the frost’s snow blends into the grass: snow on '+(M[0]*100).toFixed(1)+'% of the grass far from it, '+(M[-1]*100).toFixed(0)+'% of the grass beside it ('+B[-1].length+' tiles: patches), '+(M[1]*100).toFixed(0)+'% of the frost at its edge ('+B[1].length+'), '+(M[4]*100).toFixed(0)+'% 4 tiles in ('+B[4].length+')');
  let lo=0,hi=0;for(let i=0;i<MW*MH;i++){if(t.climate[i]===F&&S[i]<.55)lo++;if(t.climate[i]!==F&&S[i]>.45)hi++}
  ok(!lo&&!hi,'the snow’s cover a tile: every frost tile’s at least .55, every other’s at most .45 ('+lo+', '+hi+' off)')}
 // ---- the swamp's and the desert's edges blended as the frost's (gfx/worldart.js coverOf, landRGB; the owner's third play-test: no
 //      blocks between climates): each climate's own ground (the swamp's peat green, the desert's sand) in patches over the grass beside
 //      it, more over its own edge, whole deep in it, none on grass far from it; their covers a tile as the snow's (own .55 or more)
 {const d=cv.getContext('2d', { willReadFrequently: true }).getImageData(0,0,Wp,Hp).data,G=t.CLIMS.indexOf('grass'),PL=t.WorldArt.ensure(),res=[];
  const IS={desert:(r,g,b)=>r>185&&g>150&&b<150&&r-b>60,swamp:(r,g,b)=>g-r<22&&g<112&&b<70};
  const near=(tx,ty,r,c)=>{for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<MW&&y<MH&&t.climate[y*MW+x]===c)return true}return false};
  for(const cn of ['desert','swamp']){const C=t.CLIMS.indexOf(cn),S=PL.cover[cn],is=IS[cn],B={'-1':[],1:[],4:[],0:[]};
   const share=(tx,ty)=>{let n=0,m=0;for(let y=1;y<TILE;y+=2)for(let x=1;x<TILE;x+=2){const o=((ty*TILE+y)*Wp+tx*TILE+x)*4;m++;if(is(d[o],d[o+1],d[o+2]))n++}return n/m};
   for(let ty=6;ty<MH-6;ty++)for(let tx=6;tx<MW-6;tx++){let open=true;for(let b=-1;b<=1&&open;b++)for(let a=-1;a<=1;a++)if(t.tiles[(ty+b)*MW+tx+a]!==t.T_OPEN||t.occAt(tx+a,ty+b)>0){open=false;break}if(!open)continue;// (open ground, no holding's yard on it: the yards are painted in, gfx/worldart.js townGround)
    const c=t.climate[ty*MW+tx];if(c===G&&near(tx,ty,1,C)&&!near(tx,ty,4,t.CLIMS.indexOf('frost')))B[-1].push(share(tx,ty));else if(c===C&&near(tx,ty,1,G))B[1].push(share(tx,ty));else if(c===C&&!near(tx,ty,4,G))B[4].push(share(tx,ty));else if(c===G&&!near(tx,ty,6,C)&&B[0].length<4000)B[0].push(share(tx,ty))}
   const mean=a=>a.reduce((q,v)=>q+v,0)/Math.max(1,a.length),M={};for(const k in B)M[k]=mean(B[k]);let lo=0,hi=0;for(let i=0;i<MW*MH;i++){if(t.climate[i]===C&&S[i]<.55)lo++;if(t.climate[i]!==C&&S[i]>.45)hi++}
   const good=B[-1].length>10&&B[1].length>10&&M[0]<.01&&M[-1]>.03&&M[-1]<.45&&M[1]>M[-1]+.15&&(!B[4].length||M[4]>M[1])&&!lo&&!hi;
   res.push([good,cn+': '+(M[0]*100).toFixed(1)+'% of the grass far from it, '+(M[-1]*100).toFixed(0)+'% beside it ('+B[-1].length+' tiles), '+(M[1]*100).toFixed(0)+'% of its edge ('+B[1].length+'), '+(M[4]*100).toFixed(0)+'% 4 tiles in ('+B[4].length+'); covers off '+lo+', '+hi])}
  ok(res.every(r=>r[0]),'the swamp’s and the desert’s ground blend into the grass in patches, as the frost’s: '+res.map(r=>r[1]).join('; '))}
 // ---- their small things mixed across the edge (PX.worldNatureMix, PX.WN_MIX): a grass tile beside the swamp or the desert has
 //      theirs now and then (pools, reeds, moss; ripples, cacti, scrub), fewer farther out, none far off; theirs the grass's at their edge
 {const PN=t.WorldArt.ensure().nature,R={};
  for(const cn of ['swamp','desert']){const C=t.CLIMS.indexOf(cn),G=t.CLIMS.indexOf('grass'),dist=(tx,ty,c)=>{for(let r=1;r<=6;r++)for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<MW&&y<MH&&t.climate[y*MW+x]===c)return r}return 9};
   const n=[[0,0],[0,0],[0,0],[0,0]];for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const c=t.climate[ty*MW+tx];if(t.tiles[ty*MW+tx]!==t.T_OPEN)continue;
    if(c===G){const r=dist(tx,ty,C),k=r===1?0:r===3?1:r>6?2:-1;if(k<0)continue;n[k][0]++;if(PX.worldNatureMix(PN,'grass',tx,ty)===cn)n[k][1]++}
    else if(c===C&&dist(tx,ty,G)===1){n[3][0]++;if(PX.worldNatureMix(PN,cn,tx,ty)==='grass')n[3][1]++}}
   R[cn]=n.map(([a,b])=>a?b/a:0)}
  ok(['swamp','desert'].every(c=>R[c][0]>.15&&R[c][0]<.6&&R[c][1]<R[c][0]&&R[c][2]===0&&R[c][3]>.1&&R[c][3]<.6),'the swamp’s and the desert’s small things mixed across their edge: '+['swamp','desert'].map(c=>c+' '+R[c].slice(0,3).map(v=>Math.round(v*100)+'%').join(' / ')+' of the grass 1, 3 and 7+ tiles off, the grass’s on '+Math.round(R[c][3]*100)+'% of its edge').join('; '))}
 // ---- a wood's fringe (PX.WN_FRINGE): open tiles round a wood stand with undergrowth and trees, thinning out (what stands, from the
 //      chunks' standing indexes: things a tile, beside a wood, two tiles off it, far from any)
 {const n=[[0,0],[0,0],[0,0]],at=new Float32Array(MW*MH),F=(tx,ty,r)=>{for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<MW&&y<MH&&t.tiles[y*MW+x]===t.T_FOREST)return true}return false};
  for(const c of t.WorldArt.cnt.values()){const S=c.n.stand,E=S.E;for(let k=0;k<S.n;k++){const o=k*4,ref=E[o+2];if(ref<0)continue;const sp=PX.WN_SPR[ref],x=S.X+E[o]+sp.ax,y=S.Y+E[o+3];if(x<S.X||y<S.Y||x>=S.X+S.w||y>=S.Y+S.h)continue;at[(y>>4)*MW+(x>>4)]++}}
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const i=ty*MW+tx;if(t.tiles[i]!==t.T_OPEN||t.CLIMS[t.climate[i]]!=='grass'||t.CLEAR.at(tx*TILE+8,ty*TILE+8))continue;const k=F(tx,ty,1)?0:F(tx,ty,2)?1:F(tx,ty,5)?-1:2;if(k<0)continue;n[k][0]++;n[k][1]+=at[i]}
  const m=n.map(([a,b])=>a?b/a:0);ok(n[0][0]>50&&n[1][0]>50&&m[0]>m[1]&&m[1]>2.5*m[2],'a wood’s fringe: open grass beside a wood stands with '+m[0].toFixed(2)+' things a tile (undergrowth and trees), two tiles off '+m[1].toFixed(2)+', far from any wood '+m[2].toFixed(2))}
 // ---- the oasis: palms only by a small water in the desert
 {let near=0,far=0;const P2=new Set();for(let v=0;v<4;v++){const s=PX.worldTree('desert','palm',v,0);for(let i=0;i<s.a.length;i++)if(s.a[i]===1)P2.add(s.rgb[i*3]+','+s.rgb[i*3+1]+','+s.rgb[i*3+2])}
  const d=cv.getContext('2d', { willReadFrequently: true }).getImageData(0,0,Wp,Hp).data;
  for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++){if(t.CLIMS[t.climate[ty*MW+tx]]!=='desert'||t.tiles[ty*MW+tx]!==t.T_OPEN)continue;let hit=0;for(let j=0;j<TILE&&!hit;j+=2)for(let i=0;i<TILE;i+=2){const o4=((ty*TILE+j)*Wp+tx*TILE+i)*4;if(P2.has(d[o4]+','+d[o4+1]+','+d[o4+2])){hit=1;break}}
    if(!hit)continue;let wet=false;for(let b=-3;b<=3;b++)for(let a=-3;a<=3;a++)if(t.tAt(tx+a,ty+b)===t.T_WATER)wet=true;if(wet)near++;else far++}
  ok(far<=near*.1+2,'the desert’s palms stand by water (tiles showing palms: '+near+' by water, '+far+' not)')}
 // ---- the mountains' kinds (the owner's notes on the fifth play-test, engine only: a small map of its own, a range of 14 x 8 tiles,
 //      its left half grass and its right desert, the desert's cover ramping across the middle as the map's does). A forested range
 //      wooded with the world's own trees standing on its slopes (lifted up the screen by their ground's height), bare rock on its
 //      steepest faces and its summit; across a climate's edge its look, its trees and its foot leaning to each side's; painted a
 //      window at a time, the same picture
 {const C=24,R=16,ts=16,Wm=C*ts,Hm=R*ts,N=C*R,kind=new Uint8Array(N),clim=new Uint8Array(N),cov=new Float32Array(N),f=v=>new Uint8Array(N).fill(v),G0=[88,128,58],GD=[214,182,108];
  for(let y=4;y<12;y++)for(let x=5;x<19;x++)kind[y*C+x]=PX.WN_KIND.mount;
  for(let y=0;y<R;y++)for(let x=0;x<C;x++){clim[y*C+x]=x<12?0:2;cov[y*C+x]=Math.max(0,Math.min(1,(x-9)/6))}
  const ground=D=>{for(let i=0;i<Wm*Hm;i++){const c=clim[((i/Wm/ts)|0)*C+((i%Wm)/ts|0)]?GD:G0;D[i*4]=c[0];D[i*4+1]=c[1];D[i*4+2]=c[2];D[i*4+3]=255}return D};
  const plan=(pool,cover)=>{const P0=PX.WN_MOUNT.pool;PX.WN_MOUNT.pool=pool;try{return PX.worldNaturePlan({W:Wm,H:Hm,C,R,ts,kind,clim,clear:new Uint8Array(Wm*Hm),seed:3,snow:new Float32Array(N),
    cover:{desert:cover,swamp:new Float32Array(N)},mount:{elev:f(200),temp:f(120),moist:f(80),rough:f(80)}})}finally{PX.WN_MOUNT.pool=P0}};
  const paint=(P,w)=>{const D=ground(new Uint8ClampedArray(Wm*Hm*4)),o=PX.worldNaturePaint(P,w||{x:0,y:0,w:Wm,h:Hm},D,null);return{D,o,md:P.md[0]}};
  const zA=(md,x,y)=>x<md.x0||y<md.y0||x>=md.x1||y>=md.y1?0:md.ZR[(y-md.y0)*md.bw+x-md.x0],nzA=(md,x,y)=>1/Math.hypot((zA(md,x+1,y)-zA(md,x-1,y))/2,(zA(md,x,y+1)-zA(md,x,y-1))/2,1);
  const px=(D,x,y)=>D[(y*Wm+x)*4]+','+D[(y*Wm+x)*4+1]+','+D[(y*Wm+x)*4+2],hex=c=>parseInt(c.slice(1,3),16)+','+parseInt(c.slice(3,5),16)+','+parseInt(c.slice(5,7),16);
  // (forested, no edge: trees on it, none on a steep face or near its summit; the steep faces' and the summit's top pixels bare rock,
  //  where they show (a tree before one hides it), far more than where a tree stands)
  {const FO=[['forested',1]],P=plan({grass:FO,frost:FO,desert:FO,swamp:FO},new Float32Array(N)),{D,o,md}=paint(P),T=PX.WN_MOUNT.trees,ROCK=new Set(PX.WORLD_MOUNTS.forested.rock.c.map(hex));
   const TS=new Set();for(const c of CL)for(const sp of PX.WORLD_SPECIES[c])for(let v=0;v<4;v++)for(const d of [0,1])TS.add(PX.worldTree(c,sp,v,d));
   const tr=md&&md.trees||[],lifted=tr.filter(q=>q.z>=3).length,steepT=tr.filter(q=>nzA(md,q.x,q.y)<T.steep).length,highT=tr.filter(q=>q.z>md.zmax*(PX.WORLD_MOUNTS.forested.wood+T.line)).length;
   let st=0,sr=0,top=null;for(let y=md.y0;y<md.y1;y++)for(let x=md.x0;x<md.x1;x++){const z=zA(md,x,y);if(z<6)continue;if(!top||z>top[2])top=[x,y,z];if(nzA(md,x,y)<T.steep){st++;if(ROCK.has(px(D,x,Math.round(y-z))))sr++}}
   const wr=tr.filter(q=>ROCK.has(px(D,q.x,q.y-q.z))).length;let sumR=0,sumN=0;for(let y=top[1]-2;y<=top[1]+2;y++)for(let x=top[0]-2;x<=top[0]+2;x++){const z=zA(md,x,y);if(z<top[2]-3)continue;sumN++;if(ROCK.has(px(D,x,Math.round(y-z))))sumR++}
   ok(tr.length>150&&o.mtrees>150&&tr.every(q=>TS.has(q.sp))&&lifted>tr.length*.8&&!steepT&&!highT&&st>200&&sr>st*.3&&sr/st>4*wr/tr.length&&sumN&&sumR>=sumN*.5,'a forested range ('+md.zmax.toFixed(0)+' px high) stands with '+tr.length+' of the world’s trees ('+o.mtrees+' painted, '+lifted+' lifted up its slopes), none on a steep face ('+steepT+') or above its tree line ('+highT+'); its steep faces bare rock at '+sr+' of '+st+' points (where a tree stands '+wr+' of '+tr.length+'), its summit at '+sumR+' of '+sumN)}
  // (across an edge: the grass's granite and the desert's sandstone; its look mixed by the covers (CT), warmer toward the desert; the
  //  forested's trees thinning out toward the desert; its foot leaning to the ground under it)
  {const P=plan({grass:[['granite',1]],frost:[['granite',1]],desert:[['sandstone',1]],swamp:[['granite',1]]},cov),{D,md}=paint(P),warm=[0,0,0],n=[0,0,0];let mixed=0,pts=0;
   for(let y=md.y0;y<md.y1;y++)for(let x=md.x0;x<md.x1;x++){const k=(y-md.y0)*md.bw+x-md.x0;if(!md.ZR[k])continue;pts++;if(md.CT[k]&&md.CL[k]!==md.CL2[k])mixed++;
     const b=x<9*ts?0:x<15*ts?1:2,o=(Math.round(y-md.ZR[k])*Wm+x)*4;warm[b]+=D[o]-D[o+2];n[b]++}
   const w=warm.map((s,i)=>s/Math.max(1,n[i]));
   const FO=[['forested',1]],P2=plan({grass:FO,frost:FO,desert:[['classic',1]],swamp:FO},cov),md2=paint(P2).md,d=[0,0,0];for(const q of md2.trees||[])d[q.x<9*ts?0:q.x<15*ts?1:2]++;
   // (the foot: the rock's lowest px nearer the ground's colour under them than with PX.WN_MOUNT.foot off, on each side of the edge)
   const GR={grass:[['granite',1]],frost:[['granite',1]],desert:[['granite',1]],swamp:[['granite',1]]},r3=paint(plan(GR,cov)),F0=PX.WN_MOUNT.foot,fd=[0,0],fn=[0,0];
   PX.WN_MOUNT.foot=[0,0];let r4;try{r4=paint(plan(GR,cov))}finally{PX.WN_MOUNT.foot=F0}
   const gd=(D,o,g)=>Math.abs(D[o]-g[0])+Math.abs(D[o+1]-g[1])+Math.abs(D[o+2]-g[2]);
   for(let i=0;i<Wm*Hm;i++){const o=i*4;if(r3.D[o]===r4.D[o]&&r3.D[o+1]===r4.D[o+1]&&r3.D[o+2]===r4.D[o+2])continue;const sd=clim[((i/Wm/ts)|0)*C+((i%Wm)/ts|0)]?1:0;fn[sd]++;if(gd(r3.D,o,sd?GD:G0)<gd(r4.D,o,sd?GD:G0))fd[sd]++}
   ok(mixed>pts*.1&&w[2]>w[1]+8&&w[1]>w[0]+8&&d[0]>d[1]&&d[1]>d[2]&&d[2]<d[0]*.15&&fn[0]>40&&fn[1]>40&&fd[0]>=fn[0]*.95&&fd[1]>=fn[1]*.95,'a range across a climate’s edge blends with both: its look mixed at '+mixed+' of '+pts+' points, warmer toward the desert (red over blue '+w.map(v=>v.toFixed(0)).join(' / ')+' grass, edge, desert), a forested look’s trees thinning out toward it ('+d.join(' / ')+'), its foot leaning to each side’s ground (nearer it at '+fd.join(' / ')+' of '+fn.join(' / ')+' foot pixels, grass / desert)')}
  // (painted a window at a time, the one picture: the trees standing across a window's edge too)
  {const FO=[['forested',1]],P=plan({grass:FO,frost:FO,desert:[['sandstone',1]],swamp:FO},cov),A=paint(P).D,B=ground(new Uint8ClampedArray(Wm*Hm*4)),AP=PX.WN_APRON;let bad=0;
   for(let Y=0;Y<Hm;Y+=96)for(let X=0;X<Wm;X+=96){const x0=Math.max(0,X-AP),y0=Math.max(0,Y-AP),w=Math.min(Wm,X+96+AP)-x0,h=Math.min(Hm,Y+96+AP)-y0,Dw=new Uint8ClampedArray(w*h*4);
     for(let j=0;j<h;j++)for(let i=0;i<w;i++){const o=((y0+j)*Wm+x0+i)*4,q=(j*w+i)*4;Dw[q]=B[o];Dw[q+1]=B[o+1];Dw[q+2]=B[o+2];Dw[q+3]=255}
     PX.worldNaturePaint(P,{x:x0,y:y0,w,h,inner:{x:X,y:Y,w:Math.min(96,Wm-X),h:Math.min(96,Hm-Y)}},Dw,null);
     for(let j=Y;j<Math.min(Hm,Y+96);j++)for(let i=X;i<Math.min(Wm,X+96);i++){const o=(j*Wm+i)*4,q=((j-y0)*w+i-x0)*4;if(A[o]!==Dw[q]||A[o+1]!==Dw[q+1]||A[o+2]!==Dw[q+2])bad++}}
   ok(!bad,'painted 96 px at a time, a forested range across an edge is the one picture ('+bad+' pixels differ)')}}
 // ---- the hills (the owner 2026-10-22: "can we just have one large hill sprite?"; his shot 68: open land spotted with small pale
 //      bumps, a bump a hill tile's spot of a lattice): a small map of its own, a group of 10 x 5 hill tiles and one of 4 x 3 on the
 //      grass, painted with and without hills (the difference: the hills' shading). Each group one shape: its lit side and its shade
 //      a few big patches (the lit upper left, the shaded lower right, a knoll or two: 3 each at most), not a pair a tile (a 10 x 5
 //      group drew some 25 small rises before);
 //      and no seam along its tiles' edges (the shading across a tile's edge inside the group no more than across its middle)
 {const C=28,R=18,ts=16,Wm=C*ts,Hm=R*ts,N=C*R,kind=new Uint8Array(N),G0=[88,128,58];for(let y=6;y<11;y++)for(let x=5;x<15;x++)kind[y*C+x]=PX.WN_KIND.hill;for(let y=5;y<8;y++)for(let x=19;x<23;x++)kind[y*C+x]=PX.WN_KIND.hill;
  const P=PX.worldNaturePlan({W:Wm,H:Hm,C,R,ts,kind,clim:new Uint8Array(N),clear:new Uint8Array(Wm*Hm),seed:5}),paint=()=>{const D=new Uint8ClampedArray(Wm*Hm*4);for(let i=0;i<Wm*Hm;i++){D[i*4]=G0[0];D[i*4+1]=G0[1];D[i*4+2]=G0[2];D[i*4+3]=255}PX.worldNaturePaint(P,{x:0,y:0,w:Wm,h:Hm},D,null);return D};
  const A=paint();P.hill=false;let Bn;try{Bn=paint()}finally{P.hill=true}
  const dl=new Float32Array(Wm*Hm);for(let i=0;i<Wm*Hm;i++){const o=i*4;dl[i]=(A[o]-Bn[o])*.3+(A[o+1]-Bn[o+1])*.59+(A[o+2]-Bn[o+2])*.11}
  // (connected regions of pixels f, those of min px or more, within the box x0..x1, y0..y1 (px))
  const blobs=(f,min,x0,y0,x1,y1)=>{const seen=new Uint8Array(Wm*Hm),out=[];for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*Wm+x;if(seen[i]||!f(dl[i]))continue;let n=0;const st=[i];seen[i]=1;
    while(st.length){const q=st.pop(),qx=q%Wm,qy=(q-qx)/Wm;n++;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=qx+a,v=qy+b,j=v*Wm+u;if(u>=x0&&v>=y0&&u<x1&&v<y1&&!seen[j]&&f(dl[j])){seen[j]=1;st.push(j)}}}if(n>=min)out.push(n)}return out};
  const G=[[5*ts-24,6*ts-24,15*ts+24,11*ts+24,'10 x 5'],[19*ts-24,5*ts-24,23*ts+24,8*ts+24,'4 x 3']],res=[];let good=true;
  for(const [x0,y0,x1,y1,nm] of G){const lit=blobs(v=>v>3,10,x0,y0,x1,y1),sh=blobs(v=>v<-3,10,x0,y0,x1,y1);res.push(nm+': '+lit.length+' lit and '+sh.length+' shaded patches ('+lit.join('/')+', '+sh.join('/')+' px)');if(lit.length>3||sh.length>3||!lit.length||!sh.length)good=false}
  // (seams: the mean change of shading across the tiles' edges inside the big group against across their middles)
  let se=0,sm=0,ns=0;for(let y=7*ts;y<10*ts;y++)for(let tx=6;tx<14;tx++){const e=tx*ts,m=tx*ts+8;se+=Math.abs(dl[y*Wm+e]-dl[y*Wm+e-1]);sm+=Math.abs(dl[y*Wm+m]-dl[y*Wm+m-1]);ns++}
  for(let x=6*ts;x<14*ts;x++)for(let ty=7;ty<10;ty++){const e=ty*ts,m=ty*ts+8;se+=Math.abs(dl[e*Wm+x]-dl[(e-1)*Wm+x]);sm+=Math.abs(dl[m*Wm+x]-dl[(m-1)*Wm+x]);ns++}
  ok(good&&se<=sm*1.25+.2,'a group of hill tiles is one rise: '+res.join('; ')+'; no seam along its tiles\u2019 edges (shading changes '+(se/ns).toFixed(2)+' across them, '+(sm/ns).toFixed(2)+' across their middles)')}
 // ---- a farm's plots (gfx/worldart.js farmPlot, PX.worldCrop; the owner 2026-10-22: "can farmland have actual sprites, like crops
 //      and vegetables?"): a holding's plots of each people and climate drawn through it: its crop by the climate and the people (the
 //      Vale's wheat, the Sylvan Court's herbs and orchards, the Karn's rye and potatoes, terraced, the Ashgor's herd ground; the
 //      desert's irrigated plots with their channel, the frost's rye, turnips and fallow under snow), in rows of plants (the crop's
 //      own tones, soil between), what stands on them (stooks, haystacks, fruit trees, date palms: their navy outline)
 {const people=['vale','sylvan','karn','horde'],cl=['grass','desert','frost','swamp'],tally={},cols={},snowy=[0,0],water=[0,0],stand=[0,0],bad=[];
  const pal=k=>new Set(PX.WORLD_CROPS[k].c1.map(c=>parseInt(c.slice(1,3),16)+','+parseInt(c.slice(3,5),16)+','+parseInt(c.slice(5,7),16)));
  for(const p of people)for(const c of cl){const tw={name:'(a test '+p+')',seed:7,races:[{vale:'human',sylvan:'elf',karn:'dwarf',horde:'orc'}[p]]};t.HOME[tw.name]=p;
   try{for(let k=0;k<60;k++){const tx=10+k%10,ty=10+((k/10)|0),Q=new Map(),kd=t.fieldCrop(tw,tx,ty,c);t.farmPlot(tw,tx,ty,c,c==='frost'?1:0,(x,y)=>y,(col,x,y)=>Q.set(y*16+x,col.map(Math.round).join()));
     const key=p+' '+c;(tally[key]=tally[key]||{})[kd]=(tally[key][kd]||0)+1;const own=pal(kd),vals=[...Q.values()],hit=vals.filter(v=>own.has(v)).length,nv=new Set(vals).size;
     if(Q.size<200||nv<5||(!['orchard','hay','fallow','grazed'].includes(kd)&&hit<12))bad.push(key+' '+kd+' ('+hit+' crop px, '+nv+' colours)');
     if(c==='frost'){snowy[1]++;if(vals.includes('228,234,242'))snowy[0]++}if(kd==='irrigated'){water[1]++;if(vals.includes('120,180,226'))water[0]++}
     if(['wheat','barley','rye','hay','orchard','irrigated'].includes(kd)){stand[1]++;if(vals.includes('26,28,38'))stand[0]++}}}finally{delete t.HOME[tw.name]}}
  const top=key=>Object.entries(tally[key]).sort((a,b)=>b[1]-a[1]).map(e=>e[0]+' '+e[1]).slice(0,3).join(', '),mx=(key,k)=>(tally[key][k]||0);
  const culture=mx('vale grass','wheat')>mx('vale grass','herbs')+mx('vale grass','potato')&&mx('sylvan grass','herbs')+mx('sylvan grass','orchard')>mx('sylvan grass','wheat')&&mx('karn grass','rye')+mx('karn grass','potato')>20&&mx('horde grass','grazed')>20&&mx('vale desert','irrigated')>20&&mx('vale frost','rye')+mx('vale frost','turnips')+mx('vale frost','fallow')===60;
  ok(!bad.length&&culture&&snowy[0]>=snowy[1]*.8&&water[0]===water[1]&&stand[0]>=stand[1]*.5,'a farm\u2019s plots show their crops in rows, by climate and people ('+['vale grass','sylvan grass','karn grass','horde grass','vale desert','vale frost','vale swamp'].map(k=>k+': '+top(k)).join('; ')+'); the frost\u2019s snow in the troughs on '+snowy[0]+' of '+snowy[1]+', the desert\u2019s channel on '+water[0]+' of '+water[1]+', stooks, haystacks, fruit trees or palms standing on '+stand[0]+' of '+stand[1]+(bad.length?' \u2014 not: '+bad.slice(0,5).join('; '):''))}
 // ---- the same map, the same picture; and the time it takes
 {const h=c=>{const d=c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,Wp,Hp).data;let s=0;for(let i=0;i<d.length;i+=28)s=(s*31+d[i])|0;return s},a=h(cv),ms=[];let b=0;
  for(let k=0;k<3;k++){const q=performance.now(),c=t.paintWorld();ms.push(performance.now()-q);if(k===2)b=h(c)}
  ms.sort((x,y)=>x-y);ok(a===b,'painted again, the world is the same picture');
  // (the whole map in one window: the tests' and the wiki's, never the game's, which paints by chunks (worldchunks checks those); the
  // generated world is 4x the old map's area and its art (fords, the frost's snow cover, 2026-10-22) costs more: 10 s, was 6 s)
  ok(ms[1]<10000,'the world paints in '+ms.map(x=>x.toFixed(0)).join(', ')+' ms (median '+ms[1].toFixed(0)+'; nature alone '+t.NATURE.ms.toFixed(0)+' ms)');
  o.push('INFO world paint median '+ms[1].toFixed(0)+' ms, nature '+t.NATURE.ms.toFixed(0)+' ms ('+t.NATURE.t+'); trees '+t.NATURE.trees+', rises '+t.NATURE.hills+', ranges '+t.NATURE.peaks+', rock px '+t.NATURE.rock+', small things '+t.NATURE.decor+' standing / '+t.NATURE.flat+' lying')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
