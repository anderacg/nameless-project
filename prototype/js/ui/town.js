'use strict';
/* ---------- economy ---------- */
// prices come from each market's stock against its needs (economy.js); these are the next unit's
const price=(town,good)=>marketPrice(town,good);
const buyP=(t,g)=>nextBuy(t,g);
const sellP=(t,g)=>nextSell(t,g);
const matPrice=k=>Math.round(MATS[k].v*(.75+.01*skill('trade')));
const itemPrice=id=>Math.round(ITEMS[id].v*(.6+.01*skill('trade')));
// a smith's stock: 6 pieces; best tier grows every 15 days, castles forge one tier higher
function smithStock(t){
  W.shops=W.shops||{};const sh=W.shops[t.name];
  if(!sh||G.day-sh.day>=7){const top=Math.min(MATERIALS.length-1,1+Math.floor(G.day/15)+(t.kind==='castle'?1:0));W.shops[t.name]={day:G.day,items:Array.from({length:6},()=>randomGear(Math.max(0,top-2),top))}}
  return W.shops[t.name].items;
}
// a stable's mounts: commons everywhere, horses in towns, rare beasts by the folk who live there or the land around
function stableStock(t){const clim=climAt(t.x,t.y);return Object.keys(MOUNTS).filter(k=>{const M=MOUNTS[k];if(M.drop)return false;if(M.where==='any')return true;if(t.kind==='village')return false;
  if(M.where==='town')return true;if(M.where==='castle')return t.kind==='castle';if(M.race)return t.races.includes(M.race);return M.clim===clim}).map(k=>'m_'+k)}
const canBuyMount=(t,id)=>ITEMS[id].r==='common'||standingAt(t)>=REP_NEED[2];
const gearPrice=id=>Math.round(ITEMS[id].v*(1.2-.01*skill('trade')));
const ransomValue=()=>Object.keys(P.prisoners).reduce((a,k)=>a+P.prisoners[k]*RANSOM[ST[k].tier],0);
function renderTown(){
  const t=G.town.ref,tab=G.town.tab,village=t.kind==='village',castle=t.kind==='castle',cap=partyCap(),cnt=partySize(),f=FACS[t.owner];
  const tabs=castle?[['recruit','Recruit'],['smith','Smith'],['stable','Stable'],['jobs','Jobs']]:village?[['recruit','Recruit'],['trade','Trade'],['stable','Stable'],['jobs','Jobs'],['tavern','Tavern']]:[['recruit','Recruit'],['trade','Trade'],['smith','Smith'],['stable','Stable'],['jobs','Jobs'],['tavern','Tavern']];
  if(t.owner==='player')tabs.unshift(['fief','Fief']);
  // any holding that is not yours or your employer's can be attacked from its own tab
  if(t.owner!=='player'&&P.fac!==t.owner)tabs.push(['siege','Besiege']);
  const kind=s=>s.range?'ranged':s.charge?'mounted charge':'melee';
  let body='';
  const closed=until(t,'sacked')?'sacked':until(t,'raided')?'raided':null;
  if(tab==='fief'&&t.owner==='player')body=fiefBody(t);
  else if(tab==='jobs')body=jobsBody(t);
  else if(tab==='siege'){const def=siegeDefenders(t),lv=siegeLv(t),ep=rating(def.list,lv),pp=partyPower(),r=ep/Math.max(1,pp);
    body='<div class="lab">Attack '+t.name+'</div><p>Garrison '+t.gar+(def.lords.length?', with '+def.lords.map(l=>l.name).join(' and ')+' inside':'')+'. '+(t.kind==='village'?''+(wallOf(t)?WALL_N[wallOf(t)]+': its militia fights as level '+lv+'. ':'It has no walls. ')+'You can raid it or seize it.':WALL_N[wallOf(t)]+' make every defender as strong as level '+lv+'. You will need a siege camp: ladders take '+LADDER_DAYS+' days, a ram '+RAM_DAYS+'.')+'</p>'+
      '<p>Defenders&rsquo; power <strong>'+ep+'</strong> vs yours <strong>'+pp+'</strong> · <strong class="'+(r<.6?'good':r<1?'gold':'bad')+'">'+(r<.6?'Easy':r<1?'Even':r<1.5?'Risky':'Deadly')+'</strong></p>'+
      '<p class="'+(hostileTo(t.owner)?'muted':'bad')+'">'+(hostileTo(t.owner)?'The '+f.n+' is already your enemy.':'Attacking makes the '+f.n+' hostile to you for 60 days and costs 20 honor with them.')+'</p>'+
      '<div class="btns"><button class="btn primary" type="button" data-act="plan-siege">Leave the gates and plan an attack</button></div>'}
  else if(tab==='recruit'&&(closed||until(t,'turmoil')))body='<p class="muted">'+(closed?'No one here will take up arms: '+t.name+' was '+closed+' and is still burying its dead.':t.name+' is in turmoil after changing hands. No one will enlist for '+(t.turmoil-G.day)+' more days.')+'</p>';
  else if((tab==='smith'||tab==='stable')&&closed)body='<p class="muted">The '+(tab==='smith'?'smithy':'stable')+' was burned when '+t.name+' was '+closed+'. It reopens in '+(t[closed]-G.day)+' days.</p>';
  else if(tab==='recruit'){
    const hires=t.races.flatMap(r=>{const c=RACES[r];return village?[c.melee]:castle?[c.melee,c.ranged,c.horse]:[c.melee,c.ranged]});
    body='<div class="top"><span class="lab">Hire '+t.races.map(r=>RACES[r].n).join(' and ')+' troops ('+cnt+' / '+cap+')</span><span class="lab">Your standing here <b class="gold" style="font-size:14px">'+standingAt(t)+'</b></span></div>'+'<p class="muted" style="font-size:13px">Tier 1 needs '+REP_NEED[1]+', tier 2 needs '+REP_NEED[2]+'. Standing is your reputation here ('+Math.round(repAt(t.name))+'), half your honor with the '+FACS[t.owner].n+' ('+honorWith(t.owner)+')'+(t.races.includes(P.race)?', and +'+RACE_TRUST+' because your people live here':'')+'.</p>'+hires.map(k=>{const s=ST[k];return '<div class="row"><div class="info"><strong>'+s.n+'</strong><small>Tier '+s.tier+(s.race?' · '+RACES[s.race].n:'')+' · '+s.hp+' hp · '+kind(s)+'</small><small class="vs">'+vsLine(s)+'</small></div><span class="own">×'+(P.troops[k]||0)+'</span><div class="acts">'+(canHire(t,k)?'':'<small class="bad">Needs standing '+needFor(k)+'</small>')+'<button class="btn sm" type="button" data-act="hire" data-arg="'+k+'"'+(P.gold<hireCost(k)||cnt>=cap||!canHire(t,k)||(t.vol||0)<1?' disabled':'')+'>Hire '+hireCost(k)+'g</button></div></div>'}).join('')+'<p class="muted" style="font-size:13px">Volunteers here: <b>'+Math.floor(t.vol||0)+'</b>. More come forward each day as the '+t.kind+' grows and prospers.</p>';
    if(!village){
      const ups=Object.keys(P.troops).filter(k=>P.troops[k]>0&&UP[k]).flatMap(k=>UP[k].map(to=>[k,to]));
      body+='<div class="lab" style="margin-top:6px">Train (troop trees)</div>'+(ups.length?ups.map(([k,to])=>{const c=trainCost(to),s=ST[to];return '<div class="row"><div class="info"><strong>'+ST[k].n+' → '+s.n+'</strong><small>Tier '+s.tier+' · '+s.hp+' hp · '+s.dmg+' damage · '+(s.range?'range '+s.range:'reach '+s.reach)+'</small><small class="vs">'+vsLine(s)+'</small></div><span class="own">×'+P.troops[k]+'</span><div class="acts"><button class="btn sm" type="button" data-act="train" data-arg="'+k+':'+to+'"'+(P.gold<c?' disabled':'')+'>Train '+c+'g</button></div></div>'}).join(''):'<p class="muted">None of your troops can train further.</p>');
    }
  }else if(tab==='smith'){
    const st=smithStock(t);
    body='<div class="lab">Smith · new stock in '+(7-(G.day-W.shops[t.name].day)%7)+' days</div>'+(st.length?st.map((id,i)=>{const I=ITEMS[id],p=gearPrice(id);
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
    body='<div class="row"><div class="info"><strong>Rest at the inn</strong><small>Restores your health, stamina and mana. Morale +15</small></div><div class="acts"><button class="btn sm" type="button" data-act="rest"'+(P.gold<5?' disabled':'')+'>5g</button></div></div>'+
      (village?'':'<div class="row"><div class="info"><strong>Tournament</strong><small>One-on-one against the town champion. Win 45g and renown.</small></div><div class="acts"><button class="btn sm" type="button" data-act="tourney"'+(P.gold<10?' disabled':'')+'>Enter 10g</button></div></div>')+
      (village?'':'<div class="row"><div class="info"><strong>Ransom broker</strong><small>'+(prisonerCount()?'Sell your '+prisonerCount()+' prisoners':'Buys prisoners you bring in')+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="ransom"'+(prisonerCount()?'':' disabled')+'>Ransom '+ransomValue()+'g</button></div></div>')+
      Object.keys(COMPS).filter(id=>COMPS[id].town===t.name&&!P.comps[id]).map(id=>{const c=COMPS[id];return '<div class="row"><div class="info"><strong>'+c.n+'</strong><small>'+c.d+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="hire-comp" data-arg="'+id+'"'+(P.gold<c.cost||cnt>=cap?' disabled':'')+'>Hire '+c.cost+'g</button></div></div>'}).join('')+
      (village||t.owner==='player'?'':P.fac===t.owner?'<div class="row"><div class="info"><strong>Your contract</strong><small>The '+f.n+' pays you 1 gold per troop each day.</small></div><div class="acts"><button class="btn sm" type="button" data-act="end-contract">End contract</button></div></div>'
        :P.fac?'':'<div class="row"><div class="info"><strong>Mercenary contract</strong><small>Serve the '+f.n+' for 1 gold per troop each day. Their enemies become yours.</small></div><div class="acts"><button class="btn sm" type="button" data-act="contract">Sign</button></div></div>')+
      '<p class="muted">Rumor: '+(enemiesOf(t.owner).length?'the '+f.n+' is at war with the '+enemiesOf(t.owner).map(g=>FACS[g].n).join(' and the ')+'.':'the '+f.n+' is at peace.')+'</p>'+'<p class="muted">Bandit camps sit near '+[...new Set(CAMPS.filter(c=>!c.cleared).map(c=>nearestOf(c,TOWNS).name))].join(', ')+'.'+(mythicNews('was seen')?' '+mythicNews('was seen'):'')+'</p>';
  }
  showPanel('<div class="top"><h2>'+t.name+'</h2><span class="gold">'+P.gold+' gold</span></div><p class="muted">Held by the <span style="color:'+f.col+'">'+f.n+'</span>. Folk: '+t.races.map(r=>RACES[r].n).join(', ')+' · '+(t.pop||0)+' people · prosperity '+Math.round(t.pros||0)+'%'+(t.stock&&foodDays(t)<3?' · <span class="bad">hungry</span>':'')+'. Garrison '+t.gar+'. '+WALL_N[wallOf(t)]+'. Estates: '+estateLine(t)+'.'+(besieged(t)?' <span class="bad">Under siege.</span>':'')+(until(t,'sacked')?' <span class="bad">Sacked: ruined for '+(t.sacked-G.day)+' more days.</span>':until(t,'raided')?' <span class="bad">Raided: ruined for '+(t.raided-G.day)+' more days.</span>':until(t,'turmoil')?' <span class="gold">In turmoil after changing hands.</span>':'')+' '+t.note+'</p><div class="tabs">'+tabs.map(x=>'<button class="btn sm'+(x[0]===tab?' on':'')+'" type="button" data-act="tab" data-arg="'+x[0]+'">'+x[1]+'</button>').join('')+'</div><div>'+body+'</div><div class="btns"><button class="btn primary" type="button" data-act="leave">Leave '+t.kind+'</button></div>');
}
function enterTown(t){G.lastTown=t;P.tx=null;G.town={ref:t,tab:P.quests.some(q=>canReportAt(q,t)&&questReady(q))?'jobs':'recruit'};G.mode='town';log('You enter '+t.name+'.');questArrive(t);renderTown()}
