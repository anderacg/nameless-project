'use strict';
/* ---------- the Army window (C; the Menu's Army), its header the company muster (your band's name and its bars, on every tab).
   Its four tabs are its top level, each its bar's Back to the Game Menu. Roster: one list of cards in battle order, your hero, your companions and your troop groups, each its kind's icon and its experience, opening its detail
   beside it (on a narrow phone, as a page of its own). Army skills: the band's skills, who gives
   them, and the companions' roles. Condition. Passengers: escorts, prisoners and captives. The commands stay their owners'
   (character.js charAct, companionpage.js, talents.js, captives.js); this file presents them ---------- */
const ARMY_TABS=[['roster','Roster'],['skills','Army skills'],['condition','Condition'],['passengers','Passengers']];
const partyView=()=>G.partyUI||(G.partyUI={sel:'hero',open:false,path:false});
// what a roster card is: your hero, a companion ('comp_' and its id) or a troop group; its icon and word
const rosterKind=id=>id==='hero'?'hero':id.startsWith('comp_')?'comp':'troop';
const ROSTER_KIND={hero:['rosterhero','Your hero'],comp:['rostercomp','Companion'],troop:['rostertroop','Troops']};
const partyFull=()=>{const s=partyView();return G.char==='roster'&&s.open&&fbNarrow()};
// (the screen's shape the Roster was laid out for: a turned phone lays it out again)
const partyShape=()=>[partyFull(),fbShort(),fbNarrow()].join();
addEventListener('resize',()=>{if(G.mode==='char'&&G.char==='roster'&&!FIELDBOOK.pick&&partyView().shape!==partyShape()){if(G.march)renderMarch();else renderChar()}});
const partyBack=()=>G.char==='roster'&&(G.armyEdit||partyView().path||partyFull())?['party-back',null,'Back']:null;
function partyGroup(id,r=partyRoster(P)){const g=r.groups.find(g=>g.id===id),w=(P.woundedGroups||[]).find(g=>g.id===id),cid=id.startsWith('comp_')?id.slice(5):null,c=cid&&P.comps[cid],type=g?.type||w?.type,hurt=c&&c.hurt>G.day+Clock.frac;
  return{id,g,cid,type,name:armyGroupLabel(id,r),fit:g?g.count:id==='hero'?1:c&&!hurt?1:0,wounded:type?r.wounded(id):hurt?1:0,pic:portrait(type||cid||'hero',id==='hero'),sub:type?ST[type].n+' · '+((g?.count||0)+r.wounded(id))+' / '+r.groupCap(type):cid?'Companion':'Your hero',hurt};
}
// a card's experience: your hero's and a companion's toward the next level, a troop type's toward training (pooled by type)
function rosterXp(id,u){
  if(id==='hero')return{v:P.xp,max:LV_XP(P.level),txt:'Lv. '+P.level+' · '+Math.floor(P.xp)+' / '+LV_XP(P.level)+' XP'};
  if(u.cid){const c=compInit(u.cid);return{v:c.xp,max:LV_XP(c.lv),txt:'Lv. '+c.lv+' · '+Math.floor(c.xp)+' / '+LV_XP(c.lv)+' XP'}}
  const k=u.type,need=(P.troops[k]||0)*txpNeed(k);
  return !UP[k]?{v:1,max:1,txt:'Top tier'}:need?{v:txpOf(k),max:need,txt:Math.floor(txpOf(k))+' / '+need+' to train'}:{v:0,max:1,txt:'No fit soldiers to train'};
}
function partyCard(id,r,index){const g=partyGroup(id,r),kind=rosterKind(id),[ico,word]=ROSTER_KIND[kind],on=partyView().sel===id,x=rosterXp(id,g),share=g.fit/Math.max(1,g.fit+g.wounded)*100;
  return '<button type="button" class="fb-unit fb-'+kind+(on?' on':'')+'" data-army-group="'+id+'" data-kind="'+kind+'" data-act="party-select" data-arg="'+id+'" aria-pressed="'+on+'"><span class="fb-unit-key">'+(g.hurt||!g.fit?'—':index)+'</span><span class="fb-unit-kind" title="'+word+'">'+fbIcon(ico,14)+'<span class="fb-sr">'+word+': </span>'+htmlText(g.type?classN(ST[g.type]):g.sub)+'</span><img src="'+g.pic+'" alt=""><strong>'+htmlText(g.name)+'</strong><small>'+htmlText(g.sub)+'</small><span class="fb-unit-count">'+fbIcon('troops',14)+'<b>'+g.fit+'</b> fit<span class="grow"></span>'+fbIcon('wounded',14)+'<b>'+g.wounded+'</b>'+(g.wounded?' wounded':'')+'</span><span class="fb-bar"><i style="width:'+share+'%"></i></span>'+
    '<span class="fb-unit-xp" role="meter" aria-label="'+(kind==='troop'?'Training':'Experience')+'" aria-valuemin="0" aria-valuemax="'+x.max+'" aria-valuenow="'+clamp(x.v,0,x.max)+'"><i style="width:'+Math.round(clamp(x.v/Math.max(1,x.max),0,1)*100)+'%"></i></span><small class="fb-unit-xptxt">'+x.txt+'</small></button>';
}
// the window's header, the company muster (to read, not a link): its standard, the band's name, its groups, fit and wounded, and the
// Fitness, Morale and Stamina bars
function partyHead(){const S=supplyNow(),F=bandFitness(),r=partyRoster(P);return '<span class="fb-standard" aria-hidden="true"></span><div class="fb-company"><small>Army</small><h2>'+htmlText(bandName())+'</h2><small class="fb-muster-count">'+r.slots+' / '+r.groupLimit+' groups · '+F.fit+' fit + hero · '+F.wounded+' wounded</small></div><div class="fb-muster-meters">'+fbMeter('shield','Fitness',F.pct,100,F.pct<50?'bad':'')+fbMeter('morale','Morale',P.morale,100,P.morale<30?'warn':'')+fbMeter('speed','Stamina',P.bsta,100,S.st==='fresh'?'':'warn')+'<span class="fb-muster-note">'+(S.tags.length?S.tags.slice(0,2).map(([n])=>htmlText(n)).join(' · '):'On the road')+(S.drinkDays<1?' · Low drink':'')+'</span></div>'}
function partyCondition(){const S=supplyNow(),F=bandFitness(),r=partyRoster(P),d=n=>Number.isFinite(n)?(Math.floor(n*10)/10)+'d':'—';return '<div class="fb-army-layout"><section class="fb-pane fb-condition"><div class="fb-pane-head"><h3>Army condition</h3><span>'+htmlText(S.st)+'</span></div><div class="fb-scroll" data-fb-scroll="army-condition"><div class="fb-condition-tags">'+S.tags.map(([n,c,why])=>'<details class="fb-tag '+c+'"><summary>'+htmlText(n)+'</summary><p>'+htmlText(why)+'</p></details>').join('')+'</div><div class="fb-condition-facts">'+fbStat('troops','Fit fighters',F.fit+1)+fbStat('wounded','Wounded',F.wounded)+fbStat('banner','Groups',r.slots+' / '+r.groupLimit)+fbStat('power','Power',partyPower())+fbStat('food','Food',d(S.foodDays))+fbStat('mug','Drink',d(S.drinkDays),S.drinkDays<1?'warn':'')+fbStat('people','Headcount',partySize()+' / '+partyCap())+fbStat('gold','Gold',P.gold)+'</div><div class="btns fb-condition-supplies">'+fbBtn('party-supplies',null,fbIcon('bag')+'Supplies')+'</div>'+partyPowerParts()+'<div class="fb-recovery">'+fbIcon('fire',24)+'<b>Stamina '+(S.r.n>=0?'+':'')+Math.round(S.r.n*10)/10+' / hour</b><span>'+htmlText(S.r.why.join(' · '))+'</span></div>'+fbDetails('Condition and recovery','<p>Fitness includes the fit, wounded, companions and your hero’s health ('+Math.round(F.hp*100)+'%). Power is a separate combat estimate.</p><p>Camp restores '+SUPPLY.rest.camp+' stamina per hour and wounded heal faster. Tired below '+SUPPLY.tired+'%; Exhausted below '+SUPPLY.exhausted+'%. Return to the map to camp safely. Supply days use the current consumption rate.</p>'+woundedPanel())+'<div class="fb-details"><h3>Recruitment</h3><p>Troop groups hold up to 10 soldiers. Hero and companions each use one slot. Start with 3 slots; each trained Leadership level above 2 unlocks another, up to 10.</p><div class="btns">'+fbBtn('army-recruit','new','New recruit group',r.slots>=r.groupLimit?'No free group':'')+'</div></div></div></section></div>'}
// party power by fighter: your hero, each companion and each troop type, strongest first
function partyPowerParts(){const tr=Object.keys(P.troops).filter(k=>P.troops[k]>0),total=partyPower(),parts=[[P.name?htmlText(P.name):'You','Level '+P.level+' hero',rating(['hero'])],...Object.keys(P.comps).map(id=>[COMPS[id].n,'Companion',rating([id])]),...tr.map(k=>[ST[k].n,P.troops[k]+' × '+rating([k]),rating(Array(P.troops[k]).fill(k))])].sort((a,b)=>b[2]-a[2]);
  return fbDetails('Party power · '+total,parts.map(([n,sub,v])=>'<div class="row"><div class="info"><strong>'+n+'</strong><small>'+sub+'</small><div class="bar" aria-hidden="true"><i style="width:'+Math.round(v/Math.max(1,total)*100)+'%"></i></div></div><span class="own">'+v+'</span></div>').join('')+'<p class="muted">Each fighter counts as the square root of health × damage per second, added up across your band. Compare it with the number shown before each fight.'+(skill('tact')?' Tactics also adds '+5*skill('tact')+'% when you auto-resolve.':'')+'</p>')}
function partyGroupEditor(id,r){const g=r.groups.find(g=>g.id===id),name=r.nameOf(id),full=r.slots>=r.groupLimit,at=r.order.indexOf(id);return '<div class="army-editor" data-army-editor="'+id+'">'+(G.armyNotice?'<p role="status">'+htmlText(G.armyNotice)+'</p>':'')+'<label>Group name<input data-army-name maxlength="32" value="'+htmlText(name)+'" placeholder="'+htmlText(armyGroupLabel(id,r))+'"></label><div class="btns">'+fbBtn('army-name-save',id,'Save name')+fbBtn('army-name-reset',id,'Use default')+'</div><div class="fb-edit-actions">'+fbBtn('army-move',id+':-1','↑ Move up',at<=0?'First in order':'')+fbBtn('army-move',id+':1','↓ Move down',at<0||at>=r.order.length-1?'Last in order':'')+'</div>'+(g?fbQuantity(Math.max(1,Math.floor(g.count/2)),Math.max(1,g.count-1),'data-army-split')+'<div class="btns">'+fbBtn('army-split-exact',id,'Split this number',full||g.count<2?'Needs a free group and two fit soldiers':'')+fbBtn('party-merge',id,'Merge group',r.groups.some(o=>o.id!==id&&o.type===g.type)?'':'No matching group')+'</div><small>Only fit soldiers split. Wounded stay with '+htmlText(armyGroupLabel(id,r))+'.</small>':'')+'</div>'}
// where its morale would start a battle now (your band's morale against its own Morale: matchups.js unitMoraleOf)
function battleMoraleMeter(st){const mor=Math.round(unitMoraleOf(st)),now=Math.round(clamp(mor*(.6+.4*clamp(P.morale,0,100)/100),20,100));return fbMeter('banner','Battle morale',now,mor)}
// One roster inspector: the same fields and order for a hero, companion or troop group.
function partyUnit(id,r){const u=partyGroup(id,r),kind=rosterKind(id),c=kind==='hero'?P:u.cid?compInit(u.cid):null,ch=c&&charOf(c,kind==='hero'?'hero':u.cid);
  if(u.cid)charKit(ch);const s=ch?ch.stats():ST[u.type];return{id,u,kind,c,ch,s,level:kind==='hero'?P.level:c?c.lv:s.tier};
}
function partyUnitStat(ico,label,value,why='Not applicable to this unit'){
  return value==null?fbStat(ico,label,'—','fb-unavailable').replace('<div ','<div aria-disabled="true" title="'+htmlText(why)+'" '):fbStat(ico,label,value);
}
function partyUnitMeter(ico,label,value,max,why){
  if(value!=null){const m=fbMeter(ico,label,value,max,value<max*.3?'bad':'');return max===100?m.replace(/<b>[^<]*<\/b>/,'<b>'+Math.round(clamp(value,0,max))+' / 100</b>'):m}
  return '<div class="fb-meter fb-unavailable" aria-disabled="true" aria-label="'+htmlText(label)+': Not applicable" title="'+htmlText(why||'Not applicable to this unit')+'"><div>'+fbIcon(ico)+'<span>'+htmlText(label)+'</span><b>—</b></div><div class="fb-bar"></div></div>';
}
function partyUnitSection(id,key,label,body,open=false){const s=partyView(),saved=s.sections&&s.sections[id+':'+key];
  return '<details class="fb-details fb-unit-details" data-unit-section="'+key+'"'+((saved??open)?' open':'')+'><summary>'+label+'</summary>'+body+'</details>';
}
panel.addEventListener('toggle',e=>{const d=e.target;if(!d.matches('.fb-unit-details'))return;const s=partyView(),id=d.closest('[data-unit-id]').dataset.unitId;(s.sections||(s.sections={}))[id+':'+d.dataset.unitSection]=d.open},true);
function partyUnitRemember(){const s=partyView();panel.querySelectorAll('[data-unit-id] .fb-unit-details').forEach(d=>{const id=d.closest('[data-unit-id]').dataset.unitId;(s.sections||(s.sections={}))[id+':'+d.dataset.unitSection]=d.open})}
function partyUnitActions(d,r){const edit=G.armyEdit===d.id,why=d.kind==='troop'?!d.u.g?'No fit group to reinforce':'':'Individual characters cannot be reinforced',managed=r.order.includes(d.id);
  const button=(a,arg,label,why,cls)=>fbBtn(a,arg,label,why,cls).replace('<button ','<button'+(why?' title="'+htmlText(why)+'" aria-label="'+htmlText(label+': '+why)+'"':'')+' ');
  return '<div class="btns fb-inspector-acts fb-unit-actions">'+button(edit?'army-edit-close':'army-edit',d.id,edit?'Done':'Manage group',managed?'':'This companion is leading another army','primary')+
    button('army-recruit',d.id,'Reinforce',why)+button(d.kind==='hero'?'open-skills':d.kind==='comp'?'cm-tree':'party-path',d.kind==='troop'?d.id:null,'Development')+'</div>';
}
function partyUnitAttributes(d){if(d.kind==='hero')return heroPage();if(d.kind==='comp')return companionSkills(d.u.cid,d.c,d.ch)+
    (d.c.perkPend?'<section class="fb-perks"><h3>Choose a perk</h3>'+Object.keys(COMP_PERKS).filter(p=>!d.c.perks.includes(p)).map(p=>fbBtn('cm-perk',p,COMP_PERKS[p].n+'<small>'+COMP_PERKS[p].d+'</small>')).join('')+'</section>':'');
  return '<div class="fb-stat-grid">'+partyUnitStat('skills','Skill points',null)+partyUnitStat('book','Learned',null)+'</div><div class="lab">Attributes</div><div class="fb-attributes">'+Object.keys(ATTRS).map((k,i)=>'<div>'+partyUnitStat(['power','speed','book','banner'][i],ATTRS[k][0],null)+'<button type="button" class="btn sm fb-attribute-effects" disabled title="Not applicable to troop groups">Effects</button></div>').join('')+'</div><p class="fb-note">Not applicable: troops develop through training, not character attributes or skill points.</p>';
}
function partyUnitEquipment(d){if(d.kind==='comp')return companionEquipment(d.u.cid,d.c);
  if(d.kind==='hero')return '<div class="fb-gear-rows">'+EQUIP.map(k=>{const it=P.gear[k]&&ITEMS[P.gear[k]],label=k.startsWith('ring')?'Ring '+(+k.slice(4)+1):INV_SLOT_LABELS[k]||SLOTS[slotOfKey(k)];return '<div class="fb-gear-row">'+fbIcon('shield',26)+'<div><small>'+htmlText(label)+'</small><strong>'+htmlText(it?it.n:'Empty')+'</strong></div></div>'}).join('')+'</div>'+fbBtn('party-equipment',null,'Change equipment');
  return '<p class="fb-note">Fixed troop loadout. Equipment changes when this troop type is trained.</p><div class="fb-stat-grid">'+fbStat('shield','Armour',ARMOR[armorOf(d.s)].n)+fbStat('sword','Damage type',DMG[dtOf(d.s)].n)+'</div>';
}
function partyUnitCompany(d){if(d.kind!=='comp')return '<p class="fb-note fb-unavailable" aria-disabled="true">— Not applicable. Company roles and separate party orders are for companions.</p>';
  return '<div class="fb-stat-grid">'+fbStat('morale','Approval',apName(d.c.ap)+' ('+d.c.ap+')')+'</div>'+companionRole()+companionOrders(d.u.cid,d.c)+fbDetails('Company service','<p>'+htmlText(COMPS[d.u.cid].short)+' can leave your company and be found again in a tavern. Upkeep: 2 gold a day.</p>'+fbBtn('party-dismiss',null,'Dismiss from company'));
}
function partyUnitOverview(d){const {u,c,s,kind}=d,h=kind==='hero',v=h?vitals():null,missile=missileDmgOf(s),ammo=missile?quiverOf(s):null,x=rosterXp(d.id,u),hurt=u.hurt;
  const current=h?P.hp:kind==='comp'&&hurt?Math.round(s.hp*compHealthShare(c)):s.hp,charge=s.range?null:s.charge?CHARGE.cav:CHARGE.foot;
  return '<div class="lab">Group</div><div class="fb-stat-grid" data-unit-fields="group">'+fbStat('troops','Fit',u.fit)+fbStat('wounded','Wounded',u.wounded)+'</div>'+
    '<div class="lab">Combat</div>'+partyUnitMeter('wounded','Health',current,s.hp)+'<small class="fb-unit-note">'+(kind==='troop'?'Health per soldier':hurt?'Recovering: '+Math.ceil(Math.max(0,c.hurt-G.day-Clock.frac)*24)+' recovery hours remaining':'Current / maximum health')+'</small>'+
    '<div class="fb-stat-grid" data-unit-fields="combat">'+partyUnitStat('sword','Attack',Math.round(meleeDmgOf(s)))+partyUnitStat('eye','Missile',missile?Math.round(missile):null)+partyUnitStat('region','Range',s.range||null)+partyUnitStat('shield','Armour',ARMOR[armorOf(s)].n)+partyUnitStat('speed','Speed',s.spd)+partyUnitStat('sword','Reach',s.reach||null)+partyUnitStat('bag','Ammunition',ammo===Infinity?'Unlimited':ammo)+partyUnitStat('power','Charge',charge?'+'+Math.round(charge*100)+'%':null)+'</div>'+
    '<div class="lab">Condition</div>'+battleMoraleMeter(s)+partyUnitMeter('speed','Stamina',h?P.sp:null,h?v[1]:100,'No individual campaign stamina is tracked for this unit')+partyUnitMeter('skills','Mana',h?P.mp:null,h?v[2]:100,'No individual campaign mana is tracked for this unit')+
    '<small class="fb-unit-note fb-unavailable">— Not applicable to this unit</small><div class="lab">Progress</div>'+fbMeter('skills',kind==='troop'?'Training · all '+ST[u.type].n:'Experience to level '+(d.level+1),x.v,x.max)+'<p class="fb-training-note">'+(kind==='troop'?(UP[u.type]?txpReady(u.type)+' ready to train at a barracks':'Top tier — no further training'):'Skill points: '+c.tp+' · '+(c.tree.length-1)+' learned')+'</p>'+
    partyUnitSection(d.id,'character','Character details',partyUnitAttributes(d),!!c?.perkPend)+partyUnitSection(d.id,'gear','Equipment',partyUnitEquipment(d))+
    partyUnitSection(d.id,'company','Company role and orders',partyUnitCompany(d))+
    partyUnitSection(d.id,'details','Unit details','<div class="fb-stat-grid">'+fbStat('speed','Battle vigor',vigorOf(s))+fbStat('sword','Damage type',DMG[dtOf(s)].n)+'</div>'+(kind==='comp'?'<p>'+htmlText(COMPS[u.cid].d||'')+'</p>':'')+'<p>'+htmlText(vsLine(s))+'</p>'+unitAbilities(s).map(([n,why])=>'<p><strong>'+htmlText(n)+'</strong> · '+htmlText(why)+'</p>').join('')+'<p class="fb-note">Dimmed fields (—) are not applicable to this unit.</p>');
}
function partyDetail(id,r){return partyInspector(id,r)}
function heroDetail(r){return partyInspector('hero',r)}
function partyInspector(id,r){const d=partyUnit(id,r),edit=G.armyEdit===id,path=d.kind==='troop'&&partyView().path,cls=d.kind==='hero'?' fb-person-detail fb-hero-detail':d.kind==='comp'?' fb-person-detail fb-comp-detail':'',type={hero:'Hero',comp:'Companion',troop:'Troop'}[d.kind],sub=type+' · '+(d.kind==='troop'?'Tier ':'Level ')+d.level+' · '+(d.kind==='hero'?rankName():classN(d.s));
  return '<section class="fb-pane fb-inspector fb-unit-inspector'+cls+'" data-unit-id="'+id+'" data-unit-kind="'+d.kind+'"><div class="fb-scroll" data-fb-scroll="army:'+id+(edit?':edit':path?':path':'')+'">'+(path?troopPath(d.u.type):'<div class="fb-figure"><img src="'+d.u.pic+'" alt=""></div><div class="fb-title"><small>'+htmlText(sub)+'</small><h3 title="'+htmlText(d.u.name)+'">'+htmlText(d.u.name)+'</h3></div>'+partyUnitActions(d,r)+(edit?partyGroupEditor(id,r):partyUnitOverview(d)))+'</div></section>';
}

/* a troop type's skills: its training path (where it is trained from, what it trains into, at a barracks), its battle orders (the
   unit abilities it has: battle/unitabilities.js, asked of one of its soldiers) and its traits (unitcard.js) */
function troopOrdersOf(k){const u={s:ST[k],type:k,team:0,ally:false};return UNIT_ABIL_ORDER.filter(id=>UNIT_ABILITIES[id].who(u))}
function troopPath(k){const s=ST[k],from=UP_FROM(k),need=(P.troops[k]||0)*txpNeed(k),orders=troopOrdersOf(k),traits=unitAbilities(s),row=(n,sub,cls='')=>'<div class="fb-path-step'+cls+'"><strong>'+n+'</strong><small>'+sub+'</small></div>';
  return '<div class="fb-title"><small>Training path and abilities</small><h3>'+htmlText(s.n)+'</h3></div>'+(UP[k]?fbMeter('skills','Training · all '+s.n,txpOf(k),Math.max(1,need))+'<p class="fb-training-note">'+txpReady(k)+' ready to train at a barracks</p>':'<p class="fb-note">The top of its path: it trains no further.</p>')+
    '<div class="lab">Path</div><div class="fb-path">'+(from?row(ST[from].n,'Tier '+ST[from].tier+' · trained from'):'')+row(s.n,'Tier '+s.tier+' · '+classN(s)+' · now',' on')+(UP[k]||[]).map(t=>row(ST[t].n,'Tier '+ST[t].tier+' · '+classN(ST[t])+' · '+trainCost(t)+'g each at a barracks')).join('')+'</div>'+
    '<div class="lab">Battle orders</div>'+(orders.length?orders.map(id=>row(UNIT_ABILITIES[id].n+' ('+UNIT_ABILITIES[id].key+')',UNIT_ABILITIES[id].d)).join(''):'<p class="muted">No special orders.</p>')+
    '<div class="lab">Traits</div>'+(traits.length?traits.map(([n,d])=>row(n,d)).join(''):'<p class="muted">No special traits.</p>');
}
function partyRosterPage(){
  const s=partyView(),r=partyRoster(P);if(G.armyEdit){s.sel=G.armyEdit;s.open=true}
  const recover=[...new Set((P.woundedGroups||[]).filter(w=>w.count>0&&!r.groups.some(g=>g.id===w.id)).map(w=>w.id))],away=Object.keys(P.comps).filter(id=>P.comps[id].party).map(id=>'comp_'+id),ids=[...r.order,...recover,...away];
  if(!ids.includes(s.sel)){s.sel=ids[0];s.path=false}if(rosterKind(s.sel)==='comp')compPick(s.sel.slice(5));
  const full=partyFull(),cls=(s.open?' open':'')+(full?' full':'');const numbers=marchNumbers(P);s.shape=partyShape();
  return '<div class="fb-army-layout'+cls+'"><div class="fb-split"><section class="fb-pane fb-collection"><div class="fb-pane-head"><h3>Battle order</h3><span>'+r.slots+' / '+r.groupLimit+'</span></div><div class="fb-scroll fb-unit-grid" data-fb-scroll="army-roster">'+r.order.map(id=>{const g=partyGroup(id,r);return partyCard(id,r,numbers[id]??'—')}).join('')+
    (recover.length?'<div class="fb-section">Recovering groups · no fit soldiers</div>'+recover.map(id=>partyCard(id,r,'—')).join(''):'')+(away.length?'<div class="fb-section">Away · leading their own party</div>'+away.map(id=>partyCard(id,r,'—')).join(''):'')+
    '<div class="btns fb-recruit-options">'+(WORLD_BATTLE.on?fbBtn('march-open',null,'March formation'):'')+fbBtn('army-recruit','new','New recruit group',r.slots>=r.groupLimit?'No free group':'')+'</div></div></section>'+partyDetail(s.sel,r)+'</div></div>';
}
/* ---- Army skills: your band's skills are your hero's (parties.js Leader.skill): what you have trained, with what a companion in its
   role adds (a Scout to Scouting, a Surgeon to Medicine: 2 and a third of theirs, Leader.roleBonus), your gear and your skill tree.
   The Quartermaster and the Guide give the band their own effects (Leader.eatPerDay, world/supply.js, world.js bandPace) */
const BAND_SKILLS=[['Command',['lead','tact','med','eng','pers']],['The road',['scout','surv','wood','hunt','ride','athl']],['Trade and rule',['trade','stew']]];
const BAND_SKILL_ICON={lead:'banner',tact:'map',med:'wounded',eng:'tower',pers:'truce',scout:'eye',surv:'fire',wood:'axe',hunt:'furs',ride:'shoe',athl:'speed',trade:'gold',stew:'house'};
const ROLE_ICON={scout:'eye',surgeon:'wounded',quarter:'bag',guide:'map'};
// who gives a skill: [who, how much], yours first
function bandSkillFrom(k){const rid=k==='scout'?roleOf('scout'):k==='med'?roleOf('surgeon'):null,rb=P.roleBonus(k),g=P.gearSkill(k),t=P.treeSkill(k);
  return [['You',P.sk[k].lv],...(rb?[[COMPS[rid].short+' ('+ROLES[k==='scout'?'scout':'surgeon']+')',rb]]:[]),...(g?[['Gear',g]]:[]),...(t?[['Skill tree',t]]:[])]}
// (Athletics on foot and Riding in the saddle also spare the band's stamina on the march: world/supply.js)
function bandSkillNote(k){if(k!=='athl'&&k!=='ride')return '';const ride=mountedShare(bandSpeeds())>=.5,on=ride===(k==='ride');
  return '<small class="'+(on?'good':'muted')+'">On the march your band tires '+Math.round(Math.min(SUPPLY.skillCap,SUPPLY.skill*skill(k))*100)+'% less'+(on?' (it is '+(ride?'mostly mounted':'mostly on foot')+')':' when '+(k==='ride'?'mostly mounted':'mostly on foot'))+'.</small>'}
// what a role gives now
function roleFx(k,id){
  if(!id)return {scout:'A Scout adds 2 and a third of their Scouting to yours.',surgeon:'A Surgeon adds 2 and a third of their Medicine to yours.',quarter:'Your band would eat 25% less food.',guide:'Your band would tire less on the march and travel faster.'}[k];
  if(!compInBand(id))return 'Away leading their own party: no effect until they rejoin.';
  return k==='scout'?'+'+P.roleBonus('scout')+' Scouting':k==='surgeon'?'+'+P.roleBonus('med')+' Medicine':k==='quarter'?'Your band eats 25% less food.':'Your band tires '+Math.round((1-SUPPLY.guide)*100)+'% less on the march and travels '+Math.round(3+compSkill(id,'scout'))+'% faster (3% and 1% a level of their Scouting).';
}
function armySkillsPage(){
  const comps=Object.keys(P.comps),row=(cls,ico,name,from,does,end)=>'<div class="fb-bskill'+cls+'">'+fbIcon(ico,26)+'<div><strong>'+name+'</strong><small>'+from+'</small><p>'+does+'</p></div>'+end+'</div>';
  const roles=Object.keys(ROLES).map(k=>{const id=roleOf(k);return row(' fb-brole',ROLE_ICON[k],ROLES[k],id?htmlText(COMPS[id].n):comps.length?'Vacant':'Vacant · find companions in town taverns',htmlText(roleFx(k,id)),fbBtn('party-holder',k,'Choose',comps.length?'':'No companions'))}).join('');
  const skills=BAND_SKILLS.map(([group,ks])=>'<div class="lab">'+group+'</div>'+ks.map(k=>row('',BAND_SKILL_ICON[k],SKILLS[k].n,bandSkillFrom(k).map(([n,v],i)=>i?n+' +'+v:n+' '+v).join(' · '),SKILLS[k].d+'.'+bandSkillNote(k),'<b class="fb-bskill-v" aria-label="'+SKILLS[k].n+' '+skill(k)+'">'+skill(k)+'</b>')).join('')).join('');
  return '<div class="fb-army-layout"><section class="fb-pane fb-bskills-pane"><div class="fb-pane-head"><h3>Army skills</h3><span>'+Object.keys(ROLES).filter(roleOf).length+' / '+Object.keys(ROLES).length+' roles held</span></div><div class="fb-scroll fb-bskills" data-fb-scroll="army-skills"><p class="fb-note">Your band’s skills are your hero’s: what you have trained, what companions in their roles add, your gear and your skill tree. The fighting disciplines are on your hero’s Skills.</p><div class="lab">Company roles</div>'+roles+skills+'</div></section></div>';
}
// a role's holder chosen (the companion pages' role choice, from the role's side): one holder each, Cancel/Apply
function armyRolePick(k){
  const holder=roleOf(k)||'';
  fbChoose({title:'Choose the '+ROLES[k],sub:ROLE_NOTES[k],value:holder,items:[{id:'',name:'No one',ico:ROLE_ICON[k],sub:'Leave the role vacant'},...Object.keys(P.comps).map(id=>{const c=compInit(id);return{id,name:COMPS[id].n,pic:portrait(id),sub:'Scouting '+compSkill(id,'scout')+' · Medicine '+compSkill(id,'med')+(c.party?' · away leading their own party':''),note:c.role&&c.role!==k?COMPS[id].short+' is your '+ROLES[c.role]+' now. Assigning this role ends that one.':holder&&holder!==id?COMPS[holder].short+' holds this role. Assigning it here removes their assignment.':''}})],
    back:renderChar,apply:id=>{if(id)compSetRole(id,k);else if(holder)P.comps[holder].role='';updateHUD(true);renderChar()},focus:'[data-act="party-holder"][data-arg="'+k+'"]'});
}
/* ---- Passengers: everyone who travels with you but does not fight. Escorts (world/escort.js), prisoners (P.prisoners) and captives
   (world/captives.js: lords and chiefs held), each with its own actions */
function partyEscorts(){const L=Escort.list();return '<div class="lab">Escorted ('+L.length+' / '+ESCORT.max+')</div>'+(L.length?L.map(q=>'<div class="fb-prisoner fb-escort">'+fbIcon(Escort.who(q.who).ico,40)+'<div><strong>'+htmlText(cap1(q.pn))+'</strong><small>To '+htmlText(q.to.name)+', '+Escort.way(q)+' · '+Escort.left(q)+' · eats '+q.eat+' food a day · does not fight</small></div></div>').join(''):'<p class="muted">No one to escort. Escort quests bring them.</p>')}
function partyPrisoners(){return Object.keys(P.prisoners).filter(k=>P.prisoners[k]>0).map(k=>{const q=recruitment.quotePrisoner(k);return '<div class="fb-prisoner"><img src="'+portrait(k)+'" alt=""><div><strong>'+htmlText(ST[k].n)+'</strong><small>'+P.prisoners[k]+' prisoners · Ransom '+RANSOM[ST[k].tier]+'g each</small>'+(!q.ok?'<small class="bad">'+htmlText(recruitmentWhy(q))+'</small>':'')+'</div><div class="btns">'+fbBtn('p-recruit',k,'Recruit '+q.cost+'g',q.ok?'':recruitmentWhy(q))+fbBtn('p-release',k,'Release')+'</div></div>'}).join('')||'<p class="muted">No prisoners. Win battles to take some.</p>'}
function partyPassengers(){return '<div class="fb-army-layout"><section class="fb-pane fb-passengers-pane"><div class="fb-pane-head"><h3>Passengers</h3><span>'+[[Escort.list().length,'escorted','escorted'],[prisonerCount(),'prisoner','prisoners'],[captives().length,'captive','captives']].map(([n,one,many])=>n+' '+(n===1?one:many)).join(' · ')+'</span></div><div class="fb-scroll fb-passengers" data-fb-scroll="passengers"><p class="fb-note">Everyone who travels with you but does not fight: they take no place in your ranks.</p>'+partyEscorts()+'<div class="lab">Prisoners ('+prisonerCount()+' / '+prisonCap()+')</div>'+partyPrisoners()+captivesHtml()+'</div></section></div>'}
onAct('party-',(a,arg)=>{
  if(a==='party-equipment-back'&&G.mode==='inv'&&G.invArmy){G.invArmy=false;G.mode='char';renderChar();return}
  if(typeof companionPageAct==='function'&&companionPageAct(a,arg))return;
  if(G.mode!=='char')return;const s=partyView();partyUnitRemember();fbRemember();
  if(a==='party-select'){s.sel=arg;s.open=true;s.path=false;G.armyEdit=null;if(rosterKind(arg)==='comp')compPick(arg.slice(5))}
  else if(a==='party-back'){if(G.armyEdit)G.armyEdit=null;else if(s.path)s.path=false;else s.open=false}
  else if(a==='party-path'){s.path=!s.path;G.armyEdit=null}
  else if(a==='party-holder'){if(ROLES[arg]&&Object.keys(P.comps).length)armyRolePick(arg);return}
  else if(a==='party-equipment'){G.mode='world';hidePanel();openInv();G.invArmy=true;G.invView='equipment';renderInv();return}
  else if(a==='party-supplies'){G.mode='world';hidePanel();openInv();G.invTab='supplies';renderInv();return}
  else if(a==='party-merge'){const r=partyRoster(P),g=r.groups.find(g=>g.id===arg);if(!g)return;fbChoose({title:'Merge into matching group',value:null,items:r.groups.filter(o=>o.id!==arg&&o.type===g.type).map(o=>({id:o.id,name:armyGroupLabel(o.id,r),sub:o.count+' fit · '+r.wounded(o.id)+' wounded',pic:portrait(o.type)})),back:renderChar,apply:id=>{G.armyMergeTarget=id;charAct('army-merge-picked',arg)}});return}
  else return;renderChar();
});
