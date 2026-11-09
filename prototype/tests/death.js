'use strict';
// A fight lost to beasts (world/death.js Death, data/death.js DEATH; doc/DEATH_DESIGN.md phase 1; the owner, 2026-11-09: "When you
// lost to the beast, or monster, you should be dead. But there might be a chance that you may survived which would be wounded but the
// day should be passed and the monster should not be there anymore"): only your whole side down to beasts alone; the roll's odds and
// what moves them; living: a day gone, you wake badly hurt and weak, your army gone, your companions carried to holdings near (a
// quest each), your food eaten, your horse bolted, a passenger waiting at a holding near, the beast home and a man-eater; your
// companions left too long leave your service and are won back by a talk or their pay; off (the tests' harness), as before.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,D=t.Death,X=t.DEATH;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const rnd=Math.random,roll=v=>{window.Math.random=()=>v},panel=()=>document.getElementById('panel').innerHTML,on0=X.on;
 const wolves=(o={})=>{const m=t.asMonster({id:'wolf',n:3,lv:1,x:P.x+20,y:P.y,hx:P.x+400,hy:P.y,cool:0,t:0,a:0,...o});W.monsters=[m];return m};
 const enc=(m,o={})=>({kind:'monster',ref:m,lv:m.lv,list:m.troops.slice(),allies:[],foes:[],...o});
 const lose=e=>{t.startEncounter(e);t.concludeEncounter(false,{},0,true,[],null,{})};
 const setup=()=>{Kit.world();t.Captivity.held=null;t.Captivity.scattered=[];P.quests=[];P.comps={};P.troops={hum_foot:6};P.woundedGroups=[];P.gold=400;P.hp=t.vitals()[0];P.weak=0;P.gear.mount=null;D.pending=null};
 let fell=null;t.worldOn('hero:fell',d=>{fell=d});
 try{
  // ---- off (the tests' harness): a beast's loss as before
  {setup();X.on=false;const m=wolves();lose(enc(m));ok(/Left for dead/.test(panel())&&!m.eater,'off: left for dead, as before');t.act('cont');X.on=true}
  // ---- when it is a loss to beasts: your whole side down, beasts alone
  {const m=wolves(),e=enc(m),b=(us,them,o={})=>({units:[...us.map(hp=>({team:0,hp,type:'hum_foot'})),...them.map(([type,hp])=>({team:1,hp,type}))],...o});
   ok(D.beastLoss(e,null)&&D.beastLoss(e,b([0,0],[['wolf',5]])),'your whole side down to wolves (auto-resolved, or fought out): a loss to beasts');
   ok(!D.beastLoss(e,b([0,3],[['wolf',5]]))&&!D.beastLoss(e,b([0],[['wolf',5]],{fledMine:1})),'one of yours still standing, or fled off the field: they carry you off (not a loss to beasts)');
   ok(!D.beastLoss(e,b([0],[['wolf',5],['militia',4]]))&&!D.beastLoss(enc(m,{list:['wolf','militia']}),null)&&!D.beastLoss(enc(m,{foes:[{troops:['militia']}]}),null),'men in it against you (a band come into it): their capture rules');
   ok(!D.beastLoss(enc(m,{allies:[{troops:['hum_foot']}]}),null)&&!D.beastLoss({kind:'tourney',list:['wolf']},null),'an ally still standing, or a tourney: not this rule')}
  // ---- the odds: within their bounds, moved by what they name
  {setup();const m=wolves(),o=D.odds(enc(m)),drake=D.odds({kind:'monster',ref:{id:'dragon',lv:6},lv:6,list:['dragon'],allies:[],foes:[]});
   ok(o.ch>=X.min&&o.ch<=X.max&&o.why.some(([w])=>/daylight|the night/.test(w)),'your chance to live: '+Math.round(o.ch*100)+'% ('+o.why.map(([w,v])=>w+' '+(v>0?'+':'')+Math.round(v*100)).join(', ')+')');
   ok(drake.ch<o.ch&&drake.ch>=X.min,'against a beast of legend, less ('+Math.round(drake.ch*100)+'%), never below '+Math.round(X.min*100)+'%');
   const body=P.gear.body;P.gear.body=Object.keys(t.ITEMS).find(k=>t.itemArmor(k)==='plate');const o2=D.odds(enc(m));P.gear.body=body;ok(o2.ch>o.ch,'plate armour: more ('+Math.round(o2.ch*100)+'%)')}
  // ---- living: what befalls you
  {setup();t.compJoin('brann');t.compJoin('elske');const T2=t.TOWNS.filter(x=>!x.gone&&!t.hostileTo(x.owner)).sort((a,b)=>Math.hypot(b.x-P.x,b.y-P.y)-Math.hypot(a.x-P.x,a.y-P.y))[0];
   const q=t.Escort.start({who:'traveller',to:{town:T2.name},prize:{gold:10}}),food=t.FOODS[0];t.invAdd('good',food,30);const horse=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='mount');P.gear.mount=horse;
   const m=wolves(),day=G.day,h0=t.Clock.hours(),x=P.x,y=P.y,f0=t.foodN(),dmg0=P.heroStats().dmg;fell=null;
   roll(.1);try{lose(enc(m))}finally{window.Math.random=rnd}
   ok(/tear through/.test(panel())&&Math.abs(t.Clock.hours()-h0-X.wake)<.01&&G.day>=day+1,'you fall among your dead, and wake a day later (+'+Math.round(t.Clock.hours()-h0)+' h)');
   ok(P.hp===Math.max(1,Math.round(t.vitals()[0]*X.hp))&&P.x===x&&P.y===y&&D.weak()&&P.heroStats().dmg<dmg0,'badly hurt ('+P.hp+' / '+t.vitals()[0]+'), where you fell, and weak for days (damage '+Math.round(dmg0)+' → '+Math.round(P.heroStats().dmg)+')');
   ok(!t.troopCount()&&!(P.woundedGroups||[]).length&&/Your army is gone/.test(panel()),'your army gone for good');
   const lost=['brann','elske'].map(id=>P.comps[id]);
   ok(lost.every(c=>c.lost&&t.townBy(c.lost.at)&&c.hurt>G.day)&&!t.compsInBand().length&&['brann','elske'].every(id=>D.questOf(id)?.to.town===P.comps[id].lost.at),'your companions carried, hurt, to holdings near ('+lost.map(c=>c.lost.at).join(', ')+'), a quest marking each');
   ok(new RegExp('ate '+Math.floor(f0*X.food)+' of your food').test(panel())&&t.foodN()<=f0-Math.floor(f0*X.food)&&!P.gear.mount,'the beasts ate your food ('+f0+' → '+t.foodN()+', a day eaten too), your horse bolted');
   ok(q.wait&&t.P.quests.includes(q)&&!q.near()&&t.Escort.eatDay()===0,'your passenger got away to '+q.wait+', and waits there (not riding, not eating)');
   q.arrive(t.townBy(q.wait));ok(!q.wait&&t.P.quests.includes(q),'found there: they ride with you again');
   ok(m.eater&&m.lv===3&&Math.hypot(m.x-m.hx,m.y-m.hy)<1&&Math.hypot(m.x-x,m.y-y)>100&&/man-eater/.test(panel()),'the wolves gone home to their lair, a man-eater now: '+t.Death.nameOf(m)+', level '+m.lv);
   ok(t.newsW().items.some(it=>it.k==='maneater'&&it.detail.name===m.eater.name)&&m.tip().includes(D.nameOf(m)),'talked of, and named on the map');
   ok(fell&&fell.lived&&fell.monster===m,'quests hear it (hero:fell)');t.act('cont');
   // ---- your companions: found where they wait; one left too long leaves your service, won back
   const br=P.comps.brann;br.hurt=0;t.act('death-find','brann');ok(!br.lost&&!D.questOf('brann')&&t.compsInBand().includes('brann'),'Brann found in the tavern of his holding: with you again, his quest done');
   const el=P.comps.elske,ap=el.ap,at=el.lost.at;el.lost.until=G.day;D.hour();
   ok(el.lost.left&&el.lost.at!==at&&el.ap===ap-X.comps.left&&D.questOf('elske').to.town===el.lost.at,'Elske, left past '+X.comps.wander+' days, gives up on you for '+el.lost.at+' and leaves your service (approval −'+X.comps.left+')');
   const card=D.cards(t.townBy(el.lost.at))[0];ok(card&&card.acts.map(a=>a[0]).join()==='death-talk,death-pay','in its tavern: talk her round, or pay her ('+card.acts.map(a=>a[2]).join(' · ')+')');
   roll(.99);try{t.act('death-talk','elske')}finally{window.Math.random=rnd}ok(el.lost&&el.lost.tried===G.day&&D.cards(t.townBy(el.lost.at))[0].acts[0][3],'a talk that fails: not again today');
   const g=P.gold,p=D.payOf('elske');t.act('death-pay','elske');el.hurt=0;ok(!el.lost&&P.gold===g-p&&!D.questOf('elske')&&t.compsInBand().includes('elske'),'paid what she is owed ('+p+'g): back in your band');
   ok(/Lost · after the beasts/.test((()=>{P.comps.brann.lost={at,until:G.day+5,left:false};const h=t.partyRosterPage();delete P.comps.brann.lost;return h})()),'the Army window lists the lost apart');
   const r0=P.renown;t.worldEmit('monster:slain',{monster:m});ok(P.renown===r0+X.eater.renown,'the man-eater slain: renown +'+X.eater.renown)}
  // ---- what a grave will give half of (phase 4): the experience your hero gained in this life, counted as it comes; not a grave's gift
  {const e0=P.xpEarned||0,x0=P.xp,lv0=P.level;t.gainXp(40,'battle');const e1=P.xpEarned;t.leaderOf(P).addXp(30,true);
   ok(e1-e0>=40&&P.xpEarned===e1,'the experience you gain counts toward your grave ('+(e1-e0)+' from a 40 XP deed and its practice); a grave\'s own gift does not')}
  // ---- dying (phase 2; DEATH.die on, as the game will once a new person is built): your remains, the man-eater's bounty, the
  // chronicle, the Slain page; your remains taken by a band, won back by beating it, or by whoever comes to them
  {setup();X.die=true;const R=t.Remains;R.list=[];const gid=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='weapon');t.invAdd('gear',gid,1);P.gear.weapon=P.gear.weapon||gid;
   const m=wolves(),h0=t.Clock.hours(),g0=P.gold,n0=Object.values(P.gear).filter(Boolean).length+P.inv.filter(Boolean).length,msgs=G.msgs.length;
   const mm=[X.min,X.max];X.min=X.max=0;try{lose(enc(m))}finally{[X.min,X.max]=mm}const r=R.list[0],S=D.slain;// (no chance to live: the roll lost)
   ok(S&&/do not rise again/.test(panel())&&t.Clock.hours()===h0,'a lost roll: you do not rise again (no day passes, no waking)');
   ok(r&&r.gold===Math.floor(g0*X.remains.gold)&&r.items.length===n0&&!P.gold&&!Object.values(P.gear).some(Boolean)&&!P.inv.some(Boolean)&&Math.hypot(r.x-P.x,r.y-P.y)<1,'your remains where you fell: all you wore and carried ('+r.items.length+' things) and '+r.gold+' of your '+g0+' gold');
   ok(m.eater&&m.eater.slew===S.who&&m.bounty>0&&t.newsW().items.some(it=>it.k==='maneater'&&it.detail.slew===S.who),'the wolves a man-eater for it ('+D.nameOf(m)+'), a bounty of '+m.bounty+' gold on them, talked of');
   ok(G.msgs.slice(msgs).some(x=>x.kind==='story'&&/fell to/.test(x.m)),'the chronicle keeps it: "'+(G.msgs.slice(msgs).find(x=>/fell to/.test(x.m))||{}).m+'"');
   t.act('cont');ok(G.mode==='dialog'&&/<h2>Slain<\/h2>/.test(panel())&&/Days on the road/.test(panel())&&/data-act="death-load"/.test(panel())&&/data-act="death-menu"/.test(panel()),'the Slain page: your life in numbers; its way out a save or the main menu');
   G.mode='world';G.modal=false;t.hidePanel();D.hour();ok(/<h2>Slain<\/h2>/.test(panel()),'no going on in the world while slain: the page comes back');
   ok(t.worldObjects().includes(r)&&/remains of/.test(r.tip()),'your remains on the map ("'+r.tip().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()+'")');
   const sv=JSON.parse(JSON.stringify(R.save()));R.load(sv);const r2=R.list[0];ok(r2 instanceof t.Remains&&r2.gold===r.gold&&r2.items.length===r.items.length,'saved and loaded with the world');
   // (a new person, as phase 3 will make: the remains are anyone's)
   D.slain=null;X.die=false;G.mode='world';t.hidePanel();
   const b=t.asParty({kind:'bandits',troops:Array(4).fill('militia'),x:r2.x+40,y:r2.y,cool:0});t.bandits.push(b);const gr=r2.gold,ni=r2.items.length;
   roll(0);try{R.hour()}finally{window.Math.random=rnd}ok(r2.empty()&&b.plunder&&b.plunder.gold===gr&&b.plunder.items.length===ni&&/picked clean/.test(r2.tip()),'a band near finds them, and carries it all off');
   const pg=P.gold;t.worldEmit('band:beaten',{band:b});ok(P.gold===pg+gr&&!b.plunder,'that band beaten: its plunder yours ('+gr+' gold and the gear)');
   const r3=R.lay(P.x+30,P.y,'a stranger');r3.gold=25;r3.items=[['gear',gid,1]];r3.meet();ok(/<h2>Remains<\/h2>/.test(panel())&&/data-act="death-take"/.test(panel()),'come to remains: take what is left, or leave it');
   const pg2=P.gold;t.act('death-take');ok(P.gold===pg2+25&&r3.empty()&&G.mode==='world','taken: into your purse and bag');
   const pg3=P.gold,b0=m.bounty;t.worldEmit('monster:slain',{monster:m});ok(P.gold===pg3+b0,'the man-eater that killed you slain: its bounty ('+b0+' gold)');
   R.list=[];t.act('cont')}
  // ---- no room on the roll's other side: a man-eater only once, and no mythic one
  {setup();const m=wolves({eater:{name:'the Old Maw',day:1}}),lv=m.lv;roll(.1);try{lose(enc(m))}finally{window.Math.random=rnd}ok(m.lv===lv&&m.eater.name==='the Old Maw','a man-eater already: named once');t.act('cont')}
 }finally{window.Math.random=rnd;X.on=on0;X.die=false;D.slain=null;t.Remains.list=[];P.comps={};P.weak=0}
});
