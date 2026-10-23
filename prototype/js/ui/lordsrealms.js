'use strict';
/* ---------- the Journal's Lords and Realms (journal.js sections; were the Character window's tabs, moved 2026-10-23) ----------
   Realms: your standing (your contract, hostility), your fiefs, your siege, your reputation at every holding, each realm (its
   lands, treasury, holdings, lords in the field) and the relations between them. Lords: how each feels about you, and why;
   their friends and rivals ---------- */
function realmsPage(){
  const sw=f=>'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>';
  return '<div class="lab">Your standing</div><p>'+(P.fac?'You serve the '+sw(P.fac)+' as a mercenary, for '+troopCount()+' gold a day.':'You are independent. Sign a mercenary contract in a town tavern.')+
    FIDS.filter(f=>!P.fac&&Timed.of(P,'hostile').has(f)).map(f=>' The '+sw(f)+' is hostile to you until day '+Timed.of(P,'hostile').end(f)+'.').join('')+'</p>'+
    (playerFiefs().length?'<div class="lab" style="margin-top:6px">Your fiefs</div>'+playerFiefs().map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.label+' · garrison '+t.gar+' · '+fiefIncome(t)+' gold a day'+(besieged(t)?' · <span class="bad">under siege</span>':'')+'</small></div></div>').join(''):'')+
    (P.siege?'<p class="gold">You are besieging '+P.siege.town+' (day '+P.siege.days+').</p>':'')+
    '<div class="lab" style="margin-top:6px">Your reputation</div><p class="muted" style="font-size:13px">Standing at a holding = local reputation + half your honor with its owner + '+RACE_TRUST+' where your race lives. Tier 1 recruits need '+REP_NEED[1]+', tier 2 need '+REP_NEED[2]+'.</p>'+
    TOWNS.slice().sort((a,b)=>standingAt(b)-standingAt(a)).map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.label+' · '+sw(t.owner)+' · local '+Math.round(repAt(t.name))+'</small></div><span class="own'+(standingAt(t)>=REP_NEED[1]?' gold':'')+'">'+standingAt(t)+'</span></div>').join('')+
    (mythicNews('roams')?'<p class="bad">'+mythicNews('roams')+'</p>':'')+'<div class="lab" style="margin-top:6px">Factions</div>'+FIDS.map(f=>{const own=fiefsOf(f),ls=W.lords.filter(l=>l.fac===f&&!l.dead);
      return '<div class="row"><div class="info"><strong>'+sw(f)+(W.dead[f]?' <span class="bad">· fallen</span>':'')+'</strong><small>'+FACS[f].d+'</small><small>Your honor: '+honorWith(f)+'</small><small>Lands: '+landsOf(f)+' tiles · treasury '+Math.round(treas(f))+' gold'+(econWeary(f)?' · <span class="bad">weary of war</span>':'')+'</small><small>Holds: '+(own.map(t=>t.name+(besieged(t)?' (under siege)':'')).join(', ')||'nothing')+'</small><small>Lords in the field: '+(ls.map(l=>l.name+' ('+l.troops.length+' troops, power '+l.power()+')').join(', ')||'none')+'</small></div></div>'}).join('')+
    '<div class="lab" style="margin-top:6px">Relations</div>'+FIDS.flatMap((a,i)=>FIDS.slice(i+1).map(b=>[a,b])).filter(([a,b])=>!W.dead[a]&&!W.dead[b]).map(([a,b])=>{const r=relOf(a,b);
      return '<div class="row"><div class="info"><strong>'+sw(a)+' · '+sw(b)+'</strong><small>'+(r.s==='war'?'<span class="bad">At war</span>':r.s==='ally'?'<span class="good">Allied</span>':'At peace')+(r.since?' since day '+r.since:'')+'</small></div></div>'}).join('');
}
function lordsPage(){
  const ls=W.lords.filter(l=>!l.gone).sort((a,b)=>relWith(b)-relWith(a)),sw=f=>'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>';
  return '<p class="muted">How each lord feels about you. Fight beside them, do their work, spare them or give gifts to win them; beating, ransoming or failing them, or wronging their people, sours them, and their friends and rivals feel some of it. Friends (+'+RELATION.helpAt+') ride to help you, sworn friends (+'+RELATION.spareAt+') won\'t attack you, and those at +'+RELATION.troopsAt+' lend you soldiers.</p>'+
    ls.map(l=>{const why=(P.lrelWhy||{})[l.id]||[],fr=lordFriends(l).filter(o=>!o.dead).slice(0,2),rv=lordRivals(l).filter(o=>!o.dead).slice(0,2);
      return '<div class="row"><div class="info"><strong>'+l.name+' · '+sw(l.fac)+'</strong><small>'+(l.dead?'Beaten, raising a new army':l.inside?'In '+l.inside:l.fight?'In battle':l.state==='siege'?'Besieging '+l.tgt:'In the field')+' · '+l.troops.length+' soldiers'+(why.length?' · '+why[why.length-1].why:'')+'</small>'+
        ((fr.length||rv.length)?'<small>'+(fr.length?'Friends: '+fr.map(o=>o.name).join(', ')+'. ':'')+(rv.length?'Rivals: '+rv.map(o=>o.name).join(', ')+'.':'')+'</small>':'')+'</div><span class="own">'+relTag(relWith(l))+'</span></div>'}).join('');
}
defineJournalSection('lords',{label:'Lords',icon:'crown',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:lords">'+lordsPage()+'</div>',sub:()=>W.lords.filter(l=>!l.gone).length+' lords'});
defineJournalSection('realms',{label:'Realms',icon:'banner',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:realms">'+realmsPage()+'</div>',sub:()=>'Realms of Ashmark'});
