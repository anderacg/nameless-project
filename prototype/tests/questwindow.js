'use strict';
// Your Quests (ui/questwindow.js), the journal: the Character window's Quests tab, its tabs (Main, Side, Jobs, the Archive) over
// two panes, the list (the tracked one first, each row its state: Active, "Return to X for your reward", Locked greyed with what
// it requires) and the one chosen in full: its category and state; a job's giver, the day taken, its timing (a courier's best-by
// day), where it is turned in, its steps and its reward; a story (one quest: its stage's quest its objective, never a row of its
// own) its who, objective, progress, where and its stages; an offer you know of, what it requires; an archive entry, how it
// ended and what it cost. Show on map (the full map centred on its goal, its Back returning here), Track (one at a time: first
// in its tab; none: no field), Abandon for a job only (it asks first, its real cost). Esc follows the bar. A phone on its side
// (844 x 390): the tabs and the list, then the chosen one alone, Back to the list, all on the screen.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,q=Kit.q,qa=Kit.qa,text=Kit.text,scr=q('#screen');
 window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',23);Kit.clear();Kit.world();P.renown=100;P.level=3;
 const ash=t.townBy('Ashford');
 // ---- a story under way: a wounded traveller met near a holding, tended and taken home (story/wounded.js), as tests/wounded.js
 const fresh=z=>{Kit.world();Kit.clear();G.road=null;G.enc=null;G.encCool=0;W.road=null;P.quests=[];P.troops={hum_levy:6};G.clock=t.DAY*.4;t.Thread.store().on=[];Kit.goHome(z)};
 const pick=label=>String(t.ROAD_ENC.traveller.acts.findIndex(c=>c.label===label));
 let th=null;
 {const D=t.kindOf('encounter','traveller'),p0=t.WOUNDED.ander.p;t.WOUNDED.ander.p=0;
  try{for(const z of [ash,...t.TOWNS]){fresh(z);const p=t.roadSpot(D.on,0,D.near),e=p&&t.roadSpawn('traveller',p[0],p[1]);if(!e)continue;
    t.roadMeet(e);t.act('enc-do','0');t.act('enc-do',pick('Take him home'));t.act('enc-leave');th=W.story.threads.on.find(x=>x.k==='wounded');if(th)break}}
  finally{t.WOUNDED.ander.p=p0}}
 ok(!!th&&th.wait&&th.wait.shape==='quest','a story under way: '+(th&&th.kind.n)+', its stage a quest');
 const stepQ=P.quests.find(x=>x.id===th.wait.id);
 // ---- three jobs: a bounty at Ashford, a courier from it, a lord's bounty; and the offers you know of at Ashford's board
 Kit.world();Kit.goHome(ash);const d0=G.day;
 const qb=t.makeQuest('bounty',ash);t.acceptQuest(qb);
 let qc=null;for(let k=0;k<10&&!qc;k++)qc=t.makeQuest('courier',ash);t.acceptQuest(qc);
 const lord=W.lords.find(l=>l.fac===ash.owner&&!l.dead),ql=t.makeQuest('bounty',ash,lord);t.acceptQuest(ql);
 P.level=1;const offT=t.makeQuest('troops',ash),offB=t.makeQuest('bounty',ash);P.jobs={Ashford:{day:G.day,list:[offB,offT]}};
 const esc=()=>Kit.key('Escape','Escape'),facts=()=>Object.fromEntries(qa('.qw-detail .qfacts dt').map(dt=>[dt.textContent,dt.nextElementSibling.textContent]));
 const rowOf=k=>q('.qw-row[data-arg="'+k+'"]'),tabBtn=k=>q('.qw-tabs [data-arg="'+k+'"]');
 // ---- the tabs; a story listed once, in Side, with its objective
 t.openChar();t.act('char-tab','quests');
 ok(G.mode==='char'&&qa('.qw-tabs [data-act="qw-tab"]').map(b=>b.textContent).join('|')==='Main|Side · 1|Jobs · 3|Archive'&&tabBtn('side').classList.contains('on'),'the tabs: '+qa('.qw-tabs .btn').map(b=>b.textContent).join(', ')+'; it opens on Side, the first with anything under way');
 const rows=qa('.qw-row');
 ok(q('.qw .qw-list')&&q('.qw .qw-detail')&&rows.length===1&&rows[0].dataset.arg==='t'+th.i&&rows[0].textContent.includes(th.kind.n)&&rows[0].textContent.includes(th.note)&&/Active/.test(rows[0].textContent)&&!rowOf('q'+stepQ.id),
   'the story, once (its escort is no row of its own): '+rows[0].textContent);
 {const f=facts(),sq=t.QuestTrack.quest('t'+th.i),g=sq&&sq.goal();
  ok(q('.qw-detail h3').textContent===th.kind.n&&/Side quest/.test(q('.qw-meta').textContent)&&/Active/.test(q('.qw-meta').textContent)&&f.Who===th.kind.who(th)&&f.Begun==='Day '+th.day&&f.Objective===th.note&&f.Progress===sq.progress()&&g&&f.Where.includes(t.questWay(g)),
   'its detail: a side quest, active · '+f.Who+' · '+f.Objective+' · '+f.Progress+' · '+f.Where);
  ok(/Bring .+ home/.test(f.Stages)&&q('.qw-detail .qw-steps li.now')&&q('.qw-detail [data-act="qw-map"]:not([disabled])')&&q('.qw-detail [data-act="qw-track"]')&&!q('.qw-detail [data-act="qw-abandon"]'),'its stages ('+f.Stages+'), Show on map, Track, no Abandon')}
 const nav0=q('#panel > .nav');ok(!nav0.querySelector('[data-nav="back"]')&&nav0.querySelector('[data-nav="close"]').textContent==='Back to map','the frame rule: its bottom bar, the way out on the right (no Back on a wide window)');
 // ---- Main: none yet
 t.act('qw-tab','main');ok(tabBtn('main').classList.contains('on')&&!qa('.qw-row').length&&/No main story yet/.test(q('.qw-list').textContent)&&!q('.qw-detail'),'Main: '+q('.qw-list p').textContent);
 // ---- Jobs: your jobs, each its state; the offers you know of, a locked one greyed with what it requires
 t.act('qw-tab','job');
 ok(['q'+qb.id,'q'+qc.id,'q'+ql.id].every(k=>rowOf(k)&&/Active/.test(rowOf(k).textContent))&&/Your jobs · 3/.test(q('.qw-list').textContent),'Jobs: your three, each Active');
 {const ro=rowOf('oAshford:1'),rb=rowOf('oAshford:0');ok(/Offered where you have been/.test(q('.qw-list').textContent)&&ro&&ro.classList.contains('locked')&&/Locked/.test(ro.textContent)&&/Requires level 3 \(yours: 1\)/.test(ro.textContent)&&rb&&/Available/.test(rb.textContent)&&!rb.classList.contains('locked'),
   'the offers you know of: '+rb.textContent+' | '+ro.textContent)}
 t.act('qw-sel','oAshford:1');
 {const f=facts();ok(q('.qw-detail h3').textContent===offT.title&&/Job/.test(q('.qw-meta').textContent)&&/Locked/.test(q('.qw-meta').textContent)&&/level 3 \(yours: 1\)/.test(f.Requires)&&/notice board of Ashford/.test(q('.qw-detail').textContent)&&q('.qw-detail [data-act="qw-map"]:not([disabled])')&&!q('.qw-detail [data-act="qw-track"]'),
   'a locked offer in full: what it requires ('+f.Requires+'), where to take it, Show on map')}
 P.level=3;t.act('qw-tab','job');ok(!rowOf('oAshford:1').classList.contains('locked')&&/Available/.test(rowOf('oAshford:1').textContent),'level 3: available');
 // a bounty: given by, taken, no timing, report at its holding, its steps (where the band was last seen, 0 / 1 broken), its reward
 t.act('qw-sel','q'+qb.id);
 {const f=facts();ok(q('.qw-detail h3').textContent===qb.title&&/Job/.test(q('.qw-meta').textContent)&&f['Given by'].startsWith('Ashford (')&&f.Taken==='Day '+d0&&f.Timing==='No time limit'&&f['Turn in']==='At Ashford'&&/gold/.test(f.Reward),
   'a bounty in full: given by '+f['Given by']+' · taken '+f.Taken+' · '+f.Timing+' · turn in '+f['Turn in']+' · '+f.Reward);
  ok(/^Bounty: the .+, last seen \d+ tiles [a-z]+; 0 \/ 1 broken/.test(f.Steps)&&/Then report back at Ashford/.test(f.Steps)&&q('.qw-detail [data-act="qw-abandon"]'),'its steps: '+f.Steps+'; a job: Abandon')}
 // a courier: its best-by day, later pays less; paid on arrival
 t.act('qw-sel','q'+qc.id);
 {const f=facts();ok(f.Timing==='Best by day '+qc.due+' ('+qc.days+' days left); later pays less'&&f['Turn in']==='Paid on arrival at '+qc.to&&/Carry the letter to /.test(f.Steps)&&!/report back/.test(f.Steps),'a courier: '+f.Timing+' · '+f['Turn in'])}
 // a lord's: given by the lord, where he is; reported to him or at any holding of his realm (as canReportAt)
 t.act('qw-sel','q'+ql.id);
 {const f=facts(),F=t.FACS[lord.fac].n,any=t.TOWNS.filter(h=>t.canReportAt(ql,h));ok(f['Given by'].startsWith(lord.name+' of the '+F)&&f['Turn in']==='To '+lord.name+', or at any holding of the '+F&&any.length>0&&any.every(h=>h.owner===lord.fac),
   'a lord’s: given by '+f['Given by']+' · turn in '+f['Turn in'])}
 // completed: "Return to X for your reward"
 qb.done=true;t.act('qw-tab','job');ok(/Completed/.test(rowOf('q'+qb.id).textContent)&&/Return to Ashford for your reward/.test(rowOf('q'+qb.id).textContent)&&rowOf('q'+qb.id).querySelector('small.good'),'its deed done: Completed, "Return to Ashford for your reward"');qb.done=false;
 // ---- Show on map: the full map, centred on the goal; Back (and Esc) return to your Quests
 t.act('qw-sel','q'+qb.id);t.act('qw-map','q'+qb.id);
 {const g=t.questGoal(qb),v=q('.fm-view'),F=t.FULLMAP,cx=(v.scrollLeft+v.clientWidth/2)/F.ppt,cy=(v.scrollTop+v.clientHeight/2)/F.ppt,edge=v.scrollLeft<=0||v.scrollTop<=0||v.scrollLeft>=v.scrollWidth-v.clientWidth-1||v.scrollTop>=v.scrollHeight-v.clientHeight-1;
  const back=q('#panel > .nav [data-nav="back"]');
  ok(G.mode==='fullmap'&&(Math.hypot(cx-g.x/t.TILE,cy-g.y/t.TILE)<3||edge)&&qa('.fm-pic .fm-q').length===t.questMapMarks().length&&back&&back.textContent==='Back to Quests',
   'Show on map: the full map centred on the goal ('+Math.round(cx)+','+Math.round(cy)+' vs '+Math.round(g.x/t.TILE)+','+Math.round(g.y/t.TILE)+'), each quest marked, Back to Quests on its bar')}
 esc();ok(G.mode==='char'&&G.char==='quests'&&G.qw.tab==='job'&&G.qw.sel==='q'+qb.id,'Esc follows its bar: back to your Quests, Jobs, the bounty still chosen');
 // ---- Track: one at a time, saved as P.track; first in its tab; the strongest marks; untracked: no field
 ok(!('track' in P),'nothing tracked: no field');
 t.act('qw-track','q'+qc.id);
 {const first=q('.qw-list .qw-row'),labs=qa('.qw-list .lab').map(l=>l.textContent);ok(P.track==='q'+qc.id&&first.dataset.arg==='q'+qc.id&&labs[0]==='Tracked'&&first.querySelector('.qw-tag')&&qa('.qw-tag').length===1,'Track: the courier tracked (P.track '+P.track+'), first in its tab under Tracked, its tag')}
 {const dots=[];t.drawQuestDots((x,y,c,s)=>dots.push([x,y,c,s]));const g=t.questGoal(qc),last=dots[dots.length-1],m=t.questMapMarks();
  ok(last[0]===g.x&&last[1]===g.y&&last[3]===t.QUEST_MARK.miniOn&&dots.filter(d=>d[3]>t.QUEST_MARK.mini).length===2&&m.filter(x=>x.on).length===1&&m.find(x=>x.on).x===g.x,'its marks the strongest: the minimap’s dot drawn last, bigger and ringed; the full map’s the one marked tracked')}
 {let err='';try{t.drawQuestMarks({x:qc.x-100,y:qc.y-100});t.drawQuestMarks({x:qc.x+5000,y:qc.y+5000})}catch(x){err=x.message}ok(!err,'on the map: brackets round it, or an arrow at the edge when it is off the screen'+(err?' EXC '+err:''))}
 t.act('qw-tab','side');t.act('qw-track','t'+th.i);
 {const sq=t.QuestTrack.quest('t'+th.i);ok(P.track==='t'+th.i&&t.QuestTrack.on(sq)&&!t.QuestTrack.on(qc)&&q('.qw-list .qw-row').dataset.arg==='t'+th.i&&q('.qw-list .lab').textContent==='Tracked','tracking the story instead (Track works in every tab): one at a time; its stage’s quest’s goal marked, the story first')}
 t.act('char-close');t.openChar();t.act('char-tab','quests');ok(G.qw.tab==='side','opened again: on the tracked one’s tab');
 t.act('qw-track','t'+th.i);ok(!('track' in P)&&q('.qw-list .lab').textContent!=='Tracked','tracked again: untracked, the field gone');
 t.act('qw-tab','job');t.act('qw-track','q'+qc.id);
 // ---- Abandon asks first, its real cost; Keep it; Give it up: off the list, into the Archive
 t.act('qw-sel','q'+qb.id);t.act('qw-abandon','q'+qb.id);
 ok(q('.qw-ask')&&/Give up .+\? It counts as abandoned: reputation in Ashford −\d+; no work from Ashford for 3 days/.test(q('.qw-ask').textContent)&&P.quests.includes(qb),'Abandon asks first: '+(q('.qw-ask')&&q('.qw-ask p').textContent));
 t.act('qw-keep','q'+qb.id);ok(!q('.qw-ask')&&P.quests.includes(qb),'Keep it: still yours');
 t.act('qw-abandon','q'+qb.id);q('.qw-ask [data-act="q-abandon"]').click();
 ok(!P.quests.includes(qb)&&G.mode==='char'&&q('.qw-row.on')&&G.qw.sel!=='q'+qb.id&&tabBtn('past').textContent==='Archive · 1','Give it up: gone, another chosen; the Archive holds it');
 t.act('qw-tab','past');
 {const r=rowOf('aq'+qb.id),f=facts();ok(r&&/Abandoned/.test(r.textContent)&&/reputation in Ashford −\d+/.test(r.textContent)&&q('.qw-detail h3').textContent===qb.title&&f['Given by']==='Ashford'&&f.Ended==='Day '+G.day&&/reputation in Ashford −\d+/.test(f.Cost)&&!q('.qw-detail .btn'),
   'the Archive: '+r.textContent+' · its detail: given by '+f['Given by']+', ended '+f.Ended+', cost '+f.Cost)}
 t.act('qw-tab','job');t.act('qw-abandon','q'+qc.id);esc();ok(G.mode==='world'&&P.quests.includes(qc)&&P.track==='q'+qc.id,'Esc follows the bar on a wide window: out to the map, nothing given up');
 // ---- a phone on its side: the tabs and the list, then the chosen one alone; Back to the list; all on the screen
 {const css0=scr.style.cssText;scr.style.cssText+=';width:844px;height:390px';
  try{t.openChar();t.act('char-tab','quests');q('#panel').style.animation='none';
   const vis=el=>!!el&&el.getBoundingClientRect().width>0,s=scr.getBoundingClientRect();
   const inside=el=>{const r=el.getBoundingClientRect();return r.left>=s.left-.5&&r.right<=s.right+.5&&r.top>=s.top-.5&&r.bottom<=s.bottom+.5};
   ok(vis(q('.qw-tabs'))&&qa('.qw-tabs .btn').every(inside)&&vis(q('.qw-list'))&&!vis(q('.qw-detail'))&&!q('#panel > .nav [data-nav="back"]'),'at 844 x 390: the tabs and the list alone, no Back');
   t.act('qw-sel','q'+qc.id);q('#panel').style.animation='none';
   const p=q('#panel'),nv=q('#panel > .nav'),back=nv.querySelector('[data-nav="back"]'),bs=qa('.qw-detail .qw-acts .btn');
   ok(!vis(q('.qw-list'))&&!vis(q('.qw-tabs'))&&vis(q('.qw-detail'))&&back&&back.textContent==='Back'&&nv.querySelector('[data-nav="close"]'),'chosen: the courier alone, its bar Back on the left, the way out on the right');
   ok(inside(p)&&inside(nv)&&bs.length===3&&bs.every(inside)&&p.scrollWidth<=p.clientWidth+1&&q('.qw-detail').scrollWidth<=q('.qw-detail').clientWidth+1,
     'everything on the screen: the window ('+Math.round(p.getBoundingClientRect().width)+' x '+Math.round(p.getBoundingClientRect().height)+'), its bar, its buttons; nothing scrolls sideways');
   ok(bs.every(b=>b.getBoundingClientRect().height>=39),'its buttons big enough to tap ('+bs.map(b=>Math.round(b.getBoundingClientRect().height)).join(', ')+' px)');
   esc();ok(G.mode==='char'&&vis(q('.qw-list'))&&vis(q('.qw-tabs'))&&!vis(q('.qw-detail'))&&!q('#panel > .nav [data-nav="back"]'),'Esc follows the bar: Back to the tabs and the list');
   t.act('qw-tab','side');t.act('qw-sel','t'+th.i);q('#panel').style.animation='none';
   ok(vis(q('.qw-detail'))&&inside(q('#panel'))&&q('.qw-detail').scrollWidth<=q('.qw-detail').clientWidth+1&&/Stages/.test(q('.qw-detail').textContent),'a story on the phone: its detail alone, its stages, nothing sideways');
   esc();esc();ok(G.mode==='world','Esc again: out to the map')}
  finally{scr.style.cssText=css0;Kit.world()}}
});
