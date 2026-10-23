'use strict';
/* ---------- character, party, perks ---------- */
function openChar(){if(G.mode!=='world'||G.modal)return;G.mode='char';if(!G.char||G.char==='gear')G.char='hero';renderChar()}
function renderChar(){
  const tab=G.char;let body='';
  if(tab==='hero'){
    // (your hero's health and mana, and her stamina, which is your band's (world/supply.js): here, not on the party card)
    const m=vitals(),vb=(v,mx,col,lab)=>'<div class="hv-bar" title="'+lab+'"><i style="width:'+Math.round(clamp(v/Math.max(1,mx),0,1)*100)+'%;background:'+col+'"></i><em'+(v<mx*.3?' class="low"':'')+'>'+lab+' '+Math.round(v)+' / '+mx+'</em></div>';
    body='<div class="lab">Health · Stamina · Mana</div><div class="hvit">'+vb(P.hp,m[0],'#c8503a','Health')+vb(P.sp,m[1],'#78c474','Stamina (your band’s)')+vb(P.mp,m[2],'#5a8fe8','Mana')+'</div>'+
      '<div class="lab" style="margin-top:6px">Attributes · raised on the skill tree (K)</div>'+Object.keys(ATTRS).map(k=>'<div class="row"><div class="info"><strong>'+ATTRS[k][0]+'</strong><small>'+ATTRS[k][1]+'</small></div><span class="own">'+P.attr[k]+'</span></div>').join('')+
      '<div class="lab" style="margin-top:6px">Skills</div><div class="row"><div class="info"><strong>'+(P.tp?'<span class="gold">'+P.tp+' skill point'+(P.tp>1?'s':'')+' to spend</span>':'Skill tree, skill bar and disciplines')+'</strong><small>'+(P.tree.length-1)+' skills learned. One skill point each level.</small></div><div class="acts"><button class="btn sm" type="button" data-act="open-skills">Open Skills (K)</button></div></div>'+
      (P.perks.length?'<div class="lab" style="margin-top:6px">Perks from before</div>'+P.perks.map(p=>'<div class="row"><div class="info"><strong>'+PERKS[p].n+'</strong><small>'+PERKS[p].d+'</small></div></div>').join(''):'');
  }else if(tab==='quests'){
    body=questWindow();// (the list and the one chosen: ui/questwindow.js)
  }else if(tab==='realms'){
    const sw=f=>'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>';
    body='<div class="lab">Your standing</div><p>'+(P.fac?'You serve the '+sw(P.fac)+' as a mercenary, for '+troopCount()+' gold a day.':'You are independent. Sign a mercenary contract in a town tavern.')+
      FIDS.filter(f=>!P.fac&&Timed.of(P,'hostile').has(f)).map(f=>' The '+sw(f)+' is hostile to you until day '+Timed.of(P,'hostile').end(f)+'.').join('')+'</p>'+
      (playerFiefs().length?'<div class="lab" style="margin-top:6px">Your fiefs</div>'+playerFiefs().map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.label+' · garrison '+t.gar+' · '+fiefIncome(t)+' gold a day'+(besieged(t)?' · <span class="bad">under siege</span>':'')+'</small></div></div>').join(''):'')+
      (P.siege?'<p class="gold">You are besieging '+P.siege.town+' (day '+P.siege.days+').</p>':'')+
      '<div class="lab" style="margin-top:6px">Your reputation</div><p class="muted" style="font-size:13px">Standing at a holding = local reputation + half your honor with its owner + '+RACE_TRUST+' where your race lives. Tier 1 recruits need '+REP_NEED[1]+', tier 2 need '+REP_NEED[2]+'.</p>'+
      TOWNS.slice().sort((a,b)=>standingAt(b)-standingAt(a)).map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.label+' · '+sw(t.owner)+' · local '+Math.round(repAt(t.name))+'</small></div><span class="own'+(standingAt(t)>=REP_NEED[1]?' gold':'')+'">'+standingAt(t)+'</span></div>').join('')+
      (mythicNews('roams')?'<p class="bad">'+mythicNews('roams')+'</p>':'')+'<div class="lab" style="margin-top:6px">Factions</div>'+FIDS.map(f=>{const own=fiefsOf(f),ls=W.lords.filter(l=>l.fac===f&&!l.dead);
        return '<div class="row"><div class="info"><strong>'+sw(f)+(W.dead[f]?' <span class="bad">· fallen</span>':'')+'</strong><small>'+FACS[f].d+'</small><small>Your honor: '+honorWith(f)+'</small><small>Lands: '+landsOf(f)+' tiles · treasury '+Math.round(treas(f))+' gold'+(econWeary(f)?' · <span class="bad">weary of war</span>':'')+'</small><small>Holds: '+(own.map(t=>t.name+(besieged(t)?' (under siege)':'')).join(', ')||'nothing')+'</small><small>Lords in the field: '+(ls.map(l=>l.name+' ('+l.troops.length+' troops, power '+l.power()+')').join(', ')||'none')+'</small></div></div>'}).join('')+
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
    const total=partyPower(),parts=[[P.name?htmlText(P.name):'You','Level '+P.level+' hero',rating(['hero'])],...Object.keys(P.comps).map(id=>[COMPS[id].n,'Companion',rating([id])]),
      ...tr.map(k=>[ST[k].n,P.troops[k]+' × '+rating([k]),rating(Array(P.troops[k]).fill(k))])].sort((a,b)=>b[2]-a[2]);
    body=armyGroupsHtml()+'<div class="top"><span class="lab">Party power</span><span class="gold" style="font-size:22px">'+total+'</span></div>'+parts.map(([n,sub,v])=>'<div class="row"><div class="info"><strong>'+n+'</strong><small>'+sub+'</small><div class="bar" aria-hidden="true"><i style="width:'+Math.round(v/Math.max(1,total)*100)+'%"></i></div></div><span class="own">'+v+'</span></div>').join('')+
      '<p class="muted">Each fighter counts as the square root of health × damage per second, added up across your band. Compare it with the number shown before each fight.'+(skill('tact')?' Tactics also adds '+5*skill('tact')+'% when you auto-resolve.':'')+'</p>'+
      '<div class="lab" style="margin-top:6px">Troop totals ('+partySize()+' / '+partyCap()+')</div>'+troopCards(tr)+
      '<div class="lab" style="margin-top:6px">Companions</div>'+(compCount()?Object.keys(P.comps).map(id=>{const c=P.comps[id];
        compInit(id);const st=compStats(id);
        return '<div class="row"><div class="info"><strong>'+COMPS[id].n+' <span class="muted">Lv '+c.lv+'</span>'+(c.perkPend?' <span class="gold">perk to choose</span>':'')+(compInit(id)&&charKit(charOf(c,id))&&c.tp?' <span class="gold">'+c.tp+' skill point'+(c.tp>1?'s':'')+' to spend</span>':'')+'</strong><small>'+apName(c.ap)+' ('+(c.ap>0?'+':'')+c.ap+') · '+(c.role?ROLES[c.role]:'no role')+' · '+st.hp+' hp · '+st.dmg+' damage'+(c.party?' · <span class="good">leading '+c.party.troops.length+' soldiers</span>':c.hurt>G.day?' · <span class="bad">wounded</span>':'')+'</small></div><div class="acts">'+
          '<button class="btn sm primary" type="button" data-act="cm-open" data-arg="'+id+'">Manage</button>'+
          Object.keys(ROLES).map(r=>'<button class="btn sm'+(c.role===r?' on':'')+'" type="button" data-act="role" data-arg="'+id+':'+r+'" aria-pressed="'+(c.role===r)+'">'+ROLES[r]+'</button>').join('')+
          '<button class="btn sm" type="button" data-act="dismiss" data-arg="'+id+'">Dismiss</button></div></div>'}).join('')+
        '<p class="muted">Scout: +2 Scouting and more as they learn it. Surgeon: the same for Medicine. Quartermaster: band eats 25% less. Manage: their gear, level, perks and a party to lead.</p>':'<p class="muted">None yet. Look for them in town taverns.</p>')+
      Escort.html()+// (those you escort, riding with you: world/escort.js)
      '<div class="lab" style="margin-top:6px">Prisoners ('+prisonerCount()+' / '+prisonCap()+')</div>'+(prisonerCount()?Object.keys(P.prisoners).filter(k=>P.prisoners[k]>0).map(k=>{const quote=recruitment.quotePrisoner(k);return '<div class="row"><div class="info"><strong>'+ST[k].n+'</strong><small>Ransom '+RANSOM[ST[k].tier]+'g in a town tavern</small></div><span class="own">×'+P.prisoners[k]+'</span><div class="acts">'+
        '<button class="btn sm" type="button" data-act="p-recruit" data-arg="'+k+'"'+(!quote.ok?' disabled title="'+recruitmentWhy(quote)+'"':'')+'>Recruit '+quote.cost+'g</button>'+
        '<button class="btn sm" type="button" data-act="p-release" data-arg="'+k+'">Release</button></div></div>'}).join(''):'<p class="muted">None. Win battles to take some.</p>')+captivesHtml();
  }
  showPanel('<div class="top"><h2>'+(tab==='hero'?'Your hero':tab==='realms'?'Realms of Ashmark':tab==='lords'?'Lords':tab==='quests'?'Quests':P.band?htmlText(P.band):'Your party')+'</h2><span class="muted">'+RACES[P.race].n+' · level '+P.level+' · '+rankName()+'</span></div><div class="tabs">'+
    [['hero','Hero'],['party','Party'],['quests','Quests'],['lords','Lords'],['realms','Realms']].map(x=>'<button class="btn sm'+(x[0]===tab?' on':'')+'" type="button" data-act="char-tab" data-arg="'+x[0]+'">'+x[1]+'</button>').join('')+
    '</div><div>'+body+'</div>'+nav(tab==='quests'?questWindowBack():null,['char-close',null,'Back to map']));
}
/* your troops as cards, as in Total War: each kind its picture, numbers, its state (fit and wounded), its morale now against its
   best (where it would start a battle now, by your band's morale: morale.js, against its own Morale: matchups.js unitMoraleOf),
   its health and attacks, its type and armour, and its experience toward training. Above them, your band: its morale, the
   nerve it drifts toward, its numbers and its wounded */
function troopCards(tr){
  const W=P.wounded||{},bar=(v,max,cls,lab,txt)=>'<div class="tc-bar '+cls+'" title="'+lab+'"><i style="width:'+Math.round(clamp(v/Math.max(1,max),0,1)*100)+'%"></i><em>'+txt+'</em></div>';
  const nerve=bandNerve(),wounded=woundedN(),fac=.6+.4*clamp(P.morale,0,100)/100;
  const head='<div class="tc-band">'+bar(P.morale,100,'mo','Your band\u2019s morale','Band morale '+Math.round(P.morale)+' / 100')+
    '<small class="muted">'+(nerve!=null?'Your troops\u2019 nerve '+Math.round(nerve)+': your band\u2019s morale drifts toward it day by day. ':'')+'</small></div>'+woundedPanel();
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
  if(a==='char-tab'){G.char=arg;if(G.qw){G.qw.open=false;G.qw.ask=null}}
  else if(a==='army-edit'){G.armyEdit=arg;G.armyNotice=''}
  else if(a==='army-edit-close')G.armyEdit=null;
  else if(a==='army-name-save'){const value=panel.querySelector('[data-army-name]')?.value;G.armyNotice=partyRoster(P).rename(arg,value)?'Group name saved.':'Use up to 32 characters, without control characters.'}
  else if(a==='army-name-reset'){partyRoster(P).rename(arg,'');G.armyNotice='Default group name restored.'}
  else if(a==='army-move'){const [id,step]=String(arg).split(':');partyRoster(P).move(id,Number(step))}
  else if(a==='army-split-exact'){const n=Number(panel.querySelector('[data-army-split]')?.value),created=partyRoster(P).split(arg,n);G.armyNotice=created?'Split '+n+' fit soldiers into '+created.id+'. Wounded stay with the original group.':'Split needs a free slot and a whole number from 1 to one less than the fit count.'}
  else if(a==='army-merge-picked'){const to=panel.querySelector('[data-army-merge]')?.value;if(partyRoster(P).merge(arg,to)){G.armyEdit=null;G.armyNotice='Groups merged; the destination keeps its name and wounded ownership.'}}
  else if(a==='army-split'){const r=partyRoster(P),g=r.groups.find(g=>g.id===arg);if(g)r.split(g.id,Math.floor(g.count/2))}
  else if(a==='army-merge'){const [from,to]=arg.split(':');partyRoster(P).merge(from,to)}
  else if(a==='army-recruit')G.recruitTarget=arg;
  else if(a==='role'){const [id,r]=arg.split(':');const c=P.comps[id];if(c){if(c.role===r)c.role='';else{const o=roleOf(r);if(o)P.comps[o].role='';c.role=r}}}
  else if(a==='dismiss'){if(P.comps[arg]){delete P.comps[arg];log(COMPS[arg].n+' leaves your band.'+(compTown(arg)?' You may find them in '+compTown(arg).name+' again.':''))}}
  else if(a==='p-recruit')recruitmentFeedback(recruitment.recruitPrisoner(arg));
  else if(a==='p-release'){if(P.prisoners[arg]>0){P.prisoners[arg]--;P.renown++;log('You let '+an(ST[arg].n.toLowerCase())+' go free. +1 renown.');mood('release')}}
  else return false;
  updateHUD(true);renderChar();panel.scrollTop=keep;
  if(a==='army-edit'){panel.querySelector('[data-army-name]')?.focus({preventScroll:true});panel.querySelector('[data-army-editor]')?.scrollIntoView({block:'nearest'});return true}
  const again=panel.querySelector('[data-act="'+a+'"][data-arg="'+arg+'"]:not([disabled])')||panel.querySelector('[data-act="char-tab"].on');if(again)again.focus({preventScroll:true});
  return true;
}

function armyGroupLabel(id,r=partyRoster(P)){
  const g=r.groups.find(g=>g.id===id),w=(P.woundedGroups||[]).find(g=>g.id===id);
  return r.nameOf(id)||(id==='hero'?(P.name||'Hero'):id.startsWith('comp_')?COMPS[id.slice(5)].n:ST[g?.type||w?.type]?.n||id);
}
function armyGroupEditor(id,r){
  if(G.armyEdit!==id)return '';const g=r.groups.find(g=>g.id===id),name=r.nameOf(id),full=r.slots>=ARMY_LIMIT;
  const button=(action,label,disabled=false)=>'<button class="btn sm" type="button" data-act="'+action+'" data-arg="'+id+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
  const others=g?r.groups.filter(o=>o.id!==id&&o.type===g.type):[];
  return '<div class="army-editor" data-army-editor="'+id+'">'+(G.armyNotice?'<p role="status">'+htmlText(G.armyNotice)+'</p>':'')+'<label>Group name (32 characters)<input data-army-name type="text" maxlength="32" value="'+htmlText(name)+'" placeholder="'+htmlText(armyGroupLabel(id,r))+'"></label><div class="btns">'+button('army-name-save','Save name')+button('army-name-reset','Use default')+'</div>'+
    (g?'<label>Fit soldiers to split<input data-army-split type="number" min="1" max="'+Math.max(1,g.count-1)+'" step="1" value="'+Math.max(1,Math.floor(g.count/2))+'"></label><div class="btns">'+button('army-split-exact','Split this number',full||g.count<2)+'</div><small>Only fit soldiers move. Wounded stay with '+htmlText(armyGroupLabel(id,r))+'. The new group starts with its default name.</small>'+
      (others.length?'<label>Merge into matching group<select data-army-merge>'+others.map(o=>'<option value="'+o.id+'">'+htmlText(armyGroupLabel(o.id,r))+' · '+o.id+' · '+o.count+' fit</option>').join('')+'</select></label>'+button('army-merge-picked','Merge into selected'):'<small>No other group of this unit type to merge into.</small>'):'')+
    '<div class="btns">'+button('army-edit-close','Done')+'</div></div>';
}
function armyGroupsHtml(){
  const r=partyRoster(P),gs=r.groups,order=r.order,full=r.slots>=ARMY_LIMIT;let key=0;
  const button=(action,arg,label,disabled=false)=>'<button class="btn sm" type="button" data-act="'+action+'" data-arg="'+arg+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
  const rows=order.map((id,i)=>{
    const g=gs.find(g=>g.id===id),cid=id.startsWith('comp_')?id.slice(5):null,unavailable=cid&&P.comps[cid].hurt>G.day,hotkey=unavailable?'—':String(++key%10);
    return '<div class="army-group" data-army-group="'+id+'"><div class="row"><span class="army-key" title="'+(unavailable?'Wounded character reserves a slot; no battle card until recovered':'Battle card / number key')+'">'+hotkey+'</span><div class="info"><strong>'+htmlText(armyGroupLabel(id,r))+(g?' · '+g.count+' fit':'')+'</strong><small>'+(g?ST[g.type].n+' · '+g.id+' · '+r.wounded(id)+' wounded'+(G.recruitTarget===id?' · recruitment target':''):unavailable?'Wounded companion · slot reserved':'1 character · one group')+'</small></div><div class="acts">'+
      button('army-move',id+':-1','↑',i===0)+button('army-move',id+':1','↓',i===order.length-1)+button('army-edit',id,'Manage')+(g?button('army-recruit',id,'Reinforce'):'')+'</div></div>'+armyGroupEditor(id,r)+'</div>';
  }).join('');
  const recovering=[...new Set((P.woundedGroups||[]).filter(w=>w.count>0&&!gs.some(g=>g.id===w.id)).map(w=>w.id))];
  return '<div class="lab">Army groups '+r.slots+' / '+ARMY_LIMIT+'</div><p class="muted">One unit type per group. Use ↑ / ↓ to reorder the army, including characters. Fit groups follow this order in battle cards and number keys; wounded companions reserve a slot but have no card until recovered.</p>'+
    (G.armyNotice&&!G.armyEdit?'<p role="status">'+htmlText(G.armyNotice)+'</p>':'')+rows+
    (recovering.length?'<div class="lab">Recovering groups · no fit soldiers</div>'+recovering.map(id=>'<div class="army-group" data-army-group="'+id+'"><div class="row"><div class="info"><strong>'+htmlText(armyGroupLabel(id,r))+'</strong><small>'+id+' · 0 fit · '+r.wounded(id)+' wounded · returns to its own group when a slot is available</small></div>'+button('army-edit',id,'Rename')+'</div>'+armyGroupEditor(id,r)+'</div>').join(''):'')+
    '<div class="btns">'+button('army-recruit','new','Next recruit: new group',full)+button('army-recruit','','Auto reinforce')+'</div>'+
    '<p class="muted">Recruitment: '+(G.recruitTarget==='new'?'create a new group':gs.find(g=>g.id===G.recruitTarget)?'reinforce '+htmlText(armyGroupLabel(G.recruitTarget,r))+' when recruiting its type':'reinforce the first matching group')+'. Select a different target here before recruiting.</p>';
}

// what an attribute does for a companion, a lord or a chieftain (characters.js Character.base)
const CHAR_ATTR_FX={str:'+4 health and +0.5 damage a point',agi:'+2 speed and 3% faster blows a point',int:'Nothing in battle yet',cha:'Nothing in battle yet'};
/* a companion's window: level, stats, disciplines, perks, the gear you give them, and a party of your soldiers to lead */
function openComp(id){if(!P.comps[id])return;if(G.mode!=='char'&&(G.modal||G.mode!=='world'))return;G.compBack=G.mode==='char'?'char':'world';G.mode='comp';G.compSel=id;G.compTransfer={};G.compTransferNotice='';renderComp()}
const CP_TRANSFER_WHY={source:'Choose a fit source group.',target:'Choose a destination group of the same unit type, or a new group.',amount:'Enter a whole number from 1 to the fit count of this group.',capacity:'Not enough receiving headcount capacity for this entire transfer.',groups:'Not enough army slots (10 maximum), including the companion if they rejoin.',leadership:'This companion does not yet meet the level and trust requirements to lead.',party:'This companion has no separate army.',distance:'Ride within 60 pixels to take soldiers back.',fighting:'Wait until this companion’s battle ends.',companion:'Companion unavailable.','same-army':'Choose two different armies.'};
const cpTransferWhy=q=>CP_TRANSFER_WHY[q.code]||'Transfer unavailable.';
function compTransferDraft(direction){return (G.compTransfer||(G.compTransfer={}))[direction]||((G.compTransfer[direction]={source:'',target:'new',count:1}))}
function compTransferStatus(q){return q.ok?'<span>Transfer '+q.count+' fit soldiers. Groups: source '+q.fromSlots+' → '+q.fromAfter+' / 10 · destination '+q.toSlots+' → '+q.toAfter+' / 10.</span>'+
  (q.rejoin?'<br>The companion will rejoin your band; their slot is included.':''):'<span class="bad">'+cpTransferWhy(q)+'</span>'}
function compTransferActions(direction,q,review){return review?'<div class="cp-review"><strong>Review: '+review.count+' × '+htmlText(ST[review.type].n)+'</strong><p>'+htmlText(review.sourceName||ST[review.type].n)+' ('+htmlText(review.source)+') → '+htmlText(review.target==='new'?'New group':review.targetName||ST[review.type].n)+(review.target==='new'?'':' ('+htmlText(review.target)+')')+'</p><p>'+
  (review.target!=='new'?'The destination keeps its name and formation.':review.whole?'Whole fit group: its name and formation move with it.':'Partial group: the new group starts with its default name and Line formation.')+'</p><div class="btns"><button type="button" class="btn primary" data-act="cm-transfer-confirm" data-arg="'+direction+'">Confirm transfer</button><button type="button" class="btn" data-act="cm-transfer-cancel" data-arg="'+direction+'">Cancel</button></div></div>':
  '<button type="button" class="btn" data-act="cm-transfer-review" data-arg="'+direction+'"'+(q.ok?'':' disabled')+'>Review transfer</button>'}
function compTransferBody(id,direction){
  const p=compInit(id).party,from=direction==='give'?partyRoster(P):p&&partyRoster(p),to=direction==='give'?p&&partyRoster(p):partyRoster(P),
    groups=from?from.order.map(key=>from.groups.find(g=>g.id===key)).filter(Boolean):[],d=compTransferDraft(direction);
  if(!groups.some(g=>g.id===d.source)){d.source=groups[0]?.id||'';d.target='new';d.count=1;d.review=null}
  const label=g=>(g.name||ST[g.type].n)+' · '+g.id+' · '+g.count+' fit · '+from.wounded(g.id)+' wounded',g=groups.find(g=>g.id===d.source),targets=g&&to?to.groups.filter(row=>row.type===g.type):[],q=cpTransferQuote(id,direction,d.source,d.count,d.target),option=(value,text,selected)=>'<option value="'+htmlText(value)+'"'+(selected?' selected':'')+'>'+htmlText(text)+'</option>';
  return '<section class="cp-transfer" data-cp-transfer="'+direction+'"><h3>'+(direction==='give'?'Give soldiers to '+COMPS[id].short:'Take soldiers back')+'</h3>'+
    (groups.length?'<div class="cp-transfer-fields"><label>Source group<select data-cp-field="source">'+groups.map(g=>option(g.id,label(g),g.id===d.source)).join('')+'</select></label><label>Destination group<select data-cp-field="target">'+
      option('new','Create a separate group',d.target==='new')+targets.map(g=>option(g.id,(g.name||ST[g.type].n)+' · '+g.id+' · '+g.count+' fit',g.id===d.target)).join('')+
      (d.target!=='new'&&!targets.some(g=>g.id===d.target)?option(d.target,'Selected group unavailable',true):'')+'</select></label><label>Fit soldiers<input data-cp-field="count" type="number" min="1" max="'+g.count+'" step="1" value="'+(Number.isFinite(d.count)?d.count:'')+'"></label></div><div data-cp-status role="status">'+compTransferStatus(q)+'</div><div data-cp-actions>'+compTransferActions(direction,q,d.review)+'</div>':'<p class="muted">No fit troop groups to transfer'+(direction==='take'&&!p?' · no separate companion army':'')+'.</p>')+'</section>';
}
function compTransferAction(action,direction){
  if(!['give','take'].includes(direction))return;const d=compTransferDraft(direction),id=G.compSel;
  if(action==='cm-transfer-cancel'){d.review=null;return}
  const q=cpTransferQuote(id,direction,d.source,d.count,d.target);
  if(action==='cm-transfer-review'){d.review=q.ok?{...q}:null;G.compTransferNotice=q.ok?'':cpTransferWhy(q);return}
  if(action!=='cm-transfer-confirm'||!d.review)return;
  if(!q.ok||JSON.stringify(q)!==JSON.stringify(d.review)){d.review=null;G.compTransferNotice=q.ok?'This transfer changed. Review it again before confirming.':cpTransferWhy(q);return}
  const result=cpTransferGroup(id,direction,d.source,d.count,d.target);d.review=null;
  if(result.ok){G.compTransfer={};G.compTransferNotice='Transferred '+result.count+' fit soldiers. Wounded remain with their original army.';log(G.compTransferNotice,'good')}
  else G.compTransferNotice=cpTransferWhy(result);
}
function updateCompTransferDraft(e){
  const el=e.target,field=el.dataset.cpField,box=el.closest('[data-cp-transfer]');if(!box||G.mode!=='comp'||!['source','target','count'].includes(field)||el.tagName==='SELECT'&&e.type==='input')return;
  const direction=box.dataset.cpTransfer,d=compTransferDraft(direction),value=field==='count'?Number(el.value):el.value;if(Object.is(d[field],value))return;
  d[field]=value;d.review=null;G.compTransferNotice='';
  if(field==='source'){d.target='new';d.count=1;const keep=panel.scrollTop;renderComp();panel.scrollTop=keep;panel.querySelector('[data-cp-transfer="'+direction+'"] [data-cp-field="source"]')?.focus({preventScroll:true});return}
  const q=cpTransferQuote(G.compSel,direction,d.source,d.count,d.target);box.querySelector('[data-cp-status]').innerHTML=compTransferStatus(q);
  const actions=box.querySelector('[data-cp-actions]'),review=actions.querySelector('[data-act="cm-transfer-review"]');
  if(review)review.disabled=!q.ok;else actions.innerHTML=compTransferActions(direction,q,null);
  panel.querySelector('[data-cp-notice]').textContent='';
}
function renderComp(){
  const id=G.compSel,c=compInit(id),C0=COMPS[id];if(!c){G.mode='world';hidePanel();return}const ch=charOf(c,id);charKit(ch);const st=compStats(id),b=(act,arg,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const row=(t,s,acts)=>'<div class="row"><div class="info"><strong>'+t+'</strong><small>'+s+'</small></div>'+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>';
  let h='<div class="top"><h2>'+C0.n+'</h2><span class="muted">Level '+c.lv+' · '+c.xp+'/'+c.lv*60+' xp · '+apName(c.ap)+'</span><button type="button" class="btn sm" data-act="cm-army">Army transfers</button></div>'+
    '<div class="cmwrap"><div class="cmside">'+charCard(ch)+'</div><div class="cmmain">'+
    '<p class="muted">'+(st.block?'Blocks '+Math.round(st.block*100)+'% of each blow. ':'')+'They share the experience you gain while they ride with you, and a skill point comes with each level.</p>'+
    row('Skill tree'+(c.tp?' · <span class="gold">'+c.tp+' point'+(c.tp>1?'s':'')+' to spend</span>':''),(c.tree.length-1)+' learned, as '+an(ch.cls())+' ('+ch.actives().map(k=>HSKILLS[k].n).join(', ')+(ch.actives().length?'':'no active skills yet')+')','<button class="btn sm primary" type="button" data-act="cm-tree">Open</button>')+
    '<div class="lab">Attributes · from the skill tree</div><div class="keys">'+Object.keys(ATTRS).map(k=>'<div><kbd>'+c.attr[k]+'</kbd><span title="'+CHAR_ATTR_FX[k]+'">'+ATTRS[k][0]+'</span></div>').join('')+'</div>'+
    '<div class="lab">Disciplines · rise as they fight, lead and work</div><div class="keys">'+Object.keys(COMP_SK).map(k=>'<div><kbd>'+c.sk[k].lv+'</kbd><span>'+COMP_SK[k]+'</span></div>').join('')+'</div>'+
    '<div class="lab">Perks · one every third level</div>'+(c.perks.length?'<p>'+c.perks.map(p=>COMP_PERKS[p].n+' ('+COMP_PERKS[p].d+')').join(', ')+'</p>':'<p class="muted">None yet.</p>')+
    (c.perkPend?'<div class="cards">'+Object.keys(COMP_PERKS).filter(p=>!c.perks.includes(p)).map(p=>'<button class="card" type="button" data-act="cm-perk" data-arg="'+p+'"><strong>'+COMP_PERKS[p].n+'</strong><span>'+COMP_PERKS[p].d+'</span></button>').join('')+'</div>':'')+
    '<div class="lab">Gear · from your bag</div>'+COMP_SLOTS.map(sl=>{const it=c.gear[sl]&&ITEMS[c.gear[sl]],fit=compFits(id,sl),why=compEquipment(id).blockedWhy(sl);
      return row(SLOTS[sl]+': '+(it?'<span style="color:'+RARITY[it.r]+'">'+it.n+'</span>':'<span class="muted">nothing</span>'),why||(it?it.d:(fit.length?fit.length+' in your bag fit':'Nothing in your bag fits')),(it?b('cm-off',sl,'Take back'):'')+fit.slice(0,3).map(([x,i])=>b('cm-eq',sl+':'+i,'Give '+ITEMS[x.id].n)).join(''))}).join('');
  // the party
  const p=c.party;
  h+='<div class="lab">Lead a party · up to '+cpartyCap(id)+' soldiers</div>';
  if(!canLead(id))h+='<p class="muted">'+C0.short+' will lead your soldiers from level '+COMP_LEAD.lv+', once they trust you (approval '+COMP_LEAD.ap+'+).</p>';
  h+=(p?row(C0.short+'’s party: '+p.troops.length+' soldiers · '+partyRoster(p).slots+' / 10 groups','Now '+({follow:'riding with you',patrol:'patrolling the land of '+p.base,return:'coming back to you',stay:(p.inside?'staying in ':'on the way to shelter in ')+p.base})[p.order]+'. It fights bandits and weaker enemies, keeps clear of stronger ones'+(p.order==='patrol'||p.order==='stay'?', and hires volunteers there with your gold'+(p.order==='stay'&&townBy(p.base)&&!stayFree(townBy(p.base))?' (lodgings '+cpStayCost(p)+'g a day)':''):'')+'.',
        b('cm-order','follow','Ride with me')+b('cm-order','patrol','Patrol here')+b('cm-order','stay','Stay in town')+b('cm-order','return','Come back')):'<p class="muted">Give '+C0.short+' soldiers to lead their own party on the map. They ride with you at first: order them to patrol the land around you, or to come back.</p>')+
      '<p class="muted">Only fit soldiers move. Wounded keep their original army and group. Giving soldiers to a distant party is allowed; taking them back requires proximity.</p><p data-cp-notice role="status">'+htmlText(G.compTransferNotice||'')+'</p>'+compTransferBody(id,'give')+compTransferBody(id,'take');
  showPanel(h+'</div></div>'+nav(['cm-back',null,'Back']));panel.classList.add('wide');// (the larger window: the card beside the rest)
}
onAct('cm-',(a,arg)=>{
  if(a==='cm-open')return openComp(arg);
  if(G.mode!=='comp')return;const id=G.compSel,keep=panel.scrollTop;
  if(a==='cm-back'){if(G.compBack==='char'){G.mode='char';renderChar()}else{G.mode='world';hidePanel()}return}
  if(a==='cm-army'){panel.querySelector('.cp-transfer')?.scrollIntoView({block:'start'});panel.querySelector('.cp-transfer [data-cp-field="source"]')?.focus({preventScroll:true});return}
  if(a==='cm-perk'){const c=compInit(id);if(c.perkPend>0&&COMP_PERKS[arg]&&!c.perks.includes(arg)){c.perks.push(arg);c.perkPend--;log(COMPS[id].short+' becomes '+COMP_PERKS[arg].n.toLowerCase()+'.','gold')}}
  else if(a==='cm-eq'){const [sl,i]=arg.split(':');if(compEquip(id,sl,+i))log(COMPS[id].short+' takes the '+ITEMS[compInit(id).gear[sl]].n+'.')}
  else if(a==='cm-off')compUnequip(id,arg);
  else if(a==='cm-tree'){openSkills('talents',id);return}// (its own tree, on the Skills page)
  else if(['cm-transfer-review','cm-transfer-confirm','cm-transfer-cancel'].includes(a))compTransferAction(a,arg);
  else if(a==='cm-order')cpOrder(id,arg);
  updateHUD(true);renderComp();panel.scrollTop=keep;
  if(a==='cm-transfer-review')panel.querySelector('[data-cp-transfer="'+arg+'"] [data-act="cm-transfer-confirm"]')?.focus({preventScroll:true});
});
