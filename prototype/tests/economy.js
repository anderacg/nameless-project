'use strict';
// The economy: new goods and estates, stock in every holding, production chains, people and prosperity, prices from stock
// that your trading moves, taxes and volunteers, realm treasuries in each Realm economy mode, caravans routing surplus to
// shortage, your own caravans, sieges decided by food, raids on the stores, saves, and a 60-day run of the whole world.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TW=t.TOWNS;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;W.monsters=[];G.quietEvents=true;t.setEconMode('full');
 const ash=t.townBy('Ashford'),karn=t.townBy('Karn Hold');
 ok(['stone','wool','tools','ale'].every(g=>t.GOODS[g])&&['quarry','smithy','brewery','granary'].every(k=>t.ESTATES[k]),'new goods (stone, wool, tools, ale) and estates (quarry, smithy, brewery, granary)');
 ok(TW.every(x=>x.stock&&x.pop>0&&x.pros>0),'every holding keeps stores, people and prosperity');
 ok(t.marketPrice(ash,'grain')<t.marketPrice(karn,'grain')&&t.marketPrice(karn,'iron')<t.marketPrice(ash,'iron'),'each town keeps its character: grain cheap in Ashford ('+t.marketPrice(ash,'grain')+'g vs '+t.marketPrice(karn,'grain')+'g), iron in Karn Hold');
 // trading moves the market
 P.gold=5000;P.inv=P.inv.map(()=>null);ash.stock.grain=60;const p0=t.nextBuy(ash,'grain');const r=t.buyGoods(ash,'grain',25);
 ok(r.got===25&&ash.stock.grain===35&&t.nextBuy(ash,'grain')>p0,'buying 25 grain empties the market and raises the price ('+p0+'g → '+t.nextBuy(ash,'grain')+'g)');
 const s0=t.nextSell(ash,'grain');t.sellGoods(ash,'grain',25);ok(ash.stock.grain===60&&t.nextSell(ash,'grain')<s0+1,'selling it back fills the market again');
 ash.stock.spice=0;ok(t.buyGoods(ash,'spice',5).got===0,'you cannot buy what the market does not have');
 ash.stock.grain=0;ok(t.marketState(ash,'grain')==='shortage'&&t.marketPrice(ash,'grain')>=t.GOODS.grain.base*2,'an empty market shows a shortage and a high price');ash.stock.grain=300;ok(t.marketState(ash,'grain')==='surplus','a glut shows a surplus');
 // production chains
 ash.bld.smithy=1;ash.stock.iron=0;ash.stock.timber=50;let out=t.produce(ash,null);ok(!out.tools,'a smithy without iron makes nothing');
 ash.stock.iron=50;const i0=ash.stock.iron;out=t.produce(ash,null);ok(out.tools>=1&&out.arrows>=1&&ash.stock.iron<i0,'with iron and timber it makes tools and arrows ('+out.tools+' tools, '+out.arrows+' arrows) and uses the iron');
 ash.bld.brewery=1;ash.stock.grain=50;out=t.produce(ash,null);ok(out.ale>=1,'a brewery turns grain into ale');
 // people: famine and growth
 const keep={...ash.stock},kb={...ash.bld};['farm','pasture','port'].forEach(k=>ash.bld[k]=0);t.FOODS.forEach(g=>ash.stock[g]=0);ash.pop=600;const pop0=ash.pop;for(let i=0;i<3;i++){t.FOODS.forEach(g=>ash.stock[g]=0);t.econDay()}ok(ash.pop<pop0,'with no food, people die or leave ('+pop0+' → '+ash.pop+')');
 Object.assign(ash.bld,kb);Object.assign(ash.stock,keep);t.FOODS.forEach(g=>ash.stock[g]=0);ash.pop=200;ash.stock.grain=300;ash.stock.cheese=100;ash.stock.fruit=100;ash.stock.cloth=60;ash.stock.ale=60;ash.stock.timber=60;ash.stock.tools=40;ash.stock.spice=40;ash.stock.iron=40;ash.pros=60;ash.tax=1;
 const pop1=ash.pop,pr1=ash.pros;for(let i=0;i<10;i++){t.econDay();ash.stock.grain=Math.max(ash.stock.grain,200);ash.stock.cheese=Math.max(ash.stock.cheese,80);ash.stock.fruit=Math.max(ash.stock.fruit,80);['cloth','ale','timber','tools','spice','iron'].forEach(g=>ash.stock[g]=Math.max(ash.stock[g],40))}
 ok(ash.pop>pop1&&ash.pros>pr1,'well fed and supplied, it grows ('+pop1+' → '+ash.pop+' people) and prospers ('+Math.round(pr1)+'% → '+Math.round(ash.pros)+'%)');
 // taxes and volunteers
 const tl=t.taxOf(ash,0),tn=t.taxOf(ash,1),th=t.taxOf(ash,2);ok(tl<tn&&tn<th,'tax rates pay '+tl+' / '+tn+' / '+th+' gold a day');
 ash.vol=1;P.troops={};G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(ash);P.renown=999;P.rep[ash.name]=90;const k=t.RACES.human.melee;t.act('hire',k);t.act('hire',k);ok(P.troops[k]===1&&ash.vol<1,'hiring takes a volunteer; with none left, no one joins');t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // realm treasuries by mode
 const f=karn.owner;W.treas[f]=10;ok(!t.payRealm(f,50,karn,0),'full: a realm cannot spend gold it does not have');
 t.setEconMode('light');ok(t.payRealm(f,50,karn,0)&&W.treas[f]<10,'light: half price, and it may run into debt');t.setEconMode('off');const tr=W.treas[f];ok(t.payRealm(f,500,karn,50)&&W.treas[f]===tr,'off: armies cost nothing');t.setEconMode('full');
 W.lords.forEach(l=>{if(l.fac===f){l.dead=false;l.troops=Array(20).fill('dw_axe')}});W.treas[f]=-500;const n0=W.lords.filter(l=>l.fac===f&&!l.dead).reduce((a,l)=>a+l.troops.length,0);t.realmDay();const n1=W.lords.filter(l=>l.fac===f&&!l.dead).reduce((a,l)=>a+l.troops.length,0);
 ok(n1<n0,'full: a broke realm loses soldiers to desertion ('+n0+' → '+n1+')');ok(t.econWeary(f),'and its people want peace');
 t.setEconMode('light');W.lords.forEach(l=>{if(l.fac===f)l.troops=Array(20).fill('dw_axe')});W.treas[f]=-500;t.realmDay();ok(W.lords.filter(l=>l.fac===f&&!l.dead).every(l=>l.troops.length===20),'light: debt never costs a realm soldiers');t.setEconMode('full');W.treas[f]=500;
 // caravans carry surplus to where it is short
 W.caravans=[];const sm=t.townBy('Saltmere');sm.owner=t.HOME.Saltmere;sm.stock.cloth=500;const near=TW.filter(x=>x!==sm&&!t.atWar(x.owner,sm.owner)&&Math.hypot(x.tx-sm.tx,x.ty-sm.ty)<90&&Math.hypot(x.tx-sm.tx,x.ty-sm.ty)>10);near.forEach(x=>x.stock.cloth=0);
 const cv=t.sendCaravan(sm);ok(cv&&cv.goods.cloth>0&&near.includes(t.townBy(cv.to))&&sm.stock.cloth<500,'a glut of cloth in Saltmere goes by caravan to '+(cv&&cv.to)+', which has none');
 // your own caravans
 W.caravans=[];ash.owner='player';ash.stock.cloth=100;ash.stock.wool=60;const dest=TW.filter(x=>x!==ash&&!t.hostileTo(x.owner)&&x.owner!=='player').sort((a,b)=>Math.hypot(a.x-ash.x,a.y-ash.y)-Math.hypot(b.x-ash.x,b.y-ash.y))[0];
 P.gold=1000;const err=t.hireCaravan('Ashford',dest.name,{cloth:40},4,true);const mc=W.caravans.find(c=>c.mine);
 ok(!err&&mc&&ash.stock.cloth===60&&P.gold===1000-t.PCV.hire-4*t.PCV.guard,'you hire a caravan at your fief: it loads 40 cloth for '+dest.name);
 ash.stock.spice=0;ok(t.hireCaravan('Ashford',dest.name,{spice:10},3,false)!==''&&W.caravans.filter(c=>c.mine).length===1,'you cannot send goods the fief does not have');
 const g0=P.gold,dc=dest.stock.cloth||0;P.x=-9999;P.y=-9999;for(let i=0;i<8000&&P.gold<=g0;i++){t.updateCaravans(.05);if(mc.idle)break}
 ok(P.gold>g0&&(dest.stock.cloth||0)>=dc+40,'it sells the cloth at '+dest.name+' (its market gains 40) and brings home '+(P.gold-g0)+' gold');
 ok(W.caravans.includes(mc)&&(mc.leg==='out'&&mc.goods.cloth===40||mc.idle),'a standing route loads up and goes again');
 const g1=P.gold;t.caravanUpkeep();ok(P.gold===g1-t.PCV.upkeep-mc.guards*t.PCV.guardUp,'caravans cost their upkeep each day');
 W.caravans=[];const other=TW.find(x=>x!==ash&&x.kind==='village');other.owner='player';const oc=other.stock.wool||0;t.hireCaravan('Ashford',other.name,{wool:30},3,false);
 const m2=W.caravans[0];for(let i=0;i<8000&&W.caravans.includes(m2)&&m2.leg==='out';i++)t.updateCaravans(.05);ok((other.stock.wool||0)>=oc+30,'to your own fief it delivers into the stores');W.caravans=[];
 // the fief panel
 G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(ash);t.act('tab','fief');const pan=()=>document.getElementById('panel').innerHTML;
 ok(/People and stores/.test(pan())&&/Send a caravan/.test(pan())&&/Taxes/.test(pan()),'the Fief tab shows people, taxes, stores and caravans');
 t.act('fief-tax','2');ok(ash.tax===2,'you can set the tax rate');
 P.inv=P.inv.map(()=>null);t.invAdd('good','stone',20);t.act('fief-store','stone:10');ok(ash.stock.stone>=10&&t.goodN('stone')===10,'you can store goods from your bag in the fief');
 t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // sieges by food; raids on the stores
 const hm=t.townBy('Highmoor');t.FOODS.forEach(g=>hm.stock[g]=0);P.siege={town:hm.name,days:3};P.hostile[hm.owner]=G.day+99;hm.gar=8;t.siegeDay();ok(hm.gar===7,'a garrison with empty stores starves');
 t.FOODS.forEach(g=>hm.stock[g]=0);hm.stock.grain=500;hm.gar=8;t.siegeDay();ok(hm.gar===8&&t.foodDays(hm)>5,'with full stores it holds ('+t.foodDays(hm)+' days of food)');P.siege=null;
 const v=TW.find(x=>x.kind==='village'&&x.owner!=='player');v.stock.grain=100;const vp=v.pop;P.inv=P.inv.map(()=>null);t.finishRaid(v,1);ok(v.stock.grain<100&&v.pop<vp,'a raid empties the granary and kills or scatters people');
 // the setting
 t.setEconMode('light');let saved='';try{saved=localStorage.getItem(t.ECON_KEY)}catch(e){}ok(t.ECON.mode==='light'&&saved==='light','the Realm economy setting is kept');t.setEconMode('full');
 // saves
 G.mode='world';G.modal=false;t.hidePanel();ash.stock.stone=77;ash.pop=321;W.treas[f]=1234;t.saveGame(true);ash.stock.stone=0;ash.pop=1;t.act('load');
 ok(t.townBy('Ashford').stock.stone===77&&t.townBy('Ashford').pop===321&&W.treas[f]===1234,'stores, people and treasuries survive a reload');
 // 60 days of the whole world
 t.act('begin','soldier');t.bandits.length=0;G.quietEvents=true;P.x=-9999;P.y=-9999;
 for(let d=0;d<60;d++){G.mode='world';G.modal=false;t.dayTick();while(G.mode==='perk')t.act('perk',G.perkOffer[0]);for(let i=0;i<20;i++)t.updateCaravans(.5)}
 const hungry=TW.filter(x=>t.foodDays(x)<1).length,avg=Math.round(TW.reduce((a,x)=>a+x.pros,0)/TW.length),pops=TW.reduce((a,x)=>a+x.pop,0),tre=t.FIDS.map(f=>t.FACS[f].n.split(' ')[0]+' '+Math.round(W.treas[f]||0));
 o.push('BAL after 60 days: '+hungry+' hungry holdings, prosperity '+avg+'%, '+pops+' people, treasuries '+tre.join(', ')+', '+W.caravans.length+' caravans on the road');
 ok(hungry<=TW.length/3&&avg>=25,'after 60 days the world still feeds itself ('+hungry+' of '+TW.length+' hungry, prosperity '+avg+'%)');
 ok(t.FIDS.filter(f=>!W.dead[f]).some(f=>W.treas[f]>0),'and at least one realm is solvent');
 t.updateHUD(true);t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
