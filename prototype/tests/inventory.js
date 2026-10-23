'use strict';
// Inventory and gear: stacking, a full bag, 26 equipment slots (two hands, a mount and its gear, 10 fingers), handedness, material tiers, packs and belts, drag and drop,
// sort, drop confirmation, comparisons, icons, the smith, enemy drops, keys and old-save migration.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,N=t.INV_SIZE,gid=t.gearId;try{localStorage.clear()}catch(e){}
 const empty=()=>{P.gear=t.emptyGear();P.inv=Array(N).fill(null)};
 const slotOf=(k,id)=>P.inv.findIndex(x=>x&&x.k===k&&x.id===id);
 t.act('begin','soldier');
 ok(P.inv.length===N&&P.inv.filter(Boolean).length===1&&P.inv[0].id==='grain'&&P.gear.weapon===gid('sword',0),'a new hero has '+N+' bag slots, one of them grain, and a Wooden Sword');
 ok(t.EQUIP.length===27&&['weapon','offhand','quiver','mount','mhead','marmor','macc'].every(k=>t.EQUIP.includes(k))&&t.EQUIP.filter(k=>k.startsWith('ring')).length===10,'27 equipment slots: two hands, a quiver, a mount with 3 gear slots, and 10 fingers');
 // tiers
 const names=t.MATERIALS.map((m,i)=>t.ITEMS[gid('sword',i)].n).join(', ');ok(names==='Wooden Sword, Bronze Sword, Iron Sword, Silver Sword, Golden Sword, Mithril Sword, Adamant Sword','seven material tiers: '+names);
 ok(t.ITEMS[gid('sword',6)].m.dmg>t.ITEMS[gid('sword',3)].m.dmg&&t.ITEMS[gid('sword',3)].m.dmg>t.ITEMS[gid('sword',0)].m.dmg&&t.ITEMS[gid('sword',6)].v===12*64,'higher tiers hit harder and cost more');
 ok(t.ITEMS[gid('mail',2)].tag==='heavy'&&!t.ITEMS[gid('mail',1)].tag,'iron armor and up counts as heavy');
 // stacking and a full bag
 empty();ok(t.invAdd('mat','pelt',25)===25&&P.inv[0].n===t.STACK&&P.inv[1].n===5,'trophies stack to '+t.STACK);
 empty();for(let i=0;i<N;i++)t.invAdd('gear',gid('ring',0),1);ok(t.invFree()===0&&t.invAdd('mat','silk',1)===1&&P.inv.length===N+1,'a full bag still takes more, into an overflow slot (tests/burden.js)');
 empty();for(let i=0;i<N+t.BAG.maxOver;i++)t.invAdd('gear',gid('ring',0),1);ok(t.invAdd('mat','silk',1)===0,'at its limit it takes nothing more');
 // every slot accepts its own kind
 empty();const seen=new Set(),kinds=Object.keys(t.BASES).filter(b=>{const sl=t.BASES[b].slot;if(seen.has(sl)||t.MOUNT_KEYS.includes(sl))return false;seen.add(sl);return true});kinds.forEach(b=>t.invAdd('gear',gid(b,1),1));for(let n=0;n<40&&P.inv.some(Boolean);n++)t.invEquip(P.inv.findIndex(Boolean));
 ok(['weapon','offhand','head','body','arms','legs','feet','face','ear','cape','bag','belt','ring0'].every(k=>P.gear[k])&&!P.inv.some(Boolean),'each piece equips into its own slot');
 // rings fill the fingers in order, then swap the first
 empty();for(let i=0;i<11;i++){t.invAdd('gear',gid('ring',i%7),1)}for(let i=0;i<10;i++)t.invEquip(P.inv.findIndex(Boolean));
 ok(t.EQUIP.filter(k=>k.startsWith('ring')).every(k=>P.gear[k]),'ten rings fill ten fingers');const r0=P.gear.ring0;t.invEquip(P.inv.findIndex(Boolean));ok(P.gear.ring0!==r0&&slotOf('gear',r0)>=0,'an 11th ring swaps the first finger');
 const hp10=t.gm('hp');ok(hp10>0,'rings add up (+'+hp10+' health)');
 // pack and belt
 empty();t.invAdd('gear',gid('pack',2),1);t.invEquip(0);ok(P.inv.length===N+4&&t.invCap()===N+4,'an iron pack adds 4 bag slots');
 for(let i=0;i<N+4+t.BAG.maxOver;i++)t.invAdd('mat','silk',t.STACK);ok(!t.invUnequip('bag')&&P.gear.bag,'you cannot take off a pack with the bag at its limit');P.inv=P.inv.map((x,i)=>i<5?x:null);
 ok(t.invUnequip('bag')&&P.inv.length===N,'an emptied pack comes off and the bag shrinks');
 empty();t.invAdd('gear',gid('belt',3),1);t.invEquip(0);ok(t.invCap()===N+2,'a silver belt adds 2 bag slots');
 // drag and drop
 empty();t.invAdd('gear',gid('helm',2),1);t.invMove(0,'eq:head');ok(P.gear.head===gid('helm',2)&&!P.inv[0],'dragging a helm onto Head equips it');
 t.invAdd('gear',gid('boots',0),1);t.invMove(0,'eq:head');ok(P.gear.head===gid('helm',2)&&P.inv[0],'boots will not go on your head');
 t.invMove('eq:head',5);ok(!P.gear.head&&P.inv[5].id===gid('helm',2),'dragging off a slot unequips into that bag slot');
 P.gear.ring3=gid('ring',4);t.invMove('eq:ring3','eq:ring7');ok(!P.gear.ring3&&P.gear.ring7===gid('ring',4),'rings move between fingers');
 // comparisons
 empty();P.gear.weapon=gid('sword',1);const diff=t.gearDiff(gid('sword',4)).join(' ');ok(/\+4\.5 damage/.test(diff),'comparison against the worn piece: '+diff.replace(/<[^>]+>/g,''));
 // sort
 empty();[gid('ring',2),gid('sword',1),'wyrmspear',gid('helm',5),'bearcoat'].forEach(id=>t.invAdd('gear',id,1));t.invAdd('mat','pelt',7);t.invAdd('mat','scale',2);
 t.invSort();const order=P.inv.filter(Boolean).map(x=>x.id+(x.k==='mat'?'×'+x.n:''));ok(order.join(',')==='wyrmspear,g_sword_1,g_helm_5,bearcoat,g_ring_2,scale×2,pelt×7','sort by slot, then best first, then trophies ('+order.join(', ')+')');
 // the screen
 G.mode='world';G.modal=false;t.hidePanel();window.dispatchEvent(new KeyboardEvent('keydown',{key:'i'}));ok(G.mode==='inv','I opens the inventory');
 ok(document.querySelectorAll('.fb-equipment .slot').length===27&&document.querySelectorAll('.fb-equipment .slot.ring').length===10&&document.querySelectorAll('.invgrid .slot').length===P.inv.length,'equipment with 17 slots, 10 separate rings, and the bag');
 ok(document.querySelector('.fb-equipment .slot[data-arg="eq:offhand"]')&&document.querySelector('.fb-equipment .slot[data-arg="eq:mhead"].off'),'off hand on the body; mount gear greyed with no mount');
 t.act('inv-sel','0');ok(/Wyrm Tooth Spear/.test(document.querySelector('.fb-item-detail').innerHTML)&&/Compared with/.test(document.querySelector('.fb-item-detail').innerHTML)&&/hybrid/.test(document.querySelector('.fb-item-detail').innerHTML),'details pane shows the item, its grip and a comparison');
 ok(document.querySelector('.fb-equipment .slot[data-arg="eq:weapon"].fit')&&!document.querySelector('.fb-equipment .slot[data-arg="eq:offhand"].fit'),'the main hand glows for a hybrid spear; the off hand does not');
 t.act('inv-tab','trophies');ok(document.querySelectorAll('.invgrid .slot').length===P.inv.filter(x=>x&&(t.itemCat(x)||{}).tab==='trophies').length,'the Trophies & valuables tab filters to matching items');t.act('inv-tab','all');
 t.act('inv-drop','0');ok(P.inv[0],'first drop click asks to confirm');t.act('inv-drop','0');ok(!P.inv[0],'second click drops it');
 window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));ok(G.mode==='world','Escape closes the inventory');
 const blank=[...Object.values(t.ITEMS),...Object.values(t.MATS),...Object.values(t.GOODS)].filter(d=>{const c=t.itemIcon(d),px=c.getContext('2d').getImageData(0,0,16,16).data;let n=0;for(let i=3;i<px.length;i+=4)if(px[i])n++;return n<20});
 ok(!blank.length,'every item ('+Object.keys(t.ITEMS).length+') has a drawn icon'+(blank.length?': blank '+[...new Set(blank.map(d=>d.icon))].join(', '):''));
 // smith and drops
 empty();P.gold=5000;G.day=31;G.lastTown=null;{const a=t.townBy('Ashford');t.ensureEcon(a);a.stock.iron=40;a.stock.copper=10;a.stock.tin=10;a.stock.timber=40;t.W.shops=t.W.shops||{};delete t.W.shops[a.name]}
 t.enterTown(t.townBy('Ashford'));t.act('tab','smith');const st=t.smithStock(t.townBy('Ashford'));
 ok(st.length===6&&/Smith/.test(document.getElementById('panel').innerHTML),'the Ashford smith stocks 6 pieces');
 const first=st[0];t.act('buy-gear','0');ok(slotOf('gear',first)>=0&&st.length===5,'buying puts the piece in your bag');t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 empty();P.troops={hum_knight:20};let got=0;for(let k=0;k<12;k++){G.mode='world';G.modal=false;t.startEncounter({kind:'camp',ref:{cleared:false,back:0,x:P.x,y:P.y,plunder:()=>''},n:3});t.autoResolve();t.act('lt-all');t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0])}
 got=P.inv.filter(x=>x&&x.k==='gear').length;ok(got>=6,'bandit camps drop gear ('+got+' pieces from 12 camps)');
 // hands: shields and one-handed weapons in the off hand; two-handed weapons push the off hand into the bag
 empty();P.gear.weapon=gid('sword',1);t.invAdd('gear',gid('shield',1),1);t.invEquip(0);ok(P.gear.offhand===gid('shield',1)&&t.grip()==='shield','a shield goes in the off hand');
 t.invAdd('gear',gid('greatsword',1),1);t.invEquip(0);ok(P.gear.weapon===gid('greatsword',1)&&!P.gear.offhand&&slotOf('gear',gid('shield',1))>=0&&slotOf('gear',gid('sword',1))>=0&&t.grip()==='two','a greatsword takes both hands: shield and sword go to the bag');
 ok(!t.equipInto(slotOf('gear',gid('shield',1)),'offhand')&&!P.gear.offhand,'no shield with a greatsword');
 ok(!t.accepts('offhand',gid('greatsword',1))&&!t.accepts('offhand',gid('spear',1))&&t.accepts('offhand',gid('dagger',1))&&t.accepts('offhand',gid('torch',1)),'the off hand takes one-handed weapons and off-hand pieces only');
 empty();P.gear.weapon=gid('sword',2);t.invAdd('gear',gid('sword',2),1);const d0=t.gm('dmg');t.equipInto(0,'offhand');ok(t.grip()==='dual'&&Math.abs(t.gm('dmg')-d0*1.5)<.01,'dual wield: the off-hand sword adds half its damage');
 ok(t.weaponCombo()===t.COMBOS.dual,'dual wield swaps the combo for quick twin strikes');
 empty();for(let i=0;i<N+t.BAG.maxOver;i++)t.invAdd('mat','silk',t.STACK);P.gear.weapon=gid('sword',1);P.gear.offhand=gid('shield',1);P.inv[0]={k:'gear',id:gid('warhammer',1),n:1};
 ok(!t.invEquip(0)&&P.gear.offhand===gid('shield',1)&&P.gear.weapon===gid('sword',1),'a bag at its limit refuses a two-handed swap that has nowhere to put the shield');
 // hybrid: a spear is two-handed with the off hand empty, one-handed with a shield
 empty();P.gear.weapon=gid('spear',2);const r2=t.heroStats().reach,m2=t.heroStats().dmg;ok(t.grip()==='two'&&t.weaponCombo()===t.COMBOS.thrust,'a lone spear is held in two hands and thrusts');
 P.gear.offhand=gid('shield',0);ok(t.grip()==='shield'&&t.heroStats().reach===r2-4&&t.heroStats().dmg<m2&&t.weaponCombo()===t.COMBOS.phalanx,'spear and shield: one-handed jabs, less reach and damage');
 // mount gear only goes on a mount, only counts while you ride, and comes off with it
 empty();t.invAdd('gear',gid('barding',1),1);ok(!t.invEquip(0)&&!P.gear.marmor,'no barding without a mount');
 P.gear.mount='m_horse';const h0=t.gm('hp');ok(t.invEquip(0)&&P.gear.marmor&&t.gm('hp')>h0,'barding on a horse adds health');
 const hb=t.gm('hp');P.gear.mount=null;ok(t.gm('hp')<hb,'mount gear does not count on foot');P.gear.mount='m_horse';
 ok(t.invUnequip('mount')&&!P.gear.marmor&&slotOf('gear',gid('barding',1))>=0&&slotOf('gear','m_horse')>=0,'taking off the mount puts its barding in the bag');
 // shield bash
 empty();P.gear.weapon=gid('sword',1);P.gear.offhand=gid('shield',1);ok(t.BASH.mult>t.SHOVE.mult&&t.BASH.stun>t.SHOVE.stun,'a shield turns the shove into a harder Shield Bash');
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
