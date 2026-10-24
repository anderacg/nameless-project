'use strict';
// Supplies (doc/SUPPLY_DESIGN.md, world/supply.js): your hero's stamina is your band's. It drains on the march (faster on rough
// ground, at night, with nothing to drink, in the desert with no water, short of furs in the frost; slower mostly mounted, with
// Athletics) and comes back stopped, faster in camp or staying in a holding (not with no food, nor in the desert with
// no water); Tired under 20 and Exhausted under 5 slow you, and cost morale and men. Food and drink by the hour, more on the march;
// waterskins fill free at the water's edge or at a holding's well, over game time (a bar on the card, a drop over your band; moving
// stops it, keeping what is in; by itself there too); one of a drink is one person's day (the owner, 2026-10-24); water in waterskins:
// drunk, they are empty; a fill fills only empty ones, never past 2 days; a new hero sets out with 4 full, a recruit brings an
// empty one, markets and taverns sell them; the desert's thirst and the frost's frostbite take men; liquor at the
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
 const bag=g=>{for(const k of ['water','skin_empty','ale','liquor','furs',...t.FOODS])t.goodTake(k,1e9);for(const k in g||{})t.playerInventory.add('good',k,g[k])};
 const reset=()=>{P.troops={hum_levy:5};P.comps={};P.wounded={};P.woundedGroups=[];P.perks=[];P.gear.mount=null;P.sk.athl.lv=0;P.sk.ride.lv=0;P.sk.surv.lv=0;P.race='human';
  P.morale=60;P.bsta=100;P.stay=null;G.dead=null;ev('BAND=freshBand()');G.clock=t.DAY*.3;G.speed=1;P.tx=null;G.chase=null;Kit.world()};
 const rate=moving=>{const L=t.supplyLand();return t.staminaRate(moving,t.drinkNext(L),L).n};
 const near=(a,b)=>Math.abs(a-b)<1e-9,last=()=>G.msgs[G.msgs.length-1].m;
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
 bag({grain:60,ale:20});ok(near(rate(true),-S.march),'on ale: the drain at its rate (ale and liquor lift morale as they come in: tests/itemcats.js)');
 bag({grain:60,liquor:20,water:20});ok(near(rate(true),-S.march),'water first, liquor kept (cheapest first)');
 t.BAND.liquor=true;ok(near(rate(true),-S.march)&&t.drinkNext(t.supplyLand())==='liquor','liquor first, as you choose: at its rate too');t.BAND.liquor=false;
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
 bag({water:200});ok(near(rate(false),S.rest.stop*S.hunger.rest),'with no food, ×'+S.hunger.rest);
 at('desert');bag({grain:60});ok(rate(false)===0,'in the desert with no water, none');
 // ---- Tired and Exhausted
 reset();at('open');bag({water:200,grain:60});{const p0=t.bandPace();P.bsta=19.9;const tired=t.bandPace(),st1=P.staminaState();P.bsta=4.9;const ex=t.bandPace(),st2=P.staminaState();P.bsta=20;
  ok(st1==='tired'&&st2==='exhausted'&&P.staminaState()==='fresh'&&near(tired,p0*S.pace.tired)&&near(ex,p0*S.pace.exhausted),'under '+S.tired+' Tired (pace ×'+S.pace.tired+'), under '+S.exhausted+' Exhausted (×'+S.pace.exhausted+'); 20 itself is fresh')}
 reset();at('open');bag({water:200,grain:60});P.bsta=18;hours(S.tiredMorale.every,true);ok(P.morale===60-S.tiredMorale.n,'Tired, morale slips '+S.tiredMorale.n+' every '+S.tiredMorale.every+' hours ('+P.morale+')');
 reset();at('open');bag({water:400,grain:60});P.bsta=4;hours(S.worn.every,true);ok(t.woundedN()===1&&P.troops.hum_levy===4&&/exhaustion/.test(t.BAND.hurt.map(h=>h.why).join()),'Exhausted for '+S.worn.every+' hours: a man falls sick ('+t.woundedN()+' wounded)');
 // ---- food and drink by the hour
 reset();at('open');bag({water:400,grain:200});{const e=t.eatPerDay(),g0=t.goodN('grain'),w0=t.goodN('water');hours(24,false);const ate=g0-t.goodN('grain'),drank=w0-t.goodN('water'),dr=P.drinkHour(false)*24;
  ok(ate===e,'at rest the band eats a day’s food in a day, by the hour ('+ate+' of '+e+')');ok(Math.abs(drank-dr)<=1,'and drinks (people + 1) × '+S.drink.perDay+' ÷ 24 ÷ 2 an hour ('+drank+', about '+dr+')')}
 reset();at('open');bag({water:400,grain:200});{const e=t.eatPerDay(),g0=t.goodN('grain');hours(24,true);const ate=g0-t.goodN('grain');
  ok(Math.abs(ate-e*S.eat.march)<=1,'on the march, ×'+S.eat.march+' ('+ate+', about '+e*S.eat.march+')')}
 // ---- the unit (the owner, 2026-10-24): one of a drink is one person's day of it; each water drunk leaves an empty waterskin
 reset();at('open');P.troops={hum_levy:20};bag({water:100,grain:400});{const w0=t.goodN('water');hours(24,true);const m=w0-t.goodN('water'),e=t.goodN('skin_empty');
  ok(m===21&&near(P.drinkHour(true)*24,21)&&e===21,'1 water is one person’s day: 20 men and your hero drink '+m+' on a day’s march, each leaving its waterskin empty ('+e+' empty)');
  bag({water:100,grain:400});hours(24,false);ok(100-t.goodN('water')===10&&near(P.drinkHour(false)*24,10.5),'resting, half that ('+(100-t.goodN('water'))+' in a day, 10.5 due)')}
 reset();at('open');P.troops={hum_levy:20};bag({ale:30,grain:400});{hours(24,true);const a=30-t.goodN('ale');
  ok(a===21&&!t.goodN('skin_empty'),'ale at the same unit: '+a+' ale on a day’s march for 21, and no empty skins (ale and liquor need none)');
  ok(near(S.drink.ale.morale*S.drink.perDay,.5*4)&&near(S.drink.liquor.morale*S.drink.perDay,1.5*4),'a person’s day of ale lifts morale +'+S.drink.ale.morale+', of liquor +'+S.drink.liquor.morale+': as its 4 old rations did (+0.5 and +1.5 each)')}
 // the card's drink in days: 42 water for 21 is 2 days on the march, 4 at rest
 reset();at('open');P.troops={hum_levy:20};bag({water:42,grain:400});{const chip=()=>{t.updateHUD(true);const c=[...document.querySelectorAll('#stats .chip')].find(x=>/^Drink/.test(x.title));return c&&c.lastElementChild.textContent};
  P.tx=P.x+200;P.ty=P.y;const a=t.supplyNow().drinkDays,ca=chip();P.tx=null;const b=t.supplyNow().drinkDays,cb=chip();
  ok(near(a,2)&&ca==='2d'&&near(b,4)&&cb==='4d','the card’s drink: 42 water for 21 people is '+ca+' on the march, '+cb+' at rest')}
 // ---- hunger by its stages (stopped by a river: never short of water): Hungry, Starving, men desert, fall sick, at last die
 {const H=S.hunger,msgs=()=>G.msgs.map(x=>x.m).join(),lost=w=>t.BAND.lost.filter(x=>x.why===w).length,tag=()=>t.supplyNow().tags.map(x=>x[0]).join();
  const hour=()=>{t.fillNow(true);t.supplyHour()},hours=n=>{for(let i=0;i<n;i++)hour()};// (kept in water: the skins topped up before each hour)
  reset();P.troops={hum_levy:30};at('river');bag({skin_empty:70});const m0=P.morale;hour(false);const m1=P.morale;hour(false);
  ok(t.BAND.hungry===2&&m1===m0&&P.morale===m0-H.morale&&/goes hungry/.test(msgs())&&/Hungry/.test(tag()),'no food: Hungry, morale −'+H.morale+' every '+H.every+' hours');
  hours(H.starving-2,false);ok(t.BAND.hungry===H.starving&&/starving/.test(msgs())&&/Starving/.test(tag())&&t.staminaRate(true,'water',t.supplyLand()).why.includes('starving ×'+H.starveDrain),'after '+H.starving+' hours Starving: the march drains ×'+H.starveDrain);
  hours(H.desert-H.starving-1,false);const n0=P.troops.hum_levy;hour(false);ok(P.troops.hum_levy===n0-1&&!t.woundedN()&&lost('deserted')===1,'after '+H.desert+' hours a man deserts');
  hours(H.sick-H.desert,false);ok(t.woundedN()===1&&t.BAND.sick.hum_levy.hunger===1,'after '+H.sick+' hours one falls sick as well (of hunger)');
  hours(H.die-H.sick,false);ok(lost('hunger')===1&&/dies of hunger/.test(msgs()),'after '+H.die+' hours a sick man dies of hunger');
  ok(/Wounded and sick/.test(t.woundedPanel())&&/sick \(hunger\)/.test(t.woundedPanel())&&/Died of hunger: Levy ×1/i.test(t.woundedPanel())&&/Deserted/.test(t.woundedPanel()),'the troops tab lists the sick and why, and the men lost on the road')}
 // ---- water at the water's edge and at a holding's well (the owner, 2026-10-23): much nearer than before, and over game time
 {const F=S.fill,K=t.WorldArt.ensure().wk;
  // (a shore: a land tile with water to its north and land two tiles south, far from the holdings; down from the tile's top the
  // last point at the edge, and a tile farther on)
  let shore=null;for(let ty=8;ty<t.MH-8&&!shore;ty++)for(let tx=8;tx<t.MW-8;tx++){if(t.tAt(tx,ty)!==t.T_OPEN||t.tAt(tx,ty-1)!==t.T_WATER||t.tAt(tx,ty+1)!==t.T_OPEN||t.tAt(tx,ty+2)!==t.T_OPEN||K[(ty+1)*t.MW+tx]||K[(ty+2)*t.MW+tx]||K[ty*t.MW+tx-1]||K[ty*t.MW+tx+1]||K[(ty+1)*t.MW+tx-1]||K[(ty+1)*t.MW+tx+1]||t.climAt((tx+.5)*16,(ty+.5)*16)!=='grass'||t.TOWNS.some(h=>Math.hypot(h.x-(tx+.5)*16,h.y-(ty+.5)*16)<120))continue;
   const x=(tx+.5)*16;let y=ty*16;while(y<(ty+2)*16&&t.waterEdge(x,y+1,F.near*16))y++;if(y>ty*16&&y<(ty+1)*16+4){shore={tx,ty,at:[x,y],off:[x,y+16]};break}}
  ok(!!shore,'a shore found (land with water to its north)'+(shore?' at '+shore.tx+','+shore.ty:''));
  if(shore){reset();Kit.goTo(...shore.at);bag({grain:60,skin_empty:99});const L=t.supplyLand();const r1=t.mapRingItems(P.x+20,P.y+20,null,0,0).map(i=>i.label);
   Kit.goTo(...shore.off);const L2=t.supplyLand(),r2=t.mapRingItems(P.x+20,P.y+20,null,0,0).map(i=>i.label);
   ok(L.water&&!L2.water&&t.nearWater(...shore.off,3),'the water’s edge: within '+F.near+' tile of the water as drawn yes, a tile farther no (within the old 3 tiles: '+t.nearWater(...shore.off,3)+')');
   ok(r1.includes('Fill waterskins')&&!r2.includes('Fill waterskins'),'the action ring offers Fill waterskins only at the edge ('+r1.join(', ')+' | '+r2.join(', ')+')')}
  {const h=t.TOWNS.find(z=>t.wellGate(z).y>z.y+16)||t.TOWNS[0],g=t.wellGate(h),r=F.well*16,away=[h.x,h.y-3*16];
   ok(t.wellNear(h.x,h.y+r-1)&&t.wellNear(g.x+r-1,g.y)&&!t.wellNear(...away)&&Math.hypot(away[0]-g.x,away[1]-g.y)>=3*16,'a holding’s well: within '+F.well+' tiles of where you arrive ('+h.name+') or of the spot before its gate yes, 3 tiles off no');
   reset();Kit.goTo(...away);bag({grain:60,skin_empty:99});ok(!t.supplyLand().well&&!t.mapRingItems(P.x+20,P.y,null,0,0).some(i=>i.label==='Fill waterskins'),'and 3 tiles off the ring has no Fill waterskins')}
  // the time it takes, by the game clock, the water coming in as it runs
  const pass=min=>{const n=Math.round(min*2);for(let i=0;i<n;i++){t.Clock.advance(t.DAY/24/60/2);t.SKINS.frame(0)}};// (min game minutes, by half minutes: the hour's work as it comes)
  reset();Kit.goHome();bag({grain:60,skin_empty:99});P.troops={};t.SKINS.reset(false);{const full=t.skinsFull();t.fillSkins();const f=t.SKINS.on,h1=f&&f.h;
   ok(f&&t.goodN('water')===0&&Math.abs(h1*60-F.minPerDay*full/S.drink.perDay)<1e-9,'Fill waterskins alone: '+full+' empty skins filled over '+Math.round(h1*60)+' game minutes ('+F.minPerDay+' a man’s day of drink), none yet');
   pass(h1*60/2);const half=t.goodN('water');ok(t.SKINS.on&&half>0&&half<full&&Math.abs(half-full/2)<=1,'halfway, half the water is in ('+half+' of '+full+')');
   t.updateHUD(true);{const b=document.querySelector('#stats .pc-fill');ok(b&&/^Filling waterskins\d+%$/.test(b.textContent)&&Math.abs(parseInt(b.textContent.replace(/\D/g,''))-50)<=2&&b.querySelector('i').style.width===b.textContent.replace(/\D/g,'')+'%','the band card shows it: '+(b&&b.textContent)+', its bar as full');
    ok(document.querySelectorAll('#stats .bars .bar').length===3,'under the three bars, not one of them')}
   pass(h1*60/2+1);ok(!t.SKINS.on&&t.goodN('water')===full&&/You fill your waterskins: \d+ water/.test(G.msgs[G.msgs.length-1].m),'at its end they are full ('+t.goodN('water')+')');
   t.updateHUD(true);ok(!document.querySelector('#stats .pc-fill'),'and the bar is gone')}
  {reset();Kit.goHome();bag({grain:60,skin_empty:99});t.SKINS.reset(false);P.troops={};t.fillSkins();const h1=t.SKINS.on.h;t.SKINS.reset(false);P.troops={hum_levy:2};t.fillSkins();const h3=t.SKINS.on.h;t.SKINS.reset(false);P.troops={hum_levy:40};t.fillSkins();const h41=t.SKINS.on.h;t.SKINS.reset(false);
   ok(Math.abs(h3-3*h1)<1e-9&&h41*60===F.max,'a bigger band takes longer: alone '+h1*60+' min, three '+h3*60+', forty-one '+h41*60+' (the most, '+F.max+')')}
  // moving stops it, keeping what is in; so do Hurry, a battle and a page off the map
  const part=go=>{reset();Kit.goHome();bag({grain:60,skin_empty:99});P.troops={};t.SKINS.reset(false);t.fillSkins();const f=t.SKINS.on;pass(f.h*60/2);const w=t.goodN('water');go();t.SKINS.frame(0);const left=!t.SKINS.on,w2=t.goodN('water');
   G.hurry=false;Kit.world();P.tx=null;G.chase=null;return[left&&w2>0&&w2<f.n&&w2>=w,w2+' of '+f.n]};
  {const [a,m]=part(()=>{P.tx=P.x+100;P.ty=P.y});ok(a,'an order to travel stops it; the water in stays ('+m+')')}
  {const [a,m]=part(()=>{G.hurry=true});ok(a,'Hurry stops it ('+m+')')}
  {const [a,m]=part(()=>t.worldEmit('battle:ended',{enc:null,how:'won'}));ok(a,'a battle stops it ('+m+')')}
  {const [a,m]=part(()=>{G.mode='dialog';t.supplyNow();G.mode='world'});ok(a,'an encounter (anything off the map: the card asks every quarter second) stops it ('+m+')')}
  // it follows the game clock: paused, nothing; faster at a higher speed
  {reset();G.lastTown=Kit.goHome();bag({grain:60,skin_empty:99});P.troops={};t.SKINS.reset(false);t.fillSkins();G.paused=true;Kit.frames(40,.05);const s0=t.SKINS.share;G.paused=false;Kit.frames(4,.05);const s1=t.SKINS.share;G.speed=4;Kit.frames(4,.05);const s2=t.SKINS.share-s1;G.speed=1;
   ok(s0===0&&s1>0&&Math.abs(s2/s1-4)<.01,'by the game clock: paused it stands still ('+s0+'), at 4× it runs 4× as fast ('+(s2/s1).toFixed(2)+')');t.SKINS.reset(false)}
  // by itself, timed: at a well (or stopped at the water's edge) it starts, never at once
  {reset();Kit.goHome();bag({grain:60,skin_empty:99});P.troops={};t.SKINS.reset(false);t.SKINS.frame(1);const on=!!t.SKINS.on,w0=t.goodN('water');pass(t.SKINS.on?t.SKINS.on.h*60+1:0);
   ok(on&&w0===0&&t.goodN('water')===t.skinsFull(),'at a holding’s well it starts by itself, timed: none at once, full at its end');
   if(shore){reset();Kit.goTo(...shore.at);bag({grain:60,skin_empty:99});t.SKINS.reset(false);P.tx=P.x+50;P.ty=P.y;t.SKINS.frame(1);const moving=!t.SKINS.on;P.tx=null;t.SKINS.frame(1);ok(moving&&!!t.SKINS.on&&t.goodN('water')===0,'at the water’s edge: not while you march by; stopped, it starts');t.SKINS.reset(false)}}
  reset();at('open');bag({grain:60,skin_empty:99});t.SKINS.reset(false);t.SKINS.frame(1);hour(false);ok(!t.SKINS.on&&t.goodN('water')===0,'out on dry ground they do not fill');
  reset();Kit.goHome();bag({grain:60,skin_empty:99});t.SKINS.reset(false);hour(false);ok(t.goodN('water')===0,'nor on the hour any more (by the frame, timed)')
  // only empty ones fill, up to 2 days; with none nothing fills, and the ring, the tapster and the card's drink say so
  reset();Kit.goHome();P.troops={};t.SKINS.reset(false);bag({grain:60,skin_empty:10});{const n1=t.fillNow(true);
   ok(n1===2&&t.goodN('water')===2&&t.goodN('skin_empty')===8,'alone, a fill takes 2 empty skins full (2 days of drink) and leaves 8 empty');
   P.troops={hum_levy:20};bag({grain:60,water:4,skin_empty:10});const n2=t.fillNow();
   ok(n2===10&&t.goodN('water')===14&&!t.goodN('skin_empty')&&/all your empty ones/.test(last()),'21 want 42: only as many as you have empty (10 filled, 14 full): "'+last()+'"');
   bag({grain:60,skin_empty:3});t.fillSkins();const on=t.SKINS.on;ok(on&&on.n===3,'timed too: 3 empty, 3 to fill ('+(on&&on.n)+')');t.SKINS.reset(false);
   bag({grain:60});const n3=t.fillNow(),m3=last(),s3=t.SKINS.start(),r=t.mapRingItems(P.x+20,P.y,null,0,0).map(i=>i.label);
   ok(n3===0&&!s3&&/^No empty waterskins/.test(m3)&&r.includes('No empty waterskins')&&!r.includes('Fill waterskins')&&/No empty waterskins/.test(t.skinsTip()),'with none, nothing fills: "'+m3+'"; the ring says so ('+r.join(', ')+'), and the card’s drink tip ("'+t.skinsTip()+'")');
   bag({grain:60,water:42});ok(t.fillNow()===0&&/full/.test(last())&&!/No empty/.test(t.skinsTip()),'full skins: "'+last()+'"');t.SKINS.reset(false)}}
  // at a holding's well (staying, or stopped by it) the band drinks from the well, its skins untouched (the owner, 2026-10-24)
  reset();Kit.goHome();P.troops={hum_levy:5};t.SKINS.reset(false);bag({grain:60});{for(let k=0;k<30;k++)hour(false);const S=t.supplyNow();
   ok(!t.BAND.dry&&!t.goodN('water')&&!t.goodN('skin_empty')&&!S.tags.some(g=>/Thirst|Parch/.test(g[0])),'at a holding’s well with no skins at all: 30 hours and never thirsty, on the card too (the band drinks from the well)')}
  reset();Kit.goHome();P.troops={hum_levy:5};t.SKINS.reset(false);bag({grain:60,water:6});{for(let k=0;k<30;k++)hour(false);
   ok(t.goodN('water')===6&&!t.goodN('skin_empty'),'and a band with full skins keeps them while it drinks at the well ('+t.goodN('water')+' full)')}
 // ---- the desert's thirst and the frost's frostbite
 // ---- thirst by its stages, sooner in the desert: Thirsty, Parched (slower), men fall sick, then the sick die
 {const T=S.thirst,tag=()=>t.supplyNow().tags.map(x=>x[0]).join(),lost=()=>t.BAND.lost.filter(x=>x.why==='thirst').length;
  reset();P.troops={hum_levy:30};at('desert');bag({grain:400});P.bsta=50;hour(false);ok(t.BAND.dry===T.desert&&near(P.bsta,50)&&/Thirsty/.test(tag()),'the desert with no water: Thirsty, no rest, its hours counting ×'+T.desert);
  const p0=P.staminaPace();hours(T.parched/T.desert-1,false);ok(t.BAND.dry===T.parched&&/Parched/.test(tag())&&near(P.staminaPace(),p0*T.pace),'Parched after '+T.parched/T.desert+' hours there: pace ×'+T.pace);
  hours((T.dying-T.parched)/T.desert,false);ok(t.woundedN()===1&&t.BAND.sick.hum_levy.thirst===1&&/Dying of thirst/.test(tag()),'then a man falls sick of thirst');
  hours((T.death-T.dying)/T.desert,false);const sick=(T.death-T.dying)/T.toll+1;ok(lost()===1&&t.woundedN()===sick-1&&P.troops.hum_levy===30-sick,'then they die, a sick man first ('+sick+' fell sick, 1 died)')}
 {reset();P.troops={hum_levy:30};at('open');bag({grain:400});hours(S.thirst.parched,false);const p=/Parched/.test(t.supplyNow().tags.map(x=>x[0]).join());hours(S.thirst.dying-S.thirst.parched,false);
  ok(p&&t.woundedN()===1,'with nothing to drink anywhere: Parched after '+S.thirst.parched+' hours, a man sick after '+S.thirst.dying)}
 reset();at('frost');bag({grain:200,water:400});hours(S.frost.every,false);ok(t.woundedN()===1&&/frostbite/.test(t.BAND.hurt.map(h=>h.why).join()),'with no furs in the frost, frostbite takes a man every '+S.frost.every+' hours');
 reset();at('frost');bag({grain:200,water:400,furs:P.furNeed()});hours(S.frost.every*2,false);ok(!t.woundedN(),'with furs enough, none');
 // ---- the hint, once
 reset();at('open');bag({water:400,grain:60});P.bsta=S.hint+1;const n0=G.msgs.filter(x=>/Make camp \(Z\)/.test(x.m)).length;hours(3,true);hours(30,true);
 ok(G.msgs.filter(x=>/Make camp \(Z\)/.test(x.m)).length===n0+1,'a first hint, once: "Marching tires your band. Stop, or Make camp (Z), to rest."');
 // ---- the card
 reset();at('open');bag({water:400,grain:60});P.tx=P.x+200;P.ty=P.y;P.bsta=15;t.updateHUD(true);{const el=document.getElementById('stats'),h=el.innerHTML,bar=el.querySelector('.bar.sta');
  ok(bar&&bar.classList.contains('tired')&&/▼/.test(bar.textContent)&&/Tired/.test(bar.textContent)&&bar.title.includes('marching −'+t.SUPPLY.march),'the card: stamina amber with ▼ and "Tired" marching ('+bar.textContent+'; '+bar.title+')');
  ok(el.querySelector('.bar.fit')&&el.querySelector('.bar.fit').textContent==='Fitness'+Math.round(t.bandFitness().pct)+'%'&&/5 fit, 0 wounded/.test(el.querySelector('.bar.fit').title),'its fitness bar: the 5 fit and your hero’s health over the whole band, in % ('+el.querySelector('.bar.fit').textContent+'; '+el.querySelector('.bar.fit').title+')');
  ok([...el.querySelectorAll('.pc-tags .tag')].map(x=>x.textContent).join()==='Tired','its tags: Tired');
  ok(el.querySelectorAll('.chip').length>=6&&/d</.test(h)&&!/Mana/.test(h),'food and drink chips in days; your hero’s mana is not on it')}
 P.tx=null;P.bsta=3;bag({grain:60});P.troops={hum_levy:2};P.wounded={hum_levy:4};t.updateHUD(true);{const el=document.getElementById('stats'),tags=[...el.querySelectorAll('.pc-tags .tag')].map(x=>x.textContent).join();
  ok(el.querySelector('.bar.sta.exhausted')&&/Exhausted/.test(tags)&&/Thirsty/.test(tags)&&el.querySelector('.bar.fit.low'),'Exhausted, Thirsty, and fitness red under half ('+tags+'; '+el.querySelector('.bar.fit').textContent+')')}
 reset();at('frost');bag({water:400,grain:60});t.updateHUD(true);ok(/Cold/.test(document.querySelector('#stats .pc-tags').textContent)&&[...document.querySelectorAll('#stats .chip.warn')].some(c=>/^Furs/.test(c.title)),'in the frost short of furs: Cold, and the furs chip red');
 // ---- the tavern sells liquor
 reset();{const h=Kit.goHome();bag({});P.gold=500;Kit.world();t.enterTown(h);t.act('tab','tavern');const p=t.GOODS.liquor.base*t.LIQUOR_LOT;
  ok(/The tapster/.test(Kit.panel()),'the tavern has a tapster');t.act('sup-liquor',h.name);ok(t.goodN('liquor')===t.LIQUOR_LOT&&P.gold===500-p,'who sells '+t.LIQUOR_LOT+' liquor for '+p+' gold');
  {const b=Kit.qa('[data-act="sup-fill"]')[0];ok(b&&b.disabled&&/^No empty waterskins/.test(b.title),'with no empty waterskins its Fill waterskins is off: "'+(b&&b.title)+'"')}
  const k=S.skins.lot,ps=t.GOODS.skin_empty.base*k,g0=P.gold;t.act('sup-skins',h.name);ok(t.goodN('skin_empty')===k&&P.gold===g0-ps,'it sells '+k+' empty waterskins for '+ps+' gold');
  t.act('sup-fill',h.name);ok(t.goodN('water')===k&&!t.goodN('skin_empty'),'and fills them at once ('+t.goodN('water')+' full, the band of 6 wanting 12)');Kit.world({town:null})}
 // ---- the market sells them too
 reset();{const h=Kit.goHome();bag({});P.gold=500;Kit.world();t.enterTown(h);t.act('tab','trade');const p=t.GOODS.skin_empty.base;
  {const row=Kit.qa('#panel .row').find(x=>/^Empty waterskin/.test(x.textContent));let c=row;while(c&&!(c.classList&&c.classList.contains('lab-cat')))c=c.previousElementSibling;
   ok(row&&c&&c.textContent==='Water','the market lists empty waterskins under '+(c&&c.textContent))}
  t.act('skin-buy','3');ok(t.goodN('skin_empty')===3&&P.gold===500-3*p,'and sells them at '+p+'g each (3 for '+3*p+')');Kit.world({town:null})}
 // ---- a recruit brings an empty waterskin; losing men takes none
 reset();{const h=Kit.goHome();bag({});P.troops={};P.gold=5000;h.vol=20;const k=[...new Set(h.races.flatMap(r=>h.hires(r)))].find(q=>t.canHire(h,q)),r=k&&t.recruitment.hire(h,k,3);
  ok(r&&r.ok&&t.goodN('skin_empty')===3,'3 recruits hired ('+(k||'none')+(r&&!r.ok?', '+r.code:'')+') bring 3 empty waterskins ('+t.goodN('skin_empty')+')');
  if(k)P.remove(k,2);ok(t.goodN('skin_empty')===3,'dismissing or losing men takes none away')}
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
 P.wounded={hum_levy:2};t.BAND.sick={hum_levy:{thirst:1}};t.BAND.lost=[{k:'hum_levy',why:'thirst',day:G.day}];G.mode='world';t.saveGame(true,'quick');ev('BAND=freshBand()');t.loadGame('quick');
 ok(t.BAND.sick.hum_levy&&t.BAND.sick.hum_levy.thirst===1&&t.BAND.lost.length===1&&t.BAND.lost[0].why==='thirst','and the sick and the men lost lately (written only when there are any)');
 bag({water:3,skin_empty:5});G.mode='world';t.saveGame(true,'quick');bag({});t.loadGame('quick');ok(t.goodN('water')===3&&t.goodN('skin_empty')===5,'and the full and empty waterskins (3 and 5)');
 Kit.begin('soldier',4242);ok(P.bsta===100&&!t.BAND.liquor&&!t.BAND.hint,'a new game starts fresh');
 // a new game never begins thirsty: its hero sets out with 4 full waterskins (the owner, 2026-10-23, 2026-10-24), on its first moment on the map
 {G.mode='world';G.modal=false;t.hidePanel();const w0=t.goodN('water'),c0=t.supplyNow();t.SKINS.t=0;t.Systems.frame(.01,.01);const w1=t.goodN('water');
  ok(w0===0&&!c0.tags.some(x=>x[0]==='Thirsty')&&w1===S.skins.start&&!t.goodN('skin_empty')&&!t.SKINS.on,'a new game: not thirsty, and its hero sets out with '+S.skins.start+' full waterskins on its first moment ('+w0+' water, then '+w1+')')}
 // (a loaded game keeps what it saved: no free fill)
 {G.mode='world';t.goodTake('water',1e9);t.saveGame(true,'quick');t.loadGame('quick');G.mode='world';G.modal=false;t.hidePanel();Kit.goTo(-999,-999);t.Systems.frame(.01,.01);ok(t.goodN('water')===0,'a loaded game keeps what it saved: no free fill')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
