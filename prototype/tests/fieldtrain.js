'use strict';
// Training anywhere (core/recruitment.js anywhere, trainPrice, TRAIN_PLACE; ui/partypage.js troopTrainRow; the owner, 2026-10-30:
// "training should be upgradeable anywhere, only certain classes or special upgrades require a holding"; which: casters and every
// tier 3; in the field: free): a footman ready trains into a swordsman out on the map, from the Army window, for nothing; a
// bowman into a battle mage, or a swordsman into a tier-3, only at a holding that trains, for its price.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();const ash=t.townBy('Ashford');
 ok(t.trainsAnywhere('hum_sword')&&t.trainPrice('hum_sword')===0,'Footman → Swordsman (tier 2): anywhere, free');
 ok(!t.trainsAnywhere('hum_mage')&&!t.trainsAnywhere('hum_sergeant')&&t.trainPrice('hum_mage')===t.trainCost('hum_mage'),'into a caster (Battle Mage) or a tier 3 (Sword Sergeant): at a holding, its price');
 // ======== on the map
 P.troops={hum_foot:4,hum_bow:2,hum_sword:2};P.gold=0;P.txp={hum_foot:t.txpNeed('hum_foot')*3,hum_bow:t.txpNeed('hum_bow')*2,hum_sword:t.txpNeed('hum_sword')*2};
 ok(t.recruitment.quoteTraining(null,'hum_foot','hum_sword').ok,'on the map, no gold: a footman ready may train');
 ok(t.recruitment.quoteTraining(null,'hum_bow','hum_mage').code==='training-unavailable'&&t.recruitment.quoteTraining(null,'hum_sword','hum_sergeant').code==='training-unavailable','a caster or a tier 3: not here');
 G.mode='world';t.openChar?.();if(G.mode!=='char'){G.mode='char';t.renderChar()}
 const foot=t.partyRoster(P).groups.find(g=>g.type==='hum_foot');t.act('party-select',foot.id);t.act('party-path');
 const pane=()=>document.getElementById('panel'),btn=a=>pane().querySelector('[data-act="party-train"][data-arg="'+a+'"]');
 ok(btn('hum_foot:hum_sword:1')&&btn('hum_foot:hum_sword:all')&&/Train all 3/.test(btn('hum_foot:hum_sword:all').textContent),'the Army window, its training path: Train 1 and Train all 3');
 btn('hum_foot:hum_sword:1').click();ok(P.troops.hum_foot===3&&P.troops.hum_sword===3&&P.gold===0,'Train 1: a swordsman more, a footman fewer, no gold spent');
 btn('hum_foot:hum_sword:all').click();ok(P.troops.hum_foot===1&&P.troops.hum_sword===5&&t.txpReady('hum_foot')===0,'Train all: the other two');
 {const b=pane().querySelector('[data-act="party-train"][data-arg^="hum_foot:"]');ok(!b||b.disabled,'none ready: no training ('+(b?'its button off':'no button')+')')}
 t.act('party-train','hum_bow:hum_mage:1');ok(P.troops.hum_bow===2&&!P.troops.hum_mage,'a caster asked for on the map: nothing happens');
 t.act('char-close');
 // ======== at a holding's barracks: the rest, for their price
 P.troops={hum_bow:2};P.txp={hum_bow:t.txpNeed('hum_bow')*2};// (a group's place free for the new kind)
 P.gold=500;P.rep[ash.name]=90;t.enterTown(ash);t.act('tab','recruit');t.act('rec-tab','train');
 const tb=to=>document.querySelector('[data-act="train"][data-arg^="hum_bow:'+to+':"]');
 ok(tb('hum_mage')&&!tb('hum_mage').disabled&&/\d+g$/.test(tb('hum_mage').textContent),'at Ashford\'s barracks a bowman trains into a battle mage, for gold ('+tb('hum_mage').textContent+')');
 ok(tb('hum_long')&&!/\dg/.test(tb('hum_long').textContent),'into a longbowman there too, free ('+tb('hum_long').textContent+')');
 const g0=P.gold;tb('hum_mage').click();ok(P.troops.hum_mage===2&&P.gold===g0-2*t.trainCost('hum_mage'),'trained, both: '+2*t.trainCost('hum_mage')+'g ('+(g0-P.gold)+'g spent)');
 t.act('leave');ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
