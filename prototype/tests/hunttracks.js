'use strict';
// A hunt's tracking (battle/hunting.js HuntTracks): running animals leave prints; Auto Hunt with no prey in sight follows the
// freshest trail its hunters read, else goes to where an animal was last seen (the map's sighting at the start), and so finds
// game hidden in woods or gone out of sight, where before it stood still.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;
 const hunt=(o)=>{Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;t.TERRAIN.on=true;t.FOG.on=true;t.BEAST_TACTICS.on=true;t.PHYSICS.on=true;t.EXITS.on=true;G.paused=false;G.speed=1;
  const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);P.troops={hum_foot:6};const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-25;y<=ty+25;y++)for(let x=tx-25;x<=tx+25;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
  const c=t.asHerd({crit:true,id:'deer',n:4,x:P.x+60,y:P.y,hx:P.x+60,hy:P.y,dir:1,t:5,a:0,cool:0,idle:true,escapeSta:o.tired?0:undefined});W.critters=[c];t.frame();t.LOADING.sync=false;t.hunt(c);t.WildHunt.start();t.frame();const b=t.B,a=b.hunt;b.hero.stun=1e9;// (the troops alone: the hero's own mind hunts apart)
  if(o.still)for(const u of a.animals)u.s={...u.s,spd:0};
  if(o.wood){const T=b.terrain,cs=T.cs;for(let i=0;i<T.kind.length;i++){const x=(i%T.C+.5)*cs,y=(Math.floor(i/T.C)+.5)*cs;if(a.animals.some(u=>Math.hypot(u.x-x,u.y-y)<o.wood))T.kind[i]=t.TKIND.wood}t.sightStep(true)}
  return{b,a}};
 // ---- deer standing in woods: unseen from afar, found where the map saw them
 {const {b,a}=hunt({still:true,wood:24}),start=b.units.filter(u=>u.team===0&&!u.hero).map(u=>({u,x:u.x,y:u.y}));ok(a.animals.every(u=>!t.seenBy(0,u)),'deer in woods are out of the hunters’ sight');
  for(let i=0;i<1200&&t.B===b&&!b.over&&b.kills<a.animals.length;i++)t.updateBattle(.05);
  ok(start.some(({u,x,y})=>Math.hypot(u.x-x,u.y-y)>60),'with nothing in sight Auto Hunt makes for where the herd was seen');ok(b.kills>0,'and finds and kills the deer hidden in the woods ('+b.kills+')');if(t.B===b)t.B.hunt.end();t.act('lt-leave')}
 // ---- tired deer running out of sight: prints, and the hunters on their trail
 {const {b,a}=hunt({tired:true});let idle=0,left=0;
  for(let i=0;i<1200&&t.B===b&&!b.over;i++){t.updateBattle(.05);const live=a.animals.filter(u=>u.hp>0&&!u.left),hs=b.units.filter(u=>u.team===0&&!u.hero&&u.hp>0);if(i>200&&live.length&&live.every(u=>!t.seenBy(0,u))){left++;if(hs.every(u=>(u.spdNow||0)<1))idle++}}
  const prints=[...a.tracks.trails.values()].reduce((n,l)=>n+l.length,0);info('prints '+prints+'; out of sight '+(left*.05).toFixed(1)+' s, standing idle then '+(idle*.05).toFixed(1)+' s; kills '+b.kills);
  ok(prints>4,'running deer leave prints');ok(left===0||idle<left*.25,'with the deer out of sight the hunters keep after them, mostly moving');if(t.B===b)t.B.hunt.end()}
 ok(!ERR.length,'hunt tracking has no runtime errors');
});
