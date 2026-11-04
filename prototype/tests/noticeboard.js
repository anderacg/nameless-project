'use strict';
// The notice board (ui/noticeboard.js; the owner, 2026-11-04: "a board like an actual board screen with papers pinned"; "how
// do you know who to see if they don't say who the poster is"): a cork board, each offer a paper pinned to it, tilted its own
// way; each says who posted it and where to find them (a giver by name, trade and place; a questbook notice its own); a locked
// one stamped with what it asks; an empty board one paper saying why; it fits the screen.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',19);Kit.world();Kit.clear();
 const ash=t.townBy('Ashford'),q=Kit.q,qa=Kit.qa;ash.gar=ash.T.gar-5;
 t.bandits.push(t.asParty({x:ash.x+240,y:ash.y+60,n:5,kind:'bandits',list:t.makeEnemies(5,false,'bandits'),t:0,a:0,idle:true,cool:99,ld:t.newChief('bandits',2)}));
 const open=()=>{Kit.goHome(ash);t.enterTown(ash);t.act('tab','jobs')};
 P.jobs={};P.level=5;open();
 {const notes=qa('.nb .nb-note'),jobs=notes.filter(n=>n.querySelector('[data-act="q-accept"]'));
  ok(q('.nb')&&jobs.length===t.jobsAt(ash).length&&jobs.length>0,'the board: a paper for each offer ('+jobs.length+')');
  ok(new Set(notes.map(n=>n.style.getPropertyValue('--tilt'))).size>1,'tilted each its own way');
  ok(jobs.every((n,i)=>{const g=t.Quest.as(t.jobsAt(ash)[i]).person;return g&&n.querySelector('.nb-ask').textContent==='Ask for '+g.name+', the '+g.n+', at '+t.GIVERS[g.role].where+'.'}),'each says who posted it and where: '+jobs.map(n=>n.querySelector('.nb-ask').textContent).join(' | '));
  ok(jobs.every(n=>n.querySelector('.nb-kind')&&n.querySelector('.nb-pay')&&/Reward/.test(n.textContent)),'its kind, its reward');
  const nm=t.Givers.of(ash).map(g=>g.name);ok(new Set(nm).size===nm.length,'no two of Ashford\'s givers share a name ('+nm.join(', ')+')')}
 // ---- a questbook notice: its poster and where
 {const b=qa('.nb-note').find(n=>n.querySelector('[data-act="qb-take"]'));ok(!b||/^Ask (for .+|at the lord’s hall)/.test(b.querySelector('.nb-ask').textContent),'a questbook notice says who to see too'+(b?': '+b.querySelector('.nb-ask').textContent:' (none offered here)'))}
 // ---- locked: stamped
 {P.level=1;const qt=t.makeQuest('troops',ash);P.jobs={Ashford:{day:G.day,list:[qt]}};open();const n=q('.nb-note.locked');
  ok(n&&/Requires level 3/.test(n.querySelector('.nb-stamp').textContent)&&n.querySelector('[data-act="q-accept"]').disabled,'a locked one faded, stamped "'+(n&&n.querySelector('.nb-stamp').textContent)+'", its Accept off')}
 // ---- empty
 {P.jobs={Ashford:{day:G.day,list:[],none:true}};open();ok(q('.nb-empty')&&/Nothing troubles Ashford these days/.test(q('.nb-empty').textContent),'nothing on it: one paper says why')}
 // ---- it fits
 {P.jobs={};P.level=5;open();const b=q('.nb').getBoundingClientRect(),c=q('.nb').parentElement.getBoundingClientRect();ok(b.right<=c.right+1&&b.left>=c.left-1,'the board fits its window (no sideways scroll)')}
 t.toWorld();Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
