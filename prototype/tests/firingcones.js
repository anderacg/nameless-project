'use strict';
// Capture the actual Canvas arcs, not only facing state: moving cones and firing checks must agree.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,P=t.P,G=t.G,random0=Math.random,manual0=t.MANUAL_HERO;
 try{
  Math.random=t.seeded(2602);t.act('begin','soldier');t.W.lords=[];t.BDEPLOY.on=false;t.BAUTO.on=false;(0,eval)('MANUAL_HERO=false');
  P.gear.weapon=t.gearId('bow',0);P.gear.offhand=null;P.troops={hum_bow:2};P.comps={};P.slots=Array(10).fill(null);
  G.mode='world';G.modal=false;G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['archer'],allies:[],foes:[]};t.startBattle({enemies:G.enc.list,tournament:false});
  const B=t.B,h=B.hero,ally=B.units.find(u=>!u.hero&&u.team===0),foe=B.units.find(u=>u.team===1);B.obs=[];B.cam=null;B.noMorale=true;
  const capture=(c,fn)=>{const arcs=[],old=c.arc;c.arc=function(...args){arcs.push(args);return old.apply(this,args)};try{fn()}finally{c.arc=old}return arcs};
  const angle=a=>(a[3]+a[4])/2,close=(a,b)=>t.angGap(a,b)<.00001;
  for(const [label,u] of [['hero bow',h],['hero crossbow',h],['allied archer',ally],['enemy archer',foe]]){
   if(label==='hero crossbow'){P.gear.weapon=t.gearId('crossbow',0);h.s=t.heroStats()}
   B.units.forEach(q=>{q.x=q.team===u.team?50:900;q.y=480;q.cd=999});const g=B.groups[u.grp];
   for(const [direction,dx,dy] of [['left',-100,0],['right',100,0],['down',0,100],['up',0,-100],['diagonal left',-100,80],['diagonal right',100,-80]]){
    u.x=450;u.y=300;u.sx=u.sy=0;u.rt=0;u.stun=0;u.walkA=null;u.shot=null;g.placeAt(u.x,u.y);g.face=0;g.currentFacing=0;g.moveTo(u.x+dx,u.y+dy);B.aim=1.234;
    const x=u.x,y=u.y;g.step(.03);t.aiUnit(u,.03,()=>{});const movement=Math.atan2(u.y-y,u.x-x),rc=t.rangeLayer().getContext('2d');
    const fan=capture(rc,()=>t.drawReach([u],t.FIRE.blue)).find(a=>Math.abs(a[2]-u.s.range)<.00001);
    ok(u.spdNow>0&&close(t.arcAim(u),g.currentFacing)&&fan&&close(angle(fan),g.currentFacing)&&t.angGap(g.currentFacing,0)<=t.SHOOT.turn*.031,
      label+': '+direction+' slot correction leaves a bounded group-facing arc and overlay');
    if(u.hero){const small=capture(t.ctx,()=>t.drawBattle()).find(a=>Math.abs(a[0]-u.x)<.00001&&Math.abs(a[1]-(u.y-6))<.00001&&Math.abs(a[2]-(u.s.reach+5))<.00001&&Math.abs(a[4]-a[3]-.5)<.00001);
     ok(!small,'hero has no persistent short aim arc while moving '+direction)}
   }
   // Once stopped, the group-facing angle is authoritative (including diagonal ghost placements).
   u.x=g.ax+u.sx;u.y=g.ay+u.sy;g.face=-2.4;g.step(.03);t.aiUnit(u,.03,()=>{});
   const fan=capture(t.rangeLayer().getContext('2d'),()=>t.drawReach([u],t.FIRE.blue)).find(a=>Math.abs(a[2]-u.s.range)<.00001);
   ok(!u.spdNow&&fan&&close(angle(fan),g.currentFacing)&&close(t.arcAim(u),g.currentFacing),label+': stopped cone follows current group facing while order turns');
  }
  // Removing the persistent indicator does not remove active defensive/attack visuals.
  (0,eval)('MANUAL_HERO=true');B.aim=.7;const small=capture(t.ctx,()=>t.drawBattle()).find(a=>Math.abs(a[2]-(h.s.reach+5))<.00001&&Math.abs(a[4]-a[3]-.5)<.00001);
  ok(!small,'persistent short aim arc is absent in manual mode too');
  B.blocking=true;const guard=capture(t.ctx,()=>t.drawBattle()).find(a=>Math.abs(a[0]-h.x)<.00001&&Math.abs(a[1]-(h.y-6))<.00001&&Math.abs(a[2]-13)<.00001&&Math.abs(a[4]-a[3]-1.8)<.00001);ok(guard&&close(angle(guard),B.aim),'active blocking arc remains intact');B.blocking=false;
  B.slashes=[{x:h.x,y:h.y-6,r:21,a:.3,arc:1.1,life:.2}];const slash=capture(t.ctx,()=>t.drawBattle()).find(a=>Math.abs(a[2]-21)<.00001&&Math.abs(a[4]-a[3]-2.2)<.00001);ok(slash&&close(angle(slash),.3),'actual attack slash effects remain intact');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random0;(0,eval)('MANUAL_HERO='+manual0)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
