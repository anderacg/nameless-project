'use strict';
// The story's lifecycles (doc/STORY_DESIGN.md §3.10, §9: the story batch ST1): every way an encounter on the road ends goes through
// its one finish (story/encounter.js Encounter finish): the bus's encounter:ended, once, saying how (dealt with by a choice, left
// be, timed out, caught, got away); a fight begins with encounter:fought and ends with the battle (won, lost, or fled before the
// first blow or by withdrawing); every road kind's every choice is walked so. Reporting to a lord whose realm holds no holding pays
// him all the same; abandoning a bounty unmarks its band wherever it is (roving, sheltering in a camp or another site), as its
// success does. Written on the test kit (tests/kit.js).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,DAY=t.DAY;Kit.begin('soldier',41);Kit.clear();Kit.world();
 const U='hum_levy',ended=[],fought=[],e1=t.worldOn('encounter:ended',ev=>ended.push(ev)),e2=t.worldOn('encounter:fought',ev=>fought.push(ev));
 const of=e=>ended.filter(x=>x.e===e).map(x=>x.how);
 const fresh=()=>{Kit.world();Kit.clear();G.road=null;G.chase=null;G.enc=null;G.encAgain=null;G.encCool=0;W.road=null;P.quests=[];P.gold=600;P.morale=50;P.renown=5;P.troops={[U]:8};P.wounded={};P.sp=t.vitals()[1];P.inv=Array(t.INV_SIZE).fill(null);t.invAdd('good','grain',20);t.invAdd('good','meat',10);G.clock=DAY*.4};
 // (one of a kind on its own ground near a holding, else beside you there)
 const spawn=k=>{const D=t.ROAD_ENC[k];for(const z of t.TOWNS){fresh();Kit.goHome(z);const p=t.roadSpot(D.on,0,D.near),e=p&&t.roadSpawn(k,p[0],p[1]);if(e)return e}
  for(const z of t.TOWNS){fresh();Kit.goHome(z);for(let i=0;i<8;i++){const e=t.roadSpawn(k,P.x+12+i*20,P.y+(i%3)*16);if(e)return e}}return null};
 try{
  // ---- every road kind, every choice: what it ends as
  {const bad=[],seen={};let n=0,nFight=0;
   for(const D of t.Kinds.on('encounter','travelHour')){const k=D.id;
    D.acts.forEach((c,i)=>{const e=spawn(k);if(!e){(seen.none=seen.none||new Set()).add(k);return}if(k==='thief'&&c.when&&!c.when(e))e.nab=1;
     if(!c.shown(e)||c.why(e))return;n++;const e0=ended.length,f0=fought.length;t.roadMeet(e);
     Kit.seeded(7+i,()=>Kit.stubStream('road',.01,()=>t.act('enc-do',i+'!')));
     const mine=ended.slice(e0).filter(x=>x.e===e).map(x=>x.how),lab=k+' “'+c.label+'”';
     if(G.enc&&G.enc.road===e){nFight++;
      if(fought.length!==f0+1||fought[f0].e!==e||mine.length)bad.push(lab+' (fight begun: fought '+(fought.length-f0)+', ended '+mine.join()+')');
      Kit.seeded(11+i,()=>t.act('auto'));const after=of(e);if(after.length!==1||!['won','lost'].includes(after[0]))bad.push(lab+' (the battle settled: '+after.join()+')');
      (seen.fight=seen.fight||new Set()).add(after[0]);Kit.done({cont:true,world:true})}
     else if(G.chase===e){if(mine.length)bad.push(lab+' (a chase ended it)');(seen.chase=seen.chase||new Set()).add(k)}
     else if(!c.again||e.done){if(mine.length!==1||!['done','caught','escaped'].includes(mine[0]))bad.push(lab+' ('+mine.join()+')');else (seen.end=seen.end||new Set()).add(mine[0])}
     else if(mine.length)bad.push(lab+' (open still, yet ended: '+mine.join()+')');
     G.chase=null;fresh()})}
   if(seen.none)info('  (no spot for: '+[...seen.none].join(', ')+')');
   ok(n>=40&&!bad.length,'every road kind\'s every choice ('+n+', '+nFight+' fights): dealt with, it ends once ('+[...(seen.end||[])].join(', ')+'); a fight begins (encounter:fought) and ends with its battle ('+[...(seen.fight||[])].join(', ')+'); a chase is still open'+(bad.length?': '+bad.slice(0,8).join('; '):''))}
  // ---- left be and timed out (its time up out of your sight), met and left, ridden away from, its time up in your sight
  {const e=spawn('merchant');e.met=1;e.over();const a=of(e);
   const f=spawn('merchant');G.clock+=(f.end-t.roadNow()+.1)*DAY/24;f.over();const b=of(f);
   const g=spawn('mud');g.goOff();const c=of(g);g.over();
   ok(a.join()==='left'&&b.join()==='timeout'&&c.join()==='timeout'&&of(g).length===1,'met and left: left; unmet, its time up: timeout; the cart abandoned in your sight: timeout, once ('+[a,b,c].join(' | ')+')')}
  // ---- a fight: fled before the first blow; the battle's other ends mapped; run down, it is still to be faced
  {const e=spawn('caravan');t.roadMeet(e);t.act('enc-do','0!');const enc=G.enc;ok(!!enc&&enc.road===e&&e.gone&&fought.some(x=>x.e===e)&&!of(e).length,'Join the fight: the encounter is off the map, encounter:fought, not ended yet');
   enc.mine=true;t.act('flee');ok(!of(e).length,'left from the battle\'s page: not ended at once');t.updateRoad(.05);ok(of(e).join()==='fled','back on the map with no battle to face: fled, once');t.updateRoad(.05);ok(of(e).length===1,'and only once');
   const f=spawn('caravan');t.roadMeet(f);t.act('enc-do','0!');const fe=G.enc;Kit.world();
   t.worldEmit('battle:ended',{enc:fe,how:'rundown'});ok(!of(f).length&&t.Encounter.fight&&t.Encounter.fight.e===f,'run down after withdrawing (rundown): to be faced again, not ended');
   G.encAgain=fe;t.updateRoad(.05);ok(!of(f).length,'while it is to be faced again, the map does not end it');G.encAgain=null;
   t.worldEmit('battle:ended',{enc:{road:spawn('merchant')},how:'won'});ok(!of(f).length,'another battle\'s end is not its own');
   t.worldEmit('battle:ended',{enc:fe,how:'withdrawn'});ok(of(f).join()==='fled'&&!t.Encounter.fight,'withdrawn and got away: fled');
   const g=spawn('caravan');t.roadMeet(g);t.act('enc-do','0!');Kit.seeded(3,()=>t.concludeEncounter(false,{},0,true,[]));ok(of(g).join()==='lost','beaten: lost, once');Kit.done({cont:true,world:true})}
  // ---- the chase: run down (its page, then dealt with), or got away
  {const e=spawn('thief');t.roadMeet(e);t.act('enc-do','0!');ok(G.chase===e&&!of(e).length,'Chase: a chase on the map, not ended');
   G.clock+=(e.chase-t.roadNow()+.05)*DAY/24;Kit.world();P.x=e.x+t.vis()*.5;P.y=e.y;t.updateRoad(.05);ok(of(e).join()==='escaped'&&e.gone,'he gets away: escaped, once');
   const f=spawn('thief');f.nab=1;t.roadMeet(f);t.act('enc-do','1!');ok(of(f).join()==='done','run down, the purse returned: done')}
  // ---- the horse caught or bolting; a stray sent home, the flock home
  {const e=spawn('horse');t.roadMeet(e);Kit.stubStream('road',0,()=>t.act('enc-do','0!'));const f=spawn('horse');t.roadMeet(f);Kit.stubStream('road',.999,()=>t.act('enc-do','0!'));
   ok(of(e).join()==='caught'&&of(f).join()==='escaped','Catch it: caught, or it bolts: escaped ('+of(e)+', '+of(f)+')')}
  {const h=spawn('sheep');if(!h)info('  (no shepherd here)');else{t.roadMeet(h);t.act('enc-do','0!');const ss=h.strays();for(const s of ss)h.herd(s);
   ok(ss.length>=2&&ss.every(s=>of(s).join()==='caught')&&of(h).join()==='done','the strays sent home: caught, each; the flock home: the shepherd done ('+ss.length+' strays)')}}
 }finally{t.worldOff('encounter:ended',e1);t.worldOff('encounter:fought',e2);fresh()}
 // ---- reporting to a lord whose realm holds no holding
 {fresh();const l=W.lords.find(x=>!x.dead&&t.fiefsOf(x.fac).length),fac=l.fac,fs=t.fiefsOf(fac),other=Object.keys(t.FACS).find(f=>f!==fac&&f!=='player');
  const ash=t.townBy('Ashford'),q=t.makeQuest('bounty',ash,l);q.accept();q.done=true;const g0=P.gold;let err='';
  try{for(const z of fs)z.owner=other;ok(!t.fiefsOf(fac).length,'his realm ('+t.FACS[fac].n+') holds nothing now');
   const at=t.lordPayAt(l);G.enc={kind:'lord',ref:l};G.mode='dialog';try{t.questAct('q-lord-report')}catch(x){err=x.message}
   ok(!err&&!P.quests.length&&P.gold>=g0+q.reward.gold&&!!at&&!t.hostileTo(at.owner),'reported all the same: paid ('+(P.gold-g0)+' gold), his reputation at the nearest holding not hostile to you ('+(at&&at.name)+')'+(err?' EXC '+err:''));
   const q2=t.makeQuest('bounty',ash,l);q2.accept();q2.done=true;const g1=P.gold,r=JSON.stringify(P.rep);err='';try{t.payQuest(q2,null)}catch(x){err=x.message}
   ok(!err&&P.gold>=g1+q2.reward.gold&&JSON.stringify(P.rep)===r&&!P.quests.length,'with no holding to name at all: paid by the lord himself, no holding\'s reputation')}
  finally{for(const z of fs)z.owner=fac;Kit.world()}}
 // ---- a bounty given up: its band unmarked wherever it shelters; done, unmarked too
 {fresh();const ash=t.townBy('Ashford');Kit.goHome(ash);
  const take=()=>{const q=Kit.seeded(5,()=>t.makeQuest('bounty',ash));Kit.seeded(6,()=>q.accept());return q},q=take(),b=t.bandits.find(x=>x.qid===q.id);
  const camp=t.camps()[0]||W.sites.find(s=>s instanceof t.Lair),lair=W.sites.find(s=>s!==camp&&(s.type==='hideout'||s.type==='cave'));
  t.bandits.splice(t.bandits.indexOf(b),1);b.gone=true;(camp.bands=camp.bands||[]).push(b);
  ok(q.seek()&&q.seek().x===b.x&&t.Quest.quarry(q.id)[0]===b,'gone to ground in the '+camp.name+': still found (its quarry)');
  t.act('q-abandon',String(q.id));ok(!('qid' in b)&&!P.quests.length,'abandoned: the band sheltering in the camp is unmarked');
  const q2=take(),b2=t.bandits.find(x=>x.qid===q2.id);t.bandits.splice(t.bandits.indexOf(b2),1);if(lair){(lair.bands=lair.bands||[]).push(b2)}
  q2.fail('Gone.');ok(!('qid' in b2),'failed: its band unmarked inside another site too ('+(lair?lair.type:'none: off every list')+')');
  const q3=take(),b3=t.bandits.find(x=>x.qid===q3.id);t.worldEmit('band:beaten',{band:b3});ok(q3.done&&!('qid' in b3),'done by its deed: its band unmarked');
  if(lair)lair.bands=lair.bands.filter(x=>x!==b2);camp.bands=camp.bands.filter(x=>x!==b);P.quests=[]}
});
