'use strict';
// The overfilled bag (doc/ITEMS_DESIGN.md §4a, core/inventory.js, data/items.js BAG): nothing is refused up to the limit; what does
// not fit goes into overflow slots past the bag's size; each slot over costs BAG.per of your pace (world/world.js bandPace), down to
// BAG.floor at BAG.maxOver; past that nothing more is carried ("You cannot carry any more"), a quest item excepted. The card shows a
// Burdened tag; the bag window shows the overflow slots in red; freeing a slot gives the pace back; the loot screen leaves what you
// cannot carry; the market buys past the bag's size; a pack comes off into overflow.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,B=t.BAG,I=t.playerInventory,near=(a,b)=>Math.abs(a-b)<1e-9;
 Kit.begin('soldier',4242);Kit.clear();Kit.world();P.troops={hum_levy:5};P.wounded={};P.gear.mount=null;P.bsta=100;
 const empty=()=>{P.gear.bag=null;P.gear.belt=null;P.inv=Array(t.INV_SIZE).fill(null);t.fitInv()};
 const fill=n=>{for(let i=0;i<n;i++)t.invAdd('gear',t.gearId('ring',0),1)};
 ok(B.per===.04&&B.floor===.4&&B.maxOver===15,'the numbers: −4% a slot over, down to −60% (×.4) at 15 over');
 // up to the bag's size: no burden
 empty();const pace0=t.bandPace();fill(I.size);
 ok(I.over===0&&I.free===0&&t.bagPace()===1&&near(t.bandPace(),pace0)&&!t.burdenTag(),'a full bag ('+I.size+' slots): no burden, no tag');
 // past it: overflow slots, each a burden
 const got=t.invAdd('gear',t.gearId('ring',1),1)+t.invAdd('mat','pelt',t.STACK*4);
 ok(got===1+t.STACK*4&&I.over===5&&P.inv.length===I.size+5&&near(t.bagPace(),.8)&&near(t.bandPace(),pace0*.8),'nothing refused: 5 more slots past it, pace ×'+t.bagPace().toFixed(2)+' (bandPace '+pace0.toFixed(3)+' → '+t.bandPace().toFixed(3)+')');
 {const tag=t.burdenTag();ok(tag&&tag[0]==='Burdened'&&tag[1]==='warn'&&/5 slots past your bag/.test(tag[2])&&/20% slower/.test(tag[2])&&/gives back 4%/.test(tag[2]),'the Burdened tag: '+tag[2])}
 t.updateHUD(true);ok(Kit.qa('#stats .pc-tags .tag').some(e=>e.textContent==='Burdened'&&/slower/.test(e.title)),'on the card');
 // the bag window: the overflow slots in red
 G.mode='world';G.modal=false;t.openInv();
 ok(Kit.qa('.invgrid .slot.over').length===5&&Kit.qa('.invgrid .slot').length===I.size+5&&/Pace −20%/.test(Kit.q('.fb-head').textContent)&&/5 overflow · pace −20%/.test(Kit.q('.fb-bag-footer').textContent)&&Kit.q('.invcap.over')&&getComputedStyle(Kit.q('.invgrid .slot.over')).borderTopColor===getComputedStyle(Kit.q('.invcap.over i')).backgroundColor,'the bag window: the 5 overflow slots in red after the bag\'s own, and the cost');
 // freeing a slot: the pace back, the overflow settled into it
 t.act('inv-drop','0');t.act('inv-drop','0');ok(I.over===4&&near(t.bagPace(),.84)&&Kit.qa('.invgrid .slot.over').length===4&&P.inv[0]&&P.inv.length===I.size+4,'dropping one gives 4% back at once; what lay past the bag moves into the freed slot');
 t.act('inv-close');
 // the limit: 15 over, −60%; nothing more, a quest item excepted
 t.invAdd('mat','pelt',t.STACK*20);
 ok(I.over===B.maxOver&&near(t.bagPace(),B.floor)&&t.invAdd('mat','silk',1)===0&&t.goodRoom('grain')===0&&t.burdenTag()[1]==='bad'&&/You cannot carry any more/.test(t.burdenTag()[2]),'at '+B.maxOver+' over: pace ×'+B.floor+', nothing more goes in ("'+t.BAG_FULL+'")');
 ok(t.ITEM_KINDS.quest.give('heirloom',null)===1&&I.over===B.maxOver+1&&near(t.bagPace(),B.floor),'a quest item still goes in; the pace no lower than the floor');
 // the market: buying past the bag's size, refused at the limit with why
 empty();P.gold=9000;fill(I.size);const ash=t.townBy('Ashford');Kit.world();G.lastTown=null;t.enterTown(ash);t.act('tab','trade');t.ensureEcon(ash);ash.stock.cloth=200;
 const g0=t.goodN('cloth');t.act('buy','cloth:5');ok(t.goodN('cloth')===g0+5&&I.over===1,'the market sells you cloth past your bag\'s size (into an overflow slot)');
 t.invAdd('mat','pelt',t.STACK*14);t.act('tab','trade');const btn=Kit.qa('[data-act="buy"]').find(b=>/^cloth:/.test(b.dataset.arg));
 ok(I.over===B.maxOver&&t.goodRoom('iron')===0&&Kit.qa('[data-act="buy"]').some(b=>b.disabled&&b.title===t.BAG_FULL),'at the limit its Buy is greyed: "'+t.BAG_FULL+'"');
 t.act('leave');Kit.done({world:true});
 // the loot screen: what you cannot carry stays on the ground
 empty();fill(I.size+B.maxOver);t.lootStart();t.invAdd('gear',t.gearId('sword',2),1);t.invAdd('mat','pelt',3);t.lootShow('<h2>Victory</h2>',null,0,'cont');
 ok(Kit.qa('.loot-item').every(b=>b.disabled&&b.title===t.BAG_FULL)&&Kit.q('[data-act="lt-all"]').disabled,'at the limit the spoils wait on the ground ('+t.BAG_FULL+')');
 t.act('lt-drop','0');ok(!Kit.qa('.loot-item').every(b=>b.disabled),'put something back: room again');t.lootEnd();Kit.world();
 // a pack: taking it off pushes what does not fit into overflow slots (up to the limit)
 empty();t.invAdd('gear',t.gearId('pack',2),1);t.invEquip(0);const cap=I.size;fill(cap);
 ok(t.invUnequip('bag')&&!P.gear.bag&&I.size===t.INV_SIZE&&I.over===cap-t.INV_SIZE+1,'a full pack comes off: what does not fit lies in overflow slots ('+I.over+' over)');
 empty();P.gear.bag=t.gearId('pack',2);t.fitInv();fill(I.size+B.maxOver);ok(!t.invUnequip('bag')&&P.gear.bag,'past the limit it stays on');
 empty();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
