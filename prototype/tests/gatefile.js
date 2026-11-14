'use strict';
// Through the gate (the owner, 2026-11-14; world/gatefile.js, data/holdings.js quarter): a holding quarters at most its kind's men
// (a hamlet's few, a castle's many), an army with more stays outside, a lord's camped by the gate; an army you see going in files
// in at the gate, a man after another, and comes out of it the same; a fish's leap is among the figures by its water (gfx/ambient.js);
// a boat's crew sits in it (world/ships.js).
Kit.suite(({ok,info})=>{const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.world();G.quietEvents=true;G.encCool=1e9;t.WORLD_BATTLE.on=true;
 const H=t.HOLDING_TYPES;ok(['hamlet','village','town','city','fort','castle'].every(k=>H[k].quarter>0)&&H.hamlet.quarter<H.village.quarter&&H.village.quarter<H.town.quarter&&H.town.quarter<H.castle.quarter,'every kind quarters so many men: hamlet '+H.hamlet.quarter+', village '+H.village.quarter+', town '+H.town.quarter+', castle '+H.castle.quarter+', city '+H.city.quarter);
 const ham=t.TOWNS.find(h=>h.kind==='hamlet'||h.kind==='village'),big=t.TOWNS.find(h=>h.kind==='castle'||h.kind==='city');
 {const l=W.lords.find(x=>!x.dead),keep=l.troops;try{const f=l.fac,o=ham.owner;ham.owner=f;l.troops=Array(ham.T.quarter+5).fill('hum_spear');const why=l.shelterWhy(ham);l.troops=Array(Math.max(1,ham.T.quarter-1)).fill('hum_spear');const few=l.shelterWhy(ham);ham.owner=o;
   ok(/no room for/.test(why)&&!few,'a lord with '+(ham.T.quarter+5)+' men finds no room in '+ham.name+' ("'+why+'"); with fewer he is quartered')}finally{l.troops=keep}}
 // ---- yours too big for it (the owner: "add auto camp near holding for exceed case"): you stay, your army camped by the gate
 {const keep=P.troops,g0=P.gold,sf=t.standingAt;try{P.troops={hum_spear:ham.T.quarter+4};P.gold=500;window.standingAt=()=>0;const n=t.partySize(),why=t.stayWhy(ham),cost=t.stayCost(ham);
   ok(!why&&t.stayOut(ham)&&cost===t.STAY_BASE&&/camped by its gate/.test(t.stayTerms(ham)),'your '+n+' men, too many for '+ham.name+': you may stay all the same, '+t.stayTerms(ham));
   ok(t.startStay(ham)&&P.stay.camp&&Math.hypot(P.stay.camp.x-ham.x,P.stay.camp.y-ham.y-12)<t.CAMP_SITE.spot.r*t.CAMP_SITE.spot.step+30&&Math.hypot(P.stay.camp.x-ham.x,P.stay.camp.y-ham.y)>12&&G.msgs.some(m=>/pitch camp by its gate/.test(m.m)),'staying: your army pitches camp by its gate ('+(P.stay.camp?Math.round(Math.hypot(P.stay.camp.x-ham.x,P.stay.camp.y-ham.y)):'-')+' px from its middle), you take a bed inside');
   const E=[];t.stayCampEnts(E,{x:0,y:0});const e=E[0];ok(E.length>=2&&typeof e.f==='function'&&t.stayCost()===t.STAY_BASE,'its camp drawn on the map, the inn charging for you alone ('+t.STAY_BASE+'g)');
   t.leaveStay();P.troops={};ok(!t.stayOut(ham)&&!t.stayWhy(ham),'alone, your band fits inside: no camp')}finally{P.troops=keep;P.gold=g0;window.standingAt=sf;P.stay=null}}
 // ---- a companion's party told to stay where there is no room: it camps by the gate
 {P.comps={brann:{ap:0,role:''}};const C=Object.setPrototypeOf({cid:'brann',troops:Array(ham.T.quarter+3).fill('hum_spear'),x:ham.x,y:ham.y+12,order:'stay',base:ham.name},t.CompanionParty.prototype);
  if(C){C.enter(ham);ok(C.campOut===ham.name&&!C.inside,'a companion\'s party of '+C.troops.length+' told to stay there camps by its gate, not inside')}else ok(false,'fixture: a companion party')}
 // ---- a lord resting outside a holding with no room: his camp by its gate, in your sight
 {const l=W.lords.find(x=>!x.dead),keep={...l};try{const g=t.gateGoal(ham);Object.assign(l,{x:g.x,y:g.y,inside:null,fight:null,state:'rest',tgt:ham.name,troops:Array(ham.T.quarter+5).fill('hum_spear')});Kit.goTo(g.x+30,g.y+20);
   const ents=[];t.GateFile.camps(ents,{x:0,y:0},t.vis());ok(ents.length>=2&&ents.every(e=>typeof e.f==='function'),'resting outside '+ham.name+', his camp is pitched by its gate ('+ents.length+' pieces: tents for '+(ham.T.quarter+5)+' men and the fire)')}finally{Object.assign(l,keep)}}
 // ---- an army you see going in files in at the gate; coming out, it leaves by the gate
 {const l=W.lords.find(x=>!x.dead),keep={...l};try{const g=t.gateGoal(big);Kit.goTo(g.x+40,g.y+30);if(l.inside)l.leave();Object.assign(l,{x:g.x+30,y:g.y+28,inside:null,fight:null,fac:big.owner||l.fac,troops:Array(12).fill('hum_spear')});
   for(let i=0;i<30;i++)t.updateWorld(1/30);const a=t.marchLive(l),n=a?a.units.filter(u=>!u.dead).length:0;t.GateFile.list=[];l.enter(big);const F=t.GateFile.list[0];
   ok(n>0&&F&&F.men.length===Math.min(n,t.GATE_FILE.most)&&F.men.every((u,i)=>!i||u.wait>F.men[i-1].wait-1e-9),'going in, its '+n+' men file in at the gate, the nearest first, a man every '+t.GATE_FILE.gap+' s');
   const d0=F.men.at(-1)&&Math.hypot(F.men.at(-1).x-F.g.x,F.men.at(-1).y-F.g.y);let k=0;while(t.GateFile.list.length&&k++<400)t.GateFile.step(1/30);ok(!t.GateFile.list.length&&k>20,'each walks to the gate and is gone there (all in after '+(k/30).toFixed(1)+' s; the last '+Math.round(d0)+' px off)');
   const ents=[];t.GateFile.list=[{o:l,g:F.g,men:[{...F.men[0]||{},x:F.g.x+4,y:F.g.y,gone:false,wait:0}],t:0}];t.GateFile.draw(ents,{x:0,y:0});ok(ents.length===1,'drawn among the figures by his feet, fading at the gate');t.GateFile.list=[];
   l.leave();const b=t.marchLive(l)||t.MARCH_ARMIES.get(l);ok(!!b&&b.units.every(u=>Math.hypot(u.x-F.g.x,u.y-F.g.y)<12)&&b.units.filter(u=>u.gateAt).length===b.units.length-1,'coming out, its men start at the gate, all but the first waiting their turn there, unseen');
   {const w0=b.units.filter(u=>u.gateAt).length;for(let i=0;i<40;i++)b.step(1/30);const w1=b.units.filter(u=>u.gateAt).length,out=b.units.filter(u=>!u.gateAt&&Math.hypot(u.x-F.g.x,u.y-F.g.y)>3).length;ok(w1<w0&&out>0,'and step out one after another ('+(w0-w1)+' more out after 1.3 s, '+out+' walked off from the gate)')}}finally{Object.assign(l,keep);t.GateFile.list=[]}}
 // ---- a camp as big as its army, every tent off the roads, pitched one after another (world/campsite.js)
 {const C=t.CampSite,X=t.CAMP_SITE;ok(C.tents(5)===1&&C.tents(40)===5&&C.tents(400)===X.most,'a tent for every '+X.men+' men: 5 men 1, 40 men 5, 400 men '+X.most+' (the most)');
  const s=C.spotNear(big,80),L=s&&C.place(s.x,s.y,C.tents(80)),onRoad=L?L.filter(p=>t.tAt(Math.floor(p.x/16),Math.floor(p.y/16))===t.T_ROAD||(t.RoadBand.at(p.x,p.y)&63)>=X.road*63).length:-1;
  ok(!!s&&L.length>=Math.ceil(C.tents(80)*X.spot.need)&&!onRoad&&L.every(p=>C.tentOk(p.x,p.y)),'by '+big.name+', 80 men camp where '+(L?L.length:0)+' of their '+C.tents(80)+' tents stand, none on a road or track, each on fit ground');
  C.strike('zz');const E0=[];C.draw(E0,{x:0,y:0},{key:'zz',x:s.x,y:s.y,n:80});C.pitch('zz');const E1=[];C.draw(E1,{x:0,y:0},{key:'zz',x:s.x,y:s.y,n:80});C.t0.set('zz',performance.now()/1000-X.gap*2.5);const E2=[];C.draw(E2,{x:0,y:0},{key:'zz',x:s.x,y:s.y,n:80});
  ok(E0.length===L.length+1&&E1.length<=2&&E2.length===1+3&&C.pitching('zz',80),'never seen pitched: it stands ('+E0.length+' pieces); pitched now: its fire and banner first, then a tent every '+X.gap+' s (3 up after '+(X.gap*2.5).toFixed(1)+' s)');C.strike('zz')}
 // ---- a fish's leap among the figures; a boat's crew in it
 {const L=t.AMBV.list,keep=L.slice();try{t.AMBIENT.on=true;L.length=0;L.push({k:'fish',x:P.x,y:P.y,t:.1,life:1.2});const ents=[];t.ambientWorld(ents,{x:Math.floor(P.x-100),y:Math.floor(P.y-60)},t.vis());
   ok(ents.some(e=>e.nf&&Math.abs(e.y-P.y)<2),'a fish\'s leap is drawn among the figures by its water (what stands before it covers it)')}finally{L.length=0;L.push(...keep);t.AMBIENT.on=false}}
 {const s=t.shipSprite({seed:1}),h=s.hi;ok(!!h&&h.width===s.width*Math.round(h.width/s.width),'a fishing boat painted at the figures\' density ('+(h?h.width:0)+' px across, the map\'s '+s.width+')')}
});
