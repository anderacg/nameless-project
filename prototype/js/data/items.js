'use strict';
/* ---------- data: what each item is to you (doc/ITEMS_DESIGN.md): its category and that category's rules, the bag's tabs and its
   burden, the valuables and the quest items ---------- */
/* ITEM_CATS: every item has exactly one category (its kind's catId, core/items.js; a data entry may name its own: cat). In the
   order a bag sorts and a trade window lists them. Each: n, its name; tab, the bag's tab it shows in (BAG_TABS) and the trade
   window's section; icon, col: its tab's look (an item icon, gfx/sprites.js itemIcon); bag: it takes a slot in the bag; route:
   where it goes when you get it (the bag; with logistics, doc/LOGISTICS_DESIGN.md, Food and Water the food and water pools, a
   Carrier the pack train); sell, drop: a market buys it, you can leave it behind (a Quest item neither: bound to its quest) */
const ITEM_CATS={
  weapon:{n:'Weapon',tab:'equip',icon:'blade',col:'#c9ced8',bag:true,route:'bag',sell:true,drop:true},
  armour:{n:'Armour',tab:'equip',icon:'plate',col:'#a7adba',bag:true,route:'bag',sell:true,drop:true},
  quiver:{n:'Quiver',tab:'equip',icon:'arrows',col:'#c8b48a',bag:true,route:'bag',sell:true,drop:true},
  mount:{n:'Mount',tab:'equip',icon:'mount',col:'#7a4a2a',bag:true,route:'bag',sell:true,drop:true},
  food:{n:'Food',tab:'supplies',icon:'meat',col:'#c0503a',bag:true,route:'bag',sell:true,drop:true},
  water:{n:'Water',tab:'supplies',icon:'jug',col:'#6aa8d8',bag:true,route:'bag',sell:true,drop:true},
  resource:{n:'Resource',tab:'goods',icon:'ingot',col:'#9aa3ad',bag:true,route:'bag',sell:true,drop:true},
  trade:{n:'Trade good',tab:'goods',icon:'bolt',col:'#b05a4a',bag:true,route:'bag',sell:true,drop:true},
  trophy:{n:'Trophy',tab:'trophies',icon:'pelt',col:'#8a6a4a',bag:true,route:'bag',sell:true,drop:true},
  valuable:{n:'Valuable',tab:'trophies',icon:'gem',col:'#d84a8a',bag:true,route:'bag',sell:true,drop:true},
  quest:{n:'Quest item',tab:'quest',icon:'letter',col:'#e8dcb8',bag:true,route:'bag',sell:false,drop:false}
};
// the bag's tabs (ui/inventory.js): All, then each category's tab; Supplies shows your food, drink and morale beside its items
const BAG_TABS=[['all','All'],['equip','Equipment'],['supplies','Supplies'],['goods','Goods'],['trophies','Trophies & valuables'],['quest','Quest']];
/* the bag's burden (§4a): what does not fit goes into overflow slots past the bag's size, and each one costs per of your pace, down
   to floor (×.4: −60%) at maxOver slots over; past that nothing more is carried (a quest item still is) */
const BAG={per:.04,floor:.4,maxOver:15};

/* valuables (§4b; core/items.js Valuable): n, v (worth, gold), r (rarity), icon, col, d. A slot holds stack of one kind; a market
   pays sell × its worth (+ trade a level of Trading), × its holding's kind (city: better) */
const VALUABLES={
  ring:{n:'Gold ring',v:60,r:'common',icon:'ring',col:'#e8c040',d:'A heavy band of gold.'},
  earrings:{n:'Silver earrings',v:45,r:'common',icon:'earring',col:'#dfe4ea',d:'A pair of them, set with river pearls.'},
  jewels:{n:'Loose jewels',v:110,r:'common',icon:'gem',col:'#7fd8e8',d:'A pouch of cut stones.'},
  plate:{n:'Gilded plate',v:150,r:'rare',icon:'plate',col:'#e8c040',d:'A lord’s dish, gold over silver.'},
  chalice:{n:'Gold chalice',v:190,r:'rare',icon:'jar',col:'#e8b94a',d:'A temple’s cup, heavy with gold.'},
  relic:{n:'Old relic',v:280,r:'epic',icon:'charm',col:'#c58af0',d:'A saint’s token in a silver case. Collectors pay a fortune.'}
};
const VALUE={stack:5,sell:.6,trade:.01,kind:{village:.85,town:1,city:1.25,castle:1}};
/* where they are found (world/sites.js valuablesFound, from the stream 'valuables'): p, the chance of any; n, how many [lo, hi];
   r, the rarities found there (each by its weight in VALUE_RARITY) */
const VALUE_FINDS={cave:{p:.5,n:[1,2],r:['common','rare']},ruin:{p:.8,n:[1,2],r:['common','rare','epic']},camp:{p:.6,n:[1,3],r:['common','rare']},
  chief:{p:.5,n:[1,2],r:['common','rare']},lord:{p:.9,n:[1,3],r:['common','rare','epic']}};
const VALUE_RARITY={common:6,rare:3,epic:1};

/* quest items (§4; core/items.js QuestItem): bound to the quest or thread that gave them, gone when it ends; given and taken by the
   story's outcomes (story/outcome.js item). n, icon, col, d */
const QUEST_ITEMS={
  heirloom:{n:'Family heirloom',icon:'ring',col:'#e8b94a',d:'A ring a traveller begged you to carry home for him.'},
  map:{n:'Old map',icon:'letter',col:'#d8c8a0',d:'A torn map that marks a place in the wilds.'}
};
