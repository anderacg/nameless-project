'use strict';
/* ---------- the notice board (the owner, 2026-11-04: "make a board like an actual board screen with papers pinned and the jobs
   or quests"; "how do you know who to see if they don't say who the poster is"): a cork board, each offer a paper pinned to it,
   tilted a little each its own way, its corner of colour its kind's. A paper: what it is (its kind's word), its title, the true
   thing it is about (world/troubles.js; its title less what its kind's word says already), its words, its reward, its timing and where it is turned in, and who posted it and where
   to find them (world/givers.js: "Ask for Jory, the merchant, at the market square"; a questbook's: its giver's name and where,
   data/questbook/), then Accept (Take it). Locked, it is faded, stamped with what it asks of you. Nothing on it: one paper says
   why. Its look: NOTICE (the kinds' words, the tilts, the papers' shades) and style.css "The notice board" ---------- */
const NOTICE={kinds:{bounty:'Bounty',clear:'Bounty',beast:'Beasts',hunt:'Wanted',supply:'Wanted',courier:'Rider wanted',troops:'Men wanted',book:'Notice'},
  tilt:[-1.6,1.1,-.5,1.7,-1.1,.6],paper:['#efe4c8','#e9dcbc','#f3ead6']};
const NoticeBoard={
  // (who to see: the giver, by name, trade and place; none: the holding's hall)
  ask(q){
    const g=q.person,G0=g&&GIVERS[g.role];
    return g?'Ask for '+g.name+', the '+g.n+', at '+(G0.where||'the hall')+'.':'Ask at the lord’s hall of '+q.home+'.';
  },
  look(i,k){return ' style="--tilt:'+NOTICE.tilt[i%NOTICE.tilt.length]+'deg;--paper:'+NOTICE.paper[(i+k.length)%NOTICE.paper.length]+'"'},
  // (a job's paper; i its place on the board)
  note(q,i){
    q=Quest.as(q);
    const lock=q.state==='locked',need=lock?q.needs().filter(n=>!n.met).map(n=>n.what).join('; '):'',why=q.causeLine?q.causeLine():'',tm=q.timing(),r=q.reportLine();
    return '<div class="nb-note'+(lock?' locked':'')+'"'+this.look(i,q.type)+'><div class="nb-kind">'+(NOTICE.kinds[q.type]||'Notice')+'</div><h4>'+htmlText(cap1(q.title.replace(/^(Bounty|Supply run|Beasts at the folds): /,'')))+'</h4>'+
      (why?'<p class="nb-cause">'+htmlText(why)+'</p>':'')+'<p>'+htmlText(q.text)+'</p>'+
      '<p class="nb-pay"><b>Reward:</b> '+q.rewardLine()+'</p><p class="nb-small">'+[tm,r&&(r.startsWith('At ')?'Turn in at '+r.slice(3):r)].filter(Boolean).map(htmlText).join(' · ')+'</p>'+
      (lock?'<p class="nb-stamp">Requires '+htmlText(need)+'</p>':'')+
      '<p class="nb-ask">'+htmlText(this.ask(q))+'</p>'+
      '<button class="btn sm" type="button" data-act="q-accept" data-arg="'+i+'"'+(lock?' disabled':'')+'>Accept</button></div>';
  },
  // (a questbook's paper: its giver's name and where, if it has them)
  book(id,t,i){
    const E=Questbook.entry(id),g=E.giver||{},m={memory:{town:t.name}};
    return '<div class="nb-note"'+this.look(i,id)+'><div class="nb-kind">'+NOTICE.kinds.book+'</div><h4>'+htmlText(E.title)+'</h4><p>'+htmlText(Stories.fill(E.text,m))+'</p>'+
      '<p class="nb-ask">'+htmlText(g.name?'Ask for '+g.name+(g.where?' at '+g.where:'')+'.':'Ask at the lord’s hall of '+t.name+'.')+'</p>'+
      '<button class="btn sm" type="button" data-act="qb-take" data-arg="'+id+'">Take it</button></div>';
  },
  // the board: its jobs (none: a paper saying why), then the questbook's
  html(t,offers){
    const book=Questbook.offers('board',Stories.ctx({town:t.name})),n=offers.length;
    const none=n?'':'<div class="nb-note nb-empty"'+this.look(0,'none')+'><h4>'+(P.jobs[t.name]&&P.jobs[t.name].none?'Nothing troubles '+htmlText(t.name)+' these days.':'No more work this week.')+'</h4><p>Come back in a few days.</p></div>';
    const h=offers.map((q,i)=>this.note(q,i)).join('')+none+book.map((id,i)=>this.book(id,t,n+i+1)).join('');
    return '<div class="nb">'+h+'</div>';
  },
};
