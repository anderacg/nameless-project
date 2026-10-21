'use strict';
// Fights: when parties clash on the map they stop and fight it out over time: a skirmish is soon over, a clash of armies
// grinds on, and each side wears the other down by its strength until one breaks. Lords and patrols nearby ride in on their
// friends' side. You can join either side (not the bandits', not against your employer); the realms you fight turn hostile,
// and the battle becomes yours, with everyone in it beside you or against you. Fights are saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;W.monsters=[];W.patrols=[];G.quietEvents=true;G.encCool=1e9;P.x=20;P.y=20;
 const panel=()=>document.getElementById('panel').innerHTML,world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.enc=null;G.fg=null};
 // (the two lords' Tactics and Medicine at 0, their training too: a lord's are rolled with the world (realms.js lordStats), and
 // Tactics counts for his army while Medicine saves some of the blows by chance, so the sides are as strong as their troops)
 const lordsAt=(n1,n2,x,y)=>{const fa=t.FIDS[0],fb=t.FIDS[1],a=W.lords.find(l=>l.fac===fa&&!l.dead),b=W.lords.find(l=>l.fac===fb&&!l.dead);W.rel[t.rk(fa,fb)]={s:'war',since:1};
   for(const l of [a,b])for(const k of ['tact','med'])t.lordStats(l).sk[k]={lv:0,xp:-1e9};
   Object.assign(a,{inside:null,fight:null,x,y,troops:Array(n1).fill('hum_spear'),state:'march',tgt:t.TOWNS.find(q=>q.owner===fb).name,cool:0});Object.assign(b,{inside:null,fight:null,x:x+10,y,troops:Array(n2).fill('hum_spear'),state:'march',tgt:t.TOWNS.find(q=>q.owner===fa).name,cool:0});return [a,b]};
 const run=(f,max)=>{let i=0;for(;i<max&&W.fights.includes(f);i++)t.updateFights(.05);return i};
 // two armies meet: a fight, not a moment
 // (the lords not in the case parked off the map, each 100 px from the next: together, those at war would fight there as the
 // map runs, and a realm could come out of it with every lord beaten)
 W.lords.forEach((l,i)=>{l.x=-9000-i*100;l.y=-9000;l.inside=null});let [a,b]=lordsAt(10,7,2000,1200);t.updateLords(.05);
 let f=W.fights.find(x=>x.sides.flat().includes(a.uid));ok(f&&a.fight===f.id&&b.fight===f.id,'two armies at war that meet start a battle');
 const ax=a.x;t.updateLords(.05);ok(a.x===ax,'and stand fighting instead of marching on');
 for(let i=0;i<30;i++)t.updateFights(.05);ok(W.fights.includes(f)&&a.troops.length+b.troops.length<17&&a.troops.length+b.troops.length>6,'both sides wear each other down over time ('+a.troops.length+' vs '+b.troops.length+')');
 run(f,4000);ok(!W.fights.includes(f)&&b.dead&&!a.dead&&!a.fight,'the stronger side wins; the other is routed ('+a.troops.length+' left)');
 // big battles take longer than small ones
 W.lords.forEach((l,i)=>{l.x=-9000-i*100;l.y=-9000});[a,b]=lordsAt(4,4,2400,1200);t.startFight([a],[b]);const fs=W.fights[W.fights.length-1],small=run(fs,20000);
 W.lords.forEach((l,i)=>{l.dead=false;l.x=-9000-i*100;l.y=-9000});[a,b]=lordsAt(40,40,2400,1200);t.startFight([a],[b]);const fb=W.fights[W.fights.length-1],big=run(fb,40000);
 ok(big>small*2,'a clash of 80 lasts much longer than a skirmish of 8 ('+small+' vs '+big+' steps)');
 // others ride in
 W.lords.forEach((l,i)=>{l.dead=false;l.x=-9000-i*100;l.y=-9000;l.fight=null});[a,b]=lordsAt(15,15,2400,1200);f=t.startFight([a],[b]);
 const h=t.TOWNS.find(q=>q.owner===a.fac);t.TOWNS.forEach(q=>{if(q.owner===a.fac)q.gar=40});t.patrolDay();W.patrols=W.patrols.filter(p=>p.fac===a.fac).slice(0,1);const pt=W.patrols[0];
 if(pt){pt.x=f.x+30;pt.y=f.y;t.updateFights(.05);ok(pt.fight===f.id&&f.sides[0].includes(pt.uid),'a patrol of '+a.fac+' nearby rides in on its realm\'s side')}else ok(true,'(no patrol to ride in)');
 // you join
 world();P.troops={hum_knight:30};P.x=f.x+20;P.y=f.y;P.fac=null;P.hostile={};t.interact(a);
 ok(G.fg===f&&/Battle near/.test(panel())&&(panel().match(/Join them/g)||[]).length===2,'clicking anyone in the battle shows it, with a side to join on either hand');
 t.act('fg-join','0');ok(G.enc&&G.enc.kind==='field'&&G.enc.allies.includes(a)&&G.enc.foes.includes(b)&&t.hostileTo(b.fac)&&!t.hostileTo(a.fac),'joining a side: its forces beside you, the other\'s against you, and their realm turns hostile');
 ok(/You ride into the battle/.test(panel()),'(the battle panel)');
 t.act('auto');ok(/Victory/.test(panel())&&b.dead&&!W.fights.includes(f)&&!a.fight&&!a.dead,'winning it routs the other side, ends the battle and frees your side');
 ok(/Gold|XP/.test(panel()),'and pays out like any victory');t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // not the bandits' side, not against your employer
 world();W.caravans=[];const from=t.townBy('Saltmere');from.owner=t.HOME.Saltmere;from.sacked=from.raided=0;t.ensureEcon(from);from.stock.cloth=400;from.stock.timber=400;let cv=null;for(let i=0;i<20&&!cv;i++)cv=t.sendCaravan(from);
 // (a generated world may leave Saltmere no friend within a caravan's reach short of cloth or timber: its nearest neighbour there made one)
 if(!cv){const E=t.WORLD_SCALE.econ,d=z=>Math.hypot(z.tx-from.tx,z.ty-from.ty),nb=t.TOWNS.filter(z=>z!==from&&d(z)>E.caravanNear&&d(z)<E.caravanFar).sort((a,b)=>d(a)-d(b))[0];
  if(nb){nb.owner=from.owner;nb.sacked=nb.raided=0;t.ensureEcon(nb);nb.stock.cloth=nb.stock.timber=0;cv=t.sendCaravan(from)}}
 W.caravans=cv?[cv]:[];
 if(cv){const bd={x:cv.x+5,y:cv.y,n:12,kind:'bandits',list:Array(12).fill('militia'),t:0,a:0,idle:true,cool:0};t.bandits.push(t.asParty(bd));P.x=-9000;t.updateCaravans(.01);const fc=W.fights.find(x=>x.sides.flat().includes(cv.uid));
   ok(fc&&cv.fight,'bandits falling on a caravan start a fight with its guards');
   G.fg=fc;t.fightMeet(fc);ok(/They are bandits/.test(panel()),'you cannot side with bandits');world();
   run(fc,8000);ok(!W.caravans.includes(cv)&&t.bandits.includes(bd),'a big band beats the guards and plunders the caravan')}
 else ok(false,'a caravan to test with');
 world();[a,b]=lordsAt(10,10,2600,1300);f=t.startFight([a],[b]);P.fac=a.fac;G.fg=f;t.fightMeet(f);ok(/Your employer is on the other side/.test(panel()),'you cannot fight against your employer');world();P.fac=null;
 // saved
 t.saveGame(true);const nf=W.fights.length;W.fights=[];t.loadGame();ok(W.fights.length===nf&&W.lords.find(l=>l.uid===a.uid).fight===f.id,'battles in progress are saved');
 W.fights=[];P.x=-9000;P.y=-9000;const la=W.lords.find(l=>l.uid===a.uid);W.lords.forEach((l,i)=>{if(l!==la){l.x=-9000-i*100;l.y=-9000}});t.updateLords(.05);ok(!la.fight,'a party in a battle that no longer exists goes free');
 world();P.x=2600;P.y=1300;[a,b]=lordsAt(10,10,2600,1300);t.startFight([a],[b]);t.drawWorld();ok(true,'the map draws battles');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
