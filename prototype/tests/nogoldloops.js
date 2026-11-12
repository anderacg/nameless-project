'use strict';
// No gold, renown or cheer from nothing (a review of the rules, 2026-11-11). A unit sold to a market and bought back never gains
// (economy.js TRADE_FAIR: priced with it in the stock, under its price back), nor one bought of a caravan and sold to it (caravans.js
// pays); the market of a fief of yours buys no goods of you (its stores are yours at the steward's); a holding lying sacked or raided
// gives no sack gold, no raid and no renown again (siege.js PLUNDER); remains keep only what your bag did not take (death.js Remains
// take); a drink lifts your band once, not again when set down in your stores or on a pile and taken up (supply.js drinkIn, keptIn).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,F=t.TRADE_FAIR,X=t.PLUNDER,keep={...F},once=X.once;Kit.begin('soldier',23);Kit.world();Kit.clear();
 const ash=t.townBy('Ashford'),other=t.TOWNS.find(x=>x!==ash&&x.owner&&x.owner!=='player'&&!x.gone),goods=Object.keys(t.GOODS).filter(k=>t.ITEM_KINDS.good.catId({id:k}));
 P.gold=5000;P.inv=P.inv.map(()=>null);t.ensureEcon(ash);t.ensureEcon(other);
 // (the most a unit sold into a stock of s and bought back gains, over every good and s from 0 to 12)
 const gain=()=>{let w=-1e9;for(const g of goods){const s0=ash.stock[g];for(let s=0;s<=12;s++){ash.stock[g]=s;const sp=t.nextSell(ash,g);ash.stock[g]=s+1;w=Math.max(w,sp-t.nextBuy(ash,g))}ash.stock[g]=s0}return w};
 try{
  // ---- the market
  F.on=true;F.own=true;ok(gain()<=0,'a unit sold and bought back never gains, at any stock, of any good (most: '+gain()+')');
  F.on=false;ok(gain()>0,'the old pricing gained at an empty stall (most: '+gain()+'): the check bites');F.on=true;
  {const g=goods.find(k=>t.GOODS[k].base>=40)||goods[0],s0=ash.stock[g];ash.stock[g]=0;t.invAdd('good',g,1);const g0=P.gold;let n=0;
   for(let i=0;i<6;i++){n+=t.sellGoods(ash,g,1).sold;t.buyGoods(ash,g,1)}ok(n===6&&P.gold<g0&&t.goodN(g)===1,'six times sold and bought back at an empty stall: the same one in hand, gold down ('+(P.gold-g0)+')');t.goodTake(g,1);ash.stock[g]=s0}
  // ---- a fief of yours
  {const o=ash.owner,g0=P.gold;ash.owner='player';t.invAdd('good','grain',5);const r=t.sellGoods(ash,'grain',5);
   ok(t.nextSell(ash,'grain')===0&&r.sold===0&&P.gold===g0&&t.goodN('grain')===5,'your own fief\'s market buys no goods of you');
   F.own=false;ok(t.nextSell(ash,'grain')>0,'own off: it buys as any market');F.own=true;ash.owner=o;t.goodTake('grain',5)}
  // ---- a caravan
  {const c=Object.create(t.CaravanParty.prototype);c.from=ash.name;c.to=other.name;const s=g=>{ash.stock[g]=t.Economy.of(ash).target(g)*3;other.stock[g]=0},A={...ash.stock},B={...other.stock};goods.forEach(s);
   ok(goods.every(g=>c.pays(g)<c.price(g)),'a caravan from a glut to a dearth pays under what it charges, for every good');
   F.on=false;ok(goods.some(g=>c.pays(g)>c.price(g)),'the old rule paid more than it charged: the check bites');F.on=true;ash.stock=A;other.stock=B}
  // ---- a ruin
  {const tw=other;P.troops={hum_foot:6};t.Timed.of(tw).clear&&t.Timed.of(tw).clear('sacked');ok(t.plunderLeft(tw)&&t.sackGold(tw)>0,'a whole holding: its sack is worth gold ('+t.sackGold(tw)+')');
   let g0=P.gold,r0=P.renown;G.capture=tw;G.mode='capture';t.captureAct('cap-leave');const g1=P.gold-g0,r1=P.renown-r0;ok(g1>0&&r1>0&&tw.ruined(),'sacked and left: its gold ('+g1+') and renown ('+r1+'), and it lies ruined');
   g0=P.gold;r0=P.renown;G.capture=tw;G.mode='capture';t.captureAct('cap-leave');ok(P.gold===g0&&P.renown===r0,'taken and sacked again as it lies ruined: no gold, no renown');
   ok(!t.plunderLeft(tw)&&t.sackGold(tw)===0,'nothing left to plunder there');
   X.once=false;ok(t.sackGold(tw)>0,'once off: as before');X.once=true;G.capture=null;G.mode='world';t.hidePanel()}
  // ---- remains
  {P.inv=P.inv.map(()=>null);t.invAdd('good','grain',15);while(t.invAdd('good','iron',50)>0);const room=t.goodRoom('grain'),r=Object.create(t.Remains.prototype);r.gold=0;r.items=[['good','grain',room+10]];
   const n0=t.goodN('grain');r.take();ok(room>0&&t.goodN('grain')===n0+room&&r.items.length===1&&r.items[0][2]===10,'remains: the bag took '+room+', the 10 it could not are left, no more');
   t.goodTake('grain',5);r.take();ok(r.items[0][2]===5,'taken again with room for 5: 5 left');P.inv=P.inv.map(()=>null)}
  // ---- a drink: cheer for what comes in, none for what you set down yourself and take up again
  {P.morale=20;P.inv=P.inv.map(()=>null);t.invAdd('good','ale',10);const m=t.SUPPLY.drink.ale.morale;ok(P.morale===20+10*m,'ten ale into your stores: their cheer');
   const o=ash.owner;ash.owner='player';t.ensureEcon(ash);const s0=ash.stock.ale||0;t.fiefEconAct('fief-store','ale:10',ash);t.fiefEconAct('fief-take','ale:10',ash);ok(t.goodN('ale')===10&&P.morale===20+10*m,'stored in your fief and taken back: no cheer twice');ash.stock.ale=s0;ash.owner=o;
   G.loot={from:t.lootSnap(),pile:[{k:'good',id:'ale',n:3}],capture:true};G.lootView={next:'cont'};const pi=P.inv.findIndex(x=>x&&x.id==='ale');t.lootAct('lt-drop',String(pi));t.lootAct('lt-all');ok(t.goodN('ale')===13&&P.morale===20+13*m,'set on a battle\'s pile and taken up with three of theirs: cheer for their three only');G.loot=null;G.lootView=null;
   t.goodTake('ale',5);t.invAdd('good','ale',5);ok(P.morale===20+18*m,'given away and come by again: cheer (it was not set down to take up)');
   t.SUPPLY.drink.once=false;const a=t.goodN('ale'),o2=ash.owner;ash.owner='player';t.fiefEconAct('fief-store','ale:5',ash);t.fiefEconAct('fief-take','ale:5',ash);ash.owner=o2;ok(P.morale===20+23*m,'once off: as before');t.SUPPLY.drink.once=true;P.inv=P.inv.map(()=>null)}
 }finally{Object.assign(F,keep);X.once=once;t.SUPPLY.drink.once=true}
});
