'use strict';
/* ---------- the Journal's Lords and Realms (journal.js sections; were the Character window's tabs, moved 2026-10-23) ----------
   Realms: your standing (your contract, hostility), your fiefs, your siege, your reputation at known holdings, each known realm (its
   last known holdings and known lords) and the relations between them. Lords: how each feels about you, and why;
   their friends and rivals ---------- */
const journalLords=()=>W.lords.filter(l=>!l.gone&&KNOWLEDGE.knowsLord(l));
const journalRealms=()=>FIDS.filter(f=>KNOWLEDGE.knowsRealm(f));
const journalReport=l=>{const r=KNOWLEDGE.lords[l.id];return r?'Last known · day '+r.at+(r.day>r.at?' (heard day '+r.day+')':'')+': '+htmlText(r.text):'Last known: whereabouts unknown'};
function realmsPage(){
  const fs=journalRealms(),known=TOWNS.filter(t=>Object.hasOwn(KNOWLEDGE.holdings,t.name)),sw=f=>'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>';
  return '<div class="lab">Your standing</div><p>'+(P.fac?'You serve the '+sw(P.fac)+' as a mercenary, for '+troopCount()+' gold a day.':'You are independent. Sign a mercenary contract in a town tavern.')+
    fs.filter(f=>!P.fac&&Timed.of(P,'hostile').has(f)).map(f=>' The '+sw(f)+' is hostile to you until day '+Timed.of(P,'hostile').end(f)+'.').join('')+'</p>'+
    (playerFiefs().length?'<div class="lab" style="margin-top:6px">Your fiefs</div>'+playerFiefs().map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.label+' · garrison '+t.gar+' · '+fiefIncome(t)+' gold a day'+(besieged(t)?' · <span class="bad">under siege</span>':'')+'</small></div></div>').join(''):'')+
    (P.siege?'<p class="gold">You are besieging '+P.siege.town+' (day '+P.siege.days+').</p>':'')+
    '<div class="lab" style="margin-top:6px">Your reputation</div><p class="muted" style="font-size:13px">Standing at a holding = local reputation + half your honor with its owner + '+RACE_TRUST+' where your race lives. Tier 1 recruits need '+REP_NEED[1]+', tier 2 need '+REP_NEED[2]+'.</p>'+
    known.slice().sort((a,b)=>standingAt(b)-standingAt(a)).map(t=>'<div class="row"><div class="info"><strong>'+t.name+'</strong><small>'+t.label+' · '+sw(KNOWLEDGE.holdings[t.name].fac)+' · local '+Math.round(repAt(t.name))+'</small></div><span class="own'+(standingAt(t)>=REP_NEED[1]?' gold':'')+'">'+standingAt(t)+'</span></div>').join('')+
    (mythicNews('roams')?'<p class="bad">'+mythicNews('roams')+'</p>':'')+'<div class="lab" style="margin-top:6px">Known realms</div>'+(!fs.length?'<p class="muted">No realms known yet. Explore holdings or listen for news.</p>':'')+fs.map(f=>{const own=Object.entries(KNOWLEDGE.holdings).filter(([,r])=>r.fac===f),ls=journalLords().filter(l=>l.fac===f);
      return '<div class="row"><div class="info"><strong>'+sw(f)+(W.dead[f]?' <span class="bad">· fallen</span>':'')+'</strong><small>'+FACS[f].d+'</small><small>Your honor: '+honorWith(f)+'</small><small>Last known holdings: '+(own.map(([n,r])=>htmlText(n)+' (day '+r.day+')').join(', ')||'none known')+'</small><small>Known lords: '+(ls.map(l=>htmlText(l.name)).join(', ')||'none known')+'</small></div></div>'}).join('')+
    '<div class="lab" style="margin-top:6px">Relations</div>'+fs.flatMap((a,i)=>fs.slice(i+1).map(b=>[a,b])).filter(([a,b])=>!W.dead[a]&&!W.dead[b]).map(([a,b])=>{const r=relOf(a,b);
      return '<div class="row"><div class="info"><strong>'+sw(a)+' · '+sw(b)+'</strong><small>'+(r.s==='war'?'<span class="bad">At war</span>':r.s==='ally'?'<span class="good">Allied</span>':'At peace')+(r.since?' since day '+r.since:'')+'</small></div></div>'}).join('');
}
function lordsPage(){
  const ls=journalLords().sort((a,b)=>relWith(b)-relWith(a)),sw=f=>'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>';
  return '<p class="muted">How each lord feels about you. Fight beside them, do their work, spare them or give gifts to win them; beating, ransoming or failing them, or wronging their people, sours them, and their friends and rivals feel some of it. Friends (+'+RELATION.helpAt+') ride to help you, sworn friends (+'+RELATION.spareAt+') won\'t attack you, and those at +'+RELATION.troopsAt+' lend you soldiers.</p>'+
    (!ls.length?'<p class="muted">No lords known yet. Meet their armies, visit a lord’s hall, or listen for rumours and news.</p>':'')+ls.map(l=>{const why=(P.lrelWhy||{})[l.id]||[],fr=lordFriends(l).filter(o=>!o.dead&&KNOWLEDGE.knowsLord(o)).slice(0,2),rv=lordRivals(l).filter(o=>!o.dead&&KNOWLEDGE.knowsLord(o)).slice(0,2);
      return '<div class="row"><img class="lord-portrait" src="'+lordPic(l)+'" alt="" loading="lazy"><div class="info"><strong>'+htmlText(l.name)+' · '+sw(l.fac)+'</strong><small>'+journalReport(l)+(why.length?' · '+why[why.length-1].why:'')+'</small>'+
        ((fr.length||rv.length)?'<small>'+(fr.length?'Friends: '+fr.map(o=>o.name).join(', ')+'. ':'')+(rv.length?'Rivals: '+rv.map(o=>o.name).join(', ')+'.':'')+'</small>':'')+'</div><span class="own">'+relTag(relWith(l))+'</span></div>'}).join('');
}
defineJournalSection('lords',{label:'Lords',icon:'crown',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:lords">'+lordsPage()+'</div>',sub:()=>journalLords().length+' known lord'+(journalLords().length===1?'':'s')});
defineJournalSection('realms',{label:'Realms',icon:'banner',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:realms">'+realmsPage()+'</div>',sub:()=>journalRealms().length+' known realm'+(journalRealms().length===1?'':'s')});
