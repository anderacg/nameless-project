'use strict';
// Casual command (the owner, 2026-11-27: "auto battler but with formation management and ordering a bit (just casual style like
// attack hold etc.)"; battle/casual.js): your army laid out by its plan fights on its own, each group on its plan's opening order;
// in the fight a few orders for each group: Attack (the AI's), Hold (stands, fights who comes), Fall back; the detailed controls
// hidden, taps on the field only pick; the plan's opening orders set in the Army window's March formation; off, the battles as before.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);G.paused=false;G.speed=1;t.GUIDE.on=false;
 ok(t.PREFS.casual.def===true,'on by default in the game');
 const fight=(troops,foes,plan,dx=90)=>{G.mode='world';G.modal=false;P.troops=troops;P.army=P.army||{};P.army.march=null;if(plan){const M={};for(const r of t.marchRows(P))if(plan[r.type])M[r.id]=plan[r.type];P.army.march=M}
  const e=t.asParty({kind:'bandits',troops:foes,x:P.x+dx,y:P.y,cool:0});W.parties.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
  t.startBattle({enemies:G.enc.list,tournament:false,deploy:true});const B=t.B;if(B.muster)B.muster.active=false;B.ready=false;B.paused=false;return B};
 const run=(B,s)=>{for(let i=0;i<s*60&&t.B===B&&!B.over;i++)t.updateBattle(1/60)};
 const id=type=>t.playerGroups().find(g=>t.grpUnits(g).some(u=>u.type===type));
 const foeNear=(B,g)=>{const C=B.groups[g].centre();return Math.min(...B.units.filter(u=>u.team===1&&u.hp>0).map(u=>Math.hypot(u.x-C.x,u.y-C.y)))};
 const shown=sel=>{const el=document.querySelector(sel);return !!el&&getComputedStyle(el).display!=='none'};
 const end=()=>{t.BattleSetup.undo();G.mode='world'};
 t.CASUAL.on=true;
 try{
  // (the plan's opening orders: the levy hold, the spearmen and your hero attack; no deploying, no whole-army Auto)
  {const B=fight({hum_levy:10,hum_spear:10},Array(12).fill('militia'),{hum_levy:{order:'hold'}});const lev=id('hum_levy'),spr=id('hum_spear'),Gs=B.groups;
   ok(B.casual&&!B.deploy&&!B.auto,'a battle in casual command: no deploying, no whole-army Auto');
   ok(t.Casual.orderOf(Gs[lev])==='hold'&&t.Casual.orderOf(Gs[spr])==='attack'&&t.Casual.orderOf(Gs.hero)==='attack','each group on its plan\'s opening order (levy hold, spearmen and your hero attack)');
   const l0=Gs[lev].centre(),s0=foeNear(B,spr),h0={x:B.hero.x,y:B.hero.y};run(B,6);const l1=Gs[lev].centre(),s1=foeNear(B,spr);
   info('levy moved '+Math.hypot(l1.x-l0.x,l1.y-l0.y).toFixed(1)+'; spearmen to the nearest foe '+s0.toFixed(0)+' → '+s1.toFixed(0)+'; hero moved '+Math.hypot(B.hero.x-h0.x,B.hero.y-h0.y).toFixed(1)+' (field px)');
   ok(Math.hypot(l1.x-l0.x,l1.y-l0.y)<30*t.fightSpace(),'Hold: they stand where they were');
   ok(s1<s0*.6,'Attack: the AI leads them at the enemy');
   ok(Math.hypot(B.hero.x-h0.x,B.hero.y-h0.y)>20,'your hero fights on his own');
   // (the bar: its three orders, formations and Withdraw; the detailed orders, stances and AI hidden)
   B.sel=lev;t.setOrderUI();
   ok(shown('#bbar .ogrp.casual')&&!shown('#bbar .ogrp.orders')&&!shown('#bbar .ogrp.stances')&&shown('#bbar .ogrp.forms')&&shown('#bbar .ogrp.wd'),'the bar: Attack, Hold, Fall back, the formations and Withdraw; the detailed orders hidden');
   ok(document.querySelector('[data-casual="hold"]').classList.contains('on')&&!document.querySelector('[data-casual="attack"]').classList.contains('on'),'its button lit by the group\'s order (Hold)');
   // (taps on the field only pick: no move, no target)
   const ax=Gs[lev].ax,ay=Gs[lev].ay;t.rtsOrder(ax-60,ay+20);t.formDragTo(ax-60,ay,ax-60,ay+60);ok(Gs[lev].ax===ax&&Gs[lev].ay===ay,'a tap or a drag on the field sends no one');
   // (Attack given: the AI has it; Fall back: away from the foe, facing it; your hero takes them too)
   document.querySelector('[data-casual="attack"]').click();ok(t.aiHas(Gs[lev])&&t.Casual.orderOf(Gs[lev])==='attack','Attack (its button): the AI takes the group');
   run(B,2);const d0=foeNear(B,spr);B.sel=spr;t.Casual.give('back');run(B,3);const d1=foeNear(B,spr);info('Fall back: the spearmen to the nearest foe '+d0.toFixed(0)+' → '+d1.toFixed(0));
   ok(!t.aiHas(Gs[spr])&&t.Casual.orderOf(Gs[spr])==='back'&&d1>d0,'Fall back: they step back from the enemy and hold');
   t.Casual.give('hold',['hero']);ok(!t.aiHas(Gs.hero)&&t.Casual.orderOf(Gs.hero)==='hold','your hero takes the same orders');
   end()}
  // (the plan's opening order set in the Army window's March formation, saved with it; one saved before it had none: Attack)
  {P.troops={hum_levy:6,hum_bow:6};P.army.march=null;G.mode='world';G.modal=false;t.openChar();t.openMarch();const s=G.march;
   if(s){const bow=t.marchRows(P).find(r=>r.type==='hum_bow').id;t.act('march-select',bow);ok(/Opening order/.test(document.getElementById('panel').innerHTML),'the March formation tab: an opening order for the group picked');
    t.act('march-order','hold');t.act('march-apply');ok(P.army.march?.[bow]?.order==='hold','Hold set there and saved with the plan');
    delete P.army.march[bow].order;ok(t.marchOrderOf(bow)==='attack','a plan saved before (no order): Attack')}
   else ok(false,'the March formation tab opens');t.hidePanel();G.mode='world'}
 }finally{t.CASUAL.on=false}
 // (off: the battles as before: every order yours, the field's taps send them)
 {const B=fight({hum_levy:8},Array(6).fill('militia'));const lev=id('hum_levy'),g=B.groups[lev];
  ok(!B.casual&&!t.aiHas(g),'off: no casual command, every group yours');B.sel=lev;t.setOrderUI();
  ok(!shown('#bbar .ogrp.casual')&&shown('#bbar .ogrp.orders'),'off: the detailed bar as before');
  const ax=g.ax;t.rtsOrder(g.ax-60,g.ay);ok(g.ax!==ax,'off: a tap on the field sends them');end()}
 ok(!ERR.length,'no runtime errors '+ERR.slice(0,2).join(' | '))});
