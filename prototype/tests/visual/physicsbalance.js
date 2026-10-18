'use strict';
// Report, not a test (run by name: run-tests.ps1 -Suites visual/physicsbalance -Seed 0,1,10,11,...): AI-on-AI lab battles in the
// open, unit physics (battle/physics.js) off and on. The run's seed picks the matchup (seed / 10) and the switch (seed % 10: 0 off,
// 1 on); each matchup is fought on 8 battle seeds. The BAL lines never fail.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],q=new URLSearchParams(location.search),sd=+(q.get('seed')||0),on=sd%10===1,CAP=300;
 const Gp=(type,count,form)=>({type,count,...(form?{form}:{})});
 const SETS=[
  ['cavalry vs light foot',[Gp('hum_squire',10,'wedge')],[Gp('orc_grunt',22)]],
  ['cavalry vs braced spears',[Gp('hum_knight',10,'wedge')],[Gp('hum_spear',20)]],
  ['heavy vs light infantry',[Gp('hum_sergeant',14)],[Gp('orc_grunt',22)]],
  ['archers vs cavalry',[Gp('hum_bow',20)],[Gp('hum_squire',9)]],
  ['a troll vs a line',[Gp('troll',2)],[Gp('hum_foot',18)]],
  ['wolves vs foot',[Gp('wolf',14)],[Gp('hum_foot',12)]],
  ['knights vs militia',[Gp('hum_knight',8,'wedge')],[Gp('militia',24)]]];
 try{window.requestAnimationFrame=()=>0;(0,eval)('PHYSICS.on='+on);t.act('begin','soldier');t.G.quietEvents=true;t.GUIDE.on=false;
  const S=SETS[Math.floor(sd/10)];if(!S)throw Error('no matchup '+Math.floor(sd/10));const [name,left,right]=S,R=[];
  for(let seed=1;seed<=8;seed++){t.G.mode='world';t.G.modal=false;L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:true,seed,distance:500,ground:'none',terrain:'open',climate:'grass'});
   const B=t.B,n=[0,1].map(k=>B.units.filter(u=>u.team===k&&u.grp).length),downs=new Set();let braced=0,s=0;
   while(!L.session.result&&B.t<CAP&&s++<20000){L.step(15);for(const u of B.units)if(u.down>0)downs.add(u.id);braced+=B.floats.filter(f=>/^Braced/.test(f.t)&&!f.seen&&(f.seen=1)).length}
   const res=L.session.result,lost=k=>B.units.filter(u=>u.team===k&&u.grp&&u.hp<=0&&!u.left).length/n[k],fled=k=>B.units.filter(u=>u.team===k&&(u.left||u.rout&&u.hp>0)).length/n[k];
   R.push({res:res?(/Left/.test(res)?'L':'R'):'-',len:B.t,l0:lost(0),l1:lost(1),f0:fled(0),f1:fled(1),downs:downs.size,braced});L.exit()}
  const W=R.filter(r=>r.res==='L').length,U=R.filter(r=>r.res==='-').length,avg=k=>R.reduce((a,r)=>a+r[k],0)/R.length,pc=k=>(avg(k)*100).toFixed(0)+'%';
  o.push('BAL '+(on?'ON ':'OFF')+' '+name.padEnd(24)+' left wins '+W+'/8'+(U?' ('+U+' unfinished)':'')+'; '+avg('len').toFixed(0)+' s; left lost '+pc('l0')+' (ran '+pc('f0')+'), right lost '+pc('l1')+' (ran '+pc('f1')+'); knocked down '+avg('downs').toFixed(1)+', braced '+avg('braced').toFixed(1));
  o.push('INFO   '+R.map(r=>r.res+Math.round(r.len)).join(' '));
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
