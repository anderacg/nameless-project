'use strict';
// Your Quests (ui/questwindow.js): the Character window's Quests tab in two panes, the list (the tracked one first, your quests,
// the Stories) and the one chosen in full: who gave it, the day taken, its timing (a courier's best-by day), where it is turned
// in, its steps and its reward; a story's who, what to do now and where. Show on map (the full map centred on its goal, its Back
// returning here), Track (one at a time: the strongest marks, first in the list; none: no field), Abandon (it asks first). Esc
// follows the bar. A phone on its side (844 x 390): the list, then the chosen one alone, Back to the list, all on the screen.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,q=Kit.q,qa=Kit.qa,text=Kit.text,scr=q('#screen');
 window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',23);Kit.clear();Kit.world();
 const ash=t.townBy('Ashford');
 // ---- a story under way: a wounded traveller met near a holding, tended and taken home (story/wounded.js), as tests/wounded.js
 const fresh=z=>{Kit.world();Kit.clear();G.road=null;G.enc=null;G.encCool=0;W.road=null;P.quests=[];P.troops={hum_levy:6};G.clock=t.DAY*.4;t.Thread.store().on=[];Kit.goHome(z)};
 const pick=label=>String(t.ROAD_ENC.traveller.acts.findIndex(c=>c.label===label));
 let th=null;
 {const D=t.kindOf('encounter','traveller'),p0=t.WOUNDED.ander.p;t.WOUNDED.ander.p=0;
  try{for(const z of [ash,...t.TOWNS]){fresh(z);const p=t.roadSpot(D.on,0,D.near),e=p&&t.roadSpawn('traveller',p[0],p[1]);if(!e)continue;
    t.roadMeet(e);t.act('enc-do','0');t.act('enc-do',pick('Take him home'));t.act('enc-leave');th=W.story.threads.on.find(x=>x.k==='wounded');if(th)break}}
  finally{t.WOUNDED.ander.p=p0}}
 ok(!!th&&th.wait&&th.wait.shape==='quest','a story under way: '+(th&&th.kind.n)+', its step a quest');
 // ---- three jobs: a bounty at Ashford, a courier from it, a lord's bounty
 Kit.world();Kit.goHome(ash);const d0=G.day;
 const qb=t.makeQuest('bounty',ash);t.acceptQuest(qb);
 let qc=null;for(let k=0;k<10&&!qc;k++)qc=t.makeQuest('courier',ash);t.acceptQuest(qc);
 const lord=W.lords.find(l=>l.fac===ash.owner&&!l.dead),ql=t.makeQuest('bounty',ash,lord);t.acceptQuest(ql);
 const n=P.quests.length,esc=()=>Kit.key('Escape','Escape'),detail=()=>q('.qw-detail')?q('.qw-detail').textContent:'';
 // ---- the list and the one chosen
 t.openChar();t.act('char-tab','quests');
 const rows=qa('.qw-row');
 ok(G.mode==='char'&&q('.qw .qw-list')&&q('.qw .qw-detail')&&rows.length===n+1,'two panes: the list ('+rows.length+' rows: '+n+' quests and a story) and the one chosen');
 ok(/Quests · \d+/.test(q('.qw-list').textContent)&&/Stories/.test(q('.qw-list').textContent)&&rows[rows.length-1].dataset.arg==='t'+th.i&&rows[rows.length-1].textContent.includes(th.kind.n)&&rows[rows.length-1].textContent.includes(th.note),
   'your quests, then the Stories: '+rows[rows.length-1].textContent);
 ok(q('.qw-row.on')&&q('.qw-row.on').dataset.arg===G.qw.sel&&q('.qw-detail h3'),'the first is chosen: '+q('.qw-detail h3').textContent);
 const nav0=q('#panel > .nav');ok(!nav0.querySelector('[data-nav="back"]')&&nav0.querySelector('[data-nav="close"]').textContent==='Back to map','the frame rule: its bottom bar, the way out on the right (no Back on a wide window)');
 // a bounty: given by, taken, no timing, report at its holding, its steps (where the band was last seen, 0 / 1 broken), its reward
 t.act('qw-sel','q'+qb.id);const facts=()=>Object.fromEntries(qa('.qw-detail .qfacts dt').map(dt=>[dt.textContent,dt.nextElementSibling.textContent]));
 {const f=facts();ok(q('.qw-detail h3').textContent===qb.title&&f['Given by'].startsWith('Ashford (')&&f.Taken==='Day '+d0&&f.Timing==='No time limit'&&f['Turn in']==='At Ashford'&&/gold/.test(f.Reward),
   'a bounty in full: given by '+f['Given by']+' · taken '+f.Taken+' · '+f.Timing+' · turn in '+f['Turn in']+' · '+f.Reward);
  ok(/^Bounty: the .+, last seen \d+ tiles [a-z]+; 0 \/ 1 broken/.test(f.Steps)&&/Then report back at Ashford/.test(f.Steps),'its steps: '+f.Steps)}
 // a courier: its best-by day, later pays less; paid on arrival
 t.act('qw-sel','q'+qc.id);
 {const f=facts();ok(f.Timing==='Best by day '+qc.due+' ('+qc.days+' days left); later pays less'&&f['Turn in']==='Paid on arrival at '+qc.to&&/Carry the letter to /.test(f.Steps)&&!/report back/.test(f.Steps),'a courier: '+f.Timing+' · '+f['Turn in'])}
 // a lord's: given by the lord, where he is; reported to him or at any holding of his realm (as canReportAt)
 t.act('qw-sel','q'+ql.id);
 {const f=facts(),F=t.FACS[lord.fac].n,any=t.TOWNS.filter(h=>t.canReportAt(ql,h));ok(f['Given by'].startsWith(lord.name+' of the '+F)&&f['Turn in']==='To '+lord.name+', or at any holding of the '+F&&any.length>0&&any.every(h=>h.owner===lord.fac),
   'a lord’s: given by '+f['Given by']+' · turn in '+f['Turn in'])}
 // the story: who, begun, what to do now, where its step points
 t.act('qw-sel','t'+th.i);
 {const f=facts(),sq=t.QuestTrack.quest('t'+th.i),g=sq&&sq.goal();ok(q('.qw-detail h3').textContent===th.kind.n&&f.Who===th.kind.who(th)&&f.Begun==='Day '+th.day&&f.Now===th.note&&g&&f.Where.includes(t.questWay(g))&&f['Its step']===sq.title&&q('.qw-detail [data-act="qw-map"]:not([disabled])')&&!q('.qw-detail [data-act="qw-abandon"]'),
   'a story: '+f.Who+' · '+f.Now+' · '+f.Where+' · Show on map, no Abandon')}
 // ---- Show on map: the full map, centred on the goal; Back (and Esc) return to your Quests
 t.act('qw-sel','q'+qb.id);t.act('qw-map','q'+qb.id);
 {const g=t.questGoal(qb),v=q('.fm-view'),F=t.FULLMAP,cx=(v.scrollLeft+v.clientWidth/2)/F.ppt,cy=(v.scrollTop+v.clientHeight/2)/F.ppt,edge=v.scrollLeft<=0||v.scrollTop<=0||v.scrollLeft>=v.scrollWidth-v.clientWidth-1||v.scrollTop>=v.scrollHeight-v.clientHeight-1;
  const back=q('#panel > .nav [data-nav="back"]');
  ok(G.mode==='fullmap'&&(Math.hypot(cx-g.x/t.TILE,cy-g.y/t.TILE)<3||edge)&&qa('.fm-pic .fm-q').length===t.questMapMarks().length&&back&&back.textContent==='Back to Quests',
   'Show on map: the full map centred on the goal ('+Math.round(cx)+','+Math.round(cy)+' vs '+Math.round(g.x/t.TILE)+','+Math.round(g.y/t.TILE)+'), each quest marked, Back to Quests on its bar')}
 esc();ok(G.mode==='char'&&G.char==='quests'&&G.qw.sel==='q'+qb.id,'Esc follows its bar: back to your Quests, the bounty still chosen');
 // ---- Track: one at a time, saved as P.track; first in the list; the strongest marks; untracked: no field
 ok(!('track' in P),'nothing tracked: no field');
 t.act('qw-track','q'+qc.id);
 {const first=q('.qw-list .qw-row'),labs=qa('.qw-list .lab').map(l=>l.textContent);ok(P.track==='q'+qc.id&&first.dataset.arg==='q'+qc.id&&labs[0]==='Tracked'&&first.querySelector('.qw-tag')&&qa('.qw-tag').length===1,'Track: the courier tracked (P.track '+P.track+'), first in the list under Tracked, its tag')}
 {const dots=[];t.drawQuestDots((x,y,c,s)=>dots.push([x,y,c,s]));const g=t.questGoal(qc),last=dots[dots.length-1],m=t.questMapMarks();
  ok(last[0]===g.x&&last[1]===g.y&&last[3]===t.QUEST_MARK.miniOn&&dots.filter(d=>d[3]>t.QUEST_MARK.mini).length===2&&m.filter(x=>x.on).length===1&&m.find(x=>x.on).x===g.x,'its marks the strongest: the minimap’s dot drawn last, bigger and ringed; the full map’s the one marked tracked')}
 {let err='';try{t.drawQuestMarks({x:qc.x-100,y:qc.y-100});t.drawQuestMarks({x:qc.x+5000,y:qc.y+5000})}catch(x){err=x.message}ok(!err,'on the map: brackets round it, or an arrow at the edge when it is off the screen'+(err?' EXC '+err:''))}
 t.act('qw-track','t'+th.i);
 {const sq=t.QuestTrack.quest('t'+th.i);ok(P.track==='t'+th.i&&t.QuestTrack.on(sq)&&!t.QuestTrack.on(qc)&&q('.qw-list .qw-row').dataset.arg==='t'+th.i,'tracking the story instead: one at a time; its step quest’s goal marked, the story first')}
 t.act('qw-track','t'+th.i);ok(!('track' in P)&&q('.qw-list .lab').textContent!=='Tracked','tracked again: untracked, the field gone');
 t.act('qw-track','q'+qc.id);
 // ---- Abandon asks first; Keep it; Give it up
 t.act('qw-sel','q'+qb.id);t.act('qw-abandon','q'+qb.id);
 ok(q('.qw-ask')&&/Give up .+\? It counts as failed: .+reputation at Ashford/.test(q('.qw-ask').textContent)&&P.quests.includes(qb),'Abandon asks first: '+(q('.qw-ask')&&q('.qw-ask p').textContent));
 t.act('qw-keep','q'+qb.id);ok(!q('.qw-ask')&&P.quests.includes(qb),'Keep it: still yours');
 t.act('qw-abandon','q'+qb.id);q('.qw-ask [data-act="q-abandon"]').click();
 ok(!P.quests.includes(qb)&&G.mode==='char'&&q('.qw-row.on')&&G.qw.sel!=='q'+qb.id,'Give it up: gone, another chosen');
 t.act('qw-abandon','q'+qc.id);esc();ok(G.mode==='world'&&P.quests.includes(qc)&&P.track==='q'+qc.id,'Esc follows the bar on a wide window: out to the map, nothing given up');
 // ---- a phone on its side: the list, then the chosen one alone; Back to the list; all on the screen
 {const css0=scr.style.cssText;scr.style.cssText+=';width:844px;height:390px';
  try{t.openChar();t.act('char-tab','quests');q('#panel').style.animation='none';
   const vis=el=>!!el&&el.getBoundingClientRect().width>0,s=scr.getBoundingClientRect();
   const inside=el=>{const r=el.getBoundingClientRect();return r.left>=s.left-.5&&r.right<=s.right+.5&&r.top>=s.top-.5&&r.bottom<=s.bottom+.5};
   ok(vis(q('.qw-list'))&&!vis(q('.qw-detail'))&&!q('#panel > .nav [data-nav="back"]'),'at 844 x 390: the list alone, no Back');
   t.act('qw-sel','q'+qc.id);q('#panel').style.animation='none';
   const p=q('#panel'),nv=q('#panel > .nav'),back=nv.querySelector('[data-nav="back"]'),bs=qa('.qw-detail .qw-acts .btn');
   ok(!vis(q('.qw-list'))&&vis(q('.qw-detail'))&&back&&back.textContent==='Back'&&nv.querySelector('[data-nav="close"]'),'chosen: the courier alone, its bar Back on the left, the way out on the right');
   ok(inside(p)&&inside(nv)&&bs.length===3&&bs.every(inside)&&p.scrollWidth<=p.clientWidth+1&&q('.qw-detail').scrollWidth<=q('.qw-detail').clientWidth+1,
     'everything on the screen: the window ('+Math.round(p.getBoundingClientRect().width)+' x '+Math.round(p.getBoundingClientRect().height)+'), its bar, its buttons; nothing scrolls sideways');
   ok(bs.every(b=>b.getBoundingClientRect().height>=39),'its buttons big enough to tap ('+bs.map(b=>Math.round(b.getBoundingClientRect().height)).join(', ')+' px)');
   esc();ok(G.mode==='char'&&vis(q('.qw-list'))&&!vis(q('.qw-detail'))&&!q('#panel > .nav [data-nav="back"]'),'Esc follows the bar: Back to the list');
   esc();ok(G.mode==='world','Esc again: out to the map')}
  finally{scr.style.cssText=css0;Kit.world()}}
});
