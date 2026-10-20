'use strict';
// The kinds, walked generically (doc/STORY_DESIGN.md §5; the story wave, S1): the registry (story/kinds.js: each kind once, its
// trigger's bucket in its order, ROAD_ENC its view, a subclass only where named) and, for EVERY registered Encounter kind
// (story/happening.js), with nothing written for it here: it spawns in a fitting context (one its conditions allow, found at the
// holdings by day and night; a kind no trigger starts, by the kind that starts it: a trace dropped, a stray scattered); its
// choices are Choices; each choice that declares its outcome shows it with no draw and no change, does with stubbed draws what
// describeOutcome says (the change measured), and has its facts written from it (its own lines after); its live record saves
// and loads as it was (by itself and through the save registry), wrapped by its kind's class; and it ends cleanly: never at
// once in your sight, gone out of it once its time is up (its trace, if it leaves one), announced once on the bus. A new kind is
// covered the day it is registered. Written on the test kit (tests/kit.js).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,DAY=t.DAY,K=t.Kinds,O=t.Outcome,E=t.Encounter;Kit.begin('soldier',73);Kit.clear();Kit.world();
 const U='hum_levy',fac=Object.keys(t.FACS).find(f=>f!=='player'),SHAPE='encounter';
 // ---- the registry
 {const all=K.all(SHAPE),ids=all.map(k=>k.id),road=K.on(SHAPE,'travelHour');
  ok(all.length>=28&&new Set(ids).size===ids.length&&all.every(k=>t.kindOf(SHAPE,k.id)===k&&k.shape===SHAPE),'every kind registered once, found by its id ('+all.length+' encounter kinds)');
  ok(road.length===24&&road.every(k=>k.trigger==='travelHour')&&Object.keys(t.ROAD_ENC).join()===road.map(k=>k.id).join()&&road.every(k=>t.ROAD_ENC[k.id]===k),'the pity timer\'s bucket: the road\'s 24, in their order; ROAD_ENC is its view');
  ok(all.filter(k=>!k.trigger).map(k=>k.id).sort().join()==='body,cart,stray,wreck','the traces and the stray come from no trigger (only started by another)');
  const cls=all.filter(k=>k.cls).map(k=>k.id+':'+k.cls.name);ok(cls.join()==='sheep:Shepherd,stray:Stray'&&all.filter(k=>k.cls).every(k=>k.cls.prototype instanceof E),'a subclass only where a kind has behaviour of its own: '+cls.join(', '));
  let thr='';try{t.defineKind(SHAPE,'traveller',{})}catch(x){thr=x.message}ok(/twice/.test(thr),'a kind defined twice is refused');
  ok(t.kindOf(SHAPE,'nope')===null&&t.kindOf('nope','traveller')===null&&t.kindOf(SHAPE,'constructor')===null,'an unknown kind, or shape: none');
  ok(E.load({rd:1,i:999,k:'nope',x:0,y:0})===null,'a record whose kind is gone loads as nothing (dropped quietly)');
  ok(Object.keys(t.Behaviours).sort().join()==='approach,bolt,chase,flee,graze,leave,scene,stay,walk'&&all.every(k=>!k.beh||t.Behaviours[k.beh]),'the behaviours, small strategies chosen by data: '+Object.keys(t.Behaviours).join(', ')+'; every kind\'s is one')}
 // ---- a fitting context for each kind: at the holdings, by day then by night, its conditions first, then any spot it will take
 const fresh=()=>{Kit.world();Kit.clear();G.road=null;G.chase=null;G.enc=null;G.encCool=0;W.road=null;P.gold=600;P.morale=50;P.renown=5;P.troops={[U]:6};P.wounded={};P.sp=t.vitals()[1];P.inv=Array(t.INV_SIZE).fill(null);t.invAdd('good','grain',20);t.invAdd('good','meat',10)};
 const tryAt=(z,k,need)=>{fresh();Kit.goHome(z);const D=t.kindOf(SHAPE,k);if(need&&!D.ok(t.storyCtx()))return null;
  const p=t.roadSpot(D.on,0,D.near);if(p){const e=t.roadSpawn(k,p[0],p[1]);if(e)return e}
  if(need)return null;for(let i=0;i<12;i++){fresh();Kit.goHome(z);const e=t.roadSpawn(k,P.x+10+i*24,P.y+(i%3)*20);if(e)return e}return null};
 const spots={};
 const findCtx=k=>{for(const need of [true,false])for(const hour of [.3,.9])for(const z of t.TOWNS){G.clock=DAY*hour;const e=tryAt(z,k,need);if(e){spots[k]={z,hour,need};return e}}return null};
 const again=k=>{const s=spots[k];G.clock=DAY*s.hour;return tryAt(s.z,k,s.need)||tryAt(s.z,k,false)};
 // (a kind no trigger starts: made by the one that starts it, found the first time by trying the road's kinds, those whose trace
 // it is first: one that leaves a record of it on the road as it comes (a stray scattered), or drops it as its trace)
 const parents={};
 const made=(k,h)=>{if(!h)return null;const own=t.roadList().find(o=>o.k===k);if(own)return own;if(h.D.trace!==k)return null;h.drop(t.roadNow());return t.roadList().find(o=>o.k===k)||null};
 const child=(k,first)=>{if(!first)return parents[k]?made(k,again(parents[k])):null;
  const ps=K.on(SHAPE,'travelHour').slice().sort((a,b)=>(b.trace===k)-(a.trace===k));
  for(const D of ps){const x=made(k,findCtx(D.id));if(x){parents[k]=D.id;return x}}return null};
 const spawnOf=(k,first)=>{const D=t.kindOf(SHAPE,k);if(!D.trigger)return child(k,first);return first?findCtx(k):again(k)};
 (0,eval)('TERRAIN.on=true');
 const kinds=K.all(SHAPE),bad={spawn:[],acts:[],pure:[],did:[],facts:[],save:[],end:[]};let nDid=0,nOut=0,skipped=[];
 for(const D of kinds){const k=D.id,e=spawnOf(k,true);
  if(!e){bad.spawn.push(k);continue}
  if(!(e instanceof (D.cls||E))||e.D!==D||e.k!==k||e.id!==e.i)bad.spawn.push(k+' (its class)');
  if(spots[k]&&!spots[k].need)info('  ('+k+': no spot its conditions allow at the holdings; spawned where it will go)');
  // ---- its choices
  const acts=D.acts||[];if(!acts.every(c=>c instanceof t.Choice))bad.acts.push(k);
  acts.forEach((c,i)=>{if(!c.out)return;nOut++;
   let x=spawnOf(k,false);if(!x)return;if(k==='thief')x.nab=1;
   // (shown with no draw and no change)
   const look=()=>JSON.stringify([P.gold,P.morale,P.rep,P.honor,P.inv,P.troops,G.clock,G.msgs.length,W.road&&W.road.on.length]);
   const b0=look();let d=0;const r0=Math.random;Math.random=()=>{d++;return r0()};let o=null;try{o=c.preview(x)}finally{Math.random=r0}
   if(d||look()!==b0||!O.is(o)){bad.pure.push(k+'#'+i);return}
   // (its facts: written from it, its own lines after)
   const fs=(c.factsFor(x)||[]).filter(Boolean),said=O.facts(o),own=c.also?(c.also(x)||[]).filter(Boolean):[];
   if(c.facts||fs.join(' · ')!==said.concat(own).join(' · ')||fs.some(f=>/\bhonor\b/.test(f)))bad.facts.push(k+' “'+c.label+'” ['+fs.join(' · ')+']');
   // (done, the dice stubbed: what changed is what it says)
   if(c.why(x)){skipped.push(k+' “'+c.label+'” ('+c.why(x)+')');return}
   const fx=Object.entries(o).filter(([key])=>key!=='say'),rep=n=>n?t.repAt(n):0,hon=f=>f?t.honorWith(f):0,gd=g=>t.goodN(g);
   const a={g:P.gold,f:t.foodN(),m:P.morale,r:P.renown,sp:P.sp,h:t.roadNow(),tr:{...P.troops},rep:{},hon:{},goods:{}};
   for(const [key,v] of fx){if(key==='rep'&&v[0])a.rep[v[0]]=rep(v[0]);if(key==='honor'&&v[0])a.hon[v[0]]=hon(v[0]);if(key==='goods')for(const g of Object.keys(v))a.goods[g]=gd(g);
    if(key==='wrong'&&v[0]){a.rep[v[0].name]=rep(v[0].name);if(v[0].owner&&v[0].owner!=='player')a.hon[v[0].owner]=hon(v[0].owner)}}
   let err='';try{Kit.seeded(5+i,()=>c.perform(x))}catch(z){err=z.message}
   const sg=O.signed,got=[];
   for(const [key,v] of fx){
    if(key==='gold')got.push(sg(P.gold-a.g)+' gold');else if(key==='food')got.push(sg(t.foodN()-a.f)+' food');else if(key==='morale')got.push('morale '+sg(P.morale-a.m));else if(key==='renown')got.push('renown '+sg(P.renown-a.r));
    else if(key==='sp')got.push(sg(P.sp-a.sp)+' stamina');else if(key==='rep'){if(v[0])got.push('reputation in '+v[0]+' '+sg(rep(v[0])-a.rep[v[0]]))}else if(key==='honor'){if(v[0]&&t.FACS[v[0]])got.push('honour with the '+t.FACS[v[0]].n+' '+sg(hon(v[0])-a.hon[v[0]]))}
    else if(key==='goods')for(const g of Object.keys(v))got.push(sg(gd(g)-a.goods[g])+' '+t.GOODS[g].n.toLowerCase());
    else if(key==='troops')for(const u of Object.keys(v))got.push(sg((P.troops[u]||0)-(a.tr[u]||0))+' '+t.ST[u].n);
    else if(key==='hours'){const hh=Math.round((t.roadNow()-a.h)*1e6)/1e6;got.push(...[].concat(O.handlers.hours.text(hh)))}
    else if(key==='wrong'){const [z,cc]=v;if(z){if(cc.rep)got.push('reputation in '+z.name+' '+sg(rep(z.name)-a.rep[z.name]));if(cc.morale)got.push('morale '+sg(P.morale-a.m));if(cc.honor&&z.owner&&z.owner!=='player')got.push('honour with the '+t.FACS[z.owner].n+' '+sg(hon(z.owner)-a.hon[z.owner]))}}
    else got.push(...[].concat(O.handlers[key].text(v)).filter(Boolean))}
   nDid++;if(err||got.join(' · ')!==t.describeOutcome(o))bad.did.push(k+' “'+c.label+'”: did ['+got.join(' · ')+'], says ['+t.describeOutcome(o)+']'+(err?' EXC '+err:''));
   if(G.enc)t.act('flee');Kit.world();G.road=null;G.chase=null;G.enc=null});
  // ---- its live record: saved and loaded as it was
  {const x=spawnOf(k,false);if(x){x.seen=1;const snap=JSON.stringify(x),rec=JSON.parse(JSON.stringify(x.save())),y=E.load(rec);
    if(!y||JSON.stringify(y)!==snap||!(y instanceof (D.cls||E))||y.D!==D)bad.save.push(k+' (its record)');
    else{t.saveGame(true);W.road=null;t.loadGame();const z=t.roadList().find(o=>o.i===x.i);if(!z||JSON.stringify(z)!==snap||!(z instanceof (D.cls||E)))bad.save.push(k+' (the save)')}}}
  // ---- it ends cleanly: not at once in your sight (a trace only fades); out of it, its time up, gone (its trace left), announced once
  {const x=spawnOf(k,false);if(!x){bad.end.push(k+' (none)');continue}
   const said=[],fn=ev=>said.push(ev.e);t.worldOn('encounter:ended',fn);
   try{const V=t.vis(),now=t.roadNow();
    if(!x.trace){const ang=Math.atan2(x.y-P.y,x.x-P.x);P.x=x.x-Math.cos(ang)*V*.6;P.y=x.y-Math.sin(ang)*V*.6;G.clock+=(x.end-now+.01)*DAY/24;while(G.clock>=DAY){G.clock-=DAY;G.day++}
     Kit.frames(1,.05,d=>t.updateRoad(d));const seen=x.inView(V);if(seen&&x.gone)bad.end.push(k+' (gone at once, in your sight)');Kit.world();G.road=null;G.chase=null}
    P.x=x.x-V*1.4;P.y=x.y;const later=Math.max(x.end,t.roadNow())+t.ENC_LIFE.dying+t.ENC_LIFE.linger+1;G.clock+=(later-t.roadNow())*DAY/24;while(G.clock>=DAY){G.clock-=DAY;G.day++}
    Kit.frames(5,.05,d=>t.updateRoad(d));Kit.world();
    const tr=D.trace&&!x.done?t.roadList().find(o=>o.trace&&o.k===D.trace&&o.x===x.x&&o.y===x.y):null;
    if(!x.gone)bad.end.push(k+' (still there: '+x.beh+')');else if(D.trace&&!x.done&&!tr)bad.end.push(k+' (no '+D.trace+')');
    if(said.filter(z=>z===x).length!==(x.trace?0:1))bad.end.push(k+' (announced '+said.filter(z=>z===x).length+'×)')}
   finally{t.worldOff('encounter:ended',fn)}}}
 (0,eval)('TERRAIN.on=false');G.clock=DAY*.3;
 const L=(a,n)=>a.length?': '+a.slice(0,n||8).join('; '):'';
 ok(!bad.spawn.length,'every kind spawns in a fitting context, of its kind\'s class ('+kinds.length+' kinds)'+L(bad.spawn));
 ok(!bad.acts.length,'every kind\'s choices are Choices'+L(bad.acts));
 ok(nOut>=33&&!bad.pure.length,'every declared outcome shows with no draw and no change ('+nOut+' choices)'+L(bad.pure));
 ok(!bad.facts.length,'and its facts are written from it, its own lines after, one spelling (honour)'+L(bad.facts));
 ok(nDid>=30&&!bad.did.length,'done with the dice stubbed, each did what describeOutcome says ('+nDid+' choices)'+L(bad.did));
 if(skipped.length)info('  not done here (greyed): '+skipped.join('; '));
 ok(!bad.save.length,'every kind\'s live record saves and loads as it was, wrapped by its class (by itself and through the save)'+L(bad.save));
 ok(!bad.end.length,'every kind ends cleanly: not at once in your sight, gone out of it once its time is up (its trace left), announced once'+L(bad.end));
 Kit.world();W.road=null;
});
