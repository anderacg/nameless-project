'use strict';
// The holdings factory (doc/WORLD_DESIGN.md R4): places.js is data only, and every holding is made by makeHolding (its kind,
// prices and point), the classic world through setHoldings and setCamps, exactly as the page made it before. Your people's
// capital and where you start come from capitalOf and startHolding; a companion waits in their town or their people's capital.
// While the world runs, addHolding adds a holding at the end of TOWNS under a unique name, and a lost one is marked gone, never
// taken out, so indices into TOWNS (LAND) hold. Every kind has its tier and the kinds it may grow into.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,TOWNS=t.TOWNS,TILE=t.TILE,MW=t.MW,MH=t.MH,J=x=>JSON.stringify(x);try{localStorage.clear()}catch(e){}
 const CP=t.CLASSIC_PLACES,CC=t.CLASSIC_CAMPS,cp0=J(CP),cc0=J(CC);
 // the data stays data
 ok(CP.length===37&&CP.every(d=>Object.getPrototypeOf(d)===Object.prototype&&t.FACS[d.realm]&&d.x==null&&!(d.mod&&d.mod.meat!=null)),'the 37 classic places are plain data, each with its realm (no class, point or prices made onto them)');
 // (the places the world in use was made from: today's map, the classic places; the generated classic world, the same at the
 // tiles its generator found for them)
 const SRC=t.WM.gen==='classic-0'?CP:t.genWorld(t.classicSettings()).holdings,made=SRC.map(d=>t.makeHolding(d));
 // (the page's holdings have been through main.js's initWorld since: compare what makeHolding makes)
 const keysOf=h=>Object.keys(h).concat(...Object.values(h).filter(v=>v&&typeof v==='object'&&!Array.isArray(v)).map(Object.keys));
 ok(made.every((h,i)=>JSON.stringify(h,keysOf(h))===JSON.stringify(TOWNS[i],keysOf(h))&&Object.getPrototypeOf(h)===Object.getPrototypeOf(TOWNS[i])&&h!==TOWNS[i]),'makeHolding makes each the very holding the page loaded: its kind, its prices, its point');
 ok(J(CP)===cp0,'and leaves the data as it was');
 ok(TOWNS.every((h,i)=>!('realm' in h)&&t.HOME[h.name]===CP[i].realm),'a place\'s realm goes into HOME, not onto the holding');
 {const a=t.townBy('Ashford'),k=t.townBy('Karn Hold'),e=t.townBy('Elderglen');
  const A=SRC.find(d=>d.name==='Ashford');
  ok(a.x===A.tx*TILE&&a.y===(A.ty+1)*TILE+2&&k.mod.bolts===.7&&e.mod.arrows===.7&&a.mod.arrows===1.1&&typeof a.mod.cheese==='number','points at the gate, arrows cheap among elves, bolts among dwarves, food by who lives there')}
 ok(t.CAMP_SPOTS.length===CC.length&&t.CAMP_SPOTS.every((c,i)=>c!==CC[i]&&c.x===(c.tx+.5)*TILE&&c.y===(c.ty+.5)*TILE)&&J(CC)===cc0,'the bandit camps are copies of the classic spots (the map moves the copies, never the data)');
 ok([...TOWNS,...t.CAMP_SPOTS].every(z=>t.passable(t.tAt(z.tx,z.ty))),'every holding and camp stands on ground the map cleared (genClassic reads its own lists)');
 // tiers
 {const HT=t.HOLDING_TYPES,K=Object.keys(HT);
  ok(K.every(k=>Number.isInteger(HT[k].tier)&&HT[k].tier>=0&&HT[k].tier<=4&&Array.isArray(HT[k].next)&&HT[k].next.every(n=>HT[n]&&HT[n].tier===HT[k].tier+1)),'every kind has a tier (0-4) and grows only into kinds one tier up');
  ok(HT.village.tier===2&&HT.town.tier===3&&HT.city.tier===4&&HT.castle.tier===4&&J(HT.village.next)==='["town"]'&&J(HT.town.next)==='["city","castle"]'&&!HT.city.next.length&&!HT.castle.next.length,'village 2 → town 3 → city or castle 4')}
 // capitals and the start
 {const cap={human:'Ashford',dwarf:'Karn Hold',elf:'Elderglen',orc:'Sunreach'};// (START_TOWN, before capitalOf)
  ok(Object.keys(cap).every(r=>t.capitalOf(r)&&t.capitalOf(r)===t.townBy(cap[r])),'each people\'s capital is the city their own realm starts with ('+Object.keys(cap).map(r=>t.capitalOf(r).name).join(', ')+')')}
 ok(t.startHolding()===TOWNS[0]&&t.capitalOf('nobody')===t.startHolding(),'a people with no realm start where everyone does by default');
 ok(Object.keys(t.COMPS).every(id=>t.compTown(id)===t.townBy(t.COMPS[id].town)),'each companion waits in their own town');
 {const c=t.COMPS.brann,tw=c.town;c.town='Nowhere';const h=t.compTown('brann');c.town=tw;ok(h&&h===t.capitalOf(c.race),'in a world without it, in their people\'s capital ('+(h&&h.name)+')')}
 // the running world: a holding added, then lost
 t.act('begin','soldier');G.quietEvents=true;
 const n0=TOWNS.length,names=TOWNS.map(h=>h.name),own0=TOWNS.map(z=>{t.landFresh();return t.LAND[z.ty*MW+z.tx]});
 let spot=null;for(let y=8;y<MH-8&&!spot;y++)for(let x=8;x<MW-8&&!spot;x++){let clear=true;for(let j=-4;j<=4&&clear;j++)for(let i=-4;i<=4;i++)if(t.tAt(x+i,y+j)!==t.T_OPEN){clear=false;break}
   if(clear&&[...TOWNS,...t.CAMP_SPOTS].every(z=>Math.hypot(z.tx-x,z.ty-y)>=24))spot=[x,y]}
 ok(!!spot,'there is open land far from every holding to found on'+(spot?' ('+spot+')':''));
 if(spot){const seen=[];t.onHolding((h,why)=>seen.push(why+':'+h.name));
  const h=t.addHolding({name:'Ashford',races:['human'],kind:'village',clim:'grass',tx:spot[0],ty:spot[1],note:'A test holding.'});
  ok(h.name==='Ashford 2'&&TOWNS.length===n0+1&&TOWNS[n0]===h&&names.every((n,i)=>TOWNS[i].name===n),'a holding made at runtime takes a unique name ('+h.name+') and goes at the end: every index into TOWNS stays');
  ok(h instanceof t.Village&&h.owner==='player'&&t.HOME[h.name]==='player'&&h.x===spot[0]*TILE&&h.gar===h.T.gar&&h.grow===t.GROW0&&!!h.stock&&!!h.bld&&typeof h.seed==='number'&&TOWNS.every(z=>z===h||z.seed!==h.seed),'it is a village of yours with its own seed, set up as the rest were at the start');
  ok(!!t.lotCentre(h)&&t.lotOf(h.tx,h.ty)===t.lotCentre(h),'its centre building stands on its tile');
  ok(t.landOf(h)>0&&TOWNS.slice(0,n0).every((z,i)=>t.LAND[z.ty*MW+z.tx]===own0[i]),'it rules land of its own, and the rest keep theirs under the same indices ('+t.landOf(h)+' tiles)');
  ok(J(seen)==='["add:Ashford 2"]','territory and lots are told it was added');
  const i=TOWNS.indexOf(h),c=t.lotCentre(h);t.loseHolding(h);t.loseHolding(h);
  ok(h.gone===true&&h.owner===null&&TOWNS.length===n0+1&&TOWNS[i]===h&&!h.lots.length&&!t.lotOf(c.x,c.y),'a lost holding is marked gone and never taken out (its index holds); it is no one\'s, its lots cleared');
  ok(!t.fiefsOf('player').includes(h)&&J(seen)==='["add:Ashford 2","gone:Ashford 2"]','it is no longer yours, and they are told once that it is gone')}
 // a world's holdings, made again in place
 {const keep=TOWNS.slice();t.setHoldings(SRC);
  ok(t.TOWNS===TOWNS&&TOWNS.length===37&&TOWNS.every((z,i)=>J(z)===J(made[i])&&z!==keep[i])&&!('Ashford 2' in t.HOME)&&t.HOME.Ashford==='vale','setHoldings fills TOWNS in place with fresh holdings from the data, and HOME with their realms alone')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
