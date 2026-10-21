'use strict';
// Supplies (doc/SUPPLY_DESIGN.md, world/supply.js): your hero's stamina is your band's. It drains on the march (faster on rough
// ground, at night, with nothing to drink, in the desert with no water, short of furs in the frost; slower mostly mounted, with
// Athletics, ale or liquor) and comes back stopped, faster in camp or staying in a holding (not with no food, nor in the desert with
// no water); Tired under 20 and Exhausted under 5 slow you, and cost morale and men. Food and drink by the hour, more on the march;
// waterskins fill free by water or at a holding's well; the desert's thirst and the frost's frostbite take men; liquor at the
// tavern; the band goes into a battle at its stamina (never under 25) and comes out at its side's; the card; saves.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,S=t.SUPPLY,ev=s=>(0,eval)(s);
 Kit.begin('soldier',4242);Kit.clear();Kit.world();
 const tile=f=>{for(let ty=8;ty<t.MH-8;ty++)for(let tx=8;tx<t.MW-8;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(f(tx,ty,x,y))return [x,y]}return null};
 const far=(x,y)=>!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<120)&&!t.nearWater(x,y,4);
 const spot={open:tile((tx,ty,x,y)=>t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='grass'&&far(x,y)),
  hill:tile((tx,ty,x,y)=>t.tAt(tx,ty)===t.T_HILL&&t.climAt(x,y)==='grass'&&far(x,y)),
  desert:tile((tx,ty,x,y)=>t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='desert'&&far(x,y)),
  frost:tile((tx,ty,x,y)=>t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='frost'&&far(x,y)),
  river:tile((tx,ty,x,y)=>t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='grass'&&t.nearWater(x,y,1)&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<120))};
 ok(Object.values(spot).every(Boolean),'spots found: open ground, hills, desert, frost and a riverbank');
 const at=k=>Kit.goTo(spot[k][0],spot[k][1]);
 const bag=g=>{for(const k of ['water','ale','liquor','furs',...t.FOODS])t.goodTake(k,1e9);for(const k in g||{})t.playerInventory.add('good',k,g[k])};
 const reset=()=>{P.troops={hum_levy:5};P.comps={};P.wounded={};P.woundedGroups=[];P.perks=[];P.gear.mount=null;P.sk.athl.lv=0;P.sk.ride.lv=0;P.sk.surv.lv=0;P.race='human';
  P.morale=60;P.bsta=100;P.stay=null;ev('BAND=freshBand()');G.clock=t.DAY*.3;G.speed=1;P.tx=null;G.chase=null;Kit.world()};
 const rate=moving=>{const L=t.supplyLand();return t.staminaRate(moving,t.drinkNext(L),L).n};
 const near=(a,b)=>Math.abs(a-b)<1e-9;
 // (an hour: on the march when walked, else stopped)
 const hour=walked=>{if(walked)t.WALKED.set(P,(t.WALKED.get(P)||0)+100);t.supplyHour()};
 const hours=(n,walked)=>{for(let i=0;i<n;i++)hour(walked)};

 // ---- your hero's stamina is the band's
 reset();{const m=t.maxSP();P.bsta=50;const a=P.sp;P.sp=m;ok(near(a,m/2)&&P.bsta===100,'your hero’s stamina is your band’s: half the band’s is half hers ('+a+' of '+m+'), hers full is the band’s 100')}

 // ---- the drain an hour on the march, and what changes it
 reset();at('open');bag({water:200,grain:60});
 ok(near(rate(true),-S.march),'on the march, open ground by day, with water: −'+S.march+' an hour');
 at('hill');ok(near(rate(true),-S.march*S.rough),'rough ground (hills): ×'+S.rough+' ('+rate(true)+')');at('open');
 G.clock=t.DAY*.8;ok(near(rate(true),-S.march*S.night),'at night: ×'+S.night);G.clock=t.DAY*.3;
 P.perks=['forced'];ok(near(rate(true),-S.march*S.forced),'Forced March: ×'+S.forced);P.perks=[];
 bag({grain:60});ok(near(rate(true),-S.march*S.dry),'nothing to drink: ×'+S.dry);
 bag({grain:60,ale:20});ok(near(rate(true),-S.march*S.drink.ale.drain),'on ale: ×'+S.drink.ale.drain);
 bag({grain:60,liquor:20,water:20});ok(near(rate(true),-S.march),'water first, liquor kept (cheapest first)');
 t.BAND.liquor=true;ok(near(rate(true),-S.march*S.drink.liquor.drain),'liquor first, as you choose: ×'+S.drink.liquor.drain);t.BAND.liquor=false;
 bag({water:200,grain:60});P.sk.athl.lv=5;ok(near(rate(true),-S.march*(1-S.skill*5)),'Athletics 5 on foot: −'+Math.round(S.skill*500)+'%');P.sk.athl.lv=0;
 P.troops={hum_knight:6};P.gear.mount='m_horse';ok(near(rate(true),-S.march*S.mounted),'a band mostly mounted: ×'+S.mounted);P.troops={hum_levy:5};P.gear.mount=null;
 at('frost');{const r0=rate(true);bag({water:200,grain:60,furs:t.P.furNeed()});const r1=rate(true);
  ok(near(r0,-S.march*S.rough*(1+S.cold))&&near(r1,-S.march*S.rough),'the frost: snow is rough ground, and short of furs it drains ×'+(1+S.cold)+' more ('+r0+' without furs, '+r1+' with)')}
 at('desert');bag({grain:60,ale:30});ok(near(rate(true),-S.march*S.rough*S.desertDry),'the desert with no water (ale does not count there): ×'+S.desertDry+' ('+rate(true)+')');
 bag({grain:60,water:50});ok(near(rate(true),-S.march*S.rough),'with water, the desert is only sand underfoot');
 // ---- recovery
 at('open');bag({water:200,grain:60});
 ok(rate(false)===S.rest.stop,'stopped: +'+S.rest.stop+' an hour');
 P.camp={at:0};ok(rate(false)===S.rest.camp,'in camp: +'+S.rest.camp);P.camp=null;
 bag({grain:60});ok(rate(false)===S.rest.stop*S.dryRest,'with nothing to drink, half as fast');
 bag({water:200});ok(rate(false)===0,'with no food, none');
 at('desert');bag({grain:60});ok(rate(false)===0,'in the desert with no water, none');
 // ---- Tired and Exhausted
 reset();at('open');bag({water:200,grain:60});{const p0=t.bandPace();P.bsta=19.9;const tired=t.bandPace(),st1=P.staminaState();P.bsta=4.9;const ex=t.bandPace(),st2=P.staminaState();P.bsta=20;
  ok(st1==='tired'&&st2==='exhausted'&&P.staminaState()==='fresh'&&near(tired,p0*S.pace.tired)&&near(ex,p0*S.pace.exhausted),'under '+S.tired+' Tired (pace ×'+S.pace.tired+'), under '+S.exhausted+' Exhausted (×'+S.pace.exhausted+'); 20 itself is fresh')}
 reset();at('open');bag({water:200,grain:60});P.bsta=18;hours(S.tiredMorale.every,true);ok(P.morale===60-S.tiredMorale.n,'Tired, morale slips '+S.tiredMorale.n+' every '+S.tiredMorale.every+' hours ('+P.morale+')');
 reset();at('open');bag({water:400,grain:60});P.bsta=4;hours(S.worn.every,true);ok(t.woundedN()===1&&P.troops.hum_levy===4&&/exhaustion/.test(t.BAND.hurt.map(h=>h.why).join()),'Exhausted for '+S.worn.every+' hours: a man falls sick ('+t.woundedN()+' wounded)');
 // ---- food and drink by the hour
 reset();at('open');bag({water:400,grain:200});{const e=t.eatPerDay(),g0=t.goodN('grain'),w0=t.goodN('water');hours(24,false);const ate=g0-t.goodN('grain'),drank=w0-t.goodN('water'),dr=P.drinkHour(false)*24;
  ok(ate===e,'at rest the band eats a day’s food in a day, by the hour ('+ate+' of '+e+')');ok(Math.abs(drank-dr)<=1,'and drinks (people + 1) ÷ '+S.drink.per+' ÷ 2 an hour ('+drank+', about '+dr+')')}
 reset();at('open');bag({water:400,grain:200});{const e=t.eatPerDay(),g0=t.goodN('grain');hours(24,true);const ate=g0-t.goodN('grain');
  ok(Math.abs(ate-e*S.eat.march)<=1,'on the march, ×'+S.eat.march+' ('+ate+', about '+e*S.eat.march+')')}
 reset();at('open');bag({water:200});{const m0=P.morale;hour(false);ok(P.morale===m0-S.hunger.morale&&t.BAND.hungry===1&&/goes hungry/.test(G.msgs.map(x=>x.m).join()),'no food: hungry, morale −'+S.hunger.morale+' an hour');
  hours(S.hunger.grace-2,false);const n0=P.troops.hum_levy;hour(false);ok(P.troops.hum_levy===n0-1&&!t.woundedN(),'a day hungry, a man deserts');hours(S.hunger.every,false);ok(t.woundedN()===1,'then by turns one falls sick')}
 // ---- water by water, and at a holding's well
 reset();at('river');bag({grain:60});hour(false);{const want=Math.ceil(P.drinkHour(true)*24*S.fill.days);ok(t.goodN('water')===want-Math.floor(P.drinkHour(false)),'stopped by a river, the waterskins fill free ('+t.goodN('water')+')')}
 reset();at('open');bag({grain:60});hour(false);ok(t.goodN('water')===0,'out on dry ground they do not');
 reset();Kit.goHome();bag({grain:60});hour(true);ok(t.goodN('water')>0,'a holding’s well fills them, marching by or not');
 // ---- the desert's thirst and the frost's frostbite
 reset();at('desert');bag({grain:200});P.bsta=50;hours(S.thirst.grace,false);ok(t.BAND.dry===S.thirst.grace&&near(P.bsta,50)&&t.woundedN()===1&&/thirst/.test(t.BAND.hurt.map(h=>h.why).join()),'the desert with no water: no rest, and after '+S.thirst.grace+' hours a man falls sick from thirst');
 reset();at('frost');bag({grain:200,water:400});hours(S.frost.every,false);ok(t.woundedN()===1&&/frostbite/.test(t.BAND.hurt.map(h=>h.why).join()),'with no furs in the frost, frostbite takes a man every '+S.frost.every+' hours');
 reset();at('frost');bag({grain:200,water:400,furs:P.furNeed()});hours(S.frost.every*2,false);ok(!t.woundedN(),'with furs enough, none');
 // ---- the hint, once
 reset();at('open');bag({water:400,grain:60});P.bsta=S.hint+1;const n0=G.msgs.filter(x=>/Make camp \(Z\)/.test(x.m)).length;hours(3,true);hours(30,true);
 ok(G.msgs.filter(x=>/Make camp \(Z\)/.test(x.m)).length===n0+1,'a first hint, once: "Marching tires your band. Stop, or Make camp (Z), to rest."');
 // ---- the card
 reset();at('open');bag({water:400,grain:60});P.tx=P.x+200;P.ty=P.y;P.bsta=15;t.updateHUD(true);{const el=document.getElementById('stats'),h=el.innerHTML,bar=el.querySelector('.bar.sta');
  ok(bar&&bar.classList.contains('tired')&&/▼/.test(bar.textContent)&&/Tired/.test(bar.textContent)&&bar.title.includes('marching −'+t.SUPPLY.march),'the card: stamina amber with ▼ and "Tired" marching ('+bar.textContent+'; '+bar.title+')');
  ok(el.querySelector('.bar.hp')&&/Health 6\/6/.test(el.querySelector('.bar.hp').textContent),'its health bar: fit of the whole band (hero and 5)');
  ok([...el.querySelectorAll('.pc-tags .tag')].map(x=>x.textContent).join()==='Tired','its tags: Tired');
  ok(el.querySelectorAll('.chip').length>=6&&/d</.test(h)&&!/Mana/.test(h),'food and drink chips in days; your hero’s mana is not on it')}
 P.tx=null;P.bsta=3;bag({grain:60});P.troops={hum_levy:2};P.wounded={hum_levy:4};t.updateHUD(true);{const el=document.getElementById('stats'),tags=[...el.querySelectorAll('.pc-tags .tag')].map(x=>x.textContent).join();
  ok(el.querySelector('.bar.sta.exhausted')&&/Exhausted/.test(tags)&&/Thirsty/.test(tags)&&el.querySelector('.bar.hp.low'),'Exhausted, Thirsty, and health red under half ('+tags+'; '+el.querySelector('.bar.hp').textContent+')')}
 reset();at('frost');bag({water:400,grain:60});t.updateHUD(true);ok(/Cold/.test(document.querySelector('#stats .pc-tags').textContent)&&[...document.querySelectorAll('#stats .chip.warn')].some(c=>/^Furs/.test(c.title)),'in the frost short of furs: Cold, and the furs chip red');
 // ---- the tavern sells liquor
 reset();{const h=Kit.goHome();bag({});P.gold=500;Kit.world();t.enterTown(h);t.act('tab','tavern');const p=t.GOODS.liquor.base*t.LIQUOR_LOT;
  ok(/The tapster/.test(Kit.panel()),'the tavern has a tapster');t.act('sup-liquor',h.name);ok(t.goodN('liquor')===t.LIQUOR_LOT&&P.gold===500-p,'who sells '+t.LIQUOR_LOT+' liquor for '+p+' gold');
  t.act('sup-fill',h.name);ok(t.goodN('water')>0,'and fills your waterskins');Kit.world({town:null})}
 // ---- into battle and back
 const fight=()=>{Kit.world();G.enc={kind:'party',ref:{cool:0,x:P.x+8,y:P.y},list:['militia','militia']};t.startBattle({enemies:['militia','militia'],tournament:false});return t.B};
 const band=B=>B.units.filter(u=>u.team===0&&!u.hero);
 reset();at('open');bag({water:400,grain:60});{let B=fight();ok(band(B).every(u=>u.sta===t.FATIGUE.max)&&t.heroState().sp===t.maxSP(),'a fresh band starts a battle fresh, as ever');B.over=true;B.endT=0;ev('B=null');
  P.bsta=60;B=fight();ok(band(B).every(u=>near(u.sta,60))&&near(t.heroState().sp,t.maxSP()*.6),'at 60, its troops and your hero start at 60%');
  band(B).forEach((u,i)=>u.sta=i?20:40);t.heroState().sp=t.maxSP()*.5;
  B.units.filter(u=>u.team===1).forEach(u=>u.hp=0);B.win=true;B.over=true;B.endT=0;t.updateBattle(.01);Kit.done({cont:true,world:true});
  const want=(band(B).reduce((a,u)=>a+u.sta,0)+B.hx.sp/t.maxSP()*100)/(band(B).length+1);
  ok(Math.abs(P.bsta-want)<1e-6,'after it, the band’s stamina is the average its side ended with ('+P.bsta.toFixed(2)+', want '+want.toFixed(2)+')');
  P.bsta=8;B=fight();ok(band(B).every(u=>near(u.sta,S.battleMin))&&near(t.heroState().sp,t.maxSP()*S.battleMin/100),'never under '+S.battleMin+': a battle is still playable');B.over=true;B.endT=0;ev('B=null');t.fieldDone()}
 // ---- saves
 reset();at('open');P.bsta=42;t.BAND.liquor=true;t.BAND.hint=true;G.mode='world';t.saveGame(true,'quick');P.bsta=100;ev('BAND=freshBand()');t.loadGame('quick');
 ok(Math.abs(P.bsta-42)<1e-9&&t.BAND.liquor===true&&t.BAND.hint===true,'save and load keep the band’s stamina and its record');
 Kit.begin('soldier',4242);ok(P.bsta===100&&!t.BAND.liquor&&!t.BAND.hint,'a new game starts fresh');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
