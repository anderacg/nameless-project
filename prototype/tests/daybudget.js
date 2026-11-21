'use strict';
// A live midnight yields between daily systems, then applies hours, without exposing a partly advanced world.
window.RUN=async()=>{const r=Kit.report(),t=T,S=t.Systems,L=t.LOADING,G=t.G;
 const old={phases:S.byPhase,sync:L.sync,slice:L.slice,hold:S.hold,raf:window.requestAnimationFrame,now:performance.now};
 try{
  Kit.begin('soldier',1);Kit.world();S.hold=null;
  const sequence=[],seen=[],start=performance.now();let clock=start;
  S.byPhase={...S.byPhase,day:[1,2,3].map(n=>({name:'test day '+n,day(){sequence.push('d'+n);seen.push(G.mode);clock+=3}})),hour:[{name:'test hour',hour(h){sequence.push('h'+h)}}]};
  performance.now=()=>clock;L.sync=false;L.slice=1;
  window.requestAnimationFrame=f=>setTimeout(()=>{clock+=1;f(clock)},0);
  G.day=4;G.clock=t.DAY-.001;
  const pending=t.Clock.advance(.002,true);
  r.ok(pending&&L.on&&G.mode==='loading'&&sequence.join()==='d1','the first daily system yields with input and simulation held by loading');
  await L.task;
  r.ok(sequence.join()==='d1,d2,d3,h0','every daily system runs once in order, and the midnight hour follows them');
  r.ok(G.day===5&&Math.abs(G.clock-.001)<1e-7&&G.mode==='world'&&!L.on,'the completed day restores the prior mode and preserves clock arithmetic');
  r.ok(seen.every(mode=>mode==='world'),'daily systems run in their original mode, including autosave eligibility');
  sequence.length=0;L.sync=true;G.clock=t.DAY-.001;
  t.Clock.advance(.002,true);
  r.ok(sequence.join()==='d1,d2,d3,h0'&&!L.on,'synchronous runs retain the exact daily and hourly order');
  sequence.length=0;L.sync=false;G.clock=t.DAY*23/24;
  t.Clock.passHours(2);
  r.ok(sequence.join()==='d1,d2,d3,h0,h1'&&!L.on,'explicit waits across midnight remain synchronous and cannot overlap daily transactions');
  sequence.length=0;G.clock=0;t.Clock.advance(t.DAY);
  r.ok(!L.on&&sequence.slice(0,3).join()==='d1,d2,d3','direct clock advances remain synchronous for bulk developer commands');
  sequence.length=0;G.clock=t.DAY-.001;G.paused=false;
  S.byPhase={...S.byPhase,frame:[{name:'test frame',frame(d,dt){sequence.push('frame');r.ok(dt===.05&&!L.on,'the interrupted world step resumes once, after the loading transaction releases')}}]};
  t.updateWorld(.05);await L.task;await Promise.resolve();
  r.ok(sequence.join()==='d1,d2,d3,h0,frame','midnight preserves the remainder of the world step after all daily and hourly systems');
  // Exercise the real autosave, including its asynchronous compression, from a daily slice.
  {const key=t.slotKey('auto'),previous=localStorage.getItem(key),gold=t.P.gold;
   try{G.paused=true;S.byPhase={day:[{name:'test income',day(){t.P.gold=gold+7}},S.list.find(s=>s.name==='autosave')],hour:[],frame:[]};
    G.clock=t.DAY-.001;t.Clock.advance(.002,true);await L.task;if(t.SAVING)await t.SAVING;
    const raw=localStorage.getItem(key),head=raw&&JSON.parse(raw),record=head?.z?JSON.parse(await t.gunzip64(head.z)):head;
    r.ok(record?.day===G.day&&record?.P.gold===gold+7&&record?.world.map.sum===t.WM.sum,'the real midnight autosave persists the advanced day, prior daily changes and the current world');
   }finally{t.P.gold=gold;if(previous===null)localStorage.removeItem(key);else localStorage.setItem(key,previous)}
  }


 }catch(e){r.exc(e)}finally{
  S.byPhase=old.phases;S.hold=old.hold;L.sync=old.sync;L.slice=old.slice;window.requestAnimationFrame=old.raf;performance.now=old.now;r.out();
 }
};
