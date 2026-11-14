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
 {const keep=P.troops;try{P.troops={hum_spear:ham.T.quarter+4};const why=t.stayWhy(ham);P.troops={};const alone=t.roomFor(ham,t.partySize());ok(/no room for/.test(why)&&!alone,'your army too: '+why+'; alone, there is room')}finally{P.troops=keep}}
 // ---- a lord resting outside a holding with no room: his camp by its gate, in your sight
 {const l=W.lords.find(x=>!x.dead),keep={...l};try{const g=t.gateGoal(ham);Object.assign(l,{x:g.x,y:g.y,inside:null,fight:null,state:'rest',tgt:ham.name,troops:Array(ham.T.quarter+5).fill('hum_spear')});Kit.goTo(g.x+30,g.y+20);
   const ents=[];t.GateFile.camps(ents,{x:0,y:0},t.vis());ok(ents.length===1&&typeof ents[0].f==='function','resting outside '+ham.name+', his camp is pitched by its gate')}finally{Object.assign(l,keep)}}
 // ---- an army you see going in files in at the gate; coming out, it leaves by the gate
 {const l=W.lords.find(x=>!x.dead),keep={...l};try{const g=t.gateGoal(big);Kit.goTo(g.x+40,g.y+30);if(l.inside)l.leave();Object.assign(l,{x:g.x+30,y:g.y+28,inside:null,fight:null,fac:big.owner||l.fac,troops:Array(12).fill('hum_spear')});
   for(let i=0;i<30;i++)t.updateWorld(1/30);const a=t.marchLive(l),n=a?a.units.filter(u=>!u.dead).length:0;t.GateFile.list=[];l.enter(big);const F=t.GateFile.list[0];
   ok(n>0&&F&&F.men.length===Math.min(n,t.GATE_FILE.most)&&F.men.every((u,i)=>!i||u.wait>F.men[i-1].wait-1e-9),'going in, its '+n+' men file in at the gate, the nearest first, a man every '+t.GATE_FILE.gap+' s');
   const d0=F.men.at(-1)&&Math.hypot(F.men.at(-1).x-F.g.x,F.men.at(-1).y-F.g.y);let k=0;while(t.GateFile.list.length&&k++<400)t.GateFile.step(1/30);ok(!t.GateFile.list.length&&k>20,'each walks to the gate and is gone there (all in after '+(k/30).toFixed(1)+' s; the last '+Math.round(d0)+' px off)');
   const ents=[];t.GateFile.list=[{o:l,g:F.g,men:[{...F.men[0]||{},x:F.g.x+4,y:F.g.y,gone:false,wait:0}],t:0}];t.GateFile.draw(ents,{x:0,y:0});ok(ents.length===1,'drawn among the figures by his feet, fading at the gate');t.GateFile.list=[];
   l.leave();const b=t.marchLive(l)||t.MARCH_ARMIES.get(l);ok(!b||b.units.every(u=>Math.hypot(u.x-F.g.x,u.y-F.g.y)<12),'coming out, its men start at the gate, to walk out to their places')}finally{Object.assign(l,keep);t.GateFile.list=[]}}
 // ---- a fish's leap among the figures; a boat's crew in it
 {const L=t.AMBV.list,keep=L.slice();try{t.AMBIENT.on=true;L.length=0;L.push({k:'fish',x:P.x,y:P.y,t:.1,life:1.2});const ents=[];t.ambientWorld(ents,{x:Math.floor(P.x-100),y:Math.floor(P.y-60)},t.vis());
   ok(ents.some(e=>e.nf&&Math.abs(e.y-P.y)<2),'a fish\'s leap is drawn among the figures by its water (what stands before it covers it)')}finally{L.length=0;L.push(...keep);t.AMBIENT.on=false}}
 {const s=t.shipSprite({seed:1}),h=s.hi;ok(!!h&&h.width===s.width*Math.round(h.width/s.width),'a fishing boat painted at the figures\' density ('+(h?h.width:0)+' px across, the map\'s '+s.width+')')}
});
