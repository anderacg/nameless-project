'use strict';
Kit.suite(({ok,info})=>{const t=T,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+360,home.y+320);t.MARCH_ARMIES.delete(P);const V=120,S=t.yourSight(V),TILE=t.TILE,changed=new Map();
 const cover=(x,y,kind)=>{const j=Math.floor(y/TILE)*t.MW+Math.floor(x/TILE);if(!changed.has(j))changed.set(j,t.tiles[j]);t.tiles[j]=kind};
 const c=t.asHerd({crit:true,id:'deer',n:3,x:P.x+85,y:P.y,hx:P.x+85,hy:P.y,dir:1,t:5,a:0,cool:0,idle:true,st:'bed',coat:2});W.critters=[c];
 const F=t.herdFlock(c,t.critterArt(c.id,0,c.coat),performance.now());Object.assign(F.m[0],{x:c.x,y:c.y});Object.assign(F.m[1],{x:P.x+85,y:P.y+32});Object.assign(F.m[2],{x:P.x+85,y:P.y-32});
 try{
  cover(c.x,c.y,t.T_FOREST);cover(F.m[1].x,F.m[1].y,t.T_OPEN);cover(F.m[2].x,F.m[2].y,t.T_FOREST);
  ok(!t.spotted(c,V)&&!c.memberVisible(F.m[0],V)&&c.memberVisible(F.m[1],V),'reproduction: the forest hides the centre while an individual remains visible on open ground');
  ok(c.inView(V),'an exposed member keeps the wildlife discoverable even when its centre is hidden');
  const ents=[];c.draw(ents,{x:P.x-60,y:P.y-60},V);
  ok(ents.length===1&&ents[0].id===F.m[1],'drawing includes only the exposed individual, independent of the herd centre');
  const f=t.WorldCombat.figure(c,F.m[1],1),hidden=t.WorldCombat.figure(c,F.m[2],2);
  ok(f.inView(V)&&!hidden.inView(V),'individual target visibility uses each animal’s own forest cover');
  const pick=m=>{const found=[];c.pick({x:m.x,y:m.y-2,V,add:o=>found.push(o)});return found};
  ok(pick(F.m[1]).includes(f)&&pick(F.m[2]).length===0,'the exposed animal is clickable and the hidden animal cannot be picked');
  cover(c.x,c.y,t.T_OPEN);cover(F.m[1].x,F.m[1].y,t.T_FOREST);const second=[];c.draw(second,{x:P.x-60,y:P.y-60},V);
  ok(second.some(e=>e.id===F.m[0])&&!second.some(e=>e.id===F.m[1]),'a visible centre does not reveal a different animal inside the forest');
  const all=t.asHerd({...c,n:9,coat:4});const nine=t.herdFlock(all,t.critterArt(all.id,0,all.coat),performance.now());
  ok(nine.m.length===all.n&&new Set(nine.m.map(m=>t.WorldCombat.figure(all,m,nine.m.indexOf(m)))).size===all.n,'wildlife has one distinct member and target per animal, beyond the old six-sprite cap');
  // Existing scattered members can remain visible even when the coordinator is entirely outside sight.
  c.x=P.x+600;F.m[1].x=P.x+40;F.m[1].y=P.y+32;cover(F.m[1].x,F.m[1].y,t.T_OPEN);
  ok(c.inView(V)&&f.inView(V),'scattered animals are not culled by an out-of-range coordinator');
  const previous=F.t;c.st='walk';c.x-=2;const now=performance.now,at=previous+100;
  try{performance.now=()=>at;c.draw([],{x:P.x-60,y:P.y-60},V)}finally{performance.now=now}
  ok(F.t===at&&F.px===c.x,'nearby herd movement advances even when the centre is not visible');
  info('Mixed forest cover, individual drawing/picking/targeting, complete member counts and hidden-centre movement checked.');
  ok(!ERR.length,'individual wildlife visibility produces no runtime errors');
 }finally{for(const [j,k]of changed)t.tiles[j]=k}
});
