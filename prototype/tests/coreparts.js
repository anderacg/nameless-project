'use strict';
// The core wave's K2 parts (doc/CORE_DESIGN.md): the clock reads the time in the old helpers' very arithmetic; timed states are
// a view over the saved fields (fear, hostility per realm, memory), changing nothing else; the world's bus; named random
// streams (seeded by the world and the name, their state kept); the spatial helper (nearest as the old nearestOf, ties and
// all; its grid answers as the full scan does). Written on the test kit (tests/kit.js).
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P,W=t.W,C=t.Clock,DAY=t.DAY,N=t.NIGHT_AT;Kit.begin();
 // ---- the clock: the old formulas, to the bit, over a day
 {let bad=[];for(let i=0;i<=480;i++){G.day=1+(i%7);G.clock=DAY*i/480;const tt=G.clock/DAY;
   const dark=tt<N?0:(n=>n<.2?n/.2:n>.8?(1-n)/.2:1)((tt-N)/(1-N));
   const part=tt<.07?'Dawn':tt<.25?'Morning':tt<.375?'Midday':tt<N?'Afternoon':tt<N+.1?'Dusk':tt<.9?'Night':'Before dawn';
   if(t.darkness()!==dark||t.timeOfDay()!==part||t.worldTime()!==G.day*DAY+G.clock||t.roadNow()!==G.day*24+G.clock/DAY*24||t.dayPart()!==tt||t.roadDay()!==(tt<N)||t.watchNow()!==(tt>=N?'night':'day'))bad.push(i)}
  ok(!bad.length,'darkness, timeOfDay, worldTime, roadNow, dayPart, roadDay and watchNow give what they always did, through the day'+(bad.length?': wrong at '+bad.slice(0,5).join(','):''))}
 G.day=121;G.clock=DAY*.25;ok(C.day===121&&C.hour===6&&!C.isNight&&C.part()==='Midday'&&C.year()===2&&C.dayOfYear()===1&&C.every(11)&&!C.every(7)&&C.daysSince(100)===21&&C.hoursSince(C.hours()-5)===5,'the clock: day, hour, night, the part of the day, the year (CLOCK.year '+t.CLOCK.year+' days), every n days, time since');
 G.day=5;G.clock=DAY*.9;C.passHours(4);ok(G.day===6&&Math.abs(G.clock-DAY*(.9+4/24-1))<1e-9,'passing the hours rolls the day over, as the road did (roadHours)');
 {const hs=[];t.Systems.add({name:'test-hours',order:{hour:1},hour:h=>hs.push(h)});G.day=2;G.clock=DAY*22.5/24;C.advance(DAY*.25/24);const a=hs.join();C.advance(DAY*.5/24);
  ok(a===''&&hs.join()==='23','each new hour runs Systems.hour once, with the hour of the day ('+hs.join()+')');C.advance(DAY*1.2/24);C.passHours(2.5);
  ok(G.day===3&&hs.join()==='23,0,1,2','over midnight (the day ticked first) and through a wait on the road ('+hs.join()+')')}
 // ---- timed states: a view over the saved fields
 {const ash=t.townBy('Ashford'),v=t.Timed.of(ash);ash.fear=0;G.day=10;
  ok(!v.has('fear')&&!t.until(ash,'fear'),'a holding not afraid');v.set('fear',3);ok(ash.fear===13&&v.has('fear')&&t.until(ash,'fear')&&v.daysLeft('fear')===3,'set: the end day in its own field (t.fear '+ash.fear+'), read by until as before');
  v.extend('fear',1);ok(ash.fear===13,'extend never shortens it');v.extend('fear',5);ok(ash.fear===15,'but lengthens it');
  let heard=null;v.onEnd=k=>heard=k;G.day=15;ok(!v.has('fear')&&v.daysLeft('fear')===0&&v.check(['fear']).join()==='fear'&&heard==='fear'&&ash.fear===15,'it runs out on its day, onEnd told (and the field left as it was)');v.onEnd=null;
  v.clear('fear');ok(ash.fear===0,'clear: back to 0, as the holdings keep it');
  P.hostile={};const h=t.Timed.of(P,'hostile');h.extend('vale',20);ok(P.hostile.vale===35&&t.hostileTo('vale'),'hostility per realm: P.hostile[fac], the end day, hostileTo reads it');
  h.clear('vale');ok(!('vale' in P.hostile)&&!t.hostileTo('vale'),'and clearing it deletes the entry, as signing on did');
  delete ash.mem;ok(!t.remembers(ash,{id:'x',k:'farm'})&&!('mem' in ash),'a holding with no memory of you has no mem field, even once asked');
  t.remember(ash,'farm',4);ok(ash.mem.farm===19&&t.remembers(ash,{id:'x',k:'farm'}),'remember: t.mem made when first set');delete ash.mem}
 // ---- the bus
 {const got=[],a=d=>got.push('a'+d.n),b=d=>got.push('b'+d.n);t.worldOn('test',a);t.worldOn('test',b);t.worldEmit('test',{n:1});t.worldOff('test',a);t.worldEmit('test',{n:2});t.worldEmit('nobody',{n:3});t.worldOff('test',b);
  ok(got.join()==='a1,b1,b2','the bus: listeners in the order they came, off when told, an unheard event a no-op ('+got.join()+')')}
 // ---- random streams
 {const R=t.Rng,r0=Math.random;let draws=0;Math.random=()=>{draws++;return r0()};
  try{R.reset();const a=t.rngOf('story'),xs=[a.next(),a.next(),a.next()],st=a.state,n4=a.next();R.reset();const b=t.rngOf('story');
   ok(b!==a&&[b.next(),b.next(),b.next()].join()===xs.join()&&xs.every(x=>x>=0&&x<1),'a stream is seeded by the world and its name: the same draws again');
   ok(t.rngOf('road').next()!==t.rngOf('quests').next(),'each name its own stream');
   const s=R.states();R.restore(s);ok(t.rngOf('story').state===s.story,'its state kept, and put back');
   R.restore({story:st});ok(t.rngOf('story').next()===n4,'restored, it goes on where it was');
   const c=t.rngOf('picks');let ints=new Set(),okp=true;for(let i=0;i<400;i++){const v=c.int(2,5);ints.add(v);if(['x','y'].indexOf(c.pick(['x','y']))<0)okp=false}
   const w={};for(let i=0;i<2000;i++){const k=c.weighted({a:3,b:1,z:0});w[k]=(w[k]||0)+1}
   ok([...ints].sort().join()==='2,3,4,5'&&okp&&!w.z&&w.a>w.b*2&&c.weighted({z:0})===null&&c.weighted([{n:'p',w:1}]).n==='p','int, pick and weighted ('+JSON.stringify(w)+')');
   ok(draws===0,'and none of it touches Math.random')}finally{Math.random=r0}}
 // ---- the spatial helper
 {const S=t.Spatial,TW=t.TOWNS,old=(o,list)=>{let b=null,bd=1e9;for(const z of list){const d=Math.hypot(z.x-o.x,z.y-o.y);if(d<bd){bd=d;b=z}}return b};
  let bad=0;const pts=[];for(let i=0;i<300;i++)pts.push({x:(i*7919%3584)+.5,y:(i*104729%2560)+.25});
  for(const p of pts){if(S.nearestHolding(p.x,p.y)!==old(p,TW)||t.nearestOf(p,TW)!==old(p,TW)||S.nearestHolding(p.x,p.y,z=>z.kind==='town')!==old(p,TW.filter(z=>z.kind==='town')))bad++}
  ok(!bad,'nearestHolding (and nearestOf) pick what the old scan picked, a filter as a filtered list, at 300 spots ('+bad+' differ)');
  const twins=[{x:10,y:0,n:1},{x:-10,y:0,n:2},{x:0,y:10,n:3}];ok(S.nearest(twins,0,0).n===1&&S.nearest(twins,0,0,z=>z.n>1).n===2,'a tie: the first in the list, as ever');
  const many=[];for(let i=0;i<900;i++)many.push({x:(i*37%1000)+((i*13)%7)*.5,y:(i*91%800),i});many.push({x:many[5].x,y:many[5].y,i:'dup'});
  const ix=S.index(many,64);let bi=0,bw=0;for(const p of pts.slice(0,120)){const q={x:p.x%1100-50,y:p.y%900-50};
   if(ix.nearest(q.x,q.y)!==S.nearest(many,q.x,q.y)||ix.nearest(q.x,q.y,z=>z.i%3===0)!==S.nearest(many,q.x,q.y,z=>z.i%3===0))bi++;
   const a=ix.within(q.x,q.y,90),b=S.within(many,q.x,q.y,90);if(a.length!==b.length||a.some((z,k)=>z!==b[k]))bw++}
  ok(!bi&&!bw,'the grid answers as the full scan does: the nearest (ties and filters too) and those within, in the list\'s order ('+bi+', '+bw+' differ)')}
 // ---- a day's work sliced (core/systems.js Systems.sliced, R12): off, all at once and then after(), as a plain loop; on (n), 1/n
 // of the list a frame (Systems.frame), after() once at the end, and what is left finished first by the next day or a save
 {const S=t.Systems,got=[],list=[1,2,3,4,5,6,7,8,9,10];let done=0;
  S.sliced(list,(x,i)=>got.push(x*10+i),()=>done++);ok(got.join()===list.map((x,i)=>x*10+i).join()&&done===1&&!S.slices.length,'sliced, off: every one at once, in order, then after() (as a plain loop)');
  got.length=0;done=0;S.sliceDay=4;try{
   S.sliced(list,x=>got.push(x),()=>done++);const n0=got.length;S.frame(0,0);const n1=got.length;S.frame(0,0);const n2=got.length;
   ok(n0===0&&n1===3&&n2===6&&!done,'sliced, on (4): none at once, then 3 a frame ('+[n0,n1,n2].join(', ')+')');
   S.frame(0,0);S.frame(0,0);ok(got.join()===list.join()&&done===1&&!S.slices.length,'and once all are done, after() once, in order');
   got.length=0;done=0;S.sliced(list,x=>got.push(x),()=>done++);S.frame(0,0);S.drain(true);ok(got.length===10&&done===1&&!S.slices.length,'what is left is finished at once by a new day or a save (drain)');
  }finally{S.sliceDay=0;S.slices=[]}}
 // ---- the kit itself
 {G.day=3;G.clock=DAY*.2;Kit.clear();G.encCool=1e9;Kit.world();const ash=Kit.goHome();ok(P.x===ash.x&&P.y===ash.y&&P.tx==null&&Kit.frames(3)===3,'the kit: home at Ashford\'s gate, frames');
  const n=Kit.travel(ash.x+48,ash.y+8,2000);ok(n>0&&Math.hypot(P.x-ash.x-48,P.y-ash.y-8)<4,'travel: there in '+n+' steps');
  ok(Kit.rolls([.1,.2],()=>[Math.random(),Math.random()]).join()==='0.1,0.2'&&Kit.stub(.5,()=>Math.random())===.5&&Kit.seeded(7,()=>Math.random())===t.seeded(7)(),'the dice: rolls, stub and seeded, put back after');
  const e=Kit.meet({kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,troops:['militia']}),list:['militia'],allies:[],foes:[]});ok(G.enc===e&&G.mode!=='world'&&Kit.text().length>0,'meet: a meeting opens its page ('+G.mode+')');t.act('flee');Kit.world()}
});
