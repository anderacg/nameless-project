'use strict';
// Portrait parts are wearable, lootable and repairable gear, not just customization presets.
Kit.suite(({ok})=>{
 const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();const ids=t.STYLE_GEAR,I=t.ITEMS,gear=t.P.gear;
 ok(ids.length===39&&new Set(ids).size===ids.length,'39 distinct wearable portrait equipment styles');
 ok(ids.every(k=>{const it=I[k],d=I[it.damagedForm];return it.slot&&it.tier>=0&&it.tier<=6&&it.v>0&&it.m.hp>0&&d?.whole===k&&d.damaged&&d.v<it.v&&d.m.hp<it.m.hp}),'every style has balanced tiered stats and a weaker repairable damaged counterpart');
 ok(ids.every(k=>t.UI_ILLUSTRATIONS[I[k].icon]),'every new equipment item has a bundled illustrated inventory icon');
 for(const race of ['human','dwarf','elf','orc']){
  const face=t.Faces.random(96,race,'m');ok(ids.every(k=>{const it=I[k],key=it.slot==='body'?'clothing':'headwear',part=it.portrait[key],q=t.Faces.dress(face,{[it.slot]:k},race,'soldier');return t.PortraitEngine.options[key].includes(part)&&q.config[key]===part}),race+': equipping each style preserves its exact portrait artwork');
 }
 const rec=t.Faces.random(17,'human','m'),dressed=t.Faces.dress(rec,{body:'a_dwarf-runic-plate',head:'a_dwarf-rune-helm'},'human','soldier'),off=t.Faces.dress(dressed,{},'human','soldier');ok(!off.config.equipment&&off.config.clothing!==dressed.config.clothing&&off.config.headwear==='none','unequipping cross-culture gear removes its portrait override');
 const invalid=t.PortraitEngine.normalize({race:'human',face:'dwarven',equipment:{face:'dwarven',clothing:'missing'},clothing:'missing'});ok(invalid.face!=='dwarven'&&!invalid.equipment,'equipment overrides never bypass facial race constraints or accept missing artwork');
 try{for(const k of ids){const it=I[k];t.P.gear={[it.slot]:k};const L=t.lookOf('hero',0,true,0);if(it.slot==='head'&&L.helm!==it.look.helm)throw Error(k+' wrong helmet');if(it.slot==='body'&&(L.armor!==it.look.armor||!!L.harness!==!!it.look.harness))throw Error(k+' wrong armor');const parts=t.dollParts(L);if(!parts.length)throw Error(k+' missing doll parts');const c=t.unitSprite('hero',0,true,0,0);if(!c.width||!c.height)throw Error(k+' missing sprite')}
  ok(true,'all new equipment produces its intended armor/helmet family and a renderable sprite');
  t.P.gear={body:'a_orc-cross-harness'};ok(t.dollParts(t.lookOf('hero',0,true,0)).some(p=>p[0]==='strap'),'harness armor includes an actual shoulder strap on the battlefield doll');
  t.P.gear={body:'a_fur',head:'a_closed-knight-helm'};const L=t.dressedIn('frost',()=>t.spriteLook('hero',0,true,0));ok(L.cape===I.a_fur.col&&L.helm==='great','equipped fur and closed helmet remain independent in snow');
 }finally{t.P.gear=gear}
 for(const slot of ['body','head'])for(let tier=0;tier<=6;tier++){const k=t.styleGear(slot,tier,'human',()=>.5);ok(k&&I[k].tier===tier&&I[k].slot===slot,'stock has '+slot+' styles at tier '+tier)}
 const home=t.TOWNS[0],shops=t.W.shops;t.W.shops={};t.ensureEcon(home);const resources={...home.stock};try{for(const k of ['timber','copper','tin','iron','silver','gold','mithril','adamant'])home.stock[k]=100;const stock=t.PLACES.smith.stock(home);ok(stock.length===6&&I[stock[0]].slot==='body'&&I[stock[1]].slot==='head'&&stock.slice(0,2).every(k=>ids.includes(k)),'weekly smith stock includes wearable armor and helmets without adding slots');ok(t.PLACES.smith.stock(home)===stock,'reopening the smith does not reroll weekly stock')}finally{home.stock=resources;t.W.shops=shops}
 const id='a_fluted-knight-helm',broken=I[id].damagedForm;const gold=t.P.gold,inv=t.P.inv;t.P.gold=10000;t.P.inv=Array(t.INV_SIZE).fill(null);try{t.invAdd('gear',broken,1);const price=t.PLACES.smith.mendPrice(broken);t.PLACES.smith.mendGear(broken,home);ok(t.P.gold===10000-price&&t.P.inv.some(s=>s?.id===id)&&!t.P.inv.some(s=>s?.id===broken),'repair preserves the exact helmet style rather than replacing it with generic gear')}finally{t.P.gold=gold;t.P.inv=inv}
 ok(!ERR.length,'portrait equipment produces no runtime errors');
});
