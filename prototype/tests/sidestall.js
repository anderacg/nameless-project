'use strict';
// No battle stands still (the owner, 2026-10-30: "the battle sometimes seems stuck: I fought watch guards, they rout and at the same
// time the bandits joined, my AI-controlled units stop doing anything"): an army coming in is known where it stepped in
// (worldbattle.js heralded), a captain with no foe in sight that still fights goes looking (those withdrawing are none), in a world
// battle toward its ring's middle, and the stall watch (commander.js stallWatch) sends every AI group at its nearest foe once no
// blow has landed for FOE_CMD.stall s. Under Auto your army goes after the bandits.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const town=t.TOWNS.find(h=>h.owner&&h.owner!=='player'),fac=town.owner;
 const fight=()=>{Kit.world();P.fac=null;P.hostile={[fac]:G.day+20};Kit.goTo(town.x+120,town.y+80);
  const guard=t.asParty({pt:true,home:town.name,fac,x:P.x+18,y:P.y,troops:Array(4).fill('hum_foot'),cool:0}),band=t.asParty({kind:'bandits',x:P.x-30,y:P.y+10,troops:Array(5).fill('militia'),cool:0});
  W.lords=[];W.patrols=[guard];W.monsters=[];t.bandits.length=0;P.troops={hum_foot:8};
  const e={kind:'patrol',ref:guard,list:guard.troops.slice(),allies:[],foes:[],mine:true};G.enc=e;t.startBattle({enemies:e.list,tournament:false});const b=t.B;Kit.engage();t.setAuto(true,true);
  // (the bandits a little way off the ring, coming in)
  const A=b.world;band.x=A.x-(A.r+30);band.y=A.y;t.bandits.push(band);return {b,guard,band}};
 try{
  const {b,guard,band}=fight();b.world.reinforce(.01);t.drawBattle();{const m=b.world.marks?.get(band),A=b.world;
   ok(m&&m.col===t.ARRIVAL.col.foe&&/andit/i.test(m.name),'(the owner, 2026-10-30) the bandits coming: a marker on the ring where they come in, in a foe\'s colour, named ('+(m&&m.name)+')');
   const dx=band.x-A.x,dy=band.y-A.y;ok(m&&Math.abs(Math.atan2(Math.sin(m.a-Math.atan2(dy,dx)),Math.cos(m.a-Math.atan2(dy,dx))))<.6,'on the side of the ring they come from')}
  for(let i=0;i<60&&!b.units.some(u=>u.sourceArmy===band||u.sourceArmy?.src===band);i++)b.world.reinforce(.5);
  {const A=b.world;for(let i=0;i<200&&A.arrivals.length;i++)t.updateBattle(.05);t.drawBattle();const m=A.marks?.get(band);const e0=performance.now;let now=e0.call(performance);performance.now=()=>now+=2000;try{t.drawBattle()}finally{performance.now=e0}
   ok(m&&!A.marks.has(band),'once they are all in, it fades away')}
  const bm=b.units.filter(u=>u.sourceArmy===band||u.sourceArmy?.src===band);ok(bm.length&&b.sides.active,'the bandits join, an army of their own ('+bm.length+' men)');
  ok(bm.every(u=>t.lastSeen(0,u)),'where they stepped in, your side knows (the battle told of them)');
  // (the watch breaks)
  for(const g of Object.values(b.groups))if(g.resolve&&b.units.some(u=>u.grp===g.id&&(u.sourceArmy===guard||u.sourceArmy?.src===guard)))g.resolve.route();
  const hp0=bm.reduce((n,u)=>n+u.hp,0);let n=0;for(;n<1500&&!b.over&&t.B===b;n++){t.updateBattle(.05);if(bm.reduce((q,u)=>q+Math.max(0,u.hp),0)<hp0)break}
  info('bandits first struck after '+(n*.05).toFixed(1)+' s');ok(n<1500,'under Auto your army goes after the bandits as the watch runs (struck within '+(n*.05).toFixed(1)+' s)');
  if(t.B===b){b.over=true;b.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.act('cont');t.hidePanel()}
  // (the stall watch: no blow for FOE_CMD.stall s, a foe still fighting: every AI group goes at its nearest)
  {const {b}=fight();const mine=Object.values(b.groups).filter(g=>g.player&&!g.role?.startsWith('hero'));for(const g of mine)g.standAt(g.centre().x,g.centre().y);b.lastHit=b.t;t.stallWatch();
   const before=mine.map(g=>g.order+(g.hasTarget?'T':''));b.t+=t.FOE_CMD.stall+1;t.stallWatch();const after=mine.map(g=>g.order+(g.hasTarget?'T':''));
   ok(after.join()!==before.join()&&mine.some(g=>g.hasTarget||g.order!=='hold'),'no blow in '+t.FOE_CMD.stall+' s with a foe on the field: your AI groups are sent at him ('+before.join(' ')+' → '+after.join(' ')+')');
   b.over=true;b.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.act('cont');t.hidePanel()}
 }catch(x){ok(false,'EXC '+x.message+' '+x.stack)}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
