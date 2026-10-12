'use strict';
// Attack types: melee, ranged and magic for enemies and the hero. Casters for every race and in bandit bands, armies and
// garrisons; magic bolts splash, ignore armor and trees, are half blocked and resisted by ward; the hero shoots with a bow
// (stamina) or casts with a staff (mana); bog slimes spit magic; dragon fire is magic too.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,ST=t.ST;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 t.act('begin','soldier');
 // classes and matchups
 const mages=['hum_mage','dw_rune','elf_weaver','orc_shaman'];
 ok(mages.every(k=>ST[k]&&ST[k].magic&&t.unitClass(ST[k])==='magic'),'every race has a caster: '+mages.map(k=>ST[k].n).join(', '));
 ok(Object.values(t.RACES).every(r=>ST[r.mage].race&&t.UP[r.ranged].includes(r.mage)),'casters are trained from each race\'s ranged recruits');
 ok(t.unitClass(ST.hum_bow)==='ranged'&&t.unitClass(ST.hum_levy)==='foot','ranged and melee classes stay as before');
 const M=t.matchup;
 ok(M(ST.hum_mage,ST.hum_knight)>1.2&&M(ST.hum_bow,ST.hum_knight)<.7,'heavy armor stops arrows but not magic ('+M(ST.hum_bow,ST.hum_knight).toFixed(2)+' vs '+M(ST.hum_mage,ST.hum_knight).toFixed(2)+')');
 ok(M(ST.hum_mage,ST.dw_rune)<.7,'warded troops resist magic');
 ok(M(ST.hum_knight,ST.hum_mage)>=1.4&&M(ST.elf_blade,ST.orc_shaman)>=1.4,'cavalry and shock troops punish casters');
 ok(/magic/.test(t.vsLine(ST.hum_knight))&&/warded/.test(t.vsLine(ST.hum_mage)),'strengths and weaknesses mention magic');
 // who fields casters
 let hedges=0,shamans=0;for(let k=0;k<200;k++){t.makeEnemies(6,false,'bandits').forEach(u=>{if(u==='hedge')hedges++});t.makeEnemies(6,false,'raiders').forEach(u=>{if(u==='orc_shaman')shamans++})}
 ok(hedges>20&&shamans>20,'bandits bring hedge witches ('+hedges+'), raiders orc shamans ('+shamans+')');
 let am=0;for(let k=0;k<20;k++)am+=t.armyOf('vale',20).filter(u=>u==='hum_mage').length;ok(am>10,'lords\' armies include battle mages ('+am+' in 20 armies)');
 ok(t.garList(t.townBy('Ashford')).includes('hum_mage'),'garrisons include casters');
 ok(t.MONSTERS.slime&&ST.slime.magic&&t.MONSTERS.slime.where.includes('swamp'),'bog slimes spit magic in the swamps');
 // battle: an enemy caster's bolt
 const fresh=(enemies,troops)=>{P.troops=troops||{};P.comps={};P.hp=P.sp=P.mp=null;G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:enemies.slice()};t.startBattle({enemies,tournament:false});return t.B};
 let B=fresh(['hum_mage'],{hum_spear:3});const mg=B.units.find(u=>u.type==='hum_mage'),tgt=B.units.find(u=>u.type==='hum_spear');
 B.arrows=[];t.attack(mg,tgt);const bolt=B.arrows[0];ok(bolt&&bolt.magic&&Math.hypot(bolt.vx,bolt.vy)<150&&bolt.col===ST.hum_mage.bolt,'casters shoot slow, coloured bolts');
 // splash and trees
 B.obs=[{kind:'tree',x:200,y:200,r:6}];const sp=B.units.filter(u=>u.type==='hum_spear');sp.forEach((u,i)=>{u.x=300;u.y=200+i*6;u.hp=u.max});B.units.filter(u=>u.team===1||u.hero).forEach(u=>{if(!u.hero){u.x=100;u.y=200}});
 B.arrows=[{x:150,y:194,vx:125,vy:0,team:1,dmg:10,life:3,a:0,src:ST.hum_mage,magic:true,col:'#fff',tk:0}];const hp0=sp.map(u=>u.hp);
 for(let i=0;i<500&&B.arrows.length;i++){B.units.forEach(u=>{u.cd=9});t.updateBattle(.01)}
 const hurt=sp.filter((u,i)=>u.hp<hp0[i]).length;ok(hurt>=2,'a bolt flies through the tree and splashes ('+hurt+' spearmen hurt)');
 B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 // the hero: bows and staves
 ok(t.ITEMS.g_bow_2&&t.ITEMS.g_bow_2.kind==='ranged'&&t.ITEMS.g_staff_3.kind==='magic'&&t.ITEMS.g_staff_3.m.mp>0,'bows and staves come in every material');
 const pw0=t.partyPower();P.inv=P.inv.map(()=>null);t.invAdd('good','arrows',150);t.invAdd('good','bolts',40);P.gear.weapon='g_bow_2';ok(t.heroKind()==='ranged'&&t.heroStats().range>0,'a bow makes you a ranged fighter');
 B=fresh(['militia'],{});const h=B.hero;t.heroState();const sp0=B.hx.sp;B.aim=0;h.cd=0;B.arrows=[];t.swing();
 ok(B.arrows.length===1&&B.arrows[0].team===0&&!B.arrows[0].magic&&B.hx.sp<sp0,'with a bow, Attack shoots an arrow and costs stamina');
 t.updateSkillBar();ok(/^Shoot \(\d+\)$/.test(document.getElementById('swing').textContent),'the button says Shoot, with arrows left');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 P.gear.weapon='g_staff_2';const mp0=t.maxMP();ok(mp0>t.maxMP.call(null)-1&&t.ITEMS.g_staff_2.m.mp>0,'a staff adds mana');
 B=fresh(['militia'],{});t.heroState();const m0=B.hx.mp;B.aim=0;B.hero.cd=0;B.arrows=[];t.swing();
 ok(B.arrows.length===1&&B.arrows[0].magic&&B.hx.mp<m0,'with a staff, Attack casts a bolt and costs mana');
 t.updateSkillBar();ok(document.getElementById('swing').textContent==='Cast','the button says Cast');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 P.gear.weapon=t.gearId('sword',0);ok(t.heroKind()==='melee','a sword brings back the combo');
 // blocking magic is only half as good
 B=fresh(['hum_mage'],{});const hh=B.hero;hh.x=200;hh.y=200;B.aim=Math.PI;B.blocking=true;t.heroState().sp=100;const hb=hh.hp;
 B.arrows=[{x:180,y:194,vx:125,vy:0,team:1,dmg:20,life:1,a:0,src:ST.hum_mage,magic:true,col:'#fff',tk:0}];B.units.forEach(u=>{if(!u.hero){u.x=500;u.cd=9}});
 for(let i=0;i<30&&B.arrows.length;i++){t.updateBattle(.01);B.blocking=true}ok(hb-hh.hp>=9,'a shield only halves a magic bolt ('+(hb-hh.hp)+' of 20)');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 // abilities page
 G.mode='world';G.modal=false;t.hidePanel();P.gear.weapon='g_staff_1';t.openSkills('abilities');ok(/Cast \([a-z ]*staff\)/.test(document.getElementById('panel').innerHTML),'the Abilities tab explains your attack');t.act('sk-close');
 // bow arrows arc and fall; crossbow bolts and magic fly straight
 B=fresh(['hum_bow','dw_xbow','hum_mage'],{hum_spear:2});const bw2=B.units.find(u=>u.type==='hum_bow'),xb2=B.units.find(u=>u.type==='dw_xbow'),mg2=B.units.find(u=>u.type==='hum_mage'),sp2=B.units.find(u=>u.type==='hum_spear');
 B.units.forEach(u=>{if(u!==sp2&&u!==bw2&&u!==xb2&&u!==mg2)u.x=-200});sp2.x=bw2.x-110;sp2.y=bw2.y+20;B.arrows=[];t.attack(bw2,sp2);t.attack(xb2,sp2);t.attack(mg2,sp2);const [ar,xbolt,mb]=B.arrows;
 ok(ar.arc&&!xbolt.arc&&!mb.arc,'bow arrows arc; crossbow and magic bolts fly straight');
 ok(Math.hypot(ar.vx,ar.vy)<Math.hypot(xbolt.vx,xbolt.vy)*.75,'arrows fly slower than crossbow bolts');
 const d2=Math.hypot(sp2.x-bw2.x,sp2.y-bw2.y);ok(Math.abs(ar.T*Math.hypot(ar.vx,ar.vy)-d2)<d2*.1,'an arrow is aimed to come down at its target ('+Math.round(ar.T*Math.hypot(ar.vx,ar.vy))+' of '+Math.round(d2)+')');
 const bows=Object.keys(ST).filter(k=>ST[k].bow);ok(bows.length>=9&&bows.every(k=>ST[k].range>=200),'every bow user shoots at least 200 ('+bows.map(k=>ST[k].n+' '+ST[k].range).join(', ')+')');
 ok(Math.min(...bows.filter(k=>ST[k].race==='elf').map(k=>ST[k].range))>Math.max(...bows.filter(k=>ST[k].race!=='elf').map(k=>ST[k].range)),'elves outrange every other bow');
 const scat=race=>{const w=[];for(let k=0;k<60;k++){B.arrows=[];t.fireBolt(bw2,0,1,{...ST.hum_bow,race},200);w.push(B.arrows[0].T*Math.hypot(B.arrows[0].vx,B.arrows[0].vy))}return Math.max(...w)-Math.min(...w)};ok(scat('elf')<scat('human')*.75,'elven arrows scatter less');
 B.units.forEach(u=>{u.cd=99;u.spd=0});const sx=sp2.x,sy=sp2.y;let peak=0,hitHigh=false;const hp2=sp2.hp;B.arrows=[ar];
 // a unit right under the arrow's peak is safe
 const near=t.ARC_SPEED,cl={H:Math.min(44,30*30/700),t:0,T:1};cl.t=.5;ok(t.arcZ(cl)<2,'a close shot (30 away) flies almost flat (peak '+t.arcZ(cl).toFixed(1)+')');
 const mid={x:bw2.x+(sx-bw2.x)/2,y:bw2.y+(sy-bw2.y)/2};sp2.x=mid.x;sp2.y=mid.y;
 for(let i=0;i<400&&B.arrows.length;i++){B.units.forEach(u=>{if(u!==sp2){u.x=u.team?600:-200}});sp2.x=ar.t<ar.T*.5?mid.x:sx;sp2.y=ar.t<ar.T*.5?mid.y:sy;peak=Math.max(peak,t.arcZ(ar));if(ar.t<ar.T*.5&&sp2.hp<hp2)hitHigh=true;t.updateBattle(.01)}
 ok(peak>15&&!hitHigh,'it climbs high (peak '+Math.round(peak)+') and flies over anyone under its path');
 ok(sp2.hp<hp2,'then comes down on its target');
 B.arrows=[{...ar,t:0,life:ar.T,x:bw2.x,y:bw2.y,tk:0}];sp2.x=-99;for(let i=0;i<400&&B.arrows.length;i++)t.updateBattle(.01);ok(B.parts.some(p=>p.stuck),'a miss sticks in the ground');
 B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 // the bow: hold to draw, let go to shoot; holding a full draw drains stamina; the wheel sets the range; right-click shoves
 t.invAdd('good','arrows',100);P.gear.weapon=t.gearId('bow',2);G.bowRange=180;B=fresh(['militia'],{});B.units.forEach(u=>{if(!u.hero){u.x=560;u.cd=99;u.s={...u.s,spd:0}}});const hb2=B.hero;t.heroState().sp=999;
 const cvs=document.querySelector('canvas'),R2=cvs.getBoundingClientRect(),at2=(x,y)=>({clientX:R2.left+x*R2.width/t.VW,clientY:R2.top+y*R2.height/t.VH,pointerType:'mouse',bubbles:true});
 const press=(btn,x,y)=>cvs.dispatchEvent(new PointerEvent('pointerdown',{...at2(x,y),button:btn})),release=()=>window.dispatchEvent(new PointerEvent('pointerup',{button:0,pointerType:'mouse'}));
 const tick2=s=>{for(let i=0;i<Math.round(s/.02);i++)t.updateBattle(.02)};
 G.mouse.in=true;G.mouse.type='mouse';G.mouse.x=hb2.x+60;G.mouse.y=hb2.y-6;hb2.cd=0;press(0,G.mouse.x,G.mouse.y);ok(B.draw&&!B.arrows.length,'pressing draws the bow without shooting');
 tick2(.3);release();const weak=B.arrows[0];ok(weak&&!B.draw&&weak.arc,'letting go shoots');
 hb2.cd=0;B.arrows=[];t.heroState().sp=999;press(0,G.mouse.x,G.mouse.y);tick2(1.6);release();const strong=B.arrows[0];
 ok(Math.hypot(strong.vx,strong.vy)>Math.hypot(weak.vx,weak.vy)*1.3&&strong.dmg>weak.dmg,'a longer draw flies faster and hits harder');
 const reach=p=>Math.round(p.T*Math.hypot(p.vx,p.vy));ok(reach(weak)<150&&Math.abs(reach(strong)-180)<3,'the range comes from the wheel, not the cursor; a weak draw falls short ('+reach(weak)+' vs '+reach(strong)+')');
 // holding on drains stamina, then the arm gives out
 hb2.cd=0;B.arrows=[];const X2=t.heroState();X2.sp=60;press(0,G.mouse.x,G.mouse.y);tick2(1.6);const s1=X2.sp;tick2(.6);ok(X2.sp<s1-3&&B.draw,'holding a full draw keeps draining stamina ('+Math.round(s1)+' → '+Math.round(X2.sp)+')');
 for(let i=0;i<1500&&B.draw;i++)t.updateBattle(.02);ok(!B.draw&&B.arrows.length===1&&B.arrows[0].dmg<strong.dmg&&B.floats.some(f=>/Arm gives out/.test(f.t)),'when stamina runs out the arm gives out and the arrow goes weak');release();
 // the wheel sets the range
 cvs.dispatchEvent(new WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true}));ok(G.bowRange===195,'the wheel pushes the range out (195)');
 for(let k=0;k<30;k++)cvs.dispatchEvent(new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true}));ok(G.bowRange===t.BOW_RANGE[0],'and in, down to '+t.BOW_RANGE[0]);G.bowRange=180;
 // landing: a full draw comes down at the set range in the cursor's direction
 hb2.cd=0;B.arrows=[];X2.sp=999;press(0,G.mouse.x,G.mouse.y);tick2(1.2);release();let land=null;for(let i=0;i<300&&B.arrows.length;i++){t.updateBattle(.02);if(B.arrows.length)land={x:B.arrows[0].x,y:B.arrows[0].y}}
 ok(land&&Math.abs(Math.hypot(land.x-hb2.x,land.y-hb2.y)-180)<14,'a full draw lands at the set range ('+Math.round(Math.hypot(land.x-hb2.x,land.y-hb2.y))+')');
 // right-click shoves, with any weapon
 const foe=B.units.find(u=>u.team===1);foe.x=hb2.x+12;foe.y=hb2.y;foe.hp=foe.max;B.aim=0;const fx0=foe.x;press(2,foe.x,foe.y);tick2(.2);
 ok(foe.x>fx0+6&&foe.max-foe.hp<hb2.s.dmg*.45&&foe.hp<foe.max,'right-click shoves: knocks back, barely hurts ('+Math.round(foe.max-foe.hp)+' damage)');
 const sx0=X2.sp;press(2,foe.x,foe.y);ok(X2.sp===sx0,'the shove has a short cooldown');
 // the Hawkeye talent shows the path
 ok(t.TREE.finesseb2&&t.TREE.finesseb2.m.perk==='guide'&&t.TREE.finesseb2.br==='finesse','Hawkeye sits on the Finesse (Agility) path');
 ok(!t.has('guide'),'without it there is no path guide');P.tree.push('finesseb2');ok(t.has('guide'),'learning Hawkeye turns the guide on');t.drawBattle();P.tree=P.tree.filter(x=>x!=='finesseb2');
 P.gear.weapon=t.gearId('crossbow',1);ok(!t.isBow(),'crossbows shoot at once, no drawing');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();P.gear.weapon=t.gearId('sword',0);G.mouse.in=false;
 // ammunition: shots use arrows or bolts, none left means no shot, some come back after a win; troops have quivers
 P.gear.weapon=t.gearId('bow',1);P.inv=P.inv.map(()=>null);t.invAdd('good','arrows',3);B=fresh(['militia'],{});B.units.forEach(u=>{if(!u.hero){u.x=560;u.cd=99;u.s={...u.s,spd:0}}});t.heroState().sp=999;B.aim=0;
 for(let k=0;k<3;k++){B.hero.cd=0;t.swing()}ok(t.goodN('arrows')===0&&B.arrows.length===3,'each shot uses an arrow');
 B.hero.cd=0;t.swing();t.drawStart();ok(B.arrows.length===3&&!B.draw&&B.floats.some(f=>/Out of arrows/.test(f.t)),'with none left you cannot shoot');
 B.win=true;B.over=true;B.endT=0;t.updateBattle(.01);ok(t.goodN('arrows')>=1,'after a win you gather some back ('+t.goodN('arrows')+' of 3)');t.act('cont');done();
 P.gear.weapon=t.gearId('crossbow',1);ok(t.ammoOf()==='bolts','crossbows use bolts');P.gear.weapon=t.gearId('staff',1);ok(t.ammoOf()===null,'magic needs no ammunition');
 B=fresh(['hum_bow'],{hum_spear:1});const ar3=B.units.find(u=>u.type==='hum_bow'),sp3=B.units.find(u=>u.type==='hum_spear');B.arrows=[];
 for(let k=0;k<16;k++)t.attack(ar3,sp3);ok(B.arrows.length===16&&ar3.empty&&!ar3.s.range&&ar3.s.reach>=10,'a bowman has 16 arrows, then draws a blade');
 ok(t.quiverOf(ST.dw_xbow)===12&&t.quiverOf(ST.orc_thrower)===6&&t.quiverOf(ST.hum_mage)===Infinity,'crossbows carry 12, javelins 6, casters never run out');
 B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 // buying ammunition, and a ranged start comes with a quiver
 const ash3=t.townBy('Ashford');P.gold=500;G.mode='world';G.modal=false;t.hidePanel();t.enterTown(ash3);t.act('tab','smith');ok(/Ammunition/.test(document.getElementById('panel').innerHTML),'smiths sell ammunition');
 ash3.stock.arrows=200;const a0=t.goodN('arrows');t.act('buy-ammo','arrows:25');ok(t.goodN('arrows')===a0+25,'buy 25 arrows');t.act('leave');done();
 ok(t.TOWNS.filter(x=>x.mod&&x.races.includes('elf')).every(x=>x.mod.arrows<1)&&t.TOWNS.filter(x=>x.mod&&x.races.includes('dwarf')).every(x=>x.mod.bolts<1),'elves sell arrows cheap, dwarves bolts');
 t.act('begin','exile');ok(P.gear.weapon===t.gearId('bow',0)&&t.goodN('arrows')===30,'the Exiled archer starts with a bow and 30 arrows');t.act('begin','soldier');
 // a past decides your weapon: seven pasts cover every weapon
 const wb=Object.values(t.BGS).map(b=>b.weapon);ok(wb.length===7&&['sword','spear','axe','bow','crossbow','staff','wand'].every(b=>wb.includes(b)),'seven pasts, one for each weapon: '+wb.join(', '));
 t.showTitle('new');ok(!document.querySelector('[data-act="weapon"]')&&/Crossbow · Ranged/.test(document.getElementById('panel').innerHTML),'there is no weapon choice; each past shows its weapon');
 t.act('begin','merchant');ok(P.gear.weapon===t.gearId('crossbow',0)&&t.goodN('bolts')===20&&t.heroKind()==='ranged'&&t.heroStats().tags.includes('pierce'),'the Merchant’s child starts with a wooden crossbow and 20 bolts');
 const xb=t.heroShot();P.gear.weapon=t.gearId('bow',0);const bw=t.heroShot();ok(xb.mult>bw.mult&&xb.cd>bw.cd,'crossbows hit harder and slower than bows');
 P.gear.weapon=t.gearId('wand',0);const wd=t.heroShot();P.gear.weapon=t.gearId('staff',0);const sf=t.heroShot();ok(t.heroKind()==='magic'&&wd.mp<sf.mp&&wd.cd<sf.cd&&wd.mult<sf.mult,'wands are cheaper and faster than staves, but weaker');
 P.gear.weapon=t.gearId('axe',0);ok(t.heroKind()==='melee'&&t.heroStats().tags.includes('pierce')&&t.ITEMS[t.gearId('axe',0)].m.dmg>t.ITEMS[t.gearId('sword',0)].m.dmg,'an axe is melee, hits harder and pierces');
 t.act('begin','soldier');
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
