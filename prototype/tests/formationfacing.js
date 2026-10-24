'use strict';
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),gap=t.angGap;
 try{
  L.start({leftGroups:[{type:'hum_bow',count:8,name:'West bow'},{type:'hum_bow',count:8,name:'North bow'},{type:'hum_hbow',count:4,name:'Mounted'},{type:'hum_mage',count:2,name:'Mages'}],rightGroups:[{type:'hum_bow',count:5,name:'Enemy bow'}],deploy:false,paused:true,ai:false,morale:false,seed:42});
  const b=t.B,ids=t.playerGroups(),a=b.groups[ids[0]],n=b.groups[ids[1]],mt=b.groups[ids[2]],mage=b.groups[ids[3]],foe=b.groups[Object.keys(b.groups).find(id=>b.groups[id].foe)];
  a.placeAt(300,280);a.face=0;a.currentFacing=0;t.layForm(a.id);n.placeAt(560,350);n.face=Math.PI/2;n.currentFacing=Math.PI/2;t.layForm(n.id);
  ok(a.currentFacing===0&&n.currentFacing===Math.PI/2,'duplicate same-type groups retain separate initial current headings');
  a.face=Math.PI-.01;const before=a.currentFacing;b.paused=true;t.updateBattle(.2);ok(a.currentFacing===before,'battle pause freezes current formation facing');
  b.paused=false;for(let i=0;i<5;i++)t.updateBattle(.03);
  ok(a.currentFacing>before&&a.currentFacing<Math.PI,'current heading advances by a bounded simulation-time turn toward the order');
  a.currentFacing=3.05;a.face=-3.05;a.turnFacing(.1);ok(a.currentFacing>3.05&&a.currentFacing<Math.PI*2,'angle wrap uses the short turn across the pi boundary');
  a.currentFacing=0;const toward={x:900,y:280},behind={x:100,y:280},arch=t.grpUnits(a.id)[0];arch.walkA=Math.PI;arch.x=300;arch.y=280;
  ok(t.arcAim(arch)===a.currentFacing&&t.inArc(arch,toward)&&!t.inArc(arch,behind),'slot movement cannot rotate grouped firing; checks use the same current heading');
  const pointIn=(poly,p)=>poly.reduce((inside,a,i)=>{const c=poly[(i+1)%poly.length];return ((a.y>p.y)!==(c.y>p.y))&&(p.x<(c.x-a.x)*(p.y-a.y)/(c.y-a.y)+a.x)?!inside:inside},false),shape=t.formationReachGeometry(a.id);
  ok(pointIn(shape.points,{x:shape.ax+shape.range*.25,y:shape.ay})&&!pointIn(shape.points,{x:shape.ax-shape.range*.25,y:shape.ay}),'formation envelope covers the forward in-arc interior and excludes the rear');
  const anchor0={x:shape.ax,y:shape.ay};arch.x+=500;arch.y+=200;const scattered=t.formationReachGeometry(a.id);arch.x-=500;arch.y-=200;
  ok(Math.hypot(scattered.ax-anchor0.x,scattered.ay-anchor0.y)<.001,'one distant slot mover cannot drag the inferred group anchor');
  a.currentFacing=Math.PI/2;const north=t.formationReachGeometry(a.id);ok(pointIn(north.points,{x:north.ax,y:north.ay+north.range*.25})&&!pointIn(north.points,{x:north.ax+north.range*.25,y:north.ay}),'the same envelope geometry rotates with the current formation heading');
  a.currentFacing=0;a.ax=shape.ax;a.ay=shape.ay;const savedFiles=a.files;a.files=2;t.layForm(a.id);t.grpUnits(a.id).forEach(u=>{u.x=a.ax+u.sx;u.y=a.ay+u.sy});const narrow=t.formationReachGeometry(a.id);
  a.files=8;t.layForm(a.id);t.grpUnits(a.id).forEach(u=>{u.x=a.ax+u.sx;u.y=a.ay+u.sy});const wide=t.formationReachGeometry(a.id);a.files=savedFiles;t.layForm(a.id);t.grpUnits(a.id).forEach(u=>{u.x=a.ax+u.sx;u.y=a.ay+u.sy});
  ok(narrow.half<wide.half&&Math.hypot(narrow.ax-wide.ax,narrow.ay-wide.ay)<.001,'envelope frontage changes with files while the formation anchor stays fixed');
  const enemyArcher=t.grpUnits(foe.id)[0];foe.currentFacing=1.7;ok(t.arcAim(enemyArcher)===foe.currentFacing,'enemy forward shooters use the same current-heading authority as friendly shooters');
  a.currentFacing=0;t.drawFormationReach(a.id,t.FIRE.blue);const layer=b.rangeCv.getContext('2d', { willReadFrequently: true }),alpha=(x,y)=>layer.getImageData(Math.round(x),Math.round(y),1,1).data[3];
  ok(alpha(shape.ax+shape.range-1,shape.ay)>0&&alpha(shape.ax-shape.range+1,shape.ay)===0,'the actual canvas envelope paints its forward edge and leaves the rear clear');
  arch.rout=true;arch.empty=true;ok(!t.shooters(a.id).includes(arch),'routed or empty shooters do not contribute to the envelope');arch.rout=false;arch.empty=false;
  const base=t.drawFormationReach,calls=[];window.__reachCalls=calls;window.__formationBase=base;(0,eval)('drawFormationReach=(id,col)=>{__reachCalls.push(id);return __formationBase(id,col)}');
  try{b.sel=[a.id,n.id];t.drawBattle()}finally{(0,eval)('drawFormationReach=__formationBase;delete window.__formationBase;delete window.__reachCalls')}
  ok(calls.length===2&&calls[0]!==calls[1]&&calls.includes(a.id)&&calls.includes(n.id),'multi-selection draws one independent envelope per selected group, including duplicate types');
  const geometry=t.formationReachGeometry(mt.id),area=q=>Math.abs(q.reduce((s,p,i)=>{const z=q[(i+1)%q.length];return s+p.x*z.y-z.x*p.y},0)/2),rest= t.grpUnits(a.id).slice(1).map(u=>[u,u.hp]);
  rest.forEach(([u])=>u.hp=0);const one=t.formationReachGeometry(a.id);rest.forEach(([u,hp])=>u.hp=hp);
  ok(geometry.circle&&t.formationReachGeometry(mage.id).circle&&geometry.range>0&&one.points.length>=3&&Math.abs(area(one.points)/(one.range*one.range)-t.SHOOT.arc/2)<.025,'mounted and mage coverage stay circular while a one-soldier fan contains the full arc area');
  // Deploy commands snap the same group orientation immediately, before simulation resumes.
  b.deploy=true;a.face=-Math.PI/2;a.currentFacing=0;t.deploySnap([a.id]);ok(a.currentFacing===a.face,'deployment placement snaps current heading to its final order');b.deploy=false;
  // No AI soldier command turns an ordinary formation to face a stationary rear target.
  a.currentFacing=0;a.face=0;foe.placeAt(100,280);t.grpUnits(foe.id).forEach(u=>{u.x=100;u.y=280});const target=t.grpUnits(foe.id)[0];a.attack(target);arch.x=300;arch.y=280;arch.sx=arch.sy=0;arch.cd=0;arch.shot=null;t.aiUnit(arch,.03,()=>{});
  ok(a.currentFacing===0&&!arch.shot,'ordinary ranged group does not independently turn for a rear target');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
