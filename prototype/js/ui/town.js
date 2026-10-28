'use strict';
// Commands return outcomes; the screen decides how to describe them.
const RECRUIT_WHY={amount:'Enter a positive whole number with a valid total cost',target:'Choose an existing group of this unit type, or a new group','wounded-group':'Wait for this group’s wounded to return before upgrading it',groups:'Army slot or troop-group limit reached. Train Leadership, choose another group, or make room',gold:'Not enough gold for this order',capacity:'Not enough headcount capacity for this order',volunteers:'Not enough volunteers for this order',standing:'Not enough standing',closed:'No one will enlist while the holding recovers',unavailable:'This holding does not raise that troop',experience:'Needs more experience: fight with them',troops:'No soldiers of that kind',upgrade:'Not a valid troop upgrade','training-unavailable':'No training available here','companion-unavailable':'This companion is not available here','companion-hired':'Already in your band','invalid-unit':'Unknown recruit'};
const recruitmentWhy=r=>RECRUIT_WHY[r.code]||'';
function recruitmentFeedback(r,t){
  if(r.ok){
    if(r.code==='hire')log((r.count>1?r.count+' × '+ST[r.kind].n:cap1(an(ST[r.kind].n.toLowerCase())))+' join'+(r.count>1?'':'s')+' your band.');
    else if(r.code==='training')log(ST[r.from].n+' trained into '+ST[r.to].n.toLowerCase()+'.');
    else if(r.code==='group-training')log(r.id+': '+r.count+' × '+ST[r.from].n+' upgraded to '+ST[r.to].n+' for '+r.cost+'g.','good');
    else if(r.code==='companion')log(COMPS[r.id].n+' joins your band. Give them a role with C.','good');
    else if(r.code==='prisoner')log('A captured '+ST[r.kind].n.toLowerCase()+' swears to follow you.');
  }else if(r.code==='standing')toast('The people of '+t.name+' do not know you well enough yet.','bad');
  else if(r.code==='volunteers')toast('No one else in '+t.name+' will take up arms today.','bad');
  else if(r.code==='experience')toast(ST[r.from].n+' needs more experience first ('+Math.floor(txpOf(r.from))+' / '+(r.xpCost||txpNeed(r.from))+' XP): fight with them.','bad');
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
  return '<div class="lab" style="margin-top:6px">Quivers · your shots in every battle</div>'+ids.map(id=>{const I=ITEMS[id],p=gearPrice(id),own=P.gear.quiver===id;
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
  page(t){
    return this.shut(t)||this.body(t);
  }
  handles(a){
    return Object.prototype.hasOwnProperty.call(this.verbs,a);
  }
  // (each verb's method has (arg, t, a): a, for one method doing two verbs)
  act(a,arg,t){
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
const placeActing=a=>Object.values(PLACES).find(p=>p.handles(a))||null;

/* the market square: its goods by category (bought and sold one unit at a time, each moving the price; a holding's old arrows are
   none), empty waterskins at their base price among the Water (world/supply.js skinsBuy; no market stocks them), its quivers, and
   what you carry to sell, by category (what its category lets you sell: a quest item never) */
// (a market's goods, and your things, grouped: each category's rows under its name, in ITEM_CATS's order)
const byCategory=(list,catOf,row)=>Object.keys(ITEM_CATS).map(c=>{const xs=list.filter(x=>catOf(x)===c);return xs.length?'<div class="lab lab-cat">'+ITEM_CATS[c].n+'</div>'+xs.map(row).join(''):''}).join('');
class Market extends Place{
  constructor(id){
    super(id,{n:'Market square',short:'Market',ico:'stall',verbs:{buy:'buy',sell:'sell','sell-loot':'sellOwn','sell-item':'sellOwn','sell-own':'sellOwn','market-quiver':'buyQuiver','skin-buy':'buySkins'}});
  }
  body(t){
    const goodCat=k=>ITEM_KINDS.good.catId({id:k});
    ensureEcon(t);const q=G.town.qty||1,goods=[...Object.keys(GOODS).filter(k=>goodCat(k)&&((t.stock[k]||0)>0||goodN(k)>0||needOf(t,k)>.05)),SKIN.empty];
    const scarce=goods.filter(g=>marketState(t,g)==='shortage'),I=playerInventory;
    let body=railCards([{pic:personPic('merchant',t.races[0]),name:'The merchants',role:'Stalls of '+t.name,facts:[scarce.length>1?[scarce.length+' goods scarce','bad']:scarce.length?['Short of '+GOODS[scarce[0]].n.toLowerCase(),'bad']:'Prices fair','Your bag '+I.used+' / '+I.size+' slots',I.over?[I.over+' over: burdened','bad']:''],
      note:'Every unit you buy or sell moves the price.'}])+'<div class="lab lab-qty"><span>Goods</span>'+railQty(q,'qty')+'</div>'+byCategory(goods,goodCat,k=>{
      if(k===SKIN.empty){const p=GOODS[k].base;return railRow(GOODS[k].n,p+'g each · holds one person’s day of water, filled free at a well or the water’s edge',railBtn('skin-buy',q,'Buy',P.gold<p*q?'Not enough gold':goodRoom(k)<q?BAG_FULL:''),'×'+goodN(k))}
      const p=buyP(t,k),s=sellP(t,k),room=goodRoom(k),n=goodN(k),st=t.stock[k]||0,ms=marketState(t,k);
      return railRow(GOODS[k].n+(ms?' <span class="'+(ms==='shortage'?'bad':'good')+'" style="font-size:12px">'+cap1(ms)+'</span>':''),'Buy '+p+'g · Sell '+s+'g · '+st+' in the market · '+GOODS[k].stack+' per slot',
        railBtn('buy',k+':'+q,'Buy',P.gold<p*q?'Not enough gold':room<q?BAG_FULL:st<q?'The market has '+st:'')+railBtn('sell',k+':'+q,'Sell',n<q?'You have '+n:''),'×'+n)});
    body+=quiverRows(t,'trade','market-quiver');
    // (your things a market buys: not goods, sold above by the unit; a letter on its own page, world/letters.js)
    const own=P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k!=='good'&&(itemCat(x)||{}).sell);
    if(own.length)body+='<div class="lab" style="margin-top:6px">From your inventory</div>'+byCategory(own,([x])=>itemKind(x).catId(x),([x,i])=>{const K=itemKind(x),g=K.fetches(x,t),c=K.colour(x);
      return '<div class="row"><div class="info"><strong'+(c?' style="color:'+c+'"':'')+'>'+K.name(x)+'</strong><small>'+(x.k==='gear'?SLOTS[ITEMS[x.id].slot]+' · '+ITEMS[x.id].d:K.cat(x).n+' · '+K.price(x,t)+'g each')+'</small></div>'+(x.n>1?'<span class="own">×'+x.n+'</span>':'')+'<div class="acts">'+railBtn('sell-own',i,'Sell')+'</div><span class="own gold">'+g+'g</span></div>'});
    return body;
  }
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
      ...Questbook.offers('tavern',Questbook.ctx({town:t.name})).map(id=>Questbook.card(id,t)),// (the questbook's: story/questbook.js)
      ...compsHere(t).map(id=>{const c=COMPS[id],quote=recruitment.quoteCompanion(t,id);return {pic:portrait(id),name:c.n,role:'Companion, looking for work',note:c.d,acts:[['hire-comp',id,'Hire '+c.cost+'g',quote.ok?'':recruitmentWhy(quote)||'Not available']]}}),
      Wanderer.card(t)].filter(Boolean))+
      // (the rumours: real news near here, two new a day (news.js), heard as you come in and kept while you stay: G.town.news;
      // then the standing talk of the realm: its wars, the camps, the most wanted, a mythic beast abroad)
      '<div class="lab">Rumours</div>'+rumourHtml(G.town.news||(G.town.news=rumourFrom(rumourSource('tavern',t.name,t,{from:'the tavern of '+t.name}))))+intelHtml(t)+
      '<div class="lab">Talk of the realm</div><p class="muted">'+(enemiesOf(t.owner).length?'The '+f.n+' is at war with the '+enemiesOf(t.owner).map(g=>FACS[g].n).join(' and the ')+'.':'The '+f.n+' is at peace.')+'</p>'+'<p class="muted">Bandit camps sit near '+[...new Set(camps().filter(c=>!c.cleared).map(c=>Spatial.nearestHolding(c.x,c.y).name))].join(', ')+'.'+(mostWanted(1).map(w=>' The most wanted is '+chiefLabel(w.c)+(w.near?', last seen near '+w.near.name:'')+': '+bountyOf(w.c)+' gold on his head.').join(''))+(mythicNews('was seen')?' '+mythicNews('was seen'):'')+'</p>';
  }
  // the ransom broker: which prisoners, in a picker first (window.js); then all of them, or kind:n,… from it
  ransomPick(arg,t){
    railPicker({title:'Ransom prisoners',sub:'The ransom broker of '+t.name,total:'The broker pays',unit:'g',confirm:['ransom','Ransom'],back:['tab','tavern','Back'],
      items:Object.keys(P.prisoners).filter(k=>P.prisoners[k]>0).map(k=>({id:k,name:ST[k].n,sub:'Tier '+ST[k].tier+' · '+RANSOM[ST[k].tier]+'g each',pic:portrait(k),max:P.prisoners[k],unit:RANSOM[ST[k].tier]}))});
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
class Smithy extends Place{
  constructor(id){
    super(id,{n:'Smithy',ico:'anvil',verbs:{'buy-gear':'buyGear','buy-quiver':'buyQuiver'}});
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
      return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+I.n+'</strong><small>'+SLOTS[I.slot]+' · '+I.d+'</small><small class="diff">'+(gearDiff(id).join(' · ')||'<span class="muted">No change from what you wear.</span>')+'</small></div><div class="acts">'+railBtn('buy-gear',i,'Buy',P.gold<p?'Not enough gold':playerInventory.room('gear',id)<1?BAG_FULL:'')+'</div><span class="own gold">'+p+'g</span></div>'}).join('')
      :'<p class="muted">Sold out until the next delivery.</p>')+quiverRows(t,'smith','buy-quiver');
  }
  // a piece (its place in the stock): yours, your standing up a little
  buyGear(arg,t){
    const st=this.stock(t),id=st[+arg];if(id&&P.gold>=gearPrice(id)&&invAdd('gear',id,1)){P.gold-=gearPrice(id);st.splice(+arg,1);addRep(t.name,ITEMS[id].v/120,true);log('You buy the '+ITEMS[id].n+'.','gold')}
  }
  // a quiver (its id): yours, your standing up a little
  buyQuiver(arg,t){quiverBuy(arg,t,this.id)}
}
definePlace('smith',Smithy);

/* the stable: its mounts (core/items.js Mount: what it sells, who may buy the rare ones) */
class Stable extends Place{
  constructor(id){
    super(id,{n:'Stable',ico:'shoe',verbs:{'buy-mount':'buyMount'}});
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
        return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+I.n+'</strong><small>'+I.d+'</small><small class="diff">'+(gearDiff(id).join(' · ')||'<span class="muted">No change from your mount.</span>')+'</small></div><div class="acts">'+(ok?'':'<small class="bad">Needs standing '+REP_NEED[2]+'</small>')+
          railBtn('buy-mount',id,own?'Riding':'Buy',own?'You ride it':!ok?'Needs standing '+REP_NEED[2]:P.gold<p?'Not enough gold':P.gear.mount&&!invFree()?'Your bag is full':'')+'</div><span class="own gold">'+p+'g</span></div>'}).join('');
  }
  // ridden out at once with no mount of your own; else into your bag
  buyMount(arg,t){
    const id=arg,p=gearPrice(id);if(stableStock(t).includes(id)&&canBuyMount(t,id)&&P.gold>=p&&P.gear.mount!==id){
      if(!P.gear.mount){P.gear.mount=id;P.gold-=p;fitInv();toast('You buy a '+ITEMS[id].n+' and ride it out of the stable.','gold')}
      else if(invAdd('gear',id,1)){P.gold-=p;toast('You buy a '+ITEMS[id].n+'. Swap mounts in your inventory.','gold')}}
  }
}
definePlace('stable',Stable);

/* the barracks (the owner, 2026-10-28: casual recruiting): two tabs. Hire: a row for each troop they raise, how many you want of
   each (− + · +5 · Max), the card of the one pressed (its row or its face, a small i on it) beside the list (on a small screen
   in the window over the list: rec-info, Back to the list where you were), and the hire bar under it: what the order costs and does to your band, Fill band
   (a mix of melee and ranged into your free places: RECRUIT_UI.fill), Clear, Groups (each kind to its group: automatic, or the
   one you choose) and Hire (asks once when it spends more than RECRUIT_UI.ask of your gold). Train: a row for each training, all
   that are ready in one press, or a whole group at once. The order (G.town.cart) belongs to this visit, never to a save */
const RECRUIT_UI={fill:.6,ask:.5,step:5};
// (the window's scroll: read, or set)
const panelScroll=v=>{const b=panel.querySelector('.rwbody');if(v===undefined)return b?b.scrollTop:0;if(b)b.scrollTop=v};
class Barracks extends Place{
  constructor(id){
    super(id,{n:'Barracks',ico:'shield',verbs:{'rec-pick':'pick','rec-tab':'tab','rec-add':'add','rec-clear':'clear','rec-fill':'fill','rec-groups':'groups','rec-hire':'order','rec-hire-ok':'order','rec-hire-no':'order',
      'rec-info':'info','rec-info-back':'info',hire:'hire',train:'train','rec-upgroup':'upgroup'}});
  }
  shut(t){
    const closed=Place.closed(t);
    return closed||Timed.of(t).has('turmoil')?'<p class="muted">'+(closed?'No one here will take up arms: '+t.name+' was '+closed+' and is still burying its dead.':t.name+' is in turmoil after changing hands. No one will enlist for '+Timed.of(t).daysLeft('turmoil')+' more days.')+'</p>':'';
  }
  hires(t){return t.races.flatMap(r=>t.hires(r))}
  ups(t){return t.T.train?Object.keys(P.troops).filter(k=>P.troops[k]>0&&UP[k]).flatMap(k=>UP[k].map(to=>[k,to])):[]}
  // ---- the order: how many of each kind (G.town.cart), its totals, how many more of one kind you could still add
  cart(){const s=G.town;return s.cart||(s.cart={})}
  totals(){const c=this.cart(),ks=Object.keys(c).filter(k=>c[k]>0);return {ks,n:ks.reduce((a,k)=>a+c[k],0),cost:ks.reduce((a,k)=>a+c[k]*hireCost(k),0)}}
  room(t,k){const c=this.cart(),T=this.totals(),mine=c[k]||0,others=T.n-mine,cost=T.cost-mine*hireCost(k);
    return Math.max(0,Math.min(Math.floor(t.vol||0)-others,partyCap()-partySize()-others,Math.floor((P.gold-cost)/Math.max(1,hireCost(k))))-mine)}
  rowWhy(t,k){return !canHire(t,k)?'Needs standing '+needFor(k):''}
  body(t){
    const s=G.town,tab=t.T.train&&s.recTab==='train'?'train':'hire',v=Math.floor(t.vol||0);
    const tabs=t.T.train?'<div class="rec-tabs" role="tablist">'+[['hire','Hire'],['train','Train']].map(([k,n])=>'<button class="btn sm'+(k===tab?' on':'')+'" type="button" role="tab" aria-selected="'+(k===tab)+'" data-act="rec-tab" data-arg="'+k+'">'+n+'</button>').join('')+'</div>':'';
    const head='<div class="top rec-top">'+tabs+'<span class="lab">'+t.races.map(r=>RACES[r].n).join(' and ')+' troops · band '+partySize()+' / '+partyCap()+'</span><span class="lab">Standing <b class="gold" style="font-size:14px">'+standingAt(t)+'</b> · '+v+' willing</span></div>';
    if(s.info)return head+'<div class="rec-info"><div class="btns"><button class="btn" type="button" data-act="rec-info-back">‹ Back to the list</button></div>'+unitCard(s.info.split('>').pop(),s.info.includes('>')?s.info.split('>')[0]:null)+'</div>';
    return head+(tab==='train'?this.trainTab(t):this.hireTab(t));
  }
  hireTab(t){
    const hires=this.hires(t),c=this.cart(),kind=s=>s.range?'ranged':s.charge?'mounted':'melee';let pick=G.town.pick;if(!hires.includes(pick))pick=hires[0]||null;
    const btn=(a,arg,label,why,cls='')=>'<button class="btn sm'+cls+'" type="button" data-act="'+a+'" data-arg="'+arg+'"'+(why?' disabled':'')+'>'+label+'</button>';
    const rows=hires.map(k=>{const s=ST[k],n=c[k]||0,why=this.rowWhy(t,k),more=why?0:this.room(t,k);
      return '<div class="rec-row'+(pick===k?' sel':'')+'" data-act="rec-pick" data-arg="'+k+'"><button class="rec-pic" type="button" data-act="rec-info" data-arg="'+k+'" aria-label="'+htmlText(s.n)+': its card"><img src="'+portrait(k)+'" alt=""><span class="rec-badge" aria-hidden="true">i</span></button>'+
        '<div class="rec-txt"><strong>'+glyphSVG(iconOfType(k),14)+' '+s.n+'</strong><small>Tier '+s.tier+(s.race?' · '+RACES[s.race].n:'')+' · '+kind(s)+' · <b class="gold">'+hireCost(k)+'g</b></small><small>'+(why?'<span class="bad">'+why+'</span>':'You lead ×'+(P.troops[k]||0))+'</small></div>'+
        '<div class="rec-step">'+btn('rec-add',k+':-1','−',!n)+'<b class="rec-n">'+n+'</b>'+btn('rec-add',k+':1','+',!more)+btn('rec-add',k+':'+RECRUIT_UI.step,'+'+RECRUIT_UI.step,!more)+btn('rec-add',k+':max','Max',!more)+'</div></div>'}).join('');
    return '<div class="recwrap"><div class="reclist"><div class="rec-rows">'+rows+'</div><p class="muted" style="font-size:12px">More volunteers come forward each day as the '+t.label+' grows and prospers.</p></div><div class="reccard">'+(pick?unitCard(pick):'')+'</div></div>'+this.bar(t);
  }
  // the hire bar: the order's totals, its buttons, the groups (when open) and the question (when it spends much)
  bar(t){const s=G.town,T=this.totals(),r=partyRoster(P),c=this.cart(),q=this.check(t),opt=(v,n,sel,dis)=>'<option value="'+v+'"'+(sel?' selected':'')+(dis?' disabled':'')+'>'+htmlText(n)+'</option>';
    const groups=s.recGroups&&T.ks.length?'<div class="rec-groups">'+T.ks.map(k=>'<label>'+ST[k].n+' ×'+c[k]+'<select data-recruit-field="cartTarget:'+k+'" aria-label="'+htmlText(ST[k].n)+': group">'+opt('auto','Automatic',!(s.cartTarget||{})[k])+r.groups.filter(g=>g.type===k).map(g=>opt(g.id,(g.name||ST[k].n)+' · '+g.id+' × '+g.count,(s.cartTarget||{})[k]===g.id,r.groupRoom(k,g.id)<c[k])).join('')+opt('new','A new group',(s.cartTarget||{})[k]==='new',r.groupRoom(k,'new')<c[k])+'</select></label>').join('')+'</div>':'';
    const ask=s.cartAsk?'<div class="recruit-confirm" role="status">Spend '+T.cost+'g, more than half your gold?<div class="btns"><button type="button" class="btn primary" data-act="rec-hire-ok">Yes, hire</button><button type="button" class="btn" data-act="rec-hire-no">Cancel</button></div></div>':'';
    return '<section class="rec-bar" aria-label="Your order"><div class="rec-sum" aria-live="polite">'+(T.n?'Hire <b>'+T.n+'</b> soldier'+(T.n>1?'s':'')+' · <b class="gold">'+T.cost+'g</b> · band '+partySize()+' → '+(partySize()+T.n)+' / '+partyCap():'Choose how many with + and −, or Fill band.')+(T.n&&!q.ok?' · <span class="bad">'+q.why+'</span>':'')+'</div>'+
      '<div class="btns"><button type="button" class="btn sm" data-act="rec-fill"'+(partySize()>=partyCap()?' disabled':'')+'>Fill band</button><button type="button" class="btn sm" data-act="rec-clear"'+(T.n?'':' disabled')+'>Clear</button><button type="button" class="btn sm" data-act="rec-groups"'+(T.n?'':' disabled')+'>Groups: '+(Object.keys(s.cartTarget||{}).some(k=>c[k])?'chosen':'auto')+(s.recGroups?' ▴':' ▾')+'</button><span class="grow"></span><button type="button" class="btn primary" data-act="rec-hire"'+(T.n&&q.ok?'':' disabled')+'>Hire'+(T.n?' · '+T.cost+'g':'')+'</button></div>'+groups+ask+(s.recruitNotice?'<p role="status">'+s.recruitNotice+'</p>':'')+'</section>'}
  // (can the whole order be hired: gold, willing, room in your band; each kind's own rules, its standing)
  check(t){const T=this.totals();if(!T.n)return {ok:false,why:''};if(T.cost>P.gold)return {ok:false,why:'Not enough gold'};if(T.n>Math.floor(t.vol||0))return {ok:false,why:'Not that many willing'};
    if(partySize()+T.n>partyCap())return {ok:false,why:'No room in your band'};const bad=T.ks.find(k=>this.rowWhy(t,k));return bad?{ok:false,why:ST[bad].n+': '+this.rowWhy(t,bad)}:{ok:true}}
  pick(arg,t){this.info(arg,t,'rec-pick')}
  tab(arg){G.town.recTab=arg==='train'?'train':'hire';G.town.info=null}
  add(arg,t){const [k,n]=String(arg).split(':'),c=this.cart();if(!this.hires(t).includes(k)||this.rowWhy(t,k))return;const more=this.room(t,k);
    c[k]=Math.max(0,(c[k]||0)+(n==='max'?more:Math.min(+n||0,more)));G.town.cartAsk=false;G.town.recruitNotice=''}
  clear(){G.town.cart={};G.town.cartAsk=false;G.town.recruitNotice=''}
  groups(){G.town.recGroups=!G.town.recGroups}
  // Fill band: your free places, a mix of the cheapest melee and ranged kinds you may hire here (RECRUIT_UI.fill melee), as gold and the willing allow
  fill(arg,t){this.clear();const ok=this.hires(t).filter(k=>!this.rowWhy(t,k)),cheap=l=>l.sort((a,b)=>hireCost(a)-hireCost(b))[0],m=cheap(ok.filter(k=>!ST[k].range)),r=cheap(ok.filter(k=>ST[k].range)),c=this.cart();
    for(let i=0;;i++){const T=this.totals(),k=!r?m:!m?r:(c[m]||0)<Math.ceil((T.n+1)*RECRUIT_UI.fill)?m:r;if(!k||!this.room(t,k))break;c[k]=(c[k]||0)+1}}
  // Hire: asked first when it spends much; then each kind into its group (chosen, or the one with room, then new ones), all or what could be
  order(arg,t,a){const s=G.town,T=this.totals();if(a==='rec-hire-no'){s.cartAsk=false;return}if(!this.check(t).ok)return;
    if(a==='rec-hire'&&T.cost>P.gold*RECRUIT_UI.ask){s.cartAsk=true;return}s.cartAsk=false;let got=0,spent=0,why='';
    for(const k of T.ks){let left=this.cart()[k];const chosen=(s.cartTarget||{})[k];
      while(left>0){const r=partyRoster(P),tgt=chosen||recruitment.rules.target(k),room=r.groupRoom(k,tgt)||0,n=Math.min(left,tgt==='new'?ARMY_GROUP.units:room);if(n<1){why='No room in a group for more '+ST[k].n;break}
        const res=recruitment.hire(t,k,n,tgt);if(!res.ok){why=recruitmentWhy(res);break}recruitmentFeedback(res,t);got+=n;spent+=res.cost;left-=n;this.cart()[k]=left;if(chosen==='new')break}}
    s.recruitNotice=got?'Hired '+got+' soldier'+(got>1?'s':'')+' for '+spent+'g.'+(why?' '+why+'.':''):why;for(const k in this.cart())if(!this.cart()[k])delete this.cart()[k]}
  // a unit's card: beside the list on a wide screen (picked), in the window over it on a small one (Back: the list, where you were)
  info(arg,t,a){const s=G.town;if(a==='rec-info-back'){s.info=null;s.recBack=true;return}s.pick=arg;if(!window.matchMedia('(max-width:820px),(max-height:600px)').matches)return;s.info=arg;s.recScroll=panelScroll()}
  hire(arg,t){const result=recruitment.hire(t,arg,1);recruitmentFeedback(result,t)}
  // ---- Train: each training a row (ready ones in one press, or a whole group's upgrade, keeping its place)
  trainTab(t){const ups=this.ups(t);if(!ups.length)return '<p class="muted">None of your troops can train further. They gain experience by fighting.</p>';
    return '<div class="rec-rows">'+ups.map(([k,to])=>{const s=ST[to],ready=txpReady(k),c=trainCost(to),n=Math.min(ready,Math.floor(P.gold/Math.max(1,c))),q=recruitment.quoteTraining(t,k,to),
        whole=partyRoster(P).groups.filter(g=>g.type===k).map(g=>({g,q:recruitment.quoteGroupTraining(t,g.id,to)})).filter(x=>x.q.ok);
      return '<div class="rec-row" data-act="rec-pick" data-arg="'+k+'>'+to+'"><button class="rec-pic" type="button" data-act="rec-info" data-arg="'+k+'>'+to+'"><img src="'+portrait(to)+'" alt=""><span class="rec-badge" aria-hidden="true">i</span></button>'+
        '<div class="rec-txt"><strong>'+glyphSVG(iconOfType(to),14)+' '+ST[k].n+' → '+s.n+'</strong><small>'+(ready?'<b class="gold">'+ready+' of '+P.troops[k]+' ready</b>':'Experience '+Math.floor(txpOf(k))+' / '+txpNeed(k)+' to train one')+' · '+c+'g each</small></div>'+
        '<div class="rec-step"><button class="btn sm primary" type="button" data-act="train" data-arg="'+k+':'+to+':'+Math.max(1,n)+'"'+(q.ok&&n>0?'':' disabled title="'+htmlText(q.ok?'Not enough gold':q.code==='experience'?'Fight with them to gain experience':recruitmentWhy(q)||'Not available')+'"')+'>Train '+Math.max(1,n)+(n>0?' · '+n*c+'g':'')+'</button>'+
        whole.map(x=>'<button class="btn sm" type="button" data-act="rec-upgroup" data-arg="'+x.g.id+':'+to+'">Whole group '+htmlText(x.g.name||x.g.id)+' ×'+x.g.count+' · '+x.q.cost+'g</button>').join('')+'</div></div>'}).join('')+'</div>'}
  train(arg,t){const [k,to,ns]=String(arg).split(':');for(let i=0;i<Math.max(1,+ns||1);i++){const r=recruitment.train(t,k,to);recruitmentFeedback(r,t);if(!r.ok)break}}
  upgroup(arg,t){const [id,to]=String(arg).split(':'),r=recruitment.trainGroup(t,id,to);recruitmentFeedback(r,t)}
  // (back from a unit's card: the list where you left it)
  focus(a){if(a==='rec-info-back'&&G.town.recBack){G.town.recBack=false;panelScroll(G.town.recScroll||0);return true}if((a==='rec-info'||a==='rec-pick')&&G.town.info){panelScroll(0);return true}return false}
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
    return t.kind!=='village'||lordsInside(t).length>0;
  }
  body(t){
    const f=FACS[t.owner],ls=lordsInside(t),sw=g=>'<span style="color:'+FACS[g].col+'">'+FACS[g].n+'</span>',b=c=>railBtn(c===this.signing?'contract':'end-contract',null,c.label,c.why(t));
    return '<div class="lab">Held by</div><p>'+(t.owner==='player'?'You hold '+t.name+'. Its reeve keeps the ledgers in the Steward’s office.':f?'The '+sw(t.owner)+'. Your honor with them: '+honorWith(t.owner)+'. '+(enemiesOf(t.owner).length?'At war with the '+enemiesOf(t.owner).map(sw).join(' and the ')+'.':'At peace.'):'No realm.')+'</p>'+
      '<div class="lab">Lords holding court</div>'+(ls.length?railCards(ls.map(l=>({fac:l.fac,name:lordName(l),role:'Lord of the '+sw(l.fac),facts:[l.troops.length+' soldiers quartered here','Toward you: '+relTag(relWith(l))],
        acts:[['hall-talk',l.id,'Talk',hostileTo(l.fac)&&!lordSpares(l)?'Your realms are at odds':'']]}))):'<p class="muted">None today.</p>')+
      (!t.T.contract||t.owner==='player'?'':'<div class="lab">Service</div>'+(P.fac===t.owner?railRow('Your contract','The '+f.n+' pays you 1 gold per troop each day.',b(this.ending))
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
    return '<p>One-on-one against the town champion, before the crowd.</p>'+railCards([{pic:portrait('chief'),name:'The town champion',role:'Waiting in the lists',facts:[['Win 45 gold and renown','gold'],'Entry 10 gold · you have '+P.gold],
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
    return '<div class="lab">Stores · '+gs.filter(g=>(t.stock[g]||0)>=1).length+' goods · room for '+cap+' of each</div><p class="muted" style="font-size:13px">'+(own?'Your castle’s stockpile. Put goods in for safe keeping or take out what you need. Nothing is bought or sold here.':
      'The castle’s stockpile. A castle has no market: nothing here is for sale. Take '+t.name+', and its stores are yours to keep or plunder.')+'</p>'+
      (gs.length?gs.map(g=>{const st=Math.floor(t.stock[g]||0),n=goodN(g);return '<div class="row"><div class="info"><strong>'+GOODS[g].n+'</strong><small>'+st+' in store'+(own?' · you carry '+n:'')+'</small></div>'+
        (own?'<div class="acts">'+b('st-put',g,5,'Store 5',n<1||st>=cap)+b('st-put',g,'all','Store all',n<1||st>=cap)+b('st-take',g,5,'Take 5',st<1||goodRoom(g)<1)+b('st-take',g,'all','Take all',st<1||goodRoom(g)<1)+'</div>':'')+'</div>'}).join('')
        :'<p class="muted">The stores are empty.</p>');
  }
  // put in (st-put) or take out (st-take) g:n (n: 5 or all), in your own castle
  store(a,arg){
    const t=G.town&&G.town.ref;if(!t||t.owner!=='player')return;ensureEcon(t);const [g,ns]=String(arg).split(':');if(!GOODS[g])return;const st=Math.floor(t.stock[g]||0);
    if(a==='st-put'){const n=Math.min(ns==='all'?Infinity:+ns,goodN(g),Math.max(0,Math.round(storeCap(t))-st));const k=n>0?goodTake(g,n):0;t.stock[g]=(t.stock[g]||0)+k;if(k)toast('You store '+k+' '+GOODS[g].n.toLowerCase()+' in '+t.name+'.')}
    if(a==='st-take'){const n=Math.min(ns==='all'?Infinity:+ns,st,goodRoom(g));const k=n>0?invAdd('good',g,n):0;t.stock[g]-=k;if(k)toast('You take '+k+' '+GOODS[g].n.toLowerCase()+' from the stores of '+t.name+'.')}
    updateHUD(true);renderTown();
  }
}
definePlace('stores',Storehouse);
const storesBody=t=>PLACES.stores.body(t);
const storesAct=(a,arg)=>PLACES.stores.store(a,arg);
onAct('st-',storesAct);

/* the walls and garrison, at every holding: everyone who would defend it, how well, and for how long; in your own fief its
   soldiers (siege.js garrisonBody; their fief- orders are the steward's). A plain entry */
definePlace('garrison',{n:'Walls & garrison',short:'Walls',ico:'tower',at:t=>true,body:t=>garrisonBody(t)});
/* the prison, at every holding (world/prisons.js Prisons, doc/PRISONS_DESIGN.md §5): who is held there, and what you can do for
   them (its verbs pz-); yours or your realm's, your own prisoners and the captives you lock up. A plain entry */
definePlace('prison',{n:'Prison',ico:'prisoners',at:t=>true,dot:t=>Prisons.dot(t),body:t=>Prisons.body(t),handles:a=>a.startsWith('pz-'),act:(a,arg,t)=>Prisons.act(a,arg,t)});

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
      '<p class="'+(hostileTo(t.owner)?'muted':'bad')+'">'+(hostileTo(t.owner)?'The '+f.n+' is already your enemy.':'Attacking makes the '+f.n+' hostile to you for 60 days and costs 20 honor with them.')+'</p>'+
      railKeyActions([{icon:'ladder',label:'Attack',act:'siege-ask',facts:[(r<.6?'Easy':r<1?'Even':r<1.5?'Risky':'Deadly')+' · power '+ep+' vs '+pp,walled(t)?'a siege camp: ladders '+LADDER_DAYS+' days':'raid or seize it'],tip:'Leave the gates and plan an attack'}]);
  }
  // it cannot be undone: a confirm first (window.js railConfirm); Confirm plans it
  ask(arg,t){
    const def=siegeDefenders(t),ep=rating(def.list,siegeLv(t)),pp=partyPower(),f=FACS[t.owner];
    railConfirm({title:'Attack '+t.name+'?',sub:cap1(t.label)+' of the '+f.n,text:hostileTo(t.owner)?'The '+f.n+' is already your enemy.':'<span class="bad">Attacking makes the '+f.n+' hostile to you for 60 days and costs 20 honor with them.</span>',
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
   fief- orders); the window's: qty (the ×1 / ×5 of a Buy and Sell), tab (a place opened; home: the overview), bld (one of your
   holding's buildings, townui.js). The window redraws where it was scrolled (window.js showRail), the focus back on the button
   pressed */
const TOWN_WINDOW_ACTS={
  qty:arg=>{G.town.qty=+arg===5?5:1},
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
  const p=PLACES[tab]||PLACES.tavern;
  return p.opens(t)?p:null;
}
function renderTown(){
  const t=G.town.ref,p=townPlace(t,G.town.tab);
  KNOWLEDGE.watch();showTown(t,p?p.page(t):townOverview(t));G.town.greet=null;
}
// (a quest to report here: straight to the Notices, Back to the overview; else the overview; the crier's proclamations that
// have reached it: news.js proclaimAt)
function enterTown(t){G.lastTown=t;P.tx=null;G.town={ref:t,tab:P.quests.some(q=>canReportAt(q,t)&&questReady(q))?'jobs':null};G.mode='town';log('You enter '+t.name+'.');proclaimAt(t);questArrive(t);renderTown()}
