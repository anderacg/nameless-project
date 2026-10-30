'use strict';
/* ---------- the Journal's Trainers (world/trainers.js P.trainersMet): those you have met or heard of, the best first; each his
   level and roles, where he teaches (a holding's own, always there; a wanderer, where he was, or was said to be, and where next) ---------- */
function trainerListPage(){const M=Object.values(P.trainersMet||{}).sort((a,b)=>b.level-a.level||b.day-a.day);
  if(!M.length)return '<p class="muted">You know of no trainer yet. A holding\'s Barracks has its own; wandering ones are heard of in taverns.</p>';
  return '<div class="fb-path">'+M.map(m=>'<div class="fb-path-step"><strong>'+htmlText(m.name)+' · '+TRAINERS.levels[m.level-1]+'</strong><small>'+m.roles.map(r=>TRAINERS.roles[r]).join(', ')+' · trains to rank '+TRAINERS.cap[m.level-1]+'<br>'+
    (m.wander?(m.met?'Met':'Heard of')+' at '+htmlText(m.at)+' on Day '+m.day+(m.next?', going on to '+htmlText(m.next):'')+' (he wanders)':'At '+htmlText(m.at)+' (he stays)')+'</small></div>').join('')+'</div>'}
defineJournalSection('trainers',{label:'Trainers',icon:'shield',render:()=>'<div class="fb-scroll" data-fb-scroll="journal:trainers">'+trainerListPage()+'</div>',sub:()=>Object.keys(P.trainersMet||{}).length+' known'});
