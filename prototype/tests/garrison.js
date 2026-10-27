'use strict';
// Garrisons: a lord resting at his realm's holding goes inside: off the map, his soldiers defending it with the garrison (in
// your siege and in lords' sieges), eating its stores, and falling with it; he rides out when he campaigns, can't get into a
// besieged holding, stays to defend one, and receives you in the town's hall. Bandit bands shelter in camps at night and
// ride out at dawn; attacking the camp then means fighting them too.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;W.monsters=[];G.quietEvents=true;G.encCool=1e9;P.x=10;P.y=10;
 const panel=()=>document.getElementById('panel').innerHTML,world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.enc=null};
 for(let i=0;i<200;i++)t.updateLords(.05);
 const inside=W.lords.filter(l=>!l.dead&&l.inside);ok(inside.length>=W.lords.filter(l=>!l.dead).length/2,inside.length+' of '+W.lords.filter(l=>!l.dead).length+' lords rest inside their holdings at the start');
 const l=inside[0],h=t.townBy(l.inside);
 ok(h.owner===l.fac&&t.lordsInside(h).includes(l),l.name+' is inside '+h.name+', a holding of his realm');
 ok(!t.pickAt(l.x,l.y)||t.pickAt(l.x,l.y)!==l,'a lord inside cannot be clicked on the map');
 // defending
 const def=t.siegeDefenders(h);ok(def.lords.includes(l)&&def.list.length===t.garList(h).length+t.insideTroops(h).length,'his soldiers defend it with the garrison ('+t.garList(h).length+' + '+t.insideTroops(h).length+')');
 const fn=t.foodNeed(h);l.inside=null;const fn0=t.foodNeed(h);l.inside=h.name;ok(fn>fn0,'and eat from its stores');
 G.lastTown=null;G.mode='world';t.enterTown(h);ok(!new RegExp(l.name).test(panel())&&/Lords inside: \?\?\?/.test(panel()),'a lord you have not met is inside, his name unknown');t.act('leave');
 {const gb=t.garrisonBody(h);G.bes=h;G.mode='besiege';t.showSiege();const sg=panel();t.hidePanel();G.mode='world';G.bes=null;
  ok(!new RegExp(l.name).test(gb)&&/\?\?\?/.test(gb)&&!new RegExp(l.name).test(sg)&&/\?\?\?/.test(sg),'nor do the Garrison tab and the siege screen name him (???)')}
 t.KNOWLEDGE.lord(l);G.lastTown=null;world();t.enterTown(h);ok(new RegExp(l.name).test(panel())&&/inside/.test(panel()),'once met, the town panel names him with the garrison');t.act('leave');
 // the Garrison tab: everything about who would defend it
 G.lastTown=null;G.mode='world';G.modal=false;t.hidePanel();t.enterTown(h);t.act('tab','garrison');
 ok(/On the walls/.test(panel())&&new RegExp(l.name).test(panel())&&/Defence power/.test(panel())&&/Walls/.test(panel())&&/Patrol/.test(panel()),'every holding has a Garrison tab: the soldiers on the walls, lords inside, defence power, walls, food and its patrol');
 ok(t.TOWNS.every(x=>t.townTabs(x).some(y=>y[0]==='garrison')),'in every holding');t.act('leave');
 { const fief=t.TOWNS.find(x=>x!==h&&x.kind==='town'),fo=fief.owner;fief.owner='player';G.lastTown=null;G.mode='world';G.modal=false;t.hidePanel();t.enterTown(fief);
   t.act('tab','fief');ok(!/fief-station/.test(panel())&&/Garrison tab/.test(panel()),'the Fief tab points to it');
   P.troops={hum_knight:4};P.gold=500;t.act('tab','garrison');const g=fief.gar;ok(/Your soldiers here/.test(panel())&&/fief-station/.test(panel()),'in your fief it holds the soldiers you hire, station and call up');
   t.act('fief-station','hum_knight:1');t.act('fief-hire','1');ok(fief.gar===g+2&&/Garrison/.test(panel())&&G.town.tab==='garrison','stationing and hiring work there');t.act('leave');fief.owner=fo}
 // riding out, and back in
 l.state='march';const enemy=t.TOWNS.find(x=>x.owner&&t.atWar(l.fac,x.owner))||t.TOWNS.find(x=>x.owner!==l.fac);l.tgt=enemy.name;t.updateLords(.05);
 ok(!l.inside&&Math.hypot(l.x-h.x,l.y-h.y)<30,'when a lord campaigns, they ride out of the gate');
 l.state='home';l.tgt=h.name;l.x=h.x;l.y=h.y+12;t.updateLords(.05);ok(l.inside===h.name&&l.state==='rest','coming home, they go back in');
 // a besieged holding: he stays to defend; another cannot get in
 const sieger=W.lords.find(x=>!x.dead&&x.fac!==l.fac);const sf=sieger.fac,st=sieger.state,stg=sieger.tgt;sieger.state='siege';sieger.tgt=h.name;sieger.inside=null;
 t.lordThink(l);t.updateLords(.05);ok(l.inside===h.name,'a siege does not draw them out: they defend');
 const l2=W.lords.find(x=>!x.dead&&x!==l&&x.fac===l.fac);if(l2){const in2=l2.inside;l2.inside=null;l2.state='home';l2.tgt=h.name;l2.x=h.x;l2.y=h.y+12;t.updateLords(.05);ok(!l2.inside,'another lord cannot get into the besieged holding');l2.state='rest';if(in2)l2.inside=in2}
 // the holding falls: he falls with it
 h.gar=1;l.troops=['hum_levy'];sieger.troops=Array(40).fill('hum_knight');W.rel[t.rk(sf,l.fac)]={s:'war',since:1};t.resolveSiege(sieger,h);
 ok(h.owner===sf&&l.dead&&!l.inside,'when it falls to a siege, the lords inside are taken');
 // the hall: you meet a lord there
 const l3=W.lords.find(x=>!x.dead&&x.inside&&t.townBy(x.inside).kind==='town'&&!t.hostileTo(x.fac));
 if(l3){const tw=t.townBy(l3.inside);world();G.lastTown=null;t.enterTown(tw);t.act('scene-enter');const S=G.scene,n=S.npcs.find(x=>x.lord===l3.id);
   ok(n,l3.name+' stands by the hall of '+tw.name);S.p.x=n.x;S.p.y=n.y;t.sceneUse();ok(G.mode==='scene'&&G.modal&&new RegExp(l3.name).test(panel())&&/Holding court/.test(panel())&&!/lord-attack/.test(panel()),'talking to them opens an audience, with no attack');
   t.frame();t.act('lord-leave');ok(G.mode==='scene'&&!G.modal,'and leaving it returns to the street');t.exitScene();t.act('leave')}
 else ok(true,'(no lord in a town to visit)');
 // bandits shelter in camps at night
 world();G.encCool=1e9;const c=t.camps().find(x=>!x.cleared);c.bands=[];const b={x:c.x+30,y:c.y,n:3,kind:'bandits',list:['militia','militia','militia'],t:9,a:0,idle:false,cool:0};t.bandits.push(t.asParty(b));P.x=c.x+900;P.y=c.y+900;
 G.clock=t.DAY*.8;for(let i=0;i<180&&t.bandits.includes(b);i++)t.updateWorld(.05);// (180 frames: the slower pace of Phase 1, D9; it was 80)
 ok(!t.bandits.includes(b)&&c.bands.includes(b),'at night a band goes into a camp nearby');
 ok(!t.pickAt(b.x,b.y)||t.pickAt(b.x,b.y)===c,'and is off the map');
 t.saveGame(true);c.bands=[];t.loadGame();const cl=t.camps().find(x=>x.tx===c.tx&&x.ty===c.ty);ok(cl.bands.length===1,'it is saved with its camp');
 G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;t.campFight(cl);ok(G.enc&&G.enc.kind==='camp'&&G.enc.list.length>=10&&/sheltering inside/.test(panel()),'attacking the camp means fighting the band too ('+G.enc.list.length+' fighters)');
 t.act('flee');G.clock=t.DAY*.2;G.encCool=1e9;t.updateWorld(.05);ok(!cl.bands.length&&t.bandits.some(x=>x.n===3&&Math.hypot(x.x-cl.x,x.y-cl.y)<30),'at dawn it rides out again');
 // guards come from the people: each new one is a volunteer who leaves the population
 {const z=t.TOWNS.find(q=>q.owner&&q.owner!=='player'&&q.kind==='town'&&!t.W.lords.some(l=>l.tgt===q.name||l.inside===q.name));t.ensureEcon(z);t.W.treas[z.owner]=5000;z.gar=4;z.pop=200;z.vol=3;const p0=z.pop;
  t.worldDay();ok(z.gar===5&&z.vol===2&&z.pop===p0-1,'a realm refills a garrison by a guard a day, a volunteer from its people ('+z.gar+' guards, '+z.vol+' volunteers left, '+z.pop+' people)');
  z.vol=0;const g1=z.gar;t.worldDay();ok(z.gar===g1,'with no volunteers left, no new guard');
  // a lost watch is only replaced once the garrison has been refilled from the people
  t.W.patrols=t.W.patrols.filter(q=>q.home!==z.name);z.gar=z.T.patrol.keep+z.T.patrol.size-1;z.vol=0;t.sendWatch(z);ok(!t.W.patrols.some(q=>q.home===z.name),'a holding with no guards to spare sends no new patrol');
  z.vol=5;t.worldDay();t.sendWatch(z);ok(t.W.patrols.some(q=>q.home===z.name),'once its people have filled the garrison again, the new watch goes out')}
 {const f=t.TOWNS.find(q=>q.owner==='player')||t.TOWNS.find(q=>q.kind==='village');f.owner='player';t.ensureEcon(f);f.gar=0;f.vol=0;P.gold=1000;t.G.mode='world';t.G.modal=false;t.hidePanel();t.G.lastTown=null;t.enterTown(f);t.act('tab','garrison');
  t.act('fief-hire','1');ok(f.gar===0&&P.gold===1000,'in your fief, no volunteers means no guards to hire');f.vol=3;const p0=f.pop;t.act('fief-hire','5');ok(f.gar===3&&f.pop===p0-3&&P.gold===1000-90,'and hiring takes them from its people (3 of 5, paid for 3)');t.act('leave')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
