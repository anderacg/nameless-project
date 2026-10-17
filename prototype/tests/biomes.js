'use strict';
// Biomes: travel speed and race exemptions, vision, daily survival, battleground rules, trees vs arrows, biome bands and new goods.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,MW=t.MW,MH=t.MH,TILE=t.TILE;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 // find a tile of a given climate and terrain, away from holdings (so shelter rules don't apply)
 const find=(clim,terr)=>{for(let i=0;i<MW*MH;i++){if(t.CLIMS[t.climate[i]]!==clim||t.tiles[i]!==terr)continue;const x=(i%MW+.5)*TILE,y=(Math.floor(i/MW)+.5)*TILE;
   if(t.TOWNS.every(w=>Math.hypot(w.x-x,w.y-y)>60)&&(clim!=='desert'||!t.nearWater(x,y,3)))return{x,y}}return null};
 const spot={grass:find('grass',t.T_OPEN),forest:find('grass',t.T_FOREST),hill:find('grass',t.T_HILL),frost:find('frost',t.T_OPEN),desert:find('desert',t.T_OPEN),swamp:find('swamp',t.T_OPEN)};
 ok(Object.values(spot).every(Boolean),'test spots found for every biome');
 const at=(s,fn)=>{P.x=s.x;P.y=s.y;return fn()};
 t.act('race','human');t.act('begin','soldier');
 ok(at(spot.grass,()=>t.speedAt(P.x,P.y,'human'))>at(spot.grass,()=>t.speedAt(P.x,P.y,'dwarf')),'humans faster on grassland');
 ok(at(spot.forest,()=>t.speedAt(P.x,P.y,'elf'))>at(spot.forest,()=>t.speedAt(P.x,P.y,'human'))*1.5,'elves ignore forest');
 ok(at(spot.frost,()=>t.speedAt(P.x,P.y,'dwarf'))>at(spot.frost,()=>t.speedAt(P.x,P.y,'human')),'dwarves ignore frost');
 ok(at(spot.swamp,()=>t.speedAt(P.x,P.y,'orc'))>at(spot.swamp,()=>t.speedAt(P.x,P.y,'human')),'orcs ignore swamp');
 ok(at(spot.forest,()=>t.vis())<at(spot.grass,()=>t.vis())&&at(spot.hill,()=>t.vis())>at(spot.grass,()=>t.vis()),'vision: forest shorter, hills longer');
 // survival
 const setGood=(g,n)=>{t.goodTake(g,1e9);t.invAdd('good',g,n)};P.troops={militia:9};setGood('furs',0);setGood('grain',50);P.morale=80;at(spot.frost,()=>t.survive());
 ok(P.morale===77&&t.goodN('grain')<50,'frost without furs costs morale and extra grain');
 setGood('furs',2);P.morale=80;at(spot.frost,()=>t.survive());ok(P.morale===80,'enough furs keep the band warm');
 P.morale=80;at(spot.desert,()=>t.survive());ok(P.morale===77,'desert sun costs morale away from water');
 P.race='orc';P.morale=80;at(spot.desert,()=>t.survive());ok(P.morale===80,'orcs ignore desert heat');P.race='human';
 let fever=0;for(let k=0;k<200;k++){P.morale=80;P.troops={militia:9};P.sk.surv={lv:0,xp:0};// the untrained rate (Survival would learn from it)
  at(spot.swamp,()=>t.survive());if(P.morale<80)fever++}
 ok(fever>20&&fever<80,'swamp fever strikes about a quarter of nights ('+fever+'/200)');
 const ash=t.townBy('Ashford');P.x=ash.x;P.y=ash.y+20;P.morale=80;setGood('furs',0);t.survive();ok(P.morale===80,'holdings shelter you');
 // battlegrounds
 P.troops={hum_levy:4,dw_clan:4,hum_bow:4,hum_squire:3};
 const fight=(s,band)=>{at(s,()=>{G.mode='world';G.modal=false;t.startEncounter({kind:'party',ref:t.asParty({x:P.x+20,y:P.y,cool:0,n:4,kind:band||'bandits'}),n:4,band:band||'bandits'});t.act('fight')});return t.B};
 let B=fight(spot.frost);const lv=B.units.find(u=>u.type==='hum_levy'),dc=B.units.find(u=>u.type==='dw_clan');
 ok(lv.s.spd<t.ST.hum_levy.spd&&dc.s.spd===t.ST.dw_clan.spd,'frost battle slows humans, not dwarves');
 ok(B.arena===t.arenaFor('frost')&&B.obs.length>0,'frost arena with obstacles');
 const h=B.units.find(u=>u.type==='hum_bow');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 B=fight(spot.hill);ok(B.units.find(u=>u.type==='hum_bow').s.range>t.ST.hum_bow.range,'hills extend archer range');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 B=fight(spot.grass);ok(B.units.find(u=>u.type==='hum_squire').s.spd>t.ST.hum_squire.spd,'open grass speeds cavalry');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 B=fight(spot.forest);ok(B.obs.filter(x=>x.kind==='tree').length>=8,'forest battle has many trees ('+B.obs.length+')');
 // fire 400 arrows straight through one tree
 // (no one may fall meanwhile: your hero fights on their own now, and the battle would end)
 // (a tree with no other tree on the arrow's 68 px flight: two in a row stop about 44%, which once failed the check; and the
 // shots' dice are seeded, so the count is the same every run)
 const tree=B.obs.find(x=>x.kind==='tree'&&!B.obs.some(o=>o!==x&&o.kind==='tree'&&o.x>x.x-40-o.r&&o.x<x.x+50+o.r&&Math.abs(o.y-x.y)<o.r+6));let stopped=0;const N=400;
 ok(tree,'the forest has a tree standing clear of the others');
 if(tree){const r0=Math.random;Math.random=t.seeded(4321);try{
 for(let k=0;k<N;k++){B.arrows=[{x:tree.x-30,y:tree.y-6,vx:170,vy:0,team:1,dmg:0,life:1,a:0,elf:false,tk:0}];B.noMorale=true;B.units.forEach(u=>{u.hp=u.max=1e6;u.cd=99;u.x=12;u.y=t.BH-20;u.s={...u.s,spd:0}});for(let s=0;s<40;s++)t.updateBattle(.01);if(!B.arrows.length||B.arrows[0].x<tree.x+10)stopped++}
 }finally{Math.random=r0}}
 ok(stopped>N*.12&&stopped<N*.4,'trees stop about a quarter of arrows ('+stopped+'/'+N+')');
 B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');done();
 // biome bands: desert bandits are raiders, frost wolves are monsters that drop furs
 at(spot.desert,()=>{G.mode='world';G.modal=false;t.startEncounter({kind:'party',ref:t.asParty({x:P.x+20,y:P.y,cool:0,n:3,kind:'raiders'}),n:3,band:'raiders'})});
 ok(/Desert raiders/.test(document.getElementById('panel').innerHTML),'desert bandits are desert raiders');t.act('flee');
 const before=t.goodN('furs');at(spot.frost,()=>{G.mode='world';G.modal=false;const m={id:'wolf',x:P.x+20,y:P.y,hx:P.x,hy:P.y,lv:1,n:4,cool:0};W.monsters.push(m);t.startMonster(m)});
 ok(/Wolf pack/.test(document.getElementById('panel').innerHTML)&&G.enc.list.every(k=>k==='wolf'),'frost wolves are a monster pack');
 P.troops={hum_spear:12,hum_long:6};t.act('auto');t.act('lt-all');ok(t.goodN('furs')>before,'wolves drop furs ('+(t.goodN('furs')-before)+')');t.act('cont');done();
 // goods
 const gw=t.townBy('Greywell');G.lastTown=null;G.mode='world';t.enterTown(gw);t.act('tab','trade');const html=document.getElementById('panel').innerHTML;
 ok(/Spice/.test(html)&&/Grain/.test(html),'desert village trades grain and spice');t.act('leave');done();
 t.updateHUD(true);ok(/Where you are/.test(document.getElementById('stats').innerHTML)&&document.getElementById('stats').textContent.includes(t.regionAt(P.x,P.y).name),'region shown in HUD');
 setGood('spice',7);t.saveGame();t.goodTake('spice',99);t.act('load');ok(t.goodN('spice')===7,'goods in the bag survive save and load');
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
