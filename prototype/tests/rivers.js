'use strict';
// The generated rivers (doc/WORLD_DESIGN.md §6.6, §8.5; Phase 2's rows of §14.2), on the classic world and a few seeds at Normal
// and Large (worldgen.js genWorld): water all along, 4 ways joined (no gap to slip through), never uphill, each ending in water;
// the flow's way down each; width following flow (never narrowing downstream but in a delta, rivers carrying a river's flow, great
// rivers of Strahler order 4 and up); deltas fanning over 8-16 tiles; navigable runs unbroken but at rapids; floodplain beside
// rivers; lakes and basins; seasonal flags by climate (frost all but great rivers, desert wadis, swamp streams and deltas, about
// 30% of grass streams), none with the seasonal setting off. Phase 5's rows (riverState, crossings by season, tolls, passage,
// barges) come with their phases. The classic seed's great river (§8.15, CLASSIC_HINTS stonebridge): past Stonebridge's anchor, fed
// from the northern peaks, out to the southern sea.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T;
try{
 const worlds=[['classic',t.classicSettings()],...['1','2','3','4','5'].map(s=>['normal '+s,{preset:'normal',seed:s}]),['large 1',{preset:'large',seed:'1'}]].map(([n,s])=>[n,t.genWorld(s).map]);
 const W8=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],step=(m,a,b)=>{const ax=a%m.w,bx=b%m.w;return[bx-ax,(b-bx-(a-ax))/m.w]};
 const bad={water:[],gap:[],up:[],mouth:[],dir:[],narrow:[],flow:[],great:[],nav:[],flood:[],lake:[],basin:[]};let rivers=0,deltas=[],nav=0,rap=0,fp=0;
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
   // navigable: from where it is 2 wide to its end, every tile but its rapids'
   if(r.width>=2&&!delta){nav++;rap+=r.rapids.length;const inR=(k,e)=>r.rapids.some(([a,b])=>k>=a-e&&k<=b+e),k0=w.findIndex(v=>v>=2);
    if(!r.nav||p.some((i,k)=>k>=k0&&!(Rv[i]&128)&&(Rv[i]&4?inR(k,0):!inR(k,1))))bad.nav.push(tag(r.name))}
   if(r.width<2&&!delta&&p.some(i=>Rv[i]&4&&(Rv[i]&3)<2))bad.nav.push(tag(r.name+' (a stream)'))}
  // deltas: the main channel and its side channels (the same name), their mouths fanning over 8-16 tiles
  for(const r of m.rivers.filter(r=>r.width===3&&Rv[r.path[r.path.length-1]]&128)){const ch=m.rivers.filter(c=>c!==r&&c.name===r.name&&Rv[c.path[0]]&128),ms=[r.mouth,...ch.map(c=>c.mouth)];
   let s=0;for(const a of ms)for(const b of ms)s=Math.max(s,Math.abs(a%W-b%W),Math.abs(((a/W)|0)-((b/W)|0)));if(ch.length)deltas.push([tag(r.name),ch.length,s])}
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
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
