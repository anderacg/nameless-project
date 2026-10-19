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
  return '<div class="lab">Stores · '+gs.filter(g=>(t.stock[g]||0)>=1).length+' goods · room for '+cap+' of each</div><p class="muted" style="font-size:13px">'+(own?'Your castle’s stockpile. Put goods in for safe keeping or take out what you need. Nothing is bought or sold here.':
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
/* a town window's own actions, which have no prefix (tab, bld, rec-pick, hire, train, contract, ransom, buy-gear, buy, sell, tourney …):
   act() (input.js) hands them here with the town t, once no prefix, menu, encounter or hero action took them. A fief's actions first (siege.js), then
   the places: tab opens one (home: the overview), bld one of your holding's buildings (townui.js); recruits and training,
   contracts, the ransom broker, the smith, stable and market, the tournament, a talk with a lord in the hall. The window redraws where it was scrolled
   (window.js showRail), the focus back on the button pressed */
function townAct(a,arg,t){
  const keep=panel.scrollTop;
  if(a==='plan-siege'){G.town=null;hidePanel();G.mode='world';return openSiege(t)}
  if(a==='hall-talk')return peopleTalk('l:'+arg);
  // (an action that needs a choice, or cannot be undone: its picker or its confirm first, window.js; Confirm sends the act)
  if(a==='ransom-pick')return railPicker({title:'Ransom prisoners',sub:'The ransom broker of '+t.name,total:'The broker pays',unit:'g',confirm:['ransom','Ransom'],back:['tab','tavern','Back'],
    items:Object.keys(P.prisoners).filter(k=>P.prisoners[k]>0).map(k=>({id:k,name:ST[k].n,sub:'Tier '+ST[k].tier+' · '+RANSOM[ST[k].tier]+'g each',pic:portrait(k),max:P.prisoners[k],unit:RANSOM[ST[k].tier]}))});
  if(a==='train-pick'){const [k,to]=String(arg).split(':'),n=Math.max(1,txpReady(k)),c=trainCost(to);return railPicker({title:'Train '+ST[k].n+' → '+ST[to].n,sub:t.name,total:'It costs',unit:'g',confirm:['train','Train'],back:['tab','recruit','Back'],sel:{[k]:1},encode:sel=>k+':'+to+':'+(sel[k]||0),
    items:[{id:k,name:ST[k].n+' → '+ST[to].n,sub:c+'g each · '+txpReady(k)+' of '+P.troops[k]+' ready',pic:portrait(to),max:Math.min(n,Math.floor(P.gold/Math.max(1,c))||1),unit:c}]})}
  if(a==='siege-ask'){const def=siegeDefenders(t),ep=rating(def.list,siegeLv(t)),pp=partyPower(),f=FACS[t.owner];return railConfirm({title:'Attack '+t.name+'?',sub:cap1(t.label)+' of the '+f.n,text:hostileTo(t.owner)?'The '+f.n+' is already your enemy.':'<span class="bad">Attacking makes the '+f.n+' hostile to you for 60 days and costs 20 honor with them.</span>',
    facts:['Defenders’ power '+ep+' vs yours '+pp,'Garrison '+t.gar+(def.lords.length?', with '+def.lords.map(l=>l.name).join(' and ')+' inside':''),walled(t)?'You will need a siege camp: ladders take '+LADDER_DAYS+' days.':'You can raid it or seize it.'],confirm:['plan-siege',null,'Plan the attack'],back:['tab','home','Back']})}// (a lord holding court: his own talk, Leave back here: peopledrawer.js)
  if(fiefAct(a,arg,t)){}
  else if(a==='qty')G.town.qty=+arg===5?5:1;// (the window's ×1 / ×5: its Buy and Sell)
  else if(a==='tab'){G.town.tab=arg==='home'?null:arg;G.town.bld=null;G.town.direct=false;G.town.greet=null}
  else if(a==='bld'){G.town.tab='fief';G.town.bld=arg;G.town.direct=false;G.town.greet=null}
  else if(a==='rec-pick'){G.town.pick=arg;G.town.review=null;G.town.recruitNotice=''}
  else if(['rec-review','rec-confirm','rec-cancel'].includes(a))townRecruitAction(a);
  else if(a==='hire'){const result=recruitment.hire(t,arg,1,G.town.pick===arg?G.town.hireTarget:undefined);if(result.ok&&result.target==='new'&&G.town.pick===arg)G.town.hireTarget=G.recruitTarget;recruitmentFeedback(result,t)}
  else if(a==='train'){const [k,to,ns]=String(arg).split(':');for(let i=0;i<Math.max(1,+ns||1);i++){const r=recruitment.train(t,k,to);recruitmentFeedback(r,t);if(!r.ok)break}}// (k:to, or k:to:n from its picker)
  else if(a==='contract'){if(!P.fac){P.fac=t.owner;delete P.hostile[t.owner];log('You sign on with the '+FACS[t.owner].n+'. Their enemies are now yours.','gold')}}
  else if(a==='end-contract'){if(P.fac===t.owner){P.fac=null;log('You end your contract with the '+FACS[t.owner].n+'.')}}
  else if(a==='hire-comp')recruitmentFeedback(recruitment.hireCompanion(t,arg),t);
  else if(a==='ransom'){const pick=arg?Object.fromEntries(String(arg).split(',').map(x=>x.split(':')).filter(([k,n])=>ST[k]&&P.prisoners[k]>0).map(([k,n])=>[k,Math.min(P.prisoners[k],Math.max(0,Math.floor(+n)||0))])):{...P.prisoners},n=Object.values(pick).reduce((a,b)=>a+b,0),v=Object.keys(pick).reduce((a,k)=>a+pick[k]*RANSOM[ST[k].tier],0);
    if(n){P.gold+=v;log('The broker pays '+v+' gold for '+n+' prisoners.','gold');for(const k in pick){P.prisoners[k]-=pick[k];if(P.prisoners[k]<=0)delete P.prisoners[k]}mood('ransom')}}// (all of them, or kind:n,… from its picker)
  else if(a==='buy-gear'){const st=smithStock(t),id=st[+arg];if(id&&P.gold>=gearPrice(id)&&invAdd('gear',id,1)){P.gold-=gearPrice(id);st.splice(+arg,1);addRep(t.name,ITEMS[id].v/120,true);log('You buy the '+ITEMS[id].n+'.','gold')}}
  else if(a==='buy-ammo'){const [g,ns]=arg.split(':'),n=+ns;if(GOODS[g]&&GOODS[g].ammo){const r=buyGoods(t,g,n);if(r.got)log('You buy '+r.got+' '+GOODS[g].n.toLowerCase()+'.');else log('The smith has no '+GOODS[g].n.toLowerCase()+' to sell.','bad')}}
  else if(a==='buy-mount'){const id=arg,p=gearPrice(id);if(stableStock(t).includes(id)&&canBuyMount(t,id)&&P.gold>=p&&P.gear.mount!==id){
    if(!P.gear.mount){P.gear.mount=id;P.gold-=p;fitInv();log('You buy a '+ITEMS[id].n+' and ride it out of the stable.','gold')}
    else if(invAdd('gear',id,1)){P.gold-=p;log('You buy a '+ITEMS[id].n+'. Swap mounts in your inventory.','gold')}}}
  else if(a==='sell-loot'){const x=P.inv[+arg];if(x&&x.k==='mat'){const g=matPrice(x.id)*x.n;P.gold+=g;P.inv[+arg]=null;train('trade',g/20);log('You sell '+x.n+' '+MATS[x.id].n.toLowerCase()+(x.n>1?'s':'')+' for '+g+' gold.','gold')}}
  else if(a==='sell-item'){const x=P.inv[+arg];if(x&&x.k==='gear'){const g=itemPrice(x.id);P.gold+=g;P.inv[+arg]=null;train('trade',g/20);log('You sell the '+ITEMS[x.id].n+' for '+g+' gold.','gold')}}
  else if(a==='buy'||a==='sell'){const [g,nStr]=arg.split(':');let n=+nStr;
    if(a==='buy'){const r=buyGoods(t,g,n);if(r.got)addRep(t.name,r.spent/60,true)}
    else{const r=sellGoods(t,g,n);train('trade',r.earned/20);addRep(t.name,r.earned/60,true)}}
  else if(a==='tourney'){if(P.gold>=10){P.gold-=10;updateHUD(true);return startBattle({enemies:['chief'],tournament:true})}}
  if(!G.town)return;// (placing a new building: out on the map)
  updateHUD(true);renderTown();panel.scrollTop=keep;
  if(a==='rec-pick')panel.querySelector('.recruit-order')?.scrollIntoView({block:'nearest'});
  if(a==='rec-review'&&G.town.review){panel.querySelector('[data-act="rec-confirm"]')?.focus();return}
  railFocus(a,arg);
}
// attacking the whole holding: its defenders against you, and the way out to plan it (also on its overview: townui.js)
function siegeBody(t){const f=FACS[t.owner];const def=siegeDefenders(t),lv=siegeLv(t),ep=rating(def.list,lv),pp=partyPower(),r=ep/Math.max(1,pp);
  return '<div class="lab">Attack '+t.name+'</div><p>Garrison '+t.gar+(def.lords.length?', with '+def.lords.map(l=>l.name).join(' and ')+' inside':'')+'. '+(!walled(t)?''+(wallOf(t)?WALL_N[wallOf(t)]+': its militia fights as level '+lv+'. ':'It has no walls. ')+'You can raid it or seize it.':WALL_N[wallOf(t)]+' make every defender as strong as level '+lv+'. You will need a siege camp: ladders take '+LADDER_DAYS+' days, a ram '+RAM_DAYS+'.')+'</p>'+
      '<p class="'+(hostileTo(t.owner)?'muted':'bad')+'">'+(hostileTo(t.owner)?'The '+f.n+' is already your enemy.':'Attacking makes the '+f.n+' hostile to you for 60 days and costs 20 honor with them.')+'</p>'+
      railKeyActions([{icon:'ladder',label:'Attack',act:'siege-ask',facts:[(r<.6?'Easy':r<1?'Even':r<1.5?'Risky':'Deadly')+' · power '+ep+' vs '+pp,walled(t)?'a siege camp: ladders '+LADDER_DAYS+' days':'raid or seize it'],tip:'Leave the gates and plan an attack'}])}
// the town's window (townui.js showTown): the rail of its places, and the place open: G.town.tab (none: the overview)
function renderTown(){
  const t=G.town.ref,tab=G.town.tab,cap=partyCap(),cnt=partySize(),f=FACS[t.owner];
  const kind=s=>s.range?'ranged':s.charge?'mounted charge':'melee';
  let body='';
  const closed=until(t,'sacked')?'sacked':until(t,'raided')?'raided':null;
  if(!tab||tab==='fief'&&t.owner!=='player')body=townOverview(t);
  else if(tab==='fief')body=G.town.bld?bldBody(t,G.town.bld):fiefBody(t);
  else if(tab==='hall')body=hallBody(t);
  else if(tab==='tourney')body=tourneyBody(t);
  else if(tab==='garrison')body=garrisonBody(t);
  else if(tab==='stores')body=storesBody(t);
  else if(tab==='jobs')body=jobsBody(t);
  else if(tab==='siege')body=siegeBody(t);
  else if(tab==='recruit'&&(closed||until(t,'turmoil')))body='<p class="muted">'+(closed?'No one here will take up arms: '+t.name+' was '+closed+' and is still burying its dead.':t.name+' is in turmoil after changing hands. No one will enlist for '+(t.turmoil-G.day)+' more days.')+'</p>';
  else if((tab==='smith'||tab==='stable')&&closed)body='<p class="muted">The '+(tab==='smith'?'smithy':'stable')+' was burned when '+t.name+' was '+closed+'. It reopens in '+(t[closed]-G.day)+' days.</p>';
  else if(tab==='recruit'){
    const hires=t.races.flatMap(r=>t.hires(r));
    const ups=t.T.train?Object.keys(P.troops).filter(k=>P.troops[k]>0&&UP[k]).flatMap(k=>UP[k].map(to=>[k,to])):[];
    // (the unit picked for the card: a hire, or a training as from>to; the first hire until you pick)
    let pick=G.town.pick;if(!pick||!(hires.includes(pick)||ups.some(([k,to])=>pick===k+'>'+to)))pick=hires[0]||(ups[0]&&ups[0].join('>'))||null;
    const v=Math.floor(t.vol||0),no=q=>q.ok?'':recruitmentWhy(q)||'Not available';
    // (a card for each kind they raise here, and each training: a click picks it for the order and the unit's card beside)
    const hireCards=hires.map(k=>{const s=ST[k],quote=recruitment.quoteHire(t,k);return {pic:portrait(k),name:glyphSVG(iconOfType(k),14)+' '+s.n,role:'Tier '+s.tier+(s.race?' · '+RACES[s.race].n:'')+' · '+s.hp+' hp · '+kind(s),
      facts:[[v+' willing',v?'':'bad'],'You lead ×'+(P.troops[k]||0),canHire(t,k)?'':['Needs standing '+needFor(k),'bad']],acts:[['hire',k,'Hire 1 · '+quote.cost+'g',no(quote)]],pick:['rec-pick',k],sel:pick===k}});
    const trainCards=ups.map(([k,to])=>{const quote=recruitment.quoteTraining(t,k,to),s=ST[to],r=txpReady(k);return {pic:portrait(to),name:glyphSVG(iconOfType(to),14)+' '+ST[k].n+' → '+s.n,role:'Tier '+s.tier+' · '+s.hp+' hp · '+s.dmg+' damage · '+(s.range?'range '+s.range:'reach '+s.reach),
      facts:[[r?r+' of '+P.troops[k]+' ready':'Experience '+Math.floor(txpOf(k))+' / '+txpNeed(k)+' to train one',r?'gold':''],'You lead ×'+P.troops[k],quote.cost+'g each'],acts:[['train-pick',k+':'+to,'Train',quote.ok?'':quote.code==='experience'?'Needs '+txpNeed(k)+' XP: fight with them':no(quote)]],pick:['rec-pick',k+'>'+to],sel:pick===k+'>'+to}});
    body='<div class="top"><span class="lab">Hire '+t.races.map(r=>RACES[r].n).join(' and ')+' troops ('+cnt+' / '+cap+')</span><span class="lab">Your standing here <b class="gold" style="font-size:14px">'+standingAt(t)+'</b></span></div>'+'<p class="muted" style="font-size:13px" title="Standing is your reputation here ('+Math.round(repAt(t.name))+'), half your honor with the '+FACS[t.owner].n+' ('+honorWith(t.owner)+')'+(t.races.includes(P.race)?', and +'+RACE_TRUST+' because your people live here':'')+'.">Tier 1 needs standing '+REP_NEED[1]+', tier 2 needs '+REP_NEED[2]+' · volunteers here: <b>'+v+'</b> · click a unit for its card.</p>'+(pick?townRecruitControls(t,pick):'')+
      '<div class="recwrap"><div class="reclist">'+railCards(hireCards)+'<p class="muted" style="font-size:12px">More volunteers come forward each day as the '+t.label+' grows and prospers.</p>'+
      (t.T.train?'<div class="lab" style="margin-top:6px">Train (troop trees)</div>'+(trainCards.length?railCards(trainCards):'<p class="muted">None of your troops can train further.</p>'):'')+'</div><div class="reccard">'+(pick?unitCard(pick.split('>').pop(),pick.includes('>')?pick.split('>')[0]:null):'')+'</div></div>';
  }else if(tab==='smith'){
    const st=smithStock(t),q=G.town.qty||1;
    body=railCards([{pic:personPic('smith',t.races[0]),name:'The smith',role:'At the forge of '+t.name,facts:[st.length?st.length+' pieces for sale':'Sold out','New stock in '+(7-(G.day-W.shops[t.name].day)%7)+' days'],
      note:forgeText(t)+' Bring copper and tin, silver, gold, mithril or adamantite to its market and the smith will forge with them.'}])+'<div class="lab">For sale</div>'+(st.length?st.map((id,i)=>{const I=ITEMS[id],p=gearPrice(id);
      return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+I.n+'</strong><small>'+SLOTS[I.slot]+' · '+I.d+'</small><small class="diff">'+(gearDiff(id).join(' · ')||'<span class="muted">No change from what you wear.</span>')+'</small></div><div class="acts">'+railBtn('buy-gear',i,'Buy',P.gold<p?'Not enough gold':!invFree()?'Your bag is full':'')+'</div><span class="own gold">'+p+'g</span></div>'}).join('')
      :'<p class="muted">Sold out until the next delivery.</p>')+
      '<div class="lab lab-qty" style="margin-top:6px"><span>Ammunition · 10 a bundle</span>'+railQty(q,'qty')+'</div>'+['arrows','bolts'].map(g=>{const p=buyP(t,g),n=10*q;return railRow(GOODS[g].n,p+'g each · '+(t.stock&&t.stock[g]||0)+' in stock · you have '+goodN(g)+' · '+n+' for '+p*n+'g',railBtn('buy-ammo',g+':'+n,'Buy',P.gold<p*n?'Not enough gold':goodRoom(g)<n?'No room in your bag':''))}).join('');
  }else if(tab==='stable'){
    const cur=mountDef();
    body=railCards([{pic:personPic('groom',t.races[0]),name:'The stablemaster',role:'Mounts for sale',facts:[stableStock(t).length+' mounts',cur?'You ride a '+cur.n:'You travel on foot'],
      note:'A mount goes in its own slot and speeds your travel. Rare beasts need standing '+REP_NEED[2]+' here (yours: '+standingAt(t)+').'}])+'<div class="lab">In the stalls</div>'+
      stableStock(t).map(id=>{const I=ITEMS[id],p=gearPrice(id),ok=canBuyMount(t,id),own=P.gear.mount===id;
        return '<div class="row"><div class="info"><strong style="color:'+RARITY[I.r]+'">'+I.n+'</strong><small>'+I.d+'</small><small class="diff">'+(gearDiff(id).join(' · ')||'<span class="muted">No change from your mount.</span>')+'</small></div><div class="acts">'+(ok?'':'<small class="bad">Needs standing '+REP_NEED[2]+'</small>')+
          railBtn('buy-mount',id,own?'Riding':'Buy',own?'You ride it':!ok?'Needs standing '+REP_NEED[2]:P.gold<p?'Not enough gold':P.gear.mount&&!invFree()?'Your bag is full':'')+'</div><span class="own gold">'+p+'g</span></div>'}).join('');
  }else if(tab==='trade'){
    ensureEcon(t);const q=G.town.qty||1,goods=Object.keys(GOODS).filter(k=>(t.stock[k]||0)>0||goodN(k)>0||needOf(t,k)>.05);
    const scarce=Object.keys(GOODS).filter(g=>marketState(t,g)==='shortage');
    body=railCards([{pic:personPic('merchant',t.races[0]),name:'The merchants',role:'Stalls of '+t.name,facts:[scarce.length>1?[scarce.length+' goods scarce','bad']:scarce.length?['Short of '+GOODS[scarce[0]].n.toLowerCase(),'bad']:'Prices fair','Your bag '+(P.inv.length-invFree())+' / '+P.inv.length+' slots'],
      note:'Every unit you buy or sell moves the price.'}])+'<div class="lab lab-qty"><span>Goods</span>'+railQty(q,'qty')+'</div>'+goods.map(k=>{const p=buyP(t,k),s=sellP(t,k),room=goodRoom(k),n=goodN(k),st=t.stock[k]||0,ms=marketState(t,k);
      return railRow(GOODS[k].n+(ms?' <span class="'+(ms==='shortage'?'bad':'good')+'" style="font-size:12px">'+cap1(ms)+'</span>':''),'Buy '+p+'g · Sell '+s+'g · '+st+' in the market · '+GOODS[k].stack+' per slot',
        railBtn('buy',k+':'+q,'Buy',P.gold<p*q?'Not enough gold':room<q?'No room in your bag':st<q?'The market has '+st:'')+railBtn('sell',k+':'+q,'Sell',n<q?'You have '+n:''),'×'+n)}).join('');
    const stock=P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k!=='good'&&x.k!=='letter');// (a letter is sold on its own page: world/letters.js)
    if(stock.length)body+='<div class="lab" style="margin-top:6px">From your inventory</div>'+stock.map(([x,i])=>x.k==='mat'
      ?'<div class="row"><div class="info"><strong>'+MATS[x.id].n+'</strong><small>Trophy · '+matPrice(x.id)+'g each</small></div><span class="own">×'+x.n+'</span><div class="acts">'+railBtn('sell-loot',i,'Sell')+'</div><span class="own gold">'+matPrice(x.id)*x.n+'g</span></div>'
      :'<div class="row"><div class="info"><strong style="color:'+RARITY[ITEMS[x.id].r]+'">'+ITEMS[x.id].n+'</strong><small>'+SLOTS[ITEMS[x.id].slot]+' · '+ITEMS[x.id].d+'</small></div><div class="acts">'+railBtn('sell-item',i,'Sell')+'</div><span class="own gold">'+itemPrice(x.id)+'g</span></div>').join('');
  }else{
    const here=P.stay&&P.stay.town===t.name,why=stayWhy(t),race=t.races[0];
    // the people in it: the innkeeper (lodgings), the ransom broker, the companions waiting for work
    body=railCards([{pic:personPic('innkeeper',race),name:'The innkeeper',role:'Lodgings',facts:[here?['Your band is staying here','good']:stayFree(t)?['Free: they know you here','good']:stayCost()+'g a day'],
        note:here?'Your band is staying here: '+(stayFree(t)?'free, as long as you like':stayCost()+'g a day, your gold lasts until Day '+stayUntil())+'.':'Stay and let the days pass: you recover four times as fast, morale rises, the wounded heal twice as fast. '+(why||(stayFree(t)?'':'5g, and 1g for every 2 of your people.'))+' Food for the road: the market.',
        acts:[here?['sy-leave',null,'Leave']:['sy-stay',t.name,'Stay',why]]},
      t.T.broker&&{pic:personPic('merchant',race,1),name:'The ransom broker',role:'Buys prisoners you bring in',facts:[prisonerCount()?prisonerCount()+' prisoners with you':'No prisoners with you',prisonerCount()?['Worth '+ransomValue()+'g','gold']:''],acts:[['ransom-pick',null,'Ransom',prisonerCount()?'':'No prisoners']]},
      ...compsHere(t).map(id=>{const c=COMPS[id],quote=recruitment.quoteCompanion(t,id);return {pic:portrait(id),name:c.n,role:'Companion, looking for work',note:c.d,acts:[['hire-comp',id,'Hire '+c.cost+'g',quote.ok?'':recruitmentWhy(quote)||'Not available']]}})])+
      '<div class="lab">Rumours</div><p class="muted">Rumor: '+(enemiesOf(t.owner).length?'the '+f.n+' is at war with the '+enemiesOf(t.owner).map(g=>FACS[g].n).join(' and the ')+'.':'the '+f.n+' is at peace.')+'</p>'+'<p class="muted">Bandit camps sit near '+[...new Set(camps().filter(c=>!c.cleared).map(c=>nearestOf(c,TOWNS).name))].join(', ')+'.'+(mostWanted(1).map(w=>' The most wanted is '+chiefLabel(w.c)+(w.near?', last seen near '+w.near.name:'')+': '+bountyOf(w.c)+' gold on his head.').join(''))+(mythicNews('was seen')?' '+mythicNews('was seen'):'')+'</p>';
  }
  showTown(t,body);G.town.greet=null;
}
// (a quest to report here: straight to the Notices, Back to the overview; else the overview)
function enterTown(t){G.lastTown=t;P.tx=null;G.town={ref:t,tab:P.quests.some(q=>canReportAt(q,t)&&questReady(q))?'jobs':null};G.mode='town';log('You enter '+t.name+'.');questArrive(t);renderTown()}
