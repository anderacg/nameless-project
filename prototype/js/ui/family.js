'use strict';
/* ---------- the Journal's Family (the owner, 2026-11-09: a family tree of your line; journal.js section): you now, the
   generation you are, then each of your line who fell, the last first (world/legacy.js Legacy.line): their people and past, the
   days they lived, their level and renown, what killed them and where, the heir who kept their company, and where they lie now
   (their resting place, world/lineage.js RestSite: buried or not, prayed at or what lingers there) ---------- */
// (where one of your line lies: their grave, if it is known, and its place)
function familyRest(r){const g=Remains.list.find(o=>o.grave&&o.who===r.who&&o.day===r.day);if(!g)return '<span class="muted">Where they lie is not known.</span>';
  const s=W.sites.find(x=>x.type==='rest'&&x.members().includes(g)),at=s?htmlText(s.name):htmlText(g.name);
  return (g.unburied?'<span class="bad">Lies unburied</span>, '+at:'Lies in '+at)+(g.spent?' · prayed at':g.xp?' · <span class="gold">'+g.xp+' experience lingers</span>':'')}
function familyPage(){const L=Legacy.line,f=Legacy.family,who=r=>(RACES[r.race]?RACES[r.race].n+' ':'')+(BGS[r.bg]?BGS[r.bg].n.toLowerCase():'');
  const now='<div class="lab">Now</div><div class="row"><div class="info"><strong>'+htmlText(heroName()||'You')+(L.length?' · the '+ordinal(L.length+1)+' of your line':'')+'</strong><small>'+who(P)+' · on the road since day '+(P.born||1)+' · level '+P.level+' · renown '+Math.round(P.renown||0)+'</small></div></div>';
  if(!L.length)return now+'<p class="muted">No one of your line has fallen yet. Those who do are named here, the last first, and where they lie.</p>';
  return now+'<div class="lab">'+(f?'The '+htmlText(f)+' family':'Your line')+' · '+L.length+' fallen</div>'+L.slice().reverse().map(r=>'<div class="row"><div class="info"><strong>'+cap1(ordinal(r.n))+' · '+htmlText(r.who)+'</strong>'+
    '<small>'+who(r)+' · day '+r.born+' to '+r.day+' ('+r.days+' day'+(r.days===1?'':'s')+') · level '+r.level+' · renown '+r.renown+'</small>'+
    '<small>Fell to '+htmlText(r.by)+(r.near?' near '+htmlText(r.near):'')+(r.heir?' · '+htmlText(r.heir)+' kept their company':'')+'</small><small>'+familyRest(r)+'</small></div></div>').join('')}
defineJournalSection('family',{label:'Family',icon:'altar',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:family">'+familyPage()+'</div>',
  sub:()=>(Legacy.family?'The '+Legacy.family+' family':'Your line')+(Legacy.line.length?' · '+Legacy.line.length+' fallen':'')});
