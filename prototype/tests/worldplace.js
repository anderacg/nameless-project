'use strict';
// The generator's placement (doc/WORLD_DESIGN.md §8.8, §8.11, §8.12, §15.2.3 B): on the classic seed, two Normal seeds and a
// Large one, the holdings (counts by realm in PLACE_SHARE's ratio, a city each, the spacing table, unique names, capitals 0.3 x the
// diagonal apart, a fair start, ports on water joined to the sea), the roads (every holding and camp reachable from every capital,
// also with the flooding fords shut; road tiles 8-connected, never on a peak, no right-angle stairs; each road's line; each from a
// holding's gate, from in front, its line into water only at a crossing, the owner's play-test 2 world saltwell too), the
// crossings (bridges over 3 tiles of water at most, no ford on a great river, ferries only on great rivers by towns and ports,
// at most 60 tiles apart along a river wherever one can be made, else a bare stretch as INFO), the camps (density()'s, in the fringe), realm land within 30% of the mean, D10's lords, the same world twice; a made-up
// map for the crossings' kinds; each holding's rivers crossed near it (on the five worlds, and a made-up map: two bridges and a
// ferry); deposits and first stocks by the economy setting; lords from WM.lords. Works with the flag
// off or on (it makes its own worlds). INFO lines: time per stage and per road, the checks' tries and relaxations.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,J=JSON.stringify;
try{
 const pn=()=>performance.now(),gen=s=>{const S=t.genWorldSteps(s),ms={};let r;for(const st of S){const a=pn(),it=st.run();let v;while(!(v=it.next()).done);r=v.value;ms[st.id]=pn()-a}r.ms=ms;r.stats={...t.PLACE_STATS};return r};
 const worlds=[['classic',t.classicSettings()],['Normal redwater',{preset:'normal',seed:'redwater'}],['Normal bluewater',{preset:'normal',seed:'bluewater'}],['Large redwater',{preset:'large',seed:'redwater',holdings:55}],
  ['saltwell',t.parseWorldCode('ASH1-X-2V40O9HH-saltwell')]];// (Large at More, 55 holdings: a world with lords of its own, D10; saltwell: the owner's play-test 2 world, Huge, whose roads ran into the river)
 const R={};for(const [k,s] of worlds)R[k]=gen(s);
 for(const [name] of worlds){const r=R[name],m=r.map,W=m.w,H=m.h,K=m.kind,Hd=r.holdings,ti=h=>h.ty*W+h.tx,d2=(a,b)=>(a.tx-b.tx)*(a.tx-b.tx)+(a.ty-b.ty)*(a.ty-b.ty),cl=m.classic,sw=name==='saltwell';
  info(name+': '+Object.keys(r.ms).map(k=>k+' '+r.ms[k].toFixed(0)).join(', ')+' ms; '+r.stats.roads+' roads, '+(r.stats.ms/Math.max(1,r.stats.roads)).toFixed(1)+' ms a road (most '+r.stats.max.toFixed(1)+'); tries '+t.GEN_STAGES.slice(6,9).map(s=>s.id+' '+r.tries[s.id]).join(', ')+'; relaxed: '+(r.relaxed.join('; ')||'nothing'));
  // ---- the holdings
  const fewer=r.relaxed.filter(x=>/one fewer/.test(x)).length,N=m.settings.holdings-fewer*5,q=t.placeQuota(N),by=f=>Hd.filter(h=>h.realm===f),caps=t.PLACE_REALMS.map(f=>by(f).find(h=>h.kind==='city'));
  if(cl)ok(Hd.length===37&&Hd.every((h,k)=>{const p=t.CLASSIC_PLACES[k],a={...p},b={...h};delete a.tx;delete a.ty;delete b.tx;delete b.ty;return J(a)===J(b)}),name+': the 37 classic holdings in TOWNS order, their data whole');
  else ok(Hd.length===N&&t.PLACE_REALMS.every(f=>by(f).length===q[f]&&by(f).filter(h=>h.kind==='city').length===1),name+': '+Hd.length+' holdings ('+m.settings.holdings+' asked'+(fewer?', '+fewer+' fewer a realm':'')+'), by realm '+t.PLACE_REALMS.map(f=>by(f).length).join('/')+', a city each; kinds '+['city','town','castle','village'].map(k=>Hd.filter(h=>h.kind===k).length+' '+k).join(', '));
  if(cl){const A=t.classicAnchors(),far=Hd.filter((h,k)=>Math.max(Math.abs(h.tx-A[k].tx),Math.abs(h.ty-A[k].ty))>4);info(name+': '+(37-far.length)+' of 37 within 4 tiles of their anchors'+(far.length?' (not: '+far.map(h=>h.name).join(', ')+')':''))}
  else{const near=[];for(let a=0;a<Hd.length;a++)for(let b=a+1;b<Hd.length;b++){const A=Hd[a],B=Hd[b],g=A.kind==='city'&&B.kind==='city'?.3*Math.sqrt(W*W+H*H):t.placeGap(A.kind,B.kind);if(d2(A,B)<g*g)near.push(A.name+'-'+B.name)}
   (sw?m=>info(m+' (its generator gave up on the capitals: kept, the play-test’s world as it was)'):m=>ok(!near.length,m))(name+': the spacing table holds between every two holdings, capitals '+(.3*Math.sqrt(W*W+H*H)).toFixed(0)+' tiles apart (0.3 x the diagonal)'+(near.length?': '+near.slice(0,4).join(', '):''))}
  ok(new Set(Hd.map(h=>h.name)).size===Hd.length&&Hd.every(h=>h.name&&h.note&&h.races.length&&(h.kind==='castle'||h.mod&&Object.keys(h.mod).length===6)),name+': unique names, each with its races, note and (but castles) prices: '+Hd.slice(0,3).map(h=>h.name+' ('+h.note+')').join(' '));
  {const bad=caps.filter(c=>Hd.filter(h=>h!==c&&d2(h,c)<=t.PLACE.day*t.PLACE.day).length<3);(cl?m=>info(m):m=>ok(!bad.length,m))(name+': a fair start: each capital has 3 holdings within '+t.PLACE.day+' tiles'+(bad.length?' (not: '+bad.map(c=>c.name).join(', ')+')':''))}
  // realm land (§8.14 Balanced: each realm's within 30% of their mean), as territory.js claims it at the start (placeRealmLand)
  {const L=t.placeRealmLand(m,Hd),mean=L.reduce((a,b)=>a+b,0)/L.length,sk=Math.max(...L.map(v=>Math.abs(v-mean)/mean));(cl?m=>info(m):sw?m=>info(m+' (its generator gave up on the capitals: kept; its holdings’ bridges, play-test 3, carry the first realm’s land over its rivers)'):m=>ok(sk<=t.PLACE.spread,m))(name+': realm land balanced, '+L.join('/')+' tiles by realm, the farthest '+Math.round(sk*100)+'% from their mean (30% at most)')}
  // ports: water within 2 tiles, joined (4 ways over water) to the map's rim or a navigable river
  {const L=new Int32Array(W*H).fill(-1),good=new Set();let n=0;for(let s=0;s<W*H;s++){if(L[s]>=0||K[s]!==t.T_WATER)continue;const st=[s];L[s]=n;let open=false;
    while(st.length){const i=st.pop(),x=i%W,y=(i-x)/W;if(!x||!y||x===W-1||y===H-1||(m.river[i]&4))open=true;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<W*H&&L[j]<0&&K[j]===t.T_WATER){L[j]=n;st.push(j)}}if(open)good.add(n);n++}
   const P=Hd.filter(h=>h.style==='port'),bad=P.filter(h=>{for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++){const x=h.tx+a,y=h.ty+b;if(m.has(x,y)&&good.has(L[y*W+x]))return false}return true});
   (cl?m=>info(m+' (the classic hints: tests/classicseed.js)'):m=>ok(!bad.length,m))(name+': '+P.length+' ports, each on water joined to the sea or a navigable river; styles '+['port','bridge','stilt'].map(s=>Hd.filter(h=>h.style===s).length+' '+s).join(', ')+(bad.length?': not '+bad.map(h=>h.name).join(', '):''))}
  // ---- reach: every holding and camp from every capital, also with every ford on a flooding river shut
  {const miss=[];for(const c of caps)for(const shut of [false,true]){const Rd=t.placeReach(m,ti(c),shut);for(const p of [...Hd,...r.camps])if(!Rd[p.ty*W+p.tx])miss.push(c.name+'>'+(p.name||p.tx+','+p.ty)+(shut?' shut':''))}
   ok(!miss.length,name+': every holding and camp reachable from every capital, also with the flooding fords shut'+(miss.length?': '+miss.slice(0,4).join(', '):''))}
  // ---- roads: 8-connected tiles, no peak, water only at crossings, no right-angle stairs; lines
  {let bad=[],stairs=0,tiles=0,pts=0;const X=new Set(m.crossings.flatMap(c=>c.tiles)),nearH=(x,y)=>Hd.some(h=>Math.max(Math.abs(h.tx-x),Math.abs(h.ty-y))<=6);
   for(const rd of m.roads){const P=rd.path;tiles+=P.length;for(let k=0;k<P.length;k++){const i=P[k],x=i%W,y=(i-x)/W;if(K[i]===t.T_MOUNT||K[i]===t.T_WATER&&!X.has(i))bad.push(rd.a+'-'+rd.b+' '+x+','+y);
     if(k){const j=P[k-1],px=j%W,py=(j-px)/W;if(Math.max(Math.abs(px-x),Math.abs(py-y))!==1)bad.push(rd.a+'-'+rd.b+' gap at '+x+','+y)}
     if(k>1){const a=P[k-2],b=P[k-1],ax=a%W,ay=(a-ax)/W,bx=b%W,by=(b-bx)/W;if(Math.abs(ax-x)===1&&Math.abs(ay-y)===1&&(ax===bx||ay===by)&&(bx===x||by===y)&&!nearH(ax,ay)&&!nearH(bx,by)&&!nearH(x,y))stairs++}}
    for(const l of rd.line){pts+=l.length/2;if(l.length<4||l.length%2||l.some((v,k)=>!(v>=0&&v<=(k%2?H:W))))bad.push(rd.a+'-'+rd.b+' line')}}
   // (a bridge's track, play-test 3: from the bridge's end to a tile of another road)
   const ends=new Set(m.crossings.filter(c=>c.kind==='bridge').flatMap(c=>[c.i,c.j])),spur=rd=>!rd.a&&!rd.b&&rd.kind==='track'&&ends.has(rd.path[0])&&m.roads.some(o=>o!==rd&&o.path.includes(rd.path[rd.path.length-1]));
   ok(!bad.length&&m.roads.every(rd=>['road','track'].includes(rd.kind)&&(Hd.some(h=>h.name===rd.a)&&Hd.some(h=>h.name===rd.b)||spur(rd))),name+': '+m.roads.length+' roads ('+m.roads.filter(rd=>!rd.a).length+' tracks to bridges; '+m.roads.filter(rd=>rd.kind==='road').length+' great), '+tiles+' tiles, each 8-connected, never on a peak, on water only at a crossing; their lines '+pts+' points'+(bad.length?': '+bad.slice(0,4).join(', '):''));
   ok(stairs<=tiles*.01,name+': no right-angle stairs (corner tiles where the next touches the one before, but within 6 tiles of a holding, where roads go 4 ways: '+stairs+' of '+tiles+')');
   const on=new Set(m.roads.flatMap(rd=>rd.path).filter(i=>K[i]===t.T_ROAD&&!(m.feat[i]&32))),ft=[...on].filter(i=>m.feat[i]&64).length,tr=[...on].filter(i=>m.feat[i]&128).length;ok(ft>0&&ft+tr===on.size,name+': road tiles marked great road ('+ft+') or track ('+tr+') of '+on.size)}
  // ---- no road runs into water but by a crossing (the owner's play-test 2: a road went straight into the river): each road from
  // a holding's tile out through its gate below it and in through the other's, never through a holding's centre (placeBox) nor the
  // ring beside and behind it; its line over water only where a crossing spans it (16 points a tile; a graze of a water tile's
  // corner under 0.15 tile, 2.4 px, let pass: the art's road is wider)
  {const X=new Set(m.crossings.flatMap(c=>[...c.tiles])),hold=new Map(Hd.map(h=>[ti(h),h])),ring=new Map(),bad=[],wet=[];
   for(const h of Hd){const b=t.placeBox(h);for(let y=b.y-1;y<=h.ty;y++)for(let x=b.x-1;x<=b.x+b.n;x++)if(m.has(x,y))ring.set(y*W+x,h)}
   for(const rd of m.roads){const P=rd.path,a=hold.get(P[0]),b=hold.get(P[P.length-1]),g=h=>(h.ty+1)*W+h.tx;
    if(rd.a&&(!a||!b||P[1]!==g(a)||P[P.length-2]!==g(b)))bad.push(rd.a+'-'+rd.b+' ends');
    for(let k=1;k<P.length-1;k++)if(ring.has(P[k])){bad.push(rd.a+'-'+rd.b+' by '+ring.get(P[k]).name);break}
    for(const l of rd.line)for(let k=2;k<l.length;k+=2){const ax=l[k-2],ay=l[k-1],n=Math.ceil(Math.hypot(l[k]-ax,l[k+1]-ay)*16);
     for(let s=0;s<=n;s++){const x=ax+(l[k]-ax)*s/n,y=ay+(l[k+1]-ay)*s/n,i=Math.floor(y)*W+Math.floor(x),fx=x%1,fy=y%1;if(K[i]===t.T_WATER&&!X.has(i)&&Math.min(fx,fy,1-fx,1-fy)>=.15){wet.push(rd.a+'-'+rd.b+' '+x.toFixed(1)+','+y.toFixed(1));break}}}}
   ok(!bad.length,name+': every road runs from a holding out through its gate, in front of its centre, to another’s; none past a centre’s sides or back'+(bad.length?': '+bad.slice(0,4).join(', '):''));
   ok(!wet.length,name+': no road’s line runs into water but where a crossing spans it'+(wet.length?': '+wet.slice(0,4).join(', '):''))}
  // ---- crossings
  {const bad=[],w=c=>Math.max(...c.tiles.map(i=>m.river[i]&3)),town=new Uint8Array(W*H);
   for(const h of Hd)if(h.kind==='town'||h.kind==='city'||h.style==='port')for(let b=-8;b<=8;b++)for(let a=-8;a<=8;a++)if(a*a+b*b<=64&&m.has(h.tx+a,h.ty+b))town[(h.ty+b)*W+h.tx+a]=1;
   for(const c of m.crossings){const T=c.tiles;if(!T.length||!t.passable(K[c.i])||!t.passable(K[c.j]))bad.push(c.kind+' ends');
    if(c.kind==='bridge'&&(T.length>3||T.some(i=>K[i]!==t.T_ROAD||!(m.feat[i]&32))))bad.push('bridge '+T.length);
    if(c.kind==='ford'&&(T.length>3||w(c)>=3||T.some(i=>K[i]!==t.T_FORD)))bad.push('ford width '+w(c));
    if(c.kind==='ferry'&&(!(w(c)===3&&(town[c.i]||town[c.j]))&&!(T.some(i=>m.river[i]&4)&&Hd.some(h=>[c.i,c.j].every(i=>Math.max(Math.abs(i%W-h.tx),Math.abs(Math.floor(i/W)-h.ty))<=t.PLACE_HOLD.end)))||T.some(i=>K[i]!==t.T_WATER)))bad.push('ferry');}
   ok(!bad.length,name+': '+m.crossings.length+' crossings ('+['bridge','ford','ferry'].map(k=>m.crossings.filter(c=>c.kind===k).length+' '+k+'s').join(', ')+'): bridges over 3 tiles of water at most, no ford on a great river, ferries on great rivers by towns and ports (or a holding’s own on a river boats sail, its ends within '+t.PLACE_HOLD.end+' tiles of it)'+(bad.length?': '+bad.slice(0,4).join(', '):''));
   // (by each holding (the owner's play-test 3): a river's water within PLACE_HOLD.river tiles of it, the land beside it within
   // PLACE_HOLD.bank walked to from its gate, not far round (placeWalk, PLACE_HOLD.box, round), else a crossing of that river within
   // PLACE_HOLD.end of it, but where none can be made (holdBare, INFO))
   {const P=t.PLACE_HOLD,near1=(w,h,x,y)=>{const d=t.placeWalkSteps(w,x,y);return d>=0&&d<=P.round[0]*(Math.abs(x-h.tx)+Math.abs(y-h.ty-1))+P.round[1]},rv=new Int16Array(W*H).fill(-1),q=[],miss=[],left=[];for(const r of m.rivers)for(const i of r.path)if(rv[i]<0){rv[i]=r.id;q.push(i)}
    for(let a=0;a<q.length;a++){const i=q[a],x=i%W,y=(i-x)/W;for(const [dx,dy] of t.DIR8){const j=i+dx+dy*W;if(m.has(x+dx,y+dy)&&rv[j]<0&&(m.river[j]&3)){rv[j]=rv[i];q.push(j)}}}
    const xed=(h,rr)=>m.crossings.some(c=>(c.river===rr||c.tiles.some(i=>rv[i]===rr))&&[c.i,c.j].some(i=>Math.max(Math.abs(i%W-h.tx),Math.abs(Math.floor(i/W)-h.ty))<=P.end));
    for(const h of Hd){const w=t.placeWalk(m,ti(h)+W,P.box),near=new Set(),seen=new Set();
     for(let y=h.ty-P.river;y<=h.ty+P.river;y++)for(let x=h.tx-P.river;x<=h.tx+P.river;x++)if(m.has(x,y)&&K[y*W+x]===t.T_WATER&&rv[y*W+x]>=0)near.add(rv[y*W+x]);
     for(let y=h.ty-P.bank;y<=h.ty+P.bank;y++)for(let x=h.tx-P.bank;x<=h.tx+P.bank;x++){const i=y*W+x;if(!m.has(x,y)||!t.passable(K[i])||near1(w,h,x,y))continue;
      for(const j of [i-1,i+1,i-W,i+W]){if(j<0||j>=W*H||K[j]!==t.T_WATER||!near.has(rv[j]))continue;const k=h.name+' '+m.rivers[rv[j]].name;if(!seen.has(k)){seen.add(k);if(!xed(h,rv[j]))(r.stats.holdBare.includes(k)?left:miss).push(k+' at '+x+','+y)}}}}
    ok(!miss.length,name+': by each holding the land beside every river within '+P.river+' tiles walked to from its gate, not far round, else a crossing of it within '+P.end+' tiles ('+r.stats.holdXing+' crossings laid for it: '+['ford','bridge','ferry'].map(k=>m.crossings.slice(m.crossings.length-r.stats.holdXing).filter(c=>c.kind===k).length+' '+k).join(', ')+')'+(miss.length?': not '+miss.slice(0,4).join(', '):''));
    if(left.length)info(name+': rivers by a holding no crossing can be made over (a pocket of land in a bend, its ends notches): '+left.join(', '))}
   // (along a river, where no crossing is: a stretch over 60 tiles only where none can be made in its first 60 (a ford or bridge
   // over 3 tiles of water at most, a ferry over 12 by a town or port; across or down the river, from walkable land joined to the
   // main land to such land, no end a notch with water on both sides across the way nor in a holding's centre or the ring beside
   // and behind it, nor by another crossing's end): the bare stretches, as INFO)
   const main=new Int32Array(W*H).fill(-1),sz=[];for(let s=0;s<W*H;s++){if(main[s]>=0||K[s]===t.T_MOUNT||K[s]===t.T_WATER&&!(m.river[s]&3))continue;const st=[s];main[s]=sz.length;let n=0;
    while(st.length){const i=st.pop(),x=i%W;n++;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<W*H&&main[j]<0&&K[j]!==t.T_MOUNT&&(K[j]!==t.T_WATER||m.river[j]&3)){main[j]=main[s];st.push(j)}}sz.push(n)}
   const big=sz.indexOf(Math.max(...sz)),Xt=new Set(m.crossings.flatMap(c=>c.tiles)),bx=new Set();for(const h of Hd){const b=t.placeBox(h);for(let y=b.y-1;y<=h.ty;y++)for(let x=b.x-1;x<=b.x+b.n;x++)if(m.has(x,y)&&!(x===h.tx&&y===h.ty+1))bx.add(y*W+x)}
   const end=(i,s)=>{const x=i%W,y=(i-x)/W,v=s===1||s===-1;return t.passable(K[i])&&K[i]!==t.T_FORD&&main[i]===big&&!bx.has(i)&&t.placeApart(m,i)&&!(v?K[i-W]===t.T_WATER&&K[i+W]===t.T_WATER:K[i-1]===t.T_WATER&&K[i+1]===t.T_WATER)};
   const can=i=>{if(K[i]!==t.T_WATER||Xt.has(i))return false;const x=i%W,y=(i-x)/W;for(const [dx,dy] of [[1,0],[0,1]]){const s=dx+dy*W;let a=0,b=0;
     while(a<=12&&m.has(x-dx*(a+1),y-dy*(a+1))&&K[i-s*(a+1)]===t.T_WATER)a++;while(b<=12&&m.has(x+dx*(b+1),y+dy*(b+1))&&K[i+s*(b+1)]===t.T_WATER)b++;
     const p=i-s*(a+1),q=i+s*(b+1),k=a+b+1;if(!m.has(x-dx*(a+1),y-dy*(a+1))||!m.has(x+dx*(b+1),y+dy*(b+1))||!end(p,s)||!end(q,s))continue;const T=[];for(let n=1;n<=k;n++)T.push(p+s*n);
     if(T.some(j=>Xt.has(j)))continue;const w=Math.max(...T.map(j=>m.river[j]&3));if(k<=3||w===3&&k<=12&&(town[p]||town[q]))return true}return false};
   const gaps=[],bare=[];for(const rv of m.rivers){const at=new Map(rv.path.map((i,k)=>[i,k])),pos=[0];
    for(const c of m.crossings){let p=-1;for(const i of c.tiles){if(at.has(i))p=at.get(i);else{const x=i%W,y=(i-x)/W;for(let b=-2;b<=2&&p<0;b++)for(let a=-2;a<=2&&p<0;a++)if(at.has(i+a+b*W)&&m.has(x+a,y+b))p=at.get(i+a+b*W)}}if(p>=0&&c.river===rv.id)pos.push(p)}
    pos.push(rv.path.length-1);pos.sort((a,b)=>a-b);for(let k=1;k<pos.length;k++)if(pos[k]-pos[k-1]>60){const lo=pos[k-1],hi=Math.min(lo+60,pos[k]-1);let c=-1;for(let q=lo+1;q<=hi&&c<0;q++)if(can(rv.path[q]))c=q;
     const up=r.stats.droppedAt.some(d=>d.river===rv.id&&d.at>lo&&d.at<pos[k]);(c<0||up?bare:gaps).push(rv.name+' '+lo+'-'+pos[k]+(up?' (a bridge taken up there: no road reaches it)':c<0?'':' (could at '+c+')'))}}
   ok(!gaps.length,name+': along each of '+m.rivers.length+' rivers, crossings at most 60 tiles apart wherever one can be made'+(gaps.length?': '+gaps.join(', '):''));
   info(name+': bare stretches (no crossing can be made there: peaks or cut-off land on a bank, a great river too wide for a bridge away from towns, a bridge no road reaches): '+(bare.join(', ')||'none')+'; the generator’s: '+(r.stats.bare.join(', ')||'none'))}
  // ---- camps
  {const D=new Int32Array(W*H).fill(-1),q=[];for(let i=0;i<W*H;i++)if(K[i]===t.T_ROAD||K[i]===t.T_FORD){D[i]=0;q.push(i)}for(let a=0;a<q.length;a++){const i=q[a],x=i%W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<W*H&&D[j]<0){D[j]=D[i]+1;q.push(j)}}
   const bad=r.camps.filter(c=>{const d=D[c.ty*W+c.tx];return d<6||d>16||Hd.some(h=>d2(h,c)<14*14)||K[c.ty*W+c.tx]!==t.T_OPEN});
   ok(r.camps.length===t.density().camps&&!bad.length,name+': '+r.camps.length+' camps (density() asks '+t.density().camps+'), each 6-16 tiles from a road and 14 from every holding, on open ground'+(bad.length?': '+bad.map(c=>c.tx+','+c.ty).join(' '):''))}
  // ---- lords (D10)
  if(m.settings.holdings>40){const L=r.lords,all=L?Object.values(L).flat():[];ok(L&&t.PLACE_REALMS.every(f=>L[f].length===6&&J(L[f].slice(0,4))===J(t.FACS[f].lords))&&new Set(all).size===all.length,name+': 6 lords a realm, FACS\' four first, the rest made from their people\'s names, all unique: '+(L?t.PLACE_REALMS.map(f=>L[f].slice(4).join(', ')).join('; '):'none'))}
  else ok(r.lords===null,name+': FACS\' four lords a realm will do (lords null)')}
 // ---- the world in use, when generated: every holding's gate (lots.js leads the roads round its centre to it) on the roads, joined 8 ways
 if(t.WM.gen==='ashmark-1'){t.act('begin','soldier');const MW=t.MW,MH=t.MH,road=i=>t.tiles[i]===t.T_ROAD||t.tiles[i]===t.T_FORD,gate=z=>{const c=t.lotCentre(z);return(c.y+c.n)*MW+z.tx},seen=new Uint8Array(MW*MH),q=[gate(t.TOWNS[0])];seen[q[0]]=1;
  for(let a=0;a<q.length;a++){const i=q[a],x=i%MW;for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const j=i+c+b*MW;if(x+c>=0&&x+c<MW&&j>=0&&j<MW*MH&&!seen[j]&&road(j)){seen[j]=1;q.push(j)}}}
  const cut=t.TOWNS.filter(z=>!road(gate(z))||!seen[gate(z)]);ok(!cut.length,'the world in use: every holding’s gate on the roads, the roads joining them all (8 ways)'+(cut.length?': not '+cut.map(z=>z.name).join(', '):''));
  // (and no road stops at the water: a road tile with one road beside it (8 ways), the water beside it (4 ways), is a crossing's)
  const X=new Set(t.WM.crossings.flatMap(c=>[c.i,c.j,...c.tiles])),dead=[];
  for(let i=0;i<MW*MH;i++){if(!road(i)||X.has(i))continue;const x=i%MW;let n=0;for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const j=i+c+b*MW;if((b||c)&&x+c>=0&&x+c<MW&&j>=0&&j<MW*MH&&road(j))n++}
   if(n<=1&&[1,-1,MW,-MW].some(s=>t.tiles[i+s]===t.T_WATER))dead.push(x+','+((i-x)/MW))}
  ok(!dead.length,'the world in use: no road stops at the water but at a crossing'+(dead.length?': '+dead.slice(0,6).join(' '):''))}
 // ---- the same world twice; another seed another
 {const a=gen({preset:'normal',seed:'redwater'}),b=R['Normal redwater'];ok(a.map.sum===b.map.sum&&J(a.map.roads)===J(b.map.roads)&&J(a.map.crossings)===J(b.map.crossings)&&J(a.camps)===J(b.camps)&&J(a.holdings)===J(b.holdings),'the same settings make the same holdings, roads (and lines), crossings and camps ('+a.map.sum.toString(16)+')');
  ok(J(R['Normal bluewater'].holdings)!==J(b.holdings),'another seed places other holdings')}
 // ---- a made-up map (200 x 120, open): a great river down x 100-105 (3 wide at y 18-22), a stream along y 60 to it, peaks
 // with a gap at x 40-160 y 100: a great road over the narrows by a bridge, a track by a ferry beside a town, a track forded
 {const m=new t.WorldMap(200,120,'test'),W=200,K=m.kind,path=[],sp=[];m.gen='ashmark-1';
  for(let y=0;y<120;y++)for(let x=0;x<200;x++){const i=y*W+x,great=x>=100&&x<=(y>=18&&y<=22?102:105),stream=y===60&&x<100;
   if(!x||!y||x===199||y===119)K[i]=t.T_WATER;else if(great||stream){K[i]=t.T_WATER;m.river[i]=great?3|4:1}else if(y===100&&x>=40&&x<=160&&(x<70||x>74))K[i]=t.T_MOUNT;m.elev[i]=K[i]===t.T_WATER?60:80}
  for(let y=1;y<119;y++)path.push(y*W+100);for(let x=1;x<100;x++)sp.push(60*W+x);
  m.rivers=[{id:0,name:'Test',path,order:3,width:3,basin:0,mouth:119*W+100,nav:true,rapids:[],seasonal:null},{id:1,name:'Brook',path:sp,order:1,width:1,basin:0,mouth:60*W+100,nav:false,rapids:[],seasonal:null}];
  const H=[{name:'West',realm:'vale',kind:'castle',tx:80,ty:20},{name:'East',realm:'vale',kind:'castle',tx:125,ty:20},{name:'Ferrytown',realm:'vale',kind:'town',tx:96,ty:80},{name:'Farside',realm:'vale',kind:'village',tx:112,ty:84},
   {name:'Northdale',realm:'vale',kind:'village',tx:50,ty:50},{name:'Southdale',realm:'vale',kind:'village',tx:50,ty:72},{name:'Below',realm:'vale',kind:'village',tx:60,ty:112}];
  const g={s:{},map:m,rng:(st,a)=>t.genRng(7,st,a),work:{},hints:null,attempt:0,holdings:H,camps:[],lords:null,tries:{},relaxed:[],tick:()=>false};
  for(const it of [t.placeFields(g)]){let v;while(!(v=it.next()).done);g.work.place=v.value}
  {const it=t.genRoads(g);while(!it.next().done);}
  const X=m.crossings,road=(a,b)=>m.roads.find(r=>r.a===a&&r.b===b||r.a===b&&r.b===a),onX=(rd,k)=>rd&&X.some(c=>c.kind===k&&c.tiles.some(i=>rd.path.includes(i)));
  {const B=X.filter(c=>c.kind==='bridge');ok(B.length&&B.every(c=>c.tiles.length===3&&c.tiles.every(i=>{const y=Math.floor(i/W);return y>=18&&y<=22}))&&road('West','East').kind==='road'&&onX(road('West','East'),'bridge'),'made-up map: the great road West-East crosses the great river by a bridge at its 3-tile narrows')}
  ok(X.some(c=>c.kind==='ferry'&&c.tiles.length===6)&&X.filter(c=>c.kind==='ferry').every(c=>c.tiles.every(i=>(m.river[i]&3)===3)),'made-up map: a ferry over the 6 tiles of the great river by Ferrytown');
  ok(onX(road('Northdale','Southdale'),'ford')&&X.filter(c=>c.kind==='ford').every(c=>c.tiles.every(i=>(m.river[i]&3)<3)),'made-up map: the track Northdale-Southdale fords the stream; no ford on the great river');
  {const rd=m.roads.filter(r=>r.a==='Below'||r.b==='Below');ok(rd.length&&rd.every(r=>r.path.every(i=>K[i]!==t.T_MOUNT)),'made-up map: the roads to Below go round the peaks or through their gap ('+(rd.some(r=>r.path.some(i=>Math.floor(i/W)===100&&i%W>=70&&i%W<=74))?'the gap':'round')+'), never over them')}
  info('made-up map: '+m.roads.map(r=>r.a+'-'+r.b+' '+r.kind).join(', ')+'; crossings '+X.map(c=>c.kind+' '+c.tiles.length+(c.toll?' (toll '+c.toll+')':'')).join(', '))}
 // ---- a holding's rivers crossed near it (the owner's play-test 3), on a made-up map (180 x 60, open): three rivers along y 40 with
 // a holding 4-7 tiles north of each, its roads all north of them, each river too short for a crossing 60 tiles apart and too long
 // to walk round within 16 tiles: a stream by Brookside and a navigable river 2 wide by Bend (bridged: the owner's), a great river
 // 6 wide by Wharf (a ferry: nothing else fits); each crossing's ends within 10 tiles of its holding, the far bank then walked to from its gate
 {const m=new t.WorldMap(180,60,'test'),W=180,K=m.kind,rv=[['Brook',1,55,0,0,1],['Wide',62,118,40,41,2|4],['Great',122,178,38,43,3|4]];m.gen='ashmark-1';
  for(let y=0;y<60;y++)for(let x=0;x<180;x++){const i=y*W+x;if(!x||!y||x===179||y===59)K[i]=t.T_WATER;m.elev[i]=80}
  m.rivers=rv.map(([name,x0,x1,y0,y1,b],id)=>{const path=[];for(let x=x0;x<=x1;x++){path.push(40*W+x);for(let y=y0||40;y<=(y1||40);y++){K[y*W+x]=t.T_WATER;m.river[y*W+x]=b;m.elev[y*W+x]=60}}
   return{id,name,path,order:b&3,width:b&3,basin:0,mouth:40*W+x1+1,nav:!!(b&4),rapids:[],seasonal:null}});
  const H=[{name:'Brookside',realm:'vale',kind:'village',tx:30,ty:36},{name:'Bend',realm:'vale',kind:'town',tx:90,ty:35},{name:'Wharf',realm:'vale',kind:'village',tx:150,ty:34}];
  const g={s:{},map:m,rng:(st,a)=>t.genRng(7,st,a),work:{},hints:null,attempt:0,holdings:H,camps:[],lords:null,tries:{},relaxed:[],tick:()=>false};
  {const it=t.placeFields(g);let v;while(!(v=it.next()).done);g.work.place=v.value}
  {const it=t.genRoads(g);while(!it.next().done);}
  const xs=H.map((h,k)=>m.crossings.find(c=>c.river===k)),far=(h,i)=>Math.max(Math.abs(i%W-h.tx),Math.abs(Math.floor(i/W)-h.ty)),want=['bridge','bridge','ferry'];
  ok(xs.every((c,k)=>c&&c.kind===want[k]&&far(H[k],c.i)<=10&&far(H[k],c.j)<=10)&&m.crossings.length===3&&t.PLACE_STATS.holdXing===3,'made-up map: each holding’s river crossed near it: '+xs.map((c,k)=>H[k].name+' '+(c?c.kind+' over '+c.tiles.length+' tiles, ends '+far(H[k],c.i)+' and '+far(H[k],c.j)+' tiles off':'none')).join('; ')+' (roads '+m.roads.length+', none over the rivers)');
  ok(H.every(h=>{const w=t.placeWalk(m,(h.ty+1)*W+h.tx,16);return t.placeWalkAt(w,h.tx,h.ty+10)&&!t.placeWalkAt(t.placeWalk(m,(h.ty+1)*W+h.tx,16,true),h.tx,h.ty+10)}),'made-up map: and the far bank walked to from each gate over it (its own bank not reaching it)')}
 // ---- deposits and first stocks by the economy setting; lords from WM.lords
 {const m=R['Normal redwater'].map,n=e=>{m.settings={...m.settings,economy:e};t.genDeposits(m,t.TOWNS);return m.deposits.length},c=[n('poor'),n('normal'),n('rich')];m.settings={...m.settings,economy:'normal'};t.genDeposits(m,t.TOWNS);
  const fish=m.deposits.filter(d=>d.kind==='fish'),inl=fish.filter(d=>(m.river[d.ty*m.w+d.tx]&3)||(m.feat[d.ty*m.w+d.tx]&2));
  ok(c[0]<c[1]&&c[1]<c[2]&&inl.every(d=>d.g!=='pearls'),'deposits by the economy setting: poor '+c[0]+', normal '+c[1]+', rich '+c[2]+'; '+inl.length+' of '+fish.length+' fishing grounds in rivers and lakes, never pearls')}
 {const z=t.TOWNS[0],S0=t.WM.settings,r0=Math.random,run=e=>{t.WM.settings=e?{economy:e}:null;Math.random=t.seeded(9);t.initHolding(z);return J(z.stock)},a=JSON.parse(run(null)),b=JSON.parse(run('rich')),c=JSON.parse(run('poor'));
  Math.random=r0;t.WM.settings=S0;t.initHolding(z);
  ok(Object.keys(a).every(g=>b[g]===Math.round(a[g]*1.3)&&c[g]===Math.round(a[g]*.75)),'first stocks: x1.3 rich, x0.75 poor, as they were with no settings (grain '+a.grain+', '+b.grain+', '+c.grain+')')}
 {const W=t.W,L0=t.WM.lords,keep=W.lords.slice();t.WM.lords=null;W.lords=[];t.addMissingLords();const a=W.lords.map(l=>l.name);
  t.WM.lords=R['Large redwater'].lords;W.lords=[];t.addMissingLords();const b=W.lords.map(l=>l.name);t.WM.lords=L0;W.lords=keep;
  ok(J(a)===J(t.FIDS.flatMap(f=>t.FACS[f].lords))&&b.length===30&&t.FIDS.every(f=>t.WM&&R['Large redwater'].lords[f].every(n=>b.includes(n))),'lords: FACS\' with no WM.lords ('+a.length+'), WM.lords\' when a world has them ('+b.length+' at Large)')}
}catch(e){o.push('EXC '+e.message+' '+(e.stack||'').split('\n').slice(0,3).join(' | '))}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
