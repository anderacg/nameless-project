'use strict';
// The market's trading screen (ui/trade.js; the owner, 2026-11-04: "two separated inventories side by side ... a summary at the
// center ... once you press Confirm the transaction occurs"): rows moved into the bargain (the qty of them) and back; its prices
// quoted as they would go, the market unchanged; the totals and your gold after; greyed when you cannot pay or carry it; struck
// on Confirm (sales first, then buys, things of yours too); Clear empties it.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',23);Kit.world();Kit.clear();
 const ash=t.townBy('Ashford'),q=Kit.q,qa=Kit.qa,D=()=>t.TradeDeal.of();P.gold=500;P.inv=P.inv.map(()=>null);t.invAdd('good','grain',10);t.invAdd('val','chalice',1);
 Kit.goHome(ash);t.enterTown(ash);t.act('tab','trade');t.ensureEcon(ash);const g=Object.keys(t.GOODS).find(k=>(ash.stock[k]||0)>10&&k!=='grain'&&t.ITEM_KINDS.good.catId({id:k}));
 ok(q('.tr-mine h3')&&/Your pack/.test(q('.tr-mine').textContent)&&/The bargain/.test(q('.tr-mid').textContent)&&/The merchants/.test(q('.tr-theirs').textContent),'three side by side: your pack, the bargain, the merchants');
 // ---- into the bargain: nothing changes hands, the market's stock and prices as they were
 {const s0=ash.stock[g],p0=t.nextBuy(ash,g),g0=P.gold,n0=t.goodN('grain');t.act('qty','5');t.act('deal','s:grain');t.act('deal','b:'+g);t.act('qty','1');
  ok(D().sell.grain===5&&D().buy[g]===5&&ash.stock[g]===s0&&t.nextBuy(ash,g)===p0&&P.gold===g0&&t.goodN('grain')===n0,'five of each into the bargain: nothing changed hands, the market as it was');
  const L=D().lines(ash),b=L.find(l=>l.key===g),s=L.find(l=>l.key==='grain');ok(b.gold===t.goodsQuote(ash,g,5,true)&&b.gold>=p0*5&&s.gold===t.goodsQuote(ash,'grain',5,false),'each line quoted as it would go, the price moving unit by unit ('+b.gold+'g for 5 '+g+')');
  const T0=D().totals(ash);ok(T0.after===P.gold+s.gold-b.gold&&q('.tr-sum').textContent.includes(P.gold+'g → '+T0.after+'g'),'the totals, and your gold before and after: '+P.gold+'g → '+T0.after+'g');
  t.act('undeal','b:'+g);ok(D().buy[g]===4,'− takes one back')}
 // ---- your things too
 {const i=P.inv.findIndex(x=>x&&x.k==='val');t.act('deal','o:'+i);t.act('deal','o:'+i);ok(D().own.length===1&&qa('.tr-mid .tr-line').some(l=>/chalice/i.test(l.textContent)),'a thing of yours into the bargain (once)')}
 // ---- can't pay: greyed
 {const keep=P.gold;P.gold=0;t.act('qty','20');t.act('deal','b:'+g);t.act('qty','1');t.renderTown();const c=q('[data-act="deal-ok"]');ok(c.disabled&&c.title==='Not enough gold'||D().totals(ash).after>=0,'more than you can pay: Confirm greyed ('+c.title+')');P.gold=keep;t.act('qty','16');t.act('undeal','b:'+g);t.act('qty','1');t.renderTown()}
 // ---- struck
 {const g0=P.gold,n0=t.goodN('grain'),h0=t.goodN(g),T0=D().totals(ash),want=D().buy[g];t.act('deal-ok');
  ok(D().empty&&t.goodN('grain')===n0-5&&t.goodN(g)===h0+want&&!P.inv.some(x=>x&&x.k==='val')&&P.gold===g0+T0.net,'Confirm: sold, bought, the chalice gone, '+(T0.net>=0?'+':'')+T0.net+' gold as the bargain said')}
 // ---- clear
 {t.act('deal','s:grain');t.act('deal-clear');ok(D().empty,'Clear: empty')}
 t.toWorld();Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
