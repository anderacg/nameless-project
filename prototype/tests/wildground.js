'use strict';
// Wild game by the ground under it (the owner, 2026-11-21: "Wildlife doesnt seems to be effected by water, rivers or hills?";
// world/critters.js flockOk, flockLand, flockPush, herdWade; battle/hunting.js turn, wildHome). A herd's point always kept to its
// habitat, but each animal's own spot about it was checked against nothing. Now: every animal's spot is ground it could walk to from
// its herd (no water, no mountain, no lot, no ledge between); none comes to rest off it; one in the drawn water all the same is
// drawn wading, the deeper the more, never all of it; and hunted game runs by the ground: slower up a slope or through a ford, at
// home on its own ground.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE;Kit.begin('soldier',1);Kit.world();G.mode='world';
 const herds=W.critters.filter(c=>c.wild&&c.n>0),L=t.WILD_LIFE.flock,now=performance.now();
 // (the ground's own tests, apart from flockOk: what the rule is for)
 const bad=(c,x,y)=>{const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),k=t.tAt(tx,ty);return k===t.T_WATER||k===t.T_MOUNT||!t.ledgePass(c.x,c.y,x,y)||!!(t.OCC&&t.occAt(tx,ty))};
 // ---- each animal's spot ----
 {let spots=0,raw=0,kept=0,own=0;
  for(const c of herds){const A=t.critterArt(c.id,0,0),F=t.herdFlock(c,A,now),n=F.m.length,gap=Math.max(4,A.w)*L.gap;if(bad(c,c.x,c.y)){own++;continue}
   for(let k=0;k<12;k++)for(const mv of [false,true])for(let i=0;i<n;i++){const q0=t.flockOut(c,F,i,n,gap,now+k*3000,mv),q=t.flockSpot(c,F,i,n,gap,now+k*3000,mv);spots++;
    if(bad(c,c.x+q0[0],c.y+q0[1]))raw++;if(bad(c,c.x+q[0],c.y+q[1]))kept++}}
  info(herds.length+' wild herds ('+own+' with their own point off the ground), '+spots+' spots at rest and on the move');
  ok(raw>0,'left alone, an animal\'s spot falls on water, a mountain, a lot or over a ledge from its herd ('+raw+' of '+spots+')');
  ok(kept===0,'each animal\'s spot is ground it could walk to from its herd: none on water, a mountain or a lot, none over a ledge ('+kept+')')}
 // ---- where they come to rest ----
 {let rest=0,all=0;for(const c of herds){const A=t.critterArt(c.id,0,0);if(bad(c,c.x,c.y))continue;let F;for(let k=0;k<120;k++)F=t.herdFlock(c,A,now+1000+k*100);
   for(const m of F.m){all++;if(!m.walk&&bad(c,m.x,m.y))rest++}}
  ok(rest===0,'twelve seconds on, none of '+all+' animals has come to rest off it ('+rest+')')}
 // ---- pushed by its neighbour, never off it ----
 {const c=herds.find(c=>{const tx=Math.floor(c.x/TILE),ty=Math.floor(c.y/TILE);return !bad(c,c.x,c.y)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>t.tAt(tx+a,ty+b)===t.T_WATER)});
  if(!c)info('no herd beside the water on this world');else{const tx=Math.floor(c.x/TILE),ty=Math.floor(c.y/TILE),[a,b]=[[1,0],[-1,0],[0,1],[0,-1]].find(([a,b])=>t.tAt(tx+a,ty+b)===t.T_WATER);
   const m={x:(tx+.5+a*.45)*TILE,y:(ty+.5+b*.45)*TILE};t.flockPush(c,m,a*4,b*4,true);const held=!bad(c,m.x,m.y);t.flockPush(c,m,-a*2,-b*2,true);
   ok(held&&Math.abs(m.x-(tx+.5+a*.45)*TILE+a*2)<1e-9,'an animal at the water\'s edge is not pushed into it, and is pushed back from it')}}
 // ---- wading ----
 {let wet=null,deep=null,dry=null;for(let r=0;r<1200&&!(wet&&deep&&dry);r+=3)for(let a=0;a<24;a++){const x=P.x+Math.cos(a*.26)*r,y=P.y+Math.sin(a*.26)*r;
   if(!t.drawnWet(x,y)){if(!dry&&t.terrAt(x,y)===t.T_OPEN)dry={x,y};continue}const b=t.depthBand(t.drawnDepth(x,y));if(b>=3&&!deep)deep={x,y};else if(b<=1&&!wet)wet={x,y}}
  if(!wet||!deep||!dry)info('no shallow and deep drawn water near you');else{
   const calls=[],old=window.drawWading;window.drawWading=(...a)=>{calls.push(a)};
   try{const put=p=>{const c=t.asHerd({crit:true,id:'deer',n:1,x:p.x,y:p.y,hx:p.x,hy:p.y,dir:1,t:5,a:0,cool:0,idle:true,st:'bed'});c.inView=()=>true;calls.length=0;const ents=[];
      {const m=t.herdFlock(c,t.critterArt('deer',0,0),performance.now()).m[0];m.x=p.x;m.y=p.y}// (the animal itself there, bedded: it does not walk off to its spot)
      c.draw(ents,{x:p.x-100,y:p.y-80},null);
      for(const e of ents)if(e.f){t.ctx.save();e.f();t.ctx.restore()}return calls.length?calls[calls.length-1][7]:0};
    const A=t.critterArt('deer',0,0),cs=put(wet),cd=put(deep),c0=put(dry);
    ok(c0===0,'on dry ground a deer is drawn whole, on its shadow');
    ok(cs>=1&&cd>cs,'in the drawn water it wades, the deeper the more of it under ('+cs+' of its '+A.s.height+' px in the shallows, '+cd+' in deep water)');
    ok(cd<=Math.round(A.s.height*t.WILD_LIFE.wade.most),'never all of it: its back and head out ('+cd+' of '+A.s.height+')');
    {const R=t.critterArt('rabbit',0,0),m={x:deep.x,y:deep.y};ok(t.herdWade(m,R)<=Math.round(R.s.height*t.WILD_LIFE.wade.most)&&t.herdWade(m,R)>=1&&t.herdWade(dry,R)===0,'a rabbit the same, by its own size ('+t.herdWade(m,R)+' of '+R.s.height+')')}
   }finally{window.drawWading=old}}}
 // ---- the hunt: its flight by the ground ----
 {window.requestAnimationFrame=()=>0;Kit.clear();t.GUIDE.on=false;G.paused=false;G.speed=1;P.troops={hum_spear:4};
  const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);for(let y=ty-30;y<=ty+30;y++)for(let x=tx-30;x<=tx+30;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
  const cap=t.EscapeStamina.capacity({crit:true,id:'deer'}),c=t.asHerd({crit:true,id:'deer',n:3,x:P.x+40,y:P.y+10,hx:P.x+40,hy:P.y+10,dir:1,t:5,a:0,cool:0,idle:true,escapeSta:cap});W.critters=[c];
  for(let i=0;i<10;i++)t.frame();t.hunt(c);const b=t.B,a=b&&b.hunt;
  if(!a||!b.terrain)info('no hunt field here');else{b.auto=false;t.setGroupsAuto(t.playerGroups(),false,false);
   const run=()=>{for(const u of a.animals){u.alert=1;u.escapeSta=u.escapeCap;delete u.huntWay}let s=0,n=0;for(let i=0;i<10;i++){t.updateBattle(.05);for(const u of a.animals)if(u.hp>0&&!u.left&&u.spdNow>0){s+=u.spdNow;n++}}return n?s/n:0};
   const T0=b.terrain,f=T0.speedFor;let flat,slow;try{T0.speedFor=()=>1;flat=run();T0.speedFor=()=>.5;slow=run()}finally{T0.speedFor=f}
   ok(flat>0&&Math.abs(slow/flat-.5)<.02,'hunted game runs by the ground under it, as your men do: at half its pace where the ground halves a step ('+slow.toFixed(1)+' against '+flat.toFixed(1)+')')}
  const home2=k=>t.groundHome({s:t.ST[t.wildTroop(k)]},k==='ibex'?'hills':'forest');
  ok(home2('deer')&&home2('ibex')&&home2('reindeer')&&!t.groundHome({s:t.ST[t.wildTroop('gazelle')]},'forest'),'at home on its own ground: a deer in the wood, a goat on the hill, a reindeer in the snow wood; a gazelle in neither')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
