'use strict';
// Unit physics (battle/physics.js, PHYSICS.on; the harness turns it off for every other suite): speed builds and falls at a
// kind's acceleration and braking, heading turns at its rate (riders slower, overshooting and wheeling round), a charge throws
// light men back and down (they get up), braced spears stop riders and hurt them, the heavy shove the light; nobody ends in rock
// or deep water on a rocky or river field, riders wheeling by a cliff still arrive, the AI still goes round a cliff by its ramp,
// withdraws and attack-moves; the same seed gives the same battle; reduced motion keeps the view still; and with it off, no
// physics code runs and the dice are drawn as before.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,L=t.BattleLab,ev=s=>(0,eval)(s);
 const PH=t.PHYSICS,Gp=(type,count,form)=>({type,count,...(form?{form}:{})});
 const lab=(left,right,x={})=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:false,morale:false,seed:7,...x});const B=t.B;B.obs=[];B.cmdT=1e9;return B};
 const place=(g,x,y,face)=>{if(face!=null)g.face=g.currentFacing=face;g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0);u.dir=u.hd=g.face;u.vel=0})};
 const mine=B=>B.groups[t.playerGroups()[0]],theirs=B=>Object.values(B.groups).find(q=>q.foe);
 const go=(B,s,watch,stop)=>{const end=B.t+s;while(B.t<end-1e-9){t.updateBattle(1/30);if(watch)watch();if(stop&&stop())break}};
 const mid=g=>{const m=g.units;return{x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length}};
 const still=g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999});
 try{t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;window.__cbo=t.checkBattleOver;ev('checkBattleOver=()=>{}');
  // ======== switch off: no physics code runs, the dice are drawn as before (the page's first battle warms it up: not compared)
  {const names=['physGo','physAct','physDown','physRout','physImpact','physBraced','physBlow','physShare','physPost','physFeel','physMass','physKind','physRng','physSpeed','physBacked','physThrow','physLean','physDownPose'];
   const run=stub=>{const keep={};if(stub)for(const n of names){keep[n]=ev(n);ev(n+'=()=>{throw Error("physics ran with PHYSICS.on false: '+n+'")}')}
    let n=0;const R0=Math.random;try{PH.on=false;const B=lab([Gp('hum_knight',6,'wedge'),Gp('hum_spear',8),Gp('hum_bow',6)],[Gp('hum_levy',10),Gp('orc_brute',8),Gp('troll',1)],{ai:true,morale:true});const R1=Math.random;Math.random=()=>{n++;return R1()};
     go(B,30);let h=0;for(const u of B.units)h=Math.imul(h^Math.round(u.x*100)^Math.round(u.y*100)^Math.round(u.hp*10),2654435761)>>>0;Math.random=R1;return{n,h,live:B.units.filter(u=>u.hp>0).length}}
    finally{Math.random=R0;for(const k in keep)ev(k+'=keep_'+k)}};
   for(const n of names)window['keep_'+n]=ev(n);
   let a=null,b=null,err='';try{run(false);a=run(false);b=run(true)}catch(e){err=e.message}
   ok(!err&&a&&b&&a.n===b.n&&a.h===b.h&&a.n>100,'switch off: a 30 s AI battle draws Math.random '+(a&&a.n)+' times, the same with every physics function made to throw ('+(b&&b.n)+'), the field the same ('+(a&&a.h.toString(16))+' / '+(b&&b.h.toString(16))+')'+(err?': '+err:''));
   for(const n of names)delete window['keep_'+n];PH.on=true}
  ok(PH.on&&PH.mass&&PH.kinds.cav.acc<PH.kinds.foot.acc&&PH.kinds.cav.turn<PH.kinds.foot.turn&&PH.hit.down>0,'the tunables in one table: mass, acceleration, braking and turning by kind, impact');
  {const B=lab([Gp('hum_levy',1),Gp('hum_guard',1),Gp('hum_knight',1)],[Gp('wolf',1),Gp('troll',1),Gp('dragon',1)]),m=k=>t.physMass(B.units.find(u=>u.type===k));
   ok(m('wolf')<m('hum_levy')&&m('hum_levy')<m('hum_guard')&&m('hum_guard')<m('hum_knight')&&m('hum_knight')<m('troll')&&m('troll')<m('dragon'),'mass: a wolf '+m('wolf')+' < a levy '+m('hum_levy')+' < a shield guard (plate) '+m('hum_guard').toFixed(2)+' < a knight and horse '+m('hum_knight').toFixed(2)+' < a troll '+m('troll')+' < the dragon '+m('dragon'))}
  // ======== speeding up takes time, stopping takes distance; riders more of both
  const runUp=type=>{const B=lab([Gp(type,1)],[Gp('hum_levy',1)]),g=mine(B),u=g.units[0];still(theirs(B));place(g,200,300,0);place(theirs(B),1100,600);g.moveTo(1000,300,{run:true});
   let t90=null,x90=0;go(B,6,()=>{if(t90==null&&u.vel>=u.s.spd*.9){t90=B.t;x90=u.x-200}},()=>t90!=null&&B.t>t90+.5);
   const v0=u.vel,x0=u.x;g.moveTo(u.x,u.y,{run:true});g.hold();let stop=0,end=false;go(B,6,()=>{stop=Math.max(stop,u.x-x0);if(u.vel<.5)end=true},()=>end);return{t90,x90,v0,stop}};
  {const f=runUp('hum_levy'),h=runUp('hum_guard'),c=runUp('hum_knight');
   ok(f.t90>.1&&h.t90>f.t90&&c.t90>h.t90&&c.x90>25,'from rest to 90% of top speed: a levy '+f.t90.toFixed(2)+' s, a shield guard (heavy) '+h.t90.toFixed(2)+' s, a knight '+c.t90.toFixed(2)+' s over '+Math.round(c.x90)+' px (a run-up)');
   ok(c.stop>15&&c.stop>f.stop*3&&f.stop>0,'told to stop at full speed: a knight runs on '+Math.round(c.stop)+' px (and comes back to his place), a levy '+f.stop.toFixed(1)+' px')}
  // ======== riders overshoot and wheel round, then arrive
  {const B=lab([Gp('hum_knight',1)],[Gp('hum_levy',1)]),g=mine(B),u=g.units[0];still(theirs(B));place(g,200,300,0);place(theirs(B),1100,600);g.moveTo(1000,300,{run:true});
   go(B,6,null,()=>u.x>420&&u.vel>u.s.spd*.95);const turnX=u.x,goal={x:turnX-40,y:330};g.moveTo(goal.x,goal.y,{run:true});let far=0,side=0,at=null;
   go(B,15,()=>{far=Math.max(far,u.x-turnX);side=Math.max(side,Math.abs(u.y-300));if(at==null&&Math.hypot(u.x-goal.x,u.y-goal.y)<8&&u.vel<2)at=B.t},()=>at!=null);
   ok(far>15&&side>8&&at!=null,'a knight at the gallop sent to a place 40 px behind him: he runs on '+Math.round(far)+' px, wheels round wide ('+Math.round(side)+' px off his line) and arrives'+(at!=null?'':' (never)'))}
  // ======== turning takes time, slower for riders; the side a blow lands on follows the heading
  const turn=type=>{const B=lab([Gp(type,1)],[Gp('hum_levy',1)]),g=mine(B);still(theirs(B));place(g,300,300,0);place(theirs(B),1100,600);go(B,.5);g.setForm('line',{face:Math.PI/2});let T=null;const t0=B.t;
   go(B,6,()=>{if(T==null&&g.units.every(u=>Math.abs(Math.atan2(Math.sin(t.facing(u)-Math.PI/2),Math.cos(t.facing(u)-Math.PI/2)))<.1))T=B.t-t0},()=>T!=null);return T};
  {const f=turn('hum_foot'),c=turn('hum_knight');ok(f!=null&&c!=null&&f>.12&&c>f*1.3,'ordered to face its flank, a man turns in time (and the side he is struck on with him): foot '+(f&&f.toFixed(2))+' s, knights '+(c&&c.toFixed(2))+' s')}
  // ======== a charge into light foot: thrown back and down, then up again
  const charge=(foe,form,seed=7)=>{const B=lab([Gp('hum_knight',8,'wedge')],[Gp(foe,10)],{seed}),g=mine(B),e=theirs(B);place(g,300,300,0);place(e,560,300,Math.PI);e.files=10;t.layForm(e.id);e.units.forEach(u=>{u.x=e.ax+u.sx;u.y=e.ay+u.sy});
   e.units.forEach(u=>{u.cd=999;u.hp=u.max=400});g.attack(e.units[0],{run:true});const R={down:new Set(),up:0,kb:0,rv:[],hurt:0,hp0:g.units.reduce((a,u)=>a+u.hp,0),braced:0,impact:null,v:null};
   go(B,4,()=>{for(const u of e.units){if(u.down>0)R.down.add(u.id);R.kb=Math.max(R.kb,Math.hypot(u.kx||0,u.ky||0))}if(B.floats.some(f=>f.t==='Braced!'))R.braced++;
    if(R.impact==null&&B.units.some(u=>u.team===0&&u.atkAt!=null)){R.impact=B.t;R.v=g.units.map(u=>u.vel)}});
   g.units.forEach(u=>u.cd=1e9);go(B,PH.hit.downMax+.2);
   R.up=[...R.down].filter(id=>{const u=e.units.find(q=>q.id===id);return u&&!(u.down>0)}).length;R.hurt=R.hp0-g.units.reduce((a,u)=>a+u.hp,0);R.B=B;R.g=g;R.e=e;return R};
  {const r=charge('militia');ok(r.down.size>=2&&r.kb>PH.hit.down&&r.up===r.down.size,'knights charging militia: thrown back (up to '+Math.round(r.kb)+' px/s), '+r.down.size+' knocked down, all of them up again after');
   const w=charge('hum_guard');ok(w.down.size<r.down.size,'heavy shield guards (plate, backed by their ranks) absorb it: '+w.down.size+' down, against '+r.down.size+' militia')}
  // ======== braced spears stop the charge dead and hurt the riders
  {const r=charge('hum_spear');const B=r.B;let v=null;
   ok(r.braced>0&&r.hurt>0&&r.down.size===0,'knights into braced spears: "Braced!", none of the spears down, the riders hurt ('+Math.round(r.hurt)+' hp)');
   const B2=lab([Gp('hum_knight',1)],[Gp('hum_spear',1)]),g=mine(B2),e=theirs(B2),u=g.units[0],s=e.units[0];place(g,300,300,0);place(e,420,300,Math.PI);s.cd=999;g.attack(s,{run:true});let at=null,vb=0,hp0=u.hp;
   go(B2,4,()=>{if(at==null&&u.atkAt!=null){at=B2.t;vb=Math.max(vb,u.vel)}},()=>at!=null&&B2.t>at+.05);ok(at!=null&&u.vel<1&&u.hp<hp0,'one knight at a braced spearman: stopped dead at the blow ('+u.vel.toFixed(1)+' px/s after), hurt '+Math.round(hp0-u.hp)+' hp')}
  // ======== the heavy shove the light; a troll ploughs through a line
  {const B=lab([Gp('dw_longbeard',1)],[Gp('hum_levy',1)]),a=mine(B).units[0],b=theirs(B).units[0];still(mine(B));still(theirs(B));a.x=400;a.y=300;b.x=404;b.y=300;
   const ax=a.x,bx=b.x;t.jostle(1/30);ok(bx-b.x<0&&Math.abs(b.x-bx)>Math.abs(a.x-ax)*1.4,'a jostled pair: the longbeard (plate) gives '+Math.abs(a.x-ax).toFixed(2)+' px, the levy '+Math.abs(b.x-bx).toFixed(2)+' px')}
  {const B=lab([Gp('hum_levy',16)],[Gp('troll',1)]),g=mine(B),e=theirs(B),tr=e.units[0];place(g,500,300,Math.PI);g.files=16;t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy;u.cd=999});
   place(e,700,300,Math.PI);tr.cd=999;tr.hp=tr.max=1e5;e.moveTo(300,300,{run:true});go(B,10,null,()=>tr.x<440);ok(tr.x<450,'a troll walks into a line of levies and through it (at x '+Math.round(tr.x)+', the line at 500)')}
  // ======== deterministic: the same seed twice
  {const fp=r=>{let h=0;for(const u of r.B.units)h=Math.imul(h^Math.round(u.x*100)^Math.round(u.y*100)^Math.round(u.hp*10),2654435761)>>>0;return h.toString(16)};const a=fp(charge('militia',null,11)),b=fp(charge('militia',null,11));ok(a===b,'the same seed twice, the same charge to the pixel ('+a+')')}
  {const run=()=>{const B=lab([Gp('hum_foot',12),Gp('hum_knight',6,'wedge')],[Gp('orc_grunt',14),Gp('wolf',6)],{ai:true,morale:true,seed:5});go(B,40);let h=0;for(const u of B.units)h=Math.imul(h^Math.round(u.x*100)^Math.round(u.y*100)^Math.round(u.hp*10)^(u.rout?7:0),2654435761)>>>0;return h.toString(16)+' '+B.units.filter(u=>u.rout).length+' routing'};
   const a=run(),b=run();ok(a===b,'an AI battle with routs, the same seed twice: the same field after 40 s ('+a+')')}
  // ======== the ground still holds: nobody in rock or deep water after a minute of battle on a rocky and a river field
  const TR0=ev('TERRAIN.on');ev('TERRAIN.on=true');
  const bad=(T,u)=>{const i=t.tIx(T,u.x,u.y);return T.solid[i]===1||T.kind[i]===t.TKIND.deep};
  for(const [n,ground] of [['crags',{recipe:'crags',seed:9}],['a river',{recipe:'river',seed:4}]]){
   const B=lab([Gp('hum_foot',14),Gp('hum_knight',6,'wedge'),Gp('hum_bow',8)],[Gp('orc_grunt',14),Gp('orc_wolf',6),Gp('troll',1)],{ai:true,morale:true,seed:3,ground,distance:500}),T=B.terrain,was=new Map(),downs=new Set();let into=0,end=B.t+60,frames=0;
   for(const u of B.units)was.set(u,bad(T,u));
   while(B.t<end&&!L.session.result){L.step(6);frames++;for(const u of B.units){if(u.hp<=0)continue;if(u.down>0)downs.add(u.id);const b=bad(T,u);if(b&&!was.get(u))into++;was.set(u,b)}}
   ok(T.blocky&&into===0,'a minute of AI battle on '+n+' ('+downs.size+' knocked down in it): nobody stepped, slid or was thrown into rock or deep water ('+into+')')}
  // ======== riders wheeling by a cliff: they still get there
  {const B=lab([Gp('hum_knight',4)],[Gp('hum_levy',1)],{ground:{hills:[{x:.5,y:.5,r:110,top:1,cliff:true,ramps:[180]}],woods:[],seed:3}}),T=B.terrain,h=T.recipe.hills[0],g=mine(B),u0=g.units[0];still(theirs(B));place(theirs(B),40,t.fieldTop()+10);
   place(g,h.x+h.rx+22,h.y+60,-Math.PI/2);g.moveTo(h.x+h.rx+22,h.y-90,{run:true});go(B,8,null,()=>g.units.every(u=>u.vel>u.s.spd*.8)&&u0.y<h.y);
   const goal={x:h.x+h.rx+22,y:u0.y+40};g.moveTo(goal.x,goal.y,{run:true});let far=0,at=null;const y0=u0.y;go(B,25,()=>{far=Math.max(far,y0-u0.y);if(at==null&&g.units.every(u=>u.mvId===g.mvId)&&Math.hypot(g.centre().x-goal.x,g.centre().y-goal.y)<14)at=B.t},()=>at!=null);
   ok(far>10&&at!=null,'knights galloping along a cliff\'s foot, sent back 40 px: they run on '+Math.round(far)+' px, wheel round by the rock and get there'+(at!=null?'':' (never)'));
   const top={x:h.x,y:h.y};g.moveTo(top.x,top.y,{run:true});let up=null;go(B,40,()=>{if(up==null&&g.units.filter(u=>t.levelAt(u.x,u.y)>=1).length>=3)up=B.t},()=>up!=null);
   ok(up!=null,'then sent up onto the top: round to its ramp and up at the gallop'+(up!=null?' ('+Math.round(up-B.t+B.t)+' s)':' (never)'))}
  // ======== the ground: woods slow his top speed and his getting going alike (groundMul), as at once before
  {const B=lab([Gp('hum_foot',1)],[Gp('hum_levy',1)],{ground:{hills:[],woods:[{x:.5,y:.5,r:120}],seed:3}}),g=mine(B),u=g.units[0],W=t.TERRAIN_GROUND.wood.spd.foot;still(theirs(B));place(theirs(B),40,t.fieldTop()+10);
   const top=(x)=>{place(g,x,300,0);g.moveTo(x+400,300,{run:true});let v=0;go(B,2.5,()=>{v=Math.max(v,u.vel)});return{v,k:t.groundAt(u.x,u.y)}};const cx=t.BW/2,o0=top(80),w0=top(cx-40);
   ok(o0.k!==t.TKIND.wood&&w0.k===t.TKIND.wood&&Math.abs(w0.v/o0.v-W)<.02,'running in woods he tops out at ×'+(w0.v/o0.v).toFixed(2)+' of his speed in the open (woods ×'+W+')')}
  // ======== the charge bonus is the old one, by the speed he still has (never counted twice)
  {const B=lab([Gp('hum_knight',1)],[Gp('militia',1)]),k=mine(B).units[0],f=theirs(B).units[0];k.x=400;k.y=300;f.x=414;f.y=300;f.dir=f.hd=Math.PI;f.face=-1;k.hd=0;
   const mul=v=>{k.run=t.CHARGE.run;k.vel=v;k.sta=100;f.kx=f.ky=0;f.down=0;return t.chargeMul(k,f)},full=mul(k.s.spd),half=mul(k.s.spd/2),slow=mul(k.s.spd*.1);
   ok(Math.abs(full-(1+t.CHARGE.cav))<1e-9&&Math.abs(half-(1+t.CHARGE.cav*.5))<1e-9&&slow===1,'a full run at full speed: ×'+full.toFixed(2)+' (CHARGE.cav, as before); slowed to half: ×'+half.toFixed(2)+'; nearly stopped: no charge (×'+slow+')')}
  // ======== the AI still goes round a cliff by its ramp (aiterrain), withdraws (withdrawal) and attack-moves (attackmove)
  {const arm=[Gp('hum_foot',20),Gp('hum_bow',12),Gp('hum_knight',6,'wedge')],B=lab(arm,arm,{ground:{hills:[{x:.5,y:.5,r:110,top:1,cliff:true,ramps:[180]}],woods:[],seed:3},morale:false,ai:false}),h=B.terrain.recipe.hills[0];
   const mg=t.playerGroups().map(id=>B.groups[id]),fg=Object.values(B.groups).filter(q=>q.foe),at=[[h.x+20,h.y],[h.x-25,h.y-20],[h.x-30,h.y+30]];
   mg.forEach((g,i)=>{place(g,at[i][0],at[i][1]);g.units.forEach(u=>{u.s={...u.s,spd:0};u.hp=u.max=u.max*3})});fg.forEach((g,i)=>place(g,t.BW-120,h.y-80+i*80,Math.PI));B.cmdT=0;
   ev('checkBattleOver=__cbo');let first=null,s=0;while(!L.session.result&&B.t<300&&s++<4000){L.step(30);if(first==null&&B.units.some(u=>u.team===1&&u.hp>0&&t.levelAt(u.x,u.y)>=1))first=B.t}
   ok(first!=null&&first<45&&!!L.session.result,'your army on a sheer top, the AI attacking: round by the ramp, its first man up at '+(first!=null?Math.round(first)+' s':'never')+', '+(L.session.result||'unfinished at '+Math.round(B.t)+' s'));ev('checkBattleOver=()=>{}')}
  ev('TERRAIN.on='+TR0);
  {const B=lab([Gp('hum_foot',10),Gp('hum_knight',6)],[Gp('orc_grunt',12)],{morale:false}),mg=t.playerGroups().map(id=>B.groups[id]),e=theirs(B);mg.forEach((g,i)=>place(g,520,240+i*120,0));place(e,600,300,Math.PI);e.charge({run:true});go(B,3);
   mg.forEach(g=>g.withdraw());go(B,60,null,()=>B.units.every(u=>u.team!==0||u.hp<=0||u.left));const out=B.units.filter(u=>u.team===0&&u.left).length,n=B.units.filter(u=>u.team===0&&u.grp&&!u.hero).length;
   ok(out>=n*.6&&B.units.every(u=>u.team!==0||u.hp<=0||u.left),'in melee, foot and riders withdraw: off the field by their edge, '+out+' of '+n+' got away, none left standing on it')}
  {const B=lab([Gp('hum_spear',12)],[Gp('hum_levy',6)]),g=mine(B),e=theirs(B);place(g,150,300,0);place(e,430,360,Math.PI);e.units.forEach(u=>{u.s={...u.s,spd:0};u.hp=u.max=6});B.sel=g.id;const goal={x:700,y:300};
   g.attackMove(goal.x,goal.y);let engaged=false;go(B,60,()=>{if(g.hasTarget&&g.amove&&g.amove.at)engaged=true},()=>!g.amove&&Math.hypot(g.centre().x-goal.x,g.centre().y-goal.y)<20);
   ok(engaged&&!e.units.length&&!g.amove&&Math.hypot(g.centre().x-goal.x,g.centre().y-goal.y)<20,'an attack-move past a foe: it turns on him, beats him, marches on and arrives ('+B.t.toFixed(1)+' s)')}
  // ======== reduced motion: no jolt of the view
  {const mm=window.matchMedia;window.matchMedia=q=>({matches:/reduce/.test(q),media:q,addListener(){},removeListener(){}});let jolt=0,view=0;
   try{const r=charge('militia');jolt=r.B.jolt?r.B.jolt.a:0;view=t.shakeView(true)?1:0}finally{window.matchMedia=mm}
   const r=charge('militia');ok(t.reducedMotion&&!jolt&&!view&&r.B.jolt&&r.B.jolt.a>0,'a big charge jolts the view ('+(r.B.jolt?r.B.jolt.a.toFixed(1):0)+' px), never with reduced motion asked for')}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(window.__cbo)ev('checkBattleOver=__cbo');if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
