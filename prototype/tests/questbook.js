'use strict';
// The questbook (story/questbook.js, data/questbook/, doc/QUESTBOOK_DESIGN.md phase 1): every entry's steps, givers, goals,
// conditions and checks known; every entry walked through each of its branches (a goal reached or failed, a choice taken, a
// check won and lost) to an end; the givers' offers (a tavern's card, a board's row, a lord's reply, the road's day); once and
// cool; the console's book.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,B=t.QUESTBOOK,Q=t.Questbook;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const ids=Object.keys(B),panel=()=>document.getElementById('panel').innerHTML,live=id=>t.Thread.list().on.find(th=>th.k==='book:'+id);
 const reset=()=>{Kit.world();t.Thread.store().on=[];delete t.Thread.store().once;P.quests=[];P.gold=5000;P.fac=null};
 // ---- every entry: its steps linked, everything it names known
 {const bad=[];for(const id of ids){const E=B[id],S=E.steps||{},has=s=>s==null||!!S[s];
   if(!t.kindOf('thread','book:'+id))bad.push(id+': no thread');if(!t.kindOf('giver',E.giver?.by))bad.push(id+': giver '+E.giver?.by);
   for(const [c] of Object.entries({...E.when,...E.giver?.at}))if(c!=='not'&&!t.kindOf('cond',c))bad.push(id+': condition '+c);
   for(const [sid,s] of Object.entries(S)){if(s.goal&&!t.kindOf('goal',s.goal))bad.push(id+'.'+sid+': goal '+s.goal);if(!has(s.next)||!has(s.failed))bad.push(id+'.'+sid+': next');
    for(const o of s.choose||[]){if(!has(o.next)||!has(o.win)||!has(o.lose))bad.push(id+'.'+sid+': '+o.label);if(typeof o.check==='string'&&!t.QUEST_CHECKS[o.check])bad.push(id+'.'+sid+': check '+o.check)}}}
  ok(ids.length>=4&&!bad.length,'every entry ('+ids.length+') linked, its giver, goals, conditions and checks known'+(bad.length?': '+bad.join('; '):''))}
 // ---- every entry walked through each branch: a path is the choices made at its pages and goals (goal: 'ok' or 'fail'; a
 // choice: its place, a check's with w or l)
 const begin=id=>{reset();const town=t.TOWNS.find(x=>x.T.tabs.includes('tavern')&&x.kind==='town')||t.TOWNS[0],l=W.lords.find(x=>!x.dead&&x.fac===town.owner)||W.lords[0];Kit.goHome(town);
  return Q.take(id,Q.ctx({town:town.name,fac:l.fac,lord:l.name,lordRef:l}),null,true)};
 const step=(th,k)=>{const s=th.current;if(!s)return false;
   if(th.pageSpec){const [i,wl]=[parseInt(k),k.slice(-1)];Kit.world();th.showPage();if(G.mode!=='story')return false;Kit.stubStream('road',wl==='w'?0:wl==='l'?.9999:.5,()=>t.act('thr-do',String(i)));return true}
   const q=th.wait&&P.quests.find(x=>x.id===th.wait.id);if(!q)return false;const Qq=t.Quest.as(q);if(k==='ok')Qq.pay('arrived');else Qq.fail(null,'late');return true};
 const options=th=>{if(th.pageSpec)return th.choices().flatMap((c,i)=>c.shown(th)&&!c.why(th)?(c.odds?[i+'w',i+'l']:[String(i)]):[]);return th.wait?['ok','fail']:[]};
 for(const id of ids){const ends=[],stuck=[];let n=0;
  const walk=path=>{if(++n>60)return;const th=begin(id);if(!th){stuck.push('not begun');return}let cur=th;
   for(const k of path){if(!live(id))break;const snap=JSON.stringify(cur),y=t.Thread.load(JSON.parse(JSON.stringify(cur.save())));if(!y||JSON.stringify(y)!==snap)stuck.push(path.join('>')+' (its record)');
    if(!step(cur,k)){stuck.push(path.join('>'));return}cur=live(id)||cur}
   const on=live(id);if(!on){ends.push(path.join('>')+'='+th.how);return}const os=options(on);if(!os.length){stuck.push(path.join('>')+' at '+on.at);return}for(const k of os)walk(path.concat(k))};
  walk([]);ok(ends.length&&!stuck.length,id+': every branch reaches an end, saved and loaded at each step ('+ends.length+': '+ends.join(', ')+')'+(stuck.length?'; stuck: '+stuck.join(', '):''))}
 // ---- an end pays its reward; a failed end fails it
 {const th=begin('millers_debt'),g0=P.gold;step(th,'ok');step(live('millers_debt'),'0');const a=t.QuestArchive?.list?.()||P.archive||[];
  ok(!live('millers_debt')&&P.gold===g0-80&&th.how==='done','the miller: his debt paid, 80 gold, the quest done')}
 {const th=begin('shepherds_wolves');step(th,'0l');ok(!live('shepherds_wolves')&&th.how==='failed','the shepherd: the trail lost, the quest failed')}
 // ---- its goals set things on the map: a band, beasts
 {const th=begin('millers_debt');step(th,'ok');step(live('millers_debt'),'2');const q=P.quests.find(x=>x.id===live('millers_debt')?.wait?.id),b=q&&t.bandits.find(x=>x.qid===q.id);
  ok(q&&q.type==='bookband'&&b&&b.name==='Red Vipers','hunting the band: the Red Vipers set near '+q?.home);t.worldEmit('band:beaten',{band:b});ok(!live('millers_debt'),'broken: the quest ends')}
 {const th=begin('shepherds_wolves');step(th,'0w');const q=P.quests.find(x=>x.id===live('shepherds_wolves')?.wait?.id),m=q&&W.monsters.find(x=>x.qid===q.id);
  ok(q&&q.type==='bookbeast'&&m,'the trail found: '+(m&&t.MONSTERS[m.id].n.toLowerCase())+' set near '+q?.home);t.worldEmit('monster:slain',{monster:m});ok(!live('shepherds_wolves'),'slain: the quest ends')}
 // ---- a check's odds on its button, read by Insight
 {const th=begin('millers_debt');step(th,'ok');const on=live('millers_debt');Kit.world();on.showPage();ok(G.mode==='story'&&/Talk them out of it/.test(panel())&&/Persuasion/.test(panel()),'a check on its button: the stats that help');t.Thread.store().on=[];Kit.world()}
 // ---- the givers: a tavern's card, a board's row, a lord's reply, the road
 reset();{const town=t.TOWNS.find(x=>x.T.tabs.includes('tavern')&&(x.kind==='village'||x.kind==='town'));Kit.goHome(town);t.enterTown(town);t.act('tab','tavern');
  ok(/The miller/.test(panel())&&document.querySelector('[data-act="qb-take"][data-arg="millers_debt"]'),'a tavern of '+town.name+': the miller’s card');t.act('qb-take','millers_debt');ok(!!live('millers_debt')&&!document.querySelector('[data-arg="millers_debt"]'),'taken: under way, offered no more');t.toWorld()}
 reset();{const town=t.TOWNS.find(x=>x.kind==='town'||x.kind==='city');t.enterTown(town);t.act('tab','jobs');ok(document.querySelector('[data-act="qb-take"][data-arg="poorhouse_grain"]'),'the notice board of '+town.name+': bread for the poorhouse');t.toWorld()}
 reset();{const l=W.lords.find(x=>!x.dead),r=Q.replies(l);ok(r.some(x=>x.arg==='lords_word@'+l.id),'a lord’s talk: ask about work');t.act('qb-take','lords_word@'+l.id);const th=live('lords_word');ok(th&&th.memory.lord===l.name&&!!th.memory.to,'taken from '+l.name+': carry his word to '+th?.memory?.to)}
 reset();{G.quietEvents=false;try{Kit.stubStream('quests',0,()=>Q.day())}finally{G.quietEvents=true}ok(!!live('shepherds_wolves')&&G.mode==='story','on the road: the shepherd waves you down, his page');Kit.world()}
 // ---- once a game; again after its cool days
 reset();{const th=begin('millers_debt');step(th,'ok');step(live('millers_debt'),'0');ok(!Q.ready('millers_debt'),'once a game: done, never again');
  const p=begin('poorhouse_grain');step(p,'ok');ok(!Q.ready('poorhouse_grain'),'done: not again for a while');G.day+=B.poorhouse_grain.cool;ok(Q.ready('poorhouse_grain'),B.poorhouse_grain.cool+' days on: offered again')}
 // ---- the console
 reset();{const D=t.DevConsole,out=D.execute('book');ok(/millers_debt/.test(out),'book: the entries');const m=D.execute('book millers_debt what');ok(live('millers_debt')?.at==='what'&&/Begun/.test(m),'book millers_debt what: begun at that step')}
 reset();
 ok(!ERR.length,'no runtime errors');
});
