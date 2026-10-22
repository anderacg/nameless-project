'use strict';
// Groups handed to the AI one by one (deploy.js aiHas, setGroupsAuto, autoKey): the captain orders only the groups it has, your
// others keep your orders; an order of yours takes a group back; A with nothing selected, the whole army as ever (and the whole
// army flagged group by group plays exactly as the whole-army AI, whose fingerprint is the one recorded before the change); the
// AI badge on the card, the icon and the AI button. Allies in green (battle.js SIDE): their soldiers' cloth, health bars and
// minimap dots by pixels, yours blue, theirs red.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,W=t.W,cmd0=t.command,hp0=t.HPBARS.on;
 const hash=x=>{let h=2166136261;for(const c of JSON.stringify(x))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h.toString(16).padStart(8,'0')};
 // (a fixed battle: your spearmen, archers, knights and hero; an allied lord's spearmen and archers; the enemy's militia, archers, riders)
 const battle=seed=>{Math.random=t.seeded(seed);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;t.BDEPLOY.on=false;t.BAUTO.on=false;
  P.troops={hum_spear:8,hum_bow:6,hum_knight:4};P.comps={};const ally=W.lords.find(l=>l.fac==='vale');
  ally.inside=null;ally.dead=false;ally.lv=3;ally.xp=0;ally.renown=24;ally.sk=Object.fromEntries(t.LORD_SK.map(k=>[k,{lv:1,xp:0}]));ally.troops=['hum_spear','hum_spear','hum_bow','hum_bow'];
  const enemies=['militia','militia','militia','militia','militia','militia','archer','archer','archer','archer','horse','horse'];G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:enemies,allies:[ally],foes:[]};t.startBattle({enemies,tournament:false});return t.B};
 const run=(B,s)=>{while(B.t<s&&!B.over)t.updateBattle(1/30)};
 const print=B=>hash({u:B.units.map(u=>[u.id,u.x,u.y,u.hp,!!u.rout,u.tgt&&u.tgt.id]),g:Object.entries(B.groups).map(([id,g])=>[id,g.order,g.ax,g.ay,g.form,g.run,g.targetGroupId]),c:Object.entries(B.captains||{}).map(([k,c])=>[k,c.post,c.commit])});
 const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));
 const role=(B,r)=>t.playerGroups().find(id=>B.groups[id].role===r);
 try{
  // ======== the whole army: the A key with nothing selected (its old path) against every group flagged one by one. Fingerprints
  // recorded on the code before groups could be handed over (commit 13af1f5). A battle's start leans on what earlier battles left
  // in the page (its caches): the world battle is this page's first, as it was recorded; the lab's are compared after one to warm up
  // (re-recorded 2026-10-21, 8146f06e to 29dca01d: the wild game placed by its woods (a1c79a2..56f7e97) draws the shared
  // randomness differently before the battle; missed then, as the five battle fingerprint suites were re-recorded in 4d8ca8c)
  // (re-recorded 2026-10-21 S4: story and content systems on named streams, seeded per world and per game (owner accepted once); the estates' sort keys drawn before sorting, 29dca01d to b739f365: begin draws the game's number and places the wild game and the
  // beasts from their own streams, so the shared Math.random the battle starts from is elsewhere; with the streams switched back to
  // Math.random it is 29dca01d as before; the AI's play unchanged)
  // (its start reads the world and begin's draws: on the generated classic world its own fingerprint, recorded with G1-G8
  // (doc/WORLD_DESIGN.md §15.2, wave 3's last merge, 2026-10-22); the old hand-made map's b739f365 went with the map, D49)
  // (the generated world's e07350a9 re-recorded 2026-10-22, was d43b9569: agent S's clearings, estate tracks and farther estates
  //  moved the ground round the test's band; with those rules off d43b9569 again, the old map's b739f365 held)
  // (the generated world's d43b9569 re-recorded 2026-10-22, was a9b664e0: the battle's ground is where the test's band stands on the
  //  generated world, which K's roads and lots (1f40a5a), M's crossings and O's climates moved; the old map's b739f365 held)
  // (and 1bda01e3 re-recorded 2026-10-22 (agent U), was d43b9569: the generated classic seed starts with its land's bands and beasts
  //  (data/world.js DENSITY.grow), more draws before the battle; with it at today's counts d43b9569 holds; the old map's held)
  // (the generated world's 71be41f4 re-recorded 2026-10-22, was d43b9569: the owner's fifth play-test (agent R: the desert's
  //  water, springs, ponds and oases, worldgen.js) moves the generated world, and with it begin's draws and the battle's ground;
  //  with those rules off d43b9569 as before; the old map's b739f365 held)
  // (the generated world's 1f049224 measured together 2026-10-22 at the merge of agents S and R (each proved its own rules off
  //  above); the old map's b739f365 held)
  // (the generated world's 05ee3f4a measured together 2026-10-22 at the merge of agents R (the generator's water: no desert rain, terminal lakes, springs, ponds and oases), S (estate tracks, forest clearings, estates farther out, oases drawing holdings, stage 7 regrown, roads round ponds) and U (the camps grown with the land, port piers preferring the sea) on main 880b6e7; each agent proved its own rules off give the values before)
  // (the generated world's 18d74563 re-recorded 2026-10-23, on purpose, the owner's play-test of 2026-10-22 (agent GP: tests/
  //  worldprint.js W1-W8): the ground of the battle moves with the world; with those rules off 05ee3f4a as before)
  {const B=battle(4242);B.noMorale=true;B.sel=null;key('a');const a=B.auto&&t.aiAll();run(B,60);const fp=print(B),REC='18d74563';
   ok(a&&fp===REC,'A with nothing selected, your army and an ally’s against the enemy (seed 4242, no morale): the whole-army AI plays the very battle it did before ('+fp+', recorded '+REC+', '+B.t.toFixed(1)+' s)')}
  {const L=t.BattleLab,Gp=(type,count)=>({type,count}),lab=mor=>{if(L.active)L.exit();G.mode='world';G.modal=false;L.start({leftGroups:[Gp('hum_spear',16),Gp('hum_bow',12),Gp('hum_knight',6)],rightGroups:[Gp('hum_levy',20),Gp('hum_bow',12),Gp('hum_spear',10)],deploy:false,ai:false,paused:false,morale:mor,seed:42});return t.B};
   Math.random=t.seeded(1);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;const REC={false:'596d6d9c',true:'17c1387b'};run(lab(false),60);// (to warm up)
   for(const mor of [false,true]){let B=lab(mor);B.sel=null;key('a');const a=B.auto;run(B,60);const whole=print(B);
    B=lab(mor);t.setGroupsAuto(t.playerGroups(),true,true);const b=!B.auto&&t.aiAll();run(B,60);const each=print(B);
    ok(a&&b&&whole===REC[mor]&&each===whole,'lab, morale '+(mor?'on':'off')+': the whole-army AI as recorded before ('+whole+', recorded '+REC[mor]+'), and every group flagged one by one plays the very same battle ('+each+')')}
   if(L.active)L.exit()}
  // ======== two groups to the AI, the rest yours
  {const B=battle(4242);B.noMorale=true;B.units.forEach(u=>{u.hp=u.max=u.max*5});// (a foe tough enough to last the minute, and your
   // army too, so a group is still there for the orders after it: on the generated world your archers fell within it)
   const inf=role(B,'inf'),arc=role(B,'arc'),cav=role(B,'cav'),hand=t.playerGroups().filter(g=>g!==inf&&g!==arc);
   // (your knights sent back to a corner and holding there; your hero holding)
   B.groups[cav].moveTo(60,t.fieldTop()+30);B.sel=[inf,arc];key('a');
   ok(t.aiHas(B.groups[inf])&&t.aiHas(B.groups[arc])&&hand.every(g=>!t.aiHas(B.groups[g]))&&!B.auto&&t.aiAny()&&!t.aiAll(),'A with two groups selected: only those two are the AI’s ('+[inf,arc].join(', ')+'), the rest yours ('+hand.join(', ')+')');
   const bt=document.getElementById('bAuto');ok(bt.getAttribute('aria-pressed')==='mixed'&&bt.classList.contains('some'),'the AI button shows some of your army the AI’s');
   t.setOrderUI();const card=g=>document.querySelector('.ucard[data-grp="'+g+'"]');
   ok(card(inf).querySelector('[data-st="ai"]')&&card(arc).querySelector('[data-st="ai"]')&&!card(cav).querySelector('[data-st="ai"]')&&/the AI in command/.test(card(inf).title),'their unit cards carry the AI badge, yours none'+' ('+[inf,arc,cav].map(g=>g+': '+(card(g)?card(g).title:'no card')).join(' | ')+')');
   // (the field icon: the badge first beside it, its violet rim drawn)
   t.frame();const it=t.iconLayout(0).find(x=>x.g===inf);t.frame();const ic=B.icons.find(r=>r.g===inf),cx=document.querySelector('canvas').getContext('2d');
   let violet=0;if(ic){const K=t.UICON.k,S=t.UICON.s,d=cx.getImageData(ic.x+(S+2)*K,ic.y,9*K,9*K).data;for(let i=0;i<d.length;i+=4)if(d[i]===0xb4&&d[i+1]===0x8c&&d[i+2]===0xf0)violet++}
   ok(it&&it.st[0]==='ai'&&violet>=10,'and their icons on the field: the AI badge beside it ('+violet+' violet rim pixels)');
   // (who gives the AI's orders to whom: every order to a group of yours while the captains think, command())
   const M=['hold','moveTo','toHold','queueTo','placeAt','standAt','attack','charge','advance','withdraw','setWalk','setRun','setFlag','setForm','useAbility','faceTo'],P0={},got={};let inCmd=false;
   for(const m of M){P0[m]=t.BattleControl.prototype[m];t.BattleControl.prototype[m]=function(...a){if(inCmd&&this.team===0&&this.player)(got[this.id]=got[this.id]||new Set()).add(m);return P0[m].apply(this,a)}}
   window.__cmd0=cmd0;window.__inCmd=v=>{inCmd=v};(0,eval)('command=function(dt){window.__inCmd(true);try{return __cmd0(dt)}finally{window.__inCmd(false)}}');
   const keep=g=>{const q=B.groups[g];return JSON.stringify([q.order,q.ax,q.ay,q.form,q.files,q.run,q.walk,q.firm,q.cease,q.skirmish,q.melee,q.shieldWall,q.targetGroupId,q.targetUnitId,q.queue])};
   run(B,4);const before=Object.fromEntries(hand.map(g=>[g,keep(g)])),t0=B.t;
   try{run(B,64)}finally{for(const m of M)t.BattleControl.prototype[m]=P0[m];(0,eval)('command=__cmd0')}
   const ordered=Object.keys(got);
   ok(ordered.includes(inf)&&ordered.includes(arc)&&ordered.every(g=>g===inf||g===arc),'over '+Math.round(B.t-t0)+' s the AI ordered only the groups it has ('+ordered.map(g=>g+': '+[...got[g]].join('/')).join('; ')+')');
   ok(hand.every(g=>keep(g)===before[g])&&(B.t-t0>=59||B.over),'your other groups keep your orders untouched all the while, 60 s or the battle’s end ('+hand.join(', ')+'; '+(B.t-t0).toFixed(1)+' s'+(B.over?', won':'')+')'+hand.filter(g=>keep(g)!==before[g]).map(g=>' '+g+': '+before[g]+' → '+keep(g)).join(''));
   ok(Object.values(B.groups).some(g=>g.ally)&&B.captains&&B.captains.ally&&B.captains[0],'your allies keep their own captain beside yours');
   // ======== an order of yours takes that group back, the other stays the AI's
   B.sel=arc;t.rtsOrder(200,300);ok(!t.aiHas(B.groups[arc])&&t.aiHas(B.groups[inf])&&t.aiAny(),'a move to an AI group of yours takes that group back, the other stays the AI’s');
   B.sel=inf;t.setOrder('hold');ok(!t.aiAny()&&!B.auto&&!t.BAUTO.on,'Hold to the other: nobody left the AI’s, the whole-army choice off');
   B.sel=[inf,arc];key('a');B.sel=inf;t.setForm('loose');ok(!t.aiHas(B.groups[inf])&&t.aiHas(B.groups[arc]),'a formation button takes its group back too');
   B.sel=arc;key('a');ok(!t.aiAny(),'A again on a group the AI has: back to you')}
  // ======== A with nothing selected: the whole army, on and off (as ever); with some of it the AI's, All hands it all
  {const B=battle(77);B.sel=null;key('a');ok(B.auto&&t.aiAll()&&t.BAUTO.on&&document.getElementById('bAuto').getAttribute('aria-pressed')==='true','A with nothing selected: the AI has your whole army (remembered: BAUTO)');
   key('a');ok(!B.auto&&!t.aiAny()&&!t.BAUTO.on,'A again: all yours');
   const inf=role(B,'inf');B.sel=inf;key('a');B.sel='all';key('a');ok(B.auto&&t.aiAll(),'some of it the AI’s, A with All selected hands it the whole army');
   B.sel=inf;t.rtsOrder(300,300);ok(!B.auto&&!t.aiHas(B.groups[inf])&&t.playerGroups().filter(g=>g!==inf).every(g=>t.aiHas(B.groups[g]))&&!t.BAUTO.on,'then an order to one group takes back that group alone');
   t.setAuto(false,true)}
  // ======== allies in green: their soldiers' cloth, health bars and minimap dots (yours blue, theirs red)
  {const B=battle(4242);t.HPBARS.on=true;const cx=document.querySelector('canvas').getContext('2d');
   const pick=s=>B.units.find(u=>u.hp>0&&!u.hero&&!u.leader&&!u.s.big&&t.sideKey(u)===s),U={own:pick('own'),ally:pick('ally'),foe:pick('foe')};
   const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),PP=t.PPAL,cloth={own:PP.blue,ally:PP.forest,foe:PP.red};
   const count=(d,cols,tol=0)=>{let n=0;for(let i=0;i<d.length;i+=4)if(cols.some(c=>Math.abs(d[i]-c[0])<=tol&&Math.abs(d[i+1]-c[1])<=tol&&Math.abs(d[i+2]-c[2])<=tol))n++;return n};
   const res={};
   const all0=B.units;for(const s of ['own','ally','foe']){const u=U[s];B.cam.z=3;B.cam.fit=false;t.camCentre(u.x,u.y-8);B.units=[u];try{t.frame()}finally{B.units=all0}const p=t.fromField({x:u.x,y:u.y}),z=B.cam.z,h=t.unitSprite(u.type,t.spriteTeam(u),false,u.v).ch;
    const body=cx.getImageData(Math.round(p.x-6*z),Math.round(p.y-(h-2)*z),12*z,(h-2)*z).data,bar=cx.getImageData(Math.round(p.x-7*z),Math.round(p.y-(h+3)*z),14*z,3*z).data;
    res[s]={cloth:Object.fromEntries(['own','ally','foe'].map(k=>[k,count(body,cloth[k].map(hex))])),bar:Object.fromEntries(['own','ally','foe'].map(k=>[k,count(bar,[hex(t.SIDE[k].ui)])]))}}
   info('pixels by side (cloth: each side palette\'s pixels on the soldier; bar: each side colour in his health bar): '+JSON.stringify(res));
   ok(res.ally.cloth.ally>=6&&res.ally.cloth.own===0&&res.own.cloth.own>=6&&res.own.cloth.ally===0&&res.foe.cloth.foe>=6,'an allied soldier wears green, yours blue, theirs red (his sprite’s pixels)');
   ok(res.ally.bar.ally>=6&&res.ally.bar.own===0&&res.own.bar.own>=6&&res.own.bar.ally===0&&res.foe.bar.foe>=6,'his health bar green, yours blue, theirs red');
   // (the small map: those three alone on it, each dot its side's colour; one of them running, the paler shade)
   const all=B.units,r=t.miniRect(),sx=t.BVW/t.VW,sy=t.BVH/t.VH,kx=r.w/t.BW,ky=r.h/t.BH;
   const dot=(u,k)=>{const X=(r.x+u.x*kx+.5)*sx,Y=(r.y+u.y*ky+.5)*sy,d=cx.getImageData(Math.round(X-2),Math.round(Y-2),5,5).data;return Object.fromEntries(['own','ally','foe'].map(s=>[s,count(d,[hex(t.SIDE[s][k])],24)]))};
   t.camReset();B.units=[U.own,U.ally,U.foe];try{t.frame()}finally{B.units=all}
   const D={own:dot(U.own,'ui'),ally:dot(U.ally,'ui'),foe:dot(U.foe,'ui')};info('minimap dots: '+JSON.stringify(D));
   ok(D.ally.ally>0&&D.ally.own===0&&D.own.own>0&&D.own.ally===0&&D.foe.foe>0,'on the small map an allied soldier is a green dot, yours blue, theirs red');
   U.ally.rout=true;B.units=[U.ally];try{t.frame()}finally{B.units=all;U.ally.rout=false}
   const R=dot(U.ally,'rout');ok(R.ally>0,'one of them running: the paler green ('+JSON.stringify(R)+')');
   const ag=Object.values(B.groups).find(g=>g.ally);ok(t.sideKey(ag)==='ally'&&t.OPATH.ally.move===t.SIDE.ally.rgb&&t.SIDE.ally.plate.every(c=>!t.SIDE.own.plate.includes(c)),'their icons and order paths take the same green (one table: battle.js SIDE)');
   B.over=true;B.endT=0}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 finally{if(window.__cmd0)(0,eval)('command=__cmd0');t.HPBARS.on=hp0;t.BAUTO.on=false;if(t.B){t.B.over=true;t.B.endT=0}}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
