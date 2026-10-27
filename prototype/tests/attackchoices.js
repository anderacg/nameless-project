'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,A=t.TravelAwareness;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.troops={hum_foot:5};P.comps={};P.camp=null;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);
 const enemy=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+65,y:P.y,cool:0});t.bandits.push(enemy);
 const reset=()=>{window.eval('B=null');Kit.world();A.reset();enemy.x=P.x+65;delete enemy.fight;enemy.dead=false;enemy.inside=null};
 const encounter=(extra={})=>{t.startEncounter({kind:'party',ref:enemy,list:enemy.troops.slice(),mine:true,allies:[],foes:[],...extra});return G.enc};
 const ambush=()=>document.querySelector('[data-act="bt-spring"]');
 reset();let e=encounter();ok(t.canSpring(e)&&ambush()?.textContent==='Ambush attack'&&document.querySelector('[data-act="fight"]').textContent==='Normal attack','undetected enemy encounter offers normal and ambush attack');
 ok(Kit.text().includes('They are unaware of you')&&Kit.text().includes('surprised for 8 s'),'the choice says how aware they are, and how long the surprise lasts');
 A.notice(enemy);t.act('bt-spring');ok(!t.B&&G.mode==='dialog'&&!e.btype,'a stale ambush button cannot bypass newly acquired detection');
 encounter();ok(!ambush()&&!!document.querySelector('[data-act="fight"]'),'a detected target still permits a normal attack');
 enemy.x=P.x+700;ok(t.canWorldAmbush(e)&&t.Surprise.stage(A.level(enemy))===3,'out of their sight again (losing suspicion) they may be ambushed, at the shortest surprise');
 ok([0,.2,.5,.7,.95].map(a=>t.Surprise.stage(a)).join()==='0,1,2,3,3','four stages short of detected, by the eye\u2019s');
 reset();e=encounter({mine:false});ok(!t.canWorldAmbush(e)&&!ambush(),'an enemy-initiated encounter does not offer a player ambush');
 reset();enemy.fight='ongoing';e=encounter();ok(!t.canWorldAmbush(e)&&!ambush(),'an ongoing fight cannot become a new ambush');delete enemy.fight;
 reset();e=encounter();t.act('fight');ok(t.B?.muster?.active&&!t.B.ready,'Normal attack starts the regular walk-in preparation');
 reset();e=encounter();const actual=new Map();for(const owner of [P,enemy])for(const u of t.MarchArmy.of(owner).units)actual.set(u,{x:u.x,y:u.y});t.act('bt-spring');let b=t.B;
 ok(b?.world&&!b.muster&&!b.ready&&!b.paused&&e.btype.hid===0,'Ambush attack immediately starts a player ambush without preparation');
 ok(b.units.filter(u=>u.marchUnit).every(u=>{const p=b.world.world(u),q=actual.get(u.marchUnit);return q&&Math.hypot(p.x-q.x,p.y-q.y)<.001}),'ambush preserves the current physical marching positions');t.updateBattle(.01);ok(b.t>0,'ambush starts actual combat without Start Battle');
 {const S=b.surprise,foe=Object.values(b.groups).find(g=>g.foe),eu=foe.units[0],f=t.facing(eu),front={x:eu.x+Math.cos(f)*10,y:eu.y+Math.sin(f)*10};
  ok(S&&S.stage===0&&S.secs===8&&S.has(eu)&&t.grpMorale(foe.units)?.weak.includes('surprised'),'unaware, they are surprised for 8 s, and their cards say so');
  const od=t.Commander.prototype.orders;let n=0;t.Commander.prototype.orders=function(){if(this.team===foe.team)n++;return od.apply(this,arguments)};try{for(let i=0;i<60;i++)t.updateBattle(1/30)}finally{t.Commander.prototype.orders=od}
  ok(n===0,'surprised, their captain gives no orders');ok(t.flankMul(eu,front)>1,'a blow from their front lands as on the flank');
  const knight=b.units.find(u=>u.team===0);ok(S.shock(knight,eu)===t.AMBUSH.shock,'the ambushers\u2019 first charge shocks them harder');
  b.t=S.until;ok(!S.has(eu)&&t.flankMul(eu,front)===1&&S.shock(knight,eu)===1,'the surprise ends on time');b.over=true;b.win=true;b.endT=0;t.updateBattle(.01);
  ok(/Ambush:<\/b> they were unaware of you, surprised for 8 s/.test(document.getElementById('panel').innerHTML),'the battle report names the ambush')}
 // (their ambush on the road: your army caught off guard, lighter: shaken, move orders late, no bracing or shield wall)
 {reset();e=encounter({mine:false,btype:{kind:'ambush',hid:1}});t.act('fight');const b=t.B,S=b?.surprise,mine=b&&Object.values(b.groups).find(g=>g.player&&!g.units.some(u=>u.hero)),u=mine?.units[0];
  ok(S&&!S.hard&&S.secs===t.SURPRISE.caught.secs&&S.has(u)&&t.grpMorale(mine.units)?.weak.includes('surprised')&&!S.holds(1),'ambushed, your army is caught off guard (the enemy captain is not)');
  let done=false;t.playerOrder([mine.id],()=>{done=true},{late:true});const now=done;for(let i=0;i<40;i++)t.updateBattle(1/30);ok(!now&&done,'your move orders come '+t.SURPRISE.caught.late+' s late');
  mine.setFlag('shieldWall',true);ok(!mine.shieldWall&&/no time to brace/.test(t.abilityWhyNot(mine,'brace')),'no time to close a shield wall or brace');
  ok(t.flankMul(u,{x:u.x+Math.cos(t.facing(u))*10,y:u.y+Math.sin(t.facing(u))*10})===1,'their blows from the front are not flank hits');
  b.t=S.until;t.playerOrder([mine.id],()=>{done='now'},{late:true});mine.setFlag('shieldWall',true);ok(done==='now'&&mine.shieldWall,'once it ends, orders are at once, and the shield wall closes');b.over=true;b.win=true;b.endT=0;t.updateBattle(.01);
  ok(/Ambush:<\/b> they caught your army off guard/.test(document.getElementById('panel').innerHTML),'the battle report names it')}
 reset();const monster=t.asMonster({id:'wolf',n:2,lv:1,x:P.x+60,y:P.y,cool:0});W.monsters=[monster];t.startEncounter({kind:'monster',ref:monster,lv:1,list:monster.troops.slice(),mine:true,allies:[],foes:[]});ok(!!ambush()&&document.querySelector('[data-act="fight"]').textContent==='Normal attack','undetected monster encounters expose both attack choices');
 reset();const caravan=Object.assign(new t.CaravanParty(),{from:home.name,to:home.name,fac:'vale',x:P.x+60,y:P.y,goods:{grain:1},gold:0,guards:2,tc:{militia:2},cool:0});W.caravans=[caravan];t.startEncounter({kind:'caravan',ref:caravan,list:caravan.troops.slice(),mine:true,allies:[],foes:[]});ok(!!ambush(),'undetected caravans expose the ambush choice');
 reset();t.parley(enemy,'band');t.act('pl-fight');ok(G.enc.mine&&!!ambush(),'attacking through a parley preserves the player attack choice');
 ok(!ERR.length,'attack choices produce no runtime errors');
});
