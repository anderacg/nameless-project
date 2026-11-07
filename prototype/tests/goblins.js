'use strict';
// Goblins (the owner, 2026-11-07: "Goblin enemy should also be added, similar to bandits but can use building sprite from orc
// factions for their camps"; data/goblins.js GOBLINS, world/goblins.js, world/sites.js GoblinCamp). Their troops weak, quick and
// short of nerve; their camps on the hideouts' wild land, built as the Ashgor Horde's yurts; their warbands out round them, bigger
// than a bandit band, timid, turning home past their leash, sheltering in their own camp by night; meeting one, cornering one,
// beating one; storming a camp (its boss, its pile of stolen goods, empty for GOBLINS.respawn days); their raids; the camps sending
// out new warbands; the switch; all of it through a save. INFO: the counts.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,ST=t.ST,GB=t.GOBLINS,TILE=t.TILE;
 Kit.begin('soldier');
 const camps=()=>W.sites.filter(s=>s.type==='goblins'),bands=()=>t.bandits.filter(b=>b.kind==='goblins'),strong=()=>{P.troops={hum_knight:30,hum_long:20};P.hp=null;t.vitals()};
 // ---- the troops
 const gobs=['gob_stab','gob_spear','gob_bow','gob_boss'],rank=gobs.slice(0,3);
 ok(gobs.every(k=>ST[k]&&ST[k].race==='goblin')&&t.raceOf('goblin').n==='Goblin'&&!t.RACES.goblin,'four goblin troops ('+gobs.map(k=>ST[k].n).join(', ')+'), of a race no one plays');
 ok(rank.every(k=>ST[k].hp<ST.militia.hp&&ST[k].spd>ST.militia.spd&&ST[k].tier===1),'the rank and file frailer and quicker than militia');
 ok(gobs.every(k=>t.unitMoraleOf(ST[k])<t.unitMoraleOf(ST.hum_levy))&&t.unitMoraleOf(ST.gob_stab)===GB.morale,'all short of nerve in battle: morale '+GB.morale+' (the boss '+GB.bossMorale+'), a levy\'s '+t.unitMoraleOf(ST.hum_levy));
 ok(t.unitClass(ST.gob_spear)==='spear'&&ST.gob_bow.bow&&t.tagsOf(ST.gob_stab).includes('shield')&&ST.gob_boss.hp>ST.gob_stab.hp*2,'a stabber\'s round shield, a spearman\'s spear, an archer\'s bow, a boss twice as tough');
 ok(t.goblinList(GB.bossAt,false).includes(GB.boss)&&!t.goblinList(GB.bossAt-1,false).includes(GB.boss)&&t.goblinList(3,true).includes(GB.boss)&&t.makeEnemies(9,false,'goblins').every(k=>ST[k].race==='goblin'),'a crowd of goblins; a camp, or '+GB.bossAt+' or more, with its boss');
 // ---- the camps: on the hideouts' wild land, built as the Horde builds
 const C=camps(),N=t.density(t.WM).sites.goblins,wl=t.wildLand(),H=t.HIDEOUT_PLACE;
 const holdD=s=>Math.min(...t.TOWNS.map(w=>Math.hypot(w.tx-s.tx,w.ty-s.ty)-(w.T.tier<=1?H.hamlet:H.far)+H.far));
 info(C.length+' goblin camps of '+N+'; '+bands().length+' warbands; '+t.roamers().length+' bandit bands');
 ok(C.length>=Math.min(N,4)&&C.every(s=>s instanceof t.GoblinCamp&&wl.at[s.ty*t.MW+s.tx]===1&&holdD(s)>=H.far&&t.Hideout.clear(s.tx,s.ty)&&t.Hideout.fits(s.tx,s.ty)),C.length+' camps, each on the wild land '+H.far+'+ tiles from every holding, on clear ground off the estates');
 {const hid=W.sites.filter(s=>s.type==='hideout'),gap=Math.min(Infinity,...C.map(a=>Math.min(Infinity,...hid.map(b=>Math.hypot(a.tx-b.tx,a.ty-b.ty)))));
  ok(gap>=t.SITE_GAP.goblins.hideout,'apart from the hideouts ('+gap.toFixed(1)+' tiles at the least)')}
 ok(C.every(s=>s.band==='goblins'&&GB.names.includes(s.name)&&!s.tunnel&&s.ld&&t.CHIEF_NAMES.goblins[0].includes(s.ld.name.split(' ')[0])),'each its own name ('+C.slice(0,3).map(s=>s.name).join(', ')+'), no tunnel, a goblin boss ('+C[0].ld.name+')');
 {const s=C[0],c=t.climAt(s.x,s.y),m=t.PX.clusterModel({kind:'hideout',culture:'ashgor',seed:s.seed*131+7,env:c,snow:c==='frost'?1:0}),sp=t.siteSprite(s),hd=t.campSprite(s.seed,'hideout',c);
  const px=v=>v.getContext('2d').getImageData(0,0,v.width,v.height).data,same=(a,b)=>{const x=px(a),y=px(b);if(x.length!==y.length)return false;for(let i=0;i<x.length;i++)if(x[i]!==y[i])return false;return true};
  ok(m.culture==='ashgor'&&t.SITE_CULTURE.goblins==='ashgor'&&sp===t.campSprite(s.seed,'goblins',c)&&!same(sp,hd),'a camp is drawn as the Ashgor Horde builds (its yurts in a ring of stakes), not as a bandit hideout')}
 ok(t.nightCamps().filter(s=>s instanceof t.GoblinCamp).length===C.length&&t.camps().every(s=>s instanceof t.BanditCamp),'the camps bands shelter in by night count the goblins\', the bandit camps stay the bandits\'');
 // ---- the warbands: out round their camps, bigger than a bandit band
 const B0=bands(),of=b=>C.find(s=>s.i===b.camp);
 ok(B0.length>=C.length&&B0.every(b=>b instanceof t.GoblinBand&&b.mapKind==='band'&&of(b)&&b.haunt.x===of(b).x&&Math.hypot(b.x-of(b).x,b.y-of(b).y)<=7*TILE),B0.length+' warbands set out ('+GB.bands+' a camp), each a few tiles from its camp, haunting it');
 ok(B0.every(b=>b.troops.every(k=>ST[k].race==='goblin')&&b.size>=GB.band[0]),'all goblins, '+GB.band.join('-')+' strong or more');
 {const avg=l=>l.reduce((a,b)=>a+b.size,0)/l.length,r=t.roamers();ok(avg(B0)>avg(r)&&r.every(b=>b.kind!=='goblins')&&r.length<=t.density(t.WM).bandits,'bigger than bandit bands ('+avg(B0).toFixed(1)+' to '+avg(r).toFixed(1)+'), and the bandits roam in their own numbers ('+r.length+')')}
 {const b=B0[0],L=b.look(),bn=b.banner(),d=b.mapDot({});ok(L.col===GB.col&&L.race==='goblin'&&bn.col===GB.col&&(!d||d[0]===GB.col)&&b.label()==='Goblin warband'&&b.nerve===GB.nerve&&b.hauntR===GB.leash,'under a green rag, of their race, called a goblin warband')}
 // timid: as strong as you, a bandit band hunts you, a warband only hangs back
 {Kit.clear();Kit.world({encCool:0});const gb=B0[0];P.troops={};let k=0;while(t.partyPower()<gb.power()&&k++<80)P.troops={hum_levy:k};
  const bb=t.asParty({x:P.x+70,y:P.y,n:gb.size,kind:'bandits',list:gb.troops.slice(),t:9,a:0,idle:true,cool:0});
  ok(t.stance(bb.power())==='attack'&&t.stance(gb.power()*gb.nerve)!=='attack','at '+gb.power()+' power to your '+t.partyPower()+': a bandit band would attack, a warband '+t.stance(gb.power()*gb.nerve))}
 // they turn for home past their leash (you far off)
 {Kit.clear();const b=B0[0],c=of(b);t.bandits.push(b);P.x=-9999;P.y=-9999;Kit.world({encCool:99});b.x=c.x+(GB.leash+10)*TILE;b.y=c.y;t.unstick(b);b.t=0;b.cool=0;b.idle=false;const d0=Math.hypot(b.x-c.x,b.y-c.y);
  for(let i=0;i<400;i++)t.BRAINS.band.think(b,.05,false);const d1=Math.hypot(b.x-c.x,b.y-c.y);
  ok(d1<d0-2*TILE,'a warband strayed '+(d0/TILE).toFixed(1)+' tiles off turns for its camp ('+(d1/TILE).toFixed(1)+' after 20 s)');
  // by night: into their own camp, never a bandit camp; a bandit band never into theirs
  b.x=c.x+3*TILE;b.y=c.y;const home=t.campNear(b,null),bc=t.camps()[0],bb={kind:'bandits',x:c.x+3*TILE,y:c.y};
  ok(home===c&&!bc.shelters(b)&&!c.shelters(bb)&&bc.shelters(bb),'by night a warband shelters in its own camp, never a bandit camp; a bandit band never in theirs')}
 // ---- meeting one: its own page, cornered as goblins, beaten
 {Kit.world({encCool:0});strong();const b=B0[1]||B0[0];t.bandits.push(b);b.x=P.x+6;b.y=P.y;b.pw=0;
  P.troops={hum_levy:1};t.meetBand(b);
  ok(G.enc&&G.enc.band==='goblins'&&/Goblin warband/.test(Kit.panel())&&/ragged hoods/.test(Kit.panel())&&/goblins/.test(Kit.panel()),'meeting a warband: its own title, a line about them, the scouts count goblins');
  Kit.world();strong();t.meetBand(b);ok(G.par&&/The goblins are cornered/.test(Kit.panel()),'a warband that fears you is cornered as goblins');
  Kit.world();G.par=null;t.startEncounter({kind:'party',ref:b,list:b.troops.slice(),band:'goblins'});t.autoResolve();
  ok(/Victory/.test(Kit.panel())&&!t.bandits.includes(b),'beaten, the warband is broken');Kit.done({cont:true})}
 // ---- storming a camp: its boss, its plunder and stolen goods, empty for a while
 {Kit.world({encCool:0});strong();const s=C[0];P.x=s.x;P.y=s.y+12;
  s.fight(true);ok(G.enc&&G.enc.kind==='camp'&&G.enc.list.includes(GB.boss)&&G.enc.list.length>=GB.camp.foes[0]+1&&new RegExp(s.name).test(Kit.panel()),'storming '+s.name+': '+G.enc.list.length+' goblins and their boss');
  t.autoResolve();ok(s.cleared&&s.back===G.day+GB.respawn&&/In their pile of stolen goods: \d+ /.test(Kit.panel()),'won: empty for '+GB.respawn+' days, and their pile of stolen goods is yours ('+(Kit.text().match(/stolen goods: [^.]*/)||[''])[0]+')');Kit.done({cont:true});
  t.bandits.length=0;const sp=GB.spawn;try{GB.spawn=1;t.goblinDay()}finally{GB.spawn=sp}
  ok(!t.bandits.some(b=>b.camp===s.i)&&C.filter(x=>x!==s).every(x=>t.bandits.filter(b=>b.camp===x.i).length===1),'the next day each camp short of warbands sends one out; the cleared one none');
  G.day=s.back;s.day();ok(!s.cleared&&s.ld,'after '+GB.respawn+' days goblins move back in under a new boss')}
 // ---- a raid on a hamlet or village by
 {const v=t.TOWNS.find(h=>h.T.tier<=2&&!t.besieged(h));t.ensureEcon(v);t.Timed.of(v).clear('fear');const f0=t.foodStock(v),b=bands()[0];b.x=v.x+2*TILE;b.y=v.y;const rnd=Math.random;let got;
  try{Math.random=()=>0;got=t.goblinRaid(b)}finally{Math.random=rnd}
  ok(got===v&&t.Timed.of(v).has('fear')&&t.foodStock(v)<f0,'a warband by '+v.name+' raids it: its workers run home, its food carried off ('+f0+' to '+t.foodStock(v)+')');
  try{Math.random=()=>0;got=t.goblinRaid(b)}finally{Math.random=rnd}ok(got===null,'and not again while it is still afraid')}
 // ---- the switch
 {const on=GB.on,n=t.bandits.length;let sites;try{GB.on=false;t.goblinsStart();t.goblinDay();sites=t.genSites()}finally{GB.on=on}
  ok(t.bandits.length===n&&!sites.some(s=>s.type==='goblins')&&sites.some(s=>s.type==='hideout'),'GOBLINS.on off: no camps placed, no warbands sent')}
 // ---- through a save
 {Kit.world();P.x=t.TOWNS[0].x;P.y=t.TOWNS[0].y+30;C[1].cleared=true;C[1].back=G.day+3;
  // (a save keeps a band's place to a tenth)
  const px=v=>Math.round(Math.round(v*10)/10),snap=()=>JSON.stringify([bands().map(b=>[px(b.x),px(b.y),b.size,b.camp,b.ld&&b.ld.name]),camps().map(s=>[s.name,s.tx,s.ty,s.cleared,s.back,s.ld&&s.ld.name])]);
  const s0=snap();t.saveGame(true,'quick');t.bandits.length=0;W.sites=[];t.loadGame('quick');
  ok(snap()===s0&&bands().every(b=>b instanceof t.GoblinBand)&&camps().every(s=>s instanceof t.GoblinCamp),'warbands and camps (cleared or not) come back from a save as they were, of their kinds')}
 // ---- drawn
 {Kit.world();const s=camps()[0];s.seen=true;P.x=s.x+40;P.y=s.y;t.frame();ok(!ERR.length,'drawn on the map without a fault')}
});
