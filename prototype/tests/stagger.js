'use strict';
// Staggering (gfx/stagger.js, physics.js physReel; the owner, 2026-11-03: a charge's impact "like stagger in more realistic way
// with slight push back", "at least 3-4 or more variations based on the unit"): knocked down, one of six ways by his build and his
// id; rocked by a throw that does not fell him, a lean back and a step back. All drawn only.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),random=Math.random;try{
 const S=t.STAGGER,St=t.Stagger;
 L.start({leftGroups:[{type:'militia',count:2}],rightGroups:[{type:'hum_guard',count:2}],morale:false,deploy:false,paused:true,ai:false,seed:4});const B=t.B,u=B.units[0],h=B.units.find(x=>x.type==='hum_guard');
 ok(S.on&&Object.values(S.ways).every(w=>Object.keys(w).length>=4),'each build its ways, four or more: '+Object.entries(S.ways).map(([k,w])=>k+' '+Object.keys(w).length).join(', '));
 // ======== the way he goes down: by build and id, kept for the one down, another next time
 {const pick=(x,n)=>{const r=new Set();for(let i=0;i<n;i++){x.id=1000+i;x.stgWay=null;x.downFor=1;x.down=1;r.add(St.way(x))}return r},id=u.id;
  const lw=pick(u,60),hw=pick(h,60);u.id=id;
  ok(lw.size>=4&&hw.size>=3,'militia go down '+lw.size+' ways ('+[...lw].join(', ')+'), plate guards '+hw.size+' ('+[...hw].join(', ')+')');
  ok([...hw].every(w=>w in S.ways.heavy)&&!hw.has('spin'),'the heavy never spun off their feet');
  u.stgWay=null;u.downFor=u.down=1;const w0=St.way(u);B.t+=.3;u.down=.7;ok(St.way(u)===w0,'the same way all through one down');
  const seen=new Set([w0]);for(let i=0;i<12;i++){B.t+=2;u.downFor=u.down=1;seen.add(St.way(u))}ok(seen.size>=2,'and not always the same the next time ('+[...seen].join(', ')+')');u.down=0}
 // ======== a throw: rocked back, a step back, then steady
 {Math.random=()=>{throw new Error('random')};const a=u.face<0?0:Math.PI;u.kx=u.ky=0;t.physThrow(u,a,t.PHYSICS.hit.down*t.physMass(u)*.8,false);Math.random=random;
  ok(u.reelAt===B.t&&u.reelK>.7,'a hard throw that does not fell him rocks him, no random draw');
  B.t+=.12;const r=St.reel(u);ok(r&&r.lean<0&&r.dx<0,'thrown from the front: leaning back ('+r.lean.toFixed(2)+'), a step back ('+r.dx+' px)');
  B.t+=1;ok(St.reel(u)===null,'then steady');
  u.reelAt=null;t.physThrow(u,a,t.PHYSICS.hit.down*t.physMass(u)*.1,false);ok(u.reelAt==null,'a light push does not rock him');
  t.physThrow(u,a+Math.PI,t.PHYSICS.hit.down*t.physMass(u)*.8,false);B.t+=.12;ok(St.reel(u).lean>0,'thrown from behind: pitched forward')}
 // ======== each way drawn through its fall, lying and getting up; the fight untouched
 {const cx=t.ctx;let bad=0;const dif=new Set();u.reelA=u.face<0?0:Math.PI;/* (thrown back, from the front) */
  try{for(const way of ['reel','back','face','spin','knee','sit']){const fr=[];
    for(const s of [0,.1,.2,.3,.5,.9,1.1,1.2]){cx.save();cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,64,64);u.stgWay=way;u.stgS=B.t-s;u.downFor=1.2;u.down=Math.max(.001,1.2-s);
      try{St.draw(u,t.downedOf(u),32,40)}catch(e){bad++;o.push('EXC '+way+' '+e.message)}fr.push(Array.from(cx.getImageData(0,0,64,64).data).join());cx.restore()}
    dif.add(fr[4])}}finally{u.down=0;u.stgWay=null}
  ok(!bad&&dif.size===6,'the six ways each drawn through the fall, lying, rising; each its own ('+dif.size+' different lying)');
  B.units[1].reelAt=B.t;B.units[1].reelK=1;B.units[1].reelA=Math.PI;for(let i=0;i<5;i++){B.t+=1/60;t.drawBattle()}
  u.down=u.downFor=1;for(let i=0;i<5;i++){B.t+=1/60;u.down-=1/60;t.drawBattle()}u.down=0;
  ok(!ERR.length,'a frame with a rocked man and a downed one draws'+(ERR.length?': '+ERR[0]:''))}
 L.exit();
 // ======== riders, beasts and monsters (the owner: "add all three")
 L.start({leftGroups:[{type:'hum_knight',count:2}],rightGroups:[{type:'wolf',count:2},{type:'boar',count:1},{type:'troll',count:1}],morale:false,deploy:false,paused:true,ai:false,seed:4});
 {const B=t.B,kn=B.units.find(x=>x.type==='hum_knight'),wf=B.units.find(x=>x.type==='wolf'),tr=B.units.find(x=>x.type==='troll'),bo=B.units.find(x=>x.type==='boar');
  const throwAt=(x,f)=>{x.reelAt=null;t.physThrow(x,x.face<0?0:Math.PI,t.PHYSICS.hit.down*f,false);B.t+=.1;return t.Stagger.reel(x)};
  {const r=throwAt(kn,2);ok(r&&r.lean<0,'a rider struck hard is rocked back in the saddle, his mount rearing ('+r.lean.toFixed(2)+')')}
  {const r=throwAt(tr,1.5);ok(r&&r.dx<0,'a troll never goes down, but a heavy blow makes it recoil, lurching back ('+r.dx+' px)');tr.reelAt=null;t.physThrow(tr,0,t.PHYSICS.hit.down*.3,false);ok(tr.reelAt==null,'a light one it shrugs off')}
  const ways=new Set();for(const x of [wf,bo])for(let i=0;i<40;i++){x.id=2000+i;x.stgWay=null;x.downFor=x.down=1;ways.add(St.way(x))}
  ok(['low','skid','tumble','roll'].every(w=>ways.has(w))&&[...ways].every(w=>w in S.beasts.light||w in S.beasts.mid),'a beast goes down its own ways: '+[...ways].join(', '));
  const cx=t.ctx,dif=new Set();let bad=0;wf.reelA=wf.face<0?0:Math.PI;
  for(const way of ['low','skid','tumble','roll']){const fr=[];for(const s of [0,.1,.2,.3,.5,.9,1.1]){cx.save();cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,64,64);wf.stgWay=way;wf.stgS=B.t-s;wf.downFor=1.2;wf.down=Math.max(.001,1.2-s);
    try{St.draw(wf,t.downedOf(wf),32,40)}catch(e){bad++;o.push('EXC '+way+' '+e.message)}fr.push(Array.from(cx.getImageData(0,0,64,64).data).join());cx.restore()}dif.add(fr[2])}
  wf.down=0;wf.stgWay=null;ok(!bad&&dif.size===4,'each drawn through its fall and up again; each its own ('+dif.size+' different mid-fall)');
  kn.reelAt=tr.reelAt=B.t;kn.reelK=tr.reelK=1;wf.down=wf.downFor=1;for(let i=0;i<5;i++){B.t+=1/60;wf.down-=1/60;t.drawBattle()}wf.down=0;
  ok(!ERR.length,'a frame with a rearing rider, a recoiling troll and a downed wolf draws'+(ERR.length?': '+ERR[0]:''))}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random;if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
