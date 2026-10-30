'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Fog of war in battle (battle/battlefog.js; terrain.js sightStep): a side sees an enemy only within its soldiers' sight ranges
// (FOG: foot, shooters, riders, characters; big ones from farther; more from higher ground) with a clear line (rises and rock
// block it), woods keep their own rule, a blow or shot gives the striker away; the AI's foes are only those it sees; ghosts
// where enemy groups were last seen; the overlay, its drifting mist (gfx/mist.js) and the small map; the Settings toggle; none
// in tournaments, sieges and raids; the harness's switch; a whole AI-on-AI battle in the fog; no Math.random in the sight code. INFO: its cost, by soldiers.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,L=t.BattleLab,ev=s=>(0,eval)(s),F=t.FOG;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
 // ---- the harness's switch: off, a battle has no fog and sets no sight state
 const lab=(cfg)=>{G.mode='world';G.modal=false;if(L.active)L.exit();
  L.start({leftGroups:[{type:'hum_foot',count:6},{type:'hum_bow',count:4},{type:'hum_knight',count:4}],rightGroups:[{type:'hum_foot',count:6},{type:'troll',count:1}],deploy:false,ai:false,paused:true,morale:true,seed:5,ground:'none',...cfg});
  const B=t.B;B.obs=[];return B};
 ok(F.on===false,'the harness turns the fog off (FOG.on '+F.on+')');
 {const B=lab({});t.sightStep(true);t.updateBattle(1/60);ok(!B.fog&&!B.sight&&B.units.every(u=>u.hid===undefined&&t.seenBy(0,u)&&t.seenBy(1,u)),'fog off (and no terrain): every soldier seen, no sight state')}
 // ---- ranges by kind, at cell middles (FOG.cell px)
 let B=lab({fog:true});const cs=F.cell,mid=v=>(Math.floor(v/cs)+.5)*cs,Y=mid((t.fieldTop()+t.fieldBot())/2);
 ok(B.fog&&B.sight&&B.sight.fog,'the lab\'s fog key turns it on (B.fog, its grid of '+cs+'-px cells); BW '+t.BW);
 const all=B.units,mine=all.filter(u=>u.team===0),theirs=all.filter(u=>u.team===1);
 const park=()=>{mine.forEach((u,i)=>{u.x=mid(24+(i%3)*16);u.y=mid(t.fieldTop()+20+Math.floor(i/3)*16)});theirs.forEach((u,i)=>{u.x=mid(t.BW-24-(i%3)*16);u.y=mid(t.fieldTop()+20+Math.floor(i/3)*16)});for(const u of all){u.rv=undefined;u.hid=0}};
 const X0=mid(t.BW*.35),see=(v,tg,cells,dy=0)=>{park();v.x=X0;v.y=Y;tg.x=X0+cells*cs;tg.y=Y+dy*cs;t.sightStep(true);return t.seenBy(v.team,tg)};
 const foot=mine.find(u=>u.type==='hum_foot'),bow=mine.find(u=>u.type==='hum_bow'),knight=mine.find(u=>u.type==='hum_knight'),tgt=theirs.find(u=>u.type==='hum_foot'),troll=theirs.find(u=>u.s.big);
 ok(t.fogRange(foot)===F.foot&&t.fogRange(bow)===F.shoot&&t.fogRange(knight)===F.mounted&&t.fogRange({hero:true,s:{}})===F.char,'sight by kind: foot '+F.foot+', shooters '+F.shoot+', riders '+F.mounted+', characters '+F.char+' px');
 for(const [v,R,n] of [[foot,F.foot,'foot'],[bow,F.shoot,'a bowman'],[knight,F.mounted,'a knight']]){const a=Math.floor(R/cs),inn=see(v,tgt,a),out=see(v,tgt,a+1);
  ok(inn&&!out,n+' sees a foe '+a*cs+' px off, not '+(a+1)*cs+' (range '+R+')')}
 {const a=Math.floor(F.foot*F.big/cs),inn=see(foot,troll,a),out=see(foot,troll,a+1),plain=see(foot,tgt,a);
  ok(troll&&inn&&!out&&!plain,'a big one (troll) is seen from ×'+F.big+' farther: '+a*cs+' px yes, '+(a+1)*cs+' no (a man there unseen)')}
 // the visible foes and the AI's: only those seen
 {see(foot,tgt,4);const vf=t.visibleFoes(0);ok(vf.length===1&&vf[0]===tgt,'visibleFoes(0): only the one in sight ('+vf.length+')');
  const f=t.assess(1).foes,lf=t.liveFoes(theirs[0]);ok(f.length===1&&f[0]===foot&&lf.length===1,'the enemy captain\'s foes (assess) and a character\'s (liveFoes) are only those its side sees ('+f.length+', '+lf.length+')')}
 // a blow or a shot gives the striker away for SIGHT.memory s
 {const S=t.SIGHT;see(foot,tgt,20);const h0=!t.seenBy(0,tgt);t.sightStruck(tgt,foot);const s0=t.seenBy(0,tgt);B.t+=S.memory-.5;t.sightStep(true);const s1=t.seenBy(0,tgt);B.t+=1;t.sightStep(true);
  ok(h0&&s0&&s1&&!t.seenBy(0,tgt),'out of sight, he shoots: seen at once and for '+S.memory+' s, then gone again')}
 // ghosts: a group lost leaves a mark where it was last seen; fades out over FOG.ghost s; cleared when seen again, or its place seen empty
 {const g=tgt.grp,m=theirs.filter(u=>u.grp===g),S=B.sight,away=()=>{foot.x=X0-300},back=()=>{foot.x=X0};park();foot.x=X0;foot.y=Y;m.forEach((u,i)=>{u.x=X0+64+(i%3)*10;u.y=Y+Math.floor(i/3)*10});t.sightStep(true);
  const seenAt={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length},seen0=m.every(u=>t.seenBy(0,u))&&!S.ghost.has(g);
  away();t.sightStep(true);const q=S.ghost.get(g);
  ok(seen0&&q&&Math.hypot(q.x-seenAt.x,q.y-seenAt.y)<1e-6,'a group gone from sight leaves a ghost where it was last seen ('+(q?Math.round(q.x)+','+Math.round(q.y):'none')+')');
  const icons0=(t.drawUnitIcons(),B.icons.filter(r=>r.g===g).length);ok(icons0===0&&!t.rtsUnitAt(q.x,q.y,1),'the ghost is no icon to click, and nothing is found under it (rtsUnitAt)');
  B.t+=F.ghost/2;t.sightStep(true);const half=t.ghostFade(S.ghost.get(g));B.t+=F.ghost/2+.5;t.sightStep(true);
  ok(Math.abs(half-.5)<.02&&!S.ghost.has(g),'it fades (half way at '+F.ghost/2+' s: '+half.toFixed(2)+') and is gone after '+F.ghost+' s');
  back();t.sightStep(true);away();t.sightStep(true);const q2=S.ghost.has(g);back();t.sightStep(true);ok(q2&&!S.ghost.has(g),'seen again: its ghost is cleared');
  away();t.sightStep(true);const q3=S.ghost.get(g);m.forEach(u=>u.x+=400);t.sightStep(true);const kept=S.ghost.has(g);foot.x=q3.x;foot.y=q3.y;t.sightStep(true);
  ok(q3&&kept&&!S.ghost.has(g)&&m.every(u=>!t.seenBy(0,u)),'it stays while its place is out of sight; that place come into sight empty, it is cleared')}
 // the overlay: cells in your side's sight clear, the rest fogged; a change eases in over FOG.fade s (no flicker)
 {park();foot.x=X0;foot.y=Y;t.sightStep(true);B.fogView=null;const O=t.fogView();
  ok(O&&t.fogAt(X0,Y)===0&&t.fogAt(X0+100,Y)===0&&t.fogAt(X0+F.foot+40,Y)===1&&t.fogAt(t.BW-24,t.fieldTop()+20)===1,'the overlay: clear round your men, fogged beyond their sight and over the enemy\'s');
  const px=x=>O.img.data[(Math.floor(Y/cs)*O.C+Math.floor(x/cs))*4+3];ok(px(X0)===0&&px(X0+F.foot+80)===Math.round(F.dark*255)&&px(X0+F.foot)>0&&px(X0+F.foot)<px(X0+F.foot+80),'its pixels: alpha 0 in sight, '+Math.round(F.dark*255)+' well out of it, between at its edge ('+px(X0+F.foot)+': softened)');
  foot.x=X0+200;t.sightStep(true);const far=X0+200+F.foot-40,a0=t.fogAt(far,Y),tick=()=>{O.lt=performance.now()-100;t.fogView();return t.fogAt(far,Y)},a1=tick(),a2=tick(),a3=tick(),a4=tick();
  ok(a0===1&&Math.abs(a1-(1-.1/F.fade))<.02&&a2<a1&&a3===0&&a4===0,'a cell coming into sight clears over '+F.fade+' s ('+[a0,a1,a2,a3].map(a=>+a.toFixed(2)).join(' → ')+', 0.1 s apart), and stays clear')}
 // the small map: unseen ground shaded, unseen enemies not on it
 {park();foot.x=X0;foot.y=Y;t.sightStep(true);B.fogView=null;G.mode='battle';t.frame();const r=t.miniRect(),k=t.BVW/t.VW,kk=t.BVH/t.VH,pt=(x,y)=>{const d=t.ctx.getImageData(Math.round((r.x+x*r.w/t.BW)*k),Math.round((r.y+y*r.h/t.BH)*kk),1,1).data;return d[0]+d[1]+d[2]};
  const lit=pt(X0+40,Y),dark=pt(X0+F.foot+80,Y);ok(lit>dark+30,'the small map shades ground out of sight ('+lit+' in sight vs '+dark+')');
  const e=theirs[0],onMap=pt(e.x,e.y);ok(!t.seenBy(0,e)&&Math.abs(onMap-pt(e.x,e.y+40))<12,'an unseen enemy is no dot on it')}
 // mist in the fog (gfx/mist.js): its edge billowing, wisps drifting only where it is fogged, moving with the clock, still with
 // reducedMotion(); drawn only
 // (no Math.random, the battle untouched); INFO the wisps' cost
 {park();foot.x=X0;foot.y=Y;t.sightStep(true);B.fogView=null;t.fogView();G.mode='battle';const pn=performance.now;let now=pn.call(performance);performance.now=()=>now;
  const M=()=>t.MISTV,mist=()=>{t.fogDraw();const m=M(),k=t.mkc(m.w,m.h,g=>g.drawImage(m.cv,0,0)),d=k.getContext('2d', { willReadFrequently: true }).getImageData(0,0,m.w,m.h).data;return {d,at:(x,y)=>{const X=Math.floor((x-m.x)/t.MIST.res),Y=Math.floor((y-m.y)/t.MIST.res);return X<0||Y<0||X>=m.w||Y>=m.h?null:d[(Y*m.w+X)*4+3]}}};
  const state=()=>JSON.stringify([B.t,B.units.map(u=>[u.x,u.y,u.hp,u.hid,u.morale])]),st0=state(),r0=Math.random;let nr=0,m0,m1,still,ms=0,ms0=0;Math.random=()=>{nr++;return r0()};
  const edge=()=>Array.from(B.fogView.edge.img.data).join();let e0,e1,eStill,lo=1,hi=0;
  try{m0=mist();e0=edge();now+=1000;m1=mist();e1=edge();
   {const E=B.fogView.edge,cs=B.fogView.cs/2;for(let k=-12;k<=12;k++){const q=k/12*1.1,ex=X0+Math.cos(q)*F.foot,y=Y+Math.sin(q)*F.foot,c=Math.floor((ex-E.gx)/cs),r=Math.floor((y-E.gy)/cs);if(c<0||r<0||c>=E.cols||r>=E.rows)continue;const a=E.img.data[(r*E.cols+c)*4+3]/255;lo=Math.min(lo,a);hi=Math.max(hi,a)}}
   const rm0=t.reducedMotion;window.__rm0=rm0;ev('reducedMotion=()=>true');try{const a=mist().d.join(),b=edge();now+=1000;still=mist().d.join()===a;eStill=edge()===b}finally{ev('reducedMotion=__rm0')}
   const run=()=>{const a=pn.call(performance);for(let i=0;i<60;i++){now+=16;B.fogView.lt=now-16;t.fogDraw();t.ctx.getImageData(0,0,1,1)}return (pn.call(performance)-a)/60};run();ms=run();window.__dm0=t.mistLay;window.__dm1=t.mistOnto;ev('mistLay=()=>{};mistOnto=()=>{}');try{run();ms0=run()}finally{ev('mistLay=__dm0;mistOnto=__dm1')}}
  finally{Math.random=r0;performance.now=pn}
  let most=0,moved=0;for(let i=3;i<m0.d.length;i+=4){most=Math.max(most,m0.d[i]);if(m0.d[i]!==m1.d[i])moved++}const clear=m0.at(X0,Y);
  ok(most>0&&clear===0,'mist drifts in the fog (alpha up to '+most+'), none round your men ('+clear+')');
  ok(moved>50&&e0!==e1&&still&&eStill,'it moves with the clock ('+moved+' of its pixels changed in a second; the edge\'s puffs reshaping too) and all of it holds still with reducedMotion()');
  ok(hi-lo>.15,'the fog\'s edge is mist: round the edge of a man\'s sight it comes and goes in puffs ('+lo.toFixed(2)+' to '+hi.toFixed(2)+'), not a band of one width');
  ok(nr===0&&state()===st0&&!/Math\.random/.test(String(t.mistLay)+String(t.mistOnto)+String(t.mistTex)),'drawn only: no Math.random ('+nr+' calls), the battle untouched');
  info('the wisps: '+(ms-ms0).toFixed(3)+' ms a frame (the overlay, edge and wisps, '+ms.toFixed(3)+' ms, each frame drawn through; the field in view '+Math.round(t.BVW)+'×'+Math.round(t.BVH)+')')}
 // high ground: +FOG.high a level; rises and rock block the line; woods keep their rule
 L.exit();ev('TERRAIN.on=true');
 {const W=t.BW,BH=t.BH;B=lab({fog:true,ground:{hills:[{x:.35,y:.5,r:60,top:1}],seed:3}});const T2=B.terrain,M=B.units.filter(u=>u.team===0),Th=B.units.filter(u=>u.team===1);
  const pk=()=>{M.forEach((u,i)=>{u.x=mid(24+(i%3)*16);u.y=mid(t.fieldTop()+20+Math.floor(i/3)*16)});Th.forEach((u,i)=>{u.x=mid(W-24-(i%3)*16);u.y=mid(t.fieldTop()+20+Math.floor(i/3)*16)});for(const u of B.units){u.rv=undefined;u.hid=0}};
  const v=M.find(u=>u.type==='hum_foot'),tg=Th.find(u=>u.type==='hum_foot'),hx=mid(W*.35),hy=mid(BH*.5),put=(u,x,y)=>{u.x=x;u.y=y};
  const a=Math.floor(F.foot*(1+F.high)/cs);pk();put(v,hx,hy);put(tg,hx+a*cs,hy);t.sightStep(true);const up=t.seenBy(0,tg),lvls=[t.levelAt(v.x,v.y),t.levelAt(tg.x,tg.y)];
  pk();put(v,hx+a*cs,hy);put(tg,hx+2*a*cs,hy);t.sightStep(true);const flat=t.seenBy(0,tg);
  ok(lvls[0]===1&&lvls[1]===0&&up&&!flat,'from a hill a level up he sees '+a*cs+' px off (+'+F.high*100+'%: '+F.foot*(1+F.high)+'); on the flat, not that far');
  // a rise between: level 0 to level 0 over the hill, hidden; from its top, seen
  pk();put(v,hx-6*cs,hy);put(tg,hx+6*cs,hy);t.sightStep(true);const behind=!t.seenBy(0,tg);put(v,hx,hy);t.sightStep(true);
  ok(t.levelAt(hx-6*cs,hy)===0&&behind&&t.seenBy(0,tg),'a hill between hides him ('+12*cs+' px, within range); from its top he is seen');
  // the overlay's shadow: a cell behind the hill fogged, one beside it clear, both in range
  pk();put(v,hx-6*cs,hy);t.sightStep(true);const fg=B.sight.fog,ix=(x,y)=>Math.floor(y/cs)*fg.C+Math.floor(x/cs);
  ok(!fg.vis[0][ix(hx+6*cs,hy)]&&fg.rng[0][ix(hx+6*cs,hy)]&&fg.vis[0][ix(hx-6*cs,hy-8*cs)],'the sight grid: the ground behind the hill in range but unseen (a shadow), open ground beside him seen');
  L.exit();
  B=lab({fog:true,ground:{rocks:[{x:.5,y:.5,r:24,h:4}],woods:[{x:.5,y:.2,r:50}],seed:3}});const M2=B.units.filter(u=>u.team===0),T3=B.units.filter(u=>u.team===1);
  const pk2=()=>{M2.forEach((u,i)=>{u.x=mid(24+(i%3)*16);u.y=mid(t.fieldTop()+20+Math.floor(i/3)*16)});T3.forEach((u,i)=>{u.x=mid(W-24-(i%3)*16);u.y=mid(t.fieldBot()-20-Math.floor(i/3)*16)});for(const u of B.units){u.rv=undefined;u.hid=0}};
  const v2=M2.find(u=>u.type==='hum_foot'),t2=T3.find(u=>u.type==='hum_foot'),rx=mid(W*.5),ry=mid(BH*.5);
  pk2();put(v2,rx-5*cs,ry);put(t2,rx+5*cs,ry);t.sightStep(true);const rock=!t.seenBy(0,t2);put(t2,rx+5*cs,ry+5*cs);t.sightStep(true);
  ok(B.terrain.has.rock&&rock&&t.seenBy(0,t2),'rock between hides him; stepped out from behind it he is seen');
  const wy=mid(BH*.2);pk2();put(t2,rx,wy);put(v2,rx,wy+6*cs);t.sightStep(true);const wd=!t.seenBy(0,t2);put(v2,rx,wy+3*cs);t.sightStep(true);
  ok(t.groundAt(rx,wy)===t.TKIND.wood&&wd&&t.seenBy(0,t2),'woods keep their rule: '+6*cs+' px off (in range) he is unseen in the wood; '+3*cs+' px off, seen');
  L.exit()}
 ev('TERRAIN.on=false');
 // ---- deployment: you see what your army sees; the enemy's men, icons and places hidden, its count kept
 {B=lab({fog:true,deploy:true,leftGroups:[{type:'hum_foot',count:12},{type:'hum_bow',count:8}],rightGroups:[{type:'hum_foot',count:12},{type:'hum_bow',count:8}]});G.mode='battle';
  t.frame();const foes=B.units.filter(u=>u.team===1),ents=t.battleEnts();
  ok(B.deploy&&foes.every(u=>!t.seenBy(0,u))&&!ents.some(u=>u.team===1)&&!B.icons.some(r=>r.team===1),'deploying: the enemy army is unseen, undrawn, with no icons');
  t.bhudTop();const nf=document.getElementById('bFoe');ok(!nf||nf.textContent===String(foes.length),'the top bar still counts their army ('+(nf?nf.textContent:'none')+')');
  const g=t.playerGroups()[0],m=t.grpUnits(g);B.groups[g].placeAt(t.deployZone().x1,t.fieldTop()+40);t.deploySnap([g]);B.sight.rt=0;t.frame();
  ok(m.every(u=>u.x<=t.deployZone().x1)&&foes.every(u=>!t.seenBy(0,u)),'placed at the zone\'s edge, the deploy UI still works (no enemy that far off seen)');
  t.beginFight();ok(!B.deploy,'Begin starts the fight')}
 // ---- Settings: "Fog of war (battle)", on by default, stored
 {ok(t.PREFS.bfog.def===true&&t.prefLoad('bfog')===true,'the setting defaults on');t.showTitle('settings');const pn=()=>document.getElementById('panel').innerHTML;
  ok(/Fog of war \(battle\)/.test(pn())&&document.querySelector('#panel [data-act="bfog"][data-arg="on"]'),'Settings has its toggle');
  t.act('bfog','off');ok(localStorage.getItem('ashmark.bfog')==='0'&&F.on===false&&t.prefLoad('bfog')===false&&document.querySelector('#panel [data-act="bfog"][data-arg="off"]').classList.contains('on'),'off: stored, read back off, FOG.on off');
  t.act('bfog','on');ok(localStorage.getItem('ashmark.bfog')==='1'&&F.on===true,'on again: stored');G.mode='world';G.modal=false;t.hidePanel()}
 // ---- where: field battles yes; tournaments, sieges and raids no; the setting off, none
 {const E=G.enc,on=(opts,enc)=>{G.enc=enc;try{return !!new t.BattleSetup(opts).fogOn()}finally{G.enc=E}};
  ok(on({},{kind:'party'})&&on({},{kind:'monster'})&&on({},null)&&!on({tournament:true},null)&&!on({},{kind:'siege'})&&!on({},{kind:'raid'})&&!on({},{kind:'tourney'}),'fog in field battles; none in tournaments, sieges or raids');
  F.on=false;const off=on({},{kind:'party'});F.on=true;ok(!off,'the setting off: no fog');
  t.startEncounter({kind:'party',ref:t.asParty({x:t.P.x,y:t.P.y,cool:0,troops:['militia','militia','militia']}),n:3,list:['militia','militia','militia']});t.act('fight');
  ok(t.B&&t.B.fog&&t.B.sight&&t.B.sight.fog,'a field battle from the world map has the fog');t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);G.mode='world';G.modal=false;t.hidePanel()}
 // ---- no Math.random in the sight code
 {B=lab({fog:true});const r0=Math.random;let n=0;Math.random=()=>{n++;return r0()};try{for(let i=0;i<5;i++){B.t+=.3;t.sightStep(true)}t.fogView();G.mode='battle';t.drawFogGhosts()}finally{Math.random=r0}
  const src=[t.fogGrid,t.fogMark,t.fogSees,t.fogGhosts,t.fogView,t.fogRange,t.sightStep,t.captainSearch].map(String).join('\n');
  ok(n===0&&!/Math\.random/.test(src),'no Math.random in the sight code ('+n+' calls)');L.exit()}
 // ---- a whole AI-on-AI battle in the fog runs to its end
 {G.mode='world';G.modal=false;B=lab({fog:true,ai:true,seed:11,ground:'auto',terrain:'hill',distance:600,leftGroups:[{type:'hum_foot',count:30},{type:'hum_bow',count:16},{type:'hum_knight',count:8}],rightGroups:[{type:'hum_foot',count:30},{type:'hum_bow',count:16},{type:'hum_knight',count:8}]});
  const blind=B.units.filter(u=>u.team===1).every(u=>!t.seenBy(0,u));let met=null;while(!L.session.result&&B.t<300){L.step(60);if(met==null&&B.units.some(u=>u.team===1&&u.hp>0&&t.seenBy(0,u)))met=B.t}
  ok(blind&&met>0&&L.session.result&&B.t<300,'an AI battle in the fog: blind at the start, the armies find each other ('+(met==null?'never':Math.round(met)+' s')+'), '+L.session.result+' at '+Math.round(B.t)+' s');L.exit()}
 // ---- a held bridge, an ambush and a river in the fog: AI on AI, each to its end
 {ev('TERRAIN.on=true');const runs=[];for(const [type,ground] of [['bridge','auto'],['ambush','auto'],['field',{recipe:'river',seed:9}]]){G.mode='world';G.modal=false;
   B=lab({fog:true,ai:true,seed:13,type,ground,terrain:type==='ambush'?'forest':'open',deploy:type==='field',leftGroups:[{type:'hum_foot',count:24},{type:'hum_bow',count:12},{type:'hum_knight',count:6}],rightGroups:[{type:'hum_foot',count:24},{type:'hum_bow',count:12},{type:'hum_knight',count:6}]});
   if(B.deploy)t.beginFight();while(!L.session.result&&B.t<300)L.step(60);runs.push([type,!!B.fog,L.session.result,Math.round(B.t)]);L.exit()}
  ok(runs.every(r=>r[1]&&r[2]&&r[3]<300),'a held bridge, an ambush and a river field in the fog each end: '+runs.map(r=>r[0]+' '+r[2]+' at '+r[3]+' s').join('; '));ev('TERRAIN.on=false')}
 // ---- cost: the sight step with fog, by soldiers (every SIGHT.every s: per frame at 60 fps it is a fifteenth)
 {B=lab({fog:true,leftGroups:[{type:'hum_foot',count:100},{type:'hum_bow',count:60},{type:'hum_knight',count:40}],rightGroups:[{type:'hum_foot',count:100},{type:'hum_bow',count:60},{type:'hum_knight',count:40}]});
  const cost=name=>{const base=B.units.slice(),res=[];for(const n of [400,800,1200]){B.units=base.slice();for(let k=1;B.units.length<n;k++)for(const u of base){if(B.units.length>=n)break;B.units.push({...u,id:u.id+k*1e4,hid:0,ls:null,rv:null,x:clamp(u.x+(u.team?1:-1)*k*40,10,t.BW-10),y:clamp(u.y+(k%2?7:-7),t.fieldTop(),t.fieldBot())})}
   // (the armies marching on each other, 6 px a step (24 px/s), from a cold start: new cells to cast every step)
   const x0=B.units.map(u=>u.x),run=()=>{B.units.forEach((u,i)=>{u.x=x0[i]});if(B.sight)B.sight.fogCast=null;let w=0;const a=performance.now();for(let i=0;i<40;i++){B.t+=.3;for(const u of B.units)u.x+=u.team?-6:6;const b=performance.now();t.sightStep(true);if(!i)w=performance.now()-b}return[(performance.now()-a)/40,w]};
   run();const [ms,cold]=run();B.fog=false;run();const [off]=run();B.fog=true;
   res.push(n+': '+ms.toFixed(2)+' ms a step (fog off '+off.toFixed(2)+'; the first, cold, '+cold.toFixed(1)+'), '+((ms-off)/15).toFixed(3)+' ms a frame added')}
  {t.sightStep(true);B.fogView=null;t.fogView();const a=performance.now();for(let i=0;i<60;i++){B.fogView.lt=performance.now()-16;if(i%15===0){B.sight.fog.vis[0][(i*37)%B.sight.fog.N]^=1}t.fogDraw()}res.push('overlay '+((performance.now()-a)/60).toFixed(3)+' ms a frame')}
  info('fog sight on '+name+': '+res.join('; '));B.units=base;L.exit()};cost('open ground');
  ev('TERRAIN.on=true');B=lab({fog:true,ground:{recipe:'crags',seed:7},leftGroups:[{type:'hum_foot',count:100},{type:'hum_bow',count:60},{type:'hum_knight',count:40}],rightGroups:[{type:'hum_foot',count:100},{type:'hum_bow',count:60},{type:'hum_knight',count:40}]});
  cost('crags (hills, cliffs, rock: '+[B.terrain.has.hills,B.terrain.has.rock].join('/')+')');ev('TERRAIN.on=false')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
try{if(T.BattleLab.active)T.BattleLab.exit();(0,eval)('TERRAIN.on=false;FOG.on=false');localStorage.removeItem('ashmark.bfog')}catch(e){}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
