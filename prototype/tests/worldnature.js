'use strict';
// World nature: the world map's trees, woods, hills, mountains and small things. The engine's sprites (engine/worldnature.js: the
// trees, small things, hills, peaks, crops), each in a power-of-two box at whole pixels, its outline (a shade darker than its body)
// round its silhouette only; the looks seeded (the same again, and told apart by their shapes, not their colours alone). The map's
// own nature since the lab's terrain came (2026-11-15: gfx/worldterrain.js terrainProps, engine/worldflora.js, WORLD_FLORA), on a
// sample of chunks painted fine as the game paints them: woods thick with trees and no bare patch inside one, each climate's own
// species and a few dead, the swamp's sparse trees and its pools' lily pads and reeds, the waterside's trees by the water, the hills
// rising and wooded, the mountains higher and rocky, small things and grass on the open ground, a wood's fringe; nothing on a lot,
// a road or the water; painting reads no Math.random and changes no map data; the climates blended at their edges, their covers a
// tile, their small things mixed; the engine's own mountains and hills on small maps of their own; a farm's crops; a chunk the
// same painted again, and how long it takes.
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
   const d=px(s),A=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&d[(y*N+x)*4+3]===255,nav=(x,y)=>{const i=(y*N+x)*4;return d[i+3]===255&&(s.a?s.a[y*N+x]===2:d[i]===26&&d[i+1]===28&&d[i+2]===38)},body=(x,y)=>A(x,y)&&!nav(x,y),lum=(x,y)=>{const i=(y*N+x)*4;return d[i]*.3+d[i+1]*.59+d[i+2]*.11};
   for(let i=3;i<d.length;i+=4)if(d[i]!==0&&d[i]!==255){soft.push(n);break}
   // (outside: every pixel reached from the box's edge without crossing the body)
   const OUT=new Uint8Array(N*N),st=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if((x===0||y===0||x===N-1||y===N-1)&&!body(x,y)){OUT[y*N+x]=1;st.push(y*N+x)}
   while(st.length){const i=st.pop(),x=i%N,y=(i/N)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=x+a,v=y+b,j=v*N+u;if(u>=0&&v>=0&&u<N&&v<N&&!OUT[j]&&!body(u,v)){OUT[j]=1;st.push(j)}}}
   let bad=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const nb=[[1,0],[-1,0],[0,1],[0,-1]];
     if(s.flat){if(nav(x,y))bad++;continue}
     // (beside the body and outside it, never inside it; a shade darker than the body it borders (engine/pixel.js PX.rim: the owner,
     // 2026-11-07, "the outline should blend with the sprite, a darker shade of it"))
     if(nav(x,y)){const B=nb.filter(([a,b])=>body(x+a,y+b));if(!B.length||!OUT[y*N+x]||lum(x,y)>=B.reduce((m,[a,b])=>m+lum(x+a,y+b),0)/B.length)bad++}
     else if(!A(x,y)&&nb.some(([a,b])=>body(x+a,y+b)))bad++}// (no bare edge: every empty pixel beside the body is outline)
   if(bad)(s.flat?flat:out).push(n+' ('+bad+')')}
 ok(!pow.length,list.length+' nature sprites, each in a power-of-two box with its foot on a whole pixel: '+Object.keys(by).map(k=>k+'x'+k+' '+[...by[k]].join('/')).join(', ')+(pow.length?' — not: '+pow.slice(0,6).join(', '):''));
 ok(!soft.length,'every pixel of every nature sprite fully drawn or not at all'+(soft.length?': '+soft.slice(0,6).join(', '):''));
 ok(!out.length,'the standing ones (trees, bushes, stones, cacti, peaks, stooks, haystacks, fruit trees) wear their outline round their silhouette only, a shade darker than the body it borders: all round the body, never inside it'+(out.length?': '+out.slice(0,6).join(', '):''));
 ok(!flat.length,'what lies on the ground (tufts, flowers, drifts, ripples, reeds, moss, pools, pads, floes, hills, a field’s crops) has no outline'+(flat.length?': '+flat.slice(0,6).join(', '):''));
 // ---- seeded: drawn afresh, every one the same; the variants of a kind told apart by their shapes
 {const keep=list.map(([n,s])=>[n,px(s).join()]);PX.worldNatureReset();const again=all(),diff=keep.filter(([n,h],i)=>again[i][0]!==n||px(again[i][1]).join()!==h).map(([n])=>n);
  ok(!diff.length&&again[0][1]!==list[0][1],list.length+' sprites drawn afresh come out pixel for pixel the same (seeded, no Math.random)'+(diff.length?': '+diff.slice(0,6).join(', '):''));
  const mask=s=>{const d=px(s);let k='';for(let i=3;i<d.length;i+=4)k+=d[i]?1:0;return k},same=[];
  for(const c of CL){for(const sp of PX.WORLD_SPECIES[c]){const m=[0,1,2,3].map(v=>mask(PX.worldTree(c,sp,v,0)));if(new Set(m).size<4)same.push(c+' '+sp)}
    for(const n of [16,32,64]){const m=[0,1,2,3,4,5].map(v=>mask(PX.worldPeak(c,v,n)));if(new Set(m).size<(n===16?2:6))same.push(c+' peak '+n)}
    {const z=[0,1,2,3,4,5].map(v=>Array.from(PX.worldHill(c,v).z).map(q=>q.toFixed(1)).join());if(new Set(z).size<6)same.push(c+' hill')}}
  ok(!same.length,'each species’ four trees, each box’s peaks and the six hills differ in shape, not only in colour'+(same.length?': '+same.join(', '):''))}
 // ---- the map's nature, a chunk at a time (gfx/worldterrain.js terrainProps: the world lab's, engine/worldflora.js, WORLD_FLORA,
 //      since the lab's terrain came in, 2026-11-15; the old painter, PX.worldNatureSteps, paints the map no more): a sample of
 //      chunks painted fine, as the game paints them (r 2): those with the most of each climate's edge with the grass, of each
 //      climate's woods, of mountains and of hills. Never on water, a road, a lot; no Math.random; the map data untouched
 ok(PX.WN_KIND.open===t.T_OPEN&&PX.WN_KIND.forest===t.T_FOREST&&PX.WN_KIND.hill===t.T_HILL&&PX.WN_KIND.water===t.T_WATER&&PX.WN_KIND.road===t.T_ROAD&&PX.WN_KIND.mount===t.T_MOUNT,'the engine’s tile kinds are the game’s own codes');
 ok(['paintTree','paintHill','drawPeak','paintDecor','paintMountain','bigPeakAt','paintBigPeak','peakFits','ROCK_RGB','anyClear'].every(n=>(0,eval)('typeof '+n)==='undefined')&&!/PX\.worldNatureSteps/.test(t.paintSteps.toString())&&/terrainChunk/.test(t.paintSteps.toString())&&/terrainProps/.test(t.terrainChunk.toString()),'the old trees, hills, peaks and small things are gone: the land’s nature is the lab’s, painted with its ground a chunk at a time (terrainChunk, terrainProps)');
 const WA=t.WorldArt,WF=t.WORLD_FLORA,CS=t.CLIMS,FL=PX.flora,KN=['open','forest','hill','water','road','mount','ford'],sum=a=>{let h=0;for(let i=0;i<a.length;i++)h=(h*31+a[i])|0;return h},tiles0=sum(t.tiles),clim0=sum(t.climate);
 const pick=new Map();{const C=[];for(let cy=0;cy<WA.rows;cy++)for(let cx=0;cx<WA.cols;cx++){const [X,Y,w,h]=WA.rect(cx,cy),s={cx,cy,f:[0,0,0,0],hill:0,mount:0,e:{}};
   for(let ty=Y>>4;ty<(Y+h)>>4;ty++)for(let tx=X>>4;tx<(X+w)>>4;tx++){const i=ty*MW+tx,k=t.tiles[i];if(k===t.T_FOREST)s.f[t.climate[i]]++;if(k===t.T_HILL)s.hill++;if(k===t.T_MOUNT)s.mount++;
    if(CS[t.climate[i]]==='grass'&&tx+1<MW){const d=CS[t.climate[i+1]];s.e[d]=(s.e[d]||0)+1}}C.push(s)}
  const top=f=>{const s=C.slice().sort((a,b)=>f(b)-f(a))[0];if(f(s)>0)pick.set(s.cy*WA.cols+s.cx,s)};
  for(const c of ['frost','swamp','desert'])top(s=>s.e[c]||0);for(let c=0;c<4;c++)top(s=>s.f[c]);top(s=>s.mount);top(s=>s.hill)}
 // (painted: each tree's species by the climate whose look it was drawn in (FL.look: WORLD_FLORA.look), kept by its picture)
 let rnd=0;const r0=Math.random,tp=FL.treePic,SPC=new WeakMap(),drawn={},recs=[],ms=[];Math.random=function(){rnd++;return r0.apply(this,arguments)};
 FL.treePic=function(k){const o=tp.apply(this,arguments),c=CS.find(q=>WF.look[q]===FL.look);if(o&&o.img)SPC.set(o.img,[c,k]);(drawn[c]=drawn[c]||{})[k]=(drawn[c][k]||0)+1;return o};
 try{for(const s of pick.values()){const [X,Y,w,h]=WA.rect(s.cx,s.cy),cv=document.createElement('canvas');cv.width=w;cv.height=h;const rec={fine:2},q=performance.now();
   t.runGen(t.paintSteps(WA.ensure(),X,Y,w,h,cv.getContext('2d',{willReadFrequently:true}),0,0,rec));ms.push(performance.now()-q);recs.push({s,X,Y,w,h,rec})}}
 finally{Math.random=r0;FL.treePic=tp}
 ok(rnd===0&&sum(t.tiles)===tiles0&&sum(t.climate)===clim0&&recs.length>=6,'painting '+recs.length+' chunks ('+recs.map(R=>R.s.cx+','+R.s.cy).join(' ')+') reads no Math.random ('+rnd+') and leaves the map’s tiles and climates as they were');
 ok(recs.every(R=>R.rec.fcv&&R.rec.fcv.getContext('2d').imageSmoothingEnabled===false),'their fine pictures are painted without smoothing');
 // (each tile of the sample: its climate and kind, what stands on it by kind, its lift (rec.lift: fine px a game px, its middles))
 const TL={},prop=[],cnt=(i,k)=>{const o=TL[i]||(TL[i]={});o[k]=(o[k]||0)+1};
 for(const R of recs){const {X,Y,w,h,rec}=R;for(const p of rec.props){prop.push(p);cnt((Math.floor(p.y)>>4)*MW+(Math.floor(p.x)>>4),p.kind)}
  for(let ty=Y>>4;ty<(Y+h)>>4;ty++)for(let tx=X>>4;tx<(X+w)>>4;tx++){const o=TL[ty*MW+tx]||(TL[ty*MW+tx]={});o.in=1;o.lift=rec.lift[((ty*TILE+8-Y)*w)+tx*TILE+8-X]}}
 const tiles=[];for(const i in TL){const o=TL[i];if(!o.in)continue;const tx=i%MW,ty=(i-tx)/MW;if(tx<1||ty<1||tx>=MW-1||ty>=MH-1)continue;const k=t.tiles[i],nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>(ty+b)*MW+tx+a);
  tiles.push({i:+i,tx,ty,o,k,c:CS[t.climate[i]],lot:t.occAt(tx,ty)>0,inner:nb.every(j=>t.tiles[j]===k&&t.occAt(j%MW,(j-j%MW)/MW)<=0)})}
 const per=(L,f)=>L.reduce((a,T0)=>a+f(T0.o),0)/Math.max(1,L.length),tr=o=>o.tree||0,LOW=['stone','flowers','agave','bones','fern','mushroom','log','stump','bush'],low=o=>LOW.reduce((a,k)=>a+(o[k]||0),0);
 // ---- each climate's woods stand thick with trees, as WORLD_FLORA has it (its woods' chance a cell of WF.step fine px, 40% of it a
 //      tree: some 3 a tile in the grass and the frost, 2.5 in the swamp), and no bare patch inside one: every 2 x 2 tiles of a wood's
 //      inside with a tree (the owner 2026-10-22: "a 1-tile forest with 1 tree")
 {const cells=(2*TILE/WF.step)**2,res=[],bare=[];let blocks=0;
  for(const c of ['grass','frost','swamp']){const L=tiles.filter(q=>q.k===t.T_FOREST&&q.c===c&&!q.lot);if(L.length<50)continue;const m=per(L,tr),want=WF.chance[c].woods*.4*cells;res.push([m>=want*.75,c+' '+m.toFixed(2)+' a tile ('+L.length+' tiles; the table’s '+want.toFixed(2)+')'])}
  const W=new Map(tiles.map(q=>[q.i,q]));for(const q of tiles){if(q.k!==t.T_FOREST||!q.inner)continue;const B=[q.i,q.i+1,q.i+MW,q.i+MW+1].map(j=>W.get(j));if(!B.every(b=>b&&b.k===t.T_FOREST&&b.inner))continue;blocks++;if(!B.some(b=>b.o.tree)&&bare.length<6)bare.push(q.tx+','+q.ty)}
  ok(res.length>=3&&res.every(r=>r[0])&&blocks>200&&!bare.length,'the woods stand thick with trees: '+res.map(r=>r[1]).join(', ')+'; every one of '+blocks+' blocks of 2 x 2 tiles inside a wood with a tree'+(bare.length?' — not at '+bare.join(' '):''))}
 // ---- the swamp's open ground stands with sparse trees (a third of its woods' at most); the swamp's woods its own (bog trees,
 //      alders, willows), its pools showing among them with lily pads and reeds
 {const o=tiles.filter(q=>q.k===t.T_OPEN&&q.c==='swamp'&&!q.lot),w=tiles.filter(q=>q.k===t.T_FOREST&&q.c==='swamp'&&!q.lot),f=per(o,tr),wd=per(w,tr),lily=prop.filter(p=>p.kind==='lily'),reeds=prop.filter(p=>p.kind==='reeds');
  ok(o.length>50&&f>.03&&f<wd/3,'the swamp’s open ground ('+o.length+' tiles) stands with sparse trees: '+f.toFixed(2)+' a tile, against its woods’ '+wd.toFixed(2));
  const sw=lily.filter(p=>CS[t.terClimate(Math.floor(p.x),Math.floor(p.y))]==='swamp').length;
  ok(lily.length>10&&reeds.length>10&&sw===lily.length,'the swamp’s pools show with '+lily.length+' lily pads ('+sw+' of them in the swamp) and '+reeds.length+' reeds')}
 // ---- the trees by climate (WORLD_FLORA.trees: each climate's own, by where they stand: lowland, waterside, hills, mountain, a
 //      village's), a few dead among the living
 {const own=[],dead=[];for(const c in drawn){const K=new Set(Object.values(WF.trees[c]).flatMap(z=>Object.keys(z)));for(const k in drawn[c])if(!K.has(k))own.push(c+' '+k+' '+drawn[c][k])}
  for(const c of ['grass','frost','swamp']){const D=drawn[c]||{},n=Object.values(D).reduce((a,v)=>a+v,0);dead.push([c,n,D.dead||0])}
  ok(!own.length&&dead.every(([c,n,d])=>n>200&&d>0&&d<n*.3),'each climate’s trees its own ('+Object.keys(drawn).map(c=>c+': '+Object.keys(drawn[c]).join('/')).join('; ')+'), a few dead among them: '+dead.map(([c,n,d])=>c+' '+d+' of '+n).join(', ')+(own.length?' — not their own: '+own.slice(0,6).join(', '):''))}
 // ---- the waterside's trees by the water: the grass's willows and alders (its waterside's) within 2 tiles of a river, a lake or the sea
 {let n=0,by=0;const wet=(tx,ty)=>{for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(t.tAt(tx+a,ty+b)===t.T_WATER)return true;return false};
  for(const p of prop){const s=SPC.get(p.s);if(!s||s[0]!=='grass'||!['willow','alder'].includes(s[1]))continue;n++;if(wet(Math.floor(p.x)>>4,Math.floor(p.y)>>4))by++}
  ok(n>20&&by>=n*.8,'the grass’s willows and alders stand by the water: '+by+' of '+n+' within 2 tiles of it')}
 // ---- the hills rise and the mountains stand higher (the land's lift, fine px); the hills more wooded than open ground, the
 //      mountains rocky (boulders and stones a tile more than on open ground or a hill)
 {const g=k=>tiles.filter(q=>q.k===k&&q.c==='grass'&&!q.lot),O=g(t.T_OPEN),H=g(t.T_HILL),M=g(t.T_MOUNT),lf=L=>per(L,o=>o.lift||0),rk=o=>(o.rock||0)+(o.stone||0);
  ok(O.length>100&&H.length>50&&M.length>20&&lf(H)>lf(O)&&lf(M)>lf(H),'the hills rise ('+H.length+' tiles, lifted '+lf(H).toFixed(1)+' fine px), the mountains higher ('+M.length+': '+lf(M).toFixed(1)+'), over open ground ('+lf(O).toFixed(1)+')');
  ok(per(H,tr)>per(O,tr)*1.5&&per(M,rk)>per(O,rk)*3&&per(M,rk)>per(H,rk),'the hills more wooded ('+per(H,tr).toFixed(2)+' trees a tile, open ground '+per(O,tr).toFixed(2)+'), the mountains rocky ('+per(M,rk).toFixed(2)+' boulders and stones a tile, a hill '+per(H,rk).toFixed(2)+', open ground '+per(O,rk).toFixed(2)+')')}
 // ---- small things on the open ground (bushes, stones, flowers, ferns, logs, stumps, agaves, bones) and the grass's clumps
 {const O=tiles.filter(q=>q.k===t.T_OPEN&&!q.lot),cl=recs.reduce((a,R)=>a+R.rec.grass.n,0),kinds={};for(const p of prop)if(LOW.includes(p.kind))kinds[p.kind]=(kinds[p.kind]||0)+1;
  ok(O.length>500&&per(O,low)>.2&&cl>O.length*5,'small things on the open ground: '+per(O,low).toFixed(2)+' a tile ('+Object.entries(kinds).map(([k,v])=>k+' '+v).join(', ')+'), '+cl+' clumps of grass over the sample')}
 // ---- a wood's fringe: open grass beside a wood stands with more (trees, bushes) than farther off (its edge ragged: terWood's warp),
 //      thinned out two tiles off to the open ground's own (within a fifth of it far from any wood)
 {const n=[[0,0],[0,0],[0,0]],F=(tx,ty,r)=>{for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++)if(t.tAt(tx+a,ty+b)===t.T_FOREST)return true;return false};
  for(const q of tiles){if(q.k!==t.T_OPEN||q.c!=='grass'||q.lot)continue;const k=F(q.tx,q.ty,1)?0:F(q.tx,q.ty,2)?1:F(q.tx,q.ty,5)?-1:2;if(k<0)continue;n[k][0]++;n[k][1]+=tr(q.o)+(q.o.bush||0)}
  const m=n.map(([a,b])=>a?b/a:0);ok(n[0][0]>50&&n[1][0]>50&&n[2][0]>50&&m[0]>m[1]*1.5&&m[0]>m[2]*1.5&&Math.abs(m[1]-m[2])<=m[2]*.2,'a wood’s fringe: open grass beside a wood stands with '+m[0].toFixed(2)+' trees and bushes a tile, two tiles off '+m[1].toFixed(2)+', far from any wood '+m[2].toFixed(2))}
 // ---- nothing on a lot, a road or the water: every thing's foot off a holding's lots, off a road's surface and a river's water
 //      (the ways as drawn: worldways.js waysOf, their half-widths), off the open sea and the lakes; the lily pads alone on the water
 {const WY=t.waysOf(WA.ensure()),off=(A,x,y)=>{let d=1e9;for(let o=0;o<A.length;o+=6){const ax=A[o],ay=A[o+1],dx=A[o+2]-ax,dy=A[o+3]-ay,l2=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),ex=x-ax-dx*u,ey=y-ay-dy*u;d=Math.min(d,Math.sqrt(ex*ex+ey*ey)-(A[o+4]+(A[o+5]-A[o+4])*u))}return d};
  // (under a bridge's open span the road is its deck, over the river's banks: worldways.js bridgeOpen, WORLD_WAYS.bridge.abut; read
  // at the fine px's middle, as the painter reads it: half a px of slack)
  const ab=t.WORLD_WAYS.bridge.abut,under=(x,y)=>(WY.bridges||[]).some(q=>{const hl=q.L/2-ab,dx=x-q.mx,dy=y-q.my;return hl>0&&Math.abs(dx*q.ux+dy*q.uy)<hl+.5&&Math.abs(dy*q.ux-dx*q.uy)<q.hw+3});
  const sea=(tx,ty)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const i=(ty+b)*MW+tx+a;if(t.tAt(tx+a,ty+b)!==t.T_WATER||t.WM.river[i]&3)return false}return true};
  const bad={lot:[],road:[],river:[],sea:[]},deck={};let n=0;
  for(const p of prop){if(p.kind==='lily')continue;n++;const tx=Math.floor(p.x)>>4,ty=Math.floor(p.y)>>4,at=Math.round(p.x)+','+Math.round(p.y);
   if(t.occAt(tx,ty)>0&&bad.lot.length<4)bad.lot.push(at);if(off(WY.RA,p.x,p.y)<0){if(under(p.x,p.y))deck[p.kind]=(deck[p.kind]||0)+1;else if(bad.road.length<4)bad.road.push(at+' '+p.kind)}if(off(WY.SA,p.x,p.y)<0&&bad.river.length<4)bad.river.push(at);if(sea(tx,ty)&&bad.sea.length<4)bad.sea.push(at)}
  ok(n>5000&&Object.values(bad).every(L=>!L.length),n+' things standing or lying on the land, none on a lot, a road’s surface, a river’s water or the open water (under a bridge’s deck, on its banks: '+(Object.entries(deck).map(([k,v])=>k+' '+v).join(', ')||'none')+')'+(Object.values(bad).some(L=>L.length)?' — '+Object.entries(bad).filter(([k,L])=>L.length).map(([k,L])=>k+': '+L.join(' ')).join('; '):''))}
 // ---- the climates blended at their edges (worldterrain.js terClimate: the climate each px is painted and its nature drawn by, a
 //      warp of the tiles' climates; the owner's play-tests: no blocks between climates): the frost's, the swamp's and the desert's own
 //      in patches over the grass beside it (over 3%, under 45%), more over its own edge, whole deep in it (4 tiles in: over 90%),
 //      none on grass far from it (under 1%)
 {const res=[];for(const c of ['frost','swamp','desert']){const Ci=CS.indexOf(c),G=CS.indexOf('grass'),dist=(tx,ty,cc)=>{for(let r=1;r<=7;r++)for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<MW&&y<MH&&t.climate[y*MW+x]===cc)return r}return 9};
   const n=[[0,0],[0,0],[0,0],[0,0],[0,0]];for(let ty=2;ty<MH-2;ty++)for(let tx=2;tx<MW-2;tx++){const cc=t.climate[ty*MW+tx];let k=-1;if(cc===G){const r=dist(tx,ty,Ci);k=r===1?0:r>7?2:-1}else if(cc===Ci){const r=dist(tx,ty,G);k=r===1?3:r>=5?4:-1}if(k<0||n[k][0]>4000)continue;
    for(let y=2;y<16;y+=4)for(let x=2;x<16;x+=4){n[k][0]++;if(t.terClimate(tx*TILE+x,ty*TILE+y)===Ci)n[k][1]++}}
   const M=n.map(([a,b])=>a?b/a:0);res.push([[0,2,3,4].every(k=>n[k][0]>100)&&M[2]<.01&&M[0]>.03&&M[0]<.45&&M[3]>M[0]+.15&&M[3]<.95&&M[4]>.9,c+': '+[2,0,3,4].map(k=>(M[k]*100).toFixed(0)+'%').join(' / ')])}
  ok(res.every(r=>r[0]),'the climates blend at their edges (far grass / grass beside / its own edge / 4 tiles in): '+res.map(r=>r[1]).join('; '))}
 // ---- the plan's covers a tile (gfx/worldart.js: the snow's and the swamp's and the desert's, what the map's game-px ground reads):
 //      every tile of its climate .55 or more, every other's .45 at most
 {const PL=WA.ensure(),res=[];for(const [c,S] of [['frost',PL.snow],['desert',PL.cover.desert],['swamp',PL.cover.swamp]]){const C=CS.indexOf(c);let lo=0,hi=0;for(let i=0;i<MW*MH;i++){if(t.climate[i]===C&&S[i]<.55)lo++;if(t.climate[i]!==C&&S[i]>.45)hi++}res.push([!lo&&!hi,c+' '+lo+', '+hi+' off'])}
  ok(res.every(r=>r[0]),'the climates’ covers a tile: their own .55 or more, the others’ .45 at most ('+res.map(r=>r[1]).join('; ')+')')}
 // ---- their small things mixed across the edge (PX.worldNatureMix, PX.WN_MIX): a grass tile beside the swamp or the desert has
 //      theirs now and then (pools, reeds, moss; ripples, cacti, scrub), fewer farther out, none far off; theirs the grass's at their edge
 {const PN=WA.ensure().nature,R={};
  for(const cn of ['swamp','desert']){const C=t.CLIMS.indexOf(cn),G=t.CLIMS.indexOf('grass'),dist=(tx,ty,c)=>{for(let r=1;r<=6;r++)for(let b=-r;b<=r;b++)for(let a=-r;a<=r;a++){const x=tx+a,y=ty+b;if(x>=0&&y>=0&&x<MW&&y<MH&&t.climate[y*MW+x]===c)return r}return 9};
   const n=[[0,0],[0,0],[0,0],[0,0]];for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const c=t.climate[ty*MW+tx];if(t.tiles[ty*MW+tx]!==t.T_OPEN)continue;
    if(c===G){const r=dist(tx,ty,C),k=r===1?0:r===3?1:r>6?2:-1;if(k<0)continue;n[k][0]++;if(PX.worldNatureMix(PN,'grass',tx,ty)===cn)n[k][1]++}
    else if(c===C&&dist(tx,ty,G)===1){n[3][0]++;if(PX.worldNatureMix(PN,cn,tx,ty)==='grass')n[3][1]++}}
   R[cn]=n.map(([a,b])=>a?b/a:0)}
  ok(['swamp','desert'].every(c=>R[c][0]>.15&&R[c][0]<.6&&R[c][1]<R[c][0]&&R[c][2]===0&&R[c][3]>.1&&R[c][3]<.6),'the swamp’s and the desert’s small things mixed across their edge: '+['swamp','desert'].map(c=>c+' '+R[c].slice(0,3).map(v=>Math.round(v*100)+'%').join(' / ')+' of the grass 1, 3 and 7+ tiles off, the grass’s on '+Math.round(R[c][3]*100)+'% of its edge').join('; '))}
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
   // (the foot: the rock's lowest px nearer the ground's colour under them than with PX.WN_MOUNT.foot off, on each side of the edge;
   // 88%, was 95%, since 2026-11-07: the outline round the foot a shade of the blended rock beside it (PX.rim), not navy, so it
   // changes with the foot too, not always toward the ground)
   const GR={grass:[['granite',1]],frost:[['granite',1]],desert:[['granite',1]],swamp:[['granite',1]]},r3=paint(plan(GR,cov)),F0=PX.WN_MOUNT.foot,fd=[0,0],fn=[0,0];
   PX.WN_MOUNT.foot=[0,0];let r4;try{r4=paint(plan(GR,cov))}finally{PX.WN_MOUNT.foot=F0}
   const gd=(D,o,g)=>Math.abs(D[o]-g[0])+Math.abs(D[o+1]-g[1])+Math.abs(D[o+2]-g[2]);
   for(let i=0;i<Wm*Hm;i++){const o=i*4;if(r3.D[o]===r4.D[o]&&r3.D[o+1]===r4.D[o+1]&&r3.D[o+2]===r4.D[o+2])continue;const sd=clim[((i/Wm/ts)|0)*C+((i%Wm)/ts|0)]?1:0;fn[sd]++;if(gd(r3.D,o,sd?GD:G0)<gd(r4.D,o,sd?GD:G0))fd[sd]++}
   ok(mixed>pts*.1&&w[2]>w[1]+8&&w[1]>w[0]+8&&d[0]>d[1]&&d[1]>d[2]&&d[2]<d[0]*.15&&fn[0]>40&&fn[1]>40&&fd[0]>=fn[0]*.88&&fd[1]>=fn[1]*.88,'a range across a climate’s edge blends with both: its look mixed at '+mixed+' of '+pts+' points, warmer toward the desert (red over blue '+w.map(v=>v.toFixed(0)).join(' / ')+' grass, edge, desert), a forested look’s trees thinning out toward it ('+d.join(' / ')+'), its foot leaning to each side’s ground (nearer it at '+fd.join(' / ')+' of '+fn.join(' / ')+' foot pixels, grass / desert)')}
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
 // ---- the same chunk, the same picture; and the time a chunk takes (the game paints them in the background, a few ms a frame:
 //      worldchunks checks that; here a chunk painted fine at once)
 {const R=recs[0],h=R0=>{const f=R0.fcv,d=f.getContext('2d',{willReadFrequently:true}).getImageData(0,0,f.width,f.height).data;let s=0;for(let i=0;i<d.length;i+=12)s=(s*31+d[i])|0;for(const p of R0.props)s=(s*31+Math.round(p.x*8)+Math.round(p.y*8)*7)|0;return s};
  const cv=document.createElement('canvas');cv.width=R.w;cv.height=R.h;const rec={fine:2};t.runGen(t.paintSteps(WA.ensure(),R.X,R.Y,R.w,R.h,cv.getContext('2d',{willReadFrequently:true}),0,0,rec));
  ok(h(R.rec)===h(rec)&&R.rec.props.length===rec.props.length,'painted again, a chunk is the same picture with the same things on it ('+rec.props.length+')');
  const s=ms.slice().sort((a,b)=>a-b),med=s[s.length>>1];
  ok(med<8000,'a chunk paints fine in '+s.map(x=>x.toFixed(0)).join(', ')+' ms (median '+med.toFixed(0)+')')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
