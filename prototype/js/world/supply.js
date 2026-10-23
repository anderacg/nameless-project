'use strict';
/* ---------- supplies (doc/SUPPLY_DESIGN.md): travel is not free. Your band's stamina (P.bsta, 0-100: your hero's stamina is the
   band's, kept in her sp: parties.js PlayerParty) runs down on the march and comes back when you stop, make camp or stay in a holding; it
   eats and drinks every hour, more on the march; drink (water, ale, liquor) keeps the drain at its rate; the frost
   wants furs and the desert water. Below SUPPLY.tired the band is Tired, below SUPPLY.exhausted Exhausted (its pace: bandPace).
   It goes into a battle at its stamina and comes out at its side's (battle/fatigue.js). The band's own numbers are PlayerParty's
   (staminaState, foodHour, drinkHour, furNeed, fitness); here: the tunables, the hour, the camp and what the card and the ring
   read. Nothing here draws Math.random. ---------- */
/* SUPPLY, every number in one place.
   Stamina an hour on the march: march, × rough (hills, forest, mountains, swamp, snow, sand), × night, × forced (Forced March),
   × dry with nothing to drink (desertDry: the desert with no water), × 1 + cold × the share of furs you lack in the frost, ×
   mounted (mostly riders), × 1 − skill a level of Athletics (on foot) or Riding (mounted, at most skillCap off), × guide (a Guide in
   the band). Stopped it comes back: rest (stop, in camp, staying in a
   holding), × dryRest with nothing to drink; none with no food, nor in the desert with no water.
   tired, exhausted: the states' thresholds; pace: the band's pace in them; tiredMorale: −n morale every so many hours Tired or
   worse; worn: an exhausted band has a man fall sick (wounded) every so many hours.
   eat: food an hour is eatPerDay ÷ 24 × rest or march; frostEat: the frost eats this much more (× your Survival's share).
   hunger (the owner, 2026-10-21: food lesser than water, but it can kill, much later): with no food, −morale every so many hours
   and rest × rest; Starving from starving hours: the march drains × starveDrain and −starveMorale an hour; from desert hours a man
   deserts every toll hours, from sick hours one also falls sick, from die hours a sick man (else a fit one) dies.
   Your hero (the owner, 2026-10-22: hunger and thirst hit her, mana too): Hungry or Parched, her mana stops coming back; Starving,
   she loses hunger.hero.hp of her health and .mp of her mana every .every hours; Dying of thirst, thirst.hero.hp and .mp on every
   thirst toll; Starving or Dying of thirst, her health stops coming back. At 0 health off the battlefield she dies: the game is over.
   forcedMarch: Hurry (key R, the action ring) marches the band × pace, its stamina draining × drain; it ends once
   the band is Exhausted (world.js fastWatch). Not the Forced March perk (forced, above).
   drink: rations an hour (people + 1) ÷ per on the march, × rest stopped; order: what is drunk first (cheapest; liquor first when
   you choose: BAND.liquor); each drink's morale, a ration, once, as it comes into your stores (drinkIn; the owner, 2026-10-22:
   doc/ITEMS_DESIGN.md §2a, in place of the slower drain while you drank ale or liquor).
   thirst (the owner: water before food; it kills, after the sickness): nothing to drink, the hours counted × desert in the desert
   with no water: Thirsty at once (the drain above), Parched from parched hours (pace × pace, −morale an hour), Dying of thirst
   from dying hours (a man falls sick every toll hours), and from death hours a sick man (else a fit one) dies every toll hours.
   lost: the men lost for good (died, deserted) shown for days on the card and in the troops tab.
   fill: waterskins fill to days of drink on the march, free, beside water (within near tiles) or a holding's well (within well
   px); furPer: 1 fur for every so many people in the frost; frost: frostbite after every so many hours' worth of shortage (a
   man wounded), and −morale a night short of furs (survive, world.js).
   fever: swamp fever (world.js survive, a fever night): a man falls sick (sick), and one already sick of it may die (die, less med
   a level of Medicine, never under dieMin).
   battleMin: your side starts a battle at the band's stamina, never under this. camp: the wounded heal × heal; caught: −morale
   when a hostile band finds you in camp; r: Make camp looks this many tiles round you for allowed ground (campSpot), each step
   px apart; hop: within so many tiles your band steps there at once, farther it walks; across: tiles added to a spot's distance
   when water or a peak lies between it and you (never hopped to); m: px round the camp's picture kept off everything not
   allowed (campGround); road: px past that no road or track tile's middle may lie; lot: tiles kept between it and any lot, field
   or bandits' camp; ring: tiles round a holding's centre and houses; site: px round a site's picture; pole: your banner's pole's
   foot, px from the camp's fire (bandCampEnt: planted beside the tents). hint: the first-run hint once stamina falls under this. hurt: causes kept for the card */
const SUPPLY={march:2,rough:1.5,night:1.3,forced:1.5,dry:1.5,desertDry:2,cold:.5,mounted:.7,skill:.03,skillCap:.5,guide:.9,
  rest:{stop:2,camp:8,stay:10},dryRest:.5,
  tired:20,exhausted:5,pace:{tired:.85,exhausted:.6},tiredMorale:{every:3,n:1},worn:{every:8},
  eat:{rest:1,march:1.5},frostEat:.5,hunger:{morale:1,every:2,rest:.5,starving:72,starveDrain:1.25,starveMorale:1,desert:96,sick:168,die:240,toll:12,hero:{every:6,hp:.05,mp:.05}},
  drink:{per:6,rest:.5,order:['water','ale','liquor'],water:{morale:0},ale:{morale:.5},liquor:{morale:1.5}},
  thirst:{desert:2,parched:12,pace:.85,morale:1,dying:24,death:48,toll:6,hero:{hp:.1,mp:.1}},lost:{days:7,keep:20},
  fill:{days:2,near:3,well:40},furPer:5,frost:{every:6,morale:1},forcedMarch:{pace:2,drain:2.5},
  battleMin:25,camp:{heal:1.5,caught:8,r:6,step:8,hop:2,across:4,m:2,road:4,lot:0,ring:1,site:4,pole:[20,1]},hint:60,hurt:3,fever:{sick:.5,die:.2,dieMin:.05,med:.02}};

/* the band's own record, kept beside P (not on it: P is your hero's record too, which every battle's snapshot holds whole): its
   camp ({at: the hour it was made} or null) and the hour's counters: food and drink due (fractions of a ration), hours hungry,
   thirsty, exhausted and Tired, the cold's shortage piling up toward frostbite; liquor first (your choice), the hint seen, and
   what hurt it lately ({why, day}); the sick among the wounded and of what ({kind: {why: n}}, never more than P.wounded), and
   the men lost for good lately ([{k, why, day}]: died of thirst or hunger, deserted). A fresh one for each new game or load (onWorld); saved in the world part once it is not
   fresh (core/saves.js) */
const freshBand=()=>({camp:null,eat:0,drink:0,hungry:0,dry:0,worn:0,tired:0,cold:0,liquor:false,hint:false,hurt:[],sick:{},lost:[]}),BAND_FRESH=JSON.stringify(freshBand());
let BAND=freshBand();
onWorld(()=>{BAND=freshBand()});
// (the sick and the lost written only when there are any, so a save with none is as it was; filled in again on loading)
Saves.add({key:'band',order:280,defaults:freshBand(),save:()=>{if(JSON.stringify(BAND)===BAND_FRESH)return;const {sick,lost,...o}=BAND;return Object.keys(sick).length||lost.length?BAND:o},load:v=>{BAND={...freshBand(),...v}}});

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
// n of a drink come into your stores (the bag: core/items.js Good gained): its morale, once (SUPPLY.drink: ale and liquor lift it)
function drinkIn(id,n){const m=SUPPLY.drink[id]?SUPPLY.drink[id].morale*n:0;if(m)P.morale=clamp(P.morale+m,0,100)}
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
    if(G.hurry)mul(S.forcedMarch.drain,'hurrying');
    if(!dr)mul(L.desert?S.desertDry:S.dry,L.desert?'no water in the desert':'nothing to drink');
    if(L.frost)mul(1+S.cold*coldShare(),'short of furs');
    const ride=mountedShare(bandSpeeds())>=.5,sk=skill(ride?'ride':'athl');
    if(ride)mul(S.mounted,'mostly mounted');
    if(sk)mul(1-Math.min(S.skillCap,S.skill*sk),ride?'Riding':'Athletics');
    {const g=roleOf('guide');if(g&&compInBand(g))mul(S.guide,'a Guide')}
    if(BAND.hungry>=S.hunger.starving)mul(S.hunger.starveDrain,'starving');
    return{n:-n,why}}
  if(L.desert&&!dr)return{n:0,why:['no water in the desert: no rest']};
  let n=P.stay?S.rest.stay:P.camp?S.rest.camp:S.rest.stop;why.push((P.stay?'staying in a holding':P.camp?'in camp':'stopped')+' +'+n);
  if(!dr){n*=S.dryRest;why.push('nothing to drink '+x(S.dryRest))}
  if(!foodN()){n*=S.hunger.rest;why.push('no food '+x(S.hunger.rest))}
  return{n,why}}
// (how far you had walked when the hour began: WALKED, worldobject.js; never saved) and whether you walked in the hour since
const SUPPLY_WALK={at:0};
function supplyMoved(){const w=WALKED.get(P)||0,m=w-SUPPLY_WALK.at>=1;SUPPLY_WALK.at=w;return m}
// a man falls sick (why: what did it; desert: he deserts instead): the kind you have most of, out of the line and riding with you
// while he heals (P.wounded), or your hero's health with none; kept for the card
function supplyHurt(why,desert){
  const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0).sort((a,b)=>P.troops[b]-P.troops[a]),k=ks[0],u=BAND;
  if(k){P.remove(k);if(desert)supplyLost(k,'deserted');else{P.wounded[k]=(P.wounded[k]||0)+1;const s=u.sick[k]||(u.sick[k]={});s[why]=(s[why]||0)+1}
    log(desert?cap1(an(ST[k].n.toLowerCase()))+' deserts, hungry.':cap1(why)+': '+an(ST[k].n.toLowerCase())+' falls sick.','bad')}
  else if(!desert){log(cap1(why)+' wears you down.','bad');heroHurt(.1,0,why)}
  u.hurt=[{why,day:G.day},...u.hurt.filter(h=>h.why!==why)].slice(0,SUPPLY.hurt)}
// a man dies of it (why: thirst or hunger): a sick one first (sick of it, else of anything), else the fit kind you have most of; with
// none, your hero's health. Gone for good: kept for the card (supplyLost)
function supplyDie(why){
  const u=BAND,W=P.wounded||{},sick=Object.keys(u.sick).filter(q=>W[q]>0&&sum(u.sick[q])>0);
  let k=sick.filter(q=>u.sick[q][why]>0).sort((a,b)=>u.sick[b][why]-u.sick[a][why])[0]||sick[0];
  if(k){const s=u.sick[k],c=s[why]>0?why:Object.keys(s).find(w=>s[w]>0);if(!--s[c])delete s[c];if(!sum(s))delete u.sick[k];if(!--W[k])delete W[k];woundedTrim(k)}
  else{k=Object.keys(P.troops).filter(q=>P.troops[q]>0).sort((a,b)=>P.troops[b]-P.troops[a])[0];if(k)P.remove(k)}
  if(k){supplyLost(k,why);log(cap1(an(ST[k].n.toLowerCase()))+' dies of '+why+'.','bad')}
  else{log(cap1(why)+' wears you down.','bad');heroHurt(.1,0,why)}
  u.hurt=[{why,day:G.day},...u.hurt.filter(h=>h.why!==why)].slice(0,SUPPLY.hurt)}
/* your hero's own toll (hp, mp: the shares of her health and mana lost; why: what did it). Her health reaching 0 here, off the
   battlefield (thirst, hunger, fever, frostbite), she dies and the game is over (G.dead; ui.js showDeath). Battles keep their own
   rules: a lost battle is not death */
function heroHurt(hp,mp,why){const m=vitals();P.hp=Math.max(0,P.hp-m[0]*hp);P.mp=Math.max(0,P.mp-m[2]*mp);if(P.hp<=0)heroDies(why)}
function heroDies(why){if(G.dead)return;G.dead={why,day:G.day};P.tx=P.ty=null;G.chase=null;G.pitch=null;if(G.hurry)setHurry(false);log('You die of '+(WHY_SICK[why]||why)+'.','bad');showDeath()}
// where your band's hunger and thirst stand (the stages of hungerTag and thirstTag), and what they leave your hero: her mana comes
// back unless Parched or Hungry (or worse), her health unless Dying of thirst or Starving (parties.js regenVitals)
function supplyStage(){const T=SUPPLY.thirst,H=SUPPLY.hunger,h=BAND.hungry;if(CHEAT.noNeeds)return{parched:false,dying:false,hungry:false,starving:false};return{parched:BAND.dry>=T.parched,dying:BAND.dry>=T.dying,hungry:h>0||!foodN(),starving:h>=H.starving}}
function heroRegen(){const s=supplyStage();return{hp:!s.dying&&!s.starving,mp:!s.parched&&!s.hungry}}
// (one lost for good, kept a few days; the wounded groups of a kind never hold more than its wounded; the sick never more than
// the wounded of their kind, the ones fit again counted off the sick last)
function supplyLost(k,why){const u=BAND,L=SUPPLY.lost;u.lost=[{k,why,day:G.day},...u.lost.filter(x=>G.day-x.day<L.days)].slice(0,L.keep)}
function woundedTrim(k){let over=(P.woundedGroups||[]).filter(g=>g.type===k).reduce((a,g)=>a+g.count,0)-((P.wounded||{})[k]||0);
  for(const g of P.woundedGroups||[])if(over>0&&g.type===k&&g.count){const m=Math.min(over,g.count);g.count-=m;over-=m}}
function sickTrim(){const u=BAND,W=P.wounded||{};
  for(const k in u.sick){let over=sum(u.sick[k])-(W[k]||0);for(const w in u.sick[k]){if(over<=0)break;const m=Math.min(over,u.sick[k][w]);u.sick[k][w]-=m;over-=m;if(!u.sick[k][w])delete u.sick[k][w]}
    if(!sum(u.sick[k]))delete u.sick[k]}}
const sickN=()=>{sickTrim();return Object.keys(BAND.sick).reduce((a,k)=>a+sum(BAND.sick[k]),0)};
// how many marks start+n·every (n ≥ 0) the count passed going from a to b
const passed=(a,b,start,every)=>b<start?0:Math.floor((b-start)/every)-Math.floor((a-start)/every);
// a stage's tag and its words: what it does now and what comes next, in hours of what it lacks (k: hours count × k)
const pctOf=v=>Math.round(v*100)+'%',inHours=(h,k)=>{const n=Math.max(1,Math.ceil(h/k));return n+' hour'+(n>1?'s':'')};
function thirstTag(L){const T=SUPPLY.thirst,h=BAND.dry,k=L.desert?T.desert:1,w=L.desert?'In the desert with no water: stamina drains twice as fast and does not come back. ':'Nothing to drink: stamina drains faster and comes back slower. ';
  const you=' Your mana does not come back; with every man who falls sick you lose '+pctOf(T.hero.hp)+' of your health and '+pctOf(T.hero.mp)+' of your mana, and your health does not come back.';
  if(h>=T.death)return['Dying of thirst','bad',w+'Your men are dying: one every '+inHours(T.toll,k)+'. Find water now.'+you];
  if(h>=T.dying)return['Dying of thirst','bad',w+'A man falls sick every '+inHours(T.toll,k)+'; in '+inHours(T.death-h,k)+' they start to die.'+you];
  if(h>=T.parched)return['Parched','bad',w+'Your pace is '+Math.round((1-T.pace)*100)+'% slower, morale falls and your mana does not come back. In '+inHours(T.dying-h,k)+' men fall sick, and you suffer with them.'];
  return['Thirsty','bad',w+'In '+inHours(T.parched-h,k)+' your band is parched.']}
function hungerTag(){const H=SUPPLY.hunger,h=BAND.hungry,next=h<H.starving?['starving',H.starving]:h<H.desert?['men desert',H.desert]:h<H.sick?['men fall sick',H.sick]:h<H.die?['men die',H.die]:null;
  const now=h>=H.die?'Men die of hunger, one every '+H.toll+' hours. ':h>=H.desert?'Men desert'+(h>=H.sick?' and fall sick':'')+', one every '+H.toll+' hours. ':'';
  const you=h>=H.starving?'You lose '+pctOf(H.hero.hp)+' of your health and '+pctOf(H.hero.mp)+' of your mana every '+H.hero.every+' hours; neither comes back. ':'Your mana does not come back. ';
  return[h>=H.starving?'Starving':'Hungry','bad',(h>=H.starving?'No food for days: the march drains more and morale falls every hour. ':'No food: rest comes back at half speed and morale slips. ')+you+now+(next?'In '+inHours(next[1]-h,1)+': '+next[0]+'.':'')]}
/* the band's hour (Systems.hour): waterskins fill beside water (stopped) or at a holding's well; it eats and drinks (more on the
   march); its stamina drains or comes back; and what it lacks takes its toll: tiredness and hunger in morale, exhaustion, hunger,
   thirst and the cold in men. The console's noNeeds (core.js CHEAT): nothing eaten or drunk, never hungry or thirsty, no drain */
function supplyHour(){
  const S=SUPPLY,u=BAND,L=supplyLand(),moving=!P.stay&&supplyMoved(),free=CHEAT.noNeeds;
  if(L.well||L.water&&!moving)fillSkins(true);
  // food, eaten as it comes due (the frost eats more): hungry when it could not eat what was due, or has none left
  if(!free)u.eat+=P.foodHour(moving)*(L.frost?1+S.frostEat*survivalShare():1);const due=Math.floor(u.eat);u.eat-=due;
  const hungry=!free&&((due?foodTake(due)<due:false)||!foodN());
  // drink: rations as they come due, else on what it carries
  if(!free)u.drink+=P.drinkHour(moving);const owe=Math.floor(u.drink);u.drink-=owe;const dr=free?'water':owe?drinkTake(owe,L):drinkNext(L);
  {const n=staminaRate(moving,dr,L).n;P.bsta=clamp(P.bsta+(free?Math.max(0,n):n),0,100)}
  const st=P.staminaState();
  if(st!=='fresh'){if(++u.tired%S.tiredMorale.every===0)P.morale-=S.tiredMorale.n}else u.tired=0;
  if(st==='exhausted'){if(++u.worn%S.worn.every===0)supplyHurt('exhaustion')}else u.worn=0;
  // hunger, by its stages (SUPPLY.hunger): morale, then Starving, then men desert, fall sick and at last die
  if(hungry){const H=S.hunger,h=++u.hungry;if(h===1){log('Your band goes hungry. Buy food in a town, or hunt.','bad');mood('hungry')}
    if(h>=H.starving){P.morale-=H.starveMorale;if(h===H.starving)log('Your band is starving: the march drains it more, and soon men will leave.','bad')}else if(h%H.every===0)P.morale-=H.morale;
    if(passed(h-1,h,H.desert,H.toll))supplyHurt('hunger',true);
    if(passed(h-1,h,H.sick,H.toll))supplyHurt('hunger');
    if(passed(h-1,h,H.die,H.toll))supplyDie('hunger');
    if(passed(h-1,h,H.starving,H.hero.every)){log('Hunger gnaws at you.','bad');heroHurt(H.hero.hp,H.hero.mp,'hunger')}}else u.hungry=0;
  // thirst, by its stages (SUPPLY.thirst; the desert's hours count double): Parched, then men fall sick, then they die
  if(!dr){const T=S.thirst,a=u.dry,h=u.dry+=L.desert?T.desert:1;
    if(!a)log(L.desert?'No water in the desert: your band thirsts. Find an oasis, a river or a holding.':'Nothing to drink: your band thirsts. Find a river, a lake or a holding’s well.','bad');
    if(h>=T.parched){P.morale-=T.morale;if(a<T.parched)log('Your band is parched: it slows, and soon men will fall sick.','bad')}
    if(a<T.death&&h>=T.death)log('Your men begin to die of thirst.','bad');
    for(let i=passed(a,h,T.dying,T.toll);i>0;i--){supplyHurt('thirst');log('Thirst saps your strength.','bad');heroHurt(T.hero.hp,T.hero.mp,'thirst')}
    for(let i=passed(a,h,T.death,T.toll);i>0;i--)supplyDie('thirst')}else u.dry=0;
  sickTrim();
  // (frostbite: the hours short of furs, weighted by how short, until a man is bitten)
  const cold=L.frost?coldShare():0;if(cold){u.cold+=cold;if(u.cold>=S.frost.every){u.cold-=S.frost.every;supplyHurt('frostbite')}}else u.cold=0;
  P.morale=clamp(P.morale,0,100);
  if(!u.hint&&P.bsta<S.hint){u.hint=true;log('Marching tires your band. Stop, or Make camp (Z), to rest.','gold')}
}
Systems.add({name:'supply',order:{hour:10,frame:55},hour:supplyHour,frame:supplyFrame});

/* ---------- the wounded and the sick (the troops tab, character.js troopCards; the card's health tip): each kind's wounded, those
   of them sick and of what, the share fit again by tomorrow (world.js healShare) and what would raise it; the men lost lately ---------- */
const WHY_SICK={thirst:'thirst',hunger:'hunger',exhaustion:'exhaustion',frostbite:'frostbite',fever:'swamp fever'};
function lostLines(){const by={};for(const x of BAND.lost.filter(x=>G.day-x.day<SUPPLY.lost.days)){const w=x.why==='deserted'?'Deserted':'Died of '+x.why;(by[w]=by[w]||{})[x.k]=(by[w][x.k]||0)+1}
  return Object.keys(by).map(w=>w+': '+Object.keys(by[w]).map(k=>ST[k].n+' ×'+by[w][k]).join(', '))}
function healthLines(){sickTrim();const s=sickN(),l=lostLines();return (s?s+' of them sick. ':'')+(l.length?'Lost lately: '+l.join('; ')+'.':'')}
function woundedPanel(){
  sickTrim();const W=P.wounded||{},ks=Object.keys(W).filter(k=>W[k]>0),l=lostLines();if(!ks.length&&!l.length)return '';
  const r=healShare(),help=[P.camp||P.stay?'':'rest in camp or a holding',r.near?'':'a friendly holding near'].filter(Boolean);
  const rows=ks.map(k=>{const s=BAND.sick[k]||{},sn=sum(s),wn=W[k]-sn;
    return '<li>'+ST[k].n+' ×'+W[k]+': '+[wn?wn+' wounded':'',...Object.keys(s).map(w=>s[w]+' sick ('+(WHY_SICK[w]||w)+')')].filter(Boolean).join(', ')+'</li>'}).join('');
  return '<div class="lab">Wounded and sick</div>'+(ks.length?'<ul class="tnotes">'+rows+'</ul><p class="muted" style="font-size:13px">About '+Math.round(r.share*100)+'% are fit again each day'+(help.length?'; more with '+help.join(' and '):'')+' (Medicine helps too).</p>':'')+
    (l.length?'<p class="bad" style="font-size:13px">Lost on the road, these '+SUPPLY.lost.days+' days: '+l.join('; ')+'.</p>':'')}
/* ---------- the camp (§7): Z, the dock's Camp, or the action ring. Your band stops and pitches its tents; stamina comes back
   faster (SUPPLY.rest.camp), the wounded mend faster (SUPPLY.camp.heal: world.js woundedDay); fast forward stops when anything
   hostile comes into sight; any travel order breaks it; a hostile band that finds you in it catches you unready ---------- */
// why you cannot make camp here ('' if you can)
const campWhy=()=>G.mode!=='world'||G.modal?'Not now':P.stay?'You are staying in a holding':P.siege?'You are besieging a holding':P.raid?'You are raiding':'';
/* where the band pitches (the owner, 2026-10-22: on clear ground, never over trees): the camp's picture at a spot (x, y): its
   sprite, its corner (X, Y) and its pixels' box on the map, its feet the box's bottom (bandCampEnt draws it there, in your place) */
function campAt(x,y){const s=campSprite(5,'travelers'),b=opaqueBox(s),X=x-s.ax,Y=y-4-s.ay;return{s,X,Y,box:[X+b[0],Y+b[1],X+b[2],Y+b[3]]}}
/* is (x, y) allowed ground for a camp (the owner, 2026-10-23: "it cannot collide with roads and any other non-allowed places"):
   its picture's box and SUPPLY.camp.m px round it on no water (a pond's, an oasis's too), ford, peak, wood, swamp, crossing's
   tile (WM.crossings) or brook (WM.flow at GEN_RIVER.brook), no road or track tile's middle within road px of it; on no ground the art keeps clear (worldart.js
   plan.clear: the roads' and tracks' bands as painted and their margins, the fords' tracks, the holdings' gates, lots and fields,
   the bandits' camps); no lot or field within SUPPLY.camp.lot tiles; outside every holding's ring (its centre's and houses' box
   and ring tiles round it: campRing); clear of every site's picture by site px; nothing standing on it (a tree, a bush, a stone,
   rock: WorldArt.standing) */
function campGround(x,y){const C=SUPPLY.camp,b=campAt(x,y).box,x0=b[0]-C.m,y0=b[1]-C.m,x1=b[2]+C.m,y1=b[3]+C.m,
    tx0=Math.floor(x0/TILE),ty0=Math.floor(y0/TILE),tx1=Math.floor(x1/TILE),ty1=Math.floor(y1/TILE),BK=typeof GEN_RIVER==='object'?GEN_RIVER.brook:99,X=campXings();
  if(tx0<0||ty0<0||tx1>=MW||ty1>=MH)return false;
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const i=ty*MW+tx,k=tAt(tx,ty);
    if(k===T_WATER||k===T_MOUNT||k===T_FORD||k===T_FOREST||k===T_ROAD&&Math.abs((tx+.5)*TILE-(x0+x1)/2)<=(x1-x0)/2+C.road&&Math.abs((ty+.5)*TILE-(y0+y1)/2)<=(y1-y0)/2+C.road||CLIMS[climate[i]]==='swamp'||X.has(i)||WM.flow&&(WM.flow[i]&31)>=BK)return false}
  for(let ty=ty0-C.lot;ty<=ty1+C.lot;ty++)for(let tx=tx0-C.lot;tx<=tx1+C.lot;tx++)if(occAt(tx,ty))return false;// (a lot, a field, a bandits' camp's ground, off the map)
  for(const t of TOWNS){if(Math.abs(t.tx-tx0)>40||Math.abs(t.ty-ty0)>40)continue;const r=campRing(t);if(tx1>=r[0]&&tx0<=r[2]&&ty1>=r[1]&&ty0<=r[3])return false}
  for(const s of W.sites){if(Math.abs(s.x-x)>160||Math.abs(s.y-y)>160)continue;const q=siteBox(s);if(x1>=q[0]-C.site&&x0<=q[2]+C.site&&y1>=q[1]-C.site&&y0<=q[3]+C.site)return false}
  if(campKeptClear(x0,y0,x1,y1))return false;
  return !WorldArt.standing(x0,y0,x1,y1).some(e=>e.box[0]<=x1&&e.box[2]>=x0&&e.box[1]<=y1&&e.box[3]>=y0)}
// (the crossings' tiles, both ends and between: a set of tile indices, made once a map)
const CAMP_X=new WeakMap();
function campXings(){const L=WM.crossings||[];let X=CAMP_X.get(L);if(!X){X=new Set();for(const c of L)for(const i of [c.i,c.j,...c.tiles])X.add(i);CAMP_X.set(L,X)}return X}
// (a holding's ring: its centre's box and its houses' tiles, SUPPLY.camp.ring tiles round them: [tx0, ty0, tx1, ty1])
function campRing(t){const b=centreBox(t),r=[b.x,b.y,b.x+b.n-1,b.y+b.n-1],g=SUPPLY.camp.ring;
  for(const l of t.lots||[])if(l.k==='centre'||l.k==='house'){r[0]=Math.min(r[0],l.x);r[1]=Math.min(r[1],l.y);r[2]=Math.max(r[2],l.x+l.n-1);r[3]=Math.max(r[3],l.y+l.n-1)}
  return[r[0]-g,r[1]-g,r[2]+g,r[3]+g]}
// (a site's picture on the map, px: its sprite and yard where Site draw lays them, structures.js siteSprite)
function siteBox(s){const sp=siteSprite(s),X=Math.round(s.x)-sp.ax,Y=Math.round(s.y)+8-sp.ay,a=opaqueBox(sp),g=sp.gr?opaqueBox(sp.gr):a;
  return[X+Math.min(a[0],g[0]),Y+Math.min(a[1],g[1]),X+Math.max(a[2],g[2]),Y+Math.max(a[3],g[3])]}
// (any pixel of the px box the art keeps clear: worldart.js plan.clear, a PX.TileMask)
function campKeptClear(x0,y0,x1,y1){const M=WorldArt.ensure().clear,ts=M.ts;x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.floor(x1);y1=Math.floor(y1);
  for(let ty=Math.floor(y0/ts);ty<=Math.floor(y1/ts);ty++)for(let tx=Math.floor(x0/ts);tx<=Math.floor(x1/ts);tx++){const f=M.f[ty*M.C+tx];if(!f)continue;if(f===1)return true;
    for(let y=Math.max(y0,ty*ts);y<=Math.min(y1,ty*ts+ts-1);y++)for(let x=Math.max(x0,tx*ts);x<=Math.min(x1,tx*ts+ts-1);x++)if(M.at(x,y))return true}
  return false}
// does water or a peak lie on the straight way from you to (x, y)
function campAcross(x,y){const n=Math.ceil(Math.hypot(x-P.x,y-P.y)/4);for(let k=1;k<=n;k++){const q=terrAt(P.x+(x-P.x)*k/n,P.y+(y-P.y)*k/n);if(q===T_WATER||q===T_MOUNT)return true}return false}
/* the nearest allowed ground to camp on (campGround): where you stand, else a point SUPPLY.camp.step px apart within r tiles you
   can walk to, nearest first; one with water or a peak between it and you counted across tiles farther (open ground beside the
   road before ground over a river). {x, y, across} or null if none */
function campSpot(){if(campGround(P.x,P.y))return{x:P.x,y:P.y,across:false};const C=SUPPLY.camp,h=C.step,R=C.r*TILE,gx=Math.floor(P.x/h),gy=Math.floor(P.y/h),n=Math.ceil(R/h),c=[];
  for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++){const x=(gx+i+.5)*h,y=(gy+j+.5)*h,d=Math.hypot(x-P.x,y-P.y);if(d<=R)c.push([d,x,y])}
  c.sort((a,b)=>a[0]-b[0]);let best=null;
  for(const [d,x,y] of c){if(best&&d>=best.k)break;if(!campGround(x,y)||!Router.reach(P,{x,y}))continue;const across=campAcross(x,y),k=d+(across?C.across*TILE:0);if(!best||k<best.k)best={x,y,across,k}}
  return best&&{x:best.x,y:best.y,across:best.across}}
/* Make camp (the owner, 2026-10-23: "it should spawn right at available spots"): at the nearest allowed ground (campSpot); where
   you stand or within SUPPLY.camp.hop tiles (nothing between), your band steps there and pitches at once; farther, it walks there
   (G.pitch) and pitches on arrival (campArrive); none in reach: no camp */
function makeCamp(){if(P.camp||campWhy())return false;const s=campSpot();G.chase=null;
  if(!s){log('No clear ground to camp here.','bad');return false}
  if(!s.across&&Math.hypot(s.x-P.x,s.y-P.y)<=SUPPLY.camp.hop*TILE){P.x=s.x;P.y=s.y;P.stuck=0;return pitchCamp()}
  P.tx=s.x;P.ty=s.y;P.stuck=0;G.pitch={x:s.x,y:s.y};log('Your band makes for clear ground to camp.');return true}
function pitchCamp(){G.pitch=null;P.camp={at:Clock.hours()};P.tx=P.ty=null;G.chase=null;
  log('Your band makes camp. Stamina comes back faster, and the wounded mend.','good');updateHUD(true);return true}
// your march ends (world.js marchStep): at the clear ground you made for, the band pitches; anywhere else the plan is dropped
function campArrive(){const p=G.pitch;if(!p)return;G.pitch=null;if(Math.hypot(p.x-P.x,p.y-P.y)<3&&!campWhy()){P.x=p.x;P.y=p.y;pitchCamp()}}
function breakCamp(why){if(!P.camp)return false;P.camp=null;log(why||'Your band breaks camp.');updateHUD(true);return true}
function toggleCamp(){return P.camp?breakCamp():makeCamp()}
// each moment in camp (world.js marchStep): a travel order breaks it (true: the march goes on), but not a press on the map that may
// yet open the action ring (ui/ring.js RING.press); going faster than 1x, anything hostile in sight brings it back to 1x
function campStep(){
  if((P.tx!=null||G.chase||P.stay)&&!RING.press){breakCamp();return true}
  if(G.speed>1){const d=dangerInSight();if(d){log('Your camp stirs: '+d+'.','bad');setSpeed(1)}}
  return false}
/* ---------- Hurry (the owner, 2026-10-22: the band marches faster; off the top bar since the second play-test, the 8× time
   button back there): key R, the action ring. The band walks × SUPPLY.forcedMarch.pace, its stamina on the march draining × drain
   (staminaRate); it cannot start Exhausted, and ends on its own once the band is Exhausted, stops, or anything calls for you
   (world.js fastWatch). The time's speed is not touched. G.hurry: on or off (never saved) ---------- */
const hurryPace=()=>G.hurry?SUPPLY.forcedMarch.pace:1;
// on or off (why: it ended on its own, said in the log); false if it cannot start
function setHurry(on,why){on=!!on;
  if(on&&(G.mode!=='world'||P.stay||P.staminaState()==='exhausted')){if(P.staminaState()==='exhausted')log('Your band is too exhausted to hurry.','bad');on=false}
  if(!!G.hurry!==on){G.hurry=on;if(on&&P.camp)breakCamp();log(on?'Your band hurries: '+SUPPLY.forcedMarch.pace+'× the pace, its stamina draining '+SUPPLY.forcedMarch.drain+'× as fast.':'Your band slows to its marching pace'+(why?': '+why:'')+'.',why?'bad':'')}
  hurryUI();return on}
const toggleHurry=()=>setHurry(!G.hurry);
// a Hurry button lit while on (none on the top bar now)
function hurryUI(){if(typeof document==='undefined')return;document.querySelectorAll('[data-hurry]').forEach(b=>{b.classList.toggle('on',!!G.hurry);b.setAttribute('aria-pressed',String(!!G.hurry))})}
// a battle that finds you in camp (battle/setup.js, before morale): caught unready, morale lower; the camp is struck either way
function campCaught(opts){if(!P.camp||opts.tournament||opts.sandbox)return;P.camp=null;P.morale=Math.max(0,P.morale-SUPPLY.camp.caught);log('They catch your band in camp, unready.','bad')}
/* your camp in your place: two tents and the fire, with your band's banner planted beside them; your figure and host are not
   drawn while you camp (the owner, 2026-10-23: render.js drawWorld pushes this instead), and stand there again when it breaks. In
   the depth order by its feet as everyone is (depth.js worldOverdraw: the trees in front of it drawn over it, whole: nf, none
   faded for it) */
function bandCampEnt(cam){const c=campAt(P.x,P.y);return{y:c.box[3],nf:1,f:()=>{subT(P);const s=c.s,X=Math.round(c.X-cam.x),Y=Math.round(c.Y-cam.y);
  ctx.globalAlpha=SHADOW.a;ctx.drawImage(s.sh,X,Y);ctx.globalAlpha=1;ctx.drawImage(s,X,Y);drawFire(X+s.fire[0],Y+s.fire[1],0);BANNERQ.push({o:campPole(c)})}}}
// (your banner's pole in the camp: its foot on the ground SUPPLY.camp.pole px from the fire, drawn as yours with the parties'
// banners, render.js drawBanners: bannerAt lays the pole 2 px right of x - 4, its foot BANNER_GAP over headY)
const campPole=c=>{const f=c.s.fire,d=SUPPLY.camp.pole;return{x:c.X+f[0]+d[0]+2,y:P.y,faction:'player',banner:()=>P.banner(),headY:()=>Math.round(c.Y+f[1]+d[1])+BANNER_GAP}}

/* ---------- what the card shows (render.js updateHUD) ---------- */
// moving now or not; where you stand; the drink you are on; the stamina's rate an hour and why; its state; food and drink in
// days at the current rate; furs (have, need, shown in or near the frost or when carried); the band's health; the tags that apply
function supplyNow(){
  const S=SUPPLY,L=supplyLand(),go=!P.stay&&(P.tx!=null||!!G.chase),dr=drinkNext(L)||(canFill(L)?'water':null),r=staminaRate(go,dr,L),st=P.staminaState(),tags=[];// (where the skins fill, never thirsty)
  const foodDays=foodN()/Math.max(.01,P.foodHour(go)*(L.frost?1+S.frostEat*survivalShare():1)*24),drinkDays=drinkStock(L)/Math.max(.01,P.drinkHour(go)*24);
  const furs={have:goodN('furs'),need:P.furNeed(),show:L.frost||goodN('furs')>0||nearFrost()};
  if(st==='tired')tags.push(['Tired','warn','Stamina under '+S.tired+': your pace is '+Math.round((1-S.pace.tired)*100)+'% slower and morale slips. Stop or make camp to rest.']);
  if(st==='exhausted')tags.push(['Exhausted','bad','Stamina under '+S.exhausted+': your pace is '+Math.round((1-S.pace.exhausted)*100)+'% slower, you cannot outrun anyone, and men fall sick.']);
  if(!dr)tags.push(thirstTag(L));
  if(!foodN()||BAND.hungry)tags.push(hungerTag());
  if(L.frost&&coldShare())tags.push(['Cold','bad','Short of furs in the frost ('+furs.have+' of '+furs.need+'): stamina drains faster, and frostbite takes men.']);
  if(G.hurry)tags.push(['Hurrying','warn','Marching at '+S.forcedMarch.pace+'× the pace, stamina draining '+S.forcedMarch.drain+'× as fast. It ends once your band is Exhausted (R or the action ring’s Stop hurrying to stop).']);
  if(P.camp)tags.push(['In camp','good','Resting: stamina +'+S.rest.camp+' an hour, the wounded mend faster. Any travel order breaks camp.']);
  return{L,go,dr,r,st,foodDays,drinkDays,furs,fit:P.fitness(),tags}}

/* ---------- the action ring's map actions (ui/ring.js ActionRing; §7a): those that apply where you held (wx, wy: on o, a thing on
   the map, or the ground), in the ring's order ---------- */
function mapRingItems(wx,wy,o,cx,cy){
  const L=supplyLand(),ground=!o,look=o&&tipFor(o)||rumourTip(wx,wy);
  return[
    !P.camp&&!campWhy()&&{icon:'fire',label:'Make camp',run:makeCamp},
    P.camp&&{icon:'exit',label:'Break camp',run:()=>breakCamp()},
    ground&&{icon:'banner',label:'Travel here',run:()=>worldGo(wx,wy)},
    ground&&!G.hurry&&P.staminaState()!=='exhausted'&&{icon:'speed',label:'Hurry here',run:()=>{worldGo(wx,wy);setHurry(true)}},
    G.hurry&&{icon:'speed',label:'Stop hurrying',run:()=>setHurry(false)},
    canFill(L)&&{icon:'mug',label:'Fill waterskins',run:()=>fillSkins()},
    goodN('liquor')>0&&{icon:'barrel',label:BAND.liquor?'Water first':'Drink liquor',run:()=>{BAND.liquor=!BAND.liquor;log(BAND.liquor?'Your band drinks its liquor first: a hard march.':'Your band drinks water first again.');updateHUD(true)}},
    look&&{icon:'eye',label:'Look',run:()=>holdCard(look,cx,cy)}].filter(Boolean)}

/* ---------- the tavern's tapster (ui/town.js Tavern): liquor for the road, at its base price, and the well's water, free ---------- */
const LIQUOR_LOT=5;
function tapsterCard(t,race){
  const p=GOODS.liquor.base*LIQUOR_LOT,why=P.gold<p?'Not enough gold':goodRoom('liquor')<LIQUOR_LOT?BAG_FULL:'';
  return{pic:personPic('innkeeper',race,2),name:'The tapster',role:'Drink for the road',facts:['Water '+goodN('water'),'Liquor '+goodN('liquor'),goodN('ale')?'Ale '+goodN('ale'):''],
    note:'Something to drink keeps your band’s stamina draining at its rate; ale and liquor lift its spirits as they come into your stores.',
    acts:[['sup-fill',t.name,'Fill waterskins'],['sup-liquor',t.name,'Buy '+LIQUOR_LOT+' liquor · '+p+'g',why]]}}
function supplyAct(a,arg){
  if(a==='sup-fill')fillSkins();
  else if(a==='sup-liquor'){const p=GOODS.liquor.base*LIQUOR_LOT;if(P.gold<p||goodRoom('liquor')<LIQUOR_LOT)return;P.gold-=p;playerInventory.add('good','liquor',LIQUOR_LOT);log('You buy '+LIQUOR_LOT+' liquor for '+p+' gold.','gold')}
  else if(a==='sup-camp')toggleCamp();
  updateHUD(true);if(G.mode==='town'&&G.town)renderTown()}
onAct('sup-',supplyAct);
