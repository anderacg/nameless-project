'use strict';
// The withdrawal's controls (orderpaths.js WithdrawView, battlehud.js bhudWithdraw): the Withdraw button previews each selected
// group's way off the field without ordering it; on a touch screen the first tap holds (Confirm) and the second withdraws; groups
// on their way out keep their paths on show and are listed (each a button to select it); in a battle of several armies the
// player is told the rest fight on.
Kit.suite(({ok,info})=>{
 const t=T,L=t.BattleLab,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.PHYSICS.on=true;t.TERRAIN.on=true;t.FOG.on=false;
 const btn=()=>[...document.querySelectorAll('.obtn[data-order="withdraw"]')].find(b=>b.offsetParent)||document.querySelector('.obtn[data-order="withdraw"]'),strip=()=>document.getElementById('bWithdraw');
 L.start({leftGroups:[{type:'hum_foot',count:12},{type:'hum_bow',count:8}],rightGroups:[{type:'hum_levy',count:16}],deploy:false,ai:false,paused:false,morale:false,ground:{recipe:'open',seed:7},seed:7});const b=t.B,[foot,bow]=t.playerGroups();
 for(let i=0;i<30;i++)t.updateBattle(1/30);t.selectGroup(foot);
 // (pointing at the button: the way shown, no order given)
 btn().dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));const path=t.orderPath(foot,true);t.bhudTop();
 ok(t.withdrawView.on&&path&&path.kind==='withdraw'&&b.groups[foot].order!=='withdraw','pointing at Withdraw previews the way off the field without withdrawing anyone');
 ok(path&&path.end[0]<t.BW*.25,'the preview ends at the group’s own edge of the field ('+(path&&Math.round(path.end[0]))+' px)');
 ok(!strip().hidden&&/Withdraw preview/.test(strip().textContent)&&strip().textContent.includes(t.groupName(foot))&&/by the|to the/.test(strip().textContent),'the HUD names the previewed groups and where each would leave');
 ok(t.orderPath(bow,true)&&!t.withdrawView.shows(bow),'only the selected groups are previewed');
 btn().dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));t.bhudTop();ok(!t.withdrawView.on&&strip().hidden,'moving off the button ends the preview');
 // (a touch screen: tap, confirm)
 btn().dispatchEvent(new PointerEvent('click',{pointerType:'touch',bubbles:true}));t.bhudTop();
 ok(t.withdrawView.armed()&&b.groups[foot].order!=='withdraw'&&btn().classList.contains('armed'),'a first tap on Withdraw only shows the way and arms the button');
 ok(strip().querySelector('[data-wgo]')&&strip().querySelector('[data-wno]'),'beside the preview: Retreat now and Cancel');
 strip().querySelector('[data-wno]').click();ok(!t.withdrawView.armed()&&b.groups[foot].order!=='withdraw'&&strip().hidden,'Cancel ends the preview, no one withdraws');
 btn().dispatchEvent(new PointerEvent('click',{pointerType:'touch',bubbles:true}));t.bhudTop();
 btn().dispatchEvent(new PointerEvent('click',{pointerType:'touch',bubbles:true}));t.bhudTop();
 ok(b.groups[foot].order==='withdraw'&&!t.withdrawView.armed()&&!btn().classList.contains('armed'),'the second tap withdraws the selection');
 t.selectGroup(bow);btn().dispatchEvent(new PointerEvent('click',{pointerType:'touch',bubbles:true}));t.bhudTop();strip().querySelector('[data-wgo]').click();ok(b.groups[bow].order==='withdraw'&&!t.withdrawView.armed(),'Retreat now beside the preview withdraws');b.groups[bow].hold();
 // (a phone: the tap from the orders drawer closes it, so the way can be seen)
 {const M=window.mobileBattleHud;M.sync();if(M.enabled){t.selectGroup(bow);document.getElementById('battleOrdersToggle').click();const d=document.getElementById('battleOrderChoices'),open=!d.hidden;btn().dispatchEvent(new PointerEvent('click',{pointerType:'touch',bubbles:true}));
  ok(open&&d.hidden&&t.withdrawView.armed()&&b.groups[bow].order!=='withdraw','on a phone the first tap closes the orders drawer and shows the way');t.withdrawView.disarm()}else info('(not a phone screen: the drawer check is for the phone run)')}
 // (under way: shown and listed, selected or not)
 t.selectGroup(bow);t.bhudTop();ok(t.orderPathAlpha(foot,[bow],performance.now())>=t.OPATH.goA,'a withdrawing group’s path stays on show when it is not selected');
 ok(/Withdrawing/.test(strip().textContent)&&strip().querySelector('[data-wgrp="'+foot+'"]'),'the HUD lists the groups on their way out');
 strip().querySelector('[data-wgrp="'+foot+'"]').click();ok(t.selGroups().length===1&&t.selGroups()[0]===foot,'a listed group is selected by its button');
 // (the keyboard: at once)
 t.selectGroup(bow);t.setOrder('withdraw');t.bhudTop();ok(b.groups[bow].order==='withdraw','the W order withdraws at once, no preview first');
 ok(/battle ends for you/.test(strip().textContent),'with everyone on the way out the HUD says the battle ends once they are off the field');
 L.exit();
 // a world battle of several armies: the circle's edge, and the rest fight on
 {t.WORLD_BATTLE.on=true;t.EXITS.on=true;G.paused=false;G.speed=1;P.fac='vale';P.hostile={};P.troops={hum_foot:8,hum_bow:6};const home=Kit.goHome('Ashford');Kit.goTo(home.x+400,home.y+350);const tx=Math.floor(P.x/t.TILE),ty=Math.floor(P.y/t.TILE);for(let y=ty-30;y<=ty+30;y++)for(let x=tx-30;x<=tx+30;x++){const i=y*t.MW+x;t.tiles[i]=t.T_OPEN;t.WM.edge[i]=0}
  const band=t.asParty({kind:'bandits',troops:Array(10).fill('militia'),x:P.x+25,y:P.y,cool:0});t.bandits.push(band);W.monsters=[t.asMonster({id:'wolf',n:4,lv:1,x:P.x+10,y:P.y+22,hx:P.x+10,hy:P.y+22,t:0,a:0,cool:0})];
  G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,surprise:true});const w=t.B,a=w.world;for(let i=0;i<30;i++)t.updateBattle(1/30);
  ok(!!w.sides?.active,'(a battle of several armies)');const id=t.playerGroups().find(g=>t.grpUnits(g).some(u=>u.hp>0&&!u.left));t.selectGroup(id);t.withdrawView.hover=true;t.bhudTop();
  const p=t.orderPath(id,true);ok(p&&Math.abs(a.distance({x:p.end[0],y:p.end[1]})-a.radius)<=24,'in a world battle the preview ends at the battle circle (its way laid on the field’s grid, a cell short)');
  ok(/other armies fight on after you leave/.test(strip().textContent),'the preview says the other armies fight on after you leave');
  t.withdrawView.hover=false;const log=document.getElementById('log'),before=log?log.textContent:'';t.setOrder('withdraw');t.bhudTop();
  ok(log&&log.textContent!==before&&/other armies fight on/.test(log.textContent),'withdrawing in a battle of several armies says the rest fight on');
  ok(/fight on without you/.test(strip().textContent),'the HUD keeps saying so while your groups leave');t.finishBattle()}
 ok(!ERR.length,'the withdrawal’s controls have no runtime errors');
});
