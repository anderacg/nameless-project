'use strict';
// Every bridge on the roads (the owner's, after play-test 3: "make sure the roads are always connected to the main bridges"): on the
// classic seed, Normal s1-s3, Large s1 and the owner's saltwell world (worldplace.js genRoads: a track from each end of a bridge no road
// takes to the nearest road on its bank, else that end a road itself, the bridge's way off it; a bridge neither end of which reaches a
// road taken up), each bridge's two ends road tiles joined over roads, bridges and fords to a holding's gate; and on the world in use
// every bridge tile (a road over water) so joined; there, no road's masonry down to the water by a bridge or a ford, each bridge's deck
// meeting the land at its two ends, and its deck walked only inside its rails (router.js deckLane), a band crossing one too. INFO: per world, the bridges, the tracks laid to them, the ends left a stub (the
// way off a bridge onto land no road reaches: a holding's own bridge to its fields, say) and the bridges taken up.
Kit.suite(({ok,info})=>{
 const t=T,road=k=>k===t.T_ROAD||k===t.T_FORD;
 // (the tiles joined to a holding's gate over roads, bridges and fords, 4 ways and 8 (a road's diagonal step))
 const joined=(m,Hd)=>{const W=m.w,N=W*m.h,K=m.kind,R=new Uint8Array(N),q=[];for(const h of Hd)for(const i of [(h.ty+1)*W+h.tx,h.ty*W+h.tx])if(!R[i]){R[i]=1;q.push(i)}
  for(let a=0;a<q.length;a++){const i=q[a],x=i%W,y=(i-x)/W;for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const j=i+c+b*W;if((b||c)&&m.has(x+c,y+b)&&!R[j]&&road(K[j])){R[j]=1;q.push(j)}}}return R};
 const worlds=[['classic',t.classicSettings()],...[1,2,3].map(k=>['Normal s'+k,{preset:'normal',seed:'s'+k}]),['Large s1',{preset:'large',seed:'s1'}],['saltwell',t.parseWorldCode('ASH1-X-2V40O9HH-saltwell')]];
 for(const [name,S] of worlds){const r=t.genWorld(S),m=r.map,W=m.w,K=m.kind,st={...t.PLACE_STATS},R=joined(m,r.holdings),B=m.crossings.filter(c=>c.kind==='bridge'),bad=[],spurs=m.roads.filter(x=>!x.a).length;
  for(const c of B)for(const e of [c.i,c.j])if(!road(K[e])||!R[e])bad.push((e%W)+','+Math.floor(e/W));
  info(name+': '+B.length+' bridges, '+spurs+' tracks laid to them; ends left a stub: '+(st.stubs.join(' ')||'none')+'; bridges taken up: '+(st.dropped.join(' ')||'none'));
  ok(B.length&&!bad.length,name+': both ends of every bridge ('+B.length+') on a road joined to the holdings'+(bad.length?': not '+bad.slice(0,6).join(' '):''))}
 {const m=t.WM,W=m.w,K=m.kind,R=joined(m,t.TOWNS),bad=[];let n=0;
  for(let y=1;y<m.h-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(K[i]!==t.T_ROAD||!(K[i-1]===t.T_WATER&&K[i+1]===t.T_WATER||K[i-W]===t.T_WATER&&K[i+W]===t.T_WATER))continue;n++;if(!R[i])bad.push(x+','+y)}
  ok(n&&!bad.length,'the world in use ('+m.gen+'): every bridge tile ('+n+') joined over the roads to a holding'+(bad.length?': not '+bad.slice(0,6).join(' '):''))}
 // ---- the world in use, painted by its crossings (the owner, 2026-11-18: "Why bridge not connect to the land?", "make sure that the
 //  units avoid bridge edge/beam because it's not passable", "Why there's a human made brick when there's no bridge?")
 {const m=t.WM,W=m.w,WA=t.WorldArt,C=t.CHUNK,TL=t.TILE,X=m.crossings.filter(c=>c.kind==='bridge'||c.kind==='ford'),ks=new Set();
  for(const c of X)for(const i of [c.i,c.j,...c.tiles]){const cx=Math.floor((i%W)*TL/C),cy=Math.floor(((i/W)|0)*TL/C);ks.add(cy*WA.cols+cx)}
  // (a road's masonry only on a dry face, its cut or fill: none down to the water at a ford or by a river where no bridge stands)
  let walls=0,wet=0;for(const k of ks){WA.chunk(k%WA.cols,(k/WA.cols)|0);const c=WA.chunks.get(k);walls+=c.walls||0;wet+=c.wallWet||0}
  ok(wet===0,'no road masonry down to the water by any of the '+X.length+' bridges and fords ('+ks.size+' chunks painted: '+walls+' columns of masonry, '+wet+' falling to water)');
  // (each bridge's deck meets the land at its two ends: its tip, a game px on, dry and within 1.5 px of the deck there)
  const r=t.sceneRes(),BR=(t.waysOf(WA.ensure()).bridges||[]).filter(b=>!b.small),SL=t.WORLD_WAYS.bridge.slope,gap=[],drowned=[];
  for(const b of BR){for(const sg of [-1,0,1]){const x=b.mx+sg*b.ux*(b.L/2+t.WORLD_WAYS.bridge.reach+8),y=b.my+sg*b.uy*(b.L/2+t.WORLD_WAYS.bridge.reach+8);WA.chunk(Math.max(0,Math.min(WA.cols-1,Math.floor(x/C))),Math.max(0,Math.min(WA.rows-1,Math.floor(y/C))))}b.pic=t.bridgePic(b,r);b.picR=r;const p=b.pr;for(const [sg,tip,h] of [[-1,p.lo,p.DL-p.sA*SL],[1,p.hi,p.DL-((p.hi-p.lo)-p.sB)*SL]]){const meet=d=>{const x=b.mx+b.ux*(tip/r+sg*d),y=b.my+b.uy*(tip/r+sg*d);return !t.drawnWet(x,y)&&Math.abs(h/r-t.liftAt(x,y))<=1.5};
    if(meet(-.5)||meet(1))continue;const et=b.c?(sg<0?b.c.i:b.c.j):-1;if(et>=0&&t.drawnWet(((et%W)+.5)*TL,(((et/W)|0)+.5)*TL)){drowned.push(((et%W)+.5)*TL+','+(((et/W)|0)+.5)*TL);continue}// (its end's own tile painted as water)
    gap.push(((b.mx+b.ux*tip/r)|0)+','+((b.my+b.uy*tip/r)|0))}}
  if(drowned.length)info('a bridge end whose own road tile is painted as water (the lake drawn over it, no land to meet): '+drowned.join(' '));
  ok(!gap.length,'every bridge ('+BR.length+') meets the land at both its ends, its deck level with the dry ground at its tip or just past it'+(gap.length?': not '+gap.slice(0,6).join(' '):''));
  // (its deck walked only inside its rails: a spot by its edge is off the lane and put back inside it; a walker's step there kept in)
  const hw=(t.WORLD_WAYS.road.hw[1]-1)*t.WAY_LP,half=hw-t.WORLD_WAYS.bridge.walk,B=m.crossings.filter(c=>c.kind==='bridge'),off=[];
  for(const c of B){const ex=((c.i%W)+.5)*TL,ey=(((c.i/W)|0)+.5)*TL,fx=((c.j%W)+.5)*TL,fy=(((c.j/W)|0)+.5)*TL,l=Math.hypot(fx-ex,fy-ey),ax=(fx-ex)/l,ay=(fy-ey)/l,i=c.tiles[c.tiles.length>>1],mx=((i%W)+.5)*TL,my=(((i/W)|0)+.5)*TL;
   const at=v=>[mx-ay*v,my+ax*v],q=(x,y)=>Math.abs((y-ey)*ax-(x-ex)*ay),[x1,y1]=at(hw),k=t.deckKeep(x1,y1);
   if(t.deckOut(...at(0))||!t.deckOut(x1,y1)||!k||Math.abs(q(k[0],k[1])-half)>.01)off.push(c.i);
   const w={x:mx-ay*(half-.2),y:my+ax*(half-.2)};t.walk(w,-ay*.5+ax,ax*.5+ay,1.5);if(q(w.x,w.y)>half+.01)off.push(c.i+' walked')}
  ok(!off.length,'every bridge deck ('+B.length+') walked only inside its rails, '+half+' px either side of its line (half '+hw+' px less '+t.WORLD_WAYS.bridge.walk+')'+(off.length?': not '+off.slice(0,6).join(' '):''));
  // (a band crossing one: every man within the lane, through MarchGround's cells)
  const c=B.find(q=>q.tiles.length>=3);if(!c)info('no bridge of three tiles: the band not checked');else{const G=t.G,P=t.P;P.troops={hum_foot:8,hum_bow:4};const wb=t.WORLD_BATTLE.on;t.WORLD_BATTLE.on=true;
   try{const ex=((c.i%W)+.5)*TL,ey=(((c.i/W)|0)+.5)*TL,fx=((c.j%W)+.5)*TL,fy=(((c.j/W)|0)+.5)*TL,l=Math.hypot(fx-ex,fy-ey),ax=(fx-ex)/l,ay=(fy-ey)/l,on=new Set(c.tiles);
    Kit.goTo(ex-ax*20,ey-ay*20);for(let i=0;i<30;i++)t.updateWorld(1/30);P.tx=fx+ax*20;P.ty=fy+ay*20;P.stuck=0;G.chase=null;let mx=0,n=0;
    for(let i=0;i<1500;i++){t.updateWorld(1/30);const A=t.MARCH_ARMIES.get(P);for(const u of A?A.units:[]){if(u.dead||!on.has(Math.floor(u.y/TL)*W+Math.floor(u.x/TL)))continue;n++;mx=Math.max(mx,Math.abs((u.y-ey)*ax-(u.x-ex)*ay))}}
    ok(n>0&&mx<=half+.5,'a band of 12 crossing a bridge keeps inside its rails ('+n+' steps on its deck, '+mx.toFixed(1)+' px off its line at most)')}finally{t.WORLD_BATTLE.on=wb}}}
});
