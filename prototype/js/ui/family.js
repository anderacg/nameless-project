'use strict';
/* ---------- the Journal's Family (the owner, 2026-11-09: a family tree of your line; journal.js section): you now, the
   generation you are, then each of your line who fell, the last first (world/legacy.js Legacy.line): their people and past, the
   days they lived, their level and renown, what killed them and where, the heir who kept their company, and where they lie now
   (their resting place, world/lineage.js RestSite: buried or not, prayed at or what lingers there) ---------- */
// (where one of your line lies: their grave, if it is known, and its place)
function familyRest(r){const g=Remains.list.find(o=>o.grave&&o.who===r.who&&o.day===r.day);if(!g)return '<span class="muted">Where they lie is not known.</span>';
  const s=W.sites.find(x=>x.type==='rest'&&x.members().includes(g)),at=s?htmlText(s.name):htmlText(g.name);
  return (g.unburied?'<span class="bad">Lies unburied</span>, '+at:'Lies in '+at)+(g.spent?' · prayed at':g.xp?' · <span class="gold">'+g.xp+' experience lingers</span>':'')}
// (the heir who kept one's company, a branch off them: who, and how they stand now)
function familyHeir(r){if(!r.heir)return '';const l=r.heirId&&W.lords.find(o=>o.id===r.heirId),now=!l?'':l.gone||l.dead&&l.back>=1e9?'<span class="bad">fallen</span>':(FACS[l.fac]?'a lord of the '+htmlText(FACS[l.fac].n):'a lord');
  return '<div class="ft-branch"><div class="ft-node ft-heir"><span class="ft-n">Heir</span><b>'+htmlText(r.heir)+'</b><small>Kept their company'+(now?' · now '+now:'')+'</small></div></div>'}
/* the tree: your line from its first, down to you, each generation a node on one stem (a dot and the line between them), its heir a
   branch off it (style.css .ft) */
function familyPage(){const L=Legacy.line,f=Legacy.family,who=r=>(RACES[r.race]?RACES[r.race].n+' ':'')+(BGS[r.bg]?BGS[r.bg].n.toLowerCase():'');
  const gen=r=>'<li class="ft-gen"><div class="ft-node"><span class="ft-n">'+ordinal(r.n)+'</span><b>'+htmlText(r.who)+'</b>'+
    '<small>'+who(r)+' · day '+r.born+' to '+r.day+' ('+r.days+' day'+(r.days===1?'':'s')+') · level '+r.level+' · renown '+r.renown+'</small>'+
    '<small class="bad">Fell to '+htmlText(r.by)+(r.near?' near '+htmlText(r.near):'')+'</small><small>'+familyRest(r)+'</small></div>'+familyHeir(r)+'</li>';
  const now='<li class="ft-gen ft-now"><div class="ft-node"><span class="ft-n">'+(L.length?ordinal(L.length+1)+' · ':'')+'you</span><b>'+htmlText(heroName()||'You')+'</b><small>'+who(P)+' · on the road since day '+(P.born||1)+' · level '+P.level+' · renown '+Math.round(P.renown||0)+'</small></div></li>';
  return '<div class="ft"><div class="lab">'+(f?'The '+htmlText(f)+' family':'Your line')+(L.length?' · '+L.length+' fallen':'')+'</div>'+
    (L.length?'':'<p class="muted">No one of your line has fallen yet. Those who do take their place above you here, and where they lie.</p>')+
    '<ol class="ft-line">'+L.map(gen).join('')+now+'</ol></div>'}
defineJournalSection('family',{label:'Family',icon:'altar',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:family">'+familyPage()+'</div>',
  sub:()=>(Legacy.family?'The '+Legacy.family+' family':'Your line')+(Legacy.line.length?' · '+Legacy.line.length+' fallen':'')});
