'use strict';
// Level of detail (doc/WORLD_DESIGN.md §2.2 R12; §3.5): every mover thinks by its tier, near (every frame), mid (every 4th
// frame, 4x d) or far (its kind's farStep). Unbounded radii, as now: everything is near, and through 300 frames of the world
// every mover thinks every frame with the frame's own d, as before the tiers (worldprint W8 holds the places). Bounded: the
// tiers follow the distance, mid ones think a quarter as often with the same time in all, far ones take farStep. Then the hooks that change nothing yet: the router's three calls over today's ways
// (R11: reach equals today's travel-cost field on every tile, travel steps as travelTo and routeTo did, days), the walked
// distance and frameOf (R13), and that neither tier nor walked distance is ever saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,W=t.W,r0=Math.random,pn=performance.now;
try{
 try{localStorage.clear()}catch(e){}
 const L=t.WORLD_LOD;
 // ---- unbounded: every moment of every mover goes to its thinker's think, at once, with the frame's d (as before the tiers)
 {Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  const real=t.lodThink;let calls=0,bad=0;
  window.__lodSpy=(by,o,k,d,x)=>{calls++;const spy={think:(o2,d2,x2)=>{if(o2!==o||d2!==d||x2!==x)bad++;return by.think(o2,d2,x2)},farStep:()=>{bad++;return false}};return real(spy,o,k,d,x)};
  window.__lodKeep=real;(0,eval)('lodThink=(by,o,k,d,x)=>__lodSpy(by,o,k,d,x)');
  try{t.setSpeed(1);P.tx=P.x+120;P.ty=P.y+40;for(let f=0;f<300;f++)t.updateWorld(.05)}finally{(0,eval)('lodThink=__lodKeep')}
  const all=[...W.parties,...W.caravans,...W.monsters,...W.critters,...W.refugees,...W.folk,...W.ships];
  ok(L.near===Infinity&&L.mid===Infinity&&all.every(q=>t.tierOf(q)==='near'),'the tiers are unbounded: every one of '+all.length+' movers is near');
  ok(calls>1000&&!bad,'300 frames: each of '+calls+' moments went straight to its think, with the frame\'s d ('+bad+' did not)')}
 Math.random=r0;
 // ---- bounded: sorted by distance; mid every 4th frame with 4x d; far by farStep when the kind has one
 {const keep={...L},mons=W.monsters,at=dx=>({x:P.x+dx,y:P.y,id:'wolf'}),n=at(50),m=at(300),f=at(2000);
  try{L.near=100;L.mid=600;L.t=0;W.monsters=[n,m,f];t.lodTick(.01);
   ok(t.tierOf(n)==='near'&&t.tierOf(m)==='mid'&&t.tierOf(f)==='far','sorted by distance: 50 px near, 300 mid, 2000 far');
   const calls=new Map(),log=(k,o,d)=>{const c=calls.get(o)||{think:0,far:0,d:0};c[k]++;c.d+=d;calls.set(o,c)};
   const mind={think(o,d){log('think',o,d);return false}},far={think(o,d){log('think',o,d);return false},farStep(o,d){log('far',o,d);return false}};
   L.every=1e9;for(let i=0;i<8;i++){t.lodTick(.01);t.lodEach([n,m],mind,.05)}
   const cn=calls.get(n),cm=calls.get(m);
   ok(cn.think===8&&Math.abs(cn.d-.4)<1e-9,'near thinks every frame ('+cn.think+' of 8)');
   ok(cm.think===2&&Math.abs(cm.d-.4)<1e-9,'mid thinks every 4th frame with 4x d: '+cm.think+' of 8, the same time in all ('+cm.d.toFixed(2)+' s)');
   calls.clear();for(let i=0;i<4;i++){t.lodTick(.01);t.lodEach([f],mind,.05);t.lodEach([f],far,.05)}
   const cf=calls.get(f);ok(cf.think===4&&cf.far===4,'far takes its kind\'s farStep, or thinks as near when it has none');
   ok(f.tier===undefined&&t.asMonster(f).tier==='far','a world object tells its tier (WorldObject tier)');
  }finally{Object.assign(L,keep);W.monsters=mons;t.lodTick(1)}}
 // ---- the router over today's ways (R11)
 {Math.random=t.seeded(77);t.act('begin','soldier');G.quietEvents=true;
  const MW=t.MW,MH=t.MH,TILE=t.TILE,R=t.Router;let bad=0,checked=0;
  for(const h of [t.startHolding(),...t.TOWNS.filter((x,i)=>i%7===3)]){const f=t.flowTo(h);
   for(let i=0;i<MW*MH;i++){if(!t.passable(t.tiles[i]))continue;checked++;if(R.reach(h,{x:(i%MW+.5)*TILE,y:(((i/MW)|0)+.5)*TILE})!==isFinite(f[i]))bad++}}
  ok(checked>0&&!bad,'reach equals today\'s travel-cost field on every open tile, from 6 holdings ('+checked+' tiles, '+bad+' differ)');
  const h=t.startHolding(),far=t.TOWNS.slice().sort((p,q)=>Math.hypot(q.x-h.x,q.y-h.y)-Math.hypot(p.x-h.x,p.y-h.y))[0];
  {const a={x:h.x+40,y:h.y+30},b={...a};for(let i=0;i<400;i++){t.travelTo(a,far,far.x,far.y+12,1.5);R.travel(b,t.gateGoal(far),1.5)}
   if(!t.WORLD.gen)ok(a.x===b.x&&a.y===b.y&&Math.hypot(a.x-h.x,a.y-h.y)>100,'travel to a holding steps as travelTo did ('+Math.round(Math.hypot(a.x-h.x,a.y-h.y))+' px on)')}
  {const a={x:h.x+40,y:h.y+30},b={...a},gx=h.x-300,gy=h.y+200;let ra,rb;for(let i=0;i<300;i++){ra=t.routeTo(a,gx,gy,1.5);rb=R.travel(b,{x:gx,y:gy},1.5)}
   ok(a.x===b.x&&a.y===b.y&&ra===rb,'travel to a point steps as routeTo did, and says the same of the way ('+ra+')')}
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
