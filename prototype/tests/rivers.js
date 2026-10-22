'use strict';
// The generated rivers (doc/WORLD_DESIGN.md §6.6, §8.5; Phase 2's rows of §14.2), on the classic world and a few seeds at Normal
// and Large (worldgen.js genWorld): water all along, 4 ways joined (no gap to slip through), never uphill, each ending in water;
// the flow's way down each; width following flow (never narrowing downstream but in a delta, rivers carrying a river's flow, great
// rivers of Strahler order 4 and up); deltas fanning over 8-16 tiles; navigable runs unbroken but at rapids; floodplain beside
// rivers; lakes and basins; every brook running on into water (the owner's fourth play-test: no stream ending dry); seasonal flags by climate (frost all but great rivers, desert wadis, swamp streams and deltas, about
// 30% of grass streams), none with the seasonal setting off. The desert's water (the owner's fifth play-test): no stream rising
// there, no brook on its land, every tile of it near water (oases); ponds; every brook's head with a source (stage 5b). Phase 5's rows (riverState, crossings by season, tolls, passage,
// barges) come with their phases. The classic seed's great river (§8.15, CLASSIC_HINTS stonebridge): past Stonebridge's anchor, fed
// from the northern peaks, out to the southern sea.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,hold=new Map();
try{
 const worlds=[['classic',t.classicSettings()],...['1','2','3','4','5'].map(s=>['normal '+s,{preset:'normal',seed:s}]),['large 1',{preset:'large',seed:'1'}]].map(([n,s])=>{const r=t.genWorld(s);hold.set(r.map,r.holdings);return[n,r.map]});
 const W8=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],step=(m,a,b)=>{const ax=a%m.w,bx=b%m.w;return[bx-ax,(b-bx-(a-ax))/m.w]};
 const bad={water:[],gap:[],up:[],mouth:[],dir:[],narrow:[],flow:[],great:[],nav:[],flood:[],lake:[],basin:[],brook:[]};let rivers=0,deltas=[],nav=0,rap=0,fp=0;
 for(const [n,m] of worlds){const K=m.kind,Rv=m.river,E=m.elev,F=m.feat,W=m.w,tag=s=>n+': '+s;
  const wet=i=>K[i]===t.T_WATER||K[i]===t.T_ROAD||K[i]===t.T_FORD,uses=new Uint8Array(W*m.h);for(const r of m.rivers)for(const i of r.path)uses[i]++;
  for(const r of m.rivers){rivers++;const p=r.path,delta=Rv[p[0]]&128;
   if(!p.every(i=>wet(i)&&Rv[i]&3))bad.water.push(tag(r.name));
   if(!wet(r.mouth))bad.mouth.push(tag(r.name));
   for(let k=0;k<p.length;k++){const b=k+1<p.length?p[k+1]:r.mouth,[dx,dy]=step(m,p[k],b);
    if(Math.abs(dx)+Math.abs(dy)!==1&&!bad.gap.includes(tag(r.name)))bad.gap.push(tag(r.name));
    if(E[b]>E[p[k]]&&!bad.up.includes(tag(r.name)))bad.up.push(tag(r.name)+' at '+k);
    if(k+1<p.length&&uses[p[k]]===1&&W8[m.flow[p[k]]>>5].join()!==[dx,dy].join()&&!bad.dir.includes(tag(r.name)))bad.dir.push(tag(r.name))}
   // width: never narrower downstream (the delta's stretch apart); a river 2 wide carries a river's flow; great rivers order 4 and up
   const w=p.map(i=>Rv[i]&3);for(let k=1;k<p.length;k++)if(w[k]<w[k-1]&&w[k-1]<=r.width&&!(Rv[p[k]]&128)){bad.narrow.push(tag(r.name));break}
   const fl=Math.max(...p.map(i=>m.flow[i]&31));if(!delta&&(fl<8||r.width>=2&&fl<10))bad.flow.push(tag(r.name+' '+fl));
   if(r.width===3&&r.order<4)bad.great.push(tag(r.name));
   // navigable: from where it is 2 wide to its end, every tile but its rapids' (a wider river's it runs into its own)
   if(r.width>=2&&!delta){nav++;rap+=r.rapids.length;const inR=(k,e)=>r.rapids.some(([a,b])=>k>=a-e&&k<=b+e),k0=w.findIndex(v=>v>=2);
    if(!r.nav||p.some((i,k)=>k>=k0&&!(Rv[i]&128)&&(Rv[i]&3)<=r.width&&(Rv[i]&4?inR(k,0):!inR(k,1))))bad.nav.push(tag(r.name))}
   if(r.width<2&&!delta&&p.some(i=>Rv[i]&4&&(Rv[i]&3)<2))bad.nav.push(tag(r.name+' (a stream)'))}
  // deltas: the main channel and its side channels (the same name), their mouths fanning over 8-16 tiles
  for(const r of m.rivers.filter(r=>r.width===3&&Rv[r.path[r.path.length-1]]&128)){const ch=m.rivers.filter(c=>c!==r&&c.name===r.name&&Rv[c.path[0]]&128),ms=[r.mouth,...ch.map(c=>c.mouth)];
   let s=0;for(const a of ms)for(const b of ms)s=Math.max(s,Math.abs(a%W-b%W),Math.abs(((a/W)|0)-((b/W)|0)));if(ch.length)deltas.push([tag(r.name),ch.length,s])}
  // brooks (what the art draws: land but peaks, no river on it, flow GEN_RIVER.brook and up): each runs on into another or into
  // water (or a road or ford laid on water since: no flow there, or a river's)
  {const F=m.flow,bk=i=>K[i]!==t.T_WATER&&K[i]!==t.T_MOUNT&&!(Rv[i]&3)&&(F[i]&31)>=t.GEN_RIVER.brook;
   for(let i=0;i<W*m.h&&bad.brook.length<5;i++){if(!bk(i))continue;const x=i%W,y=(i-x)/W,[dx,dy]=W8[F[i]>>5],u=x+dx,v=y+dy,j=v*W+u;
    if(!m.has(u,v)||!bk(j)&&K[j]!==t.T_WATER&&!((K[j]===t.T_ROAD||K[j]===t.T_FORD)&&(Rv[j]&3||(F[j]&31)<t.GEN_RIVER.brook)))bad.brook.push(tag(x+','+y))}}
  // floodplain: land within 3 of a river; lakes: water with feat lake, basin 0; basins: every land tile in one
  for(let i=0;i<W*m.h;i++){if(F[i]&1&&K[i]!==t.T_WATER){fp++;const x=i%W,y=(i-x)/W;let near=false;for(let b=-3;b<=3&&!near;b++)for(let a=-3;a<=3;a++)if(m.has(x+a,y+b)&&Rv[(y+b)*W+x+a]&3){near=true;break}if(!near&&bad.flood.length<5)bad.flood.push(tag(x+','+y))}
   const crossing=K[i]===t.T_ROAD||K[i]===t.T_FORD,land=K[i]!==t.T_WATER&&!crossing;
   if(F[i]&2&&(land||m.basin[i])&&bad.lake.length<5)bad.lake.push(tag(i));
   if(land&&!m.basin[i]&&bad.basin.length<5)bad.basin.push(tag(i))}}
 const say=(k,m)=>ok(!bad[k].length,m+(bad[k].length?': '+bad[k].slice(0,4).join('; '):''));
 info(rivers+' rivers on '+worlds.length+' worlds ('+worlds.map(([n,m])=>n+' '+m.rivers.length).join(', ')+')');
 say('water','every river tile is water with a width (or a crossing on it: road or ford)');say('gap','each river joined 4 ways, tile to tile and into its mouth (no diagonal gap)');
 say('up','never uphill: the bed never rises downstream, nor into the water it ends in');say('mouth','each ends in water (the sea, a lake or a larger river)');
 say('dir','flow\'s way on each river tile points to the next');say('narrow','width follows flow: never narrower downstream (but in a delta; a wider river beside it aside)');
 say('flow','a stream carries a stream\'s flow (log2 8 and up), a river 2 wide a river\'s (10 and up)');say('great','great rivers are of Strahler order 4 and up');
 say('nav',nav+' navigable rivers ('+rap+' rapids): navigable from where they are 2 wide to their end, but at their rapids; streams never');
 ok(deltas.length&&deltas.every(d=>d[2]>=8&&d[2]<=16),deltas.length+' deltas, their mouths fanning over 8-16 tiles ('+deltas.map(d=>d[0]+' '+(d[1]+1)+' channels over '+d[2]).join('; ')+')');
 say('brook','every brook ends in water: it runs on into another brook or into water (a stream, river, lake or the sea)');
 // the rivers' check (genRiverCheck) as stage 4 leaves Normal 1: nothing wrong, then a brook made to end dry on open land found
 {const row=t.GEN_STAGES.find(s=>s.id==='rivers'),run=row.run;let m=null;
  try{row.run=function*(g){const v=yield* run(g);m=g.map;return v};for(const st of t.genWorldSteps({preset:'normal',seed:'1'}).slice(0,4)){const it=st.run();while(!it.next().done);}}finally{row.run=run}
  const W=m.w,K=m.kind,F=m.flow,i=[...K.keys()].find(i=>{const x=i%W,y=(i-x)/W,[dx,dy]=W8[F[i]>>5],j=(y+dy)*W+x+dx;return x>1&&y>1&&x<W-2&&y<m.h-2&&K[i]===t.T_OPEN&&!(m.river[i]&3)&&(F[i]&31)<t.GEN_RIVER.brook&&K[j]===t.T_OPEN&&(F[j]&31)<t.GEN_RIVER.brook}),was=F[i],why=t.genRiverCheck(m);
  let dry;try{F[i]=(was&~31)|t.GEN_RIVER.brook;dry=t.genRiverCheck(m)}finally{F[i]=was}
  ok(why===null&&dry==='a brook ends dry at ('+(i%W)+', '+((i-i%W)/W)+')','the rivers’ check (genRiverCheck) as stage 4 leaves Normal 1: '+why+'; with a brook made to end dry on open land: '+dry)}
 say('flood',fp+' floodplain tiles, each within 3 of a river');say('lake','lakes are water (or a crossing on it) with no basin');say('basin','every land tile lies in a basin');
 // the classic great river: a river of width 3 within 3-8 tiles east of Stonebridge's anchor (none of it west of it within 5); of the rivers
 // that feed it above there (into it, into those, through lakes), one rising in the northern 30% within 20 tiles of a peak or high
 // ground (elevation 170); downstream, river into river, to the sea in the southern 40%
 {const m=worlds[0][1],W=m.w,H=m.h,N=W*H,K=m.kind,R=m.rivers,a=t.classicAnchors().find(p=>p.name==='Stonebridge'),xy=i=>[i%W,(i-i%W)/W];
  const near=i=>{const [x,y]=xy(i);return Math.abs(y-a.ty)<=3&&x-a.tx>=3&&x-a.tx<=8},west=R.some(r=>(r.width===3)&&r.path.some(i=>{const [x,y]=xy(i);return Math.abs(y-a.ty)<=3&&x<=a.tx+1&&x>=a.tx-5}));
  const g=R.find(r=>r.width===3&&r.path.some(near)),sea=i=>K[i]===t.T_WATER&&!(m.feat[i]&2)&&!(m.river[i]&3);
  if(!g)ok(false,'classic: a great river 3-8 tiles east of Stonebridge’s anchor');
  else{const lk=i=>{for(const j of [i,i-1,i+1,i-W,i+W])if(j>=0&&j<N&&K[j]===t.T_WATER&&m.feat[j]&2)return j;return -1},into=new Set(g.path.slice(0,g.path.findIndex(near)+1)),up=new Set([g]);
   const lake=s=>{const L=new Set([s]),q=[s];while(q.length){const i=q.pop(),x=i%W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<N&&!L.has(j)&&K[j]===t.T_WATER&&m.feat[j]&2){L.add(j);q.push(j)}}return L};
   const feed=r=>{const j=lk(r.path[0]);if(j>=0)for(const i of lake(j))into.add(i)};feed(g);
   for(let more=true;more;){more=false;for(const r of R)if(!up.has(r)&&into.has(r.mouth)){up.add(r);for(const i of r.path)into.add(i);feed(r);more=true}}
   let top=null;for(const r of up){const [sx,sy]=xy(r.path[0]);let hi=false;for(let y=sy-20;y<=sy+20&&!hi;y++)for(let x=sx-20;x<=sx+20;x++)if(m.has(x,y)&&(K[y*W+x]===t.T_MOUNT||m.elev[y*W+x]>=170)){hi=true;break}if(hi&&(!top||sy<top[2]))top=[r,sx,sy]}
   let dn=g;for(let k=0;k<6&&!sea(dn.mouth);k++){const n=R.find(r=>r!==dn&&r.path.includes(dn.mouth));if(!n)break;dn=n}const [mx,my]=xy(dn.mouth);
   ok(!west&&top&&top[2]<=H*.3&&sea(dn.mouth)&&my>=H*.6,'classic: the great river '+g.name+' past Stonebridge, 3-8 tiles east of its anchor'+(west?' (and NOT clear of its west)':'')+'; '+up.size+' rivers feed it above there, the farthest north rising under high ground '+(top?top[0].name+' at ('+top[1]+', '+top[2]+')':'none')+'; out to the sea at ('+mx+', '+my+')')}}
 // seasonal flags (§6.6.4), by the climate most of a river runs through
 {const sb=[],grass=[0,0],kinds={};
  for(const [n,m] of worlds){for(const r of m.rivers){const c=[0,0,0,0];for(const i of r.path)c[m.clim[i]]++;const cl=t.CLIMS[c.indexOf(Math.max(...c))],f=r.seasonal,bits=r.path.filter(i=>(m.river[i]&3)>r.width||!!(m.river[i]&8)===!!f).length>=r.path.length*.9,delta=m.river[r.path[0]]&128;
   if(f)kinds[cl+' '+['freeze','flood','dry','flash'].filter(k=>f[k]).join('+')]=(kinds[cl+' '+['freeze','flood','dry','flash'].filter(k=>f[k]).join('+')]||0)+1;
   if(!bits)sb.push(n+' '+r.name+' bits');
   if(r.width===3&&f)sb.push(n+' '+r.name+' great');
   if(cl==='frost'&&r.width<3&&!(f&&f.freeze&&f.flood===(r.width===1)))sb.push(n+' '+r.name+' frost');
   if(cl==='desert'&&f&&!(f.flash&&f.dry&&r.width===1&&f.day>=1))sb.push(n+' '+r.name+' desert');
   if(cl==='swamp'&&(r.width===1||delta)&&!(f&&f.flood&&f.dry))sb.push(n+' '+r.name+' swamp');
   if(cl!=='frost'&&r.width===2&&!delta&&f)sb.push(n+' '+r.name+' a river outside the frost');
   if(cl==='grass'&&r.width===1&&!delta){grass[1]++;if(f)grass[0]++}}}
  ok(!sb.length,'seasonal flags by climate: frost freezes all but great rivers (streams flood in the thaw), desert streams flash, swamp streams and delta channels flood and dry, rivers elsewhere and great rivers never ('+Object.entries(kinds).map(([k,v])=>k+' '+v).join(', ')+')'+(sb.length?': '+sb.slice(0,5).join('; '):''));
  const sh=grass[0]/(grass[1]||1);ok(grass[1]>=10&&sh>=.25&&sh<=.35,'about 30% of grass streams seasonal: '+grass[0]+' of '+grass[1]+' ('+(sh*100).toFixed(0)+'%)');
  const off=t.genWorld({preset:'normal',seed:'1',seasonal:false}).map;
  ok(off.rivers.every(r=>!r.seasonal)&&off.river.every(v=>!(v&0x78)),'seasonal off: no river seasonal, no tile with a seasonal bit')}
 // the desert's water (the owner's fifth play-test, GEN_RIVER.desert, GEN_OASIS): no stream rising there, a river in it from outside
 // (most ending in a terminal lake there), no brook on its land; every desert tile within GEN_OASIS.reach of water (4 ways; a
 // holding counts), at least one oasis an every tiles of it, each its own water in the desert
 {const D=t.CLIM.desert,O=t.GEN_OASIS,bad={src:[],brook:[],far:[],oasis:[]},say=[];
  for(const [n,m] of worlds){const W=m.w,N=W*m.h,K=m.kind,C=m.clim;let into=0,end=0,dl=0;
   for(const r of m.rivers){if(C[r.path[0]]===D&&!(m.river[r.path[0]]&128))bad.src.push(n+' '+r.name);if(r.path.some(i=>C[i]===D)){into++;if(m.feat[r.mouth]&2&&C[r.mouth]===D)end++}}
   for(let i=0;i<N;i++)if(C[i]===D&&t.genBrook(m,i)&&bad.brook.length<5)bad.brook.push(n+' '+(i%W)+','+((i-i%W)/W));
   const Dd=new Int32Array(N).fill(-1),q=[];for(let i=0;i<N;i++)if(K[i]===t.T_WATER||m.river[i]&3||m.feat[i]&2){Dd[i]=0;q.push(i)}
   for(const h of hold.get(m))if(Dd[h.ty*W+h.tx]<0){Dd[h.ty*W+h.tx]=0;q.push(h.ty*W+h.tx)}
   for(let a=0;a<q.length;a++){const i=q[a],x=i%W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<N&&Dd[j]<0){Dd[j]=Dd[i]+1;q.push(j)}}
   let far=0;for(let i=0;i<N;i++)if(C[i]===D&&K[i]!==t.T_WATER&&K[i]!==t.T_MOUNT){dl++;far=Math.max(far,Dd[i])}
   if(far>O.reach)bad.far.push(n+' '+far);
   const os=m.oases||[];if(os.length<Math.floor(dl/O.every)||os.some(o=>!o.tiles.length||o.tiles.length>O.nBig[1]||!o.tiles.includes(o.i)||o.tiles.some(i=>K[i]!==t.T_WATER&&K[i]!==t.T_ROAD||C[i]!==D||!(m.feat[i]&2))||o.r<O.ring[0]))bad.oasis.push(n+' '+os.length);
   say.push(n+': '+into+' rivers into the desert ('+end+' ending in a lake there), '+os.length+' oases ('+os.filter(o=>o.big).length+' large), the farthest desert tile '+far+' tiles from water')}
  const sw=(k,msg)=>ok(!bad[k].length,msg+(bad[k].length?': '+bad[k].slice(0,4).join('; '):''));
  info('the desert’s water: '+say.join('; '));
  sw('src','no stream rises in the desert: a river on its land comes from outside it');sw('brook','no brook on the desert’s land');
  sw('far','every desert tile within '+O.reach+' tiles (4 ways; a day’s march there is some 88) of water or a holding');sw('oasis','oases: one an '+O.every+' desert tiles at least, each its own lake water in the desert, listed with its ring')}
 // ponds (GEN_POND): each listed, of its kind, its 1-4 tiles lake water (or a crossing on it) in no river's way, none in the desert;
 // every brook's head has a source as stage 5b leaves it (the rivers' check with src: the woods, hills, peaks, lakes, ponds), and
 // the check finds one rising on open land
 {const kinds={},bad=[],P=t.GEN_POND;for(const [n,m] of worlds)for(const p of m.ponds||[]){kinds[p.kind]=(kinds[p.kind]||0)+1;
   if(!['hollow','pool','tarn','oxbow','spring'].includes(p.kind)||!p.tiles.length||p.tiles.length>4||!p.tiles.includes(p.i)||p.r<1||p.tiles.some(i=>!(m.feat[i]&2)||m.river[i]&3||m.clim[i]===t.CLIM.desert||m.kind[i]!==t.T_WATER&&m.kind[i]!==t.T_ROAD))bad.push(n+' '+p.kind+' '+p.i)}
  ok(!bad.length&&Object.keys(kinds).length===5,'ponds: '+Object.entries(kinds).map(([k,v])=>v+' '+k+'s').join(', ')+' on '+worlds.length+' worlds, each 1-4 tiles of lake water in no river’s way, none in the desert'+(bad.length?': '+bad.slice(0,4).join('; '):''));
  {const none=[];for(const [n,m] of worlds)for(let i=0;i<m.w*m.h&&none.length<5;i++)if(t.genBrook(m,i)&&!t.genFed(m,i)&&!t.genSourced(m,i))none.push(n+' '+(i%m.w)+','+((i-i%m.w)/m.w));
   ok(!none.length,'every brook’s head has a source on the finished worlds too (one whose wood or hill stages 7-9 took cut back at stage 10)'+(none.length?': '+none.join('; '):''))}
  const row=t.GEN_STAGES.find(s=>s.id==='ponds'),run=row.run;let m=null;
  try{row.run=function*(g){const v=yield* run(g);m=g.map;return v};for(const st of t.genWorldSteps({preset:'normal',seed:'2'}).slice(0,6)){const it=st.run();while(!it.next().done);}}finally{row.run=run}
  const W=m.w,K=m.kind,F=m.flow,heads={};let i0=-1;
  for(let i=0;i<W*m.h;i++){if(!t.genBrook(m,i)||t.genFed(m,i))continue;const k=K[i]===t.T_FOREST?'wood':K[i]===t.T_HILL?'hill':t.genSourced(m,i)?'by a hill, peak or water':'none';heads[k]=(heads[k]||0)+1}
  for(let i=0;i<W*m.h&&i0<0;i++){const x=i%W,y=(i-x)/W;if(x<3||y<3||x>W-4||y>m.h-4||K[i]!==t.T_OPEN||m.clim[i]===t.CLIM.desert||t.genSourced(m,i)||t.genBrook(m,i))continue;const j=(y+t.DIR8[F[i]>>5][1])*W+x+t.DIR8[F[i]>>5][0];if(t.genBrook(m,j)&&!t.genFed(m,j)&&t.genSourced(m,j))i0=i}
  const why=t.genRiverCheck(m,true),was=F[i0];let dry;try{F[i0]=(was&~31)|t.GEN_RIVER.brook;dry=t.genRiverCheck(m,true)}finally{F[i0]=was}
  ok(why===null&&!heads.none&&dry==='a brook rises on open land at ('+(i0%W)+', '+((i0-i0%W)/W)+')','every brook’s head has a source as stage 5b leaves Normal 2 ('+Object.entries(heads).map(([k,v])=>k+' '+v).join(', ')+'; the check: '+why+'); a brook made to rise on open land: '+dry)}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
