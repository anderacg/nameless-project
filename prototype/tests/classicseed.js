'use strict';
// The classic seed (doc/WORLD_DESIGN.md §8.15, §15.2.3 B (3)): the generator at Normal with seed CLASSIC and today's 37 holdings as
// anchors. The anchors by their formula (each realm's centroid doubled, each holding's offset from it x1.4); the 37 with their own
// data in TOWNS order, each within 4 tiles of its anchor, on free ground, in its own climate; and every hint of §8.15: a south coast
// with the League's ports on one sea, frost north and desert south-east, Karn Hold below the peaks, Willowmere an island village
// joined by bridges, Stonebridge at a bridge over the great river, which runs from the northern peaks to the south coast past it,
// Mirefen and Tidewatch in fen, soft nudges and not stamps (§14.2's climate disc), the rest generated round them. It makes its own
// world, so it runs with the flag off or on; with the flag on also the world in use (TOWNS, and the League's docks on one sea).
// INFO: each holding's distance from its anchor.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,J=JSON.stringify;
try{
 const r=t.genWorld(t.classicSettings()),m=r.map,W=m.w,H=m.h,K=m.kind,Hd=r.holdings,P=t.CLASSIC_PLACES,A=t.classicAnchors();
 const at=n=>Hd.find(h=>h.name===n),ti=h=>h.ty*W+h.tx,xy=i=>[i%W,(i-i%W)/W],far=(a,b)=>Math.max(Math.abs(a.tx-b.tx),Math.abs(a.ty-b.ty)),clim=i=>t.CLIMS[m.clim[i]],pc=v=>Math.round(v*100)+'%';
 // (a share of the land tiles in a box, or round (x, y) from r0 to r1 tiles, where is(i) holds)
 const share=(x0,y0,x1,y1,is,ring)=>{let n=0,k=0;[x0,y0,x1,y1]=[x0,y0,x1,y1].map(Math.round);for(let y=Math.max(0,y0);y<Math.min(H,y1);y++)for(let x=Math.max(0,x0);x<Math.min(W,x1);x++){const i=y*W+x;
   if(ring){const d=(x-ring[0])*(x-ring[0])+(y-ring[1])*(y-ring[1]);if(d<ring[2]*ring[2]||d>=ring[3]*ring[3])continue}if(t.passable(K[i])||K[i]===t.T_FORD){n++;if(is(i))k++}}return n?k/n:0};
 const round=(h,r0,r1,is)=>share(h.tx-r1,h.ty-r1,h.tx+r1+1,h.ty+r1+1,is,[h.tx,h.ty,r0,r1]);
 ok(W===448&&H===320&&m.classic&&m.gen==='ashmark-1'&&m.settings.preset==='classic'&&m.settings.seed==='CLASSIC','the classic seed: generated at Normal (448 x 320), seed CLASSIC ('+m.sum.toString(16)+'; tries '+Object.values(r.tries).join(' ')+'; relaxed: '+(r.relaxed.join('; ')||'nothing')+')');
 // ---- the anchors: each realm's centroid doubled, each holding's offset from it x1.4, rounded
 {const C={};for(const p of P){const c=C[p.realm]||(C[p.realm]={x:0,y:0,n:0});c.x+=p.tx;c.y+=p.ty;c.n++}
  const want=P.map(p=>{const c=C[p.realm],cx=c.x/c.n,cy=c.y/c.n;return[Math.round(2*cx+1.4*(p.tx-cx)),Math.round(2*cy+1.4*(p.ty-cy))]}),a=A[0],k=A[1];
  ok(A.length===37&&A.every((q,i)=>q.name===P[i].name&&q.tx===want[i][0]&&q.ty===want[i][1])&&far(a,{tx:83,ty:85})<=1&&far(k,{tx:338,ty:78})<=1,
   'the 37 anchors by the formula (each realm’s centroid x2, each offset from it x1.4): Ashford ('+a.tx+', '+a.ty+'), about (83, 85); Karn Hold ('+k.tx+', '+k.ty+'), about (338, 78)')}
 // ---- the 37: their data, their order, their tiles
 ok(Hd.length===37&&Hd.every((h,k)=>{const a={...P[k]},b={...h};delete a.tx;delete a.ty;delete b.tx;delete b.ty;return J(a)===J(b)}),'the 37 holdings in TOWNS order with their own data (names, races, kinds, realms, styles, prices, notes, climates): all but their tiles');
 info('each holding’s distance from its anchor (tiles, the larger of dx, dy): '+Hd.map((h,k)=>h.name+' '+far(h,A[k])).join(', '));
 {const bad=Hd.filter((h,k)=>far(h,A[k])>4);ok(!bad.length,'each within 4 tiles of its anchor'+(bad.length?': not '+bad.map(h=>h.name+' ('+far(h,A[Hd.indexOf(h)])+', anchor '+A[Hd.indexOf(h)].tx+','+A[Hd.indexOf(h)].ty+')').join(', '):''))}
 {const bad=Hd.filter(h=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const k=K[ti(h)+a+b*W];if(k===t.T_WATER||k===t.T_MOUNT||k===t.T_FORD)return true}return false});
  ok(!bad.length,'each on free ground (no water, ford or peak beside it)'+(bad.length?': not '+bad.map(h=>h.name).join(', '):''))}
 {const bad=Hd.filter(h=>clim(ti(h))!==h.clim);ok(!bad.length,'each in its own climate (as mapview asks)'+(bad.length?': not '+bad.map(h=>h.name+' ('+clim(ti(h))+', not '+h.clim+')').join(', '):''))}
 // ---- a south coast, the League's ports on one sea: each port's water within 2 tiles (4 ways joined), one body for all, on the south edge
 {const L=new Int32Array(W*H).fill(-1),south=[];let n=0;
  for(let s=0;s<W*H;s++){if(L[s]>=0||K[s]!==t.T_WATER)continue;const st=[s];L[s]=n;south[n]=false;
   while(st.length){const i=st.pop(),[x,y]=xy(i);if(y===H-1)south[n]=true;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<W*H&&L[j]<0&&K[j]===t.T_WATER){L[j]=n;st.push(j)}}n++}
  const ports=Hd.filter(h=>h.realm==='salt'&&h.style==='port'),by=ports.map(h=>{const s=new Set();for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(m.has(h.tx+a,h.ty+b)&&K[ti(h)+a+b*W]===t.T_WATER)s.add(L[ti(h)+a+b*W]);return[...s]});
  const one=by.length?by[0].find(w=>by.every(s=>s.includes(w))):undefined;
  ok(ports.length===5&&one!==undefined&&south[one],'a south coast: the League’s 5 ports each with water within 2 tiles, all on one sea that reaches the south edge ('+ports.map((h,k)=>h.name+' '+(by[k].map(w=>'#'+w+(south[w]?' south':'')).join('+')||'dry')).join(', ')+')')}
 // ---- frost north, desert south-east
 {const fr=i=>m.clim[i]===t.CLIM.frost,de=i=>m.clim[i]===t.CLIM.desert,n=share(0,0,W,H*.2,fr),s=share(0,H*.5,W,H,fr),se=share(W*.7,H*.7,W,H,de),nw=share(0,0,W*.5,H*.5,de);
  ok(n>=.5&&s<.05,'frost in the north: '+pc(n)+' of the land in the northern fifth, '+pc(s)+' in the southern half');
  ok(se>=.5&&nw<.05,'desert in the south-east: '+pc(se)+' of the land in the south-east corner (the last 30% each way), '+pc(nw)+' in the north-west quarter')}
 // ---- Karn Hold below the peaks: peaks within 16 tiles north of it
 {const k=at('Karn Hold');let n=0;for(let y=k.ty-16;y<k.ty;y++)for(let x=k.tx-16;x<=k.tx+16;x++)if(m.has(x,y)&&K[y*W+x]===t.T_MOUNT)n++;
  ok(n>=10,'Karn Hold below the peaks: '+n+' peak tiles within 16 tiles north of it')}
 // ---- Willowmere an island village with bridges: on land ringed by water (rivers count as land; a bridge's deck does not), off the
 // main land, joined to other land by bridges
 {const w=at('Willowmere'),br=i=>K[i]===t.T_ROAD&&(m.feat[i]&32),is=i=>(K[i]!==t.T_WATER||(m.river[i]&3)>0)&&!br(i),L=new Int32Array(W*H).fill(-1),sz=[];
  for(let s=0;s<W*H;s++){if(L[s]>=0||!is(s))continue;const st=[s],id=sz.length;L[s]=id;let c=0;while(st.length){const i=st.pop(),x=i%W;c++;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<W*H&&L[j]<0&&is(j)){L[j]=id;st.push(j)}}sz.push(c)}
  const own=L[ti(w)],main=sz.indexOf(Math.max(...sz)),X=m.crossings.filter(c=>c.kind==='bridge'&&(L[c.i]===own)!==(L[c.j]===own));
  ok(own>=0&&own!==main&&X.length>0,'Willowmere an island village: on land ringed by water ('+(own>=0?sz[own]:0)+' tiles, '+(own===main?'the main land':'off the main land')+'), joined by '+X.length+' bridges')}
 // ---- Stonebridge at a bridge over the great river, which runs from the northern peaks to the south coast past it
 {const s=at('Stonebridge'),end=i=>{const [x,y]=xy(i);return Math.max(Math.abs(x-s.tx),Math.abs(y-s.ty))};
  const X=m.crossings.filter(c=>c.kind==='bridge'&&c.tiles.some(i=>(m.river[i]&3)===3)&&Math.min(end(c.i),end(c.j))<=4),
   rd=m.roads.filter(q=>(q.a===s.name||q.b===s.name)&&X.some(c=>c.tiles.every(i=>q.path.includes(i))));
  ok(X.length>0&&rd.length>0,'Stonebridge at a bridge over the great river: '+(X.length?X.map(c=>c.tiles.length+' tiles, its end '+Math.min(end(c.i),end(c.j))+' from the town').join('; ')+', its road to '+(rd.map(q=>q.a===s.name?q.b:q.a).join(', ')||'none'):'no great-river bridge within 4 tiles'));
  const rv=new Int32Array(W*H).fill(-1);for(const q of m.rivers)for(const i of q.path)if(rv[i]<0)rv[i]=q.id;
  const byId=new Map(m.rivers.map(q=>[q.id,q])),c=X[0],id=c?(c.river!=null?c.river:rv[c.tiles[0]]):-1,R=byId.get(id);
  if(R){// down: mouth by mouth to the sea; up: the rivers that run into it above the bridge, and into those
   let q=R,mouth=-1;for(let n=0;n<60&&q;n++){const nx=rv[q.mouth];if(nx>=0&&nx!==q.id){q=byId.get(nx);continue}mouth=q.mouth;break}
   const pos=Math.max(...c.tiles.map(i=>R.path.indexOf(i))),up=new Set([R.id]);
   for(let more=true;more;){more=false;for(const q of m.rivers)if(!up.has(q.id)&&up.has(rv[q.mouth])&&(rv[q.mouth]!==R.id||R.path.indexOf(q.mouth)<=pos)){up.add(q.id);more=true}}
   const src=[...up].map(k=>byId.get(k).path[0]).sort((a,b)=>xy(a)[1]-xy(b)[1])[0],[sx,sy]=xy(src),[mx,my]=mouth>=0?xy(mouth):[-1,-1];let pk=0;
   for(let y=sy-12;y<=sy+12;y++)for(let x=sx-12;x<=sx+12;x++)if(m.has(x,y)&&K[y*W+x]===t.T_MOUNT)pk++;
   const sea=mouth>=0&&!(m.river[mouth]&3)&&!(m.feat[mouth]&2);
   ok(sy<H*.3&&pk>0&&sea&&my>H*.7,'the great river ('+R.name+') from the northern peaks to the south coast past Stonebridge: its farthest source at ('+sx+', '+sy+'), '+pk+' peak tiles within 12; its mouth at ('+mx+', '+my+')'+(sea?' on the sea':' not on the sea'))}
  else ok(false,'the great river from the northern peaks to the south coast past Stonebridge: no bridge to find it by')}
 // ---- Mirefen and Tidewatch in fen
 for(const n of ['Mirefen','Tidewatch']){const h=at(n),v=round(h,0,7,i=>m.clim[i]===t.CLIM.swamp);ok(clim(ti(h))==='swamp'&&v>=.5,n+' in fen: on swamp, '+pc(v)+' of the land within 6 tiles')}
 // ---- soft nudges, not stamps: round each holding the share of its own climate at 9-11, 11-13 and 13-15 tiles falls no more than
 // 35 points ring to ring (§14.2's climate disc)
 {const bad=[];for(const h of Hd){const c=m.clim[ti(h)],s=[[9,11],[11,13],[13,15]].map(([a,b])=>round(h,a,b,i=>m.clim[i]===c));if(s[0]-s[1]>.35||s[1]-s[2]>.35)bad.push(h.name+' '+s.map(pc).join('/'))}
  ok(!bad.length,'no climate discs: round each holding, its own climate’s share falls by 35 points at most ring to ring (9-11, 11-13, 13-15 tiles)'+(bad.length?': '+bad.join(', '):''))}
 // ---- generated round them
 ok(m.rivers.length>=10&&m.roads.length>=36&&m.crossings.length>0&&r.camps.length===t.density(m).camps,'generated round them: '+m.rivers.length+' rivers, '+m.roads.length+' roads, '+m.crossings.length+' crossings, '+r.camps.length+' camps');
 // ---- placement alone, on a made-up classic land (448 x 320 of open grass, each holding's own climate round its anchor): the sea
 // along the south edge, a canal 2 tiles wide from it to 3 tiles beside each League port; a great river 5 tiles wide from the north
 // edge to the sea 6 tiles east of Stonebridge's anchor, 3 wide for 7 tiles there; a lake 2 tiles wide ringing Willowmere's anchor
 // 5 tiles out. Stage 7 puts each within 4 of its anchor with its hint kept, stage 8 bridges the great river at Stonebridge
 {const m=new t.WorldMap(448,320,'test'),W=448,H=320,K=m.kind,Rv=m.river,set=(x,y,k)=>{if(m.has(x,y))K[y*W+x]=k};m.gen='ashmark-1';m.classic=true;m.elev.fill(80);
  for(const [k,a] of A.entries())for(let b=-6;b<=6;b++)for(let c=-6;c<=6;c++)if(m.has(a.tx+c,a.ty+b))m.clim[(a.ty+b)*W+a.tx+c]=t.CLIM[P[k].clim];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!x||!y||x===W-1||y>=296)set(x,y,t.T_WATER);
  const an=n=>A.find(a=>a.name===n),canal=(n,dx)=>{const a=an(n);for(let y=a.ty-2;y<296;y++)for(const x of [a.tx+dx,a.tx+dx+Math.sign(dx)])set(x,y,t.T_WATER)};
  canal('Saltmere',3);canal('Pearlbay',3);canal('Gullhaven',3);canal('Tidewatch',-3);canal('Brinewatch',3);
  const sb=an('Stonebridge'),path=[];for(let y=1;y<296;y++){const n=Math.abs(y-sb.ty)<=3?3:5;for(let k=0;k<n;k++){const i=y*W+sb.tx+6+k;K[i]=t.T_WATER;Rv[i]=3|4}path.push(y*W+sb.tx+7)}
  m.rivers=[{id:0,name:'Greatwater',path,order:4,width:3,basin:0,mouth:296*W+sb.tx+7,nav:true,rapids:[],seasonal:null}];
  const wm=an('Willowmere');for(let y=wm.ty-8;y<=wm.ty+8;y++)for(let x=wm.tx-8;x<=wm.tx+8;x++){const d=(x-wm.tx)*(x-wm.tx)+(y-wm.ty)*(y-wm.ty);if(d>=25&&d<49)set(x,y,t.T_WATER)}
  const g={s:t.classicSettings(),map:m,rng:(st,a)=>t.genRng(11,st,a),work:{},hints:t.CLASSIC_HINTS,attempt:0,holdings:[],camps:[],lords:null,tries:{},relaxed:[],tick:()=>false};
  for(const it of [t.genHoldings(g),t.genRoads(g)])while(!it.next().done);
  const Hm=g.holdings,F=g.work.place,hm=n=>Hm.find(h=>h.name===n),bad=Hm.filter((h,k)=>far(h,A[k])>4);
  ok(Hm.length===37&&!bad.length&&Hm.every((h,k)=>{const a={...P[k]},b={...h};delete a.tx;delete a.ty;delete b.tx;delete b.ty;return J(a)===J(b)}),'made-up land: the 37 with their own data, each within 4 tiles of its anchor'+(bad.length?': not '+bad.map(h=>h.name).join(', '):'')+' (moved: '+Hm.filter((h,k)=>far(h,A[k])).map(h=>h.name+' '+far(h,A[Hm.indexOf(h)])).join(', ')+')');
  {const ports=Hm.filter(h=>h.realm==='salt'&&h.style==='port'),dry=ports.filter(h=>t.placeShore(m,h.ty*W+h.tx,j=>F.wl[j]===F.sea)<0);ok(ports.length===5&&!dry.length,'made-up land: the League’s ports each within 2 tiles of the sea'+(dry.length?': not '+dry.map(h=>h.name).join(', '):''))}
  {const s=hm('Stonebridge'),X=m.crossings.filter(c=>c.kind==='bridge'&&c.tiles.every(i=>(Rv[i]&3)===3)),rd=m.roads.find(q=>(q.a===s.name||q.b===s.name)&&X.some(c=>c.tiles.every(i=>q.path.includes(i))));
   ok(X.length&&rd&&X.some(c=>Math.min(far(s,{tx:c.i%W,ty:(c.i-c.i%W)/W}),far(s,{tx:c.j%W,ty:(c.j-c.j%W)/W}))<=4),'made-up land: Stonebridge at a bridge over the great river ('+X.map(c=>c.tiles.length+' tiles').join(', ')+'), its road over it to '+(rd?(rd.a===s.name?rd.b:rd.a):'none'))}
  {const w=hm('Willowmere'),inside=i=>{const x=i%W,y=(i-x)/W;return(x-wm.tx)*(x-wm.tx)+(y-wm.ty)*(y-wm.ty)<25},X=m.crossings.filter(c=>c.kind==='bridge'&&inside(c.i)!==inside(c.j));
   ok(inside(w.ty*W+w.tx)&&X.length>0,'made-up land: Willowmere on its isle, joined by '+X.length+' bridges ('+X.map(c=>c.tiles.length+' tiles').join(', ')+')')}
  {const Rd=t.placeReach(m,Hm[0].ty*W+Hm[0].tx,false),cut=Hm.filter(h=>!Rd[h.ty*W+h.tx]);ok(!cut.length&&!g.work.roadFail.length,'made-up land: every holding reachable by its roads'+(cut.length?': not '+cut.map(h=>h.name).join(', '):''))}}
 // ---- the world in use, when it is the generated classic world
 if(t.WM.gen==='ashmark-1'&&t.WM.classic){t.act('begin','soldier');
  ok(t.TOWNS.length===37&&t.TOWNS.every((z,k)=>z.name===P[k].name&&z.tx===Hd[k].tx&&z.ty===Hd[k].ty),'the world in use: TOWNS the 37 in their order, on these tiles');
  const ports=t.TOWNS.filter(z=>P.some(p=>p.name===z.name&&p.realm==='salt'&&p.style==='port')),id=t.waterIds(),dk=ports.map(z=>t.dockOf(z)),w=dk.map(d=>d?id[d.ty*t.MW+d.tx]:-1);
  ok(ports.length===5&&w.every(v=>v>=0&&v===w[0]),'the world in use: the League’s ports’ docks on one sea, for its ships ('+ports.map((z,k)=>z.name+' '+(w[k]>=0?'#'+w[k]:'no dock')).join(', ')+')')}
}catch(e){o.push('EXC '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join(' | '))}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
