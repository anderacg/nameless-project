'use strict';
/* ---------- the Army window (C; ui/partypage.js lays it out), your hero's sheet, perks, and the commands of the roster ---------- */
function openChar(){if(G.mode!=='world'||G.modal)return;G.mode='char';const s=partyView();s.open=false;s.path=false;renderChar()}// (on a phone: the list first)
function heroPage(){
 const m=vitals(),s=heroStats(),low=(v,mx)=>v<mx*.3?'bad':'';
 return '<div class="fb-character-sheet fb-hero-sheet"><div class="fb-character-stage"><strong>'+htmlText(P.name||'Your hero')+'</strong><img src="'+portrait('hero',true)+'" alt="'+htmlText(P.name||'Your hero')+'"><span>'+RACES[P.race].n+' · '+rankName()+'</span></div><div class="fb-character-stats">'+fbMeter('wounded','Health',P.hp,m[0],low(P.hp,m[0]))+fbMeter('speed','Stamina (your band’s)',P.sp,m[1],low(P.sp,m[1]))+fbMeter('skills','Mana',P.mp,m[2],low(P.mp,m[2]))+'<div class="fb-stat-grid">'+fbStat('sword','Attack',Math.round(s.dmg))+fbStat('renown','Level',P.level)+'</div><div class="fb-skills-summary">'+fbStat('skills','Skill points',P.tp)+fbBtn('open-skills',null,fbIcon('skills')+' Open Skills (K)','','primary')+'</div><small>'+htmlText((P.tree.length-1)+' skills learned. One skill point each level.')+'</small></div></div><div class="lab">Attributes · raised on the skill tree (K)</div><div class="fb-attributes">'+Object.keys(ATTRS).map((k,i)=>'<div>'+fbStat(['power','speed','book','banner'][i],ATTRS[k][0],P.attr[k])+fbDetails('Effects','<p>'+ATTRS[k][1]+'</p>')+'</div>').join('')+'</div>'+(P.perks.length?'<div class="lab">Perks from before</div><div class="fb-attributes">'+P.perks.map(p=>'<div class="fb-note"><strong>'+PERKS[p].n+'</strong><p>'+PERKS[p].d+'</p></div>').join('')+'</div>':'');
}
// the window, its header the company muster (partypage.js partyHead): Roster, Army skills, Condition, Passengers (your quests are a
// window of their own: ui/questwindow.js; the lords and realms the Journal's: ui/lordsrealms.js)
function renderChar(){
  vitals();if(!ARMY_TABS.some(([t])=>t===G.char))G.char='roster';
  const tab=G.char,body=tab==='skills'?armySkillsPage():tab==='condition'?partyCondition():tab==='passengers'?partyPassengers():partyRosterPage();
  fbShow(htmlText(bandName()),'',fbTabs(ARMY_TABS,tab,'char-tab','Army sections'),'<div class="fb-party">'+body+'</div>',fbMenu(partyBack()),['char-close',null,'Back to map'],'fb-char fb-army fb-army-tab-'+tab,'Army',partyHead());fillIcons();
}
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
  if(a==='open-skills'){openSkills('talents');return true}
  if(a==='perk'){
    if(!has(arg))P.perks.push(arg);P.perkPend=Math.max(0,P.perkPend-1);G.perkOffer=null;log('New perk: '+PERKS[arg].n+'.','gold');updateHUD(true);
    if(P.perkPend>0&&showPerk(G.perkFrom))return true;
    if(G.perkFrom==='char'){G.mode='char';renderChar()}else{G.mode='world';hidePanel();saveGame(true)}
    return true;
  }
  if(G.mode!=='char')return false;
  const keep=panel.scrollTop;
  if(a==='char-tab'){if(ARMY_TABS.some(([t])=>t===arg)&&arg!==G.char){const s=partyView();G.char=arg;G.armyEdit=null;s.open=false;s.path=false}}
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
  else if(a==='dismiss'){if(P.comps[arg]){delete P.comps[arg];partyView().open=false;log(COMPS[arg].n+' leaves your band.'+(compTown(arg)?' You may find them in '+compTown(arg).name+' again.':''))}}
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

// what an attribute does for a companion, a lord or a chieftain (characters.js Character.base)
const CHAR_ATTR_FX={str:'+4 health and +0.5 damage a point',agi:'+2 speed and 3% faster blows a point',int:'Nothing in battle yet',cha:'Nothing in battle yet'};
/* a companion: its card opened on the Army window's Roster (from the map or its party met), its detail beside
   the cards (ui/companionpage.js): level, stats, disciplines, perks, the gear you give them, and a party of your soldiers to lead */
function openComp(id){if(!P.comps[id])return;if(G.mode!=='char'){if(G.modal||G.mode!=='world')return;G.mode='char'}G.char='roster';G.armyEdit=null;const s=partyView();s.sel='comp_'+id;s.open=true;s.path=false;compPick(id,true);renderChar()}
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
  const el=e.target,field=el.dataset.cpField,box=el.closest('[data-cp-transfer]');if(!box||!compShown()||!['source','target','count'].includes(field)||el.tagName==='SELECT'&&e.type==='input')return;
  const direction=box.dataset.cpTransfer,d=compTransferDraft(direction),value=field==='count'?Number(el.value):el.value;if(Object.is(d[field],value))return;
  d[field]=value;d.review=null;G.compTransferNotice='';
  if(field==='source'){d.target='new';d.count=1;const keep=panel.scrollTop;renderComp();panel.scrollTop=keep;panel.querySelector('[data-cp-transfer="'+direction+'"] [data-cp-field="source"]')?.focus({preventScroll:true});return}
  const q=cpTransferQuote(G.compSel,direction,d.source,d.count,d.target);box.querySelector('[data-cp-status]').innerHTML=compTransferStatus(q);
  const actions=box.querySelector('[data-cp-actions]'),review=actions.querySelector('[data-act="cm-transfer-review"]');
  if(review)review.disabled=!q.ok;else actions.innerHTML=compTransferActions(direction,q,null);
  panel.querySelector('[data-cp-notice]').textContent='';
}
function renderComp(){renderChar()}
onAct('cm-',(a,arg)=>{
  if(a==='cm-open')return openComp(arg);
  if(!compShown())return;const id=G.compSel,keep=panel.scrollTop;
  if(a==='cm-army'){G.compTab='orders';renderComp();return}
  if(a==='cm-perk'){const c=compInit(id);if(c.perkPend>0&&COMP_PERKS[arg]&&!c.perks.includes(arg)){c.perks.push(arg);c.perkPend--;log(COMPS[id].short+' becomes '+COMP_PERKS[arg].n.toLowerCase()+'.','gold')}}
  else if(a==='cm-eq'){const [sl,i]=arg.split(':');if(compEquip(id,sl,+i))log(COMPS[id].short+' takes the '+ITEMS[compInit(id).gear[sl]].n+'.')}
  else if(a==='cm-off')compUnequip(id,arg);
  else if(a==='cm-tree'){openSkills('talents',id);return}// (its own tree, on the Skills view)
  else if(['cm-transfer-review','cm-transfer-confirm','cm-transfer-cancel'].includes(a))compTransferAction(a,arg);
  else if(a==='cm-order')cpOrder(id,arg);
  updateHUD(true);renderComp();panel.scrollTop=keep;
  if(a==='cm-transfer-review')panel.querySelector('[data-cp-transfer="'+arg+'"] [data-act="cm-transfer-confirm"]')?.focus({preventScroll:true});
});
