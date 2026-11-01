'use strict';
// Keep formation (formations.js GroupBlock, KEEPFORM; commands.js rtsOrder, formDragTo, toggleKeepForm; ui.js PREFS.keepform):
// footmen in front, archers 40 px behind, the block facing east. On: a right-click sends the block as one, turned to face the way it
// goes, the archers still behind; a short one keeps its facing; a drag makes the line its front, the archers behind it (set back as
// far as the front got deeper); Shift-queue and attack-move keep the shape; the hero keeps his place; deploying, the block fits the
// zone. Off: as before. Shift+K and the order bar's button toggle it, the setting kept.
Kit.suite(({ok,info})=>{
 const t=T,L=t.BattleLab,G=t.G,GAP=40,was=t.prefGet('keepform');
 const lab=()=>{if(L.active)L.exit();G.mode='world';G.modal=false;
  L.start({leftGroups:[{type:'hum_spear',count:16},{type:'hum_bow',count:12},{type:'hero',count:1}],rightGroups:[{type:'hum_levy',count:6}],deploy:false,ai:false,paused:true,morale:false,seed:42});return t.B};
 const place=(g,x,y,face=0)=>{g.placeAt(x,y);g.face=g.currentFacing=face;t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
 // (the block: footmen 8 files wide at (cx+20, cy), archers 40 px behind them, both facing east; the foe far off in a corner)
 let MX=0,MY=0;
 const setup=(cx=MX,cy=MY)=>{const B=lab(),[foot,arch]=t.playerGroups().filter(g=>g!=='hero').map(g=>B.groups[g]),e=Object.values(B.groups).find(q=>q.team===1);foot.files=8;
  place(foot,cx+GAP/2,cy);place(arch,cx-GAP/2,cy);if(e)place(e,t.BW-30,t.fieldTop()+10,Math.PI);B.sel=[foot.id,arch.id];return{B,foot,arch}};
 // (how far the archers stand behind the footmen along face, and to the side; how far 16 men files wide reach back of their place)
 const behind=(f,a,face)=>(f.ax-a.ax)*Math.cos(face)+(f.ay-a.ay)*Math.sin(face),lat=(f,a,face)=>(a.ay-f.ay)*Math.cos(face)-(a.ax-f.ax)*Math.sin(face),aside=(f,a,face)=>Math.abs(lat(f,a,face));
 const back=files=>-Math.min(...t.formSlots('line',16,0,files,1).map(s=>s[0]));
 const near=(a,b,e=.02)=>t.angGap(a,b)<e,r=v=>Math.round(v*10)/10;
 try{t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;lab();MX=t.BW/2;MY=(t.fieldTop()+t.fieldBot())/2;const N=-Math.PI/2,UP=MY-120;
  info('field '+t.BW+' wide, '+r(t.fieldTop())+' to '+r(t.fieldBot())+'; the block at ('+r(MX)+', '+r(MY)+')');
  ok(t.KEEPFORM&&t.KEEPFORM.turn>0&&t.KEEPFORM.rank>0,'the tunables in one table: a turn past '+t.KEEPFORM.turn+' px, the front within '+t.KEEPFORM.rank+' px');
  t.prefSet('keepform',true);
  // ======== on: a right-click to the north
  {const {foot,arch}=setup();t.rtsOrder(MX,UP);const c={x:(foot.ax+arch.ax)/2,y:(foot.ay+arch.ay)/2};
   ok(near(foot.face,N)&&near(arch.face,N),'a right-click to the north turns the block to face north (foot '+r(foot.face)+', archers '+r(arch.face)+')');
   ok(Math.hypot(c.x-MX,c.y-UP)<1,'its centre goes where it is sent ('+r(c.x)+', '+r(c.y)+')');
   ok(Math.abs(behind(foot,arch,N)-GAP)<1&&aside(foot,arch,N)<1,'the archers still '+GAP+' px behind the footmen, turned with the block ('+r(behind(foot,arch,N))+' behind, '+r(aside(foot,arch,N))+' aside)');
   ok(foot.ay<arch.ay&&foot.files===8,'so the footmen lead to the north, the archers follow; the footmen\'s width kept')}
  // ======== a short right-click keeps the facing
  {const {foot,arch}=setup();t.rtsOrder(MX+15,MY-20);
   ok(near(foot.face,0)&&near(arch.face,0)&&Math.abs(behind(foot,arch,0)-GAP)<1&&aside(foot,arch,0)<1,'a short right-click ('+Math.hypot(15,20)+' px) moves the block without turning it')}
  // ======== a drag sets the front line
  {const {B,foot,arch}=setup(),X=MX+150,plan=t.formPlan(X,MY-100,X,MY+100),af=arch.files;t.formDragTo(X,MY-100,X,MY+100);const want=GAP+back(foot.files)-back(8);
   ok(Math.abs(foot.ax-X)<1&&Math.abs(foot.ay-MY)<1&&near(foot.face,0)&&near(arch.face,0),'a drag down: the footmen on the line\'s middle, the block facing its left (east)');
   ok(foot.files===t.dragFiles('line',16,200),'the front group as wide as the line ('+foot.files+' files)');
   ok(Math.abs(behind(foot,arch,0)-want)<1&&aside(foot,arch,0)<1&&arch.files===af,'the archers behind it, their files kept ('+r(behind(foot,arch,0))+' px behind, '+r(want)+' wanted: the gap from the front\'s back rank kept)');
   ok(plan.length===2&&plan.every(p=>Math.abs(B.groups[p.g].ax-p.ax)<.01&&Math.abs(B.groups[p.g].ay-p.ay)<.01),'the drag\'s preview (formPlan, drawn by drawFormGhost) shows where each group stands');
   B.rdrag={x0:X,y0:MY-100,x1:X,y1:MY+100};t.drawFormGhost();B.rdrag=null}
  {const {foot,arch}=setup();t.formDragTo(MX+100,MY+25,MX+100,MY-25);const deep=behind(foot,arch,Math.PI),want=GAP+back(foot.files)-back(8);
   ok(near(foot.face,Math.PI)&&near(arch.face,Math.PI)&&foot.ax<arch.ax,'a short drag up: the block turned to face west, the archers behind it (east)');
   ok(want>GAP+5&&Math.abs(deep-want)<1,'the front deeper on the short line ('+foot.files+' files), the archers set back as far ('+r(deep)+' px behind)')}
  // ======== Shift-queue keeps the shape
  {const {foot,arch}=setup();t.rtsOrder(MX,UP,{queue:true});const q=g=>{const w=g.queue[g.queue.length-1]||{};return{ax:w.x,ay:w.y}};
   ok(foot.queue.length===1&&arch.queue.length===1&&Math.abs(behind(q(foot),q(arch),N)-GAP)<1&&aside(q(foot),q(arch),N)<1,'Shift: the waypoints turned north, the archers\' '+GAP+' px behind the footmen\'s');
   t.rtsOrder(MX+250,UP,{queue:true});
   ok(foot.queue.length===2&&Math.abs(behind(q(foot),q(arch),0)-GAP)<1&&aside(q(foot),q(arch),0)<1&&q(foot).ax>q(arch).ax,'a second one turns again from the first: east, the shape kept')}
  // (a queued waypoint north: the block turned north there, so come to it they face north (the group's own facing set as it takes the waypoint: battlecontrol.js step))
  {const {B,foot,arch}=setup();t.rtsOrder(MX,UP,{queue:true});B.paused=false;B.ready=false;let n=0;while((foot.queue.length||arch.queue.length)&&n++<600)t.updateBattle(.033);B.paused=true;
   ok(!foot.queue.length&&!arch.queue.length&&near(foot.face,N)&&near(arch.face,N),'come to a queued waypoint, they face as the block does there: north (foot '+r(foot.face)+', archers '+r(arch.face)+'; '+n+' steps)')}
  // ======== attack-move keeps the shape
  {const {foot,arch}=setup();t.rtsOrder(MX,UP,{amove:true});
   ok(foot.amove&&arch.amove&&near(foot.face,N)&&near(arch.face,N)&&Math.abs(behind(foot,arch,N)-GAP)<1&&aside(foot,arch,N)<1,'attack-move: the block turned north, the shape kept, both on an attack-move')}
  // ======== an attack on an enemy: unchanged, each group at him
  {const {B,foot,arch}=setup(),e=Object.values(B.groups).find(q=>q.team===1),u=e&&e.units[0];if(u){t.rtsOrder(u.x,u.y-6);
    ok(foot.targetGroupId===e.id&&arch.targetGroupId===e.id,'a right-click on an enemy sets each group on him, as before')}}
  // ======== the hero keeps his place in the block
  {const {B,foot,arch}=setup(),h=B.groups.hero;if(h){place(h,MX,MY+30);B.sel=[foot.id,arch.id,'hero'];const off=behind(foot,h,0),side=lat(foot,h,0);t.rtsOrder(MX,UP);const S=N;
    ok(near(h.face,S)&&Math.abs(behind(foot,h,S)-off)<1&&Math.abs(lat(foot,h,S)-side)<1,'the hero, selected, keeps his place in the block like any group ('+r(behind(foot,h,S))+' px behind the footmen, '+r(lat(foot,h,S))+' to their right)')}else info('no hero group in the lab')}
  // ======== deploying: the block fitted into your zone, its shape kept
  {const {B,foot,arch}=setup();B.deploy=true;const Z=t.deployZone(),cy=(Z.y0+Z.y1)/2,inZ=g=>g.ax>=Z.x0-.01&&g.ax<=Z.x1+.01&&g.ay>=Z.y0-.01&&g.ay<=Z.y1+.01;
   place(foot,Z.x0+80+GAP/2,cy);place(arch,Z.x0+80-GAP/2,cy);t.rtsOrder(Z.x0+2,cy);
   ok(inZ(foot)&&inZ(arch)&&near(foot.face,Math.PI)&&Math.abs(behind(foot,arch,Math.PI)-GAP)<1,'deploying: sent to the zone\'s back edge, the block faces west and is moved whole into the zone (foot x '+r(foot.ax)+', zone from '+r(Z.x0)+')');
   const f0=foot.files;place(foot,Z.x0+80+GAP/2,cy);place(arch,Z.x0+80-GAP/2,cy);t.formDragTo(Z.x0+1,cy-60,Z.x0+1,cy+60);const want=GAP+back(foot.files)-back(f0);
   ok(inZ(foot)&&inZ(arch)&&near(foot.face,0)&&Math.abs(behind(foot,arch,0)-want)<1&&Math.abs(arch.ax-Z.x0)<1,'a line drawn facing east on the zone\'s back edge: the archers behind it, the block moved into the zone (foot x '+r(foot.ax)+', archers '+r(arch.ax)+')');
   B.deploy=false}
  // ======== off: as before
  t.prefSet('keepform',false);
  {const {foot,arch}=setup();t.rtsOrder(MX,UP);
   ok(Math.abs(foot.ax-arch.ax-GAP)<1&&Math.abs(foot.ay-arch.ay)<1,'off: a right-click to the north keeps the offsets as they were, unturned (the archers west of the footmen)')}
  {const {foot,arch}=setup(),X=MX+150;t.formDragTo(X,MY-100,X,MY+100);
   ok(Math.abs(foot.ax-X)<1&&Math.abs(arch.ax-X)<1&&Math.abs(foot.ay-arch.ay)>50,'off: a drag lays both groups side by side along the line')}
  // ======== the toggle: Shift+K, the button, the setting kept
  {setup();const b=document.getElementById('bKeep'),sk=t.AUTOSK.on,key=shift=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK',key:shift?'K':'k',shiftKey:shift,bubbles:true}));
   key(true);const st=localStorage.getItem('ashmark.keepform');
   ok(t.prefGet('keepform')===true&&st==='1'&&t.AUTOSK.on===sk,'Shift+K turns it on, kept as a setting (ashmark.keepform '+st+'), auto skills untouched');
   ok(b&&b.classList.contains('on')&&b.getAttribute('aria-pressed')==='true'&&/Keep formation/.test(b.title)&&!!b.querySelector('svg')&&!!b.closest('.borders .ogrp.forms')&&b.querySelector('.mbh-label')?.textContent==='Keep form','the order bar\'s button after the formations, an icon with its tooltip (and its label on a phone), lit while on');
   b.click();ok(t.prefGet('keepform')===false&&localStorage.getItem('ashmark.keepform')==='0'&&!b.classList.contains('on')&&b.getAttribute('aria-pressed')==='false','the button turns it off');
   key(false);ok(t.AUTOSK.on!==sk&&t.prefGet('keepform')===false,'plain K is still auto skills');key(false);
   ok(t.PREFS.keepform.def===true&&t.PREFS.keepform.read(null)===true,'on by default (nothing stored)')}
 }catch(e){ok(false,'EXC '+e.message+' '+e.stack)}
 finally{t.prefSet('keepform',was);if(L.active)L.exit()}
});
