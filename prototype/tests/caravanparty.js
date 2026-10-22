'use strict';
// Caravans are parties (CaravanParty, caravans.js): made one when they set out and when a save is loaded, their guards their
// soldiers (rolled from guards, which is all a save keeps), moved by their brain, and met, tolled, attacked, seized, fought
// and picked as before. A save keeps their plain fields, unchanged.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TW=t.TOWNS;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');W.critters=[];W.sites=[];W.monsters=[];W.lords=[];t.bandits.length=0;W.patrols=[];W.refugees=[];W.folk=[];G.quietEvents=true;
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])},pan=()=>document.getElementById('panel').innerHTML;
 const world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.enc=null;G.cv=null};
 const from=t.townBy('Saltmere');from.owner=t.HOME.Saltmere;from.sacked=from.raided=0;t.ensureEcon(from);
 // (a caravan sets out only for a town in reach that is short of its surplus: the world's stocks are random, and on some seeds the
 // only one short of anything Saltmere has is short of a good the first caravan carries off. A town of its own, in reach, emptied of
 // cloth and timber, is always one to send to)
 const near=TW.find(x=>x!==from&&x.owner===from.owner&&!t.besieged(x)&&Math.hypot(x.tx-from.tx,x.ty-from.ty)>20&&Math.hypot(x.tx-from.tx,x.ty-from.ty)<80);t.ensureEcon(near);
 const fill=()=>{from.stock.cloth=400;from.stock.timber=400;near.stock.cloth=near.stock.timber=0},send=()=>{fill();let c=null;for(let i=0;i<20&&!c;i++)c=t.sendCaravan(from);return c};
 const FIELDS=['cv','fac','from','to','x','y','goods','guards','cool','dir'];
 // ---- a caravan is a party of its kind
 W.caravans=[];let c=send();
 ok(c instanceof t.CaravanParty&&c instanceof t.Party,'a caravan that sets out is a CaravanParty');
 ok(c.brain===t.BRAINS.caravan&&c.mapKind==='caravan','with the caravan brain');
 ok(c.troops.length===c.guards&&c.size===c.guards&&Object.isFrozen(c.troops),'its soldiers are its '+c.guards+' guards (a read-only list)');
 ok(c.label()==='Caravan of '+c.from&&c.faction===c.fac&&c.power()===t.rating(c.troops),'it says its name, its realm and its strength');
 {const keys=Object.keys(JSON.parse(JSON.stringify(c))).sort().join(',');ok(keys===[...FIELDS].sort().join(','),'its saved shape is the plain fields only ('+keys+')')}
 c.guards=2;ok(c.troops.length===2&&c.size===2,'set its guards and its soldiers follow');
 c.removeAny(1);ok(c.guards===1&&c.size===1,'lose a soldier and its guards follow');
 c.troops=['militia','militia','militia'];ok(c.guards===3&&c.tc.militia===3,'set its soldiers and its guards follow');
 ok(t.partyRoster(c).groups.length>=1&&!Object.prototype.hasOwnProperty.call(c,'army')&&!Object.prototype.hasOwnProperty.call(c,'tc'),'its formations and counts are kept aside, not on the record');
 {const L=c.look();ok(L.label==='Caravan'&&typeof L.col==='string'&&L.labelCol,'it says how it looks')}
 // ---- your own: militia
 {const ash=t.townBy('Ashford');ash.owner='player';t.ensureEcon(ash);ash.stock.cloth=100;P.gold=2000;
  const dest=TW.filter(x=>x!==ash&&!t.hostileTo(x.owner)&&x.owner!=='player')[0];W.caravans=[];const err=t.hireCaravan('Ashford',dest.name,{cloth:20},4,false),mc=W.caravans[0];
  ok(!err&&mc instanceof t.CaravanParty&&mc.troops.length===4&&mc.troops.every(k=>k==='militia'),'a caravan you hire is a party of 4 militia');
  const g0=P.gold;t.caravanUpkeep();ok(P.gold===g0-t.PCV.upkeep-4*t.PCV.guardUp,'and costs its upkeep');W.caravans=[]}
 // ---- plain data (as a save keeps it) made one, as loading does
 {world();const tw=TW.find(x=>x.owner&&x.owner!=='player');const pc=t.asParty({cv:true,fac:tw.owner,from:tw.name,to:TW[1].name,x:P.x,y:P.y,goods:{grain:5},guards:3,cool:0,dir:1});W.caravans=[pc];
  pc.meet();ok(pc instanceof t.CaravanParty&&G.cv===pc&&/Caravan of/.test(pan()),'a caravan made of plain data meets you as one');t.act('cv-leave');ok(G.mode==='world'&&!G.cv,'and Leave closes it');W.caravans=[]}
 // ---- saves keep the same fields, and loading makes them parties again
 {world();W.caravans=[send(),send()].filter(Boolean);W.caravans[0].guards=2;const before=W.caravans.map(x=>JSON.stringify(x));t.saveGame(true);
  let raw=null;try{raw=JSON.parse(localStorage.getItem(t.slotKey('auto'))||'null')}catch(e){}
  ok(raw&&raw.world.caravans.map(x=>JSON.stringify(x)).join('|')===before.join('|'),'a save keeps each caravan’s plain fields as they were');
  W.caravans=[];t.loadGame();
  ok(W.caravans.length===before.length&&W.caravans.every(x=>x instanceof t.CaravanParty),'loading makes them caravan parties again');
  ok(W.caravans.map(x=>JSON.stringify(x)).join('|')===before.join('|'),'with the same fields');
  ok(W.caravans.every(x=>x.troops.length===x.guards)&&W.caravans[0].size===2,'and the same number of guards')}
 // ---- picked, hovered and met as before; not among the parties drawn as hosts
 {world();t.bandits.length=0;c=send();W.caravans=[c];c.x=P.x+30;c.y=P.y;
  ok(t.pickAt(c.x,c.y-4)===c&&t.objKind(c)==='caravan','a click on it picks the caravan');
  const tip=t.tipFor(c);ok(!!tip&&/Caravan/.test(tip),'hovering shows its card');
  ok(!t.W.parties.includes(c),'it is not among the parties drawn as a host behind a leader (as before)');
  c.x=P.x;c.y=P.y;t.interact(c);ok(G.mode==='dialog'&&G.cv===c,'reaching it opens it')}
 // ---- trade, toll, attack
 {const g=Object.keys(c.goods)[0],n0=c.goods[g],have=t.goodN(g);P.gold=2000;P.hostile={};P.fac=null;t.act('cv-buy',g);ok(t.goodN(g)>have&&(c.goods[g]||0)<n0,'you buy from it');
  t.act('cv-leave');world();c.guards=1;P.troops={hum_knight:10};const gd=P.gold;t.interact(c);t.act('cv-toll');ok(P.gold>gd&&c.tolled,'a weak caravan pays a toll');t.act('cv-leave');
  world();c.guards=5;t.interact(c);t.act('cv-attack');ok(G.enc&&G.enc.kind==='caravan'&&G.enc.ref===c&&G.enc.list.length===5,'attacking it fights its 5 guards');
  P.troops={hum_knight:20};t.autoResolve();ok(!W.caravans.includes(c)&&/take the caravan/.test(pan()),'and winning takes its cargo and strongbox');t.act('cont');done()}
 // ---- seizure: it becomes yours, with half its guards, as militia
 {world();P.hostile={};c=send();W.caravans=[c];c.guards=6;c.x=P.x;c.y=P.y;const fz=TW.find(x=>x.kind==='village'&&x!==from);fz.owner='player';const origin=c.from,r0=t.repAt(origin),rf=t.repAt(fz.name);
  t.interact(c);t.act('cv-seize');t.act('auto');ok(t.repAt(origin)<r0&&t.repAt(fz.name)>=rf,'seizing it costs reputation with the holding it came from, not with your own fief');
  ok(c.mine&&c.fac==='player'&&W.caravans.includes(c)&&c.guards===3&&c.troops.length===3&&c.troops.every(k=>k==='militia'),'a seized caravan is yours, with 3 of its 6 guards, as militia');t.act('cont');done();W.caravans=[]}
 // ---- fights on the map: losses come off its guards; the survivors go on
 {world();P.x=-9000;P.y=-9000;W.fights=[];c=send();W.caravans=[c];c.guards=12;t.bandits.length=0;
  t.bandits.push(t.asParty({x:c.x+4,y:c.y,n:2,kind:'bandits',list:['militia','militia'],t:0,a:0,idle:true,cool:0}));t.updateCaravans(.01);
  ok(c.fight&&W.fights.length===1,'bandits falling on it start a fight');
  for(let i=0;i<4000&&W.fights.length;i++)t.updateFights(.05);
  ok(W.caravans.includes(c)&&!c.fight&&c.guards>=1&&c.guards===c.size&&c.troops.length===c.guards,'it wins; its guards are its survivors ('+c.guards+')');
  t.bandits.length=0;W.fights=[];c.guards=2;t.bandits.push(t.asParty({x:c.x+4,y:c.y,n:14,kind:'bandits',list:Array(14).fill('orc_grunt'),t:0,a:0,idle:true,cool:0}));t.updateCaravans(.01);
  for(let i=0;i<4000&&W.fights.length;i++)t.updateFights(.05);ok(!W.caravans.includes(c),'a big band plunders it');t.bandits.length=0;W.fights=[]}
 // ---- on the road (the owner's play-test 2: "only off the road when they run away from something"): a caravan between two holdings
 // a road joins (the farthest four: on the generated world, of WM.roads; today's map: two of a realm's, 25-80 tiles apart) walks most of its way on
 // the road (its tile a road or a ford, frame by frame), 85% or more; a walker going there by the cheapest way, for comparison
 {world();P.x=-9000;P.y=-9000;t.bandits.length=0;W.lords=[];W.fights=[];const MW=t.MW,K=t.tiles,gen=!!t.WM.graph,road=(x,y)=>{const k=K[Math.floor(y/16)*MW+Math.floor(x/16)];return k===t.T_ROAD||k===t.T_FORD};
  const d=(a,b)=>Math.hypot(a.tx-b.tx,a.ty-b.ty),pairs=[];
  if(gen)for(const r of t.WM.roads){const a=t.townBy(r.a),b=t.townBy(r.b);if(a&&b&&a.owner&&a.owner===b.owner&&d(a,b)>=25&&d(a,b)<=80)pairs.push([a,b])}
  else for(const a of TW)for(const b of TW)if(a!==b&&a.owner&&a.owner===b.owner&&d(a,b)>=25&&d(a,b)<=80)pairs.push([a,b]);
  const trip=(a,b,keep)=>{const c=t.asParty({cv:true,fac:a.owner,from:a.name,to:b.name,x:a.x,y:a.y+14,goods:{grain:5},guards:4,cool:0,dir:1});W.caravans=[c];let on=0,n=0;
    for(;n<30000&&!c.gone;n++){if(keep)t.BRAINS.caravan.think(c,.05);else{t.Router.travel(c,t.gateGoal(b),t.moveStep(t.CARAVAN_SPD,.05));if(Math.hypot(b.x-c.x,b.y+12-c.y)<8)c.gone=true}if(road(c.x,c.y))on++}
    W.caravans=[];return{on:on/Math.max(1,n),n,ok:c.gone}};
  pairs.sort((p,q)=>d(q[0],q[1])-d(p[0],p[1]));const ts=pairs.slice(0,4).map(([a,b])=>[a,b,trip(a,b,true),trip(a,b,false)]);
  ok(ts.length&&ts.every(([,,k])=>k.ok&&k.on>=.85),'a caravan keeps to the road between two holdings it joins: '+ts.map(([a,b,k,f])=>a.name+'-'+b.name+' '+Math.round(k.on*100)+'% of '+k.n+' frames on it'+(k.ok?'':' (not there)')+' (a walker by the cheapest way '+Math.round(f.on*100)+'%)').join('; '))}
 // ---- a battle you join: its force is written back to it
 {c=send();W.caravans=[c];c.guards=5;c.fight='fx';const f=t.forceOf(c);ok(f.kind==='caravan'&&f.src===c&&f.troops.length===5&&f.army,'in a battle you join its guards fight as a force');
  f.troops=f.troops.slice(0,2);t.syncForces([f]);ok(c.guards===2&&c.troops.length===2,'and what is left of them is written back');
  c.fight=null;c.troops=[];t.freeParty(c);ok(c.guards===1&&c.troops.length===1,'a caravan freed with none keeps one guard (as before)');W.caravans=[]}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
