'use strict';
/* ---------- a companion in the Army window (ui/partypage.js): its shared unit inspector on the Roster, expandable Equipment, Character details and
   reviewed army Orders. Role, equipment and dismissal choices are pages with Cancel/Apply ---------- */
// what a company role does (the role choice pages' notes)
const ROLE_NOTES={scout:'Scouting bonus; grows with their discipline.',surgeon:'Medicine bonus; grows with their discipline.',quarter:'Your band eats 25% less.',guide:'Reduces stamina drain on the march.',trainer:'Drills your groups of their roles in camp: '+TRAINERS.week+' lessons a week.'};
// the companion the Army window shows (its card open on the Roster), or none
const compShown=()=>G.mode==='char'&&G.char==='roster'&&partyView().sel==='comp_'+G.compSel&&!!P.comps[G.compSel];
// a companion's card chosen: its drafts start afresh when it is another one (fresh: always)
function compPick(id,fresh){if(!fresh&&G.compSel===id)return;G.compSel=id;G.compTransfer={};G.compTransferNotice='';G.compTab='overview';G.compDirection='give'}
// a role given: one holder each, so whoever had it gives it up
function compSetRole(id,k){if(k)Object.values(P.comps).forEach(o=>{if(o.role===k)o.role=''});compInit(id).role=k}
function companionRole(){const c=compInit(G.compSel);return '<div class="fb-role"><div><small>Company role</small><strong>'+htmlText(c.role?ROLES[c.role]:'No role')+'</strong></div>'+fbBtn('party-role',null,'Choose role')+'</div>'}
function companionEquipment(id,c){return '<div class="fb-gear-rows">'+COMP_SLOTS.map(sl=>{const it=c.gear[sl]&&ITEMS[c.gear[sl]],why=compEquipment(id).blockedWhy(sl);return '<div class="fb-gear-row">'+(it?'<span data-icon="gear:'+c.gear[sl]+'"></span>':fbIcon('shield',26))+'<div><small>'+SLOTS[sl]+'</small><strong>'+htmlText(it?it.n:'Empty')+'</strong>'+(why?'<small class="bad">'+htmlText(why)+'</small>':'')+'</div>'+fbBtn('party-gear',sl,'Change',why)+(it?fbBtn('cm-off',sl,'Take back'):'')+'</div>'}).join('')+'</div>'}
function companionSkills(id,c,ch){return heroPage(c,true)+'<div class="fb-active-skills">'+ch.actives().map(k=>'<div>'+fbIcon('skills',26)+'<strong>'+HSKILLS[k].n+'</strong><small>'+HSKILLS[k].d+'</small></div>').join('')+'</div>'+fbDetails('Disciplines','<div class="keys">'+Object.keys(COMP_SK).map(k=>'<div><kbd>'+c.sk[k].lv+'</kbd><span>'+COMP_SK[k]+'</span></div>').join('')+'</div>')}
function companionOrders(id,c){const p=c.party,dir=G.compDirection||'give';return '<div class="fb-order-buttons">'+['follow','patrol','stay','return'].map((a,i)=>fbBtn('cm-order',a,['Follow','Patrol here','Stay in town','Come back'][i],!p?'Give them a party first':'',p?.order===a?'on':'')).join('')+'</div>'+(!canLead(id)?'<p class="fb-note">Requires level '+COMP_LEAD.lv+' and approval '+COMP_LEAD.ap+' to lead a party.</p>':'')+(p?'<p>'+p.troops.length+' soldiers · '+partyRoster(p).slots+' / '+ARMY_LIMIT+' groups · '+htmlText(p.order)+'</p>':'')+'<p data-cp-notice role="status">'+htmlText(G.compTransferNotice||'')+'</p>'+fbTabs([['give','Give soldiers'],['take','Take back']],dir,'party-transfer-dir','Transfer direction')+compTransferBody(id,dir)}
// The same inspector as every other roster card.
function companionDetail(id,r){return partyInspector('comp_'+id,r)}
function companionTransferFields(id,direction){
  const p=compInit(id).party,from=direction==='give'?partyRoster(P):p&&partyRoster(p),to=direction==='give'?p&&partyRoster(p):partyRoster(P),groups=from?from.order.map(k=>from.groups.find(g=>g.id===k)).filter(Boolean):[],d=compTransferDraft(direction);
  if(!groups.some(g=>g.id===d.source)){d.source=groups[0]?.id||'';d.target='new';d.count=1;d.review=null}const g=groups.find(g=>g.id===d.source),q=cpTransferQuote(id,direction,d.source,d.count,d.target),target=to&&to.groups.find(g=>g.id===d.target);
  return '<section class="cp-transfer" data-cp-transfer="'+direction+'"><h3>'+(direction==='give'?'Give soldiers to '+COMPS[id].short:'Take soldiers back')+'</h3>'+(g?'<div class="fb-transfer-choices"><div><small>Source group</small><strong>'+htmlText(g.name||ST[g.type].n)+'</strong><span>'+g.count+' fit · '+from.wounded(g.id)+' wounded</span>'+fbBtn('party-transfer-pick',direction+':source','Choose group')+'</div><div><small>Destination group</small><strong>'+htmlText(d.target==='new'?'Create a separate group':target?.name||ST[target?.type]?.n||'Unavailable')+'</strong>'+fbBtn('party-transfer-pick',direction+':target','Choose destination')+'</div></div>'+fbQuantity(d.count,g.count,'data-cp-field="count"')+'<div data-cp-status role="status">'+compTransferStatus(q)+'</div><div data-cp-actions>'+compTransferActions(direction,q,d.review)+'</div>':'<p class="muted">No fit troop groups to transfer.</p>')+'<p class="fb-note">Only fit soldiers move. Wounded stay with their group. Taking soldiers back requires proximity.</p></section>';
}
function companionPageAct(a,arg){
  if(a!=='party-comp-tab'&&!['party-role','party-dismiss','party-gear','party-transfer-dir','party-transfer-pick'].includes(a))return false;
  if(!compShown())return false;const id=G.compSel,c=compInit(id);partyUnitRemember();fbRemember();
  if(a==='party-comp-tab'){if(['overview','gear','skills','orders'].includes(arg)){G.compTab=arg;const s=partyView();(s.tabs||(s.tabs={}))[s.sel]=({gear:'gear',orders:'role'})[arg]||'character'}}
  else if(a==='party-transfer-dir'){if(['give','take'].includes(arg))G.compDirection=arg}
  else if(a==='party-dismiss'){
    fbChoose({title:'Dismiss '+COMPS[id].short+'?',value:'leave',items:[{id:'leave',name:'Leave the company',sub:'You may find them in '+(compTown(id)?.name||'a tavern')+' again.',pic:portrait(id)}],confirm:'Dismiss',back:renderComp,apply:()=>charAct('dismiss',id)});return true;
  }else if(a==='party-role'){
    fbChoose({title:'Choose company role',value:c.role||'',items:[{id:'',name:'No company role',ico:'hero',sub:'Keep them free of an assignment'},...Object.keys(ROLES).map(k=>{const owner=Object.keys(P.comps).find(x=>P.comps[x].role===k);return{id:k,name:ROLES[k],ico:k==='scout'?'eye':k==='surgeon'?'wounded':'bag',sub:ROLE_NOTES[k]||'',note:owner&&owner!==id?COMPS[owner].short+' holds this role. Assigning it here removes their assignment.':''}})],back:renderComp,apply:k=>{compSetRole(id,k);updateHUD(true);renderComp()},focus:'[data-act="party-role"]'});return true;
  }else if(a==='party-gear'){
    const sl=arg,fit=compFits(id,sl),items=fit.map(([x,i])=>({id:i,name:ITEMS[x.id].n,sub:ITEMS[x.id].d,ico:'sword'}));
    if(!items.length)items.push({id:'none',name:'No eligible equipment',why:'Find equipment for this slot in your bag.'});
    fbChoose({title:'Choose '+SLOTS[sl].toLowerCase(),value:null,items,back:renderComp,apply:i=>{if(compEquip(id,sl,Number(i)))toast(COMPS[id].short+' takes the '+ITEMS[c.gear[sl]].n+'.');updateHUD(true);renderComp()},focus:'[data-act="party-gear"][data-arg="'+sl+'"]'});return true;
  }else if(a==='party-transfer-pick'){
    const [direction,field]=arg.split(':'),d=compTransferDraft(direction),p=c.party,from=direction==='give'?partyRoster(P):p&&partyRoster(p),to=direction==='give'?p&&partyRoster(p):partyRoster(P),g=from&&from.groups.find(g=>g.id===d.source);
    const rows=field==='source'?from?from.order.map(k=>from.groups.find(g=>g.id===k)).filter(Boolean):[]:to?.groups.filter(o=>o.type===g?.type)||[],items=rows.map(o=>({id:o.id,name:o.name||ST[o.type].n,sub:o.count+' fit · '+(field==='source'?from:to).wounded(o.id)+' wounded',pic:portrait(o.type)}));
    if(field==='target')items.unshift({id:'new',name:'Create a separate group',sub:'The transfer quote checks receiving capacity and group slots.',ico:'banner'});
    fbChoose({title:field==='source'?'Choose source group':'Choose destination',value:d[field],items,back:renderComp,apply:k=>{d[field]=k;d.review=null;if(field==='source'){d.target='new';d.count=1}renderComp()},focus:'[data-act="party-transfer-pick"][data-arg="'+arg+'"]'});return true;
  }else return false;renderComp();return true;
}
