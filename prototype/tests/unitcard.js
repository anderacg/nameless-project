'use strict';
// Unit cards, as in Total War: a troop's numbers, abilities and costs in the Recruit tab before you hire or train it; and vigor,
// how long a unit keeps its wind in battle.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,ST=t.ST;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
 const panel=()=>document.getElementById('panel').innerHTML;
 // vigor
 ok(t.vigorOf(ST.hum_levy)===100,'a levy has the base vigor (100)');
 ok(t.vigorOf(ST.hum_guard)<t.vigorOf(ST.hum_pike),'heavy armour tires: a shield guard has less than a pikeman ('+t.vigorOf(ST.hum_guard)+' against '+t.vigorOf(ST.hum_pike)+')');
 ok(t.vigorOf(ST.dw_clan)>t.vigorOf(ST.hum_levy)&&t.vigorOf(ST.elf_glade)>t.vigorOf(ST.hum_levy),'dwarves and elves are hardier than men');
 ok(t.vigorOf(ST.hum_spear)>t.vigorOf(ST.hum_levy),'training adds to it');
 {const a={s:ST.hum_levy,sta:50,vig:1},b={s:ST.dw_clan,sta:50,vig:t.vigorOf(ST.dw_clan)/100};t.fatigueStep(a,1,true,false,false,false);t.fatigueStep(b,1,true,false,false,false);
  ok(50-b.sta<50-a.sta,'in battle, the hardier one tires slower ('+(50-a.sta).toFixed(2)+' against '+(50-b.sta).toFixed(2)+' a second)');
  a.sta=b.sta=50;t.fatigueStep(a,1,false,false,false,false);t.fatigueStep(b,1,false,false,false,false);ok(b.sta-50>a.sta-50,'and gets its wind back faster')}
 // the numbers and abilities
 const nums=k=>t.unitNumbers(ST[k]).map(r=>r[1]),abil=k=>t.unitAbilities(ST[k]).map(r=>r[0]);
 ok(['Health','Melee attack','Reach','Speed','Vigor','Charge bonus'].every(n=>nums('hum_levy').includes(n)),'a foot soldier: health, melee attack, reach, speed, vigor, charge bonus');
 ok(['Missile attack','Range','Ammunition'].every(n=>nums('hum_bow').includes(n))&&!nums('hum_bow').includes('Charge bonus'),'an archer: missile attack, range and ammunition, no charge');
 ok(abil('hum_knight').includes('Cavalry charge')&&abil('hum_knight').includes('Heavy armour')&&abil('hum_knight').includes('Wedge'),'a knight: cavalry charge, heavy armour, wedge');
 ok(abil('hum_pike').includes('Set spears')&&abil('hum_bow').includes('Longshot')&&abil('elf_archer').includes('Elven aim')&&abil('hum_mage').includes('Magic bolts')&&abil('dw_xbow').includes('Direct fire'),'pikes brace, bows outrange, elves aim true, mages cast, crossbows shoot flat');
 // the card
 {const c=t.unitCard('hum_knight');ok(/Knight/.test(c)&&/Cavalry/.test(c)&&/\+90%/.test(c)&&/Strong vs/.test(c)&&/Upkeep 1g a day/.test(c)&&/<img/.test(c),'a knight’s card: name, class, charge bonus, strong and weak, upkeep (riders cost more), picture')}
 {const c=t.unitCard('hum_levy');ok(/Armour/.test(c)&&/Morale/.test(c)&&!/Missile attack/.test(c)&&t.unitCard('hum_bow').includes('Missile attack'),'a card shows only the numbers its unit has (a levy no missile attack), armour among them');
  const live=new t.UnitCard({key:'hum_foot',s:ST.hum_foot,name:'Footman',sub:'',now:{mor:20,spd:ST.hum_foot.spd*.85},strength:{fit:7,max:10,hurt:2},abil:[]}).html();
  ok(/uc-bar"><i[^>]*><\/i><i class="dn"/.test(live)&&/7 \/ 10 · 2 hurt/.test(live)&&/class="bad">20</.test(live),'its numbers now against its own: what lowers them a red end, the value in red; its strength, fit and hurt')}
 {const c=t.unitCard('hum_spear','hum_levy');ok(/against Levy/.test(c)&&/▲/.test(c),'a training’s card marks the gains over the troop it comes from')}
 // in a holding: click a troop for its card
 const ash=t.townBy('Ashford');P.troops={hum_levy:3};P.gold=500;P.rep[ash.name]=90;ash.vol=5;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(ash);t.act('tab','recruit');
 ok(document.getElementById('panel').classList.contains('wide'),'a town’s window is the larger one');
 const card=()=>{const e=document.querySelector('.reccard .ucard-x');return e&&e.dataset.unit};
 // (the Barracks lists its recruits and trainings as cards now, window.js railCard: a card picks as a row did, .sel marks it)
 const hires=[...document.querySelectorAll('.rec-row[data-act="rec-pick"]')].map(e=>e.dataset.arg);ok(hires.length>=2&&card()===hires[0],'the first troop’s card shows until you pick ('+card()+')');
 t.act('rec-pick',hires[1]);ok(card()===hires[1]&&document.querySelector('.rec-row.sel').dataset.arg===hires[1],'click another: its card, its row marked');
 t.act('rec-tab','train');const tr=[...document.querySelectorAll('.rec-row[data-act="rec-pick"]')].map(e=>e.dataset.arg).find(a=>a.includes('>'));t.act('rec-tab','hire');
 {const W=window.matchMedia;window.matchMedia=()=>({matches:true});try{t.act('rec-info',tr)}finally{window.matchMedia=W}}ok(tr&&document.querySelector('.rec-info .ucard-x')?.dataset.unit===tr.split('>')[1]&&/against Levy/.test(panel()),'a training’s card: the trained troop, against the one it comes from (on a small screen, over the list)');t.act('rec-info-back');ok(!G.town.info&&document.querySelector('.rec-rows'),'Back: the list again');
 const n0=P.troops.hum_levy||0;t.act('hire','hum_levy');ok(P.troops.hum_levy===n0+1,'hiring still works from the list');
 t.act('leave');G.mode='world';t.showPanel('<p>x</p>');ok(!document.getElementById('panel').classList.contains('wide'),'other windows keep their size');t.hidePanel();
 // the roster: each race hires a shield line too; every troop has a look, a sprite, and a shield only if it carries one
 {const lines=['melee','shield','ranged','horse'],tree=k=>[k,...(t.UP[k]||[]).flatMap(tree)],all=Object.keys(t.RACES).flatMap(r=>lines.flatMap(l=>tree(t.RACES[r][l])));
  ok(Object.keys(t.RACES).every(r=>t.RACES[r].shield&&t.HIRE[t.RACES[r].shield]&&t.tagsOf(ST[t.RACES[r].shield]).includes('shield')),'every race hires shield infantry ('+Object.keys(t.RACES).map(r=>ST[t.RACES[r].shield].n).join(', ')+')');
  ok(all.length>=55,'the race troop trees hold '+all.length+' troops');
  const bad=all.filter(k=>!ST[k]||!t.PEOPLE_LOOK[k]||!!t.PEOPLE_LOOK[k].shield!==t.tagsOf(ST[k]).includes('shield'));ok(!bad.length,'each has its own look, and a shield trait exactly when its look carries a shield'+(bad.length?' ('+bad.join(', ')+')':''));
  const nos=all.filter(k=>{try{const c=t.unitSprite(k,0,false,0);return !(c&&c.width>0)}catch(e){return true}});ok(!nos.length,'and a sprite'+(nos.length?' (missing: '+nos.join(', ')+')':''));
  ok(t.townBy('Ashford').hires('human').includes('hum_foot'),'towns hire the shield line')}
 ok(!t.tagsOf(ST.hum_levy).includes('shield')&&abil('hum_levy').includes('Set spears')&&!abil('hum_levy').includes('Shield wall'),'a levy carries a spear and no shield: it braces, and cannot form a shield wall');
 ok(abil('hum_foot').includes('Shield')&&abil('hum_foot').includes('Shield wall')&&/Shield infantry/.test(t.unitCard('hum_foot')),'a footman: a shield, a shield wall, shield infantry');
 ok(ST.hum_hbow.mounted&&ST.hum_hbow.range>0&&/Missile cavalry/.test(t.unitCard('hum_hbow'))&&abil('hum_hbow').includes('Horse archer')&&t.vigorOf(ST.hum_hbow)>t.vigorOf(ST.hum_bow),'mounted archers: riders who shoot (missile cavalry), with a rider\u2019s vigor');
 // shields in battle: missiles at the front do less; only shields make a shield wall
 {P.troops={hum_foot:4,hum_levy:4};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});const B=t.B;
  const f=B.units.find(u=>u.type==='hum_foot'),l=B.units.find(u=>u.type==='hum_levy');f.dir=l.dir=0;f.inSlot=l.inSlot=false;f.grp=l.grp=null;
  ok(t.shieldMul(f,{x:f.x+50,y:f.y,arrow:true})===t.SHIELD_ARROWS&&t.shieldMul(f,{x:f.x-50,y:f.y,arrow:true})===1&&t.shieldMul(l,{x:l.x+50,y:l.y,arrow:true})===1,'a shield takes '+Math.round((1-t.SHIELD_ARROWS)*100)+'% off missiles at its front (not from behind; a levy has none)');
  ok(t.shieldMul(f,{x:f.x+20,y:f.y})===1,'and nothing off a blow in melee (that is the shield wall)');
  B.over=true;B.endT=0;t.B=null}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
