'use strict';
// Who rides into a world battle unasked (worldbattle.js JOIN_RULES, WorldBattleArea#tempted; the owner, 2026-10-30: "reduce the
// participants rate for natural enemies, like monsters randomly joining a battle in the center of a city; bandits likely not to join a
// clash between big armies, they may join when both have low unit count or have been fighting for some time"; "both": the rule and a
// shorter reach). A band joins a small fight, or a worn one, never a big fresh clash; a hungry beast away from the holdings, never one
// by a holding nor a beast that waits to be hunted; both only once their own body reaches the ground the fight is fought on (the owner, 2026-11-20:
// "only consider them when they actually in the attack range": WorldBattleArea#knows).
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,J=t.JOIN_RULES,rnd=Math.random;Kit.begin('soldier',1);Kit.clear();t.GUIDE.on=false;
 const open=far=>{for(let k=0;k<4000;k++){const h=t.TOWNS[k%t.TOWNS.length],a=k*2.39996,d=far?320+(k%7)*40:60+(k%5)*10,x=h.x+Math.cos(a)*d,y=h.y+Math.sin(a)*d;
   if(t.passable(t.terrAt(x,y))&&!t.hiddenAt(x,y)&&(far?t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>J.beast.near+80):true))return[x,y]}return null};
 const fight=(mine,theirs,at)=>{Kit.world({encCool:0});Kit.goTo(at[0],at[1]);P.troops={hum_foot:mine};
  const foe=t.asParty({kind:'raiders',troops:Array(theirs).fill('militia'),x:P.x+20,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(foe);
  G.enc={kind:'party',ref:foe,list:foe.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});Kit.engage();return t.B};
 const end=()=>{if(t.B){t.B.over=true;t.B.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();Kit.done({cont:true,world:true})}};
 // (one whose body's edge (march.js marchOuter) is d px past the fight's ground (WorldBattleArea#reach): d < 0, into it by -d)
 const edge=(A,o,d)=>{o.x=A.x+A.reach()+t.marchOuter(o)+d;o.y=A.y;return o};
 const band=(A,d)=>{const o=t.asParty({kind:'bandits',troops:Array(4).fill('militia'),x:A.x,y:A.y,cool:0});t.bandits.push(o);return edge(A,o,d)};
 const tries=(A,o,n=6)=>{for(let i=0;i<n;i++){t.B.t+=J.every+.01;A.reinforce(.01);if(A.participants.has(o))return true}return false};
 try{window.Math.random=()=>.05;
  const near=open(false),far=open(true);ok(!!near&&!!far,'(a spot by a holding and one far from any)');
  // ======== bands
  {const b=fight(4,3,far),A=b.world,o=band(A,-8);ok(tries(A,o),'a small fight (your 4 against 3): a band whose men reach 8 px into the fight rides in');end()}
  {const b=fight(4,3,far),A=b.world,o=band(A,8);ok(!tries(A,o,12),'one whose men stop 8 px short of it does not, however long it goes on');end()}
  {const b=fight(30,20,far),A=b.world,o=band(A,-8);ok(!tries(A,o),'a big fresh clash (30 against 20): a band keeps away');
   b.t=J.band.after+1;const all=b.units.filter(u=>t.fighting(u));all.filter((u,i)=>i%2===0&&!u.hero).forEach(u=>{u.hp=0});ok(tries(A,o),'once it has gone on '+J.band.after+' s and half have fallen, it rides in to pick at it');end()}
  // ======== beasts
  const beast=(A,id,d)=>{const m=t.asMonster({id,x:A.x,y:A.y,hx:A.x,hy:A.y,lv:1,n:3,t:0,a:0,cool:0});W.monsters=[m];edge(A,m,d);m.hx=m.x;m.hy=m.y;return m};
  {const b=fight(4,3,far),A=b.world,m=beast(A,'wolf',-8);ok(tries(A,m),'away from the holdings a hungry pack (wolves) may join');W.monsters=[];end()}
  // (the owner, 2026-11-01: a troll came in that could not have known of the fight; 2026-11-20: only those in the attack range) one
  // whose pack stops short of the ring, though it sees and hears the fight, never joins (WorldBattleArea#knows)
  {const b=fight(4,3,far),A=b.world,m=beast(A,'wolf',10);
   ok(10<t.WORLD_SCALE.sight.monster&&!A.knows(m)&&!tries(A,m,12),'a hungry pack 10 px short of the fight (well in its sight, '+t.WORLD_SCALE.sight.monster+' px): not in it, never joins');W.monsters=[];end()}
  {const b=fight(4,3,far),A=b.world,m=beast(A,'boar',-8);ok(!tries(A,m),'a beast that waits to be hunted (boars) never does');W.monsters=[];end()}
  {const b=fight(4,3,near),A=b.world,m=beast(A,'wolf',-8),by=t.TOWNS.some(h=>Math.hypot(h.x-m.x,h.y-m.y)<J.beast.near);ok(by&&!tries(A,m),'by a holding, no beast joins the fight');W.monsters=[];end()}
  // ======== the chance, weighed once every few seconds
  {const b=fight(4,3,far),A=b.world,o=band(A,-8);window.Math.random=()=>.99;ok(!tries(A,o,3),'unlucky dice: it stays out');window.Math.random=()=>.05;
   A.reinforce(.01);ok(!A.participants.has(o),'and is not asked again before '+J.every+' s have passed');ok(tries(A,o),'then it may ride in');end()}
 }finally{window.Math.random=rnd}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
