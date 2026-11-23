'use strict';
window.ARENA=true;
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=false;t.GUIDE.on=false;P.troops={hum_foot:4,hum_bow:3};G.enc={kind:'party',ref:{x:P.x+30,y:P.y,cool:0},list:['militia','archer']};t.startBattle({enemies:G.enc.list,deploy:false});t.beginFight();t.battlePause(true);const b=t.B;t.frame();
 const ids=t.playerGroups().filter(g=>t.grpUnits(g).some(u=>!u.hero)),first=ids[0],gr=b.groups[first];t.selectGroup('all');
 const x=t.BW/2,y=t.fieldTop()+70;t.battleTap(x,y);ok(b.sel==='all'&&b.mark&&!b.mark.foe&&Math.abs(b.mark.x-x)<1,'a ground tap orders the All selection instead of clearing it');
 const foe=b.units.find(u=>u.team===1&&u.hp>0);foe.x=t.BW*.6;foe.y=t.BH/2;t.selectGroup(first);t.battleTap(foe.x,foe.y-6);ok(gr.tgt===foe&&b.mark.foe&&b.mark.target===foe,'one enemy tap attacks and links visual feedback to that individual');
 const own=t.grpUnits(ids[1])[0];t.battleTap(own.x,own.y-6);ok(b.sel===own.grp,'a friendly unit tap still selects its group');
 t.armAttackMove(true);t.battleTap(t.BW/2,t.fieldTop()+120);ok(!b.amArm&&b.mark.am,'armed attack-move consumes the same destination tap');
 t.setOrderUI();const summary=document.getElementById('bSelectionSummary');ok(summary?.textContent.includes('fighters')&&summary.querySelector('[role="meter"]')&&summary.textContent.includes('Manual'),'selection summary includes live health, count, order and command ownership');
 t.setGroupsAuto([b.sel],true,true);t.setOrderUI();ok(summary.textContent.includes('AI on'),'selection summary follows selected-group AI ownership');
 document.querySelector('[data-bquick="hold"]').click();ok(grpHold()&&!t.aiHas(b.groups[b.sel]),'quick Hold uses the real order and returns selected units to manual control');
 function grpHold(){return t.selGroups().every(g=>b.groups[g].order==='hold'&&!b.groups[g].tgt&&!b.groups[g].amove)}
 const selected=t.selGroups().map(g=>b.groups[g]);document.querySelector('[data-bquick="withdraw"]').click();ok(t.withdrawView.armed()&&selected.every(g=>g.order!=='withdraw'),'quick Retreat first previews without moving the selected units');document.querySelector('[data-bquick="withdraw"]').click();ok(!t.withdrawView.armed()&&selected.every(g=>g.order==='withdraw'),'a second quick Retreat confirms through the existing order path');
 b.over=true;const before=b.mark;t.battleTap(x+30,y+30);ok(b.mark===before,'a finished battle ignores casual orders');b.over=false;
 const canvas=document.getElementById('game'),q=t.fromField({x,y}),r=canvas.getBoundingClientRect(),c={clientX:r.left+q.x*r.width/canvas.width,clientY:r.top+q.y*r.height/canvas.height};t.selectGroup(first);
 for(const type of ['pointerdown','pointerup'])canvas.dispatchEvent(new PointerEvent(type,{...c,pointerType:'mouse',pointerId:41,button:0,bubbles:true}));ok(b.sel===first&&b.mark&&!b.mark.foe,'a real mouse click uses the same ground-command routing');
 ok(!ERR.length,'casual battle controls produce no runtime errors');
});
