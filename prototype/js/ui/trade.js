'use strict';
/* ---------- the market's trading screen (the owner, 2026-11-04: "two separated inventories side by side, what's been sold or bought,
   a summary at the center, and once you press Confirm the transaction occurs"). On the left your pack (the goods you carry, and
   the things of yours a market buys), on the right the merchants' stalls (their goods, empty waterskins, quivers); between them
   the bargain: what you sell, what you buy, what each side pays, your gold before and after, Confirm and Clear. Pressing a row's
   button moves the amount chosen (the qty: ×1, ×5 or typed) into the bargain; − in the bargain takes it back. Nothing changes
   hands till Confirm: your sales first (room for what you buy), then your buys, each as the old buttons did it (its price moving
   unit by unit, your standing and Trading); the bargain's prices are quoted as they would go (economy.js quote).
   Each row and line its item's picture (its kind's icon, ico). TradeDeal: the bargain (G.town.deal: {sell: {good: n}, buy: {good: n}, own: [bag slot], quiver: {id: n}, skin: n}; never
   saved), its lines, totals and why it cannot be struck, a haggle (economy.js TRADE_TERMS, tradeTerms: your standing and a
   haggle in every good's price); TradeScreen: the page, your terms in the bargain. Verbs (town.js Market): deal (kind:key, the qty
   more), undeal (kind:key, the qty less; all of a thing of yours), deal-clear, deal-ok, deal-haggle ---------- */
class TradeDeal{
  constructor(o){Object.assign(this,{sell:{},buy:{},own:[],quiver:{},skin:0},o||{})}
  static of(){const T=G.town;if(!T)return new TradeDeal();if(!(T.deal instanceof TradeDeal))T.deal=new TradeDeal(T.deal);return T.deal}
  static clear(){if(G.town)G.town.deal=new TradeDeal()}
  get empty(){return !Object.keys(this.sell).length&&!Object.keys(this.buy).length&&!this.own.length&&!Object.keys(this.quiver).length&&!this.skin}
  // (what is left to move: of your goods, of the market's)
  left(t,kind,key){
    if(kind==='s')return goodN(key)-(this.sell[key]||0);
    if(kind==='b'){ensureEcon(t);return (t.stock[key]||0)-(this.buy[key]||0)}
    return Infinity;
  }
  // (a thing moved in: what is on the other side of the bargain of the same thing taken back first (buying grain you are selling
  // only sells less), the rest added; the owner: "it should deduct the one that the player first")
  add(t,kind,key,n){
    if(kind==='o'){const i=+key,x=P.inv[i];if(!x||this.own.includes(i))return;if(this.quiver[x.id]>0){this.sub('q',x.id,1);return}this.own.push(i);return}
    if(kind==='k'){if(this.sell[SKIN.empty]>0){const k=Math.min(n,this.sell[SKIN.empty]);this.sub('s',SKIN.empty,k);n-=k}if(n>0)this.skin+=n;return}
    if(kind==='q'){const i=this.own.find(j=>P.inv[j]&&P.inv[j].id===key);if(i!=null){this.sub('o',i);return}this.quiver[key]=(this.quiver[key]||0)+1;return}
    const other=kind==='s'?this.buy:this.sell,back=Math.min(n,other[key]||0);
    if(back>0){this.sub(kind==='s'?'b':'s',key,back);n-=back}
    if(kind==='s'&&key===SKIN.empty&&this.skin>0){const k=Math.min(n,this.skin);this.skin-=k;n-=k}
    if(n<=0)return;
    const m=kind==='s'?this.sell:this.buy,k=Math.min(n,this.left(t,kind,key));if(k>0)m[key]=(m[key]||0)+k;
  }
  sub(kind,key,n){
    if(kind==='o'){this.own=this.own.filter(i=>i!==+key);return}
    if(kind==='k'){this.skin=Math.max(0,this.skin-n);return}
    const m=kind==='s'?this.sell:kind==='b'?this.buy:this.quiver;m[key]=(m[key]||0)-(kind==='q'?1:n);if(!(m[key]>0))delete m[key];
  }
  // (its lines, each {side: 'sell' or 'buy', kind, key, n, name, gold})
  lines(t){
    const L=[];
    for(const [g,n] of Object.entries(this.sell))L.push({side:'sell',kind:'s',key:g,n,name:GOODS[g].n,gold:goodsQuote(t,g,n,false),ic:'good:'+g});
    for(const i of this.own){const x=P.inv[i];if(x)L.push({side:'sell',kind:'o',key:i,n:x.n||1,name:itemKind(x).name(x),gold:itemKind(x).fetches(x,t),ic:x.k+':'+x.id})}
    for(const [g,n] of Object.entries(this.buy))L.push({side:'buy',kind:'b',key:g,n,name:GOODS[g].n,gold:goodsQuote(t,g,n,true),ic:'good:'+g});
    if(this.skin)L.push({side:'buy',kind:'k',key:'skin',n:this.skin,name:GOODS[SKIN.empty].n,gold:GOODS[SKIN.empty].base*this.skin,ic:'good:'+SKIN.empty});
    for(const [id,n] of Object.entries(this.quiver))L.push({side:'buy',kind:'q',key:id,n,name:ITEM_KINDS.quiver.title({id}),gold:gearPrice(id)*n,ic:'quiver:'+id});
    return L;
  }
  totals(t){const L=this.lines(t),get=L.filter(l=>l.side==='sell').reduce((a,l)=>a+l.gold,0),pay=L.filter(l=>l.side==='buy').reduce((a,l)=>a+l.gold,0);return{get,pay,net:get-pay,after:P.gold+get-pay}}
  // (why it cannot be struck: '' when it can)
  why(t){
    if(this.empty)return 'Nothing in the bargain yet';
    if(this.totals(t).after<0)return 'Not enough gold';
    const full=Object.entries(this.buy).find(([g,n])=>goodRoom(g)+(this.sell[g]||0)<n);
    return full?BAG_FULL:'';
  }
  // (a haggle: once a visit, a bargain worth TRADE_TERMS.min or more; why not: '' when you may)
  haggleWhy(t){const T=this.totals(t);if(G.town.haggle)return G.town.haggle==='won'?'You have their best price':'They will not haggle again today';return T.get+T.pay<TRADE_TERMS.min?'Only over a bargain of '+TRADE_TERMS.min+' gold or more':''}
  haggle(t){if(this.haggleWhy(t))return '';const k='chk:haggle';ENC_STAT[k]=ENC_STAT[k]||QUEST_CHECKS.haggle;const won=rngOf('road').chance(statOdds(k));
    G.town.haggle=won?'won':'lost';train('trade',TRADE_TERMS.xp);
    const line=won?'You haggle them down: '+Math.round(TRADE_TERMS.haggle*100)+'% better on every good today.':'The merchants will not be beaten down, and sour: '+Math.round(TRADE_TERMS.annoy*100)+'% worse for the rest of your visit.';log(line,won?'good':'bad');return line}
  // struck: your sales, then your buys; what came of it, in a line
  confirm(t){
    if(this.why(t))return '';
    const before=P.gold,parts=[];
    for(const [g,n] of Object.entries(this.sell)){const r=sellGoods(t,g,n);train('trade',r.earned/20);addRep(t.name,r.earned/60,true);if(r.sold)parts.push('sold '+r.sold+' '+GOODS[g].n.toLowerCase())}
    for(const i of this.own.slice().sort((a,b)=>b-a)){const x=P.inv[i],v=x&&itemKind(x).verb('sell');if(v&&v.shown(i)){parts.push('sold '+itemKind(x).name(x));v.perform(i)}}
    for(const [g,n] of Object.entries(this.buy)){const r=buyGoods(t,g,n);if(r.got){addRep(t.name,r.spent/60,true);parts.push('bought '+r.got+' '+GOODS[g].n.toLowerCase())}}
    if(this.skin&&skinsBuy(this.skin))parts.push('bought '+this.skin+' waterskins');
    for(const [id,n] of Object.entries(this.quiver))for(let k=0;k<n;k++)quiverBuy(id,t,'trade');
    TradeDeal.clear();
    const d=P.gold-before,line='The bargain is struck: '+(parts.join(', ')||'nothing changed hands')+'. '+(d>=0?'+':'−')+Math.abs(d)+' gold.';
    log(line,'gold');updateHUD(true);return line;
  }
}
const TradeScreen={
  // (a pane's row: its name, its facts, how many, and its button)
  // (a list's category headings, for the search: hidden with all their rows, ui/invtools.js Finder)
  heads(h){return h.split('<div class="lab lab-cat">').join('<div class="lab lab-cat" data-find-head="trade">')},
  // (an item's picture: its kind's icon, drawn by loot.js fillIcons once the window is up; ic: 'kind:id')
  ico(ic){return '<span class="tr-ico"><span data-icon="'+ic+'"></span></span>'},
  row(name,facts,n,act,arg,label,why,ic){return '<div class="tr-row"'+Finder.attrs('trade',String(name).replace(/<[^>]*>/g,''))+'>'+this.ico(ic)+'<div class="tr-info"><strong>'+name+'</strong><small>'+facts+'</small></div><span class="tr-n">'+n+'</span>'+railBtn(act,arg,label,why)+'</div>'},
  mine(t,D,q){
    const goodCat=k=>ITEM_KINDS.good.catId({id:k}),gs=Object.keys(GOODS).filter(k=>goodCat(k)&&goodN(k)>0);
    let h=byCategory(gs,goodCat,k=>{const l=D.left(t,'s',k);return this.row(GOODS[k].n,nextSell(t,k)+'g each',l,'deal','s:'+k,'<span class="tr-w">Sell </span>›',l<1?'All in the bargain':'','good:'+k)});
    const own=P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k!=='good'&&(itemCat(x)||{}).sell);
    if(own.length)h+=byCategory(own,([x])=>itemKind(x).catId(x),([x,i])=>{const K=itemKind(x),c=K.colour(x),on=D.own.includes(i);
      return this.row('<span'+(c?' style="color:'+c+'"':'')+'>'+K.name(x)+'</span>',K.fetches(x,t)+'g',x.n>1?'×'+x.n:'','deal','o:'+i,'<span class="tr-w">Sell </span>›',on?'In the bargain':'',x.k+':'+x.id)});
    return h||'<p class="muted">You carry nothing they would buy.</p>';
  },
  theirs(t,D,q){
    const goodCat=k=>ITEM_KINDS.good.catId({id:k});ensureEcon(t);
    const gs=[...Object.keys(GOODS).filter(k=>goodCat(k)&&k!==SKIN.empty&&((t.stock[k]||0)>0||needOf(t,k)>.05)),SKIN.empty];
    let h=byCategory(gs,goodCat,k=>{if(k===SKIN.empty)return this.row(GOODS[k].n,GOODS[k].base+'g each · filled free at a well','','deal','k:skin','‹<span class="tr-w"> Buy</span>','','good:'+k);
      const l=D.left(t,'b',k),ms=marketState(t,k);
      return this.row(GOODS[k].n+(ms?' <span class="'+(ms==='shortage'?'bad':'good')+'">'+cap1(ms)+'</span>':''),nextBuy(t,k)+'g each',l,'deal','b:'+k,'‹<span class="tr-w"> Buy</span>',l<1?'The market has none left':'','good:'+k)});
    const qs=quiverStock(t,'trade');
    if(qs.length)h+='<div class="lab lab-cat">Quivers</div>'+qs.map(id=>this.row('<span style="color:'+RARITY[ITEMS[id].r]+'">'+ITEM_KINDS.quiver.title({id})+'</span>',gearPrice(id)+'g','','deal','q:'+id,'‹<span class="tr-w"> Buy</span>','','quiver:'+id)).join('');
    return h;
  },
  // the bargain: each side's lines (− takes one back), the totals, your gold before and after, Confirm and Clear
  bargain(t,D,q){
    const L=D.lines(t),T=D.totals(t),why=D.why(t),side=(s,word)=>{const ls=L.filter(l=>l.side===s);
      return '<div class="lab">'+word+'</div>'+(ls.length?ls.map(l=>'<div class="tr-line">'+this.ico(l.ic)+'<span>'+l.name+(l.n>1?' ×'+l.n:'')+'</span><b class="gold">'+l.gold+'g</b>'+railBtn('undeal',l.kind+':'+l.key,'−','')+'</div>').join(''):'<p class="muted">—</p>')};
    return '<div class="lab lab-qty"><span>Move</span>'+railQty(q,'qty')+'</div>'+side('sell','You sell')+side('buy','You buy')+
      '<div class="tr-sum"><div><span>They pay you</span><b class="gold">'+T.get+'g</b></div><div><span>You pay them</span><b class="gold">'+T.pay+'g</b></div>'+
      '<div class="tr-net"><span>Balance</span><b class="'+(T.net<0?'bad':'good')+'">'+(T.net<0?'−':'+')+Math.abs(T.net)+'g</b></div><div><span>Your gold</span><b>'+P.gold+'g → '+T.after+'g</b></div></div>'+
      this.terms(t,D)+
      '<div class="tr-acts">'+railBtn('deal-clear','','Clear',D.empty?'Nothing to clear':'')+'<button class="btn primary" type="button" data-act="deal-ok" data-arg=""'+(why?' disabled title="'+htmlText(why)+'"':'')+'>Confirm</button></div>'+
      (why&&!D.empty?'<p class="bad tr-why">'+why+'.</p>':'');
  },
  // (your terms here: your standing, a haggle, and the button to try one)
  terms(t,D){const m=tradeTerms(t),pc=v=>(v>=0?'+':'−')+Math.abs(Math.round(v*100))+'%',st=standingAt(t),hw=D.haggleWhy(t),k='chk:haggle';ENC_STAT[k]=ENC_STAT[k]||QUEST_CHECKS.haggle;
    return '<div class="tr-terms"><div><span>Your standing here ('+(st>=0?'+':'')+st+')</span><b class="'+(m.stand<0?'bad':'good')+'">'+(m.stand?'buy '+pc(-m.stand)+' · sell '+pc(m.stand):'no favour')+'</b></div>'+
      (m.haggle?'<div><span>'+(m.haggle>0?'Haggled':'They are sour')+'</span><b class="'+(m.haggle<0?'bad':'good')+'">buy '+pc(-m.haggle)+' · sell '+pc(m.haggle)+'</b></div>':'')+
      (G.town.haggle?'':'<div class="tr-haggle">'+railBtn('deal-haggle','','Haggle',hw)+'<small>'+statRead(k,{vague:'you cannot tell your odds',what:'to beat them down'})+'</small></div>')+'</div>'},
  html(t){
    const D=TradeDeal.of(),q=G.town.qty||1,I=playerInventory,scarce=Object.keys(GOODS).filter(g=>marketState(t,g)==='shortage');
    return '<p class="muted tr-head">The merchants of '+t.name+(scarce.length?' · <span class="bad">short of '+scarce.slice(0,3).map(g=>GOODS[g].n.toLowerCase()).join(', ')+'</span>':' · prices fair')+' · your bag '+I.used+' / '+I.size+(I.over?' · <span class="bad">'+I.over+' over: burdened</span>':'')+'</p>'+
      '<div class="tr-find">'+Finder.html('trade','Search goods and items')+'</div>'+
      '<div class="tr" data-find-scope><section class="tr-pane tr-mine"><h3>Your pack</h3>'+this.heads(this.mine(t,D,q))+'<p class="muted find-none" data-find-none="trade" hidden>None by that name.</p></section>'+
      '<section class="tr-mid"><h3>The bargain</h3>'+this.bargain(t,D,q)+'</section>'+
      '<section class="tr-pane tr-theirs"><h3>The merchants</h3>'+this.heads(this.theirs(t,D,q))+'</section></div>';
  },
};
