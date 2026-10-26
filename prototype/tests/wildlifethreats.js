'use strict';
Kit.suite(({ok})=>{
 const t=T,W=t.W,P=t.P;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const awareness=t.TravelAwareness.target,terrain=new Map();
 const cover=(o,kind)=>{const i=Math.floor(o.y/t.TILE)*t.MW+Math.floor(o.x/t.TILE);if(!terrain.has(i))terrain.set(i,t.tiles[i]);t.tiles[i]=kind};
 let player=null;
 t.TravelAwareness.target=()=>player;
 const threats=t.WildlifeThreats,make=()=>t.asHerd({crit:true,id:'deer',x:500,y:500,hx:500,hy:500,n:3,dir:1,t:5,a:0,tire:0,cool:0,idle:true});
 const clear=()=>{W.lords=[];t.bandits.length=0;for(const k of ['patrols','caravans','refugees','monsters','folk'])W[k]=[];threats.chosen=new WeakMap()};
 try{
  for(const [name,list,extra] of [['lord','lords',{}],['bandit',null,{}],['patrol','patrols',{}],['caravan','caravans',{}],['refugee','refugees',{}],['monster','monsters',{}],['worker','folk',{st:'field'}]]){
   clear();const npc={x:480,y:500,...extra};(list?W[list]:t.bandits).push(npc);threats.rebuild();
   ok(threats.target(make())===npc,'wildlife detects a nearby '+name+' independently of player visibility');
  }
  clear();const c=make(),npc={x:480,y:500};W.lords=[npc];threats.rebuild();
  for(const flag of ['dead','gone','inside']){npc[flag]=true;ok(threats.target(c)===null,flag+' people cannot spook wildlife');delete npc[flag]}
  W.lords=[];const worker={x:480,y:500,st:'in'};W.folk=[worker];threats.rebuild();ok(!threats.target(c),'workers inside buildings do not spook wildlife');
  for(const st of ['out','back','field']){worker.st=st;threats.rebuild();ok(threats.target(c)===worker,'outdoor worker state '+st+' spooks wildlife')}
  clear();npc.x=445;W.lords=[npc];threats.rebuild();cover(npc,t.T_FOREST);ok(!threats.target(c),'cover shortens NPC detection distance');cover(npc,t.T_OPEN);ok(threats.target(c)===npc,'same NPC is detected on open ground');
  const other={x:552,y:500};W.lords.push(other);threats.rebuild();ok(threats.target(c)===npc,'similar nearby threats do not flip the escape heading');other.x=520;threats.rebuild();ok(threats.target(c)===other,'a clearly closer threat takes priority');
  clear();threats.rebuild();ok(!threats.target(c),'undetected player does not bypass travel awareness');player={id:'archers',x:470,y:500};ok(threats.target(c)===player,'detected player marching group supplies its own position');player=null;
  W.lords=[npc];threats.rebuild();const cow=make();cow.id='cow';ok(!threats.target(cow),'livestock continues grazing near people');
  // Exercise both movement paths on real open ground, with the player sheltered far away.
  let at=null;for(let y=20;y<t.MH-20&&!at;y++)for(let x=20;x<t.MW-20&&!at;x++)if([0,1,2,3].every(i=>t.tAt(x+i,y)===t.T_OPEN))at={x:(x+1.5)*t.TILE,y:(y+.5)*t.TILE};
  const herd=make();Object.assign(herd,at,{hx:at.x,hy:at.y});npc.x=at.x-10;npc.y=at.y;W.lords=[npc];P.stay='sheltered';threats.rebuild();const before=herd.x;t.HERD_MIND.think(herd,.1,0);ok(herd.x>before&&herd.hx===herd.x,'herd flees NPC and moves grazing anchor while player is sheltered');P.stay=null;
  const hunt=Object.create(t.WildHunt.prototype);Object.assign(hunt,{herd,animals:[{x:herd.x,y:herd.y,hp:1,dir:1,walk:0}],sources:[],time:1,alert:false,alertAt:Infinity});
  hunt.flee(.1,.1);ok(hunt.alert&&hunt.alertAt===1,'nearby NPC alerts animals during an active hunt');hunt.time=2;const start=hunt.animals[0].x;hunt.flee(.1,.1);ok(hunt.animals[0].x>start,'hunted animals escape the NPC instead of the distant player');
 }finally{t.TravelAwareness.target=awareness;for(const [i,kind] of terrain)t.tiles[i]=kind;P.stay=null}
});
