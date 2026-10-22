'use strict';
// World nature: the world map's trees, woods, hills, mountain ranges and small things (engine/worldnature.js). Every generator's
// sprite sits in a power-of-two box at whole pixels, its navy outline round its silhouette only; the looks are seeded (the same
// again, and told apart by their shapes, not their colours alone); the map's woods, hills and ranges are painted with them; nothing
// is painted on a road, a holding, an estate or water (but lily pads and floes); painting reads no Math.random and changes no map
// data; the fen's sparse mangroves and the frost's snow blended into the grass (the owner's play-test, 2026-10-22); and how long
// the world takes to paint.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,TILE=t.TILE,MW=t.MW,MH=t.MH,Wp=MW*TILE,Hp=MH*TILE,CL=['grass','frost','desert','swamp'];t.act('begin','soldier');t.G.quietEvents=true;
 // ---- every generator's sprites
 const all=()=>{const L=[];for(const c of CL){for(const sp of PX.WORLD_SPECIES[c])for(let v=0;v<4;v++)for(const dim of [0,1])L.push(['tree '+c+' '+sp+' '+v+(dim?' dim':''),PX.worldTree(c,sp,v,dim)]);
   for(const k of PX.WORLD_DECOR[c].concat(PX.WORLD_DECOR.water))for(let v=0;v<4;v++)L.push(['decor '+c+' '+k+' '+v,PX.worldDecor(c,k,v)]);
   for(let v=0;v<6;v++){L.push(['hill '+c+' '+v,PX.worldHill(c,v)]);for(const n of [16,32,64])L.push(['peak '+c+' '+n+' '+v,PX.worldPeak(c,v,n)])}}return L};
 const list=all(),px=s=>s.getContext('2d').getImageData(0,0,s.width,s.height).data,by={};
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
 ok(!out.length,'the standing ones (trees, bushes, stones, cacti, peaks) wear the navy outline round their silhouette only: all round the body, never inside it'+(out.length?': '+out.slice(0,6).join(', '):''));
 ok(!flat.length,'what lies on the ground (tufts, flowers, drifts, ripples, reeds, moss, pools, pads, floes, hills) has no outline'+(flat.length?': '+flat.slice(0,6).join(', '):''));
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
 let rnd=0;const r0=Math.random;Math.random=function(){rnd++;return r0.apply(this,arguments)};let cv;try{cv=t.paintWorld()}finally{Math.random=r0;(0,eval)('NATURE_TOUCH=null')}
 const N=t.NATURE,CLR=t.CLEAR,cnt=k=>{let n=0;for(let i=0;i<MW*MH;i++)if(t.tiles[i]===k)n++;return n},nF=cnt(t.T_FOREST),nH=cnt(t.T_HILL),nM=cnt(t.T_MOUNT);
 ok(rnd===0&&sum(t.tiles)===tiles0&&sum(t.climate)===clim0,'painting the world reads no Math.random ('+rnd+') and leaves the map’s tiles and climates as they were');
 ok(cv.getContext('2d').imageSmoothingEnabled===false,'the world canvas is painted without smoothing');
 const share=k=>{let n=0,m=0;for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(t.tiles[ty*MW+tx]!==k)continue;for(let y=1;y<TILE;y+=3)for(let x=1;x<TILE;x+=3){const i=(ty*TILE+y)*Wp+tx*TILE+x;if(CLR.at(tx*TILE+x,ty*TILE+y))continue;m++;if(TO[i])n++}}return m?n/m:0};
 const sF=share(t.T_FOREST),sH=share(t.T_HILL),sM=share(t.T_MOUNT);
 ok(N&&N.trees>=nF*3.5&&sF>.9,nF+' wood tiles stand thick with trees ('+(N&&N.trees)+' trees, '+(N&&(N.trees/nF).toFixed(1))+' a tile), '+Math.round(sF*100)+'% of their ground painted');
 ok(N&&N.hills>=nH*.3&&sH>.5,nH+' hill tiles rise ('+(N&&N.hills)+' rises), '+Math.round(sH*100)+'% of their ground shaded');
 ok(N&&N.peaks>=1&&N.rock>=nM*120&&sM>.7,nM+' mountain tiles stand as '+(N&&N.peaks)+' ranges ('+(N&&N.rock)+' px of rock), '+Math.round(sM*100)+'% of their ground painted');
 ok(N&&N.decor>200&&N.flat>500,'small things on the open ground: '+(N&&N.decor)+' standing (bushes, stones, cacti, stumps), '+(N&&N.flat)+' lying (tufts, flowers, drifts, ripples, reeds, moss, pools, pads, floes)');
 {let onClear=0,onWater=0,offWater=0,lots=0,roads=0,n=0;
  const water=(x,y)=>t.tAt(x>>4,y>>4)===t.T_WATER;
  for(let y=0;y<Hp;y++)for(let x=0;x<Wp;x++){const i=y*Wp+x,v=TO[i];if(!v)continue;n++;if(CLR.at(x,y))onClear++;if(v===1&&water(x,y))onWater++;if(v===2&&!water(x,y))offWater++}
  for(const tw of t.TOWNS)for(const l of tw.lots||[]){for(let j=0;j<l.n*TILE;j++)for(let i=0;i<l.n*TILE;i++)if(TO[(l.y*TILE+j)*Wp+l.x*TILE+i])lots++;for(const [px2,py2] of l.plots||[])for(let j=0;j<TILE;j++)for(let i=0;i<TILE;i++)if(TO[(py2*TILE+j)*Wp+px2*TILE+i])lots++}
  for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++)if(t.tiles[ty*MW+tx]===t.T_ROAD)for(let j=6;j<10;j++)for(let i=6;i<10;i++)if(TO[(ty*TILE+j)*Wp+tx*TILE+i]&&CLR.at(tx*TILE+i,ty*TILE+j))roads++;
  ok(n>1e6&&!onClear&&!lots&&!roads,'nature painted '+n+' pixels, none on a road, a holding’s yard or building, an estate’s plot or a field ('+onClear+' on clear ground, '+lots+' on a lot, '+roads+' on a road)');
  ok(!onWater&&!offWater,'nothing on the water but its lily pads and floes, and those only on water ('+onWater+', '+offWater+')')}
 // ---- the fen's own trees: mangroves on its open ground, sparse (some .6 a tile, about a third of a wood's cover)
 {let nS=0;for(let i=0;i<MW*MH;i++)if(t.tiles[i]===t.T_OPEN&&t.CLIMS[t.climate[i]]==='swamp')nS++;const f=N.fen/Math.max(1,nS),wd=(N.trees-N.fen)/Math.max(1,nF);
  ok(nS&&f>.3&&f<1&&f<wd/3,'the swamp’s open ground ('+nS+' tiles) stands with sparse mangroves: '+N.fen+' ('+f.toFixed(2)+' a tile, against a wood’s '+wd.toFixed(1)+')')}
 // ---- the frost blended: the snow's cover (gfx/worldart.js snowCover) thins out over the grass beside the frost in patches, rises
 //      over the frost's edge and lies whole deep in it; no grass far from it is touched (snow: a pale blue-white pixel)
 {const S=t.WorldArt.ensure().snow,d=cv.getContext('2d').getImageData(0,0,Wp,Hp).data,F=t.CLIMS.indexOf('frost'),G=t.CLIMS.indexOf('grass');
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
 // ---- the oasis: palms only by a small water in the desert
 {let near=0,far=0;const P2=new Set();for(let v=0;v<4;v++){const s=PX.worldTree('desert','palm',v,0);for(let i=0;i<s.a.length;i++)if(s.a[i]===1)P2.add(s.rgb[i*3]+','+s.rgb[i*3+1]+','+s.rgb[i*3+2])}
  const d=cv.getContext('2d').getImageData(0,0,Wp,Hp).data;
  for(let ty=1;ty<MH-1;ty++)for(let tx=1;tx<MW-1;tx++){if(t.CLIMS[t.climate[ty*MW+tx]]!=='desert'||t.tiles[ty*MW+tx]!==t.T_OPEN)continue;let hit=0;for(let j=0;j<TILE&&!hit;j+=2)for(let i=0;i<TILE;i+=2){const o4=((ty*TILE+j)*Wp+tx*TILE+i)*4;if(P2.has(d[o4]+','+d[o4+1]+','+d[o4+2])){hit=1;break}}
    if(!hit)continue;let wet=false;for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(t.tAt(tx+a,ty+b)===t.T_WATER)wet=true;if(wet)near++;else far++}
  ok(far<=near*.1+2,'the desert’s palms stand by water (tiles showing palms: '+near+' by water, '+far+' not)')}
 // ---- the same map, the same picture; and the time it takes
 {const h=c=>{const d=c.getContext('2d').getImageData(0,0,Wp,Hp).data;let s=0;for(let i=0;i<d.length;i+=28)s=(s*31+d[i])|0;return s},a=h(cv),ms=[];let b=0;
  for(let k=0;k<3;k++){const q=performance.now(),c=t.paintWorld();ms.push(performance.now()-q);if(k===2)b=h(c)}
  ms.sort((x,y)=>x-y);ok(a===b,'painted again, the world is the same picture');
  // (the whole map in one window: the tests' and the wiki's, never the game's, which paints by chunks (worldchunks checks those); the
  // generated world is 4x today's area and its art (fords, the frost's snow cover, 2026-10-22) costs more: 10 s there, 6 s today)
  ok(ms[1]<(t.WORLD.gen?10000:6000),'the world paints in '+ms.map(x=>x.toFixed(0)).join(', ')+' ms (median '+ms[1].toFixed(0)+'; nature alone '+t.NATURE.ms.toFixed(0)+' ms)');
  o.push('INFO world paint median '+ms[1].toFixed(0)+' ms, nature '+t.NATURE.ms.toFixed(0)+' ms ('+t.NATURE.t+'); trees '+t.NATURE.trees+', rises '+t.NATURE.hills+', ranges '+t.NATURE.peaks+', rock px '+t.NATURE.rock+', small things '+t.NATURE.decor+' standing / '+t.NATURE.flat+' lying')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
