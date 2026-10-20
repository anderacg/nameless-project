'use strict';
// The named random streams (doc/STORY_DESIGN.md §3.7 and S4; core/rng.js): the story and the content that gets tuned often draw
// from streams of their own ('road', 'letters', 'incidents', 'quests', 'critters', 'monsters'), seeded from the world's seed, the
// game's number (drawn once from Math.random as a new game begins) and their names, saved, and started afresh by a new game; the
// world's simulation and the battles keep the shared Math.random.
//  (i)   content independence: a test-only encounter kind registered and one kind's weight changed (only in this page): the
//        world after some days of play, the shared Math.random's place and a battle fought then are the same; only the road's
//        stream (and the letters', which the road's messenger draws) went another way;
//  (ii)  the same game gives the same encounters and the same job offers;
//  (iii) a save and a load keep the game's number and continue every stream exactly;
//  (iv)  a new game starts every stream afresh: the same begin (Math.random seeded alike) the same streams, the wild game and the
//        beasts where they were; another begin (seeded otherwise, or not at all) its own number, other encounters, wild game and
//        beasts;
//  (v)   the estates' building choice draws its random keys before sorting: the same draws, and the same choices, whatever
//        order the sort compares in;
//  (vi)  your order for a new house says "Builders start on a new house" and answers true.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P;
 const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h.toString(16).padStart(8,'0')};
 const NAMES=['road','letters','incidents','quests','critters','monsters'];
 // the save as JSON (the quick slot): its time stamp, and the road's and the streams' pieces, left out
 const saveJson=()=>{G.mode='world';t.saveGame(true,'quick');const d=JSON.parse(localStorage.getItem(t.SAVE+'.quick'));delete d.at;delete d.world.road;delete d.world.rng;return JSON.stringify(d)};
 // a road over open grassland, far from the holdings and the sites (as tests/encounters.js finds one)
 Kit.begin('soldier',4242);
 const far=(tx,ty)=>t.TOWNS.every(z=>Math.hypot(z.tx-tx,z.ty-ty)>10)&&t.W.sites.every(s=>Math.hypot(s.tx-tx,s.ty-ty)>4);
 const around=(tx,ty,r,f)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(!f(t.tAt(tx+i,ty+j)))return false;return true};
 let spot=null;for(let ty=16;ty<t.MH-16&&!spot;ty++)for(let tx=16;tx<t.MW-16&&!spot;tx++)if(t.tAt(tx,ty)===t.T_ROAD&&far(tx,ty)&&around(tx,ty,4,x=>x===t.T_OPEN||x===t.T_ROAD)&&around(tx,ty,11,x=>t.passable(x)))spot={x:(tx+.5)*t.TILE,y:(ty+.5)*t.TILE};
 ok(!!spot,'a test spot: a road over open ground');
 // a battle on that road: a band of 5 against your band, 300 frames, every soldier's type, place and health hashed
 const battle=()=>{Kit.world();P.x=spot.x;P.y=spot.y;P.tx=P.ty=null;G.encCool=0;
  const b=t.asParty({kind:'bandits',troops:Array(5).fill('militia'),x:P.x+8,y:P.y,cool:0});t.bandits.push(b);
  t.startEncounter({kind:'party',ref:b,n:5,list:b.troops.slice(),band:'bandits'});t.act('fight');const B=t.B;if(!B)return 'none';
  for(let i=0;i<300&&t.B===B;i++)t.updateBattle(.05);
  return fnv(JSON.stringify(B.units.map(u=>[u.type,Math.round(u.x*100),Math.round(u.y*100),Math.round(u.hp*100)])))};
 /* a game played for DAYS days, you parked off the map (as tests/worldprint.js's W7: nothing meets you), and every 25 frames the
    road's hour rolled at the test spot (the pity timer full, the day's count and the last one cleared: as often as it comes),
    you put back after it: what came is kept, the world's own state is left as it was */
 const DAYS=4;
 const play=()=>{Kit.begin('soldier',4242);Kit.world();t.setSpeed(3);P.x=-999;P.y=-999;P.tx=P.ty=null;
  const picks=[],d0=G.day;
  for(let f=0;f<20000&&G.day<d0+DAYS;f++){
   t.updateWorld(.05);if(G.mode!=='world')Kit.world();
   if(f%25)continue;
   const at=[P.x,P.y],R=t.roadSt();P.x=spot.x;P.y=spot.y;R.c=1e6;R.n=0;R.on=[];
   const e=t.roadRoll();if(e)picks.push(e.k);
   R.on=[];P.x=at[0];P.y=at[1]}
  const world=fnv(saveJson()),rnd=Math.random(),states=t.Rng.states(),fight=battle();
  return {world,rnd,states,picks:picks.join(),battle:fight}};
 // ---- (i) content independence
 // (a battle fought first and thrown away: the page's first battle goes another way than the ones after it, whatever came before)
 battle();
 const A=play();
 t.defineKind('encounter','test_trader',{trigger:'travelHour',n:'Test trader',ico:'stall',w:6,ok:()=>true,on:'road',beh:'approach',
  scene:()=>[['walk','peddler',0,0]],text:()=>'A trader who comes only in the tests.',acts:t.Choice.list([])});
 const w0=t.ROAD_ENC.merchant.w;t.ROAD_ENC.merchant.w=5;
 const B=play(),C=play();
 t.ROAD_ENC.merchant.w=w0;
 info('the road without the test kind: '+A.picks);
 info('the road with it (and the merchant weighing 5): '+B.picks);
 const moved=NAMES.filter(n=>A.states[n]!==B.states[n]);
 ok(A.picks!==B.picks&&B.picks.split(',').includes('test_trader'),'a kind added and a weight changed: the road went another way ('+A.picks.split(',').length+' and '+B.picks.split(',').length+' came)');
 ok(moved.includes('road')&&moved.every(n=>n==='road'||n==='letters'),'only the road\'s stream moved (and the letters\', the messenger\'s): '+moved.join(', '));
 ok(A.world===B.world,'the world after '+DAYS+' days is the same ('+A.world+(A.world===B.world?'':' and '+B.world)+')');
 ok(A.rnd===B.rnd,'the shared Math.random is at the same place');
 ok(A.battle!=='none'&&A.battle===B.battle,'and a battle fought then goes the same ('+A.battle+(A.battle===B.battle?'':' and '+B.battle)+')');
 // ---- (ii) the same game, the same sequences (C: played again, as B)
 ok(C.picks===B.picks&&JSON.stringify(C.states)===JSON.stringify(B.states)&&C.world===B.world,'the same game again: the same encounters, in the same order ('+C.picks.split(',').length+')');
 const offers=()=>{Kit.begin('soldier',77);return JSON.stringify(t.TOWNS.slice(0,6).map(z=>t.jobsAt(z).map(q=>[q.type,q.n,q.good,q.mon,q.to,q.band])))};
 const o1=offers(),o2=offers();
 ok(o1===o2&&o1.length>20,'the same game again: the same job offers ('+o1.length+' chars)');
 // ---- (iii) a save and a load continue the streams
 {Kit.begin('soldier',7);Kit.world();t.jobsAt(t.TOWNS[0]);for(const n of NAMES)for(let i=0;i<3;i++)t.rngOf(n).next();
  t.saveGame(true,'quick');const saved=JSON.parse(localStorage.getItem(t.SAVE+'.quick')).world.rng,st=t.Rng.states(),game=t.Rng.game;
  const next=()=>NAMES.map(n=>[0,1,2,3,4].map(()=>t.rngOf(n).next()));
  const a=JSON.stringify(next());t.loadGame('quick');Kit.world();const g2=t.Rng.game,b=JSON.stringify(next());
  ok(saved&&game>0&&saved.game===game&&NAMES.every(n=>saved.on[n]===st[n])&&Object.keys(t.Saves.save()).pop()==='rng','the save keeps the game\'s number and every stream\'s state, last of the world\'s pieces');
  ok(g2===game&&a===b,'loaded, the same game\'s number, and every stream goes on exactly where it was saved')}
 // ---- (iv) a new game starts every stream afresh
 {Kit.begin('soldier',7);const first=t.Rng.states();for(const n of NAMES)t.rngOf(n).next();
  Kit.begin('soldier',7);const again=t.Rng.states();
  ok(JSON.stringify(first)===JSON.stringify(again)&&t.rngOf('road').state===t.Rng.seedOf('road'),'a new game: every stream from its seed again (the road\'s untouched by the new game; the wild game and beasts placed the same)')}
 // ---- (iv) each game its own number: the same begin the same streams, another its own
 {const W=t.W,wild=()=>JSON.stringify(W.critters.filter(c=>!c.home).map(c=>[c.id,c.x,c.y,c.n])),beasts=()=>JSON.stringify(W.monsters.map(m=>[m.id,m.x,m.y,m.n,m.lv]));
  const game=seed=>{if(seed==null){Kit.fresh();t.act('begin','soldier');G.quietEvents=true}else Kit.begin('soldier',seed);
   return {n:t.Rng.game,wild:wild(),beasts:beasts(),road:[0,1,2,3,4,5].map(()=>t.rngOf('road').next()).join()}};
  const a=game(21),b=game(21),c=game(22),r0=Math.random;Math.random=t.seeded(Date.now()%100000+5);let d;try{d=game(null)}finally{Math.random=r0}
  const same=(x,y)=>x.n===y.n&&x.wild===y.wild&&x.beasts===y.beasts&&x.road===y.road,apart=(x,y)=>x.n!==y.n&&x.wild!==y.wild&&x.beasts!==y.beasts&&x.road!==y.road;
  ok(same(a,b),'the same begin (Math.random seeded alike): the same game\'s number ('+a.n+'), wild game, beasts and encounters');
  ok(apart(a,c)&&apart(a,d)&&apart(c,d),'another begin (seeded otherwise, or not seeded): its own number ('+c.n+', '+d.n+'), and other wild game, beasts and encounters')}
 // ---- (v) the estates' random keys drawn before the sort
 {const day=sort=>{Kit.begin('soldier',11);const s0=Array.prototype.sort,r0=Math.random,r=t.seeded(99),out=[];let n=0;
   if(sort)Array.prototype.sort=function(cmp){if(!cmp)return s0.call(this);const a=this;for(let i=1;i<a.length;i++){const v=a[i];let j=i-1;while(j>=0&&cmp(a[j],v)>0){a[j+1]=a[j];j--}a[j+1]=v}return a};
   try{for(const z of t.TOWNS){if(z.owner==='player'||z.work)continue;let gate=true;Math.random=()=>{n++;if(gate){gate=false;return 0}return r()};t.Buildings.of(z).day();out.push(z.work?z.work.k:'-')}}
   finally{Math.random=r0;Array.prototype.sort=s0}
   return {n,out:out.join()}};
  const a=day(null),b=day(true);
  ok(a.n===b.n&&a.out===b.out&&/[a-z]/.test(a.out.replace(/-|,/g,'')),'the realms\' building choice: '+a.n+' draws and the same projects whichever way the sort compares ('+a.n+' and '+b.n+')')}
 // ---- (vi) your order for a new house
 {Kit.begin('soldier',3);Kit.world();let z=null,r=false;
  for(const h of t.TOWNS){if(!h.lots||!h.lots.length)continue;h.work=null;t.ensureEcon(h);h.stock.timber=50;h.stock.tools=10;P.gold=500;
   if(t.Buildings.of(h).house()===true){z=h;r=true;break}}
  const last=G.msgs[G.msgs.length-1];
  ok(r&&z.work&&z.work.k==='house'&&last&&last.m==='Builders start on a new house in '+z.name+'.','a new house ordered: "'+(last&&last.m)+'", and it answers true')}
});
