'use strict';
// Buying back (ui/trade.js Buyback, data/economy.js BUYBACK; the owner, 2026-11-12: "let you buy things back in case player accidentally
// sold their items"): a thing sold from your bag is kept by the market that bought it, at what it paid you, for BUYBACK.days days, the
// last BUYBACK.max of them; a row in the merchants' pane, moved into the bargain and struck as any buy; back in your bag as it was.
Kit.suite(({ok})=>{const t=T,P=t.P,G=t.G,B=t.BUYBACK,BB=t.Buyback;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const panel=()=>document.getElementById('panel').innerHTML,gid=Object.keys(t.ITEMS).find(q=>t.ITEMS[q].slot==='weapon'),ash=t.townBy('Ashford'),other=t.TOWNS.find(x=>x!==ash&&!x.gone);
 const nOf=id=>P.inv.reduce((n,q)=>n+(q&&q.id===id?q.n||1:0),0),slotOf=id=>P.inv.findIndex(q=>q&&q.id===id);
 try{
  P.buyback=undefined;P.gold=500;t.invAdd('gear',gid,1);const s0=P.inv[slotOf(gid)];s0.mark='kept';G.lastTown=null;t.enterTown(ash);t.act('tab','trade');
  // ---- sold by mistake: kept by this market, at what it paid you
  const n0=nOf(gid),g0=P.gold;t.act('deal','o:'+slotOf(gid));t.act('deal-ok');const paid=P.gold-g0,b=BB.here(ash)[0];
  ok(nOf(gid)===n0-1&&paid>0&&b&&b.gold===paid&&b.x.id===gid,'sold: '+paid+' gold, and the market of Ashford keeps it for you');
  ok(/You sold here/.test(panel())&&new RegExp('data-arg="r:'+b.id+'"').test(panel())&&/Buy back/.test(panel()),'its row in the merchants\' pane: "You sold here", Buy back at '+BB.price(b)+'g, '+B.days+' days left');
  ok(BB.price(b)===paid,'at the price it paid you (markup '+B.markup+'): nothing made or lost by it');
  // ---- bought back through the bargain: as it was
  t.act('deal','r:'+b.id);ok(/\(back\)/.test(panel())&&t.TradeDeal.of().totals(ash).pay===paid,'in the bargain: "… (back)", '+paid+'g to pay');
  t.act('deal-ok');const s1=P.inv[slotOf(gid)];ok(nOf(gid)===n0&&P.gold===g0&&s1&&s1.mark==='kept'&&!BB.here(ash).length,'struck: back in your bag as it was (its own marks too), your gold as before, the row gone');
  // ---- only where you sold it; not after its days; at most BUYBACK.max kept
  t.act('deal','o:'+slotOf(gid));t.act('deal-ok');const b2=BB.here(ash)[0];G.lastTown=null;t.enterTown(other);t.act('tab','trade');
  ok(!BB.here(other).length&&!new RegExp('data-arg="r:'+b2.id+'"').test(panel()),'at '+other.name+': not there (only the market that bought it)');
  t.act('deal','r:'+b2.id);ok(!t.TradeDeal.of().rebuy.length,'nor to be moved into its bargain');
  const d0=G.day;G.day=d0+B.days;try{ok(!BB.list().length,'after '+B.days+' days: sold on, gone')}finally{G.day=d0}
  P.buyback=undefined;for(let i=0;i<B.max+5;i++)BB.note({k:'gear',id:gid,n:1},10+i,ash);ok(P.buyback.length===B.max&&P.buyback[0].gold===10+B.max+4,'never more than '+B.max+' kept, the newest first');
  // ---- no room in your bag: not to be struck
  {const I=t.playerInventory;while(I.spare>0)I.put({k:'mat',id:'pelt',n:1});G.lastTown=null;t.enterTown(ash);t.act('tab','trade');t.act('deal','r:'+P.buyback[0].id);
   ok(t.TradeDeal.of().why(ash)===t.BAG_FULL,'your bag full: "'+t.BAG_FULL+'"');t.act('deal-clear');P.inv=P.inv.map(q=>q&&q.id==='pelt'?null:q)}
  // ---- a thing bought back trains no Trading sold again (sold and bought back over and over, it trained it for nothing: the 2026-11-13 balance)
  {const tr0=window.train;let n=0;window.train=(k,v)=>{if(k==='trade')n++;return tr0(k,v)};
   try{P.buyback=undefined;P.gold=500;t.invAdd('gear',gid,1);G.lastTown=null;t.enterTown(ash);t.act('tab','trade');t.act('deal','o:'+slotOf(gid));t.act('deal-ok');const n1=n;
    t.act('deal','r:'+BB.here(ash)[0].id);t.act('deal-ok');ok(P.inv[slotOf(gid)]?.back,'bought back: marked so');t.act('deal','o:'+slotOf(gid));t.act('deal-ok');ok(n1===1&&n===1,'its sale trained Trading once; sold again after buying it back, not again')}
   finally{window.train=tr0;P.buyback=undefined}}
  // ---- off: nothing kept
  {B.on=false;try{P.buyback=undefined;ok(!BB.note({k:'gear',id:gid,n:1},5,ash)&&!P.buyback,'off: nothing kept, as before')}finally{B.on=true}}
 }finally{P.buyback=undefined;Kit.world()}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
