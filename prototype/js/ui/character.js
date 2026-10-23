'use strict';
/* ---------- character, party, perks ---------- */
function openChar(){if(G.mode!=='world'||G.modal)return;G.mode='char';if(!G.char||G.char==='gear')G.char='hero';renderChar()}
function heroPage(){
 const m=vitals(),s=heroStats(),low=(v,mx)=>v<mx*.3?'bad':'';
 return '<div class="fb-character-sheet fb-hero-sheet"><div class="fb-character-stage"><strong>'+htmlText(P.name||'Your hero')+'</strong><img src="'+portrait('hero',true)+'" alt="'+htmlText(P.name||'Your hero')+'"><span>'+RACES[P.race].n+' · '+rankName()+'</span></div><div class="fb-character-stats">'+fbMeter('wounded','Health',P.hp,m[0],low(P.hp,m[0]))+fbMeter('speed','Stamina (your band’s)',P.sp,m[1],low(P.sp,m[1]))+fbMeter('skills','Mana',P.mp,m[2],low(P.mp,m[2]))+'<div class="fb-stat-grid">'+fbStat('sword','Attack',Math.round(s.dmg))+fbStat('renown','Level',P.level)+'</div><div class="fb-skills-summary">'+fbStat('skills','Skill points',P.tp)+fbBtn('open-skills',null,fbIcon('skills')+' Open Skills (K)','','primary')+'</div><small>'+htmlText((P.tree.length-1)+' skills learned. One skill point each level.')+'</small></div></div><div class="lab">Attributes · raised on the skill tree (K)</div><div class="fb-attributes">'+Object.keys(ATTRS).map((k,i)=>'<div>'+fbStat(['power','speed','book','banner'][i],ATTRS[k][0],P.attr[k])+fbDetails('Effects','<p>'+ATTRS[k][1]+'</p>')+'</div>').join('')+'</div>'+(P.perks.length?'<div class="lab">Perks from before</div><div class="fb-attributes">'+P.perks.map(p=>'<div class="fb-note"><strong>'+PERKS[p].n+'</strong><p>'+PERKS[p].d+'</p></div>').join('')+'</div>':'');
}
function renderChar(){
  const tab=G.char;let body='';
  if(tab==='hero'){
    body=heroPage();
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
  }else{body=partyPage()}
  const title=tab==='hero'?'Your hero':tab==='realms'?'Realms of Ashmark':tab==='lords'?'Lords':tab==='quests'?'Quests':htmlText(bandName());
  const tabs=fbTabs([['hero','Hero'],['party','Party'],['quests','Quests'],['lords','Lords'],['realms','Realms']],tab,'char-tab','Character sections');
  fbShow(title,RACES[P.race].n+' · level '+P.level+' · '+rankName(),tabs,tab==='party'||tab==='quests'?body:'<div class="fb-scroll" data-fb-scroll="char:'+tab+'">'+body+'</div>',tab==='quests'?questWindowBack():tab==='party'?partyBack():null,['char-close',null,'Back to map'],'fb-char fb-'+tab);
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
  else if(a==='army-merge-picked'){const to=G.armyMergeTarget;G.armyMergeTarget=null;if(partyRoster(P).merge(arg,to)){G.armyEdit=null;G.armyNotice='Groups merged; the destination keeps its name and wounded ownership.'}}
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
function armyGroupEditor(id,r){return partyGroupEditor(id,r)}
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
function openComp(id){if(!P.comps[id])return;if(G.mode!=='char'&&(G.modal||G.mode!=='world'))return;G.compBack=G.mode==='char'?'char':'world';G.mode='comp';G.compSel=id;G.compTransfer={};G.compTransferNotice='';G.compTab='overview';G.compDirection='give';renderComp()}
const CP_TRANSFER_WHY={source:'Choose a fit source group.',target:'Choose a destination group of the same unit type, or a new group.',amount:'Enter a whole number from 1 to the fit count of this group.',capacity:'Not enough receiving headcount capacity for this entire transfer.',groups:'Not enough army slots (10 maximum), including the companion if they rejoin.',leadership:'This companion does not yet meet the level and trust requirements to lead.',party:'This companion has no separate army.',distance:'Ride within 60 pixels to take soldiers back.',fighting:'Wait until this companion’s battle ends.',companion:'Companion unavailable.','same-army':'Choose two different armies.'};
const cpTransferWhy=q=>CP_TRANSFER_WHY[q.code]||'Transfer unavailable.';
function compTransferDraft(direction){return (G.compTransfer||(G.compTransfer={}))[direction]||((G.compTransfer[direction]={source:'',target:'new',count:1}))}
function compTransferStatus(q){return q.ok?'<span>Transfer '+q.count+' fit soldiers. Groups: source '+q.fromSlots+' → '+q.fromAfter+' / 10 · destination '+q.toSlots+' → '+q.toAfter+' / 10.</span>'+
  (q.rejoin?'<br>The companion will rejoin your band; their slot is included.':''):'<span class="bad">'+cpTransferWhy(q)+'</span>'}
function compTransferActions(direction,q,review){return review?'<div class="cp-review"><strong>Review: '+review.count+' × '+htmlText(ST[review.type].n)+'</strong><p>'+htmlText(review.sourceName||ST[review.type].n)+' ('+htmlText(review.source)+') → '+htmlText(review.target==='new'?'New group':review.targetName||ST[review.type].n)+(review.target==='new'?'':' ('+htmlText(review.target)+')')+'</p><p>'+
  (review.target!=='new'?'The destination keeps its name and formation.':review.whole?'Whole fit group: its name and formation move with it.':'Partial group: the new group starts with its default name and Line formation.')+'</p><div class="btns"><button type="button" class="btn primary" data-act="cm-transfer-confirm" data-arg="'+direction+'">Confirm transfer</button><button type="button" class="btn" data-act="cm-transfer-cancel" data-arg="'+direction+'">Cancel</button></div></div>':
  '<button type="button" class="btn" data-act="cm-transfer-review" data-arg="'+direction+'"'+(q.ok?'':' disabled')+'>Review transfer</button>'}
function compTransferBody(id,direction){return companionTransferFields(id,direction)}
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
function renderComp(){companionPage()}
onAct('cm-',(a,arg)=>{
  if(a==='cm-open')return openComp(arg);
  if(G.mode!=='comp')return;const id=G.compSel,keep=panel.scrollTop;
  if(a==='cm-back'){if(G.compBack==='char'){G.mode='char';renderChar()}else{G.mode='world';hidePanel()}return}
  if(a==='cm-army'){G.compTab='orders';renderComp();return}
  if(a==='cm-perk'){const c=compInit(id);if(c.perkPend>0&&COMP_PERKS[arg]&&!c.perks.includes(arg)){c.perks.push(arg);c.perkPend--;log(COMPS[id].short+' becomes '+COMP_PERKS[arg].n.toLowerCase()+'.','gold')}}
  else if(a==='cm-eq'){const [sl,i]=arg.split(':');if(compEquip(id,sl,+i))log(COMPS[id].short+' takes the '+ITEMS[compInit(id).gear[sl]].n+'.')}
  else if(a==='cm-off')compUnequip(id,arg);
  else if(a==='cm-tree'){openSkills('talents',id);return}// (its own tree, on the Skills page)
  else if(['cm-transfer-review','cm-transfer-confirm','cm-transfer-cancel'].includes(a))compTransferAction(a,arg);
  else if(a==='cm-order')cpOrder(id,arg);
  updateHUD(true);renderComp();panel.scrollTop=keep;
  if(a==='cm-transfer-review')panel.querySelector('[data-cp-transfer="'+arg+'"] [data-act="cm-transfer-confirm"]')?.focus({preventScroll:true});
});
