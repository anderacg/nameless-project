'use strict';
// The wilds are dangerous, the lands are defended (the owner, 2026-10-19; world/defence.js, data/factions.js DEFEND): beasts make
// their lairs in the wilds (or, their ground not found there, at a land's far edge), bands take to the roads away from every
// holding and estate; a beast falls on a band it meets and they fight it out on the map, either side winning; a holding sends
// its watch at a band or beast on its land that it sees, when the watch can beat it; a lord at home rides at one that nears his
// realm's holdings and estates, never from a campaign, and goes back to what he was doing; off their lands a beast falls on any
// party it dares, and a lord on the road turns on a beast near him he can beat; you can join a beast's fight against
// it (your battle with the beast); and a beast's fight is saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,S=t.WORLD_SCALE.spawn,D=t.DEFEND;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;
 const panel=()=>document.getElementById('panel').innerHTML,world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.enc=null;G.fg=null};
 const lair=(x,y)=>!t.landHold(x,y)||t.landRim(x,y,S.rim)&&t.farFromHomes(x,y,S.away);
 // ---- spawns: at the start, and over many more
 {const ms=W.monsters.filter(m=>!t.MONSTERS[m.id].mythic),bad=ms.filter(m=>!lair(m.hx,m.hy)),wild=ms.filter(m=>!t.landHold(m.hx,m.hy)).length;
  ok(ms.length>=t.MONSTER_START*.9&&!bad.length,'a new world: '+ms.length+' beasts, every lair in the wilds ('+wild+') or at a land\'s far edge'+(bad.length?'; not: '+bad.map(m=>m.id).join(', '):''))}
 {const bs=t.bandits.filter(b=>!b.qid),bad=bs.filter(b=>!t.farFromHomes(b.x,b.y,S.away));
  ok(bs.length>=t.BANDITS*.9&&!bad.length,'a new world: '+bs.length+' bands, every one at least '+S.away+' px from any holding and estate')}
 {W.monsters=[];P.x=-9999;P.y=-9999;for(let i=0;i<400;i++)t.spawnMonster(i%2===0);const bad=W.monsters.filter(m=>!lair(m.hx,m.hy)),hab=W.monsters.filter(m=>!t.MONSTERS[m.id].where.some(w=>t.habitatAt(m.hx,m.hy).includes(w))),
   rim=W.monsters.filter(m=>t.landHold(m.hx,m.hy)).length,kinds=new Set(W.monsters.map(m=>m.id));
  ok(W.monsters.length>=380&&!bad.length&&!hab.length,'400 more beasts: '+W.monsters.length+' made, all in their habitat, all in the wilds or at a land\'s far edge ('+rim+' at an edge), '+kinds.size+' kinds')}
 {t.bandits.length=0;for(let i=0;i<300;i++)t.spawnBandit(i%2===0);const bad=t.bandits.filter(b=>!t.farFromHomes(b.x,b.y,S.away)),held=t.bandits.filter(b=>t.landHold(b.x,b.y)).length;
  ok(t.bandits.length>=280&&!bad.length,'300 more bands: '+t.bandits.length+' made, none within '+S.away+' px of a holding or estate ('+held+' out on a land\'s reaches)')}
 // ---- the stage for the rest: nothing about but what each case sets out
 const clear=()=>{world();t.bandits.length=0;W.monsters=[];W.fights=[];W.patrols=[];W.caravans=[];W.lords.forEach(l=>{l.x=-9000;l.y=-9000;l.inside=null;l.fight=null;l.defend=null;l.defT=0});P.x=-9999;P.y=-9999;P.tx=null;G.encCool=1e9};
 const band=(x,y,list)=>{const b=t.asParty({x,y,n:list.length,kind:'bandits',list,t:9,a:0,idle:true,cool:0});t.bandits.push(b);return b};
 const beast=(id,x,y,lv,n)=>{const m=t.asMonster({id,x,y,hx:x,hy:y,lv,n,t:9,a:0,cool:0});W.monsters.push(m);return m};
 const wild=(()=>{for(let ty=20;ty<t.MH-20;ty++)for(let tx=20;tx<t.MW-20;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.terrAt(x,y)===t.T_OPEN&&!t.landHold(x,y)&&t.terrAt(x+16,y)===t.T_OPEN)return{x,y}}})();
 const runFight=(f,n)=>{let i=0;for(;i<(n||20000)&&W.fights.includes(f);i++)t.updateFights(.05);return i};
 // ---- a beast meets a band: a fight on the map, either side winning
 // (a band of kind k, ratio times the beast's strength in a fight: fights.js sidePower, monsters.js fightPower)
 const sized=(m,k,ratio)=>{const a=[];while(t.power(a)<ratio*m.fightPower())a.push(k);return a};
 {clear();const m=beast('troll',wild.x,wild.y,2,2),list=sized(m,'orc_grunt',1.6),b=band(wild.x+6,wild.y,list);t.updateMonsters(.05);const f=W.fights[0];
  ok(f&&m.fight===f.id&&b.fight===f.id&&f.sides.flat().includes(m.uid),'trolls that meet a band fall on it: a fight on the map, the beasts one side of it');
  const x0=m.x;t.updateMonsters(.05);ok(m.x===x0&&t.partyBy(m.uid)===m,'in the fight they stand and fight, a party of the fight like any (partyBy)');
  const n=runFight(f);ok(!W.fights.includes(f)&&(!W.monsters.includes(m)||m.n<2&&!m.fight)&&t.bandits.includes(b)&&!b.fight&&n>20,'a band 1.6 times as strong beats them in a while ('+n+' steps; '+b.troops.length+' of '+list.length+' stand; the trolls '+(W.monsters.includes(m)?'break off, '+m.n+' left':'slain')+')')}
 {clear();const m=beast('troll',wild.x,wild.y,2,2),list=sized(m,'militia',.6),b=band(wild.x+6,wild.y,list);t.updateMonsters(.05);const f=W.fights[0];
  ok(f&&b.fight===f.id,'trolls meet a weaker band: a fight');const n=runFight(f);
  ok(!W.fights.includes(f)&&!t.bandits.includes(b)&&W.monsters.includes(m)&&!m.fight&&m.n>=1&&n>5,'the trolls win; the band is gone, the trolls go free ('+n+' steps, '+m.n+' left)')}
 {clear();const m=beast('wolf',wild.x,wild.y,1,5),b=band(wild.x+6,wild.y,Array(30).fill('archer'));t.startFight([m],[b]);const f=W.fights[0];runFight(f);
  ok(!W.fights.includes(f)&&(!W.monsters.includes(m)||m.n<=2&&!m.fight),'a wolf pack routed by a far stronger band loses half or more as it flees ('+(W.monsters.includes(m)?m.n+' left':'slain')+')')}
 // ---- the watch: rides out at a beast on its land it can beat, not at one it cannot
 const h=t.TOWNS.filter(z=>z.owner&&!t.ruined(z)&&!t.besieged(z)&&z.estates().length>=2).sort((a,b)=>b.T.patrol.size-a.T.patrol.size)[0];
 const onLand=(z,ok2)=>{for(let r=2;r<30;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=(z.tx+dx+.5)*16,y=(z.ty+dy+.5)*16;if(t.passable(t.terrAt(x,y))&&t.landHold(x,y)===z&&ok2(x,y))return{x,y}}return null};
 const sendOut=()=>{for(const z of t.TOWNS){const X=t.watchesOf(z);X.day.off=X.night.off=0;z.gar=Math.max(z.gar,z.T.gar)}G.clock=t.DAY*.3;t.sendWatch(h);return W.patrols.find(p=>p.home===h.name)};
 {clear();const p=sendOut();const es=h.estates(),e=es[es.length-1];
  const at=onLand(h,(x,y)=>Math.hypot(x-e.x,y-e.y)<D.see*.6&&Math.hypot(x-p.x,y-p.y)>40);
  if(p&&at){W.patrols=[p];const m=beast('boar',at.x,at.y,1,1);for(let i=0;i<4;i++)t.updatePatrols(.3);
   ok(p.hunt===m.uid,'a boar on the land of '+h.name+' by its '+t.ESTATES[e.k].n.toLowerCase()+': its '+t.watchName(p).toLowerCase()+' (power '+p.power()+' vs '+m.power()+') is set on it');
   let i=0;for(;i<3000&&W.monsters.includes(m)&&!m.fight;i++){t.updatePatrols(.05);t.updateFights(.05)}
   ok(m.fight||!W.monsters.includes(m),'and rides it down: a fight ('+i+' steps)');
   const f=W.fights.find(x=>x.id===m.fight);if(f)runFight(f);t.updatePatrols(.05);ok(!W.monsters.includes(m)&&W.patrols.includes(p)&&!p.fight&&!p.hunt,'the watch kills the boar and goes back to its beat')}
  else ok(false,'a watch and a spot by an estate of '+h.name+' to test with')}
 {clear();const p=sendOut();const at=p&&onLand(h,(x,y)=>Math.hypot(x-p.x,y-p.y)<60&&Math.hypot(x-p.x,y-p.y)>20);
  if(p&&at){W.patrols=[p];const m=beast('troll',at.x,at.y,8,2);for(let i=0;i<300;i++){t.updatePatrols(.05);t.updateFights(.05)}
   ok(!p.hunt&&!m.fight&&!W.fights.length,'trolls on its land, too strong for it (power '+p.power()+' vs '+m.power()+'): the watch leaves them be')}
  else ok(false,'a spot near the watch to test with')}
 {clear();const p=sendOut(),es=h.estates(),e=es[es.length-1],at=onLand(h,(x,y)=>Math.hypot(x-e.x,y-e.y)<D.see*.6);
  if(p&&at){W.patrols=[p];const b=band(at.x,at.y,['militia','militia']);for(let i=0;i<4;i++)t.updatePatrols(.3);ok(p.hunt===b.uid,'a band by its estate: the watch is set on it as well')}}
 // the watch at home: a threat it sees from its homes sends it out
 {clear();for(const z of t.TOWNS){const X=t.watchesOf(z);X.day.off=X.night.off=0;z.gar=Math.max(z.gar,z.T.gar)}G.clock=t.DAY*.3;const e=h.estates()[0],at=onLand(h,(x,y)=>Math.hypot(x-e.x,y-e.y)<D.see*.5);
  if(at){const m=beast('boar',at.x,at.y,1,1);t.landDefence(1);const p=W.patrols.find(q=>q.home===h.name);ok(p&&p.hunt===m.uid,'a beast by an estate brings the watch on duty out after it')}}
 // ---- the lords: near home they ride out at a threat by an estate; not on campaign, not when it is far from the estates
 const lordCase=(state,far)=>{clear();for(const z of t.TOWNS){const X=t.watchesOf(z);X.day.off=X.night.off=1e9}// (no watch: the lord alone)
  const l=W.lords.find(q=>!q.dead&&t.fiefsOf(q.fac).some(z=>z.estates().length>=2)),z=t.fiefsOf(l.fac).filter(z=>z.estates().length>=2)[0];
  Object.assign(l,{troops:Array(20).fill('hum_knight'),state,tgt:z.name,cool:0});l.enter(z);
  const at=onLand(z,(x,y)=>far?t.homeDist(z,x,y)>D.near*1.2&&Math.hypot(x-l.x,y-l.y)<D.ride*.9:t.homeDist(z,x,y)<D.near*.6&&Math.hypot(x-l.x,y-l.y)>30);
  const b=at&&band(at.x,at.y,['militia','militia','militia']);t.landDefence(1);return{l,z,b,at}};
 {const {l,z,b,at}=lordCase('rest',false);
  if(at){ok(l.defend===b.uid&&!l.inside,l.name+', resting in '+z.name+', rides out against a band by its estates');
   let i=0;for(;i<4000&&t.bandits.includes(b);i++){t.updateLords(.05);t.updateFights(.05)}
   ok(!t.bandits.includes(b)&&!l.defend&&l.state==='rest'&&l.tgt===z.name,'beats it ('+i+' steps) and goes back to his rest in '+z.name);
   for(let k=0;k<4000&&!l.inside;k++)t.updateLords(.05);ok(l.inside===z.name,'and is back inside')}
  else ok(false,'a spot by '+z.name+'\'s estates to test with')}
 {const {l,at}=lordCase('march',false);ok(at&&!l.defend,'a lord on a war march does not turn aside for it')}
 {const {l,at}=lordCase('rest',true);ok(at&&!l.defend,'nor does one at home for a band on his land far from its holdings and estates'+(at?'':' (no spot)'))}
 // ---- off their lands too (the owner, 2026-10-31): a beast falls on a caravan or a lord's army it dares; a lord on the road
 // turns on a beast near him he can beat, and goes on after
 {clear();t.LandDefence.grid=null;const to=t.TOWNS.find(z=>z.owner),c=t.asParty({x:wild.x+6,y:wild.y,cv:true,fac:to.owner,troops:['militia','militia'],guards:2,from:to.name,to:to.name,goods:{},dir:1,cool:0});W.caravans.push(c);
  const m=beast('troll',wild.x,wild.y,2,2);t.updateMonsters(.05);const f=W.fights[0];
  ok(f&&m.fight===f.id&&c.fight===f.id,'trolls that meet a caravan fall on it (power '+m.power()+' vs '+c.power()+'): a fight on the map')}
 {clear();t.LandDefence.grid=null;const l=W.lords.find(q=>!q.dead);Object.assign(l,{troops:Array(30).fill('hum_knight'),x:wild.x+6,y:wild.y,state:'march',cool:0});
  const m=beast('wolf',wild.x,wild.y,1,1);t.updateMonsters(.05);ok(!W.fights.length,'a lone wolf beside an army of 30 knights does not dare it')}
 {clear();t.LandDefence.grid=null;const l=W.lords.find(q=>!q.dead),z=t.TOWNS.find(q=>q.owner&&q.owner!==l.fac)||t.TOWNS[0];
  Object.assign(l,{troops:Array(20).fill('hum_knight'),x:wild.x+D.pass*.7,y:wild.y,state:'march',tgt:z.name,cool:0});const m=beast('boar',wild.x,wild.y,1,1);
  t.updateLords(.05);ok(l.defend===m.uid,l.name+', marching on '+z.name+' through the wilds, turns on a boar '+Math.round(D.pass*.7)+' px from him');
  let i=0;for(;i<3000&&W.monsters.includes(m);i++){t.updateLords(.05);t.updateMonsters(.05);t.updateFights(.05)}
  t.updateLords(.05);ok(!W.monsters.includes(m)&&!l.defend&&l.state==='march'&&l.tgt===z.name,'kills it ('+i+' steps) and marches on to '+z.name)}
 {clear();t.LandDefence.grid=null;const l=W.lords.find(q=>!q.dead);Object.assign(l,{troops:['militia'],x:wild.x+D.pass*.7,y:wild.y,state:'march',cool:0});beast('troll',wild.x,wild.y,3,2);
  t.updateLords(.05);ok(!l.defend,'one too weak for the beast leaves it be')}
 // ---- you join a beast's fight against it: your battle with the beast, the band beside you
 {clear();P.troops={hum_knight:30};P.fac=null;P.hostile={};const m=beast('troll',wild.x,wild.y,1,2),b=band(wild.x+6,wild.y,Array(6).fill('militia'));t.startFight([m],[b]);const f=W.fights[0];
  P.x=f.x+20;P.y=f.y;t.interact(m);const s=f.sides[0].includes(m.uid)?1:0;
  ok(G.fg===f&&/It is a wild beast/.test(panel())&&(panel().match(/Join them/g)||[]).length===2,'clicking the fight shows it: the beast\'s side cannot be joined (it fights for no one)');
  t.act('fg-join',String(s));ok(G.enc&&G.enc.kind==='monster'&&G.enc.ref===m&&G.enc.list.length===2&&G.enc.allies.some(a=>a.src===b),'joining against it: your battle with the trolls, the band beside you');
  t.act('auto');ok(/Victory/.test(panel())&&!W.monsters.includes(m),'won: the trolls are slain');t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);world();
  t.updateFights(.05);ok(!W.fights.includes(f)&&!b.fight&&t.bandits.includes(b),'the fight is over, the band goes free')}
 // ---- saved mid-fight
 {clear();const m=beast('spider',wild.x,wild.y,2,3),b=band(wild.x+6,wild.y,Array(6).fill('militia'));t.startFight([m],[b]);const f=W.fights[0];for(let i=0;i<20;i++)t.updateFights(.05);
  const uid=m.uid,n=m.n;t.saveGame(true);W.fights=[];W.monsters=[];t.bandits.length=0;t.loadGame();world();
  const m2=t.partyBy(uid),f2=W.fights.find(x=>x.id===f.id);
  ok(m2&&m2 instanceof t.Monster&&m2.fight===f.id&&m2.n===n&&f2&&f2.sides.flat().includes(uid),'a beast\'s fight is saved mid-fight: its uid, its fight and its count come back');
  const k=runFight(f2);ok(!W.fights.includes(f2)&&(!W.monsters.includes(m2)||!m2.fight),'and it fights on to the end after loading ('+k+' steps; the spiders '+(W.monsters.includes(m2)?'win':'are slain')+')')}
 t.drawWorld();ok(true,'the map draws it all');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
