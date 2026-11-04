'use strict';
// The chains that grow from jobs (doc/QUESTS_DESIGN.md §8, Q7; story/chains.js): each begun by how a real job ended and walked
// to its end on the world as it is. The chief who ran (a bounty paid, its chief got away: he is the hideout's chieftain, a real
// lord's letter among his plunder); Something bigger (a beast hunt paid, a cave near); The empty larder (a supply run paid whose
// caravan was robbed: the goods back into its stores); A sealed hand (a courier's letter read that orders an attack: the holding
// warned, its garrison readied). None begun without its cause; none twice at once for a holding.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',13);Kit.world();Kit.clear();t.QUEST_MARKS.band=t.QUEST_MARKS.beast=0;
 const ash=t.townBy('Ashford'),live=k=>W.story?.threads?.on.find(th=>th.k===k)||null;P.quests=[];
 const facs=Object.keys(t.FACS).filter(f=>f!=='player');for(const a of facs)for(const b of facs)if(a<b)W.rel[t.rk(a,b)]={s:'war',since:G.day};W.lords.forEach(l=>{l.dead=false});
 // (a page waiting: shown, choice i taken)
 const choose=i=>{Kit.world();t.Thread.showWaiting();const ok0=G.mode==='story';t.act('thr-do',String(i));Kit.world();return ok0};
 const cleared=th=>{const q=P.quests.find(x=>x.id===th.wait?.id),s=q&&W.sites[q.site];if(s)t.worldEmit('site:cleared',{site:s});return !!s};
 const bandAt=(x,y,n)=>{const b=t.asParty({x,y,n,kind:'bandits',list:t.makeEnemies(n,false,'bandits'),t:0,a:0,idle:true,cool:99,ld:t.newChief('bandits',2)});t.bandits.push(b);return b};
 // ======== The chief who ran
 {const b=bandAt(ash.x+240,ash.y+60,5),q=t.makeQuest('bounty',ash);q.accept();q.done=true;t.payQuest(q,ash.name);ok(!live('chief'),'his chief taken or slain: no chain');
  t.Chains.live('chief','x');const b2=bandAt(ash.x+240,ash.y+60,5),q2=t.makeQuest('bounty',ash);q2.accept();(W.exiles=W.exiles||[]).push({ld:b2.ld,back:G.day+6});q2.done=true;t.payQuest(q2,ash.name);
  const th=live('chief'),s=th&&W.sites[th.memory.site];
  ok(th&&s&&s.ld===b2.ld&&W.exiles.find(x=>x.ld===b2.ld).done&&th.memory.patron,'its chief got away: The chief who ran; he is the chieftain of the '+(s&&s.name)+' now, his exile over; the patron: '+(th&&th.memory.patron));
  const rel0=t.relWith(W.lords.find(l=>l.name===th.memory.patron)),rep0=t.repAt('Ashford');
  ok(choose(0)&&th.at==='den'&&P.quests.some(x=>x.id===th.wait.id),'"Ride after him": clear the hideout');
  ok(cleared(th)&&th.at==='letter','cleared: his plunder, the letter');ok(choose(0)&&!live('chief')&&t.repAt('Ashford')>rep0&&t.relWith(W.lords.find(l=>l.name===th.memory.patron))<rel0,'given to Ashford: its reputation up, '+th.memory.patron+'’s regard down')}
 // ======== Something bigger
 {Kit.clear();P.quests=[];const cave=W.sites.filter(s=>s.type==='cave'&&!s.cleared).sort((a,b)=>Math.hypot(a.x-ash.x,a.y-ash.y)-Math.hypot(b.x-ash.x,b.y-ash.y))[0];
  if(cave){cave.x=ash.x+300;cave.y=ash.y+200;const id=Object.keys(t.MONSTERS).find(k=>!t.MONSTERS[k].mythic);W.monsters.push(t.asMonster({id,x:ash.x+150,y:ash.y,hx:ash.x+150,hy:ash.y,lv:2,n:3,t:0,a:0,cool:0}));
   const q=t.makeQuest('beast',ash);q.accept();q.done=true;t.payQuest(q,ash.name);const th=live('bigger');
   ok(th&&th.memory.cave===cave.name,'a beast hunt paid with the '+cave.name+' near: Something bigger');
   Kit.stubStream('road',0,()=>choose(0));ok(th.at==='mouth','its tracks followed (a check won): at the '+cave.name);
   const rep0=t.repAt('Ashford');ok(choose(0)&&th.at==='fight'&&cleared(th)&&!live('bigger')&&t.repAt('Ashford')>rep0,'gone in after it, and killed: Ashford names you')}
  else ok(true,'(no cave on this map)')}
 // ======== The empty larder
 {Kit.clear();P.quests=[];t.newsRecord('caravan',{x:ash.x+120,y:ash.y+40},{from:'Ashford'});let q=null;for(let k=0;k<6&&!q;k++)q=t.makeQuest('supply',ash);
  ok(q&&/^They robbed a caravan/.test(q.cause),'a shortage whose caravan was robbed: '+(q&&q.cause));q.accept();P.inv=P.inv.map(()=>null);t.invAdd('good',q.good,q.n);q.turnIn(ash);
  const th=live('larder');ok(th&&th.memory.gk===q.good,'paid: The empty larder');
  ok(choose(1)&&th.at==='den'&&cleared(th)&&th.at==='goods','after the goods: the hideout cleared');t.ensureEcon(ash);const s0=ash.stock[q.good]||0;
  ok(choose(0)&&!live('larder')&&(ash.stock[q.good]||0)===s0+q.n,'brought back: Ashford\'s stores +'+q.n)}
 // ======== A sealed hand
 {Kit.clear();P.quests=[];let q=null;for(let k=0;k<10&&!q;k++)q=t.makeQuest('courier',ash);q.accept();const L=q.carried(),tg=t.TOWNS.find(z=>z.owner&&z.owner!==L.fac&&z.owner!=='player'&&!z.gone);
  L.kind='attack';L.vs=tg.owner;L.tgt=tg.name;t.LETTER.read(L);const th=live('sealed');ok(th&&th.memory.tgt===tg.name,'a courier\'s letter read, an attack on '+tg.name+' in it: A sealed hand');
  ok(choose(0)&&th.at==='warn','"Warn '+tg.name+'": ride there');tg.gar=Math.max(1,tg.T.gar-6);const g0=tg.gar;P.x=tg.x;P.y=tg.y+10;t.Steps.frame();
  ok(th.at==='warned'&&choose(0)&&!live('sealed')&&tg.gar===g0+t.CHAINS.gar,'there, for the people in it: its garrison readied (+'+t.CHAINS.gar+')')}
 // ======== none twice at once
 {const m={town:'Ashford',fac:ash.owner,giver:'x',gn:'y',chief:'c',band:'b',lair:'l',site:0,dir:'',patron:'p',prealm:'r'};t.Chains.begin('chief',m);ok(t.Chains.begin('chief',m)===null,'one of a kind at a time for a holding')}
 P.quests=[];Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
