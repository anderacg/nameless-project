'use strict';
// Regression: a ranged hero must honor the drag ghost and turn for an explicit attack after moving either way.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,P=t.P,G=t.G,random0=Math.random,auto0=t.AUTOSK.on;
 try{
  Math.random=t.seeded(2601);t.act('begin','soldier');t.AUTOSK.on=false;t.W.lords=[];t.BDEPLOY.on=false;t.BAUTO.on=false;
  for(const weapon of ['bow','crossbow']){
   P.gear.weapon=t.gearId(weapon,0);P.gear.offhand=null;P.troops={hum_bow:1};P.slots=Array(10).fill(null);P.comps={};P.race='human';
   G.mode='world';G.modal=false;G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['militia'],allies:[],foes:[]};
   t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B,h=B.hero,g=B.groups.hero,e=B.units.find(u=>u.team===1);
   B.obs=[];B.noMorale=true;B.sel='hero';B.hero.x=450;B.hero.y=300;h.sx=h.sy=0;h.cd=0;e.x=850;e.y=450;e.hp=e.max=10000;e.s={...e.s,spd:0};
   B.units.filter(u=>u!==h&&u!==e).forEach(u=>{u.x=80;u.y=450});g.placeAt(h.x,h.y);g.face=0;
   const step=(strike)=>{g.step(.03);t.aiUnit(h,.03,strike||(()=>{}))};
   // The ghost is the ordered destination; the current heading then turns on group simulation time.
   const plan=t.formPlan(450,340,450,260).find(p=>p.hero);t.formDragTo(450,340,450,260);step();
   ok(t.angGap(g.face,plan.face)<.001&&t.angGap(g.currentFacing,0)<.11,weapon+': upward ghost shows destination while current heading begins a bounded turn');
   for(let i=0;i<60;i++)step();ok(t.angGap(g.currentFacing,plan.face)<.01,weapon+': stationary hero heading completes its turn without travel');
   t.formDragTo(450,260,450,340);step();
   ok(t.angGap(g.face,0)<.001&&t.angGap(g.currentFacing,plan.face)<.11,weapon+': reversed ghost points back as current heading starts turning');
   for(let i=0;i<60;i++)step();ok(t.angGap(g.currentFacing,0)<.01,weapon+': reversed facing completes through the group step');
   // A long move sets facing left; after arrival an enemy on the right must still be attackable.
   t.rtsOrder(280,300);for(let i=0;i<220;i++)step();
   ok(Math.abs(h.x-280)<8&&h.face===-1,weapon+': leftward move arrives facing left');
   e.x=h.x+100;e.y=h.y;h.cd=0;t.rtsOrder(e.x,e.y-6);let strikes=0;
   for(let i=0;i<100;i++)step(()=>{strikes++});
   ok(h.face===1&&t.inArc(h,e)&&strikes>0,weapon+': explicit rightward attack turns and completes a shot after moving left');
   e.x=h.x-100;h.cd=0;t.rtsOrder(e.x,e.y-6);strikes=0;
   for(let i=0;i<100;i++)step(()=>{strikes++});
   ok(h.face===-1&&t.inArc(h,e)&&strikes>0,weapon+': a subsequent leftward attack also turns and shoots');
   e.x=850;e.y=450;const rx=h.x+100;t.rtsOrder(rx,h.y);for(let i=0;i<220;i++)step();
   ok(Math.abs(h.x-rx)<8&&h.face===1,weapon+': moving right after attacking left does not leave the hero stuck facing left');
   // Use the actual character controller and weapon execution, not just a strike callback.
   t.invAdd('good',weapon==='bow'?'arrows':'bolts',20);t.heroState().sp=999;t.heroState().mp=999;h.cd=0;h.shot=null;B.arrows=[];e.x=h.x-100;e.y=h.y;t.rtsOrder(e.x,e.y-6);
   for(let i=0;i<120&&!B.arrows.length;i++){g.step(.03);t.charAuto(h,.03)}
   ok(h.face===-1&&B.arrows.some(a=>a.by===h&&a.vx<0),weapon+': normal hero controller launches a real projectile left after turning');
   B.arrows=[];h.cd=0;h.shot=null;e.x=h.x+100;e.y=h.y;t.rtsOrder(e.x,e.y-6);
   for(let i=0;i<120&&!B.arrows.length;i++){g.step(.03);t.charAuto(h,.03)}
   ok(h.face===1&&B.arrows.some(a=>a.by===h&&a.vx>0),weapon+': normal hero controller turns back and launches a real projectile right');
   // Ordinary troop arcs remain group-controlled, not automatically turned toward a rear target.
   const a=B.units.find(u=>u.type==='hum_bow'),ag=B.groups[testGroup('arc')];a.x=450;a.y=400;a.grp=testGroup('arc');a.sx=a.sy=0;a.cd=0;ag.placeAt(a.x,a.y);ag.face=0;e.x=350;e.y=400;ag.attack(e);
   t.aiUnit(a,.03,()=>{});ok(ag.face===0&&!a.shot,weapon+': normal archer groups retain their commanded firing arc');
  }
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random0;t.AUTOSK.on=auto0}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
