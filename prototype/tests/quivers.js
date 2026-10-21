'use strict';
// Quivers, not arrows (doc/ITEMS_DESIGN.md §2b; data/gear.js QUIVERS and ARROWS, core/items.js Quiver, battle/combat.js): arrows and
// bolts are no item now (no market, no smithy, no start, no loot, no gathering after a battle). A quiver is equipment in its own
// slot (unworn, a bag slot), named with its arrows; your hero and the characters shoot as many shots as it holds, full at every
// battle's start (a bow with none, or one that does not fit it: QUIVER.none); troops keep their kinds' quivers (attacks.js AMMO).
// Sold at markets (worn, hunter's), smiths (soldier's), a city's smith (master's) and their people's holdings (elven, dwarven).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,Q=t.QUIVERS,A=t.ARROWS,QK=t.ITEM_KINDS.quiver;
 Kit.begin('soldier',4242);Kit.clear();Kit.world();
 const empty=()=>{P.inv=Array(t.INV_SIZE).fill(null);t.fitInv()};
 // ---- the tables
 ok(Object.keys(Q).every(k=>{const q=Q[k],I=t.ITEMS['q_'+k];return A[q.arrow]&&['bow','crossbow'].includes(q.fits)&&q.shots>0&&I&&I.slot==='quiver'&&I.quiver===k&&!!A[q.arrow].bolt===(q.fits==='crossbow')})&&Object.values(A).every(a=>a.f===1),
   Object.keys(Q).length+' quivers, each a piece of gear (q_*) for the quiver slot, its arrows of a type in ARROWS (every damage factor 1 for now), bolts for a crossbow');
 ok(Q.worn.shots===20&&Q.hunter.shots===30&&Q.soldier.shots===40&&Q.elven.shots===50&&Q.master.shots===60&&t.QUIVER.none===5,'the sizes: worn 20, hunter\'s 30, soldier\'s 40, elven 50, master\'s 60; a bow with none, 5');
 ok(QK.title({id:'q_hunter'})==='Hunter’s quiver · 30 bronze arrows'&&QK.title({id:'q_boltCase'})==='Soldier’s bolt case · 40 iron bolts'&&/30 bronze arrows/.test(t.ITEMS.q_hunter.d),'each shows its arrow type: '+QK.title({id:'q_hunter'})+'; '+QK.title({id:'q_boltCase'}));
 ok(t.EQUIP.includes('quiver')&&t.SLOTS.quiver==='Quiver'&&t.targetKey('q_worn')==='quiver','a slot of its own');
 // ---- shots by quiver and weapon
 const bow=t.gearId('bow',1),xbow=t.gearId('crossbow',1),sh=(w,q)=>t.quiverShots({weapon:w,quiver:q},w,null);
 ok(sh(bow,'q_hunter')===30&&sh(bow,null)===5&&sh(bow,'q_boltCase')===5&&sh(xbow,'q_boltCase')===40&&sh(xbow,'q_worn')===5&&sh(t.gearId('sword',1),'q_hunter')===null&&sh(t.gearId('staff',1),'q_hunter')===null,
   'a bow shoots its quiver\'s arrows (30), a handful with none or with a bolt case (5); a crossbow its bolt case\'s; a sword or a staff needs none');
 ok(t.quiverShots({},null,t.ST.tavi)===5&&t.quiverShots({quiver:'q_soldier'},null,t.ST.tavi)===40&&t.quiverShots({},null,t.ST.hum_mage)===null,'a character of an archer\'s kind with no bow of its own shoots as a bow does');
 // ---- not items: nowhere to be had
 ok(!t.MAKE.smithy.out.arrows&&!t.MAKE.smithy.out.bolts&&!t.ESTATES.smithy.goods.includes('arrows')&&!t.BGS.exile.ammo&&!t.BGS.merchant.ammo&&t.BGS.exile.gear.quiver==='q_worn'&&t.BGS.merchant.gear.quiver==='q_wornCase','no smithy makes arrows or bolts; the exiled archer starts with a worn quiver, the merchant\'s child a worn bolt case');
 // ---- the hero: her quiver's shots, full at every battle's start
 const fight=()=>{Kit.world();G.enc={kind:'party',ref:{cool:0,x:P.x+8,y:P.y},list:['militia'],allies:[],foes:[]};t.startBattle({enemies:G.enc.list,tournament:false});const B=t.B;B.noMorale=true;
   B.units.forEach(u=>{if(!u.hero){u.x=560;u.cd=99;u.s={...u.s,spd:0}}});return B};
 const loose=n=>{let k=0;for(let i=0;i<n;i++){t.B.hero.cd=0;t.B.hx.sp=999;const a=t.B.arrows.length;t.shoot('ranged',1);if(t.B.arrows.length>a)k++}return k};
 const end=()=>{t.B.win=true;t.B.over=true;t.B.endT=0;t.updateBattle(.01);if(G.loot){t.act('lt-all');t.act(G.lootView.next)}Kit.done({world:true})};
 P.troops={hum_levy:2};P.slots=Array(10).fill(null);P.gear.weapon=bow;P.gear.quiver='q_hunter';G.bowRange=180;
 {const B=fight();ok(t.heroShots()===30&&t.heroShotsLeft()===30,'a bow and a hunter\'s quiver: 30 shots into the battle');
  const k=loose(32);ok(k===30&&B.hero.ammo===0&&!t.haveShots()&&B.floats.some(f=>/Out of arrows/.test(f.t)),'30 shots, then "Out of arrows" ('+k+' loosed)');
  ok(!t.P.inv.some(s=>s&&s.k==='good'&&/arrows|bolts/.test(s.id)),'no arrows in the bag to spend');
  const n0=G.msgs.length;end();ok(!G.msgs.slice(n0).some(m=>/gather/.test(m.m))&&!P.inv.some(s=>s&&/arrows/.test(s.id)),'after a won battle nothing is gathered from the field')}
 {const B=fight();ok(t.heroShotsLeft()===30&&loose(3)===3&&B.hero.ammo===27,'the next battle: full again');end()}
 P.gear.quiver=null;{fight();ok(t.heroShotsLeft()===5&&loose(8)===5,'a bow and no quiver: 5 shots');end()}
 P.gear.weapon=xbow;P.gear.quiver='q_wornCase';{fight();ok(t.heroShotsLeft()===20&&loose(22)===20,'a crossbow and a worn bolt case: 20 bolts');end()}
 P.gear.weapon=t.gearId('staff',1);P.gear.quiver=null;{const B=fight();ok(t.heroShots()===null&&t.haveShots()&&B.hero.ammo==null,'a staff needs no quiver');end()}
 P.gear.weapon=bow;P.gear.quiver='q_soldier';ok(/Your soldier’s quiver: 40 iron arrows a battle/.test(t.heroQuiverText()),'its words (the Skills page): '+t.heroQuiverText());
 // ---- the characters: their quiver's shots (their stats' shots), troops as before
 {P.comps={tavi:{ap:0,role:''}};t.compInit('tavi');const c=P.comps.tavi;
  ok(c.gear.quiver==='q_worn','a bowman joins with his worn quiver');
  const B=fight(),u=B.units.find(x=>x.comp&&x.type==='tavi');ok(u&&u.s.shots===20&&t.quiverOf(u.s)===20,'Tavi carries her quiver\'s 20 shots into the battle');end();
  c.gear.quiver='q_master';const B2=fight(),u2=B2.units.find(x=>x.comp&&x.type==='tavi');ok(u2.s.shots===60&&t.quiverOf(u2.s)===60,'given a master\'s quiver, 60');end();
  c.gear.quiver=null;const B3=fight(),u3=B3.units.find(x=>x.comp&&x.type==='tavi');ok(u3.s.shots===5,'none: a handful, 5');end();P.comps={}}
 ok(t.quiverOf(t.ST.hum_bow)===40&&t.quiverOf(t.ST.hum_xbow)===32&&t.quiverOf(t.ST.orc_thrower)===32&&t.quiverOf(t.ST.hum_mage)===Infinity,'troops keep their kinds\' quivers (bows 40, crossbows 32, at least 32)');
 // ---- where they are sold
 const by=n=>t.townBy(n),stock=(n,p)=>QK.stockAt(by(n),p).join();
 ok(stock('Ashford','trade')==='q_worn,q_wornCase,q_hunter'&&stock('Ashford','smith')==='q_soldier,q_boltCase,q_master,q_masterCase'&&stock('Oakhurst','smith')==='q_soldier,q_boltCase',
   'markets sell the worn and hunter\'s, smiths the soldier\'s, a city\'s smith the master\'s too (Ashford: '+stock('Ashford','smith')+')');
 ok(/q_elven/.test(stock('Elderglen','smith'))&&/q_dwarven/.test(stock('Karn Hold','smith'))&&/q_elven/.test(stock('Mossdell','trade'))&&!/q_elven/.test(stock('Ashford','smith')),'elven quivers in elven holdings (a village\'s at its market), dwarven bolt cases in dwarven ones');
 // ---- buying one, wearing it
 empty();P.gold=5000;P.gear.quiver=null;const ash=by('Ashford');G.lastTown=null;Kit.world();t.enterTown(ash);t.act('tab','smith');
 ok(/Quivers/.test(Kit.panel())&&/Soldier’s quiver · 40 iron arrows/.test(Kit.panel())&&!/Ammunition/.test(Kit.panel())&&!/>Arrows</.test(Kit.panel()),'the smith: quivers, no ammunition');
 const g0=P.gold,p=t.gearPrice('q_soldier');t.act('buy-quiver','q_soldier');const i=P.inv.findIndex(s=>s&&s.id==='q_soldier');
 ok(i>=0&&P.gold===g0-p,'bought: into your bag ('+p+'g), a bag slot while unworn');t.act('leave');Kit.done({world:true});
 ok(t.invEquip(i)&&P.gear.quiver==='q_soldier'&&!P.inv.some(s=>s&&s.id==='q_soldier'),'worn in its slot');
 G.mode='world';G.modal=false;t.openInv();ok(Kit.q('.doll .slot[data-arg="eq:quiver"]')&&Kit.qa('.doll .slot').length===t.EQUIP.length,'on the body: its slot ('+t.EQUIP.length+' in all)');t.act('inv-close');
 {const B=fight();ok(t.heroShotsLeft()===40,'and its 40 shots in the next battle');end()}
 // ---- loot and the market: no arrows
 Kit.world();G.lastTown=null;t.enterTown(ash);t.act('tab','trade');ok(!/>Arrows</.test(Kit.panel())&&!/>Bolts</.test(Kit.panel())&&/Hunter’s quiver/.test(Kit.panel()),'the market: quivers, never arrows nor bolts');t.act('leave');Kit.done({world:true});
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
