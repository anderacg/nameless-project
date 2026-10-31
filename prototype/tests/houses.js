'use strict';
// Houses on the map (world/houses.js House, ui/house.js; the owner, 2026-10-31: "make buildings like houses actually clickable and
// inspectable like estate buildings, instead of pointing to the holding building"): a click on a house picks the house, its tip
// its own; its page: its kind, its households and people, its holding's homes, your quests that lead to it; Visit, Back to map.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,ash=t.townBy('Ashford');Kit.begin('soldier',1);Kit.clear();Kit.world();
 const l=(ash.lots||[]).find(x=>x.k==='house'&&x.st==='built'),mid=t.lotMid(l);Kit.goTo(mid.x+30,mid.y+20);
 const o=t.pickAt((l.x+l.n/2)*t.TILE,(l.y+l.n/2)*t.TILE);
 ok(o instanceof t.House&&o.holding===ash&&o.lot===l,'a click on a house of Ashford: the house, not the holding ('+(o?.mapKind||o?.name)+')');
 ok(t.objKind(o)==='house'&&/A house of Ashford/.test(t.tipFor(o))&&/household/.test(t.tipFor(o)),'its tip its own ('+t.tipFor(o).replace(/<[^>]+>/g,' ').trim()+')');
 ok(t.pickAt(ash.x,ash.y+2)===ash,'its gate still the holding');
 // ======== its page
 t.interact(o);const pn=()=>document.getElementById('panel'),txt=()=>pn().textContent;
 ok(G.house===o&&/A house of Ashford/.test(txt())&&new RegExp(o.households()+' household').test(txt())&&/homes for \d+/.test(txt())&&pn().querySelector('.pg-banner'),'its page: '+o.kindN()+', '+o.households()+' households, about '+o.people()+' people, Ashford\'s homes, its picture');
 ok(pn().querySelector('[data-act="house-town"]')&&pn().querySelector('[data-act="house-close"]'),'Visit Ashford, and Back to map');
 t.act('house-close');ok(G.mode==='world'&&!G.house,'Back to map: closed');
 // ======== a quest that leads to it
 {const q=t.Quest.make('visit',ash,null,{to:{town:ash.name,lot:'house',i:0},title:'See the widow',text:'Call on her.'});q.accept();const h=t.pickAt(q.to.x,q.to.y-4);
  ok(h instanceof t.House&&h.quests().includes(q)&&/See the widow/.test(t.tipFor(h)),'a quest to a house: on its tip ('+h.kindN()+')');
  t.interact(h);ok(/Your quests here/.test(txt())&&/See the widow/.test(txt()),'and on its page');t.act('house-close')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
