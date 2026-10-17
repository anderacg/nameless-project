'use strict';
// Arrival-facing regression: short moves must turn the group just like long moves; explicit drag facing wins.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,P=t.P,G=t.G,random0=Math.random;
 try{
  Math.random=t.seeded(2603);t.act('begin','soldier');t.W.lords=[];t.BDEPLOY.on=false;t.BAUTO.on=false;
  P.gear.weapon=t.gearId('bow',0);P.gear.offhand=null;P.troops={hum_bow:1,hum_foot:1};P.comps={};P.slots=Array(10).fill(null);
  G.mode='world';G.modal=false;G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['archer'],allies:[],foes:[]};t.startBattle({enemies:G.enc.list,tournament:false});
  const B=t.B,h=B.hero;B.obs=[];B.noMorale=true;
  for(const [label,u] of [['hero bow',h],['hero crossbow',h],['allied archer',B.units.find(q=>q.type==='hum_bow')],['infantry',B.units.find(q=>q.type==='hum_foot')],['enemy archer',B.units.find(q=>q.team===1)]]){
   if(label==='hero crossbow'){P.gear.weapon=t.gearId('crossbow',0);h.s=t.heroStats()}
   const g=B.groups[u.grp];
   const reset=()=>{B.units.forEach(q=>{q.x=q===u?450:q.team===u.team?50:900;q.y=q===u?300:480;q.cd=999});u.sx=u.sy=0;u.walkA=null;u.tgt=null;u.rt=0;u.stun=0;u.shot=null;u.face=1;u.inSlot=false;u.slotted=false;g.placeAt(450,300);g.face=0;B.sel=u.grp};
   const run=()=>{for(let i=0;i<250;i++){g.step(.03);t.aiUnit(u,.03,()=>{})}};
   for(const [name,dx,dy] of [['left',-20,0],['right',20,0],['up',0,-20],['down',0,20],['diagonal left',-20,12],['diagonal right',20,-12],['exact old threshold',-40,0]]){
    reset();if(u.team===0)t.rtsOrder(450+dx,300+dy);else g.moveTo(450+dx,300+dy);run();const a=Math.atan2(dy,dx);
    ok(!u.spdNow&&Math.hypot(u.x-(450+dx),u.y-(300+dy))<=t.RELOCATE.near+1&&t.angGap(g.face,a)<.00001,label+': '+name+' short move arrives with the ordered facing');
    if(u.s.range)ok(t.angGap(t.arcAim(u),a)<.00001&&(!dx||u.face===Math.sign(dx)),label+': '+name+' stopped cone/body do not snap back to the old facing');
   }
   reset();g.face=1.234;g.moveTo(450,300);ok(g.face===1.234,label+': a zero-distance order preserves facing');
   reset();g.moveTo(430,300,{face:0});run();ok(g.face===0&&(!u.s.range||u.face===1),label+': explicit facing survives short leftward relocation');
  }
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random0}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
