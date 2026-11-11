'use strict';
// What falls in a fight (battle/drops.js, data/drops.js DROPS; the owner, 2026-11-09: "drops something on the ground like just cool dot
// effects or small icons for exp and items", "can you make this drops in the other battle type too?"; doc/ACTION_DESIGN.md §0): a foe
// fallen bursts into gold dots to your hero and blue ones to the soldier who felled it; coins and gear (a beast's hide) on the ground,
// drawn in by your hero or a companion who comes near, into purse and bag (a full bag leaves it); won, the rest gathered, lost, left;
// what the field gave off the fight's own spoils and listed in its report; a group ranked up flashes; off (the tests' harness), nothing.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 const D=t.DROPS,keep={on:D.on,loot:D.loot,coin:D.coin.chance,gear:D.gear};
 const fight=()=>{Kit.world();P.troops={hum_foot:4};const band=t.asParty({kind:'bandits',x:P.x+20,y:P.y,troops:Array(4).fill('militia')});W.lords=[];W.patrols=[];W.monsters=[];t.bandits.length=0;t.bandits.push(band);
  G.enc={kind:'party',ref:band,list:band.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B;for(let i=0;i<600&&b.muster?.active;i++)t.updateBattle(.05);t.battlePause(false);// (the armies formed up, then begun)
  const h=b.hero,mine=b.units.filter(u=>u.team===0&&!u.hero&&!u.comp),foes=b.units.filter(u=>u.team===1);for(const f of foes){f.cd=99;f.s={...f.s,spd:0};f.hp=f.max=1e6}/* (none falls but as the test fells it) */return {b,h,mine,foes,d:t.BattleDrops.of(b)}};
 const run=(n,dt=.05)=>{for(let i=0;i<n&&t.B;i++)t.updateBattle(dt)};
 try{
  D.on=true;D.loot=true;D.coin.chance=1;D.gear=1;
  // ---- a foe falls: its dots, its loot on the ground, nothing on the battle or its men
  {const {b,h,mine,foes,d}=fight(),f=foes[0];f.x=h.x+200;f.y=h.y;t.BattleDrops.struck(f,mine[0]);f.hp=0;run(1);
   ok(d.ground.some(g=>g.k==='gold'&&g.n>=D.coin.n[0]&&g.n<=D.coin.n[1])&&d.ground.some(g=>g.k==='gear'&&t.ITEMS[g.id]),'a bandit falls: coins and a piece of gear on the ground where he fell ('+d.ground.map(g=>g.k).join(', ')+')');
   ok(d.orbs.filter(o=>o.to===h).length===D.dots.xp&&d.orbs.filter(o=>o.to===mine[0]).length===D.dots.troop,'its dots: '+D.dots.xp+' gold to your hero, '+D.dots.troop+' blue to the soldier who felled it');
   ok(!Object.keys(b).some(k=>/drop|orb/i.test(k))&&!Object.keys(f).some(k=>/drop|orb/i.test(k)),'nothing of it on the battle or its men (its own state, so no battle\'s numbers move)');
   const fl=b.floats.length;run(30);ok(!d.orbs.some(o=>o.to===h&&!o.item)&&b.floats.some(x=>/\+\d+ XP/.test(x.t)),'the dots reach your hero: "+'+D.xp+' XP" over him');
   // ---- walked near, drawn in: the gold into your purse, the gear into your bag
   const g0=P.gold,gear=d.ground.find(g=>g.k==='gear').id,n0=P.inv.filter(s=>s&&s.id===gear).length;h.x=f.x;h.y=f.y;run(40);
   ok(!d.ground.length&&P.gold>g0&&P.inv.filter(s=>s&&s.id===gear).length===n0+1&&d.tally.gold===P.gold-g0&&d.tally.gear===1,'your hero comes near: they fly in, the gold into your purse (+'+(P.gold-g0)+'), the '+t.ITEMS[gear].n+' into your bag');
   ok(/From the field: \d+ gold, /.test(d.fieldLine()),'its report\'s line: "'+d.fieldLine().replace(/<[^>]+>/g,'')+'"');
   // ---- a full bag: the gear stays on the ground
   {const add=window.invAdd;window.invAdd=()=>0;try{const f2=foes[1];f2.x=h.x+200;f2.y=h.y;f2.hp=0;run(1);h.x=f2.x;h.y=f2.y;let saw=false;for(let i=0;i<40;i++){run(1);saw=saw||b.floats.some(x=>x.t==='Bag full')}
    ok(d.ground.some(g=>g.k==='gear')&&saw,'no room in the bag (its overflow too): the gear stays on the ground ("Bag full")')}finally{window.invAdd=add}}
   // ---- the fight won: what is left gathered for you; the field's gold off the spoils, its gear the end's own drop
   b.units.forEach(u=>{if(u.team===1)u.hp=0});run(1);const left=d.ground.length;for(let i=0;i<400&&G.mode==='battle';i++)run(1);
   ok(G.mode!=='battle'&&left>0&&!d.ground.length,'won: what lay on the field gathered for you ('+left+' left there)');
   ok(/From the field:/.test(document.getElementById('panel').innerHTML),'the report lists what the field gave');Kit.clear();Kit.world()}
  // ---- lost or fled: it stays
  {const {b,h,foes,d}=fight(),f=foes[0];f.x=h.x+200;f.y=h.y;f.hp=0;run(1);const n=d.ground.length;b.win=false;d.end(b);ok(n&&d.ground.length===n,'lost: what lies on the field is left there');t.B=null;G.mode='world';Kit.clear()}
  // ---- a beast's hide: the field's taken off its end loot
  {const M=t.MONSTERS.wolf,slain=[M.unit,M.unit,M.unit],has=()=>P.inv.filter(s=>s&&s.k==='mat'&&s.id===M.mat).reduce((n,s)=>n+s.n,0);P.inv=P.inv.map(()=>null);
   G.enc={kind:'monster',field:{gold:0,gear:0,mats:{[M.mat]:2},names:[]}};const a=has();t.monsterLoot({id:'wolf',lv:1},slain);ok(has()-a===1,'a wolf pack of three: the field gave two pelts, its end loot one more (3 in all)');G.enc=null}
  // ---- a group ranked up flashes in the report
  ok(/rank-flash/.test(t.rankUpHtml([{id:'x',type:'hum_foot',rank:2}])),'a group ranked up: its line flashes');
  // ---- one who left the field alive, or has not come onto it, leaves nothing (a review of the rules, 2026-11-11: the routed burst as the slain)
  {const {foes,d}=fight();t.leaveField(foes[0]);foes[1].hp=0;foes[1].waiting=true;d.step(.05);ok(!d.ground.length&&!d.orbs.length,'a foe gone from the field alive, and one not yet come onto it: nothing falls');
   foes[2].hp=0;d.step(.05);ok(d.ground.length>0,'one who fell there: his coins and gear');t.B=null;G.mode='world';Kit.clear()}
  // ---- off: nothing falls
  {D.on=false;const {b,h,foes,d}=fight(),f=foes[0];f.hp=0;run(5);ok(!d.ground.length&&!d.orbs.length,'off (the tests\' harness): nothing falls');t.B=null;G.mode='world';Kit.clear()}
 }finally{D.on=keep.on;D.loot=keep.loot;D.coin.chance=keep.coin;D.gear=keep.gear}
});
