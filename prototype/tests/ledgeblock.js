'use strict';
// Ledges too high to climb or too deep to leap (the owner, 2026-11-18: "If too high or too low then we cannot go down or go up";
// world/map.js ledgeBits, LEDGE): a step over a face of the land higher than LEDGE.up px is never climbed, deeper than LEDGE.down px
// never leapt, one way where only one is; roads, fords and bridges always pass; no holding or place is cut off. The ways go round
// (router.js findPath, wayLocal, the graph, the straight lines), and so does everyone walking (world.js walk): you, your drawn way, a
// party sent across. And on a bridge (the owner: "the bridge path seems weird"): the river beside it shut to the ways and a march
// (router.js bridgeSide).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE;Kit.begin('soldier',1);Kit.clear();Kit.world();G.quietEvents=true;
 const WM=t.WM,MW=t.MW,MH=t.MH,N=MW*MH,K=WM.kind,L=t.LEDGE;
 const t0=performance.now();const B=t.ledgeBits(WM,t.TOWNS),ms=performance.now()-t0;let nb=0;for(let i=0;i<N;i++)for(let b=1;b<16;b<<=1)if(B[i]&b)nb++;
 info('the ledges: '+nb+' steps barred one way or both ('+(nb/(4*N)*100).toFixed(2)+'% of them; up '+L.up+' px, down '+L.down+' px; '+ms.toFixed(0)+' ms, made with the world)');
 ok(nb>0&&nb<.02*4*N,'some steps are barred, a small share ('+nb+')');
 // ---- roads, fords and bridges always pass
 {const X=new Set();for(const c of WM.crossings)for(const i of c.tiles)X.add(i);const gr=i=>K[i]===t.T_ROAD||K[i]===t.T_FORD;let bad=0;
  for(let i=0;i<N;i++){if(X.has(i)&&B[i])bad++;const x=i%MW;if(x+1<MW&&gr(i)&&gr(i+1)&&(!t.ledgeOk(i,i+1)||!t.ledgeOk(i+1,i)))bad++;if(i+MW<N&&gr(i)&&gr(i+MW)&&(!t.ledgeOk(i,i+MW)||!t.ledgeOk(i+MW,i)))bad++}
  ok(!bad,'no step barred along a road or a ford, nor on a crossing ('+bad+')')}
 // ---- every holding and place reached from the first holding and back (4 ways over the ledges, a ferry's ends joined)
 {const D=[[1,0,1,4],[0,1,2,8],[-1,0,4,1],[0,-1,8,2]],FE=new Map();for(const c of WM.crossings)if(c.kind==='ferry'){FE.set(c.i,(FE.get(c.i)||[]).concat(c.j));FE.set(c.j,(FE.get(c.j)||[]).concat(c.i))}
  const flood=(s,back,bl)=>{const seen=new Uint8Array(N),q=[s];seen[s]=1;for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i-x)/MW;
    for(const [dx,dy,bo,bi] of D){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const j=ny*MW+nx;if(seen[j]||!t.walkTile(j)||bl&&(back?B[j]&bi:B[i]&bo))continue;seen[j]=1;q.push(j)}
    for(const j of FE.get(i)||[])if(!seen[j]){seen[j]=1;q.push(j)}}return seen};
  const h0=t.TOWNS[0],s=h0.ty*MW+h0.tx,old=flood(s,false,false),fw=flood(s,false,true),bw=flood(s,true,true),tile=o=>o.tx!=null&&o instanceof t.Holding?o.ty*MW+o.tx:Math.floor(o.y/TILE)*MW+Math.floor(o.x/TILE);
  for(const [list,name] of [[t.TOWNS,'holding'],[W.sites,'place']]){let n=0;const lost=[];for(const o of list){const i=tile(o);if(!old[i])continue;n++;if(!fw[i]||!bw[i])lost.push(o.name||o.type)}
   ok(n>0&&!lost.length,'every '+name+' on the land is reached from '+h0.name+' and back over the ledges ('+n+(lost.length?'; not: '+lost.slice(0,5).join(', '):'')+')')}}
 // ---- a ledge leapt down but not climbed: one in the open, its two tiles open land
 const open=i=>t.walkTile(i)&&K[i]!==t.T_WATER&&K[i]!==t.T_ROAD&&K[i]!==t.T_FORD;let L1=null;
 for(let y=4;y<MH-4&&!L1;y++)for(let x=4;x<MW-4&&!L1;x++){const i=y*MW+x;for(const d of [1,MW,-1,-MW]){const j=i+d;if(open(i)&&open(j)&&!t.ledgeOk(i,j)&&t.ledgeOk(j,i)){const p=t.findPath((x+.5)*TILE,(y+.5)*TILE,(j%MW+.5)*TILE,((j/MW|0)+.5)*TILE,16);if(p&&p.length>1&&p.length<40){L1={i,j,p};break}}}}
 if(!L1)info('no ledge leapt one way only with a way round it near');else{const {i,j,p}=L1,cx=k=>(k%MW+.5)*TILE,cy=k=>((k/MW|0)+.5)*TILE;
  const legal=(ps)=>{let a=ps[0],bad=0;for(const b of ps.slice(1)){if(b!==a&&!t.ledgeOk(a,b))bad++;a=b}return bad};
  info('a ledge from '+(i%MW)+','+(i/MW|0)+' to '+(j%MW)+','+(j/MW|0)+': '+t.ledgeHeights(i,j).map(v=>v.toFixed(1)).join(' up, ')+' down');
  ok(!legal([i,...p]),'climbing it the way goes round: '+p.length+' tiles, every step of it open');
  const back=t.findPath(cx(j),cy(j),cx(i),cy(i),16);ok(back&&back.length===1,'leaping it down the way goes straight over ('+(back?back.length:'none')+' tile)');
  // (walked straight at it: never over it)
  {const o={x:cx(i),y:cy(i)};const ps=[i];for(let k=0;k<40;k++){t.walk(o,cx(j)-o.x,cy(j)-o.y,1);ps.push(Math.floor(o.y/TILE)*MW+Math.floor(o.x/TILE))}
   ok(!legal(ps)&&ps[ps.length-1]!==j,'one walking straight at it from below is stopped at it, never over it (ends on '+(ps[ps.length-1]%MW)+','+(ps[ps.length-1]/MW|0)+')')}
  // (a party sent across: routed round)
  {const o={x:cx(i),y:cy(i)},ps=[i];let n=0;for(;n<3000&&Math.hypot(o.x-cx(j),o.y-cy(j))>2;n++){t.Router.travel(o,{x:cx(j),y:cy(j)},1.5);ps.push(Math.floor(o.y/TILE)*MW+Math.floor(o.x/TILE))}
   ok(!legal(ps)&&Math.hypot(o.x-cx(j),o.y-cy(j))<=2,'a party sent up it goes round and gets there ('+n+' steps, every one open)')}
  // (you: your drawn way and your walk)
  {Kit.goTo(cx(i),cy(i));P.tx=cx(j);P.ty=cy(j);P.stuck=0;G.chase=null;const w=t.wuiWay(P.x,P.y,P.tx,P.ty,performance.now());const wt=[];for(let k=0;k<w.n;k++)wt.push(Math.floor(w.Y[k]/TILE)*MW+Math.floor(w.X[k]/TILE));
   ok(w.ok&&!legal(wt),'your way drawn up it bends round it ('+w.n+' points, gets there: '+w.ok+')');
   const ps=[i];let n=0;for(;n<2000&&P.tx!=null;n++){t.updateWorld(1/30);ps.push(Math.floor(P.y/TILE)*MW+Math.floor(P.x/TILE))}
   ok(!legal(ps)&&Math.hypot(P.x-cx(j),P.y-cy(j))<=8,'you walk round it and get there ('+n+' frames, every step open)')}}
 // ---- the river beside a bridge shut to a march; the bridge's own tiles open
 {const c=WM.crossings.find(c=>c.kind==='bridge');if(!c)info('no bridge');else{const side=[];const x0=c.tiles[0]%MW,y0=c.tiles[0]/MW|0;
   for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const j=(y0+b)*MW+x0+a;if(t.tiles[j]===t.T_WATER&&!c.tiles.includes(j))side.push(j)}
   ok(side.length&&side.every(j=>t.bridgeSide(j))&&!c.tiles.some(j=>t.bridgeSide(j)),'the river beside a bridge is shut to the ways and a march ('+side.length+' tiles by its first), its deck open')}}
});
