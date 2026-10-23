'use strict';
// Item categories (doc/ITEMS_DESIGN.md §2-§4, data/items.js ITEM_CATS, core/items.js): every item is of exactly one category, read
// from its data or its kind; the category's rules (bag room, route, sell, drop, tab) decide what the verbs offer; a holding's old
// arrows and bolts are no item; the bag's tabs, its sort, the market and the loot screen go by category; ale and liquor lift morale
// once, as they come into your stores (water none), and no longer slow the drain; quest items are bound (no Sell, no Drop), take a
// slot, come and go with the story's outcomes, and are gone when their quest or thread ends; the sealed letter is one.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,C=t.ITEM_CATS,cat=(k,id)=>t.itemKind({k,id}).catId({k,id});
 Kit.begin('soldier',4242);Kit.clear();Kit.world();
 const empty=()=>{P.inv=Array(t.INV_SIZE).fill(null);t.fitInv()};
 // ---- the table: one category an item, its rules
 const rules=['n','tab','icon','col','bag','route','sell','drop'],tabs=t.BAG_TABS.map(([k])=>k);
 ok(Object.values(C).every(c=>rules.every(r=>r in c)&&tabs.includes(c.tab)),'every category has its rules ('+rules.join(', ')+') and a bag tab: '+Object.values(C).map(c=>c.n).join(', '));
 const all=[...Object.keys(t.ITEMS).map(id=>['gear',id]),...Object.keys(t.GOODS).concat(['water','liquor']).map(id=>['good',id]),...Object.keys(t.MATS).map(id=>['mat',id]),
   ...Object.keys(t.VALUABLES).map(id=>['val',id]),...Object.keys(t.QUEST_ITEMS).map(id=>['quest',id])];
 const none=all.filter(([k,id])=>!C[cat(k,id)]).map(([k,id])=>id);
 ok(none.join()==='arrows,bolts','every item ('+all.length+') has a category; a holding\'s old arrows and bolts none (no item now)');
 const want={'gear:g_sword_1':'weapon','gear:g_bow_0':'weapon','gear:g_torch_2':'weapon','gear:g_shield_1':'armour','gear:g_helm_3':'armour','gear:g_ring_0':'armour','gear:bearcoat':'armour',
   'gear:m_horse':'mount','gear:g_barding_1':'mount','gear:q_hunter':'quiver','gear:q_boltCase':'quiver','good:grain':'food','good:salmon':'food','good:water':'water','good:ale':'water','good:liquor':'water',
   'good:iron':'resource','good:copper':'resource','good:timber':'resource','good:furs':'resource','good:cloth':'trade','good:tools':'trade','good:spice':'trade','good:gems':'valuable','good:pearls':'valuable',
   'mat:pelt':'trophy','val:ring':'valuable','val:relic':'valuable','quest:heirloom':'quest','letter:L1':'quest'};
 const bad=Object.entries(want).filter(([s,c])=>{const [k,id]=s.split(':');return cat(k,id)!==c});
 ok(!bad.length,'each in its own: weapons, armour (a shield, a ring), mounts and their gear, quivers, food, water (ale and liquor too), resources, trade goods, valuables (gems, pearls), trophies, quest items (the sealed letter)'+(bad.length?': not '+bad.map(([s])=>s+' '+cat(...s.split(':'))).join(', '):''));
 ok(C.quest.sell===false&&C.quest.drop===false&&Object.entries(C).every(([k,c])=>k==='quest'||c.sell&&c.drop)&&Object.values(C).every(c=>c.bag&&c.route==='bag'),'only a quest item is bound (neither sold nor dropped); for now everything goes to the bag (the pools and the pack train: logistics)');
 // ---- not an item: never carried
 empty();ok(t.invAdd('good','arrows',30)===0&&t.goodRoom('arrows')===0&&!P.inv.some(Boolean)&&t.playerInventory.add('good','bolts',10)===0,'arrows and bolts are no item: never carried');
 // ---- the verbs ask the category
 empty();t.invAdd('gear',t.gearId('sword',1),1);t.invAdd('mat','pelt',3);t.invAdd('val','ring',1);t.invAdd('good','grain',5);t.ITEM_KINDS.quest.give('heirloom',null);
 const at=(k,id)=>P.inv.findIndex(s=>s&&s.k===k&&s.id===id),verbs=i=>{const K=t.itemKind(P.inv[i]);return ['sell','drop'].filter(v=>K.verb(v)&&K.verb(v).shown(i)).join()};
 ok(verbs(at('gear',t.gearId('sword',1)))==='sell,drop'&&verbs(at('mat','pelt'))==='sell,drop'&&verbs(at('val','ring'))==='sell,drop'&&verbs(at('good','grain'))==='drop'&&verbs(at('quest','heirloom'))==='',
   'the verbs as the category allows: gear, trophies and valuables Sell and Drop; goods Drop (sold by the unit at the market); a quest item neither');
 {const i=at('quest','heirloom');t.DROP_VERB.run(i);t.SELL_VERB.run(i);ok(P.inv[i]&&P.inv[i].id==='heirloom','and asked anyway, a quest item stays')}
 // ---- the bag: its tabs, its sort
 G.mode='world';G.modal=false;t.openInv();
 {const tabs=Kit.qa('.fb-bag-categories [data-act="inv-tab"]');ok(tabs.map(b=>b.getAttribute('aria-label')).join('|')==='All|Equipment|Supplies|Goods|Trophies & valuables|Quest'&&tabs.every(b=>b.textContent.trim()),'the bag\'s tabs: All, Equipment, Supplies, Goods, Trophies & valuables, Quest ('+tabs.map(b=>b.textContent.trim()).join(', ')+')')}
 const shown=tab=>{t.act('inv-tab',tab);return P.inv.map((s,i)=>[s,i]).filter(([s,i])=>s&&Kit.q('.invgrid .slot[data-arg="'+i+'"]')).map(([s])=>s.id).sort().join()};
 ok(shown('equip')==='g_sword_1'&&shown('quest')==='heirloom'&&shown('trophies')===['pelt','ring'].sort().join(),'each tab shows only what is of its categories (Equipment, Quest, Trophies & valuables)');
 t.act('inv-tab','supplies');ok(/Food for about .* drink for about .* morale/.test(Kit.q('.invsup').textContent),'Supplies: your food, drink and morale, read only ('+Kit.q('.invsup').textContent+')');
 t.act('inv-tab','quest');t.act('inv-sel',String(at('quest','heirloom')));ok(/Quest item/.test(Kit.q('.fb-item-detail').textContent)&&!Kit.q('.fb-item-detail [data-act="inv-drop"]')&&Kit.q('.invgrid .slot.bound'),'a quest item: its category, marked on its slot, and no Drop');
 t.act('inv-tab','all');t.act('inv-close');
 empty();['val:relic','good:grain','quest:map','gear:'+t.gearId('helm',2),'mat:pelt','good:ale','gear:q_worn','gear:'+t.gearId('sword',0),'good:iron','gear:m_pony'].forEach(s=>{const [k,id]=s.split(':');if(k==='quest')t.ITEM_KINDS.quest.give(id,null);else t.invAdd(k,id,1)});
 t.invSort();const order=P.inv.filter(Boolean).map(s=>cat(s.k,s.id));
 ok(order.join()==='weapon,armour,quiver,mount,food,water,resource,trophy,valuable,quest','sorted by category, in the table\'s order: '+order.join(', '));
 // ---- the market: by category, no arrows, quivers, what you carry by category (no quest item)
 empty();P.gold=5000;t.invAdd('val','chalice',1);t.invAdd('mat','pelt',2);t.ITEM_KINDS.quest.give('heirloom',null);
 const ash=t.townBy('Ashford');Kit.world();G.lastTown=null;t.enterTown(ash);t.act('tab','trade');
 const heads=Kit.qa('.lab-cat').map(e=>e.textContent),w=['Food','Water','Resource','Trade good','Valuable'].map(n=>heads.indexOf(n));
 ok(w.every((v,i)=>v>=0&&(!i||v>w[i-1]))&&!/>Arrows</.test(Kit.panel())&&!/>Bolts</.test(Kit.panel()),'the market\'s goods under their categories ('+heads.join(', ')+'), no arrows nor bolts');
 ok(/Worn quiver/.test(Kit.panel())&&/Hunter’s quiver · 30 bronze arrows/.test(Kit.panel())&&!/Soldier’s quiver/.test(Kit.panel()),'its quivers: the worn ones and the hunter\'s (a soldier\'s at the smith)');
 const sellRow=n=>Kit.qa('[data-act="sell-own"]').find(b=>b.closest('.row').textContent.includes(n));
 ok(sellRow('Gold chalice')&&sellRow('Wolf Pelt')&&!/Family heirloom/.test(Kit.panel()),'your things to sell, by category: the chalice, the pelts; never the heirloom');
 {const g0=P.gold,i=at('val','chalice'),p=t.ITEM_KINDS.val.fetches(P.inv[i],ash);t.act('sell-own',String(i));ok(P.gold===g0+p&&at('val','chalice')<0,'Sell: a valuable sold for its price there (+'+p+')')}
 t.act('leave');Kit.done({world:true});
 // ---- ale and liquor: their morale once, into your stores; water none; no slower drain
 empty();P.morale=50;t.invAdd('good','water',20);const m1=P.morale;t.invAdd('good','ale',10);const m2=P.morale;t.invAdd('good','liquor',4);const m3=P.morale;
 ok(m1===50&&Math.abs(m2-(50+10*t.SUPPLY.drink.ale.morale))<1e-9&&Math.abs(m3-(m2+4*t.SUPPLY.drink.liquor.morale))<1e-9,'water lifts nothing; 10 ale +'+(m2-m1)+' morale, 4 liquor +'+(m3-m2)+', once, as they come in');
 P.morale=99.5;t.invAdd('good','liquor',5);ok(P.morale===100,'never over 100');
 {const L=t.supplyLand(),r=d=>t.staminaRate(true,d,L).n;ok(r('water')===r('ale')&&r('ale')===r('liquor'),'on the march every drink keeps the drain at its rate ('+r('water')+')')}
 {const hour=g=>{empty();t.invAdd('good',g,10);(0,eval)('BAND=freshBand()');P.morale=50;P.bsta=100;t.supplyHour();return P.morale};const a=hour('ale'),w=hour('water');ok(a===w,'drinking ale by the hour lifts no morale now (ale '+a+', water '+w+')')}
 // ---- quest items: the story's outcomes give and take them; bound to their quest or thread, gone when it ends
 empty();Kit.storyKinds();
 {const r=t.applyOutcome({item:{give:'map'},say:'You take the map.'},{e:null});ok(r.item==='map'&&t.invCount('quest','map')===1&&t.describeOutcome({item:{give:'map'}})==='the old map'&&t.describeOutcome({item:{take:'map'}})==='you hand over the old map','the outcome item {give}: into your bag ('+t.describeOutcome({item:{give:'map'}})+')');
  t.applyOutcome({item:{take:'map'}},{});ok(t.invCount('quest','map')===0,'and {take}: handed over')}
 {const q={shape:'quest',id:901},th={shape:'thread',id:902,i:902};
  t.applyOutcome({item:{give:'heirloom'}},{e:th});t.applyOutcome({item:{give:'map'}},{e:q});
  const s1=P.inv.find(s=>s&&s.id==='heirloom'),s2=P.inv.find(s=>s&&s.id==='map');
  ok(s1&&s1.by==='thread:'+th.i&&s2&&s2.by==='quest:'+q.id,'bound to what gave it: a thread ('+s1.by+'), a quest ('+s2.by+')');
  t.worldEmit('quest:ended',{e:q,how:'failed'});ok(!P.inv.some(s=>s&&s.id==='map')&&P.inv.some(s=>s&&s.id==='heirloom'),'its quest over: the map is gone, the thread\'s heirloom kept');
  t.worldEmit('thread:ended',{e:th,how:'over'});ok(!P.inv.some(s=>s&&s.k==='quest'),'its thread over: the heirloom gone too');
  const enc=t.roadSpawn('merchant',P.x+40,P.y),live=t.Thread.as({k:'test_thread',i:903,day:G.day,at:'meet',wait:{shape:'encounter',id:enc.i},memory:{},past:[]});t.Thread.store().on.push(live);
  t.applyOutcome({item:{give:'map'}},{e:enc});const s3=P.inv.find(s=>s&&s.id==='map');
  ok(s3&&s3.by==='thread:903','given by an encounter a thread began: bound to that thread');P.inv[P.inv.indexOf(s3)]=null;
  t.Thread.store().on=t.Thread.store().on.filter(x=>x!==live);enc.gone=1}
 // ---- a quest item takes a slot, and is never refused (past the bag's limit too)
 empty();for(let i=0;i<t.invCap()+t.BAG.maxOver;i++)t.invAdd('mat','pelt',t.STACK);
 ok(t.invAdd('mat','pelt',1)===0&&t.ITEM_KINDS.quest.give('heirloom',null)===1&&P.inv.filter(Boolean).length===t.invCap()+t.BAG.maxOver+1,'at the bag\'s limit nothing more goes in, but a quest item still does (a slot of its own)');
 // ---- the loot screen: by category; a quest item cannot be put back
 empty();t.ITEM_KINDS.quest.give('heirloom',null);t.lootStart();t.invAdd('gear',t.gearId('sword',2),1);t.invAdd('mat','pelt',3);t.invAdd('val','jewels',1);t.invAdd('good','grain',4);t.lootShow('<h2>Victory</h2>',null,0,'cont');
 ok(Kit.qa('.loot-cat').map(e=>e.textContent).join()==='Weapon,Food,Trophy,Valuable','the loot screen grouped by category: '+Kit.qa('.loot-cat').map(e=>e.textContent).join(', '));
 {const i=at('quest','heirloom');t.act('lt-drop',String(i));ok(P.inv[i]&&P.inv[i].id==='heirloom'&&!G.loot.pile.some(s=>s.k==='quest'),'a quest item stays in the bag: it cannot be put back on the pile')}
 t.act('lt-all');ok(!G.loot.pile.length,'and the rest taken');t.lootEnd();Kit.world();
 // ---- the sealed letter is a quest item
 {empty();const L={id:'L77',kind:'news',fac:'vale',from:'Ashford',to:'Ashford',toFac:'vale',day:G.day,stale:G.day+9,worth:40,seal:1,seen:0,site:null};P.inv[2]={k:'letter',id:L.id,n:1,L};
  const K=t.itemKind(P.inv[2]);ok(K===t.ITEM_KINDS.letter&&K instanceof t.ItemKind&&K.catId(P.inv[2])==='quest'&&!K.verb('drop')&&!K.verb('sell')&&K.pageVerbs===t.LETTER_VERBS&&K.def(P.inv[2]).n==='Sealed letter','the sealed letter: an item kind (Letter), a quest item, no Drop nor Sell (its own page: sell, deliver, burn)');
  G.mode='world';G.modal=false;t.openInv();t.act('inv-sel','2');ok(/Quest item/.test(Kit.q('.fb-item-detail').textContent)&&!Kit.q('.fb-item-detail [data-act="inv-drop"]')&&Kit.q('.fb-item-detail [data-act="ltr-open"]'),'its detail in the bag: Look it over, no Drop');t.act('inv-close');
  P.inv[2]=null;for(let i=0;i<t.invCap()+t.BAG.maxOver;i++)t.invAdd('mat','pelt',t.STACK);const e={i:5,letter:L};t.letterTake(e);ok(P.inv.some(s=>s&&s.k==='letter'),'robbed with the bag past its limit, the letter still comes (never left in the mud)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
