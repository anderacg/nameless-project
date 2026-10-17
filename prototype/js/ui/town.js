'use strict';
// Commands return outcomes; the screen decides how to describe them.
const RECRUIT_WHY={amount:'Enter a positive whole number with a valid total cost',target:'Choose an existing group of this unit type, or a new group','wounded-group':'Wait for this group’s wounded to return before upgrading it',groups:'Army is full (10 groups). Reinforce an existing type or merge groups',gold:'Not enough gold for this order',capacity:'Not enough headcount capacity for this order',volunteers:'Not enough volunteers for this order',standing:'Not enough standing',closed:'No one will enlist while the holding recovers',unavailable:'This holding does not raise that troop',experience:'Needs more experience: fight with them',troops:'No soldiers of that kind',upgrade:'Not a valid troop upgrade','training-unavailable':'No training available here','companion-unavailable':'This companion is not available here','companion-hired':'Already in your band','invalid-unit':'Unknown recruit'};
const recruitmentWhy=r=>RECRUIT_WHY[r.code]||'';
function recruitmentFeedback(r,t){
  if(r.ok){
    if(r.code==='hire')log((r.count>1?r.count+' × '+ST[r.kind].n:cap1(an(ST[r.kind].n.toLowerCase())))+' join'+(r.count>1?'':'s')+' your band.');
    else if(r.code==='training')log(ST[r.from].n+' trained into '+ST[r.to].n.toLowerCase()+'.');
    else if(r.code==='group-training')log(r.id+': '+r.count+' × '+ST[r.from].n+' upgraded to '+ST[r.to].n+' for '+r.cost+'g.','good');
    else if(r.code==='companion')log(COMPS[r.id].n+' joins your band. Give them a role with C.','good');
    else if(r.code==='prisoner')log('A captured '+ST[r.kind].n.toLowerCase()+' swears to follow you.');
  }else if(r.code==='standing')log('The people of '+t.name+' do not know you well enough yet.','bad');
  else if(r.code==='volunteers')log('No one else in '+t.name+' will take up arms today.','bad');
  else if(r.code==='experience')log(ST[r.from].n+' needs more experience first ('+Math.floor(txpOf(r.from))+' / '+(r.xpCost||txpNeed(r.from))+' XP): fight with them.','bad');
  else if(recruitmentWhy(r))log(recruitmentWhy(r)+'.','bad');
}
// Drafts and confirmations belong to the current town visit, never campaign saves.
function townRecruitQuote(){
  const s=G.town,pick=s&&s.pick;if(!pick)return null;const [from,to]=pick.split('>');
  return to?recruitment.quoteGroupTraining(s.ref,s.trainingGroup,to):recruitment.quoteHire(s.ref,from,s.hireCount??1,s.hireTarget);
}
function townRecruitAction(a){
  const s=G.town;if(!s||G.mode!=='town')return;
  if(a==='rec-cancel'){s.review=null;s.recruitNotice='';return}
  const quote=townRecruitQuote();if(!quote)return;
  if(a==='rec-review'){s.review=quote.ok?{...quote}:null;s.recruitNotice=quote.ok?'':recruitmentWhy(quote);return}
  if(a!=='rec-confirm'||!s.review)return;
  if(!quote.ok||JSON.stringify(quote)!==JSON.stringify(s.review)){
    s.review=null;s.recruitNotice=quote.ok?'This order changed. Review the new totals before confirming.':recruitmentWhy(quote);return;
  }
  const result=quote.code==='hire'?recruitment.hire(s.ref,quote.kind,quote.count,quote.target):recruitment.trainGroup(s.ref,quote.id,quote.to);
  s.review=null;s.recruitNotice=result.ok?'Completed: '+result.count+' soldiers · '+result.cost+'g.':recruitmentWhy(result);
  if(result.ok&&result.code==='hire'&&quote.target==='new')s.hireTarget=G.recruitTarget;
  recruitmentFeedback(result,s.ref);
}
function townRecruitControls(t,pick){
  const s=G.town,r=partyRoster(P),[from,to]=pick.split('>'),groups=r.groups.filter(g=>g.type===from);
  const option=(value,text,selected,disabled=false)=>'<option value="'+value+'"'+(selected?' selected':'')+(disabled?' disabled':'')+'>'+htmlText(text)+'</option>';
  if(to){if(!groups.some(g=>g.id===s.trainingGroup))s.trainingGroup=groups[0]?.id||''}
  else if(s.hireTarget===undefined||s.draftType!==from){s.hireTarget=recruitment.rules.target(from);s.draftType=from}
  s.pick=pick;const q=townRecruitQuote(),slots=r.slots,capacity=partyCap(),size=partySize(),review=s.review;
  const groupSelect=to?'<label>Group to upgrade<select data-recruit-field="trainingGroup" aria-label="Group to upgrade">'+groups.map(g=>option(g.id,(g.name||ST[from].n)+' · '+g.id+' × '+g.count,g.id===s.trainingGroup)).join('')+'</select></label>':
    '<label>Destination group<select data-recruit-field="hireTarget" aria-label="Destination group">'+groups.map(g=>option(g.id,(g.name||ST[from].n)+' · '+g.id+' × '+g.count,g.id===s.hireTarget)).join('')+option('new','New '+ST[from].n+' group',s.hireTarget==='new',slots>=ARMY_LIMIT)+'</select></label>';
  const projected=slots+(!to&&s.hireTarget==='new'?1:0);
  return '<section class="recruit-order" aria-label="Group recruitment and training"><div class="lab">'+(to?'Upgrade '+ST[from].n+' → '+ST[to].n:'Recruit '+ST[from].n)+'</div><div class="recruit-fields">'+groupSelect+
    (to?'':'<label>Soldiers<input data-recruit-field="hireCount" aria-label="Recruit quantity" type="number" min="1" step="1" value="'+(Number.isFinite(s.hireCount)?s.hireCount:1)+'"></label>')+'</div>'+
    '<p class="muted">'+(to?'Keeps the group ID and slot; resets formation to Line. XP remains pooled by unit type.':'Recruitment is all-or-nothing. Volunteers here: '+Math.floor(t.vol||0)+'.')+'</p>'+
    '<div class="recruit-summary"><div class="recruit-totals" aria-live="polite"><span>Total <b>'+q.cost+'g</b> · '+q.unitCost+'g × '+q.count+'</span><span>Headcount '+size+' → '+(size+(to?0:q.count))+' / '+capacity+'</span><span>Groups '+slots+' → '+projected+' / '+ARMY_LIMIT+' · '+Math.max(0,ARMY_LIMIT-projected)+' free after order</span>'+
    (to?'<span>XP '+Math.floor(txpOf(from))+' / '+q.xpCost+' required</span>':'')+'</div>'+
    (!q.ok?'<p class="bad" role="status">'+recruitmentWhy(q)+'</p>':'')+
    (review?'<div class="recruit-confirm" role="status">Confirm '+review.count+' × '+ST[to||from].n+' · '+review.cost+'g · '+(to?review.id+' keeps its slot':review.target==='new'?'one new group':review.target)+
      '<div class="btns"><button type="button" class="btn primary" data-act="rec-confirm">Confirm '+review.cost+'g</button><button type="button" class="btn" data-act="rec-cancel">Cancel</button></div></div>':
      '<button type="button" class="btn primary" data-act="rec-review"'+(!q.ok?' disabled':'')+'>Review '+(to?'group upgrade':'recruitment')+'</button>')+
    (s.recruitNotice?'<p role="status">'+s.recruitNotice+'</p>':'')+'</div></section>';
}
/* ---------- economy ---------- */
// prices come from each market's stock against its needs (economy.js); these are the next unit's
const price=(town,good)=>marketPrice(town,good);
const buyP=(t,g)=>nextBuy(t,g);
const sellP=(t,g)=>nextSell(t,g);
const matPrice=k=>Math.round(MATS[k].v*(.75+.01*skill('trade')));
const itemPrice=id=>Math.round(ITEMS[id].v*(.6+.01*skill('trade')));
// a smith's stock: up to 6 pieces a week, forged from the metals in its holding's stock (FORGE: wood, bronze from copper and tin,
// iron, silver, gold, mithril, adamant), each piece taking its metal; it favours the best metal it has
const forgeTiers=t=>{ensureEcon(t);return FORGE.map((m,k)=>Object.keys(m).every(g=>(t.stock[g]||0)>=m[g])?k:-1).filter(k=>k>=0)};
function smithStock(t){
  W.shops=W.shops||{};const sh=W.shops[t.name];
  if(!sh||G.day-sh.day>=7){const items=[],bases=Object.keys(BASES);
    for(let i=0;i<6;i++){const ok=forgeTiers(t);if(!ok.length)break;const w=ok.map(k=>k?1+k*.25:.6);let x=Math.random()*w.reduce((a,b)=>a+b,0),tier=ok[0];for(let j=0;j<ok.length;j++){x-=w[j];if(x<0){tier=ok[j];break}}
      for(const g in FORGE[tier])t.stock[g]-=FORGE[tier][g];items.push(gearId(bases[rint(0,bases.length-1)],tier))}
    W.shops[t.name]={day:G.day,items}}
  return W.shops[t.name].items;
}
// the metals a smith has to work with, and what it lacks: for its tab
const forgeText=t=>{const ok=forgeTiers(t),has=MATERIALS.filter((m,k)=>k&&ok.includes(k)).map(m=>m.k);return has.length?'It can forge '+has.join(', ')+' and wooden pieces from the metals in '+t.name+'.':'There is no metal in '+t.name+': only wooden pieces until some is mined or brought in.'};
// a stable's mounts: commons everywhere, horses in towns, rare beasts by the folk who live there or the land around
function stableStock(t){const clim=climAt(t.x,t.y);return Object.keys(MOUNTS).filter(k=>{const M=MOUNTS[k];if(M.drop)return false;return t.sellsMount(M,clim)}).map(k=>'m_'+k)}
const canBuyMount=(t,id)=>ITEMS[id].r==='common'||standingAt(t)>=REP_NEED[2];
const gearPrice=id=>Math.round(ITEMS[id].v*(1.2-.01*skill('trade')));
const ransomValue=()=>Object.keys(P.prisoners).reduce((a,k)=>a+P.prisoners[k]*RANSOM[ST[k].tier],0);
// a castle's stores: it has no market, but it keeps a stockpile of what its land and the caravans bring (what you carry off if
// you sack it). In a castle of yours you keep goods there: put them in from your bags or take them out, free
function storesBody(t){
  ensureEcon(t);const own=t.owner==='player',cap=Math.round(storeCap(t)),gs=Object.keys(GOODS).filter(g=>(t.stock[g]||0)>=1||own&&goodN(g)>0);
  const b=(act,g,n,label,no)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+g+':'+n+'"'+(no?' disabled':'')+'>'+label+'</button>';
  return '<div class="lab">Stores · room for '+cap+' of each good</div><p class="muted" style="font-size:13px">'+(own?'Your castle’s stockpile. Put goods in for safe keeping or take out what you need. Nothing is bought or sold here.':
    'The castle’s stockpile. A castle has no market: nothing here is for sale. Take '+t.name+', and its stores are yours to keep or plunder.')+'</p>'+
    (gs.length?gs.map(g=>{const st=Math.floor(t.stock[g]||0),n=goodN(g);return '<div class="row"><div class="info"><strong>'+GOODS[g].n+'</strong><small>'+st+' in store'+(own?' · you carry '+n:'')+'</small></div>'+
      (own?'<div class="acts">'+b('st-put',g,5,'Store 5',n<1||st>=cap)+b('st-put',g,'all','Store all',n<1||st>=cap)+b('st-take',g,5,'Take 5',st<1||goodRoom(g)<1)+b('st-take',g,'all','Take all',st<1||goodRoom(g)<1)+'</div>':'')+'</div>'}).join('')
      :'<p class="muted">The stores are empty.</p>');
}
function storesAct(a,arg){
  const t=G.town&&G.town.ref;if(!t||t.owner!=='player')return;ensureEcon(t);const [g,ns]=String(arg).split(':');if(!GOODS[g])return;const st=Math.floor(t.stock[g]||0);
  if(a==='st-put'){const n=Math.min(ns==='all'?Infinity:+ns,goodN(g),Math.max(0,Math.round(storeCap(t))-st));const k=n>0?goodTake(g,n):0;t.stock[g]=(t.stock[g]||0)+k;if(k)log('You store '+k+' '+GOODS[g].n.toLowerCase()+' in '+t.name+'.')}
  if(a==='st-take'){const n=Math.min(ns==='all'?Infinity:+ns,st,goodRoom(g));const k=n>0?invAdd('good',g,n):0;t.stock[g]-=k;if(k)log('You take '+k+' '+GOODS[g].n.toLowerCase()+' from the stores of '+t.name+'.')}
  updateHUD(true);renderTown();
}
onAct('st-',storesAct);
function renderTown(){
  const t=G.town.ref,tab=G.town.tab,cap=partyCap(),cnt=partySize(),f=FACS[t.owner];
  const tabs=townTabs(t);
  const kind=s=>s.range?'ranged':s.charge?'mounted charge':'melee';
  let body='';
  const closed=until(t,'sacked')?'sacked':until(t,'raided')?'raided':null;
  if(tab==='fief'&&t.owner==='player')body=fiefBody(t);
  else if(tab==='garrison')body=garrisonBody(t);
  else if(tab==='stores')body=storesBody(t);
  else if(tab==='jobs')body=jobsBody(t);
  else if(tab==='siege'){const def=siegeDefenders(t),lv=siegeLv(t),ep=rating(def.list,lv),pp=partyPower(),r=ep/Math.max(1,pp);
    body='<div class="lab">Attack '+t.name+'</div><p>Garrison '+t.gar+(def.lords.length?', with '+def.lords.map(l=>l.name).join(' and ')+' inside':'')+'. '+(!walled(t)?''+(wallOf(t)?WALL_N[wallOf(t)]+': its militia fights as level '+lv+'. ':'It has no walls. ')+'You can raid it or seize it.':WALL_N[wallOf(t)]+' make every defender as strong as level '+lv+'. You will need a siege camp: ladders take '+LADDER_DAYS+' days, a ram '+RAM_DAYS+'.')+'</p>'+
      '<p>Defenders&rsquo; power <strong>'+ep+'</strong> vs yours <strong>'+pp+'</strong> · <strong class="'+(r<.6?'good':r<1?'gold':'bad')+'">'+(r<.6?'Easy':r<1?'Even':r<1.5?'Risky':'Deadly')+'</strong></p>'+
      '<p class="'+(hostileTo(t.owner)?'muted':'bad')+'">'+(hostileTo(t.owner)?'The '+f.n+' is already your enemy.':'Attacking makes the '+f.n+' hostile to you for 60 days and costs 20 honor with them.')+'</p>'+
      '<div class="btns"><button class="btn primary" type="button" data-act="plan-siege">Leave the gates and plan an attack</button></div>'}
  else if(tab==='recruit'&&(closed||until(t,'turmoil')))body='<p class="muted">'+(closed?'No one here will take up arms: '+t.name+' was '+closed+' and is still burying its dead.':t.name+' is in turmoil after changing hands. No one will enlist for '+(t.turmoil-G.day)+' more days.')+'</p>';
  else if((tab==='smith'||tab==='stable')&&closed)body='<p class="muted">The '+(tab==='smith'?'smithy':'stable')+' was burned when '+t.name+' was '+closed+'. It reopens in '+(t[closed]-G.day)+' days.</p>';
  else if(tab==='recruit'){
    const hires=t.races.flatMap(r=>t.hires(r));
    const ups=t.T.train?Object.keys(P.troops).filter(k=>P.troops[k]>0&&UP[k]).flatMap(k=>UP[k].map(to=>[k,to])):[];
    // (the unit picked for the card: a hire, or a training as from>to; the first hire until you pick)
    let pick=G.town.pick;if(!pick||!(hires.includes(pick)||ups.some(([k,to])=>pick===k+'>'+to)))pick=hires[0]||(ups[0]&&ups[0].join('>'))||null;
    const TRAIN_ROWS=t.T.train?'<div class="lab" style="margin-top:6px">Train (troop trees)</div>'+(ups.length?ups.map(([k,to])=>{const quote=recruitment.quoteTraining(t,k,to),c=quote.cost,s=ST[to];return '<div class="row recrow'+(pick===k+'>'+to?' sel':'')+'" data-act="rec-pick" data-arg="'+k+'>'+to+'"><img class="rec-pic" src="'+portrait(to)+'" alt=""><div class="info"><strong>'+glyphSVG(iconOfType(to),14)+' '+ST[k].n+' → '+s.n+'</strong><small>Tier '+s.tier+' · '+s.hp+' hp · '+s.dmg+' damage · '+(s.range?'range '+s.range:'reach '+s.reach)+'</small></div><small class="'+(txpReady(k)?'gold':'muted')+'">'+(txpReady(k)?txpReady(k)+' of '+P.troops[k]+' ready':'Experience '+Math.floor(txpOf(k))+' / '+txpNeed(k)+' to train one')+'</small><span class="own">×'+P.troops[k]+'</span><div class="acts"><button class="btn sm" type="button" data-act="train" data-arg="'+k+':'+to+'"'+(!quote.ok?' disabled title="'+(quote.code==='experience'?'Needs '+txpNeed(k)+' XP: fight with them':recruitmentWhy(quote))+'"':'')+'>Train 1 · '+c+'g</button></div></div>'}).join(''):'<p class="muted">None of your troops can train further.</p>'):'';
    body='<div class="top"><span class="lab">Hire '+t.races.map(r=>RACES[r].n).join(' and ')+' troops ('+cnt+' / '+cap+')</span><span class="lab">Your standing here <b class="gold" style="font-size:14px">'+standingAt(t)+'</b></span></div>'+'<p class="muted" style="font-size:13px" title="Standing is your reputation here ('+Math.round(repAt(t.name))+'), half your honor with the '+FACS[t.owner].n+' ('+honorWith(t.owner)+')'+(t.races.includes(P.race)?', and +'+RACE_TRUST+' because your people live here':'')+'.">Tier 1 needs standing '+REP_NEED[1]+', tier 2 needs '+REP_NEED[2]+' · volunteers here: <b>'+Math.floor(t.vol||0)+'</b> · click a unit for its card.</p>'+(pick?townRecruitControls(t,pick):'')+'<div class="recwrap"><div class="reclist">'+hires.map(k=>{const s=ST[k],quote=recruitment.quoteHire(t,k);return '<div class="row recrow'+(pick===k?' sel':'')+'" data-act="rec-pick" data-arg="'+k+'"><img class="rec-pic" src="'+portrait(k)+'" alt=""><div class="info"><strong>'+glyphSVG(iconOfType(k),14)+' '+s.n+'</strong><small>Tier '+s.tier+(s.race?' · '+RACES[s.race].n:'')+' · '+s.hp+' hp · '+kind(s)+'</small></div><span class="own">×'+(P.troops[k]||0)+'</span><div class="acts">'+(canHire(t,k)?'':'<small class="bad">Needs standing '+needFor(k)+'</small>')+'<button class="btn sm" type="button" data-act="hire" data-arg="'+k+'"'+(!quote.ok?' disabled title="'+recruitmentWhy(quote)+'"':'')+'>Hire 1 · '+quote.cost+'g</button></div></div>'}).join('')+'<p class="muted" style="font-size:12px">More volunteers come forward each day as the '+t.label+' grows and prospers.</p>'+TRAIN_ROWS+'</div><div class="reccard">'+(pick?unitCard(pick.split('>').pop(),pick.includes('>')?pick.split('>')[0]:null):'')+'</div></div>';
  }else if(tab==='smith'){
    const st=smithStock(t);
    body='<div class="lab">Smith · new stock in '+(7-(G.day-W.shops[t.name].day)%7)+' days</div><p class="muted" style="font-size:13px">'+forgeText(t)+' Bring copper and tin, silver, gold, mithril or adamantite to its market and the smith will forge with them.</p>'+(st.length?st.map((id,i)=>{const I=ITEMS[id],p=gearPrice(id);
      return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+I.n+'</strong><small>'+SLOTS[I.slot]+' · '+I.d+'</small><small class="diff">'+(gearDiff(id).join(' · ')||'<span class="muted">No change from what you wear.</span>')+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="buy-gear" data-arg="'+i+'"'+(P.gold<p||!invFree()?' disabled':'')+'>Buy '+p+'g</button></div></div>'}).join('')
      :'<p class="muted">Sold out until the next delivery.</p>')+
      '<div class="lab" style="margin-top:6px">Ammunition</div>'+['arrows','bolts'].map(g=>{const p=buyP(t,g);return '<div class="row"><div class="info"><strong>'+GOODS[g].n+'</strong><small>'+p+'g each · '+(t.stock&&t.stock[g]||0)+' in stock · you have '+goodN(g)+'</small></div><div class="acts">'+
        [10,25].map(n=>'<button class="btn sm" type="button" data-act="buy-ammo" data-arg="'+g+':'+n+'"'+(P.gold<p*n||goodRoom(g)<n?' disabled':'')+'>Buy '+n+' · '+p*n+'g</button>').join('')+'</div></div>'}).join('');
  }else if(tab==='stable'){
    const cur=mountDef();
    body='<div class="lab">Stable · '+(cur?'you ride a '+cur.n:'you travel on foot')+'</div><p class="muted" style="font-size:13px">A mount goes in its own slot and speeds your travel. Rare beasts need standing '+REP_NEED[2]+' here (yours: '+standingAt(t)+').</p>'+
      stableStock(t).map(id=>{const I=ITEMS[id],p=gearPrice(id),ok=canBuyMount(t,id),own=P.gear.mount===id;
        return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+I.n+'</strong><small>'+I.d+'</small><small class="diff">'+(gearDiff(id).join(' · ')||'<span class="muted">No change from your mount.</span>')+'</small></div><div class="acts">'+(ok?'':'<small class="bad">Needs standing '+REP_NEED[2]+'</small>')+
          '<button class="btn sm" type="button" data-act="buy-mount" data-arg="'+id+'"'+(own||!ok||P.gold<p||(P.gear.mount&&!invFree())?' disabled':'')+'>'+(own?'Riding':'Buy '+p+'g')+'</button></div></div>'}).join('');
  }else if(tab==='trade'){
    ensureEcon(t);const goods=Object.keys(GOODS).filter(k=>(t.stock[k]||0)>0||goodN(k)>0||needOf(t,k)>.05);
    body='<div class="lab">Bag '+(P.inv.length-invFree())+' / '+P.inv.length+' slots · every unit you buy or sell moves the price</div>'+goods.map(k=>{const p=buyP(t,k),s=sellP(t,k),room=goodRoom(k),n=goodN(k);const st=t.stock[k]||0,ms=marketState(t,k);return '<div class="row"><div class="info"><strong>'+GOODS[k].n+(ms?' <span class="'+(ms==='shortage'?'bad':'good')+'" style="font-size:12px">'+cap1(ms)+'</span>':'')+'</strong><small>Buy '+p+'g · sell '+s+'g · '+st+' in the market · '+GOODS[k].stack+' per slot</small></div><span class="own">×'+n+'</span><div class="acts">'+
      '<button class="btn sm" type="button" data-act="buy" data-arg="'+k+':1"'+(P.gold<p||room<1||st<1?' disabled':'')+'>Buy</button>'+
      '<button class="btn sm" type="button" data-act="buy" data-arg="'+k+':5"'+(P.gold<p*5||room<5||st<5?' disabled':'')+'>Buy 5</button>'+
      '<button class="btn sm" type="button" data-act="sell" data-arg="'+k+':1"'+(n<1?' disabled':'')+'>Sell</button>'+
      '<button class="btn sm" type="button" data-act="sell" data-arg="'+k+':5"'+(n<5?' disabled':'')+'>Sell 5</button></div></div>'}).join('');
    const stock=P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k!=='good');
    if(stock.length)body+='<div class="lab" style="margin-top:6px">From your inventory</div>'+stock.map(([x,i])=>x.k==='mat'
      ?'<div class="row"><div class="info"><strong>'+MATS[x.id].n+'</strong><small>Trophy · '+matPrice(x.id)+'g each</small></div><span class="own">×'+x.n+'</span><div class="acts"><button class="btn sm" type="button" data-act="sell-loot" data-arg="'+i+'">Sell '+matPrice(x.id)*x.n+'g</button></div></div>'
      :'<div class="row"><div class="info"><strong style="color:'+RARITY[ITEMS[x.id].r]+'">'+ITEMS[x.id].n+'</strong><small>'+SLOTS[ITEMS[x.id].slot]+' · '+ITEMS[x.id].d+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="sell-item" data-arg="'+i+'">Sell '+itemPrice(x.id)+'g</button></div></div>').join('');
  }else{
    const here=P.stay&&P.stay.town===t.name,why=stayWhy(t),fd=eatPerDay();
    body='<div class="row"><div class="info"><strong>Lodgings</strong><small>'+(here?'Your band is staying here: '+(stayFree(t)?'free, as long as you like':stayCost()+'g a day, your gold lasts until Day '+stayUntil()):'Stay and let the days pass: you recover four times as fast, morale rises, the wounded heal twice as fast. '+(why||(stayFree(t)?'Free: they know you here.':stayCost()+'g a day (5g, and 1g for every 2 of your people).')))+'</small></div><div class="acts">'+(here?'<button class="btn sm" type="button" data-act="sy-leave">Leave</button>':'<button class="btn sm" type="button" data-act="sy-stay" data-arg="'+t.name+'"'+(why?' disabled':'')+'>Stay</button>')+'</div></div>'+
      '<div class="row"><div class="info"><strong>Provisions</strong><small>Your band eats '+fd+' food a day, from its own packs. The innkeeper sells you the cheapest food in the market.</small></div><div class="acts"><button class="btn sm" type="button" data-act="sy-food" data-arg="3"'+(P.gold<1?' disabled':'')+'>3 days</button><button class="btn sm" type="button" data-act="sy-food" data-arg="7"'+(P.gold<1?' disabled':'')+'>7 days</button></div></div>'+
      (!t.T.tourney?'':'<div class="row"><div class="info"><strong>Tournament</strong><small>One-on-one against the town champion. Win 45g and renown.</small></div><div class="acts"><button class="btn sm" type="button" data-act="tourney"'+(P.gold<10?' disabled':'')+'>Enter 10g</button></div></div>')+
      (!t.T.broker?'':'<div class="row"><div class="info"><strong>Ransom broker</strong><small>'+(prisonerCount()?'Sell your '+prisonerCount()+' prisoners':'Buys prisoners you bring in')+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="ransom"'+(prisonerCount()?'':' disabled')+'>Ransom '+ransomValue()+'g</button></div></div>')+
      Object.keys(COMPS).filter(id=>COMPS[id].town===t.name&&!P.comps[id]).map(id=>{const c=COMPS[id],quote=recruitment.quoteCompanion(t,id);return '<div class="row"><div class="info"><strong>'+c.n+'</strong><small>'+c.d+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="hire-comp" data-arg="'+id+'"'+(!quote.ok?' disabled title="'+recruitmentWhy(quote)+'"':'')+'>Hire '+c.cost+'g</button></div></div>'}).join('')+
      (!t.T.contract||t.owner==='player'?'':P.fac===t.owner?'<div class="row"><div class="info"><strong>Your contract</strong><small>The '+f.n+' pays you 1 gold per troop each day.</small></div><div class="acts"><button class="btn sm" type="button" data-act="end-contract">End contract</button></div></div>'
        :P.fac?'':'<div class="row"><div class="info"><strong>Mercenary contract</strong><small>Serve the '+f.n+' for 1 gold per troop each day. Their enemies become yours.</small></div><div class="acts"><button class="btn sm" type="button" data-act="contract">Sign</button></div></div>')+
      '<p class="muted">Rumor: '+(enemiesOf(t.owner).length?'the '+f.n+' is at war with the '+enemiesOf(t.owner).map(g=>FACS[g].n).join(' and the ')+'.':'the '+f.n+' is at peace.')+'</p>'+'<p class="muted">Bandit camps sit near '+[...new Set(camps().filter(c=>!c.cleared).map(c=>nearestOf(c,TOWNS).name))].join(', ')+'.'+(mostWanted(1).map(w=>' The most wanted is '+chiefLabel(w.c)+(w.near?', last seen near '+w.near.name:'')+': '+bountyOf(w.c)+' gold on his head.').join(''))+(mythicNews('was seen')?' '+mythicNews('was seen'):'')+'</p>';
  }
  showPanel('<div class="top"><h2>'+t.name+'</h2><span class="gold">'+P.gold+' gold</span></div><p class="muted">Held by the <span style="color:'+f.col+'">'+f.n+'</span>. Folk: '+t.races.map(r=>RACES[r].n).join(', ')+(resText(t)?' · Its land yields '+resText(t):'')+' · '+(t.pop||0)+' people · prosperity '+Math.round(t.pros||0)+'%'+(t.stock&&foodDays(t)<3?' · <span class="bad">hungry</span>':'')+'. Garrison '+t.gar+(lordsInside(t).length?', with '+lordsInside(t).map(l=>l.name+' and '+l.troops.length+' soldiers').join(', ')+' inside':'')+'. '+WALL_N[wallOf(t)]+'. Estates: '+estateLine(t)+'.'+(besieged(t)?' <span class="bad">Under siege.</span>':'')+(until(t,'sacked')?' <span class="bad">Sacked: ruined for '+(t.sacked-G.day)+' more days.</span>':until(t,'raided')?' <span class="bad">Raided: ruined for '+(t.raided-G.day)+' more days.</span>':until(t,'turmoil')?' <span class="gold">In turmoil after changing hands.</span>':'')+' '+t.note+'</p>'+(G.town.inScene?'':'<div class="btns">'+(hasScene(t)?'<button class="btn" type="button" data-act="scene-enter">'+SCENES[t.T.scene].hint+'</button>':'')+(P.stay&&P.stay.town===t.name?'<button class="btn" type="button" data-act="sy-leave">Leave '+t.label+'</button>':stayBtn(t))+'</div>')+'<div class="tabs">'+tabs.map(x=>'<button class="btn sm'+(x[0]===tab?' on':'')+'" type="button" data-act="tab" data-arg="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>'+(G.town.greet?'<p class="gold">'+G.town.greet+'</p>':'')+'<div>'+body+'</div>'+nav(null,['leave',null,G.town.inScene?'Back to the streets':P.stay&&P.stay.town===t.name?'Back to your lodgings':'Leave '+t.label]));G.town.greet=null;
  panel.classList.add('wide');// (a town's window is larger, on every tab: the unit cards beside the recruits)
}
function enterTown(t){G.lastTown=t;P.tx=null;G.town={ref:t,tab:P.quests.some(q=>canReportAt(q,t)&&questReady(q))?'jobs':'recruit'};G.mode='town';log('You enter '+t.name+'.');questArrive(t);renderTown()}
