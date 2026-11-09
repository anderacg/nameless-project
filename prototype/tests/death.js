'use strict';
// A fight lost to beasts (world/death.js Death, data/death.js DEATH; doc/DEATH_DESIGN.md phase 1; the owner, 2026-11-09: "When you
// lost to the beast, or monster, you should be dead. But there might be a chance that you may survived which would be wounded but the
// day should be passed and the monster should not be there anymore"): only your whole side down to beasts alone; the roll's odds and
// what moves them; living: a day gone, you wake badly hurt and weak, your army gone, your companions carried to holdings near (a
// quest each), your food eaten, your horse bolted, a passenger waiting at a holding near, the beast home and a man-eater; your
// companions left too long leave your service and are won back by a talk or their pay; off (the tests' harness), as before.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,D=t.Death,X=t.DEATH;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const rnd=Math.random,roll=v=>{window.Math.random=()=>v},panel=()=>document.getElementById('panel').innerHTML,on0=X.on,die0=X.die;
 const wolves=(o={})=>{const m=t.asMonster({id:'wolf',n:3,lv:1,x:P.x+20,y:P.y,hx:P.x+400,hy:P.y,cool:0,t:0,a:0,...o});W.monsters=[m];return m};
 const enc=(m,o={})=>({kind:'monster',ref:m,lv:m.lv,list:m.troops.slice(),allies:[],foes:[],...o});
 const lose=e=>{t.startEncounter(e);t.concludeEncounter(false,{},0,true,[],null,{})};
 const setup=()=>{Kit.world();t.Captivity.held=null;t.Captivity.scattered=[];P.quests=[];P.comps={};P.troops={hum_foot:6};P.woundedGroups=[];P.gold=400;P.hp=t.vitals()[0];P.weak=0;P.gear.mount=null;D.pending=null};
 let fell=null;t.worldOn('hero:fell',d=>{fell=d});
 // (a day for the unburied: found and buried, your heir come for them: Grave.daily)
 const settle=()=>{for(const g of t.Remains.list)if(g.unburied&&g.heir)g.fetch=G.day;const was=D.unseenAt;D.unseenAt=()=>true;roll(0);try{t.Grave.daily()}finally{window.Math.random=rnd;D.unseenAt=was}};// (a day away: as if out of your sight)
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
   const wasU=D.unseenAt;D.unseenAt=()=>true;roll(0);try{R.hour()}finally{window.Math.random=rnd;D.unseenAt=wasU}ok(r2.empty()&&b.plunder&&b.plunder.gold===gr&&b.plunder.items.length===ni&&/picked clean/.test(r2.tip()),'a band near finds them, and carries it all off');
   const pg=P.gold;t.worldEmit('band:beaten',{band:b});ok(P.gold===pg+gr&&!b.plunder,'that band beaten: its plunder yours ('+gr+' gold and the gear)');
   const r3=R.lay(P.x+30,P.y,'a stranger');r3.gold=25;r3.items=[['gear',gid,1]];r3.meet();ok(/<h2>Remains<\/h2>/.test(panel())&&/data-act="death-take"/.test(panel()),'come to remains: take what is left, or leave it');
   const pg2=P.gold;t.act('death-take');ok(P.gold===pg2+25&&r3.empty()&&G.mode==='world','taken: into your purse and bag');
   const pg3=P.gold,b0=m.bounty;t.worldEmit('monster:slain',{monster:m});ok(P.gold===pg3+b0,'the man-eater that killed you slain: its bounty ('+b0+' gold)');
   R.list=[];t.act('cont')}
  // ---- a new person in the same world (phase 3, world/legacy.js): your heir and their company, your holdings, caravans and
  // companions handed out; you begin again with nothing of theirs, the map forgotten
  {const L=t.Legacy,tidy=()=>{W.lords=W.lords.filter(l=>!l.heir);for(const x of t.TOWNS)if(L.realms[x.owner])x.owner=t.FIDS[0];L.clear()},dieNow=m=>{const mm=[X.min,X.max];X.min=X.max=0;X.die=true;try{lose(enc(m||wolves()))}finally{[X.min,X.max]=mm}t.act('cont')};
   setup();tidy();t.Remains.list=[];P.band='The Grey Company';P.fac=null;['brann','elske','tavi'].forEach(id=>t.compJoin(id));P.comps.brann.ap=7;P.comps.brann.lv=3;P.comps.elske.ap=1;P.comps.tavi.ap=-2;P.comps.tavi.lv=2;
   const fief=t.TOWNS.filter(x=>!x.gone&&x.owner&&x.owner!=='player').sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[1];fief.owner='player';
   const m0=wolves();m0.qid=999;P.quests=[{id:999,type:'beast',title:'Beasts at the folds',mon:'wolf'}];const day=G.day,lords0=W.lords.length,fids0=t.FIDS.length;
   dieNow(m0);ok(/data-act="death-new"/.test(panel()),'slain: "Go on as someone new" on the Slain page');
   t.act('death-new');ok(/<h2>A new life<\/h2>/.test(panel())&&/data-act="death-past"/.test(panel())&&/data-act="death-kin"/.test(panel()),'a new life: who you are (kin, or a stranger), your name, your past');
   t.act('death-kin','');t.act('death-race','dwarf');const k=Object.keys(t.BGS)[0];t.act('death-past',k);
   ok(G.mode==='world'&&!D.slain&&P.race==='dwarf'&&P.bg===k&&P.level===0&&!P.renown&&!Object.keys(P.comps).length&&!P.quests.length&&P.born===G.day&&G.day===day,'you begin again: a dwarf '+t.BGS[k].n.toLowerCase()+', level 0, no renown, no companions, no quests, on the same day ('+G.day+')');
   ok(m0.qid==null&&W.monsters.includes(m0),'the quests\' marks on the world gone with them; the world as it was');
   const h=W.lords.find(l=>l.heir),f=h&&h.fac;
   ok(h&&h.heir.cid==='brann'&&f&&t.FACS[f].n==='The Grey Company'&&t.FIDS.length===fids0+1&&W.lords.length===lords0+1,'your heir, the most loyal (Brann): a lord now, crowned over a realm of your banner\'s name ("'+(f&&t.FACS[f].n)+'")');
   ok(fief.owner===f&&h.heir.comps.includes('elske')&&!h.heir.comps.includes('tavi'),'your holding ('+fief.name+') theirs; Elske, content with Brann, rides along; Tavi does not');
   const tv=t.compTown('tavi'),bt=t.compTown('brann'),et=t.compTown('elske');ok((!tv||t.compsHere(tv).includes('tavi'))&&(!bt||!t.compsHere(bt).includes('brann'))&&(!et||!t.compsHere(et).includes('elske')),'Tavi free in their tavern again; those with the heir not for hire');
   if(tv){P.gold=1e4;t.compJoin('tavi');ok(P.comps.tavi.lv===2,'Tavi hired again: as they were (level '+P.comps.tavi.lv+')')}
   const sv=JSON.parse(JSON.stringify(L.save()));L.clear();const gone=!t.FACS[f];L.load(sv);ok(gone,'(the realm gone with a world let go)');ok(t.FACS[f]&&t.FIDS.includes(f)&&L.serves('brann'),'saved and loaded: the heir\'s realm, its companions');
   h.dead=true;L.hour();ok(!L.serves('brann')&&h.heir.ended,'the heir dead: the company breaks up, its companions free');
   // (no heir: your holding to the realm nearest it, every companion free)
   setup();tidy();P.fac=null;t.compJoin('brann');P.comps.brann.ap=2;const f2=t.TOWNS.filter(x=>!x.gone&&x.owner&&x.owner!=='player').sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[2];f2.owner='player';const n2=W.lords.length;
   dieNow();t.act('death-new');t.act('death-past',k);ok(f2.owner&&f2.owner!=='player'&&t.FACS[f2.owner]&&W.lords.length===n2&&!L.serves('brann'),'no one loyal: no heir; '+f2.name+' to the '+t.FACS[f2.owner].n+', Brann free');
   // (a realm's vassal: the heir one of its lords)
   setup();tidy();P.fac=t.FIDS[0];t.compJoin('brann');P.comps.brann.ap=8;const n3=W.lords.length;dieNow();t.act('death-new');t.act('death-past',k);
   const h3=W.lords.find(l=>l.heir&&!l.dead);ok(W.lords.length===n3+1&&h3.fac===t.FIDS[0]&&!Object.keys(L.realms).length,'you a vassal of the '+t.FACS[t.FIDS[0]].n+': your heir one of its lords');
   // ---- graves (phase 4): buried as you go on, half the experience that hero gained, its light; rumours of it; pray, and it flows
   // into you as a gift (not counted toward your own grave); at an heir's holding, safe from robbers
   setup();tidy();t.Remains.list=[];P.xpEarned=400;P.renown=X.grave.tiers.cairn;const mg=wolves();dieNow(mg);const fx=P.x,fy=P.y;t.act('death-new');t.act('death-past',k);settle();
   const g=t.Remains.list.find(o=>o.grave);
   ok(g instanceof t.Grave&&g.xp===200&&g.kind==='stone'&&g.at&&g.holds()&&/grave of/i.test(g.tip()),'known, near people: someone buries you, a headstone at '+g.at+', holding half the experience that hero gained ('+g.xp+' of 400)');
   {const D0=t.DISCOVER.on;t.DISCOVER.on=true;try{const site=W.sites.find(o=>o.type==='rest'&&o.members().includes(g)),known0=site&&t.Discovery.named(site);if(site)t.Discovery.discover(site,true);
    ok(site instanceof t.RestSite&&t.Discovery.places().includes(site)&&!known0&&t.Discovery.named(site)&&site.mapDot(t.vis())&&t.fmIcon(site),'an actual place: "'+(site&&site.name)+'", a site of its own, found as a place is, on the minimap and the full map')}finally{t.DISCOVER.on=D0}}
   roll(0);try{t.Grave.hour()}finally{window.Math.random=rnd}ok(t.newsW().items.some(it=>it.k==='grave'&&it.detail.who===g.who),'folk talk of it (the news: "'+(t.newsW().items.find(it=>it.k==='grave')?'a cairn …':'')+'")');
   const ents=[],cam={x:P.x-200,y:P.y-120};g.x=P.x+30;g.y=P.y;g.draw(ents,cam,t.vis());let threw=null;try{for(const e of ents)e.f()}catch(err){threw=err}ok(ents.length&&!threw,'drawn with its light rising ('+(threw?threw.message:ents.length+' to draw')+')');
   g.meet();ok(/<h2>A grave<\/h2>/.test(panel())&&/data-act="death-pray"/.test(panel())&&/200 experience/.test(panel()),'come to it: its hero\'s life, and Pray');
   const all0=t.HERO_XP_ALL(P.level,P.xp),e0=P.xpEarned||0;t.act('death-pray');ok(g.spent&&g.flow&&G.mode==='world','Pray: its light flows from it into you, out on the map');
   const fe=[];g.draw(fe,cam,t.vis());let threw2=null;try{for(const e of fe)e.f()}catch(err){threw2=err}ok(fe.length>1&&!threw2,'the flow drawn over the map'+(threw2?': '+threw2.message:''));
   g.flowed();const dx=Math.round(t.HERO_XP_ALL(P.level,P.xp)-all0);ok(dx===200&&(P.xpEarned||0)===e0&&g.flow.done,'and as it arrives you gain it: +'+dx+' XP, level '+P.level+' (a gift: not toward your own grave)');
   ok(!g.pray()&&/prayed at/.test(g.tip()),'spent: it stays, quiet');
   const sv2=JSON.parse(JSON.stringify(t.Remains.save()));t.Remains.load(sv2);ok(t.Remains.list.find(o=>o.grave) instanceof t.Grave,'saved and loaded: still a grave');
   // (an heir: a grave at their holding, safe from robbers while it is theirs)
   setup();tidy();t.Remains.list=[];P.fac=null;t.compJoin('brann');P.comps.brann.ap=8;const fh=t.TOWNS.filter(x=>!x.gone&&x.owner&&x.owner!=='player').sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[1];fh.owner='player';
   P.xpEarned=100;dieNow();t.act('death-new');t.act('death-past',k);settle();const gh=t.Remains.list.find(o=>o.grave),hl=W.lords.find(l=>l.heir&&!l.dead);
   ok(gh&&gh.at===fh.name&&t.townBy(gh.at).owner===hl.fac&&!gh.robbable()&&gh.xp===50,'with an heir: a grave at their holding ('+(gh&&gh.at)+'), safe from robbers');
   const bb=t.asParty({kind:'bandits',troops:Array(4).fill('militia'),x:gh.x+10,y:gh.y,cool:0});t.bandits.push(bb);gh.gold=30;roll(0);try{t.Remains.hour()}finally{window.Math.random=rnd}ok(gh.gold===30&&!bb.plunder,'a band near does not rob it');
   // ---- many lives (the owner: "Bear in mind, player may died a lot"): graves never on one another, however often you fall in one
   // place; one rumour at a time; your line counted; a realm of an heir's that has fallen out of the realms that act, its name kept
   setup();tidy();t.Remains.list=[];const f0=L.fallen,x0=P.x,y0=P.y;
   for(let i=0;i<6;i++){P.x=x0;P.y=y0;P.xpEarned=50;dieNow();t.act('death-new');t.act('death-past',k);settle()}
   const gs=t.Remains.list.filter(o=>o.grave),close=gs.some((a,i)=>gs.some((b,j)=>j>i&&Math.hypot(a.x-b.x,a.y-b.y)<(a.plot&&b.plot?X.grave.plot.gap*X.grave.plot.row:X.grave.apart)-1));// (in the family plot, in its rows)
   ok(gs.length===6&&!close&&L.fallen===f0+6&&gs[5].n===f0+6,'six deaths in one place: six graves, none on another; your line counted ('+L.fallen+')');
   ok(/the \d+(st|nd|rd|th) of your line/.test((gs[5].meet(),panel())),'the grave says which of your line it was');t.act('death-leave');
   const nn=()=>t.newsW().items.filter(it=>it.k==='grave').length,n0=nn();roll(0);try{t.Grave.hour()}finally{window.Math.random=rnd}ok(nn()-n0<=1,'one rumour an hour at most, not one for each grave ('+(nn()-n0)+')');
   setup();tidy();P.fac=null;t.compJoin('brann');P.comps.brann.ap=8;const fp=t.TOWNS.filter(x=>!x.gone&&x.owner&&x.owner!=='player').sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[3];fp.owner='player';
   dieNow();t.act('death-new');t.act('death-past',k);const hp=W.lords.find(l=>l.heir&&!l.dead),fid=hp.fac,nm=t.FACS[fid].n;fp.owner=t.FIDS[0];hp.dead=true;L.hour();
   ok(!t.FIDS.includes(fid)&&t.FACS[fid]&&t.FACS[fid].n===nm&&L.realms[fid].gone,'an heir\'s realm with no holding and no lord left: out of the realms that act ('+nm+', its name kept)');
   const sv3=JSON.parse(JSON.stringify(L.save()));L.load(sv3);ok(!t.FIDS.includes(fid)&&t.FACS[fid]&&L.fallen>=1,'and so after a load');
   tidy();t.Remains.list=[]}
  // ---- how you are laid to rest (the owner: "if you died whatout much renown or if you died far away then you may have a grave or
  // remains"): little renown near people, a small grave; far from anyone, your remains as they fell, never talked of; renowned, a
  // grave at the holding nearest, safe from robbers
  {const L=t.Legacy,tidy=()=>{W.lords=W.lords.filter(l=>!l.heir);for(const x of t.TOWNS)if(L.realms[x.owner])x.owner=t.FIDS[0];L.clear()},k=Object.keys(t.BGS)[0],
    die=(ren,x,y,keep)=>{setup();tidy();t.Remains.list=[];P.comps={};if(x!=null){P.x=x;P.y=y}P.renown=ren;P.xpEarned=60;const mm=[X.min,X.max];X.min=X.max=0;X.die=true;try{lose(enc(wolves()))}finally{[X.min,X.max]=mm}t.act('cont');t.act('death-new');t.act('death-past',k);if(!keep)settle();return t.Remains.list.find(o=>o.grave)};
   const g1=die(0);ok(g1&&g1.kind==='small'&&g1.at&&/small grave/.test(g1.tip()),'little renown, near people: someone buries you anyway, a small grave by '+(g1&&g1.at)+' ("'+(g1&&g1.name)+'")');
   const ents=[],cam={x:g1.x-100,y:g1.y-60};g1.draw(ents,cam,t.vis());let e1=null;try{for(const e of ents)e.f()}catch(err){e1=err}ok(!e1,'drawn: its mound and cross of sticks'+(e1?': '+e1.message:''));
   let far=null;for(let ty=4;ty<t.MH-4&&!far;ty+=3)for(let tx=4;tx<t.MW-4&&!far;tx+=3){const x=tx*t.TILE+8,y=ty*t.TILE+8,h=t.Spatial.nearestHolding(x,y);if(t.passable(t.terrAt(x,y))&&h&&Math.hypot(h.x-x,h.y-y)/t.TILE>X.grave.tiers.far+3&&!t.RoadBand.on(x,y))far={x,y}}
   if(far){const g2=die(0,far.x,far.y,true);roll(.99);try{for(let i=0;i<5;i++)t.Grave.daily()}finally{window.Math.random=rnd}ok(g2&&g2.kind==='remains'&&g2.unburied&&Math.hypot(g2.x-far.x,g2.y-far.y)<2&&g2.xp===30,'far from anyone: days pass and no one finds you; your remains where you fell, still holding '+(g2&&g2.xp)+' experience');
    const ents2=[];g2.draw(ents2,{x:g2.x-100,y:g2.y-60},t.vis());let e2=null;try{for(const e of ents2)e.f()}catch(err){e2=err}ok(!e2,'drawn: bones, a skull, a torn cloak, the weapon fallen by them'+(e2?': '+e2.message:''));
    const nn=()=>t.newsW().items.filter(it=>it.k==='grave'&&it.detail.who===g2.who).length,n0=nn();roll(0);try{for(let i=0;i<5;i++)t.Grave.hour()}finally{window.Math.random=rnd}ok(nn()===n0,'and no one talks of them');
    P.x=g2.x+10;P.y=g2.y;roll(0);try{t.Grave.daily()}finally{window.Math.random=rnd}ok(g2.unburied,'and while you stand there and see them, nothing changes before your eyes');
    P.x=g2.x+t.vis()*3;P.y=g2.y;roll(0);try{t.Grave.daily()}finally{window.Math.random=rnd}ok(!g2.unburied&&g2.kind==='small','found at last by someone passing, while you were away: a small grave where they lay');
    const g5=die(0,far.x,far.y,true),site=W.sites.find(o=>o.type==='rest'&&o.members().includes(g5));G.mode='world';G.modal=false;site.meet();ok(/No one has buried them yet/.test(panel())&&/data-arg="here:0"/.test(panel())&&/data-arg="plot:0"/.test(panel()),'come to them yourself: bury them here, or carry them to the plot');
    t.act('site-rest','here:0');ok(!g5.unburied&&g5.kind==='small'&&!g5.at&&G.mode==='world','buried by you, where they lay');
    const g6=die(0,far.x,far.y,true),s6=W.sites.find(o=>o.type==='rest'&&o.members().includes(g6));G.mode='world';s6.meet();t.act('site-rest','plot:0');ok(!g6.unburied&&g6.plot&&g6.at,'or carried to the plot, by '+g6.at);
    const gc=die(X.grave.tiers.cairn,far.x,far.y);ok(gc.kind==='cairn','known, far from anyone, found: a cairn')}
   const gs1=die(X.grave.tiers.near.stone);ok(gs1.kind==='stone','more renown: a headstone');const g3=die(X.grave.tiers.near.grave+10);ok(g3&&g3.kind==='grave'&&g3.at&&!g3.robbable()&&/grave of/.test(g3.tip()),'renowned, near people: a grave at '+(g3&&g3.at)+', kept safe');
   const g4=die(X.grave.tiers.near.tomb);const e4=[];g4.draw(e4,{x:g4.x-100,y:g4.y-60},t.vis());let x4=null;try{for(const e of e4)e.f()}catch(err){x4=err}ok(g4.kind==='tomb'&&g4.at&&!x4&&/Tomb of/.test(g4.name),'renowned the most: a tomb at '+g4.at+', its stone tall, railed in iron, four candles'+(x4?': '+x4.message:''));
   g3.meet();ok(/<h2>A grave<\/h2>/.test(panel())&&new RegExp('A stone by '+g3.at).test(panel()),'its page: "A stone by '+g3.at+', kept clean"');t.act('death-leave');
   tidy();t.Remains.list=[]}
  // ---- your family's plot (the owner: "Yes, make a family plot"): those of your line buried by people lie together, in rows, at the
  // holding that buried the first; those who fell far from anyone stay where they fell
  {const L=t.Legacy,k=Object.keys(t.BGS)[0],die=(ren,x,y)=>{setup();W.lords=W.lords.filter(l=>!l.heir);P.comps={};if(x!=null){P.x=x;P.y=y}P.renown=ren;P.xpEarned=20;const mm=[X.min,X.max];X.min=X.max=0;X.die=true;try{lose(enc(wolves()))}finally{[X.min,X.max]=mm}t.act('cont');t.act('death-new');t.act('death-past',k);settle();return t.Remains.list.filter(o=>o.grave).pop()};
   L.clear();t.Remains.list=[];const x0=P.x,y0=P.y,a=die(0),at=L.plot&&L.plot.at;const b=die(X.grave.tiers.near.stone,x0+200,y0+120),c=die(X.grave.tiers.near.tomb,x0,y0);
   ok(at&&[a,b,c].every(g=>g.plot&&g.at===at)&&new Set([a,b,c].map(g=>g.x+','+g.y)).size===3&&[a,b,c].every(g=>Math.hypot(g.x-L.plot.x,g.y-L.plot.y)<X.grave.plot.gap*3),'three of your line, buried by people, lie together in the family plot at '+at+' ('+[a,b,c].map(g=>g.kind).join(', ')+')');
   {const hp=t.townBy(at),lots=[a,b,c].every(g=>t.Grave.clear(g.x,g.y));ok(lots&&Math.hypot(L.plot.x-hp.x,L.plot.y-hp.y)>=X.grave.yard.town,'the plot away from '+at+', its lots and its estates\' fields ('+Math.round(Math.hypot(L.plot.x-hp.x,L.plot.y-hp.y))+' px out, '+(()=>{let w=0;const tx=Math.floor(L.plot.x/t.TILE),ty=Math.floor(L.plot.y/t.TILE);for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++)if(t.tAt(tx+i,ty+j)===t.T_FOREST)w++;return w})()+' wooded tiles round it)')}
   {const site=W.sites.find(o=>o.type==='rest'&&o.kind==='plot');ok(site&&site.members().length===3&&/ Family Rest$/.test(site.name),'the plot a place: "'+(site&&site.name)+'", its three graves');
    G.mode='world';G.modal=false;site.meet();ok(G.mode==='site'&&/Here lie/.test(panel())&&(panel().match(/data-act="site-rest"/g)||[]).length>=3,'walked in: the site window, its graves, pray for each');
    const g0=site.members().find(g=>!g.spent&&g.xp>0),i0=site.members().indexOf(g0);t.act('site-rest','pray:'+i0);ok(g0.spent&&G.mode==='world','pray there for '+g0.who+': its light flows into you');g0.flowed()}
   c.meet();ok(/In the plot of the family of/.test(panel()),'its page: "In the plot of the family of '+L.plot.family+'"');t.act('death-leave');
   P.x=L.plot.x;P.y=L.plot.y+20;const ents=[];t.GraveArt.plot(ents,{x:L.plot.x-120,y:L.plot.y-80},t.vis(),L.plot,[a,b,c]);let ex=null;try{for(const e of ents)e.f()}catch(err){ex=err}ok(ents.length===2&&!ex,'its low wall round them, its gate under a wooden arch'+(ex?': '+ex.message:''));
   ok(L.save().plot.at===at,'the plot saved with your line');
   t.Remains.list=[];L.clear()}
  // ---- the lords' houses (the owner: "Create a family system for lords as well. Lord die may also have grave but may be different
  // grave"): a lord dead for good is buried in his house's crypt at its seat; after mourning, one of his house takes his place
  {const H=t.Houses,l=W.lords.find(o=>!o.dead&&!o.gone&&t.fiefsOf(o.fac).length),fac=l.fac,name=l.name;H.list=[];t.Remains.list=[];
   Object.assign(l,{dead:true,gone:true,back:1e9});H.died(l,'put to death');const h=H.byId(l.house),cr=t.Remains.list.find(o=>o.crypt);
   ok(h&&h.name==='House '+name.split(' ').pop()&&h.dead[0].name===name&&cr&&cr.house===h.id&&t.townBy(h.seat)&&Math.hypot(cr.x-t.townBy(h.seat).x,cr.y-t.townBy(h.seat).y)<X.grave.yard.max+10&&t.Grave.clear(cr.x,cr.y),name+' put to death: '+(h&&h.name)+' buries '+(l.gender==='f'?'her':'him')+' in its crypt at '+(h&&h.seat));
   {const site=W.sites.find(o=>o.type==='rest'&&o.kind==='crypt'&&o.ref===h.id);ok(site&&site.name==='Crypt of '+h.name&&site.members()[0]===cr,'the crypt a place: "'+(site&&site.name)+'"')}
   cr.meet();ok(/<h2>A crypt<\/h2>/.test(panel())&&panel().includes(t.htmlText(name))&&/data-act="death-respect"/.test(panel()),'the crypt: a house of stone, the names cut over it; pay your respects');t.act('death-leave');
   const n0=W.lords.length;G.day+=X.house.wait;H.hour();const s=W.lords.find(o=>o.house===h.id&&!o.dead);
   ok(W.lords.length===n0+1&&s&&s.fac===fac&&s.name!==name&&s.lv>=1,'after '+X.house.wait+' days of mourning, one of the house takes up the place: '+(s&&s.name));
   const r0=t.relWith(s);cr.meet();t.act('death-respect');ok(t.relWith(s)===r0+X.house.respect&&cr.paid===G.day,'respects paid: '+s.name+' thinks the better of you (+'+X.house.respect+'), once a day');
   const ents=[];cr.draw(ents,{x:cr.x-120,y:cr.y-80},t.vis());let ex=null;try{for(const e of ents)e.f()}catch(err){ex=err}ok(!ex,'drawn: its steps, pediment, columns, dark door, the banner over it, candles'+(ex?': '+ex.message:''));
   roll(0);try{t.defeatLord(s)}finally{window.Math.random=rnd}ok(s.gone&&h.dead.length===2,'beaten in the field, now and then slain: the second of the house in its crypt');
   const sv=JSON.parse(JSON.stringify(H.save())),rs=JSON.parse(JSON.stringify(t.Remains.save()));H.load(sv);t.Remains.load(rs);ok(H.byId(h.id).dead.length===2&&t.Remains.list.find(o=>o.crypt) instanceof t.Crypt,'saved and loaded: the house, its crypt');
   X.on=false;const o2=W.lords.find(o=>!o.dead&&!o.gone);roll(0);try{ok(!H.slain(o2),'the rule off (the tests\' harness): no lord dies')}finally{window.Math.random=rnd;X.on=true}
   H.list=[];t.Remains.list=[]}
  // ---- edge cases (the owner: "Check for edge cases")
  {const L=t.Legacy,k=Object.keys(t.BGS)[0],settleAll=()=>{const was=D.unseenAt;D.unseenAt=()=>true;roll(0);try{t.Grave.daily()}finally{window.Math.random=rnd;D.unseenAt=was}},
    die=(ren,x,y,keep)=>{setup();W.lords=W.lords.filter(l=>!l.heir);P.comps={};if(x!=null){P.x=x;P.y=y}P.renown=ren;P.xpEarned=40;const mm=[X.min,X.max];X.min=X.max=0;X.die=true;try{lose(enc(wolves()))}finally{[X.min,X.max]=mm}t.act('cont');t.act('death-new');t.act('death-past',k);if(!keep)settleAll();return t.Remains.list.filter(o=>o.grave).pop()};
   // (Esc on the Slain page: on as someone new, never thrown out of the game)
   {setup();t.Remains.list=[];L.clear();const mm=[X.min,X.max];X.min=X.max=0;X.die=true;try{lose(enc(wolves()))}finally{[X.min,X.max]=mm}t.act('cont');
    const nb=document.querySelector('#panel .nav [data-nav="back"]'),nc=document.querySelector('#panel .nav [data-nav="close"]');ok(!nb&&nc&&nc.dataset.act==='death-new'&&/data-act="death-load"/.test(panel()),'the Slain page: Esc goes on as someone new; a save or the main menu are buttons of their own');
    t.act('death-new');t.act('death-past',k);settleAll()}
   // (praying, then saving or loading at once: the gain is yours already, and nothing of the flow is saved)
   {t.Remains.list=[];const g=die(0);G.mode='world';const a0=t.HERO_XP_ALL(P.level,P.xp);g.pray();ok(Math.round(t.HERO_XP_ALL(P.level,P.xp)-a0)===g.xp&&!JSON.stringify(t.Remains.save()).includes('"flow"'),'pray, and save before the light arrives: the experience yours already (+'+g.xp+'), its flow not saved')}
   // (the holding of your family's plot gone: a new plot begun by the next; the old one stays a place of its own)
   {t.Remains.list=[];L.clear();const a=die(0),at1=a.plot,h1=t.townBy(at1);h1.gone=true;const h2=t.Spatial.nearestHolding(h1.x,h1.y,o=>o!==h1&&!o.gone);let b;try{b=die(0,h2.x+24,h2.y+30)}finally{h1.gone=false}
    const plots=W.sites.filter(o=>o.type==='rest'&&o.kind==='plot');ok(b.plot&&b.plot!==at1&&plots.some(o=>o.ref===at1&&o.members().includes(a))&&plots.some(o=>o.ref===b.plot&&o.members().includes(b)),'the plot\'s holding gone: a new plot at '+b.plot+', the old at '+at1+' kept as its own place')}
   // (a lone one found, then buried where it lay or carried off: the same place, as you knew it)
   {let far=null;for(let ty=4;ty<t.MH-4&&!far;ty+=3)for(let tx=4;tx<t.MW-4&&!far;tx+=3){const x=tx*t.TILE+8,y=ty*t.TILE+8,h=t.Spatial.nearestHolding(x,y);if(t.passable(t.terrAt(x,y))&&h&&Math.hypot(h.x-x,h.y-y)/t.TILE>X.grave.tiers.far+3&&!t.RoadBand.on(x,y))far={x,y}}
    if(far){t.Remains.list=[];const g=die(0,far.x,far.y,true),s0=W.sites.find(o=>o.type==='rest'&&o.members().includes(g));G.mode='world';s0.meet();t.act('site-rest','here:0');const s1=W.sites.find(o=>o.type==='rest'&&o.members().includes(g));
     ok(s0&&s1===s0&&g.kind==='small','buried where it lay (moved a little): still the place you found ("'+(s1&&s1.name)+'")')}}
   {const lv=P.level,bg=P.bg;D.slain=null;t.act('death-new');t.act('death-past',Object.keys(t.BGS)[1]);ok(P.level===lv&&P.bg===bg&&!/A new life/.test(panel()),'alive, no new life to be had (its page and its pasts do nothing)')}
   // (no two resting places ever share a number, though places come and go)
   {const is=W.sites.filter(o=>o.type==='rest').map(o=>o.i);ok(new Set(is).size===is.length&&is.every(i=>i>=100000),'every resting place its own number, past the world\'s sites')}
   t.Remains.list=[];W.sites=W.sites.filter(o=>o.type!=='rest');L.clear()}
  // ---- your family (the owner: "Go with 3, 1, 10 and 7 first"): its name, chosen as you go on; its tree in the journal; a lord's
  // house shown with him; a grudge for one of a house killed by your hand
  {const L=t.Legacy,k=Object.keys(t.BGS)[0],settleAll=()=>{const was=D.unseenAt;D.unseenAt=()=>true;roll(0);try{t.Grave.daily()}finally{window.Math.random=rnd;D.unseenAt=was}},
    die=(ren,fam)=>{setup();W.lords=W.lords.filter(l=>!l.heir);P.comps={};P.renown=ren;P.xpEarned=40;const mm=[X.min,X.max];X.min=X.max=0;X.die=true;try{lose(enc(wolves()))}finally{[X.min,X.max]=mm}t.act('cont');t.act('death-new');
      if(fam!=null){const i=document.querySelector('#panel [data-name="family"]');i.value=fam;i.dispatchEvent(new Event('input',{bubbles:true}))}t.act('death-past',k);settleAll();return t.Remains.list.filter(o=>o.grave).pop()};
   t.Remains.list=[];W.sites=W.sites.filter(o=>o.type!=='rest');L.clear();
   P.name='Aldric Ashby';setup();P.name='Aldric Ashby';const mm=[X.min,X.max];X.min=X.max=0;X.die=true;try{lose(enc(wolves()))}finally{[X.min,X.max]=mm}t.act('cont');t.act('death-new');
   const fi=document.querySelector('#panel [data-name="family"]');ok(fi&&fi.value==='Ashby','the new life asks your family\'s name ("'+(fi&&fi.value)+'", from the fallen\'s own)');
   fi.value='Thornwood';fi.dispatchEvent(new Event('input',{bubbles:true}));t.act('death-past',k);settleAll();
   ok(L.family==='Thornwood'&&L.line.length===1&&L.line[0].family==='Thornwood','your line goes by it: the Thornwood family');
   const g2=die(X.grave.tiers.near.stone),site=W.sites.find(o=>o.type==='rest'&&o.kind==='plot');ok(site&&site.name==='Thornwood Family Rest'&&L.line.length===2&&L.family==='Thornwood','its graves and plot go by it: "'+(site&&site.name)+'"; the next life keeps it');
   G.jsec='family';G.famPick=null;const html=t.JOURNAL_SECTIONS.family.render();const ord=[...html.matchAll(/class="ft-pic">[\s\S]*?<\/span><span class="ft-n">([^<]+)</g)].map(m=>m[1]);
   ok(/The Thornwood family · 2 fallen/.test(html)&&ord.join('|')==='1st|2nd|3rd · you'&&/class="ft-li ft-now"/.test(html)&&(html.match(/data-act="fam-pick"/g)||[]).length===3,'the journal\'s Family, a tree of tiles: the 1st at the top, then the 2nd, down to you, the 3rd ('+ord.join(' → ')+')');
   ok(/class="ft-info"[\s\S]*3rd · you/.test(html)&&!/Lies in /.test(html),'you told beside the chart, until another tile is chosen');
   t.openJournal('family');t.act('fam-pick','2');const info=document.querySelector('#panel .ft-info')?.textContent||'',sel=document.querySelector('#panel .ft-tile.ft-sel');
   ok(/Lies in Thornwood Family Rest/.test(info)&&/Fell to /.test(info)&&sel&&sel.dataset.arg==='2'&&sel.querySelector('img'),'a tile clicked: its life told (where they lie, what killed them), the tile marked, its picture in its square');
   const fc=L.line.map(r=>r.face&&JSON.stringify(r.face.config));ok(!t.Faces.ok()||fc.every(Boolean)&&new Set(fc).size===fc.length&&JSON.stringify(t.Faces.you().config)!==fc[1],'each of your line kept their own face, and you have yours');
   t.act('journal-close');G.famPick=null;
   // (a lord of a house killed by you: his house holds it against you, its living lords and the next of it; the house shown with him)
   const H=t.Houses;H.list=[];const lo=W.lords.filter(o=>!o.dead&&!o.gone&&t.fiefsOf(o.fac).length),a=lo[0],h=t.LordHouse.of(a),b=lo.find(o=>o!==a&&o.fac===a.fac);if(b)b.house=h.id;
   const rb=b?t.relWith(b):0;Object.assign(a,{dead:true,gone:true,back:1e9});H.died(a,'put to death',true);
   ok(h.grudged()&&(!b||t.relWith(b)===rb+X.house.grudge),'you put '+a.name+' to death: '+h.name+' bears you a grudge'+(b?' ('+b.name+' '+X.house.grudge+')':''));
   G.day+=X.house.wait;H.hour();const s=W.lords.find(o=>o.house===h.id&&!o.dead&&o!==b);ok(s&&t.relWith(s)===X.house.grudge,'the next of the house takes up the place, and the grudge with it ('+(s&&s.name)+': '+(s&&t.relWith(s))+')');
   ok(new RegExp(h.name+'.*bears you a grudge').test(H.tagOf(s))&&s.tip().includes(h.name),'the house shown with its lords, on the map and in the Lords: "'+H.tagOf(s).replace(/<[^>]+>/g,'')+'"');
   // (its tree in the Journal's Houses: set down once you know one of it; the rest ?? until met, read on its crypt, or told by a close friend)
   {const KL=t.KNOWLEDGE.lords,k0={...KL},lr0={...(P.lrel||{})};try{for(const id in KL)delete KL[id];h.known=[];
     ok(!H.known().includes(h),'a house you know no one of: not in the Journal\'s Houses');
     t.KNOWLEDGE.lord(s);G.jsec='houses';G.hsHouse=h.id;G.hsPick=s.id;let html=t.JOURNAL_SECTIONS.houses.render();
     ok(H.known().includes(h)&&html.includes('<b>'+s.name+'</b>')&&!html.includes('<b>'+a.name+'</b>')&&/<b>\?\?<\/b>/.test(html)&&/Took up the place of \?\?/.test(html),'once you know one of it, its tree: '+s.name+' by name; '+a.name+', whose place he took, a ??');
     ok(String(s.name).split(/\s+/).pop()!==String(a.name).split(/\s+/).pop(),'the next of the house not named as the one whose place he took ('+s.name+' after '+a.name+')');
     t.Crypt.of(h).meet();html=t.JOURNAL_SECTIONS.houses.render();ok(h.knows(a.id)&&html.includes('<b>'+a.name+'</b>')&&html.includes('Took up the place of '+a.name),'its crypt read: its dead known by name');t.act('death-leave');
     if(b){for(const id in KL)delete KL[id];h.known=[];t.KNOWLEDGE.lord(s);P.lrel[s.id]=X.house.tell-1;const rp=new t.LordSpeaker(s).replies().find(r=>r.act==='lr-house');
       ok(rp&&rp.why&&!h.tell(s)&&!t.KNOWLEDGE.knowsLord(b),'"Tell me of your house": not for one who is not a close friend ('+(rp&&rp.why)+')');
       P.lrel[s.id]=X.house.tell;const said=h.tell(s);ok(new t.LordSpeaker(s).replies().find(r=>r.act==='lr-house').why===''&&said.includes(b.name)&&t.KNOWLEDGE.knowsLord(b)&&h.knows(a.id),'a close friend of the house tells you of all of it: '+said.replace(/<[^>]+>/g,''))}
   }finally{for(const id in KL)delete KL[id];Object.assign(KL,k0);P.lrel=lr0;G.hsHouse=G.hsPick=null}}
   // (a house's family: a spouse and children as it is first known; the eldest grown child after one dead; by the days weddings and births; its kin ?? until told)
   {const Fm=X.house.fam,f0={...Fm},KL=t.KNOWLEDGE.lords,k0={...KL},lr0={...(P.lrel||{})};try{Object.assign(Fm,{wed:1,kids:[2,2],age:[Fm.adult,Fm.adult+50]});
     const lo=W.lords.find(o=>!o.dead&&!o.gone&&!o.house&&t.fiefsOf(o.fac).length),hh=t.LordHouse.of(lo),sp=hh.person(lo.spouse),kids=hh.kinLive.filter(k=>k.parent===lo.id);
     ok(sp&&sp.inlaw&&sp.spouse===lo.id&&sp.gender!==t.genderOf(lo)&&kids.length===2&&kids.every(k=>hh.adult(k)&&k.race===hh.raceOf(lo)),'a lord\'s family, as his house is first known: '+lo.name+' wed to '+(sp&&sp.name)+', their children '+kids.map(k=>k.name).join(' and '));
     const eld=kids.slice().sort((x,y)=>x.born-y.born)[0];Object.assign(Fm,f0);Object.assign(lo,{dead:true,gone:true,back:1e9});H.died(lo,'slain in battle',false);G.day+=X.house.wait;H.hour();
     const nx=W.lords.find(o=>o.id===eld.id);ok(nx&&!nx.dead&&nx.house===hh.id&&nx.name.endsWith(' '+eld.name)&&nx.parent===lo.id&&nx.succeeded===lo.id&&!hh.kinLive.includes(eld)&&hh.person(lo.spouse),'one dead: their eldest grown child takes up the place ('+(nx&&nx.name)+'), the widow'+(sp.gender==='f'?'':'er')+' still of the house');
     Object.assign(Fm,{marry:1,birth:1});G.day++;H.hour();const w=hh.person(nx.spouse);G.day++;H.hour();const born=hh.kinLive.filter(k=>k.parent===nx.id);Object.assign(Fm,f0);
     ok(w&&w.inlaw&&born.length>=1&&born.every(k=>!hh.adult(k)&&k.born===G.day),'by the days: the grown and unwed wed, a couple has a child ('+nx.name+' wed to '+(w&&w.name)+'; '+born.map(k=>k.name).join(', ')+')');
     for(const id in KL)delete KL[id];hh.known=[];t.KNOWLEDGE.lord(nx);G.hsHouse=hh.id;G.hsPick=nx.id;let html=t.JOURNAL_SECTIONS.houses.render();const unk=(html.match(/<b>\?\?<\/b>/g)||[]).length;
     ok(unk>=hh.kinLive.length+hh.dead.length&&!html.includes('<b>'+w.name+'</b>'),'its kin not known to you: ?? ('+unk+' of '+hh.members.length+')');
     P.lrel[nx.id]=X.house.tell;const said=hh.tell(nx);html=t.JOURNAL_SECTIONS.houses.render();
     ok(said.includes(w.name)&&said.includes(born[0].name)&&html.includes('<b>'+w.name+'</b>')&&/ft-spouse/.test(html)&&new RegExp((nx.gender==='f'?'Daughter':'Son')+' of '+lo.name).test(html)&&hh.knows(born[0].id),'told by a close friend: its kin by name, the one wed beside the one they wed, each child below their parent');
   }finally{Object.assign(Fm,f0);for(const id in KL)delete KL[id];Object.assign(KL,k0);P.lrel=lr0;G.hsHouse=G.hsPick=null}}
   const c=W.lords.find(o=>!o.dead&&!o.gone&&!o.house);ok(/House /.test(H.tagOf(c,true))&&c.house,'a lord with no house yet: his house founded as you look him up');
   G.kin=null;die(0);ok(!h.grudged(),'you dead, a stranger going on: the grudge gone with you');
   const r0=W.lords.find(o=>!o.dead&&!o.gone&&!o.house);roll(0);let txt='';try{txt=t.lordWon(r0,{gold:0})}finally{window.Math.random=rnd}ok(r0.gone&&/falls in the fighting/.test(txt)&&H.byId(r0.house).grudged(),'beaten by you, now and then he falls in the fighting: his house holds it against you');
   // (kin of the one who fell: their people, a keepsake, a little of their name and of what their lords thought of them, the family's ground)
   {setup();const lo=W.lords.find(o=>!o.dead&&!o.gone),gid=Object.keys(t.ITEMS).find(q=>t.ITEMS[q].slot==='weapon');P.race='elf';P.renown=200;P.lrel={[lo.id]:60};P.gear.weapon=gid;
    const hl=t.LordHouse.of(lo);hl.grudge={gen:L.fallen,day:G.day,name:'Lord X',how:'put to death'};const home0=P.home,n0=L.line.length,mm=[X.min,X.max];X.min=X.max=0;X.die=true;try{lose(enc(wolves()))}finally{[X.min,X.max]=mm}
    t.act('cont');t.act('death-new');ok(/data-act="death-kin"/.test(panel())&&!/data-act="death-race"/.test(panel()),'who you are: kin of the fallen (their people, no choosing your race), or a stranger');
    t.act('death-past',k);const ok1=P.race==='elf'&&P.renown===20&&P.lrel[lo.id]===30&&P.inv.some(q=>q&&q.id===gid)&&L.kin.rel==='child'&&L.kin.of===n0+1;
    ok(ok1,'their child: an elf as they were, '+P.renown+' renown of their 200, half their lord\'s regard ('+(P.lrel[lo.id])+' of 60), their blade in your bag');
    const fh=t.townBy(L.plot?.at)||t.townBy(home0);ok(!fh||P.home===fh.name,'you begin where the family is known ('+P.home+')');
    ok(hl.grudged()&&hl.grudge.half&&/your kin killed/.test(H.tagOf(lo)),'their feud yours, at half: "'+H.tagOf(lo).replace(/<[^>]+>/g,'')+'"');
    const html=t.JOURNAL_SECTIONS.family.render(),m=html.match(/<li class="ft-li"><div class="ft-row[^"]*">[\s\S]*?<ul><li class="ft-li ft-now">/);ok(m&&/Child of /.test(html),'the tree: you below the one you came from, their child');
    const pf=L.line[L.line.length-1].face,yf=t.Faces.ok()&&t.Faces.you();ok(!yf||!pf||yf.colors.skin===pf.colors.skin&&(yf.config.race!==pf.config.race||yf.config.face===pf.config.face),'their child\'s face like theirs: the same skin, and the same shape of face where their people allow it')}
   H.list=[];t.Remains.list=[];W.sites=W.sites.filter(o=>o.type!=='rest');L.clear()}
  // ---- no room on the roll's other side: a man-eater only once, and no mythic one
  {setup();const m=wolves({eater:{name:'the Old Maw',day:1}}),lv=m.lv;roll(.1);try{lose(enc(m))}finally{window.Math.random=rnd}ok(m.lv===lv&&m.eater.name==='the Old Maw','a man-eater already: named once');t.act('cont')}
 }finally{window.Math.random=rnd;X.on=on0;X.die=die0;D.slain=null;t.Remains.list=[];W.lords=W.lords.filter(l=>!l.heir);for(const x of t.TOWNS)if(t.Legacy.realms[x.owner])x.owner=t.FIDS[0];t.Legacy.clear();P.comps={};P.weak=0}
});
