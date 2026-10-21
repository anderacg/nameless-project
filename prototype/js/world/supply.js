'use strict';
/* ---------- supplies (doc/SUPPLY_DESIGN.md): travel is not free. Your band's stamina (P.bsta, 0-100: your hero's stamina is the
   band's, kept in her sp: parties.js PlayerParty) runs down on the march and comes back when you stop, make camp or stay in a holding; it
   eats and drinks every hour, more on the march; drink (water, ale, liquor) keeps the drain at its rate or slows it; the frost
   wants furs and the desert water. Below SUPPLY.tired the band is Tired, below SUPPLY.exhausted Exhausted (its pace: bandPace).
   It goes into a battle at its stamina and comes out at its side's (battle/fatigue.js). The band's own numbers are PlayerParty's
   (staminaState, foodHour, drinkHour, furNeed, fitness); here: the tunables, the hour, the camp and what the card and the ring
   read. Nothing here draws Math.random. ---------- */
/* SUPPLY, every number in one place.
   Stamina an hour on the march: march, × rough (hills, forest, mountains, swamp, snow, sand), × night, × forced (Forced March),
   × dry with nothing to drink (desertDry: the desert with no water), × 1 + cold × the share of furs you lack in the frost, ×
   mounted (mostly riders), × 1 − skill a level of Athletics (on foot) or Riding (mounted, at most skillCap off), × guide (a Guide in
   the band), × the drink's drain (drink: water 1, ale .9, liquor .8). Stopped it comes back: rest (stop, in camp, staying in a
   holding), × dryRest with nothing to drink; none with no food, nor in the desert with no water.
   tired, exhausted: the states' thresholds; pace: the band's pace in them; tiredMorale: −n morale every so many hours Tired or
   worse; worn: an exhausted band has a man fall sick (wounded) every so many hours.
   eat: food an hour is eatPerDay ÷ 24 × rest or march; frostEat: the frost eats this much more (× your Survival's share).
   hunger: with no food, −morale an hour; after grace hours a man deserts or falls sick (by turns) every so many hours.
   drink: rations an hour (people + 1) ÷ per on the march, × rest stopped; order: what is drunk first (cheapest; liquor first when
   you choose: BAND.liquor); each drink's drain and morale (a day, while you drink it).
   thirst: the desert with no water: after grace hours a man falls sick every so many hours.
   fill: waterskins fill to days of drink on the march, free, beside water (within near tiles) or a holding's well (within well
   px); furPer: 1 fur for every so many people in the frost; frost: frostbite after every so many hours' worth of shortage (a
   man wounded), and −morale a night short of furs (survive, world.js).
   battleMin: your side starts a battle at the band's stamina, never under this. camp: the wounded heal × heal; caught: −morale
   when a hostile band finds you in camp. hint: the first-run hint once stamina falls under this. hurt: causes kept for the card */
const SUPPLY={march:2,rough:1.5,night:1.3,forced:1.5,dry:1.5,desertDry:2,cold:.5,mounted:.7,skill:.03,skillCap:.5,guide:.9,
  rest:{stop:2,camp:8,stay:10},dryRest:.5,
  tired:20,exhausted:5,pace:{tired:.85,exhausted:.6},tiredMorale:{every:3,n:1},worn:{every:8},
  eat:{rest:1,march:1.5},frostEat:.5,hunger:{morale:2,grace:24,every:12},
  drink:{per:6,rest:.5,order:['water','ale','liquor'],water:{drain:1,morale:0},ale:{drain:.9,morale:1},liquor:{drain:.8,morale:2}},
  thirst:{grace:12,every:6},
  fill:{days:2,near:3,well:40},furPer:5,frost:{every:6,morale:1},
  battleMin:25,camp:{heal:1.5,caught:8},hint:60,hurt:3};

/* the band's own record, kept beside P (not on it: P is your hero's record too, which every battle's snapshot holds whole): its
   camp ({at: the hour it was made} or null) and the hour's counters: food and drink due (fractions of a ration), hours hungry,
   thirsty, exhausted and Tired, the cold's shortage piling up toward frostbite; liquor first (your choice), the hint seen, and
   what hurt it lately ({why, day}). A fresh one for each new game or load (onWorld); saved in the world part once it is not
   fresh (core/saves.js) */
const freshBand=()=>({camp:null,eat:0,drink:0,hungry:0,dry:0,worn:0,tired:0,cold:0,liquor:false,hint:false,hurt:[]}),BAND_FRESH=JSON.stringify(freshBand());
let BAND=freshBand();
onWorld(()=>{BAND=freshBand()});
Saves.add({key:'band',order:280,defaults:freshBand(),save:()=>JSON.stringify(BAND)===BAND_FRESH?undefined:BAND,load:v=>{BAND=v}});

/* ---------- where you stand, as your supplies see it ---------- */
// the climate; rough ground; a harsh desert or frost (not your race's home, no holding near to shelter you); water beside you (a
// river, a lake or an oasis) or a holding's well
function supplyLand(){
  const x=P.x,y=P.y,c=climAt(x,y),t=terrAt(x,y),home=RACES[P.race].home,shelter=!!P.stay||TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<WORLD_SCALE.land.shelter);
  return{clim:c,rough:t===T_FOREST||t===T_HILL||t===T_MOUNT||c==='swamp'||c==='frost'||c==='desert',
    desert:c==='desert'&&!home.includes('desert')&&!shelter,frost:c==='frost'&&!home.includes('frost')&&!shelter,
    well:!!P.stay||TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<SUPPLY.fill.well),water:nearWater(x,y,SUPPLY.fill.near)}}
// the frost a few tiles off (the card shows your furs as you come near it)
const nearFrost=()=>[[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([i,j])=>climAt(P.x+i*4*TILE,P.y+j*4*TILE)==='frost');
// the share of the furs you need that you lack (0: enough)
function coldShare(){const need=P.furNeed(),have=goodN('furs');return need>have?(need-have)/need:0}
// what you still pay of the land's price: Survival softens it
const survivalShare=()=>1-.06*skill('surv');

/* ---------- drink ---------- */
// what your band drinks where it stands, in its order (the desert: water only; liquor first when you choose it); how much of it
// you carry; and what it drinks next (null: nothing)
function drinkOrder(L){const o=SUPPLY.drink.order;return L&&L.desert?['water']:BAND.liquor?['liquor',...o.filter(k=>k!=='liquor')]:o}
const drinkStock=L=>drinkOrder(L).reduce((a,k)=>a+goodN(k),0);
const drinkNext=L=>drinkOrder(L).find(k=>goodN(k)>0)||null;
// n rations drunk, in order: the drink it was on (the first that gave any), or null with none to drink
function drinkTake(n,L){let left=n,first=null;for(const k of drinkOrder(L)){if(!left)break;const m=goodTake(k,left);if(m&&!first)first=k;left-=m}return first}
// waterskins filled to SUPPLY.fill.days of drink on the march, as the bag's room allows, free: how many (quiet: no line)
function fillSkins(quiet){
  const want=Math.ceil(P.drinkHour(true)*24*SUPPLY.fill.days)-goodN('water'),n=Math.min(Math.max(0,want),goodRoom('water')),got=n?playerInventory.add('good','water',n):0;
  if(!quiet)log(got?'You fill your waterskins: '+got+' water.':want>0?'There is no room in your bag for more water.':'Your waterskins are full.',got?'good':'');
  return got}
const canFill=L=>(L=L||supplyLand()).water||L.well;
// the skins fill as soon as you stand at a holding's well, or stopped beside water (the owner: on the hour was too slow, a new
// game began thirsty): looked at every half a second (real time) while they are not full
const SUPPLY_FILL={t:0,every:.5};
function supplyFrame(d,dt){
  if((SUPPLY_FILL.t-=dt||0)>0)return false;
  SUPPLY_FILL.t=SUPPLY_FILL.every;
  if(goodN('water')>=Math.ceil(P.drinkHour(true)*24*SUPPLY.fill.days))return false;
  const L=supplyLand(),moving=!P.stay&&(P.tx!=null||!!G.chase);
  if(L.well||L.water&&!moving)fillSkins(true);
  return false;
}

/* ---------- the band's stamina an hour ---------- */
/* its change an hour (n: + it comes back, − it drains) and why, in words: moving, on the march; dr, the drink it is on (water, ale,
   liquor or null); L, where it stands (supplyLand) */
function staminaRate(moving,dr,L){
  const S=SUPPLY,why=[],x=m=>'×'+Math.round(m*100)/100;
  if(moving){let n=S.march;why.push('marching −'+S.march);const mul=(m,w)=>{if(m!==1){n*=m;why.push(w+' '+x(m))}};
    if(L.rough)mul(S.rough,'rough ground');
    if(Clock.isNight)mul(S.night,'night');
    if(P.hasPerk('forced'))mul(S.forced,'Forced March');
    if(!dr)mul(L.desert?S.desertDry:S.dry,L.desert?'no water in the desert':'nothing to drink');else mul(S.drink[dr].drain,GOODS[dr].n.toLowerCase());
    if(L.frost)mul(1+S.cold*coldShare(),'short of furs');
    const ride=mountedShare(bandSpeeds())>=.5,sk=skill(ride?'ride':'athl');
    if(ride)mul(S.mounted,'mostly mounted');
    if(sk)mul(1-Math.min(S.skillCap,S.skill*sk),ride?'Riding':'Athletics');
    {const g=roleOf('guide');if(g&&compInBand(g))mul(S.guide,'a Guide')}
    return{n:-n,why}}
  if(!foodN())return{n:0,why:['no food: no rest']};
  if(L.desert&&!dr)return{n:0,why:['no water in the desert: no rest']};
  let n=P.stay?S.rest.stay:P.camp?S.rest.camp:S.rest.stop;why.push((P.stay?'staying in a holding':P.camp?'in camp':'stopped')+' +'+n);
  if(!dr){n*=S.dryRest;why.push('nothing to drink '+x(S.dryRest))}
  return{n,why}}
// (how far you had walked when the hour began: WALKED, worldobject.js; never saved) and whether you walked in the hour since
const SUPPLY_WALK={at:0};
function supplyMoved(){const w=WALKED.get(P)||0,m=w-SUPPLY_WALK.at>=1;SUPPLY_WALK.at=w;return m}
// a man falls sick (why: what did it; desert: he deserts instead): the kind you have most of, out of the line and riding with you
// while he heals (P.wounded), or your hero's health with none; kept for the card
function supplyHurt(why,desert){
  const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0).sort((a,b)=>P.troops[b]-P.troops[a]),k=ks[0],u=BAND;
  if(k){P.remove(k);if(!desert)P.wounded[k]=(P.wounded[k]||0)+1;log(desert?cap1(an(ST[k].n.toLowerCase()))+' deserts, hungry.':cap1(why)+': '+an(ST[k].n.toLowerCase())+' falls sick.','bad')}
  else if(!desert){const m=vitals();P.hp=Math.max(1,P.hp-m[0]*.1);log(cap1(why)+' wears you down.','bad')}
  u.hurt=[{why,day:G.day},...u.hurt.filter(h=>h.why!==why)].slice(0,SUPPLY.hurt)}
/* the band's hour (Systems.hour): waterskins fill beside water (stopped) or at a holding's well; it eats and drinks (more on the
   march); its stamina drains or comes back; and what it lacks takes its toll: tiredness and hunger in morale, exhaustion, hunger,
   thirst and the cold in men */
function supplyHour(){
  const S=SUPPLY,u=BAND,L=supplyLand(),moving=!P.stay&&supplyMoved();
  if(L.well||L.water&&!moving)fillSkins(true);
  // food, eaten as it comes due (the frost eats more): hungry when it could not eat what was due, or has none left
  u.eat+=P.foodHour(moving)*(L.frost?1+S.frostEat*survivalShare():1);const due=Math.floor(u.eat);u.eat-=due;
  const hungry=(due?foodTake(due)<due:false)||!foodN();
  // drink: rations as they come due, else on what it carries
  u.drink+=P.drinkHour(moving);const owe=Math.floor(u.drink);u.drink-=owe;const dr=owe?drinkTake(owe,L):drinkNext(L);
  if(dr)P.morale+=S.drink[dr].morale/24;
  P.bsta=clamp(P.bsta+staminaRate(moving,dr,L).n,0,100);
  const st=P.staminaState();
  if(st!=='fresh'){if(++u.tired%S.tiredMorale.every===0)P.morale-=S.tiredMorale.n}else u.tired=0;
  if(st==='exhausted'){if(++u.worn%S.worn.every===0)supplyHurt('exhaustion')}else u.worn=0;
  if(hungry){if(!u.hungry++){log('Your band goes hungry. Buy food in a town, or hunt.','bad');mood('hungry')}P.morale-=S.hunger.morale;
    const h=u.hungry-S.hunger.grace;if(h>=0&&h%S.hunger.every===0)supplyHurt('hunger',h/S.hunger.every%2===0)}else u.hungry=0;
  if(L.desert&&!dr){if(!u.dry++)log('No water in the desert: your band thirsts. Find an oasis, a river or a holding.','bad');
    const h=u.dry-S.thirst.grace;if(h>=0&&h%S.thirst.every===0)supplyHurt('thirst')}else u.dry=0;
  // (frostbite: the hours short of furs, weighted by how short, until a man is bitten)
  const cold=L.frost?coldShare():0;if(cold){u.cold+=cold;if(u.cold>=S.frost.every){u.cold-=S.frost.every;supplyHurt('frostbite')}}else u.cold=0;
  P.morale=clamp(P.morale,0,100);
  if(!u.hint&&P.bsta<S.hint){u.hint=true;log('Marching tires your band. Stop, or Make camp (Z), to rest.','gold')}
}
Systems.add({name:'supply',order:{hour:10,frame:55},hour:supplyHour,frame:supplyFrame});

/* ---------- the camp (§7): Z, the dock's Camp, or the action ring. Your band stops and pitches its tents; stamina comes back
   faster (SUPPLY.rest.camp), the wounded mend faster (SUPPLY.camp.heal: world.js woundedDay); fast forward stops when anything
   hostile comes into sight; any travel order breaks it; a hostile band that finds you in it catches you unready ---------- */
// why you cannot make camp here ('' if you can)
const campWhy=()=>G.mode!=='world'||G.modal?'Not now':P.stay?'You are staying in a holding':P.siege?'You are besieging a holding':P.raid?'You are raiding':'';
function makeCamp(){if(P.camp||campWhy())return false;P.camp={at:Clock.hours()};P.tx=P.ty=null;G.chase=null;
  log('Your band makes camp. Stamina comes back faster, and the wounded mend.','good');updateHUD(true);return true}
function breakCamp(why){if(!P.camp)return false;P.camp=null;log(why||'Your band breaks camp.');updateHUD(true);return true}
function toggleCamp(){return P.camp?breakCamp():makeCamp()}
// each moment in camp (world.js marchStep): a travel order breaks it (true: the march goes on), but not a press on the map that may
// yet open the action ring (ui/ring.js RING.press); going faster than 1x, anything hostile in sight brings it back to 1x
function campStep(){
  if((P.tx!=null||G.chase||P.stay)&&!RING.press){breakCamp();return true}
  if(G.speed>1){const d=dangerInSight();if(d){log('Your camp stirs: '+d+'.','bad');setSpeed(1)}}
  return false}
// a battle that finds you in camp (battle/setup.js, before morale): caught unready, morale lower; the camp is struck either way
function campCaught(opts){if(!P.camp||opts.tournament||opts.sandbox)return;P.camp=null;P.morale=Math.max(0,P.morale-SUPPLY.camp.caught);log('They catch your band in camp, unready.','bad')}
// your camp at your figure: two tents and the fire, behind you (render.js drawWorld pushes it while you camp)
function bandCampEnt(cam){return{y:P.y-2,f:()=>{subT(P);const s=campSprite(5,'travelers'),X=Math.round(P.x-s.ax-cam.x),Y=Math.round(P.y-4-s.ay-cam.y);
  ctx.globalAlpha=SHADOW.a;ctx.drawImage(s.sh,X,Y);ctx.globalAlpha=1;ctx.drawImage(s,X,Y);drawFire(X+s.fire[0],Y+s.fire[1],0)}}}

/* ---------- what the card shows (render.js updateHUD) ---------- */
// moving now or not; where you stand; the drink you are on; the stamina's rate an hour and why; its state; food and drink in
// days at the current rate; furs (have, need, shown in or near the frost or when carried); the band's health; the tags that apply
function supplyNow(){
  const S=SUPPLY,L=supplyLand(),go=!P.stay&&(P.tx!=null||!!G.chase),dr=drinkNext(L)||(canFill(L)?'water':null),r=staminaRate(go,dr,L),st=P.staminaState(),tags=[];// (where the skins fill, never thirsty)
  const foodDays=foodN()/Math.max(.01,P.foodHour(go)*(L.frost?1+S.frostEat*survivalShare():1)*24),drinkDays=drinkStock(L)/Math.max(.01,P.drinkHour(go)*24);
  const furs={have:goodN('furs'),need:P.furNeed(),show:L.frost||goodN('furs')>0||nearFrost()};
  if(st==='tired')tags.push(['Tired','warn','Stamina under '+S.tired+': your pace is '+Math.round((1-S.pace.tired)*100)+'% slower and morale slips. Stop or make camp to rest.']);
  if(st==='exhausted')tags.push(['Exhausted','bad','Stamina under '+S.exhausted+': your pace is '+Math.round((1-S.pace.exhausted)*100)+'% slower, you cannot outrun anyone, and men fall sick.']);
  if(!dr)tags.push(['Thirsty','bad',L.desert?'No water in the desert: stamina drains twice as fast and does not come back.':'Nothing to drink: stamina drains faster and comes back slower.']);
  if(!foodN())tags.push(['Hungry','bad','No food: no rest, and morale falls every hour.']);
  if(L.frost&&coldShare())tags.push(['Cold','bad','Short of furs in the frost ('+furs.have+' of '+furs.need+'): stamina drains faster, and frostbite takes men.']);
  if(P.camp)tags.push(['In camp','good','Resting: stamina +'+S.rest.camp+' an hour, the wounded mend faster. Any travel order breaks camp.']);
  return{L,go,dr,r,st,foodDays,drinkDays,furs,fit:P.fitness(),tags}}

/* ---------- the action ring's map actions (ui/ring.js ActionRing; §7a): those that apply where you held (wx, wy: on o, a thing on
   the map, or the ground), in the ring's order ---------- */
function mapRingItems(wx,wy,o,cx,cy){
  const L=supplyLand(),ground=!o,fast=ground&&!dangerInSight(),look=o&&tipFor(o)||rumourTip(wx,wy);
  return[
    !P.camp&&!campWhy()&&{icon:'fire',label:'Make camp',run:makeCamp},
    P.camp&&{icon:'exit',label:'Break camp',run:()=>breakCamp()},
    ground&&{icon:'banner',label:'Travel here',run:()=>worldGo(wx,wy)},
    fast&&{icon:'speed',label:'Travel here fast',run:()=>{worldGo(wx,wy);setSpeed(TRAVEL_FAST)}},
    canFill(L)&&{icon:'mug',label:'Fill waterskins',run:()=>fillSkins()},
    goodN('liquor')>0&&{icon:'barrel',label:BAND.liquor?'Water first':'Drink liquor',run:()=>{BAND.liquor=!BAND.liquor;log(BAND.liquor?'Your band drinks its liquor first: a hard march.':'Your band drinks water first again.');updateHUD(true)}},
    look&&{icon:'eye',label:'Look',run:()=>holdCard(look,cx,cy)}].filter(Boolean)}

/* ---------- the tavern's tapster (ui/town.js Tavern): liquor for the road, at its base price, and the well's water, free ---------- */
const LIQUOR_LOT=5;
function tapsterCard(t,race){
  const p=GOODS.liquor.base*LIQUOR_LOT,why=P.gold<p?'Not enough gold':goodRoom('liquor')<LIQUOR_LOT?'No room in your bag':'';
  return{pic:personPic('innkeeper',race,2),name:'The tapster',role:'Drink for the road',facts:['Water '+goodN('water'),'Liquor '+goodN('liquor'),goodN('ale')?'Ale '+goodN('ale'):''],
    note:'Water keeps your band’s stamina draining at its rate; ale and liquor slow the drain and lift spirits.',
    acts:[['sup-fill',t.name,'Fill waterskins'],['sup-liquor',t.name,'Buy '+LIQUOR_LOT+' liquor · '+p+'g',why]]}}
function supplyAct(a,arg){
  if(a==='sup-fill')fillSkins();
  else if(a==='sup-liquor'){const p=GOODS.liquor.base*LIQUOR_LOT;if(P.gold<p||goodRoom('liquor')<LIQUOR_LOT)return;P.gold-=p;playerInventory.add('good','liquor',LIQUOR_LOT);log('You buy '+LIQUOR_LOT+' liquor for '+p+' gold.','gold')}
  else if(a==='sup-camp')toggleCamp();
  updateHUD(true);if(G.mode==='town'&&G.town)renderTown()}
onAct('sup-',supplyAct);
