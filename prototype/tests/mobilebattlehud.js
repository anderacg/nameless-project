'use strict';
window.PHONE=true;// (run in a phone's window, 844 x 390 with touch: tests/run-tests.ps1)
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+160,home.y+120);P.troops={hum_foot:5,hum_bow:4};
 const enemy=t.asParty({kind:'bandits',troops:['militia','archer'],x:P.x+70,y:P.y,cool:0});G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});for(let i=0;i<1600&&t.B.muster?.active;i++)t.updateBattle(.1);t.battlePause(true);t.frame();
 if(!window.mobileWorldHud.media.matches)return ok(false,'the mobile layout is on: this suite needs a phone-sized window ('+innerWidth+' x '+innerHeight+')');
 const hud=window.mobileBattleHud,root=hud.root,click=id=>document.getElementById(id).click(),r=e=>e.getBoundingClientRect(),shown=e=>!!e.getClientRects().length&&getComputedStyle(e).display!=='none';
 ok(hud.enabled&&shown(root)&&!window.mobileWorldHud.enabled,'world battle uses the mobile battle dock');
 ok(!shown(document.querySelector('.btime'))&&!shown(document.querySelector('.bcmd')),'the old overlapping bars are hidden');
 const dock=root.querySelector('.mbh-dock'),buttons=[...dock.children].map(e=>e.tagName==='BUTTON'?e:e.firstElementChild),bounds=r(dock);
 ok(buttons.every((b,i)=>r(b).width>=44&&r(b).height>=44&&r(b).left>=bounds.left&&r(b).right<=bounds.right&&(!i||r(b).left>=r(buttons[i-1]).right)),'five accessible battle controls share a single row without overlap');
 ok(r(root).bottom<=innerHeight&&r(root).height<innerHeight*.46,'the collapsed battle HUD leaves most of the battlefield visible');
 const status=root.querySelector('.btop'),cards=root.querySelector('.bcards');ok(r(status).bottom<=r(cards).top&&r(cards).bottom<=r(dock).top,'status, unit cards and controls stack without overlap');
 const card=cards.querySelector('[data-grp]:not([data-grp="all"])');card.click();ok(t.B.sel===card.dataset.grp,'unit cards still select their real army groups');
 click('battleOrdersToggle');const orders=document.getElementById('battleOrderChoices');ok(!orders.hidden&&r(orders).bottom<=r(root).top&&root.contains(document.getElementById('bCmd')),'orders and commander powers open together above the dock');
 // (the order bar in the drawer, the unit kits' (doc/UNIT_KITS_DESIGN.md §10 step 1): its stance rows and the skill bar's three slots,
 // bowmen selected, every button a thumb's size, none over another, within the drawer, in a few rows)
 {const bw=Object.values(t.B.groups).find(g=>g.player&&g.units.some(u=>u.type==='hum_bow'));t.selectGroup(bw.id);t.setOrderUI();
  const bs=[...orders.querySelectorAll('.borders .obtn')].filter(shown),D=r(orders),over=bs.some((a,i)=>bs.some((b,j)=>j>i&&!(r(a).right<=r(b).left+.5||r(b).right<=r(a).left+.5||r(a).bottom<=r(b).top+.5||r(b).bottom<=r(a).top+.5))),rows=new Set(bs.map(b=>Math.round(r(b).top))).size;
  // (step 2, doc/UNIT_KITS_DESIGN.md §7b: Pace and Discipline rows, the stance slots (bowmen: Shooting on Q), five skill slots (Rapid shot their kind's))
  ok(['pace','discipline'].every(id=>orders.querySelector('.srow[data-stance="'+id+'"]'))&&orders.querySelector('.sslot[data-stance="shooting"]:not([hidden])')&&orders.querySelectorAll('.skills [data-slot]').length===5&&orders.querySelector('.skills [data-slot="0"]').dataset.abil==='rapid','the drawer has the stance rows and slots and the skill bar (bowmen: Shooting on Q, Rapid shot in slot 1)');
  ok(bs.length>=15&&bs.every(b=>r(b).width>=44&&r(b).height>=44&&r(b).left>=D.left&&r(b).right<=D.right)&&!over&&rows<=4,'on a phone the '+bs.length+' buttons fit: each at least 44 px, within the drawer, none over another, in '+rows+' rows');
  ok(bs.reduce((a,b)=>r(b).top>r(a).top+2||Math.abs(r(b).top-r(a).top)<=2&&r(b).left>r(a).left?b:a)===orders.querySelector('[data-order="withdraw"]'),'Withdraw last, the way out')}
 const hold=orders.querySelector('[data-order="hold"]');hold.click();ok(orders.hidden,'issuing an order closes the drawer so the field is usable');
 click('battleSpeedToggle');const speeds=document.getElementById('battleSpeedChoices');ok([...speeds.querySelectorAll('[data-bspeed]')].map(b=>b.textContent).join()==='1×,2×,4×,8×','world-battle speed choices retain their correct values');
 speeds.querySelector('[data-bspeed="2"]').click();ok(t.B.speed===2&&G.speed===2&&speeds.hidden&&document.getElementById('battleSpeedToggle').textContent.includes('2×'),'the real world-battle speed changes and the picker collapses');
 click('bPause');ok(!t.B.paused,'Play uses the existing battle pause control');click('bPause');
 click('battleMoreToggle');const more=document.getElementById('battleMoreChoices'),hp=t.HPBARS.on;click('hpBtn');ok(t.HPBARS.on!==hp&&!more.hidden,'display settings remain functional in More');
 ok(root.querySelector('[data-bview="in"]')&&more.contains(document.getElementById('bInfo')),'view controls and selected-unit details are available in More');
 document.getElementById('game').dispatchEvent(new PointerEvent('pointerdown',{pointerId:9,pointerType:'touch',bubbles:true,clientX:10,clientY:10}));ok(more.hidden,'touching the battlefield dismisses the drawer');
 click('battleOrdersToggle');window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));ok(orders.hidden&&G.mode==='battle','Escape closes battle panels before the game menu');
 click('bMenu');t.frame();ok(G.mode==='esc'&&!hud.enabled,'Menu opens the existing paused battle menu');t.act('esc-resume');t.frame();ok(hud.enabled&&t.B.paused,'Resume restores the battle HUD and tactical pause');
 t.WORLD_BATTLE.on=false;G.enc=null;t.BDEPLOY.on=true;t.startBattle({enemies:['militia'],deploy:true});t.frame();
 ok(t.B.deploy&&document.getElementById('bPause').textContent.includes('Start'),'deployment retains a visible Start button');click('bPause');ok(!t.B.deploy,'Begin starts the battle');
 click('battleSpeedToggle');ok([...speeds.querySelectorAll('[data-bspeed]')].map(b=>b.textContent).join()==='0.5×,1×,2×,5×','field battles retain their distinct speed settings');hud.close();t.battlePause(true);
 ok(!ERR.length,'mobile battle controls produce no runtime errors');
});
