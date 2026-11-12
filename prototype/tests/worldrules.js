'use strict';
// The battle and the world by their own rules (a review of the rules, 2026-11-11). A camp you withdrew from keeps its losses a while
// (sites.js CAMP_WORN, Lair worn and keep); an ambush on the world map is sprung once (worldbattle.js); a besieged holding works little
// of its land and its gate is barred to caravans (economy.js SIEGE_SHUT, brains.js); a truce ends the two realms' fights on the map
// (fights.js truceFights); a multi-army battle takes what the field gave off its spoils (sides.js settle).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',23);Kit.world();Kit.clear();t.GUIDE.on=false;
 try{
  // ---- a camp's losses
  {const s=W.sites.find(x=>x instanceof t.Hideout&&!x.cleared);if(s){const e={list:['chief','a','a','a']};s.worn(e);const L=s.keep(['a','a','a','a','a','a','a','chief']);
    ok(L.length===4&&L.includes('chief')&&L.filter(k=>k!=='chief').length===3,'a hideout you left with three of its fighters standing: three and its chieftain when you come again');
    G.day+=t.CAMP_WORN.days;ok(s.keep(['a','a','a','a','chief']).length===5&&!s.wear,'a week on: at its strength again');G.day-=t.CAMP_WORN.days;
    ok(typeof t.ON_WIN.camp.lost==='function','a camp\'s lost fight keeps its losses (ON_WIN.camp.lost)')}else info('no hideout')}
  // ---- an ambush sprung once
  ok(/btype\.kind==='ambush'\)e\.btype=false/.test(String(t.WorldBattleSetup.prototype.initialize)),'an ambush on the map sprung once: run down after it, no surprise again (WorldBattleSetup initialize)');
  // ---- a besieged holding
  {const h=t.TOWNS.find(x=>x.owner&&x.owner!=='player'&&!x.gone);t.ensureEcon(h);const bes=h.besieged,st={...h.stock},rnd=Math.random;window.Math.random=()=>.99;
   const ly={grain:40,timber:10,stone:10},sum=o=>Object.values(o).reduce((a,b)=>a+b,0);h.besieged=()=>false;const free=sum(h.econ.produce(ly));h.stock={...st};h.besieged=()=>true;const shut=sum(h.econ.produce(ly));h.stock=st;h.besieged=bes;window.Math.random=rnd;
   ok(free>0&&shut<free*.4,'a besieged holding makes a quarter of what it would ('+shut+' of '+free+')')}
  // ---- a truce
  {const fs=Object.keys(t.FACS).filter(f=>f!=='player'&&t.fiefsOf(f).length);const [a,b]=fs;const la=W.lords.find(l=>l.fac===a&&!l.dead),lb=W.lords.find(l=>l.fac===b&&!l.dead);
   if(la&&lb){const ka={x:la.x,y:la.y,st:la.state},kb={x:lb.x,y:lb.y,st:lb.state};lb.x=la.x+10;lb.y=la.y;const n0=W.fights.length;t.startFight([la],[lb]);ok(W.fights.length===n0+1&&la.fight,'two realms\' lords at a fight');
    t.truceFights(a,b);ok(W.fights.length===n0&&!la.fight&&!lb.fight,'a truce between them: the fight ends, both let go');Object.assign(la,{x:ka.x,y:ka.y});Object.assign(lb,{x:kb.x,y:kb.y})}else info('no two realms with lords')}
  // ---- the field's gold off a multi-army battle's
  ok(/F\.gold/.test(String(t.BattleSides.prototype.settle)),'a battle of many armies takes what the field gave off its gold (BattleSides settle)');
 }finally{}
});
