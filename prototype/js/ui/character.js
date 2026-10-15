'use strict';
/* ---------- character, party, perks ---------- */
function openChar(){if(G.mode!=='world'||G.modal)return;G.mode='char';if(!G.char||G.char==='gear')G.char='hero';renderChar()}
function renderChar(){
  const tab=G.char;let body='';
  if(tab==='hero'){
    body='<div class="lab">Attributes · raised on the skill tree (K)</div>'+Object.keys(ATTRS).map(k=>'<div class="row"><div class="info"><strong>'+ATTRS[k][0]+'</strong><small>'+ATTRS[k][1]+'</small></div><span class="own">'+P.attr[k]+'</span></div>').join('')+
      '<div class="lab" style="margin-top:6px">Skills</div><div class="row"><div class="info"><strong>'+(P.tp?'<span class="gold">'+P.tp+' skill point'+(P.tp>1?'s':'')+' to spend</span>':'Skill tree, skill bar and disciplines')+'</strong><small>'+(P.tree.length-1)+' skills learned. One skill point each level.</small></div><div class="acts"><button class="btn sm" type="button" data-act="open-skills">Open Skills (K)</button></div></div>'+
      (P.perks.length?'<div class="lab" style="margin-top:6px">Perks from before</div>'+P.perks.map(p=>'<div class="row"><div class="info"><strong>'+PERKS[p].n+'</strong><small>'+PERKS[p].d+'</small></div></div>').join(''):'');
  }else if(tab==='quests'){
    body='<div class="lab">Quests · '+P.quests.length+' / '+QUEST_MAX+'</div>'+questsBody();
  }else if(tab==='realms'){
    const sw=f=>'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>';
    body='<div class="lab">Your standing</div><p>'+(P.fac?'You serve the '+sw(P.fac)+' as a mercenary, for '+troopCount()+' gold a day.':'You are independent. Sign a mercenary contract in a town tavern.')+
      FIDS.filter(f=>!P.fac&&(P.hostile[f]||0)>G.day).map(f=>' The '+sw(f)+' is hostile to you until day '+P.hostile[f]+'.').join('')+'</p>'+
      (playerFiefs().length?'<div class="lab" style="margin-top:6px">Your fiefs</div>'+playerFiefs().map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.label+' · garrison '+t.gar+' · '+fiefIncome(t)+' gold a day'+(besieged(t)?' · <span class="bad">under siege</span>':'')+'</small></div></div>').join(''):'')+
      (P.siege?'<p class="gold">You are besieging '+P.siege.town+' (day '+P.siege.days+').</p>':'')+
      '<div class="lab" style="margin-top:6px">Your reputation</div><p class="muted" style="font-size:13px">Standing at a holding = local reputation + half your honor with its owner + '+RACE_TRUST+' where your race lives. Tier 1 recruits need '+REP_NEED[1]+', tier 2 need '+REP_NEED[2]+'.</p>'+
      TOWNS.slice().sort((a,b)=>standingAt(b)-standingAt(a)).map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.label+' · '+sw(t.owner)+' · local '+Math.round(repAt(t.name))+'</small></div><span class="own'+(standingAt(t)>=REP_NEED[1]?' gold':'')+'">'+standingAt(t)+'</span></div>').join('')+
      (mythicNews('roams')?'<p class="bad">'+mythicNews('roams')+'</p>':'')+'<div class="lab" style="margin-top:6px">Factions</div>'+FIDS.map(f=>{const own=fiefsOf(f),ls=W.lords.filter(l=>l.fac===f&&!l.dead);
        return '<div class="row"><div class="info"><strong>'+sw(f)+(W.dead[f]?' <span class="bad">· fallen</span>':'')+'</strong><small>'+FACS[f].d+'</small><small>Your honor: '+honorWith(f)+'</small><small>Lands: '+landsOf(f)+' tiles · treasury '+Math.round(treas(f))+' gold'+(econWeary(f)?' · <span class="bad">weary of war</span>':'')+'</small><small>Holds: '+(own.map(t=>t.name+(besieged(t)?' (under siege)':'')).join(', ')||'nothing')+'</small><small>Lords in the field: '+(ls.map(l=>l.name+' ('+l.troops.length+' troops, power '+rating(l.troops)+')').join(', ')||'none')+'</small></div></div>'}).join('')+
      '<div class="lab" style="margin-top:6px">Relations</div>'+FIDS.flatMap((a,i)=>FIDS.slice(i+1).map(b=>[a,b])).filter(([a,b])=>!W.dead[a]&&!W.dead[b]).map(([a,b])=>{const r=relOf(a,b);
        return '<div class="row"><div class="info"><strong>'+sw(a)+' · '+sw(b)+'</strong><small>'+(r.s==='war'?'<span class="bad">At war</span>':r.s==='ally'?'<span class="good">Allied</span>':'At peace')+(r.since?' since day '+r.since:'')+'</small></div></div>'}).join('');
  }else if(tab==='lords'){
    const ls=W.lords.filter(l=>!l.gone).sort((a,b)=>relWith(b)-relWith(a)),sw=f=>'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>';
    body='<p class="muted">How each lord feels about you. Fight beside them, do their work, spare them or give gifts to win them; beating, ransoming or failing them, or wronging their people, sours them, and their friends and rivals feel some of it. Friends (+'+RELATION.helpAt+') ride to help you, sworn friends (+'+RELATION.spareAt+') won\'t attack you, and those at +'+RELATION.troopsAt+' lend you soldiers.</p>'+
      ls.map(l=>{const why=(P.lrelWhy||{})[l.id]||[],fr=lordFriends(l).filter(o=>!o.dead).slice(0,2),rv=lordRivals(l).filter(o=>!o.dead).slice(0,2);
        return '<div class="row"><div class="info"><strong>'+l.name+' · '+sw(l.fac)+'</strong><small>'+(l.dead?'Beaten, raising a new army':l.inside?'In '+l.inside:l.fight?'In battle':l.state==='siege'?'Besieging '+l.tgt:'In the field')+' · '+l.troops.length+' soldiers'+(why.length?' · '+why[why.length-1].why:'')+'</small>'+
          ((fr.length||rv.length)?'<small>'+(fr.length?'Friends: '+fr.map(o=>o.name).join(', ')+'. ':'')+(rv.length?'Rivals: '+rv.map(o=>o.name).join(', ')+'.':'')+'</small>':'')+'</div><span class="own">'+relTag(relWith(l))+'</span></div>'}).join('');
  }else{
    const tr=Object.keys(P.troops).filter(k=>P.troops[k]>0);
    const total=partyPower(),parts=[['You','Level '+P.level+' hero',rating(['hero'])],...Object.keys(P.comps).map(id=>[COMPS[id].n,'Companion',rating([id])]),
      ...tr.map(k=>[ST[k].n,P.troops[k]+' × '+rating([k]),rating(Array(P.troops[k]).fill(k))])].sort((a,b)=>b[2]-a[2]);
    body='<div class="top"><span class="lab">Party power</span><span class="gold" style="font-size:22px">'+total+'</span></div>'+parts.map(([n,sub,v])=>'<div class="row"><div class="info"><strong>'+n+'</strong><small>'+sub+'</small><div class="bar" aria-hidden="true"><i style="width:'+Math.round(v/Math.max(1,total)*100)+'%"></i></div></div><span class="own">'+v+'</span></div>').join('')+
      '<p class="muted">Each fighter counts as the square root of health × damage per second, added up across your band. Compare it with the number shown before each fight.'+(skill('tact')?' Tactics also adds '+5*skill('tact')+'% when you auto-resolve.':'')+'</p>'+
      '<div class="lab" style="margin-top:6px">Troops ('+partySize()+' / '+partyCap()+')</div>'+troopCards(tr)+
      '<div class="lab" style="margin-top:6px">Companions</div>'+(compCount()?Object.keys(P.comps).map(id=>{const c=P.comps[id];
        compInit(id);const st=compStats(id);
        return '<div class="row"><div class="info"><strong>'+COMPS[id].n+' <span class="muted">Lv '+c.lv+'</span>'+(c.perkPend?' <span class="gold">perk to choose</span>':'')+(compInit(id)&&charKit(charOf(c,id))&&c.tp?' <span class="gold">'+c.tp+' skill point'+(c.tp>1?'s':'')+' to spend</span>':'')+'</strong><small>'+apName(c.ap)+' ('+(c.ap>0?'+':'')+c.ap+') · '+(c.role?ROLES[c.role]:'no role')+' · '+st.hp+' hp · '+st.dmg+' damage'+(c.party?' · <span class="good">leading '+c.party.troops.length+' soldiers</span>':c.hurt>G.day?' · <span class="bad">wounded</span>':'')+'</small></div><div class="acts">'+
          '<button class="btn sm primary" type="button" data-act="cm-open" data-arg="'+id+'">Manage</button>'+
          Object.keys(ROLES).map(r=>'<button class="btn sm'+(c.role===r?' on':'')+'" type="button" data-act="role" data-arg="'+id+':'+r+'" aria-pressed="'+(c.role===r)+'">'+ROLES[r]+'</button>').join('')+
          '<button class="btn sm" type="button" data-act="dismiss" data-arg="'+id+'">Dismiss</button></div></div>'}).join('')+
        '<p class="muted">Scout: +2 Scouting and more as they learn it. Surgeon: the same for Medicine. Quartermaster: band eats 25% less. Manage: their gear, level, perks and a party to lead.</p>':'<p class="muted">None yet. Look for them in town taverns.</p>')+
      '<div class="lab" style="margin-top:6px">Prisoners ('+prisonerCount()+' / '+prisonCap()+')</div>'+(prisonerCount()?Object.keys(P.prisoners).filter(k=>P.prisoners[k]>0).map(k=>'<div class="row"><div class="info"><strong>'+ST[k].n+'</strong><small>Ransom '+RANSOM[ST[k].tier]+'g in a town tavern</small></div><span class="own">×'+P.prisoners[k]+'</span><div class="acts">'+
        '<button class="btn sm" type="button" data-act="p-recruit" data-arg="'+k+'"'+(P.gold<10||partySize()>=partyCap()?' disabled':'')+'>Recruit 10g</button>'+
        '<button class="btn sm" type="button" data-act="p-release" data-arg="'+k+'">Release</button></div></div>').join(''):'<p class="muted">None. Win battles to take some.</p>')+captivesHtml();
  }
  showPanel('<div class="top"><h2>'+(tab==='hero'?'Your hero':tab==='realms'?'Realms of Ashmark':tab==='lords'?'Lords':tab==='quests'?'Quests':'Your party')+'</h2><span class="muted">'+RACES[P.race].n+' · level '+P.level+' · '+rankName()+'</span></div><div class="tabs">'+
    [['hero','Hero'],['party','Party'],['quests','Quests'],['lords','Lords'],['realms','Realms']].map(x=>'<button class="btn sm'+(x[0]===tab?' on':'')+'" type="button" data-act="char-tab" data-arg="'+x[0]+'">'+x[1]+'</button>').join('')+
    '</div><div>'+body+'</div>'+nav(null,['char-close',null,'Back to map']));
}
/* your troops as cards, as in Total War: each kind its picture, numbers, its state (fit and wounded), its morale now against its
   best (where it would start a battle now, by your band's morale: morale.js, against its own Morale: matchups.js unitMoraleOf),
   its health and attacks, its type and armour, and its experience toward training. Above them, your band: its morale, the
   nerve it drifts toward, its numbers and its wounded */
function troopCards(tr){
  const W=P.wounded||{},bar=(v,max,cls,lab,txt)=>'<div class="tc-bar '+cls+'" title="'+lab+'"><i style="width:'+Math.round(clamp(v/Math.max(1,max),0,1)*100)+'%"></i><em>'+txt+'</em></div>';
  const nerve=bandNerve(),wounded=woundedN(),fac=.6+.4*clamp(P.morale,0,100)/100;
  const head='<div class="tc-band">'+bar(P.morale,100,'mo','Your band\u2019s morale','Band morale '+Math.round(P.morale)+' / 100')+
    '<small class="muted">'+(nerve!=null?'Your troops\u2019 nerve '+Math.round(nerve)+': your band\u2019s morale drifts toward it day by day. ':'')+(wounded?wounded+' wounded, mending. ':'')+'</small></div>';
  if(!tr.length&&!Object.keys(W).some(k=>W[k]>0))return head+'<p class="muted">No troops. Hire some in town.</p>';
  const kinds=[...new Set([...tr,...Object.keys(W).filter(k=>W[k]>0&&ST[k])])];
  return head+'<div class="tcards">'+kinds.map(k=>{const s=ST[k],n=P.troops[k]||0,w=W[k]||0,mx=Math.round(unitMoraleOf(s)),now=Math.round(mx*fac),need=n*txpNeed(k),xp=Math.floor(txpOf(k)),ready=UP[k]?txpReady(k):0;
    return '<div class="tcard" title="'+vsLine(s)+'"><div class="tc-head"><img class="tc-pic" src="'+portrait(k)+'" alt=""><div class="tc-name"><strong>'+s.n+'</strong><small>Tier '+s.tier+' · '+classN(s)+'</small><small class="uc-type">'+DMG[dtOf(s)].n+' · '+ARMOR[armorOf(s)].n+'</small></div><span class="tc-n">×'+n+'</span></div>'+
      '<div class="tc-state"><span class="good">'+n+' fit</span>'+(w?'<span class="bad">'+w+' wounded</span>':'')+'</div>'+
      bar(now,mx,'mo','Its morale now (where it would start a battle) against its best (its Morale)','Morale '+now+' / '+mx)+
      '<div class="tc-stats"><span><b>Health</b>'+s.hp+'</span><span><b>Melee</b>'+meleeDmgOf(s)+'</span><span><b>Missile</b>'+(missileDmgOf(s)||'—')+'</span>'+(s.range?'<span><b>Range</b>'+s.range+'</span>':'')+'</div>'+
      (UP[k]?bar(xp,need,'xp','Experience toward training','Experience '+xp+' / '+need)+(ready?'<small class="gold">'+ready+' ready to train at a barracks</small>':''):'')+
      '</div>'}).join('')+'</div>'}
function showPerk(from){
  const left=Object.keys(PERKS).filter(p=>!has(p));if(!left.length){P.perkPend=0;return false}
  if(!G.perkOffer){G.perkOffer=[];while(G.perkOffer.length<Math.min(3,left.length)){const p=left[rint(0,left.length-1)];if(!G.perkOffer.includes(p))G.perkOffer.push(p)}}
  G.perkFrom=from;G.mode='perk';
  showPanel('<h2>Choose a perk</h2><p class="muted">Your experience shapes you. Pick one.</p><div class="cards">'+G.perkOffer.map(p=>'<button class="card" type="button" data-act="perk" data-arg="'+p+'"><strong>'+PERKS[p].n+'</strong><span>'+PERKS[p].d+'</span></button>').join('')+'</div>');
  return true;
}
function toWorld(){G.mode='world';hidePanel();if(P.perkPend>0&&showPerk('world'))return;saveGame(true)}
function charAct(a,arg){
  if(a==='char-close'){G.mode='world';hidePanel();return true}
  if(a==='perk-open'){showPerk('char');return true}
  if(a==='open-skills'){G.mode='world';G.modal=false;hidePanel();openSkills('talents');return true}
  if(a==='perk'){
    if(!has(arg))P.perks.push(arg);P.perkPend=Math.max(0,P.perkPend-1);G.perkOffer=null;log('New perk: '+PERKS[arg].n+'.','gold');updateHUD(true);
    if(P.perkPend>0&&showPerk(G.perkFrom))return true;
    if(G.perkFrom==='char'){G.mode='char';renderChar()}else{G.mode='world';hidePanel();saveGame(true)}
    return true;
  }
  if(G.mode!=='char')return false;
  const keep=panel.scrollTop;
  if(a==='char-tab')G.char=arg;
  else if(a==='role'){const [id,r]=arg.split(':');const c=P.comps[id];if(c){if(c.role===r)c.role='';else{const o=roleOf(r);if(o)P.comps[o].role='';c.role=r}}}
  else if(a==='dismiss'){if(P.comps[arg]){delete P.comps[arg];log(COMPS[arg].n+' leaves your band. You may find them in '+COMPS[arg].town+' again.')}}
  else if(a==='p-recruit'){if(P.prisoners[arg]>0&&P.gold>=10&&partySize()<partyCap()){P.gold-=10;P.prisoners[arg]--;P.add(arg);log('A captured '+ST[arg].n.toLowerCase()+' swears to follow you.')}}
  else if(a==='p-release'){if(P.prisoners[arg]>0){P.prisoners[arg]--;P.renown++;log('You let '+an(ST[arg].n.toLowerCase())+' go free. +1 renown.');mood('release')}}
  else return false;
  updateHUD(true);renderChar();panel.scrollTop=keep;
  const again=panel.querySelector('[data-act="'+a+'"][data-arg="'+arg+'"]:not([disabled])')||panel.querySelector('[data-act="char-tab"].on');if(again)again.focus({preventScroll:true});
  return true;
}

// what an attribute does for a companion, a lord or a chieftain (characters.js charStats)
const CHAR_ATTR_FX={str:'+4 health and +0.5 damage a point',agi:'+2 speed and 3% faster blows a point',int:'Nothing in battle yet',cha:'Nothing in battle yet'};
/* a companion's window: level, stats, disciplines, perks, the gear you give them, and a party of your soldiers to lead */
function openComp(id){if(!P.comps[id])return;if(G.mode!=='char'&&(G.modal||G.mode!=='world'))return;G.compBack=G.mode==='char'?'char':'world';G.mode='comp';G.compSel=id;renderComp()}
function renderComp(){
  const id=G.compSel,c=compInit(id),C0=COMPS[id];if(!c){G.mode='world';hidePanel();return}const ch=charOf(c,id);charKit(ch);const st=compStats(id),b=(act,arg,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const row=(t,s,acts)=>'<div class="row"><div class="info"><strong>'+t+'</strong><small>'+s+'</small></div>'+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>';
  let h='<div class="top"><h2>'+C0.n+'</h2><span class="muted">Level '+c.lv+' · '+c.xp+'/'+c.lv*60+' xp · '+apName(c.ap)+'</span></div>'+
    '<div class="cmwrap"><div class="cmside">'+charCard(ch)+'</div><div class="cmmain">'+
    '<p class="muted">'+(st.block?'Blocks '+Math.round(st.block*100)+'% of each blow. ':'')+'They share the experience you gain while they ride with you, and a skill point comes with each level.</p>'+
    row('Skill tree'+(c.tp?' · <span class="gold">'+c.tp+' point'+(c.tp>1?'s':'')+' to spend</span>':''),(c.tree.length-1)+' learned, as '+an(ch.cls)+' ('+ch.actives().map(k=>HSKILLS[k].n).join(', ')+(ch.actives().length?'':'no active skills yet')+')','<button class="btn sm primary" type="button" data-act="cm-tree">Open</button>')+
    '<div class="lab">Attributes · from the skill tree</div><div class="keys">'+Object.keys(ATTRS).map(k=>'<div><kbd>'+c.attr[k]+'</kbd><span title="'+CHAR_ATTR_FX[k]+'">'+ATTRS[k][0]+'</span></div>').join('')+'</div>'+
    '<div class="lab">Disciplines · rise as they fight, lead and work</div><div class="keys">'+Object.keys(COMP_SK).map(k=>'<div><kbd>'+c.sk[k].lv+'</kbd><span>'+COMP_SK[k]+'</span></div>').join('')+'</div>'+
    '<div class="lab">Perks · one every third level</div>'+(c.perks.length?'<p>'+c.perks.map(p=>COMP_PERKS[p].n+' ('+COMP_PERKS[p].d+')').join(', ')+'</p>':'<p class="muted">None yet.</p>')+
    (c.perkPend?'<div class="cards">'+Object.keys(COMP_PERKS).filter(p=>!c.perks.includes(p)).map(p=>'<button class="card" type="button" data-act="cm-perk" data-arg="'+p+'"><strong>'+COMP_PERKS[p].n+'</strong><span>'+COMP_PERKS[p].d+'</span></button>').join('')+'</div>':'')+
    '<div class="lab">Gear · from your bag</div>'+COMP_SLOTS.map(sl=>{const it=c.gear[sl]&&ITEMS[c.gear[sl]],fit=compFits(id,sl);
      return row(SLOTS[sl]+': '+(it?'<span style="color:'+RARITY[it.r]+'">'+it.n+'</span>':'<span class="muted">nothing</span>'),it?it.d:(fit.length?fit.length+' in your bag fit':'Nothing in your bag fits'),(it?b('cm-off',sl,'Take back'):'')+fit.slice(0,3).map(([x,i])=>b('cm-eq',sl+':'+i,'Give '+ITEMS[x.id].n)).join(''))}).join('');
  // the party
  const p=c.party,trs=Object.keys(P.troops).filter(k=>P.troops[k]>0),near=p&&Math.hypot(p.x-P.x,p.y-P.y)<=60;
  h+='<div class="lab">Lead a party · up to '+cpartyCap(id)+' soldiers</div>';
  if(!canLead(id))h+='<p class="muted">'+C0.short+' will lead your soldiers from level '+COMP_LEAD.lv+', once they trust you (approval '+COMP_LEAD.ap+'+).</p>';
  else{h+=(p?row(C0.short+'’s party: '+p.troops.length+' soldiers','Now '+({follow:'riding with you',patrol:'patrolling the land of '+p.base,return:'coming back to you',stay:(p.inside?'staying in ':'on the way to shelter in ')+p.base})[p.order]+'. It fights bandits and weaker enemies, keeps clear of stronger ones'+(p.order==='patrol'||p.order==='stay'?', and hires volunteers there with your gold'+(p.order==='stay'&&townBy(p.base)&&!stayFree(townBy(p.base))?' (lodgings '+cpStayCost(p)+'g a day)':''):'')+'.',
        b('cm-order','follow','Ride with me')+b('cm-order','patrol','Patrol here')+b('cm-order','stay','Stay in town')+b('cm-order','return','Come back')):'<p class="muted">Give '+C0.short+' soldiers to lead their own party on the map. They ride with you at first: order them to patrol the land around you, or to come back.</p>')+
      trs.map(k=>row(ST[k].n+' <span class="muted">(you have '+P.troops[k]+(p?', '+C0.short+' has '+p.troops.filter(x=>x===k).length:'')+')</span>','',b('cm-give',k+':1','Give 1')+b('cm-give',k+':5','Give 5'))).join('')+
      (p?[...new Set(p.troops)].map(k=>row(ST[k].n+' with '+C0.short+': '+p.troops.filter(x=>x===k).length,near?'':'Ride close to take them back','' +b('cm-take',k+':1','Take 1',near?'':'Too far')+b('cm-take',k+':99','Take all',near?'':'Too far'))).join(''):'')}
  showPanel(h+'</div></div>'+nav(['cm-back',null,'Back']));panel.classList.add('wide');// (the larger window: the card beside the rest)
}
onAct('cm-',(a,arg)=>{
  if(a==='cm-open')return openComp(arg);
  if(G.mode!=='comp')return;const id=G.compSel,keep=panel.scrollTop;
  if(a==='cm-back'){if(G.compBack==='char'){G.mode='char';renderChar()}else{G.mode='world';hidePanel()}return}
  if(a==='cm-perk'){const c=compInit(id);if(c.perkPend>0&&COMP_PERKS[arg]&&!c.perks.includes(arg)){c.perks.push(arg);c.perkPend--;log(COMPS[id].short+' becomes '+COMP_PERKS[arg].n.toLowerCase()+'.','gold')}}
  else if(a==='cm-eq'){const [sl,i]=arg.split(':');if(compEquip(id,sl,+i))log(COMPS[id].short+' takes the '+ITEMS[compInit(id).gear[sl]].n+'.')}
  else if(a==='cm-off')compUnequip(id,arg);
  else if(a==='cm-tree'){openSkills('talents',id);return}// (its own tree, on the Skills page)
  else if(a==='cm-give'){const [k,n]=arg.split(':');const g=cpGive(id,k,+n);if(g)log('You give '+COMPS[id].short+' '+g+' '+ST[k].n.toLowerCase()+(g>1?'s':'')+' to lead.')}
  else if(a==='cm-take'){const [k,n]=arg.split(':');cpTake(id,k,+n)}
  else if(a==='cm-order')cpOrder(id,arg);
  updateHUD(true);renderComp();panel.scrollTop=keep;
});
