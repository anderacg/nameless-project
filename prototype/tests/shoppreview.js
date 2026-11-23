'use strict';
Kit.suite(({ok})=>{
 const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();const S=t.PLACES.smith,home=t.TOWNS[0],id='a_steel-cuirass',I=t.ITEMS,gear=t.P.gear,inv=t.P.inv,gold=t.P.gold,shops=t.W.shops;
 try{t.W.shops={[home.name]:{day:t.G.day,items:[id,id,'g_barding_2']}};t.P.gear={...t.emptyGear(),body:'g_mail_2'};t.P.inv=Array(t.INV_SIZE).fill(null);t.P.gold=10000;
  const snap=JSON.stringify(t.P.gear),price=t.gearPrice(id);S.previewGear('0',home);const html=S.previewPane(home);
  ok(JSON.stringify(t.P.gear)===snap&&t.P.gold===10000&&S.stock(home).length===3,'previewing changes neither equipment, gold nor shop stock');
  ok(html.includes('Current equipment')&&html.includes('Preview with')&&html.includes('Buy & equip')&&html.includes('Compared with'),'preview shows current and proposed portraits, comparison and explicit purchase choices');
  S.closePreview();ok(!S.previewPane(home)&&t.P.gold===10000,'closing a preview is free');
  S.previewGear('0',home);ok(S.buyEquip(id,home)&&t.P.gear.body===id&&t.P.gold===10000-price&&t.P.inv.some(s=>s?.id==='g_mail_2'),'Buy and equip charges once, equips the purchase and keeps the previous armor');
  const paid=t.P.gold;ok(!S.buyEquip(id,home)&&t.P.gold===paid&&S.stock(home).filter(k=>k===id).length===1,'a repeated stale purchase cannot buy the next duplicate item');
  S.previewGear('0',home);t.P.gold=0;const stock=S.stock(home).slice();ok(!S.buyEquip(id,home)&&S.stock(home).join()===stock.join(),'insufficient gold leaves stock unchanged');
  t.P.gold=10000;t.P.gear.body='g_mail_2';t.P.inv=Array(t.playerInventory.size+t.BAG.maxOver).fill(null).map(()=>({k:'gear',id:'g_sword_0',n:1}));S.previewGear('0',home);const packed=JSON.stringify(t.P.inv);
  ok(!S.buyEquip(id,home)&&t.P.gold===10000&&t.P.gear.body==='g_mail_2'&&JSON.stringify(t.P.inv)===packed&&S.stock(home).join()===stock.join(),'failed equipment transfer rolls back gear, inventory, payment and stock');
  S.previewGear('1',home);ok(!S.buyEquip('g_barding_2',home)&&t.P.gold===10000&&!t.P.gear.mount,'mount equipment cannot be bought-and-equipped without a mount');
 }finally{t.P.gear=gear;t.P.inv=inv;t.P.gold=gold;t.W.shops=shops;S.closePreview()}
 ok(!ERR.length,'equipment preview and purchase produce no runtime errors');
});
