'use strict';
// A beast's health (the owner, 2026-11-22: "For monster can you show an individual health bar instead of group health?";
// ui/battlehud.js ownHpBar, drawGroupHealth; gfx/render.js drawUnit): each beast its own bar over it, health bars on or off,
// and no bar by its pack's icon; people keep their group's bar by the icon, and no bar of their own unless health bars are on.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);
 G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_spear:6,hum_bow:3};t.startBattle({enemies:['wolf','wolf','wolf','bear'],tournament:false});const B=t.B;
 const w=B.units.find(u=>u.type==='wolf'&&u.hp>0),bear=B.units.find(u=>u.type==='bear'&&u.hp>0),man=B.units.find(u=>u.team===0&&!u.hero&&!u.comp&&!u.leader&&u.hp>0);
 ok(w&&bear&&man,'a battle with wolves, a bear and your men');
 ok(t.ownHpBar(w)&&t.ownHpBar(bear)&&!t.ownHpBar(man),'a beast has its own bar, a man not');
 // (drawn: the bar's dark edge, its width the bar's and 2 more, 4 high)
 const c=t.ctx,fr=c.fillRect,rects=[];c.fillRect=function(...a){rects.push(a);return fr.apply(c,a)};
 const bars=u=>{rects.length=0;t.drawUnit(u);return rects.filter(r=>r[3]===4&&r[2]===(u.s.big?30:14)).length};
 const was=t.HPBARS.on;
 try{t.HPBARS.on=false;w.hp=w.max*.5;const wb=bars(w),bb=bars(bear),mb=bars(man);t.HPBARS.on=true;const mOn=bars(man);
  ok(wb===1&&bb===1,'with health bars off, each beast still has its bar over it (a wolf '+wb+', the bear '+bb+')');
  ok(mb===0&&mOn===1,'a man has his only with health bars on ('+mb+' off, '+mOn+' on)');
  // (by the icons: one bar for each group of men, none for a pack)
  t.HPBARS.on=false;t.frame();const icons=B.icons||[],pack=g=>B.units.some(u=>u.grp===g&&u.s.beast);
  const H=t.FLAG.ch,gw=t.GROUP_HP.w;rects.length=0;t.drawGroupHealth();const by=rects.filter(r=>r[0]===0&&r[1]===0&&r[2]===gw&&r[3]===H).length;
  const men=icons.filter(r=>!pack(r.g)).length,packs=icons.filter(r=>pack(r.g)).length;
  info(icons.length+' icons: '+men+' of men, '+packs+' of beasts; '+by+' bars by them');
  ok(packs>0&&men>0&&by===men,'a bar by each group of men\'s icon, none by a pack\'s ('+by+' for '+men+' groups of men, '+packs+' packs)')}
 finally{c.fillRect=fr;t.HPBARS.on=was}
 ok(!ERR.length,'no runtime errors');
});
