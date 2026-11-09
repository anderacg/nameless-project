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
  // ---- no room on the roll's other side: a man-eater only once, and no mythic one
  {setup();const m=wolves({eater:{name:'the Old Maw',day:1}}),lv=m.lv;roll(.1);try{lose(enc(m))}finally{window.Math.random=rnd}ok(m.lv===lv&&m.eater.name==='the Old Maw','a man-eater already: named once');t.act('cont')}
 }finally{window.Math.random=rnd;X.on=on0;P.comps={};P.weak=0}
});
