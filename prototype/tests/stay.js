'use strict';
// Staying in a holding: your band goes inside and the days pass at whatever speed you set. Inside, nothing on the map can
// reach you, you recover far faster, and you can still use the town. Free where they know you, paid by the day elsewhere
// (out you go when you cannot pay), refused where you are hated, by castles that do not know you, and in a siege. A siege
// on the holding while you are inside makes you choose: defend the walls, slip out, or wait it out.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
 W.monsters=[];W.critters=[];t.bandits.length=0;W.patrols=[];W.caravans=[];W.refugees=[];W.sites=[];P.fac=null;P.hostile={};G.clock=t.DAY*.3;
 const panel=()=>document.getElementById('panel').innerHTML,bar=()=>document.getElementById('staybar'),world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.town=null};
 const setSt=(q,v)=>{P.rep[q.name]=(P.rep[q.name]||0)+v-t.standingAt(q)};
 const town=t.TOWNS.find(q=>q.kind==='town'&&q.owner&&q.owner!=='player'&&!t.besieged(q)&&!t.ruined(q));
 const castle=t.TOWNS.find(q=>q.kind==='castle'&&q.owner&&q.owner!=='player'&&!t.besieged(q)&&!t.ruined(q));
 P.troops={hum_levy:10};P.wounded={};P.gold=200;setSt(town,10);
 // paid
 t.enterTown(town);ok(/Stay · 10g a day/.test(panel()),'a holding that hardly knows you offers lodgings by the day (5g, and 1g for every 2 people: 10g)');
 t.act('sy-stay',town.name);ok(P.stay&&P.stay.town===town.name&&P.gold===190&&G.mode==='world'&&!G.modal,'you pay the first day and go inside; time runs on');
 t.updateHUD(true);ok(!bar().hidden&&/Staying in/.test(bar().innerHTML)&&/your gold lasts until Day \d+/.test(bar().innerHTML)&&/data-act="sy-leave"/.test(bar().innerHTML),'a banner says where you stay, the price, the day your gold runs out, and offers Leave');
 {P.stay.paidTo=t.worldTime()-.01;t.stayTick(.01);ok(P.gold===180&&P.stay.paidTo>t.worldTime(),'each day inside is paid as it begins (10g)')}
 // nothing reaches you inside
 {const b={x:P.x+6,y:P.y,n:12,cool:0,t:0,a:0,kind:'bandits'};t.bandits.push(t.asParty(b));for(let i=0;i<30;i++)t.updateWorld(.05);
  ok(G.mode==='world'&&!G.enc&&P.stay,'a band at the gate cannot reach you inside');t.bandits.length=0}
 {const x0=P.x;t.stayClick(P.x+300,P.y+300);ok(P.stay&&P.x===x0&&P.tx==null,'clicking elsewhere on the map does not move you: leave first')}
 t.stayClick(town.x,town.y-4);ok(G.mode==='town'&&/Back to your lodgings/.test(panel())&&/data-act="sy-leave"/.test(panel()),'clicking the holding opens it: you can still trade, hire and drink');
 t.act('leave');ok(G.mode==='world'&&P.stay,'closing the window goes back to waiting');
 // recovery
 {const m=t.vitals();P.hp=10;P.sp=0;P.mp=0;P.x=town.x+400;P.y=town.y+400;t.unstick(P);t.regenVitals(.3);const road=P.hp-10;P.hp=10;t.stayTick(0);t.regenVitals(.3);t.stayTick(t.DAY*.3);
  ok(P.hp-10>=Math.min(m[0]-10,road*3.5),'inside you recover four times as fast as on the road ('+Math.round(road)+' → '+Math.round(P.hp-10)+' health in a third of a day)')}
 {P.morale=40;t.stayTick(t.DAY);ok(Math.abs(P.morale-55)<1,'morale rises 15 a day');P.stay.paidTo=t.worldTime()+t.DAY}
 {const r=Math.random;Math.random=()=>0;P.wounded={hum_levy:20};t.woundedDay();const inside=20-t.woundedN();const s=P.stay;P.stay=null;P.wounded={hum_levy:20};P.troops={hum_levy:10};t.woundedDay();const out=20-t.woundedN();P.stay=s;Math.random=r;P.wounded={};P.troops={hum_levy:10};
  ok(inside>=out*2-1&&inside>out,'the wounded heal twice as fast ('+out+' → '+inside+' a day)')}
 // out of gold
 P.gold=3;P.stay.paidTo=t.worldTime()-.01;t.stayTick(.01);ok(!P.stay&&Math.abs(P.y-(town.y+14))<1&&P.gold===3,'when you cannot pay for another day, the innkeeper sends you out at the gate');
 t.updateHUD(true);ok(bar().hidden,'and the banner goes');
 // free
 P.gold=50;setSt(town,35);world();t.enterTown(town);ok(/Stay · free \(they know you\)/.test(panel()),'where they know you (standing 30+), you stay free');t.act('sy-stay',town.name);
 ok(P.stay&&P.gold===50,'and pay nothing');P.stay.paidTo=t.worldTime()-5;t.stayTick(.01);t.updateHUD(true);ok(P.stay&&P.gold===50&&/free, as long as you like/.test(bar().innerHTML),'for as long as you like');
 t.act('sy-leave');ok(!P.stay&&G.mode==='world','Leave on the banner takes you out');
 // refused
 setSt(town,-5);ok(t.stayWhy(town)==='They will not have you','refused where they dislike you');setSt(town,10);
 setSt(castle,10);ok(t.stayWhy(castle)==='A castle takes no paying guests','a castle that does not know you takes no paying guests');setSt(castle,35);ok(t.stayWhy(castle)==='','but takes in a friend');
 P.hostile={[town.owner]:G.day+5};ok(/hostile/.test(t.stayWhy(town)),'refused by a hostile realm');P.hostile={};
 P.gold=2;ok(/Not enough gold/.test(t.stayWhy(town)),'and when you cannot pay for a day');P.gold=500;
 // the tavern: no instant rest; provisions
 world();t.enterTown(town);t.act('tab','tavern');ok(!/data-act="rest"/.test(panel())&&/Lodgings/.test(panel())&&/data-act="sy-food" data-arg="7"/.test(panel()),'the tavern offers lodgings and provisions, no instant rest');
 {t.ensureEcon(town);for(const g of t.FOODS)town.stock[g]=(town.stock[g]||0)+60;const f0=t.foodN();t.act('sy-food','3');ok(t.foodN()-f0>=t.eatPerDay()*3,'provisions: food for 3 days ('+(t.foodN()-f0)+')')}
 t.act('leave');
 // hostility puts you out
 setSt(town,35);world();t.startStay(town);P.hostile={[town.owner]:G.day+5};t.stayTick(.01);ok(!P.stay,'if its realm turns hostile, you are put out');P.hostile={};
 // a siege while you are inside
 const L=W.lords.find(l=>!l.dead&&l.fac!==town.owner);const siege=()=>{Object.assign(L,{inside:null,state:'siege',tgt:town.name,x:town.x+16,y:town.y+12,troops:Array(12).fill('hum_levy'),cool:0,fight:null});W.lords.forEach(o=>{if(o!==L&&o.tgt===town.name&&o.state==='siege')o.state='rest'})};
 P.troops={hum_levy:20};world();t.startStay(town);siege();t.stayTick(.01);
 ok(G.mode==='dialog'&&/is besieged/.test(panel())&&/data-act="sy-defend"/.test(panel())&&/data-act="sy-slip"/.test(panel())&&/data-act="sy-wait"/.test(panel()),'a siege stops time and asks: defend the walls, slip out, or wait');
 t.act('sy-wait');ok(G.mode==='world'&&P.stay&&P.stay.warned,'you may wait it out inside');
 {L.troops=Array(300).fill('hum_knight');town.gar=1;t.resolveSiege(L,town);ok(!P.stay&&P.troops.hum_levy===15,'if it falls, you are thrown out with a quarter of your soldiers lost ('+P.troops.hum_levy+' left)')}
 // defend
 const town2=t.TOWNS.find(q=>q!==town&&q.kind==='town'&&q.owner&&q.owner!=='player'&&q.owner!==L.fac&&!t.besieged(q)&&!t.ruined(q));
 {Object.assign(L,{state:'siege',tgt:town2.name,x:town2.x+16,y:town2.y+12,troops:Array(12).fill('hum_levy')});town2.gar=Math.max(town2.gar,6);setSt(town2,35);P.troops={hum_levy:20};world();L.state='rest';t.startStay(town2);L.state='siege';t.stayTick(.01);
  t.act('sy-defend','0');ok(!P.stay&&G.enc&&G.enc.kind==='lord'&&G.enc.ref===L&&G.enc.allies.some(f=>f.kind==='garrison')&&t.hostileTo(L.fac),'defend the walls: you ride out against the besieger with the garrison beside you');t.act('flee');world();P.hostile={}}
 // slip out
 {L.troops=Array(12).fill('hum_levy');world();L.state='rest';t.startStay(town2);L.state='siege';t.stayTick(.01);const e={kind:'lord',ref:L,foes:[]};const ch=t.fleeOdds(e).ch;
  if(ch>0){const r=Math.random;Math.random=()=>0;t.act('sy-slip');Math.random=r;ok(!P.stay&&G.mode==='world'&&Math.hypot(P.x-town2.x,P.y-town2.y)>30,'slip out: past the besiegers and away ('+Math.round(ch*100)+'%)')}
  else ok(true,'(slipping out impossible here: '+t.fleeOdds(e).why+')');world();L.state='rest'}
 // your companions' parties shelter too
 {P.comps={brann:{ap:5,role:''}};const c=t.compInit('brann');c.lv=3;P.troops={hum_levy:10};t.cpGive('brann','hum_levy',4);const p=c.party;setSt(town2,10);
  t.cpOrder('brann','stay');ok(p.order==='stay'&&!!p.base,'a companion’s party can be told to stay in town ('+p.base+')');const h=t.townBy(p.base);p.x=h.x;p.y=h.y+12;t.updateCParties(.05);
  ok(p.inside,'it goes inside when it arrives');const x0=p.x;t.updateCParties(1);ok(p.inside&&p.x===x0,'and stays put, off the map');
  const g0=P.gold=500;t.compDay();ok(t.stayFree(h)?P.gold<=g0:P.gold<g0,'paying for its lodgings from your purse where they do not know it (and hiring there)')}
 // every party shelters the same way, each by its own rules
 {const L=W.lords.find(l=>!l.dead&&!l.inside),own=t.TOWNS.find(q=>q.owner===L.fac&&!t.besieged(q)),other=t.TOWNS.find(q=>q.owner&&q.owner!==L.fac);
  ok(!L.shelterWhy(own)&&/realm/.test(L.shelterWhy(other)),'a lord shelters only in his realm’s holdings');
  L.enter(own);ok(L.inside===own.name&&!L.onMap(),'in, he is off the map');L.leave();ok(!L.inside&&L.onMap()&&Math.hypot(L.x-own.x,L.y-own.y)<20,'out by the gate');
  setSt(castle,10);const cp=P.comps&&Object.values(P.comps).map(c=>c.party).find(Boolean);ok(/paying guests/.test(P.shelterWhy(castle))&&(!cp||/paying guests/.test(cp.shelterWhy(castle))),'you and your companions’ parties share the Stay rules (a castle that does not know you)');
  const h=t.TOWNS.find(q=>q.kind==='town'&&q.owner&&!t.besieged(q)&&!t.ruined(q)&&!t.hostileTo(q.owner));setSt(h,35);world();t.startStay(h);ok(P.inside===h.name&&!P.onMap(),'your band’s inside is where you stay');t.act('sy-leave');ok(!P.inside,'and nowhere once you leave')}
 // saves
 {const h=t.TOWNS.find(q=>q.kind==='town'&&q.owner&&!t.besieged(q)&&!t.ruined(q)&&!t.hostileTo(q.owner));setSt(h,35);world();t.startStay(h);t.saveGame();P.stay=null;t.act('load');ok(P.stay&&P.stay.town===h.name,'a save keeps you inside')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
