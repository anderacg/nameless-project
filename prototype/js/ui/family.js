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
/* the tree: your line as a family (the owner, 2026-11-09: "Make family tree in a hierarchy"; kin, world/legacy.js KIN): each of it
   who fell and you, a child below the one they came from, a sibling or a cousin beside them (a cousin's line dashed), a stranger who
   took up the name a root of their own; the heir who kept one's company a branch off them (style.css .ft-tree) */
function familyPage(){const L=Legacy.line,f=Legacy.family,who=r=>(RACES[r.race]?RACES[r.race].n+' ':'')+(BGS[r.bg]?BGS[r.bg].n.toLowerCase():'');
  const now={n:L.length+1,now:true,who:heroName()||'You',race:P.race,bg:P.bg,rel:Legacy.kin?.rel||null,of:Legacy.kin?.of||null},all=[...L,now],by=new Map(all.map(r=>[r.n,r]));
  const up=r=>!r.rel||!by.has(r.of)?null:r.rel==='child'?r.of:up(by.get(r.of));
  const kids=new Map(),roots=[];for(const r of all){const p=up(r);if(p==null)roots.push(r);else{if(!kids.has(p))kids.set(p,[]);kids.get(p).push(r)}}
  const kinLine=r=>r.rel&&by.has(r.of)?KIN[r.rel].n+' of '+htmlText(by.get(r.of).who):r.n>1?'A stranger, who took up the name':'The first of the line';
  const card=r=>r.now?'<div class="ft-node"><span class="ft-n">'+ordinal(r.n)+' · you</span><b>'+htmlText(r.who)+'</b><small>'+kinLine(r)+'</small><small>'+who(P)+' · on the road since day '+(P.born||1)+' · level '+P.level+' · renown '+Math.round(P.renown||0)+'</small></div>':
    '<div class="ft-node"><span class="ft-n">'+ordinal(r.n)+'</span><b>'+htmlText(r.who)+'</b><small>'+kinLine(r)+'</small>'+
    '<small>'+who(r)+' · day '+r.born+' to '+r.day+' ('+r.days+' day'+(r.days===1?'':'s')+') · level '+r.level+' · renown '+r.renown+'</small>'+
    '<small class="bad">Fell to '+htmlText(r.by)+(r.near?' near '+htmlText(r.near):'')+'</small><small>'+familyRest(r)+'</small></div>'+familyHeir(r);
  const li=r=>{const ks=kids.get(r.n)||[];return '<li class="ft-li'+(r.now?' ft-now':'')+(r.rel==='cousin'?' ft-cousin':'')+'"><div class="ft-row">'+card(r)+'</div>'+(ks.length?'<ul>'+ks.map(li).join('')+'</ul>':'')+'</li>'};
  return '<div class="ft"><div class="lab">'+(f?'The '+htmlText(f)+' family':'Your line')+(L.length?' · '+L.length+' fallen':'')+'</div>'+
    (L.length?'':'<p class="muted">No one of your line has fallen yet. Those who do take their place above you here, and where they lie.</p>')+
    '<ul class="ft-tree">'+roots.map(li).join('')+'</ul></div>'}
defineJournalSection('family',{label:'Family',icon:'altar',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:family">'+familyPage()+'</div>',
  sub:()=>(Legacy.family?'The '+Legacy.family+' family':'Your line')+(Legacy.line.length?' · '+Legacy.line.length+' fallen':'')});
