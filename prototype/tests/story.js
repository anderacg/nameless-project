'use strict';
// The story wave's S0 parts (doc/STORY_DESIGN.md §3.2, §3.4, §3.5): the context (one a frame, made once, what the direct lookups
// say), outcomes (every handler applies and describes; the words are what it did; the keys are done in their order; showing one
// does nothing), choices (when, need, ask, odds, facts by hand or from the outcome, perform) and the one ChoicePage (its header,
// what you see, the choices, Back on the left and the way out on the right). Also lists, as INFO, where a road choice's
// hand-written words differ from what its outcome would say (kept as they are for now). Written on the test kit (tests/kit.js).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,DAY=t.DAY,S=t.Story,O=t.Outcome;Kit.begin('soldier',41);Kit.clear();Kit.world();
 const ash=Kit.goHome(),fac=Object.keys(t.FACS).find(f=>f!=='player'),U='hum_levy';
 // ---- the context: one a frame; fresh outside; what the direct lookups say
 {ok(t.storyCtx()!==t.storyCtx(),'outside a frame, each call is a fresh context');
  let same=false,inner=null;S.frame(()=>{const a=t.storyCtx();S.frame(()=>{inner=t.storyCtx()});same=a===t.storyCtx()&&a===inner});
  ok(same&&!S.inFrame&&S.live===null,'inside a frame (and a frame within it) one context, made once; dropped when the frame ends');
  const f0=S.frame;let n=0;S.frame=function(fn){n++;return f0.call(this,fn)};try{t.updateRoad(.05)}finally{S.frame=f0}ok(n===1,'the road\'s moment (updateRoad) runs in one frame');
  let bad=[],m=0;for(let ty=8;ty<t.MH-8;ty+=7)for(let tx=8;tx<t.MW-8;tx+=7){P.x=(tx+.5)*TILE+5;P.y=(ty+.5)*TILE-3;m++;const c=t.storyCtx(),x=P.x,y=P.y,lh=t.landHold(x,y);
   const want={terrain:t.terrAt(x,y),climate:t.climAt(x,y),land:lh,owned:lh&&lh.owner?lh:null,nearHold:t.nearHold(),nearest:t.Spatial.nearestHolding(x,y),byRoad:t.nearTile(Math.floor(x/TILE),Math.floor(y/TILE),t.T_ROAD,1),
    byMountains:t.nearMount(),landKind:t.nearTile(Math.floor(x/TILE),Math.floor(y/TILE),t.T_ROAD,1)?'road':lh?'held':'wild',weather:t.ambWeather()};
   for(const [k,v] of Object.entries(want))if(c[k]!==v)bad.push(k+'@'+tx+','+ty);
   const p=t.Story.at(tx,ty);if(p.terrain!==t.tAt(tx,ty)||p.climate!==t.climAt((tx+.5)*TILE,(ty+.5)*TILE)||p.land!==t.landHold((tx+.5)*TILE,(ty+.5)*TILE))bad.push('at '+tx+','+ty)}
  ok(!bad.length&&m>100,'where: the terrain, climate, whose land, the holdings near, a road or the wild, the weather: as the direct lookups, at '+m+' spots'+(bad.length?': '+bad.slice(0,6).join(' '):''));
  Kit.goHome();{const c=t.storyCtx();ok(c.cover===t.coverAt(P.x,P.y)&&c.nearestDist===Math.hypot(c.nearest.x-P.x,c.nearest.y-P.y),'and the cover for an ambush, the nearest holding\'s distance')}
  G.day=4;G.clock=DAY*.8;P.gold=77;S.frame(()=>{const c=t.storyCtx();const a=[c.day,c.hour,c.isDay,c.isNight,c.dark,c.troops,c.size,c.cap,c.gold,c.renown,c.morale,c.food,c.skill('scout'),c.honor(fac),c.rep('Ashford')].join();
   const b=[t.Clock.day,t.Clock.hour,t.Clock.isDay,t.Clock.isNight,t.darkness(),t.troopCount(),t.partySize(),t.partyCap(),P.gold,P.renown,P.morale,t.foodN(),t.skill('scout'),t.honorWith(fac),t.repAt('Ashford')].join();
   P.gold=12;ok(a===b&&c.gold===12,'when and who: the Clock and the accessors, read live (a change in the frame is seen: gold '+c.gold+')')});G.clock=DAY*.3}
 // ---- outcomes: every handler applies and describes
 {const H=O.handlers,keys=Object.keys(H),seen=new Set();let e=null;const fresh=()=>{Kit.world();Kit.clear();Kit.goHome();P.gold=200;P.morale=50;P.renown=5;P.troops={[U]:6};P.wounded={};P.sp=40;t.invAdd('good','grain',10)};
  const run=(o,ctx,check,label)=>{for(const k of Object.keys(o))seen.add(k);let r=null,err='';try{r=O.apply(o,ctx||{})}catch(x){err=x.message}const f=O.facts(o);ok(!err&&check(r,f),label+' → '+(f.join(' · ')||'(silent)')+(err?' EXC '+err:''))};
  fresh();let g0=P.gold;run({gold:7},null,(r,f)=>P.gold===g0+7&&f.join()==='+7 gold','gold');
  P.gold=20;run({gold:{n:-50,min:0}},null,(r,f)=>P.gold===0&&f.join()==='−50 gold','gold, never below its floor');
  fresh();let f0=t.foodN();run({food:-3},null,(r,f)=>t.foodN()===f0-3&&r.food===3&&f.join()==='−3 food','food');
  let i0=t.goodN('iron');run({goods:{iron:2}},null,(r,f)=>t.goodN('iron')===i0+2&&r.goods.iron===2&&f.join()==='+2 iron','goods');
  run({gear:'g_sword_0'},null,(r,f)=>r.gear==='g_sword_0'&&P.inv.some(s=>s&&s.k==='gear'&&s.id==='g_sword_0')&&f.join()==='a '+t.ITEMS.g_sword_0.n,'gear');
  run({troops:{[U]:2}},null,(r,f)=>P.troops[U]===8&&f.join()==='+2 '+t.ST[U].n,'troops');
  run({lose:U},null,(r,f)=>P.troops[U]===7&&r.lost===U&&f.join()==='−1 '+t.ST[U].n,'a soldier lost');
  run({wounded:{[U]:1}},null,(r,f)=>P.troops[U]===6&&P.wounded[U]===1&&f.join()==='1 '+t.ST[U].n+' wounded','wounded');
  let r0=t.repAt('Ashford');run({rep:['Ashford',3]},null,(r,f)=>t.repAt('Ashford')===r0+3&&f.join()==='reputation in Ashford +3','reputation');
  run({rep:[null,3]},null,(r,f)=>t.repAt('Ashford')===r0+3&&!f.length,'reputation nowhere: nothing, and says nothing');
  let h0=t.honorWith(fac);run({honor:[fac,-2]},null,(r,f)=>t.honorWith(fac)===h0-2&&f.join()==='honour with the '+t.FACS[fac].n+' −2','honour');
  let n0=P.renown;run({renown:2},null,(r,f)=>P.renown===n0+2&&f.join()==='renown +2','renown');
  P.morale=50;run({morale:-4},null,(r,f)=>P.morale===46&&f.join()==='morale −4','morale');
  P.morale=95;run({morale:{n:10,min:0,max:100}},null,(r,f)=>P.morale===100&&f.join()==='morale +10','morale, kept within its bounds');
  const xp=()=>t.leaderOf(P).xp+t.leaderOf(P).lv*1e6;let x0=xp();run({xp:10},null,(r,f)=>xp()>x0&&f.join()==='+10 XP','XP');
  const sk=()=>{const q=t.leaderOf(P).sk.scout;return q.lv*1e6+q.xp};let s0=sk();run({train:['scout',5]},null,(r,f)=>sk()>s0&&f.join()===t.SKILLS.scout.n,'training');
  P.sp=40;run({sp:-5},null,(r,f)=>P.sp===35&&f.join()==='−5 stamina','stamina');
  G.clock=DAY*.2;run({hours:2},null,(r,f)=>Math.abs(G.clock-DAY*(.2+2/24))<1e-9&&f.join()==='2 hours','time');
  P.sp=1;P.mp=1;run({vitals:'rest'},null,(r,f)=>P.sp===t.vitals()[1]&&P.mp===t.vitals()[2]&&f.join()==='stamina and mana, some health','rest');
  P.hp=1;run({vitals:'full'},null,(r,f)=>P.hp===t.vitals()[0]&&f.join()==='fully restored','fully restored');
  run({mood:'kind'},null,(r,f)=>!f.length,'a companion\'s mood (silent)');
  {const T0=t.TOWNS.find(z=>z.owner&&z.owner!=='player'&&t.FACS[z.owner]),c=t.CONDUCT.robWorker,rr=t.repAt(T0.name);run({wrong:[T0,c]},null,(r,f)=>t.repAt(T0.name)===rr-c.rep&&r.cost&&f.join(', ')===r.cost,'a wrong: what it cost, in its own words ('+T0.name+')');P.hostile={};delete T0.crime}
  run({log:'S0 test line'},null,(r,f)=>G.msgs[G.msgs.length-1].m==='S0 test line'&&!f.length,'a log line (silent)');
  {const N=t.newsW(),c0=N.items.length;run({news:['trace',{x:ash.x+40,y:ash.y},{t:'body'}]},null,(r,f)=>N.items.length===c0+1&&f.join()==='word gets round','a news record')}
  fresh();e={x:P.x,y:P.y,n:3};run({fight:true},{e},(r,f)=>e.done&&e.gone&&G.enc&&f.join()==='a fight','a fight');t.act('flee');Kit.world();
  e={x:P.x+30,y:P.y};run({chase:true},{e},(r,f)=>G.chase===e&&/run after/.test(r.say)&&f.join()==='a chase on the map','a chase (its own line)');G.chase=null;P.tx=null;Kit.world();
  e={};run({end:true,gone:true},{e},(r,f)=>e.done===1&&e.gone===1&&!f.length,'end and gone (silent)');
  fresh();run({start:{k:'merchant',x:P.x+40,y:P.y}},null,(r,f)=>r.started&&r.started.k==='merchant'&&t.roadList().includes(r.started)&&f.join()==='then: wandering merchant','another happening started');W.road=null;
  run({band:true},null,(r,f)=>(r.band===false||t.bandits.includes(r.band))&&f.join()==='word of a band','a band set on the map ('+(t.bandits.length?'there':'no room')+')');Kit.clear();
  {let got=null;run({call:(c,r)=>{got=c;return 9},say:r=>'said '+r.call},{e:7},(r,f)=>got&&got.e===7&&r.call===9&&r.say==='said 9'&&!f.length,'a hook\'s own step, and the line from what came of it')}
  ok(keys.every(k=>seen.has(k)),'every handler tried: '+keys.join(', ')+(keys.some(k=>!seen.has(k))?' (not: '+keys.filter(k=>!seen.has(k)).join(', ')+')':''));
  let thr='';try{O.apply({nope:1})}catch(x){thr=x.message}ok(/nope/.test(thr),'an effect with no handler is refused');
  fresh();g0=P.gold;let at=[];O.apply({gold:5,call:()=>at.push(P.gold)});O.apply({call:()=>at.push(P.gold),gold:5});ok(at.join()===(g0+5)+','+(g0+5),'the keys are done in the order they are written');
  ok(t.applyOutcome({renown:1}).say===undefined&&t.describeOutcome({gold:-3,morale:2})==='−3 gold · morale +2','applyOutcome and describeOutcome: the namespace\'s');
  // the words are what it did: deltas measured, written the same way, against describeOutcome
  {const snap=()=>({g:P.gold,f:t.foodN(),m:P.morale,r:P.renown,sp:P.sp,rep:{...P.rep},hon:{...P.honor},iron:t.goodN('iron'),furs:t.goodN('furs'),tr:{...P.troops}});
   const said=(a,b,o)=>Object.keys(o).flatMap(k=>{const sg=O.signed;
    if(k==='gold')return[sg(b.g-a.g)+' gold'];if(k==='food')return[sg(b.f-a.f)+' food'];if(k==='morale')return['morale '+sg(b.m-a.m)];if(k==='renown')return['renown '+sg(b.r-a.r)];if(k==='sp')return[sg(b.sp-a.sp)+' stamina'];
    if(k==='rep')return[...new Set([...Object.keys(a.rep),...Object.keys(b.rep)])].filter(n=>(b.rep[n]||0)!==(a.rep[n]||0)).map(n=>'reputation in '+n+' '+sg((b.rep[n]||0)-(a.rep[n]||0)));
    if(k==='honor')return Object.keys(b.hon).filter(f=>(b.hon[f]||0)!==(a.hon[f]||0)).map(f=>'honour with the '+t.FACS[f].n+' '+sg(b.hon[f]-(a.hon[f]||0)));
    if(k==='goods')return Object.keys(o.goods).map(g=>sg(b[g]-a[g])+' '+t.GOODS[g].n.toLowerCase());if(k==='troops')return Object.keys(o.troops).map(u=>sg((b.tr[u]||0)-(a.tr[u]||0))+' '+t.ST[u].n);return[]});
   const samples=[{gold:-15,goods:{furs:3}},{food:-3,renown:1,morale:3},{gold:20,honor:[fac,-5],morale:-3},{rep:['Ashford',4],gold:10},{sp:-8,rep:['Ashford',3],goods:{iron:2}},{troops:{[U]:2},gold:-15},{gold:40},{morale:-6}],bad=[];
   for(const o of samples){fresh();P.gold=100;const a=snap();O.apply(o,{});const w=said(a,snap(),o).join(' · ');if(w!==t.describeOutcome(o))bad.push(w+' ≠ '+t.describeOutcome(o))}
   ok(!bad.length,'what describeOutcome says is what applyOutcome did, for '+samples.length+' outcomes'+(bad.length?': '+bad.join('; '):''))}}
 // ---- the road's choices: showing an outcome does nothing; the hand-written words that differ from the outcome's (INFO)
 {const ks=Object.keys(t.ROAD_ENC),miss=[];let pure=0,impure=[];
  for(const k of ks){let e=null;for(const z of t.TOWNS){if(e)break;Kit.world();Kit.clear();Kit.goHome(z);W.road=null;for(let i=0;i<12&&!e;i++)e=t.roadSpawn(k,P.x+10+i*24,P.y+(i%3)*20)}if(!e){info('  (no '+k+' to try)');continue}if(k==='thief')e.nab=1;
   e.D.acts.forEach((c,i)=>{if(!c.out)return;const before=JSON.stringify([P.gold,P.morale,P.rep,P.honor,P.inv,P.troops,G.clock,G.msgs.length]);let d=0;const r0=Math.random;Math.random=()=>{d++;return r0()};
    let o=null;try{o=c.preview(e)}finally{Math.random=r0}const after=JSON.stringify([P.gold,P.morale,P.rep,P.honor,P.inv,P.troops,G.clock,G.msgs.length]);if(d||before!==after||!t.Outcome.is(o))impure.push(k+'#'+i);else pure++;
    if(c.facts){const hand=(c.facts(e)||[]).filter(Boolean).join(' · '),said=t.Outcome.describe(o);if(hand!==said)miss.push(k+' “'+c.label+'”: by hand ['+hand.replace(/<[^>]+>/g,'')+'], its outcome ['+said+']')}})}
  ok(pure>=20&&!impure.length,'every road choice that declares its outcome shows it with no draw and no change ('+pure+' of them)'+(impure.length?': not '+impure.join(' '):''));
  info('facts written by hand that differ from their outcome\'s ('+miss.length+'), kept as they are for now:');for(const m of miss)info('  '+m)}
 // ---- choices
 {const C=t.Choice,c=new C({icon:'gold',label:'Try',when:s=>!!s.here,need:s=>s.poor&&'Too poor',ask:s=>s.risky?'Are you sure?':null,odds:'wisps',out:()=>({gold:5,say:'You got 5.'}),tip:'a tip'});
  ok(c.shown({here:1})&&!c.shown({})&&new C({label:'x'}).shown({}),'when: offered only then (none: always)');
  ok(c.why({poor:1})==='Too poor'&&c.why({})==='','need: why it is greyed, \'\' when free');
  ok(c.asks({risky:1})==='Are you sure?'&&c.asks({})===null&&new C({}).asks({})===null,'ask: the confirm\'s words, or none');
  ok(c.chance()===t.statOdds('wisps')&&Kit.stub(.01,()=>c.roll())===true&&Kit.stub(.99,()=>c.roll())===false&&c.helps()===t.statHelps('wisps')&&c.read({vague:'v',what:'w'})===t.statRead('wisps',{vague:'v',what:'w'}),'odds: its chance (statOdds), a roll, its Insight read and the stats that help');
  ok(c.factsFor({}).join()==='+5 gold'&&new C({facts:()=>['by hand'],out:()=>({gold:5})}).factsFor({}).join()==='by hand'&&new C({run:()=>'x'}).factsFor({})===undefined,'its facts: from its outcome, or by hand where kept, or none');
  const g0=P.gold;ok(c.perform({})==='You got 5.'&&P.gold===g0+5,'perform: its outcome done, its line given');
  ok(new C({run:(s,ch)=>ch instanceof C?'plain line':'?'}).perform({})==='plain line'&&new C({run:()=>({renown:1,say:'r'})}).perform({})==='r','a hook: a plain line, or an outcome for its plain part');
  const L=C.list([c,{label:'b'}]);ok(L[0]===c&&L[1] instanceof C,'Choice.list keeps a choice made already');
  ok(t.ROAD_ENC.traveller.acts.every(a=>a instanceof C)&&t.ROAD_ENC.merchant.acts.includes(t.ROAD_ASK)&&t.LETTER_VERBS.every(a=>a instanceof C)&&t.SHRINE_CHOICES.length===2,'the road\'s kinds, the sealed letter\'s verbs and the shrine\'s are Choices')}
 // ---- the ChoicePage: its frame
 {Kit.world();const C=t.Choice,cs=C.list([{icon:'gold',label:'First',facts:()=>['a fact'],tip:'tip one'},{icon:'eye',label:'Hidden',when:()=>false},{icon:'sword',label:'Greyed',need:()=>'Not now',ask:()=>'Really?',out:()=>({gold:-3})}]),s={};
  G.mode='road';t.CHOICE_PAGE.show({ico:'scroll',title:'A test page',sub:'Somewhere · day 1',msg:'Last thing',text:'What you see here.',facts:['one','two'],choices:cs,subject:s,act:'zz-do',back:['zz-back',null,'Back'],close:['zz-out',null,'Leave']},'zz:1');
  const q=Kit.q,qa=Kit.qa,nav=q('.rwin .nav'),bs=nav?[...nav.querySelectorAll('button')]:[];
  ok(q('#panel.paged')&&q('.rwin .top h2').textContent==='A test page'&&q('.rwin .top .muted').textContent==='Somewhere · day 1'&&q('.rw-gold'),'its header: its icon, title, where, your gold');
  ok(q('.pg-msg').textContent==='Last thing'&&q('.rwbody>p:not(.pg-msg):not(.pg-facts)').textContent==='What you see here.'&&q('.pg-facts').textContent==='one · two','its content: the last result, what you see, what you know');
  const ka=qa('.rkact');ok(ka.map(b=>b.querySelector('b').textContent).join('|')==='First|Greyed'&&ka[0].dataset.act==='zz-do'&&ka[0].dataset.arg==='0'&&ka[1].dataset.arg==='2'&&ka[1].disabled&&/Not now/.test(ka[1].textContent)&&/a fact/.test(ka[0].textContent)&&/−3 gold/.test(ka[1].textContent),'its choices as key actions: only those offered, each its place, greyed with why, its facts (by hand, or its outcome\'s)');
  ok(bs.length===2&&bs[0].dataset.nav==='back'&&bs[0].dataset.act==='zz-back'&&bs[1].dataset.nav==='close'&&bs[1].dataset.act==='zz-out'&&bs[1].textContent==='Leave'&&nav.firstElementChild===bs[0]&&nav.lastElementChild===bs[1],'its bottom bar (the frame rule): Back on the left, the way out on the right');
  ok(t.CHOICE_PAGE.choose(cs,'0',s)===cs[0]&&!t.CHOICE_PAGE.choose(cs,'1',s)&&!t.CHOICE_PAGE.choose(cs,'2',s)&&t.CHOICE_PAGE.choose(cs,'0!',s)===cs[0],'a press picks only a choice offered and free');
  t.CHOICE_PAGE.confirm(cs[2],s,{sub:'A test page',act:'zz-do',i:2,back:['zz-back',null,'Back']});const cb=qa('.nav button');
  ok(q('#panel.confirm')&&q('h2').textContent==='Greyed?'&&/Really\?/.test(Kit.text())&&/−3 gold/.test(Kit.text())&&cb[0].dataset.act==='zz-back'&&cb[1].dataset.act==='zz-do'&&cb[1].dataset.arg==='2!','its confirm: the question, its facts, Back on the left, the choice on the right');
  t.CHOICE_PAGE.show({ico:'scroll',title:'Done',text:'x',choices:cs,subject:s,act:'zz-do',done:true,close:['zz-out',null,'Leave']},'zz:2');ok(!qa('.rkact').length&&!q('.nav [data-nav="back"]')&&q('.nav [data-nav="close"]'),'done: no choices left, only the way out');
  t.CHOICE_PAGE.show({ico:'scroll',title:'Own body',body:'<blockquote class="zz">own</blockquote>',choices:[],subject:s,act:'zz-do',close:['zz-out',null,'Leave']},'zz:3');ok(q('.rwbody .zz')&&!q('.pg-facts'),'or a body of its own (the sealed letter\'s)');Kit.world()}
});
