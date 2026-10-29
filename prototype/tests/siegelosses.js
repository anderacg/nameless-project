'use strict';
// The walls' losses (the owner, 2026-10-29: "the garrison don't seem to have casualties after battle"): a fight at the walls you
// did not win costs the garrison, and the lords' men inside, those you slew, each by its share (siege.js siegeFallen); a
// withdrawal keeps them dead too; an auto-resolved assault lost costs them their share fallen; a garrison sallying beside you
// loses those of it who fell.
Kit.suite(({ok})=>{const t=T,G=t.G,P=t.P,W=t.W;
 const R0=Math.random;
 const setup=(seed,gar,lord)=>{Math.random=t.seeded(seed);t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;t.BDEPLOY.on=false;t.BAUTO.on=false;
  W.lords=[];W.sites=[];W.monsters=[];t.bandits.length=0;P.troops={hum_spear:6,hum_bow:3,hum_knight:2};P.comps={};P.hp=40;
  const town=t.TOWNS.find(h=>h.owner==='karn'&&h.kind==='town');town.gar=gar;P.siege={town:town.name,days:9};
  let l=null;if(lord){l=t.asParty({id:'karn0',name:t.FACS.karn.lords[0],fac:'karn',x:town.x,y:town.y,inside:town.name,dead:false,troops:Array(lord).fill('dw_clan'),cool:0,state:'rest',lv:3,xp:0,renown:24,sk:Object.fromEntries(t.LORD_SK.map(k=>[k,{lv:1,xp:0}]))});W.lords.push(l)}
  const def=t.siegeDefenders(town);G.enc={kind:'siege',ref:town,list:def.list,lv:1,lords:def.lords,allies:[],foes:[],mine:true};G.loot=null;G.encAgain=null;return{town,l}};
 const fight=(kill,how)=>{t.startBattle({enemies:G.enc.list,lv:2});const B=t.B;B.win=false;B.over=true;B.retreat=how==='withdraw';B.withdrawn=how==='withdraw'?5:0;B.lost={};
  const def=B.units.filter(u=>u.team===1&&!u.leader&&String(u.grp).startsWith('e0_'));def.slice(0,kill).forEach(u=>u.hp=0);B.kills=kill;B.slain=def.slice(0,kill).map(u=>u.type);
  if(how!=='withdraw')B.hero.hp=0;t.finishBattle();return def.length};
 try{
  {const {town}=setup(31,12);const n=fight(9,'lose');ok(n===12&&town.gar===3,'an assault lost after slaying 9 of the 12 on the walls: the garrison 12 → '+town.gar+' (once 9, whatever you slew)')}
  {const {town}=setup(32,12);fight(0,'lose');ok(town.gar===12,'none slain: none lost ('+town.gar+')')}
  {const {town}=setup(33,10);fight(4,'withdraw');ok(town.gar===6,'withdrawn after slaying 4 of 10: they stay dead (garrison '+town.gar+'; once 10 again)')}
  {const {town,l}=setup(34,8,8);fight(8,'lose');ok(town.gar===4&&l.troops.length===4,'8 slain of 16 (a garrison of 8 and a lord\'s 8 men inside): each loses its half (garrison '+town.gar+', his men '+l.troops.length+')')}
  {const {town}=setup(35,12);G.enc.fell=.25;t.concludeEncounter(false,{hum_spear:2},0,true,[]);ok(town.gar===9,'an auto-resolved assault lost: the walls lose their share fallen (a quarter: 12 → '+town.gar+')')}
  {const {town}=setup(36,9);t.autoResolve();ok(town.gar<9||G.capture===town,'auto-resolved by the real odds: the garrison lost men either way ('+town.gar+')')}
  // a garrison sallying beside you: those of it who fell are gone from its walls
  {Math.random=t.seeded(37);t.act('begin','soldier');G.quietEvents=true;t.BDEPLOY.on=false;t.BAUTO.on=false;W.lords=[];t.bandits.length=0;P.troops={hum_spear:6};
   const town=t.TOWNS.find(h=>h.owner===P.fac||h.owner==='vale');town.gar=10;const g=t.garrisonForce(town),band=t.asParty({kind:'bandits',troops:Array(6).fill('militia'),x:P.x+8,y:P.y,cool:0});t.bandits.push(band);
   G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[g],foes:[],mine:false};t.startBattle({enemies:G.enc.list,lv:1});const B=t.B;
   const ours=B.units.filter(u=>u.lord===g);ours.slice(0,3).forEach(u=>t.Actor.of(u).wound(1e6,1,'cut',null,false));
   B.units.filter(u=>u.team===1).forEach(u=>u.hp=0);B.win=true;B.over=true;B.lost={};B.kills=6;B.slain=band.troops.slice();t.finishBattle();
   ok(ours.length===10&&town.gar===7,'a garrison of 10 sallying beside you, 3 of them slain: 7 back on its walls ('+town.gar+')')}
 }finally{Math.random=R0}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
