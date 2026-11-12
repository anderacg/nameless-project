'use strict';
// Commands return outcomes; the screen decides how to describe them.
const RECRUIT_WHY={barracks:'Upgraded only at a barracks',amount:'Enter a positive whole number with a valid total cost',target:'Choose an existing group of this unit type, or a new group','wounded-group':'Wait for this group’s wounded to return before upgrading it',slot:'No free unit slot: one full unit of its new kind trains, the rest stay, and they need a slot of their own',groups:'Army slot or troop-group limit reached. Train Leadership, choose another group, or make room',gold:'Not enough gold for this order',capacity:'Not enough headcount capacity for this order',volunteers:'Not enough volunteers for this order',standing:'Not enough standing',closed:'No one will enlist while the holding recovers',unavailable:'This holding does not raise that troop',experience:'Needs more experience: fight with them',troops:'No soldiers of that kind',upgrade:'Not a valid troop upgrade','training-unavailable':'Needs an expert trainer of its role (here, or yours in your camp)','companion-unavailable':'This companion is not available here','companion-hired':'Already in your band','invalid-unit':'Unknown recruit'};
// (a troop name for many: Lancer, Lancers; Spearman, Spearmen)
const troopsWord=n=>/man$/.test(n)?n.slice(0,-3)+'men':/s$/.test(n)?n:n+'s';
const recruitmentWhy=r=>r.code==='horses'&&r.horses?r.horses.why:RECRUIT_WHY[r.code]||'';
function recruitmentFeedback(r,t){
  if(r.ok){
    if(r.code==='hire')log((r.count>1?r.count+' × '+ST[r.kind].n:cap1(an(ST[r.kind].n.toLowerCase())))+' join'+(r.count>1?'':'s')+' your band.');
    else if(r.code==='group-training')log(armyGroupLabel(r.id)+': '+r.count+' × '+ST[r.from].n+' upgraded to '+ST[r.to].n+(r.cost?' for '+r.cost+'g':'')+'. They start again at rank 1.'+(r.split?' The other '+r.stay+' stay as they were.':''),'good');
    else if(r.code==='companion')log(COMPS[r.id].n+' joins your band.','good');
    else if(r.code==='prisoner')log('A captured '+ST[r.kind].n.toLowerCase()+' swears to follow you.');
  }else if(r.code==='standing')toast('The people of '+t.name+' do not know you well enough yet.','bad');
  else if(r.code==='volunteers')toast('No one else in '+t.name+' will take up arms today.','bad');
  else if(r.code==='experience')toast(armyGroupLabel(r.id)+' needs rank '+RANKS.max+' first: fight with them.','bad');
  else if(recruitmentWhy(r))toast(recruitmentWhy(r)+'.','bad');
}
/* ---------- economy ---------- */
// prices come from each market's stock against its needs (economy.js); these are the next unit's
const price=(town,good)=>marketPrice(town,good);
const buyP=(t,g)=>nextBuy(t,g);
const sellP=(t,g)=>nextSell(t,g);
// (a trophy's and a piece's price at a market, a piece's at a smith or stable: their kinds', core/items.js)
const matPrice=k=>ITEM_KINDS.mat.price({id:k});
const itemPrice=id=>ITEM_KINDS.gear.price({id});
// a smith's stock: up to 6 pieces a week, forged from the metals in its holding's stock (FORGE: wood, bronze from copper and tin,
// iron, silver, gold, mithril, adamant), each piece taking its metal; it favours the best metal it has (Smithy stock)
const forgeTiers=t=>{ensureEcon(t);return FORGE.map((m,k)=>Object.keys(m).every(g=>(t.stock[g]||0)>=m[g])?k:-1).filter(k=>k>=0)};
const smithStock=t=>PLACES.smith.stock(t);
// the metals a smith has to work with, and what it lacks: for its tab
const forgeText=t=>{const ok=forgeTiers(t),has=MATERIALS.filter((m,k)=>k&&ok.includes(k)).map(m=>m.k);return has.length?'It can forge '+has.join(', ')+' and wooden pieces from the metals in '+t.name+'.':'There is no metal in '+t.name+': only wooden pieces until some is mined or brought in.'};
// a stable's mounts: commons everywhere, horses in towns, rare beasts by the folk who live there or the land around
const stableStock=t=>ITEM_KINDS.mount.stockAt(t);
const canBuyMount=(t,id)=>ITEM_KINDS.mount.canBuyAt({id},t);
const gearPrice=id=>ITEM_KINDS.gear.cost({id});
// the quivers a holding sells at a place of it (trade, smith: core/items.js Quiver stockAt), as rows to buy (act: the place's verb)
const quiverStock=(t,place)=>ITEM_KINDS.quiver.stockAt(t,place);
function quiverRows(t,place,act){
  const ids=quiverStock(t,place);if(!ids.length)return '';
  return '<div class="lab" style="margin-top:6px">Quivers, your shots in every battle</div>'+ids.map(id=>{const I=ITEMS[id],p=gearPrice(id),own=P.gear.quiver===id;
    return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+ITEM_KINDS.quiver.title({id})+'</strong><small>'+I.d+'</small></div><div class="acts">'+railBtn(act,id,'Buy',P.gold<p?'Not enough gold':playerInventory.room('gear',id)<1?BAG_FULL:'')+'</div><span class="own gold">'+p+'g</span></div>'}).join('');
}
// a quiver bought where it is sold (place): into your bag, your standing up a little
function quiverBuy(id,t,place){
  const p=gearPrice(id);if(!quiverStock(t,place).includes(id)||P.gold<p||!invAdd('gear',id,1))return;
  P.gold-=p;addRep(t.name,ITEMS[id].v/120,true);toast('You buy a '+ITEM_KINDS.quiver.title({id}).toLowerCase()+'. Wear it in your inventory.','gold');
}
const ransomValue=()=>Object.keys(P.prisoners).reduce((a,k)=>a+P.prisoners[k]*RANSOM[ST[k].tier],0);

/* ---------- a holding's places (doc/STORY_DESIGN.md §7, wave D) ----------
   A Place is one area of a holding, as the rooms of a house: the market square, the tavern, the smithy, the stable, the
   barracks, the lord's hall, the notice board, the lists, the storehouse, the walls, the steward's office, the siege camp. One
   object each, kept in PLACES (its id, the window's old tab key, G.town.tab) in the order of the rail (townui.js showTown):
   definePlace(id, spec) takes a Place subclass (made with its id) or plain data with hooks (made a Place). Each knows:
     n, short, ico: its name, a short one for a slim rail, its icon (icons.js);
     at(t): the holding has it (by default: its kind's tabs, HOLDING_TYPES tabs); rail: it has an entry on the rail (the siege
       camp has not: it is on the overview); opens(t): its window opens (else the overview: a steward's office not yours);
     item(t, tab): its rail entry (window.js railWindow); dot(t): something there needs you (the rail's dot);
     page(t): its window's content: shut(t), the line when it is closed (burned, in turmoil), else body(t), its cards and rows
       (window.js railCards, railRow, railBtn), built from what it holds;
     verbs: {act: method}, its own actions (the buttons' data-act); act(a, arg, t) does one (handles(a): is it its own).
       The town window redraws after it (town.js townAct), unless the verb answers Place.AWAY: it opened another window (a
       picker, a confirm, a talk, a battle, the siege camp) or left the holding;
     focus(a, arg): after the redraw, the focus put where the verb wants it (true), else on the button pressed (window.js
       railFocus).
   Its single verbs with a reason to be greyed are Choices (story/choice.js: the lists' Enter, the hall's contract), their
   button greyed by need, done only when free. Adding a place (the tournament's stadium) is one definePlace. */
const PLACES={};
class Place{
  constructor(id,spec){
    this.id=id;
    this.rail=true;
    this.verbs={};
    Object.assign(this,spec);
  }
  at(t){
    return t.T.tabs.includes(this.id);
  }
  opens(t){
    return true;
  }
  dot(t){
    return false;
  }
  item(t,tab){
    return {act:'tab',arg:this.id,ico:this.ico,n:this.n,short:this.short,on:this.id===tab,dot:this.dot(t)};
  }
  // closed: '' (open), or why not (its window's whole content)
  shut(t){
    return '';
  }
  body(t){
    return '';
  }
  // its window: closed, or its own content, and under it the unit upgrades sold here, whichever building it is (data/buffs.js BUFFS
  // at: a building's id; the owner, 2026-11-01: "dynamic enough so that I can just switch building type")
  page(t){
    return this.shut(t)||this.body(t)+(Buffs.offer(t,this.id).length?buffShop(t,this.id):'');
  }
  handles(a){
    return Object.prototype.hasOwnProperty.call(this.verbs,a)||a==='buff-buy';
  }
  // (each verb's method has (arg, t, a): a, for one method doing two verbs; an upgrade bought, at any building that sells it)
  act(a,arg,t){
    if(a==='buff-buy'&&!this.verbs[a])return buffBuy(arg,t,this.id);
    return this[this.verbs[a]](arg,t,a);
  }
  focus(a,arg){
    return false;
  }
  // sacked or raided lately (its shops burned; none take up arms), or null
  static closed(t){
    return Timed.of(t).has('sacked')?'sacked':Timed.of(t).has('raided')?'raided':null;
  }
}
// a verb that opened another window (or left the holding): the town window is not drawn again
Place.AWAY=Object.freeze({away:true});
function definePlace(id,spec){
  const p=typeof spec==='function'?new spec(id):new Place(id,spec);
  PLACES[id]=p;
  return p;
}
// the place whose verb an action is (none: the window's own, or nobody's)
// (the place a verb is for: the one you are in first (a verb every place has, as buying an upgrade: Place#act), else the one that has it)
const placeActing=a=>{const cur=G.town&&PLACES[G.town.tab];return cur&&cur.handles(a)?cur:Object.values(PLACES).find(p=>p.handles(a))||null};

/* the market square: a trading screen (ui/trade.js): your pack on the left, the merchants' stalls on the right, the bargain between,
   struck on Confirm; its goods by category (bought and sold one unit at a time, each moving the price; a holding's old arrows are
   none), empty waterskins at their base price (world/supply.js skinsBuy; no market stocks them), its quivers, and what you carry
   to sell, by category (what its category lets you sell: a quest item never). The old verbs (buy, sell, sell-own: at once) are
   kept for the console and the tests */
// (a market's goods, and your things, grouped: each category's rows under its name, in ITEM_CATS's order)
const byCategory=(list,catOf,row)=>Object.keys(ITEM_CATS).map(c=>{const xs=list.filter(x=>catOf(x)===c);return xs.length?'<div class="lab lab-cat">'+ITEM_CATS[c].n+'</div>'+xs.map(row).join(''):''}).join('');
class Market extends Place{
  constructor(id){
    super(id,{n:'Market square',short:'Market',ico:'stall',verbs:{buy:'buy',sell:'sell','sell-loot':'sellOwn','sell-item':'sellOwn','sell-own':'sellOwn','market-quiver':'buyQuiver','skin-buy':'buySkins',
      deal:'deal',undeal:'deal','deal-clear':'dealClear','deal-ok':'dealOk','deal-haggle':'dealHaggle'}});
  }
  // its page: the trading screen, your pack, the bargain and the merchants' stalls (ui/trade.js)
  body(t){
    return TradeScreen.html(t);
  }
  // (the bargain: a row moved in, the qty of it (deal), or back out (undeal); cleared; struck)
  deal(arg,t,a){
    const s=String(arg),i=s.indexOf(':'),kind=s.slice(0,i),key=s.slice(i+1),D=TradeDeal.of(),n=G.town.qty||1;
    if(a==='deal')D.add(t,kind,key,n);else D.sub(kind,key,n);
  }
  dealClear(){TradeDeal.clear()}
  dealOk(arg,t){const line=TradeDeal.of().confirm(t);if(line)toast(line,'gold')}
  dealHaggle(arg,t){const line=TradeDeal.of().haggle(t);if(line)toast(line,G.town.haggle==='won'?'good':'bad')}
  // goods (g:n): bought, your standing up a little; sold, Trading learned and your standing up
  buy(arg,t){
    const [g,nStr]=arg.split(':');let n=+nStr;
    const r=buyGoods(t,g,n);if(r.got)addRep(t.name,r.spent/60,true);
  }
  sell(arg,t){
    const [g,nStr]=arg.split(':');let n=+nStr;
    const r=sellGoods(t,g,n);train('trade',r.earned/20);addRep(t.name,r.earned/60,true);
  }
  // a thing from your bag (sell-own; sell-loot and sell-item, as trophies and gear were sold): its kind's Sell, where its category
  // allows it (core/items.js)
  sellOwn(arg,t,a){
    const x=P.inv[+arg],v=x&&itemKind(x).verb('sell');if(v&&v.shown(+arg))v.perform(+arg);
  }
  buyQuiver(arg,t){quiverBuy(arg,t,this.id)}
  // empty waterskins (n), at their base price
  buySkins(arg){skinsBuy(+arg)}
}
definePlace('trade',Market);

/* the tavern: the innkeeper (lodgings), the ransom broker, the companions waiting for work, Ander The Fallen where he wanders
   (story/wounded.js Wanderer: his own card, never the hiring list); the rumours, the information the innkeeper sells (once a
   day: world/worldlog.js intelBuy) and the talk of the realm */
class Tavern extends Place{
  constructor(id){
    super(id,{n:'Tavern',ico:'mug',verbs:{'ransom-pick':'ransomPick',ransom:'ransom','hire-comp':'hireComp','ander-job':'anderJob','ander-pay':'anderPay','intel-pick':'pickIntel','intel-buy':'buyIntel'}});
  }
  body(t){
    const f=FACS[t.owner],here=P.stay&&P.stay.town===t.name,why=stayWhy(t),race=t.races[0];
    // the people in it: the innkeeper (lodgings), the ransom broker, the companions waiting for work
    return railCards([{pic:personPic('innkeeper',race),name:'The innkeeper',role:'Lodgings',facts:[here?['Your band is staying here','good']:stayFree(t)?['Free: they know you here','good']:stayCost()+'g a day'],
        note:here?'Your band is staying here: '+(stayFree(t)?'free, as long as you like':stayCost()+'g a day, your gold lasts until Day '+stayUntil())+'.':'Stay and let the days pass: you recover four times as fast, morale rises, the wounded heal twice as fast. '+(why||(stayFree(t)?'':'5g, and 1g for every 2 of your people.'))+' Food for the road: the market.',
        acts:[here?['sy-leave',null,'Leave']:['sy-stay',t.name,'Stay',why]]},
      tapsterCard(t,race),// (drink for the road: world/supply.js)
      t.T.broker&&{pic:personPic('merchant',race,1),name:'The ransom broker',role:'Buys prisoners you bring in',facts:[prisonerCount()?prisonerCount()+' prisoners with you':'No prisoners with you',prisonerCount()?['Worth '+ransomValue()+'g','gold']:''],acts:[['ransom-pick',null,'Ransom',prisonerCount()?'':'No prisoners']]},
      Captivity.fenceCard(t,race),// (your gear from a captor's stash: world/captivity.js)
      ...Death.cards(t),// (your companions lost after the beasts, waiting or gone from your service: world/death.js)
      ...Claims.cards(t),// (what of your line's a companion keeps, or a lord's steward sells, or hangs as a trophy: world/claims.js)
      ...Questbook.offers('tavern',Stories.ctx({town:t.name})).map(id=>Questbook.card(id,t)),// (the questbook's: story/questbook.js)
      ...compsHere(t).map(id=>{const c=COMPS[id],quote=recruitment.quoteCompanion(t,id);return {pic:portrait(id),name:c.n,role:'Companion, looking for work',note:c.d,acts:[['hire-comp',id,'Hire '+c.cost+'g',quote.ok?'':recruitmentWhy(quote)||'Not available']]}}),
      Wanderer.card(t)].filter(Boolean))+
      // (the rumours: real news near here, two new a day (news.js), heard as you come in and kept while you stay: G.town.news;
      // then the standing talk of the realm: its wars, the camps, the most wanted, a mythic beast abroad)
      '<div class="lab">Rumours</div>'+rumourHtml(G.town.news||(G.town.news=rumourFrom(rumourSource('tavern',t.name,t,{from:'the tavern of '+t.name}))))+intelHtml(t)+
      '<div class="lab">Talk of the realm</div><p class="muted">'+(!f?'No realm rules '+t.name+': its free folk keep their own counsel.':enemiesOf(t.owner).length?'The '+f.n+' is at war with the '+enemiesOf(t.owner).map(g=>FACS[g].n).join(' and the ')+'.':'The '+f.n+' is at peace.')+'</p>'+'<p class="muted">Bandit camps sit near '+[...new Set(camps().filter(c=>!c.cleared).map(c=>Spatial.nearestHolding(c.x,c.y).name))].join(', ')+'.'+(mostWanted(1).map(w=>' The most wanted is '+chiefLabel(w.c)+(w.near?', last seen near '+w.near.name:'')+': '+bountyOf(w.c)+' gold on '+pr(w.c).his+' head.').join(''))+(mythicNews('was seen')?' '+mythicNews('was seen'):'')+'</p>';
  }
  // the ransom broker: which prisoners, in a picker first (window.js); then all of them, or kind:n,… from it
  ransomPick(arg,t){
    railPicker({title:'Ransom prisoners',sub:'The ransom broker of '+t.name,total:'The broker pays',unit:'g',confirm:['ransom','Ransom'],back:['tab','tavern','Back'],
      items:Object.keys(P.prisoners).filter(k=>P.prisoners[k]>0).map(k=>({id:k,name:ST[k].n,sub:'Tier '+ST[k].tier+', '+RANSOM[ST[k].tier]+'g each',pic:portrait(k),max:P.prisoners[k],unit:RANSOM[ST[k].tier]}))});
    return Place.AWAY;
  }
  ransom(arg,t){
    const pick=arg?Object.fromEntries(String(arg).split(',').map(x=>x.split(':')).filter(([k,n])=>ST[k]&&P.prisoners[k]>0).map(([k,n])=>[k,Math.min(P.prisoners[k],Math.max(0,Math.floor(+n)||0))])):{...P.prisoners},n=Object.values(pick).reduce((a,b)=>a+b,0),v=Object.keys(pick).reduce((a,k)=>a+pick[k]*RANSOM[ST[k].tier],0);
    if(n){P.gold+=v;log('The broker pays '+v+' gold for '+n+' prisoners.','gold');for(const k in pick){P.prisoners[k]-=pick[k];if(P.prisoners[k]<=0)delete P.prisoners[k]}mood('ransom')}
  }
  hireComp(arg,t){
    recruitmentFeedback(recruitment.hireCompanion(t,arg),t);
  }
  // Buy information: what the innkeeper knows, chosen in a picker (up to INTEL.n), once a day; refused, the picker again with why
  pickIntel(arg,t){
    intelPicker(t);
    return Place.AWAY;
  }
  buyIntel(arg,t){
    const keys=String(arg||'').split(',').map(x=>x.slice(0,x.lastIndexOf(':'))).filter(Boolean),why=intelBuy(t,keys);
    if(why){intelPicker(t,why+'.',Object.fromEntries(keys.map(k=>[k,1])));return Place.AWAY}
  }
  // Ander: finish the job, or pay his price
  anderJob(arg,t){
    Wanderer.job(t);
  }
  anderPay(arg,t){
    Wanderer.pay(t);
  }
}
definePlace('tavern',Tavern);

/* the smithy: its forge's pieces for sale (its week's stock), and its quivers */
// a building's upgrades for your units (world/buffs.js Buffs; the owner, 2026-10-31: the tech tree, bought at a holding's smith and the
// like): each it offers, a button for each of your groups it fits (its price for the whole group, or a mark when they have it)
function buffShop(t,place){const ids=Buffs.offer(t,place),L='<div class="lab">Upgrades for your units</div>';if(!ids.length)return L+'<p class="muted">Nothing to offer yet.</p>';
  const gs=['hero',...Object.keys(P.comps).map(c=>'comp_'+c),...partyRoster(P).groups.map(g=>g.id)];
  return L+ids.map(b=>{const B=BUFFS[b],mine=gs.filter(id=>Buffs.fits(B,Buffs.kindOf(id),Buffs.statsOf(id)));
    return railRow(htmlText(B.n),(B.d?htmlText(B.d)+', ':'')+Buffs.text(B)+', '+(B.cost||0)+'g a man',mine.map(id=>railBtn('buff-buy',id+'|'+b,htmlText(armyGroupLabel(id))+(Buffs.has(id,b)?' ✓':', '+Buffs.price(id,b)+'g'),Buffs.why(t,place,id,b))).join('')||'<small class="muted">None of yours</small>')}).join('')}
// (one bought: its group, the upgrade, a line of it)
function buffBuy(arg,t,place){const [id,b]=String(arg).split('|');if(Buffs.buy(t,place,id,b))log(armyGroupLabel(id)+': '+BUFFS[b].n+' at '+t.name+'.','gold')}
class Smithy extends Place{
  constructor(id){
    super(id,{n:'Smithy',ico:'anvil',verbs:{'buy-gear':'buyGear','buy-quiver':'buyQuiver','buff-buy':'buyBuff'}});
  }
  shut(t){
    const closed=Place.closed(t);
    return closed?'<p class="muted">The smithy was burned when '+t.name+' was '+closed+'. It reopens in '+(t[closed]-G.day)+' days.</p>':'';
  }
  // its stock (W.shops by the holding's name): forged again once a week, from the metals in stock (forgeTiers)
  stock(t){
    W.shops=W.shops||{};const sh=W.shops[t.name];
    if(!sh||Clock.daysSince(sh.day)>=7){const items=[],bases=Object.keys(BASES);
      for(let i=0;i<6;i++){const ok=forgeTiers(t);if(!ok.length)break;const w=ok.map(k=>k?1+k*.25:.6);let x=Math.random()*w.reduce((a,b)=>a+b,0),tier=ok[0];for(let j=0;j<ok.length;j++){x-=w[j];if(x<0){tier=ok[j];break}}
        for(const g in FORGE[tier])t.stock[g]-=FORGE[tier][g];items.push(gearId(bases[rint(0,bases.length-1)],tier))}
      W.shops[t.name]={day:G.day,items}}
    return W.shops[t.name].items;
  }
  body(t){
    const st=this.stock(t);
    return railCards([{pic:personPic('smith',t.races[0]),name:'The smith',role:'At the forge of '+t.name,facts:[st.length?st.length+' pieces for sale':'Sold out','New stock in '+(7-Clock.daysSince(W.shops[t.name].day)%7)+' days'],
      note:forgeText(t)+' Bring copper and tin, silver, gold, mithril or adamantite to its market and the smith will forge with them.'}])+'<div class="lab">For sale</div>'+(st.length?st.map((id,i)=>{const I=ITEMS[id],p=gearPrice(id);
      return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+I.n+'</strong><small>'+SLOTS[I.slot]+', '+I.d+'</small><small class="diff">'+(gearDiff(id).join(', ')||'<span class="muted">No change from what you wear.</span>')+'</small></div><div class="acts">'+railBtn('buy-gear',i,'Buy',P.gold<p?'Not enough gold':playerInventory.room('gear',id)<1?BAG_FULL:'')+'</div><span class="own gold">'+p+'g</span></div>'}).join('')
      :'<p class="muted">Sold out until the next delivery.</p>')+quiverRows(t,'smith','buy-quiver');
  }
  buyBuff(arg,t){buffBuy(arg,t,this.id)}
  // a piece (its place in the stock): yours, your standing up a little
  buyGear(arg,t){
    const st=this.stock(t),id=st[+arg];if(id&&P.gold>=gearPrice(id)&&invAdd('gear',id,1)){P.gold-=gearPrice(id);st.splice(+arg,1);addRep(t.name,ITEMS[id].v/120,true);log('You buy the '+ITEMS[id].n+'.','gold')}
  }
  // a quiver (its id): yours, your standing up a little
  buyQuiver(arg,t){quiverBuy(arg,t,this.id)}
}
definePlace('smith',Smithy);

/* the stable: its mounts (core/items.js Mount: what it sells, who may buy the rare ones), and horses for your riders */
// (a mounted unit's horses for its men without one (lost in battle, or new men come without: battle/dismount.js, core/army.js
// horsesShort): your spare ones first, the rest at this stable's price (core/recruitment.js horsesFor); not sold here, yours alone)
function horseQuote(t,g){const n=horsesShort(g);if(!n)return null;const q=horsesFor(t,null,g.type,n);return q.why&&q.own?horsesFor(t,null,g.type,q.own):q}
function horseRows(t){const gs=partyRoster(P).groups.filter(g=>horsesShort(g)>0);if(!gs.length)return '';
  return '<div class="lab">Horses for your riders</div>'+gs.map(g=>{const n=horsesShort(g),q=horseQuote(t,g),I=ITEMS[q.id];
    return railRow(htmlText(armyGroupLabel(g.id)),n+' of its men without a horse, '+I.n+(q.own?', '+q.own+' of yours':'')+(q.buy?', '+q.buy+' at '+gearPrice(q.id)+'g':''),
      railBtn('buy-horses',g.id,'Horse '+q.n+(q.cost?', '+q.cost+'g':''),q.why||(P.gold<q.cost?'Not enough gold':'')))}).join('')}
class Stable extends Place{
  constructor(id){
    super(id,{n:'Stable',ico:'shoe',verbs:{'buy-mount':'buyMount','buff-buy':'buyBuff','buy-horses':'buyHorses'}});
  }
  shut(t){
    const closed=Place.closed(t);
    return closed?'<p class="muted">The stable was burned when '+t.name+' was '+closed+'. It reopens in '+(t[closed]-G.day)+' days.</p>':'';
  }
  body(t){
    const cur=mountDef();
    return railCards([{pic:personPic('groom',t.races[0]),name:'The stablemaster',role:'Mounts for sale',facts:[stableStock(t).length+' mounts',cur?'You ride a '+cur.n:'You travel on foot'],
      note:'A mount goes in its own slot and speeds your travel. Rare beasts need standing '+REP_NEED[2]+' here (yours: '+standingAt(t)+').'}])+'<div class="lab">In the stalls</div>'+
      stableStock(t).map(id=>{const I=ITEMS[id],p=gearPrice(id),ok=canBuyMount(t,id),own=P.gear.mount===id;
        return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+I.n+'</strong><small>'+I.d+'</small><small class="diff">'+(gearDiff(id).join(', ')||'<span class="muted">No change from your mount.</span>')+'</small></div><div class="acts">'+(ok?'':'<small class="bad">Needs standing '+REP_NEED[2]+'</small>')+
          railBtn('buy-mount',id,own?'Riding':'Buy',own?'You ride it':!ok?'Needs standing '+REP_NEED[2]:P.gold<p?'Not enough gold':P.gear.mount&&!invFree()?'Your bag is full':'')+'</div><span class="own gold">'+p+'g</span></div>'}).join('')+horseRows(t);
  }
  buyBuff(arg,t){buffBuy(arg,t,this.id)}
  // a unit's riders horsed again: your spare horses taken from your bag, the rest paid for
  buyHorses(arg,t){const r=partyRoster(P),g=r.groups.find(x=>x.id===arg),q=g&&horseQuote(t,g);if(!q||q.why||P.gold<q.cost)return;
    if(q.own)playerInventory.take('gear',q.id,q.own);P.gold-=q.cost;g.horses+=q.n;if(g.horses>=g.count+r.wounded(g.id))delete g.horses;
    log(armyGroupLabel(g.id)+': '+q.n+' '+ITEMS[q.id].n+(q.n>1?'s':'')+(q.cost?' for '+q.cost+'g':'')+' at '+t.name+'.','gold')}
  // ridden out at once with no mount of your own; else into your bag
  buyMount(arg,t){
    const id=arg,p=gearPrice(id);if(stableStock(t).includes(id)&&canBuyMount(t,id)&&P.gold>=p&&P.gear.mount!==id){
      if(!P.gear.mount){P.gear.mount=id;P.gold-=p;fitInv();toast('You buy a '+ITEMS[id].n+' and ride it out of the stable.','gold')}
      else if(invAdd('gear',id,1)){P.gold-=p;toast('You buy a '+ITEMS[id].n+'. Swap mounts in your inventory.','gold')}}
  }
}
definePlace('stable',Stable);

/* the barracks (the owner, 2026-10-28: casual recruiting): two tabs. Hire: the hiring desk (ui/hiredesk.js HireDesk, its acts
   rec-*): a row for each troop they raise, the standing each needs, those willing; Train: a row for each training, all that are
   ready in one press, or a whole group at once. The order (G.town.cart) belongs to this visit, never to a save */
// trainers' rows (a holding's, or yours): each his level, roles, the rank he trains to and what a lesson gives, his lessons left this
// week; a button for each of your groups of his roles (its badge, its price, or why not)
function trainerRows(trs){const gs=partyRoster(P).groups,where=tr=>tr.wander?', passing through, till Day '+tr.until:'';return '<div class="rec-rows">'+trs.map(tr=>{const mine=gs.filter(g=>tr.roles.includes(trainRole(g.type)));
  return '<div class="rec-row trainer"><div class="rec-txt"><strong>'+htmlText(tr.name)+'</strong><small>'+trainLevelN(tr)+', '+trainRolesN(tr)+', to rank '+TRAINERS.cap[tr.level-1]+', +'+TRAINERS.xp[tr.level-1]+' a lesson, '+trainLeft(tr)+' of '+TRAINERS.week+' left this week'+where(tr)+'</small></div>'+
    '<div class="rec-step">'+(mine.length?mine.map(g=>{const why=lessonWhy(tr,g),p=lessonPrice(tr,g);return '<button class="btn sm" type="button" data-act="trn-lesson" data-arg="'+htmlText(tr.id+'|'+g.id)+'"'+(why?' disabled title="'+htmlText(why)+'"':'')+'>'+groupBadge(g,12)+' Train '+htmlText(armyGroupLabel(g.id))+(p?', '+p+'g':'')+'</button>'}).join(''):'<small class="muted">None of your groups</small>')+'</div></div>'}).join('')+'</div>'}
class Barracks extends Place{
  constructor(id){
    super(id,{n:'Barracks',ico:'shield',verbs:{'rec-tab':'tab',hire:'hire','rec-upgroup':'upgroup',
      ...Object.fromEntries(['pick','unit','refill','refillall','ok','no','info','info-back'].map(v=>['rec-'+v,'desk']))}});
  }
  shut(t){
    const closed=Place.closed(t);
    return closed||Timed.of(t).has('turmoil')?'<p class="muted">'+(closed?'No one here will take up arms: '+t.name+' was '+closed+' and is still burying its dead.':t.name+' is in turmoil after changing hands. No one will enlist for '+Timed.of(t).daysLeft('turmoil')+' more days.')+'</p>':'';
  }
  hires(t){return t.races.flatMap(r=>t.hires(r))}
  // (its desk: the town's troops, their price, its willing, the standing each needs)
  deskOf(t){return new HireDesk('rec-',{state:G.town,kinds:this.hires(t),cost:hireCost,willing:Math.floor(t.vol||0),why:k=>!canHire(t,k)?'Needs standing '+needFor(k):'',
    line:k=>'You lead ×'+(P.troops[k]||0),note:'More volunteers come forward each day as the '+t.label+' grows and prospers.',extra:this.volunteers(t),
    hire:(k,n,tgt)=>{const r=recruitment.hire(t,k,n,tgt);if(r.ok)recruitmentFeedback(r,t);return {ok:r.ok,cost:r.cost,why:r.ok?'':recruitmentWhy(r)}}})}
  body(t){
    const s=G.town,tab=t.T.train&&s.recTab==='train'?'train':'hire',v=Math.floor(t.vol||0);
    const tabs=t.T.train?'<div class="rec-tabs" role="tablist">'+[['hire','Hire'],['train','Train & upgrade']].map(([k,n])=>'<button class="btn sm'+(k===tab?' on':'')+'" type="button" role="tab" aria-selected="'+(k===tab)+'" data-act="rec-tab" data-arg="'+k+'">'+n+'</button>').join('')+'</div>':'';
    const head='<div class="top rec-top">'+tabs+'<span class="lab">'+t.races.map(r=>RACES[r].n).join(' and ')+' troops, '+unitsLine()+'</span><span class="lab">Standing <b class="gold" style="font-size:14px">'+standingAt(t)+'</b>, '+v+' willing</span></div>';
    return head+(tab==='train'&&!s.info?this.trainTab(t):this.deskOf(t).body());
  }
  // (its free volunteers, world/volunteers.js: taking them while you stay here or camp on its lands, or why they will not come)
  volunteers(t){const R=P.recruit,on=R&&R.town===t.name,here=volunteerTown()===t,why=here?volunteerWhy(t):'Stay here, or camp on its lands, to take them';
    return '<div class="rec-row vol-row"><div class="rec-txt"><strong>'+icon('recruit',14)+' Free volunteers</strong><small>'+(on?'Joining your groups: '+R.n+' so far, about '+volunteerRate(t).toFixed(1)+' an hour':why?htmlText(why):'Its people would refill your tier-1 groups for free, about '+volunteerRate(t).toFixed(1)+' an hour')+'</small></div>'+
      '<div class="rec-step">'+(on?'<button class="btn sm" type="button" data-act="uw-vstop">Stop</button>':'<button class="btn sm primary" type="button" data-act="uw-vgo"'+(why?' disabled title="'+htmlText(why)+'"':'')+'>Take volunteers</button>')+'</div></div>'}
  desk(arg,t,a){this.deskOf(t).act(a,arg)}
  tab(arg){G.town.recTab=arg==='train'?'train':'hire';G.town.info=null}
  hire(arg,t){const result=recruitment.hire(t,arg,1);recruitmentFeedback(result,t)}
  // ---- Train (doc/RANKS_DESIGN.md §3: its trainers, world/trainers.js) and upgrade (§4): each of your groups that upgrades a row (its badge, its rank), a button for each kind
  // it upgrades into: at its last rank, here for its price (core/recruitment.js quoteGroupTraining), keeping its place; into a smaller
  // unit, one full unit of it ("Train 6 of 15 into Lancers"), the rest staying, a free unit slot needed
  trainTab(t){const trs=trainersAt(t);trs.forEach(trainerMeet);const lessons=trs.length?'<div class="lab">Trainers here</div>'+trainerRows(trs):'<p class="muted">No trainer here.</p>',gs=partyRoster(P).groups.filter(g=>UP[g.type]);
    if(!gs.length)return lessons+'<p class="muted">None of your groups upgrades further.</p>';
    return lessons+'<div class="lab">Upgrades</div><div class="rec-rows">'+gs.map(g=>{const L=rankLine(g);
      const key=g.type+'>'+UP[g.type][0];// (its card: the first it upgrades into, against it)
      return '<div class="rec-row" data-act="rec-pick" data-arg="'+key+'"><button class="rec-pic" type="button" data-act="rec-info" data-arg="'+key+'"><img src="'+portrait(UP[g.type][0])+'" alt=""><span class="rec-badge" aria-hidden="true">i</span></button>'+
        '<div class="rec-txt"><strong>'+groupBadge(g,14)+' '+htmlText(armyGroupLabel(g.id))+' ×'+g.count+'</strong><small>'+(rankReady(g)?'<b class="gold">'+L.txt+'</b>':L.txt)+'</small></div>'+
        '<div class="rec-step">'+(rankReady(g)?UP[g.type].map(to=>{const q=recruitment.quoteGroupTraining(t,g.id,to);
          if(q.code==='slot')return '<button class="btn sm" type="button" disabled title="'+htmlText(recruitmentWhy(q))+'">No free unit slot</button>';// (a split: room for its new unit first)
          return '<button class="btn sm'+(q.ok?' primary':'')+'" type="button" data-act="rec-upgroup" data-arg="'+g.id+':'+to+'"'+(q.ok?'':' disabled title="'+htmlText(q.code==='experience'?(rankPeasant(g.type)?'Its experience is not full yet':'Needs rank '+RANKS.max+': fight with them'):recruitmentWhy(q)||'Not available')+'"')+'>'+htmlText(q.split?'Train '+q.count+' of '+g.count+' into '+troopsWord(ST[to].n):ST[to].n)+(q.cost?', '+q.cost+'g':'')+(q.horses?', '+q.horses.n+' '+htmlText(ITEMS[q.horses.id].n.toLowerCase())+(q.horses.n>1?'s':'')+(q.horses.own?' ('+q.horses.own+' yours)':''):'')+'</button>'}).join(''):'<small class="muted">'+(rankPeasant(g.type)?'When its experience is full':'At rank '+RANKS.max)+': '+UP[g.type].map(to=>htmlText(ST[to].n)).join(', ')+'</small>')+'</div></div>'}).join('')+'</div>'}
  upgroup(arg,t){const [id,to]=String(arg).split(':'),r=recruitment.trainGroup(t,id,to);recruitmentFeedback(r,t)}
  // (back from a unit's card: the list where you left it)
  focus(a){return this.deskOf(G.town.ref).focus(a)}
}
definePlace('recruit',Barracks);

/* the lord's hall: who holds it, the lords holding court here (a card each: Talk), and the realm's mercenary contract (its two
   verbs are Choices: greyed, and done, by the same need) */
class Hall extends Place{
  constructor(id){
    super(id,{n:'Lord’s hall',short:'Hall',ico:'crown',verbs:{'hall-talk':'talk',contract:'sign','end-contract':'end'}});
    this.signing=new Choice({label:'Sign',need:t=>P.fac?'You serve a realm already':'',run:t=>{P.fac=t.owner;Timed.of(P,'hostile').clear(t.owner);log('You sign on with the '+FACS[t.owner].n+'. Their enemies are now yours.','gold')}});
    this.ending=new Choice({label:'End contract',need:t=>P.fac===t.owner?'':'You do not serve them',run:t=>{P.fac=null;log('You end your contract with the '+FACS[t.owner].n+'.')}});
  }
  // towns and castles have one; a village only while a lord is inside
  at(t){
    return !!t.owner&&(t.kind!=='village'||lordsInside(t).length>0);
  }
  body(t){
    const f=FACS[t.owner],ls=lordsInside(t),sw=g=>'<span style="color:'+FACS[g].col+'">'+FACS[g].n+'</span>',b=c=>railBtn(c===this.signing?'contract':'end-contract',null,c.label,c.why(t));
    return '<div class="lab">Held by</div><p>'+(t.owner==='player'?'You hold '+t.name+'. Its reeve keeps the ledgers in the Steward’s office.':f?'The '+sw(t.owner)+'. Your honor with them: '+honorWith(t.owner)+'. '+(enemiesOf(t.owner).length?'At war with the '+enemiesOf(t.owner).map(sw).join(' and the ')+'.':'At peace.'):'No realm.')+'</p>'+
      '<div class="lab">Lords holding court</div>'+(ls.length?railCards(ls.map(l=>({fac:l.fac,name:lordName(l),role:cap1(lordWord(l))+' of the '+sw(l.fac),facts:[l.troops.length+' soldiers quartered here','Toward you: '+relTag(relWith(l))],
        acts:[['hall-talk',l.id,'Talk',hostileTo(l.fac)&&!lordSpares(l)?'Your realms are at odds':'']]}))):'<p class="muted">None today.</p>')+
      (!t.T.contract||t.owner==='player'?'':'<div class="lab">Service</div>'+(P.fac===t.owner?railRow('Your contract','The '+f.n+' pays you '+Math.round(BAND_PAY.merc*100)+'% of your soldiers’ wages each day: '+mercPay()+'g now.',b(this.ending))
        :P.fac?'<p class="muted">You serve the '+sw(P.fac)+'.</p>':railRow('Mercenary contract','Serve the '+f.n+' for 1 gold per troop each day. Their enemies become yours.',b(this.signing))));
  }
  // a lord holding court: his own talk, Leave back here (input.js)
  talk(arg,t){
    const l=lordsInside(t).find(l=>!l.gone&&String(l.id)===String(arg));
    if(G.mode==='town'&&G.town&&G.town.ref===t&&l&&(!hostileTo(l.fac)||lordSpares(l)))lordMeet(l);
    return Place.AWAY;
  }
  sign(arg,t){
    if(!this.signing.why(t))this.signing.perform(t);
  }
  end(arg,t){
    if(!this.ending.why(t))this.ending.perform(t);
  }
}
definePlace('hall',Hall);
const hallBody=t=>PLACES.hall.body(t);

/* the notice board: your quests to report here (its dot on the rail), and the work it offers (quests.js jobsBody; its q-
   actions: questAct). A plain entry, as a new place can be */
definePlace('jobs',{n:'Notice board',short:'Notices',ico:'scroll',dot:t=>questHere(t),body:t=>jobsBody(t)});

/* the lists: one bout against the town champion (its Enter a Choice: greyed, and done, while you have the fee) */
class Lists extends Place{
  constructor(id){
    super(id,{n:'The lists',short:'Lists',ico:'renown',verbs:{tourney:'enter'}});
    this.entry=new Choice({label:'Enter 10g',need:t=>P.gold<10?'Not enough gold':'',run:t=>{P.gold-=10;updateHUD(true);startBattle({enemies:['chief'],tournament:true})}});
  }
  at(t){
    return !!t.T.tourney;
  }
  body(t){
    return '<p>One-on-one against the town champion, before the crowd.</p>'+railCards([{pic:portrait('chief'),name:'The town champion',role:'Waiting in the lists',facts:[['Win 45 gold and renown','gold'],'Entry 10 gold, you have '+P.gold],
      acts:[['tourney',null,this.entry.label,this.entry.why(t)]]}]);
  }
  enter(arg,t){
    if(this.entry.why(t))return;
    this.entry.perform(t);
    return Place.AWAY;
  }
}
definePlace('tourney',Lists);
const tourneyBody=t=>PLACES.tourney.body(t);

/* the storehouse: a castle's stores. It has no market, but it keeps a stockpile of what its land and the caravans bring (what you
   carry off if you sack it). In a castle of yours you keep goods there: put them in from your bags or take them out, free (its
   st- actions: its own prefix, onAct) */
class Storehouse extends Place{
  constructor(id){
    super(id,{n:'Storehouse',short:'Stores',ico:'crate'});
  }
  body(t){
    ensureEcon(t);const own=t.owner==='player',cap=Math.round(storeCap(t)),gs=Object.keys(GOODS).filter(g=>(t.stock[g]||0)>=1||own&&goodN(g)>0);
    const b=(act,g,n,label,no)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+g+':'+n+'"'+(no?' disabled':'')+'>'+label+'</button>';
    return '<div class="lab">Stores, '+gs.filter(g=>(t.stock[g]||0)>=1).length+' goods, room for '+cap+' of each</div><p class="muted" style="font-size:13px">'+(own?'Your '+t.T.n+'’s stockpile. Put goods in for safe keeping or take out what you need. Nothing is bought or sold here.':
      'The '+t.T.n+'’s stockpile. A '+t.T.n+' has no market: nothing here is for sale. Take '+t.name+', and its stores are yours to keep or plunder.')+'</p>'+
      (gs.length?gs.map(g=>{const st=Math.floor(t.stock[g]||0),n=goodN(g);return '<div class="row"><div class="info"><strong>'+GOODS[g].n+'</strong><small>'+st+' in store'+(own?', you carry '+n:'')+'</small></div>'+
        (own?'<div class="acts">'+b('st-put',g,5,'Store 5',n<1||st>=cap)+b('st-put',g,'all','Store all',n<1||st>=cap)+b('st-take',g,5,'Take 5',st<1||goodRoom(g)<1)+b('st-take',g,'all','Take all',st<1||goodRoom(g)<1)+'</div>':'')+'</div>'}).join('')
        :'<p class="muted">The stores are empty.</p>');
  }
  // put in (st-put) or take out (st-take) g:n (n: 5 or all), in your own castle
  store(a,arg){
    const t=G.town&&G.town.ref;if(!t||t.owner!=='player')return;ensureEcon(t);const [g,ns]=String(arg).split(':');if(!GOODS[g])return;const st=Math.floor(t.stock[g]||0);
    if(a==='st-put'){const n=Math.min(ns==='all'?Infinity:+ns,goodN(g),Math.max(0,Math.round(storeCap(t))-st));const k=n>0?goodTake(g,n):0;t.stock[g]=(t.stock[g]||0)+k;if(k)toast('You store '+k+' '+GOODS[g].n.toLowerCase()+' in '+t.name+'.')}
    if(a==='st-take'){const n=Math.min(ns==='all'?Infinity:+ns,st,goodRoom(g));const k=n>0?keptIn(g,n,n):0;t.stock[g]-=k;if(k)toast('You take '+k+' '+GOODS[g].n.toLowerCase()+' from the stores of '+t.name+'.')}
    updateHUD(true);renderTown();
  }
}
definePlace('stores',Storehouse);
const storesBody=t=>PLACES.stores.body(t);
const storesAct=(a,arg)=>PLACES.stores.store(a,arg);
onAct('st-',storesAct);

/* the walls and garrison, at every holding: everyone who would defend it, how well, and for how long; in your own fief its
   soldiers (siege.js garrisonBody; their fief- orders are the steward's). A plain entry */
definePlace('garrison',{n:'Walls & garrison',short:'Walls',ico:'tower',at:t=>t.T.wallMax>0,body:t=>garrisonBody(t)});
/* the prison, at every holding (world/prisons.js Prisons, doc/PRISONS_DESIGN.md §5): who is held there, and what you can do for
   them (its verbs pz-); yours or your realm's, your own prisoners and the captives you lock up. A plain entry */
definePlace('prison',{n:'Prison',ico:'prisoners',at:t=>!!t.owner,dot:t=>Prisons.dot(t),body:t=>Prisons.body(t),handles:a=>a.startsWith('pz-'),act:(a,arg,t)=>Prisons.act(a,arg,t)});

/* the steward's office, in your own fief: its people, taxes, stores, land and income (siege.js fiefBody), or one of its
   buildings (G.town.bld: townui.js bldBody). Every fief- order (the garrison's, the buildings', the economy's) is its own
   (siege.js fiefAct). Not yours: the overview */
class Steward extends Place{
  constructor(id){
    super(id,{n:'Steward’s office',short:'Steward',ico:'banner'});
  }
  at(t){
    return t.owner==='player';
  }
  opens(t){
    return t.owner==='player';
  }
  body(t){
    return G.town.bld?bldBody(t,G.town.bld):fiefBody(t);
  }
  handles(a){
    return a.startsWith('fief-');
  }
  act(a,arg,t){
    fiefAct(a,arg,t);
  }
}
definePlace('fief',Steward);

/* the siege camp: attacking the whole holding, its defenders against you, and the way out to plan it. Any holding not yours nor
   your employer's; not on the rail: on its overview (townui.js townOverview) */
class SiegeCamp extends Place{
  constructor(id){
    super(id,{n:'Siege camp',short:'Siege',ico:'ladder',rail:false,verbs:{'siege-ask':'ask','plan-siege':'plan'}});
  }
  at(t){
    return t.owner!=='player'&&P.fac!==t.owner;
  }
  body(t){
    const f=FACS[t.owner];const def=siegeDefenders(t),lv=siegeLv(t),ep=rating(def.list,lv),pp=partyPower(),r=ep/Math.max(1,pp);
    return '<div class="lab">Attack '+t.name+'</div><p>Garrison '+t.gar+(def.lords.length?', with '+def.lords.map(l=>lordName(l)).join(' and ')+' inside':'')+'. '+(!walled(t)?''+(wallOf(t)?WALL_N[wallOf(t)]+': its militia fights as level '+lv+'. ':'It has no walls. ')+'You can raid it or seize it.':WALL_N[wallOf(t)]+' make every defender as strong as level '+lv+'. You will need a siege camp: ladders take '+LADDER_DAYS+' days, a ram '+RAM_DAYS+'.')+'</p>'+
      '<p class="'+(foeAt(t)?'muted':'bad')+'">'+this.cost(t)+'</p>'+
      railKeyActions([{icon:'ladder',label:'Attack',act:'siege-ask',facts:[(r<.6?'Easy':r<1?'Even':r<1.5?'Risky':'Deadly')+', power '+ep+' vs '+pp,walled(t)?'a siege camp: ladders '+LADDER_DAYS+' days':'raid or seize it'],tip:'Leave the gates and plan an attack'}]);
  }
  // (what attacking costs: its realm's anger, or, a free folk's, honour with every realm (siege.js FREE_FOE))
  cost(t){
    const f=FACS[t.owner];
    if(foeAt(t))return cap1(holderN(t))+(f?' is':' are')+' already your enemy.';
    return f?'Attacking makes the '+f.n+' hostile to you for 60 days and costs 20 honor with them.':'The free folk of '+t.name+' are no one’s subjects: attacking them costs '+FREE_FOE.honor+' honor with every realm.';
  }
  // it cannot be undone: a confirm first (window.js railConfirm); Confirm plans it
  ask(arg,t){
    const def=siegeDefenders(t),ep=rating(def.list,siegeLv(t)),pp=partyPower(),f=FACS[t.owner];
    railConfirm({title:'Attack '+t.name+'?',sub:cap1(t.label)+(f?' of the '+f.n:' of the free folk'),text:foeAt(t)?this.cost(t):'<span class="bad">'+this.cost(t)+'</span>',
      facts:['Defenders’ power '+ep+' vs yours '+pp,'Garrison '+t.gar+(def.lords.length?', with '+def.lords.map(l=>lordName(l)).join(' and ')+' inside':''),walled(t)?'You will need a siege camp: ladders take '+LADDER_DAYS+' days.':'You can raid it or seize it.'],confirm:['plan-siege',null,'Plan the attack'],back:['tab','home','Back']});
    return Place.AWAY;
  }
  // out of the gates to the siege camp (siege.js)
  plan(arg,t){
    G.town=null;hidePanel();G.mode='world';openSiege(t);
    return Place.AWAY;
  }
}
definePlace('siege',SiegeCamp);
const siegeBody=t=>PLACES.siege.body(t);

/* the town window's own actions (no prefix): act() (input.js) hands them here with the town t, once no prefix, menu, encounter
   or hero action took them. A place's verb is its own (Place act: the barracks' recruits and training, the hall's talk and
   contract, the tavern's broker and companions, the smith, the stable and the market, the lists, the siege camp, the steward's
   fief- orders); the window's: qty (how many a Buy and Sell takes: ×1, ×5 or typed), tab (a place opened; home: the overview), bld (one of your
   holding's buildings, townui.js). The window redraws where it was scrolled (window.js showRail), the focus back on the button
   pressed */
const TOWN_WINDOW_ACTS={
  qty:arg=>{G.town.qty=Math.max(1,Math.min(QTY_MAX,Math.floor(+arg)||1))},
  tab:arg=>{G.town.tab=arg==='home'?null:arg;G.town.bld=null;G.town.direct=false;G.town.greet=null;G.town.news=null},
  bld:arg=>{G.town.tab='fief';G.town.bld=arg;G.town.direct=false;G.town.greet=null}
};
function townAct(a,arg,t){
  const keep=panel.scrollTop,p=placeActing(a);
  if(p){
    if(p.act(a,arg,t)===Place.AWAY)return;
  }
  else if(TOWN_WINDOW_ACTS[a])TOWN_WINDOW_ACTS[a](arg);
  if(!G.town)return;// (placing a new building: out on the map)
  updateHUD(true);renderTown();panel.scrollTop=keep;
  if(!(p&&p.focus(a,arg)))railFocus(a,arg);
}
// the town's window (townui.js showTown): the rail of its places, and the place open: G.town.tab (none: the overview; a key no
// place has: the tavern)
function townPlace(t,tab){
  if(!tab)return null;
  const p=PLACES[tab]||PLACES.tavern;if(outsideWalls(t)&&p.id!=='trade')return null;
  return p.opens(t)?p:null;
}
function renderTown(){
  // (drawn again from a conversation over it (a lord's audience in its hall): that conversation is over, the town's window yours again;
  // else its buttons go to the conversation still open (the owner, 2026-11-01: "the right panel ... no response"))
  if(G.mode==='dialog'){G.enc=null;G.mode='town'}
  const t=G.town.ref,p=townPlace(t,G.town.tab);
  KNOWLEDGE.watch();showTown(t,p?p.page(t):townOverview(t));G.town.greet=null;fillIcons();Finder.apply();// (items' pictures, where a page has them: the market's, ui/trade.js)
}
// (a quest to report here: straight to the Notices, Back to the overview; else the overview; the crier's proclamations that
// have reached it: news.js proclaimAt)
function enterTown(t){G.lastTown=t;P.tx=null;G.town={ref:t,tab:P.quests.some(q=>canReportAt(q,t)&&questReady(q))?'jobs':null};G.mode='town';log('You enter '+t.name+'.');proclaimAt(t);questArrive(t);renderTown()}
