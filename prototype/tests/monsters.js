'use strict';
// Monsters: habitats, hunting vs passive, abilities, levels, XP and loot, gear stats, trophy sales, save/load.
// The BAL lines report how a 12-troop army fares against each monster; they never fail.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,MONSTERS=t.MONSTERS,ST=t.ST;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const reset=()=>{G.mode='world';G.modal=false;G.enc=null;t.hidePanel()};
 t.act('begin','soldier');W.critters=[];W.sites=[];W.lords.forEach(l=>{l.x=-999;l.y=-999});// nothing else in the way of the chases
 ok(W.monsters.length===t.MONSTER_START,t.MONSTER_START+' monsters roam a new world');
 for(let d=0;d<40;d++){G.day++;t.monsterDay()}
 ok(W.monsters.filter(m=>!MONSTERS[m.id].mythic).every(m=>MONSTERS[m.id].where.some(w=>t.habitatAt(m.hx,m.hy).includes(w))),'every monster spawned in its habitat ('+W.monsters.length+' now)');
 ok(new Set(W.monsters.map(m=>m.id)).size>=5,'variety: '+[...new Set(W.monsters.map(m=>m.id))].join(', '));
 // hunting vs waiting
 const near=(id,lv)=>{const m={id,x:P.x+40,y:P.y,hx:P.x+40,hy:P.y,lv:lv||1,n:MONSTERS[id].count[0],cool:0,t:9,a:0};W.monsters.push(m);return m};
 G.encCool=0;P.troops={};let tg=near('tiger');const d0=Math.hypot(tg.x-P.x,tg.y-P.y);t.updateMonsters(.5);ok(Math.hypot(tg.x-P.x,tg.y-P.y)<d0,'tigers hunt you');
 W.monsters=W.monsters.filter(m=>m!==tg);
 const boar=near('boar');for(let k=0;k<20;k++)t.updateMonsters(.1);ok(G.mode==='world','boars leave you alone');
 G.chase=boar;for(let k=0;k<200&&G.mode==='world';k++)t.updateWorld(.05);ok(G.mode==='dialog'&&G.enc.kind==='monster','clicking a boar hunts it');t.act('flee');reset();W.monsters=W.monsters.filter(m=>m!==boar);
 // abilities, levels and rewards
 P.troops={hum_spear:8,hum_long:4};P.inv=Array(t.INV_SIZE).fill(null);
 const win=(id,lv,force)=>{const m=near(id,lv);if(force)MONSTERS[id].gear=MONSTERS[id].gear.map(([g])=>[g,1]);G.encCool=0;t.startMonster(m);
   const xp0=P.xp+P.level*1000;t.act('fight');const B=t.B,mu=B.units.find(u=>u.type===MONSTERS[id].unit);
   let seen={pounce:0,web:0,heal:0},i=0;
   while(t.B&&i<12000){B.units.forEach(u=>{if(u.team===0)u.hp=u.max});const hp=mu.hp;t.updateBattle(.033);if(t.B){t.frame();
     if(B.floats.some(f=>f.t==='POUNCE'))seen.pounce=1;if(B.units.some(u=>u.slow>0))seen.web=1;if(mu.hp>hp&&mu.hp>0)seen.heal=1}i++}
   return{m,mu,seen,xp:P.xp+P.level*1000-xp0}};
 let r=win('tiger',3,true);ok(r.mu.max>ST.tiger.hp,'level 3 tiger is tougher ('+r.mu.max+' hp vs '+ST.tiger.hp+')');ok(r.seen.pounce,'tigers pounce');
 ok(t.invCount('mat','tigerpelt')===1&&t.invCount('gear','clawblade')===1,'tiger drops a pelt and the claw blade into the inventory');ok(!W.monsters.includes(r.m),'slain monster leaves the map');t.act('cont');done();
 r=win('spider',1);ok(r.seen.web,'spiders web your fighters');t.act('cont');done();
 r=win('troll',1);ok(r.seen.heal,'trolls regenerate');t.act('cont');done();
 // gear
 const slotOf=(k,id)=>P.inv.findIndex(x=>x&&x.k===k&&x.id===id),dmg0=(P.gear.weapon=null,t.heroStats().dmg);G.mode='world';t.openInv();ok(G.mode==='inv'&&document.querySelectorAll('.invgrid .slot').length===t.INV_SIZE,'inventory opens with '+t.INV_SIZE+' slots');t.act('inv-equip',String(slotOf('gear','clawblade')));
 ok(P.gear.weapon==='clawblade'&&Math.abs(t.heroStats().dmg-dmg0-3)<.01,'equipping the claw blade adds 3 damage');
 ok(/Tiger Claw Blade/.test(document.getElementById('panel').innerHTML)&&document.querySelectorAll('.slot canvas').length>0,'inventory shows the weapon with icons');
 t.act('inv-unequip','weapon');ok(!P.gear.weapon&&slotOf('gear','clawblade')>=0,'unequip returns it to the bag');t.act('inv-equip',String(slotOf('gear','clawblade')));t.act('inv-close');
 P.gear.charm='griffcharm';ok(t.gm('travel')===.15,'charm bonuses add up');
 // market
 t.invAdd('mat','tigerpelt',2);const g0=P.gold;G.lastTown=null;t.enterTown(t.townBy('Ashford'));t.act('tab','trade');t.act('sell-loot',String(slotOf('mat','tigerpelt')));ok(P.gold>g0&&!t.invCount('mat','tigerpelt'),'sell trophies (+'+(P.gold-g0)+'g)');
 t.invAdd('gear','bearcoat',1);const g1=P.gold;t.act('tab','trade');t.act('sell-item',String(slotOf('gear','bearcoat')));ok(P.gold>g1&&!t.invCount('gear','bearcoat'),'sell spare gear (+'+(P.gold-g1)+'g)');t.act('leave');done();
 // save and load
 const n=W.monsters.length;t.saveGame();W.monsters=[];P.gear.weapon=null;t.act('load');ok(W.monsters.length===n&&P.gear.weapon==='clawblade','save/load keeps monsters and gear');
 // balance report: 12 tier-2 troops plus the hero, 3 fights per monster at level 1 and 3
 for(const id of Object.keys(MONSTERS).filter(id=>!MONSTERS[id].mythic)){const res=[];for(const lv of [1,3]){let w=0,lost=0;for(let k=0;k<3;k++){P.troops={hum_spear:6,hum_long:3,hum_squire:3};
   reset();const m=near(id,lv);m.n=MONSTERS[id].count[1];G.encCool=0;t.startMonster(m);t.act('fight');let i=0;while(t.B&&i<12000){t.updateBattle(.033);i++}
   if(!W.monsters.includes(m))w++;lost+=12-t.troopCount();t.act('cont');done();W.monsters=W.monsters.filter(x=>x!==m)}res.push('lv'+lv+' won '+w+'/3 lost '+(lost/3).toFixed(1))}
   o.push('BAL '+id+' ×'+MONSTERS[id].count[1]+': '+res.join(', '))}
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
