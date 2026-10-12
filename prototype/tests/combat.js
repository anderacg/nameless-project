'use strict';
// Hero combat: the 3-hit combo, input buffering, dodge invulnerability, the three skills, level locks, stagger, knockback,
// hit-stop, war cry buffs, the combo counter and the skill buttons.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');P.level=5;P.tree=['start','might0','might1','might2','mighta0','command0','command1','command2','commanda0'];P.slots=['whirl','leap','cry',...Array(7).fill(null)];P.troops={militia:3};P.comps={};G.mouse.in=false;
 // each test battle starts with a fully rested hero; persistence has its own suite
 const fresh=enemies=>{P.hp=P.sp=P.mp=null;G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0},list:enemies.slice()};t.startBattle({enemies,tournament:false});
   const B=t.B,h=B.hero;B.units.filter(u=>u.team===1).forEach((u,i)=>{u.x=h.x+16+i*3;u.y=h.y+(i-1)*6;u.cd=9});B.units.filter(u=>u.team===0&&!u.hero).forEach(u=>{u.x=10;u.y=30});B.aim=0;return B};
 // tick keeps the enemies alive so timing checks never end the battle early
 const tick=(B,sec)=>{for(let i=0;i<Math.round(sec/.02);i++){if(!t.B)return;B.hero.hp=Math.max(B.hero.hp,B.hero.max*.5);if(B.hx&&!B.keepSp)B.hx.sp=Math.max(B.hx.sp,40);B.units.forEach(u=>{if(u.team===1&&u.hp>0)u.hp=u.max});t.updateBattle(.02)}};
 const end=()=>{const B=t.B;if(!B)return;B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 // combo
 let B=fresh(['chief','chief']);const X=()=>B.hx||t.heroState(),h=B.hero,steps=[];
 t.swing();steps.push(X().step);tick(B,.42);t.swing();steps.push(X().step);tick(B,.42);const e0=B.units.find(u=>u.team===1&&u.hp>0),hp0=e0.hp;t.swing();steps.push(X().step);
 ok(steps.join(',')==='0,1,2','three presses inside the window chain Slash → Sweep → Finisher ('+steps.join(',')+')');
 ok(X().stop>0&&B.units.some(u=>u.team===1&&(u.stun>0||u.kx)),'the finisher knocks back, staggers and triggers hit-stop');
 const ux=B.units.filter(u=>u.team===1).map(u=>u.x).join();t.updateBattle(.01);ok(B.units.filter(u=>u.team===1).map(u=>u.x).join()===ux,'hit-stop freezes the fight for a moment');
 tick(B,2);t.swing();ok(X().step===0,'waiting too long restarts the chain');
 h.cd=.2;X().win=1;t.swing();ok(X().buf===true,'pressing mid-swing queues the next hit');tick(B,.3);ok(X().step===1&&!X().buf,'the queued hit fires when the swing ends');
 ok(X().combo>=3,'combo counter counts hits (×'+X().combo+')');tick(B,3);ok(X().combo===0,'combo counter resets after a pause');
 end();
 // dodge
 B=fresh(['militia']);const h2=B.hero,x0=h2.x,hp=h2.hp;G.keys={d:true};t.dodge();t.applyDmg(h2,40);ok(h2.hp===hp,'a dodge roll is invulnerable');
 tick(B,.4);G.keys={};ok(h2.x>x0+25,'the roll carries you ('+Math.round(h2.x-x0)+' px)');t.dodge();ok(B.hx.roll<=0,'dodge has a cooldown');end();
 // whirlwind
 B=fresh(['militia','militia','militia']);B.units.filter(u=>u.team===1).forEach((u,i)=>{const a=i*2.1;u.x=B.hero.x+Math.cos(a)*14;u.y=B.hero.y+Math.sin(a)*14});
 t.castSkill('whirl');ok(B.units.filter(u=>u.team===1).every(u=>u.hp<u.max),'Whirlwind hits enemies on every side');const cd=B.hx.cds.whirl;t.castSkill('whirl');ok(cd===t.HSKILLS.whirl.cd&&B.hx.cds.whirl===cd,'and then waits for its cooldown');end();
 // leap slam
 B=fresh(['militia','militia']);const h3=B.hero,tx=h3.x+80;B.units.filter(u=>u.team===1).forEach(u=>{u.x=tx+4;u.y=h3.y});G.mouse={x:tx,y:h3.y-6,in:true,type:'mouse'};
 t.castSkill('leap');tick(B,.45);G.mouse.in=false;ok(Math.abs(h3.x-tx)<3,'Leap Slam lands where you aim');ok(B.units.filter(u=>u.team===1&&u.hp>0).every(u=>u.stun>0)||B.units.filter(u=>u.team===1).some(u=>u.hp<=0),'and stuns enemies where it lands');end();
 // war cry and stagger
 B=fresh(['militia']);const ally=B.units.find(u=>u.team===0&&!u.hero);ally.x=B.hero.x+20;ally.y=B.hero.y;const foe=B.units.find(u=>u.team===1);
 t.castSkill('cry');ok(ally.buffT>0&&foe.stun>0,'War Cry inspires nearby troops and staggers nearby enemies');
 foe.cd=0;foe.x=B.hero.x+8;foe.y=B.hero.y;const hh=B.hero.hp;t.updateBattle(.05);ok(B.hero.hp===hh,'a staggered enemy cannot attack');
 const mul=t.matchup(ally.s,foe.s);foe.hp=foe.max;t.hit(ally,foe,10);ok(Math.abs((foe.max-foe.hp)-Math.round(10*mul*1.3))<=1,'inspired troops hit 30% harder');end();
 // stamina and mana
 B=fresh(['chief','chief']);B.keepSp=true;const Xs=B.hx||t.heroState(),h5=B.hero;
 ok(Xs.sp===t.maxSP()&&Xs.mp===t.maxMP(),'battles start with full stamina ('+t.maxSP()+') and mana ('+t.maxMP()+')');
 const sp0=Xs.sp;t.swing();ok(Xs.sp===sp0-t.STAM.swing[0],'each combo hit costs stamina ('+t.STAM.swing.join('/')+')');
 Xs.sp=3;h5.cd=0;Xs.win=0;const st0=Xs.step;t.swing();ok(Xs.step===st0&&B.floats.some(f=>f.t==='Too tired'),'too tired to swing with no stamina');
 Xs.sp=10;Xs.spT=0;t.updateBattle(.2);ok(Xs.sp===10,'stamina waits a moment before it recovers');tick(B,1.2);ok(Xs.sp>10,'then recovers ('+Math.round(Xs.sp)+')');
 Xs.sp=t.maxSP();const hx=h5.x;G.keys={d:true};tick(B,.5);const walk=h5.x-hx;h5.x=hx;G.keys={d:true,shift:true};const spr=Xs.sp;tick(B,.5);G.keys={};
 ok(h5.x-hx>walk*1.4&&Xs.sp<spr,'sprinting (Shift) is faster and drains stamina ('+Math.round(walk)+' vs '+Math.round(h5.x-hx)+' px)');
 Xs.sp=40;B.touchBlock=true;t.updateBattle(.01);const foe2=B.units.find(u=>u.team===1&&u.hp>0);foe2.x=h5.x+10;foe2.y=h5.y;B.aim=0;const hp5=h5.hp;t.hit(foe2,h5,20);
 ok(Xs.sp<40&&hp5-h5.hp<=5,'blocking a hit drains stamina instead of health');Xs.sp=0;const hp6=h5.hp;t.hit(foe2,h5,20);ok(hp6-h5.hp>=15&&B.floats.some(f=>f.t==='Guard broken'),'with no stamina the guard breaks');B.touchBlock=false;
 Xs.mp=10;Xs.sp=t.maxSP();Xs.cds.cry=0;t.castSkill('cry');ok(Xs.cds.cry===0&&Xs.mp===10&&B.floats.some(f=>f.t==='Not enough mana'),'War Cry needs 30 mana and is not spent without it');
 Xs.mp=t.maxMP();Xs.sp=5;Xs.cds.whirl=0;t.castSkill('whirl');ok(Xs.cds.whirl===0&&Xs.mp===t.maxMP(),'Whirlwind needs stamina as well as mana');
 Xs.sp=t.maxSP();t.castSkill('whirl');ok(Xs.mp===t.maxMP()-15&&Xs.sp===t.maxSP()-20,'Whirlwind costs 15 mana and 20 stamina');
 Xs.mp=0;tick(B,2);ok(Xs.mp>3,'mana trickles back ('+Xs.mp.toFixed(1)+')');
 t.buildSlotBar();t.updateSkillBar();ok(/15 MP · 20 SP/.test(document.querySelector('[data-slot="0"]').title),'skill slot buttons list their costs');
 end();
 // level locks and UI
 const tr=P.tree;P.tree=['start','might0','might1'];B=fresh(['militia']);t.castSkill('leap');ok(B.hx.cds.leap===0&&B.floats.some(f=>/Learn Leap Slam/.test(f.t)),'Leap Slam is locked until learned on the tree');
 const sl=P.slots;P.slots=['whirl','leap',...Array(8).fill(null)];P.tree=['start','might0','might1'];t.buildSlotBar();t.updateSkillBar();const lb=document.querySelector('[data-slot="1"]'),wb=document.querySelector('[data-slot="0"]');ok(lb.disabled&&/not learned/.test(lb.textContent)&&!wb.disabled,'skill slot buttons show locks and readiness');P.tree=tr;P.slots=sl;
 t.frame();end();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
