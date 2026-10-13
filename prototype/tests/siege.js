'use strict';
// Sieges and consequences: attacking a holding, the siege camp (ladders, ram, starving), assault and surrender, the fate of a
// captured holding (peace, sack, sack and leave, hand over or keep), fiefs (income, garrison), raids, AI conquest effects and saves.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const panel=()=>document.getElementById('panel').innerHTML;
 const army=()=>{P.troops={hum_knight:30,hum_long:20};P.hp=null;t.vitals();P.morale=80};
 const days=n=>{for(let i=0;i<n;i++)t.dayTick()};
 t.act('begin','soldier');W.critters=[];W.sites=[];W.monsters=[];t.bandits.length=0;G.quietEvents=true;
 const quiet=()=>{W.lords=[];};
 // pick a town and a castle of factions that are not yours
 const town=t.TOWNS.find(x=>x.kind==='town'&&x.owner==='karn'),castle=t.TOWNS.find(x=>x.kind==='castle'&&x.owner==='sylvan'),vil=t.TOWNS.find(x=>x.kind==='village'&&x.owner==='horde');
 const at=x=>{P.x=x.x;P.y=x.y+5;P.tx=null;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;G.encCool=0};
 quiet();army();
 // attacking a friendly holding
 at(town);t.updateWorld(.01);ok(G.mode==='town','a peaceful town opens as usual');t.act('tab','tavern');ok(!/plan-siege/.test(panel()),'the tavern no longer holds the attack');t.act('tab','siege');ok(/Besiege/.test(panel())&&/plan an attack/.test(panel())&&/hostile to you for 60 days/.test(panel()),'a Besiege tab of its own plans the attack');
 const h0=t.honorWith('karn');t.act('plan-siege');ok(G.mode==='besiege'&&/not your enemy/.test(panel()),'the siege screen warns the Karn Clans are not your enemy');
 t.act('sg-declare');ok(t.hostileTo('karn')&&t.honorWith('karn')<=h0-20,'attacking makes them hostile and costs 20 honor');
 // the camp
 t.act('sg-camp');ok(P.siege&&P.siege.town===town.name&&t.besieged(town),'you make a siege camp');
 ok(document.querySelector('[data-act="sg-assault"]').disabled,'no assault before the ladders are built');
 const lvA=t.siegeLv(town);t.act('sg-wait');days(2);at(town);G.lastTown=town;t.clickAt(town.x,town.y-4);
 ok(G.mode==='besiege'&&!document.querySelector('[data-act="sg-assault"]').disabled,'after 2 days the ladders are ready');
 t.act('sg-wait');days(2);ok(t.siegeLv(town)===lvA-1,'a ram after 4 days weakens the walls (level '+lvA+' → '+t.siegeLv(town)+')');
 const g0=town.gar;ok(town.stock&&t.foodDays(town)>0,'the besieged town lives on its stores ('+t.foodDays(town)+' days of food)');t.FOODS.forEach(g=>town.stock[g]=0);['farm','pasture','port'].forEach(k=>town.bld[k]=0);days(2);ok(town.gar<g0,'when the stores run out the garrison starves ('+g0+' → '+town.gar+')');
 P.x+=200;t.updateWorld(.01);ok(!P.siege,'marching away lifts the siege');
 // assault, then take it in peace (independent)
 at(town);t.updateWorld(.01);t.act('sg-camp');days(2);at(town);G.lastTown=town;t.clickAt(town.x,town.y-4);army();t.act('sg-auto');
 ok(G.capture===town&&/Decide its fate/.test(panel()),'storming the walls wins the town');t.act('cont');
 ok(G.mode==='capture'&&/Take it in peace/.test(panel())&&/Sack it/.test(panel()),'you choose its fate');
 const r0=P.renown;t.act('cap-peace');t.act('cont');done();
 ok(town.owner==='player'&&town.turmoil>G.day&&P.renown>r0&&!P.siege,town.name+' becomes your fief, in turmoil');
 at(town);t.updateWorld(.01);ok(G.mode==='town'&&/Fief/.test(panel())&&/turmoil/.test(panel()),'entering your fief shows the Fief tab');
 t.act('tab','recruit');ok(/No one will enlist/.test(panel()),'no recruits while it is in turmoil');
 t.act('tab','fief');const gar=town.gar,kn=P.troops.hum_knight;t.act('fief-station','hum_knight:5');ok(town.gar===gar+5&&P.troops.hum_knight===kn-5,'station 5 knights in the garrison');
 t.act('leave');done();P.troops={};P.wounded={};const gold=P.gold;G.day=town.turmoil;t.dayTick();ok(P.gold-gold>=t.fiefIncome(town)-1&&t.fiefIncome(town)>0,'your fief pays its taxes: '+t.fiefIncome(town)+' gold a day');
 // a faction hostile to you comes for it
 t.addMissingLords();const karnLord=W.lords.find(l=>l.fac==='karn');ok(karnLord,'karn has a lord');t.lordThink(karnLord);
 ok(karnLord.state==='march'&&t.atWar('karn','player'),'the Karn Clans march on your fief ('+karnLord.tgt+')');
 karnLord.troops=Array(40).fill('dw_clan');karnLord.state='siege';karnLord.tgt=town.name;town.gar=2;t.resolveSiege(karnLord,town);
 ok(town.owner==='karn'&&!W.dead.player,'a weak garrison falls, and you lose the fief');
 // sack a castle while serving a faction, and hand it over
 quiet();P.fac='vale';P.hostile={};W.rel[t.rk('vale','sylvan')]={s:'war',since:G.day};army();
 at(castle);t.updateWorld(.01);ok(G.mode==='besiege'&&t.hostileTo('sylvan'),'at war through your employer, '+castle.name+' is hostile');
 t.act('sg-camp');days(2);at(castle);G.lastTown=castle;t.clickAt(castle.x,castle.y-4);army();t.act('sg-auto');t.act('cont');
 const near=t.TOWNS.find(x=>x!==castle&&Math.hypot(x.x-castle.x,x.y-castle.y)<20*t.TILE),rn=near?t.repAt(near.name):0,gs=P.gold,hv=t.honorWith('vale');
 ok(/hand it over/.test(panel())&&/Keep it for yourself/.test(panel()),'under contract you can hand it over or keep it');
 t.act('cap-sack');t.act('cont');done();
 ok(castle.owner==='vale'&&castle.sacked>G.day&&P.gold>gs+200&&t.repAt(castle.name)<=-40&&t.honorWith('vale')>hv,'sacked and handed to the Vale Crown: loot, ruin, reward');
 ok(!near||t.repAt(near.name)<rn,'nearby '+(near?near.name:'')+' hears of the sack');
 at(castle);t.updateWorld(.01);t.act('tab','smith');ok(/was burned/.test(panel()),'the sacked castle\'s smithy is closed');t.act('leave');done();
 // keep it: break the contract
 quiet();const c2=t.TOWNS.find(x=>x.owner==='sylvan'&&x.kind!=='village');army();at(c2);t.updateWorld(.01);t.act('sg-camp');days(2);at(c2);G.lastTown=c2;t.clickAt(c2.x,c2.y-4);army();t.act('sg-auto');t.act('cont');
 t.act('cap-keep');t.act('cont');done();ok(c2.owner==='player'&&!P.fac&&t.hostileTo('vale'),'keeping it breaks your contract and turns the Vale Crown hostile');
 // starve a garrison into surrender
 quiet();P.fac=null;P.hostile={horde:G.day+90};const t3=t.TOWNS.find(x=>x.owner==='horde'&&x.kind!=='village');army();at(t3);t.updateWorld(.01);t.act('sg-camp');t.act('sg-wait');t3.gar=2;t.FOODS.forEach(g=>t3.stock[g]=0);['farm','pasture','port'].forEach(k=>t3.bld[k]=0);days(3);
 at(t3);G.lastTown=t3;t.updateWorld(.01);ok(G.mode==='capture'&&t3.gar===0,t3.name+' starves and surrenders');t.act('cap-leave');t.act('cont');done();
 ok(t3.owner==='horde'&&t3.gar===1&&t3.sacked>G.day,'sack and leave: it stays theirs, ruined and empty');
 // raid a village
 quiet();army();P.inv=P.inv.map(()=>null);t.initCritters();t.ensureEcon(vil);vil.stock.grain=Math.max(vil.stock.grain||0,60);vil.stock.meat=Math.max(vil.stock.meat||0,20);const vr=t.repAt(vil.name);at(vil);t.updateWorld(.01);ok(/Raid/.test(panel()),'a hostile village can be raided');
 t.act('sg-raid-auto');t.act('cont');done();ok(P.raid&&!vil.raided&&t.repAt(vil.name)<vr-20,'beating the militia starts the raid, and the village already hates you');
 G.lastTown=null;G.encCool=0;t.clickAt(vil.x,vil.y-4);ok(G.mode==='besiege'&&/plundered/.test(panel()),'the village is closed while you raid it');t.act('sg-wait');
 for(let i=0;i<40&&P.raid;i++)t.updateWorld(.25);ok(vil.raided>G.day&&t.foodN()>10&&t.repAt(vil.name)<vr-20&&!t.herdOf(vil),'raiding takes food, burns the herd and earns hatred (raided '+(vil.raided>G.day)+', food '+t.foodN()+', rep '+t.repAt(vil.name)+' vs '+vr+', herd '+!!t.herdOf(vil)+', raid '+!!P.raid+')');
 // AI conquest marks a town
 quiet();const prey=t.TOWNS.find(x=>!['horde','player'].includes(x.owner)&&x.kind!=='village'),l={id:'x0',name:'Test Lord',fac:'horde',x:prey.x,y:prey.y,troops:Array(60).fill('orc_grunt'),state:'siege',tgt:prey.name,sd:0,dead:false};
 W.rel[t.rk('horde',prey.owner)]={s:'war',since:G.day};W.lords=[l];prey.gar=2;t.resolveSiege(l,prey);ok(prey.owner==='horde'&&prey.turmoil>G.day,'lords who take a town leave it in turmoil');
 // a friendly town besieged by a lord is closed to you; break the siege to open it
 quiet();P.fac=null;P.hostile={};army();const fr=t.TOWNS.find(x=>x.kind!=='village'&&!['karn','player'].includes(x.owner)&&!x.sacked&&!x.turmoil),bl={id:'b0',name:'Besieger',fac:'karn',x:fr.x+16,y:fr.y+12,troops:Array(8).fill('dw_clan'),state:'siege',tgt:fr.name,sd:0,dead:false,cool:0};
 W.lords=[bl];W.rel[t.rk(fr.owner,'karn')]={s:'war',since:G.day};at(fr);t.updateWorld(.01);
 ok(G.mode==='besiege'&&/gates are barred/.test(panel())&&/Attack Besieger/.test(panel()),'a besieged friendly town shows only the blockade');
 ok(!/data-act="tab"/.test(panel())&&!/data-act="buy"/.test(panel()),'no trade, recruits or jobs while it is besieged');
 const rf=t.repAt(fr.name);t.act('sg-relieve','0');ok(G.enc&&G.enc.kind==='lord'&&t.hostileTo('karn'),'attacking the besieger makes his faction hostile');
 t.act('auto');ok(/break the siege/.test(panel())&&t.repAt(fr.name)>rf,'breaking the siege earns thanks in '+fr.name);t.act('cont');done();
 at(fr);t.updateWorld(.01);ok(G.mode==='town','with the siege broken the gates open');t.act('leave');done();
 // your raid draws the owner's lords
 const vi2=t.TOWNS.find(x=>x.kind==='village'&&x.owner==='karn'&&!x.raided),kl={id:'k1',name:'Rescuer',fac:'karn',x:vi2.x+300,y:vi2.y,troops:Array(12).fill('dw_clan'),state:'rest',tgt:t.fiefsOf('karn')[0].name,sd:0,dead:false,cool:0};
 W.lords=[kl];army();at(vi2);t.updateWorld(.01);{const r=Math.random;Math.random=()=>.5;t.act('sg-raid-auto');Math.random=r}/* (the auto-resolve's dice fixed: this is about the lords, not luck) */t.act('cont');done();t.lordThink(kl);ok(P.raid&&kl.state==='relieve'&&kl.tgt===vi2.name,'the village lords ride to stop your raid');
 const f0=t.foodN();P.x+=200;t.updateWorld(.01);ok(!P.raid&&vi2.raided>G.day,'walking away ends the raid early with part of the loot'+(P.raid?' (still raiding: mode '+G.mode+', paused '+G.paused+', capture '+!!G.capture+', stay '+!!P.stay+', '+Math.round(Math.hypot(P.x-vi2.x,P.y-vi2.y))+' px)':''));W.lords=[];
 // save and load
 G.mode='world';G.modal=false;t.hidePanel();t.saveGame();const snap=JSON.stringify(t.TOWNS.map(x=>[x.owner,x.sacked||0,x.raided||0,x.turmoil||0]));t.act('load');
 ok(JSON.stringify(t.TOWNS.map(x=>[x.owner,x.sacked||0,x.raided||0,x.turmoil||0]))===snap,'owners, sacks, raids and turmoil survive a reload');
 t.updateHUD(true);t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
