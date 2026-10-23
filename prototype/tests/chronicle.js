'use strict';
// The Chronicle (ui/chronicle.js): the Journal's section (ui/journal.js) that replaced the Message log. Every message (G.msgs, kept
// for good: core/state.js CHRONICLE), newest first under day headers; its filters (All, War & battles, Rumours, Your band, Story &
// quests: log's kind); a quest's message opening its entry in your Quests window (Back to Chronicle), a rumour's Show on map to
// its "?"; L opens it, Esc and the bar close it; the old window gone; nothing trimmed; saved and loaded (a save without it loads
// with an empty one); the save's budget trims only the oldest band and plain messages; a page at a time, so 20,000 open at once;
// 844 x 390 and 390 x 844. (The windows round it, the Menu, Quests and the Journal's sections: tests/journal.js.)
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,q=Kit.q,qa=Kit.qa,scr=q('#screen');
 window.requestAnimationFrame=()=>0;
 Kit.begin('soldier',23);Kit.clear();Kit.world();
 const ash=Kit.goHome('Ashford'),esc=()=>Kit.key('Escape','Escape'),rows=()=>qa('.ch-msg'),days=()=>qa('.ch-day').map(h=>h.textContent);
 // ---- messages over three days: war, plain, your band, a quest taken, a rumour heard
 G.msgs=[];const d0=G.day;
 t.log('A battle line.','bad','war');t.log('A plain line.');
 G.day=d0+1;t.log('Your band goes hungry.','bad','band');
 const job=t.makeQuest('bounty',ash);t.acceptQuest(job);
 const it=t.newsRecord('beast',{x:ash.x+40,y:ash.y+30},{id:'wolf',n:5});t.rumourHear(it,t.rumourSource('tavern',ash.name,ash));
 G.day=d0+2;t.log('The latest line.','good');
 const qm=G.msgs.find(r=>/^New quest/.test(r.m)),rm=G.msgs.find(r=>/^Rumour/.test(r.m));
 ok(qm&&qm.kind==='story'&&qm.ref==='q'+job.id&&rm&&rm.kind==='rumour'&&rm.ref==='n'+it.id,'log takes a kind and a ref: the quest’s ('+(qm&&qm.kind+' '+qm.ref)+'), the rumour’s ('+(rm&&rm.kind+' '+rm.ref)+')');
 ok(JSON.stringify(Object.keys(G.msgs[1]))==='["m","day"]'&&JSON.stringify(Object.keys(G.msgs[0]))==='["m","day","cls","kind"]','records are small: empty fields left out ('+JSON.stringify(G.msgs[1])+')');
 // ---- L opens the journal on the Chronicle: newest first, under day headers
 Kit.world();Kit.key('KeyL','l');
 ok(G.mode==='journal'&&G.jsec==='chronicle'&&q('.chron')&&q('.fb-head h2').textContent==='Journal'&&!q('.journal'),'L: the Journal, on its Chronicle (the old Message log window gone)');
 ok(days().join('|')==='Day '+(d0+2)+'|Day '+(d0+1)+'|Day '+d0&&rows()[0].textContent==='The latest line.'&&rows()[rows().length-1].textContent==='A battle line.'&&rows()[rows().length-2].textContent==='A plain line.',
  'newest first under day headers: '+days().join(', ')+'; first "'+rows()[0].textContent+'"');
 ok(rows().length===G.msgs.length&&rows()[0].classList.contains('good'),'every message a row, its tone kept ('+rows().length+')');
 {const nv=q('#panel > .nav');ok((nv.querySelector('[data-nav="back"]')||{}).dataset.act==='fb-menu'&&nv.querySelector('[data-nav="back"]').textContent==='Back'&&nv.querySelector('[data-nav="close"]').textContent==='Back to map','the frame rule: its bottom bar, Back to the Game Menu on the left, the way out on the right')}
 Kit.key('KeyL','l');ok(G.mode==='world','L again: closed');
 t.chronicleKey();esc();ok(G.mode==='esc'&&G.esc.html==null,'Esc follows the bar: its Back, the Game Menu');esc();ok(G.mode==='world','one more Esc resumes');
 ok(typeof window.openJournal==='function'&&!/Message log/.test(window.openJournal.toString())&&!/Message log/.test(t.KEYS.flat(3).join(' ')),'the old window is gone; Help names L the Chronicle');
 // ---- the filters: each its kind
 t.chronicleKey();
 const want={all:G.msgs.length,war:1,rumour:1,band:1,story:G.msgs.filter(r=>r.kind==='story').length};
 for(const [f,n] of Object.entries(want)){t.act('ch-filter',f);const on=q('[data-act="ch-filter"].on');
  ok(on&&on.dataset.arg===f&&rows().length===n&&(f==='all'||rows().every(r=>G.msgs.some(m=>m.kind===f&&r.textContent.startsWith(m.m.replace(/<[^>]+>/g,'').slice(0,20))))),
   'filter '+on.textContent+': '+rows().length+' rows'+(f==='all'?'':', every one '+f))}
 t.act('ch-filter','war');ok(!rows().some(r=>/plain line/.test(r.textContent)),'a message of no kind is under All only');
 // ---- a quest's message opens its entry in your Quests; Back (and Esc) return to the Chronicle
 t.act('ch-filter','all');
 {const b=rows().find(r=>/^New quest/.test(r.textContent)).querySelector('[data-act="ch-open"]');ok(b&&b.textContent==='Open in Jobs'&&!b.disabled,'a quest’s message: '+(b&&b.textContent));
  b.click();const back=q('#panel > .nav [data-nav="back"]');
  ok(G.mode==='quests'&&G.qw.sel==='q'+job.id&&q('.qw-detail h3').textContent===job.title&&back&&back.textContent==='Back to Chronicle','it opens the quest in your Quests window, Back to Chronicle on its bar');
  esc();ok(G.mode==='journal'&&G.jsec==='chronicle'&&q('.chron'),'Esc follows the bar: back to the Chronicle');
  t.act('ch-open','q'+job.id);t.act('quests-close');t.openQuests();{const bk=q('#panel > .nav [data-nav="back"]');ok(G.mode==='quests'&&(!bk||bk.textContent!=='Back to Chronicle'),'opened again on your own: no Back to Chronicle ('+(bk?bk.textContent:'no Back')+')')}Kit.world()}
 // ---- a rumour's Show on map: the full map at its "?"; Back returns; a faded mark, no map
 t.chronicleKey();
 {const b=rows().find(r=>/^Rumour/.test(r.textContent)).querySelector('[data-act="ch-map"]'),m=t.rumourMarks().find(x=>x.id===it.id);ok(b&&!b.disabled&&m,'a rumour’s message: Show on map');
  b.click();const v=q('.fm-view'),F=t.FULLMAP,cx=(v.scrollLeft+v.clientWidth/2)/F.ppt,cy=(v.scrollTop+v.clientHeight/2)/F.ppt,edge=v.scrollLeft<=0||v.scrollTop<=0||v.scrollLeft>=v.scrollWidth-v.clientWidth-1||v.scrollTop>=v.scrollHeight-v.clientHeight-1;
  const back=q('#panel > .nav [data-nav="back"]');
  ok(G.mode==='fullmap'&&(Math.hypot(cx-m.x/t.TILE,cy-m.y/t.TILE)<3||edge)&&back&&back.textContent==='Back to Chronicle','the full map centred on its mark ('+Math.round(cx)+','+Math.round(cy)+' vs '+Math.round(m.x/t.TILE)+','+Math.round(m.y/t.TILE)+'), Back to Chronicle');
  esc();ok(G.mode==='journal'&&G.jsec==='chronicle','Esc: back to the Chronicle');
  const day0=m.day;m.day=G.day-t.NEWS.markDays-1;t.renderJournal();const b2=rows().find(r=>/^Rumour/.test(r.textContent)).querySelector('[data-act="ch-map"]');
  ok(b2&&b2.disabled&&/faded/.test(b2.title),'its mark faded: Show on map greyed, saying why');m.day=day0;Kit.world()}
 // ---- every message kept: no cap
 {const first=G.msgs[0],n=G.msgs.length;for(let i=0;i<600;i++)t.log('Filler '+i);ok(G.msgs.length===n+600&&G.msgs[0]===first,'nothing trimmed in play: '+G.msgs.length+' kept, the first still first')}
 // ---- saved and loaded; a save without it
 {Kit.world();const before=G.msgs.map(r=>JSON.stringify(r));t.saveGame(true);G.msgs=[];t.loadGame();Kit.world();
  ok(G.msgs.length===before.length&&before.every((r,i)=>JSON.stringify(G.msgs[i])===r)&&/Welcome back/.test(q('#log').textContent),'saved and loaded: all '+before.length+' as they were (kind, ref, tone, day); "Welcome back" on the screen only');
  const d=JSON.parse(localStorage.getItem(t.SAVE));ok(Array.isArray(d.world.chronicle)&&JSON.stringify(d.world.chronicle[1])==='['+d0+',"A plain line."]','its save part: [day, m, cls, kind, ref], empty ends left off ('+JSON.stringify(d.world.chronicle.slice(0,2))+')');
  delete d.world.chronicle;localStorage.setItem(t.SAVE,JSON.stringify(d));t.loadGame();Kit.world();
  ok(G.msgs.length===0,'a save without it loads, its chronicle empty')}
 // ---- the budget: past it, the oldest band and plain messages go first; war, rumours and stories never
 {const B0=t.CHRONICLE.budget,ci=console.info,said=[];console.info=m=>said.push(m);
  try{G.msgs=[];for(let i=0;i<40;i++){t.log('Old war '+i,'bad','war');t.log('Old band '+i,'','band');t.log('Old plain '+i);t.log('Old tale '+i,'','story','q1');t.log('Old rumour '+i,'','rumour','n1')}
   const all=JSON.stringify(t.Saves.saveOf('chronicle').chronicle).length;t.CHRONICLE.budget=Math.round(all*.8);
   const v=t.Saves.saveOf('chronicle').chronicle,len=JSON.stringify(v).length,kept=k=>G.msgs.filter(r=>(r.kind||'')===k).length,spare=G.msgs.filter(r=>!r.kind||r.kind==='band');
   ok(len<=t.CHRONICLE.budget&&kept('war')===40&&kept('story')===40&&kept('rumour')===40&&spare.length<80&&spare.length===v.length-120&&/^Old (band|plain) /.test(spare[0].m)&&+spare[0].m.split(' ')[2]>0,
    'over its budget ('+all+' > '+t.CHRONICLE.budget+'): trimmed to '+len+'; war, stories and rumours all kept; '+(80-spare.length)+' of the oldest band and plain lines gone (first left: "'+(spare[0]&&spare[0].m)+'")');
   ok(said.length===1&&/trimmed/.test(said[0])&&!G.msgs.some(r=>/trimmed/.test(r.m)),'said in the developer console only: '+said[0]);
   t.CHRONICLE.budget=1;G.msgs=[];for(let i=0;i<5;i++)t.log('War '+i,'','war');t.Saves.saveOf('chronicle');ok(G.msgs.length===5,'never past war and the rest: all kept even over budget')}
  finally{t.CHRONICLE.budget=B0;console.info=ci}}
 // ---- 20,000: one page drawn, opened at once
 {const kinds=['war','rumour','band','story','',''];G.msgs=[];
  for(let i=0;i<20000;i++){const k=kinds[i%6];G.msgs.push(Object.assign({m:'Message number '+i+' of the long chronicle, about the road and the realms.',day:1+Math.floor(i/50)},i%3?{}:{cls:'gold'},k?{kind:k}:{}))}
  Kit.world();const t0=performance.now();t.chronicleKey();const ms=performance.now()-t0;
  ok(G.mode==='journal'&&rows().length===t.CHRONICLE.page&&rows()[0].textContent.startsWith('Message number 19999 ')&&/Page 1 of 200/.test(q('.ch-pager').textContent)&&ms<400,'20,000 messages: one page of '+rows().length+' drawn, opened in '+ms.toFixed(1)+' ms');
  info('opening the Chronicle with 20,000 messages: '+ms.toFixed(1)+' ms');
  const t1=performance.now();t.act('ch-filter','war');const ms2=performance.now()-t1;ok(rows().length===t.CHRONICLE.page&&/Page 1 of 34/.test(q('.ch-pager').textContent),'a filter over 20,000 in '+ms2.toFixed(1)+' ms ('+q('.ch-pager span').textContent+')');
  t.act('ch-filter','all');t.act('ch-page','1');ok(rows()[0].textContent.startsWith('Message number 19899 ')&&!q('[data-act="ch-page"][data-arg="0"]').disabled,'Older: page 2 ('+q('.ch-pager span').textContent+')');
  t.act('ch-page','199');ok(rows()[rows().length-1].textContent.startsWith('Message number 0 ')&&q('[data-act="ch-page"][data-arg="200"]').disabled,'Oldest: the last page ends with the first message');
  Kit.world();t.chronicleKey();ok(/Page 1 of/.test(q('.ch-pager span').textContent),'L opens it on the newest page again');
  // ---- 844 x 390 and 390 x 844: everything on the screen, nothing sideways, 44 px controls
  const css0=scr.style.cssText;
  try{for(const [w,h] of [[844,390],[390,844]]){scr.style.cssText=css0+';width:'+w+'px;height:'+h+'px';Kit.world();t.chronicleKey();q('#panel').style.animation='none';t.act('ch-page','3');
    const s=scr.getBoundingClientRect(),inside=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=s.left-.5&&r.right<=s.right+.5&&r.top>=s.top-.5&&r.bottom<=s.bottom+.5};
    const ctl=[...qa('[data-act="ch-filter"]'),...qa('.ch-pager .btn'),...qa('#panel > .nav .btn')],sc=q('.ch-scroll');
    ok(inside(q('#panel'))&&ctl.every(inside)&&sc.getBoundingClientRect().height>=80&&sc.scrollWidth<=sc.clientWidth+1&&q('#panel').scrollWidth<=q('#panel').clientWidth+1,
     'at '+w+' x '+h+': the window, its filters, pager and bar on the screen; the messages '+Math.round(sc.getBoundingClientRect().height)+' px tall; nothing sideways');
    ok(ctl.every(b=>b.getBoundingClientRect().height>=43.5),'its controls at least 44 px ('+Math.min(...ctl.map(b=>Math.round(b.getBoundingClientRect().height)))+' px the least)')}}
  finally{scr.style.cssText=css0;Kit.world()}}
});
