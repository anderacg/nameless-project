'use strict';
// Terrain phase 3 (battle/terrain.js sight; doc/TERRAIN_DESIGN.md §8): standing trees and cliff faces sorted by depth with the
// soldiers (render.js battleEnts) and faded only over your and your allies' men (propsInView); who sees whom (sightStep): the
// near rule (64 px, 96 from higher ground), striking or shooting gives one away for SIGHT.memory s, plateaus block lines of
// sight (riseBlocked, terrainBlocksView too); free fire skips the unseen (shooterTarget); an order at a target gone from sight
// goes to where it was last seen (sightGoal, lostStep); an ambush's shock once (ambushMul); terrain off: everyone seen.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,L=t.BattleLab,ev=s=>(0,eval)(s);try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
 const S=t.SIGHT,K=t.TKIND;
 const lab=(ground,extra)=>{G.mode='world';G.modal=false;if(L.active)L.exit();
  L.start({leftGroups:[{type:'hum_foot',count:6},{type:'hum_bow',count:4},{type:'hum_knight',count:4}],rightGroups:[{type:'hum_foot',count:6},{type:'hum_bow',count:4},{type:'hum_knight',count:4}],deploy:false,ai:false,paused:true,morale:true,seed:5,ground,...extra});
  const B=t.B;B.obs=[];return B};
 // ---- terrain off: nothing is hidden, nothing set
 ev('TERRAIN.on=false');{const B=lab('none',{terrain:'forest'});t.sightStep(true);t.updateBattle(1/60);
  ok(!B.terrain&&B.units.every(u=>u.hid===undefined&&u.ls===undefined&&t.seenBy(0,u)&&t.seenBy(1,u))&&t.visibleFoes(0).length===B.units.filter(u=>u.team===1&&u.hp>0).length,'terrain off: every soldier seen by both sides, no sight state set');
  const bow=B.units.find(u=>u.team===0&&u.s.range);ok(t.shooterTarget(bow)===t.nearest(bow)||t.shooterTarget(bow).team===1,'terrain off: free fire picks as ever');L.exit()}
 ev('TERRAIN.on=true');
 // ---- a field: a wood in the middle, a low hill west of it, a low hill just north of the wood
 const B=lab({hills:[{x:.2,y:.5,r:60,top:1},{x:.5,y:.2,r:44,top:1}],woods:[{x:.5,y:.55,r:80}],seed:3});const T2=B.terrain,cs=T2.cs,C=T2.C;
 const all=B.units,mine=all.filter(u=>u.team===0),theirs=all.filter(u=>u.team===1);
 const park=()=>{mine.forEach((u,i)=>{u.x=20+(i%4)*10;u.y=t.fieldBot()-10-Math.floor(i/4)*10});theirs.forEach((u,i)=>{u.x=t.BW-20-(i%4)*10;u.y=t.fieldBot()-10-Math.floor(i/4)*10});for(const u of all){u.rv=undefined;u.hid=0}};
 const cell=i=>({x:(i%C+.5)*cs,y:(Math.floor(i/C)+.5)*cs,i}),cells=f=>{const r=[];for(let i=0;i<C*T2.R;i++)if(f(i))r.push(cell(i));return r};
 const wood0=cells(i=>T2.kind[i]===K.wood&&T2.lvl[i]===0),open0=cells(i=>T2.kind[i]===0&&T2.lvl[i]===0&&T2.up[i]<0),high1=cells(i=>T2.lvl[i]===1&&T2.kind[i]===0);
 const at=(u,p,dx=0,dy=0)=>{u.x=p.x+dx;u.y=p.y+dy;return u};
 ok(wood0.length&&open0.length&&high1.length&&T2.shTop===1&&T2.lvlTop===1&&T2.hiSum[1]&&T2.hiSum[2],'the fixture: wood, open ground and a level-1 hill; sight heights indexed (shTop 1, sums for 1 and 2)');
 // ---- the near rule: 64 px; 96 from higher ground
 {park();const tgt=theirs[0],v=mine[0],w=wood0.find(p=>wood0.some(q=>Math.hypot(q.x-p.x,q.y-p.y)>40));at(tgt,w);
  at(v,w,0,63);t.sightStep(true);const a=t.seenBy(0,tgt);at(v,w,0,66);if(t.levelAt(v.x,v.y)>t.levelAt(tgt.x,tgt.y))at(v,w,0,-66);t.sightStep(true);const b=t.seenBy(0,tgt);
  ok(a&&!b&&!(tgt.hid&2)&&tgt.hid===1,'in a wood: seen by a soldier 63 px off, unseen at 66 px (hid bit 1<<0 set: '+tgt.hid+')');
  ok(t.visibleFoes(0).indexOf(tgt)<0&&t.visibleFoes(0).length===theirs.length-1&&t.seenBy(1,tgt),'visibleFoes(0) leaves him out; his own side sees him');
 // ---- the AI is bound by the same sight: the enemy captain (assess) and characters (charmind.js liveFoes) leave out your men hidden in a wood
 {park();const me=mine[0],w=wood0.find(p=>wood0.some(q=>Math.hypot(q.x-p.x,q.y-p.y)>40));at(me,w);t.sightStep(true);const f=t.assess(1).foes,lf=t.liveFoes(theirs[0]);
  ok(!t.seenBy(1,me)&&f.indexOf(me)<0&&f.length===mine.filter(u=>t.fighting(u)&&t.seenBy(1,u)).length&&lf.indexOf(me)<0,'your man hidden in a wood: not among the enemy captain’s foes (assess) nor a character’s (liveFoes)');
  at(theirs[0],w,0,30);t.sightStep(true);ok(t.seenBy(1,me)&&t.assess(1).foes.indexOf(me)>=0,'one of theirs 30 px off spots him: the captain counts him again')}
  // from higher ground: a pair of a wood cell and a level-1 cell 70-92 px apart, and a level-0 viewer as far off
  let pair=null;for(const p of wood0){const h=high1.find(q=>{const d=Math.hypot(q.x-p.x,q.y-p.y);return d>70&&d<92});const l=wood0.concat(open0).find(q=>{const d=Math.hypot(q.x-p.x,q.y-p.y);return d>70&&d<92&&t.levelAt(q.x,q.y)===0});if(h&&l){pair={p,h,l};break}}
  if(pair){park();at(tgt,pair.p);at(v,pair.h);t.sightStep(true);const hi=t.seenBy(0,tgt);at(v,pair.l);t.sightStep(true);const lo=t.seenBy(0,tgt);
   ok(hi&&!lo,'from higher ground a soldier '+Math.round(Math.hypot(pair.h.x-pair.p.x,pair.h.y-pair.p.y))+' px off spots one in a wood; from level ground as far off, no')}
  else ok(false,'no wood cell 70-92 px from the hill in the fixture')
  // struck or shot: seen at once, and for SIGHT.memory s
  park();at(tgt,w);t.sightStep(true);const h0=!t.seenBy(0,tgt);t.sightStruck(tgt,mine[3]);const s0=t.seenBy(0,tgt);B.t+=S.memory-.5;t.sightStep(true);const s1=t.seenBy(0,tgt);B.t+=1;t.sightStep(true);const s2=t.seenBy(0,tgt);
  ok(h0&&s0&&s1&&!s2,'striking or shooting gives him away at once and for '+S.memory+' s, then he is hidden again');
  // the attack path calls it: a blow struck reveals him
  park();at(tgt,w);t.sightStep(true);const h1=!t.seenBy(0,tgt);const vic=at(mine[1],w,0,8);tgt.hid=1;t.applyDmg(vic,1,1,null,tgt,false);ok(h1&&t.seenBy(0,tgt)&&tgt.rv&&tgt.rv[0]===B.t,'a blow landing (applyDmg) reveals the striker to the side he hit')}
 // ---- plateaus block lines of sight (and morale views)
 {park();let q=null;for(const a of open0){if(a.x>t.BW*.45)continue;for(const b of open0){if(b.x>t.BW*.45||Math.hypot(b.x-a.x,b.y-a.y)<130)continue;if(t.riseBlocked(T2,a.x,a.y,b.x,b.y)){q={a,b};break}}if(q)break}
  ok(!!q,'two open cells either side of the hill, 130+ px apart, with the rise between');
  if(q){const v=at(mine[0],q.a),tg=at(theirs[0],q.b);t.sightStep(true);const hid=!t.seenBy(0,tg),mv=t.terrainBlocksView(v,tg);at(v,high1[0]);t.sightStep(true);const fromTop=t.seenBy(0,tg);
   ok(hid&&mv&&fromTop,'raised ground between hides him (no soldier of ours near), blocks the morale view too; from the hilltop he is seen');
   ok(!t.riseBlocked(T2,q.a.x,q.a.y,q.a.x+8,q.a.y)&&t.terrainBlocksView(q.a,q.b)===t.riseBlocked(T2,q.a.x,q.a.y,q.b.x,q.b.y),'riseBlocked: next door never blocked; terrainBlocksView agrees across the rise');
   // a blocking kind (phase 4's mountains) just plugs in: TERRAIN_GROUND entry with blocks: true
   {const i=T2.kind.findIndex((k,j)=>k===0&&T2.lvl[j]===0&&Math.abs((j%C+.5)*cs-q.a.x)<4*cs&&Math.abs((Math.floor(j/C)+.5)*cs-q.a.y)<2*cs&&Math.hypot((j%C+.5)*cs-q.a.x,(Math.floor(j/C)+.5)*cs-q.a.y)>2*cs);
    const saveG=t.TGROUND[6];t.TGROUND[6]={n:'Rock',blocks:true};const k0=T2.kind[i];T2.kind[i]=6;t.terrainIndex(T2);const p=cell(i),far={x:p.x+(p.x-q.a.x)*3,y:p.y+(p.y-q.a.y)*3};
    const blk=T2.shTop===S.wall&&t.riseBlocked(T2,q.a.x,q.a.y,far.x,far.y);T2.kind[i]=k0;t.TGROUND[6]=saveG;t.terrainIndex(T2);ok(blk&&T2.shTop===1,'a kind with blocks: true (phase 4) hides whatever lies behind it, at any height')}}}
 // ---- free fire skips the unseen
 {park();const bow=mine.find(u=>u.s.range),w=wood0[Math.floor(wood0.length/2)],hid=at(theirs[0],w),vis=theirs[1];at(bow,w,-Math.min(bow.s.range*.6,140),0);
  at(vis,bow,Math.min(bow.s.range*.8,180),-90);at(mine.find(u=>u!==bow&&!u.s.range),vis,0,20);t.sightStep(true);
  const d=e=>Math.hypot(e.x-bow.x,e.y-bow.y),pick=t.shooterTarget(bow);
  ok(!t.seenBy(0,hid)&&t.seenBy(0,vis)&&d(hid)<d(vis)&&d(vis)<=bow.s.range&&pick===vis,'free fire: a nearer foe hidden in the wood is skipped for one in sight ('+Math.round(d(hid))+' px hidden, '+Math.round(d(vis))+' px seen)');
  theirs.slice(1).forEach(u=>{u.x=t.BW-20;u.y=t.fieldTop()+5});t.sightStep(true);const p2=t.shooterTarget(bow),m2=t.meleeTarget(mine[0]);ok(p2!==hid&&m2!==hid,'nor is he the fallback (nearest) of a shooter or a melee soldier')}
 // ---- an order at a target gone from sight: where it was last seen
 {park();const foeG=theirs[0].grp,fm=theirs.filter(u=>u.grp===foeG),myG=mine[0].grp,mm=mine.filter(u=>u.grp===myG),w=wood0[Math.floor(wood0.length/2)];
  fm.forEach((u,i)=>{u.x=t.BW*.5+(i%3)*10;u.y=t.fieldTop()+40+Math.floor(i/3)*10});const seenAt={x:fm.reduce((a,u)=>a+u.x,0)/fm.length,y:fm.reduce((a,u)=>a+u.y,0)/fm.length};t.sightStep(true);
  B.groups[myG].attack(fm[0]);fm.forEach((u,i)=>{u.x=w.x+(i%3)*6-6;u.y=w.y+Math.floor(i/3)*6});B.t+=1;t.sightStep(true);
  const g=B.groups[myG],lk=t.sightGoal(g,0),u=mm[0],d0=Math.hypot(u.x-lk.x-(u.sx||0),u.y-lk.y-(u.sy||0)),dTrue=Math.hypot(u.x-w.x,u.y-w.y);
  ok(fm.every(e=>!t.seenBy(0,e))&&lk&&Math.hypot(lk.x-seenAt.x,lk.y-seenAt.y)<1e-9,'sightGoal: an attack on a group gone from sight aims at where it was last seen');
  for(let k=0;k<20;k++)t.aiUnit(u,1/60,null);const d1=Math.hypot(u.x-lk.x-(u.sx||0),u.y-lk.y-(u.sy||0));
  ok(d1<d0&&!u.tgt&&g.hasTarget,'a soldier so ordered makes for that place, set on no one, the order kept ('+d0.toFixed(1)+' → '+d1.toFixed(1)+' px)');
  u.x=lk.x+(u.sx||0);u.y=lk.y+(u.sy||0);t.aiUnit(u,1/60,null);ok(!g.hasTarget&&g.order==='hold','there, with them still unseen, the order lapses: the group holds');
  // the player's order line shows the last known place (battlehud.js), no click finds them (commands.js)
  ok(!t.rtsUnitAt(fm[0].x,fm[0].y-6,1),'an unseen enemy is no one to click (rtsUnitAt)')}
 // ---- ambush: a hidden group's first charge shakes ×AMBUSH.shock, once
 {park();const cav=mine.filter(u=>u.s.charge),gk=cav[0].grp,foes=theirs.filter(u=>!u.s.range&&!u.s.charge),w=wood0[Math.floor(wood0.length/2)];
  cav.forEach((u,i)=>at(u,w,(i%2)*8,Math.floor(i/2)*8));t.sightStep(true);const hidden=cav.every(u=>!t.seenBy(1,u))&&B.terrain.sight.hid.get(gk)===B.t;
  const log=[],keep=t.shake;window.__shk=keep;window.__shl=log;ev('shake=function(u,n){__shl.push(n);return __shk(u,n)}');
  try{const hitOf=(u,e)=>{u.run=t.CHARGE.run;at(u,e,-8,0);e.mor=e.mor??50;return t.chargeMul(u,e)};
   const n0=log.length;hitOf(cav[0],foes[0]);hitOf(cav[1],foes[1]);B.t+=t.AMBUSH.burst+.1;hitOf(cav[2],foes[2]);
   const base=t.CHARGE.shock;const [a,b,c]=log.slice(n0);
   ok(hidden&&Math.abs(a-base*t.AMBUSH.shock)<1e-9&&Math.abs(b-base*t.AMBUSH.shock)<1e-9&&Math.abs(c-base)<1e-9,'ambush: a group unseen till its charge shakes ×'+t.AMBUSH.shock+' ('+a+', '+b+'), its line landing together; after '+t.AMBUSH.burst+' s, as ever ('+c+')');
   const C2=B.callouts;ok(C2&&C2.q.concat(C2.on).some(x=>x.text==='Ambush!'),'an "Ambush!" callout');
   // once a battle: hidden again, it charges with the plain shock
   park();cav.forEach((u,i)=>at(u,w,(i%2)*8,Math.floor(i/2)*8));t.sightStep(true);const n1=log.length;hitOf(cav[3],foes[3]);ok(Math.abs(log[n1]-base)<1e-9&&B.terrain.sight.hid.get(gk)===B.t,'the ambush is sprung once: hidden again, its next charge shakes as ever ('+log[n1]+')')}
  finally{ev('shake=__shk')}}
 // ---- depth: standing trees and cliff faces sorted with the soldiers; faded over yours only
 {park();if(!B.ground)B.ground=t.PX.battleGround({...B.terrain,climate:B.env.c,base:B.arena});const P=B.ground.props,trees=P.filter(p=>p.dk===1),soft=P.filter(p=>p.dk===2).length;
  // (its hills are climbable: smooth rises, no face props (the owner, 2026-10-18); a sheer hill's cliff faces put in among them)
  const T3=t.buildTerrain({explicit:{hills:[{x:.2,y:.5,r:60,cliff:true,ramps:[0]}],seed:3},W:t.BW,H:t.BH,top:t.fieldTop(),bot:t.fieldBot()}),faces=t.PX.battleGround({...T3,climate:B.env.c}).props.filter(p=>p.dk===2);
  P.push(...faces);P.sort((a,b)=>a.y-b.y||a.x-b.x);
  ok(trees.length>20&&soft===0&&faces.length>0&&trees.every(p=>p.s.width===32&&p.s.height===32&&p.box[3]<=p.y&&p.box[1]>=p.y-31),'the ground stands '+trees.length+' trees (32-px sprites, the trunk’s foot their y); its climbable hills no face ('+soft+': smooth rises), a sheer hill '+faces.length+' cliff-face sections');
  ok(P.every((p,i)=>!i||P[i-1].y<=p.y),'props come sorted by their feet');
  const tr=trees.find(p=>p.x>t.BW*.4&&p.x<t.BW*.6),tr2=trees.find(p=>Math.abs(p.x-tr.x)>60&&Math.abs(p.y-tr.y)>30),back=at(mine[0],{x:tr.x,y:tr.y-6}),front=at(mine[1],{x:tr.x+2,y:tr.y+5}),foe=at(theirs[0],{x:tr2.x,y:tr2.y-6});
  B.cam.z=t.camFit();t.camClamp();t.sightStep(true);
  const L1=t.battleEnts(),ix=x=>L1.indexOf(x);ok(ix(back)>=0&&ix(back)<ix(tr)&&ix(tr)<ix(front),'a soldier behind a tree (feet higher) is drawn before it, under its crown; one in front after it');
  ok(t.seenBy(0,foe)?ix(foe)<ix(tr2):ix(foe)<0,'an enemy behind a tree likewise (or not drawn at all while unseen)');
  for(const p of P)p.al=null;ev('PFT=0');t.propsInView([],0,0,t.BW,t.BH);
  ok(tr.al===t.PROPFADE.a&&tr2.al===1,'the tree over your man fades to '+t.PROPFADE.a+'; the one over the enemy stays solid ('+tr2.al+')');
  park();for(const p of P)p.al=null;ev('PFT=0');t.propsInView([],0,0,t.BW,t.BH);ok(P.every(p=>p.al===1),'with no one of yours behind them, none fades');
  const f=faces.sort((a,b)=>b.w-a.w)[0],cl=at(mine[2],{x:f.x,y:f.y-3}),ft=at(mine[3],{x:f.x,y:f.y+2});ev('PFT=0');const L2=t.battleEnts();
  ok(L2.indexOf(cl)<L2.indexOf(f)&&L2.indexOf(f)<L2.indexOf(ft)&&f.al===t.PROPFADE.a,'a cliff face: one behind its rim is drawn under it (it fades for him), one in front over it')}
 L.exit();ev('TERRAIN.on=false');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
