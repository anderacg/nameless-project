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
      (playerFiefs().length?'<div class="lab" style="margin-top:6px">Your fiefs</div>'+playerFiefs().map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.kind+' · garrison '+t.gar+' · '+fiefIncome(t)+' gold a day'+(besieged(t)?' · <span class="bad">under siege</span>':'')+'</small></div></div>').join(''):'')+
      (P.siege?'<p class="gold">You are besieging '+P.siege.town+' (day '+P.siege.days+').</p>':'')+
      '<div class="lab" style="margin-top:6px">Your reputation</div><p class="muted" style="font-size:13px">Standing at a holding = local reputation + half your honor with its owner + '+RACE_TRUST+' where your race lives. Tier 1 recruits need '+REP_NEED[1]+', tier 2 need '+REP_NEED[2]+'.</p>'+
      TOWNS.slice().sort((a,b)=>standingAt(b)-standingAt(a)).map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.kind+' · '+sw(t.owner)+' · local '+Math.round(repAt(t.name))+'</small></div><span class="own'+(standingAt(t)>=REP_NEED[1]?' gold':'')+'">'+standingAt(t)+'</span></div>').join('')+
      (mythicNews('roams')?'<p class="bad">'+mythicNews('roams')+'</p>':'')+'<div class="lab" style="margin-top:6px">Factions</div>'+FIDS.map(f=>{const own=fiefsOf(f),ls=W.lords.filter(l=>l.fac===f&&!l.dead);
        return '<div class="row"><div class="info"><strong>'+sw(f)+(W.dead[f]?' <span class="bad">· fallen</span>':'')+'</strong><small>'+FACS[f].d+'</small><small>Your honor: '+honorWith(f)+'</small><small>Lands: '+landsOf(f)+' tiles · treasury '+Math.round(treas(f))+' gold'+(econWeary(f)?' · <span class="bad">weary of war</span>':'')+'</small><small>Holds: '+(own.map(t=>t.name+(besieged(t)?' (under siege)':'')).join(', ')||'nothing')+'</small><small>Lords in the field: '+(ls.map(l=>l.name+' ('+l.troops.length+' troops, power '+rating(l.troops)+')').join(', ')||'none')+'</small></div></div>'}).join('')+
      '<div class="lab" style="margin-top:6px">Relations</div>'+FIDS.flatMap((a,i)=>FIDS.slice(i+1).map(b=>[a,b])).filter(([a,b])=>!W.dead[a]&&!W.dead[b]).map(([a,b])=>{const r=relOf(a,b);
        return '<div class="row"><div class="info"><strong>'+sw(a)+' · '+sw(b)+'</strong><small>'+(r.s==='war'?'<span class="bad">At war</span>':r.s==='ally'?'<span class="good">Allied</span>':'At peace')+(r.since?' since day '+r.since:'')+'</small></div></div>'}).join('');
  }else{
    const tr=Object.keys(P.troops).filter(k=>P.troops[k]>0);
    const total=partyPower(),parts=[['You','Level '+P.level+' hero',rating(['hero'])],...Object.keys(P.comps).map(id=>[COMPS[id].n,'Companion',rating([id])]),
      ...tr.map(k=>[ST[k].n,P.troops[k]+' × '+rating([k]),rating(Array(P.troops[k]).fill(k))])].sort((a,b)=>b[2]-a[2]);
    body='<div class="top"><span class="lab">Party power</span><span class="gold" style="font-size:22px">'+total+'</span></div>'+parts.map(([n,sub,v])=>'<div class="row"><div class="info"><strong>'+n+'</strong><small>'+sub+'</small><div class="bar" aria-hidden="true"><i style="width:'+Math.round(v/Math.max(1,total)*100)+'%"></i></div></div><span class="own">'+v+'</span></div>').join('')+
      '<p class="muted">Each fighter counts as the square root of health × damage per second, added up across your band. Compare it with the number shown before each fight.'+(skill('tact')?' Tactics also adds '+5*skill('tact')+'% when you auto-resolve.':'')+'</p>'+
      '<div class="lab" style="margin-top:6px">Troops ('+partySize()+' / '+partyCap()+')</div>'+(tr.length?tr.map(k=>'<div class="row"><div class="info"><strong>'+ST[k].n+'</strong><small>Tier '+ST[k].tier+' · '+ST[k].hp+' hp · '+ST[k].dmg+' damage</small><small class="vs">'+vsLine(ST[k])+'</small></div><span class="own">×'+P.troops[k]+'</span></div>').join(''):'<p class="muted">No troops. Hire some in town.</p>')+
      '<div class="lab" style="margin-top:6px">Companions</div>'+(compCount()?Object.keys(P.comps).map(id=>{const c=P.comps[id];
        return '<div class="row"><div class="info"><strong>'+COMPS[id].n+'</strong><small>'+apName(c.ap)+' ('+(c.ap>0?'+':'')+c.ap+') · '+(c.role?ROLES[c.role]:'no role')+'</small></div><div class="acts">'+
          Object.keys(ROLES).map(r=>'<button class="btn sm'+(c.role===r?' on':'')+'" type="button" data-act="role" data-arg="'+id+':'+r+'" aria-pressed="'+(c.role===r)+'">'+ROLES[r]+'</button>').join('')+
          '<button class="btn sm" type="button" data-act="dismiss" data-arg="'+id+'">Dismiss</button></div></div>'}).join('')+
        '<p class="muted">Scout: +2 Scouting. Surgeon: +2 Medicine. Quartermaster: band eats 25% less.</p>':'<p class="muted">None yet. Look for them in town taverns.</p>')+
      '<div class="lab" style="margin-top:6px">Prisoners ('+prisonerCount()+' / '+prisonCap()+')</div>'+(prisonerCount()?Object.keys(P.prisoners).filter(k=>P.prisoners[k]>0).map(k=>'<div class="row"><div class="info"><strong>'+ST[k].n+'</strong><small>Ransom '+RANSOM[ST[k].tier]+'g in a town tavern</small></div><span class="own">×'+P.prisoners[k]+'</span><div class="acts">'+
        '<button class="btn sm" type="button" data-act="p-recruit" data-arg="'+k+'"'+(P.gold<10||partySize()>=partyCap()?' disabled':'')+'>Recruit 10g</button>'+
        '<button class="btn sm" type="button" data-act="p-release" data-arg="'+k+'">Release</button></div></div>').join(''):'<p class="muted">None. Win battles to take some.</p>');
  }
  showPanel('<div class="top"><h2>'+(tab==='hero'?'Your hero':tab==='realms'?'Realms of Ashmark':tab==='quests'?'Quests':'Your party')+'</h2><span class="muted">'+RACES[P.race].n+' · level '+P.level+' · '+rankName()+'</span></div><div class="tabs">'+
    [['hero','Hero'],['party','Party'],['quests','Quests'],['realms','Realms']].map(x=>'<button class="btn sm'+(x[0]===tab?' on':'')+'" type="button" data-act="char-tab" data-arg="'+x[0]+'">'+x[1]+'</button>').join('')+
    '</div><div>'+body+'</div><div class="btns"><button class="btn primary" type="button" data-act="char-close">Back to map</button></div>');
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
  else if(a==='p-recruit'){if(P.prisoners[arg]>0&&P.gold>=10&&partySize()<partyCap()){P.gold-=10;P.prisoners[arg]--;P.troops[arg]=(P.troops[arg]||0)+1;log('A captured '+ST[arg].n.toLowerCase()+' swears to follow you.')}}
  else if(a==='p-release'){if(P.prisoners[arg]>0){P.prisoners[arg]--;P.renown++;log('You let '+an(ST[arg].n.toLowerCase())+' go free. +1 renown.');mood('release')}}
  else return false;
  updateHUD(true);renderChar();panel.scrollTop=keep;
  const again=panel.querySelector('[data-act="'+a+'"][data-arg="'+arg+'"]:not([disabled])')||panel.querySelector('[data-act="char-tab"].on');if(again)again.focus({preventScroll:true});
  return true;
}
