'use strict';
// Commander powers (battle/commandpowers.js): the commander (your hero, their lord or chieftain), the command radius and the
// cooldowns by Leadership, Rally the Line (morale.js's own rally, its anti-spam lock), Stand Fast! (no wavering while it lasts),
// no Scout (gone, the owner 2026-10-20: scouting is the scout units' own Scout ahead, tests/unitabilities.js), none without a commander or with powers off, the AI using each, the commander bar and its keys, no order (a
// character's fall-back goes on), the lab's powers and commander keys, and no Math.random in the new code.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),CP=t.COMMAND_POWERS,G=t.G;try{
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
 ok(CP.on===false,'the harness turns commander powers off for the older suites (COMMAND_POWERS.on '+CP.on+')');
 // (a paused lab battle: your hero at H, groups by offsets from him (dx, dy); theirs likewise round their commander)
 const Y=()=>(t.fieldTop()+t.fieldBot())/2;
 const start=(left,right,cfg={},mine=[],theirs=[])=>{G.mode='world';G.modal=false;if(L.active)L.exit();
  L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,powers:true,...cfg});
  const b=t.B;b.obs=[];const ms=t.playerGroups().map(id=>b.groups[id]),fs=Object.values(b.groups).filter(g=>g.foe),H={x:360,y:Y()},E={x:t.BW-150,y:Y()};
  const put=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0);u.cd=999})};
  ms.forEach((g,i)=>{const d=mine[i]||[0,0];put(g,H.x+d[0],H.y+d[1])});fs.forEach((g,i)=>{const d=theirs[i]||[0,0];put(g,E.x+d[0],E.y+d[1])});
  if(b.hero&&b.hero.hp>0){b.hero.x=H.x;b.hero.y=H.y}return{b,ms,fs}};
 const R=g=>g.resolve;
 // ---- off: the harness's switch and the lab's key
 let f=start([{type:'hero',count:1},{type:'hum_foot',count:8}],[{type:'hum_foot',count:6}],{powers:undefined},[[0,0],[0,-80]]);
 ok(!t.powersOn()&&t.powerWhyNot(0,'stand')==='Commander powers are off'&&!t.usePower(0,'stand'),'off (COMMAND_POWERS.on false, no lab key): no power ('+t.powerWhyNot(0,'stand')+')');
 t.bhudPowers();{const c=document.getElementById('bCmd');ok(c&&!c.hidden&&[...c.querySelectorAll('[data-power]')].every(b=>b.hidden)&&c.querySelector('#bAuto')&&!c.querySelector('#bAuto').hidden,'and the commander bar shows only the AI button (yours, no power)')}
 {const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));key('s');key('z');
  L.step(60);ok(!f.b.cmdp&&f.b.cpT===undefined&&f.ms[1].resolve.standUntil===undefined,'its keys do nothing and the AI’s think touches nothing (no B.cmdp, no timer)')}
 f=start([{type:'hero',count:1},{type:'hum_foot',count:8}],[{type:'hum_foot',count:6}],{powers:false});ok(!t.powersOn()&&!t.usePower(0,'stand'),'the lab’s powers:false turns them off as well');
 // ---- the commander, the radius and the cooldowns by Leadership
 f=start([{type:'hero',count:1},{type:'hum_foot',count:8},{type:'hum_foot',count:8},{type:'hum_foot',count:8}],[{type:'brann',count:1},{type:'hum_foot',count:6}],{},[[0,0],[0,-90],[0,90],[-300,0]],[[0,0],[0,-90]]);
 let b=f.b,[hg,g1,g2,g3]=f.ms;const ec=b.units.find(u=>u.team===1&&u.leader);
 ok(t.powersOn()&&t.commanderOf(0)===b.hero&&t.commanderOf(1)===ec,'your commander is your hero, theirs their leader (a companion here: '+(ec&&ec.leader.name)+')');
 const lead0=P=>{t.P.sk.lead.lv=P;return t.commanderLead(0)};
 ok(lead0(0)===t.skill('lead')&&lead0(3)===t.skill('lead')&&t.skill('lead')>=3,'your hero’s Leadership is skill(’lead’) ('+t.skill('lead')+')');
 ok(t.commanderLead(1)===2,'a companion or lord leading them: his own Leadership (Brann: 2)');
 {const L0=ec.leader;ec.leader={name:'Chief',lv:7};ok(t.commanderLead(1)===3,'a chieftain without the skill: half his level (7: 3)');ec.leader=L0}
 b.cmdLead={0:0};ok(t.commandRadius(0)===CP.radius&&t.powerCd(0,'rally')===CP.rally.cd&&t.powerCd(0,'stand')===CP.stand.cd,'Leadership 0: radius '+CP.radius+' px, cooldowns '+CP.rally.cd+' / '+CP.stand.cd+' s');
 b.cmdLead={0:5};const r5=t.commandRadius(0),c5=t.powerCd(0,'rally');ok(Math.abs(r5-CP.radius*1.4)<1e-9&&c5===48,'Leadership 5: radius +40% ('+r5+' px), Rally’s cooldown '+c5+' s');
 b.cmdLead={0:10};ok(Math.abs(t.commandRadius(0)-CP.radius*(1+CP.leadMax))<1e-9&&t.powerCd(0,'rally')===Math.round(CP.rally.cd*CP.cdMin)&&t.powerCd(0,'stand')===Math.round(CP.stand.cd*CP.cdMin),'Leadership 10: radius capped at +'+CP.leadMax*100+'% ('+t.commandRadius(0)+' px), cooldowns at '+CP.cdMin*100+'% ('+t.powerCd(0,'rally')+' / '+t.powerCd(0,'stand')+' s)');
 b.cmdLead={0:0};
 ok(t.powerGroups(0).map(g=>g.id).sort().join()===[g1.id,g2.id].sort().join(),'the groups within the radius (any soldier of theirs): the two beside him, not the one 300 px back, nor the hero’s own (no resolve)');
 // ---- the commander dead or routed: none
 b.hero.hp=0;ok(t.commanderOf(0)===null&&/hero/.test(t.powerWhyNot(0,'stand'))&&!t.usePower(0,'stand'),'your hero down: no power ('+t.powerWhyNot(0,'stand')+')');b.hero.hp=b.hero.max;
 b.hero.left=true;ok(!t.commanderOf(0)&&!t.usePower(0,'stand'),'nor off the field');b.hero.left=false;
 ec.rout=true;ok(t.commanderOf(1)===null&&t.powerWhyNot(1,'stand')==='No commander','their commander running: none for them');ec.rout=false;
 ec.hp=0;const nc=t.commanderOf(1);ok(nc===null,'their commander dead, and no other leader: none');ec.hp=ec.max;
 // ---- Rally the Line: morale.js's own rally for those routing, a gain for those wavering; within the radius only
 const calls=[],rally0=t.BattleResolve.prototype.rally;t.BattleResolve.prototype.rally=function(){calls.push(this.groupId);return rally0.apply(this,arguments)};
 try{
  ok(t.powerWhyNot(0,'rally')==='No routing or wavering unit within range','with no one routing or wavering it is refused (no cooldown spent)');
  R(g1).route();R(g2).mor=12;R(g2).refreshState();R(g3).route();
  ok(R(g1).routed&&R(g2).state==='wavering'&&R(g3).routed,'(one routs, one wavers beside him; one routs far back)');
  const m2=R(g2).mor,used=t.usePower(0,'rally');
  ok(used&&calls.join()===g1.id&&!R(g1).routed&&R(g1).rallied&&g1.order==='hold'&&g1.units.every(u=>!u.rout),'Rally the Line: the routing group rallies by morale.js’s own rally (BattleResolve.rally called for it), holds and re-forms');
  ok(R(g1).mor>=t.MORALE.rally+CP.rally.gain/2-1e-9,'with half the gain on top of the rally’s '+t.MORALE.rally+' ('+R(g1).mor+')');
  ok(Math.abs(R(g2).mor-(m2+CP.rally.gain))<1e-9&&R(g2).state!=='wavering','the wavering group: +'+CP.rally.gain+' morale ('+m2+' to '+R(g2).mor+')');
  ok(R(g3).routed&&!calls.includes(g3.id),'the routing group out of range runs on');
  ok(/^Ready in 60 s$/.test(t.powerWhyNot(0,'rally'))&&!t.usePower(0,'rally'),'its cooldown blocks a second use ('+t.powerWhyNot(0,'rally')+')');
  b.t+=61;R(g2).mor=12;R(g2).refreshState();ok(t.powerWhyNot(0,'rally')==='No routing or wavering unit within range'&&t.rallyLocked(R(g2)),'cooled down, but the group it rallied is locked for '+CP.rally.lock+' s: no endless wall');
  R(g1).route();ok(R(g1).shattered&&!t.rallyTargets(0).includes(g1),'a group rallied and routing again is shattered: never rallied again (morale.js)');
  b.t+=CP.rally.lock;ok(!t.rallyLocked(R(g2))&&t.usePower(0,'rally')&&R(g2).mor>=30,'after the lock it can be rallied again');
 }finally{t.BattleResolve.prototype.rally=rally0}
 // ---- Stand Fast!: +morale, less shock, never wavering for its duration; in range only
 f=start([{type:'hero',count:1},{type:'hum_foot',count:8},{type:'hum_foot',count:8},{type:'hum_foot',count:8}],[{type:'hum_foot',count:6}],{},[[0,0],[0,-90],[0,90],[-300,0]]);
 b=f.b;[hg,g1,g2,g3]=f.ms;b.cmdLead={0:0};
 for(const g of [g1,g2,g3]){R(g).mor=50;R(g).refreshState()}
 ok(t.usePower(0,'stand')&&R(g1).standing()&&R(g2).standing()&&!R(g3).standing(),'Stand Fast!: the groups in range stand fast, the one out of range does not');
 ok(Math.abs(R(g1).mor-60)<1e-9&&R(g3).mor===50,'+'+CP.stand.gain+' morale at once ('+R(g1).mor+')');
 R(g1).shock(10);R(g3).shock(10);ok(Math.abs((60-R(g1).mor)-10*CP.stand.shock)<1e-6&&Math.abs(50-R(g3).mor-10)<1e-6,'a shock shakes them '+Math.round((1-CP.stand.shock)*100)+'% less ('+(60-R(g1).mor).toFixed(2)+' against '+(50-R(g3).mor).toFixed(2)+')');
 R(g1).shock(200);R(g3).shock(200);ok(R(g1).mor===t.MORALE.waver&&R(g1).state==='shaken'&&R(g3).mor<0,'a crushing one leaves them at '+t.MORALE.waver+' (shaken), never wavering; the other is breaking ('+R(g3).mor.toFixed(1)+')');
 {const st=t.grpMorale(g1.units);ok(st.stand&&t.statusOf(st).includes('standfast')&&!t.grpMorale(g3.units).stand,'its banner shows the Stand Fast! badge (grpMorale stand, statusOf standfast); the other’s not')}
 // (its own think: pressure from foes on every side cannot push it under either)
 {const v={confidence:0,outmatched:1,overwhelmed:1,cohesion:0,closest:10};R(g2).mor=31;for(let i=0;i<60;i++)R(g2).step(.1,v);ok(R(g2).mor>=t.MORALE.waver&&!R(g2).routed&&R(g2).state!=='wavering','six seconds outmatched and overwhelmed: still '+R(g2).state+' ('+R(g2).mor.toFixed(1)+')')}
 b.t+=CP.stand.dur+.01;ok(!R(g1).standing(),'after '+CP.stand.dur+' s it ends');R(g1).shock(20);ok(R(g1).mor<t.MORALE.waver&&R(g1).state==='wavering','and a shock can take them to wavering again ('+R(g1).mor.toFixed(1)+')');
 ok(/^Ready in/.test(t.powerWhyNot(0,'stand'))||t.powerCd(0,'stand')<=CP.stand.dur,'(its cooldown runs on: '+t.powerWhyNot(0,'stand')+')');
 b.noMorale=true;b.t+=CP.stand.cd;ok(t.powerWhyNot(0,'stand')==='Morale is off'&&t.powerWhyNot(0,'rally')==='Morale is off','with morale off neither Rally nor Stand Fast! can be used');b.noMorale=false;
 b.deploy=true;ok(t.powerWhyNot(0,'stand')==='Start the battle first','nor while deploying');b.deploy=false;
 b.over=true;ok(t.powerWhyNot(0,'stand')==='The battle is over','nor once it is over');b.over=false;
 // ---- the AI uses each (theirs always; yours under Auto)
 const think=()=>{b.cpT=0;t.powersThink(.01)};
 f=start([{type:'hum_foot',count:8}],[{type:'brann',count:1},{type:'hum_foot',count:8},{type:'hum_foot',count:8}],{},[[0,0]],[[0,0],[0,-90],[0,90]]);
 b=f.b;let [ec2,e1,e2]=f.fs;b.cmdLead={1:0};
 think();ok(!b.cmdp,'(nothing to do: no power used)');
 R(e1).route();think();ok(b.cmdp&&b.cmdp[1].rally&&!R(e1).routed,'their commander rallies a routing group in his range');
 R(e2).mor=15;R(e2).refreshState();think();ok(b.cmdp[1].stand&&R(e2).standing(),'and calls Stand Fast! when one in range wavers');
 f=start([{type:'hum_foot',count:8}],[{type:'brann',count:1},{type:'hum_foot',count:8},{type:'hum_foot',count:8}],{},[[0,0]],[[0,0],[-60,-40],[-60,40]]);
 b=f.b;[ec2,e1,e2]=f.fs;b.cmdLead={1:0};think();ok(!b.cmdp,'(the lines far apart: no Stand Fast!)');
 f.ms[0].placeAt(e1.ax-100,Y());f.ms[0].units.forEach(u=>{u.x=f.ms[0].ax+(u.sx||0);u.y=f.ms[0].ay+(u.sy||0)});think();
 ok(b.cmdp&&b.cmdp[1].stand&&R(e1).standing()&&R(e2).standing(),'as the lines are about to meet (within '+CP.stand.meet+' px) it calls Stand Fast!');
 // yours under Auto
 f=start([{type:'hero',count:1},{type:'hum_foot',count:8}],[{type:'hum_foot',count:6}],{},[[0,0],[0,-90]]);b=f.b;R(f.ms[1]).route();
 think();ok(!b.cmdp||!b.cmdp[0],'your commander uses nothing on his own while you command');
 b.auto=true;think();ok(b.cmdp&&b.cmdp[0].rally&&!R(f.ms[1]).routed,'under Auto (A) the AI rallies for you');b.auto=false;
 // ---- the commander bar, its keys, the radius on the field
 f=start([{type:'hero',count:1},{type:'hum_foot',count:8},{type:'hum_foot',count:8}],[{type:'hum_foot',count:6}],{},[[0,0],[0,-90],[0,90]]);b=f.b;b.cmdLead={0:0};
 t.bhudPowers();let bar=document.getElementById('bCmd');const btn=id=>bar.querySelector('[data-power="'+id+'"]');
 ok(bar&&!bar.hidden&&['rally','stand'].every(id=>btn(id))&&btn('rally').querySelector('.k').textContent==='Z'&&btn('stand').querySelector('.k').textContent==='S','the commander bar: Rally the Line (Z), Stand Fast! (S)');
 ok(!btn('scout')&&[...bar.querySelectorAll('[data-power]')].map(x=>x.dataset.power).join()==='rally,stand'&&bar.querySelector('#bAuto')&&!('scout' in CP)&&t.POWER_ORDER.join()==='rally,stand'&&!/scout/i.test(bar.getAttribute('aria-label')),'no Scout on it (the commander’s Scout is gone, the owner 2026-10-20): Rally, Stand Fast! and the AI button');
 ok(bar.className==='cmdbar'&&!bar.closest('.borders')&&btn('stand').classList.contains('cbtn')&&!btn('stand').classList.contains('obtn'),'apart from the order bar and its unit abilities, a style of its own');
 ok(/Stand Fast!/.test(btn('stand').title)&&/Cooldown 45 s/.test(btn('stand').title)&&/within range/.test(btn('stand').title)&&/radius 220 px/.test(btn('stand').title),'its tooltip: name, effect, cooldown, radius, “needs the units within range”');
 ok(btn('rally').classList.contains('off')&&btn('rally').getAttribute('aria-disabled')==='true'&&/Unavailable: No routing or wavering/.test(btn('rally').title),'Rally dimmed with its reason while no one routs or wavers');
 const key=k=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Key'+k.toUpperCase(),bubbles:true}));
 G.mode='battle';key('s');ok(b.cmdp&&b.cmdp[0].stand&&R(f.ms[1]).standing(),'the S key calls Stand Fast!');
 t.bhudPowers();ok(btn('stand').classList.contains('on')&&btn('stand').querySelector('.ct').textContent==='45'&&parseFloat(btn('stand').querySelector('.ccd').style.getPropertyValue('--cd'))>350,'lit while on, its cooldown sweep full and the seconds shown ('+btn('stand').querySelector('.ct').textContent+')');
 L.step(120);t.bhudPowers();const sw=parseFloat(btn('stand').querySelector('.ccd').style.getPropertyValue('--cd'));ok(sw<360&&sw>300,'the sweep empties as the cooldown runs ('+sw+'°)');
 R(f.ms[2]).route();btn('rally').dispatchEvent(new MouseEvent('click',{bubbles:true}));ok(b.cmdp[0].rally&&!R(f.ms[2]).routed,'a click (or tap) on Rally the Line rallies');
 const cs=t.KEYS.find(k=>k[0]==='Battle')[1].find(k=>k[0]==='Z S');ok(cs&&/Rally the Line/.test(cs[1])&&/Stand Fast!/.test(cs[1])&&!/Scout/.test(cs[1]),'the controls list has them (Z S), no Scout');
 btn('stand').dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));ok(b.cmdHov==='stand','pointing at a power arms its radius on the field');
 {let arcs=0;const c=t.ctx,a0=c.arc;c.arc=function(){arcs++;return a0.apply(this,arguments)};try{t.drawCommandPowers()}finally{c.arc=a0}ok(arcs>=1,'which is drawn round your commander ('+arcs+' arc)')}
 bar.dispatchEvent(new PointerEvent('pointerleave'));ok(b.cmdHov===null,'and goes when the pointer leaves');
 // ---- no order: a character's fall-back goes on, Auto stays as it is
 {const h=b.hero,S=t.charState(h),hgr=b.groups[h.grp];b.t+=CP.stand.cd+1;S.fallBack={at:b.t,x:h.x-40,y:h.y,ord:t.ordKey(hgr)};const seq=Object.values(b.groups).map(g=>g.orderSeq|0).join();
  key('s');t.fallLook(h,S);
  ok(b.cmdp[0].stand.at===b.t&&S.fallBack&&Object.values(b.groups).map(g=>g.orderSeq|0).join()===seq,'a power is no order: no group’s order count moves, your hero’s fall-back goes on');
  b.t+=CP.rally.cd+1;b.auto=true;R(f.ms[1]).route();key('z');ok(b.cmdp[0].rally.at===b.t&&b.auto,'nor does it take command back from Auto');b.auto=false;
  S.fallBack={at:b.t,x:h.x-40,y:h.y,ord:t.ordKey(hgr)};t.selectGroup(h.grp);t.toggleFlag('firm');t.fallLook(h,S);ok(!S.fallBack,'(while a flag to the hero’s group ends it, as ever)')}
 // ---- no Scout in the fog either: no power sees through it, the AI's commander uses none, the fog stays over the enemy
 {const r=start([{type:'hero',count:1},{type:'hum_foot',count:8}],[{type:'brann',count:1},{type:'hum_foot',count:8}],{fog:true,deploy:true},[[0,0],[0,-60]],[[0,0],[0,-60]]);b=r.b;b.cmdLead={0:0,1:0};t.sightStep(true);
  const theirs=()=>b.units.filter(u=>u.team===1&&u.hp>0),mine=()=>b.units.filter(u=>u.team===0&&u.hp>0);
  t.bhudPowers();bar=document.getElementById('bCmd');ok(!btn('scout')&&t.powerWhyNot(0,'scout')==='Unknown power'&&!t.usePower(0,'scout'),'with fog of war there is still no Scout button, and no such power');
  G.mode='battle';key('o');ok(!b.cmdp||!b.cmdp[0],'O calls no power');
  t.beginFight();mine().forEach(u=>{u.s={...u.s,spd:0}});theirs().forEach(u=>{u.s={...u.s,spd:0}});L.step(30);
  ok(!(b.cmdp&&b.cmdp[1]&&b.cmdp[1].scout)&&!mine().some(u=>t.seenBy(1,u))&&!theirs().some(u=>t.seenBy(0,u)),'their commander scouts nothing at the fight’s start: each side sees none of the other through the fog')}
 // ---- the lab's keys
 ok(L.validate({leftGroups:[{type:'hum_foot',count:2}],rightGroups:[{type:'hum_foot',count:2}]}).powers===undefined,'the lab leaves the powers key out when not given (old configurations unchanged)');
 {const c=L.validate({leftGroups:[{type:'hum_foot',count:2}],rightGroups:[{type:'hum_foot',count:2},{type:'hum_bow',count:2}],powers:true,commander:{left:null,right:{group:1,lead:7}}});ok(c.powers===true&&c.commander.left===null&&c.commander.right.group===1&&c.commander.right.lead===7,'and keeps powers and commander when given')}
 let bad=0;for(const x of [{powers:1},{commander:{right:{group:5}}},{commander:{left:{lead:11}}},{commander:[]}])try{L.validate({leftGroups:[{type:'hum_foot',count:2}],rightGroups:[{type:'hum_foot',count:2}],...x})}catch(e){bad++}ok(bad===4,'and refuses bad ones ('+bad+'/4)');
 f=start([{type:'hum_foot',count:4}],[{type:'hum_foot',count:4},{type:'hum_bow',count:4}],{commander:{left:null,right:{group:1,lead:7}}});b=f.b;
 const fc=t.commanderOf(1);ok(fc&&fc.grp===f.fs[1].id&&t.commanderLead(1)===7&&t.commanderOf(0)===null,'commander: forces theirs (a soldier of row 1, Leadership 7) and none for you');
 // ---- AI-vs-AI balance smoke: a short battle with both commanders, nothing thrown
 f=start([{type:'brann',count:1},{type:'hum_foot',count:10},{type:'hum_bow',count:6}],[{type:'brann',count:1},{type:'hum_foot',count:10},{type:'hum_bow',count:6}],{ai:true,distance:300,commander:{left:{group:0},right:{group:0}}});b=f.b;
 L.step(600);L.step(600);ok(!ERR.length,'an AI-on-AI battle with both commanders runs ('+b.t.toFixed(1)+' s; powers used: '+['0','1'].map(k=>b.cmdp&&b.cmdp[k]?Object.keys(b.cmdp[k]).join('+'):'none').join(' / ')+')');
 // ---- no Math.random in the new code
 {const x=new XMLHttpRequest();x.open('GET','js/battle/commandpowers.js',false);x.send();ok(x.responseText.length>1000&&!/Math\.random|\brnd\(|\brint\(|\bpick\(/.test(x.responseText),'commandpowers.js draws no random numbers')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
