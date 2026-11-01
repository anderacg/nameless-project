'use strict';
// Level of detail (doc/WORLD_DESIGN.md §2.2 R12; §3.5): every mover thinks by its tier, the ring of chunks it stands in round
// yours (worldobject.js WORLD_LOD): near (every frame), mid (every 4th frame, 4x d) or far (its kind's farStep: beasts and herds
// hold; else as mid). Tiers off: everything is near, and through 300 frames of the world every mover thinks every frame with
// the frame's own d, as before the tiers. On: a Normal world has all three, and a far beast or herd stands still; sorted by
// rings, mid ones think a quarter as often with the same time in all, far ones take farStep. The chunk grid (core/spatial.js
// ChunkGrid) answers a box as the scan of all does, in the lists' order. Then the hooks that change nothing yet: the router's
// calls (R11: reach equals a flood over the land on every tile, days), the walked distance and frameOf (R13), and that neither
// tier nor walked distance is ever saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W,r0=Math.random,pn=performance.now;
try{
 try{localStorage.clear()}catch(e){}
 const L=t.WORLD_LOD;
 // ---- tiers off: every moment of every mover goes to its thinker's think, at once, with the frame's d (as before the tiers)
 {Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  const real=t.lodThink;let calls=0,bad=0;L.on=false;L.t=0;
  window.__lodSpy=(by,o,k,d,x)=>{calls++;const spy={think:(o2,d2,x2)=>{if(o2!==o||d2!==d||x2!==x)bad++;return by.think(o2,d2,x2)},farStep:()=>{bad++;return false}};return real(spy,o,k,d,x)};
  window.__lodKeep=real;(0,eval)('lodThink=(by,o,k,d,x)=>__lodSpy(by,o,k,d,x)');
  try{t.setSpeed(1);P.tx=P.x+120;P.ty=P.y+40;for(let f=0;f<300;f++)t.updateWorld(.05)}finally{(0,eval)('lodThink=__lodKeep')}
  const all=[...W.parties,...W.caravans,...W.monsters,...W.critters,...W.refugees,...W.folk,...W.ships];
  ok(all.every(q=>t.tierOf(q)==='near'),'tiers off: every one of '+all.length+' movers is near');
  ok(calls>1000&&!bad,'300 frames: each of '+calls+' moments went straight to its think, with the frame\'s d ('+bad+' did not)');L.on=true;L.t=0}
 // ---- tiers on, a Normal world: near, mid and far all there, by rings of chunks; a far beast and a far herd hold
 {t.lodTick(1);const all=[...W.monsters,...W.critters,...W.parties],n={near:0,mid:0,far:0},C=L.grid,ring=q=>Math.max(Math.abs(C.at(q.x)-C.at(P.x)),Math.abs(C.at(q.y)-C.at(P.y)));
  for(const q of all)n[t.tierOf(q)]++;
  ok(n.near&&n.mid&&n.far&&all.every(q=>t.tierOf(q)===(ring(q)<=L.near?'near':ring(q)<=L.mid?'mid':'far')),'a Normal world ('+t.MW+' x '+t.MH+' tiles): '+n.near+' near (within '+L.near+' ring of chunks of yours), '+n.mid+' mid (to '+L.mid+'), '+n.far+' far');
  const fm=W.monsters.find(q=>t.tierOf(q)==='far'&&!t.MONSTERS[q.id].mythic&&!q.fight),fc=W.critters.find(q=>t.tierOf(q)==='far'),at=[fm.x,fm.y,fc.x,fc.y];
  for(let f=0;f<60;f++){G.encCool=1e9;t.updateWorld(.05);if(G.mode!=='world'){t.hidePanel();G.mode='world';G.modal=false;G.enc=null}}
  ok(fm.x===at[0]&&fm.y===at[1]&&fc.x===at[2]&&fc.y===at[3],'a far beast and a far herd hold where they are (they wander only near you)')}
 Math.random=r0;
 // ---- by rings: sorted; mid every 4th frame with 4x d; far by farStep when the kind has one, else as mid
 {const keep={...L},mons=W.monsters,at=dx=>({x:P.x+dx,y:P.y,id:'wolf'}),n=at(50),m=at(1200),f=at(4000);
  try{L.t=0;W.monsters=[n,m,f];t.lodTick(.01);
   ok(t.tierOf(n)==='near'&&t.tierOf(m)==='mid'&&t.tierOf(f)==='far','sorted by rings of chunks: 50 px near, 1200 mid, 4000 far');
   const calls=new Map(),log=(k,o,d)=>{const c=calls.get(o)||{think:0,far:0,d:0};c[k]++;c.d+=d;calls.set(o,c)};
   const mind={think(o,d){log('think',o,d);return false}},far={think(o,d){log('think',o,d);return false},farStep(o,d){log('far',o,d);return false}};
   L.every=1e9;for(let i=0;i<8;i++){t.lodTick(.01);t.lodEach([n,m],mind,.05)}
   const cn=calls.get(n),cm=calls.get(m);
   ok(cn.think===8&&Math.abs(cn.d-.4)<1e-9,'near thinks every frame ('+cn.think+' of 8)');
   ok(cm.think===2&&Math.abs(cm.d-.4)<1e-9,'mid thinks every 4th frame with 4x d: '+cm.think+' of 8, the same time in all ('+cm.d.toFixed(2)+' s)');
   calls.clear();for(let i=0;i<4;i++){t.lodTick(.01);t.lodEach([f],mind,.05);t.lodEach([f],far,.05)}
   const cf=calls.get(f);ok(cf.think===1&&cf.far===4,'far takes its kind\'s farStep, or thinks as mid when it has none');
   ok(t.asMonster(f).tier==='far','a world object tells its tier (WorldObject tier)');
  }finally{Object.assign(L,keep);W.monsters=mons;L.t=0;t.lodTick(1)}}
 // ---- the chunk grid: a box gathers what the scan of all finds in its chunks, in the lists' order, each once
 {const R=t.seeded(5),A=[],B=[];for(let i=0;i<400;i++)(i%3?A:B).push({x:R()*6000-500,y:R()*4000-500});
  const g=new (t.ChunkGrid)(512).file([A,B,A]),all=[...A,...B],c=k=>Math.floor(k/512);let bad=0;
  for(let q=0;q<50;q++){const x0=R()*5000,y0=R()*3000,x1=x0+R()*1500,y1=y0+R()*1500,got=g.box(x0,y0,x1,y1,[]);
   const want=all.filter(p=>c(p.x)>=c(x0)&&c(p.x)<=c(x1)&&c(p.y)>=c(y0)&&c(p.y)<=c(y1));if(got.length!==want.length||got.some((p,i)=>p!==want[i]))bad++}
  // (the minimap's dots, render.js mapDots, from the grid round you: the old scan's, worldObjects by layer, in order)
  {const V=t.vis(),near=[...W.monsters.slice(0,3),...t.bandits.slice(0,3),...W.lords.filter(l=>!l.dead&&!l.inside).slice(0,3)];near.forEach((q,i)=>{q.x=P.x-90+i*20;q.y=P.y+(i%3-1)*30});
   L.t=0;t.lodTick(.01);const a=[],b=[];t.mapDots(V,(q,d)=>a.push(q,d.join()));
   for(const q of t.worldObjects().filter(q=>q.mapKind in t.MAP_LAYER).sort((p,r)=>t.MAP_LAYER[p.mapKind]-t.MAP_LAYER[r.mapKind])){const d=q.mapDot(V);if(d)b.push(q,d.join())}
   const moving=a.filter((v,i)=>!(i%2)&&near.includes(v)).length;
   ok(moving>=5&&a.length===b.length&&a.every((v,i)=>v===b[i]),'the minimap\'s dots from the grid round you are the old scan of everything\'s, in its order ('+a.length/2+' dots, '+moving+' of them beasts and parties by you; the scan '+b.length/2+')')}
  ok(!bad&&g.n===all.length&&g.tag.get(B[0])===1&&g.tag.get(A[0])===0,'a box of chunks gathers what the scan of all finds in them, in the lists\' order, each once (50 boxes, '+bad+' differ)')}
 // ---- the router's calls (R11)
 {Math.random=t.seeded(77);t.act('begin','soldier');G.quietEvents=true;
  const MW=t.MW,MH=t.MH,TILE=t.TILE,R=t.Router;let bad=0,checked=0;
  const flood=h=>{const f=new Uint8Array(MW*MH),q=[h.ty*MW+h.tx];f[q[0]]=1;while(q.length){const i=q.pop(),x=i%MW,y=(i-x)/MW;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,j=ny*MW+nx;if(!dx&&!dy||nx<0||ny<0||nx>=MW||ny>=MH||f[j]||!t.passable(t.tiles[j])||dx&&dy&&(!t.passable(t.tiles[y*MW+nx])||!t.passable(t.tiles[ny*MW+x])))continue;f[j]=1;q.push(j)}}return f};
  for(const h of [t.startHolding(),...t.TOWNS.filter((x,i)=>i%7===3)]){const f=flood(h);
   for(let i=0;i<MW*MH;i++){if(!t.passable(t.tiles[i]))continue;checked++;if(R.reach(h,{x:(i%MW+.5)*TILE,y:(((i/MW)|0)+.5)*TILE})!==!!f[i])bad++}}
  ok(checked>0&&!bad,'reach equals a flood over the land on every open tile, from 6 holdings ('+checked+' tiles, '+bad+' differ)');
  const h=t.startHolding(),far=t.TOWNS.slice().sort((p,q)=>Math.hypot(q.x-h.x,q.y-h.y)-Math.hypot(p.x-h.x,p.y-h.y))[0];
  const sea=(()=>{for(let i=0;i<MW*MH;i++)if(t.tiles[i]===t.T_WATER)return{x:(i%MW+.5)*TILE,y:(((i/MW)|0)+.5)*TILE}})();
  const d1=R.days(h,far),d2=R.days(h,far,t.MAP_BASE*2),dw=R.days(sea,h);
  ok(R.days(h,h)===0&&d1>0&&isFinite(d1)&&Math.abs(d2-d1/2)<1e-9&&dw===Infinity,'days: none to where you are, '+d1.toFixed(1)+' to '+far.name+' (half at twice the pace), no way to the sea');
  ok(!R.reach(h,sea)&&R.reach(h,far),'reach: not the sea, a holding on the same land');
 }
 // ---- walked distance and frameOf (R13); nothing of it saved
 {const m=t.asMonster({id:'wolf',x:P.x,y:P.y,hx:P.x,hy:P.y,lv:1,n:1,t:0,a:0,cool:0});let moved=0;
  for(let i=0;i<5;i++){const x=m.x,y=m.y;if(t.walk(m,1,0,6))moved+=Math.hypot(m.x-x,m.y-y)}
  ok(moved>0&&Math.abs(m.wd-moved)<1e-9,'walk adds up how far a thing goes ('+m.wd.toFixed(1)+' px)');
  ok(t.frameOf(m,8)===Math.floor(m.wd/8)%2&&t.frameOf(m,8,4)===Math.floor(m.wd/8)%4&&t.frameOf({x:0,y:0},8)===0,'frameOf: a frame every stride, n a cycle, 0 before a step');
  t.lodTick(1);const s=JSON.stringify(m);ok(!/"(wd|tier)"/.test(s)&&m.tier==='near','neither its tier nor its walk is in its saved data');
 }
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0;performance.now=pn}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
