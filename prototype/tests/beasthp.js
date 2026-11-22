'use strict';
// A beast's health (the owner, 2026-11-22: "For monster can you show an individual health bar instead of group health?";
// ui/battlehud.js ownHpBar, drawGroupHealth; ui/individualhealth.js IndividualHealth): each beast its own bar over it, health bars on or off,
// and no bar by its pack's icon; people keep their group bar; automatic individual squares show wounds, selected units and combat.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);
 G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_spear:6,hum_bow:3};t.startBattle({enemies:['wolf','wolf','wolf','bear'],tournament:false});const B=t.B;
 const w=B.units.find(u=>u.type==='wolf'&&u.hp>0),bear=B.units.find(u=>u.type==='bear'&&u.hp>0),man=B.units.find(u=>u.team===0&&!u.hero&&!u.comp&&!u.leader&&u.hp>0);
 ok(w&&bear&&man,'a battle with wolves, a bear and your men');
 ok(t.ownHpBar(w)&&t.ownHpBar(bear)&&!t.ownHpBar(man),'a beast has its own bar, a man not');
 // Each visible beast gets its own segmented health, independent of the preference for healthy idle people.
 const c=t.ctx,fr=c.fillRect,rects=[];c.fillRect=function(...a){rects.push(a);return fr.apply(c,a)};
 const bars=u=>{rects.length=0;if(!t.IndividualHealth.wanted(u))return 0;t.IndividualHealth.paint(0,0,u.hp,u.max);const edge=t.UNIT_HEALTH.size+2;return rects.filter(r=>r[3]===edge&&r[2]===edge).length};
 const was=t.HPBARS.on;
 try{t.HPBARS.on=false;w.hp=w.max*.5;const wb=bars(w),bb=bars(bear),mb=bars(man);t.HPBARS.on=true;const mOn=bars(man);
  ok(wb===Math.ceil(w.max/t.UNIT_HEALTH.per)&&bb===Math.ceil(bear.max/t.UNIT_HEALTH.per),'automatic mode always shows each beast as its own health squares (wolf '+wb+', bear '+bb+')');
  ok(mb===0&&mOn===Math.ceil(man.max/t.UNIT_HEALTH.per),'healthy idle people hide squares in automatic mode and show them in always mode ('+mb+' automatic, '+mOn+' always)');
  // (by the icons: one bar for each group of men, none for a pack)
  t.HPBARS.on=false;t.frame();const icons=B.icons||[],pack=g=>B.units.some(u=>u.grp===g&&u.s.beast);
  const H=t.FLAG.ch,gw=t.GROUP_HP.w;rects.length=0;t.drawGroupHealth();const by=rects.filter(r=>r[0]===0&&r[1]===0&&r[2]===gw&&r[3]===H).length;
  const men=icons.filter(r=>!pack(r.g)).length,packs=icons.filter(r=>pack(r.g)).length;
  info(icons.length+' icons: '+men+' of men, '+packs+' of beasts; '+by+' bars by them');
  ok(packs>0&&men>0&&by===men,'a bar by each group of men\'s icon, none by a pack\'s ('+by+' for '+men+' groups of men, '+packs+' packs)')}
 finally{c.fillRect=fr;t.HPBARS.on=was}
 ok(!ERR.length,'no runtime errors');
});
